// Exact internal metadata correction: no human approval and no publication.
// Full private snapshot stays in artifacts; only hashes and public content identity are compiled.
export const LEARNING_ATTRIBUTION_RELEASE_ID = '2026-09-10-three-book-attribution-correction-v1' as const;
export const LEARNING_ATTRIBUTION_SNAPSHOT_SHA256 = '450a77cff349969eff9378840d676ba4918e7e2ada3e2583fd978f1de425d7a3' as const;
export const LEARNING_ATTRIBUTION_CAPTURED_AT = 1789019840005;
export const LEARNING_ATTRIBUTION_APPLY_BEFORE = 1789624640005;
export const LEARNING_ATTRIBUTION_TARGETS = [
  {
    "slug": "act_board_book_point",
    "contentId": "kx71p5nr3aaztrr1at7wwz0hcx8b9490",
    "contentCreationTime": 1785024282947.2534,
    "initialReviewRevision": 5,
    "desiredReviewRevision": 6,
    "initialUpdatedAt": 1787041975760,
    "initialFullHash": "f2ba6cc21cfede1834bf525ab2298a436ff5af4fcefe8689120bb585b2b14ca9",
    "preservedContentHash": "2ab2c437dabb1bc9e605aad35745345db5111f60a0798656a46a15f8f58b3237",
    "before": "Shared book reading from infancy is supported by AAP literacy guidance, Health Canada early literacy guidance, NHS learn-to-talk advice and the shared book-reading research in the registry.",
    "after": "Shared book reading from infancy is supported by AAP literacy guidance, AAP HealthyChildren early literacy guidance, NHS learn-to-talk advice and the shared book-reading research in the registry.",
    "linkFullHash": "64aa2667b86512343a3e602c6a2ca4d1895ebc8a2506f9439eee3548e613ba4d",
    "sourceIds": [
      "aap-literacy-2024",
      "hc-early-literacy-2023",
      "nhs-learn-to-talk-2023",
      "jr-dowdall-bookreading-2020"
    ],
    "sourcesFullHash": "bc49522ef25b8a826aa8d44c91d2cb02f87b0ec2ceeed942b3c1e6d00bd15301",
    "reviewsCount": 0,
    "reviewsFullHash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
    "mediaCount": 2,
    "mediaFullHash": "f10dd4a82e1415d22a3b2055c259f4533fe0a64a50bd829b98fa12572d8c8444"
  },
  {
    "slug": "act_lift_the_flap_book",
    "contentId": "kx739hhdcsay94femqbgz9ppyd8b8c6g",
    "contentCreationTime": 1785024282947.2632,
    "initialReviewRevision": 5,
    "desiredReviewRevision": 6,
    "initialUpdatedAt": 1786432330925,
    "initialFullHash": "733067c559c18f5000a0964293808fdf7bb95e99b896a715a9984a70354d74fc",
    "preservedContentHash": "b90baee61db554ff1eb64eaf71fe4877f1f0d784785689800df626408aca805f",
    "before": "Shared book reading in the first year follows the AAP early-literacy policy, Canadian public-health early-literacy guidance, NHS learn-to-talk guidance and the shared book-reading research in the registry.",
    "after": "Shared book reading in the first year follows the AAP early-literacy policy, AAP HealthyChildren early-literacy guidance, NHS learn-to-talk guidance and the shared book-reading research in the registry.",
    "linkFullHash": "7dc8f80d1ba26d3c984e83aadc2db5adc4836693b479065ca9e2670bb62af94d",
    "sourceIds": [
      "aap-literacy-2024",
      "hc-early-literacy-2023",
      "nhs-learn-to-talk-2023",
      "jr-dowdall-bookreading-2020"
    ],
    "sourcesFullHash": "bc49522ef25b8a826aa8d44c91d2cb02f87b0ec2ceeed942b3c1e6d00bd15301",
    "reviewsCount": 2,
    "reviewsFullHash": "c4adc950c0cc9af4e9155f03e895203d8841cd9579934adb8c02e9c677b99386",
    "mediaCount": 2,
    "mediaFullHash": "6dc4e29e702204e690afd8d94a5a5acc81393be33ebceb9bc3e61203a015500d"
  },
  {
    "slug": "act_first_words_book_share",
    "contentId": "kx729crydtm3vhp768gpamzj398b9qbb",
    "contentCreationTime": 1785024282947.2744,
    "initialReviewRevision": 5,
    "desiredReviewRevision": 6,
    "initialUpdatedAt": 1786432330925,
    "initialFullHash": "347c6d2e805d6a1d826168dc2dc8686b35df5a3295c9356df424fba040499266",
    "preservedContentHash": "61a709eda5596acb35d52344e7f96727ed2e50d540092a2e4e908d7093678c76",
    "before": "Daily book sharing in the first year is supported by the AAP literacy policy, the Canadian early-literacy guidance, the shared book-reading research paper and the NHS early-talking guidance held in the registry.",
    "after": "Daily book sharing in the first year is supported by the AAP literacy policy, the AAP HealthyChildren early-literacy guidance, the shared book-reading research paper and the NHS early-talking guidance held in the registry.",
    "linkFullHash": "3fb9c278db99905136d0549f5dee4ed98ece4ac3d0b10651e69e82fd9b84c7f3",
    "sourceIds": [
      "aap-literacy-2024",
      "hc-early-literacy-2023",
      "jr-dowdall-bookreading-2020",
      "nhs-learn-to-talk-2023"
    ],
    "sourcesFullHash": "bc49522ef25b8a826aa8d44c91d2cb02f87b0ec2ceeed942b3c1e6d00bd15301",
    "reviewsCount": 0,
    "reviewsFullHash": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
    "mediaCount": 2,
    "mediaFullHash": "29736c3be51ccf40c85749bd73efdd3053b1864730171662c45b4191f9b5d8cc"
  }
] as const;

export const LEARNING_ATTRIBUTION_CLEARED_REVIEW_FIELDS = [
  'reviewerId', 'reviewerQualification', 'reviewerDisplayName', 'reviewScope',
  'reviewedAt', 'nextReviewAt', 'reviewNote',
] as const;

/** Everything outside the one metadata value and explicit review invalidation is immutable. */
export function learningAttributionPreservedContent(row: Record<string, unknown>): Record<string, unknown> {
  const preserved = { ...row };
  for (const key of ['searchText', 'reviewRevision', 'clinicalStatus', 'updatedAt', ...LEARNING_ATTRIBUTION_CLEARED_REVIEW_FIELDS]) delete preserved[key];
  const data = { ...(row.data as Record<string, unknown>) };
  delete data.evidenceSummary;
  return { ...preserved, data };
}

/** Mirrors canonical seed normalization: all data strings participate in search. */
export function learningAttributionSearchText(row: {
  titleMm: string; titleEn: string; summaryMm?: string; summaryEn?: string; tags: string[];
}, data: Record<string, unknown>): string {
  const strings: string[] = [row.titleMm, row.titleEn, row.summaryMm ?? '', row.summaryEn ?? '', ...row.tags];
  const collect = (value: unknown): void => {
    if (typeof value === 'string') strings.push(value);
    else if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === 'object') Object.values(value).forEach(collect);
  };
  collect(data);
  return strings.join(' ').toLowerCase();
}
