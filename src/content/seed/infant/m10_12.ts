// Knowledge base — 10 to 12 months.
//
// Authored against the verified evidence registry (src/evidence/sources.ts)
// and linked explicitly in src/evidence/links.ts. Nothing here diagnoses,
// predicts a disorder or promises an outcome. Age ranges are stated as
// guidance with the normal variation named plainly — in particular, walking
// by 12 months is NOT presented as required, because it is not.
import { activity, guide, milestone, printable, type SeedItem } from '../../types';
import { kb } from './editorial';

const b = (mm: string, en: string) => ({ mm, en });

// --- Milestones ------------------------------------------------------------

const MILESTONES: SeedItem[] = [
  kb(
    milestone('10_12m', 'gross_motor', 2, {
      title: b('မတ်တပ်ဆွဲရပ်ခြင်းနှင့် ကိုင်၍ ဘေးတိုက် လျှောက်ခြင်း', 'Pulling to stand and cruising'),
      observe: b('ကလေးသည် ပရိဘောဂကို ဆွဲ၍ မတ်တပ် ရပ်ပါသလား။ ကိုင်ထားရင်း ဘေးတိုက် လှမ်းပါသလား။', 'Does she pull herself up to stand, and step sideways while holding on?'),
      why: b(
        'များသောအားဖြင့် ၉ လမှ ၁၂ လကြားတွင် ဆွဲ၍ မတ်တပ် ရပ်ခြင်း၊ ထို့နောက် ကိုင်ထားရင်း ဘေးတိုက် လျှောက်ခြင်း ဖြစ်လာသည်။ ခဏ လက်လွှတ် ရပ်နိုင်ခြင်းလည်း ဖြစ်တတ်သည်။ ကလေးတစ်ဦးနှင့်တစ်ဦး ဖွံ့ဖြိုးမှုအချိန် ကွာခြားနိုင်သည် — ကလေးအများစုသည် ၁၂ လမှ ၁၈ လကြားတွင် ကိုယ်တိုင် လျှောက်လာပြီး ၁၂ လတွင် မလျှောက်နိုင်သေးခြင်းသည် ကိုယ်တိုင် ပြဿနာ မဟုတ်ပါ။',
        'Pulling up to stand usually appears between about 9 and 12 months, followed by cruising along furniture, and often a moment of standing alone. Babies differ: most walk independently somewhere between 12 and 18 months, and not walking at 12 months is not in itself a problem.',
      ),
      red: b(
        'လ ၁၂ လအရွယ်တွင် မည်သည့်နည်းဖြင့်မျှ ရွေ့လျားမှု မရှိခြင်း၊ ကိုင်ပေးထားလျှင်လည်း ခြေထောက်ဖြင့် ကိုယ်အလေးချိန် လုံးဝ မခံနိုင်ခြင်း၊ သို့မဟုတ် ယခင်က ရနေသော စွမ်းရည်တစ်ခု ပျောက်သွားခြင်းကို ကလေးဆရာဝန် သို့မဟုတ် ကျန်းမာရေးဝန်ထမ်းနှင့် ဆွေးနွေးပါ။',
        'No way of moving around at all by 12 months, taking no weight through the legs even when supported, or losing a skill she used to have, are reasons to talk with a paediatrician or health worker.',
      ),
      encouragement: b(
        'တွားသွားခြင်းသည် မဖြစ်မနေ ဖြတ်သန်းရမည့် အဆင့် မဟုတ်ပါ — ကလေးအချို့သည် ထိုင်ရွှေ့၊ တွား၊ ဘေးတိုက် လျှောက်ပြီးမှ လျှောက်ကြသည်။',
        'Crawling is not a compulsory stage — some babies bottom-shuffle or cruise straight into walking.',
      ),
    }),
    'Pulling to stand and cruising between about 9 and 12 months, and the wide normal range for independent walking, follow CDC and AAP milestone guidance and the WHO motor development study windows of achievement, with the tone taken from the paediatric physical-therapy reference in the registry.',
  ),
  kb(
    milestone('10_12m', 'fine_motor', 1, {
      title: b('လက်မနှင့် လက်ညှိုးဖြင့် ညှပ်ကိုင်ခြင်း', 'Picking things up with a thumb-and-finger pinch'),
      observe: b('ကလေးသည် အစားအစာ အပိုင်းငယ်ကို လက်မနှင့် လက်ညှိုးဖြင့် ညှပ်ယူပါသလား။', 'Does she pick up a small piece of food between her thumb and one finger?'),
      why: b(
        '၉ လမှ ၁၂ လကြားတွင် လက်ဝါးတစ်ခုလုံးဖြင့် ဆွဲယူရာမှ လက်မနှင့် လက်ညှိုးဖြင့် တိကျစွာ ညှပ်ကိုင်ခြင်းသို့ ကူးပြောင်းသည်။ ဤစွမ်းရည်က ကိုယ်တိုင် စားခြင်း၊ ပစ္စည်းကို ဘူးထဲ ထည့်/ထုတ်ခြင်းကို ဖြစ်စေသည်။',
        'Between 9 and 12 months a whole-hand grasp becomes a precise thumb-and-finger pinch. This is what makes self-feeding and putting objects in and out of containers possible.',
      ),
      red: b(
        'လက်တစ်ဖက်တည်းကိုသာ အမြဲ သုံးခြင်း၊ ပစ္စည်းကို လုံးဝ မကိုင်ခြင်း သို့မဟုတ် ကိုင်ထားပြီး ချမရခြင်းကို ကျန်းမာရေးဝန်ထမ်းနှင့် ဆွေးနွေးပါ။',
        'Consistently using only one hand, not grasping objects at all, or being unable to let go of what she holds, are worth raising with a health worker.',
      ),
      encouragement: b(
        'ညှပ်ကိုင်မှု တိုးတက်လာသည်နှင့်အမျှ ပါးစပ်ထဲ ရောက်နိုင်သော ပစ္စည်းများကို ပိုမို သေချာစွာ ဖယ်ရှားပေးပါ။',
        'As her pinch improves, be even more careful about what small things are within her reach.',
      ),
    }),
    'The move from a raking grasp to a pincer grasp near the end of the first year follows CDC milestone checklists and AAP milestone guidance, with the description of hand development taken from the paediatric occupational-therapy textbook in the registry.',
  ),
  kb(
    milestone('10_12m', 'problem_solving', 2, {
      title: b('ဘူးထဲ ထည့်၍ ပြန်ထုတ်ခြင်း', 'Putting things in and taking them out'),
      observe: b('ကလေးသည် ပစ္စည်းကို ဘူး သို့မဟုတ် ခွက်ထဲ ထည့်ပြီး ပြန်ထုတ်ပါသလား။', 'Does she drop things into a box or cup and take them out again?'),
      why: b(
        'ဤအရွယ်တွင် ကလေးသည် အကြောင်းနှင့် အကျိုးကို စမ်းသပ်လေ့ရှိသည် — ချလိုက်၊ ရိုက်လိုက်၊ ထည့်လိုက်၊ ထုတ်လိုက် လုပ်ခြင်းဖြင့် ကမ္ဘာကို သင်ယူသည်။ တစ်ခုပြီး တစ်ခု ထပ်ခါထပ်ခါ လုပ်ခြင်းသည် ငြီးငွေ့ဖွယ် မဟုတ်ဘဲ သင်ယူမှု ဖြစ်သည်။',
        'At this age babies test cause and effect — dropping, banging, filling and emptying is how they learn how the world works. The endless repetition is not boredom, it is study.',
      ),
      red: b(
        'ပတ်ဝန်းကျင်ရှိ ပစ္စည်းများကို လုံးဝ စိတ်မဝင်စားခြင်း သို့မဟုတ် ကစားစရာဖြင့် လုံးဝ မကစားခြင်းကို ကျန်းမာရေးဝန်ထမ်းနှင့် ဆွေးနွေးပါ။ ဤအချက်တစ်ခုတည်းဖြင့် ရောဂါ သတ်မှတ်၍ မရပါ။',
        'Showing no interest at all in the objects around her, or not playing with toys at all, is worth raising with a health worker. No single observation can label a child.',
      ),
      encouragement: b(
        'အိမ်တွင်း ခွက်၊ ဘူးခွံ သန့်ရှင်းများသည် အကောင်းဆုံး ကစားစရာ ဖြစ်နိုင်သည် — စျေးကြီးသော ကစားစရာ မလိုပါ။',
        'Clean household cups and tins make some of the best toys there are — nothing expensive is needed.',
      ),
    }),
    'Filling, emptying and repeated cause-and-effect play near the end of the first year follows CDC and AAP milestone guidance, the AAP report on the power of play and the developmental-behavioural paediatrics textbook in the registry.',
  ),
  kb(
    milestone('10_12m', 'communication', 2, {
      title: b('ညွှန်ပြခြင်း၊ ပြသခြင်းနှင့် ပေးခြင်း', 'Pointing, showing and giving'),
      observe: b('ကလေးသည် လိုချင်သည့်အရာကို ညွှန်ပြပါသလား။ ကစားစရာကို သင့်ထံ ကမ်းပြသလား။', 'Does she point at what she wants, or hold a toy out to show you?'),
      why: b(
        '၉ လမှ ၁၂ လကြားတွင် ညွှန်ပြခြင်း၊ ပြသခြင်း၊ ပေးခြင်း၊ လက်ပြခြင်းနှင့် လက်ခုပ်တီးခြင်းကဲ့သို့ အမူအရာများ ပေါ်လာသည်။ ဤအမူအရာများသည် စကားလုံး မထွက်မီ ဖြစ်ပေါ်သော ဆက်သွယ်မှု ဖြစ်ပြီး နောင် ဘာသာစကား ဖွံ့ဖြိုးမှု၏ အခြေခံ ဖြစ်သည်။',
        'Between 9 and 12 months gestures appear — pointing, showing, giving, waving and clapping. These are communication before words, and they lay the ground for language.',
      ),
      red: b(
        'လ ၁၂ လအရွယ်တွင် မည်သည့် အမူအရာမျှ (လက်ပြခြင်း၊ ညွှန်ပြခြင်း၊ ပြသခြင်း) မပြုခြင်းကို ကလေးဆရာဝန် သို့မဟုတ် ကျန်းမာရေးဝန်ထမ်းနှင့် ဆွေးနွေးသင့်ပါသည်။',
        'No gestures at all — no waving, pointing or showing — by 12 months is worth discussing with a paediatrician or health worker.',
      ),
      encouragement: b(
        'ကလေး ညွှန်ပြသည့်အခါ ကြည့်ပေးပြီး အမည်ခေါ်ပေးခြင်းက ထိုအမူအရာကို အားပေးရာ ရောက်သည်။',
        'When she points, look where she points and name it — that is what keeps the gesture growing.',
      ),
    }),
    'The appearance of pointing, showing, giving and waving between 9 and 12 months follows CDC milestone guidance, AAP milestone guidance and the AAP developmental-surveillance report, with the everyday communication advice taken from the WHO Care for Child Development package and NHS learn-to-talk guidance in the registry.',
  ),
  kb(
    milestone('10_12m', 'speech', 1, {
      title: b('အဓိပ္ပာယ်ရှိ ပထမဆုံး စကားလုံးများ', 'First meaningful words'),
      observe: b('ကလေးသည် "မမ"၊ "ဖေဖေ" ကဲ့သို့ စကားလုံးကို မှန်ကန်သော လူအတွက် သုံးပါသလား။', 'Does she use a word such as "mama" or "dada" for the right person?'),
      why: b(
        'ကလေးအများစုသည် ၁၂ လဝန်းကျင်တွင် အဓိပ္ပာယ်ရှိသော စကားလုံး တစ်လုံး သို့မဟုတ် နှစ်လုံးခန့် ပြောလာသည်။ သို့သော် ဤအချိန်တွင် အဓိကမှာ ဗျည်းသံ ရောနှော ပြောဆိုမှု (ဥပမာ "ဒဘဒဘ") ဖြစ်ပြီး ၎င်းက စကားလုံးထက် ပို အရေးကြီးသည်။ ဘာသာစကား နှစ်မျိုး ကြားနေရသော ကလေးများတွင် စကားလုံး စတင်ချိန် အနည်းငယ် ကွာတတ်သည် — ဤသည် ပုံမှန် ဖြစ်သည်။',
        'Most babies say one or two meaningful words around 12 months. What matters more at this point is varied babble that sounds like speech. Babies hearing more than one language may start slightly differently, and that is normal.',
      ),
      red: b(
        'လ ၁၂ လအရွယ်တွင် ဗျည်းသံ ရောနှော ပြောဆိုမှု လုံးဝ မရှိခြင်း၊ အသံအား လုံးဝ တုံ့ပြန်မှု မရှိခြင်း၊ သို့မဟုတ် ယခင်က ပြောနေသော စကားလုံး ပျောက်သွားခြင်းကို ကျန်းမာရေးဝန်ထမ်းနှင့် ဆွေးနွေးပါ — အကြားအာရုံ စစ်ဆေးမှု အကြံပြုခံရနိုင်သည်။',
        'No babble at all by 12 months, no response to sound, or losing words she already had, should be discussed with a health worker — a hearing check is often suggested.',
      ),
      encouragement: b(
        'ကလေး၏ အသံကို တုံ့ပြန်ပေးခြင်းက စကားလုံး အတင်း ပြောခိုင်းခြင်းထက် ပို အထောက်အကူ ပြုသည်။',
        'Answering her sounds helps far more than asking her to say a word on demand.',
      ),
    }),
    'First words around 12 months and the greater importance of varied babble at this stage follow CDC and AAP milestone guidance, the AAP developmental-surveillance report, NHS learn-to-talk advice and the language-development textbook in the registry.',
  ),
  kb(
    milestone('10_12m', 'language', 1, {
      title: b('အမည်ခေါ်လျှင် လှည့်ကြည့်ပြီး ရိုးရှင်းသော စကားကို နားလည်ခြင်း', 'Turning to her name and understanding simple words'),
      observe: b('အမည်ခေါ်လျှင် လှည့်ကြည့်ပါသလား။ "မလုပ်နဲ့" သို့မဟုတ် "လာ" ကို နားလည်ပါသလား။', 'Does she turn when you call her name? Does she understand "no" or "come here"?'),
      why: b(
        'ဤအရွယ်တွင် နားလည်မှုသည် ပြောဆိုမှုထက် အများကြီး ရှေ့ရောက်နေသည်။ ကလေးသည် မိသားစုဝင် အမည်များ၊ နေ့စဉ် သုံးစကားလုံးများနှင့် ရိုးရှင်းသော ညွှန်ကြားချက် တစ်ကြောင်းကို နားလည်စ ပြုသည်။',
        'Understanding runs well ahead of speaking at this age. She begins to know family names, everyday words and one simple instruction.',
      ),
      red: b(
        'အသံကျယ်အား တုံ့ပြန်မှု မရှိခြင်း၊ အမည်ခေါ်လျှင် အကြိမ်ကြိမ် လှည့်မကြည့်ခြင်းကို ကျန်းမာရေးဝန်ထမ်းနှင့် ဆွေးနွေးပါ။ ဤအချက်တစ်ခုတည်းဖြင့် ရောဂါ သတ်မှတ်၍ မရပါ။',
        'Not reacting to loud sounds, or repeatedly not turning to her name, is worth raising with a health worker. No single observation can label a child.',
      ),
      encouragement: b(
        'တစ်နေ့တာလုံး သင် လုပ်နေသည်ကို ပြောပြခြင်းက ကလေးအား စကားလုံး အများဆုံး ကြားစေသည်။',
        'Narrating your day gives her more words than any toy can.',
      ),
    }),
    'Responding to her name and understanding everyday words before speaking them follows CDC and AAP milestone guidance and the AAP developmental-surveillance report, with the value of adult talk taken from the language-development textbook and the conversational-turns research in the registry.',
  ),
  kb(
    milestone('10_12m', 'social', 1, {
      title: b('အမူအရာများကို တုပခြင်းနှင့် လူမှုကစားနည်းများ', 'Copying actions and playing social games'),
      observe: b('ကလေးသည် လက်ခုပ်တီးခြင်း၊ လက်ပြခြင်းကို တုပပါသလား။ ပုန်းတမ်းရှာတမ်း ကစားရာတွင် ပါဝင်ပါသလား။', 'Does she copy clapping or waving? Does she join in peekaboo?'),
      why: b(
        '၉ လမှ ၁၂ လကြားတွင် ကလေးသည် အသံ၊ မျက်နှာအမူအရာနှင့် လှုပ်ရှားမှုများကို တုပလာသည်။ ပုန်းတမ်းရှာတမ်းကဲ့သို့ ထပ်ခါထပ်ခါ ကစားနည်းများသည် အလှည့်ကျမှုနှင့် မျှဝေ အာရုံစိုက်မှုကို သင်ပေးသည်။',
        'Between 9 and 12 months babies copy sounds, faces and actions. Repetitive games such as peekaboo teach turn-taking and shared attention.',
      ),
      red: b(
        'မျက်လုံးချင်း ဆိုင်ကြည့်မှု အလွန်နည်းခြင်း၊ ပြုံးပြခြင်း သို့မဟုတ် အမူအရာ တုပခြင်း လုံးဝ မရှိခြင်းကို ကျန်းမာရေးဝန်ထမ်းနှင့် ဆွေးနွေးပါ။ ဤအချက်များသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ဘဲ ဆွေးနွေးရန် အချက်များသာ ဖြစ်သည်။',
        'Very little eye contact, no smiling back, or no copying at all, are worth raising with a health worker. These are conversation starters, not a diagnosis.',
      ),
      encouragement: b(
        'တူညီသော ကစားနည်းကို ထပ်ခါထပ်ခါ ကစားပေးခြင်းက ကလေးအား အနောက်ဆုံး ဘာဖြစ်မည်ကို ကြိုသိစေပြီး ယုံကြည်မှု တည်ဆောက်ပေးသည်။',
        'Playing the same game over and over lets her predict what comes next, and that builds trust.',
      ),
    }),
    'Imitation of gestures and enjoyment of repetitive social games near the end of the first year follow CDC and AAP milestone guidance, the NICE social and emotional wellbeing guidance and the developmental-behavioural paediatrics textbook in the registry.',
  ),
  kb(
    milestone('10_12m', 'emotional', 1, {
      title: b('စိမ်းသူကို သတိထားခြင်းနှင့် ခွဲခွာချိန် ခံစားမှု', 'Stranger awareness and separation feelings'),
      observe: b('ကလေးသည် မသိသောသူကို တွေ့လျှင် သင့်ထံ ကပ်လာပါသလား။ သင် ထွက်သွားလျှင် ငိုပါသလား။', 'Does she cling to you around unfamiliar people, or cry when you leave?'),
      why: b(
        'ဤအရွယ်တွင် စိမ်းသူကို သတိထားခြင်းနှင့် ခွဲခွာမှု စိုးရိမ်ခြင်းသည် အထွတ်အထိပ် ရောက်တတ်သည်။ ၎င်းသည် ပြဿနာ မဟုတ်ဘဲ ကလေးက သင့်ကို အထူး ယုံကြည်နေပြီဟု ပြသသော ကျန်းမာသည့် လက္ခဏာ ဖြစ်သည်။ ကလေးသည် မိမိကိုယ်ကို ငြိမ်းအောင် မလုပ်နိုင်သေး၍ လူကြီး၏ အကူအညီဖြင့် စိတ်ကို ပြန်တည်ငြိမ်စေသည်။',
        'Stranger awareness and separation anxiety often peak now. This is not a problem — it shows she has formed a strong attachment to you. She cannot calm herself yet; she borrows an adult’s calm.',
      ),
      red: b(
        'နှစ်သိမ့်၍ လုံးဝ မရနိုင်အောင် ကြာရှည် ငိုခြင်း၊ လူကြီးများနှင့် ဆက်သွယ်မှု လုံးဝ မရှိခြင်း၊ သို့မဟုတ် မိဘ၏ စိတ်ဓာတ် ကျဆင်းမှုသည် နေ့စဉ်ဘဝကို ထိခိုက်နေခြင်းကို ကျန်းမာရေးဝန်ထမ်းနှင့် ဆွေးနွေးပါ။ မိဘ၏ စိတ်ကျန်းမာရေးသည်လည်း အရေးကြီးပါသည်။',
        'Crying that cannot be soothed at all, no interest in connecting with adults, or a parent’s own low mood affecting daily life, should be raised with a health worker. Parent mental health matters too.',
      ),
      encouragement: b(
        'အမြဲ တူညီသော နှုတ်ဆက်ပုံဖြင့် ထွက်ခွာခြင်းက ခွဲခွာချိန်ကို တဖြည်းဖြည်း လွယ်ကူစေသည် — တိတ်တဆိတ် ထွက်သွားခြင်းက ပိုခက်စေသည်။',
        'A short, predictable goodbye makes separations easier over time — slipping away quietly usually makes them harder.',
      ),
    }),
    'Stranger awareness, peak separation anxiety and co-regulation with a caregiver at this age follow CDC and AAP milestone guidance, the AAP report on early relational health and toxic stress, the NICE social and emotional wellbeing guidance and the general paediatrics textbook in the registry.',
  ),
  kb(
    milestone('10_12m', 'gross_motor', 3, {
      title: b('အမှီမပါဘဲ စက္ကန့်အနည်းငယ်ကြာ တစ်ဦးတည်း မတ်တပ်ရပ်နိုင်ခြင်း', 'Stands alone for a few seconds'),
      observe: b(
        'ပရိဘောဂကို ကိုင်မထားဘဲ အမှီမပါဘဲ စက္ကန့်အနည်းငယ်ကြာ တည်ငြိမ်စွာ မတ်တပ်ရပ်နိုင်ပါသလား။',
        'Does your baby let go of furniture and stand steadily, without holding on, for a couple of seconds?',
      ),
      why: b(
        'ခေတ္တမျှ တစ်ဦးတည်း မတ်တပ်ရပ်နိုင်ခြင်းသည် ခြေထောက်ကြွက်သားများ သန်မာလာပြီး ဟန်ချက်ထိန်းနိုင်စွမ်း ကောင်းမွန်လာကြောင်း ဖော်ပြသည်။ ၎င်းသည် လမ်းလျှောက်နိုင်ရန် အရေးပါသော ဖွံ့ဖြိုးမှုအဆင့်တစ်ခု ဖြစ်ပါသည်။',
        'Brief independent standing shows enough leg strength and balance are in place — a step on the way to walking.',
      ),
      encouragement: b(
        'ကစားနေစဉ် လက်လွှတ်၍ ခေတ္တ မတ်တပ်ရပ်ကြည့်ရန် အားပေးပါ။ ချော်လဲပါက ထိခိုက်မှု လျော့နည်းစေရန် အနီးပတ်ဝန်းကျင်ရှိ ကြမ်းပြင်ပေါ်တွင် နူးညံ့သော ဖျာခင်းထားပေးပါ။',
        'During play, encourage brief hands-off moments, and keep the surrounding area soft in case of a tumble.',
      ),
    }),
    'Independent standing as a milestone preceding walking is documented in CDC/AAP milestone checklists and the WHO motor development windows study in the registry.',
  ),
  kb(
    milestone('10_12m', 'fine_motor', 2, {
      title: b('လက်နှစ်ဖက်ဖြင့် လက်ခုပ်တီးနိုင်ခြင်း', 'Claps hands together'),
      observe: b(
        'သီချင်းဆိုချိန် သို့မဟုတ် ကစားချိန်များတွင် ကလေးငယ်က လက်နှစ်ဖက်ကို ထိစပ်ကာ လက်ခုပ်တီးနိုင်ပါသလား။',
        'During a song or game, can your baby bring both hands together to clap?',
      ),
      why: b(
        'လက်ခုပ်တီးနိုင်ခြင်းသည် လက်နှစ်ဖက်ကို ညှိနှိုင်းအသုံးပြုနိုင်စွမ်းနှင့် လူကြီးများ၏ လုပ်ဆောင်ချက်ကို အတုယူသင်ယူနိုင်စွမ်းကို ဖော်ပြပါသည်။',
        'Clapping shows two-handed coordination and the ability to copy an action from a caregiver.',
      ),
      encouragement: b(
        'လက်ခုပ်တီးသည့် ကလေးသီချင်းလေးများကို သီဆိုရင်း ကလေးငယ် မြင်သာအောင် အတူတကွ လက်ခုပ်တီးပြကာ အားပေးပါ။',
        'Sing simple clapping songs together and clap along so your baby can watch and copy.',
      ),
    }),
    'Clapping and gesture imitation around this age are described in AAP milestone guidance and the CDC milestone checklists in the registry.',
  ),
  kb(
    milestone('10_12m', 'communication', 3, {
      title: b('"တာ့တာ/ဘိုင်ဘိုင်" ဟု လက်ပြနှုတ်ဆက်ခြင်းနှင့် ချီပေးရန် လက်ဆန့်ပြခြင်း', 'Waves bye-bye and raises arms to be picked up'),
      observe: b(
        'လူတစ်ဦးဦး ထွက်ခွာသွားသည့်အခါ ကလေးငယ်က "တာ့တာ/ဘိုင်ဘိုင်" ဟု လက်ပြနှုတ်ဆက်ပါသလား။ ချီစေလိုသည့်အခါ လက်နှစ်ဖက်ကို အပေါ်သို့ မြှောက်ပြပါသလား။',
        'When someone leaves, does your baby wave bye-bye? When they want to be picked up, do they raise both arms?',
      ),
      why: b(
        'ဤကဲ့သို့သော လက်ဟန်အမူအရာများသည် စကားမပြောတတ်မီကပင် ရည်ရွယ်ချက်ရှိရှိ ဆက်သွယ်ပြောဆိုနိုင်ကြောင်း ဖော်ပြပါသည်။',
        'These gestures are meaningful, intentional communication that develop before spoken words.',
      ),
      encouragement: b(
        'လူတစ်ဦးဦး အခန်းပြင်သို့ ထွက်သွားတိုင်း "တာ့တာ/ဘိုင်ဘိုင်" ဟု ပြောပြီး လက်ပြနှုတ်ဆက်ပြကာ ကလေးငယ် အတုယူနိုင်အောင် ပြသပေးပါ။',
        'Model waving and saying "bye-bye" every time someone leaves the room.',
      ),
    }),
    'Early communicative gestures such as waving and reaching to be held are described in CDC/AAP milestone guidance and the WHO Care for Child Development materials in the registry.',
  ),
  kb(
    milestone('10_12m', 'communication', 4, {
      title: b('မိဘက လက်ညှိုးထိုးပြသည့် အရာဝတ္ထုဆီသို့ လှည့်ကြည့်နိုင်ခြင်း', 'Follows your point and looks at what you’re showing'),
      observe: b(
        'ကလေးနှင့် ခပ်လှမ်းလှမ်းရှိ အရာဝတ္ထုတစ်ခုခုကို လက်ညှိုးထိုးပြသည့်အခါ ကလေးငယ်က ထိုအရာဝတ္ထုဆီသို့ လှည့်ကြည့်ပါသလား (သို့မဟုတ် မိဘ၏ လက်ကိုသာ ကြည့်နေပါသလား)။',
        'When you point at something a little way off, does your baby turn and look at the object — or only at your hand?',
      ),
      why: b(
        'အခြားသူ လက်ညှိုးထိုးပြသည့်အရာကို လိုက်ကြည့်နိုင်ခြင်းသည် အာရုံစိုက်မှုကို အတူတကွ မျှဝေနိုင်စွမ်းဖြစ်ပြီး ဘာသာစကား သင်ယူမှုနှင့် လူမှုဆက်ဆံရေး ဖွံ့ဖြိုးတိုးတက်မှုအတွက် အလွန်အရေးပါသော အခြေခံစွမ်းရည်တစ်ခု ဖြစ်ပါသည်။',
        'Following someone else’s point — called joint attention — is a key building block for language learning and social communication.',
      ),
      red: b(
        'အသက် ၁၂ လအရွယ်တွင် မိဘက လက်ညှိုးထိုးပြသည်ကို လုံးဝ လိုက်မကြည့်ပါက ကျန်းမာရေးဝန်ထမ်းနှင့် ပြသစစ်ဆေးပါ။',
        'If your baby never follows a point by 12 months, mention it at a health visit.',
      ),
      encouragement: b(
        'စိတ်ဝင်စားဖွယ် အရာဝတ္ထုများကို ကလေးငယ်အား လက်ညှိုးထိုးပြပြီး အမည်ကို ပြောပြပေးပါ (ဥပမာ — "ဟိုမှာ ကြည့်ပါဦး၊ ခွေးလေးပါ")။',
        'Point at interesting things and name them out loud — "look, a dog."',
      ),
    }),
    'Joint attention (following a point) as an early social-communication milestone is described in the WHO Care for Child Development materials and the language-development research (Weisleder 2013) in the registry.',
  ),
  kb(
    milestone('10_12m', 'self_help', 2, {
      title: b('အဝတ်အစား ဝတ်ဆင်ချိန်တွင် လက် သို့မဟုတ် ခြေထောက်ကို လျှိုထည့်ပေးကာ ကူညီခြင်း', 'Helps with dressing by pushing an arm or leg into clothing'),
      observe: b(
        'အင်္ကျီဝတ်ပေးချိန်တွင် လက်ကို အင်္ကျီလက်ထဲသို့ လျှိုထည့်ပေးခြင်း သို့မဟုတ် ဘောင်းဘီဝတ်ချိန်တွင် ခြေထောက်ကို ဆန့်ထုတ်ပေးခြင်းဖြင့် ပါဝင်ကူညီတတ်ပါသလား။',
        'While you dress your baby, do they help by pushing an arm into a sleeve or holding a leg out for you?',
      ),
      why: b(
        'ဤသို့ ပါဝင်ကူညီခြင်းသည် မိမိခန္ဓာကိုယ်အပေါ် သတိပြုနားလည်မှုနှင့် လုပ်ဆောင်လိုစိတ် တိုးတက်လာခြင်းကို ဖော်ပြပြီး ကိုယ်တိုင် လုပ်ဆောင်နိုင်စွမ်း၏ အစောပိုင်းအဆင့် ဖြစ်ပါသည်။',
        'Cooperating this way shows growing body awareness and willingness to participate — the start of self-help skills.',
      ),
      encouragement: b(
        'အဝတ်အစား ဝတ်ပေးချိန်တွင် အရာအားလုံးကို မိဘချည်း လုပ်မပေးဘဲ ကလေးငယ် ကိုယ်တိုင် ပါဝင်ကူညီနိုင်ရန် အချိန်ခေတ္တပေးပြီး အားပေးပါ။',
        'Pause for a moment during dressing and invite your baby to help, rather than doing every step for them.',
      ),
    }),
    'Early cooperative dressing as a self-help precursor is described in paediatric occupational-therapy references (Case-Smith) and Bright Futures guidance in the registry.',
  ),
  kb(
    milestone('10_12m', 'play', 1, {
      title: b('အရုပ်ဖုန်းဖြင့် စကားပြောသကဲ့သို့ ရိုးရှင်းသော ဟန်ဆောင်ကစားနည်း စတင်ခြင်း', 'Plays simple pretend, like "talking" on a toy phone'),
      observe: b(
        'အရုပ်ဖုန်းကို နားတွင် ကပ်၍ "စကားပြောသလို" ဟန်ဆောင်ကစားခြင်း သို့မဟုတ် နေ့စဉ် လူကြီးများ လုပ်ဆောင်သည့် ရိုးရှင်းသော အပြုအမူတစ်ခုခုကို အတုယူကစားခြင်း ပြုလုပ်ပါသလား။',
        'Does your baby hold a toy phone to the ear and "talk," or copy another simple everyday action like it?',
      ),
      why: b(
        'ဤကဲ့သို့ ရိုးရှင်းသော အတုယူ ဟန်ဆောင်ကစားမှုများသည် စိတ်ကူးဉာဏ် ဖွံ့ဖြိုးမှုနှင့် အရာဝတ္ထုများကို အခြားအရာအဖြစ် အစားထိုးစဉ်းစားတတ်သော သင်္ကေတဆိုင်ရာ တွေးခေါ်မှု၏ အစောပိုင်း လက္ခဏာများ ဖြစ်ပါသည်။',
        'These simple imitative actions are among the earliest signs of imagination and symbolic thinking.',
      ),
      encouragement: b(
        'နေ့စဉ် လုပ်ဆောင်ချက်လေးများကို ကလေးငယ်ရှေ့တွင် ရှင်းလင်းစွာ လုပ်ပြပြီး ကလေးငယ်ကိုလည်း လိုက်လံ အတုယူကစားခွင့် ပေးပါ။',
        'Model everyday actions clearly in front of your baby and give them a chance to copy you.',
      ),
    }),
    'Early imitative and pretend play as a marker of symbolic thinking is described in the AAP Power of Play guidance and developmental-behavioral paediatrics references in the registry.',
  ),
];

