import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { evaluatePublicationEvidence } from '../convex/lib/evidencePublicationGate.ts';
import { applyFailClosedAuditExit } from './lib/failClosedAudit.ts';
import {
  CLINICAL_SAFETY_SUCCESSOR_BATCH_HASH,
  CLINICAL_SAFETY_SUCCESSOR_BATCH_ID,
  CLINICAL_SAFETY_SUCCESSOR_BATCH_ITEMS,
} from '../convex/lib/clinicalSafetySuccessorBatchData.ts';
import type { ClinicalReviewBatchReviewer } from '../convex/lib/clinicalReviewBatchData.ts';

const deployment = 'graceful-possum-566';
const deploymentReference = 'hotel-ace-groups-of-company:ace-child-grow:prod';
const batchId = 'clinical-review-successor-14-2026-09-01-v1';
const sequence = 16;
const dimension = 'clinical' as const;
const fixturePath = resolve(
  process.cwd(),
  'convex/lib/clinicalReviewSuccessorBatchPreimages.json',
);
const writeFixture = process.argv.includes('--write');
const CLINICAL_REVIEW_SUCCESSOR_REVIEWER = {
  profileId: 'md79ghw3fm2a09pvhgs63c754n8bgnpy',
  userId: 'mn726081xpgg24y4z4tq9ncw098bh6t1',
  displayName: 'Phyo Ko Ko',
  qualification: 'MBBS',
  role: 'clinical_reviewer',
  identityCanonicalSha256:
    'a0863d6008b7680ef5ebcb5290974f3fbbe3ea7a4e7bdf38a295a60ba888e9d3',
} as const satisfies ClinicalReviewBatchReviewer;
const targets = CLINICAL_SAFETY_SUCCESSOR_BATCH_ITEMS.map((item) => ({
  kind: item.kind,
  slug: item.slug,
  sourceIds: item.sourceIds,
}));

const CLINICAL_REVIEW_ADVISORY = {
  mm: 'အကြောင်းအရာတစ်ခုစီ၏ ကျန်းမာရေးနှင့် ဖွံ့ဖြိုးမှုဆိုင်ရာ အဆိုများ၊ အရေးပေါ်လက္ခဏာများနှင့် ဆရာဝန်ထံ လွှဲပြောင်းရန် အကြံပြုချက်များသည် ကလေး၏ အသက်အရွယ်နှင့် ဆေးဘက်ဆိုင်ရာ အန္တရာယ်အဆင့်အတွက် မှန်ကန်ကြောင်း စစ်ဆေးပါ။ အန္တရာယ်တစ်ခု လျှော့တွက်ထားခြင်း သို့မဟုတ် အထောက်အထားထက်ကျော်လွန်သော အဆိုရှိပါက approve မလုပ်ဘဲ changes requested ရွေးပါ။',
  en: 'Confirm that each health and development claim, urgent warning sign, and referral recommendation is clinically appropriate for the child’s age and level of risk. If any risk is understated or any claim exceeds the evidence, request changes instead of approving.',
} as const;

