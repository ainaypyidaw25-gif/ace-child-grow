import { beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({ userId: null as string | null }));

vi.mock('@convex-dev/auth/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@convex-dev/auth/server')>();
  return { ...actual, getAuthUserId: vi.fn(async () => authState.userId) };
});

vi.mock('../../../convex/lib/aiAuditHash', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../convex/lib/aiAuditHash')>();
  return {
    ...actual,
    sha256Canonical: vi.fn(async (value: unknown) => {
      if (Array.isArray(value) && value.length > 0) {
        const first = value[0] as { __groupHash?: string };
        if (first.__groupHash) return first.__groupHash;
      }
      if (value && typeof value === 'object' && '__hash' in value) {
        return String((value as { __hash: string }).__hash);
      }
      return await actual.sha256Canonical(value);
    }),
  };
});

import { getAssignedBatch, saveAssignedDecision } from '../../../convex/clinicalReviewBatch';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import {
  CLINICAL_REVIEW_BATCH_COUNT,
  CLINICAL_REVIEW_BATCH_EXPIRES_AT,
  CLINICAL_REVIEW_BATCH_HASH,
  CLINICAL_REVIEW_BATCH_ID,
  CLINICAL_REVIEW_BATCH_ITEMS,
  CLINICAL_REVIEW_BATCH_MANIFEST,
  CLINICAL_REVIEW_BATCH_REVIEWER,
} from '../../../convex/lib/clinicalReviewBatchData';

const frozenProfile = {
  _creationTime: 1785417794053.964,
  _id: 'md79ghw3fm2a09pvhgs63c754n8bgnpy',
  consentAcceptedAt: 1785417794054,
  displayName: 'Phyo Ko Ko',
  isStaff: true,
  parentTourCompletedVersion: 1,
  preferredLocale: 'mm',
  staffQualification: 'MBBS',
  staffRole: 'clinical_reviewer',
  staffTourCompletedVersion: 1,
  userId: 'mn726081xpgg24y4z4tq9ncw098bh6t1',
};

const stableReviewerIdentity = {
  profileId: CLINICAL_REVIEW_BATCH_REVIEWER.profileId,
  userId: CLINICAL_REVIEW_BATCH_REVIEWER.userId,
  isStaff: true,
  displayName: CLINICAL_REVIEW_BATCH_REVIEWER.displayName,
  qualification: CLINICAL_REVIEW_BATCH_REVIEWER.qualification,
  role: CLINICAL_REVIEW_BATCH_REVIEWER.role,
};

const milestone = CLINICAL_REVIEW_BATCH_ITEMS[0];
const activity = CLINICAL_REVIEW_BATCH_ITEMS[1];

