import { useLocale } from '../app/LocaleContext';

export function ReviewOngoingNotice() {
  const { locale } = useLocale();
  return (
    <div className="rounded-2xl border border-mint/30 bg-mint-soft/60 px-4 py-3 text-sm leading-6 text-ink">
      <p>
        {locale === 'mm'
          ? 'ဤအကြောင်းအရာများကို ယခု ဖတ်ရှုအသုံးပြုနိုင်ပါသည်။ ပညာရှင်များက ဆက်လက်စိစစ်ပြင်ဆင်နိုင်ပြီး ရောဂါသတ်မှတ်ချက် သို့မဟုတ် တစ်ဦးချင်းဆေးဘက်ဆိုင်ရာ အကြံဉာဏ် မဟုတ်ပါ။'
          : 'This content is available while professional review continues. Reviewers may revise it; it is not a diagnosis or personal medical advice.'}
      </p>
    </div>
  );
}
