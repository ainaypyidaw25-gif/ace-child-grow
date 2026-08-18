import { activity, guide, milestone, printable, type Bilingual, type SeedItem } from '../../types';
import { kb } from '../infant/editorial';

const b = (mm: string, en: string): Bilingual => ({ mm, en });
type Skill = [domain: string, title: Bilingual, observe: Bilingual];
type GuideFocus = [domain: string, focus: Bilingual, daily: Bilingual];
type Play = [slug: string, title: Bilingual, goal: Bilingual, materials: Bilingual, step: Bilingual, safety: Bilingual, domains: string[]];
type Band = { key: string; mm: string; en: string; skills: Skill[]; guides: GuideFocus[]; play: Play[] };
type GuideEditorial = {
  observation: Bilingual;
  weekly: Bilingual;
  tip: Bilingual;
  faq: { q: Bilingual; a: Bilingual };
  redFlag: Bilingual;
  referral: Bilingual;
  encouragement: Bilingual;
};

const WHY: Record<string, Bilingual> = {
  gross_motor: b('ခန္ဓာကိုယ် ဟန်ချက်နှင့် ရွေ့လျားမှုကို အားပေးသည်။', 'Supports balance and whole-body movement.'),
  fine_motor: b('လက်နှင့် မျက်စိ ပူးပေါင်းလုပ်ဆောင်မှုကို တိုးတက်စေသည်။', 'Builds hand–eye coordination.'),
  speech: b('အသံထွက်နှင့် စကားပြောနိုင်မှု တိုးလာခြင်းကို ဖော်ပြသည်။', 'Shows growing speech production.'),
  language: b('စကားနားလည်မှုနှင့် မိမိလိုအပ်ချက် ပြောပြနိုင်မှုကို အားပေးသည်။', 'Supports understanding and expressing needs.'),
  communication: b('အခြားသူနှင့် အပြန်အလှန် ဆက်သွယ်နိုင်မှုကို တိုးစေသည်။', 'Builds back-and-forth communication.'),
  cognitive: b('မှတ်ဉာဏ်၊ အမျိုးအစားခွဲခြားမှုနှင့် သင်ယူမှုကို အားပေးသည်။', 'Supports memory, sorting, and learning.'),
  social: b('အခြားသူများနှင့် အတူကစားပြီး အလှည့်ကျတတ်ရန် ကူညီသည်။', 'Helps with shared play and turn-taking.'),
  emotional: b('ခံစားချက်ကို သိရှိပြီး အကူအညီဖြင့် ထိန်းညှိတတ်ရန် ကူညီသည်။', 'Helps identify and regulate feelings with support.'),
  self_help: b('နေ့စဉ်လုပ်ငန်းများတွင် ကိုယ်တိုင်ပါဝင်နိုင်မှုကို တိုးစေသည်။', 'Builds participation in everyday self-care.'),
  play: b('စိတ်ကူးယဉ်မှု၊ စူးစမ်းမှုနှင့် သင်ယူမှုကို ကစားရင်း အားပေးသည်။', 'Supports imagination, exploration, and learning through play.'),
};

const GUIDE_SAFETY: Record<string, Bilingual> = {
  nutrition: b('ထိုင်လျက်စားစေပြီး အမြဲစောင့်ကြည့်ပါ။ မျိုချရခက်သော အစားအစာကို အသက်အရွယ်နှင့် ကိုက်ညီအောင် ပြင်ဆင်ပါ။', 'Seat and supervise the child. Prepare choking-risk foods in an age-appropriate way.'),
  sleep: b('အိပ်ဆေး သို့မဟုတ် အိပ်စေသောဆေးကို ကျန်းမာရေးပညာရှင် မညွှန်ကြားဘဲ မပေးပါနှင့်။', 'Do not give sleep medicines unless directed by a qualified health professional.'),
  safety: b('ကလေးကို ရေ၊ လမ်းမ၊ မီးဖိုနှင့် အမြင့်နေရာအနီး တစ်ယောက်တည်း မထားပါနှင့်။', 'Never leave the child alone near water, traffic, cooking areas, or heights.'),
  daily_routine: b('ကိုယ်တိုင်လုပ်ခွင့်ပေးသော်လည်း သွားတိုက်ခြင်း၊ ရေချိုးခြင်းနှင့် လမ်းကူးခြင်းကို လူကြီးက ကြီးကြပ်ပါ။', 'Encourage independence while supervising brushing, bathing, and road crossing.'),
  play: b('အသက်အရွယ်သင့် ကစားစရာကိုသာ သုံးပြီး အစိတ်အပိုင်းငယ်များ မရှိကြောင်း စစ်ပါ။', 'Use age-appropriate toys and check for detachable small parts.'),
};

const GUIDE_SOURCES: Record<string, string[]> = {
  nutrition: ['tb-bright-futures-4e-2017', 'tb-caring-birth-to-5-8e-2024', 'who-growth-standards-2006', 'who-child-growth-standards-qa-2025'],
  sleep: ['who-pa-sleep-under5-2019', 'jr-aasm-bedtime-2006', 'tb-caring-birth-to-5-8e-2024'],
  safety: ['aap-drowning-2021', 'tb-bright-futures-4e-2017', 'cdc-positive-parenting-toddlers-2026'],
  daily_routine: ['tb-bright-futures-4e-2017', 'aap-oral-health-2023', 'jr-aasm-bedtime-2006'],
  play: ['aap-power-of-play-2018', 'who-care-for-child-development-2012', 'tb-caring-birth-to-5-8e-2024'],
};

const ACTIVITY_SOURCES = ['aap-power-of-play-2018', 'who-care-for-child-development-2012', 'cdc-milestones-2026'];

const GUIDE_EDITORIAL: Record<string, GuideEditorial> = {
  nutrition: {
    observation: b('သုံးရက်ခန့် စားချိန်၊ စားသည့်အမျိုးအစားနှင့် ကလေး၏ ဆာလောင်/ဝပြီ အချက်ပြမှုကို မှတ်သားပါ။', 'For about three days, note meal timing, variety, and the child’s hunger and fullness cues.'),
    weekly: b('ဒီတစ်ပတ်တွင် အစားအစာအုပ်စုတစ်ခုစီမှ အမျိုးအစားအသစ် သို့မဟုတ် မကြာခဏမစားသည့်အရာတစ်မျိုးကို ဖိအားမပေးဘဲ ပေးကြည့်ပါ။', 'This week, calmly offer one new or less-familiar food from a food group without pressure.'),
    tip: b('မိဘက ဘာစားမည်၊ ဘယ်အချိန်စားမည်ကို စီစဉ်ပေးပြီး ကလေးက မည်မျှစားမည်ကို ဆုံးဖြတ်ခွင့်ပေးပါ။', 'The caregiver decides what and when to serve; let the child decide how much to eat.'),
    faq: { q: b('အစားအစာအသစ်ကို မစားလျှင် ဘာလုပ်ရမလဲ။', 'What if my child refuses a new food?'), a: b('အတင်းမကျွေးဘဲ ပမာဏအနည်းငယ်ကို နောက်တစ်ကြိမ် ပြန်ပေးပါ။ အစားအစာအသစ်ကို လက်ခံရန် အကြိမ်များစွာ လိုနိုင်သည်။', 'Do not force it. Offer a small amount again another time; acceptance may take many exposures.') },
    redFlag: b('အစာ သို့မဟုတ် ရေမျိုတိုင်း မကြာခဏ ချောင်းဆိုးခြင်း၊ တစ်ဆို့ခြင်း၊ ကိုယ်အလေးချိန် မတိုးခြင်း သို့မဟုတ် အစားအစာအမျိုးအစား အလွန်နည်းသွားခြင်း။', 'Frequent coughing or choking with food or drink, poor weight gain, or an extremely restricted food range.'),
    referral: b('စားသောက်ခြင်း၊ မျိုချခြင်း သို့မဟုတ် ကြီးထွားမှု စိုးရိမ်ပါက ကလေးဆရာဝန် သို့မဟုတ် သင့်လျော်သော ကျန်းမာရေးပညာရှင်နှင့် ဆွေးနွေးပါ။', 'Discuss feeding, swallowing, or growth concerns with a paediatrician or appropriate health professional.'),
    encouragement: b('ပမာဏထက် အစားအစာမျိုးစုံကို အေးဆေးစွာ ထပ်ခါပေးနိုင်ခြင်းကို ဦးစားပေးပါ။', 'Focus on calm, repeated exposure to varied foods rather than the amount eaten.'),
  },
  sleep: {
    observation: b('တစ်ပတ်ခန့် အိပ်ချိန်၊ နိုးချိန်၊ နေ့ခင်းအိပ်ချိန်နှင့် ညနိုးမှုကို မှတ်သားပြီး တူညီသည့်ပုံစံ ရှိမရှိ ကြည့်ပါ။', 'For about a week, note bedtime, waking, naps, and night waking to look for a pattern.'),
    weekly: b('ဒီတစ်ပတ် အိပ်မီလုပ်ရိုးလုပ်စဉ်ကို တူညီသည့်အချိန်တွင် အဆင့်တိုတိုဖြင့် ဆက်လုပ်ပါ။', 'This week, repeat the same short bedtime sequence at a consistent time.'),
    tip: b('အိပ်မီအချိန်တွင် ဖန်သားပြင်ပိတ်ပြီး အလင်းလျှော့ကာ စာဖတ်ခြင်း သို့မဟုတ် သီချင်းဆိုခြင်းကို ရွေးပါ။', 'Before bed, turn off screens, dim the light, and choose a book or quiet song.'),
    faq: { q: b('ညအိပ်ချိန် တည်ငြိမ်ရန် ဘယ်လောက်ကြာနိုင်သလဲ။', 'How long can a bedtime routine take to settle?'), a: b('ကလေးတစ်ဦးနှင့်တစ်ဦး ကွာနိုင်သည်။ တူညီသည့်အဆင့်များကို တဖြည်းဖြည်း ပြန်လုပ်ပြီး နေ့စဉ်အိပ်ချိန်ကို အလွန်မကွာစေပါနှင့်။', 'Children vary. Repeat the same steps gradually and keep daily bedtime reasonably consistent.') },
    redFlag: b('အိပ်နေစဉ် အသက်ရှူခက်ခြင်း၊ အသက်ရှူရပ်သလိုဖြစ်ခြင်း၊ နေ့ဘက် အလွန်အမင်း ငိုက်မျဉ်းခြင်း သို့မဟုတ် အိပ်ရေးပြဿနာက နေ့စဉ်ဘဝကို ဆက်တိုက်ထိခိုက်ခြင်း။', 'Breathing difficulty or pauses during sleep, extreme daytime sleepiness, or persistent sleep problems disrupting daily life.'),
    referral: b('အသက်ရှူမှု သို့မဟုတ် ဆက်တိုက်အိပ်ရေးပြဿနာ စိုးရိမ်ပါက ကလေးဆရာဝန်နှင့် ဆွေးနွေးပါ။ အသက်ရှူမဝပါက အရေးပေါ်အကူအညီယူပါ။', 'Discuss breathing or persistent sleep concerns with a paediatrician; seek emergency help for severe breathing difficulty.'),
    encouragement: b('တည်ငြိမ်သော အိပ်မီအလေ့အထကို ပြီးပြည့်စုံအောင်မဟုတ်ဘဲ နေ့တိုင်း ပြန်လုပ်နိုင်အောင် ရည်ရွယ်ပါ။', 'Aim for a bedtime routine you can repeat, not a perfect routine.'),
  },
  safety: {
    observation: b('ကလေးအမြင့်မှ အိမ်နှင့် အပြင်ကစားနေရာကို လိုက်ကြည့်ပြီး ရေ၊ မီး၊ လမ်းမ၊ ပြတင်းပေါက်၊ ကြိုးနှင့် ဆေးဝါးအန္တရာယ်ကို စစ်ပါ။', 'Inspect home and play areas from the child’s height for water, burn, traffic, window, cord, and medicine hazards.'),
    weekly: b('ဒီတစ်ပတ် အခန်းတစ်ခန်း သို့မဟုတ် အပြင်ကစားနေရာတစ်ခုကို ဘေးကင်းရေးစာရင်းဖြင့် ပြန်စစ်ပါ။', 'This week, recheck one room or outdoor play area with a safety list.'),
    tip: b('“မလုပ်နဲ့” ဟုသာ မပြောဘဲ အန္တရာယ်ကို လူကြီးက ဖယ်ရှားပြီး ဘေးကင်းသည့် အစားထိုးလုပ်ဆောင်ချက် ပြပါ။', 'Do not rely only on “no”; remove the hazard and show a safe alternative.'),
    faq: { q: b('ကလေးက စည်းကမ်းနားလည်ရင် အနီးကပ်ကြီးကြပ်ဖို့ လိုသေးလား။', 'Does a child who understands rules still need close supervision?'), a: b('လိုပါသည်။ ဤအရွယ်ကလေးများသည် အန္တရာယ်ကို အမြဲမခန့်မှန်းနိုင်သေးသဖြင့် ရေ၊ လမ်းမ၊ မီးနှင့် အမြင့်နေရာအနီး လူကြီးက အနီးကပ်ကြီးကြပ်ရပါမည်။', 'Yes. Young children cannot reliably judge danger, so adults must stay close near water, traffic, heat, and heights.') },
    redFlag: b('ခလုတ်ဘက်ထရီ၊ ဆေးဝါး သို့မဟုတ် အဆိပ်ဖြစ်နိုင်သောပစ္စည်း မျိုမိခြင်း၊ ရေနစ်လုဖြစ်ခြင်း၊ မီးလောင်ဒဏ်ရာ သို့မဟုတ် ပြင်းထန်သော ထိခိုက်ဒဏ်ရာ။', 'Swallowing a button battery, medicine, or poison; a drowning incident; a burn; or a serious injury.'),
    referral: b('အရေးပေါ်အန္တရာယ် သို့မဟုတ် ပြင်းထန်ဒဏ်ရာရှိပါက ချက်ချင်း အရေးပေါ်ဆေးကုသမှု ရယူပါ။', 'Seek emergency medical care immediately for a serious hazard exposure or injury.'),
    encouragement: b('အန္တရာယ်ကို ကြိုဖယ်ရှားခြင်းက ကလေးကို လွတ်လပ်စွာ စူးစမ်းခွင့်ပေးနိုင်သည့် အကောင်းဆုံးနည်းဖြစ်သည်။', 'Removing hazards in advance creates safer freedom to explore.'),
  },
  daily_routine: {
    observation: b('နံနက်၊ အစားစားပြီးနောက်နှင့် ညအိပ်မီ လုပ်ရိုးလုပ်စဉ်ထဲမှ ကလေးကိုယ်တိုင်လုပ်နိုင်သည့် အဆင့်ကို မှတ်သားပါ။', 'Notice which steps the child can do in morning, after-meal, and bedtime routines.'),
    weekly: b('ဒီတစ်ပတ် သွားတိုက်၊ အဝတ်ဝတ် သို့မဟုတ် ပစ္စည်းသိမ်းခြင်းထဲမှ အဆင့်တစ်ခုကို ပုံမှန်လေ့ကျင့်ပါ။', 'This week, practise one consistent step in brushing, dressing, or tidying.'),
    tip: b('လုပ်ရမည့်အဆင့်ကို တစ်ခုပြီးတစ်ခု တိုတိုပြောပြီး ကလေးကြိုးစားရန် အချိန်ပေးပါ။', 'Give one short step at a time and allow time for the child to try.'),
    faq: { q: b('ကိုယ်တိုင်လုပ်တာ နှေးနေလျှင် လူကြီးက အကုန်လုပ်ပေးသင့်လား။', 'Should an adult take over when self-care is slow?'), a: b('အချိန်ရသည့်အခါ ကလေးလုပ်နိုင်သည့်အပိုင်းကို စောင့်ပေးပြီး လိုသည့်အဆင့်ကိုသာ ကူညီပါ။', 'When time allows, wait for the part the child can do and help only with the step that is needed.') },
    redFlag: b('ယခင်က ကိုယ်တိုင်လုပ်နိုင်သော နေ့စဉ်အရည်အချင်းများ ပျောက်ဆုံးခြင်း သို့မဟုတ် လှုပ်ရှားမှု၊ မျိုချမှုကြောင့် နေ့စဉ်အလုပ်များ မလုပ်နိုင်ခြင်း။', 'Loss of previously acquired self-care skills or movement/swallowing difficulty that prevents daily activities.'),
    referral: b('နေ့စဉ်အရည်အချင်း ပျောက်ဆုံးခြင်း သို့မဟုတ် လုပ်ဆောင်နိုင်မှုကို ဆက်တိုက်ထိခိုက်သည့်အခက်အခဲရှိပါက ကလေးဆရာဝန် သို့မဟုတ် သင့်လျော်သောပညာရှင်နှင့် ဆွေးနွေးပါ။', 'Discuss lost skills or persistent functional difficulty with a paediatrician or appropriate professional.'),
    encouragement: b('ပြီးမြောက်မှုထက် ကိုယ်တိုင်ပါဝင်ကြိုးစားမှုကို ချီးကျူးပါ။', 'Praise participation and effort rather than perfect completion.'),
  },
  play: {
    observation: b('ကလေးက ဘယ်ကစားနည်းကို ရွေးသည်၊ ဘယ်လောက်ကြာ ပါဝင်သည်နှင့် လူကြီး/ကလေးနှင့် ဘယ်လို အပြန်အလှန်ကစားသည်ကို ကြည့်ပါ။', 'Notice what play the child chooses, how long they engage, and how they interact with adults or children.'),
    weekly: b('ဒီတစ်ပတ် ကလေးဦးဆောင်သည့် ကစားချိန်တိုတစ်ခုနှင့် အပြင်လှုပ်ရှားကစားချိန်တစ်ခု စီစဉ်ပါ။', 'This week, plan one short child-led play time and one active outdoor play time.'),
    tip: b('ကလေးကစားပုံကို ချက်ချင်းပြင်မပေးဘဲ ကြည့်၊ အတုယူ၊ စကားဖြည့်ပြီး အလှည့်ကျကစားပါ။', 'Instead of correcting play immediately, watch, imitate, add language, and take turns.'),
    faq: { q: b('ကလေးက တစ်မျိုးတည်းကို ထပ်ခါကစားလျှင် အဆင်ပြေလား။', 'Is repeated play with the same thing okay?'), a: b('ထပ်ခါကစားခြင်းက သင်ယူမှုကို အားပေးနိုင်သည်။ ကလေးစိတ်ဝင်စားမှုနောက်လိုက်ပြီး အဆင့်သေးသေးတစ်ခု သို့မဟုတ် စကားအသစ်တစ်လုံး ထည့်ပေးပါ။', 'Repetition can support learning. Follow the child’s interest and add one small step or new word.') },
    redFlag: b('လူများ သို့မဟုတ် ကစားစရာများကို ဆက်တိုက် စိတ်မဝင်စားခြင်း၊ ယခင်ကရှိသည့် ကစား/ဆက်သွယ်အရည်အချင်း ပျောက်ဆုံးခြင်း။', 'Persistent lack of interest in people or play, or loss of previously acquired play or communication skills.'),
    referral: b('ကစားခြင်း၊ ဆက်သွယ်ခြင်း သို့မဟုတ် အရည်အချင်းပျောက်ဆုံးမှု စိုးရိမ်ပါက ကလေးဆရာဝန် သို့မဟုတ် ဖွံ့ဖြိုးမှုဆိုင်ရာပညာရှင်နှင့် ဆွေးနွေးပါ။', 'Discuss concerns about play, communication, or lost skills with a paediatrician or developmental professional.'),
    encouragement: b('နေ့စဉ် မိနစ်အနည်းငယ် အာရုံစိုက်ပြီး အတူကစားခြင်းက ဈေးကြီးသော ကစားစရာများထက် ပိုအရေးကြီးသည်။', 'A few focused minutes of shared play each day matter more than expensive toys.'),
  },
};

