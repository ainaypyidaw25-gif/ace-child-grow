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

import { apply, preflight } from '../../../convex/birth2mNutritionCas';
import {
  BIRTH2M_NUTRITION_CAS_RELEASE_ID,
  BIRTH2M_NUTRITION_DESIRED_DATA,
  BIRTH2M_NUTRITION_DESIRED_SEARCH_TEXT,
  BIRTH2M_NUTRITION_MEDIA_PREIMAGES,
  BIRTH2M_NUTRITION_PREIMAGE_DOCUMENTS,
  BIRTH2M_NUTRITION_REVIEW_PREIMAGES,
  BIRTH2M_NUTRITION_REQUIRED_REVISION_3_REVIEWS,
  BIRTH2M_NUTRITION_SOURCE_PREIMAGES,
  BIRTH2M_NUTRITION_TARGET,
} from '../../../convex/lib/birth2mNutritionCasData';

type Row = Record<string, unknown>;

function registeredHandler(fn: unknown) {
  return (fn as {
    _handler: (ctx: unknown, args: Record<string, unknown>) => Promise<unknown>;
  })._handler;
}

function exactContext() {
  const sourceRows = BIRTH2M_NUTRITION_SOURCE_PREIMAGES.map((expected) => ({
    ...structuredClone(expected.document),
    __exactCanonicalSha256: expected.exactCanonicalSha256,
  }));
  const tables: Record<string, Row[]> = {
    libraryContent: [{
      ...structuredClone(BIRTH2M_NUTRITION_PREIMAGE_DOCUMENTS.content),
      __exactCanonicalSha256: BIRTH2M_NUTRITION_TARGET.contentInitialCanonicalSha256,
    }],
    evidenceLinks: [{
      ...structuredClone(BIRTH2M_NUTRITION_PREIMAGE_DOCUMENTS.link),
      __exactCanonicalSha256: BIRTH2M_NUTRITION_TARGET.linkInitialCanonicalSha256,
    }],
    evidenceSources: sourceRows,
    libraryMedia: BIRTH2M_NUTRITION_MEDIA_PREIMAGES.map((expected) => ({
      _id: expected.rowId,
      _creationTime: expected.creationTime,
      contentSlug: BIRTH2M_NUTRITION_TARGET.slug,
      __exactCanonicalSha256: expected.exactCanonicalSha256,
    })),
    contentReviews: BIRTH2M_NUTRITION_REVIEW_PREIMAGES.map((expected) => ({
      ...structuredClone(expected.document),
      __exactCanonicalSha256: expected.exactCanonicalSha256,
    })),
    aiContentAudits: [],
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
    const id = `${table}:birth2m-nutrition:${++inserted}`;
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

describe('Birth-to-2-month nutrition exact CAS handlers', () => {
  it('reports the exact Production preimage as ready', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_315_200_000);
    const state = exactContext();
    const result = await registeredHandler(preflight)(state.ctx, {
      releaseId: BIRTH2M_NUTRITION_CAS_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(result).toMatchObject({
      phase: 'ready',
      blockers: [],
      mediaRows: 0,
      mediaExact: true,
      reviewRows: 5,
      reviewsExact: true,
      desiredRevisionApprovals: 0,
      outstandingRequiredReviews: BIRTH2M_NUTRITION_REQUIRED_REVISION_3_REVIEWS,
      aiReleaseRows: 0,
      aiContentAuditRows: 0,
      content: { initialMatches: true, clinicalStatus: 'published', reviewRevision: 2 },
      link: {
        initialMatches: true,
        citationEligible: true,
        eligibleDesiredSourceIds: [...BIRTH2M_NUTRITION_TARGET.desiredSourceIds],
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
    ['unexpected media', (state: ReturnType<typeof exactContext>) => {
      state.tables.libraryMedia.push({
        _id: 'media:unexpected',
        _creationTime: 1,
        contentSlug: BIRTH2M_NUTRITION_TARGET.slug,
      });
    }],
    ['review history', (state: ReturnType<typeof exactContext>) => {
      state.tables.contentReviews.pop();
    }],
    ['AI release', (state: ReturnType<typeof exactContext>) => {
      state.tables.aiPublicationReleases.push({
        _id: 'ai:unexpected',
        targetKey: `${BIRTH2M_NUTRITION_TARGET.kind}:${BIRTH2M_NUTRITION_TARGET.slug}`,
      });
    }],
    ['AI content audit', (state: ReturnType<typeof exactContext>) => {
      state.tables.aiContentAudits.push({
        _id: 'ai-content-audit:unexpected',
        contentSlug: BIRTH2M_NUTRITION_TARGET.slug,
        reviewRevision: BIRTH2M_NUTRITION_TARGET.contentInitialReviewRevision,
        contentUpdatedAt: BIRTH2M_NUTRITION_TARGET.contentInitialUpdatedAt,
      });
    }],
  ] as const)('fails before every write on %s drift', async (_name, mutate) => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_315_200_000);
    const state = exactContext();
    mutate(state);
    await expect(registeredHandler(apply)(state.ctx, {
      releaseId: BIRTH2M_NUTRITION_CAS_RELEASE_ID,
    })).rejects.toThrow(/preflight blocked/);
    expect(state.patch).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalled();
  });

  it('atomically corrects content/link, invalidates review state and replays idempotently', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_315_200_000);
    const state = exactContext();
    const sourcesBefore = structuredClone(state.tables.evidenceSources);
    const mediaBefore = structuredClone(state.tables.libraryMedia);
    const reviewsBefore = structuredClone(state.tables.contentReviews);
    const aiContentAuditsBefore = structuredClone(state.tables.aiContentAudits);

    const result = await registeredHandler(apply)(state.ctx, {
      releaseId: BIRTH2M_NUTRITION_CAS_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(result).toMatchObject({
      applied: true,
      alreadyApplied: false,
      linksUpdated: 1,
      contentInvalidated: 1,
      sourcesPreserved: 4,
      mediaPreserved: 0,
      reviewsPreserved: 5,
      aiContentAuditsPreserved: 0,
      citationsEligible: true,
      updatedAt: 1_787_315_200_000,
    });
    expect(state.tables.evidenceLinks[0]).toMatchObject({
      sourceIds: [...BIRTH2M_NUTRITION_TARGET.desiredSourceIds],
      updatedAt: 1_787_315_200_000,
    });
    expect(state.tables.libraryContent[0]).toMatchObject({
      data: BIRTH2M_NUTRITION_DESIRED_DATA,
      searchText: BIRTH2M_NUTRITION_DESIRED_SEARCH_TEXT,
      clinicalStatus: 'clinical_review',
      reviewRevision: 3,
      updatedAt: 1_787_315_200_000,
    });
    expect(state.tables.libraryContent[0]).not.toHaveProperty('reviewerId');
    expect(state.tables.libraryContent[0]).not.toHaveProperty('reviewerQualification');
    expect(state.tables.libraryContent[0]).not.toHaveProperty('reviewerDisplayName');
    expect(state.tables.libraryContent[0]).not.toHaveProperty('reviewScope');
    expect(state.tables.libraryContent[0]).not.toHaveProperty('reviewedAt');
    expect(state.tables.evidenceSources).toEqual(sourcesBefore);
    expect(state.tables.libraryMedia).toEqual(mediaBefore);
    expect(state.tables.contentReviews).toEqual(reviewsBefore);
    expect(state.tables.aiContentAudits).toEqual(aiContentAuditsBefore);
    expect(state.tables.contentReviews.filter((row) => row.reviewRevision === 3))
      .toEqual([]);
    expect(state.tables.auditLogs).toHaveLength(1);
    expect(String(state.tables.auditLogs[0].after)).toContain(
      '"publicationDecision":"not_made"',
    );
    expect(String(state.tables.auditLogs[0].before)).toContain(
      '"aiContentAudits":{"rows":0}',
    );
    expect(String(state.tables.auditLogs[0].after)).toContain(
      '"aiContentAudits":{"rows":0}',
    );
    expect(String(state.tables.auditLogs[0].after)).toContain(
      '"outstandingRequiredReviews":["native_myanmar","english","child_development","evidence","safety","clinical"]',
    );

    const patchCalls = state.patch.mock.calls.length;
    const insertCalls = state.insert.mock.calls.length;
    const replay = await registeredHandler(apply)(state.ctx, {
      releaseId: BIRTH2M_NUTRITION_CAS_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(replay).toMatchObject({
      applied: false,
      alreadyApplied: true,
      linksUpdated: 0,
      contentInvalidated: 0,
      aiContentAuditsPreserved: 0,
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
      releaseId: BIRTH2M_NUTRITION_CAS_RELEASE_ID,
    });
    state.tables.evidenceLinks[0].sourceIds = ['drifted'];
    await expect(registeredHandler(apply)(state.ctx, {
      releaseId: BIRTH2M_NUTRITION_CAS_RELEASE_ID,
    })).rejects.toThrow(/preflight blocked/);
  });
});
