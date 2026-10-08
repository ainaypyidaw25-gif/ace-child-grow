#!/usr/bin/env node
import { lstatSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Vite preserves nested output directories used by the app's chunk layout;
// explicitly clear the generated app bundle before rebuilding another store
// distribution. The separate layout harness has its own output directory.
const output = fileURLToPath(new URL('../dist', import.meta.url));
try {
  const entry = lstatSync(output);
  if (!entry.isDirectory() || entry.isSymbolicLink()) {
    throw new Error(`Expected generated output directory at ${output}`);
  }
  rmSync(output, { recursive: true, force: true });
} catch (error) {
  if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
}
