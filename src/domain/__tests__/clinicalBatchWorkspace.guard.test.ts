import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('clinical batch workspace boundary', () => {
  it('suppresses broad catalogue, detail, search and queue queries for clinical accounts', () => {
    const workspace = source('src/screens/ContentReviewWorkspace.tsx');
    expect(workspace).toContain('!isFrozenBatchReviewerRole(access?.role)');
    expect(workspace).toContain("standardWorkspaceEnabled ? { type } : 'skip'");
    expect(workspace).toContain("standardWorkspaceEnabled && selectedSlug ? { slug: selectedSlug } : 'skip'");
    expect(workspace).toContain("standardWorkspaceEnabled ? {} : 'skip'");
    expect(workspace).toContain("activeTab: WorkspaceTab = isFrozenBatchReviewer ? 'clinicalBatch' : tab");
  });

  it('does not substitute the broad queue or generic decision mutation for the exact batch backend', () => {
    const boundary = source('src/screens/contentReview/clinicalBatchBackend.ts');
    const workspace = source('src/screens/ContentReviewWorkspace.tsx');
    expect(boundary).not.toContain('api.ownerPriority');
    expect(boundary).not.toContain('api.contentReviews.saveDecision');
    expect(boundary).toContain('adaptFrozenClinicalBatch(raw');
    expect(boundary).toContain('clinical decision response was invalid');
    expect(workspace).toContain('useAction(api.clinicalReviewBatchActions.getAssignedBatch)');
    expect(workspace).toContain('api.clinicalReviewBatch.saveAssignedDecision');
    expect(workspace).not.toContain('clinicalBatchBackend.recordDecision');
  });
});
