export const MANUAL_REVIEW_CONTENT_CAS_RELEASE_ID =
  '2026-08-22-manual-review-content-corrections-v1' as const;

export type ManualReviewContentPatch = {
  field: 'body' | 'commonMistakes' | 'safety';
  value: unknown;
};

export type ManualReviewContentTarget = {
  type: 'guide' | 'lesson';
  slug: string;
  contentId: string;
  contentCreationTime: number;
  initialCanonicalSha256: string;
  initialReviewRevision: number;
  desiredReviewRevision: number;
  initialUpdatedAt: number;
  patches: readonly ManualReviewContentPatch[];
};

const UNDER_FOUR_CHOKING_SAFETY = {
  mm: 'အစာတစ်ဆို့ခြင်း အန္တရာယ်သည် အသက် ၄ နှစ်အောက်အထိ ဆက်ရှိနိုင်ပါသည်။ စပျစ်သီးနှင့် ချယ်ရီခရမ်းချဉ်သီးများကို အလျားလိုက် လေးစိတ်ခွဲပါ။ ဝက်အူချောင်းကို အလျားလိုက်ခွဲပြီး အပိုင်းငယ်များ ဖြတ်ပါ။ အခွံမာသီးအလုံးလိုက်၊ ပြောင်းဖူးပေါက်ပေါက်၊ မာကျောသော သကြားလုံး၊ အစေ့အဆန်နှင့် မုန်လာဥနီအစိမ်းတုံးများ မပေးပါနှင့်။ ကလေးကို မတ်မတ်ထိုင်၍ စားစေပြီး လမ်းလျှောက်ရင်း၊ ပြေးရင်း သို့မဟုတ် ရွေ့လျားနေသောကားထဲတွင် မစားပါစေနှင့်။ စားနေစဉ် လူကြီးက အနီးတွင် အမြဲရှိပါ။',
  en: 'Choking remains a risk for children under 4. Quarter grapes and cherry tomatoes lengthways. Split sausages lengthways, then cut them into small pieces. Do not offer whole nuts, popcorn, hard sweets, seeds, or chunks of raw carrot. Have the child sit upright to eat; do not let them eat while walking, running, or riding in a moving vehicle. An adult should always stay nearby while the child eats.',
} as const;

const TEN_TO_TWELVE_MONTH_SLEEP_COMMON_MISTAKES = [
  {
    mm: 'အိပ်ရာထဲတွင် ခေါင်းအုံးနှင့် ကစားစရာ ပျော့များ ထားခြင်း။',
    en: 'Leaving pillows and soft toys in the sleep space.',
  },
  {
    mm: 'အလေးချိန်ပါသော စောင်၊ အိပ်ဝတ်စုံ သို့မဟုတ် ပတ်ရစ်ပိတ်စများ သုံးခြင်း။',
    en: 'Using weighted blankets, weighted sleepers, or weighted swaddles.',
  },
  {
    mm: 'အိမ်သုံး အသက်ရှူ/နှလုံးခုန် စောင့်ကြည့်စက်ကို ဘေးကင်းသော အိပ်စက်ရာနေရာ၏ အစား အားကိုးခြင်း — ဤစက်များသည် SIDS အန္တရာယ်ကို လျော့ချပေးကြောင်း သက်သေမရှိပါ။',
    en: 'Relying on a home breathing or heart-rate monitor instead of a safe sleep space — these monitors have not been shown to reduce SIDS risk.',
  },
  {
    mm: 'ညဘက် နိုးတိုင်း တူညီသောနည်းဖြင့် အလိုအလျောက် တုံ့ပြန်ခြင်း — ဆာလောင်မှု၊ မသက်မသာဖြစ်မှုနှင့် နှစ်သိမ့်မှုလိုအပ်ချက်ကို စစ်ဆေးပြီး ကလေး၏ အချက်ပြမှုအတိုင်း တုံ့ပြန်ပါ။',
    en: 'Responding automatically in the same way at every waking — check for hunger, discomfort, or a need for reassurance, and respond to your baby’s cues.',
  },
] as const;

