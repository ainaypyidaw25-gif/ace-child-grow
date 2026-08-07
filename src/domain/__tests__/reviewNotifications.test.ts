import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({ userId: null as string | null }));

vi.mock('@convex-dev/auth/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@convex-dev/auth/server')>();
  return { ...actual, getAuthUserId: vi.fn(async () => authState.userId) };
});

import {
  list,
  markRead,
  processReviewerReminderPage,
  sendReviewerReminders,
} from '../../../convex/notifications';

type Row = Record<string, unknown> & { _id: string; _creationTime?: number };
type Operator = 'eq' | 'gte' | 'lte' | 'lt';
type ScheduledReminderArgs = {
  phase: 'due' | 'overdue' | 'managers';
  statusIndex: number;
  cursor: string | null;
  now: number;
  dayKey: string;
  dueSoonTotal: number;
  overdueTotal: number;
};

function makeContext(seed: Record<string, Row[]>) {
  const tables = new Map(Object.entries(seed).map(([table, rows]) => [table, [...rows]]));
  let sequence = 0;
  const patch = vi.fn(async (id: string, value: Record<string, unknown>) => {
    for (const rows of tables.values()) {
      const row = rows.find((candidate) => candidate._id === id);
      if (row) Object.assign(row, value);
    }
  });
  const insert = vi.fn(async (table: string, value: Record<string, unknown>) => {
    const id = `${table}-${++sequence}`;
    const rows = tables.get(table) ?? [];
    rows.push({ _id: id, _creationTime: Date.now(), ...value });
    tables.set(table, rows);
    return id;
  });
  const query = vi.fn((table: string) => {
    const base = tables.get(table) ?? [];
    const terminal = (rows: Row[]) => ({
      collect: async () => rows,
      take: async (count: number) => rows.slice(0, count),
      paginate: async ({ cursor, numItems }: { cursor: string | null; numItems: number }) => {
        const start = cursor === null ? 0 : Number(cursor);
        const end = Math.min(start + numItems, rows.length);
        return {
          page: rows.slice(start, end),
          isDone: end >= rows.length,
          continueCursor: String(end),
        };
      },
      unique: async () => rows[0] ?? null,
      order: () => terminal([...rows].sort((a, b) => Number(b._creationTime ?? 0) - Number(a._creationTime ?? 0))),
    });
    return {
      ...terminal(base),
      withIndex: (_name: string, callback: (q: Record<Operator, (field: string, value: unknown) => unknown>) => unknown) => {
        const constraints: Array<{ operator: Operator; field: string; value: unknown }> = [];
        const q = {} as Record<Operator, (field: string, value: unknown) => typeof q>;
        for (const operator of ['eq', 'gte', 'lte', 'lt'] as Operator[]) {
          q[operator] = (field, value) => {
            constraints.push({ operator, field, value });
            return q;
          };
        }
        callback(q);
        const filtered = base.filter((row) => constraints.every(({ operator, field, value }) => {
          const actual = row[field];
          if (operator === 'eq') return actual === value;
          if (operator === 'gte') return Number(actual) >= Number(value);
          if (operator === 'lte') return Number(actual) <= Number(value);
          return Number(actual) < Number(value);
        }));
        return terminal(filtered);
      },
    };
  });
  const scheduledReminderArgs: ScheduledReminderArgs[] = [];
  const runAfter = vi.fn(async (_delay: number, _function: unknown, args: ScheduledReminderArgs) => {
    scheduledReminderArgs.push(args);
    return `scheduled-${scheduledReminderArgs.length}`;
  });
  return {
    context: {
      auth: {},
      db: {
        query,
        insert,
        patch,
        get: vi.fn(async (id: string) => {
          for (const rows of tables.values()) {
            const row = rows.find((candidate) => candidate._id === id);
            if (row) return row;
          }
          return null;
        }),
      },
      scheduler: { runAfter },
      storage: {},
    },
    tables,
    insert,
    patch,
    scheduledReminderArgs,
  };
}

function handler(fn: unknown) {
  return (fn as { _handler: (context: unknown, args: Record<string, unknown>) => Promise<unknown> })._handler;
}

async function drainReminderQueue(
  context: unknown,
  queue: ScheduledReminderArgs[],
  maxJobs = 100,
) {
  let processed = 0;
  while (queue.length > 0) {
    if (processed >= maxJobs) throw new Error('Reminder queue did not finish');
    const args = queue.shift();
    if (!args) break;
    await handler(processReviewerReminderPage)(context, args);
    processed += 1;
  }
  return processed;
}

