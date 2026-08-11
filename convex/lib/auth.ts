// Shared authentication/authorization helpers for Convex functions.
//
// Single source of truth for the P0 rule: every data function derives the caller
// from getAuthUserId and scopes to that identity. Previously `isStaff`,
// `ownChild`, and the `getAuthUserId()+throw` idiom were copy-pasted across many
// modules; consolidating them here removes that duplication.
import { getAuthUserId } from '@convex-dev/auth/server';
import type { QueryCtx, MutationCtx } from '../_generated/server';
import type { Doc, Id } from '../_generated/dataModel';
import { activeFamilyOwnerIds } from './entitlements';

export type Ctx = QueryCtx | MutationCtx;
export type StaffRole =
  | 'owner'
  | 'content_editor'
  | 'language_reviewer'
  | 'evidence_reviewer'
  | 'clinical_reviewer'
  | 'review_manager'
  | 'support';

export type StaffAccess = {
  role: StaffRole;
  qualification: string | null;
  displayName: string | null;
};

export type ReviewScope = 'education' | 'clinical';

export type ProfessionalApproval = {
  userId: Id<'users'>;
  qualification: string;
  reviewerName: string;
  scope: ReviewScope;
};

/** The authenticated user id, or throw. Use in mutations that require a caller. */
export async function requireUser(ctx: Ctx): Promise<Id<'users'>> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error('Not authenticated');
  return userId;
}

/** Resolve a staff role. Legacy isStaff rows become owner for safe bootstrap. */
export async function getStaffAccess(ctx: Ctx, userId: Id<'users'>): Promise<StaffAccess | null> {
  const profile = await ctx.db
    .query('parentProfiles')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .unique();
  if (profile?.staffRole) {
    return {
      role: profile.staffRole,
      qualification: profile.staffQualification?.trim() || null,
      displayName: profile.displayName?.trim() || null,
    };
  }
  return profile?.isStaff === true
    ? { role: 'owner', qualification: null, displayName: profile.displayName?.trim() || null }
    : null;
}

/** Whether the given user is staff (Admin workspace access). */
export async function isStaff(ctx: Ctx, userId: Id<'users'>): Promise<boolean> {
  return (await getStaffAccess(ctx, userId)) !== null;
}

export async function hasStaffRole(
  ctx: Ctx,
  userId: Id<'users'>,
  roles: StaffRole[],
): Promise<boolean> {
  const access = await getStaffAccess(ctx, userId);
  return access !== null && roles.includes(access.role);
}

/** The authenticated user id if they are staff, or throw. */
export async function requireStaff(ctx: Ctx): Promise<Id<'users'>> {
  const userId = await requireUser(ctx);
  if (!(await isStaff(ctx, userId))) throw new Error('Staff only');
  return userId;
}

async function requireOneOf(ctx: Ctx, roles: StaffRole[]): Promise<{ userId: Id<'users'>; access: StaffAccess }> {
  const userId = await requireUser(ctx);
  const access = await getStaffAccess(ctx, userId);
  if (!access || !roles.includes(access.role)) throw new Error('Insufficient staff permission');
  return { userId, access };
}

export async function requireOwner(ctx: Ctx): Promise<Id<'users'>> {
  return (await requireOneOf(ctx, ['owner'])).userId;
}

export async function requireContentEditor(ctx: Ctx): Promise<Id<'users'>> {
  return (await requireOneOf(ctx, ['owner', 'content_editor'])).userId;
}

export async function requireEvidenceEditor(ctx: Ctx): Promise<Id<'users'>> {
  return (await requireOneOf(ctx, ['owner', 'content_editor', 'evidence_reviewer', 'clinical_reviewer'])).userId;
}

/** Staff who may edit a review draft. Publishing remains a separate permission. */
export async function requireReviewEditor(
  ctx: Ctx,
): Promise<{ userId: Id<'users'>; access: StaffAccess }> {
  return await requireOneOf(ctx, [
    'owner',
    'content_editor',
    'language_reviewer',
    'evidence_reviewer',
    'clinical_reviewer',
    // A review manager may correct wording as part of running corrections.
    // This grants no publishing authority and no review decision.
    'review_manager',
  ]);
}

export async function requireClinicalReviewer(
  ctx: Ctx,
): Promise<{ userId: Id<'users'>; qualification: string; reviewerName: string }> {
  const { userId, access } = await requireOneOf(ctx, ['clinical_reviewer']);
  if (!access.qualification) throw new Error('Specialist safety reviewer qualification is required');
  if (!access.displayName) throw new Error('Specialist safety reviewer audit identity is required');
  return { userId, qualification: access.qualification, reviewerName: access.displayName };
}

/**
 * Publishing authority for ordinary educational material. The resulting
 * decision is always education-scoped, including when the qualified publisher
 * happens to hold the legacy `clinical_reviewer` role. The legacy clinical
 * scope value is reserved for the
 * explicit specialist-risk path in requireClinicalPublisher.
 */
export async function requireProfessionalPublisher(ctx: Ctx): Promise<ProfessionalApproval> {
  const { userId, access } = await requireOneOf(ctx, ['owner', 'clinical_reviewer']);
  if (!access.qualification) throw new Error('Professional qualification is required');
  if (access.role === 'clinical_reviewer') {
    if (!access.displayName) throw new Error('Specialist safety reviewer audit identity is required');
    return {
      userId,
      qualification: access.qualification,
      reviewerName: access.displayName,
      scope: 'education',
    };
  }
  return {
    userId,
    qualification: access.qualification,
    reviewerName: access.displayName || 'ACE Child Grow Owner / Education Reviewer',
    scope: 'education',
  };
}

/**
 * Specialist publishing authority for diagnosis, treatment, medication,
 * individualized advice and emergency-decision wording. Ordinary educational
 * parent content uses requireProfessionalPublisher and retains education scope.
 */
export async function requireClinicalPublisher(ctx: Ctx): Promise<ProfessionalApproval> {
  const reviewer = await requireClinicalReviewer(ctx);
  return { ...reviewer, scope: 'clinical' };
}

/**
 * Assert the child belongs to the caller (ownership guard for child sub-records).
 *
 * A child marked `deletedAt` reads as already gone. Deletion soft-marks the row
 * and then purges the sub-records across several scheduled transactions; without
 * this check a client holding the id could keep reading growth, sleep, health
 * and appointment rows for the whole of that window. The purge itself does not
 * come through here — it fetches the row directly, and requires `deletedAt` to
 * be set.
 */
export async function ownChild(
  ctx: Ctx,
  childId: Id<'children'>,
  userId: Id<'users'>,
): Promise<Doc<'children'>> {
  const child = await ctx.db.get(childId);
  if (!child || child.deletedAt !== undefined) throw new Error('Not found');
  if (child.userId !== userId) {
    const allowedOwners = await activeFamilyOwnerIds(ctx, userId);
    const allowed = allowedOwners.includes(child.userId);
    if (!allowed) throw new Error('Not found');
  }
  return child;
}
