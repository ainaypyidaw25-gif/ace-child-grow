import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { ContentDetail } from '../../screens/ContentDetail';

const EMPTY_RECORDS = vi.hoisted(() => [] as const);
const MILESTONE_RESULT = vi.hoisted(() => ({
  staff: false,
  item: {
    _id: 'milestone-row',
    slug: 'ms_2y_language_1',
    titleMm: 'စကားနှစ်လုံး တွဲပြောခြင်း',
    titleEn: 'Combines two words',
    type: 'milestone',
    clinicalStatus: 'published',
    source: 'Production Convex',
    data: {
      observeMm: 'စကားနှစ်လုံး တွဲပြောပါသလား။',
      observeEn: 'Does the child combine two words?',
      whyMm: 'ဆက်သွယ်မှုကို စောင့်ကြည့်ရန်။',
      whyEn: 'For developmental observation.',
    },
  },
  media: [],
}));

vi.mock('convex/react', () => ({
  useQuery: (_query: unknown, args: { slug: string }) => {
    if (args.slug !== 'ms_2y_language_1') return { allowed: true, sources: [] };
    return MILESTONE_RESULT;
  },
}));

vi.mock('../../app/useOfflineLibrary', () => ({
  useDownloadedLibrary: () => ({ records: EMPTY_RECORDS, loaded: true }),
}));

describe('ContentDetail manual-review type framing', () => {
  it('shows the milestone non-diagnostic and skill-loss note before the record fields', () => {
    localStorage.setItem('ace-locale', 'en');
    render(
      <MemoryRouter initialEntries={['/content/ms_2y_language_1']}>
        <LocaleProvider>
          <Routes>
            <Route path="/content/:slug" element={<ContentDetail />} />
          </Routes>
        </LocaleProvider>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('milestone-use-note')).toHaveTextContent(/not pass\/fail criteria or a diagnosis/i);
    expect(screen.getByTestId('milestone-use-note')).toHaveTextContent(/loses a skill/i);
  });
});
