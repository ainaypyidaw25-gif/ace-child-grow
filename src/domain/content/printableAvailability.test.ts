import { describe, expect, it } from 'vitest';
import { approvedPrintablePayload } from './printableAvailability';

describe('published printable payload availability', () => {
  it('rejects cover illustrations, placeholders and unreviewed PDFs', () => {
    expect(approvedPrintablePayload([
      { kind: 'illustration', reviewStatus: 'approved', url: '/cover.webp' },
      { kind: 'pdf', placeholder: true, reviewStatus: 'approved', url: '/fake.pdf' },
      { kind: 'pdf', reviewStatus: 'in_review', url: '/draft.pdf' },
    ])).toBeUndefined();
  });

  it('accepts only a reviewed non-placeholder PDF or download payload', () => {
    const pdf = { kind: 'pdf', placeholder: false, reviewStatus: 'approved', url: '/reviewed.pdf' };
    expect(approvedPrintablePayload([pdf])).toBe(pdf);
  });
});
