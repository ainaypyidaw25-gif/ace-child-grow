import { v } from 'convex/values';
import { internal } from './_generated/api';
import { internalAction } from './_generated/server';
import {
  NATIVE_MYANMAR_REFREEZE_CORRECTION_RELEASE_ID,
  nativeMyanmarRefreezeCorrectionPreflightValidator,
  type NativeMyanmarRefreezeCorrectionPreflight,
} from './lib/nativeMyanmarRefreezeCorrectionData';

/** Server-clock read-only preflight for the bounded Native-Myanmar correction. */
export const preflight = internalAction({
  args: { releaseId: v.literal(NATIVE_MYANMAR_REFREEZE_CORRECTION_RELEASE_ID) },
  returns: nativeMyanmarRefreezeCorrectionPreflightValidator,
  handler: async (ctx): Promise<NativeMyanmarRefreezeCorrectionPreflight> => (
    ctx.runQuery(internal.nativeMyanmarRefreezeCorrection.preflightAt, {
      releaseId: NATIVE_MYANMAR_REFREEZE_CORRECTION_RELEASE_ID,
      checkedAt: Date.now(),
    })
  ),
});
