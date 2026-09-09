/**
 * Exact-state production release for two Burmese copy corrections that are
 * already in the review queue. A full seed import would rewrite every
 * non-published row, so this release is intentionally limited to the authored
 * fields below and to the production revisions captured on 2026-08-18.
 */
export const CLINICAL_REVIEW_COPY_RELEASE_ID =
  '2026-08-18-clinical-review-copy' as const;

export type ClinicalReviewCopyPatch = {
  path: 'titleMm' | 'summaryMm' | `data.${string}`;
  before: string;
  value: string;
};

function target(
  slug: string,
  expectedClinicalStatus: 'clinical_review',
  expectedReviewRevision: number,
  expectedUpdatedAt: number,
  patches: readonly ClinicalReviewCopyPatch[],
) {
  return {
    slug,
    expectedClinicalStatus,
    expectedReviewRevision,
    expectedUpdatedAt,
    patches,
  } as const;
}

export const CLINICAL_REVIEW_COPY_TARGETS = [
  target('act_board_book_point', 'clinical_review', 4, 1786432330925, [
    {
      path: 'titleMm',
      before: 'ထူထပ်စာအုပ် လက်ညှိုးထိုး ကစားခြင်း',
      value: 'စာမျက်နှာထူ ရုပ်ပုံစာအုပ်ဖြင့် လက်ညှိုးထိုးကစားခြင်း',
    },
    {
      path: 'summaryMm',
      before: 'ထူထပ်သော ပုံစာအုပ်ကို အတူဖတ်ရင်း ပုံများကို လက်ညှိုးထိုး အမည်ခေါ်ခြင်း။',
      value: 'စာမျက်နှာထူ ရုပ်ပုံစာအုပ်ကို အတူကြည့်ရင်း ပုံများကို လက်ညှိုးထိုး၍ အမည်ခေါ်ပေးခြင်း။',
    },
  ]),
  target('sn_selective_mutism', 'clinical_review', 3, 1786432330925, [
    {
      path: 'titleMm',
      before: 'ရွေးချယ် အသံတိတ်ခြင်း (Selective Mutism)',
      value: 'အခြေအနေအလိုက် စကားမပြောနိုင်ခြင်း (Selective Mutism)',
    },
    {
      path: 'data.possibleSigns.2.mm',
      before: 'အရေးကြီးသည် — သင့်ကလေးသည် အိမ်တွင် မိသားစုနှင့်ပါ အပါအဝင် မည်သည့်နေရာတွင်မှ စကား အလွန်နည်းပါက ၎င်းသည် ရွေးချယ် အသံတိတ်ခြင်း မဟုတ်ပါ။ ထိုအစား အကြားအာရုံ စစ်ဆေးမှုနှင့် စကားပြော/ဘာသာစကား စစ်ဆေးမှုကို တောင်းခံပါ။',
      value: 'အရေးကြီးသည် — သင့်ကလေးသည် အိမ်တွင် မိသားစုနှင့်ပါ အပါအဝင် မည်သည့်နေရာတွင်မှ စကား အလွန်နည်းပါက ၎င်းသည် အခြေအနေအလိုက် စကားမပြောနိုင်ခြင်း မဟုတ်ပါ။ ထိုအစား အကြားအာရုံ စစ်ဆေးမှုနှင့် စကားပြော/ဘာသာစကား စစ်ဆေးမှုကို တောင်းခံပါ။',
    },
    {
      path: 'data.professionalSupport.0.mm',
      before: 'ဆရာဝန်နှင့် တိုင်ပင်ပါ — စကားပြောနှင့် ဘာသာစကား ကုထုံး ဝန်ဆောင်မှု သို့မဟုတ် ကလေးစိတ်ပညာရှင်ထံ ညွှန်းပို့ပေးနိုင်ပါသည်။ နှစ်မျိုးလုံး ကူညီနိုင်ပါသည် — ရွေးချယ် အသံတိတ်ခြင်းကို စကားပြော လေ့ကျင့်ခန်းဖြင့် မဟုတ်ဘဲ စကားပြောခြင်းနှင့် ဆက်စပ်သော စိုးရိမ်စိတ်ကို လျှော့ချခြင်းဖြင့် ကုသပါသည်။',
      value: 'ဆရာဝန်နှင့် တိုင်ပင်ပါ — စကားပြောနှင့် ဘာသာစကား ကုထုံး ဝန်ဆောင်မှု သို့မဟုတ် ကလေးစိတ်ပညာရှင်ထံ ညွှန်းပို့ပေးနိုင်ပါသည်။ နှစ်မျိုးလုံး ကူညီနိုင်ပါသည် — အခြေအနေအလိုက် စကားမပြောနိုင်ခြင်းကို စကားပြော လေ့ကျင့်ခန်းဖြင့် မဟုတ်ဘဲ စကားပြောခြင်းနှင့် ဆက်စပ်သော စိုးရိမ်စိတ်ကို လျှော့ချခြင်းဖြင့် ကုသပါသည်။',
    },
  ]),
] as const;

/** SHA-256 of JSON.stringify(CLINICAL_REVIEW_COPY_TARGETS), pinned by test. */
export const CLINICAL_REVIEW_COPY_PAYLOAD_SHA256 =
  '207fff13bade9ebe036f23a300906e4083be389fa4721ca6abd516da928a7a19' as const;

export type ClinicalReviewCopyTarget =
  (typeof CLINICAL_REVIEW_COPY_TARGETS)[number];
