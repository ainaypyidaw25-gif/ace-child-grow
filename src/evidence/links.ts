// Evidence Base — content-to-reference links.
//
// NO ORPHAN CONTENT. Every item in the content library, every urgent safety
// rule and every Hope Center topic must resolve to at least one reference in
// ./sources. buildEvidenceLinks() is the single place that mapping happens, and
// src/evidence/__tests__ asserts that it leaves nothing unlinked and names no
// source id that does not exist.
//
// FAQ entries are not linked separately: an FAQ block lives inside its parent
// guide or special-needs item, so it inherits that item's references. The FAQ
// report therefore reads through the parent link rather than a second table.

import { CONTENT_SEED } from '../content/seed';
import { SOURCE_BY_ID } from './sources';
import { OLDER_CONTENT_SOURCES } from '../content/seed/older';

export const EVIDENCE_LINK_KINDS = [
  'milestone',
  'guide',
  'activity',
  'lesson',
  'special_need',
  'story',
  'printable',
  'safety_rule',
  'hope_topic',
] as const;
export type EvidenceLinkKind = (typeof EVIDENCE_LINK_KINDS)[number];

export interface EvidenceLink {
  kind: EvidenceLinkKind;
  /** Content slug, safety-rule key, or Hope Center topic slug. */
  slug: string;
  /** Reference ids from ./sources. Never empty for a linked item. */
  sourceIds: string[];
}

/**
 * References that back the milestone corpus as a whole. Every milestone item
 * carries these plus its domain-specific references.
 */
export const MILESTONE_BASE_SOURCES = [
  'aap-milestones-2022',
  'cdc-milestones-2026',
  'aap-surveillance-2020',
];

/** Domain-specific references for milestone items, keyed by `domainKey`. */
export const MILESTONE_DOMAIN_SOURCES: Record<string, string[]> = {
  gross_motor: ['jr-who-motor-windows-2006', 'tb-campbell-pt-6e-2022', 'who-pa-sleep-under5-2019'],
  fine_motor: ['tb-case-smith-9e-2025', 'cdc-milestone-checklists-2025'],
  speech: ['tb-paul-language-6e-2024', 'nhs-learn-to-talk-2023'],
  language: ['tb-paul-language-6e-2024', 'jr-weisleder-2013'],
  communication: ['nhs-learn-to-talk-2023'],
  cognitive: ['tb-dbp-5e-2022', 'aap-power-of-play-2018'],
  problem_solving: ['aap-power-of-play-2018', 'tb-dbp-5e-2022'],
  social: ['tb-dbp-5e-2022'],
  emotional: ['aap-toxic-stress-2021'],
  self_help: ['tb-case-smith-9e-2025', 'tb-bright-futures-4e-2017'],
  play: ['aap-power-of-play-2018'],
  nutrition: ['who-iycf-model-chapter-2025', 'who-complementary-feeding-2023', 'nhs-first-solid-foods-2026'],
  sleep: ['who-pa-sleep-under5-2019', 'aap-safe-sleep-2022', 'nhs-sids-2025'],
  safety: ['aap-drowning-2021', 'tb-bright-futures-4e-2017', 'nhs-child-accident-2025', 'hc-child-ems-2026'],
  daily_routine: ['tb-bright-futures-4e-2017'],
  school_readiness: ['hc-early-literacy-2023', 'tb-handbook-ecse-2016'],
};

/**
 * Bright Futures is a broad preventive-care guideline, but it is not evidence
 * for every present or future self-help/safety milestone. Keep the original
 * domain-array position (so unchanged links do not churn revisions) while
 * allowing the source through only for these exact claim-reviewed slugs.
 */
export const BRIGHT_FUTURES_MILESTONE_SLUGS = [
  'ms_7_9m_self_help_1',
  'ms_10_12m_self_help_1',
  'ms_13_18m_self_help_1',
  'ms_19_24m_self_help_1',
  'ms_2y_self_help_1',
  'ms_2y_self_help_2',
  'ms_2_5y_self_help_2',
  'ms_2_5y_self_help_3',
  'ms_2_5y_self_help_4',
  'ms_2_5y_self_help_5',
  'ms_3y_self_help_2',
  'ms_3y_self_help_3',
  'ms_3_5y_self_help_2',
  'ms_4y_self_help_2',
  'ms_4y_self_help_3',
  'ms_4y_self_help_4',
  'ms_4_5y_self_help_2',
  'ms_4_5y_self_help_3',
  'ms_5y_self_help_1',
  'ms_13_18m_safety_1',
  'ms_19_24m_safety_1',
  'ms_2y_safety_1',
  'ms_4_5y_safety_1',
  'ms_2y_daily_routine_1',
  'ms_4_5y_daily_routine_1',
] as const;

const brightFuturesMilestoneSlugs = new Set<string>(BRIGHT_FUTURES_MILESTONE_SLUGS);

/** Sources supporting a claim that is intentionally specific to one slug. */
export const MILESTONE_SLUG_SOURCES: Record<string, string[]> = {
  ms_birth_2m_nutrition_1: [
    'who-iycf-model-chapter-2025',
    'nice-ng194-postnatal-2021',
    'nice-ng247-maternal-child-nutrition-2025',
    'nice-ng75-faltering-growth-2017',
  ],
  ms_7_9m_self_help_1: ['hc-choking-prevention-2026', 'asha-pediatric-feeding-swallowing'],
  ms_4y_self_help_3: ['aap-oral-health-2023'],
  ms_19_24m_sleep_1: ['jr-mindell-bedtime-routine-rct-2009'],
  ms_4y_gross_motor_1: ['nhs-beds-4y-milestones-2024'],
};

/**
 * Explicit links for everything that is not a milestone. Each entry is chosen
 * for topic fit, not convenience — a reference listed here must actually cover
 * the claim the item makes.
 */
