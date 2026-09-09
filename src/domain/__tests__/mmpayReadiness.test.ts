import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  parseReadOnlyProviderProbeResponse,
  safelyReadProviderPayment,
} from '../../../convex/mmpayReadiness';

const target = {
  orderId: 'ACG-EXISTING-TERMINAL',
  amount: 5_900,
  currency: 'MMK' as const,
  storedStatus: 'SUCCESS' as const,
};

describe('read-only Myan Myan Pay production probe', () => {
  it('returns only sanitized invariant evidence for a matching response', () => {
    const result = parseReadOnlyProviderProbeResponse({
      orderId: target.orderId,
      amount: target.amount,
      currency: 'MMK',
      status: 'SUCCESS',
      appId: 'must-not-leave-parser',
      qr: 'must-not-leave-parser',
      url: 'https://must-not-leave-parser.example',
      vendor: 'must-not-leave-parser',
      transactionRefId: 'must-not-leave-parser',
    }, target);

    expect(result).toEqual({
      environment: 'production',
      providerReached: true,
      orderIdMatched: true,
      amountMatched: true,
      currencyValidation: 'provider_and_stored',
      storedStatus: 'SUCCESS',
      providerStatus: 'SUCCESS',
      providerStatusTerminal: true,
      statusMatchesStored: true,
    });
    for (const sensitiveField of [
      'orderId',
      'amount',
      'currency',
      'appId',
      'qr',
      'url',
      'vendor',
      'transactionRefId',
    ]) {
      expect(result).not.toHaveProperty(sensitiveField);
    }
  });

  it('reports the SDK get contract when currency is omitted without inventing provider proof', () => {
    const result = parseReadOnlyProviderProbeResponse({
      orderId: target.orderId,
      amount: target.amount,
      status: 'SUCCESS',
    }, target);
    expect(result.currencyValidation).toBe('stored_only_provider_omits_currency');
  });

  it('classifies an inactive LIVE provider error without returning its raw payload', () => {
    const result = parseReadOnlyProviderProbeResponse({
      code: 'KA0002',
      message: "API Key Not 'LIVE' for merchant MM-sensitive",
      secret: 'sk_live_must-never-leave-parser',
      customer: 'must-never-leave-parser',
    }, target);

    expect(result).toEqual({
      environment: 'production',
      providerReached: false,
      failureClass: 'live_access_not_enabled',
      structuredErrorReceived: true,
      developmentStateSignal: 'consistent',
    });
    expect(JSON.stringify(result)).not.toContain('MM-sensitive');
    expect(JSON.stringify(result)).not.toContain('sk_live_');
    expect(JSON.stringify(result)).not.toContain('customer');
  });

  it.each([
    [{ error: 'IP not whitelisted' }, 'ip_not_allowlisted', true],
    [{ code: 'KA0003', message: 'Signature mismatch' }, 'authentication_rejected', true],
    [{ statusCode: 429 }, 'rate_limited', true],
    [{ statusCode: 503 }, 'provider_unavailable', true],
    [{ message: 'Provider rejected request' }, 'provider_rejected', true],
    [{ unexpected: true }, 'malformed_response', false],
    [new Error('network detail must not leave parser'), 'transport_or_sdk_failure', false],
  ] as const)('sanitizes provider failure shape as %s', (value, failureClass, structuredErrorReceived) => {
    const result = parseReadOnlyProviderProbeResponse(value, target);
    expect(result).toMatchObject({
      environment: 'production',
      providerReached: false,
      failureClass,
      structuredErrorReceived,
      developmentStateSignal: 'not_observed',
    });
    expect(JSON.stringify(result)).not.toContain('network detail');
    expect(JSON.stringify(result)).not.toContain('Provider rejected request');
  });

  it('catches a rejected SDK get without returning the rejected value', async () => {
    const response = await safelyReadProviderPayment(async () => {
      throw new Error('secret=sk_live_never-return; order=customer-sensitive');
    });
    const result = parseReadOnlyProviderProbeResponse(response, target);

    expect(result).toEqual({
      environment: 'production',
      providerReached: false,
      failureClass: 'transport_or_sdk_failure',
      structuredErrorReceived: false,
      developmentStateSignal: 'not_observed',
    });
    expect(JSON.stringify(result)).not.toContain('sk_live_');
    expect(JSON.stringify(result)).not.toContain('customer-sensitive');
  });

  it('rejects mismatched identifiers, amounts, currencies, and invalid statuses', () => {
    expect(() => parseReadOnlyProviderProbeResponse({
      orderId: 'ACG-OTHER', amount: target.amount, status: 'SUCCESS',
    }, target)).toThrow('mismatched order ID');
    expect(() => parseReadOnlyProviderProbeResponse({
      orderId: target.orderId, amount: target.amount + 1, status: 'SUCCESS',
    }, target)).toThrow('mismatched amount');
    expect(() => parseReadOnlyProviderProbeResponse({
      orderId: target.orderId, amount: target.amount, currency: 'USD', status: 'SUCCESS',
    }, target)).toThrow('mismatched currency');
    expect(() => parseReadOnlyProviderProbeResponse({
      orderId: target.orderId, amount: target.amount, status: 'UNKNOWN',
    }, target)).toThrow('invalid status');
  });

  it('reports terminal-state drift without writing it back', () => {
    const result = parseReadOnlyProviderProbeResponse({
      orderId: target.orderId,
      amount: target.amount,
      status: 'REFUNDED',
    }, target);
    expect(result.providerStatusTerminal).toBe(true);
    expect(result.statusMatchesStored).toBe(false);
  });

  it('fails the terminal readiness signal when the provider reports pending', () => {
    const result = parseReadOnlyProviderProbeResponse({
      orderId: target.orderId,
      amount: target.amount,
      status: 'PENDING',
    }, target);
    expect(result.providerStatusTerminal).toBe(false);
    expect(result.statusMatchesStored).toBe(false);
  });

  it('keeps the provider action internal and free of payment or database writes', () => {
    const source = readFileSync('convex/mmpayReadiness.ts', 'utf8');
    const action = source.slice(source.indexOf('export const probeTerminalProductionPayment'));
    expect(action).toContain('internalAction({');
    expect(action).toContain('safelyReadProviderPayment(');
    expect(action).toContain('() => sdk(config).get({');
    expect(action).not.toContain('runMutation');
    expect(action).not.toContain('.pay(');
    expect(action).not.toContain('.cancel(');
    expect(action).not.toContain('scheduler.');
  });
});

describe('owner webhook evidence query', () => {
  it('is owner-only, indexed, bounded, and omits sensitive event fields', () => {
    const source = readFileSync('convex/mmpayReadinessData.ts', 'utf8');
    const query = source.slice(source.indexOf('export const productionWebhookEvidence'));
    expect(query).toContain('await requireOwner(ctx)');
    expect(query).toContain(".withIndex('by_order_id'");
    expect(query).toContain('.take(MAX_WEBHOOK_EVENTS + 1)');
    expect(query).not.toContain('.collect()');
    expect(query).not.toContain('nonceHash:');
    expect(query).not.toContain('orderId: payment.orderId');
    expect(query).not.toContain('userId: payment.userId');
    expect(query).not.toContain('qrPayload:');
    expect(query).not.toContain('transactionRefId:');
  });
});
