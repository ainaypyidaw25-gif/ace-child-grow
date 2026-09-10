import { afterEach, describe, expect, it, vi } from 'vitest';
import { preflight, stage, activate, expire, TWO_STORIES_VISIBILITY_CUTOFF } from '../../../convex/aiTwoStoriesPublication20260910';
import { TWO_STORIES_ARTIFACT as artifact, TWO_STORIES_ARTIFACT_HASH as artifactHash } from '../../../convex/lib/aiTwoStoriesPublication20260910Artifact';
import { TWO_STORIES_PREIMAGE as expected, TWO_STORIES_RELEASE_ROOT as root, TWO_STORIES_SCHOOL_SOURCE as schoolSource, twoStoriesReleaseId } from '../../../convex/lib/aiTwoStoriesPublication20260910Data';
import * as visibility from '../../../convex/lib/aiPublicationVisibility';
import * as hashes from '../../../convex/lib/aiAuditHash';
import { SOURCE_BY_ID } from '../../evidence/sources';
import seedData from '../../../convex/seedData.json';

type Row = Record<string, unknown>;
const realHash = hashes.sha256Canonical;
const realParentReadable = visibility.contentIsAiParentReadable;
const now = artifact.auditCompletedAt + 1000;
const stageArgs = { releaseRoot: root, operator: 'Synthetic AI operator', gitCommit: 'a'.repeat(40) };
const activateArgs = { releaseRoot: root, expectedGeneration: 3, operator: 'Synthetic AI operator' };
function invoke(fn: unknown, ctx: unknown, args: Row = {}): Promise<Row> {
  return (fn as { _handler: (ctx: unknown, args: Row) => Promise<Row> })._handler(ctx, args);
}
const omit = (o: Row, keys: string[]) => Object.fromEntries(Object.entries(o).filter(([k]) => !keys.includes(k)));

/** Private identity hashes are mapped to synthetic fixtures. Story semantic hashes,
 * artifacts, audit rows and runtime publication checks use real SHA-256. The math
 * companion is a synthetic parent-readable row, with exact preservation hashes. */
