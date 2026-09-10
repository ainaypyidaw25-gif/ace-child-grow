// Read-only, exact phase-aware production capture. Never stages, activates,
// deploys, withdraws, approves, or rewrites review history.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { build } from 'esbuild';

const phase = process.argv.find(x => x.startsWith('--phase='))?.slice(8);
assert(['ready', 'staged', 'enabled'].includes(phase), 'Use --phase=ready|staged|enabled');
assert(process.argv.slice(2).every(x => x === `--phase=${phase}` || x === '--query-only'), 'Unknown argument');
const sha = x => createHash('sha256').update(x).digest('hex');
const compiled = await build({ stdin: { contents: `export * from './convex/lib/aiSevenStoriesPublication20260910Data';export * from './convex/lib/aiSevenStoriesPublication20260910Artifact';export * from './convex/lib/aiAuditHash';`, resolveDir: process.cwd() }, bundle: true, platform: 'node', format: 'esm', write: false });
const h = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const hash = x => sha(h.canonicalJson(x));
assert.equal(hash(h.SEVEN_STORIES_ARTIFACT), h.SEVEN_STORIES_ARTIFACT_HASH);
const baselinePath = 'artifacts/seven-story-preflight-20260910/snapshot-1789023135798.json';
const raw = readFileSync(baselinePath);
assert.equal(sha(raw), h.SEVEN_STORIES_PREIMAGE.snapshotSha256);
const baseline = JSON.parse(raw);
const slugs = ['st_little_seed', 'st_ba_ba_sounds', 'st_when_i_feel_angry', 'st_taking_turns', 'st_goodnight_moon_friend', 'st_visit_to_doctor', 'st_sharing_mango'];
assert.deepEqual(h.SEVEN_STORIES_SLUGS, slugs);
assert.deepEqual(h.SEVEN_STORIES_ARTIFACT.targets.map(t => t.slug), slugs);
assert.equal(baseline.activeReleases.length, 3);
const identity = { releaseRoot: h.SEVEN_STORIES_RELEASE_ROOT, artifactHash: h.SEVEN_STORIES_ARTIFACT_HASH, snapshotSha256: h.SEVEN_STORIES_PREIMAGE.snapshotSha256 };
const manifest = {
  identity, phase, capturedAt: Date.now(),
  visibilityCutoff: Date.parse(new Date(h.SEVEN_STORIES_ARTIFACT.auditCompletedAt + (h.SEVEN_STORIES_RELEASE_DAYS - 1) * 86400000).toISOString().slice(0, 10) + 'T23:59:59.999Z') + 1,
  targets: h.SEVEN_STORIES_PREIMAGE.targets.map(t => ({ slug: t.slug, contentId: t.contentId, linkId: t.linkId,
    sourceIds: t.sourceIds, reviewsCount: t.reviewsCount, mediaCount: t.mediaCount,
    releaseId: h.sevenStoriesReleaseId(t.slug), contentRunId: h.sevenStoriesRunId(t.slug),
    sources: t.sourceIds.map(sourceId => ({ sourceId, runId: h.sevenStoriesSourceRunId(t.slug, sourceId) })) })),
  oldActiveReleaseIds: baseline.activeReleases.map(r => r.releaseId),
  preservation: h.SEVEN_STORIES_PRESERVATION,
  oldSchedules: h.SEVEN_STORIES_OLD_SCHEDULES,
};
assert.equal(manifest.targets.flatMap(t => t.sources).length, 18);

