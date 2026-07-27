import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireUser } from './lib/auth';
import { requireFeature } from './lib/entitlements';

const caregiverValidator = v.object({
  _id: v.id('familyCaregivers'),
  _creationTime: v.number(),
  caregiverEmail: v.string(),
  displayName: v.union(v.string(), v.null()),
  status: v.union(v.literal('pending'), v.literal('active'), v.literal('revoked')),
  invitedAt: v.number(),
  acceptedAt: v.union(v.number(), v.null()),
});

export const listCaregivers = query({
  args: {},
  returns: v.array(caregiverValidator),
  handler: async (ctx) => {
    const ownerId = await requireUser(ctx);
    await requireFeature(ctx, ownerId, 'family_profiles');
    const ownSubscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', ownerId))
      .unique();
    if (ownSubscription?.planKey !== 'family') return [];
    const rows = await ctx.db
      .query('familyCaregivers')
      .withIndex('by_owner', (q) => q.eq('ownerId', ownerId))
      .order('desc')
      .take(20);
    return rows.map((row) => ({
      _id: row._id,
      _creationTime: row._creationTime,
      caregiverEmail: row.caregiverEmail,
      displayName: row.displayName ?? null,
      status: row.status,
      invitedAt: row.invitedAt,
      acceptedAt: row.acceptedAt ?? null,
    }));
  },
});

export const inviteCaregiver = mutation({
  args: {
    caregiverEmail: v.string(),
    displayName: v.optional(v.string()),
  },
  returns: v.id('familyCaregivers'),
  handler: async (ctx, args) => {
    const ownerId = await requireUser(ctx);
    await requireFeature(ctx, ownerId, 'family_profiles');
    const ownSubscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', ownerId))
      .unique();
    if (ownSubscription?.planKey !== 'family') throw new Error('Only the Family owner can invite caregivers');
    const caregiverEmail = args.caregiverEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(caregiverEmail)) throw new Error('Valid email is required');
    const existingRows = await ctx.db
      .query('familyCaregivers')
      .withIndex('by_owner', (q) => q.eq('ownerId', ownerId))
      .take(10);
    const active = existingRows.filter((row) => row.status !== 'revoked');
    if (active.length >= 2) throw new Error('Family plan supports 3 caregivers including the owner');
    const duplicate = await ctx.db
      .query('familyCaregivers')
      .withIndex('by_owner_and_email', (q) => q.eq('ownerId', ownerId).eq('caregiverEmail', caregiverEmail))
      .unique();
    if (duplicate && duplicate.status !== 'revoked') throw new Error('Caregiver already invited');
    if (duplicate) {
      await ctx.db.patch(duplicate._id, {
        displayName: args.displayName?.trim() || undefined,
        status: 'pending',
        invitedAt: Date.now(),
        revokedAt: undefined,
      });
      return duplicate._id;
    }
    return await ctx.db.insert('familyCaregivers', {
      ownerId,
      caregiverEmail,
      displayName: args.displayName?.trim() || undefined,
      status: 'pending',
      invitedAt: Date.now(),
    });
  },
});

export const revokeCaregiver = mutation({
  args: { id: v.id('familyCaregivers') },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    const ownerId = await requireUser(ctx);
    const row = await ctx.db.get(id);
    if (!row || row.ownerId !== ownerId) throw new Error('Not found');
    await ctx.db.patch(id, { status: 'revoked', revokedAt: Date.now() });
    return null;
  },
});

export const acceptPendingInvites = mutation({
  args: {},
  returns: v.object({ accepted: v.number() }),
  handler: async (ctx) => {
    const caregiverUserId = await requireUser(ctx);
    const user = await ctx.db.get(caregiverUserId);
    const email = user?.email?.trim().toLowerCase();
    if (!email) return { accepted: 0 };
    const pending = await ctx.db
      .query('familyCaregivers')
      .withIndex('by_email_and_status', (q) => q.eq('caregiverEmail', email).eq('status', 'pending'))
      .take(5);
    let accepted = 0;
    for (const invitation of pending) {
      const ownerSubscription = await ctx.db
        .query('subscriptions')
        .withIndex('by_user', (q) => q.eq('userId', invitation.ownerId))
        .unique();
      if (
        ownerSubscription?.planKey !== 'family'
        || !['active', 'trialing'].includes(ownerSubscription.status)
        || (ownerSubscription.currentPeriodEnd && ownerSubscription.currentPeriodEnd <= Date.now())
      ) continue;
      await ctx.db.patch(invitation._id, {
        caregiverUserId,
        status: 'active',
        acceptedAt: Date.now(),
      });
      accepted += 1;
    }
    return { accepted };
  },
});
