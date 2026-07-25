// Knowledge base — Birth to 2 months.
//
// Every item here is authored against the verified evidence registry
// (src/evidence/sources.ts) and linked explicitly in src/evidence/links.ts.
// Nothing in this file diagnoses, predicts a disorder, or promises an outcome.
// Age ranges are described as guidance with normal variation stated plainly.
import { activity, guide, milestone, printable, type SeedItem } from '../../types';
import { kb } from './editorial';

const b = (mm: string, en: string) => ({ mm, en });

// --- Milestones ------------------------------------------------------------
// Guidance only. Babies reach these at different times; the range is wide and
// a baby who is a little later is very often developing normally.

const MILESTONES: SeedItem[] = [
  kb(
    milestone('birth_2m', 'gross_motor', 2, {
      title: b('ခေါင်းကို ဘေးတစ်ဖက်စီသို့ လှည့်နိုင်ခြင်း', 'Turns head to both sides when lying on the back'),
      observe: b(
        'ပက်လက်အိပ်နေစဉ် ကလေးသည် ခေါင်းကို ဘယ်ညာ နှစ်ဖက်စလုံးသို့ လှည့်နိုင်ပါသလား။ တစ်ဖက်တည်းကိုသာ အမြဲလှည့်နေပါသလား။',
        'While lying on the back, does your baby turn the head to both the left and the right? Or always to one side only?',
      ),
      why: b(
        'ခေါင်းလှည့်ခြင်းသည် လည်ပင်းကြွက်သားများ အားကောင်းလာခြင်းနှင့် အသံ၊ အလင်းကို လိုက်ရှာခြင်း နှစ်ခုစလုံးကို ပြသည်။ ပက်လက်အိပ်ရသည်မှာ ဘေးကင်းသော်လည်း နိုးနေချိန်တွင် မှောက်ချထားပေးခြင်းက ခေါင်းအားကို ပိုကူညီသည်။',
        'Turning the head shows both growing neck strength and interest in sounds and light. Back-sleeping is the safe position; supervised tummy time while awake is what builds head control.',
      ),
      red: b(
        'လ ၂ လအရွယ်တွင် ခေါင်းကို တစ်ဖက်တည်းသာ လှည့်နေပြီး အခြားတစ်ဖက်သို့ လုံးဝ မလှည့်နိုင်ခြင်း၊ သို့မဟုတ် ခေါင်းတစ်ဖက် အမြဲစောင်းနေခြင်းကို ကျန်းမာရေးဝန်ထမ်းအား ပြသင့်သည်။',
        'By 2 months, if the head always turns only one way and never the other, or the head is persistently tilted, mention it at a health visit.',
      ),
      encouragement: b(
        'ကလေးကို ပြောင်းလဲ၍ ဘေးနှစ်ဖက်မှ စကားပြောပါ။ ခေါင်းရင်းကို လဲလှယ်ပေးပါ။',
        'Talk to your baby from alternating sides, and swap which end of the cot you place the head.',
      ),
    }),
    'Head control and the back-to-sleep / supervised tummy time pairing are described in AAP safe sleep guidance and in CDC and AAP milestone guidance for 2 months.',
  ),
  kb(
    milestone('birth_2m', 'fine_motor', 1, {
      title: b('လက်များ လက်သီးဆုပ်ထားပြီး ကိုင်တွယ်မှု စတင်ခြင်း', 'Hands are mostly fisted and grasp what touches the palm'),
      observe: b(
        'သင်၏လက်ချောင်းကို ကလေးလက်ဖဝါးထဲ ထည့်ပေးသောအခါ ဆုပ်ကိုင်ပါသလား။ တစ်ခါတစ်ရံ လက်ကို ဖြန့်နိုင်ပါသလား။',
        'When you place a finger in your baby’s palm, does the hand close around it? Do the hands open up at times too?',
      ),
      why: b(
        'မွေးကင်းစတွင် ဆုပ်ကိုင်မှုသည် အလိုအလျောက် တုံ့ပြန်မှုဖြစ်သည်။ လအနည်းငယ်အတွင်း လက်များ ပိုမိုဖြန့်လာပြီး နောင်တွင် အလိုရှိသလို ကိုင်တွယ်နိုင်ရန် အခြေခံဖြစ်လာသည်။',
        'Early grasping is a reflex. Over the next months the hands open more and this becomes the base for deliberate reaching and holding.',
      ),
      red: b(
        'လက်နှစ်ဖက်စလုံး အမြဲတမ်း တင်းတင်းကျပ်ကျပ် ဆုပ်ထားပြီး လုံးဝ မဖြန့်နိုင်ခြင်း၊ သို့မဟုတ် တစ်ဖက်ကိုသာ သုံးနေခြင်းကို ကျန်းမာရေးဝန်ထမ်းအား ပြောပြပါ။',
        'Hands that stay tightly fisted all the time and never open, or clear use of one hand only, are worth raising with a health worker.',
      ),
      encouragement: b(
        'လက်ဖဝါးကို နူးညံ့စွာ ပွတ်သပ်ပေးပါ။ သင့်လက်ချောင်းကို ဆုပ်ကိုင်ခွင့်ပေးပါ။',
        'Stroke the palms gently and let your baby hold your finger during feeds and cuddles.',
      ),
    }),
    'Early hand posture and grasp are covered in AAP milestone guidance and in standard paediatric developmental references in the registry.',
  ),
  kb(
    milestone('birth_2m', 'cognitive', 1, {
      title: b('မျက်နှာနှင့် အရာဝတ္ထုကို ခဏတာ လိုက်ကြည့်ခြင်း', 'Watches a face and follows it briefly'),
      observe: b(
        'ကလေးမျက်နှာမှ ၂၀–၃၀ စင်တီမီတာခန့်တွင် သင့်မျက်နှာကို ထားပေးသောအခါ ကြည့်ပါသလား။ သင် ဖြည်းညှင်းစွာ ရွှေ့သောအခါ လိုက်ကြည့်ပါသလား။',
        'Held about 20–30 cm from the face, does your baby look at you? If you move slowly, do the eyes follow?',
      ),
      why: b(
        'မွေးကင်းစကလေးများသည် အနီးကပ် အရာများကို အကောင်းဆုံး မြင်ရသည်။ မျက်နှာကို လိုက်ကြည့်ခြင်းသည် အာရုံစိုက်မှုနှင့် ဆက်သွယ်မှု အစပျိုးခြင်း ဖြစ်သည်။',
        'Newborns see best at close range. Following a face is the beginning of attention and of connection with people.',
      ),
      red: b(
        'လ ၂ လအရွယ်တွင် အလင်း သို့မဟုတ် မျက်နှာကို လုံးဝ မကြည့်ခြင်း၊ မျက်လုံးများ အမြဲ လှုပ်ရှားနေခြင်းကို ကျန်းမာရေးဝန်ထမ်းအား ပြသင့်သည်။',
        'By 2 months, not looking at faces or light at all, or eyes that constantly wander, should be checked by a health worker.',
      ),
      encouragement: b(
        'နို့တိုက်ချိန်တိုင်း မျက်နှာချင်းဆိုင် ကြည့်ပြီး စကားပြောပါ။',
        'Make face-to-face eye contact and talk at every feed.',
      ),
    }),
    'Visual attention to faces at this age is described in AAP and CDC milestone guidance and in the paediatric surveillance literature in the registry.',
  ),
  kb(
    milestone('birth_2m', 'communication', 2, {
      title: b('ငိုသံ အမျိုးမျိုးနှင့် နူးညံ့သော အသံငယ်များ ထွက်ခြင်း', 'Different cries, and soft throaty sounds'),
      observe: b(
        'ဆာလောင်ချိန်၊ ပင်ပန်းချိန်၊ မသက်မသာဖြစ်ချိန် ငိုသံများ ကွာခြားပါသလား။ ငြိမ်သက်ချိန်တွင် နူးညံ့သော အသံငယ်များ ထွက်ပါသလား။',
        'Do the cries sound different when hungry, tired or uncomfortable? Are there soft cooing or throaty sounds when calm?',
      ),
      why: b(
        'ငိုသံသည် ကလေး၏ ပထမဆုံး ဘာသာစကား ဖြစ်သည်။ မိဘက တုံ့ပြန်ပေးသောအခါ ကလေးသည် ဆက်သွယ်ခြင်း အလုပ်ဖြစ်ကြောင်း သင်ယူသည်။',
        'Crying is a baby’s first language. When a parent responds, the baby learns that communicating works.',
      ),
      red: b(
        'ကျယ်လောင်သော အသံကို လုံးဝ တုံ့ပြန်မှု မရှိခြင်း၊ သို့မဟုတ် အသံ လုံးဝ မထွက်ခြင်းကို ကျန်းမာရေးဝန်ထမ်းအား ပြပြီး နားကြားစမ်းသပ်မှု မေးမြန်းပါ။',
        'No reaction at all to a loud sound, or no sounds at all, should be raised with a health worker and hearing screening asked about.',
      ),
      encouragement: b(
        'ကလေး အသံထွက်သောအခါ ရပ်နားပြီး ပြန်တုံ့ပြန်ပါ — စကားပြောခြင်း အလှည့်ကျမှု စတင်သည်။',
        'When your baby makes a sound, pause and answer back — this is the start of turn-taking.',
      ),
    }),
    'Early vocal development and the value of contingent parental response are described in NHS and AAP communication guidance and the responsive-caregiving evidence in the registry.',
  ),
  kb(
    milestone('birth_2m', 'emotional', 1, {
      title: b('ပွေ့ချီ၍ နှစ်သိမ့်ပေးသောအခါ ငြိမ်သက်လာခြင်း', 'Calms when held and comforted'),
      observe: b(
        'ပွေ့ချီခြင်း၊ နူးညံ့စွာ စကားပြောခြင်း၊ တွယ်ကပ်ထားခြင်းဖြင့် ကလေး ငြိမ်သက်လာပါသလား။',
        'Does your baby settle when picked up, spoken to softly, or held skin-to-skin?',
      ),
      why: b(
        'တစ်သမတ်တည်း တုံ့ပြန်ပေးခြင်းသည် ကလေး၏ စိတ်ခံစားမှု ထိန်းညှိနိုင်စွမ်းကို တည်ဆောက်ပေးသည်။ မွေးကင်းစကလေးကို ပွေ့ချီခြင်းက အလိုလိုက်ခြင်း မဟုတ်ပါ။',
        'Consistent, warm responses build a baby’s ability to settle. You cannot spoil a newborn by responding to them.',
      ),
      red: b(
        'အချိန်ကြာမြင့်စွာ မည်သို့မျှ နှစ်သိမ့်၍ မရခြင်း၊ သို့မဟုတ် တုံ့ပြန်မှု အလွန်နည်းပြီး နိုးရန် ခက်ခဲခြင်းကို ကျန်းမာရေးဝန်ထမ်းအား ချက်ချင်း ပြသင့်သည်။',
        'A baby who cannot be comforted for long periods, or who is unusually floppy and hard to rouse, should be seen by a health worker promptly.',
      ),
      encouragement: b(
        'အရေပြားချင်းထိ ပွေ့ချီခြင်းကို နေ့စဉ် လုပ်ပေးပါ။ သင်လည်း အနားယူချိန် ရအောင် အကူအညီ တောင်းပါ။',
        'Use skin-to-skin daily, and ask for help so you get rest too.',
      ),
    }),
    'Responsive caregiving and soothing are covered by the WHO nurturing care framework and WHO Care for Child Development materials in the registry; the "cannot be roused / floppy" wording follows NHS advice on spotting a seriously ill infant.',
  ),
  kb(
    milestone('birth_2m', 'play', 1, {
      title: b('ရုပ်ပုံ ကွက်ကွက်ကွင်းကွင်းနှင့် မျက်နှာများကို စိုက်ကြည့်ခြင်း', 'Stares at high-contrast patterns and faces'),
      observe: b(
        'အနက်/အဖြူ ပုံစံများ သို့မဟုတ် လူမျက်နှာကို ကလေး စိုက်ကြည့်ပါသလား။ ကြာလာလျှင် မျက်နှာလွှဲပြီး နားချင်ကြောင်း ပြပါသလား။',
        'Does your baby stare at bold black-and-white patterns or at a human face? Does he look away when he has had enough?',
      ),
      why: b(
        'ဤအရွယ်တွင် ကစားခြင်းသည် ကြည့်ခြင်း၊ နားထောင်ခြင်းသာ ဖြစ်သည်။ မျက်နှာလွှဲခြင်းသည် ငြင်းဆန်ခြင်း မဟုတ်ဘဲ "ခဏနားပါရစေ" ဟု ပြောခြင်း ဖြစ်သည်။',
        'At this age play is simply looking and listening. Looking away is not rejection — it is your baby saying "a short break, please".',
      ),
      encouragement: b(
        'တစ်ကြိမ်လျှင် မိနစ် ၂–၃ မိနစ်သာ ကစားပါ။ ကလေး မောပုံရလျှင် ရပ်ပါ။',
        'Keep each turn to 2–3 minutes and stop when your baby looks tired.',
      ),
    }),
    'Play as looking/listening at this age and reading infant engagement cues are described in the AAP play guidance and the WHO Care for Child Development counselling materials in the registry.',
  ),
  kb(
    milestone('birth_2m', 'nutrition', 1, {
      title: b('ဆာလောင်မှု လက္ခဏာများ ပြသ၍ မကြာခဏ နို့စို့ခြင်း', 'Shows feeding cues and feeds often'),
      observe: b(
        'ငိုမည့်အရင် ပါးစပ်လှုပ်ခြင်း၊ လက်ကို စုပ်ခြင်း၊ ရင်ဘတ်ဘက် လှည့်ရှာခြင်း ရှိပါသလား။ တစ်ရက်လျှင် အကြိမ် ၈ ကြိမ်ခန့် သို့မဟုတ် ထို့ထက်ပို၍ စို့ပါသလား။',
        'Before crying, does your baby mouth, suck hands, or turn to root? Does she feed about 8 or more times in 24 hours?',
      ),
      why: b(
        'မွေးကင်းစကလေးများသည် အစာအိမ် သေးငယ်သဖြင့် မကြာခဏ စို့ရသည်။ ဆာလောင်လက္ခဏာအလိုက် တိုက်ကျွေးခြင်းက နို့ထွက်မှုကို ကူညီပြီး နှစ်ဦးစလုံးအတွက် လွယ်ကူစေသည်။',
        'Newborn stomachs are small, so feeds are frequent. Feeding on cue supports milk supply and makes feeding easier for both of you.',
      ),
      red: b(
        'တစ်ရက်လျှင် အညစ်အကြေး/ဆီးသေး အရေအတွက် သိသိသာသာ လျော့နည်းခြင်း၊ နို့စို့ရန် အားနည်းခြင်း၊ ကိုယ်အလေးချိန် ပြန်မတက်ခြင်းကို ကျန်းမာရေးဝန်ထမ်းအား ချက်ချင်း ပြပါ။',
        'Markedly fewer wet nappies, weak feeding, or not regaining birth weight should be checked by a health worker promptly.',
      ),
      encouragement: b(
        'အသက် ၆ လအထိ မိခင်နို့တစ်မျိုးတည်း တိုက်ကျွေးရန် အကြံပြုထားသည်။ အခက်အခဲရှိပါက နို့တိုက်အကြံပေး အကူအညီ ရယူပါ။',
        'Exclusive breastfeeding is recommended for about the first 6 months; ask for breastfeeding counselling support if it is hard.',
      ),
    }),
    'Feeding cues, frequency and exclusive breastfeeding for about the first six months follow WHO infant and young child feeding guidance, WHO breastfeeding counselling guidance and NHS breastfeeding advice for the first days.',
  ),
  kb(
    milestone('birth_2m', 'sleep', 1, {
      title: b('တိုတောင်းသော အိပ်ချိန်များဖြင့် တစ်ရက်လုံး အိပ်ခြင်း', 'Sleeps in short stretches across the day and night'),
      observe: b(
        'ကလေးသည် တစ်ရက်လျှင် အကြိမ်များစွာ အိပ်ပါသလား။ တစ်ကြိမ်လျှင် နာရီအနည်းငယ်သာ ကြာပါသလား။',
        'Does your baby sleep many times across 24 hours, each stretch only a few hours long?',
      ),
      why: b(
        'အသက် ၀–၃ လအရွယ်တွင် စုစုပေါင်း အိပ်ချိန် ၁၄–၁၇ နာရီခန့် ဖြစ်တတ်သည်။ ကွာဟမှု များပါသည်။ ညနှင့် နေ့ ခွဲခြားနိုင်စွမ်း မရှိသေးပါ။',
        'Total sleep at 0–3 months is commonly about 14–17 hours in 24, with wide normal variation. Day–night rhythm has not developed yet.',
      ),
      red: b(
        'နိုးရန် အလွန်ခက်ခဲခြင်း၊ တစ်ရက်လုံး နို့စို့ရန် မနိုးခြင်းကို ကျန်းမာရေးဝန်ထမ်းအား ချက်ချင်း ပြပါ။',
        'A baby who is very hard to wake, or who does not wake to feed, needs to be seen promptly.',
      ),
      encouragement: b(
        'အိပ်တိုင်း ပက်လက်အနေအထား၊ ပြားပြီး မာသော အိပ်ရာ၊ အိပ်ရာပေါ်တွင် အနူအထောင်း မထားပါနှင့်။ အခန်းတူ အိပ်ရာမတူ။',
        'Back to sleep every sleep, on a firm flat surface with nothing soft in the cot. Room-share, but do not bed-share.',
      ),
    }),
    'Sleep amounts at 0–3 months follow WHO physical activity and sleep guidance for under-5s; the safe sleep positioning advice follows AAP safe sleep guidance and NHS SIDS advice.',
  ),
];

