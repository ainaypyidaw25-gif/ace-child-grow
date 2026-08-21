import { describe, expect, it, vi } from 'vitest';
import {
  applyPublishedEvidenceSafetyRelease,
  preflightPublishedEvidenceSafetyRelease,
} from '../../../convex/seed';
import {
  EVIDENCE_REVIEWED_EDUCATION_SOURCE,
  FOCUSED_SPECIALIST_REVIEW_SLUGS,
  LEGACY_PENDING_REVIEW_SOURCE,
  PUBLISHED_EVIDENCE_SAFETY_RELEASE_ID,
} from '../../../convex/lib/evidenceSafetyRelease';

type Row = Record<string, unknown> & { _id: string };

function releaseContext(rows: Record<string, Row[]>) {
  const patch = vi.fn();
  const insert = vi.fn(async () => 'audit-1');
  const query = vi.fn((table: string) => {
    const clauses: Array<[string, unknown]> = [];
    const matching = () => (rows[table] ?? []).filter((row) =>
      clauses.every(([field, value]) => row[field] === value));
    const terminal = {
      unique: async () => matching()[0] ?? null,
      take: async (limit: number) => matching().slice(0, limit),
    };
    const q = {
      eq(field: string, value: unknown) {
        clauses.push([field, value]);
        return q;
      },
    };
    return {
      withIndex: (_name: string, callback: (builder: typeof q) => unknown) => {
        callback(q);
        return terminal;
      },
    };
  });
  return { db: { query, patch, insert } };
}

function handler(fn: unknown) {
  return (fn as { _handler: (ctx: ReturnType<typeof releaseContext>, args: unknown) => Promise<unknown> })
    ._handler;
}

function publishedRows(): Row[] {
  return [
    {
      _id: 'correction-1',
      slug: 'ms_5_6m_gross_motor_2',
      clinicalStatus: 'published',
      source: LEGACY_PENDING_REVIEW_SOURCE,
      titleMm: 'old',
      titleEn: 'old',
    },
    {
      _id: 'specialist-1',
      slug: 'ms_birth_2m_emotional_1',
      clinicalStatus: 'published',
      source: LEGACY_PENDING_REVIEW_SOURCE,
      reviewRevision: 4,
    },
    {
      _id: 'metadata-1',
      slug: 'ms_birth_2m_gross_motor_1',
      clinicalStatus: 'published',
      source: LEGACY_PENDING_REVIEW_SOURCE,
    },
  ];
}

function libraryRows(): Row[] {
  const rows = publishedRows();
  for (const slug of FOCUSED_SPECIALIST_REVIEW_SLUGS) {
    if (rows.some((row) => row.slug === slug)) continue;
    rows.push({
      _id: `specialist-${slug}`,
      slug,
      clinicalStatus: 'clinical_review',
      source: EVIDENCE_REVIEWED_EDUCATION_SOURCE,
      reviewRevision: 2,
    });
  }
  return rows;
}

function exactTargets() {
  return [
    { slug: 'ms_5_6m_gross_motor_2', expectedReviewRevision: 1 },
    { slug: 'ms_birth_2m_emotional_1', expectedReviewRevision: 4 },
    { slug: 'ms_birth_2m_gross_motor_1', expectedReviewRevision: 1 },
  ];
}

function specialistTargets() {
  return FOCUSED_SPECIALIST_REVIEW_SLUGS.map((slug) => ({
    slug,
    expectedClinicalStatus: slug === 'ms_birth_2m_emotional_1' ? 'published' : 'clinical_review',
    expectedReviewRevision: slug === 'ms_birth_2m_emotional_1' ? 4 : 2,
  }));
}

