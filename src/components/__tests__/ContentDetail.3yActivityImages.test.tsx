import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { ContentDetail } from '../../screens/ContentDetail';

const ACTIVITY = vi.hoisted(() => ({
  slug: 'act_color_sort',
  titleMm: 'အရောင်ခွဲ ကစားခြင်း',
  titleEn: 'Color sorting',
  summaryMm: 'ပစ္စည်းများကို အရောင်ဖြင့် ခွဲ၍ အသိဉာဏ် လေ့ကျင့်ခြင်း။',
  summaryEn: 'Sort objects by color to build early thinking.',
  domainKey: 'cognitive',
  asset: '/activities/3y/act_color_sort.baca30dca4.webp',
}));
const EMPTY_RECORDS = vi.hoisted(() => [] as const);

vi.mock('convex/react', () => {
  const result = {
    staff: false,
    media: [],
    item: {
      _id: ACTIVITY.slug,
      ...ACTIVITY,
      type: 'activity',
      ageGroupKey: '3y',
      clinicalStatus: 'published',
      difficulty: 'medium',
      durationMinutes: 10,
      reviewScope: 'education',
      source: 'Production Convex',
      data: {},
    },
  };

  return {
    useQuery: (_api: unknown, args?: { slug?: string }) =>
      args?.slug === ACTIVITY.slug ? result : null,
  };
});

vi.mock('../../app/useOfflineLibrary', () => ({
  useDownloadedLibrary: () => ({ records: EMPTY_RECORDS, loaded: true }),
}));

describe('ContentDetail 3-year activity illustration', () => {
  afterEach(() => cleanup());

  it('renders the exact production text and exact unique asset', () => {
    render(
      <MemoryRouter initialEntries={[`/content/${ACTIVITY.slug}`]}>
        <LocaleProvider>
          <Routes>
            <Route path="/content/:slug" element={<ContentDetail />} />
          </Routes>
        </LocaleProvider>
      </MemoryRouter>,
    );

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
  });
});
