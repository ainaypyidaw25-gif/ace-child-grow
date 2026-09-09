import {
  adaptFrozenClinicalBatch,
  type ClinicalBatchLoadState,
  type RecordClinicalBatchDecisionResult,
} from '../../domain/content/clinicalFrozenBatch';

const REFUSAL_CODES = new Set([
  'backend_unavailable',
  'stale_revision',
  'assignment_expired',
  'assignment_not_found',
  'role_may_not_review_area',
  'qualification_required',
  'display_name_required',
  'note_required',
  'decision_not_allowed',
  'unknown',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Adapts only the session-scoped frozen-batch query. The broad ownerPriority
 * queue is never accepted as an assignment source.
 */
export function readAssignedClinicalBatch(
  raw: unknown,
  currentRole: string | null | undefined,
): ClinicalBatchLoadState {
  return adaptFrozenClinicalBatch(raw, currentRole);
}

/**
 * Treats every malformed or unexpected mutation response as a refusal. This
 * keeps the reviewer UI fail-closed even if a deployment returns a stale
 * contract shape.
 */
export function normalizeClinicalBatchDecisionResult(raw: unknown): RecordClinicalBatchDecisionResult {
  if (!isRecord(raw) || typeof raw.ok !== 'boolean') {
    return { ok: false, code: 'unknown', message: 'The clinical decision response was invalid.' };
  }
  if (raw.ok === false) {
    const code = typeof raw.code === 'string' && REFUSAL_CODES.has(raw.code) ? raw.code : 'unknown';
    return {
      ok: false,
      code: code as Exclude<RecordClinicalBatchDecisionResult, { ok: true }>['code'],
      message: typeof raw.message === 'string' && raw.message.trim()
        ? raw.message
        : 'The clinical decision was refused.',
      ...(typeof raw.currentReviewRevision === 'number'
        ? { currentReviewRevision: raw.currentReviewRevision }
        : {}),
    };
  }

  const receipt = raw.receipt;
  if (!isRecord(receipt)
    || !['approved', 'changes_requested', 'not_applicable'].includes(String(receipt.decision))
    || (receipt.note !== null && typeof receipt.note !== 'string')
    || typeof receipt.reviewedAt !== 'number'
    || typeof receipt.receiptId !== 'string'
    || !receipt.receiptId.trim()
    || (receipt.decision === 'changes_requested' && (typeof receipt.note !== 'string' || !receipt.note.trim()))
  ) {
    return { ok: false, code: 'unknown', message: 'The clinical decision receipt was invalid.' };
  }

  const handoff = raw.handoff;
  if (handoff !== undefined && (!isRecord(handoff)
    || typeof handoff.batchId !== 'string' || !handoff.batchId.trim()
    || typeof handoff.decisionCount !== 'number' || !Number.isInteger(handoff.decisionCount) || handoff.decisionCount < 1
    || typeof handoff.completedAt !== 'number' || !Number.isFinite(handoff.completedAt)
    || typeof handoff.digest !== 'string' || !handoff.digest.trim()
    || typeof handoff.receiptDigest !== 'string' || !handoff.receiptDigest.trim()
    || receipt.decision !== 'approved'
  )) {
    return { ok: false, code: 'unknown', message: 'The clinical handoff receipt was invalid.' };
  }

  return {
    ok: true,
    receipt: {
      decision: receipt.decision as 'approved' | 'changes_requested' | 'not_applicable',
      note: receipt.note as string | null,
      reviewedAt: receipt.reviewedAt,
      receiptId: receipt.receiptId,
    },
    ...(isRecord(handoff) ? {
      handoff: {
        batchId: handoff.batchId as string,
        decisionCount: handoff.decisionCount as number,
        completedAt: handoff.completedAt as number,
        digest: handoff.digest as string,
        receiptDigest: handoff.receiptDigest as string,
      },
    } : {}),
  };
}
