// Bounded read-only capture. No production writes or deployments.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const query = `export default query({args:{},handler:async(ctx)=>{
const slugs=['act_picture_story_2_5y','act_picture_story_3y','act_picture_story_3_5y','act_picture_story_4y','act_picture_story_4_5y','act_picture_story_5y'],root='2026-09-10-six-picture-stories-ai-preview-v1';
const selected=slugs.map(()=>['aap-power-of-play-2018','cdc-milestones-2026']);
const get=async(table,index,field,key,limit=101)=>ctx.db.query(table).withIndex(index,q=>q.eq(field,key)).take(limit);
const activeReleases=await get('aiPublicationReleases','by_status','status','active',19);
if(activeReleases.length!==18)throw new Error('Expected exactly eighteen existing active releases');
const preservation=[];const keys=new Set();
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
for(const prefix of ['library.ai_early_math','library.ai_two_stories','library.ai_seven_stories','library.ai_reading_together','library.ai_power_of_play','library.ai_two_lessons','library.ai_four_lessons'])for(const phase of ['staged','enabled','withdrawn','expired']){
 const rows=await pin('auditLogs','by_action','action',prefix+'.'+phase,3);
 for(const row of rows??[]){let p;try{p=JSON.parse(row.after??'null')}catch{continue}const id=p?.expiryScheduledFunctionId;if(id&&!oldSchedules.some(s=>s._id===id)){const schedule=await ctx.db.system.get(id);if(!schedule)throw new Error('Missing old schedule');oldSchedules.push(schedule);}}
}
const targets=[],collisions=[];
for(const [i,slug] of slugs.entries()){
 const contents=await get('libraryContent','by_slug','slug',slug,2),links=await get('evidenceLinks','by_slug','slug',slug,2);
 if(contents.length!==1||links.length!==1)throw new Error('Exact target missing '+slug);
 const sources=[];for(const id of [...new Set([...links[0].sourceIds,...selected[i]])]){const rows=await get('evidenceSources','by_source_id','sourceId',id,2);if(rows.length!==1)throw new Error('Exact source missing '+id);sources.push(rows[0]);await pin('aiEvidenceAudits','by_source_and_updated_at','sourceId',id);}
 targets.push({content:contents[0],link:links[0],sources,reviews:await get('contentReviews','by_content','contentSlug',slug),media:await get('libraryMedia','by_content','contentSlug',slug),assignments:await get('clinicalReviewAssignments','by_exact_target','contentSlug',slug),contentAudits:await get('aiContentAudits','by_content_revision_and_updated_at','contentSlug',slug)});
 for(const [table,index,field,key] of [['aiPublicationReleases','by_release_id','releaseId',root+':activity:'+slug],['aiPublicationReleases','by_target_key','targetKey','activity\\u0000'+slug],['aiAuditRuns','by_release_id','releaseId',root+':activity:'+slug]])collisions.push({table,index,field,key,rows:await get(table,index,field,key,4)});
 for(const runId of [root+':content:'+slug,...selected[i].map(s=>root+':evidence:'+slug+':'+s)])for(const table of ['aiAuditRuns','aiContentAudits','aiEvidenceAudits'])collisions.push({table,index:'by_run_id',field:'runId',key:runId,rows:await get(table,'by_run_id','runId',runId,2)});
}
for(const phase of ['staged','enabled','withdrawn','expired'])collisions.push({table:'auditLogs',index:'by_action',field:'action',key:'library.ai_six_picture_stories.'+phase,rows:await get('auditLogs','by_action','action','library.ai_six_picture_stories.'+phase,2)});
if(collisions.some(c=>c.rows.length))throw new Error('New release collision');
return{capturedAt:Date.now(),deployment:'graceful-possum-566',targets,activeReleases,preservation,oldSchedules,collisions};
}});`;

const packet = JSON.parse(execFileSync("npx", ["--no-install", "convex", "run", "--prod", "--inline-query", query], {
  encoding: "utf8", maxBuffer: 24 * 1024 * 1024,
  env: { ...process.env, CONVEX_DEPLOYMENT: "prod:graceful-possum-566" },
}));
const directory = "artifacts/six-picture-stories-preview-20260910";
mkdirSync(directory, { recursive: true });
const path = `${directory}/snapshot-${packet.capturedAt}.json`;
const raw = JSON.stringify(packet, null, 2) + "\n";
writeFileSync(path, raw, { mode: 0o600 });
process.stdout.write(JSON.stringify({
  path, sha256: createHash("sha256").update(raw).digest("hex"),
  preservation: packet.preservation.length, schedules: packet.oldSchedules.length,
  targets: packet.targets.map(t=>({slug:t.content.slug,revision:t.content.reviewRevision,sources:t.sources.length,reviews:t.reviews.length,media:t.media.length,assignments:t.assignments.length})),
}, null, 2) + "\n");
