import { useNavigate } from 'react-router-dom';
import { useLocale } from '../app/LocaleContext';
import { useAppState } from '../app/AppState';

/** Parent consent gate. Consent is recorded before any child data is added. */
export function Consent() {
  const { t, locale } = useLocale();
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();

  const points =
    locale === 'mm'
      ? [
          'ကလေး၏ အချက်အလက်များသည် သင်ပိုင်ဆိုင်ပြီး default အားဖြင့် သီးသန့်ဖြစ်သည်။',
          'ဤအက်ပ်သည် ရောဂါရှာဖွေမှု မဟုတ်ပါ။ ပညာပေးနှင့် စောင့်ကြည့်ကူညီမှုသာ ဖြစ်သည်။',
          'သင့်အချက်အလက်ကို အချိန်မရွေး ထုတ်ယူ (export) သို့မဟုတ် ဖျက် နိုင်သည်။',
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
        onClick={() => {
          dispatch({ type: 'accept_consent', at: new Date().toISOString() });
          // Route through the bootstrap gate so a parent who already has a child
          // lands on Home instead of being asked to add another.
          navigate('/');
        }}
        className="min-h-touch w-full rounded-pill bg-sky px-6 py-3 font-semibold text-white"
      >
        {t('common.confirm')}
      </button>
      {state.consentAcceptedAt && (
        <p className="text-center text-xs text-mint">✓ {t('common.confirm')}</p>
      )}
    </div>
  );
}
