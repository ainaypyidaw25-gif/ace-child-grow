// Knowledge base — 7 to 9 months.
//
// Authored against the verified evidence registry (src/evidence/sources.ts)
// and linked explicitly in src/evidence/links.ts. Nothing here diagnoses,
// predicts a disorder or promises an outcome. Age ranges are stated as
// guidance with the normal variation named plainly.
import { activity, guide, milestone, printable, type SeedItem } from '../../types';
import { kb } from './editorial';

const b = (mm: string, en: string) => ({ mm, en });

// --- Milestones ------------------------------------------------------------

const MILESTONES: SeedItem[] = [
  kb(
    milestone('7_9m', 'gross_motor', 2, {
      title: b('မမှီဘဲ ထိုင်နိုင်ခြင်း', 'Sitting without support'),
      observe: b('ကလေးသည် လက်ဖြင့် မထောက်ဘဲ ခဏ ထိုင်နိုင်ပါသလား။', 'Can your baby sit for a while without propping on her hands?'),
      why: b('မမှီဘဲ ထိုင်နိုင်ခြင်းသည် များသောအားဖြင့် ၆ လမှ ၉ လကြားတွင် ဖြစ်လာပြီး ကွာဟမှု ကျယ်ပါသည်။ အစပိုင်းတွင် လက်ဖြင့် ထောက်ထိုင်ပြီး နောက်မှ လက်လွတ် ထိုင်နိုင်လာသည်။', 'Sitting without support usually appears between about 6 and 9 months, with wide variation. Babies first prop on their hands, then let go.'),
      red: b('လ ၉ လအရွယ်တွင် မထောက်ဘဲ ခဏမျှ မထိုင်နိုင်ခြင်း၊ ကိုယ်လုံး အလွန်ပျော့ခြင်း သို့မဟုတ် အလွန်တောင့်တင်းခြင်းကို ကျန်းမာရေးဝန်ထမ်းအား ပြပါ။', 'Not sitting even briefly by 9 months, or a body that feels very floppy or very stiff, is worth checking.'),
      encouragement: b('ကြမ်းပြင်ပေါ်တွင် လုံခြုံစွာ ထိုင်ခွင့်ပေးခြင်းက ကလေး၏ ကိုယ်ဟန်ချိန်ညှိမှုကို အကောင်းဆုံး လေ့ကျင့်ပေးသည်။', 'Safe floor time is the best practice for balance there is.'),
    }),
    'Sitting without support between about 6 and 9 months follows CDC and AAP milestone guidance and the WHO motor development study windows, with the tone and the wide normal range taken from the paediatric physical-therapy references in the registry.',
  ),
  kb(
    milestone('7_9m', 'fine_motor', 2, {
      title: b('ပစ္စည်းငယ်များကို လက်ဖြင့် ဆွဲယူခြင်း', 'Raking and picking up small objects'),
      observe: b('ကလေးသည် ပစ္စည်းငယ်ကို လက်ချောင်းများဖြင့် ဆွဲယူရန် ကြိုးစားပါသလား။ ပစ္စည်းနှစ်ခုကို ရိုက်ခတ်ပါသလား။', 'Does she rake small objects towards her with her fingers, or bang two things together?'),
      why: b('၇ လမှ ၉ လကြားတွင် လက်ဝါးတစ်ခုလုံးဖြင့် ဆွဲယူရာမှ လက်မနှင့် လက်ညှိုးဖြင့် ညှပ်ယူခြင်းသို့ တဖြည်းဖြည်း ကူးပြောင်းသည်။ ၉ လဝန်းကျင်တွင် အစောပိုင်း ညှပ်ကိုင်မှု စတင်တတ်သည်။', 'Between 7 and 9 months a whole-hand rake gradually becomes a thumb-and-finger pinch; an early pincer grasp often appears around 9 months.'),
      red: b('လက်တစ်ဖက်တည်းကိုသာ အမြဲ သုံးခြင်း၊ ပစ္စည်းကို လုံးဝ မဆွဲယူခြင်းကို ပြသင့်သည်။', 'Always using only one hand, or not reaching for objects at all, is worth checking.'),
      encouragement: b('ကလေးသည် လက်ဖြင့် ကမ္ဘာကြီးကို စူးစမ်းနေခြင်း ဖြစ်သည်။', 'She is exploring the world with her hands.'),
    }),
    'The rake-to-pincer progression at 7–9 months follows CDC milestone checklists and AAP milestone guidance, with the hand-skill sequence taken from the paediatric occupational-therapy references in the registry.',
  ),
  kb(
    milestone('7_9m', 'speech', 1, {
      title: b('ဗျည်းသံ အစဉ်လိုက် မြည်တွန်ခြင်း', 'Babbling long strings of sounds'),
      observe: b('ကလေးသည် "ဘဘဘ"၊ "ဒဒဒ" ကဲ့သို့ အသံများကို ဆက်တိုက် ထွက်ပါသလား။', 'Does she make long strings such as "bababa" or "dadada"?'),
      why: b('၇ လမှ ၉ လကြားတွင် ဗျည်းသံများ ထပ်ခါထပ်ခါ ပေါင်းစပ်ခြင်း ပိုများလာသည်။ "မာမာ"၊ "ဒါဒါ" ဟု ဆိုသော်လည်း လူကို ရည်ညွှန်း၍ မဟုတ်သေးပါ — ၎င်းသည် ပုံမှန် ဖြစ်သည်။', 'Repeated consonant strings become common between 7 and 9 months. "Mama" and "dada" may appear without yet meaning a person, which is normal.'),
      red: b('လ ၉ လအရွယ်တွင် မည်သည့် ဗျည်းသံမျှ မထွက်ခြင်း၊ အသံဆူညံမှုကို လုံးဝ တုံ့ပြန်မှု မရှိခြင်းကို ပြသင့်သည်။', 'No consonant sounds at all by 9 months, or no reaction to sound, is worth checking.'),
      encouragement: b('ကလေး၏ အသံကို ပြန်ဆိုပေးခြင်းက စကားပြောရန် အခိုင်မာဆုံး ဖိတ်ခေါ်မှု ဖြစ်သည်။', 'Copying her sounds is the strongest invitation to talk.'),
    }),
    'Repeated consonant babble at 7–9 months follows CDC and AAP milestone guidance and NHS learn-to-talk advice, with the sound-development sequence taken from the speech-language pathology references in the registry.',
  ),
  kb(
    milestone('7_9m', 'language', 2, {
      title: b('ရိုးရှင်းသော စကားလုံးများကို နားလည်လာခြင်း', 'Understanding simple words'),
      observe: b('"မလုပ်နဲ့"၊ "လာ" ကဲ့သို့ စကားလုံးများကို တုံ့ပြန်ပါသလား။ နာမည်ခေါ်လျှင် လှည့်ကြည့်ပါသလား။', 'Does she respond to words like "no" or "come", and turn when her name is called?'),
      why: b('နားလည်မှုသည် ပြောဆိုမှုထက် စောပါသည်။ ၇ လမှ ၉ လကြားတွင် အသုံးများသော စကားလုံးအချို့ကို နားလည်လာပြီး မိဘ၏ လေသံနှင့် အမူအရာကိုလည်း ဖတ်တတ်လာသည်။', 'Understanding comes before talking. Between 7 and 9 months babies begin to recognise a few familiar words, and they read tone and gesture too.'),
      red: b('လ ၉ လအရွယ်တွင် နာမည်ခေါ်လျှင် လုံးဝ မလှည့်ခြင်း၊ အသံကို တုံ့ပြန်မှု မရှိခြင်းကို ပြသင့်သည်။', 'No turning to her name and no response to sound by 9 months is worth checking.'),
      encouragement: b('နေ့စဉ် လုပ်ငန်းများကို စကားနှင့် တွဲပြောပေးခြင်းက စကားလုံးများကို အဓိပ္ပာယ် ရှိစေသည်။', 'Naming what you are doing gives words their meaning.'),
    }),
    'Early word comprehension and response to name at 7–9 months follow CDC milestone guidance and AAP developmental-surveillance guidance, with the comprehension-before-production sequence and the value of adult talk taken from the language-development references in the registry.',
  ),
  kb(
    milestone('7_9m', 'social', 2, {
      title: b('မိဘနှင့် ခွဲခွာရသည်ကို စိုးရိမ်လာခြင်း', 'Showing separation anxiety'),
      observe: b('မိဘ ခွာသွားလျှင် ငိုပါသလား။ အသိမဟုတ်သူ ချီလျှင် တွန့်ဆုတ်ပါသလား။', 'Does she cry when you leave, or hold back from unfamiliar people?'),
      why: b('၈ လမှ ၁၀ လကြားတွင် ခွဲခွာမှု စိုးရိမ်ခြင်းသည် အများဆုံး ဖြစ်တတ်သည်။ ၎င်းသည် ပြဿနာ မဟုတ်ဘဲ ကလေးက မိဘကို အထူးပုဂ္ဂိုလ်အဖြစ် မှတ်မိလာပြီ ဟူသော ကျန်းမာသည့် အချက်ပြမှု ဖြစ်သည်။', 'Separation anxiety usually peaks between about 8 and 10 months. It is not a problem — it is a healthy sign that she now knows you are someone special.'),
      red: b('မည်သူ့ကိုမျှ အထူးမတွယ်တာခြင်း၊ မိဘကို လုံးဝ မဂရုစိုက်ခြင်းကို ကျန်းမာရေးဝန်ထမ်းအား ပြသင့်သည်။', 'No particular attachment to anyone, or no interest in a parent at all, is worth checking.'),
      encouragement: b('ကလေး၏ ငိုသံသည် သင့်ကို ချစ်ကြောင်း ပြောနေခြင်း ဖြစ်သည်။', 'Her tears are telling you that you matter.'),
    }),
    'Separation anxiety peaking around 8–10 months follows CDC and AAP milestone guidance and NICE social and emotional wellbeing guidance, with the attachment framing taken from the developmental-behavioural paediatrics references in the registry.',
  ),
  kb(
    milestone('7_9m', 'cognitive', 1, {
      title: b('ဖုံးကွယ်ထားသော ပစ္စည်းကို လိုက်ရှာခြင်း', 'Looking for a hidden object'),
      observe: b('ကစားစရာကို အဝတ်ဖြင့် ဖုံးလိုက်လျှင် ကလေးက လှန်ရှာပါသလား။', 'If you cover a toy with a cloth, does she pull the cloth off to find it?'),
      why: b('၇ လမှ ၉ လကြားတွင် "မမြင်ရသော်လည်း ရှိနေသေးသည်" ဟူသော အသိ စတင် ဖြစ်ပေါ်လာသည်။ ဤအသိသည် ဖုံးပြီးပြန်ဖွင့်ခြင်း ကစားနည်းများကို ကလေး ကြိုက်နှစ်သက်စေသည်။', 'Between 7 and 9 months babies begin to grasp that things still exist when out of sight, which is why hiding games become so enjoyable.'),
      red: b('ပတ်ဝန်းကျင်ကို လုံးဝ စိတ်မဝင်စားခြင်း၊ ကစားစရာကို မလိုက်ကြည့်ခြင်းကို ပြသင့်သည်။', 'No interest in surroundings and no following of a toy is worth checking.'),
      encouragement: b('ဖုံးပြီး ပြန်ရှာသော ကစားနည်းသည် အခမဲ့ ဦးနှောက် လေ့ကျင့်ခန်း ဖြစ်သည်။', 'Hide-and-find is free brain exercise.'),
    }),
    'Early object permanence and hiding play at 7–9 months follow CDC and AAP milestone guidance, AAP guidance on the power of play and standard developmental-behavioural paediatrics references in the registry.',
  ),
  kb(
    milestone('7_9m', 'nutrition', 1, {
      title: b('တစ်နေ့ အစာ နှစ်နပ်မှ သုံးနပ် စားနိုင်လာခြင်း', 'Moving to two or three meals a day'),
      observe: b('ကလေးသည် တစ်နေ့လျှင် အစားအစာ နှစ်နပ်မှ သုံးနပ် စားနေပါသလား။ အသားညက်၊ ပဲ၊ အသည်း ကဲ့သို့ သံဓာတ်ပါသော အစာများ ပါဝင်ပါသလား။', 'Is she eating two to three meals a day, including iron-rich foods such as minced meat, liver, beans or eggs?'),
      why: b('၆ လမှ ၈ လကြားတွင် ကမ္ဘာ့ကျန်းမာရေးအဖွဲ့က တစ်နေ့လျှင် အစာ နှစ်နပ်မှ သုံးနပ် အကြံပြုပြီး နို့တိုက်ခြင်းကို ဆက်လက် လုပ်ရန် ဖြစ်သည်။ ဤအရွယ်တွင် သံဓာတ် လိုအပ်ချက် မြင့်တက်လာသည်။', 'WHO guidance for 6–8 months is two to three meals a day alongside continued breastfeeding; iron needs rise sharply at this age.'),
      red: b('အစာ လုံးဝ ငြင်းပယ်ခြင်း၊ မျိုချရ ခက်ခဲခြင်း၊ ကိုယ်အလေးချိန် မတက်ခြင်းကို ကျန်းမာရေးဝန်ထမ်းအား ပြပါ။', 'Refusing all food, difficulty swallowing, or weight that is not increasing should be checked.'),
      encouragement: b('အစားအစာ အသစ်ကို လက်ခံရန် အကြိမ်များစွာ လိုတတ်သည် — စိတ်မပျက်ပါနှင့်။', 'New foods often need many tries. Keep offering calmly.'),
    }),
    'Meal frequency and iron-rich complementary foods at 7–9 months follow WHO complementary feeding guidance, the WHO infant and young child feeding model chapter and NHS advice on first solid foods.',
  ),
  kb(
    milestone('7_9m', 'self_help', 1, {
      title: b('လက်ဖြင့် ကိုယ်တိုင် စားနိုင်လာခြင်း', 'Starting to feed herself with her hands'),
      observe: b('ကလေးသည် ပျော့သော အစာတုံးများကို ကိုယ်တိုင် ကောက်စားပါသလား။ ခွက်ကို ကိုင်ကြည့်ပါသလား။', 'Does she pick up soft finger foods herself, or hold a cup?'),
      why: b('၈ လဝန်းကျင်တွင် ပျော့သော အစာတုံးများကို ကိုယ်တိုင် ကောက်စားနိုင်လာသည်။ ကိုယ်တိုင် စားခြင်းသည် လက်ကြွက်သားများနှင့် အစားအစာ လက်ခံမှုကို တစ်ပြိုင်နက် လေ့ကျင့်ပေးသည်။', 'Around 8 months many babies can pick up soft finger foods. Self-feeding builds hand skills and food acceptance at the same time.'),
      red: b('အစာကို ပါးစပ်သို့ လုံးဝ မယူတတ်ခြင်း၊ စားတိုင်း ချောင်းဆိုးခြင်း၊ လည်ချောင်း ပိတ်ခြင်းကို ပြသင့်သည်။', 'Never bringing food to the mouth, or coughing and choking at every meal, is worth checking.'),
      encouragement: b('ပက်ကျံခြင်းသည် အမှား မဟုတ်ဘဲ သင်ယူမှု၏ တစ်စိတ်တစ်ပိုင်း ဖြစ်သည်။', 'Mess is not a mistake — it is part of learning.'),
    }),
    'Self-feeding with soft finger foods around 8 months follows CDC and AAP milestone guidance, the paediatric occupational-therapy references in the registry and the Bright Futures preventive-care schedule.',
  ),
  kb(
    milestone('7_9m', 'gross_motor', 3, {
      title: b('တွားခြင်း သို့မဟုတ် ကိုယ်ကိုရွှေ့ပြီး ပစ္စည်းယူဖို့ ကြိုးစားခြင်း', 'Crawls or moves around to reach something'),
      observe: b(
        'ဗိုက်နှင့်လျှောခြင်း၊ လေးဖက်ထောက်တွားခြင်း၊ တစ်ဖက်ကို လိမ့်ရွှေ့ခြင်း စသည့် နည်းလမ်းတစ်ခုခုနှင့် အလိုရှိရာ ရွေ့သွားပါသလား။',
        'Does your baby move toward something they want — by belly-scooting, crawling on hands and knees, or rolling — using any method at all?',
      ),
      why: b(
        'ရွေ့လျားနည်းက ကလေးအလိုက် အများကြီး ကွဲပြားသည်။ အချို့က ပုံမှန် လေးဖက်ထောက်တွားပြီး အချို့က ဗိုက်နှင့်လျှောခြင်း၊ တင်ပါးထိုင်၍ ရွှေ့ခြင်းစသည် ကွဲပြားနည်းများ သုံးတတ်ကြသည် — အားလုံးသည် ပုံမှန်ဖြစ်နိုင်သည်။ အရေးကြီးသည်မှာ လေးဖက်ထောက်တွားခြင်း အတိအကျ မဟုတ်ဘဲ ကိုယ့်ဘာသာ ရွေ့နိုင်စွမ်းဖြစ်သည်။',
        'How babies move varies widely — classic hands-and-knees crawling, belly-scooting, bottom-shuffling, or rolling across a room are all normal. What matters is that some form of self-directed movement is emerging, not the exact style.',
      ),
      red: b(
        'လ ၉ လသို့ရောက်လျှင် ရွေ့လျားရန် လုံးဝ ကြိုးစားမှု မရှိပါက ကျန်းမာရေးဝန်ထမ်းအား ပြပါ။',
        'If there is no attempt at self-directed movement at all by 9 months, mention it at a health visit.',
      ),
      encouragement: b(
        'ကြိုက်နှစ်သက်သော အရာများကို လှမ်းမီအောင်ထားပြီး လုံခြုံသော ကြမ်းပြင်တွင် အားပေးကစားပါ။',
        'Place favorite toys just out of reach and encourage play on a safe, open floor.',
      ),
    }),
    'Wide normal variation in how infants achieve mobility (crawling, scooting, shuffling) is documented in the WHO motor development windows study and paediatric physical-therapy references in the registry.',
  ),
  kb(
    milestone('7_9m', 'social', 3, {
      title: b('မျက်နှာဖုံးတမ်း ကစားခြင်းကို နှစ်သက်ပြီး ကြိုတင်မျှော်လင့်တတ်ခြင်း', 'Enjoys and anticipates peek-a-boo'),
      observe: b(
        'မိဘက မျက်နှာကို အဝတ်ဖြင့် ဖုံးအုပ်ထားပြီး "ဝါး… ဘူး" ဟု ဖွင့်ပြသည့်အခါ ကလေးငယ်က ရယ်မောပါသလား။ နောက်တစ်ကြိမ် ထပ်မံဖုံးအုပ်ပြသမည်ကို ကြိုတင်မျှော်လင့်၍ စောင့်ကြည့်နေတတ်ပါသလား။',
        'When you cover your face and say "peek-a-boo," does your baby laugh? Do they start anticipating it before you reveal your face again?',
      ),
      why: b(
        'ဤကဲ့သို့ ကစားခြင်းကို နှစ်သက်ခြင်းသည် မျက်စိရှေ့တွင် မမြင်ရသော်လည်း အရာဝတ္ထုများ ဆက်လက်တည်ရှိနေဆဲဖြစ်သည်ဟူသော အသိ စတင်ဖြစ်ပေါ်လာခြင်းနှင့် အလှည့်ကျ ကစားတတ်ခြင်း၏ အစောပိုင်း လက္ခဏာတစ်ခု ဖြစ်ပါသည်။',
        'Enjoying peek-a-boo shows early object permanence and the beginnings of turn-taking play.',
      ),
      encouragement: b(
        'နေ့စဉ် အဝတ်အစား လဲလှယ်ပေးချိန်နှင့် ကစားချိန်များတွင် အဝတ်ပါးလေးဖြင့် မျက်နှာဖုံးတမ်း ကစားနည်းလေးများ ထည့်သွင်း ကစားပေးပါ။',
        'Work short peek-a-boo moments into everyday routines like dressing and playtime.',
      ),
    }),
    'Peekaboo as an early marker of object permanence and turn-taking is described in the AAP Power of Play guidance and WHO Care for Child Development materials in the registry.',
  ),
];

// --- Guides ----------------------------------------------------------------

