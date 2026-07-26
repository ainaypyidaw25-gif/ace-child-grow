"use node";

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { getAuthUserId } from '@convex-dev/auth/server';
import { MMPaySDK } from 'mmpay-node-sdk';
import { v } from 'convex/values';
import { action, internalAction } from './_generated/server';
import { internal } from './_generated/api';

type Environment = 'sandbox' | 'production';
type ProviderStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CANCELLED' | 'EXPIRED';
type PaymentMethod = 'QR' | 'PIN' | 'PWA' | 'CARD';
type Condition = 'PRISTINE' | 'TOUCHED' | 'DIRTY' | 'EXPIRED';
type PaymentResult = {
  orderId: string;
  amount: number;
  currency: 'MMK';
  status: ProviderStatus;
  qrPayload?: string;
  checkoutUrl?: string;
  vendorQrRefId?: string;
  transactionRefId?: string;
};
type OwnedPayment = {
  userId: string;
  orderId: string;
  amount: number;
  status: 'INITIATING' | ProviderStatus;
};

const providerStatusValidator = v.union(
  v.literal('PENDING'),
  v.literal('SUCCESS'),
  v.literal('FAILED'),
  v.literal('REFUNDED'),
  v.literal('CANCELLED'),
  v.literal('EXPIRED'),
);
const methodValidator = v.union(v.literal('QR'), v.literal('PIN'), v.literal('PWA'), v.literal('CARD'));
const conditionValidator = v.union(v.literal('PRISTINE'), v.literal('TOUCHED'), v.literal('DIRTY'), v.literal('EXPIRED'));
const paymentResultValidator = v.object({
  orderId: v.string(),
  amount: v.number(),
  currency: v.literal('MMK'),
  status: providerStatusValidator,
  qrPayload: v.optional(v.string()),
  checkoutUrl: v.optional(v.string()),
  vendorQrRefId: v.optional(v.string()),
  transactionRefId: v.optional(v.string()),
});

