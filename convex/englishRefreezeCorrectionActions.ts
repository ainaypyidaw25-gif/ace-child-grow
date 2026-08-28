import { v } from 'convex/values';
import { internal } from './_generated/api';
import { internalAction } from './_generated/server';
import {
  ENGLISH_REFREEZE_CORRECTION_RELEASE_ID,
  englishRefreezeCorrectionPreflightValidator,
  type EnglishRefreezeCorrectionPreflight,
} from './lib/englishRefreezeCorrectionData';

/** Server-clock read-only preflight for the bounded English correction. */
export const preflight = internalAction({
  args: { releaseId: v.literal(ENGLISH_REFREEZE_CORRECTION_RELEASE_ID) },
  returns: englishRefreezeCorrectionPreflightValidator,
  handler: async (ctx): Promise<EnglishRefreezeCorrectionPreflight> => (
    ctx.runQuery(internal.englishRefreezeCorrection.preflightAt, {
      releaseId: ENGLISH_REFREEZE_CORRECTION_RELEASE_ID,
      checkedAt: Date.now(),
    })
  ),
});
