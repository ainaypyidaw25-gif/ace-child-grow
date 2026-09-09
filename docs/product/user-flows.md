# User Flows

## Parent onboarding
Welcome → Sign up → Parent consent (recorded with privacy-notice version) →
Onboarding → Add child (nickname, birth date, gestational weeks if premature) →
Home.

## Milestone review
Home/Journey → Milestone checklist (one milestone per step on mobile) → answer
Yes / Sometimes / Not Yet / Not Sure per item, with optional note → mandatory
skill-loss question → Save → **rule-based result** (Green/Yellow/Orange/Red) with
strengths, emerging skills, suggested activities, repeat-review timing, consult
guidance, questions for a professional, and a non-diagnostic disclaimer.

Implemented as a working demo in `src/screens/MilestoneDemo.tsx`, wired to the
real `computeResult` + `evaluateSafety` engines.

## Urgent safety (interrupt)
If the skill-loss question is "Yes", or any fixed urgent symptom is confirmed,
the deterministic safety engine fires **before** any reassuring result: it saves
the concern, shows the fixed emergency message (no fabricated numbers), and makes
the next action clear.

## Growth & sleep
Add measurement (kg/lb, cm/in — validated conversion, stored normalized) → history
+ charts, honest empty states. Sleep: bedtime/wake (across midnight), naps,
waking, breathing flags → summary; breathing pauses/difficulty raise a fixed
safety flag.

## Reports
Generate from stored data only: Parent Monthly Summary, Doctor Visit Summary,
Share-safe Summary (no sensitive notes) → Myanmar-compatible PDF (planned module).

## Admin evidence and safety review
Draft → English Review → Native-Myanmar Review → Evidence Review → Safety
Review → Specialist Safety Review (only when risk-triggered) → Published →
Archived, with revision binding and audit logging.
