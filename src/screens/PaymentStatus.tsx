import { useEffect, useState } from 'react';
import { useAction, useQuery } from 'convex/react';
import QRCode from 'qrcode';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';
import { ConfirmDialog } from '../components/ConfirmDialog';

type View = 'status' | 'success' | 'cancel';

const TERMINAL = new Set(['SUCCESS', 'FAILED', 'REFUNDED', 'CANCELLED', 'EXPIRED']);
export const MMQR_VALIDITY_MS = 15 * 60 * 1_000;

export function paymentQrRemainingMs(createdAt: number, now: number) {
  return Math.max(0, createdAt + MMQR_VALIDITY_MS - now);
}

export function formatPaymentCountdown(remainingMs: number) {
  const totalSeconds = Math.ceil(Math.max(0, remainingMs) / 1_000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function PaymentStatus({ view = 'status' }: { view?: View }) {
  const { orderId = '' } = useParams();
  const { locale } = useLocale();
  const payment = useQuery(api.mmpayData.myPayment, orderId ? { orderId } : 'skip');
  const paymentCreatedAt = payment?.createdAt;
  const paymentStatus = payment?.status;
  const refresh = useAction(api.mmpay.refreshPayment);
  const cancel = useAction(api.mmpay.cancelPayment);
  const navigate = useNavigate();
  const [qrUrl, setQrUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const L = (mm: string, en: string) => locale === 'mm' ? mm : en;

  useEffect(() => {
    let active = true;
    if (!payment?.qrPayload) {
      setQrUrl('');
      return () => { active = false; };
    }
    void QRCode.toDataURL(payment.qrPayload, { width: 360, margin: 2, errorCorrectionLevel: 'M' })
      .then((url) => { if (active) setQrUrl(url); })
      .catch(() => { if (active) setMessage(locale === 'mm' ? 'QR ပုံဖန်တီး၍ မရပါ။' : 'Unable to render the QR code.'); });
    return () => { active = false; };
  }, [payment?.qrPayload, locale]);

  useEffect(() => {
    if (!payment || TERMINAL.has(payment.status)) return;
    const timer = window.setInterval(() => {
      void refresh({ orderId: payment.orderId }).catch(() => undefined);
    }, 5_000);
    return () => window.clearInterval(timer);
  }, [payment, refresh]);

  useEffect(() => {
    if (!paymentCreatedAt || !paymentStatus || TERMINAL.has(paymentStatus)) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [paymentCreatedAt, paymentStatus]);

  useEffect(() => {
    if (!payment) return;
    if (payment.status === 'SUCCESS' && view !== 'success') navigate(`/payment/success/${payment.orderId}`, { replace: true });
    if (payment.status === 'CANCELLED' && view !== 'cancel') navigate(`/payment/cancel/${payment.orderId}`, { replace: true });
  }, [navigate, payment, view]);

  if (!orderId) return <p className="rounded-card bg-white p-5 text-state-red-deep">{L('Order ID မရှိပါ။', 'Missing order ID.')}</p>;
  if (payment === undefined) return <p className="text-ink-soft" role="status">…</p>;
  if (payment === null) return <p className="rounded-card bg-white p-5 text-state-red-deep">{L('ဤငွေပေးချေမှုကို ရှာမတွေ့ပါ။', 'Payment not found.')}</p>;

  const pending = payment.status === 'INITIATING' || payment.status === 'PENDING';
  const qrRemainingMs = pending ? paymentQrRemainingMs(payment.createdAt, now) : 0;
  const qrCountdownExpired = pending && qrRemainingMs === 0;
  // Route names are presentation only. Never show a success/cancel result just
  // because someone manually typed that URL; the persisted provider status wins.
  const effectiveView: View = payment.status === 'SUCCESS' ? 'success' : payment.status === 'CANCELLED' ? 'cancel' : 'status';
  const title = effectiveView === 'success'
    ? L('ငွေပေးချေမှု အောင်မြင်ပါပြီ', 'Payment successful')
    : effectiveView === 'cancel'
      ? L('ငွေပေးချေမှု ပယ်ဖျက်ပြီးပါပြီ', 'Payment canceled')
      : L('MMQR ဖြင့် ငွေပေးချေပါ', 'Pay with MMQR');

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <section className="overflow-hidden rounded-[30px] border border-line bg-white shadow-card">
        <header className={`px-5 py-7 text-center sm:px-8 ${effectiveView === 'success' ? 'bg-mint-soft' : effectiveView === 'cancel' ? 'bg-pink/40' : 'bg-cream'}`}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-deep">Myan Myan Pay</p>
          <h1 className="mt-2 text-2xl font-bold text-ink">{title}</h1>
          <p className="mt-2 break-all text-xs text-ink-soft">{payment.orderId}</p>
        </header>

        <div className="space-y-5 p-5 sm:p-8">
          <div className="flex items-center justify-between rounded-2xl bg-canvas p-4">
            <span className="text-sm text-ink-soft">{L('ကျသင့်ငွေ', 'Amount')}</span>
            <span className="text-xl font-bold text-ink">{payment.amount.toLocaleString()} MMK</span>
          </div>

          {pending && !qrCountdownExpired && (
            <div className="rounded-2xl border border-pastel-yellow bg-pastel-yellow/30 px-4 py-3 text-center" role="timer" aria-live="polite">
              <p className="text-sm font-semibold text-ink-soft">{L('MMQR သက်တမ်းကုန်ရန် ကျန်ချိန်', 'MMQR expires in')}</p>
              <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-state-red-deep">{formatPaymentCountdown(qrRemainingMs)}</p>
            </div>
          )}

          {pending && qrCountdownExpired && (
            <div className="rounded-2xl border border-pastel-yellow bg-pastel-yellow/40 p-4 text-center text-ink" role="status">
              <p className="font-bold">{L('ဤ MMQR ၏ ၁၅ မိနစ် အချိန်ကန့်သတ်ချက် ပြည့်သွားပါပြီ။', 'This MMQR has reached its 15-minute time limit.')}</p>
              <p className="mt-2 text-sm text-ink-soft">{L('အခြေအနေကို ပြန်စစ်ပါ။ ငွေမပေးရသေးပါက ပယ်ဖျက်ပြီး QR အသစ်ဖန်တီးနိုင်ပါသည်။', 'Refresh the status. If it was not paid, cancel it and create a new QR.')}</p>
            </div>
          )}

          {pending && !qrCountdownExpired && qrUrl && (
            <div className="text-center">
              <img src={qrUrl} alt={L('Myan Myan Pay MMQR ကုဒ်', 'Myan Myan Pay MMQR code')} className="mx-auto w-full max-w-[360px] rounded-2xl border border-line bg-white p-3" />
              <img
                src="https://developers.myanmyanpay.com/MMQR_Logo.png"
                alt="MMQR"
                className="mx-auto mt-3 h-10 w-auto object-contain"
              />
              <p className="mt-2 text-xs font-bold tracking-[0.12em] text-ink">
                PAYMENT POWERED BY MYANMYANPAY
              </p>
              <p className="mt-3 text-sm leading-6 text-ink-soft">{L('Wallet app ကိုဖွင့်ပြီး QR ကို scan လုပ်ပါ။ ဤစာမျက်နှာက အခြေအနေကို အလိုအလျောက် စစ်ဆေးနေပါသည်။', 'Open your wallet and scan this QR. This page checks the payment automatically.')}</p>
            </div>
          )}

          {pending && payment.checkoutUrl && (
            <a href={payment.checkoutUrl} target="_blank" rel="noreferrer" className="block min-h-touch rounded-pill bg-sky-deep px-6 py-3 text-center font-bold text-white">
              {L('ငွေပေးချေမှု စာမျက်နှာ ဖွင့်မည်', 'Open payment page')}
            </a>
          )}

          {effectiveView === 'success' && (
            <div className="rounded-2xl border border-mint bg-mint-soft/50 p-4 text-center">
              <p className="font-bold text-sky-deep">✓ {L('Subscription ကို အလိုအလျောက် ဖွင့်ပေးပြီးပါပြီ။', 'Your subscription has been activated automatically.')}</p>
              {payment.transactionRefId && <p className="mt-2 break-all text-xs text-ink-soft">{L('Transaction', 'Transaction')}: {payment.transactionRefId}</p>}
            </div>
          )}

          {effectiveView === 'cancel' && <p className="rounded-2xl bg-pink/35 p-4 text-center text-ink">{L('ငွေမဖြတ်ထားပါက အစီအစဉ်အသစ်ကို ပြန်ရွေးနိုင်ပါသည်။', 'You can choose a new plan if no money was deducted.')}</p>}

          {!pending && effectiveView === 'status' && payment.status !== 'SUCCESS' && payment.status !== 'CANCELLED' && (
            <p className="rounded-2xl bg-pastel-yellow/50 p-4 text-center text-ink">{L('ငွေပေးချေမှု အခြေအနေ', 'Payment status')}: <strong>{payment.status}</strong>{payment.failureReason ? ` · ${payment.failureReason}` : ''}</p>
          )}

          {pending && (
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true); setMessage('');
                  try { await refresh({ orderId: payment.orderId }); }
                  catch (error) { console.error(error); setMessage(L('အခြေအနေ စစ်ဆေး၍ မရပါ။', 'Unable to refresh status.')); }
                  finally { setBusy(false); }
                }}
                className="min-h-touch flex-1 rounded-pill border border-sky-deep px-5 py-2 font-semibold text-sky-deep disabled:opacity-50"
              >{busy ? '…' : L('အခြေအနေ စစ်မည်', 'Refresh status')}</button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmCancel(true)}
                className="min-h-touch flex-1 rounded-pill border border-state-red px-5 py-2 font-semibold text-state-red-deep disabled:opacity-50"
              >{L('ပယ်ဖျက်မည်', 'Cancel payment')}</button>
            </div>
          )}

          {confirmCancel && (
            <ConfirmDialog
              message={L('ဤငွေပေးချေမှုကို ပယ်ဖျက်မလား။', 'Cancel this payment?')}
              cancelLabel={L('မလုပ်တော့ပါ', 'Cancel')}
              confirmLabel={L('ပယ်ဖျက်မည်', 'Cancel payment')}
              onCancel={() => setConfirmCancel(false)}
              onConfirm={async () => {
                setConfirmCancel(false);
                setBusy(true); setMessage('');
                try { await cancel({ orderId: payment.orderId }); }
                catch (error) { console.error(error); setMessage(L('ပယ်ဖျက်၍ မရပါ။', 'Unable to cancel payment.')); }
                finally { setBusy(false); }
              }}
            />
          )}

          {message && <p className="text-sm text-state-red-deep" role="alert">{message}</p>}
          <Link to={effectiveView === 'success' ? '/home' : '/subscription'} className="block text-center text-sm font-semibold text-sky-deep underline">
            {effectiveView === 'success' ? L('ပင်မစာမျက်နှာသို့', 'Go to home') : L('အစီအစဉ်များသို့ ပြန်မည်', 'Back to plans')}
          </Link>
        </div>
      </section>
    </div>
  );
}
