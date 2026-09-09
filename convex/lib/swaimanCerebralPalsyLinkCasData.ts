export const SWAIMAN_CEREBRAL_PALSY_LINK_CAS_RELEASE_ID =
  '2026-08-21-swaiman-cerebral-palsy-link-v1' as const;

export const SWAIMAN_CEREBRAL_PALSY_SOURCE_ID = 'tb-swaiman-7e-2025' as const;

export const SWAIMAN_CEREBRAL_PALSY_TARGET = {
  kind: 'special_need',
  slug: 'sn_cerebral_palsy',
  contentId: 'kx75znvhv5y88az3cv0j1mjbdh8b8ktj',
  contentCreationTime: 1_785_024_282_947.2092,
  contentInitialCanonicalSha256:
    'b070849933944b7359c584e27cdad6c94661054368e4f2bddd61965680094378',
  contentInitialReviewRevision: 3,
  contentDesiredReviewRevision: 4,
  contentInitialUpdatedAt: 1_786_432_330_925,
  linkId: 'k973e3b7chr9t189f5v291hhmh8b9179',
  linkCreationTime: 1_785_024_331_625.8274,
  linkCreatedAt: 1_785_024_331_625,
  linkInitialUpdatedAt: 1_785_024_331_625,
  linkInitialCanonicalSha256:
    '30ae7af685ca1dd5e351032d56ad3af6581e156720e4c12e249d41ff1e623c1e',
  initialSourceIds: [
    'nice-ng62-cerebral-palsy-2017',
    SWAIMAN_CEREBRAL_PALSY_SOURCE_ID,
    'tb-campbell-pt-6e-2022',
  ],
  desiredSourceIds: ['nice-ng62-cerebral-palsy-2017'],
} as const;

export type SwaimanCerebralPalsySourcePreimage = {
  sourceId: string;
  rowId: string;
  creationTime: number;
  exactCanonicalSha256: string;
  includedInDesired: boolean;
};

/** Exact full-document hashes from the read-only 2026-08-21 Production snapshot. */
export const SWAIMAN_CEREBRAL_PALSY_SOURCE_PREIMAGES:
readonly SwaimanCerebralPalsySourcePreimage[] = [
  {
    sourceId: 'nice-ng62-cerebral-palsy-2017',
    rowId: 'kd79knstrm9zfswckrqr29tedd8b81xc',
    creationTime: 1_785_024_320_720.742,
    exactCanonicalSha256: '86cfc2b8148a3c1a859634a157acdd58fb1dd3cd45f6a55cf031569f41bf092f',
    includedInDesired: true,
  },
  {
    sourceId: SWAIMAN_CEREBRAL_PALSY_SOURCE_ID,
    rowId: 'kd7d1rcyxz4f170f19zcg0kf8n8b955m',
    creationTime: 1_785_024_320_720.749,
    exactCanonicalSha256: '2f62155266f6539077a2d965d473021985036208fcf8d08771818b4dfc9cfe63',
    includedInDesired: false,
  },
  {
    sourceId: 'tb-campbell-pt-6e-2022',
    rowId: 'kd73gaznhkzw527sskap762qe18b8xkk',
    creationTime: 1_785_024_320_720.7495,
    exactCanonicalSha256: '478c2a805b411a616b519cc148019a35a12d2458b1112e2323be81ead26e3463',
    includedInDesired: false,
  },
] as const;

export const SWAIMAN_CEREBRAL_PALSY_MEDIA_PREIMAGES = [{
  rowId: 'm17fazcr1nrz4h93gza0fkvmfn8c81md',
  creationTime: 1_786_432_330_925.2153,
  exactCanonicalSha256: '756754efdb38553584c727d84b96bf44a01fd6cf485a9853820a74e74224f6ae',
}] as const;

export const SWAIMAN_CEREBRAL_PALSY_REVIEW_PREIMAGES = [
  {
    rowId: 'nn763kceqb74eyg804g028zq1d8brptr',
    creationTime: 1_785_754_001_532.941,
    exactCanonicalSha256: '10b39ecab7cd0a7110f64b7cd49ab8db2eb01cc71f56470f958894d964175477',
  },
  {
    rowId: 'nn783h4x404cmh44q2e9x7gt4n8bwx3q',
    creationTime: 1_785_904_797_615.018,
    exactCanonicalSha256: '2200854d8945f9632d4e6e0d7fc76a4d00e82d5db8785827f5b3c701dbfdb3b6',
  },
  {
    rowId: 'nn76rnn2wra0vcxg35334869658bx0qc',
    creationTime: 1_785_904_800_316.004,
    exactCanonicalSha256: '18f2f8a6d60ead5d27363e166d9e2742cd59124d79586f6990bff3b423776c3d',
  },
] as const;

const initialIds: string[] = [...SWAIMAN_CEREBRAL_PALSY_TARGET.initialSourceIds];
const desiredIds: string[] = [...SWAIMAN_CEREBRAL_PALSY_TARGET.desiredSourceIds];
const preimageIds = SWAIMAN_CEREBRAL_PALSY_SOURCE_PREIMAGES.map((row) => row.sourceId);

if (new Set(initialIds).size !== initialIds.length
  || new Set(desiredIds).size !== desiredIds.length
  || !initialIds.includes(SWAIMAN_CEREBRAL_PALSY_SOURCE_ID)
  || desiredIds.includes(SWAIMAN_CEREBRAL_PALSY_SOURCE_ID)
  || !initialIds.every((sourceId, index) => sourceId === preimageIds[index])
  || !desiredIds.every((sourceId) => preimageIds.includes(sourceId))) {
  throw new Error('Swaiman cerebral-palsy link CAS constants are invalid');
}

/** Server-boundary guard against stale or generic evidence-link imports. */
export function isSwaimanCerebralPalsyLinkCasTarget(kind: string, slug: string): boolean {
  return kind === SWAIMAN_CEREBRAL_PALSY_TARGET.kind
    && slug === SWAIMAN_CEREBRAL_PALSY_TARGET.slug;
}
