import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { internalMutation, mutation, query } from './_generated/server';
import type { MutationCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { requireUser } from './lib/auth';

const notificationKindValidator = v.union(
  v.literal('general'),
  v.literal('review_assignment'),
  v.literal('review_due'),
  v.literal('review_overdue'),
  v.literal('review_changes_requested'),
  v.literal('review_re_review'),
  v.literal('review_manager_digest'),
);

const notificationValidator = v.object({
  _id: v.id('notifications'),
  _creationTime: v.number(),
  userId: v.id('users'),
  titleMm: v.string(),
  titleEn: v.string(),
  bodyMm: v.optional(v.string()),
  bodyEn: v.optional(v.string()),
  kind: v.optional(notificationKindValidator),
  assignmentId: v.optional(v.id('reviewAssignments')),
  contentSlug: v.optional(v.string()),
  targetPath: v.optional(v.string()),
  sourceKey: v.optional(v.string()),
  createdAt: v.optional(v.number()),
  readAt: v.optional(v.number()),
});

type ReminderKind = 'review_due' | 'review_overdue' | 'review_manager_digest';
type ReminderPhase = 'due' | 'overdue' | 'managers';

type ReminderPageArgs = {
  phase: ReminderPhase;
  statusIndex: number;
  cursor: string | null;
  now: number;
  dayKey: string;
  dueSoonTotal: number;
  overdueTotal: number;
};

type ReminderPageResult = {
  phase: ReminderPhase;
  scanned: number;
  inserted: number;
  scheduled: boolean;
  complete: boolean;
  dueSoonTotal: number;
  overdueTotal: number;
};

const reminderPhaseValidator = v.union(
  v.literal('due'),
  v.literal('overdue'),
  v.literal('managers'),
);

const reminderPageArgsValidator = {
  phase: reminderPhaseValidator,
  statusIndex: v.number(),
  cursor: v.union(v.string(), v.null()),
  now: v.number(),
  dayKey: v.string(),
  dueSoonTotal: v.number(),
  overdueTotal: v.number(),
};

const reminderPageResultValidator = v.object({
  phase: reminderPhaseValidator,
  scanned: v.number(),
  inserted: v.number(),
  scheduled: v.boolean(),
  complete: v.boolean(),
  dueSoonTotal: v.number(),
  overdueTotal: v.number(),
});

const assignmentPageSize = 40;
const managerPageSize = 100;

async function insertOnce(
  ctx: MutationCtx,
  values: {
    userId: Id<'users'>;
    titleMm: string;
    titleEn: string;
    bodyMm: string;
    bodyEn: string;
    kind: ReminderKind;
    assignmentId?: Id<'reviewAssignments'>;
    contentSlug?: string;
    targetPath: string;
    sourceKey: string;
    createdAt: number;
  },
): Promise<boolean> {
  const existing = await ctx.db
    .query('notifications')
    .withIndex('by_source_key', (q) => q.eq('sourceKey', values.sourceKey))
    .unique();
  if (existing) return false;
  await ctx.db.insert('notifications', values);
  return true;
}

export const list = query({
  args: {},
  returns: v.array(notificationValidator),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .take(100);
  },
});

export const unreadCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;
    const rows = await ctx.db
      .query('notifications')
      .withIndex('by_user_and_read_at', (q) => q.eq('userId', userId).eq('readAt', undefined))
      .take(500);
    return rows.length;
  },
});

export const markAllRead = mutation({
  args: {},
  returns: v.object({ ok: v.literal(true), updated: v.number(), hasMore: v.boolean() }),
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const rows = await ctx.db
      .query('notifications')
      .withIndex('by_user_and_read_at', (q) => q.eq('userId', userId).eq('readAt', undefined))
      .take(101);
    const now = Date.now();
    const page = rows.slice(0, 100);
    for (const notification of page) await ctx.db.patch(notification._id, { readAt: now });
    return { ok: true as const, updated: page.length, hasMore: rows.length > page.length };
  },
});

