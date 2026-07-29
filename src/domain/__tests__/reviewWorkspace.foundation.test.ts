import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { hasCapability } from '../../../convex/lib/reviewRoles';

const schema = readFileSync('convex/schema.ts', 'utf8');
const auth = readFileSync('convex/lib/auth.ts', 'utf8');
const invites = readFileSync('convex/admin.ts', 'utf8');
const assignments = readFileSync('convex/reviewAssignments.ts', 'utf8');
const reviews = readFileSync('convex/contentReviews.ts', 'utf8');
const checklists = readFileSync('convex/reviewChecklists.ts', 'utf8');
const checklistRules = readFileSync('convex/lib/reviewChecklists.ts', 'utf8');
const collaboration = readFileSync('convex/reviewCollaboration.ts', 'utf8');
const reports = readFileSync('convex/reviewReports.ts', 'utf8');
const library = readFileSync('convex/library.ts', 'utf8');
const release = readFileSync('convex/release.ts', 'utf8');
const app = readFileSync('src/app/App.tsx', 'utf8');

describe('review workspace security foundation', () => {
  it('keeps clinical approval and publication as separate capabilities', () => {
    expect(hasCapability(['clinical_reviewer'], 'review_clinical')).toBe(true);
    expect(hasCapability(['clinical_reviewer'], 'publish_content')).toBe(false);
    expect(hasCapability(['publisher'], 'publish_content')).toBe(true);
    expect(hasCapability(['publisher'], 'review_clinical')).toBe(false);
  });

  it('does not let language or development reviewers grant clinical approval', () => {
    expect(hasCapability(['myanmar_language_reviewer'], 'review_clinical')).toBe(false);
    expect(hasCapability(['child_development_reviewer'], 'review_clinical')).toBe(false);
  });

  it('models scoped, expiring, single-use reviewer invitations with terms', () => {
    for (const field of ['reviewScope', 'ageGroups', 'contentTypes', 'termsVersion', 'termsAcceptedAt']) {
      expect(schema).toContain(field);
    }
    expect(invites).toContain('Current reviewer terms must be accepted');
    expect(invites).toContain("status: 'accepted'");
  });

  it('stores assignments and append-only review events', () => {
    expect(schema).toContain('reviewAssignments: defineTable');
    expect(schema).toContain('reviewEvents: defineTable');
    expect(assignments).toContain("ctx.db.insert('reviewEvents'");
  });

  it('requires manager authority to create assignments', () => {
    expect(assignments).toContain('await requireReviewManager(ctx)');
    expect(assignments).toContain('Reviewer does not hold the assigned reviewer role');
  });

  it('restricts reviewer queues and decisions to active assignments', () => {
    expect(assignments).toContain("withIndex('by_reviewer'");
    expect(reviews).toContain('An active assignment is required');
  });

  it('appends decisions instead of patching the prior decision row', () => {
    expect(reviews).toContain("ctx.db.insert('contentReviews'");
    expect(reviews).not.toContain('ctx.db.patch(existing._id');
  });

  it('makes parent publication fail closed for exact clinically reviewed revision', () => {
    expect(library).toContain("content.reviewScope === 'clinical'");
    expect(library).toContain("content.publicationStatus === 'published'");
    expect(library).toContain('content.publicationRevision === (content.reviewRevision ?? 1)');
  });

  it('retires both bulk publication endpoints', () => {
    expect(release).toContain('Bulk education-scoped publication has been retired');
    expect(release).toContain('Bulk legacy publication has been retired');
    expect(release).not.toContain("'library.education.publishAll'");
  });

  it('uses role-aware frontend route boundaries in addition to server checks', () => {
    expect(app).toContain('function StaffRoleRoute');
    expect(app).toContain("allowedRoles={['owner', 'system_admin', 'review_manager']}");
    expect(auth).toContain('requirePublisher');
  });

  it('requires a complete role-specific checklist before approval', () => {
    expect(schema).toContain('reviewChecklists: defineTable');
    expect(checklistRules).toContain('native_myanmar');
    expect(checklistRules).toContain('clinical');
    expect(reviews).toContain('Complete every required checklist item before approval');
  });

  it('allows reviewers to edit only their own active assignment checklist', () => {
    expect(checklists).toContain("assignment.reviewerId !== userId");
    expect(checklists).toContain("assignment.status === 'cancelled'");
    expect(checklists).toContain("action: 'review.checklist.saved'");
  });

  it('does not let reviewers bypass a decision by transitioning an assignment to approved', () => {
    expect(assignments).toContain("'re_review_required', 'approved'");
  });

  it('stores proposals separately instead of overwriting canonical content', () => {
    expect(schema).toContain('reviewProposals: defineTable');
    expect(collaboration).toContain("ctx.db.insert('reviewProposals'");
    expect(collaboration).not.toContain("ctx.db.patch('libraryContent'");
  });

  it('keeps comments and proposal actions in the immutable review timeline', () => {
    expect(schema).toContain('reviewComments: defineTable');
    expect(collaboration).toContain("action: 'review.comment.added'");
    expect(collaboration).toContain("'review.proposal.submitted'");
  });

  it('provides manual payment reporting without payment processing', () => {
    expect(schema).toContain('reviewPaymentBatches: defineTable');
    expect(reports).toContain('proposedPayableMmk');
    expect(reports).not.toMatch(/checkout|charge|paymentIntent/i);
  });
});
