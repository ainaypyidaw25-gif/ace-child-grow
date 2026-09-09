import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../convex/lib/aiAuditHash', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../convex/lib/aiAuditHash')>();
  const reverseHashes: Record<string, Record<number, string>> = {
    'aap-safe-sleep-2022': {
      44: 'cb3029fec6400284036162e048f5ab1bcf68ac0d5c50e2c1fbb2d03d321f4aec',
    },
    'hc-safe-sleep-2026': {
      6: '5fe681869e5a5ed9a83d48dc310de7a1eb61f8de40a7a9d3ad2aff436e9d5362',
    },
    'jr-aasm-bedtime-2006': {
      25: 'a714db6bcde1ec2c071b5d93c92f9ca17c1bb86d29d1cdab207c6dbd7e8a58fc',
      24: '3362bc39fb0e3eddad28e6ad5bef47bfa96f39e3a626e83ba3317d32fb3c9c95',
    },
    'nhs-sids-2025': {
      24: 'dbbb1110705ce6b620a5772ae39e938059eb646e1a9c4038471b746ff4f7b909',
    },
    'nice-ng62-cerebral-palsy-2017': {
      2: '554824454957e1d22f4fc07a4d6be632a83b9b5a2f83ecc33a7dc70dc0212eb5',
    },
    'who-pa-sleep-under5-2019': {
      61: 'ff760ab4236b5f81ffba5c31d8be2aaec6e603040cc50ba453187654feeb80db',
    },
  };
  return {
    ...actual,
    sha256Canonical: vi.fn(async (value: unknown) => {
      if (Array.isArray(value) && value.length > 0) {
        const firstSourceIds = (value[0] as { sourceIds?: string[] }).sourceIds ?? [];
        const commonSourceIds = firstSourceIds.filter((sourceId) => value.every((row) => (
          ((row as { sourceIds?: string[] }).sourceIds ?? []).includes(sourceId)
        )));
        if (commonSourceIds.length === 1) {
          const mocked = reverseHashes[commonSourceIds[0]]?.[value.length];
          if (mocked) return mocked;
        }
      }
      const row = value as {
        __exactCanonicalSha256?: string;
        data?: { __mockAuthoredSha256?: string };
      };
      if (row.__exactCanonicalSha256) return row.__exactCanonicalSha256;
      if (row.data?.__mockAuthoredSha256) return row.data.__mockAuthoredSha256;
      return actual.sha256Canonical(value);
    }),
  };
});

import { apply, preflight } from '../../../convex/clinicalTwoSmallCas';
import {
  CLINICAL_TWO_SMALL_CAS_RELEASE_ID,
  CLINICAL_TWO_SMALL_REQUIRED_REVIEWS,
  CLINICAL_TWO_SMALL_REVERSE_DEPENDENCIES,
  CLINICAL_TWO_SMALL_SOURCE_PREIMAGES,
  CLINICAL_TWO_SMALL_TARGETS,
} from '../../../convex/lib/clinicalTwoSmallCasData';

type Row = Record<string, unknown>;

function registeredHandler(fn: unknown) {
  return (fn as {
    _handler: (ctx: unknown, args: Record<string, unknown>) => Promise<unknown>;
  })._handler;
}

function targetContentRow(target: typeof CLINICAL_TWO_SMALL_TARGETS[number]): Row {
  return {
    ...structuredClone(target.desiredContent),
    _id: target.contentId,
    _creationTime: target.contentCreationTime,
    data: { __mockAuthoredSha256: target.contentInitialAuthoredSha256 },
    clinicalStatus: 'clinical_review',
    reviewRevision: target.contentInitialReviewRevision,
    updatedAt: target.contentInitialUpdatedAt,
    reviewerId: 'reviewer:stale',
    reviewerQualification: 'stale',
    reviewerDisplayName: 'Stale Reviewer',
    reviewScope: 'clinical',
    reviewedAt: 1,
    nextReviewAt: 2,
    reviewNote: 'stale',
    __exactCanonicalSha256: target.contentInitialCanonicalSha256,
  };
}

function targetLinkRow(target: typeof CLINICAL_TWO_SMALL_TARGETS[number]): Row {
  return {
    _id: target.linkId,
    _creationTime: target.linkCreationTime,
    kind: target.kind,
    slug: target.slug,
    sourceIds: [...target.initialSourceIds],
    createdAt: target.linkCreatedAt,
    updatedAt: target.linkInitialUpdatedAt,
    __exactCanonicalSha256: target.linkInitialCanonicalSha256,
  };
}

