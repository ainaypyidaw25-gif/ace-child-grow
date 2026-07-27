import { useState } from 'react';
import { useMutation } from 'convex/react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';
import { setPortalMode } from '../app/portalMode';

export function AcceptAdminInvite() {
  const { locale } = useLocale();
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const [params] = useSearchParams();
  const claim = useMutation(api.admin.claimInvite);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const code = inviteCode ?? params.get('invite') ?? '';

  return (
    <div className="space-y-4 rounded-card border border-line bg-white p-5 shadow-card">
      <h1 className="text-xl font-bold text-sky-deep">{locale === 'mm' ? 'စီမံခန့်ခွဲရေးအဖွဲ့ ဖိတ်ကြားချက်' : 'Admin invitation'}</h1>
      <p className="text-sm text-ink-soft">
        {locale === 'mm'
          ? 'ဖိတ်ကြားထားသော အီးမေးလ်အကောင့်ဖြင့် ဝင်ထားကြောင်း သေချာပြီးမှ ဝင်ခွင့်လက်ခံပါ။'
          : 'Make sure you are signed in with the invited email address before accepting.'}
      </p>
      {!result?.ok && (
        <button
          type="button"
          disabled={busy || !code}
          onClick={async () => {
            setBusy(true);
            try {
              const next = await claim({ inviteCode: code });
              if (next.ok) setPortalMode('staff');
              setResult(next);
            } finally { setBusy(false); }
          }}
          className="rounded-pill bg-sky px-5 py-2 font-semibold text-white disabled:opacity-50"
        >
          {busy ? '…' : locale === 'mm' ? 'ဖိတ်ကြားချက် လက်ခံမည်' : 'Accept invitation'}
        </button>
      )}
      {result && (
        <p className={result.ok ? 'text-mint' : 'text-state-red'}>
          {locale === 'mm'
            ? result.ok
              ? 'ဖိတ်ကြားချက်ကို လက်ခံပြီး စီမံခန့်ခွဲရေးဝင်ခွင့် ရရှိပါပြီ။'
              : 'ဖိတ်ကြားချက်ကို လက်ခံ၍ မရပါ။ ဖိတ်ကြားထားသော အကောင့်ဖြင့် ဝင်ထားကြောင်းနှင့် လင့်ခ်သက်တမ်း မကုန်သေးကြောင်း စစ်ဆေးပါ။'
            : result.message}
        </p>
      )}
      {result?.ok && <Link to="/admin?tour=staff" className="inline-block text-sky-deep underline">{locale === 'mm' ? 'စီမံခန့်ခွဲရေးစာမျက်နှာသို့ သွားမည်' : 'Go to admin'}</Link>}
    </div>
  );
}
