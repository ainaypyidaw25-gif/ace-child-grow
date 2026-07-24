// Sleep tracker calculations (Phase 14).
// Pure functions. Handles sleep spanning midnight. Urgent breathing symptoms are
// surfaced but the actual urgent guidance comes from the safety engine.

export interface NapInput {
  /** minutes */
  durationMinutes: number;
}

export interface SleepInput {
  /** "HH:MM" 24h local clock */
  bedtime: string;
  /** "HH:MM" 24h local clock */
  wakeTime: string;
  naps: NapInput[];
  nightWakingCount: number;
  snoring?: boolean;
  breathingPauses?: boolean;
  breathingDifficulty?: boolean;
}

export interface SleepSummary {
  nightSleepMinutes: number;
  napSleepMinutes: number;
  totalSleepMinutes: number;
  crossesMidnight: boolean;
  nightWakingCount: number;
  /** True when a fixed breathing safety rule should be shown immediately. */
  urgentBreathingFlag: boolean;
}

export class SleepInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SleepInputError';
  }
}

function parseHhMm(value: string, label: string): number {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!m) throw new SleepInputError(`${label} must be HH:MM (24h), got "${value}"`);
  return Number(m[1]) * 60 + Number(m[2]);
}

/**
 * Night sleep in minutes. If wake time is earlier than or equal to bedtime,
 * the sleep spans midnight and we add a full day (1440 min).
 */
export function nightSleepMinutes(bedtime: string, wakeTime: string): number {
  const b = parseHhMm(bedtime, 'bedtime');
  const w = parseHhMm(wakeTime, 'wakeTime');
  let diff = w - b;
  if (diff <= 0) diff += 24 * 60;
  return diff;
}

export function summarizeSleep(input: SleepInput): SleepSummary {
  if (!Number.isInteger(input.nightWakingCount) || input.nightWakingCount < 0) {
    throw new SleepInputError('nightWakingCount must be a non-negative integer');
  }
  const b = parseHhMm(input.bedtime, 'bedtime');
  const w = parseHhMm(input.wakeTime, 'wakeTime');
  const night = nightSleepMinutes(input.bedtime, input.wakeTime);

  const napSleep = (input.naps ?? []).reduce((sum, n) => {
    if (!Number.isFinite(n.durationMinutes) || n.durationMinutes < 0) {
      throw new SleepInputError('nap durationMinutes must be a non-negative number');
    }
    return sum + n.durationMinutes;
  }, 0);

  return {
    nightSleepMinutes: night,
    napSleepMinutes: napSleep,
    totalSleepMinutes: night + napSleep,
    crossesMidnight: w - b <= 0,
    nightWakingCount: input.nightWakingCount,
    urgentBreathingFlag: Boolean(input.breathingPauses || input.breathingDifficulty),
  };
}

export function minutesToHoursLabel(minutes: number): { hours: number; minutes: number } {
  return { hours: Math.floor(minutes / 60), minutes: minutes % 60 };
}
