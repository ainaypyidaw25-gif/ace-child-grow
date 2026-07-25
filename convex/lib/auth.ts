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

/** The authenticated user id, or throw. Use in mutations that require a caller. */
export async function requireUser(ctx: Ctx): Promise<Id<'users'>> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error('Not authenticated');
  return userId;
}

/** Whether the given user is staff (Admin CMS access). */
export async function isStaff(ctx: Ctx, userId: Id<'users'>): Promise<boolean> {
  const profile = await ctx.db
    .query('parentProfiles')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .unique();
  return profile?.isStaff === true;
}

/** The authenticated user id if they are staff, or throw. */
export async function requireStaff(ctx: Ctx): Promise<Id<'users'>> {
  const userId = await requireUser(ctx);
  if (!(await isStaff(ctx, userId))) throw new Error('Staff only');
  return userId;
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
