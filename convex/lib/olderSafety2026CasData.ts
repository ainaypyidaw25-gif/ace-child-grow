export const OLDER_SAFETY_2026_RELEASE_ID =
  '2026-08-23-older-safety-current-evidence-v1' as const;

export const AAP_DROWNING_2021_SOURCE_ID = 'aap-drowning-2021' as const;
export const AAP_DROWNING_2026_SOURCE_ID = 'aap-drowning-2026' as const;
export const CDC_TODDLER_SOURCE_ID = 'cdc-positive-parenting-toddlers-2026' as const;
export const CDC_PRESCHOOL_SOURCE_ID =
  'cdc-positive-parenting-preschoolers-2026' as const;
export const CPSC_CHILDPROOFING_SOURCE_ID = 'cpsc-childproofing-home-2023' as const;
export const BRIGHT_FUTURES_SOURCE_ID = 'tb-bright-futures-4e-2017' as const;

export type OlderSafetyStagedSource = {
  sourceId: string;
  org: string;
  orgKey: string;
  title: string;
  authors: string | null;
  year: number | null;
  edition: string | null;
  country: string | null;
  language: string;
  url: string;
  doi: string | null;
  isbn: string | null;
  pmid: string | null;
  evidenceLevel: string;
  keywords: readonly string[];
  topics: readonly string[];
  ageMonthsMin: number | null;
  ageMonthsMax: number | null;
  verifiedOn: string;
  verifiedNote: string;
};

/**
 * Verified publisher metadata only. These rows are staged as awaiting_review;
 * this release never manufactures a reviewer identity or an approval.
 */
export const OLDER_SAFETY_2026_STAGED_SOURCES:
readonly OlderSafetyStagedSource[] = [
  {
    sourceId: AAP_DROWNING_2026_SOURCE_ID,
    org: 'American Academy of Pediatrics',
    orgKey: 'AAP',
    title: 'Prevention of Drowning: Policy Statement',
    authors:
      'Rohit P Shenoi; Tracy McCallin; Caitlin Farrell; Shabana Yusuf; Sadiqa Kendi; Julie Gilchrist; Linda Quan; Council on Injury, Violence, and Poison Prevention',
    year: 2026,
    edition: 'Pediatrics. 2026 Jul 1;158(1):e2026077410',
    country: 'United States',
    language: 'en',
    url:
      'https://publications.aap.org/pediatrics/article/doi/10.1542/peds.2026-077410/207630/Prevention-of-Drowning-Policy-Statement',
    doi: '10.1542/peds.2026-077410',
    isbn: null,
    pmid: '42144630',
    evidenceLevel: 'guideline',
    keywords: [
      'drowning prevention',
      'water safety',
      'supervision',
      'barriers',
      'life jackets',
      'water competency',
    ],
    topics: ['safety'],
    ageMonthsMin: 0,
    // The policy explicitly addresses children and adolescents and repeatedly
    // says "children of all ages"; null deliberately avoids inventing a cap.
    ageMonthsMax: null,
    verifiedOn: '2026-08-23',
    verifiedNote:
      'The final AAP publisher page/PDF and PubMed record 42144630 print this title, the seven named authors and AAP council, Pediatrics 2026;158(1):e2026077410, DOI 10.1542/peds.2026-077410 and PMID 42144630. The policy calls for close, constant, attentive and competent adult supervision, multiple prevention layers, age-based anticipatory guidance and water competency for children of all ages. The 2021 statement is superseded and is not reset or retired by this release.',
  },
  {
    sourceId: CDC_PRESCHOOL_SOURCE_ID,
    org: 'Centers for Disease Control and Prevention',
    orgKey: 'CDC',
    title: 'Positive Parenting Tips: Preschoolers (3–5 years old)',
    authors: null,
    year: 2026,
    edition: null,
    country: 'United States',
    language: 'en',
    url:
      'https://www.cdc.gov/child-development/positive-parenting-tips/preschooler-3-5-years.html',
    doi: null,
    isbn: null,
    pmid: null,
    evidenceLevel: 'parent_education',
    keywords: [
      'positive parenting',
      'preschooler',
      'traffic safety',
      'water safety',
      'supervision',
    ],
    topics: ['parenting', 'safety', 'social_emotional'],
    ageMonthsMin: 36,
    // "3–5 years old" means through the month before the sixth birthday.
    ageMonthsMax: 71,
    verifiedOn: '2026-08-23',
    verifiedNote:
      'The CDC page prints this exact title and “Feb. 20, 2026.” Its Child safety first section says to keep children out of traffic, watch them at all times outside, and watch them at all times in or around any body of water. The printed 3–5-year scope covers ACE bands 36–66 months.',
  },
  {
    sourceId: CPSC_CHILDPROOFING_SOURCE_ID,
    org: 'U.S. Consumer Product Safety Commission',
    orgKey: 'GOV',
    title:
      'Childproofing Your Home: Several Safety Devices to Help Protect Your Children from Home Hazards',
    authors: null,
    year: 2023,
    edition: 'Publication #252 • 032023',
    country: 'United States',
    language: 'en',
    url: 'https://www.cpsc.gov/s3fs-public/252ChildproofingYourHome32123.pdf',
    doi: null,
    isbn: null,
    pmid: null,
    evidenceLevel: 'parent_education',
    keywords: [
      'childproofing',
      'window guards',
      'window opening limit',
      'fire escape',
      'furniture anchors',
      'cabinet locks',
    ],
    topics: ['safety', 'parenting'],
    ageMonthsMin: null,
    ageMonthsMax: null,
    verifiedOn: '2026-08-23',
    verifiedNote:
      'The official CPSC PDF prints this title and “Publication #252 • 032023.” It says window guards/safety netting should limit openings to four inches or less while at least one window in each room remains easy to use for fire escape; it also recommends furniture anchors and locks that keep medicines and cleaners out of reach.',
  },
] as const;

