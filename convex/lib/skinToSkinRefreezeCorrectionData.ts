import seedData from '../seedData.json';
import { v, type Infer } from 'convex/values';

export const SKIN_TO_SKIN_REFREEZE_CORRECTION_RELEASE_ID =
  '2026-08-24-skin-to-skin-refreeze-correction-v1' as const;

export const SKIN_TO_SKIN_REFREEZE_REQUIRED_REVIEWS = [
  'native_myanmar',
  'english',
  'child_development',
  'evidence',
  'safety',
  'clinical',
] as const;

export type SkinToSkinRefreezeDesiredContent = {
  type: string;
  slug: string;
  ageGroupKey?: string;
  domainKey?: string;
  category?: string;
  titleMm: string;
  titleEn: string;
  summaryMm?: string;
  summaryEn?: string;
  tags: string[];
  difficulty?: string;
  durationMinutes?: number;
  offline?: boolean;
  data: unknown;
  source: string;
  version: number;
  searchText: string;
};

function desiredContent(slug: string): SkinToSkinRefreezeDesiredContent {
  const row = (seedData as unknown as SkinToSkinRefreezeDesiredContent[])
    .find((candidate) => candidate.slug === slug);
  if (!row) throw new Error(`Missing skin-to-skin refreeze desired seed row: ${slug}`);
  if (slug === 'gd_birth_2m_sleep') {
    // This release is already applied and its postimage must remain immutable
    // when a later, separately audited correction updates the canonical seed.
    const data = structuredClone(row.data) as {
      safety: { mm: string };
      observationQuestions: Array<{ mm: string }>;
      encouragement: { mm: string };
    };
    const replacements = [
      ['ပက်လက်လှန် အိပ်ပါ။', 'ကျောပေါ်လှန်အိပ်ပါ။'],
      ['ပက်လက်လှန်၍ အိပ်ပါသလား။', 'ကျောပေါ်လှန်၍ အိပ်ပါသလား။'],
      [
        'အိပ်ချိန်ပုံစံသည် တဖြည်းဖြည်း တည်ငြိမ်လာမည် — သည်းခံပါ။',
        'အိပ်ရေးပုံစံသည် တဖြည်းဖြည်း တည်ငြိမ်လာမည် — သည်းခံပါ။',
      ],
    ] as const;
    data.safety.mm = data.safety.mm.replace(...replacements[0]);
    data.observationQuestions[1].mm = replacements[1][1];
    data.encouragement.mm = replacements[2][1];
    return {
      ...row,
      data,
      searchText: replacements.reduce(
        (text, [nextCopy, frozenCopy]) => text.replace(nextCopy, frozenCopy),
        row.searchText,
      ),
    };
  }
  return row;
}

export type SkinToSkinRefreezeTarget = {
  kind: 'activity' | 'guide';
  slug: 'act_skin_to_skin_calm' | 'gd_birth_2m_sleep';
  contentId: string;
  contentCreationTime: number;
  initialCanonicalSha256: string;
  initialAuthoredSha256: string;
  initialReviewRevision: number;
  desiredReviewRevision: number;
  initialUpdatedAt: number;
  desiredAuthoredSha256: string;
  desiredSearchTextSha256: string;
  desiredContent: SkinToSkinRefreezeDesiredContent;
  linkId: string;
  linkCreationTime: number;
  linkCreatedAt: number;
  linkUpdatedAt: number;
  linkCanonicalSha256: string;
  sourceIds: readonly string[];
  sourcesCanonicalSha256: string;
  mediaCount: number;
  mediaCanonicalSha256: string;
  reviewCount: number;
  reviewsCanonicalSha256: string;
};

