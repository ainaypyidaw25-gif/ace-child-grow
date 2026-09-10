import { describe, expect, it } from 'vitest';
import {
  assessAiPublication,
  assessAiPublicationSuccessor,
  assessOwnerMerge,
  assessOwnerMergeV2,
  currentLegalTermsReadiness,
  unresolvedStoppedClinicalBatches,
} from '../releaseReadiness';
import {
  LEGAL_TERMS_TEXT_SHA256,
  type LegalTermsRelease,
} from '../legalRelease';

const validPublishedTerms: LegalTermsRelease = {
  status: 'published',
  version: 'terms-2026-09-15-v1',
  effectiveDate: '2026-09-15',
  publishedAt: '2026-09-14T12:00:00.000Z',
  textDigest: LEGAL_TERMS_TEXT_SHA256,
  approvalReceipt: {
    receiptId: 'test-terms-approval-2026-09-15-v1',
    approverId: 'test_owner_stable_id',
    authority: 'owner',
    approvedAt: '2026-09-14T11:30:00.000Z',
    version: 'terms-2026-09-15-v1',
    effectiveDate: '2026-09-15',
    textDigest: LEGAL_TERMS_TEXT_SHA256,
  },
};

describe('production release readiness classification', () => {
  it('blocks release while paid-access Terms are explicitly a draft', () => {
    expect(currentLegalTermsReadiness({
      ...validPublishedTerms,
      status: 'draft',
      version: 'draft-2026-08-05',
      effectiveDate: null,
      publishedAt: null,
      approvalReceipt: null,
    })).toMatchObject({
      level: 'blocked',
      code: 'legal_terms_draft',
    });
  });

  it('recognizes the current Owner-approved Terms publication', () => {
    expect(currentLegalTermsReadiness()).toMatchObject({
      level: 'pass',
      code: 'legal_terms_published',
    });
  });

  it('passes only a published release with an exact-text approval receipt', () => {
    expect(currentLegalTermsReadiness(validPublishedTerms)).toEqual({
      level: 'pass',
      code: 'legal_terms_published',
      detail: 'Terms terms-2026-09-15-v1 have an exact-text approval receipt, effective date and publication time.',
    });
  });

  it('does not treat a status typo as publication', () => {
    const typo = { ...validPublishedTerms, status: 'approved' } as unknown as LegalTermsRelease;
    expect(currentLegalTermsReadiness(typo)).toMatchObject({
      level: 'blocked',
      code: 'legal_terms_invalid_release',
    });
  });

  it.each([
    ['bad version', { version: '2026-09-15' }],
    ['impossible effective date', { effectiveDate: '2026-02-30' }],
    ['non-canonical publication time', { publishedAt: '2026-09-14T12:00:00Z' }],
    ['wrong text digest', { textDigest: `sha256:${'0'.repeat(64)}` }],
  ])('blocks a published release with %s', (_label, patch) => {
    expect(currentLegalTermsReadiness({ ...validPublishedTerms, ...patch })).toMatchObject({
      level: 'blocked',
      code: 'legal_terms_invalid_release',
    });
  });

  it('binds the receipt to the exact version, effective date and text digest', () => {
    expect(currentLegalTermsReadiness({
      ...validPublishedTerms,
      approvalReceipt: {
        ...validPublishedTerms.approvalReceipt!,
        version: 'terms-2026-09-15-v2',
        effectiveDate: '2026-09-16',
        textDigest: `sha256:${'f'.repeat(64)}`,
      },
    })).toMatchObject({
      level: 'blocked',
      code: 'legal_terms_invalid_release',
    });
  });

  it.each([
    ['missing receipt', { approvalReceipt: null }],
    ['email instead of stable approver ID', {
      approvalReceipt: {
        ...validPublishedTerms.approvalReceipt!,
        approverId: 'owner@example.com',
      },
    }],
  ])('blocks a published release with %s', (_label, patch) => {
    expect(currentLegalTermsReadiness({ ...validPublishedTerms, ...patch })).toMatchObject({
      level: 'blocked',
      code: 'legal_terms_invalid_release',
    });
  });

  it.each([
    ['approval after publication', {
      approvalReceipt: {
        ...validPublishedTerms.approvalReceipt!,
        approvedAt: '2026-09-14T12:00:00.001Z',
      },
    }],
    ['publication after effective date', {
      publishedAt: '2026-09-16T00:00:00.000Z',
    }],
    ['publication after the effective-day boundary', {
      publishedAt: '2026-09-15T00:00:00.001Z',
    }],
  ])('blocks invalid legal-release ordering: %s', (_label, patch) => {
    expect(currentLegalTermsReadiness({ ...validPublishedTerms, ...patch })).toMatchObject({
      level: 'blocked',
      code: 'legal_terms_invalid_release',
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
