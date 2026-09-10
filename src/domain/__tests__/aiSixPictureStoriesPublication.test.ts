import { afterEach, describe, expect, it, vi } from "vitest";
import {
  activate,
  expire,
  preflight,
  stage,
  withdraw,
  SIX_PICTURE_STORIES_VISIBILITY_CUTOFF,
} from "../../../convex/aiSixPictureStoriesPublication20260910";
import {
  SIX_PICTURE_STORIES_ARTIFACT as artifact,
  SIX_PICTURE_STORIES_ARTIFACT_HASH as artifactHash,
} from "../../../convex/lib/aiSixPictureStoriesPublication20260910Artifact";
import {
  SIX_PICTURE_STORIES_PREIMAGE as preimage,
  SIX_PICTURE_STORIES_PRESERVATION as preservation,
  SIX_PICTURE_STORIES_OLD_SCHEDULES as oldSchedules,
  SIX_PICTURE_STORIES_RELEASE_ROOT as root,
  SIX_PICTURE_STORIES_SLUGS as slugs,
  SIX_PICTURE_STORIES_DESIRED_FIELDS as desiredFields,
  SIX_PICTURE_STORIES_AGGREGATE_ACTIVE_CAP as aggregateActiveCap,
  SIX_PICTURE_STORIES_BATCH_GENERATION as batchGeneration,
} from "../../../convex/lib/aiSixPictureStoriesPublication20260910Data";
import * as hashes from "../../../convex/lib/aiAuditHash";
import * as visibility from "../../../convex/lib/aiPublicationVisibility";

type Row = Record<string, unknown>;
const realHash = hashes.sha256Canonical;
const now = Math.max(preimage.capturedAt, artifact.auditCompletedAt) + 1000;
const identity = {
  releaseRoot: root,
  artifactHash,
  snapshotSha256: preimage.snapshotSha256,
};
const operator = {
  operator: "Synthetic lifecycle test, not human approval",
  gitCommit: "a".repeat(40),
};
const invoke = (fn: unknown, ctx: unknown, args: Row) =>
  (fn as { _handler: (ctx: unknown, args: Row) => Promise<Row> })._handler(
    ctx,
    args,
  );
const sorted = (rows: Row[]) =>
  [...rows].sort((a, b) => String(a._id).localeCompare(String(b._id)));
const omit = (row: Row, keys: string[]) =>
  Object.fromEntries(
    Object.entries(row).filter(([key]) => !keys.includes(key)),
  );
const changed = [
  "titleMm",
  "summaryMm",
  "summaryEn",
  "data",
  "searchText",
  "reviewRevision",
  "updatedAt",
  "aiPublicationReleaseId",
  "aiPublishedAt",
  "reviewerId",
  "reviewerQualification",
  "reviewerDisplayName",
  "reviewScope",
  "reviewedAt",
  "nextReviewAt",
  "reviewNote",
];

