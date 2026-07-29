import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ScreenErrorBoundary } from '../ScreenErrorBoundary';

function BrokenScreen(): never {
  throw new Error('test screen failure');
}

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
});
