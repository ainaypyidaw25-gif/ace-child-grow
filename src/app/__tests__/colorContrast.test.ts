import { describe, expect, it } from 'vitest';
import config from '../../../tailwind.config';

// ACG-A11Y-004. `mint` (#73C7A5) is only 2.0:1 on white — it was being used as
// small body text on light cards and badges, well under the WCAG AA 4.5:1
// needed for normal text. These assertions pin the token values so the
// accessible pairing cannot be quietly undone by a palette tweak.

type Palette = Record<string, string | Record<string, string>>;
const colors = (config.theme?.extend?.colors ?? {}) as Palette;
const shade = (name: string, key = 'DEFAULT'): string => {
  const value = colors[name];
  return typeof value === 'string' ? value : value[key];
};

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const channels = [0, 2, 4]
    .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const AA_NORMAL_TEXT = 4.5;

describe('text colour contrast', () => {
  const lightSurfaces: Array<[string, string]> = [
    ['white', '#FFFFFF'],
    ['cream', shade('cream')],
    ['canvas', shade('canvas')],
    ['mint-soft', shade('mint', 'soft')],
  ];

  it.each(lightSurfaces)('mint-deep text meets AA on %s', (_name, background) => {
    expect(contrast(shade('mint', 'deep'), background)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });

  it('records why plain mint is not a text colour on light surfaces', () => {
    // Guard against someone "simplifying" mint-deep back to mint.
    expect(contrast(shade('mint'), '#FFFFFF')).toBeLessThan(AA_NORMAL_TEXT);
  });

  // ACG-A11Y audit follow-up: the `state.*` shades are rule-engine result
  // colours used for backgrounds/icons; several fall under 4.5:1 as text on
  // light surfaces (e.g. state.yellow is ~2.1:1 on white). `-deep` variants
  // are the text-safe pairing, same pattern as mint/mint-deep above.
  const stateColors = ['green', 'yellow', 'orange', 'red'];
  for (const color of stateColors) {
    it.each(lightSurfaces)(`state.${color}-deep text meets AA on %s`, (_name, background) => {
      expect(contrast(shade('state', `${color}-deep`), background)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
    });
  }

  it('keeps plain mint readable on the dark ink hero, where it is still used', () => {
    expect(contrast(shade('mint'), shade('ink'))).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });

  it('keeps the standard body text colours accessible', () => {
    expect(contrast(shade('ink'), '#FFFFFF')).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
    expect(contrast(shade('ink', 'soft'), '#FFFFFF')).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
    expect(contrast(shade('sky', 'deep'), '#FFFFFF')).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });
});
