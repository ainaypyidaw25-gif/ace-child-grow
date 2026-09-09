export const NUTRITION_GUIDES_CAS_RELEASE_ID =
  '2026-08-24-infant-nutrition-guides-evidence-v1' as const;

export const NUTRITION_GUIDES_SOURCE_STAGE_RELEASE_ID =
  '2026-08-24-infant-nutrition-sources-stage-v1' as const;

export const NUTRITION_GUIDES_REQUIRED_REVIEW_DIMENSIONS = [
  'native_myanmar',
  'english',
  'child_development',
  'evidence',
  'safety',
  'clinical',
] as const;

export const NUTRITION_GUIDES_NEW_SOURCE_IDS = [
  'cdc-introduce-solid-foods-2026',
  'jr-niaid-peanut-prevention-2017',
] as const;

export type NutritionGuideCasTarget = {
  kind: 'guide';
  slug: string;
  contentId: string;
  contentCreationTime: number;
  contentInitialCanonicalSha256: string;
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
  reviews: readonly {
    rowId: string;
    creationTime: number;
    exactCanonicalSha256: string;
  }[];
};

export const NUTRITION_GUIDES_CAS_TARGETS: readonly NutritionGuideCasTarget[] = [
  {
    kind: 'guide',
    slug: 'gd_5_6m_nutrition',
    contentId: 'kx7bx9ekynhhsd4h402vafbc158b8v4c',
    contentCreationTime: 1_785_024_282_947.1875,
    contentInitialCanonicalSha256:
      '206c402308ab8b7c3f7251134cb6e2084d1dbd0040d202de402c5667f8189b62',
    contentInitialReviewRevision: 7,
    contentDesiredReviewRevision: 8,
    contentInitialUpdatedAt: 1_786_432_330_925,
    linkId: 'k97e1e8ksvz9a78k8p72krxkfd8b8dkn',
    linkCreationTime: 1_785_024_331_625.8174,
    linkCreatedAt: 1_785_024_331_625,
    linkInitialUpdatedAt: 1_787_359_998_883,
    linkInitialCanonicalSha256:
      'b2dbbd30f7e97958e46909022d9447bf6c53eec12244ac15df3c775a7f4c1e00',
    initialSourceIds: [
      'who-complementary-feeding-2023',
      'nhs-first-solid-foods-2026',
      'cdc-foods-6-24m-2025',
      'who-iycf-model-chapter-2025',
      'aap-breastfeeding-2022',
      'nhs-breastfeeding-first-days-2023',
      'asha-pediatric-feeding-swallowing',
      'hc-child-ems-2026',
    ],
    desiredSourceIds: [
      'who-complementary-feeding-2023',
      'nhs-first-solid-foods-2026',
      'cdc-introduce-solid-foods-2026',
      'cdc-cows-milk-2026',
      'jr-niaid-peanut-prevention-2017',
      'who-iycf-model-chapter-2025',
      'aap-breastfeeding-2022',
      'nhs-breastfeeding-first-days-2023',
      'asha-pediatric-feeding-swallowing',
      'hc-child-ems-2026',
    ],
    reviews: [
      { rowId: 'nn71qc7ctzq3fntdbv8nw7b0xx8bsnz0', creationTime: 1_785_765_389_605.6858, exactCanonicalSha256: '4f998f17187aa45c4625184a8c4fbc3734fc501cd41f2ba98867b60616859c55' },
      { rowId: 'nn7adv98161xvqmwc5kavcwn318bryb2', creationTime: 1_785_765_393_363.958, exactCanonicalSha256: '5676045d7b9cc10a663ff14ef935794e3478e2ba593b13718a72ec93b2c70e6d' },
      { rowId: 'nn7bxzegrgqjde2hyh9p0snnzh8brwm5', creationTime: 1_785_765_396_496.211, exactCanonicalSha256: '68533ae93798273fd0bfcd649a1df380acb4e7f88ca80814e9a1d1e72ce0b1ae' },
    ],
  },
  {
    kind: 'guide',
    slug: 'gd_7_9m_nutrition',
    contentId: 'kx71qtfeq7fys6a82hwaa49c698b9t7b',
    contentCreationTime: 1_785_024_282_947.2598,
    contentInitialCanonicalSha256:
      '597edd36536732ae3fc1580c952c97aaac3c400d23cdb1d78730525187723aeb',
    contentInitialReviewRevision: 2,
    contentDesiredReviewRevision: 3,
    contentInitialUpdatedAt: 1_786_432_330_925,
    linkId: 'k97f1zqfdv1gzfkyjqh7y396518b95n4',
    linkCreationTime: 1_785_024_331_625.857,
    linkCreatedAt: 1_785_024_331_625,
    linkInitialUpdatedAt: 1_785_024_331_625,
    linkInitialCanonicalSha256:
      '6a4aa421c31a900b8bfb87e456f74c92a5855dfb88f67f6780d7fc4bdf8e8d4f',
    initialSourceIds: [
      'who-complementary-feeding-2023',
      'who-iycf-model-chapter-2025',
      'who-iycf-indicators-2021',
      'nhs-first-solid-foods-2026',
      'cdc-foods-6-24m-2025',
      'nice-ng247-maternal-child-nutrition-2025',
      'asha-pediatric-feeding-swallowing',
    ],
    desiredSourceIds: [
      'who-complementary-feeding-2023',
      'who-iycf-model-chapter-2025',
      'who-iycf-indicators-2021',
      'nhs-first-solid-foods-2026',
      'cdc-foods-6-24m-2025',
      'cdc-introduce-solid-foods-2026',
      'jr-niaid-peanut-prevention-2017',
      'nice-ng247-maternal-child-nutrition-2025',
      'asha-pediatric-feeding-swallowing',
    ],
    reviews: [
      { rowId: 'nn7cwek61x3q9656a42bjcfdjd8bwfp5', creationTime: 1_785_903_104_148.7136, exactCanonicalSha256: '6f380b1760eab4fb9234aab61e5ba67f28f54d2481e7350c3079f28898882769' },
      { rowId: 'nn75gvn21hsmvdmbaj9d5tp0d18bwj16', creationTime: 1_785_903_107_455.623, exactCanonicalSha256: '50b4bd70ff53862f25f6b9e8918b44a9c404a1c4a8763ab39fd074483c94aabf' },
    ],
  },
  {
    kind: 'guide',
    slug: 'gd_10_12m_nutrition',
    contentId: 'kx74xr1h9rtms2dk7j6gkdyted8b8cfy',
    contentCreationTime: 1_785_024_282_947.27,
    contentInitialCanonicalSha256:
      '155ab5ff85a907b60da43a5f6fad0be62737590f2812c60ccde8f7d5809964cc',
    contentInitialReviewRevision: 7,
    contentDesiredReviewRevision: 8,
    contentInitialUpdatedAt: 1_786_432_330_925,
    linkId: 'k974hsx47zp7khx4nkxj1d8drn8b8730',
    linkCreationTime: 1_785_024_331_625.864,
    linkCreatedAt: 1_785_024_331_625,
    linkInitialUpdatedAt: 1_785_024_331_625,
    linkInitialCanonicalSha256:
      '57ff6c2162ab6372d5ef35590614c05ab05906e705b0400f4c2db58d042f4608',
    initialSourceIds: [
      'who-complementary-feeding-2023',
      'who-iycf-model-chapter-2025',
      'who-iycf-indicators-2021',
      'nhs-first-solid-foods-2026',
      'cdc-foods-6-24m-2025',
      'nice-ng247-maternal-child-nutrition-2025',
      'aap-breastfeeding-2022',
      'asha-pediatric-feeding-swallowing',
    ],
    desiredSourceIds: [
      'who-complementary-feeding-2023',
      'who-iycf-model-chapter-2025',
      'who-iycf-indicators-2021',
      'nhs-first-solid-foods-2026',
      'cdc-foods-6-24m-2025',
      'cdc-introduce-solid-foods-2026',
      'jr-niaid-peanut-prevention-2017',
      'nice-ng247-maternal-child-nutrition-2025',
      'aap-breastfeeding-2022',
      'asha-pediatric-feeding-swallowing',
    ],
    reviews: [
      { rowId: 'nn7bvtavy0tj5nwjza0f32qa0h8bh5s7', creationTime: 1_785_416_955_169.6418, exactCanonicalSha256: 'f9d90c03f97f5e406f6a5b4930a85535494c86f8e1a433a6b615b5617d9fa9f6' },
      { rowId: 'nn7ek2t7z2rk0e2qp1a1ttc5798bwxe9', creationTime: 1_785_903_398_156.208, exactCanonicalSha256: 'd6cbb3f47be24712471d93432de7a789723a62e504f0ff5ffad19d572e92a520' },
      { rowId: 'nn74q1dhdrjw8vxk248yp84tmx8bwwdw', creationTime: 1_785_903_401_760.265, exactCanonicalSha256: 'cc5ee25d55092289ba2e974be5b951a255e696c3447c1bd0b6506ececef1a22c' },
    ],
  },
] as const;

