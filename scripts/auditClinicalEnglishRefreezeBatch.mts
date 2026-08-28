import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CONTENT_SEED } from '../src/content/seed/index.ts';
import { evaluatePublicationEvidence } from '../convex/lib/evidencePublicationGate.ts';
import {
  CLINICAL_ENGLISH_RELEASE_BATCH_HASH,
  CLINICAL_ENGLISH_RELEASE_BATCH_ID,
  CLINICAL_ENGLISH_RELEASE_BATCH_ITEMS,
  CLINICAL_ENGLISH_RELEASE_BATCH_REVIEWER,
} from '../convex/lib/clinicalEnglishBatchData.ts';
import {
  ENGLISH_REFREEZE_CORRECTION_TARGETS,
  ENGLISH_REFREEZE_DECISION_SET_DIGEST,
} from '../convex/lib/englishRefreezeCorrectionData.ts';

const deployment = 'graceful-possum-566';
const deploymentReference = 'hotel-ace-groups-of-company:ace-child-grow:prod';
const batchId = 'clinical-english-refreeze-14-2026-08-28-v1';
const fixturePath = resolve(process.cwd(), 'convex/lib/clinicalEnglishRefreezeBatchPreimages.json');
const writeFixture = process.argv.includes('--write');
const targets = CLINICAL_ENGLISH_RELEASE_BATCH_ITEMS.map((item) => ({
  kind: item.kind,
  slug: item.slug,
  sourceIds: item.sourceIds,
}));

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
  return {
    checkedAt: Date.now(),
    targets: targetRows,
    reviewerProfiles: await ctx.db.query("parentProfiles")
      .withIndex("by_user", (q) => q.eq("userId", ${JSON.stringify(CLINICAL_ENGLISH_RELEASE_BATCH_REVIEWER.userId)})).take(2),
    batches: await ctx.db.query("clinicalReviewBatches").take(21),
    assignments: await ctx.db.query("clinicalReviewAssignments").take(201),
    receipts: await ctx.db.query("clinicalReviewBatchReceipts").take(21),
  };
