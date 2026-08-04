import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { ContentDetail } from '../../screens/ContentDetail';

const ACTIVITIES = vi.hoisted(() => [
  {
    slug: 'act_drum_and_pause',
    titleMm: 'တီး၍ ရပ်နားခြင်း',
    titleEn: 'Drum and pause',
    summaryMm: 'ခေါက်သံ ရိုက်ပြီး ရပ်နားပေးခြင်းဖြင့် ကလေးအား အလှည့်ကျ တုံ့ပြန်စေခြင်း။',
    summaryEn: 'Tap a simple beat, then pause so your baby can take a turn.',
    asset: '/activities/7_9m/act_drum_and_pause.86c0ba193b.webp',
  },
  {
    slug: 'act_lift_the_flap_book',
    titleMm: 'စာအုပ် ဖွင့်၍ ရှာကြည့်ခြင်း',
    titleEn: 'Lift-the-flap book time',
    summaryMm: 'ခိုင်ခံ့သော ပုံစာအုပ် တစ်အုပ်ကို အတူဖတ်၍ ကလေးအား စာမျက်နှာ လှန်ခွင့် ပေးခြင်း။',
    summaryEn: 'Share a sturdy picture book and let your baby turn or lift the pages.',
    asset: '/activities/7_9m/act_lift_the_flap_book.6c33f2de2d.webp',
  },
  {
    slug: 'act_name_and_wait',
    titleMm: 'အမည်ခေါ်၍ စောင့်ခြင်း',
    titleEn: 'Name it and wait',
    summaryMm: 'အရာဝတ္ထုကို အမည်ခေါ်ပြီး ကလေး တုံ့ပြန်ရန် စောင့်ပေးခြင်း။',
    summaryEn: 'Name what your baby is looking at, then pause and let her answer.',
    asset: '/activities/7_9m/act_name_and_wait.9e9a12625f.webp',
  },
  {
    slug: 'act_peekaboo',
    titleMm: '“ဘယ်မှာလဲ၊ ဒီမှာပါ” ကစားခြင်း',
    titleEn: 'Peek-a-boo',
    summaryMm: 'မျက်နှာကို ခဏဖုံးပြီး ပြန်ဖော်ပြကာ မမြင်ရသော်လည်း ရှိနေဆဲဖြစ်ကြောင်း ကလေး နားလည်လာစေရန် ကစားခြင်း။',
    summaryEn: 'Teach object permanence through hide-and-reveal.',
    asset: '/activities/7_9m/act_peekaboo.03b58f4431.webp',
  },
  {
    slug: 'act_sit_and_reach_ring',
    titleMm: 'ထိုင်၍ လက်လှမ်းယူခြင်း',
    titleEn: 'Sit and reach for the ring',
    summaryMm: 'ထိုင်နေစဉ် ဘေးတစ်ဖက်သို့ လှမ်းယူစေခြင်းဖြင့် ကိုယ်လုံး ဟန်ချက်ကို လေ့ကျင့်ပေးခြင်း။',
    summaryEn: 'Reaching sideways while sitting builds trunk balance.',
    asset: '/activities/7_9m/act_sit_and_reach_ring.305571520c.webp',
  },
  {
    slug: 'act_two_texture_spoons',
    titleMm: 'အထိအတွေ့ နှစ်မျိုး ဇွန်းကစား',
    titleEn: 'Two-texture spoon play',
    summaryMm: 'အထိအတွေ့ ကွဲပြားသော အစားအစာ နှစ်မျိုးကို ကိုင်တွယ် စမ်းသပ်ခွင့် ပေးခြင်း။',
    summaryEn: 'Let your baby explore two foods with different textures during a meal.',
    asset: '/activities/7_9m/act_two_texture_spoons.f811d80c0a.webp',
  },
  {
    slug: 'act_wave_bye_bye',
    titleMm: 'လက်ပြ နှုတ်ဆက်ခြင်း',
    titleEn: 'Wave bye-bye',
    summaryMm: 'ထွက်ခွာချိန်တိုင်း လက်ပြပြီး နှုတ်ဆက်ခြင်းဖြင့် ဆက်သွယ်မှု အမူအရာကို သင်ပေးခြင်း။',
    summaryEn: 'Waving every time someone leaves teaches a first communication gesture.',
    asset: '/activities/7_9m/act_wave_bye_bye.af8bd5d742.webp',
  },
] as const);
const EMPTY_RECORDS = vi.hoisted(() => [] as const);

vi.mock('convex/react', () => {
  const results = new Map<string, unknown>();
  return {
    useQuery: (_api: unknown, args?: { slug?: string }) => {
      const slug = args?.slug ?? '';
      if (results.has(slug)) return results.get(slug);
      const activity = ACTIVITIES.find((row) => row.slug === slug);
      if (!activity) return null;
      const result = {
        staff: false,
        media: [],
        item: {
          _id: activity.slug,
          ...activity,
          type: 'activity',
          ageGroupKey: '7_9m',
          domainKey: 'social',
          clinicalStatus: 'published',
          difficulty: 'easy',
          durationMinutes: 5,
          reviewScope: 'education',
          source: 'Production Convex',
          data: {},
        },
      };
      results.set(slug, result);
      return result;
    },
  };
});

vi.mock('../../app/useOfflineLibrary', () => ({
  useDownloadedLibrary: () => ({ records: EMPTY_RECORDS, loaded: true }),
}));

describe('ContentDetail 7–9 month activity illustrations', () => {
  afterEach(() => cleanup());

  it.each(ACTIVITIES)(
    'renders the exact production text and exact unique asset for $slug',
    (activity) => {
      render(
        <MemoryRouter initialEntries={[`/content/${activity.slug}`]}>
          <LocaleProvider>
            <Routes>
              <Route path="/content/:slug" element={<ContentDetail />} />
            </Routes>
          </LocaleProvider>
        </MemoryRouter>,
      );

      expect(screen.getByRole('heading', { name: activity.titleMm })).toBeVisible();
      expect(screen.getByText(activity.summaryMm)).toBeVisible();
      expect(screen.getByTestId('activity-illustration')).toHaveAttribute(
        'src',
        activity.asset,
      );
      expect(screen.getByTestId('activity-illustration')).toHaveAttribute(
        'alt',
        activity.titleMm,
      );
    },
  );
});
