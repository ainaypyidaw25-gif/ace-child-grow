import { afterEach, describe, expect, it, vi } from "vitest";
import { apply, preflight } from "../../../convex/threeGuideCorrection";
import {
  THREE_GUIDE_IDENTITY as identity,
  THREE_GUIDE_TARGETS as targets,
  THREE_GUIDE_NEW_SOURCES as newSources,
  THREE_GUIDE_CAPTURED_AT as capturedAt,
  THREE_GUIDE_APPLY_BEFORE as applyBefore,
} from "../../../convex/lib/threeGuideCorrectionData";
import { correctedGuide } from "../../../convex/lib/threeGuideCorrectionHelpers";
import { CLINICAL_REVIEW_BATCH_REGISTRY } from "../../../convex/lib/clinicalReviewBatchData";
type Row = Record<string, unknown>;
const state = vi.hoisted(() => ({
  tables: {} as Record<string, Row[]>,
  schedules: {} as Record<string, Row>,
}));
// Synthetic fixture uses real SHA-256, real patch/source metadata and lifecycle.
// Private production hashes are separately checked by the pinned packet compiler.
vi.mock(
  "../../../convex/lib/threeGuideCorrectionData",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../../convex/lib/threeGuideCorrectionData")
      >();
    const { createHash } = await import("node:crypto");
    const { canonicalJson } = await import("../../../convex/lib/aiAuditHash");
    const { correctedGuide, guideStablePostimage, sortedGuideRows } =
      await import("../../../convex/lib/threeGuideCorrectionHelpers");
    const hash = (x: unknown) =>
      createHash("sha256").update(canonicalJson(x)).digest("hex");
    const tables: Record<string, Row[]> = {
      libraryContent: [],
      evidenceLinks: [],
      evidenceSources: [],
      contentReviews: [],
      contentEditLogs: [],
      libraryMedia: [],
      clinicalReviewAssignments: [],
      aiPublicationReleases: [],
      aiContentAudits: [],
      auditLogs: [],
      aiPublicationConfig: [
        { _id: "config", key: "global", enabled: true, generation: 3 },
      ],
    };
    const existingIds = [
      ...new Set(
        actual.THREE_GUIDE_TARGETS.flatMap((t) => [
          ...t.initialSourceIds,
          ...t.sourceIds,
        ]),
      ),
    ].filter(
      (id) =>
        !actual.THREE_GUIDE_NEW_SOURCES.some((s) => s.metadata.sourceId === id),
    );
    tables.evidenceSources = existingIds.map((sourceId) => ({
      _id: "source-" + sourceId,
      sourceId,
      title: "Existing " + sourceId,
      url: "https://example.invalid/" + sourceId,
      reviewStatus: "approved",
      reviewer: "Historical reviewer",
      reviewDate: "2025-01-01",
      createdAt: 1,
      updatedAt: 2,
    }));
    function setLeaf(row: Row, path: string, value: string) {
      let cursor = row;
      const keys = path.split(".");
      for (const key of keys.slice(0, -1)) {
        if (!cursor[key]) cursor[key] = {};
        cursor = cursor[key] as Row;
      }
      cursor[keys.at(-1)!] = value;
    }
    const targetData = actual.THREE_GUIDE_TARGETS.map((t, i) => {
      const row: Row = {
        _id: "guide-" + i,
        _creationTime: 1,
        slug: t.slug,
        type: "guide",
        reviewRevision: t.revision,
        version: 1,
        clinicalStatus: "clinical_review",
        titleEn: "Synthetic title",
        titleMm: "Synthetic Myanmar",
        summaryEn: "Synthetic summary",
        summaryMm: "Synthetic summary Myanmar",
        tags: ["synthetic"],
        data: { unchanged: "preserve" },
        source: "Original attribution",
        createdAt: 1,
        updatedAt: 2,
        searchText: "old",
        reviewerId: "historic",
        reviewNote: "old current metadata",
      };
      for (const p of t.patches) setLeaf(row, p.path, p.before);
      const link = {
        _id: "link-" + i,
        _creationTime: 1,
        slug: t.slug,
        kind: "guide",
        sourceIds: [...t.initialSourceIds],
        createdAt: 1,
        updatedAt: 2,
      };
      tables.libraryContent.push(row);
      tables.evidenceLinks.push(link);
      tables.contentReviews.push({
        _id: "review-" + i,
        contentSlug: t.slug,
        reviewRevision: t.revision,
        decision: "approved",
        reviewerId: "historic",
      });
      tables.contentEditLogs.push({
        _id: "edit-" + i,
        contentSlug: t.slug,
        fromVersion: 1,
        toVersion: t.revision,
      });
      tables.libraryMedia.push({
        _id: "media-" + i,
        contentSlug: t.slug,
        placeholder: true,
      });
      return {
        ...t,
        contentId: row._id,
        contentCreationTime: 1,
        initialUpdatedAt: 2,
        initialFullHash: hash(row),
        linkId: link._id,
        initialLinkHash: hash(link),
        desiredStableHash: hash(
          guideStablePostimage(correctedGuide(row, t.patches, t.revision)),
        ),
        desiredLinkStableHash: hash(
          guideStablePostimage({ ...link, sourceIds: [...t.sourceIds] }),
        ),
      };
    });
    tables.aiPublicationReleases = Array.from({ length: 10 }, (_, i) => ({
      _id: "active-" + i,
      status: "active",
      targetKey: "story\0preserved-" + i,
    }));
    const preservation: Array<{
      table: string;
      index: string;
      key: string;
      count: number;
      hash: string;
    }> = [];
    const preserve = (table: string, index: string, key: string, rows: Row[]) =>
      preservation.push({
        table,
        index,
        key,
        count: rows.length,
        hash: hash(sortedGuideRows(rows as Array<Row & { _id: unknown }>)),
      });
    for (const s of tables.evidenceSources)
      preserve("evidenceSources", "by_source_id", String(s.sourceId), [s]);
    for (const t of targetData)
      for (const table of ["contentReviews", "contentEditLogs", "libraryMedia"])
        preserve(
          table,
          "by_content",
          t.slug,
          tables[table].filter((r) => r.contentSlug === t.slug),
        );
    preserve(
      "aiPublicationConfig",
      "by_key",
      "global",
      tables.aiPublicationConfig,
    );
    preserve(
      "aiPublicationReleases",
      "by_status",
      "active",
      tables.aiPublicationReleases,
    );
    const scheduled = {
      _id: "schedule",
      state: { kind: "pending" },
      scheduledTime: actual.THREE_GUIDE_APPLY_BEFORE + 100,
    };
    state.tables = tables;
    state.schedules = { schedule: scheduled };
    return {
      ...actual,
      THREE_GUIDE_TARGETS: targetData,
      THREE_GUIDE_PRESERVATION: preservation,
      THREE_GUIDE_SCHEDULES: [{ id: "schedule", hash: hash(scheduled) }],
    };
  },
);
const invoke = (
  fn: unknown,
  ctx: unknown,
  args: Row = identity,
): Promise<Row> =>
  (fn as { _handler: (ctx: unknown, args: Row) => Promise<Row> })._handler(
    ctx,
    fn === preflight ? { checkedAt: Date.now(), ...args } : args,
  );
