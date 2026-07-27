import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { hasStaffRole, requireClinicalPublisher, requireContentEditor } from './lib/auth';
import { logAudit } from './audit';

// Mirror of src/domain/content/workflow.ts (convex functions can't import src/).
const TRANSITIONS: Record<string, string[]> = {
  draft: ['content_review', 'archived'],
  content_review: ['translation_review', 'draft', 'archived'],
  translation_review: ['clinical_review', 'content_review', 'archived'],
  clinical_review: ['approved', 'translation_review', 'archived'],
  approved: ['published', 'clinical_review', 'archived'],
  published: ['approved', 'archived'],
  archived: ['draft'],
};

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    // Behind authentication, like every other catalogue read in this codebase.
    // Nothing here is private — these are approved milestone and lesson titles —
    // and a signed-out caller only ever saw published rows. But a live probe
    // found this to be the one read a stranger could reach, and an exception to
    // a rule is how the rule stops being checked. Signed out is signed out.
    if (!userId) return { staff: false, items: [] };
    const staff = await hasStaffRole(ctx, userId, ['owner', 'content_editor', 'clinical_reviewer']);
    const all = await ctx.db.query('contentItems').collect();
    // Non-staff see only published items; staff see everything.
    return { staff, items: staff ? all : all.filter((i) => i.reviewStatus === 'published') };
  },
});

// Idempotent seed so the Admin CMS has content to manage. Staff-only; every item
// starts in clinical_review (never published without the review workflow below).
export const seedIfEmpty = mutation({
  args: {
    items: v.array(v.object({ kind: v.string(), titleMm: v.string(), titleEn: v.string() })),
  },
  handler: async (ctx, { items }) => {
    await requireContentEditor(ctx);
    const existing = await ctx.db.query('contentItems').take(1);
    if (existing.length > 0) return;
    for (const it of items) {
      await ctx.db.insert('contentItems', { ...it, reviewStatus: 'clinical_review' });
    }
  },
});

export const transition = mutation({
  args: {
    id: v.id('contentItems'),
    to: v.string(),
    reviewerQualification: v.optional(v.string()),
  },
  handler: async (ctx, { id, to, reviewerQualification }) => {
    const approval = ['approved', 'published'].includes(to)
      ? await requireClinicalPublisher(ctx)
      : null;
    const userId = approval?.userId ?? await requireContentEditor(ctx);
    const item = await ctx.db.get(id);
    if (!item) throw new Error('Not found');
    const allowed = TRANSITIONS[item.reviewStatus] ?? [];
    if (!allowed.includes(to)) throw new Error(`Invalid transition ${item.reviewStatus} -> ${to}`);
    await ctx.db.patch(id, {
      reviewStatus: to,
      ...(approval?.qualification || reviewerQualification?.trim()
        ? { reviewerQualification: approval?.qualification ?? reviewerQualification?.trim() }
        : {}),
      ...(approval ? { reviewerId: approval.userId, reviewScope: approval.scope } : {}),
    });
    // All content transitions (esp. publish) are audited.
    await logAudit(ctx, userId, `content.${to}`, 'contentItems', id, item.titleEn);
  },
});

// Translation review: staff edit the mm/en pair and move its translation state.
// Clinical content still cannot be published without the review workflow above.
export const setTranslation = mutation({
  args: {
    id: v.id('contentItems'),
    bodyMm: v.optional(v.string()),
    bodyEn: v.optional(v.string()),
    translationStatus: v.string(),
    translationNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireContentEditor(ctx);
    const { id, ...patch } = args;
    await ctx.db.patch(id, patch);
    await logAudit(ctx, userId, `translation.${args.translationStatus}`, 'contentItems', id);
  },
});
