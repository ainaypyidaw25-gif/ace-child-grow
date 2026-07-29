import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import {
  getExplicitStaffAccess,
  getStaffAccess,
  requireExplicitStaffRole,
  requireUser,
  type StaffRole,
} from './lib/auth';
import { logAudit } from './audit';

const MAX_COMPLETION_ASSIGNMENTS = 2_000;
const MAX_PAYMENT_BATCHES = 100;
const MAX_ASSIGNMENTS_PER_PAYMENT_BATCH = 100;
const PAYMENT_WORKFLOW_ROLES: readonly StaffRole[] = ['owner', 'system_admin', 'review_manager'];

const paymentStatusValidator = v.union(
  v.literal('not_calculated'),
  v.literal('ready_for_review'),
  v.literal('approved_for_payment'),
  v.literal('paid'),
  v.literal('disputed'),
);

const rateBasisValidator = v.union(v.literal('per_item'), v.literal('package'));

type PaymentStatus =
  | 'not_calculated'
  | 'ready_for_review'
  | 'approved_for_payment'
  | 'paid'
  | 'disputed';

const PAYMENT_TRANSITIONS: Record<PaymentStatus, readonly PaymentStatus[]> = {
  not_calculated: [],
  ready_for_review: ['approved_for_payment', 'disputed'],
  approved_for_payment: ['paid', 'disputed'],
  disputed: ['ready_for_review'],
  paid: [],
};

const completionRowValidator = v.object({
  reviewerId: v.id('users'),
  reviewerName: v.string(),
  reviewerType: v.string(),
  assigned: v.number(),
  completed: v.number(),
  changesRequested: v.number(),
  blocked: v.number(),
  overdue: v.number(),
  completionPercent: v.number(),
  lastActivity: v.union(v.number(), v.null()),
});

const paymentWorkspaceBatchValidator = v.object({
  _id: v.id('reviewPaymentBatches'),
  _creationTime: v.number(),
  batchKey: v.string(),
  reviewerId: v.id('users'),
  reviewerName: v.string(),
  assignmentIds: v.array(v.id('reviewAssignments')),
  agreedRateMmk: v.number(),
  rateBasis: rateBasisValidator,
  manualAdjustmentMmk: v.number(),
  manualAdjustmentReason: v.union(v.string(), v.null()),
  proposedPayableMmk: v.number(),
  assignedItemCount: v.number(),
  firstReviewsCompleted: v.number(),
  revisionReviewsCompleted: v.number(),
  finalApprovalsCompleted: v.number(),
  blockedItems: v.number(),
  rejectedItems: v.number(),
  overdueItems: v.number(),
  totalCompletedItems: v.number(),
  status: paymentStatusValidator,
  note: v.union(v.string(), v.null()),
  paymentReference: v.union(v.string(), v.null()),
  createdBy: v.id('users'),
  calculatedAt: v.union(v.number(), v.null()),
  approvedBy: v.union(v.id('users'), v.null()),
  approvedAt: v.union(v.number(), v.null()),
  paidBy: v.union(v.id('users'), v.null()),
  paidAt: v.union(v.number(), v.null()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

function boundedLimit(value: number | undefined, fallback: number, maximum: number): number {
  return Math.max(1, Math.min(maximum, Math.floor(value ?? fallback)));
}

function requireSafeInteger(value: number, label: string, allowNegative = false): void {
  if (!Number.isSafeInteger(value) || (!allowNegative && value < 0)) {
    throw new Error(`${label} must be a ${allowNegative ? '' : 'non-negative '}whole MMK amount`);
  }
}

function optionalTrimmed(value: string | undefined, maximum: number): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > maximum) throw new Error(`Text must be ${maximum} characters or fewer`);
  return trimmed;
}

export const completion = query({
  args: { asOf: v.number() },
  returns: v.object({
    rows: v.array(completionRowValidator),
    hasMore: v.boolean(),
    assignmentLimit: v.number(),
  }),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const access = await getStaffAccess(ctx, userId);
    if (!access?.roles.some((role) => ['owner', 'system_admin', 'review_manager', 'auditor'].includes(role))) {
      throw new Error('Review report access denied');
    }

    // This remains a management overview rather than a billing source of truth.
    // The hard limit prevents an unbounded reactive query; larger installations
    // should move these counters to an aggregate/projection table.
    const boundedAssignments = await ctx.db
      .query('reviewAssignments')
      .order('desc')
      .take(MAX_COMPLETION_ASSIGNMENTS + 1);
    const hasMore = boundedAssignments.length > MAX_COMPLETION_ASSIGNMENTS;
    const assignments = boundedAssignments.slice(0, MAX_COMPLETION_ASSIGNMENTS);
    const grouped = new Map<string, typeof assignments>();
    for (const row of assignments) grouped.set(row.reviewerId, [...(grouped.get(row.reviewerId) ?? []), row]);
    const now = args.asOf;
    if (!Number.isSafeInteger(now) || now < 0) throw new Error('Valid report time is required');
    const result = [];
    for (const [reviewerId, rows] of grouped) {
      const reviewerAccess = await getStaffAccess(ctx, reviewerId as typeof rows[number]['reviewerId']);
      const active = rows.filter((row) => row.status !== 'cancelled');
      const completed = active.filter((row) => row.status === 'approved').length;
      result.push({
        reviewerId: reviewerId as typeof rows[number]['reviewerId'],
        reviewerName: reviewerAccess?.displayName || 'Reviewer',
        reviewerType: [...new Set(active.map((row) => row.reviewerType))].join(', '),
        assigned: active.length,
        completed,
        changesRequested: active.filter((row) => row.status === 'changes_requested').length,
        blocked: active.filter((row) => row.status === 'blocked').length,
        overdue: active.filter((row) => row.dueAt !== undefined && row.dueAt < now && row.status !== 'approved').length,
        completionPercent: active.length === 0 ? 0 : Math.round((completed / active.length) * 100),
        lastActivity: active.length ? Math.max(...active.map((row) => row.updatedAt)) : null,
      });
    }
    return {
      rows: result.sort((a, b) => a.reviewerName.localeCompare(b.reviewerName)),
      hasMore,
      assignmentLimit: MAX_COMPLETION_ASSIGNMENTS,
    };
  },
});

