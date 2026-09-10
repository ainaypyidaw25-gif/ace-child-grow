import { afterEach, describe, expect, it, vi } from 'vitest';
import { apply, preflight } from '../../../convex/learningSourceAttributionCorrection';
import {
  LEARNING_ATTRIBUTION_RELEASE_ID as releaseId,
  LEARNING_ATTRIBUTION_SNAPSHOT_SHA256 as snapshotSha256,
  LEARNING_ATTRIBUTION_CAPTURED_AT as capturedAt,
  LEARNING_ATTRIBUTION_APPLY_BEFORE as applyBefore,
  LEARNING_ATTRIBUTION_TARGETS as targets,
  LEARNING_ATTRIBUTION_CLEARED_REVIEW_FIELDS as cleared,
  learningAttributionPreservedContent as preserved,
  learningAttributionSearchText as searchText,
} from '../../../convex/lib/learningSourceAttributionCorrectionData';
import * as hashes from '../../../convex/lib/aiAuditHash';
import * as governance from '../../../convex/lib/clinicalReviewBatchProvenance';
import { aiPublicationTargetKey } from '../../../convex/lib/aiPublicationPolicy';
import { CLINICAL_REVIEW_BATCH_REGISTRY } from '../../../convex/lib/clinicalReviewBatchData';

type Row = Record<string, unknown>;
const realHash = hashes.sha256Canonical;
const args = { releaseId, snapshotSha256 };
const now = capturedAt + 1000;
const sorted = (rows: Row[]) => [...rows].sort((a,b) => String(a._id).localeCompare(String(b._id)));
const invoke = (fn: unknown, ctx: unknown, input: Row = args): Promise<Row> =>
  (fn as { _handler: (c: unknown, a: Row) => Promise<Row> })._handler(ctx,
    fn === preflight ? { checkedAt: Date.now(), ...input } : input);

/** Private production hashes are mapped onto synthetic identities/history/media.
 * Exact before/after attribution strings, hash comparison logic, audit records and
 * changed-field assertions use the real implementation. No human identity is copied.
 * This is not a replacement for the operator's fresh full-snapshot live preflight. */
async function fixture() {
  const tables: Record<string, Row[]> = { libraryContent: [], evidenceLinks: [], evidenceSources: [],
    contentReviews: [], libraryMedia: [], clinicalReviewAssignments: [], aiPublicationReleases: [], auditLogs: [],
    aiPublicationConfig: [{ _id: 'control', key: 'global', enabled: true, generation: 3 }],
    clinicalReviewBatches: [{ _id: 'unrelated-batch', batchId: 'unrelated', authority: 'release', status: 'active' }] };
  const mappings: [unknown, string][] = [];
  for (const target of targets) {
    const content: Row = { _id: target.contentId, _creationTime: target.contentCreationTime,
      type: 'activity', slug: target.slug, titleEn: 'Synthetic title', titleMm: 'Synthetic Burmese title',
      summaryEn: 'Unchanged summary', tags: ['learning'], version: 1, clinicalStatus: 'clinical_review',
      reviewRevision: 5, updatedAt: target.initialUpdatedAt, createdAt: 1,
      data: { evidenceSummary: target.before, body: { en: 'Preserved content', mm: 'Preserved Myanmar' }, numeric: 5 },
      searchText: 'Previous search', reviewerId: 'synthetic-reviewer', reviewerDisplayName: 'Synthetic reviewer',
      reviewerQualification: 'Synthetic qualification', reviewScope: 'education', reviewedAt: 123,
      nextReviewAt: 456, reviewNote: 'Synthetic history summary' };
    const link = { _id: `link-${target.slug}`, slug: target.slug, kind: 'activity', sourceIds: [...target.sourceIds] };
    const sources = target.sourceIds.map(sourceId => {
      let source = tables.evidenceSources.find(x => x.sourceId === sourceId);
      if (!source) { source = { _id: `source-${sourceId}`, sourceId, title: sourceId, updatedAt: 1 }; tables.evidenceSources.push(source); }
      return source;
    });
    const reviews = Array.from({ length: target.reviewsCount }, (_,i) => ({ _id: `review-${target.slug}-${i}`,
      contentSlug: target.slug, contentVersion: 5, reviewRevision: 5, decision: 'approved',
      dimension: i === 0 ? 'english' : 'safety', reviewerId: 'synthetic-reviewer' }));
    const media = Array.from({ length: target.mediaCount }, (_,i) => ({ _id: `media-${target.slug}-${i}`,
      contentSlug: target.slug, kind: 'illustration', placeholder: true }));
    tables.libraryContent.push(content); tables.evidenceLinks.push(link); tables.contentReviews.push(...reviews); tables.libraryMedia.push(...media);
    mappings.push([content, target.initialFullHash], [preserved(content), target.preservedContentHash],
      [link, target.linkFullHash], [sorted(sources), target.sourcesFullHash], [sorted(reviews), target.reviewsFullHash], [sorted(media), target.mediaFullHash]);
  }
  tables.libraryContent.push({ _id: 'math', slug: 'lsn_early_math', clinicalStatus: 'clinical_review', aiPublicationReleaseId: 'math-active' });
  const map = new Map(await Promise.all(mappings.map(async ([value,digest]) => [await realHash(value),digest] as const)));
  vi.spyOn(hashes, 'sha256Canonical').mockImplementation(async value => { const digest = await realHash(value); return map.get(digest) ?? digest; });
  const db = {
    query(table: string) {
      const conditions: [string,unknown][] = [];
      const q = { eq(k: string, value: unknown) { conditions.push([k,value]); return q; } };
      const terminal = {
        withIndex(_index: string, cb: (builder: typeof q)=>unknown) { cb(q); return terminal; },
        async take(count: number) { return (tables[table] ?? []).filter(row => conditions.every(([k,value])=>row[k]===value)).slice(0,count); },
      }; return terminal;
    },
    async get(id: string) { return Object.values(tables).flat().find(row=>row._id===id) ?? null; },
    patch: vi.fn(async (id: string, value: Row) => {
      const row = await db.get(id); if (!row) throw new Error('Absent fixture row');
      for (const [k,v] of Object.entries(value)) { if (v===undefined) delete row[k]; else row[k]=v; }
    }),
    insert: vi.fn(async (table: string,value: Row) => {
      const id=`${table}-${tables[table].length}`;tables[table].push({...value,_id:id,_creationTime:now}); return id;
    }),
  };
  const ctx = { db };
  // Model Convex's whole-mutation rollback for injected postflight failures.
  async function transaction(input: Row = args) {
    const before=structuredClone(tables);
    try { return await invoke(apply,ctx,input); }
    catch (error) { for (const key of Object.keys(tables)) tables[key]=before[key]; throw error; }
  }
  return { tables,ctx,transaction };
}
afterEach(()=>vi.restoreAllMocks());

