export type BillingInterval = 'week' | 'month' | 'year';

const DAY_MS = 86_400_000;

export function billingPeriodMs(interval: BillingInterval): number {
  if (interval === 'week') return 7 * DAY_MS;
  if (interval === 'year') return 365 * DAY_MS;
  return 30 * DAY_MS;
}

