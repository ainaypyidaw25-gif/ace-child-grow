import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { LocaleProvider } from './app/LocaleContext';
import { AppStateProvider } from './app/AppState';
import { App } from './app/App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <LocaleProvider>
        <AppStateProvider>
          <App />
        </AppStateProvider>
      </LocaleProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
