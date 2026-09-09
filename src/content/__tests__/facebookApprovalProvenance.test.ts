import { describe, expect, it } from 'vitest'
// The generator shares this plain ESM helper without a TypeScript build.
// @ts-expect-error The checked JavaScript module does not ship a separate declaration file.
import * as approvalProvenance from '../../../scripts/social/approval-provenance.mjs'
const { reconcileGeneratedApproval } = approvalProvenance

const currentContentHash = 'a'.repeat(64)

function candidate(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ACE-CAL-07',
    status: 'draft',
    approvalStatus: 'review_required',
    reviewerId: null,
    approvalTimestamp: null,
    approvalExpiresAt: null,
    approvedContentHash: null,
    mediaSha256: 'b'.repeat(64),
    alreadyPublished: false,
    platformPostId: null,
    platformPermalink: null,
    ...overrides,
  }
}

function prior(overrides: Record<string, unknown> = {}) {
  return {
    ...candidate(),
    status: 'scheduled',
    approvalStatus: 'approved',
    reviewerId: 'reviewer-1',
    approvalTimestamp: '2026-08-01T00:00:00.000Z',
    approvalExpiresAt: '2026-10-01T00:00:00.000Z',
    approvedContentHash: currentContentHash,
    ...overrides,
  }
}

describe('generated Facebook approval provenance', () => {
  it('preserves a real approval only when both media and content hashes are unchanged', () => {
    const result = reconcileGeneratedApproval({ candidate: candidate(), currentContentHash, prior: prior() })

    expect(result).toMatchObject({
      status: 'scheduled',
      approvalStatus: 'approved',
      reviewerId: 'reviewer-1',
      approvalTimestamp: '2026-08-01T00:00:00.000Z',
      approvedContentHash: currentContentHash,
    })
  })

  it.each([
    ['media bytes changed', prior({ mediaSha256: 'c'.repeat(64) })],
    ['caption or schedule changed', prior({ approvedContentHash: 'd'.repeat(64) })],
    ['review provenance is missing', prior({ reviewerId: null })],
  ])('invalidates stale approval when %s', (_label, previous) => {
    const result = reconcileGeneratedApproval({ candidate: candidate(), currentContentHash, prior: previous })

    expect(result).toMatchObject({
      status: 'draft',
      approvalStatus: 'review_required',
      reviewerId: null,
      approvalTimestamp: null,
      approvalExpiresAt: null,
      approvedContentHash: null,
    })
  })

  it('forces rebuilt content back through review even if a legacy hash happens to match', () => {
    const result = reconcileGeneratedApproval({
      candidate: candidate(),
      currentContentHash,
      prior: prior(),
      forceReview: true,
    })

    expect(result.approvalStatus).toBe('review_required')
    expect(result.approvedContentHash).toBeNull()
  })

  it('refuses to mutate a published post', () => {
    expect(() => reconcileGeneratedApproval({
      candidate: candidate(),
      currentContentHash,
      prior: prior({ status: 'published', alreadyPublished: true, mediaSha256: 'c'.repeat(64) }),
    })).toThrow('Refusing to change already-published Facebook content: ACE-CAL-07')
  })
})
