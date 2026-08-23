import exactPreimagesJson from './clinicalBlockerCasPreimages.json';

export const GD_BIRTH2M_EMOTIONAL_RELEASE_ID =
  '2026-08-23-birth-2m-emotional-tier-evidence-v1' as const;
export const UNICEF_SEEN_COUNTED_METADATA_RELEASE_ID =
  '2026-08-23-unicef-seen-counted-metadata-v1' as const;
export const CLINICAL_BLOCKER_FIXTURE_SHA256 =
  '7be25a3a8db6881242e3c259dd924a0b8042cd0ee7f51024c35575734b1ddbe4' as const;

type ExactDocument = Record<string, unknown> & {
  _id: string;
  _creationTime: number;
};

type SourceDocument = ExactDocument & {
  sourceId: string;
  createdAt: number;
  updatedAt: number;
};

type LinkDocument = ExactDocument & {
  kind: string;
  slug: string;
  sourceIds: string[];
  createdAt: number;
  updatedAt: number;
};

type ContentDocument = ExactDocument & {
  type: string;
  slug: string;
  reviewRevision: number;
  updatedAt: number;
  data: Record<string, unknown>;
};

type ExactPreimages = {
  frozenFrom: {
    deployment: string;
    queriedOn: string;
    gitBase: string;
  };
  gdBirth2mEmotional: {
    content: ContentDocument;
    link: LinkDocument;
    sources: SourceDocument[];
    reviews: ExactDocument[];
    media: ExactDocument[];
    aiContentAudits: ExactDocument[];
    aiPublicationReleases: ExactDocument[];
  };
  unicefSeenCountedIncluded: {
    source: SourceDocument;
    contents: ContentDocument[];
    links: LinkDocument[];
    reviews: ExactDocument[];
    media: ExactDocument[];
    aiContentAudits: ExactDocument[];
    aiPublicationReleases: ExactDocument[];
  };
};

export const CLINICAL_BLOCKER_PREIMAGES = exactPreimagesJson as ExactPreimages;

export type ClinicalBlockerExactPreimage = {
  rowId: string;
  creationTime: number;
  exactCanonicalSha256: string;
  document: ExactDocument;
};

function preimage(
  document: ExactDocument,
  exactCanonicalSha256: string,
): ClinicalBlockerExactPreimage {
  return {
    rowId: document._id,
    creationTime: document._creationTime,
    exactCanonicalSha256,
    document,
  };
}

const gd = CLINICAL_BLOCKER_PREIMAGES.gdBirth2mEmotional;

export const GD_BIRTH2M_EMOTIONAL_REQUIRED_REVISION_3_REVIEWS = [
  'native_myanmar',
  'english',
  'child_development',
  'evidence',
  'safety',
  'clinical',
] as const;

export const NHS_SOOTHING_CRYING_BABY_SOURCE_ID =
  'nhs-soothing-crying-baby-2026' as const;

export const NHS_SOOTHING_CRYING_BABY_DESIRED = {
  sourceId: NHS_SOOTHING_CRYING_BABY_SOURCE_ID,
  org: 'National Health Service (UK)',
  orgKey: 'NHS',
  title: 'Soothing a crying baby',
  authors: null,
  year: 2026,
  edition: 'Page last reviewed: 22 April 2026; Next review due: 22 April 2029',
  country: 'United Kingdom',
  language: 'en',
  url: 'https://www.nhs.uk/baby/caring-for-a-newborn/soothing-a-crying-baby/',
  doi: null,
  isbn: null,
  pmid: null,
  evidenceLevel: 'parent_education',
  reviewStatus: 'awaiting_review',
  reviewer: null,
  reviewDate: null,
  nextReviewDate: '2029-04-22',
  keywords: ['crying baby', 'feeding', 'projectile vomiting', 'floppy', 'difficulty breathing'],
  topics: ['parenting', 'safety'],
  ageMonthsMin: 0,
  ageMonthsMax: 5,
  verifiedOn: '2026-08-23',
  verifiedNote:
    'NHS page prints this title, “Page last reviewed: 22 April 2026” and “Next review due: 22 April 2029”. It advises contacting a GP or NHS 111 when a crying baby seems unwell, has a high temperature or is not interested in feeding, and calling emergency services for seizure, abnormal colour, unresponsiveness or floppiness, difficulty breathing, or repeated projectile vomiting.',
  searchText:
    'national health service (uk) soothing a crying baby  https://www.nhs.uk/baby/caring-for-a-newborn/soothing-a-crying-baby/   crying baby feeding projectile vomiting floppy difficulty breathing parenting safety',
} as const;

