// Content Library Convex functions.
//
// Read access: parents can read only content that a qualified reviewer has
// published. Staff can inspect every workflow status, including archived rows.
// Write access (import, review transitions,
// media) is staff-only and audited. The library carries NO per-parent private
// data, so reads are shared catalogue — but still behind authentication.
import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import {
  hasStaffRole,
  requireClinicalPublisher,
  requireContentEditor,
  requireProfessionalPublisher,
  requireReviewEditor,
} from './lib/auth';
import { logAudit } from './audit';
import { resolveEntitlements } from './lib/entitlements';
import { STARTER_ANIMATION_SLUGS } from './animationPlan';
import { diffEditableContent } from './lib/contentEditDiff';
import { seedAuditSummary, seedMayUpdateExisting, seedMediaIsProtected } from './lib/seedPolicy';
import { findReviewContentMatches } from './lib/reviewSearch';
import { requiredPublicationReviews, specialistReviewReason } from './lib/contentReviewRequirements';
import {
  contentIsParentReadable,
  filterParentReadableContent,
  parentReadableContentResult,
  publicationEvidenceForContent,
} from './lib/publicationVisibility';

export { isPubliclyReadableStatus } from './lib/publicationVisibility';

const protectedContentDataFields = new Set([
  'editorialStatus',
  'evidenceSummary',
  'format',
  'requestedFormat',
  'availability',
  'readingLevel',
  'domains',
  'references',
  'relatedMilestones',
  'relatedLessons',
  'relatedActivities',
]);

function isContentDataRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeEditableContentValue(current: unknown, proposed: unknown): unknown {
  if (typeof current === 'string') return typeof proposed === 'string' ? proposed : current;
  if (Array.isArray(current)) {
    if (!Array.isArray(proposed)) return current;
    if (current.every((entry) => typeof entry === 'string') && proposed.every((entry) => typeof entry === 'string')) {
      return proposed;
    }
    return current.map((entry, index) => mergeEditableContentValue(entry, proposed[index]));
  }
  if (isContentDataRecord(current)) {
    if (!isContentDataRecord(proposed)) return current;
    const next: Record<string, unknown> = { ...current };
    for (const [key, value] of Object.entries(current)) {
      if (protectedContentDataFields.has(key)) continue;
      if (Object.prototype.hasOwnProperty.call(proposed, key)) {
        next[key] = mergeEditableContentValue(value, proposed[key]);
      }
    }
    return next;
  }
  return current;
}

/**
 * The wording editor may change existing text leaves only. Object structure,
 * numeric/boolean configuration, taxonomy, evidence and relationship metadata
 * remain server-owned even when a client calls this mutation directly.
 */
function mergeEditableContentData(current: unknown, proposed: unknown): Record<string, unknown> {
  if (!isContentDataRecord(current) || !isContentDataRecord(proposed)) {
    throw new Error('Content data must be an object');
  }
  return mergeEditableContentValue(current, proposed) as Record<string, unknown>;
}

// List content by type, optionally filtered by age/domain/category and a query.
// Non-staff receive published rows with current approved evidence only; staff
// receive every workflow status.

const PUBLICATION_MANIFEST_LIMIT = 5_000;

/**
 * Complete parent-readable slug manifest used only to withdraw stale offline
 * copies. It contains no draft slug, wording, media or review metadata. If the
 * bounded query ever exceeds its catalogue budget, `complete` is false and the
 * client refuses to delete anything from an incomplete manifest.
 */
