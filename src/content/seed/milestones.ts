// Developmental milestones — general, widely-accepted guidance written in simple
// language. Every item is clinical_review until approved. These describe typical
// emerging skills; they are NOT a pass/fail test and never diagnose. Ranges vary
// widely between healthy children.
import { milestone, type SeedItem } from '../types';

const m = milestone;

export const MILESTONES: SeedItem[] = [
  // ---- Birth–2 months ----
  m('birth_2m', 'gross_motor', 1, {
    title: { mm: 'မှောက်အိပ်စဉ် ခေါင်းမော့ခြင်း', en: 'Lifts head during tummy time' },
    observe: { mm: 'မှောက်ချထားစဉ် ခေါင်းကို ခဏတာ မော့နိုင်ပါသလား။', en: 'Briefly lifts head when on tummy?' },
    why: { mm: 'လည်ပင်းကြွက်သား ခိုင်မာမှုသည် နောင်ထိုင်ခြင်း၊ တွားခြင်းအတွက် အခြေခံဖြစ်သည်။', en: 'Neck strength is the base for later sitting and crawling.' },
    encouragement: { mm: 'နေ့စဉ် မှောက်လျက် ကစားချိန် အနည်းငယ်စီ ပေးပါ။', en: 'Offer short tummy-time moments each day.' },
  }),
  m('birth_2m', 'social', 1, {
    title: { mm: 'မျက်လုံးချင်းဆုံ ကြည့်ခြင်း', en: 'Makes eye contact' },
    observe: { mm: 'သင့်မျက်နှာကို ကြည့်ပြီး မျက်လုံးချင်း ဆုံပါသလား။', en: 'Looks at your face and meets your eyes?' },
    why: { mm: 'မျက်လုံးချင်းဆုံခြင်းသည် ဆက်သွယ်မှု၏ ပထမဆုံး အခြေခံဖြစ်သည်။', en: 'Eye contact is the first foundation of connection.' },
  }),
  m('birth_2m', 'communication', 1, {
    title: { mm: 'အသံကြားလျှင် တုံ့ပြန်ခြင်း', en: 'Responds to sound' },
    observe: { mm: 'ကျယ်သောအသံကြားပါက လှုပ်ရှား သို့မဟုတ် ငြိမ်သွားပါသလား။', en: 'Startles or quiets to a loud sound?' },
    why: { mm: 'အသံကို တုံ့ပြန်ခြင်းသည် အကြားအာရုံ ကောင်းမွန်ကြောင်း ညွှန်ပြသည်။', en: 'Reacting to sound shows hearing is working.' },
    red: { mm: 'အသံကျယ်များကို လုံးဝ မတုံ့ပြန်ပါက ကျန်းမာရေးဝန်ထမ်းနှင့် တိုင်ပင်ပါ။', en: 'If never reacts to loud sounds, talk to a health worker.' },
  }),
  m('birth_2m', 'social', 2, {
    title: { mm: 'ပြုံးပြခြင်း (လူမှုပြုံး)', en: 'Social smile' },
    observe: { mm: 'သင်ပြုံးပြပါက ပြန်ပြုံးပါသလား။', en: 'Smiles back when you smile?' },
    why: { mm: 'လူမှုပြုံးသည် ခံစားမှုနှင့် ဆက်ဆံမှု ဖွံ့ဖြိုးလာခြင်း သင်္ကေတဖြစ်သည်။', en: 'The social smile signals emerging connection.' },
  }),

  // ---- 3–4 months ----
  m('3_4m', 'gross_motor', 1, {
    title: { mm: 'ခေါင်းကို တည်ငြိမ်စွာ ထိန်းခြင်း', en: 'Holds head steady' },
    observe: { mm: 'ထောင်ချီထားစဉ် ခေါင်းကို တည်ငြိမ်စွာ ထိန်းနိုင်ပါသလား။', en: 'Holds head steady when held upright?' },
    why: { mm: 'ခေါင်းထိန်းနိုင်ခြင်းသည် ထိုင်ခြင်းဆီသို့ ဦးတည်စေသည်။', en: 'Head control leads toward sitting.' },
  }),
  m('3_4m', 'fine_motor', 1, {
    title: { mm: 'လက်များကို ဆုံစည်းခြင်း', en: 'Brings hands together' },
    observe: { mm: 'လက်နှစ်ဖက်ကို အလယ်တွင် ဆုံစည်းပါသလား။', en: 'Brings both hands together at the middle?' },
    why: { mm: 'လက်နှစ်ဖက် ပူးတွဲသုံးခြင်းသည် ကိုင်တွယ်မှု ဖွံ့ဖြိုးမှု၏ အစဖြစ်သည်။', en: 'Using two hands together starts grasping skills.' },
  }),
  m('3_4m', 'communication', 1, {
    title: { mm: 'အသံထွက်၍ ကစားခြင်း (ကူးဝဲ)', en: 'Coos and makes sounds' },
    observe: { mm: '“အူး” “အာ” ကဲ့သို့ အသံများ ထုတ်ပါသလား။', en: 'Makes cooing sounds like “ooh”, “aah”?' },
    why: { mm: 'ဤအသံများသည် စကားပြောရန် လေ့ကျင့်ခြင်းဖြစ်သည်။', en: 'These sounds are early speech practice.' },
  }),
  m('3_4m', 'emotional', 1, {
    title: { mm: 'ပျော်ရွှင်မှု ဖော်ပြခြင်း', en: 'Shows joy' },
    observe: { mm: 'ရင်းနှီးသူများကို မြင်ရပါက ပျော်ရွှင်ဟန် ပြပါသလား။', en: 'Shows delight seeing familiar people?' },
    why: { mm: 'ခံစားမှု ဖော်ပြခြင်းသည် လူမှုချိတ်ဆက်မှုကို အားပေးသည်။', en: 'Expressing feelings strengthens bonding.' },
  }),

  // ---- 5–6 months ----
  m('5_6m', 'gross_motor', 1, {
    title: { mm: 'တစ်ဘက်မှ တစ်ဘက်သို့ လှိမ့်ခြင်း', en: 'Rolls over' },
    observe: { mm: 'ကျောမှ ဗိုက်ဘက်သို့ သို့မဟုတ် ပြန်၍ လှိမ့်နိုင်ပါသလား။', en: 'Rolls from back to tummy or the reverse?' },
    why: { mm: 'လှိမ့်ခြင်းသည် ခန္ဓာကိုယ် ထိန်းချုပ်မှု တိုးတက်ကြောင်း ပြသည်။', en: 'Rolling shows growing body control.' },
  }),
  m('5_6m', 'speech', 1, {
    title: { mm: 'ဗျည်းသံများ တွဲရွတ်ခြင်း', en: 'Babbles with consonants' },
    observe: { mm: '“ဘ” “မ” “ဒ” ကဲ့သို့ အသံများ ထုတ်ပါသလား။', en: 'Makes sounds like “ba”, “ma”, “da”?' },
    why: { mm: 'ဗျည်းသံ တွဲရွတ်ခြင်းသည် ပထမဆုံးစကားလုံးများ၏ အခြေခံဖြစ်သည်။', en: 'Consonant babbling is the base for first words.' },
  }),
  m('5_6m', 'cognitive', 1, {
    title: { mm: 'ပစ္စည်းများကို လက်လှမ်း၍ ကိုင်ခြင်း', en: 'Reaches for objects' },
    observe: { mm: 'အနီးက ကစားစရာကို လက်လှမ်း၍ ဆွဲကိုင်ပါသလား။', en: 'Reaches and grabs a nearby toy?' },
    why: { mm: 'လက်လှမ်းခြင်းသည် မျက်စိနှင့် လက် ပေါင်းစပ်မှုကို လေ့ကျင့်စေသည်။', en: 'Reaching builds eye–hand coordination.' },
  }),
  m('5_6m', 'play', 1, {
    title: { mm: 'ကစားစရာများကို နှုတ်ခမ်းဖြင့် စူးစမ်းခြင်း', en: 'Explores toys by mouthing' },
    observe: { mm: 'ကစားစရာများကို ကိုင်ပြီး ပါးစပ်သို့ ယူပါသလား။', en: 'Brings toys to the mouth to explore?' },
    why: { mm: 'ဤသည်မှာ ပုံမှန်စူးစမ်းမှုဖြစ်၍ ဘေးကင်းသော ပစ္စည်းများသာ ပေးပါ။', en: 'Mouthing is normal exploring — offer only safe objects.' },
  }),

  // ---- 7–9 months ----
  m('7_9m', 'gross_motor', 1, {
    title: { mm: 'အထောက်မပါဘဲ ထိုင်ခြင်း', en: 'Sits without support' },
    observe: { mm: 'ခဏတာ တစ်ယောက်တည်း ထိုင်နိုင်ပါသလား။', en: 'Sits alone for a short while?' },
    why: { mm: 'တည်ငြိမ်စွာ ထိုင်ခြင်းသည် လက်နှစ်ဖက်ဖြင့် ကစားရန် လွတ်လပ်စေသည်။', en: 'Steady sitting frees both hands to play.' },
  }),
  m('7_9m', 'fine_motor', 1, {
    title: { mm: 'ပစ္စည်းကို လက်တစ်ဖက်မှ တစ်ဖက်သို့ ကူးခြင်း', en: 'Passes objects hand to hand' },
    observe: { mm: 'ကစားစရာကို လက်တစ်ဖက်မှ အခြားတစ်ဖက်သို့ ကူးပါသလား။', en: 'Moves a toy from one hand to the other?' },
    why: { mm: 'ဤသည်မှာ ပိုမိုတိကျသော ကိုင်တွယ်မှုကို လေ့ကျင့်စေသည်။', en: 'This practices more precise handling.' },
  }),
  m('7_9m', 'language', 1, {
    title: { mm: 'မိမိနာမည်ကို တုံ့ပြန်ခြင်း', en: 'Responds to own name' },
    observe: { mm: 'နာမည်ခေါ်ပါက လှည့်ကြည့်ပါသလား။', en: 'Turns when you call their name?' },
    why: { mm: 'နာမည်ကို မှတ်မိခြင်းသည် ဘာသာစကား နားလည်မှု၏ အစဖြစ်သည်။', en: 'Knowing their name starts language understanding.' },
    red: { mm: '၉ လတွင် အသံ/နာမည်ကို လုံးဝ မတုံ့ပြန်ပါက ကျန်းမာရေးဝန်ထမ်းနှင့် တိုင်ပင်ပါ။', en: 'No response to name/sound by 9 months — consult a health worker.' },
  }),
  m('7_9m', 'social', 1, {
    title: { mm: 'ရင်းနှီးသူ/မရင်းနှီးသူ ခွဲခြားခြင်း', en: 'Knows familiar people' },
    observe: { mm: 'ရင်းနှီးသူနှင့် အစိမ်းလူကို ကွဲပြားစွာ တုံ့ပြန်ပါသလား။', en: 'Reacts differently to familiar vs. new people?' },
    why: { mm: 'ဤသည်မှာ လူမှုမှတ်ဉာဏ် ဖွံ့ဖြိုးလာခြင်း ဖြစ်သည်။', en: 'This shows growing social memory.' },
  }),

  // ---- 10–12 months ----
  m('10_12m', 'gross_motor', 1, {
    title: { mm: 'ပရိဘောဂကိုကိုင်၍ မတ်တပ်ရပ်ခြင်း', en: 'Pulls up to stand' },
    observe: { mm: 'ပရိဘောဂကိုကိုင်ပြီး မတ်တပ်ရပ်ပါသလား။', en: 'Pulls up to stand holding furniture?' },
    why: { mm: 'ဤသည်မှာ လမ်းလျှောက်ခြင်းဆီသို့ ဦးတည်စေသည်။', en: 'This leads toward walking.' },
  }),
  m('10_12m', 'communication', 1, {
    title: { mm: 'လက်ညှိုးထိုး၍ ပြသခြင်း', en: 'Points to show' },
    observe: { mm: 'အလိုရှိသည်ကို လက်ညှိုးထိုး၍ ပြသပါသလား။', en: 'Points at things they want or notice?' },
    why: { mm: 'လက်ညှိုးထိုးခြင်းသည် အင်အားကြီးသော ဆက်သွယ်မှုဖြစ်သည်။', en: 'Pointing is powerful early communication.' },
  }),
  m('10_12m', 'problem_solving', 1, {
    title: { mm: 'ဖုံးထားသော ပစ္စည်းကို ရှာဖွေခြင်း', en: 'Looks for hidden objects' },
    observe: { mm: 'အုပ်ဖုံးထားသော ကစားစရာကို ရှာဖွေပါသလား။', en: 'Searches for a toy you hid under a cloth?' },
    why: { mm: 'ဤသည်မှာ “မမြင်ရလည်း ရှိနေသည်” ကို နားလည်ခြင်းဖြစ်သည်။', en: 'This is understanding that things still exist unseen.' },
  }),
  m('10_12m', 'self_help', 1, {
    title: { mm: 'လက်ဖြင့် ကိုယ်တိုင်စားခြင်း', en: 'Finger-feeds self' },
    observe: { mm: 'ငယ်စိတ်စိတ် အစားအစာများကို လက်ဖြင့် စားပါသလား။', en: 'Picks up small soft foods to eat?' },
    why: { mm: 'ကိုယ်တိုင်စားခြင်းသည် လွတ်လပ်မှုနှင့် လက်ကျွမ်းကျင်မှုကို လေ့ကျင့်စေသည်။', en: 'Self-feeding builds independence and hand skill.' },
  }),

  // ---- 13–18 months ----
  m('13_18m', 'gross_motor', 1, {
    title: { mm: 'တစ်ယောက်တည်း လမ်းလျှောက်ခြင်း', en: 'Walks alone' },
    observe: { mm: 'အထောက်မပါဘဲ လှမ်းအနည်းငယ် လျှောက်နိုင်ပါသလား။', en: 'Takes steps without holding on?' },
    why: { mm: 'လမ်းလျှောက်ခြင်းသည် စူးစမ်းမှု နယ်ပယ်ကို ကျယ်စေသည်။', en: 'Walking widens the world to explore.' },
  }),
  m('13_18m', 'speech', 1, {
    title: { mm: 'အဓိပ္ပာယ်ရှိသော စကားလုံး အနည်းငယ် ပြောခြင်း', en: 'Says a few words' },
    observe: { mm: '“မေမေ” “ဖေဖေ” အပြင် စကားလုံး ၂–၃ လုံး ပြောပါသလား။', en: 'Uses a few words beyond mama/dada?' },
    why: { mm: 'ပထမစကားလုံးများသည် ဘာသာစကား တိုးတက်မှုကို ဖော်ပြသည်။', en: 'First words mark growing language.' },
  }),
  m('13_18m', 'language', 1, {
    title: { mm: 'ရိုးရှင်းသော ညွှန်ကြားချက်ကို လိုက်နာခြင်း', en: 'Follows simple directions' },
    observe: { mm: '“ဒါလေးပေးပါ” ဆိုလျှင် ပေးပါသလား။', en: 'Follows “give me the ball”?' },
    why: { mm: 'ဤသည်မှာ စကားနားလည်မှု တိုးတက်ခြင်းဖြစ်သည်။', en: 'This shows understanding is growing.' },
  }),
  m('13_18m', 'self_help', 1, {
    title: { mm: 'ဇွန်း/ခွက်ကို ကြိုးစားသုံးခြင်း', en: 'Tries spoon and cup' },
    observe: { mm: 'ဇွန်း သို့မဟုတ် ခွက်ကို ကိုယ်တိုင် သုံးရန် ကြိုးစားပါသလား။', en: 'Tries to use a spoon or cup?' },
    why: { mm: 'သန့်ရှင်းမှု အနည်းငယ် ကျန်လည်း ကြိုးစားခြင်းက အရေးကြီးသည်။', en: 'Some mess is fine — trying is what matters.' },
  }),

  // ---- 19–24 months ----
  m('19_24m', 'language', 1, {
    title: { mm: 'စကားလုံး နှစ်လုံး ပေါင်းပြောခြင်း', en: 'Puts two words together' },
    observe: { mm: '“ရေ သောက်” ကဲ့သို့ နှစ်လုံးတွဲ ပြောပါသလား။', en: 'Says two-word phrases like “want milk”?' },
    why: { mm: 'ဤသည်မှာ ဝါကျ တည်ဆောက်မှု၏ အစဖြစ်သည်။', en: 'This is the start of building sentences.' },
  }),
  m('19_24m', 'cognitive', 1, {
    title: { mm: 'ခန္ဓာကိုယ် အစိတ်အပိုင်း ညွှန်ပြခြင်း', en: 'Points to body parts' },
    observe: { mm: '“နှာခေါင်း ဘယ်မှာလဲ” ဆိုလျှင် ညွှန်ပြပါသလား။', en: 'Points to nose/eyes when asked?' },
    why: { mm: 'ဤသည်မှာ စကားလုံးများကို အရာဝတ္ထုနှင့် ချိတ်ဆက်ခြင်းဖြစ်သည်။', en: 'This links words to things.' },
  }),
  m('19_24m', 'emotional', 1, {
    title: { mm: 'အခြားသူများ၏ ခံစားမှုကို သတိပြုခြင်း', en: 'Notices others’ feelings' },
    observe: { mm: 'တစ်ယောက်ငိုပါက စိတ်ဝင်စား/စိုးရိမ်ဟန် ပြပါသလား။', en: 'Reacts when someone is upset?' },
    why: { mm: 'ဤသည်မှာ ကရုဏာ (empathy) ၏ အစဖြစ်သည်။', en: 'This is the beginning of empathy.' },
  }),
  m('19_24m', 'play', 1, {
    title: { mm: 'ဟန်ဆောင်ကစားခြင်း', en: 'Pretend play' },
    observe: { mm: 'အရုပ်ကို ကျွေးသည်ဟန်၊ ဖုန်းပြောသည်ဟန် ကစားပါသလား။', en: 'Pretends to feed a doll or talk on a phone?' },
    why: { mm: 'ဟန်ဆောင်ကစားခြင်းသည် စိတ်ကူးဉာဏ်နှင့် ဘာသာစကားကို ကြီးထွားစေသည်။', en: 'Pretend play grows imagination and language.' },
  }),

  // ---- 2 years ----
  m('2y', 'gross_motor', 1, {
    title: { mm: 'ပြေးခြင်းနှင့် ခုန်ခြင်း', en: 'Runs and jumps' },
    observe: { mm: 'ပြေးနိုင်၍ နေရာတွင် ခုန်နိုင်ပါသလား။', en: 'Runs and jumps in place?' },
    why: { mm: 'ဤသည်မှာ ခြေထောက် ခိုင်မာမှုနှင့် ဟန်ချက်ကို ပြသည်။', en: 'This shows leg strength and balance.' },
  }),
  m('2y', 'speech', 1, {
    title: { mm: 'မိသားစုက နားလည်နိုင်သော စကားပြောခြင်း', en: 'Speech family understands' },
    observe: { mm: 'ကလေးပြောသည့် တစ်ဝက်ခန့်ကို မိသားစုက နားလည်ပါသလား။', en: 'Family understands about half of their speech?' },
    why: { mm: 'ရှင်းလင်းမှု တဖြည်းဖြည်း တိုးလာသည်။', en: 'Clarity grows steadily.' },
  }),
  m('2y', 'problem_solving', 1, {
    title: { mm: 'ရိုးရှင်းသော ပဟေဠိ တပ်ဆင်ခြင်း', en: 'Simple puzzles / shapes' },
    observe: { mm: 'ပုံသဏ္ဌာန်ရိုးရိုးများကို နေရာတကျ ထည့်နိုင်ပါသလား။', en: 'Fits simple shapes into a sorter?' },
    why: { mm: 'ဤသည်မှာ တွေးခေါ်မှုနှင့် ကြိုးစားမှုကို လေ့ကျင့်စေသည်။', en: 'This builds thinking and persistence.' },
  }),
  m('2y', 'daily_routine', 1, {
    title: { mm: 'နေ့စဉ် လုပ်ရိုးလုပ်စဉ်ကို မျှော်လင့်ခြင်း', en: 'Anticipates routines' },
    observe: { mm: 'ရေချိုးချိန်၊ အိပ်ချိန်ကဲ့သို့ အစီအစဉ်ကို သိရှိပါသလား။', en: 'Knows what comes next in daily routines?' },
    why: { mm: 'ပုံမှန် လုပ်ရိုးလုပ်စဉ်သည် ကလေးကို လုံခြုံစိတ်ချစေသည်။', en: 'Predictable routines help children feel secure.' },
  }),

  // ---- 2.5 years ----
  m('2_5y', 'fine_motor', 1, {
    title: { mm: 'ခဲတံကိုင်၍ ခြစ်ရေးခြင်း', en: 'Scribbles with a crayon' },
    observe: { mm: 'ခဲတံ/ခရေယွန်ကို ကိုင်၍ ခြစ်ရေးပါသလား။', en: 'Holds a crayon and scribbles?' },
    why: { mm: 'ဤသည်မှာ နောင်ရေးသားခြင်းအတွက် လက်ကို ပြင်ဆင်ပေးသည်။', en: 'This prepares the hand for later writing.' },
  }),
  m('2_5y', 'language', 1, {
    title: { mm: 'စကားလုံး သုံးလုံး ဝါကျ ပြောခြင်း', en: 'Three-word sentences' },
    observe: { mm: '“မေမေ အိမ် သွား” ကဲ့သို့ ပြောပါသလား။', en: 'Uses short three-word sentences?' },
    why: { mm: 'ဝါကျ ရှည်လာခြင်းသည် ဘာသာစကား ကြွယ်ဝလာခြင်းဖြစ်သည်။', en: 'Longer sentences show richer language.' },
  }),
  m('2_5y', 'emotional', 1, {
    title: { mm: 'စိတ်ခံစားမှုကို စကားဖြင့် ဖော်ပြခြင်း', en: 'Names some feelings' },
    observe: { mm: '“ဝမ်းသာ” “စိတ်ဆိုး” ကဲ့သို့ ခံစားမှုကို ပြောပါသလား။', en: 'Says feelings like happy or angry?' },
    why: { mm: 'ခံစားမှုကို အမည်တပ်ခြင်းက ကိုယ်ကို ထိန်းချုပ်ရန် ကူညီသည်။', en: 'Naming feelings helps self-control.' },
  }),

  // ---- 3 years ----
  m('3y', 'gross_motor', 1, {
    title: { mm: 'ခြေထောက်တစ်ဖက်ဖြင့် ခဏရပ်ခြင်း', en: 'Balances on one foot briefly' },
    observe: { mm: 'ခြေထောက်တစ်ဖက်ဖြင့် စက္ကန့်အနည်းငယ် ရပ်နိုင်ပါသလား။', en: 'Stands on one foot for a second or two?' },
    why: { mm: 'ဟန်ချက်သည် ပြေးခုန်ခြင်းများကို ပိုမိုကောင်းစေသည်။', en: 'Balance improves running and climbing.' },
  }),
  m('3y', 'cognitive', 1, {
    title: { mm: 'အရောင်/အရေအတွက် အနည်းငယ် သိရှိခြင်း', en: 'Knows some colors / counting' },
    observe: { mm: 'အရောင် အနည်းငယ်ကို အမည်တပ်၍ “၃” အထိ ရေတွက်ပါသလား။', en: 'Names a few colors and counts to three?' },
    why: { mm: 'ဤသည်မှာ အခြေခံ သင်ယူမှု စွမ်းရည်ကို ပြသည်။', en: 'This shows early learning skills.' },
  }),
  m('3y', 'social', 1, {
    title: { mm: 'အခြားကလေးများနှင့် အတူ ကစားခြင်း', en: 'Plays with other children' },
    observe: { mm: 'အခြားကလေးများနှင့် ဝေမျှ၍ ကစားရန် ကြိုးစားပါသလား။', en: 'Tries to play and share with other children?' },
    why: { mm: 'အတူကစားခြင်းသည် လူမှုကျွမ်းကျင်မှုကို လေ့ကျင့်စေသည်။', en: 'Playing together builds social skills.' },
  }),
  m('3y', 'school_readiness', 1, {
    title: { mm: 'မိဘနှင့် ခွဲ၍ ခဏနေနိုင်ခြင်း', en: 'Separates from parent briefly' },
    observe: { mm: 'ရင်းနှီးသူနှင့် ခဏခွဲနေရသည်ကို လက်ခံနိုင်ပါသလား။', en: 'Copes with brief separation from a caregiver?' },
    why: { mm: 'ဤသည်မှာ ကျောင်း/မူကြိုအတွက် အသင့်ဖြစ်မှု အစိတ်အပိုင်းဖြစ်သည်။', en: 'This is part of readiness for preschool.' },
  }),

  // ---- 3.5 years ----
  m('3_5y', 'fine_motor', 1, {
    title: { mm: 'စက်ဝိုင်း/မျဉ်း ကူးရေးခြင်း', en: 'Copies a circle / line' },
    observe: { mm: 'စက်ဝိုင်း သို့မဟုတ် မျဉ်းကို ကူးဆွဲပါသလား။', en: 'Copies a circle or straight line?' },
    why: { mm: 'ဤသည်မှာ ရေးသားမှုနှင့် တိကျမှုကို လေ့ကျင့်စေသည်။', en: 'This builds pre-writing control.' },
  }),
  m('3_5y', 'communication', 1, {
    title: { mm: '“ဘာကြောင့်” မေးခွန်းများ မေးခြင်း', en: 'Asks “why” questions' },
    observe: { mm: '“ဘာကြောင့်” “ဘယ်လို” မေးခွန်းများ မေးပါသလား။', en: 'Asks lots of why/how questions?' },
    why: { mm: 'မေးခွန်းများသည် သိလိုစိတ်နှင့် ဘာသာစကား တိုးတက်မှုကို ပြသည်။', en: 'Questions show curiosity and language growth.' },
  }),
  m('3_5y', 'school_readiness', 1, {
    title: { mm: 'ရိုးရှင်းသော စည်းကမ်းများ လိုက်နာခြင်း', en: 'Follows simple group rules' },
    observe: { mm: 'အလှည့်စောင့်ခြင်းကဲ့သို့ ရိုးရှင်းစည်းကမ်းများ လိုက်နာပါသလား။', en: 'Takes turns and follows simple rules?' },
    why: { mm: 'ဤသည်မှာ အုပ်စုဖြင့် သင်ယူရန် ပြင်ဆင်ပေးသည်။', en: 'This prepares for learning in a group.' },
  }),

  // ---- 4 years ----
  m('4y', 'gross_motor', 1, {
    title: { mm: 'ခုန်ခြင်း၊ ခြေထောက်တစ်ဖက်ဖြင့် ခုန်ခြင်း', en: 'Hops and skips' },
    observe: { mm: 'ခြေထောက်တစ်ဖက်ဖြင့် ခုန်နိုင်ပါသလား။', en: 'Hops on one foot?' },
    why: { mm: 'ဤသည်မှာ ခွန်အားနှင့် ဟန်ချက် တိုးတက်ခြင်းဖြစ်သည်။', en: 'This shows growing strength and balance.' },
  }),
  m('4y', 'language', 1, {
    title: { mm: 'ဇာတ်လမ်း/ဖြစ်ရပ်ကို ပြန်ပြောခြင်း', en: 'Tells a short story' },
    observe: { mm: 'ဖြစ်ခဲ့သည့် ဖြစ်ရပ်ကို အစီအစဉ်တကျ ပြန်ပြောပါသလား။', en: 'Retells a simple event in order?' },
    why: { mm: 'ဤသည်မှာ အတွေးများကို စီစဉ်နိုင်ခြင်းဖြစ်သည်။', en: 'This shows organizing thoughts in sequence.' },
  }),
  m('4y', 'problem_solving', 1, {
    title: { mm: 'ရိုးရှင်းသော ပြဿနာများ ဖြေရှင်းခြင်း', en: 'Solves simple problems' },
    observe: { mm: 'မလှမ်းမီပစ္စည်းယူရန် ခုံတင်ကဲ့သို့ နည်းလမ်းရှာပါသလား။', en: 'Finds a way to reach something out of grasp?' },
    why: { mm: 'ဤသည်မှာ တွေးခေါ်၍ စီစဉ်နိုင်ခြင်းကို ပြသည်။', en: 'This shows planning and reasoning.' },
  }),
  m('4y', 'school_readiness', 1, {
    title: { mm: 'မိမိနာမည်ကို မှတ်မိ/ရေးရန် ကြိုးစားခြင်း', en: 'Recognizes / tries to write name' },
    observe: { mm: 'မိမိနာမည် စာလုံးများကို မှတ်မိ/ရေးရန် ကြိုးစားပါသလား။', en: 'Knows some letters of their name?' },
    why: { mm: 'ဤသည်မှာ စာဖတ်/ရေးခြင်း အခြေခံဖြစ်သည်။', en: 'This is early literacy.' },
  }),

  // ---- 4.5 years ----
  m('4_5y', 'fine_motor', 1, {
    title: { mm: 'ကတ်ကြေးဖြင့် ဖြတ်ခြင်း', en: 'Cuts with child scissors' },
    observe: { mm: 'ကလေးကတ်ကြေးဖြင့် စက္ကူကို မျဉ်းအတိုင်း ဖြတ်ပါသလား။', en: 'Cuts along a line with safe scissors?' },
    why: { mm: 'ဤသည်မှာ လက်နှစ်ဖက် ပေါင်းစပ်မှုကို လေ့ကျင့်စေသည်။', en: 'This builds two-hand coordination.' },
  }),
  m('4_5y', 'cognitive', 1, {
    title: { mm: 'အရာဝတ္ထုများကို အမျိုးအစားခွဲခြင်း', en: 'Sorts by category' },
    observe: { mm: 'ပစ္စည်းများကို အရောင်/ပုံသဏ္ဌာန်ဖြင့် ခွဲခြားပါသလား။', en: 'Sorts objects by color or shape?' },
    why: { mm: 'ဤသည်မှာ သင်္ချာနှင့် ယုတ္တိတွေးခေါ်မှု၏ အခြေခံဖြစ်သည်။', en: 'This is the base for math and logic.' },
  }),
  m('4_5y', 'daily_routine', 1, {
    title: { mm: 'ကိုယ်တိုင် ဝတ်စားဆင်ယင်ခြင်း', en: 'Dresses with little help' },
    observe: { mm: 'အင်္ကျီ/ဘောင်းဘီကို အများအားဖြင့် ကိုယ်တိုင် ဝတ်နိုင်ပါသလား။', en: 'Dresses with minimal help?' },
    why: { mm: 'ဤသည်မှာ လွတ်လပ်မှုနှင့် ယုံကြည်မှုကို တည်ဆောက်ပေးသည်။', en: 'This builds independence and confidence.' },
  }),

  // ---- 5 years ----
  m('5y', 'gross_motor', 1, {
    title: { mm: 'ခုန်ကျော်၊ ဟန်ချက်ညီ လှုပ်ရှားခြင်း', en: 'Skips and balances well' },
    observe: { mm: 'ခုန်ကျော်နိုင်၍ ဟန်ချက်ညီစွာ လှုပ်ရှားပါသလား။', en: 'Skips and moves with good balance?' },
    why: { mm: 'ဤသည်မှာ ကစားနှင့် အားကစားအတွက် အသင့်ဖြစ်ခြင်းဖြစ်သည်။', en: 'This supports active play and sport.' },
  }),
  m('5y', 'language', 1, {
    title: { mm: 'ရှင်းလင်းသော ဝါကျ အပြည့်အစုံ ပြောခြင်း', en: 'Speaks in clear full sentences' },
    observe: { mm: 'အစိမ်းလူများ နားလည်နိုင်စွာ ဝါကျ အပြည့်အစုံ ပြောပါသလား။', en: 'Uses clear sentences strangers understand?' },
    why: { mm: 'ဤသည်မှာ ကျောင်းတွင် ဆက်သွယ်ရန် အသင့်ဖြစ်ခြင်းဖြစ်သည်။', en: 'This is readiness to communicate at school.' },
  }),
  m('5y', 'school_readiness', 1, {
    title: { mm: 'အက္ခရာ/ဂဏန်း အများစုကို သိရှိခြင်း', en: 'Knows most letters / numbers' },
    observe: { mm: 'အက္ခရာ/ဂဏန်း အများစုကို မှတ်မိပါသလား။', en: 'Recognizes most letters and numbers?' },
    why: { mm: 'ဤသည်မှာ စာဖတ်ခြင်းနှင့် သင်္ချာ၏ အခြေခံဖြစ်သည်။', en: 'This is the base for reading and math.' },
  }),
  m('5y', 'self_help', 1, {
    title: { mm: 'အိမ်သာ/လက်ဆေးခြင်း ကိုယ်တိုင်လုပ်ခြင်း', en: 'Manages toilet and handwashing' },
    observe: { mm: 'အိမ်သာသုံးပြီး လက်ကို ကိုယ်တိုင် ဆေးနိုင်ပါသလား။', en: 'Uses the toilet and washes hands alone?' },
    why: { mm: 'ဤသည်မှာ ကျန်းမာရေးနှင့် ကျောင်းအတွက် အရေးကြီးသည်။', en: 'This matters for health and school.' },
  }),
];
