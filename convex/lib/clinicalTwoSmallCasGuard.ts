const targetSlugs = new Set(['sn_cerebral_palsy', 'gd_3_4m_sleep']);
const targetKeys = new Set([
  'special_need:sn_cerebral_palsy',
  'guide:gd_3_4m_sleep',
]);
const sourceIds = new Set([
  'aap-safe-sleep-2022',
  'hc-safe-sleep-2026',
  'jr-aasm-bedtime-2006',
  'nhs-sids-2025',
  'nice-ng62-cerebral-palsy-2017',
  'who-pa-sleep-under5-2019',
]);

/** Protects exact content postimages from every broad seed/import path. */
export function isClinicalTwoSmallCasTargetSlug(slug: string): boolean {
  return targetSlugs.has(slug);
}

/** Protects exact evidence-link postimages from generic link imports. */
export function isClinicalTwoSmallCasTarget(kind: string, slug: string): boolean {
  return targetKeys.has(`${kind}:${slug}`);
}

/** Protects citation source preimages from generic registry refreshes. */
export function isClinicalTwoSmallCasSource(sourceId: string): boolean {
  return sourceIds.has(sourceId);
}