const GUIDES: SeedItem[] = [
  kb(
    guide('10_12m', 'gross_motor', {
      title: b('၁၀ – ၁၂ လ — ကြွက်သားကြီး လှုပ်ရှားမှု လမ်းညွှန်', '10–12 months — Gross motor guide'),
      why: b(
        'ဤအရွယ်တွင် ကလေးအများစုသည် ပစ္စည်းကို ဆွဲကိုင်၍ မတ်တပ်ရပ်ခြင်းနှင့် ပရိဘောဂကို ကိုင်လျက် ဘေးတိုက်လျှောက်ခြင်းတို့ကို စတင်လုပ်နိုင်သည်။ အချို့က ခဏတာ လက်လွှတ်ရပ်နိုင်ပြီး အချို့က ပထမဆုံး ခြေလှမ်းများကို လှမ်းကြသည်။ သို့သော် ၁၂ လတွင် လျှောက်နိုင်ရမည်ဟု မသတ်မှတ်နိုင်ပါ။ ကျန်းမာသော ကလေးများသည် ၉ လမှ ၁၈ လအတွင်း လျှောက်တတ်ကြပြီး ဤအချိန်ကွာခြားမှုမှာ ပုံမှန်ဖြစ်သည်။ တွားသွားပုံလည်း ကလေးတစ်ဦးနှင့်တစ်ဦး ကွဲပြားနိုင်ပြီး အချို့က တွားခြင်းမရှိဘဲ တိုက်ရိုက်လျှောက်တတ်ကြသည်။',
        'Around now many babies pull to stand and cruise sideways holding furniture. Some stand alone briefly, and some take first steps. But walking by 12 months is not required — healthy children walk anywhere between about 9 and 18 months, and that whole range is normal. Ways of moving also vary: some babies bottom-shuffle or roll, and some skip crawling altogether.',
      ),
      observationQuestions: [
        b('ပရိဘောဂကို ဆွဲကိုင်၍ မတ်တပ် ထရပ်ပါသလား။', 'Does she pull herself up to stand holding furniture?'),
        b('ကိုင်လျက် ဘေးတိုက် လှမ်းပါသလား။', 'Does she step sideways while holding on?'),
        b('ထိုင်ရာမှ တွားခြင်း၊ တွားရာမှ ထိုင်ခြင်းကို ကိုယ်တိုင် ပြောင်းနိုင်ပါသလား။', 'Can she move between sitting and crawling on her own?'),
        b('ခြေထောက် နှစ်ဖက်စလုံးကို ညီညီ သုံးပါသလား။', 'Does she use both legs about equally?'),
      ],
      dailyActivities: [
        b('ကစားစရာကို ဆိုဖာ သို့မဟုတ် ခုံပေါ် တင်ထားပြီး ထရပ်ရန် ဖိတ်ခေါ်ပါ။', 'Put a toy on a low sofa or bench to invite her to pull up.'),
        b('ကြမ်းပြင်ပေါ်တွင် လွတ်လပ်စွာ လှုပ်ရှားရန် နေရာ ပေးပါ။', 'Give her clear floor space to move freely every day.'),
        b('ခြေဗလာ လျှောက်ခွင့် ပေးပါ — ခြေထောက် ကြွက်သားများ ပိုကောင်းစွာ အလုပ်လုပ်သည်။', 'Let her be barefoot indoors — bare feet help balance and foot muscles.'),
      ],
      weeklyActivities: [
        b('ခေါင်းအုံး၊ မွေ့ရာ လိပ်များဖြင့် တွားကျော်ရန် အတားအဆီး လမ်းကြောင်း လုပ်ပေးပါ။', 'Build a soft obstacle path from pillows and rolled bedding to crawl over.'),
        b('စားပွဲနှစ်လုံးကြား တိုတိုလေး ကိုင်လျှောက်ခွင့် စီစဉ်ပေးပါ။', 'Set two stable pieces of furniture a short step apart for cruising.'),
      ],
      indoor: [
        b('ခိုင်ခံ့သော ခုံဘေးတွင် မတ်တပ် ရပ်၍ ကစားခြင်း။', 'Standing to play at a low, stable bench.'),
        b('ဘောလုံးကို တွန်း၍ လိုက်တွားခြင်း။', 'Pushing a ball and crawling after it.'),
      ],
      outdoor: [
        b('သန့်ရှင်း၍ ညီညာသော အရိပ်ရှိ ကြမ်းပြင်ပေါ်တွင် ဖျာခင်း၍ လှုပ်ရှားစေခြင်း။', 'A mat on clean, level ground in the shade for moving about.'),
      ],
      lowCost: [
        b('ဖျာ၊ ခေါင်းအုံး၊ ပလတ်စတစ် ဗူးခွံများဖြင့် လုံလောက်သည်။', 'A mat, pillows and empty plastic containers are enough.'),
        b('ကလေး လျှောက်ရန် ပစ္စည်း ဝယ်ရန် မလိုပါ — ကြမ်းပြင်နှင့် အချိန်သာ လိုသည်။', 'Nothing needs buying to learn to walk — floor space and time are what help.'),
      ],
      materials: b('ဖျာ၊ ခိုင်ခံ့သော နိမ့်ခုံ၊ ပျော့သော ခေါင်းအုံးများ', 'A mat, a stable low bench, soft pillows'),
      safety: b(
        'ကလေး ထရပ်လာသည်နှင့် အိမ်တွင်းဘေးကင်းရေးကို ပြန်စစ်ပါ။ မှီလိုက်လျှင် လဲနိုင်သော စားပွဲ၊ စင်နှင့် တီဗွီများကို နံရံတွင် ခိုင်ခန့်စွာ တွယ်ထားပါ။ လှေကား၏ အပေါ်နှင့် အောက် နှစ်နေရာစလုံးတွင် တံခါးကာ တပ်ပါ။ ကလေးသည် ပရိဘောဂပေါ် တက်နိုင်သဖြင့် ပြတင်းပေါက်များကို ပိတ်ထားပါ သို့မဟုတ် ကာရံထားပါ။ လိုက်ကာကြိုးများကို ကလေးလက်လှမ်းမမီအောင် ထားပါ။ မီးပလပ်ပေါက်များကို ပိတ်ကာထားပြီး ရေဗူး၊ ရေပုံးနှင့် ရေချိုးခွက်များကို ဗလာထားပါ။ မီးဖို၊ ရေနွေးအိုးနှင့် မီးပူများကို လက်လှမ်းမမီအောင် ထားပါ။ ဆေးဝါးနှင့် ဓာတုပစ္စည်းများကို သော့ခတ်သိမ်းဆည်းပြီး ပါးစပ်ထဲ ဝင်နိုင်သော ပစ္စည်းငယ်များကို ဖယ်ရှားပါ။ ကလေးလမ်းလျှောက်စက်ကို မသုံးပါနှင့်။ ယင်းသည် ပြုတ်ကျမှုနှင့် လှေကားမှ ကျမှုအန္တရာယ်ကို တိုးစေပြီး လမ်းလျှောက်တတ်ချိန်ကို မမြန်စေပါ။',
        'Once she pulls to stand, walk the house again. Anchor tables, shelves and TVs that could tip. Fit gates at the top and bottom of stairs. Keep windows closed or guarded — she can climb onto furniture. Tie blind and curtain cords high out of reach (they are a strangulation hazard). Cover sockets. Empty buckets, basins and bath water. Keep the stove, hot drinks, kettles and irons out of reach. Lock away medicines and cleaning products. Remove small objects that fit in her mouth. **Do not use a baby walker** — walkers increase falls and stair injuries and do not make walking come sooner.',
      ),
      commonMistakes: [
        b('အခြားကလေးနှင့် နှိုင်းယှဉ်၍ စိုးရိမ်ခြင်း — လျှောက်ချိန်သည် ကွာခြားမှု များသည်။', 'Comparing with another baby — the age of walking varies a lot.'),
        b('လက်နှစ်ဖက် ဆွဲ၍ အတင်း လျှောက်ခိုင်းခြင်း — ကလေး ကိုယ်တိုင် အဆင်သင့် ဖြစ်ချိန်ကို စောင့်ပါ။', 'Dragging her along by both hands — let her lead when she is ready.'),
      ],
      parentTips: [
        b('ထရပ်ပြီး ပြန်မထိုင်တတ်လျှင် ဒူးကို ညင်ညင်သာသာ ကွေးပေး၍ ပြန်ထိုင်နည်း သင်ပေးပါ။', 'If she gets stuck standing, gently bend her knees to show her how to sit down.'),
        b('လဲကျခြင်းသည် သင်ယူမှု၏ တစ်စိတ်တစ်ပိုင်း ဖြစ်သည် — ကြမ်းပြင်ကို ပျော့အောင် ပြင်ပေးပါ။', 'Falls are part of learning — make the landing soft rather than preventing every fall.'),
      ],
      faq: [
        {
          q: b('၁၂ လ ပြည့်ပြီ၊ မလျှောက်သေးဘူး — စိုးရိမ်ရလား။', 'She is 12 months and not walking — should I worry?'),
          a: b('များသောအားဖြင့် စိုးရိမ်ရန် မလိုပါ။ ကလေးများသည် ၉ လမှ ၁၈ လအတွင်း လျှောက်တတ်ကြသည်။ ကလေးသည် အခြားနည်းဖြင့် (တွားခြင်း၊ ကိုင်လျှောက်ခြင်း) ရွေ့လျားနေပြီး ဆက်လက် တိုးတက်နေလျှင် ဆက်စောင့်ကြည့်နိုင်သည်။ ၁၈ လတွင် လုံးဝ မလျှောက်နိုင်သေးလျှင် ကျန်းမာရေးဝန်ထမ်းနှင့် ဆွေးနွေးပါ။', 'Usually not. Babies walk anywhere from about 9 to 18 months. If she is moving another way and steadily gaining new skills, it is reasonable to keep watching. If she is still not walking at 18 months, discuss it with a health worker.'),
        },
        {
          q: b('တွားခြင်း လုံးဝ မလုပ်ဘဲ ကျော်သွားလို့ ရပါသလား။', 'Can she skip crawling altogether?'),
          a: b('ရပါသည်။ အချို့ ကလေးများသည် တွားခြင်းကို ကျော်၍ ထိုင်ရွေ့ခြင်း သို့မဟုတ် တိုက်ရိုက် ထလျှောက်ခြင်းသို့ သွားကြသည်။ အရေးကြီးသည်မှာ ရွေ့လျားနည်း တစ်မျိုးမျိုးဖြင့် ပတ်ဝန်းကျင်ကို စူးစမ်းနေခြင်းနှင့် ခြေလက် နှစ်ဖက်စလုံးကို သုံးနေခြင်း ဖြစ်သည်။', 'Yes. Some babies bottom-shuffle or go straight to standing. What matters is that she is exploring by some means and using both sides of her body.'),
        },
      ],
      redFlags: [
        b('ကူညီပေးလျှင်လည်း ခြေထောက်ပေါ် အလေးမပေးနိုင်ခြင်း။', 'Cannot bear any weight on her legs even with support.'),
        b('ခြေထောက် သို့မဟုတ် လက် တစ်ဖက်ကို လုံးဝ မသုံးခြင်း။', 'One arm or leg is never used.'),
        b('ကြွက်သားများ အလွန် ပျော့ခွေခြင်း သို့မဟုတ် အလွန် တောင့်တင်းခြင်း။', 'Muscles that feel very floppy or very stiff.'),
        b('ယခင်က ရနေသော စွမ်းရည်များ ပျောက်ဆုံးသွားခြင်း။', 'Loss of skills she previously had.'),
      ],
      referral: b(
        'အထက်ပါ အချက်များ တွေ့ရှိပါက ကလေးဆရာဝန် သို့မဟုတ် ကျန်းမာရေးဝန်ထမ်းနှင့် ဆွေးနွေးပါ။ ဤအချက်တစ်ခုတည်းဖြင့် ရောဂါ သတ်မှတ်၍မရပါ — စစ်ဆေးရန် အချက်ပြခြင်းသာ ဖြစ်သည်။',
        'If you notice these, discuss them with a paediatrician or health worker. No single sign here is a diagnosis — it is a prompt to check.',
      ),
      encouragement: b(
        'ကလေး၏ ပထမဆုံး ခြေလှမ်းသည် ရက်စွဲအတိအကျ မလိုပါ — ယနေ့ လုပ်နိုင်သည့် လှုပ်ရှားမှုကို ပျော်ရွှင်စွာ လေ့ကျင့်ခွင့် ပေးခြင်းက အကောင်းဆုံး ဖြစ်သည်။',
        'First steps do not need a deadline — the best help is happy practice at whatever she can do today.',
      ),
    }),
    'Pulling to stand, cruising and the wide normal range for independent walking follow CDC milestone checklists, AAP milestone guidance and the WHO motor development study windows of achievement, with handling detail from the paediatric physical-therapy reference and the anticipatory-guidance and home-safety points from the Bright Futures preventive-care schedule.',
  ),
  kb(
    guide('10_12m', 'fine_motor', {
      title: b('၁၀ – ၁၂ လ — လက်ချောင်းငယ် လှုပ်ရှားမှု လမ်းညွှန်', '10–12 months — Fine motor guide'),
      why: b(
        'ဤအရွယ်တွင် လက်မနှင့် လက်ညှိုးဖြင့် ညှပ်ယူနိုင်မှု ပိုမို ကျွမ်းကျင်လာသည်။ ပစ္စည်းငယ်များကို ကောက်ယူခြင်း၊ လက်တစ်ဖက်မှ တစ်ဖက်သို့ ပြောင်းကိုင်ခြင်း၊ ဗူးထဲ ထည့်ပြီး ပြန်ထုတ်ခြင်းတို့ကို အကြိမ်ကြိမ် လုပ်ချင်တတ်သည်။ ဤထည့်ထုတ်ကစားနည်းသည် လက်နှင့် မျက်စိ ပူးတွဲလုပ်ဆောင်နိုင်မှုကို လေ့ကျင့်ပေးပြီး ဗူးထဲတွင် ပစ္စည်းရှိနေဆဲဖြစ်ကြောင်းလည်း နားလည်လာစေသည်။',
        'The thumb-and-finger pincer grasp becomes more skilled now. She picks up small pieces, passes them hand to hand, and wants to put things into a container and take them out again, over and over. That in-and-out play trains hand–eye coordination and also builds the idea that an object still exists inside the container.',
      ),
      observationQuestions: [
        b('အစာတုံးငယ်ကို လက်မနှင့် လက်ညှိုးဖြင့် ညှပ်ယူပါသလား။', 'Does she pick up a small piece of food between thumb and finger?'),
        b('ဗူးထဲ ပစ္စည်း ထည့်ပြီး ပြန်ထုတ်ပါသလား။', 'Does she put things into a container and take them out?'),
        b('လက်ထဲမှ ပစ္စည်းကို သင့်လက်ထဲ ပေးပါသလား။', 'Does she hand an object over to you?'),
        b('လက်နှစ်ဖက်စလုံးကို အသုံးပြုပါသလား။', 'Does she use both hands?'),
      ],
      dailyActivities: [
        b('အစာစားချိန်တွင် ပျော့သော အစာတုံးငယ်များ ကိုယ်တိုင် ကောက်စားခွင့် ပေးပါ (ကြီးကြပ်မှုဖြင့်)။', 'At meals let her pick up soft finger-food pieces herself, always supervised.'),
        b('ခွက်ဗလာနှင့် ကြီးမားသော ပစ္စည်း သုံးလေးခုကို ထည့်-ထုတ် ကစားစေပါ။', 'Give an empty cup and three or four large pieces for in-and-out play.'),
        b('ကလေး ပေးသော ပစ္စည်းကို လက်ခံပြီး "ကျေးဇူးတင်ပါတယ်" ဟု ပြောပါ။', 'Accept what she hands you and say thank you.'),
      ],
      weeklyActivities: [
        b('အသွင်အပြင် မတူသော ပစ္စည်း သုံးမျိုးကို ခြင်းတောင်းထဲ ထည့်၍ စမ်းစေပါ။', 'Offer a basket with three different textures to explore.'),
        b('စာအုပ်စာမျက်နှာ လှန်ခြင်းကို အတူတူ လေ့ကျင့်ပါ။', 'Practise turning thick book pages together.'),
      ],
      indoor: [
        b('ပလတ်စတစ်ခွက်များ ထပ်ခြင်း၊ ဖြိုချခြင်း။', 'Stacking and knocking down plastic cups.'),
        b('အဝတ်စကို ဗူးထဲ ထည့်ပြီး ပြန်ဆွဲထုတ်ခြင်း။', 'Stuffing a cloth into a container and pulling it out.'),
      ],
      outdoor: [
        b('ကြီးကြပ်မှုဖြင့် သစ်ရွက် သို့မဟုတ် ကြီးမားသော ကျောက်စရစ်ကို ခြင်းထဲ ထည့်ခြင်း (ပါးစပ်ထဲ မထည့်စေရ)။', 'Under close supervision, putting leaves or large stones into a basket — never into the mouth.'),
      ],
      lowCost: [
        b('ပလတ်စတစ်ခွက်၊ ဇွန်း၊ အဝတ်စ၊ ဗလာဗူးများသည် အကောင်းဆုံး ပစ္စည်းများ ဖြစ်သည်။', 'Plastic cups, spoons, cloths and empty containers are ideal.'),
        b('ဈေးကြီးသော ကစားစရာ မလိုအပ်ပါ။', 'No expensive toys are needed.'),
      ],
      materials: b('ဗလာခွက်၊ ကြီးမားပြီး လုံခြုံသော ပစ္စည်း ၃–၄ ခု၊ အဝတ်စ', 'An empty cup, three or four large safe objects, a cloth'),
      safety: b(
        'ထည့်-ထုတ် ကစားရာတွင် သုံးသော ပစ္စည်းများသည် ကလေး၏ ပါးစပ်ထဲ လုံးဝ မဝင်နိုင်လောက်အောင် ကြီးရမည်။ ဒင်္ဂါးပြား၊ ကြယ်သီး၊ အခွံမာသီး၊ ပဲ၊ ဂျုံစေ့၊ ခလုတ်ဘက်ထရီ၊ သံလိုက်လုံးများကို လုံးဝ မပေးပါနှင့်။ ခလုတ်ဘက်ထရီ သို့မဟုတ် သံလိုက် မျိုမိပါက ချက်ချင်း ဆေးရုံသို့ သွားပါ။ ပလတ်စတစ်အိတ်၊ ပူဖောင်း၊ ကြိုးရှည်များကို ဝေးဝေးထားပါ။ ကလေးအား တစ်ယောက်တည်း ကစားခွင့် မပြုပါနှင့်။',
        'Everything used for in-and-out play must be too big to fit in her mouth. Never offer coins, buttons, nuts, dried beans, button batteries or small magnets. A swallowed button battery or magnet needs emergency hospital care immediately. Keep plastic bags, balloons and long cords well away. Never leave her playing alone.',
      ),
      commonMistakes: [
        b('လက်ညှိုးနှင့် လက်မဖြင့် ကောက်ကိုင်လေ့ကျင့်ရန် ပစ္စည်းအလွန်သေးသေးများ ပေးခြင်း — မျိုချမိပြီး အသက်ရှူလမ်းကြောင်း ပိတ်ဆို့နိုင်သည်။', 'Offering tiny objects to practise pinching — a choking risk.'),
        b('ကလေးအတွက် အမြဲ ကူညီပေးခြင်း — ကိုယ်တိုင် ကြိုးစားခွင့် ပေးပါ။', 'Doing it for her every time — let her try and struggle a little.'),
      ],
      parentTips: [
        b('ကလေး ဖြိုချချင်တာ ပုံမှန် ဖြစ်သည် — ဖြိုချခြင်းလည်း သင်ယူမှု ဖြစ်သည်။', 'Knocking things down is normal — that is learning too.'),
        b('တစ်ကြိမ်လျှင် ပစ္စည်း အနည်းငယ်သာ ပေးပါ — အာရုံစူးစိုက်မှု ပိုကောင်းသည်။', 'Offer only a few items at a time so she can focus.'),
      ],
      faq: [
        {
          q: b('ပစ္စည်းတွေကို အမြဲ ပစ်ချနေတယ် — ဆိုးနေတာလား။', 'She keeps throwing things on the floor — is she being naughty?'),
          a: b('မဆိုးပါ။ ပစ်ချပြီး ဘာဖြစ်မလဲ ကြည့်ခြင်းသည် အကြောင်းနှင့် အကျိုးကို လေ့လာနေခြင်း ဖြစ်သည်။ ပစ်ချရန် သင့်တော်သော ပစ္စည်း (ပျော့သော ဘောလုံး) ပေးပြီး ကြမ်းပြင်ပေါ်တွင် ကစားစေပါ။', 'No. Dropping something to see what happens is how she studies cause and effect. Give her something safe to drop, such as a soft ball, and play on the floor.'),
        },
        {
          q: b('လက်မနှင့် လက်ညှိုးဖြင့် မညှပ်တတ်သေးဘူး — ပြဿနာလား။', 'She cannot pinch with thumb and finger yet — is that a problem?'),
          a: b('ဤစွမ်းရည်သည် ၉ လမှ ၁၂ လအတွင်း တဖြည်းဖြည်း ပေါ်လာလေ့ရှိပြီး ကလေးတစ်ဦးနှင့်တစ်ဦး ကွာခြားနိုင်သည်။ လက်နှစ်ဖက်ကို သုံးနေပြီး ပစ္စည်းကို ဆွဲယူနိုင်လျှင် ဆက်လေ့ကျင့်ခွင့် ပေးပါ။ စိုးရိမ်ပါက ကျန်းမာရေးဝန်ထမ်းနှင့် ဆွေးနွေးပါ။', 'This skill usually emerges gradually between about 9 and 12 months and varies between children. If she uses both hands and can reach and grasp, keep giving practice. If you are concerned, discuss it with a health worker.'),
        },
      ],
      redFlags: [
        b('ပစ္စည်းကို လုံးဝ မဆွဲယူခြင်း၊ မကိုင်နိုင်ခြင်း။', 'No reaching for or holding objects at all.'),
        b('လက်တစ်ဖက်ကို လုံးဝ မသုံးခြင်း။', 'One hand never used at all.'),
        b('လက်များ အမြဲ ဆုပ်တောင့်နေခြင်း။', 'Hands that stay tightly fisted all the time.'),
      ],
      referral: b(
        'ဤလက္ခဏာများကို ကျန်းမာရေးဝန်ထမ်းအား ပြသပါ။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ဘဲ စစ်ဆေးရန် အချက်ပြခြင်းသာ ဖြစ်သည်။',
        'Raise these with a health worker. This is a prompt to check, not a diagnosis.',
      ),
      encouragement: b(
        'ဗူးထဲ ထည့်၊ ပြန်ထုတ်၊ ထပ်ထည့် — ထပ်ခါထပ်ခါ လုပ်ခြင်းသည် ငြီးငွေ့စရာ မဟုတ်ဘဲ ကလေးအတွက် လေ့ကျင့်ခန်း ဖြစ်ပါသည်။',
        'In, out, in again — the repetition is not boredom, it is her training.',
      ),
    }),
    'The pincer grasp, hand-to-hand transfer and container play at 10–12 months follow CDC milestone checklists, AAP milestone guidance and AAP guidance on the power of play, with hand-development detail from the paediatric occupational-therapy reference and the small-object and choking precautions from the Bright Futures preventive-care schedule.',
  ),
];

