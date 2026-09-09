export function parseGradleReleaseMetadata(source) {
  const applicationId = source.match(/\bapplicationId\s+["']([^"']+)["']/)?.[1] ?? null;
  const versionCodeText = source.match(/\bversionCode\s+(\d+)/)?.[1] ?? null;
  const versionName = source.match(/\bversionName\s+["']([^"']+)["']/)?.[1] ?? null;

  return {
    applicationId,
    versionCode: versionCodeText === null ? null : Number(versionCodeText),
    versionName,
  };
}

export function parsePlayMaxVersionCode(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!/^(?:0|[1-9]\d*)$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

const ANDROID_RELEASE_VITE_KEYS = [
  'VITE_CONVEX_URL',
  'VITE_DEFAULT_LOCALE',
];

export function parseControlledProductionViteEnv(source) {
  if (typeof source !== 'string') {
    return {
      valid: false,
      keys: [],
      missingKeys: [...ANDROID_RELEASE_VITE_KEYS],
      unexpectedKeys: [],
    };
  }

  const keys = [];
  const seen = new Set();
  let syntaxIsLiteral = true;
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('#')) continue;
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (!match) {
      syntaxIsLiteral = false;
      continue;
    }
    const [, key, value] = match;
    if (!key.startsWith('VITE_') || seen.has(key) || value.includes('$')) {
      syntaxIsLiteral = false;
    }
    seen.add(key);
    keys.push(key);
  }

  const uniqueKeys = [...seen].sort();
  const missingKeys = ANDROID_RELEASE_VITE_KEYS.filter((key) => !seen.has(key));
  const unexpectedKeys = uniqueKeys.filter(
    (key) => !ANDROID_RELEASE_VITE_KEYS.includes(key),
  );
  return {
    valid: syntaxIsLiteral && missingKeys.length === 0 && unexpectedKeys.length === 0,
    keys: uniqueKeys,
    missingKeys,
    unexpectedKeys,
  };
}

export function assessAndroidReleaseSource({
  expectedSourceCommit,
  actualSourceCommit,
  sourceClean,
  versionCode,
  playMaxVersionCode,
  viteProductionEnvControlled = false,
  viteProductionEnvSha256 = null,
  viteLocalFiles = [],
  viteEnvironmentOverrides = [],
  viteDistribution = null,
}) {
  const expectedCommitIsExact = typeof expectedSourceCommit === 'string'
    && /^[0-9a-f]{40}$/.test(expectedSourceCommit);
  const sourceCommitMatchesHead = expectedCommitIsExact
    && typeof actualSourceCommit === 'string'
    && expectedSourceCommit === actualSourceCommit;
  const playMaximumIsSupplied = Number.isSafeInteger(playMaxVersionCode)
    && playMaxVersionCode >= 0;
  const versionCodeExceedsPlay = playMaximumIsSupplied
    && Number.isSafeInteger(versionCode)
    && versionCode > playMaxVersionCode;
  const productionEnvIsControlled = viteProductionEnvControlled
    && typeof viteProductionEnvSha256 === 'string'
    && /^[a-f0-9]{64}$/.test(viteProductionEnvSha256);
  const localViteEnvIsAbsent = Array.isArray(viteLocalFiles)
    && viteLocalFiles.length === 0;
  const viteOverridesAreAbsent = Array.isArray(viteEnvironmentOverrides)
    && viteEnvironmentOverrides.length === 0;
  const distributionIsPlayStore = viteDistribution === 'play-store';
  const checks = [
    {
      id: 'vite_production_env_controlled',
      pass: productionEnvIsControlled,
      detail: productionEnvIsControlled
        ? `Tracked literal .env.production SHA-256: ${viteProductionEnvSha256}.`
        : 'A tracked regular .env.production with only approved literal Vite keys is required.',
    },
    {
      id: 'vite_local_env_absent',
      pass: localViteEnvIsAbsent,
      detail: localViteEnvIsAbsent
        ? 'No local Vite environment file can override the reviewed production inputs.'
        : `Remove prohibited local Vite environment files: ${viteLocalFiles.join(', ')}.`,
    },
    {
      id: 'vite_environment_overrides_absent',
      pass: viteOverridesAreAbsent,
      detail: viteOverridesAreAbsent
        ? 'No unexpected process-level VITE_* override is present.'
        : `Unexpected process-level Vite overrides: ${viteEnvironmentOverrides.join(', ')}.`,
    },
    {
      id: 'vite_distribution_play_store',
      pass: distributionIsPlayStore,
      detail: distributionIsPlayStore
        ? 'VITE_DISTRIBUTION is fixed to play-store.'
        : 'VITE_DISTRIBUTION must be exactly play-store for Android release packaging.',
    },
    {
      id: 'source_commit_exact',
      pass: expectedCommitIsExact,
      detail: expectedCommitIsExact
        ? 'ACE_ANDROID_SOURCE_COMMIT is the exact 40-character reviewed commit.'
        : 'ACE_ANDROID_SOURCE_COMMIT must be a lowercase 40-character git commit.',
    },
    {
      id: 'source_commit_matches_head',
      pass: sourceCommitMatchesHead,
      detail: sourceCommitMatchesHead
        ? 'ACE_ANDROID_SOURCE_COMMIT matches git HEAD.'
        : 'ACE_ANDROID_SOURCE_COMMIT must match git HEAD exactly.',
    },
    {
      id: 'source_worktree_clean',
      pass: sourceClean,
      detail: sourceClean
        ? 'The release source worktree is clean.'
        : 'The release source worktree has tracked or untracked changes.',
    },
    {
      id: 'play_max_version_code_supplied',
      pass: playMaximumIsSupplied,
      detail: playMaximumIsSupplied
        ? `Fresh Play Console maximum version code: ${playMaxVersionCode}.`
        : 'ACE_ANDROID_PLAY_MAX_VERSION_CODE must be a fresh non-negative integer.',
    },
    {
      id: 'version_code_exceeds_play',
      pass: versionCodeExceedsPlay,
      detail: playMaximumIsSupplied
        ? `Checked-in version code ${versionCode ?? 'missing'} must exceed Play Console maximum ${playMaxVersionCode}.`
        : 'A fresh Play Console maximum is required before comparing version codes.',
    },
  ];

  return {
    ready: checks.every((check) => check.pass),
    checks,
  };
}

