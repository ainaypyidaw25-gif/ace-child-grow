import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query('favorites')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    return rows.map((r) => r.activityKey);
  },
});

export const toggle = mutation({
  args: { activityKey: v.string() },
  handler: async (ctx, { activityKey }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    const existing = await ctx.db
      .query('favorites')
      .withIndex('by_user_activity', (q) => q.eq('userId', userId).eq('activityKey', activityKey))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }
    await ctx.db.insert('favorites', { userId, activityKey });
    return true;
  },
});
