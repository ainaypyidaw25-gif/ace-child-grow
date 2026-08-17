import { Link } from 'react-router-dom';
import { useLocale } from '../app/LocaleContext';
import type { Locale } from '../domain/types';

const APP_STORE_DISTRIBUTION = import.meta.env.VITE_DISTRIBUTION === 'app-store';

type LegalPageProps = { kind: 'privacy' | 'account-deletion' | 'terms' | 'support' };

const supportEmail = 'admin-ace@acegroup.com.mm';

// Public, unauthenticated legal pages (Google Play/App Store links and direct
// visitors land here without ever opening the app), so they must render in
// whatever locale <html lang> already reflects (LocaleProvider wraps this
// route the same as every other screen) rather than always showing Myanmar
// regardless of the visitor's saved language choice.
export function LegalPage({ kind }: LegalPageProps) {
  const { locale, setLocale } = useLocale();

  if (kind === 'support') {
    return (
      <PublicLegalShell
        title={locale === 'mm' ? 'ACE Child Grow အကူအညီ' : 'ACE Child Grow Support'}
        locale={locale}
        setLocale={setLocale}
      >
        {locale === 'mm' ? (
          <>
            <p>အကောင့်ဝင်ခြင်း၊ အကောင့်ပြန်လည်ရယူခြင်း၊ App အသုံးပြုခြင်း၊ ကိုယ်ရေးလုံခြုံမှု သို့မဟုတ် အကောင့်ဖျက်ခြင်းအတွက် <a href={`mailto:${supportEmail}?subject=ACE%20Child%20Grow%20support`} className="font-semibold text-sky-deep underline">{supportEmail}</a> သို့ ဆက်သွယ်နိုင်ပါသည်။</p>
            <LegalSection title="အကောင့် ပြန်လည်ရယူရန်">
              အကောင့်ဝင်စာမျက်နှာရှိ <strong>PIN/စကားဝှက် မေ့နေပါသလား?</strong> ကို ရွေးပြီး အီးမေးလ်သို့ ပို့ထားသော ၆ လုံးကုဒ်ကို ဖြည့်ပါ။ Google သို့မဟုတ် Apple ဖြင့် အကောင့်ဖွင့်ထားပါက မူလအသုံးပြုခဲ့သော ဝင်ရောက်နည်းကိုပင် ရွေးပါ။
            </LegalSection>
            <LegalSection title="ပြဿနာတင်ပြရာတွင် ပါဝင်သင့်သည်များ">
              App version နှင့် build၊ ဖုန်းအမျိုးအစား၊ OS version၊ ဖြစ်ပွားသည့်အဆင့်များနှင့် ပြထားသော error စာသားကို ရေးပို့ပါ။ လိုအပ်ပါက ကိုယ်ရေးအချက်အလက် မပါသော screenshot တစ်ပုံ ပူးတွဲနိုင်ပါသည်။ PIN၊ စကားဝှက်၊ အတည်ပြုကုဒ်၊ ကလေး၏အမည်အပြည့်အစုံ၊ မွေးသက္ကရာဇ် သို့မဟုတ် ကျန်းမာရေးမှတ်တမ်းကို အီးမေးလ်ဖြင့် မပို့ပါနှင့်။
            </LegalSection>
            <LegalSection title="ကျန်းမာရေး အရေးပေါ်အခြေအနေ">
              ACE Child Grow သည် အရေးပေါ်ဝန်ဆောင်မှု မဟုတ်သလို ရောဂါရှာဖွေခြင်း မပြုပါ။ အရေးပေါ်အခြေအနေတွင် App support ကို မစောင့်ဘဲ ဒေသဆိုင်ရာ အရေးပေါ်ဝန်ဆောင်မှု သို့မဟုတ် အရည်အချင်းပြည့်မီသော ကျန်းမာရေးပညာရှင်ထံ ချက်ချင်း ဆက်သွယ်ပါ။
            </LegalSection>
            <div className="flex flex-wrap gap-4">
              <Link to="/privacy" className="font-semibold text-sky-deep underline">ကိုယ်ရေးအချက်အလက် မူဝါဒ</Link>
              <Link to="/account-deletion" className="font-semibold text-sky-deep underline">အကောင့်ဖျက်နည်း</Link>
            </div>
            <Link to="/" className="inline-flex rounded-pill bg-sky-deep px-5 py-3 font-semibold text-white">ACE Child Grow သို့ ပြန်သွားမည်</Link>
          </>
        ) : (
          <>
            <p>For help with sign-in, account recovery, using the app, privacy, or account deletion, email <a href={`mailto:${supportEmail}?subject=ACE%20Child%20Grow%20support`} className="font-semibold text-sky-deep underline">{supportEmail}</a>.</p>
            <LegalSection title="Recover your account">
              Choose <strong>Forgot PIN/password?</strong> on the sign-in screen and enter the six-digit code sent to your email. If you created the account with Google or Apple, use the same sign-in method again.
            </LegalSection>
            <LegalSection title="What to include in a support request">
              Include the app version and build, device model, OS version, steps that caused the problem, and the exact error shown. You may attach a screenshot that contains no personal information. Never email a PIN, password, verification code, child&rsquo;s full identity or birth date, or health records.
            </LegalSection>
            <LegalSection title="Medical emergencies">
              ACE Child Grow is not an emergency service and does not diagnose. In an emergency, do not wait for app support; contact local emergency services or a qualified health professional immediately.
            </LegalSection>
            <div className="flex flex-wrap gap-4">
              <Link to="/privacy" className="font-semibold text-sky-deep underline">Privacy Policy</Link>
              <Link to="/account-deletion" className="font-semibold text-sky-deep underline">Account deletion</Link>
            </div>
            <Link to="/" className="inline-flex rounded-pill bg-sky-deep px-5 py-3 font-semibold text-white">Return to ACE Child Grow</Link>
          </>
        )}
      </PublicLegalShell>
    );
  }

  if (kind === 'account-deletion') {
    return (
      <PublicLegalShell
        title={locale === 'mm' ? 'ACE Child Grow အကောင့် ဖျက်ရန်' : 'Delete your ACE Child Grow account'}
        locale={locale}
        setLocale={setLocale}
      >
        {locale === 'mm' ? (
          <>
            <p>အကောင့်ဝင်ပြီး <strong>ကိုယ်ပိုင်အကောင့် → ကိုယ်ရေးလုံခြုံမှု → အကောင့် ဖျက်ရန်</strong> ကို ရွေးပါ။ အတည်ပြုပြီးသည်နှင့် မိဘအကောင့်၊ ကလေးမှတ်တမ်း၊ ဖွံ့ဖြိုးမှုမှတ်တမ်း၊ အိပ်စက်မှုမှတ်တမ်း၊ အကြိုက်ဆုံးများနှင့် ငွေပေးချေမှုဆိုင်ရာ ကိုယ်ပိုင်မှတ်တမ်းများကို ဖျက်ပေးပါမည်။</p>
            <p>မိဘအကောင့်ကို ဆက်လက်ထားရှိပြီး ကလေးတစ်ဦး၏ အချက်အလက်များကိုသာ ဖျက်လိုပါက <strong>ကိုယ်ပိုင်အကောင့် → ကလေးများ</strong> သို့ ဝင်ပါ။ ဖျက်လိုသော ကလေးကို ရွေးပြီး <strong>ဤကလေးကို ဖျက်ရန်</strong> ကို နှိပ်ပါ။ အတည်ပြုပြီးသည်နှင့် ထိုကလေး၏ ကြီးထွားမှု၊ အိပ်စက်မှု၊ ဖွံ့ဖြိုးမှုနှင့် ဆက်စပ်မှတ်တမ်းများကို အပြီးတိုင် ဖျက်ပေးပါမည်။</p>
            <p>App ကို မဝင်နိုင်ပါက <a href={`mailto:${supportEmail}?subject=ACE%20Child%20Grow%20account%20deletion`} className="font-semibold text-sky-deep underline">{supportEmail}</a> သို့ အကောင့်သုံးထားသော အီးမေးလ်ဖြင့် ဖျက်ပေးရန် တောင်းဆိုနိုင်ပါသည်။ လုံခြုံရေးအတွက် အကောင့်ပိုင်ရှင်ဖြစ်ကြောင်း အတည်ပြုရန် ဆက်သွယ်နိုင်ပါသည်။</p>
            <p className="text-sm text-ink-soft">Review နှင့် ငွေစာရင်းကဲ့သို့ ဥပဒေ၊ လုံခြုံရေး သို့မဟုတ် စာရင်းစစ်အတွက် ထိန်းသိမ်းရန်လိုသော မှတ်တမ်းအနည်းငယ်ကို ကိုယ်ရေးအချက်အလက် လျှော့ချပြီး သတ်မှတ်ကာလအထိ ထိန်းသိမ်းနိုင်ပါသည်။</p>
            <Link to="/" className="inline-flex rounded-pill bg-sky-deep px-5 py-3 font-semibold text-white">အကောင့်ဝင်ရန်</Link>
          </>
        ) : (
          <>
            <p>Sign in and go to <strong>My Account → Privacy → Delete account</strong>. Once confirmed, we delete the parent account and its personal records — child profiles, development records, sleep records, favorites and payment records.</p>
            <p>To keep your parent account and delete only one child&rsquo;s data, go to <strong>My Account → Children</strong>. Select the child to remove and tap <strong>Delete this child</strong>. Once confirmed, that child&rsquo;s growth, sleep, development and related records are permanently deleted.</p>
            <p>If you can&rsquo;t sign in, email <a href={`mailto:${supportEmail}?subject=ACE%20Child%20Grow%20account%20deletion`} className="font-semibold text-sky-deep underline">{supportEmail}</a> from the address on your account to request deletion. We may contact you to confirm you&rsquo;re the account owner before proceeding.</p>
            <p className="text-sm text-ink-soft">A small number of records that must be kept for legal, security or audit reasons — such as review and billing records — may be retained in a de-identified form for a defined retention period.</p>
            <Link to="/" className="inline-flex rounded-pill bg-sky-deep px-5 py-3 font-semibold text-white">Sign in</Link>
          </>
        )}
      </PublicLegalShell>
    );
  }

  if (kind === 'terms') {
    if (APP_STORE_DISTRIBUTION) {
      return (
        <PublicLegalShell
          title={locale === 'mm' ? 'ဝန်ဆောင်မှုစည်းမျဉ်းများ' : 'Terms of Service'}
          locale={locale}
          setLocale={setLocale}
        >
          {locale === 'mm' ? (
            <>
              <LegalSection title="ဝန်ဆောင်မှု အကြောင်း">ACE Child Grow သည် မိဘနှင့် စောင့်ရှောက်သူများအတွက် အထွေထွေ ဖွံ့ဖြိုးရေးနှင့် မှတ်တမ်းတင်ရေး အထောက်အကူဖြစ်သည်။ ရောဂါရှာဖွေခြင်း သို့မဟုတ် ဆရာဝန်၏ အကြံဉာဏ်ကို အစားထိုးခြင်း မပြုပါ။</LegalSection>
              <LegalSection title="App Store version">ဤ App Store version တွင် ဖော်ပြထားသော မိဘဝန်ဆောင်မှုများကို အခမဲ့ အသုံးပြုနိုင်ပြီး App အတွင်း ဝယ်ယူမှု သို့မဟုတ် ပြင်ပငွေပေးချေမှု မရှိပါ။</LegalSection>
              <LegalSection title="ဆက်သွယ်ရန်">မေးခွန်းများအတွက် <a href={`mailto:${supportEmail}`} className="font-semibold text-sky-deep underline">{supportEmail}</a> သို့ ဆက်သွယ်နိုင်ပါသည်။</LegalSection>
            </>
          ) : (
            <>
              <LegalSection title="About the service">ACE Child Grow provides general development guidance and record-keeping support for parents and caregivers. It does not diagnose or replace a doctor&rsquo;s advice.</LegalSection>
              <LegalSection title="App Store version">The parent features shown in this App Store version are available free. It contains no in-app purchase or external payment flow.</LegalSection>
              <LegalSection title="Contact">For questions, contact <a href={`mailto:${supportEmail}`} className="font-semibold text-sky-deep underline">{supportEmail}</a>.</LegalSection>
            </>
          )}
        </PublicLegalShell>
      );
    }
    return (
      <PublicLegalShell
        title={locale === 'mm' ? 'ဝန်ဆောင်မှုစည်းမျဉ်းများ' : 'Terms of Service'}
        locale={locale}
        setLocale={setLocale}
        draft
      >
        {locale === 'mm' ? (
          <>
            <p className="text-sm text-ink-soft">မူကြမ်းရေးသားသည့်နေ့ — ၅ ဩဂုတ် ၂၀၂၆</p>
            <LegalSection title="ဝန်ဆောင်မှု အကြောင်း">
              ACE Child Grow ကို လက်ခံသုံးစွဲခြင်းဖြင့် ဤစည်းမျဉ်းများကို သဘောတူပါသည်။ App ကို မိဘနှင့် စောင့်ရှောက်သူများ အသုံးပြုရန် ရည်ရွယ်ပြီး အထွေထွေဖွံ့ဖြိုးရေးလမ်းညွှန်ချက်ဖြစ်သည်၊ ဆေးဘက်ဆိုင်ရာ ရောဂါစစ်ဆေးမှု သို့မဟုတ် ကုသမှု အစားထိုးအဖြစ် မဟုတ်ပါ။
            </LegalSection>
            <LegalSection title="အစီအစဉ်များနှင့် စျေးနှုန်း">
              Free အစီအစဉ်သည် အမြဲတမ်း အခမဲ့ဖြစ်ပါသည်။ Premium နှင့် Family အစီအစဉ်များကို လစဉ် (သို့) နှစ်စဉ် MMK ဖြင့် ကြေညာထားသည့်နှုန်းအတိုင်း ကောက်ခံပါသည်။ Premium ကို ကတ်မလိုဘဲ ၇ ရက် အခမဲ့ စမ်းသုံးနိုင်ပြီး စမ်းသုံးကာလကုန်ဆုံးလျှင် ကတ်အလိုအလျောက် ကောက်ခံခြင်း မရှိဘဲ Free သို့ ပြန်ရောက်သွားပါမည်။
            </LegalSection>
            <LegalSection title="ငွေပေးချေမှု">
              ငွေပေးချေမှုကို Myan Myan Pay (MMQR) ဖြင့် ချက်ချင်း သို့မဟုတ် ငွေလွှဲအထောက်အထား upload တင်ခြင်းဖြင့် လုပ်ဆောင်နိုင်ပါသည်။ ဝန်ထမ်းက အထောက်အထားကို စစ်ဆေးပြီးမှ အစီအစဉ်ကို ဖွင့်ပေးပါမည်။ ငွေလက်ခံအကောင့်နှင့် API secret များကို browser သို့ မပို့ပါ။
            </LegalSection>
            <LegalSection title="သက်တမ်းတိုးခြင်းနှင့် ပယ်ဖျက်ခြင်း">
              အစီအစဉ်များသည် ရွေးချယ်ထားသော ကာလ (တစ်လ သို့ တစ်နှစ်) ပြီးဆုံးသည်နှင့် ပယ်ဖျက်မထားပါက ဆက်လက်တိုးမြှင့်ပါသည်။ မည်သည့်အချိန်တွင်မဆို ပယ်ဖျက်နိုင်ပြီး ပယ်ဖျက်ပါက လက်ရှိပေးချေထားသည့် ကာလကုန်ဆုံးသည်အထိ ဝန်ဆောင်မှုအားလုံးကို ဆက်လက်အသုံးပြုနိုင်ပါသည်။ ကျန်ကာလအတွက် ပိုင်းခြား ငွေပြန်အမ်းမည် မဟုတ်ပါ။
            </LegalSection>
            <LegalSection title="ငွေပြန်အမ်းခြင်း">
              ငွေပေးချေမှုအားလုံးကို ကိုယ်တိုင်စစ်ဆေးသည့်စနစ်ဖြင့် လုပ်ဆောင်ထားသောကြောင့် အလိုအလျောက် ငွေပြန်အမ်းစနစ် မရှိသေးပါ။ မှားယွင်းပေးချေမိခြင်း၊ နှစ်ကြိမ်ထပ်ပေးချေမိခြင်း သို့မဟုတ် အခြားပြဿနာများအတွက် ပေးချေပြီးချိန်မှ ၇ ရက်အတွင်း <a href={`mailto:${supportEmail}?subject=ACE%20Child%20Grow%20refund%20request`} className="font-semibold text-sky-deep underline">{supportEmail}</a> သို့ ဆက်သွယ်ပါက တစ်ခုချင်းစီ သုံးသပ်ပေးပါမည်။
            </LegalSection>
            <LegalSection title="အကြောင်းအရာနှင့် တာဝန်ကန့်သတ်ချက်">
              App ၏ လမ်းညွှန်ချက်၊ လှုပ်ရှားမှုနှင့် အစီရင်ခံစာများသည် ယေဘုယျ ဖွံ့ဖြိုးရေးအထောက်အကူဖြစ်ပြီး ကလေးတစ်ဦးချင်းစီအတွက် ဆရာဝန် သို့မဟုတ် အထူးကုပညာရှင်၏ အကြံဉာဏ်ကို အစားထိုးသည် မဟုတ်ပါ။ ကျန်းမာရေးဆိုင်ရာ စိုးရိမ်စရာများအတွက် အမြဲ ပညာရှင်နှင့် တိုင်ပင်ပါ။
            </LegalSection>
            <LegalSection title="စည်းမျဉ်းပြောင်းလဲခြင်း">
              ဤစည်းမျဉ်းများကို အချိန်ကာလအလိုက် ပြင်ဆင်နိုင်ပါသည်။ သိသာထင်ရှားသော ပြောင်းလဲမှုများကို App အတွင်းမှ အသိပေးပါမည်။
            </LegalSection>
            <LegalSection title="ဆက်သွယ်ရန်">
              ဤစည်းမျဉ်းများနှင့်ပတ်သက်၍ မေးခွန်းများအတွက် <a href={`mailto:${supportEmail}`} className="font-semibold text-sky-deep underline">{supportEmail}</a> သို့ ဆက်သွယ်နိုင်ပါသည်။
            </LegalSection>
          </>
        ) : (
          <>
            <p className="text-sm text-ink-soft">Drafted — 5 August 2026</p>
            <LegalSection title="About this service">
              By using ACE Child Grow you agree to these terms. The app is intended for parents and caregivers, and provides general developmental guidance — it is not a medical diagnosis or a substitute for treatment.
            </LegalSection>
            <LegalSection title="Plans and pricing">
              The Free plan is always free. Premium and Family plans are billed monthly or yearly in MMK at the published rate. Premium can be trialed free for 7 days with no card required; when the trial ends you return to Free automatically — there is no automatic charge.
            </LegalSection>
            <LegalSection title="Payment">
              Payment is handled either instantly via Myan Myan Pay (MMQR) or by uploading proof of a bank/wallet transfer, which staff review before activating your plan. Merchant credentials and API secrets never reach this browser.
            </LegalSection>
            <LegalSection title="Renewal and cancellation">
              Plans renew automatically for the billing period you chose (monthly or yearly) unless canceled. You may cancel at any time; your plan stays active until the end of the period you already paid for. We do not prorate or partially refund the remaining period.
            </LegalSection>
            <LegalSection title="Refunds">
              Because payments go through manual review rather than an automated billing processor, there is no self-service refund yet. If you were charged in error, charged twice, or hit another payment problem, contact <a href={`mailto:${supportEmail}?subject=ACE%20Child%20Grow%20refund%20request`} className="font-semibold text-sky-deep underline">{supportEmail}</a> within 7 days of payment and we will review it individually.
            </LegalSection>
            <LegalSection title="Content and liability">
              The app&rsquo;s guidance, activities and reports are general developmental support and do not replace the advice of a doctor or specialist for your specific child. Always consult a qualified professional for health concerns.
            </LegalSection>
            <LegalSection title="Changes to these terms">
              We may update these terms from time to time. We&rsquo;ll notify you in the app of significant changes.
            </LegalSection>
            <LegalSection title="Contact us">
              For questions about these terms, contact <a href={`mailto:${supportEmail}`} className="font-semibold text-sky-deep underline">{supportEmail}</a>.
            </LegalSection>
          </>
        )}
      </PublicLegalShell>
    );
  }

  return (
    <PublicLegalShell
      title={locale === 'mm' ? 'ကိုယ်ရေးအချက်အလက် မူဝါဒ' : 'Privacy Policy'}
      locale={locale}
      setLocale={setLocale}
    >
      {locale === 'mm' ? (
        <>
          <p className="text-sm text-ink-soft">နောက်ဆုံးပြင်ဆင်သည့်နေ့ — ၂၇ ဇူလိုင် ၂၀၂၆</p>
          <LegalSection title="စုဆောင်းသည့်အချက်အလက်">
            အကောင့်အီးမေးလ်၊ မိဘသဘောတူညီချက်၊ ကလေးအမည်ပြောင်နှင့် မွေးသက္ကရာဇ်၊ မိဘက ထည့်သွင်းသော ကြီးထွားမှု၊ အိပ်စက်မှု၊ ဖွံ့ဖြိုးမှုစစ်ဆေးချက်၊ လှုပ်ရှားမှုနှင့် ဆေးခန်းချိန်းဆိုမှုမှတ်တမ်းများကို ဝန်ဆောင်မှုပေးရန်အတွက်သာ သိမ်းဆည်းပါသည်။
          </LegalSection>
          <LegalSection title="အသုံးပြုပုံနှင့် မျှဝေမှု">
            ကလေး၏ အသက်အရွယ်နှင့်ကိုက်ညီသော လမ်းညွှန်ချက်၊ မှတ်တမ်းနှင့် မိဘရွေးချယ်ထားသော အစီရင်ခံစာများ ပေးရန် အသုံးပြုပါသည်။ အချက်အလက်ကို မရောင်းချပါ၊ ကြော်ငြာကွန်ရက်သို့ မပို့ပါ။ Hosting၊ authentication နှင့် ငွေပေးချေမှု ဆောင်ရွက်ပေးသူများက ဝန်ဆောင်မှုပေးရန် လိုအပ်သလောက်သာ ကိုင်တွယ်နိုင်ပါသည်။
          </LegalSection>
          <LegalSection title="ကလေးအချက်အလက်နှင့် ကျန်းမာရေးအကြောင်းအရာ">
            App ကို မိဘနှင့် စောင့်ရှောက်သူများ အသုံးပြုရန် ရည်ရွယ်ပါသည်။ အကြောင်းအရာများသည် အထွေထွေဖွံ့ဖြိုးရေးနှင့် မိဘပညာပေး လမ်းညွှန်ချက်များဖြစ်ပြီး ရောဂါခွဲခြားခြင်း သို့မဟုတ် ဆရာဝန်၏ အကြံဉာဏ်အစား မဟုတ်ပါ။ စိုးရိမ်မှုရှိပါက သက်ဆိုင်ရာ ကျန်းမာရေးပညာရှင်နှင့် တိုင်ပင်ပါ။
          </LegalSection>
          <LegalSection title="လုံခြုံရေး၊ ထိန်းသိမ်းကာလနှင့် အခွင့်အရေး">
            ဆက်သွယ်မှုကို HTTPS ဖြင့်ကာကွယ်ပြီး အကောင့်အလိုက် ဝင်ရောက်ခွင့် ခွဲထားပါသည်။ App အတွင်းမှ data export လုပ်နိုင်ပြီး အကောင့်နှင့် ကိုယ်ပိုင်အချက်အလက်များကို ဖျက်နိုင်ပါသည်။ ဝန်ဆောင်မှုနှင့် ဥပဒေအရ လိုအပ်သည့်ကာလထက် ကျော်လွန်၍ မသိမ်းဆည်းရန် မူဝါဒထားပါသည်။
          </LegalSection>
          <LegalSection title="ဆက်သွယ်ရန်">
            ACE Child Grow ကိုယ်ရေးလုံခြုံမှုဆိုင်ရာ မေးခွန်းများအတွက် <a href={`mailto:${supportEmail}`} className="font-semibold text-sky-deep underline">{supportEmail}</a> သို့ ဆက်သွယ်နိုင်ပါသည်။
          </LegalSection>
          <Link to="/account-deletion" className="font-semibold text-sky-deep underline">အကောင့်ဖျက်နည်း ကြည့်ရန်</Link>
        </>
      ) : (
        <>
          <p className="text-sm text-ink-soft">Last updated — 27 July 2026</p>
          <LegalSection title="Information we collect">
            We store your account email, parental consent, your child&rsquo;s nickname and date of birth, and the growth, sleep, development-screening, activity and appointment records you enter — only to provide the service.
          </LegalSection>
          <LegalSection title="How we use and share it">
            We use it to give you age-appropriate guidance, keep your records, and generate the reports you choose. We never sell your data or send it to ad networks. Our hosting, authentication and payment providers only handle what they need to deliver the service.
          </LegalSection>
          <LegalSection title="Children's data and health content">
            This app is intended for parents and caregivers to use. Its content is general developmental and parenting guidance — it is not a diagnosis or a substitute for a doctor&rsquo;s advice. If you have a concern, talk to a qualified health professional.
          </LegalSection>
          <LegalSection title="Security, retention and your rights">
            Traffic is protected with HTTPS, and access is scoped per account. You can export your data from within the app, and delete your account and personal data. We aim not to retain data longer than the service and the law require.
          </LegalSection>
          <LegalSection title="Contact us">
            For privacy questions about ACE Child Grow, contact <a href={`mailto:${supportEmail}`} className="font-semibold text-sky-deep underline">{supportEmail}</a>.
          </LegalSection>
          <Link to="/account-deletion" className="font-semibold text-sky-deep underline">See how to delete your account</Link>
        </>
      )}
    </PublicLegalShell>
  );
}

