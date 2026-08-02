import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { MilestoneDemo } from '../../screens/MilestoneDemo';

const slugs = [
  'ms_birth_2m_sleep_1',
  'ms_birth_2m_nutrition_1',
  'ms_birth_2m_play_1',
  'ms_birth_2m_emotional_1',
  'ms_birth_2m_communication_2',
  'ms_birth_2m_cognitive_1',
  'ms_birth_2m_fine_motor_1',
  'ms_birth_2m_gross_motor_2',
  'ms_birth_2m_social_2',
  'ms_birth_2m_communication_1',
  'ms_birth_2m_social_1',
  'ms_birth_2m_gross_motor_1',
] as const;

const milestoneItems = slugs.map((slug) => ({
  _id: slug,
  slug,
  domainKey: 'social',
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
      id: 'child-birth-2m',
      nickname: 'ကလေး',
      birthDate: new Date().toISOString().slice(0, 10),
      useCorrectedAge: false,
    },
  }),
}));

describe('MilestoneDemo birth–2 month illustration navigation', () => {
  it('changes to a unique exact-slug image through all 12 next steps and returns with previous', () => {
    render(
      <MemoryRouter>
        <LocaleProvider>
          <MilestoneDemo />
        </LocaleProvider>
      </MemoryRouter>,
    );

    const visited = new Set<string>();
    for (let index = 0; index < slugs.length; index += 1) {
      const image = screen.getByTestId('milestone-illustration');
      const src = image.getAttribute('src') ?? '';
      expect(src).toContain(`/${slugs[index]}.`);
      expect(src).toMatch(/\.[a-f0-9]{10}\.webp$/);
      visited.add(src);

      if (index < slugs.length - 1) {
        fireEvent.click(screen.getByText('လုပ်နိုင်ပြီ'));
        fireEvent.click(screen.getByText('ရှေ့သို့'));
      }
    }

    expect(visited.size).toBe(slugs.length);
    fireEvent.click(screen.getByText('နောက်သို့'));
    expect(screen.getByTestId('milestone-illustration')).toHaveAttribute(
      'src',
      expect.stringContaining(`/${slugs[slugs.length - 2]}.`),
    );
  });
});
