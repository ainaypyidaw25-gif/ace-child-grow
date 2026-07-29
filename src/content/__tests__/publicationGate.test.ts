import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const librarySource = readFileSync('convex/library.ts', 'utf8');
const workflowSource = readFileSync('convex/content.ts', 'utf8');
const libraryAdminSource = readFileSync('src/screens/LibraryAdmin.tsx', 'utf8');
const contentDetailSource = readFileSync('src/screens/ContentDetail.tsx', 'utf8');

describe('clinically scoped publication gate', () => {
  it('requires a separate publisher and named qualified clinical decision before publication', () => {
    expect(librarySource).toContain("args.clinicalStatus === 'published'");
    expect(librarySource).toContain('await requirePublisher(ctx)');
    expect(librarySource).toContain('A named, qualified clinical approval is required');
  });

  it('requires a named qualified clinical reviewer before workflow approval or publishing', () => {
    expect(workflowSource).toContain("['approved', 'published'].includes(to)");
    expect(workflowSource).toContain('await requireClinicalPublisher(ctx)');
  });

  it('keeps review-pending static samples out of parent screens', () => {
    for (const file of ['MilestoneDemo', 'Activities', 'Learn']) {
      const source = readFileSync(`src/screens/${file}.tsx`, 'utf8');
      expect(source, file).toContain('api.library.listByType');
      expect(source, file).not.toContain('SAMPLE_');
    }
    for (const file of ['HopeCenter', 'Favorites']) {
      const source = readFileSync(`src/screens/${file}.tsx`, 'utf8');
      expect(source, file).toContain('isApprovedForParents');
      expect(source, file).not.toContain('ReviewOngoingNotice');
    }
  });

  it('shows only published library rows to parents while staff can inspect review states', () => {
    expect(librarySource).toContain("content.reviewScope === 'clinical'");
    expect(librarySource).toContain("content.publicationStatus === 'published'");
    expect(librarySource).toContain('rows.filter(isPubliclyReadableContent)');
    expect(librarySource).toContain('!isPubliclyReadableContent(item)');
  });

  it('does not allow parents to complete an unpublished activity', () => {
    const activitiesSource = readFileSync('convex/activities.ts', 'utf8');
    expect(activitiesSource).toContain('!isPubliclyReadableContent(content)');
  });

  it('supports professionally reviewed original animations without requiring filmed video', () => {
    expect(librarySource).toContain("v.literal('animation')");
    expect(libraryAdminSource).toContain('Original 2D animation');
    expect(libraryAdminSource).toContain("kind !== 'illustration'");
    expect(contentDetailSource).toContain("asset.kind === 'video' || asset.kind === 'animation'");
  });
});
