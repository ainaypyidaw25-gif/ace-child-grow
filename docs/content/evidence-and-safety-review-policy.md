# Evidence and Safety Review Policy

## Purpose

ACE Child Grow provides general child-development and parent-education
information. It does not diagnose, prescribe, recommend medication doses or
give individualized treatment. Parent-facing claims must be traceable to
current authoritative public guidance and must pass English, native-Myanmar,
evidence and child-safety review for the exact revision being published.

No personal clinician endorsement is claimed or displayed. Reviewer identities
and qualifications are restricted audit data used for accountability, not
parent-facing promotion.

## Authoritative public evidence

Reviewers verify the exact claim and age band against the most specific current
official source available. Core starting points include:

- [CDC developmental milestones](https://www.cdc.gov/milestones)
- [WHO nurturing care for early childhood development](https://www.who.int/teams/maternal-newborn-child-adolescent-health-and-ageing/child-health/nurturing-care)
- [UNICEF early childhood development](https://www.unicef.org/early-childhood-development)
- [UNICEF and WHO Care for Child Development](https://www.unicef.org/documents/care-child-development)

AAP, NHS, NICE and equivalent official national guidance may also be used when
it is more specific. A homepage link is not enough for a substantive claim:
the evidence mapping must identify the page that supports the wording. If
reliable official guidance materially conflicts or cannot resolve a claim, the
item is not published and is routed for specialist review.

## Publication boundary

1. Non-staff users can read only `libraryContent` rows whose legacy
   `clinicalStatus` value is `published`. Unpublished media and citations remain
   hidden, and offline storage retains published rows only.
2. Ordinary milestones, activities, stories, lessons, printable catalogue
   metadata and general parenting guidance require current-revision English,
   native-Myanmar, evidence and safety decisions. They do not require a
   specialist reviewer merely because parents can read them.
3. Diagnosis, treatment, medication, individualized advice and
   emergency-decision wording require an additional specialist safety review.
   The status shown to reviewers is `SPECIALIST REVIEW REQUIRED` until that
   focused boundary is complete.
4. Bed-sharing wording remains inside the specialist boundary because current
   authoritative public guidance differs materially.
5. The seven slugs in `convex/lib/contentReviewRequirements.ts` are routed for
   their emergency-decision wording only. Their ordinary developmental claims
   receive the same evidence-and-safety review as other educational content.

## Revision and audit controls

Every decision records the reviewer audit identity, role, qualification, note,
timestamp and exact content revision. Editing content increments the revision;
older decisions remain history but cannot authorize the new wording. Publish
attempts, refusals, edits and review decisions remain audit logged.

The schema retains legacy identifiers such as `clinical_review`,
`clinical_reviewer`, `clinicalStatus` and `reviewScope: 'clinical'` for database,
API and audit compatibility. Those identifiers are not parent-facing claims.

## Required statuses

- `EVIDENCE VERIFIED`
- `SAFETY REVIEWED`
- `VERIFIED WITH MINOR EDITS`
- `REVISE`
- `SAFETY BLOCK`
- `SOURCE REQUIRED`
- `SPECIALIST REVIEW REQUIRED`
- `NOT VERIFIED`

## Growth standards

Do not show WHO percentiles or z-scores until an official dataset version is
integrated, sex and exact age are handled, calculations are tested against
official reference cases, and evidence and specialist safety review are
recorded for the implementation.

