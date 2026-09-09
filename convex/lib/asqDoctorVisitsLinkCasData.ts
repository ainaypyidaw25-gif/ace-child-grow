export const ASQ_DOCTOR_VISITS_LINK_CAS_RELEASE_ID =
  '2026-08-21-asq-doctor-visits-scope-unlink-v1' as const;

export const ASQ_DOCTOR_VISITS_SOURCE_ID = 'jr-asq3-argentina-2018' as const;

export const ASQ_DOCTOR_VISITS_TARGET = {
  kind: 'lesson',
  slug: 'lsn_doctor_visits',
  contentId: 'kx7atdfkr5bh08yb9n7naxhz3h8b97h4',
  contentCreationTime: 1_785_024_282_947.2058,
  contentInitialCanonicalSha256:
    '7694b1d8b830e8da8c1d701f13881e6fbd7fdbba8f6b6280fda49b9183d658de',
  contentInitialReviewRevision: 3,
  contentDesiredReviewRevision: 4,
  contentInitialUpdatedAt: 1_786_432_330_925,
  linkId: 'k9751x50x9kzyqx0kj17bs7w6x8b9jcr',
  linkCreationTime: 1_785_024_331_625.8257,
  linkCreatedAt: 1_785_024_331_625,
  linkInitialUpdatedAt: 1_785_024_331_625,
  linkInitialCanonicalSha256:
    '87e3d898234bf962e56dc002fc0f8898beb791eec858fa4625e886882be7642a',
  initialSourceIds: [
    'tb-bright-futures-4e-2017',
    'nhs-baby-reviews-2023',
    'cdc-monitoring-screening-2026',
    'nhs-vaccinations-2023',
    'cdc-immunization-schedule-2025',
    'who-ia2030-2020',
    ASQ_DOCTOR_VISITS_SOURCE_ID,
    'myanmar-nsp-newborn-child-2015',
  ],
  desiredSourceIds: [
    'tb-bright-futures-4e-2017',
    'nhs-baby-reviews-2023',
    'cdc-monitoring-screening-2026',
    'nhs-vaccinations-2023',
    'cdc-immunization-schedule-2025',
    'who-ia2030-2020',
    'myanmar-nsp-newborn-child-2015',
  ],
} as const;

export type AsqDoctorVisitsSourcePreimage = {
  sourceId: string;
  rowId: string;
  creationTime: number;
  exactCanonicalSha256: string;
  includedInDesired: boolean;
};

