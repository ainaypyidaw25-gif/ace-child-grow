# Myan Myan Pay stacked purchase/refund reconciliation

Base inspected: main `187b06665e4894fda2f7008139be40216381da21`.
Related finding: ace-child-grow PR #201, review thread PRRT_kwDOTiv6Fs6dX9-Y.

## Behavior

Each new successful provider order stores immutable granted start/end timestamps,
refund-adjusted start/end timestamps, and a stack ID. The subscription remains the
aggregate access projection; providerSubscriptionId remains a last-provider-order
reference and is never the refund authorization key.

A refund removes only that order's unused time: max(0, min(subscription end, order
end) - max(refund time, order start)). Later successful orders in the same stack
move earlier by this amount; their immutable original grant bounds stay intact.
This compacts a refunded extension while retaining the remaining duration of other
purchases. Fully consumed order time is not subtracted again. Manual verified
same-plan extensions retain the stack ID and their time remains in the aggregate.
Plan changes, expired/new passes, owner replacement grants and provider syncs
isolate prior stacks, so old refunds cannot revoke replacement access.

Provider terminal-status and webhook nonce guards continue to make success and
refund replay idempotent. All payment status, access, bound adjustment and audit
writes occur in one Convex mutation transaction. Reads use an index and take(1001);
more than 1000 later rows fails atomically for separate batched reconciliation,
instead of committing a truncated result. No new table or scheduled job is needed.

## Schema and historical data impact

All new fields on subscriptions and mmpayTransactions are optional. One index is
added on stack ID and adjusted start. Existing documents remain schema-compatible;
no mandatory backfill is needed to deploy the forward correction. Payment and
subscription records are not deleted, and no old order intervals are inferred.

Historical successful orders lack their application-time contribution bounds.
completedAt is not an authoritative entitlement ledger; planInterval is optional
for legacy rows, plans can change, manual payments contribute time, and subscription
providerSubscriptionId retains only the newest provider order. The current code
therefore cannot safely reconstruct every historical stack from aggregate state.
Automatic backfill would risk revoking valid access.

Refunds of untracked historical orders record provider REFUNDED, removedMs=0 and
refundReconciliation=legacy_unresolved, with a rejected reconciliation audit entry;
access remains intact for owner reconciliation. Duplicate updates do not retry or
subtract later. This can retain refunded legacy time until reviewed. Known new
order refunds preserve any pre-existing untracked baseline. Previously refunded
orders whose access was already removed by the old code are not automatically
restored by this patch. These are deliberate limitations, not historical fixes.

## Release gate and proposed historical reconciliation

No production deployment, schema push, data migration or backfill is authorized
by this patch. Before release, export/backup production and perform a read-only,
paginated inventory of successful/refunded orders, interval snapshots, approval
and provider-update audits, manual approved requests and subscriptions. Identify
legacy stacked/mixed accounts and existing incorrect downgrades. Produce a
per-account proposed before/after ledger with evidence and uncertainty flags.
Require owner review for ambiguous allocation or restoration; do not derive
historical bounds from current plan settings or latest provider ID. Execute any
approved backfill in bounded, replay-safe batches with dry-run parity and backup.
Legacy refunds already committed as REFUNDED require a dedicated approved
reconciliation operation; replaying provider callbacks will not backfill them.

## Validation

- Targeted entitlement/security tests: 29 passed (15 new order reconciliation cases).
- Full Vitest suite: 289 files, 3042 tests passed.
- Application typecheck and explicit Convex project typecheck passed.
- Repository lint and production build passed.
- git diff --check passed.

The regression handlers use the repository's mock-context test pattern, with
snapshot reads matching Convex semantics. They do not prove live provider delivery
or production schema deployment. Live verification and production rollout remain
separate release steps.
