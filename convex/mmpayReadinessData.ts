import { v } from 'convex/values';
import { internalQuery, query } from './_generated/server';
import { requireOwner } from './lib/auth';

const terminalStatusValidator = v.union(
  v.literal('SUCCESS'),
  v.literal('FAILED'),
  v.literal('REFUNDED'),
  v.literal('CANCELLED'),
  v.literal('EXPIRED'),
);

const storedStatusValidator = v.union(
  v.literal('INITIATING'),
  v.literal('PENDING'),
  terminalStatusValidator,
);

const MAX_WEBHOOK_EVENTS = 50;

function isTerminalStatus(
  status: 'INITIATING' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CANCELLED' | 'EXPIRED',
): status is 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CANCELLED' | 'EXPIRED' {
  return status === 'SUCCESS'
    || status === 'FAILED'
    || status === 'REFUNDED'
    || status === 'CANCELLED'
    || status === 'EXPIRED';
}

/**
 * Internal-only target lookup for the provider status probe.
 *
 * This function performs no writes and returns provider identifiers only to the
 * internal action that needs them. The action's public result deliberately
 * omits the order id, amount, user id and every checkout/provider reference.
 */
export const providerProbeTarget = internalQuery({
  args: { transactionId: v.id('mmpayTransactions') },
  returns: v.object({
    orderId: v.string(),
    amount: v.number(),
    currency: v.literal('MMK'),
    storedStatus: terminalStatusValidator,
  }),
  handler: async (ctx, { transactionId }) => {
    const row = await ctx.db.get(transactionId);
    if (!row) throw new Error('Provider probe target not found');
    if (row.environment !== 'production') {
      throw new Error('Provider probe requires an existing production transaction');
    }
    if (!isTerminalStatus(row.status)) {
      throw new Error('Provider probe requires an existing terminal transaction');
    }
    if (row.currency !== 'MMK' || !Number.isInteger(row.amount) || row.amount <= 0) {
      throw new Error('Provider probe target has invalid payment invariants');
    }
    return {
      orderId: row.orderId,
      amount: row.amount,
      currency: row.currency,
      storedStatus: row.status,
    };
  },
});

/**
 * Owner-only, bounded correlation between one production transaction and its
 * signed webhook ledger. No order id, nonce digest, provider reference, QR,
 * checkout URL, user id or customer detail leaves this query.
 */
export const productionWebhookEvidence = query({
  args: { transactionId: v.id('mmpayTransactions') },
  returns: v.union(
    v.null(),
    v.object({
      environment: v.literal('production'),
      paymentStatus: storedStatusValidator,
      callbackReceivedAt: v.union(v.number(), v.null()),
      paymentUpdatedAt: v.number(),
      webhookObserved: v.boolean(),
      observedEventCount: v.number(),
      eventsTruncated: v.boolean(),
      latestEventReceivedAt: v.union(v.number(), v.null()),
      latestEventStatus: v.union(v.string(), v.null()),
      callbackMatchesLatestEvent: v.boolean(),
    }),
  ),
  handler: async (ctx, { transactionId }) => {
    await requireOwner(ctx);
    const payment = await ctx.db.get(transactionId);
    if (!payment) return null;
    if (payment.environment !== 'production') {
      throw new Error('Webhook readiness evidence requires a production transaction');
    }

    const observed = await ctx.db
      .query('mmpayWebhookEvents')
      .withIndex('by_order_id', (q) => q.eq('orderId', payment.orderId))
      .order('desc')
      .take(MAX_WEBHOOK_EVENTS + 1);
    const eventsTruncated = observed.length > MAX_WEBHOOK_EVENTS;
    const events = observed.slice(0, MAX_WEBHOOK_EVENTS);
    const latest = events[0] ?? null;
    const callbackReceivedAt = payment.callbackReceivedAt ?? null;

    return {
      environment: 'production' as const,
      paymentStatus: payment.status,
      callbackReceivedAt,
      paymentUpdatedAt: payment.updatedAt,
      webhookObserved: events.length > 0,
      observedEventCount: events.length,
      eventsTruncated,
      latestEventReceivedAt: latest?.receivedAt ?? null,
      latestEventStatus: latest?.status ?? null,
      callbackMatchesLatestEvent: callbackReceivedAt !== null
        && latest !== null
        && callbackReceivedAt === latest.receivedAt,
    };
  },
});
