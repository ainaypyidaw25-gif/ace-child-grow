import { useLocale } from '../app/LocaleContext';

export function SourceTransparency() {
  const { locale } = useLocale();
  return (
    <aside className="rounded-[24px] border border-line bg-white p-5 text-xs leading-6 text-ink-soft">
      <h2 className="font-bold text-ink">{locale === 'mm' ? 'ACE Premium တွင် ပါဝင်သည့် ဝန်ဆောင်မှုများ' : 'What ACE Premium includes'}</h2>
      <p className="mt-2">
        {locale === 'mm'
          ? 'မူရင်းမြန်မာ animation များ၊ ကလေးတစ်ဦးချင်းအလိုက် နေ့စဉ်အစီအစဉ်များ၊ ဖွံ့ဖြိုးမှုမှတ်တမ်းများ၊ အစီရင်ခံစာများ၊ သတိပေးချက်များနှင့် မိသားစုအတွက် အသုံးပြုနိုင်သည့် ဝန်ဆောင်မှုများ ပါဝင်ပါသည်။'
          : 'Original Myanmar animations, personalized daily plans, development records, reports, reminders, and family features are included.'}
      </p>
      <a href="https://www.cdc.gov/MilestoneTracker" target="_blank" rel="noreferrer" className="mt-2 inline-block font-semibold text-sky-deep underline">
        {locale === 'mm' ? 'ဖွံ့ဖြိုးမှုမှတ်တိုင် ကိုးကားရင်းမြစ် — CDC Milestone Tracker' : 'Milestone reference source — CDC Milestone Tracker'}
      </a>
    </aside>
  );
}