export type OlderSafetyTarget = {
  kind: 'guide';
  slug: string;
  ageMonthsMin: number;
  ageMonthsMax: number;
  contentId: string;
  contentCreationTime: number;
  contentCreatedAt: number;
  contentInitialUpdatedAt: number;
  contentInitialReviewRevision: number;
  contentInitialCanonicalSha256: string;
  linkId: string;
  linkCreationTime: number;
  linkCreatedAt: number;
  linkInitialUpdatedAt: number;
  linkInitialCanonicalSha256: string;
  initialSourceIds: readonly string[];
  desiredSourceIds: readonly string[];
};

const initialSourceIds = [
  AAP_DROWNING_2021_SOURCE_ID,
  BRIGHT_FUTURES_SOURCE_ID,
  CDC_TODDLER_SOURCE_ID,
] as const;

const toddlerDesiredSourceIds = [
  AAP_DROWNING_2026_SOURCE_ID,
  BRIGHT_FUTURES_SOURCE_ID,
  CDC_TODDLER_SOURCE_ID,
] as const;

const toddlerWindowDesiredSourceIds = [
  ...toddlerDesiredSourceIds,
  CPSC_CHILDPROOFING_SOURCE_ID,
] as const;

const preschoolDesiredSourceIds = [
  AAP_DROWNING_2026_SOURCE_ID,
  BRIGHT_FUTURES_SOURCE_ID,
  CDC_PRESCHOOL_SOURCE_ID,
] as const;