/**
 * Monetary workspace for payment preparation. Auditors intentionally retain
 * access to the non-monetary completion report above, but not rates, payment
 * references, adjustments, or payable amounts.
 */
export const paymentWorkspace = query({
  args: { status: v.optional(paymentStatusValidator), limit: v.optional(v.number()) },
  returns: v.object({
    batches: v.array(paymentWorkspaceBatchValidator),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await requireExplicitStaffRole(ctx, PAYMENT_WORKFLOW_ROLES);
    const limit = boundedLimit(args.limit, 50, MAX_PAYMENT_BATCHES);
    const rows = args.status
      ? await ctx.db
          .query('reviewPaymentBatches')
          .withIndex('by_status', (q) => q.eq('status', args.status!))
          .order('desc')
          .take(limit + 1)
      : await ctx.db.query('reviewPaymentBatches').order('desc').take(limit + 1);
    const page = rows.slice(0, limit);
    const reviewerNames = new Map<string, string>();
    const batches = [];
    for (const batch of page) {
      let reviewerName = reviewerNames.get(batch.reviewerId);
      if (!reviewerName) {
        reviewerName = (await getStaffAccess(ctx, batch.reviewerId))?.displayName || 'Reviewer';
        reviewerNames.set(batch.reviewerId, reviewerName);
      }
      batches.push({
        _id: batch._id,
        _creationTime: batch._creationTime,
        batchKey: batch.batchKey,
        reviewerId: batch.reviewerId,
        reviewerName,
        assignmentIds: batch.assignmentIds,
        agreedRateMmk: batch.agreedRateMmk,
        rateBasis: batch.rateBasis ?? 'per_item' as const,
        manualAdjustmentMmk: batch.manualAdjustmentMmk,
        manualAdjustmentReason: batch.manualAdjustmentReason ?? null,
        proposedPayableMmk: batch.proposedPayableMmk,
        assignedItemCount: batch.assignedItemCount ?? batch.assignmentIds.length,
        firstReviewsCompleted: batch.firstReviewsCompleted ?? 0,
        revisionReviewsCompleted: batch.revisionReviewsCompleted ?? 0,
        finalApprovalsCompleted: batch.finalApprovalsCompleted ?? batch.assignmentIds.length,
        blockedItems: batch.blockedItems ?? 0,
        rejectedItems: batch.rejectedItems ?? 0,
        overdueItems: batch.overdueItems ?? 0,
        totalCompletedItems: batch.totalCompletedItems ?? batch.assignmentIds.length,
        status: batch.status,
        note: batch.note ?? null,
        paymentReference: batch.paymentReference ?? null,
        createdBy: batch.createdBy,
        calculatedAt: batch.calculatedAt ?? null,
        approvedBy: batch.approvedBy ?? null,
        approvedAt: batch.approvedAt ?? null,
        paidBy: batch.paidBy ?? null,
        paidAt: batch.paidAt ?? null,
        createdAt: batch.createdAt,
        updatedAt: batch.updatedAt,
      });
    }
    return { batches, hasMore: rows.length > limit };
  },
});

const exportKindValidator = v.union(
  v.literal('completion_csv'),
  v.literal('completion_print'),
  v.literal('payment_csv'),
  v.literal('payment_print'),
);

/**
 * Record that an authorised user generated a client-side CSV/print report.
 * The export itself is not stored, and filters are logged without report rows
 * or monetary values.
 */
export const recordExport = mutation({
  args: { kind: exportKindValidator, filterSummary: v.optional(v.string()) },
  returns: v.object({ ok: v.literal(true) }),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const access = await getStaffAccess(ctx, userId);
    const completionAccess = access?.roles.some((role) => (
      role === 'owner' || role === 'system_admin' || role === 'review_manager' || role === 'auditor'
    ));
    if (!completionAccess) throw new Error('Review report export access denied');
    const paymentExport = args.kind === 'payment_csv' || args.kind === 'payment_print';
    if (paymentExport) {
      const explicitAccess = await getExplicitStaffAccess(ctx, userId);
      if (!explicitAccess?.roles.some((role) => PAYMENT_WORKFLOW_ROLES.includes(role))) {
        throw new Error('Payment report export access denied');
      }
    }
    const filterSummary = optionalTrimmed(args.filterSummary, 500);
    await logAudit(
      ctx,
      userId,
      'review.report.export',
      'reviewReports',
      args.kind,
      filterSummary ? `${args.kind}: ${filterSummary}` : args.kind,
      { after: JSON.stringify({ kind: args.kind }) },
    );
    return { ok: true as const };
  },
});