const PRESCHOOL_SOCIAL: Record<string, [Bilingual, Bilingual]> = {
  '2_5y': [b('အခြားကလေးအနားတွင် ကစားပြီး တစ်ခါတစ်ရံ အတူကစားခြင်း', 'Plays beside and sometimes with other children'), b('အခြားကလေးအနားတွင် ကစားပြီး အချိန်တိုအတွင်း အတူကစားရန် စတင်ပါသလား။', 'Plays beside other children and sometimes joins them briefly?')],
  '3y': [b('အခြားကလေးကို သတိပြု၍ အတူကစားခြင်း', 'Notices other children and joins play'), b('အခြားကလေးများကို သတိပြုမိပြီး သူတို့နှင့် အတူကစားရန် ဝင်ပါသလား။', 'Notices other children and joins them in play?')],
  '3_5y': [b('အကူအညီဖြင့် အလှည့်တို စောင့်ခြင်း', 'Waits briefly for a turn with support'), b('လူကြီးသတိပေးမှုဖြင့် ကစားစရာတစ်ခုအတွက် အလှည့်တို စောင့်နိုင်ပါသလား။', 'With an adult reminder, waits briefly for a turn with a toy?')],
  '4y': [b('အတူကစားရန် မေးပြီး အခန်းကဏ္ဍ မျှဝေခြင်း', 'Asks to join and shares pretend-play roles'), b('အခြားကလေးနှင့် အတူကစားရန် မေးပြီး အတုယူကစားရာတွင် အခန်းကဏ္ဍ မျှဝေပါသလား။', 'Asks to play and shares roles during pretend play?')],
  '4_5y': [b('ဘုံရည်မှန်းချက်တစ်ခုအတွက် ပူးပေါင်းကစားခြင်း', 'Cooperates toward a shared play goal'), b('အခြားကလေးနှင့် အတူ တည်ဆောက်ခြင်း သို့မဟုတ် ဇာတ်လမ်းကစားခြင်းကို စီစဉ်ပါသလား။', 'Plans a building or pretend-play idea with another child?')],
  '5y': [b('ကစားပွဲစည်းမျဉ်းကို လိုက်နာပြီး အလှည့်ကျကစားခြင်း', 'Follows game rules and takes turns'), b('ရိုးရှင်းသော ကစားပွဲတွင် စည်းမျဉ်းကို လိုက်နာပြီး အလှည့်စောင့်နိုင်ပါသလား။', 'Follows simple game rules and waits for a turn?')],
};

const PRESCHOOL_PLAY: Record<string, Play[]> = {
  '2_5y': [
    ['move_path_2_5y', b('မျဉ်းကျော် လှမ်းကစားခြင်း', 'Step-over path'), b('ခြေလှမ်းထိန်းချုပ်မှုနှင့် ဟန်ချက်', 'Step control and balance'), b('စက္ကူတိပ်မျဉ်း နှစ်ကြောင်း', 'Two paper-tape lines'), b('မျဉ်းတစ်ကြောင်းမှ တစ်ကြောင်းသို့ လှမ်းကာ “ရပ်”၊ “သွား” ဟု တစ်ဆင့်စီ ပြောပါ။', 'Step from one line to the next using one cue at a time: “stop” and “go.”'), b('ချော်မလဲနိုင်သော ကြမ်းပြင်တွင် လက်လှမ်းမီအနီးမှ ကြီးကြပ်ပါ။', 'Supervise within reach on a non-slip floor.'), ['gross_motor', 'play']],
    ['picture_story_2_5y', b('ပုံနှစ်ပုံကို အမည်ပေးခြင်း', 'Name two pictures'), b('စကားလုံးနှင့် ပုံချိတ်ဆက်မှု', 'Connecting words and pictures'), b('ရင်းနှီးသော ပုံနှစ်ပုံ', 'Two familiar pictures'), b('ပုံတစ်ပုံစီကို ရွေးခိုင်းပြီး အရာဝတ္ထုနှင့် လုပ်ဆောင်ချက်ကို စကားတိုဖြင့် ပြောပါ။', 'Let the child choose each picture and name the object or action in a short phrase.'), b('အဖြေမှားသည်ဟု မပြောဘဲ ကလေးပြောသည့်စကားကို တိုးချဲ့ပေးပါ။', 'Do not label answers wrong; expand the child’s words.'), ['language', 'cognitive']],
    ['helper_sort_2_5y', b('ခြေအိတ်တွဲရှာခြင်း', 'Find matching socks'), b('တူရာရှာခြင်းနှင့် အိမ်မှုပါဝင်မှု', 'Matching and helping at home'), b('သန့်ရှင်းသော ခြေအိတ် ၃ တွဲ', 'Three pairs of clean socks'), b('တူသောခြေအိတ်နှစ်စုံကို ရှာပြီး ဘေးချင်းကပ်ထားခိုင်းပါ။', 'Find matching socks and place each pair together.'), b('ကလေးပါးစပ်ထဲဝင်နိုင်သော ပစ္စည်းငယ် မသုံးပါနှင့်။', 'Do not use small items that can fit in the child’s mouth.'), ['cognitive', 'self_help']],
  ],
  '3y': [
    ['move_path_3y', b('နှစ်ဆင့် လှုပ်ရှားကစားခြင်း', 'Two-step movement game'), b('နှစ်ဆင့်ညွှန်ကြားချက်နှင့် ကိုယ်လက်ညှိနှိုင်းမှု', 'Two-step directions and coordination'), b('စက္ကူတိပ်မျဉ်း', 'A paper-tape line'), b('“မျဉ်းပေါ်လျှောက်ပြီး လက်ခုပ်တီး” ကဲ့သို့ နှစ်ဆင့်ကို အတူစမ်းပါ။', 'Try two linked steps such as “walk on the line, then clap.”'), b('နေရာလွတ်နှင့် ချော်မလဲသောကြမ်းပြင်ကို သုံးပါ။', 'Use a clear, non-slip floor.'), ['gross_motor', 'communication']],
    ['picture_story_3y', b('ဖြစ်ရပ်သုံးပုံ ပြောခြင်း', 'Tell a three-picture event'), b('အစ၊ အလယ်၊ အဆုံး စကားပြောမှု', 'Beginning-middle-end language'), b('နေ့စဉ်ဖြစ်ရပ် ပုံသုံးပုံ', 'Three pictures of a daily event'), b('ပုံများကိုကြည့်ပြီး “အရင်ဘာဖြစ်လဲ၊ ပြီးတော့ဘာလဲ” ဟု မေးပါ။', 'Ask, “What happened first, and what happened next?”'), b('ကလေး၏ စကားအဆင့်နှင့် ကိုက်ညီအောင် မေးခွန်းတိုသုံးပါ။', 'Use short questions suited to the child’s language level.'), ['language', 'cognitive']],
    ['helper_sort_3y', b('အရောင်တစ်မျိုးစီ ခွဲခြင်း', 'Sort by one color'), b('အရောင်ခွဲခြားမှုနှင့် အိမ်မှုပါဝင်မှု', 'Color sorting and helping'), b('အရောင်ကွဲ ပလတ်စတစ်ခွက် သို့မဟုတ် အဝတ်များ', 'Colored plastic cups or clothes'), b('အရောင်တစ်မျိုးကို စံပြပြီး ကျန်ပစ္စည်းများကို အရောင်အလိုက် ခွဲခိုင်းပါ။', 'Model one color group, then sort the rest by color.'), b('ဖန်၊ ချွန်ထက်သည့်ပစ္စည်း သို့မဟုတ် ဆေးဗူး မသုံးပါနှင့်။', 'Do not use glass, sharp items, or medicine containers.'), ['cognitive', 'self_help']],
  ],
  '3_5y': [
    ['move_path_3_5y', b('ခုန်–လှည့်–ရပ် လမ်းကြောင်း', 'Jump-turn-stop path'), b('ဟန်ချက်ပြန်ထိန်းမှုနှင့် နားထောင်မှု', 'Balance recovery and listening'), b('စက္ကူတိပ် အမှတ်သုံးခု', 'Three paper-tape markers'), b('အမှတ်များတွင် ခုန်၊ လှည့်၊ ရပ် လုပ်ဆောင်ချက်ကို အစီအစဉ်ပြောင်း၍ ပြောပါ။', 'Call out jump, turn, and stop at the markers in changing order.'), b('ပရိဘောဂနှင့် ဝေးသော ချော်မလဲသည့်နေရာတွင် ကစားပါ။', 'Play on a non-slip surface away from furniture.'), ['gross_motor', 'play']],
    ['picture_story_3_5y', b('နေ့စဉ်လုပ်ရိုးလုပ်စဉ် ပုံစီခြင်း', 'Sequence a daily routine'), b('ဖြစ်ရပ်အစီအစဉ်နှင့် စကားပြောမှု', 'Event sequence and language'), b('သွားတိုက်ခြင်းကဲ့သို့ လုပ်ရိုးလုပ်စဉ်ပုံသုံးပုံ', 'Three pictures of a routine such as brushing'), b('ပုံများကို ရောပြီး ကလေးကို အစီအစဉ်ပြန်စီကာ ပြောပြခိုင်းပါ။', 'Mix the pictures, then invite the child to order and describe them.'), b('အမှားပြင်ပေးမည့်အစား “နောက်ဘာဖြစ်မလဲ” ဟု မေးပါ။', 'Instead of correcting, ask, “What happens next?”'), ['language', 'cognitive']],
    ['helper_sort_3_5y', b('အသုံးအလိုက် နှစ်စုခွဲခြင်း', 'Sort into two uses'), b('အမျိုးအစားခွဲခြင်းနှင့် ရှင်းပြမှု', 'Categorizing and explaining'), b('သန့်ရှင်းသော မီးဖိုချောင်နှင့် အဝတ်အစားပစ္စည်းကြီးများ', 'Large safe kitchen and clothing items'), b('ပစ္စည်းများကို “မီးဖိုချောင်သုံး” နှင့် “အဝတ်ဝတ်ရာသုံး” ဟု နှစ်စုခွဲပြီး ဘာကြောင့်လဲ မေးပါ။', 'Sort into “kitchen” and “clothing” groups and ask why.'), b('ချွန်ထက်၊ ကွဲလွယ် သို့မဟုတ် မျိုချနိုင်သောပစ္စည်း မသုံးပါနှင့်။', 'Avoid sharp, breakable, or swallowable items.'), ['cognitive', 'self_help']],
  ],
  '4y': [
    ['move_path_4y', b('ဘောလုံးယူ အတားအဆီးလမ်းကြောင်း', 'Ball-carry obstacle path'), b('ဟန်ချက်၊ လမ်းကြောင်းစီစဉ်မှုနှင့် လက်ထိန်းချုပ်မှု', 'Balance, motor planning, and hand control'), b('ဘောလုံးပျော့နှင့် စက္ကူတိပ်', 'A soft ball and paper tape'), b('ဘောလုံးကိုကိုင်၍ မျဉ်းကွေ့အတိုင်း လျှောက်ပြီး အဆုံးတွင် အဖော်ထံ လှိမ့်ပေးပါ။', 'Carry the ball along a curved line, then roll it to a partner.'), b('ပျော့သောဘောလုံးသုံးပြီး လမ်းကြောင်းကို ပရိဘောဂမှ ရှင်းထားပါ။', 'Use a soft ball and clear the path of furniture.'), ['gross_motor', 'problem_solving']],
    ['picture_story_4y', b('အစနှင့်အဆုံးပါ ဇာတ်လမ်း', 'Story with a beginning and ending'), b('ဇာတ်လမ်းဖွဲ့မှုနှင့် စကားပြောမှု', 'Narrative and language'), b('လူနှင့်နေရာပါ ပုံသုံးပုံ', 'Three pictures showing people and places'), b('ဇာတ်ကောင်၊ ဖြစ်ရပ်နှင့် အဆုံးသတ်ကို ကလေးစိတ်ကူးဖြင့် ပြောခိုင်းပါ။', 'Invite the child to describe a character, an event, and an ending.'), b('စိတ်ကူးကို လက်ခံပြီး လိုအပ်မှ စကားလုံးတစ်လုံးစီ ဖြည့်ပေးပါ။', 'Accept the child’s ideas and add only an occasional helpful word.'), ['language', 'play']],
    ['helper_sort_4y', b('အခန်းကဏ္ဍပါ အိမ်မှုကစားခြင်း', 'Pretend household roles'), b('စီစဉ်မှုနှင့် ပူးပေါင်းလုပ်ဆောင်မှု', 'Planning and cooperation'), b('သန့်ရှင်းသော အဝတ်နှင့် ပလတ်စတစ်ခွက်', 'Clean clothes and plastic cups'), b('“အဝတ်ခေါက်သူ”၊ “ခွက်စီသူ” အခန်းကဏ္ဍရွေးပြီး အလုပ်အစီအစဉ်ကို အတူပြောပါ။', 'Choose roles such as clothes folder and cup arranger, then plan the steps together.'), b('ကွဲလွယ်၊ ချွန်ထက် သို့မဟုတ် ဓာတုပစ္စည်းပါသောအရာ မသုံးပါနှင့်။', 'Avoid breakable, sharp, or chemical-containing items.'), ['social', 'self_help']],
  ],
  '4_5y': [
    ['move_path_4_5y', b('ခြေတစ်ဖက်ဟန်ချက် လမ်းကြောင်း', 'One-foot balance path'), b('ဟန်ချက်နှင့် လှုပ်ရှားမှုအစီအစဉ်', 'Balance and movement sequencing'), b('စက္ကူတိပ်အမှတ်များ', 'Paper-tape markers'), b('အမှတ်တစ်ခုစီတွင် ခြေတစ်ဖက်ပေါ် ခဏရပ်ပြီး နောက်အမှတ်သို့ လျှောက်ပါ။', 'Pause briefly on one foot at each marker, then walk to the next.'), b('လူကြီးအနီးတွင် ပြားညီ၊ ချော်မလဲသည့်နေရာ၌ ကစားပါ။', 'Play near an adult on a flat, non-slip surface.'), ['gross_motor', 'play']],
    ['picture_story_4_5y', b('ပုံလေးပုံ အစီအစဉ်ဇာတ်လမ်း', 'Four-picture sequence story'), b('အစီအစဉ်မှတ်ဉာဏ်နှင့် စကားပြောမှု', 'Sequence memory and language'), b('ဖြစ်ရပ်ဆက်စပ်သည့် ပုံလေးပုံ', 'Four pictures from one event'), b('ပုံလေးပုံကို စီပြီး “အရင်၊ ပြီးတော့၊ နောက်ဆုံး” စကားလုံးဖြင့် ပြောခိုင်းပါ။', 'Order four pictures and retell using “first,” “then,” and “last.”'), b('ကလေးမသေချာလျှင် ရွေးချယ်စရာနှစ်ခုသာ ပေးပါ။', 'If the child is unsure, offer only two choices.'), ['language', 'cognitive']],
    ['helper_sort_4_5y', b('ခွဲပြီး ရေတွက်ကူညီခြင်း', 'Sort and count to help'), b('အမျိုးအစားခွဲခြင်း၊ ရေတွက်ခြင်းနှင့် ကိုယ်တိုင်လုပ်နိုင်မှု', 'Sorting, counting, and independence'), b('သန့်ရှင်းသော ဇွန်းကြီး သို့မဟုတ် ခြေအိတ်များ', 'Clean large spoons or socks'), b('အမျိုးအစားခွဲပြီး အစုတစ်စုလျှင် ၁ မှ ၅ အထိ ရေတွက်ပါ။', 'Sort into groups and count one to five in each group.'), b('အသုံးမပြုမီ ပစ္စည်းအရွယ်နှင့် သန့်ရှင်းမှုကို လူကြီးစစ်ပါ။', 'An adult should check item size and cleanliness first.'), ['cognitive', 'self_help']],
  ],
  '5y': [
    ['move_path_5y', b('ခုန်ပုံစံ မှတ်သားကစားခြင်း', 'Remember-the-hop pattern'), b('ဟန်ချက်၊ မှတ်ဉာဏ်နှင့် စည်းမျဉ်းလိုက်နာမှု', 'Balance, memory, and rule-following'), b('စက္ကူတိပ်အမှတ် လေးခု', 'Four paper-tape markers'), b('“ညာ–ဘယ်–နှစ်ခါ” ကဲ့သို့ ခုန်ပုံစံတိုတစ်ခု ပြပြီး ကလေးကို ပြန်လုပ်ခိုင်းပါ။', 'Model a short hop pattern such as “right-left-twice,” then invite the child to repeat it.'), b('အပြိုင်မလုပ်ဘဲ ကလေးပင်ပန်းလျှင် ရပ်နားပါ။', 'Do not make it a race; stop when the child is tired.'), ['gross_motor', 'cognitive']],
    ['picture_story_5y', b('ပြဿနာနှင့် ဖြေရှင်းချက်ပါ ဇာတ်လမ်း', 'Problem-and-solution story'), b('အကြောင်းအကျိုးနှင့် ဇာတ်လမ်းဖွဲ့မှု', 'Cause-and-effect and narrative'), b('စိတ်ကူးပုံသုံးပုံ သို့မဟုတ် လေးပုံ', 'Three or four imaginary-scene pictures'), b('ဇာတ်ကောင်မှာ ဘာပြဿနာရှိသလဲ၊ ဘယ်လိုဖြေရှင်းမလဲ၊ နောက်ဆုံးဘာဖြစ်လဲ မေးပါ။', 'Ask what problem the character has, how it could be solved, and what happens at the end.'), b('အဖြေတစ်မျိုးတည်း မတောင်းဘဲ ဘေးကင်းသော စိတ်ကူးများကို လက်ခံပါ။', 'Do not require one correct answer; accept safe, imaginative solutions.'), ['language', 'problem_solving']],
    ['helper_sort_5y', b('စည်းမျဉ်းရွေး ခွဲခြားကစားခြင်း', 'Choose-a-rule sorting'), b('အကြောင်းပြချက်၊ စီစဉ်မှုနှင့် တာဝန်ယူမှု', 'Reasoning, planning, and responsibility'), b('သန့်ရှင်းသော အိမ်သုံးပစ္စည်းကြီးများ', 'Large, clean household items'), b('ကလေးကို ခွဲမည့်စည်းမျဉ်းရွေးခိုင်းပြီး အုပ်စုတစ်စုစီကို ဘာကြောင့် အဲဒီလိုထားသလဲ ရှင်းပြခိုင်းပါ။', 'Let the child choose the sorting rule and explain why each item belongs in its group.'), b('ဖန်၊ ဆေးဝါး၊ ဓာတုပစ္စည်းနှင့် ချွန်ထက်သည့်ပစ္စည်း မသုံးပါနှင့်။', 'Do not use glass, medicines, chemicals, or sharp items.'), ['cognitive', 'self_help']],
  ],
};
export const OLDER_CONTENT_SOURCES: Record<string, string[]> = {};
const linked = (item: SeedItem, summary: string, sourceIds?: string[]): SeedItem => {
  if (sourceIds) OLDER_CONTENT_SOURCES[item.slug] = sourceIds;
  return kb(item, summary);
};

