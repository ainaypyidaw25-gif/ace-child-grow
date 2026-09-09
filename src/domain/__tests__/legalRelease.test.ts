import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  LEGAL_TERMS_RELEASE,
  LEGAL_TERMS_TEXT_SHA256,
} from '../legalRelease';

describe('paid-web Legal Terms release evidence', () => {
  it('binds the declared digest to the exact bilingual Terms source bytes', () => {
    const legalPagePath = resolve(process.cwd(), 'src/screens/LegalPage.tsx');
    const digest = createHash('sha256')
      .update(readFileSync(legalPagePath))
      .digest('hex');

    expect(`sha256:${digest}`).toBe(LEGAL_TERMS_TEXT_SHA256);
  });

  it('does not invent an approval receipt for the current draft', () => {
    expect(LEGAL_TERMS_RELEASE).toMatchObject({
      status: 'draft',
      version: 'draft-2026-08-05',
      effectiveDate: null,
      publishedAt: null,
      textDigest: LEGAL_TERMS_TEXT_SHA256,
      approvalReceipt: null,
    });
  });
});
