import {
  LEGAL_TERMS_RELEASE,
  LEGAL_TERMS_TEXT_SHA256,
  type LegalTermsRelease,
} from './legalRelease';

export type ReadinessLevel = 'pass' | 'blocked' | 'advisory';

export type ReadinessFinding = {
  level: ReadinessLevel;
  code: string;
  detail: string;
};

const LEGAL_TERMS_VERSION = /^terms-(\d{4}-\d{2}-\d{2})-v([1-9]\d*)$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const RECEIPT_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;
const APPROVER_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{7,127}$/;

function isRealIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function isCanonicalIsoInstant(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}

export function legalTermsReleaseProblems(release: LegalTermsRelease): string[] {
  const problems: string[] = [];
  if (release.status !== 'published') problems.push('status must be exactly published');

  const versionMatch = LEGAL_TERMS_VERSION.exec(release.version);
  if (!versionMatch || !isRealIsoDate(versionMatch[1])) {
    problems.push('version must match terms-YYYY-MM-DD-vN with a real date');
  }
  if (!release.effectiveDate || !isRealIsoDate(release.effectiveDate)) {
    problems.push('effectiveDate must be a real YYYY-MM-DD date');
  }
  if (!release.publishedAt || !isCanonicalIsoInstant(release.publishedAt)) {
    problems.push('publishedAt must be a canonical UTC instant with milliseconds');
  }
  if (release.textDigest !== LEGAL_TERMS_TEXT_SHA256) {
    problems.push('textDigest does not match the exact bilingual Terms source');
  }

  const receipt = release.approvalReceipt;
  if (!receipt) {
    problems.push('a binding Owner/legal approval receipt is required');
    return problems;
  }
  if (!RECEIPT_ID.test(receipt.receiptId)) {
    problems.push('approval receiptId is invalid');
  }
  if (!APPROVER_ID.test(receipt.approverId)) {
    problems.push('approval approverId must be a stable non-email identifier');
  }
  if (receipt.authority !== 'owner' && receipt.authority !== 'legal_reviewer') {
    problems.push('approval authority must be owner or legal_reviewer');
  }
  if (!isCanonicalIsoInstant(receipt.approvedAt)) {
    problems.push('approval approvedAt must be a canonical UTC instant with milliseconds');
  }
  if (receipt.version !== release.version) {
    problems.push('approval receipt version does not match the release');
  }
  if (receipt.effectiveDate !== release.effectiveDate) {
    problems.push('approval receipt effectiveDate does not match the release');
  }
  if (receipt.textDigest !== release.textDigest || receipt.textDigest !== LEGAL_TERMS_TEXT_SHA256) {
    problems.push('approval receipt is not bound to the exact bilingual Terms digest');
  }
  if (versionMatch && release.effectiveDate && versionMatch[1] !== release.effectiveDate) {
    problems.push('version date must match effectiveDate');
  }
  if (
    release.publishedAt
    && isCanonicalIsoInstant(release.publishedAt)
    && release.effectiveDate
    && isRealIsoDate(release.effectiveDate)
    && release.publishedAt > `${release.effectiveDate}T00:00:00.000Z`
  ) {
    problems.push('Terms cannot be published after their effective date');
  }
  if (
    isCanonicalIsoInstant(receipt.approvedAt)
    && release.publishedAt
    && isCanonicalIsoInstant(release.publishedAt)
    && receipt.approvedAt > release.publishedAt
  ) {
    problems.push('approval must be recorded no later than publication');
  }
  return problems;
}