const bands: Band[] = [
  { key: '13_18m', mm: '၁၃–၁၈ လ', en: '13–18 months', skills: [
    ['fine_motor', b('ကစားတုံးနှစ်တုံးကို ထပ်တင်ခြင်း', 'Stacks two blocks'), b('ကစားတုံးကြီးနှစ်တုံးကို တစ်တုံးပေါ်တစ်တုံး တင်ကြည့်ပါသလား။', 'Tries to stack two large blocks?')],
    ['cognitive', b('အသုံးအဆောင်ကို မှန်ကန်စွာ သုံးခြင်း', 'Uses familiar objects appropriately'), b('ဖုန်း၊ ခွက် သို့မဟုတ် ဘီးကို အသုံးပြုပုံအတိုင်း အတုယူပါသလား။', 'Copies how a phone, cup, or brush is used?')],
    ['social', b('စိတ်ဝင်စားရာကို လက်ညှိုးထိုးပြခြင်း', 'Points to share interest'), b('စိတ်ဝင်စားသောအရာကို သင်ကြည့်စေရန် လက်ညှိုးထိုးပြပါသလား။', 'Points so you will look at something interesting?')],
    ['play', b('ရိုးရှင်းသော အတုယူကစားနည်း ကစားခြင်း', 'Begins simple pretend play'), b('အရုပ်ကို အစာကျွေးသလို ရိုးရှင်းစွာ အတုယူကစားပါသလား။', 'Pretends to feed a doll or toy?')],
  ], guides: [
    ['nutrition', b('မိသားစုစားသော အစားအစာကို နူးညံ့စွာ ပြင်ဆင်ပြီး အုပ်စုစုံ စားသုံးခွင့်ပေးပါ။', 'Offer varied family foods prepared in soft, safe textures.'), b('ဇွန်းနှင့် ခွက်ကို ကိုယ်တိုင်စမ်းသုံးခွင့်ပေးပါ။', 'Let the child practise with a spoon and open cup.')],
    ['sleep', b('နေ့ခင်းအိပ်ချိန်နှင့် ညအိပ်ချိန်ကို တည်ငြိမ်သော အစီအစဉ်ဖြင့် ချမှတ်ပါ။', 'Use a predictable nap and bedtime rhythm.'), b('အိပ်မီ စာဖတ်ခြင်း သို့မဟုတ် သီချင်းဆိုခြင်းကို တူညီစွာ ပြုလုပ်ပါ။', 'Repeat the same book or song before sleep.')],
    ['safety', b('လမ်းလျှောက်စပြုသောကလေးအတွက် လှေကား၊ ပရိဘောဂနှင့် ရေနေရာများကို ကာကွယ်ပါ။', 'Childproof stairs, furniture, and water hazards for a new walker.'), b('ကလေးအမြင့်မှ အခန်းတိုင်းကို ကြည့်ပြီး အန္တရာယ်ရှိရာများ ဖယ်ရှားပါ။', 'Check each room from the child’s height and remove hazards.')],
    ['daily_routine', b('စားချိန်၊ ကစားချိန်နှင့် အိပ်ချိန်ကို နေ့စဉ် ခန့်မှန်းနိုင်အောင် စီစဉ်ပါ။', 'Keep meals, play, and sleep reasonably predictable.'), b('ရိုးရှင်းသော ရွေးချယ်စရာနှစ်ခု ပေးပါ။', 'Offer two simple choices.')],
  ], play: [
    ['posting_big_shapes_13_18m', b('အပေါက်ထဲ ပုံသဏ္ဌာန်ကြီး ထည့်ကစားခြင်း', 'Post large shapes'), b('လက်ထိန်းချုပ်မှုနှင့် အကြောင်းအကျိုး နားလည်မှု', 'Hand control and cause-and-effect'), b('ဘူးကြီးနှင့် မျိုမချနိုင်သော အရာကြီးများ', 'A container and non-swallowable large objects'), b('အရာတစ်ခုစီကို အပေါက်ထဲထည့်ပြီး ပြန်ထုတ်ခိုင်းပါ။', 'Post each object, then empty the container together.'), b('အရာအားလုံးကို ကလေးပါးစပ်ထက် ကြီးစေရန် စစ်ပါ။', 'Ensure every object is larger than the child’s mouth.'), ['fine_motor', 'cognitive']],
    ['push_pull_walk_13_18m', b('တွန်းဆွဲ လမ်းလျှောက်ကစားခြင်း', 'Push-and-pull walk'), b('ဟန်ချက်နှင့် လမ်းလျှောက်ယုံကြည်မှု', 'Balance and walking confidence'), b('ခိုင်ခံ့သော တွန်းကစားစရာ', 'A stable push toy'), b('ပြားသောနေရာတွင် ဖြည်းဖြည်း တွန်းသွားစေပါ။', 'Let the child push slowly on a level surface.'), b('ဘီးပါလမ်းလျှောက်ကူကိရိယာ မသုံးဘဲ အနီးကပ်စောင့်ကြည့်ပါ။', 'Avoid seated baby walkers and supervise closely.'), ['gross_motor', 'play']],
    ['point_name_13_18m', b('ညွှန်ပြပြီး အမည်ပြောကစားခြင်း', 'Point and name'), b('စကားနားလည်မှုနှင့် ပူးတွဲအာရုံစိုက်မှု', 'Language and shared attention'), b('ပုံစာအုပ်', 'A picture book'), b('ကလေးညွှန်ပြသောပုံကို အမည်တိုတို ပြောပေးပါ။', 'Name each picture the child points to.'), b('ကလေးကို စကားပြောရန် ဖိအားမပေးပါနှင့်။', 'Do not pressure the child to repeat words.'), ['language', 'communication']],
  ]},
  { key: '19_24m', mm: '၁၉–၂၄ လ', en: '19–24 months', skills: [
    ['gross_motor', b('ဘောလုံးကို ကန်ခြင်း', 'Kicks a ball'), b('ဘောလုံးကြီးကို ရပ်လျက် ကန်ကြည့်ပါသလား။', 'Tries to kick a large ball while standing?')],
    ['fine_motor', b('စာရွက်ပေါ် ခြစ်ရေးခြင်း', 'Scribbles on paper'), b('ခဲတံရောင်ကြီးဖြင့် စာရွက်ပေါ် ခြစ်ရေးပါသလား။', 'Scribbles with a large crayon?')],
    ['speech', b('စကားလုံးအသစ်များ တိုးပြောခြင်း', 'Uses a growing set of words'), b('နေ့စဉ်သုံး ပစ္စည်းအမည်များ ပိုပြောလာပါသလား။', 'Uses more names for familiar things?')],
    ['self_help', b('ဇွန်းဖြင့် ကိုယ်တိုင်စားရန် ကြိုးစားခြင်း', 'Tries to eat with a spoon'), b('ပေကျံနိုင်သော်လည်း ဇွန်းဖြင့် ကိုယ်တိုင်စားကြည့်ပါသလား။', 'Tries to self-feed with a spoon, even messily?')],
  ], guides: [
    ['nutrition', b('အစားအစာအုပ်စုစုံကို အရွယ်သင့်အပိုင်းဖြင့် ပေးပြီး ကိုယ်တိုင်စားခွင့်ပေးပါ။', 'Offer varied foods in safe sizes and support self-feeding.'), b('မိသားစုနှင့်အတူ ထိုင်စားပြီး ဆာလောင်/ဝပြီ အချက်ပြမှုကို လေးစားပါ။', 'Eat together and respect hunger and fullness cues.')],
    ['sleep', b('နေ့ခင်းအိပ်ချိန်တစ်ကြိမ်နှင့် ညအိပ်ချိန်ကို ပုံမှန်နီးပါး ထားပါ။', 'Keep a broadly consistent nap and bedtime.'), b('အိပ်မီ မျက်နှာပြင်ပိတ်ပြီး ငြိမ်သက်သော လုပ်ရိုးလုပ်စဉ်သုံးပါ။', 'Turn screens off and use a calm bedtime routine.')],
    ['safety', b('တက်တတ်၊ ဖွင့်တတ်လာသောကလေးအတွက် ပြတင်းပေါက်၊ ဆေးနှင့် သန့်ရှင်းရေးပစ္စည်းကို သော့ခတ်ပါ။', 'Lock windows, medicines, and cleaning products as climbing increases.'), b('ပရိဘောဂကြီးများကို နံရံတွင် ခိုင်ခံ့စွာ တပ်ပါ။', 'Anchor heavy furniture securely to the wall.')],
    ['daily_routine', b('သန့်ရှင်းရေးနှင့် ပစ္စည်းသိမ်းခြင်းကို တစ်ဆင့်ချင်း အတူလုပ်ပါ။', 'Include the child in one-step tidy-up and care routines.'), b('“အရုပ်ကို ဘူးထဲထည့်ပါ” ကဲ့သို့ တစ်ဆင့်ညွှန်ကြားချက်ပေးပါ။', 'Use one-step directions such as “put the toy in the box.”')],
  ], play: [
    ['roll_kick_ball_19_24m', b('ဘောလုံး လှိမ့်ကန်ကစားခြင်း', 'Roll and kick a ball'), b('ဟန်ချက်နှင့် အလှည့်ကျကစားမှု', 'Balance and turn-taking'), b('ပျော့သော ဘောလုံးကြီး', 'A large soft ball'), b('အပြန်အလှန် လှိမ့်ပြီး နောက်မှ ကန်ကြည့်ပါ။', 'Roll it back and forth, then try gentle kicks.'), b('လှေကားနှင့် လမ်းမအနီး မကစားပါနှင့်။', 'Play away from stairs and traffic.'), ['gross_motor', 'social']],
    ['pretend_feed_19_24m', b('အရုပ်ကို အစာကျွေးကစားခြင်း', 'Pretend feeding'), b('စိတ်ကူးယဉ်ကစားမှုနှင့် စကားလုံးအသစ်', 'Pretend play and new words'), b('အရုပ်နှင့် ဇွန်းကြီး', 'A doll and large spoon'), b('အရုပ်ဆာနေတယ်ဟု ပြောပြီး ကလေးကို ကျွေးခိုင်းပါ။', 'Say the doll is hungry and invite the child to feed it.'), b('အစိတ်အပိုင်းငယ် မသုံးပါနှင့်။', 'Do not use small parts.'), ['play', 'language']],
    ['tidy_two_places_19_24m', b('နှစ်နေရာ ခွဲသိမ်းကစားခြင်း', 'Tidy into two places'), b('အမျိုးအစားခွဲခြင်းနှင့် နေ့စဉ်အလေ့အထ', 'Sorting and daily routine'), b('ဘူးကြီးနှစ်လုံးနှင့် အရုပ်ကြီးများ', 'Two bins and large toys'), b('ဘောလုံးကိုတစ်ဘူး၊ ကစားတုံးကိုတစ်ဘူး ထည့်ခိုင်းပါ။', 'Put balls in one bin and blocks in the other.'), b('လေးလံသောဘူး မသုံးပါနှင့်။', 'Do not use heavy containers.'), ['cognitive', 'self_help']],
  ]},
  { key: '2y', mm: '၂ နှစ်', en: '2 years', skills: [
    ['fine_motor', b('ကစားတုံးအနည်းငယ် ထပ်တင်ခြင်း', 'Builds a short block tower'), b('ကစားတုံးကြီး လေးတုံးခန့် ထပ်တင်ကြည့်ပါသလား။', 'Tries to stack about four large blocks?')],
    ['language', b('ပုံစာအုပ်ထဲက ပစ္စည်းကို ညွှန်ပြခြင်း', 'Points to named pictures'), b('ပစ္စည်းအမည်မေးလျှင် သက်ဆိုင်ရာပုံကို ညွှန်ပြပါသလား။', 'Points to a picture when it is named?')],
    ['social', b('အခြားကလေးအနားတွင် ကစားခြင်း', 'Plays alongside other children'), b('အခြားကလေးအနားတွင် ကိုယ်ပိုင်ကစားစရာဖြင့် ကစားပါသလား။', 'Plays near other children with their own toys?')],
    ['play', b('ပစ္စည်းကို အခြားအရာအဖြစ် အတုယူသုံးခြင်း', 'Uses objects in pretend play'), b('ကစားတုံးကို ဖုန်းကဲ့သို့ အသုံးပြုကစားပါသလား။', 'Pretends a block is a phone or another object?')],
  ], guides: [
    ['nutrition', b('ပုံမှန်စားချိန်ထားပြီး အုပ်စုစုံပေးကာ မည်မျှစားမည်ကို ကလေးဆုံးဖြတ်ခွင့်ပေးပါ။', 'Keep regular meals, offer variety, and let the child decide how much to eat.'), b('အချိုရည်အစား ရေနှင့် သင့်တော်သော နို့ကိုပေးပါ။', 'Offer water and suitable milk instead of sugary drinks.')],
    ['sleep', b('ညအိပ်ချိန်မတိုင်မီ တူညီသော အဆင့်တိုများ အသုံးပြုပါ။', 'Use the same short sequence before bed.'), b('ရေချိုး၊ သွားတိုက်၊ စာဖတ်၊ အိပ် ဟူသောအစီအစဉ်ကို လိုက်နာပါ။', 'Follow a bath, brush, book, bed sequence.')],
    ['safety', b('ပြေးတတ်လာသောကလေးအတွက် လမ်းမ၊ ရေကန်နှင့် မီးဖိုအန္တရာယ်ကို ကြိုကာကွယ်ပါ။', 'Plan ahead for traffic, water, and burn hazards as running begins.'), b('အပြင်ထွက်တိုင်း လူကြီးလက်ကိုင်ခြင်းကို လေ့ကျင့်ပါ။', 'Practise holding an adult’s hand outdoors.')],
    ['play', b('အတုယူကစားခြင်း၊ ကစားတုံးနှင့် ပုံစာအုပ်ကို နေ့စဉ် အလှည့်ကျကစားပါ။', 'Rotate pretend play, blocks, and picture books each day.'), b('ကလေးဦးဆောင်သော ကစားချိန် ဆယ်မိနစ်ပေးပါ။', 'Give ten minutes of child-led play.')],
  ], play: [
    ['tower_crash_2y', b('မျှော်စင်တည်ပြီး ဖြိုကစားခြင်း', 'Build and tumble'), b('လက်ထိန်းချုပ်မှုနှင့် ပြဿနာဖြေရှင်းမှု', 'Hand control and problem-solving'), b('ကစားတုံးကြီးများ', 'Large blocks'), b('မျှော်စင်တည်ပြီး အတူရေတွက်ကာ ဖြိုပါ။', 'Build a tower, count, and knock it down together.'), b('မာကျောလေးလံသောတုံး မသုံးပါနှင့်။', 'Avoid hard or heavy blocks.'), ['fine_motor', 'problem_solving']],
    ['action_song_2y', b('လှုပ်ရှားသီချင်း ကစားခြင်း', 'Action-song play'), b('စကားနားလည်မှုနှင့် ကိုယ်လက်ညှိနှိုင်းမှု', 'Language and coordination'), b('သီချင်းတစ်ပုဒ်', 'A familiar song'), b('လက်ခုပ်တီး၊ ခြေထောက်ဆောင့် စသည့် လှုပ်ရှားမှုကို အတူလုပ်ပါ။', 'Add clapping and stamping actions to the song.'), b('မလဲကျနိုင်သော နေရာလွတ်တွင် ကစားပါ။', 'Use a clear, non-slip space.'), ['communication', 'gross_motor']],
    ['large_puzzle_2y', b('ပုံတုံးကြီး ဆက်ကစားခြင်း', 'Large-piece puzzle'), b('ပုံသဏ္ဌာန်သိမှုနှင့် စမ်းသပ်ဖြေရှင်းမှု', 'Shape matching and trial-and-error'), b('လက်ကိုင်ပါ ပုံတုံးကြီး ၂–၄ တုံး', 'A 2–4 piece knob puzzle'), b('တစ်တုံးကို စမ်းပြပြီး ကျန်တုံးများကို ကလေးစမ်းခွင့်ပေးပါ။', 'Model one piece, then let the child try the others.'), b('မျိုချနိုင်သော ပုံတုံးငယ် မသုံးပါနှင့်။', 'Do not use swallowable small pieces.'), ['cognitive', 'fine_motor']],
  ]},
];

