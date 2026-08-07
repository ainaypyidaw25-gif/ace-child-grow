import { describe, expect, it } from 'vitest';
import {
  allowedPaymentStatusTargets,
  paymentBaseAmount,
  paymentExportAvailable,
  paymentStatusNeedsConfirmation,
} from '../ReviewerPaymentPanel';

describe('reviewer payment UI permissions', () => {
  it('does not expose approval or paid actions to a review manager', () => {
    expect(allowedPaymentStatusTargets('ready_for_review', false)).toEqual(['disputed']);
    expect(allowedPaymentStatusTargets('approved_for_payment', false)).toEqual(['disputed']);
    expect(allowedPaymentStatusTargets('disputed', false)).toEqual(['ready_for_review']);
  });

  it('allows payment authorities to approve and then record payment', () => {
    expect(allowedPaymentStatusTargets('ready_for_review', true)).toEqual(['approved_for_payment', 'disputed']);
    expect(allowedPaymentStatusTargets('approved_for_payment', true)).toEqual(['paid', 'disputed']);
  });

  it('does not offer transitions for a paid batch', () => {
    expect(allowedPaymentStatusTargets('paid', true)).toEqual([]);
    expect(allowedPaymentStatusTargets('paid', false)).toEqual([]);
  });

  it('requires a separate confirmation for approval and payment completion', () => {
    expect(paymentStatusNeedsConfirmation('approved_for_payment')).toBe(true);
    expect(paymentStatusNeedsConfirmation('paid')).toBe(true);
    expect(paymentStatusNeedsConfirmation('disputed')).toBe(false);
    expect(paymentStatusNeedsConfirmation('ready_for_review')).toBe(false);
  });

  it('shows the base amount for per-item and package rates without hiding the formula', () => {
    expect(paymentBaseAmount({ rateBasis: 'per_item', agreedRateMmk: 5_000, assignedItemCount: 6 })).toBe(30_000);
    expect(paymentBaseAmount({ rateBasis: 'package', agreedRateMmk: 45_000, assignedItemCount: 6 })).toBe(45_000);
  });

  it('allows exports only when the complete non-empty result is loaded', () => {
    expect(paymentExportAvailable(undefined)).toBe(false);
    expect(paymentExportAvailable({ batches: [], hasMore: false })).toBe(false);
    expect(paymentExportAvailable({ batches: [{}], hasMore: true })).toBe(false);
    expect(paymentExportAvailable({ batches: [{}], hasMore: false })).toBe(true);
  });
});
