export const AI_EARLY_MATH_PROVENANCE_CORRECTION_RELEASE_ID =
  '2026-09-09-lsn-early-math-provenance-correction-1' as const;

export const AI_EARLY_MATH_PROVENANCE_CORRECTION_ACTION =
  'release.ai_early_math_provenance_correction_v1' as const;

export const AI_EARLY_MATH_PROVENANCE_CORRECTION_CAPTURED_AT =
  1_788_998_742_631 as const;

export const AI_EARLY_MATH_PROVENANCE_CORRECTION_DISABLE_ACTION =
  'library.ai_publication_control.disabled' as const;

export const AI_EARLY_MATH_PROVENANCE_CORRECTION_REVOKE_ACTION =
  'library.ai_publication_release.revoked' as const;

export const AI_EARLY_MATH_PROVENANCE_CORRECTION_PREDECESSOR_RELEASE_ID =
  '2026-08-19-ai-educational-preview-3' as const;

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
    aiSnapshotCanonicalSha256: '061e21a65c5e7df0aa339d56ccf9f0823e17fdf9b7c4fba44ce49228923f2a5c',
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
    snapshotCanonicalSha256: '3badde0e97557a30961739438adc85cdc20ae4545fa3f12f984a5a4bf651c7f8',
  },
  revokedTargetContents: [
    {
      rowId: 'kx79fjkkjq7r7s23q2rcjgq5ed8b97q6',
      creationTime: 1_785_024_282_947.203,
      slug: 'lsn_early_math',
      updatedAt: 1_787_120_210_772,
      reviewRevision: 9,
      exactCanonicalSha256: '296b20c9010190afab5443fba8e0d9bdf8ad7f04a3d01e0951237965b244b1ce',
      snapshotCanonicalSha256: 'e5e5bd3383ade88d5960a1278658a19aef460ddc84717ca8eed07d11fa4145ba',
    },
    {
      rowId: 'kx73pc2tw0pqcrwy1bxan7scgx8b8emr',
      creationTime: 1_785_024_282_947.2185,
      slug: 'st_waiting_at_clinic',
      updatedAt: 1_787_120_210_772,
      reviewRevision: 3,
      exactCanonicalSha256: '411323c876a779428284baf4d2e81eeba427ccc297f74ab9d143ffe9761dae3c',
      snapshotCanonicalSha256: '590191f08636fc7ff358c717ae1044233c6bd067170322f7ae47c6fb2e60a04c',
    },
    {
      rowId: 'kx77y45t16fy6y98zqyn7kwbsx8b9q7h',
      creationTime: 1_785_024_282_947.2205,
      slug: 'st_first_day_school',
      updatedAt: 1_787_120_210_772,
      reviewRevision: 2,
      exactCanonicalSha256: '34c7650013aa7eebadbad40af0b93f6c952350f68176a8ca70a13342c6bb08ea',
      snapshotCanonicalSha256: 'cc4d31c2eb18098c24763fcd0b718c431a7f753962f6ae5a5b6c9f9f3d9f72fc',
    },
  ],
  contentReviews: [
    {
      slug: 'lsn_early_math',
      rows: [
        { rowId: 'nn7acwt5x8274vndefvw0393k98bhm30', creationTime: 1_785_389_205_499.8354, exactCanonicalSha256: '7dba8298f8bef846fb91091144576f66c0d294c7bbff23f70211926bc9aa9af0' },
        { rowId: 'nn72wht3c7qy81wckjqm319k6s8bw0ny', creationTime: 1_785_911_434_992.1677, exactCanonicalSha256: '8976d07c6c3ab0c7790d48c4446abb4b2da24d5c3dcf3c3ff8303b5a21741fde' },
        { rowId: 'nn727a74f100pabmcy65cxnxc98bxxqd', creationTime: 1_785_911_439_019.246, exactCanonicalSha256: '4469966ec8fcfa67abb8c65153b5525788afc4eba7e1e3d0cdf3c8aaa1b8bfcb' },
      ],
    },
    {
      slug: 'st_waiting_at_clinic',
      rows: [
        { rowId: 'nn7fte5a5k0hn861bc660dp8js8bxaz5', creationTime: 1_785_904_621_813.4675, exactCanonicalSha256: 'c8e5b2327e25567add62de8faa0f9d1b4ea7521cdcefb94801ee4149dc8246e4' },
        { rowId: 'nn7cz3hmnxsg7kcyk2cnhcc8gx8bwwzh', creationTime: 1_785_904_624_829.1338, exactCanonicalSha256: '69a41cfc14497f174c2c691ec43ef8cecef1eada1b714afe1a7035af1d8c9508' },
      ],
    },
    {
      slug: 'st_first_day_school',
      rows: [
        { rowId: 'nn7ds5f6vw1t87f0sy0cf1n0n58bxj05', creationTime: 1_785_904_175_183.426, exactCanonicalSha256: '614e80af8e4137dae3bd767cfc739dd210593892c6224e997fbf3241eee70d45' },
        { rowId: 'nn79y1axcfx6s9044g0mef9h198bwqyt', creationTime: 1_785_904_179_008.9988, exactCanonicalSha256: 'ba6287c3635af7a4e83263834f202ddc7f94281e7ac7e6efae3b87d444f29e93' },
      ],
    },
  ],
  originalAiAuditChain: {
    runId: '2026-08-19-ai-educational-preview-3:audit:lesson:lsn_early_math',
    run: {
      rowId: 'q5724r3ggj3p2r7ybmcd10vgt98cstcj',
      creationTime: 1_787_120_210_772.81,
      exactCanonicalSha256: 'e0afc6d7360d3715df484b11e79a0dd81255af9c2ccc5eac3e2f596d2be204e5',
    },
    contentAudit: {
      rowId: 'q971vpmtvksj62s66mf6wp9gjx8cseen',
      creationTime: 1_787_120_210_772.8105,
      exactCanonicalSha256: '53180d2bb581288be5f1ac810b0147097945ad96937539bcf5da7f753e3ef670',
    },
    evidenceAudit: {
      rowId: 'qd77wcxnxxy8et8dgv49p04hm98cr3t6',
      creationTime: 1_787_120_210_772.8103,
      exactCanonicalSha256: '3936e752a4eaefddecb196cddbfefdd03492c20786759cd39d328e36aa9db83d',
    },
  },
  aiPublicationControl: {
    key: 'global',
    rowId: 'qh78fvssgsbr7tr7240k8vr4t18csc63',
    creationTime: 1_787_120_242_144.8044,
    enabled: false,
    generation: 2,
    updatedAt: 1_788_966_461_407,
    operatorSha256: '111a34e49c4106fa4e258e9d615e9736c3c6aab978fe728b8afcbfe4698590a2',
    reasonSha256: 'dc4da4e4253a8d6ea139fc2991c711196652be5ffccdc885b31df5cd4382101d',
    exactCanonicalSha256: '173406663df5b862a5d12a759971eaf83a78e0daff768e108cddb7ee95bbcf09',
  },
  aiPublicationDisableAudit: {
    rowId: 'j5752wg5vgpccd8nfmt1f28j8d8e35ge',
    creationTime: 1_788_966_461_407.4194,
    action: AI_EARLY_MATH_PROVENANCE_CORRECTION_DISABLE_ACTION,
    entityTable: 'aiPublicationConfig',
    entityId: 'global',
    result: 'ok',
    summarySha256: 'b7af8d4eea6672c9a122bb93bba564c5e0f723032de68869d319e7b93655e0fa',
    exactCanonicalSha256: '443ca8463546e85149835f47efa308c5f6bc9d45e30fd0507f5b941b3cb4b6fd',
  },
  aiPublicationRevocationAudit: {
    rowId: 'j5727cj68vwj623r9as92cr7518e3z5x',
    creationTime: 1_788_996_866_536.1348,
    action: AI_EARLY_MATH_PROVENANCE_CORRECTION_REVOKE_ACTION,
    entityTable: 'aiPublicationReleases',
    entityId: AI_EARLY_MATH_PROVENANCE_CORRECTION_PREDECESSOR_RELEASE_ID,
    result: 'ok',
    summarySha256: '42a72e002dd0af1e4c6b0a2a0221ad1d2cca6490c969cf84c6d289cb4ca2abc1',
    exactCanonicalSha256: '9538b58bcfffce20df46abed364db4e694211c4e32c281cc10dec77746d4d04a',
  },
  // sha256Canonical of all revoked release Docs sorted by releaseId.
  revokedAiPublicationReleaseSetCanonicalSha256:
    '2ee9d467cd15690e41b0e82446ef662e8d16196530b56bed1f0f3999d4cc8c82',
  revokedAiPublicationReleases: [
    {
      rowId: 'qn7ct2dpqv194sfzd3wxrfjxmn8cs9qc',
      creationTime: 1_787_120_210_772.8108,
      releaseId: '2026-08-19-ai-educational-preview-3:lesson:lsn_early_math',
      targetKey: 'lesson\u0000lsn_early_math',
      contentId: 'kx79fjkkjq7r7s23q2rcjgq5ed8b97q6',
      contentType: 'lesson',
      contentSlug: 'lsn_early_math',
      status: 'revoked',
      reviewRevision: 9,
      contentUpdatedAt: 1_787_120_210_772,
      contentSnapshotHash: 'e5e5bd3383ade88d5960a1278658a19aef460ddc84717ca8eed07d11fa4145ba',
      evidenceLinkUpdatedAt: 1_787_120_210_772,
      evidenceLinkSnapshotHash: '3badde0e97557a30961739438adc85cdc20ae4545fa3f12f984a5a4bf651c7f8',
      sourceSnapshots: [{
        sourceId: 'us-hhs-head-start-elof-2015',
        sourceUpdatedAt: 1_787_120_210_772,
        sourceSnapshotHash: '061e21a65c5e7df0aa339d56ccf9f0823e17fdf9b7c4fba44ce49228923f2a5c',
        evidenceAuditRunId: '2026-08-19-ai-educational-preview-3:audit:lesson:lsn_early_math',
      }],
      contentAuditRunId: '2026-08-19-ai-educational-preview-3:audit:lesson:lsn_early_math',
      auditArtifactHash: 'a0c1a453b29808e314b5ad296b06dcbc31e3a08d772de62c7c7a04341384cfd4',
      policyVersion: 'ai-educational-preview-v1',
      gitCommit: '5bcc6fd0f996066cf50dfb39ae2fce8f951e2559',
      operatorSha256: '86a71b7354665514a2575e67ae9eddccdae2be9a57ee5029edac895516db3de6',
      createdAt: 1_787_120_210_772,
      expiresAt: 1_794_895_168_000,
      revokedAt: 1_788_996_866_536,
      revokeReasonSha256: '42a72e002dd0af1e4c6b0a2a0221ad1d2cca6490c969cf84c6d289cb4ca2abc1',
      exactCanonicalSha256: 'e03c02f00e644bb3e6353c8019b0a798646f22fbbf3decf3f6bf270787a1a9a9',
    },
    {
      rowId: 'qn70jn34y3rg62xy6de1tm2k658cr5ea',
      creationTime: 1_787_120_210_772.8118,
      releaseId: '2026-08-19-ai-educational-preview-3:story:st_waiting_at_clinic',
      targetKey: 'story\u0000st_waiting_at_clinic',
      contentId: 'kx73pc2tw0pqcrwy1bxan7scgx8b8emr',
      contentType: 'story',
      contentSlug: 'st_waiting_at_clinic',
      status: 'revoked',
      reviewRevision: 3,
      contentUpdatedAt: 1_787_120_210_772,
      contentSnapshotHash: '590191f08636fc7ff358c717ae1044233c6bd067170322f7ae47c6fb2e60a04c',
      evidenceLinkUpdatedAt: 1_787_120_210_772,
      evidenceLinkSnapshotHash: '5bb37bca3a190f7c16c7caa819ab4c614e8279219cffc0a5dbf49ee3faa2ec50',
      sourceSnapshots: [{
        sourceId: 'nhs-alder-hey-outpatient-2023',
        sourceUpdatedAt: 1_787_120_210_772,
        sourceSnapshotHash: 'b1ef83b5454077bdbac05ab4813eae6522fb78a3b7ff2beffed79bb9d5080cd3',
        evidenceAuditRunId: '2026-08-19-ai-educational-preview-3:audit:story:st_waiting_at_clinic',
      }],
      contentAuditRunId: '2026-08-19-ai-educational-preview-3:audit:story:st_waiting_at_clinic',
      auditArtifactHash: 'a0c1a453b29808e314b5ad296b06dcbc31e3a08d772de62c7c7a04341384cfd4',
      policyVersion: 'ai-educational-preview-v1',
      gitCommit: '5bcc6fd0f996066cf50dfb39ae2fce8f951e2559',
      operatorSha256: '86a71b7354665514a2575e67ae9eddccdae2be9a57ee5029edac895516db3de6',
      createdAt: 1_787_120_210_772,
      expiresAt: 1_794_895_168_000,
      revokedAt: 1_788_996_866_536,
      revokeReasonSha256: '42a72e002dd0af1e4c6b0a2a0221ad1d2cca6490c969cf84c6d289cb4ca2abc1',
      exactCanonicalSha256: '28b043d110ede937e5240cf99221c537a1da8dee806ed0b773a0bc9f656d32b0',
    },
    {
      rowId: 'qn7e95f62j275z311q1qqnyfw98csg42',
      creationTime: 1_787_120_210_772.8127,
      releaseId: '2026-08-19-ai-educational-preview-3:story:st_first_day_school',
      targetKey: 'story\u0000st_first_day_school',
      contentId: 'kx77y45t16fy6y98zqyn7kwbsx8b9q7h',
      contentType: 'story',
      contentSlug: 'st_first_day_school',
      status: 'revoked',
      reviewRevision: 2,
      contentUpdatedAt: 1_787_120_210_772,
      contentSnapshotHash: 'cc4d31c2eb18098c24763fcd0b718c431a7f753962f6ae5a5b6c9f9f3d9f72fc',
      evidenceLinkUpdatedAt: 1_787_120_210_772,
      evidenceLinkSnapshotHash: '25eedf3d1dc97fe181b59d674ec96365e6591652acfb3f0fecd7dff0a0c05263',
      sourceSnapshots: [{
        sourceId: 'us-hhs-head-start-first-day-jitters-2024',
        sourceUpdatedAt: 1_787_120_210_772,
        sourceSnapshotHash: '93da0145018783682eba7e299cac56420f5561900f2145c07f36b689c8f7b9a3',
        evidenceAuditRunId: '2026-08-19-ai-educational-preview-3:audit:story:st_first_day_school',
      }],
      contentAuditRunId: '2026-08-19-ai-educational-preview-3:audit:story:st_first_day_school',
      auditArtifactHash: 'a0c1a453b29808e314b5ad296b06dcbc31e3a08d772de62c7c7a04341384cfd4',
      policyVersion: 'ai-educational-preview-v1',
      gitCommit: '5bcc6fd0f996066cf50dfb39ae2fce8f951e2559',
      operatorSha256: '86a71b7354665514a2575e67ae9eddccdae2be9a57ee5029edac895516db3de6',
      createdAt: 1_787_120_210_772,
      expiresAt: 1_794_895_168_000,
      revokedAt: 1_788_996_866_536,
      revokeReasonSha256: '42a72e002dd0af1e4c6b0a2a0221ad1d2cca6490c969cf84c6d289cb4ca2abc1',
      exactCanonicalSha256: '427502506c2bd500ef2e61f50b9c92fef44b5cfb793cfe6739d36f981a3c9a3d',
    },
  ],
  expectedAiEvidenceAuditRows: 0,
  expectedActiveAiPublicationReleaseRows: 0,
} as const;
