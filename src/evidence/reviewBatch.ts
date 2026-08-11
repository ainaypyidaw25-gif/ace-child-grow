// Evidence and safety review batch — age 0–12 months.
//
// A "batch" is a fixed, reproducible work packet handed to the assigned reviewers:
// exactly which content items are in scope, what evidence stands behind each
// one, what must be checked, and what is blocking sign-off. It is derived from
// the content seed and the evidence registry, so it cannot drift from either.
//
// SCOPE RULE — the batch contains content whose declared age scope falls
// entirely inside 0–12 months. Age-agnostic content (lessons, special-needs
// articles, printables) carries no declared age scope and is therefore NOT in
// this batch: it is reviewed once, cross-age, in its own packet. The batch
// reports that exclusion explicitly (`outOfScopeAgeAgnostic`) so nobody reads a
// completed 0–12 batch as "everything an infant's parent can see is approved".
//
// This module decides NOTHING clinically. It publishes nothing, approves
// nothing and ranks nothing by severity. It only assembles the packet.

import { CONTENT_SEED } from '../content/seed';
import { AGE_GROUPS, DOMAINS } from '../content/taxonomy';
import { EVIDENCE_LINKS } from './links';
import { SOURCE_BY_ID } from './sources';
import { isExpired, isOutdated, resolveReviewStatus, type EvidenceSource } from './types';

/** Age groups whose whole span sits inside the first 12 months. */
export const AGE_GROUP_KEYS_0_12 = AGE_GROUPS.filter((g) => g.maxMonths <= 12).map((g) => g.key);

export const BATCH_ID = 'batch-0-12m';

// ---------------------------------------------------------------------------
// Reviewer checklist
// ---------------------------------------------------------------------------

export interface ChecklistDimension {
  key: string;
  labelMm: string;
  labelEn: string;
  promptMm: string;
  promptEn: string;
  /**
   * A failed blocking dimension stops publication outright. A non-blocking
   * failure is recorded as a change request; the item stays in review.
   */
  blocking: boolean;
}

/**
 * The eight dimensions a reviewer signs off per item. Wording is deliberately
 * a question a qualified reviewer can answer yes/no/change-requested against the exact
 * item in front of them — not a general principle.
 */
