import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SEVEN_STORIES_ARTIFACT } from '../../../convex/lib/aiSevenStoriesPublication20260910Artifact';
import { LocaleProvider } from '../../app/LocaleContext';
import { ContentDetail } from '../../screens/ContentDetail';
import { AI_BADGE, AI_DISCLOSURE } from '../../domain/content/aiPublication';

const state = vi.hoisted(() => ({
  remote: null as unknown,
  sources: [] as Array<{ sourceId: string; org: string; title: string; url: string }>,
  offline: [] as unknown[],
}));
vi.mock('convex/react', () => ({
  useQuery: (_query: unknown, args: { audience?: string }) => args.audience === 'parent'
    ? state.remote : { allowed: true, sources: state.sources },
}));
vi.mock('../../app/useOfflineLibrary', () => ({
  useDownloadedLibrary: () => ({ records: state.offline, loaded: true }),
}));

function show(slug: string, locale: 'en' | 'mm') {
  localStorage.setItem('ace-locale', locale);
  return render(<MemoryRouter initialEntries={[`/content/${slug}`]}>
    <LocaleProvider><Routes><Route path="/content/:slug" element={<ContentDetail />} /></Routes></LocaleProvider>
  </MemoryRouter>);
}

// Synthetic UI contract fixtures. Exact production copy hashes are verified by
// the independent release tests, not inferred from this rendering test.
describe('seven-story AI lane parent rendering contract', () => {
  afterEach(() => { cleanup(); localStorage.removeItem('ace-locale'); state.offline = []; });

  it.each(SEVEN_STORIES_ARTIFACT.targets)('keeps every source and AI disclosure for $slug in both languages', (target) => {
    state.sources = target.sources.map(source => ({
      sourceId: source.sourceId, org: 'Fixture publisher', title: source.sourceId, url: source.sourceUrl,
    }));
    state.remote = { staff: false, media: [], item: {
      _id: target.slug, slug: target.slug, type: 'story', titleEn: target.slug, titleMm: target.slug,
      clinicalStatus: 'clinical_review', publicationLane: 'ai_audited',
      data: { body: { en: 'Fictional shared-reading fixture.', mm: 'အတူဖတ်ရန် စိတ်ကူးယဉ်ပုံပြင်။' } },
    } };
    for (const locale of ['en', 'mm'] as const) {
      const view = show(target.slug, locale);
      const disclosure = screen.getByTestId('ai-publication-disclosure');
      expect(disclosure).toHaveTextContent(AI_BADGE[locale]);
      expect(disclosure).toHaveTextContent(AI_DISCLOSURE[locale]);
      const references = screen.getByTestId('content-references');
      expect(within(references).getAllByRole('link')).toHaveLength(target.sources.length);
      for (const source of target.sources) {
        expect(within(references).getByText(source.sourceId)).toBeVisible();
        expect(within(references).getAllByRole('link').some(link => link.getAttribute('href') === source.sourceUrl)).toBe(true);
      }
      expect(document.querySelector('audio')).toBeNull();
      view.unmount();
    }
  });

  it('does not display a cached AI story when live production withdraws access', () => {
    const slug = 'st_little_seed';
    state.offline = [{ _id: slug, slug, type: 'story', titleEn: 'Withdrawn cached story', titleMm: 'Cached',
      clinicalStatus: 'clinical_review', publicationLane: 'ai_audited', data: { body: { en: 'Cached secret body', mm: 'Cached' } } }];
    state.remote = { restricted: true };
    show(slug, 'en');
    expect(screen.getByText('This content is currently unavailable.')).toBeVisible();
    expect(screen.queryByText('Cached secret body')).toBeNull();
    expect(screen.queryByTestId('ai-publication-disclosure')).toBeNull();
    expect(screen.queryByTestId('story-illustration')).toBeNull();
  });
});
