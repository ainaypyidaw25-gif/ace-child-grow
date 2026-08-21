import { v } from 'convex/values';
import {
  internalMutation,
  internalQuery,
  type MutationCtx,
  type QueryCtx,
} from './_generated/server';
import type { Doc } from './_generated/dataModel';
import seedData from './seedData.json';
import { logAudit } from './audit';
import { aiPublicationTargetKey } from './lib/aiPublicationPolicy';
import {
  REMAINING_PSEUDO_MILESTONE_RETIREMENT_RELEASE_ID,
  REMAINING_PSEUDO_MILESTONE_RETIREMENT_TARGETS,
  type RemainingPseudoMilestoneMediaPreimage,
  type RemainingPseudoMilestoneRetirementTarget,
} from './lib/remainingPseudoMilestoneRetirementData';

type DatabaseContext = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;

const releaseId = REMAINING_PSEUDO_MILESTONE_RETIREMENT_RELEASE_ID;
const releaseNote = `Retired by ${releaseId}`;
const targetSlugs = new Set(
  REMAINING_PSEUDO_MILESTONE_RETIREMENT_TARGETS.map((target) => target.slug),
);
const localSeedSlugs = new Set(
  (seedData as Array<{ slug: string }>).map((item) => item.slug),
);

const phaseValidator = v.union(
  v.literal('ready'),
  v.literal('blocked'),
  v.literal('applied'),
);

const targetStateValidator = v.object({
  id: v.string(),
  type: v.string(),
  slug: v.string(),
  contentRows: v.number(),
  linkRows: v.number(),
  clinicalStatus: v.union(v.string(), v.null()),
  reviewRevision: v.union(v.number(), v.null()),
  contentUpdatedAt: v.union(v.number(), v.null()),
  linkUpdatedAt: v.union(v.number(), v.null()),
  sourceIds: v.array(v.string()),
  mediaRows: v.number(),
  mediaIds: v.array(v.string()),
  mediaExact: v.boolean(),
  reviewRows: v.number(),
  aiReleaseRows: v.number(),
  aiPublicationReleaseId: v.union(v.string(), v.null()),
  aiPublishedAt: v.union(v.number(), v.null()),
  localSeedExcluded: v.boolean(),
  initialMatches: v.boolean(),
  desiredMatches: v.boolean(),
});

const preflightResultValidator = v.object({
  releaseId: v.literal(REMAINING_PSEUDO_MILESTONE_RETIREMENT_RELEASE_ID),
  phase: phaseValidator,
  releaseAuditFound: v.boolean(),
  blockers: v.array(v.string()),
  targets: v.array(targetStateValidator),
});

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function mediaRowMatches(
  row: Doc<'libraryMedia'>,
  expected: RemainingPseudoMilestoneMediaPreimage,
): boolean {
  const actual = row as unknown as Record<string, unknown>;
  const expectedDocument: Record<string, unknown> = {
    _id: expected.id,
    _creationTime: expected.creationTime,
    contentSlug: expected.contentSlug,
    kind: expected.kind,
    accessLevel: expected.accessLevel,
    licenseType: expected.licenseType,
    note: expected.note,
    offline: expected.offline,
    placeholder: expected.placeholder,
    reviewStatus: expected.reviewStatus,
    rightsOwner: expected.rightsOwner,
    sortOrder: expected.sortOrder,
  };
  const actualKeys = Object.keys(actual).sort((left, right) => left.localeCompare(right));
  const expectedKeys = Object.keys(expectedDocument).sort((left, right) => left.localeCompare(right));
  return sameStrings(actualKeys, expectedKeys)
    && expectedKeys.every((key) => actual[key] === expectedDocument[key]);
}

function mediaRowsMatch(
  rows: readonly Doc<'libraryMedia'>[],
  expectedRows: readonly RemainingPseudoMilestoneMediaPreimage[],
): boolean {
  if (rows.length !== expectedRows.length) return false;
  const rowsById = new Map(rows.map((row) => [String(row._id), row]));
  return expectedRows.every((expected) => {
    const row = rowsById.get(expected.id);
    return row !== undefined && mediaRowMatches(row, expected);
  });
}

