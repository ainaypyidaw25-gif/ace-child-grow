import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyProviderUpdate, applyWebhook } from '../../../convex/mmpayData';
import { reviewPaymentRequest } from '../../../convex/billing';
import { grantPlan, syncProviderSubscription } from '../../../convex/subscriptions';

vi.mock('../../../convex/lib/auth', () => ({ requireOwner: async () => 'owner', requireUser: async () => 'parent' }));
const DAY = 86_400_000;
const NOW = 1_800_000_000_000;
type Row = Record<string, unknown>;
function fixture() {
  const tables: Record<string, Row[]> = { subscriptions: [], mmpayTransactions: [], mmpayWebhookEvents: [], auditLogs: [], subscriptionPlans: [], paymentRequests: [] };
  let seq = 0;
  const db = {
    async get(id: unknown) { const row = Object.values(tables).flat().find(r => r._id === id); return row ? { ...row } : null; },
    async insert(table: string, row: Row) { const _id = `${table}:${++seq}`; tables[table].push({ ...row, _id }); return _id; },
    async patch(id: unknown, patch: Row) { Object.assign(Object.values(tables).flat().find(r => r._id === id) ?? {}, patch); },
    query(table: string) {
      const predicates: ((r: Row) => boolean)[] = [];
      const builder = {
        eq(k: string, v: unknown) { predicates.push(r => r[k] === v); return builder; },
        gte(k: string, v: number) { predicates.push(r => Number(r[k]) >= v); return builder; },
      };
      const query = {
        withIndex(_name: string, fn: (q: typeof builder) => unknown) { fn(builder); return query; },
        async unique() { const rows = tables[table].filter(r => predicates.every(p => p(r))); if (rows.length > 1) throw Error('not unique'); return rows[0] ? { ...rows[0] } : null; },
        async take(n: number) { return tables[table].filter(r => predicates.every(p => p(r))).slice(0, n).map(r => ({ ...r })); },
      };
      return query;
    },
  };
  const ctx = { db };
  const call = (fn: unknown, args: Row) => (fn as { _handler: (ctx: unknown, args: Row) => Promise<unknown> })._handler(ctx, args);
  async function order(orderId: string, interval = 'month', planKey = 'premium') {
    const planId = await db.insert('subscriptionPlans', { interval, planKey });
    await db.insert('mmpayTransactions', { userId: 'parent', orderId, planId, planInterval: interval, planKey, status: 'PENDING', amount: 6900, currency: 'MMK' });
    return update(orderId, 'SUCCESS');
  }
  const update = (orderId: string, status: string) => call(applyProviderUpdate, { orderId, status, amount: 6900, currency: 'MMK' });
  async function manual(planKey = 'premium') {
    const planId = await db.insert('subscriptionPlans', { interval: 'month', planKey });
    const id = await db.insert('paymentRequests', { userId: 'parent', status: 'pending', planId, planInterval: 'month', planKey, amount: 6900, currency: 'MMK' });
    await call(reviewPaymentRequest, { id, decision: 'approved' });
    return id;
  }
  return { tables, db, call, order, update, manual, subscription: () => tables.subscriptions[0], payment: (id: string) => tables.mmpayTransactions.find(r => r.orderId === id)! };
}
afterEach(() => vi.useRealTimers());
function clock(day = 0) { vi.useFakeTimers(); vi.setSystemTime(NOW + day * DAY); }

