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
import { forContent as evidenceForContent, setReview as setEvidenceReview } from '../../../convex/evidence';
import { transition as transitionContent } from '../../../convex/content';
import { listSessions, recordSession } from '../../../convex/milestones';
import { complete as completeActivity, list as listActivities } from '../../../convex/activities';
import { claimInvite, createInvite } from '../../../convex/admin';

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
    const terminal: {
      collect: () => Promise<Row[]>;
      take: (count: number) => Promise<Row[]>;
      unique: () => Promise<Row | null>;
      order?: (direction: 'asc' | 'desc') => unknown;
    } = {
      collect: async () => rows,
      take: async (count: number) => rows.slice(0, count),
      unique: async () => table === 'parentProfiles' ? options.profile ?? null : rows[0] ?? null,
    };
    terminal.order = () => terminal;
    return {
      ...terminal,
      withIndex: (_name: string, callback: (q: { eq: (field: string, value: unknown) => unknown }) => unknown) => {
        const q = { eq: (field: string, value: unknown): unknown => {
          void field;
          void value;
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
      rows: { libraryContent: [published, reviewPending, archived] },
    });
    const result = await handler(listByType)(context, { type: 'activity' });
    expect(result).toEqual({ staff: false, items: [published] });
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
    })).rejects.toThrow('Insufficient staff permission');
    expect(context.db.patch).not.toHaveBeenCalled();
  });

  it('a qualified education owner cannot publish parent-facing library content', async () => {
    authState.userId = 'owner-1';
    const context = ctx({
      profile: {
        userId: 'owner-1', isStaff: true, staffRole: 'owner',
        staffQualification: 'MEd Early Childhood Education', displayName: 'Education Owner',
      },
      rows: { libraryContent: [{ _id: 'content-1', slug: 'clinical-guidance', titleEn: 'Clinical guidance' }] },
    });
    await expect(handler(setLibraryReview)(context, {
      slug: 'clinical-guidance', clinicalStatus: 'published',
    })).rejects.toThrow('Insufficient staff permission');
    expect(context.db.patch).not.toHaveBeenCalled();
  });

  it('a named qualified clinical reviewer can publish and records clinical scope', async () => {
    authState.userId = 'reviewer-1';
    const context = ctx({
      profile: {
        userId: 'reviewer-1', isStaff: true, staffRole: 'clinical_reviewer',
        staffQualification: 'MBBS, MMedSc (Paediatrics)', displayName: 'Clinical Reviewer',
      },
      rows: {
        libraryContent: [{ _id: 'content-1', slug: 'clinical-guidance', titleEn: 'Clinical guidance', reviewRevision: 1 }],
        contentReviews: ['english', 'native_myanmar', 'evidence', 'safety', 'clinical'].map((dimension) => ({
          contentSlug: 'clinical-guidance', contentVersion: 1, dimension, decision: 'approved',
        })),
      },
    });
    await expect(handler(setLibraryReview)(context, {
      slug: 'clinical-guidance', clinicalStatus: 'published',
    })).resolves.toEqual({ ok: true, reviewScope: 'clinical' });
    expect(context.db.patch).toHaveBeenCalledWith('content-1', expect.objectContaining({
      clinicalStatus: 'published', reviewScope: 'clinical', reviewerDisplayName: 'Clinical Reviewer',
    }));
  });

  it('a language reviewer cannot make a clinical or safety decision', async () => {
    authState.userId = 'language-1';
    const context = ctx({
      profile: {
        userId: 'language-1', isStaff: true, staffRole: 'language_reviewer', displayName: 'Native Reviewer',
      },
      rows: { libraryContent: [{ _id: 'content-1', slug: 'item-1', version: 1 }] },
    });
    await expect(handler(saveDecision)(context, {
      contentSlug: 'item-1', dimension: 'clinical', decision: 'approved',
    })).rejects.toThrow('cannot decide this review area');
    expect(context.db.patch).not.toHaveBeenCalled();
  });

  it('a qualified clinical reviewer can record a version-bound safety decision', async () => {
    authState.userId = 'clinical-1';
    const context = ctx({
      profile: {
        userId: 'clinical-1', isStaff: true, staffRole: 'clinical_reviewer',
        displayName: 'Dr Reviewer', staffQualification: 'MBBS',
      },
      rows: { libraryContent: [{ _id: 'content-1', slug: 'item-1', version: 1, reviewRevision: 3 }] },
    });
    await expect(handler(saveDecision)(context, {
      contentSlug: 'item-1', dimension: 'safety', decision: 'approved', note: 'Checked',
    })).resolves.toEqual({ ok: true, contentVersion: 3 });
    expect(context.db.insert).toHaveBeenCalledWith('contentReviews', expect.objectContaining({
      contentSlug: 'item-1', contentVersion: 3, dimension: 'safety', decision: 'approved',
      reviewerDisplayName: 'Dr Reviewer', reviewerQualification: 'MBBS',
    }));
  });

  it('appends repeated review decisions and reports only the latest decision per dimension as current', async () => {
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
      allowed: true,
      contentVersion: 2,
      current: [existingRows[0], existingRows[1]],
      history: existingRows,
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
      contentSlug: 'item-1', dimension: 'clinical', decision: 'approved', note: 'Re-approved after changes',
    })).resolves.toEqual({ ok: true, contentVersion: 2 });
    expect(saveContext.db.insert).toHaveBeenCalledWith('contentReviews', expect.objectContaining({
      contentSlug: 'item-1', contentVersion: 2, dimension: 'clinical', decision: 'approved',
    }));
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

  it.each(['language_reviewer', 'evidence_reviewer', 'clinical_reviewer'] as const)(
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
    authState.userId = 'reviewer-1';
    const context = ctx({
      profile: {
        userId: 'reviewer-1', isStaff: true, staffRole: 'clinical_reviewer',
        staffQualification: 'MBBS', displayName: 'Clinical Reviewer',
      },
      rows: {
        libraryContent: [{ _id: 'content-1', slug: 'item-1', titleEn: 'Item', reviewRevision: 2 }],
        contentReviews: [{ contentSlug: 'item-1', contentVersion: 2, dimension: 'clinical', decision: 'approved' }],
      },
    });
    await expect(handler(setLibraryReview)(context, {
      slug: 'item-1', clinicalStatus: 'published',
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
});
