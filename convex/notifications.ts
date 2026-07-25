import { query, mutation } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';
import { requireUser } from './lib/auth';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .collect();
  },
});

export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;
    const rows = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    return rows.filter((n) => !n.readAt).length;
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const rows = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    const now = Date.now();
    for (const n of rows) if (!n.readAt) await ctx.db.patch(n._id, { readAt: now });
  },
});