function contentRows() {
  return [
    {
      _id: milestone.contentId,
      _creationTime: milestone.contentCreationTime,
      __hash: milestone.contentCanonicalSha256,
      type: milestone.kind,
      slug: milestone.slug,
      titleMm: 'အသံကြားလျှင် တုံ့ပြန်ခြင်း',
      titleEn: 'Responds to sound',
      tags: ['communication'],
      data: {
        observeMm: 'ကျယ်သောအသံကြားပါက တုံ့ပြန်ပါသလား။',
        observeEn: 'Does the baby respond to a loud sound?',
        whyMm: 'အသံကို သတိပြုမိသည့် လက္ခဏာဖြစ်သည်။',
        whyEn: 'This is one sign the baby notices sound.',
        redMm: 'မတုံ့ပြန်ပါက ကျန်းမာရေးဝန်ထမ်းနှင့် တိုင်ပင်ပါ။',
        redEn: 'If there is no response, talk to a health worker.',
      },
      source: 'ACE Child Grow editorial content',
      version: 1,
      clinicalStatus: 'published',
      searchText: 'sound',
      createdAt: 1785024282947,
      updatedAt: milestone.contentUpdatedAt,
    },
    {
      _id: activity.contentId,
      _creationTime: activity.contentCreationTime,
      __hash: activity.contentCanonicalSha256,
      type: activity.kind,
      slug: activity.slug,
      titleMm: 'အဝတ်ဖြင့် ဘူး ကစားခြင်း',
      titleEn: 'Peek-a-boo with a cloth',
      summaryMm: 'ပါးလွှာသော အဝတ်ဖြင့် ကစားပါ။',
      summaryEn: 'Play with one light cloth.',
      tags: ['social'],
      data: {
        materials: { mm: 'ပါးလွှာသော အဝတ်တစ်ထည်။', en: 'One light cloth.' },
        setup: { mm: 'မျက်နှာချင်းဆိုင် ထားပါ။', en: 'Sit face to face.' },
        instructions: [
          { mm: 'သင်၏မျက်နှာကို ခဏဖုံးပါ။', en: 'Cover your own face briefly.' },
          { mm: 'ပြန်ဖော်ပြပြီး ဘူးဟုပြောပါ။', en: 'Reveal your face and say boo.' },
        ],
        safety: { mm: 'ကလေး၏မျက်နှာကို မဖုံးပါနှင့်။', en: 'Never cover the baby’s face.' },
        outcomes: [{ mm: 'လူမှုဆက်ဆံရေးကို အားပေးသည်။', en: 'Supports social engagement.' }],
      },
      source: 'ACE Child Grow editorial content',
      version: 1,
      clinicalStatus: 'published',
      searchText: 'peek-a-boo',
      createdAt: 1785024282947,
      updatedAt: activity.contentUpdatedAt,
    },
  ];
}

function linkRows() {
  return CLINICAL_REVIEW_BATCH_ITEMS.map((item) => ({
    _id: item.linkId,
    _creationTime: item.linkCreationTime,
    __hash: item.linkCanonicalSha256,
    kind: item.kind,
    slug: item.slug,
    sourceIds: [...item.sourceIds],
    createdAt: item.linkUpdatedAt,
    updatedAt: item.linkUpdatedAt,
  }));
}

function sourceRows() {
  const rows: Record<string, unknown>[] = [];
  for (const item of CLINICAL_REVIEW_BATCH_ITEMS) {
    item.sourceIds.forEach((sourceId, index) => {
      if (rows.some((row) => row.sourceId === sourceId)) return;
      rows.push({
        _id: `source-${sourceId}`,
        _creationTime: 1,
        __groupHash: item.sourcesCanonicalSha256,
        sourceId,
        org: index % 2 === 0 ? 'CDC' : 'AAP',
        orgKey: index % 2 === 0 ? 'CDC' : 'AAP',
        title: `Verified source ${sourceId}`,
        authors: null,
        year: 2026,
        edition: null,
        country: null,
        language: 'en',
        url: `https://example.test/${sourceId}`,
        doi: null,
        isbn: null,
        pmid: null,
        evidenceLevel: 'guideline',
        reviewStatus: 'approved',
        reviewer: 'Evidence reviewer',
        reviewDate: '2026-08-01',
        nextReviewDate: '2027-08-01',
        keywords: [],
        topics: [],
        ageMonthsMin: 0,
        ageMonthsMax: 12,
        verifiedOn: '2026-08-01',
        verifiedNote: 'Verified',
        searchText: sourceId,
        createdAt: 1,
        updatedAt: 1785043814882,
      });
    });
  }
  return rows;
}

function mediaRows() {
  return CLINICAL_REVIEW_BATCH_ITEMS.flatMap((item) => Array.from({ length: item.mediaCount }, (_, index) => ({
    _id: `media-${item.ordinal}-${index}`,
    _creationTime: index + 1,
    __groupHash: item.mediaCanonicalSha256,
    contentSlug: item.slug,
    kind: 'illustration',
    placeholder: true,
  })));
}

type Row = Record<string, unknown>;

