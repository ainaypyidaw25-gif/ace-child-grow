import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { ContentDetail } from '../../screens/ContentDetail';

const MILESTONES = vi.hoisted(() => ({
  mapped: {
    slug: 'ms_birth_2m_social_1',
    titleMm: 'မျက်လုံးချင်းဆုံ ကြည့်ခြင်း',
    titleEn: 'Makes eye contact',
    asset: '/milestones/birth_2m/ms_birth_2m_social_1.2966e5b814.webp',
  },
  unknown: {
    slug: 'ms_unknown_detail_1',
    titleMm: 'မသိသော မှတ်တိုင်',
    titleEn: 'Unknown milestone',
  },
}));
const EMPTY_RECORDS = vi.hoisted(() => [] as const);

vi.mock('convex/react', () => {
  const resultFor = (item: (typeof MILESTONES)[keyof typeof MILESTONES]) => ({
    staff: false,
    item: {
      _id: item.slug,
      ...item,
      type: 'milestone',
      domainKey: 'social',
      clinicalStatus: 'published',
      reviewScope: 'education',
      source: 'Production Convex',
      data: {
        observeMm: 'မြန်မာ စောင့်ကြည့်ချက်',
        observeEn: 'English observation',
      },
    },
    media: [{
      _id: `${item.slug}-cms-illustration`,
      kind: 'illustration',
      placeholder: false,
      url: '/cms-milestone-illustration.webp',
    }],
  });
  const results = new Map([
    [MILESTONES.mapped.slug, resultFor(MILESTONES.mapped)],
    [MILESTONES.unknown.slug, resultFor(MILESTONES.unknown)],
  ]);

  return {
    useQuery: (_query: unknown, args?: { slug?: string }) =>
      results.get(args?.slug ?? '') ?? null,
  };
});

vi.mock('../../app/useOfflineLibrary', () => ({
  useDownloadedLibrary: () => ({ records: EMPTY_RECORDS, loaded: true }),
}));

function renderMilestone(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/content/${slug}`]}>
      <LocaleProvider>
        <Routes>
          <Route path="/content/:slug" element={<ContentDetail />} />
        </Routes>
      </LocaleProvider>
    </MemoryRouter>,
  );
}

describe('ContentDetail milestone illustrations', () => {
  afterEach(() => {
    cleanup();
    localStorage.removeItem('ace-locale');
  });

  it('renders the exact mapped 4:3 hero with localized Myanmar and English alt text', () => {
    localStorage.setItem('ace-locale', 'mm');
    const myanmarView = renderMilestone(MILESTONES.mapped.slug);

    expect(screen.getByTestId('milestone-illustration')).toHaveAttribute(
      'src',
      MILESTONES.mapped.asset,
    );
    expect(screen.getByTestId('milestone-illustration')).toHaveAttribute(
      'alt',
      MILESTONES.mapped.titleMm,
    );
    expect(screen.getByTestId('milestone-illustration')).toHaveAttribute('width', '1200');
    expect(screen.getByTestId('milestone-illustration')).toHaveAttribute('height', '900');
    expect(screen.getByTestId('milestone-illustration')).toHaveClass('aspect-[4/3]');
    expect(document.querySelector('img[src="/cms-milestone-illustration.webp"]')).toBeNull();

    myanmarView.unmount();
    localStorage.setItem('ace-locale', 'en');
    renderMilestone(MILESTONES.mapped.slug);

    expect(screen.getByTestId('milestone-illustration')).toHaveAttribute(
      'alt',
      MILESTONES.mapped.titleEn,
    );
  });

  it('does not substitute a static fallback for an unknown milestone slug', () => {
    renderMilestone(MILESTONES.unknown.slug);

    expect(screen.queryByTestId('milestone-illustration')).not.toBeInTheDocument();
    expect(document.querySelector('img[src="/cms-milestone-illustration.webp"]')).toBeVisible();
  });
});
