import exactSourceRowsJson from './swaimanSuddenWeaknessCasSources.json';

export const SWAIMAN_SUDDEN_WEAKNESS_CAS_RELEASE_ID =
  '2026-08-21-swaiman-sudden-weakness-cleanup-v1' as const;

export const SWAIMAN_SUDDEN_WEAKNESS_SOURCE_FIXTURE_SHA256 =
  '68a1481d30c64e954c908d88ea0cb2a44f89535ebc134747e6df1aaafce75076' as const;

export const SWAIMAN_SUDDEN_WEAKNESS_SOURCE_ID = 'tb-swaiman-7e-2025' as const;
export const CDC_AFM_SOURCE_ID = 'cdc-afm-signs-2024' as const;

export const SWAIMAN_SUDDEN_WEAKNESS_TARGET = {
  kind: 'safety_rule',
  slug: 'sudden_weakness',
  linkId: 'k972c3m8cszc40pzecntzns3p98b8a03',
  linkCreationTime: 1_785_024_331_625.868,
  linkCreatedAt: 1_785_024_331_625,
  linkInitialUpdatedAt: 1_786_432_294_276,
  linkInitialCanonicalSha256:
    '6bd2b2c492625377d9f58faf56486c21f9a5b51210ee9684fdc695bc1fd00a52',
  initialSourceIds: [CDC_AFM_SOURCE_ID, SWAIMAN_SUDDEN_WEAKNESS_SOURCE_ID],
  desiredSourceIds: [CDC_AFM_SOURCE_ID],
} as const;

export type SwaimanSuddenWeaknessSourcePreimage = {
  sourceId: string;
  rowId: string;
  creationTime: number;
  createdAt: number;
  initialCanonicalSha256: string;
  includedInDesired: boolean;
};

export const SWAIMAN_SUDDEN_WEAKNESS_EXACT_SOURCE_ROWS =
  exactSourceRowsJson as readonly Record<string, unknown>[];

/** Exact full-document Production source preimages captured after human review. */
export const SWAIMAN_SUDDEN_WEAKNESS_SOURCE_PREIMAGES:
readonly SwaimanSuddenWeaknessSourcePreimage[] = [
  {
    sourceId: CDC_AFM_SOURCE_ID,
    rowId: 'kd7bdgbmh0afm5ydknp2z6z7ts8c9wjb',
    creationTime: 1_786_432_282_130.9546,
    createdAt: 1_786_432_282_131,
    initialCanonicalSha256:
      'fe403eb4575ac3d60d856398b3f0c26999645477d0f697fa2b44d0e5079fabde',
    includedInDesired: true,
  },
  {
    sourceId: SWAIMAN_SUDDEN_WEAKNESS_SOURCE_ID,
    rowId: 'kd7d1rcyxz4f170f19zcg0kf8n8b955m',
    creationTime: 1_785_024_320_720.749,
    createdAt: 1_785_024_320_720,
    initialCanonicalSha256:
      '2f62155266f6539077a2d965d473021985036208fcf8d08771818b4dfc9cfe63',
    includedInDesired: false,
  },
] as const;

/**
 * Exact registry-aligned postimage for the now-unlinked textbook source.
 * It remains available as audit history, but cannot be parent-citable until a
 * future chapter-level human review signs it again.
 */
export const SWAIMAN_SUDDEN_WEAKNESS_SOURCE_DESIRED = {
  sourceId: SWAIMAN_SUDDEN_WEAKNESS_SOURCE_ID,
  org: 'Elsevier',
  orgKey: 'TEXTBOOK',
  title: "Swaiman's Pediatric Neurology",
  authors: 'Stephen Ashwal, MD; Phillip L. Pearl, MD',
  year: 2025,
  edition: '7th Edition',
  country: null,
  language: 'en',
  url: 'https://evolve.elsevier.com/cs/product/9780443109447?role=student',
  doi: null,
  isbn: '9780443109447',
  pmid: null,
  evidenceLevel: 'textbook',
  reviewStatus: 'awaiting_review',
  reviewer: null,
  reviewDate: null,
  nextReviewDate: null,
  keywords: ['pediatric neurology', 'cerebral palsy', 'neurodevelopment'],
  topics: ['special_needs', 'motor', 'cognitive'],
  ageMonthsMin: 0,
  ageMonthsMax: 60,
  verifiedOn: '2026-08-18',
  verifiedNote:
    'The Elsevier Evolve product page prints the title, “7th Edition”, authors Stephen Ashwal, MD and Phillip L. Pearl, MD, ISBN 9780443109447 and “Publication Date: 04-23-2025”. It prints no country of publication. The public page proves the book identity, but detailed clinical claims still require chapter-level human review.',
  searchText:
    "elsevier swaiman's pediatric neurology stephen ashwal, md; phillip l. pearl, md https://evolve.elsevier.com/cs/product/9780443109447?role=student  9780443109447 pediatric neurology cerebral palsy neurodevelopment special_needs motor cognitive",
} as const;

const exactSourceIds = SWAIMAN_SUDDEN_WEAKNESS_EXACT_SOURCE_ROWS.map(
  (source) => String(source.sourceId),
);
const preimageSourceIds = SWAIMAN_SUDDEN_WEAKNESS_SOURCE_PREIMAGES.map(
  (source) => source.sourceId,
);

if (SWAIMAN_SUDDEN_WEAKNESS_SOURCE_PREIMAGES.length !== 2
  || new Set(preimageSourceIds).size !== preimageSourceIds.length
  || !preimageSourceIds.every((sourceId, index) => sourceId === exactSourceIds[index])
  || new Set(SWAIMAN_SUDDEN_WEAKNESS_TARGET.initialSourceIds).size
    !== SWAIMAN_SUDDEN_WEAKNESS_TARGET.initialSourceIds.length
  || SWAIMAN_SUDDEN_WEAKNESS_TARGET.desiredSourceIds.length !== 1
  || SWAIMAN_SUDDEN_WEAKNESS_TARGET.desiredSourceIds[0] !== CDC_AFM_SOURCE_ID
  || !SWAIMAN_SUDDEN_WEAKNESS_TARGET.initialSourceIds.includes(
    SWAIMAN_SUDDEN_WEAKNESS_SOURCE_ID,
  )) {
  throw new Error('Swaiman sudden-weakness CAS constants are invalid');
}

/** Server-boundary guard against stale or generic evidence-link imports. */
export function isSwaimanSuddenWeaknessLinkCasTarget(kind: string, slug: string): boolean {
  return kind === SWAIMAN_SUDDEN_WEAKNESS_TARGET.kind
    && slug === SWAIMAN_SUDDEN_WEAKNESS_TARGET.slug;
}

/** Server-boundary guard against changing the source before/after exact CAS. */
export function isSwaimanSuddenWeaknessSourceCasTarget(sourceId: string): boolean {
  return sourceId === SWAIMAN_SUDDEN_WEAKNESS_SOURCE_ID;
}