const GUIDES: SeedItem[] = [
  kb(
    guide('7_9m', 'fine_motor', {
      title: b('၇ – ၉ လ — လက်ချောင်းငယ် လှုပ်ရှားမှု လမ်းညွှန်', '7–9 months — Fine motor guide'),
      why: b(
        'ဤအရွယ်တွင် လက်သည် စူးစမ်းရေး ကိရိယာ ဖြစ်လာသည်။ လက်ဝါးတစ်ခုလုံးဖြင့် ဆွဲယူရာမှ လက်မနှင့် လက်ညှိုးဖြင့် ညှပ်ယူခြင်းသို့ တဖြည်းဖြည်း ကူးပြောင်းပြီး၊ ပစ္စည်းနှစ်ခုကို ရိုက်ခတ်ခြင်း၊ ပါးစပ်ထဲ ထည့်ကြည့်ခြင်းဖြင့် ပုံသဏ္ဌာန်နှင့် အသွင်အပြင်ကို လေ့လာသည်။ ပါးစပ်ဖြင့် စမ်းသပ်ခြင်းသည် ပုံမှန်ဖြစ်သော်လည်း ဘေးကင်းရေး စည်းကမ်း တင်းကျပ်စွာ လိုအပ်သည်။',
        'Hands become exploring tools now. A whole-hand rake slowly becomes a thumb-and-finger pinch, and banging two objects together or mouthing them is how she studies shape and texture. Mouthing is normal, but it is exactly why the safety rules here are strict.',
      ),
      observationQuestions: [
        b('ပစ္စည်းငယ်ကို လက်ချောင်းဖြင့် ဆွဲယူပါသလား။', 'Does she rake small objects towards her with her fingers?'),
        b('လက်တစ်ဖက်မှ တစ်ဖက်သို့ ပြောင်းကိုင်ပါသလား။', 'Does she pass things from hand to hand?'),
        b('ပစ္စည်းနှစ်ခုကို ရိုက်ခတ်ပါသလား။', 'Does she bang two objects together?'),
        b('လက်နှစ်ဖက်စလုံးကို အတူတူ သုံးပါသလား။', 'Does she use both hands about equally?'),
      ],
      dailyActivities: [
        b('ထိုင်နေစဉ် ကိုင်ရလွယ်သော ကစားစရာ နှစ်ခု ပေးထားပါ။', 'Offer two easy-to-hold toys while she sits.'),
        b('အစာစားချိန်တွင် ပျော့သော အစာတုံးများ ကိုယ်တိုင် ကောက်စားခွင့် ပေးပါ။', 'Let her pick up soft finger foods herself at mealtimes.'),
        b('ပလတ်စတစ်ခွက်၊ ဇွန်း ကဲ့သို့ အိမ်သုံးပစ္စည်း လုံခြုံသည်များကို စမ်းကိုင်စေပါ။', 'Let her handle safe household items such as a plastic cup or spoon.'),
      ],
      weeklyActivities: [
        b('အသွင်အပြင် မတူသော ပစ္စည်း သုံးမျိုးကို ခြင်းတောင်းထဲ ထည့်၍ စမ်းစေပါ။', 'Put three different textures in a basket for her to explore.'),
        b('ဗူးခွံထဲ ပစ္စည်း ထည့်ခြင်း၊ ပြန်ထုတ်ခြင်း ကစားနည်း လုပ်ပါ။', 'Play putting things into a container and taking them out again.'),
      ],
      indoor: [
        b('စက္ကူ သို့မဟုတ် အဝတ်စ လေးလံမှုကို လက်ဖြင့် စမ်းစေခြင်း။', 'Letting her squeeze paper or cloth.'),
        b('ဇွန်းနှစ်ချောင်း ရိုက်ခတ်၍ အသံထွက်စေခြင်း။', 'Banging two spoons together to make a sound.'),
      ],
      outdoor: [
        b('သစ်ရွက် သို့မဟုတ် အပင်ကို ကြီးကြပ်မှုဖြင့် ထိစမ်းစေခြင်း (ပါးစပ်ထဲ မထည့်စေရ)။', 'Touching a leaf or plant under close supervision, never into the mouth.'),
      ],
      lowCost: [
        b('ဇွန်း၊ ပလတ်စတစ်ခွက်၊ အဝတ်စ — အိမ်တွင်း ပစ္စည်းများသည် အကောင်းဆုံး ကစားစရာ ဖြစ်သည်။', 'Spoons, plastic cups and cloths are excellent toys.'),
        b('ကစားစရာ ဝယ်ရန် မလိုပါ — လုံခြုံမှုသာ အဓိက ဖြစ်သည်။', 'Nothing needs to be bought — safety is what matters.'),
      ],
      materials: b('ကြီးမားပြီး လုံခြုံသော အိမ်သုံးပစ္စည်းများ — ဇွန်း၊ ခွက်၊ အဝတ်စ', 'Large safe household items — spoons, cups, cloths'),
      safety: b(
        'ကလေး၏ ပါးစပ်ထဲ ဝင်နိုင်သော ပစ္စည်းမှန်သမျှကို အလှမ်းမမီအောင် ထားပါ — ဒင်္ဂါးပြား၊ ကြယ်သီး၊ အခွံမာသီး၊ ခလုတ်ဘက်ထရီ။ ခလုတ်ဘက်ထရီသည် အလွန် အန္တရာယ်များပြီး မျိုမိပါက ချက်ချင်း ဆေးရုံသို့ သွားရမည်။ ကြိုးရှည်၊ ပလတ်စတစ်အိတ်၊ ပူဖောင်းများကို ဝေးဝေး ထားပါ။ ကလေးအား တစ်ယောက်တည်း ကစားခွင့် မပြုပါနှင့်။ ကစားစရာများကို သန့်ရှင်းအောင် ထားပါ။',
        'Keep away anything small enough to fit in her mouth — coins, buttons, nuts, button batteries. A swallowed button battery is a medical emergency and needs hospital care immediately. Keep long cords, plastic bags and balloons well away. Never leave her to play alone. Keep toys clean.',
      ),
      commonMistakes: [
        b('ပါးစပ်ထဲ ထည့်တိုင်း တားမြစ်ခြင်း — ဤသည် သင်ယူမှု ဖြစ်သည်၊ ပစ္စည်းကိုသာ လုံခြုံအောင် ရွေးပါ။', 'Stopping all mouthing — it is learning; choose safe objects instead.'),
        b('ကစားစရာ အများကြီး တစ်ပြိုင်နက် ပေးခြင်း — နှစ်ခုသာ လုံလောက်သည်။', 'Offering many toys at once — two is enough.'),
      ],
      parentTips: [
        b('ကလေးရှေ့တွင် ပစ္စည်းကို အနည်းငယ် ဝေးဝေး ချထားပါ — လှမ်းရန် အားပေးသည်။', 'Place a toy just out of reach to invite her to stretch.'),
        b('ကလေး ကိုယ်တိုင် ရအောင် ခဏ စောင့်ပေးပါ — အမြဲ မကူညီပါနှင့်။', 'Wait a moment before helping so she can succeed herself.'),
      ],
      faq: [
        {
          q: b('ပစ္စည်းတိုင်းကို ပါးစပ်ထဲ ထည့်တာ ပုံမှန်လား။', 'Is it normal that she puts everything in her mouth?'),
          a: b('ပုံမှန် ဖြစ်ပါသည်။ ပါးစပ်သည် ဤအရွယ်တွင် အထိအတွေ့ အသိဆုံး နေရာ ဖြစ်သည်။ လုပ်ရမည်မှာ ပါးစပ်ထဲ ဝင်နိုင်သော ပစ္စည်းငယ်များကို ဖယ်ရှားထားခြင်း ဖြစ်သည်။', 'Yes. The mouth is her most sensitive tool right now. The task is to remove small objects, not to stop the mouthing.'),
        },
        {
          q: b('လက်တစ်ဖက်ကို ပိုသုံးရင် ပြဿနာလား။', 'She seems to prefer one hand — is that a problem?'),
          a: b('တစ်ခါတစ်ရံ တစ်ဖက်ကို ပိုသုံးခြင်း ဖြစ်နိုင်သော်လည်း၊ တစ်ဖက်တည်းကိုသာ အမြဲ သုံးပြီး ကျန်တစ်ဖက်ကို လုံးဝ မသုံးလျှင် ကျန်းမာရေးဝန်ထမ်းအား ပြသင့်သည်။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ပါ။', 'Some preference can happen, but consistently using one hand and never the other is worth checking. This is not a diagnosis.'),
        },
      ],
      redFlags: [
        b('လက်တစ်ဖက်ကို လုံးဝ မသုံးခြင်း။', 'One hand never used at all.'),
        b('ပစ္စည်းကို လုံးဝ မဆွဲယူခြင်း၊ မကိုင်နိုင်ခြင်း။', 'No reaching for or holding objects at all.'),
        b('လက်များ အမြဲ ဆုပ်တောင့်နေခြင်း။', 'Hands that stay tightly fisted all the time.'),
      ],
      referral: b(
        'ဤလက္ခဏာများကို ကျန်းမာရေးဝန်ထမ်းအား ပြသပါ။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ဘဲ စစ်ဆေးရန် အချက်ပြခြင်းသာ ဖြစ်သည်။',
        'Raise these with a health worker. This is a prompt to check, not a diagnosis.',
      ),
      encouragement: b(
        'ကလေး၏ လက်များသည် နေ့စဉ် ပိုမို ကျွမ်းကျင်လာနေပါသည် — ကစားချိန်တိုင်းသည် လေ့ကျင့်ချိန် ဖြစ်သည်။',
        'Her hands get more skilful every day — every play session is practice.',
      ),
    }),
    'The rake-to-pincer hand-skill sequence and two-handed play at 7–9 months follow CDC milestone checklists, AAP milestone guidance and AAP guidance on the power of play, with the hand-development detail from the paediatric occupational-therapy references and the choking precautions from the Bright Futures preventive-care schedule.',
  ),
  kb(
    guide('7_9m', 'speech', {
      title: b('၇ – ၉ လ — စကားသံ ထွက်ဆိုမှု လမ်းညွှန်', '7–9 months — Speech guide'),
      why: b(
        'ဤအရွယ်တွင် ကလေးသည် ဗျည်းသံများကို ထပ်ခါထပ်ခါ ပေါင်းစပ်၍ "ဘဘဘ"၊ "ဒဒဒ" ကဲ့သို့ အသံ အစဉ်လိုက် ထွက်လာသည်။ "မာမာ"၊ "ဒါဒါ" ဟု ဆိုသော်လည်း လူကို ရည်ညွှန်း၍ မဟုတ်သေးဘဲ အသံ လေ့ကျင့်နေခြင်းသာ ဖြစ်သည်။ မိဘက ပြန်လည် တုံ့ပြန်ပေးလေ ကလေး၏ အသံ လေ့ကျင့်မှု များလေ ဖြစ်သည်။',
        'She now repeats consonant strings such as "bababa" and "dadada". "Mama" and "dada" may appear without yet naming a person — she is practising sounds. The more you answer, the more she practises.',
      ),
      observationQuestions: [
        b('ဗျည်းသံ အစဉ်လိုက် ထွက်ပါသလား။', 'Does she produce strings of consonant sounds?'),
        b('သင် ပြန်ဆိုပေးလျှင် ထပ်ဆိုပါသလား။', 'Does she repeat a sound back when you copy her?'),
        b('အသံအမျိုးမျိုး (ကျယ်၊ တိုး) ဖြင့် ကစားပါသလား။', 'Does she play with loud and quiet sounds?'),
        b('နောက်ကွယ်မှ အသံကို လှည့်ကြည့်ပါသလား။', 'Does she turn towards a sound behind her?'),
      ],
      dailyActivities: [
        b('ကလေး၏ အသံကို အတိအကျ ပြန်ဆိုပေးပြီး တုံ့ပြန်ရန် စောင့်ပါ။', 'Copy her sound exactly, then wait for her turn.'),
        b('လုပ်နေသမျှကို စကားနှင့် ပြောပြပါ ("ရေချိုးမယ်နော်")။', 'Narrate what you are doing — "we are having a bath now".'),
        b('သီချင်း တစ်ပုဒ်ကို နေ့စဉ် ထပ်ခါထပ်ခါ ဆိုပေးပါ။', 'Sing the same short song every day.'),
      ],
      weeklyActivities: [
        b('မိသားစုဝင်များ တစ်ဦးစီနှင့် စကားပြောချိန် ပေးပါ။', 'Give her talking time with different family members.'),
        b('ရိုးရှင်းသော ပုံစာအုပ် တစ်အုပ်ကို အတူ ကြည့်ပါ။', 'Look at a simple picture book together.'),
      ],
      indoor: [
        b('မှန်ရှေ့တွင် အသံထွက်၍ ကစားခြင်း။', 'Making sounds together in front of a mirror.'),
        b('တိရစ္ဆာန် အသံများ တုပ၍ ပြောပြခြင်း။', 'Copying animal sounds and naming them.'),
      ],
      outdoor: [
        b('အပြင်တွင် ကြားရသော အသံများကို နာမည်တပ်၍ ပြောပြခြင်း။', 'Naming the sounds you hear outdoors.'),
      ],
      lowCost: [
        b('သီချင်းနှင့် စကားပြောခြင်းသည် အခမဲ့ဖြစ်ပြီး အထိရောက်ဆုံး ဖြစ်သည်။', 'Singing and talking cost nothing and work best.'),
        b('ကစားစရာ မလိုဘဲ သင်၏ အသံသာ လိုသည်။', 'No toy is needed — only your voice.'),
      ],
      materials: b('မလိုအပ်ပါ — သင်၏ အသံနှင့် ပုံစာအုပ် တစ်အုပ်', 'Nothing needed — your voice and one picture book'),
      safety: b(
        'ဤအရွယ်တွင် ဖန်သားပြင် ကြည့်ခြင်းကို အကြံမပြုပါ — မိသားစုနှင့် ဗီဒီယိုခေါ်ဆိုခြင်းသာ ခြွင်းချက် ဖြစ်သည်။ အသံ အလွန်ကျယ်သော ကစားစရာများသည် နားကို ထိခိုက်နိုင်သည်။ ပါးစပ်ထဲ ဝင်နိုင်သော ပစ္စည်းငယ်များကို ကစားစရာအဖြစ် မသုံးပါနှင့်။',
        'Screens are not recommended at this age; a family video call is the exception. Very loud toys can harm hearing. Never use small objects that fit in the mouth as toys.',
      ),
      commonMistakes: [
        b('ကလေး၏ အသံကို ပြင်ဆင်ပေးရန် ကြိုးစားခြင်း — ဤအရွယ်တွင် မလိုအပ်ပါ။', 'Correcting her sounds — that is not needed at this age.'),
        b('ကလေး ပြန်တုံ့ပြန်ရန် အချိန် မပေးဘဲ ဆက်ပြောနေခြင်း။', 'Talking on without leaving a gap for her turn.'),
      ],
      parentTips: [
        b('စကားပြောပြီးတိုင်း ငါးစက္ကန့် စောင့်ပေးပါ — ကလေးက တုံ့ပြန်ရန် အချိန် လိုသည်။', 'Wait about five seconds after you speak — she needs time to answer.'),
        b('မိခင်ဘာသာစကားဖြင့် ပြောပါ — အသိဆုံး ဘာသာစကားက အကောင်းဆုံး ဖြစ်သည်။', 'Speak your own language — the one you know best is the best one.'),
      ],
      faq: [
        {
          q: b('"မာမာ" လို့ ခေါ်တာ ကျွန်မကို ခေါ်တာလား။', 'When she says "mama", does she mean me?'),
          a: b('အစပိုင်းတွင် အသံ လေ့ကျင့်နေခြင်းသာ ဖြစ်တတ်ပြီး၊ များသောအားဖြင့် ၁၂ လဝန်းကျင်မှသာ လူကို ရည်ညွှန်း၍ ခေါ်လာသည်။ နှစ်မျိုးစလုံး ပုံမှန် ဖြစ်သည်။', 'At first it is usually sound practice; naming a person more often comes around 12 months. Both are normal.'),
        },
        {
          q: b('ဘာသာစကား နှစ်မျိုး ပြောရင် စကားနောက်ကျမလား။', 'Will two languages delay her speech?'),
          a: b('မဖြစ်ပါ။ ဘာသာစကား နှစ်မျိုး ကြားရခြင်းသည် စကားပြော နောက်ကျစေသည် ဟူသော အထောက်အထား မရှိပါ။', 'No. There is no evidence that hearing two languages delays speech.'),
        },
      ],
      redFlags: [
        b('လ ၉ လအရွယ်တွင် ဗျည်းသံ လုံးဝ မထွက်ခြင်း။', 'No consonant sounds at all by 9 months.'),
        b('အသံဆူညံမှုကို လုံးဝ မတုံ့ပြန်ခြင်း။', 'No reaction to sound at all.'),
        b('ယခင်က ထွက်ခဲ့သော အသံများ ရပ်တန့်သွားခြင်း။', 'Loss of sounds she used to make.'),
      ],
      referral: b(
        'ဤလက္ခဏာများကို ကျန်းမာရေးဝန်ထမ်းအား ပြသပါ — အကြားအာရုံ စစ်ဆေးမှု လိုအပ်နိုင်သည်။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ပါ။',
        'Raise these with a health worker; a hearing check may be suggested. This is not a diagnosis.',
      ),
      encouragement: b(
        'ကလေး၏ မြည်တွန်သံတိုင်းသည် စကားပြောရန် လေ့ကျင့်နေခြင်း ဖြစ်သည် — သင် နားထောင်ပေးခြင်းက အရေးအကြီးဆုံး ဖြစ်သည်။',
        'Every babble is practice for talking — your listening is the most important part.',
      ),
    }),
    'Repeated consonant babble, vocal turn-taking and the value of adult response at 7–9 months follow CDC and AAP milestone guidance and NHS learn-to-talk advice, with the sound-development detail from the speech-language pathology references in the registry.',
  ),
];

