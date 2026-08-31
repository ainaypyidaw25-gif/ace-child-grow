import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
// The production policy is intentionally plain ESM so n8n tooling can reuse it without a TS build.
// @ts-expect-error The checked JavaScript module does not ship a separate declaration file.
import * as publisherPolicy from '../../../scripts/social/facebook-publisher-policy.mjs'
const {
  alertLedgerRow,
  approvedContentHash,
  ownsReservation,
  planPublish,
  publishedLedgerRow,
  sha256,
  validateManifestAndSelect,
  verifyDownloadedHashes,
} = publisherPolicy

const now = Date.parse('2026-08-31T12:00:00.000Z')

function item(overrides: Record<string, unknown> = {}) {
  const base = {
    id: 'ACE-CAL-16', status: 'scheduled', approvalStatus: 'approved', reviewerId: 'owner',
    approvalTimestamp: '2026-08-31T08:00:00.000Z', scheduledAt: '2026-08-31T11:00:00.000Z',
    captionMyanmar: 'သိမ်းထားသင့်တဲ့ အချက် ၄ ချက်',
    mediaUrl: 'https://child.acegroup.com.mm/social/ace-child-grow/posts/ACE-CAL-16.png',
    mediaSha256: sha256('image bytes'), riskLevel: 'low', mediaType: 'image', ...overrides,
  }
  return { ...base, approvedContentHash: approvedContentHash(base), ...overrides }
}

function manifest(items = [item()], overrides: Record<string, unknown> = {}) {
  return {
    killSwitch: false, automationMode: 'production',
    destination: { platform: 'facebook', pageId: '111009258047115', graphApiVersion: 'v25.0' },
    items, ...overrides,
  }
}

describe('Facebook publisher policy', () => {
  it('keeps the kill switch as a hard publish gate', () => {
    const result = validateManifestAndSelect(manifest([item()], { killSwitch: true }), { now })
    expect(result.eligible).toBe(false)
    expect(result.blockers).toContain('GLOBAL_KILL_SWITCH_ON')
  })

  it('blocks a stale backlog item instead of draining the backlog', () => {
    const result = validateManifestAndSelect(manifest([item({ scheduledAt: '2026-08-30T00:00:00.000Z' })]), { now })
    expect(result.eligible).toBe(false)
    expect(result.blockers).toContain('STALE_DUE_ITEM_REQUIRES_REVIEW')
  })

  it('recomputes both media and approved-content hashes', () => {
    const candidate = item()
    expect(verifyDownloadedHashes(candidate, candidate.mediaSha256)).toEqual({
      eligible: true, blockers: [], recomputedApprovedContentHash: candidate.approvedContentHash,
    })
    expect(verifyDownloadedHashes(candidate, sha256('tampered')).blockers).toEqual([
      'DOWNLOADED_MEDIA_HASH_MISMATCH', 'APPROVED_CONTENT_HASH_MISMATCH',
    ])
  })

  it('reconciles an existing exact Facebook post before publishing', () => {
    const candidate = item()
    const plan = planPublish({
      item: candidate, ledgerRow: null,
      feedPosts: [{ id: '111_222', message: candidate.captionMyanmar, permalink_url: 'https://www.facebook.com/111/posts/222', created_time: candidate.scheduledAt }],
      now, executionId: 'execution-1',
    })
    expect(plan.action).toBe('RECONCILED')
    expect(plan.ledgerRow).toMatchObject({ status: 'reconciled', platformPostId: '111_222' })
  })

  it('creates a lease and blocks another execution while it is active', () => {
    const candidate = item()
    const reservation = planPublish({ item: candidate, ledgerRow: null, now, executionId: 'execution-1' })
    expect(reservation.action).toBe('RESERVE')
    expect(ownsReservation(reservation.ledgerRow, 'execution-1', now)).toBe(true)
    expect(planPublish({ item: candidate, ledgerRow: reservation.ledgerRow, now: now + 1_000, executionId: 'execution-2' }).action).toBe('SKIP_ACTIVE_RESERVATION')
  })

  it('persists post identifiers and creates a de-duplicated durable alert key', () => {
    expect(publishedLedgerRow({
      item: item(), executionId: 'execution-1', platformPostId: '111_222',
      platformPermalink: 'https://www.facebook.com/111/posts/222', publishedAt: '2026-08-31T12:01:00.000Z',
    })).toMatchObject({ status: 'published', platformPostId: '111_222', platformPermalink: 'https://www.facebook.com/111/posts/222' })
    expect(alertLedgerRow({ postId: 'ACE-CAL-16', blockers: ['DOWNLOADED_MEDIA_HASH_MISMATCH'], executionId: 'execution-1', now })).toMatchObject({
      ledgerKey: 'alert:ACE-CAL-16:DOWNLOADED_MEDIA_HASH_MISMATCH', status: 'alert', alertCode: 'DOWNLOADED_MEDIA_HASH_MISMATCH',
    })
  })
})

