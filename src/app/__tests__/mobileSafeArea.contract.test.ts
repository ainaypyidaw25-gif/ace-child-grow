import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// ACG-UX-004 / ACG-A11Y-001. These are CSS environment variables and ARIA
// attributes: jsdom does not compile Tailwind or evaluate env(), so a render
// test cannot observe them. Asserting on the source is the honest guard — it
// catches the regression (someone rewriting the header or the error line and
// dropping the inset/role) without pretending to verify the visual result,
// which stays a manual device check.

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const layout = read('src/components/Layout.tsx');
const bottomNav = read('src/components/BottomNav.tsx');
const indexHtml = read('index.html');
const addChild = read('src/screens/AddChild.tsx');
const consent = read('src/screens/Consent.tsx');

describe('mobile safe-area contract', () => {
  it('opts into viewport-fit=cover, which makes the insets mandatory', () => {
    expect(indexHtml).toContain('viewport-fit=cover');
  });

  it('keeps the sticky header clear of the notch / display cutout', () => {
    expect(layout).toContain('pt-[env(safe-area-inset-top)]');
  });

  it('keeps the header clear of rounded/landscape edges', () => {
    expect(layout).toContain('pl-[env(safe-area-inset-left)]');
    expect(layout).toContain('pr-[env(safe-area-inset-right)]');
  });

  it('still keeps the bottom nav above the home indicator', () => {
    expect(bottomNav).toContain('pb-[env(safe-area-inset-bottom)]');
  });
});

describe('form errors are announced to assistive technology', () => {
  it('announces the Add Child validation error', () => {
    expect(addChild).toMatch(/<p role="alert"[^>]*>⚠️ \{error\}/);
  });

  it('announces the consent failure', () => {
    expect(consent).toContain('role="alert"');
  });

  it('gives the gestational-age error in Myanmar as well as English', () => {
    // A Myanmar-only parent must not hit an English-only error during onboarding.
    expect(addChild).toContain('ကိုယ်ဝန်သက်တမ်းသည်');
  });
});
