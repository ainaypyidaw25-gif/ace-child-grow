import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  aiEarlyMathCorrectionAuditAfterJson,
  aiEarlyMathCorrectionAuditBeforeJson,
  prepare,
  preflight,
} from '../../../convex/aiEarlyMathProvenanceCorrection';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import { AI_PUBLICATION_AUDIT_ARTIFACT } from '../../../convex/lib/aiPublicationAuditArtifact';
import {
  AI_EARLY_MATH_PROVENANCE_CORRECTION_RELEASE_ID,
  AI_EARLY_MATH_PROVENANCE_CORRECTION_SPEC,
} from '../../../convex/lib/aiEarlyMathProvenanceCorrectionData';
import { AI_PUBLICATION_SUCCESSOR_20260909_TARGETS } from '../../../convex/lib/aiPublicationSuccessor20260909Data';
import seedData from '../../../convex/seedData.json';

type Row = Record<string, unknown>;

const FIXED_NOW = Date.UTC(2026, 8, 9, 12, 0, 0);
const HUMAN_REVIEWED_AT = FIXED_NOW + 60_000;
const HUMAN_REVIEWER_ID = 'mn7headstartreviewer0000000000000';
const HUMAN_REVIEWER = 'Qualified Education Reviewer';
const HUMAN_QUALIFICATION = 'MEd (Early Childhood Education)';
const AI_CONTROL_OPERATOR = 'owner:lapyaewun';
const AI_CONTROL_REASON =
  'Fail closed after 2026-09-09 production audit found drifted source snapshots; no human review or publication decision is implied.';
const AI_RELEASE_OPERATOR = 'Owner-authorized Codex release operator';
const AI_REVOKE_REASON =
  'owner:lapyaewun: Owner-approved permanent revocation after fail-closed 2026-09-09 audit confirmed all three v1 releases are drifted; no human review or successor publication is implied.';

function registeredHandler(fn: unknown) {
  return (fn as {
    _handler: (ctx: unknown, args: Record<string, unknown>) => Promise<unknown>;
  })._handler;
}

function sourcePreimage(): Row {
  const target = AI_PUBLICATION_SUCCESSOR_20260909_TARGETS.find(
    (candidate) => candidate.slug === 'lsn_early_math',
  );
  if (!target) throw new Error('missing early-math predecessor target');
  return {
    _id: AI_EARLY_MATH_PROVENANCE_CORRECTION_SPEC.source.rowId,
    _creationTime: AI_EARLY_MATH_PROVENANCE_CORRECTION_SPEC.source.creationTime,
    ...structuredClone(target.sourceSnapshot),
    searchText: 'u.s. department of health and human services, administration for children and families, office of head start head start early learning outcomes framework: ages birth to five u.s. department of health and human services, administration for children and families, office of head start https://headstart.gov/sites/default/files/pdf/elof-ohs-framework.pdf   early learning outcomes early mathematics social development emotional development school readiness milestones cognitive social_emotional parenting school_readiness play',
    createdAt: 1_787_120_210_772,
    updatedAt: AI_EARLY_MATH_PROVENANCE_CORRECTION_SPEC.source.updatedAt,
  };
}

function targetLinkPreimage(): Row {
  const dependency = AI_EARLY_MATH_PROVENANCE_CORRECTION_SPEC.dependency;
  return {
    _id: dependency.rowId,
    _creationTime: dependency.creationTime,
    kind: dependency.kind,
    slug: dependency.slug,
    sourceIds: [AI_EARLY_MATH_PROVENANCE_CORRECTION_SPEC.source.sourceId],
    createdAt: 1_785_024_331_625,
    updatedAt: dependency.updatedAt,
  };
}

function contentPreimages(): Row[] {
  return AI_EARLY_MATH_PROVENANCE_CORRECTION_SPEC.revokedTargetContents.map((spec) => {
    const row = seedData.find((candidate) => candidate.slug === spec.slug);
    if (!row) throw new Error(`missing ${spec.slug} seed row`);
    // `media` is seed-only input and is not stored on libraryContent documents.
    const { media: _media, ...content } = row;
    void _media;
    return {
      ...content,
      _id: spec.rowId,
      _creationTime: spec.creationTime,
      clinicalStatus: 'clinical_review',
      reviewRevision: spec.reviewRevision,
      ...(spec.slug === 'lsn_early_math' ? {} : { priorityStatus: 'triage_complete' }),
      createdAt: 1_785_024_282_947,
      updatedAt: spec.updatedAt,
    };
  });
}

