import { query, internalQuery, type MutationCtx } from './_generated/server';
import { v } from 'convex/values';
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

/**
 * The audit trail, for a release check. Read-only, internal, never a browser.
 *
 * A trail nobody can read is not a trail. The staff viewer above needs a staff
 * session, which a CI job or an activation run does not have, so confirming
 * that an import or a refusal was actually recorded would otherwise depend on
 * a human logging in and looking — which is exactly the kind of verification
 * that quietly stops happening.
 */
export const recent = internalQuery({
  args: { action: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 500);
    const rows = args.action
      ? await ctx.db
          .query('auditLogs')
          .withIndex('by_action', (q) => q.eq('action', args.action as string))
          .order('desc')
          .take(limit)
      : await ctx.db.query('auditLogs').order('desc').take(limit);
    const byAction: Record<string, number> = {};
    const byResult: Record<string, number> = {};
    for (const r of await ctx.db.query('auditLogs').collect()) {
      byAction[r.action] = (byAction[r.action] ?? 0) + 1;
      byResult[r.result ?? 'ok'] = (byResult[r.result ?? 'ok'] ?? 0) + 1;
    }
    return {
      total: Object.values(byAction).reduce((a, b) => a + b, 0),
      byAction,
      byResult,
      rows: rows.map((r) => ({
        at: new Date(r._creationTime).toISOString(),
        actor: r.actorId ?? null,
        action: r.action,
        target: r.entityId ? `${r.entityTable ?? '?'}:${r.entityId}` : (r.entityTable ?? null),
        result: r.result ?? 'ok',
        summary: r.summary ?? null,
        before: r.before ?? null,
        after: r.after ?? null,
      })),
    };
  },
});
