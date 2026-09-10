// Local-only real-hash lifecycle replay. Never contacts or mutates production.
// The private packet is read from an ignored path; no private rows are printed.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { build } from "esbuild";
const sha = (x) => createHash("sha256").update(x).digest("hex");
const inputPath =
  "artifacts/seven-story-preflight-20260910/snapshot-1789023135798.json";
const raw = readFileSync(inputPath);
assert.equal(
  sha(raw),
  "43032a73f71eb6b4546b3e2834077ff086a5937aa57e38cbe081b198925c1689",
);
const packet = JSON.parse(raw);
const bundle = await build({
  stdin: {
    contents: `export * from './convex/aiSevenStoriesPublication20260910';export * from './convex/lib/aiSevenStoriesPublication20260910Data';export * from './convex/lib/aiSevenStoriesPublication20260910Artifact';export * from './convex/lib/aiPublicationVisibility';export * from './convex/lib/aiAuditHash';`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
});
const h = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);
assert.equal(
  await h.sha256Canonical(h.SEVEN_STORIES_ARTIFACT),
  h.SEVEN_STORIES_ARTIFACT_HASH,
);
const identity = {
  releaseRoot: h.SEVEN_STORIES_RELEASE_ROOT,
  artifactHash: h.SEVEN_STORIES_ARTIFACT_HASH,
  snapshotSha256: sha(raw),
};
const tables = {},
  scheduled = new Map(),
  stats = { calls: 0, rows: 0, bytes: 0, writes: 0 };
const add = (table, rows) => {
  tables[table] ??= [];
  for (const row of rows) {
    if (!row) continue;
    const existing = tables[table].find((r) => r._id === row._id);
    if (existing) assert.deepEqual(existing, row);
    else tables[table].push(structuredClone(row));
  }
};
for (const target of [...packet.targets, ...packet.preservedTargets]) {
  add("libraryContent", [target.content]);
  add("evidenceLinks", [target.link]);
  add("evidenceSources", [...target.sources, ...target.historicalSources]);
  for (const [table, key] of Object.entries({
    contentReviews: "reviews",
    libraryMedia: "media",
    clinicalReviewAssignments: "assignments",
    clinicalReviewBatches: "batches",
    clinicalReviewBatchReceipts: "batchReceipts",
    aiPublicationReleases: "releases",
    aiAuditRuns: "runs",
    aiContentAudits: "contentAudits",
    aiEvidenceAudits: "evidenceAudits",
  }))
    add(table, target[key]);
}
add("aiPublicationConfig", packet.config);
add("aiPublicationReleases", packet.activeReleases);
add("auditLogs", packet.preservationReceipts);
for (const s of packet.scheduledExpiries)
  scheduled.set(s.scheduled._id, structuredClone(s.scheduled));
