// Deterministic local compiler over a pinned private production packet. No network writes.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { build } from "esbuild";

const raw = readFileSync(
  "artifacts/six-picture-stories-preview-20260910/snapshot-1789046068668.json",
);
const sha = (x) => createHash("sha256").update(x).digest("hex");
assert.equal(
  sha(raw),
  "d157c5c7e370f3e005156c28b1254644829408f87ac3a2d0acd5c671256890b3",
);
const packet = JSON.parse(raw);
const built = await build({
  stdin: {
    contents: "export * from './convex/lib/aiAuditHash';",
    resolveDir: process.cwd(),
  },
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
});
const h = await import(
  "data:text/javascript;base64," +
    Buffer.from(built.outputFiles[0].text).toString("base64")
);
const hash = (value) => sha(h.canonicalJson(value));
const sort = (rows) => [...rows].sort((a, b) => a._id.localeCompare(b._id));
const omit = (row, keys) =>
  Object.fromEntries(
    Object.entries(row).filter(([key]) => !keys.includes(key)),
  );
const root = "2026-09-10-six-picture-stories-ai-preview-v1",
  policy = "ai-six-picture-stories-2026-09-10-v1";
const slugs = ["act_picture_story_2_5y", "act_picture_story_3y", "act_picture_story_3_5y", "act_picture_story_4y", "act_picture_story_4_5y", "act_picture_story_5y"];
const aggregateActiveCap = 24;
const sourceSets = slugs.map(() => ["aap-power-of-play-2018", "cdc-milestones-2026"]);
const revisions = [5, 5, 6, 5, 5, 5];
const reviewCounts = [0, 0, 0, 0, 0, 0];
assert.equal(packet.activeReleases.length, 18);
assert.equal(packet.activeReleases.length + slugs.length, aggregateActiveCap);
assert.equal(packet.oldSchedules.length, 7);
const seedRows = JSON.parse(readFileSync("convex/seedData.json"));
const desiredFields = [];
const cleared = [
  "reviewerId",
  "reviewerQualification",
  "reviewerDisplayName",
  "reviewScope",
  "reviewedAt",
  "nextReviewAt",
  "reviewNote",
];
const changed = [
  "titleMm",
  "summaryMm",
  "summaryEn",
  "data",
  "searchText",
  "reviewRevision",
  "updatedAt",
  "aiPublicationReleaseId",
  "aiPublishedAt",
  ...cleared,
];
const targets = packet.targets.map((entry, i) => {
  const { content, link, sources, reviews, media, assignments } = entry,
    slug = slugs[i];
  assert.equal(content.slug, slug);
  assert.equal(content.reviewRevision, revisions[i]);
  assert.equal(content.clinicalStatus, "clinical_review");
  assert.equal(reviews.length, reviewCounts[i]);
  assert.equal(assignments.length, 0);
  assert.equal(entry.contentAudits.length, 0);
  assert.equal(media.length, 2);
  assert(media.every((r) => r.placeholder && !r.url && !r.storageId));
  const seed = seedRows.find((r) => r.slug === slug);
  assert.equal(seed?.type, "activity");
  assert.equal(seed?.clinicalStatus, "clinical_review");
  assert.match(seed?.data?.evidenceSummary ?? "", /optional picture-story activity/i);
  assert.match(seed?.data?.evidenceSummary ?? "", /not a developmental test/i);
  // Only the exact reviewed authored fields, not the entire seed, enter CAS.
  const fields = {
    titleMm: seed.titleMm,
    summaryMm: seed.summaryMm,
    summaryEn: seed.summaryEn,
    data: seed.data,
    searchText: seed.searchText,
  };
  desiredFields.push(fields);
  const desired = {
    ...omit(content, cleared),
    ...fields,
    reviewRevision: revisions[i] + 1,
  };
  const sourceIds = sourceSets[i],
    desiredLink = { ...link, sourceIds };
  return {
    slug,
    currentRevision: revisions[i],
    desiredRevision: revisions[i] + 1,
    contentId: content._id,
    contentUpdatedAt: content.updatedAt,
    contentFullHash: hash(content),
    preservedContentHash: hash(omit(content, changed)),
    currentContentSnapshotHash: hash(h.aiContentSnapshot(content)),
    desiredContentSnapshotHash: hash(h.aiContentSnapshot(desired)),
    linkId: link._id,
    linkUpdatedAt: link.updatedAt,
    linkFullHash: hash(link),
    preservedLinkHash: hash(omit(link, ["sourceIds", "updatedAt"])),
    currentSourceIds: link.sourceIds,
    sourceIds,
    linkSnapshotHash: hash(h.aiEvidenceLinkSnapshot(desiredLink)),
    sourcesFullHash: hash(sort(sources)),
    sourceRows: sources.map((s) => ({
      sourceId: s.sourceId,
      sourceUpdatedAt: s.updatedAt,
      fullHash: hash(s),
      snapshotHash: hash(h.aiEvidenceSnapshot(s)),
      url: s.url,
    })),
    reviewsCount: reviews.length,
    reviewsFullHash: hash(sort(reviews)),
    mediaCount: media.length,
    mediaFullHash: hash(sort(media)),
    assignmentsCount: assignments.length,
  };
});
assert.equal(targets.length, 6);
assert.deepEqual(
  targets.map((target) => target.desiredContentSnapshotHash),
  [
    "0af19edb69ba9d37f85748063a1de41cbdd479d5f6ee06b36854846eb92d6146",
    "a4c2b74bc8c765e63337e2ed0ba70862d3829bc0cf85c86fb74ed76f2070419c",
    "5f0048399dba96956c1558c122cee0e980de46cf0481c4beeecd009c9bbc87f9",
    "c914ab5155b52bfa0e4d9aceeaa21d7b01ade444feb7325dde3859b112aea896",
    "cd3214a4bb407fe7ae3e688c99ce3b5ee8fbb648c81fc66a3506890e74253b02",
    "76c3f96c1b5a46c3683b26148f85ee790e840bdc0d9829ce4a86d9862b14ec73",
  ],
  "Only the six exact independently reviewed successor copies may compile",
);
const preservation = packet.preservation.map(({ rows, ...d }) => ({
  ...d,
  count: rows.length,
  hash: hash(sort(rows)),
}));
const schedules = packet.oldSchedules.map((r) => ({
  id: r._id,
  hash: hash(r),
}));
const preimage = {
  capturedAt: packet.capturedAt,
  captureRawSha256: sha(raw),
  expectedGeneration: 3,
  configFullHash: hash(
    packet.preservation.find((d) => d.table === "aiPublicationConfig").rows[0],
  ),
  preservationHash: hash(preservation),
  oldSchedulesHash: hash(schedules),
  desiredFieldsHash: hash(desiredFields),
  targets,
};
const manifestHash = hash(preimage);
writeFileSync(
  "convex/lib/aiSixPictureStoriesPublication20260910Data.ts",
  "import { SIX_PICTURE_STORY_SUCCESSOR_SLUGS } from './sixPictureStorySuccessorScope';\n" +
    "export const SIX_PICTURE_STORIES_SLUGS = SIX_PICTURE_STORY_SUCCESSOR_SLUGS;\n" +
    "export const SIX_PICTURE_STORIES_AGGREGATE_ACTIVE_CAP = 24 as const;\n" +
    "export const SIX_PICTURE_STORIES_BATCH_GENERATION = 5 as const;\n" +
    "export const SIX_PICTURE_STORIES_RELEASE_ROOT = " +
    JSON.stringify(root) +
    " as const;\n" +
    "export const SIX_PICTURE_STORIES_POLICY_VERSION = " +
    JSON.stringify(policy) +
    " as const;\n" +
    "export const SIX_PICTURE_STORIES_RELEASE_DAYS = 30 as const;\n" +
    "export const SIX_PICTURE_STORIES_PREIMAGE = " +
    JSON.stringify({ ...preimage, snapshotSha256: manifestHash }, null, 2) +
    " as const;\n" +
    "export const SIX_PICTURE_STORIES_DESIRED_FIELDS = " +
    JSON.stringify(desiredFields, null, 2) +
    " as const;\n" +
    "export const SIX_PICTURE_STORIES_PRESERVATION = " +
    JSON.stringify(preservation, null, 2) +
    " as const;\n" +
    "export const SIX_PICTURE_STORIES_OLD_SCHEDULES = " +
    JSON.stringify(schedules, null, 2) +
    " as const;\n" +
    "export const sixPictureStoriesReleaseId = (slug:string):string => SIX_PICTURE_STORIES_RELEASE_ROOT + ':activity:' + slug;\n" +
    "export const sixPictureStoriesContentRunId = (slug:string):string => SIX_PICTURE_STORIES_RELEASE_ROOT + ':content:' + slug;\n" +
    "export const sixPictureStoriesSourceRunId = (slug:string,sourceId:string):string => SIX_PICTURE_STORIES_RELEASE_ROOT + ':evidence:' + slug + ':' + sourceId;\n",
);
const claimScope = "Optional caregiver-child picture-story play: choosing familiar pictures, describing or sequencing events, accepting gestures, words and multiple tellings, and following the child's interest; no age norm, pass/fail, assessment, efficacy, screening, diagnosis or guaranteed-development claim.";
const sourceReport = "Reviewed all six exact picture-story successor copies — act_picture_story_2_5y r6, act_picture_story_3y r6, act_picture_story_3_5y r7, act_picture_story_4y r6, act_picture_story_4_5y r6 and act_picture_story_5y r6 — across every English and Myanmar title, summary/outcome, materials, setup, instruction, safety and variation field. The copy is limited to optional caregiver-child picture play, accepts multiple ways to participate or tell a story, and avoids pass/fail, diagnosis, screening and guaranteed-development language. Evidence is narrowed to the two approved education-scope source registrations aap-power-of-play-2018 and cdc-milestones-2026; the older who-care-for-child-development-2012 attribution is removed from every successor and exact import/seed guards prevent generic restoration. Each successor retains only one URL-less illustration placeholder and one URL-less video placeholder, with no target-specific static illustration mapping and no media-rights or provenance claim. Limitations: CDC provides exact milestone pages for 30 months, 3 years, 4 years and 5 years, not the intermediate 3.5- or 4.5-year bands, so those two activities are optional play variants rather than age norms; no human specialist, clinician or native Myanmar-language editor review or approval is claimed; real media remains blocked pending separate rights/provenance review.";
const semanticReport = "semantic_audit PASS — Independently read every exact EN/MM successor field (title, summary/outcome, materials, setup, instruction, safety, and variation) for activity:act_picture_story_2_5y r6, activity:act_picture_story_3y r6, activity:act_picture_story_3_5y r7, activity:act_picture_story_4y r6, activity:act_picture_story_4_5y r6, and activity:act_picture_story_5y r6. The wording frames optional caregiver-child play, accepts gestures/words/multiple tellings, follows the child's interest, and does not present performance as an assessment. The 3.5y and 4.5y copy contains no age-norm, ability-by-age, or pass/fail claim. Evidence scope is bounded to AAP Power of Play (2018; reaffirmed January 2025; verified 2026-08-19) for play/caregiver interaction and CDC Developmental Milestones (page last reviewed in 2026) for general milestone context; the copy does not claim these sources validate efficacy or establish a 3.5y/4.5y norm, and removed WHO 2012 attribution is absent. The governed canonical AI disclosure remains presentation-layer behavior for publicationLane ai_audited and truthfully says AI-reviewed with no clinician or native Myanmar-language editor approval; seed copy does not duplicate it. Each target has exactly two URL/storage-free placeholders—one offline illustration and one video—and no target-specific asset mapping. No human, clinical, or native-language approval is claimed. Limitations: semantic/editorial review only; no clinician review, native Myanmar-language review, human specialist approval, rendered-device/browser validation, real media, production publication, or efficacy validation.";
const artifact = {
  schemaVersion: 2,
  batchGeneration: 5,
  artifactId: root + "-audit",
  releaseId: root,
  policyVersion: policy,
  provider: "OpenAI",
  auditedWorkspaceBaseCommit: "cd587e97099a472c47de5a07636ddf18e0329e7f",
  model: "Codex agents; exact runtime model identifier not exposed",
  modelVersion: "not exposed",
  auditStartedAt: Date.parse("2026-09-10T13:26:40Z"),
  auditCompletedAt: Date.parse("2026-09-10T13:27:43Z"),
  summary:
    "Independent per-target AI source-scope and bilingual semantic reviews of six exact educational picture-story activity successors. Not human or clinical approval.",
  limitations: [
    "AI-only educational review; no clinician, native Myanmar-language editor, evidence specialist or other human approval.",
    "Current official CDC pages and the registered primary cohort/AAP publication records were reviewed only for the narrow claims represented; no complete clinical evidence appraisal.",
    "No child testing, clinician assessment, rights clearance or device/accessibility testing represented.",
    "Each target retains exactly two URL-free placeholder rows: an offline illustration placeholder and a video placeholder. Static picture-story art and video are not released; no rights-cleared, revision-bound visual approval is represented.",
    "Offline copies may persist until the device reconnects after withdrawal.",
    "auditStartedAt denotes the earliest completed reviewer report, not a measured session start.",
    "All shared source rows and historical human/AI decisions are preserved. Current activity links alone are narrowed to claim-relevant sources.",
    "The global publication config remains at generation 3 so all eighteen existing release postflights remain valid; generation 5 identifies this additive six-picture-story batch only.",
  ],
  targets: targets.map((target) => ({
    type: "activity",
    slug: target.slug,
    contentSnapshotHash: target.desiredContentSnapshotHash,
    evidenceLinkSnapshotHash: target.linkSnapshotHash,
    verdict: "pass",
    mediaCount: 2,
    mediaSnapshotHash: target.mediaFullHash,
    sources: target.sourceIds.map((sourceId) => {
      const s = target.sourceRows.find((row) => row.sourceId === sourceId);
      return {
        sourceId,
        sourceSnapshotHash: s.snapshotHash,
        sourceUrl: s.url,
        urlsChecked: [s.url],
        claimScope,
        evidenceFindings: [
          "The exact registered source snapshots support only the narrow educational scope stated for this activity.",
          "Exact bilingual authored fields use the above narrow educational scope and visible AI/no-clinician/no-native-editor disclosure.",
        ],
        limitations: [
          "Source-scope review is limited to the registered URL and exact activity claims; no diagnosis, screening instrument or guaranteed outcome is represented.",
        ],
      };
    }),
    independentAgentResults: [
      {
        role: "source_research",
        verdict: "pass",
        report: sourceReport,
      },
      {
        role: "semantic_audit",
        verdict: "pass",
        report: semanticReport,
      },
    ],
    contentChecks: [
      "All EN/MM authored fields reviewed",
      "Narrow general education; no diagnosis, treatment, dose or outcome guarantee",
      "Source-specific claim scope with historical metadata preserved",
      "Explicit AI-only/no-clinician/no-native-editor disclosure",
      "Two placeholder-only media rows; no static image asset released",
      "No rights-cleared or revision-bound visual approval represented",
    ],
    limitations: [
      "This is an AI preparatory semantic/source review, not qualified human clinical or native-language approval.",
    ],
  })),
};
writeFileSync(
  "convex/lib/aiSixPictureStoriesPublication20260910Artifact.ts",
  "/** Immutable exact AI-only review reports, never human approval. */\nexport const SIX_PICTURE_STORIES_ARTIFACT = " +
    JSON.stringify(artifact, null, 2) +
    " as const;\nexport const SIX_PICTURE_STORIES_ARTIFACT_HASH = " +
    JSON.stringify(hash(artifact)) +
    " as const;\n",
);
process.stdout.write(
  JSON.stringify(
    {
      manifestHash,
      artifactHash: hash(artifact),
      targets: targets.map((t) => ({
        slug: t.slug,
        desiredHash: t.desiredContentSnapshotHash,
      })),
      preservation: preservation.length,
      schedules: schedules.length,
    },
    null,
    2,
  ) + '\n',
);
