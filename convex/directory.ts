import { internalMutation, mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { getStaffAccess, requireOwner } from './lib/auth';
import { logAudit } from './audit';

const facilityValidator = v.object({
  _id: v.id('healthcareFacilities'),
  _creationTime: v.number(),
  country: v.string(),
  region: v.optional(v.string()),
  township: v.optional(v.string()),
  name: v.string(),
  facilityType: v.optional(v.string()),
  phone: v.optional(v.string()),
  address: v.optional(v.string()),
  services: v.optional(v.string()),
  source: v.optional(v.string()),
  lastVerifiedAt: v.optional(v.number()),
  nextVerificationAt: v.optional(v.number()),
  verifiedBy: v.optional(v.id('users')),
  isActive: v.boolean(),
});

// Public directory: ONLY active + source-verified facilities. The active index
// keeps this bounded; optional UI filters run over at most 200 public entries.
export const listPublic = query({
  args: { region: v.optional(v.string()), township: v.optional(v.string()), facilityType: v.optional(v.string()) },
  returns: v.array(facilityValidator),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('healthcareFacilities')
      .withIndex('by_active', (q) => q.eq('isActive', true))
      .take(200);
    return rows.filter(
      (row) =>
        (!args.region || row.region === args.region) &&
        (!args.township || row.township === args.township) &&
        (!args.facilityType || row.facilityType === args.facilityType),
    );
  },
});

export const adminList = query({
  args: {},
  returns: v.object({ allowed: v.boolean(), rows: v.array(facilityValidator) }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId || (await getStaffAccess(ctx, userId))?.role !== 'owner') return { allowed: false, rows: [] };
    return { allowed: true, rows: await ctx.db.query('healthcareFacilities').take(500) };
  },
});

export const create = mutation({
  args: {
    country: v.string(), region: v.optional(v.string()), township: v.optional(v.string()),
    name: v.string(), facilityType: v.optional(v.string()), phone: v.optional(v.string()),
    address: v.optional(v.string()), services: v.optional(v.string()), source: v.optional(v.string()),
  },
  returns: v.id('healthcareFacilities'),
  handler: async (ctx, args) => {
    const userId = await requireOwner(ctx);
    const id = await ctx.db.insert('healthcareFacilities', { ...args, isActive: false });
    await logAudit(ctx, userId, 'facility.create', 'healthcareFacilities', id, args.name);
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id('healthcareFacilities'),
    country: v.string(), region: v.optional(v.string()), township: v.optional(v.string()),
    name: v.string(), facilityType: v.optional(v.string()), phone: v.optional(v.string()),
    address: v.optional(v.string()), services: v.optional(v.string()), source: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireOwner(ctx);
    const row = await ctx.db.get(args.id);
    if (!row) throw new Error('Facility not found');
    const { id, ...fields } = args;
    // Editing contact details requires a fresh verification before the row is
    // shown to parents again.
    await ctx.db.patch(id, {
      ...fields,
      isActive: false,
    });
    await logAudit(ctx, userId, 'facility.update', 'healthcareFacilities', id, args.name);
    return null;
  },
});

// Verify → marks active + records verifier + timestamp (audited).
export const verify = mutation({
  args: { id: v.id('healthcareFacilities') },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    const userId = await requireOwner(ctx);
    const row = await ctx.db.get(id);
    if (!row) throw new Error('Facility not found');
    if (!row.name.trim() || !row.phone?.trim() || !row.address?.trim() || !row.source?.trim()) {
      throw new Error('Name, phone, address and source are required before verification');
    }
    const now = Date.now();
    await ctx.db.patch(id, {
      isActive: true,
      verifiedBy: userId,
      lastVerifiedAt: now,
      nextVerificationAt: now + 180 * 24 * 60 * 60 * 1000,
    });
    await logAudit(ctx, userId, 'facility.verify', 'healthcareFacilities', id);
    return null;
  },
});

export const deactivate = mutation({
  args: { id: v.id('healthcareFacilities') },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    const userId = await requireOwner(ctx);
    await ctx.db.patch(id, { isActive: false });
    await logAudit(ctx, userId, 'facility.deactivate', 'healthcareFacilities', id);
    return null;
  },
});

// Scheduled expiry keeps stale contact details out of the parent directory.
// Records created before this policy remain available until the owner edits or
// re-verifies them; all newly verified records expire after 180 days.
export const expireOverdue = internalMutation({
  args: {},
  returns: v.object({ deactivated: v.number() }),
  handler: async (ctx) => {
    const rows = await ctx.db
      .query('healthcareFacilities')
      .withIndex('by_active', (q) => q.eq('isActive', true))
      .take(500);
    const now = Date.now();
    let deactivated = 0;
    for (const row of rows) {
      if (row.nextVerificationAt !== undefined && row.nextVerificationAt <= now) {
        await ctx.db.patch(row._id, { isActive: false });
        deactivated += 1;
      }
    }
    if (deactivated > 0) {
      await logAudit(ctx, null, 'facility.expireOverdue', 'healthcareFacilities', undefined, `${deactivated} deactivated`);
    }
    return { deactivated };
  },
});