`;

const raw = execFileSync('npx', [
  'convex', 'run', '--inline-query', query, '--deployment', deploymentReference,
], {
  cwd: process.cwd(),
  encoding: 'utf8',
  maxBuffer: 100 * 1024 * 1024,
});

type Row = Record<string, any> & { _id: string; _creationTime: number };
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
};

const production = JSON.parse(raw) as Production;
const committedFixture = existsSync(fixturePath) ? JSON.parse(
  readFileSync(fixturePath, 'utf8'),
) as {
  frozenFrom: { gitBase: string };
  frozenAt: number;
  expiresAt: number;
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

function authoredSnapshot(row: Record<string, any>) {
  return {
    type: row.type,
    slug: row.slug,
    ageGroupKey: row.ageGroupKey,
    domainKey: row.domainKey,
    category: row.category,
    titleMm: row.titleMm,
    titleEn: row.titleEn,
    summaryMm: row.summaryMm,
    summaryEn: row.summaryEn,
    tags: row.tags,
    difficulty: row.difficulty,
    durationMinutes: row.durationMinutes,
    offline: row.offline,
    data: row.data,
    source: row.source,
    version: row.version,
  };
}

const advisory = {
  mm: 'အင်္ဂလိပ်စာသည် ရှင်းလင်းပြီး မိဘနားလည်လွယ်သကဲ့သို့ မြန်မာစာနှင့် အဓိပ္ပါယ်ညီမျှကြောင်း စစ်ဆေးပါ။ အသက်အပိုင်းအခြား၊ အရေအတွက်၊ အချိန်ကာလ၊ အရေးပေါ်အဆင့်နှင့် ဘေးကင်းရေးကန့်သတ်ချက်အားလုံးကို မလျှော့မတိုးဘဲ ထိန်းထားပါ။ အဓိပ္ပါယ်ပြောင်းလဲစေမည့် ပြင်ဆင်ချက်လိုပါက approve မလုပ်ဘဲ changes requested ရွေးပါ။',
  en: 'Confirm that the English copy is clear and parent-friendly while remaining meaning-equivalent to the Myanmar copy. Preserve every age band, number, duration, escalation tier, and safety constraint without narrowing or expansion. If a wording correction would change meaning, request changes instead of approving.',
};

const todayIso = new Date(production.checkedAt).toISOString().slice(0, 10);
const items = production.targets.map((snapshot, index) => {
  const prior = CLINICAL_ENGLISH_RELEASE_BATCH_ITEMS[index];
  const corrected = ENGLISH_REFREEZE_CORRECTION_TARGETS[index];
  const content = snapshot.contents[0];
  const link = snapshot.links[0];
  const seed = CONTENT_SEED.find((row) => row.slug === prior.slug) as Record<string, any> | undefined;
  const media = byId(snapshot.media);
  const reviews = byId(snapshot.reviews);
  const allClinical = reviews.filter((row) => row.dimension === 'clinical');
  const currentClinical = allClinical.filter((row) =>
    row.contentVersion === content?.reviewRevision || row.reviewRevision === content?.reviewRevision);
  const allNonclinical = reviews.filter((row) => row.dimension !== 'clinical');
  const nativeMyanmar = reviews.filter((row) => row.dimension === 'native_myanmar');
  const english = reviews.filter((row) => row.dimension === 'english');
  const currentEnglish = english.filter((row) =>
    row.contentVersion === content?.reviewRevision || row.reviewRevision === content?.reviewRevision);
  const sources = snapshot.sources;
  const aiSnapshot = {
    contentAudits: byId(snapshot.contentAudits),
    evidenceAudits: byId(snapshot.evidenceAudits),
    releases: byId(snapshot.releases),
    runs: [],
  };
  const exact = Boolean(
    seed
    && snapshot.contents.length === 1
    && snapshot.links.length === 1
    && content.type === prior.kind
    && content.slug === prior.slug
    && content.reviewRevision === corrected.desiredReviewRevision
    && sha256(authoredSnapshot(content)) === sha256(authoredSnapshot(seed))
    && link.kind === prior.kind
    && link.slug === prior.slug
    && canonicalJson(link.sourceIds) === canonicalJson(prior.sourceIds)
    && sources.length === prior.sourceIds.length
    && canonicalJson(sources.map((source) => source.sourceId)) === canonicalJson(prior.sourceIds)
    && evaluatePublicationEvidence(prior.sourceIds, sources as never[], todayIso).allowed
    && snapshot.media.length <= 50
    && snapshot.reviews.length <= 50
    && snapshot.contentAudits.length <= 50
    && snapshot.evidenceAudits.length <= 50
    && snapshot.releases.length <= 50
    && currentEnglish.length === 0
    && aiSnapshot.contentAudits.length === 0
    && aiSnapshot.evidenceAudits.length === 0
    && aiSnapshot.releases.length === 0
  );
  return {
    exact,
    item: {
      ordinal: index + 1,
      kind: prior.kind,
      slug: prior.slug,
      reviewRevision: content.reviewRevision,
      contentId: String(content._id),
      contentCreationTime: content._creationTime,
      contentUpdatedAt: content.updatedAt,
      contentCanonicalSha256: sha256(content),
      linkId: String(link._id),
      linkCreationTime: link._creationTime,
      linkUpdatedAt: link.updatedAt,
      linkCanonicalSha256: sha256(link),
      sourceIds: [...prior.sourceIds],
      sourceCount: sources.length,
      sourcesCanonicalSha256: sha256(sources),
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
  (row) => row.batchId === CLINICAL_ENGLISH_RELEASE_BATCH_ID,
);
const predecessorReceipts = production.receipts.filter(
  (row) => row.batchId === CLINICAL_ENGLISH_RELEASE_BATCH_ID,
);
const predecessorDecisions = CLINICAL_ENGLISH_RELEASE_BATCH_ITEMS.flatMap((item, index) => {
  const assignment = production.assignments.find((row) => row.batchId === CLINICAL_ENGLISH_RELEASE_BATCH_ID
    && row.contentSlug === item.slug && row.ordinal === item.ordinal);
  if (!assignment) return [];
  return production.targets[index].reviews
    .filter((row) => row.decisionKey === assignment.assignmentId)
    .map((row) => ({
      assignmentId: assignment.assignmentId,
      slug: item.slug,
      kind: item.kind,
      reviewRevision: row.reviewRevision,
      decision: row.decision,
      note: row.note?.trim() || null,
      reviewedAt: row.reviewedAt,
      receiptId: String(row._id),
    }));
});
const predecessorDigest = sha256({
  batchId: CLINICAL_ENGLISH_RELEASE_BATCH_ID,
  freezeDigest: CLINICAL_ENGLISH_RELEASE_BATCH_HASH,
  decisions: predecessorDecisions,
});
const predecessorExact = predecessorBatchRows.length === 1
  && predecessorBatchRows[0].status === 'stopped_changes_requested'
  && predecessorBatchRows[0].freezeDigest === CLINICAL_ENGLISH_RELEASE_BATCH_HASH
  && predecessorBatchRows[0].itemCount === 14
  && predecessorBatchRows[0].completedAt === undefined
  && predecessorReceipts.length === 0
  && predecessorDecisions.length === 2
  && predecessorDecisions.some((decision) => decision.decision === 'changes_requested')
  && predecessorDigest === ENGLISH_REFREEZE_DECISION_SET_DIGEST;

const frozenAt = committedFixture?.frozenAt ?? production.checkedAt;
const expiresAt = committedFixture?.expiresAt ?? (frozenAt + 14 * 24 * 60 * 60 * 1000);
const manifest = {
  batchId,
  count: items.length,
  reviewer: CLINICAL_ENGLISH_RELEASE_BATCH_REVIEWER,
  items: items.map(({ item }) => item),
};
const freezeDigest = sha256(manifest);
const routing = {
  batchId,
  sequence: 9,
  laneGraphVersion: 1,
  dimension: 'english',
  authority: 'release',
  activation: {
    kind: 'after_changes_requested_refreeze',
    previousBatchId: CLINICAL_ENGLISH_RELEASE_BATCH_ID,
    expectedDecisionSetDigest: ENGLISH_REFREEZE_DECISION_SET_DIGEST,
  },
  freezeDigest,
  frozenAt,
  expiresAt,
  reviewerUserId: CLINICAL_ENGLISH_RELEASE_BATCH_REVIEWER.userId,
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
  && sha256(stableIdentity) === CLINICAL_ENGLISH_RELEASE_BATCH_REVIEWER.identityCanonicalSha256
  && predecessorExact
  && activeBatches.length === 0
  && newBatchAbsent
  && globalRegistryUnique
  && production.batches.length === 7
  && production.assignments.length === 58
  && production.receipts.length === 4;
const allExact = snapshotExact && (committedFixture === null || (
  committedFixture.freezeDigest === freezeDigest
  && committedFixture.routingDigest === routingDigest
));

const fixture = {
  frozenFrom: {
    deployment,
    checkedAt: new Date(frozenAt).toISOString(),
    gitBase: committedFixture?.frozenFrom.gitBase
      ?? execFileSync('git', ['rev-parse', 'origin/main'], { encoding: 'utf8' }).trim(),
  },
  batchId,
  frozenAt,
  expiresAt,
  previousBatchId: CLINICAL_ENGLISH_RELEASE_BATCH_ID,
  expectedDecisionSetDigest: ENGLISH_REFREEZE_DECISION_SET_DIGEST,
  reviewer: CLINICAL_ENGLISH_RELEASE_BATCH_REVIEWER,
  items: manifest.items,
  freezeDigest,
  routingDigest,
};

if (writeFixture) {
  if (!allExact) throw new Error('Production English batch snapshot is not exact');
  writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8');
}

console.log(JSON.stringify({
  allExact,
  checkedAt: fixture.frozenFrom.checkedAt,
  expiresAt: new Date(expiresAt).toISOString(),
  items: items.map(({ exact, item }) => ({
    ordinal: item.ordinal,
    slug: item.slug,
    revision: item.reviewRevision,
    exact,
  })),
  predecessor: {
    exact: predecessorExact,
    decisionCount: predecessorDecisions.length,
    decisionSetDigest: predecessorDigest,
  },
  freezeDigest,
  routingDigest,
  counts: {
    batches: production.batches.length,
    assignments: production.assignments.length,
    receipts: production.receipts.length,
    activeBatches: activeBatches.length,
  },
  wroteFixture: writeFixture && allExact,
}, null, 2));