export const SKIN_TO_SKIN_REFREEZE_TARGETS: readonly SkinToSkinRefreezeTarget[] = [
  {
    kind: 'activity',
    slug: 'act_skin_to_skin_calm',
    contentId: 'kx790c9ywv0bge727jh2765w9s8b82wx',
    contentCreationTime: 1_785_024_282_947.2336,
    initialCanonicalSha256:
      '37ed3052cd3d2716908ae7bd5b9d30f6922e7d90fa134f52ab85bd8bd1d3a15d',
    initialAuthoredSha256:
      'aec0e1970908691102be84b1479042e93ba2975e47f816a9e897ef8d49243010',
    initialReviewRevision: 2,
    desiredReviewRevision: 3,
    initialUpdatedAt: 1_786_432_330_925,
    desiredAuthoredSha256:
      '120d56eafe9e1d10d06379f35bfdcc5961e8bae00e3a16bcfff79152d2fd67a1',
    desiredSearchTextSha256:
      '861ed652fd71c62f834b1c72cfa6da82f58bdc81c7976d99533bd58e67b34638',
    desiredContent: desiredContent('act_skin_to_skin_calm'),
    linkId: 'k9789fvkr23qt48e09s91j8pzn8b8sbp',
    linkCreationTime: 1_785_024_331_625.8394,
    linkCreatedAt: 1_785_024_331_625,
    linkUpdatedAt: 1_785_024_331_625,
    linkCanonicalSha256:
      '25928df256c29b1805aece1e1113a873986fc01a4385fb78c69c7474e64622d0',
    sourceIds: [
      'who-bfhi-2017',
      'who-bf-counselling-2018',
      'aap-safe-sleep-2022',
      'nhs-sids-2025',
    ],
    sourcesCanonicalSha256:
      '79747ef319b64b9741932234009b43c89c4a1661137f240ece656fb6244c4c29',
    mediaCount: 2,
    mediaCanonicalSha256:
      '8e6c1e03eb4899f3ae7ed1e4c6dbcbbf08696db305b462fbbd254bc004def6ba',
    reviewCount: 1,
    reviewsCanonicalSha256:
      'e0536dc7c8a6a023d2567380dbb667870e78e5bb6018d07087b3d1622d0b9869',
  },
  {
    kind: 'guide',
    slug: 'gd_birth_2m_sleep',
    contentId: 'kx76vp3r2pnfyy5tgs9shn20bd8b8zha',
    contentCreationTime: 1_785_024_282_947.1877,
    initialCanonicalSha256:
      '42ec191e63b612456223bd101bcfdca908629f68266a0125ab465e8bda55d58a',
    initialAuthoredSha256:
      'ba513bb7781c80789e0975076725ea164f78ffab2b4a776ac0f14a9eeea426cf',
    initialReviewRevision: 3,
    desiredReviewRevision: 4,
    initialUpdatedAt: 1_786_432_330_925,
    desiredAuthoredSha256:
      'ba513bb7781c80789e0975076725ea164f78ffab2b4a776ac0f14a9eeea426cf',
    desiredSearchTextSha256:
      'fced2123e05b50636231af1d80f07db69555f5fe3e53d319ae92734527d19c8f',
    desiredContent: desiredContent('gd_birth_2m_sleep'),
    linkId: 'k97epd1tn83dm0apk7xkby7zjd8b8y86',
    linkCreationTime: 1_785_024_331_625.8176,
    linkCreatedAt: 1_785_024_331_625,
    linkUpdatedAt: 1_787_359_998_883,
    linkCanonicalSha256:
      'f25350f857aa6a65eaab152e87aa9782fa697c1784b4b1c81f775a7de3d2d6f8',
    sourceIds: [
      'aap-safe-sleep-2022',
      'nhs-sids-2025',
      'who-pa-sleep-under5-2019',
      'hc-safe-sleep-2026',
      'nice-ng143-fever-2019',
      'hc-child-ems-2026',
    ],
    sourcesCanonicalSha256:
      '9c0beb0c6824f3a33273f7e37a34b6e90e4d16efcf8438e1d3eb71397de0572a',
    mediaCount: 0,
    mediaCanonicalSha256:
      '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
    reviewCount: 3,
    reviewsCanonicalSha256:
      'c10edfd2f7fc6bb968fef18b1c027978b5ed6945e4f306b31070c6942b48377a',
  },
] as const;

export const SKIN_TO_SKIN_REFREEZE_REGISTRY_PREIMAGE = {
  batchesCount: 3,
  batchesCanonicalSha256:
    '630261ffb895a0063df7a34d70749b013eece9610263802fab5eea41fd74617f',
  assignmentsCount: 14,
  assignmentsCanonicalSha256:
    'da82ac1e4b32d6f79bb585282114646c31710fc292ba098936dcd2c67f207260',
  receiptsCount: 0,
  receiptsCanonicalSha256:
    '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
  rootBatchId: 'clinical-newborn-skin-sleep-2026-08-23-v1',
  rootStatus: 'stopped_changes_requested',
  rootDecisionSetCanonicalSha256:
    '8ab9e57e7f147fe1cfdc24ff3dfe84972fe4ee46aba62d267810f711d5b80d41',
} as const;

export const skinToSkinRefreezePreflightResultValidator = v.object({
  releaseId: v.literal(SKIN_TO_SKIN_REFREEZE_CORRECTION_RELEASE_ID),
  phase: v.union(v.literal('ready'), v.literal('blocked'), v.literal('applied')),
  checkedAt: v.number(),
  todayIso: v.string(),
  blockers: v.array(v.string()),
  releaseAuditRows: v.number(),
  releaseAuditExact: v.boolean(),
  releaseUpdatedAt: v.union(v.number(), v.null()),
  rootBatchStatus: v.union(v.string(), v.null()),
  rootDecisionSetExact: v.boolean(),
  registryExact: v.boolean(),
  targets: v.array(v.object({
    kind: v.string(),
    slug: v.string(),
    contentRows: v.number(),
    contentRowId: v.union(v.string(), v.null()),
    reviewRevision: v.union(v.number(), v.null()),
    contentUpdatedAt: v.union(v.number(), v.null()),
    initialMatches: v.boolean(),
    desiredTemplateExact: v.boolean(),
    desiredMatches: v.boolean(),
    linkExact: v.boolean(),
    sourcesExact: v.boolean(),
    sourcesEligible: v.boolean(),
    mediaExact: v.boolean(),
    reviewsExact: v.boolean(),
    aiContentAuditRows: v.number(),
    aiPublicationReleaseRows: v.number(),
    aiEvidenceAuditRows: v.number(),
    desiredRevisionApprovals: v.number(),
    outstandingRequiredReviews: v.array(v.string()),
  })),
});

export type SkinToSkinRefreezePreflightResult =
  Infer<typeof skinToSkinRefreezePreflightResultValidator>;

if (SKIN_TO_SKIN_REFREEZE_TARGETS.length !== 2
  || new Set(SKIN_TO_SKIN_REFREEZE_TARGETS.map((target) => target.slug)).size !== 2
  || SKIN_TO_SKIN_REFREEZE_TARGETS.some((target) => (
    target.desiredContent.type !== target.kind
    || target.desiredContent.slug !== target.slug
    || target.desiredReviewRevision !== target.initialReviewRevision + 1
  ))) {
  throw new Error('Skin-to-skin refreeze correction constants are invalid');
}
