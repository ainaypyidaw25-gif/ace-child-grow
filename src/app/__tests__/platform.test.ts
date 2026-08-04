import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isAppleAppStoreBuild,
  isGooglePlayBuild,
  isNativeStoreBuild,
} from '../platform';

const runtime = vi.hoisted(() => ({ platform: 'web' }));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: () => runtime.platform,
    isNativePlatform: () => runtime.platform === 'ios' || runtime.platform === 'android',
  },
}));

describe('store distribution detection', () => {
  afterEach(() => {
    runtime.platform = 'web';
    vi.unstubAllEnvs();
  });

  it('keeps a normal web build out of store-only behavior', () => {
    expect(isAppleAppStoreBuild()).toBe(false);
    expect(isGooglePlayBuild()).toBe(false);
    expect(isNativeStoreBuild()).toBe(false);
  });

  it('recognizes an App Store distribution before the Capacitor runtime starts', () => {
    vi.stubEnv('VITE_DISTRIBUTION', 'app-store');

    expect(isAppleAppStoreBuild()).toBe(true);
    expect(isNativeStoreBuild()).toBe(true);
  });

  it('recognizes a Play Store distribution without changing Apple behavior', () => {
    vi.stubEnv('VITE_DISTRIBUTION', 'play-store');

    expect(isGooglePlayBuild()).toBe(true);
    expect(isAppleAppStoreBuild()).toBe(false);
    expect(isNativeStoreBuild()).toBe(true);
  });

  it('continues to recognize native iOS and Android at runtime', () => {
    runtime.platform = 'ios';
    expect(isAppleAppStoreBuild()).toBe(true);
    expect(isNativeStoreBuild()).toBe(true);

    runtime.platform = 'android';
    expect(isGooglePlayBuild()).toBe(true);
    expect(isNativeStoreBuild()).toBe(true);
  });
});
