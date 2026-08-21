import { describe, expect, it } from 'vitest';
import {
  INHERENT_PUBLIC_CITATION_SOURCE_PREIMAGES,
  INHERENT_PUBLIC_CITATION_EXACT_SOURCE_ROWS,
  INHERENT_PUBLIC_LINK_CAS_RELEASE_ID,
  INHERENT_PUBLIC_LINK_CAS_SNAPSHOT_SHA256,
  INHERENT_PUBLIC_LINK_CAS_TARGETS,
  isInherentPublicLinkCasTarget,
} from '../../../convex/lib/inherentPublicLinkCasData';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import { evaluatePublicationEvidence } from '../../../convex/lib/evidencePublicationGate';
import { EVIDENCE_LINKS } from '../links';

describe('inherent-public exact link CAS data', () => {
  it('freezes the four unique Production preimages and desired ordered arrays', () => {
    expect(INHERENT_PUBLIC_LINK_CAS_RELEASE_ID)
      .toBe('2026-08-21-inherent-public-citation-links-v1');
    expect(INHERENT_PUBLIC_LINK_CAS_SNAPSHOT_SHA256)
      .toBe('09419d04bafd28a4d3b4a721828209990904d16b28d86a642ed4145e9f72bf80');
    expect(INHERENT_PUBLIC_LINK_CAS_TARGETS).toHaveLength(4);
    expect(new Set(INHERENT_PUBLIC_LINK_CAS_TARGETS.map(
      (target) => `${target.kind}:${target.slug}`,
    )).size).toBe(4);
    expect(new Set(INHERENT_PUBLIC_LINK_CAS_TARGETS.map((target) => target.linkId)).size).toBe(4);
    expect(INHERENT_PUBLIC_LINK_CAS_TARGETS.map((target) => ({
      key: `${target.kind}:${target.slug}`,
      desiredSourceIds: target.desiredSourceIds,
    }))).toEqual([
      {
        key: 'hope_topic:autism-spectrum',
        desiredSourceIds: ['aap-asd-2020', 'cdc-autism-signs-2024'],
      },
      {
        key: 'hope_topic:cerebral-palsy',
        desiredSourceIds: ['nice-ng62-cerebral-palsy-2017'],
      },
      {
        key: 'safety_rule:loss_of_acquired_skills',
        desiredSourceIds: ['aap-surveillance-2020', 'cdc-milestones-2026'],
      },
      {
        key: 'safety_rule:skill_loss_question',
        desiredSourceIds: ['aap-surveillance-2020', 'cdc-milestones-2026'],
      },
    ]);
    for (const target of INHERENT_PUBLIC_LINK_CAS_TARGETS) {
      expect(target.initialSourceIds).not.toEqual(target.desiredSourceIds);
      expect(new Set(target.initialSourceIds).size).toBe(target.initialSourceIds.length);
      expect(new Set(target.desiredSourceIds).size).toBe(target.desiredSourceIds.length);
    }
  });

  it('keeps the local registry on the exact desired arrays', () => {
    for (const target of INHERENT_PUBLIC_LINK_CAS_TARGETS) {
      const link = EVIDENCE_LINKS.find(
        (candidate) => candidate.kind === target.kind && candidate.slug === target.slug,
      );
      expect(link, `${target.kind}:${target.slug}`).toBeDefined();
      expect(link?.sourceIds, `${target.kind}:${target.slug}`)
        .toEqual(target.desiredSourceIds);
    }
  });

  it('guards only the exact four kind/slug keys at generic server boundaries', () => {
    for (const target of INHERENT_PUBLIC_LINK_CAS_TARGETS) {
      expect(isInherentPublicLinkCasTarget(target.kind, target.slug)).toBe(true);
      expect(isInherentPublicLinkCasTarget('guide', target.slug)).toBe(false);
    }
    expect(isInherentPublicLinkCasTarget('hope_topic', 'not-a-target')).toBe(false);
  });

  it('freezes runtime-verifiable full source rows and simulates eligible citations', async () => {
    expect(INHERENT_PUBLIC_CITATION_SOURCE_PREIMAGES).toHaveLength(5);
    expect(new Set(INHERENT_PUBLIC_CITATION_SOURCE_PREIMAGES.map(
      (source) => source.sourceId,
    )).size).toBe(5);
    expect(INHERENT_PUBLIC_CITATION_SOURCE_PREIMAGES.map((source) => ({
      sourceId: source.sourceId,
      hash: source.exactCanonicalSha256,
    }))).toEqual([
      { sourceId: 'aap-asd-2020', hash: 'e6821688d6d42ab564a8b0536190e26869d9b1529853aec32fba5dd669f898b7' },
      { sourceId: 'aap-surveillance-2020', hash: '636c00a8f07a846b4c2486c0de8f58dc3a1ac28100dc80dffb024043f2d9c897' },
      { sourceId: 'cdc-autism-signs-2024', hash: 'c9d11e3d5019d06b9aa1e973adf6cab0992a1a38577aef5f3b3e37d7883a9b97' },
      { sourceId: 'cdc-milestones-2026', hash: '9a93e5e84dde28c280f1683ac983ebb41e08f34948ce36d050062f30f9d5e03b' },
      { sourceId: 'nice-ng62-cerebral-palsy-2017', hash: '86cfc2b8148a3c1a859634a157acdd58fb1dd3cd45f6a55cf031569f41bf092f' },
    ]);
    expect(INHERENT_PUBLIC_CITATION_EXACT_SOURCE_ROWS).toHaveLength(5);
    for (const source of INHERENT_PUBLIC_CITATION_SOURCE_PREIMAGES) {
      const exact = INHERENT_PUBLIC_CITATION_EXACT_SOURCE_ROWS.find(
        (row) => row.sourceId === source.sourceId,
      );
      expect(exact, source.sourceId).toBeDefined();
      expect(exact).toMatchObject({
        _id: source.rowId,
        _creationTime: source.creationTime,
        sourceId: source.sourceId,
        org: source.org,
        orgKey: source.orgKey,
        title: source.title,
        url: source.url,
        evidenceLevel: source.evidenceLevel,
        reviewStatus: source.reviewStatus,
        reviewer: source.reviewer,
        reviewerId: source.reviewerId,
        reviewerQualification: source.reviewerQualification,
        reviewScope: source.reviewScope,
        year: source.year,
        reviewDate: source.reviewDate,
        nextReviewDate: source.nextReviewDate,
        verifiedOn: source.verifiedOn,
        updatedAt: source.updatedAt,
      });
      expect(await sha256Canonical(exact), source.sourceId)
        .toBe(source.exactCanonicalSha256);
    }
    const sourcesById = new Map(INHERENT_PUBLIC_CITATION_SOURCE_PREIMAGES.map(
      (source) => [source.sourceId, source],
    ));
    for (const target of INHERENT_PUBLIC_LINK_CAS_TARGETS) {
      const result = evaluatePublicationEvidence(
        target.desiredSourceIds,
        target.desiredSourceIds.map((sourceId) => sourcesById.get(sourceId)!),
        '2026-08-21',
      );
      expect(result.allowed, `${target.kind}:${target.slug}`).toBe(true);
      expect(result.unknownSourceIds).toEqual([]);
      expect(result.retiredSourceIds).toEqual([]);
      expect(result.evidenceRequiredSourceIds).toEqual([]);
      expect(result.ineligibleApprovedSourceIds).toEqual([]);
    }
  });
});