const GUIDES_B: SeedItem[] = [
  kb(
    guide('10_12m', 'speech', {
      title: b('၁၀ – ၁၂ လ — စကားသံ ထွက်ဆိုမှု လမ်းညွှန်', '10–12 months — Speech guide'),
      why: b(
        'ဤအရွယ်တွင် ကလေး၏ ပလုတ်သံများသည် စကားသံနှင့် ပိုတူလာသည်။ "မာမာ"၊ "ဒါဒါ" ကို လူတစ်ဦးကို ရည်ညွှန်း၍ ခေါ်လာနိုင်ပြီး၊ အချို့ ကလေးများသည် ပထမဆုံး အဓိပ္ပာယ်ရှိသော စကားလုံး တစ်လုံး နှစ်လုံး ပြောလာသည်။ အချို့မှာ ၁၅ လ ဝန်းကျင်မှ စတင်ပြောကြပြီး ဤအကွာအဝေးမှာလည်း ပုံမှန် ဖြစ်သည်။ စကားလုံး မထွက်သေးသော်လည်း အသံဖြင့် ဆက်သွယ်နေခြင်း၊ လက်ညှိုးထိုးပြခြင်း၊ နားလည်ပြသခြင်းတို့သည် ဖွံ့ဖြိုးမှု၏ အရေးကြီးသော အစိတ်အပိုင်းများ ဖြစ်သည်။',
        'Babble now sounds much more like speech. "Mama" and "dada" may start to mean a specific person, and some babies say one or two first meaningful words. Others begin nearer 15 months, which is also within the normal range. Even before words appear, communicating with sounds, pointing and showing understanding are important parts of speech development.',
      ),
      observationQuestions: [
        b('"မာမာ" သို့မဟုတ် "ဒါဒါ" ကို သတ်မှတ်ထားသော လူတစ်ဦးအတွက် သုံးပါသလား။', 'Does she use "mama" or "dada" for a particular person?'),
        b('သင့်ထွက်သော အသံကို ပြန်တုပါသလား။', 'Does she copy sounds you make?'),
        b('အသံ အနိမ့်အမြင့် အမျိုးမျိုးဖြင့် စကားပြောသလို လုပ်ပါသလား။', 'Does she babble with speech-like ups and downs?'),
        b('လိုချင်သည်ကို အသံဖြင့် ဖော်ပြပါသလား။', 'Does she use sounds to ask for something?'),
      ],
      dailyActivities: [
        b('ကလေး ထွက်သော အသံကို ပြန်တုပြီး စောင့်ပေးပါ — အလှည့်ကျ စကားပြောခြင်း ဖြစ်သည်။', 'Copy her sound back and then wait — that is turn-taking.'),
        b('လုပ်နေသည့် အလုပ်ကို စကားဖြင့် ပြောပြပါ ("ရေခပ်နေတယ်")။', 'Narrate what you are doing ("I am pouring water").'),
        b('ပစ္စည်းတစ်ခုစီ၏ အမည်ကို ရှင်းရှင်းလင်းလင်း ပြောပေးပါ — “ခွက်”၊ “ဘောလုံး”။', 'Name objects clearly — "cup", "ball".'),
      ],
      weeklyActivities: [
        b('တူညီသော သီချင်း ၂–၃ ပုဒ်ကို ထပ်ခါထပ်ခါ ဆိုပေးပါ။', 'Sing the same two or three songs repeatedly.'),
        b('ပုံစာအုပ်တစ်အုပ်ကို အတူတူကြည့်ပြီး ပုံတစ်ပုံစီ၏ အမည်ကို ပြောပေးပါ။', 'Look at one picture book together and name the pictures.'),
      ],
      indoor: [
        b('တိရစ္ဆာန် အသံများ ("မီးမီး"၊ "ဝုတ်ဝုတ်") ကို အတူတူ လုပ်ခြင်း။', 'Making animal sounds together.'),
        b('မှန်ရှေ့တွင် အတူရပ်၍ စကားပြောခြင်း။', 'Talking together in front of a mirror.'),
      ],
      outdoor: [
        b('လမ်းလျှောက်ရင်း မြင်တွေ့သည့် အရာများ၏ အမည်ကို ပြောပြပေးခြင်း။', 'Naming what you both see while out walking.'),
      ],
      lowCost: [
        b('စကားပြောခြင်း၊ သီချင်းဆိုခြင်းသည် အခမဲ့ဖြစ်ပြီး အထိရောက်ဆုံး ဖြစ်သည်။', 'Talking and singing cost nothing and work best.'),
        b('စာအုပ်မရှိလျှင် အိမ်သုံးပစ္စည်းများကို ပြသပြီး အမည်ပြောပေးပါ။', 'With no book, name household objects instead.'),
      ],
      materials: b('မလို — မိဘ၏ အသံသာ လိုသည်', 'None — your voice is enough'),
      safety: b(
        'ကလေးအား စကားပြောရန် အတင်း မတိုက်တွန်းပါနှင့်။ "ပြောပြစမ်း" ဟု ဖိအားပေးခြင်းက ဆက်သွယ်မှုကို လျော့နည်းစေတတ်သည်။ ကလေး ဆက်သွယ်လာသည့် အခိုက်တွင် တုံ့ပြန်ပေးခြင်းက ပိုအကျိုးရှိသည်။ ကလေးသည် ခဏခဏ နားကပ်ရောဂါ ဖြစ်နေလျှင် သို့မဟုတ် အသံကို တုံ့ပြန်မှု နည်းလျှင် အကြားအာရုံကို စစ်ဆေးရန် ကျန်းမာရေးဝန်ထမ်းနှင့် ဆွေးနွေးပါ။',
        'Do not pressure her to speak. Demanding "say it" tends to reduce communication rather than increase it; responding to her attempts works better. If she has frequent ear infections or responds little to sound, ask a health worker about a hearing check.',
      ),
      commonMistakes: [
        b('ကလေး ပြောမည်ကို မစောင့်ဘဲ အမြဲ အရင် ပေးလိုက်ခြင်း။', 'Always giving her what she wants before she tries to ask.'),
        b('စကားလုံး အရေအတွက်ကို အခြားကလေးနှင့် နှိုင်းယှဉ်ခြင်း။', 'Counting words and comparing with another child.'),
      ],
      parentTips: [
        b('ကလေး ထွက်သော အသံကို စကားလုံး အပြည့်အစုံဖြင့် ချဲ့ပြောပေးပါ ("ဘာ" → "ဘောလုံး")။', 'Expand her sound into a full word ("ba" → "ball").'),
        b('စကားပြောပြီးလျှင် ၅ စက္ကန့် စောင့်ပေးပါ — တုံ့ပြန်ရန် အချိန် လိုသည်။', 'After you speak, wait about five seconds — she needs time to answer.'),
      ],
      faq: [
        {
          q: b('၁၂ လ ပြည့်ပေမယ့် စကားလုံး တစ်လုံးမှ မပြောသေးဘူး။', 'She is 12 months and has no words yet.'),
          a: b('စကားလုံး မထွက်သေးခြင်းသည် ဤအရွယ်တွင် ဖြစ်လေ့ရှိပါသည်။ ပိုအရေးကြီးသည်မှာ ကလေးသည် အသံဖြင့် ဆက်သွယ်နေခြင်း၊ လက်ညှိုးထိုးပြခြင်း၊ နာမည်ခေါ်လျှင် လှည့်ကြည့်ခြင်း ရှိမရှိ ဖြစ်သည်။ ဤအရာများ မရှိလျှင် ကျန်းမာရေးဝန်ထမ်းနှင့် ဆွေးနွေးပါ။ ဤအချက်တစ်ခုတည်းဖြင့် ရောဂါ သတ်မှတ်၍မရပါ။', 'Having no words yet at 12 months is common. What matters more is whether she communicates with sounds, points, and turns when her name is called. If those are missing, discuss it with a health worker. No single sign here is a diagnosis.'),
        },
        {
          q: b('ဘာသာစကား နှစ်မျိုး ပြောရင် စကားနောက်ကျမလား။', 'Will two languages delay her speech?'),
          a: b('မနောက်ကျပါ။ ဘာသာစကား နှစ်မျိုးဖြင့် ကြီးပြင်းသော ကလေးများသည် ဘာသာစကား နှစ်မျိုးလုံးမှ စကားလုံးများကို ပေါင်း၍ တွက်ရသည်။ မိဘတစ်ဦးစီက မိမိ အကျွမ်းဝင်ဆုံး ဘာသာစကားဖြင့် ပြောပေးခြင်းက အကောင်းဆုံး ဖြစ်သည်။', 'No. Count words across both languages together. It works best when each adult speaks the language they know best.'),
        },
      ],
      redFlags: [
        b('ပလုတ်သံ လုံးဝ မထွက်ခြင်း သို့မဟုတ် ယခင်က ထွက်ခဲ့ပြီး ရပ်သွားခြင်း။', 'No babbling at all, or babbling that has stopped.'),
        b('ကျယ်လောင်သော အသံကို လုံးဝ မတုံ့ပြန်ခြင်း။', 'No response at all to loud sounds.'),
        b('လက်ညှိုးထိုးပြခြင်း၊ လက်ပြခြင်း ကဲ့သို့ အမူအရာ လုံးဝ မရှိခြင်း။', 'No gestures at all such as pointing or waving.'),
      ],
      referral: b(
        'ဤအချက်များကို ကလေးဆရာဝန် သို့မဟုတ် ကျန်းမာရေးဝန်ထမ်းနှင့် ဆွေးနွေးပါ။ အကြားအာရုံ စစ်ဆေးမှုကို စောစီးစွာ လုပ်ခြင်းသည် အထောက်အကူ ဖြစ်သည်။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ပါ။',
        'Raise these with a paediatrician or health worker; an early hearing check is often helpful. This is not a diagnosis.',
      ),
      encouragement: b(
        'သင် တုံ့ပြန်ပေးသော အသံတိုင်းသည် ကလေးအား "ငါ့အသံက အရေးပါတယ်" ဟု သင်ပေးနေခြင်း ဖြစ်ပါသည်။',
        'Every sound you answer teaches her that her voice matters.',
      ),
    }),
    'The move from repetitive babble to first meaningful words, and the wide normal range for first words, follow CDC and AAP milestone guidance, the NHS learn-to-talk guidance and the language-development textbook in the registry.',
  ),
  kb(
    guide('10_12m', 'language', {
      title: b('၁၀ – ၁၂ လ — ဘာသာစကား နားလည်မှု လမ်းညွှန်', '10–12 months — Language understanding guide'),
      why: b(
        'ပြောနိုင်မှုထက် နားလည်မှုက အမြဲ ရှေ့ကနေသည်။ ဤအရွယ်တွင် ကလေးသည် နာမည်ခေါ်လျှင် လှည့်ကြည့်ခြင်း၊ "မလုပ်နဲ့" ဟု ပြောလျှင် ခဏ ရပ်ခြင်း၊ မိသားစုဝင်များ၏ အမည်နှင့် အသုံးများသော ပစ္စည်းအမည်များကို နားလည်ခြင်း စတင်လာသည်။ နေ့စဉ် ပြောဆိုမှု များလေ၊ အလှည့်ကျ ဆက်သွယ်မှု များလေ ကလေး၏ စကားလုံး သိုလှောင်မှု ကြီးထွားလေ ဖြစ်သည်။',
        'Understanding always runs ahead of speaking. Now she turns to her name, pauses briefly at "no", and starts to understand family names and everyday object words. The more everyday talk and back-and-forth turns she gets, the faster her word store grows.',
      ),
      observationQuestions: [
        b('နာမည်ခေါ်လျှင် လှည့်ကြည့်ပါသလား။', 'Does she turn when you call her name?'),
        b('"လာ" သို့မဟုတ် "ပေးပါ" ကဲ့သို့ ရိုးရှင်းသော စကားကို နားလည်ပါသလား။', 'Does she understand simple words such as "come" or "give"?'),
        b('မိသားစုဝင်၏ အမည်ကို ပြောလျှင် ထိုသူဘက် ကြည့်ပါသလား။', 'Does she look towards a family member you name?'),
        b('"မလုပ်နဲ့" ဟု ပြောလျှင် ခဏ ရပ်ပါသလား။', 'Does she pause briefly when you say "no"?'),
      ],
      dailyActivities: [
        b('နေ့စဉ် လုပ်ငန်းများကို လုပ်ရင်း ပြောပြပါ — ရေချိုးချိန်၊ စားချိန်၊ အိပ်ချိန်။', 'Talk through daily routines — bath, meal, bedtime.'),
        b('ကလေး၏ နာမည်ကို စကားစမြည် ပြောရာတွင် မကြာခဏ ထည့်သုံးပါ။', 'Use her name often in ordinary conversation.'),
        b('ရိုးရှင်းသော ညွှန်ကြားချက် တစ်ကြောင်း ပေးပြီး အမူအရာဖြင့် ကူညီပါ ("ဘောလုံး ပေးပါ")။', 'Give one simple instruction with a gesture to help ("give me the ball").'),
      ],
      weeklyActivities: [
        b('ပုံစာအုပ်ထဲမှ ပစ္စည်းများကို "ဘယ်မှာလဲ" ဟု မေးပါ။', 'Ask "where is the…?" with a picture book.'),
        b('မိသားစုဓာတ်ပုံများကို အတူကြည့်ပြီး ပုံထဲမှ လူတစ်ဦးစီ၏ အမည်ကို ပြောပေးပါ။', 'Look at family photos and name everyone.'),
      ],
      indoor: [
        b('ကစားစရာ ၂ ခုထဲမှ တစ်ခုကို "ဘယ်ဟာလိုချင်လဲ" ဟု ရွေးခိုင်းခြင်း။', 'Offering a choice between two toys.'),
        b('ခေါ်၍ လှည့်ကြည့်လျှင် ပြုံးပြပြီး ဆုချခြင်း။', 'Smiling warmly when she turns to her name.'),
      ],
      outdoor: [
        b('အပြင်ထွက်စဉ် မြင်ရသည်များကို ရိုးရှင်းသော စကားဖြင့် ပြောပြခြင်း။', 'Describing what you see outdoors in short simple phrases.'),
      ],
      lowCost: [
        b('စကားပြောခြင်းသည် အခမဲ့ ဖြစ်သည် — အိမ်မှုကိစ္စ လုပ်ရင်းလည်း ပြောနိုင်သည်။', 'Talk is free — you can do it while doing housework.'),
        b('အိမ်သုံးပစ္စည်းများသည် စကားလုံး သင်ပေးသည့် အကောင်းဆုံး ကိရိယာ ဖြစ်သည်။', 'Household objects are the best vocabulary tools.'),
      ],
      materials: b('မလို — နေ့စဉ် ပစ္စည်းများနှင့် ပုံစာအုပ် တစ်အုပ်', 'None — everyday objects and one picture book'),
      safety: b(
        'ကလေး၏ နားလည်မှုကို စမ်းသပ်ရန် ထပ်ခါထပ်ခါ မေးခွန်း မမေးပါနှင့် — စကားပြောခြင်းသည် စာမေးပွဲ မဟုတ်ပါ။ နောက်ခံ တီဗီ သို့မဟုတ် ရေဒီယို အသံ ကျယ်နေခြင်းက ကလေး ကြားရန် ခက်ခဲစေသည်၊ စကားပြောချိန်တွင် ပိတ်ထားပါ။ ကလေးသည် နာမည်ခေါ်လျှင် အမြဲ မတုံ့ပြန်လျှင် အကြားအာရုံ စစ်ဆေးရန် ကျန်းမာရေးဝန်ထမ်းနှင့် ဆွေးနွေးပါ။',
        'Do not quiz her repeatedly to test understanding — talking is not an exam. Background TV or radio makes it harder for her to hear you; switch it off while you talk. If she consistently does not respond to her name, ask a health worker about a hearing check.',
      ),
      commonMistakes: [
        b('ရှည်လျားသော ဝါကျများဖြင့် ညွှန်ကြားခြင်း — တိုတိုနှင့် ရှင်းရှင်း ပြောပါ။', 'Long complicated instructions — keep them short and clear.'),
        b('ကလေး နားမလည်လျှင် အသံကျယ်ကျယ် ထပ်ပြောခြင်း — အမူအရာဖြင့် ကူညီပါ။', 'Repeating louder when she does not understand — add a gesture instead.'),
      ],
      parentTips: [
        b('တစ်နေ့လျှင် အနည်းဆုံး နှစ်ကြိမ် ကလေးနှင့် မျက်နှာချင်းဆိုင် စကားပြောချိန် ယူပါ။', 'Take at least two face-to-face talking times a day.'),
        b('ကလေး ကြည့်နေသည့်အရာ၏ အမည်ကို ပြောပေးပါ။ ကလေး စိတ်ဝင်စားနေသည့် အရာကို လိုက်၍ စကားပြောပါ။', 'Name whatever she is already looking at — follow her attention.'),
      ],
      faq: [
        {
          q: b('နာမည်ခေါ်လည်း တစ်ခါတစ်ရံ မလှည့်ကြည့်ဘူး — ပြဿနာလား။', 'She sometimes does not turn to her name — is that a problem?'),
          a: b('ကစားနေချိန်တွင် အလွန် စူးစိုက်နေ၍ မလှည့်ခြင်း ဖြစ်နိုင်ပါသည်။ သို့သော် အသံတိတ်သော အခန်းတွင် ခေါ်လျှင်လည်း အမြဲ မတုံ့ပြန်လျှင် အကြားအာရုံ စစ်ဆေးရန် ဆွေးနွေးသင့်သည်။ ဤအချက်တစ်ခုတည်းဖြင့် ရောဂါ သတ်မှတ်၍မရပါ။', 'When deeply absorbed in play she may not turn. But if she consistently does not respond even in a quiet room, a hearing check is worth discussing. No single sign here is a diagnosis.'),
        },
        {
          q: b('ဖုန်း သို့မဟုတ် တီဗီကနေ စကားသင်လို့ ရလား။', 'Can she learn words from a phone or TV?'),
          a: b('ဤအရွယ်တွင် ကလေးများသည် ဖန်သားပြင်ထက် လူတစ်ဦးနှင့် တိုက်ရိုက် ဆက်သွယ်ခြင်းမှသာ စကားလုံးများကို ကောင်းစွာ သင်ယူနိုင်သည်။ ဖန်သားပြင် အသုံးပြုမှုကို လျှော့ချပြီး စကားပြောချိန်ကို တိုးပါ။', 'At this age children learn words far better from live interaction with a person than from a screen. Keep screen use low and talking time high.'),
        },
      ],
      redFlags: [
        b('နာမည်ခေါ်လျှင် လုံးဝ မတုံ့ပြန်ခြင်း။', 'No response at all to her name.'),
        b('ရိုးရှင်းသော စကားလုံး တစ်ခုမျှ နားမလည်ခြင်း။', 'No understanding of any simple everyday word.'),
        b('ယခင်က ရှိခဲ့သော နားလည်မှု သို့မဟုတ် ဆက်သွယ်မှု ပျောက်သွားခြင်း။', 'Loss of understanding or communication she previously had.'),
      ],
      referral: b(
        'ဤအချက်များကို ကျန်းမာရေးဝန်ထမ်းနှင့် ဆွေးနွေးပါ။ စောစီးစွာ စစ်ဆေးခြင်းက အထောက်အကူ ဖြစ်သည်။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ပါ။',
        'Discuss these with a health worker; checking early helps. This is not a diagnosis.',
      ),
      encouragement: b(
        'ကလေးသည် သင်ပြောသည့် စကားလုံးများကို စုဆောင်းနေပါပြီ — ထွက်မလာသေးသော်လည်း အထဲတွင် စုနေပါသည်။',
        'She is already collecting your words, even though they have not come back out yet.',
      ),
    }),
    'Responding to name, understanding common words and the role of adult–child conversational turns follow CDC milestone guidance, the AAP developmental-surveillance report, the NHS learn-to-talk guidance, the language-development textbook and the research on conversational turns and early language in the registry.',
  ),
];

