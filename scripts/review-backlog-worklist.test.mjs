import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { differences,worklist } from './review-backlog-worklist.mjs';
const fixture=()=>{
 const content={slug:'x',type:'guide',reviewRevision:2,data:{text:'old'}};
 return {targets:[{content,contentHash:createHash('sha256').update(JSON.stringify(content)).digest('hex'),gate:{slug:'x',type:'guide',revision:2,retired:false,missing:['safety'],specialistReason:null},links:[],sources:[]}]};
};
test('ignores only object key order, not array order',()=>{
 assert.deepEqual(differences({a:1,b:2},{b:2,a:1}),[]);
 assert.equal(differences([1,2],[2,1]).length,2);
});
test('escapes field paths and distinguishes missing from null',()=>{
 const d=differences({'a/b':null},{'a/b':undefined});
 assert.equal(d[0].path,'/a~1b'); assert.equal(d[0].beforePresent,true); assert.equal(d[0].afterPresent,false);
});
test('comparison cannot approve or automatically import',()=>{
 const [r]=worklist(fixture(),[{slug:'x',type:'guide',data:{text:'new'}}]);
 assert.equal(r.disposition,'not_approved'); assert.equal(r.automaticImportAllowed,false);
 assert.deepEqual(r.humanReviewGaps,['safety']); assert.equal(r.seedDifferences[0].path,'/data/text');
});
test('rejects changed snapshot, revision and duplicate targets',()=>{
 let p=fixture();p.targets[0].content.data.text='tampered'; assert.throws(()=>worklist(p,[]));
 p=fixture();p.targets[0].gate.revision=3; assert.throws(()=>worklist(p,[]));
 p=fixture();p.targets.push(p.targets[0]); assert.throws(()=>worklist(p,[]));
});
test('missing seed does not imply safe or matching',()=>{
 const [r]=worklist(fixture(),[]);assert.equal(r.seedPresent,false);assert.equal(r.automaticImportAllowed,false);
});
