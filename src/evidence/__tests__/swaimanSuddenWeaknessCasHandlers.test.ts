import { afterEach, describe, expect, it, vi } from 'vitest';
import { apply, preflight } from '../../../convex/swaimanSuddenWeaknessCas';
import {
  CDC_AFM_SOURCE_ID,
  SWAIMAN_SUDDEN_WEAKNESS_CAS_RELEASE_ID,
  SWAIMAN_SUDDEN_WEAKNESS_EXACT_SOURCE_ROWS,
  SWAIMAN_SUDDEN_WEAKNESS_SOURCE_DESIRED,
  SWAIMAN_SUDDEN_WEAKNESS_SOURCE_ID,
  SWAIMAN_SUDDEN_WEAKNESS_TARGET,
} from '../../../convex/lib/swaimanSuddenWeaknessCasData';

type Row = Record<string, unknown>;

function registeredHandler(fn: unknown) {
  return (fn as {
    _handler: (ctx: unknown, args: Record<string, unknown>) => Promise<unknown>;
  })._handler;
}

function exactContext() {
  const tables: Record<string, Row[]> = {
    evidenceLinks: [{
      _id: SWAIMAN_SUDDEN_WEAKNESS_TARGET.linkId,
      _creationTime: SWAIMAN_SUDDEN_WEAKNESS_TARGET.linkCreationTime,
      kind: SWAIMAN_SUDDEN_WEAKNESS_TARGET.kind,
      slug: SWAIMAN_SUDDEN_WEAKNESS_TARGET.slug,
      sourceIds: [...SWAIMAN_SUDDEN_WEAKNESS_TARGET.initialSourceIds],
      createdAt: SWAIMAN_SUDDEN_WEAKNESS_TARGET.linkCreatedAt,
      updatedAt: SWAIMAN_SUDDEN_WEAKNESS_TARGET.linkInitialUpdatedAt,
    }],
    evidenceSources: structuredClone(SWAIMAN_SUDDEN_WEAKNESS_EXACT_SOURCE_ROWS) as Row[],
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
    const id = `${table}:swaiman-sudden-weakness:${++inserted}`;
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
  const get = vi.fn(async (id: string) => byId.get(id) ?? null);
  return { ctx: { db: { query, insert, patch, get } }, tables, patch, insert };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Swaiman sudden-weakness exact CAS handlers', () => {
  it('reports the fresh human-reviewed Production state as ready', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_315_200_000);
    const state = exactContext();
    const result = await registeredHandler(preflight)(state.ctx, {
      releaseId: SWAIMAN_SUDDEN_WEAKNESS_CAS_RELEASE_ID,
    }) as {
      phase: string;
      blockers: string[];
      link: {
        initialMatches: boolean;
        citationEligible: boolean;
        eligibleDesiredSourceIds: string[];
      };
      reverseDependencyKeys: string[];
      sources: Array<{ sourceId: string; initialExact: boolean; eligible: boolean }>;
    };
    expect(result.phase).toBe('ready');
    expect(result.blockers).toEqual([]);
    expect(result.link).toMatchObject({
      initialMatches: true,
      citationEligible: true,
      eligibleDesiredSourceIds: [CDC_AFM_SOURCE_ID],
    });
    expect(result.reverseDependencyKeys).toEqual(['safety_rule:sudden_weakness']);
    expect(result.sources).toHaveLength(2);
    expect(result.sources.every((source) => source.initialExact)).toBe(true);
    expect(result.sources.find((source) => source.sourceId === CDC_AFM_SOURCE_ID)?.eligible)
      .toBe(true);
  });

  it.each([
    ['ordered link array', (state: ReturnType<typeof exactContext>) => {
      state.tables.evidenceLinks[0].sourceIds = [
        SWAIMAN_SUDDEN_WEAKNESS_SOURCE_ID,
        CDC_AFM_SOURCE_ID,
      ];
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
    ['full source hash', (state: ReturnType<typeof exactContext>) => {
      state.tables.evidenceSources[0].verifiedNote = 'drifted';
    }],
    ['human approval', (state: ReturnType<typeof exactContext>) => {
      const cdc = state.tables.evidenceSources.find(
        (source) => source.sourceId === CDC_AFM_SOURCE_ID,
      )!;
      cdc.reviewStatus = 'awaiting_review';
      cdc.reviewer = null;
      cdc.reviewDate = null;
    }],
    ['inherent-public assumption', (state: ReturnType<typeof exactContext>) => {
      state.tables.libraryContent.push({ slug: 'sudden_weakness' });
    }],
    ['reverse dependencies', (state: ReturnType<typeof exactContext>) => {
      state.tables.evidenceLinks.push({
        _id: 'link:extra',
        _creationTime: 1,
        kind: 'special_need',
        slug: 'unexpected',
        sourceIds: [SWAIMAN_SUDDEN_WEAKNESS_SOURCE_ID],
        createdAt: 1,
        updatedAt: 1,
      });
    }],
  ] as const)('fails before every write on %s drift', async (_name, mutate) => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_315_200_000);
    const state = exactContext();
    mutate(state);
    await expect(registeredHandler(apply)(state.ctx, {
      releaseId: SWAIMAN_SUDDEN_WEAKNESS_CAS_RELEASE_ID,
    })).rejects.toThrow(/preflight blocked/);
    expect(state.patch).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalled();
  });

  it('atomically narrows the link, resets Swaiman, audits and replays', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_315_200_000);
    const state = exactContext();
    const result = await registeredHandler(apply)(state.ctx, {
      releaseId: SWAIMAN_SUDDEN_WEAKNESS_CAS_RELEASE_ID,
    }) as Record<string, unknown>;

    expect(result).toMatchObject({
      applied: true,
      alreadyApplied: false,
      linksUpdated: 1,
      sourcesReset: 1,
      reverseDependenciesRemaining: 0,
      citationsEligible: true,
      updatedAt: 1_787_315_200_000,
    });
    expect(state.tables.evidenceLinks[0]).toMatchObject({
      sourceIds: [CDC_AFM_SOURCE_ID],
      updatedAt: 1_787_315_200_000,
    });
    const cdc = state.tables.evidenceSources.find(
      (source) => source.sourceId === CDC_AFM_SOURCE_ID,
    )!;
    expect(cdc).toMatchObject({
      reviewStatus: 'approved',
      reviewer: 'Phyo Ko Ko',
      reviewerQualification: 'MBBS',
    });
    const swaiman = state.tables.evidenceSources.find(
      (source) => source.sourceId === SWAIMAN_SUDDEN_WEAKNESS_SOURCE_ID,
    )!;
    expect(swaiman).toMatchObject({
      ...SWAIMAN_SUDDEN_WEAKNESS_SOURCE_DESIRED,
      updatedAt: 1_787_315_200_000,
    });
    expect(swaiman).not.toHaveProperty('reviewerQualification');
    expect(swaiman).not.toHaveProperty('reviewNote');
    expect(swaiman).not.toHaveProperty('reviewerId');
    expect(swaiman).not.toHaveProperty('reviewScope');
    expect(state.tables.auditLogs).toHaveLength(1);
    expect(state.tables.auditLogs[0]).toMatchObject({
      action: 'release.swaiman_sudden_weakness_cleanup',
      entityTable: 'evidenceLinks,evidenceSources',
      summary: SWAIMAN_SUDDEN_WEAKNESS_CAS_RELEASE_ID,
      result: 'ok',
    });

    const patchCalls = state.patch.mock.calls.length;
    const insertCalls = state.insert.mock.calls.length;
    const replay = await registeredHandler(apply)(state.ctx, {
      releaseId: SWAIMAN_SUDDEN_WEAKNESS_CAS_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(replay).toMatchObject({
      applied: false,
      alreadyApplied: true,
      linksUpdated: 0,
      sourcesReset: 0,
      reverseDependenciesRemaining: 0,
      citationsEligible: true,
      updatedAt: 1_787_315_200_000,
    });
    expect(state.patch).toHaveBeenCalledTimes(patchCalls);
    expect(state.insert).toHaveBeenCalledTimes(insertCalls);
  });

  it.each([
    ['desired link array', (state: ReturnType<typeof exactContext>) => {
      state.tables.evidenceLinks[0].sourceIds = ['post-release-drift'];
    }],
    ['source postimage', (state: ReturnType<typeof exactContext>) => {
      const source = state.tables.evidenceSources.find(
        (row) => row.sourceId === SWAIMAN_SUDDEN_WEAKNESS_SOURCE_ID,
      )!;
      source.reviewStatus = 'approved';
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
      releaseId: SWAIMAN_SUDDEN_WEAKNESS_CAS_RELEASE_ID,
    });
    mutate(state);
    await expect(registeredHandler(apply)(state.ctx, {
      releaseId: SWAIMAN_SUDDEN_WEAKNESS_CAS_RELEASE_ID,
    })).rejects.toThrow(/preflight blocked/);
  });
});
