import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  gdBirth2mEmotionalAuditAfterJson,
  gdBirth2mEmotionalAuditBeforeJson,
} from '../../../convex/gdBirth2mEmotionalCas';
import {
  apply as applyNhs,
  preflight as preflightNhs,
} from '../../../convex/nhsSoothingHumanReviewSuccessorCas';
import {
  apply as applyUnicef,
  preflight as preflightUnicef,
} from '../../../convex/unicefSeenCountedHumanReviewSuccessorCas';
import { setReview } from '../../../convex/evidence';
import { approveEvidenceEducationReviewed } from '../../../convex/release';
import {
  unicefSeenCountedAuditAfterJson,
  unicefSeenCountedAuditBeforeJson,
} from '../../../convex/unicefSeenCountedMetadataCas';
import {
  NHS_SOOTHING_HUMAN_REVIEW_SUCCESSOR_RELEASE_ID,
  NHS_SOOTHING_HUMAN_REVIEW_SUCCESSOR_SPEC,
  UNICEF_SEEN_COUNTED_HUMAN_REVIEW_SUCCESSOR_RELEASE_ID,
  UNICEF_SEEN_COUNTED_HUMAN_REVIEW_SUCCESSOR_SPEC,
} from '../../../convex/lib/evidenceHumanReviewSuccessorCasData';

type Row = Record<string, unknown>;
type SuccessorSpec = typeof NHS_SOOTHING_HUMAN_REVIEW_SUCCESSOR_SPEC
  | typeof UNICEF_SEEN_COUNTED_HUMAN_REVIEW_SUCCESSOR_SPEC;

const REVIEWER_ID = 'mn7successorowner000000000000000';
const REVIEWER_NAME = 'Qualified Owner Reviewer';
const REVIEWER_QUALIFICATION = 'MEd (Early Childhood and Special Education)';
const APPROVAL_TIME = Date.UTC(2026, 7, 24, 4, 0, 0);

function registeredHandler(fn: unknown) {
  return (fn as {
    _handler: (ctx: unknown, args: Record<string, unknown>) => Promise<unknown>;
  })._handler;
}

function priorAuditDocument(spec: SuccessorSpec): Row {
  if (spec === NHS_SOOTHING_HUMAN_REVIEW_SUCCESSOR_SPEC) {
    return {
      _id: spec.priorRelease.rowId,
      _creationTime: spec.priorRelease.creationTime,
      action: spec.priorRelease.action,
      entityTable: 'libraryContent,evidenceLinks,evidenceSources',
      summary: spec.priorRelease.releaseId,
      result: 'ok',
      before: gdBirth2mEmotionalAuditBeforeJson(),
      after: gdBirth2mEmotionalAuditAfterJson({
        updatedAt: 1_787_509_568_107,
        contentHash: spec.targets[0].content.exactCanonicalSha256,
        linkHash: spec.targets[0].link.exactCanonicalSha256,
        sourceHash: spec.stagedSource.exactCanonicalSha256,
        sourceRowId: spec.stagedSource.rowId,
        sourceCreationTime: spec.stagedSource.creationTime,
      }),
    };
  }
  return {
    _id: spec.priorRelease.rowId,
    _creationTime: spec.priorRelease.creationTime,
    action: spec.priorRelease.action,
    entityTable: 'evidenceSources',
    summary: spec.priorRelease.releaseId,
    result: 'ok',
    before: unicefSeenCountedAuditBeforeJson(),
    after: unicefSeenCountedAuditAfterJson(
      1_787_509_679_606,
      spec.stagedSource.exactCanonicalSha256,
    ),
  };
}

function mockContext(tables: Record<string, Row[]>) {
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
  let inserted = 0;
  const insert = vi.fn(async (table: string, value: Row) => {
    inserted += 1;
    const id = `${table}:successor:${inserted}`;
    const row = {
      ...value,
      _id: id,
      _creationTime: Date.now() + inserted / 10,
    };
    tables[table] ??= [];
    tables[table].push(row);
    return id;
  });
  const patch = vi.fn(async (id: string, value: Row) => {
    for (const rows of Object.values(tables)) {
      const index = rows.findIndex((candidate) => candidate._id === id);
      if (index < 0) continue;
      const nextRow = { ...rows[index] };
      for (const [key, next] of Object.entries(value)) {
        if (next === undefined) delete nextRow[key];
        else nextRow[key] = next;
      }
      rows[index] = nextRow;
      return;
    }
    throw new Error(`missing mock row: ${id}`);
  });
  const get = vi.fn(async () => null);
  const auth = {
    getUserIdentity: vi.fn(async () => ({ subject: REVIEWER_ID })),
  };
  return { ctx: { auth, db: { query, insert, patch, get } }, tables, insert, patch };
}

