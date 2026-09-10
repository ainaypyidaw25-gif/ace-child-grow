# Three reading activities: publisher-attribution correction

## Authorization and scope

The Owner authorized continuing the remaining work in the task on 2026-09-10. This authorizes the exact correction workflow below, not a claim that a human clinician reviewed any content. No human approval is inserted by this operation.

Targets: `act_board_book_point`, `act_lift_the_flap_book`, `act_first_words_book_share`. Change only `data.evidenceSummary` to attribute the existing `hc-early-literacy-2023` link to AAP HealthyChildren instead of Health Canada/Canadian guidance. The [publisher page](https://www.healthychildren.org/English/ages-stages/baby/Pages/Developmental-Milestones-of-Early-Literacy.aspx) was inspected on 2026-09-10; its last-updated date is 2023-09-19, not a new 2026 edition. This correction does not validate all claims or instructions in these activities.

The previous PR deliberately retained these changes as proposals because broad seed import could preserve stale review decisions. This release must use an exact compare-and-swap operation and protect all three slugs from broad import/replay paths. The historical seed bodies and immutable historical release manifests are not rewritten.

## Exact preimage

Read-only capture: `node scripts/capture-attribution-correction.mjs`.

- Private packet: `artifacts/attribution-correction-20260910/snapshot-1789019840005.json`
- Raw packet SHA-256: `450a77cff349969eff9378840d676ba4918e7e2ada3e2583fd978f1de425d7a3`
- Three targets: `clinical_review`, revision 5; zero persisted assignments/batches.
- Historical review-row counts in target order: 0, 2, 0.

Private snapshots remain ignored by Git. The checked-in manifest contains exact hashes and correction text, not raw reviewer records.

## Required execution gates

1. Review the exact code diff, validators, three import guards and synthetic regression tests. Confirm all required CI checks on the exact commit.
2. Inspect deployment preflight before deploying backend code. Do not run seed import, historical errata, or any human review mutation.
3. Run the internal correction preflight with the fixed release ID and packet SHA. Proceed only if every target is `ready`; any content, source, link, review, media, publication or batch drift blocks the whole transaction.
4. Apply once through the exact internal mutation. It must advance current revision 5 to 6, recompute search text, clear current reviewer summary fields and retain `clinical_review`. Preserve all other authored fields, source links, source decisions, append-only human history and all unrelated AI publication state.
5. Independently read back all three targets. Verify exact before/after scope, unchanged historical reviews, unchanged source/link/media/batch records, and one release audit. A second application must be an exact idempotent no-op, not another revision increment.

## Lifecycle boundary

Backend code deployment, correction application and publication are separate outcomes. Even after this correction, all three activities remain unpublished and require the appropriate reviews of revision 6. Earlier 280-item AI reports bind to revision 5 and are historical evidence, not approvals of revision 6. This workflow does not expand the three-target AI-preview allowlist or make the rest of the catalogue production-ready.

Execution results must be recorded only after observed preflight/application/read-back; this runbook itself is not a completion receipt.
