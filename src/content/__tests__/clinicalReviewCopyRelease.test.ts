import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import seedData from '../../../convex/seedData.json';
import {
  applyClinicalReviewCopyRelease,
  preflightClinicalReviewCopyRelease,
} from '../../../convex/seed';
import {
  CLINICAL_REVIEW_COPY_PAYLOAD_SHA256,
  CLINICAL_REVIEW_COPY_RELEASE_ID,
  CLINICAL_REVIEW_COPY_TARGETS,
} from '../../../convex/lib/clinicalReviewCopyRelease';

type Row = Record<string, unknown> & { _id: string };

function setPath(root: unknown, path: string, value: string) {
  const parts = path.split('.');
  let current = root;
  for (const part of parts.slice(0, -1)) {
    if (!current || typeof current !== 'object') throw new Error(`Invalid fixture path: ${path}`);
    current = Array.isArray(current)
      ? current[Number(part)]
      : (current as Record<string, unknown>)[part];
  }
  const leaf = parts.at(-1);
  if (!leaf || !current || typeof current !== 'object') {
    throw new Error(`Invalid fixture path: ${path}`);
  }
  if (Array.isArray(current)) current[Number(leaf)] = value;
  else (current as Record<string, unknown>)[leaf] = value;
}

function releaseContext(rows: Record<string, Row[]>) {
  const patch = vi.fn();
  const insert = vi.fn(async (...args: [string, Record<string, unknown>]) => {
    void args;
    return `audit-${insert.mock.calls.length + 1}`;
  });
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
  return (fn as {
    _handler: (ctx: ReturnType<typeof releaseContext>, args: unknown) => Promise<unknown>;
  })._handler;
}

function clinicalReviewRows(): Row[] {
  const desiredBySlug = new Map(
    (seedData as Array<Record<string, unknown> & { slug: string }>).map((item) => [item.slug, item]),
  );
  return CLINICAL_REVIEW_COPY_TARGETS.map((target, index) => {
    const desired = desiredBySlug.get(target.slug);
    if (!desired) throw new Error(`Fixture seed missing: ${target.slug}`);
    const row = JSON.parse(JSON.stringify({
      ...desired,
      _id: `content-${index + 1}`,
      clinicalStatus: target.expectedClinicalStatus,
      reviewRevision: target.expectedReviewRevision,
      updatedAt: target.expectedUpdatedAt,
      reviewerId: `reviewer-${index + 1}`,
      reviewerQualification: 'fixture qualification',
      reviewerDisplayName: 'Fixture Reviewer',
      reviewScope: 'education',
      reviewedAt: 123,
      nextReviewAt: 456,
      reviewNote: 'fixture note',
    })) as Row;
    for (const patch of target.patches) setPath(row, patch.path, patch.before);
    return row;
  });
}

