import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { ContentDetail } from '../../screens/ContentDetail';

const PRINTABLES = vi.hoisted(() => [
  ['prt_behavior_chart', 'အပြုအမူ ဇယား', 'Behavior Chart', '/printables/prt_behavior_chart.dee67d9e38.webp'],
  ['prt_checklist_10_12m', '၁၀–၁၂ လ မိဘ စစ်ဆေးစာရင်း', '10–12 month parent checklist', '/printables/prt_checklist_10_12m.ec38be069f.webp'],
  ['prt_checklist_3_4m', '၃ – ၄ လ — မိဘ စစ်ဆေးစာရင်း', '3–4 months — Parent checklist', '/printables/prt_checklist_3_4m.4ac13c3e90.webp'],
  ['prt_checklist_5_6m', '၅ – ၆ လ — မိဘအတွက် စောင့်ကြည့်ရန် စာရင်း', '5–6 months — Parent observation checklist', '/printables/prt_checklist_5_6m.8c2c14163d.webp'],
  ['prt_checklist_7_9m', '၇–၉ လ မိဘ စစ်ဆေးစာရင်း', '7–9 month parent checklist', '/printables/prt_checklist_7_9m.fa976b926a.webp'],
  ['prt_communication_cards', 'ဆက်သွယ်ရေး ကတ်များ', 'Communication Cards', '/printables/prt_communication_cards.a372163a52.webp'],
  ['prt_doctor_visit_checklist', 'ဆရာဝန်ပြသ စစ်ဆေးစာရင်း', 'Doctor Visit Checklist', '/printables/prt_doctor_visit_checklist.d299fb4e89.webp'],
  ['prt_emotion_cards', 'ခံစားမှု ကတ်များ', 'Emotion Cards', '/printables/prt_emotion_cards.663f8ae9f1.webp'],
  ['prt_flash_cards', 'ဖလက်ရှ် ကတ်များ', 'Flash Cards', '/printables/prt_flash_cards.8cd336dabb.webp'],
  ['prt_growth_log', 'ကြီးထွားမှု မှတ်တမ်း', 'Growth Log', '/printables/prt_growth_log.dc54540a42.webp'],
  ['prt_milestone_checklist', 'ဖွံ့ဖြိုးမှု မှတ်တိုင် စစ်ဆေးစာရင်း', 'Milestone Checklist', '/printables/prt_milestone_checklist.5b4ed7c4c3.webp'],
  ['prt_reward_chart', 'ဆုချီးမြှင့် ဇယား', 'Reward Chart', '/printables/prt_reward_chart.15666233a2.webp'],
  ['prt_routine_chart', 'နေ့စဉ် လုပ်ရိုးလုပ်စဉ် ဇယား', 'Routine Chart', '/printables/prt_routine_chart.04d6c6a9f9.webp'],
  ['prt_sleep_diary', 'အိပ်စက်မှု မှတ်တမ်း', 'Sleep Diary', '/printables/prt_sleep_diary.f02d540c52.webp'],
  ['prt_visual_schedule', 'ပုံရိပ် အစီအစဉ်ဇယား', 'Visual Schedule', '/printables/prt_visual_schedule.31eb2cef7a.webp'],
] as const);
const EMPTY_RECORDS = vi.hoisted(() => [] as const);

vi.mock('convex/react', () => {
  const results = new Map(PRINTABLES.map((printable) => {
    const [slug, titleMm, titleEn] = printable;
    return [slug, {
      staff: false,
      item: {
        _id: slug,
        slug,
        titleMm,
        titleEn,
        summaryMm: `MM ${slug}`,
        summaryEn: `EN ${slug}`,
        type: 'printable',
        category: slug.slice(4),
        clinicalStatus: 'published',
        reviewScope: 'education',
        source: 'Production Convex',
        data: { format: 'A4 PDF' },
      },
      media: [{
        _id: `${slug}-remote`,
        kind: 'illustration',
        placeholder: false,
        url: '/legacy-shared-printable.webp',
      }],
    }];
  }));

  return {
    useQuery: (_query: unknown, args: { slug: string }) => results.get(
      args.slug as (typeof PRINTABLES)[number][0],
    ) ?? null,
  };
});

vi.mock('../../app/useOfflineLibrary', () => ({
  useDownloadedLibrary: () => ({ records: EMPTY_RECORDS, loaded: true }),
}));

function renderPrintable(slug: string) {
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

describe('ContentDetail published printable illustrations', () => {
  afterEach(() => {
    cleanup();
    localStorage.removeItem('ace-locale');
  });

  it.each(PRINTABLES)(
    'renders %s with its exact unique image and bilingual title',
    (slug, titleMm, titleEn, asset) => {
      localStorage.setItem('ace-locale', 'mm');
      const myanmarView = renderPrintable(slug);

      expect(screen.getByRole('heading', { name: titleMm })).toBeVisible();
      expect(screen.getByTestId('printable-use-note')).toHaveTextContent(/ရောဂါဖော်ထုတ်ချက် မဟုတ်/);
      expect(screen.getByTestId('printable-illustration')).toHaveAttribute('src', asset);
      expect(screen.getByTestId('printable-illustration')).toHaveAttribute('alt', titleMm);
      expect(screen.queryByRole('img', { name: titleMm })).toBeVisible();
      expect(document.querySelector('img[src="/legacy-shared-printable.webp"]')).toBeNull();

      myanmarView.unmount();
      localStorage.setItem('ace-locale', 'en');
      renderPrintable(slug);

      expect(screen.getByRole('heading', { name: titleEn })).toBeVisible();
      expect(screen.getByTestId('printable-use-note')).toHaveTextContent(/not a medical diagnosis/i);
      expect(screen.getByTestId('printable-illustration')).toHaveAttribute('src', asset);
      expect(screen.getByTestId('printable-illustration')).toHaveAttribute('alt', titleEn);
    },
  );
});
