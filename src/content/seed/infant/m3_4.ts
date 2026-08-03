// Knowledge base — 3 to 4 months.
//
// Authored against the verified evidence registry and linked explicitly in
// src/evidence/links.ts. Nothing here diagnoses, predicts a disorder, or
// promises an outcome. Normal variation is stated wherever a range is given.
import { activity, guide, milestone, printable, type SeedItem } from '../../types';
import { kb } from './editorial';

const b = (mm: string, en: string) => ({ mm, en });

const MILESTONES: SeedItem[] = [
  kb(
    milestone('3_4m', 'gross_motor', 2, {
      title: b('မှောက်ချထားစဉ် လက်မောင်းဖြင့် ထောက်၍ ရင်ဘတ် မြှင့်နိုင်ခြင်း', 'Pushes up on the forearms during tummy time'),
      observe: b('မှောက်ချထားစဉ် လက်မောင်းနှစ်ဖက်ဖြင့် ထောက်ပြီး ရင်ဘတ်ကို ကြမ်းပြင်မှ မြှင့်နိုင်ပါသလား။', 'During tummy time, does your baby push up on both forearms and lift the chest off the floor?'),
      why: b('ဤအနေအထားသည် ပခုံးနှင့် ကျောကုန်း အားကောင်းလာခြင်းကို ပြသည်။ နောင်တွင် လှိမ့်ခြင်း၊ ထိုင်ခြင်းအတွက် အခြေခံ ဖြစ်သည်။', 'This shows growing shoulder and back strength, and it is the base for rolling and later sitting.'),
      red: b('လ ၄ လအရွယ်တွင် မှောက်ချစဉ် ခေါင်းကို လုံးဝ မထောင်နိုင်ခြင်းကို ကျန်းမာရေးဝန်ထမ်းအား ပြသင့်သည်။', 'By 4 months, no head lifting at all during tummy time should be checked by a health worker.'),
      encouragement: b('နေ့စဉ် မှောက်ချချိန်ကို တဖြည်းဖြည်း တိုးပေးပါ။', 'Build up daily tummy time gradually.'),
    }),
    'Prone push-up on forearms at 3–4 months is described in AAP and CDC milestone guidance and in paediatric physical-therapy references in the registry.',
  ),
  kb(
    milestone('3_4m', 'fine_motor', 2, {
      title: b('လက်နှစ်ဖက်ကို အလယ်တွင် ပေါင်း၍ ပစ္စည်းကို ရိုက်ကြည့်ခြင်း', 'Brings hands together and swipes at objects'),
      observe: b('လက်နှစ်ဖက်ကို ရင်ဘတ်အလယ်တွင် ပေါင်းတတ်ပါသလား။ ရှေ့တွင် ချိတ်ဆွဲထားသော ပစ္စည်းကို ရိုက်ကြည့်ပါသလား။', 'Do the hands come together in the middle? Does your baby swipe at something held in front?'),
      why: b('လက်နှစ်ဖက် ပူးပေါင်းအလုပ်လုပ်ခြင်းသည် နောင် ကိုင်တွယ်မှုအတွက် အရေးကြီးသော အဆင့် ဖြစ်သည်။', 'Using the two hands together is an important step towards reaching and holding.'),
      red: b('လ ၄ လအရွယ်တွင် လက်များ အမြဲ တင်းကျပ်ဆုပ်ထားပြီး လုံးဝ မဖြန့်ခြင်းကို ပြသင့်သည်။', 'At 4 months, hands that stay tightly fisted and never open should be checked.'),
      encouragement: b('ပစ္စည်းကို ကလေးရင်ဘတ်အထက် ဖြည်းညှင်းစွာ ကိုင်ပြပါ။', 'Hold an object just above the chest and let your baby swipe.'),
    }),
    'Midline hand play and swiping at 3–4 months are described in AAP milestone guidance, CDC milestone checklists and paediatric occupational-therapy references in the registry.',
  ),
  kb(
    milestone('3_4m', 'speech', 1, {
      title: b('အသံငယ်များ ထွက်ခြင်းနှင့် ရယ်မောခြင်း', 'Coos, gurgles and laughs out loud'),
      observe: b('"အာ"၊ "အူ" ကဲ့သို့ အသံငယ်များ ထွက်ပါသလား။ ကစားနေစဉ် ရယ်မောပါသလား။', 'Do you hear cooing sounds like "ah" and "oo"? Does your baby laugh during play?'),
      why: b('ဤအသံများသည် စကားပြောခြင်း၏ လေ့ကျင့်ခန်း ဖြစ်သည်။ မိဘက ပြန်တုံ့ပြန်ပေးလျှင် ပိုမို ထွက်လာသည်။', 'These sounds are speech practice. They increase when a parent answers back.'),
      red: b('လ ၄ လအရွယ်တွင် အသံ လုံးဝ မထွက်ခြင်း သို့မဟုတ် အသံကို လုံးဝ မတုံ့ပြန်ခြင်းကို ပြသင့်သည်။', 'At 4 months, making no sounds at all, or not responding to sound, should be checked.'),
      encouragement: b('ကလေး ထွက်သော အသံကို အတုယူ ပြန်ဆိုပေးပါ။', 'Copy the sounds your baby makes and say them back.'),
    }),
    'Cooing and laughing at 3–4 months follow CDC and AAP milestone guidance and NHS learn-to-talk advice.',
  ),
  kb(
    milestone('3_4m', 'language', 1, {
      title: b('အသံလာရာဘက်သို့ လှည့်ကြည့်ခြင်း', 'Turns towards a voice or sound'),
      observe: b('သင် ဘေးမှ ခေါ်လိုက်လျှင် ကလေး ခေါင်းလှည့်ကြည့်ပါသလား။', 'If you speak from the side, does your baby turn to look?'),
      why: b('အသံလာရာကို ရှာဖွေခြင်းသည် နားကြားခြင်းနှင့် ဘာသာစကား နားလည်မှု၏ အစ ဖြစ်သည်။', 'Locating sound is the beginning of hearing-based language learning.'),
      red: b('ကျယ်လောင်သော အသံကို လုံးဝ မတုံ့ပြန်ခြင်းအတွက် နားကြားစမ်းသပ်မှု တောင်းခံပါ။', 'No response at all to loud sound — ask for a hearing check.'),
      encouragement: b('ဘေးနှစ်ဖက်မှ လှည့်ပြောင်း၍ ခေါ်ကြည့်ပါ။', 'Call your baby from alternating sides.'),
    }),
    'Sound localisation at this age follows CDC and AAP milestone guidance and the AAP developmental-surveillance report; the wording about hearing and early language draws on the language-development textbook and the conversational-turns research in the registry.',
  ),
  kb(
    milestone('3_4m', 'social', 1, {
      title: b('လူကို မြင်လျှင် ပြုံးပြီး ဆက်ဆံလိုခြင်း', 'Smiles at people and enjoys interaction'),
      observe: b('သင့်ကို မြင်လျှင် ပြုံးပါသလား။ ကစားရပ်လိုက်လျှင် ဆက်လုပ်ရန် တောင်းဆိုပါသလား။', 'Does your baby smile when she sees you? Does she protest when play stops?'),
      why: b('လူမှုပြုံးခြင်းသည် ဆက်ဆံရေး တည်ဆောက်မှု၏ အခြေခံ ဖြစ်သည်။', 'Social smiling is the foundation of relationship building.'),
      red: b('လ ၄ လအရွယ်တွင် လုံးဝ မပြုံးခြင်းကို ကျန်းမာရေးဝန်ထမ်းအား ပြပါ။', 'No smiling at all by 4 months should be raised with a health worker.'),
      encouragement: b('ပြုံးပြီး စောင့်ပါ — ကလေး ပြန်ပြုံးရန် အချိန်ပေးပါ။', 'Smile, then wait — give your baby time to smile back.'),
    }),
    'Social smiling and interactive play at 3–4 months follow CDC and AAP milestone guidance and the social-emotional development guidance in the registry.',
  ),
  kb(
    milestone('3_4m', 'cognitive', 1, {
      title: b('ရွေ့လျားနေသော အရာကို မျက်လုံးဖြင့် လိုက်ကြည့်ခြင်း', 'Follows a moving object with the eyes'),
      observe: b('ပစ္စည်းတစ်ခုကို ဖြည်းညှင်းစွာ ရွှေ့ပြလျှင် မျက်လုံးဖြင့် လိုက်ကြည့်ပါသလား။ ကိုယ့်လက်ကို စိုက်ကြည့်တတ်ပါသလား။', 'Do the eyes follow an object moved slowly? Does your baby stare at her own hands?'),
      why: b('လိုက်ကြည့်ခြင်းနှင့် ကိုယ့်လက်ကို ကြည့်ခြင်းသည် အာရုံစိုက်မှုနှင့် ကိုယ်ခန္ဓာ သိရှိမှု တိုးတက်နေကြောင်း ပြသည်။', 'Tracking and hand-watching show growing attention and body awareness.'),
      red: b('မျက်လုံးများ ဆက်တိုက် ချိန်မကိုက်ခြင်း၊ လိုက်ကြည့်မှု လုံးဝ မရှိခြင်းကို မျက်စိစစ်ဆေးရန် ပြပါ။', 'Eyes that are persistently not aligned, or no tracking at all, should have an eye check.'),
      encouragement: b('ဖြည်းညှင်းစွာ ရွှေ့ပါ — မြန်လွန်းလျှင် လိုက်ကြည့်ရ ခက်သည်။', 'Move slowly — fast movement is hard to follow.'),
    }),
    'Visual tracking and hand regard at 3–4 months follow AAP and CDC milestone guidance and standard paediatric developmental references in the registry.',
  ),
  kb(
    milestone('3_4m', 'nutrition', 1, {
      title: b('မိခင်နို့တစ်မျိုးတည်း ဆက်လက် စို့ခြင်း', 'Still feeding on milk alone'),
      observe: b('ကလေးသည် နို့တစ်မျိုးတည်းဖြင့် ကျေနပ်နေပါသလား။ ကိုယ်အလေးချိန် တဖြည်းဖြည်း တက်နေပါသလား။', 'Is your baby content on milk alone? Is weight rising steadily?'),
      why: b('အသက် ၆ လအထိ မိခင်နို့တစ်မျိုးတည်း တိုက်ကျွေးရန် အကြံပြုထားသည်။ ဤအရွယ်တွင် အစားအစာ မစသင့်သေးပါ။', 'Exclusive breastfeeding is recommended to about 6 months. Solid foods are not needed yet at this age.'),
      red: b('ကိုယ်အလေးချိန် မတက်ခြင်း၊ နို့စို့ရန် ငြင်းဆန်ခြင်းကို ကျန်းမာရေးဝန်ထမ်းအား ပြပါ။', 'Weight not rising, or refusing feeds, should be checked by a health worker.'),
      encouragement: b('ဆာလောင်လက္ခဏာအလိုက် ဆက်လက် တိုက်ကျွေးပါ။', 'Keep feeding on cue.'),
    }),
    'Exclusive milk feeding to around six months follows WHO complementary-feeding guidance, the WHO infant and young child feeding model chapter and NHS advice on starting solid foods in the registry.',
  ),
  kb(
    milestone('3_4m', 'sleep', 1, {
      title: b('ညအိပ်ချိန် ပိုရှည်လာခြင်း', 'Night sleep starts to lengthen'),
      observe: b('ညဘက်တွင် အိပ်ချိန် ပိုရှည်လာပါသလား။ နေ့နှင့် ည ခွဲခြားလာပါသလား။', 'Are night stretches getting longer? Is a day–night difference appearing?'),
      why: b('အသက် ၄–၁၁ လအရွယ်တွင် စုစုပေါင်း အိပ်ချိန် ၁၂–၁၆ နာရီခန့် ဖြစ်တတ်သည် (နေ့အိပ် အပါအဝင်)။ ကွာဟမှု များပါသည်။ ညဘက် နိုးခြင်းသည် ဤအရွယ်တွင် ပုံမှန် ဖြစ်သည်။', 'Total sleep at 4–11 months is commonly about 12–16 hours including naps, with wide variation. Waking at night is normal at this age.'),
      red: b('နိုးရန် အလွန်ခက်ခဲခြင်း၊ အသက်ရှူ ရပ်တန့်ခြင်း၊ အသံမြည်၍ အသက်ရှူခြင်းကို ချက်ချင်း ပြသပါ။', 'Very hard to rouse, pauses in breathing, or noisy laboured breathing need prompt medical review.'),
      encouragement: b('ညဘက် နိုးခြင်းသည် အမှား မဟုတ်ပါ — အလှည့်ကျ ကူညီပေးမည့်သူ ရှာပါ။', 'Night waking is not a failure — arrange to share the load.'),
    }),
    'Sleep amounts at 4–11 months follow WHO physical activity and sleep guidance for under-5s; the safe-sleep points follow AAP safe-sleep guidance and NHS guidance on reducing the risk of sudden infant death in the registry, and the urgent-symptom wording is kept conservative and directs parents to a health worker.',
  ),
  kb(
    milestone('3_4m', 'social', 2, {
      title: b('ရိုးရှင်းသော မျက်နှာအမူအရာများကို အတုယူခြင်း', 'Mimics simple facial expressions'),
      observe: b(
        'သင်လျှာထုတ်ပြ သို့မဟုတ် ပါးစပ်ကျယ်ကျယ်ဖွင့်ပြလျှင် ကလေးက အတုလိုက်လုပ်ကြည့်ပါသလား။',
        'If you stick out your tongue or open your mouth wide, does your baby try to copy it?',
      ),
      why: b(
        'မျက်နှာအမူအရာ အတုယူခြင်းသည် မိဘနှင့် အာရုံစိုက်မျှဝေမှုနှင့် ဆက်သွယ်ပြောဆိုမှု အစောပိုင်း လက္ခဏာတစ်ခု ဖြစ်သည်။',
        'Imitating a face is an early sign of shared attention and back-and-forth communication with a caregiver.',
      ),
      encouragement: b(
        'ကလေးမျက်နှာအနီးတွင် ဖြည်းညှင်းစွာ မျက်နှာအမူအရာအမျိုးမျိုး ပြပြီး တုံ့ပြန်လာအောင် စောင့်ကြည့်ပါ။',
        'Make slow, simple faces close to your baby and pause to see if they try to copy you.',
      ),
    }),
    'Early face imitation in infants is described in the WHO Care for Child Development counselling materials and the responsive-caregiving research in the registry.',
  ),
];

// --- Guides ----------------------------------------------------------------

