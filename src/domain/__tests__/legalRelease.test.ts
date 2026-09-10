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

  it('binds the Owner-approved September 11 release to its recorded receipt', () => {
    expect(LEGAL_TERMS_RELEASE).toMatchObject({
      status: 'published',
      version: 'terms-2026-09-11-v1',
      effectiveDate: '2026-09-11',
      publishedAt: '2026-09-10T02:22:59.000Z',
      textDigest: LEGAL_TERMS_TEXT_SHA256,
      approvalReceipt: {
        receiptId: 'owner-chat-20260910-terms-20260911-v1',
        approverId: 'owner_lapyaewun',
        authority: 'owner',
        approvedAt: '2026-09-10T02:22:31.000Z',
        version: 'terms-2026-09-11-v1',
        effectiveDate: '2026-09-11',
        textDigest: LEGAL_TERMS_TEXT_SHA256,
      },
    });
  });
});
