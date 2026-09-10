import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const script = fileURLToPath(new URL('./assemble-review-backlog.mjs', import.meta.url));
const hash = value => createHash('sha256').update(value).digest('hex');
const serialize = value => JSON.stringify(value, null, 2);

function fixture() {
  const targets = ['one', 'two', 'three'].map(slug => {
    const content = { slug, type: 'guide', reviewRevision: 2, data: { text: `Original ${slug}` } };
    return {
      gate: { slug, type: 'guide', revision: 2, retired: false, missing: ['safety'], specialistReason: null },
      content, contentHash: hash(JSON.stringify(content)),
      links: [{ kind: 'guide', slug, sourceIds: ['official-source'] }],
      sources: [{ sourceId: 'official-source', title: 'Original source', year: 2026 }],
    };
  });
  const snapshot = { capturedAt: '2026-09-10T00:00:00Z', targets };
  const digest = hash(serialize(snapshot));
  const reports = targets.map((target, index) => ({
    // Both supported packet binding names must work.
    [index === 1 ? 'snapshotSha256' : 'packetSha256']: digest,
    targets: [{ slug: target.gate.slug, revision: 2, contentHash: target.contentHash,
      disposition: 'AI_preparatory_pass', humanApproval: false,
      publicationAuthorizedByThisArtifact: false, findings: [{ observation: 'Synthetic fixture only.' }] }],
  }));
  return { snapshot, reports };
}

function rebindReports(f) {
  const digest = hash(serialize(f.snapshot));
  for (const report of f.reports) {
    if ('packetSha256' in report) report.packetSha256 = digest;
    else report.snapshotSha256 = digest;
  }
}

function runFixture(f, check) {
  // Only synthetic files inside this newly allocated directory are created/deleted.
  const directory = mkdtempSync(join(tmpdir(), 'ace-review-assembly-test-'));
  try {
    const snapshotPath = join(directory, 'snapshot.json');
    writeFileSync(snapshotPath, serialize(f.snapshot), { mode: 0o600 });
    const reports = f.reports.map((report, index) => {
      const path = join(directory, `report-${index}.json`);
      writeFileSync(path, serialize(report), { mode: 0o600 });
      return path;
    });
    const result = spawnSync(process.execPath, [script, snapshotPath, ...reports], {
      cwd: directory, encoding: 'utf8', timeout: 10000,
    });
    check(result, directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function rejected(f, pattern) {
  runFixture(f, (result, directory) => {
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, pattern);
    assert.equal(existsSync(join(directory, 'artifacts')), false, 'Failure must precede artifact writes');
  });
}

test('accepts exactly bound complete reports without human approval', () => {
  runFixture(fixture(), (result, directory) => {
    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.equal(output.total, 3);
    const combined = JSON.parse(readFileSync(resolve(directory, output.json), 'utf8'));
    assert.equal(combined.rows.length, 3);
    for (const row of combined.rows) {
      assert.equal(row.approved, false);
      assert.deepEqual(row.missingHumanReviews, ['safety']);
    }
    const markdown = readFileSync(resolve(directory, output.markdown), 'utf8');
    assert.ok(markdown.includes('\n'));
    assert.equal(markdown.includes('\\n'), false);
  });
});

test('rejects changed content even when reports are rebound to changed packet', () => {
  const f = fixture();
  f.snapshot.targets[0].content.data.text = 'Changed after review';
  rebindReports(f); // Isolates the recomputed per-content hash check.
  rejected(f, /Changed snapshot content/);
});

test('rejects altered source links or source metadata against original report binding', () => {
  let f = fixture();
  f.snapshot.targets[0].links[0].sourceIds = ['different-source'];
  rejected(f, /snapshot\/source binding mismatch/);
  f = fixture();
  f.snapshot.targets[0].sources[0].year = 2015;
  rejected(f, /snapshot\/source binding mismatch/);
});

test('rejects missing rows, duplicate reviews and duplicate snapshot targets', () => {
  let f = fixture();
  f.reports[2].targets = [];
  rejected(f, /Incomplete AI review coverage/);
  f = fixture();
  f.reports[1].targets = structuredClone(f.reports[0].targets);
  rejected(f, /Duplicate review/);
  f = fixture();
  f.snapshot.targets.push(structuredClone(f.snapshot.targets[0]));
  rebindReports(f);
  rejected(f, /Duplicate snapshot targets/);
});

test('rejects identity, revision, retirement and approval assertions', () => {
  for (const [key, value, message] of [
    ['slug', 'different', /Snapshot slug mismatch/],
    ['type', 'story', /Snapshot type mismatch/],
    ['reviewRevision', 3, /Snapshot revision mismatch/],
  ]) {
    const f = fixture();
    f.snapshot.targets[0].content[key] = value;
    rebindReports(f);
    rejected(f, message);
  }
  let f = fixture();
  f.snapshot.targets[0].gate.retired = true;
  rebindReports(f);
  rejected(f, /Retired target/);
  f = fixture();
  f.reports[0].targets[0].humanApproval = true;
  rejected(f, /must not assert human approval/);
});
