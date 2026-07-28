import type { MutationCtx, QueryCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';

export const FEATURES = {
  free: ['child_profile', 'milestones', 'activities', 'growth', 'sleep', 'learning_library'],
  premium: [
    'child_profile',
    'milestones',
    'activities',
    'growth',
    'sleep',
    'learning_library',
    'personalized_plan',
    'activity_history',
    'advanced_reports',
    'appointments',
    'premium_media',
    'offline_downloads',
  ],
  family: [
    'child_profile',
    'milestones',
    'activities',
    'growth',
    'sleep',
    'learning_library',
    'personalized_plan',
    'activity_history',
    'advanced_reports',
    'appointments',
    'premium_media',
    'offline_downloads',
    'family_profiles',
  ],
} as const;

export type PlanKey = keyof typeof FEATURES;
export type Feature = (typeof FEATURES)[PlanKey][number];
type Ctx = QueryCtx | MutationCtx;
type SubscriptionRow = {
  planKey: PlanKey;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused';
  currentPeriodEnd?: number;
};
type FamilyMembershipRow = {
  status: 'pending' | 'active' | 'revoked';
};

export type Entitlements = {
  planKey: PlanKey;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused';
  features: readonly string[];
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  isTrial: boolean;
  trialEligible: boolean;
  daysRemaining: number | null;
  inheritedFamilyAccess: boolean;
  testingAccess: boolean;
};

export function testingAccessIsEnabled(): boolean {
  return process.env.APP_ACCESS_MODE?.trim().toLowerCase() === 'testing';
}

export function subscriptionIsEnabled(
  row: SubscriptionRow | null | undefined,
  now = Date.now(),
): row is SubscriptionRow {
  return Boolean(
    row
    && (row.status === 'active' || row.status === 'trialing')
    && (row.currentPeriodEnd === undefined || row.currentPeriodEnd > now),
  );
}

export function membershipCanInheritFamilyAccess(
  membership: FamilyMembershipRow,
  ownerSubscription: SubscriptionRow | null | undefined,
  now = Date.now(),
): boolean {
  return membership.status === 'active'
    && ownerSubscription?.planKey === 'family'
    && subscriptionIsEnabled(ownerSubscription, now);
}

export async function activeFamilyOwnerIds(
  ctx: Ctx,
  caregiverUserId: Id<'users'>,
  now = Date.now(),
): Promise<Id<'users'>[]> {
  const memberships = await ctx.db
    .query('familyCaregivers')
    .withIndex('by_caregiver_user', (q) => q.eq('caregiverUserId', caregiverUserId))
    .take(5);
  const activeMemberships = memberships.filter((membership) => membership.status === 'active');
  const owners = await Promise.all(activeMemberships.map(async (membership) => {
    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', membership.ownerId))
      .unique();
    return membershipCanInheritFamilyAccess(membership, subscription, now)
      ? membership.ownerId
      : null;
  }));
  return owners.filter((ownerId): ownerId is Id<'users'> => ownerId !== null);
}

export async function resolveEntitlements(ctx: Ctx, userId: Id<'users'>): Promise<Entitlements> {
  const now = Date.now();
  const directRow = await ctx.db
    .query('subscriptions')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .unique();
  let row = directRow;
  let inheritedFamilyAccess = false;
  if (!subscriptionIsEnabled(directRow, now) || directRow.planKey === 'free') {
    const [ownerId] = await activeFamilyOwnerIds(ctx, userId, now);
    if (ownerId) {
      const ownerSubscription = await ctx.db
        .query('subscriptions')
        .withIndex('by_user', (q) => q.eq('userId', ownerId))
        .unique();
      if (ownerSubscription?.planKey === 'family' && subscriptionIsEnabled(ownerSubscription, now)) {
        row = ownerSubscription;
        inheritedFamilyAccess = true;
      }
    }
  }
  const testingAccess = testingAccessIsEnabled();
  const enabled = subscriptionIsEnabled(row, now);
  const planKey: PlanKey = enabled ? row!.planKey : 'free';
  const end = row?.currentPeriodEnd ?? null;
  return {
    planKey,
    status: row && !enabled ? 'canceled' : (row?.status ?? 'active'),
    features: testingAccess ? FEATURES.family : FEATURES[planKey],
    currentPeriodEnd: end,
    cancelAtPeriodEnd: row?.cancelAtPeriodEnd ?? false,
    isTrial: enabled && row?.status === 'trialing',
    trialEligible: !testingAccess
      &&
      !directRow?.trialUsedAt
      && directRow?.providerSubscriptionId === undefined
      && directRow?.provider !== 'manual',
    daysRemaining: enabled && end !== null ? Math.max(0, Math.ceil((end - now) / 86_400_000)) : null,
    inheritedFamilyAccess,
    testingAccess,
  };
}

export async function requireFeature(ctx: Ctx, userId: Id<'users'>, feature: Feature): Promise<Entitlements> {
  const entitlements = await resolveEntitlements(ctx, userId);
  if (!entitlements.features.includes(feature)) {
    throw new Error('Premium plan required');
  }
  return entitlements;
}

export async function childLimit(ctx: Ctx, userId: Id<'users'>): Promise<number> {
  const entitlements = await resolveEntitlements(ctx, userId);
  return (entitlements.testingAccess || (entitlements.planKey === 'family' && !entitlements.inheritedFamilyAccess)) ? 3 : 1;
}
