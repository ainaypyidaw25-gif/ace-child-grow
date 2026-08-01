import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';
import { requireUser } from './lib/auth';
import { getStaffAccess } from './lib/auth';

export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    const profile = await ctx.db
      .query('parentProfiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();
    const staffAccess = await getStaffAccess(ctx, userId);
    return {
      userId,
      email: user?.email ?? null,
      consentAcceptedAt: profile?.consentAcceptedAt ?? null,
      preferredLocale: profile?.preferredLocale ?? null,
      isStaff: profile?.isStaff === true,
      staffRole: staffAccess?.role ?? null,
      parentTourCompletedVersion: profile?.parentTourCompletedVersion ?? 0,
      staffTourCompletedVersion: profile?.staffTourCompletedVersion ?? 0,
    };
  },
});

export const completeTour = mutation({
  args: {
    kind: v.union(v.literal('parent'), v.literal('staff')),
    version: v.number(),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    if (!Number.isInteger(args.version) || args.version < 1 || args.version > 100) {
      throw new Error('Invalid tour version');
    }
    const existing = await ctx.db
      .query('parentProfiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();
    if (args.kind === 'staff' && !(await getStaffAccess(ctx, userId))) {
      throw new Error('Staff access is required');
    }
    const patch = args.kind === 'staff'
      ? { staffTourCompletedVersion: args.version }
      : { parentTourCompletedVersion: args.version };
    if (existing) await ctx.db.patch(existing._id, patch);
    else await ctx.db.insert('parentProfiles', { userId, preferredLocale: 'mm', ...patch });
    return { ok: true };
  },
});

/**
 * Record the parent's language choice on their account, so a second signed-in
 * device shows the language they picked. Carries no other authority: it can only
 * write preferredLocale, and only for the calling parent's own profile.
 */
export const setPreferredLocale = mutation({
  args: { locale: v.union(v.literal('mm'), v.literal('en')) },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query('parentProfiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();
    if (existing) await ctx.db.patch(existing._id, { preferredLocale: args.locale });
    else await ctx.db.insert('parentProfiles', { userId, preferredLocale: args.locale });
    return { ok: true };
  },
});

export const acceptConsent = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query('parentProfiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { consentAcceptedAt: Date.now() });
    } else {
      await ctx.db.insert('parentProfiles', {
        userId,
        preferredLocale: 'mm',
        consentAcceptedAt: Date.now(),
      });
      // Welcome notification on first consent.
      await ctx.db.insert('notifications', {
        userId,
        titleMm: 'ကြိုဆိုပါတယ်',
        titleEn: 'Welcome',
        bodyMm: 'ACE Child Grow မှ ကြိုဆိုပါတယ်။ ကလေး၏ ဖွံ့ဖြိုးမှုခရီးကို စတင်လိုက်ပါ။',
        bodyEn: 'Welcome to ACE Child Grow. Start your child’s development journey.',
      });
    }
  },
});
