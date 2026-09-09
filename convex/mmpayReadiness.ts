"use node";

import { MMPaySDK } from 'mmpay-node-sdk';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { internalAction } from './_generated/server';
import { readMmpayConfig, type MmpayConfig } from './lib/mmpayConfig';

type TerminalStatus = 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CANCELLED' | 'EXPIRED';
type ProviderStatus = 'PENDING' | TerminalStatus;

type ProbeTarget = {
  orderId: string;
  amount: number;
  currency: 'MMK';
  storedStatus: TerminalStatus;
};

const providerStatusValidator = v.union(
  v.literal('PENDING'),
  v.literal('SUCCESS'),
  v.literal('FAILED'),
  v.literal('REFUNDED'),
  v.literal('CANCELLED'),
  v.literal('EXPIRED'),
);

const terminalStatusValidator = v.union(
  v.literal('SUCCESS'),
  v.literal('FAILED'),
  v.literal('REFUNDED'),
  v.literal('CANCELLED'),
  v.literal('EXPIRED'),
);

const probeResultValidator = v.object({
  checkedAt: v.number(),
  environment: v.literal('production'),
  providerReached: v.literal(true),
  orderIdMatched: v.literal(true),
  amountMatched: v.literal(true),
  currencyValidation: v.union(
    v.literal('provider_and_stored'),
    v.literal('stored_only_provider_omits_currency'),
  ),
  storedStatus: terminalStatusValidator,
  providerStatus: providerStatusValidator,
  providerStatusTerminal: v.boolean(),
  statusMatchesStored: v.boolean(),
});

function sdk(config: MmpayConfig) {
  return MMPaySDK({
    appId: config.appId,
    publishableKey: config.publishableKey,
    secretKey: config.secretKey,
    apiBaseUrl: config.apiBaseUrl,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseProviderStatus(value: unknown): ProviderStatus {
  if (value === 'PENDING'
    || value === 'SUCCESS'
    || value === 'FAILED'
    || value === 'REFUNDED'
    || value === 'CANCELLED'
    || value === 'EXPIRED') {
    return value;
  }
  throw new Error('Provider probe returned an invalid status');
}

function isTerminalStatus(status: ProviderStatus): status is TerminalStatus {
  return status !== 'PENDING';
}

/**
 * Validate the provider response without returning any provider identifier,
 * QR, checkout URL, customer detail, amount or credential-bearing value.
 */
export function parseReadOnlyProviderProbeResponse(value: unknown, target: ProbeTarget) {
  if (!isRecord(value) || typeof value.orderId !== 'string') {
    throw new Error('Provider probe request failed');
  }
  if (value.orderId !== target.orderId) {
    throw new Error('Provider probe returned a mismatched order ID');
  }
  if (typeof value.amount !== 'number'
    || !Number.isFinite(value.amount)
    || value.amount !== target.amount) {
    throw new Error('Provider probe returned a mismatched amount');
  }

  const providerReturnedCurrency = Object.prototype.hasOwnProperty.call(value, 'currency');
  if (providerReturnedCurrency && value.currency !== target.currency) {
    throw new Error('Provider probe returned a mismatched currency');
  }
  if (target.currency !== 'MMK') {
    throw new Error('Provider probe target currency is invalid');
  }

  const providerStatus = parseProviderStatus(value.status);
  return {
    environment: 'production' as const,
    providerReached: true as const,
    orderIdMatched: true as const,
    amountMatched: true as const,
    currencyValidation: providerReturnedCurrency
      ? 'provider_and_stored' as const
      : 'stored_only_provider_omits_currency' as const,
    storedStatus: target.storedStatus,
    providerStatus,
    providerStatusTerminal: isTerminalStatus(providerStatus),
    statusMatchesStored: providerStatus === target.storedStatus,
  };
}

/**
 * Operational probe for an already-existing terminal production payment.
 *
 * This internal action calls only the provider's status `get` operation. It has
 * no mutation/scheduler/log call and returns only sanitized invariant results.
 * It must never be replaced with `pay`, `cancel`, or a write-back refresh.
 */
export const probeTerminalProductionPayment = internalAction({
  args: { transactionId: v.id('mmpayTransactions') },
  returns: probeResultValidator,
  handler: async (ctx, { transactionId }) => {
    const config = readMmpayConfig();
    if (config.environment !== 'production') {
      throw new Error('Provider probe requires production Myan Myan Pay configuration');
    }
    const target: ProbeTarget = await ctx.runQuery(
      internal.mmpayReadinessData.providerProbeTarget,
      { transactionId },
    );
    const response = await sdk(config).get({
      orderId: target.orderId,
      nonce: crypto.randomUUID(),
    });
    return {
      checkedAt: Date.now(),
      ...parseReadOnlyProviderProbeResponse(response, target),
    };
  },
});