function successorContext(spec: SuccessorSpec) {
  return mockContext({
    libraryContent: spec.targets.map((target) =>
      structuredClone(target.content.document as Row)),
    evidenceLinks: spec.targets.map((target) =>
      structuredClone(target.link.document as Row)),
    evidenceSources: [
      structuredClone(spec.stagedSource.document as Row),
      ...spec.supportingSources.map((source) => structuredClone(source.document)),
    ],
    contentReviews: spec.targets.flatMap((target) =>
      target.reviews.map((row) => structuredClone(row.document as Row))),
    libraryMedia: spec.targets.flatMap((target) =>
      target.media.map((row) => structuredClone(row.document as Row))),
    aiContentAudits: [],
    aiPublicationReleases: [],
    aiEvidenceAudits: [],
    clinicalReviewBatches: [],
    clinicalReviewAssignments: [],
    parentProfiles: [],
    auditLogs: [priorAuditDocument(spec)],
  });
}

function approveThroughOrdinaryReview(
  state: ReturnType<typeof successorContext>,
  spec: SuccessorSpec,
) {
  const source = state.tables.evidenceSources.find((row) =>
    row.sourceId === spec.sourceId);
  if (!source) throw new Error('missing staged source');
  const note = `Human claim-scope review for ${spec.sourceId}`;
  Object.assign(source, {
    reviewStatus: 'approved',
    reviewer: REVIEWER_NAME,
    reviewerQualification: REVIEWER_QUALIFICATION,
    reviewDate: '2026-08-24',
    nextReviewDate: spec === NHS_SOOTHING_HUMAN_REVIEW_SUCCESSOR_SPEC
      ? '2029-04-22' : '2029-08-24',
    reviewNote: note,
    reviewerId: REVIEWER_ID,
    reviewScope: 'education',
    updatedAt: APPROVAL_TIME,
  });
  state.tables.parentProfiles.push({
    _id: 'profile:qualified-owner',
    _creationTime: APPROVAL_TIME - 10,
    userId: REVIEWER_ID,
    displayName: REVIEWER_NAME,
    preferredLocale: 'en',
    isStaff: true,
    staffRole: 'owner',
    staffQualification: REVIEWER_QUALIFICATION,
  });
  state.tables.auditLogs.push({
    _id: `audit:human:${spec.sourceId}`,
    _creationTime: APPROVAL_TIME + 0.25,
    actorId: REVIEWER_ID,
    action: 'evidence.setReview',
    entityTable: 'evidenceSources',
    entityId: spec.sourceId,
    summary: `awaiting_review → approved by ${REVIEWER_NAME} (${REVIEWER_QUALIFICATION})`,
    result: 'ok',
    before: 'awaiting_review / no reviewer / no date',
    after: `approved / ${REVIEWER_NAME} (${REVIEWER_QUALIFICATION}) / 2026-08-24 / note: ${note}`,
  });
}

async function approveThroughOrdinaryReviewMutation(
  state: ReturnType<typeof successorContext>,
  spec: SuccessorSpec,
) {
  state.tables.parentProfiles.push({
    _id: 'profile:qualified-owner',
    _creationTime: APPROVAL_TIME - 10,
    userId: REVIEWER_ID,
    displayName: REVIEWER_NAME,
    preferredLocale: 'en',
    isStaff: true,
    staffRole: 'owner',
    staffQualification: REVIEWER_QUALIFICATION,
  });
  const note = `Human claim-scope review for ${spec.sourceId}`;
  return await registeredHandler(setReview)(state.ctx, {
    sourceId: spec.sourceId,
    status: 'approved',
    reviewer: 'ignored in favor of authenticated owner profile',
    reviewerQualification: 'ignored in favor of authenticated owner profile',
    reviewDate: '2026-08-24',
    nextReviewDate: spec === NHS_SOOTHING_HUMAN_REVIEW_SUCCESSOR_SPEC
      ? '2029-04-22' : '2029-08-24',
    note,
  }) as Record<string, unknown>;
}

