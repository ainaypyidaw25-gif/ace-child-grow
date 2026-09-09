const UINT32_SPACE = 0x1_0000_0000;
const RECOVERY_TOKEN_SPACE = 1_000_000;
const ACCEPTANCE_LIMIT = Math.floor(UINT32_SPACE / RECOVERY_TOKEN_SPACE)
  * RECOVERY_TOKEN_SPACE;

type RandomUint32 = () => number;

function secureRandomUint32(): number {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0];
}

/**
 * Generate a uniformly distributed six-digit account-recovery token.
 *
 * The high, incomplete portion of the Uint32 range is rejected before the
 * modulo operation so every one of the 1,000,000 possible tokens has exactly
 * the same number of source values.
 */
export function generateRecoveryToken(
  randomUint32: RandomUint32 = secureRandomUint32,
): string {
  let value: number;
  do {
    value = randomUint32();
    if (!Number.isInteger(value) || value < 0 || value >= UINT32_SPACE) {
      throw new Error('Recovery token random source returned an invalid value');
    }
  } while (value >= ACCEPTANCE_LIMIT);
  return String(value % RECOVERY_TOKEN_SPACE).padStart(6, '0');
}
