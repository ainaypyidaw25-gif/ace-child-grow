#!/usr/bin/env node
/**
 * Evidence Base — live integrity check against a DEPLOYED Convex backend.
 *
 * The Vitest suite proves the registry is internally consistent. It cannot
 * prove that the thing actually serving parents is consistent, because the
 * deployment is a separate artefact that can drift: a schema push that never
 * landed, an import that half-ran, an index that was renamed, a row edited by
 * hand in the dashboard. This script asks the live deployment directly.
 *
 * It runs in two layers, because they need different credentials and prove
 * different things:
 *
 *   LAYER 1 — ANONYMOUS (no credentials, always runs)
 *     Talks to the deployment the way an unauthenticated browser would and
 *     asserts the staff gates hold from the outside. This is the only layer
 *     that can prove a parent cannot reach staff-only evidence administration,
 *     because it is the only layer that is actually a stranger to the backend.
 *
 *   LAYER 2 — ADMIN (needs a deploy key, skipped without one)
 *     Runs `evidence:integrity`, an internalQuery, via the Convex CLI. Internal
 *     functions are not routed to browsers at all, so a deploy key is required
 *     by construction — the live counts, dangling links and unqualified
 *     approvals it returns can never leak to a client.
 *
 * Read-only throughout. It never writes, imports, approves or publishes.
 *
 *   node scripts/evidence-live-check.mjs
 *   node scripts/evidence-live-check.mjs --json
 *
 * ---------------------------------------------------------------------------
 * STATES
 *
 * The script ends in exactly one state, because "did it work" has more than two
 * answers here and collapsing them hides the ones that matter:
 *
 *   not_deployed          the evidence module is absent from this backend
 *   authorization_failure a stranger could read staff-only evidence data
 *   unauthorized          a deploy key was offered and the backend rejected it
 *   unverified            no deploy key at all; the anonymous layer passed and
 *                         the live registry was not inspected
 *   empty_registry        deployed, reachable, and holding zero references
 *   partial_import        holding some references, but fewer than the registry
 *   integrity_failure     live data contradicts itself (dangling, orphan,
 *                         duplicated, uncited-but-published, approved with no
 *                         qualified reviewer)
 *   live_registry_valid   counts match the registry and nothing contradicts
 *
 * EXIT CODES
 *
 * Non-zero is reserved for a real deployment, authorization or integrity
 * failure. In particular:
 *
 *   - Outdated references NEVER fail the run. A 2015 guideline is not wrong
 *     because it is old; it is a scheduling prompt for a human, and a build
 *     that breaks on the passage of time trains people to ignore it.
 *   - Expired reviews and uncited references are advisories for the same
 *     reason: they describe work a reviewer owes, not a broken deployment.
 *   - `unverified` exits 0, because a missing key is a fact about this machine,
 *     not about the deployment. It is reported as unverified, never as passed.
 *   - `unauthorized` exits 1, because someone supplied a key intending the live
 *     layer to run. Exiting 0 there would report a check that never happened.
 */
import { readFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';
import { ConvexHttpClient } from 'convex/browser';
import {
  classifyConvexCommandFailure,
  formatConvexCommandFailure,
  formatConvexOutputFailure,
} from './lib/safe-convex-command-error.mjs';

const JSON_OUT = process.argv.includes('--json');
const results = [];

function record(layer, name, status, detail) {
  results.push({ layer, name, status, detail });
  if (JSON_OUT) return;
  const mark =
    status === 'pass' ? 'PASS' : status === 'skip' ? 'SKIP' : status === 'warn' ? 'NOTE' : 'FAIL';
  console.log(`${mark.padEnd(4)}  [${layer}] ${name}${detail ? ` — ${detail}` : ''}`);
}

function check(layer, name, condition, detail) {
  record(layer, name, condition ? 'pass' : 'fail', detail);
}

/** An observation a human should act on that does not make the deployment wrong. */
function advise(layer, name, clean, detail) {
  record(layer, name, clean ? 'pass' : 'warn', detail);
}

// --- deployment url -------------------------------------------------------

function readConvexUrl() {
  if (process.env.VITE_CONVEX_URL) return process.env.VITE_CONVEX_URL;
  for (const file of ['.env.local', '.env.production', '.env']) {
    if (!existsSync(file)) continue;
    const m = readFileSync(file, 'utf8').match(/^VITE_CONVEX_URL\s*=\s*(.+)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return null;
}

// --- local expectations ---------------------------------------------------
// The registry is TypeScript, so bundle the few values we compare against
// rather than duplicating counts into this script, where they would rot.

async function localExpectations() {
  const dir = mkdtempSync(join(tmpdir(), 'evidence-live-'));
  const outfile = join(dir, 'expect.mjs');
  try {
    await build({
      stdin: {
        contents: `
          export { EVIDENCE_SOURCES } from './src/evidence/sources';
          export { EVIDENCE_LINKS } from './src/evidence/links';
        `,
        resolveDir: process.cwd(),
        loader: 'ts',
      },
      bundle: true,
      format: 'esm',
      platform: 'node',
      outfile,
      logLevel: 'silent',
    });
    const mod = await import(`file://${outfile}`);
    const sources = mod.EVIDENCE_SOURCES;
    const links = mod.EVIDENCE_LINKS;
    return {
      sources: sources.length,
      links: links.length,
      linkedSlugs: new Set(links.map((l) => `${l.kind}:${l.slug}`)).size,
      sampleSourceId: sources[0].id,
      sampleSlug: links[0].slug,
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// --- layer 1: anonymous ---------------------------------------------------

const NOT_DEPLOYED = 'not_deployed';

/**
 * A function that is absent and a function that refuses you both look like a
 * failed call from outside. They mean opposite things: the second is the gate
 * working, the first is the gate not being there at all. Conflating them would
 * let "nothing is deployed" read as "everything is locked down", which is the
 * most dangerous false pass this script could produce — so the module's
 * presence is established first and the two are never mixed.
 */
async function isModuleDeployed(client) {
  try {
    await client.query('evidence:stats', {});
    return true;
  } catch (err) {
    return classifyConvexCommandFailure(err) !== NOT_DEPLOYED;
  }
}

async function anonymousLayer(url, expect) {
  const client = new ConvexHttpClient(url);
  const L = 'anonymous';

  // Establish the backend is up and serving before blaming the evidence module
  // for being absent: a dead deployment and an undeployed module produce the
  // same error at this layer, and only one of them is a push problem.
  let backendAlive = false;
  try {
    await client.query('directory:listPublic', {});
    backendAlive = true;
  } catch {
    backendAlive = false;
  }
  check(L, 'the deployment is reachable and serving functions', backendAlive, url);

  if (!(await isModuleDeployed(client))) {
    record(
      L,
      'convex/evidence.ts is deployed to this backend',
      'fail',
      backendAlive
        ? 'the backend is up but serves no evidence functions — the schema and functions have not been pushed'
        : 'the deployment did not answer at all — check the URL before concluding anything about evidence',
    );
    for (const name of [
      'evidence:list refuses an unauthenticated caller',
      'evidence:stats refuses an unauthenticated caller',
      'evidence:getSource returns nothing to a stranger',
      'evidence:forContent refuses an unauthenticated caller',
      'evidence:integrity is not reachable from a client',
    ]) {
      record(L, name, 'skip', 'cannot be checked until the evidence module is deployed');
    }
    return false;
  }

  record(L, 'convex/evidence.ts is deployed to this backend', 'pass', url);

  // A stranger asking for the registry must be told nothing — not "you are not
  // staff", not a row count, nothing that describes the library's contents.
  try {
    const listed = await client.query('evidence:list', {});
    check(
      L,
      'evidence:list refuses an unauthenticated caller',
      listed?.allowed === false,
      `allowed=${listed?.allowed}`,
    );
    check(
      L,
      'evidence:list leaks no rows',
      (listed?.sources?.length ?? -1) === 0 && listed?.total === 0,
      `total=${listed?.total} rows=${listed?.sources?.length}`,
    );
  } catch (err) {
    check(
      L,
      'evidence:list refuses an unauthenticated caller',
      classifyConvexCommandFailure(err) === 'auth_refused',
      formatConvexCommandFailure(err, {
        operation: 'query:evidence:list',
        command: 'convex-client',
      }),
    );
  }

  try {
    const s = await client.query('evidence:stats', {});
    check(
      L,
      'evidence:stats refuses an unauthenticated caller',
      s?.allowed === false,
      `allowed=${s?.allowed}`,
    );
    check(
      L,
      'evidence:stats leaks no counts',
      s?.total === 0 && s?.links === 0,
      `total=${s?.total} links=${s?.links}`,
    );
  } catch (err) {
    check(
      L,
      'evidence:stats refuses an unauthenticated caller',
      classifyConvexCommandFailure(err) === 'auth_refused',
      formatConvexCommandFailure(err, {
        operation: 'query:evidence:stats',
        command: 'convex-client',
      }),
    );
  }

  // Reviewer names and verification notes live on the source record. A stranger
  // must not be able to fetch one by guessing an id.
  try {
    const one = await client.query('evidence:getSource', { sourceId: expect.sampleSourceId });
    check(
      L,
      'evidence:getSource returns nothing to a stranger',
      one === null,
      `got ${one === null ? 'null' : 'a row'}`,
    );
  } catch (err) {
    check(
      L,
      'evidence:getSource returns nothing to a stranger',
      classifyConvexCommandFailure(err) === 'auth_refused',
      formatConvexCommandFailure(err, {
        operation: 'query:evidence:getSource',
        command: 'convex-client',
      }),
    );
  }

  // forContent is the one parent-facing lookup, and it is still auth-only:
  // citations are shown inside the app, never to the open internet. It answers
  // in the same refusal shape as the rest of the module — { allowed, sources } —
  // rather than throwing, so a refusal is read here as a value, not as an
  // exception. An earlier version of this probe expected a bare array and so
  // could never pass: a correct refusal and a real leak both failed it. That is
  // worth stating, because a check that cannot pass teaches people to ignore it.
  try {
    const cites = await client.query('evidence:forContent', { slug: expect.sampleSlug });
    const sources = Array.isArray(cites?.sources) ? cites.sources : null;
    check(
      L,
      'evidence:forContent refuses an unauthenticated caller',
      cites?.allowed === false,
      `allowed=${cites?.allowed}`,
    );
    check(
      L,
      'evidence:forContent leaks no citations to a stranger',
      sources !== null && sources.length === 0,
      `${sources === null ? 'unexpected shape' : `${sources.length} returned`}`,
    );
    // Belt and braces: whatever it ever returns, an unapproved reference must
    // never be among it. This holds for any caller, so it is asserted here too.
    check(
      L,
      'evidence:forContent never returns an unapproved reference',
      (sources ?? []).every((s) => s?.reviewStatus === 'approved'),
      `${(sources ?? []).filter((s) => s?.reviewStatus !== 'approved').length} unapproved`,
    );
  } catch (err) {
    check(
      L,
      'evidence:forContent refuses an unauthenticated caller',
      classifyConvexCommandFailure(err) === 'auth_refused',
      formatConvexCommandFailure(err, {
        operation: 'query:evidence:forContent',
        command: 'convex-client',
      }),
    );
  }

  // The integrity probe is an internalQuery. Convex currently returns either a
  // specific "not public" message or a generic Server Error for this rejected
  // browser call. Both are safe here: the runtime returned no operator data.
  // The source-level governance test separately pins the declaration to
  // internalQuery, so this live layer is responsible only for proving no value
  // crosses the public boundary.
  try {
    await client.query('evidence:integrity', {});
    check(
      L,
      'evidence:integrity is not reachable from a client',
      false,
      'a browser call SUCCEEDED',
    );
  } catch (err) {
    check(
      L,
      'evidence:integrity returns no operator data to a client',
      true,
      formatConvexCommandFailure(err, {
        operation: 'query:evidence:integrity',
        command: 'convex-client',
      }),
    );
  }

  return true;
}

// --- layer 2: admin -------------------------------------------------------

function findDeployKey() {
  if (process.env.CONVEX_DEPLOY_KEY)
    return { key: process.env.CONVEX_DEPLOY_KEY, from: 'CONVEX_DEPLOY_KEY' };
  for (const path of ['/root/.convex_key', `${process.env.HOME ?? ''}/.convex_key`]) {
    if (path && existsSync(path)) {
      const key = readFileSync(path, 'utf8').trim();
      if (key) return { key, from: path };
    }
  }
  return null;
}

/** Convex's own words for "your credentials are not good enough for this". */
const UNAUTHORIZED = 'unauthorized';

/**
 * @returns {{state: string, live: object|null}} — the admin layer's own state,
 * which the caller folds into the overall verdict. Returning it rather than
 * inferring it from failure counts keeps "the key was rejected" distinct from
 * "the data is wrong", which are different problems for different people.
 */
function adminLayer(expect) {
  const L = 'admin';
  const found = findDeployKey();
  if (!found) {
    record(
      L,
      'evidence:integrity on the live deployment',
      'skip',
      'no deploy key available on this machine',
    );
    return { state: 'unverified', live: null };
  }

  let raw;
  try {
    raw = execFileSync('npx', ['convex', 'run', 'evidence:integrity', '{}'], {
      encoding: 'utf8',
      env: { ...process.env, CONVEX_DEPLOY_KEY: found.key },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    const category = classifyConvexCommandFailure(err);
    const detail = formatConvexCommandFailure(err, { operation: 'run:evidence:integrity' });
    if (category === UNAUTHORIZED) {
      record(L, 'the deploy key is accepted by this deployment', 'fail', detail);
      return { state: 'unauthorized', live: null };
    }
    if (category === 'not_deployed') {
      record(L, 'evidence:integrity exists on this deployment', 'fail', detail);
      return { state: 'not_deployed', live: null };
    }
    check(L, 'evidence:integrity ran against the live deployment', false, detail);
    return { state: 'integrity_failure', live: null };
  }

  let live;
  try {
    live = JSON.parse(raw.slice(raw.indexOf('{')));
  } catch {
    check(
      L,
      'evidence:integrity returned parseable output',
      false,
      formatConvexOutputFailure({ operation: 'run:evidence:integrity' }),
    );
    return { state: 'integrity_failure', live: null };
  }

  record(L, 'evidence:integrity ran against the live deployment', 'pass', `via ${found.from}`);

  // Indexes: the probe reads through every declared index. A renamed or missing
  // index makes the query throw, so reaching here at all proves they exist;
  // the counts confirm the index actually returns the rows.
  const idx = live.indexProbe ?? {};
  check(
    L,
    'every declared evidence index is live',
    Object.values(idx).every((n) => typeof n === 'number'),
    JSON.stringify(idx),
  );

  // An empty table and a half-finished import are both "the counts don't
  // match", but they call for different actions: run the import, versus find
  // out why the import stopped. They are named separately for that reason.
  if (live.sources === 0) {
    record(
      L,
      'the live registry holds references',
      'fail',
      '0 references — the import has not been run',
    );
    reportCounts(L, live, expect);
    return { state: 'empty_registry', live };
  }
  if (
    live.sources < expect.sources
    || (Number.isInteger(live.activeLinks) && live.activeLinks < expect.links)
  ) {
    record(
      L,
      'the live registry holds the whole registry',
      'fail',
      `live ${live.sources}/${expect.sources} references, ${live.activeLinks ?? 'unknown'}/${expect.links} active links — re-run the import`,
    );
    reportCounts(L, live, expect);
    return { state: 'partial_import', live };
  }

  reportCounts(L, live, expect);

  const broken =
    (live.danglingLinks?.length ?? 0) > 0 ||
    (live.orphanLinks?.length ?? 0) > 0 ||
    (live.duplicateIdentifier?.length ?? 0) > 0 ||
    (live.approvedWithoutReviewer?.length ?? 0) > 0 ||
    (live.publishedWithoutEvidence?.length ?? 0) > 0 ||
    !Array.isArray(live.publishedWithoutApprovedEvidence) ||
    (live.publishedWithoutApprovedEvidence?.length ?? 0) > 0 ||
    live.sources !== expect.sources ||
    !Number.isInteger(live.activeLinks) ||
    !Number.isInteger(live.activeLinkedSlugs) ||
    !Array.isArray(live.preservedArchivedLinks) ||
    live.links !== live.activeLinks + (live.preservedArchivedLinks?.length ?? Number.NaN) ||
    live.activeLinks !== expect.links ||
    live.activeLinkedSlugs !== expect.linkedSlugs;

  return { state: broken ? 'integrity_failure' : 'live_registry_valid', live };
}

/** The eleven live counts, each named for what it would mean if it were not zero. */
function reportCounts(L, live, expect) {
  check(
    L,
    'live reference count matches the registry',
    live.sources === expect.sources,
    `live=${live.sources} local=${expect.sources}`,
  );
  check(
    L,
    'live active-link count matches the registry',
    live.activeLinks === expect.links,
    `live=${live.activeLinks ?? 'field missing'} local=${expect.links}; total stored=${live.links}`,
  );
  check(
    L,
    'live active linked-slug count matches the registry',
    live.activeLinkedSlugs === expect.linkedSlugs,
    `live=${live.activeLinkedSlugs ?? 'field missing'} local=${expect.linkedSlugs}`,
  );
  check(
    L,
    'non-active links are preserved only as archived audit history',
    Array.isArray(live.preservedArchivedLinks)
      && live.links === live.activeLinks + live.preservedArchivedLinks.length,
    Array.isArray(live.preservedArchivedLinks)
      ? `${live.preservedArchivedLinks.length}: ${live.preservedArchivedLinks.slice(0, 10).join(', ') || 'none'}`
      : 'field missing — deploy the current evidence integrity probe',
  );

  check(
    L,
    'no link names a reference that does not exist',
    (live.danglingLinks?.length ?? 0) === 0,
    `${live.danglingLinks?.length ?? 0}: ${(live.danglingLinks ?? []).slice(0, 5).join(', ') || 'none'}`,
  );
  check(
    L,
    'no link carries zero references',
    (live.orphanLinks?.length ?? 0) === 0,
    `${live.orphanLinks?.length ?? 0}: ${(live.orphanLinks ?? []).slice(0, 5).join(', ') || 'none'}`,
  );
  check(
    L,
    'no two records describe the same document',
    (live.duplicateIdentifier?.length ?? 0) === 0,
    `${live.duplicateIdentifier?.length ?? 0} identifier collisions`,
  );

  // Requirement 7, checked where it actually matters: on the stored rows.
  check(
    L,
    'no approval lacks a named, qualified reviewer',
    (live.approvedWithoutReviewer?.length ?? 0) === 0,
    `${live.approvedWithoutReviewer?.length ?? 0}: ${(live.approvedWithoutReviewer ?? []).slice(0, 5).join(', ') || 'none'}`,
  );

  // Requirement 11: nothing a parent can see may be uncited.
  check(
    L,
    'every published content item has an evidence link',
    (live.publishedWithoutEvidence?.length ?? 0) === 0,
    `${live.publishedWithoutEvidence?.length ?? 0} of ${live.publishedContent ?? 0} published`,
  );
  check(
    L,
    'every published content item has a parent-visible approved citation',
    Array.isArray(live.publishedWithoutApprovedEvidence)
      && live.publishedWithoutApprovedEvidence.length === 0,
    Array.isArray(live.publishedWithoutApprovedEvidence)
      ? `${live.publishedWithoutApprovedEvidence.length}: ${live.publishedWithoutApprovedEvidence.slice(0, 5).join(', ') || 'none'}`
      : 'field missing — deploy the current evidence integrity probe',
  );

  // --- advisories: work a human owes, not a broken deployment ---
  advise(
    L,
    'every reference is cited by at least one content item',
    (live.unusedSources?.length ?? 0) === 0,
    `${live.unusedSources?.length ?? 0} uncited`,
  );
  advise(
    L,
    'no two records look like the same title and year',
    (live.duplicateTitle?.length ?? 0) === 0,
    `${live.duplicateTitle?.length ?? 0} candidate pairs for a human to judge`,
  );
  advise(
    L,
    'no reference is past its review date',
    (live.expired?.length ?? 0) === 0,
    `${live.expired?.length ?? 0} due for re-review as of ${live.todayIso}`,
  );
  advise(
    L,
    'no reference is old enough to need a newer edition',
    (live.outdated?.length ?? 0) === 0,
    `${live.outdated?.length ?? 0} to check for a newer edition — a scheduling prompt, not a failure`,
  );

  record(
    L,
    'review status of the live registry',
    'pass',
    `approved=${live.approved ?? 0} awaiting=${live.awaitingReview ?? 0} evidence_required=${live.evidenceRequired ?? 0}`,
  );
}

// --- main -----------------------------------------------------------------

const url = readConvexUrl();
if (!url) {
  console.error('No VITE_CONVEX_URL found in the environment or .env files — nothing to check.');
  process.exit(1);
}

const expect = await localExpectations();
if (!JSON_OUT) console.log(`Deployment: ${url}\n`);

const deployed = await anonymousLayer(url, expect);
let admin = { state: 'unverified', live: null };
if (deployed) {
  admin = adminLayer(expect);
} else {
  record(
    'admin',
    'evidence:integrity on the live deployment',
    'skip',
    'evidence module not deployed',
  );
}

const failed = results.filter((r) => r.status === 'fail');
const warned = results.filter((r) => r.status === 'warn');
const skipped = results.filter((r) => r.status === 'skip');
const passed = results.filter((r) => r.status === 'pass');

// An anonymous-layer failure is a stranger reading staff data. It outranks
// everything below it, because no count is worth reporting about a backend that
// hands its registry to the open internet.
const leaked = failed.some((r) => r.layer === 'anonymous') && deployed;

const state = !deployed ? 'not_deployed' : leaked ? 'authorization_failure' : admin.state;

const STATES = {
  not_deployed: {
    exit: 1,
    verdict: 'NOT DEPLOYED — the evidence module is not live on this backend',
  },
  authorization_failure: {
    exit: 1,
    verdict: 'AUTHORIZATION FAILURE — an unauthenticated caller reached staff-only evidence data',
  },
  unauthorized: {
    exit: 1,
    verdict:
      'UNAUTHORIZED — a deploy key was supplied and the deployment rejected it; the live layer did not run',
  },
  unverified: {
    exit: 0,
    verdict:
      'UNVERIFIED — the anonymous layer passed; no deploy key, so the live registry was not inspected',
  },
  empty_registry: {
    exit: 1,
    verdict: 'EMPTY REGISTRY — the module is deployed but holds no references; run the import',
  },
  partial_import: {
    exit: 1,
    verdict:
      'PARTIAL IMPORT — the live registry is incomplete; re-run the import (it is idempotent)',
  },
  integrity_failure: {
    exit: 1,
    verdict: 'INTEGRITY FAILURE — live evidence data contradicts itself',
  },
  live_registry_valid: {
    exit: 0,
    verdict: 'VALID LIVE REGISTRY — live counts match the registry and nothing contradicts',
  },
};

const { exit, verdict } = STATES[state] ?? STATES.integrity_failure;

if (JSON_OUT) {
  console.log(
    JSON.stringify({ url, expect, results, live: admin.live, state, verdict, exit }, null, 2),
  );
} else {
  console.log(
    `\n${passed.length} passed, ${failed.length} failed, ${warned.length} advisories, ${skipped.length} skipped`,
  );
  if (warned.length > 0) {
    console.log('Advisories describe review work owed by a human; they never fail this run.');
  }
  console.log(`State: ${state}`);
  console.log(`Live integrity: ${verdict}`);
}

process.exit(exit);
