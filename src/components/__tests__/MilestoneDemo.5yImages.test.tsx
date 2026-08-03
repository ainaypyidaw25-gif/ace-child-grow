import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { MilestoneDemo } from '../../screens/MilestoneDemo';

const milestoneItems = [
  {
    slug: 'ms_5y_gross_motor_1', domainKey: 'gross_motor',
    titleMm: 'ခုန်ကျော်၊ ဟန်ချက်ညီ လှုပ်ရှားခြင်း', titleEn: 'Skips and balances well',
    observeMm: 'ခုန်ကျော်နိုင်၍ ဟန်ချက်ညီစွာ လှုပ်ရှားပါသလား။', observeEn: 'Skips and moves with good balance?',
  },
  {
    slug: 'ms_5y_language_1', domainKey: 'language',
    titleMm: 'ရှင်းလင်းသော ဝါကျ အပြည့်အစုံ ပြောခြင်း', titleEn: 'Speaks in clear full sentences',
    observeMm: 'အစိမ်းလူများ နားလည်နိုင်စွာ ဝါကျ အပြည့်အစုံ ပြောပါသလား။', observeEn: 'Uses clear sentences strangers understand?',
  },
  {
    slug: 'ms_5y_school_readiness_1', domainKey: 'school_readiness',
    titleMm: 'အက္ခရာ/ဂဏန်း အများစုကို သိရှိခြင်း', titleEn: 'Knows most letters / numbers',
    observeMm: 'အက္ခရာ/ဂဏန်း အများစုကို မှတ်မိပါသလား။', observeEn: 'Recognizes most letters and numbers?',
  },
  {
    slug: 'ms_5y_self_help_1', domainKey: 'self_help',
    titleMm: 'အိမ်သာ/လက်ဆေးခြင်း ကိုယ်တိုင်လုပ်ခြင်း', titleEn: 'Manages toilet and handwashing',
    observeMm: 'အိမ်သာသုံးပြီး လက်ကို ကိုယ်တိုင် ဆေးနိုင်ပါသလား။', observeEn: 'Uses the toilet and washes hands alone?',
  },
] as const;

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
      id: 'child-5y', nickname: 'ကလေး', birthDate: '2021-08-03', useCorrectedAge: false,
    },
  }),
}));

describe('MilestoneDemo 5 year illustration navigation', () => {
  it('shows exact Myanmar wording and unique exact-slug images through all four items, then returns with previous', () => {
    localStorage.setItem('ace-locale', 'mm');
    render(
      <MemoryRouter><LocaleProvider><MilestoneDemo /></LocaleProvider></MemoryRouter>,
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

    expect(new Set(seenSources).size).toBe(milestoneItems.length);
    fireEvent.click(screen.getByText('နောက်သို့'));
    expect(screen.getByTestId('milestone-illustration')).toHaveAttribute('src', seenSources[2]);
  });

  it('renders the exact published English title and observation with the same mapped image', () => {
    localStorage.setItem('ace-locale', 'en');
    render(
      <MemoryRouter><LocaleProvider><MilestoneDemo /></LocaleProvider></MemoryRouter>,
    );

    expect(screen.getByText(milestoneItems[0].titleEn)).toBeInTheDocument();
    expect(screen.getByText(milestoneItems[0].observeEn)).toBeInTheDocument();
    expect(screen.getByTestId('milestone-illustration')).toHaveAttribute(
      'src', expect.stringContaining(`/${milestoneItems[0].slug}.`),
    );
  });
});
