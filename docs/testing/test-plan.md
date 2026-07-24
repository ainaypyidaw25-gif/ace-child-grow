# Test Plan

## Unit (implemented — Vitest)
- **Age engine:** exact birthdays, month boundaries, leap years, future dates
  (throws), invalid dates (throws).
- **Corrected age:** full-term (no correction), prematurity subtraction, never
  negative, past-cutoff stop, invalid gestational age (throws).
- **Rule engine:** Green/Yellow/Orange/Red paths, repeated-concern escalation,
  RED override from safety, skill-loss → RED, "not sure" neutrality, no numeric
  disease score exposed.
- **Safety engine:** no-trigger, single symptom, skill loss, unknown-symptom
  robustness, no fabricated phone numbers.
- **Sleep:** across-midnight, same-day, equal-time edge, nap summation, urgent
  breathing flag, malformed input (throws).
- **Unit conversion:** kg↔lb, cm↔in round-trips, storage normalization,
  non-positive/non-finite rejection.
- **Localization completeness:** mm/en key parity, no empty values, default mm.
- **Content safety:** no sample content marked `published`; valid age ranges;
  every activity has a safety note.

## Component (implemented — Testing Library)
- Milestone checklist renders the four Myanmar answers, shows the Clinical Review
  badge, and advances on answer.

## Integration (planned — needs live Supabase)
Auth, child ownership (cross-account denial), milestone save, result generation,
activity completion, growth/sleep entry, report generation, PDF export, offline
manifest, admin publishing.

## E2E (planned — Playwright)
Sign up → consent → onboarding → add child → complete checklist → result →
skill-loss warning → activity → growth → sleep → report → PDF → switch language →
switch child → delete child.

## Security (partial now; full needs backend)
Cross-account access, role escalation, direct-URL access, secret exposure,
public-cache leakage, unsafe HTML, invalid inputs.

## Visual (planned)
Home, Milestones, Activities, Learn, Hope Center, Growth, Sleep, Reports,
Profile, Admin at widths 320/360/375/390/414/430/tablet/desktop.
