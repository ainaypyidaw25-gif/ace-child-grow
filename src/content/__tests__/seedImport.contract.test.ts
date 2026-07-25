import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CONTENT_SEED, seedPayload } from '../seed';

// Seed generation + import-safety contract.
//
// Two concerns are guarded here:
//   1. The generated artifact `convex/seedData.json` (consumed by the CLI path
//      convex/seed.ts → `seed:run`) must stay in step with the canonical
//      TypeScript registry. A stale artifact is exactly the release blocker this
//      test exists to make impossible to reintroduce silently.
//   2. The import is idempotent and non-destructive. There is no offline Convex
//      harness in this repo (the deployment is exercised by the scripts/*.mjs
//      live checks), so the upsert CONTRACT that convex/library.ts:importSeed
//      and convex/seed.ts:run implement is modelled here against a minimal fake
//      database and asserted. The model is kept faithful to those two files.

// The exact top-level fields convex/library.ts:seedItemValidator accepts. The
// payload must carry these and only these — a stray field would be rejected by
// the Convex validator at import time, and a runtime-only field must never be
// serialised into the seed.
const IMPORTER_FIELDS = new Set([
  'type', 'slug', 'ageGroupKey', 'domainKey', 'category', 'titleMm', 'titleEn',
  'summaryMm', 'summaryEn', 'tags', 'difficulty', 'durationMinutes', 'offline',
  'source', 'version', 'clinicalStatus', 'data', 'media', 'searchText',
]);

