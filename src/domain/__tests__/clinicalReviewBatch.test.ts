import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

import { readAssignedBatchState, saveAssignedDecision } from '../../../convex/clinicalReviewBatch';
import { activateRegisteredBatch } from '../../../convex/clinicalReviewRegistry';
import { getAssignedBatch } from '../../../convex/clinicalReviewBatchActions';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import {
  CLINICAL_REVIEW_BATCH_COUNT,
  CLINICAL_REVIEW_BATCH_EXPIRES_AT,
  CLINICAL_REVIEW_BATCH_FROZEN_AT,
  CLINICAL_REVIEW_BATCH_HASH,
  CLINICAL_REVIEW_BATCH_ID,
  CLINICAL_REVIEW_BATCH_ITEMS,
  CLINICAL_REVIEW_BATCH_MANIFEST,
  CLINICAL_REVIEW_BATCH_REGISTRY,
  CLINICAL_REVIEW_BATCH_REVIEWER,
  CLINICAL_NATIVE_MYANMAR_RELEASE_BATCH_REVIEWER,
  clinicalReviewBatchRoutingPayload,
  type ClinicalReviewBatchRegistration,
} from '../../../convex/lib/clinicalReviewBatchData';
import { frozenClinicalDecisionKey } from '../../../convex/lib/clinicalReviewBatchProvenance';

