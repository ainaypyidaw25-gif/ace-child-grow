import { internal } from './_generated/api';
import type { Id, TableNames } from './_generated/dataModel';
import { internalMutation, query, mutation, type MutationCtx } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { requireUser } from './lib/auth';
import { activeFamilyOwnerIds, childLimit } from './lib/entitlements';
import { MAX_GESTATIONAL_WEEKS, MIN_GESTATIONAL_WEEKS } from '../src/domain/age/age';

/**
 * The server is the source of truth for what may be stored. The Add/Edit screens
 * already check this range, but a value persisted outside it — by a buggy build
 * or a direct call — makes correctedAge() throw on every render of the milestone
 * screen, locking the parent out of their own child's screening with no way to
 * correct it from the UI.
 *
 * Only the RANGE is enforced. `useCorrectedAge` without a gestational age is
 * deliberately left alone: developmentalAgeMonths falls back to chronological
 * age for that combination, so it is valid data, and rejecting it here would
 * block edits to children that already carry it.
 */
function assertGestationalWeeks(weeks: number | undefined): void {
  if (weeks === undefined) return;
  if (!Number.isInteger(weeks) || weeks < MIN_GESTATIONAL_WEEKS || weeks > MAX_GESTATIONAL_WEEKS) {
    throw new Error(
      `Gestational age must be a whole number between ${MIN_GESTATIONAL_WEEKS} and ${MAX_GESTATIONAL_WEEKS} weeks`,
    );
  }
}

const childValidator = v.object({
  _id: v.id('children'),
  _creationTime: v.number(),
  userId: v.id('users'),
  nickname: v.string(),
  birthDate: v.string(),
  sex: v.optional(v.union(v.literal('female'), v.literal('male'), v.literal('unspecified'))),
  gestationalWeeks: v.optional(v.number()),
  useCorrectedAge: v.boolean(),
  deletedAt: v.optional(v.number()),
});

const DELETION_BATCH_SIZE = 64;
type DeletableRow = { _id: Id<TableNames> };

function distinctRows(...groups: ReadonlyArray<ReadonlyArray<DeletableRow>>): DeletableRow[] {
  const seen = new Set<string>();
  const rows: DeletableRow[] = [];
  for (const group of groups) {
    for (const row of group) {
      const id = String(row._id);
      if (seen.has(id)) continue;
      seen.add(id);
      rows.push(row);
    }
  }
  return rows;
}

async function deleteRows(ctx: MutationCtx, rows: ReadonlyArray<DeletableRow>): Promise<void> {
  for (const row of rows) await ctx.db.delete(row._id);
}

// Ownership is ALWAYS derived from the authenticated identity, never from client
// input. A parent can only ever read/write their own children (P0 guarantee).

export const list = query({
  args: {},
  returns: v.array(childValidator),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const owned = await ctx.db
      .query('children')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .take(10);
    const familyOwnerIds = await activeFamilyOwnerIds(ctx, userId);
    const sharedGroups = await Promise.all(
      familyOwnerIds
        .map((ownerId) => ctx.db
          .query('children')
          .withIndex('by_user', (q) => q.eq('userId', ownerId))
          .take(3)),
    );
    return [...owned, ...sharedGroups.flat()].filter((child) => !child.deletedAt);
  },
});

export const add = mutation({
  args: {
    nickname: v.string(),
    birthDate: v.string(),
    sex: v.optional(v.union(v.literal('female'), v.literal('male'), v.literal('unspecified'))),
    gestationalWeeks: v.optional(v.number()),
    useCorrectedAge: v.boolean(),
  },
  returns: v.id('children'),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    assertGestationalWeeks(args.gestationalWeeks);
    const children = await ctx.db
      .query('children')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .take(4);
    const activeCount = children.filter((child) => !child.deletedAt).length;
    const limit = await childLimit(ctx, userId);
    if (activeCount >= limit) {
      throw new Error(limit === 1 ? 'Family plan required to add another child' : 'Family plan supports up to 3 children');
    }
    return await ctx.db.insert('children', { userId, ...args });
  },
});

