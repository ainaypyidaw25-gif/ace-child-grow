import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLocale } from '../app/LocaleContext';
import { useAppState } from '../app/AppState';
import { useAuthActions } from '@convex-dev/auth/react';
import { exportData } from '../app/childStore';
import { ageLabels } from '../domain/age/ageLabel';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { clearPortalMode } from '../app/portalMode';
import {
  effectivePlanKeyForCurrentPlatform,
  isAppleAppStoreBuild,
  isFeatureAvailableOnCurrentPlatform,
  isNativeStoreBuild,
} from '../app/platform';
import { ReferralSection } from '../components/ReferralSection';

const PLAN_LABELS = {
  free: { mm: 'အခမဲ့အစီအစဉ်', en: 'Free plan' },
  premium: { mm: 'အထူးအစီအစဉ်', en: 'Premium plan' },
  family: { mm: 'မိသားစုအစီအစဉ်', en: 'Family plan' },
} as const;

type PlanKey = keyof typeof PLAN_LABELS;

export function safePlanKey(value: unknown): PlanKey {
  return value === 'premium' || value === 'family' ? value : 'free';
}

export function hasFamilyProfiles(features: unknown): boolean {
  return Array.isArray(features) && features.includes('family_profiles');
}

export function Profile() {
  const { t, locale, setLocale } = useLocale();
  const { state, dispatch } = useAppState();
  const { signOut } = useAuthActions();
  const navigate = useNavigate();
  const subscription = useQuery(api.subscriptions.mine);
  const familyEnabled = hasFamilyProfiles(subscription?.features)
    && isFeatureAvailableOnCurrentPlatform(subscription?.features ?? [], 'family_profiles');
  const planKey = safePlanKey(effectivePlanKeyForCurrentPlatform(subscription?.planKey ?? 'free'));
  const appStoreBuild = isAppleAppStoreBuild();
  const caregivers = useQuery(api.family.listCaregivers, familyEnabled ? {} : 'skip');
  const inviteCaregiver = useMutation(api.family.inviteCaregiver);
  const revokeCaregiver = useMutation(api.family.revokeCaregiver);
  const deleteAccount = useMutation(api.account.deleteMine);
  const [caregiverEmail, setCaregiverEmail] = useState('');
  const [caregiverMessage, setCaregiverMessage] = useState('');
  const [confirming, setConfirming] = useState<null | 'child' | 'account'>(null);

  function download() {
    const blob = new Blob([exportData(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ace-child-grow-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-sky-deep">{t('nav.profile')}</h1>

      {/* Child switcher */}
      <section className="rounded-card border border-line bg-white p-4 shadow-card">
        <h2 className="mb-2 font-semibold text-ink">
          {locale === 'mm' ? 'ကလေးများ' : 'Children'}
        </h2>
        {state.children.length === 0 ? (
          <Link to="/consent" role="button"
            className="inline-block rounded-pill bg-sky px-5 py-2 font-medium text-white">
            {locale === 'mm' ? 'ကလေး ထည့်ရန်' : 'Add child'}
          </Link>
        ) : (
          <ul className="space-y-2">
            {state.children.map((c) => {
              const labels = ageLabels(new Date(c.birthDate), new Date(), locale, {
                gestationalWeeks: c.gestationalWeeks,
                useCorrected: c.useCorrectedAge,
              });
              const active = c.id === state.activeChildId;
              return (
                <li key={c.id}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
                    active ? 'border-sky bg-mint-soft' : 'border-line'
                  }`}>
                  <button type="button" onClick={() => dispatch({ type: 'switch_child', id: c.id })}
                    className="text-left">
                    <span className="font-medium">{c.nickname}</span>
                    <span className="block text-xs text-ink-soft">
                      {labels.chronological}
                      {labels.corrected && ` · ${labels.corrected} (${t('common.corrected')})`}
                    </span>
                  </button>
                  <span className="flex items-center gap-2">
                    {active && (
                      <Link to="/child-profile" className="text-sm text-sky-deep">
                        {locale === 'mm' ? 'ပရိုဖိုင်' : 'Profile'}
                      </Link>
                    )}
                    {active && !c.isShared && (
                      <Link to="/edit-child" className="text-sm text-sky-deep">
                        {locale === 'mm' ? 'ပြင်ရန်' : 'Edit'}
                      </Link>
                    )}
                    {!c.isShared && <button type="button"
                      aria-label={locale === 'mm' ? `${c.nickname} ကို ဖျက်ရန်` : `Remove ${c.nickname}`}
                      onClick={() => { dispatch({ type: 'switch_child', id: c.id }); setConfirming('child'); }}
                      className="min-h-touch min-w-touch text-sm text-state-red-deep">✕</button>}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        {state.children.length > 0 && familyEnabled && !subscription?.inheritedFamilyAccess && state.children.length < 3 && (
          <Link to="/add-child" className="mt-3 inline-block text-sm text-sky-deep">
            + {locale === 'mm' ? 'ကလေး ထပ်ထည့်ရန်' : 'Add another child'}
          </Link>
        )}
        {state.children.length > 0 && !familyEnabled && !isNativeStoreBuild() && (
          <Link to="/subscription" className="mt-3 inline-block text-sm font-semibold text-sky-deep">
            {locale === 'mm' ? 'ကလေးတစ်ဦးထက်ပို ထည့်ရန် Family အစီအစဉ် ကြည့်မည် →' : 'View Family to add more children →'}
          </Link>
        )}
      </section>

      {/* Subscription account status and payment entry point. */}
      <section className="rounded-card border border-line bg-white p-4 shadow-card">
        <h2 className="font-semibold text-ink">{locale === 'mm' ? 'အသုံးပြုမှုအစီအစဉ်' : 'Membership plan'}</h2>
        {subscription === undefined ? <p className="text-ink-soft">…</p> : (
          <>
            <p className="mt-1 text-lg font-semibold text-sky-deep">{PLAN_LABELS[planKey][locale]}</p>
            <p className="mt-1 text-sm text-ink-soft">
              {locale === 'mm'
                ? planKey === 'free'
                  ? 'လက်ရှိအခြေခံလုပ်ဆောင်ချက်များကို အခမဲ့ အသုံးပြုနိုင်ပါသည်။'
                  : 'ဤအကောင့်တွင် အထူးလုပ်ဆောင်ချက်များ အသုံးပြုနိုင်ပါသည်။'
                : planKey === 'free'
                  ? 'Core features are available free.'
                  : 'Premium features are enabled for this account.'}
            </p>
            {!isNativeStoreBuild() && (
              <Link to="/subscription" className="mt-3 inline-block rounded-pill bg-sky px-4 py-2 text-sm font-semibold text-white">
                {locale === 'mm' ? 'အစီအစဉ်နှင့် ငွေပေးချေမှု ကြည့်ရန်' : 'View plans and payment'}
              </Link>
            )}
          </>
        )}
      </section>

      {!isNativeStoreBuild() && <ReferralSection />}

      {familyEnabled && !subscription?.inheritedFamilyAccess && (
        <section className="rounded-card border border-line bg-white p-4 shadow-card">
          <h2 className="font-semibold text-ink">{locale === 'mm' ? 'မိသားစုစောင့်ရှောက်သူများ' : 'Family caregivers'}</h2>
          <p className="mt-1 text-sm leading-6 text-ink-soft">
            {locale === 'mm' ? 'ပိုင်ရှင်အပါအဝင် စောင့်ရှောက်သူ ၃ ဦးအထိ အသုံးပြုနိုင်ပါသည်။' : 'Up to 3 caregivers including the owner.'}
          </p>
          <form
            className="mt-3 flex flex-col gap-2 sm:flex-row"
            onSubmit={async (event) => {
              event.preventDefault();
              setCaregiverMessage('');
              try {
                await inviteCaregiver({ caregiverEmail });
                setCaregiverEmail('');
                setCaregiverMessage(locale === 'mm' ? 'ဖိတ်ကြားမှုကို မှတ်တမ်းတင်ပြီးပါပြီ။' : 'Invitation recorded.');
              } catch (error) {
                if (error instanceof Error) console.error('inviteCaregiver failed:', error.message);
                setCaregiverMessage(locale === 'mm' ? 'ဖိတ်ကြားမှု မအောင်မြင်ပါ။' : 'Unable to invite.');
              }
            }}
          >
            <input type="email" required value={caregiverEmail} onChange={(event) => setCaregiverEmail(event.target.value)} placeholder={locale === 'mm' ? 'အီးမေးလ်လိပ်စာ' : 'Email address'} className="min-h-touch flex-1 rounded-pill border border-line px-4 py-2 text-sm" />
            <button type="submit" className="rounded-pill bg-sky-deep px-5 py-2 text-sm font-semibold text-white">{locale === 'mm' ? 'ဖိတ်မည်' : 'Invite'}</button>
          </form>
          {caregiverMessage && <p className="mt-2 text-sm text-ink-soft" role="status">{caregiverMessage}</p>}
          {caregivers && caregivers.length > 0 && (
            <ul className="mt-3 divide-y divide-line">
              {caregivers.map((caregiver) => (
                <li key={caregiver._id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span><b>{caregiver.caregiverEmail}</b><span className="ml-2 text-ink-soft">{caregiver.status}</span></span>
                  {caregiver.status !== 'revoked' && (
                    <button type="button" onClick={() => void revokeCaregiver({ id: caregiver._id })} className="text-state-red-deep">
                      {locale === 'mm' ? 'ပယ်ဖျက်မည်' : 'Revoke'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Settings */}
      <section className="rounded-card border border-line bg-white p-4 shadow-card">
        <h2 className="mb-2 font-semibold text-ink">{locale === 'mm' ? 'ဆက်တင်' : 'Settings'}</h2>
        <div className="flex items-center justify-between py-2">
          <span>{locale === 'mm' ? 'ဘာသာစကား' : 'Language'}</span>
          <button type="button" onClick={() => setLocale(locale === 'mm' ? 'en' : 'mm')}
            className="rounded-pill border border-line px-4 py-1">
            {locale === 'mm' ? 'မြန်မာ' : 'English'}
          </button>
        </div>
        <Link to="/favorites" className="flex items-center justify-between py-2 text-sky-deep">
          <span>♥ {locale === 'mm' ? 'သိမ်းထားသော လှုပ်ရှားမှုများ' : 'Saved activities'}</span>
          <span aria-hidden>→</span>
        </Link>
        {!appStoreBuild && <Link to="/offline" className="flex items-center justify-between py-2 text-sky-deep">
          <span>{locale === 'mm' ? 'အင်တာနက်မရှိချိန် ဖတ်ရှုရန် သိမ်းထားသည့် အကြောင်းအရာများ' : 'Offline downloads'}</span>
          <span aria-hidden>→</span>
        </Link>}
        <Link to="/home?tour=parent" className="flex items-center justify-between py-2 text-sky-deep">
          <span>{locale === 'mm' ? 'အသုံးပြုနည်း ပြန်ကြည့်ရန်' : 'Replay app tour'}</span>
          <span aria-hidden>→</span>
        </Link>
        <button type="button" onClick={() => { clearPortalMode(); void signOut(); }}
          className="mt-1 w-full rounded-pill border border-line px-4 py-2 text-left">
          🚪 {locale === 'mm' ? 'ထွက်မည်' : 'Sign out'}
        </button>
      </section>

      {/* Privacy controls */}
      <section className="rounded-card border border-line bg-white p-4 shadow-card">
        <h2 className="mb-2 font-semibold text-ink">{locale === 'mm' ? 'ကိုယ်ရေးလုံခြုံမှု' : 'Privacy'}</h2>
        <Link to="/content-policy" className="flex items-center justify-between py-2 text-sky-deep">
          <span>Content Policy</span>
          <span aria-hidden>→</span>
        </Link>
        <Link to="/terms" className="flex items-center justify-between py-2 text-sky-deep">
          <span>{locale === 'mm' ? 'ဝန်ဆောင်မှုစည်းမျဉ်းများ' : 'Terms of Service'}</span>
          <span aria-hidden>→</span>
        </Link>
        <Link to="/support" className="flex items-center justify-between py-2 text-sky-deep">
          <span>{locale === 'mm' ? 'အကူအညီနှင့် ဆက်သွယ်ရန်' : 'Help and support'}</span>
          <span aria-hidden>→</span>
        </Link>
        <Link to="/privacy" className="flex items-center justify-between py-2 text-sky-deep">
          <span>{locale === 'mm' ? 'ကိုယ်ရေးအချက်အလက် မူဝါဒ' : 'Privacy Policy'}</span>
          <span aria-hidden>→</span>
        </Link>
        <Link to="/account-deletion" className="flex items-center justify-between py-2 text-sky-deep">
          <span>{locale === 'mm' ? 'အကောင့်ဖျက်နည်း' : 'Account deletion information'}</span>
          <span aria-hidden>→</span>
        </Link>
        <button type="button" onClick={download}
          className="mb-2 w-full rounded-pill border border-line px-4 py-2 text-left">
          ⬇️ {locale === 'mm' ? 'အချက်အလက်များ ထုတ်ယူရန်' : 'Export my data'}
        </button>
        <button type="button" onClick={() => setConfirming('account')}
          className="w-full rounded-pill border border-state-red px-4 py-2 text-left text-state-red-deep">
          🗑️ {locale === 'mm' ? 'အကောင့် ဖျက်ရန်' : 'Delete account'}
        </button>
      </section>

      {/* Confirmation for destructive actions */}
      {confirming && (
        <ConfirmDialog
          message={
            confirming === 'account'
              ? locale === 'mm' ? 'အကောင့်နှင့် အချက်အလက်အားလုံးကို အပြီးတိုင်ဖျက်ရန် သေချာပါသလား။' : 'Delete your account and all data?'
              : locale === 'mm' ? 'ဤကလေး၏ မှတ်တမ်းအားလုံးကို ဖျက်ရန် သေချာပါသလား။' : 'Delete this child’s records?'
          }
          cancelLabel={t('common.cancel')}
          confirmLabel={t('common.confirm')}
          onCancel={() => setConfirming(null)}
          onConfirm={async () => {
            if (confirming === 'account') {
              await deleteAccount({ confirmation: 'DELETE' });
              dispatch({ type: 'delete_account' });
              clearPortalMode();
              await signOut();
              navigate('/', { replace: true });
            } else if (state.activeChildId) {
              dispatch({ type: 'delete_child', id: state.activeChildId });
            }
            setConfirming(null);
          }}
        />
      )}
    </div>
  );
}
