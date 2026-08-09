import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { ContentDetail } from '../../screens/ContentDetail';

const ACTIVITIES = vi.hoisted(() => [
  {
    slug: 'act_container_in_and_out',
    titleMm: 'ဗူးထဲ ထည့်၊ ပြန်ထုတ်',
    titleEn: 'In and out of the container',
    summaryMm: 'ပစ္စည်းများကို ဘူးထဲထည့်ပြီး ပြန်ထုတ်ကစားခြင်းဖြင့် လက်ချောင်းလှုပ်ရှားမှုနှင့် အကြောင်းအကျိုးဆက်စပ်မှုကို နားလည်လာစေသည်။',
    summaryEn: 'Putting objects into a container and taking them out builds hand skills and an understanding of where things go.',
    domainKey: 'fine_motor',
    asset: '/activities/10_12m/act_container_in_and_out.69ff724ffa.webp',
  },
  {
    slug: 'act_obstacle_crawl',
    titleMm: 'ခေါင်းအုံး အတားအဆီး တွားကစားခြင်း',
    titleEn: 'Pillow obstacle crawl',
    summaryMm: 'ပျော့ပျောင်းသော ခေါင်းအုံးများကို ကျော်တွားစေပြီး ကိုယ်လက်လှုပ်ရှားမှုနှင့် ဟန်ချက်ကို လေ့ကျင့်ပေးခြင်း။',
    summaryEn: 'Gross-motor practice crawling over soft pillows.',
    domainKey: 'gross_motor',
    asset: '/activities/10_12m/act_obstacle_crawl.459e65a32d.webp',
  },
  {
    slug: 'act_roll_the_ball_back',
    titleMm: 'ဘောလုံး လှိမ့်ပေး လှိမ့်ပြန်',
    titleEn: 'Roll the ball back',
    summaryMm: 'ဘောလုံးကို အပြန်အလှန် လှိမ့်ခြင်းဖြင့် အလှည့်ကျ ကစားခြင်းနှင့် လက်–မျက်စိ ညှိနှိုင်းမှုကို လေ့ကျင့်ပေးသည်။',
    summaryEn: 'Rolling a ball back and forth practises turn-taking and hand–eye coordination.',
    domainKey: 'social',
    asset: '/activities/10_12m/act_roll_the_ball_back.5a37c8d923.webp',
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
          ageGroupKey: '10_12m',
          clinicalStatus: 'published',
          difficulty: 'easy',
          durationMinutes: 10,
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

describe('ContentDetail 10–12 month activity illustrations', () => {
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
