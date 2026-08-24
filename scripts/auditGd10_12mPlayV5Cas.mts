import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import frozenPreimages from '../convex/lib/gd10_12mPlayV5CasPreimages.json';
import { evaluatePublicationEvidence } from '../convex/lib/evidencePublicationGate.ts';
import { todayIsoUtc } from '../convex/lib/evidenceFreshness.ts';
import { CONTENT_SEED } from '../src/content/seed/index.ts';
import { EVIDENCE_LINKS } from '../src/evidence/links.ts';

const deployment = 'graceful-possum-566';
const target = { kind: 'guide', slug: 'gd_10_12m_play' } as const;

const query = `
  const target = ${JSON.stringify(target)};
  const contents = await ctx.db.query("libraryContent")
    .withIndex("by_slug", (q) => q.eq("slug", target.slug)).take(2);
  const links = await ctx.db.query("evidenceLinks")
    .withIndex("by_kind_slug", (q) => q.eq("kind", target.kind).eq("slug", target.slug)).take(2);
  const media = await ctx.db.query("libraryMedia")
    .withIndex("by_content", (q) => q.eq("contentSlug", target.slug)).take(101);
  const reviews = await ctx.db.query("contentReviews")
    .withIndex("by_content", (q) => q.eq("contentSlug", target.slug)).take(501);
  const contentAudits = await ctx.db.query("aiContentAudits")
    .withIndex("by_content_revision_and_updated_at", (q) => q.eq("contentSlug", target.slug)).take(101);
  const releases = await ctx.db.query("aiPublicationReleases")
    .withIndex("by_target_key", (q) => q.eq("targetKey", target.kind + ":" + target.slug)).take(101);
  const sourceIds = [...new Set([
    ...links.flatMap((row) => row.sourceIds),
    "cpsc-childproofing-home-2023",
    "hc-choking-prevention-2026",
  ])];
  const sources = [];
  const evidenceAudits = [];
  for (const sourceId of sourceIds) {
    sources.push(...await ctx.db.query("evidenceSources")
      .withIndex("by_source_id", (q) => q.eq("sourceId", sourceId)).take(2));
    evidenceAudits.push(...await ctx.db.query("aiEvidenceAudits")
      .withIndex("by_source_and_updated_at", (q) => q.eq("sourceId", sourceId)).take(101));
  }
  const allLinks = await ctx.db.query("evidenceLinks").take(5001);
  const runIds = [...new Set([
    ...contentAudits.map((row) => row.runId),
    ...evidenceAudits.map((row) => row.runId),
    ...releases.flatMap((row) => [
      row.contentAuditRunId,
      ...row.sourceSnapshots.map((source) => source.evidenceAuditRunId),
    ]),
  ])];
  const runs = [];
  for (const runId of runIds) {
    runs.push(...await ctx.db.query("aiAuditRuns")
      .withIndex("by_run_id", (q) => q.eq("runId", runId)).take(2));
  }
  const releaseAudits = await ctx.db.query("auditLogs")
    .withIndex("by_action", (q) => q.eq("action", "release.gd_10_12m_play_safety_v5"))
    .take(2);
  return {
    contents, links, media, reviews, contentAudits, releases, sources,
    evidenceAudits, runs, allLinks, releaseAudits,
  };
`;

const raw = execFileSync('npx', [
  'convex', 'run', '--inline-query', query, '--deployment', deployment,
], {
  cwd: process.cwd(),
  encoding: 'utf8',
  maxBuffer: 100 * 1024 * 1024,
});

const production = JSON.parse(raw) as Record<string, Array<Record<string, any>>>;

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
  return [...rows].sort((left, right) => String(left._id ?? '').localeCompare(String(right._id ?? '')));
}

function exactRow(row: Record<string, any>) {
  return {
    rowId: String(row._id),
    creationTime: row._creationTime,
    exactCanonicalSha256: sha256(row),
  };
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
    searchText: row.searchText,
  };
}

const content = production.contents[0] ?? {};
const link = production.links[0] ?? {};
const desired = CONTENT_SEED.find((row) => row.slug === target.slug) as Record<string, any> | undefined;
const desiredLink = EVIDENCE_LINKS.find((row) => row.kind === target.kind && row.slug === target.slug);
const reviews = byId(production.reviews);
const currentReviews = reviews.filter((row) =>
  row.contentVersion === content.reviewRevision || row.reviewRevision === content.reviewRevision);
