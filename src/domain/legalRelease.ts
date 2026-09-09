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
  'sha256:8c63df782ff32554e41b981b2b6cabc4dc3759c3172d5ba7920d01b952de053a' as const;

export const LEGAL_TERMS_RELEASE: LegalTermsRelease = {
  status: 'draft',
  version: 'draft-2026-08-05',
  effectiveDate: null,
  publishedAt: null,
  textDigest: LEGAL_TERMS_TEXT_SHA256,
  approvalReceipt: null,
} as const;
