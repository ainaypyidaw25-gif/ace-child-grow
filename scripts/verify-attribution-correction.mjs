// Local-only independent before/after verification. Never invokes a mutation.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const [beforePath, afterPath] = process.argv.slice(2);
if (!beforePath || !afterPath) throw new Error('Usage: node scripts/verify-attribution-correction.mjs <before.json> <after.json>');
const before=JSON.parse(readFileSync(beforePath,'utf8'));
const after=JSON.parse(readFileSync(afterPath,'utf8'));
const proposal=JSON.parse(readFileSync(fileURLToPath(new URL('../docs/operations/learning-source-attribution-proposals-2026-09-10.json',import.meta.url)),'utf8'));
const expectedSlugs=proposal.targets.map(t=>t.slug).sort();
const cleared=['reviewerId','reviewerQualification','reviewerDisplayName','reviewScope','reviewedAt','nextReviewAt','reviewNote'];
for (const packet of [before,after]) {
  assert.deepEqual(packet.targets.map(t=>t.content.slug).sort(),expectedSlugs);
}
const results=[];
for (const correction of proposal.targets) {
  const initial=before.targets.find(t=>t.content.slug===correction.slug);
  const current=after.targets.find(t=>t.content.slug===correction.slug);
  assert.equal(initial.content.data.evidenceSummary,correction.before);
  assert.equal(current.content.data.evidenceSummary,correction.after);
  assert.equal(current.content.reviewRevision,(initial.content.reviewRevision??initial.content.version)+1);
  assert.equal(initial.content.clinicalStatus,'clinical_review');
  assert.equal(current.content.clinicalStatus,'clinical_review');
  assert.ok(current.content.updatedAt>initial.content.updatedAt);
  for (const field of cleared) assert.equal(current.content[field],undefined,field);
  assert.equal(current.content.aiPublicationReleaseId,undefined);
  assert.equal(current.content.aiPublishedAt,undefined);
  const normalized=structuredClone(current.content);
  normalized.data.evidenceSummary=initial.content.data.evidenceSummary;
  for (const field of ['reviewRevision','updatedAt','searchText',...cleared]) {
    delete normalized[field];
    if (Object.hasOwn(initial.content,field)) normalized[field]=initial.content[field];
  }
  assert.deepEqual(normalized,initial.content,'Unexpected content-field change');
  for (const field of ['link','sources','reviews','media','assignments','batches']) {
    const sorted=value=>Array.isArray(value)?[...value].sort((a,b)=>String(a._id).localeCompare(String(b._id))):value;
    assert.deepEqual(sorted(current[field]),sorted(initial[field]),field+' changed');
  }
  assert.match(current.content.searchText,/aap healthychildren/);
  assert.doesNotMatch(current.content.searchText,/health canada|canadian/);
  results.push({slug:correction.slug,from:initial.content.reviewRevision??initial.content.version,to:current.content.reviewRevision,historicalReviewsUnchanged:current.reviews.length,unpublished:true});
}
assert.equal(new Set(after.targets.map(t=>t.content.updatedAt)).size,1,'Expected atomic timestamp');
console.log(JSON.stringify({verified:true,targets:results,humanApprovalsAdded:0,publicationChanges:0},null,2));
