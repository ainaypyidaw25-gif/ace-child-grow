import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { logAudit } from './audit';
import { requireOwner, requireUser } from './lib/auth';

const referralStatusValidator = v.union(
  v.literal('registered'),
  v.literal('qualified'),
  v.literal('rewarded'),
  v.literal('rejected'),
);

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function normalizeCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, '');
}

function randomCode(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let result = 'ACE-';
  for (const byte of bytes) result += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  return result;
}

export const mine = query({
  args: {},
  returns: v.object({
    code: v.union(v.string(), v.null()),
    referredCount: v.number(),
    referredBy: v.union(v.object({
      code: v.string(),
      name: v.union(v.string(), v.null()),
      status: referralStatusValidator,
    }), v.null()),
  }),
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const [codes, referrals, attribution] = await Promise.all([
      ctx.db.query('referralCodes').withIndex('by_user', (q) => q.eq('userId', userId)).take(10),
      ctx.db.query('referrals').withIndex('by_referrer_user', (q) => q.eq('referrerUserId', userId)).take(500),
      ctx.db.query('referrals').withIndex('by_referred_user', (q) => q.eq('referredUserId', userId)).unique(),
    ]);
    const activeCode = codes.find((row) => row.isActive) ?? null;
    if (!attribution) return { code: activeCode?.code ?? null, referredCount: referrals.length, referredBy: null };
    const referrerProfile = await ctx.db
      .query('parentProfiles')
      .withIndex('by_user', (q) => q.eq('userId', attribution.referrerUserId))
      .unique();
    return {
      code: activeCode?.code ?? null,
      referredCount: referrals.length,
      referredBy: {
        code: attribution.code,
        name: referrerProfile?.displayName?.trim() || null,
        status: attribution.status,
      },
    };
  },
});

export const ensureMyCode = mutation({
  args: {},
  returns: v.object({ code: v.string(), created: v.boolean() }),
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const codes = await ctx.db
      .query('referralCodes')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .take(10);
    const active = codes.find((row) => row.isActive);
    if (active) return { code: active.code, created: false };

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const code = randomCode();
      const collision = await ctx.db
        .query('referralCodes')
        .withIndex('by_code', (q) => q.eq('code', code))
        .unique();
      if (collision) continue;
      const now = Date.now();
      await ctx.db.insert('referralCodes', { userId, code, isActive: true, createdAt: now, updatedAt: now });
      return { code, created: true };
    }
    throw new Error('Unable to create a unique referral code');
  },
});

export const claim = mutation({
  args: { code: v.string() },
  returns: v.object({ claimed: v.boolean(), alreadyClaimed: v.boolean() }),
  handler: async (ctx, args) => {
    const referredUserId = await requireUser(ctx);
    const code = normalizeCode(args.code);
    if (!/^ACE-[A-Z2-9]{8}$/.test(code)) throw new Error('Invalid referral code');

    const existing = await ctx.db
      .query('referrals')
      .withIndex('by_referred_user', (q) => q.eq('referredUserId', referredUserId))
      .unique();
    if (existing) return { claimed: false, alreadyClaimed: true };

    const referralCode = await ctx.db
      .query('referralCodes')
      .withIndex('by_code', (q) => q.eq('code', code))
      .unique();
    if (!referralCode?.isActive) throw new Error('Referral code is not available');
    if (referralCode.userId === referredUserId) throw new Error('You cannot use your own referral code');

    const now = Date.now();
    const id = await ctx.db.insert('referrals', {
      referrerUserId: referralCode.userId,
      referredUserId,
      referralCodeId: referralCode._id,
      code,
      status: 'registered',
      createdAt: now,
      updatedAt: now,
    });
    await logAudit(ctx, referredUserId, 'referral.claim', 'referrals', id, code);
    return { claimed: true, alreadyClaimed: false };
  },
});

export const ownerDashboard = query({
  args: {},
  returns: v.object({
    allowed: v.boolean(),
    totals: v.object({
      all: v.number(),
      registered: v.number(),
      qualified: v.number(),
      rewarded: v.number(),
      rejected: v.number(),
    }),
    rows: v.array(v.object({
      id: v.id('referrals'),
      code: v.string(),
      status: referralStatusValidator,
      referrerEmail: v.union(v.string(), v.null()),
      referredEmail: v.union(v.string(), v.null()),
      createdAt: v.number(),
    })),
  }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { allowed: false, totals: { all: 0, registered: 0, qualified: 0, rewarded: 0, rejected: 0 }, rows: [] };
    try {
      await requireOwner(ctx);
    } catch {
      return { allowed: false, totals: { all: 0, registered: 0, qualified: 0, rewarded: 0, rejected: 0 }, rows: [] };
    }

    const [registered, qualified, rewarded, rejected, recent] = await Promise.all([
      ctx.db.query('referrals').withIndex('by_status', (q) => q.eq('status', 'registered')).take(5000),
      ctx.db.query('referrals').withIndex('by_status', (q) => q.eq('status', 'qualified')).take(5000),
      ctx.db.query('referrals').withIndex('by_status', (q) => q.eq('status', 'rewarded')).take(5000),
      ctx.db.query('referrals').withIndex('by_status', (q) => q.eq('status', 'rejected')).take(5000),
      ctx.db.query('referrals').order('desc').take(200),
    ]);
    const rows = await Promise.all(recent.map(async (row) => {
      const [referrer, referred] = await Promise.all([
        ctx.db.get(row.referrerUserId),
        ctx.db.get(row.referredUserId),
      ]);
      return {
        id: row._id,
        code: row.code,
        status: row.status,
        referrerEmail: referrer?.email ?? null,
        referredEmail: referred?.email ?? null,
        createdAt: row.createdAt,
      };
    }));
    return {
      allowed: true,
      totals: {
        all: registered.length + qualified.length + rewarded.length + rejected.length,
        registered: registered.length,
        qualified: qualified.length,
        rewarded: rewarded.length,
        rejected: rejected.length,
      },
      rows,
    };
  },
});

export const ownerSetStatus = mutation({
  args: { id: v.id('referrals'), status: referralStatusValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerId = await requireOwner(ctx);
    const row = await ctx.db.get(args.id);
    if (!row) throw new Error('Referral not found');
    const now = Date.now();
    await ctx.db.patch(row._id, { status: args.status, reviewedAt: now, reviewedBy: ownerId, updatedAt: now });
    await logAudit(ctx, ownerId, 'referral.status', 'referrals', row._id, `${row.code} · ${args.status}`);
    return null;
  },
});
