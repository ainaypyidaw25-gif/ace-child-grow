import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({ userId: 'owner-user' as string | null }));

vi.mock('@convex-dev/auth/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@convex-dev/auth/server')>();
  return { ...actual, getAuthUserId: vi.fn(async () => authState.userId) };
});

vi.mock('../../../convex/lib/aiAuditHash', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../convex/lib/aiAuditHash')>();
  return {
    ...actual,
    sha256Canonical: vi.fn(async (value: unknown) => {
      if (value && typeof value === 'object' && !Array.isArray(value) && '__hash' in value) {
        return String((value as { __hash: string }).__hash);
      }
      if (Array.isArray(value) && value.length > 0) {
        const rows = value as Array<Record<string, unknown>>;
        if (rows.every((row) => typeof row.sourceId === 'string')) {
          const key = rows.map((row) => row.sourceId).join('|');
          const item = CLINICAL_INITIAL_RELEASE_BATCH_ITEMS.find(
            (candidate) => candidate.sourceIds.join('|') === key,
          );
          if (item) return item.sourcesCanonicalSha256;
        }
        if (rows.every((row) => typeof row.contentSlug === 'string')) {
          const item = CLINICAL_INITIAL_RELEASE_BATCH_ITEMS.find(
            (candidate) => candidate.slug === rows[0].contentSlug && candidate.mediaCount === rows.length,
          );
          if (item) return item.mediaCanonicalSha256;
        }
      }
      return await actual.sha256Canonical(value);
    }),
  };
});

import { readAssignedBatchState, saveAssignedDecision } from '../../../convex/clinicalReviewBatch';
import {
  activateRegisteredBatch,
  materializeRegisteredReleaseBatches,
  ownerRegistryStatus,
} from '../../../convex/clinicalReviewRegistry';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import {
  CLINICAL_INITIAL_RELEASE_BATCH_HASH,
  CLINICAL_INITIAL_RELEASE_BATCH_ID,
  CLINICAL_INITIAL_RELEASE_BATCH_ITEMS,
  CLINICAL_INITIAL_RELEASE_BATCH_MANIFEST,
  CLINICAL_INITIAL_RELEASE_BATCH_ROUTING_HASH,
  CLINICAL_OLDER_SAFETY_RELEASE_BATCH_HASH,
  CLINICAL_OLDER_SAFETY_RELEASE_BATCH_ID,
  CLINICAL_NUTRITION_RELEASE_BATCH_HASH,
  CLINICAL_NUTRITION_RELEASE_BATCH_ID,
  CLINICAL_REVIEW_BATCH_REGISTRY,
  clinicalReviewBatchRoutingPayload,
} from '../../../convex/lib/clinicalReviewBatchData';
import { frozenClinicalPublicationApproval } from '../../../convex/lib/clinicalReviewBatchProvenance';
import { contentIsParentReadable } from '../../../convex/lib/publicationVisibility';

type Row = Record<string, unknown>;
const TEST_NOW_MS = new Date('2026-08-24T00:00:00.000Z').getTime();

function ownerStatusArgs(nowMs = TEST_NOW_MS) {
  return { nowMs, todayIso: new Date(nowMs).toISOString().slice(0, 10) };
}

const reviewerProfile = {
  _id: 'md79ghw3fm2a09pvhgs63c754n8bgnpy',
  _creationTime: 1785417794053.964,
  userId: 'mn726081xpgg24y4z4tq9ncw098bh6t1',
  isStaff: true,
  displayName: 'Phyo Ko Ko',
  preferredLocale: 'mm',
  staffQualification: 'MBBS',
  staffRole: 'clinical_reviewer',
};

function activityData() {
  return {
    materials: { mm: 'ပါးလွှာသော စောင်', en: 'A light blanket' },
    setup: { mm: 'ရင်ဘတ်ချင်း ထိထားပါ။', en: 'Place the baby chest-to-chest.' },
    instructions: [{ mm: 'အသက်ရှူမှုကို ကြည့်ပါ။', en: 'Check the baby’s breathing.' }],
    safety: { mm: 'အိပ်ငိုက်လျှင် ရပ်ပါ။', en: 'Stop if you become drowsy.' },
    outcomes: [{ mm: 'စိတ်ငြိမ်စေရန် ကူညီသည်။', en: 'Supports settling.' }],
  };
}