// --- Guides ----------------------------------------------------------------
// One guide per domain. Each carries the development explanation, parent
// observations, daily/weekly activities, indoor/outdoor ideas, safety notes,
// common questions, red flags and when to seek professional help.

const GUIDES: SeedItem[] = [
  kb(
    guide('birth_2m', 'gross_motor', {
      title: b('မွေးကင်း – ၂ လ — ကိုယ်လုံးလှုပ်ရှားမှု လမ်းညွှန်', 'Birth–2 months — Big movement guide'),
      why: b(
        'ဤအရွယ်တွင် ကလေးသည် ခေါင်းကို ထိန်းရန် သင်ယူနေသည်။ လည်ပင်းနှင့် ကျောကုန်း ကြွက်သားများ အားကောင်းလာစေရန် နိုးနေချိန် မှောက်ချထားပေးခြင်း (tummy time) က အဓိက ဖြစ်သည်။ လှုပ်ရှားမှုများ မညီညာသေးဘဲ တုန်ခါနေတတ်သည် — ဤသည် ပုံမှန် ဖြစ်သည်။',
        'At this age your baby is learning to control the head. Supervised tummy time while awake is the main way neck and back muscles get stronger. Movements are still jerky and uneven — that is normal.',
      ),
      observationQuestions: [
        b('မှောက်ချထားချိန်တွင် ခေါင်းကို ခဏ ထောင်နိုင်ပါသလား။', 'During tummy time, can your baby lift the head briefly?'),
        b('ပက်လက်အိပ်စဉ် ခြေလက်များကို နှစ်ဖက်စလုံး လှုပ်ရှားပါသလား။', 'When on the back, do both arms and both legs move?'),
        b('ပွေ့ချီစဉ် ခေါင်းကို ခဏတာ မှန်မှန် ထားနိုင်ပါသလား။', 'When held upright, can the head stay steady for a moment?'),
      ],
      dailyActivities: [
        b('နိုးနေချိန်တွင် မှောက်ချထားခြင်း — တစ်ကြိမ်လျှင် ၁–၂ မိနစ်၊ တစ်ရက် ၂–၃ ကြိမ်မှ စတင်ပါ။', 'Tummy time while awake — start with 1–2 minutes, 2–3 times a day.'),
        b('ကလေးရင်ဘတ်ပေါ် မှောက်ချပြီး မျက်နှာချင်းဆိုင် စကားပြောပါ။', 'Lie back and place your baby chest-to-chest, face to face, and talk.'),
        b('အဝတ်လဲချိန်တွင် ခြေထောက်များကို နူးညံ့စွာ ကွေး/ဆန့် ပေးပါ။', 'At nappy changes, gently bend and straighten the legs.'),
      ],
      weeklyActivities: [
        b('မှောက်ချချိန်ကို တစ်ပတ်လျှင် တဖြည်းဖြည်း တိုးမြှင့်ပါ။', 'Increase total tummy time gradually week by week.'),
        b('ကလေးကို ကိုင်တွယ်သည့် ဘက် (ဘယ်/ညာ) ကို လဲလှယ်ပါ။', 'Alternate which arm you carry your baby on.'),
      ],
      indoor: [
        b('ကြမ်းပြင်ပေါ် သန့်ရှင်းသော အဝတ်ခင်း၍ မှောက်ချပါ။', 'Tummy time on a clean cloth on the floor.'),
        b('မှန်ကို ကလေးရှေ့ထား၍ ခေါင်းထောင်ရန် အားပေးပါ။', 'Place a mirror in front to encourage head lifting.'),
      ],
      outdoor: [
        b('အရိပ်ရသော နေရာတွင် ခဏ ထွက်၍ ပွေ့ချီပါ — တိုက်ရိုက် နေရောင် မထိစေပါနှင့်။', 'Short carried walks in the shade — keep direct sun off the baby.'),
      ],
      lowCost: [
        b('ခေါက်ထားသော ပုဆိုးကို ရင်ဘတ်အောက် ခံပေးခြင်း။', 'A folded longyi under the chest as support.'),
        b('အိမ်တွင်းရှိ အနက်/အဖြူ ပုံစံရှိ အရာများကို ကြည့်စေခြင်း။', 'Bold black-and-white items already in the house to look at.'),
      ],
      materials: b('အဝတ်ခင်း၊ ခေါက်ထားသော ပုဆိုး၊ မှန် (ရှိလျှင်)', 'A floor cloth, a folded cloth for support, a mirror if you have one'),
      safety: b(
        'မှောက်ချထားချိန်တွင် ကလေးကို တစ်စက္ကန့်မျှ မခွာပါနှင့်။ အိပ်ပျော်သွားလျှင် ပက်လက် ပြန်လှဲပေးပါ။ ပြားပြီး မာသော မျက်နှာပြင်ပေါ်တွင်သာ ပြုလုပ်ပါ။',
        'Never leave your baby alone during tummy time. If she falls asleep, move her onto her back. Do it only on a firm, flat surface.',
      ),
      commonMistakes: [
        b('မှောက်ချချိန်ကို ရှည်လျားလွန်းအောင် တစ်ခါတည်း လုပ်ခြင်း — တိုတိုနှင့် မကြာခဏက ပိုကောင်းသည်။', 'Doing one very long session — short and frequent works better.'),
        b('နို့စို့ပြီးချင်း ချက်ချင်း မှောက်ချခြင်း — အန်တတ်သည်။', 'Tummy time straight after a feed — it can cause spitting up.'),
        b('ကလေးကို ကားထိုင်ခုံ/ကလေးထိုင်ခုံတွင် ကြာရှည် ထားခြင်း။', 'Leaving the baby in a car seat or bouncer for long stretches.'),
      ],
      parentTips: [
        b('အဝတ်လဲပြီးတိုင်း မှောက်ချချိန် တစ်ကြိမ် ထည့်လိုက်ပါ — မှတ်မိရန် လွယ်သည်။', 'Add a tummy-time turn after every nappy change — it is easy to remember.'),
        b('ကလေး ငိုလျှင် ရပ်ပါ။ ရှုံးနိမ့်ခြင်း မဟုတ်ပါ။', 'If your baby cries, stop. That is not a failure.'),
      ],
      faq: [
        {
          q: b('မှောက်ချထားရင် ကလေး ငိုတယ်။ ဆက်လုပ်ရမလား။', 'My baby cries during tummy time. Should I keep going?'),
          a: b('တိုတောင်းစွာ စပါ — ၃၀ စက္ကန့်မှလည်း ရသည်။ သင့်ရင်ဘတ်ပေါ်တွင် လုပ်ခြင်းက ပိုလွယ်တတ်သည်။ တဖြည်းဖြည်း တိုးပါ။', 'Start very short — even 30 seconds counts. On your chest is often easier. Build up gradually.'),
        },
        {
          q: b('ခေါင်းနောက်ဘက် ပြားသွားမှာ စိုးရိမ်ပါတယ်။', 'I worry the back of the head will flatten.'),
          a: b('နိုးနေချိန် မှောက်ချချိန် တိုးပေးခြင်း၊ ခေါင်းလှည့်ဘက် လဲလှယ်ပေးခြင်းက ကူညီသည်။ သို့သော် အိပ်ချိန်တွင် ပက်လက်ကိုသာ ဆက်ထားပါ။ စိုးရိမ်ပါက ကျန်းမာရေးဝန်ထမ်းအား ပြပါ။', 'More awake tummy time and alternating head position help. But keep back-sleeping for every sleep. If you are worried, ask a health worker to look.'),
        },
      ],
      redFlags: [
        b('ခြေလက် တစ်ဖက်ကိုသာ လှုပ်ရှားခြင်း။', 'Movement on one side of the body only.'),
        b('ကိုယ်ခန္ဓာ အလွန် ပျော့ခွေခြင်း သို့မဟုတ် အလွန် တောင့်တင်းခြင်း။', 'A body that is very floppy or very stiff.'),
        b('လ ၂ လအရွယ်တွင် မှောက်ချစဉ် ခေါင်းကို လုံးဝ မထောင်နိုင်ခြင်း။', 'At 2 months, no attempt to lift the head at all during tummy time.'),
      ],
      referral: b(
        'အထက်ပါ လက္ခဏာများ တွေ့ပါက ကျန်းမာရေးဝန်ထမ်း သို့မဟုတ် ကလေးဆရာဝန်ထံ ပြသပါ။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ပါ — စစ်ဆေးရန် အချက်ပြခြင်းသာ ဖြစ်သည်။',
        'If you see any of these, ask a health worker or paediatrician to check. This is not a diagnosis — it is a prompt to have your baby looked at.',
      ),
      encouragement: b(
        'သင်လုပ်ပေးနေသော နေ့စဉ် ပွေ့ချီမှု၊ စကားပြောမှုတိုင်းသည် ဖွံ့ဖြိုးမှုကို ကူညီနေပါသည်။',
        'Every cuddle and every chat you already give is helping your baby grow.',
      ),
    }),
    'Tummy time, back-to-sleep and early head control follow AAP safe sleep guidance and AAP/CDC milestone guidance; the "not a diagnosis, ask a health worker" framing follows AAP developmental surveillance guidance.',
  ),
  kb(
    guide('birth_2m', 'fine_motor', {
      title: b('မွေးကင်း – ၂ လ — လက်နှင့် ကိုင်တွယ်မှု လမ်းညွှန်', 'Birth–2 months — Hands and grasp guide'),
      why: b(
        'မွေးကင်းစတွင် လက်များသည် အများအားဖြင့် ဆုပ်ထားပြီး ကိုင်တွယ်မှုမှာ အလိုအလျောက် တုံ့ပြန်မှု ဖြစ်သည်။ လအနည်းငယ်အတွင်း လက်များ ပိုဖြန့်လာပြီး ပါးစပ်ဆီသို့ ယူလာနိုင်လာသည်။',
        'In the newborn weeks the hands are mostly fisted and grasping is a reflex. Over the next months the hands open more and start coming to the mouth.',
      ),
      observationQuestions: [
        b('လက်ဖဝါးထဲ လက်ချောင်းထည့်ပေးလျှင် ဆုပ်ပါသလား။', 'Does the hand close when you place a finger in the palm?'),
        b('တစ်ခါတစ်ရံ လက်များ ဖြန့်နေတာ တွေ့ပါသလား။', 'Do you sometimes see the hands open?'),
        b('လက်ကို ပါးစပ်ဆီ ယူလာတတ်ပါသလား။', 'Do the hands come towards the mouth?'),
      ],
      dailyActivities: [
        b('လက်ဖဝါးနှင့် လက်ချောင်းများကို နူးညံ့စွာ ပွတ်သပ်ပေးပါ။', 'Gently stroke the palms and fingers.'),
        b('နို့တိုက်ချိန်တွင် သင့်လက်ချောင်းကို ဆုပ်ကိုင်ခွင့် ပေးပါ။', 'Let your baby hold your finger during feeds.'),
        b('အဝတ်ပါးပါးကို လက်နှင့် ထိတွေ့ခွင့် ပေးပါ (ကြီးကြပ်၍)။', 'Let the hands touch a light cloth, with you watching.'),
      ],
      weeklyActivities: [
        b('အသွင်အပြင် မတူသော ကိုင်ခံစားမှုများ (နူးညံ့/ကြမ်း) ကို လက်ဖြင့် ခဏ ထိတွေ့ခွင့် ပေးပါ။', 'Offer brief touches of different textures — soft and slightly rough.'),
      ],
      indoor: [b('အိပ်ရာဘေးတွင် လက်လှုပ်ရှားမှုကို ကြည့်ရှုပေးပါ။', 'Watch and name the hand movements during quiet awake time.')],
      outdoor: [b('အရိပ်တွင် လေညှင်းက လက်ကို ထိတွေ့စေခြင်း။', 'In the shade, let the breeze touch the hands.')],
      lowCost: [b('သန့်ရှင်းသော အဝတ်စ တစ်စ ဖြင့် လုံလောက်သည်။', 'A single clean cloth is enough.')],
      materials: b('သန့်ရှင်းသော အဝတ်စ များ', 'Clean pieces of cloth'),
      safety: b(
        'ကလေးလက်လှမ်းမီရာတွင် ကြိုး၊ အိတ်ပါး၊ သေးငယ်သော အရာများ လုံးဝ မထားပါနှင့် — လည်ချောင်းညှစ်ခြင်းနှင့် အသက်ရှူပိတ်ခြင်း အန္တရာယ် ရှိသည်။',
        'Keep cords, thin plastic and small objects completely away — they are strangulation and choking hazards.',
      ),
      commonMistakes: [
        b('လက်အိတ် အမြဲစွပ်ထားခြင်း — ထိတွေ့ခံစားမှု လျော့နည်းစေသည်။', 'Keeping mittens on all the time — it reduces touch experience.'),
        b('ကစားစရာကို လက်ထဲ အတင်း ထည့်ပေးခြင်း။', 'Forcing a toy into the hand.'),
      ],
      parentTips: [
        b('လက်သည်းကို တိုတိုညှပ်ပေးပါ — မျက်နှာ ခြစ်မိခြင်း လျော့နည်းသည်။', 'Keep nails short to reduce face scratches.'),
        b('သင်လုပ်နေသည်ကို အသံထွက် ပြောပြပါ — ဘာသာစကားလည်း တစ်ပါတည်း ကူညီသည်။', 'Say aloud what you are doing — it builds language at the same time.'),
      ],
      faq: [
        {
          q: b('လက်အိတ် စွပ်သင့်လား။', 'Should I use mittens?'),
          a: b('ခြစ်မိမှု ကာကွယ်ရန် ခဏတာ သုံးနိုင်သည်။ သို့သော် နိုးနေချိန် အများစုတွင် လက်ဖြန့်၍ ထိတွေ့ခွင့် ပေးပါ။', 'They can be used briefly to prevent scratches, but let the hands be free to touch for most awake time.'),
        },
      ],
      redFlags: [
        b('လက်နှစ်ဖက်စလုံး အမြဲ တင်းကျပ်ဆုပ်ထားပြီး လုံးဝ မဖြန့်ခြင်း။', 'Hands always tightly fisted and never opening.'),
        b('လက်တစ်ဖက်ကိုသာ သုံးပြီး ကျန်တစ်ဖက် မလှုပ်ခြင်း။', 'Clear use of one hand while the other does not move.'),
      ],
      referral: b(
        'ဤလက္ခဏာများ ဆက်တိုက် တွေ့ပါက ကျန်းမာရေးဝန်ထမ်းအား ပြပါ။ ရောဂါ ဖော်ထုတ်ခြင်း မဟုတ်ပါ။',
        'If these persist, ask a health worker to check. This is not a diagnosis.',
      ),
      encouragement: b('ကလေး၏ ပထမဆုံး ကိရိယာမှာ သင့်လက် ဖြစ်ပါသည်။', 'Your hands are your baby’s first learning tool.'),
    }),
    'Newborn hand posture, palmar grasp and the choking/strangulation cautions follow AAP milestone guidance and standard paediatric developmental references in the registry.',
  ),
];

