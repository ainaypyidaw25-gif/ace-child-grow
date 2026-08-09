import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { ContentDetail } from '../../screens/ContentDetail';

const ACTIVITY = vi.hoisted(() => ({
  slug: 'act_story_sequence',
  titleMm: 'ဇာတ်လမ်း အစီအစဉ် ပြန်ပြောကစားခြင်း',
  titleEn: 'Story-sequence retelling',
  summaryMm: 'ဖတ်ပြီးသော ပုံပြင်ကို အစီအစဉ်တကျ ပြန်ပြောစေခြင်း။',
  summaryEn: 'Retell a story in order to build language and memory.',
  asset: '/activities/4y/act_story_sequence.8064356734.webp',
} as const));
const EMPTY_RECORDS = vi.hoisted(() => [] as const);

vi.mock('convex/react', () => {
  const result = {
    staff: false,
    media: [],
    item: {
      _id: ACTIVITY.slug,
      ...ACTIVITY,
      type: 'activity',
      ageGroupKey: '4y',
      domainKey: 'language',
      clinicalStatus: 'published',
      difficulty: 'medium',
      durationMinutes: 15,
      reviewScope: 'education',
      source: 'Production Convex',
      data: {},
    },
  };
  return { useQuery: () => result };
});

vi.mock('../../app/useOfflineLibrary', () => ({
  useDownloadedLibrary: () => ({ records: EMPTY_RECORDS, loaded: true }),
}));

function renderActivity() {
  return render(
    <MemoryRouter initialEntries={[`/content/${ACTIVITY.slug}`]}>
      <LocaleProvider>
        <Routes>
          <Route path="/content/:slug" element={<ContentDetail />} />
        </Routes>
      </LocaleProvider>
    </MemoryRouter>,
  );
}

describe('ContentDetail 4-year activity illustration', () => {
  afterEach(() => {
    cleanup();
    localStorage.removeItem('ace-locale');
  });

  it('renders the exact Production text and exact unique asset in both languages', () => {
    localStorage.setItem('ace-locale', 'mm');
    const myanmarView = renderActivity();

    expect(screen.getByRole('heading', { name: ACTIVITY.titleMm })).toBeVisible();
    expect(screen.getByText(ACTIVITY.summaryMm)).toBeVisible();
    expect(screen.getByTestId('activity-illustration')).toHaveAttribute(
      'src',
      ACTIVITY.asset,
    );
    expect(screen.getByTestId('activity-illustration')).toHaveAttribute(
      'alt',
      ACTIVITY.titleMm,
    );

    myanmarView.unmount();
    localStorage.setItem('ace-locale', 'en');
    renderActivity();

    expect(screen.getByRole('heading', { name: ACTIVITY.titleEn })).toBeVisible();
    expect(screen.getByText(ACTIVITY.summaryEn)).toBeVisible();
    expect(screen.getByTestId('activity-illustration')).toHaveAttribute(
      'src',
      ACTIVITY.asset,
    );
    expect(screen.getByTestId('activity-illustration')).toHaveAttribute(
      'alt',
      ACTIVITY.titleEn,
    );
  });
});
