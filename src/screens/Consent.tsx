import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../app/LocaleContext';
import { useAppState } from '../app/AppState';

/** Parent consent gate. Consent is recorded before any child data is added. */
export function Consent() {
  const { t, locale } = useLocale();
  const { state, acceptConsentAsync } = useAppState();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const points =
    locale === 'mm'
      ? [
          'ကလေး၏ အချက်အလက်များကို မိဘကသာ စီမံနိုင်ပြီး မူလသတ်မှတ်ချက်အရ အများမမြင်နိုင်အောင် ထိန်းသိမ်းထားပါသည်။',
          'ဤအက်ပ်သည် ရောဂါရှာဖွေသတ်မှတ်ပေးသည့် အက်ပ် မဟုတ်ပါ။ မိဘများအတွက် ပညာပေးရန်နှင့် ကလေးဖွံ့ဖြိုးမှုကို မှတ်သားစောင့်ကြည့်ရန်သာ ရည်ရွယ်ပါသည်။',
          'မိမိ၏ အချက်အလက်များကို အချိန်မရွေး မိတ္တူထုတ်ယူနိုင်သလို ဖျက်ပစ်နိုင်ပါသည်။',
        ]
      : [
          "Your child's data belongs to you and is private by default.",
          'This app is not a diagnosis. It is educational and screening-support only.',
          'You can export or delete your data at any time.',
        ];

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-sky-deep">
        {locale === 'mm' ? 'မိဘ သဘောတူညီချက်' : 'Parent consent'}
      </h1>
      <ul className="space-y-3">
        {points.map((p, i) => (
          <li key={i} className="rounded-card border border-line bg-white p-4 text-sm">
            ✅ {p}
          </li>
        ))}
      </ul>
      <p className="text-xs text-ink-soft">{t('result.disclaimer.nonDiagnostic')}</p>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          if (busy) return;
          setBusy(true);
          setError('');
          try {
            // Await persistence so the bootstrap gate reads fresh consent, then
            // route through it (a parent who already has a child lands on Home).
            await acceptConsentAsync();
            navigate('/');
          } catch {
            // Consent is the gate to the whole app: failing silently here strands
            // the parent on this screen with no way to tell that anything went
            // wrong. Say so, and leave the button ready to retry.
            setError(
              locale === 'mm'
                ? 'သဘောတူညီချက် သိမ်းဆည်း၍ မရပါ။ အင်တာနက်ချိတ်ဆက်မှုကို စစ်ဆေးပြီး ထပ်မံကြိုးစားပါ။'
                : 'Could not save your consent. Check your connection and try again.',
            );
            setBusy(false);
          }
        }}
        className="min-h-touch w-full rounded-pill bg-sky px-6 py-3 font-semibold text-white disabled:opacity-50"
      >
        {busy ? '…' : t('common.confirm')}
      </button>
      {error && <p role="alert" className="text-sm text-state-red">⚠️ {error}</p>}
      {state.consentAcceptedAt && (
        <p className="text-center text-xs text-mint-deep">✓ {t('common.confirm')}</p>
      )}
    </div>
  );
}
