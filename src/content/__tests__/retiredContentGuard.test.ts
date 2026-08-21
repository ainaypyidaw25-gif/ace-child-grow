import { describe, expect, it } from 'vitest';
import {
  BRIGHT_FUTURES_DUPLICATE_MILESTONE_RETIREMENT_TARGET,
  DUPLICATE_MILESTONE_SLUGS,
  FLASH_CARDS_PRINTABLE_RETIREMENT_SLUG,
  MOTOR_PSEUDO_MILESTONE_RETIREMENT_SLUGS,
  NUTRITION_PSEUDO_MILESTONE_RETIREMENT_SLUGS,
  PLAY_PSEUDO_MILESTONE_RETIREMENT_SLUGS,
  REMAINING_PSEUDO_MILESTONE_RETIREMENT_SLUGS,
  SLEEP_PSEUDO_MILESTONE_RETIREMENT_SLUGS,
  SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_SLUGS,
  isRetiredContentItem,
  isRetiredContentSlug,
  isRetiredMilestoneSlug,
} from '../../../convex/lib/contentRetirements';
import { seedPayload } from '../seed';

const RETIRED_MILESTONE_SLUGS = [
  ...DUPLICATE_MILESTONE_SLUGS,
  ...SOCIAL_EMOTIONAL_MILESTONE_RETIREMENT_SLUGS,
  BRIGHT_FUTURES_DUPLICATE_MILESTONE_RETIREMENT_TARGET.slug,
  ...PLAY_PSEUDO_MILESTONE_RETIREMENT_SLUGS,
  ...NUTRITION_PSEUDO_MILESTONE_RETIREMENT_SLUGS,
  ...SLEEP_PSEUDO_MILESTONE_RETIREMENT_SLUGS,
  ...MOTOR_PSEUDO_MILESTONE_RETIREMENT_SLUGS,
  ...REMAINING_PSEUDO_MILESTONE_RETIREMENT_SLUGS,
] as const;

describe('durable retired-content guard', () => {
  it('binds exactly 56 unique milestones plus one printable', () => {
    expect(RETIRED_MILESTONE_SLUGS).toHaveLength(56);
    expect(new Set(RETIRED_MILESTONE_SLUGS).size).toBe(56);
    for (const slug of RETIRED_MILESTONE_SLUGS) {
      expect(isRetiredMilestoneSlug(slug), slug).toBe(true);
      expect(isRetiredContentItem('milestone', slug), slug).toBe(true);
      expect(isRetiredContentSlug(slug), slug).toBe(true);
      expect(isRetiredContentItem('guide', slug), slug).toBe(false);
    }
    expect(isRetiredContentItem('printable', FLASH_CARDS_PRINTABLE_RETIREMENT_SLUG)).toBe(true);
    expect(isRetiredContentItem('milestone', FLASH_CARDS_PRINTABLE_RETIREMENT_SLUG)).toBe(false);
    expect(isRetiredContentSlug(FLASH_CARDS_PRINTABLE_RETIREMENT_SLUG)).toBe(true);
  });

  it('keeps every one of the 57 retired keys out of deterministic seed payloads', () => {
    const activeKeys = new Set(seedPayload().map((item) => `${item.type}:${item.slug}`));
    const retiredKeys = [
      ...RETIRED_MILESTONE_SLUGS.map((slug) => `milestone:${slug}`),
      `printable:${FLASH_CARDS_PRINTABLE_RETIREMENT_SLUG}`,
    ];
    expect(retiredKeys).toHaveLength(57);
    expect(new Set(retiredKeys).size).toBe(57);
    for (const key of retiredKeys) expect(activeKeys.has(key), key).toBe(false);
  });
});