const GUIDES: SeedItem[] = [
  kb(
    guide('3_4m', 'gross_motor', {
      title: b('၃ – ၄ လ — ကိုယ်လုံးလှုပ်ရှားမှု လမ်းညွှန်', '3–4 months — Big movement guide'),
      why: b(
        'ဤအရွယ်တွင် ခေါင်းထိန်းနိုင်မှု သိသိသာသာ တိုးတက်လာသည်။ မှောက်ချထားစဉ် လက်မောင်းဖြင့် ထောက်၍ ရင်ဘတ်ကို မြှောက်နိုင်လာသည်။ ပက်လက်အိပ်စဉ် ခြေထောက်များကို ကန်ခြင်း၊ တစ်ဖက်သို့ လှိမ့်ရန် ကြိုးစားခြင်းများ စတင်တတ်သည်။ ကလေးတိုင်း အချိန်မတူ ရောက်ကြသည် — ကွာဟမှု ကျယ်ပါသည်။',
        'Head control improves clearly at this age. During tummy time your baby starts to push up on the forearms and lift the chest. On the back she kicks strongly and may begin to twist towards a roll. Babies reach this at different times — the range is wide.',
      ),
      observationQuestions: [
        b('မှောက်ချထားစဉ် လက်မောင်းဖြင့် ထောက်၍ ရင်ဘတ်ကို မြှောက်နိုင်ပါသလား။', 'During tummy time, does your baby push up on the forearms and lift the chest?'),
        b('ပွေ့ချီစဉ် ခေါင်းကို မတ်မတ် ထားနိုင်ပါသလား။', 'When held upright, does the head stay steady?'),
        b('ခြေထောက် နှစ်ဖက်စလုံးကို အားရှိရှိ ကန်ပါသလား။', 'Does she kick strongly with both legs?'),
      ],
      dailyActivities: [
        b('နိုးနေချိန် မှောက်ချချိန်ကို တစ်ရက် စုစုပေါင်း ၁၅–၃၀ မိနစ်ခန့်အထိ တဖြည်းဖြည်း တိုးပါ (အကြိမ်ခွဲ၍)။', 'Build supervised tummy time up towards a total of about 15–30 minutes a day, in short sessions.'),
        b('ကလေးရှေ့တွင် ပစ္စည်းတစ်ခုကို ထားပြီး ကြည့်ရန်၊ လှမ်းရန် ဖိတ်ခေါ်ပါ။', 'Place a toy just in front so she looks up and reaches.'),
        b('အဝတ်လဲချိန်တွင် ခြေထောက်များကို နူးညံ့စွာ စက်ဘီးနင်းသလို လှုပ်ပေးပါ။', 'At nappy changes, gently cycle the legs.'),
      ],
      weeklyActivities: [
        b('ဘေးတစ်ဖက်စီ လှဲပေး၍ ကစားပါ — လှိမ့်ရန် ပြင်ဆင်မှု ဖြစ်သည်။', 'Play with your baby lying on each side in turn — this prepares for rolling.'),
        b('ကိုင်တွယ်ပွေ့ချီသည့် ဘက်ကို လဲလှယ်ပါ။', 'Alternate which side you carry her on.'),
      ],
      indoor: [
        b('ကြမ်းပြင်ပေါ် အဝတ်ခင်း၍ လွတ်လပ်စွာ လှုပ်ရှားခွင့် ပေးပါ။', 'Free floor play on a clean cloth.'),
        b('မှန်ရှေ့တွင် မှောက်ချပေးပါ။', 'Tummy time in front of a mirror.'),
      ],
      outdoor: [
        b('အရိပ်ရသော လေကောင်းလေသန့် နေရာတွင် ပွေ့ချီ၍ လမ်းလျှောက်ပါ။', 'Carried walks in shaded, airy places.'),
      ],
      lowCost: [
        b('ခေါက်ထားသော ပုဆိုးကို ရင်ဘတ်အောက် ခံပေးပါ။', 'A folded longyi under the chest for support.'),
        b('အိမ်တွင်း သတ္တုပန်းကန်၊ အရောင်တောက်ပစ္စည်းကို ကြည့်စေပါ။', 'A shiny plate or bright household item to look towards.'),
      ],
      materials: b('အဝတ်ခင်း၊ ခေါက်ထားသော ပုဆိုး၊ ကစားစရာ တစ်ခု', 'A floor cloth, a folded cloth, one simple toy'),
      safety: b(
        'မှောက်ချထားစဉ် တစ်စက္ကန့်မျှ မခွာပါနှင့်။ အိပ်ချိန်တိုင်းတွင် ပက်လက် အိပ်စေပါ။ ကုတင်၊ စားပွဲ စသည့် မြင့်သောနေရာပေါ်တွင် တစ်ယောက်တည်း မထားပါနှင့် — ဤအရွယ်တွင် လှိမ့်ကျနိုင်သည်။',
        'Never leave your baby alone during tummy time. Back to sleep for every sleep. Never leave her alone on a bed or table — babies can roll off at this age.',
      ),
      commonMistakes: [
        b('ကားထိုင်ခုံ၊ ကလေးထိုင်ခုံတွင် ကြာရှည် ထားခြင်း။', 'Long stretches in a car seat or bouncer.'),
        b('ထိုင်ရန် အတင်း လေ့ကျင့်ပေးခြင်း — ကျောရိုးအတွက် မလိုအပ်ပါ။', 'Forcing sitting practice — it is not needed and does not help the spine.'),
        b('မှောက်ချချိန် လုံးဝ မလုပ်ပေးခြင်း။', 'Skipping tummy time altogether.'),
      ],
      parentTips: [
        b('သင်လည်း ကြမ်းပြင်ပေါ် အတူ မှောက်ချပါ — ကလေး ပိုကြိုက်တတ်သည်။', 'Lie down on the floor with her — babies join in more when you do.'),
        b('ငိုလျှင် ရပ်ပါ၊ နောက်မှ ပြန်စပါ။', 'If she cries, stop and try again later.'),
      ],
      faq: [
        {
          q: b('ကလေး လှိမ့်ဖို့ မကြိုးစားသေးဘူး။ နောက်ကျနေပြီလား။', 'My baby is not trying to roll yet. Is she late?'),
          a: b('လှိမ့်ခြင်းသည် များသောအားဖြင့် ၄ လမှ ၆ လကြားတွင် စတတ်သည် — ကွာဟမှု ကျယ်ပါသည်။ မှောက်ချချိန် ပုံမှန် ရနေပြီး ခေါင်းထိန်းနိုင်မှု တိုးတက်နေလျှင် စောင့်ကြည့်ရုံဖြင့် ရပါသည်။', 'Rolling usually appears somewhere between 4 and 6 months, with wide variation. If she gets regular tummy time and head control is improving, watching is usually enough.'),
        },
        {
          q: b('ထိုင်ခုံနဲ့ ထိုင်သင်ပေးသင့်လား။', 'Should I use a seat to teach sitting?'),
          a: b('မလိုအပ်ပါ။ ကြမ်းပြင်ပေါ် လွတ်လပ်စွာ လှုပ်ရှားခွင့်ပေးခြင်းက ကြွက်သားများကို ပိုအားကောင်းစေသည်။', 'It is not needed. Free movement on the floor builds the muscles better.'),
        },
      ],
      redFlags: [
        b('လ ၄ လအရွယ်တွင် ပွေ့ချီစဉ် ခေါင်းကို လုံးဝ မထိန်းနိုင်ခြင်း။', 'At 4 months, no head control at all when held upright.'),
        b('ကိုယ်ခန္ဓာ အလွန် ပျော့ခွေခြင်း သို့မဟုတ် အလွန် တောင့်တင်းခြင်း။', 'A body that is very floppy or very stiff.'),
        b('တစ်ဖက်ခြမ်းကိုသာ အမြဲ သုံးနေခြင်း။', 'Consistent use of one side of the body only.'),
      ],
      referral: b(
        'ဤလက္ခဏာများ တွေ့ပါက ကျန်းမာရေးဝန်ထမ်း သို့မဟုတ် ကလေးဆရာဝန်ထံ ပြသပါ။ ဤသည် ရောဂါဖော်ထုတ်ချက် မဟုတ်ပါ — စစ်ဆေးရန် အချက်ပြခြင်းသာ ဖြစ်သည်။',
        'If you notice these, ask a health worker or paediatrician to check. This is not a diagnosis — it is a prompt for a look.',
      ),
      encouragement: b(
        'ကလေးနှင့် ကြမ်းပြင်ပေါ် အတူနေပေးသော မိနစ်တိုင်းသည် အလုပ်ဖြစ်နေပါသည်။',
        'Every minute you spend on the floor beside your baby is doing real work.',
      ),
    }),
    'Motor progression at 3–4 months (forearm push-up, steady head, rolling from around 4–6 months) follows CDC and AAP milestone guidance; the roll-off and safe-sleep cautions follow AAP safe sleep guidance.',
  ),
  kb(
    guide('3_4m', 'fine_motor', {
      title: b('၃ – ၄ လ — လက်ချောင်းငယ် လှုပ်ရှားမှု လမ်းညွှန်', '3–4 months — Hands and reaching guide'),
      why: b(
        'ကလေး၏ လက်များသည် အမြဲလက်သီးဆုပ်ထားရာမှ တဖြည်းဖြည်း ဖြန့်လာပြီး ရင်ဘတ်အလယ်တွင် လက်နှစ်ဖက် ဆုံလာတတ်သည်။ မိမိလက်ကို စိုက်ကြည့်ခြင်းနှင့် ပစ္စည်းကို လှမ်းပုတ်ရန် ကြိုးစားခြင်းတို့လည်း စတင်တွေ့ရနိုင်သည်။ ကိုင်မိသောပစ္စည်းကို ပါးစပ်ဖြင့် စူးစမ်းခြင်းသည် ဤအရွယ်၏ သင်ယူနည်းတစ်ခု ဖြစ်သည်။',
        'Hands open out from the early fist and come together at the middle of the chest. Babies stare at their own hands, and swipe at things they see. Bringing what they catch to the mouth is normal learning, not a bad habit.',
      ),
      observationQuestions: [
        b('လက်နှစ်ဖက် ရင်ဘတ်အလယ်တွင် ဆုံနိုင်ပါသလား။', 'Do the two hands meet in the middle?'),
        b('ရှေ့တွင် ချိတ်ထားသော ပစ္စည်းကို လှမ်းပုတ်ပါသလား။', 'Does she swipe at something held in front of her?'),
        b('ကိုင်ထားသော ပစ္စည်းကို ခဏ ဆုပ်ကိုင်နိုင်ပါသလား။', 'Can she hold on to something placed in her hand for a moment?'),
      ],
      dailyActivities: [
        b('ကလေးရင်ဘတ်အထက် ၂၀–၃၀ စင်တီမီတာခန့်တွင် ပစ္စည်းတစ်ခု ကိုင်ပြပါ။', 'Hold a toy about 20–30 cm above her chest for her to swipe at.'),
        b('လက်နှစ်ဖက်ကို နူးညံ့စွာ ပေါင်းစည်းပေးပြီး သီချင်းဆိုပါ။', 'Gently bring her hands together while you sing.'),
        b('မတူညီသော အထိအတွေ့ရှိ အဝတ်စများကို ကိုင်ခွင့်ပေးပါ။', 'Let her hold cloths with different textures.'),
      ],
      weeklyActivities: [
        b('ကစားစရာကို ဘယ်ဘက်၊ ညာဘက် လဲလှယ်၍ ပြပါ။', 'Offer toys to the left and right in turn.'),
        b('အသံထွက်သော ပစ္စည်း (ဆန်ထည့် ဗူးခွံ) ကို လက်ထဲ ထည့်ပေးပါ။', 'Put a rattle (a sealed tin with rice) into her hand.'),
      ],
      indoor: [
        b('ကြမ်းပြင်ပေါ် ပက်လက်လှဲ၍ လက်လှမ်းကစားခြင်း။', 'Reaching play on the back, on the floor.'),
        b('နို့တိုက်ပြီးနောက် လက်ချောင်းများကို ဖြေးညှင်းစွာ ပွတ်သပ်ပေးခြင်း။', 'Gentle finger massage after feeds.'),
      ],
      outdoor: [
        b('အရိပ်အောက်တွင် သစ်ရွက် လှုပ်ရှားမှုကို ကြည့်စေခြင်း (လက်လှမ်း မမီစေရ)။', 'Watching leaves move in the shade — out of reach.'),
      ],
      lowCost: [
        b('ပလတ်စတစ် ဇွန်း၊ သစ်သားခွက် — အနားချွန်ကင်းပြီး သန့်ရှင်းသည့်အရာများ။', 'A plastic spoon or wooden cup — smooth-edged and clean.'),
        b('ရောင်စုံ အဝတ်စ ကြိုးကို ကိုင်စေခြင်း။', 'A strip of coloured cloth to hold.'),
      ],
      materials: b('အသေးအမွှား မဟုတ်သော ကစားစရာ၊ အဝတ်စ၊ အသံမြည် ဗူး', 'A toy larger than the mouth, cloths, a simple rattle'),
      safety: b(
        'ကလေးပါးစပ်ထဲ ဝင်နိုင်သော အသေးစား ပစ္စည်း (အုန်းသီးအခွံစ၊ ခလုတ်၊ အကြွေစေ့) မပေးပါနှင့် — လည်ချောင်းပိတ် နိုင်သည်။ ကြိုးရှည်၊ ပလတ်စတစ်အိတ် မပေးပါနှင့်။ ကစားစရာများကို သန့်ရှင်းစွာ ထားပါ။',
        'Never give anything small enough to fit in the mouth — buttons, coins, shells — it can choke. No long cords or plastic bags. Keep toys clean.',
      ),
      commonMistakes: [
        b('ပါးစပ်ထဲ ထည့်တာကို လုံးဝ တားခြင်း — သင်ယူမှု ဖြစ်သည်။ ပစ္စည်းကို သန့်ရှင်းစေရန်သာ လိုသည်။', 'Stopping mouthing completely — it is how babies learn. Keep the object safe and clean instead.'),
        b('ကလေးလက်ကို အမြဲ အိတ်စွပ်ထားခြင်း။', 'Keeping mittens on all the time.'),
      ],
      parentTips: [
        b('ကလေး ကိုင်မိတိုင်း အသံဖြင့် ချီးကျူးပါ — ထပ်ကြိုးစားရန် အားပေးသည်။', 'Cheer each catch — it encourages the next try.'),
        b('ကစားစရာ များစွာ မလိုပါ — တစ်ခုကို အချိန်ကြာကြာ လေ့လာစေခြင်းက ပိုကောင်းသည်။', 'Few toys are fine — long study of one object is better than many.'),
      ],
      faq: [
        {
          q: b('လက်ကို အမြဲ ပါးစပ်ထဲ ထည့်နေတယ်။ ရောဂါ ရမလား။', 'She always puts her hands in her mouth. Will she get sick?'),
          a: b('ဤသည် ဤအရွယ်တွင် ပုံမှန် ဖြစ်သည်။ လက်နှင့် ကစားစရာများကို သန့်ရှင်းစွာ ထားပါ။ သင်၏လက်ကိုလည်း မကိုင်မီ ဆေးပါ။', 'This is normal at this age. Keep her hands and toys clean, and wash your own hands before handling her.'),
        },
        {
          q: b('တစ်ဖက်လက်ကိုသာ သုံးနေရင် ဘာလုပ်ရမလဲ။', 'What if she uses only one hand?'),
          a: b('ဤအရွယ်တွင် ဘက်တစ်ဖက်ကိုသာ အမြဲသုံးခြင်းသည် ပုံမှန် မဟုတ်ပါ။ ကျန်းမာရေးဝန်ထမ်းအား ပြောပြပါ။', 'A clear hand preference this early is not usual. Mention it to a health worker.'),
        },
      ],
      redFlags: [
        b('လက်နှစ်ဖက် အမြဲ တင်းကျပ်စွာ ဆုပ်ထားပြီး မဖြန့်နိုင်ခြင်း။', 'Hands that stay tightly fisted and never open.'),
        b('လ ၄ လအရွယ်တွင် ပစ္စည်းကို လုံးဝ မလှမ်း၊ မကြည့်ခြင်း။', 'At 4 months, no reaching for or looking at objects at all.'),
        b('တစ်ဖက်လက်ကိုသာ အမြဲ သုံးခြင်း။', 'Consistent use of one hand only.'),
      ],
      referral: b(
        'ဤလက္ခဏာများကို ကျန်းမာရေးဝန်ထမ်းအား ပြသပါ။ ရောဂါ ဖော်ထုတ်ခြင်း မဟုတ်ဘဲ စစ်ဆေးရန် အချက်ပြခြင်းသာ ဖြစ်သည်။',
        'Raise these with a health worker. This is a prompt to check, not a diagnosis.',
      ),
      encouragement: b(
        'ကလေး၏ ပထမဆုံး လှမ်းပုတ်မှုသည် နောင်တစ်နေ့ ခဲတံကိုင်နိုင်ရန် ခြေလှမ်း ဖြစ်ပါသည်။',
        'That first swipe is the beginning of the hand that will one day hold a pencil.',
      ),
    }),
    'Hands-to-midline, hand regard and early swiping at 3–4 months follow CDC and AAP milestone guidance; choking precautions follow AAP guidance and the paediatric occupational-therapy references in the registry.',
  ),
];

