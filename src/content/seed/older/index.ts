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
  nutrition: ['tb-bright-futures-4e-2017', 'tb-caring-birth-to-5-8e-2024', 'who-growth-standards-2006'],
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
    encouragement: b('နေ့စဉ် မိနစ်အနည်းငယ် အာရုံစိုက်ပြီး အတူကစားခြင်းက အဈေးကြီးကစားစရာထက် ပိုအရေးကြီးသည်။', 'A few focused minutes of shared play each day matter more than expensive toys.'),
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
  ['2_5y','၂ နှစ်ခွဲ','2.5 years','မျဉ်းပေါ်လျှောက်ခြင်း','Walks along a line','နှစ်ဆင့်ညွှန်ကြားချက် လိုက်နာခြင်း','Follows a two-step direction','တူရာပုံ တွဲခြင်း','Matches identical pictures','အင်္ကျီချွတ်ရန် ကူညီခြင်း','Helps remove clothing'],
  ['3y','၃ နှစ်','3 years','ခြေတစ်ဖက်စီဖြင့် လှေကားတက်ခြင်း','Walks upstairs with alternating feet','အပြန်အလှန် စကားပြောခြင်း','Has a back-and-forth conversation','မိမိအမည် ပြောခြင်း','Says own first name','ဇွန်းခက်ရင်း သုံးခြင်း','Uses a spoon and fork'],
  ['3_5y','၃ နှစ်ခွဲ','3.5 years','ခုန်ပြီး ရပ်တည်ထိန်းခြင်း','Jumps and regains balance','ဖြစ်ရပ်တိုတစ်ခု ပြန်ပြောခြင်း','Retells a short event','အရောင်နှင့် ပုံသဏ္ဌာန် ခွဲခြားခြင်း','Sorts colors and shapes','အဝတ်ဝတ်ရာတွင် ပါဝင်ခြင်း','Participates in dressing'],
  ['4y','၄ နှစ်','4 years','ဘောလုံးကြီးကို ဖမ်းခြင်း','Catches a large ball','မေးခွန်းရိုးရိုး ဖြေခြင်း','Answers simple questions','လူပုံအပိုင်းအချို့ ဆွဲခြင်း','Draws a person with several parts','အခြားကလေးနှင့် အခန်းကဏ္ဍခွဲကစားခြင်း','Shares roles in pretend play'],
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
    }), `Registered ${domain.replace('_', ' ')} references support this conservative parent guide for ${band.en}.`, GUIDE_SOURCES[domain]));
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

export const OLDER_AUTHORED_CONTENT: SeedItem[] = authored;
