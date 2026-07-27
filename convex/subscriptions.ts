import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
import { requireOwner, requireUser } from './lib/auth';
import { logAudit } from './audit';
import { resolveEntitlements } from './lib/entitlements';

const planValidator = v.union(v.literal('free'), v.literal('premium'), v.literal('family'));
const statusValidator = v.union(
  v.literal('active'),
  v.literal('trialing'),
  v.literal('past_due'),
  v.literal('canceled'),
  v.literal('paused'),
);

type TrialState = {
  trialUsedAt?: number;
  providerSubscriptionId?: string;
  provider?: string;
  planKey: 'free' | 'premium' | 'family';
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused';
};

export function trialIsAvailable(existing: TrialState | null | undefined): boolean {
  return !(
    existing?.trialUsedAt
    || existing?.providerSubscriptionId
    || existing?.provider === 'manual'
    || existing?.planKey === 'family'
    || (existing?.planKey === 'premium' && existing.status === 'active')
  );
}

export const mine = query({
  args: {},
  returns: v.object({
    planKey: planValidator,
    status: statusValidator,
    features: v.array(v.string()),
    currentPeriodEnd: v.union(v.number(), v.null()),
    cancelAtPeriodEnd: v.boolean(),
    isTrial: v.boolean(),
    trialEligible: v.boolean(),
    daysRemaining: v.union(v.number(), v.null()),
    inheritedFamilyAccess: v.boolean(),
  }),
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const entitlements = await resolveEntitlements(ctx, userId);
    return { ...entitlements, features: [...entitlements.features] };
  },
});

export const ensureFree = mutation({
  args: {},
  returns: v.object({ created: v.boolean() }),
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();
    if (existing) return { created: false };
    const now = Date.now();
    await ctx.db.insert('subscriptions', { userId, planKey: 'free', status: 'active', createdAt: now, updatedAt: now });
    return { created: true };
  },
});

export const startTrial = mutation({
  args: {},
  returns: v.object({
    started: v.boolean(),
    currentPeriodEnd: v.number(),
  }),
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();
    if (!trialIsAvailable(existing)) {
      throw new Error('Free trial is not available for this account');
    }
    const now = Date.now();
    const currentPeriodEnd = now + 7 * 86_400_000;
    const patch = {
      planKey: 'premium' as const,
      status: 'trialing' as const,
      provider: 'trial',
      currentPeriodEnd,
      cancelAtPeriodEnd: true,
      trialStartedAt: now,
      trialUsedAt: now,
      updatedAt: now,
    };
    if (existing) {
      await ctx.db.patch(existing._id, patch);
    } else {
      await ctx.db.insert('subscriptions', { userId, ...patch, createdAt: now });
    }
    return { started: true, currentPeriodEnd };
  },
});

export const cancelAtPeriodEnd = mutation({
  args: {},
  returns: v.object({ canceled: v.boolean() }),
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();
    if (!existing || existing.planKey === 'free') return { canceled: false };
    await ctx.db.patch(existing._id, { cancelAtPeriodEnd: true, updatedAt: Date.now() });
    return { canceled: true };
  },
});

export const grantPlan = mutation({
  args: { userId: v.id('users'), planKey: planValidator },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx);
    const existing = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .unique();
    const now = Date.now();
    const subscriptionId = existing?._id ?? await ctx.db.insert('subscriptions', {
      userId: args.userId,
      planKey: args.planKey,
      status: 'active',
      provider: 'manual',
      createdAt: now,
      updatedAt: now,
    });
    if (existing) await ctx.db.patch(existing._id, { planKey: args.planKey, status: 'active', provider: 'manual', updatedAt: now });
    await logAudit(ctx, ownerId, 'subscription.grant', 'subscriptions', subscriptionId, `${args.userId} · ${args.planKey}`);
    return { ok: true };
  },
});

// Future Stripe/webhook integration calls this internal mutation. No public
// client can forge provider subscription state.
export const syncProviderSubscription = internalMutation({
  args: {
    userId: v.id('users'),
    planKey: planValidator,
    status: statusValidator,
    provider: v.string(),
    providerCustomerId: v.optional(v.string()),
    providerSubscriptionId: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .unique();
    const now = Date.now();
    const patch = { ...args, updatedAt: now };
    const subscriptionId = existing?._id ?? await ctx.db.insert('subscriptions', { ...patch, createdAt: now });
    if (existing) await ctx.db.patch(existing._id, patch);
    await logAudit(ctx, null, 'subscription.provider_sync', 'subscriptions', subscriptionId, `${args.provider} · ${args.planKey} · ${args.status}`);
    return null;
  },
});

export const expireDueSubscriptions = internalMutation({
  args: {},
  returns: v.object({ expired: v.number() }),
  handler: async (ctx) => {
    const now = Date.now();
    const groups = await Promise.all(
      (['active', 'trialing'] as const).map((status) => ctx.db
        .query('subscriptions')
        .withIndex('by_status_period_end', (q) => q.eq('status', status).lt('currentPeriodEnd', now))
        .take(200)),
    );
    let expired = 0;
    for (const row of groups.flat()) {
      if (!row.currentPeriodEnd) continue;
      await ctx.db.patch(row._id, {
        status: 'canceled',
        planKey: 'free',
        cancelAtPeriodEnd: false,
        updatedAt: now,
      });
      expired += 1;
    }
    return { expired };
  },
});