const GUIDES_C: SeedItem[] = [
  kb(
    guide('10_12m', 'cognitive', {
      title: b('၁၀ – ၁၂ လ — အသိဉာဏ် ဖွံ့ဖြိုးမှု လမ်းညွှန်', '10–12 months — Cognitive guide'),
      why: b(
        'ဤအရွယ်တွင် ကလေးသည် မျက်စိရှေ့တွင် မမြင်ရသော်လည်း ပစ္စည်းရှိနေဆဲဖြစ်ကြောင်း ပိုမို ခိုင်မာစွာ နားလည်လာသည်။ ထို့ကြောင့် ဝှက်ထားသော ကစားစရာကို ရှာတတ်ပြီး ပုန်းတမ်းကစားခြင်းကို နှစ်သက်သည်။ တစ်ချိန်တည်းတွင် ခလုတ်နှိပ်လျှင် အသံထွက်ခြင်း၊ ပစ္စည်းပစ်ချလျှင် ကျသွားခြင်းကဲ့သို့ အကြောင်းနှင့် အကျိုးကိုလည်း စမ်းသပ်နေသည်။ ယင်းသည် ဖျက်ဆီးလိုစိတ်ကြောင့် မဟုတ်ဘဲ စူးစမ်းလေ့လာနေခြင်း ဖြစ်သည်။',
        'Object permanence — knowing that something still exists when it is out of sight — becomes firmer now. That is why she searches for a hidden toy and loves peekaboo. At the same time she is testing cause and effect: press this and it makes a noise, drop that and it falls. This is experimentation, not naughtiness.',
      ),
      observationQuestions: [
        b('သင် ဖုံးထားသော ကစားစရာကို ရှာပါသလား။', 'Does she look for a toy you have covered up?'),
        b('ပုန်းတမ်း ကစားလျှင် ရယ်မောပါသလား။', 'Does she laugh at peekaboo?'),
        b('ပစ္စည်းကို ထပ်ခါထပ်ခါ ပစ်ချ၍ ဘာဖြစ်မလဲ ကြည့်ပါသလား။', 'Does she drop things repeatedly to see what happens?'),
        b('ဗူးအဖုံးကို ဖွင့်ရန် ကြိုးစားပါသလား။', 'Does she try to open a lid or container?'),
      ],
      dailyActivities: [
        b('အဝတ်စဖြင့် ကစားစရာကို တစ်ပိုင်း ဖုံးထား၍ ရှာစေပါ။', 'Half-cover a toy with a cloth and let her find it.'),
        b('ပုန်းတမ်း ကစားပါ — မျက်နှာကို လက်ဖြင့် ဖုံး၍ ဖွင့်ပြပါ။', 'Play peekaboo behind your hands.'),
        b('အသံထွက်သော အိမ်သုံးပစ္စည်း (ဇွန်း၊ ဗူး) ဖြင့် အကြောင်းအကျိုး စမ်းစေပါ။', 'Let her make sounds with safe household items to explore cause and effect.'),
      ],
      weeklyActivities: [
        b('ဗူးသုံးလုံးအောက်တွင် ကစားစရာ ဝှက်၍ ရှာစေခြင်း။', 'Hide a toy under one of three cups for her to find.'),
        b('ခွက်များ ထပ်၍ ဖြိုချခြင်း ကစားနည်း လုပ်ခြင်း။', 'Stack cups together and let her knock them down.'),
      ],
      indoor: [
        b('အဝတ်စအောက်တွင် ကလေး၏ လက်ကို ဝှက်၍ ရှာခြင်း။', 'Hiding her own hand under a cloth and finding it.'),
        b('ဗူးထဲ ပစ္စည်း ထည့်၍ လှုပ်ပြီး အသံ နားထောင်ခြင်း။', 'Putting objects in a container, shaking it and listening.'),
      ],
      outdoor: [
        b('အရိပ်အောက်တွင် ဖျာခင်း၍ သဘာဝ ပစ္စည်းများကို ကြီးကြပ်မှုဖြင့် စမ်းစေခြင်း။', 'Exploring safe natural objects on a mat in the shade, closely supervised.'),
      ],
      lowCost: [
        b('အဝတ်စ တစ်ထည်နှင့် ဗူးခွံ ၂–၃ လုံးဖြင့် လုံလောက်သည်။', 'One cloth and two or three empty containers are enough.'),
        b('အလင်းရောင် ထွက်သော ကစားစရာများ မလိုအပ်ပါ။', 'No electronic light-up toys are needed.'),
      ],
      materials: b('အဝတ်စ၊ ဗလာခွက် သို့မဟုတ် ဗူး ၂–၃ လုံး၊ ကစားစရာ တစ်ခု', 'A cloth, two or three cups or containers, one toy'),
      safety: b(
        'ဝှက်ကစားရာတွင် သုံးသော ပစ္စည်းများသည် ပါးစပ်ထဲ မဝင်နိုင်လောက်အောင် ကြီးရမည်။ ပလတ်စတစ်အိတ်ဖြင့် ဝှက်ခြင်းကို လုံးဝ မလုပ်ပါနှင့် (အသက်ရှူ ပိတ်နိုင်သည်)။ ဖန်သားပြင် အသုံးပြုမှုနှင့် ပတ်သက်၍ ကမ္ဘာ့ကျန်းမာရေးအဖွဲ့၏ လမ်းညွှန်ချက်အရ ၁ နှစ်အောက် ကလေးများအတွက် ဖန်သားပြင် ကြည့်ရှုခြင်းကို အကြံမပြုပါ — ဗီဒီယိုဖြင့် ဆွေမျိုးများနှင့် စကားပြောခြင်းသည် ခြွင်းချက် ဖြစ်သည်။ ဤအရွယ်တွင် တိုက်ရိုက် ကစားခြင်းက အလွန် ပိုအကျိုးရှိသည်။',
        'Anything used for hiding games must be too large to fit in her mouth. Never hide things under a plastic bag — it is a suffocation risk. On screens, WHO guidance advises no screen time for children under one year, with video calls to family a reasonable exception. At this age live play is far more useful.',
      ),
      commonMistakes: [
        b('ပစ္စည်းကို အလွန် ခက်ခဲစွာ ဝှက်ခြင်း — မြင်နိုင်သော အစိတ်အပိုင်း ချန်ထားပါ။', 'Hiding things too well — leave part of the object visible.'),
        b('ပစ်ချခြင်းကို ဆူပူတားမြစ်ခြင်း — ၎င်းသည် လေ့လာမှု ဖြစ်သည်။', 'Scolding the dropping game — it is learning.'),
      ],
      parentTips: [
        b('တူညီသော ကစားနည်းကို ထပ်ခါထပ်ခါ ကစားပေးပါ — ထပ်တလဲလဲသည် မှတ်ဉာဏ်ကို ခိုင်မာစေသည်။', 'Repeat the same game many times — repetition builds memory.'),
        b('ကလေး ရှာတွေ့လျှင် အားပေးပါ — ရလဒ်ထက် ကြိုးစားမှုကို ချီးကျူးပါ။', 'Celebrate when she finds it — praise the effort more than the result.'),
      ],
      faq: [
        {
          q: b('တစ်ခုတည်းကို ထပ်ခါထပ်ခါ ကစားနေတယ် — ပုံမှန်လား။', 'She repeats the same game over and over — is that normal?'),
          a: b('လုံးဝ ပုံမှန် ဖြစ်ပါသည်။ ထပ်တလဲလဲ လုပ်ခြင်းက ဦးနှောက်တွင် ပုံစံကို ခိုင်မာစေပြီး ကလေးအား "ငါ ဒါကို တတ်ပြီ" ဟု ခံစားစေသည်။', 'Completely normal. Repetition strengthens the pattern in her brain and gives her the feeling of mastery.'),
        },
        {
          q: b('ပညာပေး ဗီဒီယိုတွေ ကြည့်ခိုင်းသင့်လား။', 'Should I use educational videos?'),
          a: b('၁ နှစ်အောက် ကလေးများသည် ဖန်သားပြင်မှ သင်ယူနိုင်မှု အလွန် နည်းပါသည်။ ထိုအချိန်ကို မိဘနှင့် တိုက်ရိုက် ကစားချိန်အဖြစ် သုံးခြင်းက ပိုအကျိုးရှိသည်။ ဗီဒီယိုခေါ်ဆိုမှုဖြင့် ဆွေမျိုးများနှင့် စကားပြောခြင်းမှာမူ ကွာခြားပါသည်။', 'Under one year, children learn very little from screens. That time is better spent playing directly with you. Video calls with family are different.'),
        },
      ],
      redFlags: [
        b('ဝှက်ထားသော ပစ္စည်းကို လုံးဝ မရှာခြင်း၊ ပတ်ဝန်းကျင်ကို လုံးဝ စိတ်မဝင်စားခြင်း။', 'No searching at all and no interest in her surroundings.'),
        b('ကစားစရာဖြင့် လုံးဝ မကစားခြင်း။', 'No play with objects at all.'),
        b('ယခင်က ရနေသော စွမ်းရည်များ ပျောက်သွားခြင်း။', 'Loss of skills she previously had.'),
      ],
      referral: b(
        'ဤအချက်များကို ကျန်းမာရေးဝန်ထမ်းနှင့် ဆွေးနွေးပါ။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ဘဲ စစ်ဆေးရန် အချက်ပြခြင်းသာ ဖြစ်သည်။',
        'Discuss these with a health worker. This is a prompt to check, not a diagnosis.',
      ),
      encouragement: b(
        'ကလေးသည် နေ့စဉ် စမ်းသပ်မှု ရာပေါင်းများစွာ လုပ်နေပါသည် — သင်၏ ဇွန်းတစ်ချောင်းသည် သူ့အတွက် သုတေသန ကိရိယာ ဖြစ်ပါသည်။',
        'She runs hundreds of little experiments a day — your spoon is her laboratory equipment.',
      ),
    }),
    'Object permanence, hide-and-find play and cause-and-effect exploration at this age follow CDC milestone checklists, AAP milestone guidance, AAP guidance on the power of play and the developmental-behavioural paediatrics textbook, with the screen guidance taken from the AAP media and young minds statement, the Health Canada screen-time guidance and the research on screen use and early language in the registry.',
  ),
  kb(
    guide('10_12m', 'social', {
      title: b('၁၀ – ၁၂ လ — လူမှုဆက်ဆံရေး လမ်းညွှန်', '10–12 months — Social guide'),
      why: b(
        'ဤအရွယ်တွင် ကလေးသည် လက်ပြခြင်း၊ လက်ခုပ်တီးခြင်းနှင့် မျက်နှာအမူအရာများကို လူကြီးထံမှ တုပရန် အလွန် စိတ်ဝင်စားလာသည်။ စိတ်ဝင်စားဖွယ်အရာတစ်ခုကို မြင်လျှင် ထိုအရာနှင့် လူကြီးကို အပြန်အလှန် ကြည့်ပြီး အာရုံစိုက်မှုကို မျှဝေတတ်လာသည်။ ယင်းသည် နောင်တွင် ဘာသာစကားနှင့် လူမှုဆက်ဆံရေး ဖွံ့ဖြိုးရန် အရေးကြီးသော အခြေခံတစ်ခု ဖြစ်သည်။',
        'Copying adults becomes a favourite activity — waving, clapping, copying faces. She now looks from an interesting thing back to you, sharing it: joint attention. That shared looking is a foundation for later language and social skills.',
      ),
      observationQuestions: [
        b('သင် လက်ပြလျှင် ပြန်လက်ပြပါသလား။', 'Does she wave back when you wave?'),
        b('တစ်ခုခုကို မြင်လျှင် သင့်ဘက် လှည့်ကြည့်ပါသလား။', 'Does she look back at you when she sees something interesting?'),
        b('သင့်ကို ပစ္စည်းတစ်ခု ပြပါသလား သို့မဟုတ် ပေးပါသလား။', 'Does she show or hand you an object?'),
        b('ရိုးရှင်းသော ကစားနည်းများတွင် အလှည့်ကျ ပါဝင်ပါသလား။', 'Does she take turns in simple games?'),
      ],
      dailyActivities: [
        b('လက်ပြခြင်း၊ လက်ခုပ်တီးခြင်းကို နေ့စဉ် အတူတူ လုပ်ပါ။', 'Wave and clap together every day.'),
        b('ကလေး ပြသည့်ပစ္စည်းကို စိတ်ဝင်စားစွာ ကြည့်ပြီး ထိုပစ္စည်း၏ အမည်ကို ပြောပေးပါ။', 'When she shows you something, look at it with interest and name it.'),
        b('ရိုးရှင်းသော အလှည့်ကျ ကစားနည်း — သင် တစ်လှည့်၊ ကလေး တစ်လှည့်။', 'Play simple turn-taking games — your turn, her turn.'),
      ],
      weeklyActivities: [
        b('မိသားစုဝင်များနှင့် အတူ ကစားချိန် စီစဉ်ပါ။', 'Arrange play time with other family members.'),
        b('အခြားကလေးများနှင့် အနီးအနားတွင် ကစားခွင့် ပေးပါ (ကြီးကြပ်မှုဖြင့်)။', 'Let her play near other children, supervised.'),
      ],
      indoor: [
        b('ပုန်းတမ်းနှင့် လက်ခုပ်သီချင်း ကစားခြင်း။', 'Peekaboo and clapping songs.'),
        b('မှန်ရှေ့တွင် မျက်နှာအမူအရာ တုပခြင်း။', 'Copying faces in front of a mirror.'),
      ],
      outdoor: [
        b('အိမ်နီးချင်းများကို လက်ပြ နှုတ်ဆက်ခြင်း။', 'Waving hello and goodbye to neighbours.'),
      ],
      lowCost: [
        b('လက်ခုပ်၊ လက်ပြ၊ သီချင်း — ပစ္စည်း လုံးဝ မလိုပါ။', 'Clapping, waving and songs need no materials at all.'),
      ],
      materials: b('မလို', 'None'),
      safety: b(
        'ကလေးအား မသိသောသူထံ အတင်း အပ်မပေးပါနှင့် — စိမ်းသူကို သတိထားခြင်းသည် ဤအရွယ်တွင် ပုံမှန် ဖြစ်သည်။ အခြားကလေးများနှင့် ကစားစဉ် ကစားစရာ ငယ်လွန်းသည်များ မရှိစေရန် စစ်ဆေးပါ။ ဖျားနာနေသော ကလေးများနှင့် နီးကပ်စွာ ကစားခြင်းကို ရှောင်ပါ။ ကလေးများ အတူတူ ရှိစဉ် လူကြီး တစ်ဦး အမြဲ ကြည့်ရှုပေးပါ။',
        'Do not force her into a stranger’s arms — wariness of unfamiliar people is normal now. Check that toys used around other children are not small enough to choke on. Avoid close play with children who are unwell. Keep an adult watching whenever children play together.',
      ),
      commonMistakes: [
        b('"ရှက်တတ်တဲ့ကလေး" ဟု တံဆိပ်ကပ်ခြင်း — အချိန်ပေး၍ ယုံကြည်မှု တည်ဆောက်ပါ။', 'Labelling her "the shy one" — give time and build trust instead.'),
        b('တုပမှု မလုပ်လျှင် အတင်း ခိုင်းစေခြင်း။', 'Forcing her to perform a wave or clap on demand.'),
      ],
      parentTips: [
        b('ကလေး၏ တုပမှုကို ပြန်တုပေးပါ — နှစ်ဖက် အလှည့်ကျ ဖြစ်လာသည်။', 'Copy her back — it turns into a two-way exchange.'),
        b('အသစ်သော လူများနှင့် တွေ့ရာတွင် သင့်ဘေးတွင် ခဏ ထားပေးပါ။', 'With new people, let her stay beside you for a while first.'),
      ],
      faq: [
        {
          q: b('စိမ်းသူတွေ့ရင် အလွန် ငိုတယ် — ပြဿနာလား။', 'She cries a lot around strangers — is something wrong?'),
          a: b('မဟုတ်ပါ။ ဤအရွယ်တွင် စိမ်းသူကို သတိထားခြင်းသည် ပုံမှန်ဖြစ်ပြီး မိဘနှင့် ခိုင်မာသော ချစ်ခင်မှု ရှိကြောင်း ပြသသည်။ အချိန်ပေးပါ၊ အနီးတွင် ရှိပေးပါ။', 'No. Stranger wariness is normal now and reflects a strong attachment to you. Give it time and stay close.'),
        },
        {
          q: b('လက်ပြခြင်း မလုပ်တတ်သေးဘူး — စိုးရိမ်ရလား။', 'She does not wave yet — should I be worried?'),
          a: b('အမူအရာများသည် ကလေးတစ်ဦးနှင့်တစ်ဦး အချိန် ကွာခြားနိုင်သည်။ သို့သော် ၁၂ လတွင် လက်ပြခြင်း၊ လက်ညှိုးထိုးပြခြင်း၊ ပြသခြင်း စသည့် အမူအရာ လုံးဝ မရှိလျှင် ကျန်းမာရေးဝန်ထမ်းနှင့် ဆွေးနွေးပါ။ ဤအချက်တစ်ခုတည်းဖြင့် ရောဂါ သတ်မှတ်၍မရပါ။', 'Gestures appear at different times. But if there are no gestures at all — no waving, pointing or showing — by 12 months, discuss it with a health worker. No single sign here is a diagnosis.'),
        },
      ],
      redFlags: [
        b('မျက်လုံးချင်း ဆိုင်ကြည့်မှု အလွန် နည်းခြင်း။', 'Very little eye contact.'),
        b('ပြုံးပြခြင်း သို့မဟုတ် အမူအရာ တုပခြင်း လုံးဝ မရှိခြင်း။', 'No social smiling and no copying at all.'),
        b('ယခင်က ရှိခဲ့သော လူမှုဆက်ဆံမှု ပျောက်သွားခြင်း။', 'Loss of social skills she previously had.'),
      ],
      referral: b(
        'ဤအချက်များကို ကလေးဆရာဝန် သို့မဟုတ် ကျန်းမာရေးဝန်ထမ်းနှင့် ဆွေးနွေးပါ။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ပါ။',
        'Discuss these with a paediatrician or health worker. This is not a diagnosis.',
      ),
      encouragement: b(
        'ကလေးက သင့်ကို လှည့်ကြည့်တိုင်း "ငါ့အတွက် သင် အရေးကြီးတယ်" ဟု ပြောနေခြင်း ဖြစ်ပါသည်။',
        'Every time she looks back at you, she is saying that you matter to her.',
      ),
    }),
    'Imitation, waving, turn-taking games and shared attention at 10–12 months follow CDC and AAP milestone guidance, the Nurturing Care Framework, the NICE social and emotional wellbeing guidance and AAP guidance on the power of play in the registry.',
  ),
];

