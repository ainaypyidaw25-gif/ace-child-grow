import { useLocale } from '../app/LocaleContext';

export function SourceTransparency() {
  const { locale } = useLocale();
  return (
    <aside className="rounded-[24px] border border-line bg-white p-5 text-xs leading-6 text-ink-soft">
      <h2 className="font-bold text-ink">{locale === 'mm' ? 'အကြောင်းအရာနှင့် ဝန်ဆောင်မှု ပွင့်လင်းမြင်သာမှု' : 'Content & service transparency'}</h2>
      <p className="mt-2">
        {locale === 'mm'
          ? 'ACE Premium အခကြေးငွေသည် ACE ၏ မူရင်းမြန်မာ animation၊ ကိုယ်ပိုင်နေ့စဉ်အစီအစဉ်၊ မှတ်တမ်း၊ အစီရင်ခံစာ၊ သတိပေးချက်နှင့် မိသားစုအသုံးပြုမှုတို့အတွက် ဖြစ်ပါသည်။ အများပြည်သူဆိုင်ရာ အခြေခံဖွံ့ဖြိုးမှုအချက်အလက်အချို့ကို CDC အပါအဝင် မူရင်းအဖွဲ့အစည်းများ၏ ဝဘ်ဆိုက်များတွင် အခမဲ့ ရရှိနိုင်ပါသည်။'
          : 'ACE Premium charges for ACE’s original Myanmar animations, personalized plans, records, reports, reminders, and family workflow. Some underlying public-health information is available free from original organizations, including CDC.'}
      </p>
      <p className="mt-2">
        {locale === 'mm'
          ? 'ACE Child Grow သည် CDC နှင့် ဆက်စပ်ပူးပေါင်းထားခြင်း သို့မဟုတ် CDC က အတည်ပြုထောက်ခံထားခြင်း မရှိပါ။ CDC အမှတ်တံဆိပ်၊ app ပုံစံ သို့မဟုတ် ကန့်သတ်မူပိုင်ခွင့်ရှိသော ပုံနှင့်ဗီဒီယိုများကို မသုံးပါ။'
          : 'ACE Child Grow is not affiliated with or endorsed by CDC. We do not use CDC branding, copy its app design, or use restricted third-party images or videos.'}
      </p>
      <a href="https://www.cdc.gov/MilestoneTracker" target="_blank" rel="noreferrer" className="mt-2 inline-block font-semibold text-sky-deep underline">
        {locale === 'mm' ? 'CDC ၏ အခမဲ့ Milestone Tracker ကို ကြည့်ရန်' : 'View CDC’s free Milestone Tracker'}
      </a>
    </aside>
  );
}
