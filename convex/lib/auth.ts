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
import { distinctRoles, hasCapability, type StaffCapability, type StaffRole } from './reviewRoles';

export type { StaffRole } from './reviewRoles';

export type Ctx = QueryCtx | MutationCtx;
export type StaffAccess = {
  role: StaffRole;
  roles: StaffRole[];
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

/**
 * Human-readable audit label for non-clinical review activity.
 *
 * A newly-created staff account may not have completed its profile yet. The
 * authenticated user's name/email is a safe fallback because the immutable
 * userId is still stored alongside every review event. Clinical sign-off keeps
 * its stricter explicit-name requirement in the clinical authorization path.
 */
export async function reviewerAuditName(
  ctx: Ctx,
  userId: Id<'users'>,
  access: StaffAccess,
): Promise<string> {
  if (access.displayName) return access.displayName;
  const user = await ctx.db.get(userId);
  return user?.name?.trim() || user?.email?.trim() || 'ACE Child Grow Reviewer';
}

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
      roles: distinctRoles(profile.staffRole, profile.additionalStaffRoles),
      qualification: profile.staffQualification?.trim() || null,
      displayName: profile.displayName?.trim() || null,
    };
  }
  return profile?.isStaff === true
    ? { role: 'owner', roles: ['owner'], qualification: null, displayName: profile.displayName?.trim() || null }
    : null;
}

/**
 * Resolve only an active, explicitly persisted staff role.
 *
 * `getStaffAccess` intentionally retains the legacy `isStaff -> owner`
 * bootstrap fallback for existing non-monetary admin workflows. Money-related
 * APIs must use this stricter path so a legacy boolean can never become payment
 * preparation or payment-approval authority.
 */
export async function getExplicitStaffAccess(
  ctx: Ctx,
  userId: Id<'users'>,
): Promise<StaffAccess | null> {
  const profile = await ctx.db
    .query('parentProfiles')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .unique();
  if (profile?.isStaff !== true || !profile.staffRole) return null;
  return {
    role: profile.staffRole,
    roles: distinctRoles(profile.staffRole, profile.additionalStaffRoles),
    qualification: profile.staffQualification?.trim() || null,
    displayName: profile.displayName?.trim() || null,
  };
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
  return access !== null && access.roles.some((role) => roles.includes(role));
}

export async function hasStaffCapability(
  ctx: Ctx,
  userId: Id<'users'>,
  capability: StaffCapability,
): Promise<boolean> {
  const access = await getStaffAccess(ctx, userId);
  return access !== null && hasCapability(access.roles, capability);
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
  if (!access || !access.roles.some((role) => roles.includes(role))) throw new Error('Insufficient staff permission');
  return { userId, access };
}

/**
 * Require an active staff profile with an explicit persisted role.
 *
 * Use this for monetary or similarly high-impact workflows. It deliberately
 * does not inherit `getStaffAccess`'s legacy `isStaff -> owner` fallback.
 * Additional roles are accepted only after an explicit primary role exists.
 */
export async function requireExplicitStaffRole(
  ctx: Ctx,
  roles: readonly StaffRole[],
): Promise<{ userId: Id<'users'>; access: StaffAccess }> {
  const userId = await requireUser(ctx);
  const access = await getExplicitStaffAccess(ctx, userId);
  if (!access || !access.roles.some((role) => roles.includes(role))) {
    throw new Error('Insufficient explicit staff permission');
  }
  return { userId, access };
}

export async function requireOwner(ctx: Ctx): Promise<Id<'users'>> {
  return (await requireOneOf(ctx, ['owner', 'system_admin'])).userId;
}

export async function requireReviewManager(ctx: Ctx): Promise<{ userId: Id<'users'>; access: StaffAccess }> {
  return await requireOneOf(ctx, ['owner', 'system_admin', 'review_manager']);
}

export async function requirePublisher(ctx: Ctx): Promise<{ userId: Id<'users'>; access: StaffAccess }> {
  return await requireOneOf(ctx, ['owner', 'publisher']);
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
    'myanmar_language_reviewer',
    'child_development_reviewer',
    'evidence_reviewer',
    'clinical_reviewer',
  ]);
}

export async function requireClinicalReviewer(
  ctx: Ctx,
): Promise<{ userId: Id<'users'>; qualification: string; reviewerName: string }> {
  const { userId, access } = await requireOneOf(ctx, ['clinical_reviewer']);
  if (!access.qualification) throw new Error('Clinical reviewer qualification is required');
  if (!access.displayName) throw new Error('Clinical reviewer name is required');
  return { userId, qualification: access.qualification, reviewerName: access.displayName };
}

/**
 * Publishing authority with an explicit scope. A clinical reviewer signs with
 * clinical scope. A qualified owner may sign education / special-education
 * material, but this never turns their decision into medical approval.
 */
export async function requireProfessionalPublisher(ctx: Ctx): Promise<ProfessionalApproval> {
  const { userId, access } = await requireOneOf(ctx, ['owner', 'clinical_reviewer']);
  if (!access.qualification) throw new Error('Professional qualification is required');
  if (access.role === 'clinical_reviewer') {
    if (!access.displayName) throw new Error('Clinical reviewer name is required');
    return {
      userId,
      qualification: access.qualification,
      reviewerName: access.displayName,
      scope: 'clinical',
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
 * Publishing parent-facing developmental or health content is a clinical
 * decision. Education-scoped owner approval is intentionally insufficient;
 * it remains valid for evidence/media governance but cannot expose guidance
 * to parent accounts as clinically reviewed content.
 */
export async function requireClinicalPublisher(ctx: Ctx): Promise<ProfessionalApproval> {
  const reviewer = await requireClinicalReviewer(ctx);
  return { ...reviewer, scope: 'clinical' };
}

/** Assert the child belongs to the caller (ownership guard for child sub-records). */
export async function ownChild(
  ctx: Ctx,
  childId: Id<'children'>,
  userId: Id<'users'>,
): Promise<Doc<'children'>> {
  const child = await ctx.db.get(childId);
  if (!child) throw new Error('Not found');
  if (child.userId !== userId) {
    const allowedOwners = await activeFamilyOwnerIds(ctx, userId);
    const allowed = allowedOwners.includes(child.userId);
    if (!allowed) throw new Error('Not found');
  }
  return child;
}
