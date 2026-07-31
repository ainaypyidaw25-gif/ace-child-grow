import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ScreenErrorBoundary } from '../ScreenErrorBoundary';

function BrokenScreen(): never {
  throw new Error('test screen failure');
}

/** The message Vite/browsers give when a hashed chunk no longer exists. */
function StaleChunkScreen(): never {
  throw new Error('Failed to fetch dynamically imported module: /assets/AdminReviewQueue-cBhpbYra.js');
}

afterEach(() => {
  window.sessionStorage.clear();
});

describe('ScreenErrorBoundary', () => {
  it('replaces a failed screen with a useful Myanmar recovery message', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <ScreenErrorBoundary locale="mm">
        <BrokenScreen />
      </ScreenErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('ဤစာမျက်နှာကို ခဏဖွင့်၍ မရသေးပါ');
    expect(screen.getByRole('button', { name: 'ထပ်မံကြိုးစားမည်' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ပင်မစာမျက်နှာသို့' })).toHaveAttribute('href', '/home');
    consoleError.mockRestore();
  });

  it('starts a fresh recovery attempt when retry is selected', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const retry = vi.fn();

    render(
      <ScreenErrorBoundary locale="en" onRetry={retry}>
        <BrokenScreen />
      </ScreenErrorBoundary>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });

  // Every routed screen is React.lazy, and React handles a failed import's
  // rejection itself — so this boundary is the only place that failure can be
  // seen. installChunkRecovery's `unhandledrejection` listener never fires for
  // it.
  it('reloads the shell when a lazy screen fails because its chunk is gone', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const reload = vi.fn();

    render(
      <ScreenErrorBoundary locale="mm" reload={reload}>
        <StaleChunkScreen />
      </ScreenErrorBoundary>,
    );

    expect(reload).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });

  it('tells a stale shell to reopen, and does not blame the connection', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <ScreenErrorBoundary locale="mm" reload={() => undefined}>
        <StaleChunkScreen />
      </ScreenErrorBoundary>,
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('အက်ပ်ကို အသစ်ပြင်ဆင်ထားပါသည်');
    expect(alert).toHaveTextContent('အပြီးပိတ်ပြီး ပြန်ဖွင့်ပါ');
    // The old copy sent a reader to check a connection that was working.
    expect(alert).not.toHaveTextContent('အင်တာနက်ချိတ်ဆက်မှု');
    consoleError.mockRestore();
  });

  it('does not reload when the failure is not a missing chunk', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const reload = vi.fn();

    render(
      <ScreenErrorBoundary locale="en" reload={reload}>
        <BrokenScreen />
      </ScreenErrorBoundary>,
    );

    // A screen whose data call threw is not fixed by reloading, and a reload
    // here would hide the fault behind a refresh loop.
    expect(reload).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('This page could not open');
    consoleError.mockRestore();
  });

  it('does not reload twice inside the cooldown', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const reload = vi.fn();

    render(
      <ScreenErrorBoundary locale="en" reload={reload}>
        <StaleChunkScreen />
      </ScreenErrorBoundary>,
    );
    render(
      <ScreenErrorBoundary locale="en" reload={reload}>
        <StaleChunkScreen />
      </ScreenErrorBoundary>,
    );

    // A deployment that is genuinely broken must not become a reload loop.
    expect(reload).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });
});