function exactContext() {
  const targetLinks = CLINICAL_TWO_SMALL_TARGETS.map(targetLinkRow);
  const evidenceLinks: Row[] = [...targetLinks];
  for (const reverse of CLINICAL_TWO_SMALL_REVERSE_DEPENDENCIES) {
    const already = targetLinks.filter((row) => (
      (row.sourceIds as string[]).includes(reverse.sourceId)
    )).length;
    for (let index = already; index < reverse.initialCount; index += 1) {
      evidenceLinks.push({
        _id: `reverse:${reverse.sourceId}:${index}`,
        _creationTime: index + 1,
        kind: 'mock',
        slug: `${reverse.sourceId}-${index}`,
        sourceIds: [reverse.sourceId],
        createdAt: 1,
        updatedAt: 1,
      });
    }
  }
  const tables: Record<string, Row[]> = {
    libraryContent: CLINICAL_TWO_SMALL_TARGETS.map(targetContentRow),
    evidenceLinks,
    evidenceSources: CLINICAL_TWO_SMALL_SOURCE_PREIMAGES.map((expected) => ({
      _id: expected.rowId,
      _creationTime: expected.creationTime,
      sourceId: expected.sourceId,
      reviewStatus: 'approved',
      evidenceLevel: 'guideline',
      reviewDate: '2026-07-26',
      nextReviewDate: '2027-07-26',
      verifiedOn: '2026-07-24',
      ageMonthsMin: 0,
      ageMonthsMax: 60,
      __exactCanonicalSha256: expected.exactCanonicalSha256,
    })),
    libraryMedia: CLINICAL_TWO_SMALL_TARGETS.flatMap((target) => (
      target.mediaPreimages.map((expected) => ({
        _id: expected.rowId,
        _creationTime: expected.creationTime,
        contentSlug: target.slug,
        __exactCanonicalSha256: expected.exactCanonicalSha256,
      }))
    )),
    contentReviews: CLINICAL_TWO_SMALL_TARGETS.flatMap((target) => (
      target.reviewPreimages.map((expected) => ({
        _id: expected.rowId,
        _creationTime: expected.creationTime,
        contentSlug: target.slug,
        contentVersion: target.contentInitialReviewRevision,
        reviewRevision: target.contentInitialReviewRevision,
        dimension: 'english',
        decision: 'approved',
        __exactCanonicalSha256: expected.exactCanonicalSha256,
      }))
    )),
    aiContentAudits: [],
    aiEvidenceAudits: [],
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
    const id = `${table}:clinical-two-small:${++inserted}`;
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

describe('clinical two-small exact CAS handlers', () => {
  it('reports the complete exact preimage as ready without writing', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_486_400_000);
    const state = exactContext();
    const result = await registeredHandler(preflight)(state.ctx, {
      releaseId: CLINICAL_TWO_SMALL_CAS_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(result).toMatchObject({
      phase: 'ready',
      blockers: [],
      allLinksBounded: true,
      aiEvidenceAuditRows: 0,
    });
    expect((result.targets as Row[]).map((target) => ({
      slug: target.slug,
      contentInitialMatches: target.contentInitialMatches,
      desiredTemplateExact: target.desiredTemplateExact,
      linkInitialMatches: target.linkInitialMatches,
      citationEligible: target.citationEligible,
      outstandingRequiredReviews: target.outstandingRequiredReviews,
    }))).toEqual(CLINICAL_TWO_SMALL_TARGETS.map((target) => ({
      slug: target.slug,
      contentInitialMatches: true,
      desiredTemplateExact: true,
      linkInitialMatches: true,
      citationEligible: true,
      outstandingRequiredReviews: [...CLINICAL_TWO_SMALL_REQUIRED_REVIEWS],
    })));
    expect(state.patch).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalled();
  });

  it.each([
    ['content hash', (state: ReturnType<typeof exactContext>) => {
      state.tables.libraryContent[0].__exactCanonicalSha256 = '0'.repeat(64);
    }],
    ['ordered guide link', (state: ReturnType<typeof exactContext>) => {
      const row = state.tables.evidenceLinks.find((candidate) => candidate.slug === 'gd_3_4m_sleep')!;
      row.sourceIds = ['drifted'];
    }],
    ['source hash', (state: ReturnType<typeof exactContext>) => {
      state.tables.evidenceSources[0].__exactCanonicalSha256 = '0'.repeat(64);
    }],
    ['source authority', (state: ReturnType<typeof exactContext>) => {
      state.tables.evidenceSources.find((row) => (
        row.sourceId === 'nice-ng62-cerebral-palsy-2017'
      ))!.evidenceLevel = 'blog';
    }],
    ['source age coverage', (state: ReturnType<typeof exactContext>) => {
      state.tables.evidenceSources[0].ageMonthsMax = 2;
    }],
    ['media', (state: ReturnType<typeof exactContext>) => {
      state.tables.libraryMedia.pop();
    }],
    ['review history', (state: ReturnType<typeof exactContext>) => {
      state.tables.contentReviews.pop();
    }],
    ['AI content audit', (state: ReturnType<typeof exactContext>) => {
      state.tables.aiContentAudits.push({ _id: 'ai:content', contentSlug: 'gd_3_4m_sleep' });
    }],
    ['AI evidence audit', (state: ReturnType<typeof exactContext>) => {
      state.tables.aiEvidenceAudits.push({ _id: 'ai:evidence', sourceId: 'aap-safe-sleep-2022' });
    }],
  ] as const)('fails before every write when %s drifts', async (_name, mutate) => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_486_400_000);
    const state = exactContext();
    mutate(state);
    await expect(registeredHandler(apply)(state.ctx, {
      releaseId: CLINICAL_TWO_SMALL_CAS_RELEASE_ID,
    })).rejects.toThrow(/preflight blocked/);
    expect(state.patch).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalled();
  });

  it('atomically updates two contents, one link and replays with zero writes', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_486_400_000);
    const state = exactContext();
    const sourcesBefore = structuredClone(state.tables.evidenceSources);
    const mediaBefore = structuredClone(state.tables.libraryMedia);
    const reviewsBefore = structuredClone(state.tables.contentReviews);

    const result = await registeredHandler(apply)(state.ctx, {
      releaseId: CLINICAL_TWO_SMALL_CAS_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(result).toMatchObject({
      applied: true,
      alreadyApplied: false,
      contentUpdated: 2,
      linksUpdated: 1,
      sourcesPreserved: 6,
      mediaPreserved: 1,
      reviewsPreserved: 9,
      requiredFreshReviews: 12,
      publicationDecisionMade: false,
      updatedAt: 1_787_486_400_000,
    });
    for (const target of CLINICAL_TWO_SMALL_TARGETS) {
      expect(state.tables.libraryContent.find((row) => row.slug === target.slug)).toMatchObject({
        data: target.desiredContent.data,
        searchText: target.desiredContent.searchText,
        reviewRevision: target.contentDesiredReviewRevision,
        requiredReviewDimensions: CLINICAL_TWO_SMALL_REQUIRED_REVIEWS,
        clinicalStatus: 'clinical_review',
        updatedAt: 1_787_486_400_000,
      });
    }
    expect(state.tables.evidenceLinks.find((row) => row.slug === 'sn_cerebral_palsy'))
      .toMatchObject({ sourceIds: ['nice-ng62-cerebral-palsy-2017'], updatedAt: 1_787_310_167_560 });
    expect(state.tables.evidenceLinks.find((row) => row.slug === 'gd_3_4m_sleep'))
      .toMatchObject({
        sourceIds: [
          'who-pa-sleep-under5-2019',
          'aap-safe-sleep-2022',
          'nhs-sids-2025',
          'hc-safe-sleep-2026',
        ],
        updatedAt: 1_787_486_400_000,
      });
    expect(state.tables.evidenceSources).toEqual(sourcesBefore);
    expect(state.tables.libraryMedia).toEqual(mediaBefore);
    expect(state.tables.contentReviews).toEqual(reviewsBefore);
    expect(state.tables.auditLogs).toHaveLength(1);
    expect(String(state.tables.auditLogs[0].after)).toContain('"publicationDecision":"not_made"');

    const patchCalls = state.patch.mock.calls.length;
    const insertCalls = state.insert.mock.calls.length;
    const replay = await registeredHandler(apply)(state.ctx, {
      releaseId: CLINICAL_TWO_SMALL_CAS_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(replay).toMatchObject({ applied: false, alreadyApplied: true, contentUpdated: 0, linksUpdated: 0 });
    expect(state.patch).toHaveBeenCalledTimes(patchCalls);
    expect(state.insert).toHaveBeenCalledTimes(insertCalls);
  });
});
