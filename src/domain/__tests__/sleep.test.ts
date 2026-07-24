import { describe, it, expect } from 'vitest';
import { nightSleepMinutes, summarizeSleep, SleepInputError } from '../sleep/sleep';

describe('sleep calculations', () => {
  it('computes night sleep across midnight', () => {
    // 20:00 -> 06:00 = 10h = 600 min
    expect(nightSleepMinutes('20:00', '06:00')).toBe(600);
  });
  it('computes night sleep within the same day boundary', () => {
    // 22:30 -> 07:15 = 8h45 = 525 min
    expect(nightSleepMinutes('22:30', '07:15')).toBe(525);
  });
  it('treats equal times as a full 24h (edge case)', () => {
    expect(nightSleepMinutes('21:00', '21:00')).toBe(24 * 60);
  });
  it('sums naps into total sleep', () => {
    const s = summarizeSleep({
      bedtime: '20:00',
      wakeTime: '06:00',
      naps: [{ durationMinutes: 45 }, { durationMinutes: 60 }],
      nightWakingCount: 1,
    });
    expect(s.nightSleepMinutes).toBe(600);
    expect(s.napSleepMinutes).toBe(105);
    expect(s.totalSleepMinutes).toBe(705);
    expect(s.crossesMidnight).toBe(true);
  });
  it('raises an urgent breathing flag on breathing pauses', () => {
    const s = summarizeSleep({
      bedtime: '20:00',
      wakeTime: '06:00',
      naps: [],
      nightWakingCount: 0,
      breathingPauses: true,
    });
    expect(s.urgentBreathingFlag).toBe(true);
  });
  it('rejects malformed times', () => {
    expect(() =>
      summarizeSleep({ bedtime: '25:00', wakeTime: '06:00', naps: [], nightWakingCount: 0 }),
    ).toThrowError(SleepInputError);
  });
  it('rejects negative waking counts', () => {
    expect(() =>
      summarizeSleep({ bedtime: '20:00', wakeTime: '06:00', naps: [], nightWakingCount: -1 }),
    ).toThrowError(SleepInputError);
  });
});
