// Knowledge base — 5 to 6 months.
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
    milestone('5_6m', 'gross_motor', 2, {
      title: b('တစ်ဖက်မှ တစ်ဖက်သို့ လှိမ့်ခြင်း', 'Rolling from back to front and front to back'),
      observe: b('ကလေးသည် ပက်လက်မှ မှောက်သို့၊ မှောက်မှ ပက်လက်သို့ လှိမ့်နိုင်ပါသလား။', 'Can your baby roll from back to front, and from front to back?'),
      why: b('လှိမ့်ခြင်းသည် များသောအားဖြင့် ၄ လမှ ၆ လကြားတွင် စတတ်ပြီး ကွာဟမှု ကျယ်ပါသည်။ တစ်ဖက်ကို အရင်တတ်ပြီး နောက်တစ်ဖက်ကို နောက်မှ တတ်တတ်သည်။', 'Rolling usually appears between about 4 and 6 months, with wide variation. One direction often comes well before the other.'),
      red: b('လ ၆ လအရွယ်တွင် လှိမ့်ရန် လုံးဝ မကြိုးစားခြင်း၊ ကိုယ်တစ်ဖက်ခြမ်းသာ လှုပ်ရှားခြင်းကို ကျန်းမာရေးဝန်ထမ်းအား ပြပါ။', 'No attempt to roll at all by 6 months, or movement on one side of the body only, is worth checking.'),
      encouragement: b('ကြမ်းပြင်ပေါ် လွတ်လပ်စွာ လှုပ်ရှားခွင့် ပေးပါ — အကောင်းဆုံး လေ့ကျင့်ခန်း ဖြစ်သည်။', 'Free floor time is the best practice there is.'),
    }),
    'Rolling between about 4 and 6 months follows CDC and AAP milestone guidance and the WHO motor development study windows.',
  ),
  kb(
    milestone('5_6m', 'fine_motor', 1, {
      title: b('ပစ္စည်းကို လက်တစ်ဖက်မှ တစ်ဖက်သို့ ပြောင်းကိုင်ခြင်း', 'Passing an object from one hand to the other'),
      observe: b('ကိုင်ထားသော ပစ္စည်းကို အခြားလက်သို့ ပြောင်းကိုင်ပါသလား။ လက်ဖဝါးတစ်ခုလုံးဖြင့် ဆုပ်ကိုင်ပါသလား။', 'Does she move a toy from one hand to the other? Does she grab with the whole palm?'),
      why: b('ဤအရွယ်တွင် အလိုရှိသလို လှမ်းယူနိုင်လာပြီး လက်နှစ်ဖက် ပူးတွဲ အသုံးပြုမှု စတင်သည်။ ကိုင်မိသမျှကို ပါးစပ်ထဲ ထည့်ခြင်းသည် သင်ယူမှု ဖြစ်သည်။', 'Reaching becomes deliberate and the two hands start working together. Mouthing what she catches is learning, not a problem.'),
      red: b('လ ၆ လအရွယ်တွင် ပစ္စည်းကို လုံးဝ မလှမ်းယူခြင်း၊ လက်တစ်ဖက်တည်းကိုသာ အမြဲ သုံးခြင်းကို ပြပါ။', 'No reaching at all by 6 months, or always using one hand only, should be checked.'),
      encouragement: b('လုံခြုံသော ပစ္စည်းများကို လက်လှမ်းမီရာတွင် ထားပေးပါ။', 'Keep a few safe objects within reach.'),
    }),
    'Deliberate reaching and hand-to-hand transfer at 5–6 months follow CDC milestone checklists, AAP milestone guidance and the paediatric occupational-therapy references in the registry.',
  ),
  kb(
    milestone('5_6m', 'speech', 2, {
      title: b('"ဘ"၊ "ဒ" ကဲ့သို့ ဗျည်းသံများ ပေါင်းစပ် မြည်တွန်ခြင်း', 'Babbling with consonant sounds like "ba" and "da"'),
      observe: b('"ဘဘဘ"၊ "ဒဒဒ" ကဲ့သို့ အသံများ ထွက်ပါသလား။', 'Do you hear strings like "ba-ba-ba" or "da-da-da"?'),
      why: b('“ဘဘ”၊ “မမ” ကဲ့သို့ ဗျည်းသံတွဲများ ထပ်ခါတလဲလဲ ထွက်လာခြင်းသည် နောက်ပိုင်း စကားပြောနိုင်ရန် အသံထွက်လေ့ကျင့်နေခြင်း ဖြစ်သည်။ အဓိပ္ပာယ်ရှိသော စကားလုံး မဟုတ်သေးသော်လည်း အရေးကြီးသော ဖွံ့ဖြိုးမှုအဆင့်တစ်ခု ဖြစ်သည်။', 'Consonant babble is the practice run for speech. It does not carry meaning yet, but it is an important step.'),
      red: b('လ ၆ လအရွယ်တွင် အသံ လုံးဝ မထွက်ခြင်း၊ ကျယ်လောင်သော အသံကို မတုံ့ပြန်ခြင်း သို့မဟုတ် ယခင်က ထွက်ခဲ့သော အသံများ ရပ်သွားခြင်းကို ပြပါ။', 'No sounds at all by 6 months, no reaction to loud sounds, or losing sounds she used to make should be checked.'),
      encouragement: b('ကလေးထွက်သော အသံကို ပြန်အတုယူပါ — စကားဝိုင်း ဖြစ်လာပါမည်။', 'Copy her sounds back — that turns babble into conversation.'),
    }),
    'Consonant babbling at 5–6 months follows CDC and AAP milestone guidance, NHS learn-to-talk advice and the speech-language pathology references in the registry.',
  ),
  kb(
    milestone('5_6m', 'language', 1, {
      title: b('နာမည်ခေါ်လျှင် လှည့်ကြည့်ခြင်း', 'Turning when her name is called'),
      observe: b('နာမည်ခေါ်လျှင် လှည့်ကြည့်ပါသလား။ အသံအနေအထား ပြောင်းလျှင် တုံ့ပြန်ပါသလား။', 'Does she turn when you call her name? Does she react to changes in your tone?'),
      why: b('ဤသည် ဘာသာစကား နားလည်မှု၏ အစောဆုံး လက္ခဏာ ဖြစ်သည်။ အားလုံး တစ်ချိန်တည်း မတတ်ကြပါ — ကွာဟမှု ရှိသည်။', 'This is one of the earliest signs of language understanding. Babies get there at different times.'),
      red: b('နာမည်ခေါ်လျှင် လုံးဝ မတုံ့ပြန်ခြင်း၊ အသံကို လုံးဝ မတုံ့ပြန်ခြင်းကို နားကြားစစ်ဆေးရန် ပြပါ။', 'No response at all to her name or to sound should prompt a hearing check.'),
      encouragement: b('နေ့စဉ် နာမည်ကို မကြာခဏ ခေါ်ပေးပါ။', 'Use her name often through the day.'),
    }),
    'Responding to name and early receptive language at 5–6 months follow CDC and AAP milestone guidance, AAP developmental-surveillance guidance and the language-development references in the registry.',
  ),
  kb(
    milestone('5_6m', 'social', 1, {
      title: b('အသိမျက်နှာနှင့် အသစ်ကို ခွဲခြားလာခြင်း', 'Telling familiar people from strangers'),
      observe: b('အသိမိသားစုဝင်များကို မြင်လျှင် ပိုပျော်ပါသလား။ အသစ်တွေ့သူများကို ကြည့်နေတတ်ပါသလား။', 'Is she happier with familiar people? Does she stare at new faces?'),
      why: b('အသစ်တွေ့သူကို သတိထားခြင်းသည် ဆက်နွယ်မှု ကောင်းမွန်နေခြင်း၏ လက္ခဏာ ဖြစ်သည် — ပြဿနာ မဟုတ်ပါ။', 'Wariness of new people is a sign of healthy attachment, not a problem.'),
      red: b('လူများနှင့် လုံးဝ မဆက်သွယ်ခြင်း၊ မျက်လုံးချင်း လုံးဝ မဆုံခြင်း၊ ယခင် တုံ့ပြန်မှုများ ပျောက်သွားခြင်းကို ပြပါ။', 'No social engagement at all, no eye contact, or loss of skills she had should be checked.'),
      encouragement: b('အသစ်တွေ့သူများနှင့် တဖြည်းဖြည်း မိတ်ဆက်ပေးပါ — အလျင်စလို မလုပ်ပါနှင့်။', 'Introduce new people slowly — no need to rush.'),
    }),
    'Familiar-versus-unfamiliar discrimination and early attachment at 5–6 months follow CDC and AAP milestone guidance, NICE social and emotional wellbeing guidance and the developmental-behavioural paediatrics references in the registry.',
  ),
  kb(
    milestone('5_6m', 'cognitive', 2, {
      title: b('ကျသွားသော ပစ္စည်းကို လိုက်ရှာကြည့်ခြင်း', 'Looking for a dropped object'),
      observe: b('ပစ္စည်း ကျသွားလျှင် အောက်သို့ လိုက်ကြည့်ပါသလား။ ပစ္စည်းကို လှုပ်၍ ဘာဖြစ်မလဲ စမ်းကြည့်ပါသလား။', 'Does she look down when something falls? Does she shake things to see what happens?'),
      why: b('ဤသည် အကြောင်းအကျိုး နားလည်မှု၏ အစ ဖြစ်သည်။ ထပ်ခါထပ်ခါ လုပ်ကြည့်ခြင်းဖြင့် သင်ယူသည်။', 'This is the beginning of cause and effect. Repetition is how it is learned.'),
      red: b('ပတ်ဝန်းကျင်ကို လုံးဝ စိတ်မဝင်စားခြင်း၊ ပစ္စည်းကို လုံးဝ မကြည့်ခြင်းကို ပြပါ။', 'No interest in surroundings, or not looking at objects at all, should be checked.'),
      encouragement: b('ကျသွားသည်ကို ပြန်ကောက်ပေးခြင်းသည် ကစားနည်း ဖြစ်သည် — ငြီးငွေ့စရာ မဟုတ်ပါ။', 'Picking it up again is the game, not a chore.'),
    }),
    'Object permanence precursors and cause-and-effect play at 5–6 months follow CDC and AAP milestone guidance and standard paediatric developmental references in the registry.',
  ),
  kb(
    milestone('5_6m', 'nutrition', 1, {
      title: b('အစားအစာ စတင်ရန် အသင့်ဖြစ်မှု လက္ခဏာများ', 'Signs of readiness for first foods'),
      observe: b('ထောက်ပံ့ပေးလျှင် ထိုင်နိုင်ပြီး ခေါင်းကို မတ်မတ် ထားနိုင်ပါသလား။ အစားအစာကို စိတ်ဝင်စားပါသလား။ ကိုယ်တိုင် ပါးစပ်ထဲ ထည့်နိုင်ပါသလား။', 'Can she sit with support and hold her head steady? Is she interested in food? Can she bring food to her mouth?'),
      why: b('အသက် ၆ လဝန်းကျင်တွင် အစားအစာ စတင်ရန် အကြံပြုထားသည်။ ဤလက္ခဏာ သုံးမျိုးစလုံး ရှိမှသာ စသင့်သည်။ ထို့နောက်တွင်လည်း နို့ကို ၂ နှစ်အထိ ဆက်တိုက်ကျွေးနိုင်သည်။', 'Starting solids is recommended at around 6 months, when all three signs are present. Milk continues alongside — breastfeeding can carry on to 2 years and beyond.'),
      red: b('ကိုယ်အလေးချိန် မတက်ခြင်း၊ အစားအစာ မျိုချရန် ခက်ခဲခြင်း၊ စားစဉ် ချောင်းဆိုးခြင်း အကြိမ်များခြင်းကို ပြပါ။', 'Weight not rising, difficulty swallowing, or frequent coughing with feeds should be checked.'),
      encouragement: b('အလျင်စလို မလုပ်ပါနှင့် — ကလေး၏ လက္ခဏာကို စောင့်ပါ။', 'There is no rush — wait for her signs.'),
    }),
    'Readiness signs and the around-six-months start for complementary feeding follow WHO complementary feeding guidance, the WHO infant and young child feeding model chapter and NHS advice on first solid foods.',
  ),
  kb(
    milestone('5_6m', 'sleep', 1, {
      title: b('အိပ်စက်မှု ပုံစံ ပိုမို ခိုင်မာလာခြင်း', 'A clearer sleep pattern'),
      observe: b('နေ့အိပ်ချိန်များ ပိုမှန်လာပါသလား။ ညဘက် အိပ်ချိန် ရှည်လာပါသလား။', 'Are naps becoming more regular? Are night stretches longer?'),
      why: b('အသက် ၄–၁၁ လအရွယ်တွင် စုစုပေါင်း အိပ်ချိန် ၁၂–၁၆ နာရီခန့် (နေ့အိပ် အပါအဝင်) ဖြစ်တတ်သည်။ ညဘက် နိုးခြင်းသည် ဤအရွယ်တွင်လည်း ပုံမှန် ဖြစ်သည်။ ကလေး လှိမ့်နိုင်လာသဖြင့် အိပ်ရာကို ပိုလုံခြုံအောင် ထားရန် လိုသည်။', 'Total sleep at 4–11 months is commonly about 12–16 hours including naps. Night waking is still normal. Now that she rolls, the sleep space matters even more.'),
      red: b('နိုးရန် အလွန်ခက်ခဲခြင်း၊ အသက်ရှူ ရပ်တန့်ခြင်း၊ အသံမြည်၍ ခက်ခဲစွာ ရှူခြင်းကို ချက်ချင်း ပြပါ။', 'Very hard to rouse, pauses in breathing, or noisy laboured breathing need prompt review.'),
      encouragement: b('ညတိုင်း တူညီသော အိပ်ရာဝင် အစီအစဉ်က ကူညီပါသည်။', 'The same short bedtime routine each night helps.'),
    }),
    'Sleep amounts at 4–11 months follow WHO physical activity and sleep guidance for under-5s; the safe sleep space and the urgent breathing signs follow AAP safe sleep guidance and NHS SIDS advice.',
  ),
];

