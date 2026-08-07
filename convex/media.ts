import { v } from 'convex/values';
import { query } from './_generated/server';
import { requireUser } from './lib/auth';
import { resolveEntitlements } from './lib/entitlements';
import { canReadLibraryContent } from './library';

export const listForContent = query({
  args: { contentSlug: v.string() },
  returns: v.array(v.object({
    id: v.id('libraryMedia'),
    kind: v.string(),
    url: v.union(v.string(), v.null()),
    storageUrl: v.union(v.string(), v.null()),
    mimeType: v.union(v.string(), v.null()),
    altMm: v.union(v.string(), v.null()),
    altEn: v.union(v.string(), v.null()),
    captionMm: v.union(v.string(), v.null()),
    captionEn: v.union(v.string(), v.null()),
    transcriptMm: v.union(v.string(), v.null()),
    transcriptEn: v.union(v.string(), v.null()),
    durationSeconds: v.union(v.number(), v.null()),
    attributionMm: v.union(v.string(), v.null()),
    attributionEn: v.union(v.string(), v.null()),
    accessLevel: v.union(v.literal('free_sample'), v.literal('premium')),
  })),
  handler: async (ctx, { contentSlug }) => {
    const userId = await requireUser(ctx);
    // Content gate: media attached to unpublished content must never reach a
    // non-staff caller, even when the media row itself is 'approved'. Media
    // approval and content publication are SEPARATE gates — an approved asset on
    // a draft/clinical_review item is still pre-publication. Mirrors the gate in
    // library.getBySlug so this parallel endpoint cannot bypass it.
    const content = await ctx.db
      .query('libraryContent')
      .withIndex('by_slug', (q) => q.eq('slug', contentSlug))
      .unique();
    if (!content || !(await canReadLibraryContent(ctx, userId, content))) return [];
    const entitlements = await resolveEntitlements(ctx, userId);
    const canViewPremium = entitlements.features.includes('premium_media');
    const rows = await ctx.db
      .query('libraryMedia')
      .withIndex('by_content', (q) => q.eq('contentSlug', contentSlug))
      .take(20);
    const visible = rows
      .filter((row) => !row.placeholder && row.reviewStatus === 'approved')
      .filter((row) => (row.accessLevel ?? 'free_sample') === 'free_sample' || canViewPremium)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return await Promise.all(visible.map(async (row) => ({
      id: row._id,
      kind: row.kind,
      url: row.url ?? null,
      storageUrl: row.storageId ? await ctx.storage.getUrl(row.storageId) : null,
      mimeType: row.mimeType ?? null,
      altMm: row.altMm ?? null,
      altEn: row.altEn ?? null,
      captionMm: row.captionMm ?? null,
      captionEn: row.captionEn ?? null,
      transcriptMm: row.transcriptMm ?? null,
      transcriptEn: row.transcriptEn ?? null,
      durationSeconds: row.durationSeconds ?? null,
      attributionMm: row.attributionMm ?? null,
      attributionEn: row.attributionEn ?? null,
      accessLevel: row.accessLevel ?? 'free_sample',
    })));
  },
});
