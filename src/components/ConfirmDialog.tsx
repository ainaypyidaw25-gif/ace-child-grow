import { useEffect, useId, useRef } from 'react';

// Small, accessible confirm dialog for destructive actions. Labelled via
// aria-labelledby, moves focus to the (non-destructive) Cancel button on open,
// and closes on Escape. Shared so the delete-child / delete-account / delete-record
// prompts stay consistent instead of being copy-pasted per screen.
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
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="rounded-card border-2 border-state-red bg-pink/40 p-4"
    >
      <p id={titleId} className="font-semibold text-ink">{message}</p>
      <div className="mt-3 flex gap-2">
        <button ref={cancelRef} type="button" onClick={onCancel}
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