const media = byId(production.media);
const sources = byId(production.sources);
const contentAudits = byId(production.contentAudits);
const evidenceAudits = byId(production.evidenceAudits);
const releases = byId(production.releases);
const runs = byId(production.runs);
const aiSnapshot = { contentAudits, evidenceAudits, releases, runs };
const desiredSourceIds = [
  'aap-power-of-play-2018',
  'who-care-for-child-development-2012',
  'unicef-early-moments-2017',
  'tb-bright-futures-4e-2017',
  'aap-drowning-2021',
  'cpsc-childproofing-home-2023',
  'hc-choking-prevention-2026',
] as const;

const frozen = frozenPreimages as Record<string, any>;

const result = {
  frozenFrom: {
    deployment,
    checkedAt: new Date().toISOString(),
    gitBase: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  },
  counts: {
    contents: production.contents.length,
    links: production.links.length,
    sources: production.sources.length,
    reviews: reviews.length,
    currentReviews: currentReviews.length,
    media: media.length,
    contentAudits: contentAudits.length,
    evidenceAudits: evidenceAudits.length,
    releases: releases.length,
    runs: runs.length,
    releaseAudits: production.releaseAudits.length,
    allLinks: production.allLinks.length,
    allLinksWithinBound: production.allLinks.length <= 5000,
  },
  content: {
    ...exactRow(content),
    createdAt: content.createdAt ?? null,
    updatedAt: content.updatedAt ?? null,
    reviewRevision: content.reviewRevision ?? null,
    clinicalStatus: content.clinicalStatus ?? null,
    authoredCanonicalSha256: sha256(authoredSnapshot(content)),
    localAuthoredCanonicalSha256: sha256(authoredSnapshot(desired ?? {})),
    dataCanonicalSha256: sha256(content.data ?? null),
    searchTextCanonicalSha256: sha256(content.searchText ?? null),
  },
  link: {
    ...exactRow(link),
    createdAt: link.createdAt ?? null,
    updatedAt: link.updatedAt ?? null,
    sourceIds: link.sourceIds ?? [],
    localSourceIds: desiredLink?.sourceIds ?? [],
  },
  sources: sources.map((row) => ({
    sourceId: row.sourceId,
    ...exactRow(row),
    reviewStatus: row.reviewStatus ?? null,
    reviewScope: row.reviewScope ?? null,
    reviewDate: row.reviewDate ?? null,
    nextReviewDate: row.nextReviewDate ?? null,
    updatedAt: row.updatedAt ?? null,
  })),
  allReviews: reviews.map(exactRow),
  allReviewsCanonicalSha256: sha256(reviews),
  revision4Reviews: currentReviews.map(exactRow),
  revision4ReviewsCanonicalSha256: sha256(currentReviews),
  media: media.map(exactRow),
  mediaCanonicalSha256: sha256(media),
  ai: {
    contentAudits: contentAudits.map(exactRow),
    evidenceAudits: evidenceAudits.map(exactRow),
    releases: releases.map(exactRow),
    runs: runs.map(exactRow),
    canonicalSha256: sha256(aiSnapshot),
  },
  reverseDependencies: [...new Set([
    ...(link.sourceIds ?? []),
    ...desiredSourceIds,
  ])].map((sourceId: string) => {
    const rows = byId(production.allLinks.filter((row) => row.sourceIds.includes(sourceId)));
    return {
      sourceId,
      keys: rows.map((row) => `${row.kind}:${row.slug}`),
      rows: rows.map(exactRow),
      canonicalSha256: sha256(rows),
    };
  }),
};

function diffPaths(before: unknown, after: unknown, path = ''): Array<{
  path: string;
  before: unknown;
  after: unknown;
}> {
  if (before === undefined || after === undefined) {
    return before === after ? [] : [{ path, before, after }];
  }
  if (canonicalJson(before) === canonicalJson(after)) return [];
  if (Array.isArray(before) && Array.isArray(after)) {
    const size = Math.max(before.length, after.length);
    return Array.from({ length: size }, (_, index) =>
      diffPaths(before[index], after[index], `${path}[${index}]`)).flat();
  }
  if (before && after && typeof before === 'object' && typeof after === 'object'
    && !Array.isArray(before) && !Array.isArray(after)) {
    const keys = [...new Set([
      ...Object.keys(before as Record<string, unknown>),
      ...Object.keys(after as Record<string, unknown>),
    ])].sort();
    return keys.flatMap((key) => diffPaths(
      (before as Record<string, unknown>)[key],
      (after as Record<string, unknown>)[key],
      path ? `${path}.${key}` : key,
    ));
  }
  return [{ path, before, after }];
}