const TEN_TO_TWELVE_MONTH_SLEEP_SAFETY = {
  mm: 'ကလေးအား အိပ်ရာဝင်တိုင်း ပက်လက် (ကျောပေး) အနေအထားဖြင့် အိပ်စေပါ — ၁ နှစ်ပြည့်သည်အထိ ဤအချက်သည် အရေးကြီးဆုံး လုံခြုံရေး အချက် ဖြစ်သည်။ ကလေးသည် ပက်လက်မှ မှောက်နှင့် မှောက်မှ ပက်လက် ဘက်နှစ်ဖက်စလုံး ကိုယ်တိုင် လှိမ့်နိုင်ပြီဆိုလျှင် ပြန်လှည့်ပေးရန် မလိုပါ။ အိပ်ရာသည် ခိုင်ခံ့၍ ညီညာရမည်။ အိပ်ရာထဲတွင် ခေါင်းအုံး၊ ပျော့ပျောင်းသော အရုပ်၊ လွတ်နေသော စောင်၊ အိပ်ရာခင်း၊ အဝတ် သို့မဟုတ် ကြိုး မထားပါနှင့်။ ကလေးအား အခန်းတူတွင် သီးခြား အိပ်ရာဖြင့် အိပ်စေခြင်းသည် အကြံပြုထားသော နည်းလမ်း ဖြစ်သည်။ မိဘသည် ဆေးလိပ်သောက်ခြင်း၊ အရက် သို့မဟုတ် အိပ်ဆေး သောက်ထားခြင်း၊ အလွန် ပင်ပန်းနေခြင်း ရှိလျှင် အိပ်ရာ တူတူ မမျှဝေပါနှင့် — ဆိုဖာ သို့မဟုတ် အာမ်ချဲယားတွင် ကလေးနှင့် အတူ လုံးဝ မအိပ်ပါနှင့်၊ ၎င်းသည် အလွန် အန္တရာယ်များသည်။ ကလေးကို သင့်တော်သော အိပ်ဝတ်အလွှာဖြင့် ဝတ်ပေးပြီး အလွန်ပူမနေစေပါနှင့်။ အိပ်ရာထဲတွင် လွတ်နေသော စောင် မထားပါနှင့်။ အိမ်ကို ဆေးလိပ်ငွေ့ကင်းစင်စွာ ထားပါ။ နေ့အိပ်ချိန်နှင့် ညအိပ်ချိန်တွင် နို့သီးခေါင်းကို ပေးကြည့်နိုင်ပါသည်။ မိခင်နို့တိုက်နေပါက နို့တိုက်ခြင်း အသားကျပြီးမှ ပေးပါ။ အိပ်ပျော်ပြီး နို့သီးခေါင်း ကျွတ်သွားလျှင် ပြန်ထည့်ပေးရန် မလိုပါ။',
  en: 'Place her on her back for every sleep — this remains the single most important safety point up to one year. Once she can roll both ways on her own, you do not need to keep turning her back. The sleep surface should be firm and flat. Keep pillows, soft toys, loose blankets, bedding, cloths, and cords out of the sleep space. Room-sharing with her on her own separate sleep surface is the recommended arrangement. Do not share a bed if anyone smokes, has drunk alcohol or taken sedating medicine, or is very tired — and never sleep with her on a sofa or armchair, which is especially dangerous. Dress her in suitable sleep clothing and avoid overheating; do not use a loose blanket in the sleep space. Keep the home smoke-free. You can offer a pacifier at nap time and bedtime. If you are breastfeeding, wait until feeding is well established. If the pacifier falls out after she falls asleep, it does not need to be put back.',
} as const;

