import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLocale } from '../app/LocaleContext';
import { useAppState } from '../app/AppState';
import { useAuthActions } from '@convex-dev/auth/react';
import { exportData } from '../app/childStore';
import { ageLabels } from '../domain/age/ageLabel';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

const PLAN_LABELS = {
  free: { mm: 'အခမဲ့အစီအစဉ်', en: 'Free plan' },
  premium: { mm: 'အထူးအစီအစဉ်', en: 'Premium plan' },
  family: { mm: 'မိသားစုအစီအစဉ်', en: 'Family plan' },
} as const;

export function Profile() {
  const { t, locale, setLocale } = useLocale();
  const { state, dispatch } = useAppState();
  const { signOut } = useAuthActions();
  const navigate = useNavigate();
  const subscription = useQuery(api.subscriptions.mine);
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
                      <Link to="/edit-child" className="text-sm text-sky-deep">
                        {locale === 'mm' ? 'ပြင်ရန်' : 'Edit'}
                      </Link>
                    )}
                    <button type="button"
                      aria-label={locale === 'mm' ? `${c.nickname} ကို ဖျက်ရန်` : `Remove ${c.nickname}`}
                      onClick={() => { dispatch({ type: 'switch_child', id: c.id }); setConfirming('child'); }}
                      className="min-h-touch min-w-touch text-sm text-state-red">✕</button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        {state.children.length > 0 && (
          <Link to="/add-child" className="mt-3 inline-block text-sm text-sky-deep">
            + {locale === 'mm' ? 'ကလေး ထပ်ထည့်ရန်' : 'Add another child'}
          </Link>
        )}
      </section>

      {/* Subscription-ready account status. Billing is connected later. */}
      <section className="rounded-card border border-line bg-white p-4 shadow-card">
        <h2 className="font-semibold text-ink">{locale === 'mm' ? 'အသုံးပြုမှုအစီအစဉ်' : 'Membership plan'}</h2>
        {subscription === undefined ? <p className="text-ink-soft">…</p> : (
          <>
            <p className="mt-1 text-lg font-semibold text-sky-deep">{PLAN_LABELS[subscription.planKey][locale]}</p>
            <p className="mt-1 text-sm text-ink-soft">
              {locale === 'mm'
                ? subscription.planKey === 'free'
                  ? 'လက်ရှိအခြေခံလုပ်ဆောင်ချက်များကို အခမဲ့ အသုံးပြုနိုင်ပါသည်။ အခပေးအစီအစဉ်များကို နောက်ပိုင်းတွင် ထည့်သွင်းနိုင်ရန် ပြင်ဆင်ထားသည်။'
                  : 'ဤအကောင့်တွင် အထူးလုပ်ဆောင်ချက်များ အသုံးပြုနိုင်ပါသည်။'
                : subscription.planKey === 'free'
                  ? 'Core features are free. Paid plans can be connected later.'
                  : 'Premium features are enabled for this account.'}
            </p>
          </>
        )}
      </section>

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
        <Link to="/offline" className="flex items-center justify-between py-2 text-sky-deep">
          <span>{locale === 'mm' ? 'အင်တာနက်မရှိချိန် ဖတ်ရန် သိမ်းထားမှု' : 'Offline downloads'}</span>
          <span aria-hidden>→</span>
        </Link>
        <button type="button" onClick={() => void signOut()}
          className="mt-1 w-full rounded-pill border border-line px-4 py-2 text-left">
          🚪 {locale === 'mm' ? 'ထွက်မည်' : 'Sign out'}
        </button>
      </section>

      {/* Privacy controls */}
      <section className="rounded-card border border-line bg-white p-4 shadow-card">
        <h2 className="mb-2 font-semibold text-ink">{locale === 'mm' ? 'ကိုယ်ရေးလုံခြုံမှု' : 'Privacy'}</h2>
        <button type="button" onClick={download}
          className="mb-2 w-full rounded-pill border border-line px-4 py-2 text-left">
          ⬇️ {locale === 'mm' ? 'ကျွန်ုပ်၏ အချက်အလက် ထုတ်ယူရန်' : 'Export my data'}
        </button>
        <button type="button" onClick={() => setConfirming('account')}
          className="w-full rounded-pill border border-state-red px-4 py-2 text-left text-state-red">
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
          onConfirm={() => {
            if (confirming === 'account') {
              dispatch({ type: 'delete_account' });
              navigate('/');
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
