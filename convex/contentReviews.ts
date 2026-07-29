import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { logAudit } from './audit';
import { getStaffAccess, requireReviewEditor, requireUser, type StaffRole } from './lib/auth';
import { staffRoleValidator as roleValidator } from './lib/reviewRoles';
import { requiredChecklistKeys } from './lib/reviewChecklists';

const dimensionValidator = v.union(
  v.literal('english'),
  v.literal('native_myanmar'),
  v.literal('development'),
  v.literal('evidence'),
  v.literal('safety'),
  v.literal('clinical'),
);

const decisionValidator = v.union(
  v.literal('in_review'),
  v.literal('approved'),
  v.literal('changes_requested'),
  v.literal('not_applicable'),
  v.literal('evidence_required'),
  v.literal('blocked'),
  v.literal('rejected'),
);

const reviewValidator = v.object({
  _id: v.id('contentReviews'),
  _creationTime: v.number(),
  contentSlug: v.string(),
  contentVersion: v.number(),
  dimension: dimensionValidator,
  decision: decisionValidator,
  note: v.optional(v.string()),
  reviewerId: v.id('users'),
  reviewerDisplayName: v.string(),
  reviewerQualification: v.optional(v.string()),
  reviewerRole: roleValidator,
  reviewedAt: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

type ReviewDimension = 'english' | 'native_myanmar' | 'development' | 'evidence' | 'safety' | 'clinical';
function roleMayReview(roles: readonly StaffRole[], dimension: ReviewDimension): boolean {
  if (dimension === 'clinical' || dimension === 'safety') return roles.includes('clinical_reviewer');
  if (dimension === 'development') return roles.includes('child_development_reviewer');
  if (dimension === 'evidence') {
    return roles.some((role) => ['evidence_reviewer', 'clinical_reviewer'].includes(role));
  }
  return roles.some((role) => ['language_reviewer', 'myanmar_language_reviewer'].includes(role));
}

function approvalNeedsQualification(dimension: ReviewDimension): boolean {
  return dimension === 'clinical' || dimension === 'safety' || dimension === 'evidence';
}

export const listForContent = query({
  args: { contentSlug: v.string() },
  returns: v.object({
    allowed: v.boolean(),
    contentVersion: v.union(v.number(), v.null()),
    current: v.array(reviewValidator),
    history: v.array(reviewValidator),
  }),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const access = await getStaffAccess(ctx, userId);
    if (!access || access.roles.every((role) => role === 'support')) {
      return { allowed: false, contentVersion: null, current: [], history: [] };
    }
    const content = await ctx.db
      .query('libraryContent')
      .withIndex('by_slug', (q) => q.eq('slug', args.contentSlug))
      .unique();
    if (!content) return { allowed: true, contentVersion: null, current: [], history: [] };
    const mayBrowseAll = access.roles.some((role) =>
      ['owner', 'system_admin', 'review_manager', 'content_editor', 'publisher', 'auditor'].includes(role),
    );
    if (!mayBrowseAll) {
      const assignments = await ctx.db.query('reviewAssignments')
        .withIndex('by_content_reviewer', (q) => q.eq('contentSlug', args.contentSlug).eq('reviewerId', userId))
        .order('desc')
        .take(20);
      const assigned = assignments.some((row) =>
        row.status !== 'cancelled' &&
        row.contentVersion === (content.reviewRevision ?? 1) &&
        access.roles.includes(row.reviewerType),
      );
      if (!assigned) return { allowed: false, contentVersion: null, current: [], history: [] };
    }
    const history = await ctx.db
      .query('contentReviews')
      .withIndex('by_content', (q) => q.eq('contentSlug', args.contentSlug))
      .order('desc')
      .take(100);
    const current = [];
    const seen = new Set<string>();
    for (const row of history) {
      if (row.contentVersion !== (content.reviewRevision ?? 1) || seen.has(row.dimension)) continue;
      seen.add(row.dimension);
      current.push(row);
    }
    return {
      allowed: true,
      contentVersion: content.reviewRevision ?? 1,
      current,
      history,
    };
  },
});

export const saveDecision = mutation({
  args: {
    contentSlug: v.string(),
    dimension: dimensionValidator,
    decision: decisionValidator,
    note: v.optional(v.string()),
  },
  returns: v.object({ ok: v.literal(true), contentVersion: v.number() }),
  handler: async (ctx, args) => {
    const { userId, access } = await requireReviewEditor(ctx);
    if (!roleMayReview(access.roles, args.dimension)) {
      throw new Error('This reviewer role cannot decide this review area');
    }
    const displayName = access.displayName?.trim();
    if (!displayName) throw new Error('Reviewer display name is required');
    if (
      args.decision === 'approved' &&
      approvalNeedsQualification(args.dimension) &&
      !access.qualification?.trim()
    ) {
      throw new Error('Professional qualification is required for this approval');
    }
    const note = args.note?.trim();
    if (['changes_requested', 'evidence_required', 'blocked', 'rejected'].includes(args.decision) && !note) {
      throw new Error('A note is required for this decision');
    }
    const content = await ctx.db
      .query('libraryContent')
      .withIndex('by_slug', (q) => q.eq('slug', args.contentSlug))
      .unique();
    if (!content) throw new Error('Content not found');
    const assignments = await ctx.db.query('reviewAssignments')
      .withIndex('by_content_reviewer', (q) => q.eq('contentSlug', args.contentSlug).eq('reviewerId', userId))
      .order('desc').take(20);
    const assignment = assignments.find((row) =>
      row.contentVersion === (content.reviewRevision ?? 1) &&
      !['cancelled', 'approved'].includes(row.status) &&
      access.roles.includes(row.reviewerType),
    );
    if (!assignment) throw new Error('An active assignment is required to review this content revision');
    if (args.decision === 'approved') {
      const checklist = await ctx.db.query('reviewChecklists')
        .withIndex('by_assignment_dimension', (q) => q.eq('assignmentId', assignment._id).eq('dimension', args.dimension))
        .unique();
      const checked = new Set(checklist?.responses.filter((response) => response.checked).map((response) => response.key) ?? []);
      const missing = requiredChecklistKeys(args.dimension).filter((key) => !checked.has(key));
      if (missing.length > 0) throw new Error('Complete every required checklist item before approval');
    }
    const now = Date.now();
    const values = {
      decision: args.decision,
      note: note || undefined,
      reviewerId: userId,
      reviewerDisplayName: displayName,
      reviewerQualification: access.qualification?.trim() || undefined,
      reviewerRole: access.role,
      reviewedAt: now,
      updatedAt: now,
    };
    await ctx.db.insert('contentReviews', {
      contentSlug: args.contentSlug,
      contentVersion: content.reviewRevision ?? 1,
      dimension: args.dimension,
      ...values,
      createdAt: now,
    });
    const assignmentStatus = args.decision === 'approved'
      ? 'approved'
      : args.decision === 'changes_requested'
        ? 'changes_requested'
        : args.decision === 'blocked' || args.decision === 'evidence_required'
          ? 'blocked'
          : 'in_review';
    await ctx.db.patch(assignment._id, {
      status: assignmentStatus,
      completionDate: assignmentStatus === 'approved' ? now : assignment.completionDate,
      updatedAt: now,
    });
    await ctx.db.insert('reviewEvents', {
      assignmentId: assignment._id,
      contentSlug: args.contentSlug,
      contentVersion: content.reviewRevision ?? 1,
      reviewRound: assignment.reviewRound,
      actorId: userId,
      action: `review.${args.dimension}.${args.decision}`,
      after: args.decision,
      reason: note,
      createdAt: now,
    });
    await logAudit(
      ctx,
      userId,
      `contentReview.${args.dimension}.${args.decision}`,
      'libraryContent',
      content._id,
      `${args.contentSlug} · review revision ${content.reviewRevision ?? 1}`,
    );
    return { ok: true as const, contentVersion: content.reviewRevision ?? 1 };
  },
});
