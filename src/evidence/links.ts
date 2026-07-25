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
  communication: ['who-care-for-child-development-2012', 'nhs-learn-to-talk-2023'],
  cognitive: ['tb-dbp-5e-2022', 'aap-power-of-play-2018'],
  problem_solving: ['aap-power-of-play-2018', 'tb-dbp-5e-2022'],
  social: ['nice-ph40-social-emotional-2012', 'tb-dbp-5e-2022'],
  emotional: ['nice-ph40-social-emotional-2012', 'aap-toxic-stress-2021'],
  self_help: ['tb-case-smith-9e-2025', 'tb-bright-futures-4e-2017'],
  play: ['aap-power-of-play-2018', 'who-care-for-child-development-2012'],
  nutrition: ['who-iycf-model-chapter-2025', 'who-complementary-feeding-2023', 'nhs-first-solid-foods-2026'],
  sleep: ['who-pa-sleep-under5-2019', 'aap-safe-sleep-2022', 'nhs-sids-2025'],
  safety: ['aap-drowning-2021', 'tb-bright-futures-4e-2017', 'nhs-seriously-ill-2023'],
  daily_routine: ['tb-bright-futures-4e-2017', 'jr-aasm-bedtime-2006'],
  school_readiness: ['hc-early-literacy-2023', 'tb-handbook-ecse-2016'],
};

/**
 * Explicit links for everything that is not a milestone. Each entry is chosen
 * for topic fit, not convenience — a reference listed here must actually cover
 * the claim the item makes.
 */
