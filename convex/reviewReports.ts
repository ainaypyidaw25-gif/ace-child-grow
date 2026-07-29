import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getStaffAccess, requireReviewManager, requireUser } from './lib/auth';
import { logAudit } from './audit';

const paymentStatusValidator = v.union(
  v.literal('not_calculated'), v.literal('ready_for_review'), v.literal('approved_for_payment'),
  v.literal('paid'), v.literal('disputed'),
);

export const completion = query({
  args: {},
  returns: v.array(v.object({
    reviewerId: v.id('users'), reviewerName: v.string(), reviewerType: v.string(), assigned: v.number(),
    completed: v.number(), changesRequested: v.number(), blocked: v.number(), overdue: v.number(),
    completionPercent: v.number(), lastActivity: v.union(v.number(), v.null()),
  })),
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const access = await getStaffAccess(ctx, userId);
    if (!access?.roles.some((role) => ['owner', 'system_admin', 'review_manager', 'auditor'].includes(role))) {
      throw new Error('Review report access denied');
    }
    const assignments = await ctx.db.query('reviewAssignments').collect();
    const grouped = new Map<string, typeof assignments>();
    for (const row of assignments) grouped.set(row.reviewerId, [...(grouped.get(row.reviewerId) ?? []), row]);
    const now = Date.now();
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
    return result.sort((a, b) => a.reviewerName.localeCompare(b.reviewerName));
  },
});

export const createPaymentBatch = mutation({
  args: {
    batchKey: v.string(), reviewerId: v.id('users'), assignmentIds: v.array(v.id('reviewAssignments')),
    agreedRateMmk: v.number(), manualAdjustmentMmk: v.number(), note: v.optional(v.string()),
  },
  returns: v.object({ ok: v.literal(true), batchId: v.id('reviewPaymentBatches'), proposedPayableMmk: v.number() }),
  handler: async (ctx, args) => {
    const { userId } = await requireReviewManager(ctx);
    const batchKey = args.batchKey.trim();
    if (!batchKey || args.agreedRateMmk < 0) throw new Error('Valid batch key and rate are required');
    const existing = await ctx.db.query('reviewPaymentBatches').withIndex('by_batch_key', (q) => q.eq('batchKey', batchKey)).unique();
    if (existing) throw new Error('Payment batch key already exists');
    const assignments = [];
    for (const assignmentId of [...new Set(args.assignmentIds)]) {
      const assignment = await ctx.db.get(assignmentId);
      if (!assignment || assignment.reviewerId !== args.reviewerId || assignment.status !== 'approved') {
        throw new Error('Only approved assignments for the selected reviewer may enter a payment batch');
      }
      if (assignment.paymentBatchId) throw new Error('An assignment is already in a payment batch');
      assignments.push(assignment);
    }
    const proposedPayableMmk = assignments.length * args.agreedRateMmk + args.manualAdjustmentMmk;
    const now = Date.now();
    const batchId = await ctx.db.insert('reviewPaymentBatches', {
      batchKey, reviewerId: args.reviewerId, assignmentIds: assignments.map((row) => row._id),
      agreedRateMmk: args.agreedRateMmk, manualAdjustmentMmk: args.manualAdjustmentMmk,
      proposedPayableMmk, status: 'ready_for_review', note: args.note?.trim() || undefined,
      createdBy: userId, createdAt: now, updatedAt: now,
    });
    for (const assignment of assignments) await ctx.db.patch(assignment._id, { paymentBatchId: batchKey, updatedAt: now });
    await logAudit(ctx, userId, 'review.paymentBatch.create', 'reviewPaymentBatches', batchId, `${batchKey}: ${proposedPayableMmk} MMK`);
    return { ok: true as const, batchId, proposedPayableMmk };
  },
});

export const setPaymentStatus = mutation({
  args: { batchId: v.id('reviewPaymentBatches'), status: paymentStatusValidator, note: v.string() },
  returns: v.object({ ok: v.literal(true) }),
  handler: async (ctx, args) => {
    const { userId } = await requireReviewManager(ctx);
    const batch = await ctx.db.get(args.batchId);
    if (!batch) throw new Error('Payment batch not found');
    const note = args.note.trim();
    if (!note) throw new Error('Payment status note is required');
    await ctx.db.patch(batch._id, { status: args.status, note, updatedAt: Date.now() });
    await logAudit(ctx, userId, 'review.paymentBatch.status', 'reviewPaymentBatches', batch._id, `${batch.status} → ${args.status}: ${note}`);
    return { ok: true as const };
  },
});
