import seedData from '../seedData.json';
export {
  isClinicalTwoSmallCasSource,
  isClinicalTwoSmallCasTarget,
  isClinicalTwoSmallCasTargetSlug,
} from './clinicalTwoSmallCasGuard';

export const CLINICAL_TWO_SMALL_CAS_RELEASE_ID =
  '2026-08-24-clinical-two-small-corrections-v1' as const;

export const CLINICAL_TWO_SMALL_REQUIRED_REVIEWS = [
  'native_myanmar',
  'english',
  'child_development',
  'evidence',
  'safety',
  'clinical',
] as const;

export type ClinicalTwoSmallDesiredContent = {
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

function desiredContent(slug: string): ClinicalTwoSmallDesiredContent {
  const row = (seedData as unknown as ClinicalTwoSmallDesiredContent[])
    .find((candidate) => candidate.slug === slug);
  if (!row) throw new Error(`Missing clinical two-small desired seed row: ${slug}`);
  return row;
}

export type ClinicalTwoSmallExactPreimage = {
  rowId: string;
  creationTime: number;
  exactCanonicalSha256: string;
};

export type ClinicalTwoSmallTarget = {
  kind: 'special_need' | 'guide';
  slug: 'sn_cerebral_palsy' | 'gd_3_4m_sleep';
  contentId: string;
  contentCreationTime: number;
  contentInitialCanonicalSha256: string;
  contentInitialAuthoredSha256: string;
  desiredAuthoredSha256: string;
  desiredSearchTextSha256: string;
  contentInitialReviewRevision: number;
  contentDesiredReviewRevision: number;
  contentInitialUpdatedAt: number;
  linkId: string;
  linkCreationTime: number;
  linkCreatedAt: number;
  linkInitialUpdatedAt: number;
  linkInitialCanonicalSha256: string;
  initialSourceIds: readonly string[];
  desiredSourceIds: readonly string[];
  desiredContent: ClinicalTwoSmallDesiredContent;
  mediaPreimages: readonly ClinicalTwoSmallExactPreimage[];
  reviewPreimages: readonly ClinicalTwoSmallExactPreimage[];
};

export const CLINICAL_TWO_SMALL_TARGETS: readonly ClinicalTwoSmallTarget[] = [
  {
    kind: 'special_need',
    slug: 'sn_cerebral_palsy',
    contentId: 'kx75znvhv5y88az3cv0j1mjbdh8b8ktj',
    contentCreationTime: 1_785_024_282_947.2092,
    contentInitialCanonicalSha256:
      '736d56e3275e2ab147f8d4bae614bc8d174fcd516917397a755b2d389ab07644',
    contentInitialAuthoredSha256:
      'c25f04e8440e62811375fb4dae282ae68d22864f34f44fce19ca521290fe53d3',
    desiredAuthoredSha256:
      '28b8ae137996a75effd15841880e3a2b265e11742a2922c0d433dd09f40a0caa',
    desiredSearchTextSha256:
      'd72163791303a1f7df35b726e8f8d33df7808f0419769f6c64d6431eb5ab4e04',
    contentInitialReviewRevision: 4,
    contentDesiredReviewRevision: 5,
    contentInitialUpdatedAt: 1_787_310_167_560,
    linkId: 'k973e3b7chr9t189f5v291hhmh8b9179',
    linkCreationTime: 1_785_024_331_625.8274,
    linkCreatedAt: 1_785_024_331_625,
    linkInitialUpdatedAt: 1_787_310_167_560,
    linkInitialCanonicalSha256:
      'f3bc4a538765e8f69c99dbab254b21117dc248f1a94f188029e78de8a92b793b',
    initialSourceIds: ['nice-ng62-cerebral-palsy-2017'],
    desiredSourceIds: ['nice-ng62-cerebral-palsy-2017'],
    desiredContent: desiredContent('sn_cerebral_palsy'),
    mediaPreimages: [{
      rowId: 'm17fazcr1nrz4h93gza0fkvmfn8c81md',
      creationTime: 1_786_432_330_925.2153,
      exactCanonicalSha256:
        '756754efdb38553584c727d84b96bf44a01fd6cf485a9853820a74e74224f6ae',
    }],
    reviewPreimages: [
      {
        rowId: 'nn763kceqb74eyg804g028zq1d8brptr',
        creationTime: 1_785_754_001_532.941,
        exactCanonicalSha256:
          '10b39ecab7cd0a7110f64b7cd49ab8db2eb01cc71f56470f958894d964175477',
      },
      {
        rowId: 'nn76rnn2wra0vcxg35334869658bx0qc',
        creationTime: 1_785_904_800_316.004,
        exactCanonicalSha256:
          '18f2f8a6d60ead5d27363e166d9e2742cd59124d79586f6990bff3b423776c3d',
      },
      {
        rowId: 'nn783h4x404cmh44q2e9x7gt4n8bwx3q',
        creationTime: 1_785_904_797_615.018,
        exactCanonicalSha256:
          '2200854d8945f9632d4e6e0d7fc76a4d00e82d5db8785827f5b3c701dbfdb3b6',
      },
    ],
  },
  {
    kind: 'guide',
    slug: 'gd_3_4m_sleep',
    contentId: 'kx766hemgchg3f8yqdmyjkkwnn8b8wzk',
    contentCreationTime: 1_785_024_282_947.241,
    contentInitialCanonicalSha256:
      '738c610bbb5081bdd06093c81fb0c89465af857b8f786c084fb17490a537970b',
    contentInitialAuthoredSha256:
      '2567afba8b413eb3aa3cef1b3d35baf0af372e370a4f75987acc72f555ea28b7',
    desiredAuthoredSha256:
      'addacf2996871cf8f73140611c2b85ece8bab4e3c4d6675d12b5a7f742923b9d',
    desiredSearchTextSha256:
      'ec6e1e18810b164ebb2b0ac2c9cd5f62ffd2a4b402336ef60f392ed26d4b048c',
    contentInitialReviewRevision: 7,
    contentDesiredReviewRevision: 8,
    contentInitialUpdatedAt: 1_786_432_330_925,
    linkId: 'k97aead09g1vj6d4t2b226s9js8b90qb',
    linkCreationTime: 1_785_024_331_625.8445,
    linkCreatedAt: 1_785_024_331_625,
    linkInitialUpdatedAt: 1_785_024_331_625,
    linkInitialCanonicalSha256:
      '716ef2f854a89d47fe95ae54eaf55b525317d4c74a4c6971f291b88436cc4039',
    initialSourceIds: [
      'who-pa-sleep-under5-2019',
      'aap-safe-sleep-2022',
      'nhs-sids-2025',
      'hc-safe-sleep-2026',
      'jr-aasm-bedtime-2006',
    ],
    desiredSourceIds: [
      'who-pa-sleep-under5-2019',
      'aap-safe-sleep-2022',
      'nhs-sids-2025',
      'hc-safe-sleep-2026',
    ],
    desiredContent: desiredContent('gd_3_4m_sleep'),
    mediaPreimages: [],
    reviewPreimages: [
      {
        rowId: 'nn707rhpsfgxfk3rt823ah4b618bswtr',
        creationTime: 1_785_765_682_370.1975,
        exactCanonicalSha256:
          '541bfe377c7b01ae3d1c5bb7f97c4770ae8ecfbf76db6fafbf8e9aa973d03aff',
      },
      {
        rowId: 'nn70wra0e25czc63cbkex4hm4n8br4wj',
        creationTime: 1_785_765_685_968.1572,
        exactCanonicalSha256:
          '807928c9b1ee827307582123b48c096b2d819e3a1dcb36acfc519d0dbe25239a',
      },
      {
        rowId: 'nn74kh36kd2ckehze320pdwx7d8brteq',
        creationTime: 1_785_765_679_502.1794,
        exactCanonicalSha256:
          '4d4494e7c3de927e28a325d7a18bc5d54288972efb665d65888285597ab5879b',
      },
      {
        rowId: 'nn77snmg481k86bm1a9rw0039x8c8n5g',
        creationTime: 1_786_417_687_309.5332,
        exactCanonicalSha256:
          '022eedb3566c6022efe1cdbf66184dedc01b98bc5ed0a6f10002934fcff5e3f1',
      },
      {
        rowId: 'nn7b30s4qzar0kz2p5ewaapban8c9jap',
        creationTime: 1_786_417_691_830.6577,
        exactCanonicalSha256:
          '5c7ac90bab0063eeae52cdf2af15bf43f37ff7d1ce99d8e781cbc90db1ebf825',
      },
      {
        rowId: 'nn7d1kpj8tg5cc9c9tp1tepedn8bs77b',
        creationTime: 1_785_765_672_097.6345,
        exactCanonicalSha256:
          'bd3c34d36b436fbd575c9637fec71beabe8e3a2ae5e5413d48ff81f5f600b807',
      },
    ],
  },
] as const;

export type ClinicalTwoSmallSourcePreimage = ClinicalTwoSmallExactPreimage & {
  sourceId: string;
};

export const CLINICAL_TWO_SMALL_SOURCE_PREIMAGES:
readonly ClinicalTwoSmallSourcePreimage[] = [
  {
    sourceId: 'aap-safe-sleep-2022',
    rowId: 'kd7fvrcdpz2ke6d3g2pn9fcje98b82dr',
    creationTime: 1_785_024_320_720.7363,
    exactCanonicalSha256:
      '1e0b8da788ec727914131e955abaddb6c7d0c435ca8947bcb654d247779317bc',
  },
  {
    sourceId: 'hc-safe-sleep-2026',
    rowId: 'kd7fymt63j6tsmk5t6jnr9gcjs8b9ars',
    creationTime: 1_785_024_320_720.74,
    exactCanonicalSha256:
      '33a36bde375baa720bcbf79e1e1414914e7b834b66aac5f7d89b6ecbc2bef1f7',
  },
  {
    sourceId: 'jr-aasm-bedtime-2006',
    rowId: 'kd71q38068g56z2mxcry88a1ph8b884e',
    creationTime: 1_785_024_320_720.7483,
    exactCanonicalSha256:
      '7d4682d6adec92f01006cdae78871e49c2c43d9be0a8b59446a869874cbfff72',
  },
  {
    sourceId: 'nhs-sids-2025',
    rowId: 'kd7fckxac2cty05c9ed0fdxcp18b8btx',
    creationTime: 1_785_024_320_720.743,
    exactCanonicalSha256:
      'fdaf59b1f4096fc7ff159e9c1ee84b68ebce348d170c81be21f4bddc0fc19ebb',
  },
  {
    sourceId: 'nice-ng62-cerebral-palsy-2017',
    rowId: 'kd79knstrm9zfswckrqr29tedd8b81xc',
    creationTime: 1_785_024_320_720.742,
    exactCanonicalSha256:
      '86cfc2b8148a3c1a859634a157acdd58fb1dd3cd45f6a55cf031569f41bf092f',
  },
  {
    sourceId: 'who-pa-sleep-under5-2019',
    rowId: 'kd74j8wgrjye8tvw224atvghzx8b9xxc',
    creationTime: 1_785_024_320_720.7317,
    exactCanonicalSha256:
      '77aaf1022ede99507c355a80f1b719e1689cd793cf456d8bce7b148d3c8259a9',
  },
] as const;

export const CLINICAL_TWO_SMALL_REVERSE_DEPENDENCIES = [
  {
    sourceId: 'aap-safe-sleep-2022',
    initialCount: 44,
    desiredCount: 44,
    initialCanonicalSha256:
      'cb3029fec6400284036162e048f5ab1bcf68ac0d5c50e2c1fbb2d03d321f4aec',
    desiredCanonicalSha256: null,
  },
  {
    sourceId: 'hc-safe-sleep-2026',
    initialCount: 6,
    desiredCount: 6,
    initialCanonicalSha256:
      '5fe681869e5a5ed9a83d48dc310de7a1eb61f8de40a7a9d3ad2aff436e9d5362',
    desiredCanonicalSha256: null,
  },
  {
    sourceId: 'jr-aasm-bedtime-2006',
    initialCount: 25,
    desiredCount: 24,
    initialCanonicalSha256:
      'a714db6bcde1ec2c071b5d93c92f9ca17c1bb86d29d1cdab207c6dbd7e8a58fc',
    desiredCanonicalSha256:
      '3362bc39fb0e3eddad28e6ad5bef47bfa96f39e3a626e83ba3317d32fb3c9c95',
  },
  {
    sourceId: 'nhs-sids-2025',
    initialCount: 24,
    desiredCount: 24,
    initialCanonicalSha256:
      'dbbb1110705ce6b620a5772ae39e938059eb646e1a9c4038471b746ff4f7b909',
    desiredCanonicalSha256: null,
  },
  {
    sourceId: 'nice-ng62-cerebral-palsy-2017',
    initialCount: 2,
    desiredCount: 2,
    initialCanonicalSha256:
      '554824454957e1d22f4fc07a4d6be632a83b9b5a2f83ecc33a7dc70dc0212eb5',
    desiredCanonicalSha256:
      '554824454957e1d22f4fc07a4d6be632a83b9b5a2f83ecc33a7dc70dc0212eb5',
  },
  {
    sourceId: 'who-pa-sleep-under5-2019',
    initialCount: 61,
    desiredCount: 61,
    initialCanonicalSha256:
      'ff760ab4236b5f81ffba5c31d8be2aaec6e603040cc50ba453187654feeb80db',
    desiredCanonicalSha256: null,
  },
] as const;

if (CLINICAL_TWO_SMALL_TARGETS.length !== 2
  || new Set(CLINICAL_TWO_SMALL_TARGETS.map((target) => target.slug)).size !== 2
  || new Set(CLINICAL_TWO_SMALL_TARGETS.map((target) => `${target.kind}:${target.slug}`)).size !== 2
  || new Set(CLINICAL_TWO_SMALL_SOURCE_PREIMAGES.map((source) => source.sourceId)).size !== 6
  || CLINICAL_TWO_SMALL_TARGETS.some((target) => (
    target.desiredContent.type !== target.kind
    || target.desiredContent.slug !== target.slug
    || target.contentDesiredReviewRevision !== target.contentInitialReviewRevision + 1
    || target.initialSourceIds.length === 0
    || target.desiredSourceIds.length === 0
    || !target.desiredSourceIds.every((sourceId) => target.initialSourceIds.includes(sourceId))
  ))) {
  throw new Error('Clinical two-small CAS constants are invalid');
}
