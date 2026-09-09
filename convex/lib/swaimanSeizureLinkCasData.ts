import exactSourceRowsJson from './swaimanSeizureLinkCasSources.json';

export const SWAIMAN_SEIZURE_LINK_CAS_RELEASE_ID =
  '2026-08-21-swaiman-seizure-redundant-unlink-v1' as const;

export const SWAIMAN_SEIZURE_LINK_CAS_SOURCE_FIXTURE_SHA256 =
  'e7e32c9cbadc667802a8ece85437b3e201d64e0c0d56d825be50222e55ebbc11' as const;

export const SWAIMAN_SEIZURE_SOURCE_ID = 'tb-swaiman-7e-2025' as const;

export type SwaimanSeizureLinkCasTarget = {
  kind: 'safety_rule';
  slug: 'seizure';
  linkId: string;
  creationTime: number;
  createdAt: number;
  initialUpdatedAt: number;
  initialSourceIds: readonly string[];
  desiredSourceIds: readonly string[];
};

/** Exact read-only Production evidenceLinks preimage captured on 2026-08-21. */
export const SWAIMAN_SEIZURE_LINK_CAS_TARGET: SwaimanSeizureLinkCasTarget = {
  kind: 'safety_rule',
  slug: 'seizure',
  linkId: 'k9760b7jasswetaty4wj4csq0s8b8yc9',
  creationTime: 1_785_024_331_625.8674,
  createdAt: 1_785_024_331_625,
  initialUpdatedAt: 1_786_432_294_276,
  initialSourceIds: [
    'nice-ng143-fever-2019',
    SWAIMAN_SEIZURE_SOURCE_ID,
    'nhs-child-accident-2025',
    'hc-child-ems-2026',
    'nhs-sids-2025',
  ],
  desiredSourceIds: [
    'nice-ng143-fever-2019',
    'nhs-child-accident-2025',
    'hc-child-ems-2026',
    'nhs-sids-2025',
  ],
} as const;

export type SwaimanSeizureSourcePreimage = {
  sourceId: string;
  rowId: string;
  creationTime: number;
  exactCanonicalSha256: string;
  includedInDesired: boolean;
};

export const SWAIMAN_SEIZURE_EXACT_SOURCE_ROWS =
  exactSourceRowsJson as readonly Record<string, unknown>[];

/**
 * Exact full Production source rows used to prove both the retained citations
 * and the inconsistent source being removed. This release never mutates them.
 */
export const SWAIMAN_SEIZURE_SOURCE_PREIMAGES:
readonly SwaimanSeizureSourcePreimage[] = [
  {
    sourceId: 'nice-ng143-fever-2019',
    rowId: 'kd797n46fgdag01wf7kk09d8k18b8jca',
    creationTime: 1_785_024_320_720.7422,
    exactCanonicalSha256: 'cdc239b7f1fc349efc8808426614fb53db62fbb75b59c2e5f677f12ecee3c6cc',
    includedInDesired: true,
  },
  {
    sourceId: SWAIMAN_SEIZURE_SOURCE_ID,
    rowId: 'kd7d1rcyxz4f170f19zcg0kf8n8b955m',
    creationTime: 1_785_024_320_720.749,
    exactCanonicalSha256: '2f62155266f6539077a2d965d473021985036208fcf8d08771818b4dfc9cfe63',
    includedInDesired: false,
  },
  {
    sourceId: 'nhs-child-accident-2025',
    rowId: 'kd7712yk4q0v5xd56z3tcvcq7n8c9rjt',
    creationTime: 1_786_432_282_130.9558,
    exactCanonicalSha256: 'ee186e5aa4fe25fc10442f54e528afa34e4c0e184f99f6adef44bd64f81d4a60',
    includedInDesired: true,
  },
  {
    sourceId: 'hc-child-ems-2026',
    rowId: 'kd7b5nenfnkwyy2ecnhvb2jkv18c816t',
    creationTime: 1_786_432_282_130.9553,
    exactCanonicalSha256: '8f4b5d08dce923387c92047df1d3e63f49c55f7f0b9ecdc8124243e8300e43c1',
    includedInDesired: true,
  },
  {
    sourceId: 'nhs-sids-2025',
    rowId: 'kd7fckxac2cty05c9ed0fdxcp18b8btx',
    creationTime: 1_785_024_320_720.743,
    exactCanonicalSha256: 'fdaf59b1f4096fc7ff159e9c1ee84b68ebce348d170c81be21f4bddc0fc19ebb',
    includedInDesired: true,
  },
] as const;

const exactSourceIds = SWAIMAN_SEIZURE_EXACT_SOURCE_ROWS.map(
  (source) => String(source.sourceId),
);
const preimageSourceIds = SWAIMAN_SEIZURE_SOURCE_PREIMAGES.map(
  (source) => source.sourceId,
);
const desiredSourceIds = [...SWAIMAN_SEIZURE_LINK_CAS_TARGET.desiredSourceIds];

if (new Set(SWAIMAN_SEIZURE_LINK_CAS_TARGET.initialSourceIds).size
    !== SWAIMAN_SEIZURE_LINK_CAS_TARGET.initialSourceIds.length
  || new Set(desiredSourceIds).size !== desiredSourceIds.length
  || !SWAIMAN_SEIZURE_LINK_CAS_TARGET.initialSourceIds.includes(SWAIMAN_SEIZURE_SOURCE_ID)
  || desiredSourceIds.includes(SWAIMAN_SEIZURE_SOURCE_ID)) {
  throw new Error('Swaiman seizure-link CAS source arrays are invalid');
}
if (SWAIMAN_SEIZURE_SOURCE_PREIMAGES.length !== 5
  || new Set(preimageSourceIds).size !== preimageSourceIds.length
  || exactSourceIds.length !== preimageSourceIds.length
  || !preimageSourceIds.every((sourceId, index) => sourceId === exactSourceIds[index])
  || !desiredSourceIds.every((sourceId) => preimageSourceIds.includes(sourceId))) {
  throw new Error('Swaiman seizure-link CAS source preimages are incomplete or reordered');
}

/** Server-boundary guard against stale or generic link imports. */
export function isSwaimanSeizureLinkCasTarget(kind: string, slug: string): boolean {
  return kind === SWAIMAN_SEIZURE_LINK_CAS_TARGET.kind
    && slug === SWAIMAN_SEIZURE_LINK_CAS_TARGET.slug;
}
