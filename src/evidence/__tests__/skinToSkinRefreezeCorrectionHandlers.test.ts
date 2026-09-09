import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../convex/lib/aiAuditHash', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../convex/lib/aiAuditHash')>();
  return {
    ...actual,
    sha256Canonical: vi.fn(async (value: unknown) => {
      if (Array.isArray(value) && value.length > 0) {
        const marked = value[0] as { __collectionCanonicalSha256?: string };
        if (marked.__collectionCanonicalSha256) return marked.__collectionCanonicalSha256;
      }
      const row = value as {
        __exactCanonicalSha256?: string;
        data?: { __mockAuthoredSha256?: string };
      };
      if (row.__exactCanonicalSha256) return row.__exactCanonicalSha256;
      if (row.data?.__mockAuthoredSha256) return row.data.__mockAuthoredSha256;
      return actual.sha256Canonical(value);
    }),
  };
});

import { apply, preflightAt } from '../../../convex/skinToSkinRefreezeCorrection';
import {
  SKIN_TO_SKIN_REFREEZE_CORRECTION_RELEASE_ID,
  SKIN_TO_SKIN_REFREEZE_REGISTRY_PREIMAGE,
  SKIN_TO_SKIN_REFREEZE_REQUIRED_REVIEWS,
  SKIN_TO_SKIN_REFREEZE_TARGETS,
} from '../../../convex/lib/skinToSkinRefreezeCorrectionData';

type Row = Record<string, unknown>;

function registeredHandler(fn: unknown) {
  return (fn as {
    _handler: (ctx: unknown, args: Record<string, unknown>) => Promise<unknown>;
  })._handler;
}

const reviewer = {
  reviewerDisplayName: 'Phyo Ko Ko',
  reviewerId: 'mn726081xpgg24y4z4tq9ncw098bh6t1',
  reviewerQualification: 'MBBS',
  reviewerRole: 'clinical_reviewer',
};

const changeNote = 'WHO ရင်းမြစ်များသည် မီးဖွား/မွေးကင်းစ ကျန်းမာရေးဌာနအတွင်း ချက်ချင်း skin-to-skin နှင့် နို့တိုက်ပံ့ပိုးမှုကိုသာ တိုက်ရိုက်ထောက်ခံပါသည်။ အိမ်တွင် ထပ်ခါတလဲလဲ calming အဖြစ် သုံးခြင်းနှင့် “Feeding often becomes easier” ဟူသော outcome ကို တိုက်ရိုက်မထောက်ခံသေးပါ။ Outcome ကို bonding/settling အထိ ကျဉ်းစေပြီး နို့တိုက်ကျွေးမှု claim ကို ဖယ်ရှားပါ သို့မဟုတ် အိမ်တွင်းထပ်ခါတလဲလဲ အသုံးပြုမှုကို တိုက်ရိုက်ထောက်ခံသည့် ရင်းမြစ် ထပ်ချိတ်ပါ။';

