import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { Activities } from '../../screens/Activities';
import { MilestoneDemo } from '../../screens/MilestoneDemo';

const state = vi.hoisted(() => ({
  birthDate: '2025-07-01',
  requestedAgeGroups: [] as Array<{ type: string; ageGroupKey?: string }>,
  auxiliaryQuery: 0,
  useCorrectedAge: false,
  gestationalWeeks: undefined as number | undefined,
}));

vi.mock('convex/react', () => ({
  useQuery: (_api: unknown, args?: { type?: string; ageGroupKey?: string }) => {
    if (args?.type) {
      state.requestedAgeGroups.push({ type: args.type, ageGroupKey: args.ageGroupKey });
      return { staff: false, items: [] };
    }
    state.auxiliaryQuery += 1;
    return state.auxiliaryQuery === 1 ? { features: [] } : [];
  },
  useMutation: () => vi.fn(),
}));

vi.mock('../../app/AppState', () => ({
  useAppState: () => ({
    activeChild: {
      id: 'child-1',
      nickname: 'ကလေး',
      birthDate: state.birthDate,
      useCorrectedAge: state.useCorrectedAge,
      gestationalWeeks: state.gestationalWeeks,
    },
  }),
}));

const CASES = [
  [12, '10_12m'], [13, '13_18m'], [18, '13_18m'], [24, '2y'],
  [25, '2y'], [30, '2_5y'], [31, '2_5y'], [36, '3y'], [37, '3y'],
  [42, '3_5y'], [43, '3_5y'], [48, '4y'], [49, '4y'], [54, '4_5y'],
  [55, '4_5y'], [60, '5y'], [61, '5y'],
] as const;

function birthDateForAge(months: number): string {
  const year = 2026 - Math.floor(months / 12);
  const month = 6 - (months % 12);
  const date = new Date(Date.UTC(year, month, 1));
  return date.toISOString().slice(0, 10);
}

function renderScreen(screen: 'activity' | 'milestone') {
  return render(
    <MemoryRouter>
      <LocaleProvider>
        {screen === 'activity' ? <Activities /> : <MilestoneDemo />}
      </LocaleProvider>
    </MemoryRouter>,
  );
}

describe('age-band screen consumption', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-01T12:00:00Z'));
    state.requestedAgeGroups = [];
    state.auxiliaryQuery = 0;
    state.useCorrectedAge = false;
    state.gestationalWeeks = undefined;
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it.each(CASES)('Activities requests only the intended band at %i months', (months, expected) => {
    state.birthDate = birthDateForAge(months);
    renderScreen('activity');
    expect(state.requestedAgeGroups).toEqual([{ type: 'activity', ageGroupKey: expected }]);
  });

  it.each(CASES)('MilestoneDemo requests only the intended band at %i months', (months, expected) => {
    state.birthDate = birthDateForAge(months);
    renderScreen('milestone');
    expect(state.requestedAgeGroups).toEqual([{ type: 'milestone', ageGroupKey: expected }]);
  });

  it.each(['activity', 'milestone'] as const)('%s honors corrected age for premature children', (screen) => {
    state.birthDate = '2026-01-01';
    state.useCorrectedAge = true;
    state.gestationalWeeks = 28;
    renderScreen(screen);
    expect(state.requestedAgeGroups).toEqual([{
      type: screen === 'activity' ? 'activity' : 'milestone',
      ageGroupKey: '3_4m',
    }]);
  });
});
