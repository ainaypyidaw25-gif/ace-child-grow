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
  | 'correction_needed'
  | 'assigned'
  | 'in_review'
  | 'corrected'
  | 'ready_for_recheck'
  | 'completed';

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

function searchableText(record: ClassifiableRecord): string {
  return [
    record.slug, record.titleEn, record.titleMm, record.summaryEn ?? '', record.summaryMm ?? '',
    (record.tags ?? []).join(' '), record.category ?? '', record.domainKey ?? '',
    JSON.stringify(record.data ?? {}),
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
  const pendingClinicalReferences = /pending clinical reviewer/i.test(JSON.stringify((record.data as Record<string, unknown> | null)?.references ?? ''));

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

/** Required review dimensions per class (task Part 3 policy). */
export function requiredDimensionsFor(riskClass: RiskClass): RequiredDimension[] {
  const base: RequiredDimension[] = ['native_myanmar', 'english', 'child_development', 'evidence'];
  if (riskClass === 'B') return [...base, 'safety'];
  if (riskClass === 'C') return [...base, 'safety', 'clinical'];
  // D and E do not auto-decide dimensions: D goes to manual manager triage,
  // E to a manager decision. Returning the full set errs on the safe side and
  // never marks anything not_required.
  if (riskClass === 'D' || riskClass === 'E') return [...base, 'safety', 'clinical'];
  return base;
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
    reasons.push('parent-visible while its own text says clinical references are pending');
  }

  if (!priority) {
    if (riskClass === 'C' || riskClass === 'D' || riskClass === 'E') {
      priority = visible ? 'P1' : 'P2';
      reasons.push(visible
        ? 'parent-visible clinical/safety-sensitive record awaiting clinical review'
        : 'unpublished clinical/safety-sensitive record');
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
    currentlyAssigned: rows.filter((row) => row.priorityStatus === 'assigned' || row.priorityStatus === 'in_review').length,
    readyForRecheck: rows.filter((row) => row.priorityStatus === 'ready_for_recheck').length,
    completed: rows.filter((row) => row.priorityStatus === 'completed').length,
  };
}
