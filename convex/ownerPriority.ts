import { v } from 'convex/values';
import { internalQuery, mutation, query } from './_generated/server';
import type { QueryCtx } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import { logAudit } from './audit';
import { getStaffAccess, requireUser, type StaffAccess } from './lib/auth';
import {
  coerceOwnerPriority,
  coercePriorityStatus,
  coerceRiskClass,
  compareQueueRows,
  completionRefusal,
  computePriority,
  dashboardCounts,
  needsManualTriage,
  OWNER_PRIORITIES,
  PRIORITY_STATUSES,
  requiredDimensionsFor,
  REVIEW_DIMENSION_IDS,
  RISK_CLASSES,
  suggestedDimensionsFor,
  type PriorityStatus,
  type RiskClass,
} from './lib/ownerPriority';
import {
  mayManageGovernance,
  mayRequestReviews,
  maySeeReviewerActivity,
  queueAccessLevel,
  rowInReviewerScope,
} from './lib/ownerPriorityAccess';

// The owner-priority workspace: queues, governance labels and the security
// summary. Every function here is advisory-workflow only — nothing publishes,
// unpublishes, archives, approves, invites, or changes reviewScope. Publication
// remains exclusively with the existing, separately gated setReview flow.

// Hard ceilings. Reaching one means the deployment has outgrown a single-query
// projection; the queue then reports dataComplete:false and REFUSES to state
// authoritative completion, rather than quietly computing counts from a
// truncated tail (which reads as "nothing outstanding" — the most dangerous
// possible wrong answer for a safety queue).
const REVIEW_PAGE = 1000;
const MAX_REVIEW_PAGES = 20;
const EDIT_PAGE = 1000;
const MAX_EDIT_PAGES = 20;

const priorityStatusValidator = v.union(
  v.literal('unreviewed'),
  v.literal('confirmed'),
  v.literal('manual_triage_required'),
  v.literal('correction_needed'),
  v.literal('review_requested'),
  v.literal('assigned'),
  v.literal('in_review'),
  v.literal('corrected'),
  v.literal('ready_for_recheck'),
  v.literal('triage_complete'),
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
  /** Confirmed requirements only. Empty for untriaged D/E. */
  requiredReviewDimensions: v.array(v.string()),
  /** Conservative recommendation — advisory, never a stored requirement. */
  suggestedReviewDimensions: v.array(v.string()),
  manualTriageRequired: v.boolean(),
  outstandingDimensions: v.array(v.string()),
  approvedDimensions: v.array(v.string()),
  /** Empty unless the caller may see reviewer activity. */
  activeReviewers: v.array(v.string()),
  hasActiveAssignment: v.boolean(),
  evidenceStatus: v.string(),
  priorityStatus: priorityStatusValidator,
  temporarilyHideRecommended: v.boolean(),
  ownerNote: v.union(v.string(), v.null()),
  latestEditAt: v.union(v.number(), v.null()),
  latestDecisionAt: v.union(v.number(), v.null()),
  warnings: v.array(v.string()),
});

const countsValidator = v.object({
  p0Remaining: v.number(),
  p1Remaining: v.number(),
  p2Remaining: v.number(),
  p3Remaining: v.number(),
  parentVisibleClassC: v.number(),
  clinicalReviewsRequired: v.number(),
  safetyReviewsRequired: v.number(),
  myanmarReviewsRequired: v.number(),
  correctionNeeded: v.number(),
  manualTriageRequired: v.number(),
  reviewRequested: v.number(),
  currentlyAssigned: v.number(),
  readyForRecheck: v.number(),
  completed: v.number(),
});

type ReviewRow = { contentSlug: string; dimension: string; decision: string; reviewerId: unknown; contentVersion: number; reviewRevision?: number; note?: string; reviewedAt: number; reviewerDisplayName: string };

/**
 * Load every review decision by paging the table, or report that it could not
 * be loaded in full. Never returns a silently truncated set.
 */
async function loadAllReviews(ctx: QueryCtx): Promise<{ rows: ReviewRow[]; complete: boolean }> {
  const rows: ReviewRow[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < MAX_REVIEW_PAGES; page += 1) {
    const result = await ctx.db
      .query('contentReviews')
      .order('desc')
      .paginate({ numItems: REVIEW_PAGE, cursor });
    rows.push(...(result.page as unknown as ReviewRow[]));
    if (result.isDone) return { rows, complete: true };
    cursor = result.continueCursor;
  }
  return { rows, complete: false };
}

