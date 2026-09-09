export type ReleaseMetadata = {
  applicationId?: string | null;
  packageName?: string | null;
  versionCode: number | null;
  versionName: string | null;
  sourceCommit?: string | null;
  sha256?: string;
};

export type CertificateMetadata = {
  sha256: string | null;
  validFrom?: string | null;
  validUntil?: string | null;
  validFromMs?: number | null;
  validUntilMs?: number | null;
};

export function parseGradleReleaseMetadata(source: string): ReleaseMetadata;
export function parsePlayMaxVersionCode(value: unknown): number | null;
export function assessAndroidReleaseSource(input: {
  expectedSourceCommit: string | null;
  actualSourceCommit: string;
  sourceClean: boolean;
  versionCode: number | null;
  playMaxVersionCode: number | null;
}): {
  ready: boolean;
  checks: Array<{ id: string; pass: boolean; detail: string }>;
};
export function parseBundletoolManifest(source: string): ReleaseMetadata;
export function normalizeSha256(value: unknown): string | null;
export function parseKeytoolCertificate(source: string): CertificateMetadata;
export function jarsignerOutputIsComplete(output: unknown, exitStatus?: number): boolean;
export function assessAndroidBundle(input: {
  artifact: ReleaseMetadata & { sha256: string };
  gradle: ReleaseMetadata;
  jarSignatureValid: boolean;
  bundletoolValid: boolean;
  certificate: CertificateMetadata;
  previousCertificate?: CertificateMetadata | null;
  expectedArtifactSha256?: string | null;
  expectedCertificateSha256?: string | null;
  playMaxVersionCode?: number | null;
  sourceCommit: string;
  sourceClean: boolean;
  validationTimeMs?: number;
}): {
  ready: boolean;
  checks: Array<{ id: string; pass: boolean; detail: string }>;
};
