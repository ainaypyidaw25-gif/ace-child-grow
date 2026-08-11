import { describe, expect, it } from 'vitest';
import publishedSlugs from '../../../tests/harness/fixtures/publishedSlugs.json';
import { seedPayload } from '../seed';
import {
  FOCUSED_SPECIALIST_REVIEW_SLUGS,
  requiresSpecialistReview,
} from '../../../convex/lib/contentReviewRequirements';

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
    expect(bySlug('ms_5_6m_language_1').titleEn).toBe('Takes turns making sounds with you');
    expect(bySlug('ms_5_6m_cognitive_2').titleEn).toBe('Explores cause and effect in play');
    expect(bySlug('ms_5_6m_fine_motor_1').titleEn).toContain('Beginning');
    expect(bySlug('ms_5_6m_gross_motor_2').titleEn).toBe('Rolls from tummy to back');
    expect(bySlug('ms_2y_gross_motor_1').titleEn).toBe('Runs');
    expect(bySlug('ms_2_5y_gross_motor_2').titleEn).toBe('Jumps off the ground with both feet');
    expect(bySlug('ms_3y_cognitive_1').titleEn).toBe('Shows they know at least one color');
    expect(bySlug('ms_4y_gross_motor_1').titleEn).toBe('Hops on one foot');
    expect(bySlug('ms_4y_school_readiness_1').titleEn).toBe('Recognizes their written name');
    expect(bySlug('ms_5y_school_readiness_1').titleEn).toBe('Writes some letters in their name');
    expect(bySlug('ms_2_5y_fine_motor_1').titleEn).toBe('Turns book pages one at a time');
    expect(bySlug('ms_2y_speech_1').titleEn).toBe('Says at least two words together');
  });

  it('preserves exact Myanmar-English meaning in corrected fields', () => {
    const storyActivity = bySlug('act_story_sequence').data.safety as { mm: string };
    expect(storyActivity.mm).toBe('အထူးသတိပြုရန် မရှိပါ။');

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

  it('removes stale pending-clinical metadata from every known parent-facing slug', () => {
    expect(publishedSlugs.length).toBeGreaterThanOrEqual(110);
    for (const slug of publishedSlugs) {
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
    }
  });
});