export function parseBundletoolManifest(source) {
  const manifest = source.match(/<manifest\b[^>]*>/)?.[0] ?? '';
  const packageName = manifest.match(/\bpackage="([^"]+)"/)?.[1] ?? null;
  const versionCodeText = manifest.match(/\bandroid:versionCode="(\d+)"/)?.[1] ?? null;
  const versionName = manifest.match(/\bandroid:versionName="([^"]+)"/)?.[1] ?? null;
  const sourceCommit = source.match(
    /<meta-data\b[^>]*android:name="mm\.com\.acegroup\.acechildgrow\.SOURCE_COMMIT"[^>]*android:value="([0-9a-f]{40})"[^>]*\/?\s*>/,
  )?.[1] ?? null;

  return {
    packageName,
    versionCode: versionCodeText === null ? null : Number(versionCodeText),
    versionName,
    sourceCommit,
  };
}

export function normalizeSha256(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.replaceAll(':', '').trim().toLowerCase();
  return /^[a-f0-9]{64}$/.test(normalized) ? normalized : null;
}

export function parseKeytoolCertificate(source) {
  const sha256 = normalizeSha256(source.match(/\bSHA256:\s*([A-Fa-f0-9:]+)/)?.[1] ?? '');
  const validity = source.match(/Valid from:\s*(.*?)\s+until:\s*(.*)/);
  const validFrom = validity?.[1]?.trim() ?? null;
  const validUntil = validity?.[2]?.trim() ?? null;
  const validFromMs = validFrom === null ? null : Date.parse(validFrom);
  const validUntilMs = validUntil === null ? null : Date.parse(validUntil);
  return {
    sha256,
    validFrom,
    validUntil,
    validFromMs: Number.isFinite(validFromMs) ? validFromMs : null,
    validUntilMs: Number.isFinite(validUntilMs) ? validUntilMs : null,
  };
}

export function jarsignerOutputIsComplete(output, exitStatus = 0) {
  if (exitStatus !== 0 || typeof output !== 'string') return false;
  return /\bjar verified\.\s*$/im.test(output)
    && !/\bcontains unsigned entries\b/i.test(output)
    && !/\bjar is unsigned\b/i.test(output)
    && !/\bsignature (?:is )?(?:invalid|unparsable)\b/i.test(output);
}

