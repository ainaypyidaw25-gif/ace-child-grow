import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(import.meta.dirname, '..')
const socialDir = path.join(root, 'public/social/ace-child-grow')
const outputDir = path.join(socialDir, 'posts/monthly-calendar-v1')
const manifestFile = path.join(socialDir, 'manifest.json')
const calendarFile = path.join(socialDir, 'content-calendar.json')
const galleryFile = path.join(socialDir, 'calendar.html')
const launchDir = path.join(socialDir, 'posts/continuous-launch-v1')

const palette = {
  cream: '#FFF8EA',
  teal: '#245B57',
  tealDark: '#183C3A',
  sage: '#A8C9B9',
  mint: '#DFEFE7',
  ink: '#243238',
  gold: '#F3C866',
  sky: '#9BD2E8',
  coral: '#E99079',
  white: '#FFFFFF',
}

const posts = [
  {
    id: 'ACE-CAL-07', scheduledAt: '2026-08-12T13:30:00.000Z', category: 'app_feature', objective: 'feature discovery', icon: 'bookmark', accent: palette.sky,
    eyebrow: 'ကြိုက်နှစ်သက်ရာ', title: ['ပြန်ကြည့်ချင်တာကို', 'သိမ်းထားမယ်'], body: ['အသုံးဝင်တဲ့ အစီအစဉ်တွေကို', 'Favorites ထဲမှာ ပြန်ရှာလို့ရတယ်'],
    captionMyanmar: 'ဖတ်ပြီးတာနဲ့ ပျောက်သွားမှာစိုးရိမ်စရာ မလိုပါဘူး 💛\n\nACE Child Grow မှာ ပြန်ကြည့်ချင်တဲ့ လှုပ်ရှားမှုနဲ့ လေ့လာစရာတွေကို Favorites ထဲ သိမ်းထားနိုင်ပါတယ်။\n\nကလေးနဲ့ လုပ်ကြည့်ဖို့ အချိန်ရတဲ့အခါ အလွယ်တကူ ပြန်ဖွင့်ကြည့်ရုံပါပဲ။\n\n#ACEChildGrow #မိဘနဲ့ကလေး #Favorites',
  },
  {
    id: 'ACE-CAL-08', scheduledAt: '2026-08-15T03:30:00.000Z', category: 'engagement', objective: 'weekend activity', icon: 'star', accent: palette.gold,
    eyebrow: 'စနေမနက် အတူကစားမယ်', title: ['အိမ်မှာရှိတာနဲ့', 'ကစားလို့ရတယ်'], body: ['အထူးပစ္စည်း မလိုပါဘူး', 'အတူရှိပေးတဲ့အချိန်က အရေးကြီးတယ်'],
    captionMyanmar: 'ကလေးနဲ့ ကစားဖို့ ပစ္စည်းအများကြီး မလိုပါဘူးနော် 🌟\n\nအိမ်မှာရှိတဲ့ ခွက်၊ ဇွန်း၊ စက္ကူ ဒါမှမဟုတ် ပျော့ပျောင်းတဲ့အဝတ်လေးတွေကို အသက်အရွယ်နဲ့ ကိုက်ညီအောင် အသုံးပြုလို့ရပါတယ်။\n\nအရေးကြီးတာက မိဘက ဘေးမှာရှိပြီး အတူကြည့်၊ အတုပြ၊ စကားပြောပေးဖို့ပါ။\n\nဒီနေ့ ဘာနဲ့အတူကစားဖြစ်လဲ comment မှာ မျှဝေပေးပါနော်။\n\n#ACEChildGrow #အိမ်မှာအတူကစားမယ်',
  },
  {
    id: 'ACE-CAL-09', scheduledAt: '2026-08-17T13:30:00.000Z', category: 'parent_support', objective: 'habit building', icon: 'chart', accent: palette.sage, source: 'ACE-AUTO-02.png',
    eyebrow: 'တစ်ပတ်တာ ပြန်ကြည့်မယ်', title: ['ပြောင်းလဲမှုလေးတွေကို', 'သတိထားမယ်'], body: ['နေ့တိုင်းမှတ်ထားတဲ့ အချက်လေးတွေက', 'အချိန်ကြာရင် ပုံပြင်တစ်ပုဒ်ဖြစ်လာတယ်'],
    captionMyanmar: 'ကလေးရဲ့ ပြောင်းလဲမှုက နေ့တိုင်းနည်းနည်းစီ ဖြစ်လာတာပါ 🌱\n\nတစ်ပတ်ပြီးတိုင်း “ဒီအပတ် ဘာအသစ်လုပ်တတ်လာလဲ၊ ဘာကိုပိုစိတ်ဝင်စားလာလဲ” ဆိုတာ ခဏပြန်စဉ်းစားကြည့်ပါ။\n\nACE Child Grow ထဲမှာ နေ့စဉ်အချက်လေးတွေကို သတိထားရင်း မိဘကိုယ်တိုင်လည်း ကလေးကို ပိုနားလည်လာနိုင်ပါတယ်။\n\n#ACEChildGrow #ကလေးဖွံ့ဖြိုးမှု #တစ်ပတ်တာမှတ်တမ်း',
  },
  {
    id: 'ACE-CAL-10', scheduledAt: '2026-08-19T13:30:00.000Z', category: 'app_feature', objective: 'content discovery', icon: 'book', accent: palette.coral, source: 'ACE-AUTO-03.png',
    eyebrow: 'သိချင်တာ ရှာဖတ်မယ်', title: ['မေးခွန်းရှိတဲ့အခါ', 'ဘယ်မှာရှာမလဲ?'], body: ['လေ့လာရန်ကဏ္ဍမှာ', 'ခေါင်းစဉ်အလိုက် ဖတ်ရှုနိုင်တယ်'],
    captionMyanmar: 'ကလေးပြုစုရင်း မေးခွန်းအသစ်တွေ နေ့တိုင်းပေါ်လာတတ်ပါတယ်နော် 📚\n\nACE Child Grow ရဲ့ လေ့လာရန်ကဏ္ဍမှာ အကြောင်းအရာတွေကို ခေါင်းစဉ်အလိုက် ရှာဖတ်နိုင်ပါတယ်။\n\nအားတဲ့အချိန် ဖတ်ထားမယ်၊ လိုအပ်တဲ့အခါ ပြန်ကြည့်မယ်—မိဘအတွက် အဆင်ပြေတဲ့ လေ့လာစရာနေရာလေးပါ။\n\n#ACEChildGrow #မိဘများအတွက် #လေ့လာရန်',
  },
  {
    id: 'ACE-CAL-11', scheduledAt: '2026-08-22T03:30:00.000Z', category: 'education', objective: 'healthy expectations', icon: 'heart', accent: palette.sky,
    eyebrow: 'ကလေးတိုင်း မတူကြပါဘူး', title: ['ဖွံ့ဖြိုးမှုက', 'ပြိုင်ပွဲမဟုတ်ပါဘူး'], body: ['ကိုယ့်ကလေးရဲ့ အရှိန်နဲ့', 'သေးငယ်တဲ့တိုးတက်မှုကို သတိထားပေးပါ'],
    captionMyanmar: 'ကလေးတိုင်းရဲ့ သင်ယူပုံနဲ့ ဖွံ့ဖြိုးလာပုံက မတူနိုင်ပါတယ် 💛\n\nတခြားကလေးနဲ့ နှိုင်းယှဉ်တာထက် ကိုယ့်ကလေးရဲ့ မနေ့ကနဲ့ ဒီနေ့ကို ပြန်ကြည့်ပေးပါ။ သေးငယ်တဲ့ တိုးတက်မှုလေးတွေကို အသိအမှတ်ပြုပေးတာက အရေးကြီးပါတယ်။\n\nစိုးရိမ်စရာတစ်ခုရှိရင်တော့ သင့်တော်တဲ့ ကျန်းမာရေးပညာရှင်နဲ့ တိုင်ပင်ပါ။\n\n#ACEChildGrow #ကလေးဖွံ့ဖြိုးမှု #မိဘအားပေးမှု',
  },
  {
    id: 'ACE-CAL-12', scheduledAt: '2026-08-24T13:30:00.000Z', category: 'app_tutorial', objective: 'product education', icon: 'phone', accent: palette.gold, source: 'ACE-AUTO-04.png',
    eyebrow: 'App ကို စသုံးမယ်', title: ['ဒီနေ့အစီအစဉ်ကို', '၃ ချက်နဲ့ကြည့်မယ်'], body: ['အသက်အရွယ်ရွေး → အစီအစဉ်ကြည့်', 'ကြိုက်တာကို သိမ်းထား'],
    captionMyanmar: 'ACE Child Grow ကို စသုံးဖို့ မခက်ပါဘူး 📱\n\n၁။ ကလေးရဲ့ အသက်အရွယ်နဲ့ကိုက်တဲ့ အကြောင်းအရာကိုရွေးပါ။\n၂။ ဒီနေ့အတွက် လှုပ်ရှားမှုနဲ့ လိုအပ်တာတွေကိုဖတ်ပါ။\n၃။ နောက်မှပြန်ကြည့်ချင်တာကို Favorites ထဲ သိမ်းထားပါ။\n\nမိဘတို့ရဲ့ နေ့စဉ်အချိန်နဲ့ကိုက်အောင် အဆင်ပြေသလို အသုံးပြုနိုင်ပါတယ်။\n\n#ACEChildGrow #Appအသုံးပြုနည်း',
  },
  {
    id: 'ACE-CAL-13', scheduledAt: '2026-08-26T13:30:00.000Z', category: 'parent_support', objective: 'caregiver wellbeing', icon: 'cup', accent: palette.sage,
    eyebrow: 'မိဘလည်း နားဖို့လိုတယ်', title: ['၅ မိနစ်လောက်', 'ကိုယ့်အတွက်ထားမယ်'], body: ['ရေသောက်၊ အသက်ရှူ၊ ခဏနား', 'အားပြန်ဖြည့်တာလည်း ဂရုစိုက်ခြင်းပါ'],
    captionMyanmar: 'ကလေးကို ဂရုစိုက်နေတဲ့ မိဘကိုလည်း ဂရုစိုက်ဖို့လိုပါတယ် 💛\n\nရေတစ်ခွက်သောက်ပါ။ ပခုံးကိုလျှော့ပြီး အသက်ပြင်းပြင်း သုံးခါရှူပါ။ ဖြစ်နိုင်ရင် ၅ မိနစ်လောက် ခဏနားပါ။\n\nအရာအားလုံးကို တစ်ယောက်တည်း အပြီးလုပ်စရာမလိုပါဘူး။ လိုအပ်ရင် အနားကလူကို အကူအညီတောင်းလို့ရပါတယ်။\n\n#ACEChildGrow #မိဘနားချိန်',
  },
  {
    id: 'ACE-CAL-14', scheduledAt: '2026-08-29T03:30:00.000Z', category: 'engagement', objective: 'audience research', icon: 'chat', accent: palette.coral,
    eyebrow: 'မိဘတို့အသံ', title: ['App ထဲမှာ ဘာကို', 'အများဆုံးသုံးဖြစ်လဲ?'], body: ['နေ့စဉ်လှုပ်ရှားမှု • လေ့လာရန်', 'မှတ်တမ်း • Favorites'],
    captionMyanmar: 'ACE Child Grow ထဲမှာ ဘယ်ကဏ္ဍကို အများဆုံးသုံးဖြစ်လဲ? 👇\n\n၁️⃣ နေ့စဉ်လှုပ်ရှားမှု\n၂️⃣ လေ့လာရန်\n၃️⃣ ဖွံ့ဖြိုးမှုမှတ်တမ်း\n၄️⃣ Favorites\n\nနံပါတ်တစ်ခုရွေးပြီး comment မှာ ရေးပေးခဲ့ပါနော်။ မိဘတို့အသုံးများတဲ့အပိုင်းကို ပိုကောင်းအောင် ဆက်တိုးတက်စေချင်ပါတယ်။\n\n#ACEChildGrow #မိဘတို့အသံ',
  },
  {
    id: 'ACE-CAL-15', scheduledAt: '2026-08-31T13:30:00.000Z', category: 'trust', objective: 'privacy awareness', icon: 'shield', accent: palette.sky,
    eyebrow: 'အွန်လိုင်းမှာ မျှဝေတဲ့အခါ', title: ['ကလေးရဲ့ ကိုယ်ရေးအချက်အလက်ကို', 'ကာကွယ်ထားမယ်'], body: ['နာမည်အပြည့်၊ လိပ်စာ၊ ဆေးမှတ်တမ်းတွေကို', 'public comment မှာ မရေးပါနဲ့'],
    captionMyanmar: 'မိဘတို့ရေ—online မှာ မေးခွန်းမေးတဲ့အခါ ကလေးရဲ့ ကိုယ်ရေးအချက်အလက်ကို သတိထားပေးပါနော် 🛡️\n\nနာမည်အပြည့်အစုံ၊ လိပ်စာ၊ ဖုန်းနံပါတ်၊ ဆေးမှတ်တမ်းလို အချက်အလက်တွေကို public comment မှာ မရေးပေးဖို့ မေတ္တာရပ်ခံပါတယ်။\n\nမေးခွန်းကို အထွေထွေဖော်ပြပြီး လိုအပ်ရင် သင့်တော်တဲ့ပညာရှင်နဲ့ တိုက်ရိုက်တိုင်ပင်ပါ။\n\n#ACEChildGrow #ကလေးကိုယ်ရေးလုံခြုံမှု',
  },
  {
    id: 'ACE-CAL-16', scheduledAt: '2026-09-02T13:30:00.000Z', category: 'app_feature', objective: 'retention', icon: 'bell', accent: palette.gold,
    eyebrow: 'မမေ့အောင် သတိပေးမယ်', title: ['နေ့စဉ်အချိန်လေးကို', 'ပုံမှန်ဖြစ်အောင်လုပ်မယ်'], body: ['အချိန်အများကြီး မလိုပါဘူး', 'ပုံမှန်နည်းနည်းစီက ပိုအရေးကြီးတယ်'],
    captionMyanmar: 'နေ့တိုင်းအချိန်အများကြီးပေးမှ မဟုတ်ပါဘူး ⏰\n\nမိဘနဲ့ကလေးအတွက် အဆင်ပြေတဲ့အချိန်လေးတစ်ခုရွေးပြီး ၅ မိနစ်၊ ၁၀ မိနစ်လောက် ပုံမှန်အတူလုပ်ကြည့်ပါ။\n\nနည်းနည်းစီပေမယ့် ပုံမှန်ဖြစ်လာတာက နေ့စဉ်အလေ့အကျင့်ကောင်းတစ်ခု ဖြစ်လာစေပါတယ်။\n\n#ACEChildGrow #နေ့စဉ်အလေ့အကျင့်',
  },
  {
    id: 'ACE-CAL-17', scheduledAt: '2026-09-05T03:30:00.000Z', category: 'family', objective: 'shared caregiving', icon: 'people', accent: palette.sage,
    eyebrow: 'အတူတူဂရုစိုက်မယ်', title: ['ကလေးပြုစုတာက', 'တစ်ယောက်တည်းအလုပ်မဟုတ်ပါဘူး'], body: ['မိသားစုဝင်တွေနဲ့ အစီအစဉ်မျှဝေပြီး', 'ကူညီနိုင်တာကို ခွဲလုပ်ကြမယ်'],
    captionMyanmar: 'ကလေးပြုစုတာကို တစ်ယောက်တည်း ထမ်းထားစရာမလိုပါဘူး 👨‍👩‍👧\n\nဒီနေ့လုပ်မယ့်အစီအစဉ်၊ ကလေးစိတ်ဝင်စားတာနဲ့ သတိထားမိတဲ့အချက်လေးတွေကို မိသားစုဝင်တွေနဲ့ ပြောပြမျှဝေပါ။\n\nကူညီနိုင်တာကို ခွဲလုပ်ရင် မိဘလည်း ပိုနားရပြီး ကလေးအတွက်လည်း တည်ငြိမ်တဲ့ဂရုစိုက်မှု ရလာနိုင်ပါတယ်။\n\n#ACEChildGrow #မိသားစုနဲ့အတူ',
  },
  {
    id: 'ACE-CAL-18', scheduledAt: '2026-09-07T13:30:00.000Z', category: 'planning', objective: 'weekly return', icon: 'calendar', accent: palette.coral,
    eyebrow: 'တစ်ပတ်သစ် စမယ်', title: ['ဒီတစ်ပတ်အတွက်', 'အစီအစဉ် ၃ ခုရွေးမယ်'], body: ['လုပ်နိုင်သလောက်ကို ရွေးပြီး', 'မိဘနဲ့ကလေး အဆင်ပြေသလိုလုပ်ပါ'],
    captionMyanmar: 'တစ်ပတ်သစ်ကို အများကြီးစီစဉ်စရာမလိုပါဘူး 🗓️\n\nACE Child Grow ထဲက လှုပ်ရှားမှုတွေထဲက မိဘနဲ့ကလေးအတွက် အဆင်ပြေမယ့် ၃ ခုလောက် ရွေးထားပါ။\n\nပြီးအောင်လုပ်ဖို့ထက် အတူတူပျော်ပျော်ရွှင်ရွှင် လုပ်နိုင်ဖို့က ပိုအရေးကြီးပါတယ်။\n\nဒီတစ်ပတ် ဘယ်နေ့မှာ စလုပ်မလဲ?\n\n#ACEChildGrow #တစ်ပတ်တာအစီအစဉ်',
  },
]

