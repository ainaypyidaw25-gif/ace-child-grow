import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider, documentLang } from '../../app/LocaleContext';
import { LegalPage } from '../LegalPage';

// ACG-I18N-001: these are the only screens an unauthenticated visitor can
// land on (Google Play/App Store policy links, a shared URL). Before this
// fix the body text was always Myanmar regardless of the saved locale, so a
// parent who had switched the app to English — and whose <html lang> the
// browser/AT already trusts as "en" — saw a page that both looked untranslated
// and mismatched the language the document declared.

afterEach(() => {
  cleanup();
  localStorage.clear();
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

  // Fix 7 (production audit fix plan): the Terms of Service draft must never
  // read as a finished, binding document until the owner has reviewed it.
  it('shows the terms draft with the not-yet-binding notice, in both locales', () => {
    renderLegal('terms');
    expect(screen.getByRole('heading', { name: 'ဝန်ဆောင်မှုစည်းမျဉ်းများ' })).toBeTruthy();
    expect(screen.getByRole('note').textContent).toMatch(/မူကြမ်း/);

    fireEvent.click(screen.getByRole('button', { name: 'English' }));

    expect(screen.getByRole('heading', { name: 'Terms of Service' })).toBeTruthy();
    expect(screen.getByRole('note').textContent).toMatch(/draft/i);
    expect(screen.getByText(/Refunds/)).toBeTruthy();
  });
});