function clinicalReviewRows(): Row[] {
  return [
    {
      _id: 'nn7cr0zpahffckza48vxt0cqq18d2j00',
      _creationTime: 1_787_577_658_243.519,
      clinicalReviewBatchId: SKIN_TO_SKIN_REFREEZE_REGISTRY_PREIMAGE.rootBatchId,
      contentSlug: 'act_skin_to_skin_calm',
      contentVersion: 2,
      createdAt: 1_787_577_658_243,
      decision: 'changes_requested',
      decisionKey: '4e47f8cb6a8bce4275320ff2a4abaa68b7b3828fbe3adff946caae9a6d562e6d',
      dimension: 'clinical',
      note: changeNote,
      reviewRevision: 2,
      reviewedAt: 1_787_577_658_243,
      updatedAt: 1_787_577_658_243,
      ...reviewer,
      __collectionCanonicalSha256: SKIN_TO_SKIN_REFREEZE_TARGETS[0].reviewsCanonicalSha256,
    },
    {
      _id: 'nn70mzzyxwgy8606p34mpszew58d3bvy',
      _creationTime: 1_787_577_617_519.2214,
      clinicalReviewBatchId: SKIN_TO_SKIN_REFREEZE_REGISTRY_PREIMAGE.rootBatchId,
      contentSlug: 'gd_birth_2m_sleep',
      contentVersion: 3,
      createdAt: 1_787_577_617_520,
      decision: 'approved',
      decisionKey: '6fcdbfce7420a71829401e140472716fc91162abb6aeddbe1a17925810ff918b',
      dimension: 'clinical',
      reviewRevision: 3,
      reviewedAt: 1_787_577_617_520,
      updatedAt: 1_787_577_617_520,
      ...reviewer,
      __collectionCanonicalSha256: SKIN_TO_SKIN_REFREEZE_TARGETS[1].reviewsCanonicalSha256,
    },
    {
      _id: 'nn76hbp7r7r8rcrb50gtq05m1h8bx5as',
      _creationTime: 1_785_909_255_655.8262,
      contentSlug: 'gd_birth_2m_sleep',
      contentVersion: 2,
      decision: 'approved',
      dimension: 'native_myanmar',
      reviewRevision: 2,
      reviewedAt: 1,
      __collectionCanonicalSha256: SKIN_TO_SKIN_REFREEZE_TARGETS[1].reviewsCanonicalSha256,
    },
    {
      _id: 'nn7b1rkvbqsbzcqb7pgxqet1ss8bwh5h',
      _creationTime: 1_785_909_253_534.748,
      contentSlug: 'gd_birth_2m_sleep',
      contentVersion: 2,
      decision: 'approved',
      dimension: 'english',
      reviewRevision: 2,
      reviewedAt: 1,
      __collectionCanonicalSha256: SKIN_TO_SKIN_REFREEZE_TARGETS[1].reviewsCanonicalSha256,
    },
  ];
}

