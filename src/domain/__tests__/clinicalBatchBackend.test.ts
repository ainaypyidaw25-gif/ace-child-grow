import { describe, expect, it } from 'vitest';
import {
  normalizeClinicalBatchDecisionResult,
  readAssignedClinicalBatch,
} from '../../screens/contentReview/clinicalBatchBackend';

describe('clinical batch frontend boundary', () => {
  it('fails closed for malformed mutation responses', () => {
    expect(normalizeClinicalBatchDecisionResult(null)).toEqual({
      ok: false,
      code: 'unknown',
      message: 'The clinical decision response was invalid.',
    });
    expect(normalizeClinicalBatchDecisionResult({ ok: true, receipt: {} })).toEqual({
      ok: false,
      code: 'unknown',
      message: 'The clinical decision receipt was invalid.',
    });
  });

  it('preserves a valid decision receipt and server-issued handoff receipt', () => {
    expect(normalizeClinicalBatchDecisionResult({
      ok: true,
      receipt: {
        decision: 'approved',
        note: null,
        reviewedAt: 1,
        receiptId: 'review-1',
      },
      handoff: {
        batchId: 'batch-1',
        decisionCount: 2,
        completedAt: 2,
        digest: 'digest',
        receiptDigest: 'receipt-digest',
      },
    })).toEqual({
      ok: true,
      receipt: {
        decision: 'approved',
        note: null,
        reviewedAt: 1,
        receiptId: 'review-1',
      },
      handoff: {
        batchId: 'batch-1',
        decisionCount: 2,
        completedAt: 2,
        digest: 'digest',
        receiptDigest: 'receipt-digest',
      },
    });
  });

  it('rejects a changes-requested receipt without its required note', () => {
    expect(normalizeClinicalBatchDecisionResult({
      ok: true,
      receipt: {
        decision: 'changes_requested',
        note: '',
        reviewedAt: 1,
        receiptId: 'review-1',
      },
    })).toEqual({
      ok: false,
      code: 'unknown',
      message: 'The clinical decision receipt was invalid.',
    });
  });

  it('rejects a handoff attached to a non-approval decision', () => {
    expect(normalizeClinicalBatchDecisionResult({
      ok: true,
      receipt: {
        decision: 'changes_requested',
        note: 'Correct the threshold.',
        reviewedAt: 1,
        receiptId: 'review-1',
      },
      handoff: {
        batchId: 'batch-1',
        decisionCount: 2,
        completedAt: 2,
        digest: 'digest',
        receiptDigest: 'receipt-digest',
      },
    })).toEqual({
      ok: false,
      code: 'unknown',
      message: 'The clinical handoff receipt was invalid.',
    });
  });

  it('never treats a broad or missing payload as a reviewer assignment', () => {
    expect(readAssignedClinicalBatch(undefined, 'clinical_reviewer')).toEqual({ kind: 'loading' });
    expect(readAssignedClinicalBatch(null, 'clinical_reviewer')).toEqual({
      kind: 'unavailable',
      reason: 'backend_contract_missing',
    });
    expect(readAssignedClinicalBatch({ rows: [] }, 'clinical_reviewer')).toEqual({
      kind: 'invalid',
      reason: 'contract_identity_mismatch',
    });
  });
});
