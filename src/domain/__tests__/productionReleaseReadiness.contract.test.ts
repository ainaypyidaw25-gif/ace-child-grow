import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const script = readFileSync(
  resolve(process.cwd(), 'scripts/production-release-readiness.mjs'),
  'utf8',
);

describe('production readiness AI-preview gate contract', () => {
  it('uses the immutable current six-picture-story postflight and retires the stale preflight blocker', () => {
    expect(script).toContain("runConvex('aiSixPictureStoriesPublication20260910:postflight'");
    expect(script).toContain('SIX_PICTURE_STORIES_ARTIFACT_HASH');
    expect(script).toContain('SIX_PICTURE_STORIES_PREIMAGE.snapshotSha256');
    expect(script).toContain('SIX_PICTURE_STORIES_RELEASE_ROOT');
    expect(script).toContain('assessSixPictureStoriesPostflight(ai, aiIdentity)');
    expect(script).not.toContain("runConvex('aiPublicationSuccessor20260909:preflight'");
  });

  it('keeps the never-staged 2026-09-09 successor as advisory history only', () => {
    expect(script).toContain("add('ai_preview_history'");
    expect(script).toContain("level: 'advisory'");
    expect(script).toContain("code: 'ai_publication_successor_20260909_historical_only'");
  });
});
