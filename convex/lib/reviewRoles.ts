import { v } from 'convex/values';

export const STAFF_ROLES = [
  'owner',
  'content_editor',
  'language_reviewer',
  'evidence_reviewer',
  'clinical_reviewer',
  'support',
  'system_admin',
  'review_manager',
  'myanmar_language_reviewer',
  'child_development_reviewer',
  'publisher',
  'auditor',
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const staffRoleValidator = v.union(
  v.literal('owner'),
  v.literal('content_editor'),
  v.literal('language_reviewer'),
  v.literal('evidence_reviewer'),
  v.literal('clinical_reviewer'),
  v.literal('support'),
  v.literal('system_admin'),
  v.literal('review_manager'),
  v.literal('myanmar_language_reviewer'),
  v.literal('child_development_reviewer'),
  v.literal('publisher'),
  v.literal('auditor'),
);

export type StaffCapability =
  | 'manage_system'
  | 'manage_reviewers'
  | 'manage_assignments'
  | 'view_all_reviews'
  | 'review_language'
  | 'review_development'
  | 'review_evidence'
  | 'review_clinical'
  | 'edit_content'
  | 'publish_content'
  | 'view_audit'
  | 'export_reviews';

const CAPABILITIES: Record<StaffRole, readonly StaffCapability[]> = {
  owner: [
    'manage_system',
    'manage_reviewers',
    'manage_assignments',
    'view_all_reviews',
    'review_language',
    'review_development',
    'review_evidence',
    'edit_content',
    'publish_content',
    'view_audit',
    'export_reviews',
  ],
  system_admin: ['manage_system', 'manage_reviewers', 'view_all_reviews', 'view_audit'],
  content_editor: ['edit_content', 'view_all_reviews'],
  review_manager: ['manage_reviewers', 'manage_assignments', 'view_all_reviews', 'export_reviews'],
  language_reviewer: ['review_language'],
  myanmar_language_reviewer: ['review_language'],
  child_development_reviewer: ['review_development'],
  evidence_reviewer: ['review_evidence'],
  clinical_reviewer: ['review_clinical', 'review_evidence'],
  publisher: ['publish_content', 'view_all_reviews'],
  auditor: ['view_all_reviews', 'view_audit', 'export_reviews'],
  support: [],
};

export function hasCapability(roles: readonly StaffRole[], capability: StaffCapability): boolean {
  return roles.some((role) => CAPABILITIES[role].includes(capability));
}

export function distinctRoles(primary: StaffRole, additional: readonly StaffRole[] | undefined): StaffRole[] {
  return [...new Set([primary, ...(additional ?? [])])];
}

export type ReviewerType = Extract<
  StaffRole,
  | 'language_reviewer'
  | 'myanmar_language_reviewer'
  | 'child_development_reviewer'
  | 'evidence_reviewer'
  | 'clinical_reviewer'
>;

/**
 * The owner may personally complete non-clinical editorial reviews while
 * keeping the normal assignment, checklist, decision, and audit trail.
 * Clinical review remains restricted to a separately qualified clinical role.
 */
export function mayActAsReviewerType(roles: readonly StaffRole[], reviewerType: ReviewerType): boolean {
  if (roles.includes(reviewerType)) return true;
  return roles.includes('owner') && reviewerType !== 'clinical_reviewer';
}

export function reviewerTypeMayReviewDimension(reviewerType: ReviewerType, dimension: string): boolean {
  if (reviewerType === 'clinical_reviewer') return ['clinical', 'safety', 'evidence'].includes(dimension);
  if (reviewerType === 'evidence_reviewer') return dimension === 'evidence';
  if (reviewerType === 'child_development_reviewer') return dimension === 'development';
  return dimension === 'english' || dimension === 'native_myanmar';
}