const HEALTHY_SLEEP_BODY = {
  mm: 'နေ့စဉ် အိပ်ရာဝင်ချိန်ကို တတ်နိုင်သမျှ တူညီအောင်ထားပြီး ရေချိုးခြင်း၊ စာဖတ်ခြင်း၊ အိပ်ရာဝင်ခြင်းတို့ကို အစဉ်လိုက် ငြိမ်သက်စွာ လုပ်ပေးခြင်းက အိပ်စက်မှုကို ကူညီနိုင်သည်။ အိပ်ရာမဝင်မီ မျက်နှာပြင်ကြည့်ခြင်းကို ရှောင်ပြီး အလင်းရောင်လျှော့ကာ စာဖတ်ခြင်း သို့မဟုတ် သီချင်းဆိုခြင်းကဲ့သို့ ငြိမ်သက်သော လုပ်ဆောင်ချက်ကို ရွေးပါ။ အသက် ၁ နှစ်မပြည့်သေးသော ကလေးကို နေ့အိပ်ချိန်နှင့် ညအိပ်ချိန်တိုင်း ကျောပေါ်လှန်၍ မစောင်းသော မာကျောညီညာသည့် အိပ်ရာမျက်နှာပြင်ပေါ်တွင် အိပ်စေပါ။ တင်းကျပ်စွာ ခင်းထားသော အိပ်ရာခင်းမှလွဲ၍ ကလေးအိပ်ရာထဲတွင် ခေါင်းအုံး၊ စောင်၊ ဘေးကာ၊ အရုပ်ပျော့ သို့မဟုတ် အဝတ်ပျော့များ မထားပါနှင့်။ အနည်းဆုံး ပထမ ၆ လအထိ မိဘများအိပ်သည့် အခန်းထဲရှိ ကလေး၏ သီးခြားအိပ်ရာတွင် အိပ်စေပါ။ အခန်းကို မှောင်မှောင်၊ တိတ်တိတ်နှင့် သက်သောင့်သက်သာ အေးမြအောင် ထားပါ။',
  en: 'Consistent bedtimes and a calm routine (bath–book–bed) may help sleep. Before bed, avoid screens, dim the lights, and choose a quiet activity such as reading or singing. For every nap and overnight sleep until age 1, place the baby on their back on a firm, flat, non-inclined sleep surface. Keep only a fitted sheet in the sleep space—no pillow, blanket, bumper, soft toy, or loose cloth. For at least the first 6 months, keep the baby’s own separate sleep space in the parents’ room. Keep the room dark, quiet, and comfortably cool.',
} as const;