const GUIDES_B: SeedItem[] = [
  kb(
    guide('3_4m', 'communication', {
      title: b('၃ – ၄ လ — ဆက်သွယ်ပြောဆိုမှု လမ်းညွှန်', '3–4 months — Communication guide'),
      why: b(
        'ဤအရွယ်တွင် ကလေးသည် "အူး"၊ "အာ" ကဲ့သို့ သရသံများ ထွက်လာပြီး ရယ်မောသံ ကြားရတတ်သည်။ သင်ပြောသောအခါ ခေတ္တရပ်၍ တုံ့ပြန်ခြင်းသည် အပြန်အလှန် စကားပြောခြင်း၏ အခြေခံ ဖြစ်သည်။ ဤ "စကားပြောလှည့်" သည် နောင် ဘာသာစကား ဖွံ့ဖြိုးမှုအတွက် အရေးအကြီးဆုံး အရာ ဖြစ်သည်။',
        'Babies now coo with vowel sounds and may laugh out loud. When you talk, pause and let her answer — this turn-taking is the base of conversation and matters more for later language than any toy.',
      ),
      observationQuestions: [
        b('"အူး"၊ "အာ" ကဲ့သို့ သံများ ထွက်ပါသလား။', 'Does she make cooing vowel sounds?'),
        b('သင် စကားပြောသောအခါ ပြန်၍ အသံပြုပါသလား။', 'Does she answer back with sounds when you talk?'),
        b('ရုတ်တရက် အသံကြားလျှင် ခေါင်းလှည့်ပါသလား။', 'Does she turn towards a sudden sound?'),
      ],
      dailyActivities: [
        b('ကလေးအသံထွက်တိုင်း အတုယူ၍ ပြန်ဆိုပါ၊ ပြီးမှ ခေတ္တ ရပ်ပေးပါ။', 'Copy every sound she makes, then pause and wait for her turn.'),
        b('ရေချိုးချိန်၊ အဝတ်လဲချိန်တွင် လုပ်နေသည်များကို အသံထွက် ပြောပြပါ။', 'Narrate what you are doing at bath and nappy times.'),
        b('မျက်နှာချင်းဆိုင် ၂၀–၃၀ စင်တီမီတာအကွာတွင် ကြည့်၍ စကားပြောပါ။', 'Talk face to face at about 20–30 cm.'),
      ],
      weeklyActivities: [
        b('မိသားစုဝင် အသီးသီးက စကားပြောပေးပါ — အသံအမျိုးမျိုးကို ကြားစေပါ။', 'Let different family members talk to her so she hears different voices.'),
        b('မြန်မာဘာသာဖြင့် ကလေးသီချင်း အသစ် တစ်ပုဒ် ထပ်ထည့်ပါ။', 'Add one new Myanmar rhyme or lullaby each week.'),
      ],
      indoor: [
        b('မှန်ရှေ့တွင် အတူကြည့်၍ စကားပြောခြင်း။', 'Talking together in front of a mirror.'),
        b('ပုံစာအုပ်ကို လက်ညှိုးထိုး၍ အမည်ခေါ်ခြင်း။', 'Pointing at pictures in a book and naming them.'),
      ],
      outdoor: [
        b('အပြင်ထွက်စဉ် ကြားရသော အသံများ (ငှက်၊ လေ) ကို ပြောပြပါ။', 'Naming sounds you hear outside — birds, wind.'),
      ],
      lowCost: [
        b('သင့်အသံသည် အကောင်းဆုံး ကစားစရာ ဖြစ်သည် — ကုန်ကျစရိတ် မရှိပါ။', 'Your voice is the best toy and costs nothing.'),
        b('အိမ်လုပ် အသံမြည်ဗူးဖြင့် အသံရင်းမြစ်ကို ရှာစေခြင်း။', 'A home-made rattle to help her locate sound.'),
      ],
      materials: b('မလိုအပ်ပါ — သင်၏အသံနှင့် မျက်နှာ လုံလောက်သည်', 'Nothing needed — your voice and face are enough'),
      safety: b(
        'အသံကျယ်လွန်းသော နေရာများ (ဂီတစက် အနီးကပ်၊ မီးပွိုင့်) မှ ရှောင်ပါ။ နားအတွင်း ဘာမျှ မထည့်ပါနှင့်။ ဆေးလိပ်မီးခိုးသည် နားကြားခြင်းနှင့် အသက်ရှူလမ်းကြောင်းကို ထိခိုက်စေသဖြင့် ကလေးအနီး ဆေးလိပ် လုံးဝ မသောက်ပါနှင့်။',
        'Avoid very loud environments. Never put anything inside the ear. Keep the baby away from all tobacco smoke — it harms hearing and breathing.',
      ),
      commonMistakes: [
        b('ကလေးက အသံမထွက်သေးဟုဆိုကာ စကား မပြောတော့ခြင်း။', 'Talking less because the baby cannot answer in words yet.'),
        b('ဖုန်း/တီဗွီ အသံဖြင့် အစားထိုးခြင်း — မျက်နှာချင်းဆိုင် စကားပြောခြင်းကို အစားမထိုးနိုင်ပါ။', 'Substituting a phone or TV — screens do not replace face-to-face talk.'),
      ],
      parentTips: [
        b('ကလေး အသံထွက်ပြီးနောက် ၅ စက္ကန့် စောင့်ပါ — တုံ့ပြန်ရန် အချိန်ပေးပါ။', 'Wait about five seconds after her sound — give her time to take a turn.'),
        b('မိခင်ဘာသာစကားဖြင့် ပြောပါ — အကောင်းဆုံး ဖြစ်သည်။', 'Speak in your own mother tongue — it is the best choice.'),
      ],
      faq: [
        {
          q: b('ဘာသာစကား နှစ်မျိုး ပြောရင် ကလေး ရှုပ်မလား။', 'Will two languages confuse my baby?'),
          a: b('မရှုပ်ပါ။ ကလေးများသည် ဘာသာစကား တစ်မျိုးထက် ပို၍ သင်ယူနိုင်သည်။ တစ်ဦးချင်းစီက မိမိအကျွမ်းဝင်ဆုံး ဘာသာစကားဖြင့် ပြောပေးခြင်းက အကောင်းဆုံး ဖြစ်သည်။', 'No. Babies can learn more than one language. It works best when each person speaks the language they know best.'),
        },
        {
          q: b('ကလေး ရယ်သံ မကြားရသေးဘူး။', 'I have not heard a laugh yet.'),
          a: b('ရယ်မောသံသည် ၃ လမှ ၅ လကြားတွင် ပေါ်လာတတ်သည်။ အခြား တုံ့ပြန်မှုများ (ပြုံးခြင်း၊ အသံထွက်ခြင်း) ရှိနေလျှင် စောင့်ကြည့်ပါ။ လုံးဝ တုံ့ပြန်မှု မရှိပါက ပြသပါ။', 'Laughing often appears between 3 and 5 months. If she smiles and makes sounds, keep watching. If there is no response at all, have her checked.'),
        },
      ],
      redFlags: [
        b('အသံကျယ်ကြားလျှင် လုံးဝ မတုံ့ပြန်ခြင်း။', 'No reaction at all to loud sounds.'),
        b('လ ၄ လအရွယ်တွင် အသံ လုံးဝ မထွက်ခြင်း။', 'No sounds at all by 4 months.'),
        b('ယခင်က ထွက်နေသော အသံများ ရပ်သွားခြင်း။', 'Loss of sounds she used to make.'),
      ],
      referral: b(
        'နားကြားခြင်း သံသယရှိပါက စောစီးစွာ စစ်ဆေးခြင်းက အရေးကြီးသည်။ ကျန်းမာရေးဝန်ထမ်းထံ ပြသပါ။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ပါ။',
        'If hearing is in doubt, early checking matters. Ask a health worker. This is not a diagnosis.',
      ),
      encouragement: b(
        'သင်ပြောသော စကားလုံးတိုင်းသည် ကလေး၏ ဦးနှောက်ကို တည်ဆောက်နေပါသည်။',
        'Every word you say is building your baby’s brain.',
      ),
    }),
    'Cooing, laughing and vocal turn-taking at 3–4 months follow CDC and AAP milestone guidance; the hearing-response red flags follow CDC and AAP developmental-surveillance guidance and NHS learn-to-talk advice.',
  ),
  kb(
    guide('3_4m', 'social', {
      title: b('၃ – ၄ လ — လူမှုဆက်ဆံရေး လမ်းညွှန်', '3–4 months — Social guide'),
      why: b(
        'ဤအရွယ်တွင် ကလေးသည် လူတစ်ဦး၏ မျက်နှာနှင့်အသံကို တုံ့ပြန်ပြီး ပြုံးတတ်လာသည်။ ရင်းနှီးသောမျက်နှာများကို ပိုမိုမှတ်မိလာပြီး လူများနှင့် အတူနေရသည်ကို နှစ်သက်တတ်သည်။ တစ်ယောက်တည်း ကျန်ခဲ့လျှင် ငိုခြင်းသည် အလိုလိုက်လွန်းခြင်းကြောင့် မဟုတ်ဘဲ ပြုစုစောင့်ရှောက်သူနှင့် ချိတ်ဆက်မှု ဖွံ့ဖြိုးနေခြင်းကြောင့် ဖြစ်နိုင်သည်။',
        'Babies now smile at people — the social smile. They recognise familiar faces and enjoy company. Crying when left alone is not spoiling; it is attachment developing.',
      ),
      observationQuestions: [
        b('သင့်မျက်နှာကို မြင်လျှင် ပြုံးပါသလား။', 'Does she smile when she sees your face?'),
        b('လူများနှင့် အတူရှိစဉ် ပိုပျော်ရွှင်ပါသလား။', 'Does she seem happier in company?'),
        b('မျက်လုံးချင်း ဆုံစည်းပါသလား။', 'Does she make eye contact?'),
      ],
      dailyActivities: [
        b('တစ်ရက်လျှင် အကြိမ်များစွာ မျက်နှာချင်းဆိုင် ပြုံးပြပါ။', 'Face-to-face smiling many times a day.'),
        b('ကလေး၏ ခံစားချက်ကို စကားဖြင့် ပြန်ပြောပေးပါ ("ပျော်နေတယ်နော်")။', 'Name her feelings out loud — "you look happy".'),
        b('နို့တိုက်ချိန်တွင် ဖုန်း မကြည့်ဘဲ ကလေးကို ကြည့်ပါ။', 'Look at her, not your phone, during feeds.'),
      ],
      weeklyActivities: [
        b('မိသားစုဝင်များနှင့် တဖြည်းဖြည်း မိတ်ဆက်ပေးပါ။', 'Introduce family members gradually.'),
        b('အခြားကလေးများကို အဝေးမှ ကြည့်စေပါ။', 'Let her watch other children from a comfortable distance.'),
      ],
      indoor: [
        b('"ဘူး" ကစားခြင်း — မျက်နှာဖုံး၍ ပြန်ဖော်ပြခြင်း။', 'Peek-a-boo with a cloth.'),
        b('မှန်ရှေ့တွင် အတူ ပြုံးပြခြင်း။', 'Smiling together in a mirror.'),
      ],
      outdoor: [
        b('အိမ်နီးချင်းများနှင့် တွေ့ဆုံစဉ် ပွေ့ချီထားပေးခြင်း။', 'Held visits with neighbours.'),
      ],
      lowCost: [
        b('သင်၏မျက်နှာသည် အကောင်းဆုံး လူမှုကစားစရာ ဖြစ်သည်။', 'Your face is the best social toy there is.'),
        b('ပုဆိုးဖြင့် "ဘူး" ကစားခြင်း။', 'Peek-a-boo with a longyi.'),
      ],
      materials: b('အဝတ်စ တစ်ထည်၊ မှန် (ရှိလျှင်)', 'One cloth, a mirror if available'),
      safety: b(
        'ကလေးကို လူစည်ကားပြီး ဖျားနာသူများရှိသည့် နေရာမှ ရှောင်ပါ။ ကိုင်တွယ်မီ လက်ဆေးပါ။ ကလေးကို လုံးဝ မလှုပ်ခါပါနှင့် — ဦးနှောက် ထိခိုက်နိုင်သည်။ ငိုသံ မခံနိုင်ပါက ကလေးကို ဘေးကင်းသောနေရာတွင် ချထားပြီး ခဏ အနားယူပါ။',
        'Avoid crowds and people who are unwell, and wash hands before handling. Never shake a baby — it can cause brain injury. If crying overwhelms you, put her down somewhere safe and take a short break.',
      ),
      commonMistakes: [
        b('"ငိုရင် ပွေ့ရင် အလိုလိုက်ရာ ရောက်တယ်" ဟု ယူဆခြင်း — ဤအရွယ်တွင် မဟုတ်ပါ။', 'Believing that comforting a crying baby spoils her — not at this age.'),
        b('မိဘ၏ စိတ်ဖိစီးမှုကို လျစ်လျူရှုခြင်း။', 'Ignoring the parent’s own stress.'),
      ],
      parentTips: [
        b('သင်၏ စိတ်ကျန်းမာရေးလည်း အရေးကြီးပါသည် — အကူအညီ တောင်းခြင်းသည် အားနည်းချက် မဟုတ်ပါ။', 'Your own mental health matters too — asking for help is not weakness.'),
        b('ပြုံးပြခြင်းသည် အချိန်ကုန် မခံပါ — နေ့စဉ် အလုပ်ကြားထဲ ထည့်လိုက်ပါ။', 'Smiling costs no extra time — fold it into daily tasks.'),
      ],
      faq: [
        {
          q: b('ကလေးကို မကြာခဏ ပွေ့ချီရင် အလိုလိုက်ရာ ရောက်မလား။', 'Am I spoiling her by holding her often?'),
          a: b('မရောက်ပါ။ ဤအရွယ်တွင် တုံ့ပြန်ပေးခြင်းက ယုံကြည်မှုကို တည်ဆောက်ပြီး နောင်တွင် ပိုမို လွတ်လပ်စွာ ရပ်တည်နိုင်စေသည်။', 'No. Responding at this age builds trust and supports later independence.'),
        },
        {
          q: b('မိခင်ဖြစ်ပြီးကတည်းက စိတ်ဓာတ်ကျနေတယ်။', 'I have felt low since the birth.'),
          a: b('မွေးဖွားပြီးနောက် စိတ်ဓာတ်ကျခြင်းသည် အဖြစ်များပြီး ကုသလို့ ရပါသည်။ ကျန်းမာရေးဝန်ထမ်း သို့မဟုတ် ယုံကြည်ရသူတစ်ဦးအား ပြောပြပါ။', 'Postnatal depression is common and treatable. Please tell a health worker or someone you trust.'),
        },
      ],
      redFlags: [
        b('လ ၃ လအရွယ်တွင် လူကို မြင်လျှင် လုံးဝ မပြုံးခြင်း။', 'No social smile at all by 3 months.'),
        b('မျက်လုံးချင်း လုံးဝ မဆုံခြင်း။', 'No eye contact at all.'),
        b('ယခင်က ရှိခဲ့သော တုံ့ပြန်မှုများ ပျောက်သွားခြင်း။', 'Loss of social responses she previously had.'),
      ],
      referral: b(
        'ဤလက္ခဏာများကို ကျန်းမာရေးဝန်ထမ်းအား ပြပါ။ မိဘ၏ စိတ်ဓာတ်ကျမှုအတွက်လည်း အကူအညီ ရနိုင်ပါသည်။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ပါ။',
        'Raise these with a health worker — and support is available for parents feeling low too. This is not a diagnosis.',
      ),
      encouragement: b(
        'ကလေး၏ ပထမဆုံး ပြုံးရယ်မှုသည် သင်နှင့် တည်ဆောက်ထားသော ဆက်ဆံရေးမှ လာပါသည်။',
        'That first real smile comes from the relationship you have already built.',
      ),
    }),
    'The social smile, eye contact and responsive caregiving at 3–4 months follow CDC and AAP milestone guidance and the WHO/UNICEF nurturing care framework; the never-shake warning follows AAP guidance and the postnatal mental-health signposting follows NICE postnatal care guidance.',
  ),
];