const units = [
  {
    label: 'NHS soothing',
    spec: NHS_SOOTHING_HUMAN_REVIEW_SUCCESSOR_SPEC,
    releaseId: NHS_SOOTHING_HUMAN_REVIEW_SUCCESSOR_RELEASE_ID,
    preflight: preflightNhs,
    apply: applyNhs,
  },
  {
    label: 'UNICEF Seen Counted',
    spec: UNICEF_SEEN_COUNTED_HUMAN_REVIEW_SUCCESSOR_SPEC,
    releaseId: UNICEF_SEEN_COUNTED_HUMAN_REVIEW_SUCCESSOR_RELEASE_ID,
    preflight: preflightUnicef,
    apply: applyUnicef,
  },
] as const;

afterEach(() => {
  vi.restoreAllMocks();
});

describe.each(units)('$label human-review successor CAS', (unit) => {
  it('starts at the exact staged postimage and waits for a human', async () => {
    const state = successorContext(unit.spec);
    const result = await registeredHandler(unit.preflight)(state.ctx, {
      releaseId: unit.releaseId,
      todayIso: '2026-08-24',
    }) as Record<string, unknown>;
    expect(result).toMatchObject({
      releaseId: unit.releaseId,
      phase: 'awaiting_human_review',
      blockers: [],
      priorReleaseAuditExact: true,
      successorAuditRows: 0,
      stagedSourceExact: true,
      sourceMetadataExact: true,
      sourceStatus: 'awaiting_review',
      sourceCitationEligible: false,
      humanReviewAuditRows: 0,
      persistedReleaseGovernedSource: false,
      aiEvidenceAuditRows: 0,
      supportingSourcesExact: true,
      contentsExact: true,
      linksExact: true,
      reviewsExact: true,
      mediaExact: true,
      targetCitationSetsEligible: true,
      reverseDependencyKeys: unit.spec.reverseDependencyKeys,
      reverseDependenciesExact: true,
      dataRowsChanged: 0,
    });
  });

  it('accepts only the exact ordinary qualified approval, audits it, and replays', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(APPROVAL_TIME + 1_000);
    const state = successorContext(unit.spec);
    const dataBefore = structuredClone({
      libraryContent: state.tables.libraryContent,
      evidenceLinks: state.tables.evidenceLinks,
      evidenceSources: state.tables.evidenceSources,
      contentReviews: state.tables.contentReviews,
      libraryMedia: state.tables.libraryMedia,
    });
    const priorAuditBefore = structuredClone(state.tables.auditLogs[0]);
    approveThroughOrdinaryReview(state, unit.spec);
    const ready = await registeredHandler(unit.preflight)(state.ctx, {
      releaseId: unit.releaseId,
      todayIso: '2026-08-24',
    }) as Record<string, unknown>;
    expect(ready).toMatchObject({
      phase: 'ready',
      blockers: [],
      humanReviewAuditRows: 1,
      humanReviewAuditExact: true,
      reviewerProfileExact: true,
      sourceCitationEligible: true,
      successorAuditRows: 0,
    });

    const approvedDataBefore = structuredClone({
      ...dataBefore,
      evidenceSources: state.tables.evidenceSources,
    });
    const result = await registeredHandler(unit.apply)(state.ctx, {
      releaseId: unit.releaseId,
    }) as Record<string, unknown>;
    expect(result).toMatchObject({
      releaseId: unit.releaseId,
      applied: true,
      alreadyApplied: false,
      dataRowsChanged: 0,
      establishedAt: APPROVAL_TIME + 1_000,
    });
    expect(state.patch).not.toHaveBeenCalled();
    expect(state.tables.auditLogs).toHaveLength(3);
    expect(state.tables.auditLogs[0]).toEqual(priorAuditBefore);
    expect({
      ...approvedDataBefore,
      evidenceSources: state.tables.evidenceSources,
    }).toEqual(approvedDataBefore);
    expect(state.insert).toHaveBeenCalledTimes(1);
    expect(state.insert).toHaveBeenCalledWith(
      'auditLogs',
      expect.objectContaining({
        action: unit.spec.releaseAction,
        entityTable: 'evidenceSources',
        entityId: unit.spec.sourceId,
        summary: unit.releaseId,
        result: 'ok',
      }),
    );

    const applied = await registeredHandler(unit.preflight)(state.ctx, {
      releaseId: unit.releaseId,
      todayIso: '2026-08-24',
    }) as Record<string, unknown>;
    expect(applied).toMatchObject({
      phase: 'applied',
      blockers: [],
      successorAuditRows: 1,
      successorAuditExact: true,
      dataRowsChanged: 0,
    });
    const replay = await registeredHandler(unit.apply)(state.ctx, {
      releaseId: unit.releaseId,
    }) as Record<string, unknown>;
    expect(replay).toMatchObject({
      applied: false,
      alreadyApplied: true,
      dataRowsChanged: 0,
      establishedAt: APPROVAL_TIME + 1_000,
    });
    expect(state.insert).toHaveBeenCalledTimes(1);
  });

  it('accepts the exact row and audit emitted by the ordinary setReview mutation', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(APPROVAL_TIME);
    const state = successorContext(unit.spec);
    const reviewResult = await approveThroughOrdinaryReviewMutation(
      state,
      unit.spec,
    );
    expect(reviewResult).toEqual({ ok: true, reviewScope: 'education' });
    expect(state.patch).toHaveBeenCalledTimes(1);
    expect(state.insert).toHaveBeenCalledTimes(1);
    expect(state.tables.auditLogs.at(-1)).toMatchObject({
      action: 'evidence.setReview',
      entityTable: 'evidenceSources',
      entityId: unit.spec.sourceId,
      result: 'ok',
    });

    const result = await registeredHandler(unit.preflight)(state.ctx, {
      releaseId: unit.releaseId,
      todayIso: '2026-08-24',
    }) as Record<string, unknown>;
    expect(result).toMatchObject({
      phase: 'ready',
      blockers: [],
      sourceStatus: 'approved',
      humanReviewAuditRows: 1,
      humanReviewAuditExact: true,
      reviewerProfileExact: true,
      persistedReleaseGovernedSource: false,
    });
  });

  it('blocks legacy bulk approval before it can patch the staged source', async () => {
    const state = successorContext(unit.spec);
    state.tables.parentProfiles.push({
      _id: 'profile:qualified-owner',
      _creationTime: APPROVAL_TIME - 10,
      userId: REVIEWER_ID,
      displayName: REVIEWER_NAME,
      preferredLocale: 'en',
      isStaff: true,
      staffRole: 'owner',
      staffQualification: REVIEWER_QUALIFICATION,
    });
    await expect(registeredHandler(approveEvidenceEducationReviewed)(
      state.ctx,
      {},
    )).rejects.toThrow(/reviewed individually through evidence\.setReview/);
    expect(state.patch).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalled();
  });

  it.each([
    ['prior audit', (state: ReturnType<typeof successorContext>) => {
      state.tables.auditLogs[0].after = '{}';
    }],
    ['content', (state: ReturnType<typeof successorContext>) => {
      state.tables.libraryContent[0].updatedAt = 1;
    }],
    ['link', (state: ReturnType<typeof successorContext>) => {
      state.tables.evidenceLinks[0].sourceIds = ['drifted'];
    }],
    ['review history', (state: ReturnType<typeof successorContext>) => {
      state.tables.contentReviews.pop();
    }],
    ['supporting source', (state: ReturnType<typeof successorContext>) => {
      state.tables.evidenceSources[1].verifiedNote = 'drifted';
    }],
    ['reverse dependency', (state: ReturnType<typeof successorContext>, spec: SuccessorSpec) => {
      state.tables.evidenceLinks.push({
        _id: 'link:unexpected',
        _creationTime: 1,
        kind: 'guide',
        slug: 'unexpected',
        sourceIds: [spec.sourceId],
      });
    }],
    ['AI audit', (state: ReturnType<typeof successorContext>) => {
      state.tables.aiContentAudits.push({
        _id: 'ai:unexpected',
        _creationTime: 1,
        contentSlug: state.tables.libraryContent[0].slug,
      });
    }],
    ['source-version AI evidence audit', (
      state: ReturnType<typeof successorContext>,
      spec: SuccessorSpec,
    ) => {
      state.tables.aiEvidenceAudits.push({
        _id: 'ai-evidence:unexpected',
        _creationTime: 1,
        sourceId: spec.sourceId,
        sourceUpdatedAt: APPROVAL_TIME,
      });
    }],
    ['persisted release governance', (
      state: ReturnType<typeof successorContext>,
      spec: SuccessorSpec,
    ) => {
      state.tables.clinicalReviewBatches.push({
        _id: 'batch:unexpected',
        _creationTime: 1,
        batchId: 'unexpected-release-batch',
        status: 'active',
        authority: 'release',
      });
      state.tables.clinicalReviewAssignments.push({
        _id: 'assignment:unexpected',
        _creationTime: 1,
        batchId: 'unexpected-release-batch',
        sourceIds: [spec.sourceId],
      });
    }],
  ] as const)('fails closed before any write on %s drift', async (
    _name,
    mutate,
  ) => {
    vi.spyOn(Date, 'now').mockReturnValue(APPROVAL_TIME + 1_000);
    const state = successorContext(unit.spec);
    approveThroughOrdinaryReview(state, unit.spec);
    (mutate as (
      target: ReturnType<typeof successorContext>,
      spec: SuccessorSpec,
    ) => void)(state, unit.spec);
    await expect(registeredHandler(unit.apply)(state.ctx, {
      releaseId: unit.releaseId,
    })).rejects.toThrow(/preflight blocked/);
    expect(state.patch).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalled();
  });

  it('rejects a forged approval audit or an unqualified owner profile', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(APPROVAL_TIME + 1_000);
    const state = successorContext(unit.spec);
    approveThroughOrdinaryReview(state, unit.spec);
    state.tables.auditLogs[1].before = 'approved / forged';
    state.tables.parentProfiles[0].staffQualification = '';
    const result = await registeredHandler(unit.preflight)(state.ctx, {
      releaseId: unit.releaseId,
      todayIso: '2026-08-24',
    }) as Record<string, unknown>;
    expect(result).toMatchObject({
      phase: 'blocked',
      humanReviewAuditExact: false,
      reviewerProfileExact: false,
    });
    await expect(registeredHandler(unit.apply)(state.ctx, {
      releaseId: unit.releaseId,
    })).rejects.toThrow(/preflight blocked/);
    expect(state.insert).not.toHaveBeenCalled();
  });

  it.each([
    ['before the exact predecessor stage boundary', (spec: SuccessorSpec) =>
      spec.priorRelease.creationTime - 1],
    ['before the approved source updatedAt', () => APPROVAL_TIME - 1],
  ] as const)('rejects an otherwise matching review audit created %s', async (
    _label,
    auditCreationTime,
  ) => {
    vi.spyOn(Date, 'now').mockReturnValue(APPROVAL_TIME + 1_000);
    const state = successorContext(unit.spec);
    approveThroughOrdinaryReview(state, unit.spec);
    state.tables.auditLogs[1]._creationTime = auditCreationTime(unit.spec);
    const result = await registeredHandler(unit.preflight)(state.ctx, {
      releaseId: unit.releaseId,
      todayIso: '2026-08-24',
    }) as Record<string, unknown>;
    expect(result).toMatchObject({
      phase: 'blocked',
      humanReviewAuditRows: 1,
      humanReviewAuditExact: false,
    });
    await expect(registeredHandler(unit.apply)(state.ctx, {
      releaseId: unit.releaseId,
    })).rejects.toThrow(/preflight blocked/);
    expect(state.insert).not.toHaveBeenCalled();
    expect(state.patch).not.toHaveBeenCalled();
  });

  it('detects source drift after the successor audit without rewriting history', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(APPROVAL_TIME + 1_000);
    const state = successorContext(unit.spec);
    approveThroughOrdinaryReview(state, unit.spec);
    await registeredHandler(unit.apply)(state.ctx, { releaseId: unit.releaseId });
    const source = state.tables.evidenceSources.find((row) =>
      row.sourceId === unit.spec.sourceId);
    if (!source) throw new Error('missing source');
    source.reviewNote = 'later drift';
    const result = await registeredHandler(unit.preflight)(state.ctx, {
      releaseId: unit.releaseId,
      todayIso: '2026-08-24',
    }) as Record<string, unknown>;
    expect(result.phase).toBe('blocked');
    expect(state.tables.auditLogs).toHaveLength(3);
  });
});
