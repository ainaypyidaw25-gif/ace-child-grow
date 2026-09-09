import { describe, expect, it } from 'vitest';
import {
  normalizeClinicalBatchDecisionResult,
  readAssignedClinicalBatch,
} from '../../screens/contentReview/clinicalBatchBackend';

function assignedBatch(overrides: Record<string, unknown> = {}) {
  return {
    contract: 'ace.clinical-frozen-batch',
    contractVersion: 1,
    scope: 'authenticated_assignee',
    batchId: 'batch-1',
    lane: 'clinical',
    assignedRole: 'clinical_reviewer',
    frozenAt: 1,
    freezeDigest: 'freeze-digest',
    freezeReceiptDigest: 'freeze-receipt-digest',
    allowedDecisions: ['approved', 'changes_requested'],
    items: [{
      assignmentId: 'assignment-1',
      slug: 'safe-sleep',
      type: 'guide',
      dimension: 'clinical',
      reviewRevision: 1,
      liveReviewRevision: 1,
      snapshot: {
        digest: 'snapshot-digest',
        titleMm: 'ဘေးကင်းစွာ အိပ်စက်ခြင်း',
        titleEn: 'Safe sleep',
        summaryMm: null,
        summaryEn: null,
        reviewerAdvisory: null,
        sources: [{
          sourceId: 'source-1',
          org: 'AAP',
          title: 'Safe Sleep Recommendations',
          year: 2022,
          url: 'https://example.test/source-1',
        }],
        fields: [{
          path: 'data.body',
          labelMm: 'အကြောင်းအရာ',
          labelEn: 'Content',
          valueMm: 'Frozen Myanmar copy',
          valueEn: 'Frozen English copy',
        }],
      },
      decision: null,
    }],
    handoff: null,
    ...overrides,
  };
}

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

  it('preserves the frozen-release decision-not-allowed refusal code', () => {
    expect(normalizeClinicalBatchDecisionResult({
      ok: false,
      code: 'decision_not_allowed',
      message: 'Not applicable is not a valid release decision.',
    })).toEqual({
      ok: false,
      code: 'decision_not_allowed',
      message: 'Not applicable is not a valid release decision.',
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

  it('preserves the server-authoritative release and pilot decision sets', () => {
    const release = readAssignedClinicalBatch(assignedBatch(), 'clinical_reviewer');
    expect(release).toEqual(expect.objectContaining({
      kind: 'ready',
      batch: expect.objectContaining({
        allowedDecisions: ['approved', 'changes_requested'],
      }),
    }));

    const pilot = readAssignedClinicalBatch(assignedBatch({
      allowedDecisions: ['approved', 'changes_requested', 'not_applicable'],
    }), 'clinical_reviewer');
    expect(pilot).toEqual(expect.objectContaining({
      kind: 'ready',
      batch: expect.objectContaining({
        allowedDecisions: ['approved', 'changes_requested', 'not_applicable'],
      }),
    }));
  });

  it('fails closed when the assigned-batch result omits allowed decisions', () => {
    const raw = assignedBatch() as Record<string, unknown>;
    delete raw.allowedDecisions;
    expect(readAssignedClinicalBatch(raw, 'clinical_reviewer')).toEqual({
      kind: 'invalid',
      reason: 'incomplete_freeze_manifest',
    });
  });

  it('preserves in-band assignment refusals instead of reporting a backend outage', () => {
    expect(readAssignedClinicalBatch({
      status: 'refused',
      code: 'not_assigned_reviewer',
      message: 'Use the assigned clinical reviewer account.',
    }, 'clinical_reviewer')).toEqual({
      kind: 'unauthorized',
      reason: 'assigned_reviewer_required',
    });
    expect(readAssignedClinicalBatch({
      status: 'refused',
      code: 'assignment_expired',
      message: 'Refreeze the assignment.',
    }, 'clinical_reviewer')).toEqual({
      kind: 'invalid',
      reason: 'assignment_expired',
    });
  });
});
