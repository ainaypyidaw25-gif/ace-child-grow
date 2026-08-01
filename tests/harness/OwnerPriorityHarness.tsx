import { useState } from 'react';
import { OwnerPriorityView, type QueueRowView } from '../../src/screens/ownerPriority/OwnerPriorityView';
import { ImportPlanView } from '../../src/screens/ownerPriority/ClassificationImportPreview';
import type { ImportPlan } from '../../convex/lib/classificationImport';

// Layout-test harness. Renders the owner-priority workspace with FAKE, clearly
// labelled demo rows and no backend calls, so Playwright can verify the
// 360x800 and 820x1180 layouts (and photograph them) using the same components
// and the same production build pipeline as the app.
//
// It lives under tests/ and is built by vite.harness.config.ts into a SEPARATE
// bundle. It is NOT reachable from the application: src/ never imports it, and
// no route serves it, so it cannot ship to Production. See
// src/domain/__tests__/noDevRoutes.test.ts, which asserts exactly that.

const FIXTURE_ROWS: QueueRowView[] = [
  {
    slug: 'demo_sn_autism',
    titleMm: 'အော်တစ်ဇင် (Autism) သိရှိနားလည်မှုနှင့် မိသားစုအတွက် ပံ့ပိုးကူညီနိုင်သည့် နည်းလမ်းများ (နမူနာ)',
    titleEn: 'Understanding Autism (demo fixture)',
    type: 'special_need',
    category: 'autism',
    ageGroupKey: null,
    domainKey: null,
    clinicalStatus: 'published',
    reviewScope: 'education',
    reviewRevision: 1,
    parentVisibleNow: true,
    priority: 'P0',
    priorityReasons: ['parent-visible special-needs condition page'],
    riskClass: 'C',
    riskReasons: ['type=special_need (developmental condition guidance)'],
    provisionalClassification: true,
    requiredReviewDimensions: ['native_myanmar', 'english', 'child_development', 'evidence', 'safety', 'clinical'],
    suggestedReviewDimensions: ['native_myanmar', 'english', 'child_development', 'evidence', 'safety', 'clinical'],
    manualTriageRequired: false,
    outstandingDimensions: ['clinical', 'safety', 'native_myanmar'],
    approvedDimensions: [],
    activeReviewers: [],
    hasActiveAssignment: false,
    evidenceStatus: 'linked',
    priorityStatus: 'unreviewed',
    temporarilyHideRecommended: false,
    ownerNote: null,
    latestEditAt: 1785480000000,
    latestDecisionAt: null,
    warnings: [
      'parent-visible now with no clinical approval (education-scoped legacy publication)',
      'education-scoped review must never be read as clinical approval',
    ],
  },
  {
    slug: 'demo_act_story_sequence',
    titleMm: 'ပုံပြင်အစီအစဉ် ပြန်ပြောခြင်း — မြန်မာဘေးကင်းရေးအကွက် ချို့ယွင်းချက် (နမူနာ)',
    titleEn: 'Story-sequence retelling (demo fixture)',
    type: 'activity',
    category: null,
    ageGroupKey: '3y',
    domainKey: 'language',
    clinicalStatus: 'published',
    reviewScope: 'education',
    reviewRevision: 1,
    parentVisibleNow: true,
    priority: 'P0',
    priorityReasons: ['Myanmar/English conflict in a safety-related field'],
    riskClass: 'D',
    riskReasons: ['Myanmar/English integrity conflict: data.safety — one side empty'],
    provisionalClassification: true,
    requiredReviewDimensions: [],
    suggestedReviewDimensions: ['native_myanmar', 'english', 'child_development', 'evidence', 'safety', 'clinical'],
    manualTriageRequired: true,
    outstandingDimensions: [],
    approvedDimensions: [],
    activeReviewers: ['Demo Reviewer'],
    hasActiveAssignment: false,
    evidenceStatus: 'linked',
    priorityStatus: 'manual_triage_required',
    temporarilyHideRecommended: true,
    ownerNote: 'Fix the Myanmar safety wording before recheck.',
    latestEditAt: 1785490000000,
    latestDecisionAt: 1785495000000,
    warnings: ['Myanmar safety field is a placeholder while English carries guidance'],
  },
  {
    slug: 'demo_gd_7_9m_nutrition',
    titleMm: '၇–၉ လ အာဟာရ လမ်းညွှန် — ဖြည့်စွက်စာ စတင်ခြင်းနှင့် သတိပြုရမည့် လက္ခဏာများ (နမူနာ)',
    titleEn: '7–9 months nutrition guide (demo fixture)',
    type: 'guide',
    category: null,
    ageGroupKey: '7_9m',
    domainKey: 'nutrition',
    clinicalStatus: 'published',
    reviewScope: 'education',
    reviewRevision: 2,
    parentVisibleNow: true,
    priority: 'P1',
    priorityReasons: ['parent-visible clinical/safety-sensitive record awaiting clinical review'],
    riskClass: 'C',
    riskReasons: ['guide carries an explicit redFlags block', 'feeding/nutrition'],
    provisionalClassification: true,
    requiredReviewDimensions: ['native_myanmar', 'english', 'child_development', 'evidence', 'safety', 'clinical'],
    suggestedReviewDimensions: ['native_myanmar', 'english', 'child_development', 'evidence', 'safety', 'clinical'],
    manualTriageRequired: false,
    outstandingDimensions: ['clinical'],
    approvedDimensions: ['native_myanmar', 'english', 'child_development', 'evidence', 'safety'],
    activeReviewers: ['Demo Language Reviewer'],
    hasActiveAssignment: false,
    evidenceStatus: 'linked',
    priorityStatus: 'review_requested',
    temporarilyHideRecommended: false,
    ownerNote: null,
    latestEditAt: null,
    latestDecisionAt: 1785500000000,
    warnings: [],
  },
  {
    slug: 'demo_prt_checklist_2y',
    titleMm: '၂ နှစ် မိဘစောင့်ကြည့်စာရင်း (နမူနာ)',
    titleEn: '2-year parent checklist (demo fixture)',
    type: 'printable',
    category: 'checklist_2y',
    ageGroupKey: '2y',
    domainKey: null,
    clinicalStatus: 'clinical_review',
    reviewScope: null,
    reviewRevision: 1,
    parentVisibleNow: false,
    priority: 'P2',
    priorityReasons: ['unpublished clinical/safety-sensitive record'],
    riskClass: 'C',
    riskReasons: ['parent-scored milestone checklist (delay interpretation)'],
    provisionalClassification: true,
    requiredReviewDimensions: ['native_myanmar', 'english', 'child_development', 'evidence', 'safety', 'clinical'],
    suggestedReviewDimensions: ['native_myanmar', 'english', 'child_development', 'evidence', 'safety', 'clinical'],
    manualTriageRequired: false,
    outstandingDimensions: ['clinical', 'safety', 'evidence'],
    approvedDimensions: [],
    activeReviewers: [],
    hasActiveAssignment: false,
    evidenceStatus: 'linked',
    priorityStatus: 'unreviewed',
    temporarilyHideRecommended: false,
    ownerNote: null,
    latestEditAt: null,
    latestDecisionAt: null,
    warnings: [],
  },
  {
    slug: 'demo_act_cup_stacking',
    titleMm: 'ခွက်စီကစားနည်း (နမူနာ)',
    titleEn: 'Cup stacking play (demo fixture)',
    type: 'activity',
    category: null,
    ageGroupKey: '13_18m',
    domainKey: 'fine_motor',
    clinicalStatus: 'clinical_review',
    reviewScope: null,
    reviewRevision: 1,
    parentVisibleNow: false,
    priority: 'P3',
    priorityReasons: ['standard review (Class A/B)'],
    riskClass: 'A',
    riskReasons: ['no clinical, safety, referral or delay-interpretation wording detected in either language'],
    provisionalClassification: true,
    requiredReviewDimensions: ['native_myanmar', 'english', 'child_development', 'evidence'],
    suggestedReviewDimensions: ['native_myanmar', 'english', 'child_development', 'evidence'],
    manualTriageRequired: false,
    outstandingDimensions: [],
    approvedDimensions: ['native_myanmar', 'english', 'child_development', 'evidence'],
    activeReviewers: [],
    hasActiveAssignment: false,
    evidenceStatus: 'linked',
    priorityStatus: 'completed',
    temporarilyHideRecommended: false,
    ownerNote: null,
    latestEditAt: null,
    latestDecisionAt: null,
    warnings: [],
  },
];

