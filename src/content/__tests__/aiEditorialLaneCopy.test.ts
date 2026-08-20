import { describe, expect, it } from 'vitest';
import { CONTENT_SEED } from '../seed';
import { sourcesForContent } from '../../evidence/links';
import { SOURCE_BY_ID } from '../../evidence/sources';

const TARGETS = [
  'lsn_early_math',
  'st_waiting_at_clinic',
  'st_first_day_school',
] as const;

const DISCLOSURE_MM =
  'AI စစ်ဆေးမှု အသိပေးချက် — ဤအကြောင်းအရာကို AI ဖြင့် စစ်ဆေးထားသော်လည်း ဆေးဘက်ပညာရှင် သို့မဟုတ် မြန်မာဘာသာကို မိခင်ဘာသာစကားအဖြစ် အသုံးပြုသော စာတည်းဖြတ်သူက အတည်ပြုထားခြင်း မရှိပါ။ အထွေထွေပညာပေးအတွက်သာ ဖြစ်ပြီး ဆေးဘက်ဆိုင်ရာ အကြံပြုချက်၊ ကလေးဖွံ့ဖြိုးမှု စစ်ဆေးချက် သို့မဟုတ် ရောဂါဖော်ထုတ်ချက် မဟုတ်ပါ။';
const DISCLOSURE_EN =
  'AI review notice — This content was reviewed by AI but has not been approved by a clinician or native Myanmar-language editor. It is for general education only and is not medical advice, developmental screening, or diagnosis.';

const rowFor = (slug: string) => {
  const row = CONTENT_SEED.find((item) => item.slug === slug);
  expect(row, slug).toBeDefined();
  return row!;
};

const bodyFor = (slug: string) => rowFor(slug).data.body as { mm: string; en: string };

describe('bounded AI-reviewed editorial lane copy', () => {
  it('keeps the exact three reviewed rows in clinical review', () => {
    expect(TARGETS).toHaveLength(3);
    for (const slug of TARGETS) {
      expect(rowFor(slug).clinicalStatus, slug).toBe('clinical_review');
    }
  });

  it('shows the full bilingual AI-review disclosure in every rendered body', () => {
    for (const slug of TARGETS) {
      const body = bodyFor(slug);
      expect(body.mm.startsWith(DISCLOSURE_MM), slug).toBe(true);
      expect(body.en.startsWith(DISCLOSURE_EN), slug).toBe(true);
    }
  });

  it('keeps the early-math lesson optional, everyday, and free of superiority claims', () => {
    const row = rowFor('lsn_early_math');
    const body = bodyFor(row.slug);
    const quiz = row.data.quiz as Array<{
      q: { mm: string; en: string };
      options: Array<{ mm: string; en: string }>;
      answerIndex: number;
    }>;

    expect(body.mm).toContain('နေ့စဉ်တွေ့ရသော အရာများကို အတူရေတွက်ခြင်း');
    expect(body.en).toContain('Count everyday things together');
    expect(body.mm).not.toContain('အကောင်းဆုံး');
    expect(body.en).not.toMatch(/best (way|taught)/i);
    expect(quiz[0].q).toEqual({
      mm: 'နေ့စဉ်ဘဝတွင် အစောပိုင်း သင်္ချာကို အတူလေ့ကျင့်နိုင်သည့် ရိုးရှင်းသော နည်းတစ်ခုမှာ —',
      en: 'One simple way to practise early math in daily life is —',
    });
    expect(quiz[0].answerIndex).toBe(0);
  });

  it('marks both stories as fictional and avoids one-size-fits-all emotional claims', () => {
    const waiting = rowFor('st_waiting_at_clinic');
    const school = rowFor('st_first_day_school');
    const waitingBody = bodyFor(waiting.slug);
    const schoolBody = bodyFor(school.slug);

    expect(waiting.summaryMm?.startsWith('စိတ်ကူးယဉ်ပုံပြင်')).toBe(true);
    expect(waiting.summaryEn?.startsWith('A fictional story about one child')).toBe(true);
    expect(school.summaryMm?.startsWith('စိတ်ကူးယဉ်ပုံပြင်')).toBe(true);
    expect(school.summaryEn).toBe('A fictional story about one child’s first day at school.');

    for (const body of [waitingBody, schoolBody]) {
      expect(body.mm).toContain('ကလေးတိုင်း အလားတူ ခံစားမည် သို့မဟုတ် တုံ့ပြန်မည်ဟု မဆိုလိုပါ');
      expect(body.en).toContain('do not imply that every child will feel or respond in the same way');
    }

    expect(waiting.summaryEn).not.toMatch(/calm|calming/i);
    expect(school.summaryEn).not.toMatch(/eas(e|ing)|reassur/i);
    expect(school.data.activities).toEqual([
      {
        mm: 'ကျောင်းအကြောင်း အတူစကားပြောပြီး ကလေး၏ ခံစားချက်များကို မေးမြန်းနားထောင်ပါ။',
        en: 'Talk about school together and invite the child to share any feelings.',
      },
    ]);
  });

  it('does not convert linked sources into an AI-manufactured approval', () => {
    for (const slug of TARGETS) {
      for (const sourceId of sourcesForContent(slug)) {
        expect(SOURCE_BY_ID.get(sourceId)?.reviewStatus, `${slug} → ${sourceId}`)
          .toBe('awaiting_review');
      }
    }
  });
});
