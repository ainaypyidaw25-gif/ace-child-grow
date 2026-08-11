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
  slug: string;
  titleEn?: string;
  summaryEn?: string;
  data?: unknown;
  requiredReviewDimensions?: string[];
};

/** Specialist review is based on medical decision risk, not parent visibility. */
export function requiresSpecialistReview(item: ReviewableContent): boolean {
  if (focusedSpecialistSlugs.has(item.slug)) return true;
  if (item.requiredReviewDimensions?.includes('clinical')) return true;

  const text = `${item.titleEn ?? ''} ${item.summaryEn ?? ''} ${JSON.stringify(item.data ?? {})}`
    .toLowerCase()
    .replace(/\b(?:this (?:content|app|guide) )?does not diagnose\b/g, '')
    .replace(/\b(?:is |are )?not (?:a )?diagnosis\b/g, '')
    .replace(/\bwithout (?:a |any )?diagnosis\b/g, '')
    .replace(/\bno diagnosis\b/g, '')
    .replace(/\b(?:this (?:content|app|guide) )?is not medical advice\b/g, '');

  return [
    /\bdiagnos(?:e|es|is|tic)\b/,
    /\b(?:treat|prescribe|administer)\b/,
    /\b(?:dose|dosage)\b/,
    /\bindividuali[sz]ed (?:advice|treatment|care)\b/,
    /\b(?:seek|get) (?:emergency|medical) help immediately\b/,
    /\b(?:go|take (?:the )?child) to (?:a |the )?hospital immediately\b/,
  ].some((pattern) => pattern.test(text));
}

export function requiredPublicationReviews(item: ReviewableContent): ReviewDimension[] {
  return requiresSpecialistReview(item)
    ? [...EDUCATION_REVIEW_DIMENSIONS, 'clinical']
    : [...EDUCATION_REVIEW_DIMENSIONS];
}