const query = `
  const targets = ${JSON.stringify(targets)};
  const targetRows = [];
  for (const target of targets) {
    const contents = await ctx.db.query("libraryContent")
      .withIndex("by_slug", (q) => q.eq("slug", target.slug)).take(2);
    const links = await ctx.db.query("evidenceLinks")
      .withIndex("by_kind_slug", (q) => q.eq("kind", target.kind).eq("slug", target.slug)).take(2);
    const media = await ctx.db.query("libraryMedia")
      .withIndex("by_content", (q) => q.eq("contentSlug", target.slug)).take(51);
    const reviews = await ctx.db.query("contentReviews")
      .withIndex("by_content", (q) => q.eq("contentSlug", target.slug)).take(51);
    const content = contents[0];
    const contentAudits = content ? await ctx.db.query("aiContentAudits")
      .withIndex("by_content_revision_and_updated_at", (q) => q
        .eq("contentSlug", target.slug)
        .eq("reviewRevision", content.reviewRevision)
        .eq("contentUpdatedAt", content.updatedAt)).take(51) : [];
    const releases = await ctx.db.query("aiPublicationReleases")
      .withIndex("by_target_key", (q) => q.eq("targetKey", target.kind + ":" + target.slug)).take(51);
    const sources = [];
    const evidenceAudits = [];
    for (const sourceId of target.sourceIds) {
      const sourceRows = await ctx.db.query("evidenceSources")
        .withIndex("by_source_id", (q) => q.eq("sourceId", sourceId)).take(2);
      sources.push(...sourceRows);
      for (const source of sourceRows) {
        evidenceAudits.push(...await ctx.db.query("aiEvidenceAudits")
          .withIndex("by_source_and_updated_at", (q) => q
            .eq("sourceId", source.sourceId).eq("sourceUpdatedAt", source.updatedAt)).take(51));
      }
    }
    targetRows.push({ contents, links, media, reviews, contentAudits, releases, sources, evidenceAudits });
  }
  const batches = await ctx.db.query("clinicalReviewBatches").take(33);
  const assignments = await ctx.db.query("clinicalReviewAssignments").take(301);
  const receipts = await ctx.db.query("clinicalReviewBatchReceipts").take(33);
  const batchDecisions = [];
  for (const assignment of assignments) {
    batchDecisions.push(...await ctx.db.query("contentReviews")
      .withIndex("by_decision_key", (q) => q.eq("decisionKey", assignment.assignmentId)).take(2));
  }
  return {
    checkedAt: Date.now(),
    targets: targetRows,
    reviewerProfiles: await ctx.db.query("parentProfiles")
      .withIndex("by_user", (q) => q.eq("userId", ${JSON.stringify(CLINICAL_REVIEW_SUCCESSOR_REVIEWER.userId)})).take(2),
    batches,
    assignments,
    receipts,
    batchDecisions,
  };
`;

const raw = execFileSync('npx', [
  'convex', 'run', '--inline-query', query, '--deployment', deploymentReference,
], {
  cwd: process.cwd(),
  encoding: 'utf8',
  maxBuffer: 100 * 1024 * 1024,
});

type Row = Record<string, unknown> & {
  _id: string;
  _creationTime: number;
  type?: string;
  slug?: string;
  reviewRevision?: number;
  contentVersion?: number;
  clinicalStatus?: string;
  updatedAt?: number;
  sourceIds?: string[];
  dimension?: string;
  clinicalReviewBatchId?: string;
  decision?: string;
  userId?: string;
  isStaff?: boolean;
  displayName?: string;
  staffQualification?: string;
  staffRole?: string;
  batchId?: string;
  status?: string;
  freezeDigest?: string;
  itemCount?: number;
  completedAt?: number;
  authority?: string;
  decisionCount?: number;
  digest?: string;
  receiptDigest?: string;
  assignmentId?: string;
};
type Production = {
  checkedAt: number;
  targets: Array<{
    contents: Row[];
    links: Row[];
    media: Row[];
    reviews: Row[];
    contentAudits: Row[];
    releases: Row[];
    sources: Row[];
    evidenceAudits: Row[];
  }>;
  reviewerProfiles: Row[];
  batches: Row[];
  assignments: Row[];
  receipts: Row[];
  batchDecisions: Row[];
};

const production = JSON.parse(raw) as Production;
const committedFixture = existsSync(fixturePath) ? JSON.parse(
  readFileSync(fixturePath, 'utf8'),
) as {
  frozenFrom: { gitBase: string };
  frozenAt: number;
  expiresAt: number;
  expectedPreviousReceiptId: string;
  expectedPreviousDecisionDigest: string;
  expectedPreviousReceiptDigest: string;
  freezeDigest: string;
  routingDigest: string;
} : null;

function canonicalJson(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`).join(',')}}`;
  }
  throw new Error(`Unsupported canonical value: ${typeof value}`);
}

function sha256(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex');
}

