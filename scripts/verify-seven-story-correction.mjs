// Independent, local-only full before/after comparison. Never calls Convex.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const slugs = ['st_little_seed','st_ba_ba_sounds','st_when_i_feel_angry','st_taking_turns','st_goodnight_moon_friend','st_visit_to_doctor','st_sharing_mango'];
const cleared = ['reviewerId','reviewerQualification','reviewerDisplayName','reviewScope','reviewedAt','nextReviewAt','reviewNote'];
const allowedPaths = new Set(['source','titleMm','summaryEn','summaryMm','data.body.en','data.body.mm','data.activities.0.en','data.activities.0.mm']);
const sorted = rows => [...rows].sort((a,b)=>String(a._id).localeCompare(String(b._id)));
function replaceExact(row, patch) {
  assert.ok(allowedPaths.has(patch.path),'Disallowed correction path');
  const path = patch.path.split('.');
  assert.ok(path.length && path.every(key => !['__proto__','prototype','constructor'].includes(key)));
  const key = path.pop();
  const parent = path.reduce((value, part) => {
    assert.ok(value && Object.hasOwn(value, part), 'Missing patch parent');
    return value[part];
  },row);
  assert.ok(Object.hasOwn(parent,key));
  assert.deepEqual(parent[key],patch.before,patch.path+' preimage mismatch');
  parent[key]=structuredClone(patch.after);
}
function searchText(row) {
  const strings=[row.titleMm,row.titleEn,row.summaryMm??'',row.summaryEn??'',...row.tags];
  const visit=value=>{
    if(typeof value==='string')strings.push(value);
    else if(Array.isArray(value))value.forEach(visit);
    else if(value&&typeof value==='object')Object.values(value).forEach(visit);
  };
  visit(row.data);
  return strings.join(' ').toLowerCase();
}
export function verifySevenStoryCorrection(before,after,proposal) {
  for(const packet of [before,after])assert.deepEqual(packet.targets.map(t=>t.content.slug).sort(),[...slugs].sort());
  assert.deepEqual(proposal.targets.map(t=>t.slug).sort(),[...slugs].sort());
  for(const key of ['deployment','config','activeReleases','preservedTargets','preservationReceipts','scheduledExpiries']) {
    assert.deepEqual(after[key],before[key],key+' changed');
  }
  const timestamps=new Set();
  const sourceRegistry=new Map();
  for(const target of before.targets)for(const source of target.sources) {
    if(sourceRegistry.has(source.sourceId))assert.deepEqual(sourceRegistry.get(source.sourceId),source);
    sourceRegistry.set(source.sourceId,source);
  }
  const results=[];
  for(const correction of proposal.targets) {
    const initial=before.targets.find(t=>t.content.slug===correction.slug);
    const current=after.targets.find(t=>t.content.slug===correction.slug);
    assert.equal(initial.content.type,'story');
    assert.equal(initial.content.clinicalStatus,'clinical_review');
    assert.equal(initial.content.reviewRevision,2);
    assert.equal(correction.revision,2);
    assert.equal(new Set(correction.patches.map(p=>p.path)).size,correction.patches.length,'Duplicate patch');
    const expected=structuredClone(initial.content);
    for(const patch of correction.patches)replaceExact(expected,patch);
    expected.reviewRevision=3;
    for(const key of cleared)delete expected[key];
    expected.searchText=searchText(expected);
    assert.ok(Number.isFinite(current.content.updatedAt)&&current.content.updatedAt>=before.capturedAt);
    assert.ok(current.content.updatedAt<=after.capturedAt);
    expected.updatedAt=current.content.updatedAt;
    timestamps.add(expected.updatedAt);
    assert.equal(expected.aiPublicationReleaseId,undefined);
    assert.equal(expected.aiPublishedAt,undefined);
    assert.deepEqual(current.content,expected,'Unexpected content change: '+correction.slug);
    const expectedLink=structuredClone(initial.link);
    const linkPatch=correction.additionalEvidenceLinkProposal;
    if(linkPatch) {
      assert.equal(correction.slug,'st_sharing_mango');
      assert.deepEqual(expectedLink.sourceIds,linkPatch.before);
      assert.deepEqual(linkPatch.after,[...linkPatch.before,'hc-choking-prevention-2026']);
      expectedLink.sourceIds=linkPatch.after;
      expectedLink.updatedAt=expected.updatedAt;
    }
    assert.deepEqual(current.link,expectedLink,'Unexpected evidence-link change');
    const expectedSources=expectedLink.sourceIds.map(id=>{
      assert.ok(sourceRegistry.has(id),'Added source missing from exact original snapshot');
      return sourceRegistry.get(id);
    });
    assert.deepEqual(sorted(current.sources),sorted(expectedSources),'Source metadata or approval changed');
    for(const key of ['reviews','media','assignments','batches','batchReceipts','releases','runs','contentAudits','evidenceAudits','historicalSources']) {
      assert.deepEqual(current[key],initial[key],key+' changed for '+correction.slug);
    }
    assert.equal(current.releases.length,0);
    assert.equal(current.assignments.length,0);
    results.push({slug:correction.slug,fromRevision:2,toRevision:3,fields:correction.patches.length,historicalReviewsPreserved:current.reviews.length});
  }
  assert.equal(timestamps.size,1,'Corrections were not atomic');
  return {verified:true,targets:results,humanApprovalsAdded:0,publicationChanges:0,existingAiPreviewsPreserved:3};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  const [beforePath,afterPath,proposalPath]=process.argv.slice(2);
  assert.ok(beforePath&&afterPath&&proposalPath,'Usage: node scripts/verify-seven-story-correction.mjs <before.json> <after.json> <proposal.json>');
  const raw=readFileSync(beforePath,'utf8');
  const proposalRaw=readFileSync(proposalPath,'utf8');
  assert.equal(createHash('sha256').update(raw).digest('hex'),'75d512f5f02975c9291ef0e188eb376fbfed1b61688671b5f8f2878a54c8cc2f','Wrong production baseline');
  assert.equal(createHash('sha256').update(proposalRaw).digest('hex'),'641d34e7f8fa8f9b5ab970c5c7058df6904b8314454969ae0ed9708d1abf362b','Wrong final reviewed proposal');
  console.log(JSON.stringify(verifySevenStoryCorrection(JSON.parse(raw),JSON.parse(readFileSync(afterPath,'utf8')),JSON.parse(proposalRaw)),null,2));
}