// The preschool bands use the same safe structure with age-specific practice.
const preschool: Band[] = [
  ['2_5y','၂ နှစ်ခွဲ','2.5 years','ခြေနှစ်ဖက်ဖြင့် မြေပေါ်မှ ခုန်ခြင်း','Jumps off the ground with both feet','နှစ်ဆင့်ညွှန်ကြားချက် လိုက်နာခြင်း','Follows a two-step direction','တူရာပုံ တွဲခြင်း','Matches identical pictures','အင်္ကျီချွတ်ရန် ကူညီခြင်း','Helps remove clothing'],
  ['3y','၃ နှစ်','3 years','ခြေတစ်ဖက်စီဖြင့် လှေကားတက်ခြင်း','Walks upstairs with alternating feet','အပြန်အလှန် စကားပြောခြင်း','Has a back-and-forth conversation','မိမိအမည် ပြောခြင်း','Says own first name','ဇွန်းခက်ရင်း သုံးခြင်း','Uses a spoon and fork'],
  ['3_5y','၃ နှစ်ခွဲ','3.5 years','ခုန်ပြီး ရပ်တည်ထိန်းခြင်း','Jumps and regains balance','ဖြစ်ရပ်တိုတစ်ခု ပြန်ပြောခြင်း','Retells a short event','အရောင်နှင့် ပုံသဏ္ဌာန် ခွဲခြားခြင်း','Sorts colors and shapes','အဝတ်ဝတ်ရာတွင် ပါဝင်ခြင်း','Participates in dressing'],
  ['4y','၄ နှစ်','4 years','ဘောလုံးကြီးကို ဖမ်းခြင်း','Catches a large ball','မေးခွန်းရိုးရိုး ဖြေခြင်း','Answers simple questions','လူပုံအပိုင်းအချို့ ဆွဲခြင်း','Draws a person with several parts','အကူအညီမပါဘဲ လက်ကို ကိုယ်တိုင် ဆေးပြီး သုတ်နိုင်ခြင်း','Washes and dries hands without help'],
  ['4_5y','၄ နှစ်ခွဲ','4.5 years','ခြေတစ်ဖက်ပေါ် ခဏရပ်ခြင်း','Balances briefly on one foot','ဇာတ်လမ်းအစီအစဉ် ပြောခြင်း','Tells events in order','၁ မှ ၅ အထိ အရာနှင့် ရေတွက်ခြင်း','Counts objects to five','ခလုတ်ကြီး တပ်ဖြုတ်ခြင်း','Fastens large buttons'],
  ['5y','၅ နှစ်','5 years','ခြေတစ်ဖက်ဖြင့် ခုန်ခြင်း','Hops on one foot','ကာရန်တူအသံ သိခြင်း','Recognizes simple rhymes','နာမည်ထဲမှ စာလုံးအချို့ ရေးခြင်း','Writes some letters in own name','စည်းမျဉ်းနှင့် အလှည့်ကျကစားခြင်း','Follows rules and takes turns'],
].map(([key,mm,en,m1,e1,m2,e2,m3,e3,m4,e4]) => ({
  key, mm, en,
  skills: [
    ['gross_motor', b(m1, e1), b(`${m1}ကို ကစားရင်း ကြိုးစားပါသလား။`, `Tries this skill during play: ${e1.toLowerCase()}?`)],
    ['communication', b(m2, e2), b(`${m2}ကို နေ့စဉ်အခြေအနေတွင် ပြုလုပ်ပါသလား။`, `Does this in everyday situations: ${e2.toLowerCase()}?`)],
    ['cognitive', b(m3, e3), b(`${m3}ကို အကူအညီအနည်းငယ်ဖြင့် လုပ်ပါသလား။`, `Does this with little help: ${e3.toLowerCase()}?`)],
    ['self_help', b(m4, e4), b(`${m4}ကို ကိုယ်တိုင် ကြိုးစားပါသလား။`, `Tries this independently: ${e4.toLowerCase()}?`)],
    ['social', PRESCHOOL_SOCIAL[key][0], PRESCHOOL_SOCIAL[key][1]],
  ],
  guides: [
    ['nutrition', b(`${mm}အရွယ်တွင် မိသားစုစားပွဲ၌ အုပ်စုစုံ အစားအစာနှင့် ရေကို ပုံမှန်ပေးပါ။`, `At ${en}, offer varied family foods and water at regular meals.`), b('အစားပြင်ခြင်း သို့မဟုတ် စားပွဲခင်းခြင်းတွင် လွယ်ကူသောအလုပ်တစ်ခု ပါဝင်ခွင့်ပေးပါ။', 'Include the child in one simple food-preparation or table task.')],
    ['sleep', b(`${mm}အရွယ်အတွက် ပုံမှန်အိပ်ချိန်၊ နိုးချိန်နှင့် ငြိမ်သက်သော အိပ်မီအလေ့အထ ထားပါ။`, `Keep regular sleep and wake times with a calm bedtime routine at ${en}.`), b('အိပ်မီ စာဖတ်ခြင်းကို မျက်နှာပြင်ကြည့်ခြင်းအစား အသုံးပြုပါ။', 'Choose shared reading instead of screens before bed.')],
    ['safety', b(`${mm}အရွယ်တွင် လမ်းမ၊ ရေ၊ မီး၊ ပြတင်းပေါက်နှင့် ဆေးဝါးအန္တရာယ်များကို လူကြီးက ဆက်လက်ကာကွယ်ရပါမည်။`, `At ${en}, adults still need to prevent traffic, water, burn, window, and medicine hazards.`), b('အရေးပေါ်အခြေအနေတွင် ယုံကြည်ရသော လူကြီးကို ခေါ်ရန် လေ့ကျင့်ပါ။', 'Practise calling a trusted adult when something feels unsafe.')],
    ['daily_routine', b(`${mm}အရွယ်တွင် သွားတိုက်ခြင်း၊ အဝတ်ဝတ်ခြင်းနှင့် ပစ္စည်းသိမ်းခြင်းကို ပုံမှန်အစီအစဉ်ဖြင့် လေ့ကျင့်ပါ။`, `At ${en}, practise brushing, dressing, and tidying in a predictable order.`), b('ပုံနှစ်ပုံ သို့မဟုတ် သုံးပုံပါ လုပ်ရိုးလုပ်စဉ်ဇယား သုံးပါ။', 'Use a two- or three-picture routine chart.')],
  ],
  play: PRESCHOOL_PLAY[key],
}));

bands.push(...preschool);

const authored: SeedItem[] = [];
for (const band of bands) {
  for (const [domain, title, observe] of band.skills) {
    const milestoneNumber = ['13_18m', '19_24m', '2y'].includes(band.key) ? 1 : 2;
    authored.push(linked(milestone(band.key, domain, milestoneNumber, { title, observe, why: WHY[domain] ?? WHY.play }),
      'CDC and AAP developmental milestone guidance supports age-based observation while allowing normal individual variation.'));
  }
  for (const [domain, focus, daily] of band.guides) {
    const editorial = GUIDE_EDITORIAL[domain] ?? GUIDE_EDITORIAL.daily_routine;
    const guideSources = domain === 'nutrition' && band.key === '5y'
      ? GUIDE_SOURCES[domain].filter((sourceId) =>
          sourceId !== 'who-growth-standards-2006'
          && sourceId !== 'who-child-growth-standards-qa-2025')
      : GUIDE_SOURCES[domain];
    authored.push(linked(guide(band.key, domain, {
      title: b(`${band.mm} — ${domain === 'nutrition' ? 'အာဟာရ' : domain === 'sleep' ? 'အိပ်စက်ခြင်း' : domain === 'safety' ? 'ဘေးကင်းလုံခြုံရေး' : domain === 'play' ? 'ကစားခြင်း' : 'နေ့စဉ်လုပ်ရိုးလုပ်စဉ်'} လမ်းညွှန်`, `${band.en} — ${domain.replace('_', ' ')} guide`),
      why: focus,
      observationQuestions: [editorial.observation],
      dailyActivities: [daily],
      weeklyActivities: [editorial.weekly],
      indoor: [daily], outdoor: domain === 'safety' || domain === 'play' ? [daily] : [],
      safety: GUIDE_SAFETY[domain] ?? GUIDE_SAFETY.daily_routine,
      parentTips: [editorial.tip],
      faq: [editorial.faq],
      redFlags: [editorial.redFlag],
      referral: editorial.referral,
      encouragement: editorial.encouragement,
    }), `Registered ${domain.replace('_', ' ')} references support this conservative parent guide for ${band.en}.`, guideSources));
  }
  for (const [slug, title, goal, materials, step, safety, domains] of band.play) {
    authored.push(linked(activity({ slug, title, summary: goal, ageGroupKey: band.key, domains, difficulty: 'easy', durationMinutes: 10,
      materials, setup: b('ဘေးကင်းပြီး နေရာလွတ်ရှိသောနေရာကို ရွေးပါ။', 'Choose a safe, clear space.'), instructions: [step], safety,
      indoor: true, outdoor: true, oneChild: true, group: true, parentChild: true,
      outcomes: [goal], variations: [b('ကလေးပင်ပန်းလျှင် အဆင့်ကို လျှော့ပြီး ရပ်နားပါ။', 'Simplify or stop when the child is tired.')],
      evidenceSummary: `Play and developmental references support this age-adapted activity for ${band.en}.`,
    }), `Play and developmental references support this age-adapted activity for ${band.en}.`, ACTIVITY_SOURCES));
  }
  const checklist = { ...printable({ key: `checklist_${band.key}`, format: 'A4 PDF',
    title: b(`${band.mm} — မိဘမှတ်သားစာရင်း`, `${band.en} — Parent observation sheet`),
    description: b('ဖွံ့ဖြိုးမှု၊ နေ့စဉ်အလေ့အထနှင့် မေးလိုသောအချက်များကို မှတ်သားရန်ဖြစ်ပြီး စစ်ဆေးအောင်/မအောင် သတ်မှတ်ရန် မဟုတ်ပါ။', 'Record development, routines, and questions without pass/fail labels or diagnosis.'),
  }), ageGroupKey: band.key, category: `checklist_${band.key}`, tags: [`checklist_${band.key}`, 'printable', 'observation'] };
  authored.push(linked(checklist, `CDC milestone monitoring and AAP surveillance guidance support this non-diagnostic observation tool for ${band.en}.`, ['cdc-milestone-checklists-2025', 'aap-surveillance-2020', 'tb-bright-futures-4e-2017']));
}

// nutrition / sleep / safety milestones, 13_18m through 5y.
//
// The bands above only generate milestones for gross_motor, fine_motor,
// speech, language, communication, cognitive, emotional, self_help, social,
// problem_solving, play, daily_routine and school_readiness (never all of
// them in one band). nutrition, sleep and safety had guides but no titled,
// observable milestone anywhere past 12 months — a real gap found comparing
// the corpus against external milestone references.
type NutritionSleepSafety = [ageGroupKey: string, domain: 'nutrition' | 'sleep' | 'safety', title: Bilingual, observe: Bilingual, why: Bilingual, encouragement: Bilingual];

