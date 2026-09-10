import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const script=fileURLToPath(new URL('./verify-attribution-correction.mjs',import.meta.url));
const proposal=JSON.parse(readFileSync(new URL('../docs/operations/learning-source-attribution-proposals-2026-09-10.json',import.meta.url),'utf8'));
function fixture() {
  const before={targets:proposal.targets.map((t,i)=>({
    content:{_id:'synthetic-'+i,slug:t.slug,version:1,reviewRevision:5,clinicalStatus:'clinical_review',updatedAt:100,searchText:t.before.toLowerCase(),reviewerDisplayName:'Synthetic reviewer',data:{evidenceSummary:t.before,body:'Unchanged synthetic body'}},
    link:{_id:'synthetic-link-'+i},sources:[],reviews:[],media:[],assignments:[],batches:[],
  }))};
  const after=structuredClone(before);
  after.targets.forEach((t,i)=>{
    t.content.data.evidenceSummary=proposal.targets[i].after;
    t.content.searchText=proposal.targets[i].after.toLowerCase();
    t.content.reviewRevision=6;t.content.updatedAt=200;
    delete t.content.reviewerDisplayName;
  });
  return {before,after};
}
function run(fixture) {
  const directory=mkdtempSync(join(tmpdir(),'ace-attribution-readback-test-'));
  try {
    const paths=['before','after'].map(key=>{
      const path=join(directory,key+'.json');
      writeFileSync(path,JSON.stringify(fixture[key]));return path;
    });
    return spawnSync(process.execPath,[script,...paths],{encoding:'utf8',timeout:10000});
  } finally { rmSync(directory,{recursive:true,force:true}); }
}
test('accepts exact three synthetic correction postimages',()=>{
  const result=run(fixture());assert.equal(result.status,0,result.stderr);
  assert.equal(JSON.parse(result.stdout).humanApprovalsAdded,0);
});
test('rejects body, history, publication, revision, source and scope drift',()=>{
  const changes=[
    f=>{f.after.targets[0].content.data.body='Changed';},
    f=>{f.after.targets[0].reviews.push({_id:'new-approval'});},
    f=>{f.after.targets[0].content.clinicalStatus='published';},
    f=>{f.after.targets[0].content.reviewRevision=5;},
    f=>{f.after.targets[0].sources.push({_id:'changed-source'});},
    f=>{f.after.targets.push(structuredClone(f.after.targets[0]));},
  ];
  for (const change of changes) {const f=fixture();change(f);assert.notEqual(run(f).status,0);}
});
