/**
 * Owner-priority policy, decided in ONE place.
 *
 * The owner's review queues (P0–P3), the provisional risk classification, the
 * queue sort order and the dashboard counts are all pure functions here, shared
 * by the Convex queries and the review workspace UI — the same pattern as
 * ./reviewPolicy, and for the same reason: two copies of a triage rule drift,
 * and a drifted triage rule silently mis-prioritises safety work.
 *
 * IMPORTANT SCOPE NOTE. Nothing in this module publishes, unpublishes,
 * archives, approves, assigns, or changes reviewScope. It only *labels* records
 * so humans review the riskiest ones first. Stored governance fields
 * (riskClassification etc.) always take precedence over the provisional rules;
 * the provisional rules exist so the workspace is usable before any
 * classification import has been confirmed by the owner.
 *
 * Pure by design — no Convex imports — so the server bundle, the browser bundle
 * and Vitest can all consume it.
 */

export type RiskClass = 'A' | 'B' | 'C' | 'D' | 'E';
export type OwnerPriority = 'P0' | 'P1' | 'P2' | 'P3';
export type PriorityStatus =
  | 'unreviewed'
  | 'confirmed'
  // Class D/E: a human manager must decide the actual required dimensions
  // before any review work is treated as scoped. Never set automatically to
  // anything else, and never resolved by the classifier.
  | 'manual_triage_required'
  | 'correction_needed'
  // A review has been ASKED FOR. This is not an assignment: no reviewer has
  // been named, invited or committed. Kept distinct from 'assigned' precisely
  // so a dashboard can never imply staffing that does not exist.
  | 'review_requested'
  // Reserved for a genuine active reviewAssignment record. Nothing in this
  // build sets it, because no assignment table is deployed yet.
  | 'assigned'
  | 'in_review'
  | 'corrected'
  | 'ready_for_recheck'
  // Priority triage is finished. Deliberately NOT the same as 'completed':
  // it says the owner has decided what this record needs, not that the reviews
  // are done.
  | 'triage_complete'
  // Every confirmed required dimension is approved at the current revision.
  // Server-enforced; see completionRefusal below.
  | 'completed';

export const PRIORITY_STATUSES: PriorityStatus[] = [
  'unreviewed',
  'confirmed',
  'manual_triage_required',
  'correction_needed',
  'review_requested',
  'assigned',
  'in_review',
  'corrected',
  'ready_for_recheck',
  'triage_complete',
  'completed',
];

export const RISK_CLASSES: RiskClass[] = ['A', 'B', 'C', 'D', 'E'];
export const OWNER_PRIORITIES: OwnerPriority[] = ['P0', 'P1', 'P2', 'P3'];

/**
 * Coerce stored governance strings to a known enum member, or a safe default.
 * Production rows can carry a value from an earlier schema/migration that is no
 * longer in the enum; passed through unchecked it fails the queue query's return
 * validator and throws, crashing the whole review workspace. These keep the
 * queue resilient to such legacy data instead.
 */
export function coercePriorityStatus(value: string | null | undefined, fallback: PriorityStatus): PriorityStatus {
  return value != null && (PRIORITY_STATUSES as string[]).includes(value) ? (value as PriorityStatus) : fallback;
}
export function coerceRiskClass(value: string | null | undefined): RiskClass | null {
  return value != null && (RISK_CLASSES as string[]).includes(value) ? (value as RiskClass) : null;
}
export function coerceOwnerPriority(value: string | null | undefined): OwnerPriority | null {
  return value != null && (OWNER_PRIORITIES as string[]).includes(value) ? (value as OwnerPriority) : null;
}

export const PRIORITY_ORDER: Record<OwnerPriority, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

/** Default queue ordering of content types (task Part 3, items 3–9). */
export const TYPE_SORT_ORDER = [
  'special_need',
  'guide',
  'milestone',
  'printable',
  'activity',
  'lesson',
  'story',
] as const;

/** Canonical required-review dimension identifiers (task Part 3 policy). */
export const REVIEW_DIMENSION_IDS = [
  'native_myanmar',
  'english',
  'child_development',
  'evidence',
  'safety',
  'clinical',
] as const;
export type RequiredDimension = (typeof REVIEW_DIMENSION_IDS)[number];

