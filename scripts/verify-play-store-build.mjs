#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const outputDir = mkdtempSync(join(tmpdir(), 'ace-play-store-build-'));

function filesBelow(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(path) : [path];
  });
}

try {
  execFileSync(
    'npx',
    ['vite', 'build', '--outDir', outputDir, '--emptyOutDir'],
    {
      env: { ...process.env, VITE_DISTRIBUTION: 'play-store' },
      stdio: 'inherit',
    },
  );

  const files = filesBelow(outputDir);
  const names = files.map((path) => path.split('/').pop() ?? path);
  const text = files
    .filter((path) => /\.(?:html|js|json|webmanifest)$/.test(path))
    .map((path) => readFileSync(path, 'utf8'))
    .join('\n');
  const forbiddenChunks = [
    'AdminBilling',
    'AdminReviewQueue',
    'ContentReviewWorkspace',
    'PaymentStatus',
    'SubscriptionPlans',
  ];
  const emittedForbiddenChunks = forbiddenChunks.filter((name) => (
    names.some((file) => file.startsWith(`${name}-`))
  ));
  const forbiddenCopy = [
    'Payment is handled via Myan Myan Pay',
    'Generate MMQR',
    'manual-transfer proof',
  ].filter((marker) => text.includes(marker));
  const requiredCopy = 'It contains no in-app purchase or external payment flow.';

  if (emittedForbiddenChunks.length > 0 || forbiddenCopy.length > 0 || !text.includes(requiredCopy)) {
    console.error(JSON.stringify({
      ready: false,
      emittedForbiddenChunks,
      forbiddenCopy,
      requiredPlayStoreTermsPresent: text.includes(requiredCopy),
    }, null, 2));
    process.exitCode = 2;
  } else {
    console.log(JSON.stringify({
      ready: true,
      emittedForbiddenChunks: [],
      forbiddenCopy: [],
      requiredPlayStoreTermsPresent: true,
    }, null, 2));
  }
} finally {
  rmSync(outputDir, { recursive: true, force: true });
}
