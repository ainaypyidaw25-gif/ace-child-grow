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

import { apply, preflight, stageSources } from '../../../convex/olderSafety2026CasV2';
import {
  AAP_DROWNING_2021_DESIRED_REVERSE_KEYS,
  AAP_DROWNING_2021_SOURCE_ID,
  GD_19_24M_SAFETY_V2_DESIRED_COPY,
  GD_19_24M_SAFETY_INITIAL_COPY,
  OLDER_SAFETY_2026_STAGED_SOURCES,
  OLDER_SAFETY_2026_TARGETS,
  OLDER_SAFETY_EXISTING_SOURCE_PREIMAGES,
} from '../../../convex/lib/olderSafety2026CasV2Data';

type Row = Record<string, unknown>;

function registeredHandler(fn: unknown) {
  return (fn as {
    _handler: (ctx: unknown, args: Record<string, unknown>) => Promise<unknown>;
  })._handler;
}

function exactContext() {
  const targetLinks = OLDER_SAFETY_2026_TARGETS.map((target) => ({
    _id: target.linkId,
    _creationTime: target.linkCreationTime,
    createdAt: target.linkCreatedAt,
    updatedAt: target.linkInitialUpdatedAt,
    kind: target.kind,
    slug: target.slug,
    sourceIds: [...target.initialSourceIds],
    __exactCanonicalSha256: target.linkInitialCanonicalSha256,
  }));
  const preservedAapLinks = AAP_DROWNING_2021_DESIRED_REVERSE_KEYS.map((key, index) => {
    const [kind, slug] = key.split(':');
    return {
      _id: `preserved-link-${index}`,
      _creationTime: index + 1,
      createdAt: index + 1,
      updatedAt: index + 1,
      kind,
      slug,
      sourceIds: [AAP_DROWNING_2021_SOURCE_ID],
    };
  });
  const contentRows = OLDER_SAFETY_2026_TARGETS.map((target) => {
    const isCopyTarget = target.slug === 'gd_19_24m_safety';
    return {
      _id: target.contentId,
      _creationTime: target.contentCreationTime,
      createdAt: target.contentCreatedAt,
      updatedAt: target.contentInitialUpdatedAt,
      type: target.kind,
      slug: target.slug,
      clinicalStatus: 'clinical_review',
      reviewRevision: target.contentInitialReviewRevision,
      summaryMm: isCopyTarget ? GD_19_24M_SAFETY_INITIAL_COPY.mm : 'mm',
      summaryEn: isCopyTarget ? GD_19_24M_SAFETY_INITIAL_COPY.en : 'en',
      data: isCopyTarget ? { why: { ...GD_19_24M_SAFETY_INITIAL_COPY } } : {},
      searchText: isCopyTarget
        ? [
            GD_19_24M_SAFETY_INITIAL_COPY.mm.toLowerCase(),
            GD_19_24M_SAFETY_INITIAL_COPY.en.toLowerCase(),
            GD_19_24M_SAFETY_INITIAL_COPY.mm.toLowerCase(),
            GD_19_24M_SAFETY_INITIAL_COPY.en.toLowerCase(),
          ].join(' | ')
        : target.slug,
      __exactCanonicalSha256: target.contentInitialCanonicalSha256,
    };
  });
  const existingSources = OLDER_SAFETY_EXISTING_SOURCE_PREIMAGES.map((expected) => ({
    _id: expected.rowId,
    _creationTime: expected.creationTime,
    createdAt: 1,
    updatedAt: 1,
    sourceId: expected.sourceId,
    org: 'Frozen existing organisation',
    orgKey: 'GOV',
    title: expected.sourceId,
    authors: null,
    year: 2026,
    edition: null,
    country: 'United States',
    language: 'en',
    url: `https://example.test/${expected.sourceId}`,
    doi: null,
    isbn: null,
    pmid: null,
    evidenceLevel: 'guideline',
    reviewStatus: 'approved',
    reviewer: 'Named reviewer',
    reviewerId: 'reviewer-1',
    reviewerQualification: 'MBBS',
    reviewScope: 'clinical',
    reviewDate: '2026-08-23',
    nextReviewDate: '2028-08-23',
    keywords: [],
    topics: ['safety'],
    ageMonthsMin: 0,
    ageMonthsMax: 71,
    verifiedOn: '2026-08-23',
    verifiedNote: 'Frozen exact row; canonical hash is injected by the test.',
    searchText: expected.sourceId,
    __exactCanonicalSha256: expected.canonicalSha256,
  }));
  const tables: Record<string, Row[]> = {
    libraryContent: contentRows,
    evidenceLinks: [...targetLinks, ...preservedAapLinks],
    evidenceSources: existingSources,
    libraryMedia: [],
    contentReviews: [],
    aiPublicationReleases: [],
    aiContentAudits: [],
    auditLogs: [],
  };
  const byId = new Map<string, Row>();
  for (const rows of Object.values(tables)) {
    for (const row of rows) byId.set(String(row._id), row);
  }
  const query = vi.fn((table: string) => {
    const terminal = (conditions: Array<[string, unknown]> = []) => {
      const filtered = () => (tables[table] ?? []).filter((row) => conditions.every(
        ([field, value]) => row[field] === value,
      ));
      return { take: async (count: number) => filtered().slice(0, count) };
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
    const id = `${table}:older-safety:${++inserted}`;
    const row = { ...value, _id: id, _creationTime: Date.now() + inserted };
    tables[table] ??= [];
    tables[table].push(row);
    byId.set(id, row);
    return id;
  });
  const patch = vi.fn(async (id: string, value: Row) => {
    const row = byId.get(id);
    if (!row) throw new Error(`missing mock row: ${id}`);
    for (const [key, next] of Object.entries(value)) {
      if (next === undefined) delete row[key];
      else row[key] = next;
    }
    // The injected digest applies only to the frozen preimage. Let the real
    // canonicalizer hash every postimage after its release timestamp changes.
    if (Object.prototype.hasOwnProperty.call(value, 'updatedAt')) {
      delete row.__exactCanonicalSha256;
    }
  });
  const get = vi.fn(async (id: string) => byId.get(id) ?? null);
  return { ctx: { db: { query, insert, patch, get } }, tables, patch, insert };
}

function approveStagedSources(state: ReturnType<typeof exactContext>) {
  for (const expected of OLDER_SAFETY_2026_STAGED_SOURCES) {
    const row = state.tables.evidenceSources.find(
      (candidate) => candidate.sourceId === expected.sourceId,
    );
    if (!row) throw new Error(`missing staged source: ${expected.sourceId}`);
    Object.assign(row, {
      reviewStatus: 'approved',
      reviewer: 'Human clinical reviewer',
      reviewerId: 'human-reviewer-1',
      reviewerQualification: 'MBBS',
      reviewScope: 'clinical',
      reviewDate: '2026-08-23',
      nextReviewDate: '2028-08-23',
      updatedAt: Date.now(),
    });
  }
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('older-safety corrected v2 two-phase exact CAS handlers', () => {
  it('stages exact sources as awaiting_review and refuses content/link writes', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-08-23T12:00:00Z'));
    const state = exactContext();
    await expect(registeredHandler(preflight)(state.ctx, {})).resolves.toMatchObject({
      phase: 'sources_absent',
      sourcesAbsent: 3,
      reverseDependencyCount: 33,
      reverseDependenciesExact: true,
      blockers: [],
    });

    await expect(registeredHandler(stageSources)(state.ctx, {})).resolves.toMatchObject({
      ok: true,
      code: 'staged',
      inserted: 3,
      blockers: [],
    });
    for (const expected of OLDER_SAFETY_2026_STAGED_SOURCES) {
      const row = state.tables.evidenceSources.find(
        (candidate) => candidate.sourceId === expected.sourceId,
      );
      expect(row).toMatchObject({
        reviewStatus: 'awaiting_review',
        reviewer: null,
        reviewDate: null,
        nextReviewDate: null,
      });
      expect(row).not.toHaveProperty('reviewerId');
      expect(row).not.toHaveProperty('reviewerQualification');
      expect(row).not.toHaveProperty('reviewScope');
    }
    await expect(registeredHandler(preflight)(state.ctx, {})).resolves.toMatchObject({
      phase: 'source_review_required',
      sourcesAbsent: 0,
      sourcesAwaitingHumanReview: OLDER_SAFETY_2026_STAGED_SOURCES.map(
        (source) => source.sourceId,
      ),
      blockers: [],
    });

    const patchCalls = state.patch.mock.calls.length;
    await expect(registeredHandler(apply)(state.ctx, {})).resolves.toMatchObject({
      ok: false,
      phase: 'source_review_required',
      updated: 0,
    });
    expect(state.patch).toHaveBeenCalledTimes(patchCalls);
  });

  it('applies all nine rows only after human eligibility and detects postimage drift', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-08-23T12:00:00Z'));
    const state = exactContext();
    await registeredHandler(stageSources)(state.ctx, {});
    approveStagedSources(state);
    await expect(registeredHandler(preflight)(state.ctx, {})).resolves.toMatchObject({
      phase: 'ready',
      sourcesAbsent: 0,
      sourcesAwaitingHumanReview: [],
      blockers: [],
    });

    await expect(registeredHandler(apply)(state.ctx, {})).resolves.toEqual({
      ok: true,
      phase: 'applied',
      updated: 9,
      blockers: [],
    });
    expect(state.patch).toHaveBeenCalledTimes(18);
    for (const target of OLDER_SAFETY_2026_TARGETS) {
      const content = state.tables.libraryContent.find((row) => row.slug === target.slug)!;
      const link = state.tables.evidenceLinks.find(
        (row) => row.kind === target.kind && row.slug === target.slug,
      )!;
      expect(content).toMatchObject({
        clinicalStatus: 'clinical_review',
        reviewRevision: target.contentInitialReviewRevision + 1,
      });
      expect(content).not.toHaveProperty('reviewerId');
      expect(content).not.toHaveProperty('reviewScope');
      expect(link.sourceIds).toEqual(target.desiredSourceIds);
    }
    const copyTarget = state.tables.libraryContent.find(
      (row) => row.slug === 'gd_19_24m_safety',
    )!;
    expect(copyTarget).toMatchObject({
      summaryMm: GD_19_24M_SAFETY_V2_DESIRED_COPY.mm,
      summaryEn: GD_19_24M_SAFETY_V2_DESIRED_COPY.en,
    });
    expect(copyTarget.data).toMatchObject({
      why: {
        mm: GD_19_24M_SAFETY_V2_DESIRED_COPY.mm,
        en: GD_19_24M_SAFETY_V2_DESIRED_COPY.en,
      },
      evidenceSummary: GD_19_24M_SAFETY_V2_DESIRED_COPY.evidenceSummary,
    });
    expect(JSON.stringify(copyTarget)).not.toContain('Move climbable furniture away');
    expect(JSON.stringify(copyTarget)).not.toContain(
      'တက်နိုင်သော ပရိဘောဂများကို ဝေးရာရွှေ့',
    );
    await expect(registeredHandler(preflight)(state.ctx, {})).resolves.toMatchObject({
      phase: 'applied',
      reverseDependencyCount: 24,
      reverseDependenciesExact: true,
      blockers: [],
    });

    const patchCallsAfterApply = state.patch.mock.calls.length;
    const insertCallsAfterApply = state.insert.mock.calls.length;
    await expect(registeredHandler(apply)(state.ctx, {})).resolves.toEqual({
      ok: true,
      phase: 'applied',
      updated: 0,
      blockers: [],
    });
    expect(state.patch).toHaveBeenCalledTimes(patchCallsAfterApply);
    expect(state.insert).toHaveBeenCalledTimes(insertCallsAfterApply);

    const approved = state.tables.evidenceSources.find(
      (row) => row.sourceId === OLDER_SAFETY_2026_STAGED_SOURCES[0].sourceId,
    )!;
    approved.reviewStatus = 'retired';
    await expect(registeredHandler(preflight)(state.ctx, {})).resolves.toMatchObject({
      phase: 'blocked',
      blockers: [
        `approved staged source postimage drifted: ${OLDER_SAFETY_2026_STAGED_SOURCES[0].sourceId}`,
      ],
    });
  });

  it('fails closed on preimage drift before any content or link patch', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-08-24T12:00:00Z'));
    const state = exactContext();
    await registeredHandler(stageSources)(state.ctx, {});
    approveStagedSources(state);
    const drifted = state.tables.libraryContent.find(
      (row) => row.slug === 'gd_19_24m_safety',
    )!;
    drifted.summaryEn = 'drifted content';
    delete drifted.__exactCanonicalSha256;

    await expect(registeredHandler(preflight)(state.ctx, {})).resolves.toMatchObject({
      phase: 'blocked',
      blockers: expect.arrayContaining([
        'one or more content/link Production preimages drifted',
      ]),
    });
    const patchCalls = state.patch.mock.calls.length;
    const insertCalls = state.insert.mock.calls.length;

    await expect(registeredHandler(apply)(state.ctx, {})).resolves.toMatchObject({
      ok: false,
      phase: 'blocked',
      updated: 0,
    });
    expect(state.patch).toHaveBeenCalledTimes(patchCalls);
    expect(state.insert).toHaveBeenCalledTimes(insertCalls);
  });

  it.each([
    ['libraryMedia', 'media preimage drifted'],
    ['contentReviews', 'review preimage drifted'],
    ['aiPublicationReleases', 'AI release preimage drifted'],
    ['aiContentAudits', 'AI audit preimage drifted'],
  ])('fails closed when the %s related-row guard drifts', async (table, blocker) => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-08-24T12:00:00Z'));
    const state = exactContext();
    await registeredHandler(stageSources)(state.ctx, {});
    approveStagedSources(state);
    const target = OLDER_SAFETY_2026_TARGETS[0];
    state.tables[table].push({
      _id: `${table}-drift`,
      _creationTime: 1,
      contentSlug: target.slug,
      targetKey: `${target.kind}:${target.slug}`,
      reviewRevision: target.contentInitialReviewRevision,
      contentUpdatedAt: target.contentInitialUpdatedAt,
    });

    await expect(registeredHandler(preflight)(state.ctx, {})).resolves.toMatchObject({
      phase: 'blocked',
      blockers: expect.arrayContaining([`${blocker}: ${target.slug}`]),
    });
    const patchCalls = state.patch.mock.calls.length;
    const insertCalls = state.insert.mock.calls.length;
    await expect(registeredHandler(apply)(state.ctx, {})).resolves.toMatchObject({
      ok: false,
      phase: 'blocked',
      updated: 0,
    });
    expect(state.patch).toHaveBeenCalledTimes(patchCalls);
    expect(state.insert).toHaveBeenCalledTimes(insertCalls);
  });
});