export const NUTRITION_GUIDES_EXISTING_SOURCE_PREIMAGES = [
  ['who-complementary-feeding-2023', 'kd7dvpmz6pfyypsptjj0jzwr1d8b8epw', 1_785_024_320_720.732, '277d503021da54c1960bd8c9b02fd0b7b0c70013a4ec8475abfe8189612c24e0'],
  ['nhs-first-solid-foods-2026', 'kd76vhvr39tf16wcb4gxkvrrr98b8pmk', 1_785_024_320_720.7434, 'e0bfa41811c50d7eaa033a559307a827cd92afcb588a8cd26992694505c66431'],
  ['cdc-foods-6-24m-2025', 'kd76qmbafq6raym5sjhtnjezjs8b9e1w', 1_785_024_320_720.7393, '664e901de4674ea46230f8cbe5f487eb14322305f258533b9494cf86522bb478'],
  ['who-iycf-model-chapter-2025', 'kd778kvfkaqvqf74kda1kvkbhs8b9ckw', 1_785_024_320_720.7332, '6c33d47ded861ab16cc936e9e10a9bc2989b28c449f0e6a4958d198bead699c8'],
  ['aap-breastfeeding-2022', 'kd710gsy1ntwqh4jkxe61hpb1s8b86th', 1_785_024_320_720.7378, 'bd7e91211fccbc9d03acac1b03d8e879c5093ecb591abe400ffe56135c8bd25a'],
  ['nhs-breastfeeding-first-days-2023', 'kd7d7gft2473gqrhvv23gxttzx8b9v13', 1_785_024_320_720.7441, 'c8ef4381c60b1a430340d1df55ae34b8be55b0ab334657297c1c7be8db15637a'],
  ['asha-pediatric-feeding-swallowing', 'kd7241f81xr4e0xzg3b3pyvkjs8b96cs', 1_785_024_320_720.7517, '4a0c5c3c357983d3e1242eca7db3a4246af83ae17093bb202451594055892d95'],
  ['hc-child-ems-2026', 'kd7b5nenfnkwyy2ecnhvb2jkv18c816t', 1_786_432_282_130.9553, 'e6c8a1bf5699b35185e4a17417764652e11d2ce58fadcd2bca83b19438d57408'],
  ['who-iycf-indicators-2021', 'kd7dvcg2gfztnqfnhq4vgnn4ts8b8pq1', 1_785_024_320_720.733, '6aabea11a2a678afc21ef4a03edafd325581d45fc089130abe4272fcfaa044e7'],
  ['nice-ng247-maternal-child-nutrition-2025', 'kd77x7r4bypjmjs4xq5ahyzcdd8b8s3p', 1_785_024_320_720.7424, '6d60235b8b68324a9d1faf663bb36a3cfdd1943ec5a6ae430aa978eb449d4c2a'],
  ['cdc-cows-milk-2026', 'kd762f97hn4k9fz490b426xab98cwdsf', 1_787_285_883_069.2456, 'fb3af2451c119004e7a23e2995973a5afec83251c25378ddf2c0fe96f0a53afe'],
] as const;

