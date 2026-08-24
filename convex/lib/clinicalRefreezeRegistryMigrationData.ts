import { v, type Infer } from 'convex/values';

export const CLINICAL_REFREEZE_REGISTRY_MIGRATION_ID =
  '2026-08-24-clinical-newborn-refreeze-registry-v1' as const;

export const CLINICAL_REFREEZE_REGISTRY_PREIMAGE = {
  batchesCount: 3,
  batchesCanonicalSha256: '630261ffb895a0063df7a34d70749b013eece9610263802fab5eea41fd74617f',
  assignmentsCount: 14,
  assignmentsCanonicalSha256: 'da82ac1e4b32d6f79bb585282114646c31710fc292ba098936dcd2c67f207260',
  receiptsCount: 0,
  receiptsCanonicalSha256: '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
  rootBatchId: 'clinical-newborn-skin-sleep-2026-08-23-v1',
  rootStatus: 'stopped_changes_requested',
  rootDecisionSetDigest: '8ab9e57e7f147fe1cfdc24ff3dfe84972fe4ee46aba62d267810f711d5b80d41',
  nutritionBatchId: 'clinical-infant-nutrition-2026-08-24-v1',
  nutritionSequence: 3,
  nutritionRoutingDigest: 'aa3921695d695a746d8713b03b9e49f0a9b60e239d988ce8d0b513195ff962b7',
  nutritionPredecessorBatchId: 'clinical-newborn-skin-sleep-2026-08-23-v1',
  nutritionExpectedUpstreamStateDigest: 'db3036076969eb8934acc46b8ce7ef3ec85036c4a737606cea96d9cadeb0aa7d',
  safetyBatchId: 'clinical-older-safety-2026-08-24-v1',
  safetySequence: 4,
  safetyRoutingDigest: '2ec77cf490c5160b13133cb7522f5d884630a3db185a838e9cfd85edb1acff47',
} as const;

export const CLINICAL_REFREEZE_CORRECTION_AUDIT = {
  action: 'release.skin_to_skin_refreeze_correction',
  id: 'j57act7q160mcpyqsthkcvxg8n8d24je',
  creationTime: 1787580868713.7222,
  canonicalSha256: '8d2e29eb82a0487108d3b08da0e37b2c469877172717884304ee07b2902dc9fb',
} as const;

export const clinicalRefreezeRegistryPreflightResultValidator = v.object({
  releaseId: v.literal(CLINICAL_REFREEZE_REGISTRY_MIGRATION_ID),
  phase: v.union(v.literal('ready'), v.literal('blocked'), v.literal('applied')),
  checkedAt: v.number(),
  todayIso: v.string(),
  blockers: v.array(v.string()),
  migrationAuditRows: v.number(),
  migrationAuditExact: v.boolean(),
  migratedAt: v.union(v.number(), v.null()),
  correctionAuditExact: v.boolean(),
  predecessorDecisionSetExact: v.boolean(),
  compileRegistryExact: v.boolean(),
  currentRegistryExact: v.boolean(),
  refreezeInputsExact: v.boolean(),
  releaseBatchRows: v.number(),
  assignmentRows: v.number(),
  receiptRows: v.number(),
});

export type ClinicalRefreezeRegistryPreflightResult =
  Infer<typeof clinicalRefreezeRegistryPreflightResultValidator>;

export const clinicalRefreezeRegistryApplyResultValidator = v.object({
  releaseId: v.literal(CLINICAL_REFREEZE_REGISTRY_MIGRATION_ID),
  applied: v.boolean(),
  alreadyApplied: v.boolean(),
  batchesInserted: v.number(),
  assignmentsInserted: v.number(),
  batchesRewired: v.number(),
  dataRowsChanged: v.number(),
  publicationDecisionMade: v.literal(false),
  migratedAt: v.number(),
});
