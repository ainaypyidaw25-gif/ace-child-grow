import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { logAudit } from './audit';
import { getStaffAccess, requireReviewEditor, requireUser, type StaffRole } from './lib/auth';

const dimensionValidator = v.union(
  v.literal('english'),
  v.literal('native_myanmar'),
  v.literal('evidence'),
  v.literal('safety'),
  v.literal('clinical'),
);

const decisionValidator = v.union(
  v.literal('in_review'),
  v.literal('approved'),
  v.literal('changes_requested'),
  v.literal('not_applicable'),
);

const roleValidator = v.union(
  v.literal('owner'),
  v.literal('content_editor'),
  v.literal('language_reviewer'),
  v.literal('evidence_reviewer'),
  v.literal('clinical_reviewer'),
  v.literal('support'),
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

type ReviewDimension = 'english' | 'native_myanmar' | 'evidence' | 'safety' | 'clinical';
function roleMayReview(role: StaffRole, dimension: ReviewDimension): boolean {
  if (dimension === 'clinical' || dimension === 'safety') return role === 'clinical_reviewer';
  if (dimension === 'evidence') {
    return ['owner', 'content_editor', 'evidence_reviewer', 'clinical_reviewer'].includes(role);
  }
  return ['owner', 'content_editor', 'language_reviewer'].includes(role);
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
    if (!access || access.role === 'support') {
      return { allowed: false, contentVersion: null, current: [], history: [] };
    }
    const content = await ctx.db
      .query('libraryContent')
      .withIndex('by_slug', (q) => q.eq('slug', args.contentSlug))
      .unique();
    if (!content) return { allowed: true, contentVersion: null, current: [], history: [] };
    const history = await ctx.db
      .query('contentReviews')
      .withIndex('by_content', (q) => q.eq('contentSlug', args.contentSlug))
      .order('desc')
      .take(100);
    return {
      allowed: true,
      contentVersion: content.reviewRevision ?? 1,
      current: history.filter((row) => row.contentVersion === (content.reviewRevision ?? 1)),
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
    if (!roleMayReview(access.role, args.dimension)) {
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
    if (args.decision === 'changes_requested' && !note) {
      throw new Error('A note is required when requesting changes');
    }
    const content = await ctx.db
      .query('libraryContent')
      .withIndex('by_slug', (q) => q.eq('slug', args.contentSlug))
      .unique();
    if (!content) throw new Error('Content not found');
    const now = Date.now();
    const existing = await ctx.db
      .query('contentReviews')
      .withIndex('by_content_dimension_version', (q) =>
        q.eq('contentSlug', args.contentSlug)
          .eq('dimension', args.dimension)
          .eq('contentVersion', content.reviewRevision ?? 1),
      )
      .unique();
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
    if (existing) {
      await ctx.db.patch(existing._id, values);
    } else {
      await ctx.db.insert('contentReviews', {
        contentSlug: args.contentSlug,
        contentVersion: content.reviewRevision ?? 1,
        dimension: args.dimension,
        ...values,
        createdAt: now,
      });
    }
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
