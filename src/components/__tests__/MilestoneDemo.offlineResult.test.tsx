import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { MilestoneDemo } from '../../screens/MilestoneDemo';
import { ACUTE_URGENT_SYMPTOMS, ACUTE_URGENT_SYMPTOM_LABELS } from '../../domain/safety/safety';

const mocks = vi.hoisted(() => ({
  recordSession: vi.fn(),
  useLibraryContent: vi.fn(),
}));

vi.mock('convex/react', () => ({ useMutation: () => mocks.recordSession }));
vi.mock('../../app/useOfflineLibrary', () => ({ useLibraryContent: mocks.useLibraryContent }));
vi.mock('../../app/AppState', () => ({
  useAppState: () => ({
    activeChild: { id: 'child-1', nickname: 'ကလေး', birthDate: '2025-09-26', useCorrectedAge: false },
  }),
}));

const library = {
  staff: false,
  items: [{
    _id: 'item-1', slug: 'ms_10_12m_test', domainKey: 'gross_motor',
    titleMm: 'မတ်တပ်ရပ်ခြင်း', titleEn: 'Pulls to stand',
    data: { observeMm: 'မတ်တပ်ရပ်နိုင်ပါသလား။', observeEn: 'Pulls to stand?' },
  }],
};

function assessment() {
  return <MemoryRouter><LocaleProvider><MilestoneDemo /></LocaleProvider></MemoryRouter>;
}

function prepareSafety(trigger: string | null) {
  fireEvent.click(screen.getByRole('button', { name: 'လုပ်နိုင်ပြီ' }));
  fireEvent.click(screen.getByRole('button', { name: 'လက္ခဏာစာရင်းကို ကြည့်မည်' }));
  fireEvent.click(screen.getByRole('button', {
    name: trigger && trigger !== 'loss_of_acquired_skills'
      ? ACUTE_URGENT_SYMPTOM_LABELS[trigger as typeof ACUTE_URGENT_SYMPTOMS[number]].mm
      : 'ဤလက္ခဏာများ မရှိပါ',
  }));
  fireEvent.click(screen.getByRole('button', {
    name: trigger === 'loss_of_acquired_skills' ? 'ရှိပါသည်' : 'မရှိပါ',
  }));
}

function expectResult(urgent: boolean) {
  expect(screen.getByRole('heading', { name: 'လစဉ်အစီရင်ခံစာ' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'သိမ်းဆည်းမည်' })).not.toBeInTheDocument();
  if (urgent) expect(screen.getByRole('alert')).toBeInTheDocument();
  else expect(screen.queryByRole('alert')).not.toBeInTheDocument();
}

