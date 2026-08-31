import { createHash } from 'node:crypto'
import { access, copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { reconcileGeneratedApproval } from './social/approval-provenance.mjs'

const root = path.resolve(import.meta.dirname, '..')
const socialDir = path.join(root, 'public/social/ace-child-grow')
const outputDir = path.join(socialDir, 'posts/monthly-calendar-v1')
const manifestFile = path.join(socialDir, 'manifest.json')
const calendarFile = path.join(socialDir, 'content-calendar.json')
const galleryFile = path.join(socialDir, 'calendar.html')
const phonePreviewFile = path.join(socialDir, 'calendar-phone-preview.png')
const activityCampaignDir = path.join(socialDir, 'posts/activity-5-6m-v1')
const activityPostsFile = path.join(root, 'scripts/social/activity-5-6m-posts.json')
const activityPosts = JSON.parse(await readFile(activityPostsFile, 'utf8'))
const visualOnly = process.argv.includes('--visual-only')

const fontSourceDir = process.env.SOCIAL_FONT_SOURCE_DIR
  ? path.resolve(process.env.SOCIAL_FONT_SOURCE_DIR)
  : path.join(root, 'node_modules/@fontsource/noto-sans-myanmar')
const bundledFontDir = path.join(socialDir, 'assets/fonts/noto-sans-myanmar')
const fontAssets = {
  regular: {
    source: path.join(fontSourceDir, 'files/noto-sans-myanmar-myanmar-400-normal.woff2'),
    bundled: path.join(bundledFontDir, 'NotoSansMyanmar-400.woff2'),
  },
  bold: {
    source: path.join(fontSourceDir, 'files/noto-sans-myanmar-myanmar-700-normal.woff2'),
    bundled: path.join(bundledFontDir, 'NotoSansMyanmar-700.woff2'),
  },
}
const fontLicenseSource = path.join(fontSourceDir, 'LICENSE')
const fontLicenseBundled = path.join(bundledFontDir, 'OFL-1.1.txt')

const visualAssets = {
  'ACE-CAL-07': 'public/illustrations/activities/play.webp',
  'ACE-CAL-08': 'public/activities/5_6m/act_safe_touch_basket.c953264aef.webp',
  'ACE-CAL-09': 'public/guides/gd_13_18m_daily_routine.cf3d513e9d.webp',
  'ACE-CAL-10': 'public/lessons/language_development/lsn_language_rich_home.5490311de9.webp',
  'ACE-CAL-11': 'public/illustrations/activities/emotional.webp',
  'ACE-CAL-12': 'public/social/ace-child-grow/posts/continuous-launch-v1/ACE-AUTO-04.png',
  'ACE-CAL-13': 'public/illustrations/activities/self_help.webp',
  'ACE-CAL-14': 'public/social/ace-child-grow/posts/continuous-launch-v1/ACE-AUTO-01.png',
  'ACE-CAL-15': 'public/illustrations/activities/safety.webp',
  'ACE-CAL-16': 'public/illustrations/activities/daily_routine.webp',
  'ACE-CAL-17': 'public/illustrations/activities/social.webp',
  'ACE-CAL-18': 'public/illustrations/activities/school_readiness.webp',
}

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
    reviewRequired: true,
    eyebrow: 'ကြိုက်နှစ်သက်ရာ', title: ['ပြန်ကြည့်ချင်တာကို', 'သိမ်းထားမယ်'], body: ['အသုံးဝင်တဲ့ အစီအစဉ်တွေကို', 'Favorites ထဲမှာ ပြန်ရှာလို့ရတယ်'],
    captionMyanmar: 'ဖတ်ပြီးတာနဲ့ ပျောက်သွားမှာစိုးရိမ်စရာ မလိုပါဘူး 💛\n\nACE Child Grow မှာ ပြန်ကြည့်ချင်တဲ့ လှုပ်ရှားမှုနဲ့ လေ့လာစရာတွေကို Favorites ထဲ သိမ်းထားနိုင်ပါတယ်။\n\nကလေးနဲ့ လုပ်ကြည့်ဖို့ အချိန်ရတဲ့အခါ အလွယ်တကူ ပြန်ဖွင့်ကြည့်ရုံပါပဲ။\n\n#ACEChildGrow #မိဘနဲ့ကလေး #Favorites',
  },
  {
    id: 'ACE-CAL-08', scheduledAt: '2026-08-15T03:30:00.000Z', category: 'engagement', objective: 'weekend activity', icon: 'star', accent: palette.gold,
    reviewRequired: true,
    eyebrow: 'စနေမနက် အတူကစားမယ်', title: ['အိမ်မှာရှိတာနဲ့', 'ကစားလို့ရတယ်'], body: ['အထူးပစ္စည်း မလိုပါဘူး', 'အတူရှိပေးတဲ့အချိန်က အရေးကြီးတယ်'],
    captionMyanmar: 'ကလေးနဲ့ ကစားဖို့ ပစ္စည်းအများကြီး မလိုပါဘူးနော် 🌟\n\nအိမ်မှာရှိတဲ့ ခွက်၊ ဇွန်း၊ စက္ကူ ဒါမှမဟုတ် ပျော့ပျောင်းတဲ့အဝတ်လေးတွေကို အသက်အရွယ်နဲ့ ကိုက်ညီအောင် အသုံးပြုလို့ရပါတယ်။\n\nအရေးကြီးတာက မိဘက ဘေးမှာရှိပြီး အတူကြည့်၊ အတုပြ၊ စကားပြောပေးဖို့ပါ။\n\nဒီနေ့ ဘာနဲ့အတူကစားဖြစ်လဲ comment မှာ မျှဝေပေးပါနော်။\n\n#ACEChildGrow #အိမ်မှာအတူကစားမယ်',
  },
  {
    id: 'ACE-CAL-09', scheduledAt: '2026-08-17T13:30:00.000Z', category: 'parent_support', objective: 'habit building', icon: 'chart', accent: palette.sage, source: 'ACE-AUTO-02.png',
    reviewRequired: true,
    eyebrow: 'တစ်ပတ်တာ ပြန်ကြည့်မယ်', title: ['ပြောင်းလဲမှုလေးတွေကို', 'သတိထားမယ်'], body: ['နေ့တိုင်းမှတ်ထားတဲ့ အချက်လေးတွေက', 'အချိန်ကြာရင် ပုံပြင်တစ်ပုဒ်ဖြစ်လာတယ်'],
    captionMyanmar: 'ကလေးရဲ့ ပြောင်းလဲမှုက နေ့တိုင်းနည်းနည်းစီ ဖြစ်လာတာပါ 🌱\n\nတစ်ပတ်ပြီးတိုင်း “ဒီအပတ် ဘာအသစ်လုပ်တတ်လာလဲ၊ ဘာကိုပိုစိတ်ဝင်စားလာလဲ” ဆိုတာ ခဏပြန်စဉ်းစားကြည့်ပါ။\n\nACE Child Grow ထဲမှာ နေ့စဉ်အချက်လေးတွေကို သတိထားရင်း မိဘကိုယ်တိုင်လည်း ကလေးကို ပိုနားလည်လာနိုင်ပါတယ်။\n\n#ACEChildGrow #ကလေးဖွံ့ဖြိုးမှု #တစ်ပတ်တာမှတ်တမ်း',
  },
  {
    id: 'ACE-CAL-10', scheduledAt: '2026-08-19T13:30:00.000Z', category: 'app_feature', objective: 'content discovery', icon: 'book', accent: palette.coral, source: 'ACE-AUTO-03.png',
    reviewRequired: true,
    eyebrow: 'သိချင်တာ ရှာဖတ်မယ်', title: ['မေးခွန်းရှိတဲ့အခါ', 'ဘယ်မှာရှာမလဲ?'], body: ['လေ့လာရန်ကဏ္ဍမှာ', 'ခေါင်းစဉ်အလိုက် ဖတ်ရှုနိုင်တယ်'],
    captionMyanmar: 'ကလေးပြုစုရင်း မေးခွန်းအသစ်တွေ နေ့တိုင်းပေါ်လာတတ်ပါတယ်နော် 📚\n\nACE Child Grow ရဲ့ လေ့လာရန်ကဏ္ဍမှာ အကြောင်းအရာတွေကို ခေါင်းစဉ်အလိုက် ရှာဖတ်နိုင်ပါတယ်။\n\nအားတဲ့အချိန် ဖတ်ထားမယ်၊ လိုအပ်တဲ့အခါ ပြန်ကြည့်မယ်—မိဘအတွက် အဆင်ပြေတဲ့ လေ့လာစရာနေရာလေးပါ။\n\n#ACEChildGrow #မိဘများအတွက် #လေ့လာရန်',
  },
  {
    id: 'ACE-CAL-11', scheduledAt: '2026-08-22T03:30:00.000Z', category: 'education', objective: 'healthy expectations', icon: 'heart', accent: palette.sky,
    reviewRequired: true,
    eyebrow: 'ကလေးတိုင်း မတူကြပါဘူး', title: ['ဖွံ့ဖြိုးမှုက', 'ပြိုင်ပွဲမဟုတ်ပါဘူး'], body: ['ကိုယ့်ကလေးရဲ့ အရှိန်နဲ့', 'သေးငယ်တဲ့တိုးတက်မှုကို သတိထားပေးပါ'],
    captionMyanmar: 'ကလေးတိုင်းရဲ့ သင်ယူပုံနဲ့ ဖွံ့ဖြိုးလာပုံက မတူနိုင်ပါတယ် 💛\n\nတခြားကလေးနဲ့ နှိုင်းယှဉ်တာထက် ကိုယ့်ကလေးရဲ့ မနေ့ကနဲ့ ဒီနေ့ကို ပြန်ကြည့်ပေးပါ။ သေးငယ်တဲ့ တိုးတက်မှုလေးတွေကို အသိအမှတ်ပြုပေးတာက အရေးကြီးပါတယ်။\n\nစိုးရိမ်စရာတစ်ခုရှိရင်တော့ သင့်တော်တဲ့ ကျန်းမာရေးပညာရှင်နဲ့ တိုင်ပင်ပါ။\n\n#ACEChildGrow #ကလေးဖွံ့ဖြိုးမှု #မိဘအားပေးမှု',
  },
  {
    id: 'ACE-CAL-12', scheduledAt: '2026-08-24T13:30:00.000Z', category: 'app_tutorial', objective: 'product education', icon: 'phone', accent: palette.gold, source: 'ACE-AUTO-04.png',
    reviewRequired: true,
    eyebrow: 'App ကို စသုံးမယ်', title: ['ဒီနေ့အစီအစဉ်ကို', '၃ ချက်နဲ့ကြည့်မယ်'], body: ['အသက်အရွယ်ရွေး → အစီအစဉ်ကြည့်', 'ကြိုက်တာကို သိမ်းထား'],
    captionMyanmar: 'ACE Child Grow ကို စသုံးဖို့ မခက်ပါဘူး 📱\n\n၁။ ကလေးရဲ့ အသက်အရွယ်နဲ့ကိုက်တဲ့ အကြောင်းအရာကိုရွေးပါ။\n၂။ ဒီနေ့အတွက် လှုပ်ရှားမှုနဲ့ လိုအပ်တာတွေကိုဖတ်ပါ။\n၃။ နောက်မှပြန်ကြည့်ချင်တာကို Favorites ထဲ သိမ်းထားပါ။\n\nမိဘတို့ရဲ့ နေ့စဉ်အချိန်နဲ့ကိုက်အောင် အဆင်ပြေသလို အသုံးပြုနိုင်ပါတယ်။\n\n#ACEChildGrow #Appအသုံးပြုနည်း',
  },
  {
    id: 'ACE-CAL-13', scheduledAt: '2026-08-26T13:30:00.000Z', category: 'parent_support', objective: 'caregiver wellbeing', icon: 'cup', accent: palette.sage,
    reviewRequired: true,
    eyebrow: 'မိဘလည်း နားဖို့လိုတယ်', title: ['၅ မိနစ်လောက်', 'ကိုယ့်အတွက်ထားမယ်'], body: ['ရေသောက်၊ အသက်ရှူ၊ ခဏနား', 'အားပြန်ဖြည့်တာလည်း ဂရုစိုက်ခြင်းပါ'],
    captionMyanmar: 'ကလေးကို ဂရုစိုက်နေတဲ့ မိဘကိုလည်း ဂရုစိုက်ဖို့လိုပါတယ် 💛\n\nရေတစ်ခွက်သောက်ပါ။ ပခုံးကိုလျှော့ပြီး အသက်ပြင်းပြင်း သုံးခါရှူပါ။ ဖြစ်နိုင်ရင် ၅ မိနစ်လောက် ခဏနားပါ။\n\nအရာအားလုံးကို တစ်ယောက်တည်း အပြီးလုပ်စရာမလိုပါဘူး။ လိုအပ်ရင် အနားကလူကို အကူအညီတောင်းလို့ရပါတယ်။\n\n#ACEChildGrow #မိဘနားချိန်',
  },
  {
    id: 'ACE-CAL-14', scheduledAt: '2026-08-29T03:30:00.000Z', category: 'engagement', objective: 'audience research', icon: 'chat', accent: palette.coral,
    reviewRequired: true,
    eyebrow: 'မိဘတို့အသံ', title: ['App ထဲမှာ ဘာကို', 'အများဆုံးသုံးဖြစ်လဲ?'], body: ['နေ့စဉ်လှုပ်ရှားမှု • လေ့လာရန်', 'မှတ်တမ်း • Favorites'],
    captionMyanmar: 'ACE Child Grow ထဲမှာ ဘယ်ကဏ္ဍကို အများဆုံးသုံးဖြစ်လဲ? 👇\n\n၁️⃣ နေ့စဉ်လှုပ်ရှားမှု\n၂️⃣ လေ့လာရန်\n၃️⃣ ဖွံ့ဖြိုးမှုမှတ်တမ်း\n၄️⃣ Favorites\n\nနံပါတ်တစ်ခုရွေးပြီး comment မှာ ရေးပေးခဲ့ပါနော်။ မိဘတို့အသုံးများတဲ့အပိုင်းကို ပိုကောင်းအောင် ဆက်တိုးတက်စေချင်ပါတယ်။\n\n#ACEChildGrow #မိဘတို့အသံ',
  },
  {
    id: 'ACE-CAL-15', scheduledAt: '2026-08-31T13:30:00.000Z', category: 'trust', objective: 'privacy awareness', icon: 'shield', accent: palette.sky,
    reviewRequired: true,
    eyebrow: 'အွန်လိုင်းမှာ မျှဝေတဲ့အခါ', title: ['ကလေးရဲ့ ကိုယ်ရေးအချက်အလက်ကို', 'ကာကွယ်ထားမယ်'], body: ['နာမည်အပြည့်၊ လိပ်စာ၊ ဆေးမှတ်တမ်းတွေကို', 'public comment မှာ မရေးပါနဲ့'],
    captionMyanmar: 'မိဘတို့ရေ—online မှာ မေးခွန်းမေးတဲ့အခါ ကလေးရဲ့ ကိုယ်ရေးအချက်အလက်ကို သတိထားပေးပါနော် 🛡️\n\nနာမည်အပြည့်အစုံ၊ လိပ်စာ၊ ဖုန်းနံပါတ်၊ ဆေးမှတ်တမ်းလို အချက်အလက်တွေကို public comment မှာ မရေးပေးဖို့ မေတ္တာရပ်ခံပါတယ်။\n\nမေးခွန်းကို အထွေထွေဖော်ပြပြီး လိုအပ်ရင် သင့်တော်တဲ့ပညာရှင်နဲ့ တိုက်ရိုက်တိုင်ပင်ပါ။\n\n#ACEChildGrow #ကလေးကိုယ်ရေးလုံခြုံမှု',
  },
  {
    id: 'ACE-CAL-16', scheduledAt: '2026-09-02T13:30:00.000Z', category: 'app_feature', objective: 'retention', icon: 'bell', accent: palette.gold,
    reviewRequired: true,
    eyebrow: 'ညနေ ၅ မိနစ်', title: ['နေ့စဉ်အချိန်တစ်ခုကို', 'ကလေးနဲ့အတူထားမယ်'], body: ['လှုပ်ရှားမှုတစ်ခုရွေးပြီး', 'နေ့တိုင်းအချိန်တူတူ စလုပ်ပါ'],
    captionMyanmar: 'ညစာစားပြီးချိန်မှာ ကလေးနဲ့ ဘာလုပ်ပေးရမလဲ စဉ်းစားနေရသလား? ⏰\n\nဒီနေ့ လုပ်စရာတစ်ခုပဲ ရွေးပါ—သီချင်းဆိုတာ၊ ပုံစာအုပ်ကြည့်တာ ဒါမှမဟုတ် ပစ္စည်းတစ်ခုကို အမည်ခေါ်ပြတာ။ ၅ မိနစ်ပြည့်ရင် ရပ်လို့ရပါတယ်။ ကလေး စိတ်မဝင်စားတဲ့နေ့မှာလည်း အဆင်ပြေပါတယ်။\n\nမနက်ဖြန် ပြန်သုံးဖို့ ဒီ ၅ မိနစ်နည်းကို သိမ်းထားပါ။ အိမ်မှာ လုပ်စရာရွေးရခက်နေသူတစ်ယောက်ကို မျှဝေပေးပါ။\n\nအသက်အလိုက် လက်တွေ့လုပ်နည်းတွေကို ACE Child Grow မှာ ပြန်ရှာနိုင်ပါတယ်။\n\n#ACEChildGrow #ကလေးနဲ့အတူ #နေ့စဉ်၅မိနစ်',
  },
  {
    id: 'ACE-CAL-17', scheduledAt: '2026-09-05T03:30:00.000Z', category: 'family', objective: 'shared caregiving', icon: 'people', accent: palette.sage,
    reviewRequired: true,
    eyebrow: 'လက်လွှဲမယ့်အချိန်', title: ['ကလေးအကြောင်း ၃ ချက်ကို', 'တိုတိုလေး မျှဝေမယ်'], body: ['စားချိန် • အိပ်ချိန် • စိတ်ဝင်စားတာ', 'ဂရုစိုက်သူတိုင်း သိထားအောင်'],
    captionMyanmar: 'အလုပ်ကပြန်လာတဲ့ မိသားစုဝင်ကို ကလေးအကြောင်း အမြန်ပြောပြရမယ့်အချိန် ရှိတတ်ပါတယ် 👨‍👩‍👧\n\nဒီ ၃ ချက်ကို တစ်မိနစ်အတွင်း မျှဝေပါ—\n၁။ နောက်ဆုံးစားထားတဲ့အချိန်\n၂။ နောက်ဆုံးအိပ်ထားတဲ့အချိန်\n၃။ ဒီနေ့ စိတ်ဝင်စားခဲ့တဲ့အရာ\n\nအားလုံးကို ပြောနိုင်ဖို့ မလိုပါဘူး။ နောက်တစ်ယောက် ဂရုစိုက်ရလွယ်မယ့် အချက်တစ်ချက်ကနေ စလို့ရပါတယ်။\n\nလက်လွှဲချိန်တိုင်း ပြန်ကြည့်ဖို့ ဒီစာရင်းကို သိမ်းထားပါ။ ကလေးကို အတူဂရုစိုက်သူတွေဆီ မျှဝေပေးပါ။\n\nနေ့စဉ်မှတ်သားစရာတွေကို ACE Child Grow မှာ တစ်နေရာတည်း ပြန်ကြည့်နိုင်ပါတယ်။\n\n#ACEChildGrow #မိသားစုနဲ့အတူ #ကလေးနေ့စဉ်မှတ်တမ်း',
  },
  {
    id: 'ACE-CAL-18', scheduledAt: '2026-09-07T13:30:00.000Z', category: 'planning', objective: 'weekly return', icon: 'calendar', accent: palette.coral,
    reviewRequired: true,
    eyebrow: 'တနင်္ဂနွေည ၃ မိနစ်', title: ['နောက်တစ်ပတ်အတွက်', 'လှုပ်ရှားမှု ၃ ခုရွေးမယ်'], body: ['အလုပ်များတဲ့နေ့ကို ရှောင်ပြီး', 'အဆင်ပြေတဲ့နေ့မှာ ထည့်ထားပါ'],
    captionMyanmar: 'တနင်္ဂနွေညမှာ နောက်တစ်ပတ်အတွက် ကလေးနဲ့လုပ်စရာကို ၃ မိနစ်ပဲ စီစဉ်ကြည့်ပါ 🗓️\n\n၁။ ကလေးစိတ်ဝင်စားနိုင်တဲ့ လှုပ်ရှားမှု ၃ ခုရွေးပါ။\n၂။ အလုပ်နည်းတဲ့နေ့ ၃ ရက်နဲ့ တွဲမှတ်ပါ။\n၃။ မလုပ်ဖြစ်တဲ့နေ့ရှိရင် နောက်ရက်ကို အေးအေးဆေးဆေး ရွှေ့ပါ။\n\nတစ်ပတ်တိုင်း ပြန်သုံးဖို့ ဒီအစီအစဉ်ကို သိမ်းထားပါ။ အိမ်မှာ ကလေးကို အတူဂရုစိုက်သူနဲ့ မျှဝေပြီး သင့်တော်တဲ့နေ့တွေကို အတူရွေးပါ။\n\nအသက်အလိုက် လှုပ်ရှားမှုရွေးစရာတွေကို ACE Child Grow မှာ ပြန်ရှာနိုင်ပါတယ်။\n\n#ACEChildGrow #တစ်ပတ်တာအစီအစဉ် #ကလေးနဲ့အတူ',
  },
]

