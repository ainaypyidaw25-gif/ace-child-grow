import { describe, expect, it } from 'vitest';
import { hasFamilyProfiles, safePlanKey } from '../../screens/Profile';

describe('profile compatibility helpers', () => {
  it('falls back to the free plan for missing or legacy plan values', () => {
    expect(safePlanKey(undefined)).toBe('free');
    expect(safePlanKey('legacy')).toBe('free');
    expect(safePlanKey('premium')).toBe('premium');
    expect(safePlanKey('family')).toBe('family');
  });

  it('handles missing legacy feature lists without throwing', () => {
    expect(hasFamilyProfiles(undefined)).toBe(false);
    expect(hasFamilyProfiles(null)).toBe(false);
    expect(hasFamilyProfiles('family_profiles')).toBe(false);
    expect(hasFamilyProfiles(['family_profiles'])).toBe(true);
  });
});
