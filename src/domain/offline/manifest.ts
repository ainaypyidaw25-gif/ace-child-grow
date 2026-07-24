// Offline content manifest (Phase 17). Pure logic.
//
// SAFETY: only PUBLIC educational content may be listed for offline download.
// Private child records must never be added to an offline manifest or public
// cache (see docs/security/security-model.md). This module refuses non-public
// items defensively.

export interface OfflineItem {
  id: string;
  kind: 'lesson' | 'activity' | 'awareness';
  title: string;
  bytes: number;
  isPublic: boolean; // only true (published) items are eligible
}

export interface OfflineManifest {
  items: OfflineItem[];
  totalBytes: number;
  count: number;
  skipped: { nonPublic: number; overBudget: number };
}

/**
 * Build a manifest of downloadable public items within a byte budget.
 * Items are added in the given order until the budget would be exceeded.
 * Non-public items are always skipped (never cached offline).
 */
export function buildOfflineManifest(
  candidates: OfflineItem[],
  maxBytes: number = Infinity,
): OfflineManifest {
  const items: OfflineItem[] = [];
  let totalBytes = 0;
  let nonPublic = 0;
  let overBudget = 0;

  for (const c of candidates) {
    if (!c.isPublic) {
      nonPublic += 1;
      continue;
    }
    if (totalBytes + c.bytes > maxBytes) {
      overBudget += 1;
      continue;
    }
    items.push(c);
    totalBytes += c.bytes;
  }

  return { items, totalBytes, count: items.length, skipped: { nonPublic, overBudget } };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
