import { useEffect, useState } from 'react';
import type { PluginListenerHandle } from '@capacitor/core';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';

function browserReportsOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine;
}

function initialOnlineStatus(): boolean {
  // Android WebView can keep navigator.onLine=true in airplane mode. Avoid a
  // misleading green flash until the native Network plugin answers.
  return Capacitor.isNativePlatform() ? false : browserReportsOnline();
}

/** Tracks real connectivity in native apps and browser connectivity on the web. */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(initialOnlineStatus);

  useEffect(() => {
    let cancelled = false;
    let nativeListener: PluginListenerHandle | undefined;
    const native = Capacitor.isNativePlatform();

    const apply = (connected: boolean) => {
      if (!cancelled) setOnline(connected);
    };

    const refresh = async () => {
      if (!browserReportsOnline()) {
        apply(false);
        return;
      }

      if (!native) {
        apply(true);
        return;
      }

      try {
        apply((await Network.getStatus()).connected);
      } catch {
        // If the plugin is unavailable in an older shell, retain the browser
        // fallback instead of leaving the app permanently marked offline.
        apply(browserReportsOnline());
      }
    };

    const handleBrowserChange = () => void refresh();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void refresh();
    };

    window.addEventListener('online', handleBrowserChange);
    window.addEventListener('offline', handleBrowserChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (native) {
      void Network.addListener('networkStatusChange', (status) => apply(status.connected))
        .then((handle) => {
          if (cancelled) void handle.remove();
          else nativeListener = handle;
        })
        .catch(() => undefined);
    }

    if (native) void refresh();

    return () => {
      cancelled = true;
      window.removeEventListener('online', handleBrowserChange);
      window.removeEventListener('offline', handleBrowserChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (nativeListener) void nativeListener.remove();
    };
  }, []);

  return online;
}
