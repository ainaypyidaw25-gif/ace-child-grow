import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CONTENT_SEED, seedPayload } from '../seed';
import { AGE_GROUP_KEYS, DOMAIN_KEYS } from '../taxonomy';
import { EVIDENCE_LINKS } from '../../evidence/links';
import { EVIDENCE_SOURCES } from '../../evidence/sources';
import {
  publishedErrataSlugs,
  seedAuditSummary,
  seedContentNeedsUpdate,
  seedMayUpdateExisting,
  seedMediaIsProtected,
  seedReviewInvalidationPatch,
} from '../../../convex/lib/seedPolicy';
import { importSeed } from '../../../convex/library';
import { run as seedRun } from '../../../convex/seed';

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
  it('keeps published errata narrow and code-versioned', () => {
    const releases = [
      ['2026-07-28-content-remediation', 11],
      ['2026-07-28-myanmar-copy-clarity', 31],
    ] as const;
    for (const [releaseId, count] of releases) {
      const slugs = publishedErrataSlugs(releaseId);
      expect(slugs).not.toBeNull();
      expect(slugs).toHaveLength(count);
      expect(new Set(slugs).size).toBe(slugs?.length);
      expect(slugs?.every((slug) => seedPayload().some((item) => item.slug === slug))).toBe(true);
    }
    expect(publishedErrataSlugs('unknown-release')).toBeNull();
  });

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

  it('all taxonomy references resolve and every 13m–5y band is importable', () => {
    const olderBands = ['13_18m', '19_24m', '2y', '2_5y', '3y', '3_5y', '4y', '4_5y', '5y'];
    for (const item of seedPayload()) {
      if (item.ageGroupKey) expect(AGE_GROUP_KEYS, `${item.slug} age band`).toContain(item.ageGroupKey);
      if (item.domainKey) expect(DOMAIN_KEYS, `${item.slug} domain`).toContain(item.domainKey);
    }
    for (const band of olderBands) {
      expect(seedPayload().some((item) => item.ageGroupKey === band), band).toBe(true);
    }
  });

  it('every evidence link points to an existing content item and registry source', () => {
    const contentSlugs = new Set(seedPayload().map((item) => item.slug));
    const sourceIds = new Set(EVIDENCE_SOURCES.map((source) => source.id));
    const contentKinds = new Set(['milestone', 'guide', 'activity', 'lesson', 'special_need', 'story', 'printable']);
    for (const link of EVIDENCE_LINKS) {
      if (contentKinds.has(link.kind)) {
        expect(contentSlugs.has(link.slug), `${link.kind}:${link.slug}`).toBe(true);
      }
      for (const sourceId of link.sourceIds) {
        expect(sourceIds.has(sourceId), `${link.kind}:${link.slug} → ${sourceId}`).toBe(true);
      }
    }
  });
});

// --- Idempotent upsert model ------------------------------------------------
// Faithful in-memory model of the loop shared by convex/library.ts:importSeed
// and convex/seed.ts:run: upsert by slug, patch preserves the human review
// decision history, insert clamps 'published' -> 'clinical_review', media is
// refreshed per slug, and nothing is ever deleted from content or unrelated
// workflow tables. Identical content is a true no-op for review revisions.

type Row = Record<string, unknown> & { _id: string; slug: string };
type MediaRow = {
  _id: string;
  contentSlug: string;
  kind: string;
  placeholder?: boolean;
  storageId?: string;
  url?: string;
  reviewStatus?: string;
  note?: string;
};

class FakeDb {
  libraryContent: Row[] = [];
  libraryMedia: MediaRow[] = [];
  children: Row[] = []; // an unrelated user-data table, to prove it is untouched
  auditLogs: Record<string, unknown>[] = [];
  reviewWorkflow: Record<string, Record<string, unknown>[]> = {
    reviewAssignments: [],
    contentReviews: [],
    reviewChecklists: [],
    reviewComments: [],
    reviewProposals: [],
    reviewEvents: [],
    reviewPaymentBatches: [],
    notifications: [],
  };
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

  insertMedia(doc: Omit<MediaRow, '_id'>) {
    this.libraryMedia.push({ ...doc, _id: this.id() });
  }
}

