// Content Library Convex functions.
//
// Read access: published items are visible to any authenticated user; staff see
// everything (all review statuses). Write access (import, review transitions,
// media) is staff-only and audited. The library carries NO per-parent private
// data, so reads are shared catalogue — but still behind authentication.
import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { hasStaffRole, requireContentEditor, requireProfessionalPublisher } from './lib/auth';
import { logAudit } from './audit';
import { resolveEntitlements } from './lib/entitlements';
import { STARTER_ANIMATION_SLUGS } from './animationPlan';

// List content by type, optionally filtered by age/domain/category and a query.
// Non-staff receive only 'published'; staff receive all statuses.
export const listByType = query({
  args: {
    type: v.string(),
    ageGroupKey: v.optional(v.string()),
    domainKey: v.optional(v.string()),
    category: v.optional(v.string()),
    q: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { staff: false, items: [] };
    const staff = await hasStaffRole(ctx, userId, ['owner', 'content_editor', 'clinical_reviewer']);

    let rows = await ctx.db
      .query('libraryContent')
      .withIndex('by_type', (qq) => qq.eq('type', args.type))
      .collect();

    if (args.ageGroupKey) rows = rows.filter((r) => r.ageGroupKey === args.ageGroupKey);
    if (args.domainKey) rows = rows.filter((r) => r.domainKey === args.domainKey);
    if (args.category) rows = rows.filter((r) => r.category === args.category);
    if (!staff) rows = rows.filter((r) => r.clinicalStatus === 'published');
    if (args.q) {
      const needle = args.q.toLowerCase();
      rows = rows.filter((r) => r.searchText.includes(needle));
    }
    // Stable ordering: age order not stored here, so order by slug for determinism.
    rows.sort((a, b) => a.slug.localeCompare(b.slug));
    return { staff, items: rows };
  },
});

// Fetch one item by slug (with its media). Non-staff cannot read unpublished.
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const staff = await hasStaffRole(ctx, userId, ['owner', 'content_editor', 'clinical_reviewer']);
    const item = await ctx.db
      .query('libraryContent')
      .withIndex('by_slug', (qq) => qq.eq('slug', args.slug))
      .unique();
    if (!item) return null;
    if (!staff && item.clinicalStatus !== 'published') return { restricted: true };
    let mediaRows = await ctx.db
      .query('libraryMedia')
      .withIndex('by_content', (qq) => qq.eq('contentSlug', args.slug))
      .take(20);
    if (!staff) {
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
    return { item, media, staff };
  },
});

const uploadedMediaKind = v.union(v.literal('illustration'), v.literal('video'));

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
  args: { q: v.string(), type: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const staff = await hasStaffRole(ctx, userId, ['owner', 'content_editor', 'clinical_reviewer']);
    const needle = args.q.trim().toLowerCase();
    if (!needle) return [];
    let rows = args.type
      ? await ctx.db.query('libraryContent').withIndex('by_type', (qq) => qq.eq('type', args.type as string)).collect()
      : await ctx.db.query('libraryContent').collect();
    if (!staff) rows = rows.filter((r) => r.clinicalStatus === 'published');
    return rows
      .filter((r) => r.searchText.includes(needle))
      .slice(0, 50)
      .map((r) => ({ _id: r._id, slug: r.slug, type: r.type, titleMm: r.titleMm, titleEn: r.titleEn, clinicalStatus: r.clinicalStatus }));
  },
});

// Coverage/stats — powers the admin dashboard and integrity checks.
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    // Staff-only: coverage/status counts (incl. unpublished) are an admin view.
    if (!userId || !(await hasStaffRole(ctx, userId, ['owner', 'content_editor', 'clinical_reviewer']))) {
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

// Idempotent import: upsert by slug. Preserves existing clinicalStatus/reviewer
// on already-imported items (so a re-seed never silently un-publishes reviewed
// content). Staff-only; audited. Replaces media placeholders for the slug.
export const importSeed = mutation({
  args: { items: v.array(seedItemValidator) },
  handler: async (ctx, { items }) => {
    const userId = await requireContentEditor(ctx);
    const now = Date.now();
    let created = 0;
    let updated = 0;
    for (const it of items) {
      const existing = await ctx.db
        .query('libraryContent')
        .withIndex('by_slug', (qq) => qq.eq('slug', it.slug))
        .unique();
      const { media, ...content } = it;
      if (existing) {
        await ctx.db.patch(existing._id, {
          ...content,
          // Never override a human review decision on re-seed.
          clinicalStatus: existing.clinicalStatus,
          reviewerId: existing.reviewerId,
          reviewedAt: existing.reviewedAt,
          nextReviewAt: existing.nextReviewAt,
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
        if (mrow.placeholder && !mrow.storageId && !mrow.url) await ctx.db.delete(mrow._id);
      }
      for (const mref of media) {
        if (existingMedia.some((row) => row.kind === mref.kind && (!row.placeholder || row.storageId || row.url))) continue;
        await ctx.db.insert('libraryMedia', {
          contentSlug: it.slug,
          kind: mref.kind,
          placeholder: mref.placeholder ?? true,
          offline: mref.offline,
          note: mref.note,
        });
      }
    }
    await logAudit(ctx, userId, 'library.import', 'libraryContent', undefined, `created ${created}, updated ${updated}`);
    return { created, updated, total: items.length };
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
  handler: async (ctx, args) => {
    if (!['draft', 'clinical_review', 'published'].includes(args.clinicalStatus)) {
      throw new Error('Invalid status');
    }
    const approval = args.clinicalStatus === 'published'
      ? await requireProfessionalPublisher(ctx)
      : null;
    const userId = approval?.userId ?? await requireContentEditor(ctx);
    const item = await ctx.db
      .query('libraryContent')
      .withIndex('by_slug', (qq) => qq.eq('slug', args.slug))
      .unique();
    if (!item) throw new Error('Not found');
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
    await logAudit(ctx, userId, `library.${args.clinicalStatus}`, 'libraryContent', item._id, item.titleEn);
    return { ok: true, reviewScope: approval?.scope ?? null };
  },
});
