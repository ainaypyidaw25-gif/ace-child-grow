import { Link } from 'react-router-dom';
import { useLocale } from '../app/LocaleContext';
import type { Locale } from '../domain/types';

type LegalPageProps = { kind: 'privacy' | 'account-deletion' };

const supportEmail = 'admin-ace@acegroup.com.mm';

// Public, unauthenticated legal pages (Google Play/App Store links and direct
// visitors land here without ever opening the app), so they must render in
// whatever locale <html lang> already reflects (LocaleProvider wraps this
// route the same as every other screen) rather than always showing Myanmar
// regardless of the visitor's saved language choice.
export function LegalPage({ kind }: LegalPageProps) {
  const { locale, setLocale } = useLocale();

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
  children,
}: {
  title: string;
  locale: Locale;
  setLocale: (l: Locale) => void;
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
        <div className="mt-7 space-y-6 leading-7">{children}</div>
      </article>
    </main>
  );
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="mb-2 text-lg font-bold">{title}</h2><p>{children}</p></section>;
}
