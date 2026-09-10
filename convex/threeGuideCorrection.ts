import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  type QueryCtx,
  type MutationCtx,
} from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { logAudit } from "./audit";
import { canonicalJson, sha256Canonical } from "./lib/aiAuditHash";
import { CLINICAL_REVIEW_BATCH_REGISTRY } from "./lib/clinicalReviewBatchData";
import { isRegisteredReleaseContentTarget } from "./lib/clinicalReviewBatchProvenance";
import {
  correctedGuide,
  guideSourceMetadata,
  guideStablePostimage,
  sortedGuideRows,
  THREE_GUIDE_SLUGS,
} from "./lib/threeGuideCorrectionHelpers";
import {
  THREE_GUIDE_IDENTITY as identity,
  THREE_GUIDE_TARGETS as targets,
  THREE_GUIDE_NEW_SOURCES as newSources,
  THREE_GUIDE_PRESERVATION as preservation,
  THREE_GUIDE_SCHEDULES as schedules,
  THREE_GUIDE_CAPTURED_AT as capturedAt,
  THREE_GUIDE_APPLY_BEFORE as applyBefore,
} from "./lib/threeGuideCorrectionData";

type Context = Pick<QueryCtx, "db"> | Pick<MutationCtx, "db">;
const action = "release.three_guide_unpublished_correction";
const identityValidators = {
  releaseId: v.literal(identity.releaseId),
  snapshotSha256: v.literal(identity.snapshotSha256),
  proposalSha256: v.literal(identity.proposalSha256),
  sourceProposalSha256: v.literal(identity.sourceProposalSha256),
};
function assertIdentity(args: Record<keyof typeof identity, string>) {
  if (canonicalJson(args) !== canonicalJson(identity))
    throw new Error("Guide correction identity mismatch");
  if (
    canonicalJson(targets.map((t) => t.slug)) !==
      canonicalJson(THREE_GUIDE_SLUGS) ||
    newSources.length !== 14
  )
    throw new Error("Guide correction manifest scope mismatch");
}
type SourceBinding = { sourceId: string; id: string; fullHash: string };
const beforeJson = () =>
  JSON.stringify({
    ...identity,
    targets: targets.map((t) => ({
      slug: t.slug,
      initialFullHash: t.initialFullHash,
      initialLinkHash: t.initialLinkHash,
      fromRevision: t.revision,
      toRevision: t.revision + 1,
    })),
  });
const afterJson = (updatedAt: number, sourceBindings: SourceBinding[]) =>
  JSON.stringify({
    ...identity,
    updatedAt,
    sourceBindings,
    targets: targets.map((t) => ({
      slug: t.slug,
      desiredStableHash: t.desiredStableHash,
      desiredLinkStableHash: t.desiredLinkStableHash,
    })),
    humanDecisionsCreated: 0,
    publicationDecisionsMade: 0,
  });

