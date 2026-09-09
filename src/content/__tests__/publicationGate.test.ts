import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const librarySource = readFileSync('convex/library.ts', 'utf8');
const visibilitySource = readFileSync('convex/lib/publicationVisibility.ts', 'utf8');
const workflowSource = readFileSync('convex/content.ts', 'utf8');
const releaseSource = readFileSync('convex/release.ts', 'utf8');
const libraryAdminSource = readFileSync('src/screens/LibraryAdmin.tsx', 'utf8');
const contentDetailSource = readFileSync('src/screens/ContentDetail.tsx', 'utf8');
const aiReleaseSource = readFileSync('convex/aiPublication.ts', 'utf8');
const aiReleaseDataSource = readFileSync('convex/lib/aiPublicationReleaseData.ts', 'utf8');
const aiVisibilitySource = readFileSync('convex/lib/aiPublicationVisibility.ts', 'utf8');

describe('risk-scoped publication gate', () => {
  it('keeps final publication owner-scoped while preserving specialist provenance separately', () => {
    expect(librarySource).toContain("args.clinicalStatus === 'published'");
    expect(librarySource).toContain('specialistReviewReason(item)');
    expect(librarySource).toContain('specialist review limited to emergency wording');
    expect(librarySource).toContain('await requireProfessionalPublisher(ctx)');
    expect(librarySource).toContain('frozenClinicalPublicationApproval(ctx, item)');
    expect(librarySource).toContain('reviewScope: approval?.scope');
    expect(librarySource).toContain('isRegisteredReleaseContentTarget');
    expect(librarySource).not.toContain('await requireClinicalPublisher(ctx)');
  });

  it('requires the latest decision for every current-revision dimension', () => {
    expect(librarySource).toContain("withIndex('by_content_dimension_version'");
    expect(librarySource).toContain('.take(1)');
    expect(librarySource).toContain("latestDecision?.decision !== 'approved'");
    expect(librarySource).not.toContain(".filter((row) => row.contentVersion === revision && row.decision === 'approved')");
  });

  it('requires a current approved evidence source and rejects broken evidence links', () => {
    expect(visibilitySource).toContain("withIndex('by_kind_slug'");
    expect(visibilitySource).toContain("withIndex('by_source_id'");
    expect(visibilitySource).toContain('evaluatePublicationEvidence(');
    expect(librarySource).toContain('publicationEvidenceForContent(ctx, item)');
    expect(librarySource).toContain('Evidence is not ready for publication');
  });

  it('applies owner-only publication and the frozen provenance gate to the legacy workflow', () => {
    expect(workflowSource).toContain("['approved', 'published'].includes(to)");
    expect(workflowSource).toContain('await requireProfessionalPublisher(ctx)');
    expect(workflowSource).toContain('frozenClinicalPublicationApproval(ctx, { slug: item.slug!, reviewRevision })');
    expect(workflowSource).not.toContain('await requireClinicalPublisher(ctx)');
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
    expect(visibilitySource).toContain("return status === 'published'");
    expect(librarySource).toContain('filterParentReadableContent(ctx, rows)');
    expect(librarySource).toContain('contentIsParentReadable(ctx, item)');
  });

  it('keeps the AI educational lane separate, exact-snapshot bound and default-off', () => {
    expect(visibilitySource).toContain('contentIsAiParentReadable');
    expect(aiVisibilitySource).toContain('aiPublicationMasterEnabled()');
    expect(aiVisibilitySource).toContain('aiReleaseMatchesCurrentState');
    expect(aiVisibilitySource).toContain('content.aiPublicationReleaseId !== release.releaseId');
    expect(aiVisibilitySource).toContain('release.sourceSnapshots.map');
    expect(aiReleaseSource).toContain('v.literal(AI_PUBLICATION_RELEASE_ID)');
    expect(aiReleaseDataSource).toContain("reviewStatus: 'awaiting_review'");
    expect(aiReleaseSource).toContain("clinicalStatus: 'clinical_review'");
    expect(aiReleaseSource).not.toContain("clinicalStatus: 'published'");
    expect(aiReleaseDataSource).not.toContain("reviewStatus: 'approved'");
    expect(aiReleaseSource).not.toContain('contentReviews');
    expect(aiReleaseSource).toContain('AI publication release preimage drifted; no writes applied');
    expect(aiReleaseSource).toContain('AI publication environment master is disabled');
    expect(aiReleaseSource).toContain('export const emergencyDisable = internalMutation');
    expect(visibilitySource).toContain('now = Date.now()');
    expect(visibilitySource).not.toContain('T12:00:00Z');
  });

  it('automatically withdraws offline rows and media from a complete live publication manifest', () => {
    expect(librarySource).toContain('export const publicationManifest = query');
    expect(librarySource).toContain("withIndex('by_status'");
    expect(librarySource).toContain("q.eq('clinicalStatus', 'published')");
    expect(librarySource).toContain('PUBLICATION_MANIFEST_LIMIT + 1');
    expect(librarySource).toContain('activeAiParentReadableContent(ctx)');

    const offlineHook = readFileSync('src/app/useOfflineLibrary.ts', 'utf8');
    expect(offlineHook).toContain('api.library.publicationManifest');
    expect(offlineHook).toContain('withdrawUnavailableOfflineContent');
    expect(offlineHook).toContain('removeOfflineMedia');

    const app = readFileSync('src/app/App.tsx', 'utf8');
    expect(app).toContain('useOfflineWithdrawal();');
  });

  it('does not allow parents to complete an unpublished activity', () => {
    const activitiesSource = readFileSync('convex/activities.ts', 'utf8');
    expect(activitiesSource).toContain('contentIsParentReadable(ctx, content)');
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
