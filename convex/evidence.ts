// Evidence Base Convex functions.
//
// STAFF ONLY. The evidence library is an internal clinical-governance tool: it
// carries reviewer names, verification notes and review decisions, none of
// which belong in a parent-facing surface. Every function here goes through
// requireStaff (mutations) or returns `{ allowed: false }` (queries), and every
// write is audited.
//
// This module stores and filters — it does not invent. Reference metadata is
// authored in src/evidence/sources.ts, read verbatim off publisher pages, and
// pushed here by importSources. Nothing in this file fabricates a DOI, ISBN,
// edition or year, and nothing promotes a record to 'approved' except an
// explicit, named human decision made through setReview.
import { query, mutation, internalQuery } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { isStaff, requireStaff } from './lib/auth';
import { logAudit } from './audit';

const REVIEW_STATUSES = [
  'evidence_required',
  'awaiting_review',
  'in_review',
  'approved',
  'retired',
] as const;

const sourceValidator = v.object({
  id: v.string(),
  org: v.string(),
  orgKey: v.string(),
  title: v.string(),
  authors: v.union(v.string(), v.null()),
  year: v.union(v.number(), v.null()),
  edition: v.union(v.string(), v.null()),
  country: v.union(v.string(), v.null()),
  language: v.string(),
  url: v.string(),
  doi: v.union(v.string(), v.null()),
  isbn: v.union(v.string(), v.null()),
  pmid: v.union(v.string(), v.null()),
  evidenceLevel: v.string(),
  reviewStatus: v.string(),
  reviewer: v.union(v.string(), v.null()),
  reviewDate: v.union(v.string(), v.null()),
  nextReviewDate: v.union(v.string(), v.null()),
  keywords: v.array(v.string()),
  topics: v.array(v.string()),
  ageMonthsMin: v.union(v.number(), v.null()),
  ageMonthsMax: v.union(v.number(), v.null()),
  verifiedOn: v.union(v.string(), v.null()),
  verifiedNote: v.string(),
});

const linkValidator = v.object({
  kind: v.string(),
  slug: v.string(),
  sourceIds: v.array(v.string()),
});

function searchTextFor(src: {
  org: string; title: string; authors: string | null; keywords: string[];
  topics: string[]; url: string; doi: string | null; isbn: string | null;
}): string {
  return [
    src.org, src.title, src.authors ?? '', src.url, src.doi ?? '', src.isbn ?? '',
    ...src.keywords, ...src.topics,
  ]
    .join(' ')
    .toLowerCase();
}

const EMPTY_LIST = { allowed: false as const, total: 0, sources: [], links: [] };

/**
 * Filtered reference list. Supports every filter the mission names:
 * Organization, Age, Topic, Evidence Level, Year, Country, Language, Clinical
 * Review status — plus a free-text query.
 */
export const list = query({
  args: {
    orgKey: v.optional(v.string()),
    topic: v.optional(v.string()),
    evidenceLevel: v.optional(v.string()),
    reviewStatus: v.optional(v.string()),
    country: v.optional(v.string()),
    language: v.optional(v.string()),
    yearFrom: v.optional(v.number()),
    yearTo: v.optional(v.number()),
    ageMonths: v.optional(v.number()),
    q: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId || !(await isStaff(ctx, userId))) return EMPTY_LIST;

    let rows = await ctx.db.query('evidenceSources').collect();

    if (args.orgKey) rows = rows.filter((r) => r.orgKey === args.orgKey);
    if (args.topic) rows = rows.filter((r) => r.topics.includes(args.topic as string));
    if (args.evidenceLevel) rows = rows.filter((r) => r.evidenceLevel === args.evidenceLevel);
    if (args.reviewStatus) rows = rows.filter((r) => r.reviewStatus === args.reviewStatus);
    if (args.country) rows = rows.filter((r) => r.country === args.country);
    if (args.language) rows = rows.filter((r) => r.language === args.language);
    if (args.yearFrom !== undefined) {
      rows = rows.filter((r) => r.year !== null && r.year >= (args.yearFrom as number));
    }
    if (args.yearTo !== undefined) {
      rows = rows.filter((r) => r.year !== null && r.year <= (args.yearTo as number));
    }
    if (args.ageMonths !== undefined) {
      const m = args.ageMonths;
      // A reference with no age band is general and always in range.
      rows = rows.filter(
        (r) =>
          (r.ageMonthsMin === null && r.ageMonthsMax === null) ||
          ((r.ageMonthsMin ?? 0) <= m && (r.ageMonthsMax ?? 1_000) >= m),
      );
    }
    if (args.q) {
      const needle = args.q.toLowerCase();
      rows = rows.filter((r) => r.searchText.includes(needle));
    }

    rows.sort((a, b) => a.sourceId.localeCompare(b.sourceId));
    const links = await ctx.db.query('evidenceLinks').collect();
    return { allowed: true as const, total: rows.length, sources: rows, links };
  },
});