export const markRead = mutation({
  args: { notificationId: v.id('notifications') },
  returns: v.object({ ok: v.literal(true) }),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== userId) throw new Error('Notification not found');
    if (!notification.readAt) await ctx.db.patch(notification._id, { readAt: Date.now() });
    return { ok: true as const };
  },
});

const reminderStatuses = [
  'assigned',
  'in_review',
  'changes_requested',
  'revised',
  're_review_required',
] as const;

/**
 * Daily in-app reminders only. No email is sent and no reviewer or content
 * record is changed. The kickoff captures one stable time window, then a
 * scheduled, cursor-based worker visits every matching assignment in bounded
 * pages. Deterministic source keys make retries and repeated daily runs
 * idempotent without repeatedly selecting only the first page.
 */
export const sendReviewerReminders = internalMutation({
  args: {},
  returns: v.object({ queued: v.literal(true), dayKey: v.string() }),
  handler: async (ctx) => {
    const now = Date.now();
    const dayKey = new Date(now).toISOString().slice(0, 10);
    await ctx.scheduler.runAfter(0, internal.notifications.processReviewerReminderPage, {
      phase: 'due',
      statusIndex: 0,
      cursor: null,
      now,
      dayKey,
      dueSoonTotal: 0,
      overdueTotal: 0,
    });
    return { queued: true as const, dayKey };
  },
});

/**
 * One bounded page of the daily reminder sweep. Each invocation schedules the
 * next cursor/status/phase, so an old backlog cannot permanently hide later
 * assignments. Manager totals are accumulated from every assignment page and
 * the digest is sent only after both assignment phases are complete.
 */