function exactContext() {
  const reviews = clinicalReviewRows();
  const sourceById = new Map<string, Row>();
  for (const target of SKIN_TO_SKIN_REFREEZE_TARGETS) {
    for (const [index, sourceId] of target.sourceIds.entries()) {
      const existing = sourceById.get(sourceId);
      const row = existing ?? {
        _id: `source:${sourceId}`,
        _creationTime: index + 1,
        sourceId,
        evidenceLevel: 'guideline',
        reviewStatus: 'approved',
        year: 2022,
        reviewDate: '2026-07-26',
        nextReviewDate: '2027-07-26',
        verifiedOn: '2026-07-24',
        updatedAt: 1_787_000_000_000 + index,
      };
      if (index === 0) row.__collectionCanonicalSha256 = target.sourcesCanonicalSha256;
      sourceById.set(sourceId, row);
    }
  }
  const content = SKIN_TO_SKIN_REFREEZE_TARGETS.map((target) => ({
    ...structuredClone(target.desiredContent),
    _id: target.contentId,
    _creationTime: target.contentCreationTime,
    data: { __mockAuthoredSha256: target.initialAuthoredSha256 },
    clinicalStatus: 'clinical_review',
    reviewRevision: target.initialReviewRevision,
    updatedAt: target.initialUpdatedAt,
    __exactCanonicalSha256: target.initialCanonicalSha256,
  }));
  const links = SKIN_TO_SKIN_REFREEZE_TARGETS.map((target) => ({
    _id: target.linkId,
    _creationTime: target.linkCreationTime,
    kind: target.kind,
    slug: target.slug,
    sourceIds: [...target.sourceIds],
    createdAt: target.linkCreatedAt,
    updatedAt: target.linkUpdatedAt,
    __exactCanonicalSha256: target.linkCanonicalSha256,
  }));
  const media: Row[] = [
    {
      _id: 'm172tgzanrzj52e8qbfy8h3s2n8c82xn',
      _creationTime: 1,
      contentSlug: 'act_skin_to_skin_calm',
      kind: 'illustration',
      placeholder: true,
      __collectionCanonicalSha256: SKIN_TO_SKIN_REFREEZE_TARGETS[0].mediaCanonicalSha256,
    },
    {
      _id: 'm178wsterwt1bvh3a4fxeq5cdn8c88h6',
      _creationTime: 2,
      contentSlug: 'act_skin_to_skin_calm',
      kind: 'video',
      placeholder: true,
      __collectionCanonicalSha256: SKIN_TO_SKIN_REFREEZE_TARGETS[0].mediaCanonicalSha256,
    },
  ];
  const batches: Row[] = [
    {
      _id: 'batch:root',
      _creationTime: 1,
      batchId: SKIN_TO_SKIN_REFREEZE_REGISTRY_PREIMAGE.rootBatchId,
      freezeDigest: 'db3036076969eb8934acc46b8ce7ef3ec85036c4a737606cea96d9cadeb0aa7d',
      status: 'stopped_changes_requested',
      __collectionCanonicalSha256:
        SKIN_TO_SKIN_REFREEZE_REGISTRY_PREIMAGE.batchesCanonicalSha256,
    },
    {
      _id: 'batch:nutrition', _creationTime: 2, batchId: 'nutrition', status: 'frozen',
      __collectionCanonicalSha256:
        SKIN_TO_SKIN_REFREEZE_REGISTRY_PREIMAGE.batchesCanonicalSha256,
    },
    {
      _id: 'batch:safety', _creationTime: 3, batchId: 'safety', status: 'frozen',
      __collectionCanonicalSha256:
        SKIN_TO_SKIN_REFREEZE_REGISTRY_PREIMAGE.batchesCanonicalSha256,
    },
  ];
  const assignments: Row[] = [
    {
      _id: 'assignment:skin',
      _creationTime: 1,
      batchId: SKIN_TO_SKIN_REFREEZE_REGISTRY_PREIMAGE.rootBatchId,
      ordinal: 1,
      contentSlug: 'act_skin_to_skin_calm',
      assignmentId: '4e47f8cb6a8bce4275320ff2a4abaa68b7b3828fbe3adff946caae9a6d562e6d',
      __collectionCanonicalSha256:
        SKIN_TO_SKIN_REFREEZE_REGISTRY_PREIMAGE.assignmentsCanonicalSha256,
    },
    {
      _id: 'assignment:sleep',
      _creationTime: 2,
      batchId: SKIN_TO_SKIN_REFREEZE_REGISTRY_PREIMAGE.rootBatchId,
      ordinal: 2,
      contentSlug: 'gd_birth_2m_sleep',
      assignmentId: '6fcdbfce7420a71829401e140472716fc91162abb6aeddbe1a17925810ff918b',
      __collectionCanonicalSha256:
        SKIN_TO_SKIN_REFREEZE_REGISTRY_PREIMAGE.assignmentsCanonicalSha256,
    },
    ...Array.from({ length: 12 }, (_, index) => ({
      _id: `assignment:other:${index}`,
      _creationTime: index + 3,
      batchId: index < 3 ? 'nutrition' : 'safety',
      ordinal: index + 1,
      contentSlug: `other-${index}`,
      assignmentId: `other-${index}`,
      __collectionCanonicalSha256:
        SKIN_TO_SKIN_REFREEZE_REGISTRY_PREIMAGE.assignmentsCanonicalSha256,
    })),
  ];
  const tables: Record<string, Row[]> = {
    libraryContent: content,
    evidenceLinks: links,
    evidenceSources: [...sourceById.values()],
    libraryMedia: media,
    contentReviews: reviews,
    clinicalReviewBatches: batches,
    clinicalReviewAssignments: assignments,
    clinicalReviewBatchReceipts: [],
    aiContentAudits: [],
    aiEvidenceAudits: [],
    aiPublicationReleases: [],
    auditLogs: [],
  };
  const byId = new Map<string, Row>();
  for (const rows of Object.values(tables)) for (const row of rows) byId.set(String(row._id), row);
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
    const id = `${table}:skin-refreeze:${++inserted}`;
    const row = { ...value, _id: id, _creationTime: 2_000 + inserted };
    tables[table] ??= [];
    tables[table].push(row);
    byId.set(id, row);
    return id;
  });
  const patch = vi.fn(async (id: string, value: Row) => {
    const row = byId.get(id);
    if (!row) throw new Error(`missing mock row: ${id}`);
    delete row.__exactCanonicalSha256;
    for (const [key, next] of Object.entries(value)) {
      if (next === undefined) delete row[key];
      else row[key] = next;
    }
  });
  const get = vi.fn(async (id: string) => byId.get(id) ?? null);
  return { ctx: { db: { query, insert, patch, get } }, tables, patch, insert };
}

afterEach(() => vi.restoreAllMocks());

