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
import {
  evidenceDateValidationProblem,
  evidenceIsExpired,
  evidenceIsOutdated,
  todayIsoUtc,
} from './lib/evidenceFreshness';
import {
  evaluatePublicationEvidence,
  publicationEvidenceIsEligible,
} from './lib/evidencePublicationGate';
import { contentIsParentReadable } from './lib/publicationVisibility';
import { isRetiredContentSlug } from './lib/contentRetirements';
import {
  evidenceImportReviewFields,
  evidenceImportReviewPolicy,
} from './lib/evidenceImportPolicy';
import { unprotectedCitationGapKeys } from './lib/evidenceImportSafety';
import { isInherentPublicLinkCasTarget } from './lib/inherentPublicLinkCasData';
import { isSwaimanSeizureLinkCasTarget } from './lib/swaimanSeizureLinkCasData';
import { isSwaimanCerebralPalsyLinkCasTarget } from './lib/swaimanCerebralPalsyLinkCasData';
import { isAsqDoctorVisitsLinkCasTarget } from './lib/asqDoctorVisitsLinkCasData';
import { isBirth2mNutritionCasTarget } from './lib/birth2mNutritionCasData';
import {
  isClinicalTwoSmallCasSource,
  isClinicalTwoSmallCasTarget,
} from './lib/clinicalTwoSmallCasGuard';
import { isManualReviewEvidenceLinkCasTarget } from './lib/manualReviewEvidenceLinkCasData';
import {
  isBirth2mGrossMotorCorrectionLink,
  isBirth2mGrossMotorCorrectionSource,
} from './lib/birth2mGrossMotorCorrection';
import {
  isSwaimanSuddenWeaknessLinkCasTarget,
  isSwaimanSuddenWeaknessSourceCasTarget,
} from './lib/swaimanSuddenWeaknessCasData';
import {
  isOlderSafety2026LinkTarget,
  isOlderSafety2026SourceTarget,
} from './lib/olderSafety2026CasData';
import {
  isRegisteredReleaseContentTarget,
  isRegisteredReleaseSourceId,
  isPersistedReleaseGovernedContent,
  isPersistedReleaseGovernedSource,
} from './lib/clinicalReviewBatchProvenance';
import {
  isClinicalBlockerCasSource,
  isGdBirth2mEmotionalCasLink,
  isUnicefSeenCountedConsumer,
} from './lib/clinicalBlockerCasData';

const REVIEW_STATUSES = [
  'evidence_required',
  'awaiting_review',
  'in_review',
  'approved',
  'retired',
] as const;

const reviewStatusValidator = v.union(
  v.literal('evidence_required'),
  v.literal('awaiting_review'),
  v.literal('in_review'),
  v.literal('approved'),
  v.literal('retired'),
);

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
  reviewStatus: reviewStatusValidator,
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

const sourceImportResultValidator = v.object({
  created: v.number(),
  updated: v.number(),
  unchanged: v.number(),
  reviewReset: v.number(),
  reviewResetIds: v.array(v.string()),
  invalidatedContentKeys: v.array(v.string()),
  skipped: v.number(),
  failed: v.number(),
  failedIds: v.array(v.string()),
});

