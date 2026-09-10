// Local-only deterministic compiler. Private input packets are never committed.
// Writes only the public-copy/hash manifest; no network, deployment or mutation.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';
const snapshotPath = 'artifacts/seven-story-preflight-20260910/snapshot-1789021939797.json';
const proposalPath = 'artifacts/story-release-20260910/correction-proposal.json';
const reviewPath = 'artifacts/story-release-20260910/source-review.json';
const desiredCopyPath = 'artifacts/story-release-20260910/desired-reviewed-copy.json';
const independentPath = 'artifacts/story-release-20260910/independent-semantic-review.json';
const raw = readFileSync(snapshotPath), proposalRaw = readFileSync(proposalPath), reviewRaw = readFileSync(reviewPath);
const desiredCopyRaw = readFileSync(desiredCopyPath), independentRaw = readFileSync(independentPath);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(sha(raw), '75d512f5f02975c9291ef0e188eb376fbfed1b61688671b5f8f2878a54c8cc2f');
assert.equal(sha(desiredCopyRaw), '2bbe2f809f9dd77f3bf206a99c06fecdda0c6e46de39fb30b36f74973fe4e45d');
assert.equal(sha(independentRaw), '84f5cca99cf8cf768a8c6fe231801a600f17986166a7743cb6df05f7e9f44158');
// The operator supplies the final independently reviewed artifact hashes; old drafts are not silently accepted.
const [expectedProposalHash, expectedReviewHash] = process.argv.slice(2);
assert.match(expectedProposalHash ?? '', /^[a-f0-9]{64}$/); assert.match(expectedReviewHash ?? '', /^[a-f0-9]{64}$/);
assert.equal(sha(proposalRaw), expectedProposalHash); assert.equal(sha(reviewRaw), expectedReviewHash);
const compiled = await build({ stdin: { contents: `export * from './convex/lib/aiAuditHash';export * from './convex/lib/sevenStoryCorrectionHelpers';export * from './convex/lib/sevenStoryCorrectionScope';`, resolveDir: process.cwd() }, bundle:true, platform:'node', format:'esm', write:false });
const helpers = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const hash = x => sha(helpers.canonicalJson(x)), sorted = helpers.sortedStoryRows;
const snapshot = JSON.parse(raw), proposal = JSON.parse(proposalRaw), review = JSON.parse(reviewRaw);
const desiredCopy = JSON.parse(desiredCopyRaw), independent = JSON.parse(independentRaw);
assert.equal(desiredCopy.proposalSha256,expectedProposalHash);assert.equal(independent.proposalSha256,expectedProposalHash);
assert.equal(snapshot.targets.length, 7); assert.equal(proposal.targets.length, 7); assert.equal(review.targets.length, 7);
for(const packet of [proposal,review,desiredCopy,independent]){assert.equal(packet.targets.length,7);assert.deepEqual(packet.targets.map(t=>t.slug).sort(),[...helpers.SEVEN_STORY_CORRECTION_SLUGS].sort());}
assert.deepEqual(snapshot.targets.map(t => t.content.slug), [...helpers.SEVEN_STORY_CORRECTION_SLUGS]);
const allSources = new Map(snapshot.targets.flatMap(t=>t.sources).map(s=>[s.sourceId,s]));
const targets = snapshot.targets.map(target => {
  const { content,link } = target, p = proposal.targets.find(p=>p.slug===content.slug), r = review.targets.find(r=>r.slug===content.slug);
  assert(p && r); assert.equal(p.revision,2); assert.equal(content.reviewRevision,2); assert.equal(content.clinicalStatus,'clinical_review');
  assert.deepEqual(p.patches,r.patches); assert.equal(r.humanApprovalGranted,false);
  for (const key of ['assignments','batches','batchReceipts','releases','runs','contentAudits','evidenceAudits']) assert.equal(target[key].length,0,`Unexpected ${key}`);
  const patches = p.patches.map(({path,before,after})=>({path,before,after}));
  const desired = helpers.correctedStory(content,patches);
  const reviewed = desiredCopy.targets.find(t=>t.slug===content.slug), independentlyReviewed = independent.targets.find(t=>t.slug===content.slug);
  assert.equal(reviewed.fromRevision,2);assert.equal(reviewed.desiredRevision,3);assert.equal(independentlyReviewed.originalRevision,2);assert.equal(independentlyReviewed.desiredRevision,3);
  const desiredAiSnapshot=helpers.aiContentSnapshot(desired), desiredReviewedCopyHash=hash(desiredAiSnapshot);
  assert.equal(desiredReviewedCopyHash,reviewed.desiredReviewedCopyHash);assert.equal(desiredReviewedCopyHash,independentlyReviewed.desiredContentHash);
  assert.equal(hash(reviewed.desiredReviewedContent),desiredReviewedCopyHash);assert.equal(hash(independentlyReviewed.desiredReviewedContent),desiredReviewedCopyHash);
  assert.equal(independentlyReviewed.disposition,'AI_copy_safety_pass_for_fictional_general_education_only');assert.equal(independentlyReviewed.humanApprovalGranted,false);assert.equal(independentlyReviewed.clinicalApprovalGranted,false);
  // Every story must carry a reviewed, parent-visible fiction preface in both bodies.
  assert(patches.some(p=>p.path==='data.body.en')); assert(patches.some(p=>p.path==='data.body.mm'));
  const desiredSourceIds = p.additionalEvidenceLinkProposal?.after ?? link.sourceIds;
  assert.deepEqual(desiredSourceIds,reviewed.desiredSourceIds);assert.deepEqual(desiredSourceIds,independentlyReviewed.desiredSourceIds);
  if(p.additionalEvidenceLinkProposal){assert.equal(content.slug,'st_sharing_mango');assert.deepEqual(p.additionalEvidenceLinkProposal.before,link.sourceIds);assert.deepEqual(desiredSourceIds,[...link.sourceIds,'hc-choking-prevention-2026']);}
  const sources = desiredSourceIds.map(id=>{assert(allSources.has(id));return allSources.get(id);});
  return { slug:content.slug,contentId:content._id,contentCreationTime:content._creationTime,initialUpdatedAt:content.updatedAt,initialFullHash:hash(content),desiredStableHash:hash(helpers.storyStablePostimage(desired)),desiredReviewedCopyHash,patches,
    linkId:link._id,initialLinkHash:hash(link),linkChanges:!helpers.storyEqual(desiredSourceIds,link.sourceIds),desiredLinkStableHash:hash(helpers.storyStablePostimage({...link,sourceIds:desiredSourceIds})),sourceIds:desiredSourceIds,sourcesFullHash:hash(sorted(sources)),
    reviewsCount:target.reviews.length,reviewsFullHash:hash(sorted(target.reviews)),mediaCount:target.media.length,mediaFullHash:hash(sorted(target.media)) };
});
const descriptors = new Map();
function preserve(table,index,key,rows) {
  const descriptor = {table,index,key,count:rows.length,hash:hash(sorted(rows))};
  const id = `${table}:${index}:${key}`; if(descriptors.has(id))assert.deepEqual(descriptors.get(id),descriptor); else descriptors.set(id,descriptor);
}
preserve('aiPublicationConfig','by_key','global',snapshot.config);
preserve('aiPublicationReleases','by_status','active',snapshot.activeReleases);
for(const t of snapshot.preservedTargets){
  const slug=t.content.slug;
  preserve('libraryContent','by_slug',slug,[t.content]);preserve('evidenceLinks','by_slug',slug,[t.link]);
  preserve('contentReviews','by_content',slug,t.reviews);preserve('libraryMedia','by_content',slug,t.media);
  preserve('clinicalReviewAssignments','by_exact_target',slug,t.assignments);
  preserve('aiPublicationReleases','by_target_key',`${t.content.type}\0${slug}`,t.releases);
  preserve('aiContentAudits','by_content_revision_and_updated_at',slug,t.contentAudits);
  for(const source of [...t.sources,...t.historicalSources])preserve('evidenceSources','by_source_id',source.sourceId,[source]);
  for(const release of t.releases)preserve('aiAuditRuns','by_release_id',release.releaseId,t.runs.filter(r=>r.releaseId===release.releaseId));
  for(const run of t.runs){preserve('aiAuditRuns','by_run_id',run.runId,[run]);preserve('aiContentAudits','by_run_id',run.runId,t.contentAudits.filter(a=>a.runId===run.runId));preserve('aiEvidenceAudits','by_run_id',run.runId,t.evidenceAudits.filter(a=>a.runId===run.runId));}
  for(const batch of t.batches){preserve('clinicalReviewBatches','by_batch_id',batch.batchId,[batch]);preserve('clinicalReviewBatchReceipts','by_batch_id',batch.batchId,t.batchReceipts.filter(r=>r.batchId===batch.batchId));}
}
for(const action of new Set(snapshot.preservationReceipts.map(r=>r.action)))preserve('auditLogs','by_action',action,snapshot.preservationReceipts.filter(r=>r.action===action));
const schedules = snapshot.scheduledExpiries.map(x=>({id:x.scheduled._id,hash:hash(x.scheduled)}));
const output = `// Mechanically compiled from exact private production and AI-review packets. No human approval.\nexport const SEVEN_STORY_RELEASE_ID = '2026-09-10-seven-story-correction-v1' as const;\nexport const SEVEN_STORY_SNAPSHOT_SHA256 = '${sha(raw)}' as const;\nexport const SEVEN_STORY_PROPOSAL_SHA256 = '${expectedProposalHash}' as const;\nexport const SEVEN_STORY_REVIEW_SHA256 = '${expectedReviewHash}' as const;\nexport const SEVEN_STORY_DESIRED_COPY_SHA256 = '${sha(desiredCopyRaw)}' as const;\nexport const SEVEN_STORY_INDEPENDENT_REVIEW_SHA256 = '${sha(independentRaw)}' as const;\nexport const SEVEN_STORY_CAPTURED_AT = ${snapshot.capturedAt};\nexport const SEVEN_STORY_APPLY_BEFORE = ${snapshot.capturedAt+7*86400000};\nexport const SEVEN_STORY_TARGETS = ${JSON.stringify(targets,null,2)} as const;\nexport const SEVEN_STORY_PRESERVATION = ${JSON.stringify([...descriptors.values()],null,2)} as const;\nexport const SEVEN_STORY_SCHEDULES = ${JSON.stringify(schedules,null,2)} as const;\n`;
writeFileSync('convex/lib/sevenStoryCorrectionData.ts',output);
process.stdout.write(`${JSON.stringify({targets:targets.length,patches:targets.reduce((n,t)=>n+t.patches.length,0),preservationQueries:descriptors.size,schedules:schedules.length,manifestSha256:sha(output)},null,2)}\n`);
