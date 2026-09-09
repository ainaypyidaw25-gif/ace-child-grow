export type AndroidReadinessInputs = {
  bundle: string;
  bundletool: string;
  previousBundle: string;
  playMaxVersionCode: number;
  expectedSha256: string;
  expectedCertSha256: string;
  gradle: string;
};

export function parseAndroidReadinessInputs(value: unknown): AndroidReadinessInputs;
export function readAndroidReadinessInputs(path: unknown): AndroidReadinessInputs;
export function androidValidatorArgs(inputs: AndroidReadinessInputs): string[];
