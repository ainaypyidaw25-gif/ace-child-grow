import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../convex/lib/aiAuditHash', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../convex/lib/aiAuditHash')>();
  return { ...actual, sha256Canonical: vi.fn(async (value: unknown) => {
    const row = value as { __hash?: string };
    return row.__hash ?? await actual.sha256Canonical(value);
  }) };
});

import { apply, preflight } from '../../../convex/manualReviewEvidenceLinkCas';
import {
  MANUAL_REVIEW_EVIDENCE_LINK_CAS_RELEASE_ID,
  MANUAL_REVIEW_EVIDENCE_LINK_CAS_TARGETS,
  MANUAL_REVIEW_EVIDENCE_LINK_EXACT_SOURCE_ROWS,
  MANUAL_REVIEW_EVIDENCE_LINK_SOURCE_PREIMAGES,
} from '../../../convex/lib/manualReviewEvidenceLinkCasData';

type Row = Record<string, unknown>;
function handler(fn: unknown) {
  return (fn as { _handler: (ctx: unknown, args: unknown) => Promise<unknown> })._handler;
}

function exactContext() {
  const exactSourceById = new Map(MANUAL_REVIEW_EVIDENCE_LINK_EXACT_SOURCE_ROWS.map(
    (row) => [String(row.sourceId), row],
  ));
  const desiredIds = [...new Set(MANUAL_REVIEW_EVIDENCE_LINK_CAS_TARGETS
    .flatMap((target) => [...target.desiredSourceIds]))];
  const directById = new Map<string, typeof MANUAL_REVIEW_EVIDENCE_LINK_SOURCE_PREIMAGES[number]>(MANUAL_REVIEW_EVIDENCE_LINK_SOURCE_PREIMAGES.map(
    (source) => [source.sourceId, source],
  ));
  const evidenceSources = desiredIds.map((sourceId, index) => {
    const direct = directById.get(sourceId);
    if (direct) return { ...structuredClone(exactSourceById.get(sourceId)!), __hash: direct.exactCanonicalSha256 };
    return {
      _id: `source:${index}`, _creationTime: 1, sourceId,
      reviewStatus: 'approved', evidenceLevel: 'guideline', year: 2024,
      reviewDate: '2026-08-21', nextReviewDate: '2027-08-21', verifiedOn: '2026-08-21',
    };
  });
  const tables: Record<string, Row[]> = {
    evidenceLinks: MANUAL_REVIEW_EVIDENCE_LINK_CAS_TARGETS.map((target) => ({
      _id: target.linkId, _creationTime: target.creationTime, kind: target.kind, slug: target.slug,
      sourceIds: [...target.initialSourceIds], createdAt: target.createdAt,
      updatedAt: target.initialUpdatedAt,
    })),
    libraryContent: MANUAL_REVIEW_EVIDENCE_LINK_CAS_TARGETS.map((target) => ({
      _id: target.contentId, _creationTime: target.contentCreationTime, type: target.kind,
      slug: target.slug, clinicalStatus: 'clinical_review', reviewRevision: target.contentReviewRevision,
      updatedAt: target.contentUpdatedAt, __hash: target.contentCanonicalSha256,
    })),
    evidenceSources, aiPublicationReleases: [], auditLogs: [],
  };
  const byId = new Map<string, Row>();
  Object.values(tables).flat().forEach((row) => byId.set(String(row._id), row));
  const query = vi.fn((table: string) => {
    const terminal = (conditions: Array<[string, unknown]> = []) => ({
      take: async (count: number) => (tables[table] ?? []).filter((row) => conditions.every(
        ([field, value]) => row[field] === value,
      )).slice(0, count),
    });
    return { ...terminal(), withIndex: (_index: string, callback: (q: {
      eq: (field: string, value: unknown) => unknown,
    }) => unknown) => {
      const conditions: Array<[string, unknown]> = [];
      const q = { eq: (field: string, value: unknown): unknown => {
        conditions.push([field, value]); return q;
      } };
      callback(q); return terminal(conditions);
    } };
  });
  let inserted = 0;
  const insert = vi.fn(async (table: string, value: Row) => {
    const id = `${table}:manual-review:${++inserted}`;
    const row = { ...value, _id: id, _creationTime: 2 };
    tables[table] ??= []; tables[table].push(row); byId.set(id, row); return id;
  });
  const patch = vi.fn(async (id: string, value: Row) => Object.assign(byId.get(id)!, value));
  return { ctx: { db: { query, insert, patch } }, tables, patch, insert };
}