const GUIDES_C: SeedItem[] = [
  kb(
    guide('3_4m', 'emotional', {
      title: b('၃ – ၄ လ — စိတ်ခံစားမှု လမ်းညွှန်', '3–4 months — Emotions guide'),
      why: b(
        'ကလေးသည် ပျော်ရွှင်မှု၊ စိတ်မသက်မသာမှုတို့ကို ပိုမို ရှင်းလင်းစွာ ဖော်ပြလာသည်။ ငိုသံများသည်လည်း ကွဲပြားလာသည်။ တုံ့ပြန်မှု အမြဲရရှိသော ကလေးသည် စိတ်ငြိမ်သက်ရန် ပိုလွယ်လာသည်။ အသက် ၂ လဝန်းကျင်တွင် အများဆုံးဖြစ်တတ်သော ငိုခြင်းသည် ဤအရွယ်တွင် တဖြည်းဖြည်း လျော့လာတတ်သည်။',
        'Feelings show more clearly now — pleasure, discomfort, and different cries. Babies who are answered consistently find it easier to settle. The crying peak around 2 months usually eases across these months.',
      ),
      observationQuestions: [
        b('ပွေ့ချီလျှင် စိတ်ငြိမ်သွားပါသလား။', 'Does she settle when held?'),
        b('ငိုသံ အမျိုးမျိုးကို ခွဲခြားလာပါသလား။', 'Are you starting to tell her cries apart?'),
        b('ပျော်ရွှင်ချိန်တွင် ခြေလက် လှုပ်ရှား၍ ပြသပါသလား။', 'Does she show pleasure by moving arms and legs?'),
      ],
      dailyActivities: [
        b('ငိုတိုင်း တုံ့ပြန်ပါ — ပွေ့ချီ၊ အသံပေး၊ လိုအပ်ချက် စစ်ဆေးပါ။', 'Respond to crying — hold, speak, and check her needs.'),
        b('အသားချင်းထိ ပွေ့ချီခြင်းကို နေ့စဉ် ထည့်ပါ။', 'Include some skin-to-skin holding each day.'),
        b('ငြိမ်သက်သော အသံဖြင့် သီချင်းဆိုပေးပါ။', 'Sing in a calm voice.'),
      ],
      weeklyActivities: [
        b('ငိုအားကောင်းသည့် အချိန်ကို မှတ်သားပြီး ကြိုတင် ပြင်ဆင်ပါ။', 'Note the time of day she cries most and plan support then.'),
        b('မိဘနှစ်ဦး/မိသားစုဝင်များ အလှည့်ကျ တာဝန်ယူပါ။', 'Take turns with a partner or family member.'),
      ],
      indoor: [
        b('အလင်းရောင် လျှော့၍ ဖြေးညှင်းစွာ ယိမ်းပေးခြင်း။', 'Dim the light and rock gently.'),
        b('နူးညံ့သော အဝတ်ဖြင့် ပတ်ပေးခြင်း (မျက်နှာ လွတ်ရမည်)။', 'Wrapping in a light cloth — the face must stay uncovered.'),
      ],
      outdoor: [
        b('အရိပ်အောက် ဖြေးညှင်းစွာ ပွေ့ချီ၍ လမ်းလျှောက်ခြင်း။', 'A slow carried walk in the shade.'),
      ],
      lowCost: [
        b('သင်၏ နှလုံးခုန်သံနှင့် အသံသည် အကောင်းဆုံး ငြိမ်သက်စေသော အရာ ဖြစ်သည်။', 'Your heartbeat and voice are the best soothers.'),
      ],
      materials: b('ပါးလွှာသော အဝတ်၊ ငြိမ်သက်သော နေရာ', 'A light cloth and a calm space'),
      safety: b(
        'ကလေးကို လုံးဝ မလှုပ်ခါပါနှင့် — ဦးနှောက်နှင့် မျက်စိ အမြဲထိခိုက်နိုင်သည်။ ငိုသံကြောင့် ခံနိုင်ရည် ကုန်သွားပါက ကလေးကို ကုတင်ထဲ ဘေးကင်းစွာ ချထားပြီး အခန်းမှ ခဏထွက်၍ အသက်ရှူပါ။ ပတ်ထားပါက ခြေထောက် လွတ်လပ်စွာ ရှိရမည်၊ မျက်နှာ မဖုံးရ။',
        'Never shake a baby — it can cause permanent brain and eye injury. If crying overwhelms you, put her down safely in the cot, leave the room and breathe. If you wrap her, hips must move freely and the face must stay uncovered.',
      ),
      commonMistakes: [
        b('ငိုသံကို လျစ်လျူရှုရန် အကြံပေးခြင်းကို လိုက်နာခြင်း — ဤအရွယ်တွင် မသင့်ပါ။', 'Following advice to let a young baby "cry it out" — not appropriate at this age.'),
        b('မိဘကိုယ်တိုင် အနားမယူဘဲ ဆက်တိုက် လုပ်နေခြင်း။', 'Never taking a break yourself.'),
      ],
      parentTips: [
        b('ငိုသံသည် သင့်အမှား မဟုတ်ပါ — ဆက်သွယ်မှု တစ်မျိုးသာ ဖြစ်သည်။', 'Crying is not your failure — it is communication.'),
        b('အကူအညီ တောင်းပါ။ တစ်ယောက်တည်း ထမ်းရန် မလိုပါ။', 'Ask for help. You are not meant to carry this alone.'),
      ],
      faq: [
        {
          q: b('ကလေး ညနေတိုင်း ငိုတယ်။ ပုံမှန်လား။', 'She cries every evening. Is that normal?'),
          a: b('ညနေပိုင်း ငိုခြင်းသည် ဤအရွယ်တွင် အဖြစ်များပါသည်။ သို့သော် ဖျားခြင်း၊ အန်ခြင်း၊ အစာမစားခြင်းနှင့် တွဲပါက ဆရာဝန်ထံ ပြပါ။', 'Evening crying is common at this age. But if it comes with fever, vomiting or poor feeding, have her seen.'),
        },
        {
          q: b('ငိုသံကြောင့် ဒေါသထွက်လာရင် ဘာလုပ်ရမလဲ။', 'What if the crying makes me angry?'),
          a: b('ကလေးကို ဘေးကင်းသောနေရာ ချထားပြီး အခန်းမှ ခဏ ထွက်ပါ — ဤသည် မှန်ကန်သော ဆုံးဖြတ်ချက် ဖြစ်သည်။ ပြီးမှ ယုံကြည်ရသူတစ်ဦးအား ပြောပြပါ။', 'Put her down somewhere safe and step out of the room — that is the right decision. Then tell someone you trust.'),
        },
        { q: b("ဘယ်အပူချိန် ရောက်ရင် ဆေးရုံ သွားရမလဲ။", "What temperature means we should seek care?"), a: b("အပူချိန် တိုင်းပါ။ အသက် ၃ လအောက် ကလေး ၃၈°C (၁၀၀.၄°F) နှင့်အထက် ဖျားပါက — ကလေး ပုံမှန်လို ထင်ရလျှင်ပင် ချက်ချင်း ပြသပါ။ အသက် ၃ လမှ ၆ လကြား ၃၉°C (၁၀၂.၂°F) နှင့်အထက် ဖျားပါက အမြန် ပြသပါ။ အသက်မရွေး — ဖျားခြင်းနှင့်အတူ အသက်ရှူခက်ခြင်း၊ နှိပ်လျှင် မပျောက်သော အနီစက်၊ လည်ပင်း တောင့်တင်းခြင်း သို့မဟုတ် နိုးရခက်ခြင်း ပါလာပါက ချက်ချင်း ပြသပါ။ အပူချိန်တိုင်းကိရိယာ မရှိပါက — ကလေး ပူနေပြီး အထက်ပါ လက္ခဏာများ ပါလျှင် မစောင့်ဘဲ ပြသပါ။", "Take the temperature. Under 3 months, 38°C (100.4°F) or above: seek care straight away, even if the baby otherwise seems well. Between 3 and 6 months, 39°C (102.2°F) or above: seek care promptly. At any age, fever together with difficulty breathing, a rash that does not fade under pressure, a stiff neck, or being hard to wake: seek care immediately. If you have no thermometer, and the child feels hot and has any of those signs, do not wait.") },
      ],
      redFlags: [
        b('အဆက်မပြတ် ငိုနေပြီး ဘယ်လိုမှ မငြိမ်နိုင်ခြင်း၊ ဖျားခြင်း သို့မဟုတ် အန်ခြင်းနှင့် တွဲပါခြင်း။', 'Inconsolable crying with fever or vomiting.'),
        b('ငိုသံ အားနည်း၊ ကြီးကျယ်ခြင်း သို့မဟုတ် ပုံမှန်မဟုတ်ခြင်း။', 'A weak, high-pitched or unusual cry.'),
        b('တုံ့ပြန်မှု နည်းပါးပြီး အလွန် ပျော့ခွေနေခြင်း။', 'Unusually unresponsive or floppy.'),
      ],
      referral: b(
        'ဤလက္ခဏာများသည် ချက်ချင်း ဆေးကုသမှု လိုအပ်သည်။ လ ၃ လအောက် ကလေး ဖျားပါက ချက်ချင်း ပြပါ။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ပါ။',
        'These need prompt medical care. Any fever in a baby under 3 months needs same-day assessment. This is not a diagnosis.',
      ),
      encouragement: b(
        'သင် တုံ့ပြန်ပေးသော အကြိမ်တိုင်းသည် ကလေး၏ ယုံကြည်မှုကို တည်ဆောက်နေပါသည်။',
        'Every time you answer, you are building your baby’s trust.',
      ),
    }),
    'Cry patterns, responsive soothing and the abusive-head-trauma warning follow AAP guidance and the paediatric references in the registry; the under-3-month fever rule follows NICE fever in under-5s guidance and the WHO IMCI danger signs.',
  ),
  kb(
    guide('3_4m', 'cognitive', {
      title: b('၃ – ၄ လ — အသိဉာဏ် ဖွံ့ဖြိုးမှု လမ်းညွှန်', '3–4 months — Thinking and learning guide'),
      why: b(
        'ကလေးသည် ရွေ့လျားနေသော အရာကို မျက်လုံးဖြင့် လိုက်ကြည့်နိုင်လာသည်။ အသိမျက်နှာနှင့် အသစ်ကို ခွဲခြားလာသည်။ ထပ်ခါထပ်ခါ လုပ်ခြင်းဖြင့် သင်ယူသည် — ထို့ကြောင့် တူညီသော ကစားနည်းကို ထပ်ကစားခြင်းသည် ငြီးငွေ့စရာ မဟုတ်ဘဲ လိုအပ်သော အရာ ဖြစ်သည်။',
        'She now follows a moving object with her eyes and tells familiar faces from new ones. Babies learn by repetition, so playing the same game again is not boring — it is how learning sticks.',
      ),
      observationQuestions: [
        b('ရွေ့လျားနေသော ပစ္စည်းကို မျက်လုံးဖြင့် လိုက်ကြည့်ပါသလား။', 'Does she follow a moving object with her eyes?'),
        b('မိမိလက်ကို စိုက်ကြည့်တတ်ပါသလား။', 'Does she study her own hands?'),
        b('အသိမျက်နှာကို မြင်လျှင် တုံ့ပြန်မှု ကွာပါသလား။', 'Does she respond differently to familiar faces?'),
      ],
      dailyActivities: [
        b('ပစ္စည်းတစ်ခုကို ဖြေးညှင်းစွာ ရွှေ့ပြပါ — ဘယ်မှ ညာ၊ အပေါ်မှ အောက်။', 'Move an object slowly side to side and up and down for her to track.'),
        b('တူညီသော သီချင်းကို နေ့စဉ် တစ်ချိန်တည်းတွင် ဆိုပါ။', 'Sing the same song at the same time each day.'),
        b('အသံမြည်ပစ္စည်းကို လှုပ်၍ အသံရင်းမြစ် ရှာစေပါ။', 'Shake a rattle and let her search for the sound.'),
      ],
      weeklyActivities: [
        b('အခန်းအသစ်၊ မြင်ကွင်းအသစ်များ ပြပါ။', 'Show her a new room or a new view.'),
        b('ပုံစာအုပ် တစ်အုပ်ကို အတူ လှန်ကြည့်ပါ။', 'Look through a picture book together.'),
      ],
      indoor: [
        b('အနက်/အဖြူ ပုံများကို ကြည့်စေခြင်း။', 'Looking at bold black-and-white patterns.'),
        b('မှန်ထဲရှိ မိမိပုံရိပ်ကို ကြည့်စေခြင်း။', 'Watching herself in a mirror.'),
      ],
      outdoor: [
        b('အရိပ်အောက်တွင် သစ်ရွက်၊ အဝတ်လှမ်းကြိုး လှုပ်ရှားမှုကို ကြည့်စေခြင်း။', 'Watching leaves or washing move in the shade.'),
      ],
      lowCost: [
        b('စက္ကူဖြင့် ရေးဆွဲထားသော အနက်/အဖြူ ပုံကတ်။', 'Hand-drawn black-and-white cards on paper.'),
        b('အိမ်တွင်း ပစ္စည်းများကို လိုက်ကြည့်စေခြင်း။', 'Tracking ordinary household objects.'),
      ],
      materials: b('ပုံကတ်၊ အသံမြည်ဗူး၊ ပုံစာအုပ်', 'Picture cards, a rattle, a picture book'),
      safety: b(
        'ကလေးအနီး ချိတ်ဆွဲထားသော ပစ္စည်းများသည် ကျမလာစေရ။ ကြိုးရှည်များကို ဖယ်ပါ — လည်ပတ် ရစ်နိုင်သည်။ ဤအရွယ်တွင် ဖန်သားပြင် (တီဗွီ၊ ဖုန်း) ကို အကြံမပြုပါ။ ပစ္စည်းသေးများကို လက်လှမ်းမမီစေရ။',
        'Anything hung above her must be secure. Remove long cords — they can wrap around the neck. Screens are not recommended at this age. Keep small objects out of reach.',
      ),
      commonMistakes: [
        b('ကစားစရာ များစွာ တစ်ပြိုင်နက် ပေးခြင်း — အာရုံ ပျံ့လွင့်စေသည်။', 'Offering many toys at once — it scatters her attention.'),
        b('ဖန်သားပြင်ဖြင့် "သင်ကြားပေး" ရန် ကြိုးစားခြင်း။', 'Trying to teach with a screen.'),
      ],
      parentTips: [
        b('ကလေး လှည့်ထွက်သွားလျှင် ခဏ နားပါ — လုံလောက်ပြီဟု ပြောနေခြင်း ဖြစ်သည်။', 'If she looks away, pause — she is telling you she has had enough.'),
        b('ထပ်ခါထပ်ခါ ကစားခြင်းက အလုပ်ဖြစ်သည်။', 'Repetition is the work, not the waste.'),
      ],
      faq: [
        {
          q: b('တီဗွီ ဖွင့်ပေးလို့ ရလား။', 'Can I put the TV on for her?'),
          a: b('ဤအရွယ်တွင် ဖန်သားပြင် ကြည့်ခြင်းကို အကြံမပြုပါ။ လူနှင့် တိုက်ရိုက် ဆက်သွယ်ခြင်းက ပိုအကျိုးရှိသည်။', 'Screen time is not recommended at this age; direct interaction with people teaches far more.'),
        },
        {
          q: b('မျက်လုံး တစ်ခါတစ်ရံ စောင်းသွားတယ်။', 'Her eyes sometimes cross.'),
          a: b('လ ၃ လအောက်တွင် ရံဖန်ရံခါ ဖြစ်တတ်သည်။ လ ၄ လကျော်ပြီးလည်း ဆက်ဖြစ်နေပါက မျက်စိ စစ်ဆေးရန် ပြပါ။', 'Occasional crossing can occur in the early months. If it continues beyond 4 months, ask for an eye check.'),
        },
      ],
      redFlags: [
        b('ရွေ့လျားနေသော ပစ္စည်းကို မျက်လုံးဖြင့် လုံးဝ မလိုက်ကြည့်ခြင်း။', 'No visual tracking of a moving object at all.'),
        b('လ ၄ လကျော်၍ မျက်လုံး အမြဲ စောင်းနေခြင်း။', 'Eyes that stay crossed or turned after 4 months.'),
        b('အလင်းရောင် သို့မဟုတ် မျက်နှာကို လုံးဝ မကြည့်ခြင်း။', 'No interest in light or faces at all.'),
      ],
      referral: b(
        'မျက်စိ သို့မဟုတ် အာရုံစိုက်မှုနှင့် ပတ်သက်၍ စိုးရိမ်ပါက ကျန်းမာရေးဝန်ထမ်းထံ ပြပါ။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ပါ။',
        'If you have concerns about vision or attention, ask a health worker. This is not a diagnosis.',
      ),
      encouragement: b(
        'သင်နှင့် အတူကစားခြင်းသည် ကလေးအတွက် အကောင်းဆုံး သင်ခန်းစာ ဖြစ်ပါသည်။',
        'Playing with you is the best lesson your baby can get.',
      ),
    }),
    'Visual tracking, hand regard and face recognition at 3–4 months follow CDC and AAP milestone guidance; the no-screens advice follows WHO physical activity and sedentary behaviour guidance for under-5s, and the eye-alignment note follows the standard paediatric developmental references in the registry.',
  ),
  kb(
    guide('3_4m', 'play', {
      title: b('၃ – ၄ လ — ကစားခြင်း လမ်းညွှန်', '3–4 months — Play guide'),
      why: b(
        'ဤအရွယ်တွင် ကစားခြင်းဆိုသည်မှာ ကြည့်ခြင်း၊ နားထောင်ခြင်း၊ ထိတွေ့ခြင်းနှင့် လှမ်းယူရန် ကြိုးစားခြင်း ဖြစ်သည်။ ကစားစရာ ဈေးကြီးများ မလိုအပ်ပါ။ အရေးကြီးဆုံးမှာ သင်နှင့် အတူရှိသော အချိန် ဖြစ်သည်။',
        'Play at this age means looking, listening, touching and reaching. Expensive toys are not needed. What matters most is time together with you.',
      ),
      observationQuestions: [
        b('ကစားချိန်တွင် အာရုံစိုက်နိုင်သည့် အချိန် ရှည်လာပါသလား။', 'Is she able to pay attention for longer during play?'),
        b('ကစားစဉ် ပြုံးခြင်း၊ အသံထွက်ခြင်း ရှိပါသလား။', 'Does she smile or make sounds during play?'),
        b('မောလာလျှင် လှည့်ထွက်သွားသည်ကို သတိထားမိပါသလား။', 'Do you notice her turning away when she has had enough?'),
      ],
      dailyActivities: [
        b('တစ်ရက်လျှင် ကစားချိန် တိုတို အကြိမ်များစွာ ထည့်ပါ။', 'Several short play times each day.'),
        b('ကလေး၏ အသံ၊ လှုပ်ရှားမှုကို အတုယူပါ။', 'Copy her sounds and movements.'),
        b('ကြမ်းပြင်ပေါ်တွင် လွတ်လပ်စွာ လှုပ်ရှားခွင့် ပေးပါ။', 'Free floor time with room to move.'),
      ],
      weeklyActivities: [
        b('ကစားနည်း အသစ် တစ်ခု ထည့်ပါ။', 'Add one new game each week.'),
        b('အိမ်တွင်းရှိ လုံခြုံသော ပစ္စည်းအသစ်များကို ထိခွင့် ပေးပါ။', 'Let her touch a new safe household object.'),
      ],
      indoor: [
        b('"ဘူး" ကစားခြင်း။', 'Peek-a-boo.'),
        b('အဝတ်စ အမျိုးမျိုးကို ထိတွေ့စေခြင်း။', 'Feeling different fabrics.'),
        b('မှောက်ချချိန်တွင် မှန်ကစားခြင်း။', 'Mirror play during tummy time.'),
      ],
      outdoor: [
        b('အရိပ်ရှိသော ကွင်းပြင်တွင် အဝတ်ခင်း၍ ကြမ်းပြင်ကစားခြင်း။', 'Floor play on a cloth in a shaded outdoor spot.'),
      ],
      lowCost: [
        b('သတ္တုပန်းကန်၊ သစ်သားဇွန်း၊ အဝတ်စ — အိမ်တွင်း ပစ္စည်းများဖြင့် ကစားနိုင်သည်။', 'A metal plate, a wooden spoon, cloth strips — household items work.'),
        b('ဆန်ထည့်ထားသော ပိတ်ဗူးကို အသံမြည်ဗူးအဖြစ် သုံးပါ။', 'A sealed tin with rice as a rattle.'),
      ],
      materials: b('အဝတ်ခင်း၊ အဝတ်စများ၊ အသံမြည်ဗူး၊ မှန်', 'A floor cloth, fabric pieces, a rattle, a mirror'),
      safety: b(
        'ကလေးပါးစပ်ထဲ ဝင်နိုင်သော ပစ္စည်းများ မပေးပါနှင့် — လည်ချောင်းပိတ် နိုင်သည်။ ဆံပင်ကြိုး၊ ကြိုးရှည်၊ ပလတ်စတစ်အိတ်များကို ဖယ်ပါ။ ကစားစဉ် တစ်ယောက်တည်း မထားပါနှင့်။ မြင့်သောနေရာပေါ်တွင် မထားပါနှင့်။',
        'Nothing small enough to fit in the mouth — it can choke. Remove hair ties, long cords and plastic bags. Never leave her alone during play, and never on a high surface.',
      ),
      commonMistakes: [
        b('ကစားချိန်ကို ရှည်လျားလွန်းစေခြင်း — ကလေး မောသွားတတ်သည်။', 'Making sessions too long — babies tire.'),
        b('ကစားစရာ ဈေးကြီးမှ ကောင်းသည်ဟု ယူဆခြင်း။', 'Assuming expensive toys are better.'),
      ],
      parentTips: [
        b('ကလေးက ဦးဆောင်ပါစေ — သူစိတ်ဝင်စားရာကို လိုက်ပါ။', 'Let her lead — follow what she is interested in.'),
        b('အလုပ်လုပ်ရင်း စကားပြောခြင်းသည်လည်း ကစားခြင်း ဖြစ်သည်။', 'Talking while you work counts as play.'),
      ],
      faq: [
        {
          q: b('ကစားစရာ ဘယ်နှစ်ခု လိုအပ်လဲ။', 'How many toys does she need?'),
          a: b('နည်းနည်းဖြင့် လုံလောက်ပါသည်။ ဤအရွယ်တွင် သင်၏မျက်နှာ၊ အသံနှင့် အိမ်တွင်း လုံခြုံသော ပစ္စည်း အနည်းငယ်ဖြင့် ရပါသည်။', 'Very few. At this age your face, your voice and a handful of safe household objects are enough.'),
        },
        {
          q: b('ကလေး ကစားရင်း ငိုသွားရင်။', 'She cries during play.'),
          a: b('ရပ်ပြီး ပွေ့ချီပါ။ မောခြင်း သို့မဟုတ် ဆာခြင်း ဖြစ်နိုင်သည်။ နောက်မှ ပြန်စပါ။', 'Stop and hold her. She may be tired or hungry. Try again later.'),
        },
      ],
      redFlags: [
        b('ကစားခြင်း၊ ပတ်ဝန်းကျင်ကို လုံးဝ စိတ်မဝင်စားခြင်း။', 'No interest at all in play or surroundings.'),
        b('ပစ္စည်းကို မကြည့်၊ အသံကို မတုံ့ပြန်ခြင်း။', 'Not looking at objects or responding to sound.'),
        b('ကိုယ်ခန္ဓာ အလွန် တောင့်တင်းခြင်း သို့မဟုတ် ပျော့ခွေခြင်း။', 'A body that is very stiff or very floppy.'),
      ],
      referral: b(
        'ဤလက္ခဏာများကို ကျန်းမာရေးဝန်ထမ်းအား ပြသပါ။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ဘဲ စစ်ဆေးရန် အချက်ပြခြင်းသာ ဖြစ်သည်။',
        'Raise these with a health worker. This is a prompt to check, not a diagnosis.',
      ),
      encouragement: b(
        'ကလေးအတွက် အကောင်းဆုံး ကစားစရာသည် သင် ဖြစ်ပါသည်။',
        'The best toy your baby has is you.',
      ),
    }),
    'Play as looking, listening, touching and reaching at 3–4 months follows the WHO/UNICEF nurturing care framework and CDC and AAP milestone guidance; choking and strangulation precautions follow AAP safe sleep and play guidance.',
  ),
];

