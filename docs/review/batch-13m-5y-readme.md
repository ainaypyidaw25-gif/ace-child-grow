# ACE Child Grow 13 months–5 years review batch

The generated tracker at `docs/review/batch-13m-5y-tracker.csv` is the publication gate for the older-child draft baseline.

- Every row defaults to **not reviewed**, **not approved**, and **not eligible for publication**.
- Empty reviewer and date fields are intentional. They may be filled only from a recorded review.
- `clinical_review` in the content library means review is pending; it is not approval.
- Regenerate the tracker after seed changes with `node scripts/generate-13m-5y-review-tracker.mjs`.
  Existing rows are merged by `content_id`: human review fields are preserved,
  new items receive the safe defaults above, and removed IDs remain at the end
  as an unchanged audit trail until a reviewer explicitly retires them.
- Technical verification does not replace native-Myanmar, evidence, safety, or qualified clinical review.
