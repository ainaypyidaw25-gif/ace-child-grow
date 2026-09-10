// Verify AI review packet coverage locally. Does not connect to or mutate production.
import assert from 'node:assert/strict';
import { readFileSync,writeFileSync,mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
const [snapshotPath,...reports]=process.argv.slice(2);
assert.equal(reports.length,3,'Provide exact snapshot and three review reports');
const raw=readFileSync(snapshotPath,'utf8'),snapshot=JSON.parse(raw);
const packetSha256=createHash('sha256').update(raw).digest('hex');
const expected=new Map(snapshot.targets.map(t=>[t.gate.slug,t]));
assert.equal(expected.size,snapshot.targets.length,'Duplicate snapshot targets');
for(const target of snapshot.targets){
 assert.equal(target.content.slug,target.gate.slug,'Snapshot slug mismatch');
 assert.equal(target.content.type,target.gate.type,'Snapshot type mismatch');
 assert.equal(target.content.reviewRevision??target.content.version??1,target.gate.revision,'Snapshot revision mismatch');
 assert.equal(createHash('sha256').update(JSON.stringify(target.content)).digest('hex'),target.contentHash,'Changed snapshot content');
 assert.equal(target.gate.retired,false,'Retired target is out of scope');
}
const seen=new Set(),rows=[];
const dispositions=new Set(['AI_preparatory_pass','needs_correction','needs_source_verification','needs_specialist']);
for(const reportPath of reports){
 const report=JSON.parse(readFileSync(reportPath,'utf8'));
 assert.equal(report.packetSha256??report.snapshotSha256,packetSha256,`Report snapshot/source binding mismatch: ${reportPath}`);
 const reviews=report.targets??report.rows??report.reviews??report.items;
 assert.ok(Array.isArray(reviews),'Missing review entries');
 for(const r of reviews){
  assert.ok(!seen.has(r.slug),`Duplicate review ${r.slug}`);seen.add(r.slug);
  const target=expected.get(r.slug);assert.ok(target,`Unexpected review ${r.slug}`);
  assert.equal(r.revision,target.gate.revision,`Revision drift ${r.slug}`);
  assert.equal(r.contentHash,target.contentHash,`Hash drift ${r.slug}`);
  assert.ok(dispositions.has(r.disposition),`Unknown disposition ${r.slug}`);
  assert.ok(r.humanApproval!==true && r.publicationAuthorizedByThisArtifact!==true && r.actualReviewScope?.professionalOrHumanApproval!==true && r.actualReviewScope?.publicationAuthorization!==true,'AI review must not assert human approval');
  const findings=r.findings??r.exactFieldFindings;
  assert.ok(Array.isArray(findings),`Missing findings ${r.slug}`);
  rows.push({slug:r.slug,type:target.gate.type,revision:r.revision,contentHash:r.contentHash,disposition:r.disposition,missingHumanReviews:target.gate.missing,existingSpecialistReason:target.gate.specialistReason,reportPath,findings,proposedFieldPatches:r.proposedFieldPatches??r.recommendedCorrections??[],approved:false});
 }
}
assert.equal(seen.size,expected.size,'Incomplete AI review coverage');
rows.sort((a,b)=>a.slug.localeCompare(b.slug));
const counts=Object.fromEntries([...dispositions].map(d=>[d,rows.filter(r=>r.disposition===d).length]));
const result={generatedAt:new Date().toISOString(),snapshotPath,snapshotSha256:createHash('sha256').update(raw).digest('hex'),scope:'AI preparatory content review only. No human approval, publication or production mutation.',total:rows.length,counts,existingSpecialistCount:rows.filter(r=>r.existingSpecialistReason).length,rows};
const dir='artifacts/review-backlog-20260910';mkdirSync(dir,{recursive:true});const prefix=`${dir}/combined-review-${Date.now()}`;
writeFileSync(prefix+'.json',JSON.stringify(result,null,2),{mode:0o600,flag:'wx'});
const lines=['# ကျန်ရှိသော အကြောင်းအရာများ — AI review ရလဒ်','',`စစ်ဆေးစာရင်း: ${rows.length} ခု။ Snapshot: ${snapshot.capturedAt}.`,'','ဤသည် AI အကြိုစစ်ဆေးချက် ဖြစ်သည်။ လူ့ပညာရှင် အတည်ပြုချက်နှင့် publish လုပ်ပြီးခြင်း မဟုတ်ပါ။ စာသားပြင်လျှင် မူကွဲအသစ်ကို ပြန်စစ်ရန် လိုသည်။','',...Object.entries(counts).map(([k,v])=>`- ${k}: ${v}`),'',`လက်ရှိ clinical review လိုအပ်ချက်ပါသော အကြောင်းအရာ: ${result.existingSpecialistCount} ခု။ အထက်ပါ ရလဒ်များနှင့် ထပ်နေနိုင်သည်။`,'','## တစ်ခုချင်းစီ',''];
for(const r of rows){
 lines.push(`### ${r.slug} — r${r.revision}`,'',`ရလဒ်: ${r.disposition}. ကျန်သော လူ့ပညာရှင် review: ${r.missingHumanReviews.join(', ')}.`,'');
 for(const f of r.findings){
  const detail=f.observation??f.finding??f.issue??f.message??JSON.stringify(f);
  lines.push(`- ${detail}`);
 }
 lines.push('');
}
writeFileSync(prefix+'.md',lines.join('\n'),{mode:0o600,flag:'wx'});
console.log(JSON.stringify({total:result.total,counts,existingSpecialistCount:result.existingSpecialistCount,json:prefix+'.json',markdown:prefix+'.md'},null,2));
