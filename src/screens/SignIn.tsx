import { useEffect, useState } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { Link } from 'react-router-dom';
import { useLocale } from '../app/LocaleContext';
import { clearPortalMode, setPortalMode } from '../app/portalMode';
import {
  isAcceptedExistingParentCredential,
  hasLikelyWebPrefixInEmail,
  isStrongStaffPassword,
  isValidEmailInput,
  isSixDigitPin,
  validateAccountPassword,
  type AccountPasswordKind,
} from '../domain/auth/passwordPolicy';
import { captureReferralFromSearch } from '../domain/referrals/referralCapture';
import { api } from '../../convex/_generated/api';
import { convex, convexDeploymentUrl } from '../lib/convexClient';
import {
  getAuthRedirectUrl,
  isAppleAppStoreBuild,
  NATIVE_AUTH_CALLBACK_ERROR_EVENT,
  startOAuthSignIn,
} from '../app/platform';

type AuthFlow = 'signIn' | 'signUp' | 'reset' | 'resetVerification';
type OAuthProvider = 'apple' | 'google';

// Parent accounts use a memorable six-digit PIN. Existing accounts that still
// use the former 8+ character password remain supported during sign-in.
export function SignIn() {
  const { t, locale, setLocale } = useLocale();
  const { signIn } = useAuthActions();
  const appStoreBuild = isAppleAppStoreBuild();
  const isStaffInvite = !appStoreBuild && (window.location.pathname.startsWith('/admin/accept-invite/')
    || (window.location.pathname === '/admin/accept-invite'
      && new URLSearchParams(window.location.search).has('invite')));
  const [flow, setFlow] = useState<AuthFlow>(() => isStaffInvite ? 'signUp' : 'signIn');
  const [portal, setPortal] = useState<'parent' | 'staff'>(() =>
    !appStoreBuild && (isStaffInvite || new URLSearchParams(window.location.search).get('portal') === 'staff') ? 'staff' : 'parent',
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  // The iOS App Store build uses only our first-party email + PIN/password
  // flow. Keeping third-party OAuth out of that binary's visible sign-in flow
  // avoids handing App Review to a browser-based OAuth session that cannot
  // reliably return control to the native app on iPad.
  const [showCredentialForm, setShowCredentialForm] = useState(appStoreBuild || isStaffInvite);

  useEffect(() => {
    try {
      captureReferralFromSearch(window.location.search, window.localStorage);
    } catch {
      // Members can still enter a referral code later from their Profile.
    }
  }, []);

  useEffect(() => {
    const showNativeCallbackError = () => {
      setBusy(false);
      clearPortalMode();
      setError(
        locale === 'mm'
          ? 'အကောင့်ဝင်ခြင်းကို အပြီးသတ်၍ မရပါ။ ထပ်မံကြိုးစားပါ။'
          : 'Sign-in could not be completed. Please try again.',
      );
    };
    window.addEventListener(NATIVE_AUTH_CALLBACK_ERROR_EVENT, showNativeCallbackError);
    return () => window.removeEventListener(NATIVE_AUTH_CALLBACK_ERROR_EVENT, showNativeCallbackError);
  }, [locale]);

  const accountType: AccountPasswordKind = !appStoreBuild && portal === 'staff' ? 'staff' : 'parent';
  const requiresNewCredential = flow === 'signUp' || flow === 'resetVerification';
  const requiresSixDigitPin = accountType === 'parent' && requiresNewCredential;
  const normalizedEmail = email.trim().toLowerCase();
  const emailReady = isValidEmailInput(normalizedEmail);
  const credentialReady = flow === 'reset'
    || (accountType === 'parent'
      ? (requiresNewCredential ? isSixDigitPin(password) : isAcceptedExistingParentCredential(password))
      : isStrongStaffPassword(password));
  const verificationCodeReady = flow !== 'resetVerification' || /^\d{6}$/.test(code);
  const formReady = emailReady && credentialReady && verificationCodeReady;
  const likelyWebPrefix = hasLikelyWebPrefixInEmail(email);
  const showEmailCredentialFields = showCredentialForm || flow !== 'signIn';

  function resetToSignIn() {
    setFlow('signIn');
    setPassword('');
    setCode('');
    setError('');
    setMessage('');
    setShowCredentialForm(appStoreBuild);
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
          redirectTo: getAuthRedirectUrl(),
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

  async function continueWithOAuth(provider: OAuthProvider) {
    setError('');
    setMessage('');
    setBusy(true);
    setPortalMode(portal);
    try {
      const redirectPath = isStaffInvite
        ? `${window.location.pathname}${window.location.search}${window.location.hash}`
        : '';
      await startOAuthSignIn(
        provider,
        getAuthRedirectUrl(redirectPath),
        signIn,
        {
          storageNamespace: convexDeploymentUrl,
          requestOAuth: async (selectedProvider, params) => convex.action(api.auth.signIn, {
            provider: selectedProvider,
            params,
            calledBy: 'capacitor-in-app-browser',
          }),
        },
      );
    } catch {
      clearPortalMode();
      setError(
        locale === 'mm'
          ? `${provider === 'apple' ? 'Apple' : 'Google'} အကောင့်ဖြင့် ဝင်၍မရပါ။ ထပ်မံကြိုးစားပါ။`
          : `Could not continue with ${provider === 'apple' ? 'Apple' : 'Google'}. Please try again.`,
      );
    } finally {
      // Android keeps the WebView alive while OAuth runs in the browser. If
      // control returns without a completed callback, the form must not stay
      // permanently disabled.
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen min-h-[100dvh] max-w-md flex-col justify-center gap-6 px-5 py-[calc(2rem+env(safe-area-inset-top,0px))] max-[430px]:justify-start">
      <div className="text-center">
        <div aria-hidden className="text-5xl">🌱</div>
        <h1 className="mt-2 text-xl font-bold text-sky-deep">{t('app.name')}</h1>
        <p className="text-ink-soft">{t('app.tagline')}</p>
      </div>

      {!appStoreBuild && <div className="grid grid-cols-2 rounded-pill border border-line bg-white p-1">
        <button
          type="button"
          onClick={() => { if (!isStaffInvite) { setPortal('parent'); resetToSignIn(); } }}
          disabled={isStaffInvite}
          className={`rounded-pill px-3 py-2 text-sm font-semibold ${portal === 'parent' ? 'bg-sky text-white' : 'text-ink-soft'}`}
        >
          {locale === 'mm' ? 'မိဘဝင်ရန်' : 'Parent sign in'}
        </button>
        <button
          type="button"
          onClick={() => { setPortal('staff'); if (!isStaffInvite) resetToSignIn(); }}
          className={`rounded-pill px-3 py-2 text-sm font-semibold ${portal === 'staff' ? 'bg-sky text-white' : 'text-ink-soft'}`}
        >
          {locale === 'mm' ? 'အဖွဲ့ဝင်/ပညာရှင်ဝင်ရန်' : 'Staff/reviewer sign in'}
        </button>
      </div>}

      <form onSubmit={submit} className="space-y-3 rounded-card border border-line bg-white p-5 shadow-card">
        <h2 className="font-semibold text-ink">
          {flow === 'reset' || flow === 'resetVerification'
            ? locale === 'mm' ? 'အကောင့် ပြန်လည်ဝင်ရောက်ရန်' : 'Recover account'
            : flow === 'signUp'
              ? locale === 'mm' ? 'အကောင့်သစ် ဖွင့်ရန်' : 'Create account'
              : portal === 'staff'
                ? locale === 'mm' ? 'အဖွဲ့ဝင် သို့မဟုတ် ပညာရှင်အကောင့်ဝင်ရန်' : 'Staff or reviewer sign in'
                : locale === 'mm' ? 'မိဘအကောင့်ဝင်ရန်' : 'Parent sign in'}
        </h2>

        {!appStoreBuild && portal === 'staff' && flow !== 'reset' && flow !== 'resetVerification' && (
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

        {!appStoreBuild && (flow === 'signIn' || flow === 'signUp') && (
          <>
            <p className="rounded-xl bg-mint-soft px-4 py-3 text-center text-sm text-sky-deep">
              {locale === 'mm'
                ? 'Google သို့မဟုတ် Apple အကောင့်ဖြင့် အလွယ်တကူဝင်နိုင်ပြီး သီးခြား PIN သို့မဟုတ် စကားဝှက် မလိုပါ။'
                : 'Sign in with Google or Apple. No separate PIN or password is needed.'}
            </p>
            {portal === 'parent' && (
              <button
                type="button"
                onClick={() => void continueWithOAuth('apple')}
                disabled={busy}
                className="flex min-h-touch w-full items-center justify-center gap-3 rounded-pill border border-black bg-black px-5 py-3 font-semibold text-white shadow-sm disabled:opacity-50"
              >
                <span aria-hidden className="text-2xl leading-none"></span>
                {locale === 'mm' ? 'Apple အကောင့်ဖြင့် ဆက်လုပ်မည်' : 'Continue with Apple'}
              </button>
            )}
            <button
              type="button"
              onClick={() => void continueWithOAuth('google')}
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

        {message && <p className="rounded-xl bg-mint-soft p-3 text-sm text-sky-deep" role="status">{message}</p>}
        {error && <p className="text-sm text-state-red-deep" role="alert">⚠️ {error}</p>}

        {!appStoreBuild && flow === 'signIn' && !showEmailCredentialFields && (
          <button
            type="button"
            onClick={() => setShowCredentialForm(true)}
            className="min-h-touch w-full rounded-pill border border-line bg-white px-5 py-3 text-sm font-semibold text-sky-deep"
          >
            {locale === 'mm' ? 'အီးမေးလ်နှင့် PIN/စကားဝှက်ဖြင့် ဝင်မည်' : 'Use email and PIN/password instead'}
          </button>
        )}

        {showEmailCredentialFields && (
          <>
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
              {likelyWebPrefix && (
                <span className="mt-1 block text-xs text-state-red-deep" role="alert">
                  {locale === 'mm'
                    ? 'အီးမေးလ်အစတွင် “www.” ပါနေသည်။ မိမိအကောင့်လိပ်စာမှန်ကြောင်း စစ်ပါ။'
                    : 'This email starts with “www.” Check that it is really part of your account address.'}
                </span>
              )}
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

            {!busy && !formReady && (
              <p className="text-xs text-ink-soft" role="status">
                {!emailReady
                  ? (locale === 'mm' ? 'မှန်ကန်သော အီးမေးလ်လိပ်စာကို ဖြည့်ပါ။' : 'Enter a valid email address.')
                  : !verificationCodeReady
                    ? (locale === 'mm' ? 'အီးမေးလ်မှ ၆ လုံးကုဒ်ကို ဖြည့်ပါ။' : 'Enter the six-digit email code.')
                    : accountType === 'parent'
                      ? (locale === 'mm' ? 'ဂဏန်း ၆ လုံး PIN သို့မဟုတ် ယခင်စကားဝှက် အနည်းဆုံး ၈ လုံးကို ဖြည့်ပါ။' : 'Enter a six-digit PIN or an existing password of at least eight characters.')
                      : (locale === 'mm' ? 'စကားဝှက် အနည်းဆုံး ၈ လုံးကို ဖြည့်ပါ။' : 'Enter a password of at least eight characters.')}
              </p>
            )}

            <button type="submit" disabled={busy || !formReady} aria-busy={busy} className="min-h-touch w-full rounded-pill bg-sky px-6 py-3 font-semibold text-white disabled:opacity-50">
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
          </>
        )}
      </form>

      <button type="button" onClick={() => setLocale(locale === 'mm' ? 'en' : 'mm')} className="mx-auto rounded-pill border border-line bg-white px-4 py-1 text-sm text-ink-soft">
        {locale === 'mm' ? 'English' : 'မြန်မာ'}
      </button>
      <p className="text-center text-xs text-ink-soft">{t('result.disclaimer.nonDiagnostic')}</p>
      <nav aria-label={locale === 'mm' ? 'အကူအညီနှင့် မူဝါဒများ' : 'Help and policies'} className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-semibold text-sky-deep">
        <Link to="/support">{locale === 'mm' ? 'အကူအညီ' : 'Support'}</Link>
        <Link to="/privacy">{locale === 'mm' ? 'ကိုယ်ရေးမူဝါဒ' : 'Privacy'}</Link>
        <Link to="/account-deletion">{locale === 'mm' ? 'အကောင့်ဖျက်နည်း' : 'Account deletion'}</Link>
      </nav>
    </div>
  );
}