export const GD_BIRTH2M_EMOTIONAL_DESIRED_SECOND_FAQ_ANSWER = {
  mm: 'ပထမလများတွင် ငိုချိန် များခြင်းသည် တွေ့ရလေ့ရှိသည်။ ကလေး နို့မစို့လိုပါက၊ အဆက်မပြတ် ငိုပြီး နှစ်သိမ့်၍ သို့မဟုတ် အာရုံလွှဲ၍ မရပါက၊ သို့မဟုတ် ငိုသံသည် ပုံမှန်ငိုသံနှင့် မတူပါက အကြံဉာဏ်ရယူရန် ကျန်းမာရေးဝန်ထမ်းထံ ဆက်သွယ်ပါ။ ကလေး ပျော့ခွေခြင်း သို့မဟုတ် နိုးရခက်ခြင်း၊ အသက်ရှူခက်ခြင်း၊ အသားအရေ သို့မဟုတ် နှုတ်ခမ်း အပြာရောင်၊ မီးခိုးရောင်၊ ဖြူဖျော့ရောင် သို့မဟုတ် အစက်အပြောက် ဖြစ်ခြင်း၊ တက်ခြင်း သို့မဟုတ် အပြင်းအထန် ပန်းထွက်အန်ခြင်း များစွာ ဖြစ်ပါက အရေးပေါ်ဝန်ဆောင်မှုကို ချက်ချင်း ခေါ်ပါ။',
  en: 'Increased crying in the early months is common. If your baby is not interested in feeding, is crying constantly and cannot be consoled or distracted, or their cry does not sound normal, contact a health professional for advice. Call emergency services now if your baby is floppy or hard to wake, has difficulty breathing, has blue, grey, pale or blotchy skin or lips, has a seizure, or is being violently sick a lot (projectile vomiting).',
} as const;

export const GD_BIRTH2M_EMOTIONAL_DESIRED_EVIDENCE_SUMMARY =
  'Responsive soothing follows the WHO nurturing care framework and AAP relational-health guidance. The NHS “Soothing a crying baby” page supports the never-shake message, advice to contact a health professional for constant, inconsolable or unusual crying or not being interested in feeding, and emergency action for floppiness, difficulty waking, breathing difficulty, abnormal colour, seizures or being violently sick a lot (projectile vomiting). NICE NG143 supports urgent face-to-face assessment when a baby under 3 months has a temperature of 38°C or above.' as const;

function desiredGdData(): Record<string, unknown> {
  const data = gd.content.data;
  const faq = data.faq as Array<Record<string, unknown>>;
  if (!Array.isArray(faq) || faq.length !== 3) {
    throw new Error('Birth-to-2-month emotional FAQ preimage is invalid');
  }
  return {
    ...data,
    evidenceSummary: GD_BIRTH2M_EMOTIONAL_DESIRED_EVIDENCE_SUMMARY,
    faq: faq.map((row, index) => index === 1
      ? { ...row, a: GD_BIRTH2M_EMOTIONAL_DESIRED_SECOND_FAQ_ANSWER }
      : row),
  };
}

export const GD_BIRTH2M_EMOTIONAL_DESIRED_DATA = desiredGdData();

const initialSecondFaqAnswer = (
  (gd.content.data.faq as Array<{ a: { en: string; mm: string } }>)[1].a
);
const initialEvidenceSummary = String(gd.content.data.evidenceSummary);
export const GD_BIRTH2M_EMOTIONAL_DESIRED_SEARCH_TEXT = String(gd.content.searchText)
  .replace(
    `${initialSecondFaqAnswer.mm} ${initialSecondFaqAnswer.en}`.toLowerCase(),
    `${GD_BIRTH2M_EMOTIONAL_DESIRED_SECOND_FAQ_ANSWER.mm} ${GD_BIRTH2M_EMOTIONAL_DESIRED_SECOND_FAQ_ANSWER.en}`
      .toLowerCase(),
  )
  .replace(
    initialEvidenceSummary.toLowerCase(),
    GD_BIRTH2M_EMOTIONAL_DESIRED_EVIDENCE_SUMMARY.toLowerCase(),
  );

