import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';
import { shouldAutoShowTour, TOUR_VERSION, type TourKind } from '../domain/tour';

const TOUR_COPY = {
  parent: [
    { icon: '🏠', mm: ['မိဘအကောင့်မှ ကြိုဆိုပါတယ်', 'မူလစာမျက်နှာတွင် ကလေး၏အသက်နှင့် ကိုက်ညီသော ယနေ့အကြံပြုချက်များကို အလွယ်တကူ ကြည့်နိုင်ပါသည်။'], en: ['Welcome to the parent space', 'Home gives you age-matched suggestions for your child today.'] },
    { icon: '🌱', mm: ['ဖွံ့ဖြိုးမှုခရီးကို မှတ်တမ်းတင်ပါ', 'မှတ်တိုင်များသည် အပြိုင်အဆိုင်စစ်ဆေးမှု မဟုတ်ပါ။ တွေ့မြင်သည့်အရာကို မှတ်သားပြီး စိုးရိမ်ပါက ပညာရှင်နှင့် ဆွေးနွေးပါ။'], en: ['Track the development journey', 'Milestones are not a pass/fail test. Record what you observe and discuss concerns with a professional.'] },
    { icon: '🧩', mm: ['နေ့စဉ် အတူကစားပါ', 'အိမ်တွင် လွယ်ကူစွာ လုပ်နိုင်သော ကစားနည်း၊ စကားပြောနည်းနှင့် လှုပ်ရှားမှုများကို ရွေးချယ်နိုင်ပါသည်။'], en: ['Play and learn each day', 'Choose simple at-home play, communication and movement activities.'] },
    { icon: '📖', mm: ['စာကြည့်တိုက်နှင့် အစီရင်ခံစာ', 'ယုံကြည်ရသော ကိုးကားချက်များ၊ သိမ်းထားသည့်မှတ်တမ်းများနှင့် ပညာရှင်ထံပြရန် အကျဉ်းချုပ်ကို တစ်နေရာတည်းတွင် ကြည့်နိုင်ပါသည်။'], en: ['Library and reports', 'Find evidence-based guidance, saved records and a summary you can share with a professional.'] },
  ],
  staff: [
    { icon: '🧭', mm: ['စီမံခန့်ခွဲရေးနေရာမှ ကြိုဆိုပါတယ်', 'Dashboard မှ အကြောင်းအရာ၊ သုံးသပ်မှု၊ ကိုးကားချက်နှင့် အဖွဲ့ဝင်များကို စီမံနိုင်ပါသည်။'], en: ['Welcome to the staff workspace', 'Use the dashboard to manage content, reviews, evidence and team access.'] },
    { icon: '✉️', mm: ['Account မရှိသေးသူကိုလည်း ဖိတ်နိုင်ပါသည်', 'ပိုင်ရှင်က email သတ်မှတ်ပြီး လျှို့ဝှက်လင့်ခ်ပို့နိုင်သည်။ သက်ဆိုင်သူသည် ထို email ဖြင့် account ဖွင့်ပြီး ဖိတ်ကြားချက်ကို လက်ခံရပါမည်။'], en: ['Invite before account creation', 'The owner can create a private email-bound link. The recipient signs up with that email and accepts it.'] },
    { icon: '✍️', mm: ['အကြောင်းအရာကို တိုက်ရိုက်ပြင်နိုင်ပါသည်', 'မူရင်းစာသားကို hard-code approval မလုပ်ပါ။ တာဝန်ရှိ reviewer သည် review workspace တွင် ပြင်ဆင်ချက်နှင့် ဆုံးဖြတ်ချက်ကို မှတ်တမ်းတင်နိုင်ပါသည်။'], en: ['Edit content in the review workspace', 'Approval is never hard-coded. Assigned reviewers can edit content and record decisions with attribution.'] },
    { icon: '🛡️', mm: ['ထုတ်ဝေမှုအဆင့်ကို ကာကွယ်ထားပါသည်', 'လိုအပ်သော native-Myanmar၊ evidence၊ safety နှင့် သက်ဆိုင်ရာ professional review မပြည့်မချင်း မိဘများထံ မထုတ်ဝေပါ။ လုပ်ဆောင်ချက်တိုင်း audit မှတ်တမ်းဝင်ပါသည်။'], en: ['Publication remains gated', 'Content stays hidden until required language, evidence, safety and professional reviews are complete. Every action is audited.'] },
  ],
} as const;

