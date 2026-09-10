import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  type QueryCtx,
  type MutationCtx,
} from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { logAudit } from "./audit";
import {
  aiContentSnapshot,
  aiEvidenceSnapshot,
  aiEvidenceLinkSnapshot,
  canonicalJson,
  sha256Canonical,
} from "./lib/aiAuditHash";
import {
  aiAuditFreshForActivation,
  aiPublicationMasterEnabled,
  aiPublicationTargetKey,
  sourceMayEnterAiPublication,
} from "./lib/aiPublicationPolicy";
import {
  activeAiParentReadableContent,
  contentIsAiParentReadable,
} from "./lib/aiPublicationVisibility";
import { CLINICAL_REVIEW_BATCH_REGISTRY } from "./lib/clinicalReviewBatchData";
import { isRegisteredReleaseContentTarget } from "./lib/clinicalReviewBatchProvenance";
import { sevenStoriesPreservedRows } from "./lib/aiSevenStoriesPreservation";
import { sortedStoryRows } from "./lib/sevenStoryCorrectionHelpers";
import {
  SEVEN_STORIES_ARTIFACT as artifact,
  SEVEN_STORIES_ARTIFACT_HASH as artifactHash,
} from "./lib/aiSevenStoriesPublication20260910Artifact";
import {
  SEVEN_STORIES_RELEASE_ROOT as root,
  SEVEN_STORIES_POLICY_VERSION as policyVersion,
  SEVEN_STORIES_RELEASE_DAYS as releaseDays,
  SEVEN_STORIES_SLUGS as slugs,
  SEVEN_STORIES_PREIMAGE as expected,
  SEVEN_STORIES_PRESERVATION as preservation,
  SEVEN_STORIES_OLD_SCHEDULES as oldSchedules,
  sevenStoriesReleaseId as releaseId,
  sevenStoriesRunId as runId,
  sevenStoriesSourceRunId as sourceRunId,
} from "./lib/aiSevenStoriesPublication20260910Data";

type Ctx = Pick<QueryCtx, "db"> | Pick<MutationCtx, "db">;
type Target = (typeof artifact.targets)[number];
type Staged = { gitCommit: string; operator: string; stagedAt: number };
type Enabled = {
  operator: string;
  activatedAt: number;
  expiryScheduledFunctionId: string;
};
const day = 86400000,
  snapshotSha256 = expected.snapshotSha256;
const nextAuditDate = new Date(
  artifact.auditCompletedAt + (releaseDays - 1) * day,
)
  .toISOString()
  .slice(0, 10);
export const SEVEN_STORIES_VISIBILITY_CUTOFF =
  Date.parse(`${nextAuditDate}T23:59:59.999Z`) + 1;
const expiresAt = artifact.auditCompletedAt + releaseDays * day;
const identity = { releaseRoot: root, artifactHash, snapshotSha256 };
const identityValidators = {
  releaseRoot: v.literal(root),
  artifactHash: v.literal(artifactHash),
  snapshotSha256: v.literal(snapshotSha256),
};
const action = (phase: string) => `library.ai_seven_stories.${phase}`;
const strip = (row: object, keys: readonly string[]) =>
  Object.fromEntries(Object.entries(row).filter(([k]) => !keys.includes(k)));
