import { describe, expect, it } from 'vitest';
import { normalizeAppleProfile } from '../auth/appleProfile';

describe('normalizeAppleProfile', () => {
  it('preserves the first-login name without writing an invalid null image', () => {
    const normalized = normalizeAppleProfile({
      sub: 'apple-user-id',
      email: 'parent@example.com',
      user: {
        name: {
          firstName: 'May',
          lastName: 'Thiri',
        },
      },
    });

    expect(normalized).toEqual({
      id: 'apple-user-id',
      name: 'May Thiri',
      email: 'parent@example.com',
    });
    expect(normalized).not.toHaveProperty('image');
  });

  it('uses the verified Apple email when repeat sign-in omits the one-time name', () => {
    expect(normalizeAppleProfile({
      sub: 'returning-apple-user-id',
      email: 'relay@example.com',
    })).toEqual({
      id: 'returning-apple-user-id',
      name: 'relay@example.com',
      email: 'relay@example.com',
    });
  });
});
