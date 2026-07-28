import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { Learn } from '../../screens/Learn';

const requests = vi.hoisted(() => [] as Array<{ type?: string; ageGroupKey?: string }>);

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
      birthDate: '2025-08-01',
      useCorrectedAge: false,
    },
  }),
}));

describe('Learn', () => {
  afterEach(() => {
    cleanup();
    requests.length = 0;
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
    expect(screen.getByRole('link', { name: /ကစားရင်း အတူသင်ယူမယ်/ })).toHaveAttribute('href', '/content/guide-toddler-play');
  });
});
