import { query, type MutationCtx } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';
import type { Id } from './_generated/dataModel';
import { isStaff } from './lib/auth';

/** Insert an immutable audit entry. Called from other mutations. */
export async function logAudit(
  ctx: MutationCtx,
  actorId: Id<'users'> | null,
  action: string,
  entityTable?: string,
  entityId?: string,
  summary?: string,
) {
  await ctx.db.insert('auditLogs', {
    actorId: actorId ?? undefined,
    action,
    entityTable,
    entityId,
    summary,
  });
}

// Audit viewer — staff/super-admin only. Parents get an empty list (never data).
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId || !(await isStaff(ctx, userId))) return { allowed: false, rows: [] };
    const rows = await ctx.db.query('auditLogs').order('desc').take(200);
    return { allowed: true, rows };
  },
});
