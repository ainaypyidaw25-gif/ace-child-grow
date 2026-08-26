import { afterEach, describe, expect, it, vi } from 'vitest';
import { apply, preflightAt } from '../../../convex/nativeMyanmarRefreezeCorrection';
import {
  NATIVE_MYANMAR_REFREEZE_CONFIRMED_COPY,
  NATIVE_MYANMAR_REFREEZE_CORRECTION_ACTION,
  NATIVE_MYANMAR_REFREEZE_CORRECTION_EXPIRES_AT,
  NATIVE_MYANMAR_REFREEZE_CORRECTION_PREIMAGES,
  NATIVE_MYANMAR_REFREEZE_CORRECTION_RELEASE_ID,
  NATIVE_MYANMAR_REFREEZE_CORRECTION_TARGETS,
  NATIVE_MYANMAR_REFREEZE_REQUIRED_REVIEWS,
} from '../../../convex/lib/nativeMyanmarRefreezeCorrectionData';

type Row = Record<string, unknown>;

function registeredHandler(fn: unknown) {
  return (fn as {
    _handler: (ctx: unknown, args: Record<string, unknown>) => Promise<unknown>;
  })._handler;
}

function uniqueRows(rows: readonly Row[]): Row[] {
  return [...new Map(rows.map((row) => [String(row._id), structuredClone(row)])).values()];
}

function exactContext() {
  const fixture = NATIVE_MYANMAR_REFREEZE_CORRECTION_PREIMAGES;
  const tables: Record<string, Row[]> = {
    libraryContent: uniqueRows(fixture.targets.map((target) => target.content)),
    evidenceLinks: uniqueRows(fixture.targets.map((target) => target.link)),
    evidenceSources: uniqueRows(fixture.targets.flatMap((target) => target.sources)),
    libraryMedia: uniqueRows(fixture.targets.flatMap((target) => target.media)),
    contentReviews: uniqueRows(fixture.targets.flatMap((target) => target.reviews)),
    aiContentAudits: uniqueRows(fixture.targets.flatMap((target) => target.ai.contentAudits)),
    aiEvidenceAudits: uniqueRows(fixture.targets.flatMap((target) => target.ai.evidenceAudits)),
    aiPublicationReleases: uniqueRows(fixture.targets.flatMap((target) => target.ai.releases)),
    clinicalReviewBatches: uniqueRows(fixture.registry.batches),
    clinicalReviewAssignments: uniqueRows(fixture.registry.assignments),
    clinicalReviewBatchReceipts: uniqueRows(fixture.registry.receipts),
    auditLogs: uniqueRows(fixture.releaseAudits),
  };
  const byId = new Map<string, Row>();
  for (const rows of Object.values(tables)) {
    for (const row of rows) byId.set(String(row._id), row);
  }
  const query = vi.fn((table: string) => {
    const terminal = (conditions: Array<[string, unknown]> = []) => ({
      take: async (count: number) => (tables[table] ?? [])
        .filter((row) => conditions.every(([field, value]) => row[field] === value))
        .slice(0, count),
    });
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
    const id = `${table}:native-refreeze:${++inserted}`;
    const row = { ...value, _id: id, _creationTime: 2_000 + inserted };
    tables[table] ??= [];
    tables[table].push(row);
    byId.set(id, row);
    return id;
  });
  const patch = vi.fn(async (id: string, value: Row) => {
    const row = byId.get(String(id));
    if (!row) throw new Error(`missing mock row: ${id}`);
    for (const [key, next] of Object.entries(value)) {
      if (next === undefined) delete row[key];
      else row[key] = structuredClone(next);
    }
  });
  const get = vi.fn(async (id: string) => byId.get(String(id)) ?? null);
  return { ctx: { db: { query, insert, patch, get } }, tables, patch, insert };
}

const beforeExpiry = NATIVE_MYANMAR_REFREEZE_CORRECTION_EXPIRES_AT - 60_000;

afterEach(() => vi.restoreAllMocks());

