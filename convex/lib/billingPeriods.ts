export type BillingInterval = 'month' | 'year';

const DAY_MS = 86_400_000;

export function billingPeriodMs(interval: BillingInterval): number {
  if (interval === 'year') return 365 * DAY_MS;
  return 30 * DAY_MS;
}

type ExistingAccess = {
  planKey: string;
  status: string;
  currentPeriodEnd?: number;
} | null | undefined;

export function paidAccessPeriodEnd(
  purchasedAt: number,
  interval: BillingInterval,
  purchasedPlanKey: string,
  existing: ExistingAccess,
): number {
  const canExtend = existing
    && existing.planKey === purchasedPlanKey
    && (existing.status === 'active' || existing.status === 'trialing')
    && existing.currentPeriodEnd !== undefined
    && existing.currentPeriodEnd > purchasedAt;
  const startsAt = canExtend ? existing.currentPeriodEnd! : purchasedAt;
  return startsAt + billingPeriodMs(interval);
}
