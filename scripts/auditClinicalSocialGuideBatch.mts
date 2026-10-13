import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { evaluatePublicationEvidence } from '../convex/lib/evidencePublicationGate.ts';
import { applyFailClosedAuditExit } from './lib/failClosedAudit.ts';
import {
  CLINICAL_REVIEW_SUCCESSOR_BATCH_HASH,
  CLINICAL_REVIEW_SUCCESSOR_BATCH_ID,
} from '../convex/lib/clinicalReviewSuccessorBatchData.ts';
import type { ClinicalReviewBatchReviewer } from '../convex/lib/clinicalReviewBatchData.ts';

const deployment = 'graceful-possum-566';
const deploymentReference = 'hotel-ace-groups-of-company:ace-child-grow:prod';
const batchId = 'clinical-social-guide-gd-7-9m-2026-10-13-v1';
const sequence = 17;
const dimension = 'clinical' as const;
const fixturePath = resolve(process.cwd(), 'convex/lib/clinicalSocialGuideBatchPreimages.json');
const writeFixture = process.argv.includes('--write');

const reviewer = {
  profileId: 'md79ghw3fm2a09pvhgs63c754n8bgnpy',
  userId: 'mn726081xpgg24y4z4tq9ncw098bh6t1',
  displayName: 'Phyo Ko Ko',
  qualification: 'MBBS',
  role: 'clinical_reviewer',
  identityCanonicalSha256:
    'a0863d6008b7680ef5ebcb5290974f3fbbe3ea7a4e7bdf38a295a60ba888e9d3',
} as const satisfies ClinicalReviewBatchReviewer;

const target = {
  kind: 'guide',
  slug: 'gd_7_9m_social',
  sourceIds: [
    'cdc-milestones-2026',
    'aap-milestones-2022',
    'who-nurturing-care-2018',
    'nice-ph40-social-emotional-2012',
    'aap-power-of-play-2018',
  ],
} as const;

const advisory = {
  mm: 'ကလေး၏ လူမှုဆက်ဆံရေးနှင့် ခွဲခွာမှုဆိုင်ရာ ဖော်ပြချက်များ၊ လှုပ်ခါခြင်းမပြုရန် သတိပေးချက်၊ အရေးပေါ်လက္ခဏာများနှင့် ကျန်းမာရေးဝန်ထမ်းထံ လွှဲပြောင်းရန် အကြံပြုချက်များသည် ၇–၉ လအရွယ်အတွက် ဆေးဘက်ဆိုင်ရာအရ မှန်ကန်ပြီး အထောက်အထားနှင့် ကိုက်ညီကြောင်း စစ်ဆေးပါ။ အန္တရာယ်လျှော့တွက်ထားခြင်း သို့မဟုတ် အထောက်အထားထက်ကျော်လွန်သော အဆိုရှိပါက approve မလုပ်ဘဲ changes requested ရွေးပါ။',
  en: 'Confirm that the social-development and separation statements, never-shake warning, urgent warning signs, and referral advice are clinically appropriate for ages 7–9 months and supported by the evidence. If any risk is understated or any claim exceeds the evidence, request changes instead of approving.',
} as const;

const query = `
  const target = ${JSON.stringify(target)};
  const contents = await ctx.db.query("libraryContent")
    .withIndex("by_slug", (q) => q.eq("slug", target.slug)).take(2);
  const links = await ctx.db.query("evidenceLinks")
    .withIndex("by_kind_slug", (q) => q.eq("kind", target.kind).eq("slug", target.slug)).take(2);
  const media = await ctx.db.query("libraryMedia")
    .withIndex("by_content", (q) => q.eq("contentSlug", target.slug)).take(51);
  const reviews = await ctx.db.query("contentReviews")
    .withIndex("by_content", (q) => q.eq("contentSlug", target.slug)).take(51);
  const content = contents[0];
  const reviewRevision = content ? (content.reviewRevision ?? 1) : 0;
  const contentAudits = content ? await ctx.db.query("aiContentAudits")
    .withIndex("by_content_revision_and_updated_at", (q) => q
      .eq("contentSlug", target.slug)
      .eq("reviewRevision", reviewRevision)
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
  const batches = await ctx.db.query("clinicalReviewBatches").take(34);
  const assignments = await ctx.db.query("clinicalReviewAssignments").take(302);
  const receipts = await ctx.db.query("clinicalReviewBatchReceipts").take(34);
  const batchDecisions = [];
  for (const assignment of assignments) {
    batchDecisions.push(...await ctx.db.query("contentReviews")
      .withIndex("by_decision_key", (q) => q.eq("decisionKey", assignment.assignmentId)).take(2));
  }
  return {
    checkedAt: Date.now(), target: { contents, links, media, reviews, contentAudits,
      releases, sources, evidenceAudits },
    reviewerProfiles: await ctx.db.query("parentProfiles")
      .withIndex("by_user", (q) => q.eq("userId", ${JSON.stringify(reviewer.userId)})).take(2),
    batches, assignments, receipts, batchDecisions,
  };
`;

