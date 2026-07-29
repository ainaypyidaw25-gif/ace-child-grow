import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useUnsavedChangesGuard } from '../useUnsavedChangesGuard';

function DirtyForm({ dirty = true, onNavigate }: { dirty?: boolean; onNavigate?: () => void }) {
  useUnsavedChangesGuard(dirty, 'Discard edits?');
  return <a href="/other" onClick={(event) => { event.preventDefault(); onNavigate?.(); }}>Leave</a>;
}

describe('useUnsavedChangesGuard', () => {
  afterEach(() => vi.restoreAllMocks());

  it('blocks in-app links when the editor keeps unsaved changes', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const navigate = vi.fn();
    render(<DirtyForm onNavigate={navigate} />);

    expect(fireEvent.click(screen.getByRole('link', { name: 'Leave' }))).toBe(false);
    expect(confirm).toHaveBeenCalledWith('Discard edits?');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('allows in-app links after discard is confirmed', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const navigate = vi.fn();
    render(<DirtyForm onNavigate={navigate} />);

    fireEvent.click(screen.getByRole('link', { name: 'Leave' }));
    expect(navigate).toHaveBeenCalledOnce();
  });

  it('marks browser unloads as requiring confirmation', () => {
    render(<DirtyForm />);
    const event = new Event('beforeunload', { cancelable: true });

    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });
});