/** Exact full-document hashes from the read-only 2026-08-21 Production snapshot. */
export const ASQ_DOCTOR_VISITS_SOURCE_PREIMAGES:
readonly AsqDoctorVisitsSourcePreimage[] = [
  {
    sourceId: 'tb-bright-futures-4e-2017',
    rowId: 'kd7fhbywwd960azjsgqd2kjsx58b8z8d',
    creationTime: 1_785_024_320_720.75,
    exactCanonicalSha256: '884f6f50bcdc10faf29690640dafc56818cc9102695b5d33eab49303149e245b',
    includedInDesired: true,
  },
  {
    sourceId: 'nhs-baby-reviews-2023',
    rowId: 'kd7fprenfqhqc5rvx6fvp9re0s8b9935',
    creationTime: 1_785_024_320_720.7432,
    exactCanonicalSha256: 'b3827b5937d62cecb93f665f67ff00c25db0848d8107424a317643a41aa594c7',
    includedInDesired: true,
  },
  {
    sourceId: 'cdc-monitoring-screening-2026',
    rowId: 'kd78pxdz6b07ggyewh96v721dh8b84sk',
    creationTime: 1_785_024_320_720.7388,
    exactCanonicalSha256: '4643f3802fa58a8d49c44272667ea7d8960cd20d5f5132e36d245f8b35d7ba43',
    includedInDesired: true,
  },
  {
    sourceId: 'nhs-vaccinations-2023',
    rowId: 'kd78y8znya0cvekr22drae90qn8b8jrf',
    creationTime: 1_785_024_320_720.7444,
    exactCanonicalSha256: '05edf9c51747ca566043dbfab4f67db773953a937a639e5ff5463e41a8cb08d6',
    includedInDesired: true,
  },
  {
    sourceId: 'cdc-immunization-schedule-2025',
    rowId: 'kd76nf8vy1gyjn47kkzh87aa7x8b9692',
    creationTime: 1_785_024_320_720.7397,
    exactCanonicalSha256: 'bd58323d940b04ef81e2dabdca0c3dd1607dcecbfe6bafc3f3d69fdb01fd9ccc',
    includedInDesired: true,
  },
  {
    sourceId: 'who-ia2030-2020',
    rowId: 'kd7bpar2mnxpj17v8n689n3bdd8b8761',
    creationTime: 1_785_024_320_720.734,
    exactCanonicalSha256: '3d51f809b4b65ae09ad6f065a3d167c1bb89162fed8d193e6b13c61cca1a2d81',
    includedInDesired: true,
  },
  {
    sourceId: ASQ_DOCTOR_VISITS_SOURCE_ID,
    rowId: 'kd7c2frng0rmy1e36pzm17j8958b8bfz',
    creationTime: 1_785_024_320_720.7468,
    exactCanonicalSha256: '27bb987c0181332668308a250decb4a8e4430a20f91818f5137c82a665414888',
    includedInDesired: false,
  },
  {
    sourceId: 'myanmar-nsp-newborn-child-2015',
    rowId: 'kd7ag00fr1kgs8sfk2ks1vha558b9eah',
    creationTime: 1_785_024_320_720.7354,
    exactCanonicalSha256: 'ebb732fd6370114bb7ebebd5476c6d7d566b960ca2857e77bc17aec8df74c694',
    includedInDesired: true,
  },
] as const;

export const ASQ_DOCTOR_VISITS_MEDIA_PREIMAGES = [{
  rowId: 'm17dbjvagm4cn2cmjv72agg5nd8c9yxz',
  creationTime: 1_786_432_330_925.2139,
  exactCanonicalSha256: '21e852c2fd927f5056d65ffeae0de8bdbc480c5feadc27fb7497410d73755423',
}] as const;

export const ASQ_DOCTOR_VISITS_REVIEW_PREIMAGES = [{
  rowId: 'nn77czrd5s4pa0b8w7evdkbfzx8bsz8q',
  creationTime: 1_785_733_688_282.1265,
  exactCanonicalSha256: 'a77034425e80bab9fec98bd1a8630cad53c89d76595277a2a10456a33d29ae53',
}] as const;

const initialIds: string[] = [...ASQ_DOCTOR_VISITS_TARGET.initialSourceIds];
const desiredIds: string[] = [...ASQ_DOCTOR_VISITS_TARGET.desiredSourceIds];
const preimageIds = ASQ_DOCTOR_VISITS_SOURCE_PREIMAGES.map((row) => row.sourceId);

if (new Set(initialIds).size !== initialIds.length
  || new Set(desiredIds).size !== desiredIds.length
  || !initialIds.includes(ASQ_DOCTOR_VISITS_SOURCE_ID)
  || desiredIds.includes(ASQ_DOCTOR_VISITS_SOURCE_ID)
  || !initialIds.every((sourceId, index) => sourceId === preimageIds[index])
  || !desiredIds.every((sourceId) => preimageIds.includes(sourceId))) {
  throw new Error('ASQ doctor-visits link CAS constants are invalid');
}

/** Server-boundary guard against stale or generic evidence-link imports. */
export function isAsqDoctorVisitsLinkCasTarget(kind: string, slug: string): boolean {
  return kind === ASQ_DOCTOR_VISITS_TARGET.kind
    && slug === ASQ_DOCTOR_VISITS_TARGET.slug;
}