describe('exact unpublished three-book source-attribution correction',()=>{
  it('exports internal-only literal-bound functions',()=>{
    for(const fn of [preflight,apply]) {
      const registered=fn as unknown as { isInternal: boolean; exportArgs:()=>string; exportReturns:()=>string };
      expect(registered.isInternal).toBe(true);
      expect(registered.exportArgs()).toContain(releaseId);
      expect(registered.exportArgs()).toContain(snapshotSha256);
      expect(JSON.parse(registered.exportReturns()).type).toBe('object');
    }
    expect(targets).toHaveLength(3);
    expect(targets.every(t=>t.initialReviewRevision===5&&t.desiredReviewRevision===6)).toBe(true);
  });
  it('changes only the permitted metadata/review fields, preserves history/dependencies/global state, and replays without writes',async()=>{
    vi.spyOn(Date,'now').mockReturnValue(now);const f=await fixture();const before=structuredClone(f.tables);
    expect(await invoke(preflight,f.ctx)).toMatchObject({ phase:'ready',targetCount:3 });
    expect(f.ctx.db.patch).not.toHaveBeenCalled();
    expect(await f.transaction()).toMatchObject({ contentUpdated:3,alreadyApplied:false,humanDecisionsCreated:0,publicationDecisionsMade:0 });
    expect(await invoke(preflight,f.ctx)).toMatchObject({ phase:'applied',auditExact:true });
    for(const [index,target] of targets.entries()) {
      const row=f.tables.libraryContent[index];
      expect(row.reviewRevision).toBe(6);expect(row.clinicalStatus).toBe('clinical_review');
      expect(preserved(row)).toEqual(preserved(before.libraryContent[index]));
      expect((row.data as Row).evidenceSummary).toBe(target.after);
      expect(row.searchText).toBe(searchText(row as never,row.data as Row));
      for(const key of cleared)expect(row[key]).toBeUndefined();
    }
    for(const table of Object.keys(before).filter(t=>!['libraryContent','auditLogs'].includes(t)))expect(f.tables[table],table).toEqual(before[table]);
    expect(f.tables.libraryContent[3]).toEqual(before.libraryContent[3]);
    expect(f.tables.contentReviews.every(row=>row.reviewRevision===5)).toBe(true);
    expect(f.tables.auditLogs).toHaveLength(1);expect(f.tables.auditLogs[0].actorId).toBeUndefined();
    const writes=f.ctx.db.patch.mock.calls.length+f.ctx.db.insert.mock.calls.length;
    vi.spyOn(Date,'now').mockReturnValue(applyBefore+1000);
    expect(await f.transaction()).toMatchObject({ alreadyApplied:true,contentUpdated:0 });
    expect(f.ctx.db.patch.mock.calls.length+f.ctx.db.insert.mock.calls.length).toBe(writes);
  });
  it.each(['content','revision','title','source','duplicate_source','link','extra_type_link','duplicate_content','review_added','review_changed','media','assignment','compile_governance','ai_pointer','ai_release','audit','window'] as const)('fails closed on %s before any write',async drift=>{
    vi.spyOn(Date,'now').mockReturnValue(now);const f=await fixture();const row=f.tables.libraryContent[0];
    if(drift==='content')(row.data as Row).evidenceSummary='Other summary';
    if(drift==='revision')row.reviewRevision=6;
    if(drift==='title')row.titleEn='Changed body';
    if(drift==='source')f.tables.evidenceSources[0].updatedAt=2;
    if(drift==='duplicate_source')f.tables.evidenceSources.push({...f.tables.evidenceSources[0],_id:'source-duplicate'});
    if(drift==='link')f.tables.evidenceLinks[0].sourceIds=[];
    if(drift==='extra_type_link')f.tables.evidenceLinks.push({...f.tables.evidenceLinks[0],_id:'wrong-type-link',kind:'story'});
    if(drift==='duplicate_content')f.tables.libraryContent.push({...row,_id:'duplicate'});
    if(drift==='review_added')f.tables.contentReviews.push({_id:'review-new',contentSlug:row.slug,reviewRevision:6,decision:'approved'});
    if(drift==='review_changed')f.tables.contentReviews[0].decision='changes_requested';
    if(drift==='media')f.tables.libraryMedia[0].url='https://example.org/changed';
    if(drift==='assignment')f.tables.clinicalReviewAssignments.push({_id:'orphan-assignment',contentSlug:row.slug,batchId:'unknown'});
    if(drift==='compile_governance')vi.spyOn(governance,'isRegisteredReleaseContentTarget').mockReturnValue(true);
    if(drift==='ai_pointer')row.aiPublicationReleaseId='other';
    if(drift==='ai_release')f.tables.aiPublicationReleases.push({_id:'ai',targetKey:aiPublicationTargetKey('activity',String(row.slug)),status:'revoked'});
    if(drift==='audit')f.tables.auditLogs.push({_id:'forged',action:'release.three_book_source_attribution_correction',after:'{}'});
    if(drift==='window')vi.spyOn(Date,'now').mockReturnValue(applyBefore);
    await expect(f.transaction()).rejects.toThrow();expect(f.ctx.db.patch).not.toHaveBeenCalled();expect(f.ctx.db.insert).not.toHaveBeenCalled();
  });
  it('blocks static pilot registrations even without persisted assignments',async()=>{
    vi.spyOn(Date,'now').mockReturnValue(now);const f=await fixture();
    const registry=CLINICAL_REVIEW_BATCH_REGISTRY as unknown as Row[];
    registry.push({authority:'pilot',manifest:{items:[{slug:targets[0].slug}]}});
    try {await expect(f.transaction()).rejects.toThrow('refreeze');expect(f.ctx.db.patch).not.toHaveBeenCalled();}
    finally {registry.pop();}
  });
  it('explicit preflight time cannot extend the server mutation window',async()=>{
    vi.spyOn(Date,'now').mockReturnValue(applyBefore);const f=await fixture();
    expect(await invoke(preflight,f.ctx,{...args,checkedAt:now})).toMatchObject({phase:'ready'});
    await expect(f.transaction()).rejects.toThrow('window');expect(f.ctx.db.patch).not.toHaveBeenCalled();
  });
  it.each(['releaseId','snapshotSha256'] as const)('rejects a different %s even in direct handler tests',async key=>{
    vi.spyOn(Date,'now').mockReturnValue(now);const f=await fixture();
    await expect(f.transaction({...args,[key]:'wrong'})).rejects.toThrow('identity');expect(f.ctx.db.patch).not.toHaveBeenCalled();
  });
  it('rolls back all writes when a postflight dependency is altered',async()=>{
    vi.spyOn(Date,'now').mockReturnValue(now);const f=await fixture();const before=structuredClone(f.tables);
    const original=f.ctx.db.patch.getMockImplementation()!;
    f.ctx.db.patch.mockImplementation(async(id,value)=>{await original(id,value);f.tables.libraryMedia[0].note='injected drift';});
    await expect(f.transaction()).rejects.toThrow('postflight');expect(f.tables).toEqual(before);
  });
  it.each(['postimage','audit_hash','new_review'] as const)('blocks replay after %s drift rather than revising again',async drift=>{
    vi.spyOn(Date,'now').mockReturnValue(now);const f=await fixture();await f.transaction();
    if(drift==='postimage')f.tables.libraryContent[0].titleEn='later edit';
    if(drift==='audit_hash')f.tables.auditLogs[0].after=String(f.tables.auditLogs[0].after).replace(/"hash":"[a-f0-9]+"/,'"hash":"'+'0'.repeat(64)+'"');
    if(drift==='new_review')f.tables.contentReviews.push({_id:'new-review',contentSlug:targets[0].slug,reviewRevision:6,decision:'in_review'});
    const writes=f.ctx.db.patch.mock.calls.length;await expect(f.transaction()).rejects.toThrow();expect(f.ctx.db.patch.mock.calls.length).toBe(writes);
  });
});