const GUIDES_D: SeedItem[] = [
  kb(
    guide('3_4m', 'nutrition', {
      title: b('၃ – ၄ လ — အာဟာရ လမ်းညွှန်', '3–4 months — Feeding guide'),
      why: b(
        'ဤအရွယ်တွင် နို့တစ်မျိုးတည်းဖြင့် လုံလောက်ပါသည်။ အသက် ၆ လအထိ မိခင်နို့တစ်မျိုးတည်း တိုက်ကျွေးရန် အကြံပြုထားပြီး ထို့နောက်မှ အစားအစာ စတင်ရန် ဖြစ်သည်။ ဤအရွယ်တွင် ကလေးသည် အနီးအနားကို ပိုစိတ်ဝင်စားလာသဖြင့် နို့စို့ရင်း အာရုံပျံ့လွင့်တတ်သည် — ဤသည် နို့နည်းသွားခြင်း မဟုတ်ပါ။',
        'Milk alone is enough at this age. Exclusive breastfeeding is recommended to around 6 months, with solid foods starting after that. Babies now get distracted at the breast because the world is interesting — that is not a sign your milk has reduced.',
      ),
      observationQuestions: [
        b('တစ်ရက်လျှင် အိုကွက် ၅–၆ ကွက် သို့ အထက် စိုပါသလား။', 'Are there at least 5–6 wet nappies a day?'),
        b('ကိုယ်အလေးချိန် တဖြည်းဖြည်း တက်နေပါသလား။', 'Is weight rising steadily on the growth chart?'),
        b('နို့စို့ပြီးနောက် ကျေနပ်ပုံ ရပါသလား။', 'Does she seem settled after feeds?'),
      ],
      dailyActivities: [
        b('ဆာလောင်လက္ခဏာ ပြသည်နှင့် တိုက်ကျွေးပါ — အချိန်ဇယား တင်းကျပ်စွာ မလိုက်ပါနှင့်။', 'Feed on cue rather than to a strict schedule.'),
        b('ငြိမ်သက်သော နေရာတွင် တိုက်ကျွေးပါ — အာရုံပျံ့လွင့်မှု လျော့စေသည်။', 'Feed in a quiet spot to reduce distraction.'),
        b('မိခင်ကိုယ်တိုင် ရေနှင့် အစားအစာ လုံလောက်စွာ သောက်စား ပါ။', 'The mother should eat and drink well herself.'),
      ],
      weeklyActivities: [
        b('ကိုယ်အလေးချိန်နှင့် ကြီးထွားမှုကို မှတ်တမ်းတင်ပါ။', 'Record weight and growth.'),
        b('နို့တိုက်ခြင်းနှင့် ပတ်သက်၍ မေးခွန်းများကို ကျန်းမာရေးဝန်ထမ်းအား ပြောပြပါ။', 'Bring feeding questions to a health worker.'),
      ],
      indoor: [
        b('တိတ်ဆိတ်သော အခန်းတွင် နို့တိုက်ခြင်း။', 'Feeding in a calm room.'),
      ],
      outdoor: [
        b('အပြင်ထွက်စဉ် နို့တိုက်ရန် အရိပ်ရ လုံခြုံသောနေရာ ရွေးပါ။', 'Choose a shaded, private spot to feed when out.'),
      ],
      lowCost: [
        b('မိခင်နို့သည် အကောင်းဆုံးဖြစ်ပြီး ကုန်ကျစရိတ် မရှိပါ။', 'Breast milk is the best option and costs nothing.'),
      ],
      materials: b('မလိုအပ်ပါ', 'Nothing required'),
      safety: b(
        'အသက် ၆ လမပြည့်မီ ရေ၊ ဆန်ပြုတ်နှင့် နွားနို့ မပေးပါနှင့်။ အသက် ၁၂ လမပြည့်မီ ပျားရည်ပေးခြင်းက ပြင်းထန်သော အဆိပ်သင့်မှု ဖြစ်စေနိုင်သဖြင့် လုံးဝ မပေးပါနှင့်။ နို့ဗူးကို ထောက်ထားပြီး ကလေးကို တစ်ယောက်တည်း မထားပါနှင့်။ နို့တစ်ဆို့၍ အသက်ရှူလမ်းကြောင်း ပိတ်ဆို့နိုင်သည်။ နို့မှုန့်သုံးပါက ထုတ်လုပ်သူ၏ ညွှန်ကြားချက်အတိုင်း အတိအကျ ဖျော်ပါ။',
        'No water, rice porridge or cow’s milk before 6 months. Never give honey before 12 months — it can cause botulism. Never prop a bottle and leave her — it is a choking risk. If using formula, follow the instructions exactly.',
      ),
      commonMistakes: [
        b('၄ လအရွယ်တွင် အစားအစာ စတင်ခြင်း — အသက် ၆ လဝန်းကျင်မှ စရန် အကြံပြုထားသည်။', 'Starting solids at 4 months — around 6 months is the recommendation.'),
        b('နို့စို့ရင်း အာရုံပျံ့လွင့်ခြင်းကို "နို့နည်းသွားပြီ" ဟု ယူဆခြင်း။', 'Reading distraction at the breast as low milk supply.'),
        b('နို့မှုန့်ကို ပါးလျှော့/ပိုပြင်းအောင် ဖျော်ခြင်း။', 'Making formula weaker or stronger than instructed.'),
      ],
      parentTips: [
        b('ညဘက် တိုက်ကျွေးခြင်းသည် နို့ထွက်မှုကို ထိန်းသိမ်းပေးသည်။', 'Night feeds help keep milk supply up.'),
        b('နို့တိုက်ရာတွင် နာကျင်ပါက အကူအညီ တောင်းပါ — များသောအားဖြင့် ကိုင်ပုံ ပြင်ရုံဖြင့် ရသည်။', 'If feeding hurts, ask for help — it is often a positioning fix.'),
      ],
      faq: [
        {
          q: b('၄ လမှာ ဆန်ပြုတ် စကျွေးလို့ ရလား။', 'Can I start rice porridge at 4 months?'),
          a: b('အသက် ၆ လဝန်းကျင်မှ စရန် အကြံပြုထားပါသည်။ စောလွန်းစွာ စတင်ခြင်းက ဝမ်းလျှောခြင်းနှင့် ကူးစက်ရောဂါ အန္တရာယ်ကို တိုးစေနိုင်သည်။', 'Around 6 months is recommended. Starting too early can increase the risk of diarrhoea and infection.'),
        },
        {
          q: b('နို့ လုံလောက်မလုံလောက် ဘယ်လို သိမလဲ။', 'How do I know she is getting enough?'),
          a: b('အိုကွက် စိုမှု၊ ကိုယ်အလေးချိန် တက်မှုနှင့် ကလေး၏ ကျေနပ်မှုက အဓိက အချက်များ ဖြစ်သည်။ စိုးရိမ်ပါက ကိုယ်အလေးချိန် ချိန်ပြပါ။', 'Wet nappies, steady weight gain and a settled baby are the main signs. If worried, have her weighed.'),
        },
      ],
      redFlags: [
        b('ကိုယ်အလေးချိန် မတက်ခြင်း သို့မဟုတ် ကျဆင်းခြင်း။', 'Weight not rising, or falling.'),
        b('နို့စို့ရန် ငြင်းဆန်ခြင်း၊ အားနည်းစွာ စို့ခြင်း။', 'Refusing feeds or feeding weakly.'),
        b('အိုကွက် နည်းခြင်း၊ ပါးစပ် ခြောက်ခြင်း၊ မျက်လုံး ချိုင့်ခြင်း — ရေဓာတ်ခန်းခြောက်ခြင်း လက္ခဏာ။', 'Few wet nappies, dry mouth or sunken eyes — signs of dehydration.'),
      ],
      referral: b(
        'ဤလက္ခဏာများ တွေ့ပါက ချက်ချင်း ကျန်းမာရေးဝန်ထမ်းထံ ပြပါ။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ပါ။',
        'See a health worker promptly if you notice these. This is not a diagnosis.',
      ),
      encouragement: b(
        'တိုက်ကျွေးခြင်းသည် အာဟာရသာမက ဆက်ဆံရေးလည်း ဖြစ်ပါသည်။',
        'Feeding is nourishment and relationship at the same time.',
      ),
    }),
    'Exclusive milk feeding to around six months, responsive feeding and the honey and cow’s-milk cautions follow WHO infant and young child feeding guidance, the WHO/UNICEF IYCF strategy, NHS advice on starting solid foods, and NICE faltering-growth guidance for the weight red flags.',
  ),
  kb(
    guide('3_4m', 'sleep', {
      title: b('၃ – ၄ လ — အိပ်စက်ခြင်း လမ်းညွှန်', '3–4 months — Sleep guide'),
      why: b(
        'ဤအရွယ်တွင် ညအိပ်ချိန် တဖြည်းဖြည်း ရှည်လာပြီး နေ့နှင့် ည ခွဲခြားလာသည်။ အသက် ၄–၁၁ လအရွယ်တွင် စုစုပေါင်း အိပ်ချိန် ၁၂–၁၆ နာရီခန့် (နေ့အိပ် အပါအဝင်) ဖြစ်တတ်သည်၊ ကွာဟမှု ကျယ်ပါသည်။ ညဘက် နိုးခြင်းသည် ဤအရွယ်တွင် ပုံမှန် ဖြစ်သည်။',
        'Night sleep gradually lengthens and a day–night pattern appears. Total sleep at 4–11 months is commonly about 12–16 hours including naps, with wide variation. Waking at night is still normal.',
      ),
      observationQuestions: [
        b('အိပ်ချိန်တိုင်း ပက်လက် အိပ်ပါသလား။', 'Is she placed on her back for every sleep?'),
        b('အိပ်ရာသည် ပြားပြီး မာပါသလား။ အိပ်ရာပေါ်တွင် အခြားပစ္စည်း ရှိပါသလား။', 'Is the sleep surface firm and flat, and clear of other items?'),
        b('နေ့နှင့် ည ခွဲခြားလာပါသလား။', 'Is a day–night difference appearing?'),
      ],
      dailyActivities: [
        b('ညတိုင်း တူညီသော အစီအစဉ်ဖြင့် အိပ်ရာဝင်ပါ (ရေချိုး၊ နို့တိုက်၊ သီချင်း၊ အိပ်)။', 'The same short bedtime routine each night — wash, feed, song, sleep.'),
        b('နေ့ဘက်တွင် အလင်းရောင်နှင့် ပုံမှန် အသံများ ရှိစေပါ။', 'Keep daytime bright and normally noisy.'),
        b('ညဘက်တွင် အလင်း လျှော့၍ တိုးတိုး ပြောပါ။', 'Keep nights dim and quiet.'),
      ],
      weeklyActivities: [
        b('အိပ်ချိန် ပုံစံကို မှတ်တမ်းတင်ပါ။', 'Keep a simple sleep log.'),
        b('ညဘက် အလှည့်ကျ တာဝန်ယူရန် စီစဉ်ပါ။', 'Plan who takes which night.'),
      ],
      indoor: [
        b('မိဘအခန်းတွင် ကလေးအတွက် သီးသန့် အိပ်ရာ ထားပါ။', 'A separate sleep space for the baby in the parents’ room.'),
      ],
      outdoor: [
        b('နေ့ဘက် အရိပ်အောက် လမ်းလျှောက်ခြင်းက နေ့/ည ခွဲခြားမှုကို ကူညီသည်။', 'Daytime walks in the shade help set the day–night rhythm.'),
      ],
      lowCost: [
        b('သန့်ရှင်း၍ ပြားသော ဖျာ သို့မဟုတ် မွေ့ရာ မာမာဖြင့် လုံလောက်သည်။', 'A clean, firm, flat mat or mattress is enough.'),
      ],
      materials: b('မာပြီး ပြားသော အိပ်ရာ၊ ပါးလွှာသော အဝတ်', 'A firm flat sleep surface and a light cover'),
      safety: b("အိပ်ချိန်တိုင်း ပက်လက် အိပ်စေပါ။ မာပြီး ပြားသော မျက်နှာပြင်ပေါ်တွင်သာ အိပ်စေပါ။ ခေါင်းအုံး၊ အနူးအညံ့ အရုပ်၊ စောင်ထူ၊ အနားခံများကို အိပ်ရာထဲ မထားပါနှင့်။ မိဘအခန်းတွင် သီးသန့်အိပ်ရာဖြင့် အိပ်ခြင်းက အကောင်းဆုံး ဖြစ်ပြီး တစ်အိပ်ရာတည်း အတူအိပ်ခြင်းကို အကြံမပြုပါ။ ဆေးလိပ်၊ အရက် သို့မဟုတ် အိပ်ဆေး သောက်ထားပါက ကလေးနှင့် အတူ လုံးဝ မအိပ်ပါနှင့်။ ဆိုဖာ၊ ကုလားထိုင်ပေါ်တွင် ကလေးနှင့် အတူ မအိပ်ပါနှင့်။ ကလေးအနီး ဆေးလိပ် လုံးဝ မသောက်ပါနှင့်။ အိပ်ချိန်နှင့် ညအိပ်ချိန်တွင် နို့သီးခေါင်း ပေးကြည့်နိုင်ပါသည် — ရုတ်တရက် သေဆုံးမှု အန္တရာယ် လျော့ကျစေကြောင်း တွေ့ရှိထားပါသည်။ နို့တိုက်နေပါက နို့တိုက်ခြင်း အသားကျပြီးမှ စတင်ပေးပါ။", "Back to sleep for every sleep, on a firm flat surface. Nothing else in the sleep space — no pillows, soft toys, thick covers or bumpers. Room-sharing with a separate sleep surface is safest; bed-sharing is not recommended. Never share a sleep surface after smoking, alcohol or sedating medicine, and never sleep with the baby on a sofa or armchair. Keep the baby away from all tobacco smoke. You can try offering a pacifier at nap time and bedtime — it is associated with a lower risk of SIDS. If you are breastfeeding, wait until feeding is well established before offering one."),
      commonMistakes: [
        b('အိပ်ရာထဲ ခေါင်းအုံး၊ အရုပ် ထည့်ပေးခြင်း။', 'Adding pillows or toys to the sleep space.'),
        b('ဆိုဖာပေါ်တွင် ကလေးကို ပွေ့ချီရင်း အိပ်ပျော်သွားခြင်း။', 'Falling asleep with the baby on a sofa.'),
        b('ဤအရွယ်တွင် "အိပ်စက်လေ့ကျင့်ရေး" တင်းကျပ်စွာ လုပ်ခြင်း။', 'Strict sleep training at this age.'),
        b("အလေးချိန်ပါသော စောင်၊ အိပ်ဝတ်စုံ သို့မဟုတ် ပတ်ရစ်ပိတ်စများ သုံးခြင်း။", "Using weighted blankets, weighted sleepers or weighted swaddles."),
        b("အိမ်သုံး အသက်ရှူ/နှလုံးခုန် စောင့်ကြည့်စက်ကို ဘေးကင်းစွာ အိပ်စေခြင်း၏ အစား အားကိုးခြင်း — အန္တရာယ် လျှော့ချပေးသည်ဟု သက်သေ မရှိပါ။", "Relying on a home breathing or heart-rate monitor instead of a safe sleep space — these have not been shown to reduce the risk of SIDS."),
      ],
      parentTips: [
        b('ကလေး အိပ်ချိန်တွင် မိဘလည်း အနားယူပါ။', 'Rest when the baby rests.'),
        b('ညဘက် နိုးခြင်းသည် သင့်အမှား မဟုတ်ပါ။', 'Night waking is not your fault.'),
      ],
      faq: [
        {
          q: b('ကလေးက ဘေးစောင်း လှိမ့်သွားရင် ဘာလုပ်ရမလဲ။', 'What if she rolls onto her side or front?'),
          a: b('ကိုယ်တိုင် လှိမ့်နိုင်ပြီဆိုလျှင် ပြန်လှည့်ပေးရန် မလိုပါ။ သို့သော် အိပ်ရာဝင်ချိန်တိုင်း ပက်လက်ဖြင့်သာ စတင်ပါ၊ အိပ်ရာကိုလည်း လွတ်လပ်စွာ ထားပါ။', 'Once she can roll on her own you do not need to turn her back. But always start every sleep on the back, and keep the sleep space clear.'),
        },
        {
          q: b('တစ်ညလုံး အိပ်သင့်ပြီလား။', 'Should she sleep through the night by now?'),
          a: b('မလိုအပ်ပါ။ ဤအရွယ်တွင် ညဘက် နိုးခြင်းသည် အလွန် အဖြစ်များပါသည်။', 'Not necessarily. Waking at night is very common at this age.'),
        },
      ],
      redFlags: [
        b('နိုးရန် အလွန် ခက်ခဲခြင်း သို့မဟုတ် တုံ့ပြန်မှု မရှိခြင်း။', 'Very hard to rouse, or unresponsive.'),
        b('အသက်ရှူ ရပ်တန့်ခြင်း၊ အသံမြည်၍ ခက်ခဲစွာ ရှူခြင်း၊ နှုတ်ခမ်း ညိုခြင်း။', 'Pauses in breathing, noisy laboured breathing, or blue lips.'),
        b('အိပ်နေရာမှ ရုတ်တရက် ပြောင်းလဲသော ငိုသံ ပုံစံ။', 'A sudden marked change in cry pattern.'),
        b("နှိပ်လျှင် မပျောက်သော အနီစက်များ — ဖန်ခွက်ဖြင့် ဖိကြည့်ပါ။ ဖိထားစဉ် အနီရောင် မပျောက်ပါက ချက်ချင်း ဆေးရုံသို့ သွားပါ။", "A rash that does not fade when you press on it — press a clear glass against the skin. If the red marks stay visible while you press, go to hospital immediately."),
      ],
      referral: b(
        'ဤလက္ခဏာများသည် ချက်ချင်း ဆေးကုသမှု လိုအပ်ပါသည်။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ပါ။',
        'These need urgent medical care. This is not a diagnosis.',
      ),
      encouragement: b(
        'ဘေးကင်းသော အိပ်စက်မှုကို နေ့စဉ် ပြင်ဆင်ပေးနေခြင်းသည် အလွန် အရေးကြီးသော ကာကွယ်မှု ဖြစ်ပါသည်။',
        'Setting up safe sleep every single night is one of the most protective things you do.',
      ),
    }),
    'Sleep duration at 4–11 months follows WHO physical activity and sleep guidance for under-5s; back-to-sleep, firm flat clear surface, room-sharing without bed-sharing and smoke avoidance follow AAP safe sleep guidance, NHS SIDS advice and national safe-sleep guidance in the registry.',
  ),
];