export const update = mutation({
  args: {
    id: v.id('children'),
    nickname: v.string(),
    birthDate: v.string(),
    gestationalWeeks: v.optional(v.number()),
    useCorrectedAge: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    assertGestationalWeeks(args.gestationalWeeks);
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) throw new Error('Not found');
    const { id, ...patch } = args;
    await ctx.db.patch(id, patch);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id('children') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) throw new Error('Not found');
    // Caregivers may read a shared child, but only its owner can initiate this
    // destructive cascade. Mark it hidden immediately, then hard-delete all
    // associated records in bounded internal batches.
    if (existing.deletedAt === undefined) {
      await ctx.db.patch(args.id, { deletedAt: Date.now() });
    }
    await ctx.scheduler.runAfter(0, internal.children.deleteChildBatch, {
      childId: args.id,
      ownerId: userId,
    });
    return null;
  },
});

/**
 * Repeatedly removes every record linked to a child, then deletes the child in
 * a final no-record transaction. The indexed range reads participate in Convex
 * OCC, so a record racing the final delete forces a retry instead of becoming
 * an orphan.
 */
export const deleteChildBatch = internalMutation({
  args: {
    childId: v.id('children'),
    ownerId: v.id('users'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const child = await ctx.db.get(args.childId);
    if (!child || child.userId !== args.ownerId || child.deletedAt === undefined) return null;

    const groups = await Promise.all([
      ctx.db.query('growthRecords').withIndex('by_child', (q) => q.eq('childId', args.childId)).take(DELETION_BATCH_SIZE),
      ctx.db.query('sleepRecords').withIndex('by_child', (q) => q.eq('childId', args.childId)).take(DELETION_BATCH_SIZE),
      ctx.db.query('healthRecords').withIndex('by_child_and_record_date', (q) => q.eq('childId', args.childId)).take(DELETION_BATCH_SIZE),
      ctx.db.query('vaccinationRecords').withIndex('by_child_and_scheduled_on', (q) => q.eq('childId', args.childId)).take(DELETION_BATCH_SIZE),
      ctx.db.query('medicationRecords').withIndex('by_child_and_started_on', (q) => q.eq('childId', args.childId)).take(DELETION_BATCH_SIZE),
      ctx.db.query('milestoneSessions').withIndex('by_child', (q) => q.eq('childId', args.childId)).take(DELETION_BATCH_SIZE),
      ctx.db.query('activityCompletions').withIndex('by_child_and_completed_at', (q) => q.eq('childId', args.childId)).take(DELETION_BATCH_SIZE),
      ctx.db.query('appointments').withIndex('by_child_and_appointment_at', (q) => q.eq('childId', args.childId)).take(DELETION_BATCH_SIZE),
      ctx.db.query('observations').withIndex('by_child_and_observed_on', (q) => q.eq('childId', args.childId)).take(DELETION_BATCH_SIZE),
    ]);
    const rows = distinctRows(...groups);
    // milestoneResponses can carry a user-uploaded keepsake photo blob, so it
    // is swept separately — its blob must be deleted in the same pass as its row.
    const milestoneResponses = await ctx.db
      .query('milestoneResponses')
      .withIndex('by_child', (q) => q.eq('childId', args.childId))
      .take(DELETION_BATCH_SIZE);
    if (rows.length > 0 || milestoneResponses.length > 0) {
      await deleteRows(ctx, rows);
      for (const row of milestoneResponses) {
        if (row.photoStorageId) await ctx.storage.delete(row.photoStorageId);
        await ctx.db.delete(row._id);
      }
      await ctx.scheduler.runAfter(0, internal.children.deleteChildBatch, args);
      return null;
    }

    await ctx.db.delete(args.childId);
    return null;
  },
});
