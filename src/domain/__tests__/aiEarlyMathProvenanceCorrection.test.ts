import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  aiEarlyMathCorrectionAuditAfterJson,
  aiEarlyMathCorrectionAuditBeforeJson,
  prepare,
  preflight,
} from '../../../convex/aiEarlyMathProvenanceCorrection';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import {
  AI_EARLY_MATH_PROVENANCE_CORRECTION_RELEASE_ID,
  AI_EARLY_MATH_PROVENANCE_CORRECTION_SPEC,
} from '../../../convex/lib/aiEarlyMathProvenanceCorrectionData';
import { AI_PUBLICATION_SUCCESSOR_20260909_TARGETS } from '../../../convex/lib/aiPublicationSuccessor20260909Data';

type Row = Record<string, unknown>;

const FIXED_NOW = Date.UTC(2026, 8, 9, 12, 0, 0);
const HUMAN_REVIEWED_AT = FIXED_NOW + 60_000;
const HUMAN_REVIEWER_ID = 'mn7headstartreviewer0000000000000';
const HUMAN_REVIEWER = 'Qualified Education Reviewer';
const HUMAN_QUALIFICATION = 'MEd (Early Childhood Education)';

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

function exactContext() {
  return mockContext({
    evidenceSources: [sourcePreimage()],
    evidenceLinks: [targetLinkPreimage()],
    auditLogs: [unrelatedHumanAuditPreimage()],
    aiEvidenceAudits: [],
    aiPublicationReleases: [],
    aiPublicationConfig: [],
    parentProfiles: [],
    clinicalReviewBatches: [],
    clinicalReviewAssignments: [],
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('early-math AI provenance correction CAS', () => {
  it('freezes the exact read-only Production preimage without adding PII literals', async () => {
    expect(await sha256Canonical(sourcePreimage()))
      .toBe(AI_EARLY_MATH_PROVENANCE_CORRECTION_SPEC.source.exactCanonicalSha256);
    expect(await sha256Canonical(targetLinkPreimage()))
      .toBe(AI_EARLY_MATH_PROVENANCE_CORRECTION_SPEC.dependency.exactCanonicalSha256);
    expect(await sha256Canonical(unrelatedHumanAuditPreimage()))
      .toBe(AI_EARLY_MATH_PROVENANCE_CORRECTION_SPEC.unrelatedHumanReviewAudit.exactCanonicalSha256);
  });

  it('moves only the exact source to awaiting_review and records no approval or publication', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);
    const state = exactContext();
    const before = await registeredHandler(preflight)(state.ctx, {
      releaseId: AI_EARLY_MATH_PROVENANCE_CORRECTION_RELEASE_ID,
    }) as Row;
    expect(before).toMatchObject({
      phase: 'correction_ready',
      blockers: [],
      todayIso: '2026-09-09',
      sourceExactPreimage: true,
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
    const state = exactContext();
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
      mutate: (state: ReturnType<typeof exactContext>) => {
        state.tables.evidenceSources[0].reviewNote = 'changed';
      },
    },
    {
      label: 'unexpected reverse dependency',
      mutate: (state: ReturnType<typeof exactContext>) => {
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
      label: 'unexpected AI publication release',
      mutate: (state: ReturnType<typeof exactContext>) => {
        state.tables.aiPublicationReleases.push({
          _id: 'release:unexpected',
          _creationTime: FIXED_NOW - 1,
          targetKey: 'lesson\u0000lsn_early_math',
        });
      },
    },
  ])('refuses with zero writes on $label', async ({ mutate }) => {
    vi.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);
    const state = exactContext();
    mutate(state);
    await expect(registeredHandler(prepare)(state.ctx, {
      releaseId: AI_EARLY_MATH_PROVENANCE_CORRECTION_RELEASE_ID,
    })).rejects.toThrow(/blocked/);
    expect(state.patch).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalled();
  });

  it('rejects an unrelated replacement note even after an exact correction', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);
    const state = exactContext();
    await registeredHandler(prepare)(state.ctx, {
      releaseId: AI_EARLY_MATH_PROVENANCE_CORRECTION_RELEASE_ID,
    });
    const staged = state.tables.evidenceSources[0];
    const stagedHash = await sha256Canonical(staged);
    expect(state.tables.auditLogs[1].after).toBe(
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
