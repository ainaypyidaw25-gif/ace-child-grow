import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { query } from './_generated/server';
import { contentIsParentReadable } from './lib/publicationVisibility';

const offlineCitationValidator = v.object({
  sourceId: v.string(),
  org: v.string(),
  title: v.string(),
  url: v.string(),
});

const offlineAiContentValidator = v.object({
  _id: v.id('libraryContent'),
  slug: v.string(),
  type: v.string(),
  clinicalStatus: v.string(),
  publicationLane: v.literal('ai_audited'),
  titleMm: v.string(),
  titleEn: v.string(),
  summaryMm: v.optional(v.string()),
  summaryEn: v.optional(v.string()),
  ageGroupKey: v.optional(v.string()),
  domainKey: v.optional(v.string()),
  category: v.optional(v.string()),
  tags: v.array(v.string()),
  difficulty: v.optional(v.string()),
  durationMinutes: v.optional(v.number()),
  data: v.any(),
  source: v.string(),
});

/**
 * A transactionally consistent AI-lane content-and-citation snapshot for an
 * offline download. The caller supplies identity only: all wording, review
 * state and sources are read together from the current server snapshot.
 */
export const getAiSnapshot = query({
  args: {
    slug: v.string(),
    kind: v.string(),
  },
  returns: v.union(
    v.object({ allowed: v.literal(false) }),
    v.object({
      allowed: v.literal(true),
      item: offlineAiContentValidator,
      sources: v.array(offlineCitationValidator),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { allowed: false as const };

    const item = await ctx.db
      .query('libraryContent')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();
    if (
      !item
      || item.type !== args.kind
      || item.clinicalStatus !== 'clinical_review'
      || !item.aiPublicationReleaseId
      || !(await contentIsParentReadable(ctx, item))
    ) {
      return { allowed: false as const };
    }

    const links = await ctx.db
      .query('evidenceLinks')
      .withIndex('by_kind_slug', (q) => q.eq('kind', item.type).eq('slug', item.slug))
      .take(2);
    if (links.length !== 1 || links[0].sourceIds.length === 0) {
      return { allowed: false as const };
    }
    const link = links[0];

    const sources = [];
    for (const sourceId of link.sourceIds) {
      const source = await ctx.db
        .query('evidenceSources')
        .withIndex('by_source_id', (q) => q.eq('sourceId', sourceId))
        .unique();
      if (!source) return { allowed: false as const };
      sources.push({
        sourceId: source.sourceId,
        org: source.org,
        title: source.title,
        url: source.url,
      });
    }

    return {
      allowed: true as const,
      item: {
        _id: item._id,
        slug: item.slug,
        type: item.type,
        clinicalStatus: item.clinicalStatus,
        publicationLane: 'ai_audited' as const,
        titleMm: item.titleMm,
        titleEn: item.titleEn,
        summaryMm: item.summaryMm,
        summaryEn: item.summaryEn,
        ageGroupKey: item.ageGroupKey,
        domainKey: item.domainKey,
        category: item.category,
        tags: item.tags,
        difficulty: item.difficulty,
        durationMinutes: item.durationMinutes,
        data: item.data,
        source: item.source,
      },
      sources,
    };
  },
});
