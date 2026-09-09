import { describe, expect, it } from 'vitest';
import {
  assessAndroidBundle,
  assessAndroidReleaseSource,
  jarsignerOutputIsComplete,
  normalizeSha256,
  parseBundletoolManifest,
  parseGradleReleaseMetadata,
  parseKeytoolCertificate,
  parsePlayMaxVersionCode,
} from '../../../scripts/lib/android-release-validator.mjs';

const fingerprint = 'b2ec6b6417bd19e9dd48cbdff54ac32cf189738a9691bb334b5698fcc6f56386';
const sourceCommit = '1'.repeat(40);
const validationTimeMs = Date.parse('2026-09-09T00:00:00Z');
const validCertificate = {
  sha256: fingerprint,
  validFromMs: Date.parse('2026-01-01T00:00:00Z'),
  validUntilMs: Date.parse('2053-12-12T23:59:59Z'),
};

describe('Android release validation', () => {
  it('requires the exact clean git source and a version above the fresh Play maximum', () => {
    expect(parsePlayMaxVersionCode('13')).toBe(13);
    expect(parsePlayMaxVersionCode('-1')).toBeNull();
    expect(parsePlayMaxVersionCode('13.5')).toBeNull();

    const common = {
      expectedSourceCommit: sourceCommit,
      actualSourceCommit: sourceCommit,
      sourceClean: true,
      versionCode: 14,
      playMaxVersionCode: 13,
    };
    expect(assessAndroidReleaseSource(common).ready).toBe(true);

    for (const input of [
      { ...common, expectedSourceCommit: null },
      { ...common, expectedSourceCommit: '2'.repeat(40) },
      { ...common, sourceClean: false },
      { ...common, playMaxVersionCode: null },
      { ...common, versionCode: 13 },
      { ...common, versionCode: 12 },
    ]) {
      expect(assessAndroidReleaseSource(input).ready).toBe(false);
    }
  });

  it('parses source, manifest and certificate metadata', () => {
    expect(parseGradleReleaseMetadata(`
      applicationId "mm.com.acegroup.acechildgrow"
      versionCode 14
      versionName "1.13"
    `)).toMatchObject({
      applicationId: 'mm.com.acegroup.acechildgrow',
      versionCode: 14,
      versionName: '1.13',
    });
    expect(parseBundletoolManifest(
      `<manifest android:versionCode="14" android:versionName="1.13" package="mm.com.acegroup.acechildgrow">
        <application><meta-data android:name="mm.com.acegroup.acechildgrow.SOURCE_COMMIT" android:value="${sourceCommit}" /></application>
      </manifest>`,
    )).toMatchObject({
      packageName: 'mm.com.acegroup.acechildgrow',
      versionCode: 14,
      versionName: '1.13',
      sourceCommit,
    });
    expect(parseKeytoolCertificate(`
      Valid from: Mon Jul 27 15:07:19 UTC 2026 until: Fri Dec 12 15:07:19 UTC 2053
      SHA256: B2:EC:6B:64:17:BD:19:E9:DD:48:CB:DF:F5:4A:C3:2C:F1:89:73:8A:96:91:BB:33:4B:56:98:FC:C6:F5:63:86
    `)).toMatchObject({
      sha256: fingerprint,
      validFromMs: Date.parse('2026-07-27T15:07:19Z'),
      validUntilMs: Date.parse('2053-12-12T15:07:19Z'),
    });
    expect(normalizeSha256('not-a-fingerprint')).toBeNull();
    expect(jarsignerOutputIsComplete('jar verified.\n')).toBe(true);
    expect(jarsignerOutputIsComplete(
      'jar verified.\nWarning: This jar contains unsigned entries which have not been integrity-checked.',
    )).toBe(false);
    expect(jarsignerOutputIsComplete('jar is unsigned.')).toBe(false);
    expect(jarsignerOutputIsComplete('jar verified.', 1)).toBe(false);
  });

  it('blocks stale versions and passes only an exact clean-source candidate', () => {
    const common = {
      artifact: {
        packageName: 'mm.com.acegroup.acechildgrow',
        versionCode: 15,
        versionName: '1.14',
        sha256: 'a'.repeat(64),
        sourceCommit,
      },
      jarSignatureValid: true,
      bundletoolValid: true,
      certificate: validCertificate,
      previousCertificate: { sha256: fingerprint },
      sourceCommit,
      sourceClean: true,
      validationTimeMs,
    };
    expect(assessAndroidBundle({
      ...common,
      gradle: {
        applicationId: 'mm.com.acegroup.acechildgrow',
        versionCode: 16,
        versionName: '1.15',
      },
      playMaxVersionCode: 15,
    }).ready).toBe(false);
    expect(assessAndroidBundle({
      ...common,
      gradle: {
        applicationId: 'mm.com.acegroup.acechildgrow',
        versionCode: 15,
        versionName: '1.14',
      },
      expectedArtifactSha256: 'a'.repeat(64),
      expectedCertificateSha256: fingerprint,
      playMaxVersionCode: 14,
    }).ready).toBe(true);
  });

  it('blocks expired, not-yet-valid, and unreadable signer validity windows', () => {
    const common = {
      artifact: {
        packageName: 'mm.com.acegroup.acechildgrow',
        versionCode: 15,
        versionName: '1.14',
        sha256: 'a'.repeat(64),
        sourceCommit,
      },
      gradle: {
        applicationId: 'mm.com.acegroup.acechildgrow',
        versionCode: 15,
        versionName: '1.14',
      },
      jarSignatureValid: true,
      bundletoolValid: true,
      previousCertificate: { sha256: fingerprint },
      expectedArtifactSha256: 'a'.repeat(64),
      expectedCertificateSha256: fingerprint,
      playMaxVersionCode: 14,
      sourceCommit,
      sourceClean: true,
      validationTimeMs,
    };
    for (const certificate of [
      { sha256: fingerprint, validFromMs: Date.parse('2025-01-01'), validUntilMs: Date.parse('2026-01-01') },
      { sha256: fingerprint, validFromMs: Date.parse('2027-01-01'), validUntilMs: Date.parse('2053-01-01') },
      { sha256: fingerprint, validFromMs: null, validUntilMs: null },
    ]) {
      const result = assessAndroidBundle({ ...common, certificate });
      expect(result.ready).toBe(false);
      expect(result.checks.find((check) => check.id === 'certificate_currently_valid')?.pass).toBe(false);
    }
  });

  it('never reports ready when release-critical evidence is omitted', () => {
    const result = assessAndroidBundle({
      artifact: {
        packageName: 'mm.com.acegroup.acechildgrow',
        versionCode: 15,
        versionName: '1.14',
        sha256: 'a'.repeat(64),
        sourceCommit,
      },
      gradle: {
        applicationId: 'mm.com.acegroup.acechildgrow',
        versionCode: 15,
        versionName: '1.14',
      },
      jarSignatureValid: true,
      bundletoolValid: true,
      certificate: validCertificate,
      sourceCommit,
      sourceClean: true,
      validationTimeMs,
    });

    expect(result.ready).toBe(false);
    expect(result.checks.filter((check) => !check.pass).map((check) => check.id)).toEqual([
      'signer_matches_previous',
      'artifact_hash_matches_approval',
      'signer_matches_approval',
      'version_code_exceeds_play',
    ]);
  });
});
