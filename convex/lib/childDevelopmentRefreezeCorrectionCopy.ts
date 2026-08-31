export type ChildDevelopmentRefreezeBilingualCopy = Readonly<{
  mm: string;
  en: string;
}>;

export const CDC_TODDLERS_1_2_SOURCE_ID =
  'cdc-positive-parenting-toddlers-2026' as const;

export const CDC_TODDLERS_2_3_SOURCE_ID =
  'cdc-positive-parenting-toddlers-2-3-2026' as const;

/**
 * Immutable, human-reviewed copy for the four semantic corrections requested
 * by the sequence-10 child-development review. Keeping the literals in one
 * pure module lets authored seed, exact CAS postimages, and regression tests
 * bind to the same wording without creating a second editable copy.
 */
export const CHILD_DEVELOPMENT_REFREEZE_COPY = {
  gd_10_12m_nutrition: {
    dailyActivity: {
      mm: 'တစ်နေ့တာအတွင်း ရရှိနိုင်မှုအလိုက် အစာအုပ်စုမတူသော အစားအစာမျိုးစုံကို ပေးကြည့်ပါ။ ကလေးစားသည့် ပမာဏနှင့် အမျိုးအစားသည် တစ်နေ့နှင့်တစ်နေ့ ကွာခြားနိုင်ပါသည်။',
      en: 'Across the day, offer a variety of foods from different food groups, based on what is available; the amount and variety eaten can vary from day to day.',
    },
    parentTip: {
      mm: 'မိဘက ဘာကို ဘယ်အချိန်ပေးမလဲ ဆုံးဖြတ်ပြီး၊ ကလေးက ဘယ်လောက်စားမလဲ ဆုံးဖြတ်ပါစေ။',
      en: 'You decide what is offered and when; she decides how much she eats.',
    },
  },
  gd_13_18m_safety: {
    why: {
      mm: 'တွားသွားခြင်း၊ မတ်တပ်ရပ်ရန် ဆွဲထခြင်း သို့မဟုတ် လမ်းလျှောက်စပြုခြင်း စသဖြင့် လှုပ်ရှားနိုင်မှု တိုးလာသည်နှင့်အမျှ လှေကား၊ ပရိဘောဂနှင့် ရေအန္တရာယ်များကို စောစောကတည်းက ကာကွယ်ပါ။',
      en: 'Childproof stairs, furniture, and water hazards early, as mobility increases—whether the child is crawling, pulling to stand, or beginning to walk.',
    },
  },
  gd_2y_safety: {
    why: {
      mm: 'ပြေးစပြုချိန်အပါအဝင် လှုပ်ရှားနိုင်မှုနှင့် အရှိန် တိုးလာသည်နှင့်အမျှ လမ်းမ၊ ရေကန်နှင့် မီးဖိုအန္တရာယ်များကို ကြိုတင်ကာကွယ်ပါ။',
      en: 'Plan ahead for traffic, water, and burn hazards as mobility and speed increase, including when running begins.',
    },
  },
  gd_2_5y_safety: {
    dailyActivity: {
      mm: 'လူကြီးက အနီးကပ်ကြီးကြပ်နေပြီး ယုံကြည်ရသော လူကြီး၏ အာရုံစိုက်မှုကို ရယူပုံ နမူနာပြကာ အတူလေ့ကျင့်ပါ။ အန္တရာယ်ကို ကလေးက ကိုယ်တိုင် ခွဲခြားသိရှိ၍ စီမံနိုင်မည်ဟု မမှီခိုပါနှင့်။',
      en: 'Stay close and model how to get a trusted adult’s attention, then practise together; do not rely on the child to identify or manage danger.',
    },
  },
} as const satisfies Record<string, Readonly<Record<string, ChildDevelopmentRefreezeBilingualCopy>>>;

export const CHILD_DEVELOPMENT_REFREEZE_SEMANTIC_SLUGS = [
  'gd_10_12m_nutrition',
  'gd_13_18m_safety',
  'gd_2y_safety',
  'gd_2_5y_safety',
] as const;

export const CHILD_DEVELOPMENT_REFREEZE_SOURCE_TRANSITION_SLUGS = [
  'gd_2y_safety',
  'gd_2_5y_safety',
] as const;