describe('seed generation', () => {
  it('has unique slugs across the whole payload', () => {
    const slugs = seedPayload().map((i) => i.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('serialises only importer-accepted top-level fields (no runtime-only fields)', () => {
    for (const item of seedPayload()) {
      for (const key of Object.keys(item)) {
        expect(IMPORTER_FIELDS.has(key), `${item.slug} has unexpected field "${key}"`).toBe(true);
      }
    }
  });

  it('is JSON-safe and stable: two serialisations are byte-identical', () => {
    const a = JSON.stringify(seedPayload());
    const b = JSON.stringify(seedPayload());
    expect(a).toBe(b);
    // Round-trips without loss (no functions / undefined leaking through).
    expect(JSON.parse(a)).toEqual(seedPayload());
  });

  it('committed convex/seedData.json matches a fresh dump (guards against staleness)', () => {
    const onDisk = JSON.parse(readFileSync('convex/seedData.json', 'utf8'));
    expect(onDisk).toEqual(JSON.parse(JSON.stringify(seedPayload())));
    // The count is derived, not asserted as a magic number: the artifact must
    // hold exactly what the registry produces.
    expect(onDisk.length).toBe(CONTENT_SEED.length);
  });
});

// --- Idempotent upsert model ------------------------------------------------
// Faithful in-memory model of the loop shared by convex/library.ts:importSeed
// and convex/seed.ts:run: upsert by slug, patch preserves the human review
// decision, insert clamps 'published' -> 'clinical_review', media is refreshed
// per slug, and nothing is ever deleted from content or from unrelated tables.

type Row = Record<string, unknown> & { _id: string; slug: string };
type MediaRow = { _id: string; contentSlug: string; kind: string };

class FakeDb {
  libraryContent: Row[] = [];
  libraryMedia: MediaRow[] = [];
  children: Row[] = []; // an unrelated user-data table, to prove it is untouched
  private seq = 0;

  private id() {
    this.seq += 1;
    return `id_${this.seq}`;
  }

  findBySlug(slug: string) {
    return this.libraryContent.find((r) => r.slug === slug);
  }

  insertContent(doc: Record<string, unknown>) {
    this.libraryContent.push({ ...doc, _id: this.id() } as Row);
  }

  patchContent(id: string, patch: Record<string, unknown>) {
    const row = this.libraryContent.find((r) => r._id === id);
    if (row) Object.assign(row, patch);
  }

  mediaForSlug(slug: string) {
    return this.libraryMedia.filter((m) => m.contentSlug === slug);
  }

  deleteMedia(id: string) {
    this.libraryMedia = this.libraryMedia.filter((m) => m._id !== id);
  }

  insertMedia(doc: { contentSlug: string; kind: string }) {
    this.libraryMedia.push({ ...doc, _id: this.id() });
  }
}

function runImport(db: FakeDb, items: ReturnType<typeof seedPayload>, now: number) {
  let created = 0;
  let updated = 0;
  for (const it of items) {
    const { media, ...content } = it;
    const existing = db.findBySlug(it.slug);
    if (existing) {
      db.patchContent(existing._id, {
        ...content,
        // Never override a human review decision on re-seed.
        clinicalStatus: existing.clinicalStatus,
        reviewerId: existing.reviewerId,
        reviewedAt: existing.reviewedAt,
        nextReviewAt: existing.nextReviewAt,
        updatedAt: now,
      });
      updated += 1;
    } else {
      const clinicalStatus = content.clinicalStatus === 'published' ? 'clinical_review' : content.clinicalStatus;
      db.insertContent({ ...content, clinicalStatus, createdAt: now, updatedAt: now });
      created += 1;
    }
    for (const m of db.mediaForSlug(it.slug)) db.deleteMedia(m._id as string);
    for (const mref of media) db.insertMedia({ contentSlug: it.slug, kind: mref.kind });
  }
  return { created, updated, total: items.length };
}

describe('seed import safety (upsert contract model)', () => {
  const payload = seedPayload();

  it('first import into an empty database inserts every item, updates none', () => {
    const db = new FakeDb();
    const res = runImport(db, payload, 1000);
    expect(res.created).toBe(payload.length);
    expect(res.updated).toBe(0);
    expect(db.libraryContent.length).toBe(payload.length);
  });

  it('second import creates nothing, updates everything, and never duplicates', () => {
    const db = new FakeDb();
    runImport(db, payload, 1000);
    const res = runImport(db, payload, 2000);
    expect(res.created).toBe(0);
    expect(res.updated).toBe(payload.length);
    expect(db.libraryContent.length).toBe(payload.length);
    const slugs = db.libraryContent.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('re-import never overwrites a human review decision (published stays published)', () => {
    const db = new FakeDb();
    runImport(db, payload, 1000);
    const target = db.libraryContent[0];
    db.patchContent(target._id, {
      clinicalStatus: 'published',
      reviewerId: 'reviewer_1',
      reviewedAt: 1500,
    });
    runImport(db, payload, 2000);
    const after = db.libraryContent.find((r) => r._id === target._id)!;
    expect(after.clinicalStatus).toBe('published');
    expect(after.reviewerId).toBe('reviewer_1');
    expect(after.reviewedAt).toBe(1500);
  });

  it('import can never create published content (insert clamps to clinical_review)', () => {
    const db = new FakeDb();
    const spiked = payload.map((it, i) =>
      i === 0 ? { ...it, clinicalStatus: 'published' as const } : it,
    );
    runImport(db, spiked, 1000);
    const inserted = db.findBySlug(spiked[0].slug)!;
    expect(inserted.clinicalStatus).toBe('clinical_review');
  });

  it('does not delete content rows or touch unrelated user data on re-import', () => {
    const db = new FakeDb();
    db.children.push({ _id: 'child_1', slug: 'n/a', nickname: 'Baby' });
    runImport(db, payload, 1000);
    const mediaAfterFirst = db.libraryMedia.length;
    const res = runImport(db, payload, 2000);
    // No content removed; row count is stable across the destructive-looking re-run.
    expect(db.libraryContent.length).toBe(payload.length);
    expect(res.created).toBe(0);
    // Media is refreshed per slug, not accumulated — no unbounded growth.
    expect(db.libraryMedia.length).toBe(mediaAfterFirst);
    // Unrelated user data is never touched by seeding.
    expect(db.children).toEqual([{ _id: 'child_1', slug: 'n/a', nickname: 'Baby' }]);
  });
});
