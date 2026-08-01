import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { useEffect } from 'react';

const PRODUCTION_APP_ORIGIN = 'https://child.acegroup.com.mm';

export function isGooglePlayBuild(): boolean {
  return Capacitor.getPlatform() === 'android';
}

export function resolveAuthRedirectUrl(
  isNative: boolean,
  currentOrigin: string,
  currentPath = '',
): string {
  const origin = isNative ? PRODUCTION_APP_ORIGIN : currentOrigin;
  return currentPath ? new URL(currentPath, `${origin}/`).toString() : origin;
}

export function getAuthRedirectUrl(currentPath = ''): string {
  return resolveAuthRedirectUrl(
    Capacitor.isNativePlatform(),
    window.location.origin,
    currentPath,
  );
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