const read = (rows) => {
  stats.calls++;
  stats.rows += rows.length;
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
    const conditions = [];
    const q = {
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
      async unique() {
        const rows = await chain.take(2);
        assert(rows.length < 2, "Duplicate row");
        return rows[0] ?? null;
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
  async insert(table, value) {
    const row = Object.fromEntries(
      Object.entries(value).filter(([, v]) => v !== undefined),
    );
    const id = `local-${table}-${tables[table].length}`;
    tables[table].push({ ...row, _id: id, _creationTime: Date.now() });
    stats.writes++;
    return id;
  },
  async patch(id, value) {
    const row = await db.get(id);
    assert(row);
    for (const [k, v] of Object.entries(value)) {
      if (v === undefined) delete row[k];
      else row[k] = v;
    }
    stats.writes++;
  },
};
const ctx = {
  db,
  scheduler: {
    async runAt(time, _ref, args) {
      const id = "local-seven-expiry";
      scheduled.set(id, {
        _id: id,
        _creationTime: Date.now(),
        args: [args],
        name: "aiSevenStoriesPublication20260910.js:expire",
        scheduledTime: time,
        state: { kind: "pending" },
      });
      stats.writes++;
      return id;
    },
  },
};
let clock = packet.capturedAt + 1000;
const originalNow = Date.now,
  originalEnabled = process.env.AI_PUBLICATION_ENABLED;
Date.now = () => clock;
process.env.AI_PUBLICATION_ENABLED = "true";
const phases = [];
async function invoke(name, args = {}) {
  const before = structuredClone(tables),
    schedulesBefore = structuredClone(scheduled),
    t = performance.now();
  for (const k of Object.keys(stats)) stats[k] = 0;
  try {
    const result = await h[name]._handler(ctx, { ...identity, ...args });
    phases.push({
      name,
      phase: result.phase ?? name,
      milliseconds: Math.round(performance.now() - t),
      ...stats,
    });
    return result;
  } catch (e) {
    for (const k of Object.keys(tables)) tables[k] = before[k];
    scheduled.clear();
    for (const [k, v] of schedulesBefore) scheduled.set(k, v);
    throw new Error(`Local ${name} failed: ${e.message}`);
  }
}
const protectedTables = [
  "evidenceSources",
  "evidenceLinks",
  "contentReviews",
  "libraryMedia",
  "clinicalReviewAssignments",
  "clinicalReviewBatches",
  "clinicalReviewBatchReceipts",
  "aiPublicationConfig",
];
const protectedBefore = Object.fromEntries(
  protectedTables.map((t) => [t, structuredClone(tables[t])]),
);
const allOriginalRows = structuredClone(tables);
const oldContent = structuredClone(
    packet.preservedTargets.map((t) => t.content),
  ),
  oldActive = structuredClone(packet.activeReleases),
  oldSchedules = structuredClone(scheduled);
try {
  assert.equal(
    (await invoke("preflight", { checkedAt: clock })).phase,
    "ready",
  );
  const initiallyReadable = await h.activeAiParentReadableContent(ctx, clock);
  assert(initiallyReadable.complete);
  assert.equal(initiallyReadable.rows.length, 3);
  assert.equal(
    (
      await invoke("stage", {
        operator: "Local replay only",
        gitCommit: "a".repeat(40),
      })
    ).phase,
    "staged",
  );
  assert.equal(
    (
      await invoke("stage", {
        operator: "Local replay only",
        gitCommit: "a".repeat(40),
      })
    ).phase,
    "staged",
  );
  assert.equal(stats.writes, 0);
  const stagedReadable = await h.activeAiParentReadableContent(ctx, clock);
  assert(stagedReadable.complete);
  assert.equal(stagedReadable.rows.length, 3);
  assert.equal(
    (
      await invoke("activate", {
        operator: "Local replay only",
        expectedGeneration: 3,
      })
    ).phase,
    "enabled",
  );
  const enabledReadable = await h.activeAiParentReadableContent(ctx, clock);
  assert(enabledReadable.complete);
  assert.equal(enabledReadable.rows.length, 10);
  assert.equal(
    (
      await invoke("activate", {
        operator: "Local replay only",
        expectedGeneration: 3,
      })
    ).phase,
    "enabled",
  );
  assert.equal(stats.writes, 0);
  const delta = clock + 8 * 86400000;
  assert.equal(
    (await invoke("preflight", { checkedAt: delta })).phase,
    "enabled",
  );
  clock = delta;
  assert.equal(
    (
      await invoke("activate", {
        operator: "Local replay only",
        expectedGeneration: 3,
      })
    ).phase,
    "enabled",
  );
  assert.equal(stats.writes, 0);
  await assert.rejects(() => invoke("expire"), /early/);
  clock = h.SEVEN_STORIES_VISIBILITY_CUTOFF;
  assert.deepEqual(await invoke("expire"), { revoked: 7, pointersCleared: 7 });
  // Old previews may naturally reach their independent expiry before this new
  // release; preservation is byte-for-byte, not a promise of future visibility.
  for (const target of packet.targets) {
    const row = tables.libraryContent.find((r) => r._id === target.content._id);
    assert.deepEqual(row, target.content);
    assert.equal(await h.contentIsAiParentReadable(ctx, row, clock), false);
  }
  for (const [table, rows] of Object.entries(protectedBefore))
    assert.deepEqual(tables[table], rows);
  for (const row of oldContent)
    assert.deepEqual(
      tables.libraryContent.find((r) => r._id === row._id),
      row,
    );
  for (const row of oldActive)
    assert.deepEqual(
      tables.aiPublicationReleases.find((r) => r._id === row._id),
      row,
    );
  for (const [id, row] of oldSchedules)
    assert.deepEqual(scheduled.get(id), row);
  for (const [table, rows] of Object.entries(allOriginalRows))
    for (const row of rows)
      assert.deepEqual(
        tables[table].find((r) => r._id === row._id),
        row,
        `Original row drift in ${table}`,
      );
  assert.deepEqual(await invoke("expire"), { revoked: 0, pointersCleared: 0 });
  assert.equal(stats.writes, 0);
  const result = {
    schemaVersion: 1,
    mode: "local_in_memory_real_packet_no_production_writes",
    inputPath,
    inputSha256: sha(raw),
    artifactHash: h.SEVEN_STORIES_ARTIFACT_HASH,
    bundleSha256: sha(bundle.outputFiles[0].text),
    phases,
    preservation:
      "All exact original three content/releases/sources/reviews/audits/schedules and seven copy/source/link/review/media preserved; seven temporary pointers cleared on expiry",
    limitations: [
      "Local in-memory replay is not a Convex production transaction benchmark or deployment verification.",
      "Input private rows were not emitted; no hash mappings, audit mocks or visibility stubs were used.",
    ],
  };
  mkdirSync("artifacts/seven-stories-publication-20260910", {
    recursive: true,
    mode: 0o700,
  });
  const output =
    "artifacts/seven-stories-publication-20260910/local-real-packet-lifecycle.json";
  writeFileSync(output, JSON.stringify(result, null, 2) + "\n", {
    mode: 0o600,
  });
  process.stdout.write(
    JSON.stringify(
      { ok: true, output, sha256: sha(readFileSync(output)), phases },
      null,
      2,
    ) + "\n",
  );
} finally {
  Date.now = originalNow;
  if (originalEnabled === undefined) delete process.env.AI_PUBLICATION_ENABLED;
  else process.env.AI_PUBLICATION_ENABLED = originalEnabled;
}
