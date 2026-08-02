import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { MilestoneDemo } from '../../screens/MilestoneDemo';

const slugs = ['ms_13_18m_language_1', 'ms_13_18m_speech_1'] as const;

const milestoneItems = slugs.map((slug) => ({
  _id: slug,
  slug,
  domainKey: slug.includes('language') ? 'language' : 'speech',
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
      id: 'child-13-18m',
      nickname: 'ကလေး',
      birthDate: '2025-03-15',
      useCorrectedAge: false,
    },
  }),
}));

describe('MilestoneDemo 13–18 month illustration navigation', () => {
  it('changes to a unique exact-slug image with next and returns with previous', () => {
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

    fireEvent.click(screen.getByText('လုပ်နိုင်ပြီ'));
    fireEvent.click(screen.getByText('ရှေ့သို့'));

    const secondImage = screen.getByTestId('milestone-illustration');
    const secondSrc = secondImage.getAttribute('src') ?? '';
    expect(secondSrc).toContain(`/${slugs[1]}.`);
    expect(secondSrc).toMatch(/\.[a-f0-9]{10}\.webp$/);
    expect(secondSrc).not.toBe(firstSrc);

    fireEvent.click(screen.getByText('နောက်သို့'));
    expect(screen.getByTestId('milestone-illustration')).toHaveAttribute('src', firstSrc);
  });
});
