import linkPreimagesJson from './remainingPseudoMilestoneRetirementLinks.json';
import {
  REMAINING_PSEUDO_MILESTONE_RETIREMENT_RELEASE_ID as CENTRAL_RELEASE_ID,
  REMAINING_PSEUDO_MILESTONE_RETIREMENT_SLUGS as CENTRAL_RETIREMENT_SLUGS,
} from './contentRetirements';

export const REMAINING_PSEUDO_MILESTONE_RETIREMENT_RELEASE_ID =
  CENTRAL_RELEASE_ID;

type ContentPreimage = {
  id: string;
  type: 'milestone';
  slug: string;
  expectedClinicalStatus: 'published' | 'clinical_review';
  expectedReviewRevision: number;
  expectedUpdatedAt: number;
};

type LinkPreimage = {
  _id: string;
  kind: 'milestone';
  slug: string;
  sourceIds: string[];
  updatedAt: number;
};

export type RemainingPseudoMilestoneMediaPreimage = {
  id: string;
  creationTime: number;
  contentSlug: string;
  kind: 'animation';
  accessLevel: 'premium';
  licenseType: string;
  note: string;
  offline: true;
  placeholder: true;
  reviewStatus: 'planned';
  rightsOwner: string;
  sortOrder: number;
};

/** Exact read-only production content preimages captured on 2026-08-21. */
const CONTENT_PREIMAGES: readonly ContentPreimage[] = [
  { id: 'kx7csw1jbt3n9nnhm5nn7jgnf98brqsa', type: 'milestone', slug: 'ms_13_18m_safety_1', expectedClinicalStatus: 'clinical_review', expectedReviewRevision: 1, expectedUpdatedAt: 1_786_432_330_925 },
  { id: 'kx75e3ktf4gde0svyr5s9kj9k18bsjh0', type: 'milestone', slug: 'ms_19_24m_safety_1', expectedClinicalStatus: 'clinical_review', expectedReviewRevision: 1, expectedUpdatedAt: 1_786_432_330_925 },
  { id: 'kx78n29vt3p2hsyn1qs7whj88d8brddn', type: 'milestone', slug: 'ms_2y_safety_1', expectedClinicalStatus: 'clinical_review', expectedReviewRevision: 2, expectedUpdatedAt: 1_786_432_330_925 },
  { id: 'kx7ackwpzmg2yzxzw9t3x7aqjh8braph', type: 'milestone', slug: 'ms_2_5y_safety_1', expectedClinicalStatus: 'clinical_review', expectedReviewRevision: 1, expectedUpdatedAt: 1_786_432_330_925 },
  { id: 'kx7bt17vsedx8bstzb35vvns3h8bre2k', type: 'milestone', slug: 'ms_3y_safety_1', expectedClinicalStatus: 'clinical_review', expectedReviewRevision: 2, expectedUpdatedAt: 1_786_432_330_925 },
  { id: 'kx77dw1wsw7vdz81qgkz5km7qd8br4jm', type: 'milestone', slug: 'ms_3_5y_safety_1', expectedClinicalStatus: 'clinical_review', expectedReviewRevision: 1, expectedUpdatedAt: 1_786_432_330_925 },
  { id: 'kx70y9ma1fjty2yyz4vkngf9ah8bsa44', type: 'milestone', slug: 'ms_4y_safety_1', expectedClinicalStatus: 'clinical_review', expectedReviewRevision: 1, expectedUpdatedAt: 1_786_432_330_925 },
  { id: 'kx70e561vksbt1q169kpxs26s18brg43', type: 'milestone', slug: 'ms_4_5y_safety_1', expectedClinicalStatus: 'clinical_review', expectedReviewRevision: 1, expectedUpdatedAt: 1_786_432_330_925 },
  { id: 'kx74qm5awjyd8x88ftdpsg2fcn8bsa0y', type: 'milestone', slug: 'ms_5y_safety_1', expectedClinicalStatus: 'clinical_review', expectedReviewRevision: 1, expectedUpdatedAt: 1_786_432_330_925 },
  { id: 'kx79py7bt48w67zver9gg78p9s8bsj2n', type: 'milestone', slug: 'ms_5y_safety_2', expectedClinicalStatus: 'clinical_review', expectedReviewRevision: 1, expectedUpdatedAt: 1_786_432_330_925 },
  { id: 'kx7dj4dxy4mhcnnpf387n3jvq98brg96', type: 'milestone', slug: 'ms_5y_safety_3', expectedClinicalStatus: 'clinical_review', expectedReviewRevision: 1, expectedUpdatedAt: 1_786_432_330_925 },
  { id: 'kx7e002h733mvs9k8vrqv3084d8b9wag', type: 'milestone', slug: 'ms_4y_gross_motor_1', expectedClinicalStatus: 'published', expectedReviewRevision: 2, expectedUpdatedAt: 1_786_633_192_619 },
  { id: 'kx7cd4jmdessnwy1c7n9s6mgk18bsegp', type: 'milestone', slug: 'ms_10_12m_fine_motor_2', expectedClinicalStatus: 'clinical_review', expectedReviewRevision: 2, expectedUpdatedAt: 1_786_432_330_925 },
  { id: 'kx7e25bzsq67s567z7aakmx2js8b8nzm', type: 'milestone', slug: 'ms_10_12m_self_help_1', expectedClinicalStatus: 'published', expectedReviewRevision: 1, expectedUpdatedAt: 1_786_433_535_701 },
  { id: 'kx765f3w3qretqnk9v8qeaeyhh8bshtx', type: 'milestone', slug: 'ms_3y_self_help_3', expectedClinicalStatus: 'clinical_review', expectedReviewRevision: 1, expectedUpdatedAt: 1_786_432_330_925 },
  { id: 'kx74h5ccbhssqn7yqw7e9927sh8b9zq8', type: 'milestone', slug: 'ms_4y_problem_solving_1', expectedClinicalStatus: 'published', expectedReviewRevision: 2, expectedUpdatedAt: 1_787_027_727_052 },
  { id: 'kx74hraxttxg9c62m7kghjgf6x8bc82k', type: 'milestone', slug: 'ms_3_5y_gross_motor_2', expectedClinicalStatus: 'clinical_review', expectedReviewRevision: 5, expectedUpdatedAt: 1_786_432_330_925 },
  { id: 'kx7an15402pvbaca1k1pvv66c58bdabq', type: 'milestone', slug: 'ms_3y_social_2', expectedClinicalStatus: 'clinical_review', expectedReviewRevision: 5, expectedUpdatedAt: 1_786_432_330_925 },
  { id: 'kx7berytp44vfs6wqzbvnd2mgx8bdxv3', type: 'milestone', slug: 'ms_3y_self_help_2', expectedClinicalStatus: 'clinical_review', expectedReviewRevision: 5, expectedUpdatedAt: 1_786_432_330_925 },
  { id: 'kx7277v7cqpc5yx33m2tq9mrsn8bd9fq', type: 'milestone', slug: 'ms_5y_cognitive_2', expectedClinicalStatus: 'clinical_review', expectedReviewRevision: 5, expectedUpdatedAt: 1_786_432_330_925 },
  { id: 'kx7bq1k669pbtxnad1x192e2t98bca2r', type: 'milestone', slug: 'ms_5y_gross_motor_2', expectedClinicalStatus: 'clinical_review', expectedReviewRevision: 5, expectedUpdatedAt: 1_786_432_330_925 },
  { id: 'kx78hz4sh8qsadbnrdchc0m7ad8b8528', type: 'milestone', slug: 'ms_4_5y_daily_routine_1', expectedClinicalStatus: 'published', expectedReviewRevision: 1, expectedUpdatedAt: 1_786_433_535_701 },
  { id: 'kx76fjw2a25rw6m08gyxfhjw318brgp6', type: 'milestone', slug: 'ms_4y_self_help_4', expectedClinicalStatus: 'clinical_review', expectedReviewRevision: 2, expectedUpdatedAt: 1_786_432_330_925 },
] as const;

