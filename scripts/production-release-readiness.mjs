#!/usr/bin/env node
/**
 * Read-only production release blocker report.
 *
 * This script only invokes Convex queries/inline queries, inspects local Android
 * release evidence and performs a GET of the public Play listing. It never calls
 * a mutation, changes an environment variable, builds, signs, deploys or uploads.
 *
 *   # Run from a checkout configured for this Convex project.
 *   node scripts/production-release-readiness.mjs
 *   node scripts/production-release-readiness.mjs \
 *     --android-validation-inputs /absolute/path/android-validation-inputs.json
 *   node scripts/production-release-readiness.mjs --json
 *
 * Exit 0 means the inspected gates passed or are advisory. Exit 2 means at
 * least one remaining action is blocked. Tool/configuration errors exit 1.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';
import {
  formatConvexOutputFailure,
  sanitizedConvexCommandError,
} from './lib/safe-convex-command-error.mjs';
import {
  androidValidatorArgs,
  readAndroidReadinessInputs,
} from './lib/android-readiness-inputs.mjs';

const jsonOutput = process.argv.includes('--json');
const skipPlayListing = process.argv.includes('--skip-play-listing');
const androidValidationInputsIndex = process.argv.indexOf('--android-validation-inputs');
const androidValidationInputsPath = androidValidationInputsIndex < 0
  ? null
  : process.argv[androidValidationInputsIndex + 1];
const androidValidationInputsArgumentInvalid = androidValidationInputsIndex >= 0
  && (!androidValidationInputsPath || androidValidationInputsPath.startsWith('--'));
const findings = [];

function add(area, finding, evidence = {}) {
  findings.push({ area, ...finding, evidence });
}

function parseJsonOutput(raw, operation) {
  const objectAt = raw.indexOf('{');
  const arrayAt = raw.indexOf('[');
  const at = objectAt < 0 ? arrayAt : arrayAt < 0 ? objectAt : Math.min(objectAt, arrayAt);
  if (at < 0) throw new Error(formatConvexOutputFailure({ operation }));
  try {
    return JSON.parse(raw.slice(at));
  } catch {
    throw new Error(formatConvexOutputFailure({ operation }));
  }
}

function runConvex(functionName, args) {
  const operation = `run:${functionName}`;
  try {
    const raw = execFileSync(
      'npx',
      ['convex', 'run', functionName, JSON.stringify(args), '--prod'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 },
    );
    return parseJsonOutput(raw, operation);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('[E_CONVEX_OUTPUT_INVALID]')) throw error;
    throw sanitizedConvexCommandError(error, { operation });
  }
}

function runInlineQuery(source) {
  const operation = 'run:inline-release-readiness';
  try {
    const raw = execFileSync(
      'npx',
      ['convex', 'run', '--prod', '--inline-query', source],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 },
    );
    return parseJsonOutput(raw, operation);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('[E_CONVEX_OUTPUT_INVALID]')) throw error;
    throw sanitizedConvexCommandError(error, { operation });
  }
}

async function readinessClassifiers() {
  const dir = mkdtempSync(join(tmpdir(), 'ace-release-readiness-'));
  const outfile = join(dir, 'classifiers.mjs');
  try {
    await build({
      entryPoints: [resolve('src/domain/releaseReadiness.ts')],
      bundle: true,
      format: 'esm',
      platform: 'node',
      outfile,
      logLevel: 'silent',
    });
    return await import(`file://${outfile}?t=${Date.now()}`);
  } finally {
    // Import completes module evaluation before resolving, so the temporary
    // bundle is no longer needed once the namespace object is returned.
    rmSync(dir, { recursive: true, force: true });
  }
}

function androidSnapshot() {
  const appGradle = readFileSync('android/app/build.gradle', 'utf8');
  const variablesGradle = readFileSync('android/variables.gradle', 'utf8');
  const applicationId = appGradle.match(/applicationId\s+["']([^"']+)["']/)?.[1] ?? null;
  const versionCode = Number(appGradle.match(/versionCode\s+(\d+)/)?.[1] ?? Number.NaN);
  const versionName = appGradle.match(/versionName\s+["']([^"']+)["']/)?.[1] ?? null;
  const compileSdk = Number(variablesGradle.match(/compileSdkVersion\s*=\s*(\d+)/)?.[1] ?? Number.NaN);
  const targetSdk = Number(variablesGradle.match(/targetSdkVersion\s*=\s*(\d+)/)?.[1] ?? Number.NaN);
  return {
    applicationId,
    versionCode,
    versionName,
    compileSdk,
    targetSdk,
  };
}

function runAndroidReleaseValidator(inputsPath) {
  if (inputsPath === null) return null;
  const inputs = readAndroidReadinessInputs(inputsPath);
  const result = spawnSync(
    process.execPath,
    [resolve('scripts/validate-android-release.mjs'), ...androidValidatorArgs(inputs)],
    {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  if (result.error || (result.status !== 0 && result.status !== 2)) {
    throw new Error('The dedicated Android release validator could not complete.');
  }
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    throw new Error('The dedicated Android release validator returned invalid JSON.');
  }
  if (report === null || typeof report !== 'object' || Array.isArray(report)
    || typeof report.ready !== 'boolean' || !Array.isArray(report.checks)) {
    throw new Error('The dedicated Android release validator returned an invalid report.');
  }
  if ((result.status === 0) !== report.ready) {
    throw new Error('The dedicated Android release validator status contradicted its report.');
  }
  return report;
}

async function playListing() {
  const url = 'https://play.google.com/store/apps/details?id=mm.com.acegroup.acechildgrow';
  if (skipPlayListing) return { checked: false, url, status: null, public: false };
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: { 'user-agent': 'ACE-Child-Grow-release-readiness/1.0' },
      signal: AbortSignal.timeout(15_000),
    });
    return { checked: true, url, status: response.status, public: response.ok };
  } catch {
    return { checked: true, url, status: null, public: false };
  }
}

async function main() {
  if (androidValidationInputsArgumentInvalid) {
    throw new Error('--android-validation-inputs requires a JSON file path.');
  }
  const classify = await readinessClassifiers();
  add('legal', classify.currentLegalTermsReadiness(), {
    requiresOwnerLegalApproval: true,
  });
  const paymentCapabilities = runConvex('billing:paymentCapabilities', {});
  const verifiedPaymentPath = paymentCapabilities.manualTransferAvailable === true
    || paymentCapabilities.mmpayProductionAvailable === true;
  add('payment', verifiedPaymentPath ? {
    level: 'pass',
    code: 'payment_capability_available',
    detail: 'At least one configured payment path can be presented to web customers.',
  } : {
    level: 'blocked',
    code: 'payment_capability_unavailable',
    detail: 'No active manual method or syntactically valid production Myan Myan Pay configuration is available.',
  }, {
    manualTransferAvailable: paymentCapabilities.manualTransferAvailable === true,
    mmpayProductionAvailable: paymentCapabilities.mmpayProductionAvailable === true,
  });
  if (paymentCapabilities.mmpayProductionAvailable === true) {
    add('payment', {
      level: 'advisory',
      code: 'mmpay_runtime_smoke_required',
      detail: 'Before web promotion, run a fresh non-charging provider smoke and verify the production webhook read-back.',
    });
  }
  const owner = runConvex('ownerAccountMergeV2:preflight', {
    releaseId: 'owner-account-merge-lapyaewun2690-2026-09-09-v2',
  });
  add('owner_account', classify.assessOwnerMergeV2(owner), {
    phase: owner.phase,
    blockers: owner.blockers,
    quarantineAuditFound: owner.v1QuarantineAuditFound,
    finalizeAuditFound: owner.v2FinalizeAuditFound,
    sourceAuthenticationArtifactCount: owner.sourceAuthenticationArtifactCount,
    googleVerificationCodeCount: owner.googleVerificationCodeCount,
    sourceUnexpectedReferenceCategories: owner.sourceUnexpectedReferenceCategories,
  });

  const ai = runConvex('aiPublicationSuccessor20260909:preflight', {
    releaseId: '2026-09-09-ai-educational-preview-source-refresh-3',
  });
  add('ai_preview', classify.assessAiPublicationSuccessor(ai), {
    phase: ai.phase,
    artifactExact: ai.artifactExact,
    configEnabled: ai.configEnabled,
    targets: ai.targets.map((target) => ({
      slug: target.slug,
      artifactVerdict: target.artifactVerdict,
      contentExact: target.contentExact,
      linkExact: target.linkExact,
      sourceExact: target.sourceExact,
      predecessorExact: target.predecessorExact,
    })),
  });

  const registry = runInlineQuery(`
    const [content, reviews, batches, sources, links, releases] = await Promise.all([
      ctx.db.query('libraryContent').take(501),
      ctx.db.query('contentReviews').take(1001),
      ctx.db.query('clinicalReviewBatches').take(101),
      ctx.db.query('evidenceSources').take(201),
      ctx.db.query('evidenceLinks').take(501),
      ctx.db.query('aiPublicationReleases').withIndex('by_status', q => q.eq('status', 'active')).take(4),
    ]);
    const count = (rows, key) => {
      const out = {};
      for (const row of rows) out[String(row[key] ?? 'missing')] = (out[String(row[key] ?? 'missing')] ?? 0) + 1;
      return out;
    };
    const linked = new Set(links.flatMap(link => link.sourceIds));
    const releaseSourceState = [];
    for (const release of releases) {
      for (const snapshot of release.sourceSnapshots) {
        const source = await ctx.db.query('evidenceSources')
          .withIndex('by_source_id', q => q.eq('sourceId', snapshot.sourceId)).unique();
        releaseSourceState.push({
          contentSlug: release.contentSlug,
          sourceId: snapshot.sourceId,
          frozenUpdatedAt: snapshot.sourceUpdatedAt,
          liveUpdatedAt: source?.updatedAt ?? null,
        });
      }
    }
    return {
      bounds: { content: content.length, reviews: reviews.length, batches: batches.length, sources: sources.length, links: links.length },
      contentStatus: count(content, 'clinicalStatus'),
      reviewDecision: count(reviews, 'decision'),
      evidenceStatus: count(sources, 'reviewStatus'),
      batches: batches.map(batch => ({ batchId: batch.batchId, status: batch.status, predecessorBatchId: batch.predecessorBatchId })),
      nonApprovedSources: sources.filter(source => source.reviewStatus !== 'approved').map(source => ({
        sourceId: source.sourceId,
        reviewStatus: source.reviewStatus,
        linked: linked.has(source.sourceId),
      })),
      releaseSourceState,
    };
  `);
  const boundsExceeded = registry.bounds.content > 500
    || registry.bounds.reviews > 1000
    || registry.bounds.batches > 100
    || registry.bounds.sources > 200
    || registry.bounds.links > 500;
  add('bounded_registry', boundsExceeded ? {
    level: 'blocked',
    code: 'registry_bound_exceeded',
    detail: 'A bounded readiness query reached its safety cap; raise the reviewed cap before interpreting counts.',
  } : {
    level: 'pass',
    code: 'registry_snapshot_bounded',
    detail: 'All readiness counts were read below their explicit safety caps.',
  }, registry.bounds);

  const unresolvedStopped = classify.unresolvedStoppedClinicalBatches(registry.batches);
  add('clinical_registry', unresolvedStopped.length > 0 ? {
    level: 'blocked',
    code: 'clinical_stopped_without_successor',
    detail: `Stopped batches have no completed corrective successor: ${unresolvedStopped.join(', ')}.`,
  } : {
    level: 'pass',
    code: 'clinical_stopped_batches_superseded',
    detail: 'Every stopped historical batch has a completed corrective successor.',
  }, {
    activeBatches: registry.batches.filter((batch) => batch.status === 'active').length,
    stoppedHistoricalBatches: registry.batches.filter((batch) => batch.status === 'stopped_changes_requested').length,
    contentStatus: registry.contentStatus,
    reviewDecisionHistory: registry.reviewDecision,
  });
  if ((registry.contentStatus.clinical_review ?? 0) > 0
    && registry.batches.every((batch) => batch.status !== 'active')) {
    add('clinical_registry', {
      level: 'advisory',
      code: 'clinical_content_waiting_without_active_batch',
      detail: `${registry.contentStatus.clinical_review} items remain intentionally unpublished and no frozen review batch is active.`,
    });
  }

  const linkedNonApproved = registry.nonApprovedSources.filter((source) => source.linked);
  add('evidence', linkedNonApproved.length > 0 ? {
    level: 'blocked',
    code: 'linked_evidence_not_approved',
    detail: `Non-approved sources are linked to content: ${linkedNonApproved.map((source) => source.sourceId).join(', ')}.`,
  } : {
    level: 'pass',
    code: 'nonapproved_evidence_unlinked',
    detail: 'No non-approved evidence source is linked to content.',
  }, {
    reviewStatus: registry.evidenceStatus,
    nonApprovedSources: registry.nonApprovedSources,
  });
  const driftedReleaseSources = registry.releaseSourceState.filter(
    (source) => source.liveUpdatedAt !== source.frozenUpdatedAt,
  );
  if (driftedReleaseSources.length > 0) {
    add('ai_preview', {
      level: 'blocked',
      code: 'ai_release_source_snapshot_drift',
      detail: `Evidence metadata changed after the AI release froze: ${driftedReleaseSources.map((row) => `${row.contentSlug}:${row.sourceId}`).join(', ')}.`,
    }, { driftedReleaseSources });
  }

  const android = androidSnapshot();
  const androidInputsValid = android.applicationId === 'mm.com.acegroup.acechildgrow'
    && Number.isSafeInteger(android.versionCode) && android.versionCode > 0
    && Boolean(android.versionName)
    && android.compileSdk >= 35 && android.targetSdk >= 35;
  add('android', androidInputsValid ? {
    level: 'pass',
    code: 'android_static_config_valid',
    detail: 'Android application identity, version and current SDK targets are present.',
  } : {
    level: 'blocked',
    code: 'android_static_config_invalid',
    detail: 'Android application identity, version or SDK targets are invalid.',
  }, android);
  const androidValidation = runAndroidReleaseValidator(androidValidationInputsPath);
  if (androidValidation === null) {
    add('android', {
      level: 'blocked',
      code: 'android_exact_artifact_validation_required',
      detail: 'No exact Android validation inputs were supplied; the candidate AAB cannot be considered ready.',
    }, {
      requiredArgument: '--android-validation-inputs',
      validator: 'scripts/validate-android-release.mjs',
    });
  } else {
    const failedChecks = androidValidation.checks
      .filter((check) => check?.pass !== true)
      .map((check) => String(check?.id ?? 'invalid_check'));
    add('android', androidValidation.ready && failedChecks.length === 0 ? {
      level: 'pass',
      code: 'android_exact_artifact_validation_passed',
      detail: 'The exact candidate AAB passed every mandatory dedicated release check.',
    } : {
      level: 'blocked',
      code: 'android_exact_artifact_validation_failed',
      detail: `The dedicated Android validator blocked the candidate${failedChecks.length > 0 ? `: ${failedChecks.join(', ')}` : '.'}`,
    }, {
      bundle: androidValidation.bundle,
      previousBundle: androidValidation.previousBundle,
      artifact: androidValidation.artifact,
      certificate: androidValidation.certificate,
      source: androidValidation.source,
      checks: androidValidation.checks,
    });
  }

  const listing = await playListing();
  add('android', !listing.checked ? {
    level: 'advisory',
    code: 'play_listing_not_checked',
    detail: 'The public Play listing check was explicitly skipped.',
  } : listing.public ? {
    level: 'pass',
    code: 'play_listing_public',
    detail: 'The public Google Play listing returned a successful response.',
  } : {
    level: 'blocked',
    code: 'play_listing_not_public',
    detail: `The public Google Play listing is not reachable (HTTP ${listing.status ?? 'unavailable'}).`,
  }, listing);

  const result = {
    generatedAt: new Date().toISOString(),
    readOnly: true,
    summary: {
      pass: findings.filter((finding) => finding.level === 'pass').length,
      advisory: findings.filter((finding) => finding.level === 'advisory').length,
      blocked: findings.filter((finding) => finding.level === 'blocked').length,
    },
    findings,
  };
  if (jsonOutput) console.log(JSON.stringify(result, null, 2));
  else {
    for (const finding of findings) {
      const mark = finding.level === 'pass' ? 'PASS' : finding.level === 'advisory' ? 'NOTE' : 'BLOCK';
      console.log(`${mark.padEnd(5)} [${finding.area}] ${finding.code} — ${finding.detail}`);
    }
    console.log(`\nSummary: ${result.summary.pass} pass, ${result.summary.advisory} advisory, ${result.summary.blocked} blocked.`);
  }
  process.exitCode = result.summary.blocked > 0 ? 2 : 0;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
