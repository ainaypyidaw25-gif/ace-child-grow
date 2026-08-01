import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { LocaleProvider, useLocale } from './app/LocaleContext';
import { AppStateProvider } from './app/AppState';
import { App } from './app/App';
import { installChunkRecovery } from './app/chunkRecovery';
import { configureServiceWorker } from './app/serviceWorker';
import { ScreenErrorBoundary } from './components/ScreenErrorBoundary';
import { convex } from './lib/convexClient';
import { startNativeDeepLinkCapture } from './app/platform';
import './index.css';

installChunkRecovery();
startNativeDeepLinkCapture();
void configureServiceWorker().catch((error: unknown) => {
  console.warn('ACE Child Grow service worker setup failed', error);
});

function RootApp() {
  const { locale } = useLocale();
  return (
    <ScreenErrorBoundary locale={locale}>
      <AppStateProvider>
        <App />
      </AppStateProvider>
    </ScreenErrorBoundary>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConvexAuthProvider client={convex}>
      <BrowserRouter>
        <LocaleProvider>
          <RootApp />
        </LocaleProvider>
      </BrowserRouter>
    </ConvexAuthProvider>
  </React.StrictMode>,
);
