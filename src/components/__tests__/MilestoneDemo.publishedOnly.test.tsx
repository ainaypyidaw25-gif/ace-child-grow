import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { MilestoneDemo } from '../../screens/MilestoneDemo';

const published = {
  _id: 'published-item',
  slug: 'ms_13_18m_language_1',
  domainKey: 'language',
  clinicalStatus: 'published',
  titleMm: 'စကားလုံးများ နားလည်ခြင်း',
  titleEn: 'Understands words',
  summaryMm: undefined,
  summaryEn: undefined,
  data: { observeMm: 'ရိုးရှင်းသော စကားလုံးများကို နားလည်ပါသလား။', observeEn: 'Understands simple words?' },
};

const unpublished = {
  _id: 'review-item',
  slug: 'ms_13_18m_gross_motor_1',
  domainKey: 'gross_motor',
  clinicalStatus: 'clinical_review',
  titleMm: 'ပြန်လည်သုံးသပ်ဆဲ မှတ်တိုင်',
  titleEn: 'Milestone under review',
  summaryMm: undefined,
  summaryEn: undefined,
  data: { observeMm: 'ဤမေးခွန်းကို မပြရပါ။', observeEn: 'This question must not be shown.' },
};

let queryItems = [unpublished, published];

vi.mock('convex/react', () => ({
  useQuery: () => ({ staff: true, items: queryItems }),
  useMutation: () => vi.fn(),
}));

vi.mock('../../app/AppState', () => ({
  useAppState: () => ({
    activeChild: {
      id: 'child-13m',
      nickname: 'ကလေး',
      birthDate: '2025-07-03',
      useCorrectedAge: false,
    },
  }),
}));

describe('MilestoneDemo published-only staff preview', () => {
  it('hides non-published milestones and keeps the approved illustration visible', () => {
    render(
      <MemoryRouter>
        <LocaleProvider>
          <MilestoneDemo />
        </LocaleProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('1 / 1')).toBeInTheDocument();
    expect(screen.queryByText(unpublished.titleMm)).not.toBeInTheDocument();
    expect(screen.queryByText(unpublished.data.observeMm)).not.toBeInTheDocument();
    expect(screen.getByTestId('milestone-illustration')).toHaveAttribute(
      'src',
      expect.stringContaining(`/${published.slug}.`),
    );
  });

  it('uses an age-neutral message when no approved milestone is published', () => {
    queryItems = [unpublished];
    render(
      <MemoryRouter>
        <LocaleProvider>
          <MilestoneDemo />
        </LocaleProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('ဤအသက်အုပ်စုအတွက် အတည်ပြုထုတ်ဝေထားသော ဖွံ့ဖြိုးမှုမှတ်တိုင် မရှိသေးပါ။')).toBeInTheDocument();
    expect(screen.queryByText(/မွေးကင်းမှ ၁၂ လအထိ/)).not.toBeInTheDocument();
    queryItems = [unpublished, published];
  });
});
