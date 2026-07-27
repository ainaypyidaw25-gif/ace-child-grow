import { useState } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useLocale } from '../app/LocaleContext';
import { clearPortalMode, setPortalMode } from '../app/portalMode';

// Email + password auth (Convex Auth). Sign up or sign in; the same screen.
export function SignIn() {
  const { t, locale, setLocale } = useLocale();
  const { signIn } = useAuthActions();
  const isStaffInvite = window.location.pathname.startsWith('/admin/accept-invite/')
    || (window.location.pathname === '/admin/accept-invite'
      && new URLSearchParams(window.location.search).has('invite'));
  const [flow, setFlow] = useState<'signIn' | 'signUp'>(() => isStaffInvite ? 'signUp' : 'signIn');
  const [portal, setPortal] = useState<'parent' | 'staff'>(() =>
    isStaffInvite || new URLSearchParams(window.location.search).get('portal') === 'staff' ? 'staff' : 'parent',
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    setPortalMode(portal);
    try {
      await signIn('password', { email, password, flow });
    } catch {
      clearPortalMode();
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

      <div className="grid grid-cols-2 rounded-pill border border-line bg-white p-1">
        <button
          type="button"
          onClick={() => { if (!isStaffInvite) setPortal('parent'); }}
          disabled={isStaffInvite}
          className={`rounded-pill px-3 py-2 text-sm font-semibold ${portal === 'parent' ? 'bg-sky text-white' : 'text-ink-soft'}`}
        >
          {locale === 'mm' ? 'မိဘဝင်ရန်' : 'Parent sign in'}
        </button>
        <button
          type="button"
          onClick={() => { setPortal('staff'); if (!isStaffInvite) setFlow('signIn'); }}
          className={`rounded-pill px-3 py-2 text-sm font-semibold ${portal === 'staff' ? 'bg-sky text-white' : 'text-ink-soft'}`}
        >
          {locale === 'mm' ? 'အဖွဲ့ဝင်/ပညာရှင်ဝင်ရန်' : 'Staff/reviewer sign in'}
        </button>
      </div>

      <form onSubmit={submit} className="space-y-3 rounded-card border border-line bg-white p-5 shadow-card">
        <h2 className="font-semibold text-ink">
          {flow === 'signIn'
            ? portal === 'staff'
              ? locale === 'mm' ? 'စီမံခန့်ခွဲသူ သို့မဟုတ် ပညာရှင်အကောင့်ဝင်ရန်' : 'Staff or reviewer sign in'
              : locale === 'mm' ? 'မိဘအကောင့်ဝင်ရန်' : 'Parent sign in'
            : locale === 'mm' ? 'အကောင့်သစ် ဖွင့်ရန်' : 'Create account'}
        </h2>
        {portal === 'staff' && (
          <p className="rounded-xl bg-pastel-yellow/50 p-3 text-xs text-ink">
            {locale === 'mm'
              ? isStaffInvite
                ? 'ဖိတ်ကြားထားသော အီးမေးလ်အတိအကျဖြင့် အကောင့်သစ်ဖွင့်ပါ။ အကောင့်ရှိပြီးသားဆိုလျှင် “အကောင့်ဝင်ရန်” ကိုရွေးပါ။ ဝင်ပြီးနောက် ဖိတ်ကြားချက်ကို လက်ခံနိုင်ပါမည်။'
                : 'ပိုင်ရှင်က ဖိတ်ကြားထားသော အဖွဲ့ဝင်နှင့် ပညာရှင်များအတွက် ဖြစ်သည်။'
              : isStaffInvite
                ? 'Create an account with the exact invited email, or choose sign in if you already have one. You can accept the invitation after authentication.'
                : 'For staff and reviewers invited by the owner.'}
          </p>
        )}
        <label className="block text-sm">
          {locale === 'mm' ? 'အီးမေးလ်' : 'Email'}
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block min-h-touch w-full rounded-lg border border-line px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          {locale === 'mm' ? 'စကားဝှက်' : 'Password'}
          <input
            type="password" required minLength={8} value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block min-h-touch w-full rounded-lg border border-line px-3 py-2"
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
        {(portal === 'parent' || isStaffInvite) && (
          <button
            type="button"
            onClick={() => setFlow(flow === 'signIn' ? 'signUp' : 'signIn')}
            className="w-full text-center text-sm text-sky-deep"
          >
            {flow === 'signIn'
              ? (locale === 'mm' ? 'အကောင့်မရှိသေးဘူးလား? အသစ်ဖွင့်ရန်' : 'No account? Create one')
              : (locale === 'mm' ? 'အကောင့်ရှိပြီးသားလား? ဝင်ရန်' : 'Have an account? Sign in')}
          </button>
        )}
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