beforeEach(() => {
  mocks.recordSession.mockReset().mockResolvedValue('session-1');
  mocks.useLibraryContent.mockReset().mockReturnValue(library);
});

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('MilestoneDemo local result independent of persistence', () => {
  it.each([...ACUTE_URGENT_SYMPTOMS, 'loss_of_acquired_skills'])(
    'keeps the submitted urgent result for %s after an offline save failure',
    async (trigger) => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      mocks.recordSession.mockRejectedValueOnce(new Error('offline'));
      render(assessment());
      prepareSafety(trigger);
      fireEvent.click(screen.getByRole('button', { name: 'သိမ်းဆည်းမည်' }));

      // Assert the report immediately, before the rejected mutation settles.
      expectResult(true);
      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('မှတ်တမ်း သိမ်း၍ မရပါ။'));
      expectResult(true);
      expect(mocks.recordSession).toHaveBeenCalledTimes(1);
      expect(mocks.recordSession).toHaveBeenCalledWith(expect.objectContaining({
        resultState: 'red',
        resultSnapshot: expect.objectContaining({ state: 'red', urgentSymptoms: [trigger] }),
      }));
      expect(screen.getByRole('button', { name: 'စစ်ဆေးစာရင်း အသစ်စမည်' })).toBeEnabled();
    },
  );

  it.each([null, 'seizure', 'loss_of_acquired_skills'])(
    'shows and retains the click-time snapshot while a slow save for %s is pending',
    async (trigger) => {
      let resolveSave!: (value: string) => void;
      mocks.recordSession.mockReturnValueOnce(new Promise<string>((resolve) => { resolveSave = resolve; }));
      const view = render(assessment());
      prepareSafety(trigger);
      const symptomButton = screen.queryByRole('button', { name: ACUTE_URGENT_SYMPTOM_LABELS.seizure.mm });
      const skillButton = screen.getByRole('button', { name: trigger === 'loss_of_acquired_skills' ? 'မရှိပါ' : 'ရှိပါသည်' });
      const answerButton = screen.getByRole('button', { name: 'မလုပ်နိုင်သေး' });
      const note = screen.getByRole('textbox');
      fireEvent.change(note, { target: { value: 'Original note' } });
      fireEvent.click(screen.getByRole('button', { name: 'သိမ်းဆည်းမည်' }));

      expectResult(trigger !== null);
      expect(screen.getByRole('status')).toHaveTextContent('မှတ်တမ်း သိမ်းဆည်းနေသည်။');
      const restart = screen.getByRole('button', { name: 'စစ်ဆေးစာရင်း အသစ်စမည်' });
      expect(restart).toBeDisabled();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.queryByRole('group')).not.toBeInTheDocument();
      // Detached controls and the disabled restart cannot edit the submission.
      if (symptomButton) fireEvent.click(symptomButton);
      fireEvent.click(skillButton);
      fireEvent.click(answerButton);
      fireEvent.change(note, { target: { value: 'Changed while saving' } });
      fireEvent.click(restart);

      // An offline library refresh cannot hide/recompute the submitted result.
      mocks.useLibraryContent.mockReturnValue(undefined);
      view.rerender(assessment());
      expectResult(trigger !== null);
      mocks.useLibraryContent.mockReturnValue({ staff: false, items: [] });
      view.rerender(assessment());
      expectResult(trigger !== null);

      const state = trigger ? 'red' : 'green';
      expect(mocks.recordSession).toHaveBeenCalledTimes(1);
      expect(mocks.recordSession).toHaveBeenCalledWith(expect.objectContaining({
        resultState: state,
        lostSkill: trigger === 'loss_of_acquired_skills',
        urgentSymptoms: trigger === 'seizure' ? ['seizure'] : [],
        resultSnapshot: expect.objectContaining({ state, urgentSymptoms: trigger ? [trigger] : [] }),
        responses: [expect.objectContaining({ answer: 'yes', note: 'Original note' })],
      }));
      await act(async () => { resolveSave('session-1'); });
      expectResult(trigger !== null);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(restart).toBeEnabled();
    },
  );

  it('clears a failed save and its urgent snapshot when starting a new checklist', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.recordSession.mockRejectedValueOnce(new Error('save failed'));
    render(assessment());
    prepareSafety('seizure');
    fireEvent.click(screen.getByRole('button', { name: 'သိမ်းဆည်းမည်' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('မှတ်တမ်း သိမ်း၍ မရပါ။'));
    fireEvent.click(screen.getByRole('button', { name: 'စစ်ဆေးစာရင်း အသစ်စမည်' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'သိမ်းဆည်းမည်' })).toBeDisabled();
    prepareSafety(null);
    fireEvent.click(screen.getByRole('button', { name: 'သိမ်းဆည်းမည်' }));
    expectResult(false);
    await waitFor(() => expect(screen.getByRole('button', { name: 'စစ်ဆေးစာရင်း အသစ်စမည်' })).toBeEnabled());
    expect(mocks.recordSession).toHaveBeenCalledTimes(2);
    expect(mocks.recordSession).toHaveBeenLastCalledWith(expect.objectContaining({ resultState: 'green', urgentSymptoms: [] }));
  });
});
