// Local-only exact manifest compiler. Does not call a service or mutate a database.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { build } from "esbuild";
const dir = "artifacts/next-guide-corrections-20260910/";
const inputs = {
  snapshot: [
    dir + "full-state-1789025953704.json",
    "abc77f995b255076555660453256b6a33ef35d211a8ee84ec2cce9edb122241b",
  ],
  proposal: [
    dir + "correction-proposal-consolidated.json",
    "10da3bf48a9be892d68b1dd5e6f5f251260000f51c7011ca0c786417e09ef56c",
  ],
  sources: [
    dir + "source-registration-proposal.json",
    "34499843d41c7c1473747faea53a8d8276bdbf65f8268ab430414e18dab7505a",
  ],
};
const sha = (x) => createHash("sha256").update(x).digest("hex");
const parsed = {};
for (const [key, [path, digest]] of Object.entries(inputs)) {
  const raw = readFileSync(path);
  assert.equal(sha(raw), digest, path);
  parsed[key] = JSON.parse(raw);
}
const { snapshot, proposal, sources } = parsed;
for (const ref of proposal.inputReferences)
  assert.equal(sha(readFileSync(ref.path)), ref.rawSha256, ref.path);
for (const key of ["humanApproval", "clinicalApproval", "publicationApproval"])
  assert.equal(proposal[key], false);
