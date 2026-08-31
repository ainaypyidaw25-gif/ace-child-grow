import { createHash } from 'node:crypto'

export const FACEBOOK_PAGE_ID = '111009258047115'
export const DEFAULT_MAX_BACKLOG_AGE_MINUTES = 180
export const DEFAULT_RESERVATION_LEASE_MINUTES = 10

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

export function approvedContentHash(item, mediaSha256 = item.mediaSha256) {
  return sha256(`${item.id}|${item.scheduledAt}|${item.captionMyanmar}|${mediaSha256}`)
}

export function validateManifestAndSelect(manifest, options = {}) {
  const now = options.now ?? Date.now()
  const maxBacklogAgeMinutes =
    manifest.publisherPolicy?.maxBacklogAgeMinutes ??
    options.maxBacklogAgeMinutes ??
    DEFAULT_MAX_BACKLOG_AGE_MINUTES
  const blockers = []

  if (manifest.killSwitch !== false) blockers.push('GLOBAL_KILL_SWITCH_ON')
  if (manifest.automationMode !== 'production') blockers.push('NOT_PRODUCTION_MODE')
  if (manifest.destination?.platform !== 'facebook') blockers.push('WRONG_PLATFORM')
  if (manifest.destination?.pageId !== FACEBOOK_PAGE_ID) blockers.push('PAGE_NOT_ALLOWLISTED')
  if (!/^v\d+\.\d+$/.test(manifest.destination?.graphApiVersion ?? '')) {
    blockers.push('INVALID_GRAPH_API_VERSION')
  }

  const due = (Array.isArray(manifest.items) ? manifest.items : [])
    .filter(
      (candidate) =>
        candidate.status === 'scheduled' &&
        candidate.approvalStatus === 'approved' &&
        Number.isFinite(Date.parse(candidate.scheduledAt ?? '')) &&
        Date.parse(candidate.scheduledAt) <= now &&
        !candidate.alreadyPublished &&
        !candidate.platformPostId &&
        !candidate.platformPermalink,
    )
    .sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt))

  const item = due[0] ?? null
  if (!item) blockers.push('NO_DUE_APPROVED_ITEM')

  if (item) {
    const mediaType = item.mediaType === 'photo' ? 'image' : item.mediaType
    const ageMinutes = Math.floor((now - Date.parse(item.scheduledAt)) / 60_000)
    if (ageMinutes > maxBacklogAgeMinutes) blockers.push('STALE_DUE_ITEM_REQUIRES_REVIEW')
    if (!item.reviewerId || !item.approvalTimestamp) blockers.push('MISSING_APPROVAL_AUDIT')
    if (item.approvalExpiresAt && Date.parse(item.approvalExpiresAt) <= now) {
      blockers.push('APPROVAL_EXPIRED')
    }
    if (!item.captionMyanmar?.trim()) blockers.push('EMPTY_CAPTION')
    if (!item.mediaUrl?.startsWith('https://child.acegroup.com.mm/')) {
      blockers.push('MEDIA_NOT_ON_APPROVED_HOST')
    }
    if (!/^[a-f0-9]{64}$/i.test(item.mediaSha256 ?? '')) blockers.push('MISSING_OR_INVALID_MEDIA_HASH')
    if (!/^[a-f0-9]{64}$/i.test(item.approvedContentHash ?? '')) {
      blockers.push('MISSING_OR_INVALID_APPROVED_HASH')
    }
    if (!['image', 'reel'].includes(mediaType)) blockers.push('UNSUPPORTED_MEDIA_TYPE')
    if (
      mediaType === 'reel' &&
      !/^https:\/\/child\.acegroup\.com\.mm\/.+\.mp4(?:\?.*)?$/i.test(item.mediaUrl ?? '')
    ) {
      blockers.push('REEL_MUST_BE_HOSTED_MP4')
    }
    if (item.riskLevel === 'high' && !item.clinicalApprovalId) {
      blockers.push('MISSING_CLINICAL_APPROVAL')
    }
  }

  const quietBlockers = new Set(['GLOBAL_KILL_SWITCH_ON', 'NO_DUE_APPROVED_ITEM'])
  return {
    item,
    dueCount: due.length,
    maxBacklogAgeMinutes,
    eligible: blockers.length === 0,
    blockers,
    alertOwner: blockers.some((blocker) => !quietBlockers.has(blocker)),
  }
}

export function verifyDownloadedHashes(item, downloadedMediaSha256) {
  const blockers = []
  if (downloadedMediaSha256 !== item.mediaSha256) blockers.push('DOWNLOADED_MEDIA_HASH_MISMATCH')
  const recomputedApprovedContentHash = approvedContentHash(item, downloadedMediaSha256)
  if (recomputedApprovedContentHash !== item.approvedContentHash) {
    blockers.push('APPROVED_CONTENT_HASH_MISMATCH')
  }
  return {
    eligible: blockers.length === 0,
    blockers,
    recomputedApprovedContentHash,
  }
}

