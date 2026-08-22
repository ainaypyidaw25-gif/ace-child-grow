import exactPreimagesJson from './birth2mGrossMotorCasPreimages.json';

export const BIRTH2M_GROSS_MOTOR_CAS_RELEASE_ID =
  '2026-08-22-birth-2m-gross-motor-content-evidence-v1' as const;

export const BIRTH2M_GROSS_MOTOR_REQUIRED_REVISION_4_REVIEWS = [
  'native_myanmar',
  'english',
  'child_development',
  'evidence',
  'safety',
  'clinical',
] as const;

type ExactDocument = Record<string, unknown> & {
  _id: string;
  _creationTime: number;
};

type ExactPreimages = {
  content: ExactDocument;
  link: ExactDocument & {
    createdAt: number;
    kind: string;
    slug: string;
    sourceIds: string[];
    updatedAt: number;
  };
  reviews: ExactDocument[];
  sources: Array<ExactDocument & { sourceId: string }>;
};

export const BIRTH2M_GROSS_MOTOR_PREIMAGE_DOCUMENTS =
  exactPreimagesJson as ExactPreimages;

export const BIRTH2M_GROSS_MOTOR_DESIRED_TITLE_MM =
  'နိုးနေချိန် မှောက်လျက်ထားစဉ် ခေါင်းမော့ထားနိုင်ခြင်း' as const;

export const BIRTH2M_GROSS_MOTOR_DESIRED_TITLE_EN =
  'Holds head up during awake tummy time' as const;

export const BIRTH2M_GROSS_MOTOR_DESIRED_DATA = {
  observeMm:
    'နိုးနေချိန် လူကြီးကြီးကြပ်၍ မှောက်လျက်ထားစဉ် ခေါင်းကို မော့ထားနိုင်ပါသလား။',
  observeEn:
    'Holds the head up during awake, supervised tummy time?',
  whyMm:
    'နိုးနေချိန် လူကြီးကြီးကြပ်၍ မှောက်လျက်ထားစဉ် ခေါင်းကို မော့ထားနိုင်ခြင်းသည် CDC ၂ လ စာရင်းတွင် ပါဝင်သော ကြည့်ရှုနိုင်သည့်အချက် ဖြစ်သည်။',
  whyEn:
    'Holding the head up during awake tummy time is an observation on the CDC 2-month checklist.',
  redMm:
    'အသက် ၂ လတွင် မှောက်လျက်ထားစဉ် ခေါင်းမော့ခြင်း မတွေ့သေးပါက၊ ယခင်တတ်ခဲ့သော ကျွမ်းကျင်မှု ပျောက်ဆုံးပါက သို့မဟုတ် ဖွံ့ဖြိုးမှုအတွက် စိုးရိမ်ပါက ကျန်းမာရေးဝန်ထမ်းနှင့် အမြန်တိုင်ပင်ပါ။ ဤအချက်သည် အောင်/မအောင် စစ်ဆေးချက် သို့မဟုတ် ရောဂါဖော်ထုတ်ချက် မဟုတ်ပါ။',
  redEn:
    'If your baby is not yet holding the head up during tummy time by 2 months, has lost a skill, or you have a developmental concern, speak promptly with a health professional. This is not a pass/fail test or a diagnosis.',
  encouragementMm:
    'ကလေးနိုးနေချိန် လူကြီးက အနီးကပ်ကြီးကြပ်၍ နေ့စဉ် မှောက်လျက်ကစားချိန် အနည်းငယ်စီ ပေးပါ။ အိပ်ချိန်တွင် ကျောပေါ်လှန်အိပ်စေပါ။',
  encouragementEn:
    'Offer short tummy-time moments each day only while the baby is awake and closely supervised. Place the baby on the back for sleep.',
  editorialStatus: 'reference_verified',
  evidenceSummary:
    'The exact CDC 2-month checklist directly lists holding the head up during tummy time and advises acting early for a missed milestone, skill loss, or another concern. The AAP safe-sleep source supports awake supervision and back-to-sleep; this row is not a screening test.',
} as const;

