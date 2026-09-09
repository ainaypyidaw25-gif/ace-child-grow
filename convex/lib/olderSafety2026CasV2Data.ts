import {
  AAP_DROWNING_2021_DESIRED_REVERSE_KEYS,
  AAP_DROWNING_2021_INITIAL_REVERSE_KEYS,
  AAP_DROWNING_2021_SOURCE_ID,
  AAP_DROWNING_2026_SOURCE_ID,
  BRIGHT_FUTURES_SOURCE_ID,
  CDC_PRESCHOOL_SOURCE_ID,
  CDC_TODDLER_SOURCE_ID,
  CPSC_CHILDPROOFING_SOURCE_ID,
  GD_19_24M_SAFETY_INITIAL_COPY,
  OLDER_SAFETY_2026_RELEASE_ID,
  OLDER_SAFETY_2026_STAGED_SOURCES,
  OLDER_SAFETY_2026_TARGETS,
  OLDER_SAFETY_EXISTING_SOURCE_PREIMAGES,
  OLDER_SAFETY_REQUIRED_REVIEW_DIMENSIONS,
  isOlderSafety2026ContentTargetSlug,
  isOlderSafety2026LinkTarget,
  isOlderSafety2026SourceTarget,
  type OlderSafetyStagedSource,
  type OlderSafetyTarget,
} from './olderSafety2026CasData';

/**
 * Corrected successor to the blocked v1 release. The v1 constants remain
 * frozen for audit reconstruction; only this literal release is authoritative.
 */
export const OLDER_SAFETY_2026_V2_RELEASE_ID =
  '2026-08-24-older-safety-current-evidence-v2' as const;

export const OLDER_SAFETY_2026_V1_RELEASE_ID = OLDER_SAFETY_2026_RELEASE_ID;

/**
 * The only semantic change from v1 is removal of the unsupported instruction
 * to move climbable furniture away. CPSC still directly supports the retained
 * four-inch window limit, operable fire-escape window, furniture anchoring,
 * and locked medicine/cleaner controls described elsewhere in the guide.
 */
export const GD_19_24M_SAFETY_V2_DESIRED_COPY = {
  mm: 'ပြတင်းပေါက်တွင် အကာအရံ သို့မဟုတ် အဖွင့်ကန့်သတ်ကိရိယာ တပ်၍ ၄ လက်မထက် ပိုမဖွင့်နိုင်အောင် ထားပါ။ မီးဘေးဖြစ်ပါက ထွက်ပြေးနိုင်ရန် အခန်းတိုင်းတွင် အနည်းဆုံး ပြတင်းပေါက်တစ်ပေါက်ကို လွယ်ကူစွာ ဖွင့်နိုင်အောင် ထားပါ။ ဆေးဝါးနှင့် သန့်ရှင်းရေးပစ္စည်းများကို ကလေးမမီသော နေရာတွင် သော့ခတ်သိမ်းပါ။',
  en: 'Fit operable window guards or stops so windows open no more than four inches; keep at least one window in each room easy to open for fire escape. Lock medicines and cleaning products out of reach.',
  evidenceSummary:
    'The 2023 CPSC childproofing guide directly supports window guards/opening limits, preserving one operable fire-escape window per room, furniture anchoring and locked medicines/cleaners. Current AAP and age-matched CDC guidance support layered water, traffic and supervision precautions.',
} as const;

export {
  AAP_DROWNING_2021_DESIRED_REVERSE_KEYS,
  AAP_DROWNING_2021_INITIAL_REVERSE_KEYS,
  AAP_DROWNING_2021_SOURCE_ID,
  AAP_DROWNING_2026_SOURCE_ID,
  BRIGHT_FUTURES_SOURCE_ID,
  CDC_PRESCHOOL_SOURCE_ID,
  CDC_TODDLER_SOURCE_ID,
  CPSC_CHILDPROOFING_SOURCE_ID,
  GD_19_24M_SAFETY_INITIAL_COPY,
  OLDER_SAFETY_2026_STAGED_SOURCES,
  OLDER_SAFETY_2026_TARGETS,
  OLDER_SAFETY_EXISTING_SOURCE_PREIMAGES,
  OLDER_SAFETY_REQUIRED_REVIEW_DIMENSIONS,
  isOlderSafety2026ContentTargetSlug,
  isOlderSafety2026LinkTarget,
  isOlderSafety2026SourceTarget,
};

export type { OlderSafetyStagedSource, OlderSafetyTarget };

if (OLDER_SAFETY_2026_V2_RELEASE_ID === (OLDER_SAFETY_2026_V1_RELEASE_ID as string)
  || OLDER_SAFETY_2026_TARGETS.length !== 9
  || AAP_DROWNING_2021_INITIAL_REVERSE_KEYS.length !== 33
  || AAP_DROWNING_2021_DESIRED_REVERSE_KEYS.length !== 24
  || GD_19_24M_SAFETY_V2_DESIRED_COPY.en.includes('Move climbable furniture away')
  || GD_19_24M_SAFETY_V2_DESIRED_COPY.mm.includes('တက်နိုင်သော ပရိဘောဂများကို ဝေးရာရွှေ့')) {
  throw new Error('Older-safety 2026 v2 CAS constants are invalid');
}
