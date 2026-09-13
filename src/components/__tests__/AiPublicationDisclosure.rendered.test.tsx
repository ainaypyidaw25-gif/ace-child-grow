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
  evidence: undefined as unknown,
  records: [] as OfflineRecord[],
  items: [] as LibraryRowLike[],
}));

vi.mock('convex/react', () => ({
  useQuery: (_query: unknown, args: unknown) => (
    typeof args === 'object' && args !== null && 'kind' in args
      ? state.evidence
      : state.remote
  ),
}));
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

const mathReference = {
  sourceId: 'naeyc-early-math',
  org: 'NAEYC',
  title: 'Nurturing Early Math Play',
  url: 'https://www.naeyc.org/resources/pubs/yc/fall2022/nurturing-early-math-play',
};

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
    state.evidence = undefined;
    state.records = [];
    state.items = [];
  });
  afterEach(() => { cleanup(); localStorage.removeItem('ace-locale'); });

  it.each([
    ['en', 'online'], ['mm', 'online'], ['en', 'offline'], ['mm', 'offline'],
  ] as const)('renders a compact, role-specific %s %s AI status note', async (locale, mode) => {
    localStorage.setItem('ace-locale', locale);
    const item = mathItem();
    if (mode === 'online') state.remote = { item, media: [], staff: false };
    else state.records = [{ ...toOfflineRecord(item, 42), references: [mathReference] }];

    renderDetail();

    const bodyPattern = locale === 'en'
      ? /Math is not only in books\./
      : /သင်္ချာသည် စာအုပ်ထဲသာ မဟုတ်ပါ။/;
    await waitFor(() => expect(screen.getByText(bodyPattern)).toBeVisible());
    const body = screen.getByText(bodyPattern);
    expect(screen.queryByTestId('ai-publication-disclosure')).not.toBeInTheDocument();
    const note = screen.getByTestId('ai-publication-note');
    expect(note).toHaveTextContent(locale === 'en'
      ? 'not approved by a clinician or native Myanmar-language editor'
      : 'ဆေးဘက်ပညာရှင် သို့မဟုတ် မိခင်ဘာသာစကား မြန်မာစာတည်းဖြတ်သူ၏ အတည်ပြုချက် မရှိသေးပါ');
    expect(note.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it.each(['en', 'mm'] as const)('renders cached source attribution in an offline %s detail', async (locale) => {
    localStorage.setItem('ace-locale', locale);
    state.records = [{
      ...toOfflineRecord(mathItem(), 42),
      references: [mathReference],
    }];

    renderDetail();

    expect(await screen.findByTestId('content-references')).toBeVisible();
    expect(screen.getByText('NAEYC')).toBeVisible();
    expect(screen.getByRole('link', {
      name: locale === 'en' ? 'View original source →' : 'မူရင်းရင်းမြစ်ကြည့်ရန် →',
    })).toHaveAttribute('href', expect.stringContaining('naeyc.org'));
  });

  it('uses live evidence after the remote item resolves and never falls back to stale cached evidence', async () => {
    const item = mathItem();
    state.records = [{
      ...toOfflineRecord(item, 42),
      references: [{ sourceId: 'old', org: 'Old source', title: 'Old title', url: 'https://old.example/source' }],
    }];
    state.remote = { item, media: [], staff: false };
    state.evidence = {
      allowed: true,
      sources: [{ sourceId: 'new', org: 'Current source', title: 'Current title', url: 'https://current.example/source' }],
    };

    renderDetail();

    expect(await screen.findByText('Current source')).toBeVisible();
    expect(screen.queryByText('Old source')).not.toBeInTheDocument();
  });

  it('does not leak cached evidence when the live evidence response denies it', async () => {
    const item = mathItem();
    state.records = [{
      ...toOfflineRecord(item, 42),
      references: [{ sourceId: 'old', org: 'Old source', title: 'Old title', url: 'https://old.example/source' }],
    }];
    state.remote = { item, media: [], staff: false };
    state.evidence = { allowed: false, sources: [] };

    renderDetail();

    await waitFor(() => expect(screen.getByTestId('ai-publication-note')).toBeVisible());
    expect(screen.queryByTestId('content-references')).not.toBeInTheDocument();
    expect(screen.queryByText('Old source')).not.toBeInTheDocument();
  });

  it.each([
    ['en', 'library'], ['mm', 'library'], ['en', 'learn'], ['mm', 'learn'],
  ] as const)('distinguishes AI-only items in the %s %s list', (locale, page) => {
    localStorage.setItem('ace-locale', locale);
    state.items = [mathItem(), {
      ...mathItem('human_reviewed'), _id: 'human-row', slug: 'human-lesson',
      titleEn: 'Another lesson', titleMm: 'အခြား သင်ခန်းစာ',
    }];
    render(<MemoryRouter><LocaleProvider>
      {page === 'library' ? <ContentLibrary /> : <Learn />}
    </LocaleProvider></MemoryRouter>);

    expect(screen.getAllByTestId('ai-publication-badge')).toHaveLength(1);
    expect(screen.getByTestId('ai-publication-badge')).toHaveTextContent(locale === 'en'
      ? 'AI review only'
      : 'AI စစ်ဆေးမှုသာ');
  });
});
