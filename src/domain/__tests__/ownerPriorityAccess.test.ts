import { describe, expect, it, vi } from 'vitest';
import {
  ASSIGNMENT_SCOPED_ROLES,
  FULL_QUEUE_ROLES,
  mayManageGovernance,
  mayRequestReviews,
  maySeeReviewerActivity,
  queueAccessLevel,
  rowInReviewerScope,
  scopedDimensionsForRole,
} from '../../../convex/lib/ownerPriorityAccess';
import { queues, setGovernance, requestReviews, securitySummary, importPreviewRows } from '../../../convex/ownerPriority';

const ALL_ROLES = [
  'owner',
  'content_editor',
  'language_reviewer',
  'evidence_reviewer',
  'clinical_reviewer',
  'support',
] as const;

describe('queue access policy', () => {
  it('gives full access only to owner-class roles', () => {
    for (const role of FULL_QUEUE_ROLES) expect(queueAccessLevel(role)).toBe('full');
    expect(queueAccessLevel('content_editor')).toBe('correction_scoped');
    for (const role of ASSIGNMENT_SCOPED_ROLES) expect(queueAccessLevel(role)).toBe('assignment_scoped');
    expect(queueAccessLevel('support')).toBe('none');
    expect(queueAccessLevel(null)).toBe('none');
    expect(queueAccessLevel(undefined)).toBe('none');
    expect(queueAccessLevel('some_unknown_role')).toBe('none');
  });

  it('never lets a non-owner role read reviewer activity', () => {
    for (const role of ALL_ROLES) {
      expect(maySeeReviewerActivity(role), `${role} must not read reviewer activity`).toBe(role === 'owner');
    }
  });

  it('restricts governance to owner-class roles', () => {
    for (const role of ALL_ROLES) {
      expect(mayManageGovernance(role), `${role}`).toBe(role === 'owner');
    }
  });

  it('lets content editors request reviews but not manage governance', () => {
    expect(mayRequestReviews('content_editor')).toBe(true);
    expect(mayManageGovernance('content_editor')).toBe(false);
    expect(mayRequestReviews('language_reviewer')).toBe(false);
    expect(mayRequestReviews('support')).toBe(false);
  });

  it('scopes reviewer roles to their own dimensions', () => {
    expect(scopedDimensionsForRole('language_reviewer')).toEqual(['native_myanmar', 'english']);
    expect(scopedDimensionsForRole('clinical_reviewer')).toEqual(['clinical', 'safety']);
    expect(scopedDimensionsForRole('owner')).toEqual([]);
  });

  it('shows a reviewer only rows touching their dimensions, including suggestions', () => {
    const clinicalRow = { requiredReviewDimensions: ['clinical'], suggestedReviewDimensions: [] };
    const languageRow = { requiredReviewDimensions: ['native_myanmar'], suggestedReviewDimensions: [] };
    const untriaged = { requiredReviewDimensions: [], suggestedReviewDimensions: ['clinical', 'safety'] };
    expect(rowInReviewerScope('clinical_reviewer', clinicalRow)).toBe(true);
    expect(rowInReviewerScope('clinical_reviewer', languageRow)).toBe(false);
    expect(rowInReviewerScope('language_reviewer', languageRow)).toBe(true);
    // An untriaged record that MIGHT need clinical review still reaches the
    // clinical reviewer rather than hiding until a manager acts.
    expect(rowInReviewerScope('clinical_reviewer', untriaged)).toBe(true);
    expect(rowInReviewerScope('language_reviewer', untriaged)).toBe(false);
  });
});

/**
 * Direct-handler authorization tests.
 *
 * These call the exported Convex handlers directly with a stubbed ctx, i.e. the
 * way a caller who ignores the UI would. A screen that hides a button proves
 * nothing about a handler.
 */
type StubProfile = { staffRole?: string; isStaff?: boolean; displayName?: string } | null;

