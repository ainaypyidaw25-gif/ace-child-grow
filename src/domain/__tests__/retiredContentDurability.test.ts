import { beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({ userId: 'owner-1' as string | null }));

vi.mock('@convex-dev/auth/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@convex-dev/auth/server')>();
  return {
    ...actual,
    getAuthUserId: vi.fn(async () => authState.userId),
  };
});

import {
  approveMedia,
  attachUploadedMedia,
  createStarterAnimationQueue,
  importSeed,
  setReview,
  updateDraft,
} from '../../../convex/library';
import { saveDecision } from '../../../convex/contentReviews';
import { requestReviews, setGovernance } from '../../../convex/ownerPriority';
import {
  contentIsParentReadable,
  parentReadableContentResult,
} from '../../../convex/lib/publicationVisibility';
import { STARTER_ANIMATION_SLUGS } from '../../../convex/animationPlan';
import {
  FLASH_CARDS_PRINTABLE_RETIREMENT_SLUG,
  isRetiredContentSlug,
} from '../../../convex/lib/contentRetirements';

type Row = Record<string, unknown> & { _id?: string };

const RETIRED_SLUG = 'ms_10_12m_self_help_1';

function retiredContent(overrides: Row = {}): Row {
  return {
    _id: 'content-retired',
    type: 'milestone',
    slug: RETIRED_SLUG,
    titleMm: 'ရပ်ဆိုင်းထားသော အကြောင်းအရာ',
    titleEn: 'Retired content',
    tags: [],
    data: {},
    source: 'historical source',
    version: 1,
    reviewRevision: 1,
    clinicalStatus: 'archived',
    searchText: 'retired content',
    createdAt: 1,
    updatedAt: 2,
    ...overrides,
  };
}

function testContext(options: {
  rows?: Record<string, Row[]>;
  byId?: Record<string, Row>;
} = {}) {
  const profile: Row = {
    _id: 'profile-owner',
    userId: 'owner-1',
    isStaff: true,
    staffRole: 'owner',
    staffQualification: 'MD',
    displayName: 'Owner Reviewer',
  };
  const tables: Record<string, Row[]> = {
    parentProfiles: [profile],
    ...(options.rows ?? {}),
  };
  const byId = new Map<string, Row>(Object.entries(options.byId ?? {}));
  for (const rows of Object.values(tables)) {
    for (const row of rows) if (row._id) byId.set(row._id, row);
  }
  const query = vi.fn((table: string) => {
    const conditions: Array<[string, unknown]> = [];
    const matching = () => (tables[table] ?? []).filter((row) =>
      conditions.every(([field, value]) => row[field] === value));
    const terminal = {
      collect: async () => matching(),
      take: async (count: number) => matching().slice(0, count),
      unique: async () => matching()[0] ?? null,
      order: () => terminal,
    };
    return {
      ...terminal,
      withIndex: (_name: string, callback: (q: {
        eq: (field: string, value: unknown) => unknown;
      }) => unknown) => {
        const q = {
          eq: (field: string, value: unknown): unknown => {
            conditions.push([field, value]);
            return q;
          },
        };
        callback(q);
        return terminal;
      },
    };
  });
  let inserted = 0;
  const insert = vi.fn(async (table: string, value: Row) => {
    const id = `${table}:inserted:${++inserted}`;
    const row = { ...value, _id: id };
    (tables[table] ??= []).push(row);
    byId.set(id, row);
    return id;
  });
  const patch = vi.fn(async (id: string, value: Row) => {
    const row = byId.get(id);
    if (row) Object.assign(row, value);
  });
  const systemGet = vi.fn(async () => ({ contentType: 'image/webp', size: 1_024 }));
  const storageDelete = vi.fn();
  return {
    auth: {},
    db: {
      query,
      get: vi.fn(async (id: string) => byId.get(id) ?? null),
      patch,
      insert,
      system: { get: systemGet },
    },
    storage: {
      delete: storageDelete,
      generateUploadUrl: vi.fn(),
      getUrl: vi.fn(),
    },
    tables,
    query,
    patch,
    insert,
    systemGet,
    storageDelete,
  };
}

function handler(fn: unknown) {
  return (fn as {
    _handler: (ctx: ReturnType<typeof testContext>, args: Record<string, unknown>) => Promise<unknown>;
  })._handler;
}

beforeEach(() => {
  authState.userId = 'owner-1';
});

