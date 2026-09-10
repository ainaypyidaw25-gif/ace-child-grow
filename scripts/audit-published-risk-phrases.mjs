// Read-only narrow regression scan, not a clinical safety audit.
import { execFileSync } from 'node:child_process';
const query=`export default query({args:{},handler:async(ctx)=>{
const rows=await ctx.db.query('libraryContent').take(1001);if(rows.length>1000)throw new Error('Catalogue audit bound exceeded');
return rows.filter(r=>r.clinicalStatus==='published').map(({slug,reviewRevision,data})=>({slug,reviewRevision,data}));}});`;
const rows=JSON.parse(execFileSync('npx',['--no-install','convex','run','--prod','--inline-query',query],{env:{...process.env,CONVEX_DEPLOYMENT:'prod:graceful-possum-566'},encoding:'utf8',maxBuffer:12000000,stdio:['ignore','pipe','pipe']}));
const needles=['အသက် ၆ လအောက် ကလေးအား ပျားရည်','ကြက်ဆူပေါက်','large beans (supervised)','tie drawers'];
function leaves(value,path='data'){
 if(typeof value==='string')return [{path,text:value}];
 if(value&&typeof value==='object')return Object.entries(value).flatMap(([key,v])=>leaves(v,`${path}.${key}`));return [];
}
const matches=rows.flatMap(r=>leaves(r.data).flatMap(f=>needles.filter(n=>f.text.toLowerCase().includes(n.toLowerCase())).map(needle=>({slug:r.slug,revision:r.reviewRevision,path:f.path,needle,text:f.text}))));
console.log(JSON.stringify({capturedAt:new Date().toISOString(),storedPublishedScanned:rows.length,needles,matches,limitations:['Only four known literal phrases checked. Zero matches is not a medical safety certification.','No mutations or human review approvals.']},null,2));