const FIXTURE_PLAN: ImportPlan = {
  runId: 'migration-dryrun-2026-07-30-libclass-v2',
  expectedRecords: 383,
  matched: 383,
  missingSlugs: [],
  unknownSlugs: [],
  duplicateSlugs: [],
  revisionConflicts: [{ slug: 'demo_edited_since', fileRevision: 'ABSENT', serverRevision: 2 }],
  changes: [
    {
      slug: 'demo_sn_autism',
      expectedReviewRevision: 1,
      fields: {
        riskClassification: 'C',
        ownerPriority: 'P0',
        riskReasons: ['type=special_need'],
        requiredReviewDimensions: ['native_myanmar', 'english', 'child_development', 'evidence', 'safety', 'clinical'],
        classificationSource: 'classification-json-2026-07-30',
        classificationRunId: 'migration-dryrun-2026-07-30-libclass-v2',
        priorityStatus: 'unreviewed',
      },
    },
  ],
  unchanged: ['demo_act_cup_stacking'],
  classCounts: { A: 26, B: 140, C: 216, D: 1, E: 0 },
  priorityCounts: { P0: 15, P1: 122, P2: 80, P3: 166 },
  parentVisibleNow: 226,
  parentVisibleAfterImport: 226,
  importEnabled: false,
};