function byId<T extends { _id?: unknown }>(rows: readonly T[]): T[] {
  return [...rows].sort((left, right) =>
    String(left._id ?? '').localeCompare(String(right._id ?? '')));
}

const todayIso = new Date(production.checkedAt).toISOString().slice(0, 10);
const items = production.targets.map((snapshot, index) => {
  const base = CLINICAL_SAFETY_SUCCESSOR_BATCH_ITEMS[index];
  const advisory = CLINICAL_REVIEW_ADVISORY;
  const content = snapshot.contents[0];
  const link = snapshot.links[0];
  const reviews = byId(snapshot.reviews);
  const allClinical = reviews.filter((row) => row.dimension === 'clinical');
  const currentClinical = allClinical.filter((row) =>
    row.contentVersion === content?.reviewRevision || row.reviewRevision === content?.reviewRevision);
  const allNonclinical = reviews.filter((row) => row.dimension !== 'clinical');
  const nativeMyanmar = reviews.filter((row) => row.dimension === 'native_myanmar');
  const english = reviews.filter((row) => row.dimension === 'english');
  const childDevelopment = reviews.filter((row) => row.dimension === 'child_development');
  const evidence = reviews.filter((row) => row.dimension === 'evidence');
  const safety = reviews.filter((row) => row.dimension === 'safety');
  const currentDimension = reviews.filter((row) => row.dimension === 'clinical').filter((row) =>
    row.contentVersion === content?.reviewRevision || row.reviewRevision === content?.reviewRevision);
  const media = byId(snapshot.media);
  const aiSnapshot = {
    contentAudits: byId(snapshot.contentAudits),
    evidenceAudits: byId(snapshot.evidenceAudits),
    releases: byId(snapshot.releases),
    runs: [],
  };
  const exact = Boolean(
    advisory
    && snapshot.contents.length === 1
    && snapshot.links.length === 1
    && content.type === base.kind
    && content.slug === base.slug
    && content.reviewRevision === base.reviewRevision
    && content.clinicalStatus === 'clinical_review'
    && sha256(content) === base.contentCanonicalSha256
    && sha256(link) === base.linkCanonicalSha256
    && canonicalJson(link.sourceIds) === canonicalJson(base.sourceIds)
    && snapshot.sources.length === base.sourceCount
    && sha256(snapshot.sources) === base.sourcesCanonicalSha256
    && evaluatePublicationEvidence(base.sourceIds, snapshot.sources as never[], todayIso).allowed
    && media.length === base.mediaCount
    && sha256(media) === base.mediaCanonicalSha256
    && sha256(aiSnapshot) === base.aiCanonicalSha256
    && snapshot.media.length <= 50
    && snapshot.reviews.length <= 50
    && snapshot.contentAudits.length <= 50
    && snapshot.evidenceAudits.length <= 50
    && snapshot.releases.length <= 50
    && currentDimension.length === 0
  );
  return {
    exact,
    item: {
      ordinal: index + 1,
      kind: base.kind,
      slug: base.slug,
      reviewRevision: content.reviewRevision,
      contentId: String(content._id),
      contentCreationTime: content._creationTime,
      contentUpdatedAt: content.updatedAt,
      contentCanonicalSha256: sha256(content),
      linkId: String(link._id),
      linkCreationTime: link._creationTime,
      linkUpdatedAt: link.updatedAt,
      linkCanonicalSha256: sha256(link),
      sourceIds: [...base.sourceIds],
      sourceCount: snapshot.sources.length,
      sourcesCanonicalSha256: sha256(snapshot.sources),
      mediaCount: media.length,
      mediaCanonicalSha256: sha256(media),
      aiCanonicalSha256: sha256(aiSnapshot),
      currentClinicalReviewCount: currentClinical.length,
      currentClinicalReviewsCanonicalSha256: sha256(currentClinical),
      allClinicalReviewHistoryCanonicalSha256: sha256(allClinical),
      reviewerAdvisory: advisory,
      upstreamReviewDigests: [
        { dimension: 'all_review_history', digest: sha256(reviews) },
        { dimension: 'all_nonclinical_history', digest: sha256(allNonclinical) },
        { dimension: 'native_myanmar', digest: sha256(nativeMyanmar) },
        { dimension: 'english', digest: sha256(english) },
        { dimension: 'child_development', digest: sha256(childDevelopment) },
        { dimension: 'evidence', digest: sha256(evidence) },
        { dimension: 'safety', digest: sha256(safety) },
      ],
    },
  };
});