describe('published evidence/safety release', () => {
  it('preflights the complete published set and reports the focused actions without writing', async () => {
    const context = releaseContext({ libraryContent: libraryRows(), auditLogs: [] });
    const result = await handler(preflightPublishedEvidenceSafetyRelease)(context, {
      releaseId: PUBLISHED_EVIDENCE_SAFETY_RELEASE_ID,
    }) as {
      releaseApplied: boolean;
      published: Array<Record<string, unknown>>;
      specialist: Array<Record<string, unknown>>;
    };

    expect(result.releaseApplied).toBe(false);
    expect(result.published).toEqual([
      expect.objectContaining({ slug: 'ms_5_6m_gross_motor_2', action: 'correction_to_review' }),
      expect.objectContaining({ slug: 'ms_birth_2m_emotional_1', action: 'specialist_to_review' }),
      expect.objectContaining({ slug: 'ms_birth_2m_gross_motor_1', action: 'metadata_only' }),
    ]);
    expect(result.specialist).toHaveLength(7);
    expect(result.specialist[0]).toMatchObject({
      slug: 'ms_birth_2m_emotional_1',
      clinicalStatus: 'published',
      reviewRevision: 4,
    });
    expect(context.db.patch).not.toHaveBeenCalled();
    expect(context.db.insert).not.toHaveBeenCalled();
  });

  it('updates metadata in place and stages wording and specialist rows at fresh revisions', async () => {
    const context = releaseContext({ libraryContent: libraryRows(), auditLogs: [] });
    await expect(handler(applyPublishedEvidenceSafetyRelease)(context, {
      releaseId: PUBLISHED_EVIDENCE_SAFETY_RELEASE_ID,
      publishedTargets: exactTargets(),
      specialistTargets: specialistTargets(),
    })).resolves.toEqual({
      alreadyApplied: false,
      metadataUpdated: 1,
      correctionsStaged: 1,
      specialistStaged: 1,
      specialistAlreadyInReview: 6,
      unchanged: 0,
      total: 3,
    });

    expect(context.db.patch).toHaveBeenCalledTimes(3);
    expect(context.db.patch).toHaveBeenCalledWith('correction-1', expect.objectContaining({
      source: EVIDENCE_REVIEWED_EDUCATION_SOURCE,
      clinicalStatus: 'clinical_review',
      reviewRevision: 2,
      reviewerId: undefined,
    }));
    expect(context.db.patch).toHaveBeenCalledWith('specialist-1', expect.objectContaining({
      source: EVIDENCE_REVIEWED_EDUCATION_SOURCE,
      clinicalStatus: 'clinical_review',
      reviewRevision: 5,
      reviewScope: undefined,
    }));
    expect(context.db.patch).toHaveBeenCalledWith('metadata-1', {
      source: EVIDENCE_REVIEWED_EDUCATION_SOURCE,
      updatedAt: expect.any(Number),
    });
    expect(context.db.insert).toHaveBeenCalledWith('auditLogs', expect.objectContaining({
      action: 'library.evidence_safety.release',
      summary: PUBLISHED_EVIDENCE_SAFETY_RELEASE_ID,
    }));
  });

  it('aborts before every write when the complete published set or a revision is stale', async () => {
    const context = releaseContext({ libraryContent: libraryRows(), auditLogs: [] });
    const targets = exactTargets();
    targets[1] = { ...targets[1], expectedReviewRevision: 99 };
    await expect(handler(applyPublishedEvidenceSafetyRelease)(context, {
      releaseId: PUBLISHED_EVIDENCE_SAFETY_RELEASE_ID,
      publishedTargets: targets,
      specialistTargets: specialistTargets(),
    })).rejects.toThrow('newer review revision');
    expect(context.db.patch).not.toHaveBeenCalled();
    expect(context.db.insert).not.toHaveBeenCalled();
  });

  it('refuses unexpected metadata and is idempotent after the completion audit exists', async () => {
    const unexpected = libraryRows();
    unexpected[2] = { ...unexpected[2], source: 'unknown source state' };
    const refused = releaseContext({ libraryContent: unexpected, auditLogs: [] });
    await expect(handler(applyPublishedEvidenceSafetyRelease)(refused, {
      releaseId: PUBLISHED_EVIDENCE_SAFETY_RELEASE_ID,
      publishedTargets: exactTargets(),
      specialistTargets: specialistTargets(),
    })).rejects.toThrow('unexpected source metadata');
    expect(refused.db.patch).not.toHaveBeenCalled();
    expect(refused.db.insert).not.toHaveBeenCalled();

    const completed = releaseContext({
      libraryContent: libraryRows(),
      auditLogs: [{
        _id: 'release-audit',
        action: 'library.evidence_safety.release',
        summary: PUBLISHED_EVIDENCE_SAFETY_RELEASE_ID,
      }],
    });
    await expect(handler(applyPublishedEvidenceSafetyRelease)(completed, {
      releaseId: PUBLISHED_EVIDENCE_SAFETY_RELEASE_ID,
      publishedTargets: exactTargets(),
      specialistTargets: specialistTargets(),
    })).resolves.toEqual({
      alreadyApplied: true,
      metadataUpdated: 0,
      correctionsStaged: 0,
      specialistStaged: 0,
      specialistAlreadyInReview: 0,
      unchanged: 0,
      total: 0,
    });
    expect(completed.db.patch).not.toHaveBeenCalled();
    expect(completed.db.insert).not.toHaveBeenCalled();
  });
});
