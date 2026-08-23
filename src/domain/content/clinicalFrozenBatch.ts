export const CLINICAL_BATCH_CONTRACT = 'ace.clinical-frozen-batch' as const;
export const CLINICAL_BATCH_CONTRACT_VERSION = 1 as const;

export type ClinicalBatchDimension = 'clinical' | 'child_development' | 'safety';
export type ClinicalBatchDecision = 'approved' | 'changes_requested' | 'not_applicable';

export interface FrozenClinicalSnapshotField {
  path: string;
  labelMm: string;
  labelEn: string;
  valueMm: string | null;
  valueEn: string | null;
}

export interface FrozenClinicalSource {
  sourceId: string;
  org: string;
  title: string;
  year: number | null;
  url: string;
}

export interface FrozenClinicalSnapshot {
  digest: string;
  titleMm: string;
  titleEn: string;
  summaryMm: string | null;
  summaryEn: string | null;
  sources: FrozenClinicalSource[];
  fields: FrozenClinicalSnapshotField[];
}

export interface FrozenClinicalDecision {
  decision: ClinicalBatchDecision;
  note: string | null;
  reviewedAt: number;
  receiptId: string;
}

export interface FrozenClinicalBatchItem {
  assignmentId: string;
  slug: string;
  type: string;
  dimension: ClinicalBatchDimension;
  reviewRevision: number;
  liveReviewRevision: number;
  snapshot: FrozenClinicalSnapshot;
  decision: FrozenClinicalDecision | null;
}

export interface ClinicalHandoffReceipt {
  batchId: string;
  decisionCount: number;
  completedAt: number;
  digest: string;
  receiptDigest: string;
}

export interface FrozenClinicalBatch {
  contract: typeof CLINICAL_BATCH_CONTRACT;
  contractVersion: typeof CLINICAL_BATCH_CONTRACT_VERSION;
  scope: 'authenticated_assignee';
  batchId: string;
  lane: 'clinical';
  assignedRole: 'clinical_reviewer';
  frozenAt: number;
  freezeDigest: string;
  freezeReceiptDigest: string;
  items: FrozenClinicalBatchItem[];
  handoff: ClinicalHandoffReceipt | null;
}

export type ClinicalBatchLoadState =
  | { kind: 'loading' }
  | { kind: 'unavailable'; reason: 'backend_contract_missing' }
  | { kind: 'unauthorized'; reason: 'clinical_reviewer_required' }
  | { kind: 'invalid'; reason: string }
  | { kind: 'stale'; batch: FrozenClinicalBatch; assignmentIds: string[] }
  | { kind: 'ready'; batch: FrozenClinicalBatch };

export interface RecordClinicalBatchDecisionInput {
  batchId: string;
  assignmentId: string;
  contentSlug: string;
  dimension: ClinicalBatchDimension;
  decision: ClinicalBatchDecision;
  note?: string;
  expectedReviewRevision: number;
  expectedSnapshotDigest: string;
  expectedFreezeDigest: string;
}

export type RecordClinicalBatchDecisionResult =
  | {
      ok: true;
      receipt: FrozenClinicalDecision;
      handoff?: ClinicalHandoffReceipt;
    }
  | {
      ok: false;
      code:
        | 'backend_unavailable'
        | 'stale_revision'
        | 'assignment_expired'
        | 'assignment_not_found'
        | 'role_may_not_review_area'
        | 'qualification_required'
        | 'display_name_required'
        | 'note_required'
        | 'unknown';
      message: string;
      currentReviewRevision?: number;
    };

export type RecordClinicalBatchDecision = (
  input: RecordClinicalBatchDecisionInput,
) => Promise<RecordClinicalBatchDecisionResult>;