/**
 * Clinical/safety-sensitive topic triggers (bilingual). Ported unchanged from
 * the 2026-07-30 library classification dry run (classificationRunId
 * migration-dryrun-2026-07-30-libclass-v2) so in-app provisional labels agree
 * with the audited artefacts. Any trigger promotes to Class C — when uncertain
 * between two classes, the HIGHER-risk class wins.
 */
const C_TRIGGERS: ReadonlyArray<readonly [string, RegExp]> = [
  ['feeding/nutrition', /\b(nutrition|nutrient|feeding|feed|breastfeed|breast milk|complementary feed|weaning|formula milk|malnutrition|micronutrient|iron|vitamin)\b|အာဟာရ|နို့တိုက်|နို့စို့|အစာကျွေး|အာဟာရချို့တဲ့/i],
  ['choking/aspiration', /\b(chok(e|ing)|aspirat|swallow(ed|ing) small|airway)\b|လည်ချောင်းပိတ်|တစ်ဆို့/i],
  ['allergy', /\b(allerg|anaphyla|rash reaction)\b|ဓာတ်မတည့်/i],
  ['sleep/safe sleep', /\b(safe sleep|sleep|sids|suffocat|co-?sleep|bedtime safety)\b|အိပ်စက်|ဘေးကင်းစွာအိပ်|ကျောပေါ်လှန်အိပ်/i],
  ['growth/anthropometry', /\b(growth (chart|faltering|monitor)|weight gain|underweight|stunt|wasting|head circumference)\b|ကြီးထွား|အလေးချိန်|အရပ်/i],
  ['vaccination', /\b(vaccin|immunis|immuniz)\b|ကာကွယ်ဆေး/i],
  ['illness/fever', /\b(fever|illness|infection|diarrh|dehydrat|vomit|unwell|sick)\b|ဖျားနာ|အဖျား|ဝမ်းလျှော|ရောဂါ/i],
  ['red flags', /\b(red flag|warning sign|concerning sign)\b|သတိပြုရန်လက္ခဏာ|စိုးရိမ်စရာ/i],
  ['referral threshold', /\b(refer(ral)?|consult a (doctor|pediatrician|paediatrician)|see a doctor|seek (medical|help)|health(care)? (worker|professional|provider))\b|ဆရာဝန်|ကလေးအထူးကု|ဆေးရုံ|ကျန်းမာရေးဝန်ထမ်း/i],
  ['emergency/injury', /\b(emergency|urgent|ambulance|drown|burn|poison|fall from|head injury|bleed)\b|အရေးပေါ်|ထိခိုက်ဒဏ်ရာ|မီးလောင်|အဆိပ်/i],
  ['developmental delay / regression', /\b(delay(ed)?|regress|loss of skill|skill loss|not (yet )?(walking|talking|sitting)|falls behind)\b|နောက်ကျ|ဆုတ်ယုတ်|ကျွမ်းကျင်မှုပျောက်/i],
  ['developmental condition / special needs', /\b(autis|adhd|cerebral palsy|down syndrome|hearing loss|visual impair|dyslex|disabilit|special needs|selective mutism|sensory processing|global developmental delay)\b|အော်တစ်ဇင်|မသန်စွမ်း|အထူးလိုအပ်ချက်/i],
  ['treatment / therapy / medication', /\b(treatment|therapy|therapist|medication|medicine|dose|prescri|physiotherap|speech therap|occupational therap)\b|ကုသ|ဆေးဝါး|ကုထုံး/i],
  ['medical claim', /\b(diagnos|screening test|clinical (sign|assessment)|prognos)\b|ရောဂါဖော်ထုတ်|စစ်ဆေး/i],
] as const;

const B_TRIGGERS: ReadonlyArray<readonly [string, RegExp]> = [
  ['milestone / age expectation', /\b(milestone|age expectation|by \d+ months|developmental (domain|stage)|observe|observation)\b|ရင့်ကျက်မှု|အသက်အလိုက်|စောင့်ကြည့်/i],
  ['developmental activity', /\b(gross motor|fine motor|language|cognitive|social|emotional|self-?help|development)\b|ဖွံ့ဖြိုး|ကြွက်သား|ဘာသာစကား/i],
] as const;