const NUTRITION_SLEEP_SAFETY: NutritionSleepSafety[] = [
  ['13_18m', 'nutrition',
    b('မိသားစု စားသုံးသော အစားအစာ အမျိုးမျိုးကို ကိုယ်တိုင် ကိုင်တွယ်စားသောက်ရန် ကြိုးစားခြင်း', 'Eats a variety of family foods with some help'),
    b('နူးနပ်အောင် ပြုတ်ပြီး အတုံးသေးသေး လှီးထားသော မိသားစု အစားအစာများကို (အနှစ်/ကြိတ်ထားသော အစာမဟုတ်ဘဲ) ကလေးငယ်က လက်ဖြင့် ကိုယ်တိုင် ကောက်ယူစားသောက်ပါသလား။ အဖုံးမပါသော ရိုးရိုးခွက်ကို လူကြီးကူညီမှုဖြင့် ကိုင်သောက်ပါသလား။', 'Does your child eat small, soft pieces of family food (not just purees), and drink from an open cup with your help?'),
    b('ဤအရွယ် ကလေးငယ် အများစုသည် အနှစ်/အပျစ်ပုံစံမှ အတုံးသေးသေး လှီးထားသော အစားအစာများသို့ ကူးပြောင်း စားသုံးတတ်လာကြပါသည်။ အဖုံးမပါသော ခွက်ဖြင့် သောက်တတ်စေခြင်းက ခံတွင်းနှင့် နှုတ်ခမ်းကြွက်သားများ ပိုမိုသန်မာလာစေရန် လေ့ကျင့်ပေးပါသည်။', 'Most toddlers this age are moving from purees to soft chopped family foods, and cup drinking builds oral-motor skill.'),
    b('ထမင်းစားပွဲတွင် မိသားစုနှင့်အတူ အတူတကွ ထိုင်စားစေပြီး ကိုယ်တိုင် ကောက်ယူစားသောက်ခွင့် ပေးပါ — ကလေးငယ် စားသောက်စဉ် ဖိတ်စင်ပေကျံခြင်းသည် အလွန် သဘာဝကျသော ဖွံ့ဖြိုးမှုအဆင့် ဖြစ်ပါသည်။', 'Sit your child at the family table and let them try feeding themselves — mess is normal and expected.')],
  ['13_18m', 'sleep',
    b('တစ်နေ့လျှင် နေ့ခင်းအိပ်ချိန် နှစ်ကြိမ်မှ တစ်ကြိမ်တည်းဆီသို့ စတင်ကူးပြောင်းလာခြင်း', 'Naps twice a day, moving toward one nap'),
    b('ကလေးငယ်က နေ့ခင်းတွင် နှစ်ကြိမ် အိပ်နေဆဲဖြစ်ပါသလား သို့မဟုတ် တစ်ကြိမ်တည်းသာ အိပ်ရန် အဆင်သင့်ဖြစ်နေပုံရပါသလား။ ညဘက်တွင်လည်း အချိန်ကြာမြင့်စွာ ဆက်တိုက် အိပ်ပျော်ပါသလား။', 'Does your child still nap twice a day, or seem ready for just one longer nap? Do nights include one longer stretch of sleep?'),
    b('ဤအရွယ်တွင် အိပ်စက်မှုပုံစံ တဖြည်းဖြည်း ပြောင်းလဲလာပြီး နေ့ခင်း တစ်ကြိမ်တည်း အိပ်သည့်အလေ့ဆီသို့ ဦးတည်လာတတ်ပါသည် — သို့သော် ကလေးတစ်ဦးနှင့်တစ်ဦး အချိန်ကာလ ကွာခြားနိုင်ပါသည်။', 'Sleep patterns shift now, moving toward a single nap — timing varies widely between children.'),
    b('နေ့ခင်း အိပ်ချိန်နှင့် ညအိပ်ရာဝင်ချိန်များကို တတ်နိုင်သမျှ နေ့စဉ် တစ်သမတ်တည်း သတ်မှတ်ထိန်းသိမ်းပေးပါ။', 'Keep nap and bedtime as consistent as you reasonably can.')],
  ['13_18m', 'safety',
    b('"မလုပ်နဲ့" သို့မဟုတ် အန္တရာယ် သတိပေးစကားကို တစ်ခါတရံ တုံ့ပြန်သတိပြုတတ်ခြင်း', 'Responds to "no" or a danger word, at least sometimes'),
    b('"မလုပ်နဲ့" သို့မဟုတ် "အန္တရာယ်ရှိတယ်" ဟု ပြောဆိုသည့်အခါ ကလေးငယ်က (အမြဲတမ်း မဟုတ်လျှင်ပင်) ခေတ္တ ရပ်တန့်သွားခြင်း သို့မဟုတ် မိဘထံ လှည့်ကြည့်ခြင်း ပြုလုပ်ပါသလား။', 'When you say "no" or "danger," does your child sometimes pause or look at you — even if not every time?'),
    b('ဤအရွယ်တွင် အန္တရာယ် သတိပေးစကားများကို တစ်စိတ်တစ်ပိုင်း စတင်နားလည်လာသော်လည်း မိမိကိုယ်ကို ထိန်းချုပ်နိုင်စွမ်း မရှိသေးသဖြင့် လူကြီးများ၏ အနီးကပ် ကြီးကြပ်စောင့်ရှောက်မှု ဆက်လက် လိုအပ်ဆဲ ဖြစ်ပါသည်။', 'Understanding of danger words is only beginning now and self-control is not yet reliable — close supervision is still essential.'),
    b('"မလုပ်နဲ့" ဟု တားမြစ်ရုံသက်သက်ထက် ကလေးငယ် ပြုလုပ်နိုင်သည့် ဘေးကင်းသော အခြားအရာတစ်ခုခုကို ချက်ချင်း ပြောင်းလဲပြသပေးပါ။', 'Instead of just saying "no," immediately show a safe alternative action.')],

  ['19_24m', 'nutrition',
    b('ဇွန်းကို ပိုမိုကျွမ်းကျင်စွာ သုံးနိုင်ခြင်းနှင့် အဖုံးမပါသော ရိုးရိုးခွက်ဖြင့် သောက်တတ်ခြင်း', 'Uses a spoon with less spilling and drinks from an open cup'),
    b('ဇွန်းဖြင့် အစားအစာ အများစုကို မဖိတ်စင်ဘဲ ပါးစပ်ထဲသို့ ရောက်အောင် ထည့်နိုင်ပါသလား။ အဖုံးမပါသော ရိုးရိုးခွက်ကို ကိုယ်တိုင် ကိုင်တွယ်သောက်သုံးပါသလား။', 'Can your child get most of a spoonful to the mouth without heavy spilling? Do they hold and drink from an open cup themselves?'),
    b('ဤအရွယ်တွင် ဇွန်းနှင့် ခွက်ကို ပိုမိုတိကျစွာ အသုံးပြုလာနိုင်ပြီး လက်နှင့် မျက်လုံး ညှိနှိုင်းဆောင်ရွက်နိုင်စွမ်း တိုးတက်လာကြောင်း ပြသပါသည်။', 'Spoon and cup use become noticeably more accurate now, showing growing hand–eye coordination.'),
    b('အနည်းငယ် ဖိတ်စင်ပေကျံနိုင်သည်ကို နားလည်လက်ခံပေးပြီး ဇွန်းကို ကလေးငယ် ကိုယ်တိုင်သုံး၍ စားသောက်ရန် ဆက်လက် အားပေးပါ။', 'Expect some spilling and keep encouraging independent spoon use.')],
  ['19_24m', 'sleep',
    b('ပုံမှန် အိပ်ရာဝင် အလေ့အထအတိုင်း တည်ငြိမ်စွာ အိပ်ပျော်နိုင်ခြင်း', 'Settles with a consistent bedtime routine'),
    b('အိပ်ရာမဝင်မီ နေ့စဉ် တူညီသော အလေ့အထများ (ရေချိုးခြင်း၊ ပုံပြင်စာအုပ်ဖတ်ခြင်း၊ အိပ်ရာဝင်ခြင်း) ကို ပြုလုပ်ပြီးနောက် ကလေးငယ်က တည်ငြိမ်စွာ အိပ်ပျော်သွားပါသလား။', 'Does your child settle calmly with a familiar bedtime sequence — bath, book, sleep?'),
    b('တူညီသော လုပ်ရိုးလုပ်စဉ်များကို ထပ်ခါတလဲလဲ ပြုလုပ်ပေးခြင်းက ကလေးငယ်အား အိပ်ချိန်ရောက်ပြီဖြစ်ကြောင်း ကြိုတင်သိရှိစေပြီး အလွယ်တကူ အိပ်ပျော်စေရန် အထောက်အကူပြုပါသည်။', 'A repeated sequence signals that sleep is coming, which helps a toddler settle.'),
    b('အိပ်ရာမဝင်မီ တီဗွီ၊ ဖုန်း၊ တက်ဘလက် စသည့် မျက်နှာပြင် (Screen) ကြည့်ရှုမှုများကို ရှောင်ကြဉ်ပါ၊ မီးရောင်ကို မှိန်ပေးထားပြီး ညစဉ် ပုံမှန် အိပ်ရာဝင် အလေ့အထကို တစ်သမတ်တည်း ထိန်းသိမ်းပေးပါ။', 'Avoid screens before bed, dim the lights, and keep the sequence the same each night.')],
  ['19_24m', 'safety',
    b('သတိပေးထားသော အန္တရာယ်ရှိသည့် အရာဝတ္ထုများကို သတိထားရှောင်ရှားတတ်ခြင်း', 'Shows caution around things labelled as dangerous'),
    b('"ပူတယ်" သို့မဟုတ် "ရှတယ်/ထက်တယ်" ဟု သတိပေးထားသော အရာဝတ္ထုများကို အချိန်ကြာလာသည်နှင့်အမျှ ကလေးငယ်က ဝေးဝေးနေခြင်း သို့မဟုတ် သတိထားကိုင်တွယ်ခြင်း ရှိလာပါသလား။', 'Over time, does your child start to hold back or show caution around things you have labelled "hot" or "sharp"?'),
    b('မိဘက ထပ်ခါတလဲလဲ တစ်သမတ်တည်း သတိပေးပြောဆိုခြင်းက ကလေးငယ်အား ဤသတိပေးစကားလုံးများကို အမှန်တကယ် အန္တရာယ်ရှိမှုနှင့် ချိတ်ဆက်နားလည်စေပါသည်။', 'Consistent, repeated labelling helps a toddler connect these words with real danger.'),
    b('အန္တရာယ်ရှိသော အရာဝတ္ထုများကို ရှင်းပြသည့်အခါ စကားလုံးတစ်မျိုးတည်းကိုသာ အမြဲတမ်း တစ်သမတ်တည်း သုံးနှုန်းပြောဆိုပါ။', 'Use the same word for the same hazard every time, consistently.')],

  ['2y', 'nutrition',
    b('မိသားစု ထမင်းဝိုင်းတွင် ကိုယ်တိုင် စားသောက်နိုင်သော်လည်း အစားရွေးတတ်ခြင်း (Picky eating)', 'Eats independently at family meals, though may be a picky eater'),
    b('ထမင်းစားပွဲတွင် ကိုယ်တိုင်ထိုင်၍ စားသောက်နိုင်ပါသလား။ အစားအစာ အချို့ကို ငြင်းဆန်တတ်သော်လည်း အခြား အစားအစာများကို နှစ်သက်စွာ စားသုံးပါသလား။', 'Does your child sit and eat mostly independently, even if they refuse some foods while enjoying others?'),
    b('ဤအရွယ်တွင် အစားရွေးခြင်း (Picky eating) သည် အလွန် ပုံမှန်ဖြစ်သော သဘာဝဖြစ်ပြီး မိမိစိတ်ကြိုက် ရွေးချယ်လိုစိတ် တိုးတက်လာခြင်းကို ပြသပါသည်။', 'Picky eating is very common and normal at this age — it reflects a growing sense of independence and preference.'),
    b('အတင်းအကျပ် မကျွေးဘဲ အာဟာရ အုပ်စုစုံလင်သော အစားအစာများကို ဖိအားမပေးဘဲ စိတ်ရှည်စွာ ထပ်မံ ပြင်ဆင်ကျွေးမွေးကြည့်ပါ။', 'Avoid forcing food; keep calmly re-offering a variety without pressure.')],
  ['2y', 'sleep',
    b('ညဘက်တွင် လန့်နိုးခြင်း နည်းပါးလာပြီး နှစ်ခြိုက်စွာ အိပ်ပျော်နိုင်ခြင်း', 'Sleeps through most nights with fewer wakings'),
    b('ညဘက်တွင် ခေတ္တမျှ နိုးလာသော်လည်း မိမိဘာသာ ပြန်လည်အိပ်ပျော်သွားပါသလား သို့မဟုတ် အနည်းငယ် ချော့သိပ်ပေးရုံဖြင့် ပြန်လည် အိပ်ပျော်သွားပါသလား။', 'If your child wakes briefly at night, do they settle back to sleep on their own or with only brief comforting?'),
    b('ဤအရွယ်တွင် ညဘက် ဆက်တိုက်အိပ်ချိန် ပိုမိုရှည်လျားလာပြီး မိမိဘာသာ ပြန်လည်အိပ်ပျော်နိုင်စွမ်း တိုးတက်လာပါသည် (ကျန်းမာသော ကလေးငယ်များပင် တစ်ခါတရံ နိုးလာတတ်ပါသည်)။', 'Night sleep stretches lengthen now, though even healthy children can still wake occasionally.'),
    b('ညဘက် နိုးလာသည့်အခါ တည်ငြိမ်တိတ်ဆိတ်စွာသာ တုံ့ပြန်ချော့သိပ်ပါ — မီးရောင်စူးစူး ဖွင့်ခြင်း သို့မဟုတ် ကစားပေးခြင်းများ မပြုလုပ်ပါနှင့်။', 'If your child wakes at night, respond quietly and calmly — avoid lights or play.')],
  ['2y', 'safety',
    b('ရိုးရှင်းသော ဘေးကင်းရေး စည်းမျဉ်းတစ်ခုကို တစ်ခါတရံ လိုက်နာတတ်ခြင်း', 'Sometimes follows one simple safety rule'),
    b('"ကားလမ်းအနီးမှာ လက်ကိုင်ထားပါ" ကဲ့သို့သော စည်းမျဉ်းကို သတိပေးသည့်အခါ ကလေးငယ်က တစ်ခါတရံ လိုက်နာပါသလား။', 'When reminded, does your child sometimes follow a rule like "hold my hand near the road"?'),
    b('ဘာသာစကား နားလည်မှု တိုးတက်လာသဖြင့် ရိုးရှင်းသော စည်းမျဉ်းကို ခေတ္တမျှ လိုက်နာနိုင်လာသော်လည်း အမြဲတမ်း လိုက်နာနိုင်မည်ဟု စိတ်ချ၍ မရသေးပါ (လူကြီး အနီးကပ် ကြီးကြပ်မှု လိုအပ်ဆဲဖြစ်ပါသည်)။', 'Growing language lets a toddler follow one simple rule briefly, but it cannot be relied on every time yet.'),
    b('စည်းမျဉ်းတစ်ခုကို ရှင်းပြသည့်အခါ တူညီသော စကားလုံးများဖြင့် ထပ်ခါတလဲလဲ တစ်သမတ်တည်း ပြောပြပေးပါ။', 'Repeat the same rule using the same words, again and again.')],

  ['2_5y', 'nutrition',
    b('အစားအစာအသစ်များကို ဖိအားမပေးဘဲ ထပ်ခါတလဲလဲ ကျွေးကြည့်ခြင်းဖြင့် လက်ခံစားသုံးလာနိုင်ခြင်း', 'Tries new foods with repeated, low-pressure offers'),
    b('အစားအစာအသစ်တစ်ခုကို ပထမတွင် ငြင်းဆန်သော်လည်း ဖိအားမပေးဘဲ အကြိမ်ကြိမ် ကျွေးကြည့်သည့်အခါ ကလေးငယ်က တစ်ခါတရံ မြည်းစမ်းကြည့်ပါသလား။', 'Does your child sometimes try a new food after it has been calmly offered several times, even if they refused it at first?'),
    b('ကလေးငယ်တစ်ဦး အစားအစာအသစ်တစ်ခုကို လက်ခံစားသုံးရန်အတွက် အကြိမ်ပေါင်း ၈ ကြိမ်မှ ၁၀ ကြိမ်ခန့်အထိ စိတ်ရှည်စွာ ထပ်ခါတလဲလဲ ကျွေးကြည့်ရန် လိုအပ်တတ်ပြီး ယင်းမှာ အလွန် ပုံမှန်ဖြစ်ပါသည်။', 'It commonly takes many exposures — around 8 to 10 — before a child accepts a new food, and that is normal.'),
    b('ဖိအားမပေးဘဲ စိတ်ရှည်စွာ ထပ်မံ ကျွေးကြည့်ပါ၊ မိဘကိုယ်တိုင် အဆိုပါ အစားအစာကို စားပြခြင်းက ကလေးငယ် စားသုံးလာစေရန် များစွာ အထောက်အကူပြုပါသည်။', 'Keep offering without pressure, and model eating the food yourself — it helps.')],
  ['2_5y', 'sleep',
    b('နေ့ခင်းတစ်ကြိမ်သာ အိပ်တော့ခြင်းနှင့် အိပ်ရာဝင်ချိန်တွင် အိပ်ရန် ငြင်းဆန်ဂျီကျတတ်ခြင်း', 'Settled into one nap, may resist bedtime'),
    b('ကလေးငယ်က နေ့ခင်းတွင် တစ်ကြိမ်တည်းသာ အိပ်ပါသလား။ အိပ်ရာဝင်ချိန် ရောက်သည့်အခါ "မအိပ်ချင်သေးဘူး" ဟု ငြင်းဆန်တတ်ပါသလား။', 'Does your child nap only once a day now? Do they sometimes resist or delay going to bed?'),
    b('ဤအရွယ်တွင် မိမိဆန္ဒအတိုင်း လွတ်လပ်စွာ နေထိုင်လိုစိတ် ပိုမိုကြီးထွားလာသဖြင့် အိပ်ရာဝင်ချိန်တွင် အိပ်ရန် ငြင်းဆန်ဂျီကျတတ်ခြင်းမှာ အလွန် ပုံမှန်ဖြစ်ပါသည်။', 'Bedtime resistance is very common now as independence and opinions grow stronger.'),
    b('ရွေးချယ်စရာ ၂ ခု ပေးပါ (ဥပမာ — "ဒီပုံပြင်စာအုပ် ဖတ်မလား သို့မဟုတ် ဟိုစာအုပ် ဖတ်မလား") — ဤသို့ ပြုလုပ်ပေးခြင်းဖြင့် မိမိကိုယ်ကို ထိန်းချုပ်ပိုင်ခွင့်ရှိသည်ဟု ကလေးငယ် ခံစားရစေပါသည်။', 'Offer two small choices ("this book or that one?") so bedtime feels a little more in their control.')],
  ['2_5y', 'safety',
    b('အန္တရာယ်ရှိသော အရာဝတ္ထုအချို့ကို မေးမြန်းသည့်အခါ အမည်ပြောပြနိုင်ခြင်း', 'Names a few dangerous things when asked'),
    b('"ဘယ်အရာတွေက အန္တရာယ်ရှိသလဲ" ဟု မေးမြန်းသည့်အခါ မီး၊ ဓား သို့မဟုတ် ကားလမ်းမ ကဲ့သို့သော အရာတစ်ခုခုကို ကလေးငယ်က ပြောပြနိုင်ပါသလား။', 'If asked "what is dangerous?", can your child name something like fire, a knife, or the road?'),
    b('အန္တရာယ်ရှိသော အရာများကို စကားလုံးဖြင့် သိရှိဖော်ပြနိုင်ခြင်းသည် ဘေးကင်းရေး စည်းမျဉ်းများ၏ နောက်ကွယ်မှ အကြောင်းရင်းကို စတင်နားလည်လာကြောင်း ပြသခြင်း ဖြစ်ပါသည်။', 'Naming hazards in words shows the beginning of understanding why the rules exist.'),
    b('အန္တရာယ်ရှိသော အရာများနှင့် ကြုံတွေ့သည့်အခါတိုင်း အေးအေးဆေးဆေး ရှင်းပြပြီး အန္တရာယ်ရှိကြောင်း အမည်တပ် ပြောပြပေးပါ။', 'Quietly name the hazard out loud every time you encounter one together.')],

  ['3y', 'nutrition',
    b('ဇွန်းခက်ရင်းကို ကျွမ်းကျင်စွာ သုံးနိုင်ခြင်း', 'Uses a fork and spoon competently at meals'),
    b('ဇွန်းနှင့် ခက်ရင်းကို ကိုယ်တိုင် သုံးပြီး အစားအစာအများစုကို ပက်ကျံမှု နည်းနည်းသာဖြင့် စားနိုင်ပါသလား။', 'Can your child use a spoon and fork on their own, eating most of a meal without heavy spilling?'),
    b('လက်ကျွမ်းကျင်မှုနှင့် ခန္ဓာကိုယ်ထိန်းချုပ်မှု ပိုမိုတိုးတက်လာသဖြင့် အစားအစာ ကိရိယာများကို ပိုမိုတိကျစွာ သုံးနိုင်လာသည်။', 'Growing hand skill and body control let most 3-year-olds manage utensils more precisely.'),
    b('ကလေးကိုယ်တိုင် ဇွန်း/ခက်ရင်း ရွေးချယ်ခွင့်ပေးပြီး မိသားစုစားပွဲတွင် ပါဝင်ခွင့်ပေးပါ။', 'Let your child choose their own utensil and take part fully at the family table.')],
  ['3y', 'sleep',
    b('နေ့ခင်းအိပ်ချိန် လျှော့လာနိုင်သော်လည်း တည်ငြိမ်သော ညအိပ်ချိန် လိုအပ်ဆဲ', 'May start dropping the nap, still needs consistent bedtime'),
    b('နေ့ခင်း အိပ်ချင်၊ မအိပ်ချင် ရော ဖြစ်လာပါသလား။ ဒါပေမယ့် ညဘက် တူညီသောအချိန်တွင် အိပ်ရာဝင်ပါသလား။', 'Does napping become inconsistent — some days yes, some no? Does bedtime stay at roughly the same time either way?'),
    b('ကလေးအများအပြားသည် ဤအရွယ်တွင် နေ့ခင်းအိပ်ချိန်ကို စတင် လျှော့ချကြသည် — ဒါပေမယ့် ညအိပ်ချိန်တူညီစွာ ထားခြင်းက ပိုအရေးကြီးလာသည်။', 'Many children begin dropping naps around now — a consistent night bedtime becomes even more important.'),
    b('နေ့ခင်း မအိပ်သည့်နေ့များတွင် ငြိမ်သက်သော "ငြိမ်ချိန်" တစ်ခု အစားထိုးပေးပါ။', 'On no-nap days, offer a calm quiet-time instead to avoid overtiredness.')],
  ['3y', 'safety',
    b('ရင်းနှီးသော ဘေးကင်းရေးစည်းမျဉ်းကို အသိပေးမှု လိုအပ်မှု လျော့နည်းလာခြင်း', 'Follows a familiar safety rule with fewer reminders'),
    b('"လက်ကိုင်ထားပါ" ကဲ့သို့ ရင်းနှီးသောစည်းမျဉ်းကို အသိပေးမှု တစ်ကြိမ်၊ နှစ်ကြိမ်ဖြင့် လိုက်နာနိုင်ပါသလား (အမြဲတမ်းတော့ မဟုတ်ပါ)။', 'Can your child follow a familiar rule like "hold hands" with just one or two reminders — not every single time, but often?'),
    b('ဤအရွယ်တွင် ရင်းနှီးသောစည်းမျဉ်းများကို ပိုမိုယုံကြည်စွာ လိုက်နာနိုင်လာသော်လည်း လူကြီး ကြီးကြပ်မှု ဆက်လိုအပ်ဆဲဖြစ်သည်။', 'Familiar rules become more reliable now, but adult supervision is still needed.'),
    b('ကလေးလိုက်နာနိုင်သည့်အခါ တိတိကျကျ ချီးကျူးပေးပါ ("လမ်းမနားမှာ လက်ကိုင်ထားလို့ ကျေးဇူးပဲ")။', 'Praise specifically when your child follows the rule — "thank you for holding my hand near the road."')],

  ['3_5y', 'nutrition',
    b('မိသားစု ထမင်းဝိုင်းတွင် အချိန်အတိုင်းအတာတစ်ခုအထိ ငြိမ်သက်စွာ ထိုင်၍ စားသောက်နိုင်ခြင်း', 'Sits through a family meal at the table'),
    b('မိသားစု ထမင်းစားချိန်တစ်လျှောက်လုံးတွင် (အနည်းဆုံး မိနစ်အနည်းငယ်ကြာမျှ) ကလေးငယ်က ထမင်းစားပွဲတွင် ထိုင်၍ ပါဝင်စားသောက်နိုင်ပါသလား။', 'Can your child sit and take part through most of a family meal, for at least several minutes?'),
    b('ထမင်းစားပွဲတွင် ငြိမ်သက်စွာ ထိုင်နိုင်ခြင်းသည် မိမိကိုယ်ကို ထိန်းချုပ်နိုင်စွမ်းနှင့် မိသားစု၏ နေ့စဉ် လုပ်ရိုးလုပ်စဉ်များကို လိုက်နာကျင့်သုံးနိုင်စွမ်း တိုးတက်လာခြင်းကို ဖော်ပြပါသည်။', 'Sitting through a meal shows growing self-regulation and comfort with family routines.'),
    b('ထမင်းစားချိန်ကို သင့်တင့်သော အချိန်ပမာဏသာ သတ်မှတ်ထားပြီး ဖိအားမရှိဘဲ စကားလက်ဆုံပြောဆိုရင်း ပျော်ရွှင်ဖွယ် ထမင်းဝိုင်း ဖြစ်စေရန် ဖန်တီးပေးပါ။', 'Keep mealtimes reasonably short and relaxed, with conversation woven in.')],
  ['3_5y', 'sleep',
    b('အိပ်ရာဝင် အလေ့အထ၏ အဆင့်များကို ကြိုတင်သိရှိပြီး လိုက်နာနိုင်ခြင်း', 'Names parts of the bedtime routine and anticipates them'),
    b('အိပ်ရာဝင်ချိန် အလေ့အထများတွင် နောက်လာမည့် အဆင့်ကို ကလေးငယ်က ကြိုတင်ပြောပြနိုင်ပါသလား (ဥပမာ — "ရေချိုးပြီးရင် ပုံပြင်စာအုပ် ဖတ်မယ်")။', 'Can your child tell you what comes next in the bedtime routine — "after bath, we read a book"?'),
    b('လုပ်ရိုးလုပ်စဉ် အဆင့်များကို ကြိုတင်သိရှိနားလည်ခြင်းသည် မိမိကိုယ်ကို ထိန်းချုပ်စီမံနိုင်သည်ဟု ကလေးငယ်အား ခံစားရစေပြီး အိပ်ရာဝင်ချိန်ကို ပိုမိုလွယ်ကူချောမွေ့စေပါသည်။', 'Knowing the routine gives a child a sense of control and makes bedtime easier.'),
    b('ရုပ်ပုံလေးများ ပါဝင်သော အိပ်ရာဝင် အစီအစဉ်ဇယားလေး ပြသပေးပြီး ကလေးငယ် ကိုယ်တိုင် အဆင့်ဆင့် လိုက်နာနိုင်အောင် အားပေးပါ။', 'Show a simple picture routine chart and let your child follow it themselves.')],
  ['3_5y', 'safety',
    b('မတော်တဆ ဖြစ်သည့်အခါ ယုံကြည်ရသော လူကြီးထံ ချက်ချင်း အကူအညီတောင်းခံတတ်ခြင်း', 'Knows to call a trusted adult when something feels wrong'),
    b('ထိခိုက်ဒဏ်ရာရသည့်အခါ သို့မဟုတ် ကြောက်ရွံ့စရာ အခြေအနေတစ်ခုခု ကြုံတွေ့ရသည့်အခါ ကလေးငယ်က လူကြီးထံ ချက်ချင်း လာရောက်ပြောပြ အကူအညီတောင်းပါသလား။', 'When hurt or frightened, does your child come to tell a trusted adult right away?'),
    b('အကူအညီ တောင်းခံရမည်ကို သိရှိနားလည်ခြင်းသည် မိမိကိုယ်ကို အန္တရာယ်မှ ကာကွယ်နိုင်စွမ်း (Self-protective skills) ၏ အလွန်အရေးပါသော အစိတ်အပိုင်းတစ်ခု ဖြစ်ပါသည်။', 'Knowing to seek help is an important part of self-protective safety skill.'),
    b('"တစ်ခုခု အဆင်မပြေတာ၊ ကြောက်စရာကြုံတာ ရှိရင် ဖေဖေ/မေမေ့ဆီ ချက်ချင်း လာပြောနော်" ဟု ကလေးငယ် နားလည်လွယ်အောင် အမြဲ သတိပေးထားပါ။', 'Simply and clearly tell your child, "if something feels wrong, come tell me."')],

  ['4y', 'nutrition',
    b('လူကြီးကြီးကြပ်မှုဖြင့် ကိုယ်တိုင် အစားအစာ အနည်းငယ် ထည့်ဝေနိုင်ခြင်း', 'Serves self small portions with supervision'),
    b('ခွက်ငယ်တစ်ခုမှ ရေ သို့မဟုတ် အစားအစာကို လူကြီးကြည့်ရှုမှုဖြင့် ကိုယ်တိုင် ထည့်ကြည့်ပါသလား။', 'With supervision, can your child pour from a small jug or serve themselves a small portion?'),
    b('ဒီလို လုပ်ငန်းများသည် လက်ထိန်းချုပ်မှုနှင့် စားခြင်းကို ကိုယ်တိုင်ဆုံးဖြတ်နိုင်မှုကို တိုးပွားစေသည်။', 'These tasks build hand control and a sense of ownership over eating.'),
    b('ယိုစိမ့်ရင် ပြဿနာမဟုတ်ကြောင်း ပြောပြီး ကလေးကို စားပွဲပြင်ဆင်ရာတွင် ပါဝင်ခွင့်ပေးပါ။', 'Let spills be no big deal, and involve your child in setting up the meal.')],
  ['4y', 'sleep',
    b('တည်ငြိမ်သော အစီအစဉ်ဖြင့် ကိုယ်ပိုင်အိပ်ရာတွင် တစ်ညလုံး အိပ်ပျော်ခြင်း', 'Sleeps in own bed for a full night with a consistent routine'),
    b('ကိုယ်ပိုင်အိပ်ရာတွင် တစ်ညလုံး (ကြားနိုးမှု အနည်းငယ်သာ) အိပ်ပျော်ပါသလား။', 'Does your child sleep in their own bed through most of the night, with only occasional waking?'),
    b('ဒီအရွယ်တွင် ညဘက်တစ်ခါတစ်ရံ အိပ်မက်များ သို့မဟုတ် မှောင်မိုက်ကြောင့် ကြောက်ခြင်း ဖြစ်နိုင်သော်လည်း ကိုယ်ပိုင်အိပ်ရာတွင် အိပ်နိုင်မှု ခိုင်မာလာသည်။', 'Occasional nighttime fears (dreams, the dark) are common now, but sleeping in their own bed becomes more established.'),
    b('အလင်းအရောင် ဖျော့ဖျော့ပါသော ညဘက်သုံး မီးငယ်တစ်ခုနှင့် ရင်းနှီးသော အိပ်ချောင်းရှင် ပေးထားခြင်းက ကူညီနိုင်သည်။', 'A dim nightlight and a familiar comfort item can help with occasional nighttime fears.')],
  ['4y', 'safety',
    b('စည်းမျဉ်းက ဘာကြောင့် ဘေးကင်းစေသည်ကို ရှင်းပြနိုင်ခြင်း', 'Explains why a rule keeps them safe'),
    b('"ဘာကြောင့် လမ်းမနားမှာ လက်ကိုင်ထားရသလဲ" ဟုမေးလျှင် အကြောင်းပြချက် အနည်းငယ် ပြောနိုင်ပါသလား။', 'If asked "why do we hold hands near the road?", can your child give a simple reason?'),
    b('စည်းမျဉ်းနောက်ကွယ်ရှိ အကြောင်းရင်းကို နားလည်ခြင်းက စည်းမျဉ်းကို ကိုယ်တိုင် လက်ခံနိုင်မှု ပိုကောင်းစေသည်။', 'Understanding the reason behind a rule helps a child accept and internalise it.'),
    b('စည်းမျဉ်းချရုံသက်သက်မဟုတ်ဘဲ "ဘာလို့" ဆိုတာကို အမြဲ ရှင်းပြပါ။', 'Always explain the "why," not just the rule itself.')],

  ['4_5y', 'nutrition',
    b('ကျန်းမာသော အစားအစာအချို့ကို အမည်တပ်ပြီး ရိုးရှင်းသော ပြင်ဆင်မှုတွင် ကူညီနိုင်ခြင်း', 'Names a few healthy foods and helps with simple food prep'),
    b('အသီးအရွက်နှင့် ကျန်းမာသောအစားအစာအချို့ကို အမည်ခေါ်နိုင်ပါသလား။ ဆေးကြောခြင်း သို့မဟုတ် ရောနှော ကူညီမှုကို ပါဝင်ကြိုးစားပါသလား။', 'Can your child name a few fruits, vegetables, or healthy foods? Do they help wash or stir with supervision?'),
    b('အစားအစာကို ကိုယ်တိုင် နားလည်ပြီး ပါဝင်ခြင်းက ကျန်းမာစားသောက်မှု အလေ့အထကို အားကောင်းစေသည်။', 'Understanding and helping with food builds healthy eating habits that carry forward.'),
    b('ဈေးဝယ်ခြင်း၊ ဟင်းချက်ခြင်းတွင် ရိုးရှင်းသော အလုပ်ငယ်တစ်ခု ပေးကြည့်ပါ။', 'Give a simple job during shopping or cooking, like rinsing vegetables.')],
  ['4_5y', 'sleep',
    b('ညဘက် နိုးလျှင် ကိုယ်တိုင် သို့မဟုတ် အနည်းငယ်ကူညီမှုဖြင့် ပြန်အိပ်ပျော်နိုင်ခြင်း', 'Settles back to sleep independently, or with minimal help, after waking'),
    b('ညဘက်နိုးလျှင် ကိုယ်တိုင် ပြန်အိပ်ပျော်ပါသလား၊ ဒါမှမဟုတ် အနည်းငယ်စကားပြောပေးရုံဖြင့် ပြန်အိပ်ပျော်ပါသလား။', 'If your child wakes at night, do they settle back to sleep alone, or with just a few reassuring words?'),
    b('ကိုယ်တိုင် ပြန်အိပ်ပျော်နိုင်စွမ်းသည် ကိုယ်ကိုယ်တိုင် ငြိမ်းအောင်လုပ်နိုင်မှု တိုးတက်လာကြောင်း ပြသည်။', 'Independent resettling shows growing self-soothing ability.'),
    b('ညဘက်နိုးလျှင် တိုတောင်း၍ ငြိမ်သက်သော တုံ့ပြန်မှုကို ဆက်လက်ပေးပါ။', 'Keep any nighttime response brief and calm to support independent settling.')],
  ['4_5y', 'safety',
    b('လူကြီးကြီးကြပ်မှုဖြင့် လမ်းမကူးရန် "ရပ်-ကြည့်-နားထောင်" ကို လိုက်နာခြင်း', 'Follows "stop, look, listen" at the road with adult supervision'),
    b('လမ်းမကူးမည့်အခါ လူကြီးအသိပေးမှုဖြင့် ရပ်ပြီး ဘယ်ညာကြည့်ပါသလား။', 'When crossing a road, does your child stop and look both ways when an adult prompts them?'),
    b('ရိုးရှင်းသော ရပ်-ကြည့်-နားထောင် အစီအစဉ်ကို လေ့ကျင့်ခြင်းက နောင် ကျောင်းသို့ တစ်ကိုယ်တည်း သွားရန် ပြင်ဆင်ပေးသည်။', 'Practising this simple sequence now prepares a child for greater independence around traffic later.'),
    b('လမ်းမကူးတိုင်း "ရပ်-ကြည့်-နားထောင်" စကားလုံးကို တညီတညွတ်တည်း ပြောပြပါ။', 'Say "stop, look, listen" using the same words every single crossing.')],

  ['5y', 'nutrition',
    b('အစားအစာအမျိုးမျိုးကို စားနိုင်ပြီး စားပွဲပြင်/သိမ်းရာတွင် ကူညီနိုင်ခြင်း', 'Eats a wide variety of foods and helps set or clear the table'),
    b('အစားအစာအမျိုးမျိုးကို ကြိုက်နှစ်သက်စွာ စားပါသလား။ စားပွဲပြင်ခြင်း သို့မဟုတ် ပန်းကန်သိမ်းခြင်းကဲ့သို့ အလုပ်ငယ်ကို ကူညီနိုင်ပါသလား။', 'Does your child eat a fairly wide range of foods, and help set or clear the table?'),
    b('ကျောင်းသွားရန် အသင့်ဖြစ်ချိန်တွင် အစားအစာ လွတ်လပ်စွာ စားနိုင်မှုနှင့် အိမ်မှုကိစ္စ ပါဝင်နိုင်မှုသည် အရေးကြီးသော ကိုယ်တိုင်လုပ်ဆောင်နိုင်စွမ်း ဖြစ်သည်။', 'Independent eating and helping with household tasks are important self-help skills going into school.'),
    b('စားပွဲပြင်ခြင်း/သိမ်းခြင်းကို ပုံမှန်တာဝန်တစ်ခုအဖြစ် ပေးထားပါ။', 'Make table setting or clearing a regular small job.')],
  ['5y', 'sleep',
    b('အိပ်မီအစီအစဉ်တစ်ခုလုံးကို များသောအားဖြင့် ကိုယ်တိုင် လိုက်နာနိုင်ခြင်း', 'Follows a full bedtime routine largely independently'),
    b('ပါဝင်သောအဆင့်များ (သွားတိုက်၊ ပီဂျားမား ဝတ်၊ အိပ်ရာဝင်) ကို အသိပေးအနည်းငယ်ဖြင့် ကိုယ်တိုင် လုပ်ဆောင်ပါသလား။', 'With just a reminder or two, can your child follow the steps of a bedtime routine — brushing, pyjamas, into bed?'),
    b('ကျောင်းသွားရန် အသင့်ဖြစ်ချိန်တွင် ညအိပ်ချိန်ကို ကိုယ်တိုင် စီမံနိုင်မှုသည် အရေးကြီးသော ကိုယ်တိုင်လုပ်ဆောင်နိုင်စွမ်း ဖြစ်သည်။', 'Managing a bedtime routine independently is an important self-help skill going into school.'),
    b('ညအိပ်ချိန်ကို ကျောင်းရက်နှင့် အားလပ်ရက် နီးစပ်အောင် ထားပါ။', 'Keep bedtime reasonably consistent between school days and days off.')],
  ['5y', 'safety',
    b('ကိုယ်ပိုင်အမည်ကို ပြောနိုင်ပြီး လမ်းပျောက်လျှင် ယုံကြည်ရသူထံ အကူအညီတောင်းခြင်း', 'States own name and asks a trusted adult for help if lost'),
    b('မိမိအမည်ကို ရှင်းရှင်းလင်းလင်း ပြောနိုင်ပါသလား။ လမ်းပျောက်လျှင် ဘယ်သူ့ဆီအကူအညီ တောင်းရမည်ကို သိရှိပါသလား (ဥပမာ- စတိုးဝန်ထမ်း၊ မိဘရဲ့ရဲ)။', 'Can your child clearly say their own name? Do they know who to ask for help if lost — like a shop worker or a police officer?'),
    b('ကိုယ်ပိုင်အချက်အလက်ကို သိရှိပြီး ယုံကြည်ရသူကို ခွဲခြားနိုင်မှုသည် ကျောင်းအရွယ်မတိုင်မီ အရေးကြီးသော ဘေးကင်းရေး ကျွမ်းကျင်မှု ဖြစ်သည်။', 'Knowing personal information and recognising a trustworthy adult is an important pre-school safety skill.'),
    b('လမ်းပျောက်လျှင် ဘယ်သူ့ဆီ အကူအညီတောင်းရမလဲ ဆိုတာကို ရိုးရှင်းသော ဇာတ်လမ်းဖြင့် လေ့ကျင့်ပြပါ။', 'Practise "what to do if lost" through a simple, calm role-play, not a scary one.')],
];

