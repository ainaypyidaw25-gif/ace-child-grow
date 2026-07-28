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

  it('keeps review-pending static samples out of parent screens', () => {
    for (const file of ['MilestoneDemo', 'Activities']) {
      const source = readFileSync(`src/screens/${file}.tsx`, 'utf8');
      expect(source, file).toContain('api.library.listByType');
      expect(source, file).not.toContain('SAMPLE_');
    }
    for (const file of ['Learn', 'HopeCenter', 'Favorites']) {
      const source = readFileSync(`src/screens/${file}.tsx`, 'utf8');
      expect(source, file).toContain('isApprovedForParents');
      expect(source, file).not.toContain('ReviewOngoingNotice');
    }
  });

  it('shows only published library rows to parents while staff can inspect review states', () => {
    expect(librarySource).toContain("return status === 'published'");
    expect(librarySource).toContain('isPubliclyReadableStatus(r.clinicalStatus)');
    expect(librarySource).toContain('!isPubliclyReadableStatus(item.clinicalStatus)');
  });

  it('does not allow parents to complete an unpublished activity', () => {
    const activitiesSource = readFileSync('convex/activities.ts', 'utf8');
    expect(activitiesSource).toContain("content.clinicalStatus !== 'published'");
  });
});
