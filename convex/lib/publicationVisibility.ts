import type { MutationCtx, QueryCtx } from '../_generated/server';
import {
  evaluatePublicationEvidence,
  type PublicationEvidenceSource,
} from './evidencePublicationGate';
import { todayIsoUtc } from './evidenceFreshness';
import { contentIsAiParentReadable } from './aiPublicationVisibility';
import type { Doc } from '../_generated/dataModel';

type DatabaseContext = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;

const PARENT_VISIBILITY_LINKS_PER_KIND_LIMIT = 5_000;
const PARENT_VISIBILITY_SOURCE_LIMIT = 2_000;

export type PublicationContentIdentity = {
  type: string;
  slug: string;
  clinicalStatus: string;
};

type PublicationEvidenceSnapshot = {
  complete: boolean;
  linkSourceIdsByContent: Map<string, readonly string[]>;
  sourcesById: Map<string, PublicationEvidenceSource>;
  todayIso: string;
};

function contentKey(content: Pick<PublicationContentIdentity, 'type' | 'slug'>): string {
  return `${content.type}\u0000${content.slug}`;
}

export function isPubliclyReadableStatus(status: string): boolean {
  return status === 'published';
}

/** Read the exact evidence dependency set used by both publish and parent reads. */
export async function publicationEvidenceForContent(
  ctx: DatabaseContext,
  content: Pick<PublicationContentIdentity, 'type' | 'slug'>,
  todayIso = todayIsoUtc(),
) {
  const link = await ctx.db
    .query('evidenceLinks')
    .withIndex('by_kind_slug', (q) => q.eq('kind', content.type).eq('slug', content.slug))
    .unique();
  const linkedSources: PublicationEvidenceSource[] = [];
  for (const sourceId of link?.sourceIds ?? []) {
    const source = await ctx.db
      .query('evidenceSources')
      .withIndex('by_source_id', (q) => q.eq('sourceId', sourceId))
      .unique();
    if (source) linkedSources.push(source);
  }
  return evaluatePublicationEvidence(link?.sourceIds ?? [], linkedSources, todayIso);
}

/**
 * Parent visibility is continuously dependent on current evidence, not only
 * on the historical moment at which the content was published.
 */
export async function contentIsParentReadable(
  ctx: DatabaseContext,
  content: PublicationContentIdentity,
  todayIso = todayIsoUtc(),
  now = Date.now(),
): Promise<boolean> {
  if (isPubliclyReadableStatus(content.clinicalStatus)) {
    return (await publicationEvidenceForContent(ctx, content, todayIso)).allowed;
  }
  return await contentIsAiParentReadable(ctx, content as Doc<'libraryContent'>, now, todayIso);
}

/**
 * Bulk parent reads share one bounded evidence snapshot. This avoids issuing
 * one link query plus one source query per citation for every catalogue row.
 * An unexpectedly large catalogue fails closed instead of returning a partial
 * visibility result.
 */
async function publicationEvidenceSnapshot(
  ctx: DatabaseContext,
  rows: readonly PublicationContentIdentity[],
  todayIso: string,
): Promise<PublicationEvidenceSnapshot> {
  const publishedRows = rows.filter((row) => isPubliclyReadableStatus(row.clinicalStatus));
  const relevantKeys = new Set(publishedRows.map(contentKey));
  const kinds = [...new Set(publishedRows.map((row) => row.type))];
  if (relevantKeys.size === 0) {
    return {
      complete: true,
      linkSourceIdsByContent: new Map(),
      sourcesById: new Map(),
      todayIso,
    };
  }

  const linksByKind = await Promise.all(kinds.map(async (kind) => {
    const links = await ctx.db
      .query('evidenceLinks')
      .withIndex('by_kind', (q) => q.eq('kind', kind))
      .take(PARENT_VISIBILITY_LINKS_PER_KIND_LIMIT + 1);
    return links;
  }));
  if (linksByKind.some((links) => links.length > PARENT_VISIBILITY_LINKS_PER_KIND_LIMIT)) {
    return {
      complete: false,
      linkSourceIdsByContent: new Map(),
      sourcesById: new Map(),
      todayIso,
    };
  }

  const linkSourceIdsByContent = new Map<string, readonly string[]>();
  for (const link of linksByKind.flat()) {
    const key = contentKey({ type: link.kind, slug: link.slug });
    if (relevantKeys.has(key)) linkSourceIdsByContent.set(key, link.sourceIds);
  }

  const sources = await ctx.db
    .query('evidenceSources')
    .take(PARENT_VISIBILITY_SOURCE_LIMIT + 1);
  if (sources.length > PARENT_VISIBILITY_SOURCE_LIMIT) {
    return {
      complete: false,
      linkSourceIdsByContent: new Map(),
      sourcesById: new Map(),
      todayIso,
    };
  }
  return {
    complete: true,
    linkSourceIdsByContent,
    sourcesById: new Map(sources.map((source) => [source.sourceId, source])),
    todayIso,
  };
}

function contentIsParentReadableFromSnapshot(
  content: PublicationContentIdentity,
  snapshot: PublicationEvidenceSnapshot,
): boolean {
  if (!isPubliclyReadableStatus(content.clinicalStatus) || !snapshot.complete) return false;
  const linkedSourceIds = snapshot.linkSourceIdsByContent.get(contentKey(content)) ?? [];
  const sources = linkedSourceIds.flatMap((sourceId) => {
    const source = snapshot.sourcesById.get(sourceId);
    return source ? [source] : [];
  });
  return evaluatePublicationEvidence(linkedSourceIds, sources, snapshot.todayIso).allowed;
}

export async function filterParentReadableContent<T extends PublicationContentIdentity>(
  ctx: DatabaseContext,
  rows: readonly T[],
  todayIso = todayIsoUtc(),
  now = Date.now(),
): Promise<T[]> {
  return (await parentReadableContentResult(ctx, rows, todayIso, now)).rows;
}

/**
 * Same batched visibility result with a completeness signal for callers such
 * as the offline withdrawal manifest. A caller must never interpret a bounded
 * snapshot overflow as an authoritative empty catalogue.
 */
export async function parentReadableContentResult<T extends PublicationContentIdentity>(
  ctx: DatabaseContext,
  rows: readonly T[],
  todayIso = todayIsoUtc(),
  now = Date.now(),
): Promise<{ complete: boolean; rows: T[] }> {
  const snapshot = await publicationEvidenceSnapshot(ctx, rows, todayIso);
  if (!snapshot.complete) return { complete: false, rows: [] };
  const visibility = await Promise.all(rows.map(async (row) => (
    isPubliclyReadableStatus(row.clinicalStatus)
      ? contentIsParentReadableFromSnapshot(row, snapshot)
      : await contentIsAiParentReadable(ctx, row as unknown as Doc<'libraryContent'>, now, todayIso)
  )));
  return {
    complete: true,
    rows: rows.filter((_, index) => visibility[index]),
  };
}
