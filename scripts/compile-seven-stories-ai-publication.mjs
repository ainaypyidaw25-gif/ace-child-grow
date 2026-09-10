// Local deterministic compiler; no network/deploy/production mutations.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { build } from "esbuild";
const sha = (x) => createHash("sha256").update(x).digest("hex");
const files = {
  snapshot: [
    "artifacts/seven-story-preflight-20260910/snapshot-1789023135798.json",
    "43032a73f71eb6b4546b3e2834077ff086a5937aa57e38cbe081b198925c1689",
  ],
  source: [
    "artifacts/story-release-20260910/source-review.json",
    "989a4546282710f6dc855ddd2c8ab4e0af2a8127ea2970dc3ffc0971d5037524",
  ],
  desired: [
    "artifacts/story-release-20260910/desired-reviewed-copy.json",
    "2bbe2f809f9dd77f3bf206a99c06fecdda0c6e46de39fb30b36f74973fe4e45d",
  ],
  independent: [
    "artifacts/story-release-20260910/independent-semantic-review.json",
    "84f5cca99cf8cf768a8c6fe231801a600f17986166a7743cb6df05f7e9f44158",
  ],
};
const packets = Object.fromEntries(
  Object.entries(files).map(([key, [path, expected]]) => {
    const raw = readFileSync(path);
    assert.equal(sha(raw), expected);
    return [key, JSON.parse(raw)];
  }),
);
const bundled = await build({
  stdin: {
    contents: `export * from './convex/lib/aiAuditHash';export * from './convex/lib/sevenStoryCorrectionData';export * from './convex/lib/sevenStoryCorrectionScope';`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
});
const h = await import(
    `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString("base64")}`
  ),
  hash = (x) => sha(h.canonicalJson(x)),
  sorted = (x) =>
    [...x].sort((a, b) => String(a._id).localeCompare(String(b._id)));
const { snapshot, source, desired, independent } = packets;
assert.deepEqual(
  snapshot.targets.map((t) => t.content.slug),
  [...h.SEVEN_STORY_CORRECTION_SLUGS],
);
const root = "2026-09-10-seven-stories-ai-preview-v1",
  policy = "ai-fiction-seven-stories-2026-09-10-v1";
const auditCompletedAt = Date.parse(independent.reviewCompletedAt),
  auditStartedAt = Date.parse(source.checkedAt);
assert(
  Number.isFinite(auditCompletedAt) &&
    auditCompletedAt >= Date.parse(desired.reviewCompletedAt),
);
const limitations = [
  ...source.limitations,
  ...independent.limitations,
  "Exact runtime model identifier and version were not exposed; no model identity is inferred.",
  "The start timestamp records the first reported source-check completion, not a measured session start.",
  "This release is fictional general education only; no clinician, native-editor or human approval is created.",
  "Existing required human reviews remain incomplete and unchanged; AI disclosure is a separate release lane.",
  "Downloaded offline copies can persist until a device reconnects after withdrawal.",
];
const artifact = {
  schemaVersion: 2,
  artifactId: `${root}-audit`,
  releaseId: root,
  policyVersion: policy,
  provider: "OpenAI",
  model: "Codex agents; exact runtime model identifier not exposed",
  modelVersion: "not exposed",
  auditedWorkspaceBaseCommit:
    "Not recorded in the actual content-review reports; exact reviewed content hashes are authoritative.",
  auditStartedAt,
  auditCompletedAt,
  summary:
    "Actual independent AI source and bilingual copy/safety reports for seven corrected fictional stories; all linked references retained with explicitly limited access and claim scopes. Not human clinical approval.",
  limitations,
  actualReportHashes: Object.fromEntries(
    Object.entries(files)
      .filter(([key]) => key !== "snapshot")
      .map(([key, [, value]]) => [key, value]),
  ),
  actualReports: {
    sourceReview: source,
    desiredReviewedCopy: desired,
    independentSemanticReview: independent,
  },
  targets: snapshot.targets.map((t) => {
    const c = t.content,
      copy = desired.targets.find((x) => x.slug === c.slug),
      second = independent.targets.find((x) => x.slug === c.slug),
      first = source.targets.find((x) => x.slug === c.slug);
    assert.equal(c.reviewRevision, 3);
    assert.equal(c.clinicalStatus, "clinical_review");
    assert.equal(hash(h.aiContentSnapshot(c)), copy.desiredReviewedCopyHash);
    assert.equal(hash(h.aiContentSnapshot(c)), second.desiredContentHash);
    assert.deepEqual(t.link.sourceIds, copy.desiredSourceIds);
    assert.deepEqual(t.link.sourceIds, second.desiredSourceIds);
    assert.equal(
      second.disposition,
      "AI_copy_safety_pass_for_fictional_general_education_only",
    );
    assert.equal(second.humanApprovalGranted, false);
    assert.equal(
      first.desiredDisposition,
      "AI_preparatory_pass_after_exact_corrections_and_disclosure",
    );
    return {
      type: "story",
      slug: c.slug,
      contentSnapshotHash: copy.desiredReviewedCopyHash,
      evidenceLinkSnapshotHash: hash(h.aiEvidenceLinkSnapshot(t.link)),
      mediaSnapshotHash: hash(sorted(t.media)),
      mediaCount: t.media.length,
      verdict: "pass",
      sources: t.link.sourceIds.map((id) => {
        const s = t.sources.find((s) => s.sourceId === id),
          r = source.sourceReviews.find((s) => s.sourceId === id);
        assert(s && r);
        assert.equal(r.verdict, "verified_for_limited_background_scope");
        return {
          sourceId: id,
          sourceSnapshotHash: hash(h.aiEvidenceSnapshot(s)),
          sourceUrl: s.url,
          urlsChecked: [
            ...new Set(r.urlsChecked ?? r.urls ?? [r.registeredUrl]),
          ],
          claimScope: r.scope,
          evidenceFindings: [
            `Actual check ${r.checkedAt}; access mode: ${r.mode}.`,
            JSON.stringify(r),
          ],
          limitations: [
            `Evidence reviewed only at access level: ${r.mode}; not full-text verification unless expressly recorded.`,
            r.scope,
            "Supports limited contextual background, not efficacy, developmental prediction, author endorsement or clinical approval.",
          ],
        };
      }),
      independentAgentResults: [
        {
          role: "source_research",
          verdict: "pass",
          report: `Actual source review hash ${files.source[1]}; final assembled-copy review ${desired.reviewCompletedAt}; ${JSON.stringify(first.findings)}`,
        },
        {
          role: "semantic_audit",
          verdict: "pass",
          report: `Actual independent report hash ${files.independent[1]}; completed ${independent.reviewCompletedAt}; ${JSON.stringify(second.findings)}`,
        },
      ],
      contentChecks: [
        ...second.reviewScope,
        `Exact reviewed revision 3 hash ${second.desiredContentHash}.`,
        ...second.findings.map((f) => f.finding),
      ],
      limitations: [
        ...(first.actualCheckedScope ?? []),
        `Editorial age/category ${c.ageGroupKey}/${c.category}; not publisher validation of this story for an individual child.`,
        ...second.reviewScope.filter((s) => /media/i.test(s)),
      ],
    };
  }),
};
const stripPointers = (c) =>
  Object.fromEntries(
    Object.entries(c).filter(
      ([k]) => !["aiPublicationReleaseId", "aiPublishedAt"].includes(k),
    ),
  );
const preimage = {
  snapshotSha256: files.snapshot[1],
  capturedAt: snapshot.capturedAt,
  targets: snapshot.targets.map((t) => {
    for (const k of [
      "assignments",
      "batches",
      "batchReceipts",
      "releases",
      "runs",
      "contentAudits",
      "evidenceAudits",
    ])
      assert.equal(t[k].length, 0);
    assert(t.media.every((m) => m.placeholder && !m.url && !m.storageId));
    return {
      slug: t.content.slug,
      contentId: t.content._id,
      contentUpdatedAt: t.content.updatedAt,
      contentFullHash: hash(t.content),
      preservedContentHash: hash(stripPointers(t.content)),
      linkId: t.link._id,
      linkFullHash: hash(t.link),
      sourceIds: t.link.sourceIds,
      sourcesFullHash: hash(sorted(t.sources)),
      reviewsCount: t.reviews.length,
      reviewsFullHash: hash(sorted(t.reviews)),
      mediaCount: t.media.length,
      mediaFullHash: hash(sorted(t.media)),
    };
  }),
};
// Reuse already compiled immutable old-three guard descriptors, with a fresh full capture equality check.
const oldRaw = readFileSync(
  "artifacts/seven-story-preflight-20260910/snapshot-1789021939797.json",
);
assert.equal(
  sha(oldRaw),
  "75d512f5f02975c9291ef0e188eb376fbfed1b61688671b5f8f2878a54c8cc2f",
);
const oldCapture = JSON.parse(oldRaw);
for (const key of [
  "config",
  "activeReleases",
  "preservedTargets",
  "preservationReceipts",
  "scheduledExpiries",
])
  assert.equal(
    hash(snapshot[key]),
    hash(oldCapture[key]),
    `Old-three ${key} drifted`,
  );
const artifactHash = hash(artifact),
  prefix = "convex/lib/aiSevenStoriesPublication20260910";
writeFileSync(
  `${prefix}Artifact.ts`,
  `// Actual AI reports and public source/copy context; no human approval.\nexport const SEVEN_STORIES_ARTIFACT = ${JSON.stringify(artifact, null, 2)} as const;\nexport const SEVEN_STORIES_ARTIFACT_HASH = '${artifactHash}' as const;\n`,
);
writeFileSync(
  `${prefix}Data.ts`,
  `export const SEVEN_STORIES_RELEASE_ROOT = '${root}' as const;\nexport const SEVEN_STORIES_POLICY_VERSION = '${policy}' as const;\nexport const SEVEN_STORIES_RELEASE_DAYS = 30 as const;\nexport const SEVEN_STORIES_SLUGS = ${JSON.stringify([...h.SEVEN_STORY_CORRECTION_SLUGS])} as const;\nexport const SEVEN_STORIES_PREIMAGE = ${JSON.stringify(preimage, null, 2)} as const;\nexport { SEVEN_STORY_PRESERVATION as SEVEN_STORIES_PRESERVATION, SEVEN_STORY_SCHEDULES as SEVEN_STORIES_OLD_SCHEDULES } from './sevenStoryCorrectionData';\nexport const sevenStoriesReleaseId = (slug: string): string => SEVEN_STORIES_RELEASE_ROOT + ':story:' + slug;\nexport const sevenStoriesRunId = (slug: string): string => SEVEN_STORIES_RELEASE_ROOT + ':content:' + slug;\nexport const sevenStoriesSourceRunId = (slug: string, sourceId: string): string => SEVEN_STORIES_RELEASE_ROOT + ':evidence:' + slug + ':' + sourceId;\n`,
);
process.stdout.write(
  JSON.stringify(
    {
      artifactHash,
      targets: 7,
      evidenceAudits: artifact.targets.reduce(
        (n, t) => n + t.sources.length,
        0,
      ),
      auditCompletedAt,
      rawArtifactBytes: Buffer.byteLength(JSON.stringify(artifact)),
    },
    null,
    2,
  ) + "\n",
);