export const REVIEWER_CHECKLIST: ChecklistDimension[] = [
  {
    key: 'factual_accuracy',
    labelMm: 'အချက်အလက် မှန်ကန်မှု',
    labelEn: 'Factual accuracy',
    promptMm:
      'ဤအကြောင်းအရာထဲက ဖွံ့ဖြိုးမှုဆိုင်ရာ အချက်အလက်တိုင်းသည် ချိတ်ဆက်ထားသော ကိုးကားချက်နှင့် ကိုက်ညီပါသလား။ ကိုးကားချက်တွင် မပါသော အချက် ထည့်ထားခြင်း ရှိပါသလား။',
    promptEn:
      'Does every developmental statement in this item match the linked references? Is anything asserted that the references do not support?',
    blocking: true,
  },
  {
    key: 'age_appropriateness',
    labelMm: 'အသက်အရွယ်နှင့် သင့်တော်မှု',
    labelEn: 'Age appropriateness',
    promptMm:
      'ဤအကြောင်းအရာကို သတ်မှတ်ထားသည့် အသက်အုပ်စုအတွက် သင့်တော်ပါသလား။ စောလွန်း/နောက်ကျလွန်းသော မျှော်မှန်းချက် ပါနေပါသလား။',
    promptEn:
      'Is this item right for the age group it is filed under? Does it set an expectation that is too early or too late for that age?',
    blocking: true,
  },
  {
    key: 'safety',
    labelMm: 'ဘေးကင်းလုံခြုံရေး',
    labelEn: 'Safety',
    promptMm:
      'အိမ်တွင်း လုပ်ဆောင်ချက်များတွင် ကလေးအား ထိခိုက်စေနိုင်သည့် အချက် ရှိပါသလား (လဲကျခြင်း၊ လည်ချောင်းပိတ်ခြင်း၊ အိပ်ရာဘေးအန္တရာယ်၊ ရေဘေး၊ အပူလောင်ခြင်း)။ ကြီးကြပ်မှု လိုအပ်ကြောင်း ရှင်းလင်းစွာ ဖော်ပြထားပါသလား။',
    promptEn:
      'Could any home activity here harm a child (falls, choking, sleep hazard, water, burns)? Is required adult supervision stated plainly?',
    blocking: true,
  },
  {
    key: 'myanmar_wording',
    labelMm: 'မြန်မာစာ သုံးနှုန်းမှု',
    labelEn: 'Myanmar wording',
    promptMm:
      'မြန်မာဘာသာပြန်သည် သဘာဝကျပြီး မိဘတစ်ဦး နားလည်လွယ်ပါသလား။ ဆေးပညာဝေါဟာရများကို မှန်ကန်စွာ သုံးထားပါသလား။ ကလေးအား အထင်သေးစေသော အသုံးအနှုန်း ပါနေပါသလား။',
    promptEn:
      'Does the Myanmar read naturally to a parent, use health terms correctly where present, and avoid any wording that belittles the child?',
    blocking: true,
  },
  {
    key: 'non_diagnostic_language',
    labelMm: 'ရောဂါအမည်တပ်ခြင်း မပါရှိမှု',
    labelEn: 'Non-diagnostic language',
    promptMm:
      'ဤအကြောင်းအရာသည် ရောဂါအမည် တပ်နေခြင်း၊ ရာခိုင်နှုန်း/ဖြစ်နိုင်ခြေ ခန့်မှန်းပေးခြင်း၊ "ပုံမှန်မဟုတ်သော ကလေး" ဟု တံဆိပ်ကပ်ခြင်း လုံးဝ မရှိကြောင်း သေချာပါသလား။',
    promptEn:
      'Is this item free of any diagnosis, any probability or percentage estimate, and any label that frames a child as abnormal?',
    blocking: true,
  },
  {
    key: 'reference_relevance',
    labelMm: 'ကိုးကားချက် သက်ဆိုင်မှု',
    labelEn: 'Reference relevance',
    promptMm:
      'ချိတ်ဆက်ထားသော ကိုးကားချက်တိုင်းသည် ဤအကြောင်းအရာနှင့် တကယ် သက်ဆိုင်ပါသလား။ လိုအပ်သော ကိုးကားချက် ကျန်နေပါသလား။',
    promptEn:
      'Is each linked reference actually about this item, and is any needed reference missing?',
    blocking: true,
  },
  {
    key: 'outdated_evidence',
    labelMm: 'ဟောင်းနွမ်းနေသော အထောက်အထား',
    labelEn: 'Outdated evidence',
    promptMm:
      'ချိတ်ဆက်ထားသော ကိုးကားချက်များတွင် ဗားရှင်းအသစ် ထွက်ပြီးသား ရှိပါသလား။ ဟောင်းနေသည်ဟု အမှတ်အသားပြုထားသည့် ကိုးကားချက်ကို ဆက်သုံးရန် သင့်တော်ပါသလား။',
    promptEn:
      'Has any linked reference been superseded by a newer edition, and is it still appropriate to rely on the ones flagged as outdated?',
    blocking: false,
  },
  {
    key: 'referral_guidance',
    labelMm: 'ဆရာဝန်ထံ ညွှန်းပို့ရန် လမ်းညွှန်',
    labelEn: 'Referral guidance',
    promptMm:
      'မိဘတစ်ဦး ကျန်းမာရေးဝန်ထမ်းထံ ဘယ်အချိန် သွားပြရမည်ကို ရှင်းလင်းစွာ ဖော်ပြထားပါသလား။ အရေးပေါ် လက္ခဏာများအတွက် လမ်းညွှန်ချက် မှန်ကန်ပါသလား။',
    promptEn:
      'Does the item tell a parent clearly when to see a health worker, and is the guidance for urgent signs correct?',
    blocking: true,
  },
];

export const BLOCKING_CHECKLIST_KEYS = REVIEWER_CHECKLIST.filter((d) => d.blocking).map((d) => d.key);

// ---------------------------------------------------------------------------
// Batch assembly
// ---------------------------------------------------------------------------

export interface BatchReferenceRef {
  id: string;
  org: string;
  orgKey: string;
  title: string;
  year: number | null;
  reviewStatus: string;
  expired: boolean;
  outdated: boolean;
}

export interface BatchItem {
  slug: string;
  type: string;
  titleMm: string;
  titleEn: string;
  ageGroupKey: string;
  ageGroupLabelEn: string;
  ageGroupLabelMm: string;
  domainKey: string | null;
  domainLabelEn: string | null;
  domainLabelMm: string | null;
  clinicalStatus: string;
  references: BatchReferenceRef[];
  orgKeys: string[];
  /** Reasons this item cannot be signed off yet. Empty = reviewable now. */
  blockers: string[];
  /** Advisory notes a reviewer should read but which do not block sign-off. */
  advisories: string[];
}

