#!/usr/bin/env node
// One-source/one-link replacement through the existing audited importers.
// Default is read-only; --apply is explicit. This never approves or publishes.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { build } from 'esbuild';

const OLD = 'us-hhs-head-start-elof-2015';
const NEXT = 'naeyc-nurturing-early-math-play-2022';
const TARGET = 'lsn_early_math';
const apply = process.argv.includes('--apply');
const query = `export default query({args:{},handler:async(ctx)=>{
  const links=await ctx.db.query('evidenceLinks').take(501);
  if(links.length>500) throw new Error('link bound exceeded');
  const sources=await Promise.all(['${OLD}','${NEXT}'].map(sourceId=>ctx.db.query('evidenceSources').withIndex('by_source_id',q=>q.eq('sourceId',sourceId)).take(2)));
  const content=await ctx.db.query('libraryContent').withIndex('by_slug',q=>q.eq('slug','${TARGET}')).take(2);
  const reviews=await ctx.db.query('contentReviews').withIndex('by_content',q=>q.eq('contentSlug','${TARGET}')).take(101);
  if(reviews.length>100) throw new Error('review bound exceeded');
  return {old:sources[0],next:sources[1],content,reviews,
    targetLinks:links.filter(l=>l.slug==='${TARGET}'),
    otherLinks:links.filter(l=>l.slug!=='${TARGET}'),
    config:await ctx.db.query('aiPublicationConfig').take(2),
    active:await ctx.db.query('aiPublicationReleases').withIndex('by_status',q=>q.eq('status','active')).take(4)};
}});`;

function run(args) {
  try {
    return JSON.parse(execFileSync('npx', ['--no-install', 'convex', 'run', '--prod', ...args], {
      env: { ...process.env, CONVEX_DEPLOYMENT: 'prod:graceful-possum-566' },
      encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
    }));
  } catch {
    throw new Error('Convex call failed; raw command output suppressed. Check state before retrying.');
  }
}
const snapshot = () => run(['--inline-query', query]);
const compiled = await build({
  stdin: { contents: "export { SOURCE_BY_ID } from './src/evidence/sources.ts';", resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, format: 'esm', platform: 'node', write: false,
});
const { SOURCE_BY_ID } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const source = SOURCE_BY_ID.get(NEXT);
assert.equal(source.year, 2022);
assert.equal(source.reviewStatus, 'awaiting_review');
assert.equal(source.reviewer, null);
assert.equal(source.reviewDate, null);

const before = snapshot();
assert.equal(before.old.length, 1);
assert.equal(before.content.length, 1);
assert.equal(before.targetLinks.length, 1);
assert.equal(before.active.length, 0);
assert.equal(before.config.length, 1);
assert.equal(before.config[0].enabled, false);
assert.equal(before.config[0].generation, 2);
const content = before.content[0];
const link = before.targetLinks[0];
assert.equal(content._id, 'kx79fjkkjq7r7s23q2rcjgq5ed8b97q6');
assert.equal(content.clinicalStatus, 'clinical_review');
assert.equal(content.aiPublicationReleaseId, undefined);
assert.equal(content.aiPublishedAt, undefined);
assert.equal(link._id, 'k9714x2taxc2cjtq9vhc6171d18b90tr');
assert.equal(link.kind, 'lesson');

if (link.sourceIds.length === 1 && link.sourceIds[0] === NEXT) {
  assert.equal(before.next.length, 1);
  console.log(JSON.stringify({ status: 'already_replaced', sourceStatus: before.next[0].reviewStatus, reviewRevision: content.reviewRevision, mutated: false }));
  process.exit(0);
}
assert.deepEqual(link.sourceIds, [OLD]);
assert.equal(link.updatedAt, 1787120210772);
assert.equal(content.reviewRevision, 9);
assert.equal(content.updatedAt, 1787120210772);
assert.equal(before.old[0].reviewStatus, 'awaiting_review');
assert.equal(before.old[0].updatedAt, 1789000050676);
assert.equal(before.next.length, 0);

if (!apply) {
  console.log(JSON.stringify({ status: 'ready', deployment: 'graceful-possum-566', target: TARGET, old: OLD, next: NEXT, reviewRevision: 9, nextReviewRevision: 10, mutation: 'one new unapproved source; one link; one review invalidation', humanApproval: false, publication: false }, null, 2));
  process.exit(0);
}

mkdirSync('artifacts/early-math-source-20260910', { recursive: true });
const receiptPath = `artifacts/early-math-source-20260910/${Date.now()}`;
writeFileSync(`${receiptPath}-before.json`, JSON.stringify(before, null, 2), { mode: 0o600, flag: 'wx' });
const importedSource = run(['evidence:importSourcesFromCli', JSON.stringify({ sources: [source] })]);
assert.equal(importedSource.created, 1);
assert.equal(importedSource.failed, 0);
assert.equal(importedSource.updated, 0);
assert.equal(importedSource.skipped, 0);
const ready = snapshot();
assert.deepEqual(ready.old, before.old);
assert.deepEqual(ready.content, before.content);
assert.deepEqual(ready.targetLinks, before.targetLinks);
assert.deepEqual(ready.otherLinks, before.otherLinks);
assert.deepEqual(ready.config, before.config);
assert.equal(ready.active.length, 0);
assert.equal(ready.next.length, 1);
assert.equal(ready.next[0].reviewStatus, 'awaiting_review');
const importedLink = run(['evidence:importLinksFromCli', JSON.stringify({ links: [{ kind: 'lesson', slug: TARGET, sourceIds: [NEXT] }] })]);
assert.equal(importedLink.updated, 1);
assert.equal(importedLink.failed, 0);
assert.equal(importedLink.skipped, 0);
assert.deepEqual(importedLink.invalidatedContentKeys, [`lesson:${TARGET}`]);
const after = snapshot();
writeFileSync(`${receiptPath}-after.json`, JSON.stringify({ importedSource, importedLink, after }, null, 2), { mode: 0o600, flag: 'wx' });
assert.deepEqual(after.old, before.old);
assert.deepEqual(after.otherLinks, before.otherLinks);
assert.deepEqual(after.reviews, before.reviews);
assert.deepEqual(after.config, before.config);
assert.equal(after.active.length, 0);
assert.deepEqual(after.next, ready.next);
assert.deepEqual(after.targetLinks[0].sourceIds, [NEXT]);
assert.equal(after.content[0].reviewRevision, 10);
assert.equal(after.content[0].clinicalStatus, 'clinical_review');
assert.deepEqual(after.content[0].data, content.data);
assert.equal(after.content[0].aiPublicationReleaseId, undefined);
assert.equal(after.content[0].reviewerId, undefined);
console.log(JSON.stringify({ status: 'replaced', deployment: 'graceful-possum-566', target: TARGET, sourceId: NEXT, sourceStatus: 'awaiting_review', reviewRevision: 10, humanApproval: false, publication: false, receiptPath }, null, 2));
