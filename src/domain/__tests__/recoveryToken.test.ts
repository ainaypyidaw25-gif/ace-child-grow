import { describe, expect, it, vi } from 'vitest';
import { generateRecoveryToken } from '../auth/recoveryToken';

describe('account recovery token generation', () => {
  it.each([
    [0, '000000'],
    [42, '000042'],
    [999_999, '999999'],
    [4_293_999_999, '999999'],
  ])('formats accepted Uint32 value %i as six digits', (value, expected) => {
    const token = generateRecoveryToken(() => value);

    expect(token).toBe(expected);
    expect(token).toMatch(/^\d{6}$/);
  });

  it('rejects the incomplete Uint32 tail before applying modulo', () => {
    const randomUint32 = vi.fn()
      .mockReturnValueOnce(4_294_000_000)
      .mockReturnValueOnce(0xffff_ffff)
      .mockReturnValueOnce(7);

    expect(generateRecoveryToken(randomUint32)).toBe('000007');
    expect(randomUint32).toHaveBeenCalledTimes(3);
  });

  it.each([-1, 1.5, 0x1_0000_0000, Number.NaN])(
    'fails closed when the random source returns invalid value %s',
    (value) => {
      expect(() => generateRecoveryToken(() => value)).toThrow(
        'Recovery token random source returned an invalid value',
      );
    },
  );
});
