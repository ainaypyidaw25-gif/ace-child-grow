import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { ContentDetail } from '../../screens/ContentDetail';
import { ContentLibrary } from '../../screens/ContentLibrary';
import { Growth } from '../../screens/Growth';

const store = vi.hoisted(() => ({
  apple: true,
  native: true,
}));

const printable = {
  _id: 'printable-1',
  slug: 'printable-without-file',
  type: 'printable',
  clinicalStatus: 'published',
  reviewScope: 'general',
  titleMm: 'ပုံနှိပ်စာရွက် နမူနာ',
  titleEn: 'Sample printable',
  summaryMm: 'ဖိုင်မပါသော ပုံနှိပ်စာရွက်',
  summaryEn: 'A printable without a file',
  source: 'ACE',
  data: {},
};

const lesson = {
  _id: 'lesson-1',
  slug: 'published-lesson',
  type: 'lesson',
  clinicalStatus: 'published',
  reviewScope: 'general',
  titleMm: 'ထုတ်ဝေပြီး သင်ခန်းစာ',
  titleEn: 'Published lesson',
  summaryMm: 'ဖတ်ရှုနိုင်သော သင်ခန်းစာ',
  summaryEn: 'An available lesson',
  source: 'ACE',
  data: {},
};
const noOfflineRecords: never[] = [];
const printableResult = { item: printable, media: [] };
const libraryResult = { staff: false, items: [printable, lesson] };

vi.mock('../../app/platform', () => ({
  isAppleAppStoreBuild: () => store.apple,
  isNativeStoreBuild: () => store.native,
}));

vi.mock('../../app/AppState', () => ({
  useAppState: () => ({
    activeChild: {
      id: 'child-1',
      nickname: 'ကလေး',
      birthDate: '2026-01-01',
      useCorrectedAge: false,
    },
  }),
}));

vi.mock('../../app/useOfflineLibrary', () => ({
  useLibraryContent: () => libraryResult,
  useDownloadedLibrary: () => ({ records: noOfflineRecords, loaded: true }),
}));

vi.mock('convex/react', () => ({
  useQuery: (_api: unknown, args?: Record<string, unknown> | 'skip') => {
    if (args === 'skip') return undefined;
    if (args && 'slug' in args) return printableResult;
    if (args && 'childId' in args) return [];
    return libraryResult;
  },
  useMutation: () => vi.fn(),
}));

function renderLibrary() {
  return render(
    <MemoryRouter>
      <LocaleProvider>
        <ContentLibrary />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

describe('App Store feature availability', () => {
  afterEach(() => {
    cleanup();
    store.apple = true;
    store.native = true;
  });

  it('hides unfinished printables from the App Store library', () => {
    renderLibrary();

    expect(screen.queryByRole('button', { name: /ပုံနှိပ်အသုံးပြုရန်/ })).not.toBeInTheDocument();
    expect(screen.queryByText('ပုံနှိပ်စာရွက် နမူနာ')).not.toBeInTheDocument();
    expect(screen.getByText('ထုတ်ဝေပြီး သင်ခန်းစာ')).toBeVisible();
  });

  it('keeps printables available to the existing web experience', () => {
    store.apple = false;
    store.native = false;
    renderLibrary();

    expect(screen.getByRole('button', { name: /ပုံနှိပ်အသုံးပြုရန်/ })).toBeVisible();
    expect(screen.getByText('ပုံနှိပ်စာရွက် နမူနာ')).toBeVisible();
  });

  it('blocks a direct App Store URL to a printable without a file', () => {
    render(
      <MemoryRouter initialEntries={['/content/printable-without-file']}>
        <LocaleProvider>
          <Routes>
            <Route path="/content/:slug" element={<ContentDetail />} />
          </Routes>
        </LocaleProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('မတွေ့ပါ။')).toBeVisible();
    expect(screen.queryByText('ပုံနှိပ်စာရွက် နမူနာ')).not.toBeInTheDocument();
  });

  it('describes Growth as record-only without promising a future integration', () => {
    render(
      <MemoryRouter>
        <LocaleProvider>
          <Growth />
        </LocaleProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText(/တိုင်းတာချက် ပုံမှန်ဟုတ်မဟုတ် မသတ်မှတ်ပါ/)).toBeVisible();
    expect(screen.queryByText(/စစ်ဆေးအတည်ပြုနေဆဲ/)).not.toBeInTheDocument();
  });
});
