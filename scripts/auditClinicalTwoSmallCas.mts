import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { CONTENT_SEED } from '../src/content/seed/index.ts';
import { EVIDENCE_LINKS } from '../src/evidence/links.ts';

const deployment = 'graceful-possum-566';
const targets = [
  { kind: 'special_need', slug: 'sn_cerebral_palsy' },
  { kind: 'guide', slug: 'gd_3_4m_sleep' },
] as const;

const query = `
  const targets = ${JSON.stringify(targets)};
  const targetSlugs = targets.map((target) => target.slug);
  const contents = [];
  const links = [];
  const media = [];
  const reviews = [];
  const contentAudits = [];
  const releases = [];
  for (const target of targets) {
    contents.push(...await ctx.db.query("libraryContent")
      .withIndex("by_slug", (q) => q.eq("slug", target.slug)).take(2));
    links.push(...await ctx.db.query("evidenceLinks")
      .withIndex("by_kind_slug", (q) => q.eq("kind", target.kind).eq("slug", target.slug)).take(2));
    media.push(...await ctx.db.query("libraryMedia")
      .withIndex("by_content", (q) => q.eq("contentSlug", target.slug)).take(101));
    reviews.push(...await ctx.db.query("contentReviews")
      .withIndex("by_content", (q) => q.eq("contentSlug", target.slug)).take(501));
    contentAudits.push(...await ctx.db.query("aiContentAudits")
      .withIndex("by_content_revision_and_updated_at", (q) => q.eq("contentSlug", target.slug)).take(101));
    releases.push(...await ctx.db.query("aiPublicationReleases")
      .withIndex("by_target_key", (q) => q.eq("targetKey", target.kind + ":" + target.slug)).take(101));
  }
  const sourceIds = [...new Set(links.flatMap((row) => row.sourceIds))];
  const sources = [];
  const evidenceAudits = [];
  for (const sourceId of sourceIds) {
    sources.push(...await ctx.db.query("evidenceSources")
      .withIndex("by_source_id", (q) => q.eq("sourceId", sourceId)).take(2));
    evidenceAudits.push(...await ctx.db.query("aiEvidenceAudits")
      .withIndex("by_source_and_updated_at", (q) => q.eq("sourceId", sourceId)).take(101));
  }
  const allLinks = await ctx.db.query("evidenceLinks").take(1001);
  const releaseActions = ["release.clinical_two_small_corrections"];
  const releaseAudits = [];
  for (const action of releaseActions) {
    releaseAudits.push(...await ctx.db.query("auditLogs")
      .withIndex("by_action", (q) => q.eq("action", action)).take(2));
  }
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
  return {
    contents, links, sources, media, reviews, contentAudits,
    evidenceAudits, releases, runs, allLinks, releaseAudits,
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
  };
}

const seedBySlug = new Map(CONTENT_SEED.map((row) => [row.slug, row]));
const localLinkByKey = new Map(EVIDENCE_LINKS.map((row) => [`${row.kind}:${row.slug}`, row]));
const contentBySlug = new Map(production.contents.map((row) => [row.slug, row]));
const linkByKey = new Map(production.links.map((row) => [`${row.kind}:${row.slug}`, row]));
const sourceById = new Map(production.sources.map((row) => [row.sourceId, row]));

const sourceIds = [...new Set(production.links.flatMap((row) => row.sourceIds as string[]))].sort();
const sourcePreimages = sourceIds.map((sourceId) => ({
  sourceId,
  ...exactRow(sourceById.get(sourceId) ?? {}),
  reviewStatus: sourceById.get(sourceId)?.reviewStatus ?? null,
  reviewDate: sourceById.get(sourceId)?.reviewDate ?? null,
  nextReviewDate: sourceById.get(sourceId)?.nextReviewDate ?? null,
  verifiedOn: sourceById.get(sourceId)?.verifiedOn ?? null,
  updatedAt: sourceById.get(sourceId)?.updatedAt ?? null,
}));

const result = {
  deployment,
  checkedAt: new Date().toISOString(),
  allLinksBounded: production.allLinks.length <= 1000,
  releaseAuditRows: byId(production.releaseAudits).map(exactRow),
  sources: sourcePreimages,
  targets: targets.map((target) => {
    const content = contentBySlug.get(target.slug) ?? {};
    const link = linkByKey.get(`${target.kind}:${target.slug}`) ?? {};
    const desired = seedBySlug.get(target.slug) as Record<string, any> | undefined;
    const desiredLink = localLinkByKey.get(`${target.kind}:${target.slug}`);
    const reviews = byId(production.reviews.filter((row) => row.contentSlug === target.slug));
    const currentReviews = reviews.filter((row) =>
      row.contentVersion === content.reviewRevision || row.reviewRevision === content.reviewRevision);
    const media = byId(production.media.filter((row) => row.contentSlug === target.slug));
    const contentAudits = byId(production.contentAudits.filter((row) => row.contentSlug === target.slug));
    const releases = byId(production.releases.filter((row) => row.targetKey === `${target.kind}:${target.slug}`));
    const sourceSet = new Set(link.sourceIds ?? []);
    const evidenceAudits = byId(production.evidenceAudits.filter((row) => sourceSet.has(row.sourceId)));
    const relevantRunIds = new Set([
      ...contentAudits.map((row) => row.runId),
      ...evidenceAudits.map((row) => row.runId),
      ...releases.flatMap((row) => [
        row.contentAuditRunId,
        ...(row.sourceSnapshots ?? []).map((source: Record<string, any>) => source.evidenceAuditRunId),
      ]),
    ]);
    const runs = byId(production.runs.filter((row) => relevantRunIds.has(row.runId)));
    const aiSnapshot = { contentAudits, evidenceAudits, releases, runs };
    return {
      kind: target.kind,
      slug: target.slug,
      content: {
        ...exactRow(content),
        updatedAt: content.updatedAt ?? null,
        reviewRevision: content.reviewRevision ?? null,
        clinicalStatus: content.clinicalStatus ?? null,
        authoredCanonicalSha256: sha256(authoredSnapshot(content)),
        desiredAuthoredCanonicalSha256: sha256(authoredSnapshot(desired ?? {})),
        desiredSearchTextSha256: sha256(desired?.searchText ?? null),
      },
      link: {
        ...exactRow(link),
        createdAt: link.createdAt ?? null,
        updatedAt: link.updatedAt ?? null,
        sourceIds: link.sourceIds ?? [],
        desiredSourceIds: desiredLink?.sourceIds ?? [],
      },
      media: media.map(exactRow),
      mediaCanonicalSha256: sha256(media),
      allReviews: reviews.map(exactRow),
      allReviewsCanonicalSha256: sha256(reviews),
      currentReviews: currentReviews.map(exactRow),
      currentReviewsCanonicalSha256: sha256(currentReviews),
      ai: {
        contentAudits: contentAudits.map(exactRow),
        evidenceAudits: evidenceAudits.map(exactRow),
        releases: releases.map(exactRow),
        runs: runs.map(exactRow),
        canonicalSha256: sha256(aiSnapshot),
      },
      reverseDependencies: (link.sourceIds ?? []).map((sourceId: string) => {
        const rows = byId(production.allLinks.filter((candidate) => candidate.sourceIds.includes(sourceId)));
        const desiredRows = sourceId === 'jr-aasm-bedtime-2006'
          ? rows.filter((candidate) => !(
            candidate.kind === 'guide' && candidate.slug === 'gd_3_4m_sleep'
          ))
          : rows;
        return {
          sourceId,
          keys: rows.map((row) => `${row.kind}:${row.slug}`),
          rows: rows.map(exactRow),
          canonicalSha256: sha256(rows),
          desiredKeys: desiredRows.map((row) => `${row.kind}:${row.slug}`),
          desiredCanonicalSha256: sha256(desiredRows),
        };
      }),
    };
  }),
};

console.log(JSON.stringify(result, null, 2));
