import type { ReviewDimension } from './reviewPolicy';

export const EDUCATION_REVIEW_DIMENSIONS = [
  'english',
  'native_myanmar',
  'evidence',
  'safety',
] as const satisfies readonly ReviewDimension[];

export const FOCUSED_SPECIALIST_REVIEW_SLUGS = [
  'ms_birth_2m_emotional_1',
  'ms_birth_2m_nutrition_1',
  'ms_birth_2m_sleep_1',
  'ms_3_4m_sleep_1',
  'ms_5_6m_sleep_1',
  'gd_7_9m_safety',
  'gd_7_9m_emotional',
] as const;

const focusedSpecialistSlugs = new Set<string>(FOCUSED_SPECIALIST_REVIEW_SLUGS);

type ReviewableContent = {
  type?: string;
  slug: string;
  titleEn?: string;
  summaryEn?: string;
  data?: unknown;
  requiredReviewDimensions?: string[];
};

export type SpecialistReviewReason =
  | 'focused_emergency_wording'
  | 'explicit_clinical_requirement'
  | 'bed_sharing_wording'
  | 'risk_wording';

/** Specialist review is based on medical decision risk, not parent visibility. */
export function specialistReviewReason(item: ReviewableContent): SpecialistReviewReason | null {
  // These seven records are routed only for their emergency-decision wording.
  // Their ordinary developmental or parent-education claims are not thereby
  // represented as a personal endorsement.
  if (focusedSpecialistSlugs.has(item.slug)) return 'focused_emergency_wording';
  if (item.requiredReviewDimensions?.includes('clinical')) return 'explicit_clinical_requirement';

  // A preview-only printable is catalogue metadata, not the missing PDF
  // payload. Its English, Myanmar, evidence and safety wording still requires
  // review, but it cannot be clinically signed off as though the unavailable
  // document had been inspected. A future payload gets its own media approval
  // and an explicit clinical requirement when its full wording carries risk.
  const data = item.data && typeof item.data === 'object'
    ? item.data as Record<string, unknown>
    : null;
  if (item.type === 'printable' && data?.availability === 'preview_only') return null;

  const text = `${item.titleEn ?? ''} ${item.summaryEn ?? ''} ${JSON.stringify(item.data ?? {})}`
    .toLowerCase()
    .replace(/\bnon[- ]diagnostic\b/g, '')
    .replace(/\bnot (?:a )?diagnostic (?:checklist|screen|tool)\b/g, '')
    .replace(/\bnot intended to (?:diagnose|treat)(?:(?:,| and| or) (?:diagnose|treat))*\b/g, '')
    .replace(/\b(?:this (?:content|app|guide) )?does not (?:diagnose|treat)(?:(?:,| and| or) (?:diagnose|treat))*\b/g, '')
    .replace(/\bdoes not provide (?:a )?diagnosis (?:and|or) treatment\b/g, '')
    .replace(/\b(?:this (?:content|app|guide) )?does not diagnose\b/g, '')
    .replace(/\b(?:is |are )?not (?:a )?diagnosis\b/g, '')
    .replace(/\bwithout (?:a |any )?diagnosis\b/g, '')
    .replace(/\bno diagnosis\b/g, '')
    .replace(/\b(?:this (?:content|app|guide) )?is not medical advice\b/g, '');

  // Bed-sharing guidance differs materially between current authoritative
  // public sources (for example AAP and NHS). Any wording that tells a parent
  // whether or how to share a sleep surface therefore stays inside the focused
  // specialist boundary instead of receiving an ordinary education sign-off.
  const hasBedSharingWording = [
    /\bbed[- ]?shar(?:e|es|ed|ing)\b/,
    /\bshare (?:a |the )?(?:bed|sleep surface)\b/,
    /(?:အိပ်ရာတူ|အိပ်ရာမတူ|တစ်အိပ်ရာတည်း|အိပ်ရာ.{0,20}မျှဝေ)/,
  ].some((pattern) => pattern.test(text));
  if (hasBedSharingWording) return 'bed_sharing_wording';

  const hasRiskWording = [
    /\bdiagnos(?:e|es|ed|ing|is|tic|tics|tically)\b/,
    /\b(?:treat(?:s|ed|ing|ment|ments)?|prescrib(?:e|es|ed|ing)|administer(?:s|ed|ing)?)\b/,
    /\b(?:medication|medications|medicine|medicines|medicinal|drug|drugs)\b/,
    /\b(?:dose|doses|dosing|dosage|dosages)\b/,
    /\b(?:individuali[sz]ed|personali[sz]ed|individual) (?:advice|guidance|recommendation|treatment|care|plan)\b/,
    /\b(?:seek|get|obtain) (?:urgent|emergency|immediate)(?: medical)? (?:help|care|attention)\b/,
    /\b(?:seek|get|obtain) medical (?:help|care|attention) immediately\b/,
    /\bcall (?:an? |the |your |local )*(?:ambulance|emergency (?:number|services?))\b/,
    /\b(?:go|take (?:the )?child) to (?:a |the |your |the nearest )?(?:hospital|emergency (?:department|service)) (?:now|immediately)\b/,
    /(?:ရောဂါအမည်တပ်|ရောဂါရှာဖွေ|ရောဂါသတ်မှတ်)/,
    /(?:ကုသမှု|ကုသရန်|ကုသမည်|ကုသပေး)/,
    /(?:ဆေးဝါး|ဆေးပမာဏ|ဆေးတိုက်)/,
    /(?:တစ်ဦးချင်း|တစ်ယောက်ချင်း).{0,40}(?:အကြံပြု|ကုသ|စောင့်ရှောက်)/,
    /(?:အရေးပေါ်|ဆေးကုသမှု).{0,40}ချက်ချင်း|ချက်ချင်း.{0,40}(?:အရေးပေါ်|ဆေးကုသမှု)/,
  ].some((pattern) => pattern.test(text));
  return hasRiskWording ? 'risk_wording' : null;
}

export function requiresSpecialistReview(item: ReviewableContent): boolean {
  return specialistReviewReason(item) !== null;
}

export function requiredPublicationReviews(item: ReviewableContent): ReviewDimension[] {
  return requiresSpecialistReview(item)
    ? [...EDUCATION_REVIEW_DIMENSIONS, 'clinical']
    : [...EDUCATION_REVIEW_DIMENSIONS];
}