describe('skin-to-skin refreeze exact correction handlers', () => {
  it('reports the exact stopped-batch preimage ready without writes', async () => {
    const state = exactContext();
    const result = await registeredHandler(preflightAt)(state.ctx, {
      releaseId: SKIN_TO_SKIN_REFREEZE_CORRECTION_RELEASE_ID,
      checkedAt: 1_787_572_800_000,
    }) as Row;
    expect(result).toMatchObject({
      phase: 'ready',
      blockers: [],
      rootBatchStatus: 'stopped_changes_requested',
      rootDecisionSetExact: true,
      registryExact: true,
    });
    expect((result.targets as Row[]).map((target) => ({
      slug: target.slug,
      initialMatches: target.initialMatches,
      linkExact: target.linkExact,
      reviewsExact: target.reviewsExact,
      outstandingRequiredReviews: target.outstandingRequiredReviews,
    }))).toEqual(SKIN_TO_SKIN_REFREEZE_TARGETS.map((target) => ({
      slug: target.slug,
      initialMatches: true,
      linkExact: true,
      reviewsExact: true,
      outstandingRequiredReviews: [...SKIN_TO_SKIN_REFREEZE_REQUIRED_REVIEWS],
    })));
    expect(state.patch).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalled();
  });

  it.each([
    ['registry hash', (state: ReturnType<typeof exactContext>) => {
      for (const row of state.tables.clinicalReviewBatches) {
        row.__collectionCanonicalSha256 = '0'.repeat(64);
      }
    }],
    ['decision note', (state: ReturnType<typeof exactContext>) => {
      state.tables.contentReviews.find((row) => row.contentSlug === 'act_skin_to_skin_calm')!.note = 'drift';
    }],
    ['source version AI audit', (state: ReturnType<typeof exactContext>) => {
      const source = state.tables.evidenceSources[0];
      state.tables.aiEvidenceAudits.push({
        _id: 'ai:evidence', _creationTime: 1, sourceId: source.sourceId,
        sourceUpdatedAt: source.updatedAt,
      });
    }],
    ['review history count', (state: ReturnType<typeof exactContext>) => {
      state.tables.contentReviews.push({
        _id: 'extra', _creationTime: 3, contentSlug: 'gd_birth_2m_sleep',
      });
    }],
  ])('blocks %s drift before every write', async (_label, mutate) => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_572_800_000);
    const state = exactContext();
    mutate(state);
    await expect(registeredHandler(apply)(state.ctx, {
      releaseId: SKIN_TO_SKIN_REFREEZE_CORRECTION_RELEASE_ID,
    })).rejects.toThrow(/blocked/);
    expect(state.patch).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalled();
  });

  it('atomically advances both revisions, preserves decisions, and replays with zero writes', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_787_572_800_000);
    const state = exactContext();
    const first = await registeredHandler(apply)(state.ctx, {
      releaseId: SKIN_TO_SKIN_REFREEZE_CORRECTION_RELEASE_ID,
    }) as Row;
    expect(first).toMatchObject({
      applied: true,
      alreadyApplied: false,
      contentUpdated: 2,
      linksUpdated: 0,
      reviewRowsPreserved: 4,
      requiredFreshReviews: 12,
      publicationDecisionMade: false,
    });
    expect(state.patch).toHaveBeenCalledTimes(2);
    expect(state.insert).toHaveBeenCalledTimes(1);
    expect(state.tables.contentReviews).toHaveLength(4);
    for (const target of SKIN_TO_SKIN_REFREEZE_TARGETS) {
      const row = state.tables.libraryContent.find((candidate) => candidate.slug === target.slug)!;
      expect(row).toMatchObject({
        reviewRevision: target.desiredReviewRevision,
        clinicalStatus: 'clinical_review',
        updatedAt: 1_787_572_800_000,
        requiredReviewDimensions: [...SKIN_TO_SKIN_REFREEZE_REQUIRED_REVIEWS],
      });
      expect(row.reviewerId).toBeUndefined();
      expect(row.aiPublicationReleaseId).toBeUndefined();
    }
    const skin = state.tables.libraryContent.find((row) => row.slug === 'act_skin_to_skin_calm')!;
    expect(skin.titleEn).toBe('Awake skin-to-skin closeness');
    expect(JSON.stringify(skin)).not.toContain('Feeding often becomes easier');

    state.patch.mockClear();
    state.insert.mockClear();
    const replay = await registeredHandler(apply)(state.ctx, {
      releaseId: SKIN_TO_SKIN_REFREEZE_CORRECTION_RELEASE_ID,
    }) as Row;
    expect(replay).toMatchObject({ applied: false, alreadyApplied: true, contentUpdated: 0 });
    expect(state.patch).not.toHaveBeenCalled();
    expect(state.insert).not.toHaveBeenCalled();
  });
});
