import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { MilestoneDemo } from '../../screens/MilestoneDemo';

const milestoneItems = [
  {
    _id: 'item-1',
    slug: 'ms_10_12m_test',
    domainKey: 'gross_motor',
    titleMm: 'မတ်တပ်ရပ်ခြင်း',
    titleEn: 'Pulls to stand',
    summaryMm: undefined,
    summaryEn: undefined,
    data: { observeMm: 'ပရိဘောဂကို ကိုင်၍ မတ်တပ်ရပ်နိုင်ပါသလား။', observeEn: 'Pulls to stand?' },
  },
  {
    _id: 'item-2',
    slug: 'ms_10_12m_test_2',
    domainKey: 'communication',
    titleMm: 'လက်ညှိုးထိုးပြခြင်း',
    titleEn: 'Points to show',
    summaryMm: undefined,
    summaryEn: undefined,
    data: { observeMm: 'စိတ်ဝင်စားသည့်အရာကို လက်ညှိုးထိုးပြပါသလား။', observeEn: 'Points to show interest?' },
  },
];

const recordSession = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock('convex/react', () => ({
  useQuery: () => ({ staff: false, items: milestoneItems }),
  useMutation: () => recordSession,
}));

vi.mock('../../app/AppState', () => ({
  useAppState: () => ({
    activeChild: {
      id: 'child-1',
      nickname: 'သမီးလေး',
      birthDate: '2025-09-26',
      useCorrectedAge: false,
    },
  }),
}));

function renderWithProviders() {
  return render(
    <MemoryRouter>
      <LocaleProvider>
        <MilestoneDemo />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

describe('MilestoneDemo (component)', () => {
  it('renders the published age-based checklist from the server', () => {
    renderWithProviders();
    expect(screen.getByText('ပရိဘောဂကို ကိုင်၍ မတ်တပ်ရပ်နိုင်ပါသလား။')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('renders the four Myanmar answer options by default', () => {
    renderWithProviders();
    expect(screen.getByText('လုပ်နိုင်ပြီ')).toBeInTheDocument();
    expect(screen.getByText('မလုပ်နိုင်သေး')).toBeInTheDocument();
  });

  it('lets a parent pick an answer and advance', () => {
    renderWithProviders();
    fireEvent.click(screen.getByText('လုပ်နိုင်ပြီ'));
    fireEvent.click(screen.getByText('ရှေ့သို့'));
    expect(screen.getByText('စိတ်ဝင်စားသည့်အရာကို လက်ညှိုးထိုးပြပါသလား။')).toBeInTheDocument();
  });

  it('collects all eight acute symptoms and sends every selection to the urgent-result engine', async () => {
    recordSession.mockClear();
    renderWithProviders();
    fireEvent.click(screen.getByText('လုပ်နိုင်ပြီ'));
    fireEvent.click(screen.getByText('ရှေ့သို့'));
    fireEvent.click(screen.getAllByRole('button', { name: 'လုပ်နိုင်ပြီ' })[0]);

    const acuteSymptoms = [
      ['အသက်ရှူရန် အလွန်ခက်ခဲခြင်း', 'severe_breathing_difficulty'],
      ['နှုတ်ခမ်းပြာလာခြင်း', 'blue_lips'],
      ['အသက်ရှူရပ်သလို ဖြစ်ခြင်း', 'breathing_pauses'],
      ['တက်ခြင်း', 'seizure'],
      ['မနိုးနိုင်ခြင်း သို့မဟုတ် တုံ့ပြန်မှုမရှိခြင်း', 'unresponsiveness'],
      ['ရုတ်တရက် အားနည်းသွားခြင်း', 'sudden_weakness'],
      ['ပြင်းထန်သော ထိခိုက်ဒဏ်ရာ', 'serious_injury'],
      ['ပြင်းထန်စွာ ရေဓာတ်ခန်းခြောက်ခြင်း', 'severe_dehydration'],
    ];
    for (const [label] of acuteSymptoms) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }

    const saveButton = screen.getByRole('button', { name: 'သိမ်းဆည်းမည်' });
    fireEvent.click(screen.getByRole('button', { name: 'မရှိပါ' }));
    expect(saveButton).toBeDisabled();
    for (const [label] of acuteSymptoms) {
      fireEvent.click(screen.getByRole('button', { name: label }));
    }
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(saveButton).toBeEnabled();
    fireEvent.click(saveButton);

    const urgentSymptoms = acuteSymptoms.map(([, symptom]) => symptom);
    await waitFor(() => expect(recordSession).toHaveBeenCalledWith(expect.objectContaining({
      resultState: 'red',
      urgentSymptoms,
      resultSnapshot: expect.objectContaining({ urgentSymptoms }),
    })));
  });
});