type EditRow = { contentSlug: string; editedAt: number };

async function loadAllEdits(ctx: QueryCtx): Promise<{ rows: EditRow[]; complete: boolean }> {
  const rows: EditRow[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < MAX_EDIT_PAGES; page += 1) {
    const result = await ctx.db
      .query('contentEditLogs')
      .order('desc')
      .paginate({ numItems: EDIT_PAGE, cursor });
    rows.push(...(result.page as unknown as EditRow[]));
    if (result.isDone) return { rows, complete: true };
    cursor = result.continueCursor;
  }
  return { rows, complete: false };
}

/**
 * Whether a genuine, active reviewer assignment exists for this slug at this
 * revision. No assignment table is deployed on this branch, so this is always
 * false — which is the correct answer, and far better than treating a review
 * *request* as staffing. When the assignments table lands (PR #21–#25), this is
 * the single place to implement it.
 */
function hasActiveAssignmentFor(slug: string, reviewRevision: number): boolean {
  void slug;
  void reviewRevision;
  return false;
}

/**
 * A minimal, valid queue row for a record whose full classification threw. It
 * keeps the review workspace alive when a single record's data is malformed:
 * the record still appears — flagged P0 for manual triage with the failure in
 * its warnings — instead of the entire query throwing a server error and
 * crashing `/admin/reviews` for every staff user.
 */
function fallbackQueueRow(item: Doc<'libraryContent'>, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    slug: item.slug,
    titleMm: item.titleMm ?? item.slug,
    titleEn: item.titleEn ?? item.slug,
    type: item.type ?? 'unknown',
    category: item.category ?? null,
    ageGroupKey: item.ageGroupKey ?? null,
    domainKey: item.domainKey ?? null,
    clinicalStatus: item.clinicalStatus ?? 'draft',
    reviewScope: item.reviewScope ?? null,
    reviewRevision: item.reviewRevision ?? 1,
    parentVisibleNow: item.clinicalStatus === 'published',
    priority: 'P0' as const,
    priorityReasons: ['could not classify this record — see warnings'],
    riskClass: 'C' as const,
    riskReasons: [],
    provisionalClassification: true,
    requiredReviewDimensions: [] as string[],
    suggestedReviewDimensions: [] as string[],
    manualTriageRequired: true,
    outstandingDimensions: [] as string[],
    approvedDimensions: [] as string[],
    activeReviewers: [] as string[],
    hasActiveAssignment: false,
    evidenceStatus: 'missing',
    priorityStatus: 'manual_triage_required' as const,
    temporarilyHideRecommended: false,
    ownerNote: null,
    latestEditAt: null,
    latestDecisionAt: null,
    warnings: [`classification failed and was skipped: ${message}`],
  };
}

