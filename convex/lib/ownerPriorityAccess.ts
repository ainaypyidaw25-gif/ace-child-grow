/**
 * Who may see how much of the Owner Priority workspace.
 *
 * The full queue is a catalogue-wide management view: it exposes every content
 * item, reviewer display names, decision timing and edit activity. That is an
 * owner/manager view, not a reviewer view — a language reviewer has no business
 * reading which specialist safety reviewer touched which record and when. This module is
 * the single source of that rule, consumed by the Convex handlers and the UI.
 *
 * Three access levels:
 *
 *   full               owner (and system_admin / review_manager where the
 *                      deployment supports those roles) — every row, every
 *                      field, authoritative counts, governance mutations.
 *   correction_scoped  content_editor — may work the correction actions on
 *                      content it is authorised for, but does NOT get the
 *                      catalogue-wide roster: reviewer identities, decision
 *                      timings and edit activity are stripped.
 *   assignment_scoped  language/evidence/specialist reviewers — only records
 *                      scoped to them, with other reviewers' identities and
 *                      activity stripped.
 *   none               support and non-staff.
 *
 * NOTE ON ROLE SUPPORT. `review_manager` IS a real role: it is defined in the
 * staffRole union and can be invited from the admin team screen. It sees the
 * whole queue and manages governance, but records no review decision and
 * cannot publish — see roleMayReview in ./reviewPolicy, which refuses it every
 * dimension, and requireProfessionalPublisher in ./auth, which does not list
 * it. `system_admin` is named here but deliberately NOT defined as a role:
 * its powers are undefined, and inventing them would be this module deciding
 * a governance question that belongs to the owner. It grants nothing today
 * because no account can hold it.
 *
 * Pure by design — no Convex imports.
 */

export type QueueAccessLevel = 'full' | 'correction_scoped' | 'assignment_scoped' | 'none';

/** Roles that may see the whole catalogue and the reviewer roster. */
export const FULL_QUEUE_ROLES = ['owner', 'system_admin', 'review_manager'] as const;

/** Roles whose queue is limited to records scoped to them as a reviewer. */
export const ASSIGNMENT_SCOPED_ROLES = [
  'language_reviewer',
  'evidence_reviewer',
  'clinical_reviewer',
] as const;

export function queueAccessLevel(role: string | null | undefined): QueueAccessLevel {
  if (!role || role === 'support') return 'none';
  if ((FULL_QUEUE_ROLES as readonly string[]).includes(role)) return 'full';
  if (role === 'content_editor') return 'correction_scoped';
  if ((ASSIGNMENT_SCOPED_ROLES as readonly string[]).includes(role)) return 'assignment_scoped';
  return 'none';
}

/** Only full access may read reviewer names, decision timing and edit activity. */
export function maySeeReviewerActivity(role: string | null | undefined): boolean {
  return queueAccessLevel(role) === 'full';
}

/** Only full access may change governance labels or confirm a classification. */
export function mayManageGovernance(role: string | null | undefined): boolean {
  return queueAccessLevel(role) === 'full';
}

/** Full access and content editors may request reviews on authorised content. */
export function mayRequestReviews(role: string | null | undefined): boolean {
  const level = queueAccessLevel(role);
  return level === 'full' || level === 'correction_scoped';
}

/**
 * Which review dimensions a reviewer role is scoped to. Used to decide which
 * records an assignment-scoped reviewer may see at all: a record is in scope
 * when one of its required dimensions belongs to that reviewer's role.
 */
export function scopedDimensionsForRole(role: string | null | undefined): string[] {
  if (role === 'language_reviewer') return ['native_myanmar', 'english'];
  if (role === 'evidence_reviewer') return ['evidence'];
  if (role === 'clinical_reviewer') return ['clinical', 'safety'];
  return [];
}

export interface ScopableRow {
  requiredReviewDimensions: string[];
  suggestedReviewDimensions: string[];
}

/**
 * Whether an assignment-scoped reviewer may see this record. Suggested
 * dimensions count as well as confirmed ones: a record awaiting manual triage
 * that *may* need specialist safety review should still reach that reviewer's
 * queue rather than being invisible until a manager acts.
 */
export function rowInReviewerScope(role: string | null | undefined, row: ScopableRow): boolean {
  const scoped = scopedDimensionsForRole(role);
  if (scoped.length === 0) return false;
  return scoped.some(
    (dimension) =>
      row.requiredReviewDimensions.includes(dimension) || row.suggestedReviewDimensions.includes(dimension),
  );
}

export const ACCESS_REFUSAL_LABELS = {
  not_staff: {
    mm: 'ဤနေရာသို့ ဝင်ခွင့် မရှိပါ။',
    en: 'Your account does not have access to this workspace.',
  },
  full_queue_owner_only: {
    mm: 'ဦးစားပေးတန်း အပြည့်အစုံကို ပိုင်ရှင် သို့မဟုတ် စစ်ဆေးရေးမန်နေဂျာသာ ကြည့်နိုင်သည်။',
    en: 'Only an owner or review manager can view the full priority queues.',
  },
  governance_owner_only: {
    mm: 'ဦးစားပေး စီမံခန့်ခွဲမှုကို ပိုင်ရှင် သို့မဟုတ် စစ်ဆေးရေးမန်နေဂျာသာ ပြောင်းလဲနိုင်သည်။',
    en: 'Only an owner or review manager can change priority governance.',
  },
} as const;
