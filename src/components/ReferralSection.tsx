import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';
import { normalizeReferralCode } from '../domain/referrals/referralCapture';

export function ReferralSection() {
  const { locale } = useLocale();
  const referral = useQuery(api.referrals.mine);
  const ensureCode = useMutation(api.referrals.ensureMyCode);
  const claim = useMutation(api.referrals.claim);
  const [claimCode, setClaimCode] = useState('');
  const [message, setMessage] = useState('');
  const L = (mm: string, en: string) => locale === 'mm' ? mm : en;

  if (referral === undefined) return <section className="rounded-card border border-line bg-white p-4 shadow-card">…</section>;
  const shareUrl = referral.code ? `${window.location.origin}/?ref=${encodeURIComponent(referral.code)}` : '';

  async function copyOrShare() {
    if (!referral?.code) return;
    const text = L(
      `ACE Child Grow ကို အတူအသုံးပြုဖို့ ဖိတ်ခေါ်ပါတယ် — ${shareUrl}`,
      `Join me on ACE Child Grow — ${shareUrl}`,
    );
    try {
      if (navigator.share) {
        await navigator.share({ title: 'ACE Child Grow', text, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setMessage(L('ဖိတ်ခေါ်လင့်ခ်ကို ကူးယူပြီးပါပြီ။', 'Referral link copied.'));
      }
    } catch {
      // Closing the native share sheet is not an error the member needs to see.
    }
  }

  return (
    <section className="rounded-card border border-line bg-white p-4 shadow-card">
      <h2 className="font-semibold text-ink">{L('မိတ်ဆက်အစီအစဉ်', 'Referral program')}</h2>
      <p className="mt-1 text-sm leading-6 text-ink-soft">
        {L('မိတ်ဆွေများကို ကိုယ်ပိုင်ကုဒ် သို့မဟုတ် လင့်ခ်ဖြင့် ဖိတ်ခေါ်နိုင်ပါသည်။', 'Invite friends with your personal code or link.')}
      </p>

      {referral.code ? (
        <div className="mt-3 rounded-2xl bg-mint-soft/60 p-3">
          <p className="text-xs text-ink-soft">{L('သင့်မိတ်ဆက်ကုဒ်', 'Your referral code')}</p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <strong className="font-mono text-lg tracking-wider text-sky-deep">{referral.code}</strong>
            <button type="button" onClick={() => void copyOrShare()} className="rounded-pill bg-sky-deep px-4 py-2 text-sm font-semibold text-white">
              {L('လင့်ခ် မျှဝေမည်', 'Share link')}
            </button>
          </div>
          <p className="mt-2 text-sm text-ink-soft">{L(`ဖိတ်ခေါ်ထားသူ ${referral.referredCount} ယောက်`, `${referral.referredCount} referred members`)}</p>
        </div>
      ) : (
        <button
          type="button"
          onClick={async () => {
            setMessage('');
            try {
              await ensureCode({});
              setMessage(L('မိတ်ဆက်ကုဒ် ပြုလုပ်ပြီးပါပြီ။', 'Referral code created.'));
            } catch (error) {
              console.error(error); setMessage(L('ကုဒ်ပြုလုပ်၍ မရပါ။', 'Unable to create code.'));
            }
          }}
          className="mt-3 rounded-pill bg-sky-deep px-5 py-2 text-sm font-semibold text-white"
        >
          {L('ကိုယ်ပိုင်ကုဒ် ပြုလုပ်မည်', 'Create my code')}
        </button>
      )}

      {referral.referredBy ? (
        <p className="mt-3 rounded-2xl border border-line px-3 py-2 text-sm text-ink-soft">
          {L('ဖိတ်ခေါ်သူ', 'Referred by')}: <b className="text-ink">{referral.referredBy.name ?? referral.referredBy.code}</b>
        </p>
      ) : (
        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={async (event) => {
            event.preventDefault();
            setMessage('');
            try {
              const result = await claim({ code: normalizeReferralCode(claimCode) });
              setClaimCode('');
              setMessage(result.alreadyClaimed
                ? L('ဖိတ်ခေါ်သူကို မှတ်တမ်းတင်ထားပြီးဖြစ်ပါသည်။', 'A referrer is already recorded.')
                : L('ဖိတ်ခေါ်သူကို မှတ်တမ်းတင်ပြီးပါပြီ။', 'Referrer recorded.'));
            } catch (error) {
              console.error(error); setMessage(L('ကုဒ်ထည့်၍ မရပါ။', 'Unable to apply code.'));
            }
          }}
        >
          <input
            value={claimCode}
            onChange={(event) => setClaimCode(event.target.value)}
            placeholder={L('ဖိတ်ခေါ်သူ၏ကုဒ်', 'Referrer code')}
            aria-label={L('ဖိတ်ခေါ်သူ၏ကုဒ်', 'Referrer code')}
            className="min-h-touch flex-1 rounded-pill border border-line px-4 py-2 text-sm uppercase"
          />
          <button type="submit" disabled={!claimCode.trim()} className="rounded-pill border border-sky px-5 py-2 text-sm font-semibold text-sky-deep disabled:opacity-50">
            {L('ကုဒ်ထည့်မည်', 'Apply code')}
          </button>
        </form>
      )}
      {message && <p className="mt-2 text-sm text-ink-soft" role="status">{message}</p>}
    </section>
  );
}
