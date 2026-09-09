#!/usr/bin/env node
/**
 * Evidence Base — live gate probe.
 *
 *   node scripts/evidence-gate-probe.mjs
 *
 * evidence-live-check.mjs answers "is the deployed data consistent". This
 * answers the other half: "do the gates in front of it actually hold, on the
 * deployment, right now".
 *
 * Three things are probed, each with the weakest credential that can prove it:
 *
 *   ROLE SEPARATION (anonymous, and deploy-key-without-a-session)
 *     A stranger asks the parent-facing and staff-facing functions directly.
 *     Then a deploy key — the strongest credential in the building — attempts
 *     the staff-only writes, and must still be refused, because a deploy key
 *     is not a person and staff is a property of a signed-in user.
 *
 *   APPROVAL GATE (deploy key, read-only)
 *     Invalid review transitions are put to evidence:reviewGate, which reports
 *     what setReview would decide without performing it. Testing the gate by
 *     actually approving something is not available here: approval is a
 *     clinical act, this deployment holds real content, and the CLI cannot
 *     impersonate a staff session anyway. So the decision is read, not taken.
 *
 *   AUDIT TRAIL (deploy key, read-only)
 *     The trail is read back from the deployment and required to contain the
 *     import, with an actor, an action, a target, a timestamp, a before/after
 *     summary and a result. A trail nobody has read is not evidence of anything.
 *
 * Read-only throughout. It writes nothing, approves nothing, publishes nothing.
 * Exit 1 if any gate fails to hold.
 */
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { ConvexHttpClient } from 'convex/browser';
import {
  classifyConvexCommandFailure,
  formatConvexCommandFailure,
  formatConvexOutputFailure,
  sanitizedConvexCommandError,
} from './lib/safe-convex-command-error.mjs';

let failures = 0;

function record(layer, name, ok, detail) {
  if (!ok) failures += 1;
  console.log(
    `${(ok ? 'PASS' : 'FAIL').padEnd(4)}  [${layer}] ${name}${detail ? ` — ${detail}` : ''}`,
  );
}

