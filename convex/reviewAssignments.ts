import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { logAudit } from './audit';
import { getStaffAccess, requireReviewManager, requireUser } from './lib/auth';
import type { MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';

const reviewerTypeValidator = v.union(
  v.literal('language_reviewer'),
  v.literal('myanmar_language_reviewer'),
  v.literal('child_development_reviewer'),
  v.literal('evidence_reviewer'),
  v.literal('clinical_reviewer'),
);

const priorityValidator = v.union(
  v.literal('low'), v.literal('normal'), v.literal('high'), v.literal('urgent'),
);

const statusValidator = v.union(
  v.literal('assigned'),
  v.literal('in_review'),
  v.literal('changes_requested'),
  v.literal('revised'),
  v.literal('re_review_required'),
  v.literal('approved'),
  v.literal('blocked'),
  v.literal('cancelled'),
);

const assignmentValidator = v.object({
  _id: v.id('reviewAssignments'),
  _creationTime: v.number(),
  contentSlug: v.string(),
  contentVersion: v.number(),
  reviewerId: v.id('users'),
  reviewerType: reviewerTypeValidator,
  assignedBy: v.id('users'),
  assignedAt: v.number(),
  dueAt: v.optional(v.number()),
  priority: priorityValidator,
  reviewRound: v.number(),
  reviewScope: v.string(),
  status: statusValidator,
  completionDate: v.optional(v.number()),
  reopenedDate: v.optional(v.number()),
  paymentBatchId: v.optional(v.string()),
  internalNotes: v.optional(v.string()),
  cancellationReason: v.optional(v.string()),
  updatedAt: v.number(),
});

async function recordEvent(
  ctx: MutationCtx,
  values: {
    assignmentId: Id<'reviewAssignments'>;
    contentSlug: string;
    contentVersion: number;
    reviewRound: number;
    actorId: Id<'users'>;
    action: string;
    before?: string;
    after?: string;
    reason?: string;
  },
) {
  await ctx.db.insert('reviewEvents', { ...values, createdAt: Date.now() });
}

export const listMine = query({
  args: { status: v.optional(statusValidator), limit: v.optional(v.number()) },
  returns: v.array(v.object({
    assignment: assignmentValidator,
    titleMm: v.string(),
    titleEn: v.string(),
    ageGroupKey: v.union(v.string(), v.null()),
    contentType: v.string(),
  })),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const access = await getStaffAccess(ctx, userId);
    if (!access) return [];
    const limit = Math.max(1, Math.min(100, Math.floor(args.limit ?? 50)));
    const rows = args.status
      ? await ctx.db.query('reviewAssignments')
        .withIndex('by_reviewer_status', (q) => q.eq('reviewerId', userId).eq('status', args.status!))
        .order('desc').take(limit)
      : await ctx.db.query('reviewAssignments')
        .withIndex('by_reviewer', (q) => q.eq('reviewerId', userId))
        .order('desc').take(limit);
    const result = [];
    for (const assignment of rows) {
      if (!access.roles.includes(assignment.reviewerType)) continue;
      const content = await ctx.db.query('libraryContent')
        .withIndex('by_slug', (q) => q.eq('slug', assignment.contentSlug)).unique();
      if (!content) continue;
      result.push({
        assignment,
        titleMm: content.titleMm,
        titleEn: content.titleEn,
        ageGroupKey: content.ageGroupKey ?? null,
        contentType: content.type,
      });
    }
    return result;
  },
});

export const create = mutation({
  args: {
    contentSlug: v.string(),
    reviewerId: v.id('users'),
    reviewerType: reviewerTypeValidator,
    dueAt: v.optional(v.number()),
    priority: priorityValidator,
    reviewScope: v.string(),
    internalNotes: v.optional(v.string()),
  },
  returns: v.object({ ok: v.literal(true), assignmentId: v.id('reviewAssignments') }),
  handler: async (ctx, args) => {
    const { userId: managerId } = await requireReviewManager(ctx);
    const reviewer = await getStaffAccess(ctx, args.reviewerId);
    if (!reviewer?.roles.includes(args.reviewerType)) {
      throw new Error('Reviewer does not hold the assigned reviewer role');
    }
    const content = await ctx.db.query('libraryContent')
      .withIndex('by_slug', (q) => q.eq('slug', args.contentSlug)).unique();
    if (!content) throw new Error('Content not found');
    const existing = await ctx.db.query('reviewAssignments')
      .withIndex('by_content_reviewer', (q) => q.eq('contentSlug', args.contentSlug).eq('reviewerId', args.reviewerId))
      .order('desc').take(20);
    if (existing.some((row) => row.status !== 'cancelled' && row.contentVersion === (content.reviewRevision ?? 1))) {
      throw new Error('An active assignment already exists for this reviewer and revision');
    }
    const now = Date.now();
    const assignmentId = await ctx.db.insert('reviewAssignments', {
      contentSlug: args.contentSlug,
      contentVersion: content.reviewRevision ?? 1,
      reviewerId: args.reviewerId,
      reviewerType: args.reviewerType,
      assignedBy: managerId,
      assignedAt: now,
      dueAt: args.dueAt,
      priority: args.priority,
      reviewRound: 1,
      reviewScope: args.reviewScope.trim(),
      status: 'assigned',
      internalNotes: args.internalNotes?.trim() || undefined,
      updatedAt: now,
    });
    await recordEvent(ctx, {
      assignmentId, contentSlug: args.contentSlug, contentVersion: content.reviewRevision ?? 1,
      reviewRound: 1, actorId: managerId, action: 'assignment.created', after: 'assigned',
    });
    await logAudit(ctx, managerId, 'review.assignment.create', 'reviewAssignments', assignmentId, args.contentSlug);
    return { ok: true as const, assignmentId };
  },
});

export const transition = mutation({
  args: {
    assignmentId: v.id('reviewAssignments'),
    status: statusValidator,
    reason: v.optional(v.string()),
  },
  returns: v.object({ ok: v.literal(true) }),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) throw new Error('Assignment not found');
    const access = await getStaffAccess(ctx, userId);
    const manager = access?.roles.some((role) => ['owner', 'system_admin', 'review_manager'].includes(role)) ?? false;
    const assignedReviewer = assignment.reviewerId === userId && access?.roles.includes(assignment.reviewerType);
    if (!manager && !assignedReviewer) throw new Error('Assignment access denied');
    if (!manager && ['cancelled', 'revised', 're_review_required', 'approved'].includes(args.status)) {
      throw new Error('Only a review manager may perform this transition');
    }
    const reason = args.reason?.trim();
    if (['changes_requested', 'blocked', 'cancelled'].includes(args.status) && !reason) {
      throw new Error('A reason is required for this transition');
    }
    const now = Date.now();
    await ctx.db.patch(assignment._id, {
      status: args.status,
      completionDate: args.status === 'approved' ? now : assignment.completionDate,
      reopenedDate: ['revised', 're_review_required'].includes(args.status) ? now : assignment.reopenedDate,
      cancellationReason: args.status === 'cancelled' ? reason : assignment.cancellationReason,
      updatedAt: now,
    });
    await recordEvent(ctx, {
      assignmentId: assignment._id,
      contentSlug: assignment.contentSlug,
      contentVersion: assignment.contentVersion,
      reviewRound: assignment.reviewRound,
      actorId: userId,
      action: 'assignment.transition',
      before: assignment.status,
      after: args.status,
      reason,
    });
    await logAudit(ctx, userId, 'review.assignment.transition', 'reviewAssignments', assignment._id, `${assignment.status} → ${args.status}`);
    return { ok: true as const };
  },
});
