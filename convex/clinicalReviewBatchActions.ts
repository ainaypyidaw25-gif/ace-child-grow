import { getAuthUserId } from '@convex-dev/auth/server';
import { internal } from './_generated/api';
import { action } from './_generated/server';
import {
  clinicalReviewBatchResultValidator,
  type ClinicalReviewBatchResult,
} from './lib/clinicalReviewBatchContract';

/**
 * Public, authenticated read boundary for the frozen clinical batch.
 *
 * This is an action rather than a query because expiry and evidence freshness
 * depend on the server clock. The action supplies that clock to a deterministic
 * internal query, preventing a reactive query cache from serving an assignment
 * after its review date or batch expiry.
 */
export const getAssignedBatch = action({
  args: {},
  returns: clinicalReviewBatchResultValidator,
  handler: async (ctx): Promise<ClinicalReviewBatchResult> => {
    if (!(await getAuthUserId(ctx))) throw new Error('Not authenticated');
    const nowMs = Date.now();
    return await ctx.runQuery(internal.clinicalReviewBatch.readAssignedBatchState, {
      nowMs,
      todayIso: new Date(nowMs).toISOString().slice(0, 10),
    });
  },
});
