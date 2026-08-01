import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Keep keyboard focus inside an open dialog, and give it back when the dialog
 * closes.
 *
 * `aria-modal="true"` tells assistive technology that the rest of the page is
 * inert. Without a trap that promise is false: Tab walks straight into the
 * controls behind the overlay, which a keyboard or switch user cannot see is
 * still there. Escape is handled here too, so every dialog can be dismissed
 * without a pointer.
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  options: { onEscape?: () => void; autoFocus?: boolean; active?: boolean } = {},
) {
  // `active` lets a caller keep hook order stable across an early return (React
  // requires it) while the dialog itself is still closed — and re-arms the trap
  // at the moment the dialog appears.
  const { autoFocus = true, active = true } = options;
  // Held in a ref so an inline arrow function from the caller does not re-run
  // the effect on every render — that would keep yanking focus back.
  const onEscape = useRef(options.onEscape);
  onEscape.current = options.onEscape;

  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    if (!node) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusable = () => Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE));

    if (autoFocus) (focusable()[0] ?? node).focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (onEscape.current) {
          event.preventDefault();
          onEscape.current();
        }
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const outside = !node.contains(active);
      if (event.shiftKey && (active === first || outside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || outside)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      previouslyFocused?.focus?.();
    };
  }, [ref, autoFocus, active]);
}