const GUIDES_B: SeedItem[] = [
  kb(
    guide('7_9m', 'language', {
      title: b('၇ – ၉ လ — ဘာသာစကား နားလည်မှု လမ်းညွှန်', '7–9 months — Language guide'),
      why: b(
        'နားလည်မှုသည် ပြောဆိုမှုထက် အမြဲ စောပါသည်။ ဤအရွယ်တွင် ကလေးသည် နာမည်၊ "မလုပ်နဲ့"၊ မိသားစုဝင် အမည်များ ကဲ့သို့ အသုံးများသော စကားလုံးအချို့ကို မှတ်မိလာပြီး၊ မိဘ၏ လေသံနှင့် လက်ဟန်ခြေဟန်များကိုလည်း ဖတ်တတ်လာသည်။ ကလေးအား နေ့စဉ် စကားပြောပေးမှုသည် နောင်တွင် စကားပြောနိုင်မှုကို အထောက်အကူ ပြုသည်။',
        'Understanding always comes before talking. She now recognises a few familiar words — her name, "no", family names — and reads your tone and gestures too. Everyday talk is what feeds later speech.',
      ),
      observationQuestions: [
        b('နာမည်ခေါ်လျှင် လှည့်ကြည့်ပါသလား။', 'Does she turn when her name is called?'),
        b('"မလုပ်နဲ့" ဟု ပြောလျှင် ခဏ ရပ်ကြည့်ပါသလား။', 'Does she pause when you say "no"?'),
        b('အသိမျက်နှာ၏ အသံကို မှတ်မိပါသလား။', 'Does she recognise a familiar voice?'),
        b('လက်ညှိုးထိုးပြလျှင် ထိုနေရာကို လိုက်ကြည့်ပါသလား။', 'Does she follow where you point?'),
      ],
      dailyActivities: [
        b('ပစ္စည်းများကို ကိုင်ပြ၍ နာမည်တပ် ပြောပြပါ။', 'Hold up objects and name them.'),
        b('နေ့စဉ် လုပ်ငန်းများကို ပြောပြပါ ("အဝတ်လဲမယ်")။', 'Say what is happening — "time to change your clothes".'),
        b('နာမည်ခေါ်ပြီး တုံ့ပြန်လျှင် ပြုံးပြပါ။', 'Call her name and smile when she responds.'),
      ],
      weeklyActivities: [
        b('ပုံစာအုပ် တစ်အုပ်ကို ထပ်ခါထပ်ခါ အတူ ကြည့်ပါ။', 'Share the same picture book repeatedly.'),
        b('မိသားစုဝင်များ၏ ဓာတ်ပုံများကို ပြပြီး နာမည် ပြောပြပါ။', 'Show family photos and name the people.'),
      ],
      indoor: [
        b('အိမ်တွင်း ပစ္စည်းများကို လိုက်ပြ၍ နာမည်တပ်ခြင်း။', 'Naming things around the house.'),
        b('"ဘယ်မှာလဲ" ဟု မေးပြီး အတူ ရှာခြင်း။', 'Asking "where is it?" and finding it together.'),
      ],
      outdoor: [
        b('အပြင်တွင် တွေ့သမျှကို လက်ညှိုးထိုးပြ၍ နာမည် ပြောပြခြင်း။', 'Pointing at and naming what you see outside.'),
      ],
      lowCost: [
        b('စကားပြောခြင်းသည် အခမဲ့ဖြစ်ပြီး ဘာသာစကား၏ အခြေခံ ဖြစ်သည်။', 'Talking is free and is the foundation of language.'),
        b('အိမ်တွင်း ပစ္စည်းများသည် စကားလုံး သင်ကြားရေး ကိရိယာ ဖြစ်သည်။', 'Household objects are language teaching tools.'),
      ],
      materials: b('မလိုအပ်ပါ — သင်၏ အသံ၊ အိမ်တွင်း ပစ္စည်းများနှင့် ပုံစာအုပ်', 'Nothing needed — your voice, household objects and a picture book'),
      safety: b(
        'ဖန်သားပြင်ဖြင့် ဘာသာစကား သင်ကြားခြင်းကို ဤအရွယ်တွင် အကြံမပြုပါ — မျက်နှာချင်းဆိုင် စကားပြောခြင်းကသာ အထိရောက်ဆုံး ဖြစ်သည်။ ပုံစာအုပ်၏ စာမျက်နှာများကို ကလေး ဆုတ်၍ ပါးစပ်ထဲ ထည့်နိုင်သဖြင့် ကြီးကြပ်ပေးပါ။ ပါးစပ်ထဲ ဝင်နိုင်သော ပစ္စည်းငယ်များကို နာမည်တပ်ရန် မသုံးပါနှင့်။',
        'Screens are not recommended for language learning at this age — face-to-face talk works best. Supervise book time, as pages can be torn and mouthed. Do not use small objects that fit in the mouth as naming props.',
      ),
      commonMistakes: [
        b('ကလေး စကားမပြောသေးလို့ စကားပြောပေးရန် လျှော့ချခြင်း။', 'Talking less because she cannot talk back yet.'),
        b('စကားလုံး အများကြီး တစ်ပြိုင်နက် သင်ပေးရန် ကြိုးစားခြင်း။', 'Trying to teach many words at once.'),
      ],
      parentTips: [
        b('စကားလုံး တစ်လုံးကို တစ်ပတ်လုံး ထပ်ခါထပ်ခါ သုံးပါ။', 'Use the same word again and again for a whole week.'),
        b('ကလေး ကြည့်နေသော အရာကို နာမည်တပ်ပါ — အာရုံစိုက်နေချိန်က အကောင်းဆုံး ဖြစ်သည်။', 'Name what she is already looking at — her attention is already there.'),
      ],
      faq: [
        {
          q: b('ကလေး စကားနားလည်လား မလည်လား ဘယ်လို သိမလဲ။', 'How do I know if she understands me?'),
          a: b('နာမည်ခေါ်လျှင် လှည့်ကြည့်ခြင်း၊ အသုံးများသော စကားလုံးများကို တုံ့ပြန်ခြင်း၊ လက်ညှိုးထိုးပြရာ လိုက်ကြည့်ခြင်းတို့သည် နားလည်မှု၏ လက္ခဏာများ ဖြစ်သည်။', 'Turning to her name, reacting to familiar words and following your point are all signs of understanding.'),
        },
        {
          q: b('တီဗီဖွင့်ထားရင် ဘာသာစကား တိုးတက်မလား။', 'Will having the TV on help her language?'),
          a: b('မကူညီပါ။ ဤအရွယ်တွင် ဘာသာစကားသည် လူနှင့် အပြန်အလှန် ဆက်ဆံမှုမှသာ တိုးတက်ပါသည်။ နောက်ခံအသံသည် စကားပြောခြင်းကို အနှောင့်အယှက် ဖြစ်စေနိုင်သည်။', 'No. At this age language grows through interaction with people; background sound can actually get in the way of conversation.'),
        },
      ],
      redFlags: [
        b('လ ၉ လအရွယ်တွင် နာမည်ခေါ်လျှင် လုံးဝ မလှည့်ခြင်း။', 'No turning to her name by 9 months.'),
        b('အသံကို လုံးဝ မတုံ့ပြန်ခြင်း။', 'No response to sound at all.'),
        b('မိသားစုနှင့် အပြန်အလှန် ဆက်ဆံမှု လုံးဝ မရှိခြင်း။', 'No back-and-forth interaction with family at all.'),
      ],
      referral: b(
        'ဤလက္ခဏာများကို ကျန်းမာရေးဝန်ထမ်းအား ပြသပါ — အကြားအာရုံ စစ်ဆေးမှု လိုအပ်နိုင်သည်။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ပါ။',
        'Raise these with a health worker; a hearing check may be suggested. This is not a diagnosis.',
      ),
      encouragement: b(
        'သင် ပြောသမျှ စကားလုံးတိုင်းသည် ကလေး၏ ဘာသာစကား အုတ်မြစ် ဖြစ်ပါသည်။',
        'Every word you say is a brick in her language foundation.',
      ),
    }),
    'Early word comprehension, response to name and the value of adult talk at 7–9 months follow CDC milestone guidance, AAP developmental-surveillance guidance and NHS learn-to-talk advice, with the conversational-turns research and standard language-development references in the registry.',
  ),
  kb(
    guide('7_9m', 'communication', {
      title: b('၇ – ၉ လ — ဆက်သွယ်ပြောဆိုမှု လမ်းညွှန်', '7–9 months — Communication guide'),
      why: b(
        'ဤအရွယ်တွင် ကလေးသည် စကားလုံး မသုံးဘဲ ရည်ရွယ်ချက်ဖြင့် ဆက်သွယ်တတ်လာသည် — လိုချင်သည့်ဘက်သို့ လက်လှမ်းခြင်း၊ မိဘမျက်နှာကို ကြည့်ပြီး ပစ္စည်းကို ပြန်ကြည့်ခြင်း၊ လက်ကို မြှောက်ပြခြင်း တို့ဖြင့် ဖြစ်သည်။ ဤအချက်ပြမှုများကို မိဘက စကားဖြင့် ပြန်ပြောပေးခြင်းသည် ဆက်သွယ်မှု စွမ်းရည်ကို အခိုင်မာဆုံး တည်ဆောက်ပေးသည်။',
        'She now communicates on purpose without words — reaching for what she wants, looking from your face to an object and back, lifting her arms to be picked up. Putting those signals into words is what builds communication most strongly.',
      ),
      observationQuestions: [
        b('လိုချင်သည့် ပစ္စည်းဘက်သို့ လက်လှမ်းပါသလား။', 'Does she reach towards what she wants?'),
        b('သင့်မျက်နှာနှင့် ပစ္စည်းကို လှည့်ကြည့်ပါသလား။', 'Does she look from your face to an object and back?'),
        b('ချီစေချင်လျှင် လက်မြှောက်ပါသလား။', 'Does she lift her arms to be picked up?'),
        b('အပြန်အလှန် အသံဖလှယ်မှု ဖြစ်ပါသလား။', 'Do you get a back-and-forth exchange of sounds?'),
      ],
      dailyActivities: [
        b('ကလေး၏ အချက်ပြမှုကို စကားဖြင့် ပြန်ပြောပေးပါ ("ချီစေချင်တာလား")။', 'Put her signals into words — "you want to be picked up".'),
        b('တစ်ခုခု ပေးမည်ဆိုလျှင် နာမည်တပ်ပြီးမှ ပေးပါ။', 'Name a thing before you hand it over.'),
        b('အလှည့်ကျ ကစားနည်း (ပေး၊ ပြန်ယူ) လုပ်ပါ။', 'Play give-and-take turn-taking games.'),
      ],
      weeklyActivities: [
        b('မိသားစုဝင် တစ်ဦးစီနှင့် မျက်နှာချင်းဆိုင် ကစားချိန် ပေးပါ။', 'Give her face-to-face time with a different family member each week.'),
        b('လက်ဟန် တစ်မျိုး (နှုတ်ဆက်ခြင်း) ကို နေ့စဉ် ပြသပါ။', 'Model one gesture such as waving each day.'),
      ],
      indoor: [
        b('ဖုံးပြီး ပြန်ဖွင့်ပြသော ကစားနည်း။', 'Hide-and-show games.'),
        b('ကစားစရာကို အပြန်အလှန် ပေးယူခြင်း။', 'Passing a toy back and forth.'),
      ],
      outdoor: [
        b('အပြင်တွင် တွေ့ရသည်များကို လက်ညှိုးထိုးပြ၍ အတူကြည့်ခြင်း။', 'Pointing at things outside and looking together.'),
      ],
      lowCost: [
        b('သင်၏ မျက်နှာနှင့် လက်များသည် အကောင်းဆုံး ကိရိယာ ဖြစ်သည်။', 'Your face and hands are the best tools.'),
        b('အဝတ်စ တစ်ထည်ဖြင့် ကစားနည်း များစွာ လုပ်နိုင်သည်။', 'One cloth is enough for many games.'),
      ],
      materials: b('မလိုအပ်ပါ — သင်၏ မျက်နှာ၊ အသံနှင့် အဝတ်စ တစ်ထည်', 'Nothing needed — your face, your voice and a cloth'),
      safety: b(
        'မျက်နှာဖုံးရန် သုံးသော အဝတ်ကို ကလေးမျက်နှာပေါ် ချန်မထားပါနှင့် — အသက်ရှူ ပိတ်နိုင်သည်။ ဤအရွယ်တွင် ဖန်သားပြင် ကြည့်ခြင်းကို အကြံမပြုပါ၊ မိသားစုနှင့် ဗီဒီယိုခေါ်ဆိုခြင်းသာ ခြွင်းချက် ဖြစ်သည်။ ကလေးကို ဆွဲငင်၍ မကစားပါနှင့်။ ကလေးအား လုံးဝ မလှုပ်ရှားနိုင်အောင် မဖိထားပါနှင့်။',
        'Never leave a cloth lying over her face — it can block breathing. Screens are not recommended at this age; a family video call is the exception. Never play by jerking or pulling her, and never hold her down so she cannot move.',
      ),
      commonMistakes: [
        b('ကလေး မတောင်းဆိုမီ အားလုံး ကြိုပေးထားခြင်း — တောင်းဆိုရန် အခွင့်အရေး ဆုံးရှုံးစေသည်။', 'Giving everything before she asks — she loses the chance to communicate.'),
        b('ကလေး မျက်နှာလွှဲသော်လည်း ဆက်လက် ကစားရန် တိုက်တွန်းခြင်း။', 'Pushing on with play when she has turned away.'),
      ],
      parentTips: [
        b('ခဏ စောင့်ပေးပါ — ကလေးက ဆက်သွယ်ရန် နေရာ လိုအပ်သည်။', 'Pause and wait — she needs space to communicate.'),
        b('လက်ဟန်ကို စကားနှင့် တွဲသုံးပါ။', 'Pair your gestures with your words.'),
      ],
      faq: [
        {
          q: b('ကလေးက လက်ညှိုးမထိုးသေးရင် စိုးရိမ်ရမလား။', 'She does not point yet — should I worry?'),
          a: b('လက်ညှိုးထိုးခြင်းသည် များသောအားဖြင့် ၉ လမှ ၁၂ လကြားတွင် ပေါ်လာသည်။ ၉ လအရွယ်တွင် မထိုးသေးသော်လည်း အခြား ဆက်သွယ်မှုများ (လှမ်းခြင်း၊ ကြည့်ခြင်း) ရှိလျှင် စောင့်ကြည့်နိုင်သည်။ ၁၂ လတွင် လက်ဟန် လုံးဝ မရှိလျှင် ကျန်းမာရေးဝန်ထမ်းအား ပြပါ။', 'Pointing usually appears between 9 and 12 months. If she is not pointing at 9 months but is reaching and looking, you can keep watching. No gestures at all by 12 months is worth checking.'),
        },
        {
          q: b('ငိုတိုင်း ချီပေးရင် အလိုလိုက်လွန်းသွားမလား။', 'If I pick her up every time she cries, will I spoil her?'),
          a: b('မဖြစ်ပါ။ ဤအရွယ်တွင် ငိုခြင်းသည် ဆက်သွယ်ခြင်း ဖြစ်သည်။ တုံ့ပြန်ပေးခြင်းက ကလေးကို ပိုမို လုံခြုံစိတ်ချစေသည်။', 'No. At this age crying is communication. Responding helps her feel secure.'),
        },
      ],
      redFlags: [
        b('မျက်လုံးချင်း လုံးဝ မဆုံခြင်း။', 'No eye contact at all.'),
        b('လိုချင်သည်ကို မည်သည့်နည်းနှင့်မျှ မပြခြင်း။', 'No way at all of showing what she wants.'),
        b('ယခင်က ရှိခဲ့သော ပြုံးခြင်း၊ ဆက်သွယ်မှုများ ဆုံးရှုံးသွားခြင်း။', 'Loss of smiling or contact she used to have.'),
      ],
      referral: b(
        'ဤလက္ခဏာများကို ကျန်းမာရေးဝန်ထမ်းအား ပြသပါ။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ဘဲ စစ်ဆေးရန် အချက်ပြခြင်းသာ ဖြစ်သည်။',
        'Raise these with a health worker. This is a prompt to check, not a diagnosis.',
      ),
      encouragement: b(
        'ကလေးက စကားမပြောနိုင်သေးသော်လည်း သင့်ကို နေ့စဉ် စကားပြောနေပါသည် — ကြည့်လိုက်ရုံသာ လိုပါသည်။',
        'She talks to you every day without words — you only have to look.',
      ),
    }),
    'Reading and answering a baby’s intentional signals at 7–9 months follows the WHO Care for Child Development approach, CDC milestone guidance and NHS learn-to-talk advice, with the conversational-turns research in the registry and AAP media guidance for the screen advice.',
  ),
];