async function fixture() {
  const contents: Row[] = [];
  const sources: Row[] = [];
  const links: Row[] = [];
  const reviews: Row[] = [];
  const predecessors: Row[] = [];
  const media: Row[] = [];
  const mappings: [unknown, string][] = [];
  for (const target of expected.targets) {
    const seed = structuredClone(seedData.find((row) => row.slug === target.slug)!) as Row;
    delete seed.media;
    const content = { ...seed, _id: target.contentId, _creationTime: 1, clinicalStatus: 'clinical_review', reviewRevision: target.reviewRevision, createdAt: 1, updatedAt: 2 };
    const rawSource = SOURCE_BY_ID.get(target.sourceId)!;
    const source = { ...rawSource, sourceId: target.sourceId, _id: `source-${target.slug}`, _creationTime: 1, createdAt: 1, updatedAt: 2, nextReviewDate: null };
    const link = { _id: `link-${target.slug}`, _creationTime: 1, kind: 'story', slug: target.slug, sourceIds: [target.sourceId], createdAt: 1, updatedAt: 2 };
    const review = { _id: `review-${target.slug}`, contentSlug: target.slug, contentVersion: 1, reviewerDisplayName: 'Synthetic reviewer', decision: 'approved' };
    const predecessor = { _id: `old-${target.slug}`, releaseId: `old:${target.slug}`, targetKey: `story\0${target.slug}`, contentSlug: target.slug, status: 'revoked' };
    const placeholder = { _id: `media-${target.slug}`, contentSlug: target.slug, kind: 'illustration', placeholder: true };
    mappings.push([[content], target.contentFullHash], [omit(content, ['updatedAt', 'reviewRevision', 'aiPublicationReleaseId', 'aiPublishedAt']), target.preservedContentHash],
      [[source], target.sourceFullHash], [[link], target.linkFullHash], [omit(link, ['sourceIds', 'updatedAt']), target.linkPreservedHash], [[review], target.reviewsFullHash],
      [[predecessor], target.predecessorsFullHash], [[placeholder], target.mediaFullHash]);
    contents.push(content); sources.push(source); links.push(link); reviews.push(review); predecessors.push(predecessor); media.push(placeholder);
  }
  const config = { _id: 'config', key: 'global', enabled: true, generation: 3, updatedAt: 2 };
  const math = { _id: 'math', slug: 'lsn_early_math', type: 'lesson', updatedAt: 2 };
  const mathRelease = { _id: 'math-release', releaseId: expected.mathReleaseId, contentId: 'math', contentType: 'lesson', contentSlug: 'lsn_early_math', targetKey: 'lesson\0lsn_early_math', status: 'active' };
  mappings.push([[config], expected.configFullHash], [[math], expected.mathFullHash], [[mathRelease], expected.mathReleaseFullHash]);
  const mapping = new Map(await Promise.all(mappings.map(async ([value, hash]) => [await realHash(value), hash] as const)));
  vi.spyOn(hashes, 'sha256Canonical').mockImplementation(async (value) => { const digest = await realHash(value); return mapping.get(digest) ?? digest; });
  const tables: Record<string, Row[]> = { libraryContent: [...contents, math], evidenceSources: sources, evidenceLinks: links,
    contentReviews: reviews, libraryMedia: media, aiPublicationConfig: [config], aiPublicationReleases: [mathRelease, ...predecessors] };
  const db = {
    query(table: string) {
      const conditions: [string, unknown][] = [];
      const q = { eq(field: string, value: unknown) { conditions.push([field, value]); return q; } };
      const terminal = {
        withIndex(_index: string, cb: (builder: typeof q) => unknown) { cb(q); return terminal; },
        async take(count: number) { return (tables[table] ?? []).filter((row) => conditions.every(([key, value]) => row[key] === value)).slice(0, count); },
        async unique() { const rows = await terminal.take(2); if (rows.length > 1) throw new Error('duplicate'); return rows[0] ?? null; },
      }; return terminal;
    },
    async get(id: string) { return Object.values(tables).flat().find((row) => row._id === id) ?? null; },
    insert: vi.fn(async (table: string, value: Row) => { tables[table] ??= []; const id = `${table}-${tables[table].length}`; tables[table].push({ ...value, _id: id, _creationTime: now }); return id; }),
    patch: vi.fn(async (id: string, value: Row) => { Object.assign((await db.get(id))!, value); }),
  };
  const ctx = { db, scheduler: { runAt: vi.fn(async () => 'scheduled-two-stories') } };
  vi.spyOn(visibility, 'contentIsAiParentReadable').mockImplementation(async (c, content, at) => content.slug === 'lsn_early_math'
    ? process.env.AI_PUBLICATION_ENABLED === 'true' : realParentReadable(c, content, at));
  vi.spyOn(visibility, 'activeAiParentReadableContent').mockImplementation(async (_c, at) => {
    const visible = await Promise.all(contents.map(async (content) => await realParentReadable(ctx as never, content as never, at) ? content : null));
    return { complete: true, rows: [math, ...visible.filter(Boolean)] as never };
  });
  return { ctx, tables, contents, sources, links, reviews, predecessors, media, config, math, mathRelease };
}

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });
describe('two-story exact AI successor preserving active math', () => {
  it('pins actual artifact, both exact identities and no expanded allowlist', async () => {
    expect(await realHash(artifact)).toBe(artifactHash);
    expect(await realHash(schoolSource)).toBe('9fb042c2c6f67e16355c2bf9836efc9c2f8f5d37b2aaed5601c922be27e78671');
    for (const slug of expected.targets.map((target) => target.slug)) expect(visibility.registeredAiPublicationArtifact(twoStoriesReleaseId(slug), artifactHash)?.releaseDays).toBe(30);
    expect(visibility.registeredAiPublicationArtifact(twoStoriesReleaseId('lsn_early_math'), artifactHash)).toBeNull();
    expect(visibility.registeredAiPublicationArtifact(twoStoriesReleaseId('st_waiting_at_clinic'), 'f'.repeat(64))).toBeNull();
  });
  it('stages hidden, activates exactly two stories, preserves old sources/humans/math/control, and is idempotent', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(now); vi.stubEnv('AI_PUBLICATION_ENABLED', 'true');
    const f = await fixture();
    const preserved = structuredClone({ math: f.math, mathRelease: f.mathRelease, config: f.config, sources: f.sources, reviews: f.reviews, predecessors: f.predecessors });
    expect(await invoke(preflight, f.ctx)).toMatchObject({ phase: 'ready', mathReadable: true, generation: 3 });
    expect(await invoke(stage, f.ctx, stageArgs)).toMatchObject({ phase: 'staged', activeReleaseCount: 1 });
    expect(f.ctx.scheduler.runAt).not.toHaveBeenCalled();
    expect(f.tables.aiPublicationReleases).toHaveLength(3); // existing math + two revoked predecessors
    expect(f.contents.every((row) => !row.aiPublicationReleaseId)).toBe(true);
    expect(f.contents[1].reviewRevision).toBe(3);
    expect(f.links[1].sourceIds).toEqual([schoolSource.sourceId]);
    expect(await invoke(activate, f.ctx, activateArgs)).toMatchObject({ phase: 'enabled', activeReleaseCount: 3, mathUnchanged: true });
    expect(f.ctx.scheduler.runAt).toHaveBeenCalledExactlyOnceWith(TWO_STORIES_VISIBILITY_CUTOFF, expect.anything(), { releaseRoot: root });
    const writes = f.ctx.db.insert.mock.calls.length + f.ctx.db.patch.mock.calls.length;
    expect((await invoke(stage, f.ctx, stageArgs)).phase).toBe('enabled');
    expect((await invoke(activate, f.ctx, activateArgs)).phase).toBe('enabled');
    expect(f.ctx.db.insert.mock.calls.length + f.ctx.db.patch.mock.calls.length).toBe(writes);
    expect({ math: f.math, mathRelease: f.mathRelease, config: f.config, sources: f.sources.slice(0, 2), reviews: f.reviews, predecessors: f.predecessors }).toEqual(preserved);
    expect(f.contents.every((row) => row.clinicalStatus === 'clinical_review' && row.reviewerId === undefined)).toBe(true);
  });
  it.each(['config', 'math', 'mathRelease', 'content', 'old_source', 'human_review', 'predecessor', 'media', 'new_source', 'clinical_assignment'] as const)('refuses %s drift before staging writes', async (drift) => {
    vi.spyOn(Date, 'now').mockReturnValue(now); vi.stubEnv('AI_PUBLICATION_ENABLED', 'true'); const f = await fixture();
    if (drift === 'config') f.config.generation = 4;
    if (drift === 'math') f.math.updatedAt = 99;
    if (drift === 'mathRelease') f.mathRelease.status = 'revoked';
    if (drift === 'content') f.contents[0].updatedAt = 99;
    if (drift === 'old_source') f.sources[0].updatedAt = 99;
    if (drift === 'human_review') f.reviews.push({ contentSlug: f.contents[0].slug, decision: 'in_review' });
    if (drift === 'predecessor') f.predecessors[0].revokeReason = 'changed';
    if (drift === 'media') f.media[0].url = 'https://example.com/not-reviewed.png';
    if (drift === 'new_source') f.sources.push({ ...schoolSource, _id: 'existing' });
    if (drift === 'clinical_assignment') {
      f.tables.clinicalReviewBatches = [{ batchId: 'human', status: 'active', authority: 'release' }];
      f.tables.clinicalReviewAssignments = [{ batchId: 'human', contentSlug: f.contents[0].slug }];
    }
    await expect(invoke(stage, f.ctx, stageArgs)).rejects.toThrow();
    expect(f.ctx.db.insert).not.toHaveBeenCalled(); expect(f.ctx.db.patch).not.toHaveBeenCalled();
  });
  it.each(['master_off', 'source_metadata', 'copy', 'link', 'audit', 'control', 'unrelated_active', 'expired_audit'] as const)('refuses activate after %s drift', async (drift) => {
    vi.spyOn(Date, 'now').mockReturnValue(now); vi.stubEnv('AI_PUBLICATION_ENABLED', 'true'); const f = await fixture(); await invoke(stage, f.ctx, stageArgs);
    if (drift === 'master_off') vi.stubEnv('AI_PUBLICATION_ENABLED', 'false');
    if (drift === 'source_metadata') f.tables.evidenceSources.find((row) => row.sourceId === schoolSource.sourceId)!.ageMonthsMin = 36;
    if (drift === 'copy') f.contents[0].titleEn = 'Unaudited';
    if (drift === 'link') f.links[1].createdAt = 44;
    if (drift === 'audit') f.tables.aiContentAudits[0].checks = ['forged'];
    if (drift === 'control') f.config.generation = 4;
    if (drift === 'unrelated_active') f.tables.aiPublicationReleases.push({ _id: 'other', status: 'active', contentSlug: 'other' });
    if (drift === 'expired_audit') vi.spyOn(Date, 'now').mockReturnValue(now + 8 * 86_400_000);
    const writes = f.ctx.db.insert.mock.calls.length + f.ctx.db.patch.mock.calls.length;
    await expect(invoke(activate, f.ctx, activateArgs)).rejects.toThrow();
    expect(f.ctx.db.insert.mock.calls.length + f.ctx.db.patch.mock.calls.length).toBe(writes);
  });
  it('scheduled expiry is early-rejecting, exact, idempotent and preserves math/human state', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(now); vi.stubEnv('AI_PUBLICATION_ENABLED', 'true'); const f = await fixture();
    await invoke(stage, f.ctx, stageArgs); await invoke(activate, f.ctx, activateArgs);
    const preserved = structuredClone({ math: f.math, mathRelease: f.mathRelease, config: f.config, reviews: f.reviews, sources: f.sources });
    await expect(invoke(expire, f.ctx, { releaseRoot: root })).rejects.toThrow('cannot run early');
    vi.spyOn(Date, 'now').mockReturnValue(TWO_STORIES_VISIBILITY_CUTOFF);
    expect(await invoke(expire, f.ctx, { releaseRoot: root })).toEqual({ revoked: 2, pointersCleared: 2 });
    expect(await invoke(expire, f.ctx, { releaseRoot: root })).toEqual({ revoked: 0, pointersCleared: 0 });
    expect({ math: f.math, mathRelease: f.mathRelease, config: f.config, reviews: f.reviews, sources: f.sources }).toEqual(preserved);
    expect(f.tables.aiPublicationReleases.filter((row) => row.status === 'active')).toEqual([f.mathRelease]);
  });
});