const CLINICAL_CATEGORIES = new Set([
  'nutrition', 'sleep', 'safety', 'doctor_visits', 'special_needs_awareness', 'parent_mental_health',
]);
const HEALTH_RECORD_PRINTABLES = new Set([
  'growth_log', 'sleep_diary', 'doctor_visit_checklist', 'milestone_checklist',
]);

const MM_SCRIPT = /[က-႟ꩠ-ꩿ]/u;

export interface ClassifiableRecord {
  slug: string;
  type: string;
  category?: string | null;
  ageGroupKey?: string | null;
  domainKey?: string | null;
  titleMm: string;
  titleEn: string;
  summaryMm?: string | null;
  summaryEn?: string | null;
  tags?: string[] | null;
  data: unknown;
  clinicalStatus: string;
  /** Stored governance fields, if a confirmed classification exists. */
  riskClassification?: RiskClass | null;
  ownerPriority?: OwnerPriority | null;
  riskReasons?: string[] | null;
  priorityStatus?: PriorityStatus | null;
  requiredReviewDimensions?: string[] | null;
  /** Server-detected workflow-integrity problem needing owner attention. */
  workflowBlocker?: string | null;
}

export interface BilingualConflict {
  path: string;
  detail: string;
  safetyRelated: boolean;
}

/** One-sided or script-less Myanmar/English pairs anywhere in the payload. */
export function findBilingualConflicts(data: unknown, path = 'data'): BilingualConflict[] {
  const out: BilingualConflict[] = [];
  const isEmpty = (value: unknown): boolean =>
    value == null ||
    (typeof value === 'string' && (value.trim() === '' || value.trim() === '—' || value.trim() === '-')) ||
    (Array.isArray(value) && value.length === 0);
  const safetyRelated = (fieldPath: string) => /safety|redflag|referral|warning/i.test(fieldPath);
  const walk = (value: unknown, at: string) => {
    if (value == null) return;
    if (Array.isArray(value)) { value.forEach((entry, index) => walk(entry, `${at}[${index}]`)); return; }
    if (typeof value !== 'object') return;
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record);
    if (keys.includes('mm') && keys.includes('en')) {
      const mm = record.mm, en = record.en;
      if (isEmpty(mm) !== isEmpty(en)) {
        out.push({ path: at, detail: 'one side of the mm/en pair is empty or a placeholder', safetyRelated: safetyRelated(at) });
      } else if (typeof mm === 'string' && mm.trim() && !MM_SCRIPT.test(mm)) {
        out.push({ path: `${at}.mm`, detail: 'Myanmar field contains no Myanmar script', safetyRelated: safetyRelated(at) });
      }
    }
    for (const key of keys) {
      if (key.endsWith('Mm')) {
        const enKey = `${key.slice(0, -2)}En`;
        if (keys.includes(enKey) && isEmpty(record[key]) !== isEmpty(record[enKey])) {
          out.push({ path: `${at}.${key}/${enKey}`, detail: 'one-sided bilingual field pair', safetyRelated: safetyRelated(`${at}.${key}`) });
        }
      }
      walk(record[key], `${at}.${key}`);
    }
  };
  walk(data, path);
  return out;
}

/**
 * JSON.stringify that never throws. Convex stores can hold an int64 (BigInt),
 * which the built-in JSON.stringify refuses ("Do not know how to serialize a
 * BigInt"); a value like that anywhere in a record's free-form `data` would make
 * classifyRecord — and therefore the whole `ownerPriority.queues` query — throw
 * a server error and crash the review workspace. BigInts are stringified and any
 * other failure degrades to an empty string.
 */
export function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, (_key, val) => (typeof val === 'bigint' ? val.toString() : val)) ?? '';
  } catch {
    return '';
  }
}

function searchableText(record: ClassifiableRecord): string {
  return [
    record.slug, record.titleEn, record.titleMm, record.summaryEn ?? '', record.summaryMm ?? '',
    (record.tags ?? []).join(' '), record.category ?? '', record.domainKey ?? '',
    safeStringify(record.data ?? {}),
  ].join(' \n ');
}

export interface ProvisionalClassification {
  riskClass: RiskClass;
  riskReasons: string[];
  clinicalTriggers: string[];
  bilingualConflicts: BilingualConflict[];
  pendingClinicalReferences: boolean;
}

/**
 * Provisional risk classification from the record's own content — used only
 * until the owner confirms an imported classification. Rule 1: any uncertainty
 * resolves to the higher-risk class.
 */
