import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { useLocale } from '../app/LocaleContext';
import { downloadReviewerCompletionCsv } from '../domain/reviews/reviewExports';
import { ReviewerPaymentPanel } from './ReviewerPaymentPanel';

const DIMENSIONS = ['english', 'native_myanmar', 'development', 'evidence', 'safety', 'clinical'] as const;
const DECISIONS = ['in_review', 'approved', 'changes_requested', 'not_applicable', 'evidence_required', 'blocked', 'rejected'] as const;
type Dimension = (typeof DIMENSIONS)[number];
type Decision = (typeof DECISIONS)[number];
type StaffRole = 'owner' | 'content_editor' | 'language_reviewer' | 'evidence_reviewer' | 'clinical_reviewer' | 'support' |
  'system_admin' | 'review_manager' | 'myanmar_language_reviewer' | 'child_development_reviewer' | 'publisher' | 'auditor';
type ReviewerRole = Extract<StaffRole, 'language_reviewer' | 'myanmar_language_reviewer' | 'child_development_reviewer' | 'evidence_reviewer' | 'clinical_reviewer'>;
type ProposalField = 'titleMm' | 'summaryMm' | 'structuredMyanmar';

const REVIEWER_ROLE_LABELS: Record<ReviewerRole, { mm: string; en: string }> = {
  language_reviewer: { mm: 'ဘာသာစကား သုံးသပ်သူ', en: 'Language reviewer' },
  myanmar_language_reviewer: { mm: 'မြန်မာစာ သုံးသပ်သူ', en: 'Myanmar language reviewer' },
  child_development_reviewer: { mm: 'ကလေးဖွံ့ဖြိုးမှု သုံးသပ်သူ', en: 'Child development reviewer' },
  evidence_reviewer: { mm: 'ကိုးကားအထောက်အထား သုံးသပ်သူ', en: 'Evidence reviewer' },
  clinical_reviewer: { mm: 'ဆေးဘက်ဆိုင်ရာ သုံးသပ်သူ', en: 'Clinical reviewer' },
};

const DIMENSION_LABELS: Record<Dimension, { mm: string; en: string }> = {
  english: { mm: 'အင်္ဂလိပ်စာနှင့် အကြောင်းအရာ', en: 'English copy and content' },
  native_myanmar: { mm: 'သဘာဝကျသော မြန်မာအသုံးအနှုန်း', en: 'Native Myanmar language' },
  development: { mm: 'ကလေးဖွံ့ဖြိုးမှုနှင့် အသက်အရွယ်ကိုက်ညီမှု', en: 'Child development and age appropriateness' },
  evidence: { mm: 'ကိုးကားအထောက်အထား', en: 'Evidence' },
  safety: { mm: 'ဘေးကင်းရေး', en: 'Safety' },
  clinical: { mm: 'ဆေးဘက်ဆိုင်ရာ သုံးသပ်မှု', en: 'Clinical review' },
};

const DECISION_LABELS: Record<Decision, { mm: string; en: string }> = {
  in_review: { mm: 'စစ်ဆေးဆဲ', en: 'In review' },
  approved: { mm: 'ဤမူကွဲကို အတည်ပြုသည်', en: 'Approve this revision' },
  changes_requested: { mm: 'ပြင်ဆင်ရန် လိုအပ်သည်', en: 'Changes requested' },
  not_applicable: { mm: 'မသက်ဆိုင်ပါ', en: 'Not applicable' },
  evidence_required: { mm: 'အထောက်အထား ထပ်မံလိုအပ်သည်', en: 'Evidence required' },
  blocked: { mm: 'ဆက်လက်လုပ်ဆောင်၍ မရသေးပါ', en: 'Blocked' },
  rejected: { mm: 'ပယ်ချသည်', en: 'Reject' },
};

const ASSIGNMENT_STATUS_LABELS: Record<string, { mm: string; en: string }> = {
  assigned: { mm: 'တာဝန်ပေးပြီး', en: 'Assigned' },
  in_review: { mm: 'စစ်ဆေးဆဲ', en: 'In review' },
  changes_requested: { mm: 'ပြင်ဆင်ရန် လိုအပ်', en: 'Changes requested' },
  revised: { mm: 'ပြင်ဆင်ပြီး', en: 'Revised' },
  re_review_required: { mm: 'ပြန်လည်စစ်ဆေးရန်', en: 'Re-review required' },
  approved: { mm: 'အတည်ပြုပြီး', en: 'Approved' },
  blocked: { mm: 'ဆက်မလုပ်နိုင်သေး', en: 'Blocked' },
  cancelled: { mm: 'ပယ်ဖျက်ပြီး', en: 'Cancelled' },
};

const PROPOSAL_FIELD_LABELS: Record<ProposalField, { mm: string; en: string }> = {
  titleMm: { mm: 'မြန်မာခေါင်းစဉ်', en: 'Myanmar title' },
  summaryMm: { mm: 'မြန်မာအနှစ်ချုပ်', en: 'Myanmar summary' },
  structuredMyanmar: { mm: 'အကြောင်းအရာထဲမှ မြန်မာစာသား', en: 'Myanmar content section' },
};

const PROPOSAL_STATUS_LABELS: Record<string, { mm: string; en: string }> = {
  draft: { mm: 'အကြမ်း', en: 'Draft' },
  submitted: { mm: 'တင်ပြပြီး', en: 'Submitted' },
  accepted: { mm: 'လက်ခံပြီး', en: 'Accepted' },
  rejected: { mm: 'ပယ်ချပြီး', en: 'Rejected' },
};

function assignmentStatusLabel(status: string, locale: 'mm' | 'en'): string {
  return ASSIGNMENT_STATUS_LABELS[status]?.[locale] ?? status.replace(/_/g, ' ');
}

function reviewerTypeLabel(value: string, locale: 'mm' | 'en'): string {
  return value.split(',').map((role) => {
    const normalized = role.trim() as ReviewerRole;
    return REVIEWER_ROLE_LABELS[normalized]?.[locale] ?? role.trim().replace(/_/g, ' ');
  }).join(', ');
}

function timelineActionLabel(action: string, locale: 'mm' | 'en'): string {
  const direct: Record<string, { mm: string; en: string }> = {
    'assignment.created': { mm: 'တာဝန်ပေးအပ်ခဲ့သည်', en: 'Assignment created' },
    'assignment.transition': { mm: 'တာဝန်အခြေအနေ ပြောင်းခဲ့သည်', en: 'Assignment status changed' },
    'review.comment.added': { mm: 'မှတ်ချက် ထည့်ခဲ့သည်', en: 'Comment added' },
    'review.proposal.drafted': { mm: 'စာသားအကြမ်း သိမ်းခဲ့သည်', en: 'Wording draft saved' },
    'review.proposal.submitted': { mm: 'စာသားအဆိုပြုချက် တင်ခဲ့သည်', en: 'Wording proposal submitted' },
    'review.proposal.accepted': { mm: 'စာသားအဆိုပြုချက် လက်ခံခဲ့သည်', en: 'Wording proposal accepted' },
    'review.proposal.rejected': { mm: 'စာသားအဆိုပြုချက် ပယ်ချခဲ့သည်', en: 'Wording proposal rejected' },
  };
  if (direct[action]) return direct[action][locale];
  const match = /^review\.([^.]+)\.([^.]+)$/.exec(action);
  if (match) {
    const reviewDimension = match[1] as Dimension;
    const reviewDecision = match[2] as Decision;
    const area = DIMENSION_LABELS[reviewDimension]?.[locale] ?? match[1].replace(/_/g, ' ');
    const result = DECISION_LABELS[reviewDecision]?.[locale] ?? match[2].replace(/_/g, ' ');
    return `${area} — ${result}`;
  }
  return action.replace(/\./g, ' ').replace(/_/g, ' ');
}