const GUIDES_B: SeedItem[] = [
  kb(
    guide('birth_2m', 'communication', {
      title: b('မွေးကင်း – ၂ လ — ဆက်သွယ်ပြောဆိုမှု လမ်းညွှန်', 'Birth–2 months — Communication guide'),
      why: b(
        'ကလေးသည် စကားမပြောနိုင်သေးသော်လည်း ဆက်သွယ်နေပါသည်။ ငိုသံ၊ မျက်လုံးချင်းဆိုင်မှု၊ နူးညံ့သော အသံငယ်များဖြင့် ပြောနေခြင်း ဖြစ်သည်။ မိဘက ချက်ချင်း တုံ့ပြန်ပေးခြင်းသည် ဘာသာစကား ဖွံ့ဖြိုးမှု၏ အခြေခံ ဖြစ်သည်။',
        'Your baby is already communicating — through cries, eye contact and soft sounds. Responding promptly is the foundation of later language.',
      ),
      observationQuestions: [
        b('ငိုသံများ အခြေအနေအလိုက် ကွာခြားပါသလား။', 'Do the cries differ depending on the need?'),
        b('သင် စကားပြောသောအခါ ကလေး ငြိမ်သွားပြီး နားထောင်ပါသလား။', 'Does your baby go quiet and listen when you speak?'),
        b('ကျယ်လောင်သော အသံကို လန့်ခြင်း၊ မျက်တောင်ခတ်ခြင်း ရှိပါသလား။', 'Does a loud sound cause a startle or a blink?'),
      ],
      dailyActivities: [
        b('နေ့စဉ် လုပ်ငန်းတိုင်းကို အသံထွက်၍ ပြောပြပါ — "ရေချိုးမယ်နော်"။', 'Narrate daily routines aloud — "now we are bathing".'),
        b('ကလေး အသံထွက်လျှင် ရပ်၍ နားထောင်ပြီး ပြန်ပြောပါ။', 'When your baby makes a sound, pause, listen, then answer.'),
        b('သီချင်း သို့မဟုတ် ကလေးသိပ်သီချင်း တစ်ပုဒ် ဆိုပေးပါ။', 'Sing one song or lullaby.'),
      ],
      weeklyActivities: [
        b('မိသားစုဝင် အမျိုးမျိုးက စကားပြောပေးပါ — အသံ အမျိုးမျိုး ကြားရသည်။', 'Let different family members talk to the baby — different voices.'),
        b('ရုပ်ပုံစာအုပ် တစ်အုပ်ကို အတူ ကြည့်ပြီး ပြောပြပါ။', 'Look at a picture book together and describe it.'),
      ],
      indoor: [b('တိတ်ဆိတ်သော အခန်းတွင် မျက်နှာချင်းဆိုင် စကားပြောပါ။', 'Face-to-face talking in a quiet room.')],
      outdoor: [b('အပြင်ထွက်စဉ် ကြားရသော အသံများကို အမည်တပ်ပြောပြပါ။', 'Name the sounds you hear when outside.')],
      lowCost: [b('စကားပြောခြင်း၊ သီချင်းဆိုခြင်းသည် အခမဲ့ဖြစ်ပြီး အထိရောက်ဆုံး ဖြစ်သည်။', 'Talking and singing are free and the most effective of all.')],
      materials: b('မလိုအပ်ပါ — သင့်အသံသာ လိုသည်။', 'None — your voice is enough.'),
      safety: b(
        'အသံ အလွန်ကျယ်လောင်ခြင်းကို ရှောင်ပါ။ ကလေးအနီးတွင် ဆေးလိပ်သောက်ခြင်းကို လုံးဝ ရှောင်ပါ။',
        'Avoid very loud noise near your baby, and never smoke around your baby.',
      ),
      commonMistakes: [
        b('"ဘာမှ နားမလည်သေးဘူး" ဟု ထင်၍ စကားမပြောခြင်း။', 'Not talking because "the baby understands nothing yet".'),
        b('ဖန်သားပြင် (ဖုန်း/တီဗွီ) ဖြင့် ဖျော်ဖြေရန် ကြိုးစားခြင်း။', 'Using a screen to entertain the baby.'),
      ],
      parentTips: [
        b('နှေးနှေး၊ မြင့်သော အသံဖြင့် ပြောပါ — ကလေး ပိုနှစ်သက်သည်။', 'Speak slowly in a warm, sing-song voice — babies prefer it.'),
        b('မိခင်ဘာသာစကားဖြင့် ပြောပါ — အကောင်းဆုံး ဖြစ်သည်။', 'Use your own mother tongue — it is the best choice.'),
      ],
      faq: [
        {
          q: b('ဘာသာစကား နှစ်မျိုး သုံးရင် ကလေး ရှုပ်သွားမလား။', 'Will two languages confuse my baby?'),
          a: b('ဘာသာစကား နှစ်မျိုးသုံးသော အိမ်များတွင် ကလေးများ ပုံမှန် ဖွံ့ဖြိုးကြသည်။ တစ်ဦးချင်းစီ ကိုယ့်ဘာသာစကားဖြင့် ပုံမှန် ပြောပေးပါ။', 'Children in bilingual homes develop normally. Each adult can simply use the language they know best, consistently.'),
        },
        {
          q: b('ဖုန်းထဲက ကလေးသီချင်းတွေ ဖွင့်ပေးလို့ ရလား။', 'Can I play baby songs on a phone?'),
          a: b('ဤအရွယ်တွင် ဖန်သားပြင် အသုံးပြုခြင်းကို မလိုအပ်ပါ — တိုက်ရိုက် လူချင်း စကားပြောခြင်း၊ သီချင်းဆိုခြင်းက ပိုအကျိုးရှိသည်။', 'Screens are not needed at this age — live talking and singing help far more.'),
        },
      ],
      redFlags: [
        b('ကျယ်လောင်သော အသံကို လုံးဝ တုံ့ပြန်မှု မရှိခြင်း။', 'No reaction at all to loud sounds.'),
        b('မျက်လုံးချင်းဆိုင်မှု လုံးဝ မရှိခြင်း။', 'No eye contact at all.'),
      ],
      referral: b(
        'နားကြား သံသယရှိပါက နှောင့်နှေးမနေဘဲ နားကြားစမ်းသပ်မှု တောင်းခံပါ။ ဤသည် ရောဂါဖော်ထုတ်ချက် မဟုတ်ပါ။',
        'If you have any concern about hearing, ask for a hearing check without delay. This is not a diagnosis.',
      ),
      encouragement: b('သင်ပြောသော စကားလုံးတိုင်း ကလေး၏ ဦးနှောက်ကို တည်ဆောက်ပေးနေပါသည်။', 'Every word you say is building your baby’s brain.'),
    }),
    'Responsive talk, early hearing concerns and avoiding screens for infants follow NHS learn-to-talk guidance, AAP media guidance for young minds and the responsive-caregiving evidence in the registry.',
  ),
  kb(
    guide('birth_2m', 'social', {
      title: b('မွေးကင်း – ၂ လ — လူမှုဆက်ဆံရေး လမ်းညွှန်', 'Birth–2 months — Social connection guide'),
      why: b(
        'ကလေးသည် လူမျက်နှာကို အထူး နှစ်သက်သည်။ ဤအရွယ်တွင် လူမှုဆက်ဆံရေးဆိုသည်မှာ ကြည့်ခြင်း၊ ငြိမ်သက်ခြင်း၊ တစ်ခါတစ်ရံ ပြုံးခြင်း ဖြစ်သည်။',
        'Babies are drawn to human faces. Social life at this age means looking, settling, and sometimes a first smile.',
      ),
      observationQuestions: [
        b('သင့်မျက်နှာကို ကြည့်ပါသလား။', 'Does your baby look at your face?'),
        b('သင့်အသံကြားလျှင် ငြိမ်သွားပါသလား။', 'Does your baby quieten at your voice?'),
        b('တစ်ခါတစ်ရံ ပြုံးပြပါသလား။', 'Have you seen a social smile yet?'),
      ],
      dailyActivities: [
        b('မျက်နှာချင်းဆိုင် ပွေ့ချီပြီး ပြုံးပြပါ — ကလေး တုံ့ပြန်ရန် စောင့်ပါ။', 'Hold face to face, smile, and wait for a response.'),
        b('အရေပြားချင်းထိ ပွေ့ချီခြင်း။', 'Skin-to-skin holding.'),
      ],
      weeklyActivities: [b('မိသားစုဝင်များနှင့် တစ်ဦးချင်း ငြိမ်သက်စွာ တွေ့ဆုံခွင့် ပေးပါ။', 'Quiet one-to-one time with different family members.')],
      indoor: [b('အလင်းရောင် သင့်တင့်သော နေရာတွင် မျက်နှာချင်းဆိုင် ကစားပါ။', 'Face-to-face time in gentle light.')],
      outdoor: [b('အရိပ်တွင် ပွေ့ချီ၍ လမ်းလျှောက်ပါ။', 'A carried walk in the shade.')],
      lowCost: [b('ပွေ့ချီခြင်းသာ လိုအပ်သည်။', 'All it takes is holding your baby.')],
      materials: b('မလိုအပ်ပါ', 'None'),
      safety: b(
        'လူစုလူဝေး များပြားရာနှင့် ဖျားနာသူများနှင့် ခဏတာ ဝေးဝေးနေပါ။ ကိုင်တွယ်မီ လက်ဆေးပါ။',
        'Limit crowds and contact with unwell people in the early weeks, and wash hands before holding.',
      ),
      commonMistakes: [
        b('ပြုံးပြခြင်းကို အလွန်စောလျှင် မျှော်လင့်ခြင်း — ကွာဟမှု များပါသည်။', 'Expecting a social smile too early — the range is wide.'),
        b('ကလေး မောပြီး မျက်နှာလွှဲသည်ကို ဆက်ဖျော်ဖြေခြင်း။', 'Continuing to stimulate after the baby looks away, tired.'),
      ],
      parentTips: [
        b('ကလေးက မျက်နှာလွှဲလျှင် ခဏနားပြီး ပြန်စပါ။', 'When your baby looks away, pause and try again later.'),
        b('မိဘ၏ စိတ်ကျန်းမာရေးလည်း အရေးကြီးသည် — မခံနိုင်လျှင် အကူအညီ တောင်းပါ။', 'Your own mental health matters too — ask for help if you are struggling.'),
      ],
      faq: [
        {
          q: b('ကလေးက ဘယ်တော့ ပြုံးမလဲ။', 'When will my baby smile at me?'),
          a: b('လူမှုပြုံးခြင်းသည် များသောအားဖြင့် ၂ လဝန်းကျင်တွင် စတတ်သော်လည်း ကွာဟမှု ရှိသည်။ ၃ လကျော်၍ လုံးဝ မပြုံးသေးပါက ကျန်းမာရေးဝန်ထမ်းအား ပြောပြပါ။', 'A social smile often appears around 2 months, but the range varies. If there is still no smile after 3 months, mention it to a health worker.'),
        },
      ],
      redFlags: [
        b('မျက်နှာကို လုံးဝ မကြည့်ခြင်း။', 'No looking at faces at all.'),
        b('ပွေ့ချီသောအခါ လုံးဝ မငြိမ်နိုင်ခြင်း။', 'Never settling when held.'),
      ],
      referral: b(
        'မိဘသည် စိတ်ဓာတ်ကျခြင်း၊ စိုးရိမ်ပူပန်ခြင်း ခံစားနေရပါက မိမိအတွက်လည်း အကူအညီ တောင်းပါ — မွေးပြီးနောက် စိတ်ကျန်းမာရေး ပံ့ပိုးမှုများ ရှိပါသည်။',
        'If you feel low or anxious, seek help for yourself too — postnatal mental health support exists.',
      ),
      encouragement: b('သင်နှင့် ကလေး၏ ဆက်ဆံရေးသည် အကောင်းဆုံး သင်ခန်းစာ ဖြစ်သည်။', 'Your relationship is your baby’s best classroom.'),
    }),
    'Face preference, the timing range for a social smile and postnatal parental mental-health support follow AAP/CDC milestone guidance, the WHO nurturing care framework and NICE postnatal care guidance.',
  ),
];