function escapeXml(value) {
  return String(value).replace(/[<>&"']/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character])
}

function hash(value) {
  return createHash('sha256').update(value).digest('hex')
}

async function ensureFontAssets() {
  await mkdir(bundledFontDir, { recursive: true })
  for (const asset of Object.values(fontAssets)) {
    try {
      await access(asset.source)
    } catch {
      throw new Error(`Required licensed Myanmar font is missing: ${asset.source}. Run npm install before generating social assets.`)
    }
    await copyFile(asset.source, asset.bundled)
  }
  try {
    await access(fontLicenseSource)
  } catch {
    throw new Error(`Required font license is missing: ${fontLicenseSource}`)
  }
  await copyFile(fontLicenseSource, fontLicenseBundled)
}

function layoutSvg(post) {
  return Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350">
    <defs>
      <linearGradient id="photoFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="55%" stop-color="#000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.24"/>
      </linearGradient>
    </defs>
    <rect y="0" width="1080" height="650" fill="url(#photoFade)"/>
    <rect x="48" y="38" width="460" height="104" rx="34" fill="${palette.white}" opacity="0.92"/>
    <path d="M0 610Q540 680 1080 610V1350H0Z" fill="${palette.cream}"/>
    <rect x="58" y="692" width="520" height="70" rx="35" fill="${palette.mint}"/>
    <circle cx="1010" cy="790" r="180" fill="${post.accent}" opacity="0.10"/>
    <rect x="58" y="1215" width="964" height="92" rx="30" fill="${palette.teal}"/>
  </svg>`)
}

async function renderedText(text, { width, height, font = fontAssets.bold.bundled, color = palette.ink, align = 'left' }) {
  if (!text.trim()) throw new Error('Refusing to render an empty social-card text block')
  await access(font)
  return sharp({
    text: {
      text: `<span foreground="${color}">${escapeXml(text)}</span>`,
      font: 'Noto Sans Myanmar',
      fontfile: font,
      width,
      height,
      align,
      rgba: true,
    },
  }).png().toBuffer()
}

async function renderPost(post) {
  const output = path.join(outputDir, `${post.id}.png`)
  if (process.env.REGENERATE_SOCIAL_ASSETS !== '1') {
    try {
      await readFile(output)
      return output
    } catch {}
  }
  const visualAsset = visualAssets[post.id]
  if (!visualAsset) throw new Error(`No approved visual asset mapped for ${post.id}`)
  const visualPath = path.join(root, visualAsset)
  await access(visualPath)

  const visual = await sharp(visualPath)
    .rotate()
    .resize(1080, 650, { fit: 'cover', position: 'attention' })
    .modulate({ saturation: 0.92, brightness: 0.96 })
    .png()
    .toBuffer()
  const logo = await sharp(path.join(root, 'public/icon-512.png')).resize(68, 68).png().toBuffer()
  const eyebrow = await renderedText(post.eyebrow, { width: 455, height: 44, color: palette.teal })
  const title = await renderedText(post.title.join('\n'), { width: 920, height: 182, color: palette.ink })
  const body = await renderedText(post.body.join('\n'), { width: 900, height: 116, font: fontAssets.regular.bundled, color: palette.teal })
  const brandPromise = sharp({
    text: { text: '<span foreground="#245B57"><b>ACE Child Grow</b></span>', font: 'Arial', width: 330, height: 46, rgba: true },
  }).png().toBuffer()
  const taglinePromise = renderedText('ကလေးနဲ့အတူ နေ့စဉ်သင်ယူ', { width: 390, height: 42, color: palette.white, align: 'right' })

  await sharp({ create: { width: 1080, height: 1350, channels: 4, background: palette.cream } })
    .composite([
      { input: visual, left: 0, top: 0 },
      { input: layoutSvg(post), left: 0, top: 0 },
      { input: logo, left: 68, top: 55 },
      { input: await brandPromise, left: 154, top: 68 },
      { input: eyebrow, left: 88, top: 706 },
      { input: title, left: 70, top: 805 },
      { input: body, left: 72, top: 1035 },
      { input: await taglinePromise, left: 575, top: 1241 },
    ])
    .png({ compressionLevel: 9, adaptiveFiltering: false })
    .toFile(output)
  return output
}

async function renderPhonePreview() {
  const thumbWidth = 252
  const thumbHeight = 315
  const gap = 18
  const columns = 4
  const rows = Math.ceil(posts.length / columns)
  const width = (columns * thumbWidth) + ((columns + 1) * gap)
  const height = (rows * thumbHeight) + ((rows + 1) * gap)
  const layers = []
  for (const [index, post] of posts.entries()) {
    const thumb = await sharp(path.join(outputDir, `${post.id}.png`)).resize(thumbWidth, thumbHeight).png().toBuffer()
    layers.push({ input: thumb, left: gap + ((index % columns) * (thumbWidth + gap)), top: gap + (Math.floor(index / columns) * (thumbHeight + gap)) })
  }
  await sharp({ create: { width, height, channels: 4, background: '#E8ECEA' } }).composite(layers).png().toFile(phonePreviewFile)
}

async function renderActivityPost(post) {
  const source = path.join(root, post.sourceAsset)
  const output = path.join(activityCampaignDir, `${post.id}.jpg`)
  if (process.env.REGENERATE_SOCIAL_ASSETS !== '1') {
    try {
      await readFile(output)
      return output
    } catch {}
  }
  await sharp(source)
    .rotate()
    .flatten({ background: '#FFF8EA' })
    .jpeg({ quality: 88, chromaSubsampling: '4:4:4', mozjpeg: true })
    .toFile(output)
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
  @font-face{font-family:NotoMyanmar;src:url('./assets/fonts/noto-sans-myanmar/NotoSansMyanmar-400.woff2')}*{box-sizing:border-box}body{margin:0;background:#f4f1e9;color:#243238;font-family:NotoMyanmar,'Noto Sans Myanmar',sans-serif}.top{padding:28px clamp(18px,5vw,70px);background:#245b57;color:#fff}.top h1{margin:0 0 8px;font-size:clamp(24px,4vw,42px)}.top p{margin:0;opacity:.85}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px;padding:28px clamp(16px,4vw,60px)}.card{background:white;border-radius:24px;overflow:hidden;box-shadow:0 10px 28px #183c3a18}.card img{display:block;width:100%;height:auto}.copy{padding:20px}.meta{display:flex;justify-content:space-between;gap:12px;color:#245b57;font-family:system-ui,sans-serif;font-size:14px}.copy p{line-height:1.9;white-space:normal}.badge{display:inline-block;padding:6px 12px;background:#dfeee7;color:#245b57;border-radius:999px;font-size:13px;margin-top:10px}</style></head><body><header class="top"><h1>ACE Child Grow — ၄ ပတ်စာ Content Calendar</h1><p>မိဘတွေအတွက် app feature၊ နေ့စဉ်အသုံးဝင်မှုနဲ့ engagement post ၁၂ ခု</p><span class="badge">Asia/Yangon • Mon/Wed 20:00 • Sat 10:00</span></header><main class="grid">${cards}</main></body></html>`
}

await mkdir(outputDir, { recursive: true })
await mkdir(activityCampaignDir, { recursive: true })
await ensureFontAssets()

if (visualOnly) {
  for (const post of posts) await renderPost(post)
  await renderPhonePreview()
  await writeFile(galleryFile, galleryHtml(posts))
  console.log(JSON.stringify({ generated: posts.length, visualOnly: true, outputDir, phonePreviewFile, galleryFile }, null, 2))
  process.exit(0)
}

let previous = { items: [] }
try { previous = JSON.parse(await readFile(manifestFile, 'utf8')) } catch {}
const previousById = new Map((previous.items || []).map((item) => [item.id, item]))

const generated = []
for (const post of posts) {
  const output = await renderPost(post)
  const mediaSha256 = hash(await readFile(output))
  const currentContentHash = hash(`${post.id}|${post.scheduledAt}|${post.captionMyanmar}|${mediaSha256}`)
  const candidate = {
    ...post,
    status: 'draft',
    approvalStatus: 'review_required',
    reviewerId: null,
    approvalTimestamp: null,
    approvalExpiresAt: null,
    approvedContentHash: null,
    riskLevel: 'low',
    clinicalApprovalId: null,
    mediaType: 'image',
    mediaUrl: `https://child.acegroup.com.mm/social/ace-child-grow/posts/monthly-calendar-v1/${post.id}.png`,
    mediaSha256,
    alreadyPublished: false,
    platformPostId: null,
    platformPermalink: null,
  }
  generated.push(reconcileGeneratedApproval({
    candidate,
    currentContentHash,
    prior: previousById.get(post.id),
    forceReview: post.reviewRequired === true,
  }))
}
await renderPhonePreview()

const activityGenerated = []
for (const post of activityPosts) {
  const output = await renderActivityPost(post)
  const mediaSha256 = hash(await readFile(output))
  const currentContentHash = hash(`${post.id}|${post.scheduledAt}|${post.captionMyanmar}|${mediaSha256}`)
  const candidate = {
    id: post.id,
    campaign: 'activity_5_6m',
    sourceSlug: post.sourceSlug,
    sourceAgeGroupKey: '5_6m',
    sourceClinicalStatus: 'published',
    sourceCheckedAt: '2026-08-04T00:24:00.000Z',
    titleMm: post.titleMm,
    titleEn: post.titleEn,
    scheduledAt: post.scheduledAt,
    status: 'draft',
    approvalStatus: 'review_required',
    reviewerId: null,
    approvalTimestamp: null,
    approvalExpiresAt: null,
    approvedContentHash: null,
    riskLevel: 'low',
    clinicalApprovalId: null,
    mediaType: 'image',
    mediaUrl: `https://child.acegroup.com.mm/social/ace-child-grow/posts/activity-5-6m-v1/${post.id}.jpg`,
    mediaSha256,
    captionMyanmar: post.captionMyanmar,
    alreadyPublished: false,
    platformPostId: null,
    platformPermalink: null,
  }
  activityGenerated.push(reconcileGeneratedApproval({
    candidate,
    currentContentHash,
    prior: previousById.get(post.id),
    forceReview: post.reviewRequired === true,
  }))
}

const allGenerated = [...generated, ...activityGenerated]
const generatedById = new Map(allGenerated.map((item) => [item.id, item]))
const preserved = (previous.items || []).filter((item) => !generatedById.has(item.id))
const manifest = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  automationMode: 'production',
  killSwitch: true,
  destination: {
    platform: 'facebook',
    pageId: '111009258047115',
    pageUrl: 'https://www.facebook.com/scienceeducationcenter',
    graphApiVersion: 'v25.0',
  },
  cadence: { timezone: 'Asia/Yangon', weeklyPosts: 3, note: 'Mon/Wed 20:00 and Sat 10:00' },
  items: [...preserved, ...allGenerated],
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
console.log(JSON.stringify({ generated: generated.length, activityGenerated: activityGenerated.length, totalQueue: manifest.items.length, outputDir, activityCampaignDir, manifestFile, calendarFile, galleryFile }, null, 2))
