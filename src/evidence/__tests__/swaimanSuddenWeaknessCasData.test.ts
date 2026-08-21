import { describe, expect, it } from 'vitest';
import { sha256Canonical } from '../../../convex/lib/aiAuditHash';
import {
  evaluatePublicationEvidence,
  publicationEvidenceIsEligible,
} from '../../../convex/lib/evidencePublicationGate';
import {
  CDC_AFM_SOURCE_ID,
  SWAIMAN_SUDDEN_WEAKNESS_CAS_RELEASE_ID,
  SWAIMAN_SUDDEN_WEAKNESS_EXACT_SOURCE_ROWS,
  SWAIMAN_SUDDEN_WEAKNESS_SOURCE_DESIRED,
  SWAIMAN_SUDDEN_WEAKNESS_SOURCE_ID,
  SWAIMAN_SUDDEN_WEAKNESS_SOURCE_PREIMAGES,
  SWAIMAN_SUDDEN_WEAKNESS_TARGET,
  isSwaimanSuddenWeaknessLinkCasTarget,
  isSwaimanSuddenWeaknessSourceCasTarget,
} from '../../../convex/lib/swaimanSuddenWeaknessCasData';
import { EVIDENCE_LINKS } from '../links';
import { SOURCE_BY_ID } from '../sources';

describe('Swaiman sudden-weakness exact CAS data', () => {
  it('freezes the exact Production link preimage and CDC-only postimage', () => {
    expect(SWAIMAN_SUDDEN_WEAKNESS_CAS_RELEASE_ID)
      .toBe('2026-08-21-swaiman-sudden-weakness-cleanup-v1');
    expect(SWAIMAN_SUDDEN_WEAKNESS_TARGET).toMatchObject({
      kind: 'safety_rule',
      slug: 'sudden_weakness',
      linkId: 'k972c3m8cszc40pzecntzns3p98b8a03',
      linkInitialUpdatedAt: 1_786_432_294_276,
    });
    expect(SWAIMAN_SUDDEN_WEAKNESS_TARGET.initialSourceIds).toEqual([
      CDC_AFM_SOURCE_ID,
      SWAIMAN_SUDDEN_WEAKNESS_SOURCE_ID,
    ]);
    expect(SWAIMAN_SUDDEN_WEAKNESS_TARGET.desiredSourceIds).toEqual([
      CDC_AFM_SOURCE_ID,
    ]);
  });

  it('keeps registry links and the unused textbook source on protected postimages', () => {
    const link = EVIDENCE_LINKS.find(
      (candidate) => candidate.kind === 'safety_rule'
        && candidate.slug === 'sudden_weakness',
    );
    expect(link?.sourceIds).toEqual(SWAIMAN_SUDDEN_WEAKNESS_TARGET.desiredSourceIds);
    expect(SOURCE_BY_ID.get(SWAIMAN_SUDDEN_WEAKNESS_SOURCE_ID)).toMatchObject({
      authors: SWAIMAN_SUDDEN_WEAKNESS_SOURCE_DESIRED.authors,
      country: null,
      url: SWAIMAN_SUDDEN_WEAKNESS_SOURCE_DESIRED.url,
      reviewStatus: 'awaiting_review',
      verifiedOn: '2026-08-18',
    });
    expect(isSwaimanSuddenWeaknessLinkCasTarget('safety_rule', 'sudden_weakness'))
      .toBe(true);
    expect(isSwaimanSuddenWeaknessLinkCasTarget('guide', 'sudden_weakness')).toBe(false);
    expect(isSwaimanSuddenWeaknessSourceCasTarget(SWAIMAN_SUDDEN_WEAKNESS_SOURCE_ID))
      .toBe(true);
    expect(isSwaimanSuddenWeaknessSourceCasTarget(CDC_AFM_SOURCE_ID)).toBe(false);
  });

  it('freezes both full Production source rows with real canonical hashes', async () => {
    expect(SWAIMAN_SUDDEN_WEAKNESS_SOURCE_PREIMAGES).toHaveLength(2);
    expect(SWAIMAN_SUDDEN_WEAKNESS_EXACT_SOURCE_ROWS).toHaveLength(2);
    for (const expected of SWAIMAN_SUDDEN_WEAKNESS_SOURCE_PREIMAGES) {
      const exact = SWAIMAN_SUDDEN_WEAKNESS_EXACT_SOURCE_ROWS.find(
        (row) => row.sourceId === expected.sourceId,
      );
      expect(exact, expected.sourceId).toBeDefined();
      expect(exact).toMatchObject({
        _id: expected.rowId,
        _creationTime: expected.creationTime,
        createdAt: expected.createdAt,
        sourceId: expected.sourceId,
      });
      expect(await sha256Canonical(exact), expected.sourceId)
        .toBe(expected.initialCanonicalSha256);
    }
  });

  it('proves the approved human-reviewed CDC source is citation-eligible', () => {
    const cdc = SWAIMAN_SUDDEN_WEAKNESS_EXACT_SOURCE_ROWS.find(
      (source) => source.sourceId === CDC_AFM_SOURCE_ID,
    )!;
    expect(cdc).toMatchObject({
      reviewStatus: 'approved',
      reviewer: 'Phyo Ko Ko',
      reviewerQualification: 'MBBS',
      reviewDate: '2026-08-21',
    });
    expect(publicationEvidenceIsEligible(cdc as never, '2026-08-21')).toBe(true);
    expect(evaluatePublicationEvidence(
      SWAIMAN_SUDDEN_WEAKNESS_TARGET.desiredSourceIds,
      [cdc] as never,
      '2026-08-21',
    ).allowed).toBe(true);
  });
});