export const publicationManifest = query({
  args: {},
  returns: v.object({
    complete: v.boolean(),
    slugs: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { complete: false, slugs: [] };
    const rows = await ctx.db
      .query('libraryContent')
      .withIndex('by_status', (q) => q.eq('clinicalStatus', 'published'))
      .take(PUBLICATION_MANIFEST_LIMIT + 1);
    if (rows.length > PUBLICATION_MANIFEST_LIMIT) return { complete: false, slugs: [] };
    const visibility = await parentReadableContentResult(ctx, rows);
    if (!visibility.complete) return { complete: false, slugs: [] };
    return {
      complete: true,
      slugs: visibility.rows.map((row) => row.slug).sort((a, b) => a.localeCompare(b)),
    };
  },
});

export const listByType = query({
  args: {
    type: v.string(),
    ageGroupKey: v.optional(v.string()),
    domainKey: v.optional(v.string()),
    category: v.optional(v.string()),
    q: v.optional(v.string()),
    audience: v.optional(v.literal('parent')),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { staff: false, items: [] };
    const staff = await hasStaffRole(ctx, userId, ['owner', 'content_editor', 'language_reviewer', 'evidence_reviewer', 'clinical_reviewer']);

    let rows = args.ageGroupKey
      ? await ctx.db
          .query('libraryContent')
          .withIndex('by_type_age', (qq) => qq.eq('type', args.type).eq('ageGroupKey', args.ageGroupKey))
          .collect()
      : args.domainKey
        ? await ctx.db
            .query('libraryContent')
            .withIndex('by_type_domain', (qq) => qq.eq('type', args.type).eq('domainKey', args.domainKey))
            .collect()
        : args.category
          ? await ctx.db
              .query('libraryContent')
              .withIndex('by_type_category', (qq) => qq.eq('type', args.type).eq('category', args.category))
              .collect()
          : await ctx.db
              .query('libraryContent')
              .withIndex('by_type', (qq) => qq.eq('type', args.type))
              .collect();

    if (args.ageGroupKey) rows = rows.filter((r) => r.ageGroupKey === args.ageGroupKey);
    if (args.domainKey) rows = rows.filter((r) => r.domainKey === args.domainKey);
    if (args.category) rows = rows.filter((r) => r.category === args.category);
    const parentAudience = args.audience === 'parent';
    if (parentAudience || !staff) rows = await filterParentReadableContent(ctx, rows);
    if (args.q) {
      const needle = args.q.toLowerCase();
      rows = rows.filter((r) => r.searchText.includes(needle));
    }
    // Stable ordering: age order not stored here, so order by slug for determinism.
    rows.sort((a, b) => a.slug.localeCompare(b.slug));
    return { staff: parentAudience ? false : staff, items: rows };
  },
});

// Fetch one item by slug (with its media). Non-staff can read published items only.
export const getBySlug = query({
  args: { slug: v.string(), audience: v.optional(v.literal('parent')) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const staff = await hasStaffRole(ctx, userId, ['owner', 'content_editor', 'language_reviewer', 'evidence_reviewer', 'clinical_reviewer']);
    const parentAudience = args.audience === 'parent';
    const item = await ctx.db
      .query('libraryContent')
      .withIndex('by_slug', (qq) => qq.eq('slug', args.slug))
      .unique();
    if (!item) return null;
    if ((parentAudience || !staff) && !(await contentIsParentReadable(ctx, item))) {
      return { restricted: true };
    }
    let mediaRows = await ctx.db
      .query('libraryMedia')
      .withIndex('by_content', (qq) => qq.eq('contentSlug', args.slug))
      .take(20);
    if (parentAudience || !staff) {
      const entitlements = await resolveEntitlements(ctx, userId);
      const canViewPremium = entitlements.features.includes('premium_media');
      mediaRows = mediaRows
        .filter((row) => !row.placeholder && row.reviewStatus === 'approved')
        .filter((row) => (row.accessLevel ?? 'free_sample') === 'free_sample' || canViewPremium);
    }
    const media = await Promise.all(mediaRows.map(async (row) => ({
      ...row,
      url: row.storageId ? await ctx.storage.getUrl(row.storageId) : row.url,
    })));
    return { item, media, staff: parentAudience ? false : staff };
  },
});

const uploadedMediaKind = v.union(
  v.literal('illustration'),
  v.literal('animation'),
  v.literal('video'),
);

export const generateMediaUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireContentEditor(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const attachUploadedMedia = mutation({
  args: {
    contentSlug: v.string(),
    kind: uploadedMediaKind,
    storageId: v.id('_storage'),
    altMm: v.string(),
    altEn: v.string(),
    captionMm: v.optional(v.string()),
    captionEn: v.optional(v.string()),
    durationSeconds: v.optional(v.number()),
    transcriptMm: v.optional(v.string()),
    transcriptEn: v.optional(v.string()),
    rightsOwner: v.string(),
    rightsSourceUrl: v.optional(v.string()),
    licenseType: v.string(),
    attributionMm: v.optional(v.string()),
    attributionEn: v.optional(v.string()),
    accessLevel: v.union(v.literal('free_sample'), v.literal('premium')),
    sortOrder: v.optional(v.number()),
    },
  returns: v.object({ ok: v.literal(true) }),
  handler: async (ctx, args) => {
    const userId = await requireContentEditor(ctx);
    const content = await ctx.db
      .query('libraryContent')
      .withIndex('by_slug', (q) => q.eq('slug', args.contentSlug))
      .unique();
    if (!content) throw new Error('Content not found');

    const metadata = await ctx.db.system.get(args.storageId);
    if (!metadata) throw new Error('Uploaded file not found');
    const mimeType = metadata.contentType ?? '';
    const allowed = args.kind === 'illustration'
      ? ['image/jpeg', 'image/png', 'image/webp']
      : ['video/mp4', 'video/webm'];
    const maxBytes = args.kind === 'illustration' ? 5 * 1024 * 1024 : 100 * 1024 * 1024;
    if (!allowed.includes(mimeType) || metadata.size > maxBytes) {
      await ctx.storage.delete(args.storageId);
      throw new Error(args.kind === 'illustration'
        ? 'Use a JPG, PNG, or WebP image up to 5 MB'
        : 'Use an MP4 or WebM video up to 100 MB');
    }

    const rows = await ctx.db
      .query('libraryMedia')
      .withIndex('by_content', (q) => q.eq('contentSlug', args.contentSlug))
      .collect();
    const existing = rows.find((row) => row.kind === args.kind);
    const values = {
      storageId: args.storageId,
      mimeType,
      altMm: args.altMm.trim(),
      altEn: args.altEn.trim(),
      captionMm: args.captionMm?.trim() || undefined,
      captionEn: args.captionEn?.trim() || undefined,
      placeholder: false,
      durationSeconds: args.durationSeconds,
      transcriptMm: args.transcriptMm?.trim() || undefined,
      transcriptEn: args.transcriptEn?.trim() || undefined,
      rightsOwner: args.rightsOwner.trim(),
      rightsSourceUrl: args.rightsSourceUrl?.trim() || undefined,
      licenseType: args.licenseType.trim(),
      attributionMm: args.attributionMm?.trim() || undefined,
      attributionEn: args.attributionEn?.trim() || undefined,
      accessLevel: args.accessLevel,
      sortOrder: args.sortOrder,
      reviewStatus: 'in_review' as const,
      reviewedBy: undefined,
      reviewerQualification: undefined,
      reviewedAt: undefined,
    };
    if (existing) {
      const previousStorageId = existing.storageId;
      await ctx.db.patch(existing._id, values);
      if (previousStorageId && previousStorageId !== args.storageId) {
        await ctx.storage.delete(previousStorageId);
      }
    } else {
      await ctx.db.insert('libraryMedia', {
        contentSlug: args.contentSlug,
        kind: args.kind,
        ...values,
      });
    }
    await logAudit(ctx, userId, 'library.media.attach', 'libraryContent', content._id, `${args.contentSlug}: ${args.kind}`);
    return { ok: true as const };
  },
});

export const approveMedia = mutation({
  args: {
    mediaId: v.id('libraryMedia'),
    nextReviewAt: v.optional(v.number()),
  },
  returns: v.object({ ok: v.literal(true) }),
  handler: async (ctx, args) => {
    const approval = await requireProfessionalPublisher(ctx);
    const media = await ctx.db.get(args.mediaId);
    if (!media || media.placeholder || (!media.storageId && !media.url)) throw new Error('Media asset not found');
    if (!media.rightsOwner?.trim() || !media.licenseType?.trim()) {
      throw new Error('Rights owner and license type are required');
    }
    await ctx.db.patch(args.mediaId, {
      reviewStatus: 'approved',
      reviewedBy: approval.userId,
      reviewerQualification: approval.qualification,
      reviewedAt: Date.now(),
      nextReviewAt: args.nextReviewAt,
    });
    await logAudit(
      ctx,
      approval.userId,
      'library.media.approve',
      'libraryMedia',
      args.mediaId,
      `${media.contentSlug}: ${approval.scope}`,
    );
    return { ok: true as const };
  },
});

export const createStarterAnimationQueue = mutation({
  args: {},
  returns: v.object({ created: v.number(), existing: v.number() }),
  handler: async (ctx) => {
    const userId = await requireContentEditor(ctx);
    let created = 0;
    let existing = 0;
    for (const [sortOrder, contentSlug] of STARTER_ANIMATION_SLUGS.entries()) {
      const content = await ctx.db
        .query('libraryContent')
        .withIndex('by_slug', (q) => q.eq('slug', contentSlug))
        .unique();
      if (!content) continue;
      const rows = await ctx.db
        .query('libraryMedia')
        .withIndex('by_content', (q) => q.eq('contentSlug', contentSlug))
        .take(20);
      if (rows.some((row) => row.kind === 'animation')) {
        existing += 1;
        continue;
      }
      await ctx.db.insert('libraryMedia', {
        contentSlug,
        kind: 'animation',
        placeholder: true,
        offline: true,
        note: 'Original ACE animation production brief — upload, rights check, and professional review required.',
        rightsOwner: 'ACE Child Grow',
        licenseType: 'Original work — all rights reserved',
        reviewStatus: 'planned',
        accessLevel: sortOrder % 5 === 0 ? 'free_sample' : 'premium',
        sortOrder,
      });
      created += 1;
    }
    await logAudit(ctx, userId, 'library.animation_queue.create', 'libraryMedia', undefined, `${created} created, ${existing} existing`);
    return { created, existing };
  },
});

// Cross-type search (for the library search box).
export const search = query({
  args: { q: v.string(), type: v.optional(v.string()), audience: v.optional(v.literal('parent')) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const staff = await hasStaffRole(ctx, userId, ['owner', 'content_editor', 'language_reviewer', 'evidence_reviewer', 'clinical_reviewer']);
    const needle = args.q.trim().toLowerCase();
    if (!needle) return [];
    let rows = args.type
      ? await ctx.db.query('libraryContent').withIndex('by_type', (qq) => qq.eq('type', args.type as string)).collect()
      : await ctx.db.query('libraryContent').collect();
    if (args.audience === 'parent' || !staff) rows = await filterParentReadableContent(ctx, rows);
    return rows
      .filter((r) => r.searchText.includes(needle))
      .slice(0, 50)
      .map((r) => ({ _id: r._id, slug: r.slug, type: r.type, titleMm: r.titleMm, titleEn: r.titleEn, clinicalStatus: r.clinicalStatus }));
  },
});

const reviewFieldMatchValidator = v.object({
  path: v.string(),
  reference: v.string(),
  language: v.union(v.literal('mm'), v.literal('en'), v.literal('neutral')),
  value: v.string(),
});

const reviewSearchResultValidator = v.object({
  slug: v.string(),
  type: v.string(),
  titleMm: v.string(),
  titleEn: v.string(),
  category: v.union(v.string(), v.null()),
  ageGroupKey: v.union(v.string(), v.null()),
  domainKey: v.union(v.string(), v.null()),
  clinicalStatus: v.string(),
  reviewRevision: v.number(),
  matches: v.array(reviewFieldMatchValidator),
});

// Paper/PDF review lookup for staff. It searches exact slugs, bilingual copy,
// and nested field references such as `quiz[1].options[1]`, then returns the
// exact editor path so the owner never has to hunt through a long record.
export const reviewSearch = query({
  args: { q: v.string() },
  returns: v.array(reviewSearchResultValidator),
  handler: async (ctx, args) => {
    await requireReviewEditor(ctx);
    const queryText = args.q.trim();
    if (!queryText) return [];
    // The production catalogue is currently below 400 rows. Keep the read
    // explicitly bounded so this helper cannot become an unbounded scan as the
    // catalogue grows; a later catalogue above this ceiling should move to a
    // dedicated search index and pagination.
    const rows = await ctx.db.query('libraryContent').take(1000);
    return findReviewContentMatches(rows, queryText);
  },
});

const bulkEditItemValidator = v.object({
  slug: v.string(),
  type: v.string(),
  titleMm: v.string(),
  titleEn: v.string(),
  summaryMm: v.optional(v.string()),
  summaryEn: v.optional(v.string()),
  data: v.any(),
  reviewRevision: v.optional(v.number()),
});

// Feeds the bulk find-and-replace tool in the review workspace: the same
// staff who may edit one item's wording (requireReviewEditor, matching
// updateDraft below) can preview and apply a literal find-and-replace across
// every item at once, one updateDraft call per item — reusing that
// mutation's existing revision/audit/review-reset behaviour rather than
// introducing a separate bulk-write path. Same bounded read as reviewSearch.
export const contentForBulkEdit = query({
  args: {},
  returns: v.array(bulkEditItemValidator),
  handler: async (ctx) => {
    await requireReviewEditor(ctx);
    const rows = await ctx.db.query('libraryContent').take(1000);
    return rows.map((row) => ({
      slug: row.slug,
      type: row.type,
      titleMm: row.titleMm,
      titleEn: row.titleEn,
      summaryMm: row.summaryMm,
      summaryEn: row.summaryEn,
      data: row.data,
      reviewRevision: row.reviewRevision,
    }));
  },
});

// Coverage/stats — powers the admin dashboard and integrity checks.
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    // Staff-only: coverage/status counts (incl. unpublished) are an admin view.
    if (!userId || !(await hasStaffRole(ctx, userId, ['owner', 'content_editor', 'language_reviewer', 'evidence_reviewer', 'clinical_reviewer']))) {
      return { allowed: false, total: 0, byType: {}, byStatus: {}, ages: [], domains: [] };
    }
    const rows = await ctx.db.query('libraryContent').collect();
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const ages = new Set<string>();
    const domains = new Set<string>();
    for (const r of rows) {
      byType[r.type] = (byType[r.type] ?? 0) + 1;
      byStatus[r.clinicalStatus] = (byStatus[r.clinicalStatus] ?? 0) + 1;
      if (r.ageGroupKey) ages.add(r.ageGroupKey);
      if (r.domainKey) domains.add(r.domainKey);
    }
    return { allowed: true, total: rows.length, byType, byStatus, ages: [...ages], domains: [...domains] };
  },
});