const GUIDES_E: SeedItem[] = [
  kb(
    guide('3_4m', 'safety', {
      title: b('၃ – ၄ လ — ဘေးကင်းလုံခြုံရေး လမ်းညွှန်', '3–4 months — Safety guide'),
      why: b(
        'ဤအရွယ်တွင် ကလေးသည် လှိမ့်ရန် ကြိုးစားလာသဖြင့် ယခင်က ဘေးကင်းခဲ့သော နေရာများ အန္တရာယ် ဖြစ်လာသည်။ လက်လှမ်းယူတတ်လာသဖြင့် ပါးစပ်ထဲ ထည့်နိုင်သော ပစ္စည်းများကို ဖယ်ရှားရန် လိုအပ်သည်။ အန္တရာယ် အများစုကို ကြိုတင် ပြင်ဆင်ခြင်းဖြင့် ကာကွယ်နိုင်ပါသည်။',
        'Babies now try to roll, so places that were safe before are not. They also reach and grab, so anything that fits in the mouth must go. Most of these risks are preventable with a little setting up.',
      ),
      observationQuestions: [
        b('ကလေးအား ကုတင်၊ စားပွဲပေါ် တစ်ယောက်တည်း ထားခဲ့ဖူးပါသလား။', 'Have you ever left her alone on a bed or table?'),
        b('ကလေး လက်လှမ်းမီရာတွင် အသေးစား ပစ္စည်းများ ရှိပါသလား။', 'Are there small objects within her reach?'),
        b('ရေပူဗူး၊ ရေနွေးအိုးများ လက်လှမ်းမီရာတွင် ရှိပါသလား။', 'Are hot drinks or flasks within reach?'),
      ],
      dailyActivities: [
        b('အဝတ်လဲစဉ် လက်တစ်ဖက် အမြဲ ကလေးပေါ်တွင် ထားပါ။', 'Keep one hand on her at every nappy change.'),
        b('ကြမ်းပြင်ပေါ် အသေးစား ပစ္စည်းများ ရှိမရှိ စစ်ပါ။', 'Scan the floor for small objects.'),
        b('ရေနွေး၊ ကော်ဖီကို ကလေး ပွေ့ချီထားစဉ် မကိုင်ပါနှင့်။', 'Never hold a hot drink while holding the baby.'),
      ],
      weeklyActivities: [
        b('အိမ်တွင်း အန္တရာယ် စစ်ဆေးမှု တစ်ပတ်တစ်ကြိမ် လုပ်ပါ။', 'Do a weekly home safety check.'),
        b('ကာကွယ်ဆေး အချိန်ဇယားကို ပြန်ကြည့်ပါ။', 'Check the immunisation schedule is up to date.'),
      ],
      indoor: [
        b('ကြမ်းပြင်ပေါ် အဝတ်ခင်း၍ ကစားခြင်းက ကုတင်ထက် ပိုဘေးကင်းသည်။', 'Floor play on a cloth is safer than a bed.'),
      ],
      outdoor: [
        b('ကားစီးစဉ် သက်ဆိုင်ရာ ကလေးထိုင်ခုံ ရှိပါက နောက်ဘက်တွင် အသုံးပြုပါ။', 'If a car seat is available, use it in the back seat.'),
        b('တိုက်ရိုက် နေရောင်နှင့် အပူချိန်မြင့်မှုမှ ကာကွယ်ပါ။', 'Protect from direct sun and heat.'),
      ],
      lowCost: [
        b('အန္တရာယ်ရှိ ပစ္စည်းများကို မြင့်သောနေရာ ရွှေ့ထားခြင်းသည် ကုန်ကျစရိတ် မရှိပါ။', 'Moving hazards up high costs nothing.'),
      ],
      materials: b('မလိုအပ်ပါ — အိမ်ကို ပြင်ဆင်ရုံသာ', 'Nothing to buy — just rearranging the home'),
      safety: b(
        'ကလေးကို ကုတင်၊ စားပွဲ၊ ဆိုဖာပေါ်တွင် တစ်ယောက်တည်း လုံးဝ မထားပါနှင့် — လှိမ့်ကျနိုင်သည်။ ရေအနီးတွင် (ရေချိုးအင်တုံ၊ ရေပုံး) တစ်စက္ကန့်မျှ မခွာပါနှင့် — ရေနည်းငယ်ဖြင့်ပင် နစ်မြုပ်နိုင်သည်။ ကလေးကို လုံးဝ မလှုပ်ခါပါနှင့်။ ပါးစပ်ထဲ ဝင်နိုင်သော ပစ္စည်း၊ ပလတ်စတစ်အိတ်၊ ကြိုးရှည်များကို ဖယ်ပါ။ ဆေးလိပ်မီးခိုးမှ လုံးဝ ကင်းဝေးစေပါ။ ဆေးဝါးများကို လက်လှမ်းမမီရာတွင် ထားပါ။',
        'Never leave her alone on a bed, table or sofa — she can roll off. Never leave her alone near water, even a basin or bucket — a baby can drown in very little water. Never shake a baby. Remove anything that fits in the mouth, plastic bags and long cords. Keep her away from all tobacco smoke, and keep medicines out of reach.',
      ),
      commonMistakes: [
        b('"ခဏလေးပါ" ဟုဆိုကာ မြင့်သောနေရာတွင် ချထားခြင်း။', 'Leaving her "just for a second" on a high surface.'),
        b('ကလေးကို ပွေ့ချီရင်း ရေနွေး ကိုင်ခြင်း။', 'Carrying a hot drink while holding the baby.'),
        b('ရေချိုးပေးစဉ် အခြားလုပ်ငန်း လုပ်ခြင်း။', 'Doing something else during bath time.'),
      ],
      parentTips: [
        b('လိုအပ်လျှင် ကလေးကို ကုတင်ထဲ ချထားခဲ့ပါ — အန္တရာယ်ကင်းသည်။', 'When you must step away, put her in the cot — that is the safe option.'),
        b('ဆေးရုံ/ဆေးခန်း ဖုန်းနံပါတ်ကို လက်လှမ်းမီရာ ရေးထားပါ။', 'Write your local clinic’s number somewhere you can find it fast.'),
      ],
      faq: [
        {
          q: b('ကလေးကို ကားစီးစဉ် ပွေ့ချီထားလို့ ရလား။', 'Can I hold her in my lap in a car?'),
          a: b('မရပါ။ ပွေ့ချီထားခြင်းက ကာကွယ်မှု မပေးနိုင်ပါ။ ကလေးထိုင်ခုံ ရှိပါက အသုံးပြုပါ။', 'No. Holding gives no protection in a crash. Use a child restraint if one is available.'),
        },
        {
          q: b('အရေးပေါ် ဖြစ်ရင် ဘယ်လက္ခဏာတွေက ချက်ချင်း ပြရမလဲ။', 'Which signs mean go straight for help?'),
          a: b('အသက်ရှူ ခက်ခဲခြင်း၊ အရေပြား/နှုတ်ခမ်း ညိုခြင်း၊ တုံ့ပြန်မှု မရှိခြင်း၊ တက်ခြင်း၊ ဖျားခြင်း (လ ၃ လအောက်)၊ အစာ လုံးဝ မစားနိုင်ခြင်း — ချက်ချင်း ပြပါ။', 'Difficulty breathing, blue or grey colour, unresponsive or floppy, a seizure, fever under 3 months, or unable to feed at all — get help immediately.'),
        },
        { q: b("ဘယ်အပူချိန် ရောက်ရင် ဆေးရုံ သွားရမလဲ။", "What temperature means we should seek care?"), a: b("အပူချိန် တိုင်းပါ။ အသက် ၃ လအောက် ကလေး ၃၈°C (၁၀၀.၄°F) နှင့်အထက် ဖျားပါက — ကလေး ပုံမှန်လို ထင်ရလျှင်ပင် ချက်ချင်း ပြသပါ။ အသက် ၃ လမှ ၆ လကြား ၃၉°C (၁၀၂.၂°F) နှင့်အထက် ဖျားပါက အမြန် ပြသပါ။ အသက်မရွေး — ဖျားခြင်းနှင့်အတူ အသက်ရှူခက်ခြင်း၊ နှိပ်လျှင် မပျောက်သော အနီစက်၊ လည်ပင်း တောင့်တင်းခြင်း သို့မဟုတ် နိုးရခက်ခြင်း ပါလာပါက ချက်ချင်း ပြသပါ။ အပူချိန်တိုင်းကိရိယာ မရှိပါက — ကလေး ပူနေပြီး အထက်ပါ လက္ခဏာများ ပါလျှင် မစောင့်ဘဲ ပြသပါ။", "Take the temperature. Under 3 months, 38°C (100.4°F) or above: seek care straight away, even if the baby otherwise seems well. Between 3 and 6 months, 39°C (102.2°F) or above: seek care promptly. At any age, fever together with difficulty breathing, a rash that does not fade under pressure, a stiff neck, or being hard to wake: seek care immediately. If you have no thermometer, and the child feels hot and has any of those signs, do not wait.") },
      ],
      redFlags: [
        b('လဲကျပြီးနောက် အန်ခြင်း၊ တုံ့ပြန်မှု လျော့ခြင်း၊ ခေါင်းတွင် အဖူးအရောင် ရှိခြင်း။', 'After a fall: vomiting, reduced responsiveness, or swelling on the head.'),
        b('အသက်ရှူ ခက်ခဲခြင်း သို့မဟုတ် အရေပြား ညိုခြင်း။', 'Difficulty breathing or blue/grey colour.'),
        b('တက်ခြင်း သို့မဟုတ် နိုးမရခြင်း။', 'A seizure, or being unrousable.'),
        b("နှိပ်လျှင် မပျောက်သော အနီစက်များ — ဖန်ခွက်ဖြင့် ဖိကြည့်ပါ။ ဖိထားစဉ် အနီရောင် မပျောက်ပါက ချက်ချင်း ဆေးရုံသို့ သွားပါ။", "A rash that does not fade when you press on it — press a clear glass against the skin. If the red marks stay visible while you press, go to hospital immediately."),
      ],
      referral: b(
        'ဤလက္ခဏာများသည် ချက်ချင်း အရေးပေါ် ကုသမှု လိုအပ်ပါသည်။ သင့်ဒေသရှိ အနီးဆုံး ဆေးရုံ သို့မဟုတ် ကျန်းမာရေးဌာနသို့ ချက်ချင်း သွားပါ။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ပါ။',
        'These need emergency care now — go to your nearest hospital or health facility immediately. This is not a diagnosis.',
      ),
      encouragement: b(
        'ကြိုတင် ပြင်ဆင်ထားခြင်းက အန္တရာယ် အများစုကို ကာကွယ်နိုင်ပါသည်။',
        'Setting things up ahead of time prevents most of these injuries.',
      ),
    }),
    'Fall, drowning, choking, car-safety and abusive-head-trauma prevention follow AAP drowning-prevention guidance and the Bright Futures health-supervision reference in the registry; the urgent-sign list follows NHS seriously-ill-child advice, NICE fever in under-5s guidance and the WHO IMCI danger signs.',
  ),
  kb(
    guide('3_4m', 'daily_routine', {
      title: b('၃ – ၄ လ — နေ့စဉ် လုပ်ရိုးလုပ်စဉ် လမ်းညွှန်', '3–4 months — Daily routine guide'),
      why: b(
        'ဤအရွယ်တွင် နေ့စဉ် ပုံစံတစ်ခု တဖြည်းဖြည်း ပေါ်လာတတ်သည်။ တင်းကျပ်သော အချိန်ဇယား မလိုအပ်ပါ — ထပ်တလဲလဲ ဖြစ်နေသော အစီအစဉ် (တိုက်ကျွေး၊ ကစား၊ အိပ်) က ကလေးအား နောက်တစ်ခု ဘာဖြစ်မည်ကို ခန့်မှန်းစေပြီး စိတ်ငြိမ်စေသည်။',
        'A daily pattern starts to appear. A rigid timetable is not needed — a repeating shape of feed, play, sleep helps her predict what comes next, which is calming.',
      ),
      observationQuestions: [
        b('နေ့စဉ် အစီအစဉ် တစ်ခု ပေါ်လာပါသလား။', 'Is a daily pattern emerging?'),
        b('မောခြင်း၊ ဆာခြင်း လက္ခဏာများကို ခွဲခြားနိုင်ပါသလား။', 'Can you tell tired signs from hungry signs?'),
        b('အိပ်ရာဝင် အစီအစဉ် တစ်ခု ရှိပါသလား။', 'Is there a short bedtime routine?'),
      ],
      dailyActivities: [
        b('တိုက်ကျွေး → ကစား → အိပ် ပုံစံကို ထပ်ခါထပ်ခါ လုပ်ပါ။', 'Repeat the feed → play → sleep shape.'),
        b('နေ့ဘက် အလင်းရောင် ရအောင် ထားပါ။', 'Let daylight into the day.'),
        b('ညတိုင်း တူညီသော အိပ်ရာဝင် အစီအစဉ် လုပ်ပါ။', 'Keep the same short bedtime routine each night.'),
      ],
      weeklyActivities: [
        b('တစ်ပတ်စာ ပုံစံကို မှတ်တမ်းတင်ကြည့်ပါ။', 'Note the week’s pattern to see what is working.'),
        b('မိသားစုအတွင်း တာဝန်ခွဲဝေမှုကို ပြန်စဉ်းစားပါ။', 'Review how tasks are shared in the family.'),
      ],
      indoor: [
        b('အဝတ်လဲ၊ ရေချိုးချိန်များကို ကစားချိန်အဖြစ် သုံးပါ။', 'Use nappy and bath times as play times.'),
      ],
      outdoor: [
        b('နေ့စဉ် အရိပ်အောက် ခဏထွက်ခြင်းက အိပ်စက်မှု ပုံစံကို ကူညီသည်။', 'A short daily outing in the shade helps the sleep rhythm.'),
      ],
      lowCost: [
        b('ပုံစံတည်ဆောက်ခြင်းသည် ကုန်ကျစရိတ် မရှိပါ။', 'Building a routine costs nothing.'),
      ],
      materials: b('မလိုအပ်ပါ', 'Nothing required'),
      safety: b(
        'ရေချိုးစဉ် တစ်စက္ကန့်မျှ မခွာပါနှင့် — ရေနည်းငယ်ဖြင့်ပင် နစ်မြုပ်နိုင်သည်။ ရေအပူချိန်ကို မိမိ လက်ကောက်ဝတ်ဖြင့် စမ်းပါ။ အဝတ်လဲစဉ် လက်တစ်ဖက် အမြဲ ကလေးပေါ်တွင် ထားပါ။ ကာကွယ်ဆေး အချိန်ဇယားအတိုင်း ထိုးပါ။',
        'Never leave her alone in the bath, even for a moment — a baby can drown in very little water. Test the water with your wrist. Keep a hand on her at nappy changes. Keep immunisations on schedule.',
      ),
      commonMistakes: [
        b('တင်းကျပ်သော အချိန်ဇယားကို အတင်း လိုက်နာခြင်း။', 'Forcing a rigid timetable.'),
        b('မောလာသော လက္ခဏာများကို လျစ်လျူရှုခြင်း။', 'Ignoring tired signs.'),
      ],
      parentTips: [
        b('အစီအစဉ်သည် အချိန်မဟုတ်ဘဲ အစဉ်လိုက် ဖြစ်သည် — နာရီကို မလိုက်ပါနှင့်။', 'A routine is an order, not a clock — follow the sequence, not the time.'),
        b('တစ်ရက် ပျက်သွားလျှင် အဆင်ပြေပါသည်။', 'It is fine when a day falls apart.'),
      ],
      faq: [
        {
          q: b('အချိန်ဇယား တိတိကျကျ လိုအပ်လား။', 'Do I need an exact schedule?'),
          a: b('မလိုအပ်ပါ။ ထပ်တလဲလဲ ဖြစ်နေသော အစဉ်လိုက် တစ်ခုက လုံလောက်ပါသည်။', 'No. A repeating sequence is enough.'),
        },
        {
          q: b('ကာကွယ်ဆေး ထိုးပြီးရင် ဖျားတာ ပုံမှန်လား။', 'Is a fever after immunisation normal?'),
          a: b('အနည်းငယ် ဖျားခြင်းသည် ဖြစ်တတ်ပါသည်။ သို့သော် လ ၃ လအောက် ကလေး ဖျားပါက ချက်ချင်း ပြပါ။ ဖျားခြင်း ကြာရှည်ခြင်း၊ တုံ့ပြန်မှု လျော့ခြင်းကိုလည်း ပြပါ။', 'A mild fever can occur. But any fever in a baby under 3 months needs same-day assessment, and so does a fever that persists or comes with reduced responsiveness.'),
        },
        { q: b("ဘယ်အပူချိန် ရောက်ရင် ဆေးရုံ သွားရမလဲ။", "What temperature means we should seek care?"), a: b("အပူချိန် တိုင်းပါ။ အသက် ၃ လအောက် ကလေး ၃၈°C (၁၀၀.၄°F) နှင့်အထက် ဖျားပါက — ကလေး ပုံမှန်လို ထင်ရလျှင်ပင် ချက်ချင်း ပြသပါ။ အသက် ၃ လမှ ၆ လကြား ၃၉°C (၁၀၂.၂°F) နှင့်အထက် ဖျားပါက အမြန် ပြသပါ။ အသက်မရွေး — ဖျားခြင်းနှင့်အတူ အသက်ရှူခက်ခြင်း၊ နှိပ်လျှင် မပျောက်သော အနီစက်၊ လည်ပင်း တောင့်တင်းခြင်း သို့မဟုတ် နိုးရခက်ခြင်း ပါလာပါက ချက်ချင်း ပြသပါ။ အပူချိန်တိုင်းကိရိယာ မရှိပါက — ကလေး ပူနေပြီး အထက်ပါ လက္ခဏာများ ပါလျှင် မစောင့်ဘဲ ပြသပါ။", "Take the temperature. Under 3 months, 38°C (100.4°F) or above: seek care straight away, even if the baby otherwise seems well. Between 3 and 6 months, 39°C (102.2°F) or above: seek care promptly. At any age, fever together with difficulty breathing, a rash that does not fade under pressure, a stiff neck, or being hard to wake: seek care immediately. If you have no thermometer, and the child feels hot and has any of those signs, do not wait.") },
      ],
      redFlags: [
        b('ရုတ်တရက် ပုံစံ ပြောင်းလဲပြီး အစာ မစားနိုင်ခြင်း။', 'A sudden change in pattern with poor feeding.'),
        b('ဖျားခြင်း (လ ၃ လအောက် — ချက်ချင်း ပြရန်)။', 'Fever in a baby under 3 months — same-day assessment.'),
        b('တုံ့ပြန်မှု လျော့ခြင်း သို့မဟုတ် အလွန် ပျော့ခွေခြင်း။', 'Reduced responsiveness or unusual floppiness.'),
      ],
      referral: b(
        'ဤလက္ခဏာများ တွေ့ပါက ချက်ချင်း ကျန်းမာရေးဝန်ထမ်းထံ ပြပါ။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ပါ။',
        'See a health worker promptly if you notice these. This is not a diagnosis.',
      ),
      encouragement: b(
        'ပြီးပြည့်စုံသော နေ့စဉ်အစီအစဉ် မလိုပါ — ခန့်မှန်းနိုင်သော နေ့စဉ်ဘဝက လုံလောက်ပါသည်။',
        'You do not need a perfect routine — a predictable one is enough.',
      ),
    }),
    'Predictable daily routines and responsive care follow the WHO/UNICEF nurturing care framework; bath drowning precautions follow AAP drowning-prevention guidance, and the under-3-month fever rule follows NICE fever in under-5s guidance.',
  ),
];

