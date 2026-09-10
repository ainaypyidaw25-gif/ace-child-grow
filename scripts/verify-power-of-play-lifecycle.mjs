// Private real-hash lifecycle gate over a frozen read-only packet. In-memory
// mock transaction only; this script has no network or deployment calls.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';

const snapshot = 'artifacts/power-of-play-preview-20260910/snapshot-1789037429767.json';
const raw = readFileSync(snapshot);
assert.equal(createHash('sha256').update(raw).digest('hex'), 'b93616f1f1b7f55b72da6367c615e822ba97d9978a4989c41dc11816a5873dd4');
const packet = JSON.parse(raw);
process.env.AI_PUBLICATION_ENABLED = 'true';
const built = await build({ stdin: { contents: `export * from './convex/aiPowerOfPlayPublication20260910'; export * from './convex/lib/aiPowerOfPlayPublication20260910Data'; export * from './convex/lib/aiPowerOfPlayPublication20260910Artifact'; export * from './convex/lib/aiPublicationVisibility'; export * from './convex/lib/aiAuditHash';`, resolveDir: process.cwd() }, bundle: true, platform: 'node', format: 'esm', write: false });
const m = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString('base64')}`);
const tables = {};
function add(table, rows) {
  tables[table] ??= [];
  for (const row of rows) {
    const existing = tables[table].find(r => r._id === row._id);
    if (existing) assert.equal(m.canonicalJson(existing), m.canonicalJson(row));
    else tables[table].push(structuredClone(row));
  }
}
for (const d of packet.preservation) add(d.table, d.rows);
const t = packet.target;
for (const [table, rows] of Object.entries({ libraryContent:[t.content], evidenceLinks:[t.link], evidenceSources:t.sources, contentReviews:t.reviews, libraryMedia:t.media, clinicalReviewAssignments:t.assignments, aiContentAudits:t.contentAudits })) add(table, rows);
for (const collision of packet.collisions) add(collision.table, collision.rows);
const oldTables = structuredClone(tables);
let schedules = new Map(packet.oldSchedules.map(row => [row._id, structuredClone(row)]));
let now = Math.max(packet.capturedAt, m.POWER_OF_PLAY_ARTIFACT.auditCompletedAt) + 1000;
const originalNow = Date.now;
Date.now = () => now;
let inserted = 0, reads = 0;
const db = {
  system: { async get(id) { reads++; return structuredClone(schedules.get(id) ?? null); } },
  query(table) {
    const conditions = [];
    const builder = { eq(key,value) { conditions.push([key,value]); return builder; } };
    const q = {
      withIndex(_index, callback) { callback(builder); return q; },
      async take(n) { reads++; return structuredClone((tables[table] ?? []).filter(row => conditions.every(([key,value]) => row[key] === value)).slice(0,n)); },
      async unique() { const rows = await q.take(2); assert(rows.length < 2); return rows[0] ?? null; },
      async first() { return (await q.take(1))[0] ?? null; },
    }; return q;
  },
  async get(id) { reads++; return structuredClone(Object.values(tables).flat().find(row => row._id === id) ?? null); },
  async insert(table, fields) { const row = { ...structuredClone(fields), _id:`private-${++inserted}`, _creationTime:now }; tables[table] ??= []; tables[table].push(row); return row._id; },
  async patch(id, fields) { const row = Object.values(tables).flat().find(row => row._id === id); assert(row); for (const [key,value] of Object.entries(fields)) value === undefined ? delete row[key] : row[key] = structuredClone(value); },
};
const ctx = { db, scheduler:{ async runAt(time,_reference,args) { const id = `private-schedule-${++inserted}`; schedules.set(id,{_id:id,_creationTime:now,name:'aiPowerOfPlayPublication20260910.js:expire',scheduledTime:time,state:{kind:'pending'},args:[structuredClone(args)]}); return id; } } };
const identity = { releaseRoot:m.POWER_OF_PLAY_RELEASE_ROOT, artifactHash:m.POWER_OF_PLAY_ARTIFACT_HASH, snapshotSha256:m.POWER_OF_PLAY_PREIMAGE.snapshotSha256 };
async function run(fn,args={}) {
  const previous = structuredClone(tables), oldSchedules = structuredClone([...schedules]);
  try { return await fn._handler(ctx,{...identity,...args}); }
  catch(error) { for(const key of Object.keys(tables)) delete tables[key]; Object.assign(tables,previous); schedules = new Map(oldSchedules); throw error; }
}
const result = { snapshot, identity, realHashes:true, visibilityMocked:false, networkWrites:0, states:[] };
const started = performance.now();
try {
  result.rejectedRemovedSourceAuditCollisions = [];
  for (const sourceId of ['jr-jamaica-1991', 'who-care-for-child-development-2012']) {
    const id = `private-unvalidated-${sourceId}`;
    tables.aiEvidenceAudits.push({ ...structuredClone(tables.aiEvidenceAudits[0]), _id:id, sourceId,
      runId:m.powerOfPlaySourceRunId(sourceId) });
    const blocked = await run(m.preflight,{checkedAt:now});
    assert.equal(blocked.phase,'drift',JSON.stringify(blocked));
    await assert.rejects(run(m.stage,{operator:'Private adversarial gate',gitCommit:'a'.repeat(40)}),/preservation/);
    tables.aiEvidenceAudits = tables.aiEvidenceAudits.filter(row=>row._id!==id);
    result.rejectedRemovedSourceAuditCollisions.push(sourceId);
  }
  let state = await run(m.preflight,{checkedAt:now});
  assert.equal(state.phase,'ready',JSON.stringify(state)); assert.equal(state.activeReleaseCount,11); result.states.push(state);
  state = await run(m.stage,{operator:'Private lifecycle validation; not production',gitCommit:'5573b4b25170069fe27f423738943e14f8ccda30'});
  assert.equal(state.phase,'staged',JSON.stringify(state)); assert.equal(state.parentReadable,false); assert.equal(state.activeReleaseCount,11); result.states.push(state);
  const stagedTables = m.canonicalJson(tables);
  await run(m.stage,{operator:'Replay',gitCommit:'a'.repeat(40)}); assert.equal(m.canonicalJson(tables),stagedTables);
  state = await run(m.activate,{operator:'Private lifecycle validation; not production',expectedGeneration:3});
  assert.equal(state.phase,'enabled',JSON.stringify(state)); assert.equal(state.activeReleaseCount,12); assert.equal(state.parentReadable,true); result.states.push(state);
  const enabledTables = m.canonicalJson(tables);
  await run(m.activate,{operator:'Replay',expectedGeneration:3}); assert.equal(m.canonicalJson(tables),enabledTables);
  now += 8*86400000;
  state = await run(m.postflight,{checkedAt:now}); assert.equal(state.phase,'enabled',JSON.stringify(state)); result.states.push(state);
  await assert.rejects(run(m.expire),/early/);
  now = m.POWER_OF_PLAY_VISIBILITY_CUTOFF;
  result.expired = await run(m.expire); assert.deepEqual(result.expired,{revoked:true,pointersCleared:true});
  assert.equal(await m.contentIsAiParentReadable(ctx,await db.get(t.content._id),now),false);
  for(const [table, rows] of Object.entries(oldTables)) for(const row of rows) {
    if (table==='libraryContent' && row._id===t.content._id) continue;
    if (table==='evidenceLinks' && row._id===t.link._id) continue;
    assert.equal(m.canonicalJson(tables[table].find(current=>current._id===row._id)),m.canonicalJson(row),`Preserved ${table}:${row._id}`);
  }
  for(const row of packet.oldSchedules) assert.equal(m.canonicalJson(schedules.get(row._id)),m.canonicalJson(row));
  result.oldRowsPreserved=true; result.oldSchedulesPreserved=true; result.reads=reads; result.elapsedMs=Math.round(performance.now()-started); result.passed=true;
  writeFileSync('artifacts/power-of-play-preview-20260910/private-lifecycle-verification.json',JSON.stringify(result,null,2)+'\n',{mode:0o600});
  process.stdout.write(JSON.stringify(result,null,2) + '\n');
} finally { Date.now=originalNow; }
