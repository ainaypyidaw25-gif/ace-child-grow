import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { ContentDetail } from '../../screens/ContentDetail';

const ACTIVITY = vi.hoisted(() => ({
  slug: 'act_water_pouring',
  titleMm: 'ရေ လောင်း/ကူးကစားခြင်း',
  titleEn: 'Water pouring play',
  summaryMm:
    'ခွက်တစ်လုံးမှ တစ်လုံးသို့ ရေလောင်းကာ လက်ထိန်းချုပ်မှုနှင့် ပြဿနာဖြေရှင်းနိုင်စွမ်းကို လေ့ကျင့်ပေးခြင်း။',
  summaryEn: 'Build fine-motor and problem-solving by pouring water.',
  domainKey: 'fine_motor',
  asset: '/activities/2y/act_water_pouring.3ba2a48346.webp',
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
      ageGroupKey: '2y',
      clinicalStatus: 'published',
      difficulty: 'medium',
      durationMinutes: 15,
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

describe('ContentDetail 2-year activity illustration', () => {
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