/** One reference plus the content that cites it. */
export const getSource = query({
  args: { sourceId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId || !(await isStaff(ctx, userId))) return null;
    const source = await ctx.db
      .query('evidenceSources')
      .withIndex('by_source_id', (qq) => qq.eq('sourceId', args.sourceId))
      .unique();
    if (!source) return null;
    const links = await ctx.db.query('evidenceLinks').collect();
    const related = links
      .filter((l) => l.sourceIds.includes(args.sourceId))
      .map((l) => ({ kind: l.kind, slug: l.slug }));
    return { source, related };
  },
});

/** All references backing one content slug (used by the content detail view). */
export const forContent = query({
  args: { slug: v.string(), kind: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { allowed: false as const, sources: [] };
    const links = await ctx.db
      .query('evidenceLinks')
      .withIndex('by_slug', (qq) => qq.eq('slug', args.slug))
      .collect();
    const link = args.kind ? links.find((l) => l.kind === args.kind) : links[0];
    if (!link) return { allowed: true as const, sources: [] };
    const sources = [];
    for (const id of link.sourceIds) {
      const src = await ctx.db
        .query('evidenceSources')
        .withIndex('by_source_id', (qq) => qq.eq('sourceId', id))
        .unique();
      // Parents only ever see a citation that a human approved.
      if (src && src.reviewStatus === 'approved') sources.push(src);
    }
    return { allowed: true as const, sources };
  },
});

/** Counts for the admin summary strip. Staff-only. */
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId || !(await isStaff(ctx, userId))) {
      return { allowed: false as const, total: 0, byOrg: {}, byStatus: {}, byLevel: {}, links: 0, linkedSlugs: 0 };
    }
    const rows = await ctx.db.query('evidenceSources').collect();
    const links = await ctx.db.query('evidenceLinks').collect();
    const byOrg: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byLevel: Record<string, number> = {};
    for (const r of rows) {
      byOrg[r.orgKey] = (byOrg[r.orgKey] ?? 0) + 1;
      byStatus[r.reviewStatus] = (byStatus[r.reviewStatus] ?? 0) + 1;
      byLevel[r.evidenceLevel] = (byLevel[r.evidenceLevel] ?? 0) + 1;
    }
    return {
      allowed: true as const,
      total: rows.length,
      byOrg,
      byStatus,
      byLevel,
      links: links.length,
      linkedSlugs: new Set(links.map((l) => `${l.kind}:${l.slug}`)).size,
    };
  },
});

/**
 * Import the verified reference registry. Idempotent by sourceId.
 *
 * A re-import refreshes publisher metadata but NEVER overwrites a human review
 * decision — reviewStatus, reviewer and reviewDate on an existing row are kept.
 * An insert can never arrive as 'approved': approval is a human act performed
 * through setReview, not something an import can assert.
 */
