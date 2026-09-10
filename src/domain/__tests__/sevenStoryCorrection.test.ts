import { afterEach, describe, expect, it, vi } from 'vitest';
import { apply, preflight } from '../../../convex/sevenStoryCorrection';
import { SEVEN_STORY_RELEASE_ID as releaseId, SEVEN_STORY_SNAPSHOT_SHA256 as snapshotSha256, SEVEN_STORY_PROPOSAL_SHA256 as proposalSha256, SEVEN_STORY_REVIEW_SHA256 as reviewSha256, SEVEN_STORY_CAPTURED_AT as capturedAt, SEVEN_STORY_APPLY_BEFORE as applyBefore, SEVEN_STORY_TARGETS as targets, SEVEN_STORY_PRESERVATION as preservation, SEVEN_STORY_SCHEDULES as schedules } from '../../../convex/lib/sevenStoryCorrectionData';
import { correctedStory, SEVEN_STORY_CLEARED_FIELDS, sortedStoryRows, storyStablePostimage } from '../../../convex/lib/sevenStoryCorrectionHelpers';
import * as hashes from '../../../convex/lib/aiAuditHash';
import { CLINICAL_REVIEW_BATCH_REGISTRY } from '../../../convex/lib/clinicalReviewBatchData';
type Row = Record<string, unknown>;
const realHash=hashes.sha256Canonical, args={releaseId,snapshotSha256,proposalSha256,reviewSha256}, now=capturedAt+1000;
const invoke=(fn:unknown,ctx:unknown,input:Row=args):Promise<Row> => (fn as {_handler:(ctx:unknown,args:Row)=>Promise<Row>})._handler(ctx,fn===preflight?{checkedAt:Date.now(),...input}:input);
function setLeaf(row:Row,path:string,value:string){const keys=path.split('.');let cursor=row;for(const key of keys.slice(0,-1)){if(!cursor[key])cursor[key]={};cursor=cursor[key] as Row;}cursor[keys.at(-1)!]=value;}
/** Synthetic private identities/history and preservation-query buckets mapped to
 * compiled hashes. Real exact copy, patch logic, postimage guards and audit checks
 * run unchanged. Production packet hash recompilation is a separate operator gate. */
