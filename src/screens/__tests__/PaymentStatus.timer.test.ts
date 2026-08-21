import { describe, expect, it } from 'vitest';
import {
  formatPaymentCountdown,
  MMQR_VALIDITY_MS,
  paymentQrRemainingMs,
} from '../PaymentStatus';

describe('MyanMyanPay QR countdown', () => {
  it('uses a four-minute safety window and survives page reloads using the persisted creation time', () => {
    const createdAt = 1_000_000;
    expect(paymentQrRemainingMs(createdAt, createdAt)).toBe(MMQR_VALIDITY_MS);
    expect(paymentQrRemainingMs(createdAt, createdAt + 60_000)).toBe(3 * 60_000);
  });

  it('never displays a negative remaining time', () => {
    const createdAt = 1_000_000;
    expect(paymentQrRemainingMs(createdAt, createdAt + MMQR_VALIDITY_MS + 1)).toBe(0);
  });

  it('formats the countdown as stable tabular minutes and seconds', () => {
    expect(formatPaymentCountdown(4 * 60_000)).toBe('04:00');
    expect(formatPaymentCountdown(61_000)).toBe('01:01');
    expect(formatPaymentCountdown(1)).toBe('00:01');
    expect(formatPaymentCountdown(0)).toBe('00:00');
  });
});
