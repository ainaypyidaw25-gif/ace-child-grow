import { v } from 'convex/values';
import { internal } from './_generated/api';
import { internalAction } from './_generated/server';
import {
  SKIN_TO_SKIN_REFREEZE_CORRECTION_RELEASE_ID,
  skinToSkinRefreezePreflightResultValidator,
  type SkinToSkinRefreezePreflightResult,
} from './lib/skinToSkinRefreezeCorrectionData';

/** Server-clock read-only operator preflight; it never trusts a caller-supplied date. */
export const preflight = internalAction({
  args: { releaseId: v.literal(SKIN_TO_SKIN_REFREEZE_CORRECTION_RELEASE_ID) },
  returns: skinToSkinRefreezePreflightResultValidator,
  handler: async (ctx): Promise<SkinToSkinRefreezePreflightResult> => (
    ctx.runQuery(internal.skinToSkinRefreezeCorrection.preflightAt, {
      releaseId: SKIN_TO_SKIN_REFREEZE_CORRECTION_RELEASE_ID,
      checkedAt: Date.now(),
    })
  ),
});
