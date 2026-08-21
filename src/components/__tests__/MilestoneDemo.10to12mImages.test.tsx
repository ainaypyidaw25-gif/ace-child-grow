import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { MilestoneDemo } from '../../screens/MilestoneDemo';

const slugs = ['ms_10_12m_problem_solving_2', 'ms_10_12m_self_help_1'] as const;

const milestoneItems = slugs.map((slug) => ({
  _id: slug,
  slug,
  domainKey: 'self_help',
  titleMm: slug,
  titleEn: slug,
  summaryMm: undefined,
  summaryEn: undefined,
  data: { observeMm: `${slug}-observe-mm`, observeEn: `${slug}-observe-en` },
}));

vi.mock('convex/react', () => ({
  useQuery: () => ({ staff: false, items: milestoneItems }),
  useMutation: () => vi.fn(),
}));

vi.mock('../../app/AppState', () => ({
  useAppState: () => ({
    activeChild: {
      id: 'child-10-12m',
      nickname: 'ကလေး',
      birthDate: '2025-09-01',
      useCorrectedAge: false,
    },
  }),
}));

describe('MilestoneDemo 10–12 month illustration navigation', () => {
  it('shows only the active exact-slug image after retirement filtering', () => {
    render(
      <MemoryRouter>
        <LocaleProvider>
          <MilestoneDemo />
        </LocaleProvider>
      </MemoryRouter>,
    );

    const firstImage = screen.getByTestId('milestone-illustration');
    const firstSrc = firstImage.getAttribute('src') ?? '';
    expect(firstSrc).toContain(`/${slugs[0]}.`);
    expect(firstSrc).toMatch(/\.[a-f0-9]{10}\.webp$/);

    expect(screen.getByText('1 / 1')).toBeInTheDocument();
    expect(screen.queryByText(slugs[1])).not.toBeInTheDocument();
  });
});