function makeCtx(profile: StubProfile, options: {
  content?: Record<string, unknown>;
  assignments?: Array<Record<string, unknown>>;
} = {}) {
  const inserted: unknown[] = [];
  const patched: unknown[] = [];
  const content = options.content ?? {
    _id: 'content1',
    slug: 'act_one',
    type: 'activity',
    titleMm: 'က',
    titleEn: 'A',
    data: {},
    clinicalStatus: 'clinical_review',
    reviewRevision: 1,
    tags: [],
  };
  const table = (name: string) => {
    const api: Record<string, unknown> = {
      withIndex: () => api,
      order: () => api,
      unique: async () => (name === 'parentProfiles' ? profile : name === 'libraryContent' ? content : null),
      collect: async () => (name === 'libraryContent' ? [content] : []),
      take: async () => (name === 'reviewAssignments' ? (options.assignments ?? []) : []),
      paginate: async () => ({ page: [], isDone: true, continueCursor: '' }),
      eq: () => api,
    };
    return api;
  };
  return {
    ctx: {
      auth: { getUserIdentity: async () => ({ subject: 'user1' }) },
      db: {
        query: (name: string) => table(name),
        get: async () => content,
        insert: async (name: string, doc: unknown) => { inserted.push({ name, doc }); return 'id1'; },
        patch: async (id: unknown, doc: unknown) => { patched.push({ id, doc }); },
      },
    },
    inserted,
    patched,
  };
}

vi.mock('@convex-dev/auth/server', () => ({
  getAuthUserId: async () => 'user1',
}));

const handler = <T,>(fn: unknown): ((ctx: unknown, args: unknown) => Promise<T>) =>
  (fn as { _handler?: (ctx: unknown, args: unknown) => Promise<T>; handler?: (ctx: unknown, args: unknown) => Promise<T> })._handler
  ?? (fn as { handler: (ctx: unknown, args: unknown) => Promise<T> }).handler;

describe('direct-handler authorization — queues', () => {
  it('refuses support and non-staff outright', async () => {
    for (const profile of [null, { staffRole: 'support' }] as StubProfile[]) {
      const { ctx } = makeCtx(profile);
      const result = await handler<{ allowed: boolean; rows: unknown[] }>(queues)(ctx, {});
      expect(result.allowed).toBe(false);
      expect(result.rows).toEqual([]);
    }
  });

  it('strips reviewer activity for every non-owner role that may see rows', async () => {
    for (const role of ['content_editor', 'language_reviewer', 'evidence_reviewer', 'clinical_reviewer']) {
      const { ctx } = makeCtx({ staffRole: role });
      const result = await handler<{
        allowed: boolean;
        accessLevel: string;
        countsAuthoritative: boolean;
        rows: Array<{ activeReviewers: string[]; latestEditAt: number | null; latestDecisionAt: number | null; ownerNote: string | null }>;
      }>(queues)(ctx, {});
      expect(result.allowed).toBe(true);
      expect(result.accessLevel).not.toBe('full');
      expect(result.countsAuthoritative, `${role} must not get authoritative counts`).toBe(false);
      for (const row of result.rows) {
        expect(row.activeReviewers).toEqual([]);
        expect(row.latestEditAt).toBeNull();
        expect(row.latestDecisionAt).toBeNull();
        expect(row.ownerNote).toBeNull();
      }
    }
  });

  it('gives the owner the full view with authoritative counts', async () => {
    const { ctx } = makeCtx({ staffRole: 'owner' });
    const result = await handler<{ allowed: boolean; accessLevel: string; countsAuthoritative: boolean }>(queues)(ctx, {});
    expect(result.allowed).toBe(true);
    expect(result.accessLevel).toBe('full');
    expect(result.countsAuthoritative).toBe(true);
  });

  it('derives assigned state from an active assignment at the exact content revision', async () => {
    const { ctx } = makeCtx({ staffRole: 'owner' }, {
      assignments: [{ contentSlug: 'act_one', contentVersion: 1, status: 'assigned' }],
    });
    const result = await handler<{
      rows: Array<{ slug: string; hasActiveAssignment: boolean; priorityStatus: string }>;
      counts: { currentlyAssigned: number };
    }>(queues)(ctx, {});
    expect(result.rows[0]).toMatchObject({
      slug: 'act_one',
      hasActiveAssignment: true,
      priorityStatus: 'assigned',
    });
    expect(result.counts.currentlyAssigned).toBe(1);

    const stale = makeCtx({ staffRole: 'owner' }, {
      assignments: [{ contentSlug: 'act_one', contentVersion: 0, status: 'assigned' }],
    });
    const staleResult = await handler<{ rows: Array<{ hasActiveAssignment: boolean }> }>(queues)(stale.ctx, {});
    expect(staleResult.rows[0]?.hasActiveAssignment).toBe(false);
  });
});