const NUTRITION_SLEEP_SAFETY_EVIDENCE: Record<string, string> = {
  '13_18m:nutrition': 'The transition from purees to chopped family foods and open-cup drinking around this age follows WHO complementary-feeding guidance and NHS first-foods guidance in the registry.',
  '13_18m:sleep': 'The transition from two naps to one around 12-18 months follows WHO physical activity and sleep guidance for under-5s in the registry.',
  '13_18m:safety': 'Early, unreliable response to danger words and the ongoing need for close supervision at this age follow AAP positive-parenting guidance and Bright Futures guidance in the registry.',
  '19_24m:nutrition': 'Improving spoon and open-cup competence around 18-24 months is described in the Bright Futures preventive-care schedule and paediatric occupational-therapy references in the registry.',
  '19_24m:sleep': 'Consistent bedtime routines supporting settling around this age follow AASM behavioural sleep guidance and WHO sleep guidance for under-5s in the registry.',
  '19_24m:safety': 'Repetition and consistent labelling as the basis for early hazard recognition follow AAP positive-parenting guidance in the registry.',
  '2y:nutrition': 'Normal picky eating and growing food independence at 2 years follow the Bright Futures preventive-care schedule and WHO complementary-feeding guidance in the registry.',
  '2y:sleep': 'Lengthening night sleep with brief self-settling around 2 years follows WHO sleep guidance for under-5s and AASM behavioural sleep guidance in the registry.',
  '2y:safety': 'Early, inconsistent rule-following around 2 years and the value of simple consistent rules follow AAP positive-parenting guidance in the registry.',
  '2_5y:nutrition': 'The need for repeated, pressure-free exposure to accept new foods is described in Bright Futures guidance and WHO complementary-feeding guidance in the registry.',
  '2_5y:sleep': 'Common bedtime resistance during the push for independence around this age follows AASM behavioural sleep guidance in the registry.',
  '2_5y:safety': 'Growing verbal hazard-naming as a precursor to rule understanding follows AAP positive-parenting guidance and developmental-behavioral paediatrics references in the registry.',
  '3y:nutrition': 'Utensil competence by around 3 years is described in the Bright Futures preventive-care schedule and paediatric occupational-therapy references in the registry.',
  '3y:sleep': 'The typical transition away from napping around age 3, and the importance of a stable bedtime through it, follows WHO sleep guidance for under-5s in the registry.',
  '3y:safety': 'More reliable rule-following by age 3 while supervision remains essential follows AAP positive-parenting guidance in the registry.',
  '3_5y:nutrition': 'Growing ability to sit through family meals is described in Bright Futures guidance and general paediatric developmental references in the registry.',
  '3_5y:sleep': 'Predictable, child-anticipated bedtime routines are described in AASM behavioural sleep guidance in the registry.',
  '3_5y:safety': 'Teaching young children to seek a trusted adult when unsafe is described in AAP positive-parenting guidance in the registry.',
  '4y:nutrition': 'Supervised self-serving as a self-help and fine-motor skill around 4 years is described in paediatric occupational-therapy references and Bright Futures guidance in the registry.',
  '4y:sleep': 'Sleep consolidation and common nighttime fears around age 4 are described in the general paediatrics and AASM behavioural sleep references in the registry.',
  '4y:safety': 'Understanding the reasoning behind safety rules around age 4 is described in AAP positive-parenting guidance and developmental-behavioral paediatrics references in the registry.',
  '4_5y:nutrition': 'Early food knowledge and supervised kitchen participation are described in the Bright Futures preventive-care schedule and WHO nutrition-education guidance in the registry.',
  '4_5y:sleep': 'Growing independent nighttime self-settling around this age follows AASM behavioural sleep guidance in the registry.',
  '4_5y:safety': 'Structured road-safety habit-building at this age follows AAP positive-parenting guidance and Bright Futures guidance in the registry.',
  '5y:nutrition': 'Food variety and household task participation as school-readiness self-help skills are described in the Bright Futures preventive-care schedule in the registry.',
  '5y:sleep': 'Independent bedtime-routine management as a school-readiness skill is described in the Bright Futures preventive-care schedule in the registry.',
  '5y:safety': 'Teaching personal information and trusted-adult recognition as a pre-kindergarten safety skill is described in AAP positive-parenting guidance in the registry.',
};

for (const [ageGroupKey, domain, title, observe, why, encouragement] of NUTRITION_SLEEP_SAFETY) {
  authored.push(kb(
    milestone(ageGroupKey, domain, 1, { title, observe, why, encouragement }),
    NUTRITION_SLEEP_SAFETY_EVIDENCE[`${ageGroupKey}:${domain}`],
  ));
}

// Second-round gap fill: self_help, emotional, social, cognitive, play, and
// safety items identified by comparing the corpus against further external
// milestone references. self_help was the single most under-covered domain —
// 2y and 4y had no real self-care milestone at all (4y's only self_help-tagged
// item is actually a pretend-play/social skill from the shared preschool
// template above) — and emotional had zero titled entries across five
// straight preschool bands (3y through 5y).
type GapFill = [ageGroupKey: string, domain: string, n: number, title: Bilingual, observe: Bilingual, why: Bilingual, encouragement: Bilingual];

