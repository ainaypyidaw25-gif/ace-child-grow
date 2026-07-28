import { activity, guide, milestone, printable, type Bilingual, type SeedItem } from '../../types';
import { kb } from '../infant/editorial';

const b = (mm: string, en: string): Bilingual => ({ mm, en });
type Skill = [domain: string, title: Bilingual, observe: Bilingual];
type GuideFocus = [domain: string, focus: Bilingual, daily: Bilingual];
type Play = [slug: string, title: Bilingual, goal: Bilingual, materials: Bilingual, step: Bilingual, safety: Bilingual, domains: string[]];
type Band = { key: string; mm: string; en: string; skills: Skill[]; guides: GuideFocus[]; play: Play[] };

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
    ['social', b('အခြားကလေးနှင့် အလှည့်ကျကစားခြင်း', 'Takes turns with another child'), b('လူကြီးအကူအညီဖြင့် အလှည့်ကျ ကစားနိုင်ပါသလား။', 'Can take turns with adult support?')],
  ],
  guides: [
    ['nutrition', b(`${mm}အရွယ်တွင် မိသားစုစားပွဲ၌ အုပ်စုစုံ အစားအစာနှင့် ရေကို ပုံမှန်ပေးပါ။`, `At ${en}, offer varied family foods and water at regular meals.`), b('အစားပြင်ခြင်း သို့မဟုတ် စားပွဲခင်းခြင်းတွင် လွယ်ကူသောအလုပ်တစ်ခု ပါဝင်ခွင့်ပေးပါ။', 'Include the child in one simple food-preparation or table task.')],
    ['sleep', b(`${mm}အရွယ်အတွက် ပုံမှန်အိပ်ချိန်၊ နိုးချိန်နှင့် ငြိမ်သက်သော အိပ်မီအလေ့အထ ထားပါ။`, `Keep regular sleep and wake times with a calm bedtime routine at ${en}.`), b('အိပ်မီ စာဖတ်ခြင်းကို မျက်နှာပြင်ကြည့်ခြင်းအစား အသုံးပြုပါ။', 'Choose shared reading instead of screens before bed.')],
    ['safety', b(`${mm}အရွယ်တွင် လမ်းမ၊ ရေ၊ မီး၊ ပြတင်းပေါက်နှင့် ဆေးဝါးအန္တရာယ်များကို လူကြီးက ဆက်လက်ကာကွယ်ရပါမည်။`, `At ${en}, adults still need to prevent traffic, water, burn, window, and medicine hazards.`), b('အရေးပေါ်အခြေအနေတွင် ယုံကြည်ရသော လူကြီးကို ခေါ်ရန် လေ့ကျင့်ပါ။', 'Practise calling a trusted adult when something feels unsafe.')],
    ['daily_routine', b(`${mm}အရွယ်တွင် သွားတိုက်ခြင်း၊ အဝတ်ဝတ်ခြင်းနှင့် ပစ္စည်းသိမ်းခြင်းကို ပုံမှန်အစီအစဉ်ဖြင့် လေ့ကျင့်ပါ။`, `At ${en}, practise brushing, dressing, and tidying in a predictable order.`), b('ပုံနှစ်ပုံ သို့မဟုတ် သုံးပုံပါ လုပ်ရိုးလုပ်စဉ်ဇယား သုံးပါ။', 'Use a two- or three-picture routine chart.')],
  ],
  play: [
    [`move_path_${key}`, b('လှုပ်ရှားလမ်းကြောင်း ကစားခြင်း', 'Movement path'), b('ဟန်ချက်နှင့် ညွှန်ကြားချက်လိုက်နာမှု', 'Balance and following directions'), b('ကြိုး သို့မဟုတ် စက္ကူတိပ်', 'Rope or paper tape'), b('မျဉ်းပေါ် လျှောက်၊ ခုန်၊ ရပ် စသည့် အဆင့်များ ပြောပေးပါ။', 'Call out walk, jump, and stop along the path.'), b('ချော်မလဲနိုင်သော နေရာတွင် လူကြီးကြီးကြပ်ပါ။', 'Use a non-slip area with adult supervision.'), ['gross_motor','play']],
    [`picture_story_${key}`, b('ပုံသုံးပုံ ဇာတ်လမ်းဆင်ခြင်း', 'Three-picture story'), b('အစီအစဉ်နှင့် စကားပြောမှု', 'Sequencing and language'), b('ကိုယ်တိုင်ဆွဲထားသော ပုံသုံးပုံ', 'Three simple hand-drawn pictures'), b('ပုံများကို အစီအစဉ်တကျထားပြီး ကလေးကို ပြောပြခိုင်းပါ။', 'Arrange the pictures and invite the child to tell the story.'), b('မှားသည်ဟု မပြောဘဲ ကလေး၏စိတ်ကူးကို နားထောင်ပါ။', 'Listen without labelling the child’s idea wrong.'), ['language','cognitive']],
    [`helper_sort_${key}`, b('အိမ်မှုကူညီ ခွဲခြားကစားခြင်း', 'Helper sorting game'), b('အမျိုးအစားခွဲခြင်းနှင့် ကိုယ်တိုင်လုပ်နိုင်မှု', 'Sorting and independence'), b('သန့်ရှင်းသော ခြေအိတ် သို့မဟုတ် ပလတ်စတစ်ခွက်များ', 'Clean socks or plastic cups'), b('အရောင် သို့မဟုတ် ပိုင်ရှင်အလိုက် ခွဲစေပါ။', 'Sort by color or owner.'), b('ဖန်၊ ချွန်ထက်သော သို့မဟုတ် ဆေးဝါးပစ္စည်း မသုံးပါနှင့်။', 'Do not use glass, sharp items, or medicine containers.'), ['cognitive','self_help']],
  ],
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
    authored.push(linked(guide(band.key, domain, {
      title: b(`${band.mm} — ${domain === 'nutrition' ? 'အာဟာရ' : domain === 'sleep' ? 'အိပ်စက်ခြင်း' : domain === 'safety' ? 'ဘေးကင်းလုံခြုံရေး' : domain === 'play' ? 'ကစားခြင်း' : 'နေ့စဉ်လုပ်ရိုးလုပ်စဉ်'} လမ်းညွှန်`, `${band.en} — ${domain.replace('_', ' ')} guide`),
      why: focus,
      observationQuestions: [b('သုံးရက်ခန့် လက်ရှိအလေ့အထကို မှတ်သားကြည့်ပါ။ ဘယ်အချိန်တွင် အဆင်ပြေဆုံးလဲ။', 'Observe the current pattern for about three days. When does it work best?')],
      dailyActivities: [daily],
      weeklyActivities: [b('တစ်ပတ်ကုန်တွင် အဆင်ပြေခဲ့သော အချက်တစ်ခုကို ဆက်ထားပါ။', 'At the end of the week, keep one change that worked well.')],
      indoor: [daily], outdoor: domain === 'safety' || domain === 'play' ? [daily] : [],
      safety: GUIDE_SAFETY[domain] ?? GUIDE_SAFETY.daily_routine,
      parentTips: [b('အမိန့်ပေးသလို မပြောဘဲ ရွေးချယ်စရာနှစ်ခု ပေးပါ။', 'Offer two choices instead of turning the routine into a struggle.')],
      faq: [{ q: b('အခြားကလေးနှင့် မတူလျှင် စိုးရိမ်ရမလား။', 'What if my child is different from another child?'), a: b('ကလေးတစ်ဦးနှင့်တစ်ဦး အချိန်ကွာနိုင်သည်။ အရည်အချင်းပျောက်ဆုံးခြင်း သို့မဟုတ် ဆက်တိုက်စိုးရိမ်မှုရှိလျှင် ပညာရှင်နှင့် ဆွေးနွေးပါ။', 'Children vary. Seek professional advice for lost skills or persistent concerns.') }],
      redFlags: [b('ယခင်က ရရှိပြီးသား အရည်အချင်း ပျောက်ဆုံးခြင်း သို့မဟုတ် စား၊ အိပ်၊ အသက်ရှူရာတွင် ပြင်းထန်သော အခက်အခဲရှိခြင်း။', 'Loss of an acquired skill or serious difficulty eating, sleeping, or breathing.')],
      referral: b('စိုးရိမ်မှု ဆက်ရှိပါက ကလေးဆရာဝန် သို့မဟုတ် သင့်လျော်သော ကျန်းမာရေးပညာရှင်နှင့် ဆွေးနွေးပါ။', 'If concern continues, discuss it with a paediatrician or appropriate health professional.'),
      encouragement: b('သေးငယ်သော တိုးတက်မှုကို မှတ်သားပြီး ဖိအားမပေးဘဲ ဆက်လေ့ကျင့်ပါ။', 'Notice small gains and keep practising without pressure.'),
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