export const createPaymentBatch = mutation({
  args: {
    batchKey: v.string(),
    reviewerId: v.id('users'),
    assignmentIds: v.array(v.id('reviewAssignments')),
    agreedRateMmk: v.number(),
    rateBasis: rateBasisValidator,
    manualAdjustmentMmk: v.number(),
    manualAdjustmentReason: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  returns: v.object({
    ok: v.literal(true),
    batchId: v.id('reviewPaymentBatches'),
    proposedPayableMmk: v.number(),
  }),
  handler: async (ctx, args) => {
    const { userId } = await requireExplicitStaffRole(ctx, PAYMENT_WORKFLOW_ROLES);
    const batchKey = args.batchKey.trim();
    if (!batchKey || batchKey.length > 120) throw new Error('Valid batch key is required');
    if (args.assignmentIds.length < 1 || args.assignmentIds.length > MAX_ASSIGNMENTS_PER_PAYMENT_BATCH) {
      throw new Error(`A payment batch must contain between 1 and ${MAX_ASSIGNMENTS_PER_PAYMENT_BATCH} assignments`);
    }
    const uniqueAssignmentIds = [...new Set(args.assignmentIds)];
    if (uniqueAssignmentIds.length !== args.assignmentIds.length) {
      throw new Error('Payment batch assignment IDs must be unique');
    }
    requireSafeInteger(args.agreedRateMmk, 'Agreed rate');
    requireSafeInteger(args.manualAdjustmentMmk, 'Manual adjustment', true);
    const manualAdjustmentReason = optionalTrimmed(args.manualAdjustmentReason, 500);
    if (args.manualAdjustmentMmk !== 0 && !manualAdjustmentReason) {
      throw new Error('A reason is required for a non-zero manual adjustment');
    }
    const note = optionalTrimmed(args.note, 2_000);

    const existing = await ctx.db
      .query('reviewPaymentBatches')
      .withIndex('by_batch_key', (q) => q.eq('batchKey', batchKey))
      .unique();
    if (existing) throw new Error('Payment batch key already exists');

    const assignments = [];
    for (const assignmentId of uniqueAssignmentIds) {
      const assignment = await ctx.db.get(assignmentId);
      if (!assignment || assignment.reviewerId !== args.reviewerId || assignment.status !== 'approved') {
        throw new Error('Only approved assignments for the selected reviewer may enter a payment batch');
      }
      if (assignment.paymentBatchId) throw new Error('An assignment is already in a payment batch');
      assignments.push(assignment);
    }

    const basePayableMmk = args.rateBasis === 'per_item'
      ? assignments.length * args.agreedRateMmk
      : args.agreedRateMmk;
    const proposedPayableMmk = basePayableMmk + args.manualAdjustmentMmk;
    if (!Number.isSafeInteger(basePayableMmk) || !Number.isSafeInteger(proposedPayableMmk) || proposedPayableMmk < 0) {
      throw new Error('Proposed payable amount must be a non-negative whole MMK amount');
    }

    const now = Date.now();
    const firstReviewsCompleted = assignments.filter((row) => row.reviewRound <= 1).length;
    const revisionReviewsCompleted = assignments.filter((row) => row.reviewRound > 1).length;
    const overdueItems = assignments.filter((row) => (
      row.dueAt !== undefined && (row.completionDate ?? now) > row.dueAt
    )).length;
    const batchId = await ctx.db.insert('reviewPaymentBatches', {
      batchKey,
      reviewerId: args.reviewerId,
      assignmentIds: assignments.map((row) => row._id),
      agreedRateMmk: args.agreedRateMmk,
      rateBasis: args.rateBasis,
      manualAdjustmentMmk: args.manualAdjustmentMmk,
      manualAdjustmentReason,
      proposedPayableMmk,
      assignedItemCount: assignments.length,
      firstReviewsCompleted,
      revisionReviewsCompleted,
      finalApprovalsCompleted: assignments.length,
      blockedItems: 0,
      rejectedItems: 0,
      overdueItems,
      totalCompletedItems: assignments.length,
      status: 'ready_for_review',
      note,
      createdBy: userId,
      calculatedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    for (const assignment of assignments) {
      await ctx.db.patch(assignment._id, { paymentBatchId: batchKey, updatedAt: now });
    }
    await logAudit(
      ctx,
      userId,
      'review.paymentBatch.create',
      'reviewPaymentBatches',
      batchId,
      `${batchKey}: ${assignments.length} completed items`,
      { after: JSON.stringify({ status: 'ready_for_review', rateBasis: args.rateBasis, itemCount: assignments.length }) },
    );
    return { ok: true as const, batchId, proposedPayableMmk };
  },
});

export const setPaymentStatus = mutation({
  args: {
    batchId: v.id('reviewPaymentBatches'),
    status: paymentStatusValidator,
    note: v.string(),
    paymentReference: v.optional(v.string()),
  },
  returns: v.object({ ok: v.literal(true) }),
  handler: async (ctx, args) => {
    const { userId, access } = await requireExplicitStaffRole(ctx, PAYMENT_WORKFLOW_ROLES);
    const batch = await ctx.db.get(args.batchId);
    if (!batch) throw new Error('Payment batch not found');
    const note = optionalTrimmed(args.note, 2_000);
    if (!note) throw new Error('Payment status note is required');
    if (!PAYMENT_TRANSITIONS[batch.status].includes(args.status)) {
      throw new Error(`Payment status cannot move from ${batch.status} to ${args.status}`);
    }

    const isPaymentAuthority = access.roles.some((role) => role === 'owner' || role === 'system_admin');
    if ((args.status === 'approved_for_payment' || args.status === 'paid') && !isPaymentAuthority) {
      throw new Error('Owner or system administrator approval is required for this payment status');
    }

    const paymentReference = optionalTrimmed(args.paymentReference, 200);
    if (args.status === 'paid' && !paymentReference) {
      throw new Error('Payment reference is required when marking a batch paid');
    }
    if (args.status !== 'paid' && paymentReference) {
      throw new Error('Payment reference may only be recorded for a paid batch');
    }

    const now = Date.now();
    const patch = {
      status: args.status,
      note,
      updatedAt: now,
      ...(args.status === 'approved_for_payment' ? { approvedBy: userId, approvedAt: now } : {}),
      ...(args.status === 'disputed' ? { approvedBy: undefined, approvedAt: undefined } : {}),
      ...(args.status === 'paid' ? {
        paidBy: userId,
        paidAt: now,
        paymentReference,
      } : {}),
    };
    await ctx.db.patch(batch._id, patch);

    const action = args.status === 'approved_for_payment'
      ? 'review.paymentBatch.approved'
      : args.status === 'paid'
        ? 'review.paymentBatch.paid'
        : args.status === 'disputed'
          ? 'review.paymentBatch.disputed'
          : 'review.paymentBatch.reopened';
    await logAudit(
      ctx,
      userId,
      action,
      'reviewPaymentBatches',
      batch._id,
      `${batch.status} → ${args.status}: ${note}`,
      {
        before: JSON.stringify({ status: batch.status }),
        after: JSON.stringify({ status: args.status, paymentReferenceRecorded: args.status === 'paid' }),
      },
    );
    return { ok: true as const };
  },
});
