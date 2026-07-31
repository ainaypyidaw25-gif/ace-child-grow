import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ReviewerGuideDemo } from './ReviewerGuideDemo';
import '../../src/index.css';

// Entry point for the silent reviewer-training recording ONLY. Built by
// vite.harness.config.ts alongside the layout harness; never part of the app.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReviewerGuideDemo />
  </StrictMode>,
);