export function assessAndroidBundle({
  artifact,
  gradle,
  jarSignatureValid,
  bundletoolValid,
  certificate,
  previousCertificate = null,
  expectedArtifactSha256 = null,
  expectedCertificateSha256 = null,
  playMaxVersionCode = null,
  sourceCommit,
  sourceClean,
  validationTimeMs = Date.now(),
}) {
  const comparison = (pass) => (pass ? 'matches' : 'does not match');
  const packageMatchesSource = artifact.packageName !== null
    && artifact.packageName === gradle.applicationId;
  const versionCodeMatchesSource = artifact.versionCode !== null
    && artifact.versionCode === gradle.versionCode;
  const versionNameMatchesSource = artifact.versionName !== null
    && artifact.versionName === gradle.versionName;
  const sourceCommitEmbedded = artifact.sourceCommit !== null
    && artifact.sourceCommit === sourceCommit;
  const certificateCurrentlyValid = Number.isFinite(validationTimeMs)
    && certificate.validFromMs !== null
    && certificate.validUntilMs !== null
    && certificate.validFromMs <= validationTimeMs
    && validationTimeMs <= certificate.validUntilMs;
  const checks = [
    {
      id: 'bundletool_valid',
      pass: bundletoolValid,
      detail: 'Bundletool structurally validates the AAB.',
    },
    {
      id: 'jar_signature_valid',
      pass: jarSignatureValid,
      detail: 'The AAB JAR signature verifies.',
    },
    {
      id: 'certificate_present',
      pass: certificate.sha256 !== null,
      detail: 'A signer certificate SHA-256 fingerprint is readable.',
    },
    {
      id: 'certificate_currently_valid',
      pass: certificateCurrentlyValid,
      detail: certificateCurrentlyValid
        ? 'The signer certificate is valid at the validation time.'
        : 'The signer certificate is expired, not yet valid, or its UTC validity window is unreadable.',
    },
    {
      id: 'package_matches_source',
      pass: packageMatchesSource,
      detail: `Artifact package ${artifact.packageName ?? 'missing'} ${comparison(packageMatchesSource)} source ${gradle.applicationId ?? 'missing'}.`,
    },
    {
      id: 'version_code_matches_source',
      pass: versionCodeMatchesSource,
      detail: `Artifact version code ${artifact.versionCode ?? 'missing'} ${comparison(versionCodeMatchesSource)} source ${gradle.versionCode ?? 'missing'}.`,
    },
    {
      id: 'version_name_matches_source',
      pass: versionNameMatchesSource,
      detail: `Artifact version name ${artifact.versionName ?? 'missing'} ${comparison(versionNameMatchesSource)} source ${gradle.versionName ?? 'missing'}.`,
    },
    {
      id: 'source_commit_embedded',
      pass: sourceCommitEmbedded,
      detail: `Artifact source commit ${artifact.sourceCommit ?? 'missing'} ${comparison(sourceCommitEmbedded)} checked-out commit ${sourceCommit}.`,
    },
    {
      id: 'source_worktree_clean',
      pass: sourceClean,
      detail: 'The source worktree used for approval is clean.',
    },
  ];

  checks.push({
    id: 'signer_matches_previous',
    pass: previousCertificate !== null
      && certificate.sha256 !== null
      && certificate.sha256 === previousCertificate.sha256,
    detail: previousCertificate === null
      ? 'A previous accepted bundle is required to prove signer continuity.'
      : 'The candidate signer fingerprint matches the previous accepted bundle.',
  });

  checks.push({
    id: 'artifact_hash_matches_approval',
    pass: expectedArtifactSha256 !== null && artifact.sha256 === expectedArtifactSha256,
    detail: expectedArtifactSha256 === null
      ? 'An Owner-approved candidate AAB SHA-256 is required.'
      : 'The candidate AAB SHA-256 matches the approved hash.',
  });

  checks.push({
    id: 'signer_matches_approval',
    pass: expectedCertificateSha256 !== null
      && certificate.sha256 === expectedCertificateSha256,
    detail: expectedCertificateSha256 === null
      ? 'An approved upload-certificate SHA-256 is required.'
      : 'The signer certificate SHA-256 matches the approved fingerprint.',
  });

  checks.push({
    id: 'version_code_exceeds_play',
    pass: playMaxVersionCode !== null
      && artifact.versionCode !== null
      && artifact.versionCode > playMaxVersionCode,
    detail: playMaxVersionCode === null
      ? 'A fresh Play Console maximum version code is required.'
      : `Artifact version code must exceed Play Console maximum ${playMaxVersionCode}.`,
  });

  return {
    ready: checks.every((check) => check.pass),
    checks,
  };
}