function PublicLegalShell({
  title,
  locale,
  setLocale,
  draft = false,
  children,
}: {
  title: string;
  locale: Locale;
  setLocale: (l: Locale) => void;
  draft?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-surface px-4 py-10 text-ink">
      <article className="mx-auto max-w-3xl rounded-card border border-line bg-white p-6 shadow-card sm:p-10">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="text-sm font-semibold text-sky-deep">ACE Child Grow</Link>
          <button
            type="button"
            onClick={() => setLocale(locale === 'mm' ? 'en' : 'mm')}
            className="rounded-pill border border-line bg-white px-4 py-1 text-sm text-ink-soft"
          >
            {locale === 'mm' ? 'English' : 'မြန်မာ'}
          </button>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-sky-deep">{title}</h1>
        {draft && (
          <p className="mt-3 rounded-2xl bg-pastel-yellow/60 px-4 py-3 text-sm font-semibold text-ink" role="note">
            {locale === 'mm'
              ? '⚠️ မူကြမ်းသာဖြစ်သည်။ Owner ၏ ဥပဒေရေးရာ သုံးသပ်ချက်မရမချင်း စာချုပ်အဖြစ် အတည်မဖြစ်သေးပါ။'
              : '⚠️ This is a draft. It is not legally binding until the owner completes legal review and publishes it.'}
          </p>
        )}
        <div className="mt-7 space-y-6 leading-7">{children}</div>
      </article>
    </main>
  );
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="mb-2 text-lg font-bold">{title}</h2><p>{children}</p></section>;
}