// --- Activities ------------------------------------------------------------

const ACTIVITIES: SeedItem[] = [
  kb(
    activity({
      slug: 'copy_my_sound',
      title: b('အသံ အတုယူ ကစားခြင်း', 'Copy-my-sound game'),
      summary: b('ကလေးထွက်သော အသံကို ပြန်အတုယူပြီး အလှည့်ကျ စကားပြောခြင်း။', 'Copy the sounds your baby makes and take turns.'),
      ageGroupKey: '3_4m',
      domains: ['speech', 'communication', 'social'],
      difficulty: 'easy',
      durationMinutes: 5,
      materials: b('မလိုအပ်ပါ — သင့်အသံနှင့် မျက်နှာသာ။', 'None — just your voice and face.'),
      setup: b('ကလေးကို မျက်နှာချင်းဆိုင် ၂၀–၃၀ စင်တီမီတာ အကွာတွင် ထားပါ။ တိတ်ဆိတ်သော နေရာ ရွေးပါ။', 'Sit face to face about 20–30 cm away, in a quiet spot.'),
      instructions: [
        b('ကလေး အသံထွက်သည်ကို စောင့်ပါ ("အူး"၊ "အာ")။', 'Wait for a sound — "ooh", "aah".'),
        b('ထိုအသံအတိုင်း ပြန်ဆိုပါ။', 'Copy that exact sound back.'),
        b('ပြီးလျှင် ၅ စက္ကန့်ခန့် ရပ်နား စောင့်ပါ။', 'Then pause for about five seconds and wait.'),
        b('ကလေး ပြန်ထွက်လျှင် ထပ်ဆိုပါ — အလှည့်ကျ ဖြစ်စေပါ။', 'When she answers, copy again — build the turns.'),
        b('ကလေး မျက်နှာလွှဲ သို့မဟုတ် မောပုံရလျှင် ရပ်ပါ။', 'Stop when she looks away or seems tired.'),
      ],
      safety: b('အသံ ကျယ်လောင်စွာ မထွက်ပါနှင့်။ မောပန်းသည့် လက္ခဏာကို လေးစားပါ။', 'Keep your voice soft, never loud. Respect tired cues.'),
      indoor: true, outdoor: true, oneChild: true, group: false, parentChild: true,
      outcomes: [
        b('အလှည့်ကျ ဆက်သွယ်ခြင်းနှင့် အသံထွက်မှုကို အားပေးရန်။', 'Learning objective — to build vocal turn-taking and encourage more sounds.'),
        b('မျက်လုံးချင်းဆိုင်မှုနှင့် ပူးတွဲ အာရုံစိုက်မှု တိုးလာခြင်း။', 'More eye contact and shared attention.'),
      ],
      variations: [b('မိသားစုဝင် အသီးသီးက အလှည့်ကျ လုပ်ပေးပါ။', 'Let different family members take a turn.')],
      tags: ['speech_activity', 'daily'],
    }),
    'Vocal imitation and contingent turn-taking with infants are supported by NHS learn-to-talk guidance, the WHO Care for Child Development counselling materials and CDC milestone guidance for 4 months.',
  ),
  kb(
    activity({
      slug: 'reach_for_the_toy',
      title: b('ကစားစရာကို လှမ်းယူခြင်း', 'Reach for the toy'),
      summary: b('ကလေးရှေ့တွင် ပစ္စည်းတစ်ခု ကိုင်ပြပြီး လှမ်းရန် ဖိတ်ခေါ်ခြင်း။', 'Hold a toy within reach and invite your baby to swipe and grasp.'),
      ageGroupKey: '3_4m',
      domains: ['fine_motor', 'cognitive', 'play'],
      difficulty: 'easy',
      durationMinutes: 5,
      materials: b('ပါးစပ်ထဲ မဝင်နိုင်လောက်အောင် ကြီးသော ကစားစရာ တစ်ခု။', 'One toy too large to fit in the mouth.'),
      setup: b('ကလေးကို ပြားသော မျက်နှာပြင်ပေါ် ပက်လက် လှဲပါ။', 'Lay your baby on the back on a flat surface.'),
      instructions: [
        b('ကစားစရာကို ရင်ဘတ်အထက် ၂၀–၃၀ စင်တီမီတာတွင် ကိုင်ပါ။', 'Hold the toy about 20–30 cm above her chest.'),
        b('ကလေး မြင်သည်အထိ စောင့်ပါ။', 'Wait until she looks at it.'),
        b('ဖြေးညှင်းစွာ ဘယ်ဘက်၊ ညာဘက် ရွှေ့ပြပါ။', 'Move it slowly to the left, then the right.'),
        b('ကလေး လှမ်းလာလျှင် ကိုင်ခွင့် ပေးပါ။', 'When she swipes, let her take hold of it.'),
        b('ကိုင်မိတိုင်း အသံဖြင့် ချီးကျူးပါ။', 'Cheer each successful catch.'),
      ],
      safety: b('အသေးစား ပစ္စည်း လုံးဝ မသုံးပါနှင့် — လည်ချောင်းပိတ် နိုင်သည်။ ကြိုးရှည် တပ်ထားသော ပစ္စည်း မသုံးပါနှင့်။ တစ်ယောက်တည်း မထားပါနှင့်။', 'Never use anything small enough to fit in the mouth — it can choke. No long cords. Never leave her alone with it.'),
      indoor: true, outdoor: true, oneChild: true, group: false, parentChild: true,
      outcomes: [
        b('မျက်စိနှင့် လက် ညှိနှိုင်းမှုကို တိုးတက်စေရန်။', 'Learning objective — to develop eye–hand coordination and reaching.'),
        b('လက်နှစ်ဖက် ရင်ဘတ်အလယ်တွင် ဆုံစည်းမှု တိုးလာခြင်း။', 'More hands-to-midline activity.'),
      ],
      variations: [b('မှောက်ချထားစဉ်လည်း ရှေ့တွင် ထား၍ လုပ်နိုင်သည်။', 'Try it during tummy time with the toy in front.')],
      tags: ['motor_activity', 'daily'],
    }),
    'Reaching and eye–hand coordination at 3–4 months follow CDC and AAP milestone guidance; the choking and strangulation precautions follow AAP safe sleep and play guidance.',
  ),
  kb(
    activity({
      slug: 'peek_a_boo_cloth',
      title: b('အဝတ်ဖြင့် "ဘူး" ကစားခြင်း', 'Peek-a-boo with a cloth'),
      summary: b('ပါးလွှာသော အဝတ်ဖြင့် မျက်နှာဖုံး၍ ပြန်ဖော်ပြခြင်း — ပျော်ရွှင်မှုနှင့် ခန့်မှန်းတတ်မှု။', 'Hide and reveal your face with a light cloth — delight plus prediction.'),
      ageGroupKey: '3_4m',
      domains: ['social', 'emotional', 'cognitive'],
      difficulty: 'easy',
      durationMinutes: 5,
      materials: b('ပါးလွှာသော အဝတ်စ တစ်ထည်။', 'One light cloth.'),
      setup: b('ကလေးကို မျက်နှာချင်းဆိုင် ထားပါ။ ကလေး နိုးနေပြီး ကျေနပ်နေချိန် ရွေးပါ။', 'Sit face to face when she is awake and content.'),
      instructions: [
        b('သင်၏ မျက်နှာကို အဝတ်ဖြင့် ခဏ ဖုံးပါ။', 'Cover your own face with the cloth for a moment.'),
        b('"ဘူး" ဟု ပြောရင်း ဖော်ပြပါ။', 'Reveal your face and say "boo".'),
        b('ကလေး၏ တုံ့ပြန်မှုကို စောင့်ကြည့်ပါ။', 'Watch for her reaction.'),
        b('တူညီစွာ ထပ်ခါထပ်ခါ လုပ်ပါ — ခန့်မှန်းတတ်လာစေသည်။', 'Repeat the same way — repetition builds prediction.'),
        b('ကလေး မောလာလျှင် ရပ်ပါ။', 'Stop when she tires.'),
      ],
      safety: b('ကလေး၏ မျက်နှာကို အဝတ်ဖြင့် လုံးဝ မဖုံးပါနှင့် — သင်၏ မျက်နှာကိုသာ ဖုံးပါ။ ပလတ်စတစ် မသုံးပါနှင့်။', 'Never cover the baby’s face — cover only your own. Never use plastic.'),
      indoor: true, outdoor: true, oneChild: true, group: false, parentChild: true,
      outcomes: [
        b('လူမှုဆက်ဆံမှုနှင့် ခန့်မှန်းတတ်မှုကို အားပေးရန်။', 'Learning objective — to build social engagement and early prediction.'),
        b('ရယ်မောခြင်း၊ ပြုံးခြင်း တုံ့ပြန်မှု များလာခြင်း။', 'More smiling and laughing responses.'),
      ],
      tags: ['social_activity', 'daily'],
    }),
    'Social games such as peek-a-boo and the social smile at 3–4 months follow CDC milestone guidance, AAP play guidance and the WHO/UNICEF nurturing care framework; the face-covering caution follows AAP safe sleep guidance.',
  ),
  kb(
    activity({
      slug: 'picture_book_naming',
      title: b('ပုံစာအုပ် ကြည့်၍ အမည်ခေါ်ခြင်း', 'Naming pictures in a book'),
      summary: b('ပုံစာအုပ်ကို အတူလှန်ကြည့်ပြီး ပုံများကို အမည်ခေါ်ခြင်း။', 'Look at a picture book together and name what you see.'),
      ageGroupKey: '3_4m',
      domains: ['language', 'communication', 'cognitive'],
      difficulty: 'easy',
      durationMinutes: 5,
      materials: b('ပုံကြီးကြီး၊ အရောင်ရှင်းရှင်းရှိသော စာအုပ် သို့မဟုတ် အိမ်လုပ် ပုံကတ်။', 'A book with large clear pictures, or home-made picture cards.'),
      setup: b('ကလေးကို ပေါင်ပေါ် မှီထားပြီး စာအုပ်ကို မျက်နှာမှ ၃၀ စင်တီမီတာခန့်တွင် ကိုင်ပါ။', 'Support her on your lap and hold the book about 30 cm from her face.'),
      instructions: [
        b('စာမျက်နှာ တစ်ခုကို ဖွင့်ပြပါ။', 'Open to one page.'),
        b('ပုံကို လက်ညှိုးထိုးပြီး အမည်ကို ရှင်းရှင်း ခေါ်ပါ။', 'Point at the picture and name it clearly.'),
        b('ကလေး၏ တုံ့ပြန်မှုကို စောင့်ပါ — အသံ သို့မဟုတ် ကြည့်မှု။', 'Pause for her response — a sound or a look.'),
        b('စာလုံးအားလုံး မဖတ်ဘဲ ပုံအကြောင်း ပြောပြရုံဖြင့် ရပါသည်။', 'You do not have to read the words — talking about the picture is enough.'),
        b('ကလေး လှည့်ထွက်လျှင် ရပ်ပါ။', 'Stop when she turns away.'),
      ],
      safety: b('စာအုပ်ကို ကိုက်လျှင် စက္ကူစ ကွာမလာစေရန် ကြည့်ပါ။ အသေးစား စာအုပ်တွဲ ကြိုးများကို ဖယ်ပါ။ ဖန်သားပြင်ဖြင့် အစားမထိုးပါနှင့်။', 'Watch that pages do not tear off if she mouths the book. Remove small binding cords. Do not substitute a screen.'),
      indoor: true, outdoor: false, oneChild: true, group: false, parentChild: true,
      outcomes: [
        b('ဘာသာစကား ကြားနာမှုနှင့် ပူးတွဲ အာရုံစိုက်မှုကို တိုးမြှင့်ရန်။', 'Learning objective — to increase language exposure and shared attention.'),
        b('စာအုပ်နှင့် ရင်းနှီးမှု စတင်ခြင်း။', 'Early familiarity with books.'),
      ],
      variations: [b('စာအုပ် မရှိပါက အိမ်တွင်း ပစ္စည်းများကို လက်ညှိုးထိုး၍ အမည်ခေါ်ပါ။', 'No book? Point at and name household objects instead.')],
      tags: ['reading_activity', 'daily'],
    }),
    'Shared book-looking and naming as early language input follow NHS learn-to-talk guidance, AAP early-literacy guidance, Canadian early-literacy guidance and the shared book-reading research in the registry; the no-screen note follows AAP media guidance.',
  ),
  kb(
    activity({
      slug: 'rhythm_and_rock',
      title: b('သီချင်းဆို၍ ယိမ်းပေးခြင်း', 'Sing and sway'),
      summary: b('မြန်မာ ကလေးသီချင်းများကို ဆိုရင်း ဖြေးညှင်းစွာ ယိမ်းပေးခြင်း။', 'Sing familiar Myanmar rhymes while gently swaying.'),
      ageGroupKey: '3_4m',
      domains: ['emotional', 'communication', 'play'],
      difficulty: 'easy',
      durationMinutes: 5,
      materials: b('မလိုအပ်ပါ — သင့်အသံသာ။', 'None — just your voice.'),
      setup: b('ကလေးကို ခေါင်းနှင့် လည်ပင်းကို ထောက်ပံ့ပေးလျက် ပွေ့ချီပါ။', 'Hold your baby with head and neck supported.'),
      instructions: [
        b('သီချင်းတစ်ပုဒ်ကို နူးညံ့စွာ စဆိုပါ။', 'Start a song softly.'),
        b('သီချင်းအတိုင်း ဖြေးညှင်းစွာ ယိမ်းပါ။', 'Sway slowly in time with the song.'),
        b('တူညီသော သီချင်းများကို ထပ်ခါထပ်ခါ ဆိုပါ။', 'Repeat the same few songs.'),
        b('ကလေး တုံ့ပြန်လျှင် ရပ်နား၍ တုံ့ပြန်ပြန်ပါ။', 'When she responds, pause and answer her.'),
        b('အိပ်ရာဝင်ချိန်တွင် တစ်ပုဒ်တည်းကို ပုံမှန် ဆိုပါ။', 'Use one regular song at bedtime.'),
      ],
      safety: b('လုံးဝ မလှုပ်ခါပါနှင့် — ဖြေးညှင်းစွာသာ ယိမ်းပါ။ ခေါင်းနှင့် လည်ပင်းကို အမြဲ ထောက်ပံ့ပါ။ ကလေးအိပ်ပျော်သွားလျှင် ပက်လက် အိပ်ရာသို့ ပြောင်းပေးပါ။', 'Never shake — sway slowly only. Always support head and neck. If she falls asleep, move her onto her back in her own sleep space.'),
      indoor: true, outdoor: true, oneChild: true, group: false, parentChild: true,
      outcomes: [
        b('အသံအနေအထား၊ စည်းချက်ကို ခံစားစေပြီး စိတ်ငြိမ်စေရန်။', 'Learning objective — to experience rhythm and tone, and to settle.'),
        b('အိပ်ရာဝင် အစီအစဉ်ကို ခိုင်မာစေခြင်း။', 'A stronger bedtime routine.'),
      ],
      tags: ['music_activity', 'daily'],
    }),
    'Singing, rhythm and rocking as soothing and early language input follow the WHO Care for Child Development materials and the bedtime-routine research in the registry; the never-shake and back-to-sleep points follow AAP safe sleep guidance.',
  ),
  kb(
    activity({
      slug: 'texture_basket_infant',
      title: b('အထိအတွေ့ အမျိုးမျိုး လေ့လာခြင်း', 'Exploring different textures'),
      summary: b('လုံခြုံသော အဝတ်စ အမျိုးမျိုးကို ကိုင်တွယ် ထိတွေ့စေခြင်း။', 'Let your baby touch and hold a few safe, different fabrics.'),
      ageGroupKey: '3_4m',
      domains: ['fine_motor', 'cognitive', 'play'],
      difficulty: 'easy',
      durationMinutes: 5,
      materials: b('သန့်ရှင်းသော အဝတ်စ ၃–၄ မျိုး (ချည်၊ ပိုးလိမ်၊ ကြမ်းသောအဝတ်) — အသေးစား မဟုတ်ရ။', 'Three or four clean fabric pieces — cotton, smooth, rough — none small enough to swallow.'),
      setup: b('ကလေးကို ပက်လက် သို့မဟုတ် ပေါင်ပေါ် မှီ၍ ထားပါ။', 'Lay her on her back or support her on your lap.'),
      instructions: [
        b('အဝတ်စ တစ်ခုကို လက်ထဲ ထည့်ပေးပါ။', 'Place one fabric in her hand.'),
        b('ထိုအထိအတွေ့ကို စကားဖြင့် ဖော်ပြပါ ("နူးနူးလေး")။', 'Describe the feel out loud — "so soft".'),
        b('လက်၊ ခြေထောက်၊ ပါးတွင် နူးညံ့စွာ ထိပေးပါ။', 'Gently touch it to her hand, foot and cheek.'),
        b('နောက်တစ်မျိုးသို့ ပြောင်းပါ — တစ်ခါလျှင် တစ်မျိုးသာ။', 'Move to the next fabric — one at a time.'),
        b('တုံ့ပြန်မှုကို စောင့်ကြည့်ပြီး မကြိုက်လျှင် ရပ်ပါ။', 'Watch her response and stop if she dislikes it.'),
      ],
      safety: b('မျက်နှာပေါ် အဝတ် လုံးဝ မတင်ထားပါနှင့် — အသက်ရှူပိတ် နိုင်သည်။ ပလတ်စတစ်အိတ် လုံးဝ မသုံးပါနှင့်။ ကြိုးရှည်၊ အသေးစား အလှဆင်ပစ္စည်း တပ်ထားသော အဝတ်များ မသုံးပါနှင့်။ တစ်ယောက်တည်း မထားပါနှင့်။', 'Never leave a cloth over her face — it can suffocate. Never use plastic bags. No long cords or small decorations sewn on. Never leave her alone with the fabrics.'),
      indoor: true, outdoor: false, oneChild: true, group: false, parentChild: true,
      outcomes: [
        b('ထိတွေ့ခံစားမှု အမျိုးမျိုးကို လေ့လာစေပြီး ကိုင်တွယ်မှုကို အားပေးရန်။', 'Learning objective — to explore touch and encourage grasping.'),
        b('အထိအတွေ့ဆိုင်ရာ စကားလုံးများကို ကြားနာခြင်း။', 'Exposure to words that describe textures.'),
      ],
      variations: [b('ရေချိုးပြီးချိန်တွင် မတူညီသော မျက်နှာသုတ်ပဝါများဖြင့် လုပ်ပါ။', 'Try it after a bath with different towels.')],
      tags: ['sensory_activity', 'weekly'],
    }),
    'Tactile exploration and grasping play at 3–4 months follow the paediatric occupational-therapy references in the registry and the WHO Care for Child Development materials; suffocation and choking precautions follow AAP safe sleep guidance.',
  ),
];

