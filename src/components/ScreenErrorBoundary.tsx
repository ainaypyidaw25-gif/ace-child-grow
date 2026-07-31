import { Component, type ErrorInfo, type ReactNode } from 'react';
import { isChunkLoadFailure, recoverStaleChunk } from '../app/chunkRecovery';

type Props = {
  children: ReactNode;
  locale: 'mm' | 'en';
  onRetry?: () => void;
  /** Seam for tests; in production recovery reloads the shell. */
  reload?: () => void;
};

type State = { failed: boolean; staleShell: boolean };

/**
 * Every routed screen sits behind this boundary, and every routed screen is
 * `React.lazy`. That makes this the ONLY place a deployment-stale chunk can be
 * caught: React handles the failed import's rejection itself and hands the
 * error here, so it never reaches the `unhandledrejection` listener that
 * `installChunkRecovery` also installs.
 *
 * Before this, a phone still holding the pre-deployment shell asked for a
 * hashed file that no longer existed, and was told to check its connection —
 * advice that cannot fix it — with nothing reloading the shell.
 *
 * The two failures need different words as well as different handling. A stale
 * shell is fixed by reopening the app. A screen whose data call threw is not,
 * and telling somebody to check a connection that is plainly working sends
 * them, and whoever they report it to, after the wrong thing.
 */
export class ScreenErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, staleShell: false };

  static getDerivedStateFromError(error: unknown): State {
    return { failed: true, staleShell: isChunkLoadFailure(error) };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ACE Child Grow screen error', error, info.componentStack);
    if (!isChunkLoadFailure(error)) return;
    // Reload once to pick up the current shell. recoverStaleChunk keeps its own
    // cooldown, so a genuinely broken deployment cannot turn into a reload
    // loop — and when it declines, the message below is what the reader gets.
    recoverStaleChunk(
      window.sessionStorage,
      this.props.reload ?? (() => window.location.reload()),
    );
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    const mm = this.props.locale === 'mm';
    const stale = this.state.staleShell;

    const title = stale
      ? mm ? 'အက်ပ်ကို အသစ်ပြင်ဆင်ထားပါသည်' : 'The app has been updated'
      : mm ? 'ဤစာမျက်နှာကို ခဏဖွင့်၍ မရသေးပါ' : 'This page could not open';
    const detail = stale
      ? mm
        ? 'အက်ပ်ကို အပြီးပိတ်ပြီး ပြန်ဖွင့်ပါ။ သင့်အချက်အလက်များ ပျောက်မသွားပါ။'
        : 'Close the app completely and open it again. Nothing you saved is lost.'
      : mm
        ? 'ထပ်မံကြိုးစားကြည့်ပါ။ မရသေးပါက ဤစာမျက်နှာကို မှတ်ထားပြီး အကြောင်းကြားပါ။'
        : 'Try again. If it keeps failing, note which page this was and report it.';

    return (
      <section className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center rounded-card border border-line bg-white p-5 text-center shadow-card" role="alert">
        <h1 className="text-lg font-bold text-ink">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-ink-soft">{detail}</p>
        <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              if (this.props.onRetry) this.props.onRetry();
              else if (this.props.reload) this.props.reload();
              else window.location.reload();
            }}
            className="rounded-pill bg-sky-deep px-5 py-2 text-sm font-semibold text-white"
          >
            {mm ? 'ထပ်မံကြိုးစားမည်' : 'Try again'}
          </button>
          <a href="/home" role="button" className="rounded-pill border border-line px-5 py-2 text-sm font-semibold text-sky-deep">
            {mm ? 'ပင်မစာမျက်နှာသို့' : 'Go home'}
          </a>
        </div>
      </section>
    );
  }
}
