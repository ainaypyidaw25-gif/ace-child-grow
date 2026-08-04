import { useEffect } from 'react';

function anchorForEvent(event: MouseEvent): HTMLAnchorElement | null {
  if (!(event.target instanceof Element)) return null;
  return event.target.closest('a[href]');
}

/** Protects dirty forms from browser unloads and React Router link changes. */
export function useUnsavedChangesGuard(dirty: boolean, message: string): void {
  useEffect(() => {
    if (!dirty) return undefined;

    let historyIndex = typeof window.history.state?.idx === 'number'
      ? window.history.state.idx as number
      : null;
    let restoringHistory = false;

    // window.confirm is intentional here, not an oversight: link clicks and
    // popstate must be interceptable synchronously (a React-rendered dialog
    // can't block the event loop to decide preventDefault/history.go before
    // the browser proceeds), and beforeunload can only ever show the
    // browser's own native prompt — no in-app dialog is possible there.
    const confirmDiscard = () => window.confirm(message);
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    const guardLinkNavigation = (event: MouseEvent) => {
      const anchor = anchorForEvent(event);
      if (!anchor || anchor.target === '_blank' || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.href === window.location.href) return;
      if (!confirmDiscard()) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    const guardHistoryNavigation = () => {
      const nextIndex = typeof window.history.state?.idx === 'number'
        ? window.history.state.idx as number
        : null;
      if (restoringHistory) {
        restoringHistory = false;
        historyIndex = nextIndex;
        return;
      }
      if (confirmDiscard()) {
        historyIndex = nextIndex;
        return;
      }
      if (historyIndex !== null && nextIndex !== null && historyIndex !== nextIndex) {
        restoringHistory = true;
        window.history.go(historyIndex - nextIndex);
      }
    };

    window.addEventListener('beforeunload', warnBeforeLeaving);
    document.addEventListener('click', guardLinkNavigation, true);
    window.addEventListener('popstate', guardHistoryNavigation);
    return () => {
      window.removeEventListener('beforeunload', warnBeforeLeaving);
      document.removeEventListener('click', guardLinkNavigation, true);
      window.removeEventListener('popstate', guardHistoryNavigation);
    };
  }, [dirty, message]);
}
