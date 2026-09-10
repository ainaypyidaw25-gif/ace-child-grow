#!/usr/bin/env node
// Exact two-story production gates. Read-only unless one explicit flag is given.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const releaseRoot = '2026-09-10-two-stories-ai-preview-v1';
const api = 'aiTwoStoriesPublication20260910';
const flags = process.argv.slice(2);
assert.ok(flags.length <= 1 && flags.every((flag) => ['--stage', '--activate'].includes(flag)), 'Use no flags, --stage or --activate; one gate per invocation');
const mode = flags[0]?.slice(2) ?? 'read';
function run(name, args = {}) {
  try {
    return JSON.parse(execFileSync('npx', ['--no-install', 'convex', 'run', '--prod', name, JSON.stringify(args)], {
      env: { ...process.env, CONVEX_DEPLOYMENT: 'prod:graceful-possum-566' },
      encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
    }));
  } catch {
    throw new Error('Convex call failed or outcome is uncertain; run read-only preflight/postflight before any retry. Raw output suppressed.');
  }
}
const before = run(`${api}:preflight`);
if (mode === 'read') {
  console.log(JSON.stringify({ preflight: before, postflight: run(`${api}:postflight`) }, null, 2));
  process.exit(0);
}
const gitCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
assert.match(gitCommit, /^[a-f0-9]{40}$/);
assert.equal(execFileSync('git', ['diff', 'HEAD', '--name-only'], { encoding: 'utf8' }).trim(), '', 'Commit tracked code before production mutation');
assert.equal(before.phase, mode === 'stage' ? 'ready' : 'staged', 'Exact gate must be ready; do not repeat a completed mutation');
assert.equal(before.generation, 3); assert.equal(before.mathUnchanged, true); assert.equal(before.mathReadable, true);
const receiptDir = 'artifacts/two-stories-20260910';
mkdirSync(receiptDir, { recursive: true });
const receipt = `${receiptDir}/${Date.now()}-${mode}`;
const save = (suffix, value) => writeFileSync(`${receipt}-${suffix}.json`, JSON.stringify(value, null, 2), { mode: 0o600, flag: 'wx' });
save('before', { gitCommit, preflight: before });
const args = mode === 'stage'
  ? { releaseRoot, operator: 'owner-authorized Codex AI publication', gitCommit }
  : { releaseRoot, expectedGeneration: 3, operator: 'owner-authorized Codex AI publication' };
const result = run(`${api}:${mode}`, args);
save('result', result);
const after = run(`${api}:postflight`);
save('after', after);
assert.equal(after.phase, mode === 'stage' ? 'staged' : 'enabled');
assert.equal(after.activeReleaseCount, mode === 'stage' ? 1 : 3);
assert.equal(after.generation, 3);
for (const flag of ['mathUnchanged', 'mathReadable', 'humanReviewsUnchanged', 'oldSourcesUnchanged', 'predecessorsUnchanged']) assert.equal(after[flag], true);
assert.deepEqual(after.targets.map((row) => row.slug), ['st_waiting_at_clinic', 'st_first_day_school']);
for (const target of after.targets) { assert.equal(target.revision, 3); assert.equal(target.parentReadable, mode === 'activate'); }
console.log(JSON.stringify({ mode, gitCommit, result, postflight: after, receipt }, null, 2));
