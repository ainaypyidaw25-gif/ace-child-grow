import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const INPUT = resolve(ROOT, process.argv[2] ?? 'convex/seedData.json');
const OUTPUT = resolve(ROOT, process.argv[3] ?? 'docs/review/batch-13m-5y-tracker.csv');
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

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        value += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(value);
      value = '';
    } else if (character === '\n') {
      row.push(value);
      if (row.some((field) => field !== '')) rows.push(row);
      row = [];
      value = '';
    } else if (character !== '\r') {
      value += character;
    }
  }
  if (value !== '' || row.length > 0) {
    row.push(value);
    rows.push(row);
  }
  if (quoted) throw new Error('Existing review tracker contains an unterminated quoted field');
  return rows;
}

function existingRowsById() {
  try {
    const [header, ...rows] = parseCsv(readFileSync(OUTPUT, 'utf8'));
    if (!header || header.join('\u0000') !== HEADERS.join('\u0000')) {
      throw new Error('Existing review tracker header does not match the required governance schema');
    }
    return new Map(rows.filter((row) => row.length === HEADERS.length).map((row) => [row[0], row]));
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return new Map();
    throw error;
  }
}

const items = JSON.parse(readFileSync(INPUT, 'utf8'))
  .filter((item) => BANDS.has(item.ageGroupKey))
  .sort((a, b) => a.ageGroupKey.localeCompare(b.ageGroupKey) || a.type.localeCompare(b.type) || a.slug.localeCompare(b.slug));

const previous = existingRowsById();
const activeIds = new Set(items.map((item) => item.slug));
const rows = items.map((item) => previous.get(item.slug) ?? [
  item.slug, LABELS[item.ageGroupKey], item.type,
  'not_reviewed', 'not_reviewed', 'not_approved', 'pending_verification', 'not_reviewed',
  '', '', 'Technical draft only; no reviewer decision recorded.',
  'Native Myanmar, clinical, evidence, and safety reviews pending.', 'not_eligible',
]);

// Keep removed rows at the end, unchanged, as an audit trail. Deleting a seed
// item must never silently delete the human decisions already recorded for it.
const removedRows = [...previous.entries()]
  .filter(([contentId]) => !activeIds.has(contentId))
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([, row]) => row);

writeFileSync(OUTPUT, `${[HEADERS, ...rows, ...removedRows].map((row) => row.map(csv).join(',')).join('\n')}\n`, 'utf8');
console.log(`review tracker — wrote ${OUTPUT} (${rows.length} active, ${removedRows.length} retained audit rows)`);
