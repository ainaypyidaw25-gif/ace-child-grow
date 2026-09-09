// Combined content-library seed. This is the single source imported into Convex
// (convex/library.ts:importSeed). The app then reads content from the database —
// components never embed content. Re-running the import is idempotent by slug.
import { normalize, type NormalizedItem, type SeedItem } from '../types';
import { MILESTONES } from './milestones';
import { GUIDES } from './guides';
import { ACTIVITIES } from './activities';
import { LESSONS } from './lessons';
import { SPECIAL_NEEDS } from './specialNeeds';
import { STORIES } from './stories';
import { PRINTABLES } from './printables';
import { INFANT_CONTENT } from './infant';
import { OLDER_AUTHORED_CONTENT } from './older';
import { isRetiredContentSlug } from '../../../convex/lib/contentRetirements';

const AUTHORED_SEED: SeedItem[] = [
  ...MILESTONES,
  ...GUIDES,
  ...ACTIVITIES,
  ...LESSONS,
  ...SPECIAL_NEEDS,
  ...STORIES,
  ...PRINTABLES,
  ...INFANT_CONTENT,
  ...OLDER_AUTHORED_CONTENT,
];

// Every code-reviewed retirement remains absent from new seed/import payloads,
// even if an old authored row is accidentally restored during a later edit.
export const RAW_SEED: SeedItem[] = AUTHORED_SEED.filter(
  (item) => !isRetiredContentSlug(item.slug),
);

export const CONTENT_SEED: NormalizedItem[] = RAW_SEED.map(normalize);

/** Plain payload for the Convex import mutation (no functions, JSON-safe). */
export function seedPayload(): NormalizedItem[] {
  return CONTENT_SEED;
}
