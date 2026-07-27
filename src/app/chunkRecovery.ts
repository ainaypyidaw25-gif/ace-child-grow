const CHUNK_RELOAD_KEY = 'ace:chunk-reload-at';
const CHUNK_RELOAD_COOLDOWN_MS = 60_000;

const CHUNK_LOAD_FAILURE =
  /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk\s+\S+\s+failed/i;

type ReloadStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function isChunkLoadFailure(reason: unknown): boolean {
  const message = reason instanceof Error ? reason.message : String(reason ?? '');
  return CHUNK_LOAD_FAILURE.test(message);
}

/**
 * Reload the application shell once when a deployment replaces hashed chunks
 * that an already-open tab still references. The cooldown prevents a broken
 * deployment or offline device from entering a reload loop.
 */
export function recoverStaleChunk(
  storage: ReloadStorage,
  reload: () => void,
  now = Date.now(),
): boolean {
  try {
    const previousReload = Number(storage.getItem(CHUNK_RELOAD_KEY) ?? 0);
    if (Number.isFinite(previousReload) && now - previousReload < CHUNK_RELOAD_COOLDOWN_MS) {
      return false;
    }
    storage.setItem(CHUNK_RELOAD_KEY, String(now));
  } catch {
    // Safari can deny sessionStorage in restrictive/private contexts. A reload
    // is still the only useful recovery; the event is rare and deployment-bound.
  }

  reload();
  return true;
}

export function installChunkRecovery(): () => void {
  const recover = (event: Event) => {
    event.preventDefault();
    recoverStaleChunk(window.sessionStorage, () => window.location.reload());
  };

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    if (isChunkLoadFailure(event.reason)) {
      recover(event);
    }
  };

  // Vite emits this event when a lazy import's hashed asset disappeared during
  // a deployment. The rejection listener covers Safari/WebKit variants that
  // surface only the underlying promise error.
  window.addEventListener('vite:preloadError', recover);
  window.addEventListener('unhandledrejection', onUnhandledRejection);

  return () => {
    window.removeEventListener('vite:preloadError', recover);
    window.removeEventListener('unhandledrejection', onUnhandledRejection);
  };
}
