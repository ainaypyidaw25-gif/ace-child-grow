import { describe, expect, it } from 'vitest';
import { publicContentCopy } from './publicContentCopy';

const MM_NOTICE = 'AI စစ်ဆေးမှု အသိပေးချက် — ဤအကြောင်းအရာကို AI ဖြင့် စစ်ဆေးထားသော်လည်း ဆေးဘက်ပညာရှင် သို့မဟုတ် မြန်မာဘာသာကို မိခင်ဘာသာစကားအဖြစ် အသုံးပြုသော စာတည်းဖြတ်သူက အတည်ပြုထားခြင်း မရှိပါ။ အထွေထွေပညာပေးအတွက်သာ ဖြစ်ပြီး ဆေးဘက်ဆိုင်ရာ အကြံပြုချက်၊ ကလေးဖွံ့ဖြိုးမှု စစ်ဆေးချက် သို့မဟုတ် ရောဂါဖော်ထုတ်ချက် မဟုတ်ပါ။';
const EN_NOTICE = 'AI review notice — This content was reviewed by AI but has not been approved by a clinician or native Myanmar-language editor. It is for general education only and is not medical advice, developmental screening, or diagnosis.';

describe('publicContentCopy', () => {
  it.each([
    [MM_NOTICE, 'သင်ခန်းစာစာသား'],
    [EN_NOTICE, 'Lesson copy'],
  ])('removes the governed AI disclosure prefix from public copy', (notice, body) => {
    expect(publicContentCopy(`${notice}\n\n${body}`)).toBe(body);
  });

  it('keeps the fictional-story boundary after removing the AI prefix', () => {
    const storyBoundary = 'Fictional story — This story belongs to one character.';
    expect(publicContentCopy(`${EN_NOTICE}\n\n${storyBoundary}\n\nStory copy`))
      .toBe(`${storyBoundary}\n\nStory copy`);
  });

  it('does not rewrite disclosures embedded inside ordinary content', () => {
    const body = `Opening paragraph.\n\n${EN_NOTICE}\n\nClosing paragraph.`;
    expect(publicContentCopy(body)).toBe(body);
  });
});
