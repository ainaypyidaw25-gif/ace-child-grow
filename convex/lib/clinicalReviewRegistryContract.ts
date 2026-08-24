import { v, type Infer } from 'convex/values';

export const CLINICAL_REVIEW_REGISTRY_MAX_ITEMS_PER_BATCH = 25;

const persistedBatchStatusValidator = v.union(
  v.literal('frozen'),
  v.literal('active'),
  v.literal('stopped_changes_requested'),
  v.literal('completed'),
  v.literal('invalidated'),
);

export const activationReadinessValidator = v.union(
  v.literal('not_materialized'),
  v.literal('blocked_persisted_mismatch'),
  v.literal('blocked_assignment_mismatch'),
  v.literal('blocked_current_receipt_present'),
  v.literal('already_active'),
  v.literal('already_completed'),
  v.literal('stopped_changes_requested'),
  v.literal('invalidated'),
  v.literal('blocked_active_batch_exists'),
  v.literal('blocked_expired'),
  v.literal('awaiting_predecessor_completion'),
  v.literal('awaiting_predecessor_receipt'),
  v.literal('blocked_predecessor_mismatch'),
  v.literal('blocked_upstream_receipt_consumed'),
  v.literal('blocked_live_preflight'),
  v.literal('blocked_refreeze_requires_exact_confirmation'),
  v.literal('ready_initial'),
  v.literal('ready_after_handoff'),
);

export const ownerRegistryStatusValidator = v.object({
  registryDigest: v.string(),
  registryCode: v.union(v.literal('valid'), v.literal('invalid')),
  materializationCode: v.union(
    v.literal('materialization_required'),
    v.literal('materialized_exact'),
    v.literal('blocked_persisted_mismatch'),
  ),
  registeredReleaseCount: v.number(),
  persistedBatchCount: v.number(),
  persistedAssignmentCount: v.number(),
  releases: v.array(v.object({
    batchId: v.string(),
    sequence: v.number(),
    dimension: v.union(
      v.literal('clinical'),
      v.literal('child_development'),
      v.literal('evidence'),
      v.literal('safety'),
    ),
    activationKind: v.union(
      v.literal('initial'),
      v.literal('after_handoff'),
      v.literal('after_changes_requested_refreeze'),
    ),
    freezeDigest: v.string(),
    itemCount: v.number(),
    expiresAt: v.number(),
    persistedStatus: v.union(persistedBatchStatusValidator, v.null()),
    persistedBatchRows: v.number(),
    persistedAssignmentRows: v.number(),
    persistedReceiptRows: v.number(),
    registrationExact: v.boolean(),
    assignmentsExact: v.boolean(),
    readinessCode: activationReadinessValidator,
  })),
  currentActivation: v.union(v.null(), v.object({
    batchId: v.string(),
    freezeDigest: v.string(),
    expectedUpstreamReceiptDigest: v.union(v.string(), v.null()),
    confirmationText: v.string(),
    readinessCode: v.union(v.literal('ready_initial'), v.literal('ready_after_handoff')),
  })),
});

export type OwnerRegistryStatus = Infer<typeof ownerRegistryStatusValidator>;
export type ActivationReadiness = Infer<typeof activationReadinessValidator>;