export function isClinicalBatchReviewerRole(role: string | null | undefined): role is 'clinical_reviewer' {
  return role === 'clinical_reviewer';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

function requiredNumber(record: Record<string, unknown>, key: string): number | null {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function nullableString(value: unknown): string | null | undefined {
  if (value === null) return null;
  return typeof value === 'string' ? value : undefined;
}

function isOpenableSourceUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function parseDecision(value: unknown): FrozenClinicalDecision | null | undefined {
  if (value === null || value === undefined) return null;
  if (!isRecord(value)) return undefined;
  const decision = value.decision;
  const note = nullableString(value.note);
  const reviewedAt = requiredNumber(value, 'reviewedAt');
  const receiptId = requiredString(value, 'receiptId');
  if (
    !['approved', 'changes_requested', 'not_applicable'].includes(String(decision)) ||
    note === undefined || reviewedAt === null || !receiptId
  ) return undefined;
  if (decision === 'changes_requested' && !note?.trim()) return undefined;
  return { decision: decision as ClinicalBatchDecision, note, reviewedAt, receiptId };
}

function parseSnapshot(value: unknown): FrozenClinicalSnapshot | null {
  if (!isRecord(value)) return null;
  const digest = requiredString(value, 'digest');
  const titleMm = requiredString(value, 'titleMm');
  const titleEn = requiredString(value, 'titleEn');
  const summaryMm = nullableString(value.summaryMm);
  const summaryEn = nullableString(value.summaryEn);
  const rawSources = value.sources;
  const rawFields = value.fields;
  if (
    !digest || !titleMm || !titleEn || summaryMm === undefined || summaryEn === undefined ||
    !Array.isArray(rawSources) || rawSources.length === 0 ||
    !Array.isArray(rawFields) || rawFields.length === 0
  ) return null;
  const sources: FrozenClinicalSource[] = [];
  const seenSourceIds = new Set<string>();
  for (const rawSource of rawSources) {
    if (!isRecord(rawSource)) return null;
    const sourceId = requiredString(rawSource, 'sourceId');
    const org = requiredString(rawSource, 'org');
    const title = requiredString(rawSource, 'title');
    const url = requiredString(rawSource, 'url');
    const year = rawSource.year;
    if (
      !sourceId || !org || !title || !url || !isOpenableSourceUrl(url) ||
      (year !== null && (typeof year !== 'number' || !Number.isInteger(year))) ||
      seenSourceIds.has(sourceId)
    ) return null;
    seenSourceIds.add(sourceId);
    sources.push({ sourceId, org, title, year: year as number | null, url });
  }
  const fields: FrozenClinicalSnapshotField[] = [];
  const seenPaths = new Set<string>();
  for (const rawField of rawFields) {
    if (!isRecord(rawField)) return null;
    const path = requiredString(rawField, 'path');
    const labelMm = requiredString(rawField, 'labelMm');
    const labelEn = requiredString(rawField, 'labelEn');
    const valueMm = nullableString(rawField.valueMm);
    const valueEn = nullableString(rawField.valueEn);
    if (
      !path || !labelMm || !labelEn || valueMm === undefined || valueEn === undefined ||
      (!valueMm?.trim() && !valueEn?.trim()) || seenPaths.has(path)
    ) return null;
    seenPaths.add(path);
    fields.push({ path, labelMm, labelEn, valueMm, valueEn });
  }
  return { digest, titleMm, titleEn, summaryMm, summaryEn, sources, fields };
}

function parseItem(value: unknown): FrozenClinicalBatchItem | null {
  if (!isRecord(value)) return null;
  const assignmentId = requiredString(value, 'assignmentId');
  const slug = requiredString(value, 'slug');
  const type = requiredString(value, 'type');
  const dimension = value.dimension;
  const reviewRevision = requiredNumber(value, 'reviewRevision');
  const liveReviewRevision = requiredNumber(value, 'liveReviewRevision');
  const snapshot = parseSnapshot(value.snapshot);
  const decision = parseDecision(value.decision);
  if (
    !assignmentId || !slug || !type ||
    !['clinical', 'child_development', 'safety'].includes(String(dimension)) ||
    reviewRevision === null || reviewRevision < 1 || !Number.isInteger(reviewRevision) ||
    liveReviewRevision === null || liveReviewRevision < 1 || !Number.isInteger(liveReviewRevision) ||
    !snapshot || decision === undefined
  ) return null;
  return {
    assignmentId,
    slug,
    type,
    dimension: dimension as ClinicalBatchDimension,
    reviewRevision,
    liveReviewRevision,
    snapshot,
    decision,
  };
}

function parseHandoff(value: unknown): ClinicalHandoffReceipt | null | undefined {
  if (value === null || value === undefined) return null;
  if (!isRecord(value)) return undefined;
  const batchId = requiredString(value, 'batchId');
  const decisionCount = requiredNumber(value, 'decisionCount');
  const completedAt = requiredNumber(value, 'completedAt');
  const digest = requiredString(value, 'digest');
  const receiptDigest = requiredString(value, 'receiptDigest');
  if (
    !batchId || decisionCount === null || decisionCount < 0 || !Number.isInteger(decisionCount) ||
    completedAt === null || !digest || !receiptDigest
  ) return undefined;
  return { batchId, decisionCount, completedAt, digest, receiptDigest };
}

/**
 * Converts the future server response into the only shape the clinical UI may
 * render. It deliberately refuses to derive assignments from the broad owner
 * priority queue: review requests, matching dimensions and catalogue rows are
 * not assignments and do not contain a frozen snapshot or server-issued
 * integrity receipt.
 */
export function adaptFrozenClinicalBatch(
  raw: unknown,
  currentRole: string | null | undefined,
): ClinicalBatchLoadState {
  if (!isClinicalBatchReviewerRole(currentRole)) {
    return { kind: 'unauthorized', reason: 'clinical_reviewer_required' };
  }
  if (raw === undefined) return { kind: 'loading' };
  if (raw === null) return { kind: 'unavailable', reason: 'backend_contract_missing' };
  if (!isRecord(raw)) return { kind: 'invalid', reason: 'contract_not_an_object' };
  if (raw.status === 'refused') {
    if (raw.code === 'not_authenticated' || raw.code === 'not_assigned_reviewer') {
      return { kind: 'unauthorized', reason: 'clinical_reviewer_required' };
    }
    if (raw.code === 'assignment_expired') {
      return { kind: 'invalid', reason: 'assignment_expired' };
    }
    return { kind: 'invalid', reason: 'batch_preflight_failed' };
  }
  if (
    raw.contract !== CLINICAL_BATCH_CONTRACT ||
    raw.contractVersion !== CLINICAL_BATCH_CONTRACT_VERSION ||
    raw.scope !== 'authenticated_assignee' ||
    raw.lane !== 'clinical' ||
    raw.assignedRole !== 'clinical_reviewer'
  ) return { kind: 'invalid', reason: 'contract_identity_mismatch' };

  const batchId = requiredString(raw, 'batchId');
  const frozenAt = requiredNumber(raw, 'frozenAt');
  const freezeDigest = requiredString(raw, 'freezeDigest');
  const freezeReceiptDigest = requiredString(raw, 'freezeReceiptDigest');
  if (!batchId || frozenAt === null || !freezeDigest || !freezeReceiptDigest || !Array.isArray(raw.items) || raw.items.length === 0) {
    return { kind: 'invalid', reason: 'incomplete_freeze_manifest' };
  }

  const parsedItems = raw.items.map(parseItem);
  if (parsedItems.some((item) => item === null)) return { kind: 'invalid', reason: 'invalid_batch_item' };
  const items = parsedItems as FrozenClinicalBatchItem[];
  const assignmentIds = new Set<string>();
  const exactTargets = new Set<string>();
  for (const item of items) {
    const exactTarget = `${item.slug}:${item.dimension}:r${item.reviewRevision}`;
    if (assignmentIds.has(item.assignmentId) || exactTargets.has(exactTarget)) {
      return { kind: 'invalid', reason: 'duplicate_exact_target' };
    }
    assignmentIds.add(item.assignmentId);
    exactTargets.add(exactTarget);
  }

  const handoff = parseHandoff(raw.handoff);
  if (handoff === undefined) return { kind: 'invalid', reason: 'invalid_handoff' };
  if (handoff && (
    handoff.batchId !== batchId || handoff.decisionCount !== items.length ||
    items.some((item) => item.decision?.decision !== 'approved')
  )) return { kind: 'invalid', reason: 'handoff_does_not_cover_batch' };

  const batch: FrozenClinicalBatch = {
    contract: CLINICAL_BATCH_CONTRACT,
    contractVersion: CLINICAL_BATCH_CONTRACT_VERSION,
    scope: 'authenticated_assignee',
    batchId,
    lane: 'clinical',
    assignedRole: 'clinical_reviewer',
    frozenAt,
    freezeDigest,
    freezeReceiptDigest,
    items,
    handoff,
  };
  const staleAssignments = items
    .filter((item) => item.liveReviewRevision !== item.reviewRevision)
    .map((item) => item.assignmentId);
  if (staleAssignments.length > 0) return { kind: 'stale', batch, assignmentIds: staleAssignments };
  return { kind: 'ready', batch };
}