const originalPilotRegistration = CLINICAL_REVIEW_BATCH_REGISTRY[0] as ClinicalReviewBatchRegistration;

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
    clinicalReviewBatches: [],
    clinicalReviewAssignments: [],
    clinicalReviewBatchReceipts: [],
    auditLogs: [],
  };
  let insertCount = 0;
  const query = vi.fn((table: string) => {
    const builder = (filters: Array<[string, unknown]>) => {
      const terminal = {
        take: async (count: number) => tables[table].filter((row) => filters.every(([field, value]) => row[field] === value)).slice(0, count),
        unique: async () => {
          const rows = tables[table].filter((row) => filters.every(([field, value]) => row[field] === value));
          if (rows.length > 1) throw new Error('not unique');
          return rows[0] ?? null;
        },
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
  const patch = vi.fn(async (id: string, value: Row) => {
    for (const rows of Object.values(tables)) {
      const row = rows.find((candidate) => candidate._id === id);
      if (row) {
        Object.assign(row, value);
        return;
      }
    }
    throw new Error(`Missing row ${id}`);
  });
  return { auth: {}, db: { query, insert, patch }, storage: {}, tables };
}

async function makePilotReleaseActive(
  ctx: ReturnType<typeof context>,
  options: {
    dimension?: ClinicalReviewBatchRegistration['dimension'];
    reviewer?: ClinicalReviewBatchRegistration['manifest']['reviewer'];
    profile?: Row;
  } = {},
) {
  const emptyReviewHash = '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945';
  const manifest = {
    ...originalPilotRegistration.manifest,
    reviewer: options.reviewer ?? originalPilotRegistration.manifest.reviewer,
    items: originalPilotRegistration.manifest.items.map((item) => ({
      ...item,
      currentClinicalReviewCount: 0,
      currentClinicalReviewsCanonicalSha256: emptyReviewHash,
      allClinicalReviewHistoryCanonicalSha256: emptyReviewHash,
    })),
  };
  const pending = {
    ...originalPilotRegistration,
    dimension: options.dimension ?? originalPilotRegistration.dimension,
    authority: 'release' as const,
    manifest,
    freezeDigest: await sha256Canonical(manifest),
  };
  const registration: ClinicalReviewBatchRegistration = {
    ...pending,
    routingCanonicalSha256: await sha256Canonical(clinicalReviewBatchRoutingPayload(pending)),
  };
  (CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[])[0] = registration;
  if (options.profile) ctx.tables.parentProfiles = [options.profile];
  ctx.tables.clinicalReviewBatches.push({
    _id: 'release-batch', _creationTime: 1,
    batchId: registration.manifest.batchId, sequence: registration.sequence,
    laneGraphVersion: registration.laneGraphVersion, dimension: registration.dimension,
    authority: registration.authority, status: 'active', freezeDigest: registration.freezeDigest,
    routingDigest: registration.routingCanonicalSha256, itemCount: registration.manifest.count,
    frozenAt: registration.frozenAt, expiresAt: registration.expiresAt,
    reviewerProfileId: registration.manifest.reviewer.profileId,
    reviewerId: registration.manifest.reviewer.userId,
    reviewerDisplayName: registration.manifest.reviewer.displayName,
    reviewerQualification: registration.manifest.reviewer.qualification ?? undefined,
    reviewerRole: registration.manifest.reviewer.role,
    reviewerIdentityDigest: registration.manifest.reviewer.identityCanonicalSha256,
    activationKind: 'initial', createdAt: registration.frozenAt,
  });
  for (const item of registration.manifest.items) {
    const assignmentId = await frozenClinicalDecisionKey(registration, item);
    ctx.tables.clinicalReviewAssignments.push({
      _id: `assignment-${item.ordinal}`, _creationTime: item.ordinal,
      batchId: registration.manifest.batchId, assignmentId, ordinal: item.ordinal,
      dimension: registration.dimension, kind: item.kind, contentSlug: item.slug,
      reviewRevision: item.reviewRevision, contentId: item.contentId,
      contentCreationTime: item.contentCreationTime, contentUpdatedAt: item.contentUpdatedAt,
      contentCanonicalSha256: item.contentCanonicalSha256, linkId: item.linkId,
      linkCreationTime: item.linkCreationTime, linkUpdatedAt: item.linkUpdatedAt,
      linkCanonicalSha256: item.linkCanonicalSha256, sourceIds: [...item.sourceIds],
      sourceCount: item.sourceCount, sourcesCanonicalSha256: item.sourcesCanonicalSha256,
      mediaCount: item.mediaCount, mediaCanonicalSha256: item.mediaCanonicalSha256,
      aiCanonicalSha256: item.aiCanonicalSha256, upstreamReviewDigests: [],
      currentClinicalReviewCount: item.currentClinicalReviewCount,
      currentClinicalReviewsCanonicalSha256: item.currentClinicalReviewsCanonicalSha256,
      allClinicalReviewHistoryCanonicalSha256: item.allClinicalReviewHistoryCanonicalSha256,
      createdAt: registration.frozenAt,
    });
  }
}

function handler(fn: unknown) {
  return (fn as { _handler: (ctx: ReturnType<typeof context>, args: Record<string, unknown>) => Promise<unknown> })._handler;
}

async function readBatch(ctx: ReturnType<typeof context>) {
  const nowMs = Date.now();
  return await handler(readAssignedBatchState)(ctx, {
    nowMs,
    todayIso: new Date(nowMs).toISOString().slice(0, 10),
  });
}

function inputFrom(item: Record<string, unknown>) {
  const registration = (CLINICAL_REVIEW_BATCH_REGISTRY as readonly ClinicalReviewBatchRegistration[])[0];
  return {
    batchId: CLINICAL_REVIEW_BATCH_ID,
    assignmentId: item.assignmentId,
    contentSlug: item.slug,
    dimension: item.dimension,
    decision: 'approved',
    expectedReviewRevision: item.reviewRevision,
    expectedSnapshotDigest: (item.snapshot as { digest: string }).digest,
    expectedFreezeDigest: registration.freezeDigest,
  };
}

describe('frozen clinical-review batch UI contract', () => {
  beforeEach(() => {
    authState.userId = CLINICAL_REVIEW_BATCH_REVIEWER.userId;
    const registry = CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[];
    registry.splice(0, registry.length, originalPilotRegistration);
    vi.spyOn(Date, 'now').mockReturnValue(1787500000000);
  });

  afterEach(() => {
    const registry = CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[];
    registry.splice(0, registry.length, originalPilotRegistration);
    vi.restoreAllMocks();
  });

  it('keeps the manifest hash and exact Phyo Ko Ko assignment immutable', async () => {
    expect(await sha256Canonical(CLINICAL_REVIEW_BATCH_MANIFEST)).toBe(CLINICAL_REVIEW_BATCH_HASH);
    expect(CLINICAL_REVIEW_BATCH_COUNT).toBe(2);
    expect(await sha256Canonical(stableReviewerIdentity)).toBe(CLINICAL_REVIEW_BATCH_REVIEWER.identityCanonicalSha256);
  });

  it('returns the exact ace.clinical-frozen-batch v1 snapshot contract after preflight', async () => {
    const result = await readBatch(context()) as Record<string, unknown>;
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
    const batch = await readBatch(ctx) as { items: Array<Record<string, unknown>> };
    const args = inputFrom(batch.items[0]);
    const first = await handler(saveAssignedDecision)(ctx, args) as Record<string, unknown>;
    expect(first).toMatchObject({ ok: true, duplicate: false, receipt: { decision: 'approved', note: null } });
    expect(first).not.toHaveProperty('handoff');
    const replay = await handler(saveAssignedDecision)(ctx, args) as Record<string, unknown>;
    expect(replay).toMatchObject({ ok: true, duplicate: true, receipt: first.receipt });
    expect(ctx.tables.contentReviews).toHaveLength(1);
  });

  it('saves a native-Myanmar batch decision for the exact unqualified language assignee', async () => {
    const ctx = context();
    authState.userId = CLINICAL_NATIVE_MYANMAR_RELEASE_BATCH_REVIEWER.userId;
    await makePilotReleaseActive(ctx, {
      dimension: 'native_myanmar',
      reviewer: CLINICAL_NATIVE_MYANMAR_RELEASE_BATCH_REVIEWER,
      profile: {
        _id: CLINICAL_NATIVE_MYANMAR_RELEASE_BATCH_REVIEWER.profileId,
        _creationTime: 1,
        userId: CLINICAL_NATIVE_MYANMAR_RELEASE_BATCH_REVIEWER.userId,
        isStaff: true,
        displayName: CLINICAL_NATIVE_MYANMAR_RELEASE_BATCH_REVIEWER.displayName,
        staffRole: 'language_reviewer',
      },
    });

    const batch = await readBatch(ctx) as {
      contract: string; lane: string; assignedRole: string; items: Row[];
    };
    expect(batch).toMatchObject({
      contract: 'ace.clinical-frozen-batch',
      lane: 'native_myanmar',
      assignedRole: 'language_reviewer',
    });
    const receipt = await handler(saveAssignedDecision)(ctx, inputFrom(batch.items[0]));
    expect(receipt).toMatchObject({ ok: true, duplicate: false, receipt: { decision: 'approved' } });
    expect(ctx.tables.contentReviews[0]).toMatchObject({
      dimension: 'native_myanmar',
      reviewerId: CLINICAL_NATIVE_MYANMAR_RELEASE_BATCH_REVIEWER.userId,
      reviewerRole: 'language_reviewer',
    });
    expect(ctx.tables.contentReviews[0].reviewerQualification).toBeUndefined();
  });

  it('fails closed with the live revision when content changes after the freeze', async () => {
    const ctx = context();
    const batch = await readBatch(ctx) as { items: Array<Record<string, unknown>> };
    ctx.tables.libraryContent[0].reviewRevision = 2;
    const result = await handler(saveAssignedDecision)(ctx, inputFrom(batch.items[0]));
    expect(result).toMatchObject({ ok: false, code: 'stale_revision', currentReviewRevision: 2 });
    expect(ctx.tables.contentReviews).toHaveLength(0);
  });

  it('refuses an expired assignment before any clinical decision write', async () => {
    const ctx = context();
    const batch = await readBatch(ctx) as { items: Array<Record<string, unknown>> };
    vi.spyOn(Date, 'now').mockReturnValue(CLINICAL_REVIEW_BATCH_EXPIRES_AT);
    const result = await handler(saveAssignedDecision)(ctx, inputFrom(batch.items[0]));
    expect(result).toMatchObject({ ok: false, code: 'assignment_expired' });
    expect(ctx.tables.contentReviews).toHaveLength(0);
  });

  it('keeps unanimous pilot decisions readable but never issues release handoff authority', async () => {
    const ctx = context();
    const batch = await readBatch(ctx) as { items: Array<Record<string, unknown>> };
    await handler(saveAssignedDecision)(ctx, inputFrom(batch.items[0]));
    const completed = await handler(saveAssignedDecision)(ctx, inputFrom(batch.items[1])) as Record<string, unknown>;
    expect(completed).toMatchObject({ ok: true, duplicate: false });
    expect(completed).not.toHaveProperty('handoff');
    expect(ctx.tables.contentReviews).toHaveLength(2);
    expect(ctx.tables.clinicalReviewBatchReceipts).toHaveLength(0);
    const closedRead = await readBatch(ctx) as Record<string, unknown>;
    expect(closedRead.handoff).toBeNull();
  });

  it('atomically completes a persisted release batch with its unanimous handoff', async () => {
    const ctx = context();
    await makePilotReleaseActive(ctx);
    const batch = await readBatch(ctx) as { items: Array<Record<string, unknown>> };
    await handler(saveAssignedDecision)(ctx, inputFrom(batch.items[0]));
    const finalArgs = inputFrom(batch.items[1]);
    const final = await handler(saveAssignedDecision)(ctx, finalArgs) as Record<string, unknown>;
    expect(ctx.tables.clinicalReviewBatches[0]).toMatchObject({
      status: 'completed',
      completedAt: 1787500000000,
    });
    expect(ctx.tables.clinicalReviewBatchReceipts).toHaveLength(1);
    expect(ctx.tables.clinicalReviewBatchReceipts[0]).toMatchObject({ authority: 'release' });
    const replay = await handler(saveAssignedDecision)(ctx, finalArgs);
    expect(replay).toMatchObject({ ok: true, duplicate: true, handoff: final.handoff });
    expect(ctx.tables.contentReviews).toHaveLength(2);
    expect(ctx.tables.clinicalReviewBatchReceipts).toHaveLength(1);
    const closedRead = await readBatch(ctx);
    expect(closedRead).toMatchObject({ handoff: final.handoff });
  });

  it('recomputes decision, receipt, digest, and completion timestamps on every closed read', async () => {
    const ctx = context();
    await makePilotReleaseActive(ctx);
    const batch = await readBatch(ctx) as { items: Array<Record<string, unknown>> };
    await handler(saveAssignedDecision)(ctx, inputFrom(batch.items[0]));
    await handler(saveAssignedDecision)(ctx, inputFrom(batch.items[1]));

    const receipt = ctx.tables.clinicalReviewBatchReceipts[0];
    const originalReceipt = { ...receipt };
    receipt.digest = '0'.repeat(64);
    await expect(readBatch(ctx)).resolves.toMatchObject({ status: 'refused', code: 'batch_preflight_failed' });
    Object.assign(receipt, originalReceipt);

    receipt.createdAt = Number(receipt.createdAt) + 1;
    await expect(readBatch(ctx)).resolves.toMatchObject({ status: 'refused', code: 'batch_preflight_failed' });
    Object.assign(receipt, originalReceipt);

    const decision = ctx.tables.contentReviews[0];
    const originalRole = decision.reviewerRole;
    decision.reviewerRole = 'evidence_reviewer';
    await expect(readBatch(ctx)).resolves.toMatchObject({ status: 'refused', code: 'batch_preflight_failed' });
    decision.reviewerRole = originalRole;

    ctx.tables.clinicalReviewBatches[0].completedAt = Number(originalReceipt.completedAt) + 1;
    await expect(readBatch(ctx)).resolves.toMatchObject({ status: 'refused', code: 'batch_preflight_failed' });
  });

  it('activates the first release as an initial root without a fabricated pilot receipt', async () => {
    const ctx = context();
    ctx.tables.parentProfiles.push({
      _id: 'owner-profile', _creationTime: 2, userId: 'owner-user', isStaff: true,
      staffRole: 'owner', displayName: 'Owner', staffQualification: 'MEd',
    });
    const emptyReviewHash = '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945';
    const manifest = {
      batchId: 'first-release-root', count: 1, reviewer: CLINICAL_REVIEW_BATCH_REVIEWER,
      items: [{
        ...CLINICAL_REVIEW_BATCH_ITEMS[0], ordinal: 1,
        currentClinicalReviewCount: 0,
        currentClinicalReviewsCanonicalSha256: emptyReviewHash,
        allClinicalReviewHistoryCanonicalSha256: emptyReviewHash,
      }],
    };
    const pending: ClinicalReviewBatchRegistration = {
      sequence: 2, laneGraphVersion: 1, dimension: 'safety', authority: 'release',
      activation: { kind: 'initial' }, routingCanonicalSha256: '',
      freezeDigest: await sha256Canonical(manifest),
      frozenAt: CLINICAL_REVIEW_BATCH_FROZEN_AT,
      expiresAt: CLINICAL_REVIEW_BATCH_EXPIRES_AT,
      manifest,
    };
    const registration = {
      ...pending,
      routingCanonicalSha256: await sha256Canonical(clinicalReviewBatchRoutingPayload(pending)),
    };
    (CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[]).push(registration);
    ctx.tables.clinicalReviewBatches.push({
      _id: 'first-release-row', _creationTime: 2,
      batchId: registration.manifest.batchId, sequence: registration.sequence,
      laneGraphVersion: 1, dimension: registration.dimension, authority: 'release', status: 'frozen',
      freezeDigest: registration.freezeDigest, routingDigest: registration.routingCanonicalSha256,
      itemCount: 1, frozenAt: registration.frozenAt, expiresAt: registration.expiresAt,
      reviewerProfileId: registration.manifest.reviewer.profileId,
      reviewerId: registration.manifest.reviewer.userId,
      reviewerDisplayName: registration.manifest.reviewer.displayName,
      reviewerQualification: registration.manifest.reviewer.qualification,
      reviewerRole: registration.manifest.reviewer.role,
      reviewerIdentityDigest: registration.manifest.reviewer.identityCanonicalSha256,
      activationKind: 'initial', createdAt: registration.frozenAt,
    });
    const item = registration.manifest.items[0];
    const assignmentId = await frozenClinicalDecisionKey(registration, item);
    ctx.tables.clinicalReviewAssignments.push({
      _id: 'first-release-assignment', _creationTime: 3,
      batchId: registration.manifest.batchId, assignmentId, ordinal: 1,
      dimension: registration.dimension, kind: item.kind, contentSlug: item.slug,
      reviewRevision: item.reviewRevision, contentId: item.contentId,
      contentCreationTime: item.contentCreationTime, contentUpdatedAt: item.contentUpdatedAt,
      contentCanonicalSha256: item.contentCanonicalSha256, linkId: item.linkId,
      linkCreationTime: item.linkCreationTime, linkUpdatedAt: item.linkUpdatedAt,
      linkCanonicalSha256: item.linkCanonicalSha256, sourceIds: [...item.sourceIds],
      sourceCount: item.sourceCount, sourcesCanonicalSha256: item.sourcesCanonicalSha256,
      mediaCount: item.mediaCount, mediaCanonicalSha256: item.mediaCanonicalSha256,
      aiCanonicalSha256: item.aiCanonicalSha256, upstreamReviewDigests: [],
      currentClinicalReviewCount: 0,
      currentClinicalReviewsCanonicalSha256: emptyReviewHash,
      allClinicalReviewHistoryCanonicalSha256: emptyReviewHash,
      createdAt: registration.frozenAt,
    });
    authState.userId = 'owner-user';
    const result = await handler(activateRegisteredBatch)(ctx, {
      batchId: registration.manifest.batchId,
      expectedFreezeDigest: registration.freezeDigest,
    });
    expect(result).toMatchObject({ ok: true, code: 'activated', batchId: 'first-release-root' });
    expect(ctx.tables.clinicalReviewBatches[0]).toMatchObject({ status: 'active' });
    expect(ctx.tables.clinicalReviewBatchReceipts).toHaveLength(0);
    (CLINICAL_REVIEW_BATCH_REGISTRY as unknown as ClinicalReviewBatchRegistration[]).pop();
  });

  it('stops a persisted release batch immediately when changes are requested', async () => {
    const ctx = context();
    await makePilotReleaseActive(ctx);
    const batch = await readBatch(ctx) as { items: Array<Record<string, unknown>> };
    const args = {
      ...inputFrom(batch.items[0]),
      decision: 'changes_requested',
      note: 'Correct the exact frozen row and refreeze it.',
    };
    const result = await handler(saveAssignedDecision)(ctx, args) as Record<string, unknown>;
    expect(result).toMatchObject({ ok: true, receipt: { decision: 'changes_requested' } });
    expect(ctx.tables.clinicalReviewBatches[0]).toMatchObject({ status: 'stopped_changes_requested' });
    expect(ctx.tables.clinicalReviewBatchReceipts).toHaveLength(0);
    const replay = await handler(saveAssignedDecision)(ctx, args);
    expect(replay).toMatchObject({ ok: true, duplicate: true, receipt: result.receipt });
    expect(ctx.tables.contentReviews).toHaveLength(1);
  });

  it('does not authorize lane handoff while a requested change remains', async () => {
    const ctx = context();
    const batch = await readBatch(ctx) as { items: Array<Record<string, unknown>> };
    await handler(saveAssignedDecision)(ctx, inputFrom(batch.items[0]));
    const secondInput = { ...inputFrom(batch.items[1]), decision: 'changes_requested', note: 'Correct and refreeze.' };
    const completed = await handler(saveAssignedDecision)(ctx, secondInput) as Record<string, unknown>;
    expect(completed).toMatchObject({ ok: true, duplicate: false, receipt: { decision: 'changes_requested' } });
    expect(completed).not.toHaveProperty('handoff');
    expect(ctx.tables.contentReviews).toHaveLength(2);
    expect(ctx.tables.clinicalReviewBatchReceipts).toHaveLength(0);
  });

  it('replays an earlier approved receipt after a later item stops the release', async () => {
    const ctx = context();
    await makePilotReleaseActive(ctx);
    const batch = await readBatch(ctx) as { items: Array<Record<string, unknown>> };
    const firstInput = inputFrom(batch.items[0]);
    const first = await handler(saveAssignedDecision)(ctx, firstInput) as Record<string, unknown>;
    const secondInput = {
      ...inputFrom(batch.items[1]),
      decision: 'changes_requested',
      note: 'Correct and refreeze.',
    };
    await handler(saveAssignedDecision)(ctx, secondInput);

    const replay = await handler(saveAssignedDecision)(ctx, firstInput);
    expect(replay).toMatchObject({ ok: true, duplicate: true, receipt: first.receipt });
    expect(ctx.tables.clinicalReviewBatches[0]).toMatchObject({ status: 'stopped_changes_requested' });
    expect(ctx.tables.contentReviews).toHaveLength(2);
    expect(ctx.tables.clinicalReviewBatchReceipts).toHaveLength(0);
  });

  it('keeps the frozen assignment valid when unrelated profile preferences change', async () => {
    const ctx = context();
    ctx.tables.parentProfiles[0].preferredLocale = 'en';
    ctx.tables.parentProfiles[0].parentTourCompletedVersion = 99;
    const batch = await readBatch(ctx) as { items: Array<Record<string, unknown>> };
    expect(batch.items).toHaveLength(2);
  });

  it('blocks the frozen assignment when reviewer qualification identity drifts', async () => {
    const ctx = context();
    ctx.tables.parentProfiles[0].staffQualification = 'Different qualification';
    await expect(readBatch(ctx)).resolves.toEqual({
      status: 'refused',
      code: 'not_assigned_reviewer',
      message: 'Use the assigned frozen-batch reviewer account.',
    });
  });

  it('derives the deterministic read clock inside a non-cached public action', async () => {
    const runQuery = vi.fn(async (_reference: unknown, args: unknown) => args);
    const actionHandler = (getAssignedBatch as unknown as {
      _handler: (
        ctx: { auth: { getUserIdentity: () => Promise<object | null> }; runQuery: typeof runQuery },
        args: Record<string, never>,
      ) => Promise<unknown>;
    })._handler;
    const result = await actionHandler({
      auth: { getUserIdentity: async () => ({ subject: CLINICAL_REVIEW_BATCH_REVIEWER.userId }) },
      runQuery,
    }, {}) as { nowMs: number; todayIso: string };
    expect(result).toEqual({ nowMs: 1787500000000, todayIso: '2026-08-23' });
    expect(runQuery).toHaveBeenCalledTimes(1);
  });

  it('returns an in-band refusal before querying when the action is unauthenticated', async () => {
    authState.userId = null;
    const runQuery = vi.fn();
    const actionHandler = (getAssignedBatch as unknown as {
      _handler: (
        ctx: { auth: { getUserIdentity: () => Promise<object | null> }; runQuery: typeof runQuery },
        args: Record<string, never>,
      ) => Promise<unknown>;
    })._handler;
    await expect(actionHandler({
      auth: { getUserIdentity: async () => null },
      runQuery,
    }, {})).resolves.toEqual({
      status: 'refused',
      code: 'not_authenticated',
      message: 'Sign in with the reviewer account assigned to this frozen batch.',
    });
    expect(runQuery).not.toHaveBeenCalled();
  });
});