export const EXPLICIT_CONTENT_SOURCES: Record<string, string[]> = {
  // --- Guides (age + domain specific) ---------------------------------------
  gd_7_9m_gross_motor: ['jr-who-motor-windows-2006', 'cdc-milestone-checklists-2025', 'tb-campbell-pt-6e-2022'],
  gd_13_18m_fine_motor: ['tb-case-smith-9e-2025', 'aap-milestones-2022'],
  gd_19_24m_speech: ['tb-paul-language-6e-2024', 'nhs-learn-to-talk-2023', 'asha-late-language-emergence', 'asha-speech-sound-disorders'],
  gd_2y_language: ['jr-weisleder-2013', 'tb-paul-language-6e-2024', 'aap-literacy-2024'],
  gd_10_12m_communication: ['who-care-for-child-development-2012', 'cdc-milestones-2026'],
  gd_3y_cognitive: ['aap-power-of-play-2018', 'tb-dbp-5e-2022'],
  gd_4y_problem_solving: ['aap-power-of-play-2018', 'tb-handbook-ecse-2016'],
  gd_3y_social: ['nice-ph40-social-emotional-2012', 'aap-power-of-play-2018'],
  gd_2_5y_emotional: ['nice-ph40-social-emotional-2012', 'aap-toxic-stress-2021'],
  gd_13_18m_self_help: ['tb-case-smith-9e-2025', 'tb-bright-futures-4e-2017'],
  gd_5_6m_play: ['aap-power-of-play-2018', 'who-care-for-child-development-2012'],
  gd_5_6m_nutrition: ['who-complementary-feeding-2023', 'nhs-first-solid-foods-2026', 'cdc-foods-6-24m-2025', 'who-iycf-model-chapter-2025', 'aap-breastfeeding-2022', 'nhs-breastfeeding-first-days-2023', 'asha-pediatric-feeding-swallowing'],
  gd_birth_2m_sleep: ['aap-safe-sleep-2022', 'nhs-sids-2025', 'who-pa-sleep-under5-2019', 'hc-safe-sleep-2026'],
  gd_10_12m_safety: ['aap-drowning-2021', 'cdc-positive-parenting-toddlers-2026', 'tb-bright-futures-4e-2017'],
  gd_2y_daily_routine: ['jr-aasm-bedtime-2006', 'tb-bright-futures-4e-2017', 'aap-oral-health-2023', 'who-caries-2020'],
  gd_4y_school_readiness: ['hc-early-literacy-2023', 'tb-handbook-ecse-2016', 'aap-literacy-2024'],

  // --- Knowledge base: Birth–2 months (guides) ------------------------------
  gd_birth_2m_gross_motor: ['aap-safe-sleep-2022', 'jr-who-motor-windows-2006', 'tb-campbell-pt-6e-2022', 'aap-milestones-2022'],
  gd_birth_2m_fine_motor: ['tb-case-smith-9e-2025', 'aap-milestones-2022', 'cdc-milestone-checklists-2025'],
  gd_birth_2m_communication: ['nhs-learn-to-talk-2023', 'aap-media-young-minds-2016', 'who-care-for-child-development-2012', 'jr-weisleder-2013'],
  gd_birth_2m_social: ['nice-ph40-social-emotional-2012', 'nice-ng194-postnatal-2021', 'who-nurturing-care-2018', 'cdc-milestones-2026'],
  gd_birth_2m_emotional: ['aap-toxic-stress-2021', 'who-nurturing-care-2018', 'nhs-seriously-ill-2023', 'nice-ng143-fever-2019'],
  gd_birth_2m_cognitive: ['tb-dbp-5e-2022', 'aap-power-of-play-2018', 'who-care-for-child-development-2012', 'aap-media-young-minds-2016'],
  gd_birth_2m_play: ['aap-power-of-play-2018', 'who-care-for-child-development-2012', 'unicef-early-moments-2017'],
  gd_birth_2m_nutrition: ['who-iycf-model-chapter-2025', 'who-bf-counselling-2018', 'nhs-breastfeeding-first-days-2023', 'who-unicef-iycf-strategy-2003', 'nice-ng75-faltering-growth-2017', 'who-growth-standards-2006'],
  gd_birth_2m_safety: ['aap-safe-sleep-2022', 'nhs-sids-2025', 'aap-drowning-2021', 'nhs-seriously-ill-2023', 'nice-ng143-fever-2019', 'who-imci-chart-2014', 'hc-safe-sleep-2026'],
  gd_birth_2m_daily_routine: ['jr-aasm-bedtime-2006', 'who-pa-sleep-under5-2019', 'aap-safe-sleep-2022', 'tb-bright-futures-4e-2017'],

  // --- Knowledge base: Birth–2 months (activities + printable) --------------
  act_face_to_face_talk: ['nhs-learn-to-talk-2023', 'who-care-for-child-development-2012', 'jr-weisleder-2013'],
  act_gentle_bicycle_legs: ['who-care-for-child-development-2012', 'tb-campbell-pt-6e-2022'],
  act_skin_to_skin_calm: ['who-bfhi-2017', 'who-bf-counselling-2018', 'aap-safe-sleep-2022', 'nhs-sids-2025'],
  act_first_book_share: ['aap-literacy-2024', 'hc-early-literacy-2023', 'jr-dowdall-bookreading-2020'],
  act_lullaby_and_rock: ['jr-aasm-bedtime-2006', 'who-care-for-child-development-2012', 'aap-safe-sleep-2022'],
  act_texture_touch: ['tb-case-smith-9e-2025', 'who-care-for-child-development-2012', 'aap-safe-sleep-2022'],
  prt_checklist_birth_2m: ['cdc-milestone-checklists-2025', 'aap-milestones-2022', 'aap-safe-sleep-2022', 'nhs-baby-reviews-2023'],

  // --- Knowledge base: 3–4 months (guides) ----------------------------------
  gd_3_4m_gross_motor: ['aap-milestones-2022', 'cdc-milestone-checklists-2025', 'jr-who-motor-windows-2006', 'tb-campbell-pt-6e-2022', 'aap-safe-sleep-2022'],
  gd_3_4m_fine_motor: ['tb-case-smith-9e-2025', 'aap-milestones-2022', 'cdc-milestone-checklists-2025', 'aap-power-of-play-2018'],
  gd_3_4m_communication: ['nhs-learn-to-talk-2023', 'cdc-milestones-2026', 'aap-surveillance-2020', 'who-care-for-child-development-2012', 'jr-weisleder-2013'],
  gd_3_4m_social: ['cdc-milestones-2026', 'aap-milestones-2022', 'who-nurturing-care-2018', 'nice-ng194-postnatal-2021', 'nice-ph40-social-emotional-2012'],
  gd_3_4m_emotional: ['aap-toxic-stress-2021', 'who-nurturing-care-2018', 'nhs-seriously-ill-2023', 'nice-ng143-fever-2019', 'who-imci-chart-2014', 'tb-nelson-22e-2024'],
  gd_3_4m_cognitive: ['tb-dbp-5e-2022', 'cdc-milestone-checklists-2025', 'aap-milestones-2022', 'who-pa-sleep-under5-2019', 'aap-media-young-minds-2016'],
  gd_3_4m_play: ['aap-power-of-play-2018', 'who-care-for-child-development-2012', 'unicef-early-moments-2017', 'cdc-milestones-2026', 'aap-safe-sleep-2022'],
  gd_3_4m_nutrition: ['who-iycf-model-chapter-2025', 'who-unicef-iycf-strategy-2003', 'nhs-first-solid-foods-2026', 'who-bf-counselling-2018', 'nice-ng75-faltering-growth-2017', 'aap-breastfeeding-2022'],
  gd_3_4m_sleep: ['who-pa-sleep-under5-2019', 'aap-safe-sleep-2022', 'nhs-sids-2025', 'hc-safe-sleep-2026', 'jr-aasm-bedtime-2006'],
  gd_3_4m_safety: ['aap-drowning-2021', 'aap-safe-sleep-2022', 'nhs-seriously-ill-2023', 'nice-ng143-fever-2019', 'who-imci-chart-2014', 'tb-bright-futures-4e-2017'],
  gd_3_4m_daily_routine: ['who-nurturing-care-2018', 'jr-aasm-bedtime-2006', 'aap-drowning-2021', 'nice-ng143-fever-2019', 'tb-bright-futures-4e-2017', 'cdc-immunization-schedule-2025'],

  // --- Knowledge base: 3–4 months (activities + printable) ------------------
  act_copy_my_sound: ['nhs-learn-to-talk-2023', 'who-care-for-child-development-2012', 'jr-weisleder-2013', 'cdc-milestones-2026'],
  act_reach_for_the_toy: ['tb-case-smith-9e-2025', 'cdc-milestone-checklists-2025', 'aap-milestones-2022', 'aap-safe-sleep-2022', 'aap-power-of-play-2018'],
  act_peek_a_boo_cloth: ['aap-power-of-play-2018', 'who-nurturing-care-2018', 'cdc-milestones-2026', 'aap-safe-sleep-2022'],
  act_picture_book_naming: ['aap-literacy-2024', 'hc-early-literacy-2023', 'jr-dowdall-bookreading-2020', 'nhs-learn-to-talk-2023', 'aap-media-young-minds-2016'],
  act_rhythm_and_rock: ['who-care-for-child-development-2012', 'jr-aasm-bedtime-2006', 'aap-safe-sleep-2022'],
  act_texture_basket_infant: ['tb-case-smith-9e-2025', 'who-care-for-child-development-2012', 'aap-safe-sleep-2022'],
  prt_checklist_3_4m: ['cdc-milestone-checklists-2025', 'aap-milestones-2022', 'aap-safe-sleep-2022', 'nhs-baby-reviews-2023', 'who-iycf-model-chapter-2025'],

  // --- Knowledge base: 5–6 months (guides) ----------------------------------
  gd_5_6m_gross_motor: ['cdc-milestone-checklists-2025', 'aap-milestones-2022', 'jr-who-motor-windows-2006', 'aap-safe-sleep-2022', 'tb-campbell-pt-6e-2022'],
  gd_5_6m_fine_motor: ['cdc-milestone-checklists-2025', 'aap-milestones-2022', 'aap-power-of-play-2018', 'tb-case-smith-9e-2025'],
  gd_5_6m_speech: ['cdc-milestones-2026', 'aap-milestones-2022', 'nhs-learn-to-talk-2023', 'tb-paul-language-6e-2024', 'asha-late-language-emergence'],
  gd_5_6m_language: ['cdc-milestones-2026', 'aap-surveillance-2020', 'nhs-learn-to-talk-2023', 'jr-weisleder-2013', 'tb-paul-language-6e-2024'],
  gd_5_6m_communication: ['who-care-for-child-development-2012', 'cdc-milestones-2026', 'nhs-learn-to-talk-2023', 'jr-weisleder-2013', 'aap-media-young-minds-2016'],
  gd_5_6m_social: ['cdc-milestones-2026', 'aap-milestones-2022', 'who-nurturing-care-2018', 'nice-ph40-social-emotional-2012', 'aap-power-of-play-2018'],
  gd_5_6m_emotional: ['aap-toxic-stress-2021', 'who-nurturing-care-2018', 'nice-ng194-postnatal-2021', 'nice-ph40-social-emotional-2012', 'tb-nelson-22e-2024'],
  gd_5_6m_cognitive: ['cdc-milestone-checklists-2025', 'aap-milestones-2022', 'tb-dbp-5e-2022', 'aap-media-young-minds-2016', 'who-pa-sleep-under5-2019'],
  gd_5_6m_sleep: ['who-pa-sleep-under5-2019', 'aap-safe-sleep-2022', 'nhs-sids-2025', 'hc-safe-sleep-2026', 'jr-aasm-bedtime-2006', 'jr-hiscock-sleep-rct-2002'],
  gd_5_6m_safety: ['aap-drowning-2021', 'tb-bright-futures-4e-2017', 'nhs-seriously-ill-2023', 'nice-ng143-fever-2019', 'who-imci-chart-2014', 'aap-safe-sleep-2022'],
  gd_5_6m_daily_routine: ['who-nurturing-care-2018', 'tb-bright-futures-4e-2017', 'jr-aasm-bedtime-2006', 'jr-hiscock-sleep-rct-2002', 'who-iycf-model-chapter-2025', 'aap-drowning-2021', 'nice-ng143-fever-2019', 'cdc-immunization-schedule-2025'],

  // --- Knowledge base: 5–6 months (activities + printable) ------------------
  act_babble_back_and_forth: ['nhs-learn-to-talk-2023', 'cdc-milestones-2026', 'who-care-for-child-development-2012', 'jr-weisleder-2013'],
  act_roll_and_reach: ['cdc-milestone-checklists-2025', 'aap-milestones-2022', 'aap-safe-sleep-2022', 'tb-campbell-pt-6e-2022'],
  act_mirror_hello: ['aap-power-of-play-2018', 'who-nurturing-care-2018', 'cdc-milestones-2026'],
  act_board_book_point: ['aap-literacy-2024', 'hc-early-literacy-2023', 'nhs-learn-to-talk-2023', 'jr-dowdall-bookreading-2020'],
  act_clap_and_sing_5_6m: ['who-care-for-child-development-2012', 'aap-power-of-play-2018', 'jr-aasm-bedtime-2006', 'jr-hiscock-sleep-rct-2002'],
  act_safe_touch_basket: ['tb-case-smith-9e-2025', 'who-care-for-child-development-2012', 'aap-power-of-play-2018', 'aap-safe-sleep-2022'],
  prt_checklist_5_6m: ['cdc-milestone-checklists-2025', 'aap-milestones-2022', 'who-iycf-model-chapter-2025', 'aap-safe-sleep-2022', 'nhs-baby-reviews-2023'],

  // --- Knowledge base: 7–9 months (guides) ----------------------------------
  gd_7_9m_fine_motor: ['cdc-milestone-checklists-2025', 'aap-milestones-2022', 'aap-power-of-play-2018', 'tb-case-smith-9e-2025', 'tb-bright-futures-4e-2017'],
  gd_7_9m_speech: ['cdc-milestones-2026', 'aap-milestones-2022', 'nhs-learn-to-talk-2023', 'tb-paul-language-6e-2024', 'asha-late-language-emergence'],
  gd_7_9m_language: ['cdc-milestones-2026', 'aap-surveillance-2020', 'nhs-learn-to-talk-2023', 'jr-weisleder-2013', 'tb-paul-language-6e-2024'],
  gd_7_9m_communication: ['who-care-for-child-development-2012', 'cdc-milestones-2026', 'nhs-learn-to-talk-2023', 'jr-weisleder-2013', 'aap-media-young-minds-2016'],
  gd_7_9m_cognitive: ['cdc-milestone-checklists-2025', 'aap-milestones-2022', 'aap-power-of-play-2018', 'tb-dbp-5e-2022', 'aap-media-young-minds-2016', 'who-pa-sleep-under5-2019'],
  gd_7_9m_social: ['cdc-milestones-2026', 'aap-milestones-2022', 'who-nurturing-care-2018', 'nice-ph40-social-emotional-2012', 'aap-power-of-play-2018'],
  gd_7_9m_emotional: ['aap-toxic-stress-2021', 'who-nurturing-care-2018', 'nice-ng194-postnatal-2021', 'nice-ph40-social-emotional-2012', 'tb-nelson-22e-2024'],
  gd_7_9m_nutrition: ['who-complementary-feeding-2023', 'who-iycf-model-chapter-2025', 'who-iycf-indicators-2021', 'nhs-first-solid-foods-2026', 'cdc-foods-6-24m-2025', 'nice-ng247-maternal-child-nutrition-2025', 'asha-pediatric-feeding-swallowing'],
  gd_7_9m_self_help: ['tb-case-smith-9e-2025', 'tb-bright-futures-4e-2017', 'who-iycf-model-chapter-2025', 'cdc-foods-6-24m-2025', 'aota-early-intervention'],
  gd_7_9m_sleep: ['who-pa-sleep-under5-2019', 'aap-safe-sleep-2022', 'nhs-sids-2025', 'hc-safe-sleep-2026', 'jr-aasm-bedtime-2006', 'jr-hiscock-sleep-rct-2002'],
  gd_7_9m_safety: ['aap-drowning-2021', 'tb-bright-futures-4e-2017', 'nhs-seriously-ill-2023', 'nice-ng143-fever-2019', 'who-imci-chart-2014', 'aap-safe-sleep-2022'],
  gd_7_9m_daily_routine: ['who-nurturing-care-2018', 'tb-bright-futures-4e-2017', 'jr-aasm-bedtime-2006', 'jr-hiscock-sleep-rct-2002', 'who-iycf-model-chapter-2025', 'aap-drowning-2021', 'nice-ng143-fever-2019', 'cdc-immunization-schedule-2025'],

  // --- Knowledge base: 7–9 months (activities + printable) ------------------
  act_name_and_wait: ['nhs-learn-to-talk-2023', 'cdc-milestones-2026', 'who-care-for-child-development-2012', 'jr-weisleder-2013'],
  act_sit_and_reach_ring: ['cdc-milestone-checklists-2025', 'aap-milestones-2022', 'jr-who-motor-windows-2006', 'tb-campbell-pt-6e-2022'],
  act_wave_bye_bye: ['cdc-milestones-2026', 'aap-milestones-2022', 'who-care-for-child-development-2012', 'aap-power-of-play-2018'],
  act_lift_the_flap_book: ['aap-literacy-2024', 'hc-early-literacy-2023', 'nhs-learn-to-talk-2023', 'jr-dowdall-bookreading-2020'],
  act_drum_and_pause: ['who-care-for-child-development-2012', 'aap-power-of-play-2018', 'tb-dbp-5e-2022'],
  act_two_texture_spoons: ['who-iycf-model-chapter-2025', 'cdc-foods-6-24m-2025', 'tb-case-smith-9e-2025', 'asha-pediatric-feeding-swallowing'],
  prt_checklist_7_9m: ['cdc-milestone-checklists-2025', 'aap-milestones-2022', 'who-iycf-model-chapter-2025', 'aap-safe-sleep-2022', 'nhs-baby-reviews-2023'],

  // --- Activities -----------------------------------------------------------
  act_tummy_time_mirror: ['jr-who-motor-windows-2006', 'aap-safe-sleep-2022', 'tb-campbell-pt-6e-2022'],
  act_sound_tracking: ['who-care-for-child-development-2012', 'cdc-milestones-2026'],
  act_peekaboo: ['aap-power-of-play-2018', 'who-care-for-child-development-2012'],
  act_cup_stacking: ['tb-case-smith-9e-2025', 'aap-power-of-play-2018'],
  act_name_and_point: ['jr-weisleder-2013', 'nhs-learn-to-talk-2023'],
  act_obstacle_crawl: ['jr-who-motor-windows-2006', 'who-pa-sleep-under5-2019'],
  act_color_sort: ['aap-power-of-play-2018', 'tb-dbp-5e-2022'],
  act_feeling_faces: ['nice-ph40-social-emotional-2012', 'aap-toxic-stress-2021'],
  act_water_pouring: ['tb-case-smith-9e-2025', 'aap-drowning-2021'],
  act_obstacle_course: ['who-pa-sleep-under5-2019', 'tb-campbell-pt-6e-2022'],
  act_story_sequence: ['jr-dowdall-bookreading-2020', 'hc-early-literacy-2023'],
  act_name_writing: ['hc-early-literacy-2023', 'tb-handbook-ecse-2016'],

  // --- Lessons --------------------------------------------------------------
  lsn_what_is_development: ['who-nurturing-care-2018', 'jr-lancet-ecd-coming-of-age-2017', 'aap-milestones-2022', 'jr-lancet-nurturing-care-2017', 'who-nurturing-care-practice-guide-2023', 'who-ncf-progress-2023', 'unicef-early-moments-2017', 'jr-lancet-inequality-2011', 'tb-caring-birth-to-5-8e-2024'],
  lsn_power_of_play: ['aap-power-of-play-2018', 'jr-jamaica-1991', 'who-care-for-child-development-2012', 'who-improving-ecd-2020'],
  lsn_talk_more: ['jr-weisleder-2013', 'nhs-learn-to-talk-2023', 'tb-paul-language-6e-2024'],
  lsn_reading_together: ['jr-dowdall-bookreading-2020', 'aap-literacy-2024', 'hc-early-literacy-2023'],
  lsn_gentle_discipline: ['aap-toxic-stress-2021', 'cdc-positive-parenting-toddlers-2026', 'jr-plosmed-parenting-2021'],
  lsn_balanced_meals: ['who-complementary-feeding-2023', 'cdc-foods-6-24m-2025', 'nice-ng247-maternal-child-nutrition-2025', 'who-unicef-iycf-strategy-2003', 'who-bfhi-2017', 'who-bf-counselling-2018', 'who-iycf-indicators-2021', 'unicef-sowc-2019', 'jr-lancet-undernutrition-2013'],
  lsn_healthy_sleep: ['who-pa-sleep-under5-2019', 'jr-aasm-bedtime-2006', 'aap-safe-sleep-2022'],
  lsn_home_safety: ['aap-drowning-2021', 'tb-bright-futures-4e-2017', 'cdc-positive-parenting-toddlers-2026', 'tb-caring-birth-to-5-8e-2024'],
  lsn_screen_time: ['aap-media-young-minds-2016', 'jr-madigan-screen-language-2020', 'who-pa-sleep-under5-2019', 'hc-screen-time-5cs-2024', 'jr-madigan-screen-asq-2019'],
  lsn_big_feelings: ['nice-ph40-social-emotional-2012', 'aap-toxic-stress-2021'],
  lsn_making_friends: ['aap-power-of-play-2018', 'nice-ph40-social-emotional-2012'],
  lsn_early_math: ['aap-power-of-play-2018', 'tb-handbook-ecse-2016'],
  lsn_creativity: ['aap-power-of-play-2018', 'who-care-for-child-development-2012'],
  lsn_problem_solving_parenting: ['jr-plosmed-parenting-2021', 'cdc-positive-parenting-toddlers-2026', 'jr-pakistan-lhw-2014'],
  lsn_special_needs_awareness: ['who-unicef-developmental-disabilities-2023', 'unicef-seen-counted-included-2022', 'aap-surveillance-2020', 'tb-ccitsn-3e-2004'],
  lsn_prepare_preschool: ['tb-handbook-ecse-2016', 'nice-ph40-social-emotional-2012'],
  lsn_prepare_school: ['hc-early-literacy-2023', 'tb-handbook-ecse-2016', 'aap-literacy-2024'],
  lsn_doctor_visits: ['tb-bright-futures-4e-2017', 'nhs-baby-reviews-2023', 'cdc-monitoring-screening-2026', 'nhs-vaccinations-2023', 'cdc-immunization-schedule-2025', 'who-ia2030-2020', 'jr-asq3-argentina-2018', 'myanmar-nsp-newborn-child-2015'],
  lsn_parent_wellbeing: ['nice-ng194-postnatal-2021', 'aap-toxic-stress-2021', 'jr-hiscock-sleep-rct-2002'],
  lsn_language_rich_home: ['jr-weisleder-2013', 'jr-dowdall-bookreading-2020', 'aap-literacy-2024'],

  // --- Special-needs awareness ----------------------------------------------
  // Awareness only. None of these items screen, score or diagnose; the
  // references are the recognition-and-referral literature a parent-facing
  // awareness page is allowed to summarise.
  sn_autism: ['aap-asd-2020', 'cdc-autism-signs-2024', 'nice-cg128-autism-2011', 'who-unicef-developmental-disabilities-2023'],
  sn_speech_delay: ['asha-late-language-emergence', 'tb-paul-language-6e-2024', 'nhs-learn-to-talk-2023', 'asha-speech-sound-disorders'],
  sn_adhd: ['nice-ng87-adhd-2018', 'tb-dbp-5e-2022'],
  sn_down_syndrome: ['tb-nelson-22e-2024', 'who-unicef-developmental-disabilities-2023', 'tb-dbp-5e-2022'],
  sn_cerebral_palsy: ['nice-ng62-cerebral-palsy-2017', 'tb-swaiman-7e-2025', 'tb-campbell-pt-6e-2022'],
  sn_hearing_loss: ['tb-nelson-22e-2024', 'asha-spoken-language-disorders', 'who-unicef-developmental-disabilities-2023'],
  sn_visual_impairment: ['tb-nelson-22e-2024', 'who-unicef-developmental-disabilities-2023'],
  sn_global_developmental_delay: ['aap-surveillance-2020', 'tb-dbp-5e-2022', 'who-unicef-developmental-disabilities-2023', 'tb-bayley-4-2019', 'nice-ng72-preterm-2017', 'tb-ccitsn-3e-2004'],
  sn_learning_disability: ['tb-dbp-5e-2022', 'unicef-seen-counted-included-2022', 'tb-handbook-ecse-2016'],
  sn_sensory_processing: ['tb-case-smith-9e-2025', 'aota-early-intervention'],
  sn_dyslexia: ['tb-dbp-5e-2022', 'asha-spoken-language-disorders', 'hc-early-literacy-2023'],
  sn_developmental_coordination_disorder: ['tb-case-smith-9e-2025', 'tb-campbell-pt-6e-2022', 'tb-dbp-5e-2022'],
  sn_selective_mutism: ['tb-dbp-5e-2022', 'asha-spoken-language-disorders', 'nice-ph40-social-emotional-2012'],

  // --- Stories ---------------------------------------------------------------
  // Stories teach one developmental idea each; the reference backs that idea,
  // not the narrative.
  st_little_seed: ['who-nurturing-care-2018', 'aap-milestones-2022'],
  st_ba_ba_sounds: ['nhs-learn-to-talk-2023', 'jr-weisleder-2013', 'tb-paul-language-6e-2024'],
  st_when_i_feel_angry: ['nice-ph40-social-emotional-2012', 'aap-toxic-stress-2021'],
  st_taking_turns: ['aap-power-of-play-2018', 'nice-ph40-social-emotional-2012'],
  st_goodnight_moon_friend: ['jr-aasm-bedtime-2006', 'who-pa-sleep-under5-2019', 'jr-dowdall-bookreading-2020'],
  st_waiting_at_clinic: ['tb-bright-futures-4e-2017', 'nhs-baby-reviews-2023'],
  st_visit_to_doctor: ['tb-bright-futures-4e-2017', 'cdc-monitoring-screening-2026'],
  st_first_day_school: ['tb-handbook-ecse-2016', 'nice-ph40-social-emotional-2012'],
  st_sharing_mango: ['aap-power-of-play-2018', 'who-care-for-child-development-2012'],

  // --- Printables ------------------------------------------------------------
  prt_flash_cards: ['jr-weisleder-2013', 'hc-early-literacy-2023'],
  prt_emotion_cards: ['nice-ph40-social-emotional-2012', 'aap-toxic-stress-2021'],
  prt_communication_cards: ['who-care-for-child-development-2012', 'asha-spoken-language-disorders'],
  prt_routine_chart: ['tb-bright-futures-4e-2017', 'cdc-positive-parenting-toddlers-2026'],
  prt_reward_chart: ['cdc-positive-parenting-toddlers-2026', 'jr-plosmed-parenting-2021'],
  prt_behavior_chart: ['cdc-positive-parenting-toddlers-2026', 'jr-plosmed-parenting-2021'],
  prt_visual_schedule: ['tb-case-smith-9e-2025', 'tb-handbook-ecse-2016'],
  prt_doctor_visit_checklist: ['tb-bright-futures-4e-2017', 'nhs-baby-reviews-2023', 'cdc-monitoring-screening-2026'],
  prt_growth_log: ['who-growth-standards-2006', 'nice-ng75-faltering-growth-2017'],
  prt_sleep_diary: ['jr-hiscock-sleep-rct-2002', 'who-pa-sleep-under5-2019'],
  prt_milestone_checklist: ['cdc-milestone-checklists-2025', 'aap-milestones-2022', 'aap-surveillance-2020'],
};

