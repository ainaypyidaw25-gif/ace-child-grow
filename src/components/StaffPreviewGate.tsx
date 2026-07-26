import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';

export function useStaffPreviewAccess(): boolean | undefined {
  const me = useQuery(api.parent.me);
  return me === undefined
    ? undefined
    : me?.isStaff === true && me.staffRole !== 'support';
}

export function UnreviewedContentNotice() {
  const { locale } = useLocale();
  return (
    <div className="rounded-card border border-line bg-mint-soft/40 p-5 text-center">
      <div aria-hidden className="text-3xl">🌱</div>
      <p className="mt-2 font-medium text-ink">
        {locale === 'mm'
          ? 'ဤကဏ္ဍ၏ အကြောင်းအရာများကို ကျန်းမာရေးပညာရှင် အတည်ပြုပြီးမှသာ မိဘများအတွက် ဖော်ပြပါမည်။'
          : 'This section will be available to parents after qualified clinical review.'}
      </p>
    </div>
  );
}

export function StaffPreviewBanner() {
  const { locale } = useLocale();
  return (
    <p className="rounded-lg bg-pastel-yellow/60 px-3 py-2 text-xs text-ink">
      {locale === 'mm'
        ? 'ဝန်ထမ်းများအတွက် မူကြမ်းကြည့်ရှုမှုသာ ဖြစ်သည်။ ကျန်းမာရေးပညာရှင်၏ အတည်ပြုချက် မရသေးပါ။'
        : 'Staff draft preview only. This content has not been clinically approved.'}
    </p>
  );
}
