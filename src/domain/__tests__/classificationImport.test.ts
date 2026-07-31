import { describe, expect, it } from 'vitest';
import {
  applyRefusal,
  buildImportPlan,
  type ClassificationFileInput,
  type ServerRowSnapshot,
} from '../../../convex/lib/classificationImport';

const RUN = { runId: 'migration-dryrun-2026-07-30-libclass-v2', expectedRecords: 3 };

const serverRow = (overrides: Partial<ServerRowSnapshot>): ServerRowSnapshot => ({
  slug: 'act_one',
  type: 'activity',
  clinicalStatus: 'clinical_review',
  reviewRevision: null,
  riskClassification: null,
  ownerPriority: null,
  riskReasons: null,
  requiredReviewDimensions: null,
  classificationRunId: null,
  priorityStatus: null,
  ...overrides,
});

const file = (records: ClassificationFileInput['records']): ClassificationFileInput => ({ records });

describe('classification import preview plan', () => {
  it('matches by slug and reports missing, unknown and duplicate slugs', () => {
    const plan = buildImportPlan(
      file([
        { slug: 'act_one', proposedClassification: 'A' },
        { slug: 'act_one', proposedClassification: 'A' },
        { slug: 'act_ghost', proposedClassification: 'B' },
      ]),
      [serverRow({}), serverRow({ slug: 'act_only_on_server' })],
      RUN,
    );
    expect(plan.matched).toBe(1);
    expect(plan.duplicateSlugs).toEqual(['act_one']);
    expect(plan.missingSlugs).toEqual(['act_ghost']);
    expect(plan.unknownSlugs).toEqual(['act_only_on_server']);
  });

  it('refuses revision conflicts instead of planning a change', () => {
    const plan = buildImportPlan(
      file([{ slug: 'act_one', proposedClassification: 'C', reviewRevision: 1 }]),
      [serverRow({ reviewRevision: 3 })],
      RUN,
    );
    expect(plan.changes).toHaveLength(0);
    expect(plan.revisionConflicts).toEqual([{ slug: 'act_one', fileRevision: '1', serverRevision: 3 }]);
  });

  it("treats the artefact's ABSENT as matching a row without a revision", () => {
    const plan = buildImportPlan(
      file([{ slug: 'act_one', proposedClassification: 'C', reviewRevision: 'ABSENT' }]),
      [serverRow({ reviewRevision: null })],
      RUN,
    );
    expect(plan.revisionConflicts).toHaveLength(0);
    expect(plan.changes).toHaveLength(1);
    expect(plan.changes[0].expectedReviewRevision).toBe(1);
  });

  it('proposes only additive governance fields — never status, scope or reviewers', () => {
    const plan = buildImportPlan(
      file([{ slug: 'act_one', proposedClassification: 'C', classificationReason: 'guide-like risk' }]),
      [serverRow({ clinicalStatus: 'published' })],
      RUN,
    );
    const fields = Object.keys(plan.changes[0].fields);
    expect(fields.sort()).toEqual([
      'classificationRunId',
      'classificationSource',
      'ownerPriority',
      'priorityStatus',
      'requiredReviewDimensions',
      'riskClassification',
      'riskReasons',
    ]);
    for (const forbidden of ['clinicalStatus', 'reviewScope', 'publicationStatus', 'reviewerId', 'reviewerDisplayName']) {
      expect(fields).not.toContain(forbidden);
    }
  });

  it('derives P1 for visible Class C and P2 for unpublished Class C', () => {
    const plan = buildImportPlan(
      file([
        { slug: 'vis', proposedClassification: 'C' },
        { slug: 'hid', proposedClassification: 'C' },
      ]),
      [serverRow({ slug: 'vis', clinicalStatus: 'published' }), serverRow({ slug: 'hid' })],
      RUN,
    );
    const bySlug = new Map(plan.changes.map((change) => [change.slug, change]));
    expect(bySlug.get('vis')!.fields.ownerPriority).toBe('P1');
    expect(bySlug.get('hid')!.fields.ownerPriority).toBe('P2');
  });

  it('never touches parent visibility: before and after counts are identical', () => {
    const plan = buildImportPlan(
      file([{ slug: 'vis', proposedClassification: 'C' }]),
      [serverRow({ slug: 'vis', clinicalStatus: 'published' })],
      RUN,
    );
    expect(plan.parentVisibleNow).toBe(1);
    expect(plan.parentVisibleAfterImport).toBe(1);
    expect(plan.importEnabled).toBe(false);
  });

  it('does not downgrade an existing priorityStatus', () => {
    const plan = buildImportPlan(
      file([{ slug: 'act_one', proposedClassification: 'B' }]),
      [serverRow({ priorityStatus: 'in_review' })],
      RUN,
    );
    expect(plan.changes[0].fields.priorityStatus).toBeUndefined();
  });

  it('is idempotent: a second identical run proposes zero changes', () => {
    const input = file([{ slug: 'act_one', proposedClassification: 'C', classificationReason: 'risk', triggersFired: 'fever' }]);
    const before = [serverRow({})];
    const first = buildImportPlan(input, before, RUN);
    expect(first.changes).toHaveLength(1);

    // Simulate the future apply: copy exactly the planned fields onto the row.
    const applied = first.changes[0].fields;
    const after = [serverRow({
      riskClassification: applied.riskClassification,
      ownerPriority: applied.ownerPriority,
      riskReasons: applied.riskReasons,
      requiredReviewDimensions: applied.requiredReviewDimensions,
      classificationRunId: applied.classificationRunId,
      priorityStatus: applied.priorityStatus ?? null,
    })];
    const second = buildImportPlan(input, after, RUN);
    expect(second.changes).toHaveLength(0);
    expect(second.unchanged).toEqual(['act_one']);
  });
});

describe('future apply refusal rules', () => {
  const change = {
    slug: 'act_one',
    expectedReviewRevision: 2,
    fields: {
      riskClassification: 'C' as const,
      ownerPriority: 'P2' as const,
      riskReasons: [],
      requiredReviewDimensions: [],
      classificationSource: 's',
      classificationRunId: 'r',
    },
  };
  it('refuses a stale row', () => {
    expect(applyRefusal(change, { reviewRevision: 3 })).toBe('stale_revision');
  });
  it('refuses a vanished row', () => {
    expect(applyRefusal(change, null)).toBe('row_missing');
  });
  it('accepts the exact expected revision', () => {
    expect(applyRefusal(change, { reviewRevision: 2 })).toBeNull();
  });
});
