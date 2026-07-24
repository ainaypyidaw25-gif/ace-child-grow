import { query, mutation } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

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
    return { userId, email: (user as any)?.email ?? null, consentAcceptedAt: profile?.consentAcceptedAt ?? null };
  },
});

export const acceptConsent = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
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
    }
  },
});
