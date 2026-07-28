import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LocaleProvider } from '../../app/LocaleContext';
import { HealthRecords } from '../../screens/HealthRecords';

vi.mock('convex/react', () => ({
  useQuery: () => ({ health: [], vaccinations: [], medications: [] }),
  useMutation: () => vi.fn(),
}));

vi.mock('../../app/AppState', () => ({
  useAppState: () => ({
    activeChild: {
      id: 'child-1',
      nickname: 'မောင်မောင်',
      birthDate: '2026-01-31',
      useCorrectedAge: false,
    },
  }),
}));

describe('HealthRecords vaccination schedule', () => {
  it('shows every national EPI schedule item and calculates the child-specific due date', () => {
    render(<LocaleProvider><HealthRecords /></LocaleProvider>);

    expect(screen.getByRole('heading', { name: 'မွေးစမှ အသက် ၅ နှစ်အထိ ကာကွယ်ဆေးမှတ်တမ်း' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'မှတ်တမ်းဖြည့်မည်' })).toHaveLength(18);
    expect(screen.getByText('2026-03-31')).toBeInTheDocument();
    expect(screen.getByText('ငါးမျိုးစပ်ကာကွယ်ဆေး (DTP-Hib-HepB) · စတုတ္ထအကြိမ်')).toBeInTheDocument();
  });

  it('prefills the parent record form from a schedule item', () => {
    render(<LocaleProvider><HealthRecords /></LocaleProvider>);

    const addButtons = screen.getAllByRole('button', { name: 'မှတ်တမ်းဖြည့်မည်' });
    fireEvent.click(addButtons[0]);

    expect(screen.getByLabelText('ကာကွယ်ဆေးအမည် *')).toHaveValue('BCG');
    expect(screen.getByLabelText('အကြိမ်/ထိုးဆေးအမှတ်')).toHaveValue('Single dose');
    expect(screen.getByLabelText('ထိုးရန်ရက်')).toHaveValue('2026-01-31');
  });
});