/**
 * References behind the deterministic safety engine
 * (src/domain/safety/safety.ts). These do not drive the logic — the logic is
 * fixed and rule-based — they are what a clinical reviewer checks the wording
 * of each urgent rule against.
 */
export const SAFETY_RULE_SOURCES: Record<string, string[]> = {
  severe_breathing_difficulty: ['nhs-seriously-ill-2023', 'who-imci-chart-2014', 'tb-nelson-22e-2024'],
  blue_lips: ['nhs-seriously-ill-2023', 'who-imci-chart-2014'],
  breathing_pauses: ['nhs-seriously-ill-2023', 'tb-nelson-22e-2024'],
  seizure: ['nice-ng143-fever-2019', 'tb-swaiman-7e-2025', 'nhs-seriously-ill-2023'],
  unresponsiveness: ['nhs-seriously-ill-2023', 'who-imci-chart-2014'],
  sudden_weakness: ['tb-swaiman-7e-2025', 'nhs-seriously-ill-2023'],
  serious_injury: ['aap-drowning-2021', 'nhs-seriously-ill-2023'],
  severe_dehydration: ['who-imci-chart-2014', 'nhs-seriously-ill-2023', 'tb-nelson-22e-2024'],
  loss_of_acquired_skills: ['aap-surveillance-2020', 'cdc-autism-signs-2024', 'aap-asd-2020'],
  /** The standing skill-loss question asked alongside every milestone check. */
  skill_loss_question: ['aap-surveillance-2020', 'aap-asd-2020', 'cdc-monitoring-screening-2026'],
  /** The fixed emergency wording shown when any urgent rule fires. */
  emergency_message: ['nhs-seriously-ill-2023', 'who-imci-chart-2014'],
};

