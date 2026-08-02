import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const librarySource = readFileSync('convex/library.ts', 'utf8');
const workflowSource = readFileSync('convex/content.ts', 'utf8');
const releaseSource = readFileSync('convex/release.ts', 'utf8');
const libraryAdminSource = readFileSync('src/screens/LibraryAdmin.tsx', 'utf8');
const contentDetailSource = readFileSync('src/screens/ContentDetail.tsx', 'utf8');

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
    for (const file of ['MilestoneDemo', 'Activities', 'Learn']) {
      const source = readFileSync(`src/screens/${file}.tsx`, 'utf8');
      // Either the gated server query directly, or useLibraryContent — the
      // offline-aware wrapper around it. Never local sample content.
      expect(source, file).toMatch(/api\.library\.listByType|useLibraryContent\(/);
      expect(source, file).not.toContain('SAMPLE_');
    }
    // That wrapper must itself go through the gated query, and its offline
    // fallback may only ever hold published rows.
    const offlineHook = readFileSync('src/app/useOfflineLibrary.ts', 'utf8');
    expect(offlineHook).toContain('api.library.listByType');
    expect(offlineHook).toContain('selectDownloadable');
    expect(offlineHook).toContain('api.media.listForContent');
    const offlineDomain = readFileSync('src/domain/offline/offlineLibrary.ts', 'utf8');
    expect(offlineDomain).toContain("row.clinicalStatus === 'published'");
    for (const file of ['HopeCenter', 'Favorites']) {
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

  it('keeps the retired bulk-publication endpoints retired across every convex module', () => {
    // PR #31 regression guard: no server module may reintroduce a bulk
    // education-scoped publication path or its audit signatures.
    const files = readdirSync('convex').filter((name) => name.endsWith('.ts'));
    for (const name of files) {
      const source = readFileSync(`convex/${name}`, 'utf8');
      expect(source, `convex/${name} must not reference publishAll audit actions`).not.toContain("'library.education.publishAll'");
      expect(source, `convex/${name} must not reference publishAll audit actions`).not.toContain("'content.education.publishAll'");
    }
    expect(releaseSource).toContain('Bulk education-scoped publication has been retired');
    expect(releaseSource).toContain('Bulk legacy publication has been retired');
  });

  it('retires unsafe education-scoped bulk publication endpoints', () => {
    expect(releaseSource).toContain('Bulk education-scoped publication has been retired');
    expect(releaseSource).toContain('Bulk legacy publication has been retired');
    expect(releaseSource).not.toContain("'library.education.publishAll'");
    expect(releaseSource).not.toContain("'content.education.publishAll'");
  });

  it('supports professionally reviewed original animations without requiring filmed video', () => {
    expect(librarySource).toContain("v.literal('animation')");
    expect(libraryAdminSource).toContain('Original 2D animation');
    expect(libraryAdminSource).toContain("kind !== 'illustration'");
    expect(contentDetailSource).toContain("asset.kind === 'video' || asset.kind === 'animation'");
  });
});
