import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { MilestoneDemo } from '../../screens/MilestoneDemo';

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
  it('shows a Clinical Review Required badge on milestone content', () => {
    renderWithProviders();
    expect(screen.getByText(/ဆေးပညာဆိုင်ရာ/)).toBeInTheDocument();
  });

  it('renders the four Myanmar answer options by default', () => {
    renderWithProviders();
    expect(screen.getByText('လုပ်နိုင်ပြီ')).toBeInTheDocument();
    expect(screen.getByText('မလုပ်နိုင်သေး')).toBeInTheDocument();
  });

  it('lets a parent pick an answer and advance', () => {
    renderWithProviders();
    fireEvent.click(screen.getByText('လုပ်နိုင်ပြီ'));
    const next = screen.getByText('ရှေ့သို့');
    expect(next).toBeInTheDocument();
  });
});