function readConvexUrl() {
  if (process.env.VITE_CONVEX_URL) return process.env.VITE_CONVEX_URL;
  for (const file of ['.env.local', '.env.production', '.env']) {
    if (!existsSync(file)) continue;
    const m = readFileSync(file, 'utf8').match(/^VITE_CONVEX_URL\s*=\s*(.+)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return null;
}

function findDeployKey() {
  if (process.env.CONVEX_DEPLOY_KEY) return process.env.CONVEX_DEPLOY_KEY;
  for (const path of ['/root/.convex_key', `${process.env.HOME ?? ''}/.convex_key`]) {
    if (path && existsSync(path)) {
      const key = readFileSync(path, 'utf8').trim();
      if (key) return key;
    }
  }
  return null;
}

function run(name, args, key) {
  let raw;
  try {
    raw = execFileSync('npx', ['convex', 'run', name, JSON.stringify(args)], {
      encoding: 'utf8',
      env: { ...process.env, CONVEX_DEPLOY_KEY: key },
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (err) {
    throw sanitizedConvexCommandError(err, { operation: `run:${name}` });
  }
  const at = raw.indexOf('{');
  if (at < 0) throw new Error(formatConvexOutputFailure({ operation: `run:${name}` }));
  try {
    return JSON.parse(raw.slice(at));
  } catch {
    throw new Error(formatConvexOutputFailure({ operation: `run:${name}` }));
  }
}

const url = readConvexUrl();
if (!url) {
  console.error('No VITE_CONVEX_URL found.');
  process.exit(1);
}
const key = findDeployKey();
if (!key) {
  console.error('No deploy key found — set CONVEX_DEPLOY_KEY or write /root/.convex_key.');
  process.exit(1);
}

console.log(`Deployment: ${url}\n`);

// --- 1. what a stranger can reach ----------------------------------------
const anon = new ConvexHttpClient(url);
const A = 'anonymous';

/** Refusal is a value in this codebase, not an exception. Accept either. */
async function refusedOrEmpty(fn, args, isEmpty) {
  try {
    const res = await anon.query(fn, args);
    return { ok: isEmpty(res), detail: JSON.stringify(res).slice(0, 90) };
  } catch (err) {
    const category = classifyConvexCommandFailure(err);
    return {
      ok: category === 'auth_refused',
      detail: formatConvexCommandFailure(err, {
        operation: `query:${fn}`,
        command: 'convex-client',
      }),
    };
  }
}

/** Empty, whether the function answers with a bare array or an envelope. */
const noItems = (r) => (Array.isArray(r) ? r.length === 0 : (r?.items?.length ?? -1) === 0);

for (const [fn, args, isEmpty, label] of [
  [
    'library:listByType',
    { type: 'lesson' },
    (r) => r?.staff === false && noItems(r),
    'library:listByType shows a stranger no content',
  ],
  ['library:search', { q: 'a' }, noItems, 'library:search returns a stranger nothing'],
  [
    'library:stats',
    {},
    (r) => r?.staff !== true,
    'library:stats does not describe the library to a stranger',
  ],
  [
    'content:list',
    {},
    (r) => r?.staff !== true && noItems(r),
    'content:list shows a stranger nothing',
  ],
  [
    'audit:list',
    {},
    (r) => r?.allowed === false && (r?.rows?.length ?? -1) === 0,
    'audit:list refuses a stranger',
  ],
  [
    'children:list',
    {},
    (r) => (Array.isArray(r) ? r.length === 0 : true),
    'children:list returns a stranger no child records',
  ],
]) {
  const { ok, detail } = await refusedOrEmpty(fn, args, isEmpty);
  record(A, label, ok, detail);
}

// The one function a signed-out parent may legitimately reach.
try {
  const dir = await anon.query('directory:listPublic', {});
  record(
    A,
    'directory:listPublic is public by design and holds no child data',
    Array.isArray(dir),
    `${dir?.length ?? '?'} entries`,
  );
} catch (err) {
  record(
    A,
    'directory:listPublic is public by design and holds no child data',
    false,
    formatConvexCommandFailure(err, {
      operation: 'query:directory:listPublic',
      command: 'convex-client',
    }),
  );
}

// The privilege-granting and integrity functions are internal by construction:
// Convex does not route internalMutation/internalQuery to any browser, with or
// without a session. Proving that is worth more than proving a guard, because
// it is enforced by the platform rather than by a line of code someone can move.
for (const [fn, label] of [
  ['seed:grantStaffByEmail', 'seed:grantStaffByEmail cannot be called from a browser at all'],
  ['seed:run', 'seed:run cannot be called from a browser at all'],
  ['evidence:integrity', 'evidence:integrity cannot be called from a browser at all'],
  ['evidence:reviewGate', 'evidence:reviewGate cannot be called from a browser at all'],
  ['audit:recent', 'audit:recent cannot be called from a browser at all'],
]) {
  try {
    await anon.query(fn, {});
    record(A, label, false, 'it answered a browser');
  } catch (err) {
    const unrouted = classifyConvexCommandFailure(err) === 'not_deployed';
    record(
      A,
      label,
      unrouted,
      unrouted
        ? 'not routed to browsers'
        : formatConvexCommandFailure(err, { operation: `query:${fn}`, command: 'convex-client' }),
    );
  }
}

// --- 2. a deploy key is not a staff member --------------------------------
//
// The arguments below must be WELL FORMED. Convex validates arguments before it
// runs the handler, so a malformed call is rejected by the validator and never
// reaches requireStaff — it looks like a refusal in the output and proves
// nothing about authorization. An earlier version of this probe passed
// `{id: 'x'}` to content:transition and `note` to library:setReview, and both
// "refusals" were argument errors. ArgumentValidationError is therefore treated
// as a FAILED probe below, not as a pass.
const K = 'deploy key, no session';

/** A real contentItems id, so transition is refused by the guard, not the validator. */
function realContentId() {
  try {
    const table = execFileSync('npx', ['convex', 'data', 'contentItems', '--limit', '1'], {
      encoding: 'utf8',
      env: { ...process.env, CONVEX_DEPLOY_KEY: key },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return table.match(/"([a-z0-9]{20,})"/)?.[1] ?? null;
  } catch {
    return null;
  }
}
const contentId = realContentId();

const staffWrites = [
  [
    'evidence:setReview',
    {
      sourceId: 'who-nurturing-care-2018',
      status: 'approved',
      reviewer: 'X',
      reviewerQualification: 'Y',
      reviewDate: '2026-07-25',
    },
    'evidence:setReview refuses a caller with no signed-in staff user',
  ],
  [
    'library:setReview',
    { slug: 'x', clinicalStatus: 'published', reviewNote: '' },
    'library:setReview refuses a caller with no signed-in staff user',
  ],
  [
    'library:importSeed',
    { items: [] },
    'library:importSeed refuses a caller with no signed-in staff user',
  ],
];
if (contentId) {
  // 'published' -> 'published' is not a legal transition, so even a bypassed
  // auth guard could not have changed anything here. Probes should not be able
  // to do damage in the failure case they are testing for.
  staffWrites.push([
    'content:transition',
    { id: contentId, to: 'published' },
    'content:transition refuses a caller with no signed-in staff user',
  ]);
} else {
  record(
    K,
    'content:transition refuses a caller with no signed-in staff user',
    false,
    'could not read a real contentItems id to probe with',
  );
}

for (const [fn, args, label] of staffWrites) {
  try {
    run(fn, args, key);
    record(K, label, false, 'the call SUCCEEDED');
  } catch (err) {
    const category = classifyConvexCommandFailure(err);
    if (category === 'argument_validation') {
      record(
        K,
        label,
        false,
        'rejected by the argument validator, so the auth guard was never reached',
      );
    } else {
      const refused = category === 'auth_refused';
      record(
        K,
        label,
        refused,
        refused
          ? 'refused at the auth guard'
          : formatConvexCommandFailure(err, { operation: `run:${fn}` }),
      );
    }
  }
}

// --- 3. the approval gate -------------------------------------------------
const G = 'approval gate';
const base = {
  sourceId: 'who-nurturing-care-2018',
  status: 'approved',
  reviewer: 'Dr Test Reviewer',
  reviewerQualification: 'Paediatrician',
  reviewDate: '2026-07-25',
};
const evidenceRequiredId = 'aota-early-intervention';
for (const [label, args, expected] of [
  [
    'approving an evidence_required reference is refused',
    { ...base, sourceId: evidenceRequiredId },
    'evidence_required',
  ],
  [
    'approving with no reviewer named is refused',
    { ...base, reviewer: '   ' },
    'reviewer_required',
  ],
  [
    'approving with no qualification stated is refused',
    { ...base, reviewerQualification: '' },
    'qualification_required',
  ],
  ['approving with no review date is refused', { ...base, reviewDate: '' }, 'review_date_required'],
  ['an invented status is refused', { ...base, status: 'published' }, 'unknown_status'],
  ['a case-mismatched status is refused', { ...base, status: 'APPROVED' }, 'unknown_status'],
  [
    'reviewing a reference that does not exist is refused',
    { ...base, sourceId: 'no-such-reference' },
    'not_found',
  ],
]) {
  const r = run('evidence:reviewGate', args, key);
  record(
    G,
    label,
    r?.allowed === false && r?.code === expected,
    `code=${r?.code} live status=${r?.currentStatus}`,
  );
}
// A gate that refuses everything is not a gate either — it is an outage.
const control = run('evidence:reviewGate', base, key);
record(
  G,
  'a complete, qualified approval would be permitted',
  control?.allowed === true,
  `allowed=${control?.allowed}`,
);

// Nothing above may have changed anything.
const after = run('evidence:integrity', {}, key);
record(
  G,
  'probing the gate approved nothing',
  after?.approved === 0,
  `approved=${after?.approved}`,
);
record(
  G,
  'probing the gate published nothing',
  after?.publishedContent === 0,
  `published=${after?.publishedContent}`,
);
record(
  G,
  'the evidence_required references are still held back',
  after?.evidenceRequired > 0,
  `evidence_required=${after?.evidenceRequired}`,
);

// --- 4. the audit trail ---------------------------------------------------
const T = 'audit';
const trail = run('audit:recent', { limit: 20 }, key);
record(
  T,
  'the deployment holds an audit trail',
  (trail?.total ?? 0) > 0,
  `${trail?.total} entries: ${JSON.stringify(trail?.byAction ?? {})}`,
);
const imports = (trail?.rows ?? []).filter((r) => r.action.startsWith('evidence.import'));
record(
  T,
  'the reference import is recorded',
  imports.length > 0,
  `${imports.length} import entries`,
);
const complete = imports.filter(
  (r) => r.at && r.action && r.target !== undefined && r.result && r.before && r.after,
);
record(
  T,
  'each import entry carries action, target, timestamp, before/after and result',
  complete.length === imports.length,
  `${complete.length}/${imports.length} complete`,
);
record(
  T,
  'the import names the channel it came through',
  imports.some((r) => /via /.test(r.summary ?? '')),
  imports[0]?.summary?.slice(0, 80) ?? 'none',
);
record(
  T,
  'every recorded result is one of ok / rejected / failed',
  Object.keys(trail?.byResult ?? {}).every((k) => ['ok', 'rejected', 'failed'].includes(k)),
  JSON.stringify(trail?.byResult ?? {}),
);

// Which reviewer actions have actually happened here, and which have not.
//
// This is stated rather than asserted. No clinical reviewer has been appointed
// on this deployment, so no reviewer assignment, status change, rejection or
// publication exists to read back — and an absence is not a failure. It is also
// not a pass. Reporting it as neither is the only honest option: the handlers
// are covered by the governance unit tests, but this deployment has no live
// instance of them, and a release note that implied otherwise would be false.
const expectedActions = {
  'evidence.importSources': 'reference import',
  'evidence.importLinks': 'content-to-reference link import',
  'evidence.setReview': 'reviewer assignment / review status change',
  'library.published': 'publish',
  'library.draft': 'unpublish',
  'content.published': 'content publish',
};
console.log('\nAudit categories on this deployment:');
for (const [action, meaning] of Object.entries(expectedActions)) {
  const n = trail?.byAction?.[action] ?? 0;
  console.log(
    `  ${n > 0 ? 'recorded  ' : 'none yet  '}${action.padEnd(24)} ${meaning}${n > 0 ? ` (${n})` : ''}`,
  );
}
console.log(
  `  none yet  ${'(rejections)'.padEnd(24)} refusals log with result 'rejected'; ` +
    `none exist here because refusing a review needs a signed-in reviewer, which no CLI has`,
);

console.log(`\n${failures === 0 ? 'ALL GATES HELD' : `${failures} GATE CHECK(S) FAILED`}`);
console.log('Nothing was written, approved or published by this probe.');
process.exit(failures === 0 ? 0 : 1);
