import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CONTENT_SEED } from '../src/content/seed/index.ts';
import { EVIDENCE_LINKS } from '../src/evidence/links.ts';
import { evaluatePublicationEvidence } from '../convex/lib/evidencePublicationGate.ts';
import {
  CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_HASH,
  CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_ID,
  CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_ITEMS,
} from '../convex/lib/clinicalChildDevelopmentBatchData.ts';

const deployment = 'graceful-possum-566';
const deploymentReference = 'hotel-ace-groups-of-company:ace-child-grow:prod';
const releaseAction = 'release.child_development_14_refreeze_correction';
const decisionSetDigestExpected =
  '2da5ddfecc5e2815c132f5520cf27df27ea76bfdc151e64c6f489c9e384f803f';
const approvedSourceId = 'cdc-positive-parenting-toddlers-2-3-2026';
const fixturePath = resolve(
  process.cwd(),
  'convex/lib/childDevelopmentRefreezeCorrectionPreimages.json',
);
const desiredPath = resolve(
  process.cwd(),
  'convex/lib/childDevelopmentRefreezeCorrectionDesired.json',
);
const writeFixture = process.argv.includes('--write');
const committedFixture = existsSync(fixturePath)
  ? JSON.parse(readFileSync(fixturePath, 'utf8')) as Record<string, unknown>
  : null;
const committedDesired = existsSync(desiredPath)
  ? JSON.parse(readFileSync(desiredPath, 'utf8')) as Record<string, unknown>
  : null;

const targets = CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_ITEMS.map((item) => {
  const desiredLink = EVIDENCE_LINKS.find((link) => (
    link.kind === item.kind && link.slug === item.slug
  ));
  if (!desiredLink) throw new Error(`Missing desired evidence link: ${item.kind}:${item.slug}`);
  return {
    kind: item.kind,
    slug: item.slug,
    desiredSourceIds: desiredLink.sourceIds,
  };
});

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
      .withIndex("by_content", (q) => q.eq("contentSlug", target.slug)).take(201);
    const contentAudits = await ctx.db.query("aiContentAudits")
      .withIndex("by_content_revision_and_updated_at", (q) => q.eq("contentSlug", target.slug))
      .take(101);
    const releases = await ctx.db.query("aiPublicationReleases")
      .withIndex("by_target_key", (q) => q.eq("targetKey", target.kind + ":" + target.slug))
      .take(101);
    const sourceIds = Array.from(new Set([...(links[0]?.sourceIds ?? []), ...target.desiredSourceIds]));
    const sources = [];
    const evidenceAudits = [];
    for (const sourceId of sourceIds) {
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
  const approvedSources = await ctx.db.query("evidenceSources")
    .withIndex("by_source_id", (q) => q.eq("sourceId", ${JSON.stringify(approvedSourceId)})).take(2);
  const sourceApprovalAudits = await ctx.db.query("auditLogs")
    .withIndex("by_action_and_entity_table_and_entity_id_and_result", (q) => q
      .eq("action", "evidence.setReview")
      .eq("entityTable", "evidenceSources")
      .eq("entityId", ${JSON.stringify(approvedSourceId)})
      .eq("result", "ok")).take(2);
  const sourceReviewerProfiles = [];
  for (const source of approvedSources) {
    if (source.reviewerId) {
      sourceReviewerProfiles.push(...await ctx.db.query("parentProfiles")
        .withIndex("by_user", (q) => q.eq("userId", source.reviewerId)).take(2));
    }
  }
  return {
    checkedAt: Date.now(),
    targets: targetRows,
    approvedSources,
    sourceApprovalAudits,
    sourceReviewerProfiles,
    batches: await ctx.db.query("clinicalReviewBatches").take(31),
    assignments: await ctx.db.query("clinicalReviewAssignments").take(151),
    receipts: await ctx.db.query("clinicalReviewBatchReceipts").take(31),
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

type Row = Record<string, unknown> & { _id: string; _creationTime: number };
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
  approvedSources: Row[];
  sourceApprovalAudits: Row[];
  sourceReviewerProfiles: Row[];
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

function authoredSnapshot(row: Record<string, unknown>) {
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
  if (Object.is(left, right)) return [];
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right)) return [prefix];
    const length = Math.max(left.length, right.length);
    return Array.from({ length }, (_, index) => diffPaths(
      left[index], right[index], prefix ? `${prefix}.${index}` : String(index),
    )).flat();
  }
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return [prefix];
  const leftObject = left as Record<string, unknown>;
  const rightObject = right as Record<string, unknown>;
  return [...new Set([...Object.keys(leftObject), ...Object.keys(rightObject)])]
    .flatMap((key) => diffPaths(
      leftObject[key], rightObject[key], prefix ? `${prefix}.${key}` : key,
    ));
}