const GUIDES_C: SeedItem[] = [
  kb(
    guide('7_9m', 'cognitive', {
      title: b('၇ – ၉ လ — အသိဉာဏ် ဖွံ့ဖြိုးမှု လမ်းညွှန်', '7–9 months — Cognitive guide'),
      why: b(
        'ဤအရွယ်တွင် ကလေးသည် "မမြင်ရသော်လည်း ရှိနေသေးသည်" ဟူသော အသိကို စတင် ရရှိလာသည်။ ထို့ကြောင့် ဖုံးပြီး ပြန်ရှာသော ကစားနည်းများကို အလွန် ကြိုက်နှစ်သက်သည်။ ပစ္စည်းကို ချ၍ ဘာဖြစ်သည်ကို ကြည့်ခြင်း၊ ထပ်ခါထပ်ခါ လုပ်ကြည့်ခြင်းသည် အကြောင်းနှင့် အကျိုးကို လေ့လာနေခြင်း ဖြစ်သည်။',
        'She is starting to grasp that things still exist when hidden, which is why hide-and-find delights her. Dropping something to see what happens, again and again, is her studying cause and effect.',
      ),
      observationQuestions: [
        b('ဖုံးထားသော ပစ္စည်းကို လှန်ရှာပါသလား။', 'Does she uncover a hidden toy?'),
        b('ပစ္စည်းကို ချ၍ ကျသွားသည်ကို လိုက်ကြည့်ပါသလား။', 'Does she drop things and watch them fall?'),
        b('ကစားစရာ တစ်ခုကို ကြာကြာ စူးစမ်းပါသလား။', 'Does she explore one toy for a while?'),
        b('အသစ်တွေ့လျှင် စိတ်ဝင်စားမှု ပြသပါသလား။', 'Does she show interest in something new?'),
      ],
      dailyActivities: [
        b('ကစားစရာကို အဝတ်ဖြင့် ဖုံး၍ ရှာစေပါ။', 'Cover a toy with a cloth and let her find it.'),
        b('ဗူးထဲသို့ ပစ္စည်း ထည့်ခြင်း၊ ပြန်ထုတ်ခြင်း ကစားပါ။', 'Play putting things in and out of a container.'),
        b('ကလေး ချလိုက်သော ပစ္စည်းကို ပြန်ပေးပြီး ကစားပါ။', 'Hand back what she drops and make it a game.'),
      ],
      weeklyActivities: [
        b('ကစားစရာ အသစ် တစ်ခုကို သီတင်းပတ်တိုင်း မိတ်ဆက်ပါ (လုံခြုံသော အိမ်တွင်း ပစ္စည်းလည်း ရသည်)။', 'Introduce one new safe object each week — a household item works.'),
        b('အသံထွက်သော ပစ္စည်းများဖြင့် အကြောင်း-အကျိုး ကစားနည်း လုပ်ပါ။', 'Play cause-and-effect games with things that make a sound.'),
      ],
      indoor: [
        b('ခွက်အောက်တွင် ပစ္စည်း ဖုံး၍ ရှာစေခြင်း။', 'Hiding an object under a cup to find.'),
        b('ဇွန်းဖြင့် ခွက်ကို ရိုက်၍ အသံထွက်စေခြင်း။', 'Tapping a cup with a spoon to make sound.'),
      ],
      outdoor: [
        b('အပြင်တွင် လှုပ်ရှားနေသည်များ (ငှက်၊ ကား) ကို အတူ လိုက်ကြည့်ခြင်း။', 'Watching moving things outside — birds, vehicles — together.'),
      ],
      lowCost: [
        b('ဗူးခွံ၊ ခွက်၊ အဝတ်စ တို့ဖြင့် အကောင်းဆုံး ကစားနည်းများ ရသည်။', 'Containers, cups and cloths make the best games.'),
        b('ကစားစရာ ဝယ်ရန် မလိုပါ — ထပ်ခါထပ်ခါ ကစားခွင့်ကသာ အရေးကြီးသည်။', 'Nothing needs buying — repetition is what matters.'),
      ],
      materials: b('ခွက်၊ ဗူးခွံ၊ အဝတ်စ၊ ဇွန်း', 'A cup, a container, a cloth, a spoon'),
      safety: b(
        'ပါးစပ်ထဲ ဝင်နိုင်သော ပစ္စည်းငယ်များကို လုံးဝ မသုံးပါနှင့် — ဒင်္ဂါးပြား၊ ကြယ်သီး၊ အခွံမာသီး၊ ခလုတ်ဘက်ထရီ။ ပလတ်စတစ်အိတ်နှင့် ပူဖောင်းများကို ဝေးဝေးထားပါ။ ကလေးအား တစ်ယောက်တည်း ကစားခွင့် မပြုပါနှင့်။ ဤအရွယ်တွင် ဖန်သားပြင် ကြည့်ခြင်းကို အကြံမပြုပါ — အိပ်ချိန်နှင့် ကစားချိန်ကို လျော့နည်းစေနိုင်သည်။',
        'Never use objects small enough to fit in her mouth — coins, buttons, nuts, button batteries. Keep plastic bags and balloons well away. Never leave her playing alone. Screens are not recommended at this age; they can displace sleep and active play.',
      ),
      commonMistakes: [
        b('ကစားစရာ အများကြီး တစ်ပြိုင်နက် ချပေးခြင်း — အာရုံပျံ့လွင့်စေသည်။', 'Putting out many toys at once, which scatters her attention.'),
        b('ထပ်ခါထပ်ခါ ကစားခြင်းကို ငြီးငွေ့စရာဟု ထင်ခြင်း — ထပ်ခါထပ်ခါ လုပ်ခြင်းသည် သင်ယူနည်း ဖြစ်သည်။', 'Thinking repetition is boring — repetition is how she learns.'),
      ],
      parentTips: [
        b('ကလေး စိတ်ဝင်စားနေသည်ကို လိုက်လုပ်ပါ — သင် ရွေးပေးရန် မလိုပါ။', 'Follow her interest rather than choosing for her.'),
        b('တစ်ခုကို ပြီးအောင် စူးစမ်းခွင့် ပေးပါ။', 'Let her finish exploring one thing.'),
      ],
      faq: [
        {
          q: b('ပစ္စည်းကို ချပစ်တာ အကြိမ်ကြိမ် လုပ်တာ ဆိုးတာလား။', 'She keeps dropping things on purpose — is that naughty?'),
          a: b('မဆိုးပါ။ ချလိုက်လျှင် ဘာဖြစ်သည်ကို လေ့လာနေခြင်း ဖြစ်ပြီး အသိဉာဏ် ဖွံ့ဖြိုးမှု၏ ပုံမှန် အပိုင်း ဖြစ်သည်။', 'Not at all. She is learning what happens when she lets go — a normal part of thinking development.'),
        },
        {
          q: b('ပညာပေး ဗီဒီယိုတွေက ဦးနှောက် ဖွံ့ဖြိုးမှုကို ကူညီလား။', 'Do educational videos help her brain?'),
          a: b('ဤအရွယ်တွင် ဖန်သားပြင်အကြောင်းအရာအများစုမှ သင်ယူနိုင်မှုမှာ အကန့်အသတ်ရှိပါသည်။ လက်တွေ့ ကစားခြင်းနှင့် လူနှင့် တိုက်ရိုက် အပြန်အလှန်ဆက်သွယ်ခြင်းကို ဦးစားပေးပါ။ လူကြီးတစ်ဦးက ကလေး ပါဝင်နိုင်အောင် ကူညီပေးသည့် မိသားစုနှင့် တိုက်ရိုက် ဗီဒီယိုခေါ်ဆိုမှုမှာ အပြန်အလှန်ဆက်သွယ်မှု ဖြစ်နိုင်ပါသည်။', 'Learning from most screen media is limited at this age. Prioritize hands-on play and live interaction with people. A live family video call can be interactive when an adult helps the baby take part.'),
        },
      ],
      redFlags: [
        b('ပတ်ဝန်းကျင်ကို လုံးဝ စိတ်မဝင်စားခြင်း။', 'No interest in surroundings at all.'),
        b('ကစားစရာကို လိုက်မကြည့်ခြင်း၊ မလှမ်းခြင်း။', 'Not following or reaching for a toy.'),
        b('ယခင်က တတ်ခဲ့သော ကျွမ်းကျင်မှုများ ဆုံးရှုံးသွားခြင်း။', 'Loss of skills she used to have.'),
      ],
      referral: b(
        'ဤလက္ခဏာများကို ကျန်းမာရေးဝန်ထမ်းအား ပြသပါ။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ဘဲ စစ်ဆေးရန် အချက်ပြခြင်းသာ ဖြစ်သည်။',
        'Raise these with a health worker. This is a prompt to check, not a diagnosis.',
      ),
      encouragement: b(
        'ကလေး၏ ကစားခြင်းတိုင်းသည် စမ်းသပ်ချက် တစ်ခု ဖြစ်ပါသည် — သင်သည် သူ၏ ပထမဆုံး ဆရာ ဖြစ်သည်။',
        'Every game she plays is an experiment — and you are her first teacher.',
      ),
    }),
    'Object permanence, cause-and-effect play and repetition at 7–9 months follow CDC milestone checklists, AAP milestone guidance, AAP guidance on the power of play and standard developmental-behavioural paediatrics references; the screen advice follows AAP media guidance and WHO physical activity and sleep guidance for under-5s.',
  ),
  kb(
    guide('7_9m', 'social', {
      title: b('၇ – ၉ လ — လူမှုဆက်ဆံရေး လမ်းညွှန်', '7–9 months — Social guide'),
      why: b(
        'ဤအရွယ်တွင် ကလေးသည် အသိမျက်နှာနှင့် အသစ်ကို ရှင်းရှင်းလင်းလင်း ခွဲခြားတတ်ပြီဖြစ်ရာ၊ မိဘ ခွာသွားလျှင် ငိုခြင်း၊ အသိမဟုတ်သူကို တွန့်ဆုတ်ခြင်းများ ဖြစ်လာသည်။ ၎င်းသည် ပြဿနာ မဟုတ်ဘဲ ကျန်းမာသော တွယ်တာမှု၏ လက္ခဏာ ဖြစ်သည်။ ငြိမ်းချမ်းစွာ တုံ့ပြန်ပေးခြင်းက ကလေးအား လုံခြုံမှု ခံစားစေသည်။',
        'She now clearly tells familiar people from strangers, so she may cry when you leave and hold back from new faces. This is not a problem — it is a sign of healthy attachment. Calm, predictable responses help her feel safe.',
      ),
      observationQuestions: [
        b('အသိမျက်နှာကို မြင်လျှင် ပြုံးပါသလား။', 'Does she smile at familiar faces?'),
        b('မိဘ ခွာသွားလျှင် တုံ့ပြန်မှု ရှိပါသလား။', 'Does she react when you leave the room?'),
        b('အခြားလူများနှင့် ကစားရန် စိတ်ဝင်စားပါသလား။', 'Is she interested in playing with other people?'),
        b('ငိုပြီးနောက် သင် ချီလျှင် ငြိမ်သွားပါသလား။', 'Does she settle when you pick her up?'),
      ],
      dailyActivities: [
        b('သွားမည်ဆိုလျှင် နှုတ်ဆက်ပြီးမှ သွားပါ — တိတ်တဆိတ် မထွက်သွားပါနှင့်။', 'Always say goodbye before you go — do not slip away silently.'),
        b('ပြန်လာလျှင် ပြုံးပြ၍ နှုတ်ဆက်ပါ။', 'Greet her warmly when you return.'),
        b('မျက်နှာချင်းဆိုင် ကစားချိန် နေ့စဉ် ပေးပါ။', 'Give her face-to-face play every day.'),
      ],
      weeklyActivities: [
        b('အသိမိသားစုဝင်များနှင့် တဖြည်းဖြည်း မိတ်ဆက်ပေးပါ။', 'Introduce familiar relatives gradually.'),
        b('အခြားကလေးများနှင့် နီးကပ်စွာ ကစားခွင့် ပေးပါ (အတူတူ ကစားရန် မလိုသေးပါ)။', 'Let her be near other children — playing together is not expected yet.'),
      ],
      indoor: [
        b('ဖုံးပြီး ပြန်ဖွင့်ပြသော ကစားနည်း။', 'Peek-a-boo games.'),
        b('မှန်ရှေ့တွင် အတူ ပြုံးပြခြင်း။', 'Smiling together in front of a mirror.'),
      ],
      outdoor: [
        b('အိမ်နီးချင်းများကို အဝေးမှ ကြည့်ရင်း နှုတ်ဆက်ခြင်း။', 'Greeting neighbours from a comfortable distance.'),
      ],
      lowCost: [
        b('လူမှုဆက်ဆံရေးအတွက် ကစားစရာ မလိုပါ — လူသာ လိုသည်။', 'Social skills need people, not toys.'),
        b('မိသားစု အစားစားချိန်သည် အကောင်းဆုံး လူမှုကစားချိန် ဖြစ်သည်။', 'Family mealtimes are excellent social time.'),
      ],
      materials: b('မလိုအပ်ပါ — မိသားစုဝင်များနှင့် အချိန်', 'Nothing needed — time with family'),
      safety: b(
        'ကလေးအား အတင်းအကျပ် အသိမဟုတ်သူထံ မအပ်ပါနှင့် — တဖြည်းဖြည်း မိတ်ဆက်ပေးပါ။ ကလေးကို ကြောက်စေသော နည်းဖြင့် နောက်ပြောင်ခြင်း မပြုပါနှင့်။ ကလေးအား လုံးဝ မလှုပ်ရှားနိုင်အောင် မဖိထားပါနှင့်။ မည်သည့်အခြေအနေတွင်မျှ ကလေးကို မလှုပ်ခါပါနှင့် — ဦးနှောက် ထိခိုက်နိုင်သည်။ ကလေးကို တစ်ယောက်တည်း ထားခဲ့ခြင်း မပြုပါနှင့်။',
        'Never force her into a stranger’s arms — introduce people gradually. Never tease her in ways that frighten her. Never hold her down so she cannot move. Never shake a baby under any circumstances — it can cause brain injury. Never leave her unattended.',
      ),
      commonMistakes: [
        b('ခွဲခွာမှု စိုးရိမ်ခြင်းကို "အလိုလိုက်လွန်းလို့" ဟု ထင်ခြင်း။', 'Treating separation anxiety as a sign of spoiling.'),
        b('တိတ်တဆိတ် ထွက်သွားခြင်း — ကလေး၏ ယုံကြည်မှုကို လျော့နည်းစေသည်။', 'Sneaking away, which weakens her trust.'),
      ],
      parentTips: [
        b('နှုတ်ဆက်ခြင်းကို တိုတိုနှင့် ငြိမ်းချမ်းစွာ လုပ်ပါ။', 'Keep goodbyes short and calm.'),
        b('တူညီသော ပုံစံဖြင့် အမြဲ နှုတ်ဆက်ပါ — ခန့်မှန်းနိုင်မှုက စိတ်သက်သာစေသည်။', 'Use the same goodbye routine every time — predictability soothes.'),
      ],
      faq: [
        {
          q: b('ကလေးက ကျွန်မကိုပဲ လိုချင်တယ်၊ ဒါ ပုံမှန်လား။', 'She only wants me — is that normal?'),
          a: b('ပုံမှန် ဖြစ်ပါသည်။ ၈ လမှ ၁၀ လကြားတွင် အများဆုံး ဖြစ်တတ်ပြီး တဖြည်းဖြည်း လျော့သွားပါသည်။ အခြားသူများနှင့် တဖြည်းဖြည်း အချိန်ပေးခြင်းက ကူညီသည်။', 'Yes. It usually peaks between 8 and 10 months and eases over time. Gradual time with other trusted people helps.'),
        },
        {
          q: b('ကလေးထိန်း အပ်ရင် ထိခိုက်မလား။', 'Will using a childminder harm her?'),
          a: b('တစ်ဦးတည်းသော ဂရုစိုက်သူ တည်တံ့ပြီး ငြိမ်းချမ်းစွာ ဆက်ဆံပါက ကလေးသည် ထိုသူနှင့်လည်း တွယ်တာမှု တည်ဆောက်နိုင်ပါသည်။ ရုတ်တရက် အပြောင်းအလဲများကို ရှောင်ပါ။', 'If the carer is consistent and warm, she can form a bond with them too. Avoid sudden changes where you can.'),
        },
      ],
      redFlags: [
        b('မည်သူ့ကိုမျှ အထူး မတွယ်တာခြင်း။', 'No particular attachment to anyone.'),
        b('မိဘအား လုံးဝ မပြုံးပြခြင်း၊ တုံ့ပြန်မှု မရှိခြင်း။', 'No smiling at or responding to a parent at all.'),
        b('ယခင်က ရှိခဲ့သော လူမှုဆက်ဆံမှုများ ဆုံးရှုံးသွားခြင်း။', 'Loss of social contact she used to have.'),
      ],
      referral: b(
        'ဤလက္ခဏာများကို ကျန်းမာရေးဝန်ထမ်းအား ပြသပါ။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ဘဲ စစ်ဆေးရန် အချက်ပြခြင်းသာ ဖြစ်သည်။',
        'Raise these with a health worker. This is a prompt to check, not a diagnosis.',
      ),
      encouragement: b(
        'ကလေးက သင့်ကို ရှာနေခြင်းသည် သင် အရေးကြီးကြောင်း သက်သေ ဖြစ်ပါသည်။',
        'Her looking for you is proof of how much you matter.',
      ),
    }),
    'Familiar-versus-unfamiliar discrimination and separation anxiety at 7–9 months follow CDC and AAP milestone guidance, the WHO/UNICEF nurturing care framework, NICE social and emotional wellbeing guidance and AAP guidance on the power of play.',
  ),
  kb(
    guide('7_9m', 'emotional', {
      title: b('၇ – ၉ လ — စိတ်ခံစားမှု လမ်းညွှန်', '7–9 months — Emotional guide'),
      why: b(
        'ဤအရွယ်တွင် ကလေး၏ ခံစားမှုများသည် ပိုမို ရှင်းလင်းလာသည် — ပျော်ရွှင်ခြင်း၊ ကြောက်ရွံ့ခြင်း၊ စိတ်ပျက်ခြင်းတို့ကို မျက်နှာနှင့် အသံဖြင့် ပြသည်။ ကလေးသည် ကိုယ်တိုင် စိတ်ကို ငြိမ်းအောင် မလုပ်နိုင်သေးဘဲ လူကြီး၏ ငြိမ်းချမ်းမှုကို မှီခိုသည်။ မိဘ၏ စိတ်ကျန်းမာရေးသည် ဤနေရာတွင် အလွန် အရေးကြီးသည်။',
        'Her feelings are clearer now — delight, fear and frustration all show on her face and in her voice. She cannot calm herself yet and borrows calm from adults, which is why your own wellbeing matters so much here.',
      ),
      observationQuestions: [
        b('စိတ်ဆိုးလျှင် သင် ငြိမ်းအောင် လုပ်ပေးနိုင်ပါသလား။', 'Can you settle her when she is upset?'),
        b('ပျော်ရွှင်ချိန်တွင် ရယ်မောပါသလား။', 'Does she laugh when she is happy?'),
        b('အသစ်တွေ့လျှင် သင့်မျက်နှာကို ကြည့်ပါသလား။', 'Does she look at your face when something new happens?'),
        b('သင် ကိုယ်တိုင် အနားယူချိန် ရပါသလား။', 'Are you getting any rest yourself?'),
      ],
      dailyActivities: [
        b('ကလေး၏ ခံစားမှုကို စကားဖြင့် နာမည်တပ်ပေးပါ ("ကြောက်သွားတာလား")။', 'Name her feeling out loud — "that surprised you, didn’t it".'),
        b('ငိုလျှင် လျင်မြန်စွာ တုံ့ပြန်ပေးပါ။', 'Respond promptly when she cries.'),
        b('တည်ငြိမ်သော လေသံဖြင့် စကားပြောပါ။', 'Speak in a steady, calm voice.'),
      ],
      weeklyActivities: [
        b('မိဘ ကိုယ်တိုင် အနားယူချိန် တစ်ခု စီစဉ်ပါ။', 'Plan one rest for yourself each week.'),
        b('ယုံကြည်ရသူ တစ်ဦးနှင့် ခံစားချက်ကို ပြောပြပါ။', 'Talk to someone you trust about how you are doing.'),
      ],
      indoor: [
        b('ဖက်ထားခြင်း၊ သီချင်းဆိုပေးခြင်းဖြင့် ငြိမ်းအောင် လုပ်ခြင်း။', 'Calming with a cuddle and a song.'),
        b('တည်ငြိမ်သော အလင်းရောင်ဖြင့် ငြိမ်သက်သော ကစားချိန်။', 'Quiet play in soft light.'),
      ],
      outdoor: [
        b('အပြင်တွင် လမ်းလျှောက်ခြင်းသည် မိဘနှင့် ကလေး နှစ်ဦးစလုံးကို သက်သာစေသည်။', 'A walk outside helps both of you.'),
      ],
      lowCost: [
        b('ဖက်ထားခြင်းသည် အခမဲ့ဖြစ်ပြီး အထိရောက်ဆုံး ဖြစ်သည်။', 'A cuddle is free and works best.'),
        b('မိသားစု အကူအညီသည် အဖိုးတန်ဆုံး အရင်းအမြစ် ဖြစ်သည်။', 'Family support is the most valuable resource there is.'),
      ],
      materials: b('မလိုအပ်ပါ', 'Nothing needed'),
      safety: b(
        'ကလေး ငိုသံကြောင့် စိတ်မထိန်းနိုင်တော့လျှင် ကလေးကို လုံခြုံသော နေရာ (ကလေးအိပ်ရာ) တွင် ပက်လက် ချထားပြီး ခဏ ခွာ၍ အသက်ရှူပါ — ထို့နောက် ပြန်လာပါ။ မည်သည့်အခြေအနေတွင်မျှ ကလေးကို မလှုပ်ခါပါနှင့် — ဦးနှောက်နှင့် မျက်လုံး ထိခိုက်ပြီး သေဆုံးနိုင်သည်။ မိဘသည် စိတ်မကြည်ခြင်း သို့မဟုတ် စိတ်ကျနေခြင်း ရှိပါက ကျန်းမာရေးဝန်ထမ်းနှင့် ဆွေးနွေးပါ။',
        'If crying becomes overwhelming, put her down on her back in a safe place such as her cot, step away and breathe, then come back. Never shake a baby under any circumstances — it can cause brain and eye injury and death. If you have signs of low mood, speak to a health worker.',
      ),
      commonMistakes: [
        b('မိဘ ကိုယ်တိုင်၏ ခံစားမှုကို လျစ်လျူရှုခြင်း။', 'Ignoring your own feelings.'),
        b('ကလေး၏ ငိုသံကို "ဆိုးလို့" ဟု အဓိပ္ပာယ် ကောက်ခြင်း။', 'Reading her crying as bad behaviour.'),
      ],
      parentTips: [
        b('သင် ငြိမ်းချမ်းလျှင် ကလေးလည်း ငြိမ်းချမ်းသည်။', 'When you are calm, she borrows that calm.'),
        b('အကူအညီ တောင်းခြင်းသည် အားနည်းချက် မဟုတ်ပါ။', 'Asking for help is not a weakness.'),
      ],
      faq: [
        {
          q: b('ကလေးက ညဘက် ခဏခဏ နိုးပြီး ငိုတယ် — စိတ်ပိုင်းဆိုင်ရာ ပြဿနာလား။', 'She wakes and cries at night — is something wrong emotionally?'),
          a: b('ဤအရွယ်တွင် ညအိပ် နိုးခြင်းသည် ပုံမှန် ဖြစ်ပြီး ခွဲခွာမှု စိုးရိမ်ခြင်းနှင့်လည်း ဆက်စပ်နိုင်သည်။ ငြိမ်းချမ်းစွာ တုံ့ပြန်ပေးပါ။ အစာ မစားနိုင်ခြင်း၊ ဖျားခြင်းများ ပါလျှင် ကျန်းမာရေးဝန်ထမ်းအား ပြပါ။', 'Night waking is normal at this age and can be linked to separation anxiety. Respond calmly. If she is also not feeding or is feverish, see a health worker.'),
        },
        {
          q: b('မိခင်ဖြစ်သူ စိတ်မကြည်ခြင်း သို့မဟုတ် စိတ်ကျနေခြင်း ရှိလျှင် ကလေးကို ထိခိုက်မလား။', 'If a mother feels low, does it affect the baby?'),
          a: b('မိဘ၏ စိတ်ကျန်းမာရေးသည် ကလေး၏ ဖွံ့ဖြိုးမှုနှင့် ဆက်စပ်နေပါသည်။ ထို့ကြောင့် အကူအညီ ရယူခြင်းသည် ကလေးအတွက်လည်း အကျိုးရှိပါသည်။ ဤသည် အပြစ်တင်ခြင်း မဟုတ်ပါ။', 'Parental wellbeing is linked to child development, so getting support helps your baby too. This is not about blame.'),
        },
        { q: b("ဘယ်အပူချိန် ရောက်ရင် ဆေးရုံ သွားရမလဲ။", "What temperature means we should seek care?"), a: b("အပူချိန် တိုင်းပါ။ အသက် ၃ လအောက် ကလေး ၃၈°C (၁၀၀.၄°F) နှင့်အထက် ဖျားပါက — ကလေး ပုံမှန်လို ထင်ရလျှင်ပင် ချက်ချင်း ပြသပါ။ အသက် ၃ လမှ ၆ လကြား ၃၉°C (၁၀၂.၂°F) နှင့်အထက် ဖျားပါက အမြန် ပြသပါ။ အသက် ၆ လကျော်လျှင် အပူချိန် ကိန်းဂဏန်းတစ်ခုတည်းက အဖြေ မပေးပါ — ကလေး၏ ပုံစံနှင့် အပြုအမူကို ကြည့်ပါ။ ဖျားချိန် ၅ ရက်နှင့်အထက် ကြာလျှင်၊ ရေ/နို့ မသောက်နိုင်လျှင် သို့မဟုတ် ပုံမှန်လို တုံ့ပြန်မှု မရှိတော့လျှင် ပြသပါ။ အသက်မရွေး — ဖျားခြင်းနှင့်အတူ အသက်ရှူခက်ခြင်း၊ နှိပ်လျှင် မပျောက်သော အနီစက်၊ လည်ပင်း တောင့်တင်းခြင်း သို့မဟုတ် နိုးရခက်ခြင်း ပါလာပါက ချက်ချင်း ပြသပါ။ အပူချိန်တိုင်းကိရိယာ မရှိပါက — ကလေး ပူနေပြီး အထက်ပါ လက္ခဏာများ ပါလျှင် မစောင့်ဘဲ ပြသပါ။", "Take the temperature. Under 3 months, 38°C (100.4°F) or above: seek care straight away, even if the baby otherwise seems well. Between 3 and 6 months, 39°C (102.2°F) or above: seek care promptly. Over 6 months, the number alone does not decide — go by how she looks and behaves. Seek advice if the fever lasts 5 days or more, if she will not drink, or if she is much less responsive than usual. At any age, fever together with difficulty breathing, a rash that does not fade under pressure, a stiff neck, or being hard to wake: seek care immediately. If you have no thermometer, and the child feels hot and has any of those signs, do not wait.") },
      ],
      redFlags: [
        b('ကလေးအား မည်သည့်နည်းနှင့်မျှ ငြိမ်းအောင် မလုပ်နိုင်ခြင်း။', 'She cannot be comforted by anything.'),
        b('မိဘတွင် ကိုယ့်ကိုယ်ကို သို့မဟုတ် ကလေးကို ထိခိုက်စေလိုသော အတွေး ရှိခြင်း။', 'Thoughts of harming yourself or the baby.'),
        b('ကလေး၏ တုံ့ပြန်မှုများ ရုတ်တရက် ပျောက်ကွယ်သွားခြင်း။', 'A sudden loss of her usual responses.'),
      ],
      referral: b(
        'ကိုယ့်ကိုယ်ကို သို့မဟုတ် ကလေးကို ထိခိုက်စေလိုသော အတွေး ရှိပါက ချက်ချင်း အကူအညီ ရယူပါ။ အခြား လက္ခဏာများကို ကျန်းမာရေးဝန်ထမ်းအား ပြပါ။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ပါ။',
        'If you have thoughts of harming yourself or your baby, seek help immediately. Raise the other signs with a health worker. This is not a diagnosis.',
      ),
      encouragement: b(
        'ကလေးကို ဂရုစိုက်ရင်း ကိုယ့်ကိုယ်ကိုလည်း ဂရုစိုက်ခြင်းသည် တာဝန်ကျေမှု ဖြစ်သည်။',
        'Caring for yourself while caring for her is part of doing this well.',
      ),
    }),
    'The link between responsive caregiving, parental mental health and early emotional development follows AAP guidance on toxic stress, the WHO/UNICEF nurturing care framework, NICE postnatal care guidance, NICE social and emotional wellbeing guidance and standard paediatric references in the registry.',
  ),
];

