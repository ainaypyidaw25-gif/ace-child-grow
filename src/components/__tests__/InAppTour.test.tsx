import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InAppTour } from '../InAppTour';

const completeTour = vi.fn(async () => null);

vi.mock('convex/react', () => ({
  useQuery: () => ({
    isStaff: false,
    consentAcceptedAt: Date.now(),
    parentTourCompletedVersion: 0,
    staffTourCompletedVersion: 0,
  }),
  useMutation: () => completeTour,
}));

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/home', search: '?tour=parent' }),
  useNavigate: () => vi.fn(),
}));

vi.mock('../../app/LocaleContext', () => ({
  useLocale: () => ({ locale: 'mm' }),
}));

describe('InAppTour mobile controls', () => {
  beforeEach(() => completeTour.mockClear());

  it('keeps the dialog scrollable above the device safe area', () => {
    render(<InAppTour inStaffWorkspace={false} />);

    const overlay = screen.getByRole('presentation');
    const dialog = screen.getByRole('dialog');
    expect(overlay.style.paddingBottom).toContain('safe-area-inset-bottom');
    expect(dialog.className).toContain('100dvh');
    expect(dialog.className).toContain('overflow-y-auto');
  });

  it('allows moving forward and skipping the tour', () => {
    render(<InAppTour inStaffWorkspace={false} />);

    fireEvent.click(screen.getByRole('button', { name: 'ဆက်မည်' }));
    expect(screen.getByText('ဖွံ့ဖြိုးမှုခရီးကို မှတ်တမ်းတင်ပါ')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'ကျော်မည်' }));
    expect(completeTour).toHaveBeenCalledOnce();
  });
});
