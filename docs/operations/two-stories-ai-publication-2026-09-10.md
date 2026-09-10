# Two-story AI educational publication — 2026-09-10

This is the bounded successor for `st_waiting_at_clinic` and `st_first_day_school`. It does not approve a clinical batch, impersonate a reviewer, expand the three-item AI allowlist or publish the whole catalogue.

Actual independent reviews: bilingual copy/safety by `publication_gate_audit` at 2026-09-10T03:55:16Z; clinic source by `two_story_source_review` at 03:57:19Z; exact corrected school-source metadata at 03:58:28Z. The immutable artifact records limitations, hashes and these actual reports. Neither constitutes clinician or native-language-editor approval.

## Source correction

The existing human-reviewed `us-hhs-head-start-first-day-jitters-2024` source is immutable in this operation. Stage creates `us-hhs-head-start-first-day-jitters-metadata-2026` with unknown numeric age bounds, a qualified historical 2024 update date and no human reviewer identity. The ID year indicates retrieval/correction, not a 2026 publication edition. Only the school link changes, and school revision 2 becomes 3; the story text and all human history are preserved. Clinic copy/link/source remain unchanged at revision 3. All six media rows must remain the captured placeholders.

The data file pins the exact bounded production preimage (configuration generation 3 enabled, one active math release, both revoked predecessor releases, source/link/content/history/media digests). Hashes ending `FullHash` for queried collections bind the entire ordered array, including row identity, timestamps and human metadata, without committing private raw snapshots.

## Release gates

Do not infer live publication from code or this document. Commit, review and deploy the exact implementation first. Preserve the active math release and its existing scheduled expiry; do not disable/re-enable the global switch.

1. Read-only: `node scripts/two-stories-ai-publication-20260910.mjs`. Require `ready`, math unchanged/readable, generation 3, one active release, both stories hidden. If any exact preimage differs, stop and investigate; do not refresh constants to bypass a real drift.
2. One mutation: `node scripts/two-stories-ai-publication-20260910.mjs --stage`. Archives six AI audit rows and the corrected school source/link/revision. It creates no publication release rows/pointers. Require `staged`, one active math release and both stories hidden.
3. Independent read-only check, then `node scripts/two-stories-ai-publication-20260910.mjs --activate`. Atomically inserts the two new release rows and pointers without modifying math, configuration or human review decisions. Require `enabled`, exactly three active AI items and both stories parent-readable.
4. Read-only again. Inspect the exact scheduled function ID recorded in the `library.ai_two_stories.enabled` audit log. It must be pending for `aiTwoStoriesPublication20260910:expire`, with the exact release root and the compiled cutoff of 2026-10-10T00:00:00Z.
5. Open both live story URLs in Myanmar and English, verify the separate AI-only notice, fictional framing, source links, and list/offline metadata. The six database media rows are placeholders, but the school story also has a bundled static illustration. Do not conflate those layers.

Additional root visual inspection on 2026-09-10: bundled school illustration `/stories/st_first_day_school.a440d58f45.webp` (SHA-256 `a440d58f4570b27b1e7ae1d1231b6accdd3dbb645382e0fb7f2d782e39ef1cfb`) depicts two children drawing together with a welcoming adult; no evident safety or narrative mismatch was observed. This is an AI visual check, not a human/media clinical approval. The immutable source/copy audit artifact does not claim this later visual check, and runtime source/content hashes do not bind future changes to static image assets.

The operator saves private `0600` before/result/after receipts under `artifacts/two-stories-20260910/`. On an uncertain mutation response, inspect state before retrying. Never submit another mutation merely because a network response failed.

## Expiry and withdrawal

The visibility cutoff is the earlier date-based audit boundary (2026-10-10T00:00:00Z), less than 30 days from the audit. A single scheduled transaction revokes only these two release IDs and clears only their matching pointers. This write invalidates reactive cached parent reads. An early expiry call fails; a repeated expiry is idempotent; a newer content pointer is preserved. Offline downloads can remain available until the device reconnects.

Source or content drift fails the runtime snapshot gate. Historical frozen artifacts, source approvals, human content reviews and old revoked releases are never rewritten. Any later seed/link import that restores the old school source will therefore hide the story until deliberately re-audited, not silently inherit this audit.