const expectedSemanticSlugs = new Set([
  'gd_10_12m_nutrition',
  'gd_13_18m_safety',
  'gd_2y_safety',
  'gd_2_5y_safety',
]);
const expectedLinkSlugs = new Set(['gd_2y_safety', 'gd_2_5y_safety']);
const expectedAuthoredDiffs = new Map<string, string[]>([
  ['gd_10_12m_nutrition', [
    'data.dailyActivities.0.en',
    'data.dailyActivities.0.mm',
    'data.parentTips.0.mm',
  ]],
  ['gd_13_18m_safety', [
    'data.why.en',
    'data.why.mm',
    'summaryEn',
    'summaryMm',
  ]],
  ['gd_2y_safety', [
    'data.why.en',
    'data.why.mm',
    'summaryEn',
    'summaryMm',
  ]],
  ['gd_2_5y_safety', [
    'data.dailyActivities.0.en',
    'data.dailyActivities.0.mm',
    'data.indoor.0.en',
    'data.indoor.0.mm',
    'data.outdoor.0.en',
    'data.outdoor.0.mm',
  ]],
]);
const todayIso = new Date(production.checkedAt).toISOString().slice(0, 10);

const targetSnapshots = production.targets.map((snapshot, index) => {
  const item = CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_ITEMS[index];
  const desiredContent = CONTENT_SEED.find((row) => row.slug === item.slug) as Row | undefined;
  const desiredLink = EVIDENCE_LINKS.find((row) => (
    row.kind === item.kind && row.slug === item.slug
  ));
  const content = snapshot.contents[0];
  const link = snapshot.links[0];
  const reviews = byId(snapshot.reviews);
  const media = byId(snapshot.media);
  const sources = [...snapshot.sources].sort((left, right) =>
    String(left.sourceId).localeCompare(String(right.sourceId)));
  const ai = {
    contentAudits: byId(snapshot.contentAudits),
    evidenceAudits: byId(snapshot.evidenceAudits),
    releases: byId(snapshot.releases),
    runs: [],
  };
  const authoredDiffs = desiredContent && content
    ? diffPaths(authoredSnapshot(content), authoredSnapshot(desiredContent)).sort()
    : ['missing'];
  const linkDiffs = desiredLink && link
    ? diffPaths(
      { kind: link.kind, slug: link.slug, sourceIds: link.sourceIds },
      desiredLink,
    ).sort()
    : ['missing'];
  const sourceById = new Map(sources.map((source) => [source.sourceId, source]));
  const desiredSources = desiredLink?.sourceIds.map((sourceId) => sourceById.get(sourceId)) ?? [];
  const sourcesUnique = sources.length === new Set(sources.map((source) => source.sourceId)).size;
  const exact = Boolean(
    desiredContent
    && desiredLink
    && snapshot.contents.length === 1
    && snapshot.links.length === 1
    && snapshot.media.length <= 100
    && snapshot.reviews.length <= 200
    && snapshot.contentAudits.length <= 100
    && snapshot.evidenceAudits.length <= 100
    && snapshot.releases.length <= 100
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
    && sourcesUnique
    && desiredSources.length === desiredLink.sourceIds.length
    && evaluatePublicationEvidence(desiredLink.sourceIds, desiredSources as never[], todayIso).allowed
    && canonicalJson(authoredDiffs) === canonicalJson(expectedAuthoredDiffs.get(item.slug) ?? [])
    && (expectedLinkSlugs.has(item.slug)
      ? canonicalJson(linkDiffs) === canonicalJson(['sourceIds.2'])
      : linkDiffs.length === 0)
  );
  return {
    exact,
    authoredDiffs,
    linkDiffs,
    desiredContent,
    desiredLink,
    target: {
      kind: item.kind,
      slug: item.slug,
      desiredReviewRevision: item.reviewRevision + 1,
      desiredAuthoredCanonicalSha256: sha256(authoredSnapshot(desiredContent ?? {})),
      desiredSearchTextCanonicalSha256: sha256(desiredContent?.searchText ?? null),
      desiredLinkSourceIdsCanonicalSha256: sha256(desiredLink?.sourceIds ?? null),
      content,
      link,
      sources,
      media,
      reviews,
      ai,
      history: {
        allReviewHistoryCanonicalSha256: sha256(reviews),
        allNonclinicalHistoryCanonicalSha256: sha256(
          reviews.filter((row) => row.dimension !== 'clinical'),
        ),
        childDevelopmentHistoryCanonicalSha256: sha256(
          reviews.filter((row) => row.dimension === 'child_development'),
        ),
        currentClinicalReviewsCanonicalSha256: sha256(
          reviews.filter((row) => row.dimension === 'clinical'
            && (row.contentVersion === item.reviewRevision
              || row.reviewRevision === item.reviewRevision)),
        ),
        allClinicalReviewHistoryCanonicalSha256: sha256(
          reviews.filter((row) => row.dimension === 'clinical'),
        ),
      },
    },
  };
});

