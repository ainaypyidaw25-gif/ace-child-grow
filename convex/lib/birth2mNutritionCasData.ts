import exactPreimagesJson from './birth2mNutritionCasPreimages.json';

export const BIRTH2M_NUTRITION_CAS_RELEASE_ID =
  '2026-08-22-birth-2m-nutrition-content-evidence-v1' as const;

export const BIRTH2M_NUTRITION_REQUIRED_REVISION_3_REVIEWS = [
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

export const BIRTH2M_NUTRITION_PREIMAGE_DOCUMENTS =
  exactPreimagesJson as ExactPreimages;

export const BIRTH2M_NUTRITION_DESIRED_DATA = {
  observeMm:
    'ငိုမည့်အရင် ပါးစပ်လှုပ်ခြင်း၊ လက်ကို စုပ်ခြင်း၊ ရင်ဘတ်ဘက် လှည့်ရှာခြင်း ရှိပါသလား။ မွေးပြီး ပထမ ၂၄ နာရီ ကျော်လွန်ပြီးနောက်၊ မိခင်နို့တိုက်ကျွေးနေသော ပထမရက်သတ္တပတ်များတွင် ၂၄ နာရီအတွင်း အများအားဖြင့် အနည်းဆုံး ၈ ကြိမ် နို့စို့ပါသလား။',
  observeEn:
    'Before crying, does your baby mouth, suck hands, or turn to root? After the first day, if breastfeeding in the early weeks, does your baby usually feed at least 8 times in 24 hours?',
  whyMm:
    'မွေးကင်းစကလေးများသည် အစာအိမ် သေးငယ်သဖြင့် မကြာခဏ စို့ရသည်။ ဆာလောင်လက္ခဏာအလိုက် တိုက်ကျွေးခြင်းက နို့ထွက်မှုကို ကူညီပြီး နှစ်ဦးစလုံးအတွက် လွယ်ကူစေသည်။',
  whyEn:
    'Newborn stomachs are small, so feeds are frequent. Feeding on cue supports milk supply and makes feeding easier for both of you.',
  redMm:
    'ဆီးစိုသော အနှီး သိသိသာသာ လျော့နည်းခြင်း သို့မဟုတ် နို့စို့အားနည်းလာခြင်းရှိပါက ကျန်းမာရေးဝန်ထမ်းထံ အမြန်ဆုံး စစ်ဆေးမှုခံယူပါ။ မွေးပြီးနောက် အစောပိုင်းရက်များတွင် မွေးချိန်ကိုယ်အလေးချိန်၏ ၁၀% ကျော် လျော့ခြင်း သို့မဟုတ် အသက် ၃ ပတ်အထိ မွေးချိန်ကိုယ်အလေးချိန် ပြန်မရခြင်းကိုလည်း ကျန်းမာရေးဝန်ထမ်းက စစ်ဆေးသင့်ပါသည်။',
  redEn:
    'If wet nappies are markedly fewer or feeding becomes weak, seek prompt assessment by a health worker. Weight loss of more than 10% of birth weight in the early days after birth, or not regaining birth weight by 3 weeks, should also be assessed by a health worker.',
  encouragementMm:
    'အသက် ၆ လအထိ မိခင်နို့တစ်မျိုးတည်း တိုက်ကျွေးရန် အကြံပြုထားသည်။ အခက်အခဲရှိပါက နို့တိုက်အကြံပေး အကူအညီ ရယူပါ။',
  encouragementEn:
    'Exclusive breastfeeding is recommended for about the first 6 months; ask for breastfeeding counselling support if it is hard.',
  editorialStatus: 'reference_verified',
  evidenceSummary:
    'WHO’s 2025 infant-feeding chapter supports early feeding cues, responsive breastfeeding and frequent breastfeeding in the early weeks, while noting that feeding can be less frequent in the first day or two. NICE NG194 supports feeding assessment including feed frequency, wet nappies and weight change. NICE NG247 supports reassessment after loss of more than 10% of birth weight in the early days; NICE NG75 directly supports clinical assessment at that threshold and review when birth weight has not been regained by 3 weeks.',
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
  const content = BIRTH2M_NUTRITION_PREIMAGE_DOCUMENTS.content;
  const strings = [
    String(content.titleMm),
    String(content.titleEn),
    typeof content.summaryMm === 'string' ? content.summaryMm : '',
    typeof content.summaryEn === 'string' ? content.summaryEn : '',
    ...(Array.isArray(content.tags) ? content.tags.map(String) : []),
  ];
  collectStrings(BIRTH2M_NUTRITION_DESIRED_DATA, strings);
  return strings.join(' ').toLowerCase();
}

export const BIRTH2M_NUTRITION_DESIRED_SEARCH_TEXT = desiredSearchText();

const content = BIRTH2M_NUTRITION_PREIMAGE_DOCUMENTS.content;
const link = BIRTH2M_NUTRITION_PREIMAGE_DOCUMENTS.link;

export const BIRTH2M_NUTRITION_TARGET = {
  kind: 'milestone',
  slug: 'ms_birth_2m_nutrition_1',
  contentId: content._id,
  contentCreationTime: content._creationTime,
  contentInitialCanonicalSha256:
    '568bdaf6faea146c0e2ab06f02073637a61664877e36523457c76101961fdcf3',
  contentInitialReviewRevision: 2,
  contentDesiredReviewRevision: 3,
  contentInitialUpdatedAt: 1_786_878_082_931,
  linkId: link._id,
  linkCreationTime: link._creationTime,
  linkCreatedAt: link.createdAt,
  linkInitialUpdatedAt: link.updatedAt,
  linkInitialCanonicalSha256:
    'b670f98806d7ba946beaefdf9bc47ac484088473dc1170e89eac209bc7a2038d',
  initialSourceIds: [...link.sourceIds],
  desiredSourceIds: [
    'who-iycf-model-chapter-2025',
    'nice-ng194-postnatal-2021',
    'nice-ng247-maternal-child-nutrition-2025',
    'nice-ng75-faltering-growth-2017',
  ],
} as const;

export type Birth2mNutritionExactPreimage = {
  rowId: string;
  creationTime: number;
  exactCanonicalSha256: string;
  document: ExactDocument;
};

export const BIRTH2M_NUTRITION_CONTENT_PREIMAGE: Birth2mNutritionExactPreimage = {
  rowId: content._id,
  creationTime: content._creationTime,
  exactCanonicalSha256: BIRTH2M_NUTRITION_TARGET.contentInitialCanonicalSha256,
  document: content,
};

export const BIRTH2M_NUTRITION_LINK_PREIMAGE: Birth2mNutritionExactPreimage = {
  rowId: link._id,
  creationTime: link._creationTime,
  exactCanonicalSha256: BIRTH2M_NUTRITION_TARGET.linkInitialCanonicalSha256,
  document: link,
};

const reviewHashes = [
  '09a3e05295fb1e52cdf1cf422de0275774a16a7e8fb268200051865896c9a4c5',
  'e97ae6c507ff58689606b2c5a191a8bdf00e7fbb98ae98b21bd3bd251f7bacf6',
  '3bef6350a12a3e1e74cdfb9cfb3f0c516b43caee8c5508514b6d5e9fb5b04954',
  '0734cbb5b482ebaf70478247add9a5a32d71d988b196ebf0a9ca5239d05e1d6a',
  'd2799837e15f0a3717e8c2d626b15677e49d55561f2660323a9b14c42eeb029e',
] as const;

export const BIRTH2M_NUTRITION_REVIEW_PREIMAGES:
readonly Birth2mNutritionExactPreimage[] =
  BIRTH2M_NUTRITION_PREIMAGE_DOCUMENTS.reviews.map((document, index) => ({
    rowId: document._id,
    creationTime: document._creationTime,
    exactCanonicalSha256: reviewHashes[index] ?? '',
    document,
  }));

const sourceHashes: Record<string, string> = {
  'who-iycf-model-chapter-2025':
    '6c33d47ded861ab16cc936e9e10a9bc2989b28c449f0e6a4958d198bead699c8',
  'nice-ng194-postnatal-2021':
    '83660f5a4db4df981cd4e26912a929037b71c01e72d914f15f829e40f4fb320b',
  'nice-ng247-maternal-child-nutrition-2025':
    '6d60235b8b68324a9d1faf663bb36a3cfdd1943ec5a6ae430aa978eb449d4c2a',
  'nice-ng75-faltering-growth-2017':
    '50a742561af4a28202eb8470608dc503dc45a62bb9e7eb7c25ff64f9b52cc611',
};

export type Birth2mNutritionSourcePreimage = Birth2mNutritionExactPreimage & {
  sourceId: string;
  includedInDesired: boolean;
};

export const BIRTH2M_NUTRITION_SOURCE_PREIMAGES:
readonly Birth2mNutritionSourcePreimage[] =
  BIRTH2M_NUTRITION_TARGET.desiredSourceIds.map((sourceId) => {
    const document = BIRTH2M_NUTRITION_PREIMAGE_DOCUMENTS.sources
      .find((candidate) => candidate.sourceId === sourceId);
    if (!document) throw new Error(`Missing nutrition CAS source fixture: ${sourceId}`);
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
export const BIRTH2M_NUTRITION_MEDIA_PREIMAGES:
readonly Birth2mNutritionExactPreimage[] = [];

const desiredIds: string[] = [...BIRTH2M_NUTRITION_TARGET.desiredSourceIds];
const fixtureSourceIds = BIRTH2M_NUTRITION_SOURCE_PREIMAGES.map((row) => row.sourceId);
if (content.slug !== BIRTH2M_NUTRITION_TARGET.slug
  || content.type !== BIRTH2M_NUTRITION_TARGET.kind
  || content.reviewRevision !== BIRTH2M_NUTRITION_TARGET.contentInitialReviewRevision
  || content.updatedAt !== BIRTH2M_NUTRITION_TARGET.contentInitialUpdatedAt
  || link.slug !== BIRTH2M_NUTRITION_TARGET.slug
  || link.kind !== BIRTH2M_NUTRITION_TARGET.kind
  || BIRTH2M_NUTRITION_TARGET.contentDesiredReviewRevision
    !== BIRTH2M_NUTRITION_TARGET.contentInitialReviewRevision + 1
  || BIRTH2M_NUTRITION_REVIEW_PREIMAGES.length !== 5
  || new Set(BIRTH2M_NUTRITION_REVIEW_PREIMAGES.map((row) => row.rowId)).size !== 5
  || desiredIds.length !== 4
  || !desiredIds.every((sourceId, index) => sourceId === fixtureSourceIds[index])
  || BIRTH2M_NUTRITION_SOURCE_PREIMAGES.some((row) => !row.exactCanonicalSha256)) {
  throw new Error('Birth-to-2-month nutrition CAS constants are invalid');
}

/** Permanently protects the audited content row from broad seed imports. */
export function isBirth2mNutritionCasTargetSlug(slug: string): boolean {
  return slug === BIRTH2M_NUTRITION_TARGET.slug;
}

/** Permanently protects the audited evidence edge from broad link imports. */
export function isBirth2mNutritionCasTarget(kind: string, slug: string): boolean {
  return kind === BIRTH2M_NUTRITION_TARGET.kind
    && slug === BIRTH2M_NUTRITION_TARGET.slug;
}