function contentReviewPreimages(): Row[] {
  const owner = {
    reviewerId: 'mn7adb0ryhcqwg2hppnrn52sm18bmeqj',
    reviewerDisplayName: 'ဒေါ်လပြည့်၀န်း',
    reviewerRole: 'owner',
    decision: 'approved',
  };
  return [
    {
      _id: 'nn7acwt5x8274vndefvw0393k98bhm30',
      _creationTime: 1_785_389_205_499.8354,
      contentSlug: 'lsn_early_math',
      contentVersion: 6,
      createdAt: 1_785_389_205_499,
      decision: 'approved',
      dimension: 'native_myanmar',
      reviewedAt: 1_785_389_205_499,
      reviewerDisplayName: 'Daw Thidar Aung',
      reviewerId: 'mn745vze12nps59f8vq4s8ttzs8bexyr',
      reviewerRole: 'language_reviewer',
      updatedAt: 1_785_389_205_499,
    },
    ...([
      ['nn72wht3c7qy81wckjqm319k6s8bw0ny', 1_785_911_434_992.1677, 1_785_911_434_992, 'english'],
      ['nn727a74f100pabmcy65cxnxc98bxxqd', 1_785_911_439_019.246, 1_785_911_439_019, 'native_myanmar'],
    ] as const).map(([id, creationTime, timestamp, dimension]) => ({
      _id: id,
      _creationTime: creationTime,
      contentSlug: 'lsn_early_math',
      contentVersion: 8,
      reviewRevision: 8,
      createdAt: timestamp,
      dimension,
      reviewedAt: timestamp,
      updatedAt: timestamp,
      ...owner,
    })),
    ...([
      ['nn7fte5a5k0hn861bc660dp8js8bxaz5', 1_785_904_621_813.4675, 1_785_904_621_813, 'english'],
      ['nn7cz3hmnxsg7kcyk2cnhcc8gx8bwwzh', 1_785_904_624_829.1338, 1_785_904_624_829, 'native_myanmar'],
    ] as const).map(([id, creationTime, timestamp, dimension]) => ({
      _id: id,
      _creationTime: creationTime,
      contentSlug: 'st_waiting_at_clinic',
      contentVersion: 2,
      reviewRevision: 2,
      createdAt: timestamp,
      dimension,
      reviewedAt: timestamp,
      updatedAt: timestamp,
      ...owner,
    })),
    ...([
      ['nn7ds5f6vw1t87f0sy0cf1n0n58bxj05', 1_785_904_175_183.426, 1_785_904_175_183, 'native_myanmar'],
      ['nn79y1axcfx6s9044g0mef9h198bwqyt', 1_785_904_179_008.9988, 1_785_904_179_009, 'english'],
    ] as const).map(([id, creationTime, timestamp, dimension]) => ({
      _id: id,
      _creationTime: creationTime,
      contentSlug: 'st_first_day_school',
      contentVersion: 1,
      reviewRevision: 1,
      createdAt: timestamp,
      dimension,
      reviewedAt: timestamp,
      updatedAt: timestamp,
      ...owner,
    })),
  ];
}

async function originalAiAuditPreimages(): Promise<{
  run: Row;
  contentAudit: Row;
  evidenceAudit: Row;
}> {
  const spec = AI_EARLY_MATH_PROVENANCE_CORRECTION_SPEC;
  const release = spec.revokedAiPublicationReleases[0];
  const target = AI_PUBLICATION_AUDIT_ARTIFACT.targets.find(
    (candidate) => candidate.slug === release.contentSlug,
  );
  if (!target) throw new Error('missing early-math audit artifact target');
  const targetArtifactHash = await sha256Canonical(target);
  const commonLimitations = [
    ...target.limitations,
    ...AI_PUBLICATION_AUDIT_ARTIFACT.limitations,
  ];
  const nextAuditDate = new Date(
    AI_PUBLICATION_AUDIT_ARTIFACT.auditCompletedAt + 89 * 86_400_000,
  ).toISOString().slice(0, 10);
  const run = {
    _id: spec.originalAiAuditChain.run.rowId,
    _creationTime: spec.originalAiAuditChain.run.creationTime,
    runId: spec.originalAiAuditChain.runId,
    releaseId: release.releaseId,
    status: 'completed',
    provider: AI_PUBLICATION_AUDIT_ARTIFACT.provider,
    model: AI_PUBLICATION_AUDIT_ARTIFACT.model,
    modelVersion: AI_PUBLICATION_AUDIT_ARTIFACT.modelVersion,
    policyVersion: release.policyVersion,
    gitCommit: release.gitCommit,
    targetCount: 1,
    summary: `${AI_PUBLICATION_AUDIT_ARTIFACT.summary} Target: ${release.contentType}:${release.contentSlug}.`,
    limitations: [...AI_PUBLICATION_AUDIT_ARTIFACT.limitations],
    startedAt: AI_PUBLICATION_AUDIT_ARTIFACT.auditStartedAt,
    completedAt: AI_PUBLICATION_AUDIT_ARTIFACT.auditCompletedAt,
    outputHash: await sha256Canonical({
      artifactHash: release.auditArtifactHash,
      targetArtifactHash,
    }),
  };
  const contentAudit = {
    _id: spec.originalAiAuditChain.contentAudit.rowId,
    _creationTime: spec.originalAiAuditChain.contentAudit.creationTime,
    runId: spec.originalAiAuditChain.runId,
    contentSlug: release.contentSlug,
    contentType: release.contentType,
    reviewRevision: release.reviewRevision,
    contentUpdatedAt: release.contentUpdatedAt,
    contentSnapshotHash: release.contentSnapshotHash,
    evidenceLinkUpdatedAt: release.evidenceLinkUpdatedAt,
    evidenceLinkSnapshotHash: release.evidenceLinkSnapshotHash,
    sourceIds: release.sourceSnapshots.map((snapshot) => snapshot.sourceId),
    verdict: 'pass',
    checks: [...target.contentChecks],
    limitations: commonLimitations,
    auditedAt: AI_PUBLICATION_AUDIT_ARTIFACT.auditCompletedAt,
    nextAuditDate,
    outputHash: await sha256Canonical({
      artifactHash: release.auditArtifactHash,
      targetArtifactHash,
      kind: 'content',
    }),
  };
  const evidenceAudit = {
    _id: spec.originalAiAuditChain.evidenceAudit.rowId,
    _creationTime: spec.originalAiAuditChain.evidenceAudit.creationTime,
    runId: spec.originalAiAuditChain.runId,
    sourceId: release.sourceSnapshots[0].sourceId,
    sourceUpdatedAt: release.sourceSnapshots[0].sourceUpdatedAt,
    sourceSnapshotHash: release.sourceSnapshots[0].sourceSnapshotHash,
    verdict: 'pass',
    claimScope: target.claimScope,
    urlsChecked: [target.sourceUrl],
    findings: [...target.evidenceFindings],
    limitations: commonLimitations,
    auditedAt: AI_PUBLICATION_AUDIT_ARTIFACT.auditCompletedAt,
    nextAuditDate,
    outputHash: await sha256Canonical({
      artifactHash: release.auditArtifactHash,
      targetArtifactHash,
      kind: 'evidence',
    }),
  };
  return { run, contentAudit, evidenceAudit };
}

