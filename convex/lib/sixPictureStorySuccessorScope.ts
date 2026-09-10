/**
 * Exact catalogue identities for the six source-corrected picture-story
 * activity successors.
 *
 * Their bilingual copy, evidence links and placeholder-only media are frozen
 * inputs to an AI-preview release. Generic admin imports, CLI seeds and
 * historical errata must therefore leave both existing rows and absent rows
 * untouched. Match content by slug even when a stale caller supplies the wrong
 * kind, because library content is upserted by slug.
 */
export const SIX_PICTURE_STORY_SUCCESSOR_TARGETS = [
  { slug: 'act_picture_story_2_5y', currentRevision: 5, successorRevision: 6 },
  { slug: 'act_picture_story_3y', currentRevision: 5, successorRevision: 6 },
  { slug: 'act_picture_story_3_5y', currentRevision: 6, successorRevision: 7 },
  { slug: 'act_picture_story_4y', currentRevision: 5, successorRevision: 6 },
  { slug: 'act_picture_story_4_5y', currentRevision: 5, successorRevision: 6 },
  { slug: 'act_picture_story_5y', currentRevision: 5, successorRevision: 6 },
] as const;

export const SIX_PICTURE_STORY_SUCCESSOR_SLUGS =
  SIX_PICTURE_STORY_SUCCESSOR_TARGETS.map((target) => target.slug);

export const SIX_PICTURE_STORY_SUCCESSOR_SOURCE_IDS = [
  'aap-power-of-play-2018',
  'cdc-milestones-2026',
] as const;

export function isSixPictureStorySuccessorSlug(slug: string): boolean {
  return SIX_PICTURE_STORY_SUCCESSOR_SLUGS.some((target) => target === slug);
}

export function isSixPictureStorySuccessorLink(kind: string, slug: string): boolean {
  return kind === 'activity' && isSixPictureStorySuccessorSlug(slug);
}