async function preservedRows(
  ctx: Context,
  d: { table: string; index: string; key: string; count: number },
) {
  const { table, index, key, count } = d;
  switch (table) {
    case "libraryContent":
      return ctx.db
        .query("libraryContent")
        .withIndex("by_slug", (q) => q.eq("slug", key))
        .take(count + 1);
    case "evidenceLinks":
      return ctx.db
        .query("evidenceLinks")
        .withIndex("by_slug", (q) => q.eq("slug", key))
        .take(count + 1);
    case "evidenceSources":
      return ctx.db
        .query("evidenceSources")
        .withIndex("by_source_id", (q) => q.eq("sourceId", key))
        .take(count + 1);
    case "contentReviews":
      return ctx.db
        .query("contentReviews")
        .withIndex("by_content", (q) => q.eq("contentSlug", key))
        .take(count + 1);
    case "contentEditLogs":
      return ctx.db
        .query("contentEditLogs")
        .withIndex("by_content", (q) => q.eq("contentSlug", key))
        .take(count + 1);
    case "libraryMedia":
      return ctx.db
        .query("libraryMedia")
        .withIndex("by_content", (q) => q.eq("contentSlug", key))
        .take(count + 1);
    case "clinicalReviewAssignments":
      return ctx.db
        .query("clinicalReviewAssignments")
        .withIndex("by_exact_target", (q) => q.eq("contentSlug", key))
        .take(count + 1);
    case "clinicalReviewBatches":
      return ctx.db
        .query("clinicalReviewBatches")
        .withIndex("by_batch_id", (q) => q.eq("batchId", key))
        .take(count + 1);
    case "clinicalReviewBatchReceipts":
      return ctx.db
        .query("clinicalReviewBatchReceipts")
        .withIndex("by_batch_id", (q) => q.eq("batchId", key))
        .take(count + 1);
    case "aiPublicationConfig":
      return ctx.db
        .query("aiPublicationConfig")
        .withIndex("by_key", (q) => q.eq("key", "global"))
        .take(count + 1);
    case "aiPublicationReleases":
      return index === "by_status"
        ? ctx.db
            .query("aiPublicationReleases")
            .withIndex("by_status", (q) => q.eq("status", "active"))
            .take(count + 1)
        : ctx.db
            .query("aiPublicationReleases")
            .withIndex("by_target_key", (q) => q.eq("targetKey", key))
            .take(count + 1);
    case "aiAuditRuns":
      return index === "by_release_id"
        ? ctx.db
            .query("aiAuditRuns")
            .withIndex("by_release_id", (q) => q.eq("releaseId", key))
            .take(count + 1)
        : ctx.db
            .query("aiAuditRuns")
            .withIndex("by_run_id", (q) => q.eq("runId", key))
            .take(count + 1);
    case "aiContentAudits":
      return index === "by_run_id"
        ? ctx.db
            .query("aiContentAudits")
            .withIndex("by_run_id", (q) => q.eq("runId", key))
            .take(count + 1)
        : ctx.db
            .query("aiContentAudits")
            .withIndex("by_content_revision_and_updated_at", (q) =>
              q.eq("contentSlug", key),
            )
            .take(count + 1);
    case "aiEvidenceAudits":
      return ctx.db
        .query("aiEvidenceAudits")
        .withIndex("by_run_id", (q) => q.eq("runId", key))
        .take(count + 1);
    case "auditLogs":
      return ctx.db
        .query("auditLogs")
        .withIndex("by_action", (q) => q.eq("action", key))
        .take(count + 1);
    default:
      throw new Error("Unknown guide preservation descriptor");
  }
}
const normalizedUrl = (url: string) =>
  url
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
async function inspect(ctx: Context, now: number) {
  const blockers: string[] = [];
  const receipts = await ctx.db
    .query("auditLogs")
    .withIndex("by_action", (q) => q.eq("action", action))
    .take(2);
  const receipt = receipts.length === 1 ? receipts[0] : null;
  let updatedAt: number | null = null,
    sourceBindings: SourceBinding[] = [];
  try {
    const parsed = JSON.parse(receipt?.after ?? "{}");
    if (
      typeof parsed.updatedAt === "number" &&
      Number.isFinite(parsed.updatedAt) &&
      parsed.updatedAt >= capturedAt &&
      parsed.updatedAt < applyBefore &&
      Array.isArray(parsed.sourceBindings) &&
      parsed.sourceBindings.length === 14 &&
      parsed.sourceBindings.every(
        (b: SourceBinding, i: number) =>
          b.sourceId === newSources[i].metadata.sourceId &&
          typeof b.id === "string" &&
          /^[a-f0-9]{64}$/.test(b.fullHash),
      )
    ) {
      updatedAt = parsed.updatedAt;
      sourceBindings = parsed.sourceBindings;
    }
  } catch {
    /* malformed receipt remains blocked */
  }
  const receiptExact = Boolean(
    receipt &&
    updatedAt !== null &&
    receipt.actorId === undefined &&
    receipt.entityTable === "libraryContent" &&
    receipt.entityId === undefined &&
    receipt.summary === identity.releaseId &&
    receipt.result === "ok" &&
    receipt.before === beforeJson() &&
    receipt.after === afterJson(updatedAt, sourceBindings),
  );
  if (receipts.length > 1 || (receipt && !receiptExact))
    blockers.push("Correction receipt duplicated or malformed");
  const preserved = await Promise.all(
    preservation.map(async (d) => {
      const rows = await preservedRows(ctx, d);
      return (
        rows.length === d.count &&
        (await sha256Canonical(sortedGuideRows<{ _id: unknown }>(rows))) ===
          d.hash
      );
    }),
  );
  const scheduled = await Promise.all(
    schedules.map(async (s) => {
      const row = await ctx.db.system.get(s.id as Id<"_scheduled_functions">);
      return Boolean(row && (await sha256Canonical(row)) === s.hash);
    }),
  );
  const preservationExact =
    preserved.every(Boolean) && scheduled.every(Boolean);
  if (!preservationExact)
    blockers.push("Pinned source/history/media/AI/governance state changed");
  // No URL/title index exists. This explicitly bounded metadata registry scan is
  // only an alias/duplicate check, never a customer table scan or write target.
  const registry = await ctx.db.query("evidenceSources").take(1001);
  if (
    registry.length > 1000 ||
    new Set(registry.map((r) => r.sourceId)).size !== registry.length
  )
    blockers.push("Source registry bound or duplicate ID");
  const sourceChecks = await Promise.all(
    newSources.map(async (d, i) => {
      const rows = registry.filter(
        (r) =>
          r.sourceId === d.metadata.sourceId ||
          normalizedUrl(r.url) === normalizedUrl(d.metadata.url) ||
          r.title.toLowerCase() === d.metadata.title.toLowerCase(),
      );
      const row = rows.length === 1 ? rows[0] : null;
      const absent = rows.length === 0;
      const exact = Boolean(
        receiptExact &&
        row &&
        row.sourceId === d.metadata.sourceId &&
        row._id === sourceBindings[i]?.id &&
        row.createdAt === updatedAt &&
        row.updatedAt === updatedAt &&
        (await sha256Canonical(guideSourceMetadata(row))) === d.metadataHash &&
        (await sha256Canonical(row)) === sourceBindings[i]?.fullHash,
      );
      return { absent, exact };
    }),
  );
  if (!sourceChecks.every((s) => (receiptExact ? s.exact : s.absent)))
    blockers.push(
      "New source collision, metadata drift, or unreceipted registration",
    );
  const inspected = await Promise.all(
    targets.map(async (target) => {
      const [contents, links, assignments, releases, audits] =
        await Promise.all([
          ctx.db
            .query("libraryContent")
            .withIndex("by_slug", (q) => q.eq("slug", target.slug))
            .take(2),
          ctx.db
            .query("evidenceLinks")
            .withIndex("by_slug", (q) => q.eq("slug", target.slug))
            .take(2),
          ctx.db
            .query("clinicalReviewAssignments")
            .withIndex("by_exact_target", (q) =>
              q.eq("contentSlug", target.slug),
            )
            .take(1),
          ctx.db
            .query("aiPublicationReleases")
            .withIndex("by_target_key", (q) =>
              q.eq("targetKey", "guide\0" + target.slug),
            )
            .take(1),
          ctx.db
            .query("aiContentAudits")
            .withIndex("by_content_revision_and_updated_at", (q) =>
              q.eq("contentSlug", target.slug),
            )
            .take(1),
        ]);
      const content = contents.length === 1 ? contents[0] : null,
        link = links.length === 1 ? links[0] : null;
      const identityExact = Boolean(
        content &&
        content._id === target.contentId &&
        content._creationTime === target.contentCreationTime &&
        content.type === "guide" &&
        content.clinicalStatus === "clinical_review" &&
        content.aiPublicationReleaseId === undefined &&
        content.aiPublishedAt === undefined &&
        link?._id === target.linkId &&
        link.kind === "guide" &&
        !assignments.length &&
        !releases.length &&
        !audits.length,
      );
      if (!identityExact)
        blockers.push(
          `Guide identity/status/AI/assignment mismatch: ${target.slug}`,
        );
      if (
        isRegisteredReleaseContentTarget("guide", target.slug) ||
        CLINICAL_REVIEW_BATCH_REGISTRY.some((r) =>
          r.manifest.items.some((item) => item.slug === target.slug),
        )
      )
        blockers.push(
          `Registered guide requires explicit refreeze: ${target.slug}`,
        );
      const initialMatches = Boolean(
        identityExact &&
        content?.reviewRevision === target.revision &&
        (await sha256Canonical(content)) === target.initialFullHash &&
        (await sha256Canonical(link)) === target.initialLinkHash,
      );
      const desiredMatches = Boolean(
        identityExact &&
        receiptExact &&
        content &&
        link &&
        content.reviewRevision === target.revision + 1 &&
        content.updatedAt === updatedAt &&
        link.updatedAt === updatedAt &&
        (await sha256Canonical(guideStablePostimage(content))) ===
          target.desiredStableHash &&
        (await sha256Canonical(guideStablePostimage(link))) ===
          target.desiredLinkStableHash,
      );
      return {
        target,
        content,
        link,
        report: {
          slug: target.slug,
          revision: content?.reviewRevision ?? null,
          initialMatches,
          desiredMatches,
        },
      };
    }),
  );
  let phase: "ready" | "applied" | "blocked" = "blocked";
  if (
    !blockers.length &&
    !receipts.length &&
    inspected.every((t) => t.report.initialMatches)
  ) {
    if (!Number.isFinite(now) || now < capturedAt || now >= applyBefore)
      blockers.push("Correction window closed");
    else phase = "ready";
  } else if (
    !blockers.length &&
    receiptExact &&
    inspected.every((t) => t.report.desiredMatches)
  )
    phase = "applied";
  else if (!blockers.length)
    blockers.push("Exact guide preimage/postimage mismatch");
  return {
    inspected,
    report: {
      ...identity,
      phase: blockers.length ? ("blocked" as const) : phase,
      preservationExact,
      receiptExact,
      updatedAt: receiptExact ? updatedAt : null,
      blockers: [...new Set(blockers)].sort(),
      targets: inspected.map((t) => t.report),
    },
  };
}
const reportValidator = v.object({
  ...identityValidators,
  phase: v.union(
    v.literal("ready"),
    v.literal("applied"),
    v.literal("blocked"),
  ),
  preservationExact: v.boolean(),
  receiptExact: v.boolean(),
  updatedAt: v.union(v.number(), v.null()),
  blockers: v.array(v.string()),
  targets: v.array(
    v.object({
      slug: v.string(),
      revision: v.union(v.number(), v.null()),
      initialMatches: v.boolean(),
      desiredMatches: v.boolean(),
    }),
  ),
});
export const preflight = internalQuery({
  args: { ...identityValidators, checkedAt: v.number() },
  returns: reportValidator,
  handler: async (ctx, { checkedAt, ...args }) => {
    assertIdentity(args);
    return (await inspect(ctx, checkedAt)).report;
  },
});
export const apply = internalMutation({
  args: identityValidators,
  returns: v.object({
    ...identityValidators,
    alreadyApplied: v.boolean(),
    contentUpdated: v.number(),
    linksUpdated: v.number(),
    sourcesCreated: v.number(),
    updatedAt: v.number(),
    humanDecisionsCreated: v.literal(0),
    publicationDecisionsMade: v.literal(0),
  }),
  handler: async (ctx, args) => {
    assertIdentity(args);
    const now = Date.now(),
      before = await inspect(ctx, now);
    const response = (alreadyApplied: boolean, updatedAt: number) => ({
      ...identity,
      alreadyApplied,
      contentUpdated: alreadyApplied ? 0 : 3,
      linksUpdated: alreadyApplied ? 0 : 3,
      sourcesCreated: alreadyApplied ? 0 : 14,
      updatedAt,
      humanDecisionsCreated: 0 as const,
      publicationDecisionsMade: 0 as const,
    });
    if (before.report.phase === "applied" && before.report.updatedAt !== null)
      return response(true, before.report.updatedAt);
    if (before.report.phase !== "ready")
      throw new Error(
        "Three-guide correction blocked: " + before.report.blockers.join("; "),
      );
    // Convex OCC atomically protects every dependency read above. All new sources
    // are draft records; no existing source or human decision row is mutated.
    const bindings: SourceBinding[] = [];
    for (const source of newSources) {
      const metadata = {
        ...source.metadata,
        keywords: [...source.metadata.keywords],
        topics: [...source.metadata.topics],
      };
      const id = await ctx.db.insert("evidenceSources", {
        ...metadata,
        createdAt: now,
        updatedAt: now,
      });
      const row = await ctx.db.get(id);
      if (!row) throw new Error("New source disappeared");
      bindings.push({
        sourceId: metadata.sourceId,
        id,
        fullHash: await sha256Canonical(row),
      });
    }
    for (const { target, content, link } of before.inspected) {
      if (!content || !link) throw new Error("Exact guide disappeared");
      const desired = correctedGuide(content, target.patches, target.revision);
      if (
        (await sha256Canonical(guideStablePostimage(desired))) !==
        target.desiredStableHash
      )
        throw new Error("Compiled guide postimage mismatch");
      await ctx.db.patch(content._id, {
        data: desired.data,
        summaryEn: desired.summaryEn as string | undefined,
        summaryMm: desired.summaryMm as string | undefined,
        searchText: desired.searchText as string,
        reviewRevision: target.revision + 1,
        clinicalStatus: "clinical_review",
        reviewerId: undefined,
        reviewerDisplayName: undefined,
        reviewerQualification: undefined,
        reviewScope: undefined,
        reviewedAt: undefined,
        nextReviewAt: undefined,
        reviewNote: undefined,
        updatedAt: now,
      });
      await ctx.db.patch(link._id, {
        sourceIds: [...target.sourceIds],
        updatedAt: now,
      });
    }
    await logAudit(
      ctx,
      null,
      action,
      "libraryContent",
      undefined,
      identity.releaseId,
      { result: "ok", before: beforeJson(), after: afterJson(now, bindings) },
    );
    const after = await inspect(ctx, now);
    if (after.report.phase !== "applied")
      throw new Error(
        "Three-guide postflight failed; transaction rolled back: " +
          after.report.blockers.join("; "),
      );
    return response(false, now);
  },
});
