import { useEffect, useState } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { Link } from 'react-router-dom';
import { useLocale } from '../app/LocaleContext';
import { clearPortalMode, setPortalMode } from '../app/portalMode';
import {
  isAcceptedExistingParentCredential,
  validateAccountPassword,
  type AccountPasswordKind,
} from '../domain/auth/passwordPolicy';
import { captureReferralFromSearch } from '../domain/referrals/referralCapture';
import { isAppleAppStoreBuild, nativeAuthRedirectUrl } from '../app/platform';

type AuthFlow = 'signIn' | 'signUp' | 'reset' | 'resetVerification';
const APP_STORE_DISTRIBUTION = import.meta.env.VITE_DISTRIBUTION === 'app-store';

// Parent accounts use a memorable six-digit PIN. Existing accounts that still
// use the former 8+ character password remain supported during sign-in.
export function SignIn() {
  const { t, locale, setLocale } = useLocale();
  const { signIn } = useAuthActions();
  const appleAppStoreBuild = APP_STORE_DISTRIBUTION || isAppleAppStoreBuild();
  const isStaffInvite = !appleAppStoreBuild && (window.location.pathname.startsWith('/admin/accept-invite/')
    || (window.location.pathname === '/admin/accept-invite'
      && new URLSearchParams(window.location.search).has('invite')));
  const [flow, setFlow] = useState<AuthFlow>(() => isStaffInvite ? 'signUp' : 'signIn');
  const [portal, setPortal] = useState<'parent' | 'staff'>(() =>
    !APP_STORE_DISTRIBUTION
      && !appleAppStoreBuild
      && (isStaffInvite || new URLSearchParams(window.location.search).get('portal') === 'staff')
      ? 'staff'
      : 'parent',
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      captureReferralFromSearch(window.location.search, window.localStorage);
    } catch {
      // Members can still enter a referral code later from their Profile.
    }
  }, []);

  const accountType: AccountPasswordKind = !APP_STORE_DISTRIBUTION && portal === 'staff' ? 'staff' : 'parent';
  const requiresNewCredential = flow === 'signUp' || flow === 'resetVerification';
  const requiresSixDigitPin = accountType === 'parent' && requiresNewCredential;

  function resetToSignIn() {
    setFlow('signIn');
    setPassword('');
    setCode('');
    setError('');
    setMessage('');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    setPortalMode(portal);
    try {
      if (flow === 'reset') {
        await signIn('password', {
          email: email.trim().toLowerCase(),
          flow: 'reset',
          redirectTo: nativeAuthRedirectUrl(),
          accountType,
        });
        setFlow('resetVerification');
        setMessage(locale === 'mm' ? 'အီးမေးလ်သို့ ပို့ထားသော ၆ လုံးကုဒ်ကို ဖြည့်ပါ။' : 'Enter the six-digit code sent to your email.');
        return;
      }

      if (flow === 'resetVerification') {
        validateAccountPassword(password, accountType);
        if (!/^\d{6}$/.test(code)) throw new Error('Invalid verification code');
        await signIn('password', {
          email: email.trim().toLowerCase(),
          code,
          newPassword: password,
          flow: 'reset-verification',
          accountType,
        });
        return;
      }

      if (flow === 'signUp') {
        validateAccountPassword(password, accountType);
      } else if (accountType === 'parent' && !isAcceptedExistingParentCredential(password)) {
        throw new Error('Invalid parent credential');
      }

      await signIn('password', {
        email: email.trim().toLowerCase(),
        password,
        flow,
        accountType,
      });
    } catch {
      clearPortalMode();
      setError(
        locale === 'mm'
          ? flow === 'reset'
            ? 'ပြန်လည်ဝင်ရောက်ရန် အီးမေးလ်ပို့၍ မရပါ။ အီးမေးလ်မှန်ကန်မှုကို စစ်ပြီး ထပ်မံကြိုးစားပါ။'
            : flow === 'resetVerification'
              ? 'အတည်ပြုကုဒ် မှားနေသည် သို့မဟုတ် သက်တမ်းကုန်သွားပါပြီ။'
              : 'အီးမေးလ်နှင့် PIN/စကားဝှက်ကို စစ်ပြီး ထပ်မံကြိုးစားပါ။'
          : flow === 'reset'
            ? 'Could not send the recovery email. Check the address and try again.'
            : flow === 'resetVerification'
              ? 'The verification code is invalid or has expired.'
              : 'Check your email and PIN/password, then try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function continueWithGoogle() {
    setError('');
    setMessage('');
    setBusy(true);
    setPortalMode(portal);
    try {
      await signIn('google', {
        redirectTo: isStaffInvite ? window.location.href : window.location.origin,
      });
    } catch {
      clearPortalMode();
      setError(
        locale === 'mm'
          ? 'Google အကောင့်ဖြင့် ဝင်၍မရပါ။ ထပ်မံကြိုးစားပါ။'
          : 'Could not continue with Google. Please try again.',
      );
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-5 py-8">
      <div className="text-center">
        <div aria-hidden className="text-5xl">🌱</div>
        <h1 className="mt-2 text-xl font-bold text-sky-deep">{t('app.name')}</h1>
        <p className="text-ink-soft">{t('app.tagline')}</p>
      </div>

      {!APP_STORE_DISTRIBUTION && <div className={`grid rounded-pill border border-line bg-white p-1 ${appleAppStoreBuild ? 'grid-cols-1' : 'grid-cols-2'}`}>
        <button
          type="button"
          onClick={() => { if (!isStaffInvite) { setPortal('parent'); resetToSignIn(); } }}
          disabled={isStaffInvite}
          className={`rounded-pill px-3 py-2 text-sm font-semibold ${portal === 'parent' ? 'bg-sky text-white' : 'text-ink-soft'}`}
        >
          {locale === 'mm' ? 'မိဘဝင်ရန်' : 'Parent sign in'}
        </button>
        {!appleAppStoreBuild && <button
          type="button"
          onClick={() => { setPortal('staff'); if (!isStaffInvite) resetToSignIn(); }}
          className={`rounded-pill px-3 py-2 text-sm font-semibold ${portal === 'staff' ? 'bg-sky text-white' : 'text-ink-soft'}`}
        >
          {locale === 'mm' ? 'အဖွဲ့ဝင်/ပညာရှင်ဝင်ရန်' : 'Staff/reviewer sign in'}
        </button>}
      </div>}

      <form onSubmit={submit} className="space-y-3 rounded-card border border-line bg-white p-5 shadow-card">
        <h2 className="font-semibold text-ink">
          {APP_STORE_DISTRIBUTION
            ? flow === 'reset' || flow === 'resetVerification'
              ? locale === 'mm' ? 'အကောင့် ပြန်လည်ဝင်ရောက်ရန်' : 'Recover account'
              : flow === 'signUp'
                ? locale === 'mm' ? 'အကောင့်သစ် ဖွင့်ရန်' : 'Create account'
                : locale === 'mm' ? 'မိဘအကောင့်ဝင်ရန်' : 'Parent sign in'
            : flow === 'reset' || flow === 'resetVerification'
              ? locale === 'mm' ? 'အကောင့် ပြန်လည်ဝင်ရောက်ရန်' : 'Recover account'
              : flow === 'signUp'
                ? locale === 'mm' ? 'အကောင့်သစ် ဖွင့်ရန်' : 'Create account'
                : portal === 'staff'
                  ? locale === 'mm' ? 'အဖွဲ့ဝင် သို့မဟုတ် ပညာရှင်အကောင့်ဝင်ရန်' : 'Staff or reviewer sign in'
                  : locale === 'mm' ? 'မိဘအကောင့်ဝင်ရန်' : 'Parent sign in'}
        </h2>

        {!APP_STORE_DISTRIBUTION && portal === 'staff' && flow !== 'reset' && flow !== 'resetVerification' && (
          <p className="rounded-xl bg-pastel-yellow/50 p-3 text-xs text-ink">
            {locale === 'mm'
              ? isStaffInvite
                ? 'ဖိတ်ကြားထားသော အီးမေးလ်အတိအကျဖြင့် အကောင့်သစ်ဖွင့်ပါ။ အဖွဲ့ဝင်စကားဝှက်သည် အနည်းဆုံး ၈ လုံး ရှိရပါမည်။'
                : 'ပိုင်ရှင်က ဖိတ်ကြားထားသော အဖွဲ့ဝင်နှင့် ပညာရှင်များအတွက် ဖြစ်သည်။'
              : isStaffInvite
                ? 'Use the exact invited email and a staff password of at least eight characters.'
                : 'For staff and reviewers invited by the owner.'}
          </p>
        )}

        {!APP_STORE_DISTRIBUTION && !appleAppStoreBuild && (flow === 'signIn' || flow === 'signUp') && (
          <>
            <button
              type="button"
              onClick={() => void continueWithGoogle()}
              disabled={busy}
              className="flex min-h-touch w-full items-center justify-center gap-3 rounded-pill border border-line bg-white px-5 py-3 font-semibold text-ink shadow-sm disabled:opacity-50"
            >
              <span aria-hidden className="grid size-6 place-items-center rounded-full bg-white text-base font-bold text-[#4285F4]">G</span>
              {locale === 'mm' ? 'Google အကောင့်ဖြင့် ဆက်လုပ်မည်' : 'Continue with Google'}
            </button>
            <div className="flex items-center gap-3 text-xs text-ink-soft" aria-hidden>
              <span className="h-px flex-1 bg-line" />
              <span>{locale === 'mm' ? 'သို့မဟုတ်' : 'or'}</span>
              <span className="h-px flex-1 bg-line" />
            </div>
          </>
        )}

        <label className="block text-sm">
          {locale === 'mm' ? 'အီးမေးလ်' : 'Email'}
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={flow === 'resetVerification'}
            className="mt-1 block min-h-touch w-full rounded-lg border border-line px-3 py-2 disabled:bg-canvas"
          />
        </label>

        {flow === 'resetVerification' && (
          <label className="block text-sm">
            {locale === 'mm' ? 'အီးမေးလ်မှ ၆ လုံးအတည်ပြုကုဒ်' : 'Six-digit email code'}
            <input
              type="text"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              className="mt-1 block min-h-touch w-full rounded-lg border border-line px-3 py-2 text-center text-xl tracking-[0.35em]"
            />
          </label>
        )}

        {flow !== 'reset' && (
          <label className="block text-sm">
            {locale === 'mm'
              ? requiresSixDigitPin
                ? 'ဂဏန်း ၆ လုံး PIN အသစ်'
                : accountType === 'parent' ? 'PIN (သို့) ယခင် စကားဝှက်' : 'စကားဝှက်'
              : requiresSixDigitPin
                ? 'New 6-digit PIN'
                : accountType === 'parent' ? 'PIN or existing password' : 'Password'}
            <input
              type="password"
              required
              autoComplete={requiresNewCredential ? 'new-password' : 'current-password'}
              inputMode={requiresSixDigitPin ? 'numeric' : undefined}
              pattern={requiresSixDigitPin ? '[0-9]{6}' : undefined}
              minLength={requiresSixDigitPin ? 6 : accountType === 'staff' ? 8 : 6}
              maxLength={requiresSixDigitPin ? 6 : undefined}
              value={password}
              onChange={(event) => setPassword(requiresSixDigitPin ? event.target.value.replace(/\D/g, '').slice(0, 6) : event.target.value)}
              className="mt-1 block min-h-touch w-full rounded-lg border border-line px-3 py-2"
            />
            {requiresSixDigitPin && <span className="mt-1 block text-xs text-ink-soft">{locale === 'mm' ? 'မမှန်းဆလွယ်သော ဂဏန်း ၆ လုံးကို သတ်မှတ်ပါ။' : 'Choose six digits that are difficult to guess.'}</span>}
          </label>
        )}

        {message && <p className="rounded-xl bg-mint-soft p-3 text-sm text-sky-deep" role="status">{message}</p>}
        {error && <p className="text-sm text-state-red" role="alert">⚠️ {error}</p>}

        <button type="submit" disabled={busy} className="min-h-touch w-full rounded-pill bg-sky px-6 py-3 font-semibold text-white disabled:opacity-50">
          {busy ? '…'
            : flow === 'reset' ? (locale === 'mm' ? 'အတည်ပြုကုဒ် ပို့မည်' : 'Send recovery code')
              : flow === 'resetVerification' ? (locale === 'mm' ? 'PIN/စကားဝှက် ပြောင်းမည်' : 'Change credential')
                : flow === 'signIn' ? (locale === 'mm' ? 'ဝင်မည်' : 'Sign in')
                  : (locale === 'mm' ? 'အကောင့်ဖွင့်မည်' : 'Create account')}
        </button>

        {flow === 'signIn' && (
          <button type="button" onClick={() => { setFlow('reset'); setPassword(''); setError(''); }} className="w-full text-center text-sm font-semibold text-sky-deep">
            {locale === 'mm' ? 'PIN/စကားဝှက် မေ့နေပါသလား?' : 'Forgot PIN/password?'}
          </button>
        )}
        {(flow === 'reset' || flow === 'resetVerification') && (
          <button type="button" onClick={resetToSignIn} className="w-full text-center text-sm text-sky-deep">
            {locale === 'mm' ? 'အကောင့်ဝင်ရန် ပြန်သွားမည်' : 'Back to sign in'}
          </button>
        )}
        {(portal === 'parent' || isStaffInvite) && flow !== 'reset' && flow !== 'resetVerification' && (
          <button type="button" onClick={() => { setFlow(flow === 'signIn' ? 'signUp' : 'signIn'); setPassword(''); setError(''); }} className="w-full text-center text-sm text-sky-deep">
            {flow === 'signIn'
              ? (locale === 'mm' ? 'အကောင့်မရှိသေးပါက အသစ်ဖွင့်ရန်' : 'Create a new account')
              : (locale === 'mm' ? 'အကောင့်ရှိပြီးသားဆိုလျှင် ဝင်ရန်' : 'Sign in to an existing account')}
          </button>
        )}
      </form>

      <button type="button" onClick={() => setLocale(locale === 'mm' ? 'en' : 'mm')} className="mx-auto rounded-pill border border-line bg-white px-4 py-1 text-sm text-ink-soft">
        {locale === 'mm' ? 'English' : 'မြန်မာ'}
      </button>
      <p className="text-center text-xs text-ink-soft">{t('result.disclaimer.nonDiagnostic')}</p>
      <nav aria-label={locale === 'mm' ? 'ဥပဒေနှင့် အကူအညီ' : 'Legal and support'} className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-semibold text-sky-deep">
        <Link to="/privacy">{locale === 'mm' ? 'ကိုယ်ရေးမူဝါဒ' : 'Privacy'}</Link>
        <Link to="/account-deletion">{locale === 'mm' ? 'အကောင့်ဖျက်နည်း' : 'Account deletion'}</Link>
        <Link to="/support">{locale === 'mm' ? 'အကူအညီ' : 'Support'}</Link>
      </nav>
    </div>
  );
}