const GUIDES_D: SeedItem[] = [
  kb(
    guide('10_12m', 'emotional', {
      title: b('၁၀ – ၁၂ လ — စိတ်ခံစားမှု ဖွံ့ဖြိုးမှု လမ်းညွှန်', '10–12 months — Emotional guide'),
      why: b(
        'ဤအရွယ်တွင် ကလေး၏ ခံစားချက်များ ပိုမိုပြင်းထန်လာပြီး မိဘနှင့် ခွဲခွာရမည်ကို စိုးရိမ်မှုလည်း များလာတတ်သည်။ ကလေးသည် မိမိကိုယ်ကို အပြည့်အဝ မတည်ငြိမ်စေနိုင်သေးသဖြင့် ပြုစုစောင့်ရှောက်သူက ပွေ့ဖက်ခြင်း၊ နူးညံ့စွာ ပြောခြင်းနှင့် အနီးတွင် ရှိပေးခြင်းတို့ဖြင့် ကူညီပေးရသည်။ နွေးထွေးပြီး တည်ငြိမ်စွာ တုံ့ပြန်ပေးသည့် ပြုစုစောင့်ရှောက်မှုသည် ကလေး၏ စိတ်ခံစားမှု ဖွံ့ဖြိုးရေးအတွက် အရေးကြီးသည်။',
        'Feelings run stronger now and separation anxiety often peaks. She cannot calm herself yet — she borrows an adult’s steadiness to settle, which is called co-regulation. Warm, predictable, responsive care is what builds her emotional foundation.',
      ),
      observationQuestions: [
        b('စိတ်ဆိုးလျှင် သင့်ထံ လာပြီး နှစ်သိမ့်မှု ရှာပါသလား။', 'Does she come to you for comfort when upset?'),
        b('နှစ်သိမ့်ပေးလျှင် တဖြည်းဖြည်း ငြိမ်သွားပါသလား။', 'Does she gradually settle when comforted?'),
        b('ပျော်ရွှင်မှု၊ အံ့သြမှု၊ စိတ်ဆိုးမှု စသည့် ခံစားချက် အမျိုးမျိုး ပြသပါသလား။', 'Does she show a range of feelings — joy, surprise, frustration?'),
        b('သင် ပြန်လာလျှင် ဝမ်းသာပါသလား။', 'Is she pleased when you come back?'),
      ],
      dailyActivities: [
        b('ငိုလျှင် အနီးသို့ သွား၍ ငြိမ်သက်သော အသံဖြင့် ပြောပေးပါ။', 'Go to her when she cries and speak in a calm voice.'),
        b('ကလေး၏ ခံစားချက်ကို စကားလုံးဖြင့် ဖော်ပြပေးပါ — “စိတ်ဆိုးနေတာလား”၊ “ပျော်နေတယ်နော်”။', 'Name the feeling — "you are cross", "you are happy".'),
        b('ထွက်သွားရာတွင် အမြဲ တူညီသော နှုတ်ဆက်စကား သုံးပါ။', 'Use the same short goodbye every time you leave.'),
      ],
      weeklyActivities: [
        b('တည်ငြိမ်သော ချစ်ခင်မှု ကစားနည်း — ဖက်ခြင်း၊ ချီခြင်း၊ သီချင်းဆိုခြင်း။', 'Gentle connection time — cuddling, carrying, singing.'),
        b('မိဘ ကိုယ်တိုင်အတွက် နားချိန် အနည်းငယ် စီစဉ်ပါ။', 'Plan a little rest time for yourself as a parent.'),
      ],
      indoor: [
        b('ကလေး၏ ခံစားချက်ကို လိုက်၍ အသံ အနိမ့်အမြင့် ချိန်ပြောခြင်း။', 'Matching your voice gently to her mood.'),
        b('ပုန်းတမ်း ကစားခြင်း — ခဏ ပျောက်ပြီး ပြန်လာခြင်းကို လေ့ကျင့်ပေးသည်။', 'Peekaboo — practice for going away and coming back.'),
      ],
      outdoor: [
        b('အေးချမ်းသော နေရာတွင် အတူ လမ်းလျှောက်ခြင်း။', 'A quiet walk together.'),
      ],
      lowCost: [
        b('ဖက်ခြင်း၊ သီချင်းဆိုခြင်း၊ အနီးတွင် ရှိပေးခြင်းသည် အခမဲ့ ဖြစ်သည်။', 'Holding, singing and simply being near cost nothing.'),
      ],
      materials: b('မလို', 'None'),
      safety: b(
        'ကလေးအား လှုပ်ခါခြင်းကို လုံးဝ မလုပ်ပါနှင့် — ဦးနှောက် ထိခိုက်နိုင်ပြီး အသက်အန္တရာယ် ရှိသည်။ ငိုသံ မရပ်၍ သင် အလွန် ပင်ပန်းလျှင် ကလေးကို လုံခြုံသော နေရာ (ခုတင် သို့မဟုတ် ကလေးအိပ်ရာ) တွင် ပက်လက် ချထားပြီး ခဏ ထွက်၍ အသက်ရှူပါ — ပြီးမှ ပြန်လာပါ။ မိဘ၏ စိတ်ဓာတ်ကျခြင်း သို့မဟုတ် စိုးရိမ်ပူပန်မှုသည် နှစ်ပတ်ထက် ကြာနေလျှင် ကျန်းမာရေးဝန်ထမ်းနှင့် ဆွေးနွေးပါ — ကုသမှု ရနိုင်ပါသည်။',
        'Never shake a baby — it can cause serious brain injury and death. If crying overwhelms you, put her down safely on her back in a cot or bed, step away and breathe, then come back. If low mood or anxiety in a parent lasts more than two weeks, talk to a health worker — support and treatment are available.',
      ),
      commonMistakes: [
        b('ငိုသံကို "အလိုလိုက်လွန်းမှာစိုးလို့" ဟု လျစ်လျူရှုခြင်း — ဤအရွယ်တွင် နှစ်သိမ့်ပေးခြင်းက အလိုလိုက်ခြင်း မဟုတ်ပါ။', 'Ignoring cries for fear of spoiling — comforting a baby this age is not spoiling.'),
        b('တိတ်တဆိတ် ထွက်သွားခြင်း — နှုတ်ဆက်ပြီး ထွက်ခြင်းက ပိုကောင်းသည်။', 'Slipping away without saying goodbye — a short goodbye works better.'),
      ],
      parentTips: [
        b('သင် တည်ငြိမ်လျှင် ကလေးလည်း ပိုမြန်မြန် တည်ငြိမ်သည်။', 'When you are calm, she settles faster.'),
        b('ကူညီမည့်သူ ရှိလျှင် အကူအညီ တောင်းပါ — မိဘ၏ အနားယူချိန်သည် ကလေးအတွက်လည်း ကောင်းသည်။', 'Ask for help if you can — your rest is also good for her.'),
      ],
      faq: [
        {
          q: b('ငိုတိုင်း ချီရင် အလိုလိုက်လွန်းရာ ရောက်မလား။', 'Will picking her up every time spoil her?'),
          a: b('မရောက်ပါ။ ဤအရွယ်တွင် ကလေးသည် လူကြီး၏ အကူအညီဖြင့်သာ စိတ်ကို ပြန်တည်ငြိမ်စေနိုင်သည်။ တုံ့ပြန်မှု မြန်ဆန်ခြင်းက နောင်တွင် ကလေး ကိုယ်တိုင် စိတ်ကို ထိန်းနိုင်ရန် အခြေခံ ဖြစ်သည်။', 'No. At this age she can only settle with adult help. Responding quickly now builds her later ability to manage feelings herself.'),
        },
        {
          q: b('မိဘဖြစ်တဲ့ ကျွန်မ ကိုယ်တိုင် စိတ်ဓာတ်ကျနေရင် ဘယ်လိုလုပ်ရမလဲ။', 'What if I as a parent feel low?'),
          a: b('မိဘ၏ စိတ်ကျန်းမာရေးသည် ကလေး၏ ဖွံ့ဖြိုးမှုအတွက် အလွန် အရေးကြီးပါသည်။ ခံစားချက်များ နှစ်ပတ်ထက် ကြာနေလျှင် ကျန်းမာရေးဝန်ထမ်းနှင့် ဆွေးနွေးပါ။ ဤသည် အားနည်းချက် မဟုတ်ပါ — အကူအညီ ရနိုင်ပါသည်။', 'Parent mental health matters a great deal for a child’s development. If feelings last more than two weeks, talk to a health worker. This is not a weakness — help is available.'),
        },
      ],
      redFlags: [
        b('နှစ်သိမ့်၍ လုံးဝ မရနိုင်အောင် ကြာရှည် ငိုခြင်း။', 'Crying that cannot be soothed at all.'),
        b('လူကြီးများနှင့် ဆက်သွယ်မှု လုံးဝ မရှိခြင်း သို့မဟုတ် ခံစားချက် လုံးဝ မပြသခြင်း။', 'No interest in connecting with adults, or no expressed feelings at all.'),
        b('မိဘ၏ စိတ်ဓာတ်ကျမှု သို့မဟုတ် ကလေးအား ထိခိုက်စေမည့် အတွေးများ ပေါ်လာခြင်း။', 'A parent’s low mood, or thoughts of harming themselves or the baby.'),
      ],
      referral: b(
        'ဤအချက်များကို ကျန်းမာရေးဝန်ထမ်းနှင့် အမြန်ဆုံး ဆွေးနွေးပါ။ မိမိကိုယ်ကို သို့မဟုတ် ကလေးအား ထိခိုက်စေမည့် အတွေးများ ရှိပါက ချက်ချင်း အကူအညီ တောင်းပါ။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ပါ။',
        'Raise these with a health worker promptly. If there are thoughts of harming yourself or the baby, seek help immediately. This is not a diagnosis.',
      ),
      encouragement: b(
        'သင် အနီးတွင် ရှိပေးခြင်းသည် ကလေးအတွက် အကောင်းဆုံး စိတ်ခံစားမှု ကာကွယ်မှု ဖြစ်ပါသည်။',
        'Your steady presence is the strongest emotional protection she has.',
      ),
    }),
    'Co-regulation, peak separation anxiety and the place of responsive care follow the AAP report on early relational health and toxic stress, the Nurturing Care Framework, the NICE postnatal care guideline, the NICE social and emotional wellbeing guidance and the general paediatrics textbook in the registry.',
  ),
  kb(
    guide('10_12m', 'self_help', {
      title: b('၁၀ – ၁၂ လ — ကိုယ်တိုင် လုပ်ဆောင်နိုင်မှု လမ်းညွှန်', '10–12 months — Self-help guide'),
      why: b(
        'ဤအရွယ်တွင် ကလေးသည် ကိုယ်တိုင် စားသောက်ရန် စိတ်ဝင်စားလာတတ်သည်။ လက်ဖြင့် အစာကောက်စားခြင်း၊ ဇွန်းကို ကိုင်ကြည့်ခြင်းနှင့် အဖုံးမပါသော ခွက်ဖြင့် သောက်ကြည့်ခြင်းတို့ကို စတင်နိုင်သည်။ အစာစားရာတွင် ရှုပ်ပွနိုင်သော်လည်း ယင်းအတွေ့အကြုံများက လက်ချောင်းလှုပ်ရှားမှု၊ ကိုယ်တိုင်ရွေးချယ်နိုင်မှုနှင့် ဗိုက်ပြည့်မှုကို သိရှိတတ်လာစေရန် ကူညီပေးသည်။ သွားစတင်ပေါက်လာချိန်ဖြစ်သဖြင့် ခံတွင်းသန့်ရှင်းရေးကိုလည်း စတင်ပေးသင့်သည်။',
        'She now wants to do things herself — picking up finger foods, holding a spoon, sipping from an open cup. It will be messy, but it trains hand skills, choice-making and her own sense of fullness. Teeth are usually appearing too, so oral care starts now.',
      ),
      observationQuestions: [
        b('လက်ဖြင့် အစာကို ကိုယ်တိုင် ကောက်စားပါသလား။', 'Does she pick up food and feed herself?'),
        b('ဖွင့်ထားသော ခွက်ဖြင့် သောက်ကြည့်ပါသလား။', 'Does she try to drink from an open cup?'),
        b('အဝတ်ဝတ်ပေးစဉ် လက်ကို ဆန့်ပေးခြင်း ကဲ့သို့ ပူးပေါင်းပါသလား။', 'Does she help by holding out an arm when dressing?'),
        b('သွား စတင် ပေါက်လာပါပြီလား။', 'Have her first teeth come through?'),
      ],
      dailyActivities: [
        b('တစ်နေ့လျှင် တစ်ကြိမ် ကိုယ်တိုင် စားခွင့် ပေးပါ — ရှုပ်ပွမှုကို လက်ခံပါ။', 'Allow at least one self-feeding meal a day and accept the mess.'),
        b('ရေကို ဖွင့်ထားသော ခွက်ငယ်ဖြင့် တိုက်ပါ — အနည်းငယ်စီ ထည့်ပါ။', 'Offer water in a small open cup, a little at a time.'),
        b('သွား ပေါက်လာလျှင် နေ့စဉ် နှစ်ကြိမ် ပျော့သော သွားတိုက်တံဖြင့် တိုက်ပေးပါ။', 'Once teeth appear, brush twice a day with a soft brush.'),
      ],
      weeklyActivities: [
        b('မိသားစုနှင့် အတူ စားပွဲတွင် ထိုင်စားခြင်း — တုပရန် အခွင့်အရေး ဖြစ်သည်။', 'Eat together as a family so she can copy.'),
        b('ဇွန်းကိုင်ခြင်းကို လေ့ကျင့်ခွင့် ပေးပါ (ရလဒ် မမျှော်လင့်ဘဲ)။', 'Let her hold a spoon to practise, without expecting success.'),
      ],
      indoor: [
        b('ဇွန်းနှစ်ချောင်း — တစ်ချောင်း ကလေးအတွက်၊ တစ်ချောင်း မိဘအတွက်။', 'Two spoons — one for her, one for you.'),
        b('ဖျာခင်း၍ ကြမ်းပြင်ပေါ်တွင် စားခြင်း — ရှင်းရလွယ်သည်။', 'Eating on a mat that is easy to clean.'),
      ],
      outdoor: [
        b('အရိပ်တွင် အတူ ထိုင်၍ ရေသောက်လေ့ကျင့်ခြင်း။', 'Practising cup drinking sitting in the shade.'),
      ],
      lowCost: [
        b('ပလတ်စတစ်ခွက်ငယ်နှင့် ဇွန်းသည် လုံလောက်သည်။', 'A small plastic cup and a spoon are enough.'),
        b('သွားတိုက်ရန် ပျော့သော အဝတ်စဖြင့်လည်း စတင်နိုင်သည်။', 'A soft clean cloth can be used to start cleaning teeth.'),
      ],
      materials: b('ခွက်ငယ်၊ ဇွန်း၊ ပျော့သော သွားတိုက်တံ', 'A small cup, a spoon, a soft toothbrush'),
      safety: b(
        'ကလေး စားနေစဉ် အမြဲ အနီးကပ်ကြီးကြပ်ပြီး မတ်မတ်ထိုင်စေပါ။ လမ်းလျှောက်နေစဉ် သို့မဟုတ် ကားစီးနေစဉ် မစားစေပါနှင့်။ အသက်ရှူလမ်းကြောင်း ပိတ်ဆို့စေနိုင်သော အခွံမာသီးလုံး၊ ပဲစေ့လုံး၊ စပျစ်သီးလုံး၊ ချယ်ရီသီးလုံး၊ ပြောင်းဖူးပေါက်ပေါက်၊ သကြားလုံးမာ၊ ဝက်အူချောင်းအဝိုင်း၊ ငါးရိုးပါသောအသားနှင့် မာသော ဟင်းသီးဟင်းရွက်အတုံးများကို မပေးပါနှင့်။ စပျစ်သီးနှင့် ချယ်ရီသီးကို အလျားလိုက် လေးစိတ်ခွဲပေးပါ။ မွေးကင်းစကလေး ဘိုကျူလစ်ဇင် အန္တရာယ်ကြောင့် အသက် ၁၂ လမပြည့်မီ ပျားရည် မပေးပါနှင့်။ အသက် ၁၂ လမပြည့်မီ နွားနို့ကို အဓိကသောက်စရာအဖြစ် မပေးသင့်သော်လည်း ချက်ပြုတ်ရာတွင် အနည်းငယ် ထည့်သုံးနိုင်သည်။ ဆားနှင့် သကြား ထပ်မထည့်ပါနှင့်။ သွားတိုက်ဆေးသုံးပါက ဆန်စေ့ပမာဏခန့်သာ သုံးပါ။ အိပ်ရာဝင်ချိန်တွင် နို့ဗူး သို့မဟုတ် နို့ခွက်ကို ပါးစပ်တွင် တပ်ထားပေးခြင်းက သွားပိုးစားစေနိုင်သဖြင့် ရှောင်ပါ။',
        'Always supervise eating, keep her sitting upright, and never let her eat while walking or in a moving vehicle. Avoid choking foods — whole nuts, whole beans, whole grapes, whole cherries, popcorn, hard sweets, sausage rounds, fish with bones, and hard raw vegetable chunks. Quarter grapes and cherries lengthways. Never give honey before 12 months (risk of infant botulism). Do not give cow’s milk as a main drink before 12 months, though small amounts in cooking are fine. Add no salt or sugar. If using toothpaste, use only a rice-grain smear. Avoid leaving her with a bottle or cup of milk at bedtime — it can contribute to tooth decay.',
      ),
      commonMistakes: [
        b('ရှုပ်ပွမည် စိုးရိမ်၍ ကိုယ်တိုင် စားခွင့် မပေးခြင်း။', 'Not letting her self-feed because of the mess.'),
        b('ချောင်းဆိုးခြင်းနှင့် အစာတစ်ဆို့၍ အသက်ရှူလမ်းကြောင်း ပိတ်ခြင်းကို တူညီသည်ဟု မယူဆပါနှင့်။ ကလေးက အသံထွက်၍ အားကောင်းစွာ ချောင်းဆိုးနိုင်သေးပါက အနီးကပ်စောင့်ကြည့်ပြီး ချောင်းဆိုးထုတ်ခွင့်ပေးပါ။ အသံမထွက်နိုင်၊ အသက်မရှူနိုင် သို့မဟုတ် ပြာလာပါက အရေးပေါ် အစာတစ်ဆို့ ရှေးဦးပြုစုနည်းကို ချက်ချင်းလုပ်ပြီး အရေးပေါ်အကူအညီ တောင်းပါ။ အစာစားတိုင်း သို့မဟုတ် မကြာခဏ ချောင်းဆိုးပါက ကျန်းမာရေးဝန်ထမ်းနှင့် ပြသပါ။', 'Do not treat coughing and complete airway blockage as the same thing. If the child can make sound and cough forcefully, watch closely and let them cough. If the child cannot make sound or breathe, or turns blue, start emergency choking first aid and get emergency help immediately. If coughing happens at every feed or often, seek assessment from a health worker.'),
      ],
      parentTips: [
        b('အစာကို ကလေး၏ လက်ညှိုးအရွယ် အရှည်လိုက် ဖြတ်ပေးပါ — ကိုင်ရလွယ်ပြီး ပိုလုံခြုံသည်။', 'Cut food into finger-length strips — easier to hold and safer.'),
        b('ကလေး အစာသီးပြီး အသက်ရှူလမ်းကြောင်း ပိတ်ဆို့သည့်အခါ လုပ်ဆောင်ရမည့် ရှေးဦးပြုစုနည်းကို ကြိုတင်လေ့လာထားပါ။', 'Learn basic infant choking first aid in advance.'),
      ],
      faq: [
        {
          q: b('ကလေးကို ကိုယ်တိုင်စားခိုင်းလျှင် အစာသီးမှာ စိုးရိမ်ပါတယ်။', 'I am afraid she will choke if she feeds herself.'),
          a: b('စိုးရိမ်မှုသည် သဘာဝ ဖြစ်ပါသည်။ လုံခြုံရေး၏ အဓိကမှာ အစာ၏ ပုံသဏ္ဌာန်နှင့် ကြီးကြပ်မှု ဖြစ်သည် — ပျော့ပြီး လက်ဖြင့် ဖိလျှင် ကြေသော အစာကို အရှည်လိုက် ဖြတ်ပေးပါ၊ မတ်မတ် ထိုင်စေပါ၊ အနားတွင် အမြဲ ရှိပါ။', 'That worry is natural. Safety comes from food shape and supervision — offer soft foods that squash between your fingers, cut into strips, keep her sitting upright, and stay with her.'),
        },
        {
          q: b('ဘယ်အချိန်မှာ နွားနို့ စတိုက်လို့ ရမလဲ။', 'When can she start cow’s milk?'),
          a: b('နွားနို့ကို အဓိက သောက်စရာအဖြစ် ၁၂ လပြည့်ပြီးမှသာ စတိုက်သင့်သည်။ ထိုအချိန်အထိ မိခင်နို့ သို့မဟုတ် သင့်တော်သော နို့မှုန့်သည် အဓိက ဖြစ်ပြီး ရေကို ခွက်ဖြင့် တိုက်နိုင်သည်။', 'Cow’s milk as a main drink should wait until 12 months. Until then breast milk or appropriate formula remains the main milk, with water offered in a cup.'),
        },
      ],
      redFlags: [
        b('အစာစားစဉ် ခဏခဏ ချောင်းဆိုးခြင်း၊ တံတွေးမျို ခက်ခဲခြင်း၊ အသက်ရှူ ခက်ခဲခြင်း။', 'Frequent coughing or choking with feeds, difficulty swallowing, or breathing trouble when eating.'),
        b('ပါးစပ်ထဲ အစာ ထည့်ခြင်းကို လုံးဝ ငြင်းဆန်ခြင်း သို့မဟုတ် ကိုယ်အလေးချိန် မတိုးခြင်း။', 'Refusing all food into the mouth, or not gaining weight.'),
        b('သွားများတွင် အဖြူ သို့မဟုတ် အညိုကွက်များ ပေါ်လာခြင်း။', 'White or brown patches appearing on the teeth.'),
      ],
      referral: b(
        'ဤအချက်များကို ကလေးဆရာဝန် သို့မဟုတ် ကျန်းမာရေးဝန်ထမ်းနှင့် ဆွေးနွေးပါ။ အစာမျိုချရန် ခက်ခဲမှုကို စောစီးစွာ စစ်ဆေးသင့်သည်။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ပါ။',
        'Discuss these with a paediatrician or health worker; swallowing difficulty should be checked early. This is not a diagnosis.',
      ),
      encouragement: b(
        'ရှုပ်ပွသော အစာစားချိန်တိုင်းသည် ကလေး ကိုယ်တိုင် လုပ်တတ်လာရန် လေ့ကျင့်ချိန် ဖြစ်ပါသည်။',
        'Every messy meal is practice at doing it herself.',
      ),
    }),
    'Self-feeding, open-cup practice and early oral care at 10–12 months follow the paediatric occupational-therapy reference, the Bright Futures preventive-care schedule, the WHO infant and young child feeding model chapter and the CDC foods and drinks guidance for 6–24 months, with the tooth-brushing and decay-prevention points from the AAP oral-health guidance and the WHO report on ending childhood dental caries, and the feeding and swallowing cautions from the ASHA practice portal.',
  ),
];

const GUIDES_E: SeedItem[] = [
  kb(
    guide('10_12m', 'play', {
      title: b('၁၀ – ၁၂ လ — ကစားခြင်းနှင့် အိမ်တွင်း ဘေးကင်းရေး လမ်းညွှန်', '10–12 months — Play and home-safety guide'),
      why: b(
        'ကစားခြင်းသည် ဤအရွယ်၏ အဓိက သင်ယူနည်း ဖြစ်သည်။ ကလေးသည် ရွေ့လျားနိုင်လာသည်နှင့်အမျှ ကစားနယ်ပယ် ကျယ်လာပြီး အိမ်တွင်း အန္တရာယ်များနှင့်လည်း ပိုနီးလာသည်။ ထို့ကြောင့် ကြမ်းပြင်ပေါ် လုံခြုံစွာ ကစားနိုင်ရန် ပတ်ဝန်းကျင်ကို ပြင်ဆင်ပေးခြင်းသည် ကလေးကို အမြဲ တားမြစ်ခြင်းထက် ပိုထိရောက်သည်။ "မလုပ်နဲ့" ဟု အကြိမ် ၅၀ ပြောရမည့်အစား အခန်းကို လုံခြုံအောင် ပြင်လိုက်ခြင်းက ကလေးကိုလည်း လွတ်လပ်စွာ လေ့လာခွင့် ပေးသည်။',
        'Play is how she learns now. As she becomes mobile her play area widens and she comes closer to household hazards, so preparing the environment works better than constant prohibition. Instead of saying "no" fifty times, make the room safe and let her explore.',
      ),
      observationQuestions: [
        b('ကြမ်းပြင်ပေါ်တွင် လွတ်လပ်စွာ ကစားရန် နေရာ ရှိပါသလား။', 'Is there clear floor space for free play?'),
        b('ကလေး၏ အမြင့်အထိ လက်လှမ်းမီရာတွင် အန္တရာယ်ရှိသော ပစ္စည်း ရှိပါသလား။', 'Is anything hazardous within her new reach?'),
        b('ကလေးသည် ပစ္စည်းအမျိုးမျိုးဖြင့် စမ်းသပ် ကစားပါသလား။', 'Does she explore a variety of objects?'),
        b('ကစားရင်း သင့်ဘက် လှည့်ကြည့်၍ မျှဝေပါသလား။', 'Does she look back at you to share the play?'),
      ],
      dailyActivities: [
        b('နေ့စဉ် ကြမ်းပြင်ပေါ်တွင် အတူ ကစားချိန် ယူပါ။', 'Take daily floor-play time together.'),
        b('ကလေး ရွေးသော ကစားနည်းကို လိုက်ကစားပါ — ဦးဆောင်ခွင့် ပေးပါ။', 'Follow her lead in play rather than directing it.'),
        b('ကစားပြီးလျှင် အတူတူ သိမ်းဆည်းခြင်းကို လေ့ကျင့်ပါ။', 'Tidy up together afterwards.'),
      ],
      weeklyActivities: [
        b('တစ်ပတ်လျှင် တစ်ကြိမ် အိမ်တွင်း ဘေးကင်းရေး လမ်းလျှောက် စစ်ဆေးမှု လုပ်ပါ — ကလေး၏ အမြင့်မှ ကြည့်ပါ။', 'Once a week, do a home-safety walk-through at her eye level.'),
        b('ကစားစရာများကို လှည့်ပြောင်း ပေးပါ — အသစ်လို ခံစားရသည်။', 'Rotate the toys so they feel new again.'),
      ],
      indoor: [
        b('ခေါင်းအုံးဖြင့် တွားကျော်ရန် လမ်းကြောင်း ဖန်တီးခြင်း။', 'A pillow path to crawl over.'),
        b('ဗူးထဲ ပစ္စည်း ထည့်-ထုတ် ကစားခြင်း။', 'In-and-out container play.'),
      ],
      outdoor: [
        b('အရိပ်ရှိ၊ သန့်ရှင်းသော နေရာတွင် ဖျာခင်း၍ ကစားခြင်း။', 'Mat play in a clean, shaded spot.'),
      ],
      lowCost: [
        b('ဗူးခွံ၊ ခွက်၊ အဝတ်စများသည် အကောင်းဆုံး ကစားစရာ ဖြစ်သည်။', 'Empty containers, cups and cloths make the best toys.'),
        b('ကစားစရာ များများ မလိုပါ — မိဘနှင့် အတူ ကစားချိန်က ပိုအရေးကြီးသည်။', 'Many toys are not needed — your time playing together matters more.'),
      ],
      materials: b('ဖျာ၊ ဗူးခွံ၊ ခွက်၊ အဝတ်စ၊ ပျော့သော ဘောလုံး', 'A mat, empty containers, cups, cloths, a soft ball'),
      safety: b(
        'အိမ်တွင်း ဘေးကင်းရေး စစ်ဆေးရန် — လှေကား အထက်နှင့် အောက်တွင် တံခါးကာ တပ်ပါ။ မှီ၍ လဲနိုင်သော စင်၊ စားပွဲ၊ တီဗီများကို နံရံနှင့် တွယ်ထားပါ။ ပြတင်းပေါက်များကို ပိတ်ထားပါ သို့မဟုတ် ကာရံပါ၊ ပြတင်းပေါက်အောက်တွင် တက်နိုင်သော ပရိဘောဂ မထားပါနှင့်။ လိုက်ကာကြိုးများကို အမြင့်တွင် ချည်ပါ။ မီးပလပ်ပေါက်များကို ပိတ်ပါ၊ မီးကြိုးများကို ဖုံးထားပါ။ ရေပုံး၊ ရေချိုးကန်၊ ရေအိုးများကို ဗလာထားပါ သို့မဟုတ် အဖုံးပိတ်ပါ — ရေနည်းနည်းဖြင့်ပင် ရေနစ်နိုင်သည်၊ ရေအနီးတွင် ကလေးအား ခဏမျှ တစ်ယောက်တည်း မထားပါနှင့်။ မီးဖို၊ ရေနွေး၊ မီးပူ၊ ဖယောင်းတိုင်များကို အလှမ်းမမီ ထားပါ၊ ပူသော အရည်များကို စားပွဲအစွန်းတွင် မထားပါနှင့်။ ဆေးများ၊ ဓာတုပစ္စည်းများ၊ ဆေးလိပ်၊ အရက်များကို သော့ခတ် သိမ်းပါ။ ဒင်္ဂါးပြား၊ ကြယ်သီး၊ ခလုတ်ဘက်ထရီ၊ သံလိုက်လုံးများကို ဖယ်ရှားပါ။ ပလတ်စတစ်အိတ်နှင့် ပူဖောင်းများကို ဝေးဝေးထားပါ။',
        'Home-safety check — fit gates at the top and bottom of stairs. Anchor shelves, tables and TVs that could tip. Keep windows closed or guarded and move climbable furniture away from them. Tie blind cords high. Cover sockets and tuck away electrical cords. Empty buckets, basins and tubs or keep them covered — a child can drown in very little water, and never leave her alone near water even for a moment. Keep the stove, hot drinks, irons and candles out of reach and hot liquids away from table edges. Lock away medicines, cleaning products, tobacco and alcohol. Remove coins, buttons, button batteries and small magnets. Keep plastic bags and balloons well away.',
      ),
      commonMistakes: [
        b('ကလေးကို အမြဲ တားမြစ်ခြင်း — ပတ်ဝန်းကျင်ကို ပြင်ခြင်းက ပိုထိရောက်သည်။', 'Constantly stopping her — changing the environment works better.'),
        b('"ခဏလေးပဲ" ဟု ထင်၍ ရေအနီးတွင် ချန်ထားခြင်း။', 'Leaving her near water "just for a second".'),
      ],
      parentTips: [
        b('ကလေး၏ အမြင့်အထိ ဒူးထောက်၍ အခန်းကို ကြည့်ပါ — မမြင်ခဲ့သော အန္တရာယ်များ ပေါ်လာလိမ့်မည်။', 'Kneel to her height and look around the room — you will see hazards you missed.'),
        b('အခန်းတစ်ခန်းကို လုံးဝ လုံခြုံအောင် ပြင်ထားပါ — "ဟုတ်တယ်" လို့ ပြောနိုင်တဲ့ နေရာ ဖြစ်စေပါ။', 'Make one room completely safe — a place where the answer can be yes.'),
      ],
      faq: [
        {
          q: b('ကလေးကို ကစားရာမှာ အမြဲ ဦးဆောင်ပေးရမလား။', 'Should I always lead the play?'),
          a: b('မလိုပါ။ ကလေး ရွေးသည့် အရာကို လိုက်ကစားပေးခြင်းက အာရုံစူးစိုက်မှုနှင့် ဘာသာစကား ဖွံ့ဖြိုးမှုကို ပိုအထောက်အကူ ပြုသည်။ သင့်အလုပ်မှာ လုံခြုံမှု ပေးခြင်းနှင့် အတူ ရှိပေးခြင်း ဖြစ်သည်။', 'No. Following her choice supports attention and language better. Your job is to keep it safe and be present.'),
        },
        {
          q: b('ကစားစရာ ဘယ်နှစ်ခု လိုအပ်လဲ။', 'How many toys does she need?'),
          a: b('အနည်းငယ်သာ လိုပါသည်။ ပစ္စည်း ၃–၄ ခုကို လှည့်ပြောင်း ပေးခြင်းက ပစ္စည်း အများကြီး တစ်ပြိုင်နက် ပေးခြင်းထက် ပိုကောင်းသည်။', 'Very few. Rotating three or four items works better than offering many at once.'),
        },
      ],
      redFlags: [
        b('ကစားစရာ သို့မဟုတ် ပတ်ဝန်းကျင်ကို လုံးဝ စိတ်မဝင်စားခြင်း။', 'No interest at all in toys or surroundings.'),
        b('လဲကျပြီးနောက် သတိလစ်ခြင်း၊ အန်ခြင်း၊ အထူး အိပ်ငိုက်ခြင်း သို့မဟုတ် ငိုသံ ထူးခြားခြင်း။', 'After a fall: loss of consciousness, vomiting, unusual drowsiness or an unusual cry.'),
        b('ဆေး၊ ဓာတုပစ္စည်း သို့မဟုတ် ခလုတ်ဘက်ထရီ မျိုမိခြင်း ဟု သံသယ ရှိခြင်း။', 'Any suspicion that she has swallowed medicine, a chemical or a button battery.'),
      ],
      referral: b(
        'လဲကျမှုနောက်ပိုင်း အထက်ပါ လက္ခဏာများ ပေါ်လျှင် သို့မဟုတ် အဆိပ်အတောက် သံသယ ရှိလျှင် ချက်ချင်း ဆေးခန်း သို့မဟုတ် ဆေးရုံသို့ သွားပါ။ ခလုတ်ဘက်ထရီ သို့မဟုတ် သံလိုက် မျိုမိပါက အရေးပေါ် ဖြစ်ပြီး စောင့်ဆိုင်း၍ မရပါ။',
        'After a fall with any of those signs, or with any suspected poisoning, seek medical care immediately. A swallowed button battery or magnet is an emergency and must not wait.',
      ),
      encouragement: b(
        'အခန်းတစ်ခန်းကို လုံခြုံအောင် ပြင်လိုက်ခြင်းက မိဘအတွက်လည်း စိတ်အေးစေပြီး ကလေးအတွက်လည်း လွတ်လပ်စွာ လေ့လာခွင့် ပေးပါသည်။',
        'Making one room safe gives you calm and gives her freedom to explore.',
      ),
    }),
    'The value of caregiver-supported play and a prepared environment follows AAP guidance on the power of play, the WHO Care for Child Development package, the UNICEF early-moments report and the Bright Futures preventive-care schedule, with the water-safety points drawn from the AAP drowning-prevention policy and the sleep-environment points from the AAP safe-sleep recommendations in the registry.',
  ),
];

