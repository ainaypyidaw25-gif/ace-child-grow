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

  it('shows review-pending educational samples with an honest ongoing-review notice', () => {
    for (const file of ['MilestoneDemo', 'Activities']) {
      const source = readFileSync(`src/screens/${file}.tsx`, 'utf8');
      expect(source, file).toContain('api.library.listByType');
      expect(source, file).not.toContain('SAMPLE_');
    }
    for (const file of ['Learn', 'HopeCenter', 'Favorites']) {
      const source = readFileSync(`src/screens/${file}.tsx`, 'utf8');
      expect(source, file).toContain('ReviewOngoingNotice');
      expect(source, file).not.toContain('UnreviewedContentNotice');
    }
  });

  it('shows active review-pending library rows while keeping archived rows private', () => {
    expect(librarySource).toContain("return status !== 'archived'");
    expect(librarySource).toContain('isPubliclyReadableStatus(r.clinicalStatus)');
    expect(librarySource).toContain('!isPubliclyReadableStatus(item.clinicalStatus)');
  });
});
