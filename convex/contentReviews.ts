import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { logAudit } from './audit';
import { getStaffAccess, requireUser, type StaffRole } from './lib/auth';
import { isRetiredContentSlug } from './lib/contentRetirements';
import { reviewRefusal, type ReviewDimension } from './lib/reviewPolicy';
import { isPersistedReleaseGovernedContent } from './lib/clinicalReviewBatchProvenance';

const dimensionValidator = v.union(
  v.literal('english'),
  v.literal('native_myanmar'),
  v.literal('child_development'),
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
  v.literal('review_manager'),
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
  reviewRevision: v.optional(v.number()),
  decisionKey: v.optional(v.string()),
  clinicalReviewBatchId: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

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
    if (!access || access.role === 'support' || access.role === 'clinical_reviewer') {
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
    const contentVersion = content.reviewRevision ?? 1;
    const current: typeof history = [];
    const seenDimensions = new Set<ReviewDimension>();
    for (const row of history) {
      if (row.contentVersion !== contentVersion || seenDimensions.has(row.dimension)) continue;
      current.push(row);
      seenDimensions.add(row.dimension);
    }
    return {
      allowed: true,
      contentVersion,
      current,
      history,
    };
  },
});

/**
 * Cross-content reviewer activity, for the owner.
 *
 * `listForContent` above answers "what happened to this item", which is the
 * reviewer's question. It cannot answer the owner's question — "what have my
 * reviewers actually done" — because it is scoped to one slug, so auditing the
 * team meant opening each library item in turn. The audit log is no substitute:
 * it is a capped, mixed stream of every action in the system, so review
 * decisions age out of it and carry no reviewer name, dimension or note.
 *
 * Restricted to owner and content_editor. Reviewer notes and professional
 * qualifications are personnel-adjacent records, so reviewer roles cannot read
 * each other's decisions here; they still see full history for any item they
 * open, via listForContent.
 *
 * `truncated` is returned rather than silently capping: a partial window that
 * looks complete would misreport a reviewer's workload.
 */
const SCAN_LIMIT = 2000;

