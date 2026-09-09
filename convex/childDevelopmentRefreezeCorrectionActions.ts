import { v } from 'convex/values';
import { internal } from './_generated/api';
import { internalAction } from './_generated/server';
import {
  CHILD_DEVELOPMENT_REFREEZE_CORRECTION_RELEASE_ID,
  childDevelopmentRefreezeCorrectionPreflightValidator,
  type ChildDevelopmentRefreezeCorrectionPreflight,
} from './lib/childDevelopmentRefreezeCorrectionData';

/** Server-clock read-only preflight for the bounded child-development correction. */
export const preflight = internalAction({
  args: { releaseId: v.literal(CHILD_DEVELOPMENT_REFREEZE_CORRECTION_RELEASE_ID) },
  returns: childDevelopmentRefreezeCorrectionPreflightValidator,
  handler: async (ctx): Promise<ChildDevelopmentRefreezeCorrectionPreflight> => (
    ctx.runQuery(internal.childDevelopmentRefreezeCorrection.preflightAt, {
      releaseId: CHILD_DEVELOPMENT_REFREEZE_CORRECTION_RELEASE_ID,
      checkedAt: Date.now(),
    })
  ),
});