export function currentLegalTermsReadiness(
  release: LegalTermsRelease = LEGAL_TERMS_RELEASE,
): ReadinessFinding {
  const problems = legalTermsReleaseProblems(release);
  if (problems.length > 0) {
    return {
      level: 'blocked',
      code: release.status === 'draft' ? 'legal_terms_draft' : 'legal_terms_invalid_release',
      detail: `Terms ${release.version} are not publication-ready: ${problems.join('; ')}.`,
    };
  }
  return {
    level: 'pass',
    code: 'legal_terms_published',
    detail: `Terms ${release.version} have an exact-text approval receipt, effective date and publication time.`,
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

export type AiPublicationReleaseIdentity = {
  releaseRoot: string;
  artifactHash: string;
  snapshotSha256: string;
};

export type SixPictureStoriesPostflight = AiPublicationReleaseIdentity & {
  phase: 'ready' | 'staged' | 'enabled' | 'drift';
  activeReleaseCount: number;
  previousReadable: boolean;
  expiryScheduleExact: boolean;
  parentReadable: boolean;
  targets: Array<{
    slug: string;
    reviewRevision: number | null;
    parentReadable: boolean;
  }>;
  blockers: string[];
};

const SIX_PICTURE_STORY_POSTFLIGHT_TARGETS = [
  { slug: 'act_picture_story_2_5y', reviewRevision: 6 },
  { slug: 'act_picture_story_3y', reviewRevision: 6 },
  { slug: 'act_picture_story_3_5y', reviewRevision: 7 },
  { slug: 'act_picture_story_4y', reviewRevision: 6 },
  { slug: 'act_picture_story_4_5y', reviewRevision: 6 },
  { slug: 'act_picture_story_5y', reviewRevision: 6 },
] as const;

export function assessSixPictureStoriesPostflight(
  snapshot: SixPictureStoriesPostflight,
  expectedIdentity: AiPublicationReleaseIdentity,
): ReadinessFinding {
  const blockers: string[] = [];
  if (
    snapshot.releaseRoot !== expectedIdentity.releaseRoot
    || snapshot.artifactHash !== expectedIdentity.artifactHash
    || snapshot.snapshotSha256 !== expectedIdentity.snapshotSha256
  ) {
    blockers.push('immutable release identity mismatch');
  }
  if (snapshot.phase !== 'enabled') blockers.push(`phase is ${snapshot.phase}`);
  if (snapshot.activeReleaseCount !== 24) {
    blockers.push(`active release count is ${snapshot.activeReleaseCount}, expected 24`);
  }
  if (!snapshot.previousReadable) blockers.push('previous eighteen previews are not exact/readable');
  if (!snapshot.expiryScheduleExact) blockers.push('expiry schedule is absent or drifted');
  if (!snapshot.parentReadable) blockers.push('six successor activities are not parent-readable');
  if (snapshot.blockers.length > 0) blockers.push(...snapshot.blockers);

  const targetsExact = snapshot.targets.length === SIX_PICTURE_STORY_POSTFLIGHT_TARGETS.length
    && snapshot.targets.every((target, index) => {
      const expected = SIX_PICTURE_STORY_POSTFLIGHT_TARGETS[index];
      return target.slug === expected.slug
        && target.reviewRevision === expected.reviewRevision
        && target.parentReadable;
    });
  if (!targetsExact) blockers.push('exact six target revisions/read-back mismatch');

  if (blockers.length > 0) {
    return {
      level: 'blocked',
      code: 'ai_six_picture_stories_postflight_blocked',
      detail: `Current six-picture-story release failed exact postflight: ${[...new Set(blockers)].join('; ')}.`,
    };
  }

  return {
    level: 'pass',
    code: 'ai_six_picture_stories_postflight_exact',
    detail: 'The immutable six-picture-story release is enabled with all 24 governed previews, exact expiry scheduling and complete parent read-back.',
  };
}

export type EvidenceSourceReadinessSnapshot = {
  aiPublicationExact: boolean;
  sources: Array<{
    sourceId: string;
    reviewStatus: string;
  }>;
  dependencies: Array<{
    sourceId: string;
    contentSlug: string;
    contentStatus: string | null;
    contentExists: boolean;
    aiReleaseActive: boolean;
    aiSourceSnapshotExact: boolean;
  }>;
};

export type EvidenceSourceReadinessAssessment = {
  conventionalPublic: ReadinessFinding;
  aiPreview: ReadinessFinding;
  unpublishedBacklog: ReadinessFinding;
  unlinked: ReadinessFinding;
  sourceIds: {
    blockedConventionalPublic: string[];
    blockedAiPreview: string[];
    exactAiPreview: string[];
    unpublishedBacklog: string[];
    unlinked: string[];
  };
};

/**
 * Classify source-review debt by the publication path it can actually affect.
 * `approved` remains a qualified human decision. The separately disclosed AI
 * lane may use awaiting/in-review metadata only when the full immutable AI gate
 * and this source's frozen snapshot are exact.
 */
export function assessEvidenceSourceReadiness(
  snapshot: EvidenceSourceReadinessSnapshot,
): EvidenceSourceReadinessAssessment {
  const categories = {
    blockedConventionalPublic: new Set<string>(),
    blockedAiPreview: new Set<string>(),
    exactAiPreview: new Set<string>(),
    unpublishedBacklog: new Set<string>(),
    unlinked: new Set<string>(),
  };

  for (const source of snapshot.sources) {
    if (source.reviewStatus === 'approved') continue;
    const dependencies = snapshot.dependencies.filter(
      (dependency) => dependency.sourceId === source.sourceId,
    );
    if (dependencies.length === 0) {
      categories.unlinked.add(source.sourceId);
      continue;
    }

    const conventionalPublic = dependencies.some(
      (dependency) =>
        dependency.contentStatus === 'published'
        // Evidence links without a libraryContent row back inherently public
        // safety/hope references and therefore use the conventional gate.
        || !dependency.contentExists,
    );
    if (conventionalPublic) {
      categories.blockedConventionalPublic.add(source.sourceId);
      continue;
    }

    const aiDependencies = dependencies.filter(
      (dependency) => dependency.aiReleaseActive,
    );
    if (aiDependencies.length > 0) {
      const aiStatusEligible = source.reviewStatus === 'awaiting_review'
        || source.reviewStatus === 'in_review';
      if (
        snapshot.aiPublicationExact
        && aiStatusEligible
        && aiDependencies.every(
          (dependency) => dependency.aiSourceSnapshotExact,
        )
      ) {
        categories.exactAiPreview.add(source.sourceId);
      } else {
        categories.blockedAiPreview.add(source.sourceId);
      }
      continue;
    }

    categories.unpublishedBacklog.add(source.sourceId);
  }

  const ids = Object.fromEntries(
    Object.entries(categories).map(([key, values]) => [
      key,
      [...values].sort(),
    ]),
  ) as EvidenceSourceReadinessAssessment['sourceIds'];
  const count = (values: string[]) => values.length;

  return {
    conventionalPublic: count(ids.blockedConventionalPublic) > 0
      ? {
          level: 'blocked',
          code: 'conventional_public_source_not_approved',
          detail: `Conventionally published content has non-approved evidence: ${ids.blockedConventionalPublic.join(', ')}.`,
        }
      : {
          level: 'pass',
          code: 'conventional_public_sources_approved',
          detail: 'No conventionally public content depends on non-approved evidence.',
        },
    aiPreview: count(ids.blockedAiPreview) > 0
      ? {
          level: 'blocked',
          code: 'ai_preview_source_gate_not_exact',
          detail: `Active AI previews have a non-approved source outside the exact AI gate: ${ids.blockedAiPreview.join(', ')}.`,
        }
      : {
          level: 'pass',
          code: count(ids.exactAiPreview) > 0
            ? 'ai_preview_sources_exact_without_human_approval'
            : 'ai_preview_nonapproved_sources_not_applicable',
          detail: count(ids.exactAiPreview) > 0
            ? `The disclosed exact AI gate covers awaiting or in-review source metadata without representing human approval: ${ids.exactAiPreview.join(', ')}.`
            : 'No active AI preview depends on non-approved evidence.',
        },
    unpublishedBacklog: count(ids.unpublishedBacklog) > 0
      ? {
          level: 'advisory',
          code: 'evidence_awaiting_unpublished_backlog',
          detail: `Non-approved evidence remains linked only to unpublished content: ${ids.unpublishedBacklog.join(', ')}.`,
        }
      : {
          level: 'pass',
          code: 'evidence_unpublished_backlog_clear',
          detail: 'No non-approved evidence remains linked solely to unpublished content.',
        },
    unlinked: {
      level: 'pass',
      code: 'unlinked_nonapproved_sources_not_blocking',
      detail: count(ids.unlinked) > 0
        ? `Unlinked non-approved sources do not affect publication readiness: ${ids.unlinked.join(', ')}.`
        : 'No unlinked non-approved sources were found.',
    },
    sourceIds: ids,
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
