# Pending catalogue review — 2026-09-10

## Scope and lifecycle

The Owner requested completion of remaining reviews and necessary work. Three independent AI agents read the captured full bilingual bodies and authored metadata for all 280 pending items: 76 milestones, 87 guides, 57 activities, 16 lessons, 13 special-needs pages, 7 stories and 24 printable records. This is preparatory AI review, not qualified human review or authorization to publish those records.

The private full-fields packet is `artifacts/review-backlog-20260910/snapshot-1789016772788.json`, SHA-256 `c106db97ec877acd3856851d68f84d969fc1b51eaf8101da75b4260f99ebbf16`. Every report binds to this exact packet and each content revision/hash. The earlier packet omitted age and other authored metadata and is not the final review binding. Linked publisher text verification is limited to the sources actually enumerated in each agent report; paid full chapters, physical child assessment and real media payload approval were not performed.

The local-versus-production authored-field comparison found 139 items with seed differences and no missing seed rows. A difference is an editorial proposal, not permission to import all seed content. Preserve frozen review provenance and create new review revisions for changed wording. Do not recycle previous human sign-offs for new text.

## AI preparatory dispositions

| Primary finding | Count |
| --- | ---: |
| Needs correction | 159 |
| Needs further source verification | 47 |
| Needs specialist review | 25 |
| AI preparatory pass only | 49 |
| Total | 280 |

These are mutually exclusive primary findings, not completed publication gates. Existing clinical requirements on 44 records in this 280-item packet overlap these groups. The earlier 282-item inventory counted 46 before the two stories left the pending queue. The 49 preparatory passes retain all missing human-review requirements and the reports' source/media verification limits. They are not release-ready approvals.

Code verification after the attribution correction: 2,384 Vitest tests passed, build and lint passed, and 10 additional local node integrity/comparison tests passed. Initial seed parity failure was fixed by canonical regeneration of only the three targets' derived search text; no other seed record was changed.

## Concrete findings and current correction state

- The unpublished `gd_birth_2m_nutrition` r6 Burmese honey warning says 6 months, whereas English and the current authored seed say 12 months. CDC's current food guidance supports the 12-month restriction. A browser form attempt was not saved and was discarded; independent production read-back confirmed r6 and the old wording unchanged. **Do not call this corrected in production.**
- Unpublished guides contain choking-material, cord, sleep-surface and bilingual terminology issues. Reports identify exact fields, before/after proposals and current seed comparisons. These are not complete release payloads.
- Milestone age claims and special-needs treatment/referral copy require targeted source or specialist review. The packet's 44-item clinical classification is not an exhaustive medical risk assessment.
- All 24 pending printables were reviewed as metadata/preview records only. The actual printable payloads were not available in the captured packet, so no actual PDF/tool review is claimed.
- Corrected AAP/HealthyChildren publisher attribution in the local authored and generated seeds for `act_board_book_point`, `act_lift_the_flap_book` and `act_first_words_book_share`. Only three evidence-summary strings and their derived generated `searchText` values changed. No status, revision, approval, source-link or history changes were made. This does not update production data.

## Repeatable local checks

1. `node scripts/capture-review-backlog-20260910.mjs` — bounded read-only content/review metadata snapshot; no customer records or credentials are captured.
2. `node scripts/review-backlog-worklist.mjs <exact-snapshot-path>` — local seed comparison, no import capability.
3. `node scripts/assemble-review-backlog.mjs <exact-snapshot-path> <guides-report> <milestones-special-report> <learning-report>` — require complete unique coverage, actual content hashes, exact packet/source binding and non-human review attribution.
4. `node --test scripts/review-backlog-worklist.test.mjs scripts/assemble-review-backlog.test.mjs` — synthetic fixtures only; rejects tampered content, source/link drift, duplicate/missing targets and false human approvals.
5. `node scripts/audit-published-risk-phrases.mjs` — read-only narrow literal-phrase regression scan, not a clinical audit.

The narrow production scan at 2026-09-10T05:27:23.243Z checked 105 stored-published rows for four specific known bad phrases and found zero matches. This is not proof that all published text is medically safe. The existing published content and three active AI previews were not changed during this review turn.

## References for identified corrections

- [CDC: Foods and Drinks to Avoid or Limit](https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/foods-and-drinks-to-avoid-or-limit.html)
- [CPSC: Small Parts and Choking Hazard FAQs](https://www.cpsc.gov/FAQ/Small-Parts-and-Choking-Hazard-Labeling-FAQs)
- Each private agent report records the other primary sources actually inspected and the remaining verification limits.

## Remaining gates

Reconcile and independently review exact correction payloads, preserve/change frozen batches through their proper Owner correction/refreeze workflow, obtain missing human decisions where required, validate real printable/media payloads, then run publication preflight and parent-readable postflight. AI preparatory passes do not expand the existing three-target AI publication lane. No additional lessons were published and no human approvals were entered in this remediation pass.
