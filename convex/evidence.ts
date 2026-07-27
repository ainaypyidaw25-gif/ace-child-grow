// Evidence Base Convex functions.
//
// STAFF ONLY. The evidence library is an internal professional-governance tool: it
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
import {
  query,
  mutation,
  internalQuery,
  internalMutation,
  type MutationCtx,
} from './_generated/server';
import { v, type Infer } from 'convex/values';
import type { Id } from './_generated/dataModel';
import { getAuthUserId } from '@convex-dev/auth/server';
import { hasStaffRole, requireEvidenceEditor, requireProfessionalPublisher } from './lib/auth';
import { logAudit } from './audit';

const REVIEW_STATUSES = [
  'evidence_required',
  'awaiting_review',
  'in_review',
  'approved',
  'retired',
] as const;

// Staleness rules, mirrored from src/evidence/types.ts so the live integrity
// probe classifies a stored row exactly as the local reports classify the same
// record. They are duplicated rather than imported because a Convex function
// bundle should not reach into the browser source tree; a test compares the two
// tables field by field, so a change on either side fails CI rather than
// producing two different answers to "is this reference expired".
const REVIEW_CADENCE_MONTHS: Record<string, number> = {
  guideline: 24,
  parent_education: 24,
  expert_consensus: 36,
  systematic_review: 48,
  rct: 60,
  cohort: 60,
  textbook: 60,
};
const OUTDATED_AFTER_YEARS: Record<string, number> = {
  guideline: 8,
  parent_education: 5,
  expert_consensus: 10,
  systematic_review: 10,
  rct: 20,
  cohort: 20,
  textbook: 12,
};

function addMonthsIso(isoDate: string, months: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return isoDate;
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

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

const publicCitationValidator = v.object({
  sourceId: v.string(),
  org: v.string(),
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
});

function searchTextFor(src: {
  org: string;
  title: string;
  authors: string | null;
  keywords: string[];
  topics: string[];
  url: string;
  doi: string | null;
  isbn: string | null;
}): string {
  return [
    src.org,
    src.title,
    src.authors ?? '',
    src.url,
    src.doi ?? '',
    src.isbn ?? '',
    ...src.keywords,
    ...src.topics,
  ]
    .join(' ')
    .toLowerCase();
}

/**
 * Would this import actually change the stored row? Compared field by field on
 * the values the import owns; `_id`, `_creationTime`, `createdAt` and
 * `updatedAt` are storage bookkeeping, not content.
 */
function sameSource(existing: Record<string, unknown>, next: Record<string, unknown>): boolean {
  return Object.keys(next).every((k) => {
    const a = existing[k];
    const b = next[k];
    if (Array.isArray(a) && Array.isArray(b)) {
      return a.length === b.length && a.every((v2, i) => v2 === b[i]);
    }
    // An absent optional and an explicit null mean the same thing here.
    if ((a ?? null) === null && (b ?? null) === null) return true;
    return a === b;
  });
}

const EMPTY_LIST = {
  allowed: false as const,
  total: 0,
  sources: [],
  links: [],
};

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
    if (!userId || !(await hasStaffRole(ctx, userId, ['owner', 'content_editor', 'clinical_reviewer']))) return EMPTY_LIST;

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
    if (!userId || !(await hasStaffRole(ctx, userId, ['owner', 'content_editor', 'clinical_reviewer']))) return null;
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
  returns: v.object({
    allowed: v.boolean(),
    sources: v.array(publicCitationValidator),
  }),
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
      if (src && src.reviewStatus === 'approved') {
        const {
          sourceId, org, title, authors, year, edition, country, language,
          url, doi, isbn, pmid, evidenceLevel,
        } = src;
        sources.push({
          sourceId, org, title, authors, year, edition, country, language,
          url, doi, isbn, pmid, evidenceLevel,
        });
      }
    }
    return { allowed: true as const, sources };
  },
});