function refFor(id: string, todayIso: string): BatchReferenceRef | null {
  const src: EvidenceSource | undefined = SOURCE_BY_ID.get(id);
  if (!src) return null;
  return {
    id: src.id,
    org: src.org,
    orgKey: src.orgKey,
    title: src.title,
    year: src.year,
    reviewStatus: resolveReviewStatus(src),
    expired: isExpired(src, todayIso),
    outdated: isOutdated(src, todayIso),
  };
}

const AGE_BY_KEY = new Map(AGE_GROUPS.map((g) => [g.key, g]));
const DOMAIN_BY_KEY = new Map(DOMAINS.map((d) => [d.key, d]));
const LINK_BY_SLUG = new Map(EVIDENCE_LINKS.map((l) => [l.slug, l]));

// A grouping heading is read by a Myanmar-speaking reviewer, so it carries both
// languages. Where only one label exists for a key — a content type, an
// organisation acronym like WHO — labelMm repeats labelEn rather than inventing
// a translation: an untranslated acronym is honest, a guessed one is not.
export interface GroupCount {
  key: string;
  label: string;
  labelMm: string;
  count: number;
}

export interface ReviewBatch {
  batchId: string;
  generatedOn: string;
  ageRangeMonths: { min: number; max: number };
  items: BatchItem[];
  groups: {
    byAgeGroup: GroupCount[];
    byDomain: GroupCount[];
    byType: GroupCount[];
    byOrganization: GroupCount[];
    byReviewStatus: GroupCount[];
  };
  checklist: ChecklistDimension[];
  progress: {
    total: number;
    /** Checklist answers required to finish the batch. */
    checklistAnswers: number;
    published: number;
    inClinicalReview: number;
    draft: number;
    reviewableNow: number;
    blocked: number;
    withAdvisories: number;
    distinctReferences: number;
    referencesApproved: number;
    referencesAwaiting: number;
    referencesEvidenceRequired: number;
    expiredReferences: number;
    outdatedReferences: number;
  };
  /** Content a 0–12m parent can also see, deliberately not in this batch. */
  outOfScopeAgeAgnostic: { type: string; count: number }[];
}

// Myanmar headings for the two groupings whose keys are bare system strings.
const CONTENT_TYPE_MM: Record<string, string> = {
  milestone: 'မှတ်တိုင်',
  guide: 'လမ်းညွှန်',
  activity: 'လှုပ်ရှားမှု',
  lesson: 'သင်ခန်းစာ',
  special_need: 'အထူးလိုအပ်ချက်',
  story: 'ပုံပြင်',
  printable: 'ပရင့်ထုတ်ရန်',
};

const CLINICAL_STATUS_MM: Record<string, string> = {
  draft: 'မူကြမ်း',
  clinical_review: 'သုံးသပ်ဆဲ',
  published: 'ထုတ်ဝေပြီး',
};

type TallyRow = [key: string, labelEn: string, labelMm?: string];