export const EXPLICIT_CONTENT_SOURCES: Record<string, string[]> = {
  ...OLDER_CONTENT_SOURCES,
  // --- Guides (age + domain specific) ---------------------------------------
  gd_7_9m_gross_motor: ['jr-who-motor-windows-2006', 'cdc-milestone-checklists-2025', 'tb-campbell-pt-6e-2022'],
  gd_13_18m_fine_motor: ['tb-case-smith-9e-2025', 'aap-milestones-2022', 'hc-choking-prevention-2026', 'cdc-introduce-solid-foods-2026'],
  gd_19_24m_speech: ['tb-paul-language-6e-2024', 'nhs-learn-to-talk-2023', 'asha-late-language-emergence'],
  gd_2y_language: ['jr-weisleder-2013', 'tb-paul-language-6e-2024', 'aap-literacy-2024'],
  gd_10_12m_communication: ['who-care-for-child-development-2012', 'cdc-milestones-2026'],
  gd_3y_cognitive: ['aap-power-of-play-2018', 'tb-dbp-5e-2022'],
  gd_4y_problem_solving: ['aap-power-of-play-2018', 'tb-handbook-ecse-2016'],
  gd_3y_social: ['aap-power-of-play-2018', 'us-hhs-head-start-elof-2015', 'hc-choking-prevention-2026'],
  gd_2_5y_emotional: ['aap-toxic-stress-2021', 'us-hhs-head-start-elof-2015'],
  gd_13_18m_self_help: ['tb-case-smith-9e-2025', 'tb-bright-futures-4e-2017'],
  gd_5_6m_play: ['aap-power-of-play-2018', 'who-care-for-child-development-2012', 'aap-digital-ecosystems-technical-2026', 'hc-screen-time-5cs-infants-2024'],
  gd_5_6m_nutrition: ['who-complementary-feeding-2023', 'nhs-first-solid-foods-2026', 'cdc-introduce-solid-foods-2026', 'cdc-cows-milk-2026', 'jr-niaid-peanut-prevention-2017', 'who-iycf-model-chapter-2025', 'aap-breastfeeding-2022', 'nhs-breastfeeding-first-days-2023', 'asha-pediatric-feeding-swallowing', 'hc-child-ems-2026'],
  gd_birth_2m_sleep: ['aap-safe-sleep-2022', 'nhs-sids-2025', 'who-pa-sleep-under5-2019', 'hc-safe-sleep-2026', 'nice-ng143-fever-2019', 'hc-child-ems-2026'],
  gd_10_12m_safety: ['aap-drowning-2021', 'cdc-positive-parenting-toddlers-2026', 'tb-bright-futures-4e-2017', 'hc-poison-prevention-2026'],
  gd_2y_daily_routine: ['tb-bright-futures-4e-2017', 'aap-oral-health-2023', 'who-caries-2020'],
  gd_4y_school_readiness: ['hc-early-literacy-2023', 'tb-handbook-ecse-2016', 'aap-literacy-2024'],

  // --- Knowledge base: Birth–2 months (guides) ------------------------------
  gd_birth_2m_gross_motor: ['aap-safe-sleep-2022', 'jr-who-motor-windows-2006', 'tb-campbell-pt-6e-2022', 'aap-milestones-2022'],
  gd_birth_2m_fine_motor: ['tb-case-smith-9e-2025', 'aap-milestones-2022', 'cdc-milestone-checklists-2025'],
  gd_birth_2m_communication: ['nhs-learn-to-talk-2023', 'aap-digital-ecosystems-technical-2026', 'hc-screen-time-5cs-infants-2024', 'who-care-for-child-development-2012', 'jr-weisleder-2013'],
  gd_birth_2m_social: ['nice-ng194-postnatal-2021', 'who-nurturing-care-2018', 'cdc-milestones-2026', 'us-hhs-head-start-elof-2015'],
  gd_birth_2m_emotional: ['aap-toxic-stress-2021', 'who-nurturing-care-2018', 'nhs-child-accident-2025', 'nice-ng143-fever-2019'],
  gd_birth_2m_cognitive: ['tb-dbp-5e-2022', 'aap-power-of-play-2018', 'who-care-for-child-development-2012', 'aap-digital-ecosystems-technical-2026', 'hc-screen-time-5cs-infants-2024'],
  gd_birth_2m_play: ['aap-power-of-play-2018', 'who-care-for-child-development-2012', 'unicef-early-moments-2017', 'cdc-milestones-2026'],
  gd_birth_2m_nutrition: ['who-iycf-model-chapter-2025', 'who-bf-counselling-2018', 'nhs-breastfeeding-first-days-2023', 'who-unicef-iycf-strategy-2003', 'nice-ng75-faltering-growth-2017', 'who-growth-standards-2006', 'who-child-growth-standards-qa-2025', 'cdc-foods-avoid-limit-2026'],
  gd_birth_2m_safety: ['aap-safe-sleep-2022', 'nhs-sids-2025', 'aap-drowning-2021', 'nhs-child-accident-2025', 'hc-child-ems-2026', 'nice-ng143-fever-2019', 'who-imci-sick-young-infant-2019', 'hc-safe-sleep-2026'],
  gd_birth_2m_daily_routine: ['who-pa-sleep-under5-2019', 'aap-safe-sleep-2022', 'tb-bright-futures-4e-2017'],

  // --- Knowledge base: Birth–2 months (activities + printable) --------------
  act_face_to_face_talk: ['nhs-learn-to-talk-2023', 'who-care-for-child-development-2012', 'jr-weisleder-2013'],
  act_gentle_bicycle_legs: ['tb-campbell-pt-6e-2022'],
  act_skin_to_skin_calm: ['who-bfhi-2017', 'who-bf-counselling-2018', 'aap-safe-sleep-2022', 'nhs-sids-2025'],
  act_first_book_share: ['aap-literacy-2024', 'hc-early-literacy-2023', 'jr-dowdall-bookreading-2020'],
  act_lullaby_and_rock: ['who-care-for-child-development-2012', 'aap-safe-sleep-2022'],
  act_texture_touch: ['tb-case-smith-9e-2025', 'who-care-for-child-development-2012', 'aap-safe-sleep-2022'],
  prt_checklist_birth_2m: ['cdc-milestone-checklists-2025', 'aap-milestones-2022', 'aap-safe-sleep-2022', 'nhs-baby-reviews-2023'],

  // --- Knowledge base: 3–4 months (guides) ----------------------------------
  gd_3_4m_gross_motor: ['aap-milestones-2022', 'cdc-milestone-checklists-2025', 'jr-who-motor-windows-2006', 'tb-campbell-pt-6e-2022', 'aap-safe-sleep-2022'],
  gd_3_4m_fine_motor: ['tb-case-smith-9e-2025', 'aap-milestones-2022', 'cdc-milestone-checklists-2025', 'aap-power-of-play-2018'],
  gd_3_4m_communication: ['nhs-learn-to-talk-2023', 'cdc-milestones-2026', 'aap-surveillance-2020', 'who-care-for-child-development-2012', 'jr-weisleder-2013'],
  gd_3_4m_social: ['cdc-milestones-2026', 'aap-milestones-2022', 'who-nurturing-care-2018', 'nice-ng194-postnatal-2021', 'us-hhs-head-start-elof-2015'],
  gd_3_4m_emotional: ['aap-toxic-stress-2021', 'who-nurturing-care-2018', 'nhs-child-accident-2025', 'nice-ng143-fever-2019', 'who-imci-chart-2014', 'tb-nelson-22e-2024'],
  gd_3_4m_cognitive: ['tb-dbp-5e-2022', 'cdc-milestone-checklists-2025', 'aap-milestones-2022', 'who-pa-sleep-under5-2019', 'aap-digital-ecosystems-technical-2026', 'hc-screen-time-5cs-infants-2024'],
  gd_3_4m_play: ['aap-power-of-play-2018', 'who-care-for-child-development-2012', 'unicef-early-moments-2017', 'cdc-milestones-2026', 'hc-safe-toys-2024', 'hc-safety-birth-6m-2017'],
  gd_3_4m_nutrition: ['who-iycf-model-chapter-2025', 'who-unicef-iycf-strategy-2003', 'nhs-first-solid-foods-2026', 'who-bf-counselling-2018', 'nice-ng75-faltering-growth-2017', 'aap-breastfeeding-2022'],
  gd_3_4m_sleep: ['who-pa-sleep-under5-2019', 'aap-safe-sleep-2022', 'nhs-sids-2025', 'hc-safe-sleep-2026'],
  gd_3_4m_safety: ['aap-drowning-2021', 'aap-safe-sleep-2022', 'nhs-child-accident-2025', 'hc-child-ems-2026', 'nice-ng143-fever-2019', 'who-imci-chart-2014', 'tb-bright-futures-4e-2017'],
  gd_3_4m_daily_routine: ['who-nurturing-care-2018', 'aap-drowning-2021', 'nice-ng143-fever-2019', 'tb-bright-futures-4e-2017', 'cdc-immunization-schedule-2025'],

  // --- Knowledge base: 3–4 months (activities + printable) ------------------
  act_copy_my_sound: ['nhs-learn-to-talk-2023', 'who-care-for-child-development-2012', 'jr-weisleder-2013', 'cdc-milestones-2026'],
  act_reach_for_the_toy: ['tb-case-smith-9e-2025', 'cdc-milestone-checklists-2025', 'aap-milestones-2022', 'aap-safe-sleep-2022', 'aap-power-of-play-2018'],
  act_peek_a_boo_cloth: ['aap-power-of-play-2018', 'who-nurturing-care-2018', 'cdc-milestones-2026', 'aap-safe-sleep-2022'],
  act_picture_book_naming: ['aap-literacy-2024', 'hc-early-literacy-2023', 'jr-dowdall-bookreading-2020', 'nhs-learn-to-talk-2023', 'aap-digital-ecosystems-technical-2026', 'hc-screen-time-5cs-infants-2024'],
  act_rhythm_and_rock: ['who-care-for-child-development-2012', 'aap-safe-sleep-2022'],
  act_texture_basket_infant: ['tb-case-smith-9e-2025', 'who-care-for-child-development-2012', 'aap-safe-sleep-2022'],
  prt_checklist_3_4m: ['cdc-milestone-checklists-2025', 'aap-milestones-2022', 'aap-safe-sleep-2022', 'nhs-baby-reviews-2023', 'who-iycf-model-chapter-2025'],

  // --- Knowledge base: 5–6 months (guides) ----------------------------------
  gd_5_6m_gross_motor: ['cdc-milestone-checklists-2025', 'aap-milestones-2022', 'jr-who-motor-windows-2006', 'aap-safe-sleep-2022', 'tb-campbell-pt-6e-2022'],
  gd_5_6m_fine_motor: ['cdc-milestone-checklists-2025', 'aap-milestones-2022', 'aap-power-of-play-2018', 'tb-case-smith-9e-2025'],
  gd_5_6m_speech: ['cdc-milestones-2026', 'aap-milestones-2022', 'nhs-learn-to-talk-2023', 'tb-paul-language-6e-2024'],
  gd_5_6m_language: ['cdc-milestones-2026', 'aap-surveillance-2020', 'nhs-learn-to-talk-2023', 'jr-weisleder-2013', 'tb-paul-language-6e-2024'],
  gd_5_6m_communication: ['who-care-for-child-development-2012', 'cdc-milestones-2026', 'nhs-learn-to-talk-2023', 'jr-weisleder-2013', 'aap-digital-ecosystems-technical-2026', 'hc-screen-time-5cs-infants-2024'],
  gd_5_6m_social: ['cdc-milestones-2026', 'aap-milestones-2022', 'who-nurturing-care-2018', 'aap-power-of-play-2018', 'us-hhs-head-start-elof-2015'],
  gd_5_6m_emotional: ['aap-toxic-stress-2021', 'who-nurturing-care-2018', 'nice-ng194-postnatal-2021', 'tb-nelson-22e-2024', 'us-hhs-head-start-elof-2015'],
  gd_5_6m_cognitive: ['cdc-milestone-checklists-2025', 'aap-milestones-2022', 'tb-dbp-5e-2022', 'aap-digital-ecosystems-technical-2026', 'hc-screen-time-5cs-infants-2024', 'who-pa-sleep-under5-2019'],
  gd_5_6m_sleep: ['who-pa-sleep-under5-2019', 'aap-safe-sleep-2022', 'nhs-sids-2025', 'hc-safe-sleep-2026', 'jr-lecuelle-behavioral-insomnia-review-2024'],
  gd_5_6m_safety: ['aap-drowning-2021', 'tb-bright-futures-4e-2017', 'nhs-child-accident-2025', 'hc-child-ems-2026', 'nice-ng143-fever-2019', 'who-imci-chart-2014', 'aap-safe-sleep-2022'],
  gd_5_6m_daily_routine: ['who-nurturing-care-2018', 'tb-bright-futures-4e-2017', 'who-iycf-model-chapter-2025', 'aap-drowning-2021', 'nice-ng143-fever-2019', 'cdc-immunization-schedule-2025'],

  // --- Knowledge base: 5–6 months (activities + printable) ------------------
  act_babble_back_and_forth: ['nhs-learn-to-talk-2023', 'cdc-milestones-2026', 'who-care-for-child-development-2012', 'jr-weisleder-2013'],
  act_roll_and_reach: ['cdc-milestone-checklists-2025', 'aap-milestones-2022', 'aap-safe-sleep-2022', 'tb-campbell-pt-6e-2022'],
  act_mirror_hello: ['aap-power-of-play-2018', 'who-nurturing-care-2018', 'cdc-milestones-2026'],
  act_board_book_point: ['aap-literacy-2024', 'hc-early-literacy-2023', 'nhs-learn-to-talk-2023', 'jr-dowdall-bookreading-2020'],
  act_clap_and_sing_5_6m: ['aap-power-of-play-2018'],
  act_safe_touch_basket: ['tb-case-smith-9e-2025', 'who-care-for-child-development-2012', 'aap-power-of-play-2018', 'aap-safe-sleep-2022'],
  prt_checklist_5_6m: ['cdc-milestone-checklists-2025', 'aap-milestones-2022', 'who-iycf-model-chapter-2025', 'aap-safe-sleep-2022', 'nhs-baby-reviews-2023'],

  // --- Knowledge base: 7–9 months (guides) ----------------------------------
  gd_7_9m_fine_motor: ['cdc-milestone-checklists-2025', 'aap-milestones-2022', 'aap-power-of-play-2018', 'tb-case-smith-9e-2025', 'tb-bright-futures-4e-2017'],
  gd_7_9m_speech: ['cdc-milestones-2026', 'aap-milestones-2022', 'nhs-learn-to-talk-2023', 'tb-paul-language-6e-2024'],
  gd_7_9m_language: ['cdc-milestones-2026', 'aap-surveillance-2020', 'nhs-learn-to-talk-2023', 'jr-weisleder-2013', 'tb-paul-language-6e-2024'],
  gd_7_9m_communication: ['who-care-for-child-development-2012', 'cdc-milestones-2026', 'nhs-learn-to-talk-2023', 'jr-weisleder-2013', 'aap-digital-ecosystems-technical-2026', 'hc-screen-time-5cs-infants-2024'],
  gd_7_9m_cognitive: ['cdc-milestone-checklists-2025', 'aap-milestones-2022', 'aap-power-of-play-2018', 'tb-dbp-5e-2022', 'aap-digital-ecosystems-technical-2026', 'hc-screen-time-5cs-infants-2024', 'who-pa-sleep-under5-2019'],
  gd_7_9m_social: ['cdc-milestones-2026', 'aap-milestones-2022', 'who-nurturing-care-2018', 'aap-power-of-play-2018', 'us-hhs-head-start-elof-2015'],
  gd_7_9m_emotional: ['aap-toxic-stress-2021', 'who-nurturing-care-2018', 'nice-ng194-postnatal-2021', 'tb-nelson-22e-2024', 'us-hhs-head-start-elof-2015'],
  gd_7_9m_nutrition: ['who-complementary-feeding-2023', 'who-iycf-model-chapter-2025', 'who-iycf-indicators-2021', 'nhs-first-solid-foods-2026', 'cdc-foods-6-24m-2025', 'cdc-introduce-solid-foods-2026', 'jr-niaid-peanut-prevention-2017', 'nice-ng247-maternal-child-nutrition-2025', 'asha-pediatric-feeding-swallowing'],
  gd_7_9m_self_help: ['tb-case-smith-9e-2025', 'tb-bright-futures-4e-2017', 'who-iycf-model-chapter-2025', 'cdc-foods-6-24m-2025'],
  gd_7_9m_sleep: ['who-pa-sleep-under5-2019', 'aap-safe-sleep-2022', 'nhs-sids-2025', 'hc-safe-sleep-2026', 'jr-aasm-bedtime-2006', 'jr-hiscock-sleep-rct-2002', 'jr-lecuelle-behavioral-insomnia-review-2024', 'jr-mindell-bedtime-routine-rct-2009'],
  gd_7_9m_safety: ['aap-drowning-2021', 'tb-bright-futures-4e-2017', 'nhs-child-accident-2025', 'hc-child-ems-2026', 'nice-ng143-fever-2019', 'who-imci-chart-2014', 'aap-safe-sleep-2022'],
  gd_7_9m_daily_routine: ['who-nurturing-care-2018', 'tb-bright-futures-4e-2017', 'who-iycf-model-chapter-2025', 'aap-drowning-2021', 'nice-ng143-fever-2019', 'cdc-immunization-schedule-2025'],

  // --- Knowledge base: 7–9 months (activities + printable) ------------------
  act_name_and_wait: ['nhs-learn-to-talk-2023', 'cdc-milestones-2026', 'who-care-for-child-development-2012', 'jr-weisleder-2013'],
  act_sit_and_reach_ring: ['cdc-milestone-checklists-2025', 'aap-milestones-2022', 'jr-who-motor-windows-2006', 'tb-campbell-pt-6e-2022'],
  act_wave_bye_bye: ['cdc-milestones-2026', 'aap-milestones-2022', 'aap-power-of-play-2018'],
  act_lift_the_flap_book: ['aap-literacy-2024', 'hc-early-literacy-2023', 'nhs-learn-to-talk-2023', 'jr-dowdall-bookreading-2020'],
  act_drum_and_pause: ['who-care-for-child-development-2012', 'aap-power-of-play-2018', 'tb-dbp-5e-2022'],
  act_two_texture_spoons: ['who-iycf-model-chapter-2025', 'cdc-foods-6-24m-2025', 'tb-case-smith-9e-2025'],
  prt_checklist_7_9m: ['cdc-milestone-checklists-2025', 'aap-milestones-2022', 'who-iycf-model-chapter-2025', 'aap-safe-sleep-2022', 'nhs-baby-reviews-2023'],

  // --- Knowledge base: 10–12 months (guides) --------------------------------
  gd_10_12m_gross_motor: ['cdc-milestone-checklists-2025', 'aap-milestones-2022', 'jr-who-motor-windows-2006', 'tb-campbell-pt-6e-2022', 'tb-bright-futures-4e-2017'],
  gd_10_12m_fine_motor: ['cdc-milestone-checklists-2025', 'aap-milestones-2022', 'aap-power-of-play-2018', 'tb-case-smith-9e-2025', 'tb-bright-futures-4e-2017'],
  gd_10_12m_speech: ['cdc-milestones-2026', 'aap-milestones-2022', 'nhs-learn-to-talk-2023', 'tb-paul-language-6e-2024'],
  gd_10_12m_language: ['cdc-milestones-2026', 'aap-surveillance-2020', 'nhs-learn-to-talk-2023', 'jr-weisleder-2013', 'tb-paul-language-6e-2024'],
  gd_10_12m_cognitive: ['cdc-milestone-checklists-2025', 'aap-milestones-2022', 'aap-power-of-play-2018', 'tb-dbp-5e-2022', 'aap-digital-ecosystems-technical-2026', 'hc-screen-time-5cs-infants-2024', 'jr-madigan-screen-language-2020', 'who-pa-sleep-under5-2019'],
  gd_10_12m_social: ['cdc-milestones-2026', 'aap-milestones-2022', 'who-nurturing-care-2018', 'aap-power-of-play-2018', 'us-hhs-head-start-elof-2015'],
  gd_10_12m_emotional: ['aap-toxic-stress-2021', 'who-nurturing-care-2018', 'nice-ng194-postnatal-2021', 'tb-nelson-22e-2024', 'us-hhs-head-start-elof-2015', 'aap-safe-sleep-2022'],
  gd_10_12m_self_help: ['tb-case-smith-9e-2025', 'tb-bright-futures-4e-2017', 'who-iycf-model-chapter-2025', 'cdc-foods-6-24m-2025', 'aap-oral-health-2023', 'who-caries-2020', 'asha-pediatric-feeding-swallowing', 'hc-choking-prevention-2026'],
  gd_10_12m_play: ['aap-power-of-play-2018', 'who-care-for-child-development-2012', 'unicef-early-moments-2017', 'tb-bright-futures-4e-2017', 'aap-drowning-2021', 'cpsc-childproofing-home-2023', 'cpsc-window-coverings-cordless-2021', 'hc-choking-prevention-2026', 'hc-poison-prevention-2026'],
  gd_10_12m_nutrition: ['who-complementary-feeding-2023', 'who-iycf-model-chapter-2025', 'who-iycf-indicators-2021', 'nhs-first-solid-foods-2026', 'cdc-foods-6-24m-2025', 'cdc-introduce-solid-foods-2026', 'jr-niaid-peanut-prevention-2017', 'nice-ng247-maternal-child-nutrition-2025', 'aap-breastfeeding-2022', 'asha-pediatric-feeding-swallowing'],
  gd_10_12m_sleep: ['who-pa-sleep-under5-2019', 'aap-safe-sleep-2022', 'nhs-sids-2025', 'hc-safe-sleep-2026', 'who-nurturing-care-2018', 'jr-aasm-bedtime-2006', 'jr-hiscock-sleep-rct-2002', 'jr-lecuelle-behavioral-insomnia-review-2024', 'jr-mindell-bedtime-routine-rct-2009'],
  gd_10_12m_daily_routine: ['who-nurturing-care-2018', 'tb-bright-futures-4e-2017', 'who-iycf-model-chapter-2025', 'aap-drowning-2021', 'nice-ng143-fever-2019', 'nhs-child-accident-2025', 'hc-child-ems-2026', 'who-imci-chart-2014', 'cdc-immunization-schedule-2025', 'who-ia2030-2020'],

  // --- Knowledge base: 10–12 months (activities + printable) ----------------
  act_container_in_and_out: ['tb-case-smith-9e-2025', 'aap-power-of-play-2018', 'cdc-milestone-checklists-2025', 'tb-dbp-5e-2022'],
  act_hide_and_find_toy: ['aap-power-of-play-2018', 'tb-dbp-5e-2022', 'cdc-milestones-2026', 'who-care-for-child-development-2012'],
  act_cruise_along_the_sofa: ['cdc-milestone-checklists-2025', 'aap-milestones-2022', 'jr-who-motor-windows-2006', 'tb-campbell-pt-6e-2022', 'tb-bright-futures-4e-2017'],
  act_roll_the_ball_back: ['aap-power-of-play-2018', 'cdc-milestones-2026', 'tb-campbell-pt-6e-2022'],
  act_show_me_and_name_it: ['nhs-learn-to-talk-2023', 'cdc-milestones-2026', 'jr-weisleder-2013', 'who-care-for-child-development-2012'],
  act_first_words_book_share: ['aap-literacy-2024', 'hc-early-literacy-2023', 'jr-dowdall-bookreading-2020', 'nhs-learn-to-talk-2023'],
  act_open_cup_sips: ['who-iycf-model-chapter-2025', 'cdc-foods-6-24m-2025', 'tb-case-smith-9e-2025', 'aap-oral-health-2023'],
  prt_checklist_10_12m: ['cdc-milestone-checklists-2025', 'aap-milestones-2022', 'who-iycf-model-chapter-2025', 'aap-safe-sleep-2022', 'nhs-baby-reviews-2023', 'tb-bright-futures-4e-2017'],

  // --- Activities -----------------------------------------------------------
  act_tummy_time_mirror: ['jr-who-motor-windows-2006', 'aap-safe-sleep-2022', 'tb-campbell-pt-6e-2022'],
  act_sound_tracking: ['cdc-milestones-2026'],
  act_peekaboo: ['aap-power-of-play-2018'],
  act_cup_stacking: ['tb-case-smith-9e-2025', 'aap-power-of-play-2018'],
  act_name_and_point: ['jr-weisleder-2013', 'nhs-learn-to-talk-2023'],
  act_copy_everyday_actions: ['aap-power-of-play-2018', 'who-care-for-child-development-2012'],
  act_obstacle_crawl: ['jr-who-motor-windows-2006', 'who-pa-sleep-under5-2019'],
  act_color_sort: ['aap-power-of-play-2018', 'tb-dbp-5e-2022'],
  act_feeling_faces: ['aap-toxic-stress-2021', 'us-hhs-head-start-elof-2015', 'hc-mental-emotional-development-2026'],
  act_follow_the_pattern: ['aap-power-of-play-2018', 'tb-dbp-5e-2022'],
  act_water_pouring: ['tb-case-smith-9e-2025', 'aap-drowning-2021'],
  act_obstacle_course: ['who-pa-sleep-under5-2019', 'tb-campbell-pt-6e-2022'],
  act_story_sequence: ['jr-dowdall-bookreading-2020', 'hc-early-literacy-2023'],
  act_draw_and_tell: ['aap-power-of-play-2018', 'hc-early-literacy-2023'],
  act_name_writing: ['hc-early-literacy-2023', 'tb-handbook-ecse-2016'],

  // --- Lessons --------------------------------------------------------------
  lsn_what_is_development: ['who-nurturing-care-2018', 'jr-lancet-ecd-coming-of-age-2017', 'aap-milestones-2022', 'jr-lancet-nurturing-care-2017', 'who-nurturing-care-practice-guide-2023', 'who-ncf-progress-2023', 'unicef-early-moments-2017', 'jr-lancet-inequality-2011', 'tb-caring-birth-to-5-8e-2024'],
  lsn_power_of_play: ['aap-power-of-play-2018', 'jr-jamaica-1991', 'who-care-for-child-development-2012', 'who-improving-ecd-2020'],
  lsn_talk_more: ['jr-weisleder-2013', 'nhs-learn-to-talk-2023', 'tb-paul-language-6e-2024'],
  lsn_reading_together: ['jr-dowdall-bookreading-2020', 'aap-literacy-2024', 'hc-early-literacy-2023'],
  lsn_gentle_discipline: ['aap-toxic-stress-2021', 'cdc-positive-parenting-toddlers-2026', 'jr-plosmed-parenting-2021'],
  lsn_balanced_meals: ['who-complementary-feeding-2023', 'cdc-foods-6-24m-2025', 'nice-ng247-maternal-child-nutrition-2025', 'who-unicef-iycf-strategy-2003', 'who-bfhi-2017', 'who-bf-counselling-2018', 'who-iycf-indicators-2021', 'unicef-sowc-2019', 'jr-lancet-undernutrition-2013'],
  lsn_healthy_sleep: ['who-pa-sleep-under5-2019', 'jr-aasm-bedtime-2006', 'jr-lecuelle-behavioral-insomnia-review-2024', 'aap-safe-sleep-2022'],
  lsn_home_safety: ['aap-drowning-2021', 'tb-bright-futures-4e-2017', 'cdc-positive-parenting-toddlers-2026', 'tb-caring-birth-to-5-8e-2024'],
  lsn_screen_time: ['aap-digital-ecosystems-policy-2026', 'aap-digital-ecosystems-technical-2026', 'jr-madigan-screen-language-2020', 'who-pa-sleep-under5-2019', 'hc-screen-time-5cs-2024', 'hc-screen-time-5cs-infants-2024', 'hc-screen-time-5cs-overview-2026', 'jr-madigan-screen-asq-2019'],
  lsn_big_feelings: ['aap-toxic-stress-2021', 'us-hhs-head-start-elof-2015', 'hc-mental-emotional-development-2026'],
  lsn_making_friends: ['aap-power-of-play-2018', 'us-hhs-head-start-elof-2015', 'hc-mental-emotional-development-2026'],
  // The AI-audited educational preview uses one exact, government-authored
  // early-mathematics framework so its release can avoid mutating the widely
  // shared AAP Power of Play source record in production.
  lsn_early_math: ['us-hhs-head-start-elof-2015'],
  lsn_creativity: ['aap-power-of-play-2018'],
  lsn_problem_solving_parenting: ['jr-plosmed-parenting-2021', 'cdc-positive-parenting-toddlers-2026', 'jr-pakistan-lhw-2014'],
  lsn_special_needs_awareness: ['who-unicef-developmental-disabilities-2023', 'unicef-seen-counted-included-2022', 'aap-surveillance-2020', 'tb-ccitsn-3e-2004'],
  lsn_prepare_preschool: ['tb-handbook-ecse-2016', 'us-hhs-head-start-elof-2015'],
  lsn_prepare_school: ['hc-early-literacy-2023', 'tb-handbook-ecse-2016', 'aap-literacy-2024'],
  lsn_doctor_visits: ['tb-bright-futures-4e-2017', 'nhs-baby-reviews-2023', 'cdc-monitoring-screening-2026', 'nhs-vaccinations-2023', 'cdc-immunization-schedule-2025', 'who-ia2030-2020', 'myanmar-nsp-newborn-child-2015'],
  lsn_parent_wellbeing: ['nice-ng194-postnatal-2021', 'aap-toxic-stress-2021'],
  lsn_language_rich_home: ['jr-weisleder-2013', 'jr-dowdall-bookreading-2020', 'aap-literacy-2024'],

  // --- Special-needs awareness ----------------------------------------------
  // Awareness only. None of these items screen, score or diagnose; the
  // references are the recognition-and-referral literature a parent-facing
  // awareness page is allowed to summarise.
  sn_autism: ['aap-asd-2020', 'cdc-autism-signs-2024', 'nice-cg128-autism-2011', 'who-unicef-developmental-disabilities-2023'],
  sn_speech_delay: ['cdc-milestones-2026', 'asha-late-language-emergence', 'tb-paul-language-6e-2024', 'nhs-learn-to-talk-2023'],
  sn_adhd: ['aap-adhd-guideline-2019', 'cdc-adhd-clinical-care-2026', 'nice-ng87-adhd-2018', 'tb-dbp-5e-2022'],
  sn_down_syndrome: ['aap-down-syndrome-supervision-2022', 'tb-nelson-22e-2024', 'who-unicef-developmental-disabilities-2023', 'tb-dbp-5e-2022'],
  // NICE NG62 directly supports the recognition, referral, multidisciplinary
  // care and swallowing claims. The two NHS pages are publisher-overdue and
  // absent from Production; textbook catalogue pages are not claim-direct.
  sn_cerebral_palsy: ['nice-ng62-cerebral-palsy-2017'],
  sn_hearing_loss: ['cdc-ehdi-toolkit-2024', 'cdc-hearing-treatment-2024', 'tb-nelson-22e-2024', 'asha-language-communication-dhh', 'who-unicef-developmental-disabilities-2023'],
  sn_visual_impairment: ['aap-visual-system-assessment-2016', 'aap-visual-system-procedures-2016', 'tb-nelson-22e-2024', 'who-unicef-developmental-disabilities-2023'],
  sn_global_developmental_delay: ['aap-gdd-genetic-evaluation-2025', 'aap-gdd-evaluation-2014', 'aap-surveillance-2020', 'tb-dbp-5e-2022', 'who-unicef-developmental-disabilities-2023', 'tb-bayley-4-2019', 'nice-ng72-preterm-2017', 'tb-ccitsn-3e-2004'],
  sn_learning_disability: ['nhs-learning-disabilities-2025', 'tb-dbp-5e-2022', 'unicef-seen-counted-included-2022', 'tb-handbook-ecse-2016'],
  sn_sensory_processing: ['tb-case-smith-9e-2025', 'aap-sensory-integration-2012', 'jr-asi-systematic-review-2025', 'jr-senita-rct-2022'],
  sn_dyslexia: ['ida-dyslexia-definition-2025', 'aap-dyslexia-early-identification-2020', 'nhs-dyslexia-children-2026', 'tb-dbp-5e-2022', 'hc-early-literacy-2023'],
  sn_developmental_coordination_disorder: ['nhs-dcd-diagnosis-2023', 'tb-case-smith-9e-2025', 'tb-campbell-pt-6e-2022', 'tb-dbp-5e-2022'],
  sn_selective_mutism: [
    'who-anxiety-disorders-2025',
    'who-icd11-cddr-2024',
    'nhs-selective-mutism-2023',
    'asha-selective-mutism',
    'jr-selective-mutism-interventions-2023',
  ],

  // --- Stories ---------------------------------------------------------------
  // Stories teach one developmental idea each; the reference backs that idea,
  // not the narrative.
  st_little_seed: ['who-nurturing-care-2018', 'aap-milestones-2022', 'hc-choking-prevention-2026'],
  st_ba_ba_sounds: ['nhs-learn-to-talk-2023', 'jr-weisleder-2013', 'tb-paul-language-6e-2024'],
  st_when_i_feel_angry: ['aap-toxic-stress-2021', 'us-hhs-head-start-elof-2015', 'hc-mental-emotional-development-2026'],
  st_taking_turns: ['aap-power-of-play-2018', 'us-hhs-head-start-elof-2015', 'hc-mental-emotional-development-2026'],
  st_goodnight_moon_friend: ['who-pa-sleep-under5-2019', 'jr-dowdall-bookreading-2020'],
  st_waiting_at_clinic: ['nhs-alder-hey-outpatient-2023'],
  st_visit_to_doctor: ['tb-bright-futures-4e-2017', 'cdc-monitoring-screening-2026'],
  st_first_day_school: ['us-hhs-head-start-first-day-jitters-2024'],
  st_sharing_mango: ['aap-power-of-play-2018'],

  // --- Printables ------------------------------------------------------------
  prt_flash_cards: ['jr-weisleder-2013', 'hc-early-literacy-2023'],
  prt_emotion_cards: ['aap-toxic-stress-2021', 'us-hhs-head-start-elof-2015', 'hc-mental-emotional-development-2026'],
  prt_communication_cards: ['asha-aac', 'unicef-caregiver-disability-resources-2022'],
  act_push_pull_walk_13_18m: [
    'aap-power-of-play-2018',
    'cdc-milestones-2026',
    'hc-baby-walkers-danger-2022',
  ],
  prt_routine_chart: ['tb-bright-futures-4e-2017', 'cdc-positive-parenting-toddlers-2026'],
  prt_reward_chart: ['cdc-positive-parenting-toddlers-2026', 'jr-plosmed-parenting-2021'],
  prt_behavior_chart: ['cdc-positive-parenting-toddlers-2026', 'jr-plosmed-parenting-2021'],
  prt_visual_schedule: ['tb-case-smith-9e-2025', 'tb-handbook-ecse-2016'],
  prt_doctor_visit_checklist: ['tb-bright-futures-4e-2017', 'nhs-baby-reviews-2023', 'cdc-monitoring-screening-2026'],
  prt_growth_log: ['who-growth-standards-2006', 'who-child-growth-standards-qa-2025', 'nice-ng75-faltering-growth-2017'],
  prt_sleep_diary: ['who-pa-sleep-under5-2019'],
  prt_milestone_checklist: ['cdc-milestone-checklists-2025', 'aap-milestones-2022', 'aap-surveillance-2020'],
};

