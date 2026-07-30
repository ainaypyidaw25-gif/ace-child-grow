import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  approvalNeedsQualification,
  REVIEW_REFUSAL_LABELS,
  reviewRefusal,
  roleMayReview,
  type ReviewDimension,
  type ReviewerRole,
} from '../../../convex/lib/reviewPolicy';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

const ROLES: ReviewerRole[] = [
  'owner', 'content_editor', 'language_reviewer',
  'evidence_reviewer', 'clinical_reviewer', 'support',
];

describe('review permission matrix', () => {
  it('lets only a clinical reviewer decide clinical and safety', () => {
    for (const dimension of ['clinical', 'safety'] as ReviewDimension[]) {
      for (const role of ROLES) {
        expect(roleMayReview(role, dimension), `${role} · ${dimension}`)
          .toBe(role === 'clinical_reviewer');
      }
    }
  });

  it('lets owner, content editor, evidence and clinical reviewers decide evidence', () => {
    const allowed = new Set(['owner', 'content_editor', 'evidence_reviewer', 'clinical_reviewer']);
    for (const role of ROLES) {
      expect(roleMayReview(role, 'evidence'), role).toBe(allowed.has(role));
    }
  });

  it('lets owner, content editor and language reviewers decide language areas', () => {
    const allowed = new Set(['owner', 'content_editor', 'language_reviewer']);
    for (const dimension of ['english', 'native_myanmar'] as ReviewDimension[]) {
      for (const role of ROLES) {
        expect(roleMayReview(role, dimension), `${role} · ${dimension}`).toBe(allowed.has(role));
      }
    }
  });

  it('never grants review rights to support or to a missing role', () => {
    for (const dimension of ['english', 'native_myanmar', 'evidence', 'safety', 'clinical'] as ReviewDimension[]) {
      expect(roleMayReview('support', dimension)).toBe(false);
      expect(roleMayReview(null, dimension)).toBe(false);
      expect(roleMayReview(undefined, dimension)).toBe(false);
      expect(roleMayReview('not_a_role', dimension)).toBe(false);
    }
  });

  it('requires a stated qualification only for professional sign-offs', () => {
    expect(approvalNeedsQualification('clinical')).toBe(true);
    expect(approvalNeedsQualification('safety')).toBe(true);
    expect(approvalNeedsQualification('evidence')).toBe(true);
    expect(approvalNeedsQualification('english')).toBe(false);
    expect(approvalNeedsQualification('native_myanmar')).toBe(false);
  });
});

describe('review refusal', () => {
  const base = {
    role: 'language_reviewer' as string,
    dimension: 'native_myanmar' as ReviewDimension,
    decision: 'in_review' as const,
    displayName: 'Reviewer',
    qualification: null,
    note: null,
    contentExists: true,
  };

  it('allows a well-formed decision', () => {
    expect(reviewRefusal(base)).toBeNull();
  });

  it('names each refusal reason with a code the UI can translate', () => {
    expect(reviewRefusal({ ...base, role: 'support' })?.code).toBe('not_staff');
    expect(reviewRefusal({ ...base, role: null })?.code).toBe('not_staff');
    expect(reviewRefusal({ ...base, dimension: 'clinical' })?.code).toBe('role_may_not_review_area');
    expect(reviewRefusal({ ...base, displayName: '  ' })?.code).toBe('display_name_required');
    expect(reviewRefusal({
      ...base, role: 'clinical_reviewer', dimension: 'clinical', decision: 'approved',
    })?.code).toBe('qualification_required');
    expect(reviewRefusal({ ...base, decision: 'changes_requested' })?.code).toBe('note_required');
    expect(reviewRefusal({ ...base, contentExists: false })?.code).toBe('content_not_found');
  });

  it('does not demand a qualification for an editorial approval', () => {
    expect(reviewRefusal({ ...base, decision: 'approved' })).toBeNull();
  });

  it('accepts a qualified professional approval', () => {
    expect(reviewRefusal({
      ...base,
      role: 'clinical_reviewer',
      dimension: 'clinical',
      decision: 'approved',
      qualification: 'MBBS',
    })).toBeNull();
  });

  it('carries a bilingual label for every refusal code it can return', () => {
    const codes = [
      'not_staff', 'role_may_not_review_area', 'display_name_required',
      'qualification_required', 'note_required', 'content_not_found',
    ] as const;
    for (const code of codes) {
      expect(REVIEW_REFUSAL_LABELS[code]?.mm, code).toBeTruthy();
      expect(REVIEW_REFUSAL_LABELS[code]?.en, code).toBeTruthy();
    }
  });
});

describe('the rule is not duplicated', () => {
  it('the review workspace consumes the shared matrix instead of reimplementing it', () => {
    const screen = readFileSync(resolve(REPO_ROOT, 'src/screens/ContentReviewWorkspace.tsx'), 'utf8');
    expect(screen).toContain("from '../../convex/lib/reviewPolicy'");
    // A second local copy of the rule is what let the UI offer an action the
    // server refused. It must not come back.
    expect(screen).not.toMatch(/function mayReview\s*\(/);
    expect(screen).not.toContain("role === 'clinical_reviewer'");
  });

  it('the mutation refuses in-band and never throws a policy error', () => {
    const server = readFileSync(resolve(REPO_ROOT, 'convex/contentReviews.ts'), 'utf8');
    expect(server).toContain('reviewRefusal(');
    expect(server).toContain("result: 'rejected'");
    expect(server).not.toContain('throw new Error');
  });
});
