import { v } from 'convex/values';
import { internalMutation, internalQuery, type MutationCtx, type QueryCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { logAudit } from './audit';
import { canonicalJson, sha256Canonical } from './lib/aiAuditHash';
import { aiPublicationTargetKey } from './lib/aiPublicationPolicy';
import { CLINICAL_REVIEW_BATCH_REGISTRY } from './lib/clinicalReviewBatchData';
import { isRegisteredReleaseContentTarget } from './lib/clinicalReviewBatchProvenance';
import { SEVEN_STORY_CORRECTION_SLUGS } from './lib/sevenStoryCorrectionScope';
import { correctedStory, SEVEN_STORY_CLEARED_FIELDS, sortedStoryRows, storyStablePostimage } from './lib/sevenStoryCorrectionHelpers';
import {
  SEVEN_STORY_RELEASE_ID as releaseId, SEVEN_STORY_SNAPSHOT_SHA256 as snapshotSha256,
  SEVEN_STORY_PROPOSAL_SHA256 as proposalSha256, SEVEN_STORY_REVIEW_SHA256 as reviewSha256,
  SEVEN_STORY_DESIRED_COPY_SHA256 as desiredCopySha256, SEVEN_STORY_INDEPENDENT_REVIEW_SHA256 as independentReviewSha256,
  SEVEN_STORY_CAPTURED_AT as capturedAt, SEVEN_STORY_APPLY_BEFORE as applyBefore,
  SEVEN_STORY_TARGETS as targets, SEVEN_STORY_PRESERVATION as preservation,
  SEVEN_STORY_SCHEDULES as schedules,
} from './lib/sevenStoryCorrectionData';

type Context = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;
const action = 'release.seven_story_unpublished_correction';
const identity = { releaseId, snapshotSha256, proposalSha256, reviewSha256 };
const identityValidators = { releaseId: v.literal(releaseId), snapshotSha256: v.literal(snapshotSha256), proposalSha256: v.literal(proposalSha256), reviewSha256: v.literal(reviewSha256) };
function assertIdentity(args: Record<keyof typeof identity, string>): void {
  if (Object.entries(identity).some(([key,value]) => args[key as keyof typeof identity] !== value)) throw new Error('Story correction identity mismatch');
  if (targets.length !== 7 || canonicalJson(targets.map(t=>t.slug)) !== canonicalJson(SEVEN_STORY_CORRECTION_SLUGS)) throw new Error('Story manifest/seed guard scope mismatch');
}
const beforeJson = () => JSON.stringify({ ...identity, desiredCopySha256, independentReviewSha256, targets: targets.map(t=>({slug:t.slug,contentId:t.contentId,initialFullHash:t.initialFullHash,initialLinkHash:t.initialLinkHash,fromRevision:2,toRevision:3,desiredReviewedCopyHash:t.desiredReviewedCopyHash})) });
const afterJson = (updatedAt: number) => JSON.stringify({ ...identity, updatedAt, targets: targets.map(t=>({slug:t.slug,desiredStableHash:t.desiredStableHash,desiredLinkStableHash:t.desiredLinkStableHash})), humanDecisionsCreated:0, publicationDecisionsMade:0, sourcesReviewsMediaAndExistingAiPreserved:true });

/** Each descriptor has a compile-time table/index/key and exact count/hash. No caller may choose a read target. */
async function preservedRows(ctx: Context, descriptor: { table: string; index: string; key: string; count: number }) {
  const { table,index,key,count } = descriptor;
  switch(table) {
    case 'libraryContent': return ctx.db.query('libraryContent').withIndex('by_slug',q=>q.eq('slug',key)).take(count+1);
    case 'evidenceLinks': return ctx.db.query('evidenceLinks').withIndex('by_slug',q=>q.eq('slug',key)).take(count+1);
    case 'evidenceSources': return ctx.db.query('evidenceSources').withIndex('by_source_id',q=>q.eq('sourceId',key)).take(count+1);
    case 'contentReviews': return ctx.db.query('contentReviews').withIndex('by_content',q=>q.eq('contentSlug',key)).take(count+1);
    case 'libraryMedia': return ctx.db.query('libraryMedia').withIndex('by_content',q=>q.eq('contentSlug',key)).take(count+1);
    case 'clinicalReviewAssignments': return ctx.db.query('clinicalReviewAssignments').withIndex('by_exact_target',q=>q.eq('contentSlug',key)).take(count+1);
    case 'clinicalReviewBatches': return ctx.db.query('clinicalReviewBatches').withIndex('by_batch_id',q=>q.eq('batchId',key)).take(count+1);
    case 'clinicalReviewBatchReceipts': return ctx.db.query('clinicalReviewBatchReceipts').withIndex('by_batch_id',q=>q.eq('batchId',key)).take(count+1);
    case 'aiPublicationConfig': return ctx.db.query('aiPublicationConfig').withIndex('by_key',q=>q.eq('key','global')).take(count+1);
    case 'aiPublicationReleases': return index==='by_status'
      ? ctx.db.query('aiPublicationReleases').withIndex('by_status',q=>q.eq('status','active')).take(count+1)
      : ctx.db.query('aiPublicationReleases').withIndex('by_target_key',q=>q.eq('targetKey',key)).take(count+1);
    case 'aiAuditRuns': return index==='by_release_id'
      ? ctx.db.query('aiAuditRuns').withIndex('by_release_id',q=>q.eq('releaseId',key)).take(count+1)
      : ctx.db.query('aiAuditRuns').withIndex('by_run_id',q=>q.eq('runId',key)).take(count+1);
    case 'aiContentAudits': return index==='by_run_id'
      ? ctx.db.query('aiContentAudits').withIndex('by_run_id',q=>q.eq('runId',key)).take(count+1)
      : ctx.db.query('aiContentAudits').withIndex('by_content_revision_and_updated_at',q=>q.eq('contentSlug',key)).take(count+1);
    case 'aiEvidenceAudits': return ctx.db.query('aiEvidenceAudits').withIndex('by_run_id',q=>q.eq('runId',key)).take(count+1);
    case 'auditLogs': return ctx.db.query('auditLogs').withIndex('by_action',q=>q.eq('action',key)).take(count+1);
    default: throw new Error('Unknown preservation manifest table');
  }
}
async function inspect(ctx: Context, now: number) {
  const auditRows = await ctx.db.query('auditLogs').withIndex('by_action',q=>q.eq('action',action)).take(2);
  const audit = auditRows.length===1 ? auditRows[0] : null;
  let updatedAt: number | null = null;
  try { const parsed = JSON.parse(audit?.after ?? '{}'); if(typeof parsed.updatedAt==='number' && Number.isFinite(parsed.updatedAt) && parsed.updatedAt>=capturedAt && parsed.updatedAt<applyBefore) updatedAt=parsed.updatedAt; } catch { /* malformed audit remains blocked */ }
  const auditExact = Boolean(audit && updatedAt!==null && audit.actorId===undefined && audit.entityTable==='libraryContent' && audit.entityId===undefined && audit.summary===releaseId && audit.result==='ok' && audit.before===beforeJson() && audit.after===afterJson(updatedAt));
  const blockers: string[] = [];
  const preservationChecks = await Promise.all(preservation.map(async descriptor=>{
    const rows = await preservedRows(ctx,descriptor);
    return rows.length===descriptor.count && await sha256Canonical(sortedStoryRows<{_id:unknown}>(rows))===descriptor.hash;
  }));
  const scheduleChecks = await Promise.all(schedules.map(async descriptor=>{
    const row = await ctx.db.system.get(descriptor.id as Id<'_scheduled_functions'>);
    return Boolean(row && await sha256Canonical(row)===descriptor.hash);
  }));
  const preservationExact = preservationChecks.every(Boolean) && scheduleChecks.every(Boolean);
  if(!preservationExact) blockers.push('Existing AI previews/config/history/sources/scheduled expiry changed');
  const inspected = await Promise.all(targets.map(async target=>{
    const [contents,links,reviews,media,assignments,releases,contentAudits,sources] = await Promise.all([
      ctx.db.query('libraryContent').withIndex('by_slug',q=>q.eq('slug',target.slug)).take(2),
      ctx.db.query('evidenceLinks').withIndex('by_slug',q=>q.eq('slug',target.slug)).take(2),
      ctx.db.query('contentReviews').withIndex('by_content',q=>q.eq('contentSlug',target.slug)).take(target.reviewsCount+1),
      ctx.db.query('libraryMedia').withIndex('by_content',q=>q.eq('contentSlug',target.slug)).take(target.mediaCount+1),
      ctx.db.query('clinicalReviewAssignments').withIndex('by_exact_target',q=>q.eq('contentSlug',target.slug)).take(1),
      ctx.db.query('aiPublicationReleases').withIndex('by_target_key',q=>q.eq('targetKey',aiPublicationTargetKey('story',target.slug))).take(1),
      ctx.db.query('aiContentAudits').withIndex('by_content_revision_and_updated_at',q=>q.eq('contentSlug',target.slug)).take(1),
      Promise.all(target.sourceIds.map(id=>ctx.db.query('evidenceSources').withIndex('by_source_id',q=>q.eq('sourceId',id)).take(2))),
    ]);
    const content=contents.length===1 ? contents[0] : null, link=links.length===1 ? links[0] : null;
    const [fullHash,stableHash,linkHash,linkStableHash,sourcesHash,reviewsHash,mediaHash] = await Promise.all([
      sha256Canonical(content),sha256Canonical(content?storyStablePostimage(content):null),sha256Canonical(link),sha256Canonical(link?storyStablePostimage(link):null),
      sha256Canonical(sortedStoryRows(sources.flat())),sha256Canonical(sortedStoryRows(reviews)),sha256Canonical(sortedStoryRows(media)),
    ]);
    const identityExact = Boolean(content && content._id===target.contentId && content._creationTime===target.contentCreationTime && content.type==='story' && content.clinicalStatus==='clinical_review' && content.aiPublicationReleaseId===undefined && content.aiPublishedAt===undefined && releases.length===0 && contentAudits.length===0 && link?._id===target.linkId && link.kind==='story');
    const dependenciesExact = sources.every(rows=>rows.length===1) && sourcesHash===target.sourcesFullHash && reviews.length===target.reviewsCount && reviewsHash===target.reviewsFullHash && media.length===target.mediaCount && mediaHash===target.mediaFullHash;
    const governed = assignments.length!==0 || isRegisteredReleaseContentTarget('story',target.slug) || CLINICAL_REVIEW_BATCH_REGISTRY.some(r=>r.manifest.items.some(item=>item.slug===target.slug));
    const initialMatches = identityExact && fullHash===target.initialFullHash && content?.reviewRevision===2 && content.updatedAt===target.initialUpdatedAt && linkHash===target.initialLinkHash;
    const desiredMatches = Boolean(identityExact && auditExact && content && stableHash===target.desiredStableHash && content.reviewRevision===3 && content.updatedAt===updatedAt && SEVEN_STORY_CLEARED_FIELDS.every(field=>content[field]===undefined) && linkStableHash===target.desiredLinkStableHash && (target.linkChanges ? link?.updatedAt===updatedAt : linkHash===target.initialLinkHash));
    if(!identityExact)blockers.push(`Story identity/status/AI state changed: ${target.slug}`);
    if(!dependenciesExact)blockers.push(`Story source/history/media preimage changed: ${target.slug}`);
    if(governed)blockers.push(`Registered story assignment requires explicit refreeze: ${target.slug}`);
    return {target,content,link,public:{slug:target.slug,revision:content?.reviewRevision??null,initialMatches,desiredMatches,dependenciesExact}};
  }));
  if(auditRows.length>1 || (auditRows.length===1&&!auditExact))blockers.push('Correction audit duplicated or malformed');
  let phase: 'ready'|'applied'|'blocked'='blocked';
  if(!blockers.length && auditRows.length===0 && inspected.every(t=>t.public.initialMatches)) {
    if(!Number.isFinite(now)||now<capturedAt||now>=applyBefore)blockers.push('Correction window is not open'); else phase='ready';
  } else if(!blockers.length && auditExact && inspected.every(t=>t.public.desiredMatches))phase='applied';
  else if(!blockers.length)blockers.push('Exact story preimage/postimage mismatch');
  return {inspected,result:{...identity,phase: blockers.length?'blocked' as const:phase,targetCount:7 as const,auditRows:auditRows.length,auditExact,preservationExact,updatedAt:auditExact?updatedAt:null,blockers:[...new Set(blockers)].sort(),targets:inspected.map(t=>t.public)}};
}
const resultValidator = v.object({...identityValidators,phase:v.union(v.literal('ready'),v.literal('applied'),v.literal('blocked')),targetCount:v.literal(7),auditRows:v.number(),auditExact:v.boolean(),preservationExact:v.boolean(),updatedAt:v.union(v.number(),v.null()),blockers:v.array(v.string()),targets:v.array(v.object({slug:v.string(),revision:v.union(v.number(),v.null()),initialMatches:v.boolean(),desiredMatches:v.boolean(),dependenciesExact:v.boolean()}))});
export const preflight = internalQuery({
  args:{...identityValidators,checkedAt:v.number()},returns:resultValidator,
  handler:async(ctx,args)=>{assertIdentity(args);return(await inspect(ctx,args.checkedAt)).result;},
});
export const apply = internalMutation({
  args:identityValidators,
  returns:v.object({...identityValidators,alreadyApplied:v.boolean(),contentUpdated:v.number(),linksUpdated:v.number(),updatedAt:v.number(),humanDecisionsCreated:v.literal(0),publicationDecisionsMade:v.literal(0)}),
  handler:async(ctx,args)=>{
    assertIdentity(args);const now=Date.now(),before=await inspect(ctx,now);
    const response=(alreadyApplied:boolean,updatedAt:number)=>({...identity,alreadyApplied,contentUpdated:alreadyApplied?0:7,linksUpdated:alreadyApplied?0:1,updatedAt,humanDecisionsCreated:0 as const,publicationDecisionsMade:0 as const});
    if(before.result.phase==='applied'&&before.result.updatedAt!==null)return response(true,before.result.updatedAt);
    if(before.result.phase!=='ready')throw new Error(`Seven-story correction blocked: ${before.result.blockers.join('; ')}`);
    // All exact dependencies have been read before the first write. Convex OCC is the transaction guard.
    for(const {target,content,link} of before.inspected){
      if(!content||!link)throw new Error('Exact story target disappeared');
      const desired=correctedStory(content,target.patches);
      if(await sha256Canonical(storyStablePostimage(desired))!==target.desiredStableHash)throw new Error('Compiled story patch/postimage mismatch');
      await ctx.db.patch(content._id,{data:desired.data,source:desired.source as string,titleMm:desired.titleMm as string,summaryEn:desired.summaryEn as string|undefined,summaryMm:desired.summaryMm as string|undefined,searchText:desired.searchText as string,reviewRevision:3,clinicalStatus:'clinical_review',reviewerId:undefined,reviewerDisplayName:undefined,reviewerQualification:undefined,reviewScope:undefined,reviewedAt:undefined,nextReviewAt:undefined,reviewNote:undefined,updatedAt:now});
      if(target.linkChanges)await ctx.db.patch(link._id,{sourceIds:[...target.sourceIds],updatedAt:now});
    }
    await logAudit(ctx,null,action,'libraryContent',undefined,releaseId,{result:'ok',before:beforeJson(),after:afterJson(now)});
    const after=await inspect(ctx,now);
    if(after.result.phase!=='applied')throw new Error(`Seven-story postflight failed; transaction rolled back: ${after.result.blockers.join('; ')}`);
    return response(false,now);
  },
});
