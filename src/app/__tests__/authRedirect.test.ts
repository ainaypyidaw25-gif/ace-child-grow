import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  createNativeAuthCallbackHandler,
  createNativeUrlRelay,
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
    expect(signInSource).toContain('redirectTo: getAuthRedirectUrl(redirectPath)');
    expect(signInSource).not.toContain('redirectTo: window.location.origin');
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
    const handle = createNativeAuthCallbackHandler({
      signInWithCode: async (provider, params) => { calls.push([provider, params]); },
      replaceLocation: (relativeUrl) => { locations.push(relativeUrl); },
    });

    const url = 'https://child.acegroup.com.mm/admin/accept-invite?invite=abc&code=one-time#review';
    await expect(handle(url)).resolves.toBe('signed-in');
    await expect(handle(url)).resolves.toBe('duplicate');
    expect(calls).toEqual([[undefined, { code: 'one-time' }]]);
    expect(locations).toEqual(['/admin/accept-invite?invite=abc#review']);
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