export const MANUAL_REVIEW_CONTENT_TARGETS: readonly ManualReviewContentTarget[] = [
  {
    type: 'guide',
    slug: 'gd_10_12m_sleep',
    contentId: 'kx72yexa4xz33enwttb5ej2ek98b8h41',
    contentCreationTime: 1_785_024_282_947.2703,
    initialCanonicalSha256: '900c98ae78a8f2aa2c8b33d4f62be5f409a28b4f3cc146cd1567a62d44d645cf',
    initialReviewRevision: 4,
    desiredReviewRevision: 5,
    initialUpdatedAt: 1_786_432_330_925,
    patches: [
      { field: 'commonMistakes', value: TEN_TO_TWELVE_MONTH_SLEEP_COMMON_MISTAKES },
      { field: 'safety', value: TEN_TO_TWELVE_MONTH_SLEEP_SAFETY },
    ],
  },
  {
    type: 'guide',
    slug: 'gd_13_18m_nutrition',
    contentId: 'kx71q9gjsxzqfzh2sj5ga94ahx8bch4y',
    contentCreationTime: 1_785_237_828_583.4656,
    initialCanonicalSha256: 'bbf46d3ad8202f72f79a640a3895cd45d72bca687c6afb6dee1fda635c84de06',
    initialReviewRevision: 8,
    desiredReviewRevision: 9,
    initialUpdatedAt: 1_786_432_330_925,
    patches: [{ field: 'safety', value: UNDER_FOUR_CHOKING_SAFETY }],
  },
  {
    type: 'guide',
    slug: 'gd_19_24m_nutrition',
    contentId: 'kx79aa6q8xem3vsxprh2f2eyz58bdxzh',
    contentCreationTime: 1_785_237_828_583.4702,
    initialCanonicalSha256: 'b26f03ef3ea8306aa87f7bd0d4e89518ea70574b2618f07f2cf2fb128b88e444',
    initialReviewRevision: 8,
    desiredReviewRevision: 9,
    initialUpdatedAt: 1_786_432_330_925,
    patches: [{ field: 'safety', value: UNDER_FOUR_CHOKING_SAFETY }],
  },
  {
    type: 'guide',
    slug: 'gd_2_5y_nutrition',
    contentId: 'kx7ek06127bwcshjt4dweqt1cn8bc6vy',
    contentCreationTime: 1_785_237_828_583.4797,
    initialCanonicalSha256: 'e1537db414f2555a3da32f308d1289746cf186ff0bf141272becbdc7fdee11bf',
    initialReviewRevision: 8,
    desiredReviewRevision: 9,
    initialUpdatedAt: 1_786_432_330_925,
    patches: [{ field: 'safety', value: UNDER_FOUR_CHOKING_SAFETY }],
  },
  {
    type: 'guide',
    slug: 'gd_2y_nutrition',
    contentId: 'kx73r4rgvkq6sgby5897fd0gcx8bd9fg',
    contentCreationTime: 1_785_237_828_583.4749,
    initialCanonicalSha256: 'f12e8807c13d7fa16ec882a1d4ce549d74d0f7230052c1c1ca67f186ea990fff',
    initialReviewRevision: 8,
    desiredReviewRevision: 9,
    initialUpdatedAt: 1_786_432_330_925,
    patches: [{ field: 'safety', value: UNDER_FOUR_CHOKING_SAFETY }],
  },
  {
    type: 'guide',
    slug: 'gd_3_5y_nutrition',
    contentId: 'kx75c0xt2a5m13vsw59cp07fgd8bcpxx',
    contentCreationTime: 1_785_237_828_583.4895,
    initialCanonicalSha256: 'e96f6bd97f8a0205ac437dd5ccc08a030ad91501aca8c725c89bf0a6e9681e89',
    initialReviewRevision: 8,
    desiredReviewRevision: 9,
    initialUpdatedAt: 1_786_432_330_925,
    patches: [{ field: 'safety', value: UNDER_FOUR_CHOKING_SAFETY }],
  },
  {
    type: 'guide',
    slug: 'gd_3y_nutrition',
    contentId: 'kx73araes924rdsb1s6xqym9zn8bcjfy',
    contentCreationTime: 1_785_237_828_583.4846,
    initialCanonicalSha256: '9ebf3195b8b39d81d77398f21eae4dba73369401de532fdfd8e02417fb8d4012',
    initialReviewRevision: 8,
    desiredReviewRevision: 9,
    initialUpdatedAt: 1_786_432_330_925,
    patches: [{ field: 'safety', value: UNDER_FOUR_CHOKING_SAFETY }],
  },
  {
    type: 'lesson',
    slug: 'lsn_healthy_sleep',
    contentId: 'kx75sscqacc0gb11b08qsybqn98b9243',
    contentCreationTime: 1_785_024_282_947.2004,
    initialCanonicalSha256: 'e190cbb4a7547cfcbfb9f520bd4bb9994bfe69041823e8f025b2a60c52826e3d',
    initialReviewRevision: 3,
    desiredReviewRevision: 4,
    initialUpdatedAt: 1_786_432_330_925,
    patches: [{ field: 'body', value: HEALTHY_SLEEP_BODY }],
  },
] as const;

const slugs = MANUAL_REVIEW_CONTENT_TARGETS.map((target) => target.slug);
const ids = MANUAL_REVIEW_CONTENT_TARGETS.map((target) => target.contentId);
const guardedSlugs = new Set(slugs);
if (MANUAL_REVIEW_CONTENT_TARGETS.length !== 8
  || new Set(slugs).size !== slugs.length
  || new Set(ids).size !== ids.length
  || MANUAL_REVIEW_CONTENT_TARGETS.some((target) => (
    target.desiredReviewRevision !== target.initialReviewRevision + 1
    || target.patches.length === 0
    || new Set(target.patches.map((patch) => patch.field)).size !== target.patches.length
  ))) {
  throw new Error('Manual-review content CAS constants are invalid');
}

/** Prevents broad seed paths from overwriting the exact audited postimages. */
export function isManualReviewContentCasTargetSlug(slug: string): boolean {
  return guardedSlugs.has(slug);
}
