// Activity recommendation engine (Phase 10).
// Pure, rule-based selection. No AI. NEVER recommends an activity outside the
// child's structured age range. Avoids excessive repetition using recent history.

import type { DevelopmentDomain } from '../types';

export interface RecommendableActivity {
  id: string;
  domain: DevelopmentDomain;
  ageMinMonths: number;
  ageMaxMonths: number;
  titleMm: string;
  titleEn: string;
}

export interface RecommendInput {
  /** Age to match against activity ranges (corrected age when applicable). */
  ageMonths: number;
  catalogue: RecommendableActivity[];
  /** Domains where skills are still emerging — lightly prioritized. */
  emergingDomains?: DevelopmentDomain[];
  /** Activity ids completed recently — de-prioritized to avoid repetition. */
  recentActivityIds?: string[];
}

export type Slot = 'morning' | 'afternoon' | 'evening';

export interface DailyPlan {
  morning: RecommendableActivity | null;
  afternoon: RecommendableActivity | null;
  evening: RecommendableActivity | null;
}

/** Activities whose age range includes ageMonths. Hard safety filter. */
export function eligibleActivities(
  ageMonths: number,
  catalogue: RecommendableActivity[],
): RecommendableActivity[] {
  if (!Number.isFinite(ageMonths) || ageMonths < 0) return [];
  return catalogue.filter(
    (a) => ageMonths >= a.ageMinMonths && ageMonths <= a.ageMaxMonths,
  );
}

/**
 * Rank eligible activities: emerging-domain match first, then not-recently-done,
 * then a stable order by id. Returns a scored, ordered list.
 */
export function rankActivities(input: RecommendInput): RecommendableActivity[] {
  const emerging = new Set(input.emergingDomains ?? []);
  const recent = new Set(input.recentActivityIds ?? []);
  return eligibleActivities(input.ageMonths, input.catalogue)
    .map((a) => {
      let score = 0;
      if (emerging.has(a.domain)) score += 2;
      if (!recent.has(a.id)) score += 1;
      return { a, score };
    })
    .sort((x, y) => (y.score - x.score) || x.a.id.localeCompare(y.a.id))
    .map((s) => s.a);
}

/** Build a morning/afternoon/evening plan with distinct activities where possible. */
export function buildDailyPlan(input: RecommendInput): DailyPlan {
  const ranked = rankActivities(input);
  const picked: RecommendableActivity[] = [];
  for (const a of ranked) {
    if (picked.length >= 3) break;
    // Prefer domain variety across the day when we have enough choices.
    if (ranked.length >= 3 && picked.some((p) => p.domain === a.domain)) continue;
    picked.push(a);
  }
  // Backfill if variety left us short.
  if (picked.length < 3) {
    for (const a of ranked) {
      if (picked.length >= 3) break;
      if (!picked.includes(a)) picked.push(a);
    }
  }
  return {
    morning: picked[0] ?? null,
    afternoon: picked[1] ?? null,
    evening: picked[2] ?? null,
  };
}