async function releaseAuditState(ctx: DatabaseContext): Promise<{
  found: boolean;
  contentUpdatedAt: number | null;
}> {
  const rows = await ctx.db
    .query('auditLogs')
    .withIndex('by_action', (q) => q.eq('action', 'release.remaining_pseudo_milestones'))
    .take(20);
  const row = rows.find((candidate) => candidate.summary === releaseId && candidate.result === 'ok');
  if (!row) return { found: false, contentUpdatedAt: null };
  try {
    const detail = JSON.parse(row.after ?? '{}') as { contentUpdatedAt?: unknown };
    return {
      found: true,
      contentUpdatedAt: typeof detail.contentUpdatedAt === 'number'
        ? detail.contentUpdatedAt
        : null,
    };
  } catch {
    return { found: true, contentUpdatedAt: null };
  }
}

async function targetState(
  ctx: DatabaseContext,
  target: RemainingPseudoMilestoneRetirementTarget,
  desiredContentUpdatedAt: number | null,
) {
  const [contentRows, linkRows, mediaRows, reviewRows, aiReleaseRows] = await Promise.all([
    ctx.db.query('libraryContent').withIndex('by_slug', (q) =>
      q.eq('slug', target.slug)).take(2),
    ctx.db.query('evidenceLinks').withIndex('by_kind_slug', (q) =>
      q.eq('kind', target.type).eq('slug', target.slug)).take(2),
    ctx.db.query('libraryMedia').withIndex('by_content', (q) =>
      q.eq('contentSlug', target.slug)).take(target.expectedMediaCount + 1),
    ctx.db.query('contentReviews').withIndex('by_content', (q) =>
      q.eq('contentSlug', target.slug)).take(101),
    ctx.db.query('aiPublicationReleases').withIndex('by_target_key', (q) =>
      q.eq('targetKey', aiPublicationTargetKey(target.type, target.slug)))
      .take(target.expectedAiReleaseCount + 1),
  ]);
  const content = contentRows.length === 1 ? contentRows[0] : null;
  const link = linkRows.length === 1 ? linkRows[0] : null;
  const mediaExact = mediaRowsMatch(mediaRows, target.expectedMediaRows);
  const reviewRevision = content ? (content.reviewRevision ?? 1) : null;
  const commonMatches = Boolean(
    content
      && link
      && String(content._id) === target.id
      && content.type === target.type
      && String(link._id) === target.linkId
      && link.kind === target.type
      && link.updatedAt === target.expectedLinkUpdatedAt
      && sameStrings(link.sourceIds, target.expectedSourceIds)
      && mediaExact
      && aiReleaseRows.length === target.expectedAiReleaseCount
      && content.aiPublicationReleaseId === undefined
      && content.aiPublishedAt === undefined,
  );
  const initialMatches = commonMatches
    && content?.clinicalStatus === target.expectedClinicalStatus
    && reviewRevision === target.expectedReviewRevision
    && content.updatedAt === target.expectedUpdatedAt;
  const desiredMatches = commonMatches
    && content?.clinicalStatus === 'archived'
    && reviewRevision === target.expectedReviewRevision
    && content.reviewNote === releaseNote
    && content.reviewerId === undefined
    && content.reviewerQualification === undefined
    && content.reviewerDisplayName === undefined
    && content.reviewScope === undefined
    && content.reviewedAt === undefined
    && content.nextReviewAt === undefined
    && (desiredContentUpdatedAt === null || content.updatedAt === desiredContentUpdatedAt);

  return {
    id: target.id,
    type: target.type,
    slug: target.slug,
    contentRows: contentRows.length,
    linkRows: linkRows.length,
    clinicalStatus: content?.clinicalStatus ?? null,
    reviewRevision,
    contentUpdatedAt: content?.updatedAt ?? null,
    linkUpdatedAt: link?.updatedAt ?? null,
    sourceIds: link ? [...link.sourceIds] : [],
    mediaRows: mediaRows.length,
    mediaIds: mediaRows.map((row) => String(row._id)).sort((left, right) => left.localeCompare(right)),
    mediaExact,
    reviewRows: reviewRows.length,
    aiReleaseRows: aiReleaseRows.length,
    aiPublicationReleaseId: content?.aiPublicationReleaseId ?? null,
    aiPublishedAt: content?.aiPublishedAt ?? null,
    localSeedExcluded: !localSeedSlugs.has(target.slug),
    initialMatches,
    desiredMatches,
  };
}

