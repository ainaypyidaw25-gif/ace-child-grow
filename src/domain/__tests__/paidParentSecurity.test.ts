import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Id } from '../../../convex/_generated/dataModel';
import {
  membershipCanInheritFamilyAccess,
  subscriptionIsEnabled,
} from '../../../convex/lib/entitlements';
import {
  assertPaymentMatches,
  paymentBelongsToUser,
  providerTransitionIsAllowed,
  refundMatchesSubscription,
} from '../../../convex/mmpayData';
import { webhookSignatureIsValid } from '../../../convex/mmpay';
import { trialIsAvailable } from '../../../convex/subscriptions';

const userId = 'users:owner' as Id<'users'>;
const otherUserId = 'users:other' as Id<'users'>;
const now = 1_800_000_000_000;

const activePremium = {
  planKey: 'premium' as const,
  status: 'active' as const,
  currentPeriodEnd: now + 1,
};
const activeFamily = {
  planKey: 'family' as const,
  status: 'active' as const,
  currentPeriodEnd: now + 1,
};
const payment = {
  userId,
  orderId: 'ACG-ORDER-1',
  amount: 5_900,
  currency: 'MMK' as const,
  status: 'PENDING' as const,
};
const successUpdate = {
  orderId: payment.orderId,
  amount: payment.amount,
  currency: 'MMK' as const,
  status: 'SUCCESS' as const,
};

describe('paid-parent request-time entitlement gates', () => {
  it('expires direct Premium and Family subscriptions at request time', () => {
    expect(subscriptionIsEnabled(activePremium, now)).toBe(true);
    expect(subscriptionIsEnabled({ ...activePremium, currentPeriodEnd: now }, now)).toBe(false);
    expect(subscriptionIsEnabled({ ...activeFamily, currentPeriodEnd: now - 1 }, now)).toBe(false);
  });

  it('keeps manual grants without a period end active', () => {
    expect(subscriptionIsEnabled({
      planKey: 'premium',
      status: 'active',
    }, now)).toBe(true);
  });

  it('requires an active membership and an unexpired Family owner plan', () => {
    expect(membershipCanInheritFamilyAccess({ status: 'active' }, activeFamily, now)).toBe(true);
    expect(membershipCanInheritFamilyAccess(
      { status: 'active' },
      { ...activeFamily, currentPeriodEnd: now },
      now,
    )).toBe(false);
    expect(membershipCanInheritFamilyAccess({ status: 'revoked' }, activeFamily, now)).toBe(false);
    expect(membershipCanInheritFamilyAccess({ status: 'pending' }, activeFamily, now)).toBe(false);
  });

  it('allows a trial once and rejects prior trials, paid accounts, and manual grants', () => {
    expect(trialIsAvailable({ planKey: 'free', status: 'active' })).toBe(true);
    expect(trialIsAvailable({ planKey: 'free', status: 'active', trialUsedAt: now })).toBe(false);
    expect(trialIsAvailable({
      planKey: 'premium',
      status: 'canceled',
      providerSubscriptionId: 'prior-order',
    })).toBe(false);
    expect(trialIsAvailable({ planKey: 'free', status: 'active', provider: 'manual' })).toBe(false);
    expect(trialIsAvailable({ planKey: 'family', status: 'active' })).toBe(false);
  });
});

describe('Myan Myan Pay transaction integrity', () => {
  it('enforces payment order ownership', () => {
    expect(paymentBelongsToUser(payment, userId)).toBe(true);
    expect(paymentBelongsToUser(payment, otherUserId)).toBe(false);
    expect(paymentBelongsToUser(null, userId)).toBe(false);
  });

  it('rejects amount, currency, and order-ID mismatches', () => {
    expect(() => assertPaymentMatches(payment, successUpdate)).not.toThrow();
    expect(() => assertPaymentMatches(payment, { ...successUpdate, amount: 5_901 }))
      .toThrow('Payment amount or currency mismatch');
    expect(() => assertPaymentMatches(payment, {
      ...successUpdate,
      currency: 'USD' as 'MMK',
    })).toThrow('Payment amount or currency mismatch');
    expect(() => assertPaymentMatches(payment, {
      ...successUpdate,
      orderId: 'ACG-UNKNOWN',
    })).toThrow('Unknown payment order');
  });

  it('matches the SDK-documented webhook signature and rejects invalid signatures', () => {
    const rawBody = JSON.stringify({
      orderId: payment.orderId,
      amount: payment.amount,
      currency: 'MMK',
      status: 'SUCCESS',
    });
    const signature = createHmac('sha256', 'sk_test_example')
      .update(`nonce-1.${rawBody}`)
      .digest('hex');

    expect(webhookSignatureIsValid('sk_test_example', rawBody, 'nonce-1', signature)).toBe(true);
    expect(webhookSignatureIsValid('sk_test_example', rawBody, 'nonce-1', `${signature.slice(0, -1)}0`))
      .toBe(false);
    expect(webhookSignatureIsValid('sk_test_example', rawBody, 'nonce-2', signature)).toBe(false);
  });

  it('refuses delayed callbacks that regress terminal state', () => {
    expect(providerTransitionIsAllowed('PENDING', 'SUCCESS')).toBe(true);
    expect(providerTransitionIsAllowed('SUCCESS', 'PENDING')).toBe(false);
    expect(providerTransitionIsAllowed('FAILED', 'SUCCESS')).toBe(false);
    expect(providerTransitionIsAllowed('SUCCESS', 'REFUNDED')).toBe(true);
    expect(providerTransitionIsAllowed('REFUNDED', 'SUCCESS')).toBe(false);
  });

  it('persists nonce hashes and returns duplicate without reapplying a webhook', () => {
    const source = readFileSync('convex/mmpayData.ts', 'utf8');
    expect(source).toContain(".withIndex('by_nonce_hash'");
    expect(source).toContain('if (existingEvent) return');
    expect(source).toContain('duplicate: true');
    expect(source).toContain("ctx.db.insert('mmpayWebhookEvents'");
  });

  it('refunds only the subscription activated by the same order', () => {
    expect(refundMatchesSubscription({
      provider: 'myanmyanpay',
      providerSubscriptionId: payment.orderId,
    }, payment.orderId)).toBe(true);
    expect(refundMatchesSubscription({
      provider: 'myanmyanpay',
      providerSubscriptionId: 'ACG-NEWER',
    }, payment.orderId)).toBe(false);
    expect(refundMatchesSubscription({
      provider: 'manual',
      providerSubscriptionId: payment.orderId,
    }, payment.orderId)).toBe(false);
  });
});