const GUIDES_F: SeedItem[] = [
  kb(
    guide('10_12m', 'nutrition', {
      title: b('၁၀ – ၁၂ လ — အာဟာရ လမ်းညွှန်', '10–12 months — Nutrition guide'),
      why: b(
        'ဤအရွယ်တွင် ဖြည့်စွက်အစားအစာက ကလေး၏ အာဟာရအတွက် ပိုမိုအရေးပါလာသည်။ တစ်နေ့လျှင် အဓိကအစာ သုံးနပ်နှင့် အကြားစာ တစ်ကြိမ်မှ နှစ်ကြိမ်ခန့် ပေးနိုင်ပြီး မိခင်နို့ကို အသက် ၂ နှစ် သို့မဟုတ် ထို့ထက်ကျော်လွန်၍ ဆက်လက်တိုက်ကျွေးနိုင်သည်။ အစာကို ချောမွေ့အောင် ကြိတ်ထားသည့်ပုံစံမှ အဖတ်အနည်းငယ်ပါသည့်ပုံစံ၊ ထို့နောက် လက်ဖြင့် ကိုင်စားနိုင်သည့် နူးညံ့သောအတုံးများအဖြစ် တဖြည်းဖြည်း ပြောင်းပေးပါ။ အသား၊ ငါး၊ ဥ၊ ပဲနှင့် အစိမ်းရောင် ဟင်းသီးဟင်းရွက်ကဲ့သို့ သံဓာတ်ကြွယ်ဝသော အစားအစာများသည် အထူးအရေးကြီးသည်။',
        'Food now plays a larger part in her nutrition — often about three main meals plus one or two snacks a day, alongside breastfeeding which can continue to two years and beyond. Texture should progress gradually from puréed to mashed with soft lumps, then to soft finger pieces. Iron-rich foods — meat, fish, eggs, beans and dark green vegetables — matter especially at this age.',
      ),
      observationQuestions: [
        b('တစ်နေ့လျှင် အဓိက အစာ ၃ နပ် စားပါသလား။', 'Is she eating about three main meals a day?'),
        b('အဖတ်အနည်းငယ်ပါသော အစာနှင့် လက်ဖြင့်ကိုင်စားနိုင်သည့် နူးညံ့သောအစာများကို စားနိုင်ပါသလား။', 'Does she accept lumpy food and finger pieces?'),
        b('သံဓာတ် ကြွယ်ဝသော အစာ နေ့စဉ် ပါဝင်ပါသလား။', 'Is an iron-rich food included every day?'),
        b('ဗိုက်ပြည့်လျှင် ခေါင်းလွှဲခြင်း၊ ပါးစပ်ပိတ်ခြင်း ကဲ့သို့ အချက်ပြပါသလား။', 'Does she signal fullness by turning away or closing her mouth?'),
      ],
      dailyActivities: [
        b('အစာ အမျိုးအစား အနည်းဆုံး ၄ မျိုးမှ ၅ မျိုးကို တစ်နေ့အတွင်း ပေးပါ။', 'Offer at least four to five different food groups across the day.'),
        b('မိသားစုနှင့် အတူ စားပွဲတွင် ထိုင်စားစေပါ။', 'Let her eat with the family at the same time.'),
        b('ဗိုက်ပြည့်ပြီဟု အချက်ပြလျှင် ရပ်ပါ — အတင်း မကျွေးပါနှင့်။', 'Stop when she signals she is full — never force-feed.'),
      ],
      weeklyActivities: [
        b('အရောင်နှင့် အသွင်အပြင် အသစ်တစ်မျိုးကို တစ်ပတ်လျှင် တစ်ခါ မိတ်ဆက်ပါ။', 'Introduce one new colour or texture each week.'),
        b('အသစ်သော အစာကို ငြင်းလျှင် နောက်ရက်များတွင် ထပ်ပေးပါ — အကြိမ် ၁၀ ကျော် လိုနိုင်သည်။', 'If she refuses a new food, offer it again on later days — it can take ten tries or more.'),
      ],
      indoor: [
        b('မိသားစု အစာမှ ဆားမထည့်ရသေးသော အပိုင်းကို ခွဲယူ၍ ကျွေးခြင်း။', 'Setting aside her portion of the family food before salt is added.'),
        b('အစာကို လက်ညှိုးအရွယ် အရှည်လိုက် ဖြတ်၍ ကိုယ်တိုင် စားစေခြင်း။', 'Cutting food into finger-length strips for self-feeding.'),
      ],
      outdoor: [
        b('ဈေးသို့ အတူသွားသည့်အခါ သစ်သီးနှင့် ဟင်းသီးဟင်းရွက်များကို ပြသပြီး အမည်ပြောပေးခြင်း။', 'Visiting the market together and naming fruits and vegetables.'),
      ],
      lowCost: [
        b('ဒေသထွက် ပဲ၊ ဥ၊ ငါး၊ အစိမ်းရောင် ဟင်းရွက်များသည် ဈေးသက်သာပြီး အာဟာရ ပြည့်ဝသည်။', 'Local beans, eggs, fish and dark green leaves are cheap and nutritious.'),
        b('အထူး ကလေးအစာ ဝယ်ရန် မလိုပါ — မိသားစု အစာကို ချေ၍ ကျွေးနိုင်သည်။', 'No special baby food is needed — family food can be mashed.'),
      ],
      materials: b('ခွက်၊ ဇွန်း၊ မိသားစု အစာ (ဆား၊ သကြား မထည့်ရသေးသော အပိုင်း)', 'A cup, a spoon and family food set aside before salt or sugar'),
      safety: b(
        'အသက်ရှူလမ်းကြောင်း ပိတ်ဆို့စေနိုင်သော အခွံမာသီးလုံး၊ ပဲစေ့လုံး၊ စပျစ်သီးနှင့် ချယ်ရီသီးလုံး၊ ပြောင်းဖူးပေါက်ပေါက်၊ သကြားလုံးမာ၊ ဝက်အူချောင်းအဝိုင်း၊ ငါးရိုးပါသောအသားနှင့် မာသော ဟင်းသီးဟင်းရွက်အတုံးများကို ရှောင်ပါ။ စပျစ်သီးနှင့် ချယ်ရီသီးကို အလျားလိုက် လေးစိတ်ခွဲပေးပါ။ အစာစားစဉ် အမြဲ အနီးကပ်ကြီးကြပ်ပြီး ကလေးကို မတ်မတ်ထိုင်စေပါ။ အသက် ၁၂ လမပြည့်မီ ပျားရည် မပေးပါနှင့်။ နွားနို့ကိုလည်း အဓိကသောက်စရာအဖြစ် မပေးပါနှင့်။ ဆားနှင့် သကြား ထပ်မထည့်ဘဲ ချိုသောအချိုရည်နှင့် လက်ဖက်ရည်ကို ရှောင်ပါ။ ဥ၊ ငါး၊ နို့ထွက်ပစ္စည်းနှင့် ချောမွေ့အောင် ဖျော်ထားသော အခွံမာသီးထုတ်ကုန်များကဲ့သို့ ဓာတ်မတည့်နိုင်သော အစားအစာများကို တစ်မျိုးချင်း အနည်းငယ်စီ စတင်ပေးပြီး အစားအစာအသစ် တစ်မျိုးနှင့်တစ်မျိုးကြား ၃ ရက်မှ ၅ ရက် စောင့်ကြည့်ပါ။ ကလေးတွင် ပြင်းထန်သော အရေပြားရောင်ရမ်းနာ သို့မဟုတ် ဥနှင့် ဓာတ်မတည့်မှု ရှိပါက မြေပဲမစတင်မီ ဆရာဝန်နှင့် တိုင်ပင်ပါ။ သိရှိထားသော အစားအစာဓာတ်မတည့်မှု သို့မဟုတ် ယခင်က တုံ့ပြန်မှုရှိပါက ထိုအစားအစာကို ဘေးကင်းစွာ မိတ်ဆက်ပုံကို ဆရာဝန်အား မေးမြန်းပါ။ အစားအစာကို ကောင်းစွာချက်ပြုတ်ပြီး လက်နှင့် အသုံးအဆောင်များကို သန့်ရှင်းစွာထားပါ။ သန့်ရှင်းသောရေကို သုံးပြီး ကျန်ရှိသောအစာကို အချိန်ကြာမြင့်စွာ မထားပါနှင့်။',
        'Avoid choking foods — whole nuts, whole beans, whole grapes and cherries (quarter them), popcorn, hard sweets, whole sausage rounds, fish with bones and hard raw vegetable chunks. Always supervise meals with her sitting upright. Never give honey before 12 months. Do not use cow’s milk as a main drink before 12 months. Add no salt or sugar and avoid sweet drinks and tea. Common allergenic foods such as egg, fish, dairy and nut products (as smooth pastes, never whole nuts) do not need to be avoided. Introduce them one at a time and wait 3 to 5 days between each new food. If your child has severe eczema or egg allergy, talk with a doctor before introducing peanut. If your child has a known food allergy or has previously reacted to a food, ask a doctor how to introduce that food safely. Cook food thoroughly, wash hands, use clean water, and do not keep leftovers for long.',
      ),
      commonMistakes: [
        b('ချောမွေ့အောင် ကြိတ်ထားသော အစာကိုသာ အချိန်ကြာမြင့်စွာ ကျွေးခြင်း။ ကလေးစားနိုင်သည့် အစာအဖတ်နှင့် ပုံစံကို တဖြည်းဖြည်း ပြောင်းပေးရန် လိုသည်။', 'Staying on purée too long — textures need to progress.'),
        b('အတင်း ကျွေးခြင်း သို့မဟုတ် ငိုအောင် တိုက်တွန်းခြင်း။', 'Force-feeding or pressuring until she cries.'),
        b('အချိုရည်၊ လက်ဖက်ရည် သို့မဟုတ် ဆားပါသော အစာ တိုက်ခြင်း။', 'Giving sweet drinks, tea or salty food.'),
      ],
      parentTips: [
        b('ကလေးက ဘာစားမလဲ ဆုံးဖြတ်သည်၊ မိဘက ဘာကို ဘယ်အချိန် ပေးမလဲ ဆုံးဖြတ်သည်။', 'You decide what is offered and when; she decides how much she eats.'),
        b('အစားအစာ ငြင်းသည့် ရက်များ ရှိတတ်သည် — တစ်ပတ်လုံး ကြည့်ပါ၊ တစ်နပ်တည်း မကြည့်ပါနှင့်။', 'Refusal days happen — judge intake across a week, not one meal.'),
      ],
      faq: [
        {
          q: b('မိခင်နို့ကို ဘယ်အချိန်အထိ တိုက်သင့်လဲ။', 'How long should I keep breastfeeding?'),
          a: b('ကမ္ဘာ့ကျန်းမာရေးအဖွဲ့၏ လမ်းညွှန်ချက်အရ ၂ နှစ် သို့မဟုတ် ထို့ထက် ပိုကြာအောင် အစားအစာနှင့် တွဲဖက်၍ ဆက်တိုက်ကျွေးရန် အကြံပြုထားသည်။ ၁၀–၁၂ လတွင် နို့သည် အာဟာရ အရင်းအမြစ် တစ်ခုအဖြစ် ဆက်လက် အရေးပါပါသည်။', 'WHO guidance recommends continuing breastfeeding to two years and beyond alongside family foods. At 10–12 months milk is still an important part of her nutrition.'),
        },
        {
          q: b('အစာ နည်းနည်းပဲ စားတယ် — စိုးရိမ်ရလား။', 'She eats only small amounts — should I worry?'),
          a: b('ကလေးများ၏ အစာစားနှုန်းသည် နေ့စဉ် ကွာခြားနိုင်ပါသည်။ ကိုယ်အလေးချိန် ပုံမှန် တိုးနေပြီး တက်ကြွစွာ ရှိနေလျှင် များသောအားဖြင့် စိုးရိမ်ရန် မလိုပါ။ ကိုယ်အလေးချိန် မတိုးခြင်း သို့မဟုတ် ကျဆင်းခြင်း ရှိလျှင် ကျန်းမာရေးဝန်ထမ်းနှင့် ဆွေးနွေးပါ။', 'Intake varies a lot from day to day. If she is gaining weight steadily and is active, this is usually fine. If weight is static or falling, discuss it with a health worker.'),
        },
      ],
      redFlags: [
        b('ကိုယ်အလေးချိန် မတိုးခြင်း သို့မဟုတ် ကျဆင်းခြင်း။', 'Weight that is not increasing, or is falling.'),
        b('အစာမျိုချရန် ခက်ခဲခြင်း၊ အစာစားစဉ် ခဏခဏ ချောင်းဆိုးခြင်း။', 'Difficulty swallowing or frequent coughing with feeds.'),
        b('ဝမ်းလျှောခြင်း သို့မဟုတ် အန်ခြင်း ကြာရှည်ခြင်း၊ ရေဓာတ်ခန်းခြောက်ခြင်း လက္ခဏာများ။', 'Persistent diarrhoea or vomiting, or signs of dehydration.'),
        b('အစာစားပြီးနောက် အရေပြားယားခြင်း၊ မျက်နှာဖောင်းခြင်း၊ အသက်ရှူ ခက်ခဲခြင်း။', 'Rash, facial swelling or breathing difficulty after a food.'),
      ],
      referral: b(
        'ကိုယ်အလေးချိန် မတိုးခြင်း သို့မဟုတ် မျိုချရန် ခက်ခဲခြင်းကို ကျန်းမာရေးဝန်ထမ်းနှင့် ဆွေးနွေးပါ။ အစာစားပြီးနောက် မျက်နှာဖောင်းခြင်း သို့မဟုတ် အသက်ရှူ ခက်ခဲခြင်း ဖြစ်ပါက ချက်ချင်း အရေးပေါ် ဆေးကုသမှု ခံယူပါ။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ပါ။',
        'Discuss poor weight gain or swallowing difficulty with a health worker. Facial swelling or breathing difficulty after a food needs emergency care immediately. This is not a diagnosis.',
      ),
      encouragement: b(
        'အစာစားခြင်းသည် လေ့ကျင့်ရသော ကျွမ်းကျင်မှု တစ်ခု ဖြစ်သည် — အေးဆေးစွာ ထပ်ခါထပ်ခါ ပေးခြင်းက အကောင်းဆုံး ဖြစ်ပါသည်။',
        'Eating is a skill she is learning — calm, repeated offers work best.',
      ),
    }),
    'Meal frequency, texture progression, iron-rich foods, responsive feeding and continued breastfeeding at 10–12 months follow the WHO complementary feeding guideline, the WHO infant and young child feeding model chapter, the WHO and UNICEF infant and young child feeding indicators, the NHS first solid foods guidance, the CDC foods and drinks guidance for 6–24 months, the NICE maternal and child nutrition guideline and the AAP breastfeeding policy, with the swallowing cautions taken from the ASHA practice portal.',
  ),
];

