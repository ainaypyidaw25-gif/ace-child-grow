import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { ContentDetail } from '../../screens/ContentDetail';

const LESSON = vi.hoisted(() => ({
  slug: 'lsn_creativity',
  titleMm: 'တီထွင်ဖန်တီးမှု အားပေးခြင်း',
  titleEn: 'Nurturing creativity',
  asset: '/lessons/creativity/lsn_creativity.3e8ca55af0.webp',
} as const));
const EMPTY_RECORDS = vi.hoisted(() => [] as const);
const PRODUCTION_RESULT = vi.hoisted(() => ({
  staff: true,
  item: {
    _id: 'lsn_creativity',
    slug: 'lsn_creativity',
    titleMm: 'တီထွင်ဖန်တီးမှု အားပေးခြင်း',
    titleEn: 'Nurturing creativity',
    summaryMm: 'လွတ်လပ်စွာ ဆွဲ/တည်ဆောက်/ဟန်ဆောင် ကစားခြင်း အားပေးခြင်း။',
    summaryEn: 'Encourage open-ended art, building, and pretend play.',
    type: 'lesson',
    category: 'creativity',
    clinicalStatus: 'clinical_review',
    reviewScope: 'clinical',
    source: 'Production Convex',
    data: { objectives: [], sections: [], quiz: [] },
  },
  media: [{
    _id: 'lsn_creativity-placeholder',
    kind: 'illustration',
    placeholder: true,
    url: undefined,
  }],
} as const));

vi.mock('convex/react', () => ({
  useQuery: (_query: unknown, args: { slug: string }) => args.slug === LESSON.slug
    ? PRODUCTION_RESULT
    : null,
}));

vi.mock('../../app/useOfflineLibrary', () => ({
  useDownloadedLibrary: () => ({ records: EMPTY_RECORDS, loaded: true }),
}));

function renderLesson() {
  return render(
    <MemoryRouter initialEntries={[`/content/${LESSON.slug}`]}>
      <LocaleProvider>
        <Routes>
          <Route path="/content/:slug" element={<ContentDetail />} />
        </Routes>
      </LocaleProvider>
    </MemoryRouter>,
  );
}

describe('ContentDetail production creativity lesson illustration', () => {
  afterEach(() => {
    cleanup();
    localStorage.removeItem('ace-locale');
  });

  it.each([
    ['mm', LESSON.titleMm],
    ['en', LESSON.titleEn],
  ] as const)('renders the exact unique asset and %s title', (locale, title) => {
    localStorage.setItem('ace-locale', locale);
    renderLesson();

    expect(screen.getByRole('heading', { name: title })).toBeVisible();
    expect(screen.getByTestId('lesson-illustration')).toHaveAttribute('src', LESSON.asset);
    expect(screen.getByTestId('lesson-illustration')).toHaveAttribute('alt', title);
  });
});
