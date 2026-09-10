import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { CONTENT_SEED } from '../../content/seed';
import { AI_BADGE, AI_DISCLOSURE } from '../../domain/content/aiPublication';
import { toOfflineRecord, type LibraryRowLike, type OfflineRecord } from '../../domain/offline/offlineLibrary';
import { ContentDetail } from '../../screens/ContentDetail';
import { ContentLibrary } from '../../screens/ContentLibrary';
import { Learn } from '../../screens/Learn';

const state = vi.hoisted(() => ({
  remote: undefined as unknown,
  records: [] as OfflineRecord[],
  items: [] as LibraryRowLike[],
}));

vi.mock('convex/react', () => ({ useQuery: () => state.remote }));
vi.mock('../../app/useOfflineLibrary', () => ({
  useDownloadedLibrary: () => ({ records: state.records, loaded: true }),
  useLibraryContent: ({ type }: { type: string }) => ({
    staff: false,
    items: state.items.filter((item) => item.type === type),
  }),
}));
vi.mock('../../app/AppState', () => ({ useAppState: () => ({ activeChild: null }) }));
vi.mock('../../app/useOnlineStatus', () => ({ useOnlineStatus: () => true }));

function mathItem(publicationLane: LibraryRowLike['publicationLane'] = 'ai_audited'): LibraryRowLike {
  const seed = CONTENT_SEED.find((row) => row.slug === 'lsn_early_math')!;
  return { ...seed, _id: 'math-row', publicationLane };
}

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/content/lsn_early_math']}>
      <LocaleProvider>
        <Routes><Route path="/content/:slug" element={<ContentDetail />} /></Routes>
      </LocaleProvider>
    </MemoryRouter>,
  );
}

describe('parent-facing AI publication disclosure', () => {
  beforeEach(() => {
    state.remote = undefined;
    state.records = [];
    state.items = [];
  });
  afterEach(() => { cleanup(); localStorage.removeItem('ace-locale'); });

  it.each([
    ['en', 'online'], ['mm', 'online'], ['en', 'offline'], ['mm', 'offline'],
  ] as const)('renders full %s AI-only disclosure in the %s lesson detail', async (locale, mode) => {
    localStorage.setItem('ace-locale', locale);
    const item = mathItem();
    if (mode === 'online') state.remote = { item, media: [], staff: false };
    else {
      state.records = [toOfflineRecord(item, 42)];
      expect(state.records[0].publicationLane).toBe('ai_audited');
    }
    renderDetail();
    const disclosure = await screen.findByTestId('ai-publication-disclosure');
    expect(disclosure).toBeVisible();
    expect(disclosure).toHaveTextContent(AI_BADGE[locale]);
    expect(disclosure).toHaveTextContent(AI_DISCLOSURE[locale]);
    expect(screen.getAllByText(AI_DISCLOSURE[locale])).toHaveLength(1);
    expect(screen.getByText(locale === 'en'
      ? /Math is not only in books\./
      : /သင်္ချာသည် စာအုပ်ထဲသာ မဟုတ်ပါ။/)).toBeVisible();
    // Prefix cleanup remains safe because a separate, unstripped disclosure is shown.
    expect(screen.queryByText(/^AI review notice —/)).not.toBeInTheDocument();
  });

  it.each(['human_reviewed', 'missing'] as const)('does not add AI provenance to a %s lane', (lane) => {
    localStorage.setItem('ace-locale', 'en');
    const item = mathItem('human_reviewed');
    if (lane === 'missing') delete item.publicationLane;
    state.remote = { item, media: [], staff: false };
    renderDetail();
    expect(screen.queryByTestId('ai-publication-disclosure')).not.toBeInTheDocument();
    expect(screen.queryByText(/^AI review notice —/)).not.toBeInTheDocument();
    expect(screen.getByText(/Math is not only in books\./)).toBeVisible();
  });

  it.each([
    ['en', 'library'], ['mm', 'library'], ['en', 'learn'], ['mm', 'learn'],
  ] as const)('labels only the AI-audited card in the %s %s list', (locale, page) => {
    localStorage.setItem('ace-locale', locale);
    state.items = [mathItem(), {
      ...mathItem('human_reviewed'), _id: 'human-row', slug: 'human-lesson',
      titleEn: 'Another lesson', titleMm: 'အခြား သင်ခန်းစာ',
    }];
    render(<MemoryRouter><LocaleProvider>
      {page === 'library' ? <ContentLibrary /> : <Learn />}
    </LocaleProvider></MemoryRouter>);
    const mathCard = screen.getByRole('link', { name: new RegExp(locale === 'en' ? 'Everyday early math' : 'အစောပိုင်း သင်္ချာ') });
    expect(within(mathCard).getByTestId('ai-publication-badge')).toHaveTextContent(AI_BADGE[locale]);
    const humanCard = screen.getByRole('link', { name: new RegExp(locale === 'en' ? 'Another lesson' : 'အခြား သင်ခန်းစာ') });
    expect(within(humanCard).queryByTestId('ai-publication-badge')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('ai-publication-badge')).toHaveLength(1);
  });
});
