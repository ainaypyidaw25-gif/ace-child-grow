import { describe, expect, it, vi } from 'vitest';
import type { RegisterSWOptions } from 'vite-plugin-pwa/types';
import { configureServiceWorker } from '../serviceWorker';
import { OFFLINE_MEDIA_CACHE } from '../offlineMediaStore';

function dependencies(native: boolean) {
  const applyUpdate = vi.fn(async () => undefined);
  return {
    isNative: () => native,
    getRegistrations: vi.fn(async () => [
      { unregister: vi.fn(async () => true) },
      { unregister: vi.fn(async () => true) },
    ]),
    cacheKeys: vi.fn(async () => ['workbox-shell', 'public-educational-content', OFFLINE_MEDIA_CACHE]),
    deleteCache: vi.fn(async () => true),
    register: vi.fn((options?: RegisterSWOptions) => {
      void options;
      return applyUpdate;
    }),
    applyUpdate,
  };
}

describe('configureServiceWorker', () => {
  it('registers offline support for the website', async () => {
    const deps = dependencies(false);

    await configureServiceWorker(deps);

    expect(deps.register).toHaveBeenCalledWith(expect.objectContaining({
      immediate: true,
      onNeedRefresh: expect.any(Function),
    }));
    expect(deps.getRegistrations).not.toHaveBeenCalled();
    expect(deps.deleteCache).not.toHaveBeenCalled();

    const options = deps.register.mock.calls[0][0]!;
    options.onNeedRefresh?.();
    options.onNeedRefresh?.();
    await Promise.resolve();
    expect(deps.applyUpdate).toHaveBeenCalledOnce();
    expect(deps.applyUpdate).toHaveBeenCalledWith(true);
  });

  it('removes only service-worker caches inside the native app', async () => {
    const deps = dependencies(true);
    const registrations = await deps.getRegistrations();
    deps.getRegistrations.mockClear();

    await configureServiceWorker({
      ...deps,
      getRegistrations: vi.fn(async () => registrations),
    });

    expect(deps.register).not.toHaveBeenCalled();
    expect(registrations[0].unregister).toHaveBeenCalledOnce();
    expect(registrations[1].unregister).toHaveBeenCalledOnce();
    expect(deps.deleteCache).toHaveBeenCalledTimes(2);
    expect(deps.deleteCache).toHaveBeenCalledWith('workbox-shell');
    expect(deps.deleteCache).toHaveBeenCalledWith('public-educational-content');
    expect(deps.deleteCache).not.toHaveBeenCalledWith(OFFLINE_MEDIA_CACHE);
  });
});