const seedItemValidator = v.object({
  type: v.string(),
  slug: v.string(),
  ageGroupKey: v.optional(v.string()),
  domainKey: v.optional(v.string()),
  category: v.optional(v.string()),
  titleMm: v.string(),
  titleEn: v.string(),
  summaryMm: v.optional(v.string()),
  summaryEn: v.optional(v.string()),
  tags: v.array(v.string()),
  difficulty: v.optional(v.string()),
  durationMinutes: v.optional(v.number()),
  offline: v.optional(v.boolean()),
  source: v.string(),
  version: v.number(),
  clinicalStatus: v.string(),
  data: v.any(),
  media: v.array(
    v.object({
      kind: v.string(),
      placeholder: v.optional(v.boolean()),
      offline: v.optional(v.boolean()),
      note: v.optional(v.string()),
    }),
  ),
  searchText: v.string(),
});

// Idempotent import: upsert by slug. Published/approved rows are skipped in
// full, including media, so an automated seed can never alter the exact
// artefact a human approved. Staff-only; audited.
export const importSeed = mutation({
  args: { items: v.array(seedItemValidator) },
  returns: v.object({
    created: v.number(),
    updated: v.number(),
    skippedApproved: v.number(),
    total: v.number(),
  }),
  handler: async (ctx, { items }) => {
    const userId = await requireContentEditor(ctx);
    const now = Date.now();
    let created = 0;
    let updated = 0;
    let skippedApproved = 0;
    for (const it of items) {
      const existing = await ctx.db
        .query('libraryContent')
        .withIndex('by_slug', (qq) => qq.eq('slug', it.slug))
        .unique();
      const { media, ...content } = it;
      if (existing) {
        if (!seedMayUpdateExisting(existing.clinicalStatus)) {
          skippedApproved += 1;
          continue;
        }
        await ctx.db.patch(existing._id, {
          ...content,
          // Preserve the workflow state; review decisions remain in the
          // append-only review history rather than on this changed revision.
          clinicalStatus: existing.clinicalStatus,
          // The seed may contain new wording. Preserve old decisions as audit
          // history, but never let them authorize content they did not review.
          reviewRevision: (existing.reviewRevision ?? 1) + 1,
          reviewerId: undefined,
          reviewerQualification: undefined,
          reviewerDisplayName: undefined,
          reviewScope: undefined,
          reviewedAt: undefined,
          nextReviewAt: undefined,
          reviewNote: undefined,
          updatedAt: now,
        });
        updated++;
      } else {
        // Import can NEVER create published content — reaching 'published' is only
        // possible through setReview (the clinical-review workflow). Clamp on insert.
        const clinicalStatus = content.clinicalStatus === 'published' ? 'clinical_review' : content.clinicalStatus;
        await ctx.db.insert('libraryContent', { ...content, clinicalStatus, createdAt: now, updatedAt: now });
        created++;
      }
      // Refresh placeholders without deleting media uploaded by an editor.
      const existingMedia = await ctx.db
        .query('libraryMedia')
        .withIndex('by_content', (qq) => qq.eq('contentSlug', it.slug))
        .collect();
      for (const mrow of existingMedia) {
        if (!seedMediaIsProtected(mrow)) await ctx.db.delete(mrow._id);
      }
      for (const mref of media) {
        if (existingMedia.some((row) => row.kind === mref.kind && seedMediaIsProtected(row))) continue;
        await ctx.db.insert('libraryMedia', {
          contentSlug: it.slug,
          kind: mref.kind,
          placeholder: mref.placeholder ?? true,
          offline: mref.offline,
          note: mref.note,
        });
      }
    }
    await logAudit(
      ctx,
      userId,
      'library.import',
      'libraryContent',
      undefined,
      seedAuditSummary(created, updated, skippedApproved),
    );
    return { created, updated, skippedApproved, total: items.length };
  },
});

