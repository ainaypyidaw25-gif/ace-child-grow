import { LEGAL_TERMS_RELEASE } from './legalRelease';

export type ReadinessLevel = 'pass' | 'blocked' | 'advisory';

export type ReadinessFinding = {
  level: ReadinessLevel;
  code: string;
  detail: string;
};

export function currentLegalTermsReadiness(): ReadinessFinding {
  if (
    LEGAL_TERMS_RELEASE.status === 'draft'
    || LEGAL_TERMS_RELEASE.effectiveDate === null
    || LEGAL_TERMS_RELEASE.publishedAt === null
  ) {
    return {
      level: 'blocked',
      code: 'legal_terms_draft',
      detail: `Terms ${LEGAL_TERMS_RELEASE.version} remain a non-binding draft and require Owner/legal approval, an effective date, and versioned publication.`,
    };
  }
  return {
    level: 'pass',
    code: 'legal_terms_published',
    detail: `Terms ${LEGAL_TERMS_RELEASE.version} have a recorded effective date and publication time.`,
  };
}

type IdentityState = {
  authAccountCount: number;
  sessionCount: number;
  refreshTokenCount: number;
  verifierCount: number;
};

export type OwnerMergePreflight = {
  phase: 'quarantine_ready' | 'quarantined_waiting' | 'finalize_ready' | 'blocked' | 'applied';
  blockers: string[];
  quarantineAuditFound: boolean;
  finalizeAuditFound: boolean;
  source: IdentityState;
};

export function assessOwnerMerge(snapshot: OwnerMergePreflight): ReadinessFinding {
  if (snapshot.phase === 'applied' && snapshot.finalizeAuditFound) {
    return {
      level: 'pass',
      code: 'owner_merge_applied',
      detail: 'The exact owner-account merge has a verified finalization audit.',
    };
  }

  const sourceCredentialsDrained = snapshot.quarantineAuditFound
    && snapshot.source.authAccountCount === 0
    && snapshot.source.sessionCount === 0
    && snapshot.source.refreshTokenCount === 0
    && snapshot.source.verifierCount === 0;

  if (snapshot.phase === 'blocked' && sourceCredentialsDrained) {
    return {
      level: 'blocked',
      code: 'owner_merge_requires_successor_plan',
      detail: [
        'The duplicate login is still quarantined, but finalization must not run from the drifted v1 snapshot.',
        'Freeze a new immutable successor preimage before any data move.',
        ...snapshot.blockers,
      ].join(' '),
    };
  }

  return {
    level: 'blocked',
    code: `owner_merge_${snapshot.phase}`,
    detail: snapshot.blockers.length > 0
      ? snapshot.blockers.join('; ')
      : 'The exact owner-account merge is not finalized.',
  };
}

export type OwnerMergeV2Preflight = {
  phase: 'finalize_ready' | 'blocked' | 'applied';
  blockers: string[];
  v1QuarantineAuditFound: boolean;
  v2FinalizeAuditFound: boolean;
  sourceAuthenticationArtifactCount: number;
  googleVerificationCodeCount: number;
  sourceUnexpectedReferenceCategories: string[];
};

export function assessOwnerMergeV2(snapshot: OwnerMergeV2Preflight): ReadinessFinding {
  if (
    snapshot.phase === 'applied'
    && snapshot.v1QuarantineAuditFound
    && snapshot.v2FinalizeAuditFound
    && snapshot.sourceAuthenticationArtifactCount === 0
    && snapshot.googleVerificationCodeCount === 0
    && snapshot.sourceUnexpectedReferenceCategories.length === 0
  ) {
    return {
      level: 'pass',
      code: 'owner_merge_v2_applied',
      detail: 'The exact v2 owner-account successor has a verified finalization audit and no source credentials or unexpected references remain.',
    };
  }

  return {
    level: 'blocked',
    code: `owner_merge_v2_${snapshot.phase}`,
    detail: snapshot.blockers.length > 0
      ? snapshot.blockers.join('; ')
      : 'The exact v2 owner-account successor is not finalized.',
  };
}

export type AiPublicationPreflight = {
  phase: 'ready' | 'applied' | 'drift';
  configEnabled: boolean;
  targets: Array<{ slug: string; appliedExact: boolean }>;
};

export function assessAiPublication(snapshot: AiPublicationPreflight): ReadinessFinding {
  const drifted = snapshot.targets.filter((target) => !target.appliedExact).map((target) => target.slug);
  if (snapshot.phase === 'applied' && snapshot.configEnabled && drifted.length === 0) {
    return {
      level: 'pass',
      code: 'ai_publication_exact',
      detail: 'The enabled AI preview allowlist matches every frozen release snapshot.',
    };
  }

  if (snapshot.configEnabled && (snapshot.phase === 'drift' || drifted.length > 0)) {
    return {
      level: 'blocked',
      code: 'ai_publication_fail_closed_drift',
      detail: `The control is enabled but the release is fail-closed for: ${drifted.join(', ') || 'unknown targets'}.`,
    };
  }

  return {
    level: 'advisory',
    code: `ai_publication_${snapshot.phase}_${snapshot.configEnabled ? 'enabled' : 'disabled'}`,
    detail: 'AI preview publication is not currently an exact enabled release.',
  };
}

export type AiPublicationSuccessorPreflight = {
  phase: 'disable_required' | 'ready' | 'blocked';
  artifactExact: boolean;
  blockers: string[];
  targets: Array<{ slug: string; artifactVerdict: 'pass' | 'blocked' }>;
};

export function assessAiPublicationSuccessor(
  snapshot: AiPublicationSuccessorPreflight,
): ReadinessFinding {
  const blockedTargets = snapshot.targets
    .filter((target) => target.artifactVerdict !== 'pass')
    .map((target) => target.slug);
  if (!snapshot.artifactExact || snapshot.phase === 'blocked' || blockedTargets.length > 0) {
    return {
      level: 'blocked',
      code: 'ai_publication_successor_blocked',
      detail: [
        ...snapshot.blockers,
        blockedTargets.length > 0
          ? `Blocked audit targets: ${blockedTargets.join(', ')}.`
          : '',
      ].filter(Boolean).join(' '),
    };
  }

  return {
    level: 'blocked',
    code: `ai_publication_successor_${snapshot.phase}`,
    detail: 'The diagnostic successor is exact, but no approved replacement mutation and verified activation exist.',
  };
}

export type ClinicalBatchSnapshot = {
  batchId: string;
  status: 'frozen' | 'active' | 'stopped_changes_requested' | 'completed' | 'invalidated';
  predecessorBatchId?: string;
};

export function unresolvedStoppedClinicalBatches(batches: ClinicalBatchSnapshot[]): string[] {
  const completedPredecessors = new Set(
    batches
      .filter((batch) => batch.status === 'completed' && batch.predecessorBatchId)
      .map((batch) => batch.predecessorBatchId as string),
  );
  return batches
    .filter((batch) => batch.status === 'stopped_changes_requested')
    .filter((batch) => !completedPredecessors.has(batch.batchId))
    .map((batch) => batch.batchId)
    .sort();
}