/**
 * References behind the deterministic safety engine
 * (src/domain/safety/safety.ts). These do not drive the logic — the logic is
 * fixed and rule-based — they are what a specialist safety reviewer checks the wording
 * of each urgent rule against.
 */
export const SAFETY_RULE_SOURCES: Record<string, string[]> = {
  severe_breathing_difficulty: ['nhs-child-accident-2025', 'hc-child-ems-2026', 'nhs-sids-2025', 'tb-nelson-22e-2024'],
  blue_lips: ['nhs-child-accident-2025', 'hc-child-ems-2026', 'nhs-sids-2025'],
  breathing_pauses: ['nhs-child-accident-2025', 'nhs-sids-2025', 'tb-nelson-22e-2024'],
  seizure: ['nice-ng143-fever-2019', 'nhs-child-accident-2025', 'hc-child-ems-2026', 'nhs-sids-2025'],
  unresponsiveness: ['nhs-child-accident-2025', 'hc-child-ems-2026', 'nhs-sids-2025', 'who-imci-chart-2014', 'who-imci-sick-young-infant-2019'],
  sudden_weakness: ['cdc-afm-signs-2024'],
  serious_injury: ['aap-drowning-2021', 'nhs-child-accident-2025', 'hc-child-ems-2026'],
  severe_dehydration: ['who-imci-chart-2014', 'who-imci-sick-young-infant-2019', 'hc-child-ems-2026', 'tb-nelson-22e-2024'],
  loss_of_acquired_skills: ['aap-surveillance-2020', 'cdc-milestones-2026'],
  /** The standing skill-loss question asked alongside every milestone check. */
  skill_loss_question: ['aap-surveillance-2020', 'cdc-milestones-2026'],
  /** The fixed emergency wording shown when any urgent rule fires. */
  emergency_message: ['nhs-child-accident-2025', 'hc-child-ems-2026', 'who-imci-chart-2014', 'who-imci-sick-young-infant-2019'],
};