// Synthetic fixtures map exact immutable preimage hashes; the separate private
// lifecycle script exercises the full real packet and unmocked parent matcher.
async function fixture() {
  vi.stubEnv("AI_PUBLICATION_ENABLED", "true");
  vi.spyOn(Date, "now").mockReturnValue(now);
  const config: Row = {
    _id: "config",
    key: "global",
    enabled: true,
    generation: 3,
  };
  const tables: Record<string, Row[]> = {
    libraryContent: [],
    evidenceLinks: [],
    evidenceSources: [],
    contentReviews: [],
    libraryMedia: [],
    clinicalReviewAssignments: [],
    aiPublicationReleases: [],
    aiAuditRuns: [],
    aiContentAudits: [],
    aiEvidenceAudits: [],
    aiPublicationConfig: [config],
    auditLogs: [],
  };
  const mappings: [unknown, string][] = [[config, preimage.configFullHash]];
  const targets = preimage.targets.map((pin, i) => {
    const content: Row = {
      _id: pin.contentId,
      _creationTime: 1,
      createdAt: 1,
      slug: pin.slug,
      type: "activity",
      titleEn: "Title",
      titleMm: "Old title",
      summaryMm: "Old mm",
      summaryEn: "Old en",
      data: { body: { en: "old", mm: "old" } },
      source: "Synthetic",
      tags: [],
      version: 1,
      searchText: "old",
      clinicalStatus: "clinical_review",
      reviewRevision: pin.currentRevision,
      updatedAt: pin.contentUpdatedAt,
    };
    const link: Row = {
      _id: pin.linkId,
      _creationTime: 1,
      createdAt: 1,
      kind: "activity",
      slug: pin.slug,
      sourceIds: [...pin.currentSourceIds],
      updatedAt: pin.linkUpdatedAt,
    };
    const sources = pin.sourceRows.map((s) => {
      const existing = tables.evidenceSources.find(
        (row) => row.sourceId === s.sourceId,
      );
      if (existing) return existing;
      const source: Row = {
        _id: "source-" + s.sourceId,
        _creationTime: 1,
        createdAt: 1,
        sourceId: s.sourceId,
        org: "Synthetic",
        orgKey: "Synthetic",
        title: s.sourceId,
        authors: null,
        year: 2026,
        edition: null,
        country: "United States",
        language: "en",
        url: s.url,
        doi: null,
        isbn: null,
        pmid: null,
        evidenceLevel: "parent_education",
        reviewStatus: "approved",
        keywords: [],
        topics: [],
        ageMonthsMin: null,
        ageMonthsMax: null,
        verifiedOn: "2026-09-10",
        verifiedNote: "Synthetic fixture",
        nextReviewDate: "2027-09-10",
        updatedAt: s.sourceUpdatedAt,
      };
      tables.evidenceSources.push(source);
      return source;
    });
    const media: Row[] = [
      {
        _id: "media-illustration-" + pin.slug,
        _creationTime: 1,
        contentSlug: pin.slug,
        kind: "illustration",
        offline: true,
        placeholder: true,
      },
      {
        _id: "media-video-" + pin.slug,
        _creationTime: 2,
        contentSlug: pin.slug,
        kind: "video",
        placeholder: true,
      },
    ];
    const reviews = Array.from({ length: pin.reviewsCount }, (_, reviewIndex) => ({
      _id: `review-${pin.slug}-${reviewIndex}`,
      contentSlug: pin.slug,
      marker: "preserved historical human review",
    }));
    tables.libraryContent.push(content);
    tables.evidenceLinks.push(link);
    tables.libraryMedia.push(...media);
    tables.contentReviews.push(...reviews);
    mappings.push(
      [content, pin.contentFullHash],
      [omit(content, changed), pin.preservedContentHash],
      [link, pin.linkFullHash],
      [omit(link, ["sourceIds", "updatedAt"]), pin.preservedLinkHash],
      [sorted(sources), pin.sourcesFullHash],
      [sorted(media), pin.mediaFullHash],
      [sorted(reviews), pin.reviewsFullHash],
    );
    for (const [j, source] of sources.entries())
      mappings.push(
        [source, pin.sourceRows[j].fullHash],
        [
          hashes.aiEvidenceSnapshot(source as never),
          pin.sourceRows[j].snapshotHash,
        ],
      );
    mappings.push(
      [
        hashes.aiContentSnapshot({
          ...content,
          ...desiredFields[i],
          reviewRevision: pin.desiredRevision,
        } as never),
        pin.desiredContentSnapshotHash,
      ],
      [
        hashes.aiEvidenceLinkSnapshot({
          ...link,
          sourceIds: [...pin.sourceIds],
        } as never),
        pin.linkSnapshotHash,
      ],
    );
    return { content, link, sources, media, pin };
  });
  const virtual = new Map<string, Row[]>();
  for (const d of preservation) {
    let rows: Row[];
    if (
      d.table === "evidenceSources" &&
      tables.evidenceSources.some((row) => row.sourceId === d.key)
    )
      rows = tables.evidenceSources.filter((row) => row.sourceId === d.key);
    else if (d.table === "aiPublicationConfig") rows = [config];
    else
      rows = Array.from({ length: d.count }, (_, i) => ({
        _id: "preserved-" + d.table + "-" + d.index + "-" + d.key + "-" + i,
        [d.field]: d.key,
      }));
    virtual.set(JSON.stringify([d.table, d.index, d.key]), rows);
    mappings.push([sorted(rows), d.hash]);
  }
  const scheduleRows = oldSchedules.map((d) => ({
    _id: d.id,
    marker: "old schedule",
  }));
  scheduleRows.forEach((row, i) => mappings.push([row, oldSchedules[i].hash]));
  const mapped = new Map(
    await Promise.all(
      mappings.map(
        async ([value, digest]) => [await realHash(value), digest] as const,
      ),
    ),
  );
  vi.spyOn(hashes, "sha256Canonical").mockImplementation(async (value) => {
    const digest = await realHash(value);
    return mapped.get(digest) ?? digest;
  });
  const schedules = new Map<string, Row>(
    scheduleRows.map((row) => [row._id, row]),
  );
  const db = {
    system: {
      async get(id: string) {
        return schedules.get(id) ?? null;
      },
    },
    query(table: string) {
      const conditions: [string, unknown][] = [];
      let index = "";
      const builder = {
        eq(key: string, value: unknown) {
          conditions.push([key, value]);
          return builder;
        },
      };
      const q = {
        withIndex(name: string, cb: (b: typeof builder) => unknown) {
          index = name;
          cb(builder);
          return q;
        },
        async take(n: number) {
          const stored = (tables[table] ?? []).filter((row) =>
            conditions.every(([k, v]) => row[k] === v),
          );
          const pinned = virtual.get(
            JSON.stringify([table, index, conditions[0]?.[1]]),
          );
          return (
            pinned
              ? [...pinned, ...(table === "aiEvidenceAudits" ? stored : [])]
              : stored
          ).slice(0, n);
        },
        async unique() {
          const rows = await q.take(2);
          if (rows.length > 1) throw new Error("duplicate");
          return rows[0] ?? null;
        },
      };
      return q;
    },
    async get(id: string) {
      return (
        Object.values(tables)
          .flat()
          .find((row) => row._id === id) ?? null
      );
    },
    insert: vi.fn(async (table: string, value: Row) => {
      const id = "new-" + table + "-" + tables[table].length;
      tables[table].push({ ...value, _id: id, _creationTime: now });
      return id;
    }),
    patch: vi.fn(async (id: string, fields: Row) => {
      const row = await db.get(id);
      if (!row) throw new Error("missing");
      for (const [k, v] of Object.entries(fields))
        v === undefined ? delete row[k] : (row[k] = v);
    }),
  };
  const scheduler = {
    runAt: vi.fn(async (time: number, _ref: unknown, args: Row) => {
      const id = "six-picture-story-expiry";
      schedules.set(id, {
        _id: id,
        name: "aiSixPictureStoriesPublication20260910.js:expire",
        scheduledTime: time,
        state: { kind: "pending" },
        args: [args],
      });
      return id;
    }),
  };
  const previous = [
    "lsn_talk_more",
    "lsn_making_friends",
    "lsn_creativity",
    "lsn_prepare_preschool",
    "lsn_what_is_development",
    "lsn_big_feelings",
    "lsn_power_of_play",
    "lsn_reading_together",
    "lsn_early_math",
    "st_waiting_at_clinic",
    "st_first_day_school",
    "st_little_seed",
    "st_ba_ba_sounds",
    "st_when_i_feel_angry",
    "st_taking_turns",
    "st_goodnight_moon_friend",
    "st_visit_to_doctor",
    "st_sharing_mango",
  ].map((slug) => ({ _id: slug, slug }));
  vi.spyOn(visibility, "contentIsAiParentReadable").mockImplementation(
    async (_ctx, row) =>
      slugs.some((slug) => row.slug === slug) &&
      row.aiPublicationReleaseId === root + ":activity:" + row.slug,
  );
  vi.spyOn(visibility, "activeAiParentReadableContent").mockImplementation(
    async () => ({
      complete: true,
      rows: [
        ...previous,
        ...tables.libraryContent.filter((row) => row.aiPublicationReleaseId),
      ] as never,
    }),
  );
  const ctx = { db, scheduler };
  async function transaction(fn: unknown, extra: Row = {}) {
    const saved = structuredClone(tables),
      savedSchedules = structuredClone([...schedules]);
    try {
      return await invoke(fn, ctx, { ...identity, ...extra });
    } catch (error) {
      for (const key of Object.keys(tables)) tables[key] = saved[key];
      schedules.clear();
      for (const [k, v] of savedSchedules) schedules.set(k, v);
      throw error;
    }
  }
  return { ctx, targets, tables, config, virtual, schedules, transaction };
}
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
describe("atomic exact six-picture-story AI lifecycle", () => {
  it("matches immutable full artifact and manifest hashes", async () => {
    expect(artifact.batchGeneration).toBe(batchGeneration);
    expect(aggregateActiveCap).toBe(24);
    expect(await realHash(artifact)).toBe(artifactHash);
    expect(
      await realHash(omit(preimage as unknown as Row, ["snapshotSha256"])),
    ).toBe(preimage.snapshotSha256);
  });
  it("stages all six dark then activates all six with one schedule, no human writes and idempotent replay", async () => {
    const f = await fixture();
    const reviewsBefore = structuredClone(f.tables.contentReviews);
    const configBefore = structuredClone(f.config);
    expect(await f.transaction(preflight, { checkedAt: now })).toMatchObject({
      phase: "ready",
      activeReleaseCount: 18,
    });
    expect(await f.transaction(stage, operator)).toMatchObject({
      phase: "staged",
      activeReleaseCount: 18,
      parentReadable: false,
    });
    expect(f.tables.libraryContent.map((row) => row.reviewRevision)).toEqual([
      6, 6, 7, 6, 6, 6,
    ]);
    expect(f.tables.contentReviews).toEqual(reviewsBefore);
    expect(f.config).toEqual(configBefore);
    expect(f.tables.aiAuditRuns).toHaveLength(18);
    expect(f.tables.aiContentAudits).toHaveLength(6);
    expect(f.tables.aiEvidenceAudits).toHaveLength(12);
    const staged = structuredClone(f.tables);
    await f.transaction(stage, operator);
    expect(f.tables).toEqual(staged);
    expect(
      await f.transaction(activate, {
        operator: "Synthetic",
        expectedGeneration: 3,
      }),
    ).toMatchObject({
      phase: "enabled",
      activeReleaseCount: 24,
      parentReadable: true,
    });
    expect(f.ctx.scheduler.runAt).toHaveBeenCalledTimes(1);
    expect(f.config).toEqual(configBefore);
    const enabled = structuredClone(f.tables);
    await f.transaction(activate, {
      operator: "Replay",
      expectedGeneration: 3,
    });
    expect(f.tables).toEqual(enabled);
    vi.spyOn(Date, "now").mockReturnValue(now + 8 * 86400000);
    expect(
      await f.transaction(preflight, { checkedAt: now + 8 * 86400000 }),
    ).toMatchObject({ phase: "enabled" });
    await expect(f.transaction(expire)).rejects.toThrow(/early/);
    vi.spyOn(Date, "now").mockReturnValue(SIX_PICTURE_STORIES_VISIBILITY_CUTOFF);
    expect(await f.transaction(expire)).toEqual({
      revoked: 6,
      pointersCleared: 6,
    });
    expect(await f.transaction(expire)).toEqual({
      revoked: 0,
      pointersCleared: 0,
    });
  });
  it.each([0, 1, 2, 3, 4, 5])(
    "blocks target %s content drift with zero atomic writes",
    async (index) => {
      const f = await fixture();
      f.targets[index].content.summaryEn = "Changed";
      const before = structuredClone(f.tables);
      await expect(f.transaction(stage, operator)).rejects.toThrow();
      expect(f.tables).toEqual(before);
    },
  );
  it.each([
    "source",
    "link",
    "media",
    "review",
    "assignment",
    "audit",
    "pointer",
  ] as const)(
    "rejects second-target staged %s drift, never partially activates",
    async (kind) => {
      const f = await fixture();
      await f.transaction(stage, operator);
      const t = f.targets[1];
      if (kind === "source") t.sources[0].verifiedNote = "drift";
      if (kind === "link") t.link.sourceIds = [];
      if (kind === "media")
        t.media[0].url = "https://example.invalid/unreviewed.png";
      if (kind === "review")
        f.tables.contentReviews.push({
          _id: "new-review",
          contentSlug: slugs[1],
          reviewRevision: 5,
        });
      if (kind === "assignment")
        f.tables.clinicalReviewAssignments.push({
          _id: "assignment",
          contentSlug: slugs[1],
        });
      if (kind === "audit")
        f.tables.aiContentAudits.find(
          (row) => row.contentSlug === slugs[1],
        )!.verdict = "blocked";
      if (kind === "pointer") t.content.aiPublicationReleaseId = "wrong";
      const before = structuredClone(f.tables);
      await expect(
        f.transaction(activate, {
          operator: "Synthetic",
          expectedGeneration: 3,
        }),
      ).rejects.toThrow();
      expect(f.tables).toEqual(before);
      expect(f.tables.aiPublicationReleases).toHaveLength(0);
      expect(f.ctx.scheduler.runAt).not.toHaveBeenCalled();
    },
  );
  it.each(["config", "old_release", "old_audit", "old_schedule"] as const)(
    "rejects preservation %s drift",
    async (kind) => {
      const f = await fixture();
      if (kind === "config") f.config.generation = 4;
      else if (kind === "old_schedule") f.schedules.delete(oldSchedules[0].id);
      else {
        const d = preservation.find(
          (d) =>
            d.table ===
              (kind === "old_release"
                ? "aiPublicationReleases"
                : "aiEvidenceAudits") && d.count > 0,
        )!;
        f.virtual.get(JSON.stringify([d.table, d.index, d.key]))![0].changed =
          true;
      }
      await expect(f.transaction(stage, operator)).rejects.toThrow();
    },
  );
  it.each([0, 1, 2, 3, 4, 5])(
    "rejects exact run collision for target %s",
    async (index) => {
      const f = await fixture();
      f.tables.aiContentAudits.push({
        _id: "orphan",
        contentSlug: "wrong-slug",
        runId: root + ":content:" + slugs[index],
      });
      await expect(f.transaction(stage, operator)).rejects.toThrow();
    },
  );
  it.each([
    ["act_picture_story_2_5y", "who-care-for-child-development-2012"],
    ["act_picture_story_3y", "who-care-for-child-development-2012"],
    ["act_picture_story_3_5y", "who-care-for-child-development-2012"],
    ["act_picture_story_4y", "who-care-for-child-development-2012"],
    ["act_picture_story_4_5y", "who-care-for-child-development-2012"],
    ["act_picture_story_5y", "who-care-for-child-development-2012"],
  ] as const)(
    "rejects unvalidated removed-source audit %s:%s when pinned",
    async (slug, sourceId) => {
      const f = await fixture();
      const target = preimage.targets.find((t) => t.slug === slug);
      expect(target).toBeDefined();
      f.tables.aiEvidenceAudits.push({
        _id: "unvalidated",
        sourceId,
        runId: root + ":evidence:" + slug + ":" + sourceId,
      });
      await expect(f.transaction(stage, operator)).rejects.toThrow(
        /preservation/,
      );
    },
  );
  it("rolls back the first target when second-target write fails", async () => {
    const f = await fixture();
    const before = structuredClone(f.tables);
    const original = f.ctx.db.patch.getMockImplementation()!;
    f.ctx.db.patch.mockImplementation(async (id, fields) => {
      if (id === preimage.targets[5].contentId)
        throw new Error("Injected sixth-target failure");
      return original(id, fields);
    });
    await expect(f.transaction(stage, operator)).rejects.toThrow(
      /sixth-target/,
    );
    expect(f.tables).toEqual(before);
  });
  it("rejects old audit/identity/master and never restamps", async () => {
    const f = await fixture();
    await expect(
      invoke(preflight, f.ctx, {
        ...identity,
        artifactHash: "f".repeat(64),
        checkedAt: now,
      }),
    ).rejects.toThrow();
    vi.spyOn(Date, "now").mockReturnValue(now + 8 * 86400000);
    await expect(f.transaction(stage, operator)).rejects.toThrow();
    vi.spyOn(Date, "now").mockReturnValue(now);
    vi.stubEnv("AI_PUBLICATION_ENABLED", "false");
    await expect(f.transaction(stage, operator)).rejects.toThrow();
  });
  it("withdraws all six exactly, preserves a newer pointer and cannot reactivate", async () => {
    const f = await fixture();
    await f.transaction(stage, operator);
    await f.transaction(activate, {
      operator: "Synthetic",
      expectedGeneration: 3,
    });
    f.targets[5].content.aiPublicationReleaseId = "newer";
    expect(await f.transaction(withdraw)).toEqual({
      revoked: 6,
      pointersCleared: 5,
    });
    expect(f.targets[5].content.aiPublicationReleaseId).toBe("newer");
    await expect(
      f.transaction(activate, { operator: "Synthetic", expectedGeneration: 3 }),
    ).rejects.toThrow();
  });
});
