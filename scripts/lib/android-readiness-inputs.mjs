import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { normalizeSha256 } from './android-release-validator.mjs';

function requiredString(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value.trim();
}

function requiredFile(value, label) {
  const path = resolve(requiredString(value, label));
  if (!existsSync(path)) throw new Error(`${label} was not found: ${path}`);
  return path;
}

function requiredHash(value, label) {
  const hash = normalizeSha256(value);
  if (hash === null) throw new Error(`${label} must be a SHA-256 fingerprint.`);
  return hash;
}

export function parseAndroidReadinessInputs(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Android validation inputs must be a JSON object.');
  }
  const playMaxVersionCode = Number(value.playMaxVersionCode);
  if (!Number.isSafeInteger(playMaxVersionCode) || playMaxVersionCode < 0) {
    throw new Error('playMaxVersionCode must be a non-negative integer.');
  }

  return {
    bundle: requiredFile(value.bundle, 'bundle'),
    bundletool: requiredFile(value.bundletool, 'bundletool'),
    previousBundle: requiredFile(value.previousBundle, 'previousBundle'),
    playMaxVersionCode,
    expectedSha256: requiredHash(value.expectedSha256, 'expectedSha256'),
    expectedCertSha256: requiredHash(value.expectedCertSha256, 'expectedCertSha256'),
    gradle: value.gradle === undefined
      ? resolve('android/app/build.gradle')
      : requiredFile(value.gradle, 'gradle'),
  };
}

export function readAndroidReadinessInputs(path) {
  const absolutePath = requiredFile(path, '--android-validation-inputs');
  let value;
  try {
    value = JSON.parse(readFileSync(absolutePath, 'utf8'));
  } catch {
    throw new Error('--android-validation-inputs must contain valid JSON.');
  }
  return parseAndroidReadinessInputs(value);
}

export function androidValidatorArgs(inputs) {
  return [
    '--bundle', inputs.bundle,
    '--bundletool', inputs.bundletool,
    '--previous-bundle', inputs.previousBundle,
    '--play-max-version-code', String(inputs.playMaxVersionCode),
    '--expected-sha256', inputs.expectedSha256,
    '--expected-cert-sha256', inputs.expectedCertSha256,
    '--gradle', inputs.gradle,
    '--json',
  ];
}
