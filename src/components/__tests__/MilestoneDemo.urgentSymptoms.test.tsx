import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import {
  ACUTE_URGENT_SYMPTOMS,
  ACUTE_URGENT_SYMPTOM_LABELS,
} from '../../domain/safety/safety';
import { MilestoneDemo } from '../../screens/MilestoneDemo';

const { recordSession } = vi.hoisted(() => ({
  recordSession: vi.fn().mockResolvedValue('session-1'),
}));

vi.mock('convex/react', () => ({
  useQuery: () => ({
    staff: false,
    items: [{
      _id: 'item-1',
      slug: 'ms_10_12m_test',
      domainKey: 'gross_motor',
      clinicalStatus: 'published',
      titleMm: 'မတ်တပ်ရပ်ခြင်း',
      titleEn: 'Pulls to stand',
      data: { observeMm: 'မတ်တပ်ရပ်နိုင်ပါသလား။', observeEn: 'Pulls to stand?' },
    }],
  }),
  useMutation: () => recordSession,
}));

vi.mock('../../app/AppState', () => ({
  useAppState: () => ({
    activeChild: {
      id: 'child-1',
      nickname: 'ကလေး',
      birthDate: '2025-09-26',
      useCorrectedAge: false,
    },
  }),
}));

function renderAssessment() {
  return render(
    <MemoryRouter>
      <LocaleProvider>
        <MilestoneDemo />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  recordSession.mockClear();
});

describe('MilestoneDemo acute urgent symptom wiring', () => {
  it('offers exactly the eight fixed acute symptoms without changing the published-content gate', () => {
    renderAssessment();

    expect(screen.getAllByRole('checkbox')).toHaveLength(8);
    for (const symptom of ACUTE_URGENT_SYMPTOMS) {
      expect(screen.getByLabelText(ACUTE_URGENT_SYMPTOM_LABELS[symptom].mm)).toBeInTheDocument();
    }
  });

  it.each(ACUTE_URGENT_SYMPTOMS)(
    'passes %s to the engine and saves the urgent result',
    async (symptom) => {
      renderAssessment();

      fireEvent.click(screen.getAllByRole('button', { name: 'လုပ်နိုင်ပြီ' })[0]);
      fireEvent.click(screen.getByLabelText(ACUTE_URGENT_SYMPTOM_LABELS[symptom].mm));
      fireEvent.click(screen.getByRole('button', { name: 'မရှိပါ' }));
      fireEvent.click(screen.getByRole('button', { name: 'သိမ်းဆည်းမည်' }));

      await waitFor(() => expect(recordSession).toHaveBeenCalledTimes(1));
      expect(recordSession).toHaveBeenCalledWith(expect.objectContaining({
        resultState: 'red',
        lostSkill: false,
        resultSnapshot: expect.objectContaining({
          state: 'red',
          safetyTriggers: [symptom],
        }),
      }));
      expect(screen.getByRole('alert')).toBeInTheDocument();
    },
  );
});
