export type LegalTermsApprovalReceipt = Readonly<{
  receiptId: string;
  approverId: string;
  authority: 'owner' | 'legal_reviewer';
  approvedAt: string;
  version: string;
  effectiveDate: string;
  textDigest: string;
}>;

export type LegalTermsRelease = Readonly<{
  status: 'draft' | 'published';
  version: string;
  effectiveDate: string | null;
  publishedAt: string | null;
  textDigest: string;
  approvalReceipt: LegalTermsApprovalReceipt | null;
}>;

/**
 * SHA-256 of the exact src/screens/LegalPage.tsx bytes. A focused test binds
 * this value to the rendered bilingual Terms and every payment-wording branch.
 * It is evidence identity only; it is not an approval.
 */
export const LEGAL_TERMS_TEXT_SHA256 =
  'sha256:fcae6447dfadb4df67cc5b6a339aafeb143556b71c0a3bfe6b65e4b4d03cbc6b' as const;

export const LEGAL_TERMS_RELEASE: LegalTermsRelease = {
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
} as const;