export type NutritionNewSource = {
  sourceId: typeof NUTRITION_GUIDES_NEW_SOURCE_IDS[number];
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
  reviewStatus: 'awaiting_review';
  reviewer: null;
  reviewDate: null;
  nextReviewDate: null;
  keywords: string[];
  topics: string[];
  ageMonthsMin: number | null;
  ageMonthsMax: number | null;
  verifiedOn: string;
  verifiedNote: string;
  searchText: string;
};

function sourceSearchText(source: Omit<NutritionNewSource, 'searchText'>): string {
  return [
    source.org,
    source.title,
    source.authors ?? '',
    source.url,
    source.doi ?? '',
    source.isbn ?? '',
    ...source.keywords,
    ...source.topics,
  ].join(' ').toLowerCase();
}

function newSource(
  source: Omit<NutritionNewSource, 'searchText'>,
): NutritionNewSource {
  return { ...source, searchText: sourceSearchText(source) };
}

export const NUTRITION_GUIDES_NEW_SOURCES: readonly NutritionNewSource[] = [
  newSource({
    sourceId: 'cdc-introduce-solid-foods-2026',
    org: 'Centers for Disease Control and Prevention',
    orgKey: 'CDC',
    title: 'When, What, and How to Introduce Solid Foods',
    authors: null,
    year: 2026,
    edition: null,
    country: 'United States',
    language: 'en',
    url: 'https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/when-what-and-how-to-introduce-solid-foods.html',
    doi: null,
    isbn: null,
    pmid: null,
    evidenceLevel: 'parent_education',
    reviewStatus: 'awaiting_review',
    reviewer: null,
    reviewDate: null,
    nextReviewDate: null,
    keywords: ['solid foods', 'allergens', 'peanut', 'severe eczema', 'egg allergy'],
    topics: ['nutrition', 'safety'],
    ageMonthsMin: 4,
    ageMonthsMax: 12,
    verifiedOn: '2026-08-23',
    verifiedNote:
      'CDC page prints the title and “Apr. 14, 2026”; it says to introduce single-ingredient foods one at a time and wait 3 to 5 days, not to offer cow’s milk as a drink before 12 months, and to discuss peanut introduction with a doctor or nurse for severe eczema or egg allergy.',
  }),
  newSource({
    sourceId: 'jr-niaid-peanut-prevention-2017',
    org: 'National Institute of Allergy and Infectious Diseases-sponsored expert panel',
    orgKey: 'GOV',
    title:
      'Addendum guidelines for the prevention of peanut allergy in the United States: Report of the National Institute of Allergy and Infectious Diseases-sponsored expert panel',
    authors: "Togias A, Cooper SF, Acebal ML, Assa'ad A, et al.",
    year: 2017,
    edition: 'J Allergy Clin Immunol. 2017 Jan;139(1):29-44',
    country: 'United States',
    language: 'en',
    url: 'https://pubmed.ncbi.nlm.nih.gov/28065278/',
    doi: '10.1016/j.jaci.2016.10.010',
    isbn: null,
    pmid: '28065278',
    evidenceLevel: 'guideline',
    reviewStatus: 'awaiting_review',
    reviewer: null,
    reviewDate: null,
    nextReviewDate: null,
    keywords: ['peanut allergy', 'prevention', 'severe eczema', 'egg allergy'],
    topics: ['nutrition', 'safety'],
    ageMonthsMin: 4,
    ageMonthsMax: 12,
    verifiedOn: '2026-08-23',
    verifiedNote:
      'PubMed record 28065278 prints the full title, author group, “J Allergy Clin Immunol. 2017 Jan;139(1):29-44”, DOI 10.1016/j.jaci.2016.10.010 and PMID 28065278; the NIAID-sponsored guideline identifies severe eczema and/or egg allergy as the high-risk criteria for clinician-directed peanut introduction.',
  }),
] as const;

