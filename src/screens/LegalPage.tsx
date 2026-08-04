import { Link } from 'react-router-dom';

type LegalPageProps = { kind: 'privacy' | 'account-deletion' | 'support' | 'methodology' };

const supportEmail = 'admin-ace@acegroup.com.mm';

export function LegalPage({ kind }: LegalPageProps) {
  if (kind === 'methodology') {
    return (
      <PublicLegalShell title="စစ်ဆေးစာရင်း အသုံးပြုပုံ" titleEn="How the milestone guidance works">
        <LegalSection title="ရည်ရွယ်ချက် / Purpose">
          ဖွံ့ဖြိုးမှု စစ်ဆေးစာရင်းသည် မိဘနှင့် ပြုစုစောင့်ရှောက်သူများက ကလေး၏ အပြုအမူနှင့် ကျွမ်းကျင်မှုများကို မှတ်သားပြီး စိုးရိမ်ချက်ရှိပါက ကျွမ်းကျင်ပညာရှင်နှင့် ဆွေးနွေးနိုင်ရန် ကူညီသည့် developmental monitoring tool ဖြစ်ပါသည်။ ရောဂါရှာဖွေစစ်ဆေးမှု သို့မဟုတ် အတည်ပြုထားသော developmental screening test မဟုတ်ပါ။<br />
          The milestone checklist is a developmental-monitoring aid for parents and caregivers. It helps record observations and prepare concerns for discussion with a qualified professional. It is not a diagnosis or a validated developmental screening test.
        </LegalSection>
        <LegalSection title="ရလဒ်အုပ်စုများ / Guidance groups">
          အဖြေများကို နောက်တစ်ဆင့် ဘာလုပ်ရမည်ဆိုသည့် အထောက်အကူပြုစာသားရွေးရန်သာ အုပ်စုခွဲပါသည်။ App သည် ရမှတ်၊ ရာခိုင်နှုန်း၊ ရောဂါဖြစ်နိုင်ခြေ သို့မဟုတ် ကလေးတစ်ဦး၏ ဖွံ့ဖြိုးမှုအဆင့်ကို တွက်ချက်မပြပါ။<br />
          Answers are grouped only to choose supportive next-step guidance. The app does not display a developmental score, percentage, disease probability, or clinical classification.
        </LegalSection>
        <LegalSection title="ကျွမ်းကျင်မှု ပြန်လည်လျော့နည်းခြင်း / Loss of a previously acquired skill">
          ယခင်လုပ်နိုင်ခဲ့သော ကျွမ်းကျင်မှု လျော့နည်းကြောင်း မှတ်သားလျှင် စိုးရိမ်ချက်အဖြစ် သိမ်းဆည်းပြီး လက်ရှိ clinical rule များအတိုင်း ပိုမိုအရေးကြီးသော safety guidance ကို ပြပါသည်။ အကြောင်းရင်းကို App က မသတ်မှတ်ပါ။ ပြထားသောလမ်းညွှန်ချက်ကို လိုက်နာပြီး အရည်အချင်းပြည့်မီသော ကျန်းမာရေးဝန်ထမ်းနှင့် ဆက်သွယ်ပါ။<br />
          A reported loss of a previously acquired skill is saved as a concern and triggers heightened safety guidance under the current clinical rules. The app does not determine the cause. Follow the displayed guidance and contact a qualified health professional.
        </LegalSection>
        <LegalSection title="ကြီးထွားမှုမှတ်တမ်း / Growth records">
          အရပ်နှင့် ကိုယ်အလေးချိန်အချက်အလက်များကို မိဘမှတ်တမ်းအဖြစ်သာ သိမ်းဆည်းပါသည်။ လက်ရှိ App Store ဗားရှင်းတွင် percentile၊ ရောဂါရှာဖွေမှု သို့မဟုတ် clinical growth assessment မပြုပါ။<br />
          Height and weight entries are stored as parent records. The current App Store version does not calculate percentiles, diagnose a condition, or provide a clinical growth assessment.
        </LegalSection>
        <LegalSection title="ကိုးကားရင်းမြစ် / Reference approach">
          အသက်အလိုက် milestone အကြောင်းအရာများကို public-health reference များနှင့် ချိတ်ဆက်စစ်ဆေးပြီး ဘာသာစကား၊ အထောက်အထား၊ safety နှင့် သက်ဆိုင်ရာ professional review ပြီးမှ မိဘများထံ ထုတ်ဝေပါသည်။ CDC ကလည်း milestone checklist ကို မိသားစုနှင့် ကျွမ်းကျင်ပညာရှင်တို့ ဆွေးနွေးရန် communication tool အဖြစ်အသုံးပြုရပြီး validated screening tool ကို အစားမထိုးကြောင်း ရှင်းပြထားပါသည်။<br />
          Age-based milestone content is checked against public-health references and is shown to parents only after language, evidence, safety, and relevant professional review. The CDC likewise describes milestone checklists as communication and monitoring tools that do not replace validated screening tools.<br />
          <a href="https://www.cdc.gov/act-early/milestones/key-points.html" target="_blank" rel="noreferrer" className="font-semibold text-sky-deep underline">CDC milestone checklist key points</a><br />
          <a href="https://www.cdc.gov/act-early/about/developmental-monitoring-and-screening.html" target="_blank" rel="noreferrer" className="font-semibold text-sky-deep underline">CDC developmental monitoring and screening</a>
        </LegalSection>
        <LegalSection title="ဆေးပညာဆိုင်ရာ အကူအညီ / Medical help">
          App ရလဒ်ကြောင့် ကျန်းမာရေးဝန်ထမ်းထံ သွားရောက်မှုကို မနှောင့်နှေးပါနှင့်။ ကလေးအတွက် စိုးရိမ်ပါက သို့မဟုတ် လက္ခဏာဆိုးရွားပါက အရည်အချင်းပြည့်မီသော ကျန်းမာရေးဝန်ထမ်းထံ ဆက်သွယ်ပါ။ အရေးပေါ်အခြေအနေတွင် ဒေသဆိုင်ရာ အရေးပေါ်ဝန်ဆောင်မှုကို အသုံးပြုပါ။<br />
          Do not delay professional care because of an app result. Contact a qualified health professional whenever you are concerned or symptoms worsen, and use local emergency services for an emergency.
        </LegalSection>
      </PublicLegalShell>
    );
  }

  if (kind === 'support') {
    return (
      <PublicLegalShell title="ACE Child Grow အကူအညီ" titleEn="ACE Child Grow Support">
        <LegalSection title="ဆက်သွယ်ရန် / Contact">
          App အသုံးပြုမှု၊ အကောင့်ဝင်မှု သို့မဟုတ် ကိုယ်ရေးလုံခြုံမှုဆိုင်ရာ အကူအညီအတွက် <a href={`mailto:${supportEmail}`} className="font-semibold text-sky-deep underline">{supportEmail}</a> သို့ ဆက်သွယ်ပါ။<br />
          For help with the app, sign-in, or privacy, email <a href={`mailto:${supportEmail}`} className="font-semibold text-sky-deep underline">{supportEmail}</a>.
        </LegalSection>
        <LegalSection title="အကောင့်ပြန်လည်ဝင်ရောက်ရန် / Account recovery">
          အကောင့်ဝင်စာမျက်နှာရှိ <strong>PIN/စကားဝှက် မေ့နေပါသလား?</strong> ကို ရွေးပြီး အီးမေးလ်သို့ပို့သော ခြောက်လုံးကုဒ်ကို ဖြည့်ပါ။<br />
          On the sign-in screen, choose <strong>Forgot PIN/password?</strong> and enter the six-digit code sent to your email.
        </LegalSection>
        <LegalSection title="အကောင့်နှင့် အချက်အလက် / Account and data">
          <Link to="/privacy" className="font-semibold text-sky-deep underline">ကိုယ်ရေးအချက်အလက် မူဝါဒ / Privacy Policy</Link><br />
          <Link to="/account-deletion" className="font-semibold text-sky-deep underline">အကောင့်ဖျက်နည်း / Account deletion</Link>
        </LegalSection>
        <LegalSection title="ကျန်းမာရေးအရေးပေါ်အခြေအနေ / Medical emergencies">
          ACE Child Grow သည် အရေးပေါ်ဝန်ဆောင်မှု မဟုတ်သလို ရောဂါရှာဖွေခြင်း မပြုပါ။ အရေးပေါ်အခြေအနေတွင် App support ကို မစောင့်ဘဲ ဒေသဆိုင်ရာ အရေးပေါ်ဝန်ဆောင်မှု သို့မဟုတ် ကျန်းမာရေးပညာရှင်ထံ ချက်ချင်းဆက်သွယ်ပါ။<br />
          ACE Child Grow is not an emergency service and does not diagnose. In an emergency, do not wait for app support; contact local emergency services or a qualified health professional immediately.
        </LegalSection>
        <Link to="/" className="inline-flex rounded-pill bg-sky-deep px-5 py-3 font-semibold text-white">ACE Child Grow</Link>
      </PublicLegalShell>
    );
  }

  if (kind === 'account-deletion') {
    return (
      <PublicLegalShell title="ACE Child Grow အကောင့် ဖျက်ရန်" titleEn="Delete your ACE Child Grow account">
        <p>အကောင့်ဝင်ပြီး <strong>ကိုယ်ပိုင်အကောင့် → ကိုယ်ရေးလုံခြုံမှု → အကောင့် ဖျက်ရန်</strong> ကို ရွေးပါ။ အတည်ပြုပြီးသည်နှင့် မိဘအကောင့်၊ ကလေးမှတ်တမ်း၊ ဖွံ့ဖြိုးမှုမှတ်တမ်း၊ အိပ်စက်မှုမှတ်တမ်း၊ အကြိုက်ဆုံးများနှင့် ငွေပေးချေမှုဆိုင်ရာ ကိုယ်ပိုင်မှတ်တမ်းများကို ဖျက်ပေးပါမည်။</p>
        <p>မိဘအကောင့်ကို ဆက်လက်ထားရှိပြီး ကလေးတစ်ဦး၏ အချက်အလက်များကိုသာ ဖျက်လိုပါက <strong>ကိုယ်ပိုင်အကောင့် → ကလေးများ</strong> သို့ ဝင်ပါ။ ဖျက်လိုသော ကလေးကို ရွေးပြီး <strong>ဤကလေးကို ဖျက်ရန်</strong> ကို နှိပ်ပါ။ အတည်ပြုပြီးသည်နှင့် ထိုကလေး၏ ကြီးထွားမှု၊ အိပ်စက်မှု၊ ဖွံ့ဖြိုးမှုနှင့် ဆက်စပ်မှတ်တမ်းများကို အပြီးတိုင် ဖျက်ပေးပါမည်။</p>
        <p>App ကို မဝင်နိုင်ပါက <a href={`mailto:${supportEmail}?subject=ACE%20Child%20Grow%20account%20deletion`} className="font-semibold text-sky-deep underline">{supportEmail}</a> သို့ အကောင့်သုံးထားသော အီးမေးလ်ဖြင့် ဖျက်ပေးရန် တောင်းဆိုနိုင်ပါသည်။ လုံခြုံရေးအတွက် အကောင့်ပိုင်ရှင်ဖြစ်ကြောင်း အတည်ပြုရန် ဆက်သွယ်နိုင်ပါသည်။</p>
        <p className="text-sm text-ink-soft">Review နှင့် ငွေစာရင်းကဲ့သို့ ဥပဒေ၊ လုံခြုံရေး သို့မဟုတ် စာရင်းစစ်အတွက် ထိန်းသိမ်းရန်လိုသော မှတ်တမ်းအနည်းငယ်ကို ကိုယ်ရေးအချက်အလက် လျှော့ချပြီး သတ်မှတ်ကာလအထိ ထိန်းသိမ်းနိုင်ပါသည်။</p>
        <section className="space-y-4 border-t border-line pt-6" lang="en">
          <h2 className="text-lg font-bold">Account deletion in English</h2>
          <p>Sign in and choose <strong>Profile → Privacy → Delete account</strong>. After you confirm, the app deletes the parent account and associated child profiles, growth, sleep, milestone, activity, health, vaccination, medicine, appointment, favourite, notification and account records.</p>
          <p>To delete one child while keeping the parent account, open <strong>Profile → Children</strong>, choose the child, and select <strong>Delete this child</strong>. The app deletes that child profile and the records associated with it.</p>
          <p>If you cannot sign in, email <a href={`mailto:${supportEmail}?subject=ACE%20Child%20Grow%20account%20deletion`} className="font-semibold text-sky-deep underline">{supportEmail}</a> from the address used for the account. We may need to verify account ownership before acting on an email request.</p>
          <p className="text-sm text-ink-soft">A minimal, de-identified record may be retained only when required for security, fraud prevention, legal compliance or an audit. Service-provider backup and security logs expire under their applicable retention schedules.</p>
        </section>
        <Link to="/" className="inline-flex rounded-pill bg-sky-deep px-5 py-3 font-semibold text-white">အကောင့်ဝင်ရန်</Link>
      </PublicLegalShell>
    );
  }

  return (
    <PublicLegalShell title="ကိုယ်ရေးအချက်အလက် မူဝါဒ" titleEn="Privacy Policy">
      <p className="text-sm text-ink-soft">နောက်ဆုံးပြင်ဆင်သည့်နေ့ — ၃၀ ဇူလိုင် ၂၀၂၆ · Last updated 30 July 2026</p>
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
      <section className="space-y-5 border-t border-line pt-6" lang="en">
        <h2 className="text-xl font-bold text-sky-deep">Privacy Policy in English</h2>
        <LegalSection title="Information we collect">
          We collect the account email address and user identifier; consent choices; a child nickname, birth date and optional gestational age; and records a parent chooses to enter, including milestones, activities, growth, sleep, health, vaccination, medicine, appointments, notes, favourites and product interactions needed to operate the app. We ask for a nickname rather than a full legal name.
        </LegalSection>
        <LegalSection title="How we collect and use information">
          Information is provided directly by the account holder or created when they use an app feature. We use it to authenticate the account, save and synchronize records, show age-appropriate guidance, personalize the experience, secure the service, answer support requests and comply with law. We do not sell personal information, serve behavioural advertising or track people across other companies’ apps and websites.
        </LegalSection>
        <LegalSection title="Service providers and disclosure">
          Convex provides authentication, application hosting, database and file storage. Resend delivers account-recovery email. Payment providers process a transaction only when a user chooses a payment feature on a supported non-iOS service; this first iOS release does not offer payment. Providers may process information only as needed to deliver their service, protect it and meet legal obligations. We may also disclose information when legally required or to protect users and the service.
        </LegalSection>
        <LegalSection title="Children’s and health information">
          The app is intended for adult parents and caregivers, not for children to use independently. Health and development records are used only for the parent-facing features described above. Educational content and rule-based observations are not a diagnosis, probability estimate, treatment recommendation or substitute for a qualified health professional.
        </LegalSection>
        <LegalSection title="Security, retention and international processing">
          Data is protected in transit with HTTPS and access is restricted by authenticated account and child ownership. Application records are kept while the account is active and are removed when the user deletes the account, except for minimal de-identified records required for security, fraud prevention, legal compliance or audit. Service-provider backup and security logs expire under their applicable retention schedules. Providers may process data outside Myanmar subject to their contractual and legal safeguards.
        </LegalSection>
        <LegalSection title="Your choices and rights">
          In Profile, users can export their account information, remove an individual child, or delete the entire account and associated personal data. Users who cannot sign in can request deletion from the account email address. Contact <a href={`mailto:${supportEmail}`} className="font-semibold text-sky-deep underline">{supportEmail}</a> to ask a privacy question, request access or correction, withdraw consent, or raise a complaint.
        </LegalSection>
      </section>
      <div className="flex flex-wrap gap-4">
        <Link to="/account-deletion" className="font-semibold text-sky-deep underline">အကောင့်ဖျက်နည်း / Account deletion</Link>
        <Link to="/support" className="font-semibold text-sky-deep underline">အကူအညီ / Support</Link>
      </div>
    </PublicLegalShell>
  );
}

function PublicLegalShell({ title, titleEn, children }: { title: string; titleEn: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-surface px-4 py-10 text-ink">
      <article className="mx-auto max-w-3xl rounded-card border border-line bg-white p-6 shadow-card sm:p-10">
        <Link to="/" className="text-sm font-semibold text-sky-deep">ACE Child Grow</Link>
        <h1 className="mt-4 text-2xl font-bold text-sky-deep">{title}</h1>
        <p className="mt-1 text-sm text-ink-soft">{titleEn}</p>
        <div className="mt-7 space-y-6 leading-7">{children}</div>
      </article>
    </main>
  );
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="mb-2 text-lg font-bold">{title}</h2><p>{children}</p></section>;
}