/** Counts for the admin summary strip. Staff-only. */
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId || !(await hasStaffRole(ctx, userId, ['owner', 'content_editor', 'clinical_reviewer']))) {
      return {
        allowed: false as const,
        total: 0,
        byOrg: {},
        byStatus: {},
        byLevel: {},
        links: 0,
        linkedSlugs: 0,
      };
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
 *
 * The body lives here rather than inside the mutation because there are two
 * legitimate ways to run an import — a signed-in staff member using the admin
 * screen, and an operator holding a deploy key running it from the CLI during
 * activation — and they must behave identically. `actorId` is the only
 * difference: a CLI run has no user, and the audit entry says so rather than
 * borrowing someone's name.
 */
async function applySources(
  ctx: MutationCtx,
  sources: Infer<typeof sourceValidator>[],
  actorId: Id<'users'> | null,
  via: string,
) {
  const userId = actorId;
  const now = Date.now();
  let created = 0;
  let updated = 0;
  let unchanged = 0;
  let skipped = 0;
  const failed: string[] = [];

  // A second copy of the same sourceId inside one payload would silently
  // overwrite the first; report it as skipped rather than importing twice.
  const seen = new Set<string>();

  for (const src of sources) {
    const { id, ...rest } = src;
    if (seen.has(id)) {
      skipped += 1;
      continue;
    }
    seen.add(id);

    try {
      const existing = await ctx.db
        .query('evidenceSources')
        .withIndex('by_source_id', (qq) => qq.eq('sourceId', id))
        .unique();
      const searchText = searchTextFor(rest);

      if (existing) {
        const next = {
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
          reviewScope: existing.reviewScope,
          searchText,
        };
        // 'updated' should mean something changed. Counting an identical
        // re-import as an update makes an idempotent run look like a rewrite
        // of all 90 records, which is exactly the thing an operator is
        // watching for.
        if (sameSource(existing, next)) {
          unchanged += 1;
        } else {
          await ctx.db.patch(existing._id, { ...next, updatedAt: now });
          updated += 1;
        }
      } else {
        const reviewStatus =
          rest.reviewStatus === 'approved' ? 'awaiting_review' : rest.reviewStatus;
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
    } catch {
      failed.push(id);
    }
  }

  const summary = `created ${created}, updated ${updated}, unchanged ${unchanged}, skipped ${skipped}, failed ${failed.length}`;
  await logAudit(
    ctx,
    userId,
    'evidence.importSources',
    'evidenceSources',
    undefined,
    `${summary} (via ${via})`,
    {
      result: failed.length > 0 ? 'failed' : 'ok',
      before: `${sources.length} submitted`,
      after: summary,
    },
  );
  return {
    created,
    updated,
    unchanged,
    skipped,
    failed: failed.length,
    failedIds: failed,
  };
}

export const importSources = mutation({
  args: { sources: v.array(sourceValidator) },
  handler: async (ctx, { sources }) =>
    applySources(ctx, sources, await requireEvidenceEditor(ctx), 'admin screen'),
});

/**
 * The same import, reachable only with a deploy key. internalMutation is not
 * routed to browsers, so this widens nothing a parent or a signed-in user can
 * do: the only caller is an operator who could already write these tables from
 * the Convex dashboard. It exists so first activation of an empty deployment
 * does not require a staff account to have been created first.
 */
export const importSourcesFromCli = internalMutation({
  args: { sources: v.array(sourceValidator) },
  handler: async (ctx, { sources }) => applySources(ctx, sources, null, 'deploy key (CLI)'),
});

/**
 * Import the content-to-reference link table. Idempotent by (kind, slug).
 * A link naming a sourceId that is not in the registry is rejected outright —
 * a dangling citation is worse than no citation.
 */
async function applyLinks(
  ctx: MutationCtx,
  links: Infer<typeof linkValidator>[],
  actorId: Id<'users'> | null,
  via: string,
) {
  const userId = actorId;
  const now = Date.now();
  const known = new Set((await ctx.db.query('evidenceSources').collect()).map((r) => r.sourceId));

  const unknown = [...new Set(links.flatMap((l) => l.sourceIds).filter((id) => !known.has(id)))];
  if (unknown.length > 0) {
    throw new Error(`Unknown reference ids: ${unknown.slice(0, 10).join(', ')}`);
  }
  const empty = links.filter((l) => l.sourceIds.length === 0);
  if (empty.length > 0) {
    throw new Error(
      `Orphan content rejected: ${empty
        .map((l) => `${l.kind}:${l.slug}`)
        .slice(0, 10)
        .join(', ')}`,
    );
  }

  let created = 0;
  let updated = 0;
  let unchanged = 0;
  let skipped = 0;
  const failed: string[] = [];
  const seen = new Set<string>();

  for (const link of links) {
    const key = `${link.kind}:${link.slug}`;
    if (seen.has(key)) {
      skipped += 1;
      continue;
    }
    seen.add(key);

    try {
      const existing = await ctx.db
        .query('evidenceLinks')
        .withIndex('by_kind_slug', (qq) => qq.eq('kind', link.kind).eq('slug', link.slug))
        .unique();
      if (existing) {
        const same =
          existing.sourceIds.length === link.sourceIds.length &&
          existing.sourceIds.every((id, i) => id === link.sourceIds[i]);
        if (same) {
          unchanged += 1;
        } else {
          await ctx.db.patch(existing._id, {
            sourceIds: link.sourceIds,
            updatedAt: now,
          });
          updated += 1;
        }
      } else {
        await ctx.db.insert('evidenceLinks', {
          ...link,
          createdAt: now,
          updatedAt: now,
        });
        created += 1;
      }
    } catch {
      failed.push(key);
    }
  }

  const summary = `created ${created}, updated ${updated}, unchanged ${unchanged}, skipped ${skipped}, failed ${failed.length}`;
  await logAudit(
    ctx,
    userId,
    'evidence.importLinks',
    'evidenceLinks',
    undefined,
    `${summary} (via ${via})`,
    {
      result: failed.length > 0 ? 'failed' : 'ok',
      before: `${links.length} submitted`,
      after: summary,
    },
  );
  return {
    created,
    updated,
    unchanged,
    skipped,
    failed: failed.length,
    failedKeys: failed,
  };
}

export const importLinks = mutation({
  args: { links: v.array(linkValidator) },
  handler: async (ctx, { links }) =>
    applyLinks(ctx, links, await requireEvidenceEditor(ctx), 'admin screen'),
});

/** CLI-only counterpart to importLinks. See importSourcesFromCli. */
export const importLinksFromCli = internalMutation({
  args: { links: v.array(linkValidator) },
  handler: async (ctx, { links }) => applyLinks(ctx, links, null, 'deploy key (CLI)'),
});

/**
 * Record a clinical review decision on one reference. This is the ONLY path to
 * 'approved', it requires a named and qualified reviewer, and it is audited —
 * whether it succeeds or is refused. A record that was imported as
 * 'evidence_required' (metadata that could not be verified against the
 * publisher page) cannot be approved until the metadata is fixed and
 * re-imported.
 *
 * Refusals return `{ ok: false, code, message }` instead of throwing. That is
 * deliberate: Convex discards every write of a mutation that throws, so a
 * refusal that threw would take its own audit record down with it, and the
 * attempt to approve an unapprovable reference would leave no trace. Callers
 * must check `ok` — nothing is written when it is false.
 */

/**
 * The approval policy, expressed as a decision that is separate from the write.
 *
 * `setReview` performs it and `reviewGate` merely reports it, and the two must
 * never be able to disagree about what is allowed — a gate that answers one way
 * to a release check and another way to a reviewer is worse than no gate. So
 * the rules live here once. Returns the refusal, or null to permit.
 */
export function reviewRefusal(
  args: {
    status: string;
    reviewer: string;
    reviewerQualification: string;
    reviewDate: string;
  },
  row: { reviewStatus: string } | null,
): { code: string; message: string } | null {
  if (!(REVIEW_STATUSES as readonly string[]).includes(args.status)) {
    return { code: 'unknown_status', message: `Unknown review status: ${args.status}` };
  }
  if (!args.reviewer.trim()) {
    return { code: 'reviewer_required', message: 'A named reviewer is required' };
  }
  // A sign-off is only auditable if the person signing states what they are
  // qualified to sign off. Unqualified approval is not approval.
  if (!args.reviewerQualification.trim()) {
    return { code: 'qualification_required', message: 'A reviewer qualification is required' };
  }
  if (!args.reviewDate.trim()) {
    return { code: 'review_date_required', message: 'A review date is required' };
  }
  if (!row) {
    return { code: 'not_found', message: 'Reference not found' };
  }
  if (args.status === 'approved' && row.reviewStatus === 'evidence_required') {
    return {
      code: 'evidence_required',
      message:
        'This reference is marked evidence_required: its metadata could not be verified against the publisher page. Fix and re-import before approving.',
    };
  }
  return null;
}

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
    const approval = args.status === 'approved'
      ? await requireProfessionalPublisher(ctx)
      : null;
    const userId = approval?.userId ?? await requireEvidenceEditor(ctx);
    const reviewArgs = approval
      ? {
          ...args,
          reviewer: approval.reviewerName,
          reviewerQualification: approval.qualification,
        }
      : args;

    const refuse = async (code: string, message: string, before: string) => {
      await logAudit(
        ctx,
        userId,
        'evidence.setReview',
        'evidenceSources',
        args.sourceId,
        `refused (${code}): ${message}`,
        { result: 'rejected', before, after: before },
      );
      return { ok: false as const, code, message };
    };

    const row = await ctx.db
      .query('evidenceSources')
      .withIndex('by_source_id', (qq) => qq.eq('sourceId', args.sourceId))
      .unique();

    // One policy, evaluated once. See reviewRefusal.
    const refusal = reviewRefusal(reviewArgs, row);
    if (refusal) {
      return refuse(
        refusal.code,
        refusal.message,
        row ? `${row.reviewStatus} / ${row.reviewer ?? 'no reviewer'}` : 'unchanged',
      );
    }
    // Unreachable: reviewRefusal already returns 'not_found' for a missing row.
    // Kept so the compiler can narrow `row` below rather than being told to
    // trust an assertion, because a non-null assertion here would be exactly
    // the kind of thing that stops being true after a future edit.
    if (!row) return refuse('not_found', 'Reference not found', 'unchanged');

    const before = `${row.reviewStatus} / ${row.reviewer ?? 'no reviewer'} / ${row.reviewDate ?? 'no date'}`;
    await ctx.db.patch(row._id, {
      reviewStatus: args.status,
      reviewer: reviewArgs.reviewer.trim(),
      reviewerQualification: reviewArgs.reviewerQualification.trim(),
      reviewDate: args.reviewDate,
      nextReviewDate: args.nextReviewDate ?? row.nextReviewDate,
      reviewNote: args.note,
      reviewerId: userId,
      reviewScope: approval?.scope,
      updatedAt: Date.now(),
    });
    const after = `${args.status} / ${reviewArgs.reviewer.trim()} (${reviewArgs.reviewerQualification.trim()}) / ${args.reviewDate}`;

    await logAudit(
      ctx,
      userId,
      'evidence.setReview',
      'evidenceSources',
      args.sourceId,
      `${row.reviewStatus} → ${args.status} by ${reviewArgs.reviewer.trim()} (${reviewArgs.reviewerQualification.trim()})`,
      { result: 'ok', before, after },
    );
    return { ok: true as const, reviewScope: approval?.scope ?? null };
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
/**
 * What would the approval gate decide for this input? Read-only.
 *
 * A gate can only be trusted if it has been pushed against. Testing it by
 * actually approving something is not an option — approval is a clinical act
 * and this deployment holds real content — and the CLI cannot impersonate a
 * staff session, so the write path cannot be driven from a release check at
 * all. This reports the decision without performing it: it reads one row,
 * evaluates the same policy `setReview` evaluates, and writes nothing.
 *
 * internalQuery, so it is not reachable from any browser: it describes the gate
 * but does not open it, and it is not a hint to a parent about what would be
 * allowed if they were staff.
 */
export const reviewGate = internalQuery({
  args: {
    sourceId: v.string(),
    status: v.string(),
    reviewer: v.string(),
    reviewerQualification: v.string(),
    reviewDate: v.string(),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query('evidenceSources')
      .withIndex('by_source_id', (qq) => qq.eq('sourceId', args.sourceId))
      .unique();
    const refusal = reviewRefusal(args, row);
    return {
      allowed: refusal === null,
      code: refusal?.code ?? null,
      message: refusal?.message ?? null,
      currentStatus: row?.reviewStatus ?? null,
    };
  },
});

/**
 * The live citations behind a named set of content slugs.
 *
 * A review batch is assembled in the browser from the TypeScript registry. That
 * is the right place to assemble it, but it means the batch a reviewer signs is
 * built from the repository while the app serves citations from the database —
 * and nothing so far compared the two. This returns what the DEPLOYMENT holds
 * for those slugs, so a release check can confirm the reviewer's paperwork and
 * the running system describe the same evidence.
 *
 * Read-only and internal: it reports review status across every reference a
 * batch touches, which is an operator's view rather than a parent's.
 */
export const batchSnapshot = internalQuery({
  args: { slugs: v.array(v.string()) },
  handler: async (ctx, args) => {
    const wanted = new Set(args.slugs);
    const links = (await ctx.db.query('evidenceLinks').collect()).filter((l) => wanted.has(l.slug));
    const cited = new Set(links.flatMap((l) => l.sourceIds));
    const sources = (await ctx.db.query('evidenceSources').collect()).filter((s) =>
      cited.has(s.sourceId),
    );
    return {
      requestedSlugs: args.slugs.length,
      linkedSlugs: links.length,
      missingSlugs: args.slugs.filter((s) => !links.some((l) => l.slug === s)),
      links: links.map((l) => ({ slug: l.slug, kind: l.kind, sourceIds: l.sourceIds })),
      sources: sources.map((s) => ({
        sourceId: s.sourceId,
        org: s.org,
        orgKey: s.orgKey,
        title: s.title,
        year: s.year ?? null,
        reviewStatus: s.reviewStatus,
        reviewer: s.reviewer ?? null,
        reviewerQualification: s.reviewerQualification ?? null,
      })),
    };
  },
});

export const integrity = internalQuery({
  args: { todayIso: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const today = args.todayIso ?? new Date().toISOString().slice(0, 10);
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
    const orphanLinks = links
      .filter((l) => l.sourceIds.length === 0)
      .map((l) => `${l.kind}:${l.slug}`);

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

    // A reference nothing cites is either a link that was never made or a
    // record that should be retired; either way an operator should see it.
    const citedIds = new Set(links.flatMap((l) => l.sourceIds));
    const unusedSources = sources.filter((s) => !citedIds.has(s.sourceId)).map((s) => s.sourceId);

    // Two records pointing at the same document. Identifier matches are hard
    // duplicates; a title+year match from the same organisation is a candidate
    // a human judges, so the two are reported separately rather than summed.
    const byIdentifier = new Map<string, string[]>();
    const byTitle = new Map<string, string[]>();
    for (const s of sources) {
      const idKey = s.doi
        ? `doi:${s.doi.toLowerCase()}`
        : s.isbn
          ? `isbn:${s.isbn.replace(/[\s-]/g, '').toUpperCase()}`
          : s.pmid
            ? `pmid:${s.pmid}`
            : `url:${s.url.replace(/\/$/, '').toLowerCase()}`;
      byIdentifier.set(idKey, [...(byIdentifier.get(idKey) ?? []), s.sourceId]);
      const tKey = `${s.orgKey}:${s.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()}:${s.year ?? '?'}`;
      byTitle.set(tKey, [...(byTitle.get(tKey) ?? []), s.sourceId]);
    }
    const duplicateIdentifier = [...byIdentifier.entries()].filter(([, ids]) => ids.length > 1);
    const duplicateTitle = [...byTitle.entries()].filter(([, ids]) => ids.length > 1);

    // Expired: OUR review of the record has lapsed. Outdated: the DOCUMENT is
    // old enough that a newer edition should be sought. The second is a
    // scheduling prompt, never a failure — a 2015 guideline is not wrong
    // because it is old.
    const expired: string[] = [];
    const outdated: string[] = [];
    const thisYear = Number(today.slice(0, 4));
    for (const s of sources) {
      const due =
        s.nextReviewDate ??
        ((s.reviewDate ?? s.verifiedOn)
          ? addMonthsIso(
              (s.reviewDate ?? s.verifiedOn) as string,
              REVIEW_CADENCE_MONTHS[s.evidenceLevel] ?? 24,
            )
          : null);
      if (!due || due < today) expired.push(s.sourceId);
      if (s.year === null || thisYear - s.year > (OUTDATED_AFTER_YEARS[s.evidenceLevel] ?? 8)) {
        outdated.push(s.sourceId);
      }
    }

    return {
      todayIso: today,
      sources: sources.length,
      links: links.length,
      linkedSlugs: linkedSlugs.size,
      byStatus,
      approved: byStatus.approved ?? 0,
      awaitingReview: byStatus.awaiting_review ?? 0,
      evidenceRequired: byStatus.evidence_required ?? 0,
      indexProbe,
      danglingLinks,
      orphanLinks,
      unusedSources,
      duplicateIdentifier: duplicateIdentifier.map(([key, ids]) => ({
        key,
        ids,
      })),
      duplicateTitle: duplicateTitle.map(([key, ids]) => ({ key, ids })),
      expired,
      outdated,
      approvedWithoutReviewer,
      publishedContent: publishedContent.length,
      publishedWithoutEvidence,
    };
  },
});
