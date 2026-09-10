// Private real-hash lifecycle gate over a frozen read-only packet. In-memory
// mock transaction only; this script has no network or deployment calls.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { build } from "esbuild";

const snapshot =
  "artifacts/two-lessons-preview-20260910/snapshot-1789040210419.json";
const raw = readFileSync(snapshot);
assert.equal(
  createHash("sha256").update(raw).digest("hex"),
  "552a215c2b94b6417ecf5deaff99ea66ae4ecbed4ca4b135e8945d2ce51319ce",
);
const packet = JSON.parse(raw);
process.env.AI_PUBLICATION_ENABLED = "true";
const built = await build({
  stdin: {
    contents: `export * from './convex/aiTwoLessonsPublication20260910'; export * from './convex/lib/aiTwoLessonsPublication20260910Data'; export * from './convex/lib/aiTwoLessonsPublication20260910Artifact'; export * from './convex/lib/aiPublicationVisibility'; export * from './convex/lib/aiAuditHash';`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
});
const m = await import(
  `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`
);
const tables = {};
function add(table, rows) {
  tables[table] ??= [];
  for (const row of rows) {
    const existing = tables[table].find((r) => r._id === row._id);
    if (existing) assert.equal(m.canonicalJson(existing), m.canonicalJson(row));
    else tables[table].push(structuredClone(row));
  }
}
for (const d of packet.preservation) add(d.table, d.rows);
for (const t of packet.targets)
  for (const [table, rows] of Object.entries({
    libraryContent: [t.content],
    evidenceLinks: [t.link],
    evidenceSources: t.sources,
    contentReviews: t.reviews,
    libraryMedia: t.media,
    clinicalReviewAssignments: t.assignments,
    aiContentAudits: t.contentAudits,
  }))
    add(table, rows);
for (const collision of packet.collisions) add(collision.table, collision.rows);
const oldTables = structuredClone(tables);
let schedules = new Map(
  packet.oldSchedules.map((row) => [row._id, structuredClone(row)]),
);
let now =
  Math.max(packet.capturedAt, m.TWO_LESSONS_ARTIFACT.auditCompletedAt) + 1000;
const originalNow = Date.now;
Date.now = () => now;
let inserted = 0,
  reads = 0;
const db = {
  system: {
    async get(id) {
      reads++;
      return structuredClone(schedules.get(id) ?? null);
    },
  },
  query(table) {
    const conditions = [];
    const builder = {
      eq(key, value) {
        conditions.push([key, value]);
        return builder;
      },
    };
    const q = {
      withIndex(_index, callback) {
        callback(builder);
        return q;
      },
      async take(n) {
        reads++;
        return structuredClone(
          (tables[table] ?? [])
            .filter((row) =>
              conditions.every(([key, value]) => row[key] === value),
            )
            .slice(0, n),
        );
      },
      async unique() {
        const rows = await q.take(2);
        assert(rows.length < 2);
        return rows[0] ?? null;
      },
      async first() {
        return (await q.take(1))[0] ?? null;
      },
    };
    return q;
  },
  async get(id) {
    reads++;
    return structuredClone(
      Object.values(tables)
        .flat()
        .find((row) => row._id === id) ?? null,
    );
  },
  async insert(table, fields) {
    const row = {
      ...structuredClone(fields),
      _id: `private-${++inserted}`,
      _creationTime: now,
    };
    tables[table] ??= [];
    tables[table].push(row);
    return row._id;
  },
  async patch(id, fields) {
    const row = Object.values(tables)
      .flat()
      .find((row) => row._id === id);
    assert(row);
    for (const [key, value] of Object.entries(fields))
      value === undefined
        ? delete row[key]
        : (row[key] = structuredClone(value));
  },
};
const ctx = {
  db,
  scheduler: {
    async runAt(time, _reference, args) {
      const id = `private-schedule-${++inserted}`;
      schedules.set(id, {
        _id: id,
        _creationTime: now,
        name: "aiTwoLessonsPublication20260910.js:expire",
        scheduledTime: time,
        state: { kind: "pending" },
        args: [structuredClone(args)],
      });
      return id;
    },
  },
};
const identity = {
  releaseRoot: m.TWO_LESSONS_RELEASE_ROOT,
  artifactHash: m.TWO_LESSONS_ARTIFACT_HASH,
  snapshotSha256: m.TWO_LESSONS_PREIMAGE.snapshotSha256,
};
async function run(fn, args = {}) {
  const previous = structuredClone(tables),
    oldSchedules = structuredClone([...schedules]);
  try {
    return await fn._handler(ctx, { ...identity, ...args });
  } catch (error) {
    for (const key of Object.keys(tables)) delete tables[key];
    Object.assign(tables, previous);
    schedules = new Map(oldSchedules);
    throw error;
  }
}
const result = {
  snapshot,
  identity,
  realHashes: true,
  visibilityMocked: false,
  networkWrites: 0,
  states: [],
};
const started = performance.now();
try {
  result.rejectedRemovedSourceAuditCollisions = [];
  for (const sourceId of ["nice-ph40-social-emotional-2012"]) {
    const id = `private-unvalidated-${sourceId}`;
    tables.aiEvidenceAudits.push({
      ...structuredClone(tables.aiEvidenceAudits[0]),
      _id: id,
      sourceId,
      runId: m.twoLessonsSourceRunId("lsn_big_feelings", sourceId),
    });
    const blocked = await run(m.preflight, { checkedAt: now });
    assert.equal(blocked.phase, "drift", JSON.stringify(blocked));
    await assert.rejects(
      run(m.stage, {
        operator: "Private adversarial gate",
        gitCommit: "a".repeat(40),
      }),
      /preservation/,
    );
    tables.aiEvidenceAudits = tables.aiEvidenceAudits.filter(
      (row) => row._id !== id,
    );
    result.rejectedRemovedSourceAuditCollisions.push(sourceId);
  }
  let state = await run(m.preflight, { checkedAt: now });
  assert.equal(state.phase, "ready", JSON.stringify(state));
  assert.equal(state.activeReleaseCount, 12);
  result.states.push(state);
  state = await run(m.stage, {
    operator: "Private lifecycle validation; not production",
    gitCommit: "b7a991e82e306fe6fe0b974970412caffa52bc85",
  });
  assert.equal(state.phase, "staged", JSON.stringify(state));
  assert.equal(state.parentReadable, false);
  assert.equal(state.activeReleaseCount, 12);
  result.states.push(state);
  const stagedTables = m.canonicalJson(tables);
  await run(m.stage, { operator: "Replay", gitCommit: "a".repeat(40) });
  assert.equal(m.canonicalJson(tables), stagedTables);
  state = await run(m.activate, {
    operator: "Private lifecycle validation; not production",
    expectedGeneration: 3,
  });
  assert.equal(state.phase, "enabled", JSON.stringify(state));
  assert.equal(state.activeReleaseCount, 14);
  assert.equal(state.parentReadable, true);
  result.states.push(state);
  const enabledTables = m.canonicalJson(tables);
  await run(m.activate, { operator: "Replay", expectedGeneration: 3 });
  assert.equal(m.canonicalJson(tables), enabledTables);
  now += 8 * 86400000;
  state = await run(m.postflight, { checkedAt: now });
  assert.equal(state.phase, "enabled", JSON.stringify(state));
  result.states.push(state);
  await assert.rejects(run(m.expire), /early/);
  now = m.TWO_LESSONS_VISIBILITY_CUTOFF;
  result.expired = await run(m.expire);
  assert.deepEqual(result.expired, { revoked: 2, pointersCleared: 2 });
  for (const t of packet.targets)
    assert.equal(
      await m.contentIsAiParentReadable(ctx, await db.get(t.content._id), now),
      false,
    );
  for (const [table, rows] of Object.entries(oldTables))
    for (const row of rows) {
      if (
        table === "libraryContent" &&
        packet.targets.some((t) => row._id === t.content._id)
      )
        continue;
      if (
        table === "evidenceLinks" &&
        packet.targets.some((t) => row._id === t.link._id)
      )
        continue;
      assert.equal(
        m.canonicalJson(
          tables[table].find((current) => current._id === row._id),
        ),
        m.canonicalJson(row),
        `Preserved ${table}:${row._id}`,
      );
    }
  for (const row of packet.oldSchedules)
    assert.equal(m.canonicalJson(schedules.get(row._id)), m.canonicalJson(row));
  result.oldRowsPreserved = true;
  result.oldSchedulesPreserved = true;
  result.reads = reads;
  result.elapsedMs = Math.round(performance.now() - started);
  result.passed = true;
  writeFileSync(
    "artifacts/two-lessons-preview-20260910/private-lifecycle-verification.json",
    JSON.stringify(result, null, 2) + "\n",
    { mode: 0o600 },
  );
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
} finally {
  Date.now = originalNow;
}