export function classifyRecord(record: ClassifiableRecord): ProvisionalClassification {
  const text = searchableText(record);
  const reasons: string[] = [];
  const clinicalTriggers: string[] = [];

  if (record.type === 'special_need') clinicalTriggers.push('type=special_need (developmental condition guidance)');
  const data = (record.data ?? {}) as Record<string, unknown>;
  if (record.type === 'guide' && data.redFlags) clinicalTriggers.push('guide carries an explicit redFlags block');
  if (record.type === 'guide' && data.referral) clinicalTriggers.push('guide carries an explicit referral instruction');
  if (record.category && CLINICAL_CATEGORIES.has(record.category)) clinicalTriggers.push(`category=${record.category} is a clinical/safety topic`);
  if (record.category && HEALTH_RECORD_PRINTABLES.has(record.category)) clinicalTriggers.push(`printable=${record.category} records health data or drives a referral decision`);
  if (record.category && /^checklist_/.test(record.category)) clinicalTriggers.push(`printable=${record.category} is a parent-scored milestone checklist (delay interpretation)`);
  for (const [name, pattern] of C_TRIGGERS) if (pattern.test(text)) clinicalTriggers.push(name);

  const bilingualConflicts = findBilingualConflicts(record.data);
  // Legacy imported metadata used this exact phrase. Keep detecting it so an
  // old row cannot escape review merely because current UI terminology changed.
  const pendingClinicalReferences = /pending clinical reviewer/i.test(safeStringify((record.data as Record<string, unknown> | null)?.references ?? ''));

  let riskClass: RiskClass;
  if (bilingualConflicts.length > 0) {
    riskClass = 'D';
    reasons.push(`Myanmar/English integrity conflict: ${bilingualConflicts[0].path} — ${bilingualConflicts[0].detail}`);
  } else if (clinicalTriggers.length > 0) {
    riskClass = 'C';
    reasons.push(...[...new Set(clinicalTriggers)].slice(0, 4));
  } else if (record.type === 'milestone' || record.type === 'guide' || B_TRIGGERS.some(([, pattern]) => pattern.test(text))) {
    riskClass = 'B';
    reasons.push('development guidance: sets age expectations or developmental activities');
  } else {
    riskClass = 'A';
    reasons.push('no clinical, safety, referral or delay-interpretation wording detected in either language');
  }
  if (pendingClinicalReferences) reasons.push('record body says clinical references are still pending');
  return { riskClass, riskReasons: reasons, clinicalTriggers: [...new Set(clinicalTriggers)], bilingualConflicts, pendingClinicalReferences };
}

const BASE_DIMENSIONS: RequiredDimension[] = ['native_myanmar', 'english', 'child_development', 'evidence'];
const ALL_DIMENSIONS: RequiredDimension[] = [...BASE_DIMENSIONS, 'safety', 'clinical'];

/** Class D and E are never auto-decided — a human manager must triage them. */
export function needsManualTriage(riskClass: RiskClass): boolean {
  return riskClass === 'D' || riskClass === 'E';
}

/**
 * Dimensions the policy REQUIRES for a class, i.e. what may be persisted as a
 * confirmed requirement without a human decision.
 *
 * D and E return NOTHING. Their risk is that the record is unclear or should be
 * retired — writing six confirmed requirements would be the system deciding a
 * question only a Review Manager or Owner may answer, and would make the record
 * look correctly scoped when it has not been triaged at all. Use
 * `suggestedDimensionsFor` to show the conservative set instead, and require an
 * explicit confirmation to turn any of it into a requirement.
 */
export function requiredDimensionsFor(riskClass: RiskClass): RequiredDimension[] {
  if (needsManualTriage(riskClass)) return [];
  if (riskClass === 'B') return [...BASE_DIMENSIONS, 'safety'];
  if (riskClass === 'C') return ALL_DIMENSIONS;
  return BASE_DIMENSIONS;
}

/**
 * Dimensions to SHOW as a conservative recommendation. For D/E this is the full
 * set — the safe reading of an unclear record — but it is advisory text on a
 * screen, never a stored requirement, and it never marks anything not_required.
 */
export function suggestedDimensionsFor(riskClass: RiskClass): RequiredDimension[] {
  if (needsManualTriage(riskClass)) return ALL_DIMENSIONS;
  return requiredDimensionsFor(riskClass);
}