describe('review notifications', () => {
  beforeEach(() => {
    authState.userId = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns only notifications belonging to the authenticated user', async () => {
    authState.userId = 'reviewer-1';
    const { context } = makeContext({
      notifications: [
        { _id: 'n-1', _creationTime: 2, userId: 'reviewer-1', titleMm: 'ကိုယ်ပိုင်', titleEn: 'Mine' },
        { _id: 'n-2', _creationTime: 1, userId: 'reviewer-2', titleMm: 'အခြားသူ', titleEn: 'Private' },
      ],
    });
    await expect(handler(list)(context, {})).resolves.toEqual([
      expect.objectContaining({ _id: 'n-1', userId: 'reviewer-1' }),
    ]);
  });

  it('does not allow one user to mark another user notification as read', async () => {
    authState.userId = 'reviewer-1';
    const { context, patch } = makeContext({
      notifications: [
        { _id: 'n-2', userId: 'reviewer-2', titleMm: 'အခြားသူ', titleEn: 'Private' },
      ],
    });
    await expect(handler(markRead)(context, { notificationId: 'n-2' }))
      .rejects.toThrow('Notification not found');
    expect(patch).not.toHaveBeenCalled();
  });

  it('creates due, overdue and manager digest reminders only once per day', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-29T00:00:00.000Z'));
    const now = Date.now();
    const { context, tables, scheduledReminderArgs } = makeContext({
      reviewAssignments: [
        {
          _id: 'assignment-due', reviewerId: 'reviewer-1', reviewerType: 'myanmar_language_reviewer',
          contentSlug: 'content-due', status: 'assigned', dueAt: now + 60_000,
        },
        {
          _id: 'assignment-overdue', reviewerId: 'reviewer-2', reviewerType: 'clinical_reviewer',
          contentSlug: 'content-overdue', status: 'in_review', dueAt: now - 60_000,
        },
      ],
      parentProfiles: [
        { _id: 'profile-owner', userId: 'owner-1', isStaff: true, staffRole: 'owner' },
        { _id: 'profile-reviewer', userId: 'reviewer-1', isStaff: true, staffRole: 'myanmar_language_reviewer' },
      ],
      notifications: [],
    });

    await expect(handler(sendReviewerReminders)(context, {})).resolves.toEqual({
      queued: true,
      dayKey: '2026-07-29',
    });
    await drainReminderQueue(context, scheduledReminderArgs);
    await expect(handler(sendReviewerReminders)(context, {})).resolves.toEqual({
      queued: true,
      dayKey: '2026-07-29',
    });
    await drainReminderQueue(context, scheduledReminderArgs);
    expect(tables.get('notifications')).toHaveLength(3);
    expect(tables.get('notifications')?.map((row) => row.kind)).toEqual(expect.arrayContaining([
      'review_due',
      'review_overdue',
      'review_manager_digest',
    ]));
  });

  it('paginates the complete backlog and reports complete totals to every manager', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-29T00:00:00.000Z'));
    const now = Date.now();
    const overdueAssignments = Array.from({ length: 45 }, (_, index) => ({
      _id: `assignment-overdue-${index}`,
      reviewerId: `reviewer-${index}`,
      reviewerType: 'clinical_reviewer',
      contentSlug: `content-overdue-${index}`,
      status: 'assigned',
      dueAt: now - (index + 1) * 60_000,
    }));
    const dueAssignments = Array.from({ length: 3 }, (_, index) => ({
      _id: `assignment-due-${index}`,
      reviewerId: `reviewer-due-${index}`,
      reviewerType: 'myanmar_language_reviewer',
      contentSlug: `content-due-${index}`,
      status: 'assigned',
      dueAt: now + (index + 1) * 60_000,
    }));
    const managerProfiles = Array.from({ length: 101 }, (_, index) => ({
      _id: `profile-manager-${index}`,
      userId: `manager-${index}`,
      isStaff: true,
      staffRole: 'review_manager',
    }));
    const { context, tables, scheduledReminderArgs } = makeContext({
      reviewAssignments: [...overdueAssignments, ...dueAssignments],
      parentProfiles: managerProfiles,
      notifications: [],
    });

    await handler(sendReviewerReminders)(context, {});
    const jobs = await drainReminderQueue(context, scheduledReminderArgs);

    expect(jobs).toBeGreaterThan(10);
    const notifications = tables.get('notifications') ?? [];
    expect(notifications.filter((row) => row.kind === 'review_overdue')).toHaveLength(45);
    expect(notifications.filter((row) => row.kind === 'review_due')).toHaveLength(3);
    expect(notifications.filter((row) => row.kind === 'review_manager_digest')).toHaveLength(101);
    expect(notifications).toContainEqual(expect.objectContaining({
      assignmentId: 'assignment-overdue-44',
      kind: 'review_overdue',
    }));
    expect(notifications).toContainEqual(expect.objectContaining({
      userId: 'manager-100',
      kind: 'review_manager_digest',
      bodyEn: '3 assignment(s) are due within 24 hours and 45 are overdue.',
    }));
  });
});
