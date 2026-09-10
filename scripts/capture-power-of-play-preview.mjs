// Bounded read-only capture. No production writes or deployments.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const query = `export default query({args:{},handler:async(ctx)=>{
const slug='lsn_power_of_play',root='2026-09-10-power-of-play-ai-preview-v1';
const get=async(table,index,field,key,limit=101)=>ctx.db.query(table).withIndex(index,q=>q.eq(field,key)).take(limit);
const activeReleases=await get('aiPublicationReleases','by_status','status','active',13);
if(activeReleases.length!==11)throw new Error('Expected exactly eleven existing active releases');
const preservation=[];
const keys=new Set();
async function pin(table,index,field,key,limit=101){const k=JSON.stringify([table,index,key]);if(keys.has(k))return;keys.add(k);const rows=await get(table,index,field,key,limit);if(rows.length===limit)throw new Error('Capture truncated '+k);preservation.push({table,index,field,key,rows});return rows;}
await pin('aiPublicationConfig','by_key','key','global',2);
const oldSchedules=[];
for(const release of activeReleases){
 await pin('aiPublicationReleases','by_release_id','releaseId',release.releaseId,2);
 await pin('aiPublicationReleases','by_target_key','targetKey',release.targetKey);
 await pin('libraryContent','by_slug','slug',release.contentSlug,2);
 await pin('evidenceLinks','by_slug','slug',release.contentSlug,2);
 await pin('contentReviews','by_content','contentSlug',release.contentSlug);
 await pin('libraryMedia','by_content','contentSlug',release.contentSlug);
 await pin('clinicalReviewAssignments','by_exact_target','contentSlug',release.contentSlug,2);
 await pin('aiContentAudits','by_content_revision_and_updated_at','contentSlug',release.contentSlug);
 await pin('aiAuditRuns','by_release_id','releaseId',release.releaseId);
 for(const source of release.sourceSnapshots)await pin('evidenceSources','by_source_id','sourceId',source.sourceId,2);
 for(const runId of [...new Set([release.contentAuditRunId,...release.sourceSnapshots.map(s=>s.evidenceAuditRunId)])]){
  await pin('aiAuditRuns','by_run_id','runId',runId,2);
  await pin('aiContentAudits','by_run_id','runId',runId,2);
  await pin('aiEvidenceAudits','by_run_id','runId',runId,2);
 }
}
for(const prefix of ['library.ai_early_math','library.ai_two_stories','library.ai_seven_stories','library.ai_reading_together'])for(const phase of ['staged','enabled','withdrawn','expired']){
 const rows=await pin('auditLogs','by_action','action',prefix+'.'+phase,3);
 for(const row of rows??[]){let p;try{p=JSON.parse(row.after??'null')}catch{continue}const id=p?.expiryScheduledFunctionId;if(id&&!oldSchedules.some(s=>s._id===id)){const schedule=await ctx.db.system.get(id);if(!schedule)throw new Error('Missing old schedule');oldSchedules.push(schedule);}}
}
const contents=await get('libraryContent','by_slug','slug',slug,2),links=await get('evidenceLinks','by_slug','slug',slug,2);
if(contents.length!==1||links.length!==1)throw new Error('Exact target missing');
const sources=[];for(const id of links[0].sourceIds){const rows=await get('evidenceSources','by_source_id','sourceId',id,2);if(rows.length!==1)throw new Error('Exact source missing');sources.push(rows[0]);await pin('aiEvidenceAudits','by_source_and_updated_at','sourceId',id);}
const target={content:contents[0],link:links[0],sources,reviews:await get('contentReviews','by_content','contentSlug',slug),media:await get('libraryMedia','by_content','contentSlug',slug),assignments:await get('clinicalReviewAssignments','by_exact_target','contentSlug',slug),contentAudits:await get('aiContentAudits','by_content_revision_and_updated_at','contentSlug',slug)};
const collisions=[];for(const [table,index,field,key] of [['aiPublicationReleases','by_release_id','releaseId',root+':lesson:'+slug],['aiPublicationReleases','by_target_key','targetKey','lesson\\u0000'+slug],['aiAuditRuns','by_release_id','releaseId',root+':lesson:'+slug]])collisions.push({table,index,field,key,rows:await get(table,index,field,key,4)});
for(const runId of [root+':content:'+slug,...['aap-power-of-play-2018','who-improving-ecd-2020'].map(s=>root+':evidence:'+slug+':'+s)])for(const table of ['aiAuditRuns','aiContentAudits','aiEvidenceAudits'])collisions.push({table,index:'by_run_id',field:'runId',key:runId,rows:await get(table,'by_run_id','runId',runId,2)});
for(const phase of ['staged','enabled','withdrawn','expired'])collisions.push({table:'auditLogs',index:'by_action',field:'action',key:'library.ai_power_of_play.'+phase,rows:await get('auditLogs','by_action','action','library.ai_power_of_play.'+phase,2)});
if(collisions.some(c=>c.rows.length))throw new Error('New release collision');
return{capturedAt:Date.now(),deployment:'graceful-possum-566',target,activeReleases,preservation,oldSchedules,collisions};
}});`;
const packet = JSON.parse(execFileSync('npx', ['--no-install', 'convex', 'run', '--prod', '--inline-query', query], {
  encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
  env: { ...process.env, CONVEX_DEPLOYMENT: 'prod:graceful-possum-566' },
}));
const directory = 'artifacts/power-of-play-preview-20260910';
mkdirSync(directory, { recursive: true });
const path = `${directory}/snapshot-${packet.capturedAt}.json`;
const raw = JSON.stringify(packet, null, 2) + '\n';
writeFileSync(path, raw, { mode: 0o600 });
process.stdout.write(JSON.stringify({ path, sha256: createHash('sha256').update(raw).digest('hex'), preservation: packet.preservation.length, schedules: packet.oldSchedules.length, sources: packet.target.sources.length }, null, 2) + '\n');
