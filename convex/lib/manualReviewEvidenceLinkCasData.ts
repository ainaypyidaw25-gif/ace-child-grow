import exactSourceRowsJson from './manualReviewEvidenceLinkCasSources.json';

export const MANUAL_REVIEW_EVIDENCE_LINK_CAS_RELEASE_ID =
  '2026-08-22-manual-review-evidence-links-v1' as const;

export type ManualReviewEvidenceLinkCasTarget = {
  kind: 'guide';
  slug: string;
  linkId: string;
  creationTime: number;
  createdAt: number;
  initialUpdatedAt: number;
  initialSourceIds: readonly string[];
  desiredSourceIds: readonly string[];
  contentId: string;
  contentCreationTime: number;
  contentUpdatedAt: number;
  contentReviewRevision: number;
  contentCanonicalSha256: string;
};

const olderNutritionInitial = [
  'tb-bright-futures-4e-2017',
  'tb-caring-birth-to-5-8e-2024',
  'who-growth-standards-2006',
] as const;

/** Fresh, read-only Production preimages captured after the eight-row content CAS. */
export const MANUAL_REVIEW_EVIDENCE_LINK_CAS_TARGETS:
readonly ManualReviewEvidenceLinkCasTarget[] = [
  {
    kind: 'guide', slug: 'gd_13_18m_nutrition',
    linkId: 'k970hp9n55sqh63djvb5fre8258bd6h7', creationTime: 1_785_241_493_911.839,
    createdAt: 1_785_241_493_911, initialUpdatedAt: 1_785_241_493_911,
    initialSourceIds: olderNutritionInitial,
    desiredSourceIds: [...olderNutritionInitial, 'hc-choking-prevention-2026'],
    contentId: 'kx71q9gjsxzqfzh2sj5ga94ahx8bch4y', contentCreationTime: 1_785_237_828_583.4656,
    contentUpdatedAt: 1_787_358_532_030, contentReviewRevision: 9,
    contentCanonicalSha256: '1d64d93b8ffabe6ce140629f620ba5b8f3db460f7a5b07505b32294c24253926',
  },
  {
    kind: 'guide', slug: 'gd_19_24m_nutrition',
    linkId: 'k97aafzzahxrja2s83csw5ypr18bc3mn', creationTime: 1_785_241_493_911.842,
    createdAt: 1_785_241_493_911, initialUpdatedAt: 1_785_241_493_911,
    initialSourceIds: olderNutritionInitial,
    desiredSourceIds: [...olderNutritionInitial, 'hc-choking-prevention-2026'],
    contentId: 'kx79aa6q8xem3vsxprh2f2eyz58bdxzh', contentCreationTime: 1_785_237_828_583.4702,
    contentUpdatedAt: 1_787_358_532_030, contentReviewRevision: 9,
    contentCanonicalSha256: 'cb056ed70a08bb0429733ffa27e93008c5e599f72a941ab82f43167b6342d4d0',
  },
  {
    kind: 'guide', slug: 'gd_2_5y_nutrition',
    linkId: 'k97djgjnsb4c5q081sqstp81dh8bcxkg', creationTime: 1_785_241_497_141.0925,
    createdAt: 1_785_241_497_141, initialUpdatedAt: 1_785_241_497_141,
    initialSourceIds: olderNutritionInitial,
    desiredSourceIds: [...olderNutritionInitial, 'hc-choking-prevention-2026'],
    contentId: 'kx7ek06127bwcshjt4dweqt1cn8bc6vy', contentCreationTime: 1_785_237_828_583.4797,
    contentUpdatedAt: 1_787_358_532_030, contentReviewRevision: 9,
    contentCanonicalSha256: 'a3fdd0756a783b1b831708be1fe9f1d2e2b8d8b63007dd33466b3769d8dac60d',
  },
  {
    kind: 'guide', slug: 'gd_2y_nutrition',
    linkId: 'k9758bfnv7n7906zg41mf31trh8bcks8', creationTime: 1_785_241_493_911.845,
    createdAt: 1_785_241_493_911, initialUpdatedAt: 1_785_241_493_911,
    initialSourceIds: olderNutritionInitial,
    desiredSourceIds: [...olderNutritionInitial, 'hc-choking-prevention-2026'],
    contentId: 'kx73r4rgvkq6sgby5897fd0gcx8bd9fg', contentCreationTime: 1_785_237_828_583.4749,
    contentUpdatedAt: 1_787_358_532_030, contentReviewRevision: 9,
    contentCanonicalSha256: 'e468a8cfb6780eb2d44fe2437cb631ac2d8c18253ea4554650eaf0ed2e28903c',
  },
  {
    kind: 'guide', slug: 'gd_3_5y_nutrition',
    linkId: 'k9720rvkm299wf7x68ff6gprwn8bcbyv', creationTime: 1_785_241_497_141.0989,
    createdAt: 1_785_241_497_141, initialUpdatedAt: 1_785_241_497_141,
    initialSourceIds: olderNutritionInitial,
    desiredSourceIds: [...olderNutritionInitial, 'hc-choking-prevention-2026'],
    contentId: 'kx75c0xt2a5m13vsw59cp07fgd8bcpxx', contentCreationTime: 1_785_237_828_583.4895,
    contentUpdatedAt: 1_787_358_532_030, contentReviewRevision: 9,
    contentCanonicalSha256: 'e1ee5dd0402f0592225da740100e9f5a6faa705662ff9dd67842b1d26c1a3e7b',
  },
  {
    kind: 'guide', slug: 'gd_3y_nutrition',
    linkId: 'k9705skg5f0d0cnykbwrw44py18bda1y', creationTime: 1_785_241_497_141.0957,
    createdAt: 1_785_241_497_141, initialUpdatedAt: 1_785_241_497_141,
    initialSourceIds: olderNutritionInitial,
    desiredSourceIds: [...olderNutritionInitial, 'hc-choking-prevention-2026'],
    contentId: 'kx73araes924rdsb1s6xqym9zn8bcjfy', contentCreationTime: 1_785_237_828_583.4846,
    contentUpdatedAt: 1_787_358_532_030, contentReviewRevision: 9,
    contentCanonicalSha256: 'f693ef52843d2bfab2c7ad9d138fa113ee80acf4c835be09f38e25fa985a0fcd',
  },
  {
    kind: 'guide', slug: 'gd_5_6m_nutrition',
    linkId: 'k97e1e8ksvz9a78k8p72krxkfd8b8dkn', creationTime: 1_785_024_331_625.8174,
    createdAt: 1_785_024_331_625, initialUpdatedAt: 1_785_024_331_625,
    initialSourceIds: ['who-complementary-feeding-2023', 'nhs-first-solid-foods-2026',
      'cdc-foods-6-24m-2025', 'who-iycf-model-chapter-2025', 'aap-breastfeeding-2022',
      'nhs-breastfeeding-first-days-2023', 'asha-pediatric-feeding-swallowing'],
    desiredSourceIds: ['who-complementary-feeding-2023', 'nhs-first-solid-foods-2026',
      'cdc-foods-6-24m-2025', 'who-iycf-model-chapter-2025', 'aap-breastfeeding-2022',
      'nhs-breastfeeding-first-days-2023', 'asha-pediatric-feeding-swallowing',
      'hc-child-ems-2026'],
    contentId: 'kx7bx9ekynhhsd4h402vafbc158b8v4c', contentCreationTime: 1_785_024_282_947.1875,
    contentUpdatedAt: 1_786_432_330_925, contentReviewRevision: 7,
    contentCanonicalSha256: '206c402308ab8b7c3f7251134cb6e2084d1dbd0040d202de402c5667f8189b62',
  },
  {
    kind: 'guide', slug: 'gd_birth_2m_sleep',
    linkId: 'k97epd1tn83dm0apk7xkby7zjd8b8y86', creationTime: 1_785_024_331_625.8176,
    createdAt: 1_785_024_331_625, initialUpdatedAt: 1_785_024_331_625,
    initialSourceIds: ['aap-safe-sleep-2022', 'nhs-sids-2025',
      'who-pa-sleep-under5-2019', 'hc-safe-sleep-2026'],
    desiredSourceIds: ['aap-safe-sleep-2022', 'nhs-sids-2025',
      'who-pa-sleep-under5-2019', 'hc-safe-sleep-2026',
      'nice-ng143-fever-2019', 'hc-child-ems-2026'],
    contentId: 'kx76vp3r2pnfyy5tgs9shn20bd8b8zha', contentCreationTime: 1_785_024_282_947.1877,
    contentUpdatedAt: 1_786_432_330_925, contentReviewRevision: 3,
    contentCanonicalSha256: '42ec191e63b612456223bd101bcfdca908629f68266a0125ab465e8bda55d58a',
  },
] as const;

