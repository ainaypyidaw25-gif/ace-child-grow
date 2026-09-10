#!/usr/bin/env node
// One gate per invocation. Read-only by default. Never records a human review.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const releaseId = '2026-09-10-early-math-naeyc-ai-preview-v1:lesson:lsn_early_math';
const api = 'aiEarlyMathPublication20260910';
const flags = process.argv.slice(2);
const mode = flags.includes('--stage') ? 'stage' : flags.includes('--enable') ? 'enable' : 'read';
assert.ok(!(flags.includes('--stage') && flags.includes('--enable')), 'Use one gate per invocation');

function run(name, args = {}) {
  try {
    return JSON.parse(execFileSync('npx', ['--no-install', 'convex', 'run', '--prod', name, JSON.stringify(args)], {
      env: { ...process.env, CONVEX_DEPLOYMENT: 'prod:graceful-possum-566' },
      encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
    }));
  } catch {
    throw new Error('Convex call failed or outcome is uncertain; inspect preflight/postflight before retrying. Raw output suppressed.');
  }
}

const before = run(`${api}:preflight`);
if (mode === 'read') {
  console.log(JSON.stringify({ preflight: before, postflight: run(`${api}:postflight`) }, null, 2));
  process.exit(0);
}

const gitCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
assert.match(gitCommit, /^[a-f0-9]{40}$/);
const trackedChanges = execFileSync('git', ['diff', 'HEAD', '--name-only'], { encoding: 'utf8' }).trim();
assert.equal(trackedChanges, '', 'Commit all tracked code before production mutation');
assert.equal(before.phase, mode === 'stage' ? 'ready' : 'staged', 'Exact gate must be ready; do not repeat a completed mutation');
const receiptDir = 'artifacts/early-math-ai-publication-20260910';
mkdirSync(receiptDir, { recursive: true });
const receipt = `${receiptDir}/${Date.now()}-${mode}`;
function save(suffix, value) {
  writeFileSync(`${receipt}-${suffix}.json`, JSON.stringify(value, null, 2), { mode: 0o600, flag: 'wx' });
}
save('before', { gitCommit, preflight: before });
const args = mode === 'stage'
  ? { releaseId, operator: 'owner-authorized Codex AI publication', gitCommit }
  : { releaseId, expectedGeneration: 2, operator: 'owner-authorized Codex AI publication', reason: 'Publish only the independently AI-reviewed early-math lesson with explicit AI disclosure; no human approval asserted.' };
const result = run(`${api}:${mode}`, args);
save('result', result);
const after = run(`${api}:postflight`);
save('after', after);
assert.equal(after.phase, mode === 'stage' ? 'staged' : 'enabled');
assert.equal(after.parentReadable, mode === 'enable');
assert.equal(after.activeReleaseCount, 1);
assert.equal(after.reviewRevision, 11);
assert.equal(after.humanReviewsUnchanged, true);
assert.equal(after.sourceUnchanged, true);
assert.equal(after.linkUnchanged, true);
console.log(JSON.stringify({ mode, gitCommit, result, postflight: after, receipt }, null, 2));