afterEach(() => vi.restoreAllMocks());

describe('manual-review evidence-link exact CAS handlers', () => {
  it('reports the fresh exact snapshot as ready', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_401_600_000);
    const state = exactContext();
    const result = await handler(preflight)(state.ctx, {
      releaseId: MANUAL_REVIEW_EVIDENCE_LINK_CAS_RELEASE_ID,
    }) as { phase: string; blockers: string[]; targets: unknown[] };
    expect(result.phase).toBe('ready');
    expect(result.blockers).toEqual([]);
    expect(result.targets).toHaveLength(8);
  });

  it.each([
    ['ordered link array', (state: ReturnType<typeof exactContext>) => {
      state.tables.evidenceLinks[0].sourceIds = ['drift'];
    }],
    ['duplicate link', (state: ReturnType<typeof exactContext>) => {
      state.tables.evidenceLinks.push({ ...structuredClone(state.tables.evidenceLinks[0]), _id: 'duplicate' });
    }],
    ['governing content', (state: ReturnType<typeof exactContext>) => {
      state.tables.libraryContent[0].__hash = '0'.repeat(64);
    }],
    ['content revision', (state: ReturnType<typeof exactContext>) => {
      state.tables.libraryContent[0].reviewRevision = 10;
    }],
    ['AI release', (state: ReturnType<typeof exactContext>) => {
      state.tables.aiPublicationReleases.push({ targetKey: 'guide:gd_13_18m_nutrition' });
    }],
    ['direct-source metadata', (state: ReturnType<typeof exactContext>) => {
      state.tables.evidenceSources.find((row) => row.sourceId === 'hc-choking-prevention-2026')!.__hash = '0'.repeat(64);
    }],
    ['source eligibility', (state: ReturnType<typeof exactContext>) => {
      state.tables.evidenceSources[0].nextReviewDate = '2026-08-20';
    }],
  ] as const)('fails before writes on %s drift', async (_name, mutate) => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_401_600_000);
    const state = exactContext(); mutate(state);
    await expect(handler(apply)(state.ctx, {
      releaseId: MANUAL_REVIEW_EVIDENCE_LINK_CAS_RELEASE_ID,
    })).rejects.toThrow(/preflight blocked/);
    expect(state.patch).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalled();
  });

  it('atomically updates eight links only, audits, and replays idempotently', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_401_600_000);
    const state = exactContext();
    const contents = structuredClone(state.tables.libraryContent);
    const sources = structuredClone(state.tables.evidenceSources);
    const result = await handler(apply)(state.ctx, {
      releaseId: MANUAL_REVIEW_EVIDENCE_LINK_CAS_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(result).toMatchObject({ applied: true, alreadyApplied: false, linksUpdated: 8,
      contentRowsPreserved: 8, citationsEligible: true });
    for (const target of MANUAL_REVIEW_EVIDENCE_LINK_CAS_TARGETS) {
      const link = state.tables.evidenceLinks.find((row) => row.slug === target.slug);
      expect(link?.sourceIds).toEqual(target.desiredSourceIds);
    }
    expect(state.tables.libraryContent).toEqual(contents);
    expect(state.tables.evidenceSources).toEqual(sources);
    expect(state.tables.auditLogs).toHaveLength(1);
    expect(state.tables.auditLogs[0]).toMatchObject({
      action: 'release.manual_review_evidence_links', entityTable: 'evidenceLinks', result: 'ok',
    });
    const patchCalls = state.patch.mock.calls.length;
    const insertCalls = state.insert.mock.calls.length;
    expect(await handler(apply)(state.ctx, {
      releaseId: MANUAL_REVIEW_EVIDENCE_LINK_CAS_RELEASE_ID,
    })).toMatchObject({ applied: false, alreadyApplied: true, linksUpdated: 0 });
    expect(state.patch).toHaveBeenCalledTimes(patchCalls);
    expect(state.insert).toHaveBeenCalledTimes(insertCalls);
  });
});
