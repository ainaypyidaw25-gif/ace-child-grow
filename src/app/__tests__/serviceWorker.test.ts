import { describe, expect, it, vi } from 'vitest';
import { configureServiceWorker } from '../serviceWorker';

function dependencies(native: boolean) {
  return {
    isNative: () => native,
    getRegistrations: vi.fn(async () => [
      { unregister: vi.fn(async () => true) },
      { unregister: vi.fn(async () => true) },
    ]),
    cacheKeys: vi.fn(async () => ['workbox-shell', 'public-educational-content']),
    deleteCache: vi.fn(async () => true),
    register: vi.fn(() => vi.fn()),
  };
}

describe('configureServiceWorker', () => {
  it('registers offline support for the website', async () => {
    const deps = dependencies(false);

    await configureServiceWorker(deps);

    expect(deps.register).toHaveBeenCalledWith({ immediate: true });
    expect(deps.getRegistrations).not.toHaveBeenCalled();
    expect(deps.deleteCache).not.toHaveBeenCalled();
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
  });
});