type Config = {
  environment: Environment;
  appId: string;
  publishableKey: string;
  secretKey: string;
  apiBaseUrl: string;
  webhookUrl: string;
};

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Myan Myan Pay is not configured: missing ${name}`);
  return value;
}

function getConfig(): Config {
  const environment = (process.env.MMPAY_ENV?.trim().toLowerCase() || 'sandbox') as Environment;
  if (environment !== 'sandbox' && environment !== 'production') throw new Error('MMPAY_ENV must be sandbox or production');
  const prefix = environment === 'sandbox' ? 'MMPAY_SANDBOX' : 'MMPAY_PRODUCTION';
  const config = {
    environment,
    appId: required(`${prefix}_APP_ID`),
    publishableKey: required(`${prefix}_PUBLISHABLE_KEY`),
    secretKey: required(`${prefix}_SECRET_KEY`),
    apiBaseUrl: required(`${prefix}_API_BASE_URL`).replace(/\/$/, ''),
    webhookUrl: required('MMPAY_WEBHOOK_URL'),
  };
  if (!/^https:\/\//i.test(config.apiBaseUrl)) throw new Error(`${prefix}_API_BASE_URL must use HTTPS`);
  if (!/^https:\/\//i.test(config.webhookUrl)) throw new Error('MMPAY_WEBHOOK_URL must use HTTPS');
  const looksSandbox = config.publishableKey.includes('_test_') || config.secretKey.includes('_test_');
  if (environment === 'sandbox' && !looksSandbox) throw new Error('Sandbox mode requires Myan Myan Pay test keys');
  if (environment === 'production' && looksSandbox) throw new Error('Production mode cannot use Myan Myan Pay test keys');
  return config;
}

function sdk(config: Config) {
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

function optionalString(value: unknown, maxLength = 500) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, maxLength) : undefined;
}

function optionalHttpsUrl(value: unknown) {
  const candidate = optionalString(value, 2_048);
  if (!candidate) return undefined;
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function parseStatus(value: unknown): ProviderStatus {
  if (value === 'PENDING' || value === 'SUCCESS' || value === 'FAILED' || value === 'REFUNDED' || value === 'CANCELLED' || value === 'EXPIRED') return value;
  throw new Error('Myan Myan Pay returned an invalid payment status');
}

function parseMethod(value: unknown): PaymentMethod | undefined {
  return value === 'QR' || value === 'PIN' || value === 'PWA' || value === 'CARD' ? value : undefined;
}

function parseCondition(value: unknown): Condition | undefined {
  if (value === 'PRESTINE') return 'PRISTINE';
  return value === 'PRISTINE' || value === 'TOUCHED' || value === 'DIRTY' || value === 'EXPIRED' ? value : undefined;
}

function providerError(value: unknown) {
  if (value instanceof Error) return value.message.slice(0, 300);
  if (isRecord(value)) {
    const code = optionalString(value.code);
    const message = optionalString(value.message) ?? optionalString(value.error);
    if (code || message) return [code, message].filter(Boolean).join(': ').slice(0, 300);
  }
  return 'Myan Myan Pay request failed';
}

function parseResponse(value: unknown, expectedOrderId: string, fallbackAmount: number) {
  if (!isRecord(value)) throw new Error('Myan Myan Pay returned an invalid response');
  if (typeof value.orderId !== 'string') throw new Error(providerError(value));
  if (value.orderId !== expectedOrderId) throw new Error('Myan Myan Pay returned a mismatched order ID');
  const amount = typeof value.amount === 'number' ? value.amount : fallbackAmount;
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Myan Myan Pay returned an invalid amount');
  return {
    orderId: value.orderId,
    amount,
    currency: 'MMK' as const,
    status: parseStatus(value.status),
    condition: parseCondition(value.condition),
    qrPayload: optionalString(value.qr, 8_192),
    checkoutUrl: optionalHttpsUrl(value.url),
    vendor: optionalString(value.vendor),
    method: parseMethod(value.method),
    vendorQrRefId: optionalString(value.vendorQrRefId),
    transactionRefId: optionalString(value.transactionRefId),
  };
}

export const startPayment = action({
  args: { planId: v.id('subscriptionPlans') },
  returns: paymentResultValidator,
  handler: async (ctx, { planId }): Promise<PaymentResult> => {
    if (!(await getAuthUserId(ctx))) throw new Error('Not authenticated');
    const config = getConfig();
    const plan = await ctx.runQuery(internal.mmpayData.checkoutContext, { planId });
    const orderId = `ACG-${Date.now()}-${crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`;
    await ctx.runMutation(internal.mmpayData.reserve, {
      userId: plan.userId,
      planKey: plan.planKey,
      planId: plan.planId,
      planInterval: plan.planInterval,
      environment: config.environment,
      orderId,
      amount: plan.amount,
    });
    try {
      const response = await sdk(config).pay({
        orderId,
        amount: plan.amount,
        currency: 'MMK',
        callbackUrl: config.webhookUrl,
        customMessage: `ACE Child Grow ${plan.nameEn}`.slice(0, 150),
        items: [{ name: plan.nameEn, amount: plan.amount, quantity: 1 }],
      });
      const parsed = parseResponse(response, orderId, plan.amount);
      await ctx.runMutation(internal.mmpayData.applyProviderUpdate, parsed);
      return parsed;
    } catch (error) {
      const reason = providerError(error);
      await ctx.runMutation(internal.mmpayData.markInitiationFailed, { orderId, reason });
      throw new Error(reason);
    }
  },
});

export const refreshPayment = action({
  args: { orderId: v.string() },
  returns: paymentResultValidator,
  handler: async (ctx, { orderId }): Promise<PaymentResult> => {
    if (!(await getAuthUserId(ctx))) throw new Error('Not authenticated');
    const payment: OwnedPayment = await ctx.runQuery(internal.mmpayData.ownedOrder, { orderId });
    if (payment.status === 'SUCCESS' || payment.status === 'FAILED' || payment.status === 'REFUNDED' || payment.status === 'CANCELLED' || payment.status === 'EXPIRED') {
      return {
        orderId: payment.orderId,
        amount: payment.amount,
        currency: 'MMK' as const,
        status: payment.status,
      };
    }
    const config = getConfig();
    const response = await sdk(config).get({ orderId, nonce: crypto.randomUUID() });
    const parsed = parseResponse(response, orderId, payment.amount);
    await ctx.runMutation(internal.mmpayData.applyProviderUpdate, parsed);
    return parsed;
  },
});

export const cancelPayment = action({
  args: { orderId: v.string() },
  returns: paymentResultValidator,
  handler: async (ctx, { orderId }): Promise<PaymentResult> => {
    if (!(await getAuthUserId(ctx))) throw new Error('Not authenticated');
    const payment: OwnedPayment = await ctx.runQuery(internal.mmpayData.ownedOrder, { orderId });
    if (payment.status !== 'INITIATING' && payment.status !== 'PENDING') throw new Error('Only a pending payment can be canceled');
    const config = getConfig();
    const response = await sdk(config).cancel({ orderId, nonce: crypto.randomUUID() });
    const parsed = parseResponse(response, orderId, payment.amount);
    await ctx.runMutation(internal.mmpayData.applyProviderUpdate, parsed);
    return parsed;
  },
});

export const verifyWebhook = internalAction({
  args: { rawBody: v.string(), nonce: v.string(), signature: v.string() },
  returns: v.object({
    nonceHash: v.string(),
    orderId: v.string(),
    amount: v.number(),
    currency: v.literal('MMK'),
    status: providerStatusValidator,
    condition: v.optional(conditionValidator),
    vendor: v.optional(v.string()),
    method: v.optional(methodValidator),
    vendorQrRefId: v.optional(v.string()),
    transactionRefId: v.optional(v.string()),
  }),
  handler: async (_ctx, args) => {
    const config = getConfig();
    const expected = createHmac('sha256', config.secretKey)
      .update(`${args.nonce}.${args.rawBody}`)
      .digest('hex');
    const supplied = args.signature.trim().toLowerCase();
    const expectedBuffer = Buffer.from(expected, 'hex');
    const suppliedBuffer = /^[a-f0-9]+$/i.test(supplied) ? Buffer.from(supplied, 'hex') : Buffer.alloc(0);
    if (expectedBuffer.length !== suppliedBuffer.length || !timingSafeEqual(expectedBuffer, suppliedBuffer)) {
      throw new Error('Invalid Myan Myan Pay webhook signature');
    }
    let payload: unknown;
    try {
      payload = JSON.parse(args.rawBody);
    } catch {
      throw new Error('Invalid Myan Myan Pay webhook JSON');
    }
    if (!isRecord(payload) || typeof payload.orderId !== 'string' || typeof payload.amount !== 'number' || payload.currency !== 'MMK') {
      throw new Error('Invalid Myan Myan Pay webhook payload');
    }
    return {
      nonceHash: createHash('sha256').update(args.nonce).digest('hex'),
      orderId: payload.orderId,
      amount: payload.amount,
      currency: 'MMK' as const,
      status: parseStatus(payload.status),
      condition: parseCondition(payload.condition),
      vendor: optionalString(payload.vendor),
      method: parseMethod(payload.method),
      vendorQrRefId: optionalString(payload.vendorQrRefId),
      transactionRefId: optionalString(payload.transactionRefId),
    };
  },
});