async function preflightState(ctx: DatabaseContext) {
  const audit = await releaseAuditState(ctx);
  const targets = await Promise.all(
    REMAINING_PSEUDO_MILESTONE_RETIREMENT_TARGETS.map((target) =>
      targetState(ctx, target, audit.contentUpdatedAt)),
  );
  const auditFound = audit.found;
  const blockers: string[] = [];
  if (targetSlugs.size !== 23) blockers.push('release target set is not exactly 23 unique slugs');
  if (auditFound && audit.contentUpdatedAt === null) {
    blockers.push('release audit is missing its exact content updatedAt postimage');
  }
  for (const target of targets) {
    if (!target.localSeedExcluded) blockers.push(`target remains in local seed: ${target.slug}`);
    if (target.reviewRows > 100) blockers.push(`review history exceeds safety bound: ${target.slug}`);
  }
  const localExcluded = targets.every((target) => target.localSeedExcluded);
  const safetyBoundsMatch = targetSlugs.size === 23
    && targets.every((target) => target.reviewRows <= 100);
  const allInitial = targets.every((target) => target.initialMatches);
  const allDesired = targets.every((target) => target.desiredMatches);
  let phase: 'ready' | 'blocked' | 'applied' = 'blocked';
  if (auditFound && audit.contentUpdatedAt !== null && allDesired && localExcluded
    && safetyBoundsMatch) phase = 'applied';
  else if (!auditFound && allInitial && localExcluded && safetyBoundsMatch) phase = 'ready';
  else {
    if (auditFound && !allDesired) blockers.push('release audit exists but desired postimages drifted');
    if (!auditFound && !allInitial) blockers.push('production preimages drifted');
    if (!auditFound && allDesired) blockers.push('desired postimages exist without the release audit');
  }
  if (blockers.length > 0) phase = 'blocked';
  return {
    releaseId,
    phase,
    releaseAuditFound: auditFound,
    blockers: [...new Set(blockers)].sort((left, right) => left.localeCompare(right)),
    targets,
  };
}

/** Read-only exact-state preflight for the bounded 23-row retirement. */
export const preflight = internalQuery({
  args: {
    releaseId: v.literal(REMAINING_PSEUDO_MILESTONE_RETIREMENT_RELEASE_ID),
  },
  returns: preflightResultValidator,
  handler: async (ctx) => preflightState(ctx),
});

/**
 * Atomically archives the exact 23 unsupported milestone rows. Evidence links,
 * media and append-only human review history are deliberately left untouched.
 */