function aiPublicationConfigPreimage(): Row {
  const spec = AI_EARLY_MATH_PROVENANCE_CORRECTION_SPEC.aiPublicationControl;
  return {
    _id: spec.rowId,
    _creationTime: spec.creationTime,
    key: spec.key,
    enabled: spec.enabled,
    generation: spec.generation,
    reason: AI_CONTROL_REASON,
    operator: AI_CONTROL_OPERATOR,
    updatedAt: spec.updatedAt,
  };
}

function aiPublicationDisableAuditPreimage(): Row {
  const spec = AI_EARLY_MATH_PROVENANCE_CORRECTION_SPEC.aiPublicationDisableAudit;
  return {
    _id: spec.rowId,
    _creationTime: spec.creationTime,
    action: spec.action,
    entityTable: spec.entityTable,
    entityId: spec.entityId,
    summary: `${AI_CONTROL_OPERATOR}: ${AI_CONTROL_REASON}`,
    result: spec.result,
  };
}

function aiPublicationRevokeAuditPreimage(): Row {
  const spec = AI_EARLY_MATH_PROVENANCE_CORRECTION_SPEC.aiPublicationRevocationAudit;
  return {
    _id: spec.rowId,
    _creationTime: spec.creationTime,
    action: spec.action,
    entityTable: spec.entityTable,
    entityId: spec.entityId,
    summary: AI_REVOKE_REASON,
    result: spec.result,
  };
}

function revokedAiPublicationReleasePreimages(): Row[] {
  return AI_EARLY_MATH_PROVENANCE_CORRECTION_SPEC.revokedAiPublicationReleases.map(
    ({
      rowId,
      creationTime,
      operatorSha256: _operatorSha256,
      revokeReasonSha256: _revokeReasonSha256,
      exactCanonicalSha256: _exactCanonicalSha256,
      ...release
    }) => {
      void _operatorSha256;
      void _revokeReasonSha256;
      void _exactCanonicalSha256;
      return {
        ...structuredClone(release),
        _id: rowId,
        _creationTime: creationTime,
        operator: AI_RELEASE_OPERATOR,
        revokeReason: AI_REVOKE_REASON,
      };
    },
  );
}

function unrelatedHumanAuditPreimage(): Row {
  const spec = AI_EARLY_MATH_PROVENANCE_CORRECTION_SPEC;
  const source = sourcePreimage();
  const reviewer = String(source.reviewer);
  const qualification = String(source.reviewerQualification);
  const reviewDate = String(source.reviewDate);
  const note = String(source.reviewNote);
  return {
    _id: spec.unrelatedHumanReviewAudit.rowId,
    _creationTime: spec.unrelatedHumanReviewAudit.creationTime,
    actorId: spec.source.reviewerId,
    action: 'evidence.setReview',
    entityTable: 'evidenceSources',
    entityId: spec.source.sourceId,
    summary: `awaiting_review → approved by ${reviewer} (${qualification}) · outdated-source advisory acknowledged in reviewer note`,
    result: 'ok',
    before: 'awaiting_review / no reviewer / no date',
    after: `approved / ${reviewer} (${qualification}) / ${reviewDate} / note: ${note}`,
  };
}

