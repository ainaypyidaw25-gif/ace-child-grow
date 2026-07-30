import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { MilestoneDemo } from '../../screens/MilestoneDemo';

const state = vi.hoisted(() => ({
  apple: false,
  birthDate: '2025-09-26',
}));

const milestoneItems = [
  {
    _id: 'item-1',
    slug: 'ms_10_12m_test',
    domainKey: 'gross_motor',
    titleMm: 'မတ်တပ်ရပ်ခြင်း',
    titleEn: 'Pulls to stand',
    summaryMm: undefined,
    summaryEn: undefined,
    data: { observeMm: 'ပရိဘောဂကို ကိုင်၍ မတ်တပ်ရပ်နိုင်ပါသလား။', observeEn: 'Pulls to stand?' },
  },
  {
    _id: 'item-2',
    slug: 'ms_10_12m_test_2',
    domainKey: 'communication',
    titleMm: 'လက်ညှိုးထိုးပြခြင်း',
    titleEn: 'Points to show',
    summaryMm: undefined,
    summaryEn: undefined,
    data: { observeMm: 'စိတ်ဝင်စားသည့်အရာကို လက်ညှိုးထိုးပြပါသလား။', observeEn: 'Points to show interest?' },
  },
];

vi.mock('convex/react', () => ({
  useQuery: (_api: unknown, args?: unknown) => (
    args === 'skip' ? undefined : { staff: false, items: milestoneItems }
  ),
  useMutation: () => vi.fn(),
}));

vi.mock('../../app/platform', () => ({
  isAppleAppStoreBuild: () => state.apple,
}));

vi.mock('../../app/AppState', () => ({
  useAppState: () => ({
    activeChild: {
      id: 'child-1',
      nickname: 'သမီးလေး',
      birthDate: state.birthDate,
      useCorrectedAge: false,
    },
  }),
}));

function renderWithProviders() {
  return render(
    <MemoryRouter>
      <LocaleProvider>
        <MilestoneDemo />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

describe('MilestoneDemo (component)', () => {
  afterEach(() => {
    cleanup();
    state.apple = false;
    state.birthDate = '2025-09-26';
    vi.useRealTimers();
  });

  it('renders the published age-based checklist from the server', () => {
    renderWithProviders();
    expect(screen.getByText('ပရိဘောဂကို ကိုင်၍ မတ်တပ်ရပ်နိုင်ပါသလား။')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('renders the four Myanmar answer options by default', () => {
    renderWithProviders();
    expect(screen.getByText('လုပ်နိုင်ပြီ')).toBeInTheDocument();
    expect(screen.getByText('မလုပ်နိုင်သေး')).toBeInTheDocument();
  });

  it('lets a parent pick an answer and advance', () => {
    renderWithProviders();
    fireEvent.click(screen.getByText('လုပ်နိုင်ပြီ'));
    fireEvent.click(screen.getByText('ရှေ့သို့'));
    expect(screen.getByText('စိတ်ဝင်စားသည့်အရာကို လက်ညှိုးထိုးပြပါသလား။')).toBeInTheDocument();
  });

  it('does not expose unfinished post-infancy milestone bands in the App Store build', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-30T12:00:00Z'));
    state.apple = true;
    state.birthDate = '2024-07-01';

    renderWithProviders();

    expect(screen.getByRole('heading', { name: /မွေးကင်းမှ ၁၂ လအထိ/ })).toBeVisible();
    expect(screen.queryByText('1 / 2')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ဗဟုသုတစာမျက်နှာ ဖွင့်ရန်' })).toHaveAttribute('href', '/learn');
  });
});
