// Exact read-only correction capture. No mutation or deployment path exists.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,statSync} from 'node:fs';
import {build} from 'esbuild';
const args=process.argv.slice(2),phase=args.find(a=>a.startsWith('--phase='))?.slice(8);
assert(['ready','applied'].includes(phase),'Use --phase=ready|applied');
assert(args.every(a=>a===`--phase=${phase}`||a==='--query-only'),'Unknown argument');
const built=await build({stdin:{contents:"export * from './convex/lib/threeGuideCorrectionData';export * from './convex/lib/threeGuideCorrectionHelpers';export * from './convex/lib/aiAuditHash';export {contentIsAiParentReadable} from './convex/lib/aiPublicationVisibility';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false});
const h=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const sha=x=>createHash('sha256').update(x).digest('hex'),hash=x=>sha(h.canonicalJson(x));
const baselineRaw=readFileSync('artifacts/next-guide-corrections-20260910/full-state-1789025953704.json');
assert.equal(sha(baselineRaw),h.THREE_GUIDE_IDENTITY.snapshotSha256);
const baseline=JSON.parse(baselineRaw),capturedAt=Date.now();
assert.equal(h.THREE_GUIDE_TARGETS.length,3);assert.equal(h.THREE_GUIDE_NEW_SOURCES.length,14);assert.equal(h.THREE_GUIDE_PRESERVATION.length,241);assert.equal(h.THREE_GUIDE_SCHEDULES.length,3);
const m={phase,capturedAt,identity:h.THREE_GUIDE_IDENTITY,targets:h.THREE_GUIDE_TARGETS.map(t=>({slug:t.slug,contentId:t.contentId,linkId:t.linkId})),sources:h.THREE_GUIDE_NEW_SOURCES.map(s=>({sourceId:s.metadata.sourceId,url:s.metadata.url,title:s.metadata.title})),descriptors:h.THREE_GUIDE_PRESERVATION,schedules:h.THREE_GUIDE_SCHEDULES};
const query=`export default query({args:{},handler:async(ctx)=>{
const m=${JSON.stringify(m)};
const check=(ok,message)=>{if(!ok)throw new Error('Three-guide capture: '+message);};
async function rowsFor(d){const {table,index,key,count}=d;switch(table){
case 'libraryContent':return ctx.db.query(table).withIndex('by_slug',q=>q.eq('slug',key)).take(count+1);
case 'evidenceLinks':return ctx.db.query(table).withIndex('by_slug',q=>q.eq('slug',key)).take(count+1);
case 'evidenceSources':return ctx.db.query(table).withIndex('by_source_id',q=>q.eq('sourceId',key)).take(count+1);
case 'contentReviews':case 'contentEditLogs':case 'libraryMedia':return ctx.db.query(table).withIndex('by_content',q=>q.eq('contentSlug',key)).take(count+1);
case 'clinicalReviewAssignments':return ctx.db.query(table).withIndex('by_exact_target',q=>q.eq('contentSlug',key)).take(count+1);
case 'clinicalReviewBatches':case 'clinicalReviewBatchReceipts':return ctx.db.query(table).withIndex('by_batch_id',q=>q.eq('batchId',key)).take(count+1);
case 'aiPublicationConfig':return ctx.db.query(table).withIndex('by_key',q=>q.eq('key',key)).take(count+1);
case 'aiPublicationReleases':return index==='by_status'?ctx.db.query(table).withIndex(index,q=>q.eq('status',key)).take(count+1):ctx.db.query(table).withIndex(index,q=>q.eq('targetKey',key)).take(count+1);
case 'aiAuditRuns':return index==='by_release_id'?ctx.db.query(table).withIndex(index,q=>q.eq('releaseId',key)).take(count+1):ctx.db.query(table).withIndex(index,q=>q.eq('runId',key)).take(count+1);
case 'aiContentAudits':return index==='by_run_id'?ctx.db.query(table).withIndex(index,q=>q.eq('runId',key)).take(count+1):ctx.db.query(table).withIndex(index,q=>q.eq('contentSlug',key)).take(count+1);
case 'aiEvidenceAudits':return ctx.db.query(table).withIndex('by_run_id',q=>q.eq('runId',key)).take(count+1);
case 'auditLogs':return ctx.db.query(table).withIndex('by_action',q=>q.eq('action',key)).take(count+1);
default:throw new Error('Unknown exact descriptor');}}
const preservation=[];for(const descriptor of m.descriptors){const rows=await rowsFor(descriptor);check(rows.length===descriptor.count,'preservation count '+descriptor.table);check(new Set(rows.map(r=>r._id)).size===rows.length,'duplicate preserved ID');preservation.push({descriptor,rows});}
const schedules=[];for(const descriptor of m.schedules){const row=await ctx.db.system.get(descriptor.id);check(row,'missing preserved schedule');schedules.push({descriptor,row});}
const targets=[];for(const t of m.targets){const contents=await ctx.db.query('libraryContent').withIndex('by_slug',q=>q.eq('slug',t.slug)).take(2);const links=await ctx.db.query('evidenceLinks').withIndex('by_slug',q=>q.eq('slug',t.slug)).take(2);check(contents.length===1&&contents[0]._id===t.contentId&&contents[0].type==='guide'&&contents[0].clinicalStatus==='clinical_review','content identity');check(links.length===1&&links[0]._id===t.linkId&&links[0].kind==='guide','link identity');targets.push({content:contents[0],link:links[0]});}
const receipts=await ctx.db.query('auditLogs').withIndex('by_action',q=>q.eq('action','release.three_guide_unpublished_correction')).take(2);check(receipts.length===(m.phase==='applied'?1:0),'receipt count');
const registry=await ctx.db.query('evidenceSources').take(1001);check(registry.length<=1000&&new Set(registry.map(r=>r.sourceId)).size===registry.length,'source registry bound or duplicate');
const normalize=url=>url.toLowerCase().replace(/^https?:\\/\\//,'').replace(/^www\\./,'').replace(/\\/$/,'');
const newSources=[];for(const s of m.sources){const rows=registry.filter(r=>r.sourceId===s.sourceId||normalize(r.url)===normalize(s.url)||r.title.toLowerCase()===s.title.toLowerCase());check(rows.length===(m.phase==='applied'?1:0),'new source collision/absence');if(rows.length){check(rows[0].sourceId===s.sourceId,'source alias');newSources.push(rows[0]);}}
return{schemaVersion:1,deployment:'graceful-possum-566',phase:m.phase,capturedAt:m.capturedAt,identity:m.identity,targets,newSources,receipts,preservation,schedules};
}});`;
if(args.includes('--query-only')){console.log(query);process.exit(0);}
const env={...process.env,CONVEX_DEPLOYMENT:'prod:graceful-possum-566'};
const directory='artifacts/next-guide-corrections-20260910';
execFileSync('git',['check-ignore','--quiet',directory+'/capture.json']);
const raw=execFileSync('npx',['--no-install','convex','run','--prod','--inline-query',query],{encoding:'utf8',maxBuffer:8_000_000,env});
const p=JSON.parse(raw);assert.equal(p.targets.length,3);assert.equal(p.preservation.length,241);assert.equal(p.schedules.length,3);
const tables={};function add(table,rows){tables[table]??=[];for(const row of rows){const old=tables[table].find(r=>r._id===row._id);if(old)assert.deepEqual(old,row);else tables[table].push(row);}}
for(const d of p.preservation){assert.equal(hash(h.sortedGuideRows(d.rows)),d.descriptor.hash,'Preservation drift');add(d.descriptor.table,d.rows);}
for(const s of p.schedules)assert.equal(hash(s.row),s.descriptor.hash,'Schedule drift');
let updatedAt=null,bindings=[];
if(phase==='applied'){
 const receipt=p.receipts[0],after=JSON.parse(receipt.after);updatedAt=after.updatedAt;bindings=after.sourceBindings;
 assert(Number.isFinite(updatedAt)&&updatedAt>=h.THREE_GUIDE_CAPTURED_AT&&updatedAt<h.THREE_GUIDE_APPLY_BEFORE);
 assert.equal(receipt.actorId,undefined);assert.equal(receipt.entityTable,'libraryContent');assert.equal(receipt.entityId,undefined);assert.equal(receipt.result,'ok');assert.equal(receipt.summary,h.THREE_GUIDE_IDENTITY.releaseId);
 assert.equal(receipt.before,JSON.stringify({...h.THREE_GUIDE_IDENTITY,targets:h.THREE_GUIDE_TARGETS.map(t=>({slug:t.slug,initialFullHash:t.initialFullHash,initialLinkHash:t.initialLinkHash,fromRevision:t.revision,toRevision:t.revision+1}))}));
 assert.equal(receipt.after,JSON.stringify({...h.THREE_GUIDE_IDENTITY,updatedAt,sourceBindings:bindings,targets:h.THREE_GUIDE_TARGETS.map(t=>({slug:t.slug,desiredStableHash:t.desiredStableHash,desiredLinkStableHash:t.desiredLinkStableHash})),humanDecisionsCreated:0,publicationDecisionsMade:0}));
 assert.equal(bindings.length,14);assert.equal(new Set(bindings.map(b=>b.id)).size,14);
}
for(const [i,pin]of h.THREE_GUIDE_NEW_SOURCES.entries()){
 const row=p.newSources.find(r=>r.sourceId===pin.metadata.sourceId);
 if(phase==='ready'){assert.equal(row,undefined);continue;}
 assert(row);assert.equal(hash(h.guideSourceMetadata(row)),pin.metadataHash);assert.equal(row.createdAt,updatedAt);assert.equal(row.updatedAt,updatedAt);assert.equal(row.reviewStatus,'awaiting_review');
 for(const k of ['reviewer','reviewDate','nextReviewDate'])assert.equal(row[k],null);
 for(const k of ['reviewerId','reviewerQualification','reviewScope'])assert.equal(row[k],undefined);
 assert.deepEqual(bindings[i],{sourceId:pin.metadata.sourceId,id:row._id,fullHash:hash(row)});
}
let checkedLeaves=0;
for(const pin of h.THREE_GUIDE_TARGETS){const t=p.targets.find(t=>t.content.slug===pin.slug),initial=baseline.targets.find(t=>t.content.slug===pin.slug);assert(t&&initial);
 assert.equal(t.content.aiPublicationReleaseId,undefined);assert.equal(t.content.aiPublishedAt,undefined);
 if(phase==='ready'){assert.equal(hash(t.content),pin.initialFullHash);assert.equal(hash(t.link),pin.initialLinkHash);}
 else{const desired={...h.correctedGuide(initial.content,pin.patches,pin.revision),updatedAt};assert.deepEqual(t.content,desired);assert.equal(hash(h.guideStablePostimage(t.content)),pin.desiredStableHash);assert.equal(hash(h.aiContentSnapshot(t.content)),pin.desiredReviewedCopyHash);assert.deepEqual(t.link,{...initial.link,sourceIds:[...pin.sourceIds],updatedAt});assert.equal(hash(h.guideStablePostimage(t.link)),pin.desiredLinkStableHash);for(const k of h.THREE_GUIDE_CLEARED_FIELDS)assert.equal(t.content[k],undefined);}
 for(const patch of pin.patches){assert.equal(patch.path.split('.').reduce((v,k)=>v?.[k],t.content),phase==='ready'?patch.before:patch.after);checkedLeaves++;}
}
assert.equal(checkedLeaves,74);
const enabledValue=execFileSync('npx',['--no-install','convex','env','get','AI_PUBLICATION_ENABLED','--prod'],{encoding:'utf8',env}).trim();assert.equal(enabledValue,'true','Live AI master flag is not true');process.env.AI_PUBLICATION_ENABLED=enabledValue;
const db={query(table){const conditions=[],index={eq(k,v){conditions.push([k,v]);return index;}};const c={withIndex(_i,f){f(index);return c;},async take(n){return(tables[table]??[]).filter(r=>conditions.every(([k,v])=>r[k]===v)).slice(0,n);},async unique(){const rows=await c.take(2);assert(rows.length<2);return rows[0]??null;}};return c;},async get(id){return Object.values(tables).flat().find(r=>r._id===id)??null;}};
const active=tables.aiPublicationReleases.filter(r=>r.status==='active');assert.equal(active.length,10);
const readability=[];for(const r of active){const content=tables.libraryContent.find(c=>c._id===r.contentId);assert(content);const readable=await h.contentIsAiParentReadable({db},content,capturedAt);assert.equal(readable,true,r.contentSlug+' preview visibility');readability.push({slug:r.contentSlug,parentReadable:readable});}
p.verification={checkedLeaves,exactPreservation:241,exactSchedules:3,sourceMetadataAndReceiptExact:true,readability,liveAiMasterFlag:true,mode:'actual canonical hashes and actual visibility helper over fresh packet; no hash or visibility mocks'};
mkdirSync(directory,{recursive:true,mode:0o700});const path=directory+`/correction-${phase}-${capturedAt}.json`,serialized=JSON.stringify(p,null,2)+'\n';writeFileSync(path,serialized,{mode:0o600,flag:'wx'});assert.equal(statSync(path).mode&0o777,0o600);
console.log(JSON.stringify({path,sha256:sha(serialized),capturedAt:new Date(capturedAt).toISOString(),phase,updatedAt,targets:p.targets.map(t=>({slug:t.content.slug,revision:t.content.reviewRevision,status:t.content.clinicalStatus})),newSources:p.newSources.length,checkedLeaves,preservation:241,schedules:3,aiReadable:10,mode:'0600'},null,2));
