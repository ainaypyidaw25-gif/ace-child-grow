import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { logAudit } from './audit';
import { getStaffAccess, requireUser } from './lib/auth';
import {
  compareQueueRows,
  computePriority,
  dashboardCounts,
  requiredDimensionsFor,
  REVIEW_DIMENSION_IDS,
  type PriorityStatus,
  type RiskClass,
} from './lib/ownerPriority';

// The owner-priority workspace: queues, governance labels and the security
// summary. Every function here is advisory-workflow only — nothing publishes,
// unpublishes, archives, approves, invites, or changes reviewScope. Publication
// remains exclusively with the existing, separately gated setReview flow.

const SCAN_LIMIT = 2000;

const priorityStatusValidator = v.union(
  v.literal('unreviewed'),
  v.literal('confirmed'),
  v.literal('correction_needed'),
  v.literal('assigned'),
  v.literal('in_review'),
  v.literal('corrected'),
  v.literal('ready_for_recheck'),
  v.literal('completed'),
);

const queueRowValidator = v.object({
  slug: v.string(),
  titleMm: v.string(),
  titleEn: v.string(),
  type: v.string(),
  category: v.union(v.string(), v.null()),
  ageGroupKey: v.union(v.string(), v.null()),
  domainKey: v.union(v.string(), v.null()),
  clinicalStatus: v.string(),
  reviewScope: v.union(v.string(), v.null()),
  reviewRevision: v.number(),
  parentVisibleNow: v.boolean(),
  priority: v.union(v.literal('P0'), v.literal('P1'), v.literal('P2'), v.literal('P3')),
  priorityReasons: v.array(v.string()),
  riskClass: v.union(v.literal('A'), v.literal('B'), v.literal('C'), v.literal('D'), v.literal('E')),
  riskReasons: v.array(v.string()),
  provisionalClassification: v.boolean(),
  requiredReviewDimensions: v.array(v.string()),
  outstandingDimensions: v.array(v.string()),
  activeReviewers: v.array(v.string()),
  evidenceStatus: v.string(),
  priorityStatus: priorityStatusValidator,
  temporarilyHideRecommended: v.boolean(),
  ownerNote: v.union(v.string(), v.null()),
  latestEditAt: v.union(v.number(), v.null()),
  latestDecisionAt: v.union(v.number(), v.null()),
  warnings: v.array(v.string()),
});

