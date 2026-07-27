import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import { internalMutation, internalQuery, query, type MutationCtx } from './_generated/server';
import { logAudit } from './audit';
import { requireOwner, requireUser } from './lib/auth';

const planKeyValidator = v.union(v.literal('premium'), v.literal('family'));
const environmentValidator = v.union(v.literal('sandbox'), v.literal('production'));
const providerStatusValidator = v.union(
  v.literal('PENDING'),
  v.literal('SUCCESS'),
  v.literal('FAILED'),
  v.literal('REFUNDED'),
  v.literal('CANCELLED'),
  v.literal('EXPIRED'),
);
const storedStatusValidator = v.union(v.literal('INITIATING'), providerStatusValidator);
const methodValidator = v.union(v.literal('QR'), v.literal('PIN'), v.literal('PWA'), v.literal('CARD'));
const conditionValidator = v.union(v.literal('PRISTINE'), v.literal('TOUCHED'), v.literal('DIRTY'), v.literal('EXPIRED'));

const publicPaymentValidator = v.object({
  _id: v.id('mmpayTransactions'),
  orderId: v.string(),
  planKey: planKeyValidator,
  planId: v.optional(v.id('subscriptionPlans')),
  planInterval: v.optional(v.union(v.literal('month'), v.literal('year'))),
  environment: environmentValidator,
  amount: v.number(),
  currency: v.literal('MMK'),
  status: storedStatusValidator,
  condition: v.optional(conditionValidator),
  qrPayload: v.optional(v.string()),
  checkoutUrl: v.optional(v.string()),
  vendor: v.optional(v.string()),
  method: v.optional(methodValidator),
  vendorQrRefId: v.optional(v.string()),
  transactionRefId: v.optional(v.string()),
  failureReason: v.optional(v.string()),
  callbackReceivedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
  lastSyncedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const providerUpdateArgs = {
  orderId: v.string(),
  amount: v.number(),
  currency: v.literal('MMK'),
  status: providerStatusValidator,
  condition: v.optional(conditionValidator),
  qrPayload: v.optional(v.string()),
  checkoutUrl: v.optional(v.string()),
  vendor: v.optional(v.string()),
  method: v.optional(methodValidator),
  vendorQrRefId: v.optional(v.string()),
  transactionRefId: v.optional(v.string()),
};

function toPublic(row: {
  _id: Id<'mmpayTransactions'>;
  orderId: string;
  planKey: 'premium' | 'family';
  planId?: Id<'subscriptionPlans'>;
  planInterval?: 'month' | 'year';
  environment: 'sandbox' | 'production';
  amount: number;
  currency: 'MMK';
  status: 'INITIATING' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CANCELLED' | 'EXPIRED';
  condition?: 'PRISTINE' | 'TOUCHED' | 'DIRTY' | 'EXPIRED';
  qrPayload?: string;
  checkoutUrl?: string;
  vendor?: string;
  method?: 'QR' | 'PIN' | 'PWA' | 'CARD';
  vendorQrRefId?: string;
  transactionRefId?: string;
  failureReason?: string;
  callbackReceivedAt?: number;
  completedAt?: number;
  lastSyncedAt?: number;
  createdAt: number;
  updatedAt: number;
}) {
  return {
    _id: row._id,
    orderId: row.orderId,
    planKey: row.planKey,
    planId: row.planId,
    planInterval: row.planInterval,
    environment: row.environment,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    condition: row.condition,
    qrPayload: row.qrPayload,
    checkoutUrl: row.checkoutUrl,
    vendor: row.vendor,
    method: row.method,
    vendorQrRefId: row.vendorQrRefId,
    transactionRefId: row.transactionRefId,
    failureReason: row.failureReason,
    callbackReceivedAt: row.callbackReceivedAt,
    completedAt: row.completedAt,
    lastSyncedAt: row.lastSyncedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const checkoutContext = internalQuery({
  args: { planId: v.id('subscriptionPlans') },
  returns: v.object({
    userId: v.id('users'),
    planKey: planKeyValidator,
    planId: v.id('subscriptionPlans'),
    planInterval: v.union(v.literal('month'), v.literal('year')),
    nameMm: v.string(),
    nameEn: v.string(),
    amount: v.number(),
    currency: v.string(),
  }),
  handler: async (ctx, { planId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    const plan = await ctx.db.get(planId);
    if (!plan?.isActive) throw new Error('Subscription plan is unavailable');
    if (plan.currency !== 'MMK') throw new Error('Myan Myan Pay currently requires an MMK plan');
    return {
      userId,
      planKey: plan.planKey,
      planId: plan._id,
      planInterval: plan.interval,
      nameMm: plan.nameMm,
      nameEn: plan.nameEn,
      amount: plan.amount,
      currency: plan.currency,
    };
  },
});

export const reserve = internalMutation({
  args: {
    userId: v.id('users'),
    planKey: planKeyValidator,
    planId: v.id('subscriptionPlans'),
    planInterval: v.union(v.literal('month'), v.literal('year')),
    environment: environmentValidator,
    orderId: v.string(),
    amount: v.number(),
  },
  returns: v.id('mmpayTransactions'),
  handler: async (ctx, args) => {
    if (!Number.isInteger(args.amount) || args.amount <= 0) throw new Error('Payment amount must be a positive whole number');
    const existingOrder = await ctx.db
      .query('mmpayTransactions')
      .withIndex('by_order_id', (q) => q.eq('orderId', args.orderId))
      .unique();
    if (existingOrder) throw new Error('Payment order already exists');
    const recent = await ctx.db
      .query('mmpayTransactions')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(20);
    if (recent.some((row) => row.status === 'INITIATING' || row.status === 'PENDING')) {
      throw new Error('A Myan Myan Pay payment is already pending');
    }
    const now = Date.now();
    const id = await ctx.db.insert('mmpayTransactions', {
      ...args,
      currency: 'MMK',
      status: 'INITIATING',
      createdAt: now,
      updatedAt: now,
    });
    await logAudit(ctx, args.userId, 'mmpay.order.reserve', 'mmpayTransactions', id, `${args.orderId} · ${args.amount} MMK`);
    return id;
  },
});

export const markInitiationFailed = internalMutation({
  args: { orderId: v.string(), reason: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query('mmpayTransactions')
      .withIndex('by_order_id', (q) => q.eq('orderId', args.orderId))
      .unique();
    if (!row || row.status !== 'INITIATING') return null;
    const now = Date.now();
    await ctx.db.patch(row._id, { status: 'FAILED', failureReason: args.reason.slice(0, 300), updatedAt: now, completedAt: now });
    await logAudit(ctx, row.userId, 'mmpay.order.failed', 'mmpayTransactions', row._id, `${row.orderId} · ${args.reason.slice(0, 120)}`, { result: 'failed' });
    return null;
  },
});

type Update = {
  orderId: string;
  amount: number;
  currency: 'MMK';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CANCELLED' | 'EXPIRED';
  condition?: 'PRISTINE' | 'TOUCHED' | 'DIRTY' | 'EXPIRED';
  qrPayload?: string;
  checkoutUrl?: string;
  vendor?: string;
  method?: 'QR' | 'PIN' | 'PWA' | 'CARD';
  vendorQrRefId?: string;
  transactionRefId?: string;
};
type PaymentInvariantRow = {
  userId: Id<'users'>;
  orderId: string;
  amount: number;
  currency: 'MMK';
  status: 'INITIATING' | Update['status'];
};
type RefundSubscription = {
  provider?: string;
  providerSubscriptionId?: string;
};

const terminalStatuses = new Set(['SUCCESS', 'FAILED', 'REFUNDED', 'CANCELLED', 'EXPIRED']);

export function paymentBelongsToUser(
  row: PaymentInvariantRow | null,
  userId: Id<'users'>,
): row is PaymentInvariantRow {
  return row?.userId === userId;
}

export function assertPaymentMatches(
  row: PaymentInvariantRow | null,
  update: Update,
): asserts row is PaymentInvariantRow {
  if (!row || row.orderId !== update.orderId) throw new Error('Unknown payment order');
  if (row.amount !== update.amount || row.currency !== update.currency) {
    throw new Error('Payment amount or currency mismatch');
  }
}

export function providerTransitionIsAllowed(
  currentStatus: PaymentInvariantRow['status'],
  nextStatus: Update['status'],
): boolean {
  return !terminalStatuses.has(currentStatus)
    || (currentStatus === 'SUCCESS' && nextStatus === 'REFUNDED');
}

export function refundMatchesSubscription(
  subscription: RefundSubscription | null,
  orderId: string,
): subscription is RefundSubscription {
  return subscription?.provider === 'myanmyanpay'
    && subscription.providerSubscriptionId === orderId;
}

async function applyUpdate(ctx: MutationCtx, update: Update, source: 'api' | 'webhook') {
  const row = await ctx.db
    .query('mmpayTransactions')
    .withIndex('by_order_id', (q) => q.eq('orderId', update.orderId))
    .unique();
  assertPaymentMatches(row, update);
  if (update.transactionRefId) {
    const duplicateReference = await ctx.db
      .query('mmpayTransactions')
      .withIndex('by_transaction_ref_id', (q) => q.eq('transactionRefId', update.transactionRefId))
      .unique();
    if (duplicateReference && duplicateReference._id !== row._id) throw new Error('Provider transaction reference is already in use');
  }

  // Never let polling or a delayed PENDING callback regress a terminal state.
  // REFUNDED is the one valid transition after SUCCESS.
  if (!providerTransitionIsAllowed(row.status, update.status)) {
    return { status: row.status, changed: false };
  }

  const now = Date.now();
  const completedAt = terminalStatuses.has(update.status) ? (row.completedAt ?? now) : undefined;
  await ctx.db.patch(row._id, {
    status: update.status,
    condition: update.condition ?? row.condition,
    qrPayload: update.qrPayload ?? row.qrPayload,
    checkoutUrl: update.checkoutUrl ?? row.checkoutUrl,
    vendor: update.vendor ?? row.vendor,
    method: update.method ?? row.method,
    vendorQrRefId: update.vendorQrRefId ?? row.vendorQrRefId,
    transactionRefId: update.transactionRefId ?? row.transactionRefId,
    failureReason: undefined,
    completedAt,
    callbackReceivedAt: source === 'webhook' ? now : row.callbackReceivedAt,
    lastSyncedAt: now,
    updatedAt: now,
  });

  if (update.status === 'SUCCESS' && row.status !== 'SUCCESS') {
    const plan = row.planId
      ? await ctx.db.get(row.planId)
      : (await ctx.db
        .query('subscriptionPlans')
        .withIndex('by_plan_key', (q) => q.eq('planKey', row.planKey))
        .take(10))
        .find((candidate) => candidate.amount === row.amount && candidate.currency === row.currency);
    if (!plan) throw new Error('Subscription plan no longer exists');
    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', row.userId))
      .unique();
    const interval = row.planInterval ?? plan.interval;
    const periodMs = interval === 'year' ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    const patch = {
      planKey: row.planKey,
      status: 'active' as const,
      provider: 'myanmyanpay',
      providerSubscriptionId: row.orderId,
      currentPeriodEnd: now + periodMs,
      cancelAtPeriodEnd: false,
      updatedAt: now,
    };
    if (subscription) await ctx.db.patch(subscription._id, patch);
    else await ctx.db.insert('subscriptions', { userId: row.userId, ...patch, createdAt: now });
  }

  if (update.status === 'REFUNDED' && row.status === 'SUCCESS') {
    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', row.userId))
      .unique();
    if (refundMatchesSubscription(subscription, row.orderId)) {
      await ctx.db.patch(subscription._id, {
        planKey: 'free',
        status: 'active',
        currentPeriodEnd: now,
        cancelAtPeriodEnd: false,
        updatedAt: now,
      });
    }
  }

  await logAudit(ctx, null, `mmpay.${source}.${update.status.toLowerCase()}`, 'mmpayTransactions', row._id, `${row.orderId} · ${update.amount} MMK`);
  return { status: update.status, changed: row.status !== update.status };
}

export const applyProviderUpdate = internalMutation({
  args: providerUpdateArgs,
  returns: v.object({ status: storedStatusValidator, changed: v.boolean() }),
  handler: async (ctx, args) => applyUpdate(ctx, args, 'api'),
});

export const applyWebhook = internalMutation({
  args: { nonceHash: v.string(), ...providerUpdateArgs },
  returns: v.object({ status: storedStatusValidator, changed: v.boolean(), duplicate: v.boolean() }),
  handler: async (ctx, args) => {
    const existingEvent = await ctx.db
      .query('mmpayWebhookEvents')
      .withIndex('by_nonce_hash', (q) => q.eq('nonceHash', args.nonceHash))
      .unique();
    if (existingEvent) return { status: existingEvent.status as Update['status'], changed: false, duplicate: true };
    const { nonceHash, ...update } = args;
    const result = await applyUpdate(ctx, update, 'webhook');
    await ctx.db.insert('mmpayWebhookEvents', {
      nonceHash,
      orderId: update.orderId,
      status: update.status,
      receivedAt: Date.now(),
    });
    return { ...result, duplicate: false };
  },
});

export const myPayment = query({
  args: { orderId: v.string() },
  returns: v.union(publicPaymentValidator, v.null()),
  handler: async (ctx, { orderId }) => {
    const userId = await requireUser(ctx);
    const row = await ctx.db
      .query('mmpayTransactions')
      .withIndex('by_order_id', (q) => q.eq('orderId', orderId))
      .unique();
    return row && row.userId === userId ? toPublic(row) : null;
  },
});

export const myPayments = query({
  args: {},
  returns: v.array(publicPaymentValidator),
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const rows = await ctx.db
      .query('mmpayTransactions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .take(20);
    return rows.map(toPublic);
  },
});

export const ownedOrder = internalQuery({
  args: { orderId: v.string() },
  returns: v.object({ userId: v.id('users'), orderId: v.string(), amount: v.number(), status: storedStatusValidator }),
  handler: async (ctx, { orderId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    const row = await ctx.db
      .query('mmpayTransactions')
      .withIndex('by_order_id', (q) => q.eq('orderId', orderId))
      .unique();
    if (!paymentBelongsToUser(row, userId)) throw new Error('Payment order not found');
    return { userId, orderId: row.orderId, amount: row.amount, status: row.status };
  },
});

export const adminPayments = query({
  args: {},
  returns: v.object({
    allowed: v.boolean(),
    rows: v.array(v.object({ payment: publicPaymentValidator, userEmail: v.union(v.string(), v.null()) })),
  }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { allowed: false, rows: [] };
    try {
      await requireOwner(ctx);
    } catch {
      return { allowed: false, rows: [] };
    }
    const payments = await ctx.db.query('mmpayTransactions').order('desc').take(200);
    const rows = [];
    for (const payment of payments) {
      const user = await ctx.db.get(payment.userId);
      rows.push({ payment: toPublic(payment), userEmail: user?.email ?? null });
    }
    return { allowed: true, rows };
  },
});
