# Detail illustration candidate set — 2026-09-13

## Status

- Tool: built-in `imagegen`
- Output contract: exact-slug WebP, 1200×900 (4:3), under 500 KiB, SHA-256 prefix in filename
- Intended surface: content detail hero only
- Proposed rendering: exact slug only; no category or age fallback
- Release state: candidate files only; the 19 AI-lane assets are stored outside
  `public/` and are intentionally absent from runtime maps, builds, and PWA caches
  until a revision-bound media review is approved

## Final prompt set

All prompts used the `illustration-story` mode and requested a warm, refined
watercolor-and-gouache Myanmar family scene with natural faces and hands,
safe child-led interaction, edge-safe 4:3 composition, and no text, logo,
watermark, UI, medical diagnosis, or unsafe small objects. Individual scene
briefs were:

- `st_ba_ba_sounds`: caregiver and toddler copying friendly vocal sounds.
- `st_goodnight_moon_friend`: calm bedtime connection with the moon visible.
- `st_sharing_mango`: two children sharing prepared mango with adult supervision.
- `st_taking_turns`: children taking turns rolling one large ball.
- `st_visit_to_doctor`: clinician gently explaining a stethoscope with caregiver present.
- `st_waiting_at_clinic`: caregiver quietly engaging a child while waiting.
- `lsn_big_feelings`: caregiver at eye level supporting a safe upset child.
- `lsn_early_math`: five whole mangoes and large geometric blocks used in play.
- `lsn_making_friends`: two children taking turns with one large ball.
- `lsn_power_of_play`: child-led large-block play with a responsive caregiver.
- `lsn_reading_together`: caregiver and child sharing a picture book.
- `lsn_talk_more`: caregiver following a child's conversational lead.
- `lsn_what_is_development`: several everyday developmental activities without assessment cues.
- `act_picture_story_2_5y`: exactly two large cards; banana and ball choice.
- `act_picture_story_3y`: exactly three large hand-washing sequence cards.
- `act_picture_story_3_5y`: exactly three large bedtime-routine cards.
- `act_picture_story_4y`: exactly three open-ended kite-story cards.
- `act_picture_story_4_5y`: exactly four block-tower story cards.
- `act_picture_story_5y`: exactly four puppy-and-puddle problem-solving cards.
- `gd_2_5y_nutrition`: varied family meal, water, seated child, responsive feeding.
- `gd_2_5y_safety`: safety gate, locked medicine storage, covered outlet, empty bucket.

The complete per-call wording and generated PNG originals remain in the Codex
task's built-in image-generation record. This document records the final
production briefs and the selected derivative identities.

## Selected assets

| Slug | Versioned asset |
| --- | --- |
| `st_ba_ba_sounds` | `docs/image-generation/candidates/2026-09-13/stories/st_ba_ba_sounds.5248d497b0.webp` |
| `st_goodnight_moon_friend` | `docs/image-generation/candidates/2026-09-13/stories/st_goodnight_moon_friend.3277dec574.webp` |
| `st_sharing_mango` | `docs/image-generation/candidates/2026-09-13/stories/st_sharing_mango.2dd66b6393.webp` |
| `st_taking_turns` | `docs/image-generation/candidates/2026-09-13/stories/st_taking_turns.ece7af8fbf.webp` |
| `st_visit_to_doctor` | `docs/image-generation/candidates/2026-09-13/stories/st_visit_to_doctor.510f7446cc.webp` |
| `st_waiting_at_clinic` | `docs/image-generation/candidates/2026-09-13/stories/st_waiting_at_clinic.3d58cc8c4c.webp` |
| `lsn_big_feelings` | `docs/image-generation/candidates/2026-09-13/lessons/lsn_big_feelings.bc16f1bff1.webp` |
| `lsn_early_math` | `docs/image-generation/candidates/2026-09-13/lessons/lsn_early_math.5d079e41dd.webp` |
| `lsn_making_friends` | `docs/image-generation/candidates/2026-09-13/lessons/lsn_making_friends.5342357f4c.webp` |
| `lsn_power_of_play` | `docs/image-generation/candidates/2026-09-13/lessons/lsn_power_of_play.b298071ab2.webp` |
| `lsn_reading_together` | `docs/image-generation/candidates/2026-09-13/lessons/lsn_reading_together.d4ade1d3a7.webp` |
| `lsn_talk_more` | `docs/image-generation/candidates/2026-09-13/lessons/lsn_talk_more.fdb1ea691e.webp` |
| `lsn_what_is_development` | `docs/image-generation/candidates/2026-09-13/lessons/lsn_what_is_development.3dcf39368f.webp` |
| `act_picture_story_2_5y` | `docs/image-generation/candidates/2026-09-13/activities/act_picture_story_2_5y.e12a8d8f05.webp` |
| `act_picture_story_3y` | `docs/image-generation/candidates/2026-09-13/activities/act_picture_story_3y.a49dcf95b8.webp` |
| `act_picture_story_3_5y` | `docs/image-generation/candidates/2026-09-13/activities/act_picture_story_3_5y.5db180fe30.webp` |
| `act_picture_story_4y` | `docs/image-generation/candidates/2026-09-13/activities/act_picture_story_4y.06e23ab395.webp` |
| `act_picture_story_4_5y` | `docs/image-generation/candidates/2026-09-13/activities/act_picture_story_4_5y.8375c98d12.webp` |
| `act_picture_story_5y` | `docs/image-generation/candidates/2026-09-13/activities/act_picture_story_5y.e5ae82b7da.webp` |
| `gd_2_5y_nutrition` | `public/guides/gd_2_5y_nutrition.dd2148478f.webp` |
| `gd_2_5y_safety` | `public/guides/gd_2_5y_safety.09db279d76.webp` |

## QA and exclusions

- Selected assets passed scene, anatomy, cultural-respect, no-text/logo/watermark,
  1200×900 WebP, file-size, unique-hash, and filename-hash checks.
- The six picture-story assets also passed exact card-count checks.
- The 19 AI-lane assets (six activities, seven lessons, six stories) remain
  outside `public/` and unlinked so they cannot be served, precached, or bypass
  the earlier placeholder-only release evidence.
- Existing `lsn_creativity` and `lsn_prepare_preschool` files remain intentionally
  unmapped until the artwork is reviewed against the exact current lesson copy.
- Library/list cards remain on their existing text/emoji design; this candidate
  does not introduce a new list-thumbnail layout.
