import { useState } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useLocale } from '../app/LocaleContext';

// Email + password auth (Convex Auth). Sign up or sign in; the same screen.
export function SignIn() {
  const { t, locale, setLocale } = useLocale();
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signIn('password', { email, password, flow });
    } catch {
      setError(
        locale === 'mm'
          ? 'အီးမေးလ် သို့မဟုတ် စကားဝှက် မှားနေသည် (သို့) အကောင့်ရှိပြီးသား ဖြစ်နိုင်သည်။'
          : 'Wrong email/password, or the account state does not match.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-5">
      <div className="text-center">
        <div aria-hidden className="text-5xl">🌱</div>
        <h1 className="mt-2 text-xl font-bold text-sky-deep">{t('app.name')}</h1>
        <p className="text-ink-soft">{t('app.tagline')}</p>
      </div>

      <form onSubmit={submit} className="space-y-3 rounded-card border border-line bg-white p-5 shadow-card">
        <h2 className="font-semibold text-ink">
          {flow === 'signIn'
            ? locale === 'mm' ? 'အကောင့်ဝင်ရန်' : 'Sign in'
            : locale === 'mm' ? 'အကောင့်သစ် ဖွင့်ရန်' : 'Create account'}
        </h2>
        <label className="block text-sm">
          {locale === 'mm' ? 'အီးမေးလ်' : 'Email'}
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-line px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          {locale === 'mm' ? 'စကားဝှက်' : 'Password'}
          <input
            type="password" required minLength={8} value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-line px-3 py-2"
          />
        </label>
        {error && <p className="text-sm text-state-red">⚠️ {error}</p>}
        <button
          type="submit" disabled={busy}
          className="min-h-touch w-full rounded-pill bg-sky px-6 py-3 font-semibold text-white disabled:opacity-50"
        >
          {busy ? '…' : flow === 'signIn'
            ? (locale === 'mm' ? 'ဝင်မည်' : 'Sign in')
            : (locale === 'mm' ? 'ဖွင့်မည်' : 'Sign up')}
        </button>
        <button
          type="button"
          onClick={() => setFlow(flow === 'signIn' ? 'signUp' : 'signIn')}
          className="w-full text-center text-sm text-sky-deep"
        >
          {flow === 'signIn'
            ? (locale === 'mm' ? 'အကောင့်မရှိသေးဘူးလား? အသစ်ဖွင့်ရန်' : 'No account? Create one')
            : (locale === 'mm' ? 'အကောင့်ရှိပြီးသားလား? ဝင်ရန်' : 'Have an account? Sign in')}
        </button>
      </form>

      <button
        type="button" onClick={() => setLocale(locale === 'mm' ? 'en' : 'mm')}
        className="mx-auto rounded-pill border border-line bg-white px-4 py-1 text-sm text-ink-soft"
      >
        {locale === 'mm' ? 'English' : 'မြန်မာ'}
      </button>
      <p className="text-center text-xs text-ink-soft">{t('result.disclaimer.nonDiagnostic')}</p>
    </div>
  );
}
