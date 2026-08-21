import { beforeEach, describe, expect, it, vi } from 'vitest';
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

const retired = {
  _id: 'retired-item',
  slug: 'ms_13_18m_safety_1',
  domainKey: 'safety',
  clinicalStatus: 'published',
  titleMm: 'အမှတ်ပေးရာတွင် မပါရမည့် သင်ကြားရေးအချက်',
  titleEn: 'Retired caregiver teaching prompt',
  summaryMm: undefined,
  summaryEn: undefined,
  data: {
    observeMm: 'ဤမေးခွန်းကို အမှတ်ပေးရာတွင် မပြရပါ။',
    observeEn: 'This retired prompt must not be scored.',
  },
};

let queryItems = [unpublished, published];
let queryStaff = true;

vi.mock('convex/react', () => ({
  useQuery: () => ({ staff: queryStaff, items: queryItems }),
  useMutation: () => vi.fn(),
}));

beforeEach(() => {
  queryItems = [unpublished, published];
  queryStaff = true;
});

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

    expect(screen.getByText('ဤအသက်အရွယ်နှင့် ကိုက်ညီသော ဖွံ့ဖြိုးမှုမှတ်တိုင် မတွေ့ပါ')).toBeInTheDocument();
    expect(screen.queryByText(/မွေးကင်းမှ ၁၂ လအထိ/)).not.toBeInTheDocument();
  });

  it('keeps centrally retired published rows out of parent checklist scoring', () => {
    queryItems = [retired, published];
    queryStaff = false;
    render(
      <MemoryRouter>
        <LocaleProvider>
          <MilestoneDemo />
        </LocaleProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('1 / 1')).toBeInTheDocument();
    expect(screen.queryByText(retired.titleMm)).not.toBeInTheDocument();
    expect(screen.queryByText(retired.data.observeMm)).not.toBeInTheDocument();
    expect(screen.getByText(published.data.observeMm)).toBeInTheDocument();
  });
});