// --- Printable -------------------------------------------------------------

const PRINTABLES: SeedItem[] = [
  kb(
    printable({
      key: 'checklist_3_4m',
      format: 'A4 PDF',
      title: b('၃ – ၄ လ — မိဘ စစ်ဆေးစာရင်း', '3–4 months — Parent checklist'),
      description: b(
        'ဤအရွယ်အတွက် သတိပြုစရာများ၊ ဘေးကင်းစွာ အိပ်စက်ရေးနှင့် လှိမ့်ကျခြင်း ကာကွယ်ရေး စည်းမျဉ်းများ၊ တိုက်ကျွေးမှု မှတ်စုနှင့် ကျန်းမာရေးဝန်ထမ်းအား မေးရန် မေးခွန်းများ ပါဝင်သော စာရင်း — လမ်းညွှန်သာ ဖြစ်ပြီး ရောဂါ စစ်ဆေးမှု မဟုတ်ပါ။',
        'What to notice at this age, the safe-sleep and roll-off rules, a feeding note, and questions to ask at a health visit — a guide, not a diagnostic test.',
      ),
    }),
    'Checklist content is drawn from the CDC milestone checklists, AAP milestone guidance, AAP safe sleep guidance, WHO infant feeding guidance and the NHS baby review schedule; it is explicitly framed as guidance rather than screening.',
  ),
];

export const M3_4M: SeedItem[] = [
  ...MILESTONES,
  ...GUIDES,
  ...GUIDES_B,
  ...GUIDES_C,
  ...GUIDES_D,
  ...GUIDES_E,
  ...ACTIVITIES,
  ...PRINTABLES,
];
