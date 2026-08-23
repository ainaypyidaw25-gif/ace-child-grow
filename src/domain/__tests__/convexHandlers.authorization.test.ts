import { beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({ userId: null as string | null }));

vi.mock('@convex-dev/auth/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@convex-dev/auth/server')>();
  return {
    ...actual,
    getAuthUserId: vi.fn(async () => authState.userId),
  };
});

import { list as listChildren, update as updateChild } from '../../../convex/children';
import { importSeed, listByType, setReview as setLibraryReview, updateDraft } from '../../../convex/library';
import { activity as reviewerActivity, listForContent as listContentReviews, saveDecision } from '../../../convex/contentReviews';
import {
  forContent as evidenceForContent,
  importLinks,
  importSources,
  setReview as setEvidenceReview,
} from '../../../convex/evidence';
import { transition as transitionContent } from '../../../convex/content';
import { listSessions, recordSession } from '../../../convex/milestones';
import { complete as completeActivity, list as listActivities } from '../../../convex/activities';
import { claimInvite, createInvite, setOwnDisplayName } from '../../../convex/admin';
import { seedRunSkipsItem } from '../../../convex/seed';
import {
  BRIGHT_FUTURES_DUPLICATE_MILESTONE_RETIREMENT_TARGET,
  DUPLICATE_MILESTONE_SLUGS,
  FLASH_CARDS_PRINTABLE_RETIREMENT_SLUG,
  MOTOR_PSEUDO_MILESTONE_RETIREMENT_SLUGS,
  NUTRITION_PSEUDO_MILESTONE_RETIREMENT_SLUGS,
  PLAY_PSEUDO_MILESTONE_RETIREMENT_SLUGS,
  REMAINING_PSEUDO_MILESTONE_RETIREMENT_SLUGS,
  SLEEP_PSEUDO_MILESTONE_RETIREMENT_SLUGS,
  SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_SLUGS,
} from '../../../convex/lib/contentRetirements';
import {
  INHERENT_PUBLIC_LINK_CAS_TARGETS,
} from '../../../convex/lib/inherentPublicLinkCasData';
import {
  SWAIMAN_SEIZURE_LINK_CAS_TARGET,
} from '../../../convex/lib/swaimanSeizureLinkCasData';
import {
  SWAIMAN_CEREBRAL_PALSY_TARGET,
} from '../../../convex/lib/swaimanCerebralPalsyLinkCasData';
import {
  ASQ_DOCTOR_VISITS_TARGET,
} from '../../../convex/lib/asqDoctorVisitsLinkCasData';
import {
  BIRTH2M_NUTRITION_TARGET,
} from '../../../convex/lib/birth2mNutritionCasData';
import {
  BIRTH2M_GROSS_MOTOR_CORRECTION_TARGET,
} from '../../../convex/lib/birth2mGrossMotorCorrection';
import {
  SWAIMAN_SUDDEN_WEAKNESS_SOURCE_ID,
  SWAIMAN_SUDDEN_WEAKNESS_TARGET,
} from '../../../convex/lib/swaimanSuddenWeaknessCasData';
import {
  MANUAL_REVIEW_CONTENT_TARGETS,
} from '../../../convex/lib/manualReviewContentCasData';
import {
  OLDER_SAFETY_2026_STAGED_SOURCES,
  OLDER_SAFETY_2026_TARGETS,
} from '../../../convex/lib/olderSafety2026CasData';

const RETIRED_SERVER_GUARD_ITEMS = [
  ...[
    ...DUPLICATE_MILESTONE_SLUGS,
    ...SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_SLUGS,
    BRIGHT_FUTURES_DUPLICATE_MILESTONE_RETIREMENT_TARGET.slug,
    ...PLAY_PSEUDO_MILESTONE_RETIREMENT_SLUGS,
    ...NUTRITION_PSEUDO_MILESTONE_RETIREMENT_SLUGS,
    ...SLEEP_PSEUDO_MILESTONE_RETIREMENT_SLUGS,
    ...MOTOR_PSEUDO_MILESTONE_RETIREMENT_SLUGS,
    ...REMAINING_PSEUDO_MILESTONE_RETIREMENT_SLUGS,
  ].map((slug) => ({ type: 'milestone', slug })),
  { type: 'printable', slug: FLASH_CARDS_PRINTABLE_RETIREMENT_SLUG },
] as const;

type Row = Record<string, unknown> & { _id?: string };

function ctx(options: {
  rows?: Record<string, Row[]>;
  get?: Row | null;
  profile?: Row | null;
} = {}) {
  const patch = vi.fn();
  const insert = vi.fn(async (table: string) => table === 'milestoneSessions'
    ? 'session-1'
    : table === 'activityCompletions' ? 'completion-1' : 'insert-1');
  const query = vi.fn((table: string) => {
    const rows = options.rows?.[table] ?? [];
    const clauses: Array<[string, unknown]> = [];
    const matching = () => rows.filter((row) =>
      clauses.every(([field, value]) => row[field] === value));
    const terminal: {
      collect: () => Promise<Row[]>;
      take: (count: number) => Promise<Row[]>;
      unique: () => Promise<Row | null>;
      order?: (direction: 'asc' | 'desc') => unknown;
    } = {
      collect: async () => matching(),
      take: async (count: number) => matching().slice(0, count),
      unique: async () => table === 'parentProfiles' ? options.profile ?? null : matching()[0] ?? null,
    };
    terminal.order = () => terminal;
    return {
      ...terminal,
      withIndex: (_name: string, callback: (q: { eq: (field: string, value: unknown) => unknown }) => unknown) => {
        const q = { eq: (field: string, value: unknown): unknown => {
          clauses.push([field, value]);
          return q;
        } };
        callback(q);
        return terminal;
      },
    };
  });
  return {
    auth: {},
    db: {
      query,
      get: vi.fn(async () => options.get ?? null),
      patch,
      insert,
    },
    storage: {},
  };
}

function approvedEvidenceRows(slug: string, kind = 'guide'): Record<string, Row[]> {
  return {
    evidenceLinks: [{ kind, slug, sourceIds: ['approved-current-source'] }],
    evidenceSources: [{
      _id: 'evidence-1', sourceId: 'approved-current-source', reviewStatus: 'approved',
      evidenceLevel: 'guideline', year: 2025, reviewDate: '2026-08-01',
      nextReviewDate: '2028-08-01', verifiedOn: '2026-08-01',
    }],
  };
}

function handler(fn: unknown): (context: ReturnType<typeof ctx>, args: Record<string, unknown>) => Promise<unknown> {
  return (fn as { _handler: (context: ReturnType<typeof ctx>, args: Record<string, unknown>) => Promise<unknown> })._handler;
}