function mockContext(initial: Record<string, Row[]>) {
  const tables = Object.fromEntries(
    Object.entries(initial).map(([name, rows]) => [name, structuredClone(rows)]),
  ) as Record<string, Row[]>;
  const query = vi.fn((table: string) => {
    const terminal = (conditions: Array<[string, unknown]> = []) => {
      const filtered = () => (tables[table] ?? []).filter((row) =>
        conditions.every(([field, value]) => row[field] === value));
      return {
        take: async (count: number) => filtered().slice(0, count),
        unique: async () => {
          const rows = filtered();
          if (rows.length > 1) throw new Error('not unique');
          return rows[0] ?? null;
        },
      };
    };
    return {
      ...terminal(),
      withIndex: (_name: string, callback: (q: {
        eq: (field: string, value: unknown) => unknown;
      }) => unknown) => {
        const conditions: Array<[string, unknown]> = [];
        const q = {
          eq: (field: string, value: unknown): unknown => {
            conditions.push([field, value]);
            return q;
          },
        };
        callback(q);
        return terminal(conditions);
      },
    };
  });
  let insertSequence = 0;
  const insert = vi.fn(async (table: string, value: Row) => {
    insertSequence += 1;
    const id = `${table}:inserted:${insertSequence}`;
    tables[table] ??= [];
    tables[table].push({
      ...value,
      _id: id,
      _creationTime: FIXED_NOW + insertSequence / 10,
    });
    return id;
  });
  const patch = vi.fn(async (id: string, values: Row) => {
    for (const rows of Object.values(tables)) {
      const index = rows.findIndex((row) => row._id === id);
      if (index < 0) continue;
      const next = { ...rows[index] };
      for (const [key, value] of Object.entries(values)) {
        if (value === undefined) delete next[key];
        else next[key] = value;
      }
      rows[index] = next;
      return;
    }
    throw new Error(`missing row ${id}`);
  });
  const get = vi.fn(async (id: string) => Object.values(tables)
    .flat().find((row) => row._id === id) ?? null);
  return { ctx: { db: { query, insert, patch, get } }, tables, insert, patch };
}

