// Local-only comparison. A matching seed is not approval and must never be auto-imported.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,canonical(v)]));
  return value;
}
export function differences(before, after, path = '') {
  if (JSON.stringify(canonical(before)) === JSON.stringify(canonical(after))) return [];
  const object = v => v !== null && typeof v === 'object';
  if (object(before) && object(after) && Array.isArray(before) === Array.isArray(after)) {
    return [...new Set([...Object.keys(before),...Object.keys(after)])].flatMap(key=>differences(before[key],after[key],`${path}/${key.replaceAll('~','~0').replaceAll('/','~1')}`));
  }
  return [{path,beforePresent:before!==undefined,afterPresent:after!==undefined,before:before??null,after:after??null}];
}
export function worklist(packet, seeds) {
  assert.ok(Array.isArray(packet.targets));
  const seen = new Set();
  return packet.targets.map(target=>{
    const {content,gate,contentHash} = target;
    assert.equal(content.slug,gate.slug);
    assert.ok(!seen.has(gate.slug),`Duplicate ${gate.slug}`); seen.add(gate.slug);
    assert.equal(createHash('sha256').update(JSON.stringify(content)).digest('hex'),contentHash,'Snapshot content was changed');
    assert.equal(content.reviewRevision??content.version??1,gate.revision);
    assert.equal(gate.retired,false);
    const matches=seeds.filter(s=>s.slug===gate.slug); assert.ok(matches.length<=1,'Duplicate seed');
    const seed=matches[0];
    const authoredKeys=['type','slug','ageGroupKey','domainKey','category','titleEn','titleMm','summaryEn','summaryMm','tags','difficulty','durationMinutes','offline','source','data'];
    const pick=row=>Object.fromEntries(authoredKeys.filter(k=>row[k]!==undefined).map(k=>[k,row[k]]));
    return {
      slug:gate.slug,type:gate.type,revision:gate.revision,contentHash,
      humanReviewGaps:gate.missing,specialistReason:gate.specialistReason,
      sourceIds:target.links.flatMap(l=>l.sourceIds),
      sourceAndLinkHash:createHash('sha256').update(JSON.stringify(canonical({links:target.links,sources:target.sources}))).digest('hex'),
      seedPresent:Boolean(seed),seedDifferences:seed?differences(pick(content),pick(seed)):[],
      disposition:'not_approved',automaticImportAllowed:false,
      nextSteps: ['Reconcile exact field differences; a seed match does not prove review.', 'Bind actual AI findings to this revision and source/link snapshot.', ...(gate.specialistReason?['Qualified clinical review is still required.']:[]), 'Retain existing human decisions; obtain missing required review decisions before ordinary publication.'],
    };
  });
}

async function main() {
  assert.equal(process.argv.length,3,'Supply one exact captured snapshot path');
  const input=process.argv[2],raw=readFileSync(input,'utf8'),packet=JSON.parse(raw);
  const bundled=await build({stdin:{contents:'export { CONTENT_SEED } from "./src/content/seed/index.ts";',resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',logLevel:'silent'});
  const {CONTENT_SEED}=await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
  const rows=worklist(packet,CONTENT_SEED);
  const output={capturedAt:packet.capturedAt,generatedAt:new Date().toISOString(),input,inputSha256:createHash('sha256').update(raw).digest('hex'),scope:'AI preparation and seed drift comparison; not human approval, not publication',total:rows.length,withSeedDifferences:rows.filter(r=>r.seedDifferences.length).length,missingSeed:rows.filter(r=>!r.seedPresent).length,rows};
  const directory='artifacts/review-backlog-20260910'; mkdirSync(directory,{recursive:true});
  const prefix=`${directory}/worklist-${Date.now()}`;
  writeFileSync(`${prefix}.json`,JSON.stringify(output,null,2),{mode:0o600,flag:'wx'});
  const lines=['# Remaining review worklist','',`Snapshot: ${packet.capturedAt}; ${rows.length} pending records.`, '', '**Not approved.** This is a field-by-field draft comparison and workflow index. Seed changes are not automatically safe to import. Human decisions and publication gates remain unchanged.','',`Seed differences: ${output.withSeedDifferences}; missing seed: ${output.missingSeed}.`,'','| Item | Revision | Missing reviews | Changed fields |','| --- | ---: | --- | ---: |'];
  for(const r of rows) lines.push(`| [${r.slug}](https://child.acegroup.com.mm/admin/reviews) | ${r.revision} | ${r.humanReviewGaps.join(', ')} | ${r.seedDifferences.length} |`);
  writeFileSync(`${prefix}.md`,lines.join('\n')+'\n',{mode:0o600,flag:'wx'});
  console.log(JSON.stringify({total:output.total,withSeedDifferences:output.withSeedDifferences,missingSeed:output.missingSeed,json:`${prefix}.json`,markdown:`${prefix}.md`},null,2));
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) await main();
