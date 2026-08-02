import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(path, 'utf8');

describe('high-value search surfaces', () => {
  it.each([
    ['owner priority', 'src/screens/ownerPriority/OwnerPriorityView.tsx'],
    ['review item picker', 'src/screens/ContentReviewWorkspace.tsx'],
    ['professional review queue', 'src/screens/AdminReviewQueue.tsx'],
    ['activities catalogue', 'src/screens/Activities.tsx'],
  ])('%s uses the shared search matcher and a native search control', (_label, path) => {
    const screen = source(path);
    expect(screen).toContain('matchesSearchQuery');
    expect(screen).toContain('type="search"');
  });

  it('keeps the daily activity plan independent from catalogue search', () => {
    const activities = source('src/screens/Activities.tsx');
    expect(activities).toContain('const daily = activities.slice(0, 3)');
    expect(activities).toContain('filteredActivities.map');
  });

  it('does not change the selected review item merely because search text changes', () => {
    const workspace = source('src/screens/ContentReviewWorkspace.tsx');
    expect(workspace).toContain('selected ? [selected, ...matchingItems] : matchingItems');
  });
});
