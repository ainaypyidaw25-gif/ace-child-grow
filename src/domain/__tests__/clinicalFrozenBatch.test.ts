import { describe, expect, it } from 'vitest';
import {
  adaptFrozenClinicalBatch,
  CLINICAL_BATCH_CONTRACT,
  CLINICAL_BATCH_CONTRACT_VERSION,
} from '../content/clinicalFrozenBatch';

function contract(overrides: Record<string, unknown> = {}) {
  return {
    contract: CLINICAL_BATCH_CONTRACT,
    contractVersion: CLINICAL_BATCH_CONTRACT_VERSION,
    scope: 'authenticated_assignee',
    batchId: 'clinical-2026-08-23-a',
    lane: 'clinical',
    assignedRole: 'clinical_reviewer',
    frozenAt: 1_787_500_000_000,
    freezeDigest: 'sha256:freeze-a',
    freezeSignature: 'server-signature-a',
    items: [
      {
        assignmentId: 'assignment-a',
        slug: 'safe-sleep-a',
        type: 'guide',
        dimension: 'clinical',
        reviewRevision: 4,
        liveReviewRevision: 4,
        snapshot: {
          digest: 'sha256:snapshot-a',
          titleMm: 'အိပ်စက်ဘေးကင်းရေး',
          titleEn: 'Safe sleep',
          summaryMm: 'Frozen Myanmar copy',
          summaryEn: 'Frozen English copy',
          sourceTitles: ['AAP Safe Sleep Recommendations'],
          fields: [{
            path: 'data.body',
            labelMm: 'အကြောင်းအရာ',
            labelEn: 'Content',
            valueMm: 'Frozen Myanmar body',
            valueEn: 'Frozen English body',
          }],
        },
        decision: null,
      },
    ],
    handoff: null,
    ...overrides,
  };
}

describe('frozen clinical batch adapter', () => {
  it('fails closed when the server contract is absent or the account role is wrong', () => {
    expect(adaptFrozenClinicalBatch(null, 'clinical_reviewer')).toEqual({
      kind: 'unavailable',
      reason: 'backend_contract_missing',
    });
    expect(adaptFrozenClinicalBatch(contract(), 'owner')).toEqual({
      kind: 'unauthorized',
      reason: 'clinical_reviewer_required',
    });
  });

  it('does not reinterpret a broad owner-priority queue as an assignment', () => {
    const state = adaptFrozenClinicalBatch({
      allowed: true,
      accessLevel: 'assignment_scoped',
      rows: [{ slug: 'safe-sleep-a', requiredReviewDimensions: ['clinical'] }],
    }, 'clinical_reviewer');
    expect(state).toEqual({ kind: 'invalid', reason: 'contract_identity_mismatch' });
  });

  it('accepts unique exact targets and preserves their frozen revision and digest', () => {
    const state = adaptFrozenClinicalBatch(contract(), 'clinical_reviewer');
    expect(state.kind).toBe('ready');
    if (state.kind !== 'ready') return;
    expect(state.batch.items).toEqual([
      expect.objectContaining({
        assignmentId: 'assignment-a',
        slug: 'safe-sleep-a',
        dimension: 'clinical',
        reviewRevision: 4,
        liveReviewRevision: 4,
        snapshot: expect.objectContaining({ digest: 'sha256:snapshot-a' }),
      }),
    ]);
  });

  it('accepts the qualification-gated child-development dimension in the clinical lane', () => {
    const raw = contract();
    (raw.items as Array<Record<string, unknown>>)[0].dimension = 'child_development';
    const state = adaptFrozenClinicalBatch(raw, 'clinical_reviewer');
    expect(state.kind).toBe('ready');
    if (state.kind === 'ready') expect(state.batch.items[0].dimension).toBe('child_development');
  });

  it('stops the whole batch when any live revision differs from its frozen revision', () => {
    const raw = contract();
    const item = (raw.items as Array<Record<string, unknown>>)[0];
    item.liveReviewRevision = 5;
    const state = adaptFrozenClinicalBatch(raw, 'clinical_reviewer');
    expect(state).toEqual(expect.objectContaining({
      kind: 'stale',
      assignmentIds: ['assignment-a'],
    }));
  });

  it('rejects duplicate exact targets and handoffs that do not cover every item', () => {
    const first = (contract().items as Array<Record<string, unknown>>)[0];
    const duplicate = { ...first, assignmentId: 'assignment-b' };
    expect(adaptFrozenClinicalBatch(contract({ items: [first, duplicate] }), 'clinical_reviewer')).toEqual({
      kind: 'invalid',
      reason: 'duplicate_exact_target',
    });

    expect(adaptFrozenClinicalBatch(contract({
      handoff: {
        batchId: 'clinical-2026-08-23-a',
        decisionCount: 1,
        completedAt: 1_787_500_100_000,
        digest: 'sha256:handoff',
        signature: 'handoff-signature',
      },
    }), 'clinical_reviewer')).toEqual({ kind: 'invalid', reason: 'handoff_does_not_cover_batch' });
  });
});