type Bilingual = { mm: string; en: string };
type GuideData = Record<string, unknown> & {
  weeklyActivities?: Bilingual[];
  faq?: Array<{ q: Bilingual; a: Bilingual }>;
  safety?: Bilingual;
};

const allergy5To6: Bilingual = {
  mm: 'ရှောင်ရန် မလိုပါ။ ကလေးသည် ဖြည့်စွက်အစားအစာ စတင်စားရန် အသင့်ဖြစ်သည့်အချိန် (များသောအားဖြင့် ခြောက်လခန့်တွင် ခေါင်းကို တည်ငြိမ်စွာ ထိန်းနိုင်ပြီး အကူအညီဖြင့် ထိုင်နိုင်ချိန်) ရောက်ပါက ဥ၊ ငါး၊ ချောမွေ့အောင် ဖျော်ထားသော မြေပဲထောပတ်နှင့် အချိုမပါ ပိုးသတ်အပူပေးထားသော ဒိန်ချဉ် သို့မဟုတ် ချိစ်ကဲ့သို့ နို့ထွက်အစားအစာများကို (နွားနို့ကို အသက် ၁၂ လမတိုင်မီ အဓိကသောက်စရာအဖြစ် မပေးဘဲ) တစ်မျိုးချင်း အနည်းငယ်စီ စတင်ပေးနိုင်ပါသည်။ အသက်ရှူလမ်းကြောင်း မပိတ်ဆို့စေရန် အစာကို ချောမွေ့နူးညံ့သော ပုံစံဖြင့်ပေးပြီး စားနေစဉ် အမြဲ အနီးကပ်ကြီးကြပ်ပါ။ အစားအစာအသစ် တစ်မျိုးနှင့်တစ်မျိုးကြား ၃ ရက်မှ ၅ ရက် စောင့်ကြည့်ပါ။ အရေပြားယားယံခြင်း၊ အဖုအပိန့်ထွက်ခြင်း သို့မဟုတ် အော့အန်ခြင်း ဖြစ်ပါက ဆက်မပေးဘဲ ကျန်းမာရေးဝန်ထမ်းနှင့် တိုင်ပင်ပါ။ နှုတ်ခမ်း သို့မဟုတ် မျက်နှာရောင်ခြင်း၊ အသက်ရှူခက်ခြင်း ဖြစ်ပါက အရေးပေါ် ဆေးကုသမှု ချက်ချင်းခံယူပါ။ ကလေးတွင် ပြင်းထန်သော အရေပြားရောင်ရမ်းနာ သို့မဟုတ် ဥနှင့် ဓာတ်မတည့်မှု ရှိပါက မြေပဲမစတင်မီ ဆရာဝန်နှင့် တိုင်ပင်ပါ။ သိရှိထားသော အစားအစာဓာတ်မတည့်မှု သို့မဟုတ် အစားအစာတစ်မျိုးကို ယခင်က တုံ့ပြန်မှု ဖြစ်ဖူးပါက ထိုအစားအစာကို ဘေးကင်းစွာ မိတ်ဆက်ပုံကို ဆရာဝန်အား မေးမြန်းပါ။',
  en: 'There is no need to avoid them. Once your baby is developmentally ready for solids (around six months, holding the head steady and sitting with support), common allergen foods—egg, fish, smooth peanut paste, and pasteurized dairy foods such as plain yogurt or cheese (not cow’s milk as a main drink before 12 months)—can be introduced one at a time in small amounts. Offer them only in a smooth, soft, choking-safe texture and always supervise eating. Wait 3 to 5 days between each new food. If you see a rash, hives or vomiting, stop and talk to a health worker. If the lips or face swell or breathing becomes difficult, seek emergency care immediately. If your child has severe eczema or egg allergy, talk with a doctor before introducing peanut. If your child has a known food allergy or has previously reacted to a food, ask a doctor how to introduce that food safely.',
};

