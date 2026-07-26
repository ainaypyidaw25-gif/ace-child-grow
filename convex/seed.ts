// One-shot admin seeding of the content library from a JSON snapshot generated
// from src/content/seed. This is an INTERNAL mutation — it can only be invoked
// by the Convex CLI/admin (`npx convex run seed:run`), never by app clients, so
// it safely skips the staff auth gate that guards the public importSeed. It is
// idempotent (upsert by slug) and never overrides an existing review decision.
import { internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { logAudit } from './audit';
import seedData from './seedData.json';

// Grant staff (CMS access) to an account by email. INTERNAL — CLI/admin only,
// never callable from the app. Used to bootstrap the first reviewer account.
export const grantStaffByEmail = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('email', (q) => q.eq('email', email.trim().toLowerCase()))
      .unique();
    if (!user) return { ok: false, reason: 'no such user' };
    const profile = await ctx.db
      .query('parentProfiles')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .unique();
    if (profile) {
      await ctx.db.patch(profile._id, { isStaff: true, staffRole: 'owner' });
    } else {
      await ctx.db.insert('parentProfiles', {
        userId: user._id,
        preferredLocale: 'mm',
        isStaff: true,
        staffRole: 'owner',
      });
    }
    await logAudit(ctx, user._id, 'staff.grant', 'parentProfiles', user._id, email);
    return { ok: true, userId: user._id };
  },
});

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
        // Seeding can never create published content (clinical-review gate).
        const clinicalStatus = content.clinicalStatus === 'published' ? 'clinical_review' : content.clinicalStatus;
        await ctx.db.insert('libraryContent', { ...content, clinicalStatus, createdAt: now, updatedAt: now });
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