const GUIDES_C: SeedItem[] = [
  kb(
    guide('birth_2m', 'emotional', {
      title: b('မွေးကင်း – ၂ လ — စိတ်ခံစားမှု လမ်းညွှန်', 'Birth–2 months — Feelings and comfort guide'),
      why: b(
        'မွေးကင်းစကလေးသည် မိမိစိတ်ကို ကိုယ်တိုင် မထိန်းနိုင်သေးပါ။ မိဘ၏ တည်ငြိမ်သော တုံ့ပြန်မှုကို အသုံးပြု၍ ငြိမ်သက်ရန် သင်ယူသည်။ ငိုခြင်းသည် မိဘကို စမ်းသပ်ခြင်း မဟုတ်ပါ။',
        'A newborn cannot regulate feelings alone. She borrows your calm to settle. Crying is not manipulation.',
      ),
      observationQuestions: [
        b('ပွေ့ချီလျှင် ငြိမ်သွားပါသလား။', 'Does holding help your baby settle?'),
        b('တစ်ရက်လုံး ငိုချိန် များပါသလား၊ အထူးသဖြင့် ညနေပိုင်း။', 'Is there a lot of crying, especially in the evening?'),
        b('သင်ကိုယ်တိုင် မည်သို့ ခံစားနေရပါသလဲ။', 'How are you feeling yourself?'),
      ],
      dailyActivities: [
        b('ငိုသည်နှင့် နှစ်သိမ့်ပေးပါ — ပွေ့ချီ၊ နူးညံ့စွာ ပြော၊ ယိမ်းပေးပါ။', 'Respond to crying — hold, speak softly, rock gently.'),
        b('အရေပြားချင်းထိ ပွေ့ချီခြင်းကို နေ့စဉ် ထည့်ပါ။', 'Include skin-to-skin every day.'),
      ],
      weeklyActivities: [b('မိဘ ကိုယ်တိုင် အနားယူချိန် တစ်ပတ်လျှင် အနည်းဆုံး နှစ်ကြိမ် စီစဉ်ပါ။', 'Plan at least two rest breaks for yourself each week.')],
      indoor: [b('အလင်းမှိန်၊ အသံတိတ်သော နေရာတွင် နှစ်သိမ့်ပေးပါ။', 'Comfort in a dim, quiet place.')],
      outdoor: [b('အရိပ်တွင် ဖြည်းညှင်းစွာ လမ်းလျှောက်ခြင်းက ငိုသံကို လျော့စေတတ်သည်။', 'A slow walk in the shade often eases crying.')],
      lowCost: [b('ပွေ့ချီခြင်း၊ အသံနူးညံ့စွာ ပြောခြင်း — ကုန်ကျစရိတ် မရှိပါ။', 'Holding and a soft voice cost nothing.')],
      materials: b('ပွေ့ချီရန် ပုဆိုး/ကလေးထမ်းအိတ်', 'A cloth or baby carrier'),
      safety: b(
        'ကလေးကို ဘယ်တော့မှ မလှုပ်ခါပါနှင့် — ဦးနှောက်ကို ပြင်းထန်စွာ ထိခိုက်စေနိုင်သည်။ စိတ်မထိန်းနိုင်တော့လျှင် ကလေးကို ဘေးကင်းသော အိပ်ရာတွင် ချထားပြီး ခဏ ထွက်၍ အသက်ရှူပါ၊ ပြီးမှ ပြန်လာပါ။',
        'Never shake a baby — it can cause severe brain injury. If you feel overwhelmed, put your baby down somewhere safe, step away to breathe, and come back.',
      ),
      commonMistakes: [
        b('"ငိုတာ ခဏထားလိုက်" ဟု အကြံပေးမှုကို မွေးကင်းစတွင် လိုက်နာခြင်း။', 'Following "let them cry it out" advice with a newborn.'),
        b('မိဘ ကိုယ်တိုင် ပင်ပန်းနေသည်ကို လျစ်လျူရှုခြင်း။', 'Ignoring your own exhaustion.'),
      ],
      parentTips: [
        b('ငိုသံ များလွန်းလျှင် အလှည့်ကျ ကူညီပေးမည့်သူ ရှာပါ။', 'If crying is heavy, arrange someone to take turns with you.'),
        b('ငိုသံ ပုံစံကို မှတ်တမ်းတင်ထားပါ — ဆရာဝန်ပြသည့်အခါ အသုံးဝင်သည်။', 'Note when the crying happens — it helps at a health visit.'),
      ],
      faq: [
        {
          q: b('ပွေ့ချီများရင် အလိုလိုက်ရာ ကျမလား။', 'Will holding too much spoil my baby?'),
          a: b('မကျပါ။ ဤအရွယ်တွင် တုံ့ပြန်ပေးခြင်းသည် လုံခြုံမှုကို တည်ဆောက်ပေးသည်။', 'No. At this age responding builds security.'),
        },
        {
          q: b('ညနေတိုင်း ငိုတယ်။ ပုံမှန်လား။', 'She cries every evening. Is that normal?'),
          a: b('ပထမလများတွင် ငိုချိန် များခြင်းသည် တွေ့ရလေ့ရှိသည်။ သို့သော် ငိုသံနှင့်အတူ ဖျားခြင်း၊ အန်ခြင်း၊ နို့မစို့ခြင်း၊ ပျော့ခွေခြင်း ပါလျှင် ချက်ချင်း ဆေးကုသမှု ခံယူပါ။', 'Increased crying in the early months is common. But if crying comes with fever, vomiting, refusing feeds or floppiness, seek care immediately.'),
        },
      ],
      redFlags: [
        b('ငိုသံ ပုံမှန်မဟုတ်ဘဲ အသံတိုးလာခြင်း သို့မဟုတ် အော်ဟစ်သံ ဖြစ်လာခြင်း။', 'A cry that becomes weak, or unusually high-pitched.'),
        b('ကိုယ်ခန္ဓာ ပျော့ခွေခြင်း၊ နိုးရန် ခက်ခဲခြင်း။', 'Floppiness or being hard to wake.'),
        b('အသက် ၃ လအောက် ကလေးတွင် ဖျားခြင်း။', 'Fever in a baby under 3 months.'),
      ],
      referral: b(
        'ပျော့ခွေခြင်း၊ နိုးရန်ခက်ခဲခြင်း၊ အသက်ရှူခက်ခဲခြင်း၊ ၃ လအောက် ဖျားခြင်း — ဤအခြေအနေများတွင် နှောင့်နှေးမနေဘဲ ဆေးကုသမှု ချက်ချင်း ခံယူပါ။',
        'Floppiness, being hard to rouse, breathing difficulty, or fever under 3 months — seek medical care immediately, without waiting.',
      ),
      encouragement: b('သင် တုံ့ပြန်ပေးတိုင်း ကလေးသည် "ငါ ဘေးကင်းတယ်" ဟု သင်ယူနေပါသည်။', 'Every time you respond, your baby learns "I am safe".'),
    }),
    'Responsive soothing and the never-shake message follow the WHO nurturing care framework and AAP toxic-stress guidance; the urgent-symptom list (floppy, hard to rouse, fever under 3 months) follows NHS advice on spotting a seriously ill infant and NICE fever guidance.',
  ),
  kb(
    guide('birth_2m', 'cognitive', {
      title: b('မွေးကင်း – ၂ လ — အသိဉာဏ် ဖွံ့ဖြိုးမှု လမ်းညွှန်', 'Birth–2 months — Early thinking guide'),
      why: b(
        'ဤအရွယ်တွင် သင်ယူခြင်းသည် အာရုံခံစားမှုမှတစ်ဆင့် ဖြစ်သည် — ကြည့်၊ နားထောင်၊ ထိတွေ့။ ထပ်ခါထပ်ခါ တူညီသော အတွေ့အကြုံများက ဦးနှောက် ချိတ်ဆက်မှုကို တည်ဆောက်သည်။',
        'Learning happens through the senses now — looking, listening, touching. Repeated, predictable experiences build brain connections.',
      ),
      observationQuestions: [
        b('ရွေ့လျားနေသော အရာကို မျက်လုံးဖြင့် လိုက်ကြည့်ပါသလား။', 'Do the eyes follow a slowly moving object?'),
        b('အသံလာရာဘက်သို့ လှည့်ကြည့်ပါသလား။', 'Does your baby turn towards a sound?'),
        b('အသစ်တွေ့လျှင် ကြည့်ချိန် ပိုကြာပါသလား။', 'Does something new hold the gaze longer?'),
      ],
      dailyActivities: [
        b('မျက်နှာမှ ၂၀–၃၀ စင်တီမီတာ အကွာတွင် ပစ္စည်းတစ်ခုကို ဖြည်းညှင်းစွာ ရွှေ့ပြပါ။', 'Move an object slowly, about 20–30 cm from the face.'),
        b('နေ့စဉ် အစီအစဉ်ကို တူညီစွာ ထားပါ — ကြိုတင်မှန်းဆနိုင်မှုက သင်ယူမှုကို ကူညီသည်။', 'Keep daily routines similar — predictability supports learning.'),
      ],
      weeklyActivities: [b('အသံ အမျိုးမျိုး (ခေါင်းလောင်း၊ လက်ခုပ်) ကို ဖြည်းညှင်းစွာ မိတ်ဆက်ပါ။', 'Introduce different gentle sounds through the week.')],
      indoor: [b('အနက်/အဖြူ ပုံစံများကို ကြည့်စေခြင်း။', 'Looking at bold black-and-white patterns.')],
      outdoor: [b('အရိပ်တွင် သစ်ရွက်လှုပ်ရှားမှုကို ကြည့်စေခြင်း။', 'Watching leaves move, in the shade.')],
      lowCost: [b('အိမ်တွင်း ပစ္စည်းများဖြင့် လုံလောက်သည် — ကစားစရာ ဝယ်စရာ မလိုပါ။', 'Household items are enough — no toys need to be bought.')],
      materials: b('အနက်/အဖြူ ရုပ်ပုံ၊ သန့်ရှင်းသော ဇွန်း သို့မဟုတ် အဝတ်စ', 'A black-and-white picture, a clean spoon or cloth'),
      safety: b(
        'သေးငယ်၍ မျိုချနိုင်သော ပစ္စည်းများကို လုံးဝ မသုံးပါနှင့်။ ကလေးအနီးတွင် အမြဲ ရှိနေပါ။',
        'Never use small objects that could be swallowed, and stay beside your baby.',
      ),
      commonMistakes: [
        b('တစ်ချိန်တည်းတွင် လှုံ့ဆော်မှု များလွန်းခြင်း — ကလေး မောသွားသည်။', 'Too much stimulation at once — it tires the baby.'),
        b('ဖန်သားပြင် ဗီဒီယိုဖြင့် "သင်ကြားပေးရန်" ကြိုးစားခြင်း။', 'Trying to "teach" with screen videos.'),
      ],
      parentTips: [
        b('ကလေး၏ အာရုံစိုက်မှု လက္ခဏာကို လိုက်နာပါ — ကြည့်နေလျှင် ဆက်လုပ်၊ လွှဲသွားလျှင် နားပါ။', 'Follow your baby’s cues — continue while she looks, pause when she turns away.'),
      ],
      faq: [
        {
          q: b('ကလေးက ဘယ်လောက် ဝေးအထိ မြင်ရလဲ။', 'How far can my baby see?'),
          a: b('မွေးကင်းစတွင် အနီးကပ် (မျက်နှာအကွာအဝေးခန့်) ကို အကောင်းဆုံး မြင်ရသည်။ တဖြည်းဖြည်း ပိုမိုကောင်းမွန်လာသည်။', 'Newborns see best at close range — about the distance to your face when holding them. Vision improves steadily.'),
        },
      ],
      redFlags: [
        b('အလင်း သို့မဟုတ် မျက်နှာကို လုံးဝ မတုံ့ပြန်ခြင်း။', 'No response at all to light or faces.'),
        b('အသံကို လုံးဝ မတုံ့ပြန်ခြင်း။', 'No response at all to sound.'),
      ],
      referral: b(
        'မျက်စိ သို့မဟုတ် နားကြားနှင့် ပတ်သက်၍ သံသယရှိပါက ကျန်းမာရေးဝန်ထမ်းထံ ချက်ချင်း ပြပါ။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ပါ။',
        'Any concern about vision or hearing should be checked promptly. This is not a diagnosis.',
      ),
      encouragement: b('ရိုးရှင်းသော နေ့စဉ် ဆက်ဆံမှုများသည် အကောင်းဆုံး ဦးနှောက် လေ့ကျင့်ခန်း ဖြစ်သည်။', 'Simple everyday interaction is the best brain exercise there is.'),
    }),
    'Early sensory learning, close-range vision and the value of predictable routines follow AAP/CDC milestone guidance, the WHO Care for Child Development counselling materials and AAP media guidance on screens for infants.',
  ),
  kb(
    guide('birth_2m', 'play', {
      title: b('မွေးကင်း – ၂ လ — ကစားခြင်း လမ်းညွှန်', 'Birth–2 months — Play guide'),
      why: b(
        'ဤအရွယ်တွင် ကစားခြင်းဆိုသည်မှာ ရိုးရှင်းသော ဆက်ဆံမှုသာ ဖြစ်သည် — ကြည့်ခြင်း၊ နားထောင်ခြင်း၊ နူးညံ့စွာ လှုပ်ရှားခြင်း။ ကစားစရာ ဝယ်စရာ မလိုပါ။',
        'Play at this age is simply interaction — looking, listening and gentle movement. No toys are required.',
      ),
      observationQuestions: [
        b('ကလေး ကစားရန် အသင့်ဖြစ်နေသည့် လက္ခဏာ (မျက်လုံး ကြည်လင်၊ ငြိမ်သက်) ကို သတိထားမိပါသလား။', 'Can you spot the "ready to play" cues — bright eyes, calm alert state?'),
        b('မောလာသည့် လက္ခဏာ (မျက်နှာလွှဲ၊ သင်းကွဲ၊ ငို) ကို သိပါသလား။', 'Can you spot the "I have had enough" cues — looking away, yawning, fussing?'),
      ],
      dailyActivities: [
        b('မျက်နှာချင်းဆိုင် ပြုံးပြခြင်း၊ လျှာထုတ်ပြခြင်း။', 'Face-to-face smiling and gentle tongue-poking games.'),
        b('နူးညံ့သော သီချင်းနှင့် ယိမ်းယိုင်ခြင်း။', 'Soft singing with gentle rocking.'),
      ],
      weeklyActivities: [b('ကစားပုံစံ အသစ် တစ်ခု တစ်ပတ်လျှင် ထည့်ကြည့်ပါ။', 'Add one new gentle play idea each week.')],
      indoor: [b('အိပ်ရာဘေး မျက်နှာချင်းဆိုင် ကစားခြင်း။', 'Face-to-face play beside the cot.')],
      outdoor: [b('အရိပ်တွင် ပွေ့ချီ၍ သဘာဝ အသံများ နားထောင်ခြင်း။', 'Listening to natural sounds while carried in the shade.')],
      lowCost: [b('အခမဲ့ ကစားနည်းများသာ ဖြစ်သည်။', 'Every idea here is free.')],
      materials: b('မလိုအပ်ပါ', 'None'),
      safety: b(
        'ကလေးကို မြင့်သော နေရာ (ခုတင်၊ စားပွဲ) ပေါ်တွင် တစ်စက္ကန့်မျှ တစ်ယောက်တည်း မထားပါနှင့်။ လေထဲသို့ ပစ်ချီခြင်း၊ ပြင်းထန်စွာ ယိမ်းခြင်း မလုပ်ပါနှင့်။',
        'Never leave your baby alone on a high surface. Never throw a baby in the air or rock roughly.',
      ),
      commonMistakes: [
        b('ကစားချိန် ရှည်လွန်းခြင်း။', 'Play sessions that go on too long.'),
        b('ကလေး ငိုသည်ကို "ကစားမကောင်းလို့" ဟု ယူဆခြင်း — မောသည့် လက္ခဏာသာ ဖြစ်တတ်သည်။', 'Reading crying as "bad play" — usually it just means tired.'),
      ],
      parentTips: [b('တစ်ရက်လျှင် အကြိမ်များစွာ၊ တစ်ကြိမ်လျှင် တိုတိုသာ ကစားပါ။', 'Play often, but keep each turn short.')],
      faq: [
        {
          q: b('ကစားစရာ ဝယ်ပေးသင့်လား။', 'Should I buy toys?'),
          a: b('မလိုအပ်ပါ။ ဤအရွယ်တွင် သင့်မျက်နှာ၊ သင့်အသံသည် အကောင်းဆုံး ကစားစရာ ဖြစ်သည်။', 'Not needed. At this age your face and your voice are the best toys.'),
        },
      ],
      redFlags: [b('မည်သည့် ဆက်ဆံမှုကိုမျှ လုံးဝ တုံ့ပြန်မှု မရှိခြင်း။', 'No response at all to any interaction.')],
      referral: b('စဉ်ဆက်မပြတ် တုံ့ပြန်မှု မရှိပါက ကျန်းမာရေးဝန်ထမ်းအား ပြပါ။', 'Persistent lack of response should be checked by a health worker.'),
      encouragement: b('သင်သည် ကလေး၏ ပထမဆုံး ကစားဖော် ဖြစ်ပါသည်။', 'You are your baby’s first playmate.'),
    }),
    'Play as interaction, reading infant engagement and disengagement cues, and the never-shake caution follow AAP power-of-play guidance and the WHO Care for Child Development materials.',
  ),
];