const batches = byId(production.batches);
const assignments = byId(production.assignments);
const receipts = byId(production.receipts);
const predecessorBatch = batches.find(
  (row) => row.batchId === CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_ID,
);
const predecessorAssignments = assignments.filter(
  (row) => row.batchId === CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_ID,
);
const decisions = targetSnapshots.flatMap(({ target }) => {
  const assignment = predecessorAssignments.find((row) => row.contentSlug === target.slug);
  if (!assignment) return [];
  const rows = target.reviews.filter((row) => row.decisionKey === assignment.assignmentId);
  if (rows.length !== 1) return rows.length > 1 ? [{ duplicate: assignment.assignmentId }] : [];
  const row = rows[0];
  return [{
    assignmentId: assignment.assignmentId,
    slug: target.slug,
    kind: target.kind,
    reviewRevision: row.reviewRevision,
    decision: row.decision,
    note: row.note?.trim() || null,
    reviewedAt: row.reviewedAt,
    receiptId: String(row._id),
  }];
});
const decisionSetDigest = predecessorBatch ? sha256({
  batchId: CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_ID,
  freezeDigest: predecessorBatch.freezeDigest,
  decisions,
}) : null;

const sourceApproval = {
  source: production.approvedSources[0],
  audit: production.sourceApprovalAudits[0],
  reviewerProfile: production.sourceReviewerProfiles[0],
};
const sourceApprovalExact = production.approvedSources.length === 1
  && production.sourceApprovalAudits.length === 1
  && production.sourceReviewerProfiles.length === 1
  && sourceApproval.source.sourceId === approvedSourceId
  && sourceApproval.source.reviewStatus === 'approved'
  && sourceApproval.source.reviewer === 'Phyo Ko Ko'
  && sourceApproval.source.reviewerQualification === 'MBBS'
  && sourceApproval.source.reviewDate === '2026-08-31'
  && sourceApproval.source.reviewScope === 'education'
  && sourceApproval.source.reviewNote === undefined
  && String(sourceApproval.source.reviewerId) === String(sourceApproval.audit.actorId)
  && sourceApproval.audit.action === 'evidence.setReview'
  && sourceApproval.audit.entityTable === 'evidenceSources'
  && sourceApproval.audit.entityId === approvedSourceId
  && sourceApproval.audit.result === 'ok'
  && sourceApproval.audit.before === 'awaiting_review / no reviewer / no date'
  && sourceApproval.audit.after === 'approved / Phyo Ko Ko (MBBS) / 2026-08-31'
  && sourceApproval.audit.summary === 'awaiting_review → approved by Phyo Ko Ko (MBBS)'
  && String(sourceApproval.reviewerProfile.userId) === String(sourceApproval.source.reviewerId)
  && sourceApproval.reviewerProfile.isStaff === true
  && sourceApproval.reviewerProfile.staffRole === 'clinical_reviewer'
  && sourceApproval.reviewerProfile.displayName === 'Phyo Ko Ko'
  && sourceApproval.reviewerProfile.staffQualification === 'MBBS';