describe('order-level Myan Myan Pay entitlement reconciliation', () => {
  it.each(['a', 'b'])('refunds %s without removing the other same-plan purchase', async id => {
    clock(); const f = fixture(); await f.order('a'); await f.order('b');
    expect(f.subscription().currentPeriodEnd).toBe(NOW + 60 * DAY);
    await f.update(id, 'REFUNDED');
    expect(f.subscription().planKey).toBe('premium');
    expect(f.subscription().currentPeriodEnd).toBe(NOW + 30 * DAY);
    expect(f.payment(id).refundRemovedMs).toBe(30 * DAY);
    await f.update(id === 'a' ? 'b' : 'a', 'REFUNDED');
    expect(f.subscription().planKey).toBe('free');
    expect(f.subscription().currentPeriodEnd).toBe(NOW);
  });
  it.each([true, false])('preserves manual time with manual-first=%s', async first => {
    clock(); const f = fixture(); if (first) await f.manual();
    await f.order('a'); if (!first) await f.manual();
    await f.update('a', 'REFUNDED');
    expect(f.subscription().currentPeriodEnd).toBe(NOW + 30 * DAY);
    expect(f.subscription().planKey).toBe('premium');
  });
  it('compacts tracked bounds across a manual extension and multiple refunds', async () => {
    clock(); const f = fixture(); await f.order('a'); await f.manual(); await f.order('b');
    await f.update('a', 'REFUNDED');
    expect(f.payment('b').entitlementStart).toBe(NOW + 30 * DAY);
    expect(f.payment('b').entitlementGrantedStart).toBe(NOW + 60 * DAY);
    await f.update('b', 'REFUNDED');
    expect(f.subscription().currentPeriodEnd).toBe(NOW + 30 * DAY);
  });
  it('subtracts only unused older time after partial consumption', async () => {
    clock(); const f = fixture(); await f.order('a'); await f.order('b'); clock(10);
    await f.update('a', 'REFUNDED');
    expect(f.subscription().currentPeriodEnd).toBe(NOW + 40 * DAY);
    expect(f.payment('b').entitlementStart).toBe(NOW + 10 * DAY);
    clock(15); await f.update('b', 'REFUNDED');
    expect(f.payment('b').refundRemovedMs).toBe(25 * DAY);
    expect(f.subscription().currentPeriodEnd).toBe(NOW + 15 * DAY);
  });
  it('does not subtract consumed time from a later purchase', async () => {
    clock(); const f = fixture(); await f.order('a'); await f.order('b'); clock(35);
    await f.update('a', 'REFUNDED');
    expect(f.payment('a').refundRemovedMs).toBe(0);
    expect(f.subscription().currentPeriodEnd).toBe(NOW + 60 * DAY);
  });
  it('replays success/refund through polling and different webhook nonces exactly once', async () => {
    clock(); const f = fixture(); await f.order('a');
    const callback = (nonceHash: string, status: string) => f.call(applyWebhook, { nonceHash, orderId: 'a', status, amount: 6900, currency: 'MMK' });
    await f.update('a', 'SUCCESS'); await callback('one', 'SUCCESS'); await callback('one', 'SUCCESS');
    expect(f.subscription().currentPeriodEnd).toBe(NOW + 30 * DAY);
    await callback('two', 'REFUNDED'); await callback('two', 'REFUNDED'); await callback('three', 'REFUNDED');
    await f.update('a', 'REFUNDED'); await f.update('a', 'SUCCESS'); await f.update('a', 'PENDING');
    expect(f.subscription().currentPeriodEnd).toBe(NOW);
    expect(f.tables.auditLogs.filter(r => r.action === 'mmpay.refund.reconcile')).toHaveLength(1);
  });
  it('uses snapshotted yearly bounds even after plan edits', async () => {
    clock(); const f = fixture(); await f.order('a', 'year'); await f.order('b');
    f.tables.subscriptionPlans[0].interval = 'month'; await f.update('a', 'REFUNDED');
    expect(f.subscription().currentPeriodEnd).toBe(NOW + 30 * DAY);
  });
  it('preserves trial and legacy baseline time when refunding a new order', async () => {
    clock(); const f = fixture(); await f.db.insert('subscriptions', { userId: 'parent', planKey: 'premium', status: 'trialing', currentPeriodEnd: NOW + 3 * DAY });
    await f.order('a'); await f.update('a', 'REFUNDED');
    expect(f.subscription().currentPeriodEnd).toBe(NOW + 3 * DAY);
  });
  it('records legacy refunds for review without guessing or deleting paid access', async () => {
    clock(); const f = fixture(); await f.order('a');
    Object.assign(f.payment('a'), { entitlementChainId: undefined, entitlementStart: undefined, entitlementEnd: undefined });
    await f.update('a', 'REFUNDED');
    expect(f.payment('a').refundReconciliation).toBe('legacy_unresolved');
    expect(f.subscription().currentPeriodEnd).toBe(NOW + 30 * DAY);
  });
  it.each(['changed-plan', 'manual-grant', 'provider-sync'])('does not revoke replacement access: %s', async replacement => {
    clock(); const f = fixture(); await f.order('a');
    if (replacement === 'changed-plan') await f.manual('family');
    if (replacement === 'manual-grant') await f.call(grantPlan, { userId: 'parent', planKey: 'premium' });
    if (replacement === 'provider-sync') await f.call(syncProviderSubscription, { userId: 'parent', planKey: 'premium', status: 'active', provider: 'other', currentPeriodEnd: NOW + 90 * DAY });
    const end = f.subscription().currentPeriodEnd; await f.update('a', 'REFUNDED');
    expect(f.subscription().currentPeriodEnd).toBe(end);
    expect(f.payment('a').refundReconciliation).toBe('superseded');
  });
  it('starts a new chain after a gap and ignores refunds from the expired chain', async () => {
    clock(); const f = fixture(); await f.order('a'); clock(40); await f.order('b');
    await f.update('a', 'REFUNDED');
    expect(f.subscription().currentPeriodEnd).toBe(NOW + 70 * DAY);
    expect(f.payment('a').refundReconciliation).toBe('superseded');
  });
});