export const queues = query({
  args: {},
  returns: v.object({
    allowed: v.boolean(),
    truncatedReviews: v.boolean(),
    rows: v.array(queueRowValidator),
    counts: v.object({
      p0Remaining: v.number(),
      p1Remaining: v.number(),
      p2Remaining: v.number(),
      p3Remaining: v.number(),
      parentVisibleClassC: v.number(),
      clinicalReviewsRequired: v.number(),
      safetyReviewsRequired: v.number(),
      myanmarReviewsRequired: v.number(),
      correctionNeeded: v.number(),
      currentlyAssigned: v.number(),
      readyForRecheck: v.number(),
      completed: v.number(),
    }),
  }),
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const access = await getStaffAccess(ctx, userId);
    if (!access || access.role === 'support') {
      return {
        allowed: false,
        truncatedReviews: false,
        rows: [],
        counts: dashboardCounts([]),
      };
    }

    const content = await ctx.db.query('libraryContent').collect();
    const reviews = await ctx.db.query('contentReviews').order('desc').take(SCAN_LIMIT);
    const edits = await ctx.db.query('contentEditLogs').order('desc').take(SCAN_LIMIT);
    const links = await ctx.db.query('evidenceLinks').collect();
    const linkedSlugs = new Set(links.map((link) => link.slug));

    // Latest decision per (slug, dimension) at the row's current revision, plus
    // duplicate-submission detection (the lsn_balanced_meals defect): identical
    // decisions by the same reviewer for the same revision within one minute.
    const latestEditBySlug = new Map<string, number>();
    for (const edit of edits) {
      const prior = latestEditBySlug.get(edit.contentSlug);
      if (prior === undefined || edit.editedAt > prior) latestEditBySlug.set(edit.contentSlug, edit.editedAt);
    }
    const decisionsBySlug = new Map<string, typeof reviews>();
    for (const row of reviews) {
      const bucket = decisionsBySlug.get(row.contentSlug);
      if (bucket) bucket.push(row);
      else decisionsBySlug.set(row.contentSlug, [row]);
    }

    const rows = content.map((item) => {
      const revision = item.reviewRevision ?? 1;
      const slugDecisions = decisionsBySlug.get(item.slug) ?? [];
      const currentByDimension = new Map<string, (typeof reviews)[number]>();
      let latestDecisionAt: number | null = null;
      let workflowBlocker: string | null = null;
      const duplicateKeys = new Set<string>();
      for (const decision of slugDecisions) {
        if (latestDecisionAt === null || decision.reviewedAt > latestDecisionAt) latestDecisionAt = decision.reviewedAt;
        const identityKey = [decision.dimension, decision.decision, decision.reviewerId, decision.contentVersion, decision.note ?? ''].join('|');
        if (duplicateKeys.has(identityKey)) workflowBlocker = 'duplicate identical review decisions recorded';
        duplicateKeys.add(identityKey);
        if ((decision.reviewRevision ?? decision.contentVersion) !== revision) continue;
        if (!currentByDimension.has(decision.dimension)) currentByDimension.set(decision.dimension, decision);
      }

      const result = computePriority({
        slug: item.slug,
        type: item.type,
        category: item.category ?? null,
        ageGroupKey: item.ageGroupKey ?? null,
        domainKey: item.domainKey ?? null,
        titleMm: item.titleMm,
        titleEn: item.titleEn,
        summaryMm: item.summaryMm ?? null,
        summaryEn: item.summaryEn ?? null,
        tags: item.tags,
        data: item.data,
        clinicalStatus: item.clinicalStatus,
        riskClassification: item.riskClassification ?? null,
        ownerPriority: item.ownerPriority ?? null,
        riskReasons: item.riskReasons ?? null,
        priorityStatus: item.priorityStatus ?? null,
        workflowBlocker,
      });

      const required = item.requiredReviewDimensions?.length
        ? item.requiredReviewDimensions
        : requiredDimensionsFor(result.riskClass);
      const outstanding = required.filter((dimension) => {
        const decision = currentByDimension.get(dimension);
        return !decision || decision.decision !== 'approved';
      });
      const activeReviewers = [...new Set(
        slugDecisions
          .filter((decision) => (decision.reviewRevision ?? decision.contentVersion) === revision)
          .map((decision) => decision.reviewerDisplayName),
      )];

      const warnings: string[] = [];
      if (workflowBlocker) warnings.push(workflowBlocker);
      if (item.clinicalStatus === 'published' && result.riskClass === 'C') {
        warnings.push('parent-visible now with no clinical approval (education-scoped legacy publication)');
      }
      if (item.reviewScope === 'education') warnings.push('education-scoped review must never be read as clinical approval');
      if (!linkedSlugs.has(item.slug)) warnings.push('no evidence link recorded on this deployment');
      if (result.provisional) warnings.push('classification is provisional (in-app rules) — not yet owner-confirmed');

      return {
        slug: item.slug,
        titleMm: item.titleMm,
        titleEn: item.titleEn,
        type: item.type,
        category: item.category ?? null,
        ageGroupKey: item.ageGroupKey ?? null,
        domainKey: item.domainKey ?? null,
        clinicalStatus: item.clinicalStatus,
        reviewScope: item.reviewScope ?? null,
        reviewRevision: revision,
        parentVisibleNow: item.clinicalStatus === 'published',
        priority: result.priority,
        priorityReasons: result.priorityReasons,
        riskClass: result.riskClass,
        riskReasons: result.riskReasons,
        provisionalClassification: result.provisional,
        requiredReviewDimensions: required,
        outstandingDimensions: outstanding,
        activeReviewers,
        evidenceStatus: linkedSlugs.has(item.slug) ? 'linked' : 'missing',
        priorityStatus: (item.priorityStatus ?? 'unreviewed') as PriorityStatus,
        temporarilyHideRecommended: item.temporarilyHideRecommended ?? false,
        ownerNote: item.ownerNote ?? null,
        latestEditAt: latestEditBySlug.get(item.slug) ?? null,
        latestDecisionAt,
        warnings,
      };
    });

    rows.sort(compareQueueRows);
    return {
      allowed: true,
      truncatedReviews: reviews.length === SCAN_LIMIT,
      rows,
      counts: dashboardCounts(rows.map((row) => ({
        priority: row.priority,
        riskClass: row.riskClass,
        clinicalStatus: row.clinicalStatus,
        priorityStatus: row.priorityStatus,
        outstandingDimensions: row.outstandingDimensions,
      }))),
    };
  },
});

/**
 * Owner-only governance labels. Deliberately CANNOT touch clinicalStatus,
 * reviewScope, publicationStatus, reviewer identity or any review decision —
 * those fields are not accepted as arguments, so no caller can smuggle them in.
 */