export function planPublish({ item, ledgerRow, feedPosts = [], now = Date.now(), executionId }) {
  if (!item?.id) throw new Error('ITEM_REQUIRED')
  if (!executionId) throw new Error('EXECUTION_ID_REQUIRED')

  if (ledgerRow?.status === 'published' || ledgerRow?.status === 'reconciled') {
    return { action: 'SKIP_PUBLISHED', alertOwner: false, ledgerRow }
  }

  const matchingPost = feedPosts.find(
    (post) =>
      post?.id &&
      post.message === item.captionMyanmar &&
      Math.abs(Date.parse(post.created_time ?? '') - Date.parse(item.scheduledAt)) <= 7 * 24 * 60 * 60 * 1000,
  )
  if (matchingPost) {
    return {
      action: 'RECONCILED',
      alertOwner: false,
      ledgerRow: {
        ledgerKey: item.id,
        postId: item.id,
        status: 'reconciled',
        approvedContentHash: item.approvedContentHash,
        mediaSha256: item.mediaSha256,
        platformPostId: matchingPost.id,
        platformPermalink: matchingPost.permalink_url ?? '',
        publishedAt: matchingPost.created_time ?? new Date(now).toISOString(),
        scheduledAt: item.scheduledAt,
        lastExecutionId: executionId,
        updatedAt: new Date(now).toISOString(),
      },
    }
  }

  if (!ledgerRow?.ledgerKey) {
    return {
      action: 'BLOCK_MISSING_LEDGER_ROW',
      alertOwner: true,
      blockers: ['MISSING_PRESEEDED_LEDGER_ROW'],
      ledgerRow: null,
    }
  }

  if (
    ledgerRow.approvedContentHash !== item.approvedContentHash ||
    ledgerRow.mediaSha256 !== item.mediaSha256
  ) {
    return {
      action: 'BLOCK_LEDGER_HASH_MISMATCH',
      alertOwner: true,
      blockers: ['LEDGER_APPROVED_HASH_MISMATCH'],
      ledgerRow,
    }
  }

  if (ledgerRow.status === 'reserved') {
    const active = Date.parse(ledgerRow.reservationExpiresAt ?? '') > now
    return {
      action: active ? 'SKIP_ACTIVE_RESERVATION' : 'BLOCK_EXPIRED_RESERVATION',
      alertOwner: !active,
      blockers: [
        active ? 'PUBLISH_CLAIM_ALREADY_HELD' : 'EXPIRED_CLAIM_REQUIRES_FACEBOOK_RECONCILIATION',
      ],
      ledgerRow,
    }
  }

  if (ledgerRow.status !== 'ready') {
    return {
      action: 'BLOCK_LEDGER_NOT_READY',
      alertOwner: true,
      blockers: ['LEDGER_ROW_NOT_READY'],
      ledgerRow,
    }
  }

  const leaseMinutes = DEFAULT_RESERVATION_LEASE_MINUTES
  return {
    action: 'CLAIM',
    alertOwner: false,
    ledgerRow: {
      ledgerKey: item.id,
      postId: item.id,
      status: 'reserved',
      reservationToken: executionId,
      reservationExpiresAt: new Date(now + leaseMinutes * 60_000).toISOString(),
      approvedContentHash: item.approvedContentHash,
      mediaSha256: item.mediaSha256,
      platformPostId: '',
      platformPermalink: '',
      publishedAt: '',
      scheduledAt: item.scheduledAt,
      lastExecutionId: executionId,
      updatedAt: new Date(now).toISOString(),
    },
  }
}

export function ownsReservation(ledgerRow, executionId, now = Date.now()) {
  return (
    ledgerRow?.status === 'reserved' &&
    ledgerRow.reservationToken === executionId &&
    Date.parse(ledgerRow.reservationExpiresAt ?? '') > now
  )
}

export function publishedLedgerRow({ item, executionId, platformPostId, platformPermalink, publishedAt }) {
  if (!platformPostId) throw new Error('PLATFORM_POST_ID_REQUIRED')
  return {
    ledgerKey: item.id,
    postId: item.id,
    status: 'published',
    reservationToken: '',
    reservationExpiresAt: '',
    approvedContentHash: item.approvedContentHash,
    mediaSha256: item.mediaSha256,
    platformPostId,
    platformPermalink: platformPermalink ?? '',
    publishedAt: publishedAt ?? new Date().toISOString(),
    scheduledAt: item.scheduledAt,
    lastExecutionId: executionId,
    updatedAt: new Date().toISOString(),
  }
}

export function alertLedgerRow({ postId, blockers, executionId, now = Date.now() }) {
  const alertCode = blockers.join(',') || 'UNKNOWN_PUBLISHER_BLOCKER'
  const day = new Date(now).toISOString().slice(0, 10)
  return {
    ledgerKey: postId ? `alert:${postId}:${alertCode}` : `alert:${day}:${alertCode}`,
    postId: postId ?? '',
    status: 'alert',
    reservationToken: '',
    reservationExpiresAt: '',
    approvedContentHash: '',
    mediaSha256: '',
    platformPostId: '',
    platformPermalink: '',
    publishedAt: '',
    scheduledAt: '',
    lastExecutionId: executionId,
    alertCode,
    alertMessage: `ACE Child Grow Facebook publisher blocked: ${alertCode}`,
    updatedAt: new Date(now).toISOString(),
  }
}
