import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { Learn } from '../../screens/Learn';

const requests = vi.hoisted(() => [] as Array<{ type?: string; ageGroupKey?: string }>);
const child = vi.hoisted(() => ({
  birthDate: '2025-08-01',
  useCorrectedAge: false,
  gestationalWeeks: undefined as number | undefined,
}));
const platform = vi.hoisted(() => ({
  apple: false,
  native: false,
}));

vi.mock('../../app/platform', () => ({
  isAppleAppStoreBuild: () => platform.apple,
  isNativeStoreBuild: () => platform.native,
}));

vi.mock('convex/react', () => ({
  useQuery: (_api: unknown, args?: { type?: string; ageGroupKey?: string }) => {
    requests.push(args ?? {});
    if (args?.type === 'guide') {
      return {
        staff: false,
        items: [{
          _id: 'guide-1',
          slug: 'guide-toddler-play',
          type: 'guide',
          titleMm: 'ကစားရင်း အတူသင်ယူမယ်',
          titleEn: 'Learn through play',
          summaryMm: 'ကလေးနှင့် နေ့စဉ် အလွယ်တကူ ကစားနိုင်သော နည်းလမ်းများ။',
          summaryEn: 'Simple ways to play together every day.',
          category: 'learning_through_play',
          ageGroupKey: args.ageGroupKey,
          durationMinutes: 5,
        }],
      };
    }
    return { staff: false, items: [] };
  },
}));

vi.mock('../../app/AppState', () => ({
  useAppState: () => ({
    activeChild: {
      id: 'child-1',
      nickname: 'မေမေ့သားလေး',
      birthDate: child.birthDate,
      useCorrectedAge: child.useCorrectedAge,
      gestationalWeeks: child.gestationalWeeks,
    },
  }),
}));

describe('Learn', () => {
  afterEach(() => {
    cleanup();
    requests.length = 0;
    child.birthDate = '2025-08-01';
    child.useCorrectedAge = false;
    child.gestationalWeeks = undefined;
    platform.apple = false;
    platform.native = false;
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: true });
    vi.useRealTimers();
  });

  it('renders published server content selected for the active child age band', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-28T12:00:00Z'));

    render(
      <MemoryRouter>
        <LocaleProvider>
          <Learn />
        </LocaleProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'မေမေ့သားလေး အတွက် သင်ယူရန်' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'ကစားရင်း အတူသင်ယူမယ်' })).toBeVisible();
    expect(requests).toContainEqual({ type: 'guide', ageGroupKey: '10_12m' });
    expect(requests).toContainEqual({ type: 'story', ageGroupKey: '10_12m' });
    expect(screen.getByRole('link', { name: /ကစားရင်း အတူသင်ယူမယ်/ })).toHaveAttribute('href', '/content/guide-toddler-play');
  });

  it('selects guides and stories using corrected age when the parent opted in', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-01T12:00:00Z'));
    child.birthDate = '2026-01-01';
    child.useCorrectedAge = true;
    child.gestationalWeeks = 28;

    render(
      <MemoryRouter>
        <LocaleProvider>
          <Learn />
        </LocaleProvider>
      </MemoryRouter>,
    );

    expect(requests).toContainEqual({ type: 'guide', ageGroupKey: '3_4m' });
    expect(requests).toContainEqual({ type: 'story', ageGroupKey: '3_4m' });
  });

  it('uses an honest connectivity message in the App Store build', () => {
    platform.apple = true;
    platform.native = true;
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: false });

    render(
      <MemoryRouter>
        <LocaleProvider>
          <Learn />
        </LocaleProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('အင်တာနက်ပြတ်နေပါသည်။ ဗဟုသုတအကြောင်းအရာများကို ဖွင့်ရန် အင်တာနက် ပြန်ချိတ်ပါ။')).toBeVisible();
    expect(screen.queryByText('သိမ်းထားသည်များ')).not.toBeInTheDocument();
  });
});