export const processReviewerReminderPage = internalMutation({
  args: reminderPageArgsValidator,
  returns: reminderPageResultValidator,
  handler: async (ctx, args): Promise<ReminderPageResult> => {
    if (!Number.isInteger(args.statusIndex) || args.statusIndex < 0) {
      throw new Error('Invalid reminder status index');
    }

    if (args.phase === 'managers') {
      const profiles = await ctx.db
        .query('parentProfiles')
        .withIndex('by_is_staff', (q) => q.eq('isStaff', true))
        .paginate({ cursor: args.cursor, numItems: managerPageSize });
      let inserted = 0;
      if (args.dueSoonTotal > 0 || args.overdueTotal > 0) {
        for (const profile of profiles.page) {
          const roles = profile.staffRole
            ? [profile.staffRole, ...(profile.additionalStaffRoles ?? [])]
            : ['owner'];
          if (!roles.some((role) => ['owner', 'system_admin', 'review_manager'].includes(role))) continue;
          if (await insertOnce(ctx, {
            userId: profile.userId,
            titleMm: 'ယနေ့ သုံးသပ်တာဝန် အကျဉ်းချုပ်',
            titleEn: 'Daily review assignment summary',
            bodyMm: `၂၄ နာရီအတွင်း ပြီးစီးရမည့်တာဝန် ${args.dueSoonTotal} ခု၊ သတ်မှတ်ရက်ကျော်လွန်နေသည့်တာဝန် ${args.overdueTotal} ခု ရှိပါသည်။`,
            bodyEn: `${args.dueSoonTotal} assignment(s) are due within 24 hours and ${args.overdueTotal} are overdue.`,
            kind: 'review_manager_digest',
            targetPath: '/admin/reviews',
            sourceKey: `review_manager_digest:${profile.userId}:${args.dayKey}`,
            createdAt: args.now,
          })) inserted += 1;
        }
      }
      if (!profiles.isDone) {
        await ctx.scheduler.runAfter(0, internal.notifications.processReviewerReminderPage, {
          ...args,
          cursor: profiles.continueCursor,
        });
      }
      return {
        phase: args.phase,
        scanned: profiles.page.length,
        inserted,
        scheduled: !profiles.isDone,
        complete: profiles.isDone,
        dueSoonTotal: args.dueSoonTotal,
        overdueTotal: args.overdueTotal,
      };
    }

    if (args.statusIndex >= reminderStatuses.length) {
      throw new Error('Invalid reminder status index');
    }
    const status = reminderStatuses[args.statusIndex];
    const nextDay = args.now + 24 * 60 * 60 * 1000;
    const assignments = args.phase === 'due'
      ? await ctx.db
        .query('reviewAssignments')
        .withIndex('by_status_due', (q) => q
          .eq('status', status)
          .gte('dueAt', args.now)
          .lte('dueAt', nextDay))
        .paginate({ cursor: args.cursor, numItems: assignmentPageSize })
      : await ctx.db
        .query('reviewAssignments')
        .withIndex('by_status_due', (q) => q.eq('status', status).lt('dueAt', args.now))
        .paginate({ cursor: args.cursor, numItems: assignmentPageSize });

    let inserted = 0;
    for (const assignment of assignments.page) {
      const overdue = args.phase === 'overdue';
      if (await insertOnce(ctx, {
        userId: assignment.reviewerId,
        titleMm: overdue
          ? 'သုံးသပ်တာဝန် သတ်မှတ်ရက် ကျော်လွန်နေပါသည်'
          : 'သုံးသပ်တာဝန် ပြီးစီးရမည့်ရက် နီးလာပါပြီ',
        titleEn: overdue ? 'Review assignment overdue' : 'Review assignment due soon',
        bodyMm: overdue
          ? `${assignment.contentSlug} ကို စစ်ဆေးရန် သတ်မှတ်ရက် ကျော်လွန်နေပါသည်။ အခက်အခဲရှိပါက သုံးသပ်မှုမန်နေဂျာထံ အကြောင်းကြားပါ။`
          : `${assignment.contentSlug} ကို ၂၄ နာရီအတွင်း စစ်ဆေးပြီးစီးရန် သတ်မှတ်ထားပါသည်။`,
        bodyEn: overdue
          ? `${assignment.contentSlug} is overdue. Contact the Review Manager if the work is blocked.`
          : `${assignment.contentSlug} is due within the next 24 hours.`,
        kind: overdue ? 'review_overdue' : 'review_due',
        assignmentId: assignment._id,
        contentSlug: assignment.contentSlug,
        targetPath: `/admin/reviews?content=${encodeURIComponent(assignment.contentSlug)}`,
        sourceKey: `${overdue ? 'review_overdue' : 'review_due'}:${assignment._id}:${args.dayKey}`,
        createdAt: args.now,
      })) inserted += 1;
    }

    const dueSoonTotal = args.dueSoonTotal + (args.phase === 'due' ? assignments.page.length : 0);
    const overdueTotal = args.overdueTotal + (args.phase === 'overdue' ? assignments.page.length : 0);
    let nextArgs: ReminderPageArgs | null = null;
    if (!assignments.isDone) {
      nextArgs = { ...args, cursor: assignments.continueCursor, dueSoonTotal, overdueTotal };
    } else if (args.statusIndex + 1 < reminderStatuses.length) {
      nextArgs = {
        ...args,
        statusIndex: args.statusIndex + 1,
        cursor: null,
        dueSoonTotal,
        overdueTotal,
      };
    } else if (args.phase === 'due') {
      nextArgs = {
        ...args,
        phase: 'overdue',
        statusIndex: 0,
        cursor: null,
        dueSoonTotal,
        overdueTotal,
      };
    } else if (dueSoonTotal > 0 || overdueTotal > 0) {
      nextArgs = {
        ...args,
        phase: 'managers',
        statusIndex: 0,
        cursor: null,
        dueSoonTotal,
        overdueTotal,
      };
    }

    if (nextArgs) {
      await ctx.scheduler.runAfter(0, internal.notifications.processReviewerReminderPage, nextArgs);
    }
    return {
      phase: args.phase,
      scanned: assignments.page.length,
      inserted,
      scheduled: nextArgs !== null,
      complete: nextArgs === null,
      dueSoonTotal,
      overdueTotal,
    };
  },
});