const GUIDES_D: SeedItem[] = [
  kb(
    guide('birth_2m', 'nutrition', {
      title: b('မွေးကင်း – ၂ လ — အာဟာရနှင့် နို့တိုက်ကျွေးခြင်း လမ်းညွှန်', 'Birth–2 months — Feeding guide'),
      why: b(
        'အသက် ၆ လအထိ မိခင်နို့တစ်မျိုးတည်း တိုက်ကျွေးရန် အကြံပြုထားသည် — ရေပင် ထပ်မံ မလိုအပ်ပါ။ ဆာလောင်လက္ခဏာအလိုက် မကြာခဏ တိုက်ကျွေးခြင်းက နို့ထွက်မှုကို ထိန်းညှိပေးသည်။',
        'Exclusive breastfeeding is recommended for about the first 6 months — not even water is needed. Feeding on cue, frequently, is what regulates milk supply.',
      ),
      observationQuestions: [
        b('တစ်ရက်လျှင် ၈ ကြိမ် သို့မဟုတ် ထို့ထက်ပို၍ စို့ပါသလား။', 'Does your baby feed 8 or more times in 24 hours?'),
        b('စို့နေစဉ် မျိုသံ ကြားရပါသလား။', 'Can you hear swallowing during a feed?'),
        b('တစ်ရက်လျှင် ဆီးစိုသော အနှီး အရေအတွက် လုံလောက်ပါသလား။', 'Are there plenty of wet nappies each day?'),
        b('ကိုယ်အလေးချိန် တဖြည်းဖြည်း တက်နေပါသလား။', 'Is weight rising steadily on the growth chart?'),
      ],
      dailyActivities: [
        b('ဆာလောင်လက္ခဏာ (ပါးစပ်လှုပ်၊ လက်စုပ်၊ ရှာဖွေ) တွေ့လျှင် ချက်ချင်း တိုက်ပါ — ငိုသည်အထိ မစောင့်ပါနှင့်။', 'Feed at the first cues — mouthing, hand-sucking, rooting — rather than waiting for crying.'),
        b('တိုက်ကျွေးစဉ် ကလေးကို ကြည့်ပြီး စကားပြောပါ။', 'Look at and talk to your baby while feeding.'),
        b('တိုက်ပြီးနောက် ခေါင်းမြင့်စွာ ချီပြီး လေထုတ်ပေးပါ။', 'Hold upright to burp after a feed.'),
      ],
      weeklyActivities: [
        b('ကိုယ်အလေးချိန်နှင့် ကြီးထွားမှုကို ကျန်းမာရေးဌာနတွင် ပုံမှန် တိုင်းတာပါ။', 'Have weight and growth checked at routine health visits.'),
      ],
      indoor: [b('တိတ်ဆိတ်၍ သက်တောင့်သက်သာရှိသော နေရာတွင် တိုက်ကျွေးပါ။', 'Feed in a quiet, comfortable spot.')],
      outdoor: [b('အပြင်ရောက်နေချိန်တွင်လည်း လိုအပ်လျှင် တိုက်ကျွေးပါ — အချိန်ဇယား မလိုက်ပါနှင့်။', 'Feed on cue when out too — do not hold to a clock.')],
      lowCost: [b('မိခင်နို့သည် အခမဲ့ဖြစ်ပြီး ဘေးကင်းသည်။', 'Breast milk is free and safe.')],
      materials: b('မလိုအပ်ပါ — ဘော်တလီသုံးပါက ကျန်းမာရေးဝန်ထမ်း၏ လမ်းညွှန်ဖြင့် သန့်ရှင်းစွာ ပြင်ဆင်ပါ။', 'None — if bottles are used, prepare them hygienically following health-worker guidance.'),
      safety: b(
        'ကလေးကို တစ်ယောက်တည်း ဘော်တလီ ထောက်၍ မထားပါနှင့် — ရေမျိုတတ်သည်။ အသက် ၆ လအောက် ကလေးအား ပျားရည် မကျွေးပါနှင့်။ နွားနို့အစစ်ကို ပင်မ အစားအစာအဖြစ် ၁၂ လအောက်တွင် မကျွေးပါနှင့်။',
        'Never prop a bottle and leave your baby — it is a choking risk. Do not give honey under 12 months. Do not use fresh cow’s milk as the main drink under 12 months.',
      ),
      commonMistakes: [
        b('မွေးကင်းစတွင် ရေ သို့မဟုတ် သကြားရည် ထပ်တိုက်ခြင်း။', 'Giving water or sugar water to a newborn.'),
        b('အချိန်ဇယားအတိုင်း တင်းကျပ်စွာ တိုက်ခြင်း။', 'Feeding strictly by the clock.'),
        b('ငိုတိုင်း "နို့မဝဘူး" ဟု ကောက်ချက်ချခြင်း။', 'Assuming every cry means "not enough milk".'),
      ],
      parentTips: [
        b('မိခင်လည်း ရေများများ သောက်ပြီး အာဟာရ ပြည့်ဝစွာ စားပါ။', 'Mothers need plenty of fluids and good food too.'),
        b('နို့တိုက်ရာတွင် နာကျင်ပါက ကိုင်တွယ်ပုံ ပြင်ဆင်ရန် အကူအညီ တောင်းပါ။', 'If feeding hurts, ask for help with positioning and attachment.'),
      ],
      faq: [
        {
          q: b('နို့ လုံလောက်လားဆိုတာ ဘယ်လို သိမလဲ။', 'How do I know my baby is getting enough milk?'),
          a: b('ဆီးစိုသော အနှီး အရေအတွက် လုံလောက်ခြင်း၊ မျိုသံ ကြားရခြင်း၊ တိုက်ပြီးနောက် ကျေနပ်ခြင်း၊ ကိုယ်အလေးချိန် တက်ခြင်းတို့က အညွှန်းများ ဖြစ်သည်။ မသေချာပါက ကျန်းမာရေးဝန်ထမ်းအား ကိုယ်အလေးချိန် တိုင်းခိုင်းပါ။', 'Plenty of wet nappies, audible swallowing, contentment after feeds and steady weight gain are the signs. If unsure, ask a health worker to weigh your baby.'),
        },
        {
          q: b('ရေ တိုက်ပေးရမလား။', 'Should I give water?'),
          a: b('အသက် ၆ လအထိ မိခင်နို့တစ်မျိုးတည်းဖြင့် လုံလောက်ပါသည်။ ရေ ထပ်တိုက်ရန် မလိုပါ။', 'Exclusive breast milk is enough for about the first 6 months; extra water is not needed.'),
        },
      ],
      redFlags: [
        b('နို့စို့ရန် ငြင်းဆန်ခြင်း သို့မဟုတ် စို့အား အလွန် နည်းခြင်း။', 'Refusing feeds or feeding very weakly.'),
        b('ဆီးစိုသော အနှီး သိသိသာသာ လျော့နည်းခြင်း။', 'A clear drop in the number of wet nappies.'),
        b('တိုက်တိုင်း အားဖြင့် အန်ထွက်ခြင်း၊ သို့မဟုတ် အစိမ်းရောင် အန်ဖတ် ပါခြင်း။', 'Forceful vomiting after every feed, or green vomit.'),
        b('ကိုယ်အလေးချိန် မတက်ခြင်း သို့မဟုတ် ကျဆင်းခြင်း။', 'Weight not rising, or falling.'),
      ],
      referral: b(
        'အထက်ပါ လက္ခဏာများ တွေ့ပါက ကျန်းမာရေးဝန်ထမ်း သို့မဟုတ် ကလေးဆရာဝန်ထံ ချက်ချင်း ပြသပါ။ ရေဓာတ်ခန်းခြောက်ခြင်းသည် မွေးကင်းစတွင် လျင်မြန်စွာ ဖြစ်နိုင်သည်။',
        'Any of these should be seen by a health worker or paediatrician promptly — dehydration develops quickly in newborns.',
      ),
      encouragement: b('နို့တိုက်ခြင်းသည် လေ့ကျင့်ရသော ကျွမ်းကျင်မှုတစ်ခု ဖြစ်သည် — အကူအညီ တောင်းခြင်းက ကောင်းသော ဆုံးဖြတ်ချက် ဖြစ်သည်။', 'Feeding is a skill that is learned — asking for help is a good decision, not a failure.'),
    }),
    'Exclusive breastfeeding for about six months, feeding on cue and signs of adequate intake follow WHO infant and young child feeding guidance, WHO breastfeeding counselling guidance, the WHO/UNICEF IYCF strategy and NHS breastfeeding advice; faltering-growth escalation follows NICE guidance.',
  ),
  kb(
    guide('birth_2m', 'safety', {
      title: b('မွေးကင်း – ၂ လ — ဘေးကင်းလုံခြုံရေး လမ်းညွှန်', 'Birth–2 months — Safety guide'),
      why: b(
        'မွေးကင်းစကလေးသည် လုံးဝ မိမိကိုယ်ကို မကာကွယ်နိုင်ပါ။ ဤအရွယ်တွင် အဓိက အန္တရာယ်များမှာ အိပ်စက်ရာ အန္တရာယ်၊ ပြုတ်ကျခြင်း၊ အပူလောင်ခြင်း၊ ရေနစ်ခြင်းနှင့် လှုပ်ခါခံရခြင်း ဖြစ်သည်။',
        'A newborn cannot protect herself at all. The main risks at this age are unsafe sleep, falls, burns, drowning and being shaken.',
      ),
      observationQuestions: [
        b('အိပ်ရာသည် ပြားပြီး မာပါသလား။ အိပ်ရာပေါ်တွင် ခေါင်းအုံး၊ စောင်ထူ၊ အနူအထောင်း ရှိပါသလား။', 'Is the sleep surface firm and flat? Are there pillows, thick blankets or soft items in it?'),
        b('ကလေးကို မြင့်သော နေရာတွင် ခဏမျှ ချန်ထားမိပါသလား။', 'Is your baby ever left on a high surface, even briefly?'),
        b('အိမ်တွင် ဆေးလိပ်သောက်သူ ရှိပါသလား။', 'Does anyone smoke in the home?'),
      ],
      dailyActivities: [
        b('အိပ်တိုင်း ပက်လက် — နေ့အိပ်ပါ အပါအဝင်။', 'Back to sleep for every sleep, including naps.'),
        b('အိပ်ရာကို စစ်ဆေးပါ — ပြားပြီး မာသော မျက်နှာပြင်၊ ဘာမှ မထားပါနှင့်။', 'Check the cot — firm, flat, and empty.'),
        b('ရေနွေးအိုး၊ ထမင်းအိုးများကို ကလေးပွေ့ချီစဉ် မကိုင်ပါနှင့်။', 'Do not carry hot drinks or hot pots while holding your baby.'),
      ],
      weeklyActivities: [
        b('အိမ်တွင်း ဘေးအန္တရာယ် တစ်ပတ်လျှင် တစ်ကြိမ် လျှောက်၍ စစ်ဆေးပါ။', 'Do a weekly walk-through of the home for hazards.'),
      ],
      indoor: [b('ကလေးအိပ်ရာကို မိဘအခန်းထဲတွင် ထားပါ — အိပ်ရာမတူဘဲ အခန်းတူ။', 'Keep the baby’s cot in the parents’ room — room-share, do not bed-share.')],
      outdoor: [b('တိုက်ရိုက် နေရောင်မှ ကာကွယ်ပါ။ ကားစီးလျှင် သတ်မှတ်ချက်ပြည့်မီသော ကလေးထိုင်ခုံ သုံးပါ။', 'Keep out of direct sun. In a vehicle, use an appropriate infant car seat.')],
      lowCost: [b('ဘေးကင်းသော အိပ်စက်မှုသည် ကုန်ကျစရိတ် မရှိပါ — ပြားပြီး မာသော မျက်နှာပြင်နှင့် အနူအထောင်း မထားခြင်းသာ ဖြစ်သည်။', 'Safe sleep costs nothing — a firm flat surface and nothing soft in it.')],
      materials: b('ပြားပြီး မာသော အိပ်ရာ၊ ပါးလွှာသော အဝတ်', 'A firm flat sleep surface and light bedding'),
      safety: b(
        'အဓိက စည်းမျဉ်းများ — အိပ်တိုင်း ပက်လက်၊ ပြားပြီး မာသော မျက်နှာပြင်၊ အိပ်ရာထဲ ဘာမှ မထား၊ အခန်းတူ အိပ်ရာမတူ၊ ဆေးလိပ်မီးခိုး လုံးဝ မထိစေရ၊ ကလေးကို ဘယ်တော့မှ မလှုပ်ခါရ၊ ရေချိုးစဉ် တစ်စက္ကန့်မျှ မခွာရ၊ မြင့်သောနေရာတွင် တစ်ယောက်တည်း မထားရ။',
        'The core rules — back to sleep every sleep; firm flat surface; nothing in the cot; room-share but do not bed-share; no smoke exposure at all; never shake a baby; never leave a baby alone in or near water; never leave a baby alone on a high surface.',
      ),
      commonMistakes: [
        b('ဆိုဖာ သို့မဟုတ် ကုလားထိုင်ပေါ်တွင် ကလေးနှင့်အတူ အိပ်ပျော်သွားခြင်း။', 'Falling asleep with the baby on a sofa or armchair.'),
        b('အိပ်ရာထဲ ခေါင်းအုံး၊ အနူထောင်း၊ စောင်ထူ ထည့်ထားခြင်း။', 'Putting pillows, soft toys or thick blankets in the cot.'),
        b('အဝတ် အလွန်ထူထပ်စွာ ခြုံပေးခြင်း — အပူလွန်ခြင်း အန္တရာယ် ရှိသည်။', 'Over-wrapping — overheating is a risk.'),
      ],
      parentTips: [
        b('ကလေးကို ပြုစုပေးသူ တိုင်းကို ဤစည်းမျဉ်းများ ပြောပြထားပါ — အဖွား၊ အိမ်နီးချင်း အပါအဝင်။', 'Tell every carer these rules — grandparents and neighbours included.'),
        b('အရေးပေါ်အခြေအနေတွင် ဘယ်ကို သွားရမည်ကို ကြိုတင် သိထားပါ။', 'Know in advance where you would go in an emergency.'),
      ],
      faq: [
        {
          q: b('ကလေးက ဘေးစောင်း အိပ်ချင်ရင် ရလား။', 'Can my baby sleep on the side?'),
          a: b('အိပ်စက်ရန် အန္တရာယ် အနည်းဆုံး အနေအထားမှာ ပက်လက် ဖြစ်သည်။ ဘေးစောင်းနှင့် မှောက်လျက် အိပ်စက်ခြင်းကို မအကြံပြုပါ။', 'The back is the safest sleep position. Side and tummy sleeping are not recommended for sleep.'),
        },
        {
          q: b('တစ်အိပ်ရာတည်း အိပ်တာ ဘယ်လိုလဲ။', 'What about sharing a bed?'),
          a: b('အခန်းတူ အိပ်ရာမတူ ဖြစ်ရန် အကြံပြုသည်။ ကလေးအတွက် သီးသန့် ပြားပြီး မာသော အိပ်ရာကို မိဘအခန်းထဲတွင် ထားပါ။', 'Room-sharing without bed-sharing is advised: a separate firm flat sleep space for the baby, in the parents’ room.'),
        },
      ],
      redFlags: [
        b('အသက် ၃ လအောက် ကလေးတွင် ဖျားခြင်း — အရေးပေါ် စစ်ဆေးရန် လိုသည်။', 'Fever in a baby under 3 months — needs urgent assessment.'),
        b('အသက်ရှူ ခက်ခဲခြင်း၊ နှုတ်ခမ်း/အရေပြား ညိုမည်းလာခြင်း။', 'Difficulty breathing, or lips/skin turning blue or grey.'),
        b('တုံ့ပြန်မှု မရှိခြင်း၊ နိုးရန် အလွန်ခက်ခဲခြင်း၊ ကိုယ်ခန္ဓာ ပျော့ခွေခြင်း။', 'Unresponsive, very hard to wake, or floppy.'),
        b('တက်ခြင်း။', 'A fit or seizure.'),
      ],
      referral: b(
        'ဤလက္ခဏာများသည် အရေးပေါ် ဖြစ်သည် — အနီးဆုံး ဆေးရုံ သို့မဟုတ် ကျန်းမာရေးဌာနသို့ ချက်ချင်း သွားပါ။ ဤအက်ပ်သည် အရေးပေါ် ဝန်ဆောင်မှု မဟုတ်ပါ။',
        'These are emergencies — go to the nearest hospital or health facility immediately. This app is not an emergency service.',
      ),
      encouragement: b('ဘေးကင်းသော အခန်းတစ်ခန်းနှင့် တစ်သမတ်တည်း စည်းမျဉ်းများက အန္တရာယ် အများစုကို ကာကွယ်ပေးသည်။', 'A safe room and consistent rules prevent most of the risk.'),
    }),
    'Safe sleep, room-sharing, smoke avoidance, drowning and burn prevention follow AAP safe sleep guidance, NHS SIDS advice and AAP drowning-prevention guidance; the urgent-symptom list follows NHS seriously-ill-child advice, NICE fever guidance and the WHO IMCI danger signs.',
  ),
  kb(
    guide('birth_2m', 'daily_routine', {
      title: b('မွေးကင်း – ၂ လ — နေ့စဉ် လုပ်ရိုးလုပ်စဉ် လမ်းညွှန်', 'Birth–2 months — Daily rhythm guide'),
      why: b(
        'မွေးကင်းစတွင် တင်းကျပ်သော အချိန်ဇယား မလိုအပ်ပါ။ လိုအပ်သည်မှာ ကြိုတင်မှန်းဆနိုင်သော ပုံစံ — စို့၊ နိုးနေ၊ အိပ် ဟူသော ရိုးရှင်းသော လည်ပတ်မှု ဖြစ်သည်။',
        'A newborn does not need a strict schedule. What helps is a predictable pattern — feed, awake time, sleep — repeating gently.',
      ),
      observationQuestions: [
        b('တစ်ရက်တာတွင် ထပ်ခါထပ်ခါ ဖြစ်နေသော ပုံစံ တစ်ခုခု တွေ့ပါသလား။', 'Can you see any repeating pattern across the day?'),
        b('နိုးနေချိန် မည်မျှ ကြာပါသလဲ။', 'How long are the awake stretches?'),
        b('ညနှင့် နေ့ ကွာခြားမှု စတင် ပေါ်လာပါသလား။', 'Is any day–night difference starting to appear?'),
      ],
      dailyActivities: [
        b('နေ့ခင်းတွင် အလင်းရောင်နှင့် ပုံမှန် အိမ်တွင်း အသံများ ရှိစေပါ။', 'Keep daytime bright with normal household sounds.'),
        b('ညဘက်တွင် အလင်းမှိန်၊ အသံတိုး၊ စကားနည်းနည်းသာ ပြောပါ။', 'At night keep lights dim, voices low and talk minimal.'),
        b('ရေချိုးခြင်း၊ အဝတ်လဲခြင်းတို့ကို တူညီသော အစီအစဉ်ဖြင့် လုပ်ပါ။', 'Do bath and change in the same order each time.'),
      ],
      weeklyActivities: [b('မိဘများ အလှည့်ကျ အနားယူရန် အပတ်စဉ် စီစဉ်ပါ။', 'Plan weekly turn-taking so each parent gets rest.')],
      indoor: [b('နေ့ခင်း အလင်းရရှိသော နေရာတွင် နိုးနေချိန် ကုန်ဆုံးပါ။', 'Spend awake time where daylight reaches.')],
      outdoor: [b('နေ့စဉ် အရိပ်တွင် ခဏတာ ထွက်ခြင်း — မိဘအတွက်လည်း ကောင်းသည်။', 'A short daily time outside in the shade — good for you too.')],
      lowCost: [b('လုပ်ရိုးလုပ်စဉ်သည် အခမဲ့ ဖြစ်သည်။', 'Routine costs nothing.')],
      materials: b('မလိုအပ်ပါ', 'None'),
      safety: b(
        'ကလေးအိပ်ပျော်သွားလျှင် အမြဲ ပက်လက်နှင့် ဘေးကင်းသော အိပ်ရာသို့ ရွှေ့ပေးပါ — ကားထိုင်ခုံ၊ ကလေးထိုင်ခုံတွင် ကြာရှည် အိပ်ခြင်းကို ရှောင်ပါ။',
        'If your baby falls asleep, move her onto her back in a safe sleep space — avoid long sleeps in a car seat or bouncer.',
      ),
      commonMistakes: [
        b('မွေးကင်းစတွင် တင်းကျပ်သော အချိန်ဇယား ချမှတ်ရန် ကြိုးစားခြင်း။', 'Trying to impose a strict schedule on a newborn.'),
        b('နေ့အိပ်ချိန်ကို လုံးဝ ဖျက်ခြင်း — ညအိပ်ပိုကောင်းအောင် မလုပ်နိုင်ပါ။', 'Cutting out day sleep to "make night sleep better" — it does not work.'),
      ],
      parentTips: [
        b('ကလေး အိပ်ချိန်တွင် သင်လည်း အိပ်ပါ။', 'Sleep when your baby sleeps.'),
        b('အိမ်မှုကိစ္စကို လျှော့ချပါ — ပထမလများသည် ပြန်လည်နာလန်ထူချိန် ဖြစ်သည်။', 'Lower the housework bar — the early months are recovery time.'),
      ],
      faq: [
        {
          q: b('အချိန်ဇယား ဘယ်တော့ စလုပ်လို့ ရမလဲ။', 'When can I start a routine?'),
          a: b('ပထမလများတွင် ကလေး၏ လိုအပ်ချက်ကို လိုက်ပါ။ လအနည်းငယ်ကြာလျှင် ပုံစံများ ပိုပေါ်လာသည်။', 'In the early months, follow your baby’s needs. Patterns emerge on their own over the next few months.'),
        },
      ],
      redFlags: [
        b('တစ်ရက်လုံး နို့စို့ရန် မနိုးခြင်း။', 'Not waking to feed across the day.'),
        b('နိုးနေချိန် လုံးဝ မရှိခြင်း သို့မဟုတ် အမြဲ ငိုနေခြင်း။', 'No calm awake time at all, or crying almost constantly.'),
      ],
      referral: b('ဤအခြေအနေများကို ကျန်းမာရေးဝန်ထမ်းအား ပြပါ။ ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ပါ။', 'Raise these with a health worker. This is not a diagnosis.'),
      encouragement: b('ပုံစံမကျသေးခြင်းသည် ပုံမှန် ဖြစ်သည် — တဖြည်းဖြည်း ပေါ်လာပါလိမ့်မည်။', 'Having no pattern yet is normal — it will come.'),
    }),
    'Day–night light and sound cues, avoiding rigid newborn schedules, and moving a sleeping baby to a safe sleep surface follow AAP safe sleep guidance, WHO sleep guidance for under-5s and the AASM/behavioural sleep literature in the registry.',
  ),
];