export const GD_BIRTH2M_EMOTIONAL_TARGET = {
  kind: 'guide',
  slug: 'gd_birth_2m_emotional',
  contentId: gd.content._id,
  contentCreationTime: gd.content._creationTime,
  contentInitialCanonicalSha256:
    '5e98999a15a128ab7ae852c7ea7b7e3056b08ca281152b9d2ca69822ed4025bf',
  contentInitialReviewRevision: 2,
  contentDesiredReviewRevision: 3,
  contentInitialUpdatedAt: gd.content.updatedAt,
  linkId: gd.link._id,
  linkCreationTime: gd.link._creationTime,
  linkCreatedAt: gd.link.createdAt,
  linkInitialUpdatedAt: gd.link.updatedAt,
  linkInitialCanonicalSha256:
    'e580b6394a63feaf2fcc3632abf5c514cf0732e199cf572cdf549dc3ff345723',
  initialSourceIds: [...gd.link.sourceIds],
  desiredSourceIds: [
    'aap-toxic-stress-2021',
    'who-nurturing-care-2018',
    NHS_SOOTHING_CRYING_BABY_SOURCE_ID,
    'nice-ng143-fever-2019',
  ],
} as const;

export const GD_BIRTH2M_EMOTIONAL_CONTENT_PREIMAGE = preimage(
  gd.content,
  GD_BIRTH2M_EMOTIONAL_TARGET.contentInitialCanonicalSha256,
);
export const GD_BIRTH2M_EMOTIONAL_LINK_PREIMAGE = preimage(
  gd.link,
  GD_BIRTH2M_EMOTIONAL_TARGET.linkInitialCanonicalSha256,
);

const gdSourceHashes: Record<string, string> = {
  'aap-toxic-stress-2021':
    '74ee529df62d927e57aaaa7075a2cdda097049343ef71ca47ac9cf9a7314be62',
  'who-nurturing-care-2018':
    '0b66b3fa5fb7d79205b69be647aea4cd0315a6ed6cd1f7c239e10928f88e8de0',
  'nhs-child-accident-2025':
    '5ead8b65b786b9f75d76f0af96cb30849f7ad3b99072092444f73e78dd87b303',
  'nice-ng143-fever-2019':
    'cdc239b7f1fc349efc8808426614fb53db62fbb75b59c2e5f677f12ecee3c6cc',
};
export const GD_BIRTH2M_EMOTIONAL_SOURCE_PREIMAGES = gd.sources.map((document) => ({
  sourceId: document.sourceId,
  ...preimage(document, gdSourceHashes[document.sourceId] ?? ''),
}));

const gdReviewHashes = [
  '8670def8ee64048d0c69c798448c1b1a44bb105cfc87677341da38cc03d6d1cb',
  'd88607bf35816106e8f101efd0b4ae755ab2665aef1ab4bac6d877bd02121e23',
] as const;
export const GD_BIRTH2M_EMOTIONAL_REVIEW_PREIMAGES = gd.reviews.map(
  (document, index) => preimage(document, gdReviewHashes[index] ?? ''),
);
export const GD_BIRTH2M_EMOTIONAL_MEDIA_PREIMAGES = gd.media.map(
  (document) => preimage(document, ''),
);

const unicef = CLINICAL_BLOCKER_PREIMAGES.unicefSeenCountedIncluded;
export const UNICEF_SEEN_COUNTED_SOURCE_ID =
  'unicef-seen-counted-included-2022' as const;
export const UNICEF_SEEN_COUNTED_SOURCE_PREIMAGE = preimage(
  unicef.source,
  'bef057e350253b7422517ecfec7148574115926b8ed4727af49956d8adc29a7e',
);
export const UNICEF_SEEN_COUNTED_DESIRED_METADATA = {
  year: 2021,
  verifiedOn: '2026-08-23',
  verifiedNote:
    'The UNICEF report PDF prints the title, “© United Nations Children’s Fund (UNICEF), Division of Data, Analytics, Planning and Monitoring, November 2021” and a suggested citation ending “UNICEF, New York, 2021.” No ISBN is printed on the resource page or PDF, so isbn is null. The stable legacy source id retains its 2022 suffix.',
  reviewStatus: 'awaiting_review',
  reviewer: null,
  reviewDate: null,
  nextReviewDate: null,
} as const;