// Reviewer-facing editor. Content lives in Convex, not component constants.
// Every edit creates a new review revision and returns the item to review; old
// decisions remain in contentReviews as history but cannot publish this revision.
export const updateDraft = mutation({
  args: {
    slug: v.string(),
    titleMm: v.string(),
    titleEn: v.string(),
    summaryMm: v.optional(v.string()),
    summaryEn: v.optional(v.string()),
    data: v.any(),
    expectedReviewRevision: v.number(),
  },
  returns: v.object({ ok: v.literal(true), reviewRevision: v.number() }),
  handler: async (ctx, args) => {
    // All reviewer roles may correct parent-facing wording directly from the
    // review workspace. This deliberately does not grant publishing, team,
    // billing, evidence-registry or other owner-only permissions. Every save
    // creates a fresh review revision below, so the editor cannot reuse a
    // previous reviewer sign-off for changed text.
    const { userId, access } = await requireReviewEditor(ctx);
    const item = await ctx.db
      .query('libraryContent')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();
    if (!item) throw new Error('Content not found');
    const currentReviewRevision = item.reviewRevision ?? 1;
    if (args.expectedReviewRevision !== currentReviewRevision) {
      throw new Error('This item has newer changes. Refresh before saving.');
    }
    const titleMm = args.titleMm.trim();
    const titleEn = args.titleEn.trim();
    if (!titleMm || !titleEn) throw new Error('Myanmar and English titles are required');
    const summaryMm = args.summaryMm?.trim() || undefined;
    const summaryEn = args.summaryEn?.trim() || undefined;
    const data = mergeEditableContentData(item.data, args.data);
    const reviewRevision = currentReviewRevision + 1;
    const now = Date.now();
    const searchText = [
      titleMm,
      titleEn,
      summaryMm ?? '',
      summaryEn ?? '',
      item.tags.join(' '),
      JSON.stringify(data),
    ].join(' ').toLowerCase();
    const editDiff = diffEditableContent(
      {
        titleMm: item.titleMm,
        titleEn: item.titleEn,
        summaryMm: item.summaryMm,
        summaryEn: item.summaryEn,
        data: item.data,
      },
      { titleMm, titleEn, summaryMm, summaryEn, data },
    );
    await ctx.db.patch(item._id, {
      titleMm,
      titleEn,
      summaryMm,
      summaryEn,
      data,
      searchText,
      reviewRevision,
      clinicalStatus: 'clinical_review',
      reviewerId: undefined,
      reviewerQualification: undefined,
      reviewerDisplayName: undefined,
      reviewScope: undefined,
      reviewedAt: undefined,
      nextReviewAt: undefined,
      reviewNote: undefined,
      updatedAt: now,
    });
    await ctx.db.insert('contentEditLogs', {
      contentId: item._id,
      contentSlug: item.slug,
      fromVersion: currentReviewRevision,
      toVersion: reviewRevision,
      editorId: userId,
      editorDisplayName: access.displayName ?? 'Unnamed staff',
      editorRole: access.role,
      editedAt: now,
      totalChanges: editDiff.totalChanges,
      logTruncated: editDiff.logTruncated,
      changes: editDiff.changes,
    });
    await logAudit(
      ctx,
      userId,
      'library.content.edit',
      'libraryContent',
      item._id,
      `${args.slug} · ${access.role} · review revision ${reviewRevision}`,
      {
        before: JSON.stringify({ titleMm: item.titleMm, titleEn: item.titleEn, reviewRevision: item.reviewRevision ?? 1 }),
        after: JSON.stringify({ titleMm, titleEn, reviewRevision }),
      },
    );
    return { ok: true as const, reviewRevision };
  },
});

