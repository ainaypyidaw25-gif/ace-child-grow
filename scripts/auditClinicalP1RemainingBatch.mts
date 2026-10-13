import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { evaluatePublicationEvidence } from '../convex/lib/evidencePublicationGate.ts';
import { computePriority, projectReviewDecisionsForRevision, requiredDimensionsFor } from '../convex/lib/ownerPriority.ts';
import type { ClinicalReviewBatchReviewer } from '../convex/lib/clinicalReviewBatchData.ts';
import {
  CLINICAL_SOCIAL_GUIDE_BATCH_HASH,
  CLINICAL_SOCIAL_GUIDE_BATCH_ID,
} from '../convex/lib/clinicalSocialGuideBatchData.ts';
import { applyFailClosedAuditExit } from './lib/failClosedAudit.ts';

const deployment = 'graceful-possum-566';
const deploymentReference = 'hotel-ace-groups-of-company:ace-child-grow:prod';
const batchId = 'clinical-p1-remaining-25-2026-10-14-v1';
const sequence = 18;
const dimension = 'clinical' as const;
const fixturePath = resolve(process.cwd(), 'convex/lib/clinicalP1RemainingBatchPreimages.json');
const writeFixture = process.argv.includes('--write');

const reviewer = {
  profileId: 'md79ghw3fm2a09pvhgs63c754n8bgnpy',
  userId: 'mn726081xpgg24y4z4tq9ncw098bh6t1',
  displayName: 'Phyo Ko Ko',
  qualification: 'MBBS',
  role: 'clinical_reviewer',
  identityCanonicalSha256: 'a0863d6008b7680ef5ebcb5290974f3fbbe3ea7a4e7bdf38a295a60ba888e9d3',
} as const satisfies ClinicalReviewBatchReviewer;

const targets = [
  ['guide', 'gd_7_9m_communication', 1],
  ['milestone', 'ms_10_12m_problem_solving_2', 1],
  ['milestone', 'ms_19_24m_play_1', 1],
  ['milestone', 'ms_3_4m_cognitive_1', 1],
  ['milestone', 'ms_3_4m_fine_motor_2', 2],
  ['milestone', 'ms_3_4m_gross_motor_2', 1],
  ['milestone', 'ms_3_4m_nutrition_1', 2],
  ['milestone', 'ms_3_4m_social_1', 1],
  ['milestone', 'ms_5_6m_gross_motor_2', 2],
  ['milestone', 'ms_5_6m_nutrition_1', 1],
  ['milestone', 'ms_7_9m_fine_motor_2', 1],
  ['milestone', 'ms_7_9m_gross_motor_2', 1],
  ['milestone', 'ms_7_9m_language_1', 1],
  ['milestone', 'ms_7_9m_nutrition_1', 2],
  ['milestone', 'ms_7_9m_self_help_1', 2],
  ['milestone', 'ms_7_9m_social_2', 1],
  ['milestone', 'ms_birth_2m_cognitive_1', 1],
  ['milestone', 'ms_birth_2m_communication_2', 1],
  ['milestone', 'ms_birth_2m_fine_motor_1', 1],
  ['activity', 'act_container_in_and_out', 1],
  ['activity', 'act_reach_for_the_toy', 1],
  ['activity', 'act_roll_the_ball_back', 1],
  ['activity', 'act_sit_and_reach_ring', 1],
  ['activity', 'act_texture_basket_infant', 1],
  ['activity', 'act_texture_touch', 1],
].map(([kind, slug, reviewRevision]) => ({ kind: String(kind), slug: String(slug), reviewRevision: Number(reviewRevision) }));

const advisory = {
  mm: 'PDF အတွင်းရှိ အကြောင်းအရာ၊ အသက်အပိုင်းအခြား၊ အထောက်အထား၊ ဘေးကင်းရေးသတိပေးချက်နှင့် လွှဲပြောင်းရန်အချက်များကို ဤ frozen snapshot နှင့် တစ်ခုချင်းတိုက်စစ်ပါ။ ဆေးဘက်ဆိုင်ရာအရ မှန်ကန်ပြီး အထောက်အထားနှင့် ကိုက်ညီမှသာ approve လုပ်ပါ။ အန္တရာယ်လျှော့တွက်ထားခြင်း၊ မကိုက်ညီခြင်း သို့မဟုတ် ပြင်ဆင်ရန်လိုခြင်းရှိပါက changes requested ရွေးပါ။',
  en: 'Compare the PDF-reviewed content item by item with this frozen snapshot, including age range, evidence, safety warnings, and referral thresholds. Approve only when clinically appropriate and evidence-aligned; otherwise request changes.',
} as const;

