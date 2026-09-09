import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../convex/lib/aiAuditHash', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../convex/lib/aiAuditHash')>();
  return {
    ...actual,
    sha256Canonical: vi.fn(async (value: unknown) => {
      if (Array.isArray(value)
        && value.every((row) => typeof row === 'object' && row !== null && '__reviewFixture' in row)) {
        return '8b2012aee0eff2300cefdbdf646fca208d3d19c672bf0d097783e6405d98e702';
      }
      const row = value as { __exactCanonicalSha256?: string };
      return row.__exactCanonicalSha256 ?? await actual.sha256Canonical(value);
    }),
  };
});

import { apply, preflight } from '../../../convex/legacyCompletedPriorityCorrection';
import {
  LEGACY_COMPLETED_PRIORITY_CORRECTION_ACTION,
  LEGACY_COMPLETED_PRIORITY_CORRECTION_RELEASE_ID,
  LEGACY_COMPLETED_PRIORITY_CORRECTION_SOURCE_SNAPSHOT,
  LEGACY_COMPLETED_PRIORITY_CORRECTION_TARGET,
} from '../../../convex/lib/legacyCompletedPriorityCorrectionData';

type Row = Record<string, unknown>;

function registeredHandler(fn: unknown) {
  return (fn as {
    _handler: (ctx: unknown, args: Record<string, unknown>) => Promise<unknown>;
  })._handler;
}

