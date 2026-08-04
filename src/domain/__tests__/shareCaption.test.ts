import { describe, it, expect } from 'vitest';
import { buildMilestoneShareCaption, formatShareCardDate } from '../share/shareCaption';

describe('buildMilestoneShareCaption', () => {
  it('includes the child nickname and milestone title in Myanmar', () => {
    const caption = buildMilestoneShareCaption('Su Su', 'လမ်းလျှောက်ခြင်း', 'mm');
    expect(caption).toContain('Su Su');
    expect(caption).toContain('လမ်းလျှောက်ခြင်း');
    expect(caption).toContain('ACE Child Grow');
  });

  it('includes the child nickname and milestone title in English', () => {
    const caption = buildMilestoneShareCaption('Su Su', 'walk independently', 'en');
    expect(caption).toContain('Su Su');
    expect(caption).toContain('walk independently');
    expect(caption).toContain('ACE Child Grow');
  });

  it('never mentions diagnosis or clinical framing', () => {
    const caption = buildMilestoneShareCaption('Su Su', 'walk independently', 'en');
    expect(caption.toLowerCase()).not.toMatch(/diagnos|disorder|delay/);
  });
});

describe('formatShareCardDate', () => {
  it('formats an English date with the full month name and year', () => {
    const timestamp = new Date(2026, 0, 15).getTime();
    const formatted = formatShareCardDate(timestamp, 'en');
    expect(formatted).toContain('2026');
    expect(formatted).toContain('January');
  });

  it('formats consistently for the Myanmar locale', () => {
    const timestamp = new Date(2026, 0, 15).getTime();
    expect(() => formatShareCardDate(timestamp, 'mm')).not.toThrow();
    expect(formatShareCardDate(timestamp, 'mm').length).toBeGreaterThan(0);
  });
});
