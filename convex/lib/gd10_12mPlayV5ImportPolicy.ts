const targetKind = 'guide';
const targetSlug = 'gd_10_12m_play';

const frozenSourceIds = new Set([
  'aap-power-of-play-2018',
  'who-care-for-child-development-2012',
  'unicef-early-moments-2017',
  'tb-bright-futures-4e-2017',
  'aap-drowning-2021',
  'aap-safe-sleep-2022',
  'cpsc-childproofing-home-2023',
  'hc-choking-prevention-2026',
]);

/** Lightweight broad-write guards; this module deliberately does not load seedData. */
export function isGd10_12mPlayV5ContentSlug(slug: string): boolean {
  return slug === targetSlug;
}

export function isGd10_12mPlayV5Link(kind: string, slug: string): boolean {
  return kind === targetKind && slug === targetSlug;
}

export function isGd10_12mPlayV5Source(sourceId: string): boolean {
  return frozenSourceIds.has(sourceId);
}
