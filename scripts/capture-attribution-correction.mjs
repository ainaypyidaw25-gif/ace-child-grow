// Bounded, read-only preflight. Stores private content/review snapshots locally.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const slugs = ['act_board_book_point', 'act_lift_the_flap_book', 'act_first_words_book_share'];
const query = `export default query({args:{},handler:async(ctx)=>{
  const targets=[];
  for (const slug of ${JSON.stringify(slugs)}) {
    const content=await ctx.db.query('libraryContent').withIndex('by_slug',q=>q.eq('slug',slug)).take(2);
    const links=await ctx.db.query('evidenceLinks').withIndex('by_kind_slug',q=>q.eq('kind','activity').eq('slug',slug)).take(2);
    const reviews=await ctx.db.query('contentReviews').withIndex('by_content',q=>q.eq('contentSlug',slug)).take(101);
    const assignments=await ctx.db.query('clinicalReviewAssignments').withIndex('by_exact_target',q=>q.eq('contentSlug',slug)).take(33);
    const media=await ctx.db.query('libraryMedia').withIndex('by_content',q=>q.eq('contentSlug',slug)).take(51);
    if(content.length!==1||links.length!==1||reviews.length>100||assignments.length>32||media.length>50)throw new Error('Preflight bound/identity failure: '+slug);
    if(links[0].sourceIds.length>10)throw new Error('Source count bound exceeded');
    const sources=[];
    for (const sourceId of links[0].sourceIds) {
      const rows=await ctx.db.query('evidenceSources').withIndex('by_source_id',q=>q.eq('sourceId',sourceId)).take(2);
      if(rows.length!==1)throw new Error('Source identity failure');
      sources.push(rows[0]);
    }
    const batches=[];
    for (const batchId of new Set(assignments.map(a=>a.batchId))) {
      const rows=await ctx.db.query('clinicalReviewBatches').withIndex('by_batch_id',q=>q.eq('batchId',batchId)).take(2);
      if(rows.length!==1)throw new Error('Batch identity failure');
      batches.push(rows[0]);
    }
    targets.push({content:content[0],link:links[0],reviews,assignments,batches,sources,media});
  }
  return {capturedAt:Date.now(),targets};
}});`;
const raw = execFileSync('npx', ['--no-install','convex','run','--prod','--inline-query',query], {
  encoding:'utf8', maxBuffer:8000000,
  env:{...process.env, CONVEX_DEPLOYMENT:'prod:graceful-possum-566'},
});
const packet=JSON.parse(raw);
const directory='artifacts/attribution-correction-20260910';
mkdirSync(directory,{recursive:true});
const path=directory+'/snapshot-'+packet.capturedAt+'.json';
const serialized=JSON.stringify(packet,null,2);
writeFileSync(path,serialized,{mode:0o600,flag:'wx'});
console.log(JSON.stringify({path,sha256:createHash('sha256').update(serialized).digest('hex'),targets:packet.targets.map(t=>({slug:t.content.slug,revision:t.content.reviewRevision??t.content.version,status:t.content.clinicalStatus,summary:t.content.data.evidenceSummary,reviews:t.reviews.length,assignments:t.assignments.length,batches:t.batches.map(b=>({batchId:b.batchId,status:b.status,authority:b.authority}))}))},null,2));