const stripDb = (row: object) => strip(row, ["_id", "_creationTime"]);
const equal = (a: unknown, b: unknown) => canonicalJson(a) === canonicalJson(b);
function assertIdentity(args: typeof identity) {
  if (!equal(args, identity))
    throw new Error("Seven-story release identity mismatch");
}
function validOperator(value: unknown): value is string {
  return (
    typeof value === "string" && value.trim().length > 0 && value.length <= 160
  );
}
function assertFresh(now: number) {
  if (
    !aiPublicationMasterEnabled() ||
    !aiAuditFreshForActivation(artifact.auditCompletedAt, now) ||
    now < expected.capturedAt ||
    now >= SEVEN_STORIES_VISIBILITY_CUTOFF
  )
    throw new Error("Exact AI audit is stale or master switch disabled");
}
async function assertArtifact() {
  if (
    (await sha256Canonical(artifact)) !== artifactHash ||
    artifact.schemaVersion !== 2 ||
    artifact.policyVersion !== policyVersion ||
    artifact.releaseId !== root ||
    !equal(
      artifact.targets.map((t) => t.slug),
      slugs,
    ) ||
    artifact.targets.some(
      (t) =>
        t.type !== "story" ||
        t.verdict !== "pass" ||
        t.independentAgentResults.length !== 2 ||
        t.independentAgentResults.some((r) => r.verdict !== "pass") ||
        !t.independentAgentResults.some((r) => r.role === "source_research") ||
        !t.independentAgentResults.some((r) => r.role === "semantic_audit") ||
        t.sources.length < 2 ||
        t.sources.length > 3 ||
        new Set(t.sources.map((s) => s.sourceId)).size !== t.sources.length ||
        t.sources.some(
          (s) => !(s.urlsChecked as readonly string[]).includes(s.sourceUrl),
        ),
    )
  )
    throw new Error("Compiled independent multi-source artifact invalid");
}
async function receipt(ctx: Ctx, phase: string) {
  return ctx.db
    .query("auditLogs")
    .withIndex("by_action", (q) => q.eq("action", action(phase)))
    .take(2);
}
function parseReceipt<T>(
  rows: Doc<"auditLogs">[],
  phase: string,
  validate: (value: Record<string, unknown>) => boolean,
): T | null {
  if (rows.length !== 1) return null;
  const row = rows[0];
  try {
    const parsed = JSON.parse(row.after ?? "null");
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !equal(parsed.identity, identity) ||
      !validate(parsed) ||
      row.actorId !== undefined ||
      row.entityTable !== "aiPublicationReleases" ||
      row.entityId !== root ||
      row.result !== "ok" ||
      row.summary !== phase ||
      row.before !== JSON.stringify(identity)
    )
      return null;
    return parsed as T;
  } catch {
    return null;
  }
}
const baseRun = (target: Target, staged: Staged) => ({
  releaseId: releaseId(target.slug),
  status: "completed" as const,
  provider: artifact.provider,
  model: artifact.model,
  modelVersion: artifact.modelVersion,
  policyVersion,
  gitCommit: staged.gitCommit,
  targetCount: 1,
  limitations: [...artifact.limitations],
  startedAt: artifact.auditStartedAt,
  completedAt: artifact.auditCompletedAt,
});
async function auditPayloads(
  target: Target,
  content: Doc<"libraryContent">,
  link: Doc<"evidenceLinks">,
  sources: Doc<"evidenceSources">[],
  staged: Staged,
) {
  const targetArtifactHash = await sha256Canonical(target),
    output = (extra: object = {}) =>
      sha256Canonical({ artifactHash, targetArtifactHash, ...extra });
  const summary = `${artifact.summary} Target: story:${target.slug}.`,
    limits = [...target.limitations, ...artifact.limitations];
  const contentRun = {
    ...baseRun(target, staged),
    runId: runId(target.slug),
    summary,
    outputHash: await output(),
  };
  const contentAudit = {
    runId: runId(target.slug),
    contentSlug: target.slug,
    contentType: "story",
    reviewRevision: 3,
    contentUpdatedAt: content.updatedAt,
    contentSnapshotHash: target.contentSnapshotHash,
    evidenceLinkUpdatedAt: link.updatedAt,
    evidenceLinkSnapshotHash: target.evidenceLinkSnapshotHash,
    sourceIds: target.sources.map((s) => s.sourceId),
    verdict: "pass" as const,
    checks: [...target.contentChecks],
    limitations: limits,
    auditedAt: artifact.auditCompletedAt,
    nextAuditDate,
    outputHash: await output({ kind: "content" }),
  };
  const evidence = await Promise.all(
    target.sources.map(async (s) => {
      const source = sources.find((row) => row.sourceId === s.sourceId);
      if (!source) throw new Error("Missing exact source");
      const id = sourceRunId(target.slug, s.sourceId);
      return {
        run: {
          ...baseRun(target, staged),
          runId: id,
          summary: `${summary} Source: ${s.sourceId}.`,
          outputHash: await output({ sourceId: s.sourceId }),
        },
        audit: {
          runId: id,
          sourceId: s.sourceId,
          sourceUpdatedAt: source.updatedAt,
          sourceSnapshotHash: s.sourceSnapshotHash,
          verdict: "pass" as const,
          claimScope: s.claimScope,
          urlsChecked: [...s.urlsChecked],
          findings: [...s.evidenceFindings],
          limitations: [...s.limitations, ...limits],
          auditedAt: artifact.auditCompletedAt,
          nextAuditDate,
          outputHash: await output({ kind: "evidence", sourceId: s.sourceId }),
        },
      };
    }),
  );
  return { contentRun, contentAudit, evidence };
}
function releasePayload(
  target: Target,
  content: Doc<"libraryContent">,
  link: Doc<"evidenceLinks">,
  sources: Doc<"evidenceSources">[],
  staged: Staged,
  enabled: Enabled,
) {
  return {
    releaseId: releaseId(target.slug),
    targetKey: aiPublicationTargetKey("story", target.slug),
    contentId: content._id,
    contentType: "story",
    contentSlug: target.slug,
    status: "active" as const,
    reviewRevision: 3,
    contentUpdatedAt: content.updatedAt,
    contentSnapshotHash: target.contentSnapshotHash,
    evidenceLinkUpdatedAt: link.updatedAt,
    evidenceLinkSnapshotHash: target.evidenceLinkSnapshotHash,
    sourceSnapshots: target.sources.map((s) => ({
      sourceId: s.sourceId,
      sourceUpdatedAt: sources.find((row) => row.sourceId === s.sourceId)!
        .updatedAt,
      sourceSnapshotHash: s.sourceSnapshotHash,
      evidenceAuditRunId: sourceRunId(target.slug, s.sourceId),
    })),
    contentAuditRunId: runId(target.slug),
    auditArtifactHash: artifactHash,
    policyVersion,
    gitCommit: staged.gitCommit,
    operator: enabled.operator,
    createdAt: enabled.activatedAt,
    expiresAt,
  };
}
async function inspect(ctx: Ctx, now: number) {
  await assertArtifact();
  const [stageRows, enabledRows, withdrawnRows, expiredRows, active] =
    await Promise.all([
      receipt(ctx, "staged"),
      receipt(ctx, "enabled"),
      receipt(ctx, "withdrawn"),
      receipt(ctx, "expired"),
      ctx.db
        .query("aiPublicationReleases")
        .withIndex("by_status", (q) => q.eq("status", "active"))
        .take(11),
    ]);
  const staged = parseReceipt<Staged>(
    stageRows,
    "staged",
    (p) =>
      typeof p.stagedAt === "number" &&
      p.stagedAt >= expected.capturedAt &&
      aiAuditFreshForActivation(artifact.auditCompletedAt, p.stagedAt) &&
      typeof p.gitCommit === "string" &&
      /^[a-f0-9]{40}$/.test(p.gitCommit) &&
      validOperator(p.operator),
  );
  const enabled = parseReceipt<Enabled>(
    enabledRows,
    "enabled",
    (p) =>
      typeof p.activatedAt === "number" &&
      p.activatedAt >= (staged?.stagedAt ?? Infinity) &&
      aiAuditFreshForActivation(artifact.auditCompletedAt, p.activatedAt) &&
      validOperator(p.operator) &&
      typeof p.expiryScheduledFunctionId === "string",
  );
  const blockers: string[] = [];
  if (
    !Number.isFinite(now) ||
    now < expected.capturedAt ||
    !aiPublicationMasterEnabled() ||
    (!enabled && !aiAuditFreshForActivation(artifact.auditCompletedAt, now)) ||
    now >= SEVEN_STORIES_VISIBILITY_CUTOFF
  ) {
    blockers.push("Exact AI audit is stale or master switch disabled");
  }
  if (stageRows.length > 0 && !staged) blockers.push("Stage receipt drift");
  if (enabledRows.length > 0 && !enabled)
    blockers.push("Activation receipt drift");
  if (withdrawnRows.length || expiredRows.length)
    blockers.push("This immutable release was withdrawn or expired");
  const preserved = await Promise.all(
    preservation.map(async (d) => {
      const rows =
        d.table === "aiPublicationReleases" && d.index === "by_status"
          ? active.filter(
              (row) => !slugs.some((slug) => releaseId(slug) === row.releaseId),
            )
          : await sevenStoriesPreservedRows(ctx, d);
      return (
        rows.length === d.count &&
        (await sha256Canonical(sortedStoryRows<{ _id: unknown }>(rows))) ===
          d.hash
      );
    }),
  );
  const preservedSchedules = await Promise.all(
    oldSchedules.map(async (d) => {
      const row = await ctx.db.system.get(d.id as Id<"_scheduled_functions">);
      return Boolean(row && (await sha256Canonical(row)) === d.hash);
    }),
  );
  const preservationExact =
    preserved.every(Boolean) && preservedSchedules.every(Boolean);
  if (!preservationExact)
    blockers.push(
      "Existing three previews/config/sources/history/schedules drift",
    );
  let expiryScheduleExact = enabled === null;
  if (enabled) {
    const schedule = await ctx.db.system.get(
      enabled.expiryScheduledFunctionId as Id<"_scheduled_functions">,
    );
    expiryScheduleExact = Boolean(
      schedule &&
      schedule.name === "aiSevenStoriesPublication20260910.js:expire" &&
      schedule.scheduledTime === SEVEN_STORIES_VISIBILITY_CUTOFF &&
      schedule.state.kind === "pending" &&
      equal(schedule.args, [identity]),
    );
    if (!expiryScheduleExact)
      blockers.push("Exact reactive expiry schedule missing or drifted");
  }
  const states = await Promise.all(
    expected.targets.map(async (pin) => {
      const target = artifact.targets.find((t) => t.slug === pin.slug)!;
      const sourceIds = target.sources.map((s) => s.sourceId),
        expectedRuns = [
          runId(pin.slug),
          ...sourceIds.map((id) => sourceRunId(pin.slug, id)),
        ];
      const [
        contents,
        links,
        sourceRows,
        reviews,
        media,
        assignments,
        releases,
        releaseRuns,
        contentAudits,
        runRows,
        evidenceRows,
        releasesById,
        contentRowsByRun,
      ] = await Promise.all([
        ctx.db
          .query("libraryContent")
          .withIndex("by_slug", (q) => q.eq("slug", pin.slug))
          .take(2),
        ctx.db
          .query("evidenceLinks")
          .withIndex("by_slug", (q) => q.eq("slug", pin.slug))
          .take(2),
        Promise.all(
          sourceIds.map((id) =>
            ctx.db
              .query("evidenceSources")
              .withIndex("by_source_id", (q) => q.eq("sourceId", id))
              .take(2),
          ),
        ),
        ctx.db
          .query("contentReviews")
          .withIndex("by_content", (q) => q.eq("contentSlug", pin.slug))
          .take(pin.reviewsCount + 1),
        ctx.db
          .query("libraryMedia")
          .withIndex("by_content", (q) => q.eq("contentSlug", pin.slug))
          .take(pin.mediaCount + 1),
        ctx.db
          .query("clinicalReviewAssignments")
          .withIndex("by_exact_target", (q) => q.eq("contentSlug", pin.slug))
          .take(1),
        ctx.db
          .query("aiPublicationReleases")
          .withIndex("by_target_key", (q) =>
            q.eq("targetKey", aiPublicationTargetKey("story", pin.slug)),
          )
          .take(2),
        ctx.db
          .query("aiAuditRuns")
          .withIndex("by_release_id", (q) =>
            q.eq("releaseId", releaseId(pin.slug)),
          )
          .take(expectedRuns.length + 1),
        ctx.db
          .query("aiContentAudits")
          .withIndex("by_content_revision_and_updated_at", (q) =>
            q.eq("contentSlug", pin.slug),
          )
          .take(2),
        Promise.all(
          expectedRuns.map((id) =>
            ctx.db
              .query("aiAuditRuns")
              .withIndex("by_run_id", (q) => q.eq("runId", id))
              .take(2),
          ),
        ),
        Promise.all(
          expectedRuns.map((id) =>
            ctx.db
              .query("aiEvidenceAudits")
              .withIndex("by_run_id", (q) => q.eq("runId", id))
              .take(2),
          ),
        ),
        ctx.db
          .query("aiPublicationReleases")
          .withIndex("by_release_id", (q) =>
            q.eq("releaseId", releaseId(pin.slug)),
          )
          .take(2),
        Promise.all(
          expectedRuns.map((id) =>
            ctx.db
              .query("aiContentAudits")
              .withIndex("by_run_id", (q) => q.eq("runId", id))
              .take(2),
          ),
        ),
      ]);
      const content = contents.length === 1 ? contents[0] : null,
        link = links.length === 1 ? links[0] : null,
        sources = sourceRows.flat();
      const dependenciesExact = Boolean(
        content &&
        link &&
        content._id === pin.contentId &&
        content.type === "story" &&
        content.clinicalStatus === "clinical_review" &&
        content.reviewRevision === 3 &&
        content.updatedAt === pin.contentUpdatedAt &&
        (await sha256Canonical(
          strip(content, ["aiPublicationReleaseId", "aiPublishedAt"]),
        )) === pin.preservedContentHash &&
        link._id === pin.linkId &&
        link.kind === "story" &&
        (await sha256Canonical(link)) === pin.linkFullHash &&
        sourceRows.every((rows) => rows.length === 1) &&
        equal(link.sourceIds, sourceIds) &&
        (await sha256Canonical(sortedStoryRows(sources))) ===
          pin.sourcesFullHash &&
        reviews.length === pin.reviewsCount &&
        (await sha256Canonical(sortedStoryRows(reviews))) ===
          pin.reviewsFullHash &&
        media.length === pin.mediaCount &&
        media.every((m) => m.placeholder && !m.url && !m.storageId) &&
        (await sha256Canonical(sortedStoryRows(media))) === pin.mediaFullHash,
      );
      const governed =
        assignments.length > 0 ||
        isRegisteredReleaseContentTarget("story", pin.slug) ||
        CLINICAL_REVIEW_BATCH_REGISTRY.some((r) =>
          r.manifest.items.some((item) => item.slug === pin.slug),
        );
      if (!dependenciesExact)
        blockers.push(
          `Exact content/source/link/review/media drift: ${pin.slug}`,
        );
      if (governed)
        blockers.push(`Governed assignment blocks AI publication: ${pin.slug}`);
      if (
        !Number.isFinite(now) ||
        sourceRows.some(
          (rows) =>
            rows.length !== 1 ||
            !sourceMayEnterAiPublication(
              rows[0],
              new Date(now).toISOString().slice(0, 10),
            ),
        )
      ) {
        blockers.push(
          `Source eligibility/freshness blocks AI publication: ${pin.slug}`,
        );
      }
      const initial = Boolean(
        content &&
        content.aiPublicationReleaseId === undefined &&
        content.aiPublishedAt === undefined &&
        releases.length === 0 &&
        releasesById.length === 0 &&
        releaseRuns.length === 0 &&
        contentAudits.length === 0 &&
        runRows.every((rows) => rows.length === 0) &&
        evidenceRows.every((rows) => rows.length === 0) &&
        contentRowsByRun.every((rows) => rows.length === 0),
      );
      let auditsExact = false,
        released = false;
      if (content && link && staged && dependenciesExact) {
        const payload = await auditPayloads(
          target,
          content,
          link,
          sources,
          staged,
        );
        const runs = [
          payload.contentRun,
          ...payload.evidence.map((e) => e.run),
        ];
        auditsExact =
          releaseRuns.length === runs.length &&
          runRows.every(
            (rows, i) => rows.length === 1 && equal(stripDb(rows[0]), runs[i]),
          ) &&
          releaseRuns.every((row) => expectedRuns.includes(row.runId)) &&
          contentAudits.length === 1 &&
          equal(stripDb(contentAudits[0]), payload.contentAudit) &&
          contentRowsByRun[0].length === 1 &&
          contentRowsByRun[0][0]._id === contentAudits[0]._id &&
          contentRowsByRun.slice(1).every((rows) => rows.length === 0) &&
          evidenceRows[0].length === 0 &&
          payload.evidence.every(
            (e, i) =>
              evidenceRows[i + 1].length === 1 &&
              equal(stripDb(evidenceRows[i + 1][0]), e.audit),
          );
        if (
          enabled &&
          releases.length === 1 &&
          releasesById.length === 1 &&
          releases[0]._id === releasesById[0]._id
        ) {
          const payloadRelease = releasePayload(
            target,
            content,
            link,
            sources,
            staged,
            enabled,
          );
          released =
            equal(stripDb(releases[0]), payloadRelease) &&
            content.aiPublicationReleaseId === payloadRelease.releaseId &&
            content.aiPublishedAt === payloadRelease.createdAt &&
            active.some((r) => r._id === releases[0]._id);
        }
      }
      return {
        pin,
        target,
        content,
        link,
        sources,
        initial,
        auditsExact,
        released,
        staged:
          auditsExact &&
          releases.length === 0 &&
          releasesById.length === 0 &&
          content?.aiPublicationReleaseId === undefined &&
          content?.aiPublishedAt === undefined,
        parentReadable: content
          ? await contentIsAiParentReadable(ctx, content, now)
          : false,
      };
    }),
  );
  let phase: "ready" | "staged" | "enabled" | "drift" = "drift";
  if (
    !blockers.length &&
    active.length === 3 &&
    !staged &&
    !enabled &&
    states.every((t) => t.initial && !t.parentReadable)
  )
    phase = "ready";
  else if (
    !blockers.length &&
    active.length === 3 &&
    staged &&
    !enabled &&
    states.every((t) => t.staged && !t.parentReadable)
  )
    phase = "staged";
  else if (
    !blockers.length &&
    active.length === 10 &&
    staged &&
    enabled &&
    states.every((t) => t.auditsExact && t.released && t.parentReadable)
  )
    phase = "enabled";
  else if (!blockers.length)
    blockers.push("Exact lifecycle or complete audit coverage mismatch");
  return {
    staged,
    enabled,
    states,
    report: {
      ...identity,
      phase,
      activeReleaseCount: active.length,
      preservationExact,
      expiryScheduleExact,
      blockers: [...new Set(blockers)].sort(),
      targets: states.map((t) => ({
        slug: t.pin.slug,
        revision: t.content?.reviewRevision ?? null,
        parentReadable: t.parentReadable,
      })),
    },
  };
}
const reportValidator = v.object({
  ...identityValidators,
  phase: v.union(
    v.literal("ready"),
    v.literal("staged"),
    v.literal("enabled"),
    v.literal("drift"),
  ),
  activeReleaseCount: v.number(),
  preservationExact: v.boolean(),
  expiryScheduleExact: v.boolean(),
  blockers: v.array(v.string()),
  targets: v.array(
    v.object({
      slug: v.string(),
      revision: v.union(v.number(), v.null()),
      parentReadable: v.boolean(),
    }),
  ),
});
export const preflight = internalQuery({
  args: { ...identityValidators, checkedAt: v.number() },
  returns: reportValidator,
  handler: async (ctx, args) => {
    assertIdentity({
      releaseRoot: args.releaseRoot,
      artifactHash: args.artifactHash,
      snapshotSha256: args.snapshotSha256,
    });
    return (await inspect(ctx, args.checkedAt)).report;
  },
});
export const stage = internalMutation({
  args: { ...identityValidators, operator: v.string(), gitCommit: v.string() },
  returns: reportValidator,
  handler: async (ctx, args) => {
    assertIdentity({
      releaseRoot: args.releaseRoot,
      artifactHash: args.artifactHash,
      snapshotSha256: args.snapshotSha256,
    });
    const now = Date.now();
    if (!validOperator(args.operator) || !/^[a-f0-9]{40}$/.test(args.gitCommit))
      throw new Error("Invalid operator/commit");
    const before = await inspect(ctx, now);
    if (before.report.phase === "enabled") return before.report;
    assertFresh(now);
    if (before.report.phase === "staged")
      return before.report;
    if (before.report.phase !== "ready")
      throw new Error(
        `Seven-story stage blocked: ${before.report.blockers.join("; ")}`,
      );
    const staged = {
      operator: args.operator,
      gitCommit: args.gitCommit,
      stagedAt: now,
    };
    for (const state of before.states) {
      if (
        (await sha256Canonical(aiContentSnapshot(state.content!))) !==
          state.target.contentSnapshotHash ||
        (await sha256Canonical(aiEvidenceLinkSnapshot(state.link!))) !==
          state.target.evidenceLinkSnapshotHash
      )
        throw new Error("Audited content/link hash mismatch");
      for (const source of state.sources) {
        const audited = state.target.sources.find(
          (s) => s.sourceId === source.sourceId,
        );
        if (
          !audited ||
          !sourceMayEnterAiPublication(
            source,
            new Date(now).toISOString().slice(0, 10),
          ) ||
          (await sha256Canonical(aiEvidenceSnapshot(source))) !==
            audited.sourceSnapshotHash
        )
          throw new Error("Audited source scope/freshness mismatch");
      }
      const p = await auditPayloads(
        state.target,
        state.content!,
        state.link!,
        state.sources,
        staged,
      );
      await ctx.db.insert("aiAuditRuns", p.contentRun);
      await ctx.db.insert("aiContentAudits", p.contentAudit);
      for (const e of p.evidence) {
        await ctx.db.insert("aiAuditRuns", e.run);
        await ctx.db.insert("aiEvidenceAudits", e.audit);
      }
    }
    await logAudit(
      ctx,
      null,
      action("staged"),
      "aiPublicationReleases",
      root,
      "staged",
      {
        result: "ok",
        before: JSON.stringify(identity),
        after: JSON.stringify({ identity, ...staged }),
      },
    );
    const after = await inspect(ctx, now);
    if (
      after.report.phase !== "staged" ||
      after.report.targets.some((t) => t.parentReadable)
    )
      throw new Error("Stage postflight failed; transaction rolls back");
    return after.report;
  },
});
export const activate = internalMutation({
  args: {
    ...identityValidators,
    expectedGeneration: v.literal(3),
    operator: v.string(),
  },
  returns: reportValidator,
  handler: async (ctx, args) => {
    assertIdentity({
      releaseRoot: args.releaseRoot,
      artifactHash: args.artifactHash,
      snapshotSha256: args.snapshotSha256,
    });
    if (args.expectedGeneration !== 3 || !validOperator(args.operator))
      throw new Error("Invalid generation/operator");
    const now = Date.now();
    const before = await inspect(ctx, now);
    if (before.report.phase === "enabled") return before.report;
    assertFresh(now);
    if (before.report.phase !== "staged" || !before.staged)
      throw new Error(
        `Seven-story activation blocked: ${before.report.blockers.join("; ")}`,
      );
    const expiryScheduledFunctionId = await ctx.scheduler.runAt(
      SEVEN_STORIES_VISIBILITY_CUTOFF,
      internal.aiSevenStoriesPublication20260910.expire,
      identity,
    );
    const enabled = {
      operator: args.operator,
      activatedAt: now,
      expiryScheduledFunctionId: String(expiryScheduledFunctionId),
    };
    for (const state of before.states) {
      const row = releasePayload(
        state.target,
        state.content!,
        state.link!,
        state.sources,
        before.staged,
        enabled,
      );
      await ctx.db.insert("aiPublicationReleases", row);
      await ctx.db.patch(state.content!._id, {
        aiPublicationReleaseId: row.releaseId,
        aiPublishedAt: row.createdAt,
      });
    }
    await logAudit(
      ctx,
      null,
      action("enabled"),
      "aiPublicationReleases",
      root,
      "enabled",
      {
        result: "ok",
        before: JSON.stringify(identity),
        after: JSON.stringify({ identity, ...enabled }),
      },
    );
    const after = await inspect(ctx, now),
      readable = await activeAiParentReadableContent(ctx, now),
      expectedSlugs = [
        "lsn_early_math",
        "st_waiting_at_clinic",
        "st_first_day_school",
        ...slugs,
      ].sort();
    if (
      after.report.phase !== "enabled" ||
      !readable.complete ||
      !equal(readable.rows.map((r) => r.slug).sort(), expectedSlugs)
    )
      throw new Error(
        "Activation exact ten-item readback failed; transaction rolls back",
      );
    return after.report;
  },
});
async function terminate(
  ctx: MutationCtx,
  reason: "expired" | "withdrawn",
  now: number,
) {
  // Withdrawal is deliberately available despite content/source drift or disabled master switch.
  // It revokes only immutable exact release IDs; a newer content pointer is never cleared.
  const rows = await Promise.all(
    expected.targets.map(async (pin) => {
      const rows = await ctx.db
        .query("aiPublicationReleases")
        .withIndex("by_release_id", (q) =>
          q.eq("releaseId", releaseId(pin.slug)),
        )
        .take(2);
      if (rows.length > 1) throw new Error("Duplicate exact release");
      const row = rows[0];
      if (
        row &&
        (row.contentId !== pin.contentId ||
          row.contentSlug !== pin.slug ||
          row.contentType !== "story" ||
          row.auditArtifactHash !== artifactHash ||
          row.policyVersion !== policyVersion ||
          row.targetKey !== aiPublicationTargetKey("story", pin.slug))
      )
        throw new Error("Withdrawal release identity drift");
      return row;
    }),
  );
  const receipts = await receipt(ctx, reason);
  if (receipts.length > 1) throw new Error("Duplicate withdrawal receipt");
  let revoked = 0,
    pointersCleared = 0;
  for (const row of rows) {
    if (!row) continue;
    if (row.status === "active") {
      await ctx.db.patch(row._id, {
        status: "revoked",
        revokedAt: now,
        revokeReason: `Exact seven-story AI release ${reason}; no human decision changed.`,
      });
      revoked++;
    }
    const content = await ctx.db.get(row.contentId);
    if (content?.aiPublicationReleaseId === row.releaseId) {
      await ctx.db.patch(content._id, {
        aiPublicationReleaseId: undefined,
        aiPublishedAt: undefined,
      });
      pointersCleared++;
    }
  }
  if (!receipts.length)
    await logAudit(
      ctx,
      null,
      action(reason),
      "aiPublicationReleases",
      root,
      reason,
      {
        result: "ok",
        before: JSON.stringify(identity),
        after: JSON.stringify({ identity, at: now, revoked, pointersCleared }),
      },
    );
  return { revoked, pointersCleared };
}
const terminalReturns = v.object({
  revoked: v.number(),
  pointersCleared: v.number(),
});
export const expire = internalMutation({
  args: identityValidators,
  returns: terminalReturns,
  handler: async (ctx, args) => {
    assertIdentity(args);
    if (Date.now() < SEVEN_STORIES_VISIBILITY_CUTOFF)
      throw new Error("Expiry cannot run early");
    return terminate(ctx, "expired", Date.now());
  },
});
export const withdraw = internalMutation({
  args: identityValidators,
  returns: terminalReturns,
  handler: async (ctx, args) => {
    assertIdentity(args);
    return terminate(ctx, "withdrawn", Date.now());
  },
});
