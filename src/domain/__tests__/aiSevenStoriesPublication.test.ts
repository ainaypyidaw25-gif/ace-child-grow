import { afterEach, describe, expect, it, vi } from "vitest";
import {
  preflight,
  stage,
  activate,
  withdraw,
  expire,
  SEVEN_STORIES_VISIBILITY_CUTOFF as cutoff,
} from "../../../convex/aiSevenStoriesPublication20260910";
import {
  SEVEN_STORIES_ARTIFACT as artifact,
  SEVEN_STORIES_ARTIFACT_HASH as artifactHash,
} from "../../../convex/lib/aiSevenStoriesPublication20260910Artifact";
import {
  SEVEN_STORIES_RELEASE_ROOT as root,
  SEVEN_STORIES_PREIMAGE as pins,
  SEVEN_STORIES_PRESERVATION as preservation,
  SEVEN_STORIES_OLD_SCHEDULES as schedules,
  sevenStoriesReleaseId as releaseId,
  sevenStoriesRunId as runId,
  sevenStoriesSourceRunId as sourceRunId,
} from "../../../convex/lib/aiSevenStoriesPublication20260910Data";
import * as hashes from "../../../convex/lib/aiAuditHash";
import * as visibility from "../../../convex/lib/aiPublicationVisibility";
import { sortedStoryRows } from "../../../convex/lib/sevenStoryCorrectionHelpers";
type Row = Record<string, unknown>;
const now = pins.capturedAt + 1000,
  realHash = hashes.sha256Canonical;
const identity = {
  releaseRoot: root,
  artifactHash,
  snapshotSha256: pins.snapshotSha256,
};
const invoke = (fn: unknown, ctx: unknown, args: Row) =>
  (fn as { _handler: (ctx: unknown, args: Row) => Promise<Row> })._handler(
    ctx,
    args,
  );
/** Private full-row hashes and legacy-three query buckets are represented by
 * exact synthetic mappings. New-seven runtime visibility, archive output hashes,
 * mutation postimages and scheduler shape run unchanged. Full production packet
 * verification is a separate local gate, not a fabricated CI fixture. */
