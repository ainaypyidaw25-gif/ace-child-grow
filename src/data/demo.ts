// Demo state for the foundation build (no backend yet).
// A single in-memory demo child so screens are interactive. Replaced by real
// Supabase-backed child data once auth/integration lands.
import { SAMPLE_ACTIVITIES } from './seed/content';
import type { RecommendableActivity } from '../domain/activities/recommend';

export const DEMO_CHILD = {
  nickname: 'Little Star',
  ageMonths: 30, // ~2y6m demo age
};

/** Adapt seed activities (with stable ids) to the recommender's shape. */
export const DEMO_ACTIVITY_CATALOGUE: RecommendableActivity[] = SAMPLE_ACTIVITIES.map(
  (a, i) => ({
    id: `act-${i}`,
    domain: a.domain,
    ageMinMonths: a.ageMinMonths,
    ageMaxMonths: a.ageMaxMonths,
    titleMm: a.titleMm,
    titleEn: a.titleEn,
  }),
);
