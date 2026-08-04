import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({ userId: null as string | null }));

vi.mock('@convex-dev/auth/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@convex-dev/auth/server')>();
  return {
    ...actual,
    getAuthUserId: vi.fn(async () => authState.userId),
  };
});

import { deleteMine, deleteMineBatch } from '../../../convex/account';
import { deleteChildBatch, remove as removeChild } from '../../../convex/children';

type Row = Record<string, unknown> & { _id: string };

function context(options: {
  rows?: Record<string, Row[]>;
  documents?: Record<string, Row>;
} = {}) {
  const rows = Object.fromEntries(
    Object.entries(options.rows ?? {}).map(([table, tableRows]) => [table, [...tableRows]]),
  ) as Record<string, Row[]>;
  const documents = { ...(options.documents ?? {}) };

  const terminal = (selected: Row[]) => {
    const value = {
      take: async (count: number) => selected.slice(0, count),
      unique: async () => selected[0] ?? null,
      order: () => value,
      paginate: async ({ cursor, numItems }: { cursor: string | null; numItems: number }) => {
        const start = cursor ? Number(cursor) : 0;
        const page = selected.slice(start, start + numItems);
        const next = start + page.length;
        return {
          page,
          isDone: next >= selected.length,
          continueCursor: String(next),
        };
      },
    };
    return value;
  };

  const query = vi.fn((table: string) => {
    const tableRows = rows[table] ?? [];
    return {
      ...terminal(tableRows),
      withIndex: (
        _name: string,
        callback: (q: { eq: (field: string, value: unknown) => unknown }) => unknown,
      ) => {
        const filters: Array<[string, unknown]> = [];
        type EqQuery = { eq: (field: string, value: unknown) => EqQuery };
        const q: EqQuery = {
          eq(field: string, value: unknown) {
            filters.push([field, value]);
            return q;
          },
        };
        callback(q);
        return terminal(tableRows.filter((row) => filters.every(([field, value]) => row[field] === value)));
      },
    };
  });

  const deleteRow = vi.fn(async (id: string) => {
    delete documents[id];
    for (const tableRows of Object.values(rows)) {
      const index = tableRows.findIndex((row) => row._id === id);
      if (index >= 0) tableRows.splice(index, 1);
    }
  });
  const patch = vi.fn(async (id: string, update: Record<string, unknown>) => {
    const row = documents[id] ?? Object.values(rows).flat().find((candidate) => candidate._id === id);
    if (row) Object.assign(row, update);
  });
  const runAfter = vi.fn(async () => 'scheduled-after');
  const runAt = vi.fn(async () => 'scheduled-at');
  const deleteStorage = vi.fn(async () => undefined);

  return {
    auth: {},
    db: {
      get: vi.fn(async (id: string) => documents[id] ?? null),
      query,
      delete: deleteRow,
      patch,
    },
    scheduler: { runAfter, runAt },
    storage: { delete: deleteStorage },
  };
}

function handler(fn: unknown): (ctx: ReturnType<typeof context>, args: Record<string, unknown>) => Promise<unknown> {
  return (fn as {
    _handler: (ctx: ReturnType<typeof context>, args: Record<string, unknown>) => Promise<unknown>;
  })._handler;
}

const batchArgs = {
  userId: 'user-1',
  deleteAfter: Date.now() + 60_000,
  authIdentifiers: ['parent@example.com'],
  scrubTokens: ['user-1', 'parent@example.com', 'Parent Name'],
  auditCursor: null,
  auditDone: false,
};