const CHECKLIST_LABELS: Record<string, { mm: string; en: string }> = {
  meaning_matches_source: { mm: 'မူရင်းအဓိပ္ပာယ်နှင့် ကိုက်ညီသည်', en: 'Meaning matches the source' },
  plain_language: { mm: 'မိဘများ နားလည်လွယ်သည်', en: 'Parents can understand it easily' },
  concise: { mm: 'စာကြောင်းများ တိုတောင်းရှင်းလင်းသည်', en: 'Sentences are concise' },
  non_judgmental: { mm: 'အပြစ်တင်သည့် အသုံးအနှုန်း မပါ', en: 'Tone is non-judgmental' },
  age_clear: { mm: 'အသက်အရွယ်ကို ရှင်းလင်းစွာ ဖော်ပြထားသည်', en: 'Age group is clearly stated' },
  spelling: { mm: 'စာလုံးပေါင်း မှန်ကန်သည်', en: 'Spelling is correct' },
  grammar: { mm: 'သဒ္ဒါနှင့် ဝါကျဖွဲ့စည်းပုံ မှန်ကန်သည်', en: 'Grammar is correct' },
  natural_wording: { mm: 'မြန်မာအသုံးအနှုန်း သဘာဝကျသည်', en: 'Wording is natural' },
  parent_friendly: { mm: 'မိဘများအတွက် ဖတ်ရလွယ်သည်', en: 'Wording is parent-friendly' },
  glossary: { mm: 'သတ်မှတ်ဝေါဟာရများနှင့် ကိုက်ညီသည်', en: 'Terminology matches the glossary' },
  safety_clear: { mm: 'ဘေးကင်းရေးစာသား နားလည်လွယ်သည်', en: 'Safety wording is understandable' },
  age_appropriate: { mm: 'အသက်အရွယ်နှင့် ကိုက်ညီသည်', en: 'Activity is age appropriate' },
  practical: { mm: 'လက်တွေ့လုပ်ဆောင်နိုင်သည်', en: 'Instructions are practical' },
  realistic_materials: { mm: 'လိုအပ်ပစ္စည်းများ အလွယ်တကူ ရနိုင်သည်', en: 'Materials are realistic' },
  benefit_accurate: { mm: 'ဖွံ့ဖြိုးမှုအကျိုးကျေးဇူးကို မှန်ကန်စွာ ဖော်ပြထားသည်', en: 'Developmental benefit is accurate' },
  normal_variation: { mm: 'ကလေးတစ်ဦးနှင့်တစ်ဦး ကွာခြားနိုင်မှုကို ထည့်သွင်းထားသည်', en: 'Normal variation is acknowledged' },
  no_guarantee: { mm: 'အာမခံချက်ပေးသည့် စာသား မပါ', en: 'No guaranteed outcome is promised' },
  culturally_appropriate: { mm: 'မြန်မာ့ယဉ်ကျေးမှုနှင့် သင့်လျော်သည်', en: 'Cultural context is appropriate' },
  clinical_flag_correct: { mm: 'ဆေးဘက်ဆိုင်ရာ စစ်ဆေးမှုလိုအပ်ချက်ကို မှန်ကန်စွာ သတ်မှတ်ထားသည်', en: 'Clinical review need is correctly flagged' },
  evidence_sufficient: { mm: 'ကိုးကားအထောက်အထား လုံလောက်သည်', en: 'Evidence is sufficient' },
  claim_mapping: { mm: 'အဆိုပြုချက်နှင့် ရင်းမြစ် ဆက်စပ်မှု ရှင်းလင်းသည်', en: 'Claims map clearly to sources' },
  source_current: { mm: 'ရင်းမြစ်အခြေအနေကို စစ်ဆေးထားသည်', en: 'Source status is current' },
  age_applicable: { mm: 'ရင်းမြစ်သည် သက်ဆိုင်ရာ အသက်အရွယ်နှင့် ကိုက်ညီသည်', en: 'Evidence applies to this age range' },
  scope_recorded: { mm: 'သုံးသပ်ထားသည့် နယ်ပယ်ကို မှတ်တမ်းတင်ထားသည်', en: 'Review scope is recorded' },
  no_unsafe_advice: { mm: 'ဘေးမကင်းသည့် အကြံပြုချက် မပါ', en: 'No unsafe advice' },
  warning_signs_clear: { mm: 'သတိပြုရမည့် လက္ခဏာများ ရှင်းလင်းသည်', en: 'Warning signs are clear' },
  escalation_appropriate: { mm: 'အရေးပေါ်အကူအညီ ရယူရန် လမ်းညွှန်ချက် သင့်လျော်သည်', en: 'Emergency escalation is appropriate' },
  safe_sleep: { mm: 'လုံခြုံစွာ အိပ်စက်ရေး လမ်းညွှန်ချက် သင့်လျော်သည်', en: 'Safe sleep guidance is appropriate' },
  feeding_choking: { mm: 'အစားအစာနှင့် ဆို့နင်မှုဘေးကင်းရေး မှန်ကန်သည်', en: 'Feeding and choking safety are appropriate' },
  rereview_date: { mm: 'ပြန်လည်သုံးသပ်ရမည့် ရက်ကို မှတ်တမ်းတင်ထားသည်', en: 'Re-review date is recorded' },
  no_diagnosis: { mm: 'ရောဂါအမည် တပ်သည့် အဆို မပါ', en: 'No diagnosis claim' },
  no_unsafe_medicine: { mm: 'ဘေးမကင်းသည့် ဆေးဝါးအကြံပြုချက် မပါ', en: 'No unsafe medicine advice' },
  no_unsupported_dosage: { mm: 'အထောက်အထားမရှိသည့် ဆေးပမာဏ မပါ', en: 'No unsupported dosage' },
  no_delayed_care: { mm: 'ကုသမှုနှောင့်နှေးစေနိုင်သည့် လမ်းညွှန်ချက် မပါ', en: 'No delayed-care instruction' },
};

function mayReview(roles: StaffRole[] | null | undefined, dimension: Dimension): boolean {
  if (!roles?.length) return false;
  if (dimension === 'clinical' || dimension === 'safety') return roles.includes('clinical_reviewer');
  if (roles.includes('owner')) return true;
  if (dimension === 'development') return roles.includes('child_development_reviewer');
  if (dimension === 'evidence') return roles.some((role) => ['evidence_reviewer', 'clinical_reviewer'].includes(role));
  return roles.some((role) => ['language_reviewer', 'myanmar_language_reviewer'].includes(role));
}

function assignmentMayReview(reviewerType: ReviewerRole | undefined, dimension: Dimension): boolean {
  if (!reviewerType) return false;
  if (reviewerType === 'clinical_reviewer') return ['clinical', 'safety', 'evidence'].includes(dimension);
  if (reviewerType === 'evidence_reviewer') return dimension === 'evidence';
  if (reviewerType === 'child_development_reviewer') return dimension === 'development';
  return dimension === 'english' || dimension === 'native_myanmar';
}

export type EditableField = {
  key: string;
  path: string[];
  value: string;
  multiline: boolean;
  list: boolean;
  language: 'mm' | 'en' | 'neutral';
};

const LANGUAGE_ORDER: Record<EditableField['language'], number> = { mm: 0, neutral: 1, en: 2 };

const FIELD_LABELS: Record<string, { mm: string; en: string }> = {
  encouragementMm: { mm: 'အားပေးစကား', en: 'Encouragement (Myanmar)' },
  encouragementEn: { mm: 'အားပေးစကား (English)', en: 'Encouragement' },
  redMm: { mm: 'သတိပြုရမည့်အချက်', en: 'Warning sign (Myanmar)' },
  redEn: { mm: 'သတိပြုရမည့်အချက် (English)', en: 'Warning sign' },
  observeMm: { mm: 'မိဘက စောင့်ကြည့်နိုင်သည့်အချက်', en: 'What a parent may observe' },
  observeEn: { mm: 'စောင့်ကြည့်နိုင်သည့်အချက် (English)', en: 'What a parent may observe' },
  whyMm: { mm: 'ဘာကြောင့် အရေးကြီးသနည်း', en: 'Why it matters (Myanmar)' },
  whyEn: { mm: 'ဘာကြောင့် အရေးကြီးသနည်း (English)', en: 'Why it matters' },
  objectiveMm: { mm: 'ရည်ရွယ်ချက်', en: 'Objective (Myanmar)' },
  objectiveEn: { mm: 'ရည်ရွယ်ချက် (English)', en: 'Objective' },
  materialsMm: { mm: 'လိုအပ်သည့်ပစ္စည်းများ', en: 'Materials (Myanmar)' },
  materialsEn: { mm: 'လိုအပ်သည့်ပစ္စည်းများ (English)', en: 'Materials' },
  stepsMm: { mm: 'လုပ်ဆောင်ရမည့်အဆင့်များ', en: 'Steps (Myanmar)' },
  stepsEn: { mm: 'လုပ်ဆောင်ရမည့်အဆင့်များ (English)', en: 'Steps' },
  safetyMm: { mm: 'ဘေးကင်းရေး သတိပြုရန်', en: 'Safety (Myanmar)' },
  safetyEn: { mm: 'ဘေးကင်းရေး သတိပြုရန် (English)', en: 'Safety' },
  tipsMm: { mm: 'အကြံပြုချက်များ', en: 'Tips (Myanmar)' },
  tipsEn: { mm: 'အကြံပြုချက်များ (English)', en: 'Tips' },
  bodyMm: { mm: 'မြန်မာအကြောင်းအရာ', en: 'Myanmar content' },
  bodyEn: { mm: 'အင်္ဂလိပ်အကြောင်းအရာ', en: 'English content' },
};

