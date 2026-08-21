import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoFile = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const ACTIVE_REVIEW_SURFACES = [
  'src/screens/ContentReviewWorkspace.tsx',
  'src/screens/AdminReviewActivity.tsx',
  'src/screens/AdminReviewQueue.tsx',
  'src/screens/AdminTeam.tsx',
  'src/screens/ContentDetail.tsx',
  'src/screens/LibraryAdmin.tsx',
  'src/screens/ReviewBatchPanel.tsx',
  'src/screens/ownerPriority/OwnerActionsPanel.tsx',
  'src/screens/ownerPriority/OwnerPriorityView.tsx',
  'src/components/OwnDisplayName.tsx',
  'src/content/seed/activities.ts',
  'src/content/seed/specialNeeds.ts',
  'convex/admin.ts',
  'convex/ownerPriority.ts',
  'convex/release.ts',
  'README.md',
  'docs/content/evidence-and-safety-review-policy.md',
  'docs/content/myanmar-terminology-glossary.md',
  'docs/operations/admin-guide.md',
  'docs/product/user-flows.md',
] as const;

describe('evidence-and-safety review terminology', () => {
  it('does not present active review surfaces as clinical approval', () => {
    const forbidden = /\bclinical(?:ly)?\s+(?:approval|approved|review|reviewer)\b/i;
    for (const path of ACTIVE_REVIEW_SURFACES) {
      expect(repoFile(path), path).not.toMatch(forbidden);
    }
  });

  it('uses specialist safety language internally without repeating review claims publicly', () => {
    const workspace = repoFile('src/screens/ContentReviewWorkspace.tsx');
    const team = repoFile('src/screens/AdminTeam.tsx');
    const parentDetail = repoFile('src/screens/ContentDetail.tsx');

    expect(workspace).toContain("en: 'Specialist safety review'");
    expect(team).toContain("en: 'Specialist safety reviewer'");
    expect(parentDetail).not.toContain('has completed English, Myanmar, evidence and safety review');
    expect(parentDetail).not.toContain('ai-publication-disclosure');
    expect(parentDetail).not.toContain('reviewerDisplayName');
  });

  it('documents official public evidence and keeps high-risk wording fail-closed', () => {
    const policy = repoFile('docs/content/evidence-and-safety-review-policy.md');

    expect(policy).toContain('https://www.cdc.gov/milestones');
    expect(policy).toContain('https://www.who.int/teams/maternal-newborn-child-adolescent-health-and-ageing/child-health/nurturing-care');
    expect(policy).toContain('https://www.unicef.org/early-childhood-development');
    expect(policy).toContain('https://www.unicef.org/documents/care-child-development');
    expect(policy).toContain('`SPECIALIST REVIEW REQUIRED`');
    expect(policy).toMatch(/Unpublished media and citations remain\s+hidden/);
    expect(policy).toMatch(/offline storage retains published rows only/);
  });

  it('keeps source verification distinct from a personal endorsement', () => {
    const specialNeeds = repoFile('src/content/seed/specialNeeds.ts');

    expect(specialNeeds).toContain('Public guidance links are recorded');
    expect(specialNeeds).toContain('no individual clinician endorsement is claimed');
    expect(specialNeeds).toContain('SPECIALIST REVIEW REQUIRED');
  });
});
