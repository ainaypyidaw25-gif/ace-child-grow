import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../convex/lib/aiAuditHash', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../convex/lib/aiAuditHash')>();
  const initialReverseHashes: Record<number, string> = {
    96: '27f81cd95af69c573eb327a5a2d09e262dd748a993ebf80a34c39117e834353c',
    83: 'dde3d4f69a12e2e322a187afbb37fe24198bbf779f52b20a2186a286aa2d17a2',
    4: 'ea8d87d00eb26d5a996f46a1f4ea2a2a5da47f63a7caa34f994b832f84063a98',
    94: 'da88cca719cc2905b76dd6bac06cbd8230c297de2e2a9aec0056357d56a62b9d',
    24: '7c56850b982f31a488627b79d0aa697960400c59b2fdbf3f24347190961ef784',
    44: '11b7fd39ad77c603f8ce80631f526480ada63aed68a1e5ddcfd4223eaec38557',
    1: '34e66086ae3cd3db141ba1911f41b8a1475447bc40f7074eb6afe42163ef7ef7',
    8: 'b41e56e4ae6c383575057b2b253d0102d969a4953397dab5dfbd49fdc6b95945',
  };
  return {
    ...actual,
    sha256Canonical: vi.fn(async (value: unknown) => {
      if (Array.isArray(value) && value.length > 0
        && value.every((row) => Array.isArray((row as { sourceIds?: unknown }).sourceIds))) {
        const mocked = initialReverseHashes[value.length];
        if (mocked) return mocked;
      }
      const row = value as { __exactCanonicalSha256?: string };
      if (row?.__exactCanonicalSha256) return row.__exactCanonicalSha256;
      return actual.sha256Canonical(value);
    }),
  };
});

import { apply, preflight } from '../../../convex/gd10_12mPlayV5Cas';
import {
  GD10_12M_PLAY_V5_DESIRED_CONTENT,
  GD10_12M_PLAY_V5_DESIRED_SOURCE_IDS,
  GD10_12M_PLAY_V5_PREIMAGES,
  GD10_12M_PLAY_V5_RELEASE_ACTION,
  GD10_12M_PLAY_V5_RELEASE_ID,
  GD10_12M_PLAY_V5_REQUIRED_REVIEWS,
  GD10_12M_PLAY_V5_REVERSE_PREIMAGES,
  GD10_12M_PLAY_V5_REVIEW_PREIMAGES,
  GD10_12M_PLAY_V5_SOURCE_PREIMAGES,
  GD10_12M_PLAY_V5_TARGET,
} from '../../../convex/lib/gd10_12mPlayV5CasData';

type Row = Record<string, unknown>;

function registeredHandler(fn: unknown) {
  return (fn as {
    _handler: (ctx: unknown, args: Record<string, unknown>) => Promise<unknown>;
  })._handler;
}

function reverseLinkRows(): Row[] {
  const sourceIdsByKey = new Map<string, Set<string>>();
  for (const reverse of GD10_12M_PLAY_V5_REVERSE_PREIMAGES) {
    for (const key of reverse.keys) {
      const ids = sourceIdsByKey.get(key) ?? new Set<string>();
      ids.add(reverse.sourceId);
      sourceIdsByKey.set(key, ids);
    }
  }
  const rows: Row[] = [];
  for (const [key, sourceIds] of sourceIdsByKey) {
    const [kind, ...slugParts] = key.split(':');
    const slug = slugParts.join(':');
    if (key === `${GD10_12M_PLAY_V5_TARGET.kind}:${GD10_12M_PLAY_V5_TARGET.slug}`) {
      rows.push({
        ...structuredClone(GD10_12M_PLAY_V5_PREIMAGES.link),
        __exactCanonicalSha256:
          '62cf222cde440a66325cecb863a4275d4e3f9e61e9c3d986dc9ca3098b680fa9',
      });
    } else {
      rows.push({
        _id: `reverse:${key}`,
        _creationTime: rows.length + 1,
        kind,
        slug,
        sourceIds: [...sourceIds],
        createdAt: 1,
        updatedAt: 1,
      });
    }
  }
  return rows;
}

