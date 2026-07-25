// One-shot admin seeding of the content library from a JSON snapshot generated
// from src/content/seed. This is an INTERNAL mutation — it can only be invoked
// by the Convex CLI/admin (`npx convex run seed:run`), never by app clients, so
// it safely skips the staff auth gate that guards the public importSeed. It is
// idempotent (upsert by slug) and never overrides an existing review decision.
import { internalMutation } from './_generated/server';
import { logAudit } from './audit';
import seedData from './seedData.json';

type Media = { kind: string; placeholder?: boolean; offline?: boolean; note?: string };
type Item = {
  type: string; slug: string; ageGroupKey?: string; domainKey?: string; category?: string;
  titleMm: string; titleEn: string; summaryMm?: string; summaryEn?: string; tags: string[];
  difficulty?: string; durationMinutes?: number; offline?: boolean; source: string;
  version: number; clinicalStatus: string; data: unknown; media: Media[]; searchText: string;
};

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const items = seedData as unknown as Item[];
    const now = Date.now();
    let created = 0;
    let updated = 0;
    for (const it of items) {
      const { media, ...content } = it;
      const existing = await ctx.db
        .query('libraryContent')
        .withIndex('by_slug', (q) => q.eq('slug', it.slug))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, {
          ...content,
          clinicalStatus: existing.clinicalStatus,
          reviewerId: existing.reviewerId,
          reviewedAt: existing.reviewedAt,
          nextReviewAt: existing.nextReviewAt,
          updatedAt: now,
        });
        updated++;
      } else {
        await ctx.db.insert('libraryContent', { ...content, createdAt: now, updatedAt: now });
        created++;
      }
      const existingMedia = await ctx.db
        .query('libraryMedia')
        .withIndex('by_content', (q) => q.eq('contentSlug', it.slug))
        .collect();
      for (const mrow of existingMedia) await ctx.db.delete(mrow._id);
      for (const mref of media) {
        await ctx.db.insert('libraryMedia', {
          contentSlug: it.slug,
          kind: mref.kind,
          placeholder: mref.placeholder ?? true,
          offline: mref.offline,
          note: mref.note,
        });
      }
    }
    await logAudit(ctx, null, 'library.seed', 'libraryContent', undefined, `created ${created}, updated ${updated}`);
    return { created, updated, total: items.length };
  },
});
