import { Capacitor } from '@capacitor/core';
import { registerSW } from 'virtual:pwa-register';

type ServiceWorkerRegistrationLike = { unregister: () => Promise<boolean> };

type ServiceWorkerDependencies = {
  isNative: () => boolean;
  getRegistrations: () => Promise<readonly ServiceWorkerRegistrationLike[]>;
  cacheKeys: () => Promise<string[]>;
  deleteCache: (key: string) => Promise<boolean>;
  register: typeof registerSW;
};

function browserDependencies(): ServiceWorkerDependencies {
  return {
    isNative: () => Capacitor.isNativePlatform(),
    getRegistrations: () => navigator.serviceWorker?.getRegistrations() ?? Promise.resolve([]),
    cacheKeys: () => globalThis.caches?.keys() ?? Promise.resolve([]),
    deleteCache: (key) => globalThis.caches?.delete(key) ?? Promise.resolve(false),
    register: registerSW,
  };
}

/**
 * Keep the installable website offline-ready, but never run the website service
 * worker inside the packaged Android WebView. A stale service worker can mix an
 * old application shell with newly bundled lazy chunks and leave routes blank.
 *
 * Native cleanup intentionally touches only Service Worker/CacheStorage data.
 * Authentication, child profiles, health records and IndexedDB are preserved.
 */
export async function configureServiceWorker(
  dependencies: ServiceWorkerDependencies = browserDependencies(),
): Promise<void> {
  if (!dependencies.isNative()) {
    dependencies.register({ immediate: true });
    return;
  }

  const [registrations, cacheKeys] = await Promise.all([
    dependencies.getRegistrations(),
    dependencies.cacheKeys(),
  ]);

  await Promise.all([
    ...registrations.map((registration) => registration.unregister()),
    ...cacheKeys.map((key) => dependencies.deleteCache(key)),
  ]);
}