const query = `export default query({args:{},handler:async(ctx)=>{
const m=${JSON.stringify(manifest)};
const fail=message=>{throw new Error('Seven-story publication capture: '+message);};
const check=(yes,message)=>{if(!yes)fail(message);};
const unique=(rows,key,label)=>check(new Set(rows.map(r=>r[key])).size===rows.length,'duplicate '+label);
const staged=m.phase!=='ready',enabled=m.phase==='enabled';
const active=await ctx.db.query('aiPublicationReleases').withIndex('by_status',q=>q.eq('status','active')).take(11);
check(active.length===(enabled?10:3),'active release count');unique(active,'releaseId','active release IDs');unique(active,'targetKey','active target keys');
const activeIds=[...m.oldActiveReleaseIds,...(enabled?m.targets.map(t=>t.releaseId):[])];
check(active.every(r=>activeIds.includes(r.releaseId)&&r.targetKey===r.contentType+'\\u0000'+r.contentSlug),'unexpected active identity');

async function descriptorRows(d){
 const {table,index,key,count}=d;
 switch(table){
 case 'libraryContent':return ctx.db.query('libraryContent').withIndex('by_slug',q=>q.eq('slug',key)).take(count+1);
 case 'evidenceLinks':return ctx.db.query('evidenceLinks').withIndex('by_slug',q=>q.eq('slug',key)).take(count+1);
 case 'evidenceSources':return ctx.db.query('evidenceSources').withIndex('by_source_id',q=>q.eq('sourceId',key)).take(count+1);
 case 'contentReviews':return ctx.db.query('contentReviews').withIndex('by_content',q=>q.eq('contentSlug',key)).take(count+1);
 case 'libraryMedia':return ctx.db.query('libraryMedia').withIndex('by_content',q=>q.eq('contentSlug',key)).take(count+1);
 case 'clinicalReviewAssignments':return ctx.db.query('clinicalReviewAssignments').withIndex('by_exact_target',q=>q.eq('contentSlug',key)).take(count+1);
 case 'clinicalReviewBatches':return ctx.db.query('clinicalReviewBatches').withIndex('by_batch_id',q=>q.eq('batchId',key)).take(count+1);
 case 'clinicalReviewBatchReceipts':return ctx.db.query('clinicalReviewBatchReceipts').withIndex('by_batch_id',q=>q.eq('batchId',key)).take(count+1);
 case 'aiPublicationConfig':return ctx.db.query('aiPublicationConfig').withIndex('by_key',q=>q.eq('key','global')).take(count+1);
 case 'aiPublicationReleases':return index==='by_status'?active.filter(r=>m.oldActiveReleaseIds.includes(r.releaseId)):ctx.db.query('aiPublicationReleases').withIndex('by_target_key',q=>q.eq('targetKey',key)).take(count+1);
 case 'aiAuditRuns':return index==='by_release_id'?ctx.db.query('aiAuditRuns').withIndex('by_release_id',q=>q.eq('releaseId',key)).take(count+1):ctx.db.query('aiAuditRuns').withIndex('by_run_id',q=>q.eq('runId',key)).take(count+1);
 case 'aiContentAudits':return index==='by_run_id'?ctx.db.query('aiContentAudits').withIndex('by_run_id',q=>q.eq('runId',key)).take(count+1):ctx.db.query('aiContentAudits').withIndex('by_content_revision_and_updated_at',q=>q.eq('contentSlug',key)).take(count+1);
 case 'aiEvidenceAudits':return ctx.db.query('aiEvidenceAudits').withIndex('by_run_id',q=>q.eq('runId',key)).take(count+1);
 case 'auditLogs':return ctx.db.query('auditLogs').withIndex('by_action',q=>q.eq('action',key)).take(count+1);
 default:fail('unknown preservation table');
 }
}
const preservation=[];
for(const descriptor of m.preservation){const rows=await descriptorRows(descriptor);check(rows.length===descriptor.count,'preservation count '+descriptor.table);unique(rows,'_id','preservation rows');preservation.push({descriptor,rows});}
const oldSchedules=[];
for(const descriptor of m.oldSchedules){const row=await ctx.db.system.get(descriptor.id);check(Boolean(row),'missing old schedule');oldSchedules.push({descriptor,row});}
const receipts={};
for(const phase of ['staged','enabled','withdrawn','expired']){const rows=await ctx.db.query('auditLogs').withIndex('by_action',q=>q.eq('action','library.ai_seven_stories.'+phase)).take(2);check(rows.length===((phase==='staged'&&staged)||(phase==='enabled'&&enabled)?1:0),'phase receipt count '+phase);if(rows.length){const value=JSON.parse(rows[0].after??'null');check(value&&JSON.stringify(value.identity)===JSON.stringify(m.identity),'phase receipt identity');}receipts[phase]=rows;}
const newSchedules=[];
if(enabled){const id=JSON.parse(receipts.enabled[0].after).expiryScheduledFunctionId;check(typeof id==='string','new schedule ID');const row=await ctx.db.system.get(id);check(row&&row.name==='aiSevenStoriesPublication20260910.js:expire'&&row.state.kind==='pending'&&row.scheduledTime===m.visibilityCutoff&&JSON.stringify(row.args)===JSON.stringify([m.identity]),'new expiry state');newSchedules.push(row);}
const targets=[];
for(const pin of m.targets){
 const slug=pin.slug,runIds=[pin.contentRunId,...pin.sources.map(s=>s.runId)];unique(pin.sources,'sourceId','source IDs');unique(pin.sources,'runId','source runs');
 const [contents,links,reviews,media,assignments,releases,releaseById,releaseRuns,contentAudits]=await Promise.all([
 ctx.db.query('libraryContent').withIndex('by_slug',q=>q.eq('slug',slug)).take(2),ctx.db.query('evidenceLinks').withIndex('by_slug',q=>q.eq('slug',slug)).take(2),
 ctx.db.query('contentReviews').withIndex('by_content',q=>q.eq('contentSlug',slug)).take(pin.reviewsCount+1),ctx.db.query('libraryMedia').withIndex('by_content',q=>q.eq('contentSlug',slug)).take(pin.mediaCount+1),
 ctx.db.query('clinicalReviewAssignments').withIndex('by_exact_target',q=>q.eq('contentSlug',slug)).take(1),ctx.db.query('aiPublicationReleases').withIndex('by_target_key',q=>q.eq('targetKey','story\\u0000'+slug)).take(2),
 ctx.db.query('aiPublicationReleases').withIndex('by_release_id',q=>q.eq('releaseId',pin.releaseId)).take(2),ctx.db.query('aiAuditRuns').withIndex('by_release_id',q=>q.eq('releaseId',pin.releaseId)).take(runIds.length+1),
 ctx.db.query('aiContentAudits').withIndex('by_content_revision_and_updated_at',q=>q.eq('contentSlug',slug)).take(2)]);
 check(contents.length===1&&contents[0]._id===pin.contentId&&contents[0].type==='story'&&contents[0].reviewRevision===3&&contents[0].clinicalStatus==='clinical_review','content identity '+slug);
 const content=contents[0];check(enabled?content.aiPublicationReleaseId===pin.releaseId&&typeof content.aiPublishedAt==='number':content.aiPublicationReleaseId===undefined&&content.aiPublishedAt===undefined,'content pointer '+slug);
 check(links.length===1&&links[0]._id===pin.linkId&&links[0].kind==='story'&&JSON.stringify(links[0].sourceIds)===JSON.stringify(pin.sourceIds),'link identity '+slug);
 check(reviews.length===pin.reviewsCount&&media.length===pin.mediaCount&&assignments.length===0,'review/media/assignment bounds '+slug);unique(reviews,'_id','reviews');unique(media,'_id','media');
 check(releases.length===(enabled?1:0)&&releaseById.length===releases.length&&(enabled?releaseById[0]._id===releases[0]._id:true),'release identity '+slug);
 check(releaseRuns.length===(staged?runIds.length:0),'release-run coverage '+slug);unique(releaseRuns,'runId','release runs');check(releaseRuns.every(r=>runIds.includes(r.runId)),'unexpected release run');
 check(contentAudits.length===(staged?1:0),'target content-audit count '+slug);
 const sources=[];for(const sourceId of pin.sourceIds){const rows=await ctx.db.query('evidenceSources').withIndex('by_source_id',q=>q.eq('sourceId',sourceId)).take(2);check(rows.length===1,'source identity');sources.push(rows[0]);}
 const runs=[],allContentAudits=[],evidenceAudits=[];
 for(const runId of runIds){const [r,c,e]=await Promise.all([ctx.db.query('aiAuditRuns').withIndex('by_run_id',q=>q.eq('runId',runId)).take(2),ctx.db.query('aiContentAudits').withIndex('by_run_id',q=>q.eq('runId',runId)).take(2),ctx.db.query('aiEvidenceAudits').withIndex('by_run_id',q=>q.eq('runId',runId)).take(2)]);
 check(r.length===(staged?1:0)&&c.length===(staged&&runId===pin.contentRunId?1:0)&&e.length===(staged&&runId!==pin.contentRunId?1:0),'run/audit exact coverage '+runId);
 if(r.length)check(r[0].releaseId===pin.releaseId&&releaseRuns.some(row=>row._id===r[0]._id),'cross-target run');
 if(c.length)check(c[0]._id===contentAudits[0]._id&&c[0].contentSlug===slug,'cross-target content audit');
 if(e.length)check(e[0].sourceId===pin.sources.find(s=>s.runId===runId).sourceId,'cross-source audit');runs.push(...r);allContentAudits.push(...c);evidenceAudits.push(...e);}
 targets.push({content,link:links[0],sources,reviews,media,assignments,releases,runs,contentAudits:allContentAudits,evidenceAudits});
}
return{schemaVersion:1,deployment:'graceful-possum-566',capturedAt:m.capturedAt,phase:m.phase,identity:m.identity,activeReleases:active,targets,preservation,oldSchedules,newSchedules,receipts};
}});`;
if (process.argv.includes('--query-only')) {
  process.stdout.write(query);
} else {
  const output = execFileSync('npx', ['--no-install', 'convex', 'run', '--prod', '--inline-query', query], {
    encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, env: { ...process.env, CONVEX_DEPLOYMENT: 'prod:graceful-possum-566' },
  });
  const packet = JSON.parse(output);
  // No artifact is written on partial coverage, preservation drift or wrong phase.
  assert.equal(packet.phase, phase);
  assert.deepEqual(packet.identity, identity);
  const sort = rows => [...rows].sort((a, b) => String(a._id).localeCompare(String(b._id)));
  for (const target of packet.targets) {
    const pin = h.SEVEN_STORIES_PREIMAGE.targets.find(t => t.slug === target.content.slug);
    assert(pin);
    const contentWithoutPointers = Object.fromEntries(Object.entries(target.content).filter(([key]) => !['aiPublicationReleaseId', 'aiPublishedAt'].includes(key)));
    assert.equal(hash(contentWithoutPointers), pin.preservedContentHash, 'Corrected content drift');
    assert.equal(hash(target.link), pin.linkFullHash, 'Evidence-link drift');
    assert.equal(hash(sort(target.sources)), pin.sourcesFullHash, 'Source metadata/review drift');
    assert.equal(hash(sort(target.reviews)), pin.reviewsFullHash, 'Human review history drift');
    assert.equal(hash(sort(target.media)), pin.mediaFullHash, 'Media drift');
  }
  for (const entry of packet.preservation) assert.equal(hash(sort(entry.rows)), entry.descriptor.hash, 'Old-three preservation hash mismatch');
  for (const entry of packet.oldSchedules) assert.equal(hash(entry.row), entry.descriptor.hash, 'Old expiry hash mismatch');
  // Independently reconstruct every newly authorized row with real hashes.
  // The production query proves indexed uniqueness; this proves full payloads.
  const stripDb = row => Object.fromEntries(Object.entries(row).filter(([key]) => !['_id', '_creationTime'].includes(key)));
  function verifiedReceipt(phaseName) {
    const rows = packet.receipts[phaseName];
    assert.equal(rows.length, 1);
    const row = rows[0], value = JSON.parse(row.after);
    assert.equal(row.actorId, undefined);
    assert.equal(row.entityTable, 'aiPublicationReleases');
    assert.equal(row.entityId, identity.releaseRoot);
    assert.equal(row.result, 'ok');
    assert.equal(row.summary, phaseName);
    assert.equal(row.before, JSON.stringify(identity));
    assert.deepEqual(value.identity, identity);
    assert(typeof value.operator === 'string' && value.operator.trim().length > 0 && value.operator.length <= 160);
    return value;
  }
  if (phase !== 'ready') {
    const artifact = h.SEVEN_STORIES_ARTIFACT, staged = verifiedReceipt('staged');
    assert.match(staged.gitCommit, /^[a-f0-9]{40}$/);
    assert(staged.stagedAt >= h.SEVEN_STORIES_PREIMAGE.capturedAt && staged.stagedAt <= packet.capturedAt);
    const enabled = phase === 'enabled' ? verifiedReceipt('enabled') : null;
    if (enabled) assert(enabled.activatedAt >= staged.stagedAt && enabled.activatedAt <= packet.capturedAt);
    const nextAuditDate = new Date(artifact.auditCompletedAt + (h.SEVEN_STORIES_RELEASE_DAYS - 1) * 86400000).toISOString().slice(0, 10);
    for (const target of packet.targets) {
      const c = target.content, link = target.link, reviewed = artifact.targets.find(t => t.slug === c.slug);
      const releaseId = h.sevenStoriesReleaseId(c.slug), contentRunId = h.sevenStoriesRunId(c.slug);
      const targetArtifactHash = hash(reviewed), output = extra => hash({ artifactHash: identity.artifactHash, targetArtifactHash, ...extra });
      const summary = `${artifact.summary} Target: story:${c.slug}.`, limitations = [...reviewed.limitations, ...artifact.limitations];
      const baseRun = { releaseId, status: 'completed', provider: artifact.provider, model: artifact.model, modelVersion: artifact.modelVersion,
        policyVersion: artifact.policyVersion, gitCommit: staged.gitCommit, targetCount: 1, limitations: [...artifact.limitations],
        startedAt: artifact.auditStartedAt, completedAt: artifact.auditCompletedAt };
      const run = target.runs.find(r => r.runId === contentRunId);
      assert.deepEqual(stripDb(run), { ...baseRun, runId: contentRunId, summary, outputHash: output({}) });
      assert.deepEqual(stripDb(target.contentAudits[0]), { runId: contentRunId, contentSlug: c.slug, contentType: 'story',
        reviewRevision: 3, contentUpdatedAt: c.updatedAt, contentSnapshotHash: reviewed.contentSnapshotHash,
        evidenceLinkUpdatedAt: link.updatedAt, evidenceLinkSnapshotHash: reviewed.evidenceLinkSnapshotHash, sourceIds: link.sourceIds,
        verdict: 'pass', checks: [...reviewed.contentChecks], limitations, auditedAt: artifact.auditCompletedAt, nextAuditDate,
        outputHash: output({ kind: 'content' }) });
      const sourceSnapshots = [];
      for (const source of reviewed.sources) {
        const sourceId = source.sourceId, id = h.sevenStoriesSourceRunId(c.slug, sourceId), actual = target.sources.find(s => s.sourceId === sourceId);
        assert.deepEqual(stripDb(target.runs.find(r => r.runId === id)), { ...baseRun, runId: id, summary: `${summary} Source: ${sourceId}.`, outputHash: output({ sourceId }) });
        assert.deepEqual(stripDb(target.evidenceAudits.find(r => r.runId === id)), { runId: id, sourceId, sourceUpdatedAt: actual.updatedAt,
          sourceSnapshotHash: source.sourceSnapshotHash, verdict: 'pass', claimScope: source.claimScope, urlsChecked: [...source.urlsChecked],
          findings: [...source.evidenceFindings], limitations: [...source.limitations, ...limitations], auditedAt: artifact.auditCompletedAt,
          nextAuditDate, outputHash: output({ kind: 'evidence', sourceId }) });
        sourceSnapshots.push({ sourceId, sourceUpdatedAt: actual.updatedAt, sourceSnapshotHash: source.sourceSnapshotHash, evidenceAuditRunId: id });
      }
      if (enabled) assert.deepEqual(stripDb(target.releases[0]), { releaseId, targetKey: `story\0${c.slug}`, contentId: c._id,
        contentType: 'story', contentSlug: c.slug, status: 'active', reviewRevision: 3, contentUpdatedAt: c.updatedAt,
        contentSnapshotHash: reviewed.contentSnapshotHash, evidenceLinkUpdatedAt: link.updatedAt,
        evidenceLinkSnapshotHash: reviewed.evidenceLinkSnapshotHash, sourceSnapshots, contentAuditRunId: contentRunId,
        auditArtifactHash: identity.artifactHash, policyVersion: artifact.policyVersion, gitCommit: staged.gitCommit,
        operator: enabled.operator, createdAt: enabled.activatedAt, expiresAt: artifact.auditCompletedAt + h.SEVEN_STORIES_RELEASE_DAYS * 86400000 });
    }
  }
  const dir = 'artifacts/seven-stories-publication-20260910';
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const path = `${dir}/${phase}-${packet.capturedAt}.json`, json = JSON.stringify(packet, null, 2) + '\n';
  writeFileSync(path, json, { mode: 0o600, flag: 'wx' });
  assert.equal(statSync(path).mode & 0o777, 0o600);
  console.log(JSON.stringify({ path, sha256: sha(json), mode: '0600', phase,
    capturedAt: new Date(packet.capturedAt).toISOString(), identity, targets: packet.targets.length,
    activeReleases: packet.activeReleases.length, runs: packet.targets.reduce((n,t) => n + t.runs.length, 0),
    contentAudits: packet.targets.reduce((n,t) => n + t.contentAudits.length, 0), evidenceAudits: packet.targets.reduce((n,t) => n + t.evidenceAudits.length, 0),
    oldPreservationDescriptors: packet.preservation.length, oldSchedules: packet.oldSchedules.length, newSchedules: packet.newSchedules.length,
    exactNewPayloadVerification: true,
  }, null, 2));
}