export const apply = internalMutation({
  args: {
    releaseId: v.literal(REMAINING_PSEUDO_MILESTONE_RETIREMENT_RELEASE_ID),
  },
  returns: v.object({
    releaseId: v.literal(REMAINING_PSEUDO_MILESTONE_RETIREMENT_RELEASE_ID),
    applied: v.boolean(),
    alreadyApplied: v.boolean(),
    retired: v.number(),
    publishedWithdrawn: v.number(),
    unpublishedArchived: v.number(),
    linksPreserved: v.number(),
    mediaPreserved: v.number(),
    reviewRowsPreserved: v.number(),
  }),
  handler: async (ctx) => {
    const before = await preflightState(ctx);
    if (before.phase === 'applied') {
      return {
        releaseId,
        applied: false,
        alreadyApplied: true,
        retired: 0,
        publishedWithdrawn: 0,
        unpublishedArchived: 0,
        linksPreserved: before.targets.length,
        mediaPreserved: before.targets.reduce((sum, target) => sum + target.mediaRows, 0),
        reviewRowsPreserved: before.targets.reduce((sum, target) => sum + target.reviewRows, 0),
      };
    }
    if (before.phase !== 'ready') {
      throw new Error(`Remaining pseudo-milestone retirement preflight blocked: ${before.blockers.join('; ')}`);
    }

    const validated: Array<{
      target: RemainingPseudoMilestoneRetirementTarget;
      content: Doc<'libraryContent'>;
    }> = [];
    for (const target of REMAINING_PSEUDO_MILESTONE_RETIREMENT_TARGETS) {
      const rows = await ctx.db.query('libraryContent').withIndex('by_slug', (q) =>
        q.eq('slug', target.slug)).take(2);
      if (rows.length !== 1 || String(rows[0]._id) !== target.id) {
        throw new Error(`Retirement target identity changed after preflight: ${target.slug}`);
      }
      validated.push({ target, content: rows[0] });
    }

    const now = Date.now();
    for (const { target, content } of validated) {
      await ctx.db.patch(content._id, {
        clinicalStatus: 'archived',
        reviewerId: undefined,
        reviewerQualification: undefined,
        reviewerDisplayName: undefined,
        reviewScope: undefined,
        reviewedAt: undefined,
        nextReviewAt: undefined,
        reviewNote: releaseNote,
        aiPublicationReleaseId: undefined,
        aiPublishedAt: undefined,
        updatedAt: now,
      });
      await logAudit(
        ctx,
        null,
        'library.remaining_pseudo_milestone.retired',
        'libraryContent',
        content._id,
        `${releaseId} · ${target.slug}`,
        {
          before: JSON.stringify({
            clinicalStatus: target.expectedClinicalStatus,
            reviewRevision: target.expectedReviewRevision,
            updatedAt: target.expectedUpdatedAt,
            linkId: target.linkId,
            linkSourceIds: target.expectedSourceIds,
          }),
          after: JSON.stringify({
            clinicalStatus: 'archived',
            reviewRevision: target.expectedReviewRevision,
            evidenceLinkPreserved: true,
          }),
        },
      );
    }

    const after = await preflightState(ctx);
    if (!after.targets.every((target) => target.desiredMatches)) {
      throw new Error('Remaining pseudo-milestone retirement postimage validation failed; transaction rolled back');
    }

    const publishedWithdrawn = REMAINING_PSEUDO_MILESTONE_RETIREMENT_TARGETS.filter(
      (target) => target.expectedClinicalStatus === 'published',
    ).length;
    await logAudit(
      ctx,
      null,
      'release.remaining_pseudo_milestones',
      'libraryContent',
      undefined,
      releaseId,
      {
        result: 'ok',
        before: JSON.stringify({
          targets: validated.length,
          published: publishedWithdrawn,
          unpublished: validated.length - publishedWithdrawn,
        }),
        after: JSON.stringify({
          archived: validated.length,
          linksPreserved: after.targets.length,
          mediaPreserved: after.targets.reduce((sum, target) => sum + target.mediaRows, 0),
          reviewRowsPreserved: after.targets.reduce((sum, target) => sum + target.reviewRows, 0),
          contentUpdatedAt: now,
        }),
      },
    );

    const completed = await preflightState(ctx);
    if (completed.phase !== 'applied') {
      throw new Error('Remaining pseudo-milestone retirement completion audit validation failed; transaction rolled back');
    }
    return {
      releaseId,
      applied: true,
      alreadyApplied: false,
      retired: validated.length,
      publishedWithdrawn,
      unpublishedArchived: validated.length - publishedWithdrawn,
      linksPreserved: after.targets.length,
      mediaPreserved: after.targets.reduce((sum, target) => sum + target.mediaRows, 0),
      reviewRowsPreserved: after.targets.reduce((sum, target) => sum + target.reviewRows, 0),
    };
  },
});