describe('child deletion cascade', () => {
  beforeEach(() => {
    authState.userId = null;
  });

  it('allows only the owner—not a shared caregiver—to initiate deletion', async () => {
    authState.userId = 'caregiver-1';
    const ctx = context({
      documents: { 'child-1': { _id: 'child-1', userId: 'owner-1' } },
    });

    await expect(handler(removeChild)(ctx, { id: 'child-1' })).rejects.toThrow('Not found');
    expect(ctx.db.patch).not.toHaveBeenCalled();
    expect(ctx.scheduler.runAfter).not.toHaveBeenCalled();
  });

  it('hides the child immediately and schedules an owner-bound hard delete', async () => {
    authState.userId = 'owner-1';
    const ctx = context({
      documents: { 'child-1': { _id: 'child-1', userId: 'owner-1' } },
    });

    await expect(handler(removeChild)(ctx, { id: 'child-1' })).resolves.toBeNull();
    expect(ctx.db.patch).toHaveBeenCalledWith('child-1', { deletedAt: expect.any(Number) });
    expect(ctx.scheduler.runAfter).toHaveBeenCalledWith(
      0,
      expect.anything(),
      { childId: 'child-1', ownerId: 'owner-1' },
    );
  });

  it('deletes associated records in a bounded pass and reschedules until empty', async () => {
    const ctx = context({
      documents: {
        'child-1': { _id: 'child-1', userId: 'owner-1', deletedAt: Date.now() },
      },
      rows: {
        growthRecords: [{ _id: 'growth-1', childId: 'child-1' }],
        healthRecords: [{ _id: 'health-1', childId: 'child-1' }],
        milestoneResponses: [{ _id: 'response-1', childId: 'child-1', photoStorageId: 'photo-storage-1' }],
      },
    });

    await handler(deleteChildBatch)(ctx, { childId: 'child-1', ownerId: 'owner-1' });
    expect(ctx.db.delete).toHaveBeenCalledWith('growth-1');
    expect(ctx.db.delete).toHaveBeenCalledWith('health-1');
    expect(ctx.db.delete).toHaveBeenCalledWith('response-1');
    expect(ctx.storage.delete).toHaveBeenCalledWith('photo-storage-1');
    expect(ctx.db.delete).not.toHaveBeenCalledWith('child-1');
    expect(ctx.scheduler.runAfter).toHaveBeenCalledWith(0, expect.anything(), {
      childId: 'child-1', ownerId: 'owner-1',
    });
  });

  it('hard-deletes the child only after every linked range is empty', async () => {
    const ctx = context({
      documents: {
        'child-1': { _id: 'child-1', userId: 'owner-1', deletedAt: Date.now() },
      },
    });

    await handler(deleteChildBatch)(ctx, { childId: 'child-1', ownerId: 'owner-1' });
    expect(ctx.db.delete).toHaveBeenCalledWith('child-1');
    expect(ctx.scheduler.runAfter).not.toHaveBeenCalled();
  });
});

describe('account deletion pipeline', () => {
  beforeEach(() => {
    authState.userId = 'user-1';
  });

  it('captures identifiers before cleanup and queues the authenticated account only', async () => {
    const ctx = context({
      documents: {
        'user-1': {
          _id: 'user-1', email: 'parent@example.com', phone: '+959123456', name: 'Parent Name',
        },
      },
      rows: {
        parentProfiles: [{ _id: 'profile-1', userId: 'user-1', displayName: 'Parent Name' }],
      },
    });

    await expect(handler(deleteMine)(ctx, { confirmation: 'DELETE' })).resolves.toBeNull();
    expect(ctx.scheduler.runAfter).toHaveBeenCalledWith(
      5_000,
      expect.anything(),
      expect.objectContaining({
        userId: 'user-1',
        authIdentifiers: ['parent@example.com', '+959123456'],
        scrubTokens: expect.arrayContaining(['user-1', 'parent@example.com', 'Parent Name']),
        auditCursor: null,
        auditDone: false,
      }),
    );
  });

  it('removes storage/auth dependants, anonymizes audit data, and continues batching', async () => {
    const ctx = context({
      documents: { 'user-1': { _id: 'user-1', email: 'parent@example.com' } },
      rows: {
        paymentRequests: [{
          _id: 'payment-1', userId: 'user-1', proofStorageId: 'storage-1', reviewNote: 'Parent Name',
        }],
        milestoneResponses: [{
          _id: 'milestone-response-1', userId: 'user-1', childId: 'child-x', photoStorageId: 'photo-storage-1',
        }],
        mmpayTransactions: [{ _id: 'transaction-1', userId: 'user-1', orderId: 'order-1' }],
        mmpayWebhookEvents: [{ _id: 'webhook-1', orderId: 'order-1' }],
        authAccounts: [{ _id: 'account-1', userId: 'user-1' }],
        authVerificationCodes: [{ _id: 'code-1', accountId: 'account-1' }],
        authRateLimits: [{ _id: 'account-rate-limit-1', identifier: 'account-1' }],
        authSessions: [{ _id: 'session-1', userId: 'user-1' }],
        authRefreshTokens: [{ _id: 'refresh-1', sessionId: 'session-1' }],
        authVerifiers: [{ _id: 'verifier-1', sessionId: 'session-1' }],
        auditLogs: [{
          _id: 'audit-1', actorId: 'user-1', summary: 'parent@example.com approved item',
        }],
      },
    });

    await handler(deleteMineBatch)(ctx, batchArgs);
    expect(ctx.storage.delete).toHaveBeenCalledWith('storage-1');
    expect(ctx.storage.delete).toHaveBeenCalledWith('photo-storage-1');
    for (const id of [
      'payment-1', 'webhook-1', 'code-1', 'account-rate-limit-1', 'refresh-1', 'verifier-1',
      'milestone-response-1',
    ]) {
      expect(ctx.db.delete).toHaveBeenCalledWith(id);
    }
    expect(ctx.db.patch).toHaveBeenCalledWith('audit-1', expect.objectContaining({
      actorId: undefined,
      summary: '[deleted account] approved item',
    }));
    expect(ctx.db.delete).not.toHaveBeenCalledWith('user-1');
    expect(ctx.scheduler.runAfter).toHaveBeenCalledWith(0, expect.anything(), expect.objectContaining({
      userId: 'user-1',
    }));
  });

  it('deletes the user in the final no-work pass after the access-token grace period', async () => {
    const ctx = context({
      documents: { 'user-1': { _id: 'user-1', email: 'parent@example.com' } },
    });

    await handler(deleteMineBatch)(ctx, {
      ...batchArgs,
      deleteAfter: Date.now() - 1,
      auditDone: true,
    });
    expect(ctx.db.delete).toHaveBeenCalledWith('user-1');
    expect(ctx.scheduler.runAfter).not.toHaveBeenCalled();
    expect(ctx.scheduler.runAt).not.toHaveBeenCalled();
  });
});

