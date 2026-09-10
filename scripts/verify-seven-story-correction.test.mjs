import test from 'node:test';
import assert from 'node:assert/strict';
import { verifySevenStoryCorrection } from './verify-seven-story-correction.mjs';
const slugs=['st_little_seed','st_ba_ba_sounds','st_when_i_feel_angry','st_taking_turns','st_goodnight_moon_friend','st_visit_to_doctor','st_sharing_mango'];
function fixture() {
  const common={deployment:'synthetic',config:[{enabled:true,generation:3}],activeReleases:[1,2,3],preservedTargets:[{content:'preserved'}],preservationReceipts:[],scheduledExpiries:[]};
  const before={...common,capturedAt:100,targets:slugs.map((slug,i)=>({
    content:{_id:'c'+i,slug,type:'story',titleMm:'title',titleEn:'title',tags:[],source:'old',data:{body:{en:'Story.',mm:'ပုံပြင်။'}},clinicalStatus:'clinical_review',reviewRevision:2,updatedAt:50,reviewerDisplayName:'historical'},
    link:{_id:'l'+i,sourceIds:['background',...(i===0?['hc-choking-prevention-2026']:[])],updatedAt:50},
    sources:[{_id:'s',sourceId:'background'},...(i===0?[{_id:'hc',sourceId:'hc-choking-prevention-2026'}]:[])],
    reviews:[{_id:'r'+i,decision:'approved',reviewRevision:1}],media:[],assignments:[],batches:[],batchReceipts:[],releases:[],runs:[],contentAudits:[],evidenceAudits:[],historicalSources:[],
  }))};
  const proposal={targets:slugs.map((slug,i)=>({slug,revision:2,patches:[{path:'source',before:'old',after:'fiction'}],additionalEvidenceLinkProposal:i===6?{before:['background'],after:['background','hc-choking-prevention-2026']}:null}))};
  const after=structuredClone(before);after.capturedAt=200;
  for(const t of after.targets) {
    t.content.source='fiction';t.content.reviewRevision=3;t.content.updatedAt=150;
    delete t.content.reviewerDisplayName;
    t.content.searchText='title title   Story. ပုံပြင်။'.toLowerCase();
    if(t.content.slug==='st_sharing_mango') {
      t.link.sourceIds.push('hc-choking-prevention-2026');t.link.updatedAt=150;
      t.sources.push({_id:'hc',sourceId:'hc-choking-prevention-2026'});
    }
  }
  return {before,after,proposal};
}
test('accepts exact seven correction fixtures without human/publication changes',()=>{
  const f=fixture();assert.equal(verifySevenStoryCorrection(f.before,f.after,f.proposal).verified,true);
});
test('rejects unauthorized or drifted before/after/proposal states',()=>{
  const changes=[
    f=>{f.after.targets[0].content.clinicalStatus='published';},
    f=>{f.after.targets[0].content.aiPublishedAt=150;},
    f=>{f.after.targets[0].reviews.push({_id:'fake-human-approval'});},
    f=>{f.after.targets[0].content.data.body.en='Other';},
    f=>{f.after.targets[0].sources[0].reviewStatus='approved';},
    f=>{f.after.targets[0].media.push({_id:'unexpected'});},
    f=>{f.after.config[0].generation=4;},
    f=>{f.after.preservedTargets[0].content='changed';},
    f=>{f.after.targets[0].content.updatedAt=151;},
    f=>{f.after.targets[0].content.reviewRevision=2;},
    f=>{f.proposal.targets[0].patches.push({path:'clinicalStatus',before:'clinical_review',after:'published'});},
    f=>{f.proposal.targets[0].patches.push(f.proposal.targets[0].patches[0]);},
    f=>{f.after.targets.pop();},
  ];
  for(const change of changes){const f=fixture();change(f);assert.throws(()=>verifySevenStoryCorrection(f.before,f.after,f.proposal));}
});
