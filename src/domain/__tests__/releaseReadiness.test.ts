import { describe, expect, it } from 'vitest';
import {
  assessAiPublication,
  assessAiPublicationSuccessor,
  assessOwnerMerge,
  assessOwnerMergeV2,
  currentLegalTermsReadiness,
  unresolvedStoppedClinicalBatches,
} from '../releaseReadiness';

describe('production release readiness classification', () => {
  it('blocks release while paid-access Terms are explicitly a draft', () => {
    expect(currentLegalTermsReadiness()).toMatchObject({
      level: 'blocked',
      code: 'legal_terms_draft',
    });
  });

  it('never treats a safely quarantined but drifted owner merge as finalizable', () => {
    expect(assessOwnerMerge({
      phase: 'blocked',
      blockers: ['canonical target user preimage drifted'],
      quarantineAuditFound: true,
      finalizeAuditFound: false,
      source: {
        authAccountCount: 0,
        sessionCount: 0,
        refreshTokenCount: 0,
        verifierCount: 0,
      },
    })).toMatchObject({
      level: 'blocked',
      code: 'owner_merge_requires_successor_plan',
    });
  });

  it('blocks an enabled AI control when any frozen release snapshot drifted', () => {
    expect(assessAiPublication({
      phase: 'drift',
      configEnabled: true,
      targets: [
        { slug: 'exact', appliedExact: true },
        { slug: 'changed-source', appliedExact: false },
      ],
    })).toEqual({
      level: 'blocked',
      code: 'ai_publication_fail_closed_drift',
      detail: 'The control is enabled but the release is fail-closed for: changed-source.',
    });
  });

  it('clears the owner gate only after the exact v2 audited postimage', () => {
    expect(assessOwnerMergeV2({
      phase: 'applied',
      blockers: [],
      v1QuarantineAuditFound: true,
      v2FinalizeAuditFound: true,
      sourceAuthenticationArtifactCount: 0,
      googleVerificationCodeCount: 0,
      sourceUnexpectedReferenceCategories: [],
    })).toMatchObject({ level: 'pass', code: 'owner_merge_v2_applied' });

    expect(assessOwnerMergeV2({
      phase: 'finalize_ready',
      blockers: [],
      v1QuarantineAuditFound: true,
      v2FinalizeAuditFound: false,
      sourceAuthenticationArtifactCount: 0,
      googleVerificationCodeCount: 0,
      sourceUnexpectedReferenceCategories: [],
    })).toMatchObject({ level: 'blocked', code: 'owner_merge_v2_finalize_ready' });
  });

  it('keeps a diagnostic AI successor blocked when any target verdict is blocked', () => {
    expect(assessAiPublicationSuccessor({
      phase: 'blocked',
      artifactExact: true,
      blockers: ['unrelated review note'],
      targets: [
        { slug: 'lsn_early_math', artifactVerdict: 'blocked' },
        { slug: 'st_waiting_at_clinic', artifactVerdict: 'pass' },
      ],
    })).toMatchObject({
      level: 'blocked',
      code: 'ai_publication_successor_blocked',
    });
  });

  it('does not count a stopped historical batch after its corrective successor completed', () => {
    expect(unresolvedStoppedClinicalBatches([
      { batchId: 'original', status: 'stopped_changes_requested' },
      { batchId: 'refreeze', status: 'completed', predecessorBatchId: 'original' },
      { batchId: 'still-stopped', status: 'stopped_changes_requested' },
    ])).toEqual(['still-stopped']);
  });
});
