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

import { apply, preflight } from '../../../convex/inherentPublicLinkCas';
import {
  INHERENT_PUBLIC_CITATION_SOURCE_PREIMAGES,
  INHERENT_PUBLIC_LINK_CAS_RELEASE_ID,
  INHERENT_PUBLIC_LINK_CAS_TARGETS,
} from '../../../convex/lib/inherentPublicLinkCasData';

type Row = Record<string, unknown>;

function registeredHandler(fn: unknown) {
  return (fn as {
    _handler: (ctx: unknown, args: Record<string, unknown>) => Promise<unknown>;
  })._handler;
}

function exactContext() {
  const tables: Record<string, Row[]> = {
    evidenceLinks: INHERENT_PUBLIC_LINK_CAS_TARGETS.map((target) => ({
      _id: target.linkId,
      _creationTime: target.creationTime,
      kind: target.kind,
      slug: target.slug,
      sourceIds: [...target.initialSourceIds],
      createdAt: target.createdAt,
      updatedAt: target.initialUpdatedAt,
    })),
    evidenceSources: INHERENT_PUBLIC_CITATION_SOURCE_PREIMAGES.map((source) => ({
      _id: source.rowId,
      _creationTime: source.creationTime,
      sourceId: source.sourceId,
      org: source.org,
      orgKey: source.orgKey,
      title: source.title,
      url: source.url,
      evidenceLevel: source.evidenceLevel,
      reviewStatus: source.reviewStatus,
      reviewer: source.reviewer,
      reviewerId: source.reviewerId,
      reviewerQualification: source.reviewerQualification,
      reviewScope: source.reviewScope,
      year: source.year,
      reviewDate: source.reviewDate,
      nextReviewDate: source.nextReviewDate,
      verifiedOn: source.verifiedOn,
      updatedAt: source.updatedAt,
      __exactCanonicalSha256: source.exactCanonicalSha256,
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
      return {
        take: async (count: number) => filtered().slice(0, count),
        unique: async () => filtered()[0] ?? null,
      };
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
    const id = `${table}:inherent-public:${++inserted}`;
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

describe('inherent-public exact link CAS handlers', () => {
  it('reports the fresh Production snapshot and citations as ready', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_315_200_000);
    const state = exactContext();
    const result = await registeredHandler(preflight)(state.ctx, {
      releaseId: INHERENT_PUBLIC_LINK_CAS_RELEASE_ID,
    }) as {
      phase: string;
      blockers: string[];
      targets: Array<{ initialMatches: boolean; citationEligible: boolean }>;
      sources: Array<{ exact: boolean; eligible: boolean }>;
    };
    expect(result.phase).toBe('ready');
    expect(result.blockers).toEqual([]);
    expect(result.targets).toHaveLength(4);
    expect(result.targets.every((target) => target.initialMatches)).toBe(true);
    expect(result.targets.every((target) => target.citationEligible)).toBe(true);
    expect(result.sources).toHaveLength(5);
    expect(result.sources.every((source) => source.exact && source.eligible)).toBe(true);
  });

  it.each([
    ['link ordered array', (state: ReturnType<typeof exactContext>) => {
      state.tables.evidenceLinks[0].sourceIds = ['tampered-source'];
    }],
    ['link identity field', (state: ReturnType<typeof exactContext>) => {
      state.tables.evidenceLinks[0].createdAt = 1;
    }],
    ['duplicate link row', (state: ReturnType<typeof exactContext>) => {
      state.tables.evidenceLinks.push({
        ...structuredClone(state.tables.evidenceLinks[0]),
        _id: 'link:duplicate',
      });
    }],
    ['duplicate source row', (state: ReturnType<typeof exactContext>) => {
      state.tables.evidenceSources.push({
        ...structuredClone(state.tables.evidenceSources[0]),
        _id: 'source:duplicate',
      });
    }],
    ['full source-row hash', (state: ReturnType<typeof exactContext>) => {
      state.tables.evidenceSources[0].__exactCanonicalSha256 = '0'.repeat(64);
    }],
    ['source eligibility date', (state: ReturnType<typeof exactContext>) => {
      state.tables.evidenceSources[0].nextReviewDate = '2026-08-20';
    }],
    ['inherent-public assumption', (state: ReturnType<typeof exactContext>) => {
      state.tables.libraryContent.push({ slug: INHERENT_PUBLIC_LINK_CAS_TARGETS[0].slug });
    }],
  ] as const)('fails before every write on %s drift', async (_name, mutate) => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_315_200_000);
    const state = exactContext();
    mutate(state);
    await expect(registeredHandler(apply)(state.ctx, {
      releaseId: INHERENT_PUBLIC_LINK_CAS_RELEASE_ID,
    })).rejects.toThrow(/preflight blocked/);
    expect(state.patch).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalled();
  });

  it('atomically narrows four links, preserves sources, audits and replays idempotently', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_315_200_000);
    const state = exactContext();
    const initialSources = structuredClone(state.tables.evidenceSources);
    const result = await registeredHandler(apply)(state.ctx, {
      releaseId: INHERENT_PUBLIC_LINK_CAS_RELEASE_ID,
    }) as Record<string, unknown>;

    expect(result).toMatchObject({
      applied: true,
      alreadyApplied: false,
      linksUpdated: 4,
      sourcesPreserved: 5,
      citationsEligible: true,
      updatedAt: 1_787_315_200_000,
    });
    for (const target of INHERENT_PUBLIC_LINK_CAS_TARGETS) {
      const row = state.tables.evidenceLinks.find(
        (candidate) => candidate.kind === target.kind && candidate.slug === target.slug,
      );
      expect(row?.sourceIds, `${target.kind}:${target.slug}`).toEqual(target.desiredSourceIds);
      expect(row?.updatedAt).toBe(1_787_315_200_000);
    }
    expect(state.tables.evidenceSources).toEqual(initialSources);
    expect(state.tables.auditLogs).toHaveLength(1);
    expect(state.tables.auditLogs[0]).toMatchObject({
      action: 'release.inherent_public_citation_links',
      entityTable: 'evidenceLinks',
      summary: INHERENT_PUBLIC_LINK_CAS_RELEASE_ID,
      result: 'ok',
    });
    expect(String(state.tables.auditLogs[0].after)).toContain(
      '09419d04bafd28a4d3b4a721828209990904d16b28d86a642ed4145e9f72bf80',
    );

    const patchCalls = state.patch.mock.calls.length;
    const insertCalls = state.insert.mock.calls.length;
    const second = await registeredHandler(apply)(state.ctx, {
      releaseId: INHERENT_PUBLIC_LINK_CAS_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(second).toMatchObject({
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
    ['desired ordered array', (state: ReturnType<typeof exactContext>) => {
      state.tables.evidenceLinks[0].sourceIds = ['post-release-drift'];
    }],
    ['link postimage timestamp', (state: ReturnType<typeof exactContext>) => {
      state.tables.evidenceLinks[0].updatedAt = 1;
    }],
    ['release audit payload', (state: ReturnType<typeof exactContext>) => {
      state.tables.auditLogs[0].after = '{}';
    }],
    ['duplicate release audit', (state: ReturnType<typeof exactContext>) => {
      state.tables.auditLogs.push({
        ...structuredClone(state.tables.auditLogs[0]),
        _id: 'audit:duplicate',
      });
    }],
  ] as const)('blocks idempotent replay when %s drifts', async (_name, mutate) => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_315_200_000);
    const state = exactContext();
    await registeredHandler(apply)(state.ctx, {
      releaseId: INHERENT_PUBLIC_LINK_CAS_RELEASE_ID,
    });
    mutate(state);
    await expect(registeredHandler(apply)(state.ctx, {
      releaseId: INHERENT_PUBLIC_LINK_CAS_RELEASE_ID,
    })).rejects.toThrow(/preflight blocked/);
  });
});
