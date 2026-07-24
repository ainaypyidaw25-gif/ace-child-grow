// Content review workflow state machine (Phase 23). Pure + tested.
//
// Enforces the editorial pipeline. Content is only visible to parents at
// 'published'. Transitions are validated so content cannot skip clinical review.

export const REVIEW_STATES = [
  'draft',
  'content_review',
  'translation_review',
  'clinical_review',
  'approved',
  'published',
  'archived',
] as const;
export type ReviewState = (typeof REVIEW_STATES)[number];

// Allowed forward/backward transitions. A rejection sends content back one step;
// anything can be archived; published can be unpublished back to approved.
const TRANSITIONS: Record<ReviewState, ReviewState[]> = {
  draft: ['content_review', 'archived'],
  content_review: ['translation_review', 'draft', 'archived'],
  translation_review: ['clinical_review', 'content_review', 'archived'],
  clinical_review: ['approved', 'translation_review', 'archived'],
  approved: ['published', 'clinical_review', 'archived'],
  published: ['approved', 'archived'], // unpublish or archive
  archived: ['draft'], // restore to editing
};

export function canTransition(from: ReviewState, to: ReviewState): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export class WorkflowError extends Error {
  constructor(from: ReviewState, to: ReviewState) {
    super(`Invalid content transition: ${from} → ${to}`);
    this.name = 'WorkflowError';
  }
}

export function transition(from: ReviewState, to: ReviewState): ReviewState {
  if (!canTransition(from, to)) throw new WorkflowError(from, to);
  return to;
}

/** The single next "advance" step in the happy path, or null at the end. */
export function nextStep(from: ReviewState): ReviewState | null {
  const happyPath: Partial<Record<ReviewState, ReviewState>> = {
    draft: 'content_review',
    content_review: 'translation_review',
    translation_review: 'clinical_review',
    clinical_review: 'approved',
    approved: 'published',
  };
  return happyPath[from] ?? null;
}

/** Content is shown to parents ONLY when published. */
export function isParentVisible(state: ReviewState): boolean {
  return state === 'published';
}
