const MAX_CHANGES = 80;
const MAX_PREVIEW_LENGTH = 1_200;

export type ContentEditChange = {
  path: string;
  before: string;
  after: string;
  truncated: boolean;
};

export type ContentEditDiff = {
  changes: ContentEditChange[];
  totalChanges: number;
  logTruncated: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function serialized(value: unknown): string {
  if (value === undefined) return '—';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function preview(value: unknown): { text: string; truncated: boolean } {
  const text = serialized(value);
  if (text.length <= MAX_PREVIEW_LENGTH) return { text, truncated: false };
  return {
    text: `${text.slice(0, MAX_PREVIEW_LENGTH)}…`,
    truncated: true,
  };
}

function valuesEqual(before: unknown, after: unknown): boolean {
  if (Object.is(before, after)) return true;
  if (typeof before !== typeof after) return false;
  if ((Array.isArray(before) && Array.isArray(after)) || (isRecord(before) && isRecord(after))) {
    return JSON.stringify(before) === JSON.stringify(after);
  }
  return false;
}

/**
 * Build a bounded, human-readable change list for parent-facing content.
 * Objects are compared by leaf path. Arrays stay atomic so reordering does not
 * produce hundreds of misleading element-level changes.
 */
export function diffEditableContent(before: unknown, after: unknown): ContentEditDiff {
  const changes: ContentEditChange[] = [];
  let totalChanges = 0;

  const visit = (previous: unknown, next: unknown, path: string): void => {
    if (valuesEqual(previous, next)) return;

    if (isRecord(previous) && isRecord(next)) {
      const keys = [...new Set([...Object.keys(previous), ...Object.keys(next)])].sort();
      for (const key of keys) {
        visit(previous[key], next[key], path ? `${path}.${key}` : key);
      }
      return;
    }

    totalChanges += 1;
    if (changes.length >= MAX_CHANGES) return;
    const beforePreview = preview(previous);
    const afterPreview = preview(next);
    changes.push({
      path: path || 'content',
      before: beforePreview.text,
      after: afterPreview.text,
      truncated: beforePreview.truncated || afterPreview.truncated,
    });
  };

  visit(before, after, '');
  return {
    changes,
    totalChanges,
    logTruncated: totalChanges > changes.length,
  };
}
