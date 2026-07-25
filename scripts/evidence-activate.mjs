#!/usr/bin/env node
/**
 * Evidence Base — one-command activation of a Convex deployment.
 *
 *   node scripts/evidence-activate.mjs            # deploy, import, verify
 *   node scripts/evidence-activate.mjs --dry-run  # say what it would do
 *   node scripts/evidence-activate.mjs --verify   # verify only, change nothing
 *
 * Activation is three steps that are only meaningful together: push the schema
 * and functions, import the reference registry, then ask the live deployment
 * what it actually holds. Doing them by hand invites the failure this whole
 * evidence base exists to prevent — a half-finished import that nobody notices
 * because the counts were never read back.
 *
 * SAFETY
 *   - Additive only. It pushes schema and functions and imports references.
 *     It never resets data, never deletes a row, never approves and never
 *     publishes. Approval is a human act performed through the admin screen.
 *   - Idempotent. Re-running is expected and safe; the import distinguishes
 *     created / updated / unchanged / skipped / failed so a second run visibly
 *     changes nothing.
 *   - It refuses to act on a deployment other than the one the frontend is
 *     configured against, so a key for the wrong project cannot quietly
 *     activate the wrong backend.
 *
 * Requires a Convex deploy key in CONVEX_DEPLOY_KEY or /root/.convex_key.
 * Delete the key file when activation is done, and revoke the key.
 */
import { readFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';

const DRY_RUN = process.argv.includes('--dry-run');
const VERIFY_ONLY = process.argv.includes('--verify');

/** Records per import call. The whole registry fits in one; see importBatched. */
const BATCH = 250;

function say(line = '') {
  console.log(line);
}

function fail(line) {
  console.error(`\n✖ ${line}`);
  process.exit(1);
}

// --- credentials ----------------------------------------------------------

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

function readConvexUrl() {
  if (process.env.VITE_CONVEX_URL) return process.env.VITE_CONVEX_URL;
  for (const file of ['.env.local', '.env.production', '.env']) {
    if (!existsSync(file)) continue;
    const m = readFileSync(file, 'utf8').match(/^VITE_CONVEX_URL\s*=\s*(.+)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return null;
}

/**
 * A Convex deploy key names its deployment before the '|'. Comparing it with
 * the URL the frontend is built against is the difference between activating
 * this project and activating whatever project the key happened to come from.
 * The key itself is never printed.
 */
function deploymentOf(key) {
  const head = key.split('|')[0] ?? '';
  const name = head.includes(':') ? head.slice(head.indexOf(':') + 1) : head;
  return name.trim();
}

// --- payload --------------------------------------------------------------

async function loadRegistry() {
  const dir = mkdtempSync(join(tmpdir(), 'evidence-activate-'));
  const outfile = join(dir, 'registry.mjs');
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
    return { sources: mod.EVIDENCE_SOURCES, links: mod.EVIDENCE_LINKS };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Only the fields the import validator accepts, in the shape it expects. */
function sourcePayload(s) {
  return {
    id: s.id,
    org: s.org,
    orgKey: s.orgKey,
    title: s.title,
    authors: s.authors ?? null,
    year: s.year ?? null,
    edition: s.edition ?? null,
    country: s.country ?? null,
    language: s.language,
    url: s.url,
    doi: s.doi ?? null,
    isbn: s.isbn ?? null,
    pmid: s.pmid ?? null,
    evidenceLevel: s.evidenceLevel,
    reviewStatus: s.reviewStatus,
    reviewer: s.reviewer ?? null,
    reviewDate: s.reviewDate ?? null,
    nextReviewDate: s.nextReviewDate ?? null,
    keywords: s.keywords ?? [],
    topics: s.topics ?? [],
    ageMonthsMin: s.ageMonthsMin ?? null,
    ageMonthsMax: s.ageMonthsMax ?? null,
    verifiedOn: s.verifiedOn ?? null,
    verifiedNote: s.verifiedNote ?? '',
  };
}

// --- convex cli -----------------------------------------------------------

function convex(args, key, { input } = {}) {
  return execFileSync('npx', ['convex', ...args], {
    encoding: 'utf8',
    env: { ...process.env, CONVEX_DEPLOY_KEY: key },
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
    input,
  });
}

/**
 * `convex run` takes its arguments as one JSON positional and prints logs
 * before the result, so the value is read from the first brace onwards.
 */
function runFunction(name, argsObject, key) {
  const raw = convex(['run', name, JSON.stringify(argsObject)], key);
  const at = raw.indexOf('{');
  if (at < 0) return { raw, value: null };
  return { raw, value: JSON.parse(raw.slice(at)) };
}

/**
 * Import in batches. One 90-record payload fits comfortably, but a registry
 * that grows would hit an argument-length limit as a confusing CLI error
 * rather than as an obvious "too big", and a batch that fails names the batch.
 */
function importBatched(name, key, items, wrap, batchSize) {
  const totals = { created: 0, updated: 0, unchanged: 0, skipped: 0, failed: 0, failedIds: [] };
  for (let i = 0; i < items.length; i += batchSize) {
    const slice = items.slice(i, i + batchSize);
    const res = runFunction(name, wrap(slice), key).value;
    totals.created += res.created;
    totals.updated += res.updated;
    totals.unchanged += res.unchanged;
    totals.skipped += res.skipped;
    totals.failed += res.failed;
    totals.failedIds.push(...(res.failedIds ?? res.failedKeys ?? []));
  }
  return totals;
}

// --- main -----------------------------------------------------------------

const url = readConvexUrl();
if (!url) fail('No VITE_CONVEX_URL found — there is no deployment to activate.');

const found = findDeployKey();
if (!found) {
  fail(
    'No Convex deploy key found.\n' +
      '  Set CONVEX_DEPLOY_KEY, or write the key to /root/.convex_key.\n' +
      '  Convex dashboard → Settings → Deploy keys. Delete the file and revoke the key afterwards.',
  );
}

const urlName = new URL(url).hostname.split('.')[0];
const keyName = deploymentOf(found.key);
say(`Deployment (frontend): ${urlName}`);
say(`Deployment (key):      ${keyName || '(not stated in the key)'}`);
if (keyName && !keyName.includes(urlName)) {
  fail(
    `The deploy key targets "${keyName}" but the app is configured against "${urlName}".\n` +
      '  Activating the wrong backend is not something to discover afterwards. Nothing was changed.',
  );
}

const registry = await loadRegistry();
say(`Registry:              ${registry.sources.length} references, ${registry.links.length} links`);
say('');

if (DRY_RUN) {
  say('--dry-run: would deploy schema + functions, then import the registry, then verify.');
  say('Nothing was changed.');
  process.exit(0);
}

// 1 — schema and functions
if (!VERIFY_ONLY) {
  say('1/3  Deploying schema and functions…');
  try {
    convex(['deploy', '--yes'], found.key);
    say('     done.');
  } catch (err) {
    fail(`convex deploy failed:\n${String(err.stderr ?? err).slice(0, 1200)}`);
  }
} else {
  say('1/3  skipped (--verify)');
}

// 2 — the registry itself
let sourceResult = null;
let linkResult = null;
if (!VERIFY_ONLY) {
  say('2/3  Importing the reference registry (idempotent)…');
  try {
    sourceResult = importBatched(
      'evidence:importSourcesFromCli',
      found.key,
      registry.sources.map(sourcePayload),
      (slice) => ({ sources: slice }),
      BATCH,
    );
    say(
      `     references: created ${sourceResult.created}, updated ${sourceResult.updated}, ` +
        `unchanged ${sourceResult.unchanged}, skipped ${sourceResult.skipped}, failed ${sourceResult.failed}`,
    );
    if (sourceResult.failed > 0) say(`     failed ids: ${sourceResult.failedIds.join(', ')}`);
  } catch (err) {
    fail(`the reference import failed:\n${String(err.stderr ?? err).slice(0, 1200)}`);
  }

  try {
    linkResult = importBatched(
      'evidence:importLinksFromCli',
      found.key,
      registry.links.map((l) => ({ kind: l.kind, slug: l.slug, sourceIds: l.sourceIds })),
      (slice) => ({ links: slice }),
      BATCH,
    );
    say(
      `     links:      created ${linkResult.created}, updated ${linkResult.updated}, ` +
        `unchanged ${linkResult.unchanged}, skipped ${linkResult.skipped}, failed ${linkResult.failed}`,
    );
    if (linkResult.failed > 0) say(`     failed keys: ${linkResult.failedKeys.join(', ')}`);
  } catch (err) {
    fail(`the link import failed:\n${String(err.stderr ?? err).slice(0, 1200)}`);
  }
} else {
  say('2/3  skipped (--verify)');
}

// 3 — read back what is actually there
say('3/3  Reading the live registry back…');
let live;
try {
  live = runFunction('evidence:integrity', {}, found.key).value;
} catch (err) {
  fail(`evidence:integrity failed:\n${String(err.stderr ?? err).slice(0, 1200)}`);
}

const row = (label, value) => say(`  ${String(label).padEnd(34)} ${value}`);
say('');
say('LIVE COUNTS (queried from the deployment, not assumed)');
row('references', live.sources);
row('links', live.links);
row('linked slugs', live.linkedSlugs);
row('orphan links', live.orphanLinks.length);
row('dangling links', live.danglingLinks.length);
row('duplicate identifiers', live.duplicateIdentifier.length);
row('duplicate titles (candidates)', live.duplicateTitle.length);
row('uncited references', live.unusedSources.length);
row('expired (review overdue)', live.expired.length);
row('outdated (newer edition due)', live.outdated.length);
row('evidence_required', live.evidenceRequired);
row('awaiting_review', live.awaitingReview);
row('approved', live.approved);
row('approved without a qualified reviewer', live.approvedWithoutReviewer.length);
row('published content', live.publishedContent);
row('published without evidence', live.publishedWithoutEvidence.length);
say('');
say('Nothing was approved or published by this script. Approval is a human act');
say('performed by a named, qualified reviewer through the admin screen.');
say('');
say('Now run:  npm run evidence:live');