// --- Activities ------------------------------------------------------------
// Speech, motor, social, reading, music and sensory — one each, all low-cost,
// all doable with items already in a Myanmar home.

const ACTIVITIES: SeedItem[] = [
  kb(
    activity({
      slug: 'face_to_face_talk',
      title: b('မျက်နှာချင်းဆိုင် စကားပြောခြင်း', 'Face-to-face talking'),
      summary: b('မျက်နှာချင်းဆိုင်၍ စကားပြောပြီး ကလေး တုံ့ပြန်ရန် စောင့်ခြင်း — ပထမဆုံး စကားဝိုင်း။', 'Talk face to face and wait for a response — your baby’s first conversation.'),
      ageGroupKey: 'birth_2m',
      domains: ['communication', 'speech', 'social'],
      difficulty: 'easy',
      durationMinutes: 3,
      materials: b('မလိုအပ်ပါ — သင့်မျက်နှာနှင့် အသံသာ။', 'None — just your face and voice.'),
      setup: b('ကလေးကို ပက်လက် သို့မဟုတ် ချီပြီး မျက်နှာမှ ၂၀–၃၀ စင်တီမီတာ အကွာတွင် ကြည့်ပါ။', 'Hold or lay your baby so your face is about 20–30 cm away.'),
      instructions: [
        b('ကလေးမျက်လုံးကို ကြည့်ပြီး နာမည်ခေါ်ပါ။', 'Look into your baby’s eyes and say her name.'),
        b('နှေးနှေး၊ နူးညံ့သော အသံဖြင့် စကားပြောပါ။', 'Talk slowly in a warm, gentle voice.'),
        b('ရပ်နားပြီး ၅–၁၀ စက္ကန့် စောင့်ပါ — ကလေး အသံထွက်ရန် အခွင့်ပေးပါ။', 'Pause and wait 5–10 seconds — give your baby a turn.'),
        b('အသံ သို့မဟုတ် လှုပ်ရှားမှု တွေ့လျှင် တုံ့ပြန်ပြောပါ။', 'When you get any sound or movement, answer it back.'),
        b('ကလေး မျက်နှာလွှဲသွားလျှင် ရပ်ပါ။', 'Stop when your baby looks away.'),
      ],
      safety: b('ကလေး၏ မောပန်းသည့် လက္ခဏာကို လေးစားပါ။ ကျယ်လောင်သော အသံ မသုံးပါနှင့်။', 'Respect tired cues. Do not use loud sounds.'),
      indoor: true, outdoor: true, oneChild: true, group: false, parentChild: true,
      outcomes: [
        b('သင်ယူရမည့် ရည်မှန်းချက် — အလှည့်ကျ ဆက်သွယ်ခြင်းကို စတင် ခံစားစေရန်။', 'Learning objective — to experience early turn-taking in communication.'),
        b('မျက်လုံးချင်းဆိုင်မှုနှင့် အာရုံစိုက်မှု တိုးတက်ခြင်း။', 'More eye contact and shared attention.'),
      ],
      variations: [b('နို့တိုက်ပြီးချိန်၊ အဝတ်လဲပြီးချိန်တွင် လုပ်ပါ။', 'Do it after a feed or a nappy change.')],
      tags: ['speech_activity', 'daily'],
    }),
    'Contingent face-to-face talk and turn-taking with infants are supported by NHS learn-to-talk guidance, the WHO Care for Child Development counselling materials and the responsive language-input research in the registry.',
  ),
  kb(
    activity({
      slug: 'gentle_bicycle_legs',
      title: b('ခြေထောက် နူးညံ့စွာ လေ့ကျင့်ပေးခြင်း', 'Gentle bicycle legs'),
      summary: b('အဝတ်လဲချိန်တွင် ခြေထောက်များကို နူးညံ့စွာ ကွေး/ဆန့်ပေးခြင်း။', 'Gently cycle the legs during a nappy change.'),
      ageGroupKey: 'birth_2m',
      domains: ['gross_motor', 'play'],
      difficulty: 'easy',
      durationMinutes: 2,
      materials: b('မလိုအပ်ပါ', 'None'),
      setup: b('ကလေးကို ပြားပြီး မာသော မျက်နှာပြင်ပေါ် ပက်လက် လှဲပါ။', 'Lay your baby on the back on a firm flat surface.'),
      instructions: [
        b('ခြေဖမျက်နှစ်ဖက်ကို နူးညံ့စွာ ကိုင်ပါ။', 'Hold the ankles gently.'),
        b('ခြေထောက်တစ်ဖက်ချင်း ဖြည်းညှင်းစွာ ကွေး၊ ဆန့် ပေးပါ။', 'Slowly bend and straighten one leg at a time.'),
        b('လုပ်ရင်း ရေတွက်ပြပါ သို့မဟုတ် သီချင်းဆိုပါ။', 'Count or sing while you do it.'),
        b('၁၀ ကြိမ်ခန့်ပြီးလျှင် ရပ်ပါ။', 'Stop after about 10 gentle cycles.'),
      ],
      safety: b('အတင်းအကျပ် မဆွဲပါနှင့်။ ကလေး မကြိုက်လျှင် ချက်ချင်း ရပ်ပါ။ ခြေဆစ်ကို မလိမ်ပါနှင့်။', 'Never force or pull. Stop immediately if your baby dislikes it. Do not twist the joints.'),
      indoor: true, outdoor: false, oneChild: true, group: false, parentChild: true,
      outcomes: [
        b('သင်ယူရမည့် ရည်မှန်းချက် — ခြေလက် လှုပ်ရှားမှုကို သတိပြုမိစေရန်။', 'Learning objective — awareness of leg movement and body.'),
        b('မိဘနှင့် ကလေး ထိတွေ့ဆက်ဆံမှု တိုးမြှင့်ခြင်း။', 'More warm parent–baby contact.'),
      ],
      tags: ['motor_activity', 'daily'],
    }),
    'Gentle handling and infant movement play at nappy changes are described in the WHO Care for Child Development materials and paediatric physical-therapy references in the registry.',
  ),
  kb(
    activity({
      slug: 'skin_to_skin_calm',
      title: b('အရေပြားချင်းထိ ပွေ့ချီခြင်း', 'Skin-to-skin calming'),
      summary: b('ကလေးကို ရင်ဘတ်ပေါ် အရေပြားချင်းထိ ပွေ့ချီ၍ ငြိမ်သက်စေခြင်း။', 'Hold your baby skin-to-skin on your chest to settle and connect.'),
      ageGroupKey: 'birth_2m',
      domains: ['emotional', 'social'],
      difficulty: 'easy',
      durationMinutes: 15,
      materials: b('ပါးလွှာသော စောင် သို့မဟုတ် ပုဆိုး', 'A light blanket or longyi'),
      setup: b('သက်တောင့်သက်သာ ထိုင်ပါ။ ကလေး၏ ရင်ဘတ်ကို သင့်ရင်ဘတ်ပေါ် တင်ပါ။ ကျောပေါ်တွင် ပါးလွှာသော အဝတ် ခြုံပေးပါ။', 'Sit comfortably, place your baby chest-to-chest with you, and cover the back with a light cloth.'),
      instructions: [
        b('ကလေး၏ ခေါင်းကို ဘေးတစ်ဖက်သို့ လှည့်ထား၍ အသက်ရှူလမ်းကြောင်း ရှင်းနေစေပါ။', 'Turn the baby’s head to one side so the airway is clear.'),
        b('နူးညံ့စွာ စကားပြောပါ သို့မဟုတ် သီချင်းဆိုပါ။', 'Talk softly or hum.'),
        b('ကလေး၏ အသက်ရှူမှုနှင့် အရောင်ကို မကြာခဏ ကြည့်ပါ။', 'Check your baby’s breathing and colour often.'),
        b('သင် အိပ်ငိုက်လာလျှင် ကလေးကို ဘေးကင်းသော အိပ်ရာသို့ ပက်လက် ရွှေ့ပါ။', 'If you feel sleepy, move your baby onto her back in a safe sleep space.'),
      ],
      safety: b(
        'သင် အိပ်ငိုက်နေချိန်၊ ဆေးလိပ်သောက်ပြီးချိန်၊ အရက်/မူးယစ်ဆေး သုံးထားချိန်တွင် ဤနည်းကို မလုပ်ပါနှင့်။ ဆိုဖာ သို့မဟုတ် ကုလားထိုင်ပေါ်တွင် ကလေးနှင့်အတူ လုံးဝ အိပ်မပျော်ပါစေနှင့်။',
        'Do not do this if you are drowsy, have smoked, or have used alcohol or sedating drugs. Never fall asleep with your baby on a sofa or armchair.',
      ),
      indoor: true, outdoor: false, oneChild: true, group: false, parentChild: true,
      outcomes: [
        b('သင်ယူရမည့် ရည်မှန်းချက် — လုံခြုံမှုနှင့် စိတ်ငြိမ်သက်မှုကို တည်ဆောက်ရန်။', 'Learning objective — build security and help your baby settle.'),
        b('နို့တိုက်ကျွေးမှုကို ပိုမိုလွယ်ကူစေခြင်း။', 'Feeding often becomes easier.'),
      ],
      tags: ['social_activity', 'bonding'],
    }),
    'Skin-to-skin contact and its feeding and settling benefits follow WHO breastfeeding counselling and Baby-Friendly Hospital Initiative guidance; the sofa/armchair and drowsiness cautions follow AAP safe sleep guidance and NHS SIDS advice.',
  ),
  kb(
    activity({
      slug: 'first_book_share',
      title: b('ပထမဆုံး စာအုပ် အတူကြည့်ခြင်း', 'Sharing a first book'),
      summary: b('ရုပ်ပုံစာအုပ် တစ်အုပ်ကို အတူကြည့်ပြီး ပြောပြခြင်း — စာဖတ်ခြင်း၏ အစ။', 'Look at a picture book together and describe it — the start of reading.'),
      ageGroupKey: 'birth_2m',
      domains: ['language', 'communication'],
      difficulty: 'easy',
      durationMinutes: 3,
      materials: b('ရုပ်ပုံစာအုပ် သို့မဟုတ် အနက်/အဖြူ ရုပ်ပုံ တစ်ရွက်', 'A picture book, or a single black-and-white picture'),
      setup: b('ကလေးကို ချီထားပြီး ရုပ်ပုံကို မျက်နှာမှ ၃၀ စင်တီမီတာခန့်တွင် ထားပါ။', 'Hold your baby and place the picture about 30 cm from the face.'),
      instructions: [
        b('စာလုံးအတိုင်း မဖတ်ဘဲ ပုံကို ပြောပြပါ — "ဒါ ခွေးလေးပါ"။', 'Do not read word for word — describe the picture: "this is a dog".'),
        b('ကလေး ကြည့်နေသည့် ပုံပေါ်တွင် ရပ်နေပါ။', 'Stay on whichever picture your baby is looking at.'),
        b('တစ်ကြိမ်လျှင် စာမျက်နှာ ၁–၂ မျက်နှာသာ ကြည့်ပါ။', 'One or two pages per turn is plenty.'),
      ],
      safety: b('စာအုပ်ကို ကလေး ပါးစပ်ထဲ မထည့်ပါစေနှင့်။ စာရွက်ဖြင့် အရေပြား ရှသွားနိုင်သည် — သတိထားပါ။', 'Keep the book out of the mouth, and watch for paper cuts.'),
      indoor: true, outdoor: false, oneChild: true, group: true, parentChild: true,
      outcomes: [
        b('သင်ယူရမည့် ရည်မှန်းချက် — စကားလုံး ကြားနာမှုနှင့် အတူတကွ အာရုံစိုက်မှု တည်ဆောက်ရန်။', 'Learning objective — exposure to words and shared attention.'),
        b('စာအုပ်နှင့် ဖော်ရွေမှု စတင် တည်ဆောက်ခြင်း။', 'A first positive association with books.'),
      ],
      variations: [b('စာအုပ် မရှိလျှင် အိမ်တွင်း ပစ္စည်းများကို ပြော၍ ပြပါ။', 'No book? Name and show household objects instead.')],
      tags: ['reading_activity'],
    }),
    'Shared book-looking from early infancy and describing rather than reading verbatim follow AAP early-literacy guidance, NHS early-literacy advice and the shared book-reading research in the registry.',
  ),
  kb(
    activity({
      slug: 'lullaby_and_rock',
      title: b('ကလေးသိပ် သီချင်းနှင့် ဖြည်းညှင်း ယိမ်းခြင်း', 'Lullaby and gentle rocking'),
      summary: b('တူညီသော သီချင်းတစ်ပုဒ်ကို နေ့စဉ် ဆိုပြီး ဖြည်းညှင်းစွာ ယိမ်းပေးခြင်း။', 'Sing the same song each day while rocking slowly.'),
      ageGroupKey: 'birth_2m',
      domains: ['play', 'emotional', 'communication'],
      difficulty: 'easy',
      durationMinutes: 5,
      materials: b('မလိုအပ်ပါ — သင့်အသံသာ။', 'None — your voice is enough.'),
      setup: b('ကလေးကို လုံခြုံစွာ ချီပါ။ အလင်းကို မှိန်ပါ။', 'Hold your baby securely and dim the light.'),
      instructions: [
        b('တူညီသော ကလေးသိပ် သီချင်းတစ်ပုဒ်ကို ရွေးပါ။', 'Choose one lullaby and keep using it.'),
        b('နှေးနှေး၊ တိုးတိုး ဆိုပါ။', 'Sing slowly and softly.'),
        b('ဖြည်းညှင်းစွာ ယိမ်းပါ — ပြင်းထန်စွာ မယိမ်းပါနှင့်။', 'Rock gently — never vigorously.'),
        b('ကလေး ငြိမ်လာလျှင် အသံကို ပိုတိုးပါ။', 'As your baby settles, sing even more quietly.'),
      ],
      safety: b(
        'ဘယ်တော့မှ ပြင်းထန်စွာ မလှုပ်ခါပါနှင့် — ဦးနှောက် ထိခိုက်နိုင်သည်။ အိပ်ပျော်သွားလျှင် ပက်လက်နှင့် ဘေးကင်းသော အိပ်ရာသို့ ရွှေ့ပါ။',
        'Never shake — it can injure the brain. If your baby falls asleep, move her onto her back in a safe sleep space.',
      ),
      indoor: true, outdoor: false, oneChild: true, group: false, parentChild: true,
      outcomes: [
        b('သင်ယူရမည့် ရည်မှန်းချက် — အသံစည်းချက်ကို ခံစားပြီး ငြိမ်သက်ရန် သင်ယူစေရန်။', 'Learning objective — experience rhythm and learn to settle.'),
        b('အိပ်ရာဝင်ချိန် လုပ်ရိုးလုပ်စဉ် တည်ဆောက်ခြင်း။', 'Builds a bedtime routine.'),
      ],
      tags: ['music_activity', 'bedtime'],
    }),
    'Singing, rhythm and consistent bedtime routines follow WHO Care for Child Development materials and the behavioural bedtime-routine sleep literature in the registry; safe-sleep transfer follows AAP safe sleep guidance.',
  ),
  kb(
    activity({
      slug: 'texture_touch',
      title: b('ထိတွေ့ခံစားမှု ကစားနည်း', 'Texture touch play'),
      summary: b('အသွင်အပြင် မတူသော အဝတ်စများကို လက်နှင့် နူးညံ့စွာ ထိတွေ့စေခြင်း။', 'Let your baby feel different soft fabrics on the hands and arms.'),
      ageGroupKey: 'birth_2m',
      domains: ['fine_motor', 'cognitive', 'play'],
      difficulty: 'easy',
      durationMinutes: 3,
      materials: b('သန့်ရှင်းသော အဝတ်စ ၂–၃ မျိုး (ချောသော၊ အနည်းငယ် ကြမ်းသော)', '2–3 clean fabric pieces — one smooth, one slightly textured'),
      setup: b('ကလေးကို ပက်လက် လှဲပြီး နိုးနေ၍ ငြိမ်သက်ချိန်ကို ရွေးပါ။', 'Lay your baby on the back during a calm, alert time.'),
      instructions: [
        b('အဝတ်စကို လက်ဖဝါးနှင့် လက်မောင်းတွင် နူးညံ့စွာ ပွတ်ပေးပါ။', 'Stroke the palm and forearm gently with the fabric.'),
        b('"ဒါက ချောတယ်နော်" ဟု ပြောပြပါ။', 'Name it — "this one is smooth".'),
        b('အဝတ်စ တစ်မျိုးပြီး တစ်မျိုး လဲပါ။', 'Swap to the next fabric.'),
        b('ကလေး မျက်နှာလွှဲလျှင် ရပ်ပါ။', 'Stop when your baby turns away.'),
      ],
      safety: b(
        'ပါးလွှာသော အိတ်၊ ကြိုး၊ အလွန်သေးငယ်သော ပစ္စည်းများကို လုံးဝ မသုံးပါနှင့် — အသက်ရှူပိတ်ခြင်းနှင့် လည်ချောင်းညှစ်ခြင်း အန္တရာယ် ရှိသည်။ အဝတ်ကို မျက်နှာပေါ် လုံးဝ မတင်ပါနှင့်။',
        'Never use thin plastic, cords or very small items — suffocation and strangulation risk. Never place fabric over the face.',
      ),
      indoor: true, outdoor: false, oneChild: true, group: false, parentChild: true,
      outcomes: [
        b('သင်ယူရမည့် ရည်မှန်းချက် — ထိတွေ့ခံစားမှု အမျိုးမျိုးကို သိရှိစေရန်။', 'Learning objective — experience different touch sensations.'),
        b('လက်ဖြန့်ခြင်းနှင့် ထိတွေ့မှုကို သတိပြုမိခြင်း တိုးတက်ခြင်း။', 'More hand opening and touch awareness.'),
      ],
      tags: ['sensory_activity'],
    }),
    'Gentle infant tactile play and the suffocation/strangulation cautions follow the WHO Care for Child Development materials, AAP safe sleep guidance and paediatric occupational-therapy references in the registry.',
  ),
];

