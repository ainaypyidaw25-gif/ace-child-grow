import { describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import seedData from '../../../convex/seedData.json';
import {
  applyBurmeseCopyAuditRelease,
  preflightBurmeseCopyAuditRelease,
} from '../../../convex/seed';
import {
  BURMESE_COPY_AUDIT_HELD_SLUGS,
  BURMESE_COPY_AUDIT_PAYLOAD_SHA256,
  BURMESE_COPY_AUDIT_RELEASE_ID,
  BURMESE_COPY_AUDIT_TARGETS,
} from '../../../convex/lib/burmeseCopyAuditRelease';

type Row = Record<string, unknown> & { _id: string };

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
  return (fn as { _handler: (ctx: ReturnType<typeof releaseContext>, args: unknown) => Promise<unknown> })
    ._handler;
}

function publishedRows(): Row[] {
  const desiredBySlug = new Map(
    (seedData as Array<Record<string, unknown> & { slug: string }>).map((item) => [item.slug, item]),
  );
  return BURMESE_COPY_AUDIT_TARGETS.map((target, index) => {
    const desired = desiredBySlug.get(target.slug);
    if (!desired) throw new Error(`Fixture seed missing: ${target.slug}`);
    const row: Row = JSON.parse(JSON.stringify({
      ...desired,
      _id: `content-${index + 1}`,
      clinicalStatus: 'published',
      reviewRevision: target.expectedReviewRevision,
      updatedAt: target.expectedUpdatedAt,
      reviewerId: `reviewer-${index + 1}`,
    })) as Row;
    for (const patch of target.patches) {
      const parts = patch.path.split('.');
      let current = row;
      for (const part of parts.slice(0, -1)) {
        current = current[part] as Row;
      }
      current[parts.at(-1) ?? ''] = `old ${target.slug} ${patch.path}`;
    }
    return row;
  });
}

