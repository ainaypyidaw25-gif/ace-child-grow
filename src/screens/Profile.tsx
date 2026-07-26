import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLocale } from '../app/LocaleContext';
import { useAppState } from '../app/AppState';
import { useAuthActions } from '@convex-dev/auth/react';
import { exportData } from '../app/childStore';
import { ageLabels } from '../domain/age/ageLabel';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function Profile() {
  const { t, locale, setLocale } = useLocale();
  const { state, dispatch } = useAppState();
  const { signOut } = useAuthActions();
  const navigate = useNavigate();
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
              ? locale === 'mm' ? 'အကောင့်နှင့် အချက်အလက်အားလုံး ဖျက်မှာ သေချာပါသလား။' : 'Delete your account and all data?'
              : locale === 'mm' ? 'ဤကလေး၏ မှတ်တမ်းများ ဖျက်မှာ သေချာပါသလား။' : 'Delete this child’s records?'
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