export const MANUAL_REVIEW_EVIDENCE_LINK_EXACT_SOURCE_ROWS =
  exactSourceRowsJson as readonly Record<string, unknown>[];

export const MANUAL_REVIEW_EVIDENCE_LINK_SOURCE_PREIMAGES = [
  { sourceId: 'hc-child-ems-2026', rowId: 'kd7b5nenfnkwyy2ecnhvb2jkv18c816t',
    creationTime: 1_786_432_282_130.9553,
    exactCanonicalSha256: 'e6c8a1bf5699b35185e4a17417764652e11d2ce58fadcd2bca83b19438d57408' },
  { sourceId: 'hc-choking-prevention-2026', rowId: 'kd7182vbpt8tjfesgxcsagq0ax8c8yvv',
    creationTime: 1_786_432_282_130.955,
    exactCanonicalSha256: '837b52d0307be1a93642ef526f6329d9612cf1f76f6254e3243929dae2468dd4' },
  { sourceId: 'nice-ng143-fever-2019', rowId: 'kd797n46fgdag01wf7kk09d8k18b8jca',
    creationTime: 1_785_024_320_720.7422,
    exactCanonicalSha256: 'cdc239b7f1fc349efc8808426614fb53db62fbb75b59c2e5f677f12ecee3c6cc' },
] as const;

