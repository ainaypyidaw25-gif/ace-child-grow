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

## Integration (backend: Convex)
Auth/ownership scoping is covered today by static analysis tests that check
every Convex query/mutation derives the caller via `getAuthUserId`/
`requireUser` and scopes reads/writes to that identity
(`src/domain/__tests__/convexAuthGuard.test.ts`, `backendGuards.test.ts`,
`deletion.test.ts`) — this catches a missing ownership check without needing
a live two-account run. **Still needed:** an authenticated end-to-end run
against a real Convex deployment exercising milestone save, result
generation, activity completion, growth/sleep entry, report generation, PDF
export, offline manifest, and admin publishing with two distinct accounts —
this repo's sandboxed test environment cannot open a WebSocket to
`*.convex.cloud`, so it has to run against a real browser + deployment.

## E2E (Playwright — partially implemented, runs in real Chromium)
Implemented + passing: consent → add child → Home; bottom-nav localization;
language switch; **skill-loss → urgent safety banner**. Planned next (needs live
backend for some): full sign-up, activity/growth/sleep entry, report+PDF export,
switch/delete child.

## Security (partial now; full needs backend)
Cross-account access, role escalation, direct-URL access, secret exposure,
public-cache leakage, unsafe HTML, invalid inputs.

## Visual (planned)
Home, Milestones, Activities, Learn, Hope Center, Growth, Sleep, Reports,
Profile, Admin at widths 320/360/375/390/414/430/tablet/desktop.