async function exactContext() {
  const originalAiAudits = await originalAiAuditPreimages();
  return mockContext({
    evidenceSources: [sourcePreimage()],
    evidenceLinks: [targetLinkPreimage()],
    libraryContent: contentPreimages(),
    contentReviews: contentReviewPreimages(),
    auditLogs: [
      unrelatedHumanAuditPreimage(),
      aiPublicationDisableAuditPreimage(),
      aiPublicationRevokeAuditPreimage(),
    ],
    aiAuditRuns: [originalAiAudits.run],
    aiContentAudits: [originalAiAudits.contentAudit],
    aiEvidenceAudits: [originalAiAudits.evidenceAudit],
    aiPublicationReleases: revokedAiPublicationReleasePreimages(),
    aiPublicationConfig: [aiPublicationConfigPreimage()],
    parentProfiles: [],
    clinicalReviewBatches: [],
    clinicalReviewAssignments: [],
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('early-math AI provenance correction CAS', () => {
  it('freezes every exact read-only Production preimage used by the gate', async () => {
    const spec = AI_EARLY_MATH_PROVENANCE_CORRECTION_SPEC;
    expect(await sha256Canonical(sourcePreimage()))
      .toBe(spec.source.exactCanonicalSha256);
    expect(await sha256Canonical(targetLinkPreimage()))
      .toBe(spec.dependency.exactCanonicalSha256);
    expect(await sha256Canonical(unrelatedHumanAuditPreimage()))
      .toBe(spec.unrelatedHumanReviewAudit.exactCanonicalSha256);
    expect(await Promise.all(contentPreimages().map(sha256Canonical)))
      .toEqual(spec.revokedTargetContents.map((row) => row.exactCanonicalSha256));
    for (const expected of spec.contentReviews) {
      const actual = contentReviewPreimages().filter((row) => row.contentSlug === expected.slug);
      expect(await Promise.all(actual.map(sha256Canonical)))
        .toEqual(expected.rows.map((row) => row.exactCanonicalSha256));
    }
    const chain = await originalAiAuditPreimages();
    expect(await sha256Canonical(chain.run))
      .toBe(spec.originalAiAuditChain.run.exactCanonicalSha256);
    expect(await sha256Canonical(chain.contentAudit))
      .toBe(spec.originalAiAuditChain.contentAudit.exactCanonicalSha256);
    expect(await sha256Canonical(chain.evidenceAudit))
      .toBe(spec.originalAiAuditChain.evidenceAudit.exactCanonicalSha256);
    expect(await sha256Canonical(AI_CONTROL_OPERATOR))
      .toBe(spec.aiPublicationControl.operatorSha256);
    expect(await sha256Canonical(AI_CONTROL_REASON))
      .toBe(spec.aiPublicationControl.reasonSha256);
    expect(await sha256Canonical(aiPublicationConfigPreimage()))
      .toBe(spec.aiPublicationControl.exactCanonicalSha256);
    expect(await sha256Canonical(aiPublicationDisableAuditPreimage()))
      .toBe(spec.aiPublicationDisableAudit.exactCanonicalSha256);
    expect(await sha256Canonical(AI_REVOKE_REASON))
      .toBe(spec.revokedAiPublicationReleases[0].revokeReasonSha256);
    expect(await sha256Canonical(aiPublicationRevokeAuditPreimage()))
      .toBe(spec.aiPublicationRevocationAudit.exactCanonicalSha256);
    expect(await Promise.all(revokedAiPublicationReleasePreimages().map(sha256Canonical)))
      .toEqual(spec.revokedAiPublicationReleases.map((row) => row.exactCanonicalSha256));
    const revokedSet = revokedAiPublicationReleasePreimages()
      .sort((left, right) => String(left.releaseId).localeCompare(String(right.releaseId)));
    expect(await sha256Canonical(revokedSet))
      .toBe(spec.revokedAiPublicationReleaseSetCanonicalSha256);
  });

  it('moves only the exact source to awaiting_review and records no approval or publication', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);
    const state = await exactContext();
    const before = await registeredHandler(preflight)(state.ctx, {
      releaseId: AI_EARLY_MATH_PROVENANCE_CORRECTION_RELEASE_ID,
    }) as Row;
    expect(before).toMatchObject({
      phase: 'correction_ready',
      blockers: [],
      todayIso: '2026-09-09',
      sourceExactPreimage: true,
      contentRows: 3,
      contentExact: true,
      contentPublicationPointersCleared: true,
      contentReviewRows: 7,
      contentReviewsExact: true,
      originalAiRunRows: 1,
      originalAiRunExact: true,
      originalAiContentAuditRows: 1,
      originalAiContentAuditExact: true,
      originalAiEvidenceAuditRows: 1,
      originalAiEvidenceAuditExact: true,
      aiPublicationConfigRows: 1,
      aiPublicationConfigEnabled: false,
      aiPublicationConfigExact: true,
      aiPublicationDisableAuditRows: 1,
      aiPublicationDisableAuditExact: true,
      activeAiPublicationReleaseRows: 0,
      revokedAiPublicationReleaseRows: 3,
      revokedAiPublicationReleasesExact: true,
      revokedAiPublicationReleaseSetExact: true,
      aiPublicationRevokeAuditRows: 1,
      aiPublicationRevokeAuditExact: true,
      reverseDependencyKeys: ['lesson:lsn_early_math'],
      dataRowsChanged: 0,
      humanReviewDecision: 'not_made',
      publicationDecision: 'not_made',
    });

    const result = await registeredHandler(prepare)(state.ctx, {
      releaseId: AI_EARLY_MATH_PROVENANCE_CORRECTION_RELEASE_ID,
    }) as Row;
    expect(result).toEqual({
      releaseId: AI_EARLY_MATH_PROVENANCE_CORRECTION_RELEASE_ID,
      applied: true,
      alreadyApplied: false,
      sourceRowsChanged: 1,
      auditRowsCreated: 1,
      correctedAt: FIXED_NOW,
      humanReviewDecision: 'not_made',
      publicationDecision: 'not_made',
    });
    expect(state.patch).toHaveBeenCalledTimes(1);
    expect(state.patch).toHaveBeenCalledWith(
      AI_EARLY_MATH_PROVENANCE_CORRECTION_SPEC.source.rowId,
      {
        reviewStatus: 'awaiting_review',
        reviewer: null,
        reviewerQualification: undefined,
        reviewDate: null,
        nextReviewDate: null,
        reviewNote: undefined,
        reviewerId: undefined,
        reviewScope: undefined,
        updatedAt: FIXED_NOW,
      },
    );
    expect(state.insert).toHaveBeenCalledTimes(1);
    const inserted = state.insert.mock.calls[0][1] as Row;
    expect(inserted).toMatchObject({
      action: AI_EARLY_MATH_PROVENANCE_CORRECTION_SPEC.action,
      entityTable: 'evidenceSources',
      entityId: AI_EARLY_MATH_PROVENANCE_CORRECTION_SPEC.source.sourceId,
      summary: AI_EARLY_MATH_PROVENANCE_CORRECTION_RELEASE_ID,
      result: 'ok',
      before: aiEarlyMathCorrectionAuditBeforeJson(),
    });
    expect(inserted.actorId).toBeUndefined();
    expect(String(inserted.after)).toContain('"humanReviewDecision":"not_made"');
    expect(String(inserted.after)).toContain('"publicationDecision":"not_made"');

    const after = await registeredHandler(preflight)(state.ctx, {
      releaseId: AI_EARLY_MATH_PROVENANCE_CORRECTION_RELEASE_ID,
    }) as Row;
    expect(after).toMatchObject({
      phase: 'awaiting_human_review',
      blockers: [],
      sourceStatus: 'awaiting_review',
      sourceHumanReviewFieldsCleared: true,
      correctionAuditExact: true,
      correctedAt: FIXED_NOW,
      humanReviewDecision: 'not_made',
      publicationDecision: 'not_made',
    });

    const idempotent = await registeredHandler(prepare)(state.ctx, {
      releaseId: AI_EARLY_MATH_PROVENANCE_CORRECTION_RELEASE_ID,
    }) as Row;
    expect(idempotent).toMatchObject({
      applied: false,
      alreadyApplied: true,
      sourceRowsChanged: 0,
      auditRowsCreated: 0,
      correctedAt: FIXED_NOW,
    });
    expect(state.patch).toHaveBeenCalledTimes(1);
    expect(state.insert).toHaveBeenCalledTimes(1);
  });

  it('recognizes a later authenticated, source-bound human review but never publishes it', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);
    const state = await exactContext();
    await registeredHandler(prepare)(state.ctx, {
      releaseId: AI_EARLY_MATH_PROVENANCE_CORRECTION_RELEASE_ID,
    });
    const source = state.tables.evidenceSources[0];
    const note = 'Reviewed the actual Head Start ELOF PDF and its early mathematics claim scope.';
    Object.assign(source, {
      reviewStatus: 'approved',
      reviewer: HUMAN_REVIEWER,
      reviewerQualification: HUMAN_QUALIFICATION,
      reviewDate: '2026-09-09',
      nextReviewDate: '2029-09-09',
      reviewNote: note,
      reviewerId: HUMAN_REVIEWER_ID,
      reviewScope: 'education',
      updatedAt: HUMAN_REVIEWED_AT,
    });
    state.tables.parentProfiles.push({
      _id: 'profile:head-start-reviewer',
      _creationTime: FIXED_NOW - 10,
      userId: HUMAN_REVIEWER_ID,
      displayName: HUMAN_REVIEWER,
      preferredLocale: 'en',
      isStaff: true,
      staffRole: 'clinical_reviewer',
      staffQualification: HUMAN_QUALIFICATION,
    });
    state.tables.auditLogs.push({
      _id: 'audit:head-start-human-review',
      _creationTime: HUMAN_REVIEWED_AT + 0.25,
      actorId: HUMAN_REVIEWER_ID,
      action: 'evidence.setReview',
      entityTable: 'evidenceSources',
      entityId: AI_EARLY_MATH_PROVENANCE_CORRECTION_SPEC.source.sourceId,
      summary: `awaiting_review → approved by ${HUMAN_REVIEWER} (${HUMAN_QUALIFICATION}) · outdated-source advisory acknowledged in reviewer note`,
      result: 'ok',
      before: 'awaiting_review / no reviewer / no date',
      after: `approved / ${HUMAN_REVIEWER} (${HUMAN_QUALIFICATION}) / 2026-09-09 / note: ${note}`,
    });

    const result = await registeredHandler(preflight)(state.ctx, {
      releaseId: AI_EARLY_MATH_PROVENANCE_CORRECTION_RELEASE_ID,
    }) as Row;
    expect(result).toMatchObject({
      phase: 'human_review_recorded',
      blockers: [],
      sourceStatus: 'approved',
      sourceBoundHumanNote: true,
      successorHumanReviewAuditExact: true,
      reviewerProfileExact: true,
      sourceCitationEligible: true,
      dataRowsChanged: 0,
      humanReviewDecision: 'not_made',
      publicationDecision: 'not_made',
    });
  });

  it.each([
    {
      label: 'source review note drift',
      blocker: 'source is neither the frozen preimage nor an exact correction successor state',
      mutate: (state: Awaited<ReturnType<typeof exactContext>>) => {
        state.tables.evidenceSources[0].reviewNote = 'changed';
      },
    },
    {
      label: 'unexpected reverse dependency',
      blocker: 'source reverse dependencies drifted or exceeded the scan bound',
      mutate: (state: Awaited<ReturnType<typeof exactContext>>) => {
        state.tables.evidenceLinks.push({
          _id: 'link:unexpected',
          _creationTime: FIXED_NOW - 1,
          kind: 'lesson',
          slug: 'unexpected',
          sourceIds: [AI_EARLY_MATH_PROVENANCE_CORRECTION_SPEC.source.sourceId],
          createdAt: FIXED_NOW - 1,
          updatedAt: FIXED_NOW - 1,
        });
      },
    },
    {
      label: 'missing AI publication control',
      blocker: 'AI publication control is not the exact disabled generation-2 row',
      mutate: (state: Awaited<ReturnType<typeof exactContext>>) => {
        state.tables.aiPublicationConfig.length = 0;
      },
    },
    {
      label: 'duplicate AI publication control',
      blocker: 'AI publication control is not the exact disabled generation-2 row',
      mutate: (state: Awaited<ReturnType<typeof exactContext>>) => {
        state.tables.aiPublicationConfig.push({
          ...state.tables.aiPublicationConfig[0],
          _id: 'config:duplicate',
        });
      },
    },
    {
      label: 'enabled AI publication control',
      blocker: 'AI publication control is not the exact disabled generation-2 row',
      mutate: (state: Awaited<ReturnType<typeof exactContext>>) => {
        state.tables.aiPublicationConfig[0].enabled = true;
      },
    },
    {
      label: 'wrong AI publication control generation',
      blocker: 'AI publication control is not the exact disabled generation-2 row',
      mutate: (state: Awaited<ReturnType<typeof exactContext>>) => {
        state.tables.aiPublicationConfig[0].generation = 3;
      },
    },
    {
      label: 'AI publication control hash drift',
      blocker: 'AI publication control is not the exact disabled generation-2 row',
      mutate: (state: Awaited<ReturnType<typeof exactContext>>) => {
        state.tables.aiPublicationConfig[0].reason = `${AI_CONTROL_REASON} changed`;
      },
    },
    {
      label: 'missing disable audit',
      blocker: 'AI publication disable audit is missing, duplicated or drifted',
      mutate: (state: Awaited<ReturnType<typeof exactContext>>) => {
        state.tables.auditLogs.splice(1, 1);
      },
    },
    {
      label: 'duplicate disable audit',
      blocker: 'AI publication disable audit is missing, duplicated or drifted',
      mutate: (state: Awaited<ReturnType<typeof exactContext>>) => {
        state.tables.auditLogs.push({
          ...aiPublicationDisableAuditPreimage(),
          _id: 'audit:disable:duplicate',
        });
      },
    },
    {
      label: 'disable audit hash drift',
      blocker: 'AI publication disable audit is missing, duplicated or drifted',
      mutate: (state: Awaited<ReturnType<typeof exactContext>>) => {
        state.tables.auditLogs[1].summary = 'changed';
      },
    },
    {
      label: 'any active AI publication release',
      blocker: 'an active AI publication release exists',
      mutate: (state: Awaited<ReturnType<typeof exactContext>>) => {
        state.tables.aiPublicationReleases.push({
          _id: 'release:unexpected',
          _creationTime: FIXED_NOW - 1,
          targetKey: 'lesson\u0000unrelated',
          status: 'active',
        });
      },
    },
    {
      label: 'missing revoked v1 release',
      blocker: 'the exact three revoked v1 AI publication releases are not preserved',
      mutate: (state: Awaited<ReturnType<typeof exactContext>>) => {
        state.tables.aiPublicationReleases.splice(0, 1);
      },
    },
    {
      label: 'duplicate revoked v1 release',
      blocker: 'the exact three revoked v1 AI publication releases are not preserved',
      mutate: (state: Awaited<ReturnType<typeof exactContext>>) => {
        state.tables.aiPublicationReleases.push({
          ...structuredClone(state.tables.aiPublicationReleases[0]),
          _id: 'release:revoked:duplicate',
        });
      },
    },
    {
      label: 'revoked release timestamp drift',
      blocker: 'the exact three revoked v1 AI publication releases are not preserved',
      mutate: (state: Awaited<ReturnType<typeof exactContext>>) => {
        state.tables.aiPublicationReleases[0].revokedAt = FIXED_NOW;
      },
    },
    {
      label: 'revoked release reason drift',
      blocker: 'the exact three revoked v1 AI publication releases are not preserved',
      mutate: (state: Awaited<ReturnType<typeof exactContext>>) => {
        state.tables.aiPublicationReleases[0].revokeReason = `${AI_REVOKE_REASON} changed`;
      },
    },
    {
      label: 'revoked release content hash drift',
      blocker: 'the exact three revoked v1 AI publication releases are not preserved',
      mutate: (state: Awaited<ReturnType<typeof exactContext>>) => {
        state.tables.aiPublicationReleases[0].contentSnapshotHash = '0'.repeat(64);
      },
    },
    {
      label: 'revoked release link hash drift',
      blocker: 'the exact three revoked v1 AI publication releases are not preserved',
      mutate: (state: Awaited<ReturnType<typeof exactContext>>) => {
        state.tables.aiPublicationReleases[0].evidenceLinkSnapshotHash = '0'.repeat(64);
      },
    },
    {
      label: 'revoked release source hash drift',
      blocker: 'the exact three revoked v1 AI publication releases are not preserved',
      mutate: (state: Awaited<ReturnType<typeof exactContext>>) => {
        const snapshots = state.tables.aiPublicationReleases[0].sourceSnapshots as Row[];
        snapshots[0].sourceSnapshotHash = '0'.repeat(64);
      },
    },
    {
      label: 'revoked release audit artifact hash drift',
      blocker: 'the exact three revoked v1 AI publication releases are not preserved',
      mutate: (state: Awaited<ReturnType<typeof exactContext>>) => {
        state.tables.aiPublicationReleases[0].auditArtifactHash = '0'.repeat(64);
      },
    },
    {
      label: 'unrelated extra globally revoked release',
      blocker: 'the global revoked AI publication release set drifted',
      mutate: (state: Awaited<ReturnType<typeof exactContext>>) => {
        state.tables.aiPublicationReleases.push({
          ...structuredClone(state.tables.aiPublicationReleases[0]),
          _id: 'release:revoked:unrelated',
          releaseId: '2026-08-19-ai-educational-preview-3:story:unrelated',
          targetKey: 'story\u0000unrelated',
        });
      },
    },
    {
      label: 'missing revoke audit',
      blocker: 'AI publication revoke audit is missing, duplicated or drifted',
      mutate: (state: Awaited<ReturnType<typeof exactContext>>) => {
        state.tables.auditLogs.splice(2, 1);
      },
    },
    {
      label: 'duplicate revoke audit',
      blocker: 'AI publication revoke audit is missing, duplicated or drifted',
      mutate: (state: Awaited<ReturnType<typeof exactContext>>) => {
        state.tables.auditLogs.push({
          ...aiPublicationRevokeAuditPreimage(),
          _id: 'audit:revoke:duplicate',
        });
      },
    },
    {
      label: 'revoke audit hash drift',
      blocker: 'AI publication revoke audit is missing, duplicated or drifted',
      mutate: (state: Awaited<ReturnType<typeof exactContext>>) => {
        state.tables.auditLogs[2].summary = 'changed';
      },
    },
    {
      label: 'revoked target content drift',
      blocker: 'a revoked-target content row drifted or duplicated',
      mutate: (state: Awaited<ReturnType<typeof exactContext>>) => {
        state.tables.libraryContent[1].titleEn = 'changed';
      },
    },
    {
      label: 'revoked target content pointer restored',
      blocker: 'a revoked target still carries an AI publication pointer',
      mutate: (state: Awaited<ReturnType<typeof exactContext>>) => {
        state.tables.libraryContent[0].aiPublicationReleaseId =
          AI_EARLY_MATH_PROVENANCE_CORRECTION_SPEC.revokedAiPublicationReleases[0].releaseId;
      },
    },
    {
      label: 'missing content review',
      blocker: 'revoked-target content review rows drifted',
      mutate: (state: Awaited<ReturnType<typeof exactContext>>) => {
        state.tables.contentReviews.splice(0, 1);
      },
    },
    {
      label: 'duplicate content review',
      blocker: 'revoked-target content review rows drifted',
      mutate: (state: Awaited<ReturnType<typeof exactContext>>) => {
        state.tables.contentReviews.push({
          ...state.tables.contentReviews[0],
          _id: 'review:duplicate',
        });
      },
    },
    {
      label: 'content review hash drift',
      blocker: 'revoked-target content review rows drifted',
      mutate: (state: Awaited<ReturnType<typeof exactContext>>) => {
        state.tables.contentReviews[0].decision = 'rejected';
      },
    },
    ...([
      ['aiAuditRuns', 'original AI run'],
      ['aiContentAudits', 'original AI content audit'],
      ['aiEvidenceAudits', 'original AI evidence audit'],
    ] as const).flatMap(([table, label]) => ([
      {
        label: `missing ${label}`,
        blocker: 'original lsn_early_math AI audit chain is missing, duplicated or drifted',
        mutate: (state: Awaited<ReturnType<typeof exactContext>>) => {
          state.tables[table].length = 0;
        },
      },
      {
        label: `duplicate ${label}`,
        blocker: 'original lsn_early_math AI audit chain is missing, duplicated or drifted',
        mutate: (state: Awaited<ReturnType<typeof exactContext>>) => {
          state.tables[table].push({ ...state.tables[table][0], _id: `${table}:duplicate` });
        },
      },
      {
        label: `${label} hash drift`,
        blocker: 'original lsn_early_math AI audit chain is missing, duplicated or drifted',
        mutate: (state: Awaited<ReturnType<typeof exactContext>>) => {
          state.tables[table][0].outputHash = '0'.repeat(64);
        },
      },
    ])),
  ])('refuses with zero writes on $label', async ({ blocker, mutate }) => {
    vi.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);
    const state = await exactContext();
    mutate(state);
    await expect(registeredHandler(preflight)(state.ctx, {
      releaseId: AI_EARLY_MATH_PROVENANCE_CORRECTION_RELEASE_ID,
    })).resolves.toMatchObject({ phase: 'blocked', blockers: expect.arrayContaining([blocker]) });
    await expect(registeredHandler(prepare)(state.ctx, {
      releaseId: AI_EARLY_MATH_PROVENANCE_CORRECTION_RELEASE_ID,
    })).rejects.toThrow(/blocked/);
    expect(state.patch).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalled();
  });

  it('rejects an unrelated replacement note even after an exact correction', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);
    const state = await exactContext();
    await registeredHandler(prepare)(state.ctx, {
      releaseId: AI_EARLY_MATH_PROVENANCE_CORRECTION_RELEASE_ID,
    });
    const staged = state.tables.evidenceSources[0];
    const stagedHash = await sha256Canonical(staged);
    expect(state.tables.auditLogs[3].after).toBe(
      aiEarlyMathCorrectionAuditAfterJson(FIXED_NOW, stagedHash),
    );
    Object.assign(staged, {
      reviewStatus: 'approved',
      reviewer: HUMAN_REVIEWER,
      reviewerQualification: HUMAN_QUALIFICATION,
      reviewDate: '2026-09-09',
      reviewNote: 'Reviewed a UNICEF report.',
      reviewerId: HUMAN_REVIEWER_ID,
      reviewScope: 'education',
      updatedAt: HUMAN_REVIEWED_AT,
    });
    const result = await registeredHandler(preflight)(state.ctx, {
      releaseId: AI_EARLY_MATH_PROVENANCE_CORRECTION_RELEASE_ID,
    }) as Row;
    expect(result.phase).toBe('blocked');
    expect(result.blockers).toContain(
      'new human review note is not bound to the Head Start ELOF source',
    );
  });
});