if (process.argv.includes('--fixture')) {
  console.log(JSON.stringify({
    frozenFrom: result.frozenFrom,
    content,
    link,
    sources,
    reviews,
    media,
    ai: {
      contentAudits,
      evidenceAudits,
      releases,
      runs,
    },
    releaseAudits: production.releaseAudits,
    reverseDependencies: result.reverseDependencies.map(({ rows: _rows, ...row }) => row),
  }, null, 2));
} else if (process.argv.includes('--content')) {
  console.log(JSON.stringify({
    content,
    localContent: desired ?? null,
    sources,
  }, null, 2));
} else if (process.argv.includes('--source-notes')) {
  console.log(JSON.stringify(sources.map((row) => ({
    sourceId: row.sourceId,
    title: row.title,
    url: row.url,
    reviewStatus: row.reviewStatus,
    reviewScope: row.reviewScope,
    reviewer: row.reviewer,
    reviewerQualification: row.reviewerQualification,
    reviewDate: row.reviewDate,
    nextReviewDate: row.nextReviewDate,
    ageMonthsMin: row.ageMonthsMin,
    ageMonthsMax: row.ageMonthsMax,
    verifiedNote: row.verifiedNote,
    reviewNote: row.reviewNote,
  })), null, 2));
} else if (process.argv.includes('--diff')) {
  console.log(JSON.stringify(diffPaths(
    authoredSnapshot(content),
    authoredSnapshot(desired ?? {}),
  ), null, 2));
} else if (process.argv.includes('--preflight')) {
  const blockers: string[] = [];
  if (production.contents.length !== 1 || canonicalJson(content) !== canonicalJson(frozen.content)) {
    blockers.push('content preimage drifted');
  }
  if (production.links.length !== 1 || canonicalJson(link) !== canonicalJson(frozen.link)) {
    blockers.push('ordered link preimage drifted');
  }
  if (canonicalJson(sources) !== canonicalJson(frozen.sources)) {
    blockers.push('evidence source preimages drifted');
  }
  if (canonicalJson(reviews) !== canonicalJson(frozen.reviews)) {
    blockers.push('complete review history drifted');
  }
  if (currentReviews.length !== 0) blockers.push('revision 4 review preimage drifted');
  if (canonicalJson(media) !== canonicalJson(frozen.media)) blockers.push('media preimage drifted');
  if (canonicalJson({ contentAudits, evidenceAudits, releases, runs })
    !== canonicalJson(frozen.ai)) blockers.push('AI preimage drifted');
  if (canonicalJson(production.releaseAudits) !== canonicalJson(frozen.releaseAudits)) {
    blockers.push('release audit preimage drifted');
  }
  if (production.allLinks.length > 5000) blockers.push('reverse scan exceeded bound');
  const reverseExpected = (frozen.reverseDependencies as Array<Record<string, any>>)
    .map((row) => ({
      sourceId: row.sourceId,
      keys: row.keys,
      canonicalSha256: row.canonicalSha256,
    }));
  const reverseActual = result.reverseDependencies.map(({ rows: _rows, ...row }) => row);
  if (canonicalJson(reverseActual) !== canonicalJson(reverseExpected)) {
    blockers.push('source reverse dependencies drifted');
  }
  if (!desired || canonicalJson(desiredLink?.sourceIds ?? []) !== canonicalJson(desiredSourceIds)) {
    blockers.push('local desired postimage drifted');
  }
  const desiredSources = sources.filter((source) =>
    (desiredSourceIds as readonly string[]).includes(source.sourceId));
  const evidenceGate = evaluatePublicationEvidence(
    desiredSourceIds,
    desiredSources,
    todayIsoUtc(new Date()),
  );
  if (!evidenceGate.allowed) blockers.push('desired evidence set is not publication eligible');
  console.log(JSON.stringify({
    releaseId: '2026-08-24-gd-10-12m-play-safety-v5',
    deployment,
    phase: blockers.length === 0 ? 'ready' : 'blocked',
    blockers,
    productionCheckedAt: result.frozenFrom.checkedAt,
    allLinksRows: production.allLinks.length,
    sourceRows: sources.length,
    reviewRows: reviews.length,
    revision4ReviewRows: currentReviews.length,
    mediaRows: media.length,
    aiRows: contentAudits.length + evidenceAudits.length + releases.length + runs.length,
    releaseAuditRows: production.releaseAudits.length,
    citationsEligible: evidenceGate.allowed,
  }, null, 2));
} else if (process.argv.includes('--compact')) {
  console.log(JSON.stringify({
    ...result,
    reverseDependencies: result.reverseDependencies.map(({ rows: _rows, ...row }) => row),
  }, null, 2));
} else {
  console.log(JSON.stringify(result, null, 2));
}
