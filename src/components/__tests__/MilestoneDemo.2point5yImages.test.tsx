import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { MilestoneDemo } from '../../screens/MilestoneDemo';

const slugs = ['ms_2_5y_emotional_1', 'ms_2_5y_language_1', 'ms_2_5y_fine_motor_1'] as const;

const milestoneItems = slugs.map((slug) => ({
  _id: slug,
  slug,
  domainKey: slug.replace(/^ms_2_5y_/, '').replace(/_1$/, ''),
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
      id: 'child-2-5y',
      nickname: 'ကလေး',
      birthDate: '2024-02-15',
      useCorrectedAge: false,
    },
  }),
}));

describe('MilestoneDemo 2.5 year illustration navigation', () => {
  it('changes to a unique exact-slug image through all three items and returns with previous', () => {
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
    expect(screen.getByTestId('milestone-illustration')).toHaveAttribute('src', seenSources[1]);
  });
});
