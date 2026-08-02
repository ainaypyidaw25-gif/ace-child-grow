import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { MilestoneDemo } from '../../screens/MilestoneDemo';

const slugs = [
  'ms_19_24m_play_1',
  'ms_19_24m_emotional_1',
  'ms_19_24m_cognitive_1',
  'ms_19_24m_language_1',
] as const;

const milestoneItems = slugs.map((slug) => ({
  _id: slug,
  slug,
  domainKey: slug.split('_')[3],
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
      id: 'child-19-24m',
      nickname: 'ကလေး',
      birthDate: '2024-10-15',
      useCorrectedAge: false,
    },
  }),
}));

describe('MilestoneDemo 19–24 month illustration navigation', () => {
  it('changes to a unique exact-slug image through all four items and returns with previous', () => {
    render(
      <MemoryRouter>
        <LocaleProvider>
          <MilestoneDemo />
        </LocaleProvider>
      </MemoryRouter>,
    );

    const seenSources: string[] = [];
    for (const slug of slugs) {
      const image = screen.getByTestId('milestone-illustration');
      const src = image.getAttribute('src') ?? '';
      expect(src).toContain(`/${slug}.`);
      expect(src).toMatch(/\.[a-f0-9]{10}\.webp$/);
      seenSources.push(src);

      if (slug !== slugs.at(-1)) {
        fireEvent.click(screen.getByText('လုပ်နိုင်ပြီ'));
        fireEvent.click(screen.getByText('ရှေ့သို့'));
      }
    }

    expect(new Set(seenSources).size).toBe(slugs.length);
    fireEvent.click(screen.getByText('နောက်သို့'));
    expect(screen.getByTestId('milestone-illustration')).toHaveAttribute('src', seenSources[2]);
  });
});