describe('retired library content durability', () => {
  it('rejects wrong-type stale seed payloads by globally unique library slug', async () => {
    const state = testContext();
    const result = await handler(importSeed)(state, {
      items: [
        {
          type: 'guide',
          slug: RETIRED_SLUG,
          titleMm: 'stale',
          titleEn: 'stale',
          tags: [],
          source: 'stale client',
          version: 1,
          clinicalStatus: 'clinical_review',
          data: {},
          media: [{ kind: 'illustration' }],
          searchText: 'stale',
        },
        {
          type: 'milestone',
          slug: FLASH_CARDS_PRINTABLE_RETIREMENT_SLUG,
          titleMm: 'stale',
          titleEn: 'stale',
          tags: [],
          source: 'stale client',
          version: 1,
          clinicalStatus: 'clinical_review',
          data: {},
          media: [],
          searchText: 'stale',
        },
      ],
    });

    expect(result).toEqual({ created: 0, updated: 0, skippedApproved: 2, total: 2 });
    expect(state.query.mock.calls.some(([table]) => table === 'libraryContent')).toBe(false);
    expect(state.query.mock.calls.some(([table]) => table === 'libraryMedia')).toBe(false);
    expect(state.patch).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalledWith('libraryContent', expect.anything());
    expect(state.insert).not.toHaveBeenCalledWith('libraryMedia', expect.anything());
  });

  it('blocks wording edits before a retired row or edit log can be changed', async () => {
    const state = testContext();
    await expect(handler(updateDraft)(state, {
      slug: RETIRED_SLUG,
      titleMm: 'ပြင်ထားသည်',
      titleEn: 'Edited',
      data: {},
      expectedReviewRevision: 1,
    })).rejects.toThrow('Retired content is immutable');
    expect(state.query.mock.calls.some(([table]) => table === 'libraryContent')).toBe(false);
    expect(state.patch).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalledWith('contentEditLogs', expect.anything());
  });

  it.each(['draft', 'clinical_review', 'published'])('cannot transition retired content to %s', async (clinicalStatus) => {
    const state = testContext({ rows: { libraryContent: [retiredContent()] } });
    await expect(handler(setReview)(state, {
      slug: RETIRED_SLUG,
      clinicalStatus,
      expectedReviewRevision: 1,
    })).rejects.toThrow('Retired content is immutable');
    expect(state.patch).not.toHaveBeenCalled();
    expect(state.query.mock.calls.some(([table]) => table === 'contentReviews')).toBe(false);
    expect(state.query.mock.calls.some(([table]) => table === 'evidenceLinks')).toBe(false);
  });

  it('refuses and audits new review decisions without appending review history', async () => {
    const state = testContext({ rows: { libraryContent: [retiredContent()] } });
    const result = await handler(saveDecision)(state, {
      contentSlug: RETIRED_SLUG,
      dimension: 'english',
      decision: 'approved',
      expectedReviewRevision: 1,
    });
    expect(result).toMatchObject({ ok: false, code: 'retired_content' });
    expect(state.insert).toHaveBeenCalledWith('auditLogs', expect.objectContaining({
      result: 'rejected',
      summary: expect.stringContaining('retired_content'),
    }));
    expect(state.insert).not.toHaveBeenCalledWith('contentReviews', expect.anything());
    expect(state.patch).not.toHaveBeenCalled();
  });

  it('blocks media attachment and approval for retired content', async () => {
    const attachment = testContext();
    await expect(handler(attachUploadedMedia)(attachment, {
      contentSlug: RETIRED_SLUG,
      kind: 'illustration',
      storageId: 'storage-new',
      altMm: 'ပုံ',
      altEn: 'Image',
      rightsOwner: 'ACE Child Grow',
      licenseType: 'Original work',
      accessLevel: 'premium',
    })).rejects.toThrow('Retired content is immutable');
    expect(attachment.systemGet).not.toHaveBeenCalled();
    expect(attachment.patch).not.toHaveBeenCalled();
    expect(attachment.storageDelete).not.toHaveBeenCalled();

    const media = {
      _id: 'media-retired',
      contentSlug: RETIRED_SLUG,
      kind: 'illustration',
      storageId: 'storage-existing',
      placeholder: false,
      rightsOwner: 'ACE Child Grow',
      licenseType: 'Original work',
    };
    const approval = testContext({ byId: { 'media-retired': media } });
    await expect(handler(approveMedia)(approval, {
      mediaId: 'media-retired',
    })).rejects.toThrow('Retired content is immutable');
    expect(approval.patch).not.toHaveBeenCalled();
  });

  it('skips retired targets in the starter animation queue', async () => {
    const state = testContext();
    const result = await handler(createStarterAnimationQueue)(state, {});
    const retiredQueueTargets = STARTER_ANIMATION_SLUGS.filter(isRetiredContentSlug);
    const contentQueries = state.query.mock.calls.filter(([table]) => table === 'libraryContent');
    expect(retiredQueueTargets).toEqual([RETIRED_SLUG]);
    expect(contentQueries).toHaveLength(STARTER_ANIMATION_SLUGS.length - retiredQueueTargets.length);
    expect(result).toEqual({ created: 0, existing: 0 });
    expect(state.insert).not.toHaveBeenCalledWith('libraryMedia', expect.anything());
  });

  it('keeps retired content parent-invisible even if its stored status is published', async () => {
    const state = testContext();
    const row = retiredContent({ clinicalStatus: 'published' });
    await expect(contentIsParentReadable(state as never, row as never)).resolves.toBe(false);
    await expect(parentReadableContentResult(state as never, [row] as never)).resolves.toEqual({
      complete: true,
      rows: [],
    });
    expect(state.query).not.toHaveBeenCalled();
  });

  it('rejects owner governance and review-request writes for retired rows', async () => {
    const governance = testContext();
    await expect(handler(setGovernance)(governance, {
      slug: RETIRED_SLUG,
      expectedReviewRevision: 1,
      ownerPriority: 'P0',
    })).resolves.toMatchObject({ ok: false, code: 'retired_content' });
    expect(governance.patch).not.toHaveBeenCalled();
    expect(governance.query.mock.calls.some(([table]) => table === 'libraryContent')).toBe(false);

    const requests = testContext();
    await expect(handler(requestReviews)(requests, {
      slug: RETIRED_SLUG,
      expectedReviewRevision: 1,
      dimensions: ['english'],
    })).resolves.toMatchObject({ ok: false, code: 'retired_content' });
    expect(requests.patch).not.toHaveBeenCalled();
    expect(requests.query.mock.calls.some(([table]) => table === 'libraryContent')).toBe(false);
  });
});
