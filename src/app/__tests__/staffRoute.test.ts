import { describe, expect, it } from 'vitest';
import { decideStaffRoute } from '../staffRoute';

describe('staff route decision', () => {
  it('waits for the access query instead of redirecting mid-load', () => {
    expect(decideStaffRoute(undefined)).toBe('loading');
  });

  it('allows only an authenticated staff profile', () => {
    expect(decideStaffRoute({ isStaff: true })).toBe('allow');
  });

  it('redirects parent and missing profiles away from the admin shell', () => {
    expect(decideStaffRoute({ isStaff: false })).toBe('redirect');
    expect(decideStaffRoute(null)).toBe('redirect');
  });
});
