import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';

const SCRIPT = resolve('scripts/generate-13m-5y-review-tracker.mjs');
const HEADERS = [
  'content_id', 'age_band', 'content_type', 'english_review_status',
  'native_myanmar_review_status', 'clinical_review_status', 'evidence_status',
  'safety_review_status', 'reviewer', 'review_date', 'notes', 'blocking_issue',
  'publication_eligibility',
];
const csvLine = (values: string[]) => values.map((value) => `"${value.split('"').join('""')}"`).join(',');

describe('13m–5y review tracker regeneration', () => {
  const directories: string[] = [];
  afterEach(() => directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true })));

  it('preserves reviewed and removed rows, defaults only new IDs, and is deterministic', () => {
    const directory = mkdtempSync(join(tmpdir(), 'ace-review-tracker-'));
    directories.push(directory);
    const seedPath = join(directory, 'seed.json');
    const trackerPath = join(directory, 'tracker.csv');
    writeFileSync(seedPath, JSON.stringify([
      { slug: 'reviewed-active', ageGroupKey: '13_18m', type: 'activity' },
      { slug: 'brand-new', ageGroupKey: '19_24m', type: 'milestone' },
    ]));
    const reviewed = [
      'reviewed-active', '13–18 months', 'activity', 'approved', 'changes_requested',
      'not_approved', 'verified', 'approved', 'Named Reviewer', '2026-07-27',
      'Human note, with comma', 'Clinical review remains pending.', 'not_eligible',
    ];
    const removed = [
      'removed-from-seed', '2 years', 'guide', 'approved', 'approved', 'approved',
      'verified', 'approved', 'Prior Reviewer', '2026-07-01', 'Retained audit row', '', 'eligible',
    ];
    writeFileSync(trackerPath, `${csvLine(HEADERS)}\n${csvLine(reviewed)}\n${csvLine(removed)}\n`);

    const run = () => spawnSync(process.execPath, [SCRIPT, seedPath, trackerPath], { encoding: 'utf8' });
    const first = run();
    expect(first.status, first.stderr).toBe(0);
    const firstOutput = readFileSync(trackerPath, 'utf8');
    expect(firstOutput).toContain(csvLine(reviewed));
    expect(firstOutput).toContain(csvLine(removed));
    expect(firstOutput).toContain(csvLine([
      'brand-new', '19–24 months', 'milestone', 'not_reviewed', 'not_reviewed',
      'not_approved', 'pending_verification', 'not_reviewed', '', '',
      'Technical draft only; no reviewer decision recorded.',
      'Native Myanmar, clinical, evidence, and safety reviews pending.', 'not_eligible',
    ]));

    const second = run();
    expect(second.status, second.stderr).toBe(0);
    expect(readFileSync(trackerPath, 'utf8')).toBe(firstOutput);
  });
});
