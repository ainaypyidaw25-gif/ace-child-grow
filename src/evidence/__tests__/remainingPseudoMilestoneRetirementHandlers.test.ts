import { afterEach, describe, expect, it, vi } from 'vitest';
import { apply, preflight } from '../../../convex/remainingPseudoMilestoneRetirement';
import { aiPublicationTargetKey } from '../../../convex/lib/aiPublicationPolicy';
import {
  REMAINING_PSEUDO_MILESTONE_RETIREMENT_RELEASE_ID,
  REMAINING_PSEUDO_MILESTONE_RETIREMENT_TARGETS,
} from '../../../convex/lib/remainingPseudoMilestoneRetirementData';

type Row = Record<string, unknown>;

function registeredHandler(fn: unknown) {
  return (fn as {
    _handler: (ctx: unknown, args: Record<string, unknown>) => Promise<unknown>;
  })._handler;
}

function exactContext() {
  const tables: Record<string, Row[]> = {
    libraryContent: [],
    evidenceLinks: [],
    libraryMedia: [],
    contentReviews: [],
    aiPublicationReleases: [],
    auditLogs: [],
  };
  const byId = new Map<string, Row>();

  for (const target of REMAINING_PSEUDO_MILESTONE_RETIREMENT_TARGETS) {
    const content: Row = {
      _id: target.id,
      _creationTime: 1,
      type: target.type,
      slug: target.slug,
      titleMm: `initial-mm:${target.slug}`,
      titleEn: `initial-en:${target.slug}`,
      tags: [],
      data: {},
      source: 'initial source',
      version: 1,
      clinicalStatus: target.expectedClinicalStatus,
      reviewRevision: target.expectedReviewRevision,
      searchText: `initial ${target.slug}`,
      createdAt: 1,
      updatedAt: target.expectedUpdatedAt,
    };
    const link: Row = {
      _id: target.linkId,
      _creationTime: 1,
      kind: target.type,
      slug: target.slug,
      sourceIds: [...target.expectedSourceIds],
      createdAt: 1,
      updatedAt: target.expectedLinkUpdatedAt,
    };
    const review: Row = {
      _id: `review:${target.slug}`,
      _creationTime: 1,
      contentSlug: target.slug,
      contentVersion: target.expectedReviewRevision,
      dimension: 'evidence',
      decision: 'changes_requested',
      reviewerId: 'user:reviewer',
      reviewerDisplayName: 'Reviewer',
      reviewerRole: 'evidence_reviewer',
      reviewedAt: 1,
      createdAt: 1,
      updatedAt: 1,
    };
    tables.libraryContent.push(content);
    tables.evidenceLinks.push(link);
    tables.contentReviews.push(review);
    byId.set(String(content._id), content);
    byId.set(String(link._id), link);
    byId.set(String(review._id), review);
    for (const expectedMedia of target.expectedMediaRows) {
      const media: Row = {
        _id: expectedMedia.id,
        _creationTime: expectedMedia.creationTime,
        contentSlug: expectedMedia.contentSlug,
        kind: expectedMedia.kind,
        accessLevel: expectedMedia.accessLevel,
        licenseType: expectedMedia.licenseType,
        note: expectedMedia.note,
        offline: expectedMedia.offline,
        placeholder: expectedMedia.placeholder,
        reviewStatus: expectedMedia.reviewStatus,
        rightsOwner: expectedMedia.rightsOwner,
        sortOrder: expectedMedia.sortOrder,
      };
      tables.libraryMedia.push(media);
      byId.set(String(media._id), media);
    }
  }

  const query = vi.fn((table: string) => {
    const terminal = (conditions: Array<[string, unknown]> = []) => {
      const filtered = () => (tables[table] ?? []).filter((row) => conditions.every(
        ([field, value]) => row[field] === value,
      ));
      return {
        unique: async () => filtered()[0] ?? null,
        take: async (count: number) => filtered().slice(0, count),
        collect: async () => filtered(),
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
    const id = `${table}:remaining:${++inserted}`;
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
  return {
    ctx: { db: { query, insert, patch } },
    tables,
    patch,
    insert,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('remaining pseudo-milestone exact retirement handlers', () => {
  it('reports the exact frozen production snapshot as ready', async () => {
    const state = exactContext();
    const result = await registeredHandler(preflight)(state.ctx, {
      releaseId: REMAINING_PSEUDO_MILESTONE_RETIREMENT_RELEASE_ID,
    }) as {
      phase: string;
      blockers: string[];
      targets: Array<{
        slug: string;
        initialMatches: boolean;
        localSeedExcluded: boolean;
        mediaRows: number;
        mediaIds: string[];
        mediaExact: boolean;
      }>;
    };
    expect(result.phase).toBe('ready');
    expect(result.blockers).toEqual([]);
    expect(result.targets).toHaveLength(23);
    expect(result.targets.every((target) => target.initialMatches)).toBe(true);
    expect(result.targets.every((target) => target.localSeedExcluded)).toBe(true);
    expect(result.targets.find((target) =>
      target.slug === 'ms_10_12m_self_help_1')).toMatchObject({
      mediaRows: 1,
      mediaIds: ['m17br3277rcvr1hemj8r0ffn1x8bcg53'],
      mediaExact: true,
    });
  });

  it.each([
    ['content timestamp', (state: ReturnType<typeof exactContext>) => {
      state.tables.libraryContent[0].updatedAt = 1;
    }],
    ['link array', (state: ReturnType<typeof exactContext>) => {
      state.tables.evidenceLinks[0].sourceIds = ['tampered-source'];
    }],
    ['media row', (state: ReturnType<typeof exactContext>) => {
      state.tables.libraryMedia.push({
        _id: 'media:unexpected',
        contentSlug: REMAINING_PSEUDO_MILESTONE_RETIREMENT_TARGETS[0].slug,
      });
    }],
    ['frozen media field', (state: ReturnType<typeof exactContext>) => {
      state.tables.libraryMedia[0].sortOrder = 99;
    }],
    ['content AI pointer', (state: ReturnType<typeof exactContext>) => {
      state.tables.libraryContent[0].aiPublicationReleaseId = 'unexpected-release';
    }],
    ['AI release row', (state: ReturnType<typeof exactContext>) => {
      const target = REMAINING_PSEUDO_MILESTONE_RETIREMENT_TARGETS[0];
      state.tables.aiPublicationReleases.push({
        _id: 'ai-release:unexpected',
        targetKey: aiPublicationTargetKey(target.type, target.slug),
      });
    }],
    ['review history overflow', (state: ReturnType<typeof exactContext>) => {
      const slug = REMAINING_PSEUDO_MILESTONE_RETIREMENT_TARGETS[0].slug;
      for (let index = 0; index < 100; index += 1) {
        state.tables.contentReviews.push({
          _id: `review:overflow:${index}`,
          contentSlug: slug,
        });
      }
    }],
    ['duplicate content row', (state: ReturnType<typeof exactContext>) => {
      state.tables.libraryContent.push({
        ...structuredClone(state.tables.libraryContent[0]),
        _id: 'content:duplicate',
      });
    }],
    ['duplicate link row', (state: ReturnType<typeof exactContext>) => {
      state.tables.evidenceLinks.push({
        ...structuredClone(state.tables.evidenceLinks[0]),
        _id: 'link:duplicate',
      });
    }],
  ] as const)('fails before every write on %s drift', async (_name, mutate) => {
    const state = exactContext();
    mutate(state);
    await expect(registeredHandler(apply)(state.ctx, {
      releaseId: REMAINING_PSEUDO_MILESTONE_RETIREMENT_RELEASE_ID,
    })).rejects.toThrow(/preflight blocked/);
    expect(state.patch).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalled();
  });

  it('atomically archives all 23 rows while preserving links, media and review history', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_315_200_000);
    const state = exactContext();
    const initialLinks = structuredClone(state.tables.evidenceLinks);
    const initialMedia = structuredClone(state.tables.libraryMedia);
    const initialReviews = structuredClone(state.tables.contentReviews);

    const result = await registeredHandler(apply)(state.ctx, {
      releaseId: REMAINING_PSEUDO_MILESTONE_RETIREMENT_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(result).toMatchObject({
      applied: true,
      alreadyApplied: false,
      retired: 23,
      publishedWithdrawn: 4,
      unpublishedArchived: 19,
      linksPreserved: 23,
      mediaPreserved: 1,
      reviewRowsPreserved: 23,
    });

    for (const target of REMAINING_PSEUDO_MILESTONE_RETIREMENT_TARGETS) {
      const content = state.tables.libraryContent.find((row) => row.slug === target.slug)!;
      expect(content.clinicalStatus, target.slug).toBe('archived');
      expect(content.reviewRevision, target.slug).toBe(target.expectedReviewRevision);
      expect(content.reviewNote, target.slug).toBe(
        `Retired by ${REMAINING_PSEUDO_MILESTONE_RETIREMENT_RELEASE_ID}`,
      );
      expect(content.aiPublicationReleaseId, target.slug).toBeUndefined();
      expect(content.aiPublishedAt, target.slug).toBeUndefined();
      expect(content.reviewerId, target.slug).toBeUndefined();
      expect(content.reviewerQualification, target.slug).toBeUndefined();
      expect(content.reviewerDisplayName, target.slug).toBeUndefined();
      expect(content.reviewScope, target.slug).toBeUndefined();
      expect(content.reviewedAt, target.slug).toBeUndefined();
      expect(content.nextReviewAt, target.slug).toBeUndefined();
      expect(content.updatedAt, target.slug).toBe(1_787_315_200_000);
    }
    expect(state.tables.evidenceLinks).toEqual(initialLinks);
    expect(state.tables.libraryMedia).toEqual(initialMedia);
    expect(state.tables.contentReviews).toEqual(initialReviews);
    expect(state.tables.auditLogs.some((row) =>
      row.action === 'release.remaining_pseudo_milestones'
        && row.summary === REMAINING_PSEUDO_MILESTONE_RETIREMENT_RELEASE_ID)).toBe(true);

    const patchCalls = state.patch.mock.calls.length;
    const second = await registeredHandler(apply)(state.ctx, {
      releaseId: REMAINING_PSEUDO_MILESTONE_RETIREMENT_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(second).toMatchObject({ applied: false, alreadyApplied: true, retired: 0 });
    expect(state.patch).toHaveBeenCalledTimes(patchCalls);
  });

  it.each([
    ['preserved link postimage', (state: ReturnType<typeof exactContext>) => {
      state.tables.evidenceLinks[0].updatedAt = 1;
    }],
    ['retirement timestamp', (state: ReturnType<typeof exactContext>) => {
      state.tables.libraryContent[0].updatedAt = 1;
    }],
    ['cleared reviewer metadata', (state: ReturnType<typeof exactContext>) => {
      state.tables.libraryContent[0].reviewerDisplayName = 'Unexpected reviewer';
    }],
    ['preserved media preimage', (state: ReturnType<typeof exactContext>) => {
      state.tables.libraryMedia[0].note = 'Unexpected media drift';
    }],
  ] as const)('blocks an idempotent replay when %s drifts', async (_name, mutate) => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_315_200_000);
    const state = exactContext();
    await registeredHandler(apply)(state.ctx, {
      releaseId: REMAINING_PSEUDO_MILESTONE_RETIREMENT_RELEASE_ID,
    });
    mutate(state);
    await expect(registeredHandler(apply)(state.ctx, {
      releaseId: REMAINING_PSEUDO_MILESTONE_RETIREMENT_RELEASE_ID,
    })).rejects.toThrow(/preflight blocked/);
  });
});