const query = `
  const targets = ${JSON.stringify(targets)};
  const snapshots = [];
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
    const revision = content ? (content.reviewRevision ?? 1) : 0;
    const contentAudits = content ? await ctx.db.query("aiContentAudits")
      .withIndex("by_content_revision_and_updated_at", (q) => q
        .eq("contentSlug", target.slug).eq("reviewRevision", revision)
        .eq("contentUpdatedAt", content.updatedAt)).take(51) : [];
    const releases = await ctx.db.query("aiPublicationReleases")
      .withIndex("by_target_key", (q) => q.eq("targetKey", target.kind + ":" + target.slug)).take(51);
    const sources = [];
    const evidenceAudits = [];
    for (const sourceId of (links[0]?.sourceIds ?? [])) {
      const sourceRows = await ctx.db.query("evidenceSources")
        .withIndex("by_source_id", (q) => q.eq("sourceId", sourceId)).take(2);
      sources.push(...sourceRows);
      for (const source of sourceRows) {
        evidenceAudits.push(...await ctx.db.query("aiEvidenceAudits")
          .withIndex("by_source_and_updated_at", (q) => q
            .eq("sourceId", source.sourceId).eq("sourceUpdatedAt", source.updatedAt)).take(51));
      }
    }
    snapshots.push({ target, contents, links, media, reviews, contentAudits, releases, sources, evidenceAudits });
  }
  const batches = await ctx.db.query("clinicalReviewBatches").take(40);
  const assignments = await ctx.db.query("clinicalReviewAssignments").take(400);
  const receipts = await ctx.db.query("clinicalReviewBatchReceipts").take(40);
  const predecessorAssignments = assignments.filter((row) => row.batchId === ${JSON.stringify(CLINICAL_SOCIAL_GUIDE_BATCH_ID)});
  const predecessorDecisions = [];
  for (const assignment of predecessorAssignments) {
    predecessorDecisions.push(...await ctx.db.query("contentReviews")
      .withIndex("by_decision_key", (q) => q.eq("decisionKey", assignment.assignmentId)).take(2));
  }
  return {
    checkedAt: Date.now(), snapshots,
    reviewerProfiles: await ctx.db.query("parentProfiles")
      .withIndex("by_user", (q) => q.eq("userId", ${JSON.stringify(reviewer.userId)})).take(2),
    batches, assignments, receipts, predecessorDecisions,
  };
`;

const raw = execFileSync('npx', [
  'convex', 'run', '--inline-query', query, '--deployment', deploymentReference,
], { cwd: process.cwd(), encoding: 'utf8', maxBuffer: 100 * 1024 * 1024 });

type Row = Record<string, unknown> & {
  _id: string; _creationTime: number; type?: string; slug?: string; clinicalStatus?: string;
  reviewRevision?: number; version?: number; updatedAt?: number; sourceIds?: string[];
  dimension?: string; decision?: string; contentVersion?: number; reviewedAt?: number;
  reviewScope?: 'education' | 'clinical'; reviewerId?: string; reviewRevisionBound?: number;
  clinicalReviewBatchId?: string; userId?: string; isStaff?: boolean; displayName?: string;
  staffQualification?: string; staffRole?: string; batchId?: string; sequence?: number;
  status?: string; freezeDigest?: string; itemCount?: number; completedAt?: number;
  authority?: string; decisionCount?: number; digest?: string; receiptDigest?: string;
  assignmentId?: string;
};
type Snapshot = { target: { kind: string; slug: string; reviewRevision: number }; contents: Row[]; links: Row[];
  media: Row[]; reviews: Row[]; contentAudits: Row[]; releases: Row[]; sources: Row[]; evidenceAudits: Row[] };
type Production = { checkedAt: number; snapshots: Snapshot[]; reviewerProfiles: Row[]; batches: Row[];
  assignments: Row[]; receipts: Row[]; predecessorDecisions: Row[] };

const production = JSON.parse(raw) as Production;
const committedFixture = existsSync(fixturePath) ? JSON.parse(readFileSync(fixturePath, 'utf8')) as {
  frozenFrom: { gitBase: string }; frozenAt: number; expiresAt: number;
  expectedPreviousReceiptId: string; expectedPreviousDecisionDigest: string;
  expectedPreviousReceiptDigest: string; freezeDigest: string; routingDigest: string;
} : null;

