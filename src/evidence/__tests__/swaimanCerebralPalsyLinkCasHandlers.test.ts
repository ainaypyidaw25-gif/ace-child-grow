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

import { apply, preflight } from '../../../convex/swaimanCerebralPalsyLinkCas';
import {
  SWAIMAN_CEREBRAL_PALSY_LINK_CAS_RELEASE_ID,
  SWAIMAN_CEREBRAL_PALSY_MEDIA_PREIMAGES,
  SWAIMAN_CEREBRAL_PALSY_REVIEW_PREIMAGES,
  SWAIMAN_CEREBRAL_PALSY_SOURCE_PREIMAGES,
  SWAIMAN_CEREBRAL_PALSY_TARGET,
} from '../../../convex/lib/swaimanCerebralPalsyLinkCasData';

type Row = Record<string, unknown>;

function registeredHandler(fn: unknown) {
  return (fn as {
    _handler: (ctx: unknown, args: Record<string, unknown>) => Promise<unknown>;
  })._handler;
}

function exactContext() {
  const sourceRows = SWAIMAN_CEREBRAL_PALSY_SOURCE_PREIMAGES.map((expected) => ({
    _id: expected.rowId,
    _creationTime: expected.creationTime,
    sourceId: expected.sourceId,
    reviewStatus: 'approved',
    reviewer: 'ACE Child Grow Owner / Education Reviewer',
    reviewerQualification: 'MEd (Early Childhood and Special Education)',
    reviewDate: '2026-07-26',
    nextReviewDate: '2027-07-26',
    verifiedOn: '2026-07-24',
    updatedAt: 1,
    __exactCanonicalSha256: expected.exactCanonicalSha256,
  }));
  const tables: Record<string, Row[]> = {
    libraryContent: [{
      _id: SWAIMAN_CEREBRAL_PALSY_TARGET.contentId,
      _creationTime: SWAIMAN_CEREBRAL_PALSY_TARGET.contentCreationTime,
      type: SWAIMAN_CEREBRAL_PALSY_TARGET.kind,
      slug: SWAIMAN_CEREBRAL_PALSY_TARGET.slug,
      clinicalStatus: 'clinical_review',
      reviewRevision: SWAIMAN_CEREBRAL_PALSY_TARGET.contentInitialReviewRevision,
      updatedAt: SWAIMAN_CEREBRAL_PALSY_TARGET.contentInitialUpdatedAt,
      __exactCanonicalSha256: SWAIMAN_CEREBRAL_PALSY_TARGET.contentInitialCanonicalSha256,
    }],
    evidenceLinks: [{
      _id: SWAIMAN_CEREBRAL_PALSY_TARGET.linkId,
      _creationTime: SWAIMAN_CEREBRAL_PALSY_TARGET.linkCreationTime,
      kind: SWAIMAN_CEREBRAL_PALSY_TARGET.kind,
      slug: SWAIMAN_CEREBRAL_PALSY_TARGET.slug,
      sourceIds: [...SWAIMAN_CEREBRAL_PALSY_TARGET.initialSourceIds],
      createdAt: SWAIMAN_CEREBRAL_PALSY_TARGET.linkCreatedAt,
      updatedAt: SWAIMAN_CEREBRAL_PALSY_TARGET.linkInitialUpdatedAt,
      __exactCanonicalSha256: SWAIMAN_CEREBRAL_PALSY_TARGET.linkInitialCanonicalSha256,
    }],
    evidenceSources: sourceRows,
    libraryMedia: SWAIMAN_CEREBRAL_PALSY_MEDIA_PREIMAGES.map((expected) => ({
      _id: expected.rowId,
      _creationTime: expected.creationTime,
      contentSlug: SWAIMAN_CEREBRAL_PALSY_TARGET.slug,
      __exactCanonicalSha256: expected.exactCanonicalSha256,
    })),
    contentReviews: SWAIMAN_CEREBRAL_PALSY_REVIEW_PREIMAGES.map((expected) => ({
      _id: expected.rowId,
      _creationTime: expected.creationTime,
      contentSlug: SWAIMAN_CEREBRAL_PALSY_TARGET.slug,
      __exactCanonicalSha256: expected.exactCanonicalSha256,
    })),
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
    const id = `${table}:swaiman-cp:${++inserted}`;
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

describe('Swaiman cerebral-palsy exact CAS handlers', () => {
  it('reports the exact hidden Production preimage as ready', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_315_200_000);
    const state = exactContext();
    const result = await registeredHandler(preflight)(state.ctx, {
      releaseId: SWAIMAN_CEREBRAL_PALSY_LINK_CAS_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(result).toMatchObject({
      phase: 'ready',
      blockers: [],
      mediaRows: 1,
      mediaExact: true,
      reviewRows: 3,
      reviewsExact: true,
      aiReleaseRows: 0,
      content: { initialMatches: true, clinicalStatus: 'clinical_review', reviewRevision: 3 },
      link: {
        initialMatches: true,
        citationEligible: true,
        eligibleDesiredSourceIds: ['nice-ng62-cerebral-palsy-2017'],
      },
    });
  });

  it.each([
    ['content hash', (state: ReturnType<typeof exactContext>) => {
      state.tables.libraryContent[0].__exactCanonicalSha256 = '0'.repeat(64);
    }],
    ['ordered link array', (state: ReturnType<typeof exactContext>) => {
      state.tables.evidenceLinks[0].sourceIds = ['drifted'];
    }],
    ['source hash', (state: ReturnType<typeof exactContext>) => {
      state.tables.evidenceSources[0].__exactCanonicalSha256 = '0'.repeat(64);
    }],
    ['media hash', (state: ReturnType<typeof exactContext>) => {
      state.tables.libraryMedia[0].__exactCanonicalSha256 = '0'.repeat(64);
    }],
    ['review history', (state: ReturnType<typeof exactContext>) => {
      state.tables.contentReviews.pop();
    }],
    ['AI release', (state: ReturnType<typeof exactContext>) => {
      state.tables.aiPublicationReleases.push({
        _id: 'ai:unexpected',
        targetKey: 'special_need:sn_cerebral_palsy',
      });
    }],
  ] as const)('fails before every write on %s drift', async (_name, mutate) => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_315_200_000);
    const state = exactContext();
    mutate(state);
    await expect(registeredHandler(apply)(state.ctx, {
      releaseId: SWAIMAN_CEREBRAL_PALSY_LINK_CAS_RELEASE_ID,
    })).rejects.toThrow(/preflight blocked/);
    expect(state.patch).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalled();
  });

  it('atomically narrows the link, invalidates review state and replays idempotently', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_315_200_000);
    const state = exactContext();
    const sourcesBefore = structuredClone(state.tables.evidenceSources);
    const mediaBefore = structuredClone(state.tables.libraryMedia);
    const reviewsBefore = structuredClone(state.tables.contentReviews);

    const result = await registeredHandler(apply)(state.ctx, {
      releaseId: SWAIMAN_CEREBRAL_PALSY_LINK_CAS_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(result).toMatchObject({
      applied: true,
      alreadyApplied: false,
      linksUpdated: 1,
      contentInvalidated: 1,
      sourcesPreserved: 3,
      mediaPreserved: 1,
      reviewsPreserved: 3,
      citationsEligible: true,
      updatedAt: 1_787_315_200_000,
    });
    expect(state.tables.evidenceLinks[0]).toMatchObject({
      sourceIds: ['nice-ng62-cerebral-palsy-2017'],
      updatedAt: 1_787_315_200_000,
    });
    expect(state.tables.libraryContent[0]).toMatchObject({
      clinicalStatus: 'clinical_review',
      reviewRevision: 4,
      updatedAt: 1_787_315_200_000,
    });
    expect(state.tables.evidenceSources).toEqual(sourcesBefore);
    expect(state.tables.libraryMedia).toEqual(mediaBefore);
    expect(state.tables.contentReviews).toEqual(reviewsBefore);
    expect(state.tables.auditLogs).toHaveLength(1);

    const patchCalls = state.patch.mock.calls.length;
    const insertCalls = state.insert.mock.calls.length;
    const replay = await registeredHandler(apply)(state.ctx, {
      releaseId: SWAIMAN_CEREBRAL_PALSY_LINK_CAS_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(replay).toMatchObject({
      applied: false,
      alreadyApplied: true,
      linksUpdated: 0,
      contentInvalidated: 0,
      citationsEligible: true,
      updatedAt: 1_787_315_200_000,
    });
    expect(state.patch).toHaveBeenCalledTimes(patchCalls);
    expect(state.insert).toHaveBeenCalledTimes(insertCalls);
  });

  it('blocks replay if the postimage or audit drifts', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_315_200_000);
    const state = exactContext();
    await registeredHandler(apply)(state.ctx, {
      releaseId: SWAIMAN_CEREBRAL_PALSY_LINK_CAS_RELEASE_ID,
    });
    state.tables.evidenceLinks[0].sourceIds = ['drifted'];
    await expect(registeredHandler(apply)(state.ctx, {
      releaseId: SWAIMAN_CEREBRAL_PALSY_LINK_CAS_RELEASE_ID,
    })).rejects.toThrow(/preflight blocked/);
  });
});
