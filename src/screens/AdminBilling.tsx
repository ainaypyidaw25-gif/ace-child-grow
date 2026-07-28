import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import type { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';

export function AdminBilling() {
  const { locale } = useLocale();
  const data = useQuery(api.billing.adminDashboard);
  const mmpay = useQuery(api.mmpayData.adminPayments);
  const memberSummary = useQuery(api.subscriptions.ownerSummary);
  const referrals = useQuery(api.referrals.ownerDashboard);
  const upsertPlan = useMutation(api.billing.upsertPlan);
  const upsertMethod = useMutation(api.billing.upsertMethod);
  const review = useMutation(api.billing.reviewPaymentRequest);
  const setPlanActive = useMutation(api.billing.setPlanActive);
  const setMethodActive = useMutation(api.billing.setMethodActive);
  const installRecommendedPlans = useMutation(api.billing.installRecommendedPlans);
  const setReferralStatus = useMutation(api.referrals.ownerSetStatus);
  const [editingPlan, setEditingPlan] = useState<Id<'subscriptionPlans'> | undefined>();
  const [editingMethod, setEditingMethod] = useState<Id<'paymentMethods'> | undefined>();
  const [planKey, setPlanKey] = useState<'premium' | 'family'>('premium');
  const [planMm, setPlanMm] = useState(''); const [planEn, setPlanEn] = useState('');
  const [amount, setAmount] = useState(''); const [currency, setCurrency] = useState('MMK');
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const [methodMm, setMethodMm] = useState(''); const [methodEn, setMethodEn] = useState('');
  const [accountName, setAccountName] = useState(''); const [accountIdentifier, setAccountIdentifier] = useState('');
  const [instructionsMm, setInstructionsMm] = useState(''); const [instructionsEn, setInstructionsEn] = useState('');
  const [message, setMessage] = useState('');
  const L = (mm: string, en: string) => locale === 'mm' ? mm : en;
  const input = 'w-full rounded-lg border border-line px-3 py-2 text-sm';

  if (data === undefined || mmpay === undefined || memberSummary === undefined || referrals === undefined) return <p className="text-ink-soft">…</p>;
  if (!data.allowed || !mmpay.allowed || !memberSummary.allowed || !referrals.allowed) return <p className="rounded-card bg-white p-4">{L('Owner သာ အသုံးပြုနိုင်ပါသည်။', 'Owner access only.')}</p>;

  return <div className="space-y-5">
    <div><h1 className="text-xl font-bold text-sky-deep">{L('Subscription နှင့် ငွေပေးချေမှု', 'Subscriptions and payments')}</h1><p className="text-sm text-ink-soft">{L('ဈေးနှုန်းနှင့် ငွေလက်ခံအကောင့်များကို ဤနေရာမှ ပြင်ဆင်နိုင်သည်။ ငွေလက်ခံအကောင့်ကို frontend ကုဒ်ထဲတွင် မထားပါ။', 'Configure prices and payment destinations here. Payment account details are never stored in frontend code.')}</p><button type="button" onClick={async () => { const result = await installRecommendedPlans({}); setMessage(L(`အကြံပြုဈေးနှုန်း — အသစ် ${result.created}၊ ပြင် ${result.updated}`, `Recommended prices — ${result.created} created, ${result.updated} updated`)); }} className="mt-3 rounded-pill border border-sky px-4 py-2 text-sm font-semibold text-sky-deep">{L('အကြံပြုဈေးနှုန်း ၄ မျိုး ထည့်မည်', 'Install 4 recommended prices')}</button></div>

    <section className="rounded-card border border-line bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-semibold text-ink">{L('Member အခြေအနေ', 'Member overview')}</h2>
          <p className="text-sm text-ink-soft">{L('မိဘ member၊ အစီအစဉ်နှင့် account အခြေအနေ', 'Parents, plans, and account status')}</p>
        </div>
        <strong className="text-3xl text-sky-deep">{memberSummary.memberCount.toLocaleString()}</strong>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          [L('အခမဲ့', 'Free'), memberSummary.plans.free],
          ['Premium', memberSummary.plans.premium],
          ['Family', memberSummary.plans.family],
          [L('အဖွဲ့ဝင်/ပညာရှင်', 'Staff/reviewers'), memberSummary.staffCount],
        ].map(([label, value]) => <div key={String(label)} className="rounded-2xl bg-canvas px-3 py-3"><p className="text-xs text-ink-soft">{label}</p><p className="mt-1 text-xl font-bold text-ink">{value}</p></div>)}
      </div>
      <p className="mt-3 text-xs text-ink-soft">
        {L(`အသုံးပြုနေသူ ${memberSummary.statuses.active} · စမ်းသုံးနေသူ ${memberSummary.statuses.trialing} · ငွေပေးချေရန်ကျန် ${memberSummary.statuses.pastDue}`, `Active ${memberSummary.statuses.active} · Trial ${memberSummary.statuses.trialing} · Past due ${memberSummary.statuses.pastDue}`)}
        {memberSummary.countCapped ? L(' · စာရင်း ၅,၀၀၀ အထိသာ ရေတွက်ထားသည်။', ' · Count is capped at 5,000 records.') : ''}
      </p>
      {memberSummary.recentMembers.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-semibold text-sky-deep">{L('နောက်ဆုံးဝင်ထားသော member များ', 'Recent members')}</summary>
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs text-ink-soft"><tr><th className="px-2 py-2">Member</th><th className="px-2 py-2">Plan</th><th className="px-2 py-2">Status</th><th className="px-2 py-2">{L('ဝင်ရောက်သည့်ရက်', 'Joined')}</th></tr></thead>
              <tbody className="divide-y divide-line">{memberSummary.recentMembers.map((member) => <tr key={member.userId}><td className="px-2 py-2">{member.name ?? member.email ?? '—'}{member.name && member.email && <span className="block text-xs text-ink-soft">{member.email}</span>}</td><td className="px-2 py-2 capitalize">{member.planKey}</td><td className="px-2 py-2 capitalize">{member.status.replace('_', ' ')}</td><td className="whitespace-nowrap px-2 py-2 text-xs text-ink-soft">{new Date(member.joinedAt).toLocaleDateString(locale === 'mm' ? 'my-MM' : 'en-US')}</td></tr>)}</tbody>
            </table>
          </div>
        </details>
      )}
    </section>

    <section className="rounded-card border border-line bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div><h2 className="font-semibold text-ink">{L('မိတ်ဆက်သူ စာရင်း', 'Referral tracking')}</h2><p className="text-sm text-ink-soft">{L('ဘယ် member က ဘယ်သူ၏ကုဒ်ဖြင့် ဝင်လာသည်ကို စီမံနိုင်ပါသည်။', 'Track which member joined through each referral code.')}</p></div>
        <strong className="text-2xl text-sky-deep">{referrals.totals.all}</strong>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-pill bg-canvas px-3 py-1">{L('စာရင်းသွင်း', 'Registered')} {referrals.totals.registered}</span>
        <span className="rounded-pill bg-mint-soft px-3 py-1">{L('အတည်ပြုပြီး', 'Qualified')} {referrals.totals.qualified}</span>
        <span className="rounded-pill bg-mint-soft px-3 py-1">{L('အကျိုးခံစားခွင့်ပေးပြီး', 'Rewarded')} {referrals.totals.rewarded}</span>
        <span className="rounded-pill bg-canvas px-3 py-1">{L('ပယ်ထား', 'Rejected')} {referrals.totals.rejected}</span>
      </div>
      {referrals.rows.length === 0 ? <p className="mt-3 text-sm text-ink-soft">{L('မိတ်ဆက်စာရင်း မရှိသေးပါ။', 'No referrals yet.')}</p> : (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs text-ink-soft"><tr><th className="px-2 py-2">{L('ဖိတ်ခေါ်သူ', 'Referrer')}</th><th className="px-2 py-2">{L('ဝင်လာသူ', 'New member')}</th><th className="px-2 py-2">Code</th><th className="px-2 py-2">Status</th></tr></thead>
            <tbody className="divide-y divide-line">{referrals.rows.map((row) => <tr key={row.id}><td className="px-2 py-2">{row.referrerEmail ?? '—'}</td><td className="px-2 py-2">{row.referredEmail ?? '—'}<span className="block text-xs text-ink-soft">{new Date(row.createdAt).toLocaleDateString(locale === 'mm' ? 'my-MM' : 'en-US')}</span></td><td className="px-2 py-2 font-mono text-xs">{row.code}</td><td className="px-2 py-2"><select value={row.status} onChange={(event) => void setReferralStatus({ id: row.id, status: event.target.value as 'registered' | 'qualified' | 'rewarded' | 'rejected' })} className="rounded-lg border border-line px-2 py-1 text-xs"><option value="registered">registered</option><option value="qualified">qualified</option><option value="rewarded">rewarded</option><option value="rejected">rejected</option></select></td></tr>)}</tbody>
          </table>
        </div>
      )}
    </section>

    <form className="space-y-2 rounded-card border border-line bg-white p-4" onSubmit={async (event) => {
      event.preventDefault(); setMessage('');
      try { await upsertPlan({ id: editingPlan, planKey, nameMm: planMm, nameEn: planEn, amount: Number(amount), currency, interval, features: [], isActive: true, sortOrder: planKey === 'premium' ? 1 : 2 }); setEditingPlan(undefined); setPlanMm(''); setPlanEn(''); setAmount(''); setMessage(L('အစီအစဉ် သိမ်းပြီးပါပြီ။', 'Plan saved.')); }
      catch (error) { setMessage(error instanceof Error ? error.message : L('သိမ်း၍ မရပါ။', 'Unable to save.')); }
    }}>
      <h2 className="font-semibold">{editingPlan ? L('အခပေးအစီအစဉ် ပြင်ရန်', 'Edit paid plan') : L('အခပေးအစီအစဉ် ထည့်ရန်', 'Add paid plan')}</h2>
      <select value={planKey} onChange={(event) => setPlanKey(event.target.value as 'premium' | 'family')} className={input}><option value="premium">Premium</option><option value="family">Family</option></select>
      <div className="grid gap-2 sm:grid-cols-2"><input required value={planMm} onChange={(e) => setPlanMm(e.target.value)} placeholder="မြန်မာအမည်" className={input}/><input required value={planEn} onChange={(e) => setPlanEn(e.target.value)} placeholder="English name" className={input}/></div>
      <div className="grid gap-2 sm:grid-cols-3"><input required type="number" min="1" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={L('ဈေးနှုန်း', 'Amount')} className={input}/><input required value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="MMK" className={input}/><select value={interval} onChange={(e) => setInterval(e.target.value as 'month' | 'year')} className={input}><option value="month">{L('လစဉ်', 'Monthly')}</option><option value="year">{L('နှစ်စဉ်', 'Yearly')}</option></select></div>
      <div className="flex gap-2"><button className="rounded-pill bg-sky px-5 py-2 font-semibold text-white">{L('အစီအစဉ် သိမ်းမည်', 'Save plan')}</button>{editingPlan && <button type="button" onClick={() => { setEditingPlan(undefined); setPlanMm(''); setPlanEn(''); setAmount(''); }} className="rounded-pill border border-line px-4 py-2">{L('မပြင်တော့ပါ', 'Cancel')}</button>}</div>
    </form>

    <form className="space-y-2 rounded-card border border-line bg-white p-4" onSubmit={async (event) => {
      event.preventDefault(); setMessage('');
      try { await upsertMethod({ id: editingMethod, nameMm: methodMm, nameEn: methodEn, accountName, accountIdentifier, instructionsMm: instructionsMm || undefined, instructionsEn: instructionsEn || undefined, isActive: true, sortOrder: data.methods.length + 1 }); setEditingMethod(undefined); setMethodMm(''); setMethodEn(''); setAccountName(''); setAccountIdentifier(''); setInstructionsMm(''); setInstructionsEn(''); setMessage(L('ငွေပေးချေမှုနည်းလမ်း သိမ်းပြီးပါပြီ။', 'Payment method saved.')); }
      catch (error) { setMessage(error instanceof Error ? error.message : L('သိမ်း၍ မရပါ။', 'Unable to save.')); }
    }}>
      <h2 className="font-semibold">{editingMethod ? L('ငွေလက်ခံနည်းလမ်း ပြင်ရန်', 'Edit payment method') : L('ငွေလက်ခံနည်းလမ်း ထည့်ရန်', 'Add payment method')}</h2>
      <div className="grid gap-2 sm:grid-cols-2"><input required value={methodMm} onChange={(e) => setMethodMm(e.target.value)} placeholder={L('နည်းလမ်းအမည်', 'Myanmar method name')} className={input}/><input required value={methodEn} onChange={(e) => setMethodEn(e.target.value)} placeholder="English method name" className={input}/></div>
      <input required value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder={L('အကောင့်အမည်', 'Account name')} className={input}/><input required value={accountIdentifier} onChange={(e) => setAccountIdentifier(e.target.value)} placeholder={L('ဖုန်း/အကောင့်နံပါတ်', 'Phone/account number')} className={input}/>
      <textarea value={instructionsMm} onChange={(e) => setInstructionsMm(e.target.value)} placeholder={L('မြန်မာညွှန်ကြားချက်', 'Myanmar instructions')} className={input}/><textarea value={instructionsEn} onChange={(e) => setInstructionsEn(e.target.value)} placeholder="English instructions" className={input}/>
      <div className="flex gap-2"><button className="rounded-pill bg-sky px-5 py-2 font-semibold text-white">{L('နည်းလမ်း သိမ်းမည်', 'Save method')}</button>{editingMethod && <button type="button" onClick={() => setEditingMethod(undefined)} className="rounded-pill border border-line px-4 py-2">{L('မပြင်တော့ပါ', 'Cancel')}</button>}</div>
    </form>
    {message && <p className="text-sm text-ink-soft">{message}</p>}

    <section><h2 className="mb-2 font-semibold">{L('လက်ရှိအစီအစဉ်နှင့် ငွေလက်ခံနည်းလမ်းများ', 'Current plans and payment methods')}</h2><div className="space-y-2 text-sm">{data.plans.map((plan) => <div key={plan._id} className="rounded-lg bg-white p-3"><p>{plan.nameMm} · {plan.amount.toLocaleString()} {plan.currency} · {plan.isActive ? 'active' : 'inactive'}</p><div className="mt-2 flex gap-2"><button type="button" onClick={() => { setEditingPlan(plan._id); setPlanKey(plan.planKey); setPlanMm(plan.nameMm); setPlanEn(plan.nameEn); setAmount(String(plan.amount)); setCurrency(plan.currency); setInterval(plan.interval); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-sky-deep underline">{L('ပြင်မည်', 'Edit')}</button><button type="button" onClick={() => void setPlanActive({ id: plan._id, isActive: !plan.isActive })} className="text-state-orange underline">{plan.isActive ? L('ပိတ်မည်', 'Deactivate') : L('ဖွင့်မည်', 'Activate')}</button></div></div>)}{data.methods.map((method) => <div key={method._id} className="rounded-lg bg-white p-3"><p>{method.nameMm} · {method.accountName} · {method.accountIdentifier}</p><div className="mt-2 flex gap-2"><button type="button" onClick={() => { setEditingMethod(method._id); setMethodMm(method.nameMm); setMethodEn(method.nameEn); setAccountName(method.accountName); setAccountIdentifier(method.accountIdentifier); setInstructionsMm(method.instructionsMm ?? ''); setInstructionsEn(method.instructionsEn ?? ''); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-sky-deep underline">{L('ပြင်မည်', 'Edit')}</button><button type="button" onClick={() => void setMethodActive({ id: method._id, isActive: !method.isActive })} className="text-state-orange underline">{method.isActive ? L('ပိတ်မည်', 'Deactivate') : L('ဖွင့်မည်', 'Activate')}</button></div></div>)}</div></section>

    <section><h2 className="mb-2 font-semibold">{L('ငွေပေးချေမှု စစ်ဆေးရန်', 'Payment verification')}</h2>{data.requests.length === 0 ? <p className="text-sm text-ink-soft">{L('မရှိသေးပါ။', 'None yet.')}</p> : <ul className="space-y-3">{data.requests.map(({ request, userEmail, methodName, proofUrl }) => <li key={request._id} className="rounded-card border border-line bg-white p-4"><p className="font-semibold">{userEmail ?? request.userId} · {request.planKey}</p><p className="text-sm text-ink-soft">{request.amount.toLocaleString()} {request.currency} · {methodName} · {request.paymentReference} · {request.status}</p>{proofUrl && <a href={proofUrl} target="_blank" rel="noreferrer" className="text-sm text-sky-deep underline">{L('အထောက်အထားပုံ ကြည့်မည်', 'View proof')}</a>}{request.status === 'pending' && <div className="mt-2 flex gap-2"><button type="button" onClick={() => { if (window.confirm(L('ငွေဝင်ရောက်ပြီးကြောင်း သေချာစစ်ဆေးပြီးပြီလား။ အတည်ပြုလျှင် အခပေးအစီအစဉ် ချက်ချင်းစတင်ပါမည်။', 'Confirm funds have arrived? Approval activates the paid plan immediately.'))) void review({ id: request._id, decision: 'approved' }); }} className="rounded-pill bg-mint px-4 py-1 text-sm font-semibold text-white">{L('ငွေရပြီး အတည်ပြုမည်', 'Approve payment')}</button><button type="button" onClick={() => { if (window.confirm(L('ဤငွေပေးချေမှုကို ပယ်မလား။', 'Reject this payment request?'))) void review({ id: request._id, decision: 'rejected' }); }} className="rounded-pill border border-state-red px-4 py-1 text-sm text-state-red">{L('ပယ်မည်', 'Reject')}</button></div>}</li>)}</ul>}</section>

    <section>
      <div className="mb-2 flex items-end justify-between gap-3">
        <div><h2 className="font-semibold">{L('Myan Myan Pay မှတ်တမ်း', 'Myan Myan Pay records')}</h2><p className="text-xs text-ink-soft">{L('Webhook နှင့် status check မှ အတည်ပြုထားသော provider records', 'Provider records verified by webhook and status checks')}</p></div>
        <span className="rounded-pill bg-mint-soft px-3 py-1 text-xs font-semibold text-sky-deep">{mmpay.rows.length}</span>
      </div>
      {mmpay.rows.length === 0 ? <p className="text-sm text-ink-soft">{L('Myan Myan Pay မှတ်တမ်း မရှိသေးပါ။', 'No Myan Myan Pay records yet.')}</p> : (
        <div className="overflow-x-auto rounded-card border border-line bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-canvas text-xs text-ink-soft"><tr><th className="px-3 py-2">{L('မိဘ', 'Parent')}</th><th className="px-3 py-2">Order</th><th className="px-3 py-2">{L('ငွေ', 'Amount')}</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">{L('Provider', 'Provider')}</th><th className="px-3 py-2">{L('အချိန်', 'Updated')}</th></tr></thead>
            <tbody className="divide-y divide-line">{mmpay.rows.map(({ payment, userEmail }) => (
              <tr key={payment._id}>
                <td className="px-3 py-3">{userEmail ?? '—'}<span className="block text-xs capitalize text-ink-soft">{payment.planKey} · {payment.environment}</span></td>
                <td className="max-w-[220px] break-all px-3 py-3 font-mono text-xs">{payment.orderId}{payment.transactionRefId && <span className="mt-1 block text-ink-soft">TX: {payment.transactionRefId}</span>}</td>
                <td className="whitespace-nowrap px-3 py-3 font-semibold">{payment.amount.toLocaleString()} MMK</td>
                <td className="px-3 py-3"><span className="rounded-pill bg-mint-soft px-2 py-1 text-xs font-semibold text-sky-deep">{payment.status}</span>{payment.condition && <span className="mt-1 block text-xs text-ink-soft">{payment.condition}</span>}</td>
                <td className="px-3 py-3">{payment.vendor ?? '—'}<span className="block text-xs text-ink-soft">{payment.method ?? '—'}</span></td>
                <td className="whitespace-nowrap px-3 py-3 text-xs text-ink-soft">{new Date(payment.updatedAt).toLocaleString(locale === 'mm' ? 'my-MM' : 'en-US')}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </section>
  </div>;
}
