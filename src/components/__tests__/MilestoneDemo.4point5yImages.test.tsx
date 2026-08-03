import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { MilestoneDemo } from '../../screens/MilestoneDemo';

const milestoneItems = [
  {
    slug: 'ms_4_5y_cognitive_1',
    domainKey: 'cognitive',
    titleMm: 'အရာဝတ္ထုများကို အမျိုးအစားခွဲခြင်း',
    titleEn: 'Sorts by category',
    observeMm: 'ပစ္စည်းများကို အရောင်/ပုံသဏ္ဌာန်ဖြင့် ခွဲခြားပါသလား။',
    observeEn: 'Sorts objects by color or shape?',
  },
  {
    slug: 'ms_4_5y_daily_routine_1',
    domainKey: 'daily_routine',
    titleMm: 'ကိုယ်တိုင် ဝတ်စားဆင်ယင်ခြင်း',
    titleEn: 'Dresses with little help',
    observeMm: 'အင်္ကျီ/ဘောင်းဘီကို အများအားဖြင့် ကိုယ်တိုင် ဝတ်နိုင်ပါသလား။',
    observeEn: 'Dresses with minimal help?',
  },
  {
    slug: 'ms_4_5y_fine_motor_1',
    domainKey: 'fine_motor',
    titleMm: 'ကတ်ကြေးဖြင့် ဖြတ်ခြင်း',
    titleEn: 'Cuts with child scissors',
    observeMm: 'ကလေးကတ်ကြေးဖြင့် စက္ကူကို မျဉ်းအတိုင်း ဖြတ်ပါသလား။',
    observeEn: 'Cuts along a line with safe scissors?',
  },
] as const;

const slugs = milestoneItems.map((item) => item.slug);

const queryItems = milestoneItems.map((item) => ({
  _id: item.slug,
  slug: item.slug,
  domainKey: item.domainKey,
  titleMm: item.titleMm,
  titleEn: item.titleEn,
  summaryMm: undefined,
  summaryEn: undefined,
  data: { observeMm: item.observeMm, observeEn: item.observeEn },
}));

vi.mock('convex/react', () => ({
  useQuery: () => ({ staff: false, items: queryItems }),
  useMutation: () => vi.fn(),
}));

vi.mock('../../app/AppState', () => ({
  useAppState: () => ({
    activeChild: {
      id: 'child-4-5y',
      nickname: 'ကလေး',
      birthDate: '2022-02-03',
      useCorrectedAge: false,
    },
  }),
}));

describe('MilestoneDemo 4.5 year illustration navigation', () => {
  it('changes through unique exact-slug images for all three published items and returns with previous', () => {
    localStorage.setItem('ace-locale', 'mm');
    render(
      <MemoryRouter>
        <LocaleProvider>
          <MilestoneDemo />
        </LocaleProvider>
      </MemoryRouter>,
    );

    const seenSources: string[] = [];
    milestoneItems.forEach((item, index) => {
      const image = screen.getByTestId('milestone-illustration');
      const src = image.getAttribute('src') ?? '';
      expect(src).toContain(`/${item.slug}.`);
      expect(src).toMatch(/\.[a-f0-9]{10}\.webp$/);
      expect(screen.getByText(item.titleMm)).toBeInTheDocument();
      expect(screen.getByText(item.observeMm)).toBeInTheDocument();
      seenSources.push(src);

      if (index < milestoneItems.length - 1) {
        fireEvent.click(screen.getByText('လုပ်နိုင်ပြီ'));
        fireEvent.click(screen.getByText('ရှေ့သို့'));
      }
    });

    expect(new Set(seenSources).size).toBe(slugs.length);
    fireEvent.click(screen.getByText('နောက်သို့'));
    expect(screen.getByTestId('milestone-illustration')).toHaveAttribute('src', seenSources[1]);
  });

  it('renders the exact published English title and observation with the same mapped image', () => {
    localStorage.setItem('ace-locale', 'en');
    render(
      <MemoryRouter>
        <LocaleProvider>
          <MilestoneDemo />
        </LocaleProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText(milestoneItems[0].titleEn)).toBeInTheDocument();
    expect(screen.getByText(milestoneItems[0].observeEn)).toBeInTheDocument();
    expect(screen.getByTestId('milestone-illustration')).toHaveAttribute(
      'src',
      expect.stringContaining(`/${milestoneItems[0].slug}.`),
    );
  });
});