const GUIDES_G: SeedItem[] = [
  kb(
    guide('10_12m', 'sleep', {
      title: b('၁၀ – ၁၂ လ — အိပ်စက်ခြင်း လမ်းညွှန်', '10–12 months — Sleep guide'),
      why: b(
        'ဤအရွယ်တွင် ကလေးအများစုသည် ၂၄ နာရီအတွင်း ၁၂ နာရီမှ ၁၆ နာရီခန့် (နေ့ဘက် အိပ်ချိန် အပါအဝင်) အိပ်လေ့ရှိသည်၊ သို့သော် ကလေးတစ်ဦးနှင့်တစ်ဦး ကွာခြားနိုင်သည်။ နေ့ဘက်တွင် ၂ ကြိမ် အိပ်ခြင်းမှ ၁ ကြိမ်သို့ တဖြည်းဖြည်း ပြောင်းလာနိုင်သည်။ ခွဲခွာမှု စိုးရိမ်ခြင်း အထွတ်အထိပ် ရောက်ချိန်ဖြစ်၍ ညဘက် နိုးခြင်းများ ပြန်များလာတတ်သည် — ဤသည် နောက်ပြန်ဆုတ်ခြင်း မဟုတ်ဘဲ ဖွံ့ဖြိုးမှု၏ တစ်စိတ်တစ်ပိုင်း ဖြစ်သည်။ တည်ငြိမ်၍ ထပ်တလဲလဲ တူညီသော အိပ်ရာဝင် ပုံစံသည် အထောက်အကူ အဖြစ်ဆုံး ဖြစ်သည်။',
        'Most babies this age sleep about 12 to 16 hours in 24 hours including naps, though this varies. Two naps often become one over these months. Because separation anxiety peaks now, night waking can increase again — that is development, not a setback. A calm, repeated bedtime routine helps most.',
      ),
      observationQuestions: [
        b('အိပ်ရာဝင်ချိန် ပုံစံ တူညီပါသလား။', 'Is the bedtime routine the same each night?'),
        b('တစ်ရက်လျှင် စုစုပေါင်း အိပ်ချိန် မည်မျှ ရပါသလား။', 'Roughly how much total sleep does she get in a day?'),
        b('ညဘက် နိုးလျှင် ပြန်အိပ်ရန် အချိန် မည်မျှ ကြာပါသလား။', 'When she wakes at night, how long does she take to resettle?'),
        b('အိပ်ရာသည် လုံခြုံပါသလား — ခိုင်ခံ့သော မျက်နှာပြင်၊ ပစ္စည်း ကင်းရှင်းမှု။', 'Is her sleep surface firm and clear of objects?'),
      ],
      dailyActivities: [
        b('အိပ်ရာမဝင်မီ ၂၀–၃၀ မိနစ် တည်ငြိမ်သော လုပ်ရိုးလုပ်စဉ် — ရေချိုး၊ အဝတ်လဲ၊ စာဖတ်၊ သီချင်း။', 'A calm 20–30 minute routine — bath, change, book, song.'),
        b('နေ့ဘက်တွင် အလင်းရောင်နှင့် လှုပ်ရှားမှု လုံလောက်စွာ ပေးပါ။', 'Plenty of daylight and movement during the day.'),
        b('အိပ်ချိန်နီးလျှင် ဖန်သားပြင်နှင့် ကျယ်လောင်သော ကစားမှုကို ရှောင်ပါ။', 'Avoid screens and boisterous play close to bedtime.'),
      ],
      weeklyActivities: [
        b('အိပ်ချိန်ကို မှတ်တမ်းတင်၍ ပုံစံကို ကြည့်ပါ။', 'Keep a simple sleep log for a week and look for patterns.'),
        b('နေ့ဘက် အိပ်ချိန်ကို တဖြည်းဖြည်း ချိန်ညှိပါ — ညဘက် အိပ်ရေးကို ထိခိုက်နေလျှင်။', 'Adjust nap timing gradually if it is affecting night sleep.'),
      ],
      indoor: [
        b('အလင်းရောင် နည်းသော၊ တိတ်ဆိတ်သော အိပ်ခန်း ပြင်ဆင်ခြင်း။', 'A dim, quiet sleep space.'),
        b('တူညီသော ချော့သီချင်း တစ်ပုဒ်ကို ညတိုင်း ဆိုပေးခြင်း။', 'The same lullaby every night.'),
      ],
      outdoor: [
        b('နေ့ခင်းပိုင်းတွင် အပြင်ထွက်၍ သဘာဝ အလင်းရောင် ရစေခြင်း။', 'Time outdoors in natural daylight during the day.'),
      ],
      lowCost: [
        b('တူညီသော အစီအစဉ်နှင့် တည်ငြိမ်သော အသံသည် အခမဲ့ဖြစ်ပြီး ထိရောက်သည်။', 'A consistent routine and a calm voice cost nothing.'),
      ],
      materials: b('ခိုင်ခံ့သော အိပ်ရာခင်း၊ ပါးလွှာသော စောင်၊ စာအုပ်တစ်အုပ်', 'A firm sleep surface, a light blanket, one book'),
      safety: b(
        'ကလေးအား အိပ်ရာဝင်တိုင်း ပက်လက် (ကျောပေး) အနေအထားဖြင့် အိပ်စေပါ — ၁ နှစ်ပြည့်သည်အထိ ဤအချက်သည် အရေးကြီးဆုံး လုံခြုံရေး အချက် ဖြစ်သည်။ ကလေး ကိုယ်တိုင် လှိမ့်တတ်ပြီဆိုလျှင် အလိုအလျောက် ပြန်လှည့်ပေးရန် မလိုပါ။ အိပ်ရာသည် ခိုင်ခံ့၍ ညီညာရမည်၊ ခေါင်းအုံး၊ မွေ့ရာနူးနူး၊ စောင်ထူ၊ ကစားစရာ ပျော့များ၊ ကြိုးများကို အိပ်ရာထဲတွင် မထားပါနှင့်။ ကလေးအား အခန်းတူတွင် သီးခြား အိပ်ရာဖြင့် အိပ်စေခြင်းသည် အကြံပြုထားသော နည်းလမ်း ဖြစ်သည်။ မိဘသည် ဆေးလိပ်သောက်ခြင်း၊ အရက် သို့မဟုတ် အိပ်ဆေး သောက်ထားခြင်း၊ အလွန် ပင်ပန်းနေခြင်း ရှိလျှင် အိပ်ရာ တူတူ မမျှဝေပါနှင့် — ဆိုဖာ သို့မဟုတ် အာမ်ချဲယားတွင် ကလေးနှင့် အတူ လုံးဝ မအိပ်ပါနှင့်၊ ၎င်းသည် အလွန် အန္တရာယ်များသည်။ အခန်းအပူချိန်ကို သင့်တင့်အောင် ထားပြီး အလွန် ထူထပ်စွာ မခြုံပါနှင့်။ ကလေး၏ အနီးတွင် ဆေးလိပ် မသောက်ပါနှင့်။',
        'Place her on her back for every sleep — this remains the single most important safety point up to one year. Once she can roll herself, you do not need to keep turning her back. The sleep surface should be firm and flat, with no pillows, soft mattresses, thick quilts, soft toys or cords in it. Room-sharing with her on her own separate sleep surface is the recommended arrangement. Do not share a bed if anyone smokes, has drunk alcohol or taken sedating medicine, or is very tired — and never sleep with her on a sofa or armchair, which is especially dangerous. Keep the room at a comfortable temperature and avoid heavy covering. Keep the home smoke-free.',
      ),
      commonMistakes: [
        b('အိပ်ရာထဲတွင် ခေါင်းအုံးနှင့် ကစားစရာ ပျော့များ ထားခြင်း။', 'Leaving pillows and soft toys in the sleep space.'),
        b('ညဘက် နိုးတိုင်း ချက်ချင်း နို့တိုက်ခြင်း — ခဏ စောင့်ကြည့်ပါ၊ ကိုယ်တိုင် ပြန်အိပ်နိုင်သည်။', 'Feeding at every waking — pause briefly; she may resettle herself.'),
      ],
      parentTips: [
        b('အိပ်ငိုက်နေဆဲ (မအိပ်ပျော်သေး) အချိန်တွင် အိပ်ရာချပေးပါ — ကိုယ်တိုင် အိပ်ပျော်တတ်လာသည်။', 'Put her down drowsy but still awake so she learns to fall asleep herself.'),
        b('ခွဲခွာမှု စိုးရိမ်ချိန်တွင် ညဘက် နိုးမှု များလာခြင်းသည် ယာယီ ဖြစ်သည်။', 'More night waking during separation anxiety is temporary.'),
      ],
      faq: [
        {
          q: b('ညဘက် အကြိမ်ကြိမ် နိုးတယ် — ပုံမှန်လား။', 'She wakes several times a night — is that normal?'),
          a: b('ဤအရွယ်တွင် ညဘက် နိုးခြင်းသည် ပုံမှန် ဖြစ်ပါသည်၊ အထူးသဖြင့် ခွဲခွာမှု စိုးရိမ်ချိန်တွင် ပိုများနိုင်သည်။ တည်ငြိမ်သော အိပ်ရာဝင် ပုံစံနှင့် တိုတောင်းသော နှစ်သိမ့်မှုက အထောက်အကူ ဖြစ်သည်။ အိပ်ရေး ပြဿနာက မိသားစုကို အလွန် ထိခိုက်နေလျှင် ကျန်းမာရေးဝန်ထမ်းနှင့် ဆွေးနွေးနိုင်ပါသည် — အထောက်အကူ ပြုနိုင်သော နည်းလမ်းများ ရှိပါသည်။', 'Night waking is normal at this age and often increases during separation anxiety. A steady bedtime routine and brief, calm reassurance help. If sleep is badly affecting the family, a health worker can discuss approaches that have been shown to help.'),
        },
        {
          q: b('နေ့ဘက် အိပ်ချိန် ၂ ကြိမ်ကနေ ၁ ကြိမ် ဘယ်တော့ ပြောင်းမလဲ။', 'When do two naps become one?'),
          a: b('များသောအားဖြင့် ၁၂ လမှ ၁၈ လအတွင်း တဖြည်းဖြည်း ပြောင်းလေ့ရှိပြီး ကလေးတစ်ဦးနှင့်တစ်ဦး ကွာခြားသည်။ ကလေးက နံနက်ပိုင်း အိပ်ချိန်ကို ငြင်းလာလျှင် ဖြည်းဖြည်းချင်း ချိန်ညှိပါ။', 'Usually gradually between about 12 and 18 months, and it varies. If she starts refusing the morning nap, adjust slowly.'),
        },
      ],
      redFlags: [
        b('အိပ်နေစဉ် အသက်ရှူ ရပ်သွားခြင်း၊ အသံကျယ်စွာ ဟောက်ခြင်း သို့မဟုတ် အသက်ရှူရ ခက်ခဲခြင်း။', 'Pauses in breathing, loud snoring or laboured breathing during sleep.'),
        b('နိုးရန် အလွန် ခက်ခဲခြင်း သို့မဟုတ် ထူးခြားစွာ အိပ်ငိုက်နေခြင်း။', 'Being very difficult to wake or unusually drowsy.'),
        b('အိပ်ရေး ပျက်ခြင်းက မိဘ၏ နေ့စဉ်ဘဝ သို့မဟုတ် စိတ်ကျန်းမာရေးကို ပြင်းထန်စွာ ထိခိုက်နေခြင်း။', 'Sleep loss seriously affecting a parent’s daily life or mental health.'),
      ],
      referral: b(
        'အသက်ရှူ ပုံမှန် မဟုတ်ခြင်းကို ကျန်းမာရေးဝန်ထမ်းနှင့် အမြန် ဆွေးနွေးပါ။ နိုးရန် ခက်ခဲပြီး တုံ့ပြန်မှု နည်းနေလျှင် ချက်ချင်း ဆေးကုသမှု ခံယူပါ။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ပါ။',
        'Discuss abnormal breathing with a health worker promptly. A baby who is hard to rouse and unresponsive needs urgent medical care. This is not a diagnosis.',
      ),
      encouragement: b(
        'ကလေး၏ အိပ်စက်မှုပုံစံသည် အမြဲ တဖြည်းဖြည်း ကောင်းမွန်လာမည် မဟုတ်ပါ။ တစ်ခါတစ်ရံ ပြန်လည်မတည်ငြိမ်နိုင်သော်လည်း ပုံမှန်လုပ်ရိုးလုပ်စဉ်ကို ဆက်လက်လုပ်ပေးခြင်းက အချိန်ကြာလာသည်နှင့်အမျှ အထောက်အကူပြုနိုင်သည်။',
        'Sleep does not improve in a straight line — a steady routine pays off over time.',
      ),
    }),
    'Total sleep ranges, nap transition and bedtime-routine advice at this age follow the WHO guidelines on physical activity, sedentary behaviour and sleep for under-fives, the American Academy of Sleep Medicine review of bedtime routines and behavioural sleep interventions and the randomised controlled trial of a behavioural infant-sleep intervention in the registry, with the safe-sleep, bed-sharing and sleep-surface points taken from the AAP safe-sleep recommendations, the NHS guidance on reducing the risk of sudden infant death and the Health Canada safe-sleep statement.',
  ),
  kb(
    guide('10_12m', 'daily_routine', {
      title: b('၁၀ – ၁၂ လ — နေ့စဉ် လုပ်ရိုးလုပ်စဉ် လမ်းညွှန်', '10–12 months — Daily routine guide'),
      why: b(
        'ထပ်တလဲလဲ တူညီသော နေ့စဉ် အစီအစဉ်သည် ကလေးအား "နောက်တစ်ခု ဘာလာမလဲ" ကို ကြိုသိစေပြီး လုံခြုံမှု ခံစားချက် ပေးသည်။ အချိန်ဇယား တင်းကျပ်စွာ လိုက်နာရန် မလိုပါ — အစီအစဉ်၏ အစဉ်လိုက် (စား → ကစား → အိပ်) သည် နာရီထက် ပိုအရေးကြီးသည်။ ဤအရွယ်တွင် ကာကွယ်ဆေး ထိုးချိန်များနှင့် ကလေး ကျန်းမာရေး စစ်ဆေးမှုများကိုလည်း ပုံမှန် လုပ်ဆောင်သင့်သည်။',
        'A predictable daily rhythm lets her anticipate what comes next and feel secure. You do not need a strict clock — the order of events (feed, play, sleep) matters more than the exact time. This age also includes routine immunisations and health checks.',
      ),
      observationQuestions: [
        b('စား၊ ကစား၊ အိပ် အစဉ်လိုက် တူညီပါသလား။', 'Does the feed–play–sleep order stay the same?'),
        b('ကာကွယ်ဆေးများ အချိန်မီ ထိုးပြီးပါသလား။', 'Are her immunisations up to date?'),
        b('ကလေး၏ ကိုယ်အလေးချိန်ကို ပုံမှန် တိုင်းတာပါသလား။', 'Is her weight being checked regularly?'),
        b('တစ်နေ့တာတွင် အတူ ကစားချိန် ပါဝင်ပါသလား။', 'Does the day include time playing together?'),
      ],
      dailyActivities: [
        b('နံနက် နိုးချိန်နှင့် ညဘက် အိပ်ချိန်ကို အနီးစပ်ဆုံး တူညီအောင် ထားပါ။', 'Keep wake-up and bedtime roughly the same each day.'),
        b('အစာ ၃ နပ်၊ အကြားစာ ၁–၂ ကြိမ်၊ နေ့ဘက် အိပ်ချိန် ၁–၂ ကြိမ် ခန့် စီစဉ်ပါ။', 'Plan about three meals, one or two snacks and one or two naps.'),
        b('နေ့စဉ် ကြမ်းပြင်ပေါ် ကစားချိန်နှင့် အပြင်ထွက်ချိန် ထည့်ပါ။', 'Include daily floor play and some time outdoors.'),
      ],
      weeklyActivities: [
        b('တစ်ပတ်လျှင် တစ်ကြိမ် အိမ်တွင်း ဘေးကင်းရေး စစ်ဆေးမှု လုပ်ပါ။', 'Do a weekly home-safety check.'),
        b('ကာကွယ်ဆေး မှတ်တမ်းနှင့် ကျန်းမာရေး စစ်ဆေးမှု ရက်ချိန်းကို ပြန်ကြည့်ပါ။', 'Review the immunisation card and upcoming health-check dates.'),
      ],
      indoor: [
        b('အလုပ်လုပ်ရင်း ကလေးကို အနီးတွင် ထား၍ စကားပြောခြင်း။', 'Keeping her near while you work and talking to her.'),
        b('အိပ်ရာဝင်ချိန် တူညီသော လုပ်ရိုးလုပ်စဉ်။', 'The same bedtime sequence each night.'),
      ],
      outdoor: [
        b('နေ့စဉ် အရိပ်ရှိသော နေရာတွင် အနည်းငယ် အပြင်ထွက်ခြင်း။', 'A short daily time outdoors in the shade.'),
      ],
      lowCost: [
        b('အစီအစဉ် တစ်ခု ချမှတ်ခြင်းသည် အခမဲ့ ဖြစ်ပြီး အသေးစိတ် ပစ္စည်း မလိုပါ။', 'Setting a rhythm is free and needs no equipment.'),
      ],
      materials: b('ကာကွယ်ဆေး မှတ်တမ်းကတ်၊ ကိုယ်အလေးချိန် မှတ်တမ်း', 'The immunisation card and a growth record'),
      safety: b(
        'ကလေး ဖျားနာလျှင် အောက်ပါ လက္ခဏာများသည် အရေးပေါ် ဖြစ်ပြီး ချက်ချင်း ဆေးကုသမှု လိုအပ်သည် — အသက်ရှူ ခက်ခဲခြင်း သို့မဟုတ် မြန်ဆန်ခြင်း၊ နှုတ်ခမ်း သို့မဟုတ် အရေပြား ညိုမည်းလာခြင်း၊ တက်ခြင်း၊ နိုးရန် အလွန် ခက်ခဲခြင်း သို့မဟုတ် တုံ့ပြန်မှု မရှိခြင်း၊ ဖိကြည့်လျှင် မပျောက်သော အနီကွက်များ၊ ပြင်းထန်စွာ ရေဓာတ်ခန်းခြောက်ခြင်း (ဆီးနည်းခြင်း၊ ပါးစပ် ခြောက်ခြင်း၊ မျက်လုံး ချိုင့်ဝင်ခြင်း)၊ ထပ်ခါထပ်ခါ အန်ခြင်း သို့မဟုတ် အစာ၊ ရေ လုံးဝ မသောက်နိုင်ခြင်း။ ကာကွယ်ဆေးများကို ဒေသ အစီအစဉ်အတိုင်း အချိန်မီ ထိုးပါ။ ဆေးမည်သည်ကိုမဆို ကျန်းမာရေးဝန်ထမ်း၏ ညွှန်ကြားချက်မပါဘဲ မတိုက်ပါနှင့် — ဗီတာမင်နှင့် အားဆေးများ အပါအဝင်။ ဆေးများကို သော့ခတ် သိမ်းပါ။',
        'When she is unwell, these are emergency signs needing immediate medical care — difficulty or fast breathing, blue or very pale lips or skin, a fit or convulsion, being very hard to wake or unresponsive, a rash that does not fade when pressed, severe dehydration (very little urine, dry mouth, sunken eyes), repeated vomiting, or refusing all feeds and fluids. Keep immunisations on schedule according to your local programme. Do not give any medicine, including vitamins and supplements, without advice from a health worker, and keep all medicines locked away.',
      ),
      commonMistakes: [
        b('နာရီအတိအကျ လိုက်နာရန် ကြိုးစား၍ ဖိအား ဖြစ်ခြင်း — အစဉ်လိုက်သာ အရေးကြီးသည်။', 'Chasing an exact clock — the order matters more than the minute.'),
        b('ဖျားလျှင် ဆေးဆိုင်မှ ဆေးကို ကိုယ်တိုင် ဝယ်တိုက်ခြင်း။', 'Buying and giving medicines yourself when she is ill.'),
      ],
      parentTips: [
        b('အစီအစဉ်ကို ကလေး၏ လိုအပ်ချက်နှင့် ကိုက်ညီအောင် ချိန်ညှိပါ — စာအုပ်ထဲက အတိုင်း မဟုတ်ပါ။', 'Adapt the routine to your child, not to a book.'),
        b('ကာကွယ်ဆေး ကတ်ကို လုံခြုံစွာ သိမ်းပြီး ဆေးခန်း သွားတိုင်း ယူသွားပါ။', 'Keep the immunisation card safe and bring it to every visit.'),
      ],
      faq: [
        {
          q: b('အစီအစဉ် တစ်ရက် ပျက်သွားရင် ပြဿနာ ဖြစ်မလား။', 'Does it matter if the routine is broken for a day?'),
          a: b('မဖြစ်ပါ။ ခရီးသွားခြင်း၊ ဖျားနာခြင်း၊ ပွဲလမ်းများကြောင့် အစီအစဉ် ပျက်နိုင်ပါသည်။ ပုံမှန်ဖြစ်လာလျှင် ပြန်လည် စတင်ရုံသာ ဖြစ်သည်။', 'No. Travel, illness and family events disrupt routines. You simply return to it afterwards.'),
        },
        {
          q: b('ဖျားရင် ဘယ်အချိန် ဆေးခန်း သွားရမလဲ။', 'When should I take her to a clinic for a fever?'),
          a: b('အထက်ပါ အရေးပေါ် လက္ခဏာများ တစ်ခုခု ရှိလျှင် ချက်ချင်း သွားပါ။ ထို့အပြင် ကလေးသည် ၃ လအောက် ဖြစ်လျှင်၊ ဖျားချိန် ၅ ရက်ထက် ကြာလျှင်၊ သို့မဟုတ် ကလေး၏ အနေအထားက သင့်ကို စိုးရိမ်စေလျှင် ကျန်းမာရေးဝန်ထမ်းနှင့် ပြသပါ — မိဘ၏ ခံစားချက်သည်လည်း အရေးကြီးသော အချက်ပြမှု ဖြစ်သည်။', 'Go immediately with any of the emergency signs above. Also seek advice if the baby is under three months, if fever lasts more than five days, or if she simply seems wrong to you — a parent’s instinct is an important signal.'),
        },
      ],
      redFlags: [
        b('အသက်ရှူ ခက်ခဲခြင်း သို့မဟုတ် မြန်ဆန်ခြင်း၊ နှုတ်ခမ်း ညိုမည်းလာခြင်း။', 'Difficult or fast breathing, or blue lips.'),
        b('တက်ခြင်း၊ နိုးရန် အလွန် ခက်ခဲခြင်း၊ တုံ့ပြန်မှု မရှိခြင်း။', 'A fit, being very hard to wake, or unresponsiveness.'),
        b('ဖိကြည့်လျှင် မပျောက်သော အနီကွက်များ။', 'A rash that does not fade under pressure.'),
        b('အစာ၊ ရေ လုံးဝ မသောက်နိုင်ခြင်း သို့မဟုတ် ပြင်းထန်သော ရေဓာတ်ခန်းခြောက်မှု။', 'Refusing all fluids or severe dehydration.'),
      ],
      referral: b(
        'ဤလက္ခဏာများ တစ်ခုခု ရှိပါက ချက်ချင်း အနီးဆုံး ဆေးရုံ သို့မဟုတ် ကျန်းမာရေးဌာနသို့ သွားပါ — စောင့်ဆိုင်း၍ မရပါ။ ဤသည် ရောဂါ ဖော်ထုတ်ချက် မဟုတ်ဘဲ အရေးပေါ် သတိပေးချက် ဖြစ်သည်။',
        'With any of these signs, go to the nearest hospital or health facility immediately — do not wait. This is not a diagnosis; it is an urgent safety prompt.',
      ),
      encouragement: b(
        'သင့်မိသားစုနှင့် ကိုက်ညီသော အစီအစဉ်တစ်ခုသည် ပြီးပြည့်စုံသော အချိန်ဇယားထက် ပိုကောင်းပါသည်။',
        'A rhythm that fits your family beats a perfect timetable.',
      ),
    }),
    'The value of predictable daily routines follows the Nurturing Care Framework, the Bright Futures preventive-care schedule, the American Academy of Sleep Medicine review of bedtime routines and the randomised controlled trial of a behavioural infant-sleep intervention, with feeding rhythm from the WHO infant and young child feeding model chapter, water-safety points from the AAP drowning-prevention policy, the fever and serious-illness signs from the NICE fever in under-5s guideline, the NHS guidance on spotting a seriously ill child and the WHO IMCI chart booklet, and immunisation timing from the CDC immunisation schedule and the WHO Immunization Agenda 2030.',
  ),
];

const ACTIVITIES: SeedItem[] = [
  kb(
    activity({
      slug: 'container_in_and_out',
      title: b('ဗူးထဲ ထည့်၊ ပြန်ထုတ်', 'In and out of the container'),
      summary: b('ပစ္စည်းများကို ဘူးထဲထည့်ပြီး ပြန်ထုတ်ကစားခြင်းဖြင့် လက်ချောင်းလှုပ်ရှားမှုနှင့် အကြောင်းအကျိုးဆက်စပ်မှုကို နားလည်လာစေသည်။', 'Putting objects into a container and taking them out builds hand skills and an understanding of where things go.'),
      ageGroupKey: '10_12m',
      domains: ['fine_motor', 'problem_solving', 'cognitive'],
      difficulty: 'easy',
      durationMinutes: 10,
      materials: b('ပလတ်စတစ် ဗူး သို့မဟုတ် ခွက်ကြီး တစ်လုံး၊ ပါးစပ်ထဲ မဝင်နိုင်လောက်အောင် ကြီးသော ပစ္စည်း ၃–၄ ခု', 'One large plastic container or cup, and three or four objects too big to fit in her mouth'),
      setup: b('ကလေးအား ကြမ်းပြင်ပေါ်တွင် ထိုင်စေပြီး ဗူးနှင့် ပစ္စည်းများကို ရှေ့တွင် ချထားပါ။', 'Sit her on the floor with the container and objects in front of her.'),
      instructions: [
        b('ပစ္စည်းတစ်ခုကို ဗူးထဲ ထည့်ပြပါ — "ထည့်လိုက်တယ်" ဟု ပြောပါ။', 'Put one object into the container and say "in".'),
        b('ဗူးကို ကလေးဘက် တွန်းပေးပြီး ကလေး ကိုယ်တိုင် ထည့်ရန် စောင့်ပါ။', 'Push the container towards her and wait for her to try.'),
        b('ကလေး ထည့်နိုင်လျှင် အားပေးပါ — "ဟုတ်ပြီ၊ ထည့်လိုက်တာပဲ"။', 'When she puts one in, celebrate — "you did it, in it goes".'),
        b('ဗူးကို မှောက်၍ ပစ္စည်းများ ပြန်ထွက်လာအောင် ပြပါ — "ထုတ်လိုက်တယ်"။', 'Tip the container out and say "out".'),
        b('ကလေး ကိုယ်တိုင် ထုတ်ခြင်းကို ထပ်ခါထပ်ခါ လုပ်ခွင့် ပေးပါ။', 'Let her repeat the taking-out as many times as she likes.'),
      ],
      safety: b('ပစ္စည်းများသည် ကလေး၏ ပါးစပ်ထဲ လုံးဝ မဝင်နိုင်လောက်အောင် ကြီးရမည်။ ဒင်္ဂါးပြား၊ ကြယ်သီး၊ ခလုတ်ဘက်ထရီ၊ သံလိုက်လုံး၊ ပဲစေ့များကို လုံးဝ မသုံးပါနှင့်။ ပလတ်စတစ်အိတ်ကို ဗူးအစား မသုံးပါနှင့်။ ကလေးအား တစ်ယောက်တည်း မထားပါနှင့်။', 'Every object must be too large to fit in her mouth. Never use coins, buttons, button batteries, small magnets or dried beans. Do not use a plastic bag as the container. Never leave her alone with the pieces.'),
      indoor: true,
      outdoor: false,
      oneChild: true,
      group: false,
      parentChild: true,
      outcomes: [
        b('လက်နှင့် မျက်စိ ပူးတွဲ အလုပ်လုပ်မှု တိုးတက်လာသည်။', 'Improved hand–eye coordination.'),
        b('ပစ္စည်းများသည် ဗူးထဲတွင် ရှိနေသေးကြောင်း နားလည်မှု ခိုင်မာလာသည်။', 'A firmer grasp that objects still exist inside the container.'),
        b('ထပ်ခါထပ်ခါ လုပ်ရင်း အာရုံစူးစိုက်မှု ကြာရှည်လာသည်။', 'Longer attention through repetition.'),
      ],
      variations: [
        b('ဗူးအရွယ်အစား ကွဲပြားစွာ ပေးကြည့်ပါ။', 'Try containers of different sizes.'),
        b('ပစ္စည်း ထည့်ရင်း "တစ်၊ နှစ်၊ သုံး" ဟု ရေတွက်ပြပါ။', 'Count "one, two, three" as pieces go in.'),
      ],
      lowCost: true,
      offline: true,
      tags: ['container_play', 'fine_motor'],
    }),
    'Container play and the in-and-out sequence at this age follow the paediatric occupational-therapy reference, AAP guidance on the power of play, CDC milestone checklists and the developmental-behavioural paediatrics textbook in the registry.',
  ),
  kb(
    activity({
      slug: 'hide_and_find_toy',
      title: b('ကစားစရာ ဝှက်၍ ရှာခြင်း', 'Hide and find the toy'),
      summary: b('အဝတ်စအောက်တွင် ကစားစရာကို ဝှက်၍ ရှာစေခြင်းဖြင့် "မမြင်ရလည်း ရှိနေသေးတယ်" ဟူသော အသိကို လေ့ကျင့်ပေးသည်။', 'Hiding a toy under a cloth for her to find strengthens the idea that things still exist when out of sight.'),
      ageGroupKey: '10_12m',
      domains: ['cognitive', 'problem_solving', 'play'],
      difficulty: 'easy',
      durationMinutes: 8,
      materials: b('ကစားစရာ တစ်ခု၊ ပါးလွှာသော အဝတ်စ တစ်ထည်', 'One toy and one light cloth'),
      setup: b('ကလေးနှင့် မျက်နှာချင်းဆိုင် ထိုင်ပြီး ကစားစရာကို ကြားတွင် ချထားပါ။', 'Sit facing her with the toy between you.'),
      instructions: [
        b('ကလေး ကြည့်နေစဉ် ကစားစရာကို အဝတ်စဖြင့် တစ်ပိုင်း ဖုံးပါ။', 'While she watches, half-cover the toy with the cloth.'),
        b('"ဘယ်ရောက်သွားလဲ" ဟု မေးပြီး ခဏ စောင့်ပါ။', 'Ask "where did it go?" and wait a moment.'),
        b('ကလေး အဝတ်စကို ဖယ်လျှင် အားပေးပါ။', 'Celebrate when she pulls the cloth away.'),
        b('ကလေး မရှာလျှင် အဝတ်စ၏ အစွန်းကို အနည်းငယ် ဖွင့်ပြပါ။', 'If she does not search, lift a corner to help.'),
        b('ကလေး ကျွမ်းလာလျှင် အပြည့် ဖုံးကြည့်ပါ။', 'Once she succeeds, try covering it completely.'),
      ],
      safety: b('ပါးလွှာသော အဝတ်စကိုသာ သုံးပါ — ပလတ်စတစ်အိတ်ကို လုံးဝ မသုံးပါနှင့် (အသက်ရှူ ပိတ်နိုင်သည်)။ ကလေး၏ မျက်နှာပေါ်တွင် အဝတ်စ ကြာရှည် မတင်ထားပါနှင့်။ ကစားစရာသည် ပါးစပ်ထဲ မဝင်နိုင်လောက်အောင် ကြီးရမည်။', 'Use only a light cloth — never a plastic bag, which is a suffocation risk. Do not leave the cloth over her face. The toy must be too large to fit in her mouth.'),
      indoor: true,
      outdoor: false,
      oneChild: true,
      group: false,
      parentChild: true,
      outcomes: [
        b('မမြင်ရသော ပစ္စည်းကို ရှာတတ်လာသည်။', 'She begins to search for hidden objects.'),
        b('မှတ်ဉာဏ်နှင့် အာရုံစူးစိုက်မှု တိုးတက်လာသည်။', 'Growing memory and attention.'),
        b('ခဏ ပျောက်ပြီး ပြန်ပေါ်လာခြင်းက ခွဲခွာမှုကို လေ့ကျင့်ပေးသည်။', 'Gentle practice for things going away and coming back.'),
      ],
      variations: [
        b('သင့်မျက်နှာကို အဝတ်စဖြင့် ဖုံး၍ ပုန်းတမ်း ကစားပါ။', 'Cover your own face for peekaboo.'),
        b('ခွက်နှစ်လုံးအောက်တွင် ဝှက်၍ ရွေးစေပါ။', 'Hide it under one of two cups.'),
      ],
      lowCost: true,
      offline: true,
      tags: ['object_permanence', 'peekaboo'],
    }),
    'Hide-and-find play and object permanence at this age follow AAP guidance on the power of play, the developmental-behavioural paediatrics textbook, CDC milestone guidance and the WHO Care for Child Development package in the registry.',
  ),
  kb(
    activity({
      slug: 'cruise_along_the_sofa',
      title: b('ဆိုဖာဘေး ကိုင်လျှောက်ခြင်း', 'Cruising along the sofa'),
      summary: b('ခိုင်ခံ့သော ပရိဘောဂကို ကိုင်လျက် ဘေးတိုက် လှမ်းခြင်းဖြင့် ခြေထောက် ခွန်အားနှင့် ချိန်ခွင်လျှာကို လေ့ကျင့်ပေးသည်။', 'Stepping sideways while holding stable furniture builds leg strength and balance.'),
      ageGroupKey: '10_12m',
      domains: ['gross_motor', 'play'],
      difficulty: 'medium',
      durationMinutes: 10,
      materials: b('ခိုင်ခံ့သော ဆိုဖာ သို့မဟုတ် နိမ့်သော စားပွဲ၊ ကစားစရာ တစ်ခု', 'A stable sofa or low table, and one toy'),
      setup: b('ပရိဘောဂ ဘေးပတ်လည်ကို ရှင်းလင်းပြီး ကြမ်းပြင်ပေါ် ဖျာ သို့မဟုတ် ပျော့သော အခင်း ခင်းပါ။', 'Clear the floor around the furniture and lay a mat or soft covering.'),
      instructions: [
        b('ကလေးအား ပရိဘောဂကို ကိုင်၍ ရပ်စေပါ။', 'Help her stand holding the furniture.'),
        b('ကစားစရာကို လက်တစ်လှမ်း ဘေးတွင် တင်ထားပါ။', 'Place the toy one arm-length to the side.'),
        b('ကလေး ဘေးတိုက် လှမ်းရန် အားပေးပါ — မဆွဲပါနှင့်။', 'Encourage her to step sideways — do not pull her.'),
        b('ရောက်လျှင် အားပေးပြီး ကစားစရာဖြင့် ခဏ ကစားခွင့် ပေးပါ။', 'When she arrives, celebrate and let her play with the toy.'),
        b('ကလေး ပင်ပန်းလျှင် သို့မဟုတ် စိတ်ပျက်လျှင် ရပ်ပါ။', 'Stop if she is tired or frustrated.'),
      ],
      safety: b('ကလေး ကိုင်တွယ်မည့် ပရိဘောဂသည် မရွေ့မလှုပ်ဘဲ ခိုင်ခံ့ရမည်။ ကလေးမှီလိုက်လျှင် လဲကျနိုင်သော စားပွဲနှင့် စင်များကို မသုံးပါနှင့်။ လိုအပ်ပါက နံရံတွင် ခိုင်ခန့်စွာ တပ်ဆင်ထားပါ။ ထောင့်ချွန်များကို ဖုံးအုပ်ပြီး ကြမ်းပြင်ပေါ်မှ အန္တရာယ်ရှိသော ပစ္စည်းများကို ဖယ်ရှားပါ။ ကလေးလမ်းလျှောက်စက်ကို မသုံးပါနှင့်။ လေ့ကျင့်နေစဉ် ကလေးအနီးတွင် အမြဲရှိနေပါ။', 'The furniture must not move — do not use anything that could tip, and anchor it to the wall. Pad sharp corners. Keep hazards off the floor. Do not use a baby walker. Stay beside her throughout.'),
      indoor: true,
      outdoor: false,
      oneChild: true,
      group: false,
      parentChild: true,
      outcomes: [
        b('ခြေထောက် ခွန်အားနှင့် ချိန်ခွင်လျှာ တိုးတက်လာသည်။', 'Stronger legs and better balance.'),
        b('ကိုယ်တိုင် ရွေ့လျားနိုင်မှုအပေါ် ယုံကြည်မှု တိုးလာသည်။', 'Growing confidence in moving herself.'),
      ],
      variations: [
        b('ပရိဘောဂ နှစ်ခုကို တစ်လှမ်းစာ ကွာအောင် ထားပေးပါ။', 'Place two stable items one step apart.'),
        b('သီချင်း ဆိုရင်း လှမ်းစေပါ။', 'Sing while she steps.'),
      ],
      lowCost: true,
      offline: true,
      tags: ['cruising', 'gross_motor'],
    }),
    'Cruising practice and the safety points around it follow CDC milestone checklists, AAP milestone guidance, the WHO motor development study windows of achievement, the paediatric physical-therapy reference and the Bright Futures preventive-care schedule in the registry.',
  ),
];

