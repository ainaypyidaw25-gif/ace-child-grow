import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  createNativeAuthCallbackHandler,
  createNativeUrlRelay,
  getOAuthVerifierStorageKey,
  launchNativeOAuth,
  parseNativeAuthCallback,
  resolveAuthRedirectUrl,
} from '../platform';

describe('native authentication redirects', () => {
  it('keeps browser sign-in on the current web origin', () => {
    expect(resolveAuthRedirectUrl(false, 'https://preview.example.com')).toBe(
      'https://preview.example.com',
    );
  });

  it('uses the verified production app link instead of the Capacitor localhost origin', () => {
    expect(resolveAuthRedirectUrl(true, 'https://localhost')).toBe(
      'https://child.acegroup.com.mm',
    );
  });

  it('preserves an invite path, query, and hash on the verified app link', () => {
    expect(
      resolveAuthRedirectUrl(
        true,
        'https://localhost',
        '/admin/accept-invite?invite=abc#review',
      ),
    ).toBe('https://child.acegroup.com.mm/admin/accept-invite?invite=abc#review');
  });

  it('keeps SignIn from sending native OAuth back to window.location.origin', () => {
    const signInSource = readFileSync('src/screens/SignIn.tsx', 'utf8');
    expect(signInSource).toContain('redirectTo: getAuthRedirectUrl()');
    expect(signInSource).toContain('getAuthRedirectUrl(redirectPath)');
    expect(signInSource).toContain('startOAuthSignIn(');
    expect(signInSource).not.toContain('redirectTo: window.location.origin');
  });

  it('uses the same namespaced verifier key as Convex Auth', () => {
    expect(getOAuthVerifierStorageKey('https://kind-otter-123.convex.cloud')).toBe(
      '__convexAuthOAuthVerifier_httpskindotter123convexcloud',
    );
  });

  it('stores the one-time verifier before opening OAuth in the in-app browser', async () => {
    const events: string[] = [];
    const values = new Map<string, string>();
    await launchNativeOAuth({
      provider: 'apple',
      redirectTo: 'https://child.acegroup.com.mm/profile',
      storageNamespace: 'https://kind-otter-123.convex.cloud',
      storage: {
        setItem(key, value) { events.push(`store:${key}`); values.set(key, value); },
        removeItem(key) { events.push(`remove:${key}`); values.delete(key); },
      },
      requestOAuth: async (provider, params) => {
        expect(provider).toBe('apple');
        expect(params).toEqual({ redirectTo: 'https://child.acegroup.com.mm/profile' });
        return { redirect: 'https://appleid.apple.com/auth', verifier: 'one-time-verifier' };
      },
      openBrowser: async (url) => { events.push(`open:${url}`); },
    });

    const key = '__convexAuthOAuthVerifier_httpskindotter123convexcloud';
    expect(values.get(key)).toBe('one-time-verifier');
    expect(events).toEqual([
      `remove:${key}`,
      `store:${key}`,
      'open:https://appleid.apple.com/auth',
    ]);
  });

  it('clears the verifier when the native browser cannot open', async () => {
    const values = new Map<string, string>();
    await expect(launchNativeOAuth({
      provider: 'google',
      redirectTo: 'https://child.acegroup.com.mm',
      storageNamespace: 'convex',
      storage: {
        setItem(key, value) { values.set(key, value); },
        removeItem(key) { values.delete(key); },
      },
      requestOAuth: async () => ({ redirect: 'https://accounts.google.com', verifier: 'verifier' }),
      openBrowser: async () => { throw new Error('unavailable'); },
    })).rejects.toThrow('unavailable');
    expect(values.size).toBe(0);
  });

  it('keeps App Store sign-in first-party while preserving web OAuth and its credential fallback', () => {
    const signInSource = readFileSync('src/screens/SignIn.tsx', 'utf8');
    expect(signInSource).toContain('useState(appStoreBuild || isStaffInvite)');
    expect(signInSource).toContain('setShowCredentialForm(appStoreBuild)');
    expect(signInSource).toContain("!appStoreBuild && (flow === 'signIn' || flow === 'signUp')");
    expect(signInSource).toContain("!appStoreBuild && flow === 'signIn' && !showEmailCredentialFields");
    expect(signInSource).toContain("continueWithOAuth('apple')");
    expect(signInSource).toContain("continueWithOAuth('google')");
    expect(signInSource).toContain('Apple အကောင့်ဖြင့် ဆက်လုပ်မည်');
    expect(signInSource).toContain('Google အကောင့်ဖြင့် ဆက်လုပ်မည်');
    expect(signInSource).toContain('အီးမေးလ်နှင့် PIN/စကားဝှက်ဖြင့် ဝင်မည်');
  });

  it('accepts only the exact production App Link and removes the one-time code', () => {
    expect(parseNativeAuthCallback('https://child.acegroup.com.mm/admin?invite=abc&code=secret#review')).toEqual({
      code: 'secret',
      relativeUrl: '/admin?invite=abc#review',
    });
    expect(parseNativeAuthCallback('http://child.acegroup.com.mm/?code=secret')).toBeNull();
    expect(parseNativeAuthCallback('https://child.acegroup.com.mm.evil.example/?code=secret')).toBeNull();
    expect(parseNativeAuthCallback('https://child.acegroup.com.mm:444/?code=secret')).toBeNull();
  });

  it('exchanges a callback once and preserves path, query, and hash', async () => {
    const calls: Array<[string | undefined, { code: string }]> = [];
    const locations: string[] = [];
    const events: string[] = [];
    const handle = createNativeAuthCallbackHandler({
      signInWithCode: async (provider, params) => { events.push('sign-in'); calls.push([provider, params]); },
      replaceLocation: (relativeUrl) => { events.push('navigate'); locations.push(relativeUrl); },
      closeBrowser: async () => { events.push('close-browser'); },
    });

    const url = 'https://child.acegroup.com.mm/admin/accept-invite?invite=abc&code=one-time#review';
    await expect(handle(url)).resolves.toBe('signed-in');
    await expect(handle(url)).resolves.toBe('duplicate');
    expect(calls).toEqual([[undefined, { code: 'one-time' }]]);
    expect(locations).toEqual(['/admin/accept-invite?invite=abc#review']);
    expect(events).toEqual(['close-browser', 'navigate', 'sign-in']);
  });

  it('routes a trusted App Link without attempting code exchange', async () => {
    let signInCalls = 0;
    let location = '';
    const handle = createNativeAuthCallbackHandler({
      signInWithCode: async () => { signInCalls += 1; },
      replaceLocation: (relativeUrl) => { location = relativeUrl; },
    });

    await expect(handle('https://child.acegroup.com.mm/privacy?lang=mm#top')).resolves.toBe('navigated');
    expect(signInCalls).toBe(0);
    expect(location).toBe('/privacy?lang=mm#top');
  });

  it('buffers a cold-start URL and delivers warm URLs immediately', () => {
    const relay = createNativeUrlRelay();
    const received: string[] = [];
    relay.publish('cold');
    const unsubscribe = relay.subscribe((url) => received.push(url));
    relay.publish('warm');
    unsubscribe();
    relay.publish('after-unsubscribe');
    expect(received).toEqual(['cold', 'warm']);
  });
});