function fixture() {
  const tables = structuredClone(state.tables),
    schedules = structuredClone(state.schedules);
  const db = {
    system: {
      async get(id: string) {
        return schedules[id] ?? null;
      },
    },
    query(table: string) {
      const conditions: [string, unknown][] = [];
      const q = {
        eq(k: string, v: unknown) {
          conditions.push([k, v]);
          return q;
        },
      };
      const chain = {
        withIndex(_i: string, cb: (builder: typeof q) => unknown) {
          cb(q);
          return chain;
        },
        async take(n: number) {
          return (tables[table] ?? [])
            .filter((r) => conditions.every(([k, v]) => r[k] === v))
            .slice(0, n);
        },
      };
      return chain;
    },
    async get(id: string) {
      return (
        Object.values(tables)
          .flat()
          .find((r) => r._id === id) ?? null
      );
    },
    patch: vi.fn(async (id: string, p: Row) => {
      const row = await db.get(id);
      if (!row) throw Error("Missing fixture row");
      for (const [k, v] of Object.entries(p)) {
        if (v === undefined) delete row[k];
        else row[k] = v;
      }
    }),
    insert: vi.fn(async (table: string, p: Row) => {
      const id = table + "-" + tables[table].length;
      tables[table].push({ ...p, _id: id, _creationTime: Date.now() });
      return id;
    }),
  };
  const ctx = { db };
  async function transaction(args: Row = identity) {
    const before = structuredClone(tables);
    try {
      return await invoke(apply, ctx, args);
    } catch (e) {
      for (const k of Object.keys(tables)) tables[k] = before[k];
      throw e;
    }
  }
  return { tables, schedules, ctx, transaction };
}
afterEach(() => vi.restoreAllMocks());
describe("three-guide exact unpublished correction", () => {
  it("exports internal literal-bound functions and exact74patch/14draft scope", () => {
    expect(targets).toHaveLength(3);
    expect(targets.reduce((n, t) => n + t.patches.length, 0)).toBe(74);
    expect(newSources).toHaveLength(14);
    for (const f of [preflight, apply]) {
      const r = f as unknown as {
        isInternal: boolean;
        exportArgs: () => string;
      };
      expect(r.isInternal).toBe(true);
      for (const value of Object.values(identity))
        expect(r.exportArgs()).toContain(value);
    }
    for (const s of newSources) {
      expect(s.metadata.reviewStatus).toBe("awaiting_review");
      expect(s.metadata.reviewer).toBeNull();
      if (s.metadata.sourceId.endsWith("undated"))
        expect(s.metadata.year).toBeNull();
    }
  });
  it("atomically corrects3guides, registers14draft sources, preserves history/10active and idempotent receipt", async () => {
    vi.spyOn(Date, "now").mockReturnValue(capturedAt + 1000);
    const f = fixture(),
      before = structuredClone(f.tables);
    expect(await invoke(preflight, f.ctx)).toMatchObject({
      phase: "ready",
      preservationExact: true,
    });
    expect(await f.transaction()).toMatchObject({
      alreadyApplied: false,
      contentUpdated: 3,
      linksUpdated: 3,
      sourcesCreated: 14,
      humanDecisionsCreated: 0,
      publicationDecisionsMade: 0,
    });
    expect(await invoke(preflight, f.ctx)).toMatchObject({
      phase: "applied",
      receiptExact: true,
    });
    for (const [i, t] of targets.entries()) {
      expect(f.tables.libraryContent[i]).toEqual({
        ...correctedGuide(before.libraryContent[i], t.patches, t.revision),
        updatedAt: capturedAt + 1000,
      });
      expect(f.tables.evidenceLinks[i].sourceIds).toEqual(t.sourceIds);
    }
    for (const table of [
      "contentReviews",
      "contentEditLogs",
      "libraryMedia",
      "aiPublicationConfig",
      "aiPublicationReleases",
    ])
      expect(f.tables[table]).toEqual(before[table]);
    expect(
      f.tables.evidenceSources.slice(0, before.evidenceSources.length),
    ).toEqual(before.evidenceSources);
    expect(f.tables.auditLogs).toHaveLength(1);
    expect(f.tables.auditLogs[0].actorId).toBeUndefined();
    const writes =
      f.ctx.db.patch.mock.calls.length + f.ctx.db.insert.mock.calls.length;
    vi.spyOn(Date, "now").mockReturnValue(applyBefore + 1);
    expect(await f.transaction()).toMatchObject({
      alreadyApplied: true,
      contentUpdated: 0,
      sourcesCreated: 0,
    });
    expect(
      f.ctx.db.patch.mock.calls.length + f.ctx.db.insert.mock.calls.length,
    ).toBe(writes);
  });
  it.each([
    "content",
    "revision",
    "status",
    "source",
    "link",
    "duplicate_content",
    "wrong_type_link",
    "review",
    "edit_log",
    "media",
    "assignment",
    "ai_pointer",
    "ai_release",
    "ai_audit",
    "config",
    "active",
    "schedule",
    "source_id_collision",
    "source_url_alias",
    "source_title_alias",
    "receipt",
    "expired",
  ] as const)("blocks %s before writes", async (drift) => {
    vi.spyOn(Date, "now").mockReturnValue(capturedAt + 1000);
    const f = fixture(),
      row = f.tables.libraryContent[0];
    if (drift === "content") row.summaryEn = "drift";
    if (drift === "revision") row.reviewRevision = 88;
    if (drift === "status") row.clinicalStatus = "published";
    if (drift === "source")
      f.tables.evidenceSources[0].reviewStatus = "retired";
    if (drift === "link") f.tables.evidenceLinks[0].sourceIds = [];
    if (drift === "duplicate_content")
      f.tables.libraryContent.push({ ...row, _id: "duplicate" });
    if (drift === "wrong_type_link")
      f.tables.evidenceLinks.push({
        ...f.tables.evidenceLinks[0],
        _id: "wrong-link",
        kind: "story",
      });
    if (drift === "review")
      f.tables.contentReviews[0].decision = "changes_requested";
    if (drift === "edit_log") f.tables.contentEditLogs[0].toVersion = 99;
    if (drift === "media") f.tables.libraryMedia[0].placeholder = false;
    if (drift === "assignment")
      f.tables.clinicalReviewAssignments.push({
        _id: "a",
        contentSlug: row.slug,
      });
    if (drift === "ai_pointer") row.aiPublicationReleaseId = "bad";
    if (drift === "ai_release")
      f.tables.aiPublicationReleases.push({
        _id: "r",
        targetKey: "guide\0" + row.slug,
        status: "revoked",
      });
    if (drift === "ai_audit")
      f.tables.aiContentAudits.push({ _id: "a", contentSlug: row.slug });
    if (drift === "config") f.tables.aiPublicationConfig[0].generation = 4;
    if (drift === "active")
      f.tables.aiPublicationReleases[0].status = "revoked";
    if (drift === "schedule") f.schedules.schedule.state = { kind: "canceled" };
    if (drift.startsWith("source_") && drift !== "source")
      f.tables.evidenceSources.push({
        _id: "collision",
        sourceId:
          drift === "source_id_collision"
            ? newSources[0].metadata.sourceId
            : "other",
        title:
          drift === "source_title_alias"
            ? newSources[0].metadata.title
            : "other",
        url:
          drift === "source_url_alias"
            ? newSources[0].metadata.url
            : "https://example.invalid/new",
      });
    if (drift === "receipt")
      f.tables.auditLogs.push({
        _id: "receipt",
        action: "release.three_guide_unpublished_correction",
        after: "{}",
      });
    if (drift === "expired") vi.spyOn(Date, "now").mockReturnValue(applyBefore);
    await expect(f.transaction()).rejects.toThrow();
    expect(f.ctx.db.patch).not.toHaveBeenCalled();
    expect(f.ctx.db.insert).not.toHaveBeenCalled();
  });
  it.each(Object.keys(identity))("rejects wrong identity %s", async (key) => {
    vi.spyOn(Date, "now").mockReturnValue(capturedAt + 1000);
    const f = fixture();
    await expect(
      f.transaction({ ...identity, [key]: "wrong" }),
    ).rejects.toThrow("identity");
    expect(f.ctx.db.insert).not.toHaveBeenCalled();
  });
  it("does not let query clock extend actual mutation window", async () => {
    vi.spyOn(Date, "now").mockReturnValue(applyBefore);
    const f = fixture();
    expect(
      await invoke(preflight, f.ctx, {
        ...identity,
        checkedAt: capturedAt + 1,
      }),
    ).toMatchObject({ phase: "ready" });
    await expect(f.transaction()).rejects.toThrow("window");
  });
  it("blocks duplicate exact receipt on replay without writes", async () => {
    vi.spyOn(Date, "now").mockReturnValue(capturedAt + 1000);
    const f = fixture();
    await f.transaction();
    f.tables.auditLogs.push({
      ...f.tables.auditLogs[0],
      _id: "duplicate-receipt",
    });
    const writes = f.ctx.db.insert.mock.calls.length;
    await expect(f.transaction()).rejects.toThrow("duplicated");
    expect(f.ctx.db.insert.mock.calls.length).toBe(writes);
  });
  it("blocks static pilot governance without persisted assignments", async () => {
    vi.spyOn(Date, "now").mockReturnValue(capturedAt + 1000);
    const f = fixture(),
      registry = CLINICAL_REVIEW_BATCH_REGISTRY as unknown as Row[];
    registry.push({
      manifest: { items: [{ slug: targets[0].slug }] },
      authority: "pilot",
    });
    try {
      await expect(f.transaction()).rejects.toThrow("refreeze");
      expect(f.ctx.db.insert).not.toHaveBeenCalled();
    } finally {
      registry.pop();
    }
  });
  it("rolls back all new sources and guides on postflight drift", async () => {
    vi.spyOn(Date, "now").mockReturnValue(capturedAt + 1000);
    const f = fixture(),
      before = structuredClone(f.tables),
      original = f.ctx.db.patch.getMockImplementation()!;
    f.ctx.db.patch.mockImplementation(async (id, p) => {
      await original(id, p);
      f.tables.contentEditLogs[0].injected = true;
    });
    await expect(f.transaction()).rejects.toThrow("postflight");
    expect(f.tables).toEqual(before);
  });
  it.each([
    "new_source_approval",
    "new_source_date",
    "new_source_id",
    "body",
    "link",
    "history",
    "receipt_binding",
  ] as const)("blocks replay after %s change", async (drift) => {
    vi.spyOn(Date, "now").mockReturnValue(capturedAt + 1000);
    const f = fixture();
    await f.transaction();
    const s = f.tables.evidenceSources.find(
      (s) => s.sourceId === newSources[0].metadata.sourceId,
    )!;
    if (drift === "new_source_approval") s.reviewStatus = "approved";
    if (drift === "new_source_date") s.year = 2015;
    if (drift === "new_source_id") s._id = "new-id";
    if (drift === "body") f.tables.libraryContent[0].summaryEn = "later";
    if (drift === "link") f.tables.evidenceLinks[0].sourceIds = [];
    if (drift === "history") f.tables.contentReviews[0].decision = "in_review";
    if (drift === "receipt_binding")
      f.tables.auditLogs[0].after = String(f.tables.auditLogs[0].after).replace(
        String(s._id),
        "fake",
      );
    const writes =
      f.ctx.db.patch.mock.calls.length + f.ctx.db.insert.mock.calls.length;
    await expect(f.transaction()).rejects.toThrow();
    expect(
      f.ctx.db.patch.mock.calls.length + f.ctx.db.insert.mock.calls.length,
    ).toBe(writes);
  });
  it("rejects unsafe, duplicate, missing and stale patch leaves", () => {
    const row: Row = {
      type: "guide",
      clinicalStatus: "clinical_review",
      reviewRevision: 1,
      summaryEn: "old",
      titleEn: "x",
      titleMm: "x",
      tags: [],
      data: {},
    };
    expect(() =>
      correctedGuide(row, [{ path: "reviewerId", before: "a", after: "b" }], 1),
    ).toThrow("Unallowed");
    expect(() =>
      correctedGuide(
        row,
        [{ path: "summaryEn", before: "wrong", after: "new" }],
        1,
      ),
    ).toThrow("preimage");
    expect(() =>
      correctedGuide(
        row,
        [
          { path: "summaryEn", before: "old", after: "new" },
          { path: "summaryEn", before: "new", after: "next" },
        ],
        1,
      ),
    ).toThrow("duplicate");
    expect(() =>
      correctedGuide(
        row,
        [{ path: "data.safety.en", before: "x", after: "y" }],
        1,
      ),
    ).toThrow("Missing");
  });
});
