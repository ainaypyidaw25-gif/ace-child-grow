import { describe, expect, it } from 'vitest';
import { formatNotificationDate, safeNotificationTarget } from '../Notifications';

describe('notification presentation helpers', () => {
  it('accepts only internal application paths', () => {
    expect(safeNotificationTarget('/admin/reviews?content=item-1')).toBe('/admin/reviews?content=item-1');
    expect(safeNotificationTarget('https://example.com')).toBeNull();
    expect(safeNotificationTarget('//example.com')).toBeNull();
    expect(safeNotificationTarget(undefined)).toBeNull();
  });

  it('formats a readable localized date', () => {
    const timestamp = Date.UTC(2026, 6, 29, 2, 30);
    expect(formatNotificationDate(timestamp, 'en')).toMatch(/Jul.*2026/i);
    expect(formatNotificationDate(timestamp, 'mm').length).toBeGreaterThan(5);
  });
});
