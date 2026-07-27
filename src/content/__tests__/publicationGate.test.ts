import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const librarySource = readFileSync('convex/library.ts', 'utf8');
const workflowSource = readFileSync('convex/content.ts', 'utf8');

describe('clinically scoped publication gate', () => {
  it('requires a named qualified clinical reviewer before library content can be published', () => {
    expect(librarySource).toContain("args.clinicalStatus === 'published'");
    expect(librarySource).toContain('await requireClinicalPublisher(ctx)');
  });

  it('requires a named qualified clinical reviewer before workflow approval or publishing', () => {
    expect(workflowSource).toContain("['approved', 'published'].includes(to)");
    expect(workflowSource).toContain('await requireClinicalPublisher(ctx)');
  });

  it('keeps unreviewed frontend samples behind the staff preview gate or reads only server-published library content', () => {
    for (const file of ['MilestoneDemo', 'Activities']) {
      const source = readFileSync(`src/screens/${file}.tsx`, 'utf8');
      expect(source, file).toContain('api.library.listByType');
      expect(source, file).not.toContain('SAMPLE_');
    }
    for (const file of ['Learn', 'HopeCenter', 'Favorites']) {
      const source = readFileSync(`src/screens/${file}.tsx`, 'utf8');
      expect(source, file).toContain('useStaffPreviewAccess');
      expect(source, file).toContain('UnreviewedContentNotice');
    }
  });

  it('filters clinical-review library rows from both non-staff list and detail queries', () => {
    expect(librarySource).toContain("if (!staff) rows = rows.filter((r) => r.clinicalStatus === 'published')");
    expect(librarySource).toContain("if (!staff && item.clinicalStatus !== 'published') return { restricted: true }");
  });
});
