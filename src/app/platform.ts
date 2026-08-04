import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useEffect } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';

const PRODUCTION_APP_ORIGIN = 'https://child.acegroup.com.mm';
export const NATIVE_AUTH_CALLBACK_ERROR_EVENT = 'ace-native-auth-callback-error';

type NativeUrlListener = (url: string) => void;
type NativeCodeSignIn = (
  provider: string | undefined,
  params: { code: string },
) => Promise<unknown>;

export type NativeAuthCallback = {
  code: string | null;
  relativeUrl: string;
};

let nativeCaptureStarted = false;

export function createNativeUrlRelay() {
  const listeners = new Set<NativeUrlListener>();
  const pendingUrls: string[] = [];
  return {
    publish(rawUrl: string) {
      if (listeners.size === 0) {
        pendingUrls.push(rawUrl);
        return;
      }
      for (const listener of listeners) listener(rawUrl);
    },
    subscribe(listener: NativeUrlListener) {
      listeners.add(listener);
      const queued = pendingUrls.splice(0, pendingUrls.length);
      for (const url of queued) listener(url);
      return () => listeners.delete(listener);
    },
  };
}

const nativeUrlRelay = createNativeUrlRelay();

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

export function parseNativeAuthCallback(rawUrl: string): NativeAuthCallback | null {
  try {
    const url = new URL(rawUrl);
    if (url.origin !== PRODUCTION_APP_ORIGIN) return null;
    const code = url.searchParams.get('code');
    url.searchParams.delete('code');
    return {
      code,
      relativeUrl: `${url.pathname}${url.search}${url.hash}`,
    };
  } catch {
    return null;
  }
}

function publishNativeUrl(rawUrl?: string): void {
  if (!rawUrl) return;
  if (!parseNativeAuthCallback(rawUrl)) return;
  nativeUrlRelay.publish(rawUrl);
}

// Start listening before React (and therefore ConvexAuthProvider) mounts. This
// prevents a cold-start App Link from racing provider initialization.
export function startNativeDeepLinkCapture(): void {
  if (nativeCaptureStarted || !Capacitor.isNativePlatform()) return;
  nativeCaptureStarted = true;
  void CapacitorApp.addListener('appUrlOpen', ({ url }) => publishNativeUrl(url));
  void CapacitorApp.getLaunchUrl().then((launch) => publishNativeUrl(launch?.url));
}

export function subscribeToNativeUrls(listener: NativeUrlListener): () => void {
  return nativeUrlRelay.subscribe(listener);
}

export function createNativeAuthCallbackHandler(options: {
  signInWithCode: NativeCodeSignIn;
  replaceLocation: (relativeUrl: string) => void;
}) {
  const consumedCodes = new Set<string>();
  return async (rawUrl: string): Promise<'ignored' | 'navigated' | 'duplicate' | 'signed-in'> => {
    const callback = parseNativeAuthCallback(rawUrl);
    if (!callback) return 'ignored';

    if (callback.code && consumedCodes.has(callback.code)) return 'duplicate';
    if (callback.code) consumedCodes.add(callback.code);

    options.replaceLocation(callback.relativeUrl);
    if (!callback.code) return 'navigated';

    await options.signInWithCode(undefined, { code: callback.code });
    return 'signed-in';
  };
}

export function useNativeDeepLinks(): void {
  const { signIn } = useAuthActions();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;
    const handle = createNativeAuthCallbackHandler({
      signInWithCode: signIn as NativeCodeSignIn,
      replaceLocation(relativeUrl) {
        window.history.replaceState({}, '', relativeUrl);
        window.dispatchEvent(new PopStateEvent('popstate'));
      },
    });
    return subscribeToNativeUrls((url) => {
      void handle(url).catch(() => {
        window.dispatchEvent(new Event(NATIVE_AUTH_CALLBACK_ERROR_EVENT));
      });
    });
  }, [signIn]);
}
