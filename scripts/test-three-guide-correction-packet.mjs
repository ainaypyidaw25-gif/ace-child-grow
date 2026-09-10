// Local-only actual private packet replay. No network, deployment or production writes.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { build } from "esbuild";
const dir = "artifacts/next-guide-corrections-20260910/";
const raw = readFileSync(dir + "full-state-1789025953704.json");
const sha = (x) => createHash("sha256").update(x).digest("hex");
assert.equal(
  sha(raw),
  "abc77f995b255076555660453256b6a33ef35d211a8ee84ec2cce9edb122241b",
);
const sourcesRaw = readFileSync(dir + "source-registration-proposal.json");
assert.equal(
  sha(sourcesRaw),
  "34499843d41c7c1473747faea53a8d8276bdbf65f8268ab430414e18dab7505a",
);
const packet = JSON.parse(raw),
  sources = JSON.parse(sourcesRaw);
const bundle = await build({
  stdin: {
    contents:
      "export * from './convex/threeGuideCorrection';export * from './convex/lib/threeGuideCorrectionData';export * from './convex/lib/aiAuditHash';",
    resolveDir: process.cwd(),
  },
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
});
const h = await import(
  "data:text/javascript;base64," +
    Buffer.from(bundle.outputFiles[0].text).toString("base64")
);
const tables = {},
  scheduled = new Map(),
  stats = { reads: 0, bytes: 0, writes: 0 };
const add = (table, rows) => {
  tables[table] ??= [];
  for (const row of rows) {
    const old = tables[table].find((r) => r._id === row._id);
    if (old) assert.deepEqual(old, row);
    else tables[table].push(structuredClone(row));
  }
};
for (const t of [...packet.targets, ...packet.preservedTargets]) {
  add("libraryContent", [t.content]);
  add("evidenceLinks", [t.link]);
  add("evidenceSources", [...t.sources, ...t.historicalSources]);
  for (const [table, key] of Object.entries({
    contentReviews: "reviews",
    contentEditLogs: "editLogs",
    libraryMedia: "media",
    clinicalReviewAssignments: "assignments",
    clinicalReviewBatches: "batches",
    clinicalReviewBatchReceipts: "batchReceipts",
    aiPublicationReleases: "releases",
    aiAuditRuns: "runs",
    aiContentAudits: "contentAudits",
    aiEvidenceAudits: "evidenceAudits",
  }))
    add(table, t[key]);
}
add(
  "evidenceSources",
  sources.existingPinnedRows.map((r) => r.row),
);
add("aiPublicationConfig", packet.config);
add("aiPublicationReleases", packet.activeReleases);
add("auditLogs", packet.preservationReceipts);
for (const s of packet.scheduledExpiries)
  scheduled.set(s.scheduled._id, s.scheduled);
const read = (rows) => {
  stats.reads += rows.length;
  stats.bytes += Buffer.byteLength(JSON.stringify(rows));
  return rows;
};
const db = {
  system: {
    async get(id) {
      return read([scheduled.get(id) ?? null])[0];
    },
  },
  query(table) {
    const conditions = [],
      q = {
        eq(k, v) {
          conditions.push([k, v]);
          return q;
        },
      };
    const chain = {
      withIndex(_index, cb) {
        cb(q);
        return chain;
      },
      async take(n) {
        return read(
          (tables[table] ?? [])
            .filter((r) => conditions.every(([k, v]) => r[k] === v))
            .slice(0, n),
        );
      },
    };
    return chain;
  },
  async get(id) {
    return read([
      Object.values(tables)
        .flat()
        .find((r) => r._id === id) ?? null,
    ])[0];
  },
  async insert(table, p) {
    const id = "local-" + table + "-" + tables[table].length;
    tables[table].push({
      ...structuredClone(p),
      _id: id,
      _creationTime: Date.now(),
    });
    stats.writes++;
    return id;
  },
  async patch(id, p) {
    const row = await db.get(id);
    assert(row);
    for (const [k, v] of Object.entries(p)) {
      if (v === undefined) delete row[k];
      else row[k] = structuredClone(v);
    }
    stats.writes++;
  },
};
const original = structuredClone(tables),
  originalSchedules = structuredClone(scheduled),
  identity = h.THREE_GUIDE_IDENTITY,
  realNow = Date.now;
try {
  Date.now = () => packet.capturedAt + 1000;
  assert.equal(
    (await h.preflight._handler({ db }, { ...identity, checkedAt: Date.now() }))
      .phase,
    "ready",
  );
  stats.reads = 0;
  stats.bytes = 0;
  const applied = await h.apply._handler({ db }, identity);
  assert.equal(applied.sourcesCreated, 14);
  assert.equal(applied.contentUpdated, 3);
  assert.equal(applied.humanDecisionsCreated, 0);
  assert.equal(applied.publicationDecisionsMade, 0);
  const applyStats = { ...stats };
  assert.equal(stats.writes, 21);
  assert(stats.reads < 16000);
  assert(stats.bytes < 8 * 1024 * 1024);
  assert.equal(
    (await h.preflight._handler({ db }, { ...identity, checkedAt: Date.now() }))
      .phase,
    "applied",
  );
  for (const [table, rows] of Object.entries(original))
    for (const row of rows) {
      if (
        table === "libraryContent" &&
        packet.targets.some((t) => t.content._id === row._id)
      )
        continue;
      if (
        table === "evidenceLinks" &&
        packet.targets.some((t) => t.link._id === row._id)
      )
        continue;
      assert.deepEqual(
        tables[table].find((r) => r._id === row._id),
        row,
        table + " existing row preserved",
      );
    }
  assert.deepEqual(scheduled, originalSchedules);
  const writes = stats.writes;
  Date.now = () => h.THREE_GUIDE_APPLY_BEFORE + 1;
  assert.equal((await h.apply._handler({ db }, identity)).alreadyApplied, true);
  assert.equal(stats.writes, writes);
  const corrected = tables.libraryContent.filter((r) =>
    packet.targets.some((t) => t.content._id === r._id),
  );
  assert.deepEqual(
    corrected.map((r) => r.reviewRevision),
    [7, 5, 4],
  );
  assert(
    corrected.every(
      (r) =>
        r.clinicalStatus === "clinical_review" &&
        !r.aiPublicationReleaseId &&
        !r.reviewerId,
    ),
  );
  console.log(
    JSON.stringify(
      {
        result: "PASS",
        actualPacketSha256: sha(raw),
        targets: 3,
        patches: 74,
        newAwaitingReviewSources: 14,
        existingActivePreviewsPreserved: 10,
        schedulesPreserved: 3,
        actualApplyStats: applyStats,
        idempotentReplay: "zero writes",
        productionMutations: 0,
      },
      null,
      2,
    ),
  );
} finally {
  Date.now = realNow;
}