const FIXTURE_COUNTS = {
  p0Remaining: 2,
  p1Remaining: 1,
  p2Remaining: 1,
  p3Remaining: 0,
  parentVisibleClassC: 2,
  clinicalReviewsRequired: 3,
  safetyReviewsRequired: 2,
  myanmarReviewsRequired: 2,
  correctionNeeded: 1,
  manualTriageRequired: 1,
  reviewRequested: 1,
  currentlyAssigned: 0,
  readyForRecheck: 0,
  completed: 1,
};

const AGE_GROUP_FIXTURE = [
  { key: '7_9m', labelMm: '၇ – ၉ လ', labelEn: '7–9 months' },
  { key: '2y', labelMm: '၂ နှစ်', labelEn: '2 years' },
];

export function OwnerPriorityHarness() {
  const [locale, setLocale] = useState<'mm' | 'en'>('mm');
  const [opened, setOpened] = useState('');
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 pb-24">
      <div className="rounded-card border border-line bg-pastel-yellow p-3 text-sm text-ink">
        LAYOUT PREVIEW — demo fixture data only. Nothing here reads or writes real content.
        <button type="button" data-testid="toggle-locale" onClick={() => setLocale(locale === 'mm' ? 'en' : 'mm')} className="ml-3 rounded-pill border border-line bg-white px-3 py-1 text-xs font-semibold">
          {locale === 'mm' ? 'English' : 'မြန်မာ'}
        </button>
        {opened && <span data-testid="opened-slug" className="ml-3 text-xs">opened: {opened}</span>}
      </div>
      <OwnerPriorityView
        locale={locale}
        rows={FIXTURE_ROWS}
        counts={FIXTURE_COUNTS}
        ageGroups={AGE_GROUP_FIXTURE}
        contentTypes={['milestone', 'guide', 'activity', 'lesson', 'special_need', 'story', 'printable']}
        onOpenItem={(row) => setOpened(row.slug)}
      />
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-sky-deep">Classification Import Preview (fixture)</h2>
        <ImportPlanView plan={FIXTURE_PLAN} locale={locale} />
      </section>
    </div>
  );
}