function canonicalJson(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`).join(',')}}`;
  }
  throw new Error(`Unsupported canonical value: ${typeof value}`);
}
const sha256 = (value: unknown) => createHash('sha256').update(canonicalJson(value)).digest('hex');
const byId = <T extends { _id?: unknown }>(rows: readonly T[]) => [...rows]
  .sort((left, right) => String(left._id ?? '').localeCompare(String(right._id ?? '')));
const todayIso = new Date(production.checkedAt).toISOString().slice(0, 10);

const itemChecks: boolean[] = [];
const items = production.snapshots.map((snapshot, index) => {
  const content = snapshot.contents[0];
  const link = snapshot.links[0];
  const reviewRevision = content?.reviewRevision ?? content?.version ?? 1;
  const reviews = byId(snapshot.reviews);
  const allClinical = reviews.filter((row) => row.dimension === 'clinical');
  const currentClinical = allClinical.filter((row) => row.contentVersion === reviewRevision || row.reviewRevision === reviewRevision);
  const allNonclinical = reviews.filter((row) => row.dimension !== 'clinical');
  const media = byId(snapshot.media);
  const sourceIds = [...(link?.sourceIds ?? [])];
  const aiSnapshot = { contentAudits: byId(snapshot.contentAudits), evidenceAudits: byId(snapshot.evidenceAudits), releases: byId(snapshot.releases), runs: [] };
  const queueProjection = projectReviewDecisionsForRevision(reviews as never[], reviewRevision);
  const priority = computePriority({ ...(content as never), workflowBlocker: queueProjection.workflowBlocker });
  const approved = new Set([...queueProjection.currentByDimension.entries()]
    .filter(([, row]) => row.decision === 'approved').map(([name]) => name));
  const required = content && Array.isArray(content.requiredReviewDimensions) && content.requiredReviewDimensions.length
    ? content.requiredReviewDimensions as string[] : requiredDimensionsFor(priority.riskClass);
  const item = {
    ordinal: index + 1, kind: snapshot.target.kind, slug: snapshot.target.slug, reviewRevision,
    contentId: String(content?._id ?? ''), contentCreationTime: content?._creationTime ?? 0,
    contentUpdatedAt: content?.updatedAt ?? 0, contentCanonicalSha256: sha256(content),
    linkId: String(link?._id ?? ''), linkCreationTime: link?._creationTime ?? 0,
    linkUpdatedAt: link?.updatedAt ?? 0, linkCanonicalSha256: sha256(link), sourceIds,
    sourceCount: snapshot.sources.length, sourcesCanonicalSha256: sha256(snapshot.sources),
    mediaCount: media.length, mediaCanonicalSha256: sha256(media), aiCanonicalSha256: sha256(aiSnapshot),
    currentClinicalReviewCount: currentClinical.length,
    currentClinicalReviewsCanonicalSha256: sha256(currentClinical),
    allClinicalReviewHistoryCanonicalSha256: sha256(allClinical), reviewerAdvisory: advisory,
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
  itemChecks.push(snapshot.contents.length === 1 && snapshot.links.length === 1
    && content?.type === snapshot.target.kind && content?.slug === snapshot.target.slug
    && reviewRevision === snapshot.target.reviewRevision && sourceIds.length > 0
    && snapshot.sources.length === sourceIds.length
    && evaluatePublicationEvidence(sourceIds, snapshot.sources as never[], todayIso).allowed
    && snapshot.media.length <= 50 && snapshot.reviews.length <= 50
    && snapshot.contentAudits.length <= 50 && snapshot.evidenceAudits.length <= 50
    && snapshot.releases.length <= 50 && currentClinical.length === 0
    && priority.priority === 'P1' && required.includes('clinical') && !approved.has('clinical'));
  return item;
});

const stableReviewer = production.reviewerProfiles[0] ? {
  profileId: String(production.reviewerProfiles[0]._id), userId: String(production.reviewerProfiles[0].userId),
  isStaff: production.reviewerProfiles[0].isStaff === true,
  displayName: String(production.reviewerProfiles[0].displayName ?? '').trim(),
  qualification: String(production.reviewerProfiles[0].staffQualification ?? '').trim(),
  role: production.reviewerProfiles[0].staffRole ?? null,
} : null;
const predecessorBatches = production.batches.filter((row) => row.batchId === CLINICAL_SOCIAL_GUIDE_BATCH_ID);
const predecessorReceipts = production.receipts.filter((row) => row.batchId === CLINICAL_SOCIAL_GUIDE_BATCH_ID);
const predecessorAssignments = production.assignments.filter((row) => row.batchId === CLINICAL_SOCIAL_GUIDE_BATCH_ID);
const predecessorReceipt = predecessorReceipts[0];
const expectedPreviousReceiptId = committedFixture?.expectedPreviousReceiptId ?? String(predecessorReceipt?._id ?? '');
const expectedPreviousDecisionDigest = committedFixture?.expectedPreviousDecisionDigest ?? String(predecessorReceipt?.digest ?? '');
const expectedPreviousReceiptDigest = committedFixture?.expectedPreviousReceiptDigest ?? String(predecessorReceipt?.receiptDigest ?? '');
const predecessorExact = predecessorBatches.length === 1 && predecessorBatches[0].status === 'completed'
  && predecessorBatches[0].freezeDigest === CLINICAL_SOCIAL_GUIDE_BATCH_HASH
  && predecessorBatches[0].itemCount === 1 && predecessorBatches[0].completedAt === predecessorReceipt?.completedAt
  && predecessorReceipts.length === 1 && predecessorReceipt?.authority === 'release'
  && predecessorReceipt?.decisionCount === 1 && predecessorReceipt?.digest === expectedPreviousDecisionDigest
  && predecessorReceipt?.receiptDigest === expectedPreviousReceiptDigest && predecessorAssignments.length === 1
  && production.predecessorDecisions.length === 1 && production.predecessorDecisions[0].decision === 'approved'
  && production.predecessorDecisions[0].dimension === 'clinical';

const frozenAt = committedFixture?.frozenAt ?? production.checkedAt;
const expiresAt = committedFixture?.expiresAt ?? (frozenAt + 14 * 24 * 60 * 60 * 1000);
const manifest = { batchId, count: items.length, reviewer, items };
const freezeDigest = sha256(manifest);
const routing = { batchId, sequence, laneGraphVersion: 1, dimension, authority: 'release', activation: {
  kind: 'after_handoff', previousBatchId: CLINICAL_SOCIAL_GUIDE_BATCH_ID,
  expectedPreviousFreezeDigest: CLINICAL_SOCIAL_GUIDE_BATCH_HASH,
}, freezeDigest, frozenAt, expiresAt, reviewerUserId: reviewer.userId, itemCount: items.length };
const routingDigest = sha256(routing);
const activeBatches = production.batches.filter((row) => row.status === 'active');
const newBatchAbsent = production.batches.every((row) => row.batchId !== batchId)
  && production.assignments.every((row) => row.batchId !== batchId)
  && production.receipts.every((row) => row.batchId !== batchId);
const globalRegistryUnique = new Set(production.batches.map((row) => row.batchId)).size === production.batches.length
  && new Set(production.assignments.map((row) => row.assignmentId)).size === production.assignments.length
  && new Set(production.assignments.map((row) => `${row.contentSlug}:${row.dimension}:${row.reviewRevision}`)).size === production.assignments.length
  && new Set(production.receipts.map((row) => row.receiptDigest)).size === production.receipts.length;
const latestSequence = Math.max(...production.batches.map((row) => Number(row.sequence ?? 0)));
const snapshotExact = itemChecks.every(Boolean) && itemChecks.length === 25
  && production.reviewerProfiles.length === 1 && sha256(stableReviewer) === reviewer.identityCanonicalSha256
  && predecessorExact && activeBatches.length === 0 && newBatchAbsent && globalRegistryUnique && latestSequence === 17;
const allExact = snapshotExact && (committedFixture === null ||
  (committedFixture.freezeDigest === freezeDigest && committedFixture.routingDigest === routingDigest));

const fixture = {
  frozenFrom: { deployment, checkedAt: new Date(frozenAt).toISOString(),
    gitBase: committedFixture?.frozenFrom.gitBase ?? execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() },
  batchId, frozenAt, expiresAt, previousBatchId: CLINICAL_SOCIAL_GUIDE_BATCH_ID,
  expectedPreviousFreezeDigest: CLINICAL_SOCIAL_GUIDE_BATCH_HASH, expectedPreviousReceiptId,
  expectedPreviousDecisionDigest, expectedPreviousReceiptDigest, reviewer, items, freezeDigest, routingDigest,
};
if (writeFixture && allExact) writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ allExact, frozenAt, expiresAt, freezeDigest, routingDigest,
  itemChecks: itemChecks.filter(Boolean).length, predecessorExact,
  registryCounts: { batches: production.batches.length, assignments: production.assignments.length,
    receipts: production.receipts.length, active: activeBatches.length, latestSequence } }, null, 2));
applyFailClosedAuditExit(allExact, process);
