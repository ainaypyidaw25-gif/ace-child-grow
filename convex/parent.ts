import { query, mutation } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';
import { requireUser } from './lib/auth';

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
    return {
      userId,
      email: user?.email ?? null,
      consentAcceptedAt: profile?.consentAcceptedAt ?? null,
      isStaff: profile?.isStaff === true,
    };
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