function collectStrings(value: unknown, output: string[]): void {
  if (value == null) return;
  if (typeof value === 'string') {
    output.push(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => collectStrings(entry, output));
    return;
  }
  if (typeof value === 'object') {
    Object.values(value).forEach((entry) => collectStrings(entry, output));
  }
}

function desiredSearchText(): string {
  const content = BIRTH2M_GROSS_MOTOR_PREIMAGE_DOCUMENTS.content;
  const strings = [
    BIRTH2M_GROSS_MOTOR_DESIRED_TITLE_MM,
    BIRTH2M_GROSS_MOTOR_DESIRED_TITLE_EN,
    typeof content.summaryMm === 'string' ? content.summaryMm : '',
    typeof content.summaryEn === 'string' ? content.summaryEn : '',
    ...(Array.isArray(content.tags) ? content.tags.map(String) : []),
  ];
  collectStrings(BIRTH2M_GROSS_MOTOR_DESIRED_DATA, strings);
  return strings.join(' ').toLowerCase();
}

export const BIRTH2M_GROSS_MOTOR_DESIRED_SEARCH_TEXT = desiredSearchText();

const content = BIRTH2M_GROSS_MOTOR_PREIMAGE_DOCUMENTS.content;
const link = BIRTH2M_GROSS_MOTOR_PREIMAGE_DOCUMENTS.link;

export const BIRTH2M_GROSS_MOTOR_TARGET = {
  kind: 'milestone',
  slug: 'ms_birth_2m_gross_motor_1',
  contentId: content._id,
  contentCreationTime: content._creationTime,
  contentInitialCanonicalSha256:
    '7ca38a070a79de2b0a46e4cf425211a0f22374637183926656275bfb7e56bc64',
  contentInitialReviewRevision: 3,
  contentDesiredReviewRevision: 4,
  contentInitialUpdatedAt: 1_786_633_225_519,
  linkId: link._id,
  linkCreationTime: link._creationTime,
  linkCreatedAt: link.createdAt,
  linkInitialUpdatedAt: link.updatedAt,
  linkInitialCanonicalSha256:
    '71f1bdebb390d90b98b191a5d14a457f401b45f97d2e2578a643485d5ec8704a',
  initialSourceIds: [...link.sourceIds],
  desiredSourceIds: [
    'cdc-milestones-2m-2026',
    'aap-safe-sleep-2022',
  ],
} as const;

export type Birth2mGrossMotorExactPreimage = {
  rowId: string;
  creationTime: number;
  exactCanonicalSha256: string;
  document: ExactDocument;
};

export const BIRTH2M_GROSS_MOTOR_CONTENT_PREIMAGE: Birth2mGrossMotorExactPreimage = {
  rowId: content._id,
  creationTime: content._creationTime,
  exactCanonicalSha256: BIRTH2M_GROSS_MOTOR_TARGET.contentInitialCanonicalSha256,
  document: content,
};

export const BIRTH2M_GROSS_MOTOR_LINK_PREIMAGE: Birth2mGrossMotorExactPreimage = {
  rowId: link._id,
  creationTime: link._creationTime,
  exactCanonicalSha256: BIRTH2M_GROSS_MOTOR_TARGET.linkInitialCanonicalSha256,
  document: link,
};

const reviewHashes = [
  'b8ad693314d30c19c85e0156d0614c0a743a6a6bc8373f389945f9ae2c01d8c8',
  '77904b36138fc0bdde2e76877fda7735f6255105d0b1fa102c2e1ac7c9c18f0d',
  'cdd310c364123bc62450814a0e84de947bb8dfc5fafbca85894d5015612164c1',
  '1c6df12348eb670553361569b5d6629159f9e68e9003517687064bbc086d075b',
] as const;