const GUIDES: SeedItem[] = [
  kb(
    guide('5_6m', 'gross_motor', {
      title: b('၅ – ၆ လ — ကြွက်သားကြီး လှုပ်ရှားမှု လမ်းညွှန်', '5–6 months — Gross motor guide'),
      why: b(
        'ဤအရွယ်တွင် ကလေးအများစုသည် လှိမ့်နိုင်လာပြီး ထောက်ပံ့ပေးလျှင် ခဏ ထိုင်နိုင်တတ်သည်။ ကြွက်သားများ တစ်ပြေးညီ ဖွံ့ဖြိုးလာသဖြင့် လက်နှစ်ဖက်ဖြင့် ထောက်၍ ရင်ဘတ်ကို မြင့်မြင့် မြှင့်နိုင်သည်။ ကလေးတိုင်း အချိန်တူ မဟုတ်ပါ — အချို့က ၄ လတွင် လှိမ့်ပြီး အချို့က ၆ လကျော်မှ လှိမ့်သည်။ ဤသည် ပုံမှန် ကွဲပြားမှု ဖြစ်သည်။',
        'Most babies now roll and can sit briefly with support. Stronger muscles let them push up on straight arms during tummy time. Timing varies widely — some roll at 4 months, others after 6. That is normal variation.',
      ),
      observationQuestions: [
        b('ပက်လက်မှ မှောက် သို့မဟုတ် မှောက်မှ ပက်လက် လှိမ့်နိုင်ပါသလား။', 'Does she roll back to front, or front to back?'),
        b('ခါးကို ထောက်ပေးလျှင် ခဏ ထိုင်နိုင်ပါသလား။', 'Can she sit for a moment when you support her hips?'),
        b('မှောက်ချထားစဉ် လက်နှစ်ဖက် ဖြောင့်ဖြောင့်ဖြင့် ထောက်နိုင်ပါသလား။', 'During tummy time, can she push up on straight arms?'),
        b('ခေါင်းကို ဘက်နှစ်ဖက်စလုံးသို့ တူညီစွာ လှည့်နိုင်ပါသလား။', 'Does she turn her head equally to both sides?'),
      ],
      dailyActivities: [
        b('နေ့စဉ် မှောက်ချချိန်ကို အကြိမ်ခွဲ၍ စုစုပေါင်း မိနစ် ၃၀ ခန့်အထိ တိုးပေးပါ။', 'Build tummy time up to about 30 minutes a day in short sessions.'),
        b('ကစားစရာကို ဘေးတစ်ဖက်တွင် ထားပေး၍ လှိမ့်ရန် ဆွဲဆောင်ပါ။', 'Place a toy just to one side to invite a roll.'),
        b('ခါးကို လက်ဖြင့် ထောက်၍ ထိုင်ခိုင်းပြီး ရှေ့တွင် ကစားစရာ ကိုင်ပြပါ။', 'Support her hips in sitting and hold a toy in front.'),
        b('ကလေးကို ကြမ်းပြင်ပေါ် အခင်းခင်း၍ လွတ်လပ်စွာ လှုပ်ရှားခွင့် ပေးပါ။', 'Give free floor time on a mat so she can move as she likes.'),
      ],
      weeklyActivities: [
        b('တစ်ပတ်လျှင် အနေအထား အသစ် တစ်မျိုး (ဘေးစောင်း အိပ်ကစားခြင်း) ထပ်ထည့်ပါ။', 'Add one new position each week, such as playing on her side.'),
        b('မိသားစုဝင် တစ်ဦးစီက ကြမ်းပြင်ပေါ်တွင် အတူကစားပေးပါ။', 'Let a different family member join floor play each week.'),
      ],
      indoor: [
        b('အခင်းပေါ်တွင် လှိမ့်ကစားခြင်း — ဘေးပတ်လည် လွတ်လပ်စွာ ထားပါ။', 'Rolling play on a mat with clear space all around.'),
        b('မှန်ရှေ့တွင် မှောက်ချ၍ ကိုယ့်ကိုယ်ကို ကြည့်စေခြင်း။', 'Tummy time in front of a mirror.'),
      ],
      outdoor: [
        b('အရိပ်ရှိသော နေရာတွင် အခင်းခင်း၍ ကစားခြင်း — နေပူ တိုက်ရိုက် ရှောင်ပါ။', 'Play on a mat in the shade — avoid direct midday sun.'),
        b('မိဘရင်ခွင်တွင် ပွေ့ချီ၍ လမ်းလျှောက်ရင်း ပတ်ဝန်းကျင်ကို ပြပါ။', 'Carry her while walking and show her the world around.'),
      ],
      lowCost: [
        b('အိမ်သုံး အဝတ်ထူထူ တစ်ထည်ကို အခင်းအဖြစ် သုံးပါ။', 'A folded blanket makes a fine play mat.'),
        b('သန့်ရှင်းသော ပလတ်စတစ်ဗူးထဲ ပဲစေ့ ထည့်၍ အသံမြည် ကစားစရာ လုပ်ပါ (ခိုင်ခံ့စွာ ပိတ်ပါ)။', 'A clean sealed bottle with a few beans makes a rattle — seal it firmly.'),
      ],
      materials: b('အခင်း၊ အသံမြည် ကစားစရာ၊ မှန်', 'A mat, a rattle, a mirror'),
      safety: b(
        'ကလေး လှိမ့်နိုင်လာသည်နှင့် အိပ်ရာ၊ စားပွဲ၊ ဆိုဖာပေါ်တွင် တစ်စက္ကန့်မျှ တစ်ယောက်တည်း မထားပါနှင့် — လိမ့်ကျနိုင်သည်။ ကြမ်းပြင်ပေါ်တွင် ကစားစေခြင်းက အလုံခြုံဆုံး ဖြစ်သည်။ အိပ်ချိန်တိုင်း ပက်လက် အိပ်စေပါ — ကလေး ကိုယ်တိုင် လှိမ့်သွားပါက ပြန်လှည့်ပေးရန် မလိုပါ။ အိပ်ရာပေါ်တွင် ခေါင်းအုံး၊ အနူးအညံ့ ကစားစရာ၊ စောင်ပုံ မထားပါနှင့်။ ကလေးပါးစပ်ထဲ ဝင်နိုင်သော ပစ္စည်း အားလုံးကို ဖယ်ရှားပါ။ ကလေးကို ဘယ်တော့မျှ မလှုပ်ခါပါနှင့်။',
        'Now that she rolls, never leave her alone on a bed, table or sofa even for a second — the floor is safest. Place her on her back for every sleep; if she rolls herself in sleep there is no need to turn her back. Keep the sleep surface clear of pillows, soft toys and loose bedding. Remove anything small enough to fit in her mouth. Never shake a baby.',
      ),
      commonMistakes: [
        b('အခြားကလေးနှင့် နှိုင်းယှဉ်၍ စိတ်ပူခြင်း — အချိန်ကွာခြားမှုသည် ပုံမှန် ဖြစ်သည်။', 'Comparing with another baby — differences in timing are normal.'),
        b('ကလေးလမ်းလျှောက်စက် သုံးခြင်း — မလိုအပ်သည့်အပြင် ထိခိုက်ဒဏ်ရာရစေနိုင်သည်။', 'Using a baby walker — it is unnecessary and can cause injury.'),
        b('တစ်နေကုန် ချီထားခြင်း — ကြမ်းပြင်ပေါ် လွတ်လပ်စွာ လှုပ်ရှားခွင့် လိုအပ်သည်။', 'Holding her all day — she needs free floor time to move.'),
      ],
      parentTips: [
        b('မှောက်ချချိန်ကို မိနစ်အနည်းငယ်စီ အကြိမ်များများ ခွဲလုပ်ပါ — ငိုလျှင် ရပ်ပါ။', 'Do tummy time in many short bursts, and stop if she cries.'),
        b('ကလေး၏ မျက်နှာအဆင့်တွင် သင်လည်း မှောက်ချ၍ အတူကစားပါ။', 'Lie down at her level and play face to face.'),
      ],
      faq: [
        {
          q: b('၆ လပြည့်ပြီ၊ မလှိမ့်သေးဘူး။ စိုးရိမ်စရာလား။', 'She is 6 months and not rolling yet. Should I worry?'),
          a: b('ကလေးအချို့သည် ၆ လကျော်မှ လှိမ့်တတ်သည် — အထူးသဖြင့် မှောက်ချချိန် နည်းခဲ့လျှင် ဖြစ်သည်။ ခြေလက် လှုပ်ရှားမှု ကောင်းပြီး ခေါင်းထောင်နိုင်လျှင် မှောက်ချချိန် တိုးပေးပါ။ လုံးဝ မလှုပ်ရှားခြင်း၊ ကြွက်သား တင်းလွန်း/ပျော့လွန်းခြင်း ရှိပါက ကျန်းမာရေးဝန်ထမ်းအား ပြပါ။', 'Some babies roll after 6 months, especially with less tummy time. If she moves her arms and legs well and holds her head up, increase tummy time. If she is very stiff or very floppy, or barely moves, see a health worker.'),
        },
        {
          q: b('ထိုင်ဖို့ လေ့ကျင့်ပေးသင့်လား။', 'Should I train her to sit?'),
          a: b('အတင်း လေ့ကျင့်ပေးရန် မလိုပါ။ ခါးကို ထောက်၍ ခဏ ထိုင်ခိုင်းခြင်း၊ ကြမ်းပြင်ပေါ် လွတ်လပ်စွာ ကစားခွင့် ပေးခြင်းက ကြွက်သားကို သဘာဝအတိုင်း အားကောင်းစေသည်။ ခေါင်းအုံးဖြင့် ကာ၍ တစ်ယောက်တည်း ထိုင်ခိုင်းခြင်းကို ရှောင်ပါ။', 'No training is needed. Brief supported sitting and free floor play build the muscles naturally. Avoid propping her alone with pillows.'),
        },
      ],
      redFlags: [
        b('လ ၆ လအရွယ်တွင် ခေါင်းကို မတ်မတ် လုံးဝ မထိန်းနိုင်ခြင်း။', 'At 6 months, no steady head control at all.'),
        b('ကိုယ်ခန္ဓာ အလွန် တင်းကျပ်ခြင်း သို့မဟုတ် အလွန် ပျော့ခွေခြင်း။', 'A body that is very stiff or very floppy.'),
        b('တစ်ဖက်ခြမ်းကိုသာ အမြဲ သုံးပြီး ကျန်တစ်ဖက် မလှုပ်ခြင်း။', 'Using only one side of the body and not moving the other.'),
        b('ယခင်က လုပ်နိုင်ခဲ့သော လှုပ်ရှားမှုများ ဆုံးရှုံးသွားခြင်း။', 'Loss of movements she could do before.'),
      ],
      referral: b(
        'ဤလက္ခဏာများ တွေ့ပါက ကျန်းမာရေးဝန်ထမ်း သို့မဟုတ် ကလေးအထူးကုဆရာဝန်ထံ ပြသပါ။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ဘဲ စစ်ဆေးရန် အချက်ပြခြင်းသာ ဖြစ်သည်။',
        'If you see these, ask a health worker or paediatrician to check. This is a prompt to check, not a diagnosis.',
      ),
      encouragement: b(
        'လှိမ့်နိုင်ခြင်းသည် ကလေး ကမ္ဘာကြီးကို ကိုယ်တိုင် ရွေးချယ်ရှာဖွေနိုင်သော ပထမဆုံး နည်းလမ်း ဖြစ်ပါသည်။',
        'Rolling is the first way your baby chooses where to go in the world.',
      ),
    }),
    'Rolling and supported sitting between 4 and 6 months follow CDC milestone checklists, AAP milestone guidance and the WHO motor development study windows; tummy time and the roll-off and safe sleep precautions follow AAP safe sleep guidance and the paediatric physical-therapy references in the registry.',
  ),
  kb(
    guide('5_6m', 'fine_motor', {
      title: b('၅ – ၆ လ — လက်ချောင်းငယ် လှုပ်ရှားမှု လမ်းညွှန်', '5–6 months — Fine motor guide'),
      why: b(
        'ဤအရွယ်တွင် ကလေးသည် ပစ္စည်းကို ရည်ရွယ်ချက်ရှိရှိ လှမ်းယူတတ်လာပြီး လက်တစ်ဖက်မှ တစ်ဖက်သို့ လွှဲပြောင်းနိုင်လာသည်။ လက်ဝါးတစ်ခုလုံးဖြင့် ဆုပ်ကိုင်ခြင်းသည် ဤအရွယ်တွင် ပုံမှန်ဖြစ်သည်။ ကိုင်မိသမျှကို ပါးစပ်ထဲ ထည့်ခြင်းသည် ရောဂါလက္ခဏာ မဟုတ်ဘဲ ပတ်ဝန်းကျင်ကို လေ့လာသင်ယူသည့် နည်းလမ်းတစ်ခု ဖြစ်သည်။',
        'Babies now reach on purpose and pass an object from hand to hand. A whole-hand palmar grasp is normal at this stage. Mouthing everything is not a problem — it is how she explores.',
      ),
      observationQuestions: [
        b('ရှေ့တွင် ကိုင်ပြသော ပစ္စည်းကို လှမ်း၍ ဆုပ်ကိုင်နိုင်ပါသလား။', 'Does she reach out and grasp an object held in front of her?'),
        b('ပစ္စည်းကို လက်တစ်ဖက်မှ တစ်ဖက်သို့ ပြောင်းနိုင်ပါသလား။', 'Can she pass an object from one hand to the other?'),
        b('လက်နှစ်ဖက်စလုံးကို တူညီစွာ သုံးပါသလား။', 'Does she use both hands equally?'),
        b('ကိုင်မိသော ပစ္စည်းကို ပါးစပ်ဆီ ယူသွားပါသလား။', 'Does she bring what she holds to her mouth?'),
      ],
      dailyActivities: [
        b('အရွယ်အစား၊ အထိအတွေ့ ကွဲပြားသော ပစ္စည်းများကို တစ်ခုချင်း ကမ်းပေးပါ။', 'Offer objects of different size and texture, one at a time.'),
        b('ပစ္စည်းကို ညာဘက်၊ ဘယ်ဘက် အလှည့်ကျ ကမ်းပေး၍ လက်နှစ်ဖက်စလုံး သုံးစေပါ။', 'Offer things to the right and left in turn so both hands work.'),
        b('ထိုင်ချိန်တွင် ရှေ့တွင် ကစားစရာ ချထား၍ လှမ်းယူစေပါ။', 'In supported sitting, put a toy in front for her to reach.'),
      ],
      weeklyActivities: [
        b('တစ်ပတ်လျှင် အထိအတွေ့ အသစ် တစ်မျိုး (နူးညံ့/ကြမ်းတမ်း/အေး) မိတ်ဆက်ပါ။', 'Introduce one new texture each week — soft, rough, cool.'),
        b('အိမ်တွင်း ဘေးကင်းသော ပစ္စည်း (သစ်သားဇွန်း၊ ခွက်) ဖြင့် ကစားခြင်း။', 'Play with a safe household object such as a wooden spoon or cup.'),
      ],
      indoor: [
        b('အခင်းပေါ်တွင် ကစားစရာ ၂–၃ ခု ချထား၍ ရွေးချယ်ကစားစေခြင်း။', 'Two or three toys on a mat so she can choose.'),
        b('အဝတ်စဖြင့် ဖုံး၍ ပြန်ရှာစေခြင်း။', 'Covering a toy with a cloth and letting her find it.'),
      ],
      outdoor: [
        b('အရိပ်တွင် သစ်ရွက်ကြီး၊ ပန်းပွင့်ကို ဘေးကင်းစွာ ထိကိုင်ကြည့်စေခြင်း (ပါးစပ်ထဲ မထည့်စေရန် ကြည့်ရှုပါ)။', 'Touching a large leaf or flower in the shade — supervise so it does not go in her mouth.'),
      ],
      lowCost: [
        b('သန့်ရှင်းသော အဝတ်စ အမျိုးမျိုး — အထိအတွေ့ လေ့လာရန် အကောင်းဆုံး။', 'Clean scraps of different cloth are excellent for texture.'),
        b('သစ်သား ဇွန်း၊ ပလတ်စတစ် ခွက် — အနားချွန် မရှိသည်ကို စစ်ပါ။', 'A wooden spoon or plastic cup — check there are no sharp edges.'),
      ],
      materials: b('ပါးစပ်ထက် ကြီးသော ကစားစရာ၊ အဝတ်စ၊ ခွက်၊ ဇွန်း', 'Toys larger than the mouth, cloths, a cup, a spoon'),
      safety: b(
        'ကလေးပါးစပ်ထဲ ဝင်နိုင်သော ပစ္စည်း တစ်ခုမျှ မပေးပါနှင့် — အကြွေစေ့၊ ခလုတ်၊ ဂေါ်လီလုံး၊ ဘက်ထရီနှင့် အခွံမာသီးများသည် လည်ချောင်းပိတ်နိုင်သည်။ ကြိုးရှည်၊ ပလတ်စတစ်အိတ်နှင့် ပူဖောင်း မပေးပါနှင့်။ ကစားစရာများကို ပုံမှန် သန့်ရှင်းပါ။ ကလေး ကစားနေစဉ် အနီးတွင် ရှိနေပါ။ အပူရည်၊ မီးဖိုနှင့် လျှပ်စစ်ကြိုးများကို ကလေးလက်လှမ်းမမီအောင် ထားပါ။',
        'Never give anything small enough to fit in the mouth — coins, buttons, nuts, batteries and loose seeds can choke. No long cords, plastic bags or balloons. Wash toys often. Stay close while she plays. Keep hot drinks, stoves and appliance cords out of reach.',
      ),
      commonMistakes: [
        b('ပါးစပ်ထဲ ထည့်ခြင်းကို လုံးဝ တားဆီးခြင်း — သန့်ရှင်းအောင် လုပ်ပေးရုံသာ လိုသည်။', 'Blocking mouthing altogether — keep the object clean and safe instead.'),
        b('ကစားစရာ များစွာ တစ်ပြိုင်နက် ချပေးခြင်း — အာရုံပျံ့လွင့်စေသည်။', 'Putting out many toys at once — it scatters her attention.'),
      ],
      parentTips: [
        b('ကလေး လှမ်းယူရန် အနည်းငယ် ကြိုးစားရသည့် အကွာအဝေးတွင် ကိုင်ပေးပါ။', 'Hold the toy just far enough that she has to try a little.'),
        b('ကလေး ကိုင်မိသောအခါ အမည်ကို ပြောပြပါ — ဘာသာစကားလည်း တစ်ပါတည်း တိုးပွားသည်။', 'Name the object when she catches it — language grows at the same time.'),
      ],
      faq: [
        {
          q: b('ကလေးက ဘာမဆို ပါးစပ်ထဲ ထည့်တယ်။ ရပ်ခိုင်းသင့်လား။', 'She puts everything in her mouth. Should I stop her?'),
          a: b('မရပ်ခိုင်းပါနှင့် — ဤသည် ဤအရွယ် သင်ယူပုံ ဖြစ်သည်။ ပစ္စည်းကို သန့်ရှင်းစွာ ထားပြီး ပါးစပ်ထဲ ဝင်နိုင်လောက်အောင် သေးသည့်အရာများကို ဖယ်ထားပါ။', 'Do not stop her — this is how she learns. Keep objects clean and remove anything small enough to swallow.'),
        },
        {
          q: b('လက်ညာဘက်ကိုပဲ သုံးနေတယ်လို့ ထင်တယ်။', 'I think she only uses her right hand.'),
          a: b('ဤအရွယ်တွင် ဘက်တစ်ဖက်ကိုသာ အမြဲသုံးခြင်းသည် ပုံမှန် မဟုတ်ပါ — လက်ဘက် ရွေးချယ်မှုသည် များသောအားဖြင့် ၂ နှစ်ဝန်းကျင်မှ ပေါ်လာသည်။ ကျန်းမာရေးဝန်ထမ်းအား ပြောပြပါ။', 'A consistent hand preference this early is not usual — hand dominance usually appears around 2 years. Mention it to a health worker.'),
        },
      ],
      redFlags: [
        b('လ ၆ လအရွယ်တွင် ပစ္စည်းကို လုံးဝ မလှမ်း၊ မကိုင်နိုင်ခြင်း။', 'At 6 months, no reaching for or holding objects at all.'),
        b('လက်နှစ်ဖက် အမြဲ တင်းကျပ်ဆုပ်ထားပြီး မဖြန့်နိုင်ခြင်း။', 'Hands that stay tightly fisted and never open.'),
        b('တစ်ဖက်လက်ကိုသာ အမြဲ သုံးခြင်း။', 'Consistent use of one hand only.'),
      ],
      referral: b(
        'ဤလက္ခဏာများကို ကျန်းမာရေးဝန်ထမ်းအား ပြသပါ။ စောစီးစွာ စစ်ဆေးခြင်းက အထောက်အကူ ဖြစ်သည်။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ပါ။',
        'Raise these with a health worker; early checking helps. This is not a diagnosis.',
      ),
      encouragement: b(
        'ယနေ့ ကလေး ဆုပ်ကိုင်လိုက်သော ကစားစရာသည် နောင်တစ်နေ့ စာအုပ် လှန်မည့် လက်ကို လေ့ကျင့်ပေးနေခြင်း ဖြစ်သည်။',
        'The toy she grabs today is training the hand that will one day turn a page.',
      ),
    }),
    'Purposeful reaching, palmar grasp and hand-to-hand transfer at 5–6 months follow CDC milestone checklists and AAP milestone guidance; mouthing as exploration and the choking precautions follow AAP play guidance and the paediatric occupational-therapy references in the registry.',
  ),
];

