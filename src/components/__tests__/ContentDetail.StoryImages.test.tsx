import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { ContentDetail } from '../../screens/ContentDetail';

const STORIES = vi.hoisted(() => [
  ['st_ba_ba_sounds', '“ဘ ဘ” အသံလေးများ', 'The “Ba-Ba” Sounds', '/stories/st_ba_ba_sounds.5248d497b0.webp'],
  ['st_first_day_school', 'ကျောင်း ပထမနေ့', 'My First Day at School', '/stories/st_first_day_school.a440d58f45.webp'],
  ['st_goodnight_moon_friend', 'ကောင်းသောညပါ၊ လမင်းလေးရေ', 'Goodnight, Little Moon', '/stories/st_goodnight_moon_friend.3277dec574.webp'],
  ['st_little_seed', 'မျိုးစေ့ လေးရဲ့ ခရီး', 'The Little Seed’s Journey', '/stories/st_little_seed.46d4e79b59.webp'],
  ['st_sharing_mango', 'သရက်သီး ဝေမျှခြင်း', 'Sharing the Mango', '/stories/st_sharing_mango.2dd66b6393.webp'],
  ['st_taking_turns', 'အလှည့်ကျ ကစားရအောင်', 'Let’s Take Turns', '/stories/st_taking_turns.ece7af8fbf.webp'],
  ['st_visit_to_doctor', 'ဆရာဝန်ထံ သွားရောက်ပြသခြင်း', 'A Visit to the Doctor', '/stories/st_visit_to_doctor.510f7446cc.webp'],
  ['st_waiting_at_clinic', 'စောင့်ဆိုင်းရတဲ့အခါ', 'While We Wait', '/stories/st_waiting_at_clinic.3d58cc8c4c.webp'],
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
      expect(screen.getByTestId('story-use-note')).toHaveTextContent(/ဘာသာစကား/);
      expect(screen.getByTestId('story-illustration')).toHaveAttribute('src', asset);
      expect(screen.getByTestId('story-illustration')).toHaveAttribute('alt', titleMm);
      expect(document.querySelector('img[src="/legacy-shared-story.webp"]')).toBeNull();

      myanmarView.unmount();
      localStorage.setItem('ace-locale', 'en');
      renderStory(slug);

      expect(screen.getByRole('heading', { name: titleEn })).toBeVisible();
      expect(screen.getByTestId('story-use-note')).toHaveTextContent(/learning and entertainment/i);
      expect(screen.getByTestId('story-illustration')).toHaveAttribute('src', asset);
      expect(screen.getByTestId('story-illustration')).toHaveAttribute('alt', titleEn);
    },
  );

  it('uses compact role-specific status on an AI-audited public story', () => {
    localStorage.setItem('ace-locale', 'en');
    renderStory('st_first_day_school');
    expect(screen.queryByTestId('ai-publication-disclosure')).not.toBeInTheDocument();
    expect(screen.getByTestId('ai-publication-note')).toHaveTextContent(
      'not approved by a clinician or native Myanmar-language editor',
    );
    expect(screen.getByText('Story st_first_day_school')).toBeVisible();
  });
});
