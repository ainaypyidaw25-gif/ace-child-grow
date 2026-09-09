import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  apply as applyGd,
  preflight as preflightGd,
} from '../../../convex/gdBirth2mEmotionalCas';
import {
  apply as applyUnicef,
  preflight as preflightUnicef,
} from '../../../convex/unicefSeenCountedMetadataCas';
import {
  importLinksFromCli,
  importSourcesFromCli,
} from '../../../convex/evidence';
import {
  CLINICAL_BLOCKER_PREIMAGES,
  GD_BIRTH2M_EMOTIONAL_DESIRED_DATA,
  GD_BIRTH2M_EMOTIONAL_RELEASE_ID,
  GD_BIRTH2M_EMOTIONAL_REQUIRED_REVISION_3_REVIEWS,
  GD_BIRTH2M_EMOTIONAL_TARGET,
  NHS_SOOTHING_CRYING_BABY_SOURCE_ID,
  UNICEF_SEEN_COUNTED_METADATA_RELEASE_ID,
  UNICEF_SEEN_COUNTED_REVERSE_KEYS,
  UNICEF_SEEN_COUNTED_SOURCE_ID,
} from '../../../convex/lib/clinicalBlockerCasData';
import { SOURCE_BY_ID } from '../sources';

type Row = Record<string, unknown>;

function registeredHandler(fn: unknown) {
  return (fn as {
    _handler: (ctx: unknown, args: Record<string, unknown>) => Promise<unknown>;
  })._handler;
}

