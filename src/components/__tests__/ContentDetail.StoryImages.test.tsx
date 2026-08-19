import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { ContentDetail } from '../../screens/ContentDetail';

const STORIES = vi.hoisted(() => [
  ['st_first_day_school', 'ကျောင်း ပထမနေ့', 'My First Day at School', '/stories/st_first_day_school.a440d58f45.webp'],
  ['st_little_seed', 'မျိုးစေ့ လေးရဲ့ ခရီး', 'The Little Seed’s Journey', '/stories/st_little_seed.46d4e79b59.webp'],
  ['st_when_i_feel_angry', 'စိတ်ဆိုးတဲ့အခါ', 'When I Feel Angry', '/stories/st_when_i_feel_angry.939e6bd987.webp'],
] as const);
const EMPTY_RECORDS = vi.hoisted(() => [] as const);

vi.mock('convex/react', () => {
  const results = new Map(STORIES.map((story) => {
    const [slug, titleMm, titleEn] = story;
    return [slug, {
      staff: false,
      item: {
        _id: slug,
        slug,
        titleMm,
        titleEn,
        summaryMm: `MM ${slug}`,
        summaryEn: `EN ${slug}`,
        type: 'story',
        category: 'story',
        clinicalStatus: slug === 'st_first_day_school' ? 'clinical_review' : 'published',
        publicationLane: slug === 'st_first_day_school' ? 'ai_audited' : 'human_reviewed',
        reviewScope: 'education',
        source: 'Production Convex',
        data: {
          body: { mm: `ပုံပြင် ${slug}`, en: `Story ${slug}` },
          questions: [],
          activities: [],
          vocabulary: [],
        },
      },
      media: [{
        _id: `${slug}-remote`,
        kind: 'illustration',
        placeholder: false,
        url: '/legacy-shared-story.webp',
      }],
    }];
  }));

  return {
    useQuery: (_query: unknown, args: { slug: string }) => results.get(
      args.slug as (typeof STORIES)[number][0],
    ) ?? null,
  };
});

vi.mock('../../app/useOfflineLibrary', () => ({
  useDownloadedLibrary: () => ({ records: EMPTY_RECORDS, loaded: true }),
}));

function renderStory(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/content/${slug}`]}>
      <LocaleProvider>
        <Routes>
          <Route path="/content/:slug" element={<ContentDetail />} />
        </Routes>
      </LocaleProvider>
    </MemoryRouter>,
  );
}

describe('ContentDetail published story illustrations', () => {
  afterEach(() => {
    cleanup();
    localStorage.removeItem('ace-locale');
  });

  it.each(STORIES)(
    'renders %s with its exact unique image and bilingual title',
    (slug, titleMm, titleEn, asset) => {
      localStorage.setItem('ace-locale', 'mm');
      const myanmarView = renderStory(slug);

      expect(screen.getByRole('heading', { name: titleMm })).toBeVisible();
      expect(screen.getByTestId('story-illustration')).toHaveAttribute('src', asset);
      expect(screen.getByTestId('story-illustration')).toHaveAttribute('alt', titleMm);
      expect(document.querySelector('img[src="/legacy-shared-story.webp"]')).toBeNull();

      myanmarView.unmount();
      localStorage.setItem('ace-locale', 'en');
      renderStory(slug);

      expect(screen.getByRole('heading', { name: titleEn })).toBeVisible();
      expect(screen.getByTestId('story-illustration')).toHaveAttribute('src', asset);
      expect(screen.getByTestId('story-illustration')).toHaveAttribute('alt', titleEn);
    },
  );

  it('shows the prominent non-human-review disclosure on the AI-audited story', () => {
    localStorage.setItem('ace-locale', 'en');
    renderStory('st_first_day_school');
    expect(screen.getByTestId('ai-publication-disclosure')).toHaveTextContent(
      'AI-reviewed — not approved by a human specialist',
    );
    expect(screen.getByTestId('ai-publication-disclosure')).toHaveTextContent(
      'not medical advice, developmental screening, or diagnosis',
    );
  });
});