describe('direct-handler authorization — governance mutations', () => {
  const args = { slug: 'act_one', expectedReviewRevision: 1, priorityStatus: 'correction_needed' as const };

  it('refuses setGovernance for every role except owner, and writes nothing', async () => {
    for (const role of ['content_editor', 'language_reviewer', 'evidence_reviewer', 'clinical_reviewer', 'support']) {
      const { ctx, patched } = makeCtx({ staffRole: role });
      const result = await handler<{ ok: boolean; code?: string }>(setGovernance)(ctx, args);
      expect(result.ok, `${role} must not change governance`).toBe(false);
      expect(result.code).toBe('not_authorized');
      expect(patched).toEqual([]);
    }
  });

  it('refuses securitySummary and importPreviewRows for non-owners', async () => {
    for (const role of ['content_editor', 'language_reviewer', 'clinical_reviewer', 'support']) {
      const { ctx } = makeCtx({ staffRole: role });
      expect((await handler<{ allowed: boolean }>(securitySummary)(ctx, {})).allowed).toBe(false);
      expect((await handler<{ allowed: boolean }>(importPreviewRows)(ctx, {})).allowed).toBe(false);
    }
  });

  it('refuses requestReviews for reviewer roles and support', async () => {
    for (const role of ['language_reviewer', 'evidence_reviewer', 'clinical_reviewer', 'support']) {
      const { ctx, patched } = makeCtx({ staffRole: role });
      const result = await handler<{ ok: boolean; code?: string }>(requestReviews)(ctx, {
        slug: 'act_one', expectedReviewRevision: 1, dimensions: ['clinical'],
      });
      expect(result.ok, `${role} must not request reviews`).toBe(false);
      expect(result.code).toBe('not_authorized');
      expect(patched).toEqual([]);
    }
  });

  it('lets a content editor request a review — as a REQUEST, never an assignment', async () => {
    const { ctx, patched } = makeCtx({ staffRole: 'content_editor' });
    const result = await handler<{ ok: boolean }>(requestReviews)(ctx, {
      slug: 'act_one', expectedReviewRevision: 1, dimensions: ['clinical'],
    });
    expect(result.ok).toBe(true);
    const patch = (patched[0] as { doc: Record<string, unknown> }).doc;
    expect(patch.priorityStatus).toBe('review_requested');
    expect(patch.priorityStatus).not.toBe('assigned');
    expect(patch.requestedReviewDimensions).toEqual(['clinical']);
    // A request must never become a confirmed requirement.
    expect(patch.requiredReviewDimensions).toBeUndefined();
  });

  it('refuses a hand-set "assigned" status even from the owner', async () => {
    const { ctx, patched } = makeCtx({ staffRole: 'owner' });
    const result = await handler<{ ok: boolean; code?: string }>(setGovernance)(ctx, {
      slug: 'act_one', expectedReviewRevision: 1, priorityStatus: 'assigned',
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe('assignment_not_supported');
    expect(patched).toEqual([]);
  });

  it('refuses a stale revision', async () => {
    const { ctx, patched } = makeCtx({ staffRole: 'owner' });
    const result = await handler<{ ok: boolean; code?: string }>(setGovernance)(ctx, {
      slug: 'act_one', expectedReviewRevision: 99, priorityStatus: 'correction_needed',
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe('stale_revision');
    expect(patched).toEqual([]);
  });

  it('refuses completion while dimensions are outstanding, with a bilingual message', async () => {
    const { ctx, patched } = makeCtx({ staffRole: 'owner' }, {
      content: {
        _id: 'content1', slug: 'act_one', type: 'activity', titleMm: 'က', titleEn: 'A', data: {},
        clinicalStatus: 'clinical_review', reviewRevision: 1, tags: [],
        riskClassification: 'C', requiredReviewDimensions: ['native_myanmar', 'clinical'],
      },
    });
    const result = await handler<{ ok: boolean; code?: string; message?: string; messageMm?: string; outstanding?: string[] }>(setGovernance)(ctx, {
      slug: 'act_one', expectedReviewRevision: 1, priorityStatus: 'completed',
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe('outstanding_dimensions');
    expect(result.outstanding).toEqual(['native_myanmar', 'clinical']);
    expect(result.message).toContain('clinical');
    expect(result.messageMm).toBeTruthy();
    expect(patched).toEqual([]);
  });

  it('refuses completion on an untriaged D/E record', async () => {
    const { ctx, patched } = makeCtx({ staffRole: 'owner' }, {
      content: {
        _id: 'content1', slug: 'act_one', type: 'activity', titleMm: 'က', titleEn: 'A', data: {},
        clinicalStatus: 'clinical_review', reviewRevision: 1, tags: [], riskClassification: 'D',
      },
    });
    const result = await handler<{ ok: boolean; code?: string }>(setGovernance)(ctx, {
      slug: 'act_one', expectedReviewRevision: 1, priorityStatus: 'completed',
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe('manual_triage_required');
    expect(patched).toEqual([]);
  });

  it('confirming a D classification does NOT persist six requirements', async () => {
    const { ctx, patched } = makeCtx({ staffRole: 'owner' });
    const result = await handler<{ ok: boolean }>(setGovernance)(ctx, {
      slug: 'act_one',
      expectedReviewRevision: 1,
      confirmClassification: { riskClassification: 'D', riskReasons: ['unclear'] },
    });
    expect(result.ok).toBe(true);
    const patch = (patched[0] as { doc: Record<string, unknown> }).doc;
    expect(patch.riskClassification).toBe('D');
    expect(patch.requiredReviewDimensions).toBeUndefined();
    expect(patch.priorityStatus).toBe('manual_triage_required');
  });

  it('confirming a C classification does persist the policy requirements', async () => {
    const { ctx, patched } = makeCtx({ staffRole: 'owner' });
    await handler<{ ok: boolean }>(setGovernance)(ctx, {
      slug: 'act_one',
      expectedReviewRevision: 1,
      confirmClassification: { riskClassification: 'C', riskReasons: ['clinical wording'] },
    });
    const patch = (patched[0] as { doc: Record<string, unknown> }).doc;
    expect(patch.requiredReviewDimensions).toEqual(['native_myanmar', 'english', 'child_development', 'evidence', 'safety', 'clinical']);
  });

  it('lets a manager explicitly confirm required dimensions for a triaged record', async () => {
    const { ctx, patched } = makeCtx({ staffRole: 'owner' });
    const result = await handler<{ ok: boolean }>(setGovernance)(ctx, {
      slug: 'act_one',
      expectedReviewRevision: 1,
      confirmRequiredDimensions: ['native_myanmar', 'safety'],
    });
    expect(result.ok).toBe(true);
    const patch = (patched[0] as { doc: Record<string, unknown> }).doc;
    expect(patch.requiredReviewDimensions).toEqual(['native_myanmar', 'safety']);
  });

  it('rejects an unknown dimension rather than storing it', async () => {
    const { ctx, patched } = makeCtx({ staffRole: 'owner' });
    const result = await handler<{ ok: boolean; code?: string }>(setGovernance)(ctx, {
      slug: 'act_one', expectedReviewRevision: 1, confirmRequiredDimensions: ['not_a_dimension'],
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe('unknown_dimension');
    expect(patched).toEqual([]);
  });
});

/**
 * review_manager is a real, invitable role. It runs the queue and must never
 * be able to sign anything off — the separation between "decides what must be
 * reviewed" and "declares it reviewed" is the reason the role exists.
 */
describe('review_manager powers and limits', () => {
  it('gets the full queue, roster and governance', () => {
    expect(queueAccessLevel('review_manager')).toBe('full');
    expect(maySeeReviewerActivity('review_manager')).toBe(true);
    expect(mayManageGovernance('review_manager')).toBe(true);
    expect(mayRequestReviews('review_manager')).toBe(true);
  });

  it('CANNOT record a decision in any review dimension', async () => {
    const { roleMayReview } = await import('../../../convex/lib/reviewPolicy');
    for (const dimension of ['english', 'native_myanmar', 'evidence', 'safety', 'clinical'] as const) {
      expect(roleMayReview('review_manager', dimension), `must not review ${dimension}`).toBe(false);
    }
  });

  it('is refused in-band by the decision gate, so nothing is written', async () => {
    const { reviewRefusal } = await import('../../../convex/lib/reviewPolicy');
    const refusal = reviewRefusal({
      role: 'review_manager',
      dimension: 'native_myanmar',
      decision: 'approved',
      displayName: 'Queue Manager',
      qualification: 'MEd',
      note: 'looks fine',
      contentExists: true,
    });
    expect(refusal?.code).toBe('role_may_not_review_area');
  });

  it('is NOT a publishing authority', async () => {
    const authSource = (await import('node:fs')).readFileSync('convex/lib/auth.ts', 'utf8');
    // requireProfessionalPublisher decides who may publish; review_manager
    // must not appear in its allow-list.
    const block = authSource.slice(
      authSource.indexOf('export async function requireProfessionalPublisher'),
      authSource.indexOf('export async function requireProfessionalPublisher') + 400,
    );
    expect(block).toContain("requireOneOf(ctx, ['owner', 'clinical_reviewer'])");
    expect(block).not.toContain('review_manager');
  });

  it('needs no professional qualification to be invited', async () => {
    const adminSource = (await import('node:fs')).readFileSync('convex/admin.ts', 'utf8');
    // Qualification is demanded only of roles that sign professional
    // decisions. A review manager signs none, so requiring one would imply an
    // authority it does not have.
    for (const match of adminSource.matchAll(/\['clinical_reviewer', 'evidence_reviewer'\]\.includes/g)) {
      expect(match[0]).not.toContain('review_manager');
    }
    expect(adminSource).toContain("review_manager: 'Review manager'");
  });

  it('appears in every stored role union, directly or through the shared validator', async () => {
    const fs = await import('node:fs');
    for (const file of ['convex/schema.ts', 'convex/contentReviews.ts', 'convex/contentEdits.ts', 'convex/admin.ts']) {
      const source = fs.readFileSync(file, 'utf8');
      expect(
        source.includes('review_manager') || source.includes('staffRoleValidator'),
        `${file} omits review_manager and the shared role validator`,
      ).toBe(true);
    }
  });

  it('keeps system_admin explicit but separate from review and publishing authority', async () => {
    const schema = (await import('node:fs')).readFileSync('convex/schema.ts', 'utf8');
    const { hasCapability } = await import('../../../convex/lib/reviewRoles');
    expect(schema).toContain('system_admin');
    expect(hasCapability(['system_admin'], 'manage_system')).toBe(true);
    expect(hasCapability(['system_admin'], 'review_clinical')).toBe(false);
    expect(hasCapability(['system_admin'], 'publish_content')).toBe(false);
  });
});
