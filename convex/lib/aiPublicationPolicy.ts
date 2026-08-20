import { evidenceDateValidationProblem, evidenceIsExpired, isStrictIsoDate } from './evidenceFreshness';

export const AI_PUBLICATION_STATUS = 'clinical_review' as const;
export const AI_PUBLICATION_CONFIG_KEY = 'global' as const;
export const AI_PUBLICATION_POLICY_VERSION = 'ai-educational-preview-v1' as const;
export const AI_PUBLICATION_MAX_ACTIVE_RELEASES = 3;
export const AI_PUBLICATION_MAX_SOURCES_PER_RELEASE = 20;
export const AI_PUBLICATION_MAX_AUDIT_AGE_DAYS = 7;
export const AI_PUBLICATION_MAX_RELEASE_DAYS = 90;

export const AI_PUBLICATION_TARGETS = [
  { type: 'lesson', slug: 'lsn_early_math' },
  { type: 'story', slug: 'st_waiting_at_clinic' },
  { type: 'story', slug: 'st_first_day_school' },
] as const;

export type AiPublicationTarget = (typeof AI_PUBLICATION_TARGETS)[number];

const targetKeys = new Set<string>(
  AI_PUBLICATION_TARGETS.map((target) => aiPublicationTargetKey(target.type, target.slug)),
);

export function aiPublicationTargetKey(type: string, slug: string): string {
  return `${type}\u0000${slug}`;
}

export function isAiPublicationTarget(type: string, slug: string): boolean {
  return targetKeys.has(aiPublicationTargetKey(type, slug));
}

/** The environment master switch is deliberately default-off. */
export function aiPublicationMasterEnabled(): boolean {
  return process.env.AI_PUBLICATION_ENABLED === 'true';
}

export function arraysEqual(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function isSha256Hex(value: string): boolean {
  return /^[a-f0-9]{64}$/.test(value);
}

export function aiAuditIsCurrent(
  auditedAt: number,
  nextAuditDate: string,
  todayIso: string,
  now: number,
): boolean {
  if (!Number.isFinite(auditedAt) || auditedAt > now) return false;
  if (!isStrictIsoDate(nextAuditDate) || nextAuditDate < todayIso) return false;
  const expiry = new Date(`${nextAuditDate}T23:59:59.999Z`).getTime();
  return expiry >= auditedAt
    && expiry - auditedAt <= AI_PUBLICATION_MAX_RELEASE_DAYS * 86_400_000;
}

/** A pass must be recent when a release is enabled, but remains valid until its bounded expiry. */
export function aiAuditFreshForActivation(auditedAt: number, now: number): boolean {
  return Number.isFinite(auditedAt)
    && auditedAt <= now
    && now - auditedAt <= AI_PUBLICATION_MAX_AUDIT_AGE_DAYS * 86_400_000;
}

export type AiEvidenceSourceFields = {
  sourceId: string;
  reviewStatus: string;
  evidenceLevel: string;
  year: number | null;
  verifiedOn: string | null;
  nextReviewDate: string | null;
  url: string;
};

/**
 * AI citation eligibility is not human approval. It only asserts that the
 * exact publisher metadata and claim scope were independently audited for the
 * disclosed educational preview lane.
 */
export function sourceMayEnterAiPublication(
  source: AiEvidenceSourceFields,
  todayIso: string,
): boolean {
  if (!['awaiting_review', 'in_review', 'approved'].includes(source.reviewStatus)) return false;
  if (!Number.isInteger(source.year)) return false;
  if (!source.verifiedOn) return false;
  if (evidenceDateValidationProblem({
    verifiedOn: source.verifiedOn,
    reviewDate: null,
    nextReviewDate: source.nextReviewDate,
  }, todayIso)) return false;
  if (evidenceIsExpired({
    evidenceLevel: source.evidenceLevel,
    year: source.year,
    reviewDate: null,
    nextReviewDate: source.nextReviewDate,
    verifiedOn: source.verifiedOn,
  }, todayIso)) return false;
  try {
    return new URL(source.url).protocol === 'https:';
  } catch {
    return false;
  }
}

export const AI_DISCLOSURE_MM =
  'ဤအကြောင်းအရာကို AI ဖြင့် စစ်ဆေးထားပြီး ဆေးဘက်ပညာရှင် သို့မဟုတ် မိခင်ဘာသာစကား မြန်မာစာတည်းဖြတ်သူက အတည်ပြုထားခြင်း မရှိပါ။ အထွေထွေပညာပေးအတွက်သာ ဖြစ်ပြီး ဆေးဘက်ဆိုင်ရာ အကြံပြုချက်၊ ဖွံ့ဖြိုးမှုစစ်ဆေးချက် သို့မဟုတ် ရောဂါဖော်ထုတ်ချက် မဟုတ်ပါ။' as const;

export const AI_DISCLOSURE_EN =
  'This content was reviewed by AI and has not been approved by a clinician or native Myanmar-language editor. It is for general education only and is not medical advice, developmental screening, or diagnosis.' as const;

export const AI_STORY_DISCLOSURE_MM =
  'ဤပုံပြင်သည် စိတ်ကူးယဉ်ဇာတ်လမ်းဖြစ်ပြီး ကလေးတိုင်း အလားတူ ခံစားမည် သို့မဟုတ် တုံ့ပြန်မည်ဟု မဆိုလိုပါ။' as const;

export const AI_STORY_DISCLOSURE_EN =
  'This is a fictional story and does not imply that every child will feel or respond in the same way.' as const;
