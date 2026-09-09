#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Fail-closed source preflight for Android release packaging.
 *
 * This command only reads Git and Gradle metadata. It never builds, signs,
 * uploads or publishes an artifact.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assessAndroidReleaseSource,
  parseControlledProductionViteEnv,
  parseGradleReleaseMetadata,
  parsePlayMaxVersionCode,
} from './lib/android-release-validator.mjs';

const PROHIBITED_VITE_ENV_FILES = [
  '.env',
  '.env.local',
  '.env.production.local',
];

function gitOutput(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

function pathType(path) {
  try {
    const stats = lstatSync(path);
    return stats.isFile() ? 'file' : 'other';
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return 'missing';
    }
    throw error;
  }
}

function gitTracks(repoRoot, path) {
  try {
    execFileSync('git', ['ls-files', '--error-unmatch', '--', path], {
      cwd: repoRoot,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function main() {
  const repoRoot = gitOutput(['rev-parse', '--show-toplevel']);
  const actualSourceCommit = gitOutput(['rev-parse', 'HEAD']);
  const sourceStatus = execFileSync(
    'git',
    ['status', '--porcelain', '--untracked-files=all'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    },
  );
  const gradlePath = resolve(repoRoot, 'android/app/build.gradle');
  const gradle = parseGradleReleaseMetadata(readFileSync(gradlePath, 'utf8'));
  const productionEnvRelativePath = '.env.production';
  const productionEnvPath = resolve(repoRoot, productionEnvRelativePath);
  const productionEnvIsRegularFile = pathType(productionEnvPath) === 'file';
  const productionEnvSource = productionEnvIsRegularFile
    ? readFileSync(productionEnvPath, 'utf8')
    : '';
  const productionViteEnv = parseControlledProductionViteEnv(productionEnvSource);
  const productionEnvSha256 = productionEnvIsRegularFile
    ? createHash('sha256').update(productionEnvSource).digest('hex')
    : null;
  const localViteEnvFiles = PROHIBITED_VITE_ENV_FILES.filter(
    (path) => pathType(resolve(repoRoot, path)) !== 'missing',
  );
  const viteEnvironmentOverrides = Object.keys(process.env)
    .filter((key) => key.startsWith('VITE_') && key !== 'VITE_DISTRIBUTION')
    .sort();
  const assessment = assessAndroidReleaseSource({
    expectedSourceCommit: process.env.ACE_ANDROID_SOURCE_COMMIT ?? null,
    actualSourceCommit,
    sourceClean: sourceStatus.trim().length === 0,
    versionCode: gradle.versionCode,
    playMaxVersionCode: parsePlayMaxVersionCode(
      process.env.ACE_ANDROID_PLAY_MAX_VERSION_CODE,
    ),
    viteProductionEnvControlled: productionEnvIsRegularFile
      && gitTracks(repoRoot, productionEnvRelativePath)
      && productionViteEnv.valid,
    viteProductionEnvSha256: productionEnvSha256,
    viteLocalFiles: localViteEnvFiles,
    viteEnvironmentOverrides,
    viteDistribution: process.env.VITE_DISTRIBUTION ?? null,
  });

  for (const check of assessment.checks) {
    console.log(`${check.pass ? 'PASS' : 'BLOCK'} ${check.id}: ${check.detail}`);
  }
  if (!assessment.ready) {
    console.error('BLOCKED: Android release packaging source preflight failed.');
    process.exitCode = 2;
    return;
  }
  console.log('READY: Android release packaging source preflight passed.');
}

try {
  main();
} catch (error) {
  console.error(
    `ERROR: ${error instanceof Error ? error.message : 'Android source preflight failed.'}`,
  );
  process.exitCode = 1;
}
