import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../convex/lib/aiAuditHash', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../convex/lib/aiAuditHash')>();
  return {
    ...actual,
    sha256Canonical: vi.fn(async (value: unknown) => {
      const row = value as { __exactCanonicalSha256?: string };
      return row.__exactCanonicalSha256 ?? await actual.sha256Canonical(value);
    }),
  };
});

import { apply, preflight, stageSources } from '../../../convex/nutritionGuidesCas';
import {
  NUTRITION_GUIDES_CAS_RELEASE_ID,
  NUTRITION_GUIDES_CAS_TARGETS,
  NUTRITION_GUIDES_EXISTING_SOURCE_PREIMAGES,
  NUTRITION_GUIDES_NEW_SOURCE_IDS,
  NUTRITION_GUIDES_SOURCE_STAGE_RELEASE_ID,
} from '../../../convex/lib/nutritionGuidesCasData';

type Row = Record<string, unknown>;

function handler(fn: unknown) {
  return (fn as {
    _handler: (ctx: unknown, args: Record<string, unknown>) => Promise<unknown>;
  })._handler;
}

function initialData(slug: string): Record<string, unknown> {
  if (slug === 'gd_5_6m_nutrition') {
    return {
      weeklyActivities: [{ mm: 'old', en: 'old' }],
      faq: [
        { q: { mm: 'q1', en: 'q1' }, a: { mm: 'a1', en: 'a1' } },
        { q: { mm: 'q2', en: 'q2' }, a: { mm: 'old allergy', en: 'old allergy' } },
      ],
    };
  }
  if (slug === 'gd_7_9m_nutrition') {
    return {
      faq: [
        { q: { mm: 'q1', en: 'q1' }, a: { mm: 'a1', en: 'a1' } },
        { q: { mm: 'q2', en: 'q2' }, a: { mm: 'a2', en: 'a2' } },
        { q: { mm: 'q3', en: 'q3' }, a: { mm: 'old allergy', en: 'old allergy' } },
      ],
    };
  }
  return { safety: { mm: 'old safety', en: 'old safety' } };
}