export const setGovernance = mutation({
  args: {
    slug: v.string(),
    expectedReviewRevision: v.number(),
    priorityStatus: v.optional(priorityStatusValidator),
    ownerPriority: v.optional(v.union(v.literal('P0'), v.literal('P1'), v.literal('P2'), v.literal('P3'))),
    confirmClassification: v.optional(
      v.object({
        riskClassification: v.union(v.literal('A'), v.literal('B'), v.literal('C'), v.literal('D'), v.literal('E')),
        riskReasons: v.array(v.string()),
      }),
    ),
    temporarilyHideRecommended: v.optional(v.boolean()),
    ownerNote: v.optional(v.string()),
  },
  returns: v.union(
    v.object({ ok: v.literal(true) }),
    v.object({ ok: v.literal(false), code: v.string(), message: v.string() }),
  ),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const access = await getStaffAccess(ctx, userId);
    if (access?.role !== 'owner') {
      await logAudit(ctx, userId, 'ownerPriority.setGovernance', 'libraryContent', undefined, `${args.slug} · refused: owner_only`, { result: 'rejected' });
      return { ok: false as const, code: 'owner_only', message: 'Only the owner can change priority governance.' };
    }
    const item = await ctx.db
      .query('libraryContent')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();
    if (!item) return { ok: false as const, code: 'content_not_found', message: 'This content item no longer exists.' };
    if ((item.reviewRevision ?? 1) !== args.expectedReviewRevision) {
      await logAudit(ctx, userId, 'ownerPriority.setGovernance', 'libraryContent', item._id, `${args.slug} · refused: stale_revision`, { result: 'rejected' });
      return { ok: false as const, code: 'stale_revision', message: 'This item has newer changes. Refresh before saving.' };
    }

    const patch: Record<string, unknown> = {};
    const summary: string[] = [];
    if (args.priorityStatus !== undefined) { patch.priorityStatus = args.priorityStatus; summary.push(`status=${args.priorityStatus}`); }
    if (args.ownerPriority !== undefined) { patch.ownerPriority = args.ownerPriority; summary.push(`priority=${args.ownerPriority}`); }
    if (args.temporarilyHideRecommended !== undefined) {
      // Recommendation flag only — clinicalStatus is untouched, so visibility
      // does not change here. Acting on it stays a human publication decision.
      patch.temporarilyHideRecommended = args.temporarilyHideRecommended;
      summary.push(`hideRecommended=${args.temporarilyHideRecommended}`);
    }
    if (args.ownerNote !== undefined) { patch.ownerNote = args.ownerNote.trim() || undefined; summary.push('ownerNote'); }
    if (args.confirmClassification !== undefined) {
      patch.riskClassification = args.confirmClassification.riskClassification;
      patch.riskReasons = args.confirmClassification.riskReasons;
      patch.classificationConfirmedAt = Date.now();
      patch.classificationConfirmedBy = userId;
      if (!item.requiredReviewDimensions?.length) {
        patch.requiredReviewDimensions = requiredDimensionsFor(args.confirmClassification.riskClassification as RiskClass);
      }
      if (!item.priorityStatus || item.priorityStatus === 'unreviewed') patch.priorityStatus = 'confirmed';
      summary.push(`class=${args.confirmClassification.riskClassification} confirmed`);
    }
    if (Object.keys(patch).length === 0) {
      return { ok: false as const, code: 'nothing_to_change', message: 'No governance change was provided.' };
    }
    patch.updatedAt = Date.now();
    await ctx.db.patch(item._id, patch);
    await logAudit(ctx, userId, 'ownerPriority.setGovernance', 'libraryContent', item._id, `${args.slug} · ${summary.join(' · ')}`, { result: 'ok' });
    return { ok: true as const };
  },
});

/**
 * Record which review dimensions the owner is requesting for an item. This
 * creates NO reviewer assignment, invitation or decision — it only labels the
 * work so reviewers see it in their queues.
 */
export const requestReviews = mutation({
  args: {
    slug: v.string(),
    expectedReviewRevision: v.number(),
    dimensions: v.array(v.string()),
  },
  returns: v.union(
    v.object({ ok: v.literal(true), requiredReviewDimensions: v.array(v.string()) }),
    v.object({ ok: v.literal(false), code: v.string(), message: v.string() }),
  ),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const access = await getStaffAccess(ctx, userId);
    if (!access || !['owner', 'content_editor'].includes(access.role)) {
      return { ok: false as const, code: 'not_allowed', message: 'Only the owner or a content editor can request reviews.' };
    }
    const invalid = args.dimensions.filter((dimension) => !(REVIEW_DIMENSION_IDS as readonly string[]).includes(dimension));
    if (invalid.length > 0) {
      return { ok: false as const, code: 'unknown_dimension', message: `Unknown review dimension: ${invalid.join(', ')}` };
    }
    const item = await ctx.db
      .query('libraryContent')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();
    if (!item) return { ok: false as const, code: 'content_not_found', message: 'This content item no longer exists.' };
    if ((item.reviewRevision ?? 1) !== args.expectedReviewRevision) {
      return { ok: false as const, code: 'stale_revision', message: 'This item has newer changes. Refresh before saving.' };
    }
    const merged = [...new Set([...(item.requiredReviewDimensions ?? []), ...args.dimensions])];
    await ctx.db.patch(item._id, {
      requiredReviewDimensions: merged,
      ...(item.priorityStatus === undefined || item.priorityStatus === 'unreviewed' || item.priorityStatus === 'confirmed'
        ? { priorityStatus: 'assigned' as const }
        : {}),
      updatedAt: Date.now(),
    });
    await logAudit(ctx, userId, 'ownerPriority.requestReviews', 'libraryContent', item._id, `${args.slug} · ${args.dimensions.join(', ')}`, { result: 'ok' });
    return { ok: true as const, requiredReviewDimensions: merged };
  },
});