export const OLDER_SAFETY_2026_TARGETS: readonly OlderSafetyTarget[] = [
  {
    kind: 'guide', slug: 'gd_13_18m_safety', ageMonthsMin: 13, ageMonthsMax: 18,
    contentId: 'kx70pz9t2x95n0727d38qvwdkd8bdzb8', contentCreationTime: 1_785_237_828_583.466,
    contentCreatedAt: 1_785_237_828_583, contentInitialUpdatedAt: 1_786_432_330_925,
    contentInitialReviewRevision: 6,
    contentInitialCanonicalSha256: '26e6ec762116eb294f9279943728ece0bde75ca49e9de6bec471dcc8d3e0c8fb',
    linkId: 'k978ctxpz373p0qagwvv64t34n8bcvpd', linkCreationTime: 1_785_241_493_911.8396,
    linkCreatedAt: 1_785_241_493_911, linkInitialUpdatedAt: 1_785_241_493_911,
    linkInitialCanonicalSha256: 'aafc546a65225cc27e0f801e42cbfc4b32359b9e0a6f0c462556668400053b1b',
    initialSourceIds, desiredSourceIds: toddlerDesiredSourceIds,
  },
  {
    kind: 'guide', slug: 'gd_19_24m_safety', ageMonthsMin: 19, ageMonthsMax: 24,
    contentId: 'kx72ka0h20jt3fccnby5q1g8918bdjxs', contentCreationTime: 1_785_237_828_583.4707,
    contentCreatedAt: 1_785_237_828_583, contentInitialUpdatedAt: 1_786_432_330_925,
    contentInitialReviewRevision: 6,
    contentInitialCanonicalSha256: 'f2d29f553faab2fb92001d14f1a827a075b05f3a14ca2780b3190da2ad77daff',
    linkId: 'k970v5cb4gwzc3m3tzd1v9ssv98bd1y7', linkCreationTime: 1_785_241_493_911.8425,
    linkCreatedAt: 1_785_241_493_911, linkInitialUpdatedAt: 1_785_241_493_911,
    linkInitialCanonicalSha256: 'ac7b8f85fd1d956cbe70b665a856c8c11efe1d7332dfc6db25a241d86ddd2f61',
    initialSourceIds, desiredSourceIds: toddlerWindowDesiredSourceIds,
  },
  {
    kind: 'guide', slug: 'gd_2y_safety', ageMonthsMin: 24, ageMonthsMax: 30,
    contentId: 'kx73pwvtvvamn3dfx14jrg40nn8bc7kj', contentCreationTime: 1_785_237_828_583.4753,
    contentCreatedAt: 1_785_237_828_583, contentInitialUpdatedAt: 1_786_432_330_925,
    contentInitialReviewRevision: 6,
    contentInitialCanonicalSha256: '153da4bfad4b7f83cfe8fe5106add4f8e8abc9d04af394b9ebe4faafefbe854f',
    linkId: 'k973vc85xh8yav2fg8j4kmnabn8bd1g6', linkCreationTime: 1_785_241_493_911.8455,
    linkCreatedAt: 1_785_241_493_911, linkInitialUpdatedAt: 1_785_241_493_911,
    linkInitialCanonicalSha256: 'a160bee9f2097b7e89e20db03961bbcd04718de2e96931063edd2a8a07655108',
    initialSourceIds, desiredSourceIds: toddlerDesiredSourceIds,
  },
  {
    kind: 'guide', slug: 'gd_2_5y_safety', ageMonthsMin: 30, ageMonthsMax: 36,
    contentId: 'kx71xfbs9qjg1bz2hfvmgfc1rd8bcnfq', contentCreationTime: 1_785_237_828_583.4802,
    contentCreatedAt: 1_785_237_828_583, contentInitialUpdatedAt: 1_786_432_330_925,
    contentInitialReviewRevision: 6,
    contentInitialCanonicalSha256: '74c6085a0be81451d2c83a3cd9e0fdef3aa838a88e7a7de1fee436fabe974b16',
    linkId: 'k972t78ctsbmrp4gh7dhrfp0q58bdq47', linkCreationTime: 1_785_241_497_141.093,
    linkCreatedAt: 1_785_241_497_141, linkInitialUpdatedAt: 1_785_241_497_141,
    linkInitialCanonicalSha256: '2e67b6bb3c1fb194e191a462164cc0eaef6636ecbf1ad492c85d1643fa7419c7',
    initialSourceIds, desiredSourceIds: toddlerDesiredSourceIds,
  },
  {
    kind: 'guide', slug: 'gd_3y_safety', ageMonthsMin: 36, ageMonthsMax: 42,
    contentId: 'kx75jb917chhxe4spsmp49bw918bdmcd', contentCreationTime: 1_785_237_828_583.485,
    contentCreatedAt: 1_785_237_828_583, contentInitialUpdatedAt: 1_786_432_330_925,
    contentInitialReviewRevision: 5,
    contentInitialCanonicalSha256: '5eb9a62b6bf776f3a49a64434a9237dcdda77d58662ebf6875c1ed49936eeb37',
    linkId: 'k970wxb0d4xnxnbcr2z8yp2kbn8bca9v', linkCreationTime: 1_785_241_497_141.0962,
    linkCreatedAt: 1_785_241_497_141, linkInitialUpdatedAt: 1_785_241_497_141,
    linkInitialCanonicalSha256: '10ebd75beb32265bcd6c3c70667dd408b1b108b2dde58c48718fd6bf60659a01',
    initialSourceIds, desiredSourceIds: preschoolDesiredSourceIds,
  },
  {
    kind: 'guide', slug: 'gd_3_5y_safety', ageMonthsMin: 42, ageMonthsMax: 48,
    contentId: 'kx72jqztx8ysd8w20sqwxw8gfd8bc5gj', contentCreationTime: 1_785_237_828_583.49,
    contentCreatedAt: 1_785_237_828_583, contentInitialUpdatedAt: 1_786_432_330_925,
    contentInitialReviewRevision: 5,
    contentInitialCanonicalSha256: 'c1bd6d864bff70f498f746f6b3c5d932bd25eadf160f7ae7a1ae7afbc30b8ede',
    linkId: 'k97emfw1fzzdkrmbcy8emnad3s8bdz7q', linkCreationTime: 1_785_241_497_141.0994,
    linkCreatedAt: 1_785_241_497_141, linkInitialUpdatedAt: 1_785_241_497_141,
    linkInitialCanonicalSha256: '2dd703359ebfee68a13ce6e30bcf3413e5ec1d15c59552f33e92a5fb665b1f62',
    initialSourceIds, desiredSourceIds: preschoolDesiredSourceIds,
  },
  {
    kind: 'guide', slug: 'gd_4y_safety', ageMonthsMin: 48, ageMonthsMax: 54,
    contentId: 'kx735zjgmccz25yaacwc5fhymn8bdvsb', contentCreationTime: 1_785_237_828_583.4949,
    contentCreatedAt: 1_785_237_828_583, contentInitialUpdatedAt: 1_786_432_330_925,
    contentInitialReviewRevision: 5,
    contentInitialCanonicalSha256: 'b2bdd45fe92497272663b6320ba461b5df30eca6454188e39578b99766ccbbf9',
    linkId: 'k970ex6j7yzngvenvwqbrv0ayn8bc1w3', linkCreationTime: 1_785_241_497_141.1025,
    linkCreatedAt: 1_785_241_497_141, linkInitialUpdatedAt: 1_785_241_497_141,
    linkInitialCanonicalSha256: '1b112cdcdf9001bb5919260804bbdf04c5ceb1cc4c9b63e1c8ea84af27a642ee',
    initialSourceIds, desiredSourceIds: preschoolDesiredSourceIds,
  },
  {
    kind: 'guide', slug: 'gd_4_5y_safety', ageMonthsMin: 54, ageMonthsMax: 60,
    contentId: 'kx7c0k0hq7agzphv03j863cacd8bc8wh', contentCreationTime: 1_785_237_828_583.4998,
    contentCreatedAt: 1_785_237_828_583, contentInitialUpdatedAt: 1_786_432_330_925,
    contentInitialReviewRevision: 5,
    contentInitialCanonicalSha256: 'c85cec2e4c09cf05373fbd48bff96647193945507a474c00127393deb580b873',
    linkId: 'k978mvw7fmmggm4m1e11x04wb98bc8b4', linkCreationTime: 1_785_241_497_141.1057,
    linkCreatedAt: 1_785_241_497_141, linkInitialUpdatedAt: 1_785_241_497_141,
    linkInitialCanonicalSha256: '9782052802dacc0520f106c345bd14c836f8f54df6c452336f5af59d37a2318c',
    initialSourceIds, desiredSourceIds: preschoolDesiredSourceIds,
  },
  {
    kind: 'guide', slug: 'gd_5y_safety', ageMonthsMin: 60, ageMonthsMax: 66,
    contentId: 'kx72cdsmasnxpdnymryyhsybvn8bcvj9', contentCreationTime: 1_785_237_828_583.5046,
    contentCreatedAt: 1_785_237_828_583, contentInitialUpdatedAt: 1_786_432_330_925,
    contentInitialReviewRevision: 5,
    contentInitialCanonicalSha256: '21ea6f6ae84ad9260558fe329ff29235bea1bb91794155d6a8610885eaa4c711',
    linkId: 'k97ax2c9qpywa5c4sjm5rt4pjs8bdtk1', linkCreationTime: 1_785_241_497_141.109,
    linkCreatedAt: 1_785_241_497_141, linkInitialUpdatedAt: 1_785_241_497_141,
    linkInitialCanonicalSha256: '086209df60774d2fbb25ba6fbbd3552283d82af654ab960832ecc647a64b4830',
    initialSourceIds, desiredSourceIds: preschoolDesiredSourceIds,
  },
] as const;

