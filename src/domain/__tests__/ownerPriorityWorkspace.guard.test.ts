import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { roleMayReview } from '../../../convex/lib/reviewPolicy';
import { applyQueueFilters, DEFAULT_FILTERS, type QueueRowView } from '../../screens/ownerPriority/OwnerPriorityView';

// Source-level guards for the owner-priority workspace, in the same style as
// publicationGate.test.ts: the safety property is asserted against the code
// that ships, so a regression cannot land without editing the test too.

/**
 * Comments explain intent; only executable code can break a safety property.
 * Stripping comments first keeps these guards honest — otherwise a comment
 * merely *naming* a forbidden field would fail the test, and a reviewer would
 * "fix" it by deleting the explanation rather than the risk.
 */
function code(path: string): string {
  return readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const ownerPrioritySource = code('convex/ownerPriority.ts');
const contentReviewsSource = code('convex/contentReviews.ts');
const workspaceSource = code('src/screens/ContentReviewWorkspace.tsx');
const importLibSource = code('convex/lib/classificationImport.ts');
const previewSource = code('src/screens/ownerPriority/ClassificationImportPreview.tsx');

describe('owner-priority workspace cannot touch publication or approvals', () => {
  it('the governance patch object only ever carries additive governance keys', () => {
    // Every `patch.<field> =` assignment in the module, as actually written.
    const assigned = [...ownerPrioritySource.matchAll(/\bpatch\.(\w+)\s*=/g)].map((match) => match[1]);
    expect(assigned.length).toBeGreaterThan(0);
    const allowed = new Set([
      'priorityStatus', 'ownerPriority', 'temporarilyHideRecommended', 'ownerNote',
      'riskClassification', 'riskReasons', 'classificationConfirmedAt', 'classificationConfirmedBy',
      'requiredReviewDimensions', 'updatedAt',
    ]);
    for (const field of assigned) expect(allowed.has(field), `patch.${field} is not an allowed governance field`).toBe(true);
    for (const forbidden of ['clinicalStatus', 'reviewScope', 'publicationStatus', 'reviewerId', 'reviewerDisplayName', 'reviewerQualification']) {
      expect(assigned).not.toContain(forbidden);
    }
  });

  it('never writes a review decision or an audit-history deletion', () => {
    expect(ownerPrioritySource).not.toContain("insert('contentReviews'");
    expect(ownerPrioritySource).not.toContain('ctx.db.delete');
    expect(ownerPrioritySource).not.toContain("insert('staffInvites'");
  });

  it('no MUTATION accepts an argument that could smuggle in a publication or scope change', () => {
    // Only mutation argument lists matter here. The read-only importPreviewRows
    // query legitimately *returns* clinicalStatus so the preview can show it.
    const mutationArgs = ownerPrioritySource
      .split('= mutation({')
      .slice(1)
      .map((block) => block.slice(block.indexOf('args: {'), block.indexOf('returns:')));
    expect(mutationArgs.length).toBeGreaterThan(0);
    for (const block of mutationArgs) {
      for (const forbidden of ['clinicalStatus', 'reviewScope', 'publicationStatus', 'reviewerId']) {
        expect(block, `a mutation accepts ${forbidden}`).not.toContain(forbidden);
      }
    }
  });

  it('no apply/import mutation exists in this build', () => {
    expect(ownerPrioritySource).not.toMatch(/applyClassification|importClassification/);
    expect(importLibSource).toContain('importEnabled: false');
    expect(previewSource).toContain('data-testid="import-disabled"');
    expect(previewSource).not.toContain('useMutation');
  });
});

describe('duplicate decision prevention and exact revision binding', () => {
  it('saveDecision carries a server-side idempotency guard', () => {
    expect(contentReviewsSource).toContain('duplicate: true');
    expect(contentReviewsSource).toMatch(/identical/);
  });

  it('saveDecision refuses stale revisions', () => {
    expect(contentReviewsSource).toContain("code: 'stale_revision'");
    expect(contentReviewsSource).toContain('expectedReviewRevision');
  });

  it('new decisions bind explicitly to reviewRevision', () => {
    expect(contentReviewsSource).toMatch(/reviewRevision,\s*\n\s*dimension/);
  });

  it('the workspace sends the revision it is looking at and blocks double submits', () => {
    expect(workspaceSource).toContain('expectedReviewRevision: reviews.contentVersion');
    expect(workspaceSource).toMatch(/!selectedSlug \|\| busy \|\| !reviews/);
  });

  it('expectedReviewRevision is REQUIRED by the mutation, not optional', () => {
    // v.optional here would silently re-admit unbound decisions from an old
    // client — the exact defect this guard exists to close.
    expect(contentReviewsSource).toMatch(/expectedReviewRevision:\s*v\.number\(\)/);
    expect(contentReviewsSource).not.toMatch(/expectedReviewRevision:\s*v\.optional/);
  });
});

describe('role permissions on review areas', () => {
  it('an owner or publisher account cannot record clinical or safety approvals', () => {
    expect(roleMayReview('owner', 'clinical')).toBe(false);
    expect(roleMayReview('owner', 'safety')).toBe(false);
    expect(roleMayReview('content_editor', 'clinical')).toBe(false);
  });
  it('language and development reviewers cannot decide clinical areas', () => {
    expect(roleMayReview('language_reviewer', 'clinical')).toBe(false);
    expect(roleMayReview('language_reviewer', 'safety')).toBe(false);
    expect(roleMayReview('evidence_reviewer', 'clinical')).toBe(false);
  });
  it('only clinical reviewers hold the clinical dimension', () => {
    expect(roleMayReview('clinical_reviewer', 'clinical')).toBe(true);
    expect(roleMayReview('clinical_reviewer', 'safety')).toBe(true);
  });
});

describe('language/development reviewers cannot publish', () => {
  const librarySource = readFileSync('convex/library.ts', 'utf8');
  it('publication requires the publisher role and full clinical approvals', () => {
    expect(librarySource).toContain('requirePublisher');
    expect(librarySource).toContain('missing review approvals');
  });
});

describe('parent-visible Class C filtering and queue filters', () => {
  const row = (overrides: Partial<QueueRowView>): QueueRowView => ({
    slug: 'x',
    titleMm: 'x',
    titleEn: 'x',
    type: 'activity',
    category: null,
    ageGroupKey: null,
    domainKey: null,
    clinicalStatus: 'clinical_review',
    reviewScope: null,
    reviewRevision: 1,
    parentVisibleNow: false,
    priority: 'P3',
    priorityReasons: [],
    riskClass: 'A',
    riskReasons: [],
    provisionalClassification: true,
    requiredReviewDimensions: [],
    suggestedReviewDimensions: [],
    manualTriageRequired: false,
    outstandingDimensions: [],
    approvedDimensions: [],
    activeReviewers: [],
    hasActiveAssignment: false,
    evidenceStatus: 'linked',
    priorityStatus: 'unreviewed',
    temporarilyHideRecommended: false,
    ownerNote: null,
    latestEditAt: null,
    latestDecisionAt: null,
    warnings: [],
    ...overrides,
  });

  it('parent-visible Class C filter returns exactly the visible C rows', () => {
    const rows = [
      row({ slug: 'a', riskClass: 'C', parentVisibleNow: true, clinicalStatus: 'published' }),
      row({ slug: 'b', riskClass: 'C', parentVisibleNow: false }),
      row({ slug: 'c', riskClass: 'A', parentVisibleNow: true, clinicalStatus: 'published' }),
    ];
    const filtered = applyQueueFilters(rows, { ...DEFAULT_FILTERS, riskClass: 'C', visibility: 'visible' });
    expect(filtered.map((entry) => entry.slug)).toEqual(['a']);
  });

  it('clinical/safety-required filters use outstanding dimensions', () => {
    const rows = [
      row({ slug: 'needs-clinical', outstandingDimensions: ['clinical'] }),
      row({ slug: 'done' }),
    ];
    expect(applyQueueFilters(rows, { ...DEFAULT_FILTERS, clinicalRequired: true }).map((entry) => entry.slug)).toEqual(['needs-clinical']);
  });

  it('searches bilingual titles, slug and queue metadata', () => {
    const rows = [
      row({ slug: 'safe-sleep-3m', titleMm: 'အိပ်စက်ခြင်း', titleEn: 'Safe sleep', ageGroupKey: '3-4m', activeReviewers: ['Dr May'] }),
      row({ slug: 'play', titleMm: 'ကစားခြင်း', titleEn: 'Play', ageGroupKey: '1-2y' }),
    ];
    expect(applyQueueFilters(rows, { ...DEFAULT_FILTERS, query: 'အိပ်စက်' }).map((entry) => entry.slug)).toEqual(['safe-sleep-3m']);
    expect(applyQueueFilters(rows, { ...DEFAULT_FILTERS, query: 'safe 3m' }).map((entry) => entry.slug)).toEqual(['safe-sleep-3m']);
    expect(applyQueueFilters(rows, { ...DEFAULT_FILTERS, query: 'dr may' }).map((entry) => entry.slug)).toEqual(['safe-sleep-3m']);
  });

  it('combines search with the existing safety filters', () => {
    const rows = [
      row({ slug: 'feeding', titleEn: 'Feeding', riskClass: 'C', outstandingDimensions: ['clinical'] }),
      row({ slug: 'feeding-safe', titleEn: 'Feeding safety', riskClass: 'C', outstandingDimensions: ['safety'] }),
    ];
    expect(applyQueueFilters(rows, { ...DEFAULT_FILTERS, query: 'feeding', safetyRequired: true }).map((entry) => entry.slug)).toEqual(['feeding-safe']);
  });
});

describe('edits invalidate active approvals (existing behaviour preserved)', () => {
  const librarySource = readFileSync('convex/library.ts', 'utf8');
  it('updateDraft bumps reviewRevision so prior approvals go stale', () => {
    expect(librarySource).toMatch(/reviewRevision = currentReviewRevision \+ 1/);
  });
  it('current decisions are matched to the exact revision when listing', () => {
    expect(contentReviewsSource).toMatch(/row\.contentVersion !== contentVersion/);
  });
});

describe('schema additions are backwards compatible', () => {
  it('every new governance field is optional, so existing rows stay valid', async () => {
    const schema = (await import('../../../convex/schema')).default;
    const library = schema.tables.libraryContent.validator as unknown as { fields: Record<string, { isOptional?: string }> };
    const reviews = schema.tables.contentReviews.validator as unknown as { fields: Record<string, { isOptional?: string }> };
    const added = [
      'riskClassification', 'ownerPriority', 'riskReasons', 'requiredReviewDimensions',
      'classificationSource', 'classificationRunId', 'classifiedAt', 'classifiedBy',
      'classificationConfirmedAt', 'classificationConfirmedBy',
      'temporarilyHideRecommended', 'priorityStatus', 'ownerNote',
    ];
    for (const field of added) {
      expect(library.fields[field], `libraryContent.${field} is missing`).toBeDefined();
      expect(library.fields[field].isOptional, `libraryContent.${field} must be optional`).toBe('optional');
    }
    expect(reviews.fields.reviewRevision?.isOptional).toBe('optional');
  });

  it('keeps publicationStatus optional for existing library rows', async () => {
    const schema = (await import('../../../convex/schema')).default;
    const library = schema.tables.libraryContent.validator as unknown as { fields: Record<string, { isOptional?: string }> };
    expect(library.fields.publicationStatus).toBeDefined();
    expect(library.fields.publicationStatus.isOptional).toBe('optional');
  });
});
