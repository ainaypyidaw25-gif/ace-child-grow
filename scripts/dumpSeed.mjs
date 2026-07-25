/**
 * Regenerate convex/seedData.json from the canonical content registries.
 *
 * The single source of truth for the content library is the TypeScript under
 * src/content/seed (assembled and normalised by `seedPayload()`), NOT this
 * JSON. `convex/seedData.json` is a generated snapshot consumed only by the
 * CLI seeding path (convex/seed.ts → `npx convex run seed:run`). The in-app
 * admin importer (src/screens/LibraryAdmin.tsx) calls `seedPayload()` directly,
 * so it is always current; this script keeps the CLI snapshot in step.
 *
 * Why a script and not an inline `node -e`: the registry is TypeScript spread
 * across many modules, so it has to be bundled before Node can import it. Doing
 * that inline in package.json required nested shell quoting that broke on every
 * platform. This mirrors the esbuild-in-memory pattern already used by the
 * scripts/evidence-*.mjs tooling — no new dependency, no shell quoting, and it
 * exits non-zero on any failure so a broken seed can never pass silently.
 *
 * Determinism: array order follows the registry concatenation order and object
 * key order follows the builders in src/content/types.ts, both stable across
 * runs. Serialised with 2-space indent + trailing newline so re-running
 * produces a byte-identical file (no git diff) and single-item changes review
 * cleanly. Nothing environment-specific or secret enters the file: the payload
 * is pure authored content plus a derived `searchText`.
 */
import { mkdtempSync, rmSync, writeFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';

const OUT_PATH = resolve(process.cwd(), 'convex/seedData.json');

/** Bundle the TS seed registry in-memory and return the normalised payload. */
async function loadSeedPayload() {
  const dir = mkdtempSync(join(tmpdir(), 'dump-seed-'));
  const outfile = join(dir, 'seed.mjs');
  try {
    await build({
      stdin: {
        contents: `export { seedPayload } from './src/content/seed/index';`,
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
    if (typeof mod.seedPayload !== 'function') {
      throw new Error('seedPayload export not found in bundled seed registry');
    }
    return mod.seedPayload();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Fail loudly on the invariants the seed importer depends on. */
function assertValid(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('seed payload is empty');
  }
  const slugs = new Set();
  for (const it of items) {
    if (!it || typeof it.slug !== 'string' || it.slug.length === 0) {
      throw new Error('seed item missing a slug');
    }
    if (slugs.has(it.slug)) {
      throw new Error(`duplicate slug in seed payload: ${it.slug}`);
    }
    slugs.add(it.slug);
    if (typeof it.type !== 'string' || typeof it.searchText !== 'string') {
      throw new Error(`seed item ${it.slug} missing required fields`);
    }
  }
}

async function main() {
  const items = await loadSeedPayload();
  assertValid(items);

  writeFileSync(OUT_PATH, `${JSON.stringify(items, null, 2)}\n`, 'utf8');

  const byType = {};
  for (const it of items) byType[it.type] = (byType[it.type] ?? 0) + 1;
  const bytes = statSync(OUT_PATH).size;

  const byTypeStr = Object.keys(byType)
    .sort()
    .map((t) => `${t}=${byType[t]}`)
    .join(' ');
  console.log(`seed:dump — wrote convex/seedData.json`);
  console.log(`  items: ${items.length}  (${byTypeStr})`);
  console.log(`  size:  ${(bytes / 1024).toFixed(1)} KiB`);
}

main().catch((err) => {
  console.error(`seed:dump failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
});
