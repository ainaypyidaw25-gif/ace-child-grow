import { describe, expect, it, vi } from 'vitest';
import {
  captureReferralFromSearch,
  clearPendingReferralCode,
  normalizeReferralCode,
  pendingReferralCode,
} from '../referrals/referralCapture';

const modules = import.meta.glob('../../../convex/{schema,referrals,account}.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function source(name: string): string {
  const entry = Object.entries(modules).find(([path]) => path.endsWith(`/${name}`));
  if (!entry) throw new Error(`Missing ${name}`);
  return entry[1];
}

describe('referral capture', () => {
  it('normalizes and persists a valid referral from a share link', () => {
    const storage = { setItem: vi.fn() };
    expect(captureReferralFromSearch('?ref=ace-abcd2345', storage)).toBe('ACE-ABCD2345');
    expect(storage.setItem).toHaveBeenCalledWith('ace_referral_code', 'ACE-ABCD2345');
  });

  it('ignores malformed codes and reads only the supported format', () => {
    expect(captureReferralFromSearch('?ref=user-email@example.com', { setItem: vi.fn() })).toBeNull();
    expect(pendingReferralCode({ getItem: () => 'invalid' })).toBeNull();
    expect(normalizeReferralCode(' ace-abcd2345 ')).toBe('ACE-ABCD2345');
  });

  it('clears a claimed referral from local capture storage', () => {
    const storage = { removeItem: vi.fn() };
    clearPendingReferralCode(storage);
    expect(storage.removeItem).toHaveBeenCalledWith('ace_referral_code');
  });
});

describe('referral backend security', () => {
  const schema = source('schema.ts');
  const referrals = source('referrals.ts');
  const account = source('account.ts');

  it('enforces one attribution per referred member and indexed lookups', () => {
    expect(schema).toContain(".index('by_referred_user', ['referredUserId'])");
    expect(schema).toContain(".index('by_referrer_user', ['referrerUserId'])");
    expect(referrals).toContain(".withIndex('by_referred_user'");
    expect(referrals).toContain('if (existing) return { claimed: false, alreadyClaimed: true }');
  });

  it('prevents self-referral and restricts owner decisions', () => {
    expect(referrals).toContain('if (referralCode.userId === referredUserId)');
    expect(referrals).toContain('const ownerId = await requireOwner(ctx)');
    expect(referrals).toContain("status: 'registered'");
  });

  it('does not encode personal data in referral codes and removes referral rows on account deletion', () => {
    expect(referrals).toContain("const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'");
    expect(referrals).not.toContain('user.email');
    expect(account).toContain("'referralCodes'");
    expect(account).toContain(".withIndex('by_referrer_user'");
    expect(account).toContain(".withIndex('by_referred_user'");
  });
});