/** References behind each Hope Center (awareness) topic. */
export const HOPE_TOPIC_SOURCES: Record<string, string[]> = {
  'autism-spectrum': ['aap-asd-2020', 'cdc-autism-signs-2024'],
  'speech-language-delay': ['asha-late-language-emergence', 'tb-paul-language-6e-2024', 'nhs-learn-to-talk-2023'],
  adhd: ['nice-ng87-adhd-2018', 'tb-dbp-5e-2022'],
  'hearing-loss': ['cdc-hearing-treatment-2024', 'asha-language-communication-dhh', 'tb-nelson-22e-2024', 'who-unicef-developmental-disabilities-2023'],
  'cerebral-palsy': ['nice-ng62-cerebral-palsy-2017'],
};

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

/** Content types in the seed, mapped onto link kinds. */
const CONTENT_TYPE_TO_KIND: Record<string, EvidenceLinkKind> = {
  milestone: 'milestone',
  guide: 'guide',
  activity: 'activity',
  lesson: 'lesson',
  special_need: 'special_need',
  story: 'story',
  printable: 'printable',
};

function unique(ids: string[]): string[] {
  return [...new Set(ids)];
}

export interface EvidenceLinkBuild {
  links: EvidenceLink[];
  /** `kind:slug` for anything that resolved to zero references. Must stay empty. */
  orphans: string[];
  /** Source ids named by a link that do not exist in ./sources. Must stay empty. */
  unknownSourceIds: string[];
}