const ACTIVITIES_B: SeedItem[] = [
  kb(
    activity({
      slug: 'roll_the_ball_back',
      title: b('ဘောလုံး လှိမ့်ပေး လှိမ့်ပြန်', 'Roll the ball back'),
      summary: b('ဘောလုံးကို အပြန်အလှန် လှိမ့်ခြင်းဖြင့် အလှည့်ကျ ကစားခြင်းနှင့် လက်–မျက်စိ ညှိနှိုင်းမှုကို လေ့ကျင့်ပေးသည်။', 'Rolling a ball back and forth practises turn-taking and hand–eye coordination.'),
      ageGroupKey: '10_12m',
      domains: ['social', 'gross_motor'],
      difficulty: 'easy',
      durationMinutes: 10,
      materials: b('ပျော့သော ဘောလုံး တစ်လုံး (လက်နှစ်ဖက်ဖြင့် ကိုင်ရသော အရွယ်)', 'One soft ball, large enough to need two hands'),
      setup: b('ကလေးနှင့် မျက်နှာချင်းဆိုင် ထိုင်ပါ — နှစ်ပေခန့် ကွာပါစေ။ ကြမ်းပြင်ကို ရှင်းလင်းပါ။', 'Sit facing her about two feet apart on a clear floor.'),
      instructions: [
        b('ဘောလုံးကို ဖြည်းညှင်းစွာ ကလေးဆီ လှိမ့်ပေးပါ။', 'Roll the ball gently towards her.'),
        b('“ဘောလုံး လာပြီ” ဟု ပြောပြပါ။', 'Say "here comes the ball".'),
        b('ကလေး ကိုင်မိလျှင် “အမေ့ဆီ ပြန်ပေးပါ” ဟု လက်ဖြန့်၍ တောင်းပါ။', 'When she catches it, hold out your hands and ask for it back.'),
        b('ပြန်မလှိမ့်သေးလျှင် စိတ်မပူပါနှင့် — အနီးမှ ယူပြီး ထပ်စတင်ပါ။', 'If she does not roll it back yet, that is fine — take it gently and start again.'),
        b('အလှည့်ကျ ဖြစ်လာလျှင် ရယ်မောပြီး ဆက်ကစားပါ။', 'As turn-taking appears, laugh together and keep going.'),
      ],
      safety: b('ကလေးပါးစပ်ထဲ ဝင်နိုင်လောက်အောင် သေးသော ဘောလုံးကို မသုံးပါနှင့်။ မျိုချမိပြီး အသက်ရှူလမ်းကြောင်း ပိတ်ဆို့နိုင်သည်။ လေပူဖောင်းကိုလည်း မသုံးပါနှင့်။ အပြင်တွင် ကစားပါက ကားလမ်း၊ ရေအိုင်နှင့် လှေကားများမှ ဝေးသောနေရာကို ရွေးပါ။', 'Do not use a ball small enough to enter her mouth — it is a choking risk. Never use a balloon. If playing outside, stay away from roads, water and steps.'),
      indoor: true,
      outdoor: true,
      oneChild: true,
      group: true,
      parentChild: true,
      outcomes: [
        b('အလှည့်ကျ ကစားခြင်းကို စတင် နားလည်လာသည်။', 'Early understanding of taking turns.'),
        b('ထိုင်လျက် ချိန်ခွင်လျှာနှင့် လက်–မျက်စိ ညှိနှိုင်းမှု တိုးတက်လာသည်။', 'Better sitting balance and hand–eye coordination.'),
      ],
      variations: [
        b('မောင်နှမနှင့် သုံးယောက် ဝိုင်း၍ လှိမ့်ပါ။', 'Roll in a triangle with a sibling.'),
        b('ဘောလုံးအစား ပလတ်စတစ် ခွက်ကို လှိမ့်ပါ။', 'Roll a plastic cup instead of a ball.'),
      ],
      lowCost: true,
      offline: true,
      tags: ['turn_taking', 'ball_play'],
    }),
    'Turn-taking ball play draws on AAP guidance on the power of play, the WHO Care for Child Development package, CDC milestone guidance and the paediatric physical-therapy reference held in the registry.',
  ),
  kb(
    activity({
      slug: 'show_me_and_name_it',
      title: b('ညွှန်ပြပြီး နာမည်ခေါ်ခြင်း', 'Point and name it'),
      summary: b('ကလေး ညွှန်ပြသည့် အရာကို နာမည်ခေါ်ပေးခြင်းဖြင့် ဝေါဟာရနှင့် ပူးတွဲ အာရုံစိုက်မှုကို တည်ဆောက်ပေးသည်။', 'Naming what she points at builds vocabulary and shared attention.'),
      ageGroupKey: '10_12m',
      domains: ['language', 'communication'],
      difficulty: 'easy',
      durationMinutes: 10,
      materials: b('မလိုပါ — အိမ်တွင်း ပစ္စည်းများ သို့မဟုတ် အိမ်ပြင် မြင်ကွင်း', 'None — everyday objects at home or things seen outdoors'),
      setup: b('ကလေးကို ချီထားပါ သို့မဟုတ် သင့်ဘေးတွင် ထိုင်စေပါ။ တီဗီနှင့် ရေဒီယိုကို ပိတ်ပါ။', 'Hold her or sit her beside you. Turn off the TV and radio.'),
      instructions: [
        b('ကလေး ဘာကို ကြည့်နေသည်၊ ညွှန်ပြနေသည်ကို စောင့်ကြည့်ပါ။', 'Watch what she is looking at or pointing to.'),
        b('ထိုအရာကို ရိုးရှင်းစွာ နာမည်ခေါ်ပါ — “ဖန်ခွက်”၊ “ခွေး”။', 'Name it simply — "cup", "dog".'),
        b('စကားလုံး တစ်လုံး နှစ်လုံးဖြင့် ထပ်ဖြည့်ပါ — “ခွေး ပြေးနေတယ်”။', 'Add one or two words — "the dog is running".'),
        b('ကလေး အသံထွက်လျှင် စောင့်ပြီး ပြန်ဖြေပါ — စကားပြောသလို အလှည့်ကျ ဖြစ်စေပါ။', 'When she makes a sound, pause and answer — make it a conversation.'),
        b('ကလေး၏ အာရုံ ပြောင်းသွားလျှင် ကလေးနောက် လိုက်ပါ — အတင်း မဆွဲပါနှင့်။', 'When her attention moves, follow her lead rather than pulling her back.'),
      ],
      safety: b('ညွှန်ပြသည့် အရာကို ကိုင်ခွင့်ပေးလျှင် ပါးစပ်ထဲ ဝင်နိုင်သော အရာ မဟုတ်ကြောင်း အရင် စစ်ဆေးပါ။ အိမ်ပြင်တွင် လမ်းဘေး၊ ရေနှင့် အပူပစ္စည်းများမှ ဝေးပါစေ။ စကားပြောရန် အတင်းမတိုက်တွန်းပါနှင့်။', 'If you let her hold what she points at, check first that it cannot fit in her mouth. Outdoors, stay away from roads, water and hot objects. Never pressure her to say a word.'),
      indoor: true,
      outdoor: true,
      oneChild: true,
      group: false,
      parentChild: true,
      outcomes: [
        b('ညွှန်ပြခြင်းနှင့် ပူးတွဲ အာရုံစိုက်မှု တိုးတက်လာသည်။', 'Growing pointing and joint attention.'),
        b('နားလည်သော ဝေါဟာရ တိုးပွားလာသည်။', 'A larger understood vocabulary.'),
      ],
      variations: [
        b('ဈေးသွားစဉ် အသီးအရွက် နာမည်များ ခေါ်ပြပါ။', 'Name fruits and vegetables at the market.'),
        b('စာအုပ်ထဲ ပုံများကို ညွှန်ပြခိုင်းပါ။', 'Ask her to point at pictures in a book.'),
      ],
      lowCost: true,
      offline: true,
      tags: ['pointing', 'joint_attention', 'vocabulary'],
    }),
    'Following the child’s pointing and naming what she sees is supported by the NHS early-talking guidance, CDC milestone guidance, the child-directed speech research paper and the WHO Care for Child Development package in the registry.',
  ),
];

const ACTIVITIES_C: SeedItem[] = [
  kb(
    activity({
      slug: 'first_words_book_share',
      title: b('ပထမဆုံး စကားလုံးများနှင့် စာအုပ်ဖတ်ခြင်း', 'First words book sharing'),
      summary: b('နေ့စဉ် စာအုပ်ကို အတူဖွင့်ကြည့်ခြင်းသည် ဝေါဟာရ၊ အာရုံစိုက်မှုနှင့် ရင်းနှီးမှုကို တည်ဆောက်ပေးသည်။', 'Sharing a book each day builds vocabulary, attention and closeness.'),
      ageGroupKey: '10_12m',
      domains: ['language', 'social'],
      difficulty: 'easy',
      durationMinutes: 10,
      materials: b('ပုံကြီးကြီး ရှိသော စာအုပ် တစ်အုပ် (စက္ကူထူ သို့မဟုတ် အဝတ်စာအုပ်)၊ မရှိလျှင် ကိုယ်တိုင် ဆွဲထားသော ပုံများ', 'One board or cloth book with large pictures, or home-made picture cards'),
      setup: b('ကလေးကို ပေါင်ပေါ် ထိုင်စေပါ။ တီဗီ ပိတ်ပါ။ တိတ်ဆိတ်သော နေရာ ရွေးပါ။', 'Sit her on your lap in a quiet place with the TV off.'),
      instructions: [
        b('စာမျက်နှာ တစ်ချပ် ဖွင့်ပြီး ပုံကို ညွှန်ပြပါ။', 'Open one page and point at a picture.'),
        b('ပုံကို နာမည်ခေါ်ပါ — “ကြက်”၊ “ဘော်လုံး”။', 'Name the picture — "chicken", "ball".'),
        b('ကလေးက စာအုပ်ကို ကိုင်၊ ပါးစပ်ထဲထည့်၊ စာမျက်နှာ ပြန်လှန်လျှင် ခွင့်ပြုပါ — ဤသည်မှာ ဖတ်ခြင်း၏ အစပင်။', 'Let her hold it, mouth it and flip pages — that is reading at this age.'),
        b('စာသားကို အစအဆုံး မဖတ်ရပါ — ကလေး စိတ်ဝင်စားသော ပုံအပေါ်တွင် ရပ်နေပါ။', 'You do not have to read every word — stay on the page she likes.'),
        b('ကလေး ထွက်သွားလျှင် ရပ်ပြီး နောက်တစ်ကြိမ် ပြန်လုပ်ပါ။', 'If she moves away, stop and try again later.'),
      ],
      safety: b('စာအုပ်၏ အနားများ ချွန်ထက်ခြင်း မရှိစေရ။ ကပ်ခွာ စတစ်ကာ၊ ကလေး ဆွဲဖြုတ်နိုင်သော အပိုပစ္စည်းများ ပါသော စာအုပ်များကို ရှောင်ပါ — ပါးစပ်ထဲ ဝင်နိုင်သည်။ ကလေးအား စာအုပ်နှင့် တစ်ယောက်တည်း မထားခဲ့ပါနှင့်။', 'Check the book has no sharp edges. Avoid books with stickers or small parts she could pull off and put in her mouth. Do not leave her alone with the book.'),
      indoor: true,
      outdoor: false,
      oneChild: true,
      group: true,
      parentChild: true,
      outcomes: [
        b('နားထောင်နိုင်သော အချိန် ကြာလာသည်။', 'Longer shared attention.'),
        b('ဝေါဟာရနှင့် စာအုပ်အပေါ် စိတ်ဝင်စားမှု တိုးလာသည်။', 'More vocabulary and interest in books.'),
      ],
      variations: [
        b('မိသားစု ဓာတ်ပုံအယ်လ်ဘမ်ကို အတူကြည့်ပြီး နာမည်ခေါ်ပါ။', 'Look at a family photo album and name people.'),
        b('အိပ်ရာဝင်ချိန် လုပ်ရိုးလုပ်စဉ်ထဲ ထည့်ပါ။', 'Make it part of the bedtime routine.'),
      ],
      lowCost: true,
      offline: true,
      tags: ['reading', 'book_sharing', 'vocabulary'],
    }),
    'Daily book sharing in the first year is supported by the AAP literacy policy, the Canadian early-literacy guidance, the shared book-reading research paper and the NHS early-talking guidance held in the registry.',
  ),
  kb(
    activity({
      slug: 'open_cup_sips',
      title: b('ခွက်ဖြင့် ရေသောက် လေ့ကျင့်ခြင်း', 'Open cup practice'),
      summary: b('သေးငယ်သော ခွက်ဖြင့် ရေအနည်းငယ် သောက်ခြင်းသည် ခွက်မှ သောက်တတ်ရန်နှင့် ကိုယ်တိုင် လုပ်ဆောင်နိုင်မှုကို လေ့ကျင့်ပေးသည်။', 'Sipping a little water from a small open cup helps your child practise drinking from a cup and doing more for themselves.'),
      ageGroupKey: '10_12m',
      domains: ['self_help', 'nutrition'],
      difficulty: 'easy',
      durationMinutes: 5,
      materials: b('သေးငယ်ပြီး မကွဲသော ခွက် တစ်လုံး၊ သန့်ရှင်းသော ရေ အနည်းငယ်', 'One small unbreakable cup and a little clean water'),
      setup: b('ကလေးအား မတ်မတ် ထိုင်စေပါ — ထိုင်ခုံတွင် ဖြစ်စေ၊ သင့်ပေါင်ပေါ်တွင် ဖြစ်စေ။ အောက်တွင် အဝတ် ခင်းပါ။', 'Sit her upright in a chair or on your lap, with a cloth underneath.'),
      instructions: [
        b('ခွက်ထဲ ရေ အနည်းငယ်သာ ထည့်ပါ (တစ်ဝက်အောက်)။', 'Put only a small amount of water in the cup — less than half.'),
        b('ခွက်ကို ကလေး၏ အောက်နှုတ်ခမ်းတွင် ဖြည်းညှင်းစွာ ကပ်ပေးပါ။', 'Rest the cup gently on her lower lip.'),
        b('ခွက်ကို ရေက အောက်နှုတ်ခမ်းကို ထိရုံသာ ဖြည်းညှင်းစွာ စောင်းပေးပါ။ ကလေးကိုယ်တိုင် စုပ်သောက်ပြီး မျိုချနိုင်ရန် စောင့်ပါ — ပါးစပ်ထဲသို့ မလောင်းထည့်ပါနှင့်။', 'Tilt the cup only until the water touches the lower lip. Let the child sip and swallow at their own pace—do not pour liquid into the mouth.'),
        b('ကလေး ခွက်ကို ကိုင်လိုလျှင် သင့်လက်ဖြင့် အတူ ကိုင်ပေးပါ။', 'If she wants to hold it, hold it together with her.'),
        b('တစ်ရက်လျှင် စားသောက်ချိန်တွင် အနည်းငယ်စီ လေ့ကျင့်ပါ — ဖိအားမပေးပါနှင့်။', 'Practise a little at mealtimes — never force it.'),
      ],
      safety: b('ကလေး မတ်မတ် ထိုင်နေစဉ်သာ တိုက်ပါ — လှဲလျက် မတိုက်ပါနှင့်။ ကလေးအား ခွက်နှင့် တစ်ယောက်တည်း မထားပါနှင့်။ ကလေး ချောင်းဆိုးလျှင် ရပ်ပါ။ ဖန်ခွက် သို့မဟုတ် ကွဲနိုင်သော ခွက်ကို မသုံးပါနှင့်။ အိပ်ရာထဲတွင် ခွက် သို့မဟုတ် ပုလင်း မထားခဲ့ပါနှင့် — သွားပိုးစားနိုင်သည်။', 'Only offer it while she is sitting upright, never lying down. Do not leave her alone with the cup. Stop if she coughs. Do not use glass or anything breakable. Never leave a cup or bottle with her in bed — it can contribute to tooth decay.'),
      indoor: true,
      outdoor: false,
      oneChild: true,
      group: false,
      parentChild: true,
      outcomes: [
        b('ခွက်ဖြင့် သောက်နိုင်စွမ်း တဖြည်းဖြည်း တိုးတက်လာသည်။', 'Gradually better drinking from a cup.'),
        b('ကိုယ်တိုင် လုပ်နိုင်မှုအပေါ် ယုံကြည်မှု တိုးလာသည်။', 'Growing confidence in doing things herself.'),
      ],
      variations: [
        b('စားသောက်ချိန်တိုင်း ခွက်ကို စားပွဲပေါ် တင်ထားပေးပါ။', 'Keep the cup on the table at every meal.'),
        b('မိဘက ခွက်ဖြင့် သောက်ပြပါ — ကလေးက အတုယူတတ်သည်။', 'Drink from your own cup so she can copy you.'),
      ],
      lowCost: true,
      offline: true,
      tags: ['cup_drinking', 'self_feeding'],
    }),
    'Open-cup practice and the safety points around it follow the WHO infant and young child feeding model chapter, CDC feeding guidance for 6–24 months, the paediatric occupational-therapy reference and AAP oral-health guidance in the registry.',
  ),
];

const PRINTABLES: SeedItem[] = [
  kb(
    printable({
      key: 'checklist_10_12m',
      title: b('၁၀–၁၂ လ မိဘ စစ်ဆေးစာရင်း', '10–12 month parent checklist'),
      description: b('၁၀–၁၂ လအရွယ်တွင် များသောအားဖြင့် တွေ့ရလေ့ရှိသည့် အချက်များ (ပရိဘောဂကိုင်၍ ရပ်ခြင်း၊ ကိုင်လျှောက်ခြင်း၊ လက်မနှင့် လက်ညှိုးဖြင့် ကောက်ကိုင်ခြင်း၊ ညွှန်ပြခြင်း၊ နာမည်ခေါ်လျှင် လှည့်ကြည့်ခြင်း၊ လက်ပြခြင်း၊ ပထမဆုံး စကားလုံးများ)၊ နေ့စဉ် လုပ်ဆောင်နိုင်သည့် အရာများ (စကားပြော၊ စာဖတ်၊ သီချင်းဆို၊ ကြမ်းပြင်ကစား၊ တစ်နေ့ သုံးနပ်နှင့် အကြားစာ၊ အိပ်ရာဝင် လုပ်ရိုးလုပ်စဉ်)၊ အိမ်တွင်း ဘေးကင်းရေး စစ်ဆေးရန် စာရင်း (လှေကား၊ ပြုတ်ကျနိုင်သော ပရိဘောဂ၊ ပြတင်းပေါက်၊ လျှပ်စစ်ပလပ်ပေါက်၊ ရေအိုး၊ အပူပစ္စည်း၊ ဆေးဝါး၊ ပါးစပ်ထဲ ဝင်နိုင်သော ပစ္စည်းငယ်များ)၊ ဆရာဝန်နှင့် ဆွေးနွေးသင့်သည့် အချက်များနှင့် အရေးပေါ် လက္ခဏာများကို ပုံနှိပ်၍ သုံးနိုင်သော စာရွက်။ ကလေးတစ်ဦးနှင့်တစ်ဦး ဖွံ့ဖြိုးမှုအချိန် ကွာခြားနိုင်သည်။ ဤသည် ရောဂါရှာဖွေရေး စစ်ဆေးမှု မဟုတ်ပါ — အမှတ်ပေးခြင်း၊ အောင်/ရှုံး သတ်မှတ်ခြင်း မပါဝင်ပါ။ မိဘများ လေ့လာမှတ်သားရန်နှင့် ကျန်းမာရေးဝန်ထမ်းနှင့် ပြောဆိုရန် အထောက်အကူ စာရွက်သာ ဖြစ်သည်။', 'A printable sheet covering what is often seen between 10 and 12 months (pulling to stand, cruising, picking up small pieces with thumb and finger, pointing, turning to her name, waving, first words), what you can do each day (talking, reading, singing, floor play, three meals plus snacks, a bedtime routine), a home-safety walk-through list (stairs, furniture that could tip, windows, sockets, water containers, hot things, medicines, small objects), what to discuss with a health worker, and emergency signs. Children vary in when they reach each step. This is not a screening or diagnostic test — there is no score and no pass or fail. It is a guidance sheet to help you observe and to help you talk with your health worker.'),
      format: 'A4 PDF',
    }),
    'The observation prompts follow CDC milestone checklists and AAP milestone guidance, the feeding prompts follow the WHO infant and young child feeding model chapter, the sleep prompts follow AAP safe-sleep guidance, and the schedule of routine reviews follows NHS baby review guidance in the registry.',
  ),
];

export const M10_12M: SeedItem[] = [
  ...MILESTONES, ...GUIDES, ...GUIDES_B, ...GUIDES_C, ...GUIDES_D,
  ...GUIDES_E, ...GUIDES_F, ...GUIDES_G,
  ...ACTIVITIES, ...ACTIVITIES_B, ...ACTIVITIES_C, ...PRINTABLES,
];
