import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider, documentLang } from '../../app/LocaleContext';
import {
  LEGAL_TERMS_TEXT_SHA256,
  type LegalTermsRelease,
} from '../../domain/legalRelease';
import { LegalPage, legalTermsReleaseLabel } from '../LegalPage';

const paymentCapabilities = vi.hoisted(() => ({
  manualTransferAvailable: false,
  mmpayProductionAvailable: false,
}));

vi.mock('convex/react', () => ({
  useQuery: () => paymentCapabilities,
}));

// ACG-I18N-001: these are the only screens an unauthenticated visitor can
// land on (Google Play/App Store policy links, a shared URL). Before this
// fix the body text was always Myanmar regardless of the saved locale, so a
// parent who had switched the app to English — and whose <html lang> the
// browser/AT already trusts as "en" — saw a page that both looked untranslated
// and mismatched the language the document declared.

afterEach(() => {
  cleanup();
  localStorage.clear();
  paymentCapabilities.manualTransferAvailable = false;
  paymentCapabilities.mmpayProductionAvailable = false;
});

function renderLegal(kind: 'privacy' | 'account-deletion' | 'terms' | 'support') {
  return render(
    <MemoryRouter>
      <LocaleProvider>
        <LegalPage kind={kind} />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

describe('LegalPage locale correctness', () => {
  it('renders privacy content in Myanmar by default, matching <html lang>', () => {
    renderLegal('privacy');
    expect(screen.getByRole('heading', { name: 'ကိုယ်ရေးအချက်အလက် မူဝါဒ' })).toBeTruthy();
    expect(screen.getByText(/စုဆောင်းသည့်အချက်အလက်/)).toBeTruthy();
    expect(document.documentElement.lang).toBe(documentLang('mm'));
  });

  it('renders privacy content in English once the saved locale is English', () => {
    localStorage.setItem('ace-locale', 'en');
    renderLegal('privacy');
    expect(screen.getByRole('heading', { name: 'Privacy Policy' })).toBeTruthy();
    expect(screen.getByText(/Information we collect/)).toBeTruthy();
    expect(document.documentElement.lang).toBe(documentLang('en'));
  });

  it('renders account-deletion content in Myanmar by default', () => {
    renderLegal('account-deletion');
    expect(screen.getByRole('heading', { name: 'ACE Child Grow အကောင့် ဖျက်ရန်' })).toBeTruthy();
    expect(document.documentElement.lang).toBe(documentLang('mm'));
  });

  it('renders a functional public support page in both locales', () => {
    renderLegal('support');
    expect(screen.getByRole('heading', { name: 'ACE Child Grow အကူအညီ' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'admin-ace@acegroup.com.mm' })).toHaveAttribute('href', expect.stringContaining('mailto:'));
    expect(screen.getByText(/PIN၊ စကားဝှက်/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(screen.getByRole('heading', { name: 'ACE Child Grow Support' })).toBeTruthy();
    expect(screen.getByText(/Medical emergencies/)).toBeTruthy();
  });

  it('toggling the language switches body content and <html lang> together', () => {
    renderLegal('privacy');
    expect(document.documentElement.lang).toBe(documentLang('mm'));

    fireEvent.click(screen.getByRole('button', { name: 'English' }));

    expect(screen.getByRole('heading', { name: 'Privacy Policy' })).toBeTruthy();
    expect(screen.getByText(/Information we collect/)).toBeTruthy();
    expect(document.documentElement.lang).toBe(documentLang('en'));
  });

  it('shows the Owner-approved version and future effective date in both locales', () => {
    renderLegal('terms');
    expect(screen.getByRole('heading', { name: 'ဝန်ဆောင်မှုစည်းမျဉ်းများ' })).toBeTruthy();
    expect(screen.queryByRole('note')).toBeNull();
    expect(screen.getByText(/Version — terms-2026-09-11-v1/)).toBeTruthy();
    expect(screen.getByText(/အကျိုးသက်ရောက်သည့်နေ့ — 2026-09-11/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'English' }));

    expect(screen.getByRole('heading', { name: 'Terms of Service' })).toBeTruthy();
    expect(screen.queryByRole('note')).toBeNull();
    expect(screen.getByText(/Version — terms-2026-09-11-v1/)).toBeTruthy();
    expect(screen.getByText(/Effective date — 2026-09-11/)).toBeTruthy();
    expect(screen.getByText(/Refunds/)).toBeTruthy();
  });

  it('shows a version and effective date only for an exactly approved published release', () => {
    const published: LegalTermsRelease = {
      status: 'published',
      version: 'terms-2026-09-15-v1',
      effectiveDate: '2026-09-15',
      publishedAt: '2026-09-14T12:00:00.000Z',
      textDigest: LEGAL_TERMS_TEXT_SHA256,
      approvalReceipt: {
        receiptId: 'test-terms-approval-2026-09-15-v1',
        approverId: 'test_owner_stable_id',
        authority: 'owner',
        approvedAt: '2026-09-14T11:30:00.000Z',
        version: 'terms-2026-09-15-v1',
        effectiveDate: '2026-09-15',
        textDigest: LEGAL_TERMS_TEXT_SHA256,
      },
    };
    expect(legalTermsReleaseLabel('en', published))
      .toBe('Version — terms-2026-09-15-v1 · Effective date — 2026-09-15');
    expect(legalTermsReleaseLabel('mm', published))
      .toBe('Version — terms-2026-09-15-v1 · အကျိုးသက်ရောက်သည့်နေ့ — 2026-09-15');

    expect(legalTermsReleaseLabel('en', {
      ...published,
      approvalReceipt: null,
    })).toBe('Draft version — terms-2026-09-15-v1 · Effective date — not approved');
  });

  it('does not advertise manual transfer when no method is active', () => {
    localStorage.setItem('ace-locale', 'en');
    renderLegal('terms');

    expect(screen.getByText(/New paid purchases are temporarily unavailable/)).toBeTruthy();
    expect(screen.queryByText(/Myan Myan Pay/)).toBeNull();
    expect(screen.queryByText(/manual-transfer proof/)).toBeNull();
    expect(screen.queryByText(/bank\/wallet transfer/)).toBeNull();
  });

  it('describes manual proof review only when an active method exists', () => {
    paymentCapabilities.manualTransferAvailable = true;
    localStorage.setItem('ace-locale', 'en');
    renderLegal('terms');

    expect(screen.getByText(/Staff review the submitted proof/)).toBeTruthy();
  });

  it('advertises Myan Myan Pay only when the production capability is valid', () => {
    paymentCapabilities.mmpayProductionAvailable = true;
    localStorage.setItem('ace-locale', 'en');
    renderLegal('terms');

    expect(screen.getByText(/production Myan Myan Pay/)).toBeTruthy();
  });
});
