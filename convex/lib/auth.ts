// Shared authentication/authorization helpers for Convex functions.
//
// Single source of truth for the P0 rule: every data function derives the caller
// from getAuthUserId and scopes to that identity. Previously `isStaff`,
// `ownChild`, and the `getAuthUserId()+throw` idiom were copy-pasted across many
// modules; consolidating them here removes that duplication.
import { getAuthUserId } from '@convex-dev/auth/server';
import type { QueryCtx, MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';

export type Ctx = QueryCtx | MutationCtx;
export type StaffRole = 'owner' | 'content_editor' | 'clinical_reviewer' | 'support';

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
  return (await requireOneOf(ctx, ['owner', 'content_editor', 'clinical_reviewer'])).userId;
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

/** Assert the child belongs to the caller (ownership guard for child sub-records). */
export async function ownChild(
  ctx: Ctx,
  childId: Id<'children'>,
  userId: Id<'users'>,
): Promise<void> {
  const child = await ctx.db.get(childId);
  if (!child || child.userId !== userId) throw new Error('Not found');
}