const raw = execFileSync('npx', [
  'convex', 'run', '--inline-query', query, '--deployment', deploymentReference,
], { cwd: process.cwd(), encoding: 'utf8', maxBuffer: 100 * 1024 * 1024 });

type Row = Record<string, unknown> & {
  _id: string;
  _creationTime: number;
  type?: string;
  slug?: string;
  reviewRevision?: number;
  version?: number;
  updatedAt?: number;
  sourceIds?: string[];
  dimension?: string;
  decision?: string;
  contentVersion?: number;
  clinicalReviewBatchId?: string;
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
  target: {
    contents: Row[];
    links: Row[];
    media: Row[];
    reviews: Row[];
    contentAudits: Row[];
    releases: Row[];
    sources: Row[];
    evidenceAudits: Row[];
  };
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

const snapshot = production.target;
const content = snapshot.contents[0];
const link = snapshot.links[0];
const reviewRevision = content?.reviewRevision ?? content?.version ?? 1;
const reviews = byId(snapshot.reviews);
const allClinical = reviews.filter((row) => row.dimension === 'clinical');
const currentClinical = allClinical.filter((row) =>
  row.contentVersion === reviewRevision || row.reviewRevision === reviewRevision);
const allNonclinical = reviews.filter((row) => row.dimension !== 'clinical');
const media = byId(snapshot.media);
const aiSnapshot = {
  contentAudits: byId(snapshot.contentAudits),
  evidenceAudits: byId(snapshot.evidenceAudits),
  releases: byId(snapshot.releases),
  runs: [],
};
const todayIso = new Date(production.checkedAt).toISOString().slice(0, 10);
const item = {
  ordinal: 1,
  kind: target.kind,
  slug: target.slug,
  reviewRevision,
  contentId: String(content?._id ?? ''),
  contentCreationTime: content?._creationTime ?? 0,
  contentUpdatedAt: content?.updatedAt ?? 0,
  contentCanonicalSha256: sha256(content),
  linkId: String(link?._id ?? ''),
  linkCreationTime: link?._creationTime ?? 0,
  linkUpdatedAt: link?.updatedAt ?? 0,
  linkCanonicalSha256: sha256(link),
  sourceIds: [...target.sourceIds],
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
    { dimension: 'native_myanmar', digest: sha256(reviews.filter((row) => row.dimension === 'native_myanmar')) },
    { dimension: 'english', digest: sha256(reviews.filter((row) => row.dimension === 'english')) },
    { dimension: 'child_development', digest: sha256(reviews.filter((row) => row.dimension === 'child_development')) },
    { dimension: 'evidence', digest: sha256(reviews.filter((row) => row.dimension === 'evidence')) },
    { dimension: 'safety', digest: sha256(reviews.filter((row) => row.dimension === 'safety')) },
  ],
};

const itemExact = snapshot.contents.length === 1
  && snapshot.links.length === 1
  && content?.type === target.kind
  && content?.slug === target.slug
  && reviewRevision === 1
  && canonicalJson(link?.sourceIds) === canonicalJson(target.sourceIds)
  && snapshot.sources.length === target.sourceIds.length
  && evaluatePublicationEvidence(target.sourceIds, snapshot.sources as never[], todayIso).allowed
  && snapshot.media.length <= 50
  && snapshot.reviews.length <= 50
  && snapshot.contentAudits.length <= 50
  && snapshot.evidenceAudits.length <= 50
  && snapshot.releases.length <= 50
  && currentClinical.length === 0;

const stableReviewer = production.reviewerProfiles[0] ? {
  profileId: String(production.reviewerProfiles[0]._id),
  userId: String(production.reviewerProfiles[0].userId),
  isStaff: production.reviewerProfiles[0].isStaff === true,
  displayName: String(production.reviewerProfiles[0].displayName ?? '').trim(),
  qualification: String(production.reviewerProfiles[0].staffQualification ?? '').trim(),
  role: production.reviewerProfiles[0].staffRole ?? null,
} : null;

const predecessorBatches = production.batches.filter((row) =>
  row.batchId === CLINICAL_REVIEW_SUCCESSOR_BATCH_ID);
const predecessorReceipts = production.receipts.filter((row) =>
  row.batchId === CLINICAL_REVIEW_SUCCESSOR_BATCH_ID);