function guideData() {
  const pair = (mm: string, en: string) => ({ mm, en });
  return {
    why: pair('အိပ်စက်ခြင်း အရေးကြီးသည်။', 'Sleep matters.'),
    materials: pair('ခိုင်ခံ့သော မွေ့ရာ။', 'A firm mattress.'),
    observationQuestions: [pair('ပက်လက်အိပ်ပါသလား။', 'Does the baby sleep on the back?')],
    dailyActivities: [pair('နေ့နှင့်ညကို ခွဲခြားကူညီပါ။', 'Support day and night cues.')],
    indoor: [pair('အိပ်ခန်းကို အေးမြထားပါ။', 'Keep the sleep space cool.')],
    lowCost: [pair('သီးခြားအိပ်စက်နေရာထားပါ။', 'Use a separate sleep space.')],
    safety: pair('ပက်လက်အိပ်စေပါ။', 'Place the baby on the back.'),
    commonMistakes: [pair('နူးညံ့ပစ္စည်းများ မထားပါနှင့်။', 'Do not add soft items.')],
    parentTips: [pair('ကလေးအိပ်ချိန်တွင် အနားယူပါ။', 'Rest when the baby rests.')],
    faq: [{
      q: pair('ညတိုင်းနိုးတာ ပုံမှန်လား။', 'Is frequent waking normal?'),
      a: pair('မွေးကင်းစများ မကြာခဏ နိုးတတ်သည်။', 'Newborns wake frequently.'),
    }],
    redFlags: [pair('အသက်ရှူခက်ခြင်း။', 'Difficulty breathing.')],
    referral: pair('ချက်ချင်း ဆေးရုံသို့ သွားပါ။', 'Go to hospital immediately.'),
    encouragement: pair('စိတ်ရှည်ပါ။', 'Be patient with yourself.'),
  };
}

function contentRows(): Row[] {
  return CLINICAL_INITIAL_RELEASE_BATCH_ITEMS.map((item) => ({
    _id: item.contentId,
    _creationTime: item.contentCreationTime,
    __hash: item.contentCanonicalSha256,
    type: item.kind,
    slug: item.slug,
    titleMm: item.kind === 'activity' ? 'အရေပြားချင်းထိ ပွေ့ချီခြင်း' : 'မွေးကင်း–၂ လ — အိပ်စက်ခြင်း',
    titleEn: item.kind === 'activity' ? 'Skin-to-skin calming' : 'Birth–2 months — Sleep',
    summaryMm: 'အတိအကျ freeze လုပ်ထားသော မြန်မာအကျဉ်းချုပ်။',
    summaryEn: 'Exact frozen English summary.',
    tags: [],
    data: item.kind === 'activity' ? activityData() : guideData(),
    source: 'ACE Child Grow editorial content',
    version: 1,
    reviewRevision: item.reviewRevision,
    clinicalStatus: 'clinical_review',
    searchText: item.slug,
    createdAt: item.contentCreationTime,
    updatedAt: item.contentUpdatedAt,
  }));
}

