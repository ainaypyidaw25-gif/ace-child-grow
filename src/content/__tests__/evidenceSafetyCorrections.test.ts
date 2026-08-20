import { describe, expect, it } from 'vitest';
import publishedSlugs from '../../../tests/harness/fixtures/publishedSlugs.json';
import { seedPayload } from '../seed';
import {
  EDUCATION_REVIEW_DIMENSIONS,
  FOCUSED_SPECIALIST_REVIEW_SLUGS,
  requiredPublicationReviews,
  requiresSpecialistReview,
  specialistReviewReason,
} from '../../../convex/lib/contentReviewRequirements';
import { DUPLICATE_MILESTONE_SLUGS } from '../../../convex/lib/contentRetirements';

const rows = seedPayload();
const bySlug = (slug: string) => {
  const item = rows.find((row) => row.slug === slug);
  if (!item) throw new Error(`Missing seed row: ${slug}`);
  return item;
};

describe('evidence and child-safety content corrections', () => {
  it('routes all seven named records for focused emergency-wording review', () => {
    const routed = new Set(rows.filter(requiresSpecialistReview).map((row) => row.slug));
    expect(FOCUSED_SPECIALIST_REVIEW_SLUGS).toHaveLength(7);
    for (const slug of FOCUSED_SPECIALIST_REVIEW_SLUGS) expect(routed.has(slug), slug).toBe(true);
  });

  it('uses the corrected age-specific English milestone claims', () => {
    expect(bySlug('ms_5_6m_cognitive_2').titleEn).toBe('Explores cause and effect in play');
    expect(bySlug('ms_5_6m_gross_motor_2').titleEn).toBe('Rolls from tummy to back');
    expect(bySlug('ms_5_6m_speech_2').titleEn).toContain('consonant sounds');
    expect(bySlug('ms_7_9m_fine_motor_1').titleEn).toBe('Passes objects hand to hand');
    expect(bySlug('ms_7_9m_language_1').titleEn).toBe('Responds to own name');
    expect(bySlug('ms_7_9m_social_1').titleEn).toBe('Knows familiar people');
    expect(bySlug('ms_7_9m_gross_motor_2').titleEn).toBe('Sitting without support');
    expect(bySlug('ms_2y_gross_motor_1').titleEn).toBe('Runs');
    expect(bySlug('ms_2_5y_gross_motor_2').titleEn).toBe('Jumps off the ground with both feet');
    expect(bySlug('ms_3y_cognitive_1').titleEn).toBe('Shows they know at least one color');
    expect(bySlug('ms_4y_gross_motor_1').titleEn).toBe('Hops on one foot');
    expect(bySlug('ms_4y_school_readiness_1').titleEn).toBe('Recognizes their written name');
    expect(bySlug('ms_5y_school_readiness_1').titleEn).toBe('Writes some letters in their name');
    expect(bySlug('ms_2_5y_fine_motor_1').titleEn).toBe('Turns book pages one at a time');
    expect(bySlug('ms_2y_speech_1').titleEn).toBe('Says at least two words together');
  });

  it('retires the exact six duplicate or age-misaligned milestone slugs from every new seed', () => {
    expect(DUPLICATE_MILESTONE_SLUGS).toHaveLength(6);
    for (const slug of DUPLICATE_MILESTONE_SLUGS) {
      expect(rows.some((row) => row.slug === slug), slug).toBe(false);
    }
  });

  it('routes bed-sharing wording to specialist review without treating general safe sleep as clinical approval', () => {
    const bedSharing = {
      slug: 'future-bed-sharing-guide',
      titleEn: 'Infant sleep',
      data: { safety: { en: 'How to bed-share with a baby.' } },
    };
    expect(specialistReviewReason(bedSharing)).toBe('bed_sharing_wording');
    expect(requiredPublicationReviews(bedSharing)).toEqual([
      ...EDUCATION_REVIEW_DIMENSIONS,
      'clinical',
    ]);
    expect(specialistReviewReason(bySlug('gd_birth_2m_safety'))).toBe('bed_sharing_wording');
    expect(bySlug('gd_birth_2m_safety').clinicalStatus).not.toBe('published');
    expect(specialistReviewReason(bySlug('gd_birth_2m_sleep'))).toBe('risk_wording');
  });

  it('preserves exact Myanmar-English meaning in corrected fields', () => {
    const storyActivity = bySlug('act_story_sequence').data.safety as { mm: string };
    expect(storyActivity.mm).toBe('အထူးသတိပြုရန် မရှိပါ။');

    const nameWritingSafety = bySlug('act_name_writing').data.safety as { mm: string; en: string };
    expect(nameWritingSafety.mm).toBe('ရောင်စုံခဲတံများ၏ ချွန်ထက်သော ခဲသားထိပ်များကို သတိပြုပါ။');
    expect(nameWritingSafety.en).toBe('Watch sharp pencil tips.');

    const boardBook = bySlug('act_board_book_point');
    expect(boardBook.titleMm).toBe('စာမျက်နှာထူ ရုပ်ပုံစာအုပ်ဖြင့် လက်ညှိုးထိုးကစားခြင်း');
    expect(boardBook.summaryMm).toBe(
      'စာမျက်နှာထူ ရုပ်ပုံစာအုပ်ကို အတူကြည့်ရင်း ပုံများကို လက်ညှိုးထိုး၍ အမည်ခေါ်ပေးခြင်း။',
    );

    const angry = bySlug('st_when_i_feel_angry');
    expect(JSON.stringify(angry.data)).toContain('ဖြည်းဖြည်း နက်နက် အသက်ရှူ');
    expect(JSON.stringify(angry.data)).not.toContain('အသက်ပြင်းပြင်း');

    const safety = bySlug('gd_7_9m_safety');
    expect(JSON.stringify(safety.data)).toContain('ဖိကြည့်လျှင် အရောင်မပျောက်သော အဖုအပိန့်');
    expect(JSON.stringify(safety.data)).toContain('does not fade under pressure');

    const emotional = bySlug('gd_7_9m_emotional');
    expect(JSON.stringify(emotional.data)).toContain('စိတ်မကြည်ခြင်း သို့မဟုတ် စိတ်ကျနေခြင်း');
    expect(JSON.stringify(emotional.data)).not.toContain('စိတ်ဓာတ်ကျခြင်း လက္ခဏာများ');

    const school = bySlug('ms_4y_school_readiness_1');
    expect(school.titleMm).toBe('ရေးထားသော မိမိနာမည်ကို မှတ်မိခြင်း');
    expect(school.data.observeMm).toBe('ရေးထားသော မိမိနာမည်ကို မြင်လျှင် မှတ်မိပါသလား။');
  });

  it('keeps safe-sleep instructions complete and parallel without adding bed-sharing advice', () => {
    const sleep = JSON.stringify(bySlug('lsn_healthy_sleep').data);
    expect(sleep).toContain('နေ့အိပ်ချိန်နှင့် ညအိပ်ချိန်တိုင်း');
    expect(sleep).toContain('မစောင်းသော မာကျောညီညာသည့် အိပ်ရာမျက်နှာပြင်');
    expect(sleep).toContain('ခေါင်းအုံး၊ စောင်၊ ဘေးကာ၊ အရုပ်ပျော့');
    expect(sleep).toContain('ပထမ ၆ လအထိ');
    expect(sleep).toContain('ကလေး၏ သီးခြားအိပ်ရာ');
    expect(sleep).toContain('For every nap and overnight sleep until age 1');
    expect(sleep).toContain('firm, flat, non-inclined sleep surface');
    expect(sleep).toContain('no pillow, blanket, bumper, soft toy, or loose cloth');
    expect(sleep).toContain('own separate sleep space in the parents’ room');
    expect(sleep).not.toContain('How to share a bed');
  });

  it('names the bean choking risk and the WHO screen-time limit in both languages', () => {
    const seedStory = JSON.stringify(bySlug('st_little_seed').data);
    expect(seedStory).toContain('အသက် ၄ နှစ်အောက်');
    expect(seedStory).toContain('လည်ချောင်းပိတ်စေနိုင်');
    expect(seedStory).toContain('An adult plants the bean');
    expect(seedStory).toContain('choking risk for children under 4');

    const screenTime = JSON.stringify(bySlug('lsn_screen_time').data);
    expect(screenTime).toContain('အသက် ၂ နှစ်မှ ၄ နှစ်အထိ');
    expect(screenTime).toContain('တစ်နေ့ ၁ နာရီထက် မကျော်');
    expect(screenTime).toContain('from ages 2 to 4');
    expect(screenTime).toContain('no more than 1 hour a day');
  });

  it('removes stale pending-clinical metadata from every known parent-facing slug', () => {
    expect(publishedSlugs.length).toBeGreaterThanOrEqual(110);
    for (const slug of publishedSlugs) {
      if ((DUPLICATE_MILESTONE_SLUGS as readonly string[]).includes(slug)) continue;
      expect(bySlug(slug).source, slug).not.toMatch(/pending native-Myanmar and clinical review/i);
    }
  });

  it('marks every known printable catalogue record as preview-only without fake PDFs', () => {
    const printables = publishedSlugs.filter((slug) => slug.startsWith('prt_')).map(bySlug);
    expect(printables.length).toBeGreaterThanOrEqual(15);
    for (const item of printables) {
      expect(item.data).toMatchObject({
        format: 'Preview only — bilingual PDF not yet available',
        availability: 'preview_only',
      });
      expect(item.media.some((asset) => asset.kind === 'pdf' && asset.placeholder === true)).toBe(true);
      expect(requiredPublicationReviews(item), item.slug).toEqual(EDUCATION_REVIEW_DIMENSIONS);
    }
  });
});
