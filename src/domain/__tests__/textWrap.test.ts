import { describe, it, expect } from 'vitest';
import { wrapText } from '../share/textWrap';

// A fake measurer keeps the tests independent of any font/canvas: one
// character = one unit of width, so maxWidth doubles as "max characters".
const measure = (text: string) => text.length;

describe('wrapText', () => {
  it('wraps space-separated text at word boundaries', () => {
    const lines = wrapText('the quick brown fox jumps', 11, measure);
    expect(lines).toEqual(['the quick', 'brown fox', 'jumps']);
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(11);
  });

  it('keeps text on one line when it already fits', () => {
    expect(wrapText('short title', 40, measure)).toEqual(['short title']);
  });

  it('falls back to character-level splitting for a single unbreakable token wider than maxWidth', () => {
    // Myanmar milestone titles are typically one unbroken run with no spaces —
    // the naive "split on spaces" approach would leave this as one overflowing line.
    const noSpaceToken = 'မိသားစုကနားလည်မှုအတွက်စကားပြောခြင်း';
    const lines = wrapText(noSpaceToken, 10, measure);
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(10);
    // No characters are dropped in the process.
    expect(lines.join('')).toBe(noSpaceToken);
  });

  it('wraps a mix of short spaced words and one long unspaced token', () => {
    const headline = 'Pyae — မိသားစုကနားလည်မှုအတွက်စကားပြောခြင်း';
    const lines = wrapText(headline, 12, measure);
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(12);
    expect(lines[0]).toContain('Pyae');
    // Reassembling (accounting for the single spaces this function inserts
    // between space-separated words) recovers all of the original content.
    expect(lines.join('').replace(/ /g, '')).toBe(headline.replace(/ /g, ''));
  });

  it('returns no lines for an empty string', () => {
    expect(wrapText('', 20, measure)).toEqual([]);
  });
});
