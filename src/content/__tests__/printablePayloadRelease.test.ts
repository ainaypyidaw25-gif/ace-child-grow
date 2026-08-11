import { describe, expect, it, vi } from 'vitest';
import {
  applyPrintablePayloadRelease,
  preflightPrintablePayloadRelease,
} from '../../../convex/seed';
import {
  PLACEHOLDER_PRINTABLE_SLUGS,
  PRINTABLE_PAYLOAD_RELEASE_ID,
} from '../../../convex/lib/printablePayloadRelease';

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

function printableRows(): Row[] {
  return PLACEHOLDER_PRINTABLE_SLUGS.map((slug) => ({
    _id: `content-${slug}`,
    slug,
    type: 'printable',
    clinicalStatus: 'published',
    source: 'legacy',
    data: { format: 'A4 PDF' },
  }));
}

function placeholderMedia(): Row[] {
  return PLACEHOLDER_PRINTABLE_SLUGS.map((contentSlug) => ({
    _id: `media-${contentSlug}`,
    contentSlug,
    kind: 'pdf',
    placeholder: true,
  }));
}

function exactTargets() {
  return PLACEHOLDER_PRINTABLE_SLUGS.map((slug) => ({
    slug,
    expectedReviewRevision: 1,
  }));
}

describe('placeholder printable production release', () => {
  it('preflights the exact published printables and finds no approved payload', async () => {
    const context = releaseContext({
      libraryContent: printableRows(),
      libraryMedia: placeholderMedia(),
      auditLogs: [],
    });
    const result = await handler(preflightPrintablePayloadRelease)(context, {
      releaseId: PRINTABLE_PAYLOAD_RELEASE_ID,
    }) as {
      releaseApplied: boolean;
      publishedPrintableSlugs: string[];
      targets: Array<Record<string, unknown>>;
    };

    expect(result.releaseApplied).toBe(false);
    expect(result.publishedPrintableSlugs).toEqual([...PLACEHOLDER_PRINTABLE_SLUGS].sort());
    expect(result.targets).toHaveLength(12);
    expect(result.targets).toEqual(expect.arrayContaining([
      expect.objectContaining({
        slug: 'prt_behavior_chart',
        clinicalStatus: 'published',
        reviewRevision: 1,
        pdfRows: 1,
        approvedPayloads: 0,
        previewSeedReady: true,
      }),
    ]));
    expect(context.db.patch).not.toHaveBeenCalled();
  });

  it('stages all 12 rows with preview-only wording at a fresh review revision', async () => {
    const context = releaseContext({
      libraryContent: printableRows(),
      libraryMedia: placeholderMedia(),
      auditLogs: [],
    });
    await expect(handler(applyPrintablePayloadRelease)(context, {
      releaseId: PRINTABLE_PAYLOAD_RELEASE_ID,
      targets: exactTargets(),
    })).resolves.toEqual({ alreadyApplied: false, staged: 12, total: 12 });

    expect(context.db.patch).toHaveBeenCalledTimes(12);
    expect(context.db.patch).toHaveBeenCalledWith('content-prt_behavior_chart', expect.objectContaining({
      clinicalStatus: 'clinical_review',
      reviewRevision: 2,
      data: expect.objectContaining({
        format: 'Preview only — bilingual PDF not yet available',
        availability: 'preview_only',
      }),
      reviewerId: undefined,
    }));
    expect(context.db.insert).toHaveBeenCalledTimes(13);
    expect(context.db.insert).toHaveBeenCalledWith('auditLogs', expect.objectContaining({
      action: 'library.printable_payload.release',
      summary: PRINTABLE_PAYLOAD_RELEASE_ID,
    }));
  });

  it('aborts before every write on a stale revision or an approved PDF payload', async () => {
    const stale = releaseContext({
      libraryContent: printableRows(),
      libraryMedia: placeholderMedia(),
      auditLogs: [],
    });
    const targets = exactTargets();
    targets[0] = { ...targets[0], expectedReviewRevision: 9 };
    await expect(handler(applyPrintablePayloadRelease)(stale, {
      releaseId: PRINTABLE_PAYLOAD_RELEASE_ID,
      targets,
    })).rejects.toThrow('changed after preflight');
    expect(stale.db.patch).not.toHaveBeenCalled();
    expect(stale.db.insert).not.toHaveBeenCalled();

    const media = placeholderMedia();
    media[0] = {
      ...media[0],
      placeholder: false,
      reviewStatus: 'approved',
      storageId: 'storage-1',
    };
    const payloadAdded = releaseContext({
      libraryContent: printableRows(),
      libraryMedia: media,
      auditLogs: [],
    });
    await expect(handler(applyPrintablePayloadRelease)(payloadAdded, {
      releaseId: PRINTABLE_PAYLOAD_RELEASE_ID,
      targets: exactTargets(),
    })).rejects.toThrow('now has an approved payload');
    expect(payloadAdded.db.patch).not.toHaveBeenCalled();
    expect(payloadAdded.db.insert).not.toHaveBeenCalled();
  });

  it('is idempotent after the completion audit exists', async () => {
    const context = releaseContext({
      libraryContent: printableRows(),
      libraryMedia: placeholderMedia(),
      auditLogs: [{
        _id: 'release-audit',
        action: 'library.printable_payload.release',
        summary: PRINTABLE_PAYLOAD_RELEASE_ID,
      }],
    });
    await expect(handler(applyPrintablePayloadRelease)(context, {
      releaseId: PRINTABLE_PAYLOAD_RELEASE_ID,
      targets: exactTargets(),
    })).resolves.toEqual({ alreadyApplied: true, staged: 0, total: 0 });
    expect(context.db.patch).not.toHaveBeenCalled();
    expect(context.db.insert).not.toHaveBeenCalled();
  });
});
