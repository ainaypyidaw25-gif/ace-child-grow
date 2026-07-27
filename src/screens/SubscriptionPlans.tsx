import { useState } from 'react';
import { useAction, useMutation, useQuery } from 'convex/react';
import { Link, useNavigate } from 'react-router-dom';
import type { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';
import { SourceTransparency } from '../components/SourceTransparency';
import { isGooglePlayBuild } from '../app/platform';

const PLAN_FEATURES = {
  premium: {
    mm: ['အဆင့်မြင့် လစဉ်အစီရင်ခံစာ', 'အင်တာနက်မရှိချိန် ဖတ်ရှုနိုင်မှု', 'အသက်အလိုက် လှုပ်ရှားမှုနှင့် မှတ်တမ်း'],
    en: ['Advanced monthly reports', 'Offline reading', 'Age-based activities and tracking'],
  },
  family: {
    mm: ['Premium အစီအစဉ်၏ ဝန်ဆောင်မှုအားလုံး', 'မိသားစုရှိ ကလေးများအတွက် ပရိုဖိုင်များ', 'မှတ်တမ်းအားလုံးကို တစ်နေရာတည်းမှ ကြည့်ရှုနိုင်မှု'],
    en: ['Everything in Premium', 'Profiles for children in your family', 'All family records in one place'],
  },
} as const;

const REQUEST_STYLES = {
  pending: 'bg-pastel-yellow/60 text-ink',
  approved: 'bg-mint-soft text-sky-deep',
  rejected: 'bg-pink/55 text-state-red',
  canceled: 'bg-canvas text-ink-soft',
} as const;

export function SubscriptionPlans() {
  const { locale } = useLocale();
  const options = useQuery(api.billing.options);
  const requests = useQuery(api.billing.myRequests);
  const mmpayPayments = useQuery(api.mmpayData.myPayments);
  const subscription = useQuery(api.subscriptions.mine);
  const startMmpay = useAction(api.mmpay.startPayment);
  const generateUploadUrl = useMutation(api.billing.generateProofUploadUrl);
  const submit = useMutation(api.billing.submitPaymentRequest);
  const cancel = useMutation(api.billing.cancelMyRequest);
  const startTrial = useMutation(api.subscriptions.startTrial);
  const [planId, setPlanId] = useState<Id<'subscriptionPlans'> | ''>('');
  const [methodId, setMethodId] = useState<Id<'paymentMethods'> | ''>('');
  const [reference, setReference] = useState('');
  const [proof, setProof] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [mmpayBusy, setMmpayBusy] = useState(false);
  const [trialBusy, setTrialBusy] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const L = (mm: string, en: string) => locale === 'mm' ? mm : en;

  if (!options || !requests || !mmpayPayments || !subscription) return <p className="text-ink-soft" role="status">…</p>;

  if (isGooglePlayBuild()) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <header className="rounded-[30px] bg-ink px-6 py-8 text-white shadow-card">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-mint">ACE Child Grow</p>
          <h1 className="mt-3 text-2xl font-bold">{L('အသုံးပြုမှုအစီအစဉ်', 'Membership')}</h1>
          <p className="mt-3 text-white/80">
            {L(`လက်ရှိအစီအစဉ် — ${subscription.planKey === 'free' ? 'အခမဲ့' : subscription.planKey === 'premium' ? 'Premium' : 'Family'}`, `Current plan — ${subscription.planKey}`)}
          </p>
        </header>
        <section className="rounded-card border border-line bg-white p-6 shadow-card">
          <h2 className="font-bold text-ink">{L('မိဘများအတွက် အခြေခံဝန်ဆောင်မှုများ', 'Core features for parents')}</h2>
          <p className="mt-2 leading-7 text-ink-soft">
            {L('ကလေး၏ အသက်အလိုက် လမ်းညွှန်ချက်များ၊ ဖွံ့ဖြိုးမှုမှတ်တမ်းနှင့် မိဘအတွက် အသုံးဝင်သော အကြောင်းအရာများကို အခမဲ့ အသုံးပြုနိုင်ပါသည်။', 'Age-based guidance, development tracking, and essential parent resources are available free.')}
          </p>
          <Link to="/home" className="mt-5 inline-flex rounded-pill bg-sky-deep px-5 py-3 font-semibold text-white">
            {L('ပင်မစာမျက်နှာသို့ ပြန်မည်', 'Return home')}
          </Link>
        </section>
      </div>
    );
  }

  const selectedPlan = options.plans.find((plan) => plan._id === planId);
  const selectedMethod = options.methods.find((method) => method._id === methodId);
  const hasPendingRequest = requests.some((request) => request.status === 'pending');
  const hasPendingMmpay = mmpayPayments.some((payment) => payment.status === 'INITIATING' || payment.status === 'PENDING');
  const statusLabel = (status: (typeof requests)[number]['status']) => ({
    pending: L('စစ်ဆေးဆဲ', 'Pending review'),
    approved: L('အတည်ပြုပြီး', 'Approved'),
    rejected: L('အတည်မပြုပါ', 'Not approved'),
    canceled: L('ပယ်ဖျက်ပြီး', 'Canceled'),
  })[status];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="relative overflow-hidden rounded-[30px] bg-ink px-5 py-8 text-white shadow-card sm:px-8 sm:py-10">
        <div aria-hidden className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-mint/20" />
        <div className="relative max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-mint">ACE Premium</p>
          <h1 className="mt-3 text-2xl font-bold leading-relaxed sm:text-4xl">
            {L('ကလေး၏ ကြီးထွားမှုမှတ်တမ်းကို မိသားစုနဲ့အတူ ဆက်လက်ထိန်းသိမ်းပါ', 'Keep your child’s growth story together')}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
            {L('မိဘအတွက် လိုအပ်သော မှတ်တမ်း၊ အစီရင်ခံစာနှင့် အသက်အလိုက် လမ်းညွှန်ချက်များကို တစ်နေရာတည်းတွင် အသုံးပြုနိုင်ပါသည်။', 'Use age-based guidance, family records, and clear reports in one calm place.')}
          </p>
          <p className="mt-5 inline-flex rounded-pill bg-white/10 px-4 py-2 text-xs font-semibold text-white/85">
            {L(`လက်ရှိအစီအစဉ် — ${subscription.planKey === 'free' ? 'အခမဲ့' : subscription.planKey === 'premium' ? 'Premium' : 'Family'}`, `Current plan — ${subscription.planKey}`)}
          </p>
        </div>
      </header>

      {subscription.trialEligible && subscription.planKey === 'free' && (
        <section className="flex flex-col gap-5 rounded-[30px] border border-mint bg-mint-soft/45 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-deep">7-day free trial</p>
            <h2 className="mt-1 text-xl font-bold text-ink">{L('Premium ကို ၇ ရက် အခမဲ့ စမ်းသုံးပါ', 'Try Premium free for 7 days')}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-soft">
              {L('ဘဏ်ကတ်ထည့်ရန် မလိုပါ။ စမ်းသုံးကာလပြီးလျှင် အခမဲ့အစီအစဉ်သို့ အလိုအလျောက် ပြန်သွားပါမည်။', 'No card required. You will return to Free automatically when the trial ends.')}
            </p>
          </div>
          <button
            type="button"
            disabled={trialBusy}
            onClick={async () => {
              setTrialBusy(true);
              setMessage('');
              try {
                await startTrial({});
                setMessage(L('Premium စမ်းသုံးကာလကို စတင်ပြီးပါပြီ။', 'Your Premium trial has started.'));
              } catch (error) {
                setMessage(error instanceof Error ? error.message : L('စမ်းသုံးကာလကို စတင်၍ မရပါ။', 'Could not start the trial.'));
              } finally {
                setTrialBusy(false);
              }
            }}
            className="min-h-touch shrink-0 rounded-pill bg-sky-deep px-7 py-3 font-bold text-white disabled:opacity-50"
          >
            {trialBusy ? '…' : L('အခမဲ့ စမ်းသုံးမည်', 'Start free trial')}
          </button>
        </section>
      )}
      {subscription.isTrial && (
        <p className="rounded-2xl bg-mint-soft px-4 py-3 text-sm font-semibold text-sky-deep">
          {L(
            `Premium အခမဲ့စမ်းသုံးကာလ — ${subscription.currentPeriodEnd ? Math.max(0, Math.ceil((subscription.currentPeriodEnd - Date.now()) / 86_400_000)) : 0} ရက် ကျန်`,
            `Premium trial — ${subscription.currentPeriodEnd ? Math.max(0, Math.ceil((subscription.currentPeriodEnd - Date.now()) / 86_400_000)) : 0} days remaining`,
          )}
        </p>
      )}

      <section aria-labelledby="choose-plan-title">
        <div className="mb-4 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-deep">01 · {L('အစီအစဉ်ရွေးချယ်ရန်', 'Choose a plan')}</p>
          <h2 id="choose-plan-title" className="mt-1 text-xl font-bold text-ink">{L('မိသားစုအတွက် သင့်တော်သည့်အစီအစဉ်', 'A plan that fits your family')}</h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className={`rounded-3xl border p-5 ${subscription.planKey === 'free' ? 'border-sky bg-mint-soft/35' : 'border-line bg-white'}`}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold text-ink">{L('အခမဲ့အစီအစဉ်', 'Free')}</h3>
              {subscription.planKey === 'free' && <span className="rounded-pill bg-sky-deep px-3 py-1 text-xs font-semibold text-white">{L('လက်ရှိ', 'Current')}</span>}
            </div>
            <p className="mt-3 text-2xl font-bold text-ink">0 MMK</p>
            <p className="mt-2 text-sm text-ink-soft">{L('အခြေခံမှတ်တမ်းများ၊ လှုပ်ရှားမှုများနှင့် လေ့လာရန်စာများ', 'Core tracking, activities, and learning library')}</p>
            <ul className="mt-5 space-y-2 text-sm text-ink">
              {[L('ကလေးပရိုဖိုင်နှင့် ဖွံ့ဖြိုးမှုမှတ်တမ်း', 'Child profile and development journey'), L('ကြီးထွားမှုနှင့် အိပ်ချိန်မှတ်တမ်း', 'Growth and sleep tracking'), L('အခြေခံလှုပ်ရှားမှုနှင့် လေ့လာရေးစာများ', 'Core activities and learning library')].map((feature) => <li key={feature} className="flex gap-2"><span className="text-sky-deep">✓</span>{feature}</li>)}
            </ul>
          </div>

          {options.plans.map((plan) => {
            const current = subscription.planKey === plan.planKey;
            const selected = planId === plan._id;
            const features = PLAN_FEATURES[plan.planKey][locale === 'mm' ? 'mm' : 'en'];
            return (
              <button
                key={plan._id}
                type="button"
                onClick={() => setPlanId(plan._id)}
                aria-pressed={selected}
                className={`rounded-3xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-card ${selected ? 'border-sky bg-mint-soft/35 shadow-card' : 'border-line bg-white'}`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="font-bold text-ink">{locale === 'mm' ? plan.nameMm : plan.nameEn}</span>
                  {current && <span className="rounded-pill bg-sky-deep px-3 py-1 text-xs font-semibold text-white">{L('လက်ရှိ', 'Current')}</span>}
                </span>
                <span className="mt-3 block text-2xl font-bold text-ink">
                  {plan.amount.toLocaleString()} <span className="text-sm font-semibold">{plan.currency} / {plan.interval === 'month' ? L('လ', 'month') : L('နှစ်', 'year')}</span>
                </span>
                <span className="mt-2 block text-sm text-ink-soft">{locale === 'mm' ? plan.descriptionMm : plan.descriptionEn}</span>
                <span className="mt-5 block space-y-2 text-sm text-ink">
                  {features.map((feature) => <span key={feature} className="flex gap-2"><span className="text-sky-deep">✓</span>{feature}</span>)}
                </span>
                <span className="mt-5 inline-flex font-bold text-sky-deep">{selected ? L('ရွေးချယ်ထားသည်', 'Selected') : L('ရွေးချယ်မည်', 'Choose plan')} →</span>
              </button>
            );
          })}
        </div>
        {options.plans.length === 0 && (
          <p className="mt-4 rounded-2xl bg-pastel-yellow/50 p-4 text-sm">{L('အခပေးအစီအစဉ်များကို Owner က ပြင်ဆင်နေပါသည်။', 'Paid plans are being configured by the owner.')}</p>
        )}
      </section>

      {selectedPlan && (
        <section aria-labelledby="mmpay-title" className="overflow-hidden rounded-[30px] border border-sky/40 bg-white shadow-card">
          <header className="border-b border-line bg-mint-soft/45 px-5 py-6 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-deep">02 · Myan Myan Pay</p>
            <h2 id="mmpay-title" className="mt-1 text-xl font-bold text-ink">{L('MMQR ဖြင့် ချက်ချင်းပေးချေပါ', 'Pay instantly with MMQR')}</h2>
            <p className="mt-2 text-sm leading-6 text-ink-soft">{L('QR ကို KBZPay၊ WavePay သို့မဟုတ် MMQR အသုံးပြုနိုင်သော wallet ဖြင့် scan လုပ်ပါ။ ငွေပေးချေမှုအောင်မြင်သည်နှင့် အစီအစဉ်ကို အလိုအလျောက်ဖွင့်ပေးပါမည်။', 'Scan with KBZPay, WavePay, or another MMQR-compatible wallet. Your plan activates automatically after verified payment.')}</p>
          </header>
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <p className="font-bold text-ink">{locale === 'mm' ? selectedPlan.nameMm : selectedPlan.nameEn}</p>
              <p className="mt-1 text-2xl font-bold text-sky-deep">{selectedPlan.amount.toLocaleString()} MMK</p>
              <p className="mt-2 text-xs text-ink-soft">{L('ငွေလက်ခံအကောင့်နှင့် API secret များကို ဤ browser သို့ မပို့ပါ။', 'Merchant credentials and API secrets never reach this browser.')}</p>
            </div>
            {hasPendingMmpay ? (
              <Link to={`/payment/${mmpayPayments.find((payment) => payment.status === 'INITIATING' || payment.status === 'PENDING')?.orderId}`} className="rounded-pill bg-sky-deep px-6 py-3 text-center font-bold text-white">
                {L('လက်ရှိ QR ကို ပြန်ကြည့်မည်', 'View pending QR')}
              </Link>
            ) : (
              <button
                type="button"
                disabled={mmpayBusy}
                onClick={async () => {
                  setMmpayBusy(true);
                  setMessage('');
                  try {
                    const payment = await startMmpay({ planId: selectedPlan._id });
                    navigate(`/payment/${payment.orderId}`);
                  } catch (error) {
                    setMessage(error instanceof Error ? error.message : L('Myan Myan Pay ကို ချိတ်ဆက်၍ မရပါ။', 'Unable to connect to Myan Myan Pay.'));
                  } finally {
                    setMmpayBusy(false);
                  }
                }}
                className="min-h-touch rounded-pill bg-sky-deep px-7 py-3 font-bold text-white disabled:opacity-50"
              >
                {mmpayBusy ? '…' : L('MMQR ဖန်တီးမည်', 'Generate MMQR')}
              </button>
            )}
          </div>
          {message && <p className="border-t border-line px-5 py-3 text-sm text-state-red sm:px-8" role="alert">{message}</p>}
        </section>
      )}

      <SourceTransparency />

      {selectedPlan && (
        <section aria-labelledby="payment-title" className="overflow-hidden rounded-[30px] border border-line bg-white shadow-card">
          <header className="border-b border-line bg-cream px-5 py-6 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-deep">{L('အခြားနည်းလမ်း', 'Alternative')} · {L('လက်ဖြင့်ငွေလွှဲခြင်း', 'Manual transfer')}</p>
            <h2 id="payment-title" className="mt-1 text-xl font-bold text-ink">{L('ငွေလွှဲအထောက်အထားဖြင့် ပေးချေပါ', 'Pay with transfer proof')}</h2>
            <ol className="mt-4 grid gap-3 text-sm text-ink-soft sm:grid-cols-3">
              {[L('အစီအစဉ်ရွေးရန်', 'Choose a plan'), L('သတ်မှတ်အကောင့်သို့ ငွေလွှဲရန်', 'Make the transfer'), L('ငွေလွှဲနံပါတ် ပို့ရန်', 'Submit the reference')].map((step, index) => <li key={step} className="flex gap-2"><span className="font-bold text-sky-deep">{index + 1}</span><span>{step}</span></li>)}
            </ol>
          </header>

          {options.methods.length === 0 ? (
            <p className="p-5 text-sm text-ink-soft sm:p-8">{L('ငွေပေးချေမှုနည်းလမ်းများကို Owner က ပြင်ဆင်နေပါသည်။', 'Payment methods are being configured by the owner.')}</p>
          ) : hasPendingRequest ? (
            <div className="p-5 sm:p-8">
              <p className="font-bold text-ink">{L('သင့်ငွေပေးချေမှုကို စစ်ဆေးနေပါသည်', 'Your payment is being reviewed')}</p>
              <p className="mt-2 text-sm text-ink-soft">{L('တစ်ကြိမ်လျှင် ငွေပေးချေမှုတစ်ခုသာ တင်နိုင်ပါသည်။ အောက်ရှိ အခြေအနေမှတ်တမ်းတွင် ဆက်လက်ကြည့်ရှုနိုင်ပါသည်။', 'Only one payment can be reviewed at a time. Follow its status below.')}</p>
            </div>
          ) : (
            <form
              className="grid gap-0 lg:grid-cols-2"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!planId || !methodId) return;
                setBusy(true);
                setMessage('');
                try {
                  let proofStorageId: Id<'_storage'> | undefined;
                  if (proof) {
                    if (!proof.type.startsWith('image/') || proof.size > 5 * 1024 * 1024) throw new Error(L('ပုံဖိုင်ကို 5MB အောက်သာ တင်ပါ။', 'Upload an image smaller than 5MB.'));
                    const uploadUrl = await generateUploadUrl({});
                    const response = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': proof.type }, body: proof });
                    if (!response.ok) throw new Error(L('အထောက်အထားပုံ တင်၍ မရပါ။', 'Unable to upload proof.'));
                    proofStorageId = (await response.json()).storageId as Id<'_storage'>;
                  }
                  await submit({ planId, paymentMethodId: methodId, paymentReference: reference, proofStorageId });
                  setReference('');
                  setProof(null);
                  setMessage(L('ငွေပေးချေမှုကို အတည်ပြုစစ်ဆေးရန် ပို့ပြီးပါပြီ။', 'Payment submitted for verification.'));
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : L('ပို့၍ မရပါ။', 'Unable to submit.'));
                } finally {
                  setBusy(false);
                }
              }}
            >
              <div className="border-b border-line p-5 sm:p-8 lg:border-b-0 lg:border-r">
                <label htmlFor="payment-method" className="text-sm font-bold text-ink">{L('ငွေပေးချေမှုနည်းလမ်း', 'Payment method')}</label>
                <select id="payment-method" required value={methodId} onChange={(event) => setMethodId(event.target.value as Id<'paymentMethods'>)} className="mt-2 min-h-touch w-full rounded-xl border border-line bg-white px-3 py-2 text-ink">
                  <option value="">{L('ရွေးချယ်ပါ', 'Select')}</option>
                  {options.methods.map((method) => <option key={method._id} value={method._id}>{locale === 'mm' ? method.nameMm : method.nameEn}</option>)}
                </select>
                {selectedMethod && (
                  <div className="mt-5 border-l-2 border-mint pl-4 text-sm">
                    <p className="text-ink-soft">{selectedMethod.accountName}</p>
                    <p className="mt-1 text-lg font-bold text-ink">{selectedMethod.accountIdentifier}</p>
                    <p className="mt-2 leading-6 text-ink-soft">{locale === 'mm' ? selectedMethod.instructionsMm : selectedMethod.instructionsEn}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4 p-5 sm:p-8">
                <div>
                  <label htmlFor="payment-reference" className="text-sm font-bold text-ink">{L('ငွေလွှဲနံပါတ်', 'Transfer reference')}</label>
                  <input id="payment-reference" required value={reference} onChange={(event) => setReference(event.target.value)} placeholder={L('Transaction ID ထည့်ပါ', 'Enter transaction ID')} className="mt-2 min-h-touch w-full rounded-xl border border-line px-3 py-2 text-ink" />
                </div>
                <label className="block text-sm font-bold text-ink">
                  {L('ငွေလွှဲအထောက်အထားပုံ', 'Payment proof image')}
                  <span className="ml-1 font-normal text-ink-soft">({L('မဖြစ်မနေ မဟုတ်ပါ', 'optional')})</span>
                  <input type="file" accept="image/*" onChange={(event) => setProof(event.target.files?.[0] ?? null)} className="mt-2 block w-full text-sm font-normal text-ink-soft file:mr-3 file:rounded-pill file:border-0 file:bg-mint-soft file:px-4 file:py-2 file:font-semibold file:text-sky-deep" />
                </label>
                <p className="text-xs leading-5 text-ink-soft">{L('Owner က ငွေပေးချေမှုကို စစ်ဆေးပြီးမှ အစီအစဉ် စတင်ပါမည်။', 'Your plan starts after the owner verifies the payment.')}</p>
                <button disabled={busy} className="min-h-touch w-full rounded-pill bg-sky-deep px-5 py-2 font-bold text-white disabled:opacity-50">{busy ? '…' : L('အတည်ပြုစစ်ဆေးရန် ပို့မည်', 'Submit for verification')}</button>
                {message && <p className="text-sm text-ink-soft" role="status">{message}</p>}
              </div>
            </form>
          )}
        </section>
      )}

      <section aria-labelledby="request-history-title" className="border-t border-line pt-7">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-deep">03 · {L('အခြေအနေကြည့်ရန်', 'Track status')}</p>
            <h2 id="request-history-title" className="mt-1 text-lg font-bold text-ink">{L('ငွေပေးချေမှုမှတ်တမ်း', 'Payment history')}</h2>
          </div>
          <p className="text-xs text-ink-soft">{requests.length + mmpayPayments.length} {L('ခု', 'payments')}</p>
        </div>
        {mmpayPayments.length > 0 && (
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
            {mmpayPayments.map((payment) => (
              <li key={payment._id} className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-5">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold capitalize text-ink">Myan Myan Pay · {payment.planKey} · {payment.amount.toLocaleString()} MMK</span>
                  <span className="mt-1 block break-all text-xs text-ink-soft">{payment.orderId}</span>
                </span>
                <span className="rounded-pill bg-mint-soft px-3 py-1 text-xs font-semibold text-sky-deep">{payment.status}</span>
                <Link to={`/payment/${payment.orderId}`} className="text-sm font-semibold text-sky-deep underline">{L('ကြည့်မည်', 'View')}</Link>
              </li>
            ))}
          </ul>
        )}
        {requests.length === 0 && mmpayPayments.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">{L('ငွေပေးချေမှုမှတ်တမ်း မရှိသေးပါ။', 'No payment history yet.')}</p>
        ) : requests.length > 0 ? (
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
            {requests.map((request) => (
              <li key={request._id} className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-5">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold capitalize text-ink">{request.planKey} · {request.amount.toLocaleString()} {request.currency}</span>
                  <span className="mt-1 block text-xs text-ink-soft">{L('ငွေလွှဲနံပါတ်', 'Reference')}: {request.paymentReference}</span>
                </span>
                <span className={`rounded-pill px-3 py-1 text-xs font-semibold ${REQUEST_STYLES[request.status]}`}>{statusLabel(request.status)}</span>
                {request.status === 'pending' && <button type="button" onClick={() => void cancel({ id: request._id })} className="min-h-touch px-2 text-sm font-semibold text-state-red underline">{L('ပယ်ဖျက်မည်', 'Cancel')}</button>}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
