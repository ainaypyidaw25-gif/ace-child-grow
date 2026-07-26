import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
import { requireOwner, requireUser } from './lib/auth';
import { logAudit } from './audit';

const planValidator = v.union(v.literal('free'), v.literal('premium'), v.literal('family'));
const statusValidator = v.union(
  v.literal('active'),
  v.literal('trialing'),
  v.literal('past_due'),
  v.literal('canceled'),
  v.literal('paused'),
);

const FEATURES = {
  free: ['child_profile', 'milestones', 'activities', 'growth', 'sleep', 'learning_library'],
  premium: ['child_profile', 'milestones', 'activities', 'growth', 'sleep', 'learning_library', 'advanced_reports', 'offline_downloads'],
  family: ['child_profile', 'milestones', 'activities', 'growth', 'sleep', 'learning_library', 'advanced_reports', 'offline_downloads', 'family_profiles'],
} as const;

export const mine = query({
  args: {},
  returns: v.object({
    planKey: planValidator,
    status: statusValidator,
    features: v.array(v.string()),
    currentPeriodEnd: v.union(v.number(), v.null()),
    cancelAtPeriodEnd: v.boolean(),
  }),
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const row = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();
    const planKey = row?.planKey ?? 'free';
    return {
      planKey,
      status: row?.status ?? 'active',
      features: [...FEATURES[planKey]],
      currentPeriodEnd: row?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: row?.cancelAtPeriodEnd ?? false,
    };
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
