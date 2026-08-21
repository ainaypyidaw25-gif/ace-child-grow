import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';
import { isFeatureAvailableOnCurrentPlatform, isNativeStoreBuild } from '../app/platform';

export function PremiumGate({
  feature,
  children,
}: {
  feature: string;
  children: ReactNode;
}) {
  const { locale } = useLocale();
  const nativeStoreBuild = isNativeStoreBuild();
  const subscription = useQuery(api.subscriptions.mine);
  if (subscription === undefined) return <p className="text-ink-soft" role="status">…</p>;
  if (isFeatureAvailableOnCurrentPlatform(subscription.features, feature)) return children;
  return (
    <section className="mx-auto max-w-xl overflow-hidden rounded-[30px] border border-sky/20 bg-white shadow-card">
      <div className="bg-ink px-6 py-8 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-mint">ACE Premium</p>
        <h1 className="mt-3 text-2xl font-bold">
          {locale === 'mm' ? 'ဤဝန်ဆောင်မှုကို Premium ဖြင့် အသုံးပြုနိုင်ပါသည်' : 'This feature is available with Premium'}
        </h1>
        <p className="mt-3 text-sm leading-7 text-white/75">
          {nativeStoreBuild
            ? locale === 'mm'
              ? 'ဤဝန်ဆောင်မှုသည် လက်ရှိအခမဲ့အစီအစဉ်တွင် မပါဝင်ပါ။'
              : 'This feature is not included in the current free plan.'
            : locale === 'mm'
            ? '၇ ရက် အခမဲ့စမ်းသုံးနိုင်ပြီး ဘဏ်ကတ်ထည့်ရန် မလိုပါ။ စမ်းသုံးကာလပြီးလျှင် အခမဲ့အစီအစဉ်သို့ အလိုအလျောက် ပြန်သွားပါမည်။'
            : 'Try it free for 7 days without a card. You will return to Free automatically after the trial.'}
        </p>
      </div>
      {!nativeStoreBuild && <div className="p-6">
        <Link
          to="/subscription"
          className="flex min-h-touch w-full items-center justify-center rounded-pill bg-sky-deep px-6 py-3 font-bold text-white"
        >
          {locale === 'mm' ? 'အခမဲ့ စမ်းသုံးမည်' : 'Start free trial'}
        </Link>
        <p className="mt-3 text-center text-xs text-ink-soft">
          {locale === 'mm' ? 'Premium — တစ်လ ၆,၉၀၀ ကျပ်မှ စတင်သည်' : 'Premium starts at 6,900 MMK/month'}
        </p>
      </div>}
    </section>
  );
}