const GUIDES_B: SeedItem[] = [
  kb(
    guide('5_6m', 'speech', {
      title: b('၅ – ၆ လ — စကားသံ ထွက်ဆိုမှု လမ်းညွှန်', '5–6 months — Speech guide'),
      why: b(
        'ဤအရွယ်တွင် ကလေးသည် သရသံများမှ တစ်ဆင့် "ဘဘ"၊ "ဒဒ"၊ "မမ" ကဲ့သို့ ဗျည်းသံပါသော အသံတွဲများ စတင်ထွက်လာသည်။ ယင်းတို့သည် အဓိပ္ပာယ်ရှိသော စကားလုံးများ မဟုတ်သေးဘဲ စကားပြောရန် ပါးစပ်နှင့် လျှာကို လေ့ကျင့်နေခြင်း ဖြစ်သည်။ မိဘက အပြန်အလှန် တုံ့ပြန်ပေးလေလေ ကလေးကလည်း အသံပိုထွက်လေလေ ဖြစ်သည်။',
        'Vowel cooing now grows into consonant babble — "ba-ba", "da-da", "ma-ma". Babbling is not words yet; it is the mouth and tongue practising for speech. The more you answer, the more she babbles.',
      ),
      observationQuestions: [
        b('ဗျည်းသံပါသော အသံများ ("ဘ"၊ "ဒ"၊ "မ") ကြားရပါသလား။', 'Do you hear consonant sounds such as "b", "d" or "m"?'),
        b('သင် ပြောပြီးနောက် အလှည့်ကျ ပြန်အသံထွက်ပါသလား။', 'Does she take a turn and answer back after you speak?'),
        b('ပျော်ရွှင်စဉ်နှင့် စိတ်မကောင်းစဉ် အသံ ကွဲပြားပါသလား။', 'Do her sounds differ when she is happy and when she is upset?'),
        b('အသံကြားလျှင် ခေါင်းလှည့်၍ ရင်းမြစ်ကို ရှာပါသလား။', 'Does she turn to look for where a sound came from?'),
      ],
      dailyActivities: [
        b('ကလေးထွက်သော အသံကို အတိအကျ အတုယူ၍ ပြန်ဆိုပါ၊ ပြီးမှ ခေတ္တ စောင့်ပါ။', 'Copy her sound back exactly, then pause and wait for her turn.'),
        b('နေ့စဉ် လုပ်ငန်းများကို အသံထွက် ပြောပြပါ ("ရေချိုးမယ်"၊ "အင်္ကျီ ဝတ်မယ်")။', 'Narrate daily routines — "now we wash", "now the shirt goes on".'),
        b('ပုံစာအုပ်ကို နေ့တိုင်း ခဏ ဖတ်ပြပါ — အမည်များကို ရိုးရှင်းစွာ ခေါ်ပါ။', 'Share a picture book briefly every day and name what you see.'),
        b('မြန်မာ ကလေးသီချင်း တစ်ပုဒ်ကို ထပ်ခါထပ်ခါ ဆိုပြပါ။', 'Sing the same Myanmar rhyme again and again.'),
      ],
      weeklyActivities: [
        b('မိသားစုဝင် အသီးသီးက စကားပြောပေးပါ — အသံ အမျိုးမျိုး ကြားစေပါ။', 'Let different family members talk with her so she hears different voices.'),
        b('တစ်ပတ်လျှင် သီချင်း သို့မဟုတ် ကဗျာ အသစ် တစ်ပုဒ် ထပ်ထည့်ပါ။', 'Add one new song or rhyme each week.'),
      ],
      indoor: [
        b('မှန်ရှေ့တွင် အတူထိုင်၍ အသံထွက် ကစားခြင်း။', 'Sound play together in front of a mirror.'),
        b('ကလေး၏ အသံကို "စကားပြောသလို" အလှည့်ကျ ဖလှယ်ခြင်း။', 'Taking turns with her sounds as if having a conversation.'),
      ],
      outdoor: [
        b('အပြင်တွင် ကြားရသော ငှက်သံ၊ မိုးသံနှင့် ကားသံတို့အကြောင်း ကလေးကို ပြောပြပေးခြင်း။', 'Naming outdoor sounds — birds, rain, a car.'),
      ],
      lowCost: [
        b('သင့်အသံသည် အကောင်းဆုံး ကိရိယာ ဖြစ်သည် — ကုန်ကျစရိတ် လုံးဝ မရှိပါ။', 'Your voice is the best tool and costs nothing.'),
        b('အိမ်လုပ် အသံမြည် ဗူးဖြင့် အသံရင်းမြစ်ကို ရှာစေခြင်း။', 'A home-made rattle to help her find where sound comes from.'),
      ],
      materials: b('မလိုအပ်ပါ — သင်၏ အသံနှင့် မျက်နှာ လုံလောက်သည်', 'Nothing needed — your voice and face are enough'),
      safety: b(
        'အသံ အလွန်ကျယ်သော နေရာများကို ရှောင်ပါ။ နားအတွင်းသို့ ဘာမျှ မထည့်ပါနှင့် — ဆီ၊ ရေ၊ ဝါဂွမ်းတံ အပါအဝင် ဖြစ်သည်။ ကလေးအနီးတွင် ဆေးလိပ် လုံးဝ မသောက်ပါနှင့်။ အသံမြည် ကစားစရာများ၏ ဘက်ထရီအိမ်ကို ခိုင်ခံ့စွာ ပိတ်ထားပါ — ခလုတ်ဘက်ထရီ မျိုချမိပါက အလွန် အန္တရာယ်ကြီးသည်။',
        'Avoid very loud places. Never put anything inside the ear — no oil, water or cotton buds. Keep her away from all tobacco smoke. Check that battery compartments on noisy toys are firmly closed; a swallowed button battery is a serious emergency.',
      ),
      commonMistakes: [
        b('ကလေး စကား မပြောနိုင်သေးဟုဆိုကာ စကားပြောပေးမှု လျှော့ချခြင်း။', 'Talking to her less because she cannot answer in words yet.'),
        b('ဖုန်း၊ တီဗွီ အသံဖြင့် အစားထိုးခြင်း — မျက်နှာချင်းဆိုင် စကားပြောခြင်းကို အစားမထိုးနိုင်ပါ။', 'Replacing talk with a phone or TV — screens do not replace face-to-face conversation.'),
        b('ကလေး ပြောသည်ကို ပြင်ပေးရန် ကြိုးစားခြင်း — ဤအရွယ်တွင် အတုယူ ပြန်ဆိုပေးရုံ လုံလောက်သည်။', 'Trying to correct her sounds — at this age simply echoing them back is enough.'),
      ],
      parentTips: [
        b('ကလေး အသံထွက်ပြီးနောက် ၅ စက္ကန့်ခန့် စောင့်ပါ — အလှည့်ယူရန် အချိန်ပေးပါ။', 'Wait about five seconds after her sound so she can take her turn.'),
        b('သင် အကျွမ်းဝင်ဆုံး ဘာသာစကားဖြင့် ပြောပါ — ဤသည် အကောင်းဆုံး ဖြစ်သည်။', 'Speak the language you know best — that is the best choice.'),
      ],
      faq: [
        {
          q: b('"ဒဒ" လို့ ခေါ်တာ အဖေကို ခေါ်တာလား။', 'When she says "da-da", does she mean her father?'),
          a: b('ဤအရွယ်တွင် များသောအားဖြင့် အဓိပ္ပာယ် မရှိသေးဘဲ အသံ လေ့ကျင့်နေခြင်းသာ ဖြစ်သည်။ သို့သော် သင်က "ဟုတ်တယ်၊ အဖေပါ" ဟု ပြန်ပြောပေးလျှင် အဓိပ္ပာယ်ကို တဖြည်းဖြည်း သင်ယူသွားပါမည်။', 'Usually it is sound practice rather than meaning at this age. But when you answer "yes, that is Daddy", she gradually learns the meaning.'),
        },
        {
          q: b('ကလေးက အသံ အရမ်းနည်းတယ်။ ဘာလုပ်ရမလဲ။', 'She makes very few sounds. What should I do?'),
          a: b('နေ့စဉ် မျက်နှာချင်းဆိုင် စကားပြောချိန်ကို တိုးပေးပါ၊ ဖုန်း/တီဗွီ ဖွင့်ချိန်ကို လျှော့ပါ။ အသံကြားလျှင် လုံးဝ မတုံ့ပြန်ခြင်း၊ သို့မဟုတ် လ ၆ လအရွယ်တွင် အသံ လုံးဝ မထွက်ခြင်း ရှိပါက နားကြားခြင်း စစ်ဆေးရန် ကျန်းမာရေးဝန်ထမ်းအား ပြပါ။', 'Increase face-to-face talking time and reduce background TV or phone. If she does not react to sound at all, or makes no sounds by 6 months, ask a health worker about a hearing check.'),
        },
      ],
      redFlags: [
        b('အသံကျယ်ကို လုံးဝ မတုံ့ပြန်ခြင်း။', 'No reaction at all to loud sounds.'),
        b('လ ၆ လအရွယ်တွင် ဗျည်းသံ လုံးဝ မထွက်ခြင်း။', 'No consonant sounds at all by 6 months.'),
        b('ယခင်က ထွက်နေသော အသံများ ရပ်ဆိုင်းသွားခြင်း။', 'Loss of sounds she used to make.'),
      ],
      referral: b(
        'နားကြားခြင်း သံသယရှိပါက စောစီးစွာ စစ်ဆေးခြင်းက အလွန် အရေးကြီးသည်။ ကျန်းမာရေးဝန်ထမ်းထံ ပြသပါ။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ပါ။',
        'If hearing is in any doubt, early checking matters a great deal. Ask a health worker. This is not a diagnosis.',
      ),
      encouragement: b(
        'ကလေး၏ "ဘဘ" သံသည် သင့်ကို ခေါ်နေခြင်း ဖြစ်သည် — ပြန်ဖြေပေးလိုက်ပါ။',
        'Her "ba-ba" is a call to you — answer it.',
      ),
    }),
    'Consonant babbling and vocal turn-taking at 5–6 months follow CDC and AAP milestone guidance, NHS learn-to-talk advice and the speech-language pathology references in the registry.',
  ),
  kb(
    guide('5_6m', 'language', {
      title: b('၅ – ၆ လ — ဘာသာစကား နားလည်မှု လမ်းညွှန်', '5–6 months — Language guide'),
      why: b(
        'ကလေးသည် စကားမပြောနိုင်သေးသော်လည်း နားလည်မှု စတင်တည်ဆောက်နေပြီ ဖြစ်သည်။ မိမိအမည်ကို ခေါ်လျှင် လှည့်ကြည့်တတ်လာသည်။ အသိအသံနှင့် အသစ်အသံကို ခွဲခြားတတ်သည်။ မိဘ ပြောသော စကားလုံး အရေအတွက်နှင့် အပြန်အလှန် ပြောဆိုမှုသည် နောင်နှစ်များ၏ ဘာသာစကား စွမ်းရည်နှင့် ဆက်စပ်နေသည်။',
        'She cannot speak yet, but understanding is already being built. She turns when her name is called and tells a familiar voice from a new one. How much you talk with her — especially back-and-forth turns — is linked to her later language.',
      ),
      observationQuestions: [
        b('အမည်ကို ခေါ်လျှင် လှည့်ကြည့်ပါသလား။', 'Does she turn when you call her name?'),
        b('အသိအသံကို ကြားလျှင် ငြိမ်သက်သွား သို့မဟုတ် ရှာကြည့်ပါသလား။', 'Does she quiet or search when she hears a familiar voice?'),
        b('"မလုပ်နဲ့" ကဲ့သို့ အသံအနေအထားကို ခွဲခြားနိုင်ပါသလား။', 'Does she react differently to a warm tone and a firm tone?'),
        b('စကားပြောနေစဉ် သင့်ပါးစပ်ကို စိုက်ကြည့်ပါသလား။', 'Does she watch your mouth while you talk?'),
      ],
      dailyActivities: [
        b('တစ်နေ့လုံး လုပ်နေသည်များကို ပြောပြပါ — အသုံးအများဆုံး နည်းလမ်း ဖြစ်သည်။', 'Talk through what you are doing all day — this is the single most useful habit.'),
        b('ကလေးအမည်ကို မကြာခဏ ခေါ်ပြီး တုံ့ပြန်လျှင် ပြုံးပြပါ။', 'Use her name often and smile when she responds.'),
        b('ပစ္စည်းများကို ကိုင်ပြပြီး အမည်ကို ပြောပေးပါ — “ခွက်”၊ “ဇွန်း”။', 'Hold up objects and name them — "cup", "spoon".'),
        b('ပုံစာအုပ်ကို နေ့စဉ် ခဏ ဖတ်ပြပါ။', 'Share a picture book for a short time each day.'),
      ],
      weeklyActivities: [
        b('ကလေးကို အိမ်ထဲ လှည့်လည်ပြသပြီး မြင်တွေ့သည့် အရာများ၏ အမည်ကို ပြောပေးပါ။', 'Carry her around the house naming what you see in each room.'),
        b('တစ်ပတ်လျှင် စာအုပ် သို့မဟုတ် ပုံကတ် အသစ် တစ်ခု ထပ်ထည့်ပါ။', 'Add one new book or picture card each week.'),
      ],
      indoor: [
        b('ပုံစာအုပ်ကို လက်ညှိုးထိုး၍ အမည်ခေါ်ခြင်း။', 'Pointing at pictures and naming them.'),
        b('မိသားစုဝင်များ၏ ဓာတ်ပုံကို ပြ၍ အမည်ခေါ်ခြင်း။', 'Showing family photos and saying who they are.'),
      ],
      outdoor: [
        b('အပြင်ထွက်စဉ် မြင်တွေ့သည့် အရာများအကြောင်း ကလေးကို ပြောပြပေးခြင်း။', 'Naming what you both see when you go outside.'),
      ],
      lowCost: [
        b('မဂ္ဂဇင်း၊ သတင်းစာမှ ပုံများကို ဖြတ်၍ ပုံကတ် လုပ်ပါ။', 'Cut pictures from a magazine or newspaper to make picture cards.'),
        b('အိမ်တွင်း ပစ္စည်းများသည် စကားလုံး သင်ကြားရန် အကောင်းဆုံး ကိရိယာ ဖြစ်သည်။', 'Everyday household objects are the best vocabulary tools.'),
      ],
      materials: b('ပုံစာအုပ်၊ ဓာတ်ပုံ၊ အိမ်တွင်း ပစ္စည်းများ', 'Picture books, photos, household objects'),
      safety: b(
        'စာမျက်နှာထူပြီး ခိုင်ခံ့သော ပုံစာအုပ်ကို သုံးပါ။ စက္ကူပါးများကို ဆုတ်ဖြဲ၍ မျိုချမိနိုင်သည်။ ပုံကတ်များ၏ အနားများ မချွန်ကြောင်း စစ်ဆေးပါ။ မိသားစုနှင့် ရုပ်သံခေါ်ဆိုခြင်းမှလွဲ၍ ဤအရွယ်ကလေးကို တီဗွီနှင့် ဖုန်းမျက်နှာပြင်ရှေ့တွင် မထားရန် အကြံပြုထားသည်။',
        'Use thick board books — thin paper can be torn and swallowed. Check card edges are not sharp. Screens are not recommended at this age apart from video calls with family.',
      ),
      commonMistakes: [
        b('ကလေးက မတုံ့ပြန်သေးဟုဆိုကာ စကားပြောခြင်း လျှော့ချခြင်း။', 'Talking less because she does not answer yet.'),
        b('နောက်ခံ တီဗွီ/ရေဒီယို အမြဲ ဖွင့်ထားခြင်း — မိဘအသံကို ကြားရန် ခက်ခဲစေသည်။', 'Leaving a TV or radio on all the time — it makes your voice harder to hear.'),
        b('ကလေးစကား ("ဘေဘီ" အသံ) ကို လုံးဝ ရှောင်ခြင်း — အသံနိမ့်မြင့် သဘာဝ ပြောဆိုခြင်းသည် အာရုံစိုက်မှုကို ဆွဲဆောင်ပါသည်။', 'Avoiding sing-song baby talk altogether — the natural rise and fall of parentese actually helps her attend.'),
      ],
      parentTips: [
        b('စကားလုံး အရေအတွက်ထက် အပြန်အလှန် ပြောဆိုမှု အလှည့်အရေအတွက်က ပိုအရေးကြီးသည်။', 'The number of back-and-forth turns matters more than the number of words.'),
        b('ဘာသာစကား နှစ်မျိုး သုံးလျှင် တစ်ဦးစီက မိမိအကျွမ်းဝင်ဆုံး ဘာသာစကားဖြင့် ပြောပေးပါ။', 'If you use two languages, let each person speak the one they know best.'),
      ],
      faq: [
        {
          q: b('ဘာသာစကား နှစ်မျိုး ပြောရင် ကလေး နောက်ကျမလား။', 'Will two languages delay her?'),
          a: b('မနောက်ကျပါ။ ကလေးများသည် ဘာသာစကား တစ်မျိုးထက် ပို၍ သင်ယူနိုင်စွမ်း ရှိသည်။ စကားလုံးများသည် ဘာသာစကား နှစ်မျိုးကြား ခွဲဝေနေသဖြင့် အစပိုင်းတွင် တစ်မျိုးစီ၌ နည်းသလို ထင်ရနိုင်သော်လည်း စုစုပေါင်းအားဖြင့် ပုံမှန် ဖြစ်သည်။', 'No. Babies can learn more than one language. Words may look fewer in each language at first because they are shared across two, but the total is typically normal.'),
        },
        {
          q: b('အမည်ခေါ်ရင် တစ်ခါတလေပဲ လှည့်ကြည့်တယ်။', 'She only sometimes turns when I call her name.'),
          a: b('အာရုံစိုက်မှု အခြေအနေပေါ် မူတည်၍ တစ်ခါတလေ မလှည့်ခြင်းသည် ပုံမှန် ဖြစ်သည်။ ငြိမ်သက်သော အခန်းတွင် စမ်းကြည့်ပါ။ ဘယ်တော့မှ လုံးဝ မတုံ့ပြန်ပါက နားကြားခြင်း စစ်ဆေးရန် ပြပါ။', 'Turning only sometimes is normal — it depends on what she is busy with. Try in a quiet room. If she never responds at all, ask for a hearing check.'),
        },
      ],
      redFlags: [
        b('အသံ သို့မဟုတ် အမည်ခေါ်သံကို လုံးဝ မတုံ့ပြန်ခြင်း။', 'No response at all to sound or to her name.'),
        b('မျက်လုံးချင်း လုံးဝ မဆုံခြင်း၊ မျက်နှာကို လုံးဝ မကြည့်ခြင်း။', 'No eye contact and no interest in faces at all.'),
        b('ယခင်က ရှိခဲ့သော တုံ့ပြန်မှုများ ဆုံးရှုံးသွားခြင်း။', 'Loss of responses she used to have.'),
      ],
      referral: b(
        'ဤလက္ခဏာများကို ကျန်းမာရေးဝန်ထမ်းအား ပြသပါ။ နားကြားခြင်း စစ်ဆေးမှုကို စောစီးစွာ ပြုလုပ်ခြင်းက အထောက်အကူ ဖြစ်သည်။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ပါ။',
        'Raise these with a health worker; an early hearing check helps. This is not a diagnosis.',
      ),
      encouragement: b(
        'သင် ပြောလိုက်သော စကားလုံးတိုင်းသည် ကလေး၏ ဘာသာစကား အုတ်မြစ်ကို တစ်ချပ်ချင်း ချပေးနေခြင်း ဖြစ်သည်။',
        'Every word you say lays one more brick in her language foundation.',
      ),
    }),
    'Responding to name, familiar-voice recognition and the value of back-and-forth talk at 5–6 months follow CDC milestone guidance, AAP developmental-surveillance guidance, NHS learn-to-talk advice, the conversational-turns research in the registry and standard language-development references.',
  ),
];

