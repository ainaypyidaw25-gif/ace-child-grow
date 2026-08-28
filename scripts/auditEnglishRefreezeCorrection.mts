import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CONTENT_SEED } from '../src/content/seed/index.ts';
import {
  CLINICAL_ENGLISH_RELEASE_BATCH_HASH,
  CLINICAL_ENGLISH_RELEASE_BATCH_ID,
  CLINICAL_ENGLISH_RELEASE_BATCH_ITEMS,
} from '../convex/lib/clinicalReviewBatchData.ts';

const deployment = 'graceful-possum-566';
const deploymentReference = 'hotel-ace-groups-of-company:ace-child-grow:prod';
const releaseAction = 'release.english_14_refreeze_correction';
const fixturePath = resolve(
  process.cwd(),
  'convex/lib/englishRefreezeCorrectionPreimages.json',
);
const writeFixture = process.argv.includes('--write');

const targets = CLINICAL_ENGLISH_RELEASE_BATCH_ITEMS.map((item) => ({
  kind: item.kind,
  slug: item.slug,
  sourceIds: item.sourceIds,
  reviewRevision: item.reviewRevision,
  contentUpdatedAt: item.contentUpdatedAt,
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
      .withIndex("by_content", (q) => q.eq("contentSlug", target.slug)).take(101);
    const reviews = await ctx.db.query("contentReviews")
      .withIndex("by_content", (q) => q.eq("contentSlug", target.slug)).take(101);
    const contentAudits = await ctx.db.query("aiContentAudits")
      .withIndex("by_content_revision_and_updated_at", (q) => q
        .eq("contentSlug", target.slug)).take(101);
    const releases = await ctx.db.query("aiPublicationReleases")
      .withIndex("by_target_key", (q) => q.eq("targetKey", target.kind + ":" + target.slug)).take(101);
    const sources = [];
    const evidenceAudits = [];
    for (const sourceId of target.sourceIds) {
      const sourceRows = await ctx.db.query("evidenceSources")
        .withIndex("by_source_id", (q) => q.eq("sourceId", sourceId)).take(2);
      sources.push(...sourceRows);
      for (const source of sourceRows) {
        evidenceAudits.push(...await ctx.db.query("aiEvidenceAudits")
          .withIndex("by_source_and_updated_at", (q) => q
            .eq("sourceId", source.sourceId).eq("sourceUpdatedAt", source.updatedAt)).take(101));
      }
    }
    targetRows.push({ contents, links, media, reviews, contentAudits, releases, sources, evidenceAudits });
  }
  return {
    targets: targetRows,
    batches: await ctx.db.query("clinicalReviewBatches").take(21),
    assignments: await ctx.db.query("clinicalReviewAssignments").take(101),
    receipts: await ctx.db.query("clinicalReviewBatchReceipts").take(21),
    releaseAudits: await ctx.db.query("auditLogs")
      .withIndex("by_action", (q) => q.eq("action", ${JSON.stringify(releaseAction)})).take(2),
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
  batches: Row[];
  assignments: Row[];
  receipts: Row[];
  releaseAudits: Row[];
};

const production = JSON.parse(raw) as Production;

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

function diffPaths(left: unknown, right: unknown, prefix = ''): string[] {
  if (left === undefined || right === undefined) {
    return left === right ? [] : [prefix];
  }
  if (canonicalJson(left) === canonicalJson(right)) return [];
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return [prefix];
  const leftObject = left as Record<string, unknown>;
  const rightObject = right as Record<string, unknown>;
  const keys = new Set([...Object.keys(leftObject), ...Object.keys(rightObject)]);
  return [...keys].flatMap((key) => diffPaths(
    leftObject[key],
    rightObject[key],
    prefix ? `${prefix}.${key}` : key,
  ));
}

const expectedNutritionDiffs = [
  'data.title.mm',
  'data.why.mm',
  'summaryMm',
  'titleMm',
] as const;

const targetSnapshots = production.targets.map((snapshot, index) => {
  const item = CLINICAL_ENGLISH_RELEASE_BATCH_ITEMS[index];
  const desired = CONTENT_SEED.find((row) => row.slug === item.slug) as Record<string, any> | undefined;
  const content = snapshot.contents[0];
  const link = snapshot.links[0];
  const reviews = byId(snapshot.reviews);
  const priorReviews = reviews.filter((row) => row.clinicalReviewBatchId !== CLINICAL_ENGLISH_RELEASE_BATCH_ID);
  const batchDecisions = reviews.filter((row) => row.clinicalReviewBatchId === CLINICAL_ENGLISH_RELEASE_BATCH_ID);
  const allClinical = priorReviews.filter((row) => row.dimension === 'clinical');
  const currentClinical = allClinical.filter((row) =>
    row.contentVersion === item.reviewRevision || row.reviewRevision === item.reviewRevision);
  const allNonclinical = reviews.filter((row) => row.dimension !== 'clinical');
  const englishHistory = reviews.filter((row) => row.dimension === 'english');
  const media = byId(snapshot.media);
  const aiSnapshot = {
    contentAudits: byId(snapshot.contentAudits),
    evidenceAudits: byId(snapshot.evidenceAudits),
    releases: byId(snapshot.releases),
    runs: [],
  };
  const sourceRows = snapshot.sources;
  const desiredDiffs = desired && content
    ? diffPaths(authoredSnapshot(content), authoredSnapshot(desired)).sort()
    : ['missing'];
  const expectedPriorDigests = new Map(item.upstreamReviewDigests.map((entry) => [entry.dimension, entry.digest]));
  const expectedDecision = item.slug === 'act_skin_to_skin_calm'
    ? 'approved'
    : item.slug === 'gd_5_6m_nutrition'
      ? 'changes_requested'
      : null;
  const exact = Boolean(
    desired
    && snapshot.contents.length === 1
    && snapshot.links.length === 1
    && String(content._id) === item.contentId
    && content._creationTime === item.contentCreationTime
    && content.updatedAt === item.contentUpdatedAt
    && content.reviewRevision === item.reviewRevision
    && sha256(content) === item.contentCanonicalSha256
    && String(link._id) === item.linkId
    && link._creationTime === item.linkCreationTime
    && link.updatedAt === item.linkUpdatedAt
    && sha256(link) === item.linkCanonicalSha256
    && canonicalJson(link.sourceIds) === canonicalJson(item.sourceIds)
    && sourceRows.length === item.sourceCount
    && sha256(sourceRows) === item.sourcesCanonicalSha256
    && media.length === item.mediaCount
    && sha256(media) === item.mediaCanonicalSha256
    && sha256(aiSnapshot) === item.aiCanonicalSha256
    && priorReviews.length < 100
    && sha256(priorReviews) === expectedPriorDigests.get('all_review_history')
    && currentClinical.length === item.currentClinicalReviewCount
    && sha256(currentClinical) === item.currentClinicalReviewsCanonicalSha256
    && sha256(allClinical) === item.allClinicalReviewHistoryCanonicalSha256
    && (expectedDecision === null
      ? batchDecisions.length === 0
      : batchDecisions.length === 1
        && batchDecisions[0].decision === expectedDecision
        && batchDecisions[0].decisionKey
        && batchDecisions[0].decisionKey === snapshotDecisionKey(item.slug, production.assignments))
    && (item.slug === 'gd_5_6m_nutrition'
      ? canonicalJson(desiredDiffs) === canonicalJson(expectedNutritionDiffs)
      : desiredDiffs.length === 0)
  );
  return {
    kind: item.kind,
    slug: item.slug,
    desiredReviewRevision: item.reviewRevision + 1,
    desiredAuthoredCanonicalSha256: sha256(authoredSnapshot(desired ?? {})),
    desiredSearchTextCanonicalSha256: sha256(desired?.searchText ?? null),
    exact,
    desiredDiffs,
    content,
    link,
    sources: sourceRows,
    media,
    reviews,
    ai: aiSnapshot,
    history: {
      allReviewHistoryCanonicalSha256: sha256(reviews),
      allNonclinicalHistoryCanonicalSha256: sha256(allNonclinical),
      englishHistoryCanonicalSha256: sha256(englishHistory),
      currentClinicalReviewsCanonicalSha256: sha256(currentClinical),
      allClinicalReviewHistoryCanonicalSha256: sha256(allClinical),
    },
  };
});

function snapshotDecisionKey(slug: string, assignments: Row[]): string | undefined {
  return assignments.find((row) =>
    row.batchId === CLINICAL_ENGLISH_RELEASE_BATCH_ID && row.contentSlug === slug)?.assignmentId;
}

const batches = byId(production.batches);
const assignments = byId(production.assignments);
const receipts = byId(production.receipts);
const seq8Assignments = assignments.filter((row) => row.batchId === CLINICAL_ENGLISH_RELEASE_BATCH_ID);
const seq8Batch = batches.find((row) => row.batchId === CLINICAL_ENGLISH_RELEASE_BATCH_ID);
const decisions = targetSnapshots.flatMap((target) => target.reviews
  .filter((row) => row.clinicalReviewBatchId === CLINICAL_ENGLISH_RELEASE_BATCH_ID)
  .map((row) => ({
    assignmentId: row.decisionKey,
    slug: target.slug,
    kind: target.kind,
    reviewRevision: row.reviewRevision,
    decision: row.decision,
    note: row.note?.trim() || null,
    reviewedAt: row.reviewedAt,
    receiptId: String(row._id),
  })));
const decisionSetDigest = sha256({
  batchId: CLINICAL_ENGLISH_RELEASE_BATCH_ID,
  freezeDigest: seq8Batch?.freezeDigest,
  decisions,
});

const registry = {
  batches,
  assignments,
  receipts,
  batchesCanonicalSha256: sha256(batches),
  assignmentsCanonicalSha256: sha256(assignments),
  receiptsCanonicalSha256: sha256(receipts),
};

const allExact = targetSnapshots.every((target) => target.exact)
  && batches.length === 7
  && assignments.length === 58
  && receipts.length === 4
  && registry.batchesCanonicalSha256 === '75a7ac150eb87399b3720f12c4cae47b88d3ab55ebfadd2e6c41da53756be944'
  && registry.assignmentsCanonicalSha256 === '79c327c5c258c7173d3ae8ebede4369a4dd24db86f776f0d0d791e521adc3dcb'
  && registry.receiptsCanonicalSha256 === 'd437117c52e26f67b8fe4901f45ba40d6db0ef330c16e94524860e8cfa847208'
  && seq8Batch?.status === 'stopped_changes_requested'
  && seq8Batch.freezeDigest === CLINICAL_ENGLISH_RELEASE_BATCH_HASH
  && seq8Assignments.length === 14
  && decisions.length === 2
  && decisions[0]?.slug === 'act_skin_to_skin_calm'
  && decisions[0]?.decision === 'approved'
  && decisions[1]?.slug === 'gd_5_6m_nutrition'
  && decisions[1]?.decision === 'changes_requested'
  && decisions[1]?.note === 'ဖြည့်စွက်စာ (စတင်ကျွေးခြင်း / စတင်ခြင်း) — အသင့်တော်ဆုံးနှင့် အသုံးအများဆုံး အသုံးအနှုန်း ဖြစ်ပါသည်။'
  && decisionSetDigest === 'e53afb11c4b507c9d621ab75905daec7825685a49d59ce763ef417c116275e0d'
  && production.releaseAudits.length === 0;

const fixture = {
  frozenFrom: {
    deployment,
    checkedAt: new Date().toISOString(),
    gitBase: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  },
  releaseAction,
  decisionSetDigest,
  targets: targetSnapshots.map(({ exact: _exact, desiredDiffs: _diffs, ...target }) => target),
  registry: {
    batches,
    assignments,
    receipts,
  },
  releaseAudits: production.releaseAudits,
};
const fixtureSha256 = sha256(fixture);

if (writeFixture) {
  if (!allExact) throw new Error('Production preimage is not exact; fixture was not written');
  writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8');
}

console.log(JSON.stringify({
  allExact,
  checkedAt: fixture.frozenFrom.checkedAt,
  counts: {
    targets: targetSnapshots.length,
    exactTargets: targetSnapshots.filter((target) => target.exact).length,
    batches: batches.length,
    assignments: assignments.length,
    receipts: receipts.length,
    decisions: decisions.length,
    releaseAudits: production.releaseAudits.length,
  },
  decisionSetDigest,
  fixtureSha256,
  registryHashes: {
    batches: registry.batchesCanonicalSha256,
    assignments: registry.assignmentsCanonicalSha256,
    receipts: registry.receiptsCanonicalSha256,
  },
  targetSummaries: targetSnapshots.map((target) => ({
    slug: target.slug,
    exact: target.exact,
    desiredDiffs: target.desiredDiffs,
    reviewRows: target.reviews.length,
    nextReviewRevision: target.desiredReviewRevision,
  })),
  wroteFixture: writeFixture && allExact,
}, null, 2));
