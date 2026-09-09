export const AI_EARLY_MATH_PROVENANCE_CORRECTION_RELEASE_ID =
  '2026-09-09-lsn-early-math-provenance-correction-1' as const;

export const AI_EARLY_MATH_PROVENANCE_CORRECTION_ACTION =
  'release.ai_early_math_provenance_correction_v1' as const;

export const AI_EARLY_MATH_PROVENANCE_CORRECTION_CAPTURED_AT =
  1_788_961_598_219 as const;

export const AI_EARLY_MATH_PROVENANCE_CORRECTION_SPEC = {
  releaseId: AI_EARLY_MATH_PROVENANCE_CORRECTION_RELEASE_ID,
  action: AI_EARLY_MATH_PROVENANCE_CORRECTION_ACTION,
  source: {
    sourceId: 'us-hhs-head-start-elof-2015',
    rowId: 'kd782yq6xc19gdv65gvz2z54s98crhkp',
    creationTime: 1_787_120_210_772.8093,
    updatedAt: 1_787_544_592_518,
    exactCanonicalSha256: '5e332aa08eed09e7072c1bd7a9c8ebf3e7f0003e62ad6b4fd06d509181decf8f',
    stableMetadataCanonicalSha256: '759bd0856605837f6448ba873e5a2fee3eb3012550841945fad9413cf7e1f564',
    unrelatedReviewNoteSha256: '72717a94472ec16759b6968d0ed64a393e822f718216b0c652f1827325d05477',
    reviewerSha256: '83fe824a8d735b0edcd617fc1aad402c561e43ed1d6dc0de810e2ec083f53be6',
    reviewerQualificationSha256: 'c2e2be701f06b4ae240071500a9ad5bb6e3e0cec71377dfc27c1c5f0d4df997a',
    reviewerId: 'mn726081xpgg24y4z4tq9ncw098bh6t1',
    reviewDate: '2026-08-24',
    reviewScope: 'education' as const,
  },
  unrelatedHumanReviewAudit: {
    rowId: 'j575xbs7wthx79wnc4fkk0529s8d3xb3',
    creationTime: 1_787_544_592_518.4863,
    exactCanonicalSha256: '80b144ae57fd67e05bc5174f31e395a27a11ea82f9979d1a31991221084dbcdc',
  },
  dependency: {
    kind: 'lesson',
    slug: 'lsn_early_math',
    rowId: 'k9714x2taxc2cjtq9vhc6171d18b90tr',
    creationTime: 1_785_024_331_625.8242,
    updatedAt: 1_787_120_210_772,
    exactCanonicalSha256: '077b3751aa587ae8c942a1e1a81fbdd3684391fe7667261e87a1b5699078fe14',
  },
  expectedAiEvidenceAuditRows: 0,
  expectedAiPublicationReleaseRows: 0,
} as const;