/**
 * Owner-only security summary of rejected staff-invite claims. Raw invitation
 * codes are never stored anywhere (only their hashes), so nothing here can leak
 * a token; the summary exposes categories and timing, not credentials.
 */
export const securitySummary = query({
  args: {},
  returns: v.object({
    allowed: v.boolean(),
    totalRejected: v.number(),
    byCategory: v.object({
      expired: v.number(),
      wrongAccount: v.number(),
      invalidOrReused: v.number(),
    }),
    distinctActors: v.number(),
    suspicious: v.boolean(),
    recent: v.array(v.object({
      at: v.number(),
      category: v.string(),
      hasActor: v.boolean(),
    })),
  }),
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const access = await getStaffAccess(ctx, userId);
    if (access?.role !== 'owner') {
      return {
        allowed: false,
        totalRejected: 0,
        byCategory: { expired: 0, wrongAccount: 0, invalidOrReused: 0 },
        distinctActors: 0,
        suspicious: false,
        recent: [],
      };
    }
    const rejections = await ctx.db
      .query('auditLogs')
      .withIndex('by_action', (q) => q.eq('action', 'staff.invite.claim_rejected'))
      .order('desc')
      .take(500);
    const categorize = (summary: string | undefined): 'expired' | 'wrongAccount' | 'invalidOrReused' => {
      if (summary === 'expired') return 'expired';
      if (summary === 'wrong account') return 'wrongAccount';
      return 'invalidOrReused';
    };
    const byCategory = { expired: 0, wrongAccount: 0, invalidOrReused: 0 };
    const actors = new Set<string>();
    for (const row of rejections) {
      byCategory[categorize(row.summary)] += 1;
      if (row.actorId) actors.add(String(row.actorId));
    }
    // Heuristic, not verdict: many invalid (not merely expired) attempts is the
    // pattern of someone probing codes and deserves the owner's eyes.
    const suspicious = byCategory.invalidOrReused + byCategory.wrongAccount >= 10;
    return {
      allowed: true,
      totalRejected: rejections.length,
      byCategory,
      distinctActors: actors.size,
      suspicious,
      recent: rejections.slice(0, 20).map((row) => ({
        at: row._creationTime,
        category: categorize(row.summary),
        hasActor: row.actorId !== undefined,
      })),
    };
  },
});

/**
 * Owner-only snapshot for the classification import PREVIEW. Read-only: the
 * plan is computed in the browser with convex/lib/classificationImport, and no
 * apply mutation exists in this build.
 */
export const importPreviewRows = query({
  args: {},
  returns: v.object({
    allowed: v.boolean(),
    rows: v.array(v.object({
      slug: v.string(),
      type: v.string(),
      clinicalStatus: v.string(),
      reviewRevision: v.union(v.number(), v.null()),
      riskClassification: v.union(v.string(), v.null()),
      ownerPriority: v.union(v.string(), v.null()),
      riskReasons: v.union(v.array(v.string()), v.null()),
      requiredReviewDimensions: v.union(v.array(v.string()), v.null()),
      classificationRunId: v.union(v.string(), v.null()),
      priorityStatus: v.union(v.string(), v.null()),
    })),
  }),
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const access = await getStaffAccess(ctx, userId);
    if (access?.role !== 'owner') return { allowed: false, rows: [] };
    const content = await ctx.db.query('libraryContent').collect();
    return {
      allowed: true,
      rows: content.map((item) => ({
        slug: item.slug,
        type: item.type,
        clinicalStatus: item.clinicalStatus,
        reviewRevision: item.reviewRevision ?? null,
        riskClassification: item.riskClassification ?? null,
        ownerPriority: item.ownerPriority ?? null,
        riskReasons: item.riskReasons ?? null,
        requiredReviewDimensions: item.requiredReviewDimensions ?? null,
        classificationRunId: item.classificationRunId ?? null,
        priorityStatus: item.priorityStatus ?? null,
      })),
    };
  },
});
