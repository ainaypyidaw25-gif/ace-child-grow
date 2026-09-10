import type { QueryCtx, MutationCtx } from "../_generated/server";
type Context = Pick<QueryCtx, "db"> | Pick<MutationCtx, "db">;
/** Each descriptor has a compile-time table/index/key and exact count/hash. No caller may choose a read target. */
export async function sevenStoriesPreservedRows(
  ctx: Context,
  descriptor: { table: string; index: string; key: string; count: number },
) {
  const { table, index, key, count } = descriptor;
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
      throw new Error("Unknown preservation manifest table");
  }
}
