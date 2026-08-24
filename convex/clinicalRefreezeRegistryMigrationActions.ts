import { internal } from './_generated/api';
import { internalAction } from './_generated/server';
import {
  clinicalRefreezeRegistryPreflightResultValidator,
  type ClinicalRefreezeRegistryPreflightResult,
} from './lib/clinicalRefreezeRegistryMigrationData';

export const preflight = internalAction({
  args: {},
  returns: clinicalRefreezeRegistryPreflightResultValidator,
  handler: async (ctx): Promise<ClinicalRefreezeRegistryPreflightResult> => {
    const nowMs = Date.now();
    return await ctx.runQuery(internal.clinicalRefreezeRegistryMigration.preflightAt, {
      nowMs,
      todayIso: new Date(nowMs).toISOString().slice(0, 10),
    });
  },
});