const GUIDES_C: SeedItem[] = [
  kb(
    guide('5_6m', 'communication', {
      title: b('၅ – ၆ လ — ဆက်သွယ်ပြောဆိုမှု လမ်းညွှန်', '5–6 months — Communication guide'),
      why: b(
        'ကလေးသည် စကားလုံး မသုံးဘဲ ဆက်သွယ်တတ်နေပြီ ဖြစ်သည် — မျက်လုံးချင်းဆုံခြင်း၊ ပြုံးခြင်း၊ လက်လှမ်းခြင်း၊ မျက်နှာလွှဲခြင်း တို့ဖြင့် "ဆက်ကစားချင်တယ်" သို့မဟုတ် "အနားယူချင်ပြီ" ဟု ပြောနေခြင်း ဖြစ်သည်။ မိဘက ဤအချက်ပြမှုများကို သတိထားမိပြီး တုံ့ပြန်ပေးခြင်းသည် ကလေး၏ ဆက်သွယ်မှု စွမ်းရည်ကို အခိုင်မာဆုံး တည်ဆောက်ပေးသည်။',
        'She already communicates without words — eye contact, smiling, reaching, and turning away all say "more please" or "I need a break". Noticing these signals and answering them is what builds communication most strongly.',
      ),
      observationQuestions: [
        b('ဆက်ကစားချင်သည့်အခါ မည်သို့ ပြသနည်း (ပြုံးခြင်း၊ လှမ်းခြင်း)။', 'How does she show she wants more — smiling, reaching?'),
        b('အနားယူချင်သည့်အခါ မျက်နှာလွှဲခြင်း၊ ငိုခြင်း ပြုပါသလား။', 'Does she turn away or fuss when she has had enough?'),
        b('သင် တုံ့ပြန်ပေးသောအခါ ငြိမ်သက်သွားပါသလား။', 'Does she settle when you respond?'),
        b('အပြန်အလှန် အသံဖလှယ်မှု ဖြစ်ပါသလား။', 'Do you get a back-and-forth exchange of sounds?'),
      ],
      dailyActivities: [
        b('ကလေး၏ အချက်ပြမှုကို စကားဖြင့် ပြန်ပြောပေးပါ ("ထပ်ကစားချင်တာလား")။', 'Put her signals into words — "you want more, don’t you".'),
        b('နို့တိုက်ချိန်၊ အဝတ်လဲချိန်တွင် မျက်နှာချင်းဆိုင် စကားပြောပါ။', 'Talk face to face during feeds and nappy changes.'),
        b('ကလေး မျက်နှာလွှဲလျှင် ခဏ ရပ်ပေးပါ — အနားယူချင်ခြင်း ဖြစ်သည်။', 'Pause when she looks away — that is her asking for a break.'),
      ],
      weeklyActivities: [
        b('မိသားစုဝင် တစ်ဦးစီနှင့် မျက်နှာချင်းဆိုင် ကစားချိန် ပေးပါ။', 'Give her face-to-face time with a different family member each week.'),
        b('အပြန်အလှန် ကစားနည်း အသစ် တစ်မျိုး (ဖုံးပြီးပြန်ဖွင့်ခြင်း) စမ်းပါ။', 'Try one new turn-taking game such as hide-and-show.'),
      ],
      indoor: [
        b('မှန်ရှေ့တွင် အတူကြည့်၍ ပြုံးပြခြင်း။', 'Smiling together in front of a mirror.'),
        b('အဝတ်စဖြင့် မျက်နှာဖုံး၍ ပြန်ဖွင့်ပြခြင်း။', 'Covering your face with a cloth and showing it again.'),
      ],
      outdoor: [
        b('အပြင်တွင် တွေ့သမျှကို လက်ညှိုးထိုးပြ၍ အတူကြည့်ခြင်း။', 'Pointing at things outside and looking at them together.'),
      ],
      lowCost: [
        b('သင်၏ မျက်နှာသည် အကောင်းဆုံး ဆက်သွယ်ရေး ကိရိယာ ဖြစ်သည်။', 'Your face is the best communication tool there is.'),
        b('အဝတ်စ တစ်ထည်ဖြင့် ကစားနည်း များစွာ လုပ်နိုင်သည်။', 'One cloth is enough for many games.'),
      ],
      materials: b('မလိုအပ်ပါ — သင်၏ မျက်နှာ၊ အသံနှင့် အဝတ်စ တစ်ထည်', 'Nothing needed — your face, your voice and a cloth'),
      safety: b(
        'မျက်နှာကို ဖုံးသော အဝတ်ကို ကလေးမျက်နှာပေါ် ချန်မထားပါနှင့် — အသက်ရှူ ပိတ်နိုင်သည်။ အဝတ်စကို အမြဲ သင့်လက်ဖြင့် ကိုင်ထားပါ။ ကလေးအား ဖန်သားပြင်ရှေ့ မထားပါနှင့် — ဤအရွယ်တွင် အကြံမပြုပါ။ အသံ အလွန်ကျယ်သော ကစားစရာများကို ရှောင်ပါ။',
        'Never leave a cloth lying over her face — it can block breathing; always hold it yourself. Screens are not recommended at this age. Avoid very loud toys.',
      ),
      commonMistakes: [
        b('ကလေး မျက်နှာလွှဲသော်လည်း ဆက်လက် ကစားရန် တိုက်တွန်းခြင်း။', 'Pushing on with play when she has turned away.'),
        b('ငိုသံကို "အလိုလိုက်လွန်းမည်" ဟု ထင်၍ လျစ်လျူရှုခြင်း — ဤအရွယ်တွင် ငိုခြင်းသည် ဆက်သွယ်ခြင်း ဖြစ်သည်။', 'Ignoring crying for fear of spoiling — at this age crying is communication.'),
      ],
      parentTips: [
        b('တုံ့ပြန်ချိန် မြန်လေ ကလေး၏ ယုံကြည်မှု ခိုင်မာလေ ဖြစ်သည်။', 'The quicker you respond, the more secure she feels.'),
        b('ဖုန်းကို ချထား၍ မျက်လုံးချင်း ဆုံစည်းပေးပါ။', 'Put the phone down and give her your eyes.'),
      ],
      faq: [
        {
          q: b('ငိုတိုင်း ချီပေးရင် အလိုလိုက်လွန်းသွားမလား။', 'If I pick her up every time she cries, will I spoil her?'),
          a: b('မဖြစ်ပါ။ ဤအရွယ်တွင် ငိုခြင်းသည် တစ်ခုတည်းသော ဆက်သွယ်နည်း ဖြစ်သည်။ တုံ့ပြန်ပေးခြင်းက ကလေးကို ပိုမို လုံခြုံစိတ်ချစေပြီး နောင်တွင် ငိုမှု လျော့နည်းစေသည်။', 'No. Crying is her only way to communicate now. Responding makes her feel secure and tends to reduce crying later.'),
        },
        {
          q: b('ဗီဒီယိုခေါ်ဆိုမှုက ဖန်သားပြင် အသုံးပြုမှု မဟုတ်ဘူးလား။', 'Isn’t a video call also screen use?'),
          a: b('မိသားစုနှင့် ဗီဒီယိုခေါ်ဆိုခြင်းသည် အပြန်အလှန် ဆက်သွယ်မှု ဖြစ်သဖြင့် သာမန် ဖန်သားပြင်ကြည့်ခြင်းနှင့် မတူပါ။ သို့သော် မျက်နှာချင်းဆိုင် ဆက်ဆံမှုကို အစားထိုးရန် မဟုတ်ပါ။', 'A family video call is interactive and is treated differently from ordinary screen watching, but it does not replace face-to-face time.'),
        },
      ],
      redFlags: [
        b('မျက်လုံးချင်း လုံးဝ မဆုံခြင်း။', 'No eye contact at all.'),
        b('မိဘအား လုံးဝ မပြုံးပြခြင်း၊ တုံ့ပြန်မှု မရှိခြင်း။', 'No smiling at or responding to a parent at all.'),
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
    'Reading and answering a baby’s cues at 5–6 months follows the WHO Care for Child Development approach, CDC milestone guidance, NHS learn-to-talk advice, the conversational-turns research in the registry, and AAP media guidance for the screen advice.',
  ),
  kb(
    guide('5_6m', 'social', {
      title: b('၅ – ၆ လ — လူမှုဆက်ဆံရေး လမ်းညွှန်', '5–6 months — Social guide'),
      why: b(
        'ဤအရွယ်တွင် ကလေးသည် ရင်းနှီးသူနှင့် မရင်းနှီးသူကို ခွဲခြားတတ်လာသည်။ မိဘကို မြင်လျှင် ပိုပျော်ပြီး မရင်းနှီးသူကို မြင်လျှင် ခေါင်းလှည့်ခြင်း သို့မဟုတ် ငိုခြင်း ရှိတတ်သည်။ ယင်းသည် ရှက်တတ်ခြင်းကြောင့် မဟုတ်ဘဲ ပြုစုစောင့်ရှောက်သူနှင့် စိတ်ချလုံခြုံစွာ ချိတ်ဆက်မှု ဖွံ့ဖြိုးလာခြင်း ဖြစ်သည်။',
        'She now tells familiar people from strangers. She may light up for you and turn away or cry with someone new. This is not shyness to be corrected — it is healthy attachment developing.',
      ),
      observationQuestions: [
        b('မိဘကို မြင်လျှင် မျက်နှာ ပြောင်းလဲသွားပါသလား။', 'Does her face change when she sees you?'),
        b('သူစိမ်းနှင့် တွေ့လျှင် မည်သို့ တုံ့ပြန်ပါသနည်း။', 'How does she react to someone new?'),
        b('အပြန်အလှန် ပြုံးပြခြင်း၊ ရယ်မောခြင်း ရှိပါသလား။', 'Do you get shared smiles and laughter?'),
        b('ကစားဖော် ရှိလျှင် ပိုစိတ်ဝင်စားပါသလား။', 'Is she more interested when someone plays with her?'),
      ],
      dailyActivities: [
        b('နေ့စဉ် မျက်နှာချင်းဆိုင် ကစားချိန် အကြိမ်များစွာ ပေးပါ။', 'Give many short face-to-face play times each day.'),
        b('ကလေး၏ ခံစားချက်ကို စကားလုံးဖြင့် ဖော်ပြပေးပါ — “ပျော်နေတယ်နော်”၊ “လန့်သွားလား”။', 'Name her feelings — "you look happy", "that surprised you".'),
        b('သူစိမ်းနှင့် တွေ့စဉ် သင်၏ ရင်ခွင်တွင် ထားပေးပြီး တဖြည်းဖြည်း မိတ်ဆက်ပါ။', 'When meeting someone new, hold her and introduce them slowly.'),
      ],
      weeklyActivities: [
        b('မိသားစုဝင်များနှင့် အလှည့်ကျ ကစားချိန် စီစဉ်ပါ။', 'Arrange play time with different family members in turn.'),
        b('အခြားကလေးများ ရှိသည့် နေရာသို့ ခဏ ခေါ်သွားပါ — ကြည့်ရှုရုံဖြင့်လည်း သင်ယူသည်။', 'Take her somewhere with other children — she learns just by watching.'),
      ],
      indoor: [
        b('မှန်ရှေ့တွင် အတူကြည့်၍ ပြုံးပြခြင်း။', 'Looking and smiling together in a mirror.'),
        b('အလှည့်ကျ အသံဖလှယ်ခြင်း၊ ခေါင်းညိတ်ပြခြင်း။', 'Taking turns with sounds and nods.'),
      ],
      outdoor: [
        b('မိသားစုနှင့် အတူ ခဏ လမ်းလျှောက်ထွက်ခြင်း — လူများကို ဝေးဝေးမှ ကြည့်စေခြင်း။', 'A short family walk so she can watch people from a safe distance.'),
      ],
      lowCost: [
        b('လူများနှင့် ကစားခြင်းသည် ကုန်ကျစရိတ် လုံးဝ မရှိပါ။', 'Playing with people costs nothing at all.'),
        b('မိသားစု ဓာတ်ပုံများကို ပြ၍ အမည်ခေါ်ခြင်း။', 'Naming people in family photos.'),
      ],
      materials: b('မလိုအပ်ပါ — လူများသာ လိုအပ်သည်', 'Nothing needed — just people'),
      safety: b(
        'ကလေးအား သူစိမ်းလက်ထဲ အတင်း မအပ်ပါနှင့် — ကလေး၏ အချက်ပြမှုကို လေးစားပါ။ ဖျားနာနေသူများနှင့် နီးကပ်စွာ မထိတွေ့စေပါနှင့်၊ ကလေးကို မကိုင်မီ လက်ဆေးရန် အားလုံးကို တောင်းဆိုပါ။ ကလေးအနီးတွင် ဆေးလိပ် လုံးဝ မသောက်ပါနှင့်။ ကလေးကို ဘယ်တော့မျှ မလှုပ်ခါပါနှင့် — စိတ်ရှုပ်သောအခါ ဘေးကင်းသောနေရာတွင် ချထားပြီး ခဏ ခွာနေပါ။',
        'Never force her into a stranger’s arms — respect her signals. Keep her away from people who are unwell and ask everyone to wash their hands before holding her. No tobacco smoke near her. Never shake a baby — if you feel overwhelmed, put her somewhere safe and step away for a moment.',
      ),
      commonMistakes: [
        b('သူစိမ်းကို ကြောက်သည်ဟု အရှက်ရသလို ခံစားခြင်း — ဤသည် ပုံမှန် ဖွံ့ဖြိုးမှု ဖြစ်သည်။', 'Feeling embarrassed by stranger wariness — it is normal development.'),
        b('ငိုသံကို လျစ်လျူရှုခြင်း — ယုံကြည်မှု တည်ဆောက်ရေးကို နှောင့်နှေးစေသည်။', 'Ignoring crying — it slows the building of trust.'),
      ],
      parentTips: [
        b('ကလေး ကြောက်လျှင် သင်၏ ငြိမ်သက်သော အသံနှင့် ပွေ့ဖက်မှုသည် အကောင်းဆုံး ဆေး ဖြစ်သည်။', 'When she is afraid, your calm voice and arms are the best medicine.'),
        b('အခြားသူတစ်ဦးအား ချီခွင့်ပေးမည်ဆိုပါက ဖြည်းဖြည်းချင်း လုပ်ပြီး မိဘက အနီးတွင် ရှိနေပါ။', 'When handing her to someone else, do it slowly and stay nearby.'),
      ],
      faq: [
        {
          q: b('သူစိမ်းတွေ့ရင် ငိုတယ်။ ပြဿနာလား။', 'She cries with strangers. Is that a problem?'),
          a: b('မဟုတ်ပါ။ ဤအရွယ်တွင် အသိနှင့် သူစိမ်း ခွဲခြားတတ်လာခြင်းသည် ကျန်းမာသော ဖွံ့ဖြိုးမှု လက္ခဏာ ဖြစ်သည်။ တဖြည်းဖြည်း မိတ်ဆက်ပေးပါ။', 'No. Telling familiar people from strangers is a healthy sign at this age. Introduce people gradually.'),
        },
        {
          q: b('အဖွား/အဒေါ်ကို အပ်ရင် ငိုတယ်။ ဘယ်လိုလုပ်ရမလဲ။', 'She cries when I hand her to her grandmother. What can I do?'),
          a: b('သင် အနီးတွင် ရှိနေစဉ် အဖွားက ခဏ ကစားပေးပါ။ ကလေး အသားကျပြီးမှ ချီစေပါ။ အလျင်စလို မလုပ်ပါနှင့်။', 'Let her grandmother play with her while you are still close, and only pick her up once she is comfortable. Do not rush it.'),
        },
      ],
      redFlags: [
        b('မိဘကို မြင်လျှင် လုံးဝ တုံ့ပြန်မှု မရှိခြင်း။', 'No response at all when she sees a parent.'),
        b('မျက်လုံးချင်း လုံးဝ မဆုံခြင်း၊ မျက်နှာကို လုံးဝ မကြည့်ခြင်း။', 'No eye contact and no interest in faces at all.'),
        b('ယခင်က ရှိခဲ့သော ပြုံးခြင်း၊ ဆက်ဆံမှုများ ဆုံးရှုံးသွားခြင်း။', 'Loss of smiling or social contact she used to have.'),
      ],
      referral: b(
        'ဤလက္ခဏာများကို ကျန်းမာရေးဝန်ထမ်းအား ပြသပါ။ စောစီးစွာ ပံ့ပိုးမှုက အထောက်အကူ ဖြစ်သည်။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ပါ။',
        'Raise these with a health worker; early support helps. This is not a diagnosis.',
      ),
      encouragement: b(
        'ကလေးက သင့်ကို ရွေးချယ်နေခြင်းသည် သင် တည်ဆောက်ခဲ့သော ယုံကြည်မှု၏ ရလဒ် ဖြစ်ပါသည်။',
        'When she chooses you, that is the trust you built showing itself.',
      ),
    }),
    'Recognising familiar people and early stranger wariness at 5–6 months follow CDC and AAP milestone guidance, the WHO/UNICEF nurturing care framework, NICE social and emotional wellbeing guidance, and AAP guidance on the power of play.',
  ),
  kb(
    guide('5_6m', 'emotional', {
      title: b('၅ – ၆ လ — စိတ်ခံစားမှု လမ်းညွှန်', '5–6 months — Emotional guide'),
      why: b(
        'ကလေးသည် ပျော်ရွှင်ခြင်း၊ စိတ်ဆိုးခြင်း၊ အံ့သြခြင်းကို ပိုမို ရှင်းလင်းစွာ ပြသတတ်လာသည်။ မိဘက ငြိမ်သက်စွာ တုံ့ပြန်ပေးခြင်းသည် ကလေး၏ စိတ်ခံစားမှုကို ကိုယ်တိုင် ထိန်းညှိတတ်လာစေရန် အခြေခံ ဖြစ်သည်။ မိဘ၏ စိတ်ကျန်းမာရေးသည် ကလေး၏ ဖွံ့ဖြိုးမှုနှင့် တိုက်ရိုက် ဆက်စပ်နေသဖြင့် မိဘကိုယ်တိုင် ကူညီမှု ရယူခြင်းသည်လည်း ကလေးအတွက် စောင့်ရှောက်မှု ဖြစ်သည်။',
        'She now shows joy, frustration and surprise more clearly. Your calm response is what teaches her to settle her own feelings later. A parent’s own mental health is directly linked to a child’s development, so getting support for yourself is also care for her.',
      ),
      observationQuestions: [
        b('ကလေး၏ ခံစားချက် အမျိုးမျိုးကို ခွဲခြား မြင်နိုင်ပါသလား။', 'Can you tell her different feelings apart?'),
        b('စိတ်ရှုပ်နေစဉ် သင် ပွေ့ချီလျှင် ငြိမ်သွားပါသလား။', 'Does she settle when you hold her?'),
        b('သင်ကိုယ်တိုင် နေ့စဉ် မည်သို့ ခံစားနေရသနည်း။', 'How are you yourself feeling day to day?'),
        b('ကလေးနှင့် အတူ ပျော်ရွှင်ချိန် နေ့စဉ် ရှိပါသလား။', 'Is there some enjoyable time together each day?'),
      ],
      dailyActivities: [
        b('ငိုလျှင် ဖြည်းညှင်းစွာ တုံ့ပြန်ပါ — ချီပေးခြင်း၊ အသံပြောပေးခြင်း။', 'Respond gently to crying — hold her, talk softly.'),
        b('ကလေး၏ ခံစားချက်ကို စကားလုံးဖြင့် ဖော်ပြပေးပါ။', 'Name her feelings out loud.'),
        b('တည်ငြိမ်သော နေ့စဉ် အစီအစဉ် (နို့တိုက်၊ ကစား၊ အိပ်) ကို ထိန်းသိမ်းပါ။', 'Keep a steady daily rhythm of feed, play and sleep.'),
        b('အသားချင်းထိ ပွေ့ဖက်ခြင်းကို နေ့စဉ် ထည့်သွင်းပါ။', 'Include skin-to-skin cuddles every day.'),
      ],
      weeklyActivities: [
        b('မိဘကိုယ်တိုင် အနားယူချိန် တစ်ပတ်လျှင် အနည်းဆုံး တစ်ကြိမ် စီစဉ်ပါ။', 'Plan at least one rest time for yourself each week.'),
        b('ယုံကြည်ရသူ တစ်ဦးနှင့် စိတ်ခံစားချက်ကို ပြောပြပါ။', 'Talk about how you feel with someone you trust.'),
      ],
      indoor: [
        b('ငြိမ်သက်သော သီချင်း ဆိုပေးရင်း ပွေ့ချီခြင်း။', 'Holding her while singing something calm.'),
        b('ကလေးကို ဖြည်းညှင်းစွာ ကိုယ်နှိပ်ပေးခြင်း။', 'A gentle baby massage.'),
      ],
      outdoor: [
        b('အရိပ်တွင် ဖြည်းညှင်းစွာ လမ်းလျှောက်ခြင်း — မိဘအတွက်လည်း ကောင်းသည်။', 'A gentle walk in the shade — good for you as well as her.'),
      ],
      lowCost: [
        b('ပွေ့ဖက်ခြင်းနှင့် အသံသည် ကုန်ကျစရိတ် မရှိသော အကောင်းဆုံး ကုထုံး ဖြစ်သည်။', 'Holding and your voice are the best and cheapest comfort there is.'),
      ],
      materials: b('မလိုအပ်ပါ', 'Nothing needed'),
      safety: b(
        'ကလေးကို ဘယ်တော့မျှ မလှုပ်ခါပါနှင့် — ဦးနှောက် ထိခိုက်နိုင်ပြီး သေဆုံးနိုင်သည်။ သင် စိတ်လက်မငြိမ်သောအခါ ကလေးကို ပက်လက်အနေအထားဖြင့် ဘေးကင်းသော ကုတင်တွင် ချထားပြီး မိနစ်အနည်းငယ် ခွာနေပါ၊ ပြီးမှ ပြန်လာပါ။ ကူညီရန် တစ်စုံတစ်ဦးကို ခေါ်ပါ။ မိဘတွင် စိတ်ဓာတ်ကျခြင်း၊ စိုးရိမ်ပူပန်ခြင်း အလွန်အကျွံ ရှိပါက ကျန်းမာရေးဝန်ထမ်းအား ပြောပြပါ — ကုသမှု ရနိုင်သည်။ ကိုယ့်ကိုယ်ကို သို့မဟုတ် ကလေးကို ထိခိုက်စေလိုသော အတွေးများ ပေါ်ပါက ချက်ချင်း အကူအညီ တောင်းပါ။',
        'Never shake a baby — it can cause brain injury and death. If you feel at the end of your patience, put her on her back in a safe cot, step away for a few minutes, then come back, and call someone to help. If you have persistent low mood or heavy anxiety, tell a health worker — this is treatable. If you ever have thoughts of harming yourself or your baby, seek help immediately.',
      ),
      commonMistakes: [
        b('မိဘ၏ ခံစားချက်ကို လျစ်လျူရှုခြင်း — မိဘ ကောင်းမှ ကလေး ကောင်းသည်။', 'Ignoring your own feelings — she does best when you are supported too.'),
        b('ငိုသံကို "ခံနိုင်ရည် သင်ပေးရမည်" ဟုဆိုကာ လျစ်လျူရှုခြင်း။', 'Leaving her to cry in the belief it "teaches toughness".'),
      ],
      parentTips: [
        b('ကူညီမှု တောင်းခြင်းသည် အားနည်းချက် မဟုတ်ပါ — ကလေးအတွက် စောင့်ရှောက်မှု ဖြစ်သည်။', 'Asking for help is not weakness — it is care for your baby.'),
        b('တစ်နေ့လျှင် မိနစ် အနည်းငယ်မျှ ကိုယ့်အတွက် ချန်ထားပါ။', 'Keep a few minutes a day for yourself.'),
      ],
      faq: [
        {
          q: b('ကလေး ငိုတာကို ခဏ ခံလိုက်ရင် ရမလား။', 'Is it all right to let her cry for a while?'),
          a: b('သင် စိတ်လက်မငြိမ်တော့သည့်အခါ ကလေးကို ဘေးကင်းသောနေရာတွင် ချထားပြီး မိနစ်အနည်းငယ် ခွာနေခြင်းသည် လုံခြုံသော ရွေးချယ်မှု ဖြစ်သည် — ကလေးကို လှုပ်ခါခြင်းထက် အဆမတန် ပိုကောင်းသည်။ သို့သော် တမင် ရှည်လျားစွာ ငိုစေခြင်းကို ဤအရွယ်တွင် အကြံမပြုပါ။', 'If you have reached your limit, putting her down somewhere safe and stepping away for a few minutes is a safe choice — far safer than shaking her. But deliberately leaving her to cry for long periods is not advised at this age.'),
        },
        {
          q: b('မွေးပြီးကတည်းက စိတ်ဓာတ်ကျနေတယ်။ ဘယ်သူ့ကို ပြောရမလဲ။', 'I have felt low since the birth. Who should I tell?'),
          a: b('ကျန်းမာရေးဝန်ထမ်း သို့မဟုတ် ဆရာဝန်အား ပြောပြပါ။ မွေးပြီးနောက် စိတ်ဓာတ်ကျခြင်းသည် အဖြစ်များပြီး ကုသမှု ရနိုင်သည်။ ကူညီမှု ရယူခြင်းက သင့်ကိုရော ကလေးကိုပါ အကျိုးပြုပါသည်။', 'Tell a health worker or doctor. Low mood after birth is common and treatable, and getting help benefits both you and your baby.'),
        },
      ],
      redFlags: [
        b('ကလေး ငိုသံ ရပ်တန့်၍ မရဘဲ ကြာရှည် ငိုနေခြင်း၊ ငြိမ်သက်အောင် မလုပ်နိုင်ခြင်း။', 'Crying that cannot be settled at all and goes on for a long time.'),
        b('ကလေး၏ တုံ့ပြန်မှု လုံးဝ ပျောက်သွားခြင်း၊ အလွန် ငြိမ်ကျသွားခြင်း။', 'A baby who becomes unusually still and stops responding.'),
        b('မိဘတွင် ကိုယ့်ကိုယ်ကို သို့မဟုတ် ကလေးကို ထိခိုက်စေလိုသော အတွေး ပေါ်ခြင်း။', 'A parent having thoughts of harming themselves or the baby.'),
      ],
      referral: b(
        'ကလေး၏ တုံ့ပြန်မှု လုံးဝ ပျောက်ခြင်း၊ နိုးရန် ခက်ခဲခြင်းသည် ချက်ချင်း ဆေးကုသမှု လိုအပ်သည်။ မိဘ၏ စိတ်ကျန်းမာရေး အခက်အခဲကို ကျန်းမာရေးဝန်ထမ်းအား ပြောပြပါ — ကုသမှု ရနိုင်ပါသည်။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ပါ။',
        'A baby who stops responding or is hard to rouse needs urgent medical care. Tell a health worker about parental mental health difficulties — they are treatable. This is not a diagnosis.',
      ),
      encouragement: b(
        'သင် ငြိမ်သက်စွာ တုံ့ပြန်လိုက်တိုင်း ကလေးသည် "ငါ လုံခြုံတယ်" ဟု သင်ယူနေပါသည်။',
        'Every calm response teaches her: I am safe here.',
      ),
    }),
    'The link between responsive caregiving, parental mental health and early emotional development follows AAP guidance on toxic stress, the WHO/UNICEF nurturing care framework, NICE postnatal care guidance, NICE social and emotional wellbeing guidance and standard paediatric references in the registry.',
  ),
];

const GUIDES_D: SeedItem[] = [
  kb(
    guide('5_6m', 'cognitive', {
      title: b('၅ – ၆ လ — အသိဉာဏ် ဖွံ့ဖြိုးမှု လမ်းညွှန်', '5–6 months — Cognitive guide'),
      why: b(
        'ဤအရွယ်တွင် ကလေးသည် "ငါ လုပ်လိုက်ရင် ဘာဖြစ်မလဲ" ဟု စတင် စူးစမ်းနေသည်။ ပစ္စည်းကို ချလိုက်လျှင် အသံမြည်သည်ကို သဘောကျပြီး ထပ်ခါထပ်ခါ လုပ်တတ်သည်။ ကျသွားသော ပစ္စည်းကို လိုက်ရှာခြင်းသည် မျက်စိရှေ့တွင် မမြင်ရသော်လည်း ပစ္စည်းရှိနေဆဲဖြစ်ကြောင်း စတင်နားလည်လာခြင်း ဖြစ်သည်။',
        'She is starting to learn "what happens if I do this?". Dropping something and hearing it land is fascinating, so she does it again and again. Looking for a dropped toy is the beginning of understanding that things still exist when out of sight.',
      ),
      observationQuestions: [
        b('ပစ္စည်း ကျသွားလျှင် လိုက်ကြည့်ပါသလား။', 'Does she look for something after it drops?'),
        b('တူညီသော လုပ်ရပ်ကို ထပ်ခါထပ်ခါ လုပ်ပါသလား။', 'Does she repeat the same action over and over?'),
        b('ပစ္စည်း အသစ်ကို စိတ်ဝင်စားစွာ လေ့လာပါသလား။', 'Does she study a new object with interest?'),
        b('အသံမြည်သော ကစားစရာကို ရည်ရွယ်ချက်ရှိရှိ လှုပ်ပါသလား။', 'Does she shake a rattle on purpose to make a sound?'),
      ],
      dailyActivities: [
        b('ကစားစရာကို အဝတ်စဖြင့် တစ်ဝက် ဖုံး၍ ရှာစေပါ။', 'Half-cover a toy with a cloth and let her find it.'),
        b('အသံမြည် ကစားစရာဖြင့် "လှုပ်လျှင် အသံထွက်" ကို ပြပါ။', 'Show her that shaking makes a sound.'),
        b('ကလေး ချလိုက်သော ပစ္စည်းကို ပြန်ကောက်ပေးပါ — ဤသည် ကစားနည်း ဖြစ်သည်။', 'Pick up what she drops and hand it back — that is the game.'),
      ],
      weeklyActivities: [
        b('တစ်ပတ်လျှင် ပစ္စည်း အသစ် တစ်မျိုး (ဘေးကင်းသော အိမ်သုံးပစ္စည်း) မိတ်ဆက်ပါ။', 'Introduce one new safe household object each week.'),
        b('အခန်း သို့မဟုတ် နေရာ ပြောင်း၍ ကစားပါ — ပတ်ဝန်းကျင် အသစ်က လေ့လာမှုကို နှိုးဆွသည်။', 'Play in a different room or place — new surroundings spark curiosity.'),
      ],
      indoor: [
        b('ခွက်အောက်တွင် ကစားစရာ ဖုံး၍ ရှာစေခြင်း။', 'Hiding a toy under a cup for her to find.'),
        b('စက္ကူ ကြေမွသံ၊ ဇွန်းခေါက်သံ ကဲ့သို့ အသံ အမျိုးမျိုး ပြုလုပ်ပြခြင်း။', 'Making different sounds — crinkling paper, tapping a spoon.'),
      ],
      outdoor: [
        b('အရိပ်တွင် သစ်ရွက် လှုပ်ခတ်ခြင်း၊ လေတိုက်ခြင်းကို အတူကြည့်ခြင်း။', 'Watching leaves move in the breeze together, in the shade.'),
      ],
      lowCost: [
        b('ခွက်၊ ဇွန်း၊ အဝတ်စ — အိမ်တွင်း ပစ္စည်းများသည် အကောင်းဆုံး ကစားစရာ ဖြစ်သည်။', 'A cup, a spoon and a cloth are excellent toys.'),
        b('သန့်ရှင်းသော ပလတ်စတစ်ဗူးထဲ ပဲစေ့ ထည့်၍ ခိုင်ခံ့စွာ ပိတ်ပါ။', 'Beans in a clean bottle, firmly sealed.'),
      ],
      materials: b('ခွက်၊ ဇွန်း၊ အဝတ်စ၊ အသံမြည် ဗူး', 'A cup, a spoon, a cloth, a rattle'),
      safety: b(
        'ကစားစရာ အားလုံးသည် ကလေးပါးစပ်ထက် ကြီးရမည် — အသေးစား ပစ္စည်းများသည် လည်ချောင်းပိတ် နိုင်သည်။ အိမ်လုပ် အသံမြည်ဗူးကို ခိုင်ခံ့စွာ ပိတ်ထားပါ၊ မကြာခဏ စစ်ဆေးပါ။ ဘက်ထရီ (အထူးသဖြင့် ခလုတ်ဘက်ထရီ) ပါသော ပစ္စည်းများကို ကလေးလက်လှမ်း မမီအောင် ထားပါ။ ဤအရွယ်တွင် ဖန်သားပြင် အသုံးပြုမှုကို အကြံမပြုပါ — မိသားစုနှင့် ဗီဒီယိုခေါ်ဆိုမှု မှလွဲ၍ ဖြစ်သည်။',
        'Every toy must be larger than her mouth — small objects can choke. Seal a home-made rattle firmly and check it often. Keep anything containing batteries, especially button batteries, well out of reach. Screen use is not recommended at this age apart from video calls with family.',
      ),
      commonMistakes: [
        b('ကစားစရာ များစွာ တစ်ပြိုင်နက် ပေးခြင်း — အာရုံစိုက်မှု ပျက်ပြားစေသည်။', 'Offering many toys at once — it breaks her concentration.'),
        b('ထပ်ခါထပ်ခါ လုပ်နေခြင်းကို ရပ်ခိုင်းခြင်း — ဤသည် သင်ယူနေခြင်း ဖြစ်သည်။', 'Stopping the repetition — repeating is how she learns.'),
        b('ဖန်သားပြင်ဖြင့် "ပညာပေး" ရန် ကြိုးစားခြင်း — ဤအရွယ်တွင် အကျိုးမရှိပါ။', 'Trying to "teach" with a screen — it does not work at this age.'),
      ],
      parentTips: [
        b('ကလေး အာရုံစိုက်နေစဉ် မနှောင့်ယှက်ပါနှင့် — အာရုံစိုက်နိုင်စွမ်း တည်ဆောက်နေခြင်း ဖြစ်သည်။', 'Do not interrupt when she is concentrating — she is building attention.'),
        b('လုပ်နေသည်များကို အသံထွက် ပြောပြပါ — အသိဉာဏ်နှင့် ဘာသာစကား တစ်ပြိုင်နက် တိုးပွားသည်။', 'Narrate what is happening — thinking and language grow together.'),
      ],
      faq: [
        {
          q: b('ပစ္စည်းကို အကြိမ်ကြိမ် ချနေတယ်။ စိတ်တိုစရာလား။', 'She keeps dropping things. Is she being difficult?'),
          a: b('မဟုတ်ပါ — ဤသည် သိပ္ပံစမ်းသပ်ချက် ဖြစ်သည်။ "ချလိုက်ရင် ဘာဖြစ်လဲ" ကို လေ့လာနေခြင်း ဖြစ်သည်။ ပြန်ကောက်ပေးခြင်းသည် ကစားနည်း၏ တစ်စိတ်တစ်ပိုင်း ဖြစ်သည်။', 'No — it is an experiment. She is learning "what happens if I let go?". Handing it back is part of the game.'),
        },
        {
          q: b('ပညာပေး ဗီဒီယိုတွေ ကြည့်ခိုင်းသင့်လား။', 'Should I show her educational videos?'),
          a: b('ဤအရွယ်တွင် ဖန်သားပြင်မှ သင်ယူနိုင်ခြင်း မရှိသေးပါ။ လူတစ်ဦးနှင့် တိုက်ရိုက် ကစားခြင်းက အဆမတန် ပိုအကျိုးရှိသည်။ မိသားစုနှင့် ဗီဒီယိုခေါ်ဆိုခြင်းကတော့ ကွာခြားပါသည်။', 'Babies this age do not learn from screens. Playing with a person is far more useful. A family video call is different.'),
        },
      ],
      redFlags: [
        b('ပတ်ဝန်းကျင်ကို လုံးဝ စိတ်မဝင်စားခြင်း၊ ပစ္စည်းကို လုံးဝ မကြည့်ခြင်း။', 'No interest at all in surroundings or in looking at objects.'),
        b('မျက်လုံးဖြင့် ရွေ့လျားနေသော ပစ္စည်းကို လုံးဝ မလိုက်ကြည့်နိုင်ခြင်း။', 'Not following a moving object with her eyes at all.'),
        b('ယခင်က လုပ်နိုင်ခဲ့သော အရာများ ဆုံးရှုံးသွားခြင်း။', 'Loss of skills she had before.'),
      ],
      referral: b(
        'ဤလက္ခဏာများကို ကျန်းမာရေးဝန်ထမ်းအား ပြသပါ။ မျက်စိ သို့မဟုတ် နားကြားခြင်း စစ်ဆေးမှု လိုအပ်နိုင်သည်။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ပါ။',
        'Raise these with a health worker; a vision or hearing check may be needed. This is not a diagnosis.',
      ),
      encouragement: b(
        'ကလေး ချလိုက်တိုင်း သင် ပြန်ကောက်ပေးနေခြင်းသည် စိတ်ရှည်ခြင်း မဟုတ်ဘဲ သင်ကြားပေးနေခြင်း ဖြစ်ပါသည်။',
        'Each time you hand it back, you are not just being patient — you are teaching.',
      ),
    }),
    'Cause-and-effect play, repetition and early object permanence at 5–6 months follow CDC milestone checklists and AAP milestone guidance and standard developmental-behavioural paediatrics references; the screen advice follows AAP media guidance and WHO physical activity and sleep guidance for under-5s.',
  ),
  kb(
    guide('5_6m', 'sleep', {
      title: b('၅ – ၆ လ — အိပ်စက်ခြင်း လမ်းညွှန်', '5–6 months — Sleep guide'),
      why: b(
        'အသက် ၄–၁၁ လအရွယ်တွင် စုစုပေါင်း အိပ်ချိန် ၁၂–၁၆ နာရီခန့် (နေ့အိပ် အပါအဝင်) ဖြစ်တတ်သည်။ ကလေးအများစုသည် ညဘက် အိပ်ချိန် ရှည်လာသော်လည်း ညတွင် နိုးခြင်းသည် ဤအရွယ်၌ ပုံမှန်ပင် ဖြစ်သည်။ ကလေး လှိမ့်နိုင်လာသဖြင့် အိပ်ရာ လုံခြုံမှုသည် ယခင်ထက်ပင် ပိုအရေးကြီးလာသည်။',
        'At 4–11 months total sleep is commonly about 12–16 hours including naps. Night stretches usually lengthen, but waking at night is still normal at this age. Now that she rolls, a safe sleep space matters more than ever.',
      ),
      observationQuestions: [
        b('တစ်ရက်လျှင် စုစုပေါင်း အိပ်ချိန် မည်မျှ ရှိသနည်း။', 'How much sleep does she get in total each day?'),
        b('အိပ်ရာဝင် အစီအစဉ် တည်ငြိမ်ပါသလား။', 'Is there a steady bedtime routine?'),
        b('အိပ်ရာသည် မာကျောပြီး ပြားညီပါသလား၊ အပေါ်တွင် ပစ္စည်း ရှင်းပါသလား။', 'Is the sleep surface firm, flat and clear?'),
        b('နေ့ဘက်တွင် နိုးကြားပြီး တက်ကြွပါသလား။', 'Is she alert and active during the day?'),
      ],
      dailyActivities: [
        b('အိပ်ချိန်တိုင်း ပက်လက် အနေအထားဖြင့် ချထားပါ။', 'Place her on her back for every sleep.'),
        b('ညတိုင်း တူညီသော အိပ်ရာဝင် အစီအစဉ် (ရေချိုး၊ နို့တိုက်၊ သီချင်း၊ အိပ်) ကို လိုက်နာပါ။', 'Follow the same short bedtime routine each night — wash, feed, song, sleep.'),
        b('နေ့ဘက်တွင် အလင်းရောင်နှင့် လှုပ်ရှားမှု၊ ညဘက်တွင် အလင်းမှိန်ပြီး တိတ်ဆိတ်စေပါ။', 'Keep days bright and active, nights dim and quiet.'),
        b('အိပ်ငိုက်လာသော်လည်း မအိပ်သေးမီ အိပ်ရာတွင် ချထားကြည့်ပါ။', 'Try putting her down drowsy but not yet asleep.'),
      ],
      weeklyActivities: [
        b('အိပ်ချိန် မှတ်တမ်း တစ်ပတ်စာ ရေးမှတ်၍ ပုံစံကို လေ့လာပါ။', 'Keep a week of sleep notes to see the pattern.'),
        b('အိပ်ရာနေရာကို ပတ်ပတ်လည် စစ်ဆေးပါ — ကြိုး၊ လိုက်ကာကြိုး ဝေးအောင် ထားပါ။', 'Check the sleep area weekly — keep cords and blind pulls far away.'),
      ],
      indoor: [
        b('အိပ်ရာဝင်မီ တိတ်ဆိတ်သော ကစားချိန် ၁၀ မိနစ်။', 'Ten quiet minutes of calm play before bed.'),
        b('ငြိမ်သက်သော သီချင်း သို့မဟုတ် ပုံပြင် တစ်ပုဒ်။', 'One calm song or story.'),
      ],
      outdoor: [
        b('နေ့ဘက် အရိပ်တွင် ခဏ ထွက်ခြင်း — နေ့/ည ခွဲခြားမှုကို ကူညီသည်။', 'A short time outside in the shade by day helps set day from night.'),
      ],
      lowCost: [
        b('မာကျောပြီး ပြားညီသော အိပ်ရာ တစ်ခုသာ လိုအပ်သည် — အထူး ပစ္စည်း မလိုပါ။', 'All you need is a firm flat surface — no special equipment.'),
        b('အဝတ်ပါးဖြင့် အလင်းကာ၍ အခန်းကို မှောင်စေခြင်း။', 'A thin cloth over the window to darken the room.'),
      ],
      materials: b('မာကျောသော အိပ်ရာ၊ ပါးလွှာသော စောင်', 'A firm sleep surface and a light cover'),
      safety: b("အိပ်ချိန်တိုင်း ပက်လက် အနေအထားဖြင့် ချထားပါ။ ကလေး ကိုယ်တိုင် လှိမ့်သွားပါက ပြန်လှည့်ပေးရန် မလိုပါ — သို့သော် စတင် ချထားချိန်တွင် အမြဲ ပက်လက် ဖြစ်ရမည်။ အိပ်ရာသည် မာကျောပြီး ပြားညီရမည်၊ အပေါ်တွင် ခေါင်းအုံး၊ အနူးအညံ့ ကစားစရာ၊ စောင်ပုံ၊ ကြိုး မရှိစေရ။ အခန်းတူ အိပ်ပါ၊ အိပ်ရာတူ မအိပ်ပါနှင့်။ ဆေးလိပ် သောက်ပြီးလျှင်၊ အရက် သောက်ပြီးလျှင်၊ အိပ်ဆေး/ငိုက်စေသော ဆေး သောက်ပြီးလျှင် ကလေးနှင့် အိပ်ရာတူ လုံးဝ မအိပ်ပါနှင့်။ ဆိုဖာ၊ အနားထိုင်ကုလားထိုင်ပေါ်တွင် ကလေးနှင့် အတူ လုံးဝ မအိပ်ပါနှင့်။ ကလေးမျက်နှာကို မဖုံးပါနှင့်။ အခန်းအပူချိန်ကို သင့်တင့်စွာ ထားပြီး အဝတ် အလွန်အကျွံ မထူပါစေနှင့်။ ကလေးအနီးတွင် ဆေးလိပ် လုံးဝ မသောက်ပါနှင့်။ ကလေးကို ဘယ်တော့မျှ မလှုပ်ခါပါနှင့်။ အိပ်ချိန်နှင့် ညအိပ်ချိန်တွင် နို့သီးခေါင်း ပေးကြည့်နိုင်ပါသည် — ရုတ်တရက် သေဆုံးမှု အန္တရာယ် လျော့ကျစေကြောင်း တွေ့ရှိထားပါသည်။ နို့တိုက်နေပါက နို့တိုက်ခြင်း အသားကျပြီးမှ စတင်ပေးပါ။", "Back to sleep for every sleep. If she rolls herself over in sleep there is no need to turn her back, but always start her on her back. The surface must be firm and flat, with no pillows, soft toys, loose bedding or cords. Share a room, not a bed. Never bed-share after smoking, alcohol or any sedating medicine. Never sleep with her on a sofa or armchair. Never cover her face. Keep the room a comfortable temperature and do not over-wrap her. No tobacco smoke anywhere near her. Never shake a baby. You can try offering a pacifier at nap time and bedtime — it is associated with a lower risk of SIDS. If you are breastfeeding, wait until feeding is well established before offering one."),
      commonMistakes: [
        b('အိပ်ရာပေါ်တွင် အနူးအညံ့ ကစားစရာ၊ ခေါင်းအုံး ထားခြင်း။', 'Leaving soft toys or pillows in the sleep space.'),
        b('ကလေး လှိမ့်သွားမည်ကို စိုးရိမ်၍ အဝတ်လိပ်ဖြင့် ကာထားခြင်း — ဤသည် အန္တရာယ် ရှိသည်။', 'Wedging her in with rolled cloth to stop her rolling — this is dangerous.'),
        b('ညဘက် နိုးတိုင်း ချက်ချင်း မီးဖွင့်၍ ကစားပေးခြင်း။', 'Turning on the light and playing at every night waking.'),
        b("အလေးချိန်ပါသော စောင်၊ အိပ်ဝတ်စုံ သို့မဟုတ် ပတ်ရစ်ပိတ်စများ သုံးခြင်း။", "Using weighted blankets, weighted sleepers or weighted swaddles."),
        b("အိမ်သုံး အသက်ရှူ/နှလုံးခုန် စောင့်ကြည့်စက်ကို ဘေးကင်းစွာ အိပ်စေခြင်း၏ အစား အားကိုးခြင်း — အန္တရာယ် လျှော့ချပေးသည်ဟု သက်သေ မရှိပါ။", "Relying on a home breathing or heart-rate monitor instead of a safe sleep space — these have not been shown to reduce the risk of SIDS."),
      ],
      parentTips: [
        b('ညဘက် နိုးလျှင် အလင်းမှိန်မှိန်ဖြင့် တိတ်ဆိတ်စွာ ကိုင်တွယ်ပါ။', 'Handle night wakings quietly and in dim light.'),
        b('တူညီသော အစီအစဉ်သည် အချိန်တိကျမှုထက် ပိုအရေးကြီးသည်။', 'Consistency of routine matters more than exact clock times.'),
      ],
      faq: [
        {
          q: b('ကလေး လှိမ့်ပြီး မှောက်အိပ်သွားရင် ပြန်လှည့်ပေးရမလား။', 'She rolls onto her tummy in her sleep. Should I turn her back?'),
          a: b('ကလေး ကိုယ်တိုင် ဘက်နှစ်ဖက် လှိမ့်နိုင်ပြီဆိုလျှင် ပြန်လှည့်ပေးရန် မလိုပါ။ သို့သော် စတင် ချထားချိန်တွင် အမြဲ ပက်လက် ဖြစ်ရမည်ဖြစ်ပြီး အိပ်ရာပေါ်တွင် ပစ္စည်း ရှင်းလင်းနေရမည်။', 'Once she can roll both ways herself you do not need to turn her back, but always place her on her back to start and keep the surface clear.'),
        },
        {
          q: b('ညဘက် အိပ်ဖို့ ဆန်ဖြူပြုတ်/နို့မှုန့် တိုးပေးသင့်လား။', 'Should I give porridge or extra formula so she sleeps at night?'),
          a: b('ညအိပ်ရန်အတွက် အစားအစာ တိုးပေးခြင်းသည် အလုပ်မဖြစ်ကြောင်း အထောက်အထားများက ပြသည်။ အသက် ၆ လဝန်းကျင်တွင် အသင့်ဖြစ်မှု လက္ခဏာများ ပေါ်လာမှသာ အစားအစာ စတင်သင့်သည်။ ပုလင်းကို မထောက်ထားပါနှင့်။', 'Adding food to make her sleep is not supported by evidence. Solids should start at around 6 months when readiness signs appear. Never prop a bottle.'),
        },
        {
          q: b('ညဘက် အကြိမ်ကြိမ် နိုးတယ်။ ပုံမှန်လား။', 'She wakes several times a night. Is that normal?'),
          a: b('ဤအရွယ်တွင် ညဘက် နိုးခြင်းသည် ပုံမှန် ဖြစ်သည်။ တည်ငြိမ်သော အိပ်ရာဝင် အစီအစဉ်နှင့် တိတ်ဆိတ်သော တုံ့ပြန်မှုက အထောက်အကူ ဖြစ်သည်။ ကလေး နေ့ဘက် နိုးကြားပြီး ကိုယ်အလေးချိန် တက်နေလျှင် စိုးရိမ်စရာ မရှိပါ။', 'Night waking is normal at this age. A steady bedtime routine and quiet responses help. If she is alert by day and gaining weight, there is no cause for concern.'),
        },
      ],
      redFlags: [
        b('နိုးရန် အလွန် ခက်ခဲခြင်း သို့မဟုတ် လုံးဝ မနိုးခြင်း။', 'Very hard to wake, or not waking at all.'),
        b('အသက်ရှူရာတွင် ရပ်တန့်ခြင်း၊ အရေပြားညိုမှဲခြင်း၊ အသံမြည်၍ ခက်ခဲစွာ ရှူခြင်း။', 'Pauses in breathing, blue or dusky colour, or noisy laboured breathing.'),
        b('အစာစားမှု သိသိသာသာ ကျဆင်းခြင်းနှင့် အားနည်းလာခြင်း။', 'A marked drop in feeding with growing weakness.'),
        b("နှိပ်လျှင် မပျောက်သော အနီစက်များ — ဖန်ခွက်ဖြင့် ဖိကြည့်ပါ။ ဖိထားစဉ် အနီရောင် မပျောက်ပါက ချက်ချင်း ဆေးရုံသို့ သွားပါ။", "A rash that does not fade when you press on it — press a clear glass against the skin. If the red marks stay visible while you press, go to hospital immediately."),
      ],
      referral: b(
        'ဤလက္ခဏာများသည် ချက်ချင်း ဆေးကုသမှု လိုအပ်သည် — အနီးဆုံး ကျန်းမာရေးဌာနသို့ ချက်ချင်း သွားပါ။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ပါ။',
        'These need urgent medical care — go to the nearest health facility straight away. This is not a diagnosis.',
      ),
      encouragement: b(
        'အိပ်ရေးပျက်ခြင်းသည် ဤကာလ၏ အခက်ခဲဆုံး အပိုင်း ဖြစ်ပါသည် — သင် တစ်ယောက်တည်း မဟုတ်ပါ။',
        'Broken sleep is the hardest part of this stage — you are not alone in it.',
      ),
    }),
    'Sleep amounts at 4–11 months follow WHO physical activity and sleep guidance for under-5s; safe sleep positioning, surface and room-sharing follow AAP safe sleep guidance, NHS SIDS advice and Health Canada safe sleep guidance; the value of a consistent bedtime routine follows the sleep-intervention trials in the registry.',
  ),
];

const GUIDES_E: SeedItem[] = [
  kb(
    guide('5_6m', 'safety', {
      title: b('၅ – ၆ လ — ဘေးကင်းလုံခြုံရေး လမ်းညွှန်', '5–6 months — Safety guide'),
      why: b(
        'ကလေး လှိမ့်နိုင်လာပြီး ပစ္စည်းကို လှမ်းယူတတ်လာသည်နှင့်အမျှ အန္တရာယ် အသစ်များ ပေါ်လာသည် — လိမ့်ကျခြင်း၊ လည်ချောင်းပိတ်ခြင်း၊ ရေနစ်ခြင်း၊ မီးလောင်ခြင်း တို့ ဖြစ်သည်။ ဤအရွယ်တွင် ပတ်ဝန်းကျင်ကို ကြိုတင် ပြင်ဆင်ထားခြင်းသည် ကလေးကို အမြဲ ကြည့်နေရခြင်းထက် ပိုမို ထိရောက်ပါသည်။',
        'As she rolls and reaches, new risks appear — falls, choking, drowning and burns. At this stage, preparing the environment in advance protects her better than constant watching alone.',
      ),
      observationQuestions: [
        b('ကလေး လှိမ့်နိုင်ပြီလား — အိပ်ရာ၊ စားပွဲပေါ် တစ်ယောက်တည်း ထားမိသလား။', 'Can she roll — and is she ever left alone on a bed or table?'),
        b('ကြမ်းပြင်ပေါ်တွင် ပါးစပ်ထဲ ဝင်နိုင်သော ပစ္စည်း ရှိပါသလား။', 'Is there anything on the floor small enough to fit her mouth?'),
        b('ရေထည့်ထားသော ပုံး၊ အိုးများကို ဖုံးထားပါသလား။', 'Are buckets and water containers covered?'),
        b('အပူရည်၊ မီးဖို၊ ဓာတ်ကြိုးများသည် လက်လှမ်း မမီပါသလား။', 'Are hot drinks, stoves and cords out of reach?'),
      ],
      dailyActivities: [
        b('ကလေးကို ကြမ်းပြင်ပေါ်တွင် ကစားစေပါ — အမြင့်ပေါ်တွင် တစ်ယောက်တည်း မထားပါနှင့်။', 'Let her play on the floor — never alone on anything high.'),
        b('ကစားစရာ တစ်ခုစီကို ပါးစပ်အရွယ်ထက် ကြီးမကြီး နေ့စဉ် စစ်ပါ။', 'Check each day that every toy is bigger than her mouth.'),
        b('ရေချိုးစဉ် တစ်စက္ကန့်မျှ မခွာပါနှင့် — ရေတိမ်တွင်လည်း ရေနစ်နိုင်သည်။', 'Never step away during a bath — babies can drown in very shallow water.'),
        b('အပူရည် သောက်စဉ် ကလေးကို မချီပါနှင့်။', 'Do not hold her while drinking anything hot.'),
      ],
      weeklyActivities: [
        b('အိမ်ကို ကလေးအမြင့်မှ ကြည့်၍ အန္တရာယ်များ ရှာပါ (တစ်ပတ်တစ်ကြိမ်)။', 'Once a week, look around the house from her eye level to spot hazards.'),
        b('ကာကွယ်ဆေး အချိန်ဇယားကို စစ်ဆေးပါ — လွတ်သွားလျှင် ဆက်လက် ထိုးပေးပါ။', 'Check her immunisation schedule and catch up on anything missed.'),
      ],
      indoor: [
        b('ကြမ်းပြင်ပေါ် အခင်းခင်း၍ ဘေးပတ်လည် ရှင်းလင်းစွာ ကစားခြင်း။', 'Floor play on a mat with clear space around.'),
      ],
      outdoor: [
        b('အရိပ်တွင်သာ ကစားပါ — နေရောင် တိုက်ရိုက်နှင့် အပူလွန်ခြင်းကို ရှောင်ပါ။', 'Play only in the shade — avoid direct sun and overheating.'),
        b('ရေကန်၊ ရေတွင်း၊ ရေမြောင်း အနီးတွင် လုံးဝ တစ်ယောက်တည်း မထားပါနှင့်။', 'Never leave her alone near ponds, wells or drains.'),
      ],
      lowCost: [
        b('ကြမ်းပြင်ကို နေ့စဉ် တံမြက်လှည်း၍ အသေးစား ပစ္စည်းများ ဖယ်ရှားခြင်း — ကုန်ကျစရိတ် မရှိပါ။', 'Sweeping the floor daily to remove small objects costs nothing.'),
        b('ရေပုံးများကို အဖုံးဖြင့် ဖုံးထားခြင်း။', 'Keeping lids on water containers.'),
      ],
      materials: b('မလိုအပ်ပါ — ပတ်ဝန်းကျင် ပြင်ဆင်မှုသာ လိုအပ်သည်', 'Nothing to buy — only changes to the environment'),
      safety: b(
        'ကလေးကို အိပ်ရာ၊ စားပွဲ၊ ဆိုဖာပေါ်တွင် တစ်စက္ကန့်မျှ တစ်ယောက်တည်း မထားပါနှင့်။ ရေအနီးတွင် တစ်စက္ကန့်မျှ မခွာပါနှင့် — ရေချိုးခွက်၊ ပုံး၊ ရေကန် အားလုံး အကျုံးဝင်သည်။ ပါးစပ်ထဲ ဝင်နိုင်သော ပစ္စည်း အားလုံး (အကြွေစေ့၊ ခလုတ်၊ ဂေါ်လီလုံး၊ ခလုတ်ဘက်ထရီ) ကို ဖယ်ရှားပါ။ ကြိုးရှည်၊ လိုက်ကာကြိုး၊ ပလတ်စတစ်အိတ်ကို လက်လှမ်းမမီအောင် ထားပါ။ အပူရည်၊ ထမင်းအိုး၊ မီးဖိုကို ကလေးအနီး မထားပါနှင့်။ ဓာတုပစ္စည်း၊ ဆေးဝါး၊ ရေနံဆီကို သော့ခတ်၍ သိမ်းပါ။ ကားစီးလျှင် သတ်မှတ်ချက်နှင့်ကိုက်ညီသော ကလေးထိုင်ခုံကို နောက်ဘက် မျက်နှာမူ၍ တပ်ဆင်ပါ။ ကလေးအနီးတွင် ဆေးလိပ် လုံးဝ မသောက်ပါနှင့်။ ကလေးကို ဘယ်တော့မျှ မလှုပ်ခါပါနှင့်။ ကာကွယ်ဆေးများကို အချိန်မှန် ထိုးပေးပါ။',
        'Never leave her alone on a bed, table or sofa, even for a second. Never leave her alone near water — baths, buckets and ponds all count. Remove anything small enough to fit her mouth, including coins, buttons, nuts and button batteries. Keep long cords, blind pulls and plastic bags out of reach. Keep hot drinks, cooking pots and stoves away from her. Lock away chemicals, medicines and fuel. In a vehicle, use a rear-facing child restraint that meets the standard. No tobacco smoke near her. Never shake a baby. Keep immunisations up to date.',
      ),
      commonMistakes: [
        b('"ခဏလေးပဲ" ဟုဆိုကာ အိပ်ရာပေါ် ချန်ထားခြင်း — လိမ့်ကျမှုအများစုသည် ဤသို့ ဖြစ်သည်။', 'Leaving her on a bed "just for a second" — this is how most falls happen.'),
        b('အစ်ကို/အစ်မ ကြီးကို ကြည့်ခိုင်းပြီး လူကြီး မရှိခြင်း — ကလေးက ကလေးကို မစောင့်ရှောက်နိုင်ပါ။', 'Leaving an older child in charge — a child cannot supervise a baby.'),
        b('ကလေးလမ်းလျှောက်စက် သုံးခြင်း — လှေကားမှ ပြုတ်ကျခြင်းနှင့် အပူလောင်ခြင်းအန္တရာယ် တိုးစေနိုင်သည်။', 'Using a baby walker — it adds risk of falls and burns.'),
      ],
      parentTips: [
        b('အန္တရာယ် ဖယ်ရှားခြင်းသည် အမြဲ ကြည့်နေရခြင်းထက် ပိုယုံကြည်ရသည်။', 'Removing the hazard is more reliable than constant watching.'),
        b('အရေးပေါ် ဖြစ်ပါက မည်သည့်နေရာသို့ သွားရမည်ကို ယခုပင် စီစဉ်ထားပါ — အနီးဆုံး ကျန်းမာရေးဌာန လမ်းကြောင်းကို သိထားပါ။', 'Decide now where you would go in an emergency and know the route to your nearest health facility.'),
      ],
      faq: [
        {
          q: b('ကလေး အိပ်ရာက လိမ့်ကျသွားတယ်။ ဘာလုပ်ရမလဲ။', 'She fell off the bed. What should I do?'),
          a: b('ကလေးကို ဂရုတစိုက် ကြည့်ပါ။ သတိလစ်ခြင်း၊ အန်ခြင်း အကြိမ်ကြိမ်၊ ငိုသံ ရပ်၍ ငြိမ်ကျသွားခြင်း၊ ခေါင်းရောင်ခြင်း၊ တစ်ဖက်ခြမ်း မလှုပ်ခြင်း ရှိပါက ချက်ချင်း ကျန်းမာရေးဌာနသို့ ပို့ပါ။ လက္ခဏာ မရှိသော်လည်း စိုးရိမ်ပါက စစ်ဆေးခံပါ။', 'Watch her closely. If she loses consciousness, vomits repeatedly, becomes unusually quiet, has a swelling on the head, or is not moving one side, take her to a health facility straight away. If you are worried even without these signs, get her checked.'),
        },
        {
          q: b('ကလေးက ဘာမဆို ပါးစပ်ထဲ ထည့်တယ်။ လည်ချောင်းပိတ်မှာ စိုးရိမ်တယ်။', 'She puts everything in her mouth and I worry about choking.'),
          a: b('ပါးစပ်ထဲ ထည့်ခြင်းသည် ပုံမှန် ဖြစ်သည် — ဖြေရှင်းနည်းမှာ ပတ်ဝန်းကျင်ကို စစ်ဆေးခြင်း ဖြစ်သည်။ ကလေးပါးစပ်ထက် သေးသော ပစ္စည်း အားလုံးကို ဖယ်ရှားပါ။ ကလေး ကစားနေစဉ် အနီးတွင် ရှိနေပါ။', 'Mouthing is normal — the answer is to check the environment. Remove everything smaller than her mouth and stay close while she plays.'),
        },
        { q: b("ဘယ်အပူချိန် ရောက်ရင် ဆေးရုံ သွားရမလဲ။", "What temperature means we should seek care?"), a: b("အပူချိန် တိုင်းပါ။ အသက် ၃ လအောက် ကလေး ၃၈°C (၁၀၀.၄°F) နှင့်အထက် ဖျားပါက — ကလေး ပုံမှန်လို ထင်ရလျှင်ပင် ချက်ချင်း ပြသပါ။ အသက် ၃ လမှ ၆ လကြား ၃၉°C (၁၀၂.၂°F) နှင့်အထက် ဖျားပါက အမြန် ပြသပါ။ အသက်မရွေး — ဖျားခြင်းနှင့်အတူ အသက်ရှူခက်ခြင်း၊ နှိပ်လျှင် မပျောက်သော အနီစက်၊ လည်ပင်း တောင့်တင်းခြင်း သို့မဟုတ် နိုးရခက်ခြင်း ပါလာပါက ချက်ချင်း ပြသပါ။ အပူချိန်တိုင်းကိရိယာ မရှိပါက — ကလေး ပူနေပြီး အထက်ပါ လက္ခဏာများ ပါလျှင် မစောင့်ဘဲ ပြသပါ။", "Take the temperature. Under 3 months, 38°C (100.4°F) or above: seek care straight away, even if the baby otherwise seems well. Between 3 and 6 months, 39°C (102.2°F) or above: seek care promptly. At any age, fever together with difficulty breathing, a rash that does not fade under pressure, a stiff neck, or being hard to wake: seek care immediately. If you have no thermometer, and the child feels hot and has any of those signs, do not wait.") },
      ],
      redFlags: [
        b('ခေါင်းထိခိုက်ပြီးနောက် သတိလစ်ခြင်း၊ အန်ခြင်း အကြိမ်ကြိမ်၊ ငြိမ်ကျသွားခြင်း။', 'After a head injury: loss of consciousness, repeated vomiting, or becoming unusually quiet.'),
        b('အသက်ရှူ ခက်ခဲခြင်း၊ အရေပြား ညိုမှဲခြင်း၊ အသံ ပျောက်သွားခြင်း။', 'Difficulty breathing, blue or dusky colour, or a silent baby who cannot make a sound.'),
        b('ဖြစ်နိုင်ခြေရှိသော အဆိပ်သင့်မှု၊ ဆေးဝါး/ဓာတုပစ္စည်း မျိုချမိခြင်း။', 'Suspected poisoning or swallowing of medicine or chemicals.'),
        b('တက်ခြင်း၊ နိုးရန် ခက်ခဲခြင်း၊ အစာ လုံးဝ မစားနိုင်ခြင်း၊ အသက် ၃ လကျော် ကလေးတွင် အဖျားနှင့်အတူ အလွန် ပျော့ခွေခြင်း။', 'A seizure, being hard to rouse, not feeding at all, or fever with marked floppiness.'),
        b("နှိပ်လျှင် မပျောက်သော အနီစက်များ — ဖန်ခွက်ဖြင့် ဖိကြည့်ပါ။ ဖိထားစဉ် အနီရောင် မပျောက်ပါက ချက်ချင်း ဆေးရုံသို့ သွားပါ။", "A rash that does not fade when you press on it — press a clear glass against the skin. If the red marks stay visible while you press, go to hospital immediately."),
      ],
      referral: b(
        'ဤလက္ခဏာများသည် ချက်ချင်း ဆေးကုသမှု လိုအပ်သည် — အနီးဆုံး ကျန်းမာရေးဌာနသို့ ချက်ချင်း သွားပါ။ ဤအက်ပ်သည် ရောဂါ ဖော်ထုတ်ခြင်း မပြုပါ။',
        'These need urgent medical care — go to the nearest health facility immediately. This app does not diagnose.',
      ),
      encouragement: b(
        'ဘေးကင်းသော အိမ်တစ်လုံးသည် ကလေးအား လွတ်လပ်စွာ စူးစမ်းလေ့လာခွင့် ပေးသော လက်ဆောင် ဖြစ်ပါသည်။',
        'A safe home is the gift that lets her explore freely.',
      ),
    }),
    'Fall, choking, drowning and burn precautions at this age follow AAP drowning-prevention guidance and the Bright Futures preventive-care schedule; the urgent-sign list follows NHS advice on spotting a seriously ill child, NICE fever guidance and the WHO IMCI danger signs; safe sleep points follow AAP safe sleep guidance.',
  ),
  kb(
    guide('5_6m', 'daily_routine', {
      title: b('၅ – ၆ လ — နေ့စဉ် လုပ်ရိုးလုပ်စဉ် လမ်းညွှန်', '5–6 months — Daily routine guide'),
      why: b(
        'တည်ငြိမ်သော နေ့စဉ် အစီအစဉ်သည် ကလေးအား "နောက်တစ်ခု ဘာလာမလဲ" ကို ကြိုတင် သိစေပြီး လုံခြုံစိတ်ချမှု ဖြစ်စေသည်။ အချိန်တိကျရန် မလိုပါ — အစီအစဉ်၏ အစဉ်လိုက်သည်သာ အရေးကြီးသည်။ ဤအရွယ်တွင် နေ့စဉ်တွင် နို့တိုက်ခြင်း၊ ကစားခြင်း၊ အနားယူခြင်း၊ အိပ်ခြင်း တို့ကို ထပ်ခါထပ်ခါ လှည့်ပတ်နေခြင်း ဖြစ်သည်။',
        'A steady daily rhythm lets her predict what comes next, and that feels safe. Exact clock times do not matter — the order does. The day is a repeating cycle of feeding, playing, resting and sleeping.',
      ),
      observationQuestions: [
        b('နေ့စဉ် အစီအစဉ်၏ အစဉ်လိုက် တူညီပါသလား။', 'Does the order of the day stay the same?'),
        b('အိပ်ရာဝင် အစီအစဉ် ရှိပါသလား။', 'Is there a bedtime routine?'),
        b('နေ့စဉ် မှောက်ချချိန်နှင့် ကြမ်းပြင်ကစားချိန် ရှိပါသလား။', 'Is there daily tummy time and floor play?'),
        b('မိသားစုဝင် အားလုံး တူညီသော အစီအစဉ်ကို လိုက်နာပါသလား။', 'Does everyone in the family follow the same routine?'),
      ],
      dailyActivities: [
        b('နိုးလာလျှင် — နို့တိုက်၊ ကစား၊ အနားယူ၊ အိပ် — ဤသံသရာကို လိုက်နာပါ။', 'Follow the cycle: wake, feed, play, rest, sleep.'),
        b('ကစားချိန်တွင် မှောက်ချချိန် အနည်းဆုံး အကြိမ် ၃ ကြိမ် ထည့်ပါ။', 'Include tummy time at least three times during play periods.'),
        b('ရေချိုးချိန်၊ အဝတ်လဲချိန်ကို စကားပြောချိန်အဖြစ် သုံးပါ။', 'Use bath and nappy times as talking times.'),
        b('ညနေပိုင်းတွင် ကစားချိန်ကို ငြိမ်သက်စွာ ပြောင်းလဲပေးပါ။', 'Make evening play calmer as bedtime approaches.'),
      ],
      weeklyActivities: [
        b('တစ်ပတ်လျှင် တစ်ကြိမ် အပြင်ထွက်ခြင်း — အရိပ်တွင် ဖြစ်ပါစေ။', 'One outing a week, staying in the shade.'),
        b('ကာကွယ်ဆေး၊ ကလေးစစ်ဆေးမှု ချိန်းဆိုချက်များကို ပြက္ခဒိန်တွင် မှတ်ထားပါ။', 'Mark immunisation and child health check appointments on a calendar.'),
      ],
      indoor: [
        b('နေ့စဉ် ကြမ်းပြင်ကစားချိန်၊ ပုံစာအုပ်ချိန်၊ သီချင်းချိန်။', 'Daily floor play, book time and song time.'),
      ],
      outdoor: [
        b('နံနက် သို့မဟုတ် ညနေ အေးမြချိန်တွင် ခဏ လမ်းလျှောက်ခြင်း။', 'A short walk in the cooler morning or evening.'),
      ],
      lowCost: [
        b('အစီအစဉ် တစ်ခုသည် ငွေကုန်ကျမှု လုံးဝ မရှိပါ — အလေ့အထသာ ဖြစ်သည်။', 'A routine costs nothing at all — it is only a habit.'),
        b('စက္ကူတစ်ရွက်တွင် နေ့စဉ် အစီအစဉ်ကို ရေးထား၍ နံရံတွင် ကပ်ပါ။', 'Write the daily order on a sheet of paper and put it on the wall.'),
      ],
      materials: b('မလိုအပ်ပါ', 'Nothing needed'),
      safety: b(
        'အိပ်ချိန်တိုင်း ပက်လက် အနေအထား၊ မာကျောပြီး ရှင်းလင်းသော အိပ်ရာ။ ရေချိုးစဉ် တစ်စက္ကန့်မျှ မခွာပါနှင့်။ ကလေးကို အမြင့်ပေါ်တွင် တစ်ယောက်တည်း မထားပါနှင့်။ ပုလင်းကို မထောက်ထားပါနှင့်၊ ကလေးကို ပုလင်းနှင့်အတူ မအိပ်စေပါနှင့်။ အသက် ၁၂ လအောက် ကလေးအား ပျားရည် မကျွေးပါနှင့်။ အသက် ၆ လအောက်တွင် ရေ၊ နွားနို့၊ ဆန်ပြုတ် မကျွေးပါနှင့် — နို့သာ လိုအပ်သည်။ ကာကွယ်ဆေး အချိန်ဇယားကို လိုက်နာပါ။ ကလေးအနီးတွင် ဆေးလိပ် လုံးဝ မသောက်ပါနှင့်။ ကလေးကို ဘယ်တော့မျှ မလှုပ်ခါပါနှင့်။',
        'Back to sleep every sleep, on a firm clear surface. Never step away during a bath. Never leave her alone anywhere high. Never prop a bottle or let her sleep with one. No honey before 12 months. No water, cow’s milk or porridge before 6 months — milk is all she needs. Keep to the immunisation schedule. No tobacco smoke near her. Never shake a baby.',
      ),
      commonMistakes: [
        b('နာရီအတိအကျ လိုက်ရန် ကြိုးစားခြင်း — အစဉ်လိုက်သာ အရေးကြီးသည်။', 'Trying to keep exact clock times — the order matters, not the clock.'),
        b('ကလေး အိပ်ချိန်ကို နေ့စဉ် အလွန်ကွာခြားစွာ ပြောင်းလဲခြင်း။', 'Letting sleep times swing widely from day to day.'),
        b('မိသားစုဝင် တစ်ဦးစီ မတူညီသော နည်းလမ်း သုံးခြင်း။', 'Different family members each doing it a different way.'),
      ],
      parentTips: [
        b('အစီအစဉ်ကို မိသားစုဝင် အားလုံးနှင့် မျှဝေပါ — တူညီမှုက ကလေးကို ကူညီသည်။', 'Share the routine with everyone at home — consistency helps her.'),
        b('ရက်တစ်ရက် ပျက်သွားလျှင် စိတ်မပူပါနှင့် — နောက်နေ့ ပြန်စပါ။', 'If a day falls apart, do not worry — start again tomorrow.'),
      ],
      faq: [
        {
          q: b('အစီအစဉ် တစ်ခု ဖန်တီးဖို့ စောလွန်းသေးလား။', 'Is it too early to have a routine?'),
          a: b('မစောပါ။ အချိန်တိကျစွာ မဟုတ်ဘဲ အစဉ်လိုက် တူညီစေခြင်းသည် ဤအရွယ်တွင် အလုပ်ဖြစ်ပါသည်။ တင်းကျပ်စွာ မဟုတ်ဘဲ ကလေး၏ လက္ခဏာများနှင့် ပေါင်းစပ်ပါ။', 'Not at all. A consistent order — rather than fixed clock times — works well at this age. Keep it flexible and follow her cues.'),
        },
        {
          q: b('အလုပ်ပြန်ဆင်းရင် အစီအစဉ် ထိန်းလို့ ရပါ့မလား။', 'Can I keep a routine if I go back to work?'),
          a: b('ရပါသည်။ ကလေးကို စောင့်ရှောက်သူနှင့် တူညီသော အစဉ်လိုက်ကို သဘောတူထားပါ။ သင် အိမ်ရှိချိန်တွင် နို့တိုက်ချိန်၊ အိပ်ရာဝင်ချိန်တို့ကို ဆက်ထိန်းပါ။', 'Yes. Agree the same order with whoever cares for her, and keep the feeds and bedtime you are there for.'),
        },
        { q: b("ဘယ်အပူချိန် ရောက်ရင် ဆေးရုံ သွားရမလဲ။", "What temperature means we should seek care?"), a: b("အပူချိန် တိုင်းပါ။ အသက် ၃ လအောက် ကလေး ၃၈°C (၁၀၀.၄°F) နှင့်အထက် ဖျားပါက — ကလေး ပုံမှန်လို ထင်ရလျှင်ပင် ချက်ချင်း ပြသပါ။ အသက် ၃ လမှ ၆ လကြား ၃၉°C (၁၀၂.၂°F) နှင့်အထက် ဖျားပါက အမြန် ပြသပါ။ အသက်မရွေး — ဖျားခြင်းနှင့်အတူ အသက်ရှူခက်ခြင်း၊ နှိပ်လျှင် မပျောက်သော အနီစက်၊ လည်ပင်း တောင့်တင်းခြင်း သို့မဟုတ် နိုးရခက်ခြင်း ပါလာပါက ချက်ချင်း ပြသပါ။ အပူချိန်တိုင်းကိရိယာ မရှိပါက — ကလေး ပူနေပြီး အထက်ပါ လက္ခဏာများ ပါလျှင် မစောင့်ဘဲ ပြသပါ။", "Take the temperature. Under 3 months, 38°C (100.4°F) or above: seek care straight away, even if the baby otherwise seems well. Between 3 and 6 months, 39°C (102.2°F) or above: seek care promptly. At any age, fever together with difficulty breathing, a rash that does not fade under pressure, a stiff neck, or being hard to wake: seek care immediately. If you have no thermometer, and the child feels hot and has any of those signs, do not wait.") },
      ],
      redFlags: [
        b('အစာစားမှု သိသိသာသာ ကျဆင်းခြင်း၊ ကိုယ်အလေးချိန် မတက်ခြင်း။', 'A marked drop in feeding or weight not rising.'),
        b('နေ့ဘက်တွင် အလွန် ငြိမ်ကျခြင်း၊ တုံ့ပြန်မှု နည်းလာခြင်း။', 'Being unusually quiet and less responsive during the day.'),
        b('အဖျားနှင့်အတူ အလွန် ပျော့ခွေခြင်း၊ နိုးရန် ခက်ခဲခြင်း။', 'Fever with marked floppiness or being hard to rouse.'),
      ],
      referral: b(
        'အလွန် ပျော့ခွေခြင်း၊ နိုးရန် ခက်ခဲခြင်း၊ အစာ လုံးဝ မစားနိုင်ခြင်းသည် ချက်ချင်း ဆေးကုသမှု လိုအပ်သည်။ ကိုယ်အလေးချိန် မတက်ခြင်းကို ကျန်းမာရေးဝန်ထမ်းအား ပြသပါ။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ပါ။',
        'Marked floppiness, being hard to rouse, or not feeding at all needs urgent care. Show a health worker if weight is not rising. This is not a diagnosis.',
      ),
      encouragement: b(
        'ပြီးပြည့်စုံသော နေ့တစ်နေ့ မလိုပါ — ခန့်မှန်းနိုင်သော နေ့တစ်နေ့သာ လိုပါသည်။',
        'She does not need a perfect day — only a predictable one.',
      ),
    }),
    'The value of predictable daily rhythms and responsive care follows the WHO/UNICEF nurturing care framework and the Bright Futures preventive-care schedule; the bedtime-routine advice follows the sleep-intervention trials in the registry; the feeding-safety points follow the WHO infant and young child feeding model chapter; the drowning and fall precautions follow AAP drowning-prevention guidance; the fever advice follows NICE fever guidance; the immunisation reminder follows the CDC immunisation schedule.',
  ),
];

const ACTIVITIES: SeedItem[] = [
  kb(
    activity({
      slug: 'babble_back_and_forth',
      title: b('အသံ အပြန်အလှန် ဖလှယ်ခြင်း', 'Babble back and forth'),
      summary: b('ကလေး၏ ဗျည်းသံများကို အတုယူ ပြန်ဆိုပြီး အလှည့်ကျ စကားပြောခြင်း။', 'Copy your baby’s babble and build a back-and-forth conversation.'),
      ageGroupKey: '5_6m',
      domains: ['speech', 'communication', 'language'],
      difficulty: 'easy',
      durationMinutes: 5,
      materials: b('မလိုအပ်ပါ — သင်၏ အသံနှင့် မျက်နှာသာ။', 'None — just your voice and face.'),
      setup: b('တိတ်ဆိတ်သော နေရာတွင် မျက်နှာချင်းဆိုင် ထိုင်ပါ။ တီဗွီ၊ ရေဒီယို ပိတ်ပါ။', 'Sit face to face in a quiet spot with the TV and radio off.'),
      instructions: [
        b('ကလေး "ဘဘ"၊ "ဒဒ" ကဲ့သို့ အသံ ထွက်သည်ကို စောင့်ပါ။', 'Wait for a babble sound such as "ba-ba" or "da-da".'),
        b('ထိုအသံအတိုင်း အတိအကျ ပြန်ဆိုပါ။', 'Copy that sound back exactly.'),
        b('၅ စက္ကန့်ခန့် ရပ်နား၍ ကလေး၏ အလှည့်ကို စောင့်ပါ။', 'Pause about five seconds and wait for her turn.'),
        b('ကလေး ပြန်ထွက်လျှင် ထပ်ဆိုပါ — အလှည့် များများ ဖြစ်အောင် ကြိုးစားပါ။', 'When she answers, copy again — aim for as many turns as you can.'),
        b('ပြီးလျှင် အသံအသစ် တစ်ခု ("မမ") ထည့်ပေးပါ။', 'Then add one new sound of your own, such as "ma-ma".'),
        b('ကလေး မျက်နှာလွှဲလျှင် ရပ်ပါ။', 'Stop when she turns away.'),
      ],
      safety: b('အသံ ကျယ်လောင်စွာ မထွက်ပါနှင့်။ ကလေး၏ မောပန်း လက္ခဏာကို လေးစားပါ။', 'Keep your voice soft, never loud, and respect her tired cues.'),
      indoor: true, outdoor: true, oneChild: true, group: false, parentChild: true,
      outcomes: [
        b('ဗျည်းသံ ထွက်ဆိုမှုနှင့် အလှည့်ကျ ဆက်သွယ်မှုကို အားပေးရန်။', 'Learning objective — to encourage consonant babble and conversational turn-taking.'),
        b('မျက်လုံးချင်းဆိုင်မှုနှင့် ပူးတွဲ အာရုံစိုက်မှု တိုးလာခြင်း။', 'More eye contact and shared attention.'),
      ],
      variations: [b('မိသားစုဝင် အသီးသီးက အလှည့်ကျ လုပ်ပေးပါ — အသံ အမျိုးမျိုး ကြားစေပါ။', 'Let different family members take a turn so she hears different voices.')],
      lowCost: true,
      offline: true,
      tags: ['speech_activity', 'daily'],
    }),
    'Copying an infant’s babble and waiting for a reply is supported by NHS learn-to-talk guidance, CDC milestone guidance, the WHO Care for Child Development counselling materials and the conversational-turns research in the registry.',
  ),
  kb(
    activity({
      slug: 'roll_and_reach',
      title: b('လှိမ့်၍ လှမ်းယူခြင်း', 'Roll and reach'),
      summary: b('ကစားစရာကို ဘေးတစ်ဖက်တွင် ထားပေး၍ ကလေးအား လှိမ့်ရန် ဖိတ်ခေါ်ခြင်း။', 'Place a toy just to one side to invite your baby to roll towards it.'),
      ageGroupKey: '5_6m',
      domains: ['gross_motor', 'fine_motor', 'play'],
      difficulty: 'easy',
      durationMinutes: 10,
      materials: b('ပါးစပ်ထဲ မဝင်နိုင်လောက်အောင် ကြီးသော ကစားစရာ တစ်ခုနှင့် အခင်း တစ်ထည်။', 'One toy too large to fit in the mouth, and a mat.'),
      setup: b('ကြမ်းပြင်ပေါ်တွင် အခင်း ခင်းပါ။ ဘေးပတ်လည်ကို ရှင်းလင်းစွာ ထားပါ — ပရိဘောဂ၊ ကြိုး ဝေးအောင် ထားပါ။', 'Lay a mat on the floor and clear the space all around — no furniture or cords nearby.'),
      instructions: [
        b('ကလေးကို ပက်လက် လှဲပါ။', 'Lay her on her back.'),
        b('ကစားစရာကို ဘေးတစ်ဖက်၊ လက်လှမ်း အနည်းငယ် လွန်သောနေရာတွင် ချထားပါ။', 'Put the toy to one side, just beyond her reach.'),
        b('အမည်ခေါ်၍ ကစားစရာကို ညွှန်ပြပါ။', 'Call her name and point to the toy.'),
        b('ကလေး လှည့်ရန် ကြိုးစားလျှင် စောင့်ကြည့်ပါ — အတင်း မတွန်းပါနှင့်။', 'Watch as she tries to turn — do not push her over.'),
        b('ရောက်လျှင် ချီးကျူးပြီး ကစားစရာကို ကိုင်ခွင့် ပေးပါ။', 'When she gets there, cheer and let her hold it.'),
        b('တစ်ဖက်ပြီး တစ်ဖက် အလှည့်ကျ လုပ်ပါ။', 'Repeat on the other side.'),
      ],
      safety: b('ကြမ်းပြင်ပေါ်တွင်သာ လုပ်ပါ — အိပ်ရာ၊ စားပွဲပေါ်တွင် လုံးဝ မလုပ်ပါနှင့်၊ လိမ့်ကျနိုင်သည်။ ကလေးအနီးတွင် အမြဲ ရှိနေပါ။ ကစားစရာသည် ကလေးပါးစပ်ထက် ကြီးရမည်။ ကလေး ငိုလျှင် ရပ်ပါ။', 'Do this on the floor only — never on a bed or table, where she could fall. Stay beside her. The toy must be larger than her mouth. Stop if she cries.'),
      indoor: true, outdoor: false, oneChild: true, group: false, parentChild: true,
      outcomes: [
        b('လှိမ့်ခြင်းနှင့် ရည်ရွယ်ချက်ရှိ လှမ်းယူခြင်းကို အားပေးရန်။', 'Learning objective — to encourage rolling and purposeful reaching.'),
        b('ပခုံး၊ ခါးနှင့် ကိုယ်လုံး ကြွက်သားများ အားကောင်းလာခြင်း။', 'Stronger shoulder, hip and trunk muscles.'),
      ],
      variations: [b('ကလေး မလှိမ့်နိုင်သေးလျှင် ခါးကို ဖြေးညှင်းစွာ လမ်းညွှန်ပေးပါ — အတင်း မလှည့်ပါနှင့်။', 'If she cannot roll yet, guide her hip gently — never force the turn.')],
      lowCost: true,
      offline: true,
      tags: ['motor_activity', 'daily'],
    }),
    'Encouraging rolling and reaching on a firm floor surface at 5–6 months follows CDC milestone checklists, AAP milestone guidance, AAP safe sleep guidance for the fall precautions and the paediatric physical-therapy references in the registry.',
  ),
  kb(
    activity({
      slug: 'mirror_hello',
      title: b('မှန်ထဲက မိတ်ဆွေ', 'Hello in the mirror'),
      summary: b('မှန်ရှေ့တွင် အတူထိုင်၍ မျက်နှာများကို ကြည့်ရင်း ပြုံးပြခြင်း။', 'Sit together at a mirror, look at the faces and smile.'),
      ageGroupKey: '5_6m',
      domains: ['social', 'emotional', 'cognitive'],
      difficulty: 'easy',
      durationMinutes: 5,
      materials: b('နံရံကပ် မှန် သို့မဟုတ် ခိုင်ခံ့သော မှန်တစ်ချပ်။', 'A wall mirror or one firmly fixed mirror.'),
      setup: b('ကလေးကို ရင်ခွင်တွင် ထားပြီး မှန်ရှေ့တွင် ထိုင်ပါ။ မှန်သည် လုံခြုံစွာ တပ်ဆင်ထားရမည်။', 'Hold her on your lap in front of the mirror. The mirror must be securely fixed.'),
      instructions: [
        b('မှန်ထဲရှိ ကလေးမျက်နှာကို ညွှန်ပြပြီး အမည်ခေါ်ပါ။', 'Point to her face in the mirror and say her name.'),
        b('သင်၏ မျက်နှာကို ညွှန်ပြပြီး "အမေ"/"အဖေ" ဟု ပြောပါ။', 'Point to your own face and say "Mummy" or "Daddy".'),
        b('ပြုံးပြပါ၊ လက်ပြပါ — ကလေး၏ တုံ့ပြန်မှုကို စောင့်ကြည့်ပါ။', 'Smile and wave, then watch her response.'),
        b('ကလေး မျက်နှာ ပြောင်းလဲမှုကို စကားဖြင့် ပြောပေးပါ ("ပြုံးနေတယ်နော်")။', 'Describe what you see — "you are smiling".'),
        b('ကလေး မျက်နှာလွှဲလျှင် ရပ်ပါ။', 'Stop when she turns away.'),
      ],
      safety: b('မှန်ကို နံရံတွင် ခိုင်ခံ့စွာ တပ်ဆင်ထားပါ — လဲကျပါက ကွဲပြီး ထိခိုက်နိုင်သည်။ ကွဲအက်နေသော မှန်ကို လုံးဝ မသုံးပါနှင့်။ ကလေးကို မှန်ရှေ့တွင် တစ်ယောက်တည်း မထားပါနှင့်။', 'Fix the mirror firmly to the wall — a falling mirror can break and injure. Never use a cracked mirror. Never leave her alone at the mirror.'),
      indoor: true, outdoor: false, oneChild: true, group: true, parentChild: true,
      outcomes: [
        b('မျက်နှာများကို စိတ်ဝင်စားမှုနှင့် လူမှုဆက်ဆံမှုကို အားပေးရန်။', 'Learning objective — to encourage interest in faces and social interaction.'),
        b('ပူးတွဲ အာရုံစိုက်မှုနှင့် ခံစားချက် ဖလှယ်မှု တိုးလာခြင်း။', 'More shared attention and shared feeling.'),
      ],
      variations: [b('မိသားစုဝင် တစ်ဦး ထပ်ဝင်၍ မှန်ထဲတွင် သုံးယောက် အတူကြည့်ပါ။', 'Have another family member join so three faces appear in the mirror.')],
      lowCost: true,
      offline: true,
      tags: ['social_activity', 'weekly'],
    }),
    'Face-to-face mirror play to support social interaction at 5–6 months follows AAP guidance on the power of play, the WHO/UNICEF nurturing care framework and CDC milestone guidance.',
  ),
  kb(
    activity({
      slug: 'board_book_point',
      title: b('ထူထပ်စာအုပ် လက်ညှိုးထိုး ကစားခြင်း', 'Board book pointing'),
      summary: b('ထူထပ်သော ပုံစာအုပ်ကို အတူဖတ်ရင်း ပုံများကို လက်ညှိုးထိုး အမည်ခေါ်ခြင်း။', 'Share a board book, point at the pictures and name them.'),
      ageGroupKey: '5_6m',
      domains: ['language', 'cognitive', 'social'],
      difficulty: 'easy',
      durationMinutes: 5,
      materials: b('စာမျက်နှာထူပြီး ခိုင်ခံ့သော ပုံစာအုပ်တစ်အုပ်။ မရှိလျှင် အိမ်တွင် ပြုလုပ်ထားသော ပုံကတ်များ။', 'One board book, or home-made picture cards.'),
      setup: b('ကလေးကို ရင်ခွင်တွင် ထားပါ။ အလင်းရောင် လုံလောက်သော နေရာ ရွေးပါ။', 'Hold her on your lap in good light.'),
      instructions: [
        b('စာမျက်နှာ တစ်မျက်နှာကို ဖွင့်ပါ။', 'Open one page.'),
        b('ပုံကို လက်ညှိုးထိုး၍ အမည်ခေါ်ပါ ("ကြက်"၊ "ခွေး")။', 'Point at a picture and name it — "chicken", "dog".'),
        b('ကလေး ကြည့်သည်ကို စောင့်ပြီး ထပ်ခေါ်ပါ။', 'Wait until she looks, then say it again.'),
        b('ကလေး စာအုပ်ကို ကိုင်ချင်လျှင် ကိုင်ခွင့် ပေးပါ — ပါးစပ်ထဲ ထည့်လျှင်လည်း ရပါသည်။', 'Let her hold the book if she wants — mouthing it is fine.'),
        b('စာမျက်နှာ ၂–၃ မျက်နှာဖြင့် ရပ်ပါ — အားလုံး မဖတ်ရန် မလိုပါ။', 'Two or three pages is plenty — you do not have to finish the book.'),
      ],
      safety: b('စာမျက်နှာထူပြီး ခိုင်ခံ့သော စာအုပ်ကိုသာ သုံးပါ။ စက္ကူပါးကို ဆုတ်ဖြဲပြီး မျိုချမိနိုင်သည်။ စာအုပ်အနားများ ချွန်ထက်ခြင်းရှိမရှိ စစ်ဆေးပြီး သန့်ရှင်းစွာ ထားပါ။ ဤအရွယ်တွင် ပုံစာအုပ်အစား ဖုန်း သို့မဟုတ် တက်ဘလက်ကို အသုံးမပြုရန် အကြံပြုထားသည်။', 'Use thick board books only — thin paper can be torn and swallowed. Check for sharp edges and keep the book clean. A screen book is not recommended at this age.'),
      indoor: true, outdoor: true, oneChild: true, group: true, parentChild: true,
      outcomes: [
        b('ဝေါဟာရ နားလည်မှုနှင့် ပူးတွဲ အာရုံစိုက်မှုကို အားပေးရန်။', 'Learning objective — to build early vocabulary understanding and shared attention.'),
        b('စာအုပ်နှင့် ရင်းနှီးမှု၊ နေ့စဉ် ဖတ်ရှုသည့် အလေ့အထ စတင်ခြင်း။', 'Familiarity with books and the start of a daily reading habit.'),
      ],
      variations: [b('စာအုပ် မရှိလျှင် မဂ္ဂဇင်းပုံများကို ဖြတ်၍ ထူထပ်သော စက္ကူပေါ် ကပ်ပါ။', 'With no book, cut magazine pictures and paste them on thick card.')],
      lowCost: true,
      offline: true,
      tags: ['reading_activity', 'daily'],
    }),
    'Shared book reading from infancy is supported by AAP literacy guidance, Health Canada early literacy guidance, NHS learn-to-talk advice and the shared book-reading research in the registry.',
  ),
  kb(
    activity({
      slug: 'clap_and_sing_5_6m',
      title: b('လက်ခုပ်တီး၍ သီချင်းဆိုခြင်း', 'Clap and sing'),
      summary: b('မြန်မာ ကလေးသီချင်း တစ်ပုဒ်ကို လက်ခုပ်သံဖြင့် ထပ်ခါထပ်ခါ ဆိုပြခြင်း။', 'Sing one Myanmar rhyme with a simple clapping beat, again and again.'),
      ageGroupKey: '5_6m',
      domains: ['speech', 'social', 'play'],
      difficulty: 'easy',
      durationMinutes: 5,
      materials: b('မလိုအပ်ပါ — သင်၏ အသံနှင့် လက်နှစ်ဖက်သာ။', 'None — just your voice and your hands.'),
      setup: b('ကလေးကို ရင်ခွင်တွင် ထားပါ သို့မဟုတ် အခင်းပေါ်တွင် မျက်နှာချင်းဆိုင် ထားပါ။', 'Hold her on your lap, or sit face to face on a mat.'),
      instructions: [
        b('မြန်မာ ကလေးသီချင်း တစ်ပုဒ်ကို ရွေးပါ။', 'Choose one Myanmar children’s song.'),
        b('ဖြည်းညှင်းစွာ ဆိုရင်း လက်ခုပ်ကို အသာအယာ တီးပါ။', 'Sing it slowly and clap softly on the beat.'),
        b('ကလေး၏ လက်ကို ဖြေးညှင်းစွာ ကိုင်၍ တီးပေးပါ — အတင်း မဆွဲပါနှင့်။', 'Gently hold her hands and clap with her — never pull.'),
        b('တစ်ပုဒ်တည်းကို ရက်အနည်းငယ် ထပ်ခါထပ်ခါ ဆိုပါ — ထပ်ခြင်းက သင်ယူမှုကို ကူညီသည်။', 'Sing the same song for several days — repetition helps her learn.'),
        b('သီချင်း ဆုံးလျှင် ခေတ္တ ရပ်၍ ကလေး တုံ့ပြန်မှုကို စောင့်ပါ။', 'Pause at the end and wait for her response.'),
      ],
      safety: b('အသံ ကျယ်လောင်စွာ မဆိုပါနှင့်။ ကလေး၏ လက်၊ လက်မောင်းကို အတင်း မဆွဲပါနှင့်။ ကလေးကို လေထဲ မပစ်တင်ပါနှင့်၊ ဘယ်တော့မျှ မလှုပ်ခါပါနှင့်။ ကလေး မောပုံရလျှင် ရပ်ပါ။', 'Keep your voice soft. Never pull her hands or arms. Never toss her in the air, and never shake a baby. Stop when she looks tired.'),
      indoor: true, outdoor: true, oneChild: true, group: true, parentChild: true,
      outcomes: [
        b('အသံ၊ စည်းချက်နှင့် ဘာသာစကား ရင်းနှီးမှုကို တိုးပွားစေရန်။', 'Learning objective — to build familiarity with sound, rhythm and language.'),
        b('မိဘနှင့် ကလေးကြား ဆက်နွယ်မှု ခိုင်မာလာခြင်း၊ အနားယူရန် ကူညီခြင်း။', 'A stronger parent–child bond and an aid to settling.'),
      ],
      variations: [b('ညနေပိုင်းတွင် ဖြည်းညှင်းစွာ ဆို၍ အိပ်ရာဝင် အစီအစဉ်၏ တစ်စိတ်တစ်ပိုင်း ဖြစ်စေပါ။', 'Sing it slowly in the evening as part of the bedtime routine.')],
      lowCost: true,
      offline: true,
      tags: ['music_activity', 'daily'],
    }),
    'Singing and rhythmic play with infants is supported by the WHO Care for Child Development counselling materials and AAP guidance on the power of play; using a calm song within a bedtime routine follows the sleep-intervention trials in the registry.',
  ),
  kb(
    activity({
      slug: 'safe_touch_basket',
      title: b('ဘေးကင်း အထိအတွေ့ ခြင်းတောင်း', 'Safe touch basket'),
      summary: b('အထိအတွေ့ ကွဲပြားသော ဘေးကင်းပစ္စည်းများကို တစ်ခုချင်း ကိုင်တွယ် လေ့လာစေခြင်း။', 'Let your baby explore a few safe objects with different textures, one at a time.'),
      ageGroupKey: '5_6m',
      domains: ['fine_motor', 'cognitive', 'play'],
      difficulty: 'easy',
      durationMinutes: 10,
      materials: b('ခြင်းတောင်း တစ်လုံးနှင့် ကလေးပါးစပ်ထက် ကြီးသော ပစ္စည်း ၃–၄ ခု (အဝတ်စ၊ သစ်သားဇွန်း၊ ပလတ်စတစ်ခွက်)။', 'A basket and three or four objects larger than her mouth — a cloth, a wooden spoon, a plastic cup.'),
      setup: b('ပစ္စည်းများကို ရေနွေးဖြင့် ဆေးပါ။ ကလေးကို အခင်းပေါ်တွင် ထားပါ။', 'Wash the objects in hot water. Put her on a mat.'),
      instructions: [
        b('ပစ္စည်း တစ်ခုကို ရွေး၍ ကလေးလက်ထဲ ဖြေးညှင်းစွာ ထည့်ပေးပါ။', 'Choose one object and place it gently in her hand.'),
        b('ပစ္စည်း၏ အမည်နှင့် အထိအတွေ့ကို ပြောပြပါ ("နူးနူးလေးနော်")။', 'Name the object and the feel — "this is soft".'),
        b('ကလေး ကိုင်တွယ်၊ ပါးစပ်ထဲ ထည့်၊ ချလိုက်သည်ကို စောင့်ကြည့်ပါ။', 'Watch her hold it, mouth it and drop it.'),
        b('စိတ်ဝင်စားမှု လျော့သွားလျှင် နောက်တစ်ခု ကမ်းပေးပါ။', 'When interest fades, offer the next one.'),
        b('တစ်ကြိမ်လျှင် ပစ္စည်း ၃–၄ ခုထက် မပိုပါစေနှင့်။', 'Keep to three or four objects per session.'),
      ],
      safety: b('ပစ္စည်းတိုင်းသည် ကလေးပါးစပ်ထက် ကြီးရမည် — အသေးစား ပစ္စည်း၊ အကြွေစေ့၊ ခလုတ်၊ အစေ့၊ ဘက်ထရီ လုံးဝ မထည့်ပါနှင့်။ ကြိုးရှည်၊ ပလတ်စတစ်အိတ် မထည့်ပါနှင့်။ အနား ချွန်ထက်ခြင်း၊ အက်ကွဲခြင်း ရှိ/မရှိ တစ်ခုချင်း စစ်ပါ။ ကလေး ကစားနေစဉ် တစ်စက္ကန့်မျှ မခွာပါနှင့်။', 'Every object must be larger than her mouth — no small items, coins, buttons, seeds or batteries. No long cords or plastic bags. Check each item for sharp edges or cracks. Never step away while she plays.'),
      indoor: true, outdoor: false, oneChild: true, group: false, parentChild: true,
      outcomes: [
        b('အထိအတွေ့ ကွဲပြားမှုကို လေ့လာစေပြီး ကိုင်တွယ်မှု စွမ်းရည် တိုးစေရန်။', 'Learning objective — to explore different textures and build grasp and handling skills.'),
        b('အာရုံစိုက်နိုင်စွမ်းနှင့် ဝေါဟာရ တိုးပွားလာခြင်း။', 'Longer concentration and growing vocabulary.'),
      ],
      variations: [b('တစ်ပတ်လျှင် ပစ္စည်း တစ်ခု လဲပေးပါ — အသစ်က စိတ်ဝင်စားမှုကို ပြန်နှိုးသည်။', 'Swap one object each week — novelty renews her interest.')],
      lowCost: true,
      offline: true,
      tags: ['sensory_activity', 'weekly'],
    }),
    'Texture exploration and mouthing as safe sensory learning at 5–6 months follows the paediatric occupational-therapy references in the registry, the WHO Care for Child Development counselling materials and AAP guidance on the power of play; the choking precautions follow AAP safe sleep and infant-safety guidance.',
  ),
];

const PRINTABLES: SeedItem[] = [
  kb(
    printable({
      key: 'checklist_5_6m',
      title: b('၅ – ၆ လ — မိဘအတွက် စောင့်ကြည့်ရန် စာရင်း', '5–6 months — Parent observation checklist'),
      description: b(
        'ဤစာရွက်သည် ရောဂါ ဖော်ထုတ်သည့် စစ်ဆေးမှု မဟုတ်ပါ။ ကလေး၏ ဖွံ့ဖြိုးမှုကို စောင့်ကြည့်ရန်နှင့် ကျန်းမာရေးဝန်ထမ်းနှင့် တွေ့ဆုံစဉ် ပြောဆိုရန် အထောက်အကူ ဖြစ်စေရန်သာ ဖြစ်သည်။ ကလေးတိုင်း အချိန်တူ မဟုတ်ကြောင်း သတိရပါ။ စာရင်းတွင် ပါဝင်သည်များ — လှိမ့်ခြင်း၊ ထောက်ပံ့ဖြင့် ထိုင်ခြင်း၊ ပစ္စည်း လှမ်းယူခြင်းနှင့် လက်လွှဲပြောင်းခြင်း၊ ဗျည်းသံ ထွက်ခြင်း၊ အမည်ခေါ်လျှင် လှည့်ကြည့်ခြင်း၊ အသိမျက်နှာ ခွဲခြားခြင်း၊ ကျသွားသော ပစ္စည်းကို ရှာခြင်း၊ အစားအစာ စတင်ရန် အသင့်ဖြစ်မှု လက္ခဏာ ၃ ချက်၊ အိပ်စက်မှု ပုံစံ၊ ဘေးကင်းရေး စစ်ဆေးချက် (ပက်လက်အိပ်ခြင်း၊ လိမ့်ကျမှု၊ လည်ချောင်းပိတ်၊ ရေနစ်၊ မီးလောင်)၊ ချက်ချင်း ဆေးကုသမှု လိုအပ်သော လက္ခဏာများနှင့် ကာကွယ်ဆေး မှတ်တမ်း။',
        'This sheet is not a screening or diagnostic test. It is only to help you watch your baby’s development and to talk with a health worker. Remember that babies vary. It covers rolling, supported sitting, reaching and hand-to-hand transfer, consonant babble, turning to her name, telling familiar people from strangers, looking for a dropped object, the three readiness signs for first foods, the sleep pattern, a safety check (back to sleep, falls, choking, drowning, burns), the signs that need urgent care, and a place to note immunisations.',
      ),
      format: 'A4 PDF',
    }),
    'The observation items follow CDC milestone checklists and AAP milestone guidance; the feeding-readiness items follow the WHO infant and young child feeding model chapter; the safe sleep items follow AAP safe sleep guidance; the review timing follows NHS guidance on baby health reviews.',
  ),
];

export const M5_6M: SeedItem[] = [
  ...MILESTONES,
  ...GUIDES,
  ...GUIDES_B,
  ...GUIDES_C,
  ...GUIDES_D,
  ...GUIDES_E,
  ...ACTIVITIES,
  ...PRINTABLES,
];
