import { Capacitor } from '@capacitor/core';
import { registerSW } from 'virtual:pwa-register';
import { OFFLINE_MEDIA_CACHE } from './offlineMediaStore';

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
 * Native cleanup removes only Service Worker caches. The dedicated educational
 * media download cache, authentication, child profiles, health records and
 * IndexedDB are preserved.
 */
export async function configureServiceWorker(
  dependencies: ServiceWorkerDependencies = browserDependencies(),
): Promise<void> {
  if (!dependencies.isNative()) {
    let updateStarted = false;
    const applyUpdate = dependencies.register({
      immediate: true,
      onNeedRefresh() {
        if (updateStarted) return;
        updateStarted = true;
        // Older releases used a prompt-based update flow without rendering a
        // prompt. Apply and reload immediately so users cannot remain trapped
        // on a stale sign-in screen after a production deployment.
        void Promise.resolve().then(() => applyUpdate(true));
      },
    });
    return;
  }

  const [registrations, cacheKeys] = await Promise.all([
    dependencies.getRegistrations(),
    dependencies.cacheKeys(),
  ]);

  await Promise.all([
    ...registrations.map((registration) => registration.unregister()),
    ...cacheKeys
      .filter((key) => key !== OFFLINE_MEDIA_CACHE)
      .map((key) => dependencies.deleteCache(key)),
  ]);
}
