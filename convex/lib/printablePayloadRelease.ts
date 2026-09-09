/**
 * Exact production release for printable catalogue rows that still claim an
 * A4 PDF exists while their only PDF media row is an unreviewed placeholder.
 */
export const PRINTABLE_PAYLOAD_RELEASE_ID =
  '2026-08-11-placeholder-printables' as const;

export const PLACEHOLDER_PRINTABLE_SLUGS = [
  'prt_behavior_chart',
  'prt_checklist_10_12m',
  'prt_checklist_5_6m',
  'prt_checklist_7_9m',
  'prt_communication_cards',
  'prt_doctor_visit_checklist',
  'prt_flash_cards',
  'prt_growth_log',
  'prt_reward_chart',
  'prt_routine_chart',
  'prt_sleep_diary',
  'prt_visual_schedule',
] as const;

export type PlaceholderPrintableSlug = (typeof PLACEHOLDER_PRINTABLE_SLUGS)[number];

const placeholderPrintableSlugs = new Set<string>(PLACEHOLDER_PRINTABLE_SLUGS);

export function isPlaceholderPrintableSlug(slug: string): slug is PlaceholderPrintableSlug {
  return placeholderPrintableSlugs.has(slug);
}