const registry = { batches, assignments, receipts };
const allExact = targetSnapshots.every((snapshot) => snapshot.exact)
  && expectedSemanticSlugs.size === targetSnapshots.filter(
    (snapshot) => snapshot.authoredDiffs.length > 0,
  ).length
  && batches.length === 9
  && assignments.length === 86
  && receipts.length === 5
  && predecessorBatch?.status === 'stopped_changes_requested'
  && predecessorBatch.freezeDigest === CLINICAL_CHILD_DEVELOPMENT_RELEASE_BATCH_HASH
  && predecessorBatch.itemCount === 14
  && predecessorAssignments.length === 14
  && decisions.length === 11
  && decisionSetDigest === decisionSetDigestExpected
  && sourceApprovalExact
  && production.releaseAudits.length === 0;

const desired = {
  content: targetSnapshots.map((snapshot) => snapshot.desiredContent),
  links: targetSnapshots.map((snapshot) => snapshot.desiredLink),
};
const fixture = {
  frozenFrom: {
    deployment,
    checkedAt: new Date(production.checkedAt).toISOString(),
    gitBase: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  },
  releaseAction,
  decisionSetDigest,
  targets: targetSnapshots.map((snapshot) => snapshot.target),
  registry,
  sourceApproval,
  releaseAudits: production.releaseAudits,
};
const committedFixtureSha256 = committedFixture ? sha256(committedFixture) : null;
const committedDesiredSha256 = committedDesired ? sha256(committedDesired) : null;
const liveMatchesCommitted = Boolean(committedFixture
  && canonicalJson(committedFixture.targets) === canonicalJson(fixture.targets)
  && canonicalJson(committedFixture.registry) === canonicalJson(fixture.registry)
  && canonicalJson(committedFixture.sourceApproval) === canonicalJson(fixture.sourceApproval)
  && canonicalJson(committedFixture.releaseAudits) === canonicalJson(fixture.releaseAudits));
const desiredMatchesCommitted = Boolean(committedDesired
  && canonicalJson(committedDesired) === canonicalJson(desired));

if (writeFixture) {
  if (!allExact) throw new Error('Production preimage is not exact; fixtures were not written');
  writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8');
  writeFileSync(desiredPath, `${JSON.stringify(desired, null, 2)}\n`, 'utf8');
}

// eslint-disable-next-line no-console -- this CLI audit emits its machine-readable result
console.log(JSON.stringify({
  allExact,
  checkedAt: fixture.frozenFrom.checkedAt,
  counts: {
    targets: targetSnapshots.length,
    exactTargets: targetSnapshots.filter((snapshot) => snapshot.exact).length,
    semanticTargets: targetSnapshots.filter((snapshot) => snapshot.authoredDiffs.length > 0).length,
    linkTargets: targetSnapshots.filter((snapshot) => snapshot.linkDiffs.length > 0).length,
    batches: batches.length,
    assignments: assignments.length,
    receipts: receipts.length,
    decisions: decisions.length,
    sourceApprovalAudits: production.sourceApprovalAudits.length,
    releaseAudits: production.releaseAudits.length,
  },
  sourceApprovalExact,
  decisionSetDigest,
  candidateFixtureSha256: sha256(fixture),
  candidateDesiredSha256: sha256(desired),
  committedFixtureSha256,
  committedDesiredSha256,
  liveMatchesCommitted,
  desiredMatchesCommitted,
  targetSummaries: targetSnapshots.map((snapshot) => ({
    slug: snapshot.target.slug,
    exact: snapshot.exact,
    authoredDiffs: snapshot.authoredDiffs,
    linkDiffs: snapshot.linkDiffs,
    nextReviewRevision: snapshot.target.desiredReviewRevision,
  })),
  wroteFixture: writeFixture && allExact,
}, null, 2));
