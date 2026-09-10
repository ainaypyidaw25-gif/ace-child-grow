// Deterministic local compiler over a pinned private production packet. No network writes.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { build } from "esbuild";

const raw = readFileSync(
  "artifacts/two-lessons-preview-20260910/snapshot-1789040210419.json",
);
const sha = (x) => createHash("sha256").update(x).digest("hex");
assert.equal(
  sha(raw),
  "552a215c2b94b6417ecf5deaff99ea66ae4ecbed4ca4b135e8945d2ce51319ce",
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
const root = "2026-09-10-two-lessons-ai-preview-v1",
  policy = "ai-two-lessons-2026-09-10-v1";
const slugs = ["lsn_what_is_development", "lsn_big_feelings"];
const sourceSets = [
  ["cdc-monitoring-screening-2026"],
  ["aap-toxic-stress-2021"],
];
const revisions = [2, 4];
assert.equal(packet.activeReleases.length, 12);
assert.equal(packet.oldSchedules.length, 5);
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
  assert.equal(reviews.length, 0);
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
assert.deepEqual(targets.map(target => target.desiredContentSnapshotHash), [
  'a0f8a01626152b7b90884b89cbead4bc7c67459c2ca8e005ff5378a40b1d0613',
  '397f62faf40e47d4cc0d49e8b918f97b426506232071f9b5ca20b757a7569533',
], 'Only the independently reviewed exact successor copies may compile');
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
  "convex/lib/aiTwoLessonsPublication20260910Data.ts",
  "export { DEVELOPMENT_FEELINGS_SLUGS as TWO_LESSONS_SLUGS } from './developmentFeelingsScope';\n" +
    "export const TWO_LESSONS_RELEASE_ROOT = " +
    JSON.stringify(root) +
    " as const;\n" +
    "export const TWO_LESSONS_POLICY_VERSION = " +
    JSON.stringify(policy) +
    " as const;\n" +
    "export const TWO_LESSONS_RELEASE_DAYS = 30 as const;\n" +
    "export const TWO_LESSONS_PREIMAGE = " +
    JSON.stringify({ ...preimage, snapshotSha256: manifestHash }, null, 2) +
    " as const;\n" +
    "export const TWO_LESSONS_DESIRED_FIELDS = " +
    JSON.stringify(desiredFields, null, 2) +
    " as const;\n" +
    "export const TWO_LESSONS_PRESERVATION = " +
    JSON.stringify(preservation, null, 2) +
    " as const;\n" +
    "export const TWO_LESSONS_OLD_SCHEDULES = " +
    JSON.stringify(schedules, null, 2) +
    " as const;\n" +
    "export const twoLessonsReleaseId = (slug:string):string => TWO_LESSONS_RELEASE_ROOT + ':lesson:' + slug;\n" +
    "export const twoLessonsContentRunId = (slug:string):string => TWO_LESSONS_RELEASE_ROOT + ':content:' + slug;\n" +
    "export const twoLessonsSourceRunId = (slug:string,sourceId:string):string => TWO_LESSONS_RELEASE_ROOT + ':evidence:' + slug + ':' + sourceId;\n",
);
const artifact = {
  schemaVersion: 2,
  artifactId: root + "-audit",
  releaseId: root,
  policyVersion: policy,
  provider: "OpenAI",
  auditedWorkspaceBaseCommit: "b7a991e82e306fe6fe0b974970412caffa52bc85",
  model: "Codex agents; exact runtime model identifier not exposed",
  modelVersion: "not exposed",
  auditStartedAt: Date.parse("2026-09-10T11:29:41Z"),
  auditCompletedAt: Date.parse("2026-09-10T11:36:30Z"),
  summary:
    "Two independent per-target AI source-scope and bilingual semantic reviews of exact educational development and feelings successors. Not human or clinical approval.",
  limitations: [
    "AI-only educational review; no clinician, native Myanmar-language editor, evidence specialist or other human approval.",
    "CDC official current full webpage reviewed; no linked PDF, screening instrument, clinical tool or US screening-schedule validation is represented.",
    "AAP original 2021 publication bibliographic abstract and selected publisher passages reviewed; no complete clinical evidence appraisal or original-trial review.",
    "AAP publisher notes reaffirmation in May 2026 with reference/data updates; the shared historical 2021 source record is preserved, not relabeled as a new edition.",
    "No child testing, clinician assessment, rights clearance or device/accessibility testing represented. Each target has one URL-free illustration placeholder; no media is published.",
    "Offline copies may persist until the device reconnects after withdrawal.",
    "auditStartedAt denotes the earliest completed reviewer report, not a measured session start.",
    "All shared source rows and historical human/AI decisions are preserved. Current lesson links alone are narrowed to claim-relevant sources.",
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
        urlsChecked: [
          s.url,
          ...(i === 1
            ? [
                "https://publications.aap.org/pediatrics/article/148/2/e2021052582/179805/Preventing-Childhood-Toxic-Stress-Partnering-With",
              ]
            : []),
        ],
        claimScope:
          i === 0
            ? "General developmental monitoring, checklist limits and discussing concerns promptly; not diagnosis or clinical screening."
            : "Safe, stable nurturing relationships offer support for emotional learning; no immediate calming guarantee or distress diagnosis.",
        evidenceFindings: [
          i === 0
            ? "Official CDC full page dated February 16, 2026 distinguishes monitoring and screening and advises discussing concerns without waiting."
            : "Official AAP PubMed record and selected publisher passages support relational health and emotional learning in supportive relationships.",
          "Exact bilingual authored fields use the above narrow educational scope and visible AI/no-clinician/no-native-editor disclosure.",
        ],
        limitations: [
          i === 0
            ? "No linked clinical instruments or PDFs reviewed; no diagnostic cutoffs or US visit schedule imported."
            : "Selected publisher passages and abstract only, not a full clinical appraisal. No emotion-labeling protocol or guaranteed calming result is asserted.",
        ],
      };
    }),
    independentAgentResults:
      i === 0
        ? [
            {
              role: "source_research",
              verdict: "pass",
              report:
                "/root/two_story_source_review completed 2026-09-10T11:29:41Z: blocked original r2 own-pace reassurance; exact narrow successor AI preparatory pass. Official CDC full 2026-02-16 page read. No human, clinician or native-editor approval.",
            },
            {
              role: "semantic_audit",
              verdict: "pass",
              report:
                "/root/publication_gate_audit completed 2026-09-10T11:36:30Z: independently read all exact EN/MM title, summary, objectives, body, quiz, takeaway and action and CDC official full page. Equivalent checklist limitations and prompt discussion of concerns, no diagnosis/treatment/dose/cutoffs. No human or native-editor approval.",
            },
          ]
        : [
            {
              role: "source_research",
              verdict: "pass",
              report:
                "/root/two_story_release completed 2026-09-10T11:30:13Z: current r4 blocked for immediate calming and universal modeling claims. Narrow successor AI-preparatory pass against AAP PubMed abstract and selected publisher passages. Original 2021 metadata remains historical despite publisher 2026 reaffirmation. No clinical or human approval.",
            },
            {
              role: "semantic_audit",
              verdict: "pass",
              report:
                "/root/two_story_source_review completed 2026-09-10T11:34:04Z: independently reviewed every exact proposed EN/MM field including final curly apostrophe in child’s distress. Warm supportive relationships, no guaranteed calming or assessment of distress; explicit AI/no-clinician/no-native-editor disclosure. AI semantic review only, not independent full-text clinical review.",
            },
          ],
    contentChecks: [
      "All EN/MM authored fields reviewed",
      "Narrow general education; no diagnosis, treatment, dose or outcome guarantee",
      "Source-specific claim scope with historical metadata preserved",
      "Explicit AI-only/no-clinician/no-native-editor disclosure",
      "One placeholder-only illustration; no image asset released",
    ],
    limitations: [
      "This is an AI preparatory semantic/source review, not qualified human clinical or native-language approval.",
    ],
  })),
};
writeFileSync(
  "convex/lib/aiTwoLessonsPublication20260910Artifact.ts",
  "/** Immutable exact AI-only review reports, never human approval. */\nexport const TWO_LESSONS_ARTIFACT = " +
    JSON.stringify(artifact, null, 2) +
    " as const;\nexport const TWO_LESSONS_ARTIFACT_HASH = " +
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
