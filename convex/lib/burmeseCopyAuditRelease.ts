/**
 * Narrow production release for code-reviewed Burmese copy corrections.
 *
 * These rows were already published when the canonical copy was corrected.
 * The ordinary seed importer intentionally protects published content, so the
 * release is bound to the exact production revision and updatedAt observed by
 * the read-only 2026-08-18 preflight. Any later editorial or review activity
 * makes the mutation fail before its first write.
 */
export const BURMESE_COPY_AUDIT_RELEASE_ID =
  '2026-08-18-burmese-copy-audit' as const;

export type BurmeseCopyAuditPatch = {
  path: 'titleMm' | 'summaryMm' | `data.${string}`;
  value: string;
};

function target(
  slug: string,
  expectedReviewRevision: number,
  expectedUpdatedAt: number,
  patches: readonly BurmeseCopyAuditPatch[],
) {
  return { slug, expectedReviewRevision, expectedUpdatedAt, patches } as const;
}

export const BURMESE_COPY_AUDIT_TARGETS = [
  target('act_sound_tracking', 1, 1786433535701, [
    { path: 'data.materials.mm', value: 'ပျော့ပျောင်းသော အသံမြည် ကစားစရာ သို့မဟုတ် ခေါင်းလောင်းလေး။' },
    { path: 'data.setup.mm', value: 'ကလေးကို ပက်လက်အနေအထားဖြင့်ထားပြီး ဘေးတစ်ဖက်မှ အသံတိုးတိုးလေး မြည်ပေးပါ။' },
  ]),
  target('ms_13_18m_language_1', 1, 1786433535701, [
    { path: 'data.observeMm', value: '“ဒါလေးပေးပါ” ဆိုလျှင် ကမ်းပေးပါသလား။' },
  ]),
  target('ms_13_18m_speech_1', 1, 1786433535701, [
    { path: 'data.observeMm', value: '“မေမေ”၊ “ဖေဖေ” အပြင် အခြား စကားလုံး ၂–၃ လုံး ပြောပါသလား။' },
  ]),
  target('ms_19_24m_emotional_1', 1, 1786433535701, [
    { path: 'data.observeMm', value: 'အခြားသူတစ်ဦး ငိုနေပါက စိတ်ဝင်စားဟန် သို့မဟုတ် စိုးရိမ်ဟန် ပြတတ်ပါသလား။' },
  ]),
  target('ms_19_24m_language_1', 2, 1786633149390, [
    { path: 'data.observeMm', value: '“ရေ သောက်မယ်”၊ “နို့ ထပ်” ကဲ့သို့ စကားလုံးနှစ်လုံး တွဲပြောပါသလား။' },
  ]),
  target('ms_2y_problem_solving_1', 1, 1786433535701, [
    { path: 'data.observeMm', value: 'ပုံသဏ္ဌာန်ရိုးရိုးများကို သက်ဆိုင်ရာနေရာတွင် နေရာတကျ ထည့်နိုင်ပါသလား။' },
  ]),
  target('ms_3_4m_communication_1', 2, 1786633169602, [
    { path: 'data.whyMm', value: 'ဤအသံငယ်များသည် စကားပြောတတ်လာစေရန် အစောပိုင်း အသံလေ့ကျင့်မှုများ ဖြစ်ပါသည်။' },
  ]),
  target('ms_3_4m_emotional_1', 1, 1786433535701, [
    { path: 'data.observeMm', value: 'မိဘ သို့မဟုတ် ရင်းနှီးသူများကို မြင်တွေ့ရပါက ပျော်ရွှင်ဟန် ပြပါသလား။' },
  ]),
  target('ms_3_4m_fine_motor_1', 1, 1786433535701, [
    { path: 'data.observeMm', value: 'လက်နှစ်ဖက်ကို ခန္ဓာကိုယ်အလယ်တည့်တည့်တွင် ဆုံပါသလား။' },
    { path: 'titleMm', value: 'လက်နှစ်ဖက်ကို အလယ်တွင် ဆုံခြင်း' },
  ]),
  target('ms_3_4m_gross_motor_1', 1, 1786433535701, [
    { path: 'data.whyMm', value: 'ခေါင်းကို တည်ငြိမ်စွာ ထိန်းနိုင်ခြင်းသည် နောင်တွင် ထိုင်တတ်လာစေရန် အခြေခံဖြစ်ပါသည်။' },
  ]),
  target('ms_3_5y_communication_1', 1, 1786433535701, [
    { path: 'data.observeMm', value: '“ဘာဖြစ်လို့လဲ”၊ “ဘယ်လိုလုပ်မလဲ” ကဲ့သို့ မေးခွန်းများ မေးပါသလား။' },
  ]),
  target('ms_3_5y_fine_motor_1', 1, 1786433535701, [
    { path: 'data.observeMm', value: 'စက်ဝိုင်း သို့မဟုတ် မျဉ်းဖြောင့်ကို ကြည့်၍ ကူးဆွဲနိုင်ပါသလား။' },
  ]),
  target('ms_3_5y_school_readiness_1', 2, 1786633174762, [
    { path: 'data.observeMm', value: 'အလှည့်စောင့်ခြင်းကဲ့သို့ ရိုးရှင်းသော အုပ်စုစည်းကမ်းများကို လိုက်နာပါသလား။' },
  ]),
  target('ms_3y_school_readiness_1', 1, 1786433535701, [
    { path: 'data.observeMm', value: 'မိဘ သို့မဟုတ် ပြုစုစောင့်ရှောက်သူနှင့် ခေတ္တခွဲနေရသည့်အခါ အဆင်ပြေစွာ နေနိုင်ပါသလား။' },
  ]),
  target('ms_3y_social_1', 2, 1786633177624, [
    { path: 'data.observeMm', value: 'အခြားကလေးများနှင့်အတူ ကစားရန်နှင့် ဝေမျှရန် ကြိုးစားပါသလား။' },
  ]),
  target('ms_4_5y_cognitive_1', 1, 1786433535701, [
    { path: 'data.observeMm', value: 'ပစ္စည်းများကို အရောင် သို့မဟုတ် ပုံသဏ္ဌာန်အလိုက် ခွဲခြားနိုင်ပါသလား။' },
  ]),
  target('ms_4_5y_fine_motor_1', 1, 1786433535701, [
    { path: 'data.observeMm', value: 'ဘေးကင်းသော ကလေးကတ်ကြေးဖြင့် စက္ကူကို မျဉ်းအတိုင်း ဖြတ်နိုင်ပါသလား။' },
  ]),
  target('ms_4y_language_1', 1, 1786433535701, [
    { path: 'data.observeMm', value: 'ဖြစ်ပျက်ခဲ့သော အကြောင်းအရာကို အစီအစဉ်တကျ ပြန်ပြောပြနိုင်ပါသလား။' },
  ]),
  target('ms_4y_problem_solving_1', 2, 1786633193921, [
    { path: 'data.observeMm', value: 'လက်လှမ်းမမီသော ပစ္စည်းကို ယူရန် ခုံတစ်ခုခုယူသုံးခြင်းကဲ့သို့ နည်းလမ်းရှာပါသလား။' },
  ]),
  target('ms_5y_gross_motor_1', 1, 1786433535701, [
    { path: 'data.observeMm', value: 'ခုန်ဆွခုန်ဆွ သွားနိုင်ပြီး ဟန်ချက်ညီစွာ လှုပ်ရှားနိုင်ပါသလား။' },
  ]),
  target('ms_5y_language_1', 2, 1786633200510, [
    { path: 'data.observeMm', value: 'မရင်းနှီးသူများ နားလည်နိုင်လောက်အောင် ဝါကျ အပြည့်အစုံဖြင့် ရှင်းလင်းစွာ ပြောနိုင်ပါသလား။' },
  ]),
  target('ms_5y_self_help_1', 1, 1786433535701, [
    { path: 'data.observeMm', value: 'အိမ်သာကို ကိုယ်တိုင်သုံးပြီး လက်ကိုလည်း ကိုယ်တိုင် ဆေးကြောနိုင်ပါသလား။' },
    { path: 'data.whyMm', value: 'ဤသည်မှာ တစ်ကိုယ်ရေ သန့်ရှင်းရေးနှင့် ကျောင်းနေအရွယ်အတွက် အရေးကြီးသော အလေ့အထ ဖြစ်ပါသည်။' },
    { path: 'titleMm', value: 'အိမ်သာသုံးခြင်းနှင့် လက်ဆေးခြင်းကို ကိုယ်တိုင်လုပ်ခြင်း' },
  ]),
  target('ms_7_9m_fine_motor_1', 1, 1786433535701, [
    { path: 'data.observeMm', value: 'ကစားစရာကို လက်တစ်ဖက်မှ အခြားလက်တစ်ဖက်သို့ ပြောင်းကိုင်ပါသလား။' },
    { path: 'data.whyMm', value: 'လက်တစ်ဖက်မှ အခြားလက်တစ်ဖက်သို့ ပြောင်းကိုင်နိုင်ခြင်းသည် လက်လှုပ်ရှားမှု ပိုမိုတိကျလာစေရန် လေ့ကျင့်ပေးပါသည်။' },
    { path: 'titleMm', value: 'ပစ္စည်းကို လက်တစ်ဖက်မှ အခြားလက်တစ်ဖက်သို့ ပြောင်းကိုင်ခြင်း' },
  ]),
  target('ms_7_9m_social_1', 2, 1786633222763, [
    { path: 'data.observeMm', value: 'မိသားစုဝင်များနှင့် မရင်းနှီးသူများကို ကွဲပြားစွာ တုံ့ပြန်တတ်ပါသလား။' },
  ]),
  target('st_first_day_school', 1, 1786433535701, [
    { path: 'summaryMm', value: 'ကျောင်းစတက်သည့် ပထမဆုံးနေ့ စိုးရိမ်ပူပန်မှုကို နွေးထွေးစွာ ဖြေလျှော့ပေးသည့် ပုံပြင်လေး။' },
    { path: 'titleMm', value: 'ကျောင်းစတက်သည့် ပထမဆုံးနေ့' },
  ]),
] as const;

/** SHA-256 of JSON.stringify(BURMESE_COPY_AUDIT_TARGETS), pinned by a Node-side test. */
export const BURMESE_COPY_AUDIT_PAYLOAD_SHA256 =
  'ea7c3e13540f5a537fe3f7c8682d2d1d0acc6bb042b39fbae0effea839855cbc' as const;

/**
 * Safe-sleep wording is deliberately excluded from this language-only release.
 * It remains at its current published revision until specialist review.
 */
export const BURMESE_COPY_AUDIT_HELD_SLUGS = [
  'ms_birth_2m_sleep_1',
] as const;

/**
 * This story's seed moved on in the later exact-state AI educational-preview
 * release. The historical language release remains bound to its immutable
 * production preimage and payload, but must not mistake the later authored
 * wording for corruption of that old release.
 */
export const BURMESE_COPY_AUDIT_SUPERSEDED_SLUGS = [
  'ms_4y_problem_solving_1',
  'st_first_day_school',
] as const;

export type BurmeseCopyAuditTarget = (typeof BURMESE_COPY_AUDIT_TARGETS)[number];
