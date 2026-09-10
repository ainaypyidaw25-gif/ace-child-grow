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
  status: 'draft',
  version: 'draft-2026-08-05',
  effectiveDate: null,
  publishedAt: null,
  textDigest: LEGAL_TERMS_TEXT_SHA256,
  approvalReceipt: null,
} as const;