/**
 * The single place content is mapped to references. Milestones are linked by
 * rule (corpus references + domain references) so a new milestone can never be
 * added without inheriting citations; everything else is linked explicitly.
 */
export function buildEvidenceLinks(): EvidenceLinkBuild {
  const links: EvidenceLink[] = [];
  const orphans: string[] = [];
  const unknown = new Set<string>();

  const push = (kind: EvidenceLinkKind, slug: string, sourceIds: string[]): void => {
    const ids = unique(sourceIds);
    if (ids.length === 0) orphans.push(`${kind}:${slug}`);
    ids.forEach((id) => {
      if (!SOURCE_BY_ID.has(id)) unknown.add(id);
    });
    links.push({ kind, slug, sourceIds: ids });
  };

  for (const item of CONTENT_SEED) {
    const kind = CONTENT_TYPE_TO_KIND[item.type];
    if (!kind) {
      orphans.push(`unmapped_type:${item.type}:${item.slug}`);
      continue;
    }
    if (kind === 'milestone') {
      const exactSources = MILESTONE_SLUG_SOURCES[item.slug];
      if (item.slug === 'ms_birth_2m_nutrition_1') {
        push(kind, item.slug, exactSources ?? []);
        continue;
      }
      const domain = item.domainKey ?? '';
      const domainIds = MILESTONE_DOMAIN_SOURCES[domain];
      if (!domainIds) {
        // A milestone domain with no reference mapping is a gap, not a default.
        orphans.push(`milestone_domain_unmapped:${domain}:${item.slug}`);
      }
      push(kind, item.slug, [
        ...MILESTONE_BASE_SOURCES,
        ...(domainIds ?? []).filter(
          (sourceId) => sourceId !== 'tb-bright-futures-4e-2017'
            || brightFuturesMilestoneSlugs.has(item.slug),
        ),
        ...(exactSources ?? []),
      ]);
      continue;
    }
    push(kind, item.slug, EXPLICIT_CONTENT_SOURCES[item.slug] ?? []);
  }

  for (const [slug, ids] of Object.entries(SAFETY_RULE_SOURCES)) push('safety_rule', slug, ids);
  for (const [slug, ids] of Object.entries(HOPE_TOPIC_SOURCES)) push('hope_topic', slug, ids);

  return { links, orphans, unknownSourceIds: [...unknown].sort() };
}

