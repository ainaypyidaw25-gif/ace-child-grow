import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { LocaleProvider } from './app/LocaleContext';
import { AppStateProvider } from './app/AppState';
import { App } from './app/App';
import { convex } from './lib/convexClient';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConvexAuthProvider client={convex}>
      <BrowserRouter>
        <LocaleProvider>
          <AppStateProvider>
            <App />
          </AppStateProvider>
        </LocaleProvider>
      </BrowserRouter>
    </ConvexAuthProvider>
  </React.StrictMode>,
);