export const BIRTH2M_GROSS_MOTOR_REVIEW_PREIMAGES:
readonly Birth2mGrossMotorExactPreimage[] =
  BIRTH2M_GROSS_MOTOR_PREIMAGE_DOCUMENTS.reviews.map((document, index) => ({
    rowId: document._id,
    creationTime: document._creationTime,
    exactCanonicalSha256: reviewHashes[index] ?? '',
    document,
  }));

const sourceHashes: Record<string, string> = {
  'cdc-milestones-2m-2026':
    '37fbb7ff5d85bf9e410567efdc8780fcaaf17f581e73f616e34567764dc2d82f',
  'aap-safe-sleep-2022':
    '1e0b8da788ec727914131e955abaddb6c7d0c435ca8947bcb654d247779317bc',
};

export type Birth2mGrossMotorSourcePreimage = Birth2mGrossMotorExactPreimage & {
  sourceId: string;
  includedInDesired: boolean;
};

export const BIRTH2M_GROSS_MOTOR_SOURCE_PREIMAGES:
readonly Birth2mGrossMotorSourcePreimage[] =
  BIRTH2M_GROSS_MOTOR_TARGET.desiredSourceIds.map((sourceId) => {
    const document = BIRTH2M_GROSS_MOTOR_PREIMAGE_DOCUMENTS.sources
      .find((candidate) => candidate.sourceId === sourceId);
    if (!document) throw new Error(`Missing gross-motor CAS source fixture: ${sourceId}`);
    return {
    sourceId: document.sourceId,
    rowId: document._id,
    creationTime: document._creationTime,
    exactCanonicalSha256: sourceHashes[document.sourceId] ?? '',
    document,
    includedInDesired: true,
    };
  });

/** Production has no database-backed media for this target. */
export const BIRTH2M_GROSS_MOTOR_MEDIA_PREIMAGES:
readonly Birth2mGrossMotorExactPreimage[] = [];

const desiredIds: string[] = [...BIRTH2M_GROSS_MOTOR_TARGET.desiredSourceIds];
const fixtureSourceIds = BIRTH2M_GROSS_MOTOR_SOURCE_PREIMAGES.map((row) => row.sourceId);
if (content.slug !== BIRTH2M_GROSS_MOTOR_TARGET.slug
  || content.type !== BIRTH2M_GROSS_MOTOR_TARGET.kind
  || content.reviewRevision !== BIRTH2M_GROSS_MOTOR_TARGET.contentInitialReviewRevision
  || content.updatedAt !== BIRTH2M_GROSS_MOTOR_TARGET.contentInitialUpdatedAt
  || link.slug !== BIRTH2M_GROSS_MOTOR_TARGET.slug
  || link.kind !== BIRTH2M_GROSS_MOTOR_TARGET.kind
  || BIRTH2M_GROSS_MOTOR_TARGET.contentDesiredReviewRevision
    !== BIRTH2M_GROSS_MOTOR_TARGET.contentInitialReviewRevision + 1
  || BIRTH2M_GROSS_MOTOR_REVIEW_PREIMAGES.length !== 4
  || new Set(BIRTH2M_GROSS_MOTOR_REVIEW_PREIMAGES.map((row) => row.rowId)).size !== 4
  || desiredIds.length !== 2
  || !desiredIds.every((sourceId, index) => sourceId === fixtureSourceIds[index])
  || BIRTH2M_GROSS_MOTOR_SOURCE_PREIMAGES.some((row) => !row.exactCanonicalSha256)) {
  throw new Error('Birth-to-2-month gross-motor CAS constants are invalid');
}

/** Permanently protects the audited content row from broad seed imports. */
export function isBirth2mGrossMotorCasTargetSlug(slug: string): boolean {
  return slug === BIRTH2M_GROSS_MOTOR_TARGET.slug;
}

/** Permanently protects the audited evidence edge from broad link imports. */
export function isBirth2mGrossMotorCasTarget(kind: string, slug: string): boolean {
  return kind === BIRTH2M_GROSS_MOTOR_TARGET.kind
    && slug === BIRTH2M_GROSS_MOTOR_TARGET.slug;
}
