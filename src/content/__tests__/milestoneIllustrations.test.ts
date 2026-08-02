import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { MILESTONE_ILLUSTRATIONS, milestoneIllustration } from '../milestoneIllustrations';

const BIRTH_2M_SLUGS = [
  'ms_birth_2m_sleep_1',
  'ms_birth_2m_nutrition_1',
  'ms_birth_2m_play_1',
  'ms_birth_2m_emotional_1',
  'ms_birth_2m_communication_2',
  'ms_birth_2m_cognitive_1',
  'ms_birth_2m_fine_motor_1',
  'ms_birth_2m_gross_motor_2',
  'ms_birth_2m_social_2',
  'ms_birth_2m_communication_1',
  'ms_birth_2m_social_1',
  'ms_birth_2m_gross_motor_1',
] as const;

const THREE_4M_SLUGS = [
  'ms_3_4m_cognitive_1',
  'ms_3_4m_communication_1',
  'ms_3_4m_emotional_1',
  'ms_3_4m_fine_motor_1',
  'ms_3_4m_fine_motor_2',
  'ms_3_4m_gross_motor_1',
  'ms_3_4m_gross_motor_2',
  'ms_3_4m_language_1',
  'ms_3_4m_nutrition_1',
  'ms_3_4m_sleep_1',
  'ms_3_4m_social_1',
  'ms_3_4m_speech_1',
] as const;

const FIVE_6M_SLUGS = [
  'ms_5_6m_cognitive_1',
  'ms_5_6m_cognitive_2',
  'ms_5_6m_fine_motor_1',
  'ms_5_6m_gross_motor_1',
  'ms_5_6m_gross_motor_2',
  'ms_5_6m_language_1',
  'ms_5_6m_nutrition_1',
  'ms_5_6m_play_1',
  'ms_5_6m_sleep_1',
  'ms_5_6m_social_1',
  'ms_5_6m_speech_1',
  'ms_5_6m_speech_2',
] as const;

const SEVEN_9M_SLUGS = [
  'ms_7_9m_cognitive_1',
  'ms_7_9m_fine_motor_1',
  'ms_7_9m_fine_motor_2',
  'ms_7_9m_gross_motor_1',
  'ms_7_9m_gross_motor_2',
  'ms_7_9m_language_1',
  'ms_7_9m_language_2',
  'ms_7_9m_nutrition_1',
  'ms_7_9m_self_help_1',
  'ms_7_9m_social_1',
  'ms_7_9m_social_2',
  'ms_7_9m_speech_1',
] as const;

const TEN_12M_SLUGS = [
  'ms_10_12m_problem_solving_2',
  'ms_10_12m_self_help_1',
] as const;

const THIRTEEN_18M_SLUGS = ['ms_13_18m_language_1', 'ms_13_18m_speech_1'] as const;

const NINETEEN_24M_SLUGS = [
  'ms_19_24m_play_1',
  'ms_19_24m_emotional_1',
  'ms_19_24m_cognitive_1',
  'ms_19_24m_language_1',
] as const;

describe('birth–2 month milestone illustrations', () => {
  it('maps every published production slug to its own versioned WebP', () => {
    const paths = BIRTH_2M_SLUGS.map((slug) => milestoneIllustration(slug));
    expect(paths.every((path) => path?.endsWith('.webp'))).toBe(true);
    expect(new Set(paths).size).toBe(BIRTH_2M_SLUGS.length);

    BIRTH_2M_SLUGS.forEach((slug) => {
      expect(milestoneIllustration(slug)).toMatch(new RegExp(`/${slug}\\.[a-f0-9]{10}\\.webp$`));
    });
  });

  it('does not provide a fallback for another age group or an unknown slug', () => {
    expect(milestoneIllustration('ms_2y_social_1')).toBeUndefined();
    expect(milestoneIllustration('unknown')).toBeUndefined();
  });
});

describe('10–12 month milestone illustrations', () => {
  it('maps every published production slug to its own versioned WebP', () => {
    const paths = TEN_12M_SLUGS.map((slug) => milestoneIllustration(slug));
    expect(paths.every((path) => path?.startsWith('/milestones/10_12m/'))).toBe(true);
    expect(paths.every((path) => path?.endsWith('.webp'))).toBe(true);
    expect(new Set(paths).size).toBe(TEN_12M_SLUGS.length);

    TEN_12M_SLUGS.forEach((slug) => {
      expect(milestoneIllustration(slug)).toMatch(new RegExp(`/${slug}\\.[a-f0-9]{10}\\.webp$`));
    });
  });

  it('does not provide a domain fallback or an approximate image', () => {
    expect(milestoneIllustration('problem_solving')).toBeUndefined();
    expect(milestoneIllustration('ms_10_12m_unknown_1')).toBeUndefined();
  });

  it('resolves every exact slug to an existing asset file', () => {
    TEN_12M_SLUGS.forEach((slug) => {
      const assetPath = milestoneIllustration(slug);
      expect(assetPath).toBeDefined();
      expect(existsSync(resolve(process.cwd(), 'public', assetPath!.slice(1)))).toBe(true);
    });
  });
});

