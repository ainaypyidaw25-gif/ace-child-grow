// Read-only production capture for seven exact pending fictional stories.
// No deployment, mutation, approval or publication is performed by this script.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';

const targets = [
  'st_little_seed',
  'st_ba_ba_sounds',
  'st_when_i_feel_angry',
  'st_taking_turns',
  'st_goodnight_moon_friend',
  'st_visit_to_doctor',
  'st_sharing_mango',
].map((slug) => ({ type: 'story', slug }));
const preservedTargets = [
  { type: 'lesson', slug: 'lsn_early_math' },
  { type: 'story', slug: 'st_waiting_at_clinic' },
  { type: 'story', slug: 'st_first_day_school' },
];

const query = `export default query({args:{},handler:async(ctx)=>{
  const targets=${JSON.stringify(targets)};
  const preservedTargets=${JSON.stringify(preservedTargets)};
  const fail=(message)=>{throw new Error('Seven-story capture: '+message);};
  const unique=(rows,key,label)=>{
    if(new Set(rows.map(row=>row[key])).size!==rows.length)fail('duplicate '+label);
  };
  const configs=await ctx.db.query('aiPublicationConfig').withIndex('by_key',q=>q.eq('key','global')).take(2);
  const activeReleases=await ctx.db.query('aiPublicationReleases').withIndex('by_status',q=>q.eq('status','active')).take(4);
  if(configs.length!==1||!configs[0].enabled||!Number.isInteger(configs[0].generation))fail('expected one enabled config');
  if(activeReleases.length!==3)fail('expected exactly three existing active previews');
  unique(activeReleases,'targetKey','active target keys');
  unique(activeReleases,'releaseId','active release IDs');
  const expectedKeys=preservedTargets.map(t=>t.type+'\\u0000'+t.slug);
  if(activeReleases.some(r=>!expectedKeys.includes(r.targetKey)||r.targetKey!==r.contentType+'\\u0000'+r.contentSlug))fail('unexpected active target');

  async function captureTarget(target,preserve){
    const {type,slug}=target;
    const [contents,links,reviews,media,assignments,releases]=await Promise.all([
      ctx.db.query('libraryContent').withIndex('by_slug',q=>q.eq('slug',slug)).take(2),
      // By slug, not just by kind: a contradictory second type fails closed.
      ctx.db.query('evidenceLinks').withIndex('by_slug',q=>q.eq('slug',slug)).take(2),
      ctx.db.query('contentReviews').withIndex('by_content',q=>q.eq('contentSlug',slug)).take(101),
      ctx.db.query('libraryMedia').withIndex('by_content',q=>q.eq('contentSlug',slug)).take(101),
      ctx.db.query('clinicalReviewAssignments').withIndex('by_exact_target',q=>q.eq('contentSlug',slug)).take(33),
      ctx.db.query('aiPublicationReleases').withIndex('by_target_key',q=>q.eq('targetKey',type+'\\u0000'+slug)).take(33),
    ]);
    if(contents.length!==1||contents[0].type!==type||links.length!==1||links[0].kind!==type)fail('content/link identity '+slug);
    if(reviews.length>100||media.length>100||assignments.length>32||releases.length>32)fail('collection bound '+slug);
    const content=contents[0],link=links[0];
    if(content.clinicalStatus!=='clinical_review')fail('unexpected lifecycle '+slug);
    if(!Number.isInteger(content.reviewRevision??content.version)||(content.reviewRevision??content.version)<1)fail('invalid revision '+slug);
    if(!preserve&&(content.aiPublicationReleaseId!==undefined||content.aiPublishedAt!==undefined))fail('pending story already has AI pointer '+slug);
    if(link.sourceIds.length<1||link.sourceIds.length>20||new Set(link.sourceIds).size!==link.sourceIds.length)fail('source-list bound/duplicates '+slug);
    unique(releases,'releaseId','historical release IDs '+slug);
    const sources=[];
    for(const sourceId of link.sourceIds){
      const rows=await ctx.db.query('evidenceSources').withIndex('by_source_id',q=>q.eq('sourceId',sourceId)).take(2);
      if(rows.length!==1)fail('source identity '+sourceId);
      sources.push(rows[0]);
    }
    const batches=[],batchReceipts=[];
    for(const batchId of new Set(assignments.map(a=>a.batchId))){
      const rows=await ctx.db.query('clinicalReviewBatches').withIndex('by_batch_id',q=>q.eq('batchId',batchId)).take(2);
      const receipts=await ctx.db.query('clinicalReviewBatchReceipts').withIndex('by_batch_id',q=>q.eq('batchId',batchId)).take(2);
      if(rows.length!==1||receipts.length>1)fail('batch/receipt identity '+batchId);
      batches.push(rows[0]);batchReceipts.push(...receipts);
    }
    const runs=[],contentAudits=[],evidenceAudits=[];
    const requestedRunIds=new Set();
    for(const release of releases){
      if(release.contentId!==content._id||release.contentSlug!==slug||release.contentType!==type)fail('release identity '+slug);
      if(release.sourceSnapshots.length>20)fail('historical source bound '+slug);
      requestedRunIds.add(release.contentAuditRunId);
      for(const source of release.sourceSnapshots)requestedRunIds.add(source.evidenceAuditRunId);
      const releaseRuns=await ctx.db.query('aiAuditRuns').withIndex('by_release_id',q=>q.eq('releaseId',release.releaseId)).take(17);
      if(releaseRuns.length>16)fail('release audit-run bound '+slug);
      unique(releaseRuns,'runId','run IDs '+slug);
      for(const run of releaseRuns)requestedRunIds.add(run.runId);
    }
    // Also capture target audits that might be staged without a release row.
    const targetAudits=await ctx.db.query('aiContentAudits').withIndex('by_content_revision_and_updated_at',q=>q.eq('contentSlug',slug)).take(65);
    if(targetAudits.length>64)fail('target content-audit bound '+slug);
    for(const audit of targetAudits)requestedRunIds.add(audit.runId);
    if(requestedRunIds.size>64)fail('target audit-run bound '+slug);
    for(const runId of requestedRunIds){
      const [runRows,contentRows,evidenceRows]=await Promise.all([
        ctx.db.query('aiAuditRuns').withIndex('by_run_id',q=>q.eq('runId',runId)).take(2),
        ctx.db.query('aiContentAudits').withIndex('by_run_id',q=>q.eq('runId',runId)).take(2),
        ctx.db.query('aiEvidenceAudits').withIndex('by_run_id',q=>q.eq('runId',runId)).take(21),
      ]);
      if(runRows.length!==1||contentRows.length>1||evidenceRows.length>20)fail('audit identity/bound '+slug);
      if(contentRows.some(row=>row.contentSlug!==slug))fail('cross-target content audit '+slug);
      unique(evidenceRows,'sourceId','evidence-audit source IDs '+slug);
      runs.push(...runRows);contentAudits.push(...contentRows);evidenceAudits.push(...evidenceRows);
    }
    // Preserve old source records too, not only today's current evidence edge.
    const historicalSourceIds=new Set([
      ...releases.flatMap(release=>release.sourceSnapshots.map(source=>source.sourceId)),
      ...evidenceAudits.map(audit=>audit.sourceId),
    ].filter(sourceId=>!link.sourceIds.includes(sourceId)));
    if(historicalSourceIds.size>64)fail('historical source bound '+slug);
    const historicalSources=[];
    for(const sourceId of historicalSourceIds){
      const rows=await ctx.db.query('evidenceSources').withIndex('by_source_id',q=>q.eq('sourceId',sourceId)).take(2);
      if(rows.length!==1)fail('historical source identity '+sourceId);
      historicalSources.push(rows[0]);
    }
    if(preserve){
      const active=activeReleases.filter(row=>row.contentSlug===slug&&row.contentType===type);
      if(active.length!==1||content.aiPublicationReleaseId!==active[0].releaseId
        ||content.aiPublishedAt!==active[0].createdAt
        ||active[0].reviewRevision!==(content.reviewRevision??content.version)
        ||active[0].contentUpdatedAt!==content.updatedAt
        ||!releases.some(row=>row._id===active[0]._id))fail('existing preview binding '+slug);
    }
    return {content,link,sources,historicalSources,reviews,media,assignments,batches,batchReceipts,releases,runs,contentAudits,evidenceAudits};
  }
  const pending=[];
  for(const target of targets)pending.push(await captureTarget(target,false));
  const preserved=[];
  for(const target of preservedTargets)preserved.push(await captureTarget(target,true));
  const preservationReceipts=[];
  for(const action of ['library.ai_early_math.staged','library.ai_two_stories.enabled']){
    const rows=await ctx.db.query('auditLogs').withIndex('by_action',q=>q.eq('action',action)).take(17);
    if(rows.length>16)fail('preservation receipt bound');
    preservationReceipts.push(...rows);
  }
  const scheduledExpiries=[];
  for(const receipt of preservationReceipts){
    let after;try{after=JSON.parse(receipt.after??'null');}catch{fail('invalid preservation receipt');}
    if(after?.expiryScheduledFunctionId){
      const scheduled=await ctx.db.system.get(after.expiryScheduledFunctionId);
      if(!scheduled)fail('missing preserved scheduled expiry');
      scheduledExpiries.push({receiptId:receipt._id,scheduled});
    }
  }
  return {schemaVersion:1,capturedAt:Date.now(),deployment:'prod:graceful-possum-566',
    limits:{sourcesPerLink:20,historicalSourcesPerTarget:64,reviewsPerTarget:100,mediaPerTarget:100,assignmentsPerTarget:32,releasesPerTarget:32,runsPerTarget:64,evidenceAuditsPerRun:20},
    config:configs,activeReleases,targets:pending,preservedTargets:preserved,preservationReceipts,scheduledExpiries};
}});`;