describe('clinical-review Burmese copy release', () => {
  it('pins one immutable, exact two-row payload', () => {
    expect(CLINICAL_REVIEW_COPY_RELEASE_ID).toBe('2026-08-18-clinical-review-copy');
    expect(CLINICAL_REVIEW_COPY_TARGETS.map((target) => target.slug)).toEqual([
      'act_board_book_point',
      'sn_selective_mutism',
    ]);
    expect(new Set(CLINICAL_REVIEW_COPY_TARGETS.map((target) => target.slug)).size).toBe(2);
    expect(createHash('sha256')
      .update(JSON.stringify(CLINICAL_REVIEW_COPY_TARGETS))
      .digest('hex')).toBe(CLINICAL_REVIEW_COPY_PAYLOAD_SHA256);
  });

  it('preflights both exact production states as ready without writing', async () => {
    const context = releaseContext({ libraryContent: clinicalReviewRows(), auditLogs: [] });
    const result = await handler(preflightClinicalReviewCopyRelease)(context, {
      releaseId: CLINICAL_REVIEW_COPY_RELEASE_ID,
    }) as {
      releaseApplied: boolean;
      payloadSha256: string;
      targets: Array<Record<string, unknown>>;
    };

    expect(result.releaseApplied).toBe(false);
    expect(result.payloadSha256).toBe(CLINICAL_REVIEW_COPY_PAYLOAD_SHA256);
    expect(result.targets).toHaveLength(2);
    expect(result.targets.every((target) => target.action === 'ready')).toBe(true);
    expect(result.targets.every((target) => target.seedMatchesRelease === true)).toBe(true);
    expect(result.targets.every((target) => target.currentMatchesExpected === true)).toBe(true);
    expect(result.targets.every((target) => target.desiredMatches === false)).toBe(true);
    expect(context.db.patch).not.toHaveBeenCalled();
    expect(context.db.insert).not.toHaveBeenCalled();
  });

  it('patches only allowlisted copy, derived search text, and review metadata', async () => {
    const rows = clinicalReviewRows();
    (rows[1].data as Record<string, unknown>).cmsOnlyField = 'preserve me';
    const context = releaseContext({ libraryContent: rows, auditLogs: [] });

    await expect(handler(applyClinicalReviewCopyRelease)(context, {
      releaseId: CLINICAL_REVIEW_COPY_RELEASE_ID,
    })).resolves.toEqual({ alreadyApplied: false, updated: 2, total: 2 });

    expect(context.db.patch).toHaveBeenCalledTimes(2);
    const boardUpdate = context.db.patch.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(boardUpdate).toMatchObject({
      titleMm: CLINICAL_REVIEW_COPY_TARGETS[0].patches[0].value,
      summaryMm: CLINICAL_REVIEW_COPY_TARGETS[0].patches[1].value,
      clinicalStatus: 'clinical_review',
      reviewRevision: 5,
    });
    expect(boardUpdate).not.toHaveProperty('data');
    expect(boardUpdate).not.toHaveProperty('titleEn');
    expect(boardUpdate).not.toHaveProperty('summaryEn');
    expect(boardUpdate).not.toHaveProperty('tags');
    expect(boardUpdate).not.toHaveProperty('source');
    expect(boardUpdate).not.toHaveProperty('version');
    expect(boardUpdate).not.toHaveProperty('media');

    const specialistUpdate = context.db.patch.mock.calls[1]?.[1] as Record<string, unknown>;
    expect(specialistUpdate).toMatchObject({
      titleMm: CLINICAL_REVIEW_COPY_TARGETS[1].patches[0].value,
      clinicalStatus: 'clinical_review',
      reviewRevision: 4,
      data: expect.objectContaining({ cmsOnlyField: 'preserve me' }),
    });
    expect(specialistUpdate).not.toHaveProperty('titleEn');
    expect(specialistUpdate).not.toHaveProperty('summaryEn');
    expect(specialistUpdate).not.toHaveProperty('tags');
    expect(specialistUpdate).not.toHaveProperty('source');
    expect(specialistUpdate).not.toHaveProperty('version');
    expect(specialistUpdate).not.toHaveProperty('media');
    expect(specialistUpdate.reviewerId).toBeUndefined();
    expect(specialistUpdate.reviewerQualification).toBeUndefined();
    expect(specialistUpdate.reviewerDisplayName).toBeUndefined();
    expect(specialistUpdate.reviewScope).toBeUndefined();
    expect(specialistUpdate.reviewedAt).toBeUndefined();
    expect(specialistUpdate.nextReviewAt).toBeUndefined();
    expect(specialistUpdate.reviewNote).toBeUndefined();
    expect(specialistUpdate.searchText).not.toBe(rows[1].searchText);

    const updatedData = specialistUpdate.data as {
      possibleSigns: Array<{ mm: string }>;
      professionalSupport: Array<{ mm: string }>;
    };
    expect(updatedData.possibleSigns[2].mm).toBe(CLINICAL_REVIEW_COPY_TARGETS[1].patches[1].value);
    expect(updatedData.professionalSupport[0].mm).toBe(CLINICAL_REVIEW_COPY_TARGETS[1].patches[2].value);
    expect(context.db.insert).toHaveBeenCalledTimes(3);
    expect(context.db.insert).toHaveBeenLastCalledWith('auditLogs', expect.objectContaining({
      action: 'library.clinical_review_copy.release',
      summary: CLINICAL_REVIEW_COPY_RELEASE_ID,
      after: expect.stringContaining(CLINICAL_REVIEW_COPY_PAYLOAD_SHA256),
    }));
  });

  it.each([
    ['status', (rows: Row[]) => { rows[0].clinicalStatus = 'published'; }, 'unexpected status'],
    ['revision', (rows: Row[]) => { rows[0].reviewRevision = 5; }, 'changed after preflight'],
    ['timestamp', (rows: Row[]) => { rows[0].updatedAt = 1786432330926; }, 'changed after preflight'],
    ['copy', (rows: Row[]) => { rows[0].titleMm = 'unexpected copy'; }, 'expected text'],
  ])('aborts all writes on %s drift', async (_name, mutate, message) => {
    const rows = clinicalReviewRows();
    mutate(rows);
    const context = releaseContext({ libraryContent: rows, auditLogs: [] });
    await expect(handler(applyClinicalReviewCopyRelease)(context, {
      releaseId: CLINICAL_REVIEW_COPY_RELEASE_ID,
    })).rejects.toThrow(message);
    expect(context.db.patch).not.toHaveBeenCalled();
    expect(context.db.insert).not.toHaveBeenCalled();
  });

  it('is a no-op after the exact completion audit exists', async () => {
    const context = releaseContext({
      libraryContent: clinicalReviewRows(),
      auditLogs: [{
        _id: 'release-audit',
        action: 'library.clinical_review_copy.release',
        summary: CLINICAL_REVIEW_COPY_RELEASE_ID,
      }],
    });
    await expect(handler(applyClinicalReviewCopyRelease)(context, {
      releaseId: CLINICAL_REVIEW_COPY_RELEASE_ID,
    })).resolves.toEqual({ alreadyApplied: true, updated: 0, total: 0 });
    expect(context.db.patch).not.toHaveBeenCalled();
    expect(context.db.insert).not.toHaveBeenCalled();
  });
});