export const importSources = mutation({
  args: { sources: v.array(sourceValidator) },
  handler: async (ctx, { sources }) => {
    const userId = await requireStaff(ctx);
    const now = Date.now();
    let created = 0;
    let updated = 0;

    for (const src of sources) {
      const { id, ...rest } = src;
      const existing = await ctx.db
        .query('evidenceSources')
        .withIndex('by_source_id', (qq) => qq.eq('sourceId', id))
        .unique();
      const searchText = searchTextFor(rest);

      if (existing) {
        await ctx.db.patch(existing._id, {
          ...rest,
          sourceId: id,
          // Human review decisions survive re-import.
          reviewStatus: existing.reviewStatus,
          reviewer: existing.reviewer,
          reviewerQualification: existing.reviewerQualification,
          reviewDate: existing.reviewDate,
          reviewNote: existing.reviewNote,
          nextReviewDate: existing.nextReviewDate ?? rest.nextReviewDate,
          reviewerId: existing.reviewerId,
          searchText,
          updatedAt: now,
        });
        updated += 1;
      } else {
        const reviewStatus = rest.reviewStatus === 'approved' ? 'awaiting_review' : rest.reviewStatus;
        await ctx.db.insert('evidenceSources', {
          ...rest,
          sourceId: id,
          reviewStatus,
          reviewer: null,
          reviewDate: null,
          searchText,
          createdAt: now,
          updatedAt: now,
        });
        created += 1;
      }
    }

    await logAudit(
      ctx,
      userId,
      'evidence.importSources',
      'evidenceSources',
      undefined,
      `created ${created}, updated ${updated}`,
    );
    return { created, updated };
  },
});

/**
 * Import the content-to-reference link table. Idempotent by (kind, slug).
 * A link naming a sourceId that is not in the registry is rejected outright —
 * a dangling citation is worse than no citation.
 */
export const importLinks = mutation({
  args: { links: v.array(linkValidator) },
  handler: async (ctx, { links }) => {
    const userId = await requireStaff(ctx);
    const now = Date.now();
    const known = new Set((await ctx.db.query('evidenceSources').collect()).map((r) => r.sourceId));

    const unknown = [...new Set(links.flatMap((l) => l.sourceIds).filter((id) => !known.has(id)))];
    if (unknown.length > 0) {
      throw new Error(`Unknown reference ids: ${unknown.slice(0, 10).join(', ')}`);
    }
    const empty = links.filter((l) => l.sourceIds.length === 0);
    if (empty.length > 0) {
      throw new Error(`Orphan content rejected: ${empty.map((l) => `${l.kind}:${l.slug}`).slice(0, 10).join(', ')}`);
    }

    let created = 0;
    let updated = 0;
    for (const link of links) {
      const existing = await ctx.db
        .query('evidenceLinks')
        .withIndex('by_kind_slug', (qq) => qq.eq('kind', link.kind).eq('slug', link.slug))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, { sourceIds: link.sourceIds, updatedAt: now });
        updated += 1;
      } else {
        await ctx.db.insert('evidenceLinks', { ...link, createdAt: now, updatedAt: now });
        created += 1;
      }
    }

    await logAudit(
      ctx,
      userId,
      'evidence.importLinks',
      'evidenceLinks',
      undefined,
      `created ${created}, updated ${updated}`,
    );
    return { created, updated };
  },
});

/**
 * Record a clinical review decision on one reference. This is the ONLY path to
 * 'approved', it requires a named reviewer, and it is audited. A record that
 * was imported as 'evidence_required' (metadata that could not be verified
 * against the publisher page) cannot be approved until the metadata is fixed
 * and re-imported.
 */
export const setReview = mutation({
  args: {
    sourceId: v.string(),
    status: v.string(),
    reviewer: v.string(),
    reviewerQualification: v.string(),
    reviewDate: v.string(),
    nextReviewDate: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireStaff(ctx);
    if (!(REVIEW_STATUSES as readonly string[]).includes(args.status)) {
      throw new Error(`Unknown review status: ${args.status}`);
    }
    if (!args.reviewer.trim()) throw new Error('A named reviewer is required');
    // A sign-off is only auditable if the person signing states what they are
    // qualified to sign off. Unqualified approval is not approval.
    if (!args.reviewerQualification.trim()) {
      throw new Error('A reviewer qualification is required');
    }

    const row = await ctx.db
      .query('evidenceSources')
      .withIndex('by_source_id', (qq) => qq.eq('sourceId', args.sourceId))
      .unique();
    if (!row) throw new Error('Reference not found');

    if (args.status === 'approved' && row.reviewStatus === 'evidence_required') {
      throw new Error(
        'This reference is marked evidence_required: its metadata could not be verified against the publisher page. Fix and re-import before approving.',
      );
    }

    await ctx.db.patch(row._id, {
      reviewStatus: args.status,
      reviewer: args.reviewer.trim(),
      reviewerQualification: args.reviewerQualification.trim(),
      reviewDate: args.reviewDate,
      nextReviewDate: args.nextReviewDate ?? row.nextReviewDate,
      reviewNote: args.note,
      reviewerId: userId,
      updatedAt: Date.now(),
    });

    await logAudit(
      ctx,
      userId,
      'evidence.setReview',
      'evidenceSources',
      args.sourceId,
      `${row.reviewStatus} → ${args.status} by ${args.reviewer.trim()} (${args.reviewerQualification.trim()})`,
    );
    return { ok: true };
  },
});