describe('Native-Myanmar 14-item refreeze correction handlers', () => {
  it('reports the exact stopped-release preimage ready without writes', async () => {
    const state = exactContext();
    const result = await registeredHandler(preflightAt)(state.ctx, {
      releaseId: NATIVE_MYANMAR_REFREEZE_CORRECTION_RELEASE_ID,
      checkedAt: beforeExpiry,
    }) as Row;
    expect(result).toMatchObject({
      phase: 'ready',
      blockers: [],
      fixtureExact: true,
      registryExact: true,
      decisionSetExact: true,
      releaseAuditRows: 0,
    });
    expect(result.targets).toHaveLength(14);
    expect((result.targets as Row[]).every((target) => (
      target.contentInitialExact
      && target.linkExact
      && target.sourcesExact
      && target.citationsEligible
      && target.mediaExact
      && target.reviewsExact
      && target.aiExact
      && target.desiredRevisionApprovals === 0
      && (target.outstandingRequiredReviews as unknown[]).length === 6
    ))).toBe(true);
    expect(state.patch).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalled();
  });

  it.each([
    ['registry row', (state: ReturnType<typeof exactContext>) => {
      state.tables.clinicalReviewBatches[0].status = 'active';
    }],
    ['stopped decision', (state: ReturnType<typeof exactContext>) => {
      const decision = state.tables.contentReviews.find(
        (row) => row.clinicalReviewBatchId
          === NATIVE_MYANMAR_REFREEZE_CORRECTION_PREIMAGES.registry.batches
            .find((batch) => batch.status === 'stopped_changes_requested')?.batchId
          && row.decision === 'changes_requested',
      );
      if (!decision) throw new Error('missing stopped decision fixture');
      decision.note = 'drift';
    }],
    ['content row', (state: ReturnType<typeof exactContext>) => {
      state.tables.libraryContent[0].summaryMm = 'drift';
    }],
    ['review history', (state: ReturnType<typeof exactContext>) => {
      state.tables.contentReviews.push({
        _id: 'extra-review', _creationTime: 1, contentSlug: 'gd_5_6m_nutrition',
      });
    }],
    ['AI content audit', (state: ReturnType<typeof exactContext>) => {
      state.tables.aiContentAudits.push({
        _id: 'unexpected-ai', _creationTime: 1, contentSlug: 'gd_birth_2m_sleep',
      });
    }],
  ])('blocks %s drift before every write', async (_label, mutate) => {
    vi.spyOn(Date, 'now').mockReturnValue(beforeExpiry);
    const state = exactContext();
    mutate(state);
    await expect(registeredHandler(apply)(state.ctx, {
      releaseId: NATIVE_MYANMAR_REFREEZE_CORRECTION_RELEASE_ID,
    })).rejects.toThrow(/blocked/);
    expect(state.patch).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalled();
  });

  it('atomically advances all 14 revisions, changes only confirmed copy, and replays after expiry', async () => {
    const clock = vi.spyOn(Date, 'now').mockReturnValue(beforeExpiry);
    const state = exactContext();
    const initialReviews = structuredClone(state.tables.contentReviews);
    const initialLinks = structuredClone(state.tables.evidenceLinks);
    const initialSources = structuredClone(state.tables.evidenceSources);
    const initialMedia = structuredClone(state.tables.libraryMedia);

    const first = await registeredHandler(apply)(state.ctx, {
      releaseId: NATIVE_MYANMAR_REFREEZE_CORRECTION_RELEASE_ID,
    }) as Row;
    expect(first).toMatchObject({
      applied: true,
      alreadyApplied: false,
      contentUpdated: 14,
      semanticContentUpdated: 1,
      revisionOnlyContentUpdated: 13,
      linksUpdated: 0,
      publicationDecisionMade: false,
      updatedAt: beforeExpiry,
    });
    expect(state.patch).toHaveBeenCalledTimes(14);
    expect(state.insert).toHaveBeenCalledTimes(1);
    expect(state.tables.auditLogs[0]).toMatchObject({
      action: NATIVE_MYANMAR_REFREEZE_CORRECTION_ACTION,
      summary: NATIVE_MYANMAR_REFREEZE_CORRECTION_RELEASE_ID,
      result: 'ok',
    });
    expect(state.tables.contentReviews).toEqual(initialReviews);
    expect(state.tables.evidenceLinks).toEqual(initialLinks);
    expect(state.tables.evidenceSources).toEqual(initialSources);
    expect(state.tables.libraryMedia).toEqual(initialMedia);

    for (const target of NATIVE_MYANMAR_REFREEZE_CORRECTION_TARGETS) {
      const row = state.tables.libraryContent.find(
        (candidate) => candidate.slug === target.slug,
      )!;
      expect(row).toMatchObject({
        reviewRevision: target.desiredReviewRevision,
        clinicalStatus: 'clinical_review',
        updatedAt: beforeExpiry,
        requiredReviewDimensions: [...NATIVE_MYANMAR_REFREEZE_REQUIRED_REVIEWS],
      });
      expect(row.reviewerId).toBeUndefined();
      expect(row.reviewerDisplayName).toBeUndefined();
      expect(row.aiPublicationReleaseId).toBeUndefined();
    }
    const sleep = state.tables.libraryContent.find(
      (row) => row.slug === 'gd_birth_2m_sleep',
    )!;
    const sleepData = sleep.data as {
      safety: { mm: string };
      observationQuestions: Array<{ mm: string }>;
      encouragement: { mm: string };
    };
    expect(sleepData.safety.mm).toMatch(
      new RegExp(`^${NATIVE_MYANMAR_REFREEZE_CONFIRMED_COPY.safetyMm}`),
    );
    expect(sleepData.observationQuestions[1].mm)
      .toBe(NATIVE_MYANMAR_REFREEZE_CONFIRMED_COPY.observationQuestionMm);
    expect(sleepData.encouragement.mm)
      .toBe(NATIVE_MYANMAR_REFREEZE_CONFIRMED_COPY.encouragementMm);

    state.patch.mockClear();
    state.insert.mockClear();
    clock.mockReturnValue(NATIVE_MYANMAR_REFREEZE_CORRECTION_EXPIRES_AT + 60_000);
    const replay = await registeredHandler(apply)(state.ctx, {
      releaseId: NATIVE_MYANMAR_REFREEZE_CORRECTION_RELEASE_ID,
    }) as Row;
    expect(replay).toMatchObject({
      applied: false,
      alreadyApplied: true,
      contentUpdated: 0,
      updatedAt: beforeExpiry,
    });
    expect(state.patch).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalled();
  });
});