const keys = MANUAL_REVIEW_EVIDENCE_LINK_CAS_TARGETS.map((target) => `${target.kind}\0${target.slug}`);
const ids = MANUAL_REVIEW_EVIDENCE_LINK_CAS_TARGETS.map((target) => target.linkId);
if (MANUAL_REVIEW_EVIDENCE_LINK_CAS_TARGETS.length !== 8
  || new Set(keys).size !== keys.length
  || new Set(ids).size !== ids.length) {
  throw new Error('Manual-review evidence-link CAS must freeze eight unique guide links');
}
for (const target of MANUAL_REVIEW_EVIDENCE_LINK_CAS_TARGETS) {
  if (target.initialSourceIds.length < 1 || target.initialSourceIds.length > 20
    || target.desiredSourceIds.length < 1 || target.desiredSourceIds.length > 20
    || new Set(target.initialSourceIds).size !== target.initialSourceIds.length
    || new Set(target.desiredSourceIds).size !== target.desiredSourceIds.length) {
    throw new Error(`Invalid manual-review link source array: ${target.kind}:${target.slug}`);
  }
}

/** Server-boundary guard against stale or over-broad generic link imports. */
export function isManualReviewEvidenceLinkCasTarget(kind: string, slug: string): boolean {
  return kind === 'guide' && MANUAL_REVIEW_EVIDENCE_LINK_CAS_TARGETS.some(
    (target) => target.slug === slug,
  );
}