// Review transition (draft/clinical_review/published) with reviewer + dates.
export const setReview = mutation({
  args: {
    slug: v.string(),
    clinicalStatus: v.string(),
    reviewerQualification: v.optional(v.string()),
    reviewNote: v.optional(v.string()),
    nextReviewAt: v.optional(v.number()),
  },
  returns: v.object({
    ok: v.literal(true),
    reviewScope: v.union(v.literal('education'), v.literal('clinical'), v.null()),
  }),
  handler: async (ctx, args) => {
    if (!['draft', 'clinical_review', 'published'].includes(args.clinicalStatus)) {
      throw new Error('Invalid status');
    }
    const item = await ctx.db
      .query('libraryContent')
      .withIndex('by_slug', (qq) => qq.eq('slug', args.slug))
      .unique();
    if (!item) throw new Error('Not found');
    const specialistReason = args.clinicalStatus === 'published'
      ? specialistReviewReason(item)
      : null;
    const approval = args.clinicalStatus === 'published'
      ? specialistReason
        ? await requireClinicalPublisher(ctx)
        : await requireProfessionalPublisher(ctx)
      : null;
    const userId = approval?.userId ?? await requireContentEditor(ctx);
    if (args.clinicalStatus === 'published') {
      const revision = item.reviewRevision ?? 1;
      const required = requiredPublicationReviews(item);
      const missing: string[] = [];
      for (const dimension of required) {
        const [latestDecision] = await ctx.db
          .query('contentReviews')
          .withIndex('by_content_dimension_version', (q) =>
            q.eq('contentSlug', args.slug).eq('dimension', dimension).eq('contentVersion', revision),
          )
          .order('desc')
          .take(1);
        if (latestDecision?.decision !== 'approved') missing.push(dimension);
      }
      if (missing.length > 0) {
        throw new Error(`Current revision is missing review approvals: ${missing.join(', ')}`);
      }

      const evidenceGate = await publicationEvidenceForContent(ctx, item);
      if (!evidenceGate.allowed) {
        const details = [
          evidenceGate.unknownSourceIds.length > 0
            ? `unknown: ${evidenceGate.unknownSourceIds.join(', ')}`
            : null,
          evidenceGate.retiredSourceIds.length > 0
            ? `retired: ${evidenceGate.retiredSourceIds.join(', ')}`
            : null,
          evidenceGate.currentApprovedSourceIds.length === 0
            ? 'no current approved source'
            : null,
          evidenceGate.staleApprovedSourceIds.length > 0
            ? `stale approved: ${evidenceGate.staleApprovedSourceIds.join(', ')}`
            : null,
        ].filter(Boolean).join('; ');
        throw new Error(`Evidence is not ready for publication: ${details}`);
      }
    }
    const now = Date.now();
    await ctx.db.patch(item._id, {
      clinicalStatus: args.clinicalStatus,
      reviewerId: userId,
      reviewerQualification: approval?.qualification ?? args.reviewerQualification?.trim(),
      reviewerDisplayName: approval?.reviewerName,
      reviewScope: approval?.scope,
      reviewedAt: now,
      nextReviewAt: args.nextReviewAt,
      reviewNote: args.reviewNote,
      updatedAt: now,
    });
    const auditSummary = specialistReason === 'focused_emergency_wording'
      ? `${item.titleEn} · specialist review limited to emergency wording`
      : specialistReason === 'bed_sharing_wording'
        ? `${item.titleEn} · specialist review required for bed-sharing wording`
        : item.titleEn;
    await logAudit(ctx, userId, `library.${args.clinicalStatus}`, 'libraryContent', item._id, auditSummary);
    return { ok: true as const, reviewScope: approval?.scope ?? null };
  },
});