const GUIDES_D: SeedItem[] = [
  kb(
    guide('7_9m', 'nutrition', {
      title: b('၇ – ၉ လ — အာဟာရ လမ်းညွှန်', '7–9 months — Nutrition guide'),
      why: b(
        'ဤအရွယ်တွင် အစားအစာသည် နို့ကို ဖြည့်စွက်ပေးရန် ဖြစ်ပြီး အစားထိုးရန် မဟုတ်ပါ။ ကမ္ဘာ့ကျန်းမာရေးအဖွဲ့က ၆ လမှ ၈ လအရွယ်တွင် တစ်နေ့လျှင် အစာ နှစ်နပ်မှ သုံးနပ်၊ ၉ လမှ စ၍ သုံးနပ်နှင့် အကြားစာ တစ်နပ်မှ နှစ်နပ် အကြံပြုပြီး နှစ်နှစ်နှင့် အထက်ထိ နို့တိုက်ရန် ဖြစ်သည်။ ဤကာလတွင် သံဓာတ် လိုအပ်ချက် မြင့်တက်လာသဖြင့် သံဓာတ်ကြွယ်ဝသော အစာများ လိုအပ်သည်။',
        'Food complements milk now; it does not replace it. WHO guidance is two to three meals a day at 6–8 months and three meals plus one or two snacks from 9 months, alongside breastfeeding into the second year and beyond. Iron needs rise sharply, so iron-rich foods matter.',
      ),
      observationQuestions: [
        b('တစ်နေ့လျှင် အစာ ဘယ်နှစ်နပ် စားပါသလဲ။', 'How many meals a day is she eating?'),
        b('သံဓာတ်ပါသော အစာ (အသားညက်၊ ကြက်ဥ၊ ပဲ၊ အသည်း) ပါဝင်ပါသလား။', 'Do her meals include iron-rich foods — minced meat, egg, beans, liver?'),
        b('အစာ ပျစ်ခဲမှုကို တဖြည်းဖြည်း တိုးပေးနေပါသလား။', 'Are you slowly increasing the thickness and texture?'),
        b('စားနေစဉ် ကလေးက ကျေနပ်မှု ပြသပါသလား။', 'Does she seem content during meals?'),
      ],
      dailyActivities: [
        b('တစ်နေ့ နှစ်နပ်မှ သုံးနပ် အစာကို မိသားစုနှင့်အတူ ကျွေးပါ။', 'Offer two to three meals a day, with the family where you can.'),
        b('သံဓာတ်ကြွယ်ဝသော အစာ တစ်မျိုး နေ့စဉ် ထည့်ပေးပါ။', 'Include one iron-rich food every day.'),
        b('နို့တိုက်ခြင်းကို ဆက်လက် လုပ်ပါ။', 'Continue breastfeeding.'),
      ],
      weeklyActivities: [
        b('အစားအစာ အသစ် တစ်မျိုးကို သီတင်းပတ်တိုင်း မိတ်ဆက်ပါ။', 'Introduce one new food each week.'),
        b('အရောင်စုံ ဟင်းသီးဟင်းရွက်နှင့် အသီးများကို လှည့်၍ ပေးပါ။', 'Rotate different coloured vegetables and fruits.'),
      ],
      indoor: [
        b('မိသားစုနှင့်အတူ ထမင်းစားခြင်း — ကလေးက ကြည့်ပြီး သင်ယူသည်။', 'Eating together as a family so she learns by watching.'),
        b('ပျော့သော အစာတုံးများကို ကိုယ်တိုင် ကောက်စားခွင့် ပေးခြင်း။', 'Letting her pick up soft finger foods herself.'),
      ],
      outdoor: [
        b('စျေးသို့ အတူသွား၍ အစားအစာများကို နာမည်တပ်ပြခြင်း။', 'Naming foods together at the market.'),
      ],
      lowCost: [
        b('ဒေသထွက် ပဲ၊ ကြက်ဥ၊ အစိမ်းရောင် ဟင်းရွက်များသည် စျေးသက်သာပြီး အာဟာရ ကြွယ်ဝသည်။', 'Local beans, eggs and dark green leaves are cheap and nutritious.'),
        b('မိသားစု ဟင်းကို ဆားမထည့်မီ ခွဲယူ၍ ညက်အောင် ချေပေးနိုင်သည်။', 'Take the baby’s portion from the family pot before salt is added and mash it.'),
      ],
      materials: b('ဇွန်း၊ ခွက်၊ သန့်ရှင်းသော ပန်းကန်', 'A spoon, a cup and a clean bowl'),
      safety: b(
        'တစ်နှစ်အောက် ကလေးကို ပျားရည် လုံးဝ မကျွေးပါနှင့်။ ဆား၊ သကြား ထပ်မထည့်ပါနှင့်။ လည်ချောင်း ပိတ်စေနိုင်သော အစာများ — အခွံမာသီးလုံး၊ စပျစ်သီးလုံး၊ မာသော အသီးအရွက် တုံးများ — ကို ရှောင်ပါ။ စားနေစဉ် ကလေးအား ထိုင်စေပြီး အမြဲ ကြီးကြပ်ပါ။ နို့ဗူးကို မထောက်ထားပါနှင့်။ အစားအစာနှင့် လက်များကို သန့်ရှင်းအောင် ထားပါ။ ရေကို ကျိုချက်ပြီးမှ တိုက်ပါ။',
        'Never give honey under 12 months. Do not add salt or sugar. Avoid choking foods — whole nuts, whole grapes, hard chunks. Always seat her upright and supervise every meal. Never prop a bottle. Keep food and hands clean, and boil drinking water.',
      ),
      commonMistakes: [
        b('အစာကို နို့နှင့် အစားထိုးခြင်း — နို့ကို ဆက်တိုက်ရမည်။', 'Replacing milk with food — milk continues.'),
        b('အစာ အရည်ဖျော့လွန်းစွာ ပေးခြင်း — အာဟာရ လျော့နည်းစေသည်။', 'Making food too watery, which lowers its nutrition.'),
        b('ကလေး ငြင်းလျှင် အတင်းကျွေးခြင်း။', 'Forcing food when she refuses.'),
      ],
      parentTips: [
        b('အစားအစာ အသစ်ကို ၈ ကြိမ်မှ ၁၀ ကြိမ်အထိ ပြန်ပေးကြည့်ရတတ်သည်။', 'A new food may need eight to ten tries.'),
        b('ကလေးက စားချင်စိတ် ရှိမရှိ အချက်ပြမှုကို လိုက်နာပါ။', 'Follow her hunger and fullness cues.'),
      ],
      faq: [
        {
          q: b('နို့ရည် လျော့သွားမလား စိုးရိမ်တယ်။', 'Will my milk supply drop if she eats food?'),
          a: b('အစာစပြီးနောက်တွင်လည်း ဆက်လက် နို့တိုက်ပါက နို့ရည် ဆက်ထွက်ပါသည်။ အစာမတိုင်မီ သို့မဟုတ် အစာပြီးနောက် နို့တိုက်နိုင်ပါသည်။', 'If you keep breastfeeding, supply continues. You can feed before or after meals.'),
        },
        {
          q: b('နွားနို့ တိုက်လို့ ရပြီလား။', 'Can she drink cow’s milk now?'),
          a: b('နွားနို့ကို အဓိက သောက်စရာအဖြစ် တစ်နှစ်မပြည့်မီ မတိုက်သင့်ပါ။ သို့သော် ဟင်းချက်ရာတွင် အနည်းငယ် ထည့်နိုင်ပါသည်။', 'Cow’s milk should not be her main drink before 12 months, though small amounts in cooking are fine.'),
        },
        {
          q: b('ဓာတ်မတည့်တတ်သော အစားအစာများကို ရှောင်သင့်သလား။', 'Should I avoid foods that commonly cause allergy?'),
          a: b('ရှောင်ရန် မလိုပါ။ ဥ၊ ငါး၊ ချောမွေ့အောင် ဖျော်ထားသော မြေပဲထောပတ်နှင့် နို့ထွက်ပစ္စည်းများကို ခြောက်လခန့်မှစ၍ တစ်မျိုးချင်း အနည်းငယ်စီ စတင်ပေးနိုင်ပါသည်။ အစားအစာအသစ် တစ်မျိုးနှင့်တစ်မျိုးကြား ၃ ရက်မှ ၅ ရက် စောင့်ကြည့်ပါ။ အရေပြားယားယံခြင်း၊ အဖုအပိန့်ထွက်ခြင်း သို့မဟုတ် အော့အန်ခြင်း ဖြစ်ပါက ဆက်မပေးဘဲ ကျန်းမာရေးဝန်ထမ်းနှင့် တိုင်ပင်ပါ။ နှုတ်ခမ်း သို့မဟုတ် မျက်နှာရောင်ခြင်း၊ အသက်ရှူခက်ခြင်း ဖြစ်ပါက အရေးပေါ် ဆေးကုသမှု ချက်ချင်းခံယူပါ။ ကလေးတွင် ပြင်းထန်သော အရေပြားရောင်ရမ်းနာ သို့မဟုတ် ဥနှင့် ဓာတ်မတည့်မှု ရှိပါက မြေပဲမစတင်မီ ဆရာဝန်နှင့် တိုင်ပင်ပါ။ သိရှိထားသော အစားအစာဓာတ်မတည့်မှု သို့မဟုတ် ယခင်က တုံ့ပြန်မှုရှိပါက ထိုအစားအစာကို ဘေးကင်းစွာ မိတ်ဆက်ပုံကို ဆရာဝန်အား မေးမြန်းပါ။', 'There is no need to avoid them. Egg, fish, smooth peanut paste and dairy can be introduced from around six months, one at a time and in small amounts. Wait 3 to 5 days between each new food. If you see a rash, hives or vomiting, stop and talk to a health worker. If the lips or face swell or breathing becomes difficult, seek emergency care immediately. If your child has severe eczema or egg allergy, talk with a doctor before introducing peanut. If your child has a known food allergy or has previously reacted to a food, ask a doctor how to introduce that food safely.'),
        },
      ],
      redFlags: [
        b('အစာ လုံးဝ ငြင်းပယ်ခြင်း၊ မျိုချရ ခက်ခဲခြင်း။', 'Refusing all food or difficulty swallowing.'),
        b('စားတိုင်း ချောင်းဆိုးခြင်း၊ လည်ချောင်း ပိတ်ခြင်း။', 'Coughing or choking at every meal.'),
        b('ကိုယ်အလေးချိန် မတက်ခြင်း သို့မဟုတ် ကျဆင်းခြင်း။', 'Weight that is not increasing, or falling.'),
        b('ဝမ်းလျှောခြင်း၊ အန်ခြင်း ဆက်တိုက် ဖြစ်ခြင်း။', 'Ongoing diarrhoea or vomiting.'),
      ],
      referral: b(
        'ဤလက္ခဏာများကို ကျန်းမာရေးဝန်ထမ်းအား ပြသပါ — အစာမျိုချမှု စစ်ဆေးရန် လိုအပ်နိုင်သည်။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ပါ။',
        'Raise these with a health worker; a feeding and swallowing assessment may be suggested. This is not a diagnosis.',
      ),
      encouragement: b(
        'အစားအစာ သင်ယူမှုသည် အချိန်ယူရသော ခရီး ဖြစ်သည် — တစ်နပ်စာ မအောင်မြင်လျှင်လည်း ရပါသည်။',
        'Learning to eat is a long journey — one difficult meal is not a failure.',
      ),
    }),
    'Meal frequency, iron-rich complementary foods and continued breastfeeding at 7–9 months follow WHO complementary feeding guidance, the WHO infant and young child feeding model chapter, the WHO/UNICEF infant and young child feeding indicators, NHS advice on first solid foods, CDC guidance on foods for 6–24 months and NICE maternal and child nutrition guidance; the swallowing red flags follow the paediatric feeding and swallowing references in the registry.',
  ),
  kb(
    guide('7_9m', 'self_help', {
      title: b('၇ – ၉ လ — ကိုယ်တိုင် လုပ်ဆောင်နိုင်မှု လမ်းညွှန်', '7–9 months — Self-help guide'),
      why: b(
        'ဤအရွယ်တွင် ကလေးသည် ကိုယ်တိုင် လုပ်ရန် စတင် ကြိုးစားလာသည် — ပျော့သော အစာတုံးများကို ကောက်စားခြင်း၊ ခွက်ကို ကိုင်ကြည့်ခြင်း၊ အဝတ်လဲစဉ် လက်ကို ဆန့်ပေးခြင်း တို့ ဖြစ်သည်။ ကိုယ်တိုင် လုပ်ခွင့် ပေးခြင်းသည် လက်ကြွက်သားများ၊ ယုံကြည်မှုနှင့် အစားအစာ လက်ခံမှုကို တစ်ပြိုင်နက် တည်ဆောက်ပေးသည်။',
        'She is starting to do things for herself — picking up soft finger foods, holding a cup, putting an arm out during dressing. Letting her try builds hand skills, confidence and food acceptance all at once.',
      ),
      observationQuestions: [
        b('ပျော့သော အစာတုံးကို ကိုယ်တိုင် ကောက်စားပါသလား။', 'Does she pick up soft finger foods herself?'),
        b('ခွက်ကို လက်နှစ်ဖက်ဖြင့် ကိုင်ကြည့်ပါသလား။', 'Does she try to hold a cup with both hands?'),
        b('အဝတ်လဲစဉ် ပူးပေါင်းပါသလား။', 'Does she help a little during dressing?'),
        b('ဇွန်းကို ကိုင်ကြည့်ပါသလား။', 'Does she try to hold a spoon?'),
      ],
      dailyActivities: [
        b('အစားစားချိန်တွင် ပျော့သော အစာတုံး အနည်းငယ် ပေးထားပါ။', 'Put a few soft finger foods on her tray at meals.'),
        b('ခွက်ဖြင့် ရေ အနည်းငယ် သောက်ရန် ကူညီပေးပါ။', 'Help her sip a little water from an open cup.'),
        b('ကလေး ကိုယ်တိုင် ကြိုးစားနေချိန် ခဏ စောင့်ပေးပါ။', 'Pause and let her try before you step in.'),
      ],
      weeklyActivities: [
        b('ဇွန်း တစ်ချောင်း ကိုင်ခွင့် ပေးပါ (မိဘက တစ်ချောင်းဖြင့် ကျွေးပါ)။', 'Give her a spoon to hold while you feed with another.'),
        b('လက်ဆေးခြင်းကို နေ့စဉ် လုပ်ရိုးလုပ်စဉ်အဖြစ် ထည့်ပါ။', 'Make handwashing part of the daily routine.'),
      ],
      indoor: [
        b('ခွက်နှင့် ဇွန်းဖြင့် ကစားခြင်း (အစားစားချိန် မဟုတ်လည်း ရသည်)။', 'Playing with a cup and spoon outside mealtimes.'),
        b('အဝတ်လဲစဉ် "လက်ထုတ်" ဟု ပြောပြီး စောင့်ပေးခြင်း။', 'Saying "arm out" during dressing and waiting.'),
      ],
      outdoor: [
        b('အပြင်တွင် ကိုယ်တိုင် ထိုင်၍ ကစားခွင့် ပေးခြင်း။', 'Letting her sit and play independently outdoors.'),
      ],
      lowCost: [
        b('သာမန် ခွက်နှင့် ဇွန်းသည် လုံလောက်ပါသည် — အထူး ပစ္စည်း မလိုပါ။', 'An ordinary cup and spoon are enough — no special equipment needed.'),
        b('ကြမ်းပြင်ပေါ် အဝတ်ဟောင်း ခင်း၍ ပက်ကျံမှုကို လွယ်ကူစွာ သန့်ရှင်းနိုင်သည်။', 'An old cloth on the floor makes mess easy to clean.'),
      ],
      materials: b('သာမန် ခွက်၊ ဇွန်း၊ အဝတ်ဟောင်း', 'An ordinary cup, a spoon and an old cloth'),
      safety: b(
        'အစာစားနေစဉ် ကလေးအား ထိုင်စေပြီး အမြဲ ကြီးကြပ်ပါ — မတ်တတ်ရပ်၍ သို့မဟုတ် လမ်းလျှောက်ရင်း မစားစေပါနှင့်။ လည်ချောင်း ပိတ်စေနိုင်သော အစာများ — အခွံမာသီးလုံး၊ စပျစ်သီးလုံး၊ မာသော တုံးများ — ကို ရှောင်ပါ။ နို့ဗူးကို မထောက်ထားပါနှင့်။ ပူသော အရည်များကို ကလေး၏ အလှမ်းမမီအောင် ထားပါ — အလောင်အကျွမ်း ဖြစ်နိုင်သည်။ ခွက်ကို ဖန်ခွက် မသုံးပါနှင့်။',
        'Always seat her to eat and supervise every mouthful — never let her eat standing or moving. Avoid choking foods such as whole nuts, whole grapes and hard chunks. Never prop a bottle. Keep hot drinks out of reach — scalds happen fast. Do not use glass cups.',
      ),
      commonMistakes: [
        b('ပက်ကျံမည်ကို စိုးရိမ်၍ ကိုယ်တိုင် စားခွင့် မပေးခြင်း။', 'Not letting her try because of the mess.'),
        b('ကလေး လုပ်နိုင်သည်ကိုပင် အမြဲ လုပ်ပေးခြင်း။', 'Doing everything for her even when she could try.'),
      ],
      parentTips: [
        b('ပက်ကျံခြင်းသည် သင်ယူမှု၏ တစ်စိတ်တစ်ပိုင်း ဖြစ်သည်။', 'Mess is part of learning.'),
        b('ကလေး၏ ကြိုးစားမှုကို အသိအမှတ်ပြု ပြုံးပြပါ။', 'Smile at her effort, not just her success.'),
      ],
      faq: [
        {
          q: b('ကလေးက ဇွန်းနဲ့ မစားနိုင်သေးဘူး — နောက်ကျနေလား။', 'She cannot use a spoon yet — is she behind?'),
          a: b('မဟုတ်ပါ။ ဇွန်းဖြင့် ကိုယ်တိုင် စားနိုင်ခြင်းသည် များသောအားဖြင့် တစ်နှစ်ကျော်မှသာ ဖြစ်လာသည်။ ယခုအချိန်တွင် ကိုင်ကြည့်ရုံဖြင့် လုံလောက်ပါသည်။', 'No. Spoon feeding usually comes after 12 months. Holding one is enough for now.'),
        },
        {
          q: b('လက်နဲ့ စားခွင့်ပေးရင် သန့်ရှင်းမှု ပြဿနာ ဖြစ်မလား။', 'Is hand feeding hygienic?'),
          a: b('စားမီ ကလေး၏ လက်နှင့် သင့်လက်ကို ဆပ်ပြာဖြင့် ဆေးပါက လုံခြုံပါသည်။ အစာကို ချက်ပြုတ်ပြီး သန့်ရှင်းအောင် ထားပါ။', 'It is safe if you wash her hands and yours with soap first, and keep food cooked and clean.'),
        },
      ],
      redFlags: [
        b('အစာကို ပါးစပ်သို့ လုံးဝ မယူတတ်ခြင်း။', 'Never bringing food to her mouth at all.'),
        b('စားတိုင်း ချောင်းဆိုးခြင်း၊ လည်ချောင်း ပိတ်ခြင်း။', 'Coughing or choking at every meal.'),
        b('လက်နှစ်ဖက်ကို ညီညာစွာ မသုံးနိုင်ခြင်း။', 'Not using both hands evenly.'),
      ],
      referral: b(
        'ဤလက္ခဏာများကို ကျန်းမာရေးဝန်ထမ်းအား ပြသပါ — အစာမျိုချမှု သို့မဟုတ် လက်ကြွက်သား စစ်ဆေးမှု လိုအပ်နိုင်သည်။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ပါ။',
        'Raise these with a health worker; a feeding or hand-skill assessment may be suggested. This is not a diagnosis.',
      ),
      encouragement: b(
        'ကလေး ကိုယ်တိုင် ကြိုးစားခွင့် ပေးလိုက်တိုင်း သူ၏ ယုံကြည်မှု တစ်ဆင့် တိုးလာပါသည်။',
        'Every time you let her try, her confidence grows a step.',
      ),
    }),
    'Self-feeding, cup holding and cooperation in dressing at 7–9 months follow the paediatric occupational-therapy reference in the registry, the Bright Futures preventive-care schedule, the WHO infant and young child feeding model chapter and CDC guidance on foods for 6–24 months.',
  ),
];