const allergy7To9: Bilingual = {
  mm: 'ရှောင်ရန် မလိုပါ။ ဥ၊ ငါး၊ ချောမွေ့အောင် ဖျော်ထားသော မြေပဲထောပတ်နှင့် နို့ထွက်ပစ္စည်းများကို ခြောက်လခန့်မှစ၍ တစ်မျိုးချင်း အနည်းငယ်စီ စတင်ပေးနိုင်ပါသည်။ အစားအစာအသစ် တစ်မျိုးနှင့်တစ်မျိုးကြား ၃ ရက်မှ ၅ ရက် စောင့်ကြည့်ပါ။ အရေပြားယားယံခြင်း၊ အဖုအပိန့်ထွက်ခြင်း သို့မဟုတ် အော့အန်ခြင်း ဖြစ်ပါက ဆက်မပေးဘဲ ကျန်းမာရေးဝန်ထမ်းနှင့် တိုင်ပင်ပါ။ နှုတ်ခမ်း သို့မဟုတ် မျက်နှာရောင်ခြင်း၊ အသက်ရှူခက်ခြင်း ဖြစ်ပါက အရေးပေါ် ဆေးကုသမှု ချက်ချင်းခံယူပါ။ ကလေးတွင် ပြင်းထန်သော အရေပြားရောင်ရမ်းနာ သို့မဟုတ် ဥနှင့် ဓာတ်မတည့်မှု ရှိပါက မြေပဲမစတင်မီ ဆရာဝန်နှင့် တိုင်ပင်ပါ။ သိရှိထားသော အစားအစာဓာတ်မတည့်မှု သို့မဟုတ် ယခင်က တုံ့ပြန်မှုရှိပါက ထိုအစားအစာကို ဘေးကင်းစွာ မိတ်ဆက်ပုံကို ဆရာဝန်အား မေးမြန်းပါ။',
  en: 'There is no need to avoid them. Egg, fish, smooth peanut paste and dairy can be introduced from around six months, one at a time and in small amounts. Wait 3 to 5 days between each new food. If you see a rash, hives or vomiting, stop and talk to a health worker. If the lips or face swell or breathing becomes difficult, seek emergency care immediately. If your child has severe eczema or egg allergy, talk with a doctor before introducing peanut. If your child has a known food allergy or has previously reacted to a food, ask a doctor how to introduce that food safely.',
};