const GAP_FILL: GapFill[] = [
  ['2y', 'self_help', 1,
    b('ရိုးရှင်းသော အိမ်မှုကိစ္စငယ်များတွင် ပါဝင်ကူညီလုပ်ဆောင်ခြင်း', 'Shows increasing independence and helps with simple chores'),
    b('ကစားပြီးသည့်အခါ အရုပ်များကို သေတ္တာထဲသို့ ပြန်လည်သိမ်းဆည်းရာတွင် ကူညီပါသလား သို့မဟုတ် ရိုးရှင်းသော အိမ်မှုကိစ္စတစ်ခုခုတွင် ပါဝင်ကူညီပါသလား။', 'Does your child help put a toy back in its box after playing, or help with one simple household task?'),
    b('ဤအရွယ်တွင် "မိမိကိုယ်တိုင် လုပ်ဆောင်လိုသောဆန္ဒ" ပိုမိုအားကောင်းလာပြီး ရိုးရှင်းသော ကိစ္စရပ်များတွင် ပါဝင်ကူညီလိုစိတ် စတင်ဖြစ်ပေါ်လာပါသည်။', 'A stronger "I can do it" drive appears now, and children begin wanting to help with simple tasks.'),
    b('ရိုးရှင်းလွယ်ကူသော အလုပ်တစ်ခုချင်းစီကိုသာ ကူညီခိုင်းစေပြီး လုပ်ဆောင်နိုင်သည့်အခါတိုင်း ချီးကျူးစကား ပြောပေးပါ။', 'Ask for one simple task at a time and praise the effort, not just the result.')],
  ['2y', 'self_help', 2,
    b('အိမ်သာသုံးစွဲရန် စိတ်ဝင်စားမှု သို့မဟုတ် အဆင်သင့်ဖြစ်မှု လက္ခဏာများ ပြသခြင်း', 'Shows signs of interest or readiness for potty training'),
    b('အနှီး သို့မဟုတ် ဘောင်းဘီ စိုစွတ်ညစ်ပေနေပါက မသက်မသာဖြစ်ဟန် ပြသခြင်း၊ အခြားသူများ အိမ်သာသုံးသည်ကို စိတ်ဝင်စားစွာ ကြည့်ရှုခြင်း သို့မဟုတ် "သေး/ချီး ပါထားတယ်" ဟု ကိုယ်တိုင် ပြောပြခြင်း ရှိပါသလား။', 'Does your child show discomfort with a wet nappy, watch others use the toilet, or tell you when they are wet?'),
    b('ဤလက္ခဏာများသည် ခန္ဓာကိုယ်၏ စွန့်ထုတ်မှုကို စတင်သတိပြုနားလည်လာကြောင်း ပြသပြီး အိမ်သာသုံးစွဲရန် လေ့ကျင့်ပေးနိုင်သည့် အချိန်နီးကပ်လာပြီဖြစ်ကြောင်း ညွှန်ပြပါသည် (ကလေးတစ်ဦးနှင့်တစ်ဦး အဆင်သင့်ဖြစ်သည့် အချိန်ချင်း မတူညီကြပါ)။', 'These signs show growing body awareness and suggest toilet training may be approaching — readiness timing varies widely between children.'),
    b('ဖိအားမပေးဘဲ အိမ်သာခွက်/အိမ်သာသုံးစွဲခြင်းနှင့် ရင်းနှီးကျွမ်းဝင်လာစေရန် စိတ်ရှည်စွာ ဖြည်းဖြည်းချင်း မိတ်ဆက်ပေးပါ။', 'You can start gently introducing the potty without any pressure.')],
  ['2y', 'cognitive', 1,
    b('အဆင့် ၂ ဆင့်ပါသော ညွှန်ကြားချက်ကို ဆက်တိုက် လိုက်နာနိုင်ခြင်း', 'Follows a two-step direction'),
    b('"ကစားတုံးကို ကောက်ယူပြီး သေတ္တာထဲ ထည့်လိုက်ပါ" ကဲ့သို့သော အဆင့် ၂ ဆင့် ဆက်စပ်နေသည့် ညွှန်ကြားချက်ကို ကလေးငယ်က လိုက်နာနိုင်ပါသလား။', 'Can your child follow a linked two-step instruction, like "pick up the block and put it in the box"?'),
    b('အဆင့် ၂ ဆင့်ပါ ညွှန်ကြားချက်ကို မှတ်ဉာဏ်တွင် မှတ်သားကာ ဆက်တိုက် လုပ်ဆောင်နိုင်ခြင်းသည် ဘာသာစကား နားလည်နိုင်စွမ်းနှင့် မှတ်ဉာဏ်စွမ်းရည် တိုးတက်လာကြောင်း ပြသပါသည်။', 'Holding and following two linked steps shows growing language understanding and memory.'),
    b('နေ့စဉ် လုပ်ဆောင်ချက်များတွင် ရိုးရှင်းသော အဆင့် ၂ ဆင့်ပါ ညွှန်ကြားချက်လေးများကို ပေး၍ လေ့ကျင့်ပေးပါ။', 'Practise two-step instructions during everyday routines.')],
  ['19_24m', 'social', 1,
    b('အခြား ကလေးများကို မြင်တွေ့ရလျှင် ပျော်ရွှင်တက်ကြွပြီး ၎င်းတို့ ကစားသည့်အနီးသို့ ဝင်ရောက်ကစားခြင်း', 'Gets excited by other children and starts joining their play'),
    b('အခြား ကလေးများကို မြင်တွေ့သည့်အခါ ကလေးငယ်က ပျော်ရွှင်စွာ ဖော်ပြပါသလား။ ၎င်းတို့ ကစားနေသည့်အနီးသို့ သွားရောက်ကစားပါသလား (ကစားစရာများကို ဝေမျှကစားရန် မမျှော်လင့်နိုင်သေးပါ)။', 'Does your child get excited seeing other children, and move closer to join their play — even if sharing is not yet expected?'),
    b('ဤအရွယ်တွင် ရွယ်တူကလေးများအပေါ် စိတ်ဝင်စားမှု ပိုမိုကြီးထွားလာသော်လည်း ကစားစရာ ဝေမျှခြင်းနှင့် အလှည့်ကျ ကစားခြင်းများကို နားလည်နိုင်ရန် အချိန်ယူရပါသေးသည်။', 'Interest in other children grows now, though sharing and turn-taking are still a while off.'),
    b('အပိုင်းအစ အများအပြားပါသော ကစားစရာများကို ပေးထားပါ — ကစားစရာတစ်ခုတည်းအတွက် လုယက်ငြင်းခုံမှုများကို လျော့နည်းစေပါသည်။', 'Offer toys with plenty of pieces to go around, which reduces conflict over a single item.')],
  ['2_5y', 'self_help', 3,
    b('အိမ်သာသုံးစွဲခြင်းကို စတင်လေ့ကျင့်နေခြင်း (Potty training)', 'Potty training is in progress'),
    b('ကလေးငယ်က အိမ်သာသုံးစွဲရန် ကြိုးစားနေပါသလား — တစ်ခါတရံ အောင်မြင်ပြီး တစ်ခါတရံ အချိန်မီ မသွားနိုင်ဘဲ အဝတ်ပေကျံသွားတတ်ပါသလား။', 'Is your child actively trying to use the potty — succeeding sometimes and having accidents other times?'),
    b('အိမ်သာသုံးစွဲခြင်းကို လေ့ကျင့်ရာတွင် အချိန်ယူရတတ်ပြီး အချိန်မီ မသွားနိုင်ဘဲ အဝတ်ပေကျံခြင်းများသည် အလွန် သဘာဝကျသဖြင့် ကလေးကို လုံးဝ အပြစ်မတင်သင့်ပါ။', 'Toilet training can take a while, and accidents along the way are very normal — never something to blame a child for.'),
    b('အိမ်သာ အောင်မြင်စွာ သွားနိုင်သည့်အခါတိုင်း အေးဆေးစွာ ချီးကျူးပေးပါ၊ အဝတ်ပေကျံသွားသည့် အခါများတွင်လည်း စိတ်မဆိုးဘဲ တည်ငြိမ်စွာဖြင့် နောက်တစ်ကြိမ် ထပ်မံ ကြိုးစားစေပါ။', 'Praise calmly each success and stay relaxed and matter-of-fact about accidents.')],
  ['2_5y', 'self_help', 4,
    b('လူကြီး အကူအညီဖြင့် သွားတိုက်ခြင်း', 'Brushes teeth with help'),
    b('သွားတိုက်တံကို ကိုင်တွယ်ပြီး ကလေးငယ်က ကိုယ်တိုင် သွားတိုက်ကြည့်ပါသလား (ပြောင်စင်စေရန် လူကြီးက ထပ်မံ တိုက်ပေးရန် လိုအပ်ပါသည်)။', 'Does your child hold the toothbrush and try brushing, even though you still need to finish the job?'),
    b('ဤအရွယ်တွင် ကလေးငယ်၏ လက်ချောင်းကြွက်သား လှုပ်ရှားနိုင်စွမ်းမှာ အပြည့်အဝ မကျွမ်းကျင်သေးသဖြင့် သွားများကို ပြောင်စင်စွာ တိုက်နိုင်ရန် လူကြီး၏ အကူအညီ ဆက်လက် လိုအပ်ပါသည်။', 'Hand skill is not yet precise enough at this age, so adult finishing is still needed.'),
    b('ကလေးငယ်အား ဦးစွာ ကိုယ်တိုင် တိုက်ခွင့်ပြုပြီးနောက် နောက်ဆုံးတွင် မိဘက ပြောင်စင်အောင် ဂရုတစိုက် ထပ်မံ တိုက်ပေးပါ။', 'Let your child brush first, then finish carefully yourself.')],
  ['2_5y', 'self_help', 5,
    b('ကိုယ်တိုင် လက်ဆေးခြင်းနှင့် လက်သုတ်ခြင်း ပြုလုပ်နိုင်ခြင်း', 'Washes and dries own hands'),
    b('လက်ဆေးကန်တွင် လူကြီး၏ အကူအညီ အနည်းငယ်ဖြင့် ကလေးငယ်က မိမိလက်ကို ကိုယ်တိုင် ဆေးကြောပြီး သုတ်ပါသလား။', 'With a little help, does your child wash and dry their own hands at the sink?'),
    b('လက်ဆေးခြင်း အဆင့်ဆင့်ကို ကိုယ်တိုင် လုပ်ဆောင်နိုင်ခြင်းသည် တစ်ကိုယ်ရေ သန့်ရှင်းရေးနှင့် ကျန်းမာရေး အလေ့အထကောင်းများကို စောစီးစွာ တည်ဆောက်ပေးပါသည်။', 'Managing the hand-washing sequence themselves builds an early health habit.'),
    b('ဘေစင်အနီးတွင် ကလေးရပ်ရန် ခြေနင်းခုံလေး ထားပေးပြီး လက်ဆေးသည့် အဆင့်များကို ရိုးရှင်းစွာ စံပြလုပ်ဆောင်ပြသပေးပါ။', 'Provide a step stool and show the steps in a simple, repeatable order.')],
  ['2_5y', 'social', 3,
    b('အခြား ကလေးများနှင့် ဘေးချင်းယှဉ် ကစားရုံသာမက အတူတကွ ပူးပေါင်းကစားတတ်လာခြင်း', 'Plays cooperatively with other children, not just alongside them'),
    b('အခြား ကလေးများနှင့် ကစားတုံး ဝေမျှကစားခြင်း သို့မဟုတ် အတူတကွ တည်ဆောက်ကစားခြင်းကဲ့သို့ ပူးပေါင်းပါဝင် ကစားပါသလား (ဘေးချင်းယှဉ်၍ သီးခြားစီ ကစားရုံသာ မဟုတ်ဘဲ)။', 'Does your child actually take part with other children — sharing a toy or building together — rather than just playing near them?'),
    b('ဘေးချင်းယှဉ် ကစားခြင်း (Parallel play) မှသည် အတူတကွ ပူးပေါင်းကစားခြင်း (Cooperative play) သို့ ကူးပြောင်းလာခြင်းသည် ကလေးငယ်၏ လူမှုဆက်ဆံရေး စွမ်းရည်တွင် အရေးပါသော တိုးတက်မှုတစ်ခု ဖြစ်ပါသည်။', 'Moving from parallel play to cooperative play is an important social development step.'),
    b('ကလေးနှစ်ဦး အတူတကွ ကစားနိုင်သော ရိုးရှင်းသည့် ကစားနည်းများ (ဥပမာ — ဘောလုံး အပြန်အလှန် လှိမ့်ပေးခြင်း) ကို အားပေးကစားစေပါ။', 'Encourage simple two-child games, like rolling a ball back and forth.')],
  ['2_5y', 'play', 1,
    b('ဟန်ဆောင်ကစားရာတွင် ပစ္စည်းတစ်ခုကို အခြားအရာတစ်ခုအဖြစ် စိတ်ကူးဖြင့် အစားထိုးကစားခြင်း', 'Uses one object to stand for another in pretend play'),
    b('ကစားတုံးကို ဖုန်းအဖြစ် သို့မဟုတ် ဇွန်းကို ကားစတီယာရင်ဘီးအဖြစ် စိတ်ကူးယဉ်၍ အစားထိုး ကစားတတ်ပါသလား။', 'Does your child pretend a block is a phone, or a spoon is a steering wheel?'),
    b('ပစ္စည်းတစ်ခုကို အခြားအရာတစ်ခုအဖြစ် စိတ်ကူးဉာဏ်ဖြင့် အစားထိုး စဉ်းစားနိုင်ခြင်းသည် သင်္ကေတဆိုင်ရာ တွေးခေါ်မှု (Symbolic thinking) ဖွံ့ဖြိုးတိုးတက်မှု၏ အရေးပါသော အဆင့်တစ်ခု ဖြစ်ပါသည်။', 'Letting one object represent another in the imagination is an important step in symbolic thinking.'),
    b('ကလေးငယ်၏ စိတ်ကူးဉာဏ်ကို အသိအမှတ်ပြု လက်ခံပေးပြီး ၎င်းတို့၏ စိတ်ကူးယဉ် ဇာတ်လမ်းလေးထဲတွင် အတူတကွ ပါဝင်ကစားပေးပါ။', 'Accept your child’s imaginative idea and build on it together.')],
  ['3y', 'self_help', 3,
    b('ကစားစရာများကို ပြန်သိမ်းခြင်းနှင့် အညစ်အကြေးအဝတ်များကို ဘူးထဲထည့်ခြင်း', 'Puts toys away and dirty clothes in the laundry basket'),
    b('ကစားပြီးရင် ကစားစရာများကို လူကြီးအကူအညီဖြင့် ပြန်သိမ်းပါသလား။ အညစ်အကြေးအဝတ်ကို ဘူးထဲ ထည့်ပါသလား။', 'After play, does your child help put toys away? Do they put dirty clothes in the laundry basket?'),
    b('ရိုးရှင်းသော သိမ်းဆည်းခြင်း အလေ့အထများက တာဝန်ယူမှုနှင့် အိမ်မှုပါဝင်ခြင်းကို စတင် တည်ဆောက်ပေးသည်။', 'Simple tidying habits begin to build responsibility and household participation.'),
    b('ရိုးရှင်းသော ညွှန်ကြားချက်တစ်ခုတည်းပေးပြီး ပြီးသည့်အခါ ချီးကျူးပါ။', 'Give one simple instruction at a time and praise when it is done.')],
  ['3y', 'self_help', 4,
    b('စားပွဲပြင်ရာတွင် ကူညီပြီး ပန်းကန်များကို ဆေးကန်သို့ သယ်ဆောင်ခြင်း', 'Helps set the table and carries dishes to the sink'),
    b('ခွက်၊ ဇွန်းများကို စားပွဲပေါ်တင်ရန် ကူညီပါသလား။ စားပြီးလျှင် ပန်းကန်ကို ဆေးကန်သို့ သယ်ဆောင်ပါသလား။', 'Does your child help place cups or spoons on the table, and carry a plate to the sink after eating?'),
    b('ဒီလိုအလုပ်ငယ်များသည် လက်ထိန်းချုပ်မှုနှင့် မိသားစုလုပ်ငန်းများတွင် ပါဝင်နိုင်စွမ်းကို တည်ဆောက်ပေးသည်။', 'These small jobs build hand control and a sense of contributing to the family.'),
    b('မကွဲသောပန်းကန်ခွက်များကိုသာ သယ်စေပြီး အောင်မြင်တိုင်း ကျေးဇူးတင်ကြောင်း ပြောပါ။', 'Have your child carry only unbreakable items, and thank them each time.')],
  ['3y', 'emotional', 1,
    b('ခံစားချက် အမျိုးမျိုးကို ဖော်ပြနိုင်ခြင်း', 'Shows a wide range of emotions'),
    b('ပျော်ရွှင်ခြင်း၊ စိတ်ဆိုးခြင်း၊ ကြောက်ခြင်း၊ ဝမ်းနည်းခြင်း စသော ခံစားချက်များစွာကို မျက်နှာနှင့် အပြုအမူဖြင့် ဖော်ပြပါသလား။', 'Does your child express a range of emotions — happy, angry, scared, sad — through face and behavior?'),
    b('ခံစားချက်အမျိုးမျိုးကို ဖော်ပြနိုင်ခြင်းသည် ကိုယ်ပိုင်ခံစားမှုကို သိရှိလာခြင်း၏ ပုံမှန် အစိတ်အပိုင်းဖြစ်သည် — ထိန်းချုပ်မှုကတော့ တဖြည်းဖြည်း လိုက်လာမည်။', 'Expressing a range of feelings is a normal part of growing emotional awareness — self-regulation follows gradually.'),
    b('ခံစားချက်ကို အမည်တပ်ပေးပါ ("စိတ်ဆိုးနေတာ သိတယ်") — ထိန်းချုပ်ရန် ကူညီပေးသည်။', 'Name the feeling out loud ("I can see you’re angry") — it helps with self-regulation.')],
  ['3y', 'play', 1,
    b('စိတ်ကူးထဲက သူငယ်ချင်း (အတုယူကစားဖော်) ရှိနိုင်ခြင်း', 'May have an imaginary friend'),
    b('မမြင်ရသော "သူငယ်ချင်း" တစ်ဦးနှင့် စကားပြော၊ ကစားနေတတ်ပါသလား။', 'Does your child sometimes talk to or play with an imaginary friend?'),
    b('စိတ်ကူးဖော်သူငယ်ချင်းရှိခြင်းသည် ကျန်းမာသော စိတ်ကူးဉာဏ်ဖွံ့ဖြိုးမှု၏ ပုံမှန် အစိတ်အပိုင်း ဖြစ်ပြီး စိုးရိမ်စရာ မဟုတ်ပါ။', 'Having an imaginary friend is a normal part of healthy imaginative development, not a cause for concern.'),
    b('ကလေး၏ စိတ်ကူးကို လေးစားစွာ လက်ခံပြီး စိတ်ကူးဇာတ်လမ်းထဲ ပါဝင်ကစားနိုင်ပါသည်။', 'Respect your child’s imagination, and feel free to join their imaginative story.')],
  ['4y', 'self_help', 3,
    b('ကိုယ်တိုင် သွားတိုက်ခြင်း', 'Brushes own teeth'),
    b('သွားတိုက်တံကို ကိုင်ပြီး သွားများကို အားလုံး ကိုယ်တိုင် တိုက်ကြည့်ပါသလား (လူကြီးက စစ်ဆေးပေးရန် လိုသေးသည်)။', 'Can your child hold the brush and clean their teeth mostly independently, even though you still check afterward?'),
    b('လက်ကျွမ်းကျင်မှု တိုးတက်လာသဖြင့် ဒီအရွယ်တွင် သွားတိုက်ခြင်းကို ပိုမိုကိုယ်တိုင် လုပ်နိုင်လာသည်။', 'Growing hand skill lets most 4-year-olds manage more of toothbrushing themselves.'),
    b('ကလေးတိုက်ပြီးနောက် လူကြီးက အနည်းငယ် ထပ်စစ်ပေးပါ — အထူးသဖြင့် နောက်ဖက်သွားများ။', 'After your child brushes, do a quick adult check, especially the back teeth.')],
  ['4y', 'self_help', 4,
    b('ခလုတ်ချုပ်ကြိုးထက် အခြားအဝတ်အစားများကို ကိုယ်တိုင် ဝတ်၊ချွတ်နိုင်ခြင်း', 'Dresses and undresses with little help, except shoelaces'),
    b('အင်္ကျီ၊ ဘောင်းဘီများကို ကိုယ်တိုင် ဝတ်၊ချွတ်နိုင်ပါသလား (ဖိနပ်ကြိုးချည်ရုံသာ အကူအညီလိုသေးသည်)။', 'Can your child put on and take off shirts and trousers mostly alone, needing help mainly with shoelaces?'),
    b('ဤအရွယ်တွင် အဝတ်အစားနှင့် ပတ်သက်သော လုပ်ဆောင်ချက်များ ပိုမိုလွတ်လပ်လာပြီး ကြိုးချည်ခြင်းကဲ့သို့ အသေးစိတ်လုပ်ငန်းသာ ကျန်ရှိသည်။', 'Dressing becomes largely independent now, with only fine tasks like tying laces still needing help.'),
    b('အချိန်ဖိအားမပေးဘဲ ကိုယ်တိုင်ဝတ်ရန် အချိန်အနည်းငယ် ထပ်ပေးပါ။', 'Allow a little extra time and avoid rushing while your child dresses themselves.')],
  ['4y', 'emotional', 1,
    b('အခြားသူများ၏ ခံစားချက်ကို စိတ်ဝင်စားမှု ပြခြင်း', 'Shows concern for others’ feelings'),
    b('တစ်စုံတစ်ယောက် ငိုနေလျှင် သို့မဟုတ် ဒုက္ခရောက်နေလျှင် သတိပြုမိပြီး တုံ့ပြန်ပါသလား (နှစ်သိမ့်ရန် ကြိုးစားခြင်း၊ မေးခြင်း)။', 'When someone is upset or crying, does your child notice and respond — trying to comfort them or asking what is wrong?'),
    b('ဒီလိုတုံ့ပြန်မှုသည် အခြားသူ၏ ခံစားမှုကို စတင် နားလည်စာနာနိုင်ခြင်း၏ အစောပိုင်း လက္ခဏာ ဖြစ်သည်။', 'This response is an early sign of empathy — beginning to understand how someone else feels.'),
    b('"သူငယ်ချင်းက ဘယ်လိုခံစားနေမလဲ" ဟု မေးပြီး တွေးခေါ်ခိုင်းပါ။', 'Ask "how do you think your friend feels?" to encourage this thinking.')],
  ['4_5y', 'self_help', 3,
    b('ရိုးရှင်းသော အိမ်မှုအလုပ်တစ်ခုကို ကူညီလုပ်ဆောင်ခြင်း', 'Helps with a simple household chore'),
    b('အိမ်မွေးတိရစ္ဆာန်ကို အစာကျွေးခြင်း ဒါမှမဟုတ် အဝတ်လျှော်ရာတွင် ရိုးရှင်းသော အလုပ်တစ်ခုကို ပုံမှန် ကူညီပါသလား။', 'Does your child regularly help with something like feeding a pet or a simple laundry task?'),
    b('ပုံမှန် အိမ်မှုတာဝန် တစ်ခုတွင် ပါဝင်ခြင်းသည် တာဝန်ယူမှုနှင့် မိသားစု၏ တစ်စိတ်တစ်ပိုင်း ဖြစ်ကြောင်း ခံစားမှုကို တည်ဆောက်ပေးသည်။', 'Taking part in a regular household task builds responsibility and a sense of belonging to the family.'),
    b('အသက်အရွယ်နှင့် ကိုက်ညီသော တာဝန်တစ်ခုတည်းကို ပုံမှန် ပေးထားပြီး ကလေးကိုယ်တိုင် တာဝန်ယူသည်ဟု ခံစားစေပါ။', 'Give one consistent, age-appropriate job so your child feels real ownership of it.')],
  ['5y', 'emotional', 1,
    b('အခြားသူများကို နားလည်စာနာပြီး မှန်/မှား ကွဲပြားမှုကို နားလည်ခြင်း', 'Shows empathy and understands right from wrong'),
    b('အခြားသူတစ်ဦး ထိခိုက်နာကျင်ရင် ဝမ်းနည်းဟန်ပြပါသလား။ လုပ်ရပ်တစ်ခုက ဘာကြောင့် "မှား" သည်ကို ရှင်းပြနိုင်ပါသလား။', 'Does your child show sadness when another person is hurt? Can they explain why an action is "wrong"?'),
    b('နားလည်စာနာမှုနှင့် မှန်/မှား ခွဲခြားနိုင်မှုသည် ကျောင်းအရွယ်မတိုင်မီ လူမှု/ခံစားမှု ဖွံ့ဖြိုးမှု၏ အရေးကြီးသော အဆင့်ဖြစ်သည်။', 'Empathy and a sense of right and wrong are important pre-school social-emotional milestones.'),
    b('ဇာတ်လမ်းများကို အတူဖတ်ပြီး "ဒီဇာတ်ကောင်က ဘာကြောင့် ဒီလိုလုပ်တာလဲ" ဟု ဆွေးနွေးပါ။', 'Read stories together and discuss why a character acted the way they did.')],
  ['5y', 'safety', 2,
    b('ကိုယ်ပိုင်နေရပ်လိပ်စာနှင့် ဖုန်းနံပါတ်ကို သိရှိခြင်း', 'Knows own address and phone number'),
    b('နေရပ်လိပ်စာ သို့မဟုတ် မိဘဖုန်းနံပါတ်ကို (အကြမ်းဖျင်းသော်လည်း) ပြောနိုင်ပါသလား။', 'Can your child say their home address or a parent’s phone number, even roughly?'),
    b('ကိုယ်ပိုင်အချက်အလက်များကို သိရှိခြင်းသည် ကျောင်းသွားရန် အသင့်ဖြစ်ချိန်တွင် အရေးကြီးသော ဘေးကင်းရေး ကျွမ်းကျင်မှုတစ်ခု ဖြစ်သည်။', 'Knowing this personal information is an important safety skill going into school.'),
    b('သီချင်း သို့မဟုတ် ထပ်ခါထပ်ခါ ရွတ်ဆိုပြီး လိပ်စာ/ဖုန်းနံပါတ်ကို ကစားရင်း လေ့ကျင့်ပေးနိုင်ပါသည်။', 'Turn the address or phone number into a simple song or repeated game to help it stick.')],
  ['5y', 'safety', 3,
    b('အရေးပေါ်အခြေအနေတွင် အကူအညီ ဘယ်လိုတောင်းရမည်ကို သိရှိခြင်း', 'Knows how to ask for help in an emergency'),
    b('အန္တရာယ်ဖြစ်လျှင် ဘယ်သူ့ဆီ ဆက်သွယ်ရမည်၊ ဘာပြောရမည်ကို ရိုးရှင်းစွာ သိရှိပါသလား (ဥပမာ- "အကူအညီလိုတယ်" ဟု ကျယ်လောင်စွာ ပြောခြင်း)။', 'In an emergency, does your child have a simple sense of who to go to and what to say — like calling out "I need help"?'),
    b('အရေးပေါ်တွင် အကူအညီ ရှာဖွေနိုင်စွမ်းသည် ကိုယ်ပိုင်ဘေးကင်းရေး ကျွမ်းကျင်မှု၏ အရေးကြီးဆုံး အစိတ်အပိုင်းတစ်ခု ဖြစ်သည်။', 'Being able to seek help in an emergency is one of the most important self-protective safety skills.'),
    b('ရိုးရှင်းသော အခြေအနေဇာတ်လမ်းဖြင့် "ဒီလိုဖြစ်ရင် ဘယ်သူ့ဆီသွားမလဲ" ဟု ငြိမ်ငြိမ်သက်သက် လေ့ကျင့်ပြပါ။', 'Practise calmly with simple scenarios: "if this happens, who would you go to?"')],
];