/** References behind each Hope Center (awareness) topic. */
export const HOPE_TOPIC_SOURCES: Record<string, string[]> = {
  'autism-spectrum': ['aap-asd-2020', 'cdc-autism-signs-2024', 'nice-cg128-autism-2011', 'jr-mchat-rf-2014'],
  'speech-language-delay': ['asha-late-language-emergence', 'tb-paul-language-6e-2024', 'nhs-learn-to-talk-2023'],
  adhd: ['nice-ng87-adhd-2018', 'tb-dbp-5e-2022'],
  'hearing-loss': ['tb-nelson-22e-2024', 'asha-spoken-language-disorders', 'who-unicef-developmental-disabilities-2023'],
  'cerebral-palsy': ['nice-ng62-cerebral-palsy-2017', 'tb-swaiman-7e-2025', 'tb-campbell-pt-6e-2022'],
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
      const domain = item.domainKey ?? '';
      const domainIds = MILESTONE_DOMAIN_SOURCES[domain];
      if (!domainIds) {
        // A milestone domain with no reference mapping is a gap, not a default.
        orphans.push(`milestone_domain_unmapped:${domain}:${item.slug}`);
      }
      push(kind, item.slug, [...MILESTONE_BASE_SOURCES, ...(domainIds ?? [])]);
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
  return [...SOURCE_BY_ID.keys()].filter((id) => !RELATED_BY_SOURCE.has(id)).sort();
}
