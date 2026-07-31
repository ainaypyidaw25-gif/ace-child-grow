import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ParentGuideDemo } from './ParentGuideDemo';
import '../../src/index.css';

// Entry point for the silent parent how-to recording ONLY. Built by
// vite.harness.config.ts alongside the layout harness; never part of the app.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ParentGuideDemo />
  </StrictMode>,
);
