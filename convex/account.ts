import { mutation } from './_generated/server';
import { v } from 'convex/values';
import { requireUser } from './lib/auth';

export const deleteMine = mutation({
  args: { confirmation: v.literal('DELETE') },
  returns: v.null(),
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const user = await ctx.db.get(userId);

    const byUserTables = [
      'parentProfiles', 'subscriptions', 'mmpayTransactions',
      'referralCodes',
      'favorites', 'notifications', 'children', 'growthRecords', 'sleepRecords',
      'milestoneSessions',
    ] as const;
    for (const table of byUserTables) {
      const rows = await ctx.db.query(table).withIndex('by_user', (q) => q.eq('userId', userId)).take(500);
      for (const row of rows) await ctx.db.delete(row._id);
    }

    const paymentRequests = await ctx.db.query('paymentRequests').withIndex('by_user', (q) => q.eq('userId', userId)).take(100);
    for (const row of paymentRequests) {
      if (row.proofStorageId) await ctx.storage.delete(row.proofStorageId);
      await ctx.db.delete(row._id);
    }

    const responses = await ctx.db
      .query('milestoneResponses')
      .withIndex('by_user_and_child', (q) => q.eq('userId', userId))
      .take(1000);
    for (const row of responses) await ctx.db.delete(row._id);

    const activities = await ctx.db
      .query('activityCompletions')
      .withIndex('by_user_and_completed_at', (q) => q.eq('userId', userId))
      .take(1000);
    for (const row of activities) await ctx.db.delete(row._id);

    const appointments = await ctx.db
      .query('appointments')
      .withIndex('by_user_and_appointment_at', (q) => q.eq('userId', userId))
      .take(500);
    for (const row of appointments) await ctx.db.delete(row._id);

    const ownedCaregivers = await ctx.db.query('familyCaregivers').withIndex('by_owner', (q) => q.eq('ownerId', userId)).take(20);
    const caregiverLinks = await ctx.db.query('familyCaregivers').withIndex('by_caregiver_user', (q) => q.eq('caregiverUserId', userId)).take(20);
    for (const row of [...ownedCaregivers, ...caregiverLinks]) await ctx.db.delete(row._id);

    const sentReferrals = await ctx.db.query('referrals').withIndex('by_referrer_user', (q) => q.eq('referrerUserId', userId)).take(500);
    const receivedReferral = await ctx.db.query('referrals').withIndex('by_referred_user', (q) => q.eq('referredUserId', userId)).unique();
    const referralIds = new Set([...sentReferrals.map((row) => row._id), ...(receivedReferral ? [receivedReferral._id] : [])]);
    for (const id of referralIds) await ctx.db.delete(id);

    const accounts = await ctx.db.query('authAccounts').withIndex('userIdAndProvider', (q) => q.eq('userId', userId)).take(20);
    for (const account of accounts) {
      const codes = await ctx.db.query('authVerificationCodes').withIndex('accountId', (q) => q.eq('accountId', account._id)).take(50);
      for (const code of codes) await ctx.db.delete(code._id);
      await ctx.db.delete(account._id);
    }

    const sessions = await ctx.db.query('authSessions').withIndex('userId', (q) => q.eq('userId', userId)).take(50);
    for (const session of sessions) {
      const tokens = await ctx.db.query('authRefreshTokens').withIndex('sessionId', (q) => q.eq('sessionId', session._id)).take(200);
      for (const token of tokens) await ctx.db.delete(token._id);
      await ctx.db.delete(session._id);
    }

    if (user?.email) {
      const rateLimit = await ctx.db.query('authRateLimits').withIndex('identifier', (q) => q.eq('identifier', user.email!)).unique();
      if (rateLimit) await ctx.db.delete(rateLimit._id);
    }
    await ctx.db.delete(userId);
    return null;
  },
});