function linkRows(): Row[] {
  return CLINICAL_INITIAL_RELEASE_BATCH_ITEMS.map((item) => ({
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

function sourceRows(): Row[] {
  const ids = [...new Set(CLINICAL_INITIAL_RELEASE_BATCH_ITEMS.flatMap((item) => [...item.sourceIds]))];
  return ids.map((sourceId, index) => ({
    _id: `source-${sourceId}`,
    _creationTime: index + 1,
    sourceId,
    org: sourceId.startsWith('who-') ? 'World Health Organization' : 'Source organization',
    title: `Exact source ${sourceId}`,
    year: 2026,
    url: `https://example.test/${sourceId}`,
    reviewStatus: 'approved',
    evidenceLevel: 'guideline',
    reviewDate: '2026-08-01',
    nextReviewDate: '2027-08-01',
    verifiedOn: '2026-08-01',
    updatedAt: 1785043814882,
  }));
}

function mediaRows(): Row[] {
  const item = CLINICAL_INITIAL_RELEASE_BATCH_ITEMS[0];
  return Array.from({ length: item.mediaCount }, (_, index) => ({
    _id: `media-${index}`,
    _creationTime: index + 1,
    contentSlug: item.slug,
    kind: index === 0 ? 'illustration' : 'video',
    placeholder: true,
  }));
}

function context() {
  const tables: Record<string, Row[]> = {
    parentProfiles: [
      {
        _id: 'owner-profile', _creationTime: 1, userId: 'owner-user', isStaff: true,
        staffRole: 'owner', displayName: 'Owner', staffQualification: 'MEd',
      },
      reviewerProfile,
    ],
    libraryContent: contentRows(),
    evidenceLinks: linkRows(),
    evidenceSources: sourceRows(),
    libraryMedia: mediaRows(),
    contentReviews: [],
    aiContentAudits: [],
    aiEvidenceAudits: [],
    aiPublicationReleases: [],
    clinicalReviewBatches: [],
    clinicalReviewAssignments: [],
    clinicalReviewBatchReceipts: [],
    auditLogs: [],
  };
  const query = vi.fn((table: string) => {
    const builder = (filters: Array<[string, unknown]>) => {
      const rows = () => tables[table].filter(
        (row) => filters.every(([field, value]) => row[field] === value),
      );
      const terminal = {
        take: async (count: number) => rows().slice(0, count),
        unique: async () => {
          const matches = rows();
          if (matches.length > 1) throw new Error('not unique');
          return matches[0] ?? null;
        },
        order: () => terminal,
      };
      return {
        ...terminal,
        withIndex: (
          _name: string,
          callback: (q: { eq: (field: string, value: unknown) => unknown }) => unknown,
        ) => {
          const next = [...filters];
          const q = {
            eq: (field: string, value: unknown) => {
              next.push([field, value]);
              return q;
            },
          };
          callback(q);
          return builder(next);
        },
      };
    };
    return builder([]);
  });
  let inserted = 0;
  const insert = vi.fn(async (table: string, value: Row) => {
    inserted += 1;
    const id = `${table}-${inserted}`;
    tables[table].push({ _id: id, _creationTime: inserted, ...value });
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

function handler(fn: unknown) {
  return (fn as {
    _handler: (ctx: ReturnType<typeof context>, args: Record<string, unknown>) => Promise<unknown>;
  })._handler;
}

async function registryDigest() {
  return await sha256Canonical(CLINICAL_REVIEW_BATCH_REGISTRY.map((registration) => ({
    routing: clinicalReviewBatchRoutingPayload(registration),
    routingDigest: registration.routingCanonicalSha256,
  })));
}

async function materializeAndActivate(ctx: ReturnType<typeof context>) {
  const materialized = await handler(materializeRegisteredReleaseBatches)(ctx, {
    expectedRegistryDigest: await registryDigest(),
  });
  expect(materialized).toMatchObject({
    ok: true,
    createdBatches: CLINICAL_REVIEW_BATCH_REGISTRY.filter((row) => row.authority === 'release').length,
    createdAssignments: CLINICAL_REVIEW_BATCH_REGISTRY
      .filter((row) => row.authority === 'release')
      .reduce((total, row) => total + row.manifest.count, 0),
  });
  const activated = await handler(activateRegisteredBatch)(ctx, {
    batchId: CLINICAL_INITIAL_RELEASE_BATCH_ID,
    expectedFreezeDigest: CLINICAL_INITIAL_RELEASE_BATCH_HASH,
  });
  expect(activated).toMatchObject({
    ok: true,
    code: 'activated',
    batchId: CLINICAL_INITIAL_RELEASE_BATCH_ID,
  });
}

async function completeInitialRelease(ctx: ReturnType<typeof context>) {
  await materializeAndActivate(ctx);
  authState.userId = String(reviewerProfile.userId);
  const loaded = await handler(readAssignedBatchState)(ctx, {
    nowMs: 1787500570000,
    todayIso: '2026-08-23',
  }) as { items: Array<Record<string, unknown>> };
  for (const item of loaded.items) {
    await expect(handler(saveAssignedDecision)(ctx, {
      batchId: CLINICAL_INITIAL_RELEASE_BATCH_ID,
      assignmentId: item.assignmentId,
      contentSlug: item.slug,
      dimension: item.dimension,
      decision: 'approved',
      expectedReviewRevision: item.reviewRevision,
      expectedSnapshotDigest: (item.snapshot as { digest: string }).digest,
      expectedFreezeDigest: CLINICAL_INITIAL_RELEASE_BATCH_HASH,
    })).resolves.toMatchObject({ ok: true });
  }
  authState.userId = 'owner-user';
}

describe('first release-authoritative clinical batch', () => {
  beforeEach(() => {
    authState.userId = 'owner-user';
    vi.spyOn(Date, 'now').mockReturnValue(1787500570000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('freezes only the two exact Production rows and regenerates both canonical digests', async () => {
    const release = CLINICAL_REVIEW_BATCH_REGISTRY[1];
    expect(CLINICAL_REVIEW_BATCH_REGISTRY.length).toBeGreaterThanOrEqual(2);
    expect(release).toMatchObject({
      sequence: 2,
      laneGraphVersion: 1,
      dimension: 'clinical',
      authority: 'release',
      activation: { kind: 'initial' },
    });
    expect(CLINICAL_INITIAL_RELEASE_BATCH_ITEMS.map((item) => (
      `${item.kind}:${item.slug}@${item.reviewRevision}`
    ))).toEqual([
      'activity:act_skin_to_skin_calm@2',
      'guide:gd_birth_2m_sleep@3',
    ]);
    expect(CLINICAL_INITIAL_RELEASE_BATCH_ITEMS[0].reviewerAdvisory?.en).toContain(
      'repeated at-home calming',
    );
    expect(await sha256Canonical(CLINICAL_INITIAL_RELEASE_BATCH_MANIFEST)).toBe(
      CLINICAL_INITIAL_RELEASE_BATCH_HASH,
    );
    expect(await sha256Canonical(clinicalReviewBatchRoutingPayload(release))).toBe(
      CLINICAL_INITIAL_RELEASE_BATCH_ROUTING_HASH,
    );
  });

  it('materializes and activates the first release root without a pilot batch or receipt', async () => {
    const ctx = context();
    await materializeAndActivate(ctx);
    expect(ctx.tables.clinicalReviewBatches).toHaveLength(
      CLINICAL_REVIEW_BATCH_REGISTRY.filter((row) => row.authority === 'release').length,
    );
    expect(ctx.tables.clinicalReviewBatches.find((row) => (
      row.batchId === CLINICAL_INITIAL_RELEASE_BATCH_ID
    ))).toMatchObject({
      batchId: CLINICAL_INITIAL_RELEASE_BATCH_ID,
      authority: 'release',
      activationKind: 'initial',
      status: 'active',
    });
    expect(ctx.tables.clinicalReviewAssignments).toHaveLength(
      CLINICAL_REVIEW_BATCH_REGISTRY
        .filter((row) => row.authority === 'release')
        .reduce((total, row) => total + row.manifest.count, 0),
    );
    expect(ctx.tables.clinicalReviewAssignments.filter((row) => (
      row.batchId === CLINICAL_INITIAL_RELEASE_BATCH_ID
    ))).toEqual(
      CLINICAL_INITIAL_RELEASE_BATCH_ITEMS.map((item) => expect.objectContaining({
        batchId: CLINICAL_INITIAL_RELEASE_BATCH_ID,
        kind: item.kind,
        contentSlug: item.slug,
        reviewRevision: item.reviewRevision,
        contentCanonicalSha256: item.contentCanonicalSha256,
        linkCanonicalSha256: item.linkCanonicalSha256,
        sourcesCanonicalSha256: item.sourcesCanonicalSha256,
        mediaCanonicalSha256: item.mediaCanonicalSha256,
        aiCanonicalSha256: item.aiCanonicalSha256,
        currentClinicalReviewCount: item.currentClinicalReviewCount,
        currentClinicalReviewsCanonicalSha256: item.currentClinicalReviewsCanonicalSha256,
        allClinicalReviewHistoryCanonicalSha256: item.allClinicalReviewHistoryCanonicalSha256,
      })),
    );
    expect(ctx.tables.clinicalReviewBatchReceipts).toHaveLength(0);
  });

  it('reports only the exact initial batch as activatable and confirms the post-action readback', async () => {
    const ctx = context();
    const registeredReleases = CLINICAL_REVIEW_BATCH_REGISTRY.filter(
      (registration) => registration.authority === 'release',
    );
    const registeredAssignmentCount = registeredReleases.reduce(
      (total, registration) => total + registration.manifest.count,
      0,
    );
    await expect(handler(materializeRegisteredReleaseBatches)(ctx, {
      expectedRegistryDigest: await registryDigest(),
    })).resolves.toMatchObject({
      ok: true,
      createdBatches: registeredReleases.length,
      createdAssignments: registeredAssignmentCount,
    });

    const ready = await handler(ownerRegistryStatus)(ctx, ownerStatusArgs()) as Record<string, unknown>;
    expect(ready).toMatchObject({
      registryCode: 'valid',
      materializationCode: 'materialized_exact',
      registeredReleaseCount: registeredReleases.length,
      persistedBatchCount: registeredReleases.length,
      persistedAssignmentCount: registeredAssignmentCount,
      currentActivation: {
        batchId: CLINICAL_INITIAL_RELEASE_BATCH_ID,
        freezeDigest: CLINICAL_INITIAL_RELEASE_BATCH_HASH,
        expectedUpstreamReceiptDigest: null,
        confirmationText: `ACTIVATE ${CLINICAL_INITIAL_RELEASE_BATCH_ID}`,
        readinessCode: 'ready_initial',
      },
    });
    expect(JSON.stringify(ready)).not.toContain('sourceIds');
    expect(JSON.stringify(ready)).not.toContain('https://');

    await expect(handler(activateRegisteredBatch)(ctx, {
      batchId: CLINICAL_INITIAL_RELEASE_BATCH_ID,
      expectedFreezeDigest: CLINICAL_INITIAL_RELEASE_BATCH_HASH,
    })).resolves.toMatchObject({ ok: true, code: 'activated' });
    const readback = await handler(ownerRegistryStatus)(ctx, ownerStatusArgs()) as Record<string, unknown>;
    expect(readback).toMatchObject({
      currentActivation: null,
      releases: expect.arrayContaining([
        expect.objectContaining({ batchId: CLINICAL_INITIAL_RELEASE_BATCH_ID, persistedStatus: 'active', readinessCode: 'already_active' }),
        expect.objectContaining({ batchId: CLINICAL_NUTRITION_RELEASE_BATCH_ID, persistedStatus: 'frozen', readinessCode: 'blocked_active_batch_exists' }),
      ]),
    });
  });

  it.each([
    ['nutrition', CLINICAL_NUTRITION_RELEASE_BATCH_ID],
    ['older safety', CLINICAL_OLDER_SAFETY_RELEASE_BATCH_ID],
  ] as const)(
    'accepts Convex-normalized object key order for %s upstream review digests but preserves array order',
    async (_label, batchId) => {
      const ctx = context();
      await expect(handler(materializeRegisteredReleaseBatches)(ctx, {
        expectedRegistryDigest: await registryDigest(),
      })).resolves.toMatchObject({ ok: true });
      const assignments = ctx.tables.clinicalReviewAssignments.filter(
        (row) => row.batchId === batchId,
      );
      expect(assignments.length).toBeGreaterThan(0);
      for (const assignment of assignments) {
        const digests = assignment.upstreamReviewDigests as Array<{
          dimension: string;
          digest: string;
        }>;
        expect(digests.length).toBeGreaterThan(1);
        assignment.upstreamReviewDigests = digests.map(({ dimension, digest }) => ({
          digest,
          dimension,
        }));
      }

      await expect(handler(ownerRegistryStatus)(ctx, ownerStatusArgs())).resolves.toMatchObject({
        materializationCode: 'materialized_exact',
        releases: expect.arrayContaining([
          expect.objectContaining({ batchId, assignmentsExact: true }),
        ]),
      });

      const firstDigests = assignments[0].upstreamReviewDigests as Array<{
        dimension: string;
        digest: string;
      }>;
      assignments[0].upstreamReviewDigests = [
        firstDigests[1],
        firstDigests[0],
        ...firstDigests.slice(2),
      ];
      await expect(handler(ownerRegistryStatus)(ctx, ownerStatusArgs())).resolves.toMatchObject({
        materializationCode: 'blocked_persisted_mismatch',
        releases: expect.arrayContaining([
          expect.objectContaining({ batchId, assignmentsExact: false }),
        ]),
        currentActivation: null,
      });
    },
  );

  it('re-evaluates readiness at the exact server-clock expiry boundary', async () => {
    const ctx = context();
    await expect(handler(materializeRegisteredReleaseBatches)(ctx, {
      expectedRegistryDigest: await registryDigest(),
    })).resolves.toMatchObject({ ok: true });
    const rootRegistration = CLINICAL_REVIEW_BATCH_REGISTRY.find(
      (registration) => registration.manifest.batchId === CLINICAL_INITIAL_RELEASE_BATCH_ID,
    );
    expect(rootRegistration).toBeDefined();
    if (!rootRegistration) return;

    await expect(handler(ownerRegistryStatus)(ctx, ownerStatusArgs(rootRegistration.expiresAt - 1)))
      .resolves.toMatchObject({
        currentActivation: { batchId: CLINICAL_INITIAL_RELEASE_BATCH_ID, readinessCode: 'ready_initial' },
      });
    await expect(handler(ownerRegistryStatus)(ctx, ownerStatusArgs(rootRegistration.expiresAt)))
      .resolves.toMatchObject({
        currentActivation: null,
        releases: expect.arrayContaining([
          expect.objectContaining({ batchId: CLINICAL_INITIAL_RELEASE_BATCH_ID, readinessCode: 'blocked_expired' }),
        ]),
      });
  });

  it('blocks readiness and direct activation when a frozen current batch already has a receipt', async () => {
    const ctx = context();
    await handler(materializeRegisteredReleaseBatches)(ctx, {
      expectedRegistryDigest: await registryDigest(),
    });
    ctx.tables.clinicalReviewBatchReceipts.push({
      _id: 'stale-current-receipt',
      _creationTime: 1,
      batchId: CLINICAL_INITIAL_RELEASE_BATCH_ID,
      freezeDigest: CLINICAL_INITIAL_RELEASE_BATCH_HASH,
      reviewerId: reviewerProfile.userId,
      decisionCount: 2,
      completedAt: TEST_NOW_MS,
      digest: 'd'.repeat(64),
      receiptDigest: 'r'.repeat(64),
      authority: 'release',
      createdAt: TEST_NOW_MS,
    });

    await expect(handler(ownerRegistryStatus)(ctx, ownerStatusArgs())).resolves.toMatchObject({
      currentActivation: null,
      releases: expect.arrayContaining([
        expect.objectContaining({
          batchId: CLINICAL_INITIAL_RELEASE_BATCH_ID,
          persistedReceiptRows: 1,
          readinessCode: 'blocked_current_receipt_present',
        }),
      ]),
    });
    ctx.db.patch.mockClear();
    await expect(handler(activateRegisteredBatch)(ctx, {
      batchId: CLINICAL_INITIAL_RELEASE_BATCH_ID,
      expectedFreezeDigest: CLINICAL_INITIAL_RELEASE_BATCH_HASH,
    })).resolves.toMatchObject({
      ok: false,
      code: 'persisted_registry_state_mismatch',
      batchId: CLINICAL_INITIAL_RELEASE_BATCH_ID,
    });
    expect(ctx.db.patch).not.toHaveBeenCalled();
  });

  it('does not let a completed legacy root skip the registered refreeze predecessor', async () => {
    const ctx = context();
    await completeInitialRelease(ctx);
    expect(ctx.tables.clinicalReviewBatchReceipts).toHaveLength(1);
    const receipt = ctx.tables.clinicalReviewBatchReceipts[0];
    await expect(handler(ownerRegistryStatus)(ctx, ownerStatusArgs())).resolves.toMatchObject({
      currentActivation: null,
      releases: expect.arrayContaining([
        expect.objectContaining({
          batchId: CLINICAL_NUTRITION_RELEASE_BATCH_ID,
          readinessCode: 'blocked_predecessor_mismatch',
        }),
      ]),
    });
    ctx.db.patch.mockClear();
    await expect(handler(activateRegisteredBatch)(ctx, {
      batchId: CLINICAL_NUTRITION_RELEASE_BATCH_ID,
      expectedFreezeDigest: CLINICAL_NUTRITION_RELEASE_BATCH_HASH,
      expectedUpstreamReceiptDigest: receipt.receiptDigest,
    })).resolves.toMatchObject({
      ok: false,
      code: 'upstream_handoff_missing',
      batchId: CLINICAL_NUTRITION_RELEASE_BATCH_ID,
    });
    expect(ctx.db.patch).not.toHaveBeenCalled();
  });

  it('blocks direct successor activation when predecessor assignments are globally duplicated', async () => {
    const ctx = context();
    await completeInitialRelease(ctx);
    const receipt = ctx.tables.clinicalReviewBatchReceipts[0];
    const predecessorAssignment = ctx.tables.clinicalReviewAssignments.find(
      (row) => row.batchId === CLINICAL_INITIAL_RELEASE_BATCH_ID,
    );
    expect(predecessorAssignment).toBeDefined();
    if (!predecessorAssignment) return;
    ctx.tables.clinicalReviewAssignments.push({
      ...predecessorAssignment,
      _id: 'duplicate-predecessor-assignment',
      batchId: 'unregistered-batch',
    });

    await expect(handler(ownerRegistryStatus)(ctx, ownerStatusArgs())).resolves.toMatchObject({
      currentActivation: null,
      releases: expect.arrayContaining([
        expect.objectContaining({ batchId: CLINICAL_INITIAL_RELEASE_BATCH_ID, assignmentsExact: false }),
        expect.objectContaining({ batchId: CLINICAL_NUTRITION_RELEASE_BATCH_ID, readinessCode: 'blocked_persisted_mismatch' }),
      ]),
    });
    ctx.db.patch.mockClear();
    await expect(handler(activateRegisteredBatch)(ctx, {
      batchId: CLINICAL_NUTRITION_RELEASE_BATCH_ID,
      expectedFreezeDigest: CLINICAL_NUTRITION_RELEASE_BATCH_HASH,
      expectedUpstreamReceiptDigest: receipt.receiptDigest,
    })).resolves.toMatchObject({
      ok: false,
      code: 'persisted_registry_state_mismatch',
      batchId: CLINICAL_NUTRITION_RELEASE_BATCH_ID,
    });
    expect(ctx.db.patch).not.toHaveBeenCalled();
  });

  it('keeps the nutrition successor frozen until the root has an exact persisted receipt', async () => {
    const ctx = context();
    await materializeAndActivate(ctx);
    const root = ctx.tables.clinicalReviewBatches.find((row) => (
      row.batchId === CLINICAL_INITIAL_RELEASE_BATCH_ID
    ));
    expect(root).toBeDefined();
    if (root) root.status = 'completed';

    const refused = await handler(activateRegisteredBatch)(ctx, {
      batchId: CLINICAL_NUTRITION_RELEASE_BATCH_ID,
      expectedFreezeDigest: CLINICAL_NUTRITION_RELEASE_BATCH_HASH,
      expectedUpstreamReceiptDigest: 'f'.repeat(64),
    });
    expect(refused).toMatchObject({
      ok: false,
      code: 'upstream_handoff_missing',
      batchId: CLINICAL_NUTRITION_RELEASE_BATCH_ID,
    });
    const successor = ctx.tables.clinicalReviewBatches.find((row) => (
      row.batchId === CLINICAL_NUTRITION_RELEASE_BATCH_ID
    ));
    expect(successor).toMatchObject({ status: 'frozen' });
    expect(successor).not.toHaveProperty('activatedAt');
    expect(ctx.tables.clinicalReviewBatchReceipts).toHaveLength(0);
  });

  it('keeps the older-safety successor frozen until nutrition has its exact persisted receipt', async () => {
    const ctx = context();
    await materializeAndActivate(ctx);
    const root = ctx.tables.clinicalReviewBatches.find((row) => (
      row.batchId === CLINICAL_INITIAL_RELEASE_BATCH_ID
    ));
    const nutrition = ctx.tables.clinicalReviewBatches.find((row) => (
      row.batchId === CLINICAL_NUTRITION_RELEASE_BATCH_ID
    ));
    expect(root).toBeDefined();
    expect(nutrition).toBeDefined();
    if (root) root.status = 'completed';
    if (nutrition) nutrition.status = 'completed';

    const refused = await handler(activateRegisteredBatch)(ctx, {
      batchId: CLINICAL_OLDER_SAFETY_RELEASE_BATCH_ID,
      expectedFreezeDigest: CLINICAL_OLDER_SAFETY_RELEASE_BATCH_HASH,
      expectedUpstreamReceiptDigest: 'e'.repeat(64),
    });
    expect(refused).toMatchObject({
      ok: false,
      code: 'upstream_handoff_missing',
      batchId: CLINICAL_OLDER_SAFETY_RELEASE_BATCH_ID,
    });
    const successor = ctx.tables.clinicalReviewBatches.find((row) => (
      row.batchId === CLINICAL_OLDER_SAFETY_RELEASE_BATCH_ID
    ));
    expect(successor).toMatchObject({ status: 'frozen' });
    expect(successor).not.toHaveProperty('activatedAt');
    expect(ctx.tables.clinicalReviewBatchReceipts).toHaveLength(0);
  });

  it('returns the explicit skin-to-skin advisory and a complete guide snapshot to the assignee', async () => {
    const ctx = context();
    await materializeAndActivate(ctx);
    authState.userId = String(reviewerProfile.userId);
    const result = await handler(readAssignedBatchState)(ctx, {
      nowMs: 1787500570000,
      todayIso: '2026-08-23',
    }) as Record<string, unknown>;
    expect(result).toMatchObject({
      batchId: CLINICAL_INITIAL_RELEASE_BATCH_ID,
      lane: 'clinical',
      assignedRole: 'clinical_reviewer',
    });
    const items = result.items as Array<Record<string, unknown>>;
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      slug: 'act_skin_to_skin_calm',
      reviewRevision: 2,
      snapshot: {
        reviewerAdvisory: {
          en: expect.stringContaining('repeated at-home calming'),
        },
      },
    });
    expect(items[1]).toMatchObject({
      slug: 'gd_birth_2m_sleep',
      type: 'guide',
      reviewRevision: 3,
      snapshot: { reviewerAdvisory: null },
    });
    expect(((items[1].snapshot as Record<string, unknown>).fields as unknown[])).toHaveLength(12);
  });

  it('keeps a parent-published status hidden until the exact batch completes unanimously', async () => {
    const ctx = context();
    await materializeAndActivate(ctx);
    const row = ctx.tables.libraryContent[1];
    row.clinicalStatus = 'published';
    await expect(frozenClinicalPublicationApproval(ctx as never, row as {
      slug: string;
      reviewRevision?: number;
      version?: number;
    })).resolves.toEqual({
      required: true,
      allowed: false,
      missing: ['clinical:persisted_batch'],
      governedDimensions: ['clinical'],
    });
    await expect(contentIsParentReadable(ctx as never, row as never, '2026-08-23')).resolves.toBe(false);
  });
});