function escapeXml(value) {
  return String(value).replace(/[<>&"']/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character])
}

function hash(value) {
  return createHash('sha256').update(value).digest('hex')
}

function iconMarkup(name, accent) {
  const common = `fill="none" stroke="${accent}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"`
  const icons = {
    bookmark: `<path ${common} d="M730 420h180v300l-90-60-90 60z"/><path ${common} d="M770 490h100"/>`,
    star: `<path ${common} d="M820 400l36 108h114l-92 67 35 109-93-67-93 67 35-109-92-67h114z"/>`,
    chart: `<path ${common} d="M680 700V430M680 700h300M735 620l70-75 70 25 75-115"/><circle cx="735" cy="620" r="13" fill="${accent}"/><circle cx="805" cy="545" r="13" fill="${accent}"/><circle cx="875" cy="570" r="13" fill="${accent}"/><circle cx="950" cy="455" r="13" fill="${accent}"/>`,
    book: `<path ${common} d="M650 440q90-35 170 25v250q-80-60-170-20zM990 440q-90-35-170 25v250q80-60 170-20z"/>`,
    heart: `<path ${common} d="M820 690c-190-110-165-275-55-275 55 0 55 45 55 45s0-45 55-45c110 0 135 165-55 275z"/>`,
    phone: `<rect ${common} x="700" y="380" width="240" height="390" rx="42"/><path ${common} d="M785 720h70M790 420h60"/>`,
    cup: `<path ${common} d="M700 470h210v170q0 90-105 90t-105-90zM910 515h25q70 0 70 60t-85 60"/><path ${common} d="M730 775h160"/>`,
    chat: `<path ${common} d="M660 430h320v230H820l-95 70 20-70h-85z"/><circle cx="750" cy="545" r="13" fill="${accent}"/><circle cx="820" cy="545" r="13" fill="${accent}"/><circle cx="890" cy="545" r="13" fill="${accent}"/>`,
    shield: `<path ${common} d="M820 380q75 55 150 60v120q0 135-150 220-150-85-150-220V440q75-5 150-60z"/><path ${common} d="M755 565l45 45 90-105"/>`,
    bell: `<path ${common} d="M700 660h240l-35-55V500q0-85-85-85t-85 85v105zM780 710q40 55 80 0"/>`,
    people: `<circle ${common} cx="760" cy="480" r="65"/><circle ${common} cx="900" cy="500" r="55"/><path ${common} d="M640 730q15-140 120-140t120 140M850 620q120-20 145 110"/>`,
    calendar: `<rect ${common} x="660" y="410" width="320" height="320" rx="36"/><path ${common} d="M660 510h320M740 370v80M900 370v80"/><path ${common} d="M740 585h30M820 585h30M900 585h30M740 655h30M820 655h30"/>`,
  }
  return icons[name] || icons.star
}

function cardSvg(post, index, hasScreen) {
  const [line1, line2] = post.title
  const [body1, body2] = post.body
  const titleSize = Math.max(line1.length, line2.length) > 22 ? 45 : Math.max(line1.length, line2.length) > 18 ? 50 : 57
  const bodySize = Math.max(body1.length, body2.length) > 28 ? 26 : Math.max(body1.length, body2.length) > 22 ? 29 : 32
  const rightVisual = hasScreen
    ? `<rect x="610" y="300" width="390" height="760" rx="58" fill="none" stroke="${palette.ink}" stroke-width="18"/><rect x="750" y="325" width="110" height="12" rx="6" fill="${palette.ink}"/>`
    : `<circle cx="820" cy="560" r="270" fill="${post.accent}" opacity="0.18"/>${iconMarkup(post.icon, post.accent)}`
  return Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350">
    <circle cx="1010" cy="100" r="235" fill="${palette.mint}"/>
    <circle cx="-40" cy="1100" r="220" fill="${post.accent}" opacity="0.12"/>
    <rect x="58" y="58" width="430" height="74" rx="37" fill="${palette.mint}"/>
    <text x="90" y="107" font-family="Noto Sans Myanmar" font-size="31" font-weight="700" fill="${palette.teal}">${escapeXml(post.eyebrow)}</text>
    <text x="930" y="108" text-anchor="end" font-family="Arial" font-size="28" font-weight="700" fill="${palette.teal}" opacity="0.72">${String(index + 7).padStart(2, '0')} / 18</text>
    <text x="60" y="245" font-family="Noto Sans Myanmar" font-size="${titleSize}" font-weight="700" fill="${palette.ink}">${escapeXml(line1)}</text>
    <text x="60" y="325" font-family="Noto Sans Myanmar" font-size="${titleSize}" font-weight="700" fill="${palette.ink}">${escapeXml(line2)}</text>
    <text x="62" y="440" font-family="Noto Sans Myanmar" font-size="${bodySize}" font-weight="600" fill="${palette.teal}">${escapeXml(body1)}</text>
    <text x="62" y="495" font-family="Noto Sans Myanmar" font-size="${bodySize}" font-weight="600" fill="${palette.teal}">${escapeXml(body2)}</text>
    ${rightVisual}
    <rect x="58" y="1192" width="964" height="100" rx="32" fill="${palette.teal}"/>
    <text x="92" y="1258" font-family="Arial" font-size="34" font-weight="700" fill="white">ACE Child Grow</text>
    <text x="930" y="1256" text-anchor="end" font-family="Noto Sans Myanmar" font-size="27" font-weight="700" fill="white">မိဘဘေးက နေ့စဉ်လမ်းညွှန်</text>
    <circle cx="975" cy="1242" r="28" fill="${palette.white}" opacity="0.95"/>
    <circle cx="975" cy="1235" r="8" fill="${palette.teal}"/>
    <path d="M960 1250q15 18 30 0" fill="none" stroke="${palette.gold}" stroke-width="7" stroke-linecap="round"/>
  </svg>`)
}

async function renderPost(post, index) {
  const hasScreen = Boolean(post.source)
  const canvas = sharp({ create: { width: 1080, height: 1350, channels: 4, background: palette.cream } })
  const layers = []
  if (hasScreen) {
    const source = path.join(launchDir, post.source)
    const crop = await sharp(source)
      .extract({ left: 570, top: 185, width: 430, height: 980 })
      .resize(360, 720, { fit: 'cover' })
      .png()
      .toBuffer()
    layers.push({ input: crop, left: 625, top: 325 })
  }
  layers.push({ input: cardSvg(post, index, hasScreen), left: 0, top: 0 })
  const output = path.join(outputDir, `${post.id}.png`)
  await canvas.composite(layers).png().toFile(output)
  return output
}

function escapeHtml(value) {
  return escapeXml(value).replace(/\n/g, '<br>')
}

function galleryHtml(items) {
  const cards = items.map((post) => `
    <article class="card">
      <img src="./posts/monthly-calendar-v1/${post.id}.png" alt="${post.id}">
      <div class="copy"><div class="meta"><b>${post.id}</b><span>${new Date(post.scheduledAt).toLocaleString('en-GB', { timeZone: 'Asia/Yangon', dateStyle: 'medium', timeStyle: 'short' })} Yangon</span></div><p>${escapeHtml(post.captionMyanmar)}</p></div>
    </article>`).join('')
  return `<!doctype html><html lang="my"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ACE Child Grow Content Calendar</title><style>
  @font-face{font-family:NotoMyanmar;src:url('/assets/noto-sans-myanmar-myanmar-400-normal-C_Ri2PLj.woff2')}*{box-sizing:border-box}body{margin:0;background:#f4f1e9;color:#243238;font-family:NotoMyanmar,'Noto Sans Myanmar',sans-serif}.top{padding:28px clamp(18px,5vw,70px);background:#245b57;color:#fff}.top h1{margin:0 0 8px;font-size:clamp(24px,4vw,42px)}.top p{margin:0;opacity:.85}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px;padding:28px clamp(16px,4vw,60px)}.card{background:white;border-radius:24px;overflow:hidden;box-shadow:0 10px 28px #183c3a18}.card img{display:block;width:100%;height:auto}.copy{padding:20px}.meta{display:flex;justify-content:space-between;gap:12px;color:#245b57;font-family:system-ui,sans-serif;font-size:14px}.copy p{line-height:1.9;white-space:normal}.badge{display:inline-block;padding:6px 12px;background:#dfeee7;color:#245b57;border-radius:999px;font-size:13px;margin-top:10px}</style></head><body><header class="top"><h1>ACE Child Grow — ၄ ပတ်စာ Content Calendar</h1><p>မိဘတွေအတွက် app feature၊ နေ့စဉ်အသုံးဝင်မှုနဲ့ engagement post ၁၂ ခု</p><span class="badge">Asia/Yangon • Mon/Wed 20:00 • Sat 10:00</span></header><main class="grid">${cards}</main></body></html>`
}

await mkdir(outputDir, { recursive: true })
let previous = { items: [] }
try { previous = JSON.parse(await readFile(manifestFile, 'utf8')) } catch {}

const generated = []
for (const [index, post] of posts.entries()) {
  const output = await renderPost(post, index)
  const mediaSha256 = hash(await readFile(output))
  generated.push({
    ...post,
    status: 'scheduled',
    approvalStatus: 'approved',
    reviewerId: 'OWNER_CONTINUOUS_POST_AUTH_2026_07_30',
    approvalTimestamp: '2026-07-30T06:10:00.000Z',
    approvalExpiresAt: '2026-10-01T00:00:00.000Z',
    approvedContentHash: hash(`${post.id}|${post.scheduledAt}|${post.captionMyanmar}|${mediaSha256}`),
    riskLevel: 'low',
    clinicalApprovalId: null,
    mediaType: 'image',
    mediaUrl: `https://child.acegroup.com.mm/social/ace-child-grow/posts/monthly-calendar-v1/${post.id}.png`,
    mediaSha256,
    alreadyPublished: false,
    platformPostId: null,
    platformPermalink: null,
  })
}

const generatedById = new Map(generated.map((item) => [item.id, item]))
const preserved = (previous.items || []).filter((item) => !generatedById.has(item.id))
const manifest = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  automationMode: 'production',
  killSwitch: false,
  destination: {
    platform: 'facebook',
    pageId: '111009258047115',
    pageUrl: 'https://www.facebook.com/scienceeducationcenter',
    graphApiVersion: 'v25.0',
  },
  cadence: { timezone: 'Asia/Yangon', weeklyPosts: 3, note: 'Mon/Wed 20:00 and Sat 10:00' },
  items: [...preserved, ...generated],
}

const calendar = {
  title: 'ACE Child Grow — 4 Week Content Calendar',
  timezone: 'Asia/Yangon',
  cadence: 'Mon/Wed 20:00, Sat 10:00',
  generatedAt: manifest.generatedAt,
  posts: generated.map(({ mediaSha256, approvedContentHash, ...post }) => post),
}

await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`)
await writeFile(calendarFile, `${JSON.stringify(calendar, null, 2)}\n`)
await writeFile(galleryFile, galleryHtml(posts))
console.log(JSON.stringify({ generated: generated.length, totalQueue: manifest.items.length, outputDir, manifestFile, calendarFile, galleryFile }, null, 2))
