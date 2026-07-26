import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import type { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';

export function SubscriptionPlans() {
  const { locale } = useLocale();
  const options = useQuery(api.billing.options);
  const requests = useQuery(api.billing.myRequests);
  const generateUploadUrl = useMutation(api.billing.generateProofUploadUrl);
  const submit = useMutation(api.billing.submitPaymentRequest);
  const cancel = useMutation(api.billing.cancelMyRequest);
  const [planId, setPlanId] = useState<Id<'subscriptionPlans'> | ''>('');
  const [methodId, setMethodId] = useState<Id<'paymentMethods'> | ''>('');
  const [reference, setReference] = useState('');
  const [proof, setProof] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const L = (mm: string, en: string) => locale === 'mm' ? mm : en;

  if (!options || !requests) return <p className="text-ink-soft">…</p>;
  const selectedPlan = options.plans.find((plan) => plan._id === planId);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-sky-deep">{L('အဖွဲ့ဝင်အစီအစဉ်များ', 'Membership plans')}</h1>
        <p className="text-sm text-ink-soft">{L('ငွေလွှဲပြီးနောက် အထောက်အထားနှင့် ငွေလွှဲနံပါတ်ကို ပို့ပါ။ Owner က စစ်ဆေးအတည်ပြုပြီးမှ အစီအစဉ် စတင်ပါမည်။', 'Transfer payment, then submit the reference and proof. Membership starts after owner verification.')}</p>
      </div>

      {options.plans.length === 0 || options.methods.length === 0 ? (
        <p className="rounded-card bg-pastel-yellow/50 p-4 text-sm">{L('အခပေးအစီအစဉ်နှင့် ငွေပေးချေမှုနည်းလမ်းများကို Owner က ပြင်ဆင်နေပါသည်။', 'Paid plans and payment methods are being configured by the owner.')}</p>
      ) : (
        <>
          <div className="grid gap-3">
            {options.plans.map((plan) => (
              <button key={plan._id} type="button" onClick={() => setPlanId(plan._id)} className={`rounded-card border p-4 text-left shadow-card ${planId === plan._id ? 'border-sky bg-mint-soft/30' : 'border-line bg-white'}`}>
                <p className="font-semibold text-sky-deep">{locale === 'mm' ? plan.nameMm : plan.nameEn}</p>
                <p className="text-lg font-bold">{plan.amount.toLocaleString()} {plan.currency} / {plan.interval === 'month' ? L('လ', 'month') : L('နှစ်', 'year')}</p>
                <p className="text-sm text-ink-soft">{locale === 'mm' ? plan.descriptionMm : plan.descriptionEn}</p>
              </button>
            ))}
          </div>

          {selectedPlan && (
            <form className="space-y-3 rounded-card border border-line bg-white p-4" onSubmit={async (event) => {
              event.preventDefault();
              if (!planId || !methodId) return;
              setBusy(true); setMessage('');
              try {
                let proofStorageId: Id<'_storage'> | undefined;
                if (proof) {
                  if (!proof.type.startsWith('image/') || proof.size > 5 * 1024 * 1024) throw new Error(L('ပုံဖိုင် 5MB အောက်သာ တင်ပါ။', 'Upload an image smaller than 5MB.'));
                  const uploadUrl = await generateUploadUrl({});
                  const response = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': proof.type }, body: proof });
                  if (!response.ok) throw new Error(L('အထောက်အထားပုံ တင်၍ မရပါ။', 'Unable to upload proof.'));
                  proofStorageId = (await response.json()).storageId as Id<'_storage'>;
                }
                await submit({ planId, paymentMethodId: methodId, paymentReference: reference, proofStorageId });
                setReference(''); setProof(null);
                setMessage(L('ငွေပေးချေမှုအတည်ပြုရန် ပို့ပြီးပါပြီ။', 'Payment request submitted for verification.'));
              } catch (error) { setMessage(error instanceof Error ? error.message : L('ပို့၍ မရပါ။', 'Unable to submit.')); }
              finally { setBusy(false); }
            }}>
              <h2 className="font-semibold">{L('ငွေပေးချေမှုနည်းလမ်း', 'Payment method')}</h2>
              <select required value={methodId} onChange={(event) => setMethodId(event.target.value as Id<'paymentMethods'>)} className="w-full rounded-lg border border-line px-3 py-2">
                <option value="">{L('ရွေးချယ်ပါ', 'Select')}</option>
                {options.methods.map((method) => <option key={method._id} value={method._id}>{locale === 'mm' ? method.nameMm : method.nameEn}</option>)}
              </select>
              {options.methods.filter((method) => method._id === methodId).map((method) => (
                <div key={method._id} className="rounded-lg bg-canvas p-3 text-sm">
                  <p>{method.accountName}</p><p className="font-semibold">{method.accountIdentifier}</p>
                  <p className="text-ink-soft">{locale === 'mm' ? method.instructionsMm : method.instructionsEn}</p>
                </div>
              ))}
              <input required value={reference} onChange={(event) => setReference(event.target.value)} placeholder={L('ငွေလွှဲနံပါတ် / Transaction ID', 'Transfer reference / Transaction ID')} className="w-full rounded-lg border border-line px-3 py-2" />
              <label className="block text-sm text-ink-soft">{L('ငွေလွှဲအထောက်အထားပုံ (ရွေးချယ်နိုင်)', 'Payment proof image (optional)')}<input type="file" accept="image/*" onChange={(event) => setProof(event.target.files?.[0] ?? null)} className="mt-1 block w-full" /></label>
              <button disabled={busy} className="rounded-pill bg-sky px-5 py-2 font-semibold text-white disabled:opacity-50">{busy ? '…' : L('အတည်ပြုရန် ပို့မည်', 'Submit for verification')}</button>
              {message && <p className="text-sm text-ink-soft">{message}</p>}
            </form>
          )}
        </>
      )}

      <section>
        <h2 className="mb-2 font-semibold">{L('တင်ပြထားသော ငွေပေးချေမှုများ', 'My payment requests')}</h2>
        {requests.length === 0 ? <p className="text-sm text-ink-soft">{L('မရှိသေးပါ။', 'None yet.')}</p> : <ul className="space-y-2">{requests.map((request) => (
          <li key={request._id} className="rounded-xl border border-line bg-white p-3 text-sm">
            <p className="font-medium">{request.planKey} · {request.amount.toLocaleString()} {request.currency}</p>
            <p className="text-ink-soft">{request.paymentReference} · {request.status}</p>
            {request.status === 'pending' && <button type="button" onClick={() => void cancel({ id: request._id })} className="mt-2 text-state-red underline">{L('ပယ်ဖျက်မည်', 'Cancel')}</button>}
          </li>
        ))}</ul>}
      </section>
    </div>
  );
}