function context() {
  const tables: Record<string, Row[]> = {
    parentProfiles: [frozenProfile],
    libraryContent: contentRows(),
    evidenceLinks: linkRows(),
    evidenceSources: sourceRows(),
    libraryMedia: mediaRows(),
    aiContentAudits: [],
    aiEvidenceAudits: [],
    aiPublicationReleases: [],
    contentReviews: [],
    auditLogs: [],
  };
  let insertCount = 0;
  const query = vi.fn((table: string) => {
    const builder = (filters: Array<[string, unknown]>) => {
      const terminal = {
        take: async (count: number) => tables[table].filter((row) => filters.every(([field, value]) => row[field] === value)).slice(0, count),
        order: () => terminal,
      };
      return {
        ...terminal,
        withIndex: (_name: string, callback: (q: { eq: (field: string, value: unknown) => unknown }) => unknown) => {
          const nextFilters = [...filters];
          const q = { eq: (field: string, value: unknown) => { nextFilters.push([field, value]); return q; } };
          callback(q);
          return builder(nextFilters);
        },
      };
    };
    return builder([]);
  });
  const insert = vi.fn(async (table: string, value: Row) => {
    insertCount += 1;
    const id = `${table}-${insertCount}`;
    tables[table].push({ _id: id, _creationTime: Date.now(), ...value });
    return id;
  });
  return { auth: {}, db: { query, insert }, storage: {}, tables };
}

function handler(fn: unknown) {
  return (fn as { _handler: (ctx: ReturnType<typeof context>, args: Record<string, unknown>) => Promise<unknown> })._handler;
}

function inputFrom(item: Record<string, unknown>) {
  return {
    batchId: CLINICAL_REVIEW_BATCH_ID,
    assignmentId: item.assignmentId,
    contentSlug: item.slug,
    dimension: item.dimension,
    decision: 'approved',
    expectedReviewRevision: item.reviewRevision,
    expectedSnapshotDigest: (item.snapshot as { digest: string }).digest,
    expectedFreezeDigest: CLINICAL_REVIEW_BATCH_HASH,
  };
}