assert.equal(proposal.productionMutations, 0);
const built = await build({
  stdin: {
    contents:
      "export * from './convex/lib/threeGuideCorrectionHelpers';export * from './convex/lib/aiAuditHash';",
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
const hash = (x) => sha(h.canonicalJson(x)),
  sorted = h.sortedGuideRows;
assert.equal(snapshot.targets.length, 3);
assert.equal(proposal.targets.length, 3);
assert.equal(snapshot.activeReleases.length, 10);
assert.equal(snapshot.preservedTargets.length, 10);
assert.deepEqual(
  snapshot.targets.map((t) => t.content.slug),
  [...h.THREE_GUIDE_SLUGS],
);
assert.deepEqual(
  proposal.targets.map((t) => t.slug).sort(),
  [...h.THREE_GUIDE_SLUGS].sort(),
);
const sourceMap = new Map(
  sources.existingPinnedRows.map((r) => {
    assert.equal(hash(r.row), r.fullRowCanonicalSha256);
    return [r.sourceId, r.row];
  }),
);
const newSources = sources.resolutions
  .filter((r) => r.metadata)
  .map((r) => {
    assert.equal(r.metadata.reviewStatus, "awaiting_review");
    assert.equal(r.metadata.reviewer, null);
    assert.equal(r.metadata.reviewDate, null);
    assert.equal(r.metadata.nextReviewDate, null);
    for (const k of ["reviewerId", "reviewerQualification", "reviewScope"])
      assert.equal(r.metadata[k], undefined);
    assert.equal(hash(r.metadata), r.metadataCanonicalSha256);
    assert(!sourceMap.has(r.sourceId));
    if (r.sourceId.endsWith("-undated")) {
      assert.equal(r.metadata.year, null);
      assert.equal(r.metadata.edition, null);
    }
    const metadata = {
      ...r.metadata,
      searchText: h.guideSourceSearchText(r.metadata),
    };
    return { metadata, metadataHash: hash(metadata) };
  });
assert.equal(newSources.length, 14);
assert.equal(new Set(newSources.map((s) => s.metadata.sourceId)).size, 14);
const desiredSourceIds = new Set([
  ...sourceMap.keys(),
  ...newSources.map((s) => s.metadata.sourceId),
]);
const targets = snapshot.targets.map((t) => {
  const p = proposal.targets.find((p) => p.slug === t.content.slug);
  assert(p);
  assert.equal(t.content.reviewRevision, p.revision);
  assert.equal(t.content.clinicalStatus, "clinical_review");
  assert.equal(hash(t.content), p.fullContentPreimageHash);
  for (const key of [
    "assignments",
    "batches",
    "batchReceipts",
    "releases",
    "runs",
    "contentAudits",
    "evidenceAudits",
  ])
    assert.equal(t[key].length, 0, key);
  for (const source of t.sources)
    assert.deepEqual(source, sourceMap.get(source.sourceId));
  const patches = p.patches.map(({ path, before, after }) => ({
    path,
    before,
    after,
  }));
  const desired = h.correctedGuide(t.content, patches, p.revision);
  for (const [key, value] of Object.entries(p.desiredContent))
    assert.deepEqual(desired[key], value, `${p.slug}.${key}`);
  assert.equal(
    hash(h.aiContentSnapshot(desired)),
    p.desiredAiContentSnapshotHash,
  );
  assert.deepEqual(p.sourceLinkProposal.before, t.link.sourceIds);
  const ids = p.sourceLinkProposal.after;
  assert.equal(ids.length, new Set(ids).size);
  assert(ids.every((id) => desiredSourceIds.has(id)));
  assert.deepEqual(
    ids,
    sources.desiredLinks.find((x) => x.slug === p.slug).after,
  );
  return {
    slug: p.slug,
    revision: p.revision,
    contentId: t.content._id,
    contentCreationTime: t.content._creationTime,
    initialFullHash: hash(t.content),
    initialUpdatedAt: t.content.updatedAt,
    desiredStableHash: hash(h.guideStablePostimage(desired)),
    desiredReviewedCopyHash: p.desiredAiContentSnapshotHash,
    patches,
    linkId: t.link._id,
    initialLinkHash: hash(t.link),
    initialSourceIds: t.link.sourceIds,
    sourceIds: ids,
    desiredLinkStableHash: hash(
      h.guideStablePostimage({ ...t.link, sourceIds: ids }),
    ),
  };
});
assert.equal(
  targets.reduce((n, t) => n + t.patches.length, 0),
  74,
);
const descriptors = new Map();
function preserve(table, index, key, rows) {
  const d = { table, index, key, count: rows.length, hash: hash(sorted(rows)) },
    id = `${table}:${index}:${key}`;
  if (descriptors.has(id)) assert.deepEqual(descriptors.get(id), d);
  else descriptors.set(id, d);
}
preserve("aiPublicationConfig", "by_key", "global", snapshot.config);
preserve(
  "aiPublicationReleases",
  "by_status",
  "active",
  snapshot.activeReleases,
);
for (const row of sourceMap.values())
  preserve("evidenceSources", "by_source_id", row.sourceId, [row]);
for (const t of [...snapshot.targets, ...snapshot.preservedTargets]) {
  const slug = t.content.slug,
    isPreserved = snapshot.preservedTargets.includes(t);
  if (isPreserved) {
    preserve("libraryContent", "by_slug", slug, [t.content]);
    preserve("evidenceLinks", "by_slug", slug, [t.link]);
  }
  preserve("contentReviews", "by_content", slug, t.reviews);
  preserve("contentEditLogs", "by_content", slug, t.editLogs);
  preserve("libraryMedia", "by_content", slug, t.media);
  preserve("clinicalReviewAssignments", "by_exact_target", slug, t.assignments);
  preserve(
    "aiPublicationReleases",
    "by_target_key",
    `${t.content.type}\0${slug}`,
    t.releases,
  );
  preserve(
    "aiContentAudits",
    "by_content_revision_and_updated_at",
    slug,
    t.contentAudits,
  );
  for (const source of [...t.sources, ...t.historicalSources])
    preserve("evidenceSources", "by_source_id", source.sourceId, [source]);
  for (const release of t.releases)
    preserve(
      "aiAuditRuns",
      "by_release_id",
      release.releaseId,
      t.runs.filter((r) => r.releaseId === release.releaseId),
    );
  for (const run of t.runs) {
    preserve("aiAuditRuns", "by_run_id", run.runId, [run]);
    preserve(
      "aiContentAudits",
      "by_run_id",
      run.runId,
      t.contentAudits.filter((a) => a.runId === run.runId),
    );
    preserve(
      "aiEvidenceAudits",
      "by_run_id",
      run.runId,
      t.evidenceAudits.filter((a) => a.runId === run.runId),
    );
  }
  for (const batch of t.batches) {
    preserve("clinicalReviewBatches", "by_batch_id", batch.batchId, [batch]);
    preserve(
      "clinicalReviewBatchReceipts",
      "by_batch_id",
      batch.batchId,
      t.batchReceipts.filter((r) => r.batchId === batch.batchId),
    );
  }
}
for (const action of new Set(
  snapshot.preservationReceipts.map((r) => r.action),
))
  preserve(
    "auditLogs",
    "by_action",
    action,
    snapshot.preservationReceipts.filter((r) => r.action === action),
  );
const schedules = snapshot.scheduledExpiries.map((s) => ({
  id: s.scheduled._id,
  hash: hash(s.scheduled),
}));
assert.equal(schedules.length, 3);
const identity = {
  releaseId: "2026-09-10-three-guide-unpublished-correction-v1",
  snapshotSha256: inputs.snapshot[1],
  proposalSha256: inputs.proposal[1],
  sourceProposalSha256: inputs.sources[1],
};
const output =
  "// Mechanically compiled exact correction manifest. No human or publication approval.\n" +
  Object.entries({
    THREE_GUIDE_IDENTITY: identity,
    THREE_GUIDE_CAPTURED_AT: snapshot.capturedAt,
    THREE_GUIDE_APPLY_BEFORE: snapshot.capturedAt + 7 * 86400000,
    THREE_GUIDE_TARGETS: targets,
    THREE_GUIDE_NEW_SOURCES: newSources,
    THREE_GUIDE_PRESERVATION: [...descriptors.values()],
    THREE_GUIDE_SCHEDULES: schedules,
  })
    .map(
      ([key, value]) =>
        `export const ${key} = ${JSON.stringify(value, null, 2)} as const;\n`,
    )
    .join("");
writeFileSync("convex/lib/threeGuideCorrectionData.ts", output);
console.log(
  JSON.stringify(
    {
      targets: 3,
      patches: 74,
      newSources: 14,
      preservationQueries: descriptors.size,
      schedules: schedules.length,
      manifestSha256: sha(output),
    },
    null,
    2,
  ),
);