export const queues = query({
  args: {},
  returns: v.object({
    allowed: v.boolean(),
    accessLevel: v.string(),
    /** False when review/edit history could not be read in full. */
    dataComplete: v.boolean(),
    /** Authoritative counts are withheld when data is incomplete. */
    countsAuthoritative: v.boolean(),
    rows: v.array(queueRowValidator),
    counts: countsValidator,
  }),
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const access = await getStaffAccess(ctx, userId);
    const level = queueAccessLevel(access?.role);
    const empty = {
      allowed: false,
      accessLevel: level,
      dataComplete: true,
      countsAuthoritative: false,
      rows: [],
      counts: dashboardCounts([]),
    };
    if (level === 'none') return empty;

    const content = await ctx.db.query('libraryContent').collect();
    const reviewsResult = await loadAllReviews(ctx);
    const editsResult = await loadAllEdits(ctx);
    const dataComplete = reviewsResult.complete && editsResult.complete;
    const links = await ctx.db.query('evidenceLinks').collect();
    const linkedSlugs = new Set(links.map((link) => link.slug));
    const seesActivity = maySeeReviewerActivity(access?.role);

    const latestEditBySlug = new Map<string, number>();
    for (const edit of editsResult.rows) {
      const prior = latestEditBySlug.get(edit.contentSlug);
      if (prior === undefined || edit.editedAt > prior) latestEditBySlug.set(edit.contentSlug, edit.editedAt);
    }
    const decisionsBySlug = new Map<string, ReviewRow[]>();
    for (const row of reviewsResult.rows) {
      const bucket = decisionsBySlug.get(row.contentSlug);
      if (bucket) bucket.push(row);
      else decisionsBySlug.set(row.contentSlug, [row]);
    }

    const rows = content.map((item) => {
      try {
      const revision = item.reviewRevision ?? 1;
      const slugDecisions = decisionsBySlug.get(item.slug) ?? [];
      const currentByDimension = new Map<string, ReviewRow>();
      let latestDecisionAt: number | null = null;
      let workflowBlocker: string | null = null;
      const duplicateKeys = new Set<string>();
      for (const decision of slugDecisions) {
        if (latestDecisionAt === null || decision.reviewedAt > latestDecisionAt) latestDecisionAt = decision.reviewedAt;
        const identityKey = [decision.dimension, decision.decision, String(decision.reviewerId), decision.contentVersion, decision.note ?? ''].join('|');
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
        // Coerce stored governance strings to known enum members. A legacy value
        // from an earlier schema would otherwise flow into the return-validated
        // riskClass/priority fields and make this whole query throw, crashing
        // the review workspace for every staff user.
        riskClassification: coerceRiskClass(item.riskClassification),
        ownerPriority: coerceOwnerPriority(item.ownerPriority),
        riskReasons: item.riskReasons ?? null,
        priorityStatus: item.priorityStatus ?? null,
        workflowBlocker,
      });

      // Confirmed requirements are ONLY what a human stored, or what policy
      // allows for A/B/C. Untriaged D/E carry none, so nothing about them can
      // read as "scoped and on track".
      const confirmed = item.requiredReviewDimensions?.length
        ? item.requiredReviewDimensions
        : requiredDimensionsFor(result.riskClass);
      const suggested = item.requiredReviewDimensions?.length
        ? item.requiredReviewDimensions
        : suggestedDimensionsFor(result.riskClass);
      const triageRequired = needsManualTriage(result.riskClass) && confirmed.length === 0;
      const approvedDimensions = [...currentByDimension.entries()]
        .filter(([, decision]) => decision.decision === 'approved')
        .map(([dimension]) => dimension);
      const approvedSet = new Set(approvedDimensions);
      const outstanding = confirmed.filter((dimension) => !approvedSet.has(dimension));

      const storedStatus = coercePriorityStatus(item.priorityStatus, triageRequired ? 'manual_triage_required' : 'unreviewed');
      const hasActiveAssignment = hasActiveAssignmentFor(item.slug, revision);
      // Never display 'assigned' without a real assignment record behind it.
      const priorityStatus: PriorityStatus =
        storedStatus === 'assigned' && !hasActiveAssignment ? 'review_requested' : storedStatus;

      const warnings: string[] = [];
      if (workflowBlocker) warnings.push(workflowBlocker);
      if (item.clinicalStatus === 'published' && result.riskClass === 'C') {
        warnings.push('parent-visible now with no clinical approval (education-scoped legacy publication)');
      }
      if (item.reviewScope === 'education') warnings.push('education-scoped review must never be read as clinical approval');
      if (!linkedSlugs.has(item.slug)) warnings.push('no evidence link recorded on this deployment');
      if (result.provisional) warnings.push('classification is provisional (in-app rules) — not yet owner-confirmed');
      if (triageRequired) warnings.push('manual triage required: a manager must confirm the required review dimensions');
      if (!dataComplete) warnings.push('review history could not be loaded in full — outstanding counts are not authoritative');

      return {
        slug: item.slug,
        titleMm: item.titleMm ?? item.slug,
        titleEn: item.titleEn ?? item.slug,
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
        requiredReviewDimensions: confirmed,
        suggestedReviewDimensions: suggested,
        manualTriageRequired: triageRequired,
        outstandingDimensions: outstanding,
        approvedDimensions,
        // Reviewer identities and decision timing are management data; scoped
        // callers get the work item without the roster.
        activeReviewers: seesActivity
          ? [...new Set(slugDecisions
              .filter((decision) => (decision.reviewRevision ?? decision.contentVersion) === revision)
              .map((decision) => decision.reviewerDisplayName))]
          : [],
        hasActiveAssignment,
        evidenceStatus: linkedSlugs.has(item.slug) ? 'linked' : 'missing',
        priorityStatus,
        temporarilyHideRecommended: item.temporarilyHideRecommended ?? false,
        ownerNote: seesActivity ? (item.ownerNote ?? null) : null,
        latestEditAt: seesActivity ? (latestEditBySlug.get(item.slug) ?? null) : null,
        latestDecisionAt: seesActivity ? latestDecisionAt : null,
        warnings,
      };
      } catch (error) {
        return fallbackQueueRow(item, error);
      }
    });

    // Scope the catalogue itself, not just the fields: an assignment-scoped
    // reviewer must not learn what else exists.
    const visibleRows = level === 'assignment_scoped'
      ? rows.filter((row) => rowInReviewerScope(access?.role, row))
      : rows;
    visibleRows.sort(compareQueueRows);

    return {
      allowed: true,
      accessLevel: level,
      dataComplete,
      // Counts are only authoritative from complete data AND a full view of
      // the catalogue. A scoped caller sees a subset by design.
      countsAuthoritative: dataComplete && level === 'full',
      rows: visibleRows,
      counts: dashboardCounts(visibleRows.map((row) => ({
        priority: row.priority,
        riskClass: row.riskClass,
        clinicalStatus: row.clinicalStatus,
        priorityStatus: row.priorityStatus,
        outstandingDimensions: row.outstandingDimensions,
        hasActiveAssignment: row.hasActiveAssignment,
      }))),
    };
  },
});

