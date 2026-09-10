// Local-only regression of the exact inline-query comparison emitted by capture.
// Does not run the capture script or contact any service.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const source = readFileSync(new URL('./capture-seven-stories-publication.mjs', import.meta.url), 'utf8');
const comparison = source.match(/^const canonical=.*\nconst equal=.*$/m)?.[0];
assert(comparison, 'Exact inline-query comparison must be present');
assert(source.includes("equal(row.args,[m.identity]),'new expiry state'"), 'Scheduler gate must use tested comparison');
const equal = runInNewContext(`${comparison}\nequal;`);
const identity = { releaseRoot: 'exact-root', artifactHash: 'artifact-hash', snapshotSha256: 'snapshot-hash' };

test('accepts Convex scheduler object-key reordering', () => {
  const scheduled = [{ artifactHash: identity.artifactHash, releaseRoot: identity.releaseRoot, snapshotSha256: identity.snapshotSha256 }];
  assert.notEqual(JSON.stringify(scheduled), JSON.stringify([identity]));
  assert.equal(equal(scheduled, [identity]), true);
});
test('preserves nested object equivalence without relaxing array order', () => {
  assert.equal(equal([{ b: { y: 2, x: 1 }, a: 3 }], [{ a: 3, b: { x: 1, y: 2 } }]), true);
  assert.equal(equal([identity, 'extra'], ['extra', identity]), false);
});
for (const key of Object.keys(identity)) {
  test(`rejects changed exact identity field ${key}`, () => {
    assert.equal(equal([{ ...identity, [key]: 'different' }], [identity]), false);
  });
}
test('rejects missing, additional or duplicate scheduler arguments', () => {
  const { artifactHash: _omitted, ...missing } = identity;
  assert.equal(equal([missing], [identity]), false);
  assert.equal(equal([{ ...identity, unexpected: true }], [identity]), false);
  assert.equal(equal([identity, identity], [identity]), false);
  assert.equal(equal([], [identity]), false);
  assert.equal(equal(null, [identity]), false);
});
