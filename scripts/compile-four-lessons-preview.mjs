// Deterministic local compiler over a pinned private production packet. No network writes.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { build } from "esbuild";

const raw = readFileSync(
  "artifacts/four-lessons-preview-20260910/snapshot-1789042589066.json",
);
const sha = (x) => createHash("sha256").update(x).digest("hex");
assert.equal(
  sha(raw),
  "f71d005d870c0c03258d05efedfbfdd42a10eeb8fcfd445585df7f1559ff6ee2",
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
const root = "2026-09-10-four-lessons-ai-preview-v1",
  policy = "ai-four-lessons-2026-09-10-v1";
const slugs = ["lsn_talk_more", "lsn_making_friends", "lsn_creativity", "lsn_prepare_preschool"];
const aggregateActiveCap = 18;
const sourceSets = [
  ["cdc-milestones-2026", "jr-weisleder-2013"],
  ["aap-power-of-play-2018", "cdc-positive-parenting-preschoolers-2026"],
  ["aap-power-of-play-2018", "cdc-positive-parenting-preschoolers-2026"],
  ["cdc-milestones-2026", "cdc-positive-parenting-preschoolers-2026"],
];
const revisions = [2, 3, 5, 4];
const reviewCounts = [0, 0, 1, 3];
assert.equal(packet.activeReleases.length, 14);
assert.equal(packet.activeReleases.length + slugs.length, aggregateActiveCap);
assert.equal(packet.oldSchedules.length, 6);
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
  assert.equal(media.length, 1);
  assert(media.every((r) => r.placeholder && !r.url && !r.storageId));
  const seed = seedRows.find((r) => r.slug === slug);
  assert(seed.data.body.en.startsWith("AI review notice —"));
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
assert.equal(targets.length, 4);
assert.deepEqual(
  targets.map((target) => target.desiredContentSnapshotHash),
  [
    "860d9291725dc482b30d3413f794ae874848d58eb372cc4bfabc03e84933fa9c",
    "bf665cc8c21ecc9c8caac73cb35086d63319009e65c4de33e4577778674b4d61",
    "b23b20277de5cfd6468a8e33fc381e81391612e1d5420403920cce439e08c3b2",
    "a21d64543b067e0603b1a111623f93395437441b6ae1ed5005a4ebff7ed754ac",
  ],
  "Only the four exact independently reviewed successor copies may compile",
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
  "convex/lib/aiFourLessonsPublication20260910Data.ts",
  "import { FOUR_LESSON_SUCCESSOR_SLUGS } from './fourLessonSuccessorScope';\n" +
    "export const FOUR_LESSONS_SLUGS = FOUR_LESSON_SUCCESSOR_SLUGS;\n" +
    "export const FOUR_LESSONS_AGGREGATE_ACTIVE_CAP = 18 as const;\n" +
    "export const FOUR_LESSONS_BATCH_GENERATION = 4 as const;\n" +
    "export const FOUR_LESSONS_RELEASE_ROOT = " +
    JSON.stringify(root) +
    " as const;\n" +
    "export const FOUR_LESSONS_POLICY_VERSION = " +
    JSON.stringify(policy) +
    " as const;\n" +
    "export const FOUR_LESSONS_RELEASE_DAYS = 30 as const;\n" +
    "export const FOUR_LESSONS_PREIMAGE = " +
    JSON.stringify({ ...preimage, snapshotSha256: manifestHash }, null, 2) +
    " as const;\n" +
    "export const FOUR_LESSONS_DESIRED_FIELDS = " +
    JSON.stringify(desiredFields, null, 2) +
    " as const;\n" +
    "export const FOUR_LESSONS_PRESERVATION = " +
    JSON.stringify(preservation, null, 2) +
    " as const;\n" +
    "export const FOUR_LESSONS_OLD_SCHEDULES = " +
    JSON.stringify(schedules, null, 2) +
    " as const;\n" +
    "export const fourLessonsReleaseId = (slug:string):string => FOUR_LESSONS_RELEASE_ROOT + ':lesson:' + slug;\n" +
    "export const fourLessonsContentRunId = (slug:string):string => FOUR_LESSONS_RELEASE_ROOT + ':content:' + slug;\n" +
    "export const fourLessonsSourceRunId = (slug:string,sourceId:string):string => FOUR_LESSONS_RELEASE_ROOT + ':evidence:' + slug + ':' + sourceId;\n",
);
const artifact = {
  schemaVersion: 2,
  batchGeneration: 4,
  artifactId: root + "-audit",
  releaseId: root,
  policyVersion: policy,
  provider: "OpenAI",
  auditedWorkspaceBaseCommit: "c75d2af1d6023e4013a2d379256ef9439d744a2b",
  model: "Codex agents; exact runtime model identifier not exposed",
  modelVersion: "not exposed",
  auditStartedAt: Date.parse("2026-09-10T12:29:44Z"),
  auditCompletedAt: Date.parse("2026-09-10T12:31:15Z"),
  summary:
    "Independent per-target AI source-scope and bilingual semantic reviews of four exact educational lesson successors. Not human or clinical approval.",
  limitations: [
    "AI-only educational review; no clinician, native Myanmar-language editor, evidence specialist or other human approval.",
    "Current official CDC pages and the registered primary cohort/AAP publication records were reviewed only for the narrow claims represented; no complete clinical evidence appraisal.",
    "No child testing, clinician assessment, rights clearance or device/accessibility testing represented.",
    "Each target retains one URL-free offline placeholder row. Static lesson art is not released; no rights-cleared, revision-bound visual approval is represented.",
    "Offline copies may persist until the device reconnects after withdrawal.",
    "auditStartedAt denotes the earliest completed reviewer report, not a measured session start.",
    "All shared source rows and historical human/AI decisions are preserved. Current lesson links alone are narrowed to claim-relevant sources.",
    "The global publication config remains at generation 3 so all fourteen existing release postflights remain valid; generation 4 identifies this additive four-lesson batch only.",
  ],
  targets: targets.map((target, i) => ({
    type: "lesson",
    slug: target.slug,
    contentSnapshotHash: target.desiredContentSnapshotHash,
    evidenceLinkSnapshotHash: target.linkSnapshotHash,
    verdict: "pass",
    mediaCount: 1,
    mediaSnapshotHash: target.mediaFullHash,
    sources: target.sourceIds.map((sourceId) => {
      const s = target.sourceRows.find((row) => row.sourceId === sourceId);
      return {
        sourceId,
        sourceSnapshotHash: s.snapshotHash,
        sourceUrl: s.url,
        urlsChecked: [s.url],
        claimScope: [
          "Developmentally appropriate back-and-forth talk and responsive interaction; no promised language outcome or diagnostic claim.",
          "Supported social play, turn-taking and adult guidance for preschool children; no promised friendship outcome.",
          "Open-ended play and child-led creative exploration; no promised developmental outcome.",
          "Familiar routines and simple preparation for preschool transitions; no guarantee of readiness or distress prevention.",
        ][i],
        evidenceFindings: [
          "The exact registered source snapshots support only the narrow educational scope stated for this lesson.",
          "Exact bilingual authored fields use the above narrow educational scope and visible AI/no-clinician/no-native-editor disclosure.",
        ],
        limitations: [
          "Source-scope review is limited to the registered URL and exact lesson claims; no diagnosis, screening instrument or guaranteed outcome is represented.",
        ],
      };
    }),
    independentAgentResults: [
      {
        role: "source_research",
        verdict: "pass",
        report: [
          "PASS — Exact successor is narrowly supported by the current official CDC developmental-milestones hub (page reviewed in 2026) plus Weisleder & Fernald 2013 PubMed record 24022649. Claims are limited to everyday responsive talk, expanding short phrases and pausing; the stale NHS page and unsupported screen-comparison claim are removed. No screening, diagnosis or individualized speech-language advice is asserted.",
          "PASS — Exact successor is narrowly supported by AAP Power of Play (2018; official publisher marks reaffirmed January 2025) and the official CDC Positive Parenting Tips: Preschoolers page dated February 20, 2026. Claims are limited to play-based practice, turn-taking, using words and peaceful caregiver-guided choices; the 2015 ELOF and mismatched mental-health citation are removed.",
          "PASS — Exact successor is narrowly supported by AAP Power of Play (2018; reaffirmed January 2025) and the official CDC Positive Parenting Tips: Preschoolers page dated February 20, 2026. Claims are limited to open-ended child-led play with simple age-appropriate materials, choice and process-oriented participation; no creativity measurement or predicted ability is claimed.",
          "PASS — Exact successor is narrowly supported by the current official CDC developmental-milestones hub (2026) and the official CDC Positive Parenting Tips: Preschoolers page dated February 20, 2026. Claims are limited to making a new place familiar through story/role-play and offering safe age-appropriate dressing practice; the 2015 ELOF and broad handbook citations are removed.",
        ][i],
      },
      {
        role: "semantic_audit",
        verdict: "pass",
        report: [
          "PASS — Exact English and Myanmar authored fields preserve the same sequence: describe a routine, notice and respond to sounds/gestures/words, slightly expand a short phrase, then pause. The disclosure and assessment limitation are present in both languages; this structural semantic audit is AI-only and is not native-language approval.",
          "PASS — Exact English and Myanmar authored fields align on gradual social-skill development, modeled turn-taking, using words, peaceful caregiver-guided choices, and the one-moment non-diagnosis limitation. Quiz, takeaway, and action remain within that scope; this AI-only comparison is not native-language or clinical approval.",
          "PASS — Exact English and Myanmar authored fields align on open-ended child-led play, simple age-appropriate materials, child choice, and no measurement or prediction of ability. Quiz, takeaway, and action match the body. The preview remains text-only because the legacy static illustration lacks revision-bound rights review; this AI-only comparison is not native-language approval.",
          "PASS — Exact English and Myanmar authored fields align on familiarization through story or role-play, safe age-appropriate dressing practice, child variation, and the explicit non-test/referral boundary. Quiz, takeaway, and action match the body. The preview remains text-only because the legacy static illustration lacks revision-bound rights review; this AI-only comparison is not native-language or clinical approval.",
        ][i],
      },
    ],
    contentChecks: [
      "All EN/MM authored fields reviewed",
      "Narrow general education; no diagnosis, treatment, dose or outcome guarantee",
      "Source-specific claim scope with historical metadata preserved",
      "Explicit AI-only/no-clinician/no-native-editor disclosure",
      "One placeholder-only media row; no static image asset released",
      "No rights-cleared or revision-bound visual approval represented",
    ],
    limitations: [
      "This is an AI preparatory semantic/source review, not qualified human clinical or native-language approval.",
    ],
  })),
};
writeFileSync(
  "convex/lib/aiFourLessonsPublication20260910Artifact.ts",
  "/** Immutable exact AI-only review reports, never human approval. */\nexport const FOUR_LESSONS_ARTIFACT = " +
    JSON.stringify(artifact, null, 2) +
    " as const;\nexport const FOUR_LESSONS_ARTIFACT_HASH = " +
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