const GUIDES_E: SeedItem[] = [
  kb(
    guide('7_9m', 'sleep', {
      title: b('၇ – ၉ လ — အိပ်စက်ခြင်း လမ်းညွှန်', '7–9 months — Sleep guide'),
      why: b(
        '၄ လမှ ၁၁ လအရွယ်တွင် တစ်ရက်လျှင် စုစုပေါင်း ၁၂ နာရီမှ ၁၆ နာရီ (နေ့ခင်း အိပ်ချိန် အပါအဝင်) အိပ်ရန် အကြံပြုထားသည်။ ဤအရွယ်တွင် ခွဲခွာမှု စိုးရိမ်ခြင်းကြောင့် ညအိပ် နိုးခြင်း ပြန်များလာတတ်ပြီး ၎င်းသည် ပုံမှန် ဖြစ်သည်။ တည်ငြိမ်ပြီး ခန့်မှန်းနိုင်သော အိပ်ရာဝင် လုပ်ရိုးလုပ်စဉ်သည် အထောက်အကူ ပြုသည်။',
        'Between 4 and 11 months, 12 to 16 hours of sleep a day including naps is what guidance suggests. Night waking often increases again at this age because of separation anxiety, and that is normal. A calm, predictable bedtime routine helps.',
      ),
      observationQuestions: [
        b('တစ်ရက်လျှင် စုစုပေါင်း ဘယ်နှစ်နာရီ အိပ်ပါသလဲ။', 'How many hours does she sleep in total each day?'),
        b('အိပ်ရာဝင် လုပ်ရိုးလုပ်စဉ် တူညီပါသလား။', 'Is her bedtime routine the same each night?'),
        b('အိပ်ရာသည် မာပြီး ပြားနေပါသလား၊ အပေါ်တွင် ပစ္စည်း မရှိပါသလား။', 'Is her sleep surface firm, flat and clear?'),
        b('မိဘများ လုံလောက်စွာ အနားရပါသလား။', 'Are the adults getting enough rest?'),
      ],
      dailyActivities: [
        b('ညတိုင်း အချိန်တူတွင် အိပ်ရာဝင် လုပ်ရိုးလုပ်စဉ် လုပ်ပါ (ရေချိုး၊ စာဖတ်၊ သီချင်း)။', 'Follow the same bedtime routine at the same time — bath, book, song.'),
        b('နေ့ခင်းတွင် အလင်းရောင်နှင့် လှုပ်ရှားမှု ပေးပါ။', 'Give her daylight and active play during the day.'),
        b('အိပ်ချိန် နီးလျှင် ငြိမ်သက်သော ကစားချိန်သို့ ကူးပြောင်းပါ။', 'Move to quiet play as bedtime approaches.'),
      ],
      weeklyActivities: [
        b('အိပ်ချိန်များကို မှတ်တမ်းတင်၍ ပုံစံကို ကြည့်ပါ။', 'Keep a simple sleep log and look for the pattern.'),
        b('အိပ်ရာနေရာ၏ လုံခြုံမှုကို ပြန်စစ်ပါ။', 'Re-check the safety of her sleep space each week.'),
      ],
      indoor: [
        b('အိပ်ရာမဝင်မီ တိုတောင်းသော ပုံပြင် သို့မဟုတ် သီချင်း။', 'A short story or song before bed.'),
        b('အလင်းရောင် လျှော့ချ၍ ငြိမ်သက်သော ပတ်ဝန်းကျင် ဖန်တီးခြင်း။', 'Dimming the light to create calm.'),
      ],
      outdoor: [
        b('နေ့လယ်ပိုင်းတွင် အပြင်ထွက်ခြင်းသည် ညအိပ်ချိန်ကို ကူညီသည်။', 'Time outdoors in the day supports night sleep.'),
      ],
      lowCost: [
        b('တူညီသော အိပ်ရာဝင်လုပ်ရိုးလုပ်စဉ်သည် အခမဲ့ဖြစ်ပြီး အထောက်အကူပြုနိုင်သည်။', 'A consistent bedtime routine is free and may help.'),
        b('ဘေးကင်းရေးစံနှုန်းနှင့် ကိုက်ညီသော ကလေးအိပ်ရာ၊ မာပြီး ပြားညီသော မွေ့ရာနှင့် တင်းကျပ်စွာ ခင်းထားသော အိပ်ရာခင်းတစ်ထည်သာ အသုံးပြုပါ။', 'Use an infant sleep space that meets safety standards, with a firm, flat mattress and only a fitted sheet.'),
      ],
      materials: b('မာပြီး ပြားညီသော ကလေးအိပ်ရာနှင့် တင်းကျပ်စွာ ခင်းထားသော အိပ်ရာခင်းတစ်ထည်သာ', 'A firm, flat infant sleep surface with only a fitted sheet'),
      safety: b("အိပ်ချိန်တိုင်း ကလေးကို ပက်လက် အိပ်စေပါ — မာပြီး ပြားသော၊ အပေါ်တွင် ဘာမျှ မရှိသော နေရာတွင် ဖြစ်ရမည်။ ကလေးသည် ပက်လက်မှ မှောက်နှင့် မှောက်မှ ပက်လက် ဘက်နှစ်ဖက်စလုံး ကိုယ်တိုင် လှိမ့်နိုင်ပြီဆိုလျှင် ပြန်လှည့်ပေးရန် မလိုပါ — သို့သော် အိပ်ရာဝင်ချိန်တွင် အမြဲ ပက်လက်မှ စတင်ပါ။ အိပ်ရာထဲတွင် ခေါင်းအုံး၊ ပျော့ပျောင်းသော အရုပ်၊ လွတ်နေသော စောင်၊ အိပ်ရာခင်း၊ အဝတ် သို့မဟုတ် ကြိုး မထားပါနှင့်။ တစ်ခန်းတည်း အိပ်ပါ — အိပ်ရာတူ မအိပ်ပါနှင့်။ ဆေးလိပ်၊ အရက် သို့မဟုတ် အိပ်ဆေး သောက်ထားပါက ကလေးနှင့် အတူ လုံးဝ မအိပ်ပါနှင့်။ ဆိုဖာ သို့မဟုတ် ကုလားထိုင်ပေါ်တွင် ကလေးနှင့် အတူ မအိပ်ပါနှင့်။ ကလေး၏ မျက်နှာကို မဖုံးပါနှင့်။ ကလေး လှုပ်ရှားနိုင်ပြီ ဖြစ်၍ အိပ်ရာအနီးရှိ ကြိုးများ၊ လိုက်ကာကြိုးများကို ဖယ်ရှားပါ။ အိပ်ချိန်နှင့် ညအိပ်ချိန်တွင် နို့သီးခေါင်း ပေးကြည့်နိုင်ပါသည် — ရုတ်တရက် သေဆုံးမှု အန္တရာယ် လျော့ကျစေကြောင်း တွေ့ရှိထားပါသည်။ နို့တိုက်နေပါက နို့တိုက်ခြင်း အသားကျပြီးမှ စတင်ပေးပါ။", "Put her on her back for every sleep, on a firm flat surface with nothing on it. Once she can roll both ways on her own, you do not need to turn her back, but always start her on her back. Keep pillows, soft toys, loose blankets, bedding, cloths, and cords out of the sleep space. Room-share, do not bed-share. Never sleep with her after smoking, alcohol or sedating medicine, and never on a sofa or armchair. Never cover her face. Now that she can move, remove cords and blind pulls from near the bed. You can try offering a pacifier at nap time and bedtime — it is associated with a lower risk of SIDS. If you are breastfeeding, wait until feeding is well established before offering one."),
      commonMistakes: [
        b('နေ့ခင်း အိပ်ချိန်ကို လုံးဝ ဖြတ်၍ ညအိပ် ကောင်းစေရန် ကြိုးစားခြင်း — ပိုဆိုးစေတတ်သည်။', 'Cutting naps to improve night sleep, which usually backfires.'),
        b('အိပ်ရာထဲတွင် နူးညံ့သော ပစ္စည်းများ ထည့်ပေးခြင်း။', 'Adding soft items to the sleep space.'),
        b("အလေးချိန်ပါသော စောင်၊ အိပ်ဝတ်စုံ သို့မဟုတ် ပတ်ရစ်ပိတ်စများ သုံးခြင်း။", "Using weighted blankets, weighted sleepers or weighted swaddles."),
        b("အိမ်သုံး အသက်ရှူ/နှလုံးခုန် စောင့်ကြည့်စက်ကို ဘေးကင်းစွာ အိပ်စေခြင်း၏ အစား အားကိုးခြင်း — အန္တရာယ် လျှော့ချပေးသည်ဟု သက်သေ မရှိပါ။", "Relying on a home breathing or heart-rate monitor instead of a safe sleep space — these have not been shown to reduce the risk of SIDS."),
      ],
      parentTips: [
        b('ညအိပ် နိုးခြင်းသည် ဤအရွယ်တွင် ပုံမှန် ဖြစ်သည် — အမှား မဟုတ်ပါ။', 'Night waking is normal at this age — it is not a failure.'),
        b('ဖြစ်နိုင်လျှင် မိဘနှစ်ဦး အလှည့်ကျ တာဝန်ယူပါ။', 'Share the night load between adults where you can.'),
      ],
      faq: [
        {
          q: b('၈ လမှာ ညအိပ် ပြန်နိုးလာတယ် — ဘာဖြစ်တာလဲ။', 'She started waking again at 8 months — why?'),
          a: b('ဤအရွယ်တွင် ခွဲခွာမှု စိုးရိမ်ခြင်းနှင့် ဖွံ့ဖြိုးမှု အပြောင်းအလဲများကြောင့် ညအိပ် နိုးခြင်း ပြန်များတတ်ပါသည်။ ငြိမ်းချမ်းစွာ တုံ့ပြန်ပြီး လုပ်ရိုးလုပ်စဉ်ကို ဆက်ထိန်းပါ။', 'Separation anxiety and new skills often disturb sleep around this age. Respond calmly and keep the routine steady.'),
        },
        {
          q: b('ကလေးက မှောက်အိပ်နေရင် ပြန်လှန်ပေးရမလား။', 'She rolls onto her tummy in her sleep — should I turn her back?'),
          a: b('ကလေးသည် ပက်လက်မှ မှောက်နှင့် မှောက်မှ ပက်လက် ဘက်နှစ်ဖက်စလုံး ကိုယ်တိုင် လှိမ့်နိုင်ပြီဆိုလျှင် ပြန်လှည့်ပေးရန် မလိုပါ။ ဘက်နှစ်ဖက်စလုံး မလှိမ့်နိုင်သေးပါက ပက်လက်အနေအထားသို့ ပြန်လှည့်ပေးပါ။ အိပ်ရာဝင်ချိန်တွင် အမြဲ ပက်လက်မှ စတင်ပြီး အိပ်ရာပေါ်တွင် ဘာမျှ မရှိစေရပါ။', 'Once she can roll both ways on her own, you do not need to turn her back. If she cannot yet roll both ways, return her to her back. Always start her on her back, and keep the surface clear.'),
        },
        { q: b("ဘယ်အပူချိန် ရောက်ရင် ဆေးရုံ သွားရမလဲ။", "What temperature means we should seek care?"), a: b("အပူချိန် တိုင်းပါ။ အသက် ၃ လအောက် ကလေး ၃၈°C (၁၀၀.၄°F) နှင့်အထက် ဖျားပါက — ကလေး ပုံမှန်လို ထင်ရလျှင်ပင် ချက်ချင်း ပြသပါ။ အသက် ၃ လမှ ၆ လကြား ၃၉°C (၁၀၂.၂°F) နှင့်အထက် ဖျားပါက အမြန် ပြသပါ။ အသက် ၆ လကျော်လျှင် အပူချိန် ကိန်းဂဏန်းတစ်ခုတည်းက အဖြေ မပေးပါ — ကလေး၏ ပုံစံနှင့် အပြုအမူကို ကြည့်ပါ။ ဖျားချိန် ၅ ရက်နှင့်အထက် ကြာလျှင်၊ ရေ/နို့ မသောက်နိုင်လျှင် သို့မဟုတ် ပုံမှန်လို တုံ့ပြန်မှု မရှိတော့လျှင် ပြသပါ။ အသက်မရွေး — ဖျားခြင်းနှင့်အတူ အသက်ရှူခက်ခြင်း၊ နှိပ်လျှင် မပျောက်သော အနီစက်၊ လည်ပင်း တောင့်တင်းခြင်း သို့မဟုတ် နိုးရခက်ခြင်း ပါလာပါက ချက်ချင်း ပြသပါ။ အပူချိန်တိုင်းကိရိယာ မရှိပါက — ကလေး ပူနေပြီး အထက်ပါ လက္ခဏာများ ပါလျှင် မစောင့်ဘဲ ပြသပါ။", "Take the temperature. Under 3 months, 38°C (100.4°F) or above: seek care straight away, even if the baby otherwise seems well. Between 3 and 6 months, 39°C (102.2°F) or above: seek care promptly. Over 6 months, the number alone does not decide — go by how she looks and behaves. Seek advice if the fever lasts 5 days or more, if she will not drink, or if she is much less responsive than usual. At any age, fever together with difficulty breathing, a rash that does not fade under pressure, a stiff neck, or being hard to wake: seek care immediately. If you have no thermometer, and the child feels hot and has any of those signs, do not wait.") },
      ],
      redFlags: [
        b('အသက်ရှူရ ခက်ခဲခြင်း၊ အသက်ရှူသံ မြည်ခြင်း၊ နှုတ်ခမ်း ညိုခြင်း — ချက်ချင်း ဆေးကုသမှု ခံယူပါ။', 'Difficulty breathing, noisy breathing or blue lips — get medical help immediately.'),
        b('နှိုးရ မရခြင်း၊ အလွန် အိပ်ငိုက်နေခြင်း — ချက်ချင်း ဆေးကုသမှု ခံယူပါ။', 'Very hard to wake or unusually drowsy — get medical help immediately.'),
        b('ဖိကြည့်လျှင် မပျောက်သော အနီကွက်များ၊ သို့မဟုတ် အဖျားနှင့်အတူ အသက်ရှူခက်ခြင်း/နိုးရခက်ခြင်း — ချက်ချင်း ဆေးကုသမှု ခံယူပါ။', 'A rash that does not fade under pressure, or fever with difficulty breathing or being hard to wake — get medical help immediately.'),
      ],
      referral: b(
        'အထက်ပါ အရေးပေါ် လက္ခဏာများ တွေ့ပါက ချက်ချင်း ဆေးကုသမှု ခံယူပါ။ အိပ်စက်မှု ပုံစံ စိုးရိမ်ဖွယ် ရှိပါက ကျန်းမာရေးဝန်ထမ်းအား ပြပါ။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ပါ။',
        'Seek medical care immediately for the urgent signs above. Raise other sleep concerns with a health worker. This is not a diagnosis.',
      ),
      encouragement: b(
        'ကလေး၏ အိပ်စက်မှုပုံစံသည် အမြဲ တဖြည်းဖြည်း ကောင်းမွန်လာမည် မဟုတ်ပါ။ တစ်ခါတစ်ရံ ပြန်လည်မတည်ငြိမ်ခြင်းသည်လည်း တွေ့ရတတ်ပါသည်။',
        'Sleep does not improve in a straight line — steps backwards are normal.',
      ),
    }),
    'Sleep amounts at 4–11 months follow WHO physical activity and sleep guidance for under-5s; safe sleep positioning, surface and room-sharing follow AAP safe sleep guidance, NHS SIDS advice and Health Canada safe sleep guidance. The direct bedtime-routine trial supports a calm routine at this age, while the AASM and newer systematic reviews and the age-matched Hiscock trial support behavioral help for established bedtime or night-waking problems rather than treating normal waking as illness.',
  ),
  kb(
    guide('7_9m', 'safety', {
      title: b('၇ – ၉ လ — ဘေးကင်းလုံခြုံရေး လမ်းညွှန်', '7–9 months — Safety guide'),
      why: b(
        'ဤအရွယ်တွင် ကလေးသည် လှိမ့်ခြင်း၊ ထိုင်ခြင်းနှင့် တွားသွားခြင်းတို့ စတင်နိုင်သဖြင့် လက်လှမ်းမီသောနေရာ ပိုမိုကျယ်လာသည်။ ထို့ကြောင့် အိမ်တွင်းဘေးကင်းရေးကို ပြန်လည်စစ်ဆေးရန် အချိန်ကောင်းဖြစ်သည်။ ကလေးကို အနီးကပ်ကြီးကြပ်ခြင်းနှင့် အိမ်ပတ်ဝန်းကျင်ကို ဘေးကင်းအောင် ကြိုတင်ပြင်ဆင်ခြင်း နှစ်မျိုးလုံး လိုအပ်သည်။',
        'She may now roll, sit and start to crawl, so her reach suddenly widens. This is the moment to re-check the home. Supervision is the basic protection, and preparing the environment makes it stronger.',
      ),
      observationQuestions: [
        b('ကလေး ရောက်နိုင်သော နေရာတွင် ပစ္စည်းငယ်များ ရှိပါသလား။', 'Are there small objects within her reach?'),
        b('လှေကား၊ မီးဖိုချောင်၊ ရေထားသော ပုံးများကို ကာရံထားပါသလား။', 'Are stairs, the kitchen and water containers blocked or covered?'),
        b('ဆေးများ၊ ဓာတုပစ္စည်းများကို သော့ခတ်ထားပါသလား။', 'Are medicines and chemicals locked away?'),
        b('ကားစီးလျှင် ကလေးထိုင်ခုံ သုံးပါသလား။', 'Do you use a child restraint in vehicles?'),
      ],
      dailyActivities: [
        b('ကလေး ကစားမည့် နေရာကို အရင် ကြမ်းပြင်အဆင့်မှ စစ်ဆေးပါ။', 'Check the play area at floor level before she starts.'),
        b('ပူသော အရည်များကို စားပွဲ အစွန်းတွင် မထားပါနှင့်။', 'Never leave hot drinks at the edge of a table.'),
        b('ရေချိုးပြီးလျှင် ရေကို ချက်ချင်း သွန်ပစ်ပါ။', 'Empty bath water immediately after use.'),
      ],
      weeklyActivities: [
        b('အိမ်တွင်း ဘေးကင်းရေး စစ်ဆေးမှု တစ်ပတ်လျှင် တစ်ကြိမ် လုပ်ပါ။', 'Do a weekly home safety check.'),
        b('ကာကွယ်ဆေး အချိန်ဇယားကို ပြန်စစ်ပါ။', 'Check that immunisations are up to date.'),
      ],
      indoor: [
        b('ကြမ်းပြင်ပေါ် လုံခြုံသော ကစားနေရာ ဖန်တီးခြင်း။', 'Making a safe floor play space.'),
        b('ပစ္စည်းငယ်များကို အထက်သို့ ရွှေ့ထားခြင်း။', 'Moving small objects up out of reach.'),
      ],
      outdoor: [
        b('အပြင်တွင် ကလေးအား လက်လှမ်းမီ အကွာအဝေးတွင် ထားခြင်း။', 'Keeping her within arm’s reach outdoors.'),
      ],
      lowCost: [
        b('ပစ္စည်းငယ်များကို ဖယ်ရှားခြင်းသည် အခမဲ့ဖြစ်ပြီး အထိရောက်ဆုံး ဖြစ်သည်။', 'Removing small objects costs nothing and works best.'),
        b('ရေပုံးများကို အမြဲ လှန်ထား သို့မဟုတ် ဖုံးထားပါ။', 'Keep buckets emptied or covered.'),
      ],
      materials: b('မလိုအပ်ပါ — ပြင်ဆင်မှုနှင့် ကြီးကြပ်မှုသာ လိုသည်', 'Nothing needed — preparation and supervision'),
      safety: b(
        'ကလေးအား ကုတင်၊ စားပွဲ၊ ဆိုဖာပေါ်တွင် တစ်ယောက်တည်း လုံးဝ မထားပါနှင့် — လှိမ့်ကျနိုင်သည်။ ရေအနီးတွင် တစ်စက္ကန့်မျှပင် တစ်ယောက်တည်း မထားပါနှင့် — ရေတိမ်ငယ်တွင်ပင် နစ်မြုပ်နိုင်သည်။ ပါးစပ်ထဲ ဝင်နိုင်သော ပစ္စည်းမှန်သမျှ — ဒင်္ဂါးပြား၊ ကြယ်သီး၊ အခွံမာသီး၊ ခလုတ်ဘက်ထရီ — ကို ဖယ်ရှားပါ။ ခလုတ်ဘက်ထရီ မျိုမိပါက ချက်ချင်း ဆေးရုံသို့ သွားပါ။ ကြိုးရှည်များ၊ လိုက်ကာကြိုးများ၊ ပလတ်စတစ်အိတ်၊ ပူဖောင်းများကို ဖယ်ရှားပါ။ ပူသော အရည်နှင့် မီးဖိုကို အလှမ်းမမီအောင် ထားပါ။ ဆေးများနှင့် ဓာတုပစ္စည်းများကို သော့ခတ်ပါ။ ကားစီးလျှင် အသက်အရွယ်နှင့် ကိုက်ညီသော နောက်ပြန်လှည့် ကလေးထိုင်ခုံ သုံးပါ။ ကာကွယ်ဆေးများကို အချိန်မှန် ထိုးပါ။',
        'Never leave her alone on a bed, table or sofa — she can roll off. Never leave her alone near water, not even for a moment; babies can drown in very shallow water. Remove anything small enough to fit in her mouth — coins, buttons, nuts, button batteries. A swallowed button battery needs hospital care immediately. Remove long cords, blind pulls, plastic bags and balloons. Keep hot liquids and the cooking fire out of reach. Lock away medicines and chemicals. Use an age-appropriate rear-facing child restraint in vehicles. Keep immunisations up to date.',
      ),
      commonMistakes: [
        b('"တစ်စက္ကန့်ပဲ" ဟု ထင်၍ ရေအနီးတွင် ခဏ ခွာသွားခြင်း။', 'Stepping away from water "just for a second".'),
        b('ကလေး မတွားနိုင်သေးဟု ထင်၍ ကြိုတင် ပြင်ဆင်မှု မလုပ်ခြင်း။', 'Waiting until she crawls before making the home safe.'),
      ],
      parentTips: [
        b('ကလေး တွားမတတ်မီ ကြိုတင် ပြင်ဆင်ထားပါ — ရုတ်တရက် တတ်သွားတတ်သည်။', 'Prepare before she crawls — it often happens suddenly.'),
        b('ကြမ်းပြင်ပေါ် ဒူးထောက်ကြည့်ပါ — ကလေး မြင်သည့် အန္တရာယ်များ တွေ့ရမည်။', 'Kneel on the floor and look — you will see the hazards she sees.'),
      ],
      faq: [
        {
          q: b('ကလေးလမ်းလျှောက်စက် သုံးလို့ရပါသလား။', 'Are baby walkers safe?'),
          a: b('လမ်းလျှောက်ကူ ကလေးကားများသည် လှေကားမှ ပြုတ်ကျခြင်း၊ မီးဖိုသို့ ရောက်ခြင်း စသည့် ထိခိုက်မှုများနှင့် ဆက်စပ်နေသဖြင့် အကြံမပြုပါ။ ကြမ်းပြင်ပေါ် လုံခြုံစွာ ကစားခြင်းက ပိုကောင်းပါသည်။', 'Baby walkers are linked to falls down stairs and reaching hazards such as cooking fires, so they are not recommended. Safe floor play is better.'),
        },
        {
          q: b('ဘယ်အချိန်မှာ ချက်ချင်း ဆေးရုံသွားရမလဲ။', 'When should I go to hospital immediately?'),
          a: b('အသက်ရှူရ ခက်ခဲခြင်း၊ တက်ခြင်း၊ နှိုးရ မရခြင်း၊ တိုက်ကျွေးသမျှ အန်ထွက်ခြင်း သို့မဟုတ် အရည်ကို မထိန်းထားနိုင်ခြင်း၊ ဖိကြည့်လျှင် အရောင်မပျောက်သော အဖုအပိန့်များ ပေါ်ခြင်း၊ ခလုတ်ဘက်ထရီ သို့မဟုတ် ဓာတုပစ္စည်း မျိုမိခြင်း — ချက်ချင်း ဆေးကုသမှု ခံယူပါ။', 'Difficulty breathing, a fit, being very hard to wake, vomiting everything or being unable to keep fluids down, a rash that does not fade under pressure, or swallowing a button battery or chemical — get medical help immediately.'),
        },
        { q: b("ဘယ်အပူချိန် ရောက်ရင် ဆေးရုံ သွားရမလဲ။", "What temperature means we should seek care?"), a: b("အပူချိန် တိုင်းပါ။ အသက် ၃ လအောက် ကလေး ၃၈°C (၁၀၀.၄°F) နှင့်အထက် ဖျားပါက — ကလေး ပုံမှန်လို ထင်ရလျှင်ပင် ချက်ချင်း ပြသပါ။ အသက် ၃ လမှ ၆ လကြား ၃၉°C (၁၀၂.၂°F) နှင့်အထက် ဖျားပါက အမြန် ပြသပါ။ အသက် ၆ လကျော်လျှင် အပူချိန် ကိန်းဂဏန်းတစ်ခုတည်းက အဖြေ မပေးပါ — ကလေး၏ ပုံစံနှင့် အပြုအမူကို ကြည့်ပါ။ ဖျားချိန် ၅ ရက်နှင့်အထက် ကြာလျှင်၊ ရေ/နို့ မသောက်နိုင်လျှင် သို့မဟုတ် ပုံမှန်လို တုံ့ပြန်မှု မရှိတော့လျှင် ပြသပါ။ အသက်မရွေး — ဖျားခြင်းနှင့်အတူ အသက်ရှူခက်ခြင်း၊ နှိပ်လျှင် မပျောက်သော အနီစက်၊ လည်ပင်း တောင့်တင်းခြင်း သို့မဟုတ် နိုးရခက်ခြင်း ပါလာပါက ချက်ချင်း ပြသပါ။ အပူချိန်တိုင်းကိရိယာ မရှိပါက — ကလေး ပူနေပြီး အထက်ပါ လက္ခဏာများ ပါလျှင် မစောင့်ဘဲ ပြသပါ။", "Take the temperature. Under 3 months, 38°C (100.4°F) or above: seek care straight away, even if the baby otherwise seems well. Between 3 and 6 months, 39°C (102.2°F) or above: seek care promptly. Over 6 months, the number alone does not decide — go by how she looks and behaves. Seek advice if the fever lasts 5 days or more, if she will not drink, or if she is much less responsive than usual. At any age, fever together with difficulty breathing, a rash that does not fade under pressure, a stiff neck, or being hard to wake: seek care immediately. If you have no thermometer, and the child feels hot and has any of those signs, do not wait.") },
      ],
      redFlags: [
        b('အသက်ရှူရ ခက်ခဲခြင်း သို့မဟုတ် နှုတ်ခမ်း ညိုခြင်း — ချက်ချင်း ဆေးကုသမှု ခံယူပါ။', 'Difficulty breathing or blue lips — get medical help immediately.'),
        b('တက်ခြင်း သို့မဟုတ် နှိုးရ မရခြင်း — ချက်ချင်း ဆေးကုသမှု ခံယူပါ။', 'A fit, or being very hard to wake — get medical help immediately.'),
        b('ဖိကြည့်လျှင် အရောင်မပျောက်သော အဖုအပိန့်များ ပေါ်ခြင်း — ချက်ချင်း ဆေးကုသမှု ခံယူပါ။', 'A rash that does not fade under pressure — get medical help immediately.'),
        b('ခေါင်းကို ပြင်းထန်စွာ ရိုက်မိပြီးနောက် အန်ခြင်း၊ အိပ်ငိုက်ခြင်း — ချက်ချင်း ဆေးကုသမှု ခံယူပါ။', 'Vomiting or drowsiness after a significant head injury — get medical help immediately.'),
      ],
      referral: b(
        'အထက်ပါ လက္ခဏာများ တွေ့ပါက ချက်ချင်း ဆေးကုသမှု ခံယူပါ။ ဤအက်ပလီကေးရှင်းသည် အရေးပေါ် ဝန်ဆောင်မှု မဟုတ်ပါ။ ဤသည် ရောဂါ ဖော်ထုတ်ချက်လည်း မဟုတ်ပါ။',
        'Seek medical care immediately for the signs above. This app is not an emergency service, and this is not a diagnosis.',
      ),
      encouragement: b(
        'ပတ်ဝန်းကျင်ကို လုံခြုံအောင် ပြင်ဆင်ပေးခြင်းသည် ကလေးအား လွတ်လပ်စွာ စူးစမ်းခွင့် ပေးခြင်း ဖြစ်သည်။',
        'Making the space safe is what lets her explore freely.',
      ),
    }),
    'Fall, choking, drowning and burn precautions at this age follow AAP drowning-prevention guidance and the Bright Futures preventive-care schedule; the urgent-sign list follows NHS advice on spotting a seriously ill child, NICE fever guidance and the WHO IMCI danger signs; the safe sleep points follow AAP safe sleep guidance.',
  ),
  kb(
    guide('7_9m', 'daily_routine', {
      title: b('၇ – ၉ လ — နေ့စဉ် လုပ်ရိုးလုပ်စဉ် လမ်းညွှန်', '7–9 months — Daily routine guide'),
      why: b(
        'ခန့်မှန်းနိုင်သော နေ့စဉ် အစီအစဉ်သည် ကလေးအား လုံခြုံမှု ခံစားစေပြီး မိဘအတွက်လည်း နေ့တစ်နေ့ကို စီမံရ လွယ်ကူစေသည်။ ဤအရွယ်တွင် အစာနပ်များ၊ နေ့ခင်း အိပ်ချိန်များနှင့် ကစားချိန်များကို တစ်သမတ်တည်း ထားနိုင်ပါက ကလေး၏ အိပ်စက်မှုနှင့် အစားအသောက်လည်း ပိုမို တည်ငြိမ်လာတတ်သည်။',
        'A predictable day helps her feel secure and makes the day easier to manage. Keeping meals, naps and play at roughly the same times tends to steady both sleep and eating at this age.',
      ),
      observationQuestions: [
        b('အစာနပ်များ အချိန်တူ ဖြစ်ပါသလား။', 'Do meals happen at roughly the same times?'),
        b('နေ့ခင်း အိပ်ချိန် ပုံစံ ရှိပါသလား။', 'Is there a nap pattern?'),
        b('အိပ်ရာဝင် လုပ်ရိုးလုပ်စဉ် တူညီပါသလား။', 'Is the bedtime routine the same each night?'),
        b('မိဘအတွက် အနားယူချိန် ပါဝင်ပါသလား။', 'Does the day include any rest for you?'),
      ],
      dailyActivities: [
        b('နံနက်ခင်းတွင် အလင်းရောင်နှင့် ကစားချိန် ပေးပါ။', 'Start the day with daylight and play.'),
        b('အစာနပ် နှစ်နပ်မှ သုံးနပ်ကို အချိန်မှန် ကျွေးပါ။', 'Keep two to three meals at regular times.'),
        b('ညနေတွင် ငြိမ်သက်သော ကစားချိန်မှ အိပ်ရာဝင်သို့ ကူးပြောင်းပါ။', 'Move from quiet play into the bedtime routine each evening.'),
      ],
      weeklyActivities: [
        b('တစ်ပတ်လျှင် တစ်ကြိမ် အိမ်တွင်း ဘေးကင်းရေး စစ်ဆေးပါ။', 'Do a weekly home safety check.'),
        b('ကာကွယ်ဆေးနှင့် ကျန်းမာရေး စစ်ဆေးမှု ရက်ချိန်းများကို ပြန်ကြည့်ပါ။', 'Review immunisation and health-check dates.'),
      ],
      indoor: [
        b('ကြမ်းပြင်ပေါ် ကစားချိန်ကို နေ့စဉ် အစီအစဉ်ထဲ ထည့်ခြင်း။', 'Building floor play into the daily plan.'),
        b('စာအုပ်ချိန်ကို အိပ်ရာမဝင်မီ ထည့်ခြင်း။', 'Adding book time before bed.'),
      ],
      outdoor: [
        b('နေ့စဉ် အပြင်ထွက်ချိန် တစ်ကြိမ် ထည့်ခြင်း။', 'Including one trip outdoors each day.'),
      ],
      lowCost: [
        b('အစီအစဉ် ရေးဆွဲခြင်းသည် အခမဲ့ ဖြစ်သည်။', 'A routine costs nothing.'),
        b('မိသားစုဝင်များ အလှည့်ကျ ကူညီခြင်းက မိဘ၏ အနားယူချိန်ကို တိုးပေးသည်။', 'Sharing care between family members creates rest time.'),
      ],
      materials: b('မလိုအပ်ပါ', 'Nothing needed'),
      safety: b(
        'အစာစားနေစဉ် ကလေးအား ထိုင်စေပြီး အမြဲ ကြီးကြပ်ပါ၊ နို့ဗူးကို မထောက်ထားပါနှင့်။ တစ်နှစ်အောက် ပျားရည် မကျွေးပါနှင့်။ ရေချိုးချိန်တွင် ကလေးအား တစ်ယောက်တည်း လုံးဝ မထားပါနှင့်။ ကုတင်၊ စားပွဲပေါ်တွင် တစ်ယောက်တည်း မထားပါနှင့်။ အိပ်ချိန်တိုင်း ပက်လက် အိပ်စေပါ။ ဖျားခြင်းနှင့် အသက်ရှူ ခက်ခဲခြင်း ဖြစ်ပါက ကျန်းမာရေးဝန်ထမ်းအား ချက်ချင်း ပြပါ။ ကာကွယ်ဆေးများကို အချိန်မှန် ထိုးပါ။',
        'Seat her for meals and supervise every one; never prop a bottle. No honey under 12 months. Never leave her alone in the bath. Never leave her alone on a bed or table. Put her on her back for every sleep. Seek care promptly for fever with difficulty breathing. Keep immunisations up to date.',
      ),
      commonMistakes: [
        b('အစီအစဉ်ကို အလွန် တင်းကျပ်စွာ လိုက်နာရန် ကြိုးစားခြင်း။', 'Following the routine too rigidly.'),
        b('မိဘ၏ အနားယူချိန်ကို အစီအစဉ်ထဲ မထည့်ခြင်း။', 'Leaving your own rest out of the plan.'),
      ],
      parentTips: [
        b('အစီအစဉ်သည် လမ်းညွှန်သာ ဖြစ်ပြီး စည်းမျဉ်း မဟုတ်ပါ။', 'A routine is a guide, not a rule.'),
        b('တစ်ရက် ပျက်သွားလျှင် နောက်တစ်ရက်တွင် ပြန်စနိုင်ပါသည်။', 'If a day goes off track, you can simply start again tomorrow.'),
      ],
      faq: [
        {
          q: b('အစီအစဉ် တစ်ခု မဖြစ်မနေ လိုအပ်လား။', 'Do we really need a routine?'),
          a: b('တင်းကျပ်သော အစီအစဉ် မလိုပါ။ သို့သော် အစာ၊ အိပ်၊ ကစားချိန်များ ခန့်မှန်းနိုင်ခြင်းက ကလေးကို လုံခြုံစေပြီး မိဘကိုလည်း ကူညီပါသည်။', 'A strict schedule is not needed, but predictable meals, sleep and play help her feel secure and help you plan.'),
        },
        {
          q: b('ခရီးသွားချိန် အစီအစဉ် ပျက်ရင် ဘာလုပ်ရမလဲ။', 'What if travel disrupts everything?'),
          a: b('ဖြစ်တတ်ပါသည်။ အိပ်ရာဝင် လုပ်ရိုးလုပ်စဉ် ကဲ့သို့ အရေးကြီးဆုံး တစ်ခုနှစ်ခုကိုသာ ဆက်ထိန်းပြီး ကျန်သည်ကို ပြန်စနိုင်ပါသည်။', 'That is normal. Keep one or two anchors such as the bedtime routine, and rebuild the rest afterwards.'),
        },
        { q: b("ဘယ်အပူချိန် ရောက်ရင် ဆေးရုံ သွားရမလဲ။", "What temperature means we should seek care?"), a: b("အပူချိန် တိုင်းပါ။ အသက် ၃ လအောက် ကလေး ၃၈°C (၁၀၀.၄°F) နှင့်အထက် ဖျားပါက — ကလေး ပုံမှန်လို ထင်ရလျှင်ပင် ချက်ချင်း ပြသပါ။ အသက် ၃ လမှ ၆ လကြား ၃၉°C (၁၀၂.၂°F) နှင့်အထက် ဖျားပါက အမြန် ပြသပါ။ အသက် ၆ လကျော်လျှင် အပူချိန် ကိန်းဂဏန်းတစ်ခုတည်းက အဖြေ မပေးပါ — ကလေး၏ ပုံစံနှင့် အပြုအမူကို ကြည့်ပါ။ ဖျားချိန် ၅ ရက်နှင့်အထက် ကြာလျှင်၊ ရေ/နို့ မသောက်နိုင်လျှင် သို့မဟုတ် ပုံမှန်လို တုံ့ပြန်မှု မရှိတော့လျှင် ပြသပါ။ အသက်မရွေး — ဖျားခြင်းနှင့်အတူ အသက်ရှူခက်ခြင်း၊ နှိပ်လျှင် မပျောက်သော အနီစက်၊ လည်ပင်း တောင့်တင်းခြင်း သို့မဟုတ် နိုးရခက်ခြင်း ပါလာပါက ချက်ချင်း ပြသပါ။ အပူချိန်တိုင်းကိရိယာ မရှိပါက — ကလေး ပူနေပြီး အထက်ပါ လက္ခဏာများ ပါလျှင် မစောင့်ဘဲ ပြသပါ။", "Take the temperature. Under 3 months, 38°C (100.4°F) or above: seek care straight away, even if the baby otherwise seems well. Between 3 and 6 months, 39°C (102.2°F) or above: seek care promptly. Over 6 months, the number alone does not decide — go by how she looks and behaves. Seek advice if the fever lasts 5 days or more, if she will not drink, or if she is much less responsive than usual. At any age, fever together with difficulty breathing, a rash that does not fade under pressure, a stiff neck, or being hard to wake: seek care immediately. If you have no thermometer, and the child feels hot and has any of those signs, do not wait.") },
      ],
      redFlags: [
        b('အစာ လုံးဝ မစားခြင်း၊ နို့ မစို့ခြင်း — ကျန်းမာရေးဝန်ထမ်းအား ချက်ချင်း ပြပါ။', 'Not eating or feeding at all — seek care promptly.'),
        b('ဖျားပြီး အသက်ရှူ ခက်ခဲခြင်း — ချက်ချင်း ဆေးကုသမှု ခံယူပါ။', 'Fever with difficulty breathing — get medical help immediately.'),
        b('ကလေး၏ လှုပ်ရှားမှု ရုတ်တရက် လျော့ကျသွားခြင်း — ချက်ချင်း ဆေးကုသမှု ခံယူပါ။', 'A sudden drop in her usual activity — get medical help immediately.'),
      ],
      referral: b(
        'အထက်ပါ လက္ခဏာများ တွေ့ပါက ချက်ချင်း ဆေးကုသမှု ခံယူပါ။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ပါ။',
        'Seek medical care immediately for the signs above. This is not a diagnosis.',
      ),
      encouragement: b(
        'ခန့်မှန်းနိုင်သော နေ့တစ်နေ့သည် ကလေးအတွက် အကြီးမားဆုံး လုံခြုံမှု လက်ဆောင် ဖြစ်ပါသည်။',
        'A predictable day is one of the biggest gifts of security you can give her.',
      ),
    }),
    'Predictable daily rhythms and responsive care follow the WHO/UNICEF nurturing care framework and the Bright Futures preventive-care schedule; feeding-safety points follow the WHO infant and young child feeding model chapter; drowning and fall precautions follow AAP drowning-prevention guidance; fever advice follows NICE fever guidance; the immunisation reminder follows the CDC immunisation schedule.',
  ),
];