function runImport(db: FakeDb, items: ReturnType<typeof seedPayload>, now: number) {
  let created = 0;
  let updated = 0;
  let skippedApproved = 0;
  for (const it of items) {
    const { media, ...content } = it;
    const existing = db.findBySlug(it.slug);
    if (existing) {
      if (!seedMayUpdateExisting(String(existing.clinicalStatus))) {
        skippedApproved += 1;
        continue;
      }
      if (seedContentNeedsUpdate(existing, content)) {
        db.patchContent(existing._id, {
          ...content,
          clinicalStatus: existing.clinicalStatus,
          ...seedReviewInvalidationPatch(existing),
          updatedAt: now,
        });
        updated += 1;
      }
    } else {
      const clinicalStatus = content.clinicalStatus === 'published' ? 'clinical_review' : content.clinicalStatus;
      db.insertContent({ ...content, clinicalStatus, createdAt: now, updatedAt: now });
      created += 1;
    }
    const existingMedia = db.mediaForSlug(it.slug);
    for (const m of existingMedia) {
      if (!seedMediaIsProtected(m)) db.deleteMedia(m._id);
    }
    for (const mref of media) {
      if (existingMedia.some((row) => row.kind === mref.kind && seedMediaIsProtected(row))) continue;
      db.insertMedia({
        contentSlug: it.slug,
        kind: mref.kind,
        placeholder: mref.placeholder ?? true,
        offline: mref.offline,
        note: mref.note,
      } as Omit<MediaRow, '_id'>);
    }
  }
  db.auditLogs.push({ action: 'library.import', createdAt: now });
  return { created, updated, skippedApproved, total: items.length };
}

