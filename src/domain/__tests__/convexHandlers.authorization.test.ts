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
import { saveDecision } from '../../../convex/contentReviews';
import { forContent as evidenceForContent, setReview as setEvidenceReview } from '../../../convex/evidence';
import { transition as transitionContent } from '../../../convex/content';
import { listSessions, recordSession } from '../../../convex/milestones';
import { complete as completeActivity, list as listActivities } from '../../../convex/activities';
import { claimInvite, createInvite } from '../../../convex/admin';
import { requiredChecklistKeys } from '../../../convex/lib/reviewChecklists';
import {
  addComment as addReviewComment,
  decideProposal,
  list as listReviewCollaboration,
  saveProposal,
} from '../../../convex/reviewCollaboration';
import { completion as reviewerCompletion } from '../../../convex/reviewReports';

type Row = Record<string, unknown> & { _id?: string };

function ctx(options: {
  rows?: Record<string, Row[]>;
  get?: Row | null;
  gets?: Record<string, Row | null>;
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
      get: vi.fn(async (id: string) => options.gets?.[id] ?? options.get ?? null),
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
      reviewScope: 'clinical',
      publicationStatus: 'published',
      reviewRevision: 1,
      publicationRevision: 1,
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
      reviewScope: 'native_myanmar', ageGroups: [], contentTypes: [],
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
    await expect(handler(claimInvite)(context, {
      inviteCode: code, termsAccepted: true, termsVersion: 'reviewer-terms-2026-07-29',
    })).resolves.toMatchObject({
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

  it('an owner cannot publish parent-facing content until every required review gate is complete', async () => {
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
    })).rejects.toThrow('Current revision is missing review approvals');
    expect(context.db.patch).not.toHaveBeenCalled();
  });

  it('a separately-authorised publisher can publish a clinically approved revision', async () => {
    authState.userId = 'reviewer-1';
    const context = ctx({
      profile: {
        userId: 'reviewer-1', isStaff: true, staffRole: 'clinical_reviewer',
        additionalStaffRoles: ['publisher'],
        staffQualification: 'MBBS, MMedSc (Paediatrics)', displayName: 'Clinical Reviewer',
      },
      rows: {
        libraryContent: [{ _id: 'content-1', slug: 'clinical-guidance', titleEn: 'Clinical guidance', reviewRevision: 1 }],
        contentReviews: ['english', 'native_myanmar', 'evidence', 'safety', 'clinical'].map((dimension) => ({
          contentSlug: 'clinical-guidance', contentVersion: 1, dimension, decision: 'approved',
          reviewerDisplayName: dimension === 'clinical' ? 'Clinical Reviewer' : 'Other Reviewer',
          reviewerQualification: dimension === 'clinical' ? 'MBBS, MMedSc (Paediatrics)' : undefined,
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

  it('an owner can complete an assigned Myanmar-language review with the normal checklist and audit trail', async () => {
    authState.userId = 'owner-1';
    const context = ctx({
      profile: {
        userId: 'owner-1', isStaff: true, staffRole: 'owner', displayName: 'Owner Reviewer',
      },
      rows: {
        libraryContent: [{ _id: 'content-1', slug: 'item-1', version: 1, reviewRevision: 2 }],
        reviewAssignments: [{
          _id: 'assignment-1', contentSlug: 'item-1', contentVersion: 2, reviewerId: 'owner-1',
          reviewerType: 'myanmar_language_reviewer', assignedBy: 'owner-1', assignedAt: 1,
          priority: 'normal', reviewRound: 1, reviewScope: 'Myanmar wording', status: 'assigned', updatedAt: 1,
        }],
        reviewChecklists: [{
          assignmentId: 'assignment-1', contentSlug: 'item-1', contentVersion: 2, dimension: 'native_myanmar',
          responses: requiredChecklistKeys('native_myanmar').map((key) => ({ key, checked: true })),
          updatedBy: 'owner-1', updatedAt: 2,
        }],
      },
    });
    await expect(handler(saveDecision)(context, {
      contentSlug: 'item-1', dimension: 'native_myanmar', decision: 'approved', note: 'စာသားကို စစ်ဆေးပြီးပါပြီ',
    })).resolves.toEqual({ ok: true, contentVersion: 2 });
    expect(context.db.insert).toHaveBeenCalledWith('contentReviews', expect.objectContaining({
      contentSlug: 'item-1', dimension: 'native_myanmar', reviewerRole: 'owner', decision: 'approved',
    }));
  });

  it('uses the authenticated email as the audit label when a non-clinical reviewer has not set a display name', async () => {
    authState.userId = 'owner-1';
    const context = ctx({
      profile: { userId: 'owner-1', isStaff: true, staffRole: 'owner' },
      gets: { 'owner-1': { _id: 'owner-1', email: 'owner@example.com' } },
      rows: {
        libraryContent: [{ _id: 'content-1', slug: 'item-1', version: 1, reviewRevision: 2 }],
        reviewAssignments: [{
          _id: 'assignment-1', contentSlug: 'item-1', contentVersion: 2, reviewerId: 'owner-1',
          reviewerType: 'myanmar_language_reviewer', assignedBy: 'owner-1', assignedAt: 1,
          priority: 'normal', reviewRound: 1, reviewScope: 'Myanmar wording', status: 'assigned', updatedAt: 1,
        }],
        reviewChecklists: [{
          assignmentId: 'assignment-1', contentSlug: 'item-1', contentVersion: 2, dimension: 'native_myanmar',
          responses: requiredChecklistKeys('native_myanmar').map((key) => ({ key, checked: true })),
          updatedBy: 'owner-1', updatedAt: 2,
        }],
      },
    });
    await expect(handler(saveDecision)(context, {
      contentSlug: 'item-1', dimension: 'native_myanmar', decision: 'approved',
    })).resolves.toEqual({ ok: true, contentVersion: 2 });
    expect(context.db.insert).toHaveBeenCalledWith('contentReviews', expect.objectContaining({
      reviewerDisplayName: 'owner@example.com',
      reviewerRole: 'owner',
      decision: 'approved',
    }));
  });

  it('still requires an explicit reviewer name for clinical and safety decisions', async () => {
    authState.userId = 'clinical-1';
    const context = ctx({
      profile: {
        userId: 'clinical-1', isStaff: true, staffRole: 'clinical_reviewer',
        staffQualification: 'MBBS',
      },
      gets: { 'clinical-1': { _id: 'clinical-1', email: 'doctor@example.com' } },
    });
    await expect(handler(saveDecision)(context, {
      contentSlug: 'item-1', dimension: 'safety', decision: 'in_review',
    })).rejects.toThrow('Clinical reviewer display name is required');
    expect(context.db.insert).not.toHaveBeenCalled();
  });

  it('an unrelated reviewer cannot read another reviewer assignment collaboration', async () => {
    authState.userId = 'reviewer-2';
    const context = ctx({
      profile: {
        userId: 'reviewer-2', isStaff: true, staffRole: 'language_reviewer', displayName: 'Other Reviewer',
      },
      get: {
        _id: 'assignment-1', contentSlug: 'item-1', contentVersion: 2, reviewerId: 'reviewer-1',
        reviewerType: 'language_reviewer', reviewRound: 3, status: 'in_review',
      },
      rows: { reviewComments: [], reviewProposals: [] },
    });
    await expect(handler(listReviewCollaboration)(context, {
      assignmentId: 'assignment-1' as never,
    })).rejects.toThrow('Assignment access denied');
    expect(context.db.query).toHaveBeenCalledWith('parentProfiles');
    expect(context.db.query).not.toHaveBeenCalledWith('reviewComments');
  });

  it('an assigned reviewer cannot create a manager-only note', async () => {
    authState.userId = 'reviewer-1';
    const context = ctx({
      profile: {
        userId: 'reviewer-1', isStaff: true, staffRole: 'language_reviewer', displayName: 'Language Reviewer',
      },
      get: {
        _id: 'assignment-1', contentSlug: 'item-1', contentVersion: 2, reviewerId: 'reviewer-1',
        reviewerType: 'language_reviewer', reviewRound: 3, status: 'in_review',
      },
    });
    await expect(handler(addReviewComment)(context, {
      assignmentId: 'assignment-1' as never,
      body: 'Private manager note',
      visibility: 'managers_only',
    })).rejects.toThrow('Only managers may create a manager-only note');
    expect(context.db.insert).not.toHaveBeenCalled();
  });

  it('a reviewer wording proposal is version-bound and never overwrites canonical content', async () => {
    authState.userId = 'reviewer-1';
    const context = ctx({
      profile: {
        userId: 'reviewer-1', isStaff: true, staffRole: 'language_reviewer', displayName: 'Language Reviewer',
      },
      get: {
        _id: 'assignment-1', contentSlug: 'item-1', contentVersion: 4, reviewerId: 'reviewer-1',
        reviewerType: 'language_reviewer', reviewRound: 2, status: 'in_review',
      },
    });
    await expect(handler(saveProposal)(context, {
      assignmentId: 'assignment-1' as never,
      field: 'summaryMm',
      proposedText: 'မိဘများ နားလည်လွယ်သော စာသား',
      submit: true,
    })).resolves.toMatchObject({ ok: true });
    expect(context.db.insert).toHaveBeenCalledWith('reviewProposals', expect.objectContaining({
      contentSlug: 'item-1', contentVersion: 4, reviewerId: 'reviewer-1', status: 'submitted',
    }));
    expect(context.db.patch).not.toHaveBeenCalled();
  });

  it('a normal reviewer cannot open the manager completion report', async () => {
    authState.userId = 'reviewer-1';
    const context = ctx({
      profile: {
        userId: 'reviewer-1', isStaff: true, staffRole: 'language_reviewer', displayName: 'Language Reviewer',
      },
      rows: { reviewAssignments: [] },
    });
    await expect(handler(reviewerCompletion)(context, {})).rejects.toThrow('Review report access denied');
    expect(context.db.query).not.toHaveBeenCalledWith('reviewAssignments');
  });

  it('a content editor proposal decision records the actual review round without editing content', async () => {
    authState.userId = 'editor-1';
    const context = ctx({
      profile: {
        userId: 'editor-1', isStaff: true, staffRole: 'content_editor', displayName: 'Content Editor',
      },
      gets: {
        'proposal-1': {
          _id: 'proposal-1', assignmentId: 'assignment-1', contentSlug: 'item-1', contentVersion: 4,
          reviewerId: 'reviewer-1', field: 'summaryMm', proposedText: 'စာသားအသစ်', status: 'submitted',
        },
        'assignment-1': {
          _id: 'assignment-1', contentSlug: 'item-1', contentVersion: 4, reviewerId: 'reviewer-1',
          reviewerType: 'language_reviewer', reviewRound: 5, status: 'in_review',
        },
      },
    });
    await expect(handler(decideProposal)(context, {
      proposalId: 'proposal-1' as never,
      decision: 'accepted',
      reason: 'အသုံးအနှုန်း ပိုသဘာဝကျသည်',
    })).resolves.toEqual({ ok: true });
    expect(context.db.insert).toHaveBeenCalledWith('reviewEvents', expect.objectContaining({
      assignmentId: 'assignment-1', reviewRound: 5, action: 'review.proposal.accepted',
    }));
    expect(context.db.patch).toHaveBeenCalledTimes(1);
    expect(context.db.patch).toHaveBeenCalledWith('proposal-1', expect.objectContaining({ status: 'accepted' }));
  });

  it('a qualified clinical reviewer can record a version-bound safety decision', async () => {
    authState.userId = 'clinical-1';
    const context = ctx({
      profile: {
        userId: 'clinical-1', isStaff: true, staffRole: 'clinical_reviewer',
        displayName: 'Dr Reviewer', staffQualification: 'MBBS',
      },
      rows: {
        libraryContent: [{ _id: 'content-1', slug: 'item-1', version: 1, reviewRevision: 3 }],
        reviewAssignments: [{
          _id: 'assignment-1', contentSlug: 'item-1', contentVersion: 3, reviewerId: 'clinical-1',
          reviewerType: 'clinical_reviewer', assignedBy: 'manager-1', assignedAt: 1,
          priority: 'normal', reviewRound: 1, reviewScope: 'safety', status: 'assigned', updatedAt: 1,
        }],
        reviewChecklists: [{
          assignmentId: 'assignment-1', contentSlug: 'item-1', contentVersion: 3, dimension: 'safety',
          responses: requiredChecklistKeys('safety').map((key) => ({ key, checked: true })),
          updatedBy: 'clinical-1', updatedAt: 2,
        }],
      },
    });
    await expect(handler(saveDecision)(context, {
      contentSlug: 'item-1', dimension: 'safety', decision: 'approved', note: 'Checked',
    })).resolves.toEqual({ ok: true, contentVersion: 3 });
    expect(context.db.insert).toHaveBeenCalledWith('contentReviews', expect.objectContaining({
      contentSlug: 'item-1', contentVersion: 3, dimension: 'safety', decision: 'approved',
      reviewerDisplayName: 'Dr Reviewer', reviewerQualification: 'MBBS',
    }));
  });

  it('editing content increments the review revision and clears active publication metadata', async () => {
    authState.userId = 'editor-1';
    const context = ctx({
      profile: { userId: 'editor-1', isStaff: true, staffRole: 'content_editor', displayName: 'Editor' },
      rows: { libraryContent: [{
        _id: 'content-1', slug: 'item-1', titleMm: 'ဟောင်း', titleEn: 'Old', tags: [],
        reviewRevision: 4, clinicalStatus: 'published', reviewerDisplayName: 'Prior reviewer',
      }] },
    });
    await expect(handler(updateDraft)(context, {
      slug: 'item-1', titleMm: 'အသစ်', titleEn: 'New', data: { body: 'Revised' },
    })).resolves.toEqual({ ok: true, reviewRevision: 5 });
    expect(context.db.patch).toHaveBeenCalledWith('content-1', expect.objectContaining({
      reviewRevision: 5, clinicalStatus: 'clinical_review', reviewerDisplayName: undefined,
    }));
  });

  it('blocks publication when any current-revision review area is missing', async () => {
    authState.userId = 'reviewer-1';
    const context = ctx({
      profile: {
        userId: 'reviewer-1', isStaff: true, staffRole: 'clinical_reviewer', additionalStaffRoles: ['publisher'],
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
});
