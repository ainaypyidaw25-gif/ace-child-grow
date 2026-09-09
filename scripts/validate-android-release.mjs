#!/usr/bin/env node
/**
 * Fail-closed, read-only validation for an Android App Bundle.
 *
 * The command never signs, builds, uploads or publishes. It only reads the
 * candidate AAB, the checked-in Gradle metadata, the previous accepted AAB,
 * the fresh Play maximum, and the exact approval hashes.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assessAndroidBundle,
  jarsignerOutputIsComplete,
  normalizeSha256,
  parseBundletoolManifest,
  parseGradleReleaseMetadata,
  parseKeytoolCertificate,
} from './lib/android-release-validator.mjs';

const HELP = `Usage:
  node scripts/validate-android-release.mjs \\
    --bundle /absolute/path/app-release.aab \\
    --bundletool /absolute/path/bundletool-all.jar \\
    [--previous-bundle /absolute/path/previous.aab] \\
    [--play-max-version-code 13] \\
    [--expected-sha256 HEX] \\
    [--expected-cert-sha256 HEX] \\
    [--gradle android/app/build.gradle] \\
    [--json]

The four bracketed release-evidence options may be omitted for diagnosis, but
omitting any one of them always produces BLOCKED and can never exit 0.

Exit 0: every mandatory release gate passed.
Exit 2: one or more release gates failed.
Exit 1: arguments or required tools/files were invalid.
`;

function parseArgs(argv) {
  const options = {
    bundle: null,
    bundletool: process.env.BUNDLETOOL_JAR ?? null,
    previousBundle: null,
    playMaxVersionCode: null,
    expectedSha256: null,
    expectedCertSha256: null,
    gradle: 'android/app/build.gradle',
    json: false,
  };
  const names = new Map([
    ['--bundle', 'bundle'],
    ['--bundletool', 'bundletool'],
    ['--previous-bundle', 'previousBundle'],
    ['--play-max-version-code', 'playMaxVersionCode'],
    ['--expected-sha256', 'expectedSha256'],
    ['--expected-cert-sha256', 'expectedCertSha256'],
    ['--gradle', 'gradle'],
  ]);

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--help' || argument === '-h') return { help: true };
    if (argument === '--json') {
      options.json = true;
      continue;
    }
    const key = names.get(argument);
    if (!key) throw new Error(`Unknown argument: ${argument}`);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${argument}`);
    options[key] = value;
    index += 1;
  }

  return options;
}

function requireFile(label, value) {
  if (!value) throw new Error(`${label} is required.`);
  const path = resolve(value);
  if (!existsSync(path)) throw new Error(`${label} was not found: ${path}`);
  return path;
}

function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function runQuiet(command, args) {
  try {
    execFileSync(command, args, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function verifyCompleteJarSignature(bundlePath) {
  const result = spawnSync('jarsigner', ['-verify', '-verbose', '-certs', bundlePath], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  return jarsignerOutputIsComplete(output, result.status ?? 1);
}

function certificateFor(bundlePath) {
  let output;
  try {
    output = execFileSync('keytool', ['-J-Duser.timezone=UTC', '-printcert', '-jarfile', bundlePath], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    throw new Error('keytool could not read the AAB signer certificate.');
  }
  return parseKeytoolCertificate(output);
}

function manifestFor(bundletoolPath, bundlePath) {
  let output;
  try {
    output = execFileSync(
      'java',
      ['-jar', bundletoolPath, 'dump', 'manifest', `--bundle=${bundlePath}`, '--module=base'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 16 * 1024 * 1024 },
    );
  } catch {
    throw new Error('Bundletool could not dump the base manifest.');
  }
  return parseBundletoolManifest(output);
}

function sourceSnapshot() {
  let commit;
  let status;
  try {
    commit = execFileSync('git', ['rev-parse', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    status = execFileSync('git', ['status', '--porcelain'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    throw new Error('Could not read the current git source state.');
  }
  if (!/^[0-9a-f]{40}$/.test(commit)) throw new Error('Git HEAD is not a full commit hash.');
  return { commit, clean: status.trim().length === 0 };
}

function positiveInteger(value, label) {
  if (value === null) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }
  return parsed;
}

function expectedHash(value, label) {
  if (value === null) return null;
  const normalized = normalizeSha256(value);
  if (normalized === null) throw new Error(`${label} must be a SHA-256 fingerprint.`);
  return normalized;
}

function printHuman(report) {
  console.log(`Android AAB: ${report.bundle}`);
  console.log(`SHA-256: ${report.artifact.sha256}`);
  console.log(`Package: ${report.artifact.packageName}`);
  console.log(`Version: ${report.artifact.versionName} (code ${report.artifact.versionCode})`);
  console.log(`Signer SHA-256: ${report.certificate.sha256}`);
  for (const check of report.checks) {
    console.log(`${check.pass ? 'PASS' : 'BLOCK'} ${check.id}: ${check.detail}`);
  }
  console.log(report.ready ? 'READY: artifact validation gates passed.' : 'BLOCKED: do not upload this artifact.');
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(HELP);
    return;
  }

  const bundlePath = requireFile('--bundle', options.bundle);
  if (!bundlePath.toLowerCase().endsWith('.aab')) throw new Error('--bundle must point to an .aab file.');
  const bundletoolPath = requireFile('--bundletool or BUNDLETOOL_JAR', options.bundletool);
  const gradlePath = requireFile('--gradle', options.gradle);
  const previousBundlePath = options.previousBundle === null
    ? null
    : requireFile('--previous-bundle', options.previousBundle);

  const gradle = parseGradleReleaseMetadata(readFileSync(gradlePath, 'utf8'));
  if (gradle.applicationId === null || gradle.versionCode === null || gradle.versionName === null) {
    throw new Error('Could not parse applicationId, versionCode and versionName from Gradle source.');
  }

  const bundletoolValid = runQuiet(
    'java',
    ['-jar', bundletoolPath, 'validate', `--bundle=${bundlePath}`],
  );
  const jarSignatureValid = verifyCompleteJarSignature(bundlePath);
  const certificate = certificateFor(bundlePath);
  const previousCertificate = previousBundlePath === null ? null : certificateFor(previousBundlePath);
  const manifest = manifestFor(bundletoolPath, bundlePath);
  const source = sourceSnapshot();
  const artifact = {
    ...manifest,
    sha256: sha256File(bundlePath),
  };
  const assessment = assessAndroidBundle({
    artifact,
    gradle,
    jarSignatureValid,
    bundletoolValid,
    certificate,
    previousCertificate,
    expectedArtifactSha256: expectedHash(options.expectedSha256, '--expected-sha256'),
    expectedCertificateSha256: expectedHash(options.expectedCertSha256, '--expected-cert-sha256'),
    playMaxVersionCode: positiveInteger(options.playMaxVersionCode, '--play-max-version-code'),
    sourceCommit: source.commit,
    sourceClean: source.clean,
  });
  const report = {
    ready: assessment.ready,
    bundle: bundlePath,
    previousBundle: previousBundlePath,
    gradle,
    artifact,
    certificate,
    source,
    checks: assessment.checks,
  };

  if (options.json) console.log(JSON.stringify(report, null, 2));
  else printHuman(report);
  if (!report.ready) process.exitCode = 2;
}

try {
  main();
} catch (error) {
  console.error(`ERROR: ${error instanceof Error ? error.message : 'Android validation failed.'}`);
  process.exitCode = 1;
}
