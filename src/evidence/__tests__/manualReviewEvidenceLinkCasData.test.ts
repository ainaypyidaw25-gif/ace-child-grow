import { describe, expect, it } from 'vitest';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import { evaluatePublicationEvidence } from '../../../convex/lib/evidencePublicationGate';
import {
  MANUAL_REVIEW_EVIDENCE_LINK_CAS_RELEASE_ID,
  MANUAL_REVIEW_EVIDENCE_LINK_CAS_TARGETS,
  MANUAL_REVIEW_EVIDENCE_LINK_EXACT_SOURCE_ROWS,
  MANUAL_REVIEW_EVIDENCE_LINK_SOURCE_PREIMAGES,
  isManualReviewEvidenceLinkCasTarget,
} from '../../../convex/lib/manualReviewEvidenceLinkCasData';
import { EVIDENCE_LINKS } from '../links';

const evidenceSource = Object.values(import.meta.glob('../../../convex/evidence.ts', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>)[0] ?? '';

describe('manual-review evidence-link exact CAS data', () => {
  it('freezes exactly the eight owner-approved ordered additions', () => {
    expect(MANUAL_REVIEW_EVIDENCE_LINK_CAS_RELEASE_ID)
      .toBe('2026-08-22-manual-review-evidence-links-v1');
    expect(MANUAL_REVIEW_EVIDENCE_LINK_CAS_TARGETS).toHaveLength(8);
    expect(new Set(MANUAL_REVIEW_EVIDENCE_LINK_CAS_TARGETS.map(
      (target) => `${target.kind}:${target.slug}`,
    )).size).toBe(8);
    for (const target of MANUAL_REVIEW_EVIDENCE_LINK_CAS_TARGETS) {
      expect(target.desiredSourceIds.slice(0, target.initialSourceIds.length))
        .toEqual(target.initialSourceIds);
      expect(target.desiredSourceIds.length - target.initialSourceIds.length)
        .toBe(target.slug === 'gd_birth_2m_sleep' ? 2 : 1);
    }
    expect(MANUAL_REVIEW_EVIDENCE_LINK_CAS_TARGETS.slice(0, 6).map(
      (target) => target.desiredSourceIds.at(-1),
    )).toEqual(Array(6).fill('hc-choking-prevention-2026'));
    expect(MANUAL_REVIEW_EVIDENCE_LINK_CAS_TARGETS[6].desiredSourceIds.at(-1))
      .toBe('hc-child-ems-2026');
    expect(MANUAL_REVIEW_EVIDENCE_LINK_CAS_TARGETS[7].desiredSourceIds.slice(-2))
      .toEqual(['nice-ng143-fever-2019', 'hc-child-ems-2026']);
  });

  it('does not absorb wider unapproved registry changes', () => {
    for (const target of MANUAL_REVIEW_EVIDENCE_LINK_CAS_TARGETS) {
      const registry = EVIDENCE_LINKS.find((link) => link.kind === target.kind
        && link.slug === target.slug);
      expect(registry).toBeDefined();
      if (target.slug === 'gd_birth_2m_sleep') {
        expect(registry?.sourceIds).toEqual(target.desiredSourceIds);
      } else {
        expect(registry?.sourceIds).not.toEqual(target.desiredSourceIds);
      }
    }
    expect(MANUAL_REVIEW_EVIDENCE_LINK_CAS_TARGETS[0].desiredSourceIds)
      .not.toContain('who-child-growth-standards-qa-2025');
    expect(MANUAL_REVIEW_EVIDENCE_LINK_CAS_TARGETS[6].desiredSourceIds)
      .toContain('cdc-foods-6-24m-2025');
    expect(MANUAL_REVIEW_EVIDENCE_LINK_CAS_TARGETS[6].desiredSourceIds)
      .not.toContain('jr-niaid-peanut-prevention-2017');
  });

  it('guards all eight keys at the generic import server boundary', () => {
    for (const target of MANUAL_REVIEW_EVIDENCE_LINK_CAS_TARGETS) {
      expect(isManualReviewEvidenceLinkCasTarget(target.kind, target.slug)).toBe(true);
    }
    expect(isManualReviewEvidenceLinkCasTarget('story', 'gd_birth_2m_sleep')).toBe(false);
    expect(isManualReviewEvidenceLinkCasTarget('guide', 'not-a-target')).toBe(false);
    expect(evidenceSource).toContain("import { isManualReviewEvidenceLinkCasTarget }");
    expect(evidenceSource).toContain('!isManualReviewEvidenceLinkCasTarget(link.kind, link.slug)');
  });

  it('freezes full exact direct-source rows with runtime hashes and eligible citations', async () => {
    expect(MANUAL_REVIEW_EVIDENCE_LINK_EXACT_SOURCE_ROWS).toHaveLength(3);
    expect(MANUAL_REVIEW_EVIDENCE_LINK_SOURCE_PREIMAGES).toHaveLength(3);
    for (const expected of MANUAL_REVIEW_EVIDENCE_LINK_SOURCE_PREIMAGES) {
      const exact = MANUAL_REVIEW_EVIDENCE_LINK_EXACT_SOURCE_ROWS.find(
        (row) => row.sourceId === expected.sourceId,
      );
      expect(exact).toMatchObject({
        _id: expected.rowId, _creationTime: expected.creationTime,
        sourceId: expected.sourceId, reviewStatus: 'approved', reviewScope: 'education',
      });
      expect(await sha256Canonical(exact), expected.sourceId)
        .toBe(expected.exactCanonicalSha256);
      const result = evaluatePublicationEvidence([expected.sourceId], [exact as never], '2026-08-22');
      expect(result.allowed, expected.sourceId).toBe(true);
    }
  });
});
