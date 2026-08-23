import { getAuthUserId } from '@convex-dev/auth/server';
import { internal } from './_generated/api';
import { action } from './_generated/server';
import {
  clinicalReviewBatchLoadResultValidator,
  type ClinicalReviewBatchLoadResult,
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
  returns: clinicalReviewBatchLoadResultValidator,
  handler: async (ctx): Promise<ClinicalReviewBatchLoadResult> => {
    if (!(await getAuthUserId(ctx))) {
      return {
        status: 'refused',
        code: 'not_authenticated',
        message: 'Sign in with the assigned clinical reviewer account.',
      };
    }
    const nowMs = Date.now();
    return await ctx.runQuery(internal.clinicalReviewBatch.readAssignedBatchState, {
      nowMs,
      todayIso: new Date(nowMs).toISOString().slice(0, 10),
    });
  },
});
