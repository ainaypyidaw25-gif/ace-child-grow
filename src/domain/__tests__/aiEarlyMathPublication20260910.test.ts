import { afterEach, describe, expect, it, vi } from 'vitest';
import { preflight, stage, enable, expire, EARLY_MATH_VISIBILITY_CUTOFF } from '../../../convex/aiEarlyMathPublication20260910';
import { EARLY_MATH_AUDIT_ARTIFACT as artifact, EARLY_MATH_AUDIT_ARTIFACT_HASH as artifactHash } from '../../../convex/lib/aiEarlyMathPublication20260910Artifact';
import { EARLY_MATH_PREIMAGE as expected, EARLY_MATH_RELEASE_ID as releaseId } from '../../../convex/lib/aiEarlyMathPublication20260910Data';
import { registeredAiPublicationArtifact, contentIsAiParentReadable } from '../../../convex/lib/aiPublicationVisibility';
import * as hashes from '../../../convex/lib/aiAuditHash';
import { SOURCE_BY_ID } from '../../evidence/sources';
import seedData from '../../../convex/seedData.json';

type Row = Record<string, unknown>;
const realHash = hashes.sha256Canonical;
const now = artifact.auditCompletedAt + 1000;
const stageArgs = { releaseId, operator: 'AI test operator', gitCommit: 'a'.repeat(40) };
const enableArgs = { releaseId, operator: 'AI test operator', expectedGeneration: 2, reason: 'Disclosed general education only' };
function invoke(fn: unknown, ctx: unknown, args: Row = {}): Promise<Row> {
  return (fn as { _handler: (ctx: unknown, args: Row) => Promise<Row> })._handler(ctx, args);
}

/** Synthetic content identity/history. Only full preimage digests are mapped;
 * audited semantic content/link/source hashes use the real SHA-256 implementation. */