const workflow = JSON.parse(readFileSync(resolve('public/social/ace-child-grow/continuous-publisher-workflow.json'), 'utf8'))
type WorkflowNode = {
  name: string
  type: string
  parameters: {
    jsCode?: string
    dataTableId?: { value?: string }
    columns?: { value?: Record<string, string> }
    fromEmail?: string
    toEmail?: string
  }
}
const nodes = new Map<string, WorkflowNode>(workflow.nodes.map((node: WorkflowNode) => [node.name, node]))
const node = (name: string) => {
  const result = nodes.get(name)
  if (!result) throw new Error(`Missing workflow node: ${name}`)
  return result
}
const destinations = (name: string, branch = 0) =>
  (workflow.connections[name]?.main?.[branch] ?? []).map((edge: { node: string }) => edge.node)

describe('Facebook continuous publisher workflow export', () => {
  it('is inert on import and retains the manifest kill-switch gate', () => {
    expect(workflow.active).toBe(false)
    const gate = node('Validate Kill Switch Approval and Queue Age Gates')
    expect(gate.parameters.jsCode).toContain('manifest.killSwitch !== false')
    expect(destinations('Eligible for Facebook Publish?', 1)).toContain('Block and Flag Owner')
  })

  it('uses a durable n8n Data Table instead of workflow static data', () => {
    expect(JSON.stringify(workflow)).not.toContain('$getWorkflowStaticData')
    for (const name of ['Read Durable Publish Ledger', 'Upsert Publish Reservation or Reconciliation', 'Read Reservation Back', 'Upsert Published Ledger', 'Upsert Durable Owner Alert']) {
      const dataTableNode = node(name)
      expect(dataTableNode.type).toBe('n8n-nodes-base.dataTable')
      expect(dataTableNode.parameters.dataTableId?.value).toBe('REPLACE_WITH_FACEBOOK_PUBLISH_LEDGER_TABLE_ID')
    }
  })

  it('verifies hashes, reconciles, reserves, and reads lease ownership before publish', () => {
    expect(destinations('Eligible for Facebook Publish?')).toContain('Download Approved Media')
    expect(destinations('Compute Downloaded Media SHA256')).toContain('Compute Approved Content SHA256')
    expect(destinations('Downloaded Hashes Match?')).toContain('Read Durable Publish Ledger')
    expect(destinations('Read Durable Publish Ledger')).toContain('Fetch Recent ACE Child Grow Page Posts')
    expect(destinations('Read Reservation Back')).toContain('Confirm Reservation Ownership')
    expect(destinations('Reservation Lease Owned?')).toContain('Is Approved Item a Reel?')
  })

  it('writes platform ID and permalink after Meta returns', () => {
    expect(destinations('Remember Published Post')).toContain('Fetch Published Post Permalink')
    const values = node('Upsert Published Ledger').parameters.columns?.value ?? {}
    expect(values.platformPostId).toBe('={{ $json.platformPostId }}')
    expect(values.platformPermalink).toBe('={{ $json.platformPermalink }}')
    expect(values.publishedAt).toBe('={{ $json.publishedAt }}')
  })

  it('records actionable blockers and sends a real owner email', () => {
    expect(destinations('Prepare Durable Owner Alert')).toContain('Upsert Durable Owner Alert')
    expect(destinations('Upsert Durable Owner Alert')).toContain('Send Owner Alert - CREDENTIAL REQUIRED')
    const email = node('Send Owner Alert - CREDENTIAL REQUIRED')
    expect(email.type).toBe('n8n-nodes-base.emailSend')
    expect(email.parameters.fromEmail).toBe('REPLACE_WITH_SOCIAL_ALERT_FROM_EMAIL')
    expect(email.parameters.toEmail).toBe('REPLACE_WITH_SOCIAL_OWNER_ALERT_EMAIL')
    expect(JSON.stringify(email)).not.toContain('$vars')
  })

  it('blocks stale backlog drain and limits an execution to one selected item', () => {
    const js = node('Validate Kill Switch Approval and Queue Age Gates').parameters.jsCode
    expect(js).toContain('STALE_DUE_ITEM_REQUIRES_REVIEW')
    expect(js).toContain('const item = due[0] || null')
    expect(workflow.settings.executionTimeout).toBe(300)
  })
})
