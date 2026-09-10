import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const query = `export default query({args:{},handler:async(ctx)=>{
const targets=[];
for(const slug of ['st_waiting_at_clinic','st_first_day_school']) {
const contents=await ctx.db.query('libraryContent').withIndex('by_slug',q=>q.eq('slug',slug)).take(2);
const links=await ctx.db.query('evidenceLinks').withIndex('by_kind_slug',q=>q.eq('kind','story').eq('slug',slug)).take(2);
const sources=[]; for(const id of links[0]?.sourceIds??[]) sources.push(...await ctx.db.query('evidenceSources').withIndex('by_source_id',q=>q.eq('sourceId',id)).take(2));
const reviews=await ctx.db.query('contentReviews').withIndex('by_content',q=>q.eq('contentSlug',slug)).take(101);
const predecessors=await ctx.db.query('aiPublicationReleases').withIndex('by_target_key',q=>q.eq('targetKey','story'+String.fromCharCode(0)+slug)).take(10);
const media=await ctx.db.query('libraryMedia').withIndex('by_content',q=>q.eq('contentSlug',slug)).take(101);
targets.push({slug,contents,links,sources,reviews,predecessors,media});
}
const configs=await ctx.db.query('aiPublicationConfig').withIndex('by_key',q=>q.eq('key','global')).take(2);
const active=await ctx.db.query('aiPublicationReleases').withIndex('by_status',q=>q.eq('status','active')).take(4);
const math=await ctx.db.query('libraryContent').withIndex('by_slug',q=>q.eq('slug','lsn_early_math')).take(2);
return {targets,configs,active,math};}});`;
const raw = JSON.parse(execFileSync('npx', ['--no-install','convex','run','--prod','--inline-query',query], {encoding:'utf8',env:{...process.env,CONVEX_DEPLOYMENT:'prod:graceful-possum-566'},maxBuffer:8000000}));
const canonical = value => JSON.stringify(value, (_k,v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))) : v);
const hash = value => createHash('sha256').update(canonical(value)).digest('hex');
mkdirSync('artifacts/two-stories-20260910',{recursive:true});
const path=`artifacts/two-stories-20260910/${Date.now()}-snapshot.json`;
writeFileSync(path,JSON.stringify(raw,null,2),{mode:0o600,flag:'wx'});
console.log(JSON.stringify({path,hash:hash(raw),targets:raw.targets.map(t=>({slug:t.slug,contentHash:hash(t.contents),sourceHash:hash(t.sources),linkHash:hash(t.links),reviewsHash:hash(t.reviews),mediaCount:t.media.length}))},null,2));
