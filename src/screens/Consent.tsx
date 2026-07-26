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
          try {
            // Await persistence so the bootstrap gate reads fresh consent, then
            // route through it (a parent who already has a child lands on Home).
            await acceptConsentAsync();
            navigate('/');
          } catch {
            setBusy(false);
          }
        }}
        className="min-h-touch w-full rounded-pill bg-sky px-6 py-3 font-semibold text-white disabled:opacity-50"
      >
        {busy ? '…' : t('common.confirm')}
      </button>
      {state.consentAcceptedAt && (
        <p className="text-center text-xs text-mint">✓ {t('common.confirm')}</p>
      )}
    </div>
  );
}