const predecessorAssignments = production.assignments.filter((row) =>
  row.batchId === CLINICAL_REVIEW_SUCCESSOR_BATCH_ID);
const predecessorDecisions = production.batchDecisions.filter((row) =>
  row.clinicalReviewBatchId === CLINICAL_REVIEW_SUCCESSOR_BATCH_ID);
const predecessorReceipt = predecessorReceipts[0];
const expectedPreviousReceiptId = committedFixture?.expectedPreviousReceiptId
  ?? String(predecessorReceipt?._id ?? '');
const expectedPreviousDecisionDigest = committedFixture?.expectedPreviousDecisionDigest
  ?? String(predecessorReceipt?.digest ?? '');
const expectedPreviousReceiptDigest = committedFixture?.expectedPreviousReceiptDigest
  ?? String(predecessorReceipt?.receiptDigest ?? '');
const predecessorExact = predecessorBatches.length === 1
  && predecessorBatches[0].status === 'completed'
  && predecessorBatches[0].freezeDigest === CLINICAL_REVIEW_SUCCESSOR_BATCH_HASH
  && predecessorBatches[0].itemCount === 14
  && predecessorBatches[0].completedAt === predecessorReceipt?.completedAt
  && predecessorReceipts.length === 1
  && predecessorReceipt?.authority === 'release'
  && predecessorReceipt?.decisionCount === 14
  && predecessorReceipt?.digest === expectedPreviousDecisionDigest
  && predecessorReceipt?.receiptDigest === expectedPreviousReceiptDigest
  && predecessorAssignments.length === 14
  && predecessorDecisions.length === 14
  && predecessorDecisions.every((row) => row.dimension === 'clinical'
    && row.decision === 'approved' && row.reviewRevision === row.contentVersion);

const frozenAt = committedFixture?.frozenAt ?? production.checkedAt;
const expiresAt = committedFixture?.expiresAt ?? (frozenAt + 14 * 24 * 60 * 60 * 1000);
const manifest = { batchId, count: 1, reviewer, items: [item] };
const freezeDigest = sha256(manifest);
const routing = {
  batchId, sequence, laneGraphVersion: 1, dimension, authority: 'release',
  activation: {
    kind: 'after_handoff',
    previousBatchId: CLINICAL_REVIEW_SUCCESSOR_BATCH_ID,
    expectedPreviousFreezeDigest: CLINICAL_REVIEW_SUCCESSOR_BATCH_HASH,
  },
  freezeDigest, frozenAt, expiresAt, reviewerUserId: reviewer.userId, itemCount: 1,
};
const routingDigest = sha256(routing);
const activeBatches = production.batches.filter((row) => row.status === 'active');
const newBatchAbsent = production.batches.every((row) => row.batchId !== batchId)
  && production.assignments.every((row) => row.batchId !== batchId)
  && production.receipts.every((row) => row.batchId !== batchId);
const globalRegistryUnique = new Set(production.batches.map((row) => row.batchId)).size
    === production.batches.length
  && new Set(production.assignments.map((row) => row.assignmentId)).size
    === production.assignments.length
  && new Set(production.assignments.map((row) =>
    `${row.contentSlug}:${row.dimension}:${row.reviewRevision}`)).size
    === production.assignments.length
  && new Set(production.receipts.map((row) => row.receiptDigest)).size
    === production.receipts.length;
const snapshotExact = itemExact
  && production.reviewerProfiles.length === 1
  && sha256(stableReviewer) === reviewer.identityCanonicalSha256
  && predecessorExact
  && activeBatches.length === 0
  && newBatchAbsent
  && globalRegistryUnique
  // Sequence 1 is the historical pilot and is intentionally not persisted in
  // the release registry. Production therefore contains sequences 2-16 only.
  && production.batches.length === 15
  && production.assignments.length === 170
  && production.receipts.length === 11;
const allExact = snapshotExact && (committedFixture === null || (
  committedFixture.freezeDigest === freezeDigest
  && committedFixture.routingDigest === routingDigest));

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
  previousBatchId: CLINICAL_REVIEW_SUCCESSOR_BATCH_ID,
  expectedPreviousFreezeDigest: CLINICAL_REVIEW_SUCCESSOR_BATCH_HASH,
  expectedPreviousReceiptId,
  expectedPreviousDecisionDigest,
  expectedPreviousReceiptDigest,
  reviewer,
  items: [item],
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
  freezeDigest,
  routingDigest,
  itemExact,
  predecessorExact,
  registryCounts: {
    batches: production.batches.length,
    assignments: production.assignments.length,
    receipts: production.receipts.length,
    active: activeBatches.length,
  },
}, null, 2));

applyFailClosedAuditExit(allExact, process);
