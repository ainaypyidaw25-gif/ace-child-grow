import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({ userId: null as string | null }));

vi.mock('@convex-dev/auth/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@convex-dev/auth/server')>();
  return {
    ...actual,
    getAuthUserId: vi.fn(async () => authState.userId),
  };
});

import {
  completion,
  createPaymentBatch,
  paymentWorkspace,
  recordExport,
  setPaymentStatus,
} from '../../../convex/reviewReports';

type Row = Record<string, unknown> & { _id?: string };

function context(options: {
  rows?: Record<string, Row[]>;
  gets?: Record<string, Row | null>;
  profiles?: Record<string, Row>;
} = {}) {
  const patch = vi.fn();
  const insert = vi.fn(async (table: string, values?: unknown) => {
    void values;
    return table === 'reviewPaymentBatches' ? 'payment-batch-1' : `${table}-1`;
  });
  const query = vi.fn((table: string) => {
    const source = table === 'parentProfiles'
      ? Object.values(options.profiles ?? {})
      : options.rows?.[table] ?? [];
    const terminal = (filters: Array<[string, unknown]> = []) => {
      const filtered = () => source.filter((row) => filters.every(([field, value]) => row[field] === value));
      const api = {
        collect: async () => filtered(),
        take: async (count: number) => filtered().slice(0, count),
        unique: async () => filtered()[0] ?? null,
        order: () => api,
        withIndex: (
          _name: string,
          callback: (q: { eq: (field: string, value: unknown) => unknown }) => unknown,
        ) => {
          const nextFilters: Array<[string, unknown]> = [];
          const q = {
            eq: (field: string, value: unknown): unknown => {
              nextFilters.push([field, value]);
              return q;
            },
          };
          callback(q);
          return terminal(nextFilters);
        },
      };
      return api;
    };
    return terminal();
  });
  return {
    auth: {},
    db: {
      query,
      get: vi.fn(async (id: string) => options.gets?.[id] ?? null),
      patch,
      insert,
    },
    storage: {},
  };
}

function handler(fn: unknown): (
  ctx: ReturnType<typeof context>,
  args: Record<string, unknown>,
) => Promise<unknown> {
  return (fn as {
    _handler: (ctx: ReturnType<typeof context>, args: Record<string, unknown>) => Promise<unknown>;
  })._handler;
}

function profile(role: string, displayName: string): Row {
  return { userId: authState.userId, isStaff: true, staffRole: role, displayName };
}

function approvedAssignment(overrides: Row = {}): Row {
  return {
    _id: 'assignment-1',
    reviewerId: 'reviewer-1',
    reviewerType: 'language_reviewer',
    status: 'approved',
    reviewRound: 1,
    contentSlug: 'item-1',
    contentVersion: 1,
    assignedBy: 'manager-1',
    assignedAt: 10,
    completionDate: 80,
    dueAt: 100,
    priority: 'normal',
    reviewScope: 'language',
    updatedAt: 80,
    ...overrides,
  };
}

function paymentBatch(overrides: Row = {}): Row {
  return {
    _id: 'batch-1',
    _creationTime: 1,
    batchKey: '2026-07-reviewer-1',
    reviewerId: 'reviewer-1',
    assignmentIds: ['assignment-1'],
    agreedRateMmk: 2_000,
    rateBasis: 'per_item',
    manualAdjustmentMmk: 0,
    proposedPayableMmk: 2_000,
    status: 'ready_for_review',
    createdBy: 'manager-1',
    calculatedAt: 10,
    createdAt: 10,
    updatedAt: 10,
    ...overrides,
  };
}

