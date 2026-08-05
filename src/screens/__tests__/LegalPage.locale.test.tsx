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

function renderLegal(kind: 'privacy' | 'account-deletion') {
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

  it('toggling the language switches body content and <html lang> together', () => {
    renderLegal('privacy');
    expect(document.documentElement.lang).toBe(documentLang('mm'));

    fireEvent.click(screen.getByRole('button', { name: 'English' }));

    expect(screen.getByRole('heading', { name: 'Privacy Policy' })).toBeTruthy();
    expect(screen.getByText(/Information we collect/)).toBeTruthy();
    expect(document.documentElement.lang).toBe(documentLang('en'));
  });
});