const GAP_FILL_EVIDENCE: Record<string, string> = {
  '2y:self_help:1': 'Growing task-participation and independence around age 2 follow the Bright Futures preventive-care schedule and paediatric occupational-therapy references in the registry.',
  '2y:self_help:2': 'Early signs of toilet-training readiness are described in Bright Futures guidance and AAP developmental references in the registry.',
  '2y:cognitive:1': 'Following two-step directions around age 2 is described in CDC milestone checklists and developmental-behavioral paediatrics references in the registry.',
  '19_24m:social:1': 'Growing interest in peers and early parallel play around this age follow the NICE social and emotional wellbeing guidance and developmental-behavioral paediatrics references in the registry.',
  '2_5y:self_help:3': 'Typical toilet-training progress and the normalcy of accidents follow Bright Futures guidance in the registry.',
  '2_5y:self_help:4': 'Emerging, adult-assisted toothbrushing around this age is described in AAP oral-health guidance in the registry.',
  '2_5y:self_help:5': 'Independent hand-washing as an early self-care habit is described in the Bright Futures preventive-care schedule in the registry.',
  '2_5y:social:3': 'The shift from parallel to cooperative play is described in the NICE social and emotional wellbeing guidance and developmental-behavioral paediatrics references in the registry.',
  '2_5y:play:1': 'Symbolic (object-substitution) pretend play as a cognitive milestone is described in the AAP Power of Play guidance in the registry.',
  '3y:self_help:3': 'Early tidying and household participation are described in the Bright Futures preventive-care schedule in the registry.',
  '3y:self_help:4': 'Simple table-help tasks as self-help and fine-motor skills are described in paediatric occupational-therapy references in the registry.',
  '3y:emotional:1': 'A widening emotional vocabulary and expression around age 3 follow the NICE social and emotional wellbeing guidance in the registry.',
  '3y:play:1': 'Imaginary friends as a normal feature of preschool imaginative play are described in developmental-behavioral paediatrics references in the registry.',
  '4y:self_help:3': 'Increasingly independent toothbrushing around age 4 is described in AAP oral-health guidance in the registry.',
  '4y:self_help:4': 'Largely independent dressing except fine tasks like fasteners and laces is described in paediatric occupational-therapy references and Bright Futures guidance in the registry.',
  '4y:emotional:1': 'Emerging empathy and concern for others around age 4 follow the NICE social and emotional wellbeing guidance in the registry.',
  '4_5y:self_help:3': 'Regular participation in a household task as a self-help and responsibility skill is described in the Bright Futures preventive-care schedule in the registry.',
  '5y:emotional:1': 'Empathy and an emerging sense of right and wrong as pre-kindergarten social-emotional skills follow the NICE social and emotional wellbeing guidance in the registry.',
  '5y:safety:2': 'Knowing personal safety information (address, phone number) as a pre-kindergarten skill is described in AAP positive-parenting guidance in the registry.',
  '5y:safety:3': 'Knowing how to seek help in an emergency as a pre-kindergarten safety skill is described in AAP positive-parenting guidance in the registry.',
};

for (const [ageGroupKey, domain, n, title, observe, why, encouragement] of GAP_FILL) {
  authored.push(kb(
    milestone(ageGroupKey, domain, n, { title, observe, why, encouragement }),
    GAP_FILL_EVIDENCE[`${ageGroupKey}:${domain}:${n}`],
  ));
}

// Cross-checked against UNICEF's own published parenting milestone pages
// (unicef.org/parenting/child-development) — most of what UNICEF covers was
// already closed by the two rounds above (crawling, peekaboo, waving,
// dressing help, standing alone, potty readiness, stranger anxiety all match).
// A few small, genuinely absent items remained, all at 13_18m.
const UNICEF_GAP_FILL: GapFill[] = [
  ['13_18m', 'cognitive', 2,
    b('မေးမြန်းသည့်အခါ ခန္ဓာကိုယ်အစိတ်အပိုင်းများကို လက်ညှိုးထိုးပြနိုင်ခြင်း', 'Points to a body part when asked'),
    b('"နှာခေါင်းလေး ဘယ်မှာလဲ" ဟု မေးသည့်အခါ ကလေးငယ်က မိမိ၏ နှာခေါင်း သို့မဟုတ် မျက်လုံးစသည့် လူသိများသော ခန္ဓာကိုယ်အစိတ်အပိုင်းတစ်ခုခုကို လက်ညှိုးထိုးပြနိုင်ပါသလား။', 'If asked "where\'s your nose?", can your child point to their own nose, eyes, or another familiar body part?'),
    b('ခန္ဓာကိုယ်အစိတ်အပိုင်းများကို ၎င်းတို့၏ အမည်များနှင့် ချိတ်ဆက်နားလည်နိုင်ခြင်းသည် စကားလုံး နားလည်နိုင်စွမ်းနှင့် မိမိခန္ဓာကိုယ်အပေါ် သတိပြုနားလည်မှု ပေါင်းစပ်တိုးတက်လာခြင်းကို ဖော်ပြပါသည်။', 'Connecting a body part to its name shows growing language understanding paired with body awareness.'),
    b('ရေချိုးချိန် သို့မဟုတ် အဝတ်အစား ဝတ်ဆင်ပေးချိန်များတွင် "မျက်လုံးလေး ဘယ်မှာလဲ"၊ "ပါးစပ်လေး ဘယ်မှာလဲ" စသည်ဖြင့် ပျော်ရွှင်စွာ ကစားရင်း မေးမြန်းပေးပါ။', 'Ask playfully during bath time or dressing — "where are your eyes?"')],
  ['13_18m', 'cognitive', 3,
    b('လက်ဟန်ခြေဟန် မပါဘဲ စကားလုံးသက်သက်ဖြင့် ပေးသော ရိုးရှင်းသည့် ညွှန်ကြားချက်ကို လိုက်နာနိုင်ခြင်း', 'Follows a one-step instruction without a gesture'),
    b('လက်ညှိုးထိုးပြခြင်း သို့မဟုတ် လက်ဟန်ပြခြင်း မပါဘဲ "ဒီကိုလာပါ" သို့မဟုတ် "ထိုင်ပါ" ကဲ့သို့သော စကားလုံးသက်သက်ဖြင့် ပေးသည့် ညွှန်ကြားချက်ကို ကလေးငယ်က လိုက်နာနိုင်ပါသလား။', 'Can your child follow a simple word-only instruction like "come here" or "sit down," without you pointing or gesturing?'),
    b('လက်ဟန်ခြေဟန် အကူအညီမပါဘဲ စကားသံသက်သက်ကို နားလည်နိုင်ခြင်းသည် ဘာသာစကား နားလည်သဘောပေါက်နိုင်စွမ်း ပိုမိုခိုင်မာတိုးတက်လာကြောင်း ဖော်ပြသည်။', 'Understanding words alone, without a gesture as a hint, shows more genuine language comprehension.'),
    b('ရိုးရှင်းသော ညွှန်ကြားချက်များ ပေးသည့်အခါ လက်ဟန်မပြမီ စကားလုံးသက်သက်ဖြင့် ဦးစွာ ပြောပြပြီး စောင့်ကြည့်ပါ။', 'Try giving a simple instruction with words alone first, before adding a gesture.')],
  ['13_18m', 'emotional', 1,
    b('စိတ်တိုင်းမကျသည့်အခါ ဂျီကျဒေါသထွက်တတ်ခြင်း', 'Has temper tantrums when frustrated'),
    b('မိမိလိုလားချက်ကို စကားဖြင့် မဖော်ပြနိုင်သေးသည့်အခါ ကလေးငယ်က ပြင်းပြင်းထန်ထန် ငိုကြွေးခြင်း သို့မဟုတ် ကြမ်းပြင်ပေါ် လှဲချခြင်းကဲ့သို့ စိတ်တိုင်းမကျမှုကို ဖော်ပြတတ်ပါသလား။', 'When unable to express a need in words, does your child show intense frustration — crying hard, or dropping to the floor?'),
    b('ဤအရွယ်တွင် ကလေး၏ စိတ်ဆန္ဒနှင့် စကားဖြင့် ဖော်ပြနိုင်စွမ်းအကြား ကွာဟချက် ရှိနေသေးသဖြင့် စိတ်ဆိုးဒေါသထွက်ခြင်းသည် အလွန်ပုံမှန်ဖြစ်သော ဖွံ့ဖြိုးမှုအပိုင်းအခြားတစ်ခုဖြစ်ပြီး ကလေး၏ အကျင့်စာရိတ္တ မကောင်းခြင်း မဟုတ်ပါ။', 'A mismatch between wants and words makes tantrums very normal at this age — not a sign of poor character.'),
    b('ကလေး ဒေါသထွက်နေချိန်တွင် မိဘက တည်ငြိမ်စွာ အနားတွင် နေပေးပါ။ ဘေးကင်းအောင် ထိန်းသိမ်းပေးပြီး ကလေး၏ ခံစားချက်ကို အသိအမှတ်ပြု နားလည်ပေးပါ (ဥပမာ — "သမီး/သား စိတ်တိုင်းမကျဖြစ်နေတာ မေမေ/ဖေဖေ သိပါတယ်")။', 'Stay calm and nearby, keep your child safe, and name the feeling ("I see you\'re frustrated").')],
];

const UNICEF_GAP_FILL_EVIDENCE: Record<string, string> = {
  '13_18m:cognitive:2': 'Naming/pointing to body parts as a receptive-language and body-awareness milestone around this age is described in CDC and AAP milestone guidance in the registry.',
  '13_18m:cognitive:3': 'Following a one-step instruction without an accompanying gesture is described in CDC and AAP milestone guidance in the registry.',
  '13_18m:emotional:1': 'Temper tantrums around this age, driven by the gap between wants and expressive language, are described in the NICE social and emotional wellbeing guidance and AAP positive-parenting guidance in the registry.',
};

for (const [ageGroupKey, domain, n, title, observe, why, encouragement] of UNICEF_GAP_FILL) {
  authored.push(kb(
    milestone(ageGroupKey, domain, n, { title, observe, why, encouragement }),
    UNICEF_GAP_FILL_EVIDENCE[`${ageGroupKey}:${domain}:${n}`],
  ));
}

// Two last small items surfaced by a further round of reference charts, both
// low-value but genuinely absent: "bangs two objects together" had only ever
// appeared inside another entry's observe text, never as its own titled
// skill, and page-turning had no entry at all in the 13_18m band.
const FINAL_GAP_FILL: GapFill[] = [
  ['7_9m', 'fine_motor', 3,
    b('ပစ္စည်းနှစ်ခုကို ယှဉ်တွဲ၍ ရိုက်ခတ်ခြင်း', 'Bangs two objects together'),
    b('ကစားစရာနှစ်ခုကို လက်နှစ်ဖက်ဖြင့် ကိုင်ပြီး အသံထွက်အောင် ယှဉ်တွဲရိုက်ခတ်ပါသလား။', 'Does your child hold a toy in each hand and bang them together to make a sound?'),
    b('ဒီလုပ်ဆောင်ချက်သည် လက်နှစ်ဖက် ညှိနှိုင်းအသုံးပြုနိုင်မှုနှင့် အသံနှင့် လှုပ်ရှားမှု ဆက်စပ်နေကြောင်း စူးစမ်းလေ့လာခြင်း ဖြစ်သည်။', 'This action shows two-handed coordination and early exploration of cause and effect through sound.'),
    b('အသံထွက်တတ်သော ဘေးကင်းသည့် ကစားစရာနှစ်ခုကို ပေးထားပါ။', 'Offer two safe toys that make a sound when tapped together.')],
  ['13_18m', 'fine_motor', 2,
    b('စာအုပ် စာမျက်နှာများကို လှန်လှောကြည့်နိုင်ခြင်း', 'Turns the pages of a book'),
    b('ဂျပ်ထူ ကလေးစာအုပ်များကို ကလေးငယ်က စာမျက်နှာ တစ်ရွက်ချင်းစီဖြစ်စေ၊ အများအပြားဖြစ်စေ ကိုယ်တိုင် လှန်လှောကြည့်ပါသလား။', 'Can your child turn the pages of a board book, even several at a time?'),
    b('စာမျက်နှာများကို လှန်လှောနိုင်ခြင်းသည် လက်ချောင်းငယ်များ ထိန်းချုပ်နိုင်စွမ်းနှင့် စာအုပ်များကို ကိုယ်တိုင် စူးစမ်းလေ့လာလိုစိတ် တိုးတက်လာခြင်းကို ဖော်ပြပါသည်။', 'Page-turning shows finger control and a growing interest in exploring books independently.'),
    b('အလွယ်တကူ မစုတ်ပြဲနိုင်သော ဂျပ်ထူ ကလေးပုံပြင်စာအုပ်များကို ပေးထားပြီး စာမျက်နှာများကို ကလေးငယ် ကိုယ်တိုင် လှန်လှောခွင့် ပြုပါ။', 'Offer sturdy board books and let your child try turning the pages themselves.')],
];

const FINAL_GAP_FILL_EVIDENCE: Record<string, string> = {
  '7_9m:fine_motor:3': 'Banging two objects together as an early two-handed, cause-and-effect skill is described in CDC and AAP milestone guidance in the registry.',
  '13_18m:fine_motor:2': 'Page-turning as a fine-motor and early-literacy skill around this age is described in AAP milestone guidance and the AAP Power of Play guidance in the registry.',
};

for (const [ageGroupKey, domain, n, title, observe, why, encouragement] of FINAL_GAP_FILL) {
  authored.push(kb(
    milestone(ageGroupKey, domain, n, { title, observe, why, encouragement }),
    FINAL_GAP_FILL_EVIDENCE[`${ageGroupKey}:${domain}:${n}`],
  ));
}

export const OLDER_AUTHORED_CONTENT: SeedItem[] = authored;