describe('Convex registered handlers enforce authorization', () => {
  beforeEach(() => {
    authState.userId = null;
  });

  it('children.list returns no private rows and performs no database read when unauthenticated', async () => {
    const context = ctx({ rows: { children: [{ _id: 'child-1', userId: 'user-1', nickname: 'Private' }] } });
    await expect(handler(listChildren)(context, {})).resolves.toEqual([]);
    expect(context.db.query).not.toHaveBeenCalled();
  });

  it('children.update rejects a different owner and performs no patch', async () => {
    authState.userId = 'user-1';
    const context = ctx({ get: { _id: 'child-2', userId: 'user-2' } });
    await expect(handler(updateChild)(context, {
      id: 'child-2' as never,
      nickname: 'Changed',
      birthDate: '2024-01-01',
      useCorrectedAge: false,
    })).rejects.toThrow('Not found');
    expect(context.db.patch).not.toHaveBeenCalled();
  });

  it('non-staff catalogue includes published rows only and contains no private fields', async () => {
    authState.userId = 'user-1';
    const published = {
      _id: 'content-1',
      slug: 'safe-public',
      type: 'activity',
      clinicalStatus: 'published',
      titleMm: 'အများသုံး',
      titleEn: 'Public',
    };
    const reviewPending = {
      _id: 'content-2',
      slug: 'review-pending',
      type: 'activity',
      clinicalStatus: 'clinical_review',
      titleMm: 'စိစစ်ဆဲ',
      titleEn: 'Review pending',
    };
    const archived = {
      _id: 'content-3',
      slug: 'archived-item',
      type: 'activity',
      clinicalStatus: 'archived',
      titleMm: 'သိမ်းဆည်းထား',
      titleEn: 'Archived',
    };
    const context = ctx({
      profile: { userId: 'user-1', isStaff: false },
      rows: {
        libraryContent: [published, reviewPending, archived],
        ...approvedEvidenceRows('safe-public', 'activity'),
      },
    });
    const result = await handler(listByType)(context, { type: 'activity' });
    expect(result).toEqual({
      staff: false,
      items: [{ ...published, publicationLane: 'human_reviewed' }],
    });
    expect(JSON.stringify(result)).not.toMatch(/childId|birthDate|nickname|userId/);
  });

  it('normal users cannot invoke the seed importer', async () => {
    authState.userId = 'user-1';
    const context = ctx({ profile: { userId: 'user-1', isStaff: false } });
    await expect(handler(importSeed)(context, { items: [] })).rejects.toThrow('Insufficient staff permission');
  });

  it('an owner can create an email-bound invite before the recipient has an account', async () => {
    authState.userId = 'owner-1';
    const context = ctx({
      profile: { userId: 'owner-1', isStaff: true, staffRole: 'owner', displayName: 'Owner' },
      rows: { users: [], staffInvites: [] },
    });
    await expect(handler(createInvite)(context, {
      email: 'new.reviewer@example.com', displayName: 'New Reviewer', role: 'language_reviewer',
    })).resolves.toMatchObject({ email: 'new.reviewer@example.com' });
    expect(context.db.insert).toHaveBeenCalledWith('staffInvites', expect.objectContaining({
      email: 'new.reviewer@example.com', role: 'language_reviewer', status: 'pending',
    }));
    expect(context.db.insert).not.toHaveBeenCalledWith('staffInvites', expect.objectContaining({
      targetUserId: expect.anything(),
    }));
  });

  it('a newly-created exact-email account can claim a pre-signup invite', async () => {
    authState.userId = 'reviewer-1';
    const subtle = crypto.subtle;
    const code = 'test-invite-code';
    const digest = await subtle.digest('SHA-256', new TextEncoder().encode(code));
    const codeHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
    const context = ctx({
      get: { _id: 'reviewer-1', email: 'new.reviewer@example.com' },
      rows: { staffInvites: [{
        _id: 'invite-1', email: 'new.reviewer@example.com', displayName: 'New Reviewer',
        role: 'language_reviewer', codeHash, status: 'pending', expiresAt: Date.now() + 60_000,
      }] },
    });
    await expect(handler(claimInvite)(context, { inviteCode: code })).resolves.toMatchObject({
      ok: true, role: 'language_reviewer',
    });
    expect(context.db.insert).toHaveBeenCalledWith('parentProfiles', expect.objectContaining({
      userId: 'reviewer-1', isStaff: true, staffRole: 'language_reviewer',
    }));
  });

  it('a seed refresh cannot reuse review metadata from the prior content revision', async () => {
    authState.userId = 'editor-1';
    const context = ctx({
      profile: { userId: 'editor-1', isStaff: true, staffRole: 'content_editor' },
      rows: { libraryContent: [{
        _id: 'content-1', slug: 'item-1', clinicalStatus: 'clinical_review', reviewRevision: 7,
        reviewerDisplayName: 'Prior reviewer',
      }] },
    });
    await handler(importSeed)(context, { items: [{
      type: 'guide', slug: 'item-1', titleMm: 'အသစ်', titleEn: 'New', tags: [],
      source: 'seed', version: 1, clinicalStatus: 'clinical_review', data: {}, media: [], searchText: 'new',
    }] });
    expect(context.db.patch).toHaveBeenCalledWith('content-1', expect.objectContaining({
      reviewRevision: 8, reviewerDisplayName: undefined, reviewScope: undefined,
    }));
  });

  it('broad staff and CLI seed paths skip the eight exact manual-review CAS targets', async () => {
    authState.userId = 'editor-1';
    const context = ctx({
      profile: { userId: 'editor-1', isStaff: true, staffRole: 'content_editor' },
    });
    const items = MANUAL_REVIEW_CONTENT_TARGETS.map((target) => ({
      type: target.type,
      slug: target.slug,
      titleMm: 'stale',
      titleEn: 'stale',
      tags: [],
      source: 'stale broad seed',
      version: 1,
      clinicalStatus: 'clinical_review',
      data: {},
      media: [{ kind: 'illustration' }],
      searchText: 'stale',
    }));

    const result = await handler(importSeed)(context, { items }) as Record<string, number>;
    expect(result).toEqual({ created: 0, updated: 0, skippedApproved: 8, total: 8 });
    expect(context.db.query).not.toHaveBeenCalledWith('libraryContent');
    expect(context.db.query).not.toHaveBeenCalledWith('libraryMedia');
    expect(context.db.patch).not.toHaveBeenCalled();
    expect(context.db.insert).not.toHaveBeenCalledWith('libraryContent', expect.anything());
    expect(context.db.insert).not.toHaveBeenCalledWith('libraryMedia', expect.anything());
    for (const item of items) expect(seedRunSkipsItem(item)).toBe(true);
  });

  it('broad staff and CLI seed paths reserve the nutrition correction for exact CAS only', async () => {
    authState.userId = 'editor-1';
    const context = ctx({
      profile: { userId: 'editor-1', isStaff: true, staffRole: 'content_editor' },
    });
    const stale = {
      type: BIRTH2M_NUTRITION_TARGET.kind,
      slug: BIRTH2M_NUTRITION_TARGET.slug,
      titleMm: 'stale',
      titleEn: 'stale',
      tags: [],
      source: 'stale broad seed',
      version: 1,
      clinicalStatus: 'clinical_review',
      data: {},
      media: [{ kind: 'illustration' }],
      searchText: 'stale',
    };

    await expect(handler(importSeed)(context, { items: [stale] })).resolves.toEqual({
      created: 0,
      updated: 0,
      skippedApproved: 1,
      total: 1,
    });
    expect(seedRunSkipsItem(stale)).toBe(true);
    expect(context.db.query).not.toHaveBeenCalledWith('libraryContent');
    expect(context.db.patch).not.toHaveBeenCalled();
    expect(context.db.insert).not.toHaveBeenCalledWith('libraryContent', expect.anything());
  });

  it('reserves the birth-to-2-month gross-motor correction at every broad import boundary', async () => {
    authState.userId = 'editor-1';
    const context = ctx({
      profile: { userId: 'editor-1', isStaff: true, staffRole: 'content_editor' },
      rows: { evidenceSources: [] },
    });
    const stale = {
      type: BIRTH2M_GROSS_MOTOR_CORRECTION_TARGET.kind,
      slug: BIRTH2M_GROSS_MOTOR_CORRECTION_TARGET.slug,
      titleMm: 'stale',
      titleEn: 'stale',
      tags: [],
      source: 'stale broad seed',
      version: 1,
      clinicalStatus: 'clinical_review',
      data: {},
      media: [{ kind: 'illustration' }],
      searchText: 'stale',
    };

    await expect(handler(importSeed)(context, { items: [stale] })).resolves.toEqual({
      created: 0,
      updated: 0,
      skippedApproved: 1,
      total: 1,
    });
    expect(seedRunSkipsItem(stale)).toBe(true);

    await expect(handler(importLinks)(context, { links: [{
      kind: BIRTH2M_GROSS_MOTOR_CORRECTION_TARGET.kind,
      slug: BIRTH2M_GROSS_MOTOR_CORRECTION_TARGET.slug,
      sourceIds: ['stale-or-unknown-source'],
    }] })).resolves.toMatchObject({
      created: 0,
      updated: 0,
      unchanged: 0,
      skipped: 1,
      failed: 0,
    });

    await expect(handler(importSources)(context, { sources: [{
      id: BIRTH2M_GROSS_MOTOR_CORRECTION_TARGET.exactSourceId,
      org: 'Centers for Disease Control and Prevention',
      orgKey: 'CDC',
      title: 'stale',
      authors: null,
      year: 2026,
      edition: null,
      country: 'United States',
      language: 'en',
      url: 'https://example.invalid/stale',
      doi: null,
      isbn: null,
      pmid: null,
      evidenceLevel: 'parent_education',
      reviewStatus: 'awaiting_review',
      reviewer: null,
      reviewDate: null,
      nextReviewDate: null,
      keywords: [],
      topics: [],
      ageMonthsMin: 2,
      ageMonthsMax: 2,
      verifiedOn: '2026-08-22',
      verifiedNote: 'stale generic import must be skipped',
    }] })).resolves.toMatchObject({
      created: 0,
      updated: 0,
      unchanged: 0,
      reviewReset: 0,
      skipped: 1,
      failed: 0,
    });

    expect(context.db.query).not.toHaveBeenCalledWith('libraryContent');
    expect(context.db.query).not.toHaveBeenCalledWith('evidenceLinks');
    expect(context.db.patch).not.toHaveBeenCalled();
    expect(context.db.insert).not.toHaveBeenCalledWith('libraryContent', expect.anything());
    expect(context.db.insert).not.toHaveBeenCalledWith('evidenceLinks', expect.anything());
    expect(context.db.insert).not.toHaveBeenCalledWith('evidenceSources', expect.anything());
  });

  it('reserves all nine older-safety rows and three source records for exact CAS only', async () => {
    authState.userId = 'editor-1';
    const context = ctx({
      profile: { userId: 'editor-1', isStaff: true, staffRole: 'content_editor' },
      rows: { evidenceSources: [] },
    });
    const items = OLDER_SAFETY_2026_TARGETS.map((target) => ({
      type: target.kind,
      slug: target.slug,
      titleMm: 'stale',
      titleEn: 'stale',
      tags: [],
      source: 'stale broad seed',
      version: 1,
      clinicalStatus: 'clinical_review',
      data: {},
      media: [{ kind: 'illustration' }],
      searchText: 'stale',
    }));

    await expect(handler(importSeed)(context, { items })).resolves.toEqual({
      created: 0,
      updated: 0,
      skippedApproved: 9,
      total: 9,
    });
    await expect(handler(importLinks)(context, { links:
      OLDER_SAFETY_2026_TARGETS.map((target) => ({
        kind: target.kind,
        slug: target.slug,
        sourceIds: ['stale-or-unknown-source'],
      })),
    })).resolves.toMatchObject({
      created: 0,
      updated: 0,
      unchanged: 0,
      skipped: 9,
      failed: 0,
    });
    await expect(handler(importSources)(context, { sources:
      OLDER_SAFETY_2026_STAGED_SOURCES.map((source) => ({
        ...source,
        id: source.sourceId,
        reviewStatus: 'awaiting_review',
        reviewer: null,
        reviewDate: null,
        nextReviewDate: null,
        keywords: [...source.keywords],
        topics: [...source.topics],
      })),
    })).resolves.toMatchObject({
      created: 0,
      updated: 0,
      unchanged: 0,
      reviewReset: 0,
      skipped: 3,
      failed: 0,
    });

    expect(context.db.query).not.toHaveBeenCalledWith('libraryContent');
    expect(context.db.query).not.toHaveBeenCalledWith('evidenceLinks');
    expect(context.db.patch).not.toHaveBeenCalled();
    expect(context.db.insert).not.toHaveBeenCalledWith('libraryContent', expect.anything());
    expect(context.db.insert).not.toHaveBeenCalledWith('evidenceLinks', expect.anything());
    expect(context.db.insert).not.toHaveBeenCalledWith('evidenceSources', expect.anything());
  });

  it('the server seed boundary skips retired content before any catalogue or media write', async () => {
    authState.userId = 'editor-1';
    const context = ctx({
      profile: { userId: 'editor-1', isStaff: true, staffRole: 'content_editor' },
    });
    const result = await handler(importSeed)(context, { items:
      RETIRED_SERVER_GUARD_ITEMS.map(({ type, slug }) => ({
        type,
        slug,
        titleMm: 'retired',
        titleEn: 'retired',
        tags: [],
        source: 'stale client',
        version: 1,
        clinicalStatus: 'clinical_review',
        data: {},
        media: [{ kind: 'illustration' }],
        searchText: 'retired',
      })),
    }) as Record<string, number>;

    expect(RETIRED_SERVER_GUARD_ITEMS).toHaveLength(57);
    expect(result).toEqual({ created: 0, updated: 0, skippedApproved: 57, total: 57 });
    expect(context.db.query).not.toHaveBeenCalledWith('libraryContent');
    expect(context.db.query).not.toHaveBeenCalledWith('libraryMedia');
    expect(context.db.patch).not.toHaveBeenCalled();
    expect(context.db.insert).not.toHaveBeenCalledWith(
      'libraryContent', expect.anything(),
    );
    expect(context.db.insert).not.toHaveBeenCalledWith(
      'libraryMedia', expect.anything(),
    );
  });

  it('the server seed boundary rejects retired slugs even when a stale client lies about type', async () => {
    authState.userId = 'editor-1';
    const context = ctx({
      profile: { userId: 'editor-1', isStaff: true, staffRole: 'content_editor' },
    });
    const result = await handler(importSeed)(context, { items: [{
      type: 'guide',
      slug: REMAINING_PSEUDO_MILESTONE_RETIREMENT_SLUGS[0],
      titleMm: 'retired',
      titleEn: 'retired',
      tags: [],
      source: 'stale client with wrong type',
      version: 1,
      clinicalStatus: 'clinical_review',
      data: {},
      media: [{ kind: 'illustration' }],
      searchText: 'retired',
    }] }) as Record<string, number>;

    expect(result).toEqual({ created: 0, updated: 0, skippedApproved: 1, total: 1 });
    expect(context.db.query).not.toHaveBeenCalledWith('libraryContent');
    expect(context.db.query).not.toHaveBeenCalledWith('libraryMedia');
    expect(context.db.patch).not.toHaveBeenCalled();
    expect(context.db.insert).not.toHaveBeenCalledWith('libraryContent', expect.anything());
    expect(context.db.insert).not.toHaveBeenCalledWith('libraryMedia', expect.anything());
  });

  it('the internal CLI seed path applies the same all-57 server guard', () => {
    expect(RETIRED_SERVER_GUARD_ITEMS).toHaveLength(57);
    for (const item of RETIRED_SERVER_GUARD_ITEMS) {
      expect(seedRunSkipsItem(item), `${item.type}:${item.slug}`).toBe(true);
    }
    expect(seedRunSkipsItem({
      type: 'guide',
      slug: REMAINING_PSEUDO_MILESTONE_RETIREMENT_SLUGS[0],
    })).toBe(true);
    expect(seedRunSkipsItem({ type: 'guide', slug: 'gd_active_example' })).toBe(false);
  });

  it('the server evidence-link boundary skips retired keys without link writes', async () => {
    authState.userId = 'editor-1';
    const context = ctx({
      profile: { userId: 'editor-1', isStaff: true, staffRole: 'content_editor' },
      rows: { evidenceSources: [] },
    });
    const result = await handler(importLinks)(context, { links:
      RETIRED_SERVER_GUARD_ITEMS.map(({ type, slug }, index) => ({
        kind: type,
        slug,
        sourceIds: index % 2 === 0 ? ['stale-unknown-source'] : [],
      })),
    }) as Record<string, unknown>;

    expect(result).toMatchObject({
      created: 0,
      updated: 0,
      unchanged: 0,
      skipped: 57,
      failed: 0,
      failedKeys: [],
      invalidatedContentKeys: [],
    });
    expect(context.db.query).not.toHaveBeenCalledWith('evidenceLinks');
    expect(context.db.patch).not.toHaveBeenCalled();
    expect(context.db.insert).not.toHaveBeenCalledWith(
      'evidenceLinks', expect.anything(),
    );
  });

  it('the evidence boundary also rejects a retired slug submitted under the wrong kind', async () => {
    authState.userId = 'editor-1';
    const context = ctx({
      profile: { userId: 'editor-1', isStaff: true, staffRole: 'content_editor' },
      rows: { evidenceSources: [] },
    });
    const result = await handler(importLinks)(context, { links: [{
      kind: 'guide',
      slug: REMAINING_PSEUDO_MILESTONE_RETIREMENT_SLUGS[0],
      sourceIds: ['stale-unknown-source'],
    }] }) as Record<string, unknown>;

    expect(result).toMatchObject({
      created: 0,
      updated: 0,
      unchanged: 0,
      skipped: 1,
      failed: 0,
      failedKeys: [],
      invalidatedContentKeys: [],
    });
    expect(context.db.query).not.toHaveBeenCalledWith('evidenceLinks');
    expect(context.db.patch).not.toHaveBeenCalled();
    expect(context.db.insert).not.toHaveBeenCalledWith('evidenceLinks', expect.anything());
  });

  it('the evidence boundary reserves the four inherent-public rows for exact CAS only', async () => {
    authState.userId = 'editor-1';
    const context = ctx({
      profile: { userId: 'editor-1', isStaff: true, staffRole: 'content_editor' },
      rows: { evidenceSources: [] },
    });
    const result = await handler(importLinks)(context, { links:
      INHERENT_PUBLIC_LINK_CAS_TARGETS.map(({ kind, slug }) => ({
        kind,
        slug,
        sourceIds: ['stale-or-unknown-source'],
      })),
    }) as Record<string, unknown>;

    expect(result).toMatchObject({
      created: 0,
      updated: 0,
      unchanged: 0,
      skipped: 4,
      failed: 0,
      failedKeys: [],
      invalidatedContentKeys: [],
    });
    expect(context.db.query).not.toHaveBeenCalledWith('evidenceLinks');
    expect(context.db.patch).not.toHaveBeenCalled();
    expect(context.db.insert).not.toHaveBeenCalledWith('evidenceLinks', expect.anything());
  });

  it('the evidence boundary reserves the seizure row for its exact CAS only', async () => {
    authState.userId = 'editor-1';
    const context = ctx({
      profile: { userId: 'editor-1', isStaff: true, staffRole: 'content_editor' },
      rows: { evidenceSources: [] },
    });
    const result = await handler(importLinks)(context, {
      links: [{
        kind: SWAIMAN_SEIZURE_LINK_CAS_TARGET.kind,
        slug: SWAIMAN_SEIZURE_LINK_CAS_TARGET.slug,
        sourceIds: ['stale-or-unknown-source'],
      }],
    }) as Record<string, unknown>;

    expect(result).toMatchObject({
      created: 0,
      updated: 0,
      unchanged: 0,
      skipped: 1,
      failed: 0,
      failedKeys: [],
      invalidatedContentKeys: [],
    });
    expect(context.db.query).not.toHaveBeenCalledWith('evidenceLinks');
    expect(context.db.patch).not.toHaveBeenCalled();
    expect(context.db.insert).not.toHaveBeenCalledWith('evidenceLinks', expect.anything());
  });

  it('the evidence boundary reserves the cerebral-palsy row for its exact CAS only', async () => {
    authState.userId = 'editor-1';
    const context = ctx({
      profile: { userId: 'editor-1', isStaff: true, staffRole: 'content_editor' },
      rows: { evidenceSources: [] },
    });
    const result = await handler(importLinks)(context, {
      links: [{
        kind: SWAIMAN_CEREBRAL_PALSY_TARGET.kind,
        slug: SWAIMAN_CEREBRAL_PALSY_TARGET.slug,
        sourceIds: ['stale-or-unknown-source'],
      }],
    }) as Record<string, unknown>;

    expect(result).toMatchObject({
      created: 0,
      updated: 0,
      unchanged: 0,
      skipped: 1,
      failed: 0,
      failedKeys: [],
      invalidatedContentKeys: [],
    });
    expect(context.db.query).not.toHaveBeenCalledWith('evidenceLinks');
    expect(context.db.patch).not.toHaveBeenCalled();
    expect(context.db.insert).not.toHaveBeenCalledWith('evidenceLinks', expect.anything());
  });

  it('the evidence boundary reserves the doctor-visits row for its exact CAS only', async () => {
    authState.userId = 'editor-1';
    const context = ctx({
      profile: { userId: 'editor-1', isStaff: true, staffRole: 'content_editor' },
      rows: { evidenceSources: [] },
    });
    const result = await handler(importLinks)(context, {
      links: [{
        kind: ASQ_DOCTOR_VISITS_TARGET.kind,
        slug: ASQ_DOCTOR_VISITS_TARGET.slug,
        sourceIds: ['stale-or-unknown-source'],
      }],
    }) as Record<string, unknown>;

    expect(result).toMatchObject({
      created: 0,
      updated: 0,
      unchanged: 0,
      skipped: 1,
      failed: 0,
      failedKeys: [],
      invalidatedContentKeys: [],
    });
    expect(context.db.query).not.toHaveBeenCalledWith('evidenceLinks');
    expect(context.db.patch).not.toHaveBeenCalled();
    expect(context.db.insert).not.toHaveBeenCalledWith('evidenceLinks', expect.anything());
  });

  it('the evidence boundary reserves the nutrition row for its exact CAS only', async () => {
    authState.userId = 'editor-1';
    const context = ctx({
      profile: { userId: 'editor-1', isStaff: true, staffRole: 'content_editor' },
      rows: { evidenceSources: [] },
    });
    const result = await handler(importLinks)(context, {
      links: [{
        kind: BIRTH2M_NUTRITION_TARGET.kind,
        slug: BIRTH2M_NUTRITION_TARGET.slug,
        sourceIds: ['stale-or-unknown-source'],
      }],
    }) as Record<string, unknown>;

    expect(result).toMatchObject({
      created: 0,
      updated: 0,
      unchanged: 0,
      skipped: 1,
      failed: 0,
      failedKeys: [],
      invalidatedContentKeys: [],
    });
    expect(context.db.query).not.toHaveBeenCalledWith('evidenceLinks');
    expect(context.db.patch).not.toHaveBeenCalled();
    expect(context.db.insert).not.toHaveBeenCalledWith('evidenceLinks', expect.anything());
  });

  it('the evidence boundary reserves sudden-weakness link and source rows for exact CAS only', async () => {
    authState.userId = 'editor-1';
    const context = ctx({
      profile: { userId: 'editor-1', isStaff: true, staffRole: 'content_editor' },
      rows: { evidenceSources: [] },
    });
    const linkResult = await handler(importLinks)(context, {
      links: [{
        kind: SWAIMAN_SUDDEN_WEAKNESS_TARGET.kind,
        slug: SWAIMAN_SUDDEN_WEAKNESS_TARGET.slug,
        sourceIds: ['stale-or-unknown-source'],
      }],
    }) as Record<string, unknown>;
    const sourceResult = await handler(importSources)(context, {
      sources: [{
        id: SWAIMAN_SUDDEN_WEAKNESS_SOURCE_ID,
        org: 'Elsevier',
        orgKey: 'TEXTBOOK',
        title: "Swaiman's Pediatric Neurology",
        authors: null,
        year: 2025,
        edition: '7th Edition',
        country: null,
        language: 'en',
        url: 'https://example.invalid/stale',
        doi: null,
        isbn: '9780443109447',
        pmid: null,
        evidenceLevel: 'textbook',
        reviewStatus: 'awaiting_review',
        reviewer: null,
        reviewDate: null,
        nextReviewDate: null,
        keywords: [],
        topics: [],
        ageMonthsMin: 0,
        ageMonthsMax: 60,
        verifiedOn: '2026-08-21',
        verifiedNote: 'stale generic import must be skipped',
      }],
    }) as Record<string, unknown>;

    expect(linkResult).toMatchObject({
      created: 0,
      updated: 0,
      skipped: 1,
      failed: 0,
    });
    expect(sourceResult).toMatchObject({
      created: 0,
      updated: 0,
      unchanged: 0,
      reviewReset: 0,
      skipped: 1,
      failed: 0,
    });
    expect(context.db.query).not.toHaveBeenCalledWith('evidenceLinks');
    expect(context.db.patch).not.toHaveBeenCalled();
    expect(context.db.insert).not.toHaveBeenCalledWith('evidenceLinks', expect.anything());
    expect(context.db.insert).not.toHaveBeenCalledWith('evidenceSources', expect.anything());
  });

  it('normal users cannot mutate evidence review state', async () => {
    authState.userId = 'user-1';
    const context = ctx({ profile: { userId: 'user-1', isStaff: false } });
    await expect(handler(setEvidenceReview)(context, {
      sourceId: 'source-1',
      status: 'in_review',
      reviewer: 'Untrusted',
      reviewerQualification: 'None',
      reviewDate: '2026-07-27',
    })).rejects.toThrow('Insufficient staff permission');
    expect(context.db.patch).not.toHaveBeenCalled();
  });

  it('normal users cannot transition global clinical content', async () => {
    authState.userId = 'user-1';
    const context = ctx({ profile: { userId: 'user-1', isStaff: false } });
    await expect(handler(transitionContent)(context, {
      id: 'content-1' as never,
      to: 'clinical_review',
      expectedReviewRevision: 1,
    })).rejects.toThrow('Insufficient staff permission');
    expect(context.db.patch).not.toHaveBeenCalled();
  });

  it('a qualified education owner can publish ordinary content after four scoped reviews', async () => {
    authState.userId = 'owner-1';
    const context = ctx({
      profile: {
        userId: 'owner-1', isStaff: true, staffRole: 'owner',
        staffQualification: 'MEd Early Childhood Education', displayName: 'Education Owner',
      },
      rows: {
        libraryContent: [{ _id: 'content-1', type: 'guide', slug: 'ordinary-parent-guide', titleEn: 'Play together', reviewRevision: 1 }],
        contentReviews: ['english', 'native_myanmar', 'child_development', 'evidence', 'safety'].map((dimension) => ({
          contentSlug: 'ordinary-parent-guide', contentVersion: 1, dimension, decision: 'approved',
        })),
        ...approvedEvidenceRows('ordinary-parent-guide'),
      },
    });
    await expect(handler(setLibraryReview)(context, {
      slug: 'ordinary-parent-guide', clinicalStatus: 'published', expectedReviewRevision: 1,
    })).resolves.toEqual({ ok: true, reviewScope: 'education' });
    expect(context.db.patch).toHaveBeenCalledWith('content-1', expect.objectContaining({
      clinicalStatus: 'published', reviewScope: 'education', reviewerDisplayName: 'Education Owner',
    }));
  });

  it('a clinical reviewer cannot perform the owner-only final publication step', async () => {
    authState.userId = 'reviewer-1';
    const context = ctx({
      profile: {
        userId: 'reviewer-1', isStaff: true, staffRole: 'clinical_reviewer',
        staffQualification: 'MBBS, MMedSc (Paediatrics)', displayName: 'Clinical Reviewer',
      },
      rows: {
        libraryContent: [{ _id: 'content-1', type: 'guide', slug: 'ordinary-parent-guide', titleEn: 'Play together', reviewRevision: 1 }],
        contentReviews: ['english', 'native_myanmar', 'child_development', 'evidence', 'safety'].map((dimension) => ({
          contentSlug: 'ordinary-parent-guide', contentVersion: 1, dimension, decision: 'approved',
        })),
        ...approvedEvidenceRows('ordinary-parent-guide'),
      },
    });
    await expect(handler(setLibraryReview)(context, {
      slug: 'ordinary-parent-guide', clinicalStatus: 'published', expectedReviewRevision: 1,
    })).rejects.toThrow('Insufficient staff permission');
    expect(context.db.patch).not.toHaveBeenCalled();
  });

  it('does not reuse an older approval after the latest decision requests changes', async () => {
    authState.userId = 'owner-1';
    const context = ctx({
      profile: {
        userId: 'owner-1', isStaff: true, staffRole: 'owner',
        staffQualification: 'MEd Early Childhood Education', displayName: 'Education Owner',
      },
      rows: {
        libraryContent: [{
          _id: 'content-1', type: 'guide', slug: 'ordinary-parent-guide',
          titleEn: 'Play together', reviewRevision: 1,
        }],
        contentReviews: [
          { contentSlug: 'ordinary-parent-guide', contentVersion: 1, dimension: 'native_myanmar', decision: 'changes_requested' },
          { contentSlug: 'ordinary-parent-guide', contentVersion: 1, dimension: 'native_myanmar', decision: 'approved' },
          ...['english', 'child_development', 'evidence', 'safety'].map((dimension) => ({
            contentSlug: 'ordinary-parent-guide', contentVersion: 1, dimension, decision: 'approved',
          })),
        ],
        ...approvedEvidenceRows('ordinary-parent-guide'),
      },
    });
    await expect(handler(setLibraryReview)(context, {
      slug: 'ordinary-parent-guide', clinicalStatus: 'published', expectedReviewRevision: 1,
    })).rejects.toThrow('missing review approvals: native_myanmar');
    expect(context.db.patch).not.toHaveBeenCalled();
  });

  it('blocks publication when the content has no current approved evidence source', async () => {
    authState.userId = 'owner-1';
    const context = ctx({
      profile: {
        userId: 'owner-1', isStaff: true, staffRole: 'owner',
        staffQualification: 'MEd Early Childhood Education', displayName: 'Education Owner',
      },
      rows: {
        libraryContent: [{
          _id: 'content-1', type: 'guide', slug: 'ordinary-parent-guide',
          titleEn: 'Play together', reviewRevision: 1,
        }],
        contentReviews: ['english', 'native_myanmar', 'child_development', 'evidence', 'safety'].map((dimension) => ({
          contentSlug: 'ordinary-parent-guide', contentVersion: 1, dimension, decision: 'approved',
        })),
        evidenceLinks: [{
          kind: 'guide', slug: 'ordinary-parent-guide', sourceIds: ['awaiting-source'],
        }],
        evidenceSources: [{
          sourceId: 'awaiting-source', reviewStatus: 'awaiting_review',
          evidenceLevel: 'guideline', year: 2025, reviewDate: null,
          nextReviewDate: null, verifiedOn: '2026-08-01',
        }],
      },
    });
    await expect(handler(setLibraryReview)(context, {
      slug: 'ordinary-parent-guide', clinicalStatus: 'published', expectedReviewRevision: 1,
    })).rejects.toThrow('no approved, verified and unexpired source');
    expect(context.db.patch).not.toHaveBeenCalled();
  });

  it('a qualified education owner can publish preview-only printable metadata without a clinical record', async () => {
    authState.userId = 'owner-1';
    const context = ctx({
      profile: {
        userId: 'owner-1', isStaff: true, staffRole: 'owner',
        staffQualification: 'MEd Early Childhood Education', displayName: 'Education Owner',
      },
      rows: {
        libraryContent: [{
          _id: 'content-1', type: 'printable', slug: 'prt_preview_only', reviewRevision: 1,
          titleEn: 'Parent checklist preview',
          summaryEn: 'Catalogue preview: the future PDF will cover medicine safety and emergency signs.',
          data: { availability: 'preview_only' },
        }],
        contentReviews: ['english', 'native_myanmar', 'child_development', 'evidence', 'safety'].map((dimension) => ({
          contentSlug: 'prt_preview_only', contentVersion: 1, dimension, decision: 'approved',
        })),
        ...approvedEvidenceRows('prt_preview_only', 'printable'),
      },
    });
    await expect(handler(setLibraryReview)(context, {
      slug: 'prt_preview_only', clinicalStatus: 'published', expectedReviewRevision: 1,
    })).resolves.toEqual({ ok: true, reviewScope: 'education' });
  });

  it('an education owner cannot publish emergency wording without current specialist approval', async () => {
    authState.userId = 'owner-1';
    const context = ctx({
      profile: {
        userId: 'owner-1', isStaff: true, staffRole: 'owner',
        staffQualification: 'MEd Early Childhood Education', displayName: 'Education Owner',
      },
      rows: { libraryContent: [{
        _id: 'content-1', slug: 'gd_7_9m_safety', titleEn: 'Safety guide', reviewRevision: 1,
      }] },
    });
    await expect(handler(setLibraryReview)(context, {
      slug: 'gd_7_9m_safety', clinicalStatus: 'published', expectedReviewRevision: 1,
    })).rejects.toThrow('missing review approvals:');
    expect(context.db.patch).not.toHaveBeenCalled();
  });

  it('an education owner cannot publish bed-sharing wording without current specialist approval', async () => {
    authState.userId = 'owner-1';
    const context = ctx({
      profile: {
        userId: 'owner-1', isStaff: true, staffRole: 'owner',
        staffQualification: 'MEd Early Childhood Education', displayName: 'Education Owner',
      },
      rows: { libraryContent: [{
        _id: 'content-1', slug: 'future-bed-sharing-guide', titleEn: 'Infant sleep', reviewRevision: 1,
        data: { safety: { en: 'How to bed-share with a baby.' } },
      }] },
    });
    await expect(handler(setLibraryReview)(context, {
      slug: 'future-bed-sharing-guide', clinicalStatus: 'published', expectedReviewRevision: 1,
    })).rejects.toThrow('missing review approvals:');
    expect(context.db.patch).not.toHaveBeenCalled();
  });

  it('records the owner as education publisher after an independent specialist approval', async () => {
    authState.userId = 'owner-1';
    const context = ctx({
      profile: {
        userId: 'owner-1', isStaff: true, staffRole: 'owner',
        staffQualification: 'MEd Early Childhood Education', displayName: 'Education Owner',
      },
      rows: {
        libraryContent: [{
          _id: 'content-1', type: 'guide', slug: 'future-bed-sharing-guide', titleEn: 'Infant sleep', reviewRevision: 3,
          data: { safety: { en: 'How to bed-share with a baby.' } },
        }],
        contentReviews: ['english', 'native_myanmar', 'child_development', 'evidence', 'safety', 'clinical'].map((dimension) => ({
          contentSlug: 'future-bed-sharing-guide', contentVersion: 3, dimension, decision: 'approved',
        })),
        ...approvedEvidenceRows('future-bed-sharing-guide'),
      },
    });
    await expect(handler(setLibraryReview)(context, {
      slug: 'future-bed-sharing-guide', clinicalStatus: 'published', expectedReviewRevision: 3,
    })).resolves.toEqual({ ok: true, reviewScope: 'education' });
    expect(context.db.patch).toHaveBeenCalledWith('content-1', expect.objectContaining({
      clinicalStatus: 'published', reviewScope: 'education', reviewerDisplayName: 'Education Owner',
    }));
    expect(context.db.insert).toHaveBeenCalledWith('auditLogs', expect.objectContaining({
      action: 'library.published',
      summary: 'Infant sleep · specialist review required for bed-sharing wording',
    }));
  });

  it('an education owner cannot publish newly-authored medication wording without specialist approval', async () => {
    authState.userId = 'owner-1';
    const context = ctx({
      profile: {
        userId: 'owner-1', isStaff: true, staffRole: 'owner',
        staffQualification: 'MEd Early Childhood Education', displayName: 'Education Owner',
      },
      rows: { libraryContent: [{
        _id: 'content-1', slug: 'future-medication-guide', titleEn: 'Medication guide', reviewRevision: 1,
        summaryEn: 'Give this medication to the child.',
      }] },
    });
    await expect(handler(setLibraryReview)(context, {
      slug: 'future-medication-guide', clinicalStatus: 'published', expectedReviewRevision: 1,
    })).rejects.toThrow('missing review approvals:');
    expect(context.db.patch).not.toHaveBeenCalled();
  });

  it('a named qualified clinical reviewer cannot bypass owner-only final publication', async () => {
    authState.userId = 'reviewer-1';
    const context = ctx({
      profile: {
        userId: 'reviewer-1', isStaff: true, staffRole: 'clinical_reviewer',
        staffQualification: 'MBBS, MMedSc (Paediatrics)', displayName: 'Clinical Reviewer',
      },
      rows: {
        libraryContent: [{ _id: 'content-1', type: 'guide', slug: 'gd_7_9m_safety', titleEn: 'Safety guide', reviewRevision: 1 }],
        contentReviews: ['english', 'native_myanmar', 'child_development', 'evidence', 'safety', 'clinical'].map((dimension) => ({
          contentSlug: 'gd_7_9m_safety', contentVersion: 1, dimension, decision: 'approved',
        })),
        ...approvedEvidenceRows('gd_7_9m_safety'),
      },
    });
    await expect(handler(setLibraryReview)(context, {
      slug: 'gd_7_9m_safety', clinicalStatus: 'published', expectedReviewRevision: 1,
    })).rejects.toThrow('Insufficient staff permission');
    expect(context.db.patch).not.toHaveBeenCalled();
  });

  it('a language reviewer cannot make a clinical or safety decision', async () => {
    authState.userId = 'language-1';
    const context = ctx({
      profile: {
        userId: 'language-1', isStaff: true, staffRole: 'language_reviewer', displayName: 'Native Reviewer',
      },
      rows: { libraryContent: [{ _id: 'content-1', slug: 'item-1', version: 1 }] },
    });
    // Refused in-band, not thrown: a thrown mutation reaches the reviewer as an
    // opaque "Server Error" on a production deployment and rolls back the audit
    // row that records the refusal.
    await expect(handler(saveDecision)(context, {
      contentSlug: 'item-1', dimension: 'clinical', decision: 'approved', expectedReviewRevision: 1,
    })).resolves.toEqual({
      ok: false,
      code: 'role_may_not_review_area',
      message: 'Your reviewer role cannot decide this review area.',
    });
    expect(context.db.patch).not.toHaveBeenCalled();
    // No decision recorded, but the refusal is audited.
    expect(context.db.insert).not.toHaveBeenCalledWith('contentReviews', expect.anything());
    expect(context.db.insert).toHaveBeenCalledWith('auditLogs', expect.objectContaining({
      result: 'rejected',
      summary: 'item-1 \u00b7 refused: role_may_not_review_area',
    }));
  });

  it('every review refusal reaches the reviewer as a code instead of an opaque server error', async () => {
    const cases = [
      {
        name: 'missing display name',
        profile: { userId: 'u-1', isStaff: true, staffRole: 'language_reviewer' },
        args: { contentSlug: 'item-1', dimension: 'native_myanmar', decision: 'approved', expectedReviewRevision: 1 },
        code: 'display_name_required',
      },
      {
        name: 'clinical reviewer without an exact assignment',
        profile: { userId: 'u-1', isStaff: true, staffRole: 'clinical_reviewer', displayName: 'Dr Someone' },
        args: { contentSlug: 'item-1', dimension: 'clinical', decision: 'approved', expectedReviewRevision: 1 },
        code: 'assignment_required',
      },
      {
        name: 'changes requested with no note',
        profile: { userId: 'u-1', isStaff: true, staffRole: 'language_reviewer', displayName: 'Reviewer' },
        args: { contentSlug: 'item-1', dimension: 'native_myanmar', decision: 'changes_requested', expectedReviewRevision: 1 },
        code: 'note_required',
      },
      {
        name: 'support role',
        profile: { userId: 'u-1', isStaff: true, staffRole: 'support', displayName: 'Helper' },
        args: { contentSlug: 'item-1', dimension: 'native_myanmar', decision: 'in_review', expectedReviewRevision: 1 },
        code: 'not_staff',
      },
    ];

    for (const testCase of cases) {
      authState.userId = 'u-1';
      const context = ctx({
        profile: testCase.profile,
        rows: { libraryContent: [{ _id: 'content-1', slug: 'item-1', reviewRevision: 1 }] },
      });
      const result = await handler(saveDecision)(context, testCase.args) as { ok: boolean; code: string };
      expect(result.ok, testCase.name).toBe(false);
      expect(result.code, testCase.name).toBe(testCase.code);
      expect(context.db.insert, testCase.name).not.toHaveBeenCalledWith('contentReviews', expect.anything());
    }
  });

  it('a missing content item is refused in-band rather than thrown', async () => {
    authState.userId = 'owner-1';
    const context = ctx({
      profile: { userId: 'owner-1', isStaff: true, staffRole: 'owner', displayName: 'Owner' },
      rows: { libraryContent: [] },
    });
    await expect(handler(saveDecision)(context, {
      contentSlug: 'gone', dimension: 'native_myanmar', decision: 'in_review', expectedReviewRevision: 1,
    })).resolves.toEqual({
      ok: false,
      code: 'content_not_found',
      message: 'This content item no longer exists.',
    });
  });

  it('a qualified clinical reviewer cannot bypass the frozen assignment for a safety decision', async () => {
    authState.userId = 'clinical-1';
    const context = ctx({
      profile: {
        userId: 'clinical-1', isStaff: true, staffRole: 'clinical_reviewer',
        displayName: 'Dr Reviewer', staffQualification: 'MBBS',
      },
      rows: { libraryContent: [{ _id: 'content-1', slug: 'item-1', version: 1, reviewRevision: 3 }] },
    });
    await expect(handler(saveDecision)(context, {
      contentSlug: 'item-1', dimension: 'safety', decision: 'approved', note: 'Checked', expectedReviewRevision: 3,
    })).resolves.toEqual({
      ok: false,
      code: 'assignment_required',
      message: 'Clinical reviewer decisions must be recorded through the assigned frozen batch.',
    });
    expect(context.db.insert).not.toHaveBeenCalledWith('contentReviews', expect.anything());
  });

  it('a qualified clinical reviewer cannot bypass the frozen assignment for child development', async () => {
    authState.userId = 'clinical-1';
    const context = ctx({
      profile: {
        userId: 'clinical-1', isStaff: true, staffRole: 'clinical_reviewer',
        displayName: 'Dr Reviewer', staffQualification: 'MBBS',
      },
      rows: { libraryContent: [{ _id: 'content-1', slug: 'item-1', version: 1, reviewRevision: 3 }] },
    });
    await expect(handler(saveDecision)(context, {
      contentSlug: 'item-1', dimension: 'child_development', decision: 'approved',
      note: 'Developmental wording checked', expectedReviewRevision: 3,
    })).resolves.toEqual({
      ok: false,
      code: 'assignment_required',
      message: 'Clinical reviewer decisions must be recorded through the assigned frozen batch.',
    });
    expect(context.db.insert).not.toHaveBeenCalledWith('contentReviews', expect.anything());
  });

  it('keeps clinical review history behind the exact assignment boundary', async () => {
    authState.userId = 'clinical-1';
    const existingRows = [
      { _id: 'review-3', contentSlug: 'item-1', contentVersion: 2, dimension: 'clinical', decision: 'changes_requested' },
      { _id: 'review-2', contentSlug: 'item-1', contentVersion: 2, dimension: 'native_myanmar', decision: 'approved' },
      { _id: 'review-1', contentSlug: 'item-1', contentVersion: 2, dimension: 'clinical', decision: 'approved' },
    ];
    const listContext = ctx({
      profile: {
        userId: 'clinical-1', isStaff: true, staffRole: 'clinical_reviewer',
        displayName: 'Dr Reviewer', staffQualification: 'MBBS',
      },
      rows: {
        libraryContent: [{ _id: 'content-1', slug: 'item-1', reviewRevision: 2 }],
        contentReviews: existingRows,
      },
    });
    await expect(handler(listContentReviews)(listContext, { contentSlug: 'item-1' })).resolves.toEqual({
      allowed: false,
      contentVersion: null,
      current: [],
      history: [],
    });

    const saveContext = ctx({
      profile: {
        userId: 'clinical-1', isStaff: true, staffRole: 'clinical_reviewer',
        displayName: 'Dr Reviewer', staffQualification: 'MBBS',
      },
      rows: {
        libraryContent: [{ _id: 'content-1', slug: 'item-1', reviewRevision: 2 }],
        contentReviews: existingRows,
      },
    });
    await expect(handler(saveDecision)(saveContext, {
      contentSlug: 'item-1', dimension: 'clinical', decision: 'approved', note: 'Re-approved after changes', expectedReviewRevision: 2,
    })).resolves.toEqual({
      ok: false,
      code: 'assignment_required',
      message: 'Clinical reviewer decisions must be recorded through the assigned frozen batch.',
    });
    expect(saveContext.db.insert).not.toHaveBeenCalledWith('contentReviews', expect.anything());
    expect(saveContext.db.patch).not.toHaveBeenCalled();
  });

  it('editing content increments the review revision and clears active publication metadata', async () => {
    authState.userId = 'editor-1';
    const context = ctx({
      profile: { userId: 'editor-1', isStaff: true, staffRole: 'content_editor', displayName: 'Editor' },
      rows: { libraryContent: [{
        _id: 'content-1', slug: 'item-1', titleMm: 'ဟောင်း', titleEn: 'Old', tags: [],
        reviewRevision: 4, clinicalStatus: 'published', reviewerDisplayName: 'Prior reviewer',
        data: {
          body: 'Old body', editorialStatus: 'reference_verified', evidenceSummary: 'Trusted evidence',
          domains: ['play'], parentChild: true, quiz: [{ q: 'Old question', answerIndex: 1 }],
          steps: ['Old step one', 'Old step two'], notes: ['Keep this', 'Remove this'],
        },
      }] },
    });
    await expect(handler(updateDraft)(context, {
      slug: 'item-1', titleMm: 'အသစ်', titleEn: 'New',
      data: {
        body: 'Revised', editorialStatus: 'client_override', evidenceSummary: 'Changed in browser',
        domains: ['clinical'], references: ['injected'], relatedLessons: ['injected-lesson'], parentChild: false,
        quiz: [{ q: 'Revised question', answerIndex: 0 }],
        steps: ['New step one', 'New step two', 'New step three'], notes: ['Keep this'],
      },
      expectedReviewRevision: 4,
    })).resolves.toEqual({ ok: true, reviewRevision: 5 });
    expect(context.db.patch).toHaveBeenCalledWith('content-1', expect.objectContaining({
      reviewRevision: 5, clinicalStatus: 'clinical_review', reviewerDisplayName: undefined,
      data: {
        body: 'Revised', editorialStatus: 'reference_verified', evidenceSummary: 'Trusted evidence',
        domains: ['play'], parentChild: true, quiz: [{ q: 'Revised question', answerIndex: 1 }],
        steps: ['New step one', 'New step two', 'New step three'], notes: ['Keep this'],
      },
    }));
  });

  it.each(['language_reviewer', 'evidence_reviewer'] as const)(
    'lets a %s correct wording while resetting the item for fresh review',
    async (staffRole) => {
      authState.userId = 'reviewer-1';
      const context = ctx({
        profile: {
          userId: 'reviewer-1', isStaff: true, staffRole, displayName: 'Assigned Reviewer',
        },
        rows: { libraryContent: [{
          _id: 'content-1', slug: 'item-1', titleMm: 'ဟောင်း', titleEn: 'Old', tags: [], data: { body: 'Old' },
        }] },
      });
      await expect(handler(updateDraft)(context, {
        slug: 'item-1', titleMm: 'အသစ်', titleEn: 'New', data: { body: 'Revised' },
        expectedReviewRevision: 1,
      })).resolves.toEqual({ ok: true, reviewRevision: 2 });
      expect(context.db.patch).toHaveBeenCalledWith('content-1', expect.objectContaining({
        titleMm: 'အသစ်',
        titleEn: 'New',
        data: { body: 'Revised' },
        reviewRevision: 2,
        clinicalStatus: 'clinical_review',
        reviewerId: undefined,
        reviewerQualification: undefined,
        reviewerDisplayName: undefined,
      }));
    },
  );

  it('prevents a clinical reviewer from editing outside the assigned frozen decision path', async () => {
    authState.userId = 'reviewer-1';
    const context = ctx({
      profile: {
        userId: 'reviewer-1', isStaff: true, staffRole: 'clinical_reviewer', displayName: 'Clinical Reviewer',
      },
      rows: { libraryContent: [{
        _id: 'content-1', slug: 'item-1', titleMm: 'ဟောင်း', titleEn: 'Old', tags: [], data: { body: 'Old' },
      }] },
    });
    await expect(handler(updateDraft)(context, {
      slug: 'item-1', titleMm: 'အသစ်', titleEn: 'New', data: { body: 'Revised' },
      expectedReviewRevision: 1,
    })).rejects.toThrow('Insufficient staff permission');
    expect(context.db.patch).not.toHaveBeenCalled();
  });

  it('does not let support staff edit review content', async () => {
    authState.userId = 'support-1';
    const context = ctx({
      profile: { userId: 'support-1', isStaff: true, staffRole: 'support', displayName: 'Support' },
      rows: { libraryContent: [{
        _id: 'content-1', slug: 'item-1', titleMm: 'ဟောင်း', titleEn: 'Old', tags: [], data: { body: 'Old' },
      }] },
    });
    await expect(handler(updateDraft)(context, {
      slug: 'item-1', titleMm: 'အသစ်', titleEn: 'New', data: { body: 'Revised' },
      expectedReviewRevision: 1,
    })).rejects.toThrow('Insufficient staff permission');
    expect(context.db.patch).not.toHaveBeenCalled();
  });

  it('rejects a stale editor snapshot instead of overwriting newer text', async () => {
    authState.userId = 'editor-1';
    const context = ctx({
      profile: { userId: 'editor-1', isStaff: true, staffRole: 'content_editor', displayName: 'Editor' },
      rows: { libraryContent: [{
        _id: 'content-1', slug: 'item-1', titleMm: 'အသစ်ဆုံး', titleEn: 'Latest', tags: [],
        reviewRevision: 5, data: { body: 'Newer saved wording' },
      }] },
    });
    await expect(handler(updateDraft)(context, {
      slug: 'item-1', titleMm: 'ဟောင်းသောပြင်ဆင်ချက်', titleEn: 'Stale edit',
      data: { body: 'Stale wording' }, expectedReviewRevision: 4,
    })).rejects.toThrow('newer changes');
    expect(context.db.patch).not.toHaveBeenCalled();
  });

  it('blocks publication when any current-revision review area is missing', async () => {
    authState.userId = 'owner-1';
    const context = ctx({
      profile: {
        userId: 'owner-1', isStaff: true, staffRole: 'owner',
        staffQualification: 'MEd', displayName: 'Owner',
      },
      rows: {
        libraryContent: [{ _id: 'content-1', type: 'guide', slug: 'item-1', titleEn: 'Item', reviewRevision: 2 }],
        contentReviews: [{ contentSlug: 'item-1', contentVersion: 2, dimension: 'clinical', decision: 'approved' }],
        ...approvedEvidenceRows('item-1'),
      },
    });
    await expect(handler(setLibraryReview)(context, {
      slug: 'item-1', clinicalStatus: 'published', expectedReviewRevision: 2,
    })).rejects.toThrow('missing review approvals');
    expect(context.db.patch).not.toHaveBeenCalled();
  });

  it('parent citation lookup projects only public bibliographic fields', async () => {
    authState.userId = 'user-1';
    const context = ctx({ rows: {
      evidenceLinks: [{ slug: 'activity-1', kind: 'activity', sourceIds: ['source-1'] }],
      evidenceSources: [{
        _id: 'db-source-1', sourceId: 'source-1', org: 'WHO', title: 'Public title',
        authors: null, year: 2024, edition: null, country: null, language: 'en',
        url: 'https://example.test/source', doi: null, isbn: null, pmid: null,
        evidenceLevel: 'guideline', reviewStatus: 'approved', reviewer: 'Private Reviewer',
        verifiedOn: '2026-08-01', reviewDate: '2026-08-01', nextReviewDate: '2028-08-01',
        reviewerId: 'reviewer-1', reviewerQualification: 'Private qualification',
        verifiedNote: 'Internal note', reviewNote: 'Internal review note', searchText: 'internal',
        createdAt: 1, updatedAt: 2,
      }],
    } });
    const result = await handler(evidenceForContent)(context, { slug: 'activity-1', kind: 'activity' });
    expect(result).toEqual({ allowed: true, sources: [expect.objectContaining({ sourceId: 'source-1', org: 'WHO' })] });
    expect(JSON.stringify(result)).not.toMatch(/reviewer|verifiedNote|reviewNote|searchText|createdAt|updatedAt|db-source/);
  });

  it('milestone handlers reject unauthenticated and cross-user access without writes', async () => {
    const unauthenticated = ctx({ get: { _id: 'child-1', userId: 'user-1' } });
    await expect(handler(recordSession)(unauthenticated, {
      childId: 'child-1', resultState: 'green', lostSkill: false, resultSnapshot: {},
    })).rejects.toThrow('Not authenticated');
    expect(unauthenticated.db.insert).not.toHaveBeenCalled();

    authState.userId = 'user-2';
    const otherOwner = ctx({ get: { _id: 'child-1', userId: 'user-1' } });
    await expect(handler(listSessions)(otherOwner, { childId: 'child-1' })).rejects.toThrow('Not found');
    expect(otherOwner.db.insert).not.toHaveBeenCalled();
  });

  it('milestone owner can record a session for their child', async () => {
    authState.userId = 'user-1';
    const context = ctx({ get: { _id: 'child-1', userId: 'user-1' } });
    await expect(handler(recordSession)(context, {
      childId: 'child-1', resultState: 'green', lostSkill: false, resultSnapshot: {}, responses: [],
    })).resolves.toBe('session-1');
    expect(context.db.insert).toHaveBeenCalledWith('milestoneSessions', expect.objectContaining({
      userId: 'user-1', childId: 'child-1', resultState: 'green',
      resultSnapshot: expect.objectContaining({ state: 'green', urgentSymptoms: [], safetyUrgent: false }),
    }));
  });

  it('milestone server preserves all eight validated acute symptoms and forces red', async () => {
    authState.userId = 'user-1';
    const context = ctx({ get: { _id: 'child-1', userId: 'user-1' } });
    const urgentSymptoms = [
      'severe_breathing_difficulty',
      'blue_lips',
      'breathing_pauses',
      'seizure',
      'unresponsiveness',
      'sudden_weakness',
      'serious_injury',
      'severe_dehydration',
    ];
    await handler(recordSession)(context, {
      childId: 'child-1', resultState: 'green', lostSkill: false,
      urgentSymptoms, resultSnapshot: { state: 'green' }, responses: [],
    });
    expect(context.db.insert).toHaveBeenCalledWith('milestoneSessions', expect.objectContaining({
      resultState: 'red',
      resultSnapshot: expect.objectContaining({
        state: 'red', urgentSymptoms, safetyUrgent: true,
      }),
    }));
  });

  it('milestone server keeps stale snapshot-only clients safe and forces skill loss to red', async () => {
    authState.userId = 'user-1';
    const symptomContext = ctx({ get: { _id: 'child-1', userId: 'user-1' } });
    await handler(recordSession)(symptomContext, {
      childId: 'child-1', resultState: 'yellow', lostSkill: false,
      resultSnapshot: { state: 'yellow', urgentSymptoms: ['blue_lips'] }, responses: [],
    });
    expect(symptomContext.db.insert).toHaveBeenCalledWith('milestoneSessions', expect.objectContaining({
      resultState: 'red',
      resultSnapshot: expect.objectContaining({ state: 'red', urgentSymptoms: ['blue_lips'] }),
    }));

    const skillLossContext = ctx({ get: { _id: 'child-1', userId: 'user-1' } });
    await handler(recordSession)(skillLossContext, {
      childId: 'child-1', resultState: 'green', lostSkill: true,
      resultSnapshot: { state: 'green' }, responses: [],
    });
    expect(skillLossContext.db.insert).toHaveBeenCalledWith('milestoneSessions', expect.objectContaining({
      resultState: 'red',
      resultSnapshot: expect.objectContaining({
        state: 'red', urgentSymptoms: ['loss_of_acquired_skills'], safetyUrgent: true,
      }),
    }));
  });

  it('activity handlers reject another child owner without recording completion', async () => {
    authState.userId = 'user-2';
    const context = ctx({
      get: { _id: 'child-1', userId: 'user-1' },
      rows: { subscriptions: [{ userId: 'user-2', planKey: 'premium', status: 'active', currentPeriodEnd: Date.now() + 60_000 }] },
    });
    await expect(handler(completeActivity)(context, {
      childId: 'child-1', contentSlug: 'activity-1',
    })).rejects.toThrow('Not found');
    await expect(handler(listActivities)(context, { childId: 'child-1' })).rejects.toThrow('Not found');
    expect(context.db.insert).not.toHaveBeenCalled();
  });
  // --- reviewer activity (owner-visible cross-content review history) ---------

  const activityRows = [
    {
      _id: 'r-3', contentSlug: 'item-2', contentVersion: 1, dimension: 'clinical',
      decision: 'approved', reviewerId: 'clinical-1', reviewerDisplayName: 'Dr Reviewer',
      reviewerQualification: 'MBBS', reviewerRole: 'clinical_reviewer', reviewedAt: 300, note: 'ok',
    },
    {
      _id: 'r-2', contentSlug: 'item-1', contentVersion: 1, dimension: 'clinical',
      decision: 'changes_requested', reviewerId: 'clinical-1', reviewerDisplayName: 'Dr Reviewer',
      reviewerQualification: 'MBBS', reviewerRole: 'clinical_reviewer', reviewedAt: 200, note: 'fix wording',
    },
    {
      _id: 'r-1', contentSlug: 'item-1', contentVersion: 1, dimension: 'native_myanmar',
      decision: 'approved', reviewerId: 'lang-1', reviewerDisplayName: 'Language Reviewer',
      reviewerRole: 'language_reviewer', reviewedAt: 100,
    },
  ];

  const activityCtx = (profile: Row | null) => ctx({
    profile,
    rows: { contentReviews: activityRows },
  });

  it('reviewer activity is refused to parents, support and reviewer roles, and returns no rows', async () => {
    authState.userId = 'user-1';
    const refused = { allowed: false, truncated: false, totalScanned: 0, decisions: [], reviewers: [] };

    // A parent with no staff profile.
    await expect(handler(reviewerActivity)(activityCtx(null), {})).resolves.toEqual(refused);

    for (const role of ['support', 'language_reviewer', 'evidence_reviewer', 'clinical_reviewer']) {
      const context = activityCtx({ userId: 'user-1', isStaff: true, staffRole: role, displayName: 'Someone' });
      await expect(handler(reviewerActivity)(context, {})).resolves.toEqual(refused);
    }
  });

  it('reviewer activity aggregates every reviewer for the owner without losing decisions', async () => {
    authState.userId = 'owner-1';
    const context = activityCtx({ userId: 'owner-1', isStaff: true, staffRole: 'owner', displayName: 'Owner' });
    const result = await handler(reviewerActivity)(context, {}) as {
      allowed: boolean;
      truncated: boolean;
      decisions: { _id: string }[];
      reviewers: {
        displayName: string; total: number; approved: number; changesRequested: number;
        distinctItems: number; lastReviewedAt: number | null; qualification: string | null;
      }[];
    };

    expect(result.allowed).toBe(true);
    expect(result.truncated).toBe(false);
    // Every decision is listed, newest first — nothing is collapsed away.
    expect(result.decisions.map((d) => d._id)).toEqual(['r-3', 'r-2', 'r-1']);

    // Sorted by most recent activity.
    expect(result.reviewers.map((r) => r.displayName)).toEqual(['Dr Reviewer', 'Language Reviewer']);
    const [clinical, language] = result.reviewers;
    expect(clinical).toMatchObject({
      total: 2, approved: 1, changesRequested: 1, distinctItems: 2,
      lastReviewedAt: 300, qualification: 'MBBS',
    });
    expect(language).toMatchObject({
      total: 1, approved: 1, changesRequested: 0, distinctItems: 1,
      lastReviewedAt: 100, qualification: null,
    });
  });

  it('reviewer activity filters the log but keeps the summary whole, and content editors may read it', async () => {
    authState.userId = 'editor-1';
    const context = activityCtx({ userId: 'editor-1', isStaff: true, staffRole: 'content_editor', displayName: 'Editor' });
    const result = await handler(reviewerActivity)(context, { decision: 'approved' }) as {
      allowed: boolean;
      decisions: { _id: string }[];
      reviewers: { total: number }[];
    };

    expect(result.allowed).toBe(true);
    expect(result.decisions.map((d) => d._id)).toEqual(['r-3', 'r-1']);
    // The summary still counts all three decisions, so filtering the view cannot
    // silently understate a reviewer's workload.
    expect(result.reviewers.reduce((sum, r) => sum + r.total, 0)).toBe(3);
  });
  // --- self-service reviewer display name -----------------------------------
  // saveDecision refuses a reviewer with no display name, and changeRole refuses
  // your own account, so without this a bootstrapped staff member was locked out
  // of reviewing permanently.

  it('a staff member can set their own display name, and the change is audited', async () => {
    authState.userId = 'owner-1';
    const context = ctx({
      profile: { _id: 'profile-1', userId: 'owner-1', isStaff: true, staffRole: 'owner', displayName: undefined },
    });
    await expect(handler(setOwnDisplayName)(context, { displayName: '  La Pyae Wun  ' }))
      .resolves.toEqual({ ok: true });
    expect(context.db.patch).toHaveBeenCalledWith('profile-1', { displayName: 'La Pyae Wun' });
    expect(context.db.insert).toHaveBeenCalledWith('auditLogs', expect.objectContaining({
      action: 'staff.displayName.setOwn',
      after: 'La Pyae Wun',
    }));
  });

  it('setting a display name refuses a non-staff account and writes nothing', async () => {
    authState.userId = 'parent-1';
    const context = ctx({ profile: { _id: 'profile-9', userId: 'parent-1' } });
    await expect(handler(setOwnDisplayName)(context, { displayName: 'Someone' }))
      .rejects.toThrow('Staff access is required');
    expect(context.db.patch).not.toHaveBeenCalled();
  });

  it('setting a display name rejects blank and over-long names', async () => {
    authState.userId = 'owner-1';
    const profile = { _id: 'profile-1', userId: 'owner-1', isStaff: true, staffRole: 'owner' };
    const blank = ctx({ profile });
    await expect(handler(setOwnDisplayName)(blank, { displayName: '   ' }))
      .rejects.toThrow('A name is required');
    const long = ctx({ profile });
    await expect(handler(setOwnDisplayName)(long, { displayName: 'x'.repeat(121) }))
      .rejects.toThrow('too long');
    expect(blank.db.patch).not.toHaveBeenCalled();
    expect(long.db.patch).not.toHaveBeenCalled();
  });

  it('setting your own name cannot grant a professional qualification', async () => {
    authState.userId = 'owner-1';
    const context = ctx({
      profile: { _id: 'profile-1', userId: 'owner-1', isStaff: true, staffRole: 'owner' },
    });
    await handler(setOwnDisplayName)(context, { displayName: 'Reviewer' });
    // Only displayName is written — a reviewer must never self-assert credentials.
    expect(context.db.patch).toHaveBeenCalledWith('profile-1', { displayName: 'Reviewer' });
    const patched = (context.db.patch as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][1] as Record<string, unknown>;
    expect(Object.keys(patched)).toEqual(['displayName']);
  });
  // --- duplicate email accounts ---------------------------------------------
  // One person can hold several user rows when they have signed in through more
  // than one provider (e.g. Google and email+PIN). `.unique()` threw on that,
  // which reached the caller as an opaque "Server Error".

  it('inviting an email that already has two accounts refuses with a usable reason', async () => {
    authState.userId = 'owner-1';
    const context = ctx({
      profile: { userId: 'owner-1', isStaff: true, staffRole: 'owner' },
      rows: {
        users: [
          { _id: 'user-google', email: 'dupe@example.com' },
          { _id: 'user-pin', email: 'dupe@example.com' },
        ],
      },
    });
    await expect(handler(createInvite)(context, {
      email: 'dupe@example.com', displayName: 'Someone', role: 'content_editor',
    })).rejects.toThrow('More than one account already uses this email');
    // Nothing is written when the address is ambiguous.
    expect(context.db.insert).not.toHaveBeenCalledWith('staffInvites', expect.anything());
  });

  it('inviting an email with a single account still resolves that account', async () => {
    authState.userId = 'owner-1';
    const context = ctx({
      profile: { userId: 'owner-1', isStaff: true, staffRole: 'owner' },
      rows: { users: [{ _id: 'user-pin', email: 'solo@example.com' }] },
    });
    await handler(createInvite)(context, {
      email: 'solo@example.com', displayName: 'Someone', role: 'content_editor',
    });
    expect(context.db.insert).toHaveBeenCalledWith('staffInvites', expect.objectContaining({
      email: 'solo@example.com', targetUserId: 'user-pin',
    }));
  });
});