describe('frozen clinical-review batch UI contract', () => {
  beforeEach(() => {
    authState.userId = CLINICAL_REVIEW_BATCH_REVIEWER.userId;
    vi.spyOn(Date, 'now').mockReturnValue(1787500000000);
  });

  it('keeps the manifest hash and exact Phyo Ko Ko assignment immutable', async () => {
    expect(await sha256Canonical(CLINICAL_REVIEW_BATCH_MANIFEST)).toBe(CLINICAL_REVIEW_BATCH_HASH);
    expect(CLINICAL_REVIEW_BATCH_COUNT).toBe(2);
    expect(await sha256Canonical(stableReviewerIdentity)).toBe(CLINICAL_REVIEW_BATCH_REVIEWER.identityCanonicalSha256);
  });

  it('returns the exact ace.clinical-frozen-batch v1 snapshot contract after preflight', async () => {
    const result = await handler(getAssignedBatch)(context(), {}) as Record<string, unknown>;
    expect(result).toMatchObject({
      contract: 'ace.clinical-frozen-batch',
      contractVersion: 1,
      scope: 'authenticated_assignee',
      lane: 'clinical',
      assignedRole: 'clinical_reviewer',
      freezeDigest: CLINICAL_REVIEW_BATCH_HASH,
      handoff: null,
    });
    const items = result.items as Array<Record<string, unknown>>;
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      slug: milestone.slug,
      type: 'milestone',
      dimension: 'clinical',
      reviewRevision: 1,
      liveReviewRevision: 1,
      decision: null,
    });
    expect((items[0].snapshot as { fields: unknown[]; sources: unknown[] }).fields).toHaveLength(3);
    const sources = (items[0].snapshot as { sources: Array<Record<string, unknown>> }).sources;
    expect(sources).toHaveLength(milestone.sourceCount);
    expect(sources[0]).toEqual(expect.objectContaining({ sourceId: milestone.sourceIds[0], url: expect.stringMatching(/^https:/) }));
    expect((items[1].snapshot as { fields: unknown[] }).fields).toHaveLength(5);
  });

  it('saves one decision and returns the same receipt for an idempotent replay', async () => {
    const ctx = context();
    const batch = await handler(getAssignedBatch)(ctx, {}) as { items: Array<Record<string, unknown>> };
    const args = inputFrom(batch.items[0]);
    const first = await handler(saveAssignedDecision)(ctx, args) as Record<string, unknown>;
    expect(first).toMatchObject({ ok: true, duplicate: false, receipt: { decision: 'approved', note: null } });
    expect(first).not.toHaveProperty('handoff');
    const replay = await handler(saveAssignedDecision)(ctx, args) as Record<string, unknown>;
    expect(replay).toMatchObject({ ok: true, duplicate: true, receipt: first.receipt });
    expect(ctx.tables.contentReviews).toHaveLength(1);
  });

  it('fails closed with the live revision when content changes after the freeze', async () => {
    const ctx = context();
    const batch = await handler(getAssignedBatch)(ctx, {}) as { items: Array<Record<string, unknown>> };
    ctx.tables.libraryContent[0].reviewRevision = 2;
    const result = await handler(saveAssignedDecision)(ctx, inputFrom(batch.items[0]));
    expect(result).toMatchObject({ ok: false, code: 'stale_revision', currentReviewRevision: 2 });
    expect(ctx.tables.contentReviews).toHaveLength(0);
  });

  it('refuses an expired assignment before any clinical decision write', async () => {
    const ctx = context();
    const batch = await handler(getAssignedBatch)(ctx, {}) as { items: Array<Record<string, unknown>> };
    vi.spyOn(Date, 'now').mockReturnValue(CLINICAL_REVIEW_BATCH_EXPIRES_AT);
    const result = await handler(saveAssignedDecision)(ctx, inputFrom(batch.items[0]));
    expect(result).toMatchObject({ ok: false, code: 'assignment_expired' });
    expect(ctx.tables.contentReviews).toHaveLength(0);
  });

  it('returns a server-issued handoff receipt only after both exact assignments are approved', async () => {
    const ctx = context();
    const batch = await handler(getAssignedBatch)(ctx, {}) as { items: Array<Record<string, unknown>> };
    await handler(saveAssignedDecision)(ctx, inputFrom(batch.items[0]));
    const completed = await handler(saveAssignedDecision)(ctx, inputFrom(batch.items[1])) as Record<string, unknown>;
    expect(completed).toMatchObject({
      ok: true,
      duplicate: false,
      handoff: { batchId: CLINICAL_REVIEW_BATCH_ID, decisionCount: 2, completedAt: 1787500000000 },
    });
    expect((completed.handoff as { digest: string }).digest).toMatch(/^[a-f0-9]{64}$/);
    expect((completed.handoff as { receiptDigest: string }).receiptDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(ctx.tables.contentReviews).toHaveLength(2);
  });

  it('does not authorize lane handoff while a requested change remains', async () => {
    const ctx = context();
    const batch = await handler(getAssignedBatch)(ctx, {}) as { items: Array<Record<string, unknown>> };
    await handler(saveAssignedDecision)(ctx, inputFrom(batch.items[0]));
    const secondInput = { ...inputFrom(batch.items[1]), decision: 'changes_requested', note: 'Correct and refreeze.' };
    const completed = await handler(saveAssignedDecision)(ctx, secondInput) as Record<string, unknown>;
    expect(completed).toMatchObject({ ok: true, duplicate: false, receipt: { decision: 'changes_requested' } });
    expect(completed).not.toHaveProperty('handoff');
    expect(ctx.tables.contentReviews).toHaveLength(2);
  });

  it('keeps the frozen assignment valid when unrelated profile preferences change', async () => {
    const ctx = context();
    ctx.tables.parentProfiles[0].preferredLocale = 'en';
    ctx.tables.parentProfiles[0].parentTourCompletedVersion = 99;
    const batch = await handler(getAssignedBatch)(ctx, {}) as { items: Array<Record<string, unknown>> };
    expect(batch.items).toHaveLength(2);
  });

  it('blocks the frozen assignment when reviewer qualification identity drifts', async () => {
    const ctx = context();
    ctx.tables.parentProfiles[0].staffQualification = 'Different qualification';
    await expect(handler(getAssignedBatch)(ctx, {})).rejects.toThrow('not assigned');
  });
});