function semanticMedia(rows: MediaRow[]) {
  return rows.map(({ _id, ...row }) => {
    void _id;
    return row;
  });
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

  it('second identical import creates and updates nothing, and never duplicates', () => {
    const db = new FakeDb();
    runImport(db, payload, 1000);
    const revisionsBefore = db.libraryContent.map((row) => row.reviewRevision);
    const res = runImport(db, payload, 2000);
    expect(res.created).toBe(0);
    expect(res.updated).toBe(0);
    expect(db.libraryContent.length).toBe(payload.length);
    expect(db.libraryContent.map((row) => row.reviewRevision)).toEqual(revisionsBefore);
    const slugs = db.libraryContent.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('re-import leaves an approved row and its media byte-stable', () => {
    const db = new FakeDb();
    runImport(db, payload, 1000);
    const target = db.libraryContent[0];
    const originalMedia = db.mediaForSlug(target.slug).map((row) => ({ ...row }));
    db.patchContent(target._id, {
      clinicalStatus: 'published',
      reviewerId: 'reviewer_1',
      reviewedAt: 1500,
      titleEn: 'Human-approved title',
      source: 'Human-approved source',
      data: { approved: true },
    });
    const before = JSON.stringify(target);
    const result = runImport(db, payload, 2000);
    const after = db.libraryContent.find((r) => r._id === target._id)!;
    expect(JSON.stringify(after)).toBe(before);
    expect(db.mediaForSlug(target.slug)).toEqual(originalMedia);
    expect(result.skippedApproved).toBe(1);
  });

  it('re-import still updates unapproved rows without duplicating media', () => {
    const db = new FakeDb();
    runImport(db, payload, 1000);
    const target = db.libraryContent[0];
    db.patchContent(target._id, { titleEn: 'Stale draft title', clinicalStatus: 'clinical_review' });
    const mediaCount = db.mediaForSlug(target.slug).length;
    const result = runImport(db, payload, 2000);
    expect(db.findBySlug(target.slug)?.titleEn).toBe(payload[0].titleEn);
    expect(db.mediaForSlug(target.slug)).toHaveLength(mediaCount);
    expect(result.updated).toBe(1);
    expect(result.skippedApproved).toBe(0);
  });

  it('updates unapproved content while preserving approved uploaded media byte-stable', () => {
    const db = new FakeDb();
    runImport(db, payload, 1000);
    const target = db.libraryContent.find((row) => {
      const item = payload.find((candidate) => candidate.slug === row.slug);
      return item?.media.some((media) => media.kind === 'illustration');
    })!;
    db.libraryMedia = db.libraryMedia.filter((row) => row.contentSlug !== target.slug);
    db.insertMedia({
      contentSlug: target.slug,
      kind: 'illustration',
      placeholder: false,
      storageId: 'storage-approved',
      reviewStatus: 'approved',
      note: 'Human-approved upload',
    });
    const protectedBefore = JSON.stringify(
      db.mediaForSlug(target.slug).filter(seedMediaIsProtected),
    );
    db.patchContent(target._id, { titleEn: 'Stale draft title', clinicalStatus: 'clinical_review' });

    const result = runImport(db, payload, 2000);

    expect(db.findBySlug(target.slug)?.titleEn).not.toBe('Stale draft title');
    expect(JSON.stringify(db.mediaForSlug(target.slug).filter(seedMediaIsProtected))).toBe(protectedBefore);
    expect(result.updated).toBe(1);
  });

  it('refreshes unresolved placeholders deterministically without accumulation', () => {
    const db = new FakeDb();
    runImport(db, payload, 1000);
    const firstSemantic = semanticMedia(db.libraryMedia);
    runImport(db, payload, 2000);
    const secondSemantic = semanticMedia(db.libraryMedia);
    expect(secondSemantic).toEqual(firstSemantic);
  });

  it('declares exact result validators and stable audit counts for both seed paths', () => {
    const expectedFields = ['created', 'skippedApproved', 'total', 'updated'];
    for (const registered of [importSeed, seedRun]) {
      const validator = JSON.parse(
        (registered as unknown as { exportReturns: () => string }).exportReturns(),
      );
      expect(Object.keys(validator.value).sort()).toEqual(expectedFields);
      for (const field of expectedFields) {
        expect(validator.value[field]).toEqual({
          fieldType: { type: 'number' },
          optional: false,
        });
      }
    }
    expect(seedAuditSummary(2, 3, 4)).toBe('created 2, updated 3, protected 4');
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

  it('preserves every reviewer workflow record while making changed wording require a new review', () => {
    const db = new FakeDb();
    runImport(db, payload, 1000);
    const target = db.libraryContent[0];
    db.patchContent(target._id, {
      titleEn: 'Stale wording',
      reviewRevision: 7,
      publicationStatus: 'ready_to_publish',
      publicationRevision: 7,
      reviewerId: 'reviewer_1',
      reviewerDisplayName: 'Reviewer',
      reviewedAt: 1500,
    });
    for (const [table, rows] of Object.entries(db.reviewWorkflow)) {
      rows.push({ _id: `${table}_1`, contentSlug: target.slug, contentVersion: 7, status: 'approved' });
    }
    db.auditLogs.push({ _id: 'audit_1', action: 'review.approved', contentSlug: target.slug });
    const workflowBefore = structuredClone(db.reviewWorkflow);
    const auditBefore = structuredClone(db.auditLogs);

    const result = runImport(db, payload, 2000);
    const revised = db.findBySlug(target.slug)!;

    expect(result.updated).toBe(1);
    expect(revised.reviewRevision).toBe(8);
    expect(revised.publicationStatus).toBe('internal_review');
    expect(revised.publicationRevision).toBeUndefined();
    expect(revised.reviewerId).toBeUndefined();
    expect(revised.reviewerDisplayName).toBeUndefined();
    expect(db.reviewWorkflow).toEqual(workflowBefore);
    expect(db.auditLogs.slice(0, auditBefore.length)).toEqual(auditBefore);
    expect(db.auditLogs).toHaveLength(auditBefore.length + 1);
  });

  it('keeps seed/import access away from reviewer tables while appending an audit event', () => {
    const librarySource = readFileSync('convex/library.ts', 'utf8');
    const importer = librarySource.slice(
      librarySource.indexOf('export const importSeed'),
      librarySource.indexOf('export const updateDraft'),
    );
    const seedSource = readFileSync('convex/seed.ts', 'utf8');
    const cliSeed = seedSource.slice(seedSource.indexOf('export const run'));
    const legacySeed = readFileSync('convex/content.ts', 'utf8').slice(
      readFileSync('convex/content.ts', 'utf8').indexOf('export const seedIfEmpty'),
      readFileSync('convex/content.ts', 'utf8').indexOf('export const transition'),
    );
    const workflowTables = Object.keys(new FakeDb().reviewWorkflow);

    for (const table of workflowTables) {
      expect(`${importer}\n${cliSeed}\n${legacySeed}`, table).not.toMatch(
        new RegExp(`[\\"']${table}[\\"']`),
      );
    }
    expect(importer).toContain('await logAudit(');
    expect(cliSeed).toContain('await logAudit(');
  });
});