export function InAppTour({ inStaffWorkspace }: { inStaffWorkspace: boolean }) {
  const { locale } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const me = useQuery(api.parent.me);
  const completeTour = useMutation(api.parent.completeTour);
  const requested = new URLSearchParams(location.search).get('tour');
  const requestedKind: TourKind | null = requested === 'parent' || requested === 'staff' ? requested : null;
  const automaticKind = useMemo<TourKind | null>(() => {
    if (!me) return null;
    const kind: TourKind = inStaffWorkspace ? 'staff' : 'parent';
    const completedVersion = kind === 'staff' ? me.staffTourCompletedVersion : me.parentTourCompletedVersion;
    return shouldAutoShowTour({
      kind,
      pathname: location.pathname,
      consentAccepted: me.consentAcceptedAt !== null,
      isStaff: me.isStaff,
      completedVersion,
    }) ? kind : null;
  }, [inStaffWorkspace, location.pathname, me]);
  const candidateKind = requestedKind ?? automaticKind;
  const [dismissedKind, setDismissedKind] = useState<TourKind | null>(null);
  const kind = candidateKind === dismissedKind ? null : candidateKind;
  const [step, setStep] = useState(0);

  useEffect(() => setStep(0), [kind]);
  if (!kind || !me || (kind === 'staff' && !me.isStaff)) return null;
  const activeKind = kind;
  const steps = TOUR_COPY[activeKind];
  const current = steps[step];
  const isLast = step === steps.length - 1;

  async function closeAndRemember() {
    // Close immediately. A slow mobile connection must never trap the member
    // behind onboarding while the completion mutation is in flight.
    setDismissedKind(activeKind);
    if (requestedKind) {
      const params = new URLSearchParams(location.search);
      params.delete('tour');
      navigate(`${location.pathname}${params.size ? `?${params.toString()}` : ''}`, { replace: true });
    }
    try {
      await completeTour({ kind: activeKind, version: TOUR_VERSION });
    } catch {
      // The tour may appear again next session if completion could not sync.
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center overflow-y-auto bg-ink/45 px-3 pt-3 backdrop-blur-sm sm:items-center sm:p-6"
      role="presentation"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6rem)' }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        className="max-h-[calc(100dvh-7.5rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-[28px] border border-white/80 bg-white p-5 shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint-soft text-2xl" aria-hidden>{current.icon}</div>
          <button type="button" onClick={() => void closeAndRemember()} className="min-h-touch touch-manipulation rounded-pill px-3 text-sm text-ink-soft">
            {locale === 'mm' ? 'ကျော်မည်' : 'Skip'}
          </button>
        </div>
        <h2 id="tour-title" className="mt-4 text-xl font-bold text-sky-deep">{current[locale][0]}</h2>
        <p className="mt-2 min-h-20 text-sm leading-7 text-ink-soft">{current[locale][1]}</p>
        <div className="sticky bottom-0 -mx-2 mt-5 flex items-center justify-between gap-3 rounded-2xl bg-white/95 px-2 pb-1 pt-2 backdrop-blur-sm">
          <div className="flex gap-1.5" aria-label={`${step + 1} / ${steps.length}`}>
            {steps.map((_, index) => <span key={index} className={`h-2 rounded-full transition-all ${index === step ? 'w-7 bg-sky' : 'w-2 bg-line'}`} />)}
          </div>
          <div className="flex gap-2">
            {step > 0 && <button type="button" onClick={() => setStep((value) => value - 1)} className="min-h-touch touch-manipulation rounded-pill border border-line px-4 text-sm font-semibold text-ink-soft">{locale === 'mm' ? 'နောက်သို့' : 'Back'}</button>}
            <button type="button" onClick={() => isLast ? void closeAndRemember() : setStep((value) => value + 1)} className="min-h-touch touch-manipulation rounded-pill bg-sky px-5 text-sm font-semibold text-white">
              {isLast ? locale === 'mm' ? 'စတင်အသုံးပြုမည်' : 'Get started' : locale === 'mm' ? 'ဆက်မည်' : 'Next'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
