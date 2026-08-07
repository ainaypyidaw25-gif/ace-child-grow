import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getStaffAccess, requireUser, reviewerAuditName } from './lib/auth';
import { requiredChecklistKeys } from './lib/reviewChecklists';
import { logAudit } from './audit';
import type { QueryCtx, MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { mayActAsReviewerType, reviewerTypeMayReviewDimension } from './lib/reviewRoles';

const dimensionValidator = v.union(
  v.literal('english'), v.literal('native_myanmar'), v.literal('development'),
  v.literal('evidence'), v.literal('safety'), v.literal('clinical'),
);

const responseValidator = v.object({ key: v.string(), checked: v.boolean() });

async function assignedReview(ctx: QueryCtx | MutationCtx, assignmentId: Id<'reviewAssignments'>, dimension: string) {
  const userId = await requireUser(ctx);
  const assignment = await ctx.db.get(assignmentId);
  if (!assignment || !('reviewerId' in assignment) || assignment.reviewerId !== userId) {
    throw new Error('Assignment access denied');
  }
  const access = await getStaffAccess(ctx, userId);
  if (!access || !mayActAsReviewerType(access.roles, assignment.reviewerType)) throw new Error('Assignment access denied');
  if (!reviewerTypeMayReviewDimension(assignment.reviewerType, dimension)) throw new Error('This checklist is outside the assigned review area');
  if (assignment.status === 'cancelled') throw new Error('Assignment is no longer active');
  return { userId, assignment, access };
}

export const getMine = query({
  args: { assignmentId: v.id('reviewAssignments'), dimension: dimensionValidator },
  returns: v.object({
    requiredKeys: v.array(v.string()),
    responses: v.array(responseValidator),
    complete: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const { assignment } = await assignedReview(ctx, args.assignmentId, args.dimension);
    const row = await ctx.db.query('reviewChecklists')
      .withIndex('by_assignment_dimension', (q) => q.eq('assignmentId', assignment._id).eq('dimension', args.dimension))
      .unique();
    const requiredKeys = [...requiredChecklistKeys(args.dimension)];
    const checked = new Set(row?.responses.filter((response) => response.checked).map((response) => response.key) ?? []);
    return { requiredKeys, responses: row?.responses ?? [], complete: requiredKeys.every((key) => checked.has(key)) };
  },
});

export const saveMine = mutation({
  args: {
    assignmentId: v.id('reviewAssignments'),
    dimension: dimensionValidator,
    responses: v.array(responseValidator),
  },
  returns: v.object({ ok: v.literal(true), complete: v.boolean() }),
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const { userId, assignment, access } = await assignedReview(ctx, args.assignmentId, args.dimension);
    const requiredKeys = requiredChecklistKeys(args.dimension);
    const allowed = new Set(requiredKeys);
    if (args.responses.some((response) => !allowed.has(response.key as never))) {
      throw new Error('Checklist contains an unknown item');
    }
    const normalized = requiredKeys.map((key) => ({
      key,
      checked: args.responses.find((response) => response.key === key)?.checked === true,
    }));
    const now = Date.now();
    const existing = await ctx.db.query('reviewChecklists')
      .withIndex('by_assignment_dimension', (q) => q.eq('assignmentId', assignment._id).eq('dimension', args.dimension))
      .unique();
    if (existing) await ctx.db.patch(existing._id, { responses: normalized, updatedBy: userId, updatedAt: now });
    else await ctx.db.insert('reviewChecklists', {
      assignmentId: assignment._id,
      contentSlug: assignment.contentSlug,
      contentVersion: assignment.contentVersion,
      dimension: args.dimension,
      responses: normalized,
      updatedBy: userId,
      updatedAt: now,
    });
    const complete = normalized.every((response) => response.checked);
    const reviewHistory = await ctx.db.query('contentReviews')
      .withIndex('by_content_dimension_version', (q) => q
        .eq('contentSlug', assignment.contentSlug)
        .eq('dimension', args.dimension)
        .eq('contentVersion', assignment.contentVersion))
      .order('desc')
      .take(1);
    if (!complete && reviewHistory[0]?.decision === 'approved') {
      if ((args.dimension === 'clinical' || args.dimension === 'safety') && !access.displayName) {
        throw new Error('Clinical reviewer display name is required');
      }
      const displayName = await reviewerAuditName(ctx, userId, access);
      await ctx.db.insert('contentReviews', {
        contentSlug: assignment.contentSlug,
        contentVersion: assignment.contentVersion,
        dimension: args.dimension,
        decision: 'in_review',
        note: 'Approval reopened because the required checklist changed.',
        reviewerId: userId,
        reviewerDisplayName: displayName,
        reviewerQualification: access.qualification ?? undefined,
        reviewerRole: access.role,
        reviewedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.patch(assignment._id, { status: 'in_review', completionDate: undefined, reopenedDate: now, updatedAt: now });
    }
    const beforeChecked = existing?.responses.filter((response) => response.checked).map((response) => response.key).sort() ?? [];
    const afterChecked = normalized.filter((response) => response.checked).map((response) => response.key).sort();
    await ctx.db.insert('reviewEvents', {
      assignmentId: assignment._id,
      contentSlug: assignment.contentSlug,
      contentVersion: assignment.contentVersion,
      reviewRound: assignment.reviewRound,
      actorId: userId,
      action: 'review.checklist.saved',
      before: JSON.stringify(beforeChecked),
      after: JSON.stringify(afterChecked),
      createdAt: now,
    });
    await logAudit(ctx, userId, 'review.checklist.save', 'reviewAssignments', assignment._id, `${args.dimension}: ${complete ? 'complete' : 'incomplete'}`);
    return { ok: true as const, complete };
  },
});
