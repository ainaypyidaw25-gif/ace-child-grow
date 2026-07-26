import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const librarySource = readFileSync('convex/library.ts', 'utf8');
const workflowSource = readFileSync('convex/content.ts', 'utf8');

describe('clinical publication gate', () => {
  it('requires a reviewer qualification before library content can be published', () => {
    expect(librarySource).toContain("args.clinicalStatus === 'published'");
    expect(librarySource).toContain('await requireClinicalReviewer(ctx)');
  });

  it('requires a reviewer qualification before workflow approval or publishing', () => {
    expect(workflowSource).toContain("['approved', 'published'].includes(to)");
    expect(workflowSource).toContain('await requireClinicalReviewer(ctx)');
  });

  it('keeps unreviewed frontend samples behind the staff preview gate', () => {
    for (const file of ['MilestoneDemo', 'Activities', 'Learn', 'HopeCenter', 'Favorites']) {
      const source = readFileSync(`src/screens/${file}.tsx`, 'utf8');
      expect(source, file).toContain('useStaffPreviewAccess');
      expect(source, file).toContain('UnreviewedContentNotice');
    }
  });
});
