#!/usr/bin/env node
// Read-only bounded catalogue audit. A candidate is NOT approval or publication.
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';

const bundled = await build({ stdin: { contents: `export { requiredPublicationReviews, specialistReviewReason } from './convex/lib/contentReviewRequirements'; export { evaluatePublicationEvidence } from './convex/lib/evidencePublicationGate'; export { isRetiredContentSlug } from './convex/lib/contentRetirements';`, resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent' });
const policy = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
const query = `export default query({args:{},handler:async(ctx)=>{
const [content,links,sources,reviews,releases]=await Promise.all([
ctx.db.query('libraryContent').take(1001),ctx.db.query('evidenceLinks').take(2001),ctx.db.query('evidenceSources').take(1001),ctx.db.query('contentReviews').take(8001),ctx.db.query('aiPublicationReleases').take(51)]);
if(content.length>1000||links.length>2000||sources.length>1000||reviews.length>8000||releases.length>50)throw new Error('Audit bound exceeded; pagination required');
return {content:content.map(r=>({slug:r.slug,type:r.type,titleEn:r.titleEn,summaryEn:r.summaryEn,data:r.data,clinicalStatus:r.clinicalStatus,reviewRevision:r.reviewRevision,version:r.version,requiredReviewDimensions:r.requiredReviewDimensions})),links:links.map(r=>({kind:r.kind,slug:r.slug,sourceIds:r.sourceIds})),sources:sources.map(r=>({sourceId:r.sourceId,reviewStatus:r.reviewStatus,evidenceLevel:r.evidenceLevel,year:r.year,reviewDate:r.reviewDate,nextReviewDate:r.nextReviewDate,verifiedOn:r.verifiedOn})),reviews:reviews.map(r=>({contentSlug:r.contentSlug,contentVersion:r.contentVersion,dimension:r.dimension,decision:r.decision,time:r._creationTime})),releases:releases.map(r=>({slug:r.contentSlug,status:r.status,expiresAt:r.expiresAt}))};}});`;
let snapshot;
try {
  snapshot = JSON.parse(execFileSync('npx', ['--no-install','convex','run','--prod','--inline-query',query], {env:{...process.env,CONVEX_DEPLOYMENT:'prod:graceful-possum-566'},encoding:'utf8',stdio:['ignore','pipe','pipe'],maxBuffer:16*1024*1024}));
} catch { throw new Error('Read-only catalogue audit failed; no mutation attempted. Raw output suppressed.'); }
const today = new Date().toISOString().slice(0,10);
const latest = new Map();
for(const r of snapshot.reviews) { const key = `${r.contentSlug}\0${r.contentVersion}\0${r.dimension}`; if(!latest.has(key)||latest.get(key).time<r.time)latest.set(key,r); }
const rows = snapshot.content.map(c=>{
 const revision = c.reviewRevision??c.version??1;
 const required = [...new Set([...policy.requiredPublicationReviews(c),...(c.requiredReviewDimensions??[])])];
 const missing = required.filter(d=>latest.get(`${c.slug}\0${revision}\0${d}`)?.decision!=='approved');
 const link = snapshot.links.filter(l=>l.kind===c.type&&l.slug===c.slug);
 const evidence = policy.evaluatePublicationEvidence(link[0]?.sourceIds??[],snapshot.sources,today);
 const aiActiveRecord = snapshot.releases.some(r=>r.slug===c.slug&&r.status==='active'&&r.expiresAt>Date.now());
 return {slug:c.slug,type:c.type,status:c.clinicalStatus,revision,retired:policy.isRetiredContentSlug(c.slug)||c.clinicalStatus==='archived',specialistReason:policy.specialistReviewReason(c),missing,evidenceAllowed:evidence.allowed&&link.length===1,aiActiveRecord};
});
const pending = rows.filter(r=>!r.retired&&r.status!=='published'&&!r.aiActiveRecord);
console.log(JSON.stringify({capturedAt:new Date().toISOString(),complete:true,total:rows.length,storedPublished:rows.filter(r=>r.status==='published').length,retired:rows.filter(r=>r.retired).length,activeAiRecordCount:rows.filter(r=>r.aiActiveRecord).length,pendingCount:pending.length,pendingSpecialist:pending.filter(r=>r.specialistReason).length,missingReviewCounts:Object.fromEntries(['english','native_myanmar','child_development','evidence','safety','clinical'].map(d=>[d,pending.filter(r=>r.missing.includes(d)).length])),pendingWithEvidenceBlock:pending.filter(r=>!r.evidenceAllowed).length,ordinaryGateCandidates:pending.filter(r=>r.missing.length===0&&r.evidenceAllowed),pending,limitations:['Stored published and active AI records are not independently verified parent visibility.','Candidates still need frozen provenance, professional publisher authorization, media and live runtime checks; no approval or publication performed.','Risk classification is the deployed code heuristic, not clinical assessment.']},null,2));
