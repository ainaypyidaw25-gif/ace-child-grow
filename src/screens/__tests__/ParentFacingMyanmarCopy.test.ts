import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('parent-facing Myanmar copy polish', () => {
  const expectedByFile = new Map<string, string[]>([
    ['src/components/OwnDisplayName.tsx', ['ဥပမာ — ဒေါ်လပြည့်ဝန်း']],
    ['src/screens/Home.tsx', ['ဓာတ်ပုံထည့်၊ လူမှုကွန်ရက်တွင် မျှဝေ']],
    ['src/screens/EditChild.tsx', ['လမစေ့ဘဲ မွေးဖွားခဲ့ပါသည် (ရက်စေ့တွက်ချက်အသက် သုံးမည်)']],
    ['src/screens/Growth.tsx', ['ဤဝန်ဆောင်မှုကို အသုံးပြုရန် ဦးစွာ ကလေးအချက်အလက် ထည့်ပါ။']],
    ['src/screens/Sleep.tsx', ['အိပ်နေစဉ် အသက်ရှူရပ်တန့်မှု']],
    ['src/screens/OfflineDownloads.tsx', ['ပုံနှိပ်အသုံးပြုရန်', 'ဖုန်းထဲတွင် သိမ်းဆည်းထားမှု']],
    ['src/screens/PaymentStatus.tsx', ['ငွေပေးချေမှု စာမျက်နှာ ဖွင့်မည်']],
    ['src/screens/Profile.tsx', ['အချက်အလက်များ ထုတ်ယူရန်']],
    ['src/screens/SubscriptionPlans.tsx', ['ဘဏ်အကောင့်သို့ တိုက်ရိုက်ငွေလွှဲခြင်း']],
    ['src/i18n/mm.ts', ["'milestoneKeepsake.share': 'လူမှုကွန်ရက်တွင် မျှဝေမည်'"]],
  ]);

  it('keeps every approved wording change on its intended surface', () => {
    for (const [path, expected] of expectedByFile) {
      const contents = source(path);
      for (const wording of expected) expect(contents, `${path} must contain ${wording}`).toContain(wording);
    }
  });

  it('does not restore the replaced wording on those parent-facing surfaces', () => {
    const allSources = [...expectedByFile.keys()].map(source).join('\n');
    for (const legacy of [
      'ဒေါ်လပြယ်ဝန်း',
      'Social media မှာ မျှဝေ',
      'အချိန်မတိုင်မီ မွေးဖွားခြင်း (ပြင်ဆင်အသက် သုံးရန်)',
      'ဤအင်္ဂါရပ်ကို သုံးရန် ကလေးတစ်ဦး အရင်ထည့်ပါ။',
      'Payment app/page ကိုဖွင့်မည်',
      'ကျွန်ုပ်၏ အချက်အလက် ထုတ်ယူရန်',
      "L('လက်ဖြင့်ငွေလွှဲခြင်း', 'Manual transfer')",
    ]) {
      expect(allSources, `legacy wording must stay removed: ${legacy}`).not.toContain(legacy);
    }
  });
});