describe('review report and payment hardening', () => {
  beforeEach(() => {
    authState.userId = null;
  });

  it('uses bounded report reads and declares return validators', () => {
    const source = readFileSync('convex/reviewReports.ts', 'utf8');
    expect(source).not.toContain("query('reviewAssignments').collect()");
    expect(source).toContain('.take(MAX_COMPLETION_ASSIGNMENTS + 1)');
    expect(source.match(/returns:/g)?.length).toBeGreaterThanOrEqual(5);
  });

  it('lets an auditor view non-monetary completion but denies the payment workspace', async () => {
    authState.userId = 'auditor-1';
    const ctx = context({
      profiles: {
        'auditor-1': profile('auditor', 'Auditor'),
        'reviewer-1': { userId: 'reviewer-1', isStaff: true, staffRole: 'language_reviewer', displayName: 'Reviewer' },
      },
      rows: { reviewAssignments: [approvedAssignment()] },
    });
    await expect(handler(completion)(ctx, { asOf: 1_000 })).resolves.toEqual({
      rows: [expect.objectContaining({ reviewerId: 'reviewer-1', completed: 1 })],
      hasMore: false,
      assignmentLimit: 2_000,
    });
    await expect(handler(paymentWorkspace)(ctx, {})).rejects.toThrow('Insufficient explicit staff permission');
    expect(ctx.db.query).not.toHaveBeenCalledWith('reviewPaymentBatches');
  });

  it('never grants monetary workflow access from the legacy isStaff fallback', async () => {
    authState.userId = 'legacy-staff-1';
    const profiles = { 'legacy-staff-1': { userId: 'legacy-staff-1', isStaff: true } };

    const workspaceCtx = context({ profiles });
    await expect(handler(paymentWorkspace)(workspaceCtx, {}))
      .rejects.toThrow('Insufficient explicit staff permission');
    expect(workspaceCtx.db.query).not.toHaveBeenCalledWith('reviewPaymentBatches');

    const createCtx = context({ profiles });
    await expect(handler(createPaymentBatch)(createCtx, {
      batchKey: 'legacy-batch', reviewerId: 'reviewer-1', assignmentIds: ['assignment-1'],
      agreedRateMmk: 1_000, rateBasis: 'per_item', manualAdjustmentMmk: 0,
    })).rejects.toThrow('Insufficient explicit staff permission');
    expect(createCtx.db.insert).not.toHaveBeenCalled();

    const statusCtx = context({ profiles });
    await expect(handler(setPaymentStatus)(statusCtx, {
      batchId: 'batch-1', status: 'disputed', note: 'Legacy access attempt',
    })).rejects.toThrow('Insufficient explicit staff permission');
    expect(statusCtx.db.patch).not.toHaveBeenCalled();

    const exportCtx = context({ profiles });
    await expect(handler(recordExport)(exportCtx, { kind: 'payment_csv' }))
      .rejects.toThrow('Payment report export access denied');
    expect(exportCtx.db.insert).not.toHaveBeenCalled();
  });

  it('returns a bounded manager payment workspace with normalized legacy fields', async () => {
    authState.userId = 'manager-1';
    const ctx = context({
      profiles: {
        'manager-1': profile('review_manager', 'Manager'),
        'reviewer-1': { userId: 'reviewer-1', isStaff: true, staffRole: 'language_reviewer', displayName: 'Reviewer One' },
      },
      rows: { reviewPaymentBatches: [paymentBatch()] },
    });
    await expect(handler(paymentWorkspace)(ctx, { limit: 20 })).resolves.toEqual({
      hasMore: false,
      batches: [expect.objectContaining({
        reviewerName: 'Reviewer One',
        rateBasis: 'per_item',
        manualAdjustmentReason: null,
        paymentReference: null,
        assignedItemCount: 1,
      })],
    });
  });

  it('rejects empty, duplicate, and invalid payment batch inputs before writes', async () => {
    authState.userId = 'manager-1';
    const ctx = context({ profiles: { 'manager-1': profile('review_manager', 'Manager') } });
    const common = {
      batchKey: 'batch-1', reviewerId: 'reviewer-1', agreedRateMmk: 1_000,
      rateBasis: 'per_item', manualAdjustmentMmk: 0,
    };
    await expect(handler(createPaymentBatch)(ctx, { ...common, assignmentIds: [] }))
      .rejects.toThrow('between 1 and 100 assignments');
    await expect(handler(createPaymentBatch)(ctx, {
      ...common, assignmentIds: ['assignment-1', 'assignment-1'],
    })).rejects.toThrow('must be unique');
    await expect(handler(createPaymentBatch)(ctx, {
      ...common, assignmentIds: ['assignment-1'], agreedRateMmk: 1.5,
    })).rejects.toThrow('whole MMK amount');
    expect(ctx.db.insert).not.toHaveBeenCalled();
    expect(ctx.db.patch).not.toHaveBeenCalled();
  });

  it('requires an adjustment reason and prevents a negative payable amount', async () => {
    authState.userId = 'manager-1';
    const ctx = context({
      profiles: { 'manager-1': profile('review_manager', 'Manager') },
      gets: { 'assignment-1': approvedAssignment() },
      rows: { reviewPaymentBatches: [] },
    });
    const common = {
      batchKey: 'batch-1', reviewerId: 'reviewer-1', assignmentIds: ['assignment-1'],
      agreedRateMmk: 1_000, rateBasis: 'per_item',
    };
    await expect(handler(createPaymentBatch)(ctx, { ...common, manualAdjustmentMmk: -1 }))
      .rejects.toThrow('reason is required');
    await expect(handler(createPaymentBatch)(ctx, {
      ...common, manualAdjustmentMmk: -1_001, manualAdjustmentReason: 'Correction',
    })).rejects.toThrow('non-negative whole MMK');
    expect(ctx.db.insert).not.toHaveBeenCalled();
  });

  it('calculates per-item pay and stores immutable completion snapshots', async () => {
    authState.userId = 'manager-1';
    const ctx = context({
      profiles: { 'manager-1': profile('review_manager', 'Manager') },
      gets: {
        'assignment-1': approvedAssignment(),
        'assignment-2': approvedAssignment({
          _id: 'assignment-2', contentSlug: 'item-2', reviewRound: 2, dueAt: 50, completionDate: 90,
        }),
      },
      rows: { reviewPaymentBatches: [] },
    });
    await expect(handler(createPaymentBatch)(ctx, {
      batchKey: 'batch-1', reviewerId: 'reviewer-1', assignmentIds: ['assignment-1', 'assignment-2'],
      agreedRateMmk: 1_500, rateBasis: 'per_item', manualAdjustmentMmk: 500,
      manualAdjustmentReason: 'Revision complexity', note: 'Prepared for finance review',
    })).resolves.toEqual({ ok: true, batchId: 'payment-batch-1', proposedPayableMmk: 3_500 });
    expect(ctx.db.insert).toHaveBeenCalledWith('reviewPaymentBatches', expect.objectContaining({
      rateBasis: 'per_item', proposedPayableMmk: 3_500, assignedItemCount: 2,
      firstReviewsCompleted: 1, revisionReviewsCompleted: 1, finalApprovalsCompleted: 2,
      overdueItems: 1, totalCompletedItems: 2, status: 'ready_for_review',
    }));
    expect(ctx.db.patch).toHaveBeenCalledTimes(2);
    expect(ctx.db.insert).toHaveBeenCalledWith('auditLogs', expect.objectContaining({
      action: 'review.paymentBatch.create',
      summary: 'batch-1: 2 completed items',
      after: JSON.stringify({ status: 'ready_for_review', rateBasis: 'per_item', itemCount: 2 }),
    }));
    const auditInsert = ctx.db.insert.mock.calls.find(([table]) => table === 'auditLogs');
    expect(JSON.stringify(auditInsert?.[1])).not.toContain('3500');
  });

  it('calculates a package rate once rather than once per assignment', async () => {
    authState.userId = 'manager-1';
    const ctx = context({
      profiles: { 'manager-1': profile('review_manager', 'Manager') },
      gets: {
        'assignment-1': approvedAssignment(),
        'assignment-2': approvedAssignment({ _id: 'assignment-2', contentSlug: 'item-2' }),
      },
      rows: { reviewPaymentBatches: [] },
    });
    await expect(handler(createPaymentBatch)(ctx, {
      batchKey: 'package-1', reviewerId: 'reviewer-1', assignmentIds: ['assignment-1', 'assignment-2'],
      agreedRateMmk: 5_000, rateBasis: 'package', manualAdjustmentMmk: 0,
    })).resolves.toEqual({ ok: true, batchId: 'payment-batch-1', proposedPayableMmk: 5_000 });
    expect(ctx.db.insert).toHaveBeenCalledWith('reviewPaymentBatches', expect.objectContaining({
      rateBasis: 'package', proposedPayableMmk: 5_000,
    }));
  });

  it('accepts only approved, unbatched assignments belonging to one reviewer', async () => {
    authState.userId = 'manager-1';
    const profiles = { 'manager-1': profile('review_manager', 'Manager') };
    const args = {
      batchKey: 'batch-1', reviewerId: 'reviewer-1', assignmentIds: ['assignment-1'],
      agreedRateMmk: 1_000, rateBasis: 'per_item', manualAdjustmentMmk: 0,
    };
    for (const assignment of [
      approvedAssignment({ reviewerId: 'reviewer-2' }),
      approvedAssignment({ status: 'in_review' }),
      approvedAssignment({ paymentBatchId: 'existing-batch' }),
    ]) {
      const ctx = context({
        profiles,
        gets: { 'assignment-1': assignment },
        rows: { reviewPaymentBatches: [] },
      });
      await expect(handler(createPaymentBatch)(ctx, args)).rejects.toThrow(/approved assignments|already in a payment batch/);
      expect(ctx.db.insert).not.toHaveBeenCalled();
      expect(ctx.db.patch).not.toHaveBeenCalled();
    }
  });

  it('lets a review manager dispute but not approve or pay a batch', async () => {
    authState.userId = 'manager-1';
    const managerProfiles = { 'manager-1': profile('review_manager', 'Manager') };
    const approveCtx = context({
      profiles: managerProfiles,
      gets: { 'batch-1': paymentBatch() },
    });
    await expect(handler(setPaymentStatus)(approveCtx, {
      batchId: 'batch-1', status: 'approved_for_payment', note: 'Looks correct',
    })).rejects.toThrow('Owner or system administrator approval is required');
    expect(approveCtx.db.patch).not.toHaveBeenCalled();

    const disputeCtx = context({
      profiles: managerProfiles,
      gets: { 'batch-1': paymentBatch() },
    });
    await expect(handler(setPaymentStatus)(disputeCtx, {
      batchId: 'batch-1', status: 'disputed', note: 'Count needs review',
    })).resolves.toEqual({ ok: true });
    expect(disputeCtx.db.patch).toHaveBeenCalledWith('batch-1', expect.objectContaining({ status: 'disputed' }));
    expect(disputeCtx.db.insert).toHaveBeenCalledWith('auditLogs', expect.objectContaining({
      action: 'review.paymentBatch.disputed',
    }));
  });

  it('enforces the transition graph and requires a persisted reference for paid', async () => {
    authState.userId = 'owner-1';
    const profiles = { 'owner-1': profile('owner', 'Owner') };
    const invalidCtx = context({
      profiles,
      gets: { 'batch-1': paymentBatch({ status: 'paid', paymentReference: 'bank-123' }) },
    });
    await expect(handler(setPaymentStatus)(invalidCtx, {
      batchId: 'batch-1', status: 'disputed', note: 'Try to reopen paid batch',
    })).rejects.toThrow('cannot move from paid');

    const missingReferenceCtx = context({
      profiles,
      gets: { 'batch-1': paymentBatch({ status: 'approved_for_payment' }) },
    });
    await expect(handler(setPaymentStatus)(missingReferenceCtx, {
      batchId: 'batch-1', status: 'paid', note: 'Paid externally',
    })).rejects.toThrow('Payment reference is required');

    const paidCtx = context({
      profiles,
      gets: { 'batch-1': paymentBatch({ status: 'approved_for_payment' }) },
    });
    await expect(handler(setPaymentStatus)(paidCtx, {
      batchId: 'batch-1', status: 'paid', note: 'Paid externally', paymentReference: ' bank-123 ',
    })).resolves.toEqual({ ok: true });
    expect(paidCtx.db.patch).toHaveBeenCalledWith('batch-1', expect.objectContaining({
      status: 'paid', paymentReference: 'bank-123', paidBy: 'owner-1',
    }));
    expect(paidCtx.db.insert).toHaveBeenCalledWith('auditLogs', expect.objectContaining({
      action: 'review.paymentBatch.paid',
      after: JSON.stringify({ status: 'paid', paymentReferenceRecorded: true }),
    }));
  });

  it('lets auditors record completion exports but never payment exports', async () => {
    authState.userId = 'auditor-1';
    const profiles = { 'auditor-1': profile('auditor', 'Auditor') };
    const completionCtx = context({ profiles });
    await expect(handler(recordExport)(completionCtx, {
      kind: 'completion_csv', filterSummary: 'July assignments',
    })).resolves.toEqual({ ok: true });
    expect(completionCtx.db.insert).toHaveBeenCalledWith('auditLogs', expect.objectContaining({
      action: 'review.report.export', entityId: 'completion_csv',
    }));

    const paymentCtx = context({ profiles });
    await expect(handler(recordExport)(paymentCtx, { kind: 'payment_csv' }))
      .rejects.toThrow('Payment report export access denied');
    expect(paymentCtx.db.insert).not.toHaveBeenCalled();
  });
});
