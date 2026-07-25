import { query, type MutationCtx } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';
import type { Id } from './_generated/dataModel';
import { isStaff } from './lib/auth';

/**
 * Insert an immutable audit entry. Called from other mutations.
 *
 * `detail` carries the parts a reviewer or an auditor actually needs: what the
 * record looked like before, what it looks like after, and whether the action
 * was carried out or refused.
 *
 * A refusal can only be audited if the mutation still commits. Convex discards
 * every write of a mutation that throws, so a rejection recorded and then
 * thrown would vanish with the throw. Policy refusals therefore log with
 * result 'rejected' and RETURN the refusal to the caller rather than throwing;
 * throws are reserved for malformed calls, where there is nothing to record.
 */
export async function logAudit(
  ctx: MutationCtx,
  actorId: Id<'users'> | null,
  action: string,
  entityTable?: string,
  entityId?: string,
  summary?: string,
  detail?: { result?: 'ok' | 'rejected' | 'failed'; before?: string; after?: string },
) {
  await ctx.db.insert('auditLogs', {
    actorId: actorId ?? undefined,
    action,
    entityTable,
    entityId,
    summary,
    result: detail?.result ?? 'ok',
    before: detail?.before,
    after: detail?.after,
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
