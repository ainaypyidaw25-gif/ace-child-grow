import { describe, expect, it } from 'vitest';
import {
  assessAiPublication,
  assessAiPublicationSuccessor,
  assessEvidenceSourceReadiness,
  assessSixPictureStoriesPostflight,
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

  it('passes only the exact current six-picture-story postflight', () => {
    const identity = {
      releaseRoot: '2026-09-10-six-picture-stories-ai-preview-v1',
      artifactHash: 'a'.repeat(64),
      snapshotSha256: 'b'.repeat(64),
    };
    expect(assessSixPictureStoriesPostflight({
      ...identity,
      phase: 'enabled',
      activeReleaseCount: 24,
      previousReadable: true,
      expiryScheduleExact: true,
      parentReadable: true,
      blockers: [],
      targets: [
        { slug: 'act_picture_story_2_5y', reviewRevision: 6, parentReadable: true },
        { slug: 'act_picture_story_3y', reviewRevision: 6, parentReadable: true },
        { slug: 'act_picture_story_3_5y', reviewRevision: 7, parentReadable: true },
        { slug: 'act_picture_story_4y', reviewRevision: 6, parentReadable: true },
        { slug: 'act_picture_story_4_5y', reviewRevision: 6, parentReadable: true },
        { slug: 'act_picture_story_5y', reviewRevision: 6, parentReadable: true },
      ],
    }, identity)).toMatchObject({
      level: 'pass',
      code: 'ai_six_picture_stories_postflight_exact',
    });
  });

  it.each([
    'identity',
    'phase',
    'count',
    'previous',
    'expiry',
    'parent',
    'target',
    'blocker',
  ] as const)('fails closed when current six-picture-story postflight drifts: %s', (drift) => {
    const identity = {
      releaseRoot: '2026-09-10-six-picture-stories-ai-preview-v1',
      artifactHash: 'a'.repeat(64),
      snapshotSha256: 'b'.repeat(64),
    };
    const snapshot = {
      ...identity,
      phase: 'enabled' as const,
      activeReleaseCount: 24,
      previousReadable: true,
      expiryScheduleExact: true,
      parentReadable: true,
      blockers: [] as string[],
      targets: [
        { slug: 'act_picture_story_2_5y', reviewRevision: 6, parentReadable: true },
        { slug: 'act_picture_story_3y', reviewRevision: 6, parentReadable: true },
        { slug: 'act_picture_story_3_5y', reviewRevision: 7, parentReadable: true },
        { slug: 'act_picture_story_4y', reviewRevision: 6, parentReadable: true },
        { slug: 'act_picture_story_4_5y', reviewRevision: 6, parentReadable: true },
        { slug: 'act_picture_story_5y', reviewRevision: 6, parentReadable: true },
      ],
    };
    if (drift === 'identity') snapshot.artifactHash = 'c'.repeat(64);
    if (drift === 'phase') (snapshot as { phase: string }).phase = 'staged';
    if (drift === 'count') snapshot.activeReleaseCount = 23;
    if (drift === 'previous') snapshot.previousReadable = false;
    if (drift === 'expiry') snapshot.expiryScheduleExact = false;
    if (drift === 'parent') snapshot.parentReadable = false;
    if (drift === 'target') snapshot.targets[2].reviewRevision = 6;
    if (drift === 'blocker') snapshot.blockers.push('runtime drift');
    expect(assessSixPictureStoriesPostflight(snapshot as never, identity)).toMatchObject({
      level: 'blocked',
      code: 'ai_six_picture_stories_postflight_blocked',
    });
  });

  it('does not count a stopped historical batch after its corrective successor completed', () => {
    expect(unresolvedStoppedClinicalBatches([
      { batchId: 'original', status: 'stopped_changes_requested' },
      { batchId: 'refreeze', status: 'completed', predecessorBatchId: 'original' },
      { batchId: 'still-stopped', status: 'stopped_changes_requested' },
    ])).toEqual(['still-stopped']);
  });

  it('blocks conventional published content with non-approved evidence', () => {
    const assessment = assessEvidenceSourceReadiness({
      aiPublicationExact: true,
      sources: [{ sourceId: 'awaiting-conventional', reviewStatus: 'awaiting_review' }],
      dependencies: [{
        sourceId: 'awaiting-conventional',
        contentSlug: 'published-guide',
        contentStatus: 'published',
        contentExists: true,
        targetJoinExact: true,
        aiReleaseActive: false,
        aiSourceSnapshotExact: false,
      }],
    });
    expect(assessment.conventionalPublic).toMatchObject({
      level: 'blocked',
      code: 'conventional_public_source_not_approved',
    });
    expect(assessment.sourceIds.blockedConventionalPublic).toEqual([
      'awaiting-conventional',
    ]);
  });

  it('blocks an evidence link whose source row is missing', () => {
    const assessment = assessEvidenceSourceReadiness({
      aiPublicationExact: true,
      sources: [],
      dependencies: [{
        sourceId: 'missing-source',
        contentSlug: 'published-guide',
        contentStatus: 'published',
        contentExists: true,
        targetJoinExact: true,
        aiReleaseActive: false,
        aiSourceSnapshotExact: false,
      }],
    });
    expect(assessment.missingSources).toMatchObject({
      level: 'blocked',
      code: 'evidence_link_source_missing',
    });
    expect(assessment.sourceIds.missing).toEqual(['missing-source']);
  });

  it('blocks duplicate source IDs and ambiguous target joins', () => {
    const assessment = assessEvidenceSourceReadiness({
      aiPublicationExact: true,
      sources: [
        { sourceId: 'duplicate-source', reviewStatus: 'awaiting_review' },
        { sourceId: 'duplicate-source', reviewStatus: 'awaiting_review' },
      ],
      dependencies: [{
        sourceId: 'duplicate-source',
        contentSlug: 'duplicate-target',
        contentStatus: 'clinical_review',
        contentExists: true,
        targetJoinExact: false,
        aiReleaseActive: false,
        aiSourceSnapshotExact: false,
      }],
    });
    expect(assessment.duplicateSources).toMatchObject({
      level: 'blocked',
      code: 'evidence_source_id_duplicate',
    });
    expect(assessment.ambiguousTargets).toMatchObject({
      level: 'blocked',
      code: 'evidence_target_join_ambiguous',
    });
  });

  it('allows an awaiting source only through an exact disclosed AI gate', () => {
    const input = {
      aiPublicationExact: true,
      sources: [{ sourceId: 'ai-audited-source', reviewStatus: 'awaiting_review' }],
      dependencies: [{
        sourceId: 'ai-audited-source',
        contentSlug: 'ai-preview',
        contentStatus: 'clinical_review',
        contentExists: true,
        targetJoinExact: true,
        aiReleaseActive: true,
        aiSourceSnapshotExact: true,
      }],
    };
    expect(assessEvidenceSourceReadiness(input)).toMatchObject({
      aiPreview: {
        level: 'pass',
        code: 'ai_preview_sources_exact_without_human_approval',
      },
      sourceIds: { exactAiPreview: ['ai-audited-source'] },
    });
    expect(assessEvidenceSourceReadiness({
      ...input,
      aiPublicationExact: false,
    })).toMatchObject({
      aiPreview: {
        level: 'blocked',
        code: 'ai_preview_source_gate_not_exact',
      },
      sourceIds: { blockedAiPreview: ['ai-audited-source'] },
    });
    expect(assessEvidenceSourceReadiness({
      ...input,
      dependencies: [{ ...input.dependencies[0], aiSourceSnapshotExact: false }],
    }).aiPreview).toMatchObject({ level: 'blocked' });
  });

  it('reports awaiting evidence linked only to unpublished content as advisory', () => {
    const assessment = assessEvidenceSourceReadiness({
      aiPublicationExact: true,
      sources: [{ sourceId: 'unpublished-source', reviewStatus: 'awaiting_review' }],
      dependencies: [{
        sourceId: 'unpublished-source',
        contentSlug: 'clinical-review-guide',
        contentStatus: 'clinical_review',
        contentExists: true,
        targetJoinExact: true,
        aiReleaseActive: false,
        aiSourceSnapshotExact: false,
      }],
    });
    expect(assessment.unpublishedBacklog).toMatchObject({
      level: 'advisory',
      code: 'evidence_awaiting_unpublished_backlog',
    });
    expect(assessment.sourceIds.unpublishedBacklog).toEqual([
      'unpublished-source',
    ]);
  });

  it('does not block on an unlinked awaiting source', () => {
    const assessment = assessEvidenceSourceReadiness({
      aiPublicationExact: true,
      sources: [{ sourceId: 'unused-awaiting-source', reviewStatus: 'awaiting_review' }],
      dependencies: [],
    });
    expect(assessment.unlinked).toMatchObject({
      level: 'pass',
      code: 'unlinked_nonapproved_sources_not_blocking',
    });
    expect(assessment.sourceIds.unlinked).toEqual(['unused-awaiting-source']);
    expect([
      assessment.conventionalPublic,
      assessment.aiPreview,
      assessment.unpublishedBacklog,
    ]).toEqual(expect.not.arrayContaining([
      expect.objectContaining({ level: 'blocked' }),
      expect.objectContaining({ level: 'advisory' }),
    ]));
  });
});
