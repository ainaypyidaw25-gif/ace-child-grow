import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';
import { ReviewBadge } from '../components/ReviewBadge';

type BL = { mm: string; en: string };

export function ContentDetail() {
  const { slug = '' } = useParams();
  const { locale } = useLocale();
  const res = useQuery(api.library.getBySlug, { slug });

  const T = (o?: BL) => (o ? (locale === 'mm' ? o.mm : o.en) : '');

  if (res === undefined) return <p className="text-ink-soft">…</p>;
  if (res === null) {
    return <p className="text-ink-soft">{locale === 'mm' ? 'မတွေ့ပါ။' : 'Not found.'}</p>;
  }
  if ('restricted' in res) {
    return (
      <div className="rounded-card border border-line bg-mint-soft/40 p-5 text-center">
        <div aria-hidden className="text-3xl">🔎</div>
        <p className="mt-2 font-medium text-ink">
          {locale === 'mm' ? 'ဤအကြောင်းအရာ ပြန်လည်သုံးသပ်ဆဲဖြစ်သည်။' : 'This content is still under review.'}
        </p>
        <Link to="/library" className="mt-3 inline-block text-sm text-sky-deep underline">
          {locale === 'mm' ? '← စာကြည့်တိုက်သို့' : '← Back to library'}
        </Link>
      </div>
    );
  }

  const { item, staff } = res;
  const d = (item.data ?? {}) as Record<string, unknown>;
  const list = (k: string): BL[] => (Array.isArray(d[k]) ? (d[k] as BL[]) : []);
  const bl = (k: string): BL | undefined => (d[k] && typeof d[k] === 'object' ? (d[k] as BL) : undefined);

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="rounded-card border border-line bg-white p-4 shadow-card">
      <h2 className="mb-2 font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
  const Bullets = ({ items }: { items: BL[] }) => (
    <ul className="ml-4 list-disc space-y-1 text-sm text-ink-soft">
      {items.map((x, i) => <li key={i}>{T(x)}</li>)}
    </ul>
  );
  const L = (mm: string, en: string) => (locale === 'mm' ? mm : en);

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between gap-2">
          <Link to="/library" className="text-sm text-sky-deep underline">
            {L('← စာကြည့်တိုက်', '← Library')}
          </Link>
          {staff && <ReviewBadge published={item.clinicalStatus === 'published'} />}
        </div>
        <h1 className="mt-1 text-xl font-bold text-sky-deep">{locale === 'mm' ? item.titleMm : item.titleEn}</h1>
        {(item.summaryMm || item.summaryEn) && (
          <p className="mt-1 text-ink-soft">{locale === 'mm' ? item.summaryMm : item.summaryEn}</p>
        )}
      </div>

      {/* Milestone */}
      {item.type === 'milestone' && (
        <>
          <Section title={L('ဘာကို ကြည့်ရမလဲ', 'What to observe')}>
            <p className="text-sm text-ink-soft">{T(bl('observeMm') ?? { mm: String(d.observeMm ?? ''), en: String(d.observeEn ?? '') })}</p>
          </Section>
          <Section title={L('ဘာကြောင့် အရေးကြီးလဲ', 'Why it matters')}>
            <p className="text-sm text-ink-soft">{L(String(d.whyMm ?? ''), String(d.whyEn ?? ''))}</p>
          </Section>
          {(d.redMm || d.redEn) && (
            <Section title={L('သတိပြုစရာ', 'Worth watching')}>
              <p className="text-sm text-state-orange">{L(String(d.redMm ?? ''), String(d.redEn ?? ''))}</p>
            </Section>
          )}
        </>
      )}

      {/* Guide */}
      {item.type === 'guide' && (
        <>
          {list('observationQuestions').length > 0 && (
            <Section title={L('စောင့်ကြည့်ရန် မေးခွန်းများ', 'Observation questions')}><Bullets items={list('observationQuestions')} /></Section>
          )}
          {list('dailyActivities').length > 0 && (
            <Section title={L('နေ့စဉ် လှုပ်ရှားမှုများ', 'Daily activities')}><Bullets items={list('dailyActivities')} /></Section>
          )}
          {list('indoor').length > 0 && (
            <Section title={L('အိမ်တွင်း', 'Indoor')}><Bullets items={list('indoor')} /></Section>
          )}
          {list('outdoor').length > 0 && (
            <Section title={L('အိမ်ပြင်', 'Outdoor')}><Bullets items={list('outdoor')} /></Section>
          )}
          {list('lowCost').length > 0 && (
            <Section title={L('ကုန်ကျစရိတ်နည်း', 'Low-cost ideas')}><Bullets items={list('lowCost')} /></Section>
          )}
          {bl('materials') && <Section title={L('ပစ္စည်းများ', 'Materials')}><p className="text-sm text-ink-soft">{T(bl('materials'))}</p></Section>}
          {bl('safety') && <Section title={L('ဘေးကင်းရေး', 'Safety')}><p className="text-sm text-ink-soft">{T(bl('safety'))}</p></Section>}
          {list('commonMistakes').length > 0 && (
            <Section title={L('ရှောင်ရှားသင့်သည့် အမှားများ', 'Common mistakes')}><Bullets items={list('commonMistakes')} /></Section>
          )}
          {list('parentTips').length > 0 && (
            <Section title={L('မိဘ အကြံပြုချက်', 'Parent tips')}><Bullets items={list('parentTips')} /></Section>
          )}
          {list('redFlags').length > 0 && (
            <Section title={L('ကျွမ်းကျင်သူနှင့် တိုင်ပင်သင့်သည့် လက္ခဏာ', 'When to seek advice')}>
              <ul className="ml-4 list-disc space-y-1 text-sm text-state-orange">
                {list('redFlags').map((x, i) => <li key={i}>{T(x)}</li>)}
              </ul>
            </Section>
          )}
          {bl('referral') && <Section title={L('မည်သည့်အချိန်တွင် တိုင်ပင်မလဲ', 'Referral guidance')}><p className="text-sm text-ink-soft">{T(bl('referral'))}</p></Section>}
          {bl('encouragement') && (
            <div className="rounded-card bg-mint-soft p-4 text-sm text-ink">{T(bl('encouragement'))}</div>
          )}
        </>
      )}

      {/* Activity */}
      {item.type === 'activity' && (
        <>
          <div className="flex flex-wrap gap-2 text-xs">
            {item.difficulty && <span className="rounded-pill bg-lavender/50 px-3 py-0.5">{item.difficulty}</span>}
            {typeof item.durationMinutes === 'number' && <span className="rounded-pill bg-lavender/50 px-3 py-0.5">⏱ {item.durationMinutes} {L('မိနစ်', 'min')}</span>}
            {d.indoor === true && <span className="rounded-pill bg-lavender/50 px-3 py-0.5">{L('အိမ်တွင်း', 'Indoor')}</span>}
            {d.outdoor === true && <span className="rounded-pill bg-lavender/50 px-3 py-0.5">{L('အိမ်ပြင်', 'Outdoor')}</span>}
            {d.lowCost === true && <span className="rounded-pill bg-lavender/50 px-3 py-0.5">{L('ကုန်ကျနည်း', 'Low-cost')}</span>}
          </div>
          {bl('materials') && <Section title={L('ပစ္စည်းများ', 'Materials')}><p className="text-sm text-ink-soft">{T(bl('materials'))}</p></Section>}
          {bl('setup') && <Section title={L('ပြင်ဆင်ခြင်း', 'Setup')}><p className="text-sm text-ink-soft">{T(bl('setup'))}</p></Section>}
          {list('instructions').length > 0 && (
            <Section title={L('လုပ်နည်း', 'Instructions')}>
              <ol className="ml-4 list-decimal space-y-1 text-sm text-ink-soft">
                {list('instructions').map((x, i) => <li key={i}>{T(x)}</li>)}
              </ol>
            </Section>
          )}
          {bl('safety') && <Section title={L('ဘေးကင်းရေး', 'Safety')}><p className="text-sm text-ink-soft">{T(bl('safety'))}</p></Section>}
          {list('outcomes').length > 0 && <Section title={L('လေ့ကျင့်ပေးနိုင်သည့် စွမ်းရည်များ', 'Development outcomes')}><Bullets items={list('outcomes')} /></Section>}
          {list('variations').length > 0 && <Section title={L('အခြားနည်းဖြင့် လုပ်နိုင်ပုံများ', 'Variations')}><Bullets items={list('variations')} /></Section>}
        </>
      )}

      {/* Lesson */}
      {item.type === 'lesson' && (
        <>
          {list('objectives').length > 0 && <Section title={L('ဒီသင်ခန်းစာမှ သိရှိနိုင်မည့်အချက်', 'Learning objectives')}><Bullets items={list('objectives')} /></Section>}
          {bl('body') && <Section title={L('သင်ခန်းစာ', 'Lesson')}><p className="whitespace-pre-line text-sm text-ink-soft">{T(bl('body'))}</p></Section>}
          {bl('takeaway') && <div className="rounded-card bg-mint-soft p-4 text-sm text-ink">💡 {T(bl('takeaway'))}</div>}
          {bl('actionToday') && <Section title={L('ယနေ့ စမ်းလုပ်ကြည့်ရန်', 'Action today')}><p className="text-sm text-ink-soft">{T(bl('actionToday'))}</p></Section>}
        </>
      )}

      {/* Special need */}
      {item.type === 'special_need' && (
        <>
          <div className="rounded-card bg-lavender/30 p-3 text-xs text-ink-soft">
            {L('ဤအက်ပ်သည် ရောဂါ မဖော်ထုတ်ပါ။ စိုးရိမ်ပါက ကျွမ်းကျင်ပညာရှင်နှင့် တိုင်ပင်ပါ။',
               'This app does not diagnose. If concerned, consult a professional.')}
          </div>
          {list('strengths').length > 0 && <Section title={L('အားသာချက်များ', 'Strengths')}><Bullets items={list('strengths')} /></Section>}
          {list('possibleSigns').length > 0 && <Section title={L('သတိပြုမိနိုင်သည့် အချက်များ (ရောဂါသတ်မှတ်ချက် မဟုတ်ပါ)', 'Possible signs (not a diagnosis)')}><Bullets items={list('possibleSigns')} /></Section>}
          {Array.isArray(d.myths) && (d.myths as { myth: BL; fact: BL }[]).length > 0 && (
            <Section title={L('အယူအဆမှားနှင့် အမှန်', 'Myths vs Facts')}>
              <ul className="space-y-2 text-sm">
                {(d.myths as { myth: BL; fact: BL }[]).map((m, i) => (
                  <li key={i} className="rounded-lg bg-canvas p-2">
                    <p className="text-state-orange">✗ {T(m.myth)}</p>
                    <p className="text-ink">✓ {T(m.fact)}</p>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {list('homeSupport').length > 0 && <Section title={L('အိမ်တွင် ပံ့ပိုးခြင်း', 'Home support')}><Bullets items={list('homeSupport')} /></Section>}
          {list('schoolSupport').length > 0 && <Section title={L('ကျောင်း ပံ့ပိုးခြင်း', 'School support')}><Bullets items={list('schoolSupport')} /></Section>}
          {list('professionalSupport').length > 0 && <Section title={L('ကျွမ်းကျင်သူ ပံ့ပိုးခြင်း', 'Professional support')}><Bullets items={list('professionalSupport')} /></Section>}
          {list('activities').length > 0 && <Section title={L('လှုပ်ရှားမှုများ', 'Activities')}><Bullets items={list('activities')} /></Section>}
          {Array.isArray(d.faq) && (d.faq as { q: BL; a: BL }[]).length > 0 && (
            <Section title={L('မေးလေ့ရှိသော မေးခွန်းများ', 'FAQ')}>
              <ul className="space-y-2 text-sm">
                {(d.faq as { q: BL; a: BL }[]).map((f, i) => (
                  <li key={i}><p className="font-medium text-ink">{T(f.q)}</p><p className="text-ink-soft">{T(f.a)}</p></li>
                ))}
              </ul>
            </Section>
          )}
        </>
      )}

      {/* Story */}
      {item.type === 'story' && (
        <>
          {bl('body') && <Section title={L('ပုံပြင်', 'Story')}><p className="whitespace-pre-line text-sm text-ink-soft">{T(bl('body'))}</p></Section>}
          {list('vocabulary').length > 0 && <Section title={L('ဝေါဟာရ', 'Vocabulary')}><Bullets items={list('vocabulary')} /></Section>}
          {list('questions').length > 0 && <Section title={L('မေးခွန်းများ', 'Questions')}><Bullets items={list('questions')} /></Section>}
          {list('activities').length > 0 && <Section title={L('လှုပ်ရှားမှုများ', 'Activities')}><Bullets items={list('activities')} /></Section>}
        </>
      )}

      {/* Printable */}
      {item.type === 'printable' && (
        <Section title={L('ပုံနှိပ်အသုံးပြုနိုင်သော စာရွက်', 'Printable resource')}>
          <p className="text-sm text-ink-soft">{locale === 'mm' ? item.summaryMm : item.summaryEn}</p>
          <p className="mt-2 text-xs text-ink-soft">
            {L('ပုံနှိပ်အသုံးပြုနိုင်သော ဖိုင်ကို အကြောင်းအရာစီမံခန့်ခွဲရေးစနစ်မှတစ်ဆင့် ပြင်ဆင်တင်ပါမည်။', 'The printable PDF is prepared via the CMS.')}
          </p>
        </Section>
      )}

      <p className="rounded-lg bg-pastel-yellow/50 px-3 py-2 text-[11px] leading-relaxed text-ink-soft">
        {locale === 'mm'
          ? item.reviewScope === 'education'
            ? 'သုံးသပ်မှုမှတ်တမ်း — ဤအကြောင်းအရာကို ပညာရေးနှင့် အထူးပညာရေးဆိုင်ရာ ပညာရှင်က သုံးသပ်အတည်ပြုထားပါသည်။ ဆေးဘက်ဆိုင်ရာ အကြောင်းအရာများသည် ယုံကြည်ရသော ကိုးကားချက်များအပေါ် အခြေခံထားသည့် အထွေထွေ လမ်းညွှန်သာဖြစ်ပြီး ဆေးဘက်ဆိုင်ရာ အတည်ပြုချက် သို့မဟုတ် ဆရာဝန်၏ အကြံဉာဏ် မဟုတ်ပါ။ စိုးရိမ်စရာရှိပါက သက်ဆိုင်ရာ ကျန်းမာရေးပညာရှင်နှင့် တိုင်ပင်ပါ။'
            : 'မှတ်ချက် — ဤအကြောင်းအရာသည် ယုံကြည်ရသော ကိုးကားချက်များအပေါ် အခြေခံထားသည့် အထွေထွေ မိဘလမ်းညွှန် ဖြစ်ပါသည်။ ဆေးဘက်ဆိုင်ရာ အကြံဉာဏ်အဖြစ် မယူဆသင့်ပါ။'
          : item.reviewScope === 'education'
            ? 'Review record: approved by an education and special-education professional. Medical information is general evidence-based guidance, not clinical approval or medical advice. Consult an appropriate health professional if concerned.'
            : `General evidence-based parent guidance, not medical advice. Source: ${item.source}`}
      </p>
    </div>
  );
}