const linkImportResultValidator = v.object({
  created: v.number(),
  updated: v.number(),
  unchanged: v.number(),
  invalidatedContentKeys: v.array(v.string()),
  skipped: v.number(),
  failed: v.number(),
  failedKeys: v.array(v.string()),
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

type EvidenceDependency = { kind: string; slug: string };

export function evidenceDependencyInvalidationPatch(
  currentReviewRevision: number | undefined,
  now: number,
) {
  return {
    reviewRevision: (currentReviewRevision ?? 1) + 1,
    clinicalStatus: 'clinical_review' as const,
    reviewerId: undefined,
    reviewerQualification: undefined,
    reviewerDisplayName: undefined,
    reviewScope: undefined,
    reviewedAt: undefined,
    nextReviewAt: undefined,
    reviewNote: undefined,
    updatedAt: now,
  };
}

/**
 * A changed evidence dependency invalidates every prior content decision for
 * that exact revision. Revision bumps retain the append-only decisions as
 * history while making them unusable for publication, and immediately remove
 * a published row from parent visibility until named humans review it again.
 */
async function invalidateDependentContentReviews(
  ctx: MutationCtx,
  dependencies: readonly EvidenceDependency[],
  actorId: Id<'users'> | null,
  reason: string,
  now: number,
): Promise<string[]> {
  const wanted = new Set(dependencies.map(({ kind, slug }) => `${kind}:${slug}`));
  if (wanted.size === 0) return [];

  const libraryRows = await ctx.db.query('libraryContent').take(5_001);
  if (libraryRows.length > 5_000) {
    throw new Error('Evidence dependency invalidation exceeded the 5,000-content safety bound');
  }

  const invalidated: string[] = [];
  for (const row of libraryRows) {
    const key = `${row.type}:${row.slug}`;
    if (!wanted.has(key) || row.clinicalStatus === 'archived') continue;
    const fromRevision = row.reviewRevision ?? 1;
    const patch = evidenceDependencyInvalidationPatch(row.reviewRevision, now);
    const toRevision = patch.reviewRevision;
    await ctx.db.patch(row._id, patch);
    await logAudit(
      ctx,
      actorId,
      'library.evidence_dependency_invalidated',
      'libraryContent',
      row._id,
      `${key} · ${reason} · review revision ${fromRevision} → ${toRevision}`,
      {
        before: JSON.stringify({ clinicalStatus: row.clinicalStatus, reviewRevision: fromRevision }),
        after: JSON.stringify({ clinicalStatus: 'clinical_review', reviewRevision: toRevision }),
      },
    );
    invalidated.push(key);
  }
  return invalidated.sort((a, b) => a.localeCompare(b));
}

/**
 * Published rows are parent-visible, but `forContent` deliberately exposes
 * approved sources only. A link to awaiting or retired evidence therefore does
 * not make a parent-visible citation. Keep this calculation separate from the
 * database query so the exact release rule can be regression-tested.
 */
export function publishedSlugsWithoutApprovedEvidence(
  publishedSlugs: readonly string[],
  links: readonly { slug: string; sourceIds: readonly string[] }[],
  sources: readonly {
    sourceId: string;
    reviewStatus: string;
    evidenceLevel: string;
    year: number | null;
    reviewDate?: string | null;
    nextReviewDate: string | null;
    verifiedOn: string | null;
  }[],
  todayIso: string,
): string[] {
  const sourceById = new Map(sources.map((source) => [source.sourceId, source]));
  return [...publishedSlugs]
    .filter((slug) => {
      const sourceIds = [...new Set(
        links.filter((link) => link.slug === slug).flatMap((link) => [...link.sourceIds]),
      )];
      return !evaluatePublicationEvidence(
        sourceIds,
        sourceIds.flatMap((sourceId) => {
          const source = sourceById.get(sourceId);
          return source ? [source] : [];
        }),
        todayIso,
      ).allowed;
    })
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Evidence links for archived library rows are deliberately retained as audit
 * history, but they are no longer part of the active source registry that an
 * import or release check should compare with. Anything that is not bound to
 * an archived library row remains active, including safety-rule and hope-topic
 * links that do not have a libraryContent row.
 */
export function evidenceLinkReadinessCounts(
  links: readonly { kind: string; slug: string }[],
  libraryRows: readonly { type: string; slug: string; clinicalStatus: string }[],
): {
  activeLinks: number;
  activeLinkedSlugs: number;
  preservedArchivedLinks: string[];
} {
  const archivedKeys = new Set(
    libraryRows
      .filter((row) => row.clinicalStatus === 'archived')
      .map((row) => `${row.type}:${row.slug}`),
  );
  const activeKeys: string[] = [];
  const preservedArchivedLinks: string[] = [];
  for (const link of links) {
    const key = `${link.kind}:${link.slug}`;
    if (archivedKeys.has(key)) preservedArchivedLinks.push(key);
    else activeKeys.push(key);
  }
  return {
    activeLinks: activeKeys.length,
    activeLinkedSlugs: new Set(activeKeys).size,
    preservedArchivedLinks: preservedArchivedLinks.sort((a, b) => a.localeCompare(b)),
  };
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
    if (!userId || !(await hasStaffRole(ctx, userId, ['owner', 'content_editor', 'evidence_reviewer', 'clinical_reviewer']))) return EMPTY_LIST;

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
    if (!userId || !(await hasStaffRole(ctx, userId, ['owner', 'content_editor', 'evidence_reviewer', 'clinical_reviewer']))) return null;
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
    // Content gate: if this slug is a library content item that is not yet
    // published, a non-staff caller must not see its citations — that would
    // disclose the existence and evidence base of unreleased content. Slugs with
    // no libraryContent row (safety_rule, hope_topic) are inherently public
    // safety references and remain visible. Mirrors library.getBySlug.
    const staff = await hasStaffRole(ctx, userId, ['owner', 'content_editor', 'language_reviewer', 'evidence_reviewer', 'clinical_reviewer']);
    const content = await ctx.db
      .query('libraryContent')
      .withIndex('by_slug', (qq) => qq.eq('slug', args.slug))
      .unique();
    const contentReadable = content ? await contentIsParentReadable(ctx, content) : false;
    const aiAuditedContent = Boolean(
      content
      && content.clinicalStatus === 'clinical_review'
      && content.aiPublicationReleaseId
      && contentReadable,
    );
    if (!staff && content && !contentReadable) {
      return { allowed: true as const, sources: [] };
    }
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
      // Conventional publications expose only human-approved citations. The
      // separate AI-audited educational lane may expose its exact linked source
      // snapshots after the shared fail-closed AI gate validates every one.
      if (
        src
        && (
          aiAuditedContent
          || (
            src.reviewStatus === 'approved'
            && (staff || publicationEvidenceIsEligible(src, todayIsoUtc()))
          )
        )
      ) {
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
    if (!userId || !(await hasStaffRole(ctx, userId, ['owner', 'content_editor', 'evidence_reviewer', 'clinical_reviewer']))) {
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
 * An identical re-import preserves a human decision. A materially changed
 * publisher record invalidates that decision and returns the source to
 * awaiting_review; a structurally incomplete record is forced to
 * evidence_required. This prevents an approval from silently moving onto a
 * different evidence payload.
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
  let reviewReset = 0;
  const reviewResetIds: string[] = [];
  let skipped = 0;
  const failed: string[] = [];

  // A second copy of the same sourceId inside one payload would silently
  // overwrite the first; report it as skipped rather than importing twice.
  const seen = new Set<string>();

  for (const src of sources) {
    const { id, ...rest } = src;
    // Compile-time exact-CAS exclusions must short-circuit before any database
    // read. Besides keeping stale imports harmless, this lets bounded release
    // handlers prove that protected sources cannot even reach source lookup.
    if (isRegisteredReleaseSourceId(id)
      || isSwaimanSuddenWeaknessSourceCasTarget(id)
      || isOlderSafety2026SourceTarget(id)
      || isBirth2mGrossMotorCorrectionSource(id)
      || isClinicalBlockerCasSource(id)
      || isClinicalTwoSmallCasSource(id)) {
      skipped += 1;
      continue;
    }
    if (await isPersistedReleaseGovernedSource(ctx, id)) {
      skipped += 1;
      continue;
    }
    if (seen.has(id)) {
      skipped += 1;
      continue;
    }
    seen.add(id);

    try {
      const incomingDateProblem = evidenceDateValidationProblem(rest, todayIsoUtc());
      if (incomingDateProblem) throw new Error(`Invalid evidence dates: ${incomingDateProblem}`);
      const existing = await ctx.db
        .query('evidenceSources')
        .withIndex('by_source_id', (qq) => qq.eq('sourceId', id))
        .unique();
      const searchText = searchTextFor(rest);

      if (existing) {
        // Retired means immutable audit history. A new publisher snapshot may
        // be imported under a new source id, but this exact retired row is
        // never rewritten by a registry refresh.
        if (existing.reviewStatus === 'retired') {
          unchanged += 1;
          continue;
        }
        const {
          reviewStatus: _incomingReviewStatus,
          reviewer: _incomingReviewer,
          reviewDate: _incomingReviewDate,
          nextReviewDate: incomingNextReviewDate,
          ...incomingMetadata
        } = rest;
        // These imported review fields are intentionally discarded: only the
        // policy below may decide whether a stored human review survives.
        void _incomingReviewStatus;
        void _incomingReviewer;
        void _incomingReviewDate;
        const metadata = {
          ...incomingMetadata,
          sourceId: id,
          searchText,
        };
        const metadataChanged = !sameSource(existing, metadata);
        const policy = evidenceImportReviewPolicy(
          existing.reviewStatus,
          rest.reviewStatus,
          metadataChanged,
          incomingNextReviewDate !== null
            && incomingNextReviewDate !== existing.nextReviewDate,
        );
        const reviewFields = evidenceImportReviewFields(
          existing,
          rest.reviewStatus,
          metadataChanged,
          incomingNextReviewDate,
        );
        const next = {
          ...metadata,
          ...reviewFields,
        };
        const preservedDateProblem = evidenceDateValidationProblem(next, todayIsoUtc());
        if (preservedDateProblem) {
          throw new Error(`Invalid preserved evidence dates: ${preservedDateProblem}`);
        }
        // 'updated' should mean something changed. Counting an identical
        // re-import as an update makes an idempotent run look like a rewrite
        // of all 90 records, which is exactly the thing an operator is
        // watching for.
        if (sameSource(existing, next)) {
          unchanged += 1;
        } else {
          await ctx.db.patch(existing._id, { ...next, updatedAt: now });
          updated += 1;
          if (policy.resetReview) {
            reviewReset += 1;
            reviewResetIds.push(id);
          }
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

  const resetIdSet = new Set(reviewResetIds);
  let invalidatedContentKeys: string[] = [];
  if (resetIdSet.size > 0) {
    const linkSnapshot = await ctx.db.query('evidenceLinks').take(5_001);
    if (linkSnapshot.length > 5_000) {
      throw new Error('Evidence source invalidation exceeded the 5,000-link safety bound');
    }
    const dependencies = linkSnapshot
      .filter((link) => link.sourceIds.some((sourceId) => resetIdSet.has(sourceId)))
      .map((link) => ({ kind: link.kind, slug: link.slug }));
    const sourceSnapshot = await ctx.db.query('evidenceSources').take(2_001);
    if (sourceSnapshot.length > 2_000) {
      throw new Error('Evidence source safety preflight exceeded the 2,000-source bound');
    }
    const librarySnapshot = await ctx.db.query('libraryContent').take(5_001);
    if (librarySnapshot.length > 5_000) {
      throw new Error('Evidence source safety preflight exceeded the 5,000-content bound');
    }
    const citationGaps = unprotectedCitationGapKeys(
      linkSnapshot.filter((link) =>
        link.sourceIds.some((sourceId) => resetIdSet.has(sourceId))),
      sourceSnapshot,
      new Set(librarySnapshot.map((row) => row.slug)),
      todayIsoUtc(),
    );
    if (citationGaps.length > 0) {
      throw new Error(
        'Evidence import would remove the last eligible citation from inherently public content: '
          + citationGaps.slice(0, 20).join(', '),
      );
    }
    invalidatedContentKeys = await invalidateDependentContentReviews(
      ctx,
      dependencies,
      userId,
      `source review reset: ${reviewResetIds.join(', ')}`,
      now,
    );
  }

  const summary = `created ${created}, updated ${updated}, unchanged ${unchanged}, review-reset ${reviewReset}, content-invalidated ${invalidatedContentKeys.length}, skipped ${skipped}, failed ${failed.length}`;
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
      after: `${summary}; reset ids: ${reviewResetIds.join(', ') || 'none'}; invalidated content: ${invalidatedContentKeys.join(', ') || 'none'}`,
    },
  );
  return {
    created,
    updated,
    unchanged,
    reviewReset,
    reviewResetIds,
    invalidatedContentKeys,
    skipped,
    failed: failed.length,
    failedIds: failed,
  };
}

export const importSources = mutation({
  args: { sources: v.array(sourceValidator) },
  returns: sourceImportResultValidator,
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
  returns: sourceImportResultValidator,
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
  let skipped = 0;
  // Historical production links remain preserved by exact releases. Stale or
  // generic clients may neither recreate retired edges nor mutate inherently
  // public rows reserved for bounded atomic CAS releases. Filter
  // before validation and before any link write.
  const activeLinks: Infer<typeof linkValidator>[] = [];
  for (const link of links) {
    if (!await isPersistedReleaseGovernedContent(ctx, link.slug)
      && !isRegisteredReleaseContentTarget(link.kind, link.slug)
      && !isRetiredContentSlug(link.slug)
      && !isInherentPublicLinkCasTarget(link.kind, link.slug)
      && !isSwaimanSeizureLinkCasTarget(link.kind, link.slug)
      && !isSwaimanCerebralPalsyLinkCasTarget(link.kind, link.slug)
      && !isAsqDoctorVisitsLinkCasTarget(link.kind, link.slug)
      && !isBirth2mNutritionCasTarget(link.kind, link.slug)
      && !isClinicalTwoSmallCasTarget(link.kind, link.slug)
      && !isBirth2mGrossMotorCorrectionLink(link.kind, link.slug)
      && !isManualReviewEvidenceLinkCasTarget(link.kind, link.slug)
      && !isSwaimanSuddenWeaknessLinkCasTarget(link.kind, link.slug)
      && !isOlderSafety2026LinkTarget(link.kind, link.slug)
      && !isGdBirth2mEmotionalCasLink(link.kind, link.slug)
      && !isUnicefSeenCountedConsumer(link.kind, link.slug)) {
      activeLinks.push(link);
    } else {
      skipped += 1;
    }
  }
  const sourceSnapshot = await ctx.db.query('evidenceSources').take(2_001);
  if (sourceSnapshot.length > 2_000) {
    throw new Error('Evidence link import exceeded the 2,000-source safety bound');
  }
  const known = new Set(sourceSnapshot.map((r) => r.sourceId));

  const unknown = [...new Set(activeLinks.flatMap((l) => l.sourceIds).filter((id) => !known.has(id)))];
  if (unknown.length > 0) {
    throw new Error(`Unknown reference ids: ${unknown.slice(0, 10).join(', ')}`);
  }
  const empty = activeLinks.filter((l) => l.sourceIds.length === 0);
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
  const failed: string[] = [];
  const changedLinks: EvidenceDependency[] = [];
  const seen = new Set<string>();

  for (const link of activeLinks) {
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
          changedLinks.push({ kind: link.kind, slug: link.slug });
        }
      } else {
        await ctx.db.insert('evidenceLinks', {
          ...link,
          createdAt: now,
          updatedAt: now,
        });
        created += 1;
        changedLinks.push({ kind: link.kind, slug: link.slug });
      }
    } catch {
      failed.push(key);
    }
  }

  const invalidatedContentKeys = await invalidateDependentContentReviews(
    ctx,
    changedLinks,
    userId,
    'evidence link set changed',
    now,
  );
  const summary = `created ${created}, updated ${updated}, unchanged ${unchanged}, content-invalidated ${invalidatedContentKeys.length}, skipped ${skipped}, failed ${failed.length}`;
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
      after: `${summary}; invalidated content: ${invalidatedContentKeys.join(', ') || 'none'}`,
    },
  );
  return {
    created,
    updated,
    unchanged,
    invalidatedContentKeys,
    skipped,
    failed: failed.length,
    failedKeys: failed,
  };
}

export const importLinks = mutation({
  args: { links: v.array(linkValidator) },
  returns: linkImportResultValidator,
  handler: async (ctx, { links }) =>
    applyLinks(ctx, links, await requireEvidenceEditor(ctx), 'admin screen'),
});

/** CLI-only counterpart to importLinks. See importSourcesFromCli. */
export const importLinksFromCli = internalMutation({
  args: { links: v.array(linkValidator) },
  returns: linkImportResultValidator,
  handler: async (ctx, { links }) => applyLinks(ctx, links, null, 'deploy key (CLI)'),
});

/**
 * Record a professional evidence-review decision on one reference. This is the
 * ONLY path to 'approved', it requires a named and qualified reviewer, and it is audited —
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
    nextReviewDate?: string;
    note?: string;
  },
  row: {
    reviewStatus: string;
    evidenceLevel?: string;
    year?: number | null;
    verifiedOn?: string | null;
    reviewDate?: string | null;
    nextReviewDate?: string | null;
  } | null,
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
  if (args.note && args.note.trim().length > 2_000) {
    return { code: 'note_too_long', message: 'Reviewer note must be 2,000 characters or fewer' };
  }
  const dateProblem = evidenceDateValidationProblem({
    verifiedOn: null,
    reviewDate: args.reviewDate,
    nextReviewDate: args.nextReviewDate ?? null,
  }, todayIsoUtc());
  if (dateProblem === 'review_date_invalid') {
    return { code: dateProblem, message: 'Review date must be a real date in YYYY-MM-DD format' };
  }
  if (dateProblem === 'review_date_future') {
    return { code: dateProblem, message: 'Review date cannot be in the future' };
  }
  if (dateProblem === 'next_review_date_invalid') {
    return { code: dateProblem, message: 'Next review date must be a real date in YYYY-MM-DD format' };
  }
  if (dateProblem === 'next_review_date_before_anchor') {
    return { code: dateProblem, message: 'Next review date cannot be before the review date' };
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
  if (args.status === 'approved') {
    if (!row.verifiedOn || !row.evidenceLevel || row.year === undefined) {
      return {
        code: 'source_metadata_incomplete',
        message: 'Reference verification metadata is incomplete; re-import a verified source before approving',
      };
    }
    const storedDateProblem = evidenceDateValidationProblem({
      verifiedOn: row.verifiedOn,
      reviewDate: row.reviewDate ?? null,
      nextReviewDate: row.nextReviewDate ?? null,
    }, todayIsoUtc());
    if (storedDateProblem) {
      return {
        code: 'source_date_invalid',
        message: `Reference date metadata is invalid: ${storedDateProblem}`,
      };
    }
    if (row.nextReviewDate && row.nextReviewDate < todayIsoUtc()) {
      return {
        code: 'source_review_overdue',
        message: 'The publisher or prior review date is overdue; refresh the source metadata before approving',
      };
    }
    if (
      evidenceIsOutdated({ evidenceLevel: row.evidenceLevel, year: row.year }, todayIsoUtc())
      && !args.note?.trim()
    ) {
      return {
        code: 'outdated_note_required',
        message:
          'This source is old enough to check for a replacement. Record why it remains appropriate, or use a newer source.',
      };
    }
    if (
      row.nextReviewDate
      && args.nextReviewDate
      && args.nextReviewDate > row.nextReviewDate
    ) {
      return {
        code: 'next_review_exceeds_source_due',
        message: 'A reviewer cannot extend the publisher or existing source review deadline',
      };
    }
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

    if (await isPersistedReleaseGovernedSource(ctx, args.sourceId)) {
      return refuse(
        'frozen_release_governed',
        'This source belongs to a frozen release. Invalidate and refreeze the exact batch before changing it.',
        row ? `${row.reviewStatus} / ${row.reviewer ?? 'no reviewer'}` : 'unchanged',
      );
    }

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

    const reviewNote = args.note?.trim() || undefined;
    const outdatedAdvisory = args.status === 'approved'
      && evidenceIsOutdated({ evidenceLevel: row.evidenceLevel ?? '', year: row.year ?? null }, todayIsoUtc());
    const before = `${row.reviewStatus} / ${row.reviewer ?? 'no reviewer'} / ${row.reviewDate ?? 'no date'}`;
    await ctx.db.patch(row._id, {
      reviewStatus: args.status,
      reviewer: reviewArgs.reviewer.trim(),
      reviewerQualification: reviewArgs.reviewerQualification.trim(),
      reviewDate: args.reviewDate,
      nextReviewDate: row.nextReviewDate ?? args.nextReviewDate ?? null,
      reviewNote,
      reviewerId: userId,
      reviewScope: approval?.scope,
      updatedAt: Date.now(),
    });
    const after = `${args.status} / ${reviewArgs.reviewer.trim()} (${reviewArgs.reviewerQualification.trim()}) / ${args.reviewDate}${reviewNote ? ` / note: ${reviewNote}` : ''}`;

    await logAudit(
      ctx,
      userId,
      'evidence.setReview',
      'evidenceSources',
      args.sourceId,
      `${row.reviewStatus} → ${args.status} by ${reviewArgs.reviewer.trim()} (${reviewArgs.reviewerQualification.trim()})${outdatedAdvisory ? ' · outdated-source advisory acknowledged in reviewer note' : ''}`,
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
    nextReviewDate: v.optional(v.string()),
    note: v.optional(v.string()),
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

    const libraryContent = await ctx.db.query('libraryContent').collect();
    const publishedContent = libraryContent.filter(
      (c) => c.clinicalStatus === 'published',
    );
    const linkedSlugs = new Set(links.map((l) => l.slug));
    const linkReadiness = evidenceLinkReadinessCounts(links, libraryContent);
    const publishedWithoutEvidence = publishedContent
      .filter((c) => !linkedSlugs.has(c.slug))
      .map((c) => c.slug);
    const publishedWithoutApprovedEvidence = publishedSlugsWithoutApprovedEvidence(
      publishedContent.map((content) => content.slug),
      links,
      sources,
      today,
    );

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
    for (const s of sources) {
      if (evidenceIsExpired(s, today)) expired.push(s.sourceId);
      if (evidenceIsOutdated(s, today)) {
        outdated.push(s.sourceId);
      }
    }

    return {
      todayIso: today,
      sources: sources.length,
      links: links.length,
      linkedSlugs: new Set(links.map((l) => `${l.kind}:${l.slug}`)).size,
      activeLinks: linkReadiness.activeLinks,
      activeLinkedSlugs: linkReadiness.activeLinkedSlugs,
      preservedArchivedLinks: linkReadiness.preservedArchivedLinks,
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
      publishedWithoutApprovedEvidence,
    };
  },
});