const ACTIVITIES: SeedItem[] = [
  kb(
    activity({
      slug: 'name_and_wait',
      title: b('အမည်ခေါ်၍ စောင့်ခြင်း', 'Name it and wait'),
      summary: b('အရာဝတ္ထုကို အမည်ခေါ်ပြီး ကလေး တုံ့ပြန်ရန် စောင့်ပေးခြင်း။', 'Name what your baby is looking at, then pause and let her answer.'),
      ageGroupKey: '7_9m',
      domains: ['speech', 'language', 'communication'],
      difficulty: 'easy',
      durationMinutes: 5,
      materials: b('မလိုအပ်ပါ — အိမ်တွင်း ပစ္စည်း ၂–၃ ခုနှင့် သင်၏ အသံ။', 'None — two or three everyday objects and your voice.'),
      setup: b('တီဗွီ၊ ဖုန်း ပိတ်ပါ။ ကလေးကို ရင်ခွင်ထဲ သို့မဟုတ် မျက်နှာချင်းဆိုင် ထိုင်ပါ။', 'Turn off the TV and phone. Hold her on your lap or sit face to face.'),
      instructions: [
        b('ကလေး မည်သည့်အရာကို ကြည့်နေသည်ကို စောင့်ကြည့်ပါ။', 'Watch to see what she is looking at.'),
        b('ထိုအရာ၏ အမည်ကို ရိုးရှင်းစွာ ပြောပါ — "ဇွန်း"၊ "ရေ"။', 'Say its name simply — "spoon", "water".'),
        b('စကားလုံး မထပ်ဘဲ ၅ စက္ကန့် စောင့်ပါ။', 'Then wait five seconds without adding more words.'),
        b('ကလေး အသံထွက်လျှင် သို့မဟုတ် ကြည့်လျှင် ပြုံး၍ တုံ့ပြန်ပါ။', 'If she makes a sound or looks at you, smile and answer back.'),
        b('ထိုစကားလုံးကို ၂–၃ ကြိမ် ထပ်ပြောပါ — မတူညီသော အခြေအနေတွင် ပြန်သုံးပါ။', 'Repeat that word two or three times, and use it again later in the day.'),
        b('တစ်ကြိမ်လျှင် ပစ္စည်း ၂–၃ ခုထက် မပိုပါစေနှင့်။', 'Keep it to two or three objects in one session.'),
      ],
      safety: b('ပါးစပ်ထဲ ဝင်နိုင်သော ပစ္စည်း (ဒင်္ဂါး၊ ကြယ်သီး၊ ခလုတ်ဘက်ထရီ) မသုံးပါနှင့်။ ကလေးအနီးတွင် အမြဲ ရှိနေပါ။', 'Never use anything small enough to fit in her mouth — coins, buttons, button batteries. Stay beside her.'),
      indoor: true, outdoor: true, oneChild: true, group: false, parentChild: true,
      outcomes: [
        b('စကားလုံး နားလည်မှုနှင့် အလှည့်ကျ ဆက်သွယ်မှုကို အားပေးရန်။', 'Learning objective — to build word understanding and conversational turn-taking.'),
        b('ပူးတွဲ အာရုံစိုက်မှု ပိုမို ကြာရှည်လာခြင်း။', 'Longer periods of shared attention.'),
      ],
      variations: [b('အပြင်ထွက်လျှင် မြင်ရသည့်အရာများကို အမည်ခေါ်ပါ — ခေါင်းလောင်း၊ ခွေး၊ ကား။', 'Outdoors, name what you both see — a bell, a dog, a car.')],
      lowCost: true,
      offline: true,
      tags: ['speech_activity', 'daily'],
    }),
    'Naming what the infant is already attending to and pausing for a response follows NHS learn-to-talk guidance, CDC milestone guidance, the WHO Care for Child Development counselling materials and the conversational-turns research in the registry.',
  ),
  kb(
    activity({
      slug: 'sit_and_reach_ring',
      title: b('ထိုင်၍ လက်လှမ်းယူခြင်း', 'Sit and reach for the ring'),
      summary: b('ထိုင်နေစဉ် ဘေးတစ်ဖက်သို့ လှမ်းယူစေခြင်းဖြင့် ကိုယ်လုံး ဟန်ချက်ကို လေ့ကျင့်ပေးခြင်း။', 'Reaching sideways while sitting builds trunk balance.'),
      ageGroupKey: '7_9m',
      domains: ['gross_motor', 'fine_motor', 'play'],
      difficulty: 'easy',
      durationMinutes: 10,
      materials: b('ကိုင်ရလွယ်သော ကွင်း သို့မဟုတ် ပါးစပ်ထဲ မဝင်နိုင်သော ကစားစရာ တစ်ခု၊ အခင်း တစ်ထည်။', 'One easy-to-hold ring or toy too large to fit in her mouth, and a mat.'),
      setup: b('ကြမ်းပြင်ပေါ်တွင် အခင်း ခင်း၍ ဘေးပတ်လည်ကို ရှင်းပါ။ ခေါင်းရိုက်နိုင်သော ပရိဘောဂ ထောင့်များကို ဖယ်ပါ။', 'Lay a mat on the floor and clear the space around it, including sharp furniture corners.'),
      instructions: [
        b('ကလေးကို ထိုင်စေပြီး လိုအပ်လျှင် ခါးကို ဖြေးညှင်းစွာ ထောက်ပေးပါ။', 'Sit her up, supporting her hips gently if she still needs it.'),
        b('ကွင်းကို ရှေ့တည့်တည့်တွင် ကိုင်ပြပါ။', 'Hold the ring straight in front of her.'),
        b('ကလေး ယူပြီးလျှင် ဘေးတစ်ဖက်သို့ အနည်းငယ် ရွှေ့ပေးပါ။', 'When she takes it, move it a little to one side.'),
        b('ကလေး လှည့်၍ လှမ်းယူသည်ကို စောင့်ကြည့်ပါ — အတင်း မဆွဲပါနှင့်။', 'Watch her turn and reach — never pull her over.'),
        b('တစ်ဖက်ပြီး တစ်ဖက် အလှည့်ကျ လုပ်ပါ။', 'Take turns on each side.'),
        b('ကလေး မောလျှင် ပက်လက် သို့မဟုတ် မှောက်လှဲ၍ နားပေးပါ။', 'When she tires, let her rest on her back or tummy.'),
      ],
      safety: b('ကြမ်းပြင်ပေါ်တွင်သာ လုပ်ပါ။ ကလေးကို အိပ်ရာ၊ စားပွဲ သို့မဟုတ် ဆိုဖာပေါ်တွင် တစ်ယောက်တည်း လုံးဝ မထားပါနှင့်။ ကလေးအနီးတွင် အမြဲ ရှိနေပြီး ကလေးလမ်းလျှောက်စက်ကို မသုံးပါနှင့်။', 'Do this on the floor only — never leave her alone on a bed, table or sofa. Stay beside her. Baby walkers are not recommended.'),
      indoor: true, outdoor: false, oneChild: true, group: false, parentChild: true,
      outcomes: [
        b('ထိုင်ဟန်ချက်နှင့် လက်လှမ်းယူမှုကို အားပေးရန်။', 'Learning objective — to strengthen sitting balance and reaching.'),
        b('ကိုယ်လုံးနှင့် ပခုံး ကြွက်သားများ အားကောင်းလာခြင်း။', 'Stronger trunk and shoulder muscles.'),
      ],
      variations: [b('ကလေး ထိုင်နိုင်ပြီဆိုလျှင် ကွင်းကို အနည်းငယ် မြင့်ရာတွင် ကိုင်ပြပါ။', 'Once she sits steadily, hold the ring a little higher.')],
      lowCost: true,
      offline: true,
      tags: ['motor_activity', 'daily'],
    }),
    'Sitting balance and sideways reaching in this period follow CDC milestone checklists, AAP milestone guidance, the WHO motor-milestone windows study and the paediatric physical-therapy textbook in the registry.',
  ),
  kb(
    activity({
      slug: 'wave_bye_bye',
      title: b('လက်ပြ နှုတ်ဆက်ခြင်း', 'Wave bye-bye'),
      summary: b('ထွက်ခွာချိန်တိုင်း လက်ပြပြီး နှုတ်ဆက်ခြင်းဖြင့် ဆက်သွယ်မှု အမူအရာကို သင်ပေးခြင်း။', 'Waving every time someone leaves teaches a first communication gesture.'),
      ageGroupKey: '7_9m',
      domains: ['social', 'communication', 'emotional'],
      difficulty: 'easy',
      durationMinutes: 5,
      materials: b('မလိုအပ်ပါ။', 'None.'),
      setup: b('မိသားစုဝင် တစ်ဦး အခန်းထဲမှ ထွက်မည့် အချိန်ကို အသုံးချပါ။', 'Use the moment when a family member is about to leave the room.'),
      instructions: [
        b('ကလေးကို ချီထား၍ ထွက်ခွာမည့်သူကို ကြည့်စေပါ။', 'Hold her so she can see the person leaving.'),
        b('"ဘိုင်ဘိုင်" ဟု ပြောပြီး လက်ပြပါ။', 'Say "bye-bye" and wave.'),
        b('ကလေး၏ လက်ကို ဖြေးညှင်းစွာ ကိုင်၍ လက်ပြပေးပါ — ဆန့်ကျင်လျှင် ရပ်ပါ။', 'Gently help her hand wave — stop at once if she resists.'),
        b('ပြန်ရောက်လျှင် "ပြန်ရောက်ပြီ" ဟု ပြောပြီး လက်ပြပါ။', 'When the person returns, say "back again" and wave.'),
        b('နေ့စဉ် တူညီသော စကားလုံးနှင့် အမူအရာကို သုံးပါ။', 'Use the same words and gesture every day.'),
        b('ကလေး လက်ပြရန် အချိန် ရက်သတ္တပတ် များစွာ ကြာနိုင်သည် — စောင့်ပေးပါ။', 'It may take many weeks before she waves back — keep waiting patiently.'),
      ],
      safety: b('ခွဲခွာချိန်တွင် ကလေး ငိုလျှင် ချီပွေ့ နှစ်သိမ့်ပေးပါ — ဤသည် ကျန်းမာသော တွယ်တာမှု ဖြစ်သည်။ ကလေးကို လုံးဝ မလှုပ်ခါပါနှင့်။', 'If she cries at separation, hold and comfort her — this is healthy attachment. Never shake a baby.'),
      indoor: true, outdoor: true, oneChild: true, group: true, parentChild: true,
      outcomes: [
        b('ပထမဆုံး ဆက်သွယ်ရေး အမူအရာကို အားပေးရန်။', 'Learning objective — to encourage a first communication gesture.'),
        b('ခွဲခွာချိန်ကို ပိုမို လွယ်ကူစွာ ကျော်ဖြတ်နိုင်ခြင်း။', 'Easier goodbyes over time.'),
      ],
      variations: [b('ဖုန်းဖြင့် မိသားစုဝင်များနှင့် ပြောဆိုစဉ် လက်ပြပါ။', 'Wave during family video calls too.')],
      lowCost: true,
      offline: true,
      tags: ['social_activity', 'daily'],
    }),
    'Gesture use such as waving at this age follows CDC milestone guidance and AAP milestone guidance, and the responsive-caregiving approach follows the WHO Care for Child Development counselling materials and the AAP power-of-play report.',
  ),
];

