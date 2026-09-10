// Read-only content-only review packet; never records approvals or reads customer data.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const env = { ...process.env, CONVEX_DEPLOYMENT: 'prod:graceful-possum-566' };
const backlog = JSON.parse(execFileSync('node', ['scripts/publication-backlog-audit.mjs'], { encoding:'utf8', env, maxBuffer:16000000 }));
const query = `export default query({args:{},handler:async(ctx)=>{
const [content,links,sources]=await Promise.all([ctx.db.query('libraryContent').take(1001),ctx.db.query('evidenceLinks').take(2001),ctx.db.query('evidenceSources').take(1001)]);
if(content.length>1000||links.length>2000||sources.length>1000)throw new Error('Snapshot bound exceeded');
return {content:content.map(({slug,type,titleEn,titleMm,summaryEn,summaryMm,data,reviewRevision,version,updatedAt,ageGroupKey,domainKey,category,tags,difficulty,durationMinutes,offline,source})=>({slug,type,titleEn,titleMm,summaryEn,summaryMm,data,reviewRevision,version,updatedAt,ageGroupKey,domainKey,category,tags,difficulty,durationMinutes,offline,source})),links:links.map(({kind,slug,sourceIds})=>({kind,slug,sourceIds})),sources:sources.map(({sourceId,title,url,year,reviewStatus,evidenceLevel,verifiedOn,nextReviewDate})=>({sourceId,title,url,year,reviewStatus,evidenceLevel,verifiedOn,nextReviewDate}))};}});`;
const raw = JSON.parse(execFileSync('npx',['--no-install','convex','run','--prod','--inline-query',query],{encoding:'utf8',env,maxBuffer:24000000}));
const targets=backlog.pending.map(gate=>{
 const matches=raw.content.filter(c=>c.slug===gate.slug); if(matches.length!==1)throw new Error('Ambiguous content');
 const content=matches[0]; if((content.reviewRevision??content.version??1)!==gate.revision)throw new Error('Revision changed');
 const links=raw.links.filter(l=>l.kind===gate.type&&l.slug===gate.slug);
 const sources=raw.sources.filter(s=>links.some(l=>l.sourceIds.includes(s.sourceId)));
 return {gate,content,links,sources,contentHash:createHash('sha256').update(JSON.stringify(content)).digest('hex')};
});
const packet={capturedAt:new Date().toISOString(),limitations:['AI preparatory review only; no human approval or publication.','Metadata source eligibility is not current publisher verification.'],targets};
const directory='artifacts/review-backlog-20260910'; mkdirSync(directory,{recursive:true});
const path=directory+'/snapshot-'+Date.now()+'.json'; const text=JSON.stringify(packet,null,2); writeFileSync(path,text,{mode:0o600,flag:'wx'});
console.log(JSON.stringify({path,sha256:createHash('sha256').update(text).digest('hex'),count:targets.length,byType:Object.fromEntries([...new Set(targets.map(t=>t.gate.type))].map(type=>[type,targets.filter(t=>t.gate.type===type).length]))},null,2));