const BILINGUAL_FIELD_LABELS: Record<string, { mm: string; en: string }> = {
  q: { mm: 'မေးခွန်း', en: 'Question' },
  a: { mm: 'အဖြေ', en: 'Answer' },
  title: { mm: 'ခေါင်းစဉ်', en: 'Title' },
  overview: { mm: 'အကျဉ်းချုပ်', en: 'Overview' },
  body: { mm: 'အကြောင်းအရာ', en: 'Content' },
  observe: { mm: 'မိဘက စောင့်ကြည့်နိုင်သည့်အချက်', en: 'What a parent may observe' },
  why: { mm: 'ဘာကြောင့် အရေးကြီးသနည်း', en: 'Why it matters' },
  objective: { mm: 'ရည်ရွယ်ချက်', en: 'Objective' },
  materials: { mm: 'လိုအပ်သည့်ပစ္စည်းများ', en: 'Materials' },
  setup: { mm: 'ကြိုတင်ပြင်ဆင်ရန်', en: 'Preparation' },
  steps: { mm: 'လုပ်ဆောင်ရမည့်အဆင့်များ', en: 'Steps' },
  safety: { mm: 'ဘေးကင်းရေး သတိပြုရန်', en: 'Safety' },
  tips: { mm: 'အကြံပြုချက်များ', en: 'Tips' },
  referral: { mm: 'ကျွမ်းကျင်သူနှင့် တိုင်ပင်ရန်', en: 'When to seek professional support' },
  encouragement: { mm: 'အားပေးစကား', en: 'Encouragement' },
  takeaway: { mm: 'အဓိက မှတ်သားရန်', en: 'Key takeaway' },
  actionToday: { mm: 'ယနေ့ စတင်လုပ်ဆောင်ရန်', en: 'Action today' },
  myth: { mm: 'အယူအဆမှား', en: 'Myth' },
  fact: { mm: 'မှန်ကန်သောအချက်', en: 'Fact' },
  red: { mm: 'သတိပြုရမည့်အချက်', en: 'Warning sign' },
  observationQuestions: { mm: 'စောင့်ကြည့်ရန် မေးခွန်း', en: 'Observation question' },
  dailyActivities: { mm: 'နေ့စဉ် လုပ်ဆောင်ချက်', en: 'Daily activity' },
  redFlags: { mm: 'သတိပြုရမည့် လက္ခဏာ', en: 'Warning sign' },
  instructions: { mm: 'လုပ်ဆောင်နည်း', en: 'Instruction' },
  parentTips: { mm: 'မိဘအတွက် အကြံပြုချက်', en: 'Parent tip' },
  indoor: { mm: 'အိမ်တွင်း လုပ်ဆောင်ချက်', en: 'Indoor activity' },
  weeklyActivities: { mm: 'အပတ်စဉ် လုပ်ဆောင်ချက်', en: 'Weekly activity' },
  commonMistakes: { mm: 'ရှောင်သင့်သည့် အမှား', en: 'Common mistake to avoid' },
  lowCost: { mm: 'ကုန်ကျစရိတ်နည်း လုပ်ဆောင်ချက်', en: 'Low-cost activity' },
  outcomes: { mm: 'စောင့်ကြည့်နိုင်သည့် ရလဒ်', en: 'What a caregiver may observe' },
  outdoor: { mm: 'အိမ်ပြင် လုပ်ဆောင်ချက်', en: 'Outdoor activity' },
  variations: { mm: 'ပြောင်းလဲလုပ်ဆောင်နိုင်သည့် နည်းလမ်း', en: 'Variation' },
  options: { mm: 'ရွေးချယ်နိုင်သည့် နည်းလမ်း', en: 'Option' },
  possibleSigns: { mm: 'ဖြစ်နိုင်သည့် လက္ခဏာ', en: 'Possible sign' },
  vocabulary: { mm: 'သင်ယူမည့် စကားလုံး', en: 'Vocabulary' },
  activities: { mm: 'လှုပ်ရှားမှု', en: 'Activity' },
  objectives: { mm: 'ရည်ရွယ်ချက်', en: 'Objective' },
  strengths: { mm: 'အားသာချက်', en: 'Strength' },
  homeSupport: { mm: 'အိမ်တွင် ပံ့ပိုးနိုင်သည့်နည်း', en: 'Support at home' },
  schoolSupport: { mm: 'ကျောင်းတွင် ပံ့ပိုးနိုင်သည့်နည်း', en: 'Support at school' },
  professionalSupport: { mm: 'ပညာရှင်ထံမှ ပံ့ပိုးမှု', en: 'Professional support' },
  questions: { mm: 'မေးခွန်း', en: 'Question' },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function fieldLanguage(key: string, value: string): EditableField['language'] {
  if (/mm$/i.test(key) || /[\u1000-\u109f]/u.test(value)) return 'mm';
  if (/en$/i.test(key)) return 'en';
  return 'neutral';
}

export const HIDDEN_SYSTEM_FIELDS = new Set([
  'editorialStatus',
  'evidenceSummary',
  'format',
  'readingLevel',
  'domains',
  'references',
  'relatedMilestones',
  'relatedLessons',
  'relatedActivities',
]);

export function collectEditableFields(value: unknown, path: string[] = []): EditableField[] {
  if (typeof value === 'string') {
    const key = path.at(-1) ?? 'text';
    return [{ key, path, value, multiline: value.length > 70 || value.includes('\n'), list: false, language: fieldLanguage(key, value) }];
  }
  if (Array.isArray(value)) {
    if (value.length > 0 && value.every((entry) => typeof entry === 'string')) {
      const key = path.at(-1) ?? 'items';
      const text = value.join('\n');
      return [{ key, path, value: text, multiline: true, list: true, language: fieldLanguage(key, text) }];
    }
    return value.flatMap((entry, index) => collectEditableFields(entry, [...path, String(index)]));
  }
  if (isRecord(value)) {
    return Object.entries(value).flatMap(([key, entry]) => (
      HIDDEN_SYSTEM_FIELDS.has(key) ? [] : collectEditableFields(entry, [...path, key])
    ));
  }
  return [];
}

function cloneStructuredValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(cloneStructuredValue);
  if (isRecord(value)) return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneStructuredValue(entry)]));
  return value;
}

function updateStructuredField(root: unknown, field: EditableField, nextText: string): unknown {
  const clone = cloneStructuredValue(root);
  if (field.path.length === 0) return nextText;
  let cursor: unknown = clone;
  for (let index = 0; index < field.path.length - 1; index += 1) {
    const segment = field.path[index];
    if (Array.isArray(cursor)) cursor = cursor[Number(segment)];
    else if (isRecord(cursor)) cursor = cursor[segment];
  }
  const final = field.path.at(-1)!;
  const previous = Array.isArray(cursor) ? cursor[Number(final)] : isRecord(cursor) ? cursor[final] : undefined;
  const nextValue = Array.isArray(previous)
    ? nextText.split('\n').map((line) => line.trim()).filter(Boolean)
    : nextText;
  if (Array.isArray(cursor)) cursor[Number(final)] = nextValue;
  else if (isRecord(cursor)) cursor[final] = nextValue;
  return clone;
}