describe('published Burmese copy audit release', () => {
  it('pins one unique 25-row release and holds the specialist safe-sleep row', () => {
    expect(BURMESE_COPY_AUDIT_RELEASE_ID).toBe('2026-08-18-burmese-copy-audit');
    expect(BURMESE_COPY_AUDIT_TARGETS).toHaveLength(25);
    expect(new Set(BURMESE_COPY_AUDIT_TARGETS.map((target) => target.slug)).size).toBe(25);
    expect(BURMESE_COPY_AUDIT_HELD_SLUGS).toEqual(['ms_birth_2m_sleep_1']);
    const releaseSlugs = new Set<string>(BURMESE_COPY_AUDIT_TARGETS.map((target) => target.slug));
    expect(releaseSlugs.has(BURMESE_COPY_AUDIT_HELD_SLUGS[0])).toBe(false);
    expect(BURMESE_COPY_AUDIT_TARGETS.map((target) => target.slug)).toEqual([
      'act_sound_tracking',
      'ms_13_18m_language_1',
      'ms_13_18m_speech_1',
      'ms_19_24m_emotional_1',
      'ms_19_24m_language_1',
      'ms_2y_problem_solving_1',
      'ms_3_4m_communication_1',
      'ms_3_4m_emotional_1',
      'ms_3_4m_fine_motor_1',
      'ms_3_4m_gross_motor_1',
      'ms_3_5y_communication_1',
      'ms_3_5y_fine_motor_1',
      'ms_3_5y_school_readiness_1',
      'ms_3y_school_readiness_1',
      'ms_3y_social_1',
      'ms_4_5y_cognitive_1',
      'ms_4_5y_fine_motor_1',
      'ms_4y_language_1',
      'ms_4y_problem_solving_1',
      'ms_5y_gross_motor_1',
      'ms_5y_language_1',
      'ms_5y_self_help_1',
      'ms_7_9m_fine_motor_1',
      'ms_7_9m_social_1',
      'st_first_day_school',
    ]);
    expect(createHash('sha256')
      .update(JSON.stringify(BURMESE_COPY_AUDIT_TARGETS))
      .digest('hex')).toBe(BURMESE_COPY_AUDIT_PAYLOAD_SHA256);
  });

  it('preflights all targets as ready without writing', async () => {
    const context = releaseContext({ libraryContent: publishedRows(), auditLogs: [] });
    const result = await handler(preflightBurmeseCopyAuditRelease)(context, {
      releaseId: BURMESE_COPY_AUDIT_RELEASE_ID,
    }) as {
      releaseApplied: boolean;
      payloadSha256: string;
      heldSlugs: string[];
      targets: Array<Record<string, unknown>>;
    };

    expect(result.releaseApplied).toBe(false);
    expect(result.payloadSha256).toBe(BURMESE_COPY_AUDIT_PAYLOAD_SHA256);
    expect(result.heldSlugs).toEqual(['ms_birth_2m_sleep_1']);
    expect(result.targets).toHaveLength(25);
    expect(result.targets.every((target) => target.action === 'ready')).toBe(true);
    expect(result.targets.every((target) => target.desiredMatches === false)).toBe(true);
    expect(context.db.patch).not.toHaveBeenCalled();
    expect(context.db.insert).not.toHaveBeenCalled();
  });

  it('updates only authored fields, preserves review state, and records bounded audit evidence', async () => {
    const rows = publishedRows();
    (rows[0].data as Record<string, unknown>).cmsOnlyField = 'preserve me';
    const context = releaseContext({ libraryContent: rows, auditLogs: [] });
    await expect(handler(applyBurmeseCopyAuditRelease)(context, {
      releaseId: BURMESE_COPY_AUDIT_RELEASE_ID,
    })).resolves.toEqual({
      alreadyApplied: false,
      updated: 25,
      unchanged: 0,
      total: 25,
      held: 1,
    });

    expect(context.db.patch).toHaveBeenCalledTimes(25);
    for (const [, update] of context.db.patch.mock.calls) {
      expect(update).not.toHaveProperty('clinicalStatus');
      expect(update).not.toHaveProperty('reviewRevision');
      expect(update).not.toHaveProperty('reviewerId');
      expect(update).not.toHaveProperty('media');
      expect(update).not.toHaveProperty('titleEn');
      expect(update).not.toHaveProperty('summaryEn');
      expect(update).not.toHaveProperty('tags');
      expect(update).not.toHaveProperty('source');
      expect(update).not.toHaveProperty('version');
      expect(update).toHaveProperty('updatedAt');
    }
    expect(context.db.patch).toHaveBeenCalledWith('content-1', expect.objectContaining({
      data: expect.objectContaining({ cmsOnlyField: 'preserve me' }),
    }));
    expect(context.db.insert).toHaveBeenCalledTimes(26);
    expect(context.db.insert).toHaveBeenLastCalledWith('auditLogs', expect.objectContaining({
      action: 'library.burmese_copy_audit.release',
      summary: BURMESE_COPY_AUDIT_RELEASE_ID,
    }));
  });

  it('aborts every write if any target changed after the production preflight', async () => {
    const rows = publishedRows();
    rows[12] = { ...rows[12], updatedAt: Number(rows[12].updatedAt) + 1 };
    const context = releaseContext({ libraryContent: rows, auditLogs: [] });
    await expect(handler(applyBurmeseCopyAuditRelease)(context, {
      releaseId: BURMESE_COPY_AUDIT_RELEASE_ID,
    })).rejects.toThrow('changed after preflight');
    expect(context.db.patch).not.toHaveBeenCalled();
    expect(context.db.insert).not.toHaveBeenCalled();
  });

  it('repairs a stale search index even when the allowlisted copy is already current', async () => {
    const rows = publishedRows();
    const firstTarget = BURMESE_COPY_AUDIT_TARGETS[0];
    for (const patch of firstTarget.patches) {
      const parts = patch.path.split('.');
      let current = rows[0];
      for (const part of parts.slice(0, -1)) current = current[part] as Row;
      current[parts.at(-1) ?? ''] = patch.value;
    }
    rows[0].searchText = 'stale search index';
    const context = releaseContext({ libraryContent: rows, auditLogs: [] });

    await expect(handler(applyBurmeseCopyAuditRelease)(context, {
      releaseId: BURMESE_COPY_AUDIT_RELEASE_ID,
    })).resolves.toMatchObject({ updated: 25, unchanged: 0 });
    expect(context.db.patch).toHaveBeenCalledWith('content-1', expect.objectContaining({
      searchText: expect.not.stringMatching(/^stale search index$/),
    }));
    const firstAudit = context.db.insert.mock.calls[0]?.[1];
    expect(firstAudit?.after).toContain('"path":"searchText"');
  });

  it('is a no-op after the completion audit exists', async () => {
    const context = releaseContext({
      libraryContent: publishedRows(),
      auditLogs: [{
        _id: 'release-audit',
        action: 'library.burmese_copy_audit.release',
        summary: BURMESE_COPY_AUDIT_RELEASE_ID,
      }],
    });
    await expect(handler(applyBurmeseCopyAuditRelease)(context, {
      releaseId: BURMESE_COPY_AUDIT_RELEASE_ID,
    })).resolves.toEqual({
      alreadyApplied: true,
      updated: 0,
      unchanged: 0,
      total: 0,
      held: 1,
    });
    expect(context.db.patch).not.toHaveBeenCalled();
    expect(context.db.insert).not.toHaveBeenCalled();
  });
});
