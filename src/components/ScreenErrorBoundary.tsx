import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  locale: 'mm' | 'en';
  onRetry?: () => void;
};

type State = { failed: boolean };

export class ScreenErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ACE Child Grow screen error', error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    const mm = this.props.locale === 'mm';
    return (
      <section className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center rounded-card border border-line bg-white p-5 text-center shadow-card" role="alert">
        <h1 className="text-lg font-bold text-ink">
          {mm ? 'ဤစာမျက်နှာကို ခဏဖွင့်၍ မရသေးပါ' : 'This page could not open'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-soft">
          {mm ? 'အင်တာနက်ချိတ်ဆက်မှုကို စစ်ပြီး ထပ်မံကြိုးစားပါ။' : 'Check your connection and try again.'}
        </p>
        <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              if (this.props.onRetry) this.props.onRetry();
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
