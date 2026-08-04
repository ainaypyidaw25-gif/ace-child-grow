import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { MilestoneGallery } from '../../screens/MilestoneGallery';

const achievedMilestones = [
  {
    _id: 'response-1',
    milestoneKey: 'first_steps',
    titleMm: 'ပထမဆုံး လှမ်းလှမ်း',
    titleEn: 'First steps',
    domain: 'gross_motor',
    answeredAt: Date.parse('2026-01-15'),
    photoUrl: 'https://cdn.example/photo-1',
  },
  {
    _id: 'response-2',
    milestoneKey: 'first_words',
    titleMm: 'ပထမဆုံး စကားလုံး',
    titleEn: 'First words',
    domain: 'communication',
    answeredAt: Date.parse('2026-02-01'),
    photoUrl: null,
  },
];

// useMutation is called in a fixed order on every render of MilestoneGallery:
// generateUploadUrl, attachMilestonePhoto, removeMilestonePhoto (0, 1, 2, then
// repeating on re-render) — track calls by that position so tests can assert
// on a specific mutation without relying on api reference identity.
const mutationCalls = vi.hoisted(() => [] as Array<{ index: number; args: unknown }>);
let mutationCallCount = 0;

vi.mock('convex/react', () => ({
  useQuery: () => achievedMilestones,
  useMutation: () => {
    const index = mutationCallCount++ % 3;
    return vi.fn(async (args: unknown) => {
      mutationCalls.push({ index, args });
      return index === 0 ? 'https://upload.example/put' : undefined;
    });
  },
}));

vi.mock('../../app/AppState', () => ({
  useAppState: () => ({
    activeChild: { id: 'child-1', nickname: 'သမီးလေး', birthDate: '2025-09-26', useCorrectedAge: false },
  }),
}));

function renderWithProviders() {
  return render(
    <MemoryRouter>
      <LocaleProvider>
        <MilestoneGallery />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mutationCallCount = 0;
  mutationCalls.length = 0;
});

describe('MilestoneGallery (component)', () => {
  it('renders one card per achieved milestone with its title and date', () => {
    renderWithProviders();
    expect(screen.getByText('ပထမဆုံး လှမ်းလှမ်း')).toBeInTheDocument();
    expect(screen.getByText('ပထမဆုံး စကားလုံး')).toBeInTheDocument();
    expect(screen.getByText('2026-01-15')).toBeInTheDocument();
  });

  it('shows the print-keepsake link only for a milestone that already has a photo', () => {
    renderWithProviders();
    const printLinks = screen.getAllByText('အမှတ်တရ ပုံနှိပ်မည်');
    expect(printLinks).toHaveLength(1);
  });

  it('opens a ConfirmDialog on remove and only calls removeMilestonePhoto after confirming', () => {
    renderWithProviders();
    fireEvent.click(screen.getByText('ဓာတ်ပုံ ဖျက်ရန်'));

    // Dialog open, mutation not yet called.
    expect(mutationCalls.some((call) => call.index === 2)).toBe(false);
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('ဤဓာတ်ပုံကို ဖျက်ရန် သေချာပါသလား။')).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'ဓာတ်ပုံ ဖျက်ရန်' }));

    const removeCall = mutationCalls.find((call) => call.index === 2);
    expect(removeCall?.args).toEqual({ responseId: 'response-1' });
  });
});
