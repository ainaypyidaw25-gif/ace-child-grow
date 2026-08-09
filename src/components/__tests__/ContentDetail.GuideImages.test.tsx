import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { ContentDetail } from '../../screens/ContentDetail';

const GUIDES = vi.hoisted(() => [
  ['gd_birth_2m_cognitive', 'မွေးကင်းစ– ၂ လ — အသိဉာဏ် ဖွံ့ဖြိုးမှု လမ်းညွှန်', 'Birth–2 months — Early thinking guide', '/guides/gd_birth_2m_cognitive.ab5c096dbf.webp', 'clinical_review'],
  ['gd_birth_2m_communication', 'မွေးကင်းစ – ၂ လ — ဆက်သွယ်ပြောဆိုမှု လမ်းညွှန်', 'Birth–2 months — Communication guide', '/guides/gd_birth_2m_communication.dfb919eff7.webp', 'clinical_review'],
  ['gd_birth_2m_daily_routine', 'မွေးကင်းစ – ၂ လ — နေ့စဉ် လုပ်ရိုးလုပ်စဉ် လမ်းညွှန်', 'Birth–2 months — Daily rhythm guide', '/guides/gd_birth_2m_daily_routine.bb306b07b9.webp', 'clinical_review'],
  ['gd_birth_2m_emotional', 'မွေးကင်းစ – ၂ လ — စိတ်ခံစားမှု လမ်းညွှန်', 'Birth–2 months — Feelings and comfort guide', '/guides/gd_birth_2m_emotional.2456e64699.webp', 'clinical_review'],
  ['gd_birth_2m_fine_motor', 'မွေးကင်းစ– ၂ လ — လက်နှင့် ကိုင်တွယ်မှု လမ်းညွှန်', 'Birth–2 months — Hands and grasp guide', '/guides/gd_birth_2m_fine_motor.6090c1ac8d.webp', 'clinical_review'],
  ['gd_birth_2m_gross_motor', 'မွေးကင်းစ– ၂ လ — ကိုယ်လက်လှုပ်ရှားမှု လမ်းညွှန်', 'Birth–2 months — Big movement guide', '/guides/gd_birth_2m_gross_motor.95520ad071.webp', 'clinical_review'],
  ['gd_birth_2m_nutrition', 'မွေးကင်းစ – ၂ လ — အာဟာရနှင့် နို့တိုက်ကျွေးခြင်း လမ်းညွှန်', 'Birth–2 months — Feeding guide', '/guides/gd_birth_2m_nutrition.5015e31552.webp', 'clinical_review'],
  ['gd_birth_2m_play', 'မွေးကင်းစ – ၂ လ — ကစားခြင်း လမ်းညွှန်', 'Birth–2 months — Play guide', '/guides/gd_birth_2m_play.b779fe5a19.webp', 'clinical_review'],
  ['gd_birth_2m_safety', 'မွေးကင်းစ – ၂ လ — ဘေးကင်းလုံခြုံရေး လမ်းညွှန်', 'Birth–2 months — Safety guide', '/guides/gd_birth_2m_safety.edd2756676.webp', 'clinical_review'],
  ['gd_birth_2m_sleep', 'မွေးကင်းစ–၂ လ — အိပ်စက်ခြင်း', 'Birth–2 months — Sleep', '/guides/gd_birth_2m_sleep.3bf5cea75b.webp', 'clinical_review'],
  ['gd_birth_2m_social', 'မွေးကင်းစ – ၂ လ — လူမှုဆက်ဆံရေး လမ်းညွှန်', 'Birth–2 months — Social connection guide', '/guides/gd_birth_2m_social.d03fb94d44.webp', 'clinical_review'],
  ['gd_5_6m_social', '၅ – ၆ လ — လူမှုဆက်ဆံရေး လမ်းညွှန်', '5–6 months — Social guide', '/guides/gd_5_6m_social.f45ff11649.webp', 'published'],
  ['gd_7_9m_cognitive', '၇ – ၉ လ — အသိဉာဏ် ဖွံ့ဖြိုးမှု လမ်းညွှန်', '7–9 months — Cognitive guide', '/guides/gd_7_9m_cognitive.573c2f0d30.webp', 'published'],
  ['gd_7_9m_communication', '၇ – ၉ လ — ဆက်သွယ်ပြောဆိုမှု လမ်းညွှန်', '7–9 months — Communication guide', '/guides/gd_7_9m_communication.bdb749e2a3.webp', 'published'],
  ['gd_7_9m_emotional', '၇ – ၉ လ — စိတ်ခံစားမှု လမ်းညွှန်', '7–9 months — Emotional guide', '/guides/gd_7_9m_emotional.73eabf88fb.webp', 'published'],
  ['gd_7_9m_safety', '၇ – ၉ လ — ဘေးကင်းလုံခြုံရေး လမ်းညွှန်', '7–9 months — Safety guide', '/guides/gd_7_9m_safety.d33c9acaf9.webp', 'published'],
  ['gd_7_9m_self_help', '၇ – ၉ လ — ကိုယ်တိုင် လုပ်ဆောင်နိုင်မှု လမ်းညွှန်', '7–9 months — Self-help guide', '/guides/gd_7_9m_self_help.cdfac6e4bf.webp', 'published'],
  ['gd_7_9m_social', '၇ – ၉ လ — လူမှုဆက်ဆံရေး လမ်းညွှန်', '7–9 months — Social guide', '/guides/gd_7_9m_social.2a908691eb.webp', 'published'],
] as const);
const EMPTY_RECORDS = vi.hoisted(() => [] as const);

vi.mock('convex/react', () => {
  const results = new Map(GUIDES.map((guide) => {
    const [slug, titleMm, titleEn, , clinicalStatus] = guide;
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
        clinicalStatus: clinicalStatus ?? 'published',
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

describe('ContentDetail owner-authorized Production guide illustrations', () => {
  afterEach(() => {
    cleanup();
    localStorage.removeItem('ace-locale');
  });

  it.each(GUIDES)(
    'renders %s with its exact unique image and bilingual title',
    (slug, titleMm, titleEn, asset, _clinicalStatus) => {
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
