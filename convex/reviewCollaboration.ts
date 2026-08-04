import { v } from 'convex/values';
import { mutation, query, type QueryCtx, type MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { getStaffAccess, requireContentEditor, requireUser } from './lib/auth';
import { logAudit } from './audit';
import { mayActAsReviewerType } from './lib/reviewRoles';

const commentValidator = v.object({
  _id: v.id('reviewComments'), _creationTime: v.number(), assignmentId: v.id('reviewAssignments'),
  contentSlug: v.string(), contentVersion: v.number(), authorId: v.id('users'),
  authorDisplayName: v.string(), body: v.string(),
  visibility: v.union(v.literal('reviewer_and_manager'), v.literal('managers_only')), createdAt: v.number(),
});
const fieldValidator = v.union(v.literal('titleMm'), v.literal('summaryMm'), v.literal('structuredMyanmar'));
const proposalStatusValidator = v.union(v.literal('draft'), v.literal('submitted'), v.literal('accepted'), v.literal('rejected'));
const proposalValidator = v.object({
  _id: v.id('reviewProposals'), _creationTime: v.number(), assignmentId: v.id('reviewAssignments'),
  contentSlug: v.string(), contentVersion: v.number(), field: fieldValidator, proposedText: v.string(),
  reviewerId: v.id('users'), status: proposalStatusValidator, decisionReason: v.optional(v.string()),
  decidedBy: v.optional(v.id('users')), decidedAt: v.optional(v.number()), createdAt: v.number(), updatedAt: v.number(),
});

async function assignmentAccess(ctx: QueryCtx | MutationCtx, assignmentId: Id<'reviewAssignments'>) {
  const userId = await requireUser(ctx);
  const access = await getStaffAccess(ctx, userId);
  const assignment = await ctx.db.get(assignmentId);
  if (!access || !assignment) throw new Error('Assignment access denied');
  const manager = access.roles.some((role) => ['owner', 'system_admin', 'review_manager', 'content_editor', 'auditor'].includes(role));
  const reviewer = assignment.reviewerId === userId && mayActAsReviewerType(access.roles, assignment.reviewerType);
  if (!manager && !reviewer) throw new Error('Assignment access denied');
  return { userId, access, assignment, manager, reviewer };
}

export const list = query({
  args: { assignmentId: v.id('reviewAssignments') },
  returns: v.object({ comments: v.array(commentValidator), proposals: v.array(proposalValidator) }),
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const { userId, manager } = await assignmentAccess(ctx, args.assignmentId);
    const comments = await ctx.db.query('reviewComments').withIndex('by_assignment', (q) => q.eq('assignmentId', args.assignmentId)).collect();
    const proposals = await ctx.db.query('reviewProposals').withIndex('by_assignment', (q) => q.eq('assignmentId', args.assignmentId)).collect();
    return {
      comments: comments.filter((row) => manager || row.visibility === 'reviewer_and_manager' || row.authorId === userId),
      proposals,
    };
  },
});

export const addComment = mutation({
  args: {
    assignmentId: v.id('reviewAssignments'), body: v.string(),
    visibility: v.union(v.literal('reviewer_and_manager'), v.literal('managers_only')),
  },
  returns: v.object({ ok: v.literal(true), commentId: v.id('reviewComments') }),
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const { userId, access, assignment, manager } = await assignmentAccess(ctx, args.assignmentId);
    if (args.visibility === 'managers_only' && !manager) throw new Error('Only managers may create a manager-only note');
    const body = args.body.trim();
    if (!body) throw new Error('Comment is required');
    const now = Date.now();
    const commentId = await ctx.db.insert('reviewComments', {
      assignmentId: assignment._id, contentSlug: assignment.contentSlug, contentVersion: assignment.contentVersion,
      authorId: userId, authorDisplayName: access.displayName || 'Reviewer', body,
      visibility: args.visibility, createdAt: now,
    });
    await ctx.db.insert('reviewEvents', {
      assignmentId: assignment._id, contentSlug: assignment.contentSlug, contentVersion: assignment.contentVersion,
      reviewRound: assignment.reviewRound, actorId: userId, action: 'review.comment.added', after: args.visibility, createdAt: now,
    });
    await logAudit(ctx, userId, 'review.comment.add', 'reviewAssignments', assignment._id, args.visibility);
    return { ok: true as const, commentId };
  },
});

export const saveProposal = mutation({
  args: {
    assignmentId: v.id('reviewAssignments'), field: fieldValidator, proposedText: v.string(),
    submit: v.boolean(),
  },
  returns: v.object({ ok: v.literal(true), proposalId: v.id('reviewProposals') }),
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const { userId, assignment, reviewer } = await assignmentAccess(ctx, args.assignmentId);
    if (!reviewer || assignment.status === 'cancelled') throw new Error('Only the assigned reviewer may propose wording');
    const proposedText = args.proposedText.trim();
    if (!proposedText) throw new Error('Proposed wording is required');
    const now = Date.now();
    const proposalId = await ctx.db.insert('reviewProposals', {
      assignmentId: assignment._id, contentSlug: assignment.contentSlug, contentVersion: assignment.contentVersion,
      field: args.field, proposedText, reviewerId: userId, status: args.submit ? 'submitted' : 'draft',
      createdAt: now, updatedAt: now,
    });
    await ctx.db.insert('reviewEvents', {
      assignmentId: assignment._id, contentSlug: assignment.contentSlug, contentVersion: assignment.contentVersion,
      reviewRound: assignment.reviewRound, actorId: userId,
      action: args.submit ? 'review.proposal.submitted' : 'review.proposal.drafted', after: args.field, createdAt: now,
    });
    await logAudit(ctx, userId, 'review.proposal.save', 'reviewAssignments', assignment._id, `${args.field}: ${args.submit ? 'submitted' : 'draft'}`);
    return { ok: true as const, proposalId };
  },
});

export const decideProposal = mutation({
  args: {
    proposalId: v.id('reviewProposals'), decision: v.union(v.literal('accepted'), v.literal('rejected')),
    reason: v.string(),
  },
  returns: v.object({ ok: v.literal(true) }),
  handler: async (ctx, args) => {
    const userId = await requireContentEditor(ctx);
    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) throw new Error('Proposal not found');
    const assignment = await ctx.db.get(proposal.assignmentId);
    if (!assignment) throw new Error('Assignment not found');
    const reason = args.reason.trim();
    if (!reason) throw new Error('A decision reason is required');
    const now = Date.now();
    await ctx.db.patch(proposal._id, { status: args.decision, decisionReason: reason, decidedBy: userId, decidedAt: now, updatedAt: now });
    await ctx.db.insert('reviewEvents', {
      assignmentId: proposal.assignmentId, contentSlug: proposal.contentSlug, contentVersion: proposal.contentVersion,
      reviewRound: assignment.reviewRound, actorId: userId, action: `review.proposal.${args.decision}`,
      before: proposal.status, after: args.decision, reason, createdAt: now,
    });
    await logAudit(ctx, userId, `review.proposal.${args.decision}`, 'reviewProposals', proposal._id, reason);
    return { ok: true as const };
  },
});