function exactContext() {
  const contentRows = NUTRITION_GUIDES_CAS_TARGETS.map((target) => ({
    _id: target.contentId,
    _creationTime: target.contentCreationTime,
    type: target.kind,
    slug: target.slug,
    titleMm: target.slug,
    titleEn: target.slug,
    tags: ['nutrition'],
    data: initialData(target.slug),
    searchText: 'old',
    source: 'seed',
    version: 1,
    clinicalStatus: 'clinical_review',
    reviewRevision: target.contentInitialReviewRevision,
    createdAt: 1,
    updatedAt: target.contentInitialUpdatedAt,
    __exactCanonicalSha256: target.contentInitialCanonicalSha256,
  }));
  const linkRows = NUTRITION_GUIDES_CAS_TARGETS.map((target) => ({
    _id: target.linkId,
    _creationTime: target.linkCreationTime,
    kind: target.kind,
    slug: target.slug,
    sourceIds: [...target.initialSourceIds],
    createdAt: target.linkCreatedAt,
    updatedAt: target.linkInitialUpdatedAt,
    __exactCanonicalSha256: target.linkInitialCanonicalSha256,
  }));
  const reviewRows = NUTRITION_GUIDES_CAS_TARGETS.flatMap((target) => (
    target.reviews.map((review, index) => ({
      _id: review.rowId,
      _creationTime: review.creationTime,
      contentSlug: target.slug,
      contentVersion: target.contentInitialReviewRevision,
      reviewRevision: target.contentInitialReviewRevision,
      dimension: index === 0 ? 'english' : 'native_myanmar',
      decision: 'approved',
      reviewerId: 'reviewer-1',
      reviewerDisplayName: 'Reviewer',
      reviewerRole: 'content_editor',
      reviewedAt: 1,
      createdAt: 1,
      updatedAt: 1,
      __exactCanonicalSha256: review.exactCanonicalSha256,
    }))
  ));
  const sourceRows = NUTRITION_GUIDES_EXISTING_SOURCE_PREIMAGES.map(
    ([sourceId, rowId, creationTime, exactCanonicalSha256]) => ({
      _id: rowId,
      _creationTime: creationTime,
      sourceId,
      reviewStatus: 'approved',
      evidenceLevel: 'guideline',
      year: 2025,
      reviewDate: '2026-08-01',
      nextReviewDate: '2027-08-01',
      verifiedOn: '2026-08-01',
      updatedAt: 1,
      __exactCanonicalSha256: exactCanonicalSha256,
    }),
  );
  const tables: Record<string, Row[]> = {
    libraryContent: contentRows,
    evidenceLinks: linkRows,
    contentReviews: reviewRows,
    evidenceSources: sourceRows,
    libraryMedia: [],
    aiPublicationReleases: [],
    aiContentAudits: [],
    aiEvidenceAudits: [],
    auditLogs: [],
  };
  const byId = new Map<string, Row>();
  for (const rows of Object.values(tables)) {
    for (const row of rows) byId.set(String(row._id), row);
  }
  const query = vi.fn((table: string) => {
    const terminal = (conditions: Array<[string, unknown]> = []) => ({
      take: async (count: number) => (tables[table] ?? []).filter((row) => (
        conditions.every(([field, value]) => row[field] === value)
      )).slice(0, count),
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
    inserted += 1;
    const id = `${table}:nutrition:${inserted}`;
    const row = { ...value, _id: id, _creationTime: Date.now() + inserted };
    tables[table] ??= [];
    tables[table].push(row);
    byId.set(id, row);
    return id;
  });
  const patch = vi.fn(async (id: string, value: Row) => {
    const row = byId.get(id);
    if (!row) throw new Error(`missing row: ${id}`);
    for (const [key, next] of Object.entries(value)) {
      if (next === undefined) delete row[key];
      else row[key] = next;
    }
  });
  const get = vi.fn(async (id: string) => byId.get(id) ?? null);
  return { ctx: { db: { query, insert, patch, get } }, tables, insert, patch };
}

async function approveStagedSources(
  state: ReturnType<typeof exactContext>,
  onlySourceIds: readonly string[] = NUTRITION_GUIDES_NEW_SOURCE_IDS,
) {
  const now = Date.UTC(2026, 7, 24, 12);
  const rows = state.tables.evidenceSources.filter((candidate) => (
    NUTRITION_GUIDES_NEW_SOURCE_IDS.includes(candidate.sourceId as typeof NUTRITION_GUIDES_NEW_SOURCE_IDS[number])
    && onlySourceIds.includes(String(candidate.sourceId))
  ));
  for (const [index, row] of rows.entries()) {
    const outdated = row.sourceId === 'jr-niaid-peanut-prevention-2017';
    const reviewNote = outdated ? 'Still the primary NIAID-sponsored addendum for this bounded high-risk guidance.' : undefined;
    Object.assign(row, {
      reviewStatus: 'approved',
      reviewer: 'Human Evidence Reviewer',
      reviewerId: 'reviewer-1',
      reviewerQualification: 'MBBS',
      reviewDate: '2026-08-24',
      nextReviewDate: '2027-08-24',
      reviewScope: 'education',
      reviewNote,
      updatedAt: now + 4 + index,
    });
    await state.insert('auditLogs', {
      actorId: 'reviewer-1',
      action: 'evidence.setReview',
      entityTable: 'evidenceSources',
      entityId: row.sourceId,
      summary: `awaiting_review → approved by Human Evidence Reviewer (MBBS)${outdated ? ' · outdated-source advisory acknowledged in reviewer note' : ''}`,
      result: 'ok',
      before: 'awaiting_review / no reviewer / no date',
      after: `approved / Human Evidence Reviewer (MBBS) / 2026-08-24${reviewNote ? ` / note: ${reviewNote}` : ''}`,
    });
  }
}

afterEach(() => vi.restoreAllMocks());

describe('nutrition guide two-phase exact CAS handlers', () => {
  it('stages only awaiting-review sources and blocks content apply before human review', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.UTC(2026, 7, 24, 12));
    const state = exactContext();
    const before = await handler(preflight)(state.ctx, {
      releaseId: NUTRITION_GUIDES_CAS_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(before).toMatchObject({ phase: 'sources_absent', blockers: [], targetRows: 3 });

    const staged = await handler(stageSources)(state.ctx, {
      releaseId: NUTRITION_GUIDES_SOURCE_STAGE_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(staged).toMatchObject({
      staged: true,
      alreadyStaged: false,
      sourcesInserted: 2,
      humanReviewRequired: true,
    });
    const newRows = state.tables.evidenceSources.filter((row) => (
      NUTRITION_GUIDES_NEW_SOURCE_IDS.includes(row.sourceId as typeof NUTRITION_GUIDES_NEW_SOURCE_IDS[number])
    ));
    expect(newRows).toHaveLength(2);
    for (const row of newRows) {
      expect(row).toMatchObject({
        reviewStatus: 'awaiting_review',
        reviewer: null,
        reviewDate: null,
        nextReviewDate: null,
      });
      expect(row).not.toHaveProperty('reviewerId');
      expect(row).not.toHaveProperty('reviewScope');
    }
    const contentPatchCount = state.patch.mock.calls.length;
    await expect(handler(apply)(state.ctx, {
      releaseId: NUTRITION_GUIDES_CAS_RELEASE_ID,
    })).rejects.toThrow(/preflight blocked/);
    expect(state.patch).toHaveBeenCalledTimes(contentPatchCount);
    expect(state.tables.libraryContent.every((row) => row.reviewRevision === (
      NUTRITION_GUIDES_CAS_TARGETS.find((target) => target.slug === row.slug)
        ?.contentInitialReviewRevision
    ))).toBe(true);
  });

  it('keeps one-at-a-time human review progress retryable until both sources are eligible', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.UTC(2026, 7, 24, 12));
    const state = exactContext();
    await handler(stageSources)(state.ctx, {
      releaseId: NUTRITION_GUIDES_SOURCE_STAGE_RELEASE_ID,
    });
    await approveStagedSources(state, [NUTRITION_GUIDES_NEW_SOURCE_IDS[0]]);

    const partial = await handler(preflight)(state.ctx, {
      releaseId: NUTRITION_GUIDES_CAS_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(partial).toMatchObject({
      phase: 'awaiting_human_review',
      eligibleNewSources: 1,
      blockers: [],
    });
    await expect(handler(stageSources)(state.ctx, {
      releaseId: NUTRITION_GUIDES_SOURCE_STAGE_RELEASE_ID,
    })).resolves.toMatchObject({
      staged: false,
      alreadyStaged: true,
      sourcesInserted: 0,
    });
    await expect(handler(apply)(state.ctx, {
      releaseId: NUTRITION_GUIDES_CAS_RELEASE_ID,
    })).rejects.toThrow(/preflight blocked/);

    await approveStagedSources(state, [NUTRITION_GUIDES_NEW_SOURCE_IDS[1]]);
    await expect(handler(preflight)(state.ctx, {
      releaseId: NUTRITION_GUIDES_CAS_RELEASE_ID,
    })).resolves.toMatchObject({ phase: 'ready', eligibleNewSources: 2, blockers: [] });
  });

  it('applies all three content+link rows atomically after review and replays idempotently', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.UTC(2026, 7, 24, 12));
    const state = exactContext();
    await handler(stageSources)(state.ctx, {
      releaseId: NUTRITION_GUIDES_SOURCE_STAGE_RELEASE_ID,
    });
    await approveStagedSources(state);
    const ready = await handler(preflight)(state.ctx, {
      releaseId: NUTRITION_GUIDES_CAS_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(ready).toMatchObject({ phase: 'ready', eligibleNewSources: 2, blockers: [] });

    const applied = await handler(apply)(state.ctx, {
      releaseId: NUTRITION_GUIDES_CAS_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(applied).toMatchObject({
      applied: true,
      alreadyApplied: false,
      contentRowsUpdated: 3,
      linkRowsUpdated: 3,
      publicationDecision: 'not_made',
    });
    for (const target of NUTRITION_GUIDES_CAS_TARGETS) {
      const content = state.tables.libraryContent.find((row) => row.slug === target.slug);
      const link = state.tables.evidenceLinks.find((row) => row.slug === target.slug);
      expect(content).toMatchObject({
        clinicalStatus: 'clinical_review',
        reviewRevision: target.contentDesiredReviewRevision,
      });
      expect(content).not.toHaveProperty('reviewerId');
      expect(content).not.toHaveProperty('aiPublicationReleaseId');
      expect(link?.sourceIds).toEqual(target.desiredSourceIds);
    }
    expect(state.tables.contentReviews).toHaveLength(8);
    expect(state.tables.libraryMedia).toEqual([]);
    expect(state.tables.aiPublicationReleases).toEqual([]);
    expect(state.tables.aiContentAudits).toEqual([]);
    expect(state.tables.aiEvidenceAudits).toEqual([]);
    expect(state.tables.auditLogs).toHaveLength(4);
    const contentAudit = state.tables.auditLogs.find((row) => (
      row.action === 'release.nutrition_guides_content_evidence_correction'
    ));
    expect(String(contentAudit?.after)).toContain('"publicationDecision":"not_made"');
    expect(String(contentAudit?.after)).toContain('"desiredRevisionApprovals":0');

    const patchCalls = state.patch.mock.calls.length;
    const insertCalls = state.insert.mock.calls.length;
    const replay = await handler(apply)(state.ctx, {
      releaseId: NUTRITION_GUIDES_CAS_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(replay).toMatchObject({ applied: false, alreadyApplied: true });
    expect(state.patch).toHaveBeenCalledTimes(patchCalls);
    expect(state.insert).toHaveBeenCalledTimes(insertCalls);
  });

  it('blocks approved source rows without exact professional review audits and on source AI drift', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.UTC(2026, 7, 24, 12));
    const state = exactContext();
    await handler(stageSources)(state.ctx, {
      releaseId: NUTRITION_GUIDES_SOURCE_STAGE_RELEASE_ID,
    });
    await approveStagedSources(state);
    state.tables.auditLogs.splice(1, 1);
    const missingAudit = await handler(preflight)(state.ctx, {
      releaseId: NUTRITION_GUIDES_CAS_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(missingAudit).toMatchObject({ phase: 'blocked' });
    expect(missingAudit.blockers).toContain(
      'human evidence review audit missing or drifted: cdc-introduce-solid-foods-2026',
    );

    const stateWithAi = exactContext();
    stateWithAi.tables.aiEvidenceAudits.push({
      _id: 'ai-evidence-1',
      _creationTime: 1,
      sourceId: NUTRITION_GUIDES_EXISTING_SOURCE_PREIMAGES[0][0],
      sourceUpdatedAt: 1,
    });
    const aiDrift = await handler(preflight)(stateWithAi.ctx, {
      releaseId: NUTRITION_GUIDES_CAS_RELEASE_ID,
    }) as Record<string, unknown>;
    expect(aiDrift).toMatchObject({ phase: 'blocked' });
    expect(aiDrift.blockers).toContain(
      `AI evidence audit appeared: ${NUTRITION_GUIDES_EXISTING_SOURCE_PREIMAGES[0][0]}`,
    );
  });

  it('fails before target writes when a frozen review row drifts', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.UTC(2026, 7, 24, 12));
    const state = exactContext();
    state.tables.contentReviews.pop();
    await expect(handler(stageSources)(state.ctx, {
      releaseId: NUTRITION_GUIDES_SOURCE_STAGE_RELEASE_ID,
    })).rejects.toThrow(/preflight blocked/);
    expect(state.patch).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalled();
  });
});