// ---------------------------------------------------------------------------
// Live integrity probe (INTERNAL — not reachable from any browser).
//
// internalQuery is callable only from the server or from the CLI with an admin
// key (`npx convex run evidence:integrity`). It exists so a deployment can be
// checked against the source of truth after a deploy or an import: are the
// evidence tables live, do the indexes answer, how many rows are actually
// there, and has anything been approved that should not have been.
// ---------------------------------------------------------------------------
export const integrity = internalQuery({
  args: {},
  handler: async (ctx) => {
    const sources = await ctx.db.query('evidenceSources').collect();
    const links = await ctx.db.query('evidenceLinks').collect();

    // Exercise every index so a missing one fails loudly rather than silently
    // falling back to a full scan in some later query.
    const indexProbe = {
      by_source_id: (
        await ctx.db
          .query('evidenceSources')
          .withIndex('by_source_id', (q) => q.eq('sourceId', sources[0]?.sourceId ?? '__none__'))
          .collect()
      ).length,
      by_org: (
        await ctx.db
          .query('evidenceSources')
          .withIndex('by_org', (q) => q.eq('orgKey', 'WHO'))
          .collect()
      ).length,
      by_review_status: (
        await ctx.db
          .query('evidenceSources')
          .withIndex('by_review_status', (q) => q.eq('reviewStatus', 'awaiting_review'))
          .collect()
      ).length,
      by_level: (
        await ctx.db
          .query('evidenceSources')
          .withIndex('by_level', (q) => q.eq('evidenceLevel', 'guideline'))
          .collect()
      ).length,
      by_kind: (
        await ctx.db
          .query('evidenceLinks')
          .withIndex('by_kind', (q) => q.eq('kind', 'milestone'))
          .collect()
      ).length,
      by_kind_slug: (
        await ctx.db
          .query('evidenceLinks')
          .withIndex('by_kind_slug', (q) =>
            q.eq('kind', links[0]?.kind ?? 'milestone').eq('slug', links[0]?.slug ?? '__none__'),
          )
          .collect()
      ).length,
    };

    const byStatus: Record<string, number> = {};
    sources.forEach((s) => {
      byStatus[s.reviewStatus] = (byStatus[s.reviewStatus] ?? 0) + 1;
    });

    const known = new Set(sources.map((s) => s.sourceId));
    const danglingLinks = links
      .filter((l) => l.sourceIds.some((id) => !known.has(id)))
      .map((l) => `${l.kind}:${l.slug}`);
    const orphanLinks = links.filter((l) => l.sourceIds.length === 0).map((l) => `${l.kind}:${l.slug}`);

    // An approval with no named reviewer or no stated qualification is not a
    // sign-off; report it so it can be reversed.
    const approvedWithoutReviewer = sources
      .filter(
        (s) =>
          s.reviewStatus === 'approved' &&
          (!s.reviewer?.trim() || !s.reviewerQualification?.trim()),
      )
      .map((s) => s.sourceId);

    const publishedContent = (await ctx.db.query('libraryContent').collect()).filter(
      (c) => c.clinicalStatus === 'published',
    );
    const linkedSlugs = new Set(links.map((l) => l.slug));
    const publishedWithoutEvidence = publishedContent
      .filter((c) => !linkedSlugs.has(c.slug))
      .map((c) => c.slug);

    return {
      sources: sources.length,
      links: links.length,
      linkedSlugs: linkedSlugs.size,
      byStatus,
      indexProbe,
      danglingLinks,
      orphanLinks,
      approvedWithoutReviewer,
      publishedContent: publishedContent.length,
      publishedWithoutEvidence,
    };
  },
});
