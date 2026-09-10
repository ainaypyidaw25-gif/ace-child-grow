# Publication backlog — read-only inventory

Captured 2026-09-10T03:58:06.559Z from production using `node scripts/publication-backlog-audit.mjs`. This is a bounded metadata/review audit, not clinical review or publication authorization evidence.

| Catalogue state | Count |
| --- | ---: |
| Total | 445 |
| Stored published | 90 |
| Active AI record (early math) | 1 |
| Retired / archived, not to reactivate | 57 |
| Remaining pending | 297 |
| Pending with specialist-risk classification | 60 |

Among pending records, current-revision review gaps overlap: English 256, Myanmar 251, child development 282, evidence 281, safety 282, clinical 46. All pending records passed the ordinary linked-source eligibility test at this snapshot; source eligibility alone is not content approval. Risk classification is code-based triage, not an independent clinical assessment. Stored published and active AI counts do not independently establish current parent visibility.

## Existing decisions: candidates for final gate checks

These 15 have no missing ordinary current-revision decisions and pass ordinary evidence eligibility. They still require exact frozen batch/assignment/completion provenance, any media checks, and Owner publication authority; do not manufacture missing signatures or bypass those gates.

- `gd_5_6m_nutrition` r11
- `gd_birth_2m_sleep` r7
- `act_story_sequence` r2
- `act_skin_to_skin_calm` r6
- `gd_7_9m_nutrition` r6
- `gd_10_12m_nutrition` r11
- `gd_13_18m_safety`, `gd_19_24m_safety`, `gd_2y_safety`, `gd_2_5y_safety` r10
- `gd_3y_safety`, `gd_3_5y_safety`, `gd_4y_safety`, `gd_4_5y_safety`, `gd_5y_safety` r9

## Separate AI educational lane

The reviewed allowlist permits only early math and two fictional stories. The two stories require a fresh exact release with independently audited sources/copy, explicit AI disclosure, bounded expiry and no changes to human review history. The old September 9 successor is permanently blocked diagnostic evidence and must not be activated. Source correction for school must preserve the old human-reviewed source while creating a new honestly qualified metadata record; app age categorization must not be represented as the publisher's numeric age range.

This inventory is a snapshot, not an all-content release. Re-run it after publication. Neither a status change nor a successful deployment substitutes for live parent-readable postflight.

## Subsequent ordinary publication

Independent frozen-provenance audit at 2026-09-10T04:00:13.245Z passed all 15 candidates: 14 exact governed six-dimension batches and one ungoverned activity. The existing authenticated qualified Owner session in Safari then published each target individually through `/admin/library` (`library:setReview`). Every result was read back in the UI, ending at 105 stored-published records (up from 90), with no new review approvals entered. This is ordinary publication based on existing decisions, not AI reclassification. Separate backend and parent-route postflight is recorded after those checks complete.

Independent backend postflight completed at 2026-09-10T04:07:01Z: all 15 published, revisions unchanged, education-scoped final publication, frozen provenance allowed, and the unchanged `contentIsParentReadable` implementation returned true for every target using bounded live source/link/batch snapshots. Batch counts remained 15 batches, 170 assignments, 11 receipts and 145 batch-review rows; 165 target `contentReviews` contained zero new or updated/reviewed timestamps since 03:58:06Z. No saved preimage supports a byte-for-byte assertion for all historical fields. Live parent-facing `gd_5_6m_nutrition` displayed its full guide and citation links after publication.
