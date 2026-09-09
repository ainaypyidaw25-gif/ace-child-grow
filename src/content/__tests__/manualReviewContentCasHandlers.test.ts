import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../convex/lib/aiAuditHash', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../convex/lib/aiAuditHash')>();
  return {
    ...actual,
    sha256Canonical: vi.fn(async (value: unknown) => {
      const row = value as { __exactCanonicalSha256?: string };
      return row.__exactCanonicalSha256 ?? await actual.sha256Canonical(value);
    }),
  };
});

import { apply, preflight } from '../../../convex/manualReviewContentCas';
import {
  MANUAL_REVIEW_CONTENT_CAS_RELEASE_ID,
  MANUAL_REVIEW_CONTENT_TARGETS,
} from '../../../convex/lib/manualReviewContentCasData';

type Row = Record<string, unknown>;

function registeredHandler(fn: unknown) {
  return (fn as {
    _handler: (ctx: unknown, args: Record<string, unknown>) => Promise<unknown>;
  })._handler;
}

function exactContext() {
  const contentRows: Row[] = MANUAL_REVIEW_CONTENT_TARGETS.map((target) => ({
    _id: target.contentId,
    _creationTime: target.contentCreationTime,
    type: target.type,
    slug: target.slug,
    titleMm: `MM ${target.slug}`,
    titleEn: `EN ${target.slug}`,
    summaryMm: `MM summary ${target.slug}`,
    summaryEn: `EN summary ${target.slug}`,
    tags: ['manual-review'],
    data: {
      body: { mm: 'old body', en: 'old body' },
      commonMistakes: [{ mm: 'old', en: 'old' }],
      safety: { mm: 'old safety', en: 'old safety' },
    },
    source: 'test',
    version: 1,
    clinicalStatus: 'clinical_review',
    reviewRevision: target.initialReviewRevision,
    updatedAt: target.initialUpdatedAt,
    __exactCanonicalSha256: target.initialCanonicalSha256,
  }));
  const tables: Record<string, Row[]> = {
    libraryContent: contentRows,
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
    const id = `${table}:manual-review:${++inserted}`;
    const row = { ...value, _id: id, _creationTime: 2 };
    tables[table] ??= [];
    tables[table].push(row);
    byId.set(id, row);
    return id;
  });
  const patch = vi.fn(async (id: string, value: Row) => {
    const row = byId.get(id);
    if (!row) throw new Error(`missing mock row: ${id}`);
    delete row.__exactCanonicalSha256;
    for (const [key, next] of Object.entries(value)) {
      if (next === undefined) delete row[key];
      else row[key] = next;
    }
  });
  const get = vi.fn(async (id: string) => byId.get(id) ?? null);
  return {
    ctx: { db: { query, insert, patch, get } },
    tables,
    patch,
    insert,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('manual-review content exact CAS handlers', () => {
  it('reports the exact Production preimages as ready', async () => {
    const state = exactContext();
    const result = await registeredHandler(preflight)(state.ctx, {
      releaseId: MANUAL_REVIEW_CONTENT_CAS_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(result).toMatchObject({
      phase: 'ready',
      targetCount: 8,
      initialMatchCount: 8,
      desiredMatchCount: 0,
      releaseAuditRows: 0,
      blockers: [],
    });
  });

  it.each([
    ['content hash', (state: ReturnType<typeof exactContext>) => {
      state.tables.libraryContent[0].__exactCanonicalSha256 = '0'.repeat(64);
    }],
    ['duplicate content', (state: ReturnType<typeof exactContext>) => {
      state.tables.libraryContent.push({ ...state.tables.libraryContent[0], _id: 'duplicate' });
    }],
    ['AI pointer', (state: ReturnType<typeof exactContext>) => {
      state.tables.libraryContent[0].aiPublicationReleaseId = 'unexpected';
    }],
    ['AI release', (state: ReturnType<typeof exactContext>) => {
      state.tables.aiPublicationReleases.push({
        _id: 'ai:unexpected',
        targetKey: `${MANUAL_REVIEW_CONTENT_TARGETS[0].type}:${MANUAL_REVIEW_CONTENT_TARGETS[0].slug}`,
      });
    }],
    ['revision drift', (state: ReturnType<typeof exactContext>) => {
      state.tables.libraryContent[0].reviewRevision = 99;
    }],
  ] as const)('fails before every write on %s', async (_name, mutate) => {
    const state = exactContext();
    mutate(state);
    await expect(registeredHandler(apply)(state.ctx, {
      releaseId: MANUAL_REVIEW_CONTENT_CAS_RELEASE_ID,
    })).rejects.toThrow(/preflight blocked/);
    expect(state.patch).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalled();
  });

  it('atomically patches only accepted fields and replays idempotently', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_315_200_000);
    const state = exactContext();
    const result = await registeredHandler(apply)(state.ctx, {
      releaseId: MANUAL_REVIEW_CONTENT_CAS_RELEASE_ID,
    }) as Record<string, unknown>;

    expect(result).toMatchObject({
      applied: true,
      alreadyApplied: false,
      contentUpdated: 8,
      evidenceLinksChanged: 0,
      publicationDecisionsMade: 0,
      updatedAt: 1_787_315_200_000,
    });
    expect(state.patch).toHaveBeenCalledTimes(8);
    expect(state.tables.auditLogs).toHaveLength(1);

    for (const target of MANUAL_REVIEW_CONTENT_TARGETS) {
      const row = state.tables.libraryContent.find((candidate) => candidate.slug === target.slug);
      expect(row).toMatchObject({
        clinicalStatus: 'clinical_review',
        reviewRevision: target.desiredReviewRevision,
        updatedAt: 1_787_315_200_000,
      });
      expect(row?.reviewerId).toBeUndefined();
      expect(row?.aiPublicationReleaseId).toBeUndefined();
      const data = row?.data as Record<string, unknown>;
      for (const accepted of target.patches) expect(data[accepted.field]).toEqual(accepted.value);
    }

    const patchCalls = state.patch.mock.calls.length;
    const insertCalls = state.insert.mock.calls.length;
    const replay = await registeredHandler(apply)(state.ctx, {
      releaseId: MANUAL_REVIEW_CONTENT_CAS_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(replay).toMatchObject({
      applied: false,
      alreadyApplied: true,
      contentUpdated: 0,
      updatedAt: 1_787_315_200_000,
    });
    expect(state.patch).toHaveBeenCalledTimes(patchCalls);
    expect(state.insert).toHaveBeenCalledTimes(insertCalls);
  });

  it('blocks replay when an audited postimage drifts', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_315_200_000);
    const state = exactContext();
    await registeredHandler(apply)(state.ctx, {
      releaseId: MANUAL_REVIEW_CONTENT_CAS_RELEASE_ID,
    });
    const first = state.tables.libraryContent[0];
    first.data = { ...(first.data as Row), safety: { mm: 'drift', en: 'drift' } };
    await expect(registeredHandler(apply)(state.ctx, {
      releaseId: MANUAL_REVIEW_CONTENT_CAS_RELEASE_ID,
    })).rejects.toThrow(/preflight blocked/);
  });
});
