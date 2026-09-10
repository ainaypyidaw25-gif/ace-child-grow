import { canonicalJson } from './aiAuditHash';
import { LEARNING_ATTRIBUTION_CLEARED_REVIEW_FIELDS, learningAttributionSearchText } from './learningSourceAttributionCorrectionData';

export const SEVEN_STORY_CLEARED_FIELDS = LEARNING_ATTRIBUTION_CLEARED_REVIEW_FIELDS;
export type StoryPatch = { path: string; before: string; after: string };
export function storyStablePostimage(row: Record<string, unknown>): Record<string, unknown> {
  const result = { ...row }; delete result.updatedAt; return result;
}
/** Existing string leaves only; no caller-controlled paths are accepted by a registered function. */
export function correctedStory(row: Record<string, unknown>, patches: readonly StoryPatch[]): Record<string, unknown> {
  const result = structuredClone(row);
  const seen = new Set<string>();
  for (const patch of patches) {
    if (!/^(?:source|titleMm|summaryEn|summaryMm|data\.(?:body\.(?:en|mm)|activities\.\d+\.(?:en|mm)|questions\.\d+\.(?:en|mm)))$/.test(patch.path)
      || seen.has(patch.path)) throw new Error('Unallowed or duplicate story correction path');
    seen.add(patch.path);
    const keys = patch.path.split('.'); let object = result;
    for (const key of keys.slice(0, -1)) {
      if (!Object.prototype.hasOwnProperty.call(object, key) || !object[key] || typeof object[key] !== 'object') throw new Error('Missing story correction path');
      object = object[key] as Record<string, unknown>;
    }
    const last = keys.at(-1)!;
    if (!Object.prototype.hasOwnProperty.call(object, last) || object[last] !== patch.before || patch.before === patch.after) throw new Error('Story correction preimage mismatch');
    object[last] = patch.after;
  }
  result.reviewRevision = 3;
  result.clinicalStatus = 'clinical_review';
  for (const key of SEVEN_STORY_CLEARED_FIELDS) delete result[key];
  result.searchText = learningAttributionSearchText(result as Parameters<typeof learningAttributionSearchText>[0], result.data as Record<string, unknown>);
  return result;
}
export const sortedStoryRows = <T extends { _id: unknown }>(rows: readonly T[]): T[] => [...rows].sort((a,b) => String(a._id).localeCompare(String(b._id)));
export const storyEqual = (a: unknown, b: unknown): boolean => canonicalJson(a) === canonicalJson(b);