// --- Printable checklist ---------------------------------------------------

const PRINTABLES: SeedItem[] = [
  kb(
    printable({
      key: 'checklist_birth_2m',
      format: 'A4 PDF',
      title: b('မွေးကင်း – ၂ လ — မိဘ စစ်ဆေးစာရင်း', 'Birth–2 months — Parent checklist'),
      description: b(
        'ဤအရွယ်အတွက် သတိပြုစရာများ၊ ဘေးကင်းရေး စည်းမျဉ်းများနှင့် ကျန်းမာရေးဝန်ထမ်းအား မေးရန် မေးခွန်းများ ပါဝင်သော စာရင်း — လမ်းညွှန်သာ ဖြစ်ပြီး ရောဂါ စစ်ဆေးမှု မဟုတ်ပါ။',
        'What to notice, the safe-sleep rules, and questions to ask at a health visit — a guide, not a diagnostic test.',
      ),
    }),
    'Checklist content is drawn from the CDC milestone checklists, AAP milestone guidance, AAP safe sleep guidance and the NHS baby review schedule; it is explicitly framed as guidance rather than screening.',
  ),
];

export const BIRTH_2M: SeedItem[] = [
  ...MILESTONES,
  ...GUIDES,
  ...GUIDES_B,
  ...GUIDES_C,
  ...GUIDES_D,
  ...ACTIVITIES,
  ...PRINTABLES,
];