/**
 * Read-only data-health probe for the review queue. INTERNAL — CLI/admin only
 * (`npx convex run ownerPriority:queueDataHealth`). Lists libraryContent rows
 * whose stored governance fields fall outside the current enums — exactly the
 * values that made the `queues` query throw (and crash the review workspace)
 * before the coercion above. A clean report means the queue is healthy.
 */
export const queueDataHealth = internalQuery({
  args: {},
  handler: async (ctx) => {
    const content = await ctx.db.query('libraryContent').collect();
    const badPriorityStatus: Array<{ slug: string; value: string }> = [];
    const badRiskClassification: Array<{ slug: string; value: string }> = [];
    const badOwnerPriority: Array<{ slug: string; value: string }> = [];
    // Records whose classification throws — the actual cause of a `queues`
    // server error. Runs the same computePriority the query runs, per record.
    const classifyFailures: Array<{ slug: string; error: string }> = [];
    const nonStringTitles: Array<{ slug: string; field: string }> = [];
    const distinctPriorityStatus = new Set<string>();
    const distinctClinicalStatus = new Set<string>();
    for (const item of content) {
      const ps = item.priorityStatus ?? null;
      if (ps !== null) {
        distinctPriorityStatus.add(ps);
        if (!(PRIORITY_STATUSES as string[]).includes(ps)) badPriorityStatus.push({ slug: item.slug, value: ps });
      }
      const rc = item.riskClassification ?? null;
      if (rc !== null && !(RISK_CLASSES as string[]).includes(rc)) badRiskClassification.push({ slug: item.slug, value: rc });
      const op = item.ownerPriority ?? null;
      if (op !== null && !(OWNER_PRIORITIES as string[]).includes(op)) badOwnerPriority.push({ slug: item.slug, value: op });
      distinctClinicalStatus.add(item.clinicalStatus);
      if (typeof item.titleMm !== 'string') nonStringTitles.push({ slug: item.slug, field: 'titleMm' });
      if (typeof item.titleEn !== 'string') nonStringTitles.push({ slug: item.slug, field: 'titleEn' });
      try {
        computePriority({
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
          riskClassification: coerceRiskClass(item.riskClassification),
          ownerPriority: coerceOwnerPriority(item.ownerPriority),
          riskReasons: item.riskReasons ?? null,
          priorityStatus: item.priorityStatus ?? null,
        });
      } catch (error) {
        classifyFailures.push({ slug: item.slug, error: error instanceof Error ? error.message : String(error) });
      }
    }
    return {
      total: content.length,
      classifyFailures,
      nonStringTitles,
      distinctPriorityStatus: [...distinctPriorityStatus],
      distinctClinicalStatus: [...distinctClinicalStatus],
      badPriorityStatus,
      badRiskClassification,
      badOwnerPriority,
    };
  },
});