async function fixture() {
  const seed = structuredClone(seedData.find((row) => row.slug === 'lsn_early_math')!) as Row;
  delete seed.media;
  const content: Row = { ...seed, clinicalStatus: 'clinical_review', _id: expected.contentId, _creationTime: 1, createdAt: 1, updatedAt: 2, reviewRevision: 10 };
  const source: Row = { ...SOURCE_BY_ID.get(expected.sourceId), sourceId: expected.sourceId, _id: 'source', _creationTime: 1, createdAt: 1, updatedAt: 2, nextReviewDate: null };
  const link: Row = { _id: 'link', _creationTime: 1, kind: 'lesson', slug: 'lsn_early_math', sourceIds: [expected.sourceId], updatedAt: 2 };
  const config: Row = { _id: 'config', key: 'global', enabled: false, generation: 2, updatedAt: 2 };
  const reviews: Row[] = [{ _id: 'synthetic-review', contentSlug: 'lsn_early_math', contentVersion: 8, decision: 'approved' }];
  const preserved = { ...content };
  for (const key of ['data', 'reviewRevision', 'updatedAt', 'searchText', 'aiPublicationReleaseId', 'aiPublishedAt']) delete preserved[key];
  const mapping = new Map(await Promise.all([
    [content, expected.contentFullHash], [source, expected.sourceFullHash], [link, expected.linkFullHash],
    [config, expected.configFullHash], [reviews, expected.reviewsFullHash], [preserved, expected.preservedContentHash],
  ].map(async ([value, hash]) => [await realHash(value), hash as string] as const)));
  vi.spyOn(hashes, 'sha256Canonical').mockImplementation(async (value) => {
    const hash = await realHash(value);
    return mapping.get(hash) ?? hash;
  });
  const tables: Record<string, Row[]> = { libraryContent: [content], evidenceSources: [source], evidenceLinks: [link], aiPublicationConfig: [config], contentReviews: reviews };
  const db = {
    query(table: string) {
      let conditions: [string, unknown][] = [];
      const q = { eq(field: string, value: unknown) { conditions.push([field, value]); return q; } };
      const terminal = {
        withIndex(_index: string, cb: (builder: { eq: (field: string, value: unknown) => unknown }) => unknown) { conditions = []; cb(q); return terminal; },
        async take(count: number) { return (tables[table] ?? []).filter((row) => conditions.every(([key, value]) => row[key] === value)).slice(0, count); },
        async unique() { const rows = await terminal.take(2); if (rows.length > 1) throw new Error('duplicate'); return rows[0] ?? null; },
      };
      return terminal;
    },
    async get(id: string) { return Object.values(tables).flat().find((row) => row._id === id) ?? null; },
    insert: vi.fn(async (table: string, value: Row) => {
      tables[table] ??= [];
      const id = `${table}-${tables[table].length}`;
      tables[table].push({ ...value, _id: id, _creationTime: now }); return id;
    }),
    patch: vi.fn(async (id: string, value: Row) => { Object.assign((await db.get(id))!, value); }),
  };
  return { ctx: { db, scheduler: { runAt: vi.fn(async () => 'scheduled-expiry') } }, tables, content, source, link, config, reviews };
}

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });
describe('one-target early math AI successor', () => {
  it('pins the actual artifact and exact release identity without extending the allowlist', async () => {
    expect(await realHash(artifact)).toBe(artifactHash);
    expect(registeredAiPublicationArtifact(releaseId, artifactHash)?.releaseDays).toBe(30);
    expect(registeredAiPublicationArtifact(releaseId.replace('lsn_early_math', 'st_first_day_school'), artifactHash)).toBeNull();
    expect(registeredAiPublicationArtifact(releaseId, 'f'.repeat(64))).toBeNull();
  });
  it('stages disabled, enables exactly one lesson, preserves human/source/link rows and is idempotent', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(now); vi.stubEnv('AI_PUBLICATION_ENABLED', 'true');
    const f = await fixture();
    const unchanged = structuredClone({ source: f.source, link: f.link, reviews: f.reviews });
    expect(await invoke(preflight, f.ctx)).toMatchObject({ phase: 'ready', sourceUnchanged: true, linkUnchanged: true, humanReviewsUnchanged: true });
    expect((await invoke(stage, f.ctx, stageArgs)).phase).toBe('staged');
    expect(f.ctx.scheduler.runAt).toHaveBeenCalledExactlyOnceWith(EARLY_MATH_VISIBILITY_CUTOFF, expect.anything(), { releaseId });
    expect((await invoke(preflight, f.ctx)).parentReadable).toBe(false);
    expect((await invoke(enable, f.ctx, enableArgs)).parentReadable).toBe(true);
    const writes = f.ctx.db.insert.mock.calls.length + f.ctx.db.patch.mock.calls.length;
    expect((await invoke(stage, f.ctx, stageArgs)).phase).toBe('enabled');
    expect((await invoke(enable, f.ctx, enableArgs)).phase).toBe('enabled');
    expect(f.ctx.db.insert.mock.calls.length + f.ctx.db.patch.mock.calls.length).toBe(writes);
    expect({ source: f.source, link: f.link, reviews: f.reviews }).toEqual(unchanged);
    expect(f.content.clinicalStatus).toBe('clinical_review'); expect(f.content.reviewerId).toBeUndefined();
    expect(f.tables.aiPublicationReleases).toHaveLength(1);
    vi.stubEnv('AI_PUBLICATION_ENABLED', 'false');
    expect((await invoke(preflight, f.ctx)).parentReadable).toBe(false);
  });
  it.each(['content', 'source', 'link', 'config', 'reviews'] as const)('refuses %s preimage drift before writes', async (field) => {
    vi.spyOn(Date, 'now').mockReturnValue(now);
    const f = await fixture();
    if (field === 'reviews') f.reviews.push({ contentSlug: 'lsn_early_math', _id: 'new-decision' });
    else f[field].updatedAt = 99;
    await expect(invoke(stage, f.ctx, stageArgs)).rejects.toThrow('preimage drifted');
    expect(f.ctx.db.insert).not.toHaveBeenCalled(); expect(f.ctx.db.patch).not.toHaveBeenCalled();
  });
  it('keeps persisted human-review governance and expiry fail closed', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(now); vi.stubEnv('AI_PUBLICATION_ENABLED', 'true');
    const f = await fixture();
    f.tables.clinicalReviewBatches = [{ batchId: 'human', status: 'active', authority: 'release' }];
    f.tables.clinicalReviewAssignments = [{ batchId: 'human', contentSlug: 'lsn_early_math' }];
    await expect(invoke(stage, f.ctx, stageArgs)).rejects.toThrow('invalidation and refreeze');
    expect(f.ctx.db.insert).not.toHaveBeenCalled();
    f.tables.clinicalReviewBatches = []; f.tables.clinicalReviewAssignments = [];
    await invoke(stage, f.ctx, stageArgs); await invoke(enable, f.ctx, enableArgs);
    const parentRead = contentIsAiParentReadable as unknown as (ctx: unknown, content: unknown, now: number) => Promise<boolean>;
    expect(await parentRead(f.ctx, f.content, artifact.auditCompletedAt + 31 * 86_400_000)).toBe(false);
    f.source.title = 'Source drift';
    expect(await parentRead(f.ctx, f.content, now)).toBe(false);
  });
  it.each(['master_off', 'unrelated_active', 'copy_drift', 'source_drift', 'generation_drift', 'audit_expired'] as const)('refuses enable after %s', async (failure) => {
    vi.spyOn(Date, 'now').mockReturnValue(now); vi.stubEnv('AI_PUBLICATION_ENABLED', 'true');
    const f = await fixture();
    await invoke(stage, f.ctx, stageArgs);
    if (failure === 'master_off') vi.stubEnv('AI_PUBLICATION_ENABLED', 'false');
    if (failure === 'unrelated_active') f.tables.aiPublicationReleases.push({ ...f.tables.aiPublicationReleases[0], _id: 'other', releaseId: 'other', contentSlug: 'st_first_day_school' });
    if (failure === 'copy_drift') f.content.titleEn = 'Unaudited new copy';
    if (failure === 'source_drift') f.source.title = 'Unaudited source';
    if (failure === 'generation_drift') f.config.generation = 4;
    if (failure === 'audit_expired') vi.spyOn(Date, 'now').mockReturnValue(artifact.auditCompletedAt + 8 * 86_400_000);
    const inserts = f.ctx.db.insert.mock.calls.length; const patches = f.ctx.db.patch.mock.calls.length;
    await expect(invoke(enable, f.ctx, enableArgs)).rejects.toThrow();
    expect(f.ctx.db.insert).toHaveBeenCalledTimes(inserts); expect(f.ctx.db.patch).toHaveBeenCalledTimes(patches);
    expect(f.config.enabled).toBe(false);
  });
  it('expiry rejects early invocation and writes an exact idempotent withdrawal to invalidate cached parent reads', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(now); vi.stubEnv('AI_PUBLICATION_ENABLED', 'true');
    const f = await fixture(); await invoke(stage, f.ctx, stageArgs); await invoke(enable, f.ctx, enableArgs);
    const humanSourceSnapshot = structuredClone({ source: f.source, reviews: f.reviews });
    const patches = f.ctx.db.patch.mock.calls.length;
    await expect(invoke(expire, f.ctx, { releaseId })).rejects.toThrow('before its exact cutoff');
    expect(f.ctx.db.patch).toHaveBeenCalledTimes(patches);
    vi.spyOn(Date, 'now').mockReturnValue(EARLY_MATH_VISIBILITY_CUTOFF);
    expect(await invoke(expire, f.ctx, { releaseId })).toEqual({ releaseId, revoked: true, pointersCleared: true });
    expect(f.content.aiPublicationReleaseId).toBeUndefined(); expect(f.content.aiPublishedAt).toBeUndefined();
    expect(f.content.clinicalStatus).toBe('clinical_review'); expect(f.content.reviewRevision).toBe(11);
    expect(f.tables.aiPublicationReleases[0].status).toBe('revoked');
    expect((await invoke(preflight, f.ctx)).parentReadable).toBe(false);
    expect(await invoke(expire, f.ctx, { releaseId })).toEqual({ releaseId, revoked: false, pointersCleared: false });
    expect({ source: f.source, reviews: f.reviews }).toEqual(humanSourceSnapshot);
  });
});
