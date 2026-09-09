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

const probeFailureClassValidator = v.union(
  v.literal('live_access_not_enabled'),
  v.literal('ip_not_allowlisted'),
  v.literal('authentication_rejected'),
  v.literal('rate_limited'),
  v.literal('provider_unavailable'),
  v.literal('provider_rejected'),
  v.literal('transport_or_sdk_failure'),
  v.literal('malformed_response'),
);

const verifiedProbeResultValidator = v.object({
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

const blockedProbeResultValidator = v.object({
  checkedAt: v.number(),
  environment: v.literal('production'),
  providerReached: v.literal(false),
  failureClass: probeFailureClassValidator,
  structuredErrorReceived: v.boolean(),
  developmentStateSignal: v.union(
    v.literal('consistent'),
    v.literal('not_observed'),
  ),
});

const probeResultValidator = v.union(
  verifiedProbeResultValidator,
  blockedProbeResultValidator,
);

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

type ProbeFailureClass =
  | 'live_access_not_enabled'
  | 'ip_not_allowlisted'
  | 'authentication_rejected'
  | 'rate_limited'
  | 'provider_unavailable'
  | 'provider_rejected'
  | 'transport_or_sdk_failure'
  | 'malformed_response';

function boundedErrorTokens(value: Record<string, unknown>) {
  const tokens: string[] = [];
  const append = (candidate: unknown) => {
    if (typeof candidate === 'string' || typeof candidate === 'number') {
      tokens.push(String(candidate).slice(0, 300));
    }
  };
  for (const key of ['code', 'message', 'error', 'statusCode', 'status']) {
    const candidate = value[key];
    append(candidate);
    if (isRecord(candidate)) {
      append(candidate.code);
      append(candidate.message);
      append(candidate.statusCode);
    }
  }
  return tokens.join(' ').toLowerCase().slice(0, 1_200);
}

function classifyProviderFailure(value: unknown): {
  failureClass: ProbeFailureClass;
  structuredErrorReceived: boolean;
  developmentStateSignal: 'consistent' | 'not_observed';
} {
  if (value instanceof Error || !isRecord(value)) {
    return {
      failureClass: 'transport_or_sdk_failure',
      structuredErrorReceived: false,
      developmentStateSignal: 'not_observed',
    };
  }

  const tokens = boundedErrorTokens(value);
  let failureClass: ProbeFailureClass;
  if (tokens.includes('ka0002')
    || tokens.includes('api key not live')
    || tokens.includes("api key not 'live'")
    || tokens.includes('live access not enabled')
    || tokens.includes('development mode')) {
    failureClass = 'live_access_not_enabled';
  } else if (tokens.includes('ka0005') || tokens.includes('not whitelisted') || tokens.includes('allowlist')) {
    failureClass = 'ip_not_allowlisted';
  } else if (tokens.includes('ka0001')
    || tokens.includes('ka0003')
    || tokens.includes('signature')
    || tokens.includes('unauthorized')
    || tokens.includes('forbidden')
    || tokens.includes('bearer token')) {
    failureClass = 'authentication_rejected';
  } else if (tokens.includes('429') || tokens.includes('rate limit') || tokens.includes('ratelimit')) {
    failureClass = 'rate_limited';
  } else if (tokens.includes('ka0004')
    || /(^|\s)5\d\d(\s|$)/.test(tokens)
    || tokens.includes('internal server error')
    || tokens.includes('service unavailable')) {
    failureClass = 'provider_unavailable';
  } else if (tokens) {
    failureClass = 'provider_rejected';
  } else {
    failureClass = 'malformed_response';
  }

  return {
    failureClass,
    structuredErrorReceived: tokens.length > 0,
    developmentStateSignal: failureClass === 'live_access_not_enabled'
      ? 'consistent'
      : 'not_observed',
  };
}

/**
 * Normalize a rejected SDK call to a fixed local sentinel. The caught value is
 * deliberately neither logged nor returned, so transport libraries cannot
 * leak request headers, credentials, URLs or provider/customer identifiers.
 */
export async function safelyReadProviderPayment(
  request: () => Promise<unknown>,
): Promise<unknown> {
  try {
    return await request();
  } catch {
    return new Error('Provider SDK request rejected');
  }
}

/**
 * Validate the provider response without returning any provider identifier,
 * QR, checkout URL, customer detail, amount or credential-bearing value.
 */
export function parseReadOnlyProviderProbeResponse(value: unknown, target: ProbeTarget) {
  if (!isRecord(value) || typeof value.orderId !== 'string') {
    return {
      environment: 'production' as const,
      providerReached: false as const,
      ...classifyProviderFailure(value),
    };
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
    const response = await safelyReadProviderPayment(
      () => sdk(config).get({
        orderId: target.orderId,
        nonce: crypto.randomUUID(),
      }),
    );
    return {
      checkedAt: Date.now(),
      ...parseReadOnlyProviderProbeResponse(response, target),
    };
  },
});
