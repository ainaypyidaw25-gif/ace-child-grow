import { beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({ userId: null as string | null }));

vi.mock('@convex-dev/auth/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@convex-dev/auth/server')>();
  return {
    ...actual,
    getAuthUserId: vi.fn(async () => authState.userId),
  };
});

import { summary } from '../../../convex/reviewAssignments';
import { completion } from '../../../convex/reviewReports';

type Row = Record<string, unknown>;

function context(options: { assignments: Row[]; profiles: Row[] }) {
  const query = vi.fn((table: string) => {
    const source = table === 'parentProfiles' ? options.profiles : options.assignments;
    const terminal = (filters: Array<[string, unknown]> = []) => {
      const filtered = () => source.filter((row) => filters.every(([field, value]) => row[field] === value));
      const api = {
        take: async (count: number) => filtered().slice(0, count),
        unique: async () => filtered()[0] ?? null,
        order: () => api,
        withIndex: (
          _name: string,
          callback: (q: { eq: (field: string, value: unknown) => unknown }) => unknown,
        ) => {
          const nextFilters: Array<[string, unknown]> = [];
          const q = {
            eq: (field: string, value: unknown): unknown => {
              nextFilters.push([field, value]);
              return q;
            },
          };
          callback(q);
          return terminal(nextFilters);
        },
      };
      return api;
    };
    return terminal();
  });
  return { auth: {}, db: { query }, storage: {} };
}

function handler(fn: unknown): (
  ctx: ReturnType<typeof context>,
  args: Record<string, unknown>,
) => Promise<unknown> {
  return (fn as {
    _handler: (ctx: ReturnType<typeof context>, args: Record<string, unknown>) => Promise<unknown>;
  })._handler;
}

function assignment(index: number): Row {
  return {
    _id: `assignment-${index}`,
    reviewerId: 'reviewer-1',
    reviewerType: 'language_reviewer',
    status: 'approved',
    updatedAt: index + 1,
  };
}

describe('bounded review report completeness metadata', () => {
  beforeEach(() => {
    authState.userId = 'owner-1';
  });

  it('marks the manager summary as partial when assignments exceed its bound', async () => {
    const ctx = context({
      assignments: Array.from({ length: 5_001 }, (_, index) => assignment(index)),
      profiles: [{ userId: 'owner-1', isStaff: true, staffRole: 'owner', displayName: 'Owner' }],
    });

    await expect(handler(summary)(ctx, { asOf: 10_000 })).resolves.toMatchObject({
      total: 5_000,
      approved: 5_000,
      completionPercent: 100,
      hasMore: true,
      assignmentLimit: 5_000,
    });
  });

  it('returns only bounded completion rows and reports that more assignments exist', async () => {
    const ctx = context({
      assignments: Array.from({ length: 2_001 }, (_, index) => assignment(index)),
      profiles: [
        { userId: 'owner-1', isStaff: true, staffRole: 'owner', displayName: 'Owner' },
        { userId: 'reviewer-1', isStaff: true, staffRole: 'language_reviewer', displayName: 'Reviewer One' },
      ],
    });

    await expect(handler(completion)(ctx, { asOf: 10_000 })).resolves.toEqual({
      rows: [expect.objectContaining({ reviewerId: 'reviewer-1', assigned: 2_000, completed: 2_000 })],
      hasMore: true,
      assignmentLimit: 2_000,
    });
  });
});