const unicefContentHashes: Record<string, string> = {
  lsn_special_needs_awareness:
    'df8e7c4eb0d8cca86601520275c3a3045ffae6689359e383fe175e15e07166a8',
  sn_learning_disability:
    '4590807f73ce3b0b19843ca863a58c4c0824cd02aae0c483e7d3cf1f560a4aed',
};
const unicefLinkHashes: Record<string, string> = {
  lsn_special_needs_awareness:
    '0691d78ed22190c93ecb93a778166615ba3cc334c36842b80a751496d938e4cb',
  sn_learning_disability:
    '0bc63cc490f144177e8e8e9484be989a9dabc466e6bc6f5537e8425fdf279efb',
};
const unicefReviewHashes = [
  '300584031c0f9b5842ff725f9aff19b3fb0b98a710f4b94d6a6fd0f0b5299dac',
  'd0a17a3b04081c503e7ffdcb8833bdbabc55ae8e1b281fd1597543c656cbb1f6',
  '0fee6304d2d6582c16da863b565cb3408f5268ee7fac1ea7130371fb665d7264',
] as const;
const unicefMediaHashes = [
  '072310f8da5666a28762767e1845280c0c318260fc29b326762ce6ec7157c86f',
  '0e18919bde6e173faef946025284a7935780255141c0f789d03aadd41b95feeb',
] as const;

export const UNICEF_SEEN_COUNTED_CONTENT_PREIMAGES = unicef.contents.map(
  (document) => preimage(document, unicefContentHashes[document.slug] ?? ''),
);
export const UNICEF_SEEN_COUNTED_LINK_PREIMAGES = unicef.links.map(
  (document) => preimage(document, unicefLinkHashes[document.slug] ?? ''),
);
export const UNICEF_SEEN_COUNTED_REVIEW_PREIMAGES = unicef.reviews.map(
  (document, index) => preimage(document, unicefReviewHashes[index] ?? ''),
);
export const UNICEF_SEEN_COUNTED_MEDIA_PREIMAGES = unicef.media.map(
  (document, index) => preimage(document, unicefMediaHashes[index] ?? ''),
);
export const UNICEF_SEEN_COUNTED_REVERSE_KEYS = [
  'lesson:lsn_special_needs_awareness',
  'special_need:sn_learning_disability',
] as const;

if (gd.content.slug !== GD_BIRTH2M_EMOTIONAL_TARGET.slug
  || gd.content.type !== GD_BIRTH2M_EMOTIONAL_TARGET.kind
  || gd.content.reviewRevision !== 2
  || gd.link.slug !== GD_BIRTH2M_EMOTIONAL_TARGET.slug
  || gd.reviews.length !== 2
  || gd.media.length !== 0
  || gd.aiContentAudits.length !== 0
  || gd.aiPublicationReleases.length !== 0
  || GD_BIRTH2M_EMOTIONAL_SOURCE_PREIMAGES.some((row) => !row.exactCanonicalSha256)
  || unicef.source.sourceId !== UNICEF_SEEN_COUNTED_SOURCE_ID
  || unicef.contents.length !== 2
  || unicef.links.length !== 2
  || unicef.contents.find((row) => row.slug === 'lsn_special_needs_awareness')?.reviewRevision !== 2
  || unicef.aiContentAudits.length !== 0
  || unicef.aiPublicationReleases.length !== 0
  || [...UNICEF_SEEN_COUNTED_CONTENT_PREIMAGES,
    ...UNICEF_SEEN_COUNTED_LINK_PREIMAGES,
    ...UNICEF_SEEN_COUNTED_REVIEW_PREIMAGES,
    ...UNICEF_SEEN_COUNTED_MEDIA_PREIMAGES]
    .some((row) => !row.exactCanonicalSha256)) {
  throw new Error('Clinical blocker CAS constants are invalid');
}

export function isGdBirth2mEmotionalCasContentSlug(slug: string): boolean {
  return slug === GD_BIRTH2M_EMOTIONAL_TARGET.slug;
}

export function isGdBirth2mEmotionalCasLink(kind: string, slug: string): boolean {
  return kind === GD_BIRTH2M_EMOTIONAL_TARGET.kind
    && slug === GD_BIRTH2M_EMOTIONAL_TARGET.slug;
}

export function isClinicalBlockerCasSource(sourceId: string): boolean {
  return sourceId === NHS_SOOTHING_CRYING_BABY_SOURCE_ID
    || sourceId === UNICEF_SEEN_COUNTED_SOURCE_ID;
}

export function isUnicefSeenCountedConsumer(kind: string, slug: string): boolean {
  return UNICEF_SEEN_COUNTED_REVERSE_KEYS.includes(
    `${kind}:${slug}` as (typeof UNICEF_SEEN_COUNTED_REVERSE_KEYS)[number],
  );
}

export function isUnicefSeenCountedConsumerSlug(slug: string): boolean {
  return slug === 'lsn_special_needs_awareness' || slug === 'sn_learning_disability';
}