const safety10To12: Bilingual = {
  mm: 'အသက်ရှူလမ်းကြောင်း ပိတ်ဆို့စေနိုင်သော အခွံမာသီးလုံး၊ ပဲစေ့လုံး၊ စပျစ်သီးနှင့် ချယ်ရီသီးလုံး၊ ပြောင်းဖူးပေါက်ပေါက်၊ သကြားလုံးမာ၊ ဝက်အူချောင်းအဝိုင်း၊ ငါးရိုးပါသောအသားနှင့် မာသော ဟင်းသီးဟင်းရွက်အတုံးများကို ရှောင်ပါ။ စပျစ်သီးနှင့် ချယ်ရီသီးကို အလျားလိုက် လေးစိတ်ခွဲပေးပါ။ အစာစားစဉ် အမြဲ အနီးကပ်ကြီးကြပ်ပြီး ကလေးကို မတ်မတ်ထိုင်စေပါ။ အသက် ၁၂ လမပြည့်မီ ပျားရည် မပေးပါနှင့်။ နွားနို့ကိုလည်း အဓိကသောက်စရာအဖြစ် မပေးပါနှင့်။ ဆားနှင့် သကြား ထပ်မထည့်ဘဲ ချိုသောအချိုရည်နှင့် လက်ဖက်ရည်ကို ရှောင်ပါ။ ဥ၊ ငါး၊ နို့ထွက်ပစ္စည်းနှင့် ချောမွေ့အောင် ဖျော်ထားသော အခွံမာသီးထုတ်ကုန်များကဲ့သို့ ဓာတ်မတည့်နိုင်သော အစားအစာများကို တစ်မျိုးချင်း အနည်းငယ်စီ စတင်ပေးပြီး အစားအစာအသစ် တစ်မျိုးနှင့်တစ်မျိုးကြား ၃ ရက်မှ ၅ ရက် စောင့်ကြည့်ပါ။ ကလေးတွင် ပြင်းထန်သော အရေပြားရောင်ရမ်းနာ သို့မဟုတ် ဥနှင့် ဓာတ်မတည့်မှု ရှိပါက မြေပဲမစတင်မီ ဆရာဝန်နှင့် တိုင်ပင်ပါ။ သိရှိထားသော အစားအစာဓာတ်မတည့်မှု သို့မဟုတ် ယခင်က တုံ့ပြန်မှုရှိပါက ထိုအစားအစာကို ဘေးကင်းစွာ မိတ်ဆက်ပုံကို ဆရာဝန်အား မေးမြန်းပါ။ အစားအစာကို ကောင်းစွာချက်ပြုတ်ပြီး လက်နှင့် အသုံးအဆောင်များကို သန့်ရှင်းစွာထားပါ။ သန့်ရှင်းသောရေကို သုံးပြီး ကျန်ရှိသောအစာကို အချိန်ကြာမြင့်စွာ မထားပါနှင့်။',
  en: 'Avoid choking foods — whole nuts, whole beans, whole grapes and cherries (quarter them), popcorn, hard sweets, whole sausage rounds, fish with bones and hard raw vegetable chunks. Always supervise meals with her sitting upright. Never give honey before 12 months. Do not use cow’s milk as a main drink before 12 months. Add no salt or sugar and avoid sweet drinks and tea. Common allergenic foods such as egg, fish, dairy and nut products (as smooth pastes, never whole nuts) do not need to be avoided. Introduce them one at a time and wait 3 to 5 days between each new food. If your child has severe eczema or egg allergy, talk with a doctor before introducing peanut. If your child has a known food allergy or has previously reacted to a food, ask a doctor how to introduce that food safely. Cook food thoroughly, wash hands, use clean water, and do not keep leftovers for long.',
};

