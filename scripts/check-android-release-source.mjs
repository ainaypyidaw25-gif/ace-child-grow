#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Fail-closed source preflight for Android release packaging.
 *
 * This command only reads Git and Gradle metadata. It never builds, signs,
 * uploads or publishes an artifact.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  assessAndroidReleaseSource,
  parseGradleReleaseMetadata,
  parsePlayMaxVersionCode,
} from './lib/android-release-validator.mjs';

function gitOutput(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
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
  const assessment = assessAndroidReleaseSource({
    expectedSourceCommit: process.env.ACE_ANDROID_SOURCE_COMMIT ?? null,
    actualSourceCommit,
    sourceClean: sourceStatus.trim().length === 0,
    versionCode: gradle.versionCode,
    playMaxVersionCode: parsePlayMaxVersionCode(
      process.env.ACE_ANDROID_PLAY_MAX_VERSION_CODE,
    ),
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