const reviewer = production.reviewerProfiles[0];
const stableIdentity = reviewer ? {
  profileId: String(reviewer._id),
  userId: String(reviewer.userId),
  isStaff: reviewer.isStaff === true,
  displayName: (reviewer.displayName ?? '').trim(),
  qualification: (reviewer.staffQualification ?? '').trim(),
  role: reviewer.staffRole ?? null,
} : null;

const predecessorBatchRows = production.batches.filter(
  (row) => row.batchId === CLINICAL_SAFETY_SUCCESSOR_BATCH_ID,
);
const predecessorReceipts = production.receipts.filter(
  (row) => row.batchId === CLINICAL_SAFETY_SUCCESSOR_BATCH_ID,
);
const predecessorAssignments = production.assignments.filter(
  (row) => row.batchId === CLINICAL_SAFETY_SUCCESSOR_BATCH_ID,
);
const predecessorDecisions = production.targets.flatMap((snapshot) => snapshot.reviews.filter(
  (row) => row.clinicalReviewBatchId === CLINICAL_SAFETY_SUCCESSOR_BATCH_ID,
));
const predecessorReceipt = predecessorReceipts[0];
const expectedPreviousReceiptId = committedFixture?.expectedPreviousReceiptId
  ?? String(predecessorReceipt?._id ?? '');
const expectedPreviousDecisionDigest = committedFixture?.expectedPreviousDecisionDigest
  ?? 'f660247521c1205ede5bc7293b014579035f0dc7c4a4c57d320027eca418d8f0';
const expectedPreviousReceiptDigest = committedFixture?.expectedPreviousReceiptDigest
  ?? '00f1e8eb917b2e0849e4c0e6bafd4ca7efa4d953ae423d8390138e64a028b422';
const predecessorExact = predecessorBatchRows.length === 1
  && predecessorBatchRows[0].status === 'completed'
  && predecessorBatchRows[0].freezeDigest === CLINICAL_SAFETY_SUCCESSOR_BATCH_HASH
  && predecessorBatchRows[0].itemCount === 14
  && predecessorBatchRows[0].completedAt === predecessorReceipt?.completedAt
  && predecessorReceipts.length === 1
  && String(predecessorReceipt?._id ?? '') === expectedPreviousReceiptId
  && predecessorReceipt?.freezeDigest === CLINICAL_SAFETY_SUCCESSOR_BATCH_HASH
  && predecessorReceipt?.authority === 'release'
  && predecessorReceipt?.decisionCount === 14
  && predecessorReceipt?.digest === expectedPreviousDecisionDigest
  && predecessorReceipt?.receiptDigest === expectedPreviousReceiptDigest
  && predecessorAssignments.length === 14
  && predecessorDecisions.length === 14
  && predecessorDecisions.every((row) =>
    row.dimension === 'safety'
    && row.decision === 'approved'
    && row.reviewRevision === row.contentVersion);

