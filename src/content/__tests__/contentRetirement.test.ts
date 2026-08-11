import { describe, expect, it, vi } from 'vitest';
import {
  preflightDuplicateMilestoneRetirement,
  retireDuplicateMilestones,
} from '../../../convex/seed';
import {
  DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID,
  DUPLICATE_MILESTONE_SLUGS,
} from '../../../convex/lib/contentRetirements';

type Row = Record<string, unknown> & { _id: string };

function retirementContext(rows: Record<string, Row[]>) {
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
  return (fn as { _handler: (ctx: ReturnType<typeof retirementContext>, args: unknown) => Promise<unknown> })
    ._handler;
}

function contentRows(status = 'published'): Row[] {
  return DUPLICATE_MILESTONE_SLUGS.map((slug, index) => ({
    _id: `content-${index + 1}`,
    slug,
    titleEn: slug,
    clinicalStatus: status,
    reviewRevision: index + 1,
  }));
}

function exactTargets() {
  return DUPLICATE_MILESTONE_SLUGS.map((slug, index) => ({
    slug,
    expectedReviewRevision: index + 1,
  }));
}

describe('duplicate milestone retirement release', () => {
  it('preflights only the exact six slugs without writing', async () => {
    const context = retirementContext({
      libraryContent: contentRows(),
      libraryMedia: [{ _id: 'media-1', contentSlug: DUPLICATE_MILESTONE_SLUGS[0] }],
      evidenceLinks: [{ _id: 'link-1', slug: DUPLICATE_MILESTONE_SLUGS[0] }],
    });
    const result = await handler(preflightDuplicateMilestoneRetirement)(context, {
      releaseId: DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID,
    }) as Array<Record<string, unknown>>;

    expect(result.map((row) => row.slug)).toEqual(DUPLICATE_MILESTONE_SLUGS);
    expect(result.every((row) => row.clinicalStatus === 'published')).toBe(true);
    expect(result[0]).toMatchObject({ mediaRows: 1, evidenceLinkRows: 1 });
    expect(context.db.patch).not.toHaveBeenCalled();
    expect(context.db.insert).not.toHaveBeenCalled();
  });

  it('archives all six atomically and records one audit event per exact slug', async () => {
    const context = retirementContext({ libraryContent: contentRows() });
    await expect(handler(retireDuplicateMilestones)(context, {
      releaseId: DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID,
      targets: exactTargets(),
    })).resolves.toEqual({ retired: 6, alreadyRetired: 0, total: 6 });

    expect(context.db.patch).toHaveBeenCalledTimes(6);
    for (const [index] of DUPLICATE_MILESTONE_SLUGS.entries()) {
      expect(context.db.patch).toHaveBeenCalledWith(`content-${index + 1}`, expect.objectContaining({
        clinicalStatus: 'archived',
        reviewScope: undefined,
        reviewerId: undefined,
      }));
    }
    expect(context.db.insert).toHaveBeenCalledTimes(6);
    for (const slug of DUPLICATE_MILESTONE_SLUGS) {
      expect(context.db.insert).toHaveBeenCalledWith('auditLogs', expect.objectContaining({
        action: 'library.duplicate_milestone.retired',
        summary: `${DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID} · ${slug}`,
      }));
    }
  });

  it('aborts before every write when any review revision is stale', async () => {
    const context = retirementContext({ libraryContent: contentRows() });
    const targets = exactTargets();
    targets[5] = { ...targets[5], expectedReviewRevision: 999 };
    await expect(handler(retireDuplicateMilestones)(context, {
      releaseId: DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID,
      targets,
    })).rejects.toThrow('newer review revision');
    expect(context.db.patch).not.toHaveBeenCalled();
    expect(context.db.insert).not.toHaveBeenCalled();
  });

  it('is idempotent after all six rows are already archived', async () => {
    const context = retirementContext({ libraryContent: contentRows('archived') });
    await expect(handler(retireDuplicateMilestones)(context, {
      releaseId: DUPLICATE_MILESTONE_RETIREMENT_RELEASE_ID,
      targets: exactTargets(),
    })).resolves.toEqual({ retired: 0, alreadyRetired: 6, total: 6 });
    expect(context.db.patch).not.toHaveBeenCalled();
    expect(context.db.insert).not.toHaveBeenCalled();
  });
});
