import { useId, useRef } from 'react';
import { useFocusTrap } from './useFocusTrap';

// Small, accessible confirm dialog for destructive actions. Labelled via
// aria-labelledby, moves focus to the (non-destructive) Cancel button on open,
// keeps focus inside while open, closes on Escape and hands focus back to
// whatever opened it. Shared so the delete-child / delete-account /
// delete-record prompts stay consistent instead of being copy-pasted per screen.
export function ConfirmDialog({
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Cancel is rendered first, so it takes initial focus: a destructive prompt
  // must never open with the destructive button under the keyboard.
  useFocusTrap(dialogRef, { onEscape: onCancel });

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="rounded-card border-2 border-state-red bg-pink/40 p-4"
    >
      <p id={titleId} className="font-semibold text-ink">{message}</p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onCancel}
          className="min-h-touch rounded-pill border border-line px-4 py-2">
          {cancelLabel}
        </button>
        <button type="button" onClick={onConfirm}
          className="min-h-touch rounded-pill bg-state-red px-4 py-2 font-semibold text-white">
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
