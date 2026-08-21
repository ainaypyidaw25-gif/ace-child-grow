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

import { apply, preflight } from '../../../convex/swaimanSeizureLinkCas';
import {
  SWAIMAN_SEIZURE_EXACT_SOURCE_ROWS,
  SWAIMAN_SEIZURE_LINK_CAS_RELEASE_ID,
  SWAIMAN_SEIZURE_LINK_CAS_TARGET,
  SWAIMAN_SEIZURE_SOURCE_PREIMAGES,
} from '../../../convex/lib/swaimanSeizureLinkCasData';

type Row = Record<string, unknown>;

function registeredHandler(fn: unknown) {
  return (fn as {
    _handler: (ctx: unknown, args: Record<string, unknown>) => Promise<unknown>;
  })._handler;
}

function exactContext() {
  const exactRowsById = new Map(SWAIMAN_SEIZURE_EXACT_SOURCE_ROWS.map(
    (row) => [String(row.sourceId), row],
  ));
  const tables: Record<string, Row[]> = {
    evidenceLinks: [{
      _id: SWAIMAN_SEIZURE_LINK_CAS_TARGET.linkId,
      _creationTime: SWAIMAN_SEIZURE_LINK_CAS_TARGET.creationTime,
      kind: SWAIMAN_SEIZURE_LINK_CAS_TARGET.kind,
      slug: SWAIMAN_SEIZURE_LINK_CAS_TARGET.slug,
      sourceIds: [...SWAIMAN_SEIZURE_LINK_CAS_TARGET.initialSourceIds],
      createdAt: SWAIMAN_SEIZURE_LINK_CAS_TARGET.createdAt,
      updatedAt: SWAIMAN_SEIZURE_LINK_CAS_TARGET.initialUpdatedAt,
    }],
    evidenceSources: SWAIMAN_SEIZURE_SOURCE_PREIMAGES.map((expected) => ({
      ...structuredClone(exactRowsById.get(expected.sourceId)!),
      __exactCanonicalSha256: expected.exactCanonicalSha256,
    })),
    libraryContent: [],
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
    const id = `${table}:swaiman-seizure:${++inserted}`;
    const row = { ...value, _id: id, _creationTime: 2 };
    tables[table] ??= [];
    tables[table].push(row);
    byId.set(id, row);
    return id;
  });
  const patch = vi.fn(async (id: string, value: Row) => {
    const row = byId.get(id);
    if (!row) throw new Error(`missing mock row: ${id}`);
    for (const [key, next] of Object.entries(value)) {
      if (next === undefined) delete row[key];
      else row[key] = next;
    }
  });
  return { ctx: { db: { query, insert, patch } }, tables, patch, insert };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Swaiman seizure-link exact CAS handlers', () => {
  it('reports the frozen Production state as ready', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_315_200_000);
    const state = exactContext();
    const result = await registeredHandler(preflight)(state.ctx, {
      releaseId: SWAIMAN_SEIZURE_LINK_CAS_RELEASE_ID,
    }) as {
      phase: string;
      blockers: string[];
      target: {
        initialMatches: boolean;
        citationEligible: boolean;
        eligibleDesiredSourceIds: string[];
      };
      sources: Array<{ exact: boolean }>;
    };
    expect(result.phase).toBe('ready');
    expect(result.blockers).toEqual([]);
    expect(result.target).toMatchObject({
      initialMatches: true,
      citationEligible: true,
      eligibleDesiredSourceIds: ['nhs-sids-2025', 'nice-ng143-fever-2019'],
    });
    expect(result.sources).toHaveLength(5);
    expect(result.sources.every((source) => source.exact)).toBe(true);
  });

  it.each([
    ['ordered link array', (state: ReturnType<typeof exactContext>) => {
      state.tables.evidenceLinks[0].sourceIds = ['tampered-source'];
    }],
    ['link identity', (state: ReturnType<typeof exactContext>) => {
      state.tables.evidenceLinks[0].createdAt = 1;
    }],
    ['duplicate link', (state: ReturnType<typeof exactContext>) => {
      state.tables.evidenceLinks.push({
        ...structuredClone(state.tables.evidenceLinks[0]),
        _id: 'link:duplicate',
      });
    }],
    ['duplicate source', (state: ReturnType<typeof exactContext>) => {
      state.tables.evidenceSources.push({
        ...structuredClone(state.tables.evidenceSources[0]),
        _id: 'source:duplicate',
      });
    }],
    ['full source hash', (state: ReturnType<typeof exactContext>) => {
      state.tables.evidenceSources[0].__exactCanonicalSha256 = '0'.repeat(64);
    }],
    ['eligible desired set', (state: ReturnType<typeof exactContext>) => {
      const source = state.tables.evidenceSources.find(
        (row) => row.sourceId === 'nhs-sids-2025',
      )!;
      source.nextReviewDate = '2026-08-20';
    }],
    ['inherent-public assumption', (state: ReturnType<typeof exactContext>) => {
      state.tables.libraryContent.push({ slug: 'seizure' });
    }],
  ] as const)('fails before every write on %s drift', async (_name, mutate) => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_315_200_000);
    const state = exactContext();
    mutate(state);
    await expect(registeredHandler(apply)(state.ctx, {
      releaseId: SWAIMAN_SEIZURE_LINK_CAS_RELEASE_ID,
    })).rejects.toThrow(/preflight blocked/);
    expect(state.patch).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalled();
  });

  it('atomically removes only Swaiman, preserves sources, audits and replays', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_315_200_000);
    const state = exactContext();
    const initialSources = structuredClone(state.tables.evidenceSources);
    const result = await registeredHandler(apply)(state.ctx, {
      releaseId: SWAIMAN_SEIZURE_LINK_CAS_RELEASE_ID,
    }) as Record<string, unknown>;

    expect(result).toMatchObject({
      applied: true,
      alreadyApplied: false,
      linksUpdated: 1,
      sourcesPreserved: 5,
      citationsEligible: true,
      updatedAt: 1_787_315_200_000,
    });
    expect(state.tables.evidenceLinks[0]).toMatchObject({
      sourceIds: SWAIMAN_SEIZURE_LINK_CAS_TARGET.desiredSourceIds,
      updatedAt: 1_787_315_200_000,
    });
    expect(state.tables.evidenceSources).toEqual(initialSources);
    expect(state.tables.auditLogs).toHaveLength(1);
    expect(state.tables.auditLogs[0]).toMatchObject({
      action: 'release.swaiman_seizure_redundant_unlink',
      entityTable: 'evidenceLinks',
      summary: SWAIMAN_SEIZURE_LINK_CAS_RELEASE_ID,
      result: 'ok',
    });
    expect(String(state.tables.auditLogs[0].after)).toContain(
      'e7e32c9cbadc667802a8ece85437b3e201d64e0c0d56d825be50222e55ebbc11',
    );

    const patchCalls = state.patch.mock.calls.length;
    const insertCalls = state.insert.mock.calls.length;
    const replay = await registeredHandler(apply)(state.ctx, {
      releaseId: SWAIMAN_SEIZURE_LINK_CAS_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(replay).toMatchObject({
      applied: false,
      alreadyApplied: true,
      linksUpdated: 0,
      citationsEligible: true,
      updatedAt: 1_787_315_200_000,
    });
    expect(state.patch).toHaveBeenCalledTimes(patchCalls);
    expect(state.insert).toHaveBeenCalledTimes(insertCalls);
  });

  it.each([
    ['desired array', (state: ReturnType<typeof exactContext>) => {
      state.tables.evidenceLinks[0].sourceIds = ['post-release-drift'];
    }],
    ['postimage timestamp', (state: ReturnType<typeof exactContext>) => {
      state.tables.evidenceLinks[0].updatedAt = 1;
    }],
    ['audit payload', (state: ReturnType<typeof exactContext>) => {
      state.tables.auditLogs[0].after = '{}';
    }],
    ['duplicate audit', (state: ReturnType<typeof exactContext>) => {
      state.tables.auditLogs.push({
        ...structuredClone(state.tables.auditLogs[0]),
        _id: 'audit:duplicate',
      });
    }],
  ] as const)('blocks idempotent replay when %s drifts', async (_name, mutate) => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_315_200_000);
    const state = exactContext();
    await registeredHandler(apply)(state.ctx, {
      releaseId: SWAIMAN_SEIZURE_LINK_CAS_RELEASE_ID,
    });
    mutate(state);
    await expect(registeredHandler(apply)(state.ctx, {
      releaseId: SWAIMAN_SEIZURE_LINK_CAS_RELEASE_ID,
    })).rejects.toThrow(/preflight blocked/);
  });
});
