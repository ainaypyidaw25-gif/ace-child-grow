import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from '../ConfirmDialog';

// ACG-A11Y-003: these dialogs declare aria-modal="true", which tells assistive
// technology the rest of the page is inert. Without a trap that promise is
// false — Tab walks into the background controls a keyboard or switch user
// cannot see are still there.

afterEach(cleanup);

function renderDialog(onCancel = vi.fn(), onConfirm = vi.fn()) {
  const view = render(
    <div>
      <button type="button">background control</button>
      <ConfirmDialog
        message="Delete this child?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </div>,
  );
  return { view, onCancel, onConfirm };
}

describe('ConfirmDialog keyboard accessibility', () => {
  it('opens with focus on the non-destructive action', () => {
    renderDialog();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel' }));
  });

  it('closes on Escape', () => {
    const { onCancel } = renderDialog();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalled();
  });

  it('wraps Tab from the last control back into the dialog, not the background', () => {
    renderDialog();
    const confirm = screen.getByRole('button', { name: 'Delete' });
    const cancel = screen.getByRole('button', { name: 'Cancel' });

    confirm.focus();
    fireEvent.keyDown(document, { key: 'Tab' });

    expect(document.activeElement).toBe(cancel);
    expect(document.activeElement).not.toBe(screen.getByRole('button', { name: 'background control' }));
  });

  it('wraps Shift+Tab from the first control to the last', () => {
    renderDialog();
    const confirm = screen.getByRole('button', { name: 'Delete' });

    screen.getByRole('button', { name: 'Cancel' }).focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

    expect(document.activeElement).toBe(confirm);
  });

  it('gives focus back to the control that opened it', () => {
    // The real flow: a trigger has focus, opens the dialog (which takes focus),
    // and on close focus must return to the trigger rather than the page top.
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <button type="button" onClick={() => setOpen(true)}>Delete child</button>
          {open && (
            <ConfirmDialog
              message="Delete this child?"
              confirmLabel="Delete"
              cancelLabel="Cancel"
              onConfirm={() => setOpen(false)}
              onCancel={() => setOpen(false)}
            />
          )}
        </div>
      );
    }
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Delete child' });
    trigger.focus();

    fireEvent.click(trigger);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel' }));

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
