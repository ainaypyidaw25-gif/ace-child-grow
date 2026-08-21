import { describe, expect, it } from 'vitest';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import {
  evaluatePublicationEvidence,
  publicationEvidenceIsEligible,
} from '../../../convex/lib/evidencePublicationGate';
import {
  SWAIMAN_SEIZURE_EXACT_SOURCE_ROWS,
  SWAIMAN_SEIZURE_LINK_CAS_RELEASE_ID,
  SWAIMAN_SEIZURE_LINK_CAS_SOURCE_FIXTURE_SHA256,
  SWAIMAN_SEIZURE_LINK_CAS_TARGET,
  SWAIMAN_SEIZURE_SOURCE_ID,
  SWAIMAN_SEIZURE_SOURCE_PREIMAGES,
  isSwaimanSeizureLinkCasTarget,
} from '../../../convex/lib/swaimanSeizureLinkCasData';
import { EVIDENCE_LINKS } from '../links';

describe('Swaiman seizure-link exact CAS data', () => {
  it('freezes one unique Production preimage and removes only Swaiman', () => {
    expect(SWAIMAN_SEIZURE_LINK_CAS_RELEASE_ID)
      .toBe('2026-08-21-swaiman-seizure-redundant-unlink-v1');
    expect(SWAIMAN_SEIZURE_LINK_CAS_SOURCE_FIXTURE_SHA256)
      .toBe('e7e32c9cbadc667802a8ece85437b3e201d64e0c0d56d825be50222e55ebbc11');
    expect(SWAIMAN_SEIZURE_LINK_CAS_TARGET).toMatchObject({
      kind: 'safety_rule',
      slug: 'seizure',
      linkId: 'k9760b7jasswetaty4wj4csq0s8b8yc9',
      initialUpdatedAt: 1_786_432_294_276,
    });
    expect(SWAIMAN_SEIZURE_LINK_CAS_TARGET.initialSourceIds)
      .toContain(SWAIMAN_SEIZURE_SOURCE_ID);
    expect(SWAIMAN_SEIZURE_LINK_CAS_TARGET.desiredSourceIds)
      .toEqual([
        'nice-ng143-fever-2019',
        'nhs-child-accident-2025',
        'hc-child-ems-2026',
        'nhs-sids-2025',
      ]);
    expect(SWAIMAN_SEIZURE_LINK_CAS_TARGET.desiredSourceIds)
      .not.toContain(SWAIMAN_SEIZURE_SOURCE_ID);
  });

  it('keeps the local registry on the exact protected postimage', () => {
    const link = EVIDENCE_LINKS.find(
      (candidate) => candidate.kind === 'safety_rule' && candidate.slug === 'seizure',
    );
    expect(link?.sourceIds).toEqual(SWAIMAN_SEIZURE_LINK_CAS_TARGET.desiredSourceIds);
    expect(isSwaimanSeizureLinkCasTarget('safety_rule', 'seizure')).toBe(true);
    expect(isSwaimanSeizureLinkCasTarget('guide', 'seizure')).toBe(false);
    expect(isSwaimanSeizureLinkCasTarget('safety_rule', 'not-a-target')).toBe(false);
  });

  it('freezes all five full source rows with real canonical hashes', async () => {
    expect(SWAIMAN_SEIZURE_SOURCE_PREIMAGES).toHaveLength(5);
    expect(SWAIMAN_SEIZURE_EXACT_SOURCE_ROWS).toHaveLength(5);
    for (const expected of SWAIMAN_SEIZURE_SOURCE_PREIMAGES) {
      const exact = SWAIMAN_SEIZURE_EXACT_SOURCE_ROWS.find(
        (row) => row.sourceId === expected.sourceId,
      );
      expect(exact, expected.sourceId).toBeDefined();
      expect(exact).toMatchObject({
        _id: expected.rowId,
        _creationTime: expected.creationTime,
        sourceId: expected.sourceId,
      });
      expect(await sha256Canonical(exact), expected.sourceId)
        .toBe(expected.exactCanonicalSha256);
    }
  });

  it('preserves an eligible desired citation set without counting Swaiman', () => {
    const rowsById = new Map(SWAIMAN_SEIZURE_EXACT_SOURCE_ROWS.map(
      (source) => [String(source.sourceId), source],
    ));
    const desired = SWAIMAN_SEIZURE_LINK_CAS_TARGET.desiredSourceIds.map(
      (sourceId) => rowsById.get(sourceId)!,
    );
    expect(evaluatePublicationEvidence(
      SWAIMAN_SEIZURE_LINK_CAS_TARGET.desiredSourceIds,
      desired as never,
      '2026-08-21',
    ).allowed).toBe(true);
    expect(desired.filter((source) => source.reviewStatus === 'approved'
      && publicationEvidenceIsEligible(source as never, '2026-08-21'))
      .map((source) => source.sourceId).sort()).toEqual([
      'nhs-sids-2025',
      'nice-ng143-fever-2019',
    ]);
  });
});