export interface PriorityResult {
  priority: OwnerPriority;
  priorityReasons: string[];
  riskClass: RiskClass;
  riskReasons: string[];
  provisional: boolean;
}

export function isParentVisible(clinicalStatus: string): boolean {
  return clinicalStatus === 'published';
}

/**
 * P0–P3 queue assignment (task Part 1 policy). Stored ownerPriority wins when
 * present; otherwise the policy is applied to the stored riskClassification if
 * confirmed, else to the provisional classification.
 */
export function computePriority(record: ClassifiableRecord): PriorityResult {
  const provisionalResult = classifyRecord(record);
  const stored = record.riskClassification ?? null;
  const riskClass = stored ?? provisionalResult.riskClass;
  const riskReasons = stored && record.riskReasons?.length ? record.riskReasons : provisionalResult.riskReasons;
  const provisional = stored === null;
  const visible = isParentVisible(record.clinicalStatus);
  const reasons: string[] = [];

  if (record.ownerPriority) {
    return { priority: record.ownerPriority, priorityReasons: ['owner-confirmed priority'], riskClass, riskReasons, provisional };
  }

  let priority: OwnerPriority | null = null;
  if (record.workflowBlocker) {
    priority = 'P0';
    reasons.push(`workflow integrity blocker: ${record.workflowBlocker}`);
  }
  if (visible && record.type === 'special_need') {
    priority = 'P0';
    reasons.push('parent-visible special-needs condition page');
  }
  if (record.slug === 'act_story_sequence') {
    priority = 'P0';
    reasons.push('confirmed Myanmar/English safety-field conflict (classification dry run)');
  }
  if (provisionalResult.bilingualConflicts.some((conflict) => conflict.safetyRelated)) {
    priority = 'P0';
    reasons.push('Myanmar/English conflict in a safety-related field');
  }
  if (visible && provisionalResult.pendingClinicalReferences) {
    priority = 'P0';
      reasons.push('parent-visible while its own legacy metadata says specialist source review is pending');
  }

  if (!priority) {
    if (riskClass === 'C' || riskClass === 'D' || riskClass === 'E') {
      priority = visible ? 'P1' : 'P2';
      reasons.push(visible
        ? 'parent-visible high-risk record awaiting specialist safety review'
        : 'unpublished high-risk record awaiting specialist safety review');
    } else {
      priority = 'P3';
      reasons.push('standard review (Class A/B)');
    }
  }
  return { priority, priorityReasons: reasons, riskClass, riskReasons, provisional };
}

export interface SortableQueueRow {
  slug: string;
  type: string;
  clinicalStatus: string;
  priority: OwnerPriority;
}

/** Default queue sort (task Part 3): P0 → parent-visible → type order → slug. */
export function compareQueueRows(a: SortableQueueRow, b: SortableQueueRow): number {
  const byPriority = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  if (byPriority !== 0) return byPriority;
  const byVisibility = Number(isParentVisible(b.clinicalStatus)) - Number(isParentVisible(a.clinicalStatus));
  if (byVisibility !== 0) return byVisibility;
  const typeIndex = (type: string) => {
    const index = (TYPE_SORT_ORDER as readonly string[]).indexOf(type);
    return index === -1 ? TYPE_SORT_ORDER.length : index;
  };
  const byType = typeIndex(a.type) - typeIndex(b.type);
  if (byType !== 0) return byType;
  return a.slug.localeCompare(b.slug);
}

/**
 * Server-side guard for `priorityStatus = completed`.
 *
 * 'completed' asserts that every CONFIRMED required dimension is approved at
 * the CURRENT reviewRevision. A disabled button cannot enforce that — a direct
 * mutation call bypasses the UI entirely — so this is checked in the handler
 * and the refusal names the dimensions still outstanding.
 *
 * Records awaiting manual triage can never be 'completed': there is no
 * confirmed requirement set to satisfy, so "all requirements met" is not a
 * statement anyone has earned the right to make. Use 'triage_complete' for
 * "the owner has finished deciding what this needs".
 */
export interface CompletionRefusal {
  code: 'outstanding_dimensions' | 'manual_triage_required' | 'incomplete_data';
  outstanding: string[];
  message: { mm: string; en: string };
}