const ACTIVITIES_B: SeedItem[] = [
  kb(
    activity({
      slug: 'lift_the_flap_book',
      title: b('စာအုပ် ဖွင့်၍ ရှာကြည့်ခြင်း', 'Lift-the-flap book time'),
      summary: b('ခိုင်ခံ့သော ပုံစာအုပ် တစ်အုပ်ကို အတူဖတ်၍ ကလေးအား စာမျက်နှာ လှန်ခွင့် ပေးခြင်း။', 'Share a sturdy picture book and let your baby turn or lift the pages.'),
      ageGroupKey: '7_9m',
      domains: ['language', 'cognitive', 'fine_motor'],
      difficulty: 'easy',
      durationMinutes: 10,
      materials: b('စာမျက်နှာထူပြီး ခိုင်ခံ့သော ပုံစာအုပ်တစ်အုပ်။ မရှိလျှင် စက္ကူထူပေါ်တွင် ရိုးရှင်းသော ပုံကတ်များကို ကိုယ်တိုင် ပြုလုပ်နိုင်သည်။', 'One sturdy board book. If you do not have one, make simple picture cards from thick paper.'),
      setup: b('ကလေးကို ရင်ခွင်ထဲ ထိုင်စေပါ။ အလင်းရောင် လုံလောက်စေပါ။ ဖုန်း၊ တီဗွီ ပိတ်ပါ။', 'Sit her on your lap in good light with the phone and TV off.'),
      instructions: [
        b('စာအုပ်ကို ကလေး၏ မျက်လုံးရှေ့ ၃၀ စင်တီမီတာခန့်တွင် ကိုင်ပါ။', 'Hold the book about 30 cm from her eyes.'),
        b('စာသားအတိုင်း မဖတ်ဘဲ ပုံကို ညွှန်ပြ၍ အမည်ခေါ်ပါ — "ကြည့်၊ ခွေး"။', 'Instead of reading the text word for word, point and name — "look, a dog".'),
        b('ကလေးအား စာမျက်နှာ လှန်ခွင့် ပေးပါ — မှားလှန်လျှင်လည်း ရပါသည်။', 'Let her turn the pages, even out of order.'),
        b('ကလေး ကြည့်နေသော ပုံအကြောင်း ပြောပါ — သင် ရွေးသည့် ပုံ မဟုတ်ပါ။', 'Talk about the picture she is looking at, not the one you chose.'),
        b('စာအုပ်ကို ပါးစပ်ထဲ ထည့်လျှင် ပုံမှန် ဖြစ်သည် — သန့်ရှင်းသော စာအုပ်ကို ခွင့်ပြုပါ။', 'Mouthing the book is normal — allow it with a clean book.'),
        b('ကလေး မျက်နှာလွှဲလျှင် ရပ်ပါ။ တစ်နေ့ အကြိမ်တိုတို များများ ဖြစ်စေပါ။', 'Stop when she looks away. Short sessions several times a day work best.'),
      ],
      safety: b('စာအုပ် စာရွက် ပြဲနေလျှင် မသုံးပါနှင့် — မျိုချနိုင်သည်။ ပလတ်စတစ်အိတ်ဖြင့် မထုပ်ပါနှင့်။ ဤအရွယ်တွင် မိသားစု ဗီဒီယိုခေါ်ဆိုမှုမှလွဲ၍ ဖန်သားပြင် မကြည့်ရန် အကြံပြုသည်။', 'Do not use a torn book — pieces can be swallowed. Never wrap it in a plastic bag. At this age screens are not recommended apart from family video calls.'),
      indoor: true, outdoor: true, oneChild: true, group: true, parentChild: true,
      outcomes: [
        b('စကားလုံး ကြားနာမှုနှင့် စာအုပ်နှင့် ရင်းနှီးမှုကို အားပေးရန်။', 'Learning objective — to build word exposure and early comfort with books.'),
        b('ပူးတွဲ အာရုံစိုက်မှုနှင့် လက်ချောင်း ထိန်းချုပ်မှု တိုးတက်ခြင်း။', 'Growing shared attention and finger control.'),
      ],
      variations: [b('စာအုပ် မရှိလျှင် မိသားစု ဓာတ်ပုံများကို ကြည့်၍ လူများ၏ အမည်ကို ခေါ်ပါ။', 'With no book, look at family photos and name the people.')],
      lowCost: true,
      offline: true,
      tags: ['reading_activity', 'daily'],
    }),
    'Shared book reading in the first year follows the AAP early-literacy policy, Canadian public-health early-literacy guidance, NHS learn-to-talk guidance and the shared book-reading research in the registry.',
  ),
  kb(
    activity({
      slug: 'drum_and_pause',
      title: b('တီး၍ ရပ်နားခြင်း', 'Drum and pause'),
      summary: b('ခေါက်သံ ရိုက်ပြီး ရပ်နားပေးခြင်းဖြင့် ကလေးအား အလှည့်ကျ တုံ့ပြန်စေခြင်း။', 'Tap a simple beat, then pause so your baby can take a turn.'),
      ageGroupKey: '7_9m',
      domains: ['cognitive', 'communication', 'play'],
      difficulty: 'easy',
      durationMinutes: 5,
      materials: b('ခိုင်ခံ့သော ပလတ်စတစ် ခွက် သို့မဟုတ် ဒယ်အိုး တစ်လုံးနှင့် သစ်သား ဇွန်း တစ်ချောင်း။', 'One sturdy plastic bowl or pot and a wooden spoon.'),
      setup: b('ကြမ်းပြင်ပေါ်တွင် အတူ ထိုင်ပါ။ ပစ္စည်းများ သန့်ရှင်း၍ အစိတ်အပိုင်း မကျွတ်ကြောင်း စစ်ပါ။', 'Sit together on the floor. Check the items are clean and have no parts that can come loose.'),
      instructions: [
        b('ဇွန်းဖြင့် ခွက်ကို ဖြေးညှင်းစွာ သုံးချက် ရိုက်ပါ။', 'Tap the bowl gently three times.'),
        b('ရပ်၍ ကလေးကို ကြည့်ပါ — ၅ စက္ကန့် စောင့်ပါ။', 'Stop, look at her, and wait five seconds.'),
        b('ကလေး ရိုက်လျှင် သို့မဟုတ် အသံထွက်လျှင် ချီးကျူးပြီး ပြန်ရိုက်ပါ။', 'If she taps or makes a sound, praise her and tap back.'),
        b('အသံ ကျယ်လိုက် တိုးလိုက် ပြောင်းပြပါ။', 'Show her a loud beat and a soft beat.'),
        b('သီချင်း တစ်ပုဒ်ကို တူညီသော အချိန်တွင် ဆိုပေးပါ — အမြဲ တူညီသော သီချင်း ဖြစ်စေပါ။', 'Sing the same short song each time so it becomes familiar.'),
        b('ကလေး မောလျှင် ရပ်ပါ။', 'Stop when she tires.'),
      ],
      safety: b('အသံ ကျယ်လောင်စွာ မရိုက်ပါနှင့် — ကလေး၏ နားကို ထိခိုက်နိုင်သည်။ ပါးစပ်ထဲ ဝင်နိုင်သော ပစ္စည်း မထားပါနှင့်။ ကြိုးရှည်၊ ပလတ်စတစ်အိတ် ဝေးအောင် ထားပါ။ ကလေးအနီးတွင် အမြဲ ရှိနေပါ။', 'Keep the sound soft — loud banging can hurt her ears. Nothing small enough to fit in her mouth. Keep long cords and plastic bags away. Stay beside her.'),
      indoor: true, outdoor: true, oneChild: true, group: true, parentChild: true,
      outcomes: [
        b('အကြောင်းနှင့် အကျိုး နားလည်မှုနှင့် အလှည့်ကျမှုကို အားပေးရန်။', 'Learning objective — to build cause-and-effect understanding and turn-taking.'),
        b('အသံနှင့် စည်းချက်ကို အာရုံစိုက်နိုင်မှု တိုးတက်ခြင်း။', 'Better attention to sound and rhythm.'),
      ],
      variations: [b('မိသားစုဝင် အသီးသီးက အလှည့်ကျ ရိုက်ပြပါ။', 'Let each family member take a turn with the beat.')],
      lowCost: true,
      offline: true,
      tags: ['music_activity', 'daily'],
    }),
    'Simple turn-taking play with sound follows the WHO Care for Child Development counselling materials, the AAP power-of-play report and the developmental-behavioural paediatrics textbook in the registry.',
  ),
  kb(
    activity({
      slug: 'two_texture_spoons',
      title: b('အထိအတွေ့ နှစ်မျိုး ဇွန်းကစား', 'Two-texture spoon play'),
      summary: b('အထိအတွေ့ ကွဲပြားသော အစားအစာ နှစ်မျိုးကို ကိုင်တွယ် စမ်းသပ်ခွင့် ပေးခြင်း။', 'Let your baby explore two foods with different textures during a meal.'),
      ageGroupKey: '7_9m',
      domains: ['self_help', 'nutrition', 'fine_motor'],
      difficulty: 'easy',
      durationMinutes: 15,
      materials: b('ကလေး၏ ဇွန်း နှစ်ချောင်း၊ ချောမွေ့သော အစားအစာ တစ်မျိုး (ဥပမာ ဆန်ပြုတ်) နှင့် အသက်အရွယ်နှင့် ကိုက်ညီသော ပုံသဏ္ဌာန်၊ အရွယ်အစားဖြင့် ပြင်ဆင်ထားသည့် နူးညံ့သော လက်ဖြင့်ကိုင်စားနိုင်သည့် အစားအစာ တစ်မျိုး။', 'Two baby spoons, one smooth food such as thick porridge, and one soft finger food prepared in an age-appropriate shape and size.'),
      setup: b('လက်ဆေးပါ။ ကလေးကို မတ်မတ် ထိုင်စေပါ။ ကြမ်းပြင်တွင် သတင်းစာ ခင်းထားနိုင်သည်။', 'Wash hands. Seat her upright. Spread paper on the floor if you like.'),
      instructions: [
        b('ကလေး၏ လက်ထဲသို့ ဇွန်း တစ်ချောင်း ပေးပါ — သင် နောက်တစ်ချောင်းဖြင့် ကျွေးပါ။', 'Give her one spoon to hold while you feed with the other.'),
        b('ချောမွေ့သော အစားအစာကို အနည်းငယ် ကျွေးပါ။', 'Offer a little of the smooth food.'),
        b('အသက်အရွယ်နှင့် ကိုက်ညီသော ပုံသဏ္ဌာန်နှင့် အရွယ်အစားဖြင့် ပြင်ဆင်ထားသည့် လက်ဖြင့်ကိုင်စားနိုင်သော နူးညံ့သည့် အစားအစာတစ်ပိုင်းကို ကလေးရှေ့တွင် ချထား၍ ကိုင်စားခွင့်ပေးပါ။', 'Place one piece of soft finger food prepared in an age-appropriate shape and size in front of the child to pick up.'),
        b('ဖိတ်စင်ခြင်း၊ ပွတ်သပ်ခြင်းကို ခွင့်ပြုပါ — ဤသည် သင်ယူမှု ဖြစ်သည်။', 'Allow mess and squeezing — that is how she learns.'),
        b('ကလေး မျက်နှာလွှဲလျှင် သို့မဟုတ် ခေါင်းလှည့်လျှင် ရပ်ပါ — အတင်း မကျွေးပါနှင့်။', 'Stop when she turns her head away — never force a feed.'),
        b('အစားအစာ အသစ် တစ်မျိုးကို အကြိမ်ပေါင်း များစွာ ပြန်ပေးရနိုင်သည်။', 'A new food may need to be offered many times before she takes it.'),
      ],
      safety: b('စားနေစဉ် ကလေးအား တစ်ယောက်တည်း လုံးဝ မထားပါနှင့် — အမြဲ စောင့်ကြည့်ပါ။ မတ်မတ် ထိုင်စေပါ။ အခွံမာသီး အလုံးလိုက်၊ စပျစ်သီး အလုံးလိုက်၊ မာသော အတုံးများ မပေးပါနှင့် — လည်ချောင်း ပိတ်နိုင်သည်။ ၁၂ လ မပြည့်မီ ပျားရည် လုံးဝ မကျွေးပါနှင့်။ ဆား၊ သကြား မထည့်ပါနှင့်။ နွားနို့ကို ၁၂ လ မပြည့်မီ အဓိက သောက်စရာအဖြစ် မပေးပါနှင့်။ နို့ဗူးကို မထောင်ထားပါနှင့်။ ပူသော အရည်များကို ဝေးအောင် ထားပါ။', 'Never leave her alone while eating — always supervise. Keep her seated upright. No whole nuts, whole grapes or hard chunks, which can block the airway. No honey before 12 months. No added salt or sugar. Cow’s milk should not be her main drink before 12 months. Never prop a bottle. Keep hot liquids out of reach.'),
      indoor: true, outdoor: false, oneChild: true, group: false, parentChild: true,
      outcomes: [
        b('ကိုယ်တိုင် စားခြင်းနှင့် အထိအတွေ့ အမျိုးမျိုးကို လက်ခံနိုင်မှုကို အားပေးရန်။', 'Learning objective — to encourage self-feeding and acceptance of varied textures.'),
        b('လက်ချောင်း ကိုင်တွယ်မှုနှင့် ပါးစပ် လှုပ်ရှားမှု တိုးတက်ခြင်း။', 'Improving hand grasp and mouth control.'),
      ],
      variations: [b('မိသားစု၏ ချက်ပြုတ်ပြီး အစားအစာကို ဆား မထည့်ဘဲ ချေ၍ ပေးနိုင်သည်။', 'Mash a portion of the family meal before any salt is added.')],
      lowCost: true,
      offline: true,
      tags: ['sensory_activity', 'feeding'],
    }),
    'Responsive self-feeding and progression to lumpy and finger foods in this period follow the WHO infant and young child feeding model chapter, CDC guidance on foods for children aged 6–24 months and the paediatric occupational-therapy textbook in the registry.',
  ),
];

const PRINTABLES: SeedItem[] = [
  kb(
    printable({
      key: 'checklist_7_9m',
      title: b('၇–၉ လ မိဘ စစ်ဆေးစာရင်း', '7–9 month parent checklist'),
      description: b('၇–၉ လအရွယ်တွင် များသောအားဖြင့် တွေ့ရလေ့ရှိသည့် အချက်များ၊ နေ့စဉ် လုပ်ဆောင်နိုင်သည့် အရာများနှင့် ဆရာဝန်နှင့် ပြသင့်သည့် အချက်များကို ပုံနှိပ်၍ သုံးနိုင်သော စာရွက်။ ဤသည် ရောဂါရှာဖွေရေး စစ်ဆေးမှု မဟုတ်ပါ — မိဘများ လေ့လာမှတ်သားရန်နှင့် ဆရာဝန်နှင့် ပြောဆိုရန် အထောက်အကူ စာရွက်သာ ဖြစ်သည်။', 'A printable sheet of what is often seen between 7 and 9 months, what you can do each day, and what to raise with a health worker. This is not a screening or diagnostic test — it is a guidance sheet to help you observe and to help you talk with your health worker.'),
      format: 'A4 PDF',
    }),
    'The observation prompts follow CDC milestone checklists and AAP milestone guidance, the feeding prompts follow the WHO infant and young child feeding model chapter, the sleep prompts follow AAP safe-sleep guidance, and the schedule of routine reviews follows NHS baby review guidance.',
  ),
];

export const M7_9M: SeedItem[] = [
  ...MILESTONES, ...GUIDES, ...GUIDES_B, ...GUIDES_C,
  ...GUIDES_D, ...GUIDES_E, ...ACTIVITIES, ...ACTIVITIES_B, ...PRINTABLES,
];
