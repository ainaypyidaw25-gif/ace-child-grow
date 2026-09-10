// Deterministic local compiler. Never deploys or mutates production.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';

const raw = readFileSync('artifacts/power-of-play-preview-20260910/snapshot-1789037429767.json');
const sha = x => createHash('sha256').update(x).digest('hex');
assert.equal(sha(raw), 'b93616f1f1b7f55b72da6367c615e822ba97d9978a4989c41dc11816a5873dd4');
const packet = JSON.parse(raw);
const compiled = await build({ stdin: { contents: "export * from './convex/lib/aiAuditHash';", resolveDir: process.cwd() }, bundle: true, platform: 'node', format: 'esm', write: false });
const h = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const hash = value => sha(h.canonicalJson(value));
const sort = rows => [...rows].sort((a,b) => a._id.localeCompare(b._id));
const omit = (row, keys) => Object.fromEntries(Object.entries(row).filter(([key]) => !keys.includes(key)));
const root = '2026-09-10-power-of-play-ai-preview-v1';
const policy = 'ai-power-of-play-lesson-2026-09-10-v1';
const slug = 'lsn_power_of_play';
const { content, link, sources, reviews, media, assignments } = packet.target;
assert.equal(content.slug, slug); assert.equal(content.reviewRevision, 2);
assert.equal(content.clinicalStatus, 'clinical_review');
assert.equal(reviews.length, 0); assert.equal(assignments.length, 0);
assert.equal(packet.activeReleases.length, 11); assert.equal(packet.oldSchedules.length, 4);
const sourceIds = ['aap-power-of-play-2018', 'who-improving-ecd-2020'];
const seed = JSON.parse(readFileSync('convex/seedData.json')).find(row => row.slug === slug);
assert.equal(seed.summaryEn, 'Play offers opportunities for learning and connection.');
assert(seed.data.body.en.startsWith('AI review notice —'));
const desiredFields = { summaryEn: seed.summaryEn, summaryMm: seed.summaryMm, data: seed.data, searchText: seed.searchText };
const desired = { ...content, ...desiredFields, reviewRevision: 3 };
assert.equal(hash(h.aiContentSnapshot(desired)), 'c1707b59c9f53875e45da37581700b732a7d3e8e231d573c321be046c5f72895', 'Only the exact independently reviewed copy may compile');
const desiredLink = { ...link, sourceIds };
const preservation = packet.preservation.map(({rows,...descriptor}) => ({...descriptor,count:rows.length,hash:hash(sort(rows))}));
const schedules = packet.oldSchedules.map(row => ({id:row._id,hash:hash(row)}));
const preservedKeys = ['summaryMm','summaryEn','data','searchText','reviewRevision','updatedAt','aiPublicationReleaseId','aiPublishedAt'];
const preimage = {
  preservationHash: hash(preservation), oldSchedulesHash: hash(schedules), desiredFieldsHash: hash(desiredFields),
  capturedAt: packet.capturedAt, captureRawSha256: sha(raw), contentId: content._id,
  contentUpdatedAt: content.updatedAt, contentFullHash: hash(content),
  preservedContentHash: hash(omit(content, preservedKeys)),
  currentContentSnapshotHash: hash(h.aiContentSnapshot(content)),
  desiredContentSnapshotHash: hash(h.aiContentSnapshot(desired)), desiredRevision: 3,
  linkId: link._id, linkUpdatedAt: link.updatedAt, linkFullHash: hash(link),
  preservedLinkHash: hash(omit(link, ['sourceIds','updatedAt'])),
  currentSourceIds: link.sourceIds, sourceIds,
  linkSnapshotHash: hash(h.aiEvidenceLinkSnapshot(desiredLink)),
  sourcesFullHash: hash(sort(sources)),
  sourceRows: sources.map(source => ({sourceId:source.sourceId,sourceUpdatedAt:source.updatedAt,fullHash:hash(source),snapshotHash:hash(h.aiEvidenceSnapshot(source)),url:source.url})),
  reviewsCount: reviews.length, reviewsFullHash: hash(sort(reviews)),
  mediaCount: media.length, mediaFullHash: hash(sort(media)), assignmentsCount: assignments.length,
  configFullHash: hash(packet.preservation.find(d => d.table === 'aiPublicationConfig').rows[0]),
  expectedGeneration: 3,
};
const manifestHash = hash(preimage);
const output = `export { POWER_OF_PLAY_SLUG } from './powerOfPlayScope';\nexport const POWER_OF_PLAY_RELEASE_ROOT = ${JSON.stringify(root)} as const;\nexport const POWER_OF_PLAY_POLICY_VERSION = ${JSON.stringify(policy)} as const;\nexport const POWER_OF_PLAY_RELEASE_DAYS = 30 as const;\nexport const POWER_OF_PLAY_PREIMAGE = ${JSON.stringify({...preimage,snapshotSha256:manifestHash},null,2)} as const;\nexport const POWER_OF_PLAY_DESIRED_FIELDS = ${JSON.stringify(desiredFields,null,2)} as const;\nexport const POWER_OF_PLAY_PRESERVATION = ${JSON.stringify(preservation,null,2)} as const;\nexport const POWER_OF_PLAY_OLD_SCHEDULES = ${JSON.stringify(schedules,null,2)} as const;\nexport const POWER_OF_PLAY_RELEASE_ID = '${root}:lesson:${slug}' as const;\nexport const POWER_OF_PLAY_CONTENT_RUN_ID = '${root}:content:${slug}' as const;\nexport const powerOfPlaySourceRunId = (sourceId: string): string => '${root}:evidence:${slug}:' + sourceId;\n`;
writeFileSync('convex/lib/aiPowerOfPlayPublication20260910Data.ts', output);
const artifact = {
  schemaVersion: 2, artifactId: root + '-audit', releaseId: root, policyVersion: policy,
  provider: 'OpenAI', model: 'Codex agents; exact runtime model identifier not exposed', modelVersion: 'not exposed',
  auditedWorkspaceBaseCommit: '5573b4b25170069fe27f423738943e14f8ccda30',
  auditStartedAt: Date.parse('2026-09-10T10:41:14Z'), auditCompletedAt: Date.parse('2026-09-10T10:54:35Z'),
  summary: 'Two independent AI source-scope and bilingual semantic reviews of the exact corrected general-education power-of-play lesson. Not human or clinical approval.',
  limitations: [
    'AI review only; no clinician, native Myanmar-language editor, evidence specialist or other human approval is created.',
    'AAP was reviewed at official PubMed abstract level; publisher full-text retrieval failed. WHO was reviewed at its official 2020 overview only; guideline download failed.',
    'WHO recommendations concern the first three years; this lesson makes no numeric-age efficacy claim or individual outcome guarantee.',
    'No original trial appraisal, clinician assessment, rights clearance, child testing, accessibility or device testing is represented.',
    'No media is released: exactly one illustration placeholder has no URL or storage object. Stored quiz is not rendered by the current lesson UI.',
    'Existing source records and prior human/AI review history remain unchanged; two historical source links are removed only from this lesson.',
    'auditStartedAt records the first completed reviewer report, not a measured agent-session start.',
    'Downloaded offline copies can persist until a device reconnects after withdrawal.',
  ],
  targets: [{
    type: 'lesson', slug, contentSnapshotHash: preimage.desiredContentSnapshotHash,
    evidenceLinkSnapshotHash: preimage.linkSnapshotHash, verdict: 'pass',
    sources: sourceIds.map(sourceId => {
      const source = sources.find(s => s.sourceId === sourceId);
      const aap = sourceId === 'aap-power-of-play-2018';
      return { sourceId, sourceSnapshotHash: hash(h.aiEvidenceSnapshot(source)), sourceUrl: source.url,
        claimScope: aap ? 'Developmentally appropriate play and nurturing caregiver relationships as opportunities for language, learning and connection; no superiority, dosage or guaranteed outcome.' : 'Responsive caregiving and opportunities for early learning; no numeric-age efficacy or clinical assessment claim.',
        urlsChecked: [source.url],
        evidenceFindings: [aap ? 'Official PubMed abstract of the 2018 AAP clinical report supports developmentally appropriate play and nurturing relationships.' : 'Official WHO overview dated 5 March 2020 supports responsive care and early learning in the first three years.', 'The exact successor copy uses modest opportunity wording, responsive interaction and pauses, and removes guaranteed development or best-learning claims.'],
        limitations: [aap ? 'Abstract-only review; publisher full-text retrieval failed. No 2026 edition or complete evidence appraisal claimed.' : 'Official overview only; underlying guideline download failed. WHO age scope must not be extrapolated as an efficacy claim for all ages.'],
      };
    }),
    mediaCount: 1, mediaSnapshotHash: preimage.mediaFullHash,
    independentAgentResults: [
      { role: 'source_research', verdict: 'pass', report: '/root/two_story_source_review completed 2026-09-10T10:41:14Z: current r2 blocked; exact narrow successor AI-preparatory pass. AAP abstract and WHO overview support responsive learning/connection without universal best, guaranteed growth or household-object assumptions. Not human, clinical or native-editor approval.' },
      { role: 'semantic_audit', verdict: 'pass', report: '/root/publication_gate_audit completed 2026-09-10T10:54:35Z: independently read every EN/MM authored field of the exact c1707b59c9f53875e45da37581700b732a7d3e8e231d573c321be046c5f72895 successor and independently opened AAP abstract and WHO overview. Equivalent modest child-led responsive-play wording, no dose, comparison, guaranteed benefit, screening, treatment or urgency. Explicit AI/no-human disclosure truthful; readingMinutes is reading estimate.' },
    ],
    contentChecks: ['Full EN/MM title, summary, objective, body, quiz, takeaway and action inspected', 'Modest general education; no clinical decision or efficacy guarantee', 'No household-object safety assumption or best-learning claim', 'Exact AAP 2018 and WHO 2020 source order', 'Explicit AI-only/no-human-specialist disclosure', 'One placeholder-only media row; no released visual asset'],
    limitations: ['Preparatory AI copy/source review only, not specialist approval.', 'WHO overview concerns first three years; copy does not assert an age-specific result.'],
  }],
};
writeFileSync('convex/lib/aiPowerOfPlayPublication20260910Artifact.ts', '/** Immutable exact AI-only reviews. No human approval is asserted. */\nexport const POWER_OF_PLAY_ARTIFACT = ' + JSON.stringify(artifact, null, 2) + ' as const;\nexport const POWER_OF_PLAY_ARTIFACT_HASH = ' + JSON.stringify(hash(artifact)) + ' as const;\n');
process.stdout.write(JSON.stringify({manifestHash,desiredContentSnapshotHash:preimage.desiredContentSnapshotHash,linkSnapshotHash:preimage.linkSnapshotHash,preservation:preservation.length,schedules:schedules.length}) + '\n');
