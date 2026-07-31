import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LocaleProvider } from '../../src/app/LocaleContext';
import { OwnerPriorityHarness } from './OwnerPriorityHarness';
import '../../src/index.css';

// Entry point for the layout-test harness ONLY. Built by vite.harness.config.ts
// into dist-harness/ and served to Playwright on its own port. The production
// build (vite.config.ts → dist/) never includes this file.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider>
      <OwnerPriorityHarness />
    </LocaleProvider>
  </StrictMode>,
);
