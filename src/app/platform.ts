import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { useEffect } from 'react';

export function isGooglePlayBuild(): boolean {
  return import.meta.env.VITE_DISTRIBUTION === 'play-store'
    || Capacitor.getPlatform() === 'android';
}

export function isAppleAppStoreBuild(): boolean {
  return import.meta.env.VITE_DISTRIBUTION === 'app-store'
    || Capacitor.getPlatform() === 'ios';
}

export function isNativeStoreBuild(): boolean {
  const distribution = import.meta.env.VITE_DISTRIBUTION;
  const platform = Capacitor.getPlatform();
  return distribution === 'app-store'
    || distribution === 'play-store'
    || platform === 'android'
    || platform === 'ios';
}

const NATIVE_STORE_FREE_FEATURES = new Set([
  'child_profile',
  'milestones',
  'activities',
  'growth',
  'sleep',
  'learning_library',
]);

export function isFeatureAvailableOnCurrentPlatform(
  features: readonly string[],
  feature: string,
): boolean {
  return features.includes(feature)
    && (!isNativeStoreBuild() || NATIVE_STORE_FREE_FEATURES.has(feature));
}

export function effectivePlanKeyForCurrentPlatform<T extends string>(planKey: T): T | 'free' {
  return isNativeStoreBuild() ? 'free' : planKey;
}

export function nativeAuthRedirectUrl(): string {
  return Capacitor.isNativePlatform()
    ? 'https://child.acegroup.com.mm'
    : window.location.origin;
}

export function useNativeDeepLinks(): void {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;
    const open = (rawUrl?: string) => {
      if (!rawUrl) return;
      try {
        const url = new URL(rawUrl);
        if (url.protocol !== 'https:' || url.hostname !== 'child.acegroup.com.mm') return;
        window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
      } catch {
        // Ignore malformed external intents instead of navigating the WebView.
      }
    };
    void CapacitorApp.getLaunchUrl().then((launch) => open(launch?.url));
    const listener = CapacitorApp.addListener('appUrlOpen', ({ url }) => open(url));
    return () => { void listener.then((handle) => handle.remove()); };
  }, []);
}
