import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { isStaff, requireStaff } from './lib/auth';
import { logAudit } from './audit';

// Public directory: ONLY active + verified facilities. Never invented data.
export const listPublic = query({
  args: { region: v.optional(v.string()), township: v.optional(v.string()), facilityType: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('healthcareFacilities')
      .withIndex('by_active', (q) => q.eq('isActive', true))
      .collect();
    return rows.filter(
      (r) =>
        (!args.region || r.region === args.region) &&
        (!args.township || r.township === args.township) &&
        (!args.facilityType || r.facilityType === args.facilityType),
    );
  },
});

export const adminList = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId || !(await isStaff(ctx, userId))) return { allowed: false, rows: [] };
    return { allowed: true, rows: await ctx.db.query('healthcareFacilities').collect() };
  },
});

export const create = mutation({
  args: {
    country: v.string(), region: v.optional(v.string()), township: v.optional(v.string()),
    name: v.string(), facilityType: v.optional(v.string()), phone: v.optional(v.string()),
    address: v.optional(v.string()), services: v.optional(v.string()), source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireStaff(ctx);
    const id = await ctx.db.insert('healthcareFacilities', { ...args, isActive: false });
    await logAudit(ctx, userId, 'facility.create', 'healthcareFacilities', id, args.name);
    return id;
  },
});

// Verify → marks active + records verifier + timestamp (audited).
export const verify = mutation({
  args: { id: v.id('healthcareFacilities') },
  handler: async (ctx, { id }) => {
    const userId = await requireStaff(ctx);
    await ctx.db.patch(id, { isActive: true, verifiedBy: userId, lastVerifiedAt: Date.now() });
    await logAudit(ctx, userId, 'facility.verify', 'healthcareFacilities', id);
  },
});

export const deactivate = mutation({
  args: { id: v.id('healthcareFacilities') },
  handler: async (ctx, { id }) => {
    const userId = await requireStaff(ctx);
    await ctx.db.patch(id, { isActive: false });
    await logAudit(ctx, userId, 'facility.deactivate', 'healthcareFacilities', id);
  },
});