/** Exact production media preimage recaptured after the deployed v3 preflight. */
const MEDIA_PREIMAGES: readonly RemainingPseudoMilestoneMediaPreimage[] = [
  {
    id: 'm17br3277rcvr1hemj8r0ffn1x8bcg53',
    creationTime: 1_785_219_622_944.1829,
    contentSlug: 'ms_10_12m_self_help_1',
    kind: 'animation',
    accessLevel: 'premium',
    licenseType: 'Original work — all rights reserved',
    note: 'Original ACE animation production brief — upload, rights check, and professional review required.',
    offline: true,
    placeholder: true,
    reviewStatus: 'planned',
    rightsOwner: 'ACE Child Grow',
    sortOrder: 23,
  },
] as const;

const LINK_PREIMAGES = linkPreimagesJson as LinkPreimage[];
const linkBySlug = new Map(LINK_PREIMAGES.map((row) => [row.slug, row]));

if (CONTENT_PREIMAGES.length !== 23 || LINK_PREIMAGES.length !== 23) {
  throw new Error('Remaining pseudo-milestone release must contain exactly 23 content/link preimages');
}
if (new Set(CONTENT_PREIMAGES.map((row) => row.slug)).size !== CONTENT_PREIMAGES.length
  || new Set(LINK_PREIMAGES.map((row) => row.slug)).size !== LINK_PREIMAGES.length) {
  throw new Error('Remaining pseudo-milestone release contains duplicate slugs');
}
if (CONTENT_PREIMAGES.some((row, index) => row.slug !== CENTRAL_RETIREMENT_SLUGS[index])) {
  throw new Error('Remaining pseudo-milestone preimages drifted from the central ordered slug set');
}
if (MEDIA_PREIMAGES.length !== 1
  || new Set(MEDIA_PREIMAGES.map((row) => row.id)).size !== MEDIA_PREIMAGES.length
  || MEDIA_PREIMAGES.some((row) => !CONTENT_PREIMAGES.some(
    (content) => content.slug === row.contentSlug,
  ))) {
  throw new Error('Remaining pseudo-milestone media preimages drifted from the exact production set');
}

export type RemainingPseudoMilestoneRetirementTarget = ContentPreimage & {
  linkId: string;
  expectedLinkUpdatedAt: number;
  expectedSourceIds: readonly string[];
  expectedMediaRows: readonly RemainingPseudoMilestoneMediaPreimage[];
  expectedMediaCount: number;
  expectedAiReleaseCount: 0;
};

export const REMAINING_PSEUDO_MILESTONE_RETIREMENT_TARGETS:
readonly RemainingPseudoMilestoneRetirementTarget[] = CONTENT_PREIMAGES.map((content) => {
  const link = linkBySlug.get(content.slug);
  if (!link || link.kind !== content.type) {
    throw new Error(`Missing exact production link preimage: ${content.slug}`);
  }
  const expectedMediaRows = MEDIA_PREIMAGES
    .filter((row) => row.contentSlug === content.slug)
    .map((row) => ({ ...row }));
  return {
    ...content,
    linkId: link._id,
    expectedLinkUpdatedAt: link.updatedAt,
    expectedSourceIds: [...link.sourceIds],
    expectedMediaRows,
    expectedMediaCount: expectedMediaRows.length,
    expectedAiReleaseCount: 0,
  };
});

export const REMAINING_PSEUDO_MILESTONE_RETIREMENT_SLUGS =
  CENTRAL_RETIREMENT_SLUGS;