describe('13–18 month milestone illustrations', () => {
  it('maps every published production slug to its own versioned WebP', () => {
    const paths = THIRTEEN_18M_SLUGS.map((slug) => milestoneIllustration(slug));
    expect(paths.every((path) => path?.startsWith('/milestones/13_18m/'))).toBe(true);
    expect(paths.every((path) => path?.endsWith('.webp'))).toBe(true);
    expect(new Set(paths).size).toBe(THIRTEEN_18M_SLUGS.length);

    THIRTEEN_18M_SLUGS.forEach((slug) => {
      expect(milestoneIllustration(slug)).toMatch(new RegExp(`/${slug}\\.[a-f0-9]{10}\\.webp$`));
    });
  });

  it('does not provide a domain fallback or an approximate image', () => {
    expect(milestoneIllustration('language')).toBeUndefined();
    expect(milestoneIllustration('ms_13_18m_unknown_1')).toBeUndefined();
  });

  it('resolves every exact slug to an existing asset file', () => {
    THIRTEEN_18M_SLUGS.forEach((slug) => {
      const assetPath = milestoneIllustration(slug);
      expect(assetPath).toBeDefined();
      expect(existsSync(resolve(process.cwd(), 'public', assetPath!.slice(1)))).toBe(true);
    });
  });
});

describe('19–24 month milestone illustrations', () => {
  it('maps every published production slug to its own versioned WebP', () => {
    const paths = NINETEEN_24M_SLUGS.map((slug) => milestoneIllustration(slug));
    expect(paths.every((path) => path?.startsWith('/milestones/19_24m/'))).toBe(true);
    expect(paths.every((path) => path?.endsWith('.webp'))).toBe(true);
    expect(new Set(paths).size).toBe(NINETEEN_24M_SLUGS.length);

    NINETEEN_24M_SLUGS.forEach((slug) => {
      expect(milestoneIllustration(slug)).toMatch(new RegExp(`/${slug}\\.[a-f0-9]{10}\\.webp$`));
    });
  });

  it('adds only the target-age mappings alongside the existing age groups', () => {
    expect(Object.keys(MILESTONE_ILLUSTRATIONS).sort()).toEqual(
      [
        ...BIRTH_2M_SLUGS,
        ...THREE_4M_SLUGS,
        ...FIVE_6M_SLUGS,
        ...SEVEN_9M_SLUGS,
        ...TEN_12M_SLUGS,
        ...THIRTEEN_18M_SLUGS,
        ...NINETEEN_24M_SLUGS,
      ].sort(),
    );
  });

  it('does not provide a domain fallback or an approximate image', () => {
    expect(milestoneIllustration('play')).toBeUndefined();
    expect(milestoneIllustration('ms_19_24m_unknown_1')).toBeUndefined();
  });

  it('resolves every exact slug to an existing asset file', () => {
    NINETEEN_24M_SLUGS.forEach((slug) => {
      const assetPath = milestoneIllustration(slug);
      expect(assetPath).toBeDefined();
      expect(existsSync(resolve(process.cwd(), 'public', assetPath!.slice(1)))).toBe(true);
    });
  });
});

describe('3–4 month milestone illustrations', () => {
  it('maps every published production slug to its own versioned WebP', () => {
    const paths = THREE_4M_SLUGS.map((slug) => milestoneIllustration(slug));
    expect(paths.every((path) => path?.startsWith('/milestones/3_4m/'))).toBe(true);
    expect(paths.every((path) => path?.endsWith('.webp'))).toBe(true);
    expect(new Set(paths).size).toBe(THREE_4M_SLUGS.length);

    THREE_4M_SLUGS.forEach((slug) => {
      expect(milestoneIllustration(slug)).toMatch(new RegExp(`/${slug}\\.[a-f0-9]{10}\\.webp$`));
    });
  });
});

describe('5–6 month milestone illustrations', () => {
  it('maps every published production slug to its own versioned WebP', () => {
    const paths = FIVE_6M_SLUGS.map((slug) => milestoneIllustration(slug));
    expect(paths.every((path) => path?.startsWith('/milestones/5_6m/'))).toBe(true);
    expect(paths.every((path) => path?.endsWith('.webp'))).toBe(true);
    expect(new Set(paths).size).toBe(FIVE_6M_SLUGS.length);

    FIVE_6M_SLUGS.forEach((slug) => {
      expect(milestoneIllustration(slug)).toMatch(new RegExp(`/${slug}\\.[a-f0-9]{10}\\.webp$`));
    });
  });

  it('does not provide a domain fallback or an approximate image', () => {
    expect(milestoneIllustration('social')).toBeUndefined();
    expect(milestoneIllustration('ms_5_6m_unknown_1')).toBeUndefined();
  });

  it('resolves every exact slug to an existing asset file', () => {
    FIVE_6M_SLUGS.forEach((slug) => {
      const assetPath = milestoneIllustration(slug);
      expect(assetPath).toBeDefined();
      expect(existsSync(resolve(process.cwd(), 'public', assetPath!.slice(1)))).toBe(true);
    });
  });
});

describe('7–9 month milestone illustrations', () => {
  it('maps every published production slug to its own versioned WebP', () => {
    const paths = SEVEN_9M_SLUGS.map((slug) => milestoneIllustration(slug));
    expect(paths.every((path) => path?.startsWith('/milestones/7_9m/'))).toBe(true);
    expect(paths.every((path) => path?.endsWith('.webp'))).toBe(true);
    expect(new Set(paths).size).toBe(SEVEN_9M_SLUGS.length);

    SEVEN_9M_SLUGS.forEach((slug) => {
      expect(milestoneIllustration(slug)).toMatch(new RegExp(`/${slug}\\.[a-f0-9]{10}\\.webp$`));
    });
  });

  it('does not provide a domain fallback or an approximate image', () => {
    expect(milestoneIllustration('fine_motor')).toBeUndefined();
    expect(milestoneIllustration('ms_7_9m_unknown_1')).toBeUndefined();
  });

  it('resolves every exact slug to an existing asset file', () => {
    SEVEN_9M_SLUGS.forEach((slug) => {
      const assetPath = milestoneIllustration(slug);
      expect(assetPath).toBeDefined();
      expect(existsSync(resolve(process.cwd(), 'public', assetPath!.slice(1)))).toBe(true);
    });
  });
});