export const OLDER_SAFETY_EXISTING_SOURCE_PREIMAGES = [
  {
    sourceId: AAP_DROWNING_2021_SOURCE_ID,
    rowId: 'kd74yn7tgqyvj6fcvsgsgxt0hs8b9sqa',
    creationTime: 1_785_024_320_720.738,
    canonicalSha256: 'ab31ffe031739edcefabe23a46a74b28e3e554bd288359ca3386deba6a3113d1',
  },
  {
    sourceId: BRIGHT_FUTURES_SOURCE_ID,
    rowId: 'kd7fhbywwd960azjsgqd2kjsx58b8z8d',
    creationTime: 1_785_024_320_720.75,
    canonicalSha256: '884f6f50bcdc10faf29690640dafc56818cc9102695b5d33eab49303149e245b',
  },
  {
    sourceId: CDC_TODDLER_SOURCE_ID,
    rowId: 'kd76fy3me82fsm4vzh06m3y1zx8b84m1',
    creationTime: 1_785_024_320_720.7395,
    canonicalSha256: '5499dbeb352bac6a16f08b3f47b852e4b74530ac38c15e97527a3a0c1ae97135',
  },
] as const;

export const GD_19_24M_SAFETY_INITIAL_COPY = {
  mm: 'တက်တတ်၊ ဖွင့်တတ်လာသောကလေးအတွက် ပြတင်းပေါက်၊ ဆေးနှင့် သန့်ရှင်းရေးပစ္စည်းကို သော့ခတ်ပါ။',
  en: 'Lock windows, medicines, and cleaning products as climbing increases.',
} as const;