function tally(pairs: TallyRow[]): GroupCount[] {
  const counts = new Map<string, { label: string; labelMm: string; count: number }>();
  for (const [key, label, labelMm] of pairs) {
    const row = counts.get(key);
    if (row) row.count += 1;
    else counts.set(key, { label, labelMm: labelMm ?? label, count: 1 });
  }
  return [...counts.entries()]
    .map(([key, v]) => ({ key, label: v.label, labelMm: v.labelMm, count: v.count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

export function buildReviewBatch(todayIso: string): ReviewBatch {
  const inScope = CONTENT_SEED.filter(
    (item) => item.ageGroupKey !== undefined && AGE_GROUP_KEYS_0_12.includes(item.ageGroupKey),
  );

  const items: BatchItem[] = inScope.map((item) => {
    const age = AGE_BY_KEY.get(item.ageGroupKey as string);
    const dom = item.domainKey ? DOMAIN_BY_KEY.get(item.domainKey) : undefined;
    const link = LINK_BY_SLUG.get(item.slug);
    const references = (link?.sourceIds ?? [])
      .map((id) => refFor(id, todayIso))
      .filter((r): r is BatchReferenceRef => r !== null);

    const blockers: string[] = [];
    const advisories: string[] = [];

    if (!link) blockers.push('no evidence link record');
    if (references.length === 0) blockers.push('no reference resolves in the registry');

    const unusable = references.filter((r) => r.reviewStatus === 'evidence_required');
    if (unusable.length > 0 && unusable.length === references.length) {
      blockers.push('every linked reference is evidence_required');
    } else if (unusable.length > 0) {
      advisories.push(
        `${unusable.length} linked reference(s) evidence_required: ${unusable.map((r) => r.id).join(', ')}`,
      );
    }

    const expired = references.filter((r) => r.expired);
    if (expired.length > 0) {
      advisories.push(`${expired.length} linked reference(s) overdue for re-check: ${expired.map((r) => r.id).join(', ')}`);
    }
    const outdated = references.filter((r) => r.outdated);
    if (outdated.length > 0) {
      advisories.push(`${outdated.length} linked reference(s) old enough to look for a newer edition: ${outdated.map((r) => r.id).join(', ')}`);
    }

    return {
      slug: item.slug,
      type: item.type,
      titleMm: item.titleMm,
      titleEn: item.titleEn,
      ageGroupKey: item.ageGroupKey as string,
      ageGroupLabelEn: age?.labelEn ?? (item.ageGroupKey as string),
      ageGroupLabelMm: age?.labelMm ?? (item.ageGroupKey as string),
      domainKey: item.domainKey ?? null,
      domainLabelEn: dom?.labelEn ?? null,
      domainLabelMm: dom?.labelMm ?? null,
      clinicalStatus: item.clinicalStatus,
      references,
      orgKeys: [...new Set(references.map((r) => r.orgKey))].sort(),
      blockers,
      advisories,
    };
  });

  const distinct = new Map<string, BatchReferenceRef>();
  items.forEach((i) => i.references.forEach((r) => distinct.set(r.id, r)));
  const refs = [...distinct.values()];

  const ageOrder = new Map(AGE_GROUPS.map((g, i) => [g.key, i]));
  const byAgeGroup = tally(
    items.map((i) => [i.ageGroupKey, i.ageGroupLabelEn, i.ageGroupLabelMm] as TallyRow),
  ).sort((a, b) => (ageOrder.get(a.key) ?? 99) - (ageOrder.get(b.key) ?? 99));

  return {
    batchId: BATCH_ID,
    generatedOn: todayIso,
    ageRangeMonths: { min: 0, max: 12 },
    items,
    groups: {
      byAgeGroup,
      byDomain: tally(
        items.map(
          (i) =>
            [
              i.domainKey ?? 'not_domain_scoped',
              i.domainLabelEn ?? 'Not domain-scoped',
              i.domainLabelMm ?? 'နယ်ပယ် သတ်မှတ်ချက် မရှိ',
            ] as TallyRow,
        ),
      ),
      byType: tally(items.map((i) => [i.type, i.type, CONTENT_TYPE_MM[i.type] ?? i.type] as TallyRow)),
      // Organisation keys are acronyms (WHO, AAP, CDC) — left as printed.
      byOrganization: tally(items.flatMap((i) => i.orgKeys.map((o) => [o, o] as TallyRow))),
      byReviewStatus: tally(
        items.map((i) => [i.clinicalStatus, i.clinicalStatus, CLINICAL_STATUS_MM[i.clinicalStatus] ?? i.clinicalStatus] as TallyRow),
      ),
    },
    checklist: REVIEWER_CHECKLIST,
    progress: {
      total: items.length,
      checklistAnswers: items.length * REVIEWER_CHECKLIST.length,
      published: items.filter((i) => i.clinicalStatus === 'published').length,
      inClinicalReview: items.filter((i) => i.clinicalStatus === 'clinical_review').length,
      draft: items.filter((i) => i.clinicalStatus === 'draft').length,
      reviewableNow: items.filter((i) => i.blockers.length === 0).length,
      blocked: items.filter((i) => i.blockers.length > 0).length,
      withAdvisories: items.filter((i) => i.advisories.length > 0).length,
      distinctReferences: refs.length,
      referencesApproved: refs.filter((r) => r.reviewStatus === 'approved').length,
      referencesAwaiting: refs.filter(
        (r) => r.reviewStatus === 'awaiting_review' || r.reviewStatus === 'in_review',
      ).length,
      referencesEvidenceRequired: refs.filter((r) => r.reviewStatus === 'evidence_required').length,
      expiredReferences: refs.filter((r) => r.expired).length,
      outdatedReferences: refs.filter((r) => r.outdated).length,
    },
    outOfScopeAgeAgnostic: tally(
      CONTENT_SEED.filter((i) => i.ageGroupKey === undefined).map((i) => [i.type, i.type] as [string, string]),
    ).map((g) => ({ type: g.key, count: g.count })),
  };
}
