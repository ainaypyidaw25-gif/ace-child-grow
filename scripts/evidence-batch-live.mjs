#!/usr/bin/env node
/**
 * Clinical review batch (0–12 months) — verified against the live deployment.
 *
 *   node scripts/evidence-batch-live.mjs
 *
 * evidence-review-pack.mjs builds the reviewer's paperwork from the TypeScript
 * registry in this repository. The running app serves citations from Convex.
 * Those are two different sources of truth, and until they are compared, a
 * reviewer can sign off on a reference list the deployment does not actually
 * hold — which is the one failure a review process is supposed to make
 * impossible.
 *
 * So this loads the batch from the repository, asks the DEPLOYMENT what it
 * holds for the same slugs, and requires them to agree: same content, same
 * references, same review status on every reference.
 *
 * It also checks the two things that decide whether a Myanmar-speaking reviewer
 * can read the pack at all — a Myanmar label on every item and heading, and a
 * Myanmar font embedded rather than assumed to exist on the reader's machine.
 *
 * Read-only. Exit 1 if the paperwork and the deployment disagree.
 */
import { readFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from 'esbuild';
import {
  formatConvexOutputFailure,
  sanitizedConvexCommandError,
} from './lib/safe-convex-command-error.mjs';

const TODAY = process.argv.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a)) ?? '2026-07-25';

