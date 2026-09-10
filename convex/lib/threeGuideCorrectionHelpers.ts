import {
  LEARNING_ATTRIBUTION_CLEARED_REVIEW_FIELDS,
  learningAttributionSearchText,
} from "./learningSourceAttributionCorrectionData";

export { THREE_GUIDE_CORRECTION_SLUGS as THREE_GUIDE_SLUGS } from "./threeGuideCorrectionScope";
export const THREE_GUIDE_CLEARED_FIELDS =
  LEARNING_ATTRIBUTION_CLEARED_REVIEW_FIELDS;
export type GuidePatch = { path: string; before: string; after: string };
export const sortedGuideRows = <T extends { _id: unknown }>(
  rows: readonly T[],
): T[] => [...rows].sort((a, b) => String(a._id).localeCompare(String(b._id)));
export function guideStablePostimage(
  row: Record<string, unknown>,
): Record<string, unknown> {
  const stable = { ...row };
  delete stable.updatedAt;
  return stable;
}
export function guideSourceMetadata(
  row: Record<string, unknown>,
): Record<string, unknown> {
  const stable = { ...row };
  for (const key of ["_id", "_creationTime", "createdAt", "updatedAt"])
    delete stable[key];
  return stable;
}
/** Matches evidence.ts searchTextFor; no source date or review state is synthesized. */
export function guideSourceSearchText(source: {
  org: string;
  title: string;
  authors: string | null;
  url: string;
  doi: string | null;
  isbn: string | null;
  keywords: readonly string[];
  topics: readonly string[];
}): string {
  return [
    source.org,
    source.title,
    source.authors ?? "",
    source.url,
    source.doi ?? "",
    source.isbn ?? "",
    ...source.keywords,
    ...source.topics,
  ]
    .join(" ")
    .toLowerCase();
}
/** Only exact, existing authored string leaves; clinical status and reviewer gates cannot be patched. */
export function correctedGuide(
  row: Record<string, unknown>,
  patches: readonly GuidePatch[],
  revision: number,
): Record<string, unknown> {
  if (
    !Number.isInteger(revision) ||
    row.reviewRevision !== revision ||
    row.type !== "guide" ||
    row.clinicalStatus !== "clinical_review"
  )
    throw new Error("Guide revision/status mismatch");
  const result = structuredClone(row),
    seen = new Set<string>();
  for (const patch of patches) {
    if (
      !/^(?:summaryEn|summaryMm|data\.(?:(?:editorialStatus|evidenceSummary)|(?:safety|referral|encouragement|materials|why)\.(?:en|mm)|(?:observationQuestions|dailyActivities|outdoor|lowCost|redFlags|parentTips|indoor|commonMistakes)\.\d+\.(?:en|mm)|faq\.\d+\.a\.(?:en|mm)))$/.test(
        patch.path,
      ) ||
      seen.has(patch.path)
    )
      throw new Error("Unallowed or duplicate guide path");
    seen.add(patch.path);
    const keys = patch.path.split(".");
    let object = result;
    for (const key of keys.slice(0, -1)) {
      if (
        !Object.prototype.hasOwnProperty.call(object, key) ||
        !object[key] ||
        typeof object[key] !== "object"
      )
        throw new Error("Missing guide patch path");
      object = object[key] as Record<string, unknown>;
    }
    const last = keys.at(-1)!;
    if (
      !Object.prototype.hasOwnProperty.call(object, last) ||
      object[last] !== patch.before ||
      typeof patch.before !== "string" ||
      typeof patch.after !== "string" ||
      patch.before === patch.after
    )
      throw new Error("Guide patch preimage mismatch");
    object[last] = patch.after;
  }
  result.reviewRevision = revision + 1;
  for (const key of THREE_GUIDE_CLEARED_FIELDS) delete result[key];
  result.searchText = learningAttributionSearchText(
    result as Parameters<typeof learningAttributionSearchText>[0],
    result.data as Record<string, unknown>,
  );
  return result;
}