const frozenAt = committedFixture?.frozenAt ?? production.checkedAt;
const expiresAt = committedFixture?.expiresAt ?? (frozenAt + 14 * 24 * 60 * 60 * 1000);
const manifest = {
  batchId,
  count: items.length,
  reviewer: CLINICAL_REVIEW_SUCCESSOR_REVIEWER,
  items: items.map(({ item }) => item),
};
const freezeDigest = sha256(manifest);
const routing = {
  batchId,
  sequence,
  laneGraphVersion: 1,
  dimension,
  authority: 'release',
  activation: {
    kind: 'after_handoff',
    previousBatchId: CLINICAL_SAFETY_SUCCESSOR_BATCH_ID,
    expectedPreviousFreezeDigest: CLINICAL_SAFETY_SUCCESSOR_BATCH_HASH,
  },
  freezeDigest,
  frozenAt,
  expiresAt,
  reviewerUserId: CLINICAL_REVIEW_SUCCESSOR_REVIEWER.userId,
  itemCount: items.length,
};
const routingDigest = sha256(routing);
const activeBatches = production.batches.filter((row) => row.status === 'active');
const newBatchAbsent = production.batches.every((row) => row.batchId !== batchId)
  && production.assignments.every((row) => row.batchId !== batchId)
  && production.receipts.every((row) => row.batchId !== batchId);
const assignmentIds = production.assignments.map((row) => row.assignmentId);
const semanticTargets = production.assignments.map((row) =>
  `${row.contentSlug}:${row.dimension}:${row.reviewRevision}`);
const receiptDigests = production.receipts.map((row) => row.receiptDigest);
const globalRegistryUnique = new Set(production.batches.map((row) => row.batchId)).size
    === production.batches.length
  && new Set(assignmentIds).size === assignmentIds.length
  && new Set(semanticTargets).size === semanticTargets.length
  && new Set(receiptDigests).size === receiptDigests.length;
const snapshotExact = items.every(({ exact }) => exact)
  && production.reviewerProfiles.length === 1
  && sha256(stableIdentity)
    === CLINICAL_REVIEW_SUCCESSOR_REVIEWER.identityCanonicalSha256
  && predecessorExact
  && activeBatches.length === 0
  && newBatchAbsent
  && globalRegistryUnique
  && production.batches.length === 14
  && production.assignments.length === 156
  && production.receipts.length === 10
  && typeof expectedPreviousReceiptId === 'string'
  && expectedPreviousReceiptId.length > 0
  && typeof expectedPreviousDecisionDigest === 'string'
  && typeof expectedPreviousReceiptDigest === 'string';
const allExact = snapshotExact && (committedFixture === null || (
  committedFixture.freezeDigest === freezeDigest
  && committedFixture.routingDigest === routingDigest
));

const fixture = {
  frozenFrom: {
    deployment,
    checkedAt: new Date(frozenAt).toISOString(),
    gitBase: committedFixture?.frozenFrom.gitBase
      ?? execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  },
  batchId,
  frozenAt,
  expiresAt,
  previousBatchId: CLINICAL_SAFETY_SUCCESSOR_BATCH_ID,
  expectedPreviousFreezeDigest: CLINICAL_SAFETY_SUCCESSOR_BATCH_HASH,
  expectedPreviousReceiptId,
  expectedPreviousDecisionDigest,
  expectedPreviousReceiptDigest,
  reviewer: CLINICAL_REVIEW_SUCCESSOR_REVIEWER,
  items: manifest.items,
  freezeDigest,
  routingDigest,
  registry: {
    batches: byId(production.batches),
    assignments: byId(production.assignments),
    receipts: byId(production.receipts),
    decisions: byId(production.batchDecisions),
  },
};

if (writeFixture && allExact) {
  writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8');
}

// eslint-disable-next-line no-console
console.log(JSON.stringify({
  allExact,
  checkedAt: fixture.frozenFrom.checkedAt,
  expiresAt: new Date(expiresAt).toISOString(),
  expectedPreviousReceiptId,
  expectedPreviousDecisionDigest,
  expectedPreviousReceiptDigest,
  freezeDigest,
  routingDigest,
  predecessorExact,
  registryCounts: {
    batches: production.batches.length,
    assignments: production.assignments.length,
    receipts: production.receipts.length,
    active: activeBatches.length,
  },
  items: items.map(({ exact, item }) => ({
    ordinal: item.ordinal,
    slug: item.slug,
    revision: item.reviewRevision,
    exact,
  })),
}, null, 2));

applyFailClosedAuditExit(allExact, process);