describe('deletion completeness contracts', () => {
  const account = readFileSync('convex/account.ts', 'utf8');
  const children = readFileSync('convex/children.ts', 'utf8');
  const schema = readFileSync('convex/schema.ts', 'utf8');

  it('covers every child-linked table and never relies on a one-shot fixed cap', () => {
    for (const table of [
      'growthRecords', 'sleepRecords', 'healthRecords', 'vaccinationRecords',
      'medicationRecords', 'milestoneSessions', 'milestoneResponses',
      'activityCompletions', 'appointments', 'observations',
    ]) {
      expect(children).toContain(`query('${table}')`);
      expect(account).toContain(`query('${table}')`);
    }
    expect(children).toContain('internal.children.deleteChildBatch');
    expect(children).not.toContain('.collect()');
    expect(account).not.toContain('.collect()');
  });

  it('covers storage, provider webhooks, cross-account references, auth dependants, and full audit scanning', () => {
    for (const marker of [
      "ctx.storage.delete(row.proofStorageId)",
      "ctx.storage.delete(row.photoStorageId)",
      "query('mmpayWebhookEvents')",
      "query('staffInvites')",
      "query('familyCaregivers')",
      "withIndex('by_email_and_status'",
      "query('contentReviews')",
      "query('contentEditLogs')",
      "query('authVerificationCodes')",
      "query('authRefreshTokens')",
      "query('authVerifiers')",
      "query('authRateLimits')",
      "query('auditLogs').paginate",
      'internal.account.deleteMineBatch',
    ]) {
      expect(account).toContain(marker);
    }
  });

  it('deletes the milestone keepsake photo blob in the single-child erasure worker too', () => {
    expect(children).toContain("ctx.storage.delete(row.photoStorageId)");
  });

  it('defines indexes for every cross-account erasure lookup added by the worker', () => {
    for (const index of [
      "authTables.authVerifiers.index('sessionId'",
      ".index('by_target_user', ['targetUserId'])",
      ".index('by_invited_by', ['invitedBy'])",
      ".index('by_accepted_by', ['acceptedBy'])",
      ".index('by_reviewed_by', ['reviewedBy'])",
      ".index('by_reviewer', ['reviewerId'])",
      ".index('by_verified_by', ['verifiedBy'])",
      ".index('by_editor', ['editorId'])",
    ]) {
      expect(schema).toContain(index);
    }
  });
});