export const GD_19_24M_SAFETY_DESIRED_COPY = {
  mm: 'ပြတင်းပေါက်တွင် အကာအရံ သို့မဟုတ် အဖွင့်ကန့်သတ်ကိရိယာ တပ်၍ ၄ လက်မထက် ပိုမဖွင့်နိုင်အောင် ထားပါ။ မီးဘေးဖြစ်ပါက ထွက်ပြေးနိုင်ရန် အခန်းတိုင်းတွင် အနည်းဆုံး ပြတင်းပေါက်တစ်ပေါက်ကို လွယ်ကူစွာ ဖွင့်နိုင်အောင် ထားပါ။ တက်နိုင်သော ပရိဘောဂများကို ဝေးရာရွှေ့ပြီး ဆေးဝါးနှင့် သန့်ရှင်းရေးပစ္စည်းများကို ကလေးမမီသော နေရာတွင် သော့ခတ်သိမ်းပါ။',
  en: 'Fit operable window guards or stops so windows open no more than four inches; keep at least one window in each room easy to open for fire escape. Move climbable furniture away, and lock medicines and cleaning products out of reach.',
  evidenceSummary:
    'The 2023 CPSC childproofing guide directly supports window guards/opening limits, preserving one operable fire-escape window per room, furniture anchoring and locked medicines/cleaners. Current AAP and age-matched CDC guidance support layered water, traffic and supervision precautions.',
} as const;

