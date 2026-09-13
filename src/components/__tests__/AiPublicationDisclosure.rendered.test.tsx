import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { CONTENT_SEED } from '../../content/seed';
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

describe('parent-facing provenance copy', () => {
  beforeEach(() => {
    state.remote = undefined;
    state.records = [];
    state.items = [];
  });
  afterEach(() => { cleanup(); localStorage.removeItem('ace-locale'); });

  it.each([
    ['en', 'online'], ['mm', 'online'], ['en', 'offline'], ['mm', 'offline'],
  ] as const)('replaces the long per-item AI warning with a compact %s %s status note', async (locale, mode) => {
    localStorage.setItem('ace-locale', locale);
    const item = mathItem();
    if (mode === 'online') state.remote = { item, media: [], staff: false };
    else state.records = [toOfflineRecord(item, 42)];

    renderDetail();

    await waitFor(() => expect(screen.getByText(locale === 'en'
      ? /Math is not only in books\./
      : /သင်္ချာသည် စာအုပ်ထဲသာ မဟုတ်ပါ။/)).toBeVisible());
    expect(screen.queryByTestId('ai-publication-disclosure')).not.toBeInTheDocument();
    expect(screen.getByTestId('ai-publication-note')).toHaveTextContent(locale === 'en'
      ? 'human specialist approval is pending'
      : 'လူ့ပညာရှင် အတည်ပြုချက် စောင့်ဆိုင်းဆဲ');
    expect(screen.queryByText(/not approved by a human specialist|လူ့ပညာရှင် အတည်ပြုချက် မရှိသေးပါ/i)).not.toBeInTheDocument();
  });

  it.each([
    ['en', 'library'], ['mm', 'library'], ['en', 'learn'], ['mm', 'learn'],
  ] as const)('omits per-item AI badges from the %s %s list', (locale, page) => {
    localStorage.setItem('ace-locale', locale);
    state.items = [mathItem(), {
      ...mathItem('human_reviewed'), _id: 'human-row', slug: 'human-lesson',
      titleEn: 'Another lesson', titleMm: 'အခြား သင်ခန်းစာ',
    }];
    render(<MemoryRouter><LocaleProvider>
      {page === 'library' ? <ContentLibrary /> : <Learn />}
    </LocaleProvider></MemoryRouter>);

    expect(screen.queryByTestId('ai-publication-badge')).not.toBeInTheDocument();
    expect(screen.queryByText(/AI-reviewed|AI ဖြင့် စစ်ဆေးထားသည်/i)).not.toBeInTheDocument();
  });
});