/**
 * Owner/review-manager governance labels. Deliberately CANNOT touch
 * clinicalStatus, reviewScope, publicationStatus, reviewer identity or any
 * review decision — those fields are not accepted as arguments, so no caller
 * can smuggle them in.
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
    /** Explicit manager decision on what this record actually requires. */
    confirmRequiredDimensions: v.optional(v.array(v.string())),
    temporarilyHideRecommended: v.optional(v.boolean()),
    ownerNote: v.optional(v.string()),
  },
  returns: v.union(
    v.object({ ok: v.literal(true) }),
    v.object({
      ok: v.literal(false),
      code: v.string(),
      message: v.string(),
      messageMm: v.optional(v.string()),
      outstanding: v.optional(v.array(v.string())),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const access: StaffAccess | null = await getStaffAccess(ctx, userId);
    if (!mayManageGovernance(access?.role)) {
      await logAudit(ctx, userId, 'ownerPriority.setGovernance', 'libraryContent', undefined, `${args.slug} · refused: not_authorized`, { result: 'rejected' });
      return {
        ok: false as const,
        code: 'not_authorized',
        message: 'Only an owner or review manager can change priority governance.',
        messageMm: 'ဦးစားပေး စီမံခန့်ခွဲမှုကို ပိုင်ရှင် သို့မဟုတ် စစ်ဆေးရေးမန်နေဂျာသာ ပြောင်းလဲနိုင်သည်။',
      };
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

    if (args.confirmRequiredDimensions !== undefined) {
      const invalid = args.confirmRequiredDimensions.filter((dimension) => !(REVIEW_DIMENSION_IDS as readonly string[]).includes(dimension));
      if (invalid.length > 0) {
        return { ok: false as const, code: 'unknown_dimension', message: `Unknown review dimension: ${invalid.join(', ')}` };
      }
      // A manager confirming requirements is the ONLY way a dimension set
      // becomes authoritative. Nothing is ever recorded as not_required — a
      // dimension simply is or is not in the confirmed list.
      patch.requiredReviewDimensions = [...new Set(args.confirmRequiredDimensions)];
      summary.push(`requiredDimensions=${args.confirmRequiredDimensions.join('+') || '(none)'}`);
    }

    if (args.priorityStatus !== undefined) {
      if (args.priorityStatus === 'completed') {
        // Server-side completion guard. A disabled button is not enforcement:
        // this check runs for direct calls too.
        const reviewsResult = await loadAllReviews(ctx);
        const revision = item.reviewRevision ?? 1;
        const approvedDimensions = [...new Set(
          reviewsResult.rows
            .filter((row) => row.contentSlug === args.slug
              && (row.reviewRevision ?? row.contentVersion) === revision
              && row.decision === 'approved')
            .map((row) => row.dimension),
        )];
        const riskClass = (item.riskClassification ?? null) as RiskClass | null;
        const confirmed = (patch.requiredReviewDimensions as string[] | undefined)
          ?? item.requiredReviewDimensions
          ?? (riskClass ? requiredDimensionsFor(riskClass) : []);
        const refusal = completionRefusal({
          confirmedRequiredDimensions: confirmed,
          approvedDimensionsAtCurrentRevision: approvedDimensions,
          needsManualTriage: riskClass ? needsManualTriage(riskClass) : false,
          dataComplete: reviewsResult.complete,
        });
        if (refusal) {
          await logAudit(ctx, userId, 'ownerPriority.setGovernance', 'libraryContent', item._id, `${args.slug} · refused: ${refusal.code} (${refusal.outstanding.join(', ')})`, { result: 'rejected' });
          return {
            ok: false as const,
            code: refusal.code,
            message: refusal.message.en,
            messageMm: refusal.message.mm,
            outstanding: refusal.outstanding,
          };
        }
      }
      if (args.priorityStatus === 'assigned') {
        // 'assigned' must describe a real assignment record. Nothing may set it
        // by hand while no assignment table is deployed.
        return {
          ok: false as const,
          code: 'assignment_not_supported',
          message: 'Assigned status requires an actual reviewer assignment, which this deployment does not yet support. Use “request review” instead.',
          messageMm: 'တာဝန်ပေးထားသည် ဟူသောအခြေအနေအတွက် အမှန်တကယ် တာဝန်ပေးမှတ်တမ်း လိုအပ်သည်။ ယခုအစား “စစ်ဆေးမှု တောင်းဆိုရန်” ကို သုံးပါ။',
        };
      }
      patch.priorityStatus = args.priorityStatus;
      summary.push(`status=${args.priorityStatus}`);
    }

    if (args.ownerPriority !== undefined) { patch.ownerPriority = args.ownerPriority; summary.push(`priority=${args.ownerPriority}`); }
    if (args.temporarilyHideRecommended !== undefined) {
      patch.temporarilyHideRecommended = args.temporarilyHideRecommended;
      summary.push(`hideRecommended=${args.temporarilyHideRecommended}`);
    }
    if (args.ownerNote !== undefined) { patch.ownerNote = args.ownerNote.trim() || undefined; summary.push('ownerNote'); }
    if (args.confirmClassification !== undefined) {
      const riskClass = args.confirmClassification.riskClassification;
      patch.riskClassification = riskClass;
      patch.riskReasons = args.confirmClassification.riskReasons;
      patch.classificationConfirmedAt = Date.now();
      patch.classificationConfirmedBy = userId;
      if (needsManualTriage(riskClass)) {
        // D/E: confirming the CLASS does not confirm the requirements. The
        // record goes to manual triage and carries no required dimensions
        // until a manager states them explicitly.
        if (!item.requiredReviewDimensions?.length && patch.requiredReviewDimensions === undefined) {
          patch.priorityStatus = 'manual_triage_required';
        }
      } else if (!item.requiredReviewDimensions?.length && patch.requiredReviewDimensions === undefined) {
        patch.requiredReviewDimensions = requiredDimensionsFor(riskClass);
      }
      if (patch.priorityStatus === undefined && (!item.priorityStatus || item.priorityStatus === 'unreviewed')) {
        patch.priorityStatus = 'confirmed';
      }
      summary.push(`class=${riskClass} confirmed`);
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
 * Record which review dimensions are being ASKED FOR. This creates no reviewer
 * assignment, invitation or decision, and it never sets 'assigned' — the status
 * is `review_requested`, so a dashboard can never imply staffing that does not
 * exist. It also does not turn a suggestion into a confirmed requirement for
 * D/E; use setGovernance.confirmRequiredDimensions for that.
 */
export const requestReviews = mutation({
  args: {
    slug: v.string(),
    expectedReviewRevision: v.number(),
    dimensions: v.array(v.string()),
  },
  returns: v.union(
    v.object({ ok: v.literal(true), requestedReviewDimensions: v.array(v.string()) }),
    v.object({ ok: v.literal(false), code: v.string(), message: v.string(), messageMm: v.optional(v.string()) }),
  ),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const access = await getStaffAccess(ctx, userId);
    if (!mayRequestReviews(access?.role)) {
      return {
        ok: false as const,
        code: 'not_authorized',
        message: 'Only an owner, review manager or content editor can request reviews.',
        messageMm: 'စစ်ဆေးမှု တောင်းဆိုခြင်းကို ပိုင်ရှင်၊ စစ်ဆေးရေးမန်နေဂျာ သို့မဟုတ် အကြောင်းအရာ တည်းဖြတ်သူသာ လုပ်နိုင်သည်။',
      };
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
    const merged = [...new Set([...(item.requestedReviewDimensions ?? []), ...args.dimensions])];
    const advanceable: PriorityStatus[] = ['unreviewed', 'confirmed', 'manual_triage_required'];
    await ctx.db.patch(item._id, {
      requestedReviewDimensions: merged,
      ...(item.priorityStatus === undefined || advanceable.includes(item.priorityStatus as PriorityStatus)
        ? { priorityStatus: 'review_requested' as const }
        : {}),
      updatedAt: Date.now(),
    });
    await logAudit(ctx, userId, 'ownerPriority.requestReviews', 'libraryContent', item._id, `${args.slug} · requested: ${args.dimensions.join(', ')}`, { result: 'ok' });
    return { ok: true as const, requestedReviewDimensions: merged };
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
    if (!mayManageGovernance(access?.role)) {
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
    if (!mayManageGovernance(access?.role)) return { allowed: false, rows: [] };
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

/** Exported for direct-handler authorization tests. */
export const __policy = { PRIORITY_STATUSES, queueAccessLevel };
