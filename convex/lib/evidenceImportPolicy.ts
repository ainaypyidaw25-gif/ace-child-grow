export type EvidenceImportReviewPolicy = {
  resetReview: boolean;
  reviewStatus: string;
};

export type StoredEvidenceReview<TReviewerId = unknown> = {
  reviewStatus: string;
  reviewer: string | null;
  reviewerQualification?: string;
  reviewDate: string | null;
  nextReviewDate: string | null;
  reviewNote?: string;
  reviewerId?: TReviewerId;
  reviewScope?: 'education' | 'clinical';
};

/**
 * Importing publisher metadata must never carry an approval onto a materially
 * different record. Structurally incomplete registry rows are also forced
 * back to evidence_required even when the stored row was approved before the
 * policy existed. Retired rows stay retired as immutable audit history.
 */
export function evidenceImportReviewPolicy(
  existingStatus: string,
  incomingStatus: string,
  metadataChanged: boolean,
  publisherDueDateChanged: boolean,
): EvidenceImportReviewPolicy {
  if (existingStatus === 'retired') {
    return { resetReview: false, reviewStatus: 'retired' };
  }

  const structurallyIncomplete = incomingStatus === 'evidence_required';
  const resetReview = structurallyIncomplete || metadataChanged || publisherDueDateChanged;
  if (!resetReview) {
    return { resetReview: false, reviewStatus: existingStatus };
  }

  return {
    resetReview: true,
    reviewStatus: structurallyIncomplete ? 'evidence_required' : 'awaiting_review',
  };
}

/** Exact review fields written by the import handler for an existing row. */
export function evidenceImportReviewFields<TReviewerId>(
  existing: StoredEvidenceReview<TReviewerId>,
  incomingStatus: string,
  metadataChanged: boolean,
  incomingPublisherNextReviewDate: string | null,
): StoredEvidenceReview<TReviewerId> {
  const publisherDueDateChanged =
    incomingPublisherNextReviewDate !== null
    && incomingPublisherNextReviewDate !== existing.nextReviewDate;
  const policy = evidenceImportReviewPolicy(
    existing.reviewStatus,
    incomingStatus,
    metadataChanged,
    publisherDueDateChanged,
  );

  if (policy.resetReview) {
    return {
      reviewStatus: policy.reviewStatus,
      reviewer: null,
      reviewerQualification: undefined,
      reviewDate: null,
      nextReviewDate: incomingPublisherNextReviewDate,
      reviewNote: undefined,
      reviewerId: undefined,
      reviewScope: undefined,
    };
  }

  return {
    reviewStatus: policy.reviewStatus,
    reviewer: existing.reviewer,
    reviewerQualification: existing.reviewerQualification,
    reviewDate: existing.reviewDate,
    nextReviewDate: incomingPublisherNextReviewDate ?? existing.nextReviewDate ?? null,
    reviewNote: existing.reviewNote,
    reviewerId: existing.reviewerId,
    reviewScope: existing.reviewScope,
  };
}