/** Exact 2026-08-23 Production reverse-dependency snapshot (461 rows scanned). */
export const AAP_DROWNING_2021_INITIAL_REVERSE_KEYS = [
  'activity:act_water_pouring',
  'guide:gd_10_12m_daily_routine',
  'guide:gd_10_12m_play',
  'guide:gd_10_12m_safety',
  'guide:gd_13_18m_safety',
  'guide:gd_19_24m_safety',
  'guide:gd_2_5y_safety',
  'guide:gd_2y_safety',
  'guide:gd_3_4m_daily_routine',
  'guide:gd_3_4m_safety',
  'guide:gd_3_5y_safety',
  'guide:gd_3y_safety',
  'guide:gd_4_5y_safety',
  'guide:gd_4y_safety',
  'guide:gd_5_6m_daily_routine',
  'guide:gd_5_6m_safety',
  'guide:gd_5y_safety',
  'guide:gd_7_9m_daily_routine',
  'guide:gd_7_9m_safety',
  'guide:gd_birth_2m_safety',
  'lesson:lsn_home_safety',
  'milestone:ms_13_18m_safety_1',
  'milestone:ms_19_24m_safety_1',
  'milestone:ms_2_5y_safety_1',
  'milestone:ms_2y_safety_1',
  'milestone:ms_3_5y_safety_1',
  'milestone:ms_3y_safety_1',
  'milestone:ms_4_5y_safety_1',
  'milestone:ms_4y_safety_1',
  'milestone:ms_5y_safety_1',
  'milestone:ms_5y_safety_2',
  'milestone:ms_5y_safety_3',
  'safety_rule:serious_injury',
] as const;

const targetKeys = new Set(OLDER_SAFETY_2026_TARGETS.map(
  (target) => `${target.kind}:${target.slug}`,
));

export const AAP_DROWNING_2021_DESIRED_REVERSE_KEYS =
  AAP_DROWNING_2021_INITIAL_REVERSE_KEYS.filter((key) => !targetKeys.has(key));

export const OLDER_SAFETY_REQUIRED_REVIEW_DIMENSIONS = [
  'native_myanmar',
  'english',
  'child_development',
  'evidence',
  'safety',
  'clinical',
] as const;

/** Permanently protects the nine audited content rows from broad seed writes. */
export function isOlderSafety2026ContentTargetSlug(slug: string): boolean {
  return OLDER_SAFETY_2026_TARGETS.some((target) => target.slug === slug);
}

/** Permanently protects the nine audited evidence edges from generic imports. */
export function isOlderSafety2026LinkTarget(kind: string, slug: string): boolean {
  return OLDER_SAFETY_2026_TARGETS.some(
    (target) => target.kind === kind && target.slug === slug,
  );
}

/** New sources are inserted only by the bounded staging mutation below. */
export function isOlderSafety2026SourceTarget(sourceId: string): boolean {
  return OLDER_SAFETY_2026_STAGED_SOURCES.some((source) => source.sourceId === sourceId);
}

if (OLDER_SAFETY_2026_TARGETS.length !== 9
  || new Set(OLDER_SAFETY_2026_TARGETS.map((target) => target.slug)).size !== 9
  || AAP_DROWNING_2021_INITIAL_REVERSE_KEYS.length !== 33
  || AAP_DROWNING_2021_DESIRED_REVERSE_KEYS.length !== 24
  || OLDER_SAFETY_2026_STAGED_SOURCES.length !== 3
  || OLDER_SAFETY_2026_TARGETS.some((target) =>
    target.contentInitialReviewRevision < 1
    || target.initialSourceIds[0] !== AAP_DROWNING_2021_SOURCE_ID
    || target.desiredSourceIds[0] !== AAP_DROWNING_2026_SOURCE_ID
    || target.desiredSourceIds.includes(AAP_DROWNING_2021_SOURCE_ID))) {
  throw new Error('Older-safety 2026 CAS constants are invalid');
}
