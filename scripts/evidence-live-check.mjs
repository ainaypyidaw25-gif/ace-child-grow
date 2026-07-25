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
 * Exit code 0 = every check that could run passed. 1 = a check failed.
 * A skipped admin layer is NOT a pass; it is reported as skipped and the
 * verdict says so.
 */
import { readFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';
import { ConvexHttpClient } from 'convex/browser';

const JSON_OUT = process.argv.includes('--json');
const results = [];

function record(layer, name, status, detail) {
  results.push({ layer, name, status, detail });
  if (JSON_OUT) return;
  const mark = status === 'pass' ? 'PASS' : status === 'skip' ? 'SKIP' : 'FAIL';
  console.log(`${mark.padEnd(4)}  [${layer}] ${name}${detail ? ` — ${detail}` : ''}`);
}

function check(layer, name, condition, detail) {
  record(layer, name, condition ? 'pass' : 'fail', detail);
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

const NOT_DEPLOYED = /could not find public function/i;

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
    return !NOT_DEPLOYED.test(String(err));
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
    record(L, 'convex/evidence.ts is deployed to this backend', 'fail',
      backendAlive
        ? 'the backend is up but serves no evidence functions — the schema and functions have not been pushed'
        : 'the deployment did not answer at all — check the URL before concluding anything about evidence');
    for (const name of [
      'evidence:list refuses an unauthenticated caller',
      'evidence:stats refuses an unauthenticated caller',
      'evidence:getSource returns nothing to a stranger',
      'evidence:forContent requires authentication',
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
    check(L, 'evidence:list refuses an unauthenticated caller', listed?.allowed === false,
      `allowed=${listed?.allowed}`);
    check(L, 'evidence:list leaks no rows', (listed?.sources?.length ?? -1) === 0 && listed?.total === 0,
      `total=${listed?.total} rows=${listed?.sources?.length}`);
  } catch (err) {
    check(L, 'evidence:list refuses an unauthenticated caller', /not authenticated|staff/i.test(String(err)),
      `threw: ${String(err).slice(0, 120)}`);
  }

  try {
    const s = await client.query('evidence:stats', {});
    check(L, 'evidence:stats refuses an unauthenticated caller', s?.allowed === false, `allowed=${s?.allowed}`);
    check(L, 'evidence:stats leaks no counts', s?.total === 0 && s?.links === 0,
      `total=${s?.total} links=${s?.links}`);
  } catch (err) {
    check(L, 'evidence:stats refuses an unauthenticated caller', /not authenticated|staff/i.test(String(err)),
      `threw: ${String(err).slice(0, 120)}`);
  }

  // Reviewer names and verification notes live on the source record. A stranger
  // must not be able to fetch one by guessing an id.
  try {
    const one = await client.query('evidence:getSource', { sourceId: expect.sampleSourceId });
    check(L, 'evidence:getSource returns nothing to a stranger', one === null, `got ${one === null ? 'null' : 'a row'}`);
  } catch (err) {
    check(L, 'evidence:getSource returns nothing to a stranger', /not authenticated|staff/i.test(String(err)),
      `threw: ${String(err).slice(0, 120)}`);
  }

  // forContent is the one parent-facing lookup, and it is still auth-only:
  // citations are shown inside the app, never to the open internet.
  try {
    const cites = await client.query('evidence:forContent', { slug: expect.sampleSlug });
    const approvedOnly = Array.isArray(cites) && cites.every((c) => c?.reviewStatus === 'approved');
    check(L, 'evidence:forContent returns approved references only', approvedOnly,
      `${Array.isArray(cites) ? cites.length : '?'} returned`);
  } catch (err) {
    check(L, 'evidence:forContent requires authentication', /not authenticated/i.test(String(err)),
      `threw: ${String(err).slice(0, 120)}`);
  }

  // The integrity probe is an internalQuery. If a browser can call it, it was
  // declared with the wrong constructor and live counts are public.
  try {
    await client.query('evidence:integrity', {});
    check(L, 'evidence:integrity is not reachable from a client', false, 'a browser call SUCCEEDED');
  } catch (err) {
    const notPublic = /could not find public function|not a public|internalQuery|no such function/i.test(String(err));
    check(L, 'evidence:integrity is not reachable from a client', notPublic,
      `threw: ${String(err).slice(0, 120)}`);
  }

  return true;
}

// --- layer 2: admin -------------------------------------------------------

function findDeployKey() {
  if (process.env.CONVEX_DEPLOY_KEY) return { key: process.env.CONVEX_DEPLOY_KEY, from: 'CONVEX_DEPLOY_KEY' };
  for (const path of ['/root/.convex_key', `${process.env.HOME ?? ''}/.convex_key`]) {
    if (path && existsSync(path)) {
      const key = readFileSync(path, 'utf8').trim();
      if (key) return { key, from: path };
    }
  }
  return null;
}

function adminLayer(expect) {
  const L = 'admin';
  const found = findDeployKey();
  if (!found) {
    record(L, 'evidence:integrity on the live deployment', 'skip', 'no deploy key available');
    return null;
  }

  let raw;
  try {
    raw = execFileSync('npx', ['convex', 'run', 'evidence:integrity', '{}'], {
      encoding: 'utf8',
      env: { ...process.env, CONVEX_DEPLOY_KEY: found.key },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    check(L, 'evidence:integrity ran against the live deployment', false,
      String(err.stderr ?? err).slice(0, 200));
    return null;
  }

  let live;
  try {
    live = JSON.parse(raw.slice(raw.indexOf('{')));
  } catch {
    check(L, 'evidence:integrity returned parseable output', false, raw.slice(0, 200));
    return null;
  }

  record(L, 'evidence:integrity ran against the live deployment', 'pass', `via ${found.from}`);

  // Indexes: the probe reads through every declared index. A renamed or missing
  // index makes the query throw, so reaching here at all proves they exist;
  // the counts confirm the index actually returns the rows.
  const idx = live.indexProbe ?? {};
  check(L, 'every declared evidence index is live', Object.values(idx).every((n) => typeof n === 'number'),
    JSON.stringify(idx));

  check(L, 'live reference count matches the registry', live.sources === expect.sources,
    `live=${live.sources} local=${expect.sources}`);
  check(L, 'live link count matches the registry', live.links === expect.links,
    `live=${live.links} local=${expect.links}`);
  check(L, 'live linked-slug count matches the registry', live.linkedSlugs === expect.linkedSlugs,
    `live=${live.linkedSlugs} local=${expect.linkedSlugs}`);

  check(L, 'no link names a reference that does not exist', (live.danglingLinks?.length ?? 0) === 0,
    (live.danglingLinks ?? []).join(', ') || 'none');
  check(L, 'no link carries zero references', (live.orphanLinks?.length ?? 0) === 0,
    (live.orphanLinks ?? []).join(', ') || 'none');

  // Requirement 7, checked where it actually matters: on the stored rows.
  check(L, 'no approval lacks a named, qualified reviewer', (live.approvedWithoutReviewer?.length ?? 0) === 0,
    (live.approvedWithoutReviewer ?? []).join(', ') || 'none');

  // Requirement 11: nothing a parent can see may be uncited.
  check(L, 'every published content item has an evidence link', (live.publishedWithoutEvidence?.length ?? 0) === 0,
    (live.publishedWithoutEvidence ?? []).join(', ') || 'none');

  return live;
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
const live = deployed ? adminLayer(expect) : null;
if (!deployed) record('admin', 'evidence:integrity on the live deployment', 'skip', 'evidence module not deployed');

const failed = results.filter((r) => r.status === 'fail');
const skipped = results.filter((r) => r.status === 'skip');
const verdict = !deployed
  ? 'NOT DEPLOYED — the evidence module is not live on this backend'
  : failed.length > 0
    ? 'FAILED'
    : skipped.length > 0
      ? 'PASSED (admin layer skipped)'
      : 'PASSED';

if (JSON_OUT) {
  console.log(JSON.stringify({ url, expect, results, live, verdict }, null, 2));
} else {
  console.log(`\n${results.filter((r) => r.status === 'pass').length} passed, ${failed.length} failed, ${skipped.length} skipped`);
  console.log(`Live integrity: ${verdict}`);
}

process.exit(failed.length > 0 ? 1 : 0);
