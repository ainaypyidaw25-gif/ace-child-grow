export const REVIEW_CHECKLIST_KEYS = {
  english: [
    'meaning_matches_source', 'plain_language', 'concise', 'non_judgmental', 'age_clear',
  ],
  native_myanmar: [
    'spelling', 'grammar', 'natural_wording', 'parent_friendly', 'concise',
    'meaning_matches_source', 'glossary', 'non_judgmental', 'age_clear', 'safety_clear',
  ],
  development: [
    'age_appropriate', 'practical', 'realistic_materials', 'benefit_accurate',
    'normal_variation', 'no_guarantee', 'culturally_appropriate', 'clinical_flag_correct',
  ],
  evidence: [
    'evidence_sufficient', 'claim_mapping', 'source_current', 'age_applicable', 'scope_recorded',
  ],
  safety: [
    'no_unsafe_advice', 'warning_signs_clear', 'escalation_appropriate',
    'safe_sleep', 'feeding_choking', 'scope_recorded', 'rereview_date',
  ],
  clinical: [
    'evidence_sufficient', 'no_diagnosis', 'no_unsafe_medicine', 'no_unsupported_dosage',
    'no_delayed_care', 'warning_signs_clear', 'escalation_appropriate', 'safe_sleep',
    'feeding_choking', 'scope_recorded', 'rereview_date',
  ],
} as const;

export type ReviewChecklistDimension = keyof typeof REVIEW_CHECKLIST_KEYS;

export function requiredChecklistKeys(dimension: ReviewChecklistDimension): readonly string[] {
  return REVIEW_CHECKLIST_KEYS[dimension];
}