async function fixture() {
  vi.stubEnv("AI_PUBLICATION_ENABLED", "true");
  vi.spyOn(Date, "now").mockReturnValue(now);
  const tables: Record<string, Row[]> = Object.fromEntries(
    [
      "libraryContent",
      "evidenceLinks",
      "evidenceSources",
      "contentReviews",
      "libraryMedia",
      "clinicalReviewAssignments",
      "aiPublicationReleases",
      "aiAuditRuns",
      "aiContentAudits",
      "aiEvidenceAudits",
      "auditLogs",
      "aiPublicationConfig",
    ].map((k) => [k, []]),
  );
  const buckets = new Map<string, Row[]>(),
    scheduled = new Map<string, Row>(),
    mappings: [unknown, string][] = [];
  const config = { _id: "config", key: "global", enabled: true, generation: 3 };
  tables.aiPublicationConfig.push(config);
  for (const pin of pins.targets) {
    const target = artifact.targets.find((t) => t.slug === pin.slug)!;
    const content = {
      _id: pin.contentId,
      _creationTime: 1,
      type: "story",
      slug: pin.slug,
      titleEn: "Synthetic fiction",
      titleMm: "ပုံပြင်",
      version: 1,
      reviewRevision: 3,
      clinicalStatus: "clinical_review",
      updatedAt: pin.contentUpdatedAt,
      tags: [],
      source: "Synthetic",
      data: {
        body: { en: "Synthetic original fiction", mm: "စိတ်ကူးယဉ်ပုံပြင်" },
      },
    };
    const link = {
      _id: pin.linkId,
      _creationTime: 1,
      slug: pin.slug,
      kind: "story",
      sourceIds: target.sources.map((s) => s.sourceId),
      updatedAt: 2,
    };
    const reviews = Array.from({ length: pin.reviewsCount }, (_, i) => ({
      _id: `review-${pin.slug}-${i}`,
      contentSlug: pin.slug,
      reviewRevision: 2,
      decision: "approved",
      reviewerId: "synthetic-history-only",
    }));
    const media = ["illustration", "audio", "pdf"].map((kind, i) => ({
      _id: `media-${pin.slug}-${i}`,
      contentSlug: pin.slug,
      kind,
      placeholder: true,
    }));
    const sources = target.sources.map((s) => {
      let row = tables.evidenceSources.find((r) => r.sourceId === s.sourceId);
      if (!row) {
        row = {
          _id: `source-${s.sourceId}`,
          sourceId: s.sourceId,
          url: s.sourceUrl,
          updatedAt: 2,
          org: "Synthetic official source",
          orgKey: "Synthetic",
          title: s.sourceId,
          authors: null,
          year: 2026,
          edition: null,
          country: null,
          language: "en",
          doi: null,
          isbn: null,
          pmid: null,
          evidenceLevel: "parent_education",
          reviewStatus: "awaiting_review",
          keywords: [],
          topics: [],
          ageMonthsMin: null,
          ageMonthsMax: null,
          verifiedOn: "2026-09-10",
          verifiedNote: "Synthetic scope",
          nextReviewDate: null,
        };
        tables.evidenceSources.push(row);
      }
      mappings.push([
        hashes.aiEvidenceSnapshot(row as never),
        s.sourceSnapshotHash,
      ]);
      return row;
    });
    tables.libraryContent.push(content);
    tables.evidenceLinks.push(link);
    tables.contentReviews.push(...reviews);
    tables.libraryMedia.push(...media);
    mappings.push(
      [content, pin.preservedContentHash],
      [link, pin.linkFullHash],
      [
        sortedStoryRows(sources as Array<Row & { _id: unknown }>),
        pin.sourcesFullHash,
      ],
      [sortedStoryRows(reviews), pin.reviewsFullHash],
      [sortedStoryRows(media), pin.mediaFullHash],
      [hashes.aiContentSnapshot(content as never), target.contentSnapshotHash],
      [
        hashes.aiEvidenceLinkSnapshot(link as never),
        target.evidenceLinkSnapshotHash,
      ],
    );
  }
  const oldRows = [
    "lsn_early_math",
    "st_waiting_at_clinic",
    "st_first_day_school",
  ].map((slug, i) => ({ _id: `old-${i}`, slug, type: i ? "story" : "lesson" }));
  const oldReleases = oldRows.map((r, i) => ({
    _id: `old-release-${i}`,
    releaseId:
      i === 0
        ? "2026-09-09-early-math-ai-preview-v1"
        : `2026-09-10-two-stories-ai-preview-v1:${r.slug}`,
    targetKey: `${r.type}\0${r.slug}`,
    contentType: r.type,
    contentSlug: r.slug,
    status: "active",
  }));
  // Obtain exact registered legacy identities without fabricating new lane scope.
  const oldActiveDescriptor = preservation.find(
    (d) => d.table === "aiPublicationReleases" && d.index === "by_status",
  )!;
  tables.aiPublicationReleases.push(...oldReleases);
  mappings.push([sortedStoryRows(oldReleases), oldActiveDescriptor.hash]);
  for (const [i, d] of preservation.entries()) {
    if (d === oldActiveDescriptor) continue;
    const rows =
      d.table === "aiPublicationConfig"
        ? [config]
        : Array.from({ length: d.count }, (_, j) => ({
            _id: `preserved-${i}-${j}`,
            unchanged: true,
            identity: d.key,
          }));
    buckets.set(`${d.table}:${d.index}:${d.key}`, rows);
    mappings.push([rows, d.hash]);
  }
  for (const s of schedules) {
    const row = {
      _id: s.id,
      state: { kind: "pending" },
      scheduledTime: now + 86400000,
    };
    scheduled.set(s.id, row);
    mappings.push([row, s.hash]);
  }
  const mapped = new Map(
    await Promise.all(
      mappings.map(
        async ([value, hash]) => [await realHash(value), hash] as const,
      ),
    ),
  );
  vi.spyOn(hashes, "sha256Canonical").mockImplementation(async (value) => {
    const h = await realHash(value);
    return mapped.get(h) ?? h;
  });
  const db = {
    system: {
      async get(id: string) {
        return scheduled.get(id) ?? null;
      },
    },
    query(table: string) {
      const conditions: [string, unknown][] = [];
      let index = "";
      const builder = {
        eq(k: string, v: unknown) {
          conditions.push([k, v]);
          return builder;
        },
      };
      const query = {
        withIndex(i: string, cb: (b: typeof builder) => unknown) {
          index = i;
          cb(builder);
          return query;
        },
        async take(count: number) {
          const bucket = buckets.get(`${table}:${index}:${conditions[0]?.[1]}`);
          return (
            bucket ??
            (tables[table] ?? []).filter((r) =>
              conditions.every(([k, v]) => r[k] === v),
            )
          ).slice(0, count);
        },
        async unique() {
          const rows = await query.take(2);
          if (rows.length > 1) throw new Error("duplicate");
          return rows[0] ?? null;
        },
      };
      return query;
    },
    async get(id: string) {
      return (
        Object.values(tables)
          .flat()
          .find((r) => r._id === id) ?? null
      );
    },
    patch: vi.fn(async (id: string, patch: Row) => {
      const row = await db.get(id);
      if (!row) throw new Error("Missing row");
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined) delete row[k];
        else row[k] = v;
      }
    }),
    insert: vi.fn(async (table: string, row: Row) => {
      const id = `new-${table}-${tables[table].length}`;
      tables[table].push({ ...row, _id: id, _creationTime: Date.now() });
      return id;
    }),
  };
  const scheduler = {
    runAt: vi.fn(async (time: number, _reference: unknown, args: Row) => {
      const id = "new-schedule";
      scheduled.set(id, {
        _id: id,
        _creationTime: Date.now(),
        name: "aiSevenStoriesPublication20260910.js:expire",
        scheduledTime: time,
        state: { kind: "pending" },
        args: [args],
      });
      return id;
    }),
  };
  const ctx = { db, scheduler };
  // Old three have independent legacy visibility suites; this test delegates all
  // seven new rows to the actual complete runtime matcher, never a boolean stub.
  vi.spyOn(visibility, "activeAiParentReadableContent").mockImplementation(
    async (_ctx, time) => {
      const rows = [];
      for (const row of tables.libraryContent)
        if (
          await visibility.contentIsAiParentReadable(
            ctx as never,
            row as never,
            time,
          )
        )
          rows.push(row);
      return { complete: true, rows: [...oldRows, ...rows] } as never;
    },
  );
  async function transaction(
    fn: unknown = stage,
    extra: Row = { operator: "Synthetic operator", gitCommit: "a".repeat(40) },
  ) {
    const before = structuredClone(tables),
      oldSchedule = structuredClone(scheduled);
    try {
      return await invoke(fn, ctx, { ...identity, ...extra });
    } catch (e) {
      for (const key of Object.keys(tables)) tables[key] = before[key];
      scheduled.clear();
      for (const [k, v] of oldSchedule) scheduled.set(k, v);
      throw e;
    }
  }
  return { tables, buckets, scheduled, ctx, transaction, oldReleases };
}
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
describe("exact seven-story AI publication lifecycle", () => {
  it("cannot activate a staged archive after the seven-day audit freshness window", async () => {
    const f = await fixture();
    await f.transaction();
    vi.spyOn(Date, "now").mockReturnValue(now + 8 * 86400000);
    expect(
      await invoke(preflight, f.ctx, { ...identity, checkedAt: Date.now() }),
    ).toMatchObject({ phase: "drift" });
    const before = structuredClone(f.tables);
    await expect(
      f.transaction(activate, {
        operator: "Synthetic operator",
        expectedGeneration: 3,
      }),
    ).rejects.toThrow("stale");
    expect(f.tables).toEqual(before);
    expect(f.ctx.scheduler.runAt).not.toHaveBeenCalled();
  });
  it("exposes only literal-bound internal functions", () => {
    for (const fn of [preflight, stage, activate, expire, withdraw]) {
      const r = fn as unknown as {
        isInternal: boolean;
        exportArgs: () => string;
      };
      expect(r.isInternal).toBe(true);
      for (const value of Object.values(identity))
        expect(r.exportArgs()).toContain(value);
    }
  });
  it("archives actual audits dark, atomically activates seven and preserves all human content/history and old previews", async () => {
    const f = await fixture(),
      before = structuredClone(f.tables),
      oldSchedules = structuredClone(f.scheduled);
    expect(
      await invoke(preflight, f.ctx, { ...identity, checkedAt: now }),
    ).toMatchObject({ phase: "ready" });
    expect(await f.transaction()).toMatchObject({ phase: "staged" });
    expect(f.tables.aiAuditRuns).toHaveLength(25);
    expect(f.tables.aiContentAudits).toHaveLength(7);
    expect(f.tables.aiEvidenceAudits).toHaveLength(18);
    expect(f.ctx.db.patch).not.toHaveBeenCalled();
    expect(
      await f.transaction(activate, {
        operator: "Synthetic operator",
        expectedGeneration: 3,
      }),
    ).toMatchObject({ phase: "enabled", activeReleaseCount: 10 });
    expect(f.ctx.scheduler.runAt).toHaveBeenCalledTimes(1);
    for (const [i, row] of f.tables.libraryContent.entries()) {
      expect(row).toEqual({
        ...before.libraryContent[i],
        aiPublicationReleaseId: releaseId(String(row.slug)),
        aiPublishedAt: now,
      });
    }
    for (const table of [
      "contentReviews",
      "evidenceSources",
      "evidenceLinks",
      "libraryMedia",
      "aiPublicationConfig",
    ])
      expect(f.tables[table]).toEqual(before[table]);
    expect(f.tables.aiPublicationReleases.slice(0, 3)).toEqual(
      before.aiPublicationReleases,
    );
    for (const [k, v] of oldSchedules) expect(f.scheduled.get(k)).toEqual(v);
    expect(f.tables.auditLogs).toHaveLength(2);
    expect(f.tables.auditLogs.every((r) => r.actorId === undefined)).toBe(true);
    const writes = f.ctx.db.insert.mock.calls.length;
    await f.transaction();
    await f.transaction(activate, {
      operator: "Synthetic operator",
      expectedGeneration: 3,
    });
    expect(f.ctx.db.insert).toHaveBeenCalledTimes(writes);
  });
  it.each([
    "content",
    "source",
    "source_duplicate",
    "link",
    "review",
    "media",
    "assignment",
    "release_id_orphan",
    "content_run_orphan",
    "evidence_content_orphan",
    "config",
    "old_schedule",
    "stale",
    "disabled",
  ] as const)("rejects %s before any stage writes", async (drift) => {
    const f = await fixture(),
      slug = pins.targets[0].slug;
    if (drift === "content") f.tables.libraryContent[0].titleEn = "edited";
    if (drift === "source")
      f.tables.evidenceSources[0].nextReviewDate = "2020-01-01";
    if (drift === "source_duplicate")
      f.tables.evidenceSources.push({
        ...f.tables.evidenceSources[0],
        _id: "duplicate",
      });
    if (drift === "link") f.tables.evidenceLinks[0].sourceIds = [];
    if (drift === "review")
      f.tables.contentReviews.push({
        _id: "new",
        contentSlug: slug,
        reviewRevision: 3,
      });
    if (drift === "media")
      f.tables.libraryMedia[0].url = "https://example.invalid";
    if (drift === "assignment")
      f.tables.clinicalReviewAssignments.push({ _id: "a", contentSlug: slug });
    if (drift === "release_id_orphan")
      f.tables.aiPublicationReleases.push({
        _id: "orphan",
        releaseId: releaseId(slug),
        targetKey: "wrong",
        status: "revoked",
      });
    if (drift === "content_run_orphan" || drift === "evidence_content_orphan")
      f.tables.aiContentAudits.push({
        _id: "orphan",
        contentSlug: "wrong",
        runId:
          drift === "content_run_orphan"
            ? runId(slug)
            : sourceRunId(slug, artifact.targets[0].sources[0].sourceId),
      });
    if (drift === "config") f.tables.aiPublicationConfig[0].generation = 4;
    if (drift === "old_schedule")
      f.scheduled.get(schedules[0].id)!.state = { kind: "canceled" };
    if (drift === "stale")
      vi.spyOn(Date, "now").mockReturnValue(now + 8 * 86400000);
    if (drift === "disabled") vi.stubEnv("AI_PUBLICATION_ENABLED", "false");
    expect(
      await invoke(preflight, f.ctx, { ...identity, checkedAt: Date.now() }),
    ).toMatchObject({ phase: "drift" });
    await expect(f.transaction()).rejects.toThrow();
    expect(f.ctx.db.insert).not.toHaveBeenCalled();
  });
  it.each(["source", "review", "audit", "orphan", "schedule_failure"] as const)(
    "blocks activation and rolls back on %s",
    async (drift) => {
      const f = await fixture();
      await f.transaction();
      if (drift === "source") f.tables.evidenceSources[0].title = "changed";
      if (drift === "review") f.tables.contentReviews[0].decision = "rejected";
      if (drift === "audit")
        f.tables.aiEvidenceAudits[0].claimScope = "unreviewed";
      if (drift === "orphan")
        f.tables.aiContentAudits.push({
          _id: "other",
          runId: sourceRunId(
            pins.targets[0].slug,
            artifact.targets[0].sources[0].sourceId,
          ),
          contentSlug: "foreign",
        });
      if (drift === "schedule_failure") {
        const original = f.ctx.scheduler.runAt.getMockImplementation()!;
        f.ctx.scheduler.runAt.mockImplementation(async (...args) => {
          const id = await original(...args);
          f.scheduled.get(id)!.name = "wrong";
          return id;
        });
      }
      const before = structuredClone(f.tables);
      await expect(
        f.transaction(activate, {
          operator: "Synthetic operator",
          expectedGeneration: 3,
        }),
      ).rejects.toThrow();
      expect(f.tables).toEqual(before);
      expect(f.scheduled.has("new-schedule")).toBe(false);
    },
  );
  it("explicit preflight clock cannot extend mutation freshness", async () => {
    const f = await fixture();
    vi.spyOn(Date, "now").mockReturnValue(now + 8 * 86400000);
    expect(
      await invoke(preflight, f.ctx, { ...identity, checkedAt: now }),
    ).toMatchObject({ phase: "ready" });
    await expect(f.transaction()).rejects.toThrow("stale");
  });
  it("keeps enabled release valid after activation freshness ends without restamping audits or extending expiry", async () => {
    const f = await fixture();
    await f.transaction();
    await f.transaction(activate, {
      operator: "Synthetic operator",
      expectedGeneration: 3,
    });
    const before = structuredClone(f.tables);
    vi.spyOn(Date, "now").mockReturnValue(now + 8 * 86400000);
    expect(
      await invoke(preflight, f.ctx, { ...identity, checkedAt: Date.now() }),
    ).toMatchObject({ phase: "enabled" });
    expect(
      await f.transaction(activate, {
        operator: "Synthetic operator",
        expectedGeneration: 3,
      }),
    ).toMatchObject({ phase: "enabled" });
    expect(await f.transaction()).toMatchObject({ phase: "enabled" });
    expect(f.tables).toEqual(before);
  });
  it("withdraws only exact seven, preserves newer pointers and never reactivates", async () => {
    const f = await fixture();
    await f.transaction();
    await f.transaction(activate, {
      operator: "Synthetic operator",
      expectedGeneration: 3,
    });
    f.tables.libraryContent[0].aiPublicationReleaseId = "newer-release";
    expect(await f.transaction(withdraw, {})).toEqual({
      revoked: 7,
      pointersCleared: 6,
    });
    expect(f.tables.libraryContent[0].aiPublicationReleaseId).toBe(
      "newer-release",
    );
    expect(
      f.tables.aiPublicationReleases.filter((r) => r.status === "active"),
    ).toHaveLength(3);
    expect(await f.transaction(withdraw, {})).toEqual({
      revoked: 0,
      pointersCleared: 0,
    });
    await expect(f.transaction()).rejects.toThrow();
  });
  it("scheduled expiry rejects early and reactively revokes exact seven at cutoff", async () => {
    const f = await fixture();
    await f.transaction();
    await f.transaction(activate, {
      operator: "Synthetic operator",
      expectedGeneration: 3,
    });
    await expect(f.transaction(expire, {})).rejects.toThrow("early");
    vi.spyOn(Date, "now").mockReturnValue(cutoff);
    expect(await f.transaction(expire, {})).toEqual({
      revoked: 7,
      pointersCleared: 7,
    });
    expect(
      f.tables.aiPublicationReleases.filter((r) => r.status === "active"),
    ).toEqual(f.oldReleases);
    expect(await f.transaction(expire, {})).toEqual({
      revoked: 0,
      pointersCleared: 0,
    });
  });
  it.each(["releaseRoot", "artifactHash", "snapshotSha256"] as const)(
    "rejects mismatched %s identity",
    async (key) => {
      const f = await fixture();
      await expect(
        invoke(stage, f.ctx, {
          ...identity,
          [key]: "wrong",
          operator: "Synthetic",
          gitCommit: "a".repeat(40),
        }),
      ).rejects.toThrow("identity");
      expect(f.ctx.db.insert).not.toHaveBeenCalled();
    },
  );
});
