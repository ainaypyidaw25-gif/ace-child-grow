import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const INPUT = resolve(ROOT, 'convex/seedData.json');
const OUTPUT = resolve(ROOT, 'docs/review/batch-13m-5y-tracker.csv');
const BANDS = new Set(['13_18m', '19_24m', '2y', '2_5y', '3y', '3_5y', '4y', '4_5y', '5y']);
const LABELS = {
  '13_18m': '13–18 months',
  '19_24m': '19–24 months',
  '2y': '2 years',
  '2_5y': '2.5 years',
  '3y': '3 years',
  '3_5y': '3.5 years',
  '4y': '4 years',
  '4_5y': '4.5 years',
  '5y': '5 years',
};
const HEADERS = [
  'content_id', 'age_band', 'content_type', 'english_review_status',
  'native_myanmar_review_status', 'clinical_review_status', 'evidence_status',
  'safety_review_status', 'reviewer', 'review_date', 'notes', 'blocking_issue',
  'publication_eligibility',
];

function csv(value) {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

const items = JSON.parse(readFileSync(INPUT, 'utf8'))
  .filter((item) => BANDS.has(item.ageGroupKey))
  .sort((a, b) => a.ageGroupKey.localeCompare(b.ageGroupKey) || a.type.localeCompare(b.type) || a.slug.localeCompare(b.slug));

const rows = items.map((item) => [
  item.slug,
  LABELS[item.ageGroupKey],
  item.type,
  'not_reviewed',
  'not_reviewed',
  'not_approved',
  'pending_verification',
  'not_reviewed',
  '',
  '',
  'Technical draft only; no reviewer decision recorded.',
  'Native Myanmar, clinical, evidence, and safety reviews pending.',
  'not_eligible',
]);

writeFileSync(OUTPUT, `${[HEADERS, ...rows].map((row) => row.map(csv).join(',')).join('\n')}\n`, 'utf8');
console.log(`review tracker — wrote ${OUTPUT} (${rows.length} content items)`);