let failures = 0;
function check(name, ok, detail) {
  if (!ok) failures += 1;
  console.log(`${(ok ? 'PASS' : 'FAIL').padEnd(4)}  ${name}${detail ? ` — ${detail}` : ''}`);
}
function note(name, detail) {
  console.log(`      ${name}${detail ? ` — ${detail}` : ''}`);
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

async function loadBatch() {
  const dir = mkdtempSync(join(tmpdir(), 'batch-live-'));
  const outfile = join(dir, 'batch.mjs');
  try {
    await build({
      stdin: {
        contents: `export { buildReviewBatch, REVIEWER_CHECKLIST } from './src/evidence/reviewBatch';`,
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
    return { batch: mod.buildReviewBatch(TODAY), checklist: mod.REVIEWER_CHECKLIST };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const key = findDeployKey();
if (!key) {
  console.error('No deploy key found — set CONVEX_DEPLOY_KEY or write /root/.convex_key.');
  process.exit(1);
}

const { batch, checklist } = await loadBatch();
const p = batch.progress;

console.log(`Batch ${batch.batchId} as of ${batch.generatedOn}\n`);

// --- 1. the batch itself --------------------------------------------------
check(
  'the batch covers ages 0–12 months',
  batch.ageRangeMonths.max === 12,
  `0–${batch.ageRangeMonths.max}m`,
);
check('the batch holds items to review', p.total > 0, `${p.total} items`);
const expectedAnswers = p.total * checklist.length;
check(
  'every item carries a full checklist',
  p.checklistAnswers === expectedAnswers,
  `${p.checklistAnswers} responses = ${p.total} items × ${checklist.length} dimensions`,
);
note(
  'reviewable now / blocked / with advisories',
  `${p.reviewableNow} / ${p.blocked} / ${p.withAdvisories}`,
);
note('references cited by this batch', `${p.distinctReferences} distinct`);
note(
  'reference status in the pack',
  `approved ${p.referencesApproved}, awaiting ${p.referencesAwaiting}, evidence_required ${p.referencesEvidenceRequired}, expired ${p.expiredReferences}, outdated ${p.outdatedReferences}`,
);
check('nothing in this batch is published yet', p.published === 0, `${p.published} published`);

// --- 2. bilingual labels --------------------------------------------------
//
// A reviewer working in Myanmar cannot review what they cannot read. Missing is
// a failure; identical-to-English is reported separately, because for an
// acronym like WHO repeating it is honest and inventing a translation is not.
const mm = /[က-႟ꩠ-ꩿ]/;
const noMm = batch.items.filter((i) => !i.titleMm?.trim());
check('every item has a Myanmar title', noMm.length === 0, `${noMm.length} missing`);
const noMmAge = batch.items.filter((i) => !i.ageGroupLabelMm?.trim());
check(
  'every item has a Myanmar age-group label',
  noMmAge.length === 0,
  `${noMmAge.length} missing`,
);
const noMmDomain = batch.items.filter((i) => i.domainKey && !i.domainLabelMm?.trim());
check(
  'every item with a domain has a Myanmar domain label',
  noMmDomain.length === 0,
  `${noMmDomain.length} missing`,
);
const allGroups = Object.values(batch.groups).flat();
const noMmGroup = allGroups.filter((g) => !g.labelMm?.trim());
check(
  'every grouping heading has a Myanmar label',
  noMmGroup.length === 0,
  `${noMmGroup.length} missing`,
);
const noMmChecklist = checklist.filter((d) => !d.labelMm?.trim() || !d.promptMm?.trim());
check(
  'every checklist dimension is bilingual',
  noMmChecklist.length === 0,
  `${noMmChecklist.length} incomplete`,
);
const untranslated = allGroups.filter((g) => g.labelMm === g.label && !mm.test(g.labelMm));
note(
  'headings that repeat the English rather than invent a translation',
  `${untranslated.length} (acronyms and organisation names: ${untranslated
    .slice(0, 4)
    .map((g) => g.label)
    .join(', ')}${untranslated.length > 4 ? '…' : ''})`,
);
const realMm = batch.items.filter((i) => mm.test(i.titleMm ?? ''));
check(
  'the Myanmar titles are in Myanmar script',
  realMm.length === batch.items.length,
  `${realMm.length}/${batch.items.length}`,
);

// --- 3. the embedded Myanmar font ----------------------------------------
//
// A PDF or a printed checklist that relies on the reader's machine having a
// Myanmar font renders as boxes on the machines most likely to be used for
// this review. The font has to travel with the document.
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
check(
  'a Myanmar font ships as a dependency rather than being assumed',
  Boolean(pkg.dependencies?.['@fontsource/noto-sans-myanmar']),
  pkg.dependencies?.['@fontsource/noto-sans-myanmar'] ?? 'absent',
);
const fontDir = 'node_modules/@fontsource/noto-sans-myanmar';
check('the font is actually installed, not merely declared', existsSync(fontDir), fontDir);
// Declaring the family in CSS is not shipping it. This looks for the import
// that puts the font files in the bundle.
const fontEntry = ['src/main.tsx', 'src/index.css', 'src/App.tsx'].filter((f) => existsSync(f));
const fontImported = fontEntry.filter((f) =>
  /@fontsource\/noto-sans-myanmar/.test(readFileSync(f, 'utf8')),
);
check(
  'the app bundles the Myanmar font rather than naming it and hoping',
  fontImported.length > 0,
  fontImported.join(', ') || 'no @fontsource import in the app entry',
);

/** grep exits 1 when it matches nothing, which is an answer, not a crash. */
function grepFiles(pattern, path) {
  try {
    return execFileSync('grep', ['-rl', pattern, path], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch {
    return [];
  }
}
// The PDF pipeline is asked as one thing, not file by file: the entry script
// delegates to the renderer, and it is the renderer that must embed the font.
// Requiring every file to mention it would fail the entry point for doing its
// job properly.
const pdfFontHits = ['scripts/pdf', 'scripts/generate-report-pdf.mjs']
  .filter((f) => existsSync(f))
  .flatMap((f) => grepFiles('noto-sans-myanmar\\|NotoSansMyanmar', f));
check(
  'the monthly-report PDF embeds the Myanmar font',
  pdfFontHits.length > 0,
  pdfFontHits.join(', ') || 'no font embedded anywhere in the PDF pipeline',
);

// --- 4. the deployment agrees with the paperwork -------------------------
const slugs = batch.items.map((i) => i.slug);
const live = run('evidence:batchSnapshot', { slugs }, key);

check(
  'the deployment holds a citation link for every item in the batch',
  live?.missingSlugs?.length === 0,
  `${live?.linkedSlugs}/${live?.requestedSlugs} linked${live?.missingSlugs?.length ? `, missing: ${live.missingSlugs.slice(0, 5).join(', ')}` : ''}`,
);

const liveById = new Map((live?.sources ?? []).map((s) => [s.sourceId, s]));
const packRefs = new Map();
for (const item of batch.items) for (const r of item.references) packRefs.set(r.id, r);

const absent = [...packRefs.keys()].filter((id) => !liveById.has(id));
check(
  'every reference the reviewer will read exists in the deployment',
  absent.length === 0,
  `${packRefs.size} cited, ${absent.length} absent${absent.length ? `: ${absent.slice(0, 5).join(', ')}` : ''}`,
);

const drifted = [...packRefs.entries()].filter(
  ([id, r]) => liveById.has(id) && liveById.get(id).reviewStatus !== r.reviewStatus,
);
check(
  'the review status in the pack matches the deployment on every reference',
  drifted.length === 0,
  drifted.length
    ? drifted
        .slice(0, 5)
        .map(([id, r]) => `${id}: pack ${r.reviewStatus} vs live ${liveById.get(id).reviewStatus}`)
        .join('; ')
    : 'no drift',
);

const titleDrift = [...packRefs.entries()].filter(
  ([id, r]) => liveById.has(id) && liveById.get(id).title !== r.title,
);
check(
  'the reference titles match the deployment',
  titleDrift.length === 0,
  `${titleDrift.length} differ`,
);

const liveApproved = (live?.sources ?? []).filter((s) => s.reviewStatus === 'approved');
check(
  'no reference behind this batch is approved without a named, qualified reviewer',
  liveApproved.every((s) => s.reviewer?.trim() && s.reviewerQualification?.trim()),
  `${liveApproved.length} approved live`,
);

const liveStatus = {};
for (const s of live?.sources ?? [])
  liveStatus[s.reviewStatus] = (liveStatus[s.reviewStatus] ?? 0) + 1;
note('live review status across this batch', JSON.stringify(liveStatus));

console.log(
  `\n${failures === 0 ? 'THE PACK AND THE DEPLOYMENT AGREE' : `${failures} CHECK(S) FAILED`}`,
);
console.log('Read-only: nothing was written, approved or published.');
process.exit(failures === 0 ? 0 : 1);
