import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { Consent } from '../Consent';

// ACG-UX-001: consent is the gate to the whole app. When recording it fails
// (offline, server error) the parent must be told, not left on a screen that
// silently does nothing — otherwise onboarding dead-ends with no way forward.

const appState = vi.hoisted(() => ({ acceptConsentAsync: vi.fn() }));

vi.mock('../../app/AppState', () => ({
  useAppState: () => ({
    state: { consentAcceptedAt: null, children: [] },
    acceptConsentAsync: appState.acceptConsentAsync,
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderConsent() {
  return render(
    <MemoryRouter>
      <LocaleProvider>
        <Consent />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

describe('Consent failure handling', () => {
  it('tells the parent when consent could not be saved, and stays retryable', async () => {
    appState.acceptConsentAsync.mockRejectedValueOnce(new Error('offline'));
    renderConsent();
    const confirm = screen.getByRole('button');

    fireEvent.click(confirm);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/မရပါ|Could not save/);
    // The button must come back so the parent can try again.
    await waitFor(() => expect(confirm).not.toBeDisabled());
  });

  it('shows no error when consent is recorded', async () => {
    appState.acceptConsentAsync.mockResolvedValueOnce(undefined);
    renderConsent();

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => expect(appState.acceptConsentAsync).toHaveBeenCalled());
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('clears a previous error when the parent retries', async () => {
    appState.acceptConsentAsync
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(undefined);
    renderConsent();
    const confirm = screen.getByRole('button');

    fireEvent.click(confirm);
    await screen.findByRole('alert');

    fireEvent.click(confirm);
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });
});