export function humanizeField(field: EditableField, locale: 'mm' | 'en'): string {
  const known = FIELD_LABELS[field.key];
  if (known) return known[locale];
  const section = field.path.some((segment) => /^\d+$/.test(segment))
    ? ` ${Number(field.path.find((segment) => /^\d+$/.test(segment))) + 1}`
    : '';
  const direct = BILINGUAL_FIELD_LABELS[field.key];
  if (direct) return `${direct[locale]}${section}`;
  const isBilingualLeaf = field.key === 'mm' || field.key === 'en';
  const conceptKey = isBilingualLeaf
    ? [...field.path.slice(0, -1)].reverse().find((segment) => !/^\d+$/.test(segment))
    : undefined;
  const bilingual = conceptKey ? BILINGUAL_FIELD_LABELS[conceptKey] : undefined;
  if (bilingual) {
    const language = field.key === 'mm'
      ? (locale === 'mm' ? 'မြန်မာ' : 'Myanmar')
      : 'English';
    return `${bilingual[locale]}${section} (${language})`;
  }
  const base = field.key
    .replace(/(Mm|En)$/i, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();
  return `${base || (locale === 'mm' ? 'အကြောင်းအရာ' : 'Content')}${section}`;
}

export function canExportReviewerCompletion(report: { hasMore: boolean } | undefined): boolean {
  return report !== undefined && !report.hasMore;
}

type ContentEditorItem = {
  slug: string;
  titleMm: string;
  titleEn: string;
  summaryMm?: string;
  summaryEn?: string;
  data: unknown;
  reviewRevision?: number;
};

function contentEditorSnapshot(item: ContentEditorItem): string {
  return JSON.stringify({
    titleMm: item.titleMm,
    titleEn: item.titleEn,
    summaryMm: item.summaryMm ?? '',
    summaryEn: item.summaryEn ?? '',
    data: item.data,
  });
}

function ContentEditor({ item, onDirtyChange }: { item: ContentEditorItem; onDirtyChange: (dirty: boolean) => void }) {
  const { locale } = useLocale();
  const L = (mm: string, en: string) => locale === 'mm' ? mm : en;
  const updateDraft = useMutation(api.library.updateDraft);
  const [titleMm, setTitleMm] = useState(item.titleMm);
  const [titleEn, setTitleEn] = useState(item.titleEn);
  const [summaryMm, setSummaryMm] = useState(item.summaryMm ?? '');
  const [summaryEn, setSummaryEn] = useState(item.summaryEn ?? '');
  const [data, setData] = useState<unknown>(item.data);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [savedSnapshot, setSavedSnapshot] = useState(() => contentEditorSnapshot(item));
  const currentSnapshot = useMemo(() => contentEditorSnapshot({
    ...item,
    titleMm,
    titleEn,
    summaryMm,
    summaryEn,
    data,
  }), [data, item, summaryEn, summaryMm, titleEn, titleMm]);
  const dirty = currentSnapshot !== savedSnapshot;
  const editableFields = useMemo(
    () => collectEditableFields(data).sort((left, right) => LANGUAGE_ORDER[left.language] - LANGUAGE_ORDER[right.language]),
    [data],
  );

  useEffect(() => {
    onDirtyChange(dirty);
    return () => onDirtyChange(false);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    if (!dirty) return undefined;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [dirty]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    setBusy(true);
    try {
      const result = await updateDraft({
        slug: item.slug,
        titleMm,
        titleEn,
        summaryMm: summaryMm || undefined,
        summaryEn: summaryEn || undefined,
        data,
      });
      setSavedSnapshot(currentSnapshot);
      setMessage(L(
        `ပြင်ဆင်ချက် သိမ်းပြီးပါပြီ။ သုံးသပ်မူကွဲ ${result.reviewRevision} ကို ပြန်လည်စစ်ဆေးရပါမည်။`,
        `Saved. Review revision ${result.reviewRevision} now requires fresh decisions.`,
      ));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : L('သိမ်း၍ မရပါ။', 'Unable to save.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-card border border-line bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{L('အကြောင်းအရာ တည်းဖြတ်ရန်', 'Edit content')}</p>
          <p className="text-sm text-ink-soft">{item.slug} · {L('မူကွဲ', 'revision')} {item.reviewRevision ?? 1}</p>
        </div>
        <span className="rounded-pill bg-pastel-yellow px-3 py-1 text-xs text-ink">
          {L('ပြင်လျှင် ပြန်လည်သုံးသပ်ရမည်', 'Edits reset active review')}
        </span>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <label className="space-y-1 text-sm font-medium text-ink">
          <span>မြန်မာခေါင်းစဉ်</span>
          <input value={titleMm} onChange={(event) => setTitleMm(event.target.value)} className="w-full rounded-xl border border-line px-3 py-2" required />
        </label>
        <label className="space-y-1 text-sm font-medium text-ink">
          <span>English title</span>
          <input value={titleEn} onChange={(event) => setTitleEn(event.target.value)} className="w-full rounded-xl border border-line px-3 py-2" required />
        </label>
        <label className="space-y-1 text-sm font-medium text-ink">
          <span>မြန်မာအနှစ်ချုပ်</span>
          <textarea value={summaryMm} onChange={(event) => setSummaryMm(event.target.value)} rows={4} className="w-full rounded-xl border border-line px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm font-medium text-ink">
          <span>English summary</span>
          <textarea value={summaryEn} onChange={(event) => setSummaryEn(event.target.value)} rows={4} className="w-full rounded-xl border border-line px-3 py-2" />
        </label>
      </div>
      <section className="rounded-xl border border-line bg-canvas p-4">
        <h3 className="text-sm font-bold text-sky-deep">{L('အကြောင်းအရာ အသေးစိတ်', 'Content details')}</h3>
        <p className="mt-1 text-xs text-ink-soft">
          {L('ပြင်လိုသည့်စာသားကို သက်ဆိုင်ရာအကွက်တွင် တိုက်ရိုက်ပြင်ပါ။ နည်းပညာပုံစံဖြင့် ရေးရန် မလိုပါ။', 'Edit each field directly. No technical format is required.')}
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {editableFields.map((field) => (
            <label key={field.path.join('.')} className="space-y-1 text-sm font-medium text-ink">
              <span>{humanizeField(field, locale)}</span>
              {field.multiline ? (
                <textarea
                  value={field.value}
                  onChange={(event) => setData((current: unknown) => updateStructuredField(current, field, event.target.value))}
                  rows={Math.min(8, Math.max(3, field.value.split('\n').length + 1))}
                  className="w-full rounded-xl border border-line bg-white px-3 py-2 leading-7"
                />
              ) : (
                <input
                  value={field.value}
                  onChange={(event) => setData((current: unknown) => updateStructuredField(current, field, event.target.value))}
                  className="w-full rounded-xl border border-line bg-white px-3 py-2"
                />
              )}
              {field.list && (
                <span className="block text-xs font-normal text-ink-soft">{L('တစ်ကြောင်းလျှင် အချက်တစ်ခု ရေးပါ။', 'Write one item per line.')}</span>
              )}
            </label>
          ))}
        </div>
        {editableFields.length === 0 && (
          <p className="mt-3 rounded-lg bg-white p-3 text-sm text-ink-soft">{L('ဤအပိုင်းတွင် ပြင်ဆင်နိုင်သည့် စာသားမရှိပါ။', 'This section has no editable text fields.')}</p>
        )}
      </section>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy || !dirty} className="rounded-pill bg-sky px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? L('သိမ်းနေသည်…', 'Saving…') : L('ပြင်ဆင်ချက် သိမ်းမည်', 'Save revision')}
        </button>
        {dirty && <span className="text-xs font-medium text-amber-700">{L('မသိမ်းရသေးသော ပြင်ဆင်ချက်များ ရှိပါသည်။', 'You have unsaved changes.')}</span>}
        {message && <p role="status" className="text-sm text-ink-soft">{message}</p>}
      </div>
    </form>
  );
}

export function ContentReviewWorkspace() {
  const { locale } = useLocale();
  const L = (mm: string, en: string) => locale === 'mm' ? mm : en;
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedSlug = searchParams.get('content')?.trim() ?? '';
  const [reportAsOf] = useState(() => Date.now());
  const access = useQuery(api.admin.myAccess);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [editorDirty, setEditorDirty] = useState(false);
  const managerView = Boolean(access?.roles.some((role) => ['owner', 'system_admin', 'review_manager'].includes(role)));
  const paymentView = Boolean(managerView && access?.isExplicitRole);
  const allAssignmentsView = Boolean(access?.roles.some((role) => ['owner', 'system_admin', 'review_manager', 'auditor'].includes(role)));
  const canPublish = Boolean(access?.roles.some((role) => ['owner', 'publisher'].includes(role)));
  const publisherOnly = Boolean(access?.roles.includes('publisher') && !managerView && !access.roles.some((role) => [
    'language_reviewer', 'myanmar_language_reviewer', 'child_development_reviewer', 'evidence_reviewer', 'clinical_reviewer',
  ].includes(role)));
  const reportView = Boolean(access?.roles.some((role) => ['owner', 'system_admin', 'review_manager', 'auditor'].includes(role)));
  const myAssignments = useQuery(api.reviewAssignments.listMine, {});
  const managedAssignments = useQuery(api.reviewAssignments.listManaged, allAssignmentsView ? {} : 'skip');
  const assignments = allAssignmentsView ? managedAssignments : myAssignments;
  const publishable = useQuery(api.library.listPublishable, canPublish ? {} : 'skip');
  const summary = useQuery(api.reviewAssignments.summary, { asOf: reportAsOf });
  const completionReport = useQuery(api.reviewReports.completion, reportView ? { asOf: reportAsOf } : 'skip');
  const recordExport = useMutation(api.reviewReports.recordExport);
  const team = useQuery(api.admin.listTeam, managerView ? {} : 'skip');
  const createAssignment = useMutation(api.reviewAssignments.create);
  const [dimension, setDimension] = useState<Dimension>('native_myanmar');
  const [decision, setDecision] = useState<Decision>('in_review');
  const detail = useQuery(api.library.getBySlug, selectedSlug ? { slug: selectedSlug } : 'skip');
  const reviews = useQuery(api.contentReviews.listForContent, selectedSlug ? { contentSlug: selectedSlug } : 'skip');
  const evidence = useQuery(api.evidence.forContent, selectedSlug ? { slug: selectedSlug } : 'skip');
  const saveDecision = useMutation(api.contentReviews.saveDecision);
  const publishContent = useMutation(api.library.setReview);
  const selectedMineAssignment = myAssignments?.find((row) => row.assignment.contentSlug === selectedSlug)?.assignment;
  const selectedAssignment = selectedMineAssignment ?? assignments?.find((row) => row.assignment.contentSlug === selectedSlug)?.assignment;
  const collaboration = useQuery(api.reviewCollaboration.list, selectedAssignment ? { assignmentId: selectedAssignment._id } : 'skip');
  const timeline = useQuery(api.reviewAssignments.history, selectedAssignment ? { assignmentId: selectedAssignment._id } : 'skip');
  const addComment = useMutation(api.reviewCollaboration.addComment);
  const saveProposal = useMutation(api.reviewCollaboration.saveProposal);
  const checklist = useQuery(api.reviewChecklists.getMine,
    selectedMineAssignment
      ? { assignmentId: selectedMineAssignment._id, dimension }
      : 'skip');
  const saveChecklist = useMutation(api.reviewChecklists.saveMine);
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [assignSlug, setAssignSlug] = useState('');
  const [assignReviewerId, setAssignReviewerId] = useState('');
  const [assignRole, setAssignRole] = useState<ReviewerRole>('myanmar_language_reviewer');
  const [assignDue, setAssignDue] = useState('');
  const [assignScope, setAssignScope] = useState('မြန်မာဘာသာစကားနှင့် ဖတ်ရှုနားလည်လွယ်မှု');
  const [comment, setComment] = useState('');
  const [proposalField, setProposalField] = useState<ProposalField>('summaryMm');
  const [proposalText, setProposalText] = useState('');

  const visibleAssignments = useMemo(() => {
    const rows = [...(assignments ?? [])];
    const known = new Set(rows.map((row) => row.assignment._id));
    for (const row of myAssignments ?? []) {
      if (!known.has(row.assignment._id)) rows.push(row);
    }
    return rows;
  }, [assignments, myAssignments]);

  useEffect(() => {
    const assignmentReady = allAssignmentsView ? managedAssignments !== undefined : myAssignments !== undefined;
    const publicationReady = !canPublish || publishable !== undefined;
    if (!assignmentReady || !publicationReady) return;
    const available = new Set([
      ...visibleAssignments.map((row) => row.assignment.contentSlug),
      ...(publishable ?? []).map((row) => row.slug),
    ]);
    if (requestedSlug && available.has(requestedSlug)) {
      if (selectedSlug !== requestedSlug) setSelectedSlug(requestedSlug);
      return;
    }
    if (selectedSlug && available.has(selectedSlug)) return;
    setSelectedSlug(visibleAssignments[0]?.assignment.contentSlug ?? publishable?.[0]?.slug ?? '');
  }, [allAssignmentsView, canPublish, managedAssignments, myAssignments, publishable, requestedSlug, selectedSlug, visibleAssignments]);

  useEffect(() => {
    if (!mayReview(access?.roles as StaffRole[] | undefined, dimension) || (selectedMineAssignment && !assignmentMayReview(selectedMineAssignment.reviewerType, dimension))) {
      const firstAllowed = DIMENSIONS.find((value) =>
        mayReview(access?.roles as StaffRole[] | undefined, value) &&
        (!selectedMineAssignment || assignmentMayReview(selectedMineAssignment.reviewerType, value)),
      );
      if (firstAllowed) setDimension(firstAllowed);
    }
  }, [access?.roles, dimension, selectedMineAssignment]);

  useEffect(() => {
    if (!checklist) return;
    setChecklistState(Object.fromEntries(checklist.requiredKeys.map((key) => [
      key,
      checklist.responses.find((response) => response.key === key)?.checked === true,
    ])));
  }, [checklist]);

  const currentByDimension = useMemo(() => new Map(
    reviews?.current.map((review) => [review.dimension, review]) ?? [],
  ), [reviews]);

  const submitDecision = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedSlug) return;
    setBusy(true); setMessage('');
    try {
      await saveDecision({ contentSlug: selectedSlug, dimension, decision, note: note || undefined });
      setNote('');
      setMessage(L('သုံးသပ်ဆုံးဖြတ်ချက်ကို မှတ်တမ်းတင်ပြီးပါပြီ။', 'Review decision recorded.'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : L('မှတ်တမ်းတင်၍ မရပါ။', 'Unable to record decision.'));
    } finally {
      setBusy(false);
    }
  };

  const persistChecklist = async () => {
    if (!selectedMineAssignment) return;
    setBusy(true); setMessage('');
    try {
      await saveChecklist({
        assignmentId: selectedMineAssignment._id,
        dimension,
        responses: (checklist?.requiredKeys ?? []).map((key) => ({ key, checked: checklistState[key] === true })),
      });
      setMessage(L('စစ်ဆေးစာရင်းကို သိမ်းပြီးပါပြီ။', 'Checklist saved.'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : L('စစ်ဆေးစာရင်းကို သိမ်း၍ မရပါ။', 'Unable to save checklist.'));
    } finally { setBusy(false); }
  };

  const submitAssignment = async (event: FormEvent) => {
    event.preventDefault();
    if (!assignSlug.trim() || !assignReviewerId) return;
    setBusy(true); setMessage('');
    try {
      await createAssignment({
        contentSlug: assignSlug.trim(),
        reviewerId: assignReviewerId as Id<'users'>,
        reviewerType: assignRole,
        dueAt: assignDue ? new Date(`${assignDue}T23:59:59`).getTime() : undefined,
        priority: 'normal',
        reviewScope: assignScope.trim(),
      });
      setAssignSlug('');
      setMessage(L('သုံးသပ်တာဝန်ကို ပေးအပ်ပြီး အကြောင်းကြားချက် ပို့ပြီးပါပြီ။', 'Assignment created and the reviewer was notified.'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : L('တာဝန်ပေး၍ မရပါ။', 'Unable to create assignment.'));
    } finally { setBusy(false); }
  };

  const publishSelected = async () => {
    if (!selectedSlug) return;
    const targetTitle = detail && 'item' in detail && detail.item
      ? (locale === 'mm' ? detail.item.titleMm : detail.item.titleEn)
      : selectedSlug;
    const confirmed = window.confirm(L(
      `“${targetTitle}” ကို မိဘများ မြင်နိုင်အောင် ထုတ်ဝေမည်မှာ သေချာပါသလား။`,
      `Publish “${targetTitle}” for parents?`,
    ));
    if (!confirmed) return;
    setBusy(true); setMessage('');
    try {
      await publishContent({ slug: selectedSlug, clinicalStatus: 'published' });
      setMessage(L('အကြောင်းအရာကို ထုတ်ဝေပြီး audit မှတ်တမ်းတင်ထားပါသည်။', 'Content published and recorded in the audit log.'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : L('ထုတ်ဝေ၍ မရပါ။', 'Unable to publish.'));
    } finally { setBusy(false); }
  };

  const submitComment = async () => {
    if (!selectedAssignment || !comment.trim()) return;
    setBusy(true); setMessage('');
    try {
      await addComment({ assignmentId: selectedAssignment._id, body: comment, visibility: 'reviewer_and_manager' });
      setComment('');
      setMessage(L('မှတ်ချက် ထည့်ပြီးပါပြီ။', 'Comment added.'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : L('မှတ်ချက် ထည့်၍ မရပါ။', 'Unable to add comment.'));
    } finally { setBusy(false); }
  };

  const submitProposal = async (submit: boolean) => {
    if (!selectedMineAssignment || !proposalText.trim()) return;
    setBusy(true); setMessage('');
    try {
      await saveProposal({ assignmentId: selectedMineAssignment._id, field: proposalField, proposedText: proposalText, submit });
      setProposalText('');
      setMessage(L(submit ? 'စာသားအဆိုပြုချက် တင်ပြီးပါပြီ။' : 'အကြမ်းသိမ်းပြီးပါပြီ။', submit ? 'Wording proposal submitted.' : 'Draft saved.'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : L('စာသားအဆိုပြုချက် သိမ်း၍ မရပါ။', 'Unable to save proposal.'));
    } finally { setBusy(false); }
  };

  const updateSelectedSlug = (slug: string) => {
    if (editorDirty && slug !== selectedSlug && !window.confirm(L(
      'မသိမ်းရသေးသော ပြင်ဆင်ချက်များ ရှိပါသည်။ မသိမ်းဘဲ အခြားအကြောင်းအရာသို့ ပြောင်းမည်လား။',
      'You have unsaved changes. Switch content without saving them?',
    ))) return;
    setSelectedSlug(slug);
    const next = new URLSearchParams(searchParams);
    if (slug) next.set('content', slug);
    else next.delete('content');
    setSearchParams(next, { replace: true });
  };

  const exportCompletion = async (kind: 'completion_csv' | 'completion_print') => {
    if (!completionReport) return;
    if (!canExportReviewerCompletion(completionReport)) {
      setMessage(L(
        'အစီရင်ခံစာသည် အချက်အလက်တစ်စိတ်တစ်ပိုင်းသာ ဖြစ်သောကြောင့် ဖိုင်ထုတ်ခြင်းနှင့် ပုံနှိပ်ခြင်းကို မလုပ်နိုင်သေးပါ။',
        'This report contains partial results, so CSV export and printing are unavailable.',
      ));
      return;
    }
    setMessage('');
    try {
      await recordExport({ kind, filterSummary: 'all reviewers' });
      if (kind === 'completion_csv') downloadReviewerCompletionCsv(completionReport.rows, locale);
      else {
        document.body.classList.add('print-reviewer-completion');
        try {
          window.print();
        } finally {
          document.body.classList.remove('print-reviewer-completion');
        }
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : L('အစီရင်ခံစာ ထုတ်ယူ၍ မရပါ။', 'Unable to export report.'));
    }
  };

  if (access === undefined) return <p className="text-ink-soft">…</p>;
  if (!access?.isStaff || !access.roles.some((role) => ['language_reviewer', 'myanmar_language_reviewer', 'child_development_reviewer', 'evidence_reviewer', 'clinical_reviewer', 'review_manager', 'owner', 'system_admin', 'publisher', 'auditor'].includes(role))) {
    return <p className="rounded-card border border-line bg-white p-5 text-ink">{L('ဤသုံးသပ်ရေးနေရာသို့ ဝင်ခွင့် မရှိပါ။', 'You do not have access to this review workspace.')}</p>;
  }

  const item = detail && 'item' in detail ? detail.item : null;
  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-mint">ACE Review Workspace</p>
        <h1 className="text-2xl font-bold text-sky-deep">{L('အကြောင်းအရာ သုံးသပ်ရေးနေရာ', 'Content review workspace')}</h1>
        <p className="max-w-3xl text-sm text-ink-soft">
          {L(
            'အကြောင်းအရာကို ပြင်ဆင်ပြီး ဘာသာစကား၊ ကိုးကားချက်၊ ဘေးကင်းရေးနှင့် ဆေးဘက်ဆိုင်ရာ သုံးသပ်ချက်များကို သီးခြားမှတ်တမ်းတင်နိုင်ပါသည်။ မည်သည့်ဆုံးဖြတ်ချက်ကိုမျှ အလိုအလျောက် မဖြည့်ပါ။',
            'Edit content and record language, evidence, safety, and clinical decisions separately. No decision is filled automatically.',
          )}
        </p>
      </header>

      {message && (
        <p role="status" aria-live="polite" className="rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink shadow-card">
          {message}
        </p>
      )}

      {summary && (
        <div className="space-y-2">
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label={L('သုံးသပ်မှုအကျဉ်းချုပ်', 'Review summary')}>
            {[
              [L('တာဝန်စုစုပေါင်း', 'Assigned'), summary.total],
              [L('စစ်ဆေးဆဲ', 'In review'), summary.inReview],
              [L('ပြင်ဆင်ရန်', 'Changes requested'), summary.changesRequested],
              [L('ပိတ်ဆို့နေသည်', 'Blocked'), summary.blocked],
              [L('ပြီးစီးမှု', 'Completion'), `${summary.completionPercent}%`],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-card border border-line bg-white p-4 shadow-card">
                <p className="text-xs text-ink-soft">{label}</p><p className="mt-1 text-2xl font-bold text-sky-deep">{value}</p>
              </div>
            ))}
          </section>
          {summary.hasMore && (
            <p role="status" className="rounded-xl border border-amber-300 bg-pastel-yellow px-4 py-3 text-sm text-ink">
              {L(
                `တာဝန်များစွာရှိသောကြောင့် နောက်ဆုံး ${summary.assignmentLimit.toLocaleString()} ခုကိုသာ တွက်ချက်ပြထားပါသည်။ ဤကိန်းဂဏန်းများသည် အပြည့်အစုံ မဟုတ်ပါ။`,
                `Only the latest ${summary.assignmentLimit.toLocaleString()} assignments are included. These summary figures are partial, not complete totals.`,
              )}
            </p>
          )}
        </div>
      )}

      {reportView && completionReport?.rows.length ? (
        <details id="reviewer-completion-report" className="rounded-card border border-line bg-white p-4 shadow-card">
          <summary className="cursor-pointer font-bold text-sky-deep">{L('သုံးသပ်သူအလိုက် ပြီးစီးမှုအစီရင်ခံစာ', 'Reviewer completion report')}</summary>
          {completionReport.hasMore && (
            <p role="alert" className="mt-3 rounded-xl border border-amber-300 bg-pastel-yellow px-4 py-3 text-sm text-ink">
              {L(
                `ဤအစီရင်ခံစာတွင် နောက်ဆုံးတာဝန် ${completionReport.assignmentLimit.toLocaleString()} ခုကိုသာ ထည့်တွက်ထားသဖြင့် အချက်အလက် မပြည့်စုံပါ။ CSV ဖိုင်ထုတ်ခြင်းနှင့် ပုံနှိပ်ခြင်းကို ပိတ်ထားပါသည်။`,
                `This report includes only the latest ${completionReport.assignmentLimit.toLocaleString()} assignments and is incomplete. CSV export and printing are disabled.`,
              )}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2 print:hidden">
            <button type="button" onClick={() => void exportCompletion('completion_csv')} disabled={!canExportReviewerCompletion(completionReport)} className="rounded-pill border border-sky px-4 py-2 text-xs font-semibold text-sky-deep disabled:cursor-not-allowed disabled:opacity-50">{L('CSV ဖိုင်ထုတ်မည်', 'Export CSV')}</button>
            <button type="button" onClick={() => void exportCompletion('completion_print')} disabled={!canExportReviewerCompletion(completionReport)} className="rounded-pill border border-sky px-4 py-2 text-xs font-semibold text-sky-deep disabled:cursor-not-allowed disabled:opacity-50">{L('ပုံနှိပ်မည်', 'Print report')}</button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <caption className="sr-only">{L('သုံးသပ်သူအလိုက် ပြီးစီးမှု', 'Completion by reviewer')}</caption>
              <thead><tr className="border-b border-line text-ink-soft"><th scope="col" className="p-2">{L('သုံးသပ်သူ', 'Reviewer')}</th><th scope="col" className="p-2">{L('တာဝန်', 'Assigned')}</th><th scope="col" className="p-2">{L('ပြီးစီး', 'Completed')}</th><th scope="col" className="p-2">{L('ပိတ်ဆို့', 'Blocked')}</th><th scope="col" className="p-2">{L('နောက်ကျ', 'Overdue')}</th><th scope="col" className="p-2">%</th></tr></thead>
              <tbody>{completionReport.rows.map((row) => <tr key={row.reviewerId} className="border-b border-line/60"><td className="p-2"><b>{row.reviewerName}</b><br /><span className="text-xs text-ink-soft">{reviewerTypeLabel(row.reviewerType, locale)}</span></td><td className="p-2">{row.assigned}</td><td className="p-2">{row.completed}</td><td className="p-2">{row.blocked}</td><td className="p-2">{row.overdue}</td><td className="p-2">{row.completionPercent}%</td></tr>)}</tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-ink-soft">{L('ဤအစီရင်ခံစာသည် လက်ဖြင့် ငွေပေးချေမှုတွက်ချက်ရန်သာ ဖြစ်ပြီး အလိုအလျောက် ငွေမပေးပါ။', 'This report supports manual fee calculation and does not process payments.')}</p>
        </details>
      ) : null}

      {paymentView && managedAssignments && completionReport && (
        <ReviewerPaymentPanel
          roles={access?.roles ?? []}
          assignments={managedAssignments}
          reviewers={completionReport.rows.map((row) => ({ reviewerId: row.reviewerId, reviewerName: row.reviewerName }))}
          locale={locale}
        />
      )}

      {managerView && team?.allowed && (
        <details className="rounded-card border border-line bg-white p-4 shadow-card">
          <summary className="cursor-pointer font-bold text-sky-deep">{L('သုံးသပ်တာဝန်အသစ် ပေးမည်', 'Create a review assignment')}</summary>
          <form onSubmit={submitAssignment} className="mt-4 grid gap-3 lg:grid-cols-2">
            <label className="space-y-1 text-sm font-medium text-ink">
              <span>{L('အကြောင်းအရာ ID (slug)', 'Content ID (slug)')}</span>
              <input value={assignSlug} onChange={(event) => setAssignSlug(event.target.value)} required className="w-full rounded-xl border border-line px-3 py-2" />
            </label>
            <label className="space-y-1 text-sm font-medium text-ink">
              <span>{L('သုံးသပ်သူ', 'Reviewer')}</span>
              <select value={assignReviewerId} onChange={(event) => {
                const reviewerId = event.target.value;
                setAssignReviewerId(reviewerId);
                const reviewer = team.members.find((member) => member.userId === reviewerId);
                if (reviewer?.roles.includes('owner') && assignRole === 'clinical_reviewer') {
                  setAssignRole('myanmar_language_reviewer');
                }
              }} required className="w-full rounded-xl border border-line bg-white px-3 py-2">
                <option value="">{L('သုံးသပ်သူ ရွေးပါ', 'Select reviewer')}</option>
                {team.members.filter((member) => member.roles.some((role) => ['owner', 'language_reviewer', 'myanmar_language_reviewer', 'child_development_reviewer', 'evidence_reviewer', 'clinical_reviewer'].includes(role))).map((member) => (
                  <option key={member.userId} value={member.userId}>{member.displayName || member.email || member.userId}{member.roles.includes('owner') ? ` · ${L('Owner', 'Owner')}` : ''}</option>
                ))}
              </select>
              <span className="block text-xs font-normal text-ink-soft">{L('Owner ကိုယ်တိုင်လည်း ဆေးဘက်ဆိုင်ရာမဟုတ်သည့် သုံးသပ်မှုများကို တာဝန်ယူနိုင်သည်။', 'The owner may take non-clinical review assignments personally.')}</span>
            </label>
            <label className="space-y-1 text-sm font-medium text-ink">
              <span>{L('သုံးသပ်မှုအမျိုးအစား', 'Reviewer type')}</span>
              <select value={assignRole} onChange={(event) => setAssignRole(event.target.value as ReviewerRole)} className="w-full rounded-xl border border-line bg-white px-3 py-2">
                {(['myanmar_language_reviewer', 'language_reviewer', 'child_development_reviewer', 'evidence_reviewer', 'clinical_reviewer'] as ReviewerRole[]).map((role) => (
                  <option
                    key={role}
                    value={role}
                    disabled={role === 'clinical_reviewer' && team.members.find((member) => member.userId === assignReviewerId)?.roles.includes('owner')}
                  >
                    {REVIEWER_ROLE_LABELS[role][locale]}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm font-medium text-ink">
              <span>{L('ပြီးစီးရမည့်ရက်', 'Due date')}</span>
              <input type="date" value={assignDue} onChange={(event) => setAssignDue(event.target.value)} className="w-full rounded-xl border border-line px-3 py-2" />
            </label>
            <label className="space-y-1 text-sm font-medium text-ink lg:col-span-2">
              <span>{L('သုံးသပ်ရမည့် နယ်ပယ်', 'Review scope')}</span>
              <input value={assignScope} onChange={(event) => setAssignScope(event.target.value)} required className="w-full rounded-xl border border-line px-3 py-2" />
            </label>
            <button type="submit" disabled={busy} className="w-fit rounded-pill bg-sky px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{L('တာဝန်ပေးမည်', 'Assign')}</button>
          </form>
        </details>
      )}

      <section className="rounded-card border border-line bg-white p-4 shadow-card">
        <label className="space-y-1 text-sm font-medium text-ink">
          <span>{allAssignmentsView ? L('အဖွဲ့၏ သုံးသပ်တာဝန်များ', 'Team review assignments') : L('မိမိအား တာဝန်ပေးထားသော အကြောင်းအရာ', 'Assigned to me')}</span>
          <select value={selectedSlug} onChange={(event) => updateSelectedSlug(event.target.value)} className="w-full rounded-xl border border-line bg-white px-3 py-2">
            <option value="">{L('တာဝန်တစ်ခု ရွေးပါ', 'Select an assignment')}</option>
            {visibleAssignments.map((row) => (
              <option key={row.assignment._id} value={row.assignment.contentSlug}>{locale === 'mm' ? row.titleMm : row.titleEn} · {assignmentStatusLabel(row.assignment.status, locale)}</option>
            ))}
            {canPublish && publishable?.filter((row) => !visibleAssignments.some((assignment) => assignment.assignment.contentSlug === row.slug)).map((row) => (
              <option key={`publish-${row.slug}`} value={row.slug}>{locale === 'mm' ? row.titleMm : row.titleEn} · {L('ထုတ်ဝေရန် အသင့်', 'Ready to publish')}</option>
            ))}
          </select>
        </label>
        {visibleAssignments.length === 0 && (!canPublish || publishable?.length === 0) && <p className="mt-3 text-sm text-ink-soft">{L('သုံးသပ်တာဝန် မရှိသေးပါ။', 'No review assignments are available yet.')}</p>}
      </section>

      {item && access.roles.some((role) => ['owner', 'content_editor'].includes(role)) && (
        <ContentEditor key={`${item.slug}-${item.updatedAt}`} item={item} onDirtyChange={setEditorDirty} />
      )}

      {item && reviews?.allowed && (
        <section className="space-y-4 rounded-card border border-line bg-white p-4 shadow-card">
          <div className="grid gap-3 lg:grid-cols-2">
            <article className="rounded-xl border border-line bg-canvas p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">English</p>
              <h2 className="mt-2 font-bold text-ink">{item.titleEn}</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink-soft">{item.summaryEn || L('အင်္ဂလိပ်အနှစ်ချုပ် မရှိပါ။', 'No English summary.')}</p>
            </article>
            <article className="rounded-xl border border-line bg-canvas p-4" lang="my">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">မြန်မာ</p>
              <h2 className="mt-2 font-bold text-ink">{item.titleMm}</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink-soft">{item.summaryMm || 'မြန်မာအနှစ်ချုပ် မရှိပါ။'}</p>
            </article>
          </div>
          <section className="rounded-xl border border-line bg-white p-4">
            <h2 className="font-bold text-ink">{L('ကိုးကားအထောက်အထားများ', 'Evidence and sources')}</h2>
            {evidence?.sources.length ? (
              <ul className="mt-3 space-y-3">
                {evidence.sources.map((source) => (
                  <li key={source.sourceId} className="rounded-xl bg-canvas p-3 text-sm text-ink-soft">
                    <p className="font-semibold text-ink">{source.title}</p>
                    <p>{source.org}{source.year ? ` · ${source.year}` : ''}{source.evidenceLevel ? ` · ${source.evidenceLevel}` : ''}</p>
                    <a href={source.url} target="_blank" rel="noreferrer" className="mt-1 inline-block font-semibold text-sky-deep underline">{L('မူရင်းရင်းမြစ် ဖွင့်ကြည့်မည်', 'Open original source')}</a>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-2 text-sm text-ink-soft">{L('ချိတ်ဆက်ထားသည့် အတည်ပြုရင်းမြစ် မတွေ့ပါ။', 'No approved linked source was found.')}</p>}
          </section>
          <div>
            <h2 className="font-bold text-ink">{L('လက်ရှိမူကွဲ၏ သုံးသပ်မှုအခြေအနေ', 'Current revision review status')}</h2>
            <p className="text-sm text-ink-soft">{L('သုံးသပ်မူကွဲ', 'Review revision')} {reviews.contentVersion ?? 1}</p>
          </div>
          {canPublish && publishable?.some((row) => row.slug === selectedSlug) && (
            <div className="rounded-xl border border-mint bg-mint-soft p-4">
              <p className="text-sm text-ink">{L('ဤလုပ်ဆောင်ချက်သည် သုံးသပ်အတည်ပြုချက်များကို မပြင်ဘဲ သီးခြားထုတ်ဝေမှုမှတ်တမ်း ဖန်တီးပါမည်။', 'This action creates a separate publication record without altering reviewer sign-offs.')}</p>
              <button type="button" onClick={publishSelected} disabled={busy} className="mt-3 rounded-pill bg-sky px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{L('မိဘများအတွက် ထုတ်ဝေမည်', 'Publish for parents')}</button>
            </div>
          )}
          {selectedAssignment && (
            <section className="grid gap-4 lg:grid-cols-2">
              {selectedMineAssignment && (
                <div className="rounded-xl border border-line bg-canvas p-4">
                  <h2 className="font-bold text-ink">{L('မြန်မာစာသား အဆိုပြုမည်', 'Propose Myanmar wording')}</h2>
                  <select value={proposalField} onChange={(event) => setProposalField(event.target.value as typeof proposalField)} className="mt-3 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm">
                    {(Object.keys(PROPOSAL_FIELD_LABELS) as ProposalField[]).map((field) => (
                      <option key={field} value={field}>{PROPOSAL_FIELD_LABELS[field][locale]}</option>
                    ))}
                  </select>
                  <textarea value={proposalText} onChange={(event) => setProposalText(event.target.value)} rows={6} placeholder={L('ပြင်ဆင်လိုသည့် စာသားကို ရိုးရိုးရေးပါ။ နည်းပညာပုံစံ မလိုပါ။', 'Write the suggested wording normally. No technical format is required.')} className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm" />
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => submitProposal(false)} disabled={busy} className="rounded-pill border border-sky px-4 py-2 text-sm font-semibold text-sky-deep">{L('အကြမ်းသိမ်းမည်', 'Save draft')}</button>
                    <button type="button" onClick={() => submitProposal(true)} disabled={busy} className="rounded-pill bg-sky px-4 py-2 text-sm font-semibold text-white">{L('အဆိုပြုချက် တင်မည်', 'Submit proposal')}</button>
                  </div>
                </div>
              )}
              <div className="rounded-xl border border-line bg-canvas p-4">
                <h2 className="font-bold text-ink">{L('မှတ်ချက်များ', 'Review comments')}</h2>
                <ul className="mt-3 max-h-48 space-y-2 overflow-auto">
                  {collaboration?.comments.map((row) => <li key={row._id} className="rounded-lg bg-white p-2 text-xs text-ink-soft"><b className="text-ink">{row.authorDisplayName}</b><p>{row.body}</p></li>)}
                </ul>
                <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={3} className="mt-3 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm" />
                <button type="button" onClick={submitComment} disabled={busy || !comment.trim()} className="mt-2 rounded-pill border border-sky px-4 py-2 text-sm font-semibold text-sky-deep disabled:opacity-50">{L('မှတ်ချက် ထည့်မည်', 'Add comment')}</button>
              </div>
              {collaboration?.proposals.length ? (
                <div className="rounded-xl border border-line bg-white p-4 lg:col-span-2">
                  <h2 className="font-bold text-ink">{L('စာသားအဆိုပြုချက်များ', 'Wording proposals')}</h2>
                  <ul className="mt-3 space-y-2">{collaboration.proposals.map((row) => <li key={row._id} className="rounded-lg bg-canvas p-3 text-sm"><b>{PROPOSAL_FIELD_LABELS[row.field][locale]}</b> · {(PROPOSAL_STATUS_LABELS[row.status] ?? { mm: row.status, en: row.status })[locale]}<p className="mt-1 whitespace-pre-wrap text-ink-soft">{row.proposedText}</p></li>)}</ul>
                </div>
              ) : null}
            </section>
          )}
          <div className="grid gap-2 md:grid-cols-5">
            {DIMENSIONS.map((value) => {
              const review = currentByDimension.get(value);
              return (
                <div key={value} className="rounded-xl border border-line bg-canvas p-3">
                  <p className="text-sm font-semibold text-ink">{DIMENSION_LABELS[value][locale]}</p>
                  <p className="mt-1 text-xs text-ink-soft">{review ? DECISION_LABELS[review.decision][locale] : L('မစစ်ဆေးရသေး', 'Not reviewed')}</p>
                  {review && <p className="mt-2 text-[11px] text-ink-soft">{review.reviewerDisplayName}</p>}
                </div>
              );
            })}
          </div>

          {!publisherOnly && selectedMineAssignment && <form onSubmit={submitDecision} className="grid gap-3 rounded-xl bg-mint-soft p-4 lg:grid-cols-2">
            {checklist && (
              <fieldset className="space-y-2 rounded-xl border border-line bg-white p-4 lg:col-span-2">
                <legend className="px-2 text-sm font-bold text-ink">{L('မဖြစ်မနေ စစ်ဆေးရမည့်စာရင်း', 'Required reviewer checklist')}</legend>
                {checklist.requiredKeys.map((key) => (
                  <label key={key} className="flex items-start gap-3 text-sm text-ink">
                    <input type="checkbox" checked={checklistState[key] === true} onChange={(event) => setChecklistState((current) => ({ ...current, [key]: event.target.checked }))} className="mt-1 h-4 w-4" />
                    <span>{(CHECKLIST_LABELS[key] ?? { mm: key, en: key })[locale]}</span>
                  </label>
                ))}
                <button type="button" onClick={persistChecklist} disabled={busy} className="mt-2 rounded-pill border border-sky px-4 py-2 text-sm font-semibold text-sky-deep disabled:opacity-50">
                  {L('စစ်ဆေးစာရင်း သိမ်းမည်', 'Save checklist')}
                </button>
              </fieldset>
            )}
            <label className="space-y-1 text-sm font-medium text-ink">
              <span>{L('သုံးသပ်မှုအမျိုးအစား', 'Review area')}</span>
              <select value={dimension} onChange={(event) => setDimension(event.target.value as Dimension)} className="w-full rounded-xl border border-line bg-white px-3 py-2">
                {DIMENSIONS.map((value) => (
                  <option key={value} value={value} disabled={!mayReview(access.roles as StaffRole[], value) || !assignmentMayReview(selectedMineAssignment.reviewerType, value)}>{DIMENSION_LABELS[value][locale]}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm font-medium text-ink">
              <span>{L('ဆုံးဖြတ်ချက်', 'Decision')}</span>
              <select value={decision} onChange={(event) => setDecision(event.target.value as Decision)} className="w-full rounded-xl border border-line bg-white px-3 py-2">
                {DECISIONS.map((value) => <option key={value} value={value}>{DECISION_LABELS[value][locale]}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-sm font-medium text-ink lg:col-span-2">
              <span>{L('သုံးသပ်မှတ်ချက်', 'Review note')}</span>
              <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} placeholder={decision === 'changes_requested' ? L('ပြင်ဆင်ရမည့်အချက်ကို ရှင်းလင်းစွာ ရေးပါ။', 'Describe the required change clearly.') : undefined} className="w-full rounded-xl border border-line bg-white px-3 py-2" />
            </label>
            <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
              <button type="submit" disabled={busy || !mayReview(access.roles as StaffRole[], dimension) || !assignmentMayReview(selectedMineAssignment.reviewerType, dimension) || (decision === 'approved' && checklist?.complete !== true)} className="rounded-pill bg-sky px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {busy ? L('မှတ်တမ်းတင်နေသည်…', 'Recording…') : L('ဆုံးဖြတ်ချက် မှတ်တမ်းတင်မည်', 'Record decision')}
              </button>
            </div>
          </form>}

          {reviews.history.length > 0 && (
            <details className="rounded-xl border border-line p-3">
              <summary className="cursor-pointer text-sm font-semibold text-sky-deep">{L('ယခင်သုံးသပ်မှတ်တမ်းများ', 'Review history')}</summary>
              <ul className="mt-3 space-y-2">
                {reviews.history.map((review) => (
                  <li key={review._id} className="rounded-lg bg-canvas px-3 py-2 text-xs text-ink-soft">
                    <b className="text-ink">{DIMENSION_LABELS[review.dimension][locale]}</b> · {DECISION_LABELS[review.decision][locale]} · {review.reviewerDisplayName} · {new Date(review.reviewedAt).toLocaleDateString()}
                    <span className="ml-2">({L('မူကွဲ', 'revision')} {review.contentVersion})</span>
                    {review.note && <p className="mt-1">{review.note}</p>}
                  </li>
                ))}
              </ul>
            </details>
          )}
          {timeline?.length ? (
            <details className="rounded-xl border border-line p-3">
              <summary className="cursor-pointer text-sm font-semibold text-sky-deep">{L('လုပ်ဆောင်မှု အချိန်လိုက်မှတ်တမ်း', 'Assignment timeline')}</summary>
              <ol className="mt-3 space-y-2">{timeline.map((event) => <li key={event._id} className="text-xs text-ink-soft"><b className="text-ink">{timelineActionLabel(event.action, locale)}</b> · {new Date(event.createdAt).toLocaleString()}{event.reason ? ` · ${event.reason}` : ''}</li>)}</ol>
            </details>
          ) : null}
        </section>
      )}
    </div>
  );
}