export function desiredNutritionGuideData(slug: string, input: unknown): GuideData {
  const data = input as GuideData;
  if (slug === 'gd_5_6m_nutrition') {
    if (!Array.isArray(data.weeklyActivities) || !Array.isArray(data.faq) || data.faq.length !== 2) {
      throw new Error('Unexpected 5–6 month nutrition payload shape');
    }
    return {
      ...data,
      weeklyActivities: [{
        mm: 'အစားအစာ အသစ်တစ်မျိုးစီကို မိတ်ဆက်ပြီး ၃ ရက်မှ ၅ ရက် စောင့်ကြည့်ပါ။',
        en: 'Introduce one new food at a time and wait 3 to 5 days.',
      }],
      faq: [data.faq[0], { ...data.faq[1], a: allergy5To6 }],
    };
  }
  if (slug === 'gd_7_9m_nutrition') {
    if (!Array.isArray(data.faq) || data.faq.length !== 3) {
      throw new Error('Unexpected 7–9 month nutrition payload shape');
    }
    return { ...data, faq: [data.faq[0], data.faq[1], { ...data.faq[2], a: allergy7To9 }] };
  }
  if (slug === 'gd_10_12m_nutrition') {
    if (!data.safety) throw new Error('Unexpected 10–12 month nutrition payload shape');
    return { ...data, safety: safety10To12 };
  }
  throw new Error(`Unsupported nutrition guide CAS slug: ${slug}`);
}

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
    Object.values(value as Record<string, unknown>).forEach((entry) => collectStrings(entry, output));
  }
}

export function desiredNutritionGuideSearchText(
  content: {
    titleMm: string;
    titleEn: string;
    summaryMm?: string;
    summaryEn?: string;
    tags: readonly string[];
  },
  desiredData: unknown,
): string {
  const values = [
    content.titleMm,
    content.titleEn,
    content.summaryMm ?? '',
    content.summaryEn ?? '',
    ...content.tags,
  ];
  collectStrings(desiredData, values);
  return values.join(' ').toLowerCase();
}

export function isNutritionGuidesCasTarget(kind: string, slug: string): boolean {
  return kind === 'guide' && NUTRITION_GUIDES_CAS_TARGETS.some((target) => target.slug === slug);
}

export function isNutritionGuidesCasTargetSlug(slug: string): boolean {
  return NUTRITION_GUIDES_CAS_TARGETS.some((target) => target.slug === slug);
}

export function isNutritionGuidesCasSource(sourceId: string): boolean {
  return NUTRITION_GUIDES_NEW_SOURCE_IDS.some((candidate) => candidate === sourceId);
}

const targetKeys = NUTRITION_GUIDES_CAS_TARGETS.map((target) => `${target.kind}:${target.slug}`);
const existingSourceIds = NUTRITION_GUIDES_EXISTING_SOURCE_PREIMAGES.map(([sourceId]) => sourceId);
const desiredExistingSourceIds = new Set(NUTRITION_GUIDES_CAS_TARGETS.flatMap((target) => (
  target.desiredSourceIds.filter((sourceId) => !isNutritionGuidesCasSource(sourceId))
)));
if (new Set(targetKeys).size !== 3
  || new Set(NUTRITION_GUIDES_NEW_SOURCE_IDS).size !== 2
  || new Set(existingSourceIds).size !== existingSourceIds.length
  || existingSourceIds.length !== desiredExistingSourceIds.size
  || existingSourceIds.some((sourceId) => !desiredExistingSourceIds.has(sourceId))
  || NUTRITION_GUIDES_CAS_TARGETS.some((target) => (
    target.contentDesiredReviewRevision !== target.contentInitialReviewRevision + 1
    || !NUTRITION_GUIDES_NEW_SOURCE_IDS.every((sourceId) => target.desiredSourceIds.includes(sourceId))
  ))) {
  throw new Error('Nutrition guide CAS constants are invalid');
}
