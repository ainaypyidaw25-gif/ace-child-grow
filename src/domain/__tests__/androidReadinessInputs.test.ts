import { describe, expect, it } from 'vitest';
import {
  androidValidatorArgs,
  parseAndroidReadinessInputs,
} from '../../../scripts/lib/android-readiness-inputs.mjs';

const hash = 'a'.repeat(64);

describe('Android production-readiness validator inputs', () => {
  it('requires every non-secret exact release input', () => {
    expect(() => parseAndroidReadinessInputs({})).toThrow('playMaxVersionCode');
    expect(() => parseAndroidReadinessInputs({ playMaxVersionCode: 13 })).toThrow('bundle');
  });

  it('rejects invalid Play and approval values before invoking the validator', () => {
    expect(() => parseAndroidReadinessInputs({ playMaxVersionCode: -1 })).toThrow(
      'playMaxVersionCode',
    );
    expect(() => parseAndroidReadinessInputs({
      playMaxVersionCode: 13,
      bundle: import.meta.filename,
      bundletool: import.meta.filename,
      previousBundle: import.meta.filename,
      expectedSha256: 'not-a-hash',
      expectedCertSha256: hash,
    })).toThrow('expectedSha256');
  });

  it('maps the approved inputs to the dedicated fail-closed validator CLI', () => {
    const inputs = parseAndroidReadinessInputs({
      playMaxVersionCode: 13,
      bundle: import.meta.filename,
      bundletool: import.meta.filename,
      previousBundle: import.meta.filename,
      expectedSha256: hash.toUpperCase(),
      expectedCertSha256: hash,
      gradle: import.meta.filename,
    });
    expect(androidValidatorArgs(inputs)).toEqual([
      '--bundle', import.meta.filename,
      '--bundletool', import.meta.filename,
      '--previous-bundle', import.meta.filename,
      '--play-max-version-code', '13',
      '--expected-sha256', hash,
      '--expected-cert-sha256', hash,
      '--gradle', import.meta.filename,
      '--json',
    ]);
  });
});
