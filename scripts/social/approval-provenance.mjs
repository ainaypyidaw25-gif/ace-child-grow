function isPublished(item) {
  return Boolean(item && (item.alreadyPublished || item.status === 'published' || item.platformPostId))
}

export function invalidateGeneratedApproval(candidate) {
  return {
    ...candidate,
    status: 'draft',
    approvalStatus: 'review_required',
    reviewerId: null,
    approvalTimestamp: null,
    approvalExpiresAt: null,
    approvedContentHash: null,
    alreadyPublished: false,
    platformPostId: null,
    platformPermalink: null,
  }
}

export function reconcileGeneratedApproval({ candidate, currentContentHash, prior, forceReview = false }) {
  if (!candidate?.id || !candidate?.mediaSha256 || !currentContentHash) {
    throw new Error('Generated Facebook approval reconciliation requires id, mediaSha256, and content hash')
  }

  if (isPublished(prior)) {
    const unchangedPublishedContent =
      prior.mediaSha256 === candidate.mediaSha256 &&
      prior.approvedContentHash === currentContentHash

    if (!unchangedPublishedContent) {
      throw new Error(`Refusing to change already-published Facebook content: ${candidate.id}`)
    }

    return {
      ...candidate,
      status: 'published',
      approvalStatus: prior.approvalStatus,
      reviewerId: prior.reviewerId,
      approvalTimestamp: prior.approvalTimestamp,
      approvalExpiresAt: prior.approvalExpiresAt ?? null,
      approvedContentHash: prior.approvedContentHash,
      alreadyPublished: true,
      platformPostId: prior.platformPostId || null,
      platformPermalink: prior.platformPermalink || null,
      publishedAt: prior.publishedAt || null,
    }
  }

  const hasMatchingApproval =
    !forceReview &&
    prior?.approvalStatus === 'approved' &&
    Boolean(prior.reviewerId) &&
    Boolean(prior.approvalTimestamp) &&
    prior.mediaSha256 === candidate.mediaSha256 &&
    prior.approvedContentHash === currentContentHash

  if (!hasMatchingApproval) return invalidateGeneratedApproval(candidate)

  return {
    ...candidate,
    status: prior.status === 'scheduled' ? 'scheduled' : 'draft',
    approvalStatus: 'approved',
    reviewerId: prior.reviewerId,
    approvalTimestamp: prior.approvalTimestamp,
    approvalExpiresAt: prior.approvalExpiresAt ?? null,
    approvedContentHash: prior.approvedContentHash,
    alreadyPublished: false,
    platformPostId: null,
    platformPermalink: null,
  }
}