async function fixture(){
  const tables:Record<string,Row[]>={libraryContent:[],evidenceLinks:[],evidenceSources:[],contentReviews:[],libraryMedia:[],clinicalReviewAssignments:[],aiPublicationReleases:[],aiContentAudits:[],auditLogs:[]};
  const buckets=new Map<string,Row[]>(),scheduled=new Map<string,Row>(),mappings:[unknown,string][]=[];
  for(const target of targets){
    const row:Row={_id:target.contentId,_creationTime:target.contentCreationTime,slug:target.slug,type:'story',reviewRevision:2,version:1,clinicalStatus:'clinical_review',updatedAt:target.initialUpdatedAt,titleEn:'Synthetic title',titleMm:'Synthetic Myanmar title',summaryEn:'Synthetic summary',summaryMm:'Synthetic Myanmar summary',tags:['fiction'],source:'Synthetic source',data:{body:{en:'Synthetic body',mm:'Synthetic Myanmar body'},activities:[{en:'Synthetic activity',mm:'Synthetic activity Myanmar'}],questions:[{en:'Synthetic question',mm:'Synthetic question Myanmar'}],unmodified:'Preserve this'},searchText:'Initial search',reviewerId:'synthetic-user',reviewerQualification:'Synthetic only',reviewerDisplayName:'Synthetic reviewer',reviewScope:'education',reviewedAt:1,nextReviewAt:2,reviewNote:'Unchanged historical record remains elsewhere'};
    for(const patch of target.patches)setLeaf(row,patch.path,patch.before);
    const link:Row={_id:target.linkId,_creationTime:1,slug:target.slug,kind:'story',sourceIds:target.linkChanges?target.sourceIds.slice(0,-1):[...target.sourceIds],createdAt:1,updatedAt:2};
    const sources=target.sourceIds.map(sourceId=>{let source=tables.evidenceSources.find(s=>s.sourceId===sourceId);if(!source){source={_id:`source-${sourceId}`,sourceId,updatedAt:1,reviewStatus:'approved'};tables.evidenceSources.push(source);}return source;});
    const reviews=Array.from({length:target.reviewsCount},(_,i)=>({_id:`review-${target.slug}-${i}`,contentSlug:target.slug,reviewRevision:2,contentVersion:2,decision:'approved',reviewerId:'synthetic-user'}));
    const media=Array.from({length:target.mediaCount},(_,i)=>({_id:`media-${target.slug}-${i}`,contentSlug:target.slug,placeholder:true}));
    tables.libraryContent.push(row);tables.evidenceLinks.push(link);tables.contentReviews.push(...reviews);tables.libraryMedia.push(...media);
    mappings.push([row,target.initialFullHash],[storyStablePostimage(correctedStory(row,target.patches)),target.desiredStableHash],[link,target.initialLinkHash],[storyStablePostimage({...link,sourceIds:[...target.sourceIds]}),target.desiredLinkStableHash],[sortedStoryRows(sources as Array<Row & {_id:unknown}>),target.sourcesFullHash],[sortedStoryRows(reviews),target.reviewsFullHash],[sortedStoryRows(media),target.mediaFullHash]);
  }
  for(const [di,d]of preservation.entries()){
    const rows=Array.from({length:d.count},(_,i)=>({_id:`preserved-${di}-${i}`,identity:d.key,unchanged:true}));
    buckets.set(`${d.table}:${d.index}:${d.key}`,rows);mappings.push([rows,d.hash]);
  }
  for(const s of schedules){const row={_id:s.id,state:{kind:'pending'},scheduledTime:now+86400000};scheduled.set(s.id,row);mappings.push([row,s.hash]);}
  const mapped=new Map(await Promise.all(mappings.map(async([value,digest])=>[await realHash(value),digest]as const)));
  vi.spyOn(hashes,'sha256Canonical').mockImplementation(async value=>{const digest=await realHash(value);return mapped.get(digest)??digest;});
  const db={
    system:{async get(id:string){return scheduled.get(id)??null;}},
    query(table:string){const conditions:[string,unknown][]=[];let index='';const q={eq(k:string,value:unknown){conditions.push([k,value]);return q;}};const chain={withIndex(i:string,cb:(builder:typeof q)=>unknown){index=i;cb(q);return chain;},async take(count:number){const bucket=buckets.get(`${table}:${index}:${conditions[0]?.[1]}`);return bucket?bucket.slice(0,count):(tables[table]??[]).filter(r=>conditions.every(([k,v])=>r[k]===v)).slice(0,count);}};return chain;},
    async get(id:string){return Object.values(tables).flat().find(r=>r._id===id)??null;},
    patch:vi.fn(async(id:string,patch:Row)=>{const row=await db.get(id);if(!row)throw new Error('Missing fixture row');for(const[k,v]of Object.entries(patch)){if(v===undefined)delete row[k];else row[k]=v;}}),
    insert:vi.fn(async(table:string,row:Row)=>{const id=`${table}-${tables[table].length}`;tables[table].push({...row,_id:id,_creationTime:now});return id;}),
  };
  const ctx={db};
  async function transaction(input:Row=args){const before=structuredClone(tables);try{return await invoke(apply,ctx,input);}catch(e){for(const key of Object.keys(tables))tables[key]=before[key];throw e;}}
  return{tables,buckets,scheduled,ctx,transaction};
}
afterEach(()=>vi.restoreAllMocks());
describe('seven exact unpublished story corrections',()=>{
  it('exposes only literal-bound internal functions',()=>{for(const fn of[preflight,apply]){const registered=fn as unknown as {isInternal:boolean;exportArgs:()=>string;exportReturns:()=>string};expect(registered.isInternal).toBe(true);for(const val of Object.values(args))expect(registered.exportArgs()).toContain(val);expect(JSON.parse(registered.exportReturns()).type).toBe('object');}expect(targets).toHaveLength(7);expect(targets.reduce((n,t)=>n+t.patches.length,0)).toBe(34);expect(targets.filter(t=>t.linkChanges).map(t=>t.slug)).toEqual(['st_sharing_mango']);});
  it('advances r2 to r3, changes exact copy and mango link only, preserves history and three AI previews',async()=>{
    vi.spyOn(Date,'now').mockReturnValue(now);const f=await fixture(),before=structuredClone(f.tables),buckets=structuredClone(f.buckets),scheduled=structuredClone(f.scheduled);
    expect(await invoke(preflight,f.ctx)).toMatchObject({phase:'ready',targetCount:7,preservationExact:true});
    expect(await f.transaction()).toMatchObject({alreadyApplied:false,contentUpdated:7,linksUpdated:1,humanDecisionsCreated:0,publicationDecisionsMade:0});
    expect(await invoke(preflight,f.ctx)).toMatchObject({phase:'applied',auditExact:true});
    for(const[i,t]of targets.entries()){const expected=correctedStory(before.libraryContent[i],t.patches);expected.updatedAt=now;expect(f.tables.libraryContent[i]).toEqual(expected);expect(f.tables.libraryContent[i].reviewRevision).toBe(3);for(const key of SEVEN_STORY_CLEARED_FIELDS)expect(f.tables.libraryContent[i][key]).toBeUndefined();if(!t.linkChanges)expect(f.tables.evidenceLinks[i]).toEqual(before.evidenceLinks[i]);}
    for(const table of Object.keys(before).filter(t=>!['libraryContent','evidenceLinks','auditLogs'].includes(t)))expect(f.tables[table],table).toEqual(before[table]);
    expect(f.buckets).toEqual(buckets);expect(f.scheduled).toEqual(scheduled);expect(f.tables.auditLogs).toHaveLength(1);expect(f.tables.auditLogs[0].actorId).toBeUndefined();
    const writes=f.ctx.db.patch.mock.calls.length+f.ctx.db.insert.mock.calls.length;vi.spyOn(Date,'now').mockReturnValue(applyBefore+1);expect(await f.transaction()).toMatchObject({alreadyApplied:true,contentUpdated:0,linksUpdated:0});expect(f.ctx.db.patch.mock.calls.length+f.ctx.db.insert.mock.calls.length).toBe(writes);
  });
  it.each(['content','revision','source','source_duplicate','link','wrong_type_link','review','media','assignment','ai_release','ai_audit','ai_pointer','config','active_preview','preserved_history','historical_source','schedule','audit','window']as const)('blocks %s drift before writes',async drift=>{
    vi.spyOn(Date,'now').mockReturnValue(now);const f=await fixture(),row=f.tables.libraryContent[0];
    if(drift==='content')row.titleEn='Changed';if(drift==='revision')row.reviewRevision=3;if(drift==='source')f.tables.evidenceSources[0].updatedAt=2;if(drift==='source_duplicate')f.tables.evidenceSources.push({...f.tables.evidenceSources[0],_id:'duplicate'});
    if(drift==='link')f.tables.evidenceLinks[0].sourceIds=[];if(drift==='wrong_type_link')f.tables.evidenceLinks.push({...f.tables.evidenceLinks[0],_id:'other',kind:'activity'});
    if(drift==='review')f.tables.contentReviews.push({_id:'new-review',contentSlug:row.slug,reviewRevision:3,decision:'approved'});if(drift==='media')f.tables.libraryMedia[0].url='https://example.invalid';if(drift==='assignment')f.tables.clinicalReviewAssignments.push({_id:'assignment',contentSlug:row.slug});
    if(drift==='ai_release')f.tables.aiPublicationReleases.push({_id:'release',targetKey:`story\0${row.slug}`,status:'revoked'});if(drift==='ai_audit')f.tables.aiContentAudits.push({_id:'audit',contentSlug:row.slug});if(drift==='ai_pointer')row.aiPublicationReleaseId='other';
    const preservedTable=drift==='config'?'aiPublicationConfig':drift==='active_preview'?'libraryContent':drift==='preserved_history'?'contentReviews':drift==='historical_source'?'evidenceSources':null;
    if(preservedTable){const descriptor=preservation.find(d=>d.table===preservedTable&&d.count>0)!;f.buckets.get(`${descriptor.table}:${descriptor.index}:${descriptor.key}`)![0].unchanged=false;}
    if(drift==='schedule')f.scheduled.get(schedules[0].id)!.state={kind:'canceled'};if(drift==='audit')f.tables.auditLogs.push({_id:'forged',action:'release.seven_story_unpublished_correction',after:'{}'});if(drift==='window')vi.spyOn(Date,'now').mockReturnValue(applyBefore);
    await expect(f.transaction()).rejects.toThrow();expect(f.ctx.db.patch).not.toHaveBeenCalled();expect(f.ctx.db.insert).not.toHaveBeenCalled();
  });
  it('rejects static pilot registration without persisted assignment',async()=>{vi.spyOn(Date,'now').mockReturnValue(now);const f=await fixture();const registry=CLINICAL_REVIEW_BATCH_REGISTRY as unknown as Row[];registry.push({authority:'pilot',manifest:{items:[{slug:targets[0].slug}]}});try{await expect(f.transaction()).rejects.toThrow('refreeze');expect(f.ctx.db.patch).not.toHaveBeenCalled();}finally{registry.pop();}});
  it('does not let stale preflight time extend mutation window',async()=>{vi.spyOn(Date,'now').mockReturnValue(applyBefore);const f=await fixture();expect(await invoke(preflight,f.ctx,{...args,checkedAt:now})).toMatchObject({phase:'ready'});await expect(f.transaction()).rejects.toThrow('window');});
  it.each(['releaseId','snapshotSha256','proposalSha256','reviewSha256']as const)('rejects wrong %s',async key=>{vi.spyOn(Date,'now').mockReturnValue(now);const f=await fixture();await expect(f.transaction({...args,[key]:'wrong'})).rejects.toThrow('identity');expect(f.ctx.db.patch).not.toHaveBeenCalled();});
  it('rolls back all writes when postflight media changes',async()=>{vi.spyOn(Date,'now').mockReturnValue(now);const f=await fixture(),before=structuredClone(f.tables),original=f.ctx.db.patch.getMockImplementation()!;f.ctx.db.patch.mockImplementation(async(id,patch)=>{await original(id,patch);f.tables.libraryMedia[0].injected=true;});await expect(f.transaction()).rejects.toThrow('postflight');expect(f.tables).toEqual(before);});
  it.each(['body','new_review','mango_link','audit_hash']as const)('blocks replay after %s drift',async drift=>{vi.spyOn(Date,'now').mockReturnValue(now);const f=await fixture();await f.transaction();if(drift==='body')f.tables.libraryContent[0].titleMm='later edit';if(drift==='new_review')f.tables.contentReviews.push({_id:'new-review',contentSlug:targets[0].slug,reviewRevision:3});if(drift==='mango_link')f.tables.evidenceLinks.at(-1)!.sourceIds=[];if(drift==='audit_hash')f.tables.auditLogs[0].after=String(f.tables.auditLogs[0].after).replace(proposalSha256,'0'.repeat(64));const writes=f.ctx.db.patch.mock.calls.length;await expect(f.transaction()).rejects.toThrow();expect(f.ctx.db.patch.mock.calls.length).toBe(writes);});
  it('rejects unallowed, duplicate and stale leaf patches',()=>{const row:Row={source:'before',data:{body:{en:'old'}},titleEn:'x',titleMm:'x',tags:[]};expect(()=>correctedStory(row,[{path:'reviewRevision',before:'1',after:'2'}])).toThrow('Unallowed');expect(()=>correctedStory(row,[{path:'source',before:'wrong',after:'new'}])).toThrow('preimage');expect(()=>correctedStory(row,[{path:'source',before:'before',after:'new'},{path:'source',before:'new',after:'newer'}])).toThrow('duplicate');});
});