function exactContext() {
  const target = LEGACY_COMPLETED_PRIORITY_CORRECTION_TARGET;
  const content: Row = {
    ...structuredClone(LEGACY_COMPLETED_PRIORITY_CORRECTION_SOURCE_SNAPSHOT),
    __exactCanonicalSha256: target.initialCanonicalSha256,
  };
  const reviewRows: Row[] = Array.from({ length: target.reviewRows }, (_, index) => ({
    _id: `review:${index.toString().padStart(2, '0')}`,
    _creationTime: index + 1,
    contentSlug: target.slug,
    contentVersion: index < 3 ? 2 : 1,
    reviewRevision: index < 3 ? 2 : 1,
    dimension: index % 2 === 0 ? 'evidence' : 'safety',
    decision: 'approved',
    reviewerId: `reviewer:${index}`,
    reviewerDisplayName: `Reviewer ${index}`,
    reviewerRole: 'owner',
    reviewedAt: index + 1,
    createdAt: index + 1,
    updatedAt: index + 1,
    __reviewFixture: true,
  }));
  const tables: Record<string, Row[]> = {
    libraryContent: [content],
    contentReviews: reviewRows,
    aiPublicationReleases: [],
    auditLogs: [],
  };
  const byId = new Map<string, Row>();
  for (const rows of Object.values(tables)) {
    for (const row of rows) byId.set(String(row._id), row);
  }

  const query = vi.fn((table: string) => {
    const terminal = (conditions: Array<[string, unknown]> = []) => {
      const filtered = () => (tables[table] ?? []).filter((row) => conditions.every(
        ([field, value]) => row[field] === value,
      ));
      return { take: async (count: number) => filtered().slice(0, count) };
    };
    return {
      ...terminal(),
      withIndex: (_name: string, callback: (q: {
        eq: (field: string, value: unknown) => unknown;
      }) => unknown) => {
        const conditions: Array<[string, unknown]> = [];
        const q = {
          eq: (field: string, value: unknown): unknown => {
            conditions.push([field, value]);
            return q;
          },
        };
        callback(q);
        return terminal(conditions);
      },
    };
  });

  let inserted = 0;
  const insert = vi.fn(async (table: string, value: Row) => {
    const id = `${table}:legacy-priority:${++inserted}`;
    const row = { ...value, _id: id, _creationTime: 100 + inserted };
    tables[table] ??= [];
    tables[table].push(row);
    byId.set(id, row);
    return id;
  });
  const patch = vi.fn(async (id: string, value: Row) => {
    const row = byId.get(id);
    if (!row) throw new Error(`missing mock row: ${id}`);
    delete row.__exactCanonicalSha256;
    Object.assign(row, value);
  });
  const get = vi.fn(async (id: string) => byId.get(id) ?? null);
  return { ctx: { db: { query, insert, patch, get } }, tables, patch, insert };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('legacy completed priority exact correction', () => {
  it('pins the complete Production content row with the real canonical hash', async () => {
    const actual = await vi.importActual<typeof import('../../../convex/lib/aiAuditHash')>(
      '../../../convex/lib/aiAuditHash',
    );
    expect(await actual.sha256Canonical(LEGACY_COMPLETED_PRIORITY_CORRECTION_SOURCE_SNAPSHOT))
      .toBe(LEGACY_COMPLETED_PRIORITY_CORRECTION_TARGET.initialCanonicalSha256);
  });

  it('reports the frozen Production state as ready', async () => {
    const state = exactContext();
    const result = await registeredHandler(preflight)(state.ctx, {
      releaseId: LEGACY_COMPLETED_PRIORITY_CORRECTION_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(result).toMatchObject({
      phase: 'ready',
      blockers: [],
      contentRows: 1,
      reviewRows: 9,
      aiReleaseRows: 0,
      releaseAuditRows: 0,
      initialMatches: true,
      desiredMatches: false,
      priorityStatus: 'completed',
    });
  });

  it('fails closed before writes when review history drifts', async () => {
    const state = exactContext();
    state.tables.contentReviews.pop();
    await expect(registeredHandler(apply)(state.ctx, {
      releaseId: LEGACY_COMPLETED_PRIORITY_CORRECTION_RELEASE_ID,
    })).rejects.toThrow(/preflight blocked/);
    expect(state.patch).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalled();
  });

  it('fails closed before writes on content or AI drift', async () => {
    for (const mutate of [
      (state: ReturnType<typeof exactContext>) => {
        state.tables.libraryContent[0].updatedAt = 42;
      },
      (state: ReturnType<typeof exactContext>) => {
        state.tables.aiPublicationReleases.push({
          _id: 'unexpected-ai-release',
          targetKey: `${LEGACY_COMPLETED_PRIORITY_CORRECTION_TARGET.type}:${LEGACY_COMPLETED_PRIORITY_CORRECTION_TARGET.slug}`,
        });
      },
    ]) {
      const state = exactContext();
      mutate(state);
      await expect(registeredHandler(apply)(state.ctx, {
        releaseId: LEGACY_COMPLETED_PRIORITY_CORRECTION_RELEASE_ID,
      })).rejects.toThrow(/preflight blocked/);
      expect(state.patch).not.toHaveBeenCalled();
      expect(state.insert).not.toHaveBeenCalled();
    }
  });

  it('patches only governance status and timestamp, audits, and replays idempotently', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_401_234_567);
    const state = exactContext();
    const beforeReviews = structuredClone(state.tables.contentReviews);
    const result = await registeredHandler(apply)(state.ctx, {
      releaseId: LEGACY_COMPLETED_PRIORITY_CORRECTION_RELEASE_ID,
    }) as Record<string, unknown>;

    expect(result).toMatchObject({
      applied: true,
      alreadyApplied: false,
      updatedAt: 1_787_401_234_567,
      state: { phase: 'applied', priorityStatus: 'unreviewed', blockers: [] },
    });
    expect(state.patch).toHaveBeenCalledTimes(1);
    expect(state.patch).toHaveBeenCalledWith(
      LEGACY_COMPLETED_PRIORITY_CORRECTION_TARGET.contentId,
      { priorityStatus: 'unreviewed', updatedAt: 1_787_401_234_567 },
    );
    expect(state.tables.contentReviews).toEqual(beforeReviews);
    expect(state.tables.aiPublicationReleases).toEqual([]);
    expect(state.tables.auditLogs).toHaveLength(1);
    expect(state.tables.auditLogs[0]).toMatchObject({
      action: LEGACY_COMPLETED_PRIORITY_CORRECTION_ACTION,
      entityTable: 'libraryContent',
      entityId: LEGACY_COMPLETED_PRIORITY_CORRECTION_TARGET.contentId,
      result: 'ok',
    });

    const patchCalls = state.patch.mock.calls.length;
    const insertCalls = state.insert.mock.calls.length;
    const replay = await registeredHandler(apply)(state.ctx, {
      releaseId: LEGACY_COMPLETED_PRIORITY_CORRECTION_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(replay).toMatchObject({ applied: false, alreadyApplied: true });
    expect(state.patch).toHaveBeenCalledTimes(patchCalls);
    expect(state.insert).toHaveBeenCalledTimes(insertCalls);
  });

  it('blocks replay if the audited postimage drifts', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_401_234_567);
    const state = exactContext();
    await registeredHandler(apply)(state.ctx, {
      releaseId: LEGACY_COMPLETED_PRIORITY_CORRECTION_RELEASE_ID,
    });
    state.tables.libraryContent[0].summaryEn = 'drift';
    await expect(registeredHandler(apply)(state.ctx, {
      releaseId: LEGACY_COMPLETED_PRIORITY_CORRECTION_RELEASE_ID,
    })).rejects.toThrow(/preflight blocked/);
  });
});