function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  return `{${Object.entries(value).filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => `${JSON.stringify(key)}:${canonical(v)}`).join(',')}}`;
}
const hash = (value) => createHash('sha256').update(canonical(value)).digest('hex');

const args = process.argv.slice(2);
if (args.length === 1 && args[0] === '--query-only') {
  console.log(query);
} else {
  if (args.length) throw new Error('Only optional --query-only is supported; no mutation mode exists.');
  const directory = 'artifacts/seven-story-preflight-20260910';
  execFileSync('git', ['check-ignore', '--quiet', `${directory}/snapshot.json`]);
  const raw = execFileSync('npx', ['--no-install', 'convex', 'run', '--prod', '--inline-query', query], {
    encoding: 'utf8', maxBuffer: 8_000_000,
    env: { ...process.env, CONVEX_DEPLOYMENT: 'prod:graceful-possum-566' },
  });
  const packet = JSON.parse(raw);
  if (packet.targets.length !== 7 || packet.preservedTargets.length !== 3 || packet.activeReleases.length !== 3) {
    throw new Error('Unexpected capture coverage; no artifact written.');
  }
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const path = `${directory}/snapshot-${packet.capturedAt}.json`;
  const serialized = JSON.stringify(packet, null, 2);
  writeFileSync(path, serialized, { mode: 0o600, flag: 'wx' });
  if ((statSync(path).mode & 0o777) !== 0o600) throw new Error('Private artifact mode verification failed.');
  const summarize = (target) => ({
    slug: target.content.slug,
    revision: target.content.reviewRevision ?? target.content.version,
    status: target.content.clinicalStatus,
    contentFullHash: hash([target.content]),
    linkFullHash: hash([target.link]),
    sourcesFullHash: hash(target.sources),
    historicalSourcesFullHash: hash(target.historicalSources),
    reviewsFullHash: hash(target.reviews),
    mediaFullHash: hash(target.media),
    assignmentsFullHash: hash(target.assignments),
    releasesFullHash: hash(target.releases),
    runsFullHash: hash(target.runs),
    counts: { sources: target.sources.length, historicalSources: target.historicalSources.length,
      reviews: target.reviews.length, media: target.media.length,
      assignments: target.assignments.length, batches: target.batches.length, releases: target.releases.length,
      runs: target.runs.length, contentAudits: target.contentAudits.length, evidenceAudits: target.evidenceAudits.length },
    hasReleaseGovernance: target.batches.some((batch) => batch.authority === 'release'),
  });
  console.log(JSON.stringify({
    path, sha256: createHash('sha256').update(serialized).digest('hex'), mode: '0600',
    capturedAt: new Date(packet.capturedAt).toISOString(),
    configFullHash: hash(packet.config), activeReleasesFullHash: hash(packet.activeReleases),
    generation: packet.config[0].generation, activeReleaseCount: packet.activeReleases.length,
    targets: packet.targets.map(summarize), preservedTargets: packet.preservedTargets.map(summarize),
    preservedExpiryCount: packet.scheduledExpiries.length,
  }, null, 2));
}
