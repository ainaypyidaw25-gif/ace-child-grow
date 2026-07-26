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
};

export async function resolveEntitlements(ctx: Ctx, userId: Id<'users'>): Promise<Entitlements> {
  let row = await ctx.db
    .query('subscriptions')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .unique();
  let inheritedFamilyAccess = false;
  if (!row || row.planKey === 'free' || row.status === 'canceled') {
    const caregiverRows = await ctx.db
      .query('familyCaregivers')
      .withIndex('by_caregiver_user', (q) => q.eq('caregiverUserId', userId))
      .take(5);
    const activeMembership = caregiverRows.find((membership) => membership.status === 'active');
    if (activeMembership) {
      const ownerSubscription = await ctx.db
        .query('subscriptions')
        .withIndex('by_user', (q) => q.eq('userId', activeMembership.ownerId))
        .unique();
      if (ownerSubscription?.planKey === 'family') {
        row = ownerSubscription;
        inheritedFamilyAccess = true;
      }
    }
  }
  const enabled = Boolean(row && (row.status === 'active' || row.status === 'trialing'));
  const planKey: PlanKey = enabled ? row!.planKey : 'free';
  const end = row?.currentPeriodEnd ?? null;
  return {
    planKey,
    status: row?.status ?? 'active',
    features: FEATURES[planKey],
    currentPeriodEnd: end,
    cancelAtPeriodEnd: row?.cancelAtPeriodEnd ?? false,
    isTrial: enabled && row?.status === 'trialing',
    trialEligible: !row?.trialUsedAt && row?.providerSubscriptionId === undefined && row?.provider !== 'manual',
    daysRemaining: null,
    inheritedFamilyAccess,
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
  return entitlements.planKey === 'family' && !entitlements.inheritedFamilyAccess ? 3 : 1;
}