const BUILD = buildEvidenceLinks();

export const EVIDENCE_LINKS: EvidenceLink[] = BUILD.links;

const LINKS_BY_SLUG: ReadonlyMap<string, EvidenceLink> = new Map(
  EVIDENCE_LINKS.map((link) => [`${link.kind}:${link.slug}`, link]),
);

/** Reference ids backing one content slug. Empty array means orphaned. */
export function sourcesForContent(slug: string, kind?: EvidenceLinkKind): string[] {
  if (kind) return LINKS_BY_SLUG.get(`${kind}:${slug}`)?.sourceIds ?? [];
  return EVIDENCE_LINKS.find((link) => link.slug === slug)?.sourceIds ?? [];
}

function emptyRelated(): Record<EvidenceLinkKind, string[]> {
  return {
    milestone: [], guide: [], activity: [], lesson: [], special_need: [],
    story: [], printable: [], safety_rule: [], hope_topic: [],
  };
}

const RELATED_BY_SOURCE: ReadonlyMap<string, Record<EvidenceLinkKind, string[]>> = (() => {
  const map = new Map<string, Record<EvidenceLinkKind, string[]>>();
  for (const link of EVIDENCE_LINKS) {
    for (const id of link.sourceIds) {
      let entry = map.get(id);
      if (!entry) { entry = emptyRelated(); map.set(id, entry); }
      entry[link.kind].push(link.slug);
    }
  }
  return map;
})();

/**
 * The Related Milestones / Activities / Lessons / Stories / Safety Rules /
 * Hope Center Topics columns of the evidence record. Derived from the link
 * table rather than stored, so the two can never drift apart.
 */
export function relatedContent(sourceId: string): Record<EvidenceLinkKind, string[]> {
  return RELATED_BY_SOURCE.get(sourceId) ?? emptyRelated();
}

/** Reference ids that no content, safety rule or Hope Center topic cites. */
export function unusedSourceIds(): string[] {
  return [...SOURCE_BY_ID.entries()]
    .filter(([id, source]) => source.reviewStatus !== 'retired' && !RELATED_BY_SOURCE.has(id))
    .map(([id]) => id)
    .sort();
}
