import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { ContentDetail } from '../../screens/ContentDetail';

const GUIDES = vi.hoisted(() => [
  ['gd_5_6m_social', '၅ – ၆ လ — လူမှုဆက်ဆံရေး လမ်းညွှန်', '5–6 months — Social guide', '/guides/gd_5_6m_social.f45ff11649.webp'],
  ['gd_7_9m_cognitive', '၇ – ၉ လ — အသိဉာဏ် ဖွံ့ဖြိုးမှု လမ်းညွှန်', '7–9 months — Cognitive guide', '/guides/gd_7_9m_cognitive.573c2f0d30.webp'],
  ['gd_7_9m_communication', '၇ – ၉ လ — ဆက်သွယ်ပြောဆိုမှု လမ်းညွှန်', '7–9 months — Communication guide', '/guides/gd_7_9m_communication.bdb749e2a3.webp'],
  ['gd_7_9m_emotional', '၇ – ၉ လ — စိတ်ခံစားမှု လမ်းညွှန်', '7–9 months — Emotional guide', '/guides/gd_7_9m_emotional.73eabf88fb.webp'],
  ['gd_7_9m_safety', '၇ – ၉ လ — ဘေးကင်းလုံခြုံရေး လမ်းညွှန်', '7–9 months — Safety guide', '/guides/gd_7_9m_safety.d33c9acaf9.webp'],
  ['gd_7_9m_self_help', '၇ – ၉ လ — ကိုယ်တိုင် လုပ်ဆောင်နိုင်မှု လမ်းညွှန်', '7–9 months — Self-help guide', '/guides/gd_7_9m_self_help.cdfac6e4bf.webp'],
  ['gd_7_9m_social', '၇ – ၉ လ — လူမှုဆက်ဆံရေး လမ်းညွှန်', '7–9 months — Social guide', '/guides/gd_7_9m_social.2a908691eb.webp'],
] as const);
const EMPTY_RECORDS = vi.hoisted(() => [] as const);

vi.mock('convex/react', () => {
  const results = new Map(GUIDES.map((guide) => {
    const [slug, titleMm, titleEn] = guide;
    return [slug, {
      staff: false,
      item: {
        _id: slug,
        slug,
        titleMm,
        titleEn,
        summaryMm: `MM ${slug}`,
        summaryEn: `EN ${slug}`,
        type: 'guide',
        domainKey: slug.endsWith('social') ? 'social' : 'guide',
        clinicalStatus: 'published',
        reviewScope: 'education',
        source: 'Production Convex',
        data: {
          observationQuestions: [],
          dailyActivities: [],
          indoor: [],
          outdoor: [],
          lowCost: [],
          commonMistakes: [],
          parentTips: [],
          redFlags: [],
        },
      },
      media: [{
        _id: `${slug}-remote`,
        kind: 'illustration',
        placeholder: false,
        url: '/legacy-shared-guide.webp',
      }],
    }];
  }));

  return {
    useQuery: (_query: unknown, args: { slug: string }) => results.get(
      args.slug as (typeof GUIDES)[number][0],
    ) ?? null,
  };
});

vi.mock('../../app/useOfflineLibrary', () => ({
  useDownloadedLibrary: () => ({ records: EMPTY_RECORDS, loaded: true }),
}));

function renderGuide(slug: string) {
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

describe('ContentDetail published guide illustrations', () => {
  afterEach(() => {
    cleanup();
    localStorage.removeItem('ace-locale');
  });

  it.each(GUIDES)(
    'renders %s with its exact unique image and bilingual title',
    (slug, titleMm, titleEn, asset) => {
      localStorage.setItem('ace-locale', 'mm');
      const myanmarView = renderGuide(slug);

      expect(screen.getByRole('heading', { name: titleMm })).toBeVisible();
      expect(screen.getByTestId('guide-illustration')).toHaveAttribute('src', asset);
      expect(screen.getByTestId('guide-illustration')).toHaveAttribute('alt', titleMm);
      expect(document.querySelector('img[src="/legacy-shared-guide.webp"]')).toBeNull();

      myanmarView.unmount();
      localStorage.setItem('ace-locale', 'en');
      renderGuide(slug);

      expect(screen.getByRole('heading', { name: titleEn })).toBeVisible();
      expect(screen.getByTestId('guide-illustration')).toHaveAttribute('src', asset);
      expect(screen.getByTestId('guide-illustration')).toHaveAttribute('alt', titleEn);
    },
  );
});