function mockContext(tables: Record<string, Row[]>, label: string) {
  const byId = new Map<string, Row>();
  for (const rows of Object.values(tables)) {
    for (const row of rows) byId.set(String(row._id), row);
  }
  const query = vi.fn((table: string) => {
    const terminal = (conditions: Array<[string, unknown]> = []) => {
      const filtered = () => (tables[table] ?? []).filter((row) =>
        conditions.every(([field, value]) => row[field] === value));
      return {
        take: async (count: number) => filtered().slice(0, count),
        unique: async () => {
          const rows = filtered();
          if (rows.length > 1) throw new Error('not unique');
          return rows[0] ?? null;
        },
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
    const id = `${table}:${label}:${++inserted}`;
    const row = { ...value, _id: id, _creationTime: 2 + inserted };
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
  return { ctx: { db: { query, insert, patch, get } }, tables, insert, patch };
}

function gdContext() {
  const p = CLINICAL_BLOCKER_PREIMAGES.gdBirth2mEmotional;
  return mockContext({
    libraryContent: [structuredClone(p.content)],
    evidenceLinks: [structuredClone(p.link)],
    evidenceSources: structuredClone(p.sources),
    contentReviews: structuredClone(p.reviews),
    libraryMedia: structuredClone(p.media),
    aiContentAudits: structuredClone(p.aiContentAudits),
    aiPublicationReleases: structuredClone(p.aiPublicationReleases),
    auditLogs: [],
  }, 'gd-emotional');
}

function unicefContext() {
  const p = CLINICAL_BLOCKER_PREIMAGES.unicefSeenCountedIncluded;
  return mockContext({
    libraryContent: structuredClone(p.contents),
    evidenceLinks: structuredClone(p.links),
    evidenceSources: [structuredClone(p.source)],
    contentReviews: structuredClone(p.reviews),
    libraryMedia: structuredClone(p.media),
    aiContentAudits: structuredClone(p.aiContentAudits),
    aiPublicationReleases: structuredClone(p.aiPublicationReleases),
    auditLogs: [],
  }, 'unicef-metadata');
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('birth-to-2-month emotional exact CAS handlers', () => {
  it('reports the full exact Production preimage ready with no new NHS source', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_400_000_000);
    const state = gdContext();
    const result = await registeredHandler(preflightGd)(state.ctx, {
      releaseId: GD_BIRTH2M_EMOTIONAL_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(result).toMatchObject({
      phase: 'ready',
      blockers: [],
      contentInitialExact: true,
      linkInitialExact: true,
      existingSourcesExact: true,
      newSourceRows: 0,
      reverseDependencyKeys: [],
      reviewsExact: true,
      reviewRows: 2,
      mediaExact: true,
      mediaRows: 0,
      desiredRevisionApprovals: 0,
      outstandingRequiredReviews: GD_BIRTH2M_EMOTIONAL_REQUIRED_REVISION_3_REVIEWS,
    });
  });

  it.each([
    ['content', (state: ReturnType<typeof gdContext>) => {
      state.tables.libraryContent[0].data = {};
    }],
    ['link', (state: ReturnType<typeof gdContext>) => {
      state.tables.evidenceLinks[0].sourceIds = ['drifted'];
    }],
    ['existing source', (state: ReturnType<typeof gdContext>) => {
      state.tables.evidenceSources[0].verifiedNote = 'drifted';
    }],
    ['review history', (state: ReturnType<typeof gdContext>) => {
      state.tables.contentReviews.pop();
    }],
    ['new source pre-exists', (state: ReturnType<typeof gdContext>) => {
      state.tables.evidenceSources.push({
        _id: 'source:unexpected',
        _creationTime: 1,
        sourceId: NHS_SOOTHING_CRYING_BABY_SOURCE_ID,
      });
    }],
    ['new source reverse dependency', (state: ReturnType<typeof gdContext>) => {
      state.tables.evidenceLinks.push({
        _id: 'link:unexpected',
        _creationTime: 1,
        kind: 'guide',
        slug: 'unexpected',
        sourceIds: [NHS_SOOTHING_CRYING_BABY_SOURCE_ID],
      });
    }],
    ['AI audit', (state: ReturnType<typeof gdContext>) => {
      state.tables.aiContentAudits.push({
        _id: 'audit:unexpected',
        _creationTime: 1,
        contentSlug: GD_BIRTH2M_EMOTIONAL_TARGET.slug,
      });
    }],
  ] as const)('fails before every write on %s drift', async (_name, mutate) => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_400_000_000);
    const state = gdContext();
    mutate(state);
    await expect(registeredHandler(applyGd)(state.ctx, {
      releaseId: GD_BIRTH2M_EMOTIONAL_RELEASE_ID,
    })).rejects.toThrow(/preflight blocked/);
    expect(state.patch).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalled();
  });

  it('atomically creates an unapproved source, resets six reviews and replays', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_400_000_000);
    const state = gdContext();
    const reviewsBefore = structuredClone(state.tables.contentReviews);
    const existingSourcesBefore = structuredClone(state.tables.evidenceSources);
    const result = await registeredHandler(applyGd)(state.ctx, {
      releaseId: GD_BIRTH2M_EMOTIONAL_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(result).toMatchObject({
      applied: true,
      alreadyApplied: false,
      contentInvalidated: 1,
      linksUpdated: 1,
      sourcesCreated: 1,
      citationsEligible: true,
      updatedAt: 1_787_400_000_000,
    });
    expect(state.tables.libraryContent[0]).toMatchObject({
      data: GD_BIRTH2M_EMOTIONAL_DESIRED_DATA,
      reviewRevision: 3,
      clinicalStatus: 'clinical_review',
      updatedAt: 1_787_400_000_000,
    });
    expect(state.tables.evidenceLinks[0]).toMatchObject({
      sourceIds: GD_BIRTH2M_EMOTIONAL_TARGET.desiredSourceIds,
      updatedAt: 1_787_400_000_000,
    });
    expect(state.tables.evidenceSources.slice(0, 4)).toEqual(existingSourcesBefore);
    expect(state.tables.evidenceSources[4]).toMatchObject({
      sourceId: NHS_SOOTHING_CRYING_BABY_SOURCE_ID,
      reviewStatus: 'awaiting_review',
      reviewer: null,
      reviewDate: null,
    });
    expect(state.tables.contentReviews).toEqual(reviewsBefore);
    expect(state.tables.auditLogs).toHaveLength(1);
    const patchCalls = state.patch.mock.calls.length;
    const insertCalls = state.insert.mock.calls.length;
    const replay = await registeredHandler(applyGd)(state.ctx, {
      releaseId: GD_BIRTH2M_EMOTIONAL_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(replay).toMatchObject({
      applied: false,
      alreadyApplied: true,
      contentInvalidated: 0,
      linksUpdated: 0,
      sourcesCreated: 0,
      citationsEligible: true,
    });
    expect(state.patch).toHaveBeenCalledTimes(patchCalls);
    expect(state.insert).toHaveBeenCalledTimes(insertCalls);
  });
});

describe('UNICEF Seen, Counted, Included metadata exact CAS handlers', () => {
  it('reports the exact 2022 preimage and exactly two reverse consumers ready', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_400_000_000);
    const state = unicefContext();
    const result = await registeredHandler(preflightUnicef)(state.ctx, {
      releaseId: UNICEF_SEEN_COUNTED_METADATA_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(result).toMatchObject({
      phase: 'ready',
      blockers: [],
      sourceInitialExact: true,
      sourceYear: 2022,
      sourceReviewStatus: 'approved',
      reverseDependencyKeys: UNICEF_SEEN_COUNTED_REVERSE_KEYS,
      reverseDependenciesExact: true,
      contentsExact: true,
      linksExact: true,
      reviewsExact: true,
      mediaExact: true,
      lsnReviewRevision: 2,
      contentRowsChanged: 0,
    });
  });

  it.each([
    ['source', (state: ReturnType<typeof unicefContext>) => {
      state.tables.evidenceSources[0].year = 2020;
    }],
    ['content', (state: ReturnType<typeof unicefContext>) => {
      state.tables.libraryContent[0].reviewRevision = 3;
    }],
    ['link', (state: ReturnType<typeof unicefContext>) => {
      state.tables.evidenceLinks[0].sourceIds = ['drifted'];
    }],
    ['reverse dependency', (state: ReturnType<typeof unicefContext>) => {
      state.tables.evidenceLinks.push({
        _id: 'link:unexpected',
        _creationTime: 1,
        kind: 'guide',
        slug: 'unexpected',
        sourceIds: [UNICEF_SEEN_COUNTED_SOURCE_ID],
      });
    }],
    ['review history', (state: ReturnType<typeof unicefContext>) => {
      state.tables.contentReviews.pop();
    }],
    ['media', (state: ReturnType<typeof unicefContext>) => {
      state.tables.libraryMedia.pop();
    }],
  ] as const)('fails before every write on %s drift', async (_name, mutate) => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_400_000_000);
    const state = unicefContext();
    mutate(state);
    await expect(registeredHandler(applyUnicef)(state.ctx, {
      releaseId: UNICEF_SEEN_COUNTED_METADATA_RELEASE_ID,
    })).rejects.toThrow(/preflight blocked/);
    expect(state.patch).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalled();
  });

  it('updates only source metadata, resets source approval and replays idempotently', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_400_000_000);
    const state = unicefContext();
    const contentsBefore = structuredClone(state.tables.libraryContent);
    const linksBefore = structuredClone(state.tables.evidenceLinks);
    const reviewsBefore = structuredClone(state.tables.contentReviews);
    const mediaBefore = structuredClone(state.tables.libraryMedia);
    const result = await registeredHandler(applyUnicef)(state.ctx, {
      releaseId: UNICEF_SEEN_COUNTED_METADATA_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(result).toMatchObject({
      applied: true,
      alreadyApplied: false,
      sourcesUpdated: 1,
      sourceApprovalsReset: 1,
      contentRowsChanged: 0,
      reverseConsumersPreserved: 2,
      sourceCitationEligible: false,
      updatedAt: 1_787_400_000_000,
    });
    expect(state.tables.evidenceSources[0]).toMatchObject({
      sourceId: UNICEF_SEEN_COUNTED_SOURCE_ID,
      year: 2021,
      verifiedOn: '2026-08-23',
      reviewStatus: 'awaiting_review',
      reviewer: null,
      reviewDate: null,
      nextReviewDate: null,
    });
    expect(state.tables.evidenceSources[0]).not.toHaveProperty('reviewerId');
    expect(state.tables.evidenceSources[0]).not.toHaveProperty('reviewerQualification');
    expect(state.tables.evidenceSources[0]).not.toHaveProperty('reviewScope');
    expect(state.tables.evidenceSources[0]).not.toHaveProperty('reviewNote');
    expect(state.tables.libraryContent).toEqual(contentsBefore);
    expect(state.tables.evidenceLinks).toEqual(linksBefore);
    expect(state.tables.contentReviews).toEqual(reviewsBefore);
    expect(state.tables.libraryMedia).toEqual(mediaBefore);
    expect(state.tables.libraryContent.find((row) =>
      row.slug === 'lsn_special_needs_awareness')?.reviewRevision).toBe(2);
    const patchCalls = state.patch.mock.calls.length;
    const insertCalls = state.insert.mock.calls.length;
    const replay = await registeredHandler(applyUnicef)(state.ctx, {
      releaseId: UNICEF_SEEN_COUNTED_METADATA_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(replay).toMatchObject({
      applied: false,
      alreadyApplied: true,
      sourcesUpdated: 0,
      sourceApprovalsReset: 0,
      contentRowsChanged: 0,
      reverseConsumersPreserved: 2,
      sourceCitationEligible: false,
    });
    expect(state.patch).toHaveBeenCalledTimes(patchCalls);
    expect(state.insert).toHaveBeenCalledTimes(insertCalls);
  });
});

describe('clinical blocker generic-import server guards', () => {
  it('skips both protected source ids before every source-table read or write', async () => {
    const query = vi.fn(() => {
      throw new Error('protected source reached a database read');
    });
    const insert = vi.fn(async () => 'audit:source-guard');
    const sources = [
      SOURCE_BY_ID.get(NHS_SOOTHING_CRYING_BABY_SOURCE_ID),
      SOURCE_BY_ID.get(UNICEF_SEEN_COUNTED_SOURCE_ID),
    ].map((source) => {
      if (!source) throw new Error('authored source missing');
      return source;
    });
    const result = await registeredHandler(importSourcesFromCli)(
      { db: { query, insert } },
      { sources },
    ) as Record<string, unknown>;
    expect(result).toMatchObject({
      created: 0,
      updated: 0,
      unchanged: 0,
      skipped: 2,
      failed: 0,
    });
    expect(query).not.toHaveBeenCalled();
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert).not.toHaveBeenCalledWith('evidenceSources', expect.anything());
  });

  it('skips all three protected links before every link-table write', async () => {
    const query = vi.fn(() => ({
      take: async () => [],
      withIndex: () => ({ take: async () => [] }),
    }));
    const insert = vi.fn(async () => 'audit:link-guard');
    const links = [
      {
        kind: 'guide',
        slug: 'gd_birth_2m_emotional',
        sourceIds: [NHS_SOOTHING_CRYING_BABY_SOURCE_ID],
      },
      {
        kind: 'lesson',
        slug: 'lsn_special_needs_awareness',
        sourceIds: [UNICEF_SEEN_COUNTED_SOURCE_ID],
      },
      {
        kind: 'special_need',
        slug: 'sn_learning_disability',
        sourceIds: [UNICEF_SEEN_COUNTED_SOURCE_ID],
      },
    ];
    const result = await registeredHandler(importLinksFromCli)(
      { db: { query, insert } },
      { links },
    ) as Record<string, unknown>;
    expect(result).toMatchObject({
      created: 0,
      updated: 0,
      unchanged: 0,
      skipped: 3,
      failed: 0,
    });
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert).not.toHaveBeenCalledWith('evidenceLinks', expect.anything());
  });
});
