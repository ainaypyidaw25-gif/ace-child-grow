import { useEffect, useRef, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
// Imported from the real packages so `tsc` checks these against the real
// types; `vite.harness.config.ts` swaps them for the in-memory stand-in when
// it builds this bundle.
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { LocaleProvider } from '../../src/app/LocaleContext';
import { AppStateProvider } from '../../src/app/AppState';
import { App } from '../../src/app/App';
import { convex } from '../../src/lib/convexClient';

/**
 * Scripted, silent-video walkthrough of the app AS A PARENT USES IT.
 *
 * The screen below the caption bar is the real application: real routes, real
 * screens, real Myanmar copy, the real milestone result engine, and the real
 * published library. Only the backend is faked (see offlineConvex.tsx), so a
 * parent watching this sees the buttons they will actually press.
 *
 * Everything that is NOT the app lives in this file and is confined to two
 * bars at the top: a permanent demo banner and the current caption. They are
 * pinned, opaque and always on top, so no frame of this video can be lifted
 * and passed off as a real family's account.
 *
 * Playwright drives it (tests/e2e/parent-guide.video.spec.ts) and records the
 * screen. Holding each step long enough to read is the spec's job.
 */

export interface ParentStep {
  id: string;
  captionMm: string;
  captionEn: string;
}

/**
 * Captions name buttons EXACTLY as the app labels them — «ဖွံ့ဖြိုးမှု», not a
 * nicer paraphrase. A how-to that renames the buttons is a how-to a parent
 * cannot follow.
 */
export const PARENT_STEPS: ParentStep[] = [
  {
    id: 'signup',
    captionMm: '၁။ ပထမဆုံး အကောင့်ဖွင့်ပါ။ “အကောင့်မရှိသေးပါက အသစ်ဖွင့်ရန်” ကို နှိပ်ပြီး အီးမေးလ်နှင့် ဂဏန်း ၆ လုံး PIN ထည့်ပါ။',
    captionEn: '1. Start by creating an account. Tap “create an account”, then enter an email and a six-digit PIN.',
  },
  {
    id: 'welcome',
    captionMm: '၂။ ဝင်ပြီးလျှင် “ဒီနေ့အစီအစဉ် စတင်မယ်” ကို နှိပ်ပါ။',
    captionEn: '2. Once you are in, tap “Start today’s plan”.',
  },
  {
    id: 'consent',
    captionMm: '၃။ သဘောတူညီချက်ကို ဖတ်ပြီး အတည်ပြုပါ။ ဤအက်ပ်သည် ရောဂါ ရှာဖွေပေးသည် မဟုတ်ပါ — ဆရာဝန်နှင့် ပြောဆိုရာတွင် အထောက်အကူ ဖြစ်စေရန်သာ ဖြစ်သည်။',
    captionEn: '3. Read and confirm the consent. The app does not diagnose — it helps you talk to a doctor.',
  },
  {
    id: 'addchild',
    captionMm: '၄။ ကလေး၏ အမည်နှင့် မွေးနေ့ကို ထည့်ပါ။ မွေးနေ့သည် အရေးအကြီးဆုံး — အက်ပ်ထဲက အကြောင်းအရာ အားလုံးကို အသက်အလိုက် ရွေးပေးပါသည်။',
    captionEn: '4. Enter your child’s name and date of birth. The birth date matters most — everything in the app is chosen by age from it.',
  },
  {
    id: 'home',
    captionMm: '၅။ ပင်မစာမျက်နှာတွင် ကလေး၏ အသက်နှင့် ဒီနေ့လုပ်စရာ သုံးခု ပေါ်နေပါသည်။ အောက်ဆုံးက ခလုတ်တန်းဖြင့် အပိုင်းတိုင်းသို့ သွားနိုင်သည်။',
    captionEn: '5. The home screen shows your child’s age and three things to do today. The bottom bar reaches every section.',
  },
  {
    id: 'journey-open',
    captionMm: '၆။ အောက်က “ဖွံ့ဖြိုးမှု” ကို နှိပ်ပါ။ အသက်အလိုက် မှတ်တိုင် မေးခွန်းများ ပေါ်လာပါမည်။',
    captionEn: '6. Tap “Development” in the bottom bar. Age-based milestone questions appear.',
  },
  {
    id: 'journey-answer',
    captionMm: '၇။ မှန်ရာကို ဖြေပါ။ မလုပ်နိုင်သေးလျှင် “မလုပ်နိုင်သေး” ကို ရွေးပါ။ မှန်အောင် ဖြေမှသာ ရလဒ်က အသုံးဝင်ပါမည်။',
    captionEn: '7. Answer honestly. If it is not there yet, choose “Not yet”. The result is only useful if the answers are true.',
  },
  {
    id: 'journey-result',
    captionMm: '၈။ မေးခွန်းများ ဖြေပြီးလျှင် ရလဒ် ပေါ်လာပါမည်။ ၎င်းသည် ရောဂါအဖြေ မဟုတ်ပါ — ဆက်လက် လုပ်သင့်သည်ကို ညွှန်ပြခြင်းသာ ဖြစ်သည်။',
    captionEn: '8. After the questions, a result appears. It is not a diagnosis — it points to what to do next.',
  },
  {
    id: 'learn',
    captionMm: '၉။ အောက်က “ဗဟုသုတ” တွင် မိဘလမ်းညွှန်၊ သင်ခန်းစာနှင့် ပုံပြင်များ ရှိသည်။ အပေါ်က ခလုတ်များဖြင့် အမျိုးအစားအလိုက် ရွေးကြည့်ပါ။',
    captionEn: '9. “Knowledge” in the bottom bar holds parent guides, lessons and stories. The buttons at the top filter by type.',
  },
  {
    id: 'detail',
    captionMm: '၁၀။ လမ်းညွှန်တစ်ခုကို ဖွင့်ပါ။ အောက်ဘက်ရှိ “ကျွမ်းကျင်သူနှင့် တိုင်ပင်သင့်သည့် လက္ခဏာ” အပိုင်းကို မဖြစ်မနေ ဖတ်ပါ။',
    captionEn: '10. Open a guide. Do not skip the “When to seek advice” section near the bottom.',
  },
  {
    id: 'activities',
    captionMm: '၁၁။ “လှုပ်ရှားမှုများ” တွင် အသက်အလိုက် ကစားနည်းများ ရှိသည်။ အခြေခံလှုပ်ရှားမှုများကို အခမဲ့ အသုံးပြုနိုင်ပါသည်။',
    captionEn: '11. “Activities” has age-based play ideas. The basic activities are free to use.',
  },
  {
    id: 'growth',
    captionMm: '၁၂။ “ကလေး၏ ကြီးထွားမှုမှတ်တမ်း” တွင် အလေးချိန်နှင့် အရပ်ကို လစဉ် မှတ်ပါ။ ဆေးခန်းသွားချိန်တွင် ပြရန် အသုံးဝင်သည်။',
    captionEn: '12. In the growth record, log weight and height each month. It is what you show at a clinic visit.',
  },
  {
    id: 'language',
    captionMm: '၁၃။ အပေါ်ညာဘက်ရှိ ခလုတ်ဖြင့် မြန်မာ/English ပြောင်းနိုင်သည်။ အက်ပ်တစ်ခုလုံး ချက်ချင်း ပြောင်းသွားပါမည်။',
    captionEn: '13. The button at the top right switches Myanmar and English. The whole app changes at once.',
  },
  {
    id: 'closing',
    captionMm: '၁၄။ အရေးကြီးဆုံး — စိုးရိမ်စရာ တွေ့လျှင် အက်ပ်ကို မစောင့်ဘဲ ဆရာဝန် သို့မဟုတ် ကျန်းမာရေးဝန်ထမ်းထံ ချက်ချင်း ပြပါ။',
    captionEn: '14. Most important — if something worries you, do not wait for the app. See a doctor or health worker.',
  },
];

const BANNER_MM = 'နမူနာ ပြသချက် — ဤကလေးအချက်အလက်များမှာ အတုဖြစ်ပြီး မည်သည့် အကောင့်တွင်မှ သိမ်းမထားပါ။';
const BANNER_EN = 'Training demo — the child shown here is invented and is saved to no account.';

export function ParentGuideDemo() {
  const [index, setIndex] = useState(0);
  const [barsHeight, setBarsHeight] = useState(0);
  const barsRef = useRef<HTMLDivElement>(null);
  const step = PARENT_STEPS[index];

  // The caption wraps to a different number of lines on each step, so the two
  // bars are measured rather than assumed. Getting this wrong by a few pixels
  // would hide the app's own sticky header behind the caption for one step and
  // leave a gap on the next.
  useEffect(() => {
    const el = barsRef.current;
    if (!el) return;
    const measure = () => setBarsHeight(el.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The recording sets the pace; keep the harness keyboard-drivable too so a
  // person can walk it manually without Playwright.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, PARENT_STEPS.length - 1));
      if (event.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FBFAF5' }}>
      <div ref={barsRef} style={S.bars}>
        <div data-testid="demo-banner" style={S.banner}>
          <p style={S.bannerMm}>{BANNER_MM}</p>
          <p style={S.bannerEn}>{BANNER_EN}</p>
        </div>
        <div data-testid="caption" style={S.caption}>
          <p style={S.captionMm}>{step.captionMm}</p>
          <p style={S.captionEn}>{step.captionEn}</p>
        </div>
      </div>

      {/* The app gets its own scroll container below the bars. It must be a
          scroll context of its own, not just padding: the app's header is
          `sticky top-0`, and against the page it would stick underneath the
          caption bar and disappear. Against this box it sticks where a phone
          user would see it. */}
      <div data-testid="stage" style={{ ...S.stage, top: barsHeight }}>
        <ConvexAuthProvider client={convex}>
          <BrowserRouter>
            <LocaleProvider>
              <AppStateProvider>
                <App />
              </AppStateProvider>
            </LocaleProvider>
          </BrowserRouter>
        </ConvexAuthProvider>
      </div>

      <button
        type="button"
        data-testid="next-step"
        onClick={() => setIndex((i) => Math.min(i + 1, PARENT_STEPS.length - 1))}
        style={S.next}
      >
        next
      </button>
    </div>
  );
}

/**
 * Every rule for the demo chrome is an inline style, not a Tailwind class.
 *
 * `tailwind.config.ts` scans `./src/**` and `./index.html` only — nothing under
 * tests/. A class used just here would produce no CSS at all and fail silently:
 * the banner would render as unstyled text over the app instead of an opaque
 * warning bar, and a bounding-box assertion would still pass. Inline styles
 * cannot be tree-shaken away, so what is written here is what is on screen.
 *
 * The line heights are deliberately loose. Myanmar stacks marks above and below
 * the baseline, and a tight leading clips the tops of the tall ones — the text
 * stays readable enough that the defect is easy to miss on a first look.
 */
const S: Record<string, React.CSSProperties> = {
  bars: { position: 'fixed', insetInline: 0, top: 0, zIndex: 70 },
  banner: {
    backgroundColor: '#9F1239',
    color: '#FFFFFF',
    padding: '14px 16px 10px',
    textAlign: 'center',
  },
  bannerMm: { fontSize: 13, fontWeight: 600, lineHeight: 1.9 },
  bannerEn: { fontSize: 12, lineHeight: 1.5, opacity: 0.9 },
  caption: { backgroundColor: '#0F172A', color: '#FFFFFF', padding: '12px 16px' },
  captionMm: { fontSize: 15, fontWeight: 600, lineHeight: 2 },
  captionEn: { fontSize: 13, lineHeight: 1.5, opacity: 0.82, marginTop: 4 },
  stage: {
    position: 'fixed',
    insetInline: 0,
    bottom: 0,
    overflowY: 'auto',
    backgroundColor: '#FBFAF5',
  },
  next: {
    position: 'fixed',
    right: 6,
    bottom: 6,
    zIndex: 71,
    fontSize: 10,
    padding: '2px 6px',
    opacity: 0.15,
  },
};