function exactContext() {
  const content = {
    ...structuredClone(GD10_12M_PLAY_V5_PREIMAGES.content),
    __exactCanonicalSha256:
      'f43fe0f62224588b54c6ee5a7f72c291fcd5923ecad101b78406e8591df40923',
  };
  const evidenceLinks = reverseLinkRows();
  const tables: Record<string, Row[]> = {
    libraryContent: [content],
    evidenceLinks,
    evidenceSources: GD10_12M_PLAY_V5_SOURCE_PREIMAGES.map((expected) => ({
      ...structuredClone(expected.document),
      __exactCanonicalSha256: expected.exactCanonicalSha256,
    })),
    contentReviews: GD10_12M_PLAY_V5_REVIEW_PREIMAGES.map((expected) => ({
      ...structuredClone(expected.document),
      __exactCanonicalSha256: expected.exactCanonicalSha256,
    })),
    libraryMedia: [],
    aiContentAudits: [],
    aiEvidenceAudits: [],
    aiPublicationReleases: [],
    aiAuditRuns: [],
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
    const id = `${table}:gd10-play-v5:${++inserted}`;
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

describe('gd_10_12m_play v5 exact CAS handlers', () => {
  it('reports the complete exact preimage as ready without writes', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_544_000_000);
    const state = exactContext();
    const result = await registeredHandler(preflight)(state.ctx, {
      releaseId: GD10_12M_PLAY_V5_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(result).toMatchObject({
      phase: 'ready',
      blockers: [],
      contentInitialExact: true,
      linkInitialExact: true,
      sourceRows: 8,
      sourcesExact: true,
      citationsEligible: true,
      reviewRows: 5,
      reviewsExact: true,
      revision4ReviewRows: 0,
      revision5ReviewRows: 0,
      mediaRows: 0,
      aiContentAuditRows: 0,
      aiEvidenceAuditRows: 0,
      aiPublicationReleaseRows: 0,
      aiAuditRunRows: 0,
      allLinksBounded: true,
      outstandingRequiredReviews: GD10_12M_PLAY_V5_REQUIRED_REVIEWS,
    });
    expect(state.patch).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalled();
  });

  it.each([
    ['content', (state: ReturnType<typeof exactContext>) => {
      state.tables.libraryContent[0].__exactCanonicalSha256 = '0'.repeat(64);
    }],
    ['ordered link', (state: ReturnType<typeof exactContext>) => {
      const link = state.tables.evidenceLinks.find((row) => row.slug === 'gd_10_12m_play')!;
      link.sourceIds = ['drifted'];
    }],
    ['source', (state: ReturnType<typeof exactContext>) => {
      state.tables.evidenceSources[0].__exactCanonicalSha256 = '0'.repeat(64);
    }],
    ['review history', (state: ReturnType<typeof exactContext>) => {
      state.tables.contentReviews.pop();
    }],
    ['media', (state: ReturnType<typeof exactContext>) => {
      state.tables.libraryMedia.push({ _id: 'media:drift', contentSlug: 'gd_10_12m_play' });
    }],
    ['reverse graph', (state: ReturnType<typeof exactContext>) => {
      state.tables.evidenceLinks.push({
        _id: 'reverse:drift', kind: 'guide', slug: 'drift',
        sourceIds: ['cpsc-childproofing-home-2023'],
      });
    }],
    ['content AI', (state: ReturnType<typeof exactContext>) => {
      state.tables.aiContentAudits.push({
        _id: 'content-ai', contentSlug: 'gd_10_12m_play', runId: 'run:content',
      });
    }],
    ['evidence AI', (state: ReturnType<typeof exactContext>) => {
      state.tables.aiEvidenceAudits.push({
        _id: 'evidence-ai', sourceId: 'hc-choking-prevention-2026', runId: 'run:evidence',
      });
    }],
    ['AI release', (state: ReturnType<typeof exactContext>) => {
      state.tables.aiPublicationReleases.push({
        _id: 'ai-release',
        targetKey: 'guide:gd_10_12m_play',
        contentAuditRunId: 'run:content',
        sourceSnapshots: [],
      });
    }],
    ['release audit', (state: ReturnType<typeof exactContext>) => {
      state.tables.auditLogs.push({
        _id: 'audit:drift', action: GD10_12M_PLAY_V5_RELEASE_ACTION,
      });
    }],
  ] as const)('fails before every write when %s drifts', async (_name, mutate) => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_544_000_000);
    const state = exactContext();
    mutate(state);
    await expect(registeredHandler(apply)(state.ctx, {
      releaseId: GD10_12M_PLAY_V5_RELEASE_ID,
    })).rejects.toThrow(/preflight blocked/);
    expect(state.patch).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalled();
  });

  it('atomically writes rev5, preserves frozen rows, and replays with zero writes', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_544_000_000);
    const state = exactContext();
    const sourcesBefore = structuredClone(state.tables.evidenceSources);
    const reviewsBefore = structuredClone(state.tables.contentReviews);
    const mediaBefore = structuredClone(state.tables.libraryMedia);

    const result = await registeredHandler(apply)(state.ctx, {
      releaseId: GD10_12M_PLAY_V5_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(result).toMatchObject({
      applied: true,
      alreadyApplied: false,
      contentUpdated: 1,
      linksUpdated: 1,
      sourcesPreserved: 8,
      reviewsPreserved: 5,
      mediaPreserved: 0,
      requiredFreshReviews: 6,
      publicationDecisionMade: false,
      aiRecordsCreated: 0,
      updatedAt: 1_787_544_000_000,
    });
    expect(state.tables.libraryContent[0]).toMatchObject({
      data: GD10_12M_PLAY_V5_DESIRED_CONTENT.data,
      searchText: GD10_12M_PLAY_V5_DESIRED_CONTENT.searchText,
      clinicalStatus: 'clinical_review',
      reviewRevision: 5,
      requiredReviewDimensions: GD10_12M_PLAY_V5_REQUIRED_REVIEWS,
      updatedAt: 1_787_544_000_000,
    });
    expect(state.tables.evidenceLinks.find((row) => row.slug === 'gd_10_12m_play'))
      .toMatchObject({
        sourceIds: GD10_12M_PLAY_V5_DESIRED_SOURCE_IDS,
        updatedAt: 1_787_544_000_000,
      });
    expect(state.tables.evidenceSources).toEqual(sourcesBefore);
    expect(state.tables.contentReviews).toEqual(reviewsBefore);
    expect(state.tables.libraryMedia).toEqual(mediaBefore);
    expect(state.tables.aiContentAudits).toEqual([]);
    expect(state.tables.aiEvidenceAudits).toEqual([]);
    expect(state.tables.aiPublicationReleases).toEqual([]);
    expect(state.tables.auditLogs).toHaveLength(1);
    expect(String(state.tables.auditLogs[0].after)).toContain('"publicationDecision":"not_made"');

    const patchCalls = state.patch.mock.calls.length;
    const insertCalls = state.insert.mock.calls.length;
    const replay = await registeredHandler(apply)(state.ctx, {
      releaseId: GD10_12M_PLAY_V5_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(replay).toMatchObject({ applied: false, alreadyApplied: true });
    expect(state.patch).toHaveBeenCalledTimes(patchCalls);
    expect(state.insert).toHaveBeenCalledTimes(insertCalls);
  });
});