export function completionRefusal(input: {
  confirmedRequiredDimensions: string[];
  approvedDimensionsAtCurrentRevision: string[];
  needsManualTriage: boolean;
  dataComplete: boolean;
}): CompletionRefusal | null {
  if (!input.dataComplete) {
    return {
      code: 'incomplete_data',
      outstanding: [],
      message: {
        mm: 'သုံးသပ်မှတ်တမ်း အပြည့်အစုံ မဖတ်နိုင်သဖြင့် “ပြီးဆုံး” ဟု မမှတ်နိုင်ပါ။',
        en: 'Cannot mark completed: the full review history could not be loaded, so completion cannot be verified.',
      },
    };
  }
  if (input.needsManualTriage && input.confirmedRequiredDimensions.length === 0) {
    return {
      code: 'manual_triage_required',
      outstanding: [],
      message: {
        mm: 'ဤအကြောင်းအရာသည် လူကိုယ်တိုင် စိစစ်ရန် ကျန်နေသည်။ လိုအပ်သည့် စစ်ဆေးမှုများကို မန်နေဂျာက အတည်ပြုပြီးမှသာ “ပြီးဆုံး” ဟု မှတ်နိုင်သည်။',
        en: 'This record still needs manual triage. A manager must confirm its required review dimensions before it can be marked completed.',
      },
    };
  }
  const approved = new Set(input.approvedDimensionsAtCurrentRevision);
  const outstanding = input.confirmedRequiredDimensions.filter((dimension) => !approved.has(dimension));
  if (outstanding.length === 0) return null;
  return {
    code: 'outstanding_dimensions',
    outstanding,
    message: {
      mm: `“ပြီးဆုံး” ဟု မမှတ်နိုင်ပါ — လက်ရှိမူကွဲအတွက် စစ်ဆေးရန် ကျန်နေသေးသည်: ${outstanding.join(', ')}`,
      en: `Cannot mark completed — these required reviews are still outstanding for the current revision: ${outstanding.join(', ')}`,
    },
  };
}

export interface DashboardCounts {
  p0Remaining: number;
  p1Remaining: number;
  p2Remaining: number;
  p3Remaining: number;
  parentVisibleClassC: number;
  clinicalReviewsRequired: number;
  safetyReviewsRequired: number;
  myanmarReviewsRequired: number;
  correctionNeeded: number;
  manualTriageRequired: number;
  reviewRequested: number;
  /** ONLY genuine active assignments — never review requests. */
  currentlyAssigned: number;
  readyForRecheck: number;
  completed: number;
}

export interface CountableRow {
  priority: OwnerPriority;
  riskClass: RiskClass;
  clinicalStatus: string;
  priorityStatus: PriorityStatus;
  outstandingDimensions: string[];
  /** True only when a real reviewAssignment exists for this revision. */
  hasActiveAssignment: boolean;
}

export function dashboardCounts(rows: CountableRow[]): DashboardCounts {
  const remaining = (priority: OwnerPriority) =>
    rows.filter((row) => row.priority === priority && row.priorityStatus !== 'completed').length;
  const outstanding = (dimension: string) =>
    rows.filter((row) => row.outstandingDimensions.includes(dimension)).length;
  return {
    p0Remaining: remaining('P0'),
    p1Remaining: remaining('P1'),
    p2Remaining: remaining('P2'),
    p3Remaining: remaining('P3'),
    parentVisibleClassC: rows.filter((row) => row.riskClass === 'C' && isParentVisible(row.clinicalStatus)).length,
    clinicalReviewsRequired: outstanding('clinical'),
    safetyReviewsRequired: outstanding('safety'),
    myanmarReviewsRequired: outstanding('native_myanmar'),
    correctionNeeded: rows.filter((row) => row.priorityStatus === 'correction_needed').length,
    manualTriageRequired: rows.filter((row) => row.priorityStatus === 'manual_triage_required').length,
    reviewRequested: rows.filter((row) => row.priorityStatus === 'review_requested').length,
    // An assignment must be a real record, not a request. Counting requests
    // here would tell the owner reviewers are staffed when nobody is.
    currentlyAssigned: rows.filter((row) => row.hasActiveAssignment).length,
    readyForRecheck: rows.filter((row) => row.priorityStatus === 'ready_for_recheck').length,
    completed: rows.filter((row) => row.priorityStatus === 'completed').length,
  };
}
