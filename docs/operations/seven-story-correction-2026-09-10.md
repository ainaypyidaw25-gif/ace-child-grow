# Seven-story correction — 10 September 2026

Scope: exact, unpublished fiction corrections. This operation does **not** approve or publish any item, change human decisions, or expand the three-target AI publication policy.

## Baseline and review

Private production packet: `artifacts/seven-story-preflight-20260910/snapshot-1789021939797.json`.
SHA-256: `75d512f5f02975c9291ef0e188eb376fbfed1b61688671b5f8f2878a54c8cc2f`.
Captured 2026-09-10 06:32:19.797 UTC; each target is revision 2, `clinical_review`, with two historical human decisions, three placeholder media rows and no assignments or AI releases.

Targets: `st_little_seed`, `st_ba_ba_sounds`, `st_when_i_feel_angry`, `st_taking_turns`, `st_goodnight_moon_friend`, `st_visit_to_doctor`, `st_sharing_mango`.

Corrections retain fiction framing in both visible language bodies, remove calming/pain/outcome guarantees, correct the Myanmar bedtime title, and place mango preparation with an adult and eating seated under supervision. Only Mango gains an existing choking-prevention source link. No evidence-source review status is changed.

The exact final proposal and independent source/copy review reports remain private under `artifacts/story-release-20260910/`. The compiled manifest pins their hashes and exact field preimages. AI review is not a native-language editor or clinician's signature.

## Static media inspection

The main agent visually inspected both locally mapped images on 2026-09-10. The seed image depicts one rooted plant, not a child handling seeds. The anger image depicts a seated child and supportive adult, without restraint or punishment. Neither contains text, a logo or a watermark. These observations are a narrow visual-safety check, not independent proof of ownership or a clinical endorsement.

| Target | Exact asset | SHA-256 | Production read-back |
|---|---|---|---|
| Little Seed | `public/stories/st_little_seed.46d4e79b59.webp` | `46d4e79b591ccbbca8a78ebea390fa761f3972790381336541c7dfe9da8971e7` | HTTP 200, image/webp, 68,326 bytes; identical at 06:36:21 UTC |
| Angry | `public/stories/st_when_i_feel_angry.939e6bd987.webp` | `939e6bd987e063400148a13e9b81118087858c53f0513cca51f774d0d68a83fe` | HTTP 200, image/webp, 98,158 bytes; identical at 06:36:22 UTC |

`docs/illustration-review/published-stories.md` records generation and Owner approval on 2026-08-09, introduced by commit `c470bac6b2887e9dfc9d4414a289376516ae6ba3`. Its old publication/reviewer assertions are historical, not current publication evidence. The seven-story correction does not alter these assets. Five other target slugs have no bundled story illustration mapping; all 21 captured database media rows are placeholders without URLs. No audio or PDF is represented as reviewed or available.

## Fail-closed operation

1. Compile only the reviewed final proposal hashes; run focused mutation/importer/read-back tests and full repository gates.
2. Deploy code through the normal reviewed branch/CI workflow.
3. Call the exact internal preflight with the release ID, baseline SHA and current observation time. Any drift, assignment, AI state or identity mismatch stops the operation.
4. Apply atomically only when ready. All seven become revision 3 while remaining `clinical_review`; stale reviewer summary fields are cleared, historical decisions remain untouched.
5. Capture again and run `scripts/verify-seven-story-correction.mjs` with the original packet, new packet and final proposal. Verify all seven exact postimages, one timestamp, unchanged sources/history/media and the existing three AI previews/configuration/expiry records.

Do not describe correction completion as final publication. A separately registered, fully reviewed AI fiction release remains necessary before these seven can be parent-readable. Existing clinical and human-review gates remain intact.
