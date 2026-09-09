export type ReviewerManualQueueGroup = 'content_type_summary' | 'clinical_safety_gap';

export type ReviewerManualQueueItem = {
  reportItem: number;
  claimId: string;
  group: ReviewerManualQueueGroup;
  titleMm: string;
  titleEn: string;
  problemMm: string;
  problemEn: string;
  suggestedMm: string;
  searchQuery: string;
  suggestedDimensions: Array<'native_myanmar' | 'evidence' | 'safety' | 'clinical'>;
  source: string;
};

const SOURCE = 'ACE-clinical-review-sheet-all-3.pdf / ACE-clinical-review-sheet-all.html';

/**
 * Batch 4 report items 78–90 did not identify exact content records. This list
 * preserves the original prompts for audit. Owner-authorized implementation
 * mappings live in reviewerManualResolutions.ts; those mappings are not
 * clinical credentials, evidence-source approvals, or publication decisions.
 */
export const REVIEWER_MANUAL_QUEUE: ReviewerManualQueueItem[] = [
  {
    reportItem: 78,
    claimId: 't2.type.activity',
    group: 'content_type_summary',
    titleMm: 'လှုပ်ရှားမှုများအတွက် အခြေခံ ဘေးကင်းရေး စည်းမျဉ်းများ',
    titleEn: 'Baseline safety rules for activities',
    problemMm: 'Report တွင် activity 22 ခု၏ meta-summary ကိုသာ ညွှန်ထားပြီး အစားထိုးရမည့် record slug မသတ်မှတ်ထားပါ။',
    problemEn: 'The report points to a 22-activity meta-summary but does not identify an exact record slug.',
    suggestedMm: 'ဖွံ့ဖြိုးမှု အထောက်အကူပြု လှုပ်ရှားမှုများ ဆောင်ရွက်ရာတွင် လိုက်နာရန် အခြေခံ ဘေးကင်းရေး စည်းမျဉ်းများ — ကလေးငယ်ကို ပြင်းထန်စွာ လှုပ်ခါခြင်း သို့မဟုတ် လေထဲသို့ ပစ်မြှောက်ကစားခြင်း လုံးဝ မပြုလုပ်ရပါ။ ပါးစပ်ထဲ ဝင်ရောက်နိုင်သော အကြွေစေ့၊ ဓာတ်ခဲဝိုင်း၊ သံလိုက်တုံးနှင့် အစေ့အဆန် အသေးစားများကို ကလေးအနီး လုံးဝ မထားရပါ။ ပလတ်စတစ်အိတ် သို့မဟုတ် ကြိုးရှည်များကို ကစားစရာအဖြစ် မသုံးရပါ။ ကလေးငယ် အိပ်ပျော်သွားပါက ဘေးကင်းသော သီးသန့် အိပ်ရာပေါ်သို့ ပက်လက်အနေအထားဖြင့် ချက်ချင်း ပြောင်းရွှေ့သိပ်ပါ။',
    searchQuery: 'safety activity',
    suggestedDimensions: ['native_myanmar', 'evidence', 'safety', 'clinical'],
    source: SOURCE,
  },
  {
    reportItem: 79,
    claimId: 't2.type.lesson',
    group: 'content_type_summary',
    titleMm: 'ကျန်းမာသော အိပ်စက်မှု သင်ခန်းစာ အကျဉ်းချုပ်',
    titleEn: 'Healthy-sleep lesson summary',
    problemMm: 'Meta-summary ကိုသာ ညွှန်ထားပြီး lsn_healthy_sleep ထဲက အစားထိုးရမည့် field ကို မသတ်မှတ်ထားပါ။',
    problemEn: 'Only a meta-summary is identified; the exact field in lsn_healthy_sleep is not specified.',
    suggestedMm: 'ကျန်းမာသော အိပ်စက်မှုဆိုင်ရာ ပညာပေး သင်ခန်းစာ — ဤသင်ခန်းစာသည် ကလေးငယ်များ ကောင်းမွန်စွာ အိပ်ပျော်စေရန် ပုံမှန် အိပ်ရာဝင် အလေ့အထများ ဖန်တီးပေးခြင်း၊ အိပ်ချိန်ပတ်ဝန်းကျင်ကို အေးမြမှောင်မိုက်စေခြင်းနှင့် အိပ်ရာမဝင်မီ မျက်နှာပြင် (Screen) ကြည့်ရှုမှုများကို ရှောင်ကြဉ်ခြင်း စသည့် အထောက်အကူပြု နည်းလမ်းများကို ရှင်းပြထားသော အထွေထွေ ပညာပေး အကြောင်းအရာ ဖြစ်ပါသည်။',
    searchQuery: 'lsn_healthy_sleep',
    suggestedDimensions: ['native_myanmar', 'evidence', 'safety'],
    source: SOURCE,
  },
  {
    reportItem: 80,
    claimId: 't2.type.milestone',
    group: 'content_type_summary',
    titleMm: 'ဖွံ့ဖြိုးမှုမှတ်တိုင် သတိပေးချက်',
    titleEn: 'Developmental-milestone warning',
    problemMm: 'Milestone 29 ခု၏ meta-summary ကိုသာ ညွှန်ထားပြီး target record မသတ်မှတ်ထားပါ။',
    problemEn: 'The report identifies a 29-milestone meta-summary, not a target record.',
    suggestedMm: 'ဖွံ့ဖြိုးမှုအဆင့် (Milestones) ဆိုင်ရာ သတိပြုဖွယ်ရာ အချက်များ — အသက်အရွယ်အလိုက် သတ်မှတ်ထားသော ဖွံ့ဖြိုးမှု အဆင့်များကို ကလေးငယ်က ပြည့်မီရန် သိသိသာသာ နောက်ကျနေခြင်း သို့မဟုတ် ယခင် တတ်မြောက်ပြီးသော စွမ်းရည်များ ပြန်လည် ဆုံးရှုံးသွားခြင်း ရှိပါက ကျန်းမာရေးဝန်ထမ်းနှင့် အမြန်ဆုံး ပြသစစ်ဆေးပါ။ ဤစစ်ဆေးမှုသည် ရောဂါအမည် အတည်ပြုခြင်း မဟုတ်ဘဲ စောစီးစွာ စစ်ဆေးမှု ခံယူရန် သတိပေးချက်သာ ဖြစ်ပါသည်။',
    searchQuery: 'milestone red',
    suggestedDimensions: ['native_myanmar', 'evidence', 'clinical'],
    source: SOURCE,
  },
  {
    reportItem: 81,
    claimId: 't2.type.printable',
    group: 'content_type_summary',
    titleMm: 'ပုံနှိပ်စစ်ဆေးလွှာ အသုံးပြုမှု သတိပေးချက်',
    titleEn: 'Printable checklist use disclaimer',
    problemMm: 'Printable 9 ခု၏ meta-summary ကိုသာ ညွှန်ထားပြီး target record/field မသတ်မှတ်ထားပါ။',
    problemEn: 'The report identifies a nine-printable meta-summary without a target record or field.',
    suggestedMm: 'ပုံနှိပ်စစ်ဆေးလွှာနှင့် မှတ်တမ်းစာရွက်များ အသုံးပြုခြင်း လမ်းညွှန်ချက် — ဤစစ်ဆေးလွှာများနှင့် ကြီးထွားမှု/အိပ်စက်မှု မှတ်တမ်းများသည် မိဘများအနေဖြင့် မိမိကလေး၏ ဖွံ့ဖြိုးမှုကို အိမ်တွင် စောင့်ကြည့်မှတ်တမ်းတင်ရန်အတွက်သာ ဖြစ်ပါသည်။ ဤမှတ်တမ်းများမှ ရလဒ်သည် ဆေးပညာဆိုင်ရာ ရောဂါအတည်ပြုချက် မဟုတ်ဘဲ ဆရာဝန်နှင့် ပြသတိုင်ပင်ရာတွင် အထောက်အကူပြု အချက်အလက်အဖြစ် အသုံးပြုရန် ဖြစ်ပါသည်။',
    searchQuery: 'printable checklist',
    suggestedDimensions: ['native_myanmar', 'evidence', 'clinical'],
    source: SOURCE,
  },
  {
    reportItem: 82,
    claimId: 't2.type.story',
    group: 'content_type_summary',
    titleMm: 'ကလေးပုံပြင် အမျိုးအစားအကြောင်း ရှင်းလင်းချက်',
    titleEn: 'Children’s-story content framing',
    problemMm: 'Story 3 ခု၏ meta-summary ကိုသာ ညွှန်ထားပြီး parent-visible target field မသတ်မှတ်ထားပါ။',
    problemEn: 'The report identifies a three-story meta-summary without a parent-visible target field.',
    suggestedMm: 'ကလေးပုံပြင်များ — ဤပုံပြင်များသည် ကလေးငယ်များ ဘာသာစကား ဖွံ့ဖြိုးတိုးတက်စေရန်၊ စိတ်ကူးဉာဏ် ရင့်သန်စေရန်နှင့် မိဘနှင့် သားသမီးအကြား သံယောဇဉ် ခိုင်မာစေရန်အတွက် ဖန်တီးထားသော ဖျော်ဖြေရေးနှင့် သင်ယူမှု အထောက်အကူပြု အကြောင်းအရာများ ဖြစ်ကြပါသည်။',
    searchQuery: 'story',
    suggestedDimensions: ['native_myanmar'],
    source: SOURCE,
  },
  {
    reportItem: 83,
    claimId: 't2.choking.under4',
    group: 'clinical_safety_gap',
    titleMm: 'အသက် ၄ နှစ်အထိ အစာတစ်ဆို့မှု ကာကွယ်ရေး',
    titleEn: 'Choking prevention through age four',
    problemMm: 'အသက် 13 လအထက် record အုပ်စုအတွက် အကြံပြုချက်ဖြစ်ပြီး သက်ရောက်မည့် exact records မသတ်မှတ်ထားပါ။',
    problemEn: 'This is a group-level recommendation for records above 13 months; exact affected records are not identified.',
    suggestedMm: 'အစာတစ်ဆို့ခြင်း အန္တရာယ်သည် အသက် ၄ နှစ်အထိ ဆက်လက်ရှိနေပါသည် — ကလေးငယ်က လမ်းလျှောက်တတ်ပြီး စကားပြောတတ်လျှင်ပင် အန္တရာယ် မကုန်သေးပါ။\n• စပျစ်သီးနှင့် ချယ်ရီခရမ်းချဉ်သီးများကို လေးစိတ် (အလျားလိုက်) ခွဲခြမ်းပြီးမှ ကျွေးပါ။ ဝက်အူချောင်းများကို အလျားလိုက် ထက်ခြမ်းခွဲပြီးမှ အပိုင်းငယ်လေးများ ဖြတ်တောက်ကျွေးပါ။\n• အခွံမာသီး အလုံးလိုက်များ၊ ပြောင်းဖူးပေါက်ပေါက်၊ မာကျောသော သကြားလုံးများ၊ အစေ့အဆန်များနှင့် မုန်လာဥနီ အစိမ်းတုံးများကို အသက် ၄ နှစ်အောက် ကလေးများအား လုံးဝ မကျွေးပါနှင့်။\n• အစာစားချိန်တွင် ကလေးကို အမြဲ မတ်မတ်ထိုင်၍ စားစေပါ — လမ်းလျှောက်ရင်း၊ ပြေးလွှားရင်း သို့မဟုတ် ကားစီးနေစဉ် လုံးဝ မစားပါစေနှင့်။\n• ကလေး အစာစားနေစဉ် လူကြီးက အနီးတွင် အမြဲ ရှိနေပေးပါ။',
    searchQuery: 'choking',
    suggestedDimensions: ['native_myanmar', 'evidence', 'safety', 'clinical'],
    source: SOURCE,
  },
  {
    reportItem: 84,
    claimId: 't2.fever.no_number',
    group: 'clinical_safety_gap',
    titleMm: 'ဖျားနာမှု ကိုယ်အပူချိန် ကိန်းဂဏန်းများ',
    titleEn: 'Numeric fever thresholds',
    problemMm: 'Record အများအပြားကို ပြောင်းနိုင်သော clinical threshold ဖြစ်ပြီး exact target fields မသတ်မှတ်ထားပါ။',
    problemEn: 'This clinical threshold may affect multiple records and exact target fields are not identified.',
    suggestedMm: 'ကလေးငယ် ဖျားနာပါက အပူချိန်တိုင်းကိရိယာ (သာမိုမီတာ) ဖြင့် တိကျစွာ တိုင်းတာပါ။ အောက်ပါ အပူချိန် သတ်မှတ်ချက်များ တွေ့ရှိပါက ဆေးရုံ/ဆေးခန်းသို့ အမြန်ဆုံး သွားရောက်ပြသပါ —\n• အသက် ၃ လအောက် — ကိုယ်အပူချိန် ၃၈ ဒီဂရီ စင်တီဂရိတ် (၁၀၀.၄ ဒီဂရီ ဖာရင်ဟိုက်) နှင့်အထက် ရှိပါက ကလေးငယ် ပုံမှန်အတိုင်း နေကောင်းနေပုံရလျှင်ပင် စောင့်မနေဘဲ အမြန်ဆုံး သွားရောက်ပြသပါ။\n• အသက် ၃ လမှ ၆ လ — ကိုယ်အပူချိန် ၃၉ ဒီဂရီ စင်တီဂရိတ် (၁၀၂.၂ ဒီဂရီ ဖာရင်ဟိုက်) နှင့်အထက် ရှိပါက အမြန်ဆုံး သွားရောက်ပြသပါ။\n• အသက်အရွယ်မရွေး — ဖျားနာခြင်းနှင့်အတူ အသက်ရှူရခက်ခဲခြင်း၊ ဖန်ခွက်ဖြင့်ဖိသော်လည်း မပျောက်သော အနီစက်များ ထွက်ခြင်း၊ လည်ပင်းတောင့်တင်းခြင်း သို့မဟုတ် နိုးရအလွန်ခက်ခဲခြင်းများ တွဲတွေ့ပါက ဆေးရုံသို့ ချက်ချင်း သွားရောက်ပြသပါ။\nအပူချိန်တိုင်းကိရိယာ မရှိပါက ကလေးငယ် ကိုယ်ပူနေပြီး အထက်ပါ အရေးပေါ်လက္ခဏာများ ရှိပါက စောင့်မနေဘဲ ချက်ချင်း ပြသပါ။',
    searchQuery: 'fever ဖျား',
    suggestedDimensions: ['native_myanmar', 'evidence', 'safety', 'clinical'],
    source: SOURCE,
  },
  {
    reportItem: 85,
    claimId: 't2.fever.under3m_wording',
    group: 'clinical_safety_gap',
    titleMm: 'အသက် ၃ လအောက် ဖျားနာမှု အရေးပေါ်စကားလုံး တစ်ပြေးညီရေး',
    titleEn: 'Consistent urgent wording for fever under three months',
    problemMm: 'တူညီသော rule ကို field/record အများအပြားတွင် စကားလုံးကွဲပြားစွာ ရေးထားသဖြင့် target အားလုံးကို အရင်စာရင်းပြုစုရန်လိုသည်။',
    problemEn: 'The same rule uses inconsistent wording across multiple fields and records; all targets must be enumerated first.',
    suggestedMm: 'အသက် ၃ လအောက် ကလေးငယ်များတွင် ကိုယ်အပူချိန် ၃၈ ဒီဂရီ စင်တီဂရိတ် (၁၀၀.၄ ဒီဂရီ ဖာရင်ဟိုက်) နှင့်အထက် ဖျားနာပါက ကလေးငယ် ပုံမှန်အတိုင်း နေကောင်းနေပုံရလျှင်ပင် စောင့်မနေဘဲ ကျန်းမာရေးဝန်ထမ်းနှင့် ချက်ချင်း သွားရောက်ပြသ စစ်ဆေးမှု ခံယူပါ။',
    searchQuery: 'birth_2m fever',
    suggestedDimensions: ['native_myanmar', 'evidence', 'safety', 'clinical'],
    source: SOURCE,
  },
  {
    reportItem: 86,
    claimId: 't2.nutrition.5_6m_urgency',
    group: 'clinical_safety_gap',
    titleMm: '၅–၆ လ ရေဓာတ်ခန်းခြောက်မှု အရေးပေါ် သတိပေးချက်',
    titleEn: 'Urgent dehydration warning at 5–6 months',
    problemMm: 'Referral urgency ကိုပြောင်းမည့် အကြံပြုချက်ဖြစ်ပြီး exact guide/field နှင့် evidence review မပြီးသေးပါ။',
    problemEn: 'The proposal changes referral urgency; the exact guide/field and evidence review are not complete.',
    suggestedMm: 'အောက်ပါ လက္ခဏာများ တွေ့ရှိပါက ကျန်းမာရေးဝန်ထမ်းနှင့် အမြန်ဆုံး ပြသပါ (မွေးကင်းစနှင့် နို့စို့အရွယ် ကလေးငယ်များတွင် ရေဓာတ်ခန်းခြောက်မှု အလွန် လျင်မြန်စွာ ဖြစ်ပေါ်နိုင်ပါသည်) —\n• ကိုယ်အလေးချိန် မတက်ခြင်း သို့မဟုတ် ကျဆင်းသွားခြင်း\n• ထပ်ခါတလဲလဲ အန်ခြင်း သို့မဟုတ် ဝမ်းလျှောခြင်း\n• မျိုချရ ခက်ခဲခြင်း၊ အစာစားတိုင်း ချောင်းဆိုးခြင်း သို့မဟုတ် တစ်ဆို့ခြင်း\n• သေးခံအနှီး စိုစွတ်မှု သိသိသာသာ လျော့နည်းသွားခြင်း၊ ပါးစပ်ခြောက်သွေ့ခြင်း၊ မျက်တွင်းချိုင့်ဝင်ခြင်း (ရေဓာတ်ခန်းခြောက်မှု လက္ခဏာများဖြစ်သဖြင့် ဆေးရုံသို့ ချက်ချင်း ပြသရန် လိုအပ်ပါသည်)။',
    searchQuery: '5_6m nutrition',
    suggestedDimensions: ['native_myanmar', 'evidence', 'safety', 'clinical'],
    source: SOURCE,
  },
  {
    reportItem: 87,
    claimId: 't2.rash.nonblanching',
    group: 'clinical_safety_gap',
    titleMm: 'ဖိသော်လည်း မပျောက်သော အနီစက်များ',
    titleEn: 'Non-blanching rash warning',
    problemMm: 'မွေးကင်းစမှ ၆ လအထိ ဘယ် records တွင် ထည့်ရမည်ကို report က မသတ်မှတ်ထားပါ။',
    problemEn: 'The report does not identify which birth-to-six-month records should receive this warning.',
    suggestedMm: 'ဖန်ခွက်ဖြင့် ဖိသော်လည်း မပျောက်သော အနီစက်များ သို့မဟုတ် အနီကွက်များ တွေ့ရှိပါက (ဖန်ခွက်ကြည်ဖြင့် အရေပြားပေါ်ရှိ အနီစက်ကို ဖိကြည့်သည့်အခါ အနီရောင် ပျောက်မသွားဘဲ ဆက်လက်ပေါ်နေပါက) ဆေးရုံသို့ ချက်ချင်း သွားရောက်ပြသပါ။ ဤလက္ခဏာသည် အသက်အရွယ်မရွေး အရေးပေါ် အခြေအနေ ဖြစ်ပါသည်။',
    searchQuery: 'rash အနီစက်',
    suggestedDimensions: ['native_myanmar', 'evidence', 'safety', 'clinical'],
    source: SOURCE,
  },
  {
    reportItem: 88,
    claimId: 't2.sleep.birth2m_urgency',
    group: 'clinical_safety_gap',
    titleMm: 'မွေးကင်းစ–၂ လ အိပ်စက်စဉ် အသက်ရှူ အရေးပေါ်လက္ခဏာ',
    titleEn: 'Urgent sleep-breathing signs at birth–2 months',
    problemMm: 'Existing red flag နှင့် referral စာသားများကို severity ပြောင်းမည့်အကြံပြုချက်ဖြစ်သဖြင့် target fields အတည်ပြုရန်လိုသည်။',
    problemEn: 'The proposal changes the severity of existing red-flag and referral wording, so target fields must be confirmed.',
    suggestedMm: 'အောက်ပါ လက္ခဏာများ တွေ့ရှိပါက အနီးဆုံး ဆေးရုံသို့ ချက်ချင်း သွားရောက်ပြသပါ (စောင့်ဆိုင်းရန် လုံးဝ မသင့်ပါ) —\n• အိပ်နေစဉ် အသက်ရှူ ရပ်တန့်သွားခြင်း၊ အသက်ရှူရ အလွန်ခက်ခဲခြင်း သို့မဟုတ် အသက်ရှူတိုင်း ညည်းသံထွက်ပေါ်နေခြင်း\n• နှုတ်ခမ်း၊ လျှာ သို့မဟုတ် အသားအရေ ပြာနှမ်းမွဲခြောက်လာခြင်း\n• နိုးရ အလွန်ခက်ခဲခြင်း သို့မဟုတ် လုံးဝ သတိမေ့မြောနေခြင်း\n• ခန္ဓာကိုယ် အလွန် ပျော့ခွေကျသွားခြင်း\n• အသက် ၃ လအောက် ကလေးငယ် ဖျားနာခြင်း (ကိုယ်အပူချိန် ၃၈ ဒီဂရီ စင်တီဂရိတ်နှင့်အထက် ရှိခြင်း)။\nဤအခြေအနေများသည် အရေးပေါ် အခြေအနေ ဖြစ်ပါသည်။ ဤအက်ပ်သည် အရေးပေါ် ကုသမှု ဝန်ဆောင်မှု မဟုတ်ပါ။',
    searchQuery: 'birth_2m sleep',
    suggestedDimensions: ['native_myanmar', 'evidence', 'safety', 'clinical'],
    source: SOURCE,
  },
  {
    reportItem: 89,
    claimId: 't2.sleep.pacifier',
    group: 'clinical_safety_gap',
    titleMm: 'အိပ်ချိန် နို့သီးခေါင်း အသုံးပြုမှု',
    titleEn: 'Pacifier use for sleep',
    problemMm: 'လက်ရှိ content တွင်မရှိသေးသော clinical recommendation အသစ်ဖြစ်ပြီး target sleep guide နှင့် evidence approval မသတ်မှတ်ရသေးပါ။',
    problemEn: 'This is new clinical guidance absent from current content; target sleep guides and evidence approval are not established.',
    suggestedMm: 'နေ့ခင်းတစ်ရေးအိပ်ချိန်နှင့် ညအိပ်ချိန်များတွင် ကလေးငယ်အား နို့သီးခေါင်း (Pacifier) ပေး၍ သိပ်နိုင်ပါသည် — ယင်းသည် ကလေးငယ် ရုတ်တရက် သေဆုံးမှု (SIDS) အန္တရာယ်ကို လျော့ကျစေကြောင်း တွေ့ရှိရပါသည်။ မိခင်နို့တိုက်ကျွေးနေပါက နို့တိုက်ခြင်း အဆင်ပြေ အသားကျပြီးမှသာ (အများအားဖြင့် အသက် ၃ ပတ်မှ ၄ ပတ်ခန့်အကြာတွင်) စတင်ပေးပါ။ ကလေးငယ် အိပ်ပျော်သွားပြီးနောက် နို့သီးခေါင်း ပါးစပ်မှ ကျွတ်ကျသွားပါက ပြန်လည် ထည့်ပေးရန် မလိုပါ။',
    searchQuery: 'sleep safe',
    suggestedDimensions: ['native_myanmar', 'evidence', 'safety', 'clinical'],
    source: SOURCE,
  },
  {
    reportItem: 90,
    claimId: 't2.sleep.weighted_and_monitors',
    group: 'clinical_safety_gap',
    titleMm: 'အလေးချိန်ပါ အိပ်ဝတ်စုံနှင့် အိမ်သုံး မော်နီတာများ',
    titleEn: 'Weighted sleep products and home monitors',
    problemMm: 'လက်ရှိ content တွင်မရှိသေးသော prohibition အသစ်ဖြစ်ပြီး ဘယ် sleep guides တွင် ထည့်ရမည် မသတ်မှတ်ရသေးပါ။',
    problemEn: 'This is a new prohibition absent from current content; target sleep guides are not identified.',
    suggestedMm: 'အလေးချိန်ပါသော စောင်များ၊ အလေးချိန်ပါသော အိပ်ဝတ်စုံများနှင့် ကလေးပတ်တီးစများ (Weighted blankets, weighted sleepers or swaddles) ကို လုံးဝ မသုံးပါနှင့်။\nအိမ်သုံး အသက်ရှူ/နှလုံးခုန် စောင့်ကြည့်စက်များသည် ကလေးငယ် ရုတ်တရက် သေဆုံးမှု (SIDS) အန္တရာယ်ကို လျော့ကျစေနိုင်ကြောင်း ခိုင်လုံသော သက်သေ မရှိသဖြင့် ဘေးကင်းသော အိပ်စက်ရာနေရာ ဖန်တီးပေးခြင်း၏ အစားထိုးအဖြစ် အသုံးမပြုသင့်ပါ။',
    searchQuery: 'sleep safety',
    suggestedDimensions: ['native_myanmar', 'evidence', 'safety', 'clinical'],
    source: SOURCE,
  },
];