export const activity = query({
  args: {
    reviewerId: v.optional(v.id('users')),
    dimension: v.optional(dimensionValidator),
    decision: v.optional(decisionValidator),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    allowed: v.boolean(),
    truncated: v.boolean(),
    totalScanned: v.number(),
    decisions: v.array(reviewValidator),
    reviewers: v.array(
      v.object({
        reviewerId: v.id('users'),
        displayName: v.string(),
        role: roleValidator,
        qualification: v.union(v.string(), v.null()),
        total: v.number(),
        approved: v.number(),
        changesRequested: v.number(),
        inReview: v.number(),
        notApplicable: v.number(),
        distinctItems: v.number(),
        lastReviewedAt: v.union(v.number(), v.null()),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const access = await getStaffAccess(ctx, userId);
    const empty = {
      allowed: false,
      truncated: false,
      totalScanned: 0,
      decisions: [],
      reviewers: [],
    };
    if (!access || !['owner', 'content_editor'].includes(access.role)) return empty;

    // A reviewer filter can use the by_reviewer index; otherwise walk newest-first.
    const scanned = args.reviewerId
      ? await ctx.db
          .query('contentReviews')
          .withIndex('by_reviewer', (q) => q.eq('reviewerId', args.reviewerId!))
          .order('desc')
          .take(SCAN_LIMIT)
      : await ctx.db.query('contentReviews').order('desc').take(SCAN_LIMIT);

    // The summary is built from everything scanned, so counts do not shift when
    // the caller narrows the visible list.
    const byReviewer = new Map<
      string,
      {
        reviewerId: Id<'users'>;
        displayName: string;
        role: StaffRole;
        qualification: string | null;
        total: number;
        approved: number;
        changesRequested: number;
        inReview: number;
        notApplicable: number;
        slugs: Set<string>;
        lastReviewedAt: number | null;
      }
    >();
    for (const row of scanned) {
      const key = row.reviewerId as string;
      let entry = byReviewer.get(key);
      if (!entry) {
        entry = {
          reviewerId: row.reviewerId,
          displayName: row.reviewerDisplayName,
          role: row.reviewerRole,
          qualification: row.reviewerQualification ?? null,
          total: 0,
          approved: 0,
          changesRequested: 0,
          inReview: 0,
          notApplicable: 0,
          slugs: new Set<string>(),
          lastReviewedAt: null,
        };
        byReviewer.set(key, entry);
      }
      entry.total += 1;
      entry.slugs.add(row.contentSlug);
      if (row.decision === 'approved') entry.approved += 1;
      else if (row.decision === 'changes_requested') entry.changesRequested += 1;
      else if (row.decision === 'in_review') entry.inReview += 1;
      else entry.notApplicable += 1;
      if (entry.lastReviewedAt === null || row.reviewedAt > entry.lastReviewedAt) {
        entry.lastReviewedAt = row.reviewedAt;
      }
      // Keep the most recent name/qualification a reviewer signed under.
      if (entry.lastReviewedAt === row.reviewedAt) {
        entry.displayName = row.reviewerDisplayName;
        entry.qualification = row.reviewerQualification ?? null;
        entry.role = row.reviewerRole;
      }
    }

    const filtered = scanned.filter(
      (row) =>
        (!args.dimension || row.dimension === args.dimension) &&
        (!args.decision || row.decision === args.decision),
    );
    const limit = Math.min(Math.max(args.limit ?? 100, 1), 500);

    return {
      allowed: true,
      truncated: scanned.length === SCAN_LIMIT,
      totalScanned: scanned.length,
      decisions: filtered.slice(0, limit),
      reviewers: [...byReviewer.values()]
        .map(({ slugs, ...rest }) => ({ ...rest, distinctItems: slugs.size }))
        .sort((a, b) => (b.lastReviewedAt ?? 0) - (a.lastReviewedAt ?? 0)),
    };
  },
});

export const saveDecision = mutation({
  args: {
    contentSlug: v.string(),
    dimension: dimensionValidator,
    decision: decisionValidator,
    note: v.optional(v.string()),
    // The revision the reviewer was looking at. REQUIRED: a decision must never
    // land on content the reviewer has not seen. An old client or a direct call
    // that omits it is rejected by the validator before the handler runs —
    // "accept it if absent" would silently reintroduce the exact defect this
    // guards against.
    expectedReviewRevision: v.number(),
  },
  returns: v.union(
    v.object({ ok: v.literal(true), contentVersion: v.number(), duplicate: v.optional(v.boolean()) }),
    v.object({ ok: v.literal(false), code: v.string(), message: v.string() }),
  ),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const access = await getStaffAccess(ctx, userId);

    // Once a release assignment is materialized, every dimension and every
    // staff role is bound to its exact assignment lane. A generic decision
    // would change the frozen review-history preimage even if its role would
    // normally be permitted for that dimension.
    if (await isPersistedReleaseGovernedContent(ctx, args.contentSlug)) {
      await logAudit(
        ctx,
        userId,
        `contentReview.${args.dimension}.${args.decision}`,
        'libraryContent',
        undefined,
        `${args.contentSlug} · refused: frozen_release_assignment_required`,
        { result: 'rejected' },
      );
      return {
        ok: false as const,
        code: 'assignment_required',
        message: 'Frozen release decisions must be recorded through the exact assigned batch.',
      };
    }

    // Clinical reviewer authority is assignment-scoped. The frozen batch
    // mutation validates the exact row/revision/snapshot and is the sole path
    // for that role; this broad mutation must never be a scope escape.
    if (access?.role === 'clinical_reviewer') {
      await logAudit(
        ctx,
        userId,
        `contentReview.${args.dimension}.${args.decision}`,
        'libraryContent',
        undefined,
        `${args.contentSlug} · refused: assignment_required`,
        { result: 'rejected' },
      );
      return {
        ok: false as const,
        code: 'assignment_required',
        message: 'Clinical reviewer decisions must be recorded through the assigned frozen batch.',
      };
    }

    const content = await ctx.db
      .query('libraryContent')
      .withIndex('by_slug', (q) => q.eq('slug', args.contentSlug))
      .unique();

    // Every refusal is returned in-band and audited. Throwing would reach the
    // reviewer as an opaque "Server Error" on a production deployment (Convex
    // redacts thrown messages) and would roll back the audit row recording it.
    const refusal = reviewRefusal({
      role: access?.role,
      dimension: args.dimension,
      decision: args.decision,
      displayName: access?.displayName,
      qualification: access?.qualification,
      note: args.note,
      contentExists: content !== null,
    });
    if (refusal) {
      await logAudit(
        ctx,
        userId,
        `contentReview.${args.dimension}.${args.decision}`,
        'libraryContent',
        content?._id,
        `${args.contentSlug} · refused: ${refusal.code}`,
        { result: 'rejected' },
      );
      return { ok: false as const, code: refusal.code, message: refusal.message };
    }

    if (isRetiredContentSlug(args.contentSlug)) {
      const message = 'This content was retired by an immutable release and cannot receive new review decisions.';
      await logAudit(
        ctx,
        userId,
        `contentReview.${args.dimension}.${args.decision}`,
        'libraryContent',
        content?._id,
        `${args.contentSlug} · refused: retired_content`,
        { result: 'rejected' },
      );
      return { ok: false as const, code: 'retired_content', message };
    }

    // reviewRefusal has already established these.
    const displayName = (access?.displayName ?? '').trim();
    const note = args.note?.trim();
    if (!content || !access) {
      return { ok: false as const, code: 'content_not_found', message: 'This content item no longer exists.' };
    }
    const reviewRevision = content.reviewRevision ?? 1;
    if (args.expectedReviewRevision !== reviewRevision) {
      await logAudit(
        ctx,
        userId,
        `contentReview.${args.dimension}.${args.decision}`,
        'libraryContent',
        content._id,
        `${args.contentSlug} · refused: stale_revision (saw ${args.expectedReviewRevision}, now ${reviewRevision})`,
        { result: 'rejected' },
      );
      return {
        ok: false as const,
        code: 'stale_revision',
        message: 'This content changed after you loaded it. Review the new revision before deciding.',
      };
    }

    // Idempotency guard: an identical decision by the same reviewer for the
    // same dimension and revision is acknowledged, not duplicated. This is the
    // server-side fix for the triple-submitted lsn_balanced_meals decision —
    // a retry (double-tap, flaky network, replayed request) can no longer
    // create a second history row or a second audit event.
    const existing = await ctx.db
      .query('contentReviews')
      .withIndex('by_content_dimension_version', (q) =>
        q.eq('contentSlug', args.contentSlug).eq('dimension', args.dimension).eq('contentVersion', reviewRevision),
      )
      .order('desc')
      .take(20);
    const identical = existing.find(
      (row) =>
        row.reviewerId === userId &&
        row.decision === args.decision &&
        (row.note ?? '') === (note || ''),
    );
    if (identical) {
      return { ok: true as const, contentVersion: reviewRevision, duplicate: true };
    }

    const now = Date.now();
    await ctx.db.insert('contentReviews', {
      contentSlug: args.contentSlug,
      contentVersion: reviewRevision,
      // Explicit, unambiguous binding: decisions apply to exactly this
      // reviewRevision (contentVersion above carries the same value for
      // backwards compatibility with existing rows and readers).
      reviewRevision,
      dimension: args.dimension,
      decision: args.decision,
      note: note || undefined,
      reviewerId: userId,
      reviewerDisplayName: displayName,
      reviewerQualification: access.qualification?.trim() || undefined,
      reviewerRole: access.role,
      reviewedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    await logAudit(
      ctx,
      userId,
      `contentReview.${args.dimension}.${args.decision}`,
      'libraryContent',
      content._id,
      `${args.contentSlug} · review revision ${content.reviewRevision ?? 1}`,
      { result: 'ok' },
    );
    return { ok: true as const, contentVersion: content.reviewRevision ?? 1 };
  },
});
