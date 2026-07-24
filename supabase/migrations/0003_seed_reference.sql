-- ACE Child Grow — reference + safety seed (Phase 24, part 1).
-- SAFETY: reference taxonomy and fixed safety rules only. All health/development
-- CONTENT (milestones, activities, awareness) is seeded as review_status='clinical_review'
-- in 0004 and MUST NOT be shown as approved guidance until a qualified reviewer approves it.
-- Healthcare facilities are intentionally NOT seeded (never invent contacts).

insert into age_groups (key, title_mm, title_en, min_months, max_months, sort_order) values
  ('birth_2m','မွေးကင်းစ–၂လ','Birth–2 months',0,2,1),
  ('3_4m','၃–၄လ','3–4 months',3,4,2),
  ('5_6m','၅–၆လ','5–6 months',5,6,3),
  ('7_9m','၇–၉လ','7–9 months',7,9,4),
  ('10_12m','၁၀–၁၂လ','10–12 months',10,12,5),
  ('13_18m','၁၃–၁၈လ','13–18 months',13,18,6),
  ('19_24m','၁၉–၂၄လ','19–24 months',19,24,7),
  ('2_3y','၂–၃နှစ်','2–3 years',24,36,8),
  ('3_4y','၃–၄နှစ်','3–4 years',36,48,9),
  ('4_5y','၄–၅နှစ်','4–5 years',48,60,10)
on conflict (key) do nothing;

insert into development_domains (key, title_mm, title_en, sort_order) values
  ('gross_motor','ကြီးမားသော လှုပ်ရှားမှု','Gross Motor',1),
  ('fine_motor','သေးငယ်သော လက်လှုပ်ရှားမှု','Fine Motor',2),
  ('speech_language','စကားနှင့် ဘာသာစကား','Speech and Language',3),
  ('cognitive','အသိဉာဏ်နှင့် ပြဿနာဖြေရှင်းခြင်း','Cognitive and Problem Solving',4),
  ('social_emotional','လူမှုနှင့် စိတ်ခံစားမှု','Social and Emotional',5),
  ('play','ကစားခြင်း','Play',6),
  ('self_help','ကိုယ်တိုင်ပြုစုခြင်း','Self-help and Daily Living',7),
  ('growth_nutrition','ကြီးထွားမှုနှင့် အာဟာရ','Growth and Nutrition',8),
  ('sleep','အိပ်စက်ခြင်း','Sleep',9),
  ('safety_health','ဘေးကင်းရေးနှင့် ကျန်းမာရေး','Safety and Health',10)
on conflict (key) do nothing;

-- Fixed urgent safety rules (match src/domain/safety/safety.ts exactly).
insert into safety_rules (key, title_mm, title_en, guidance_mm, guidance_en, is_urgent, review_status) values
  ('severe_breathing_difficulty','ပြင်းထန်သော အသက်ရှူခက်ခဲမှု','Severe breathing difficulty',
    'အနီးဆုံး အရေးပေါ်ကျန်းမာရေးဝန်ဆောင်မှုသို့ ချက်ချင်းသွားပါ။','Go to the nearest emergency service immediately.',true,'approved'),
  ('blue_lips','နှုတ်ခမ်း ပြာလာခြင်း','Blue lips',
    'အနီးဆုံး အရေးပေါ်ကျန်းမာရေးဝန်ဆောင်မှုသို့ ချက်ချင်းသွားပါ။','Go to the nearest emergency service immediately.',true,'approved'),
  ('breathing_pauses','အသက်ရှူ ရပ်တန့်ခြင်း','Breathing pauses',
    'အနီးဆုံး အရေးပေါ်ကျန်းမာရေးဝန်ဆောင်မှုသို့ ချက်ချင်းသွားပါ။','Go to the nearest emergency service immediately.',true,'approved'),
  ('seizure','တက်ခြင်း','Seizure',
    'အနီးဆုံး အရေးပေါ်ကျန်းမာရေးဝန်ဆောင်မှုသို့ ချက်ချင်းသွားပါ။','Go to the nearest emergency service immediately.',true,'approved'),
  ('unresponsiveness','တုံ့ပြန်မှုမရှိခြင်း','Unresponsiveness',
    'အနီးဆုံး အရေးပေါ်ကျန်းမာရေးဝန်ဆောင်မှုသို့ ချက်ချင်းသွားပါ။','Go to the nearest emergency service immediately.',true,'approved'),
  ('sudden_weakness','ရုတ်တရက် အားနည်းခြင်း','Sudden weakness',
    'အနီးဆုံး အရေးပေါ်ကျန်းမာရေးဝန်ဆောင်မှုသို့ ချက်ချင်းသွားပါ။','Go to the nearest emergency service immediately.',true,'approved'),
  ('serious_injury','ပြင်းထန်သော ဒဏ်ရာ','Serious injury',
    'အနီးဆုံး အရေးပေါ်ကျန်းမာရေးဝန်ဆောင်မှုသို့ ချက်ချင်းသွားပါ။','Go to the nearest emergency service immediately.',true,'approved'),
  ('severe_dehydration','ပြင်းထန်သော ရေဓာတ်ခန်းခြောက်မှု','Severe dehydration signs',
    'အနီးဆုံး အရေးပေါ်ကျန်းမာရေးဝန်ဆောင်မှုသို့ ချက်ချင်းသွားပါ။','Go to the nearest emergency service immediately.',true,'approved'),
  ('loss_of_acquired_skills','ရရှိပြီး ကျွမ်းကျင်မှု ဆုံးရှုံးခြင်း','Loss of acquired skills',
    'ကျွမ်းကျင်ပညာရှင်တစ်ဦးနှင့် အမြန်ဆုံး တိုင်ပင်ပါ။','Consult a qualified professional promptly.',true,'approved')
on conflict (key) do nothing;

-- Referral guidance per result state (respectful, non-diagnostic).
insert into referral_guidance (state, guidance_mm, guidance_en, questions_for_professional_mm, questions_for_professional_en, review_status) values
  ('green','ကလေး၏ ကျွမ်းကျင်မှုများသည် လက်ရှိအရွယ်နှင့် ကိုက်ညီနေပါသည်။ ဆက်လက်စောင့်ကြည့်ပါ။',
    'Your child’s skills broadly align with this age. Keep observing.', null, null, 'approved'),
  ('yellow','ကျွမ်းကျင်မှုအချို့ ပေါ်ထွက်လာဆဲ ဖြစ်ပါသည်။ အိမ်တွင်း လှုပ်ရှားမှုများ ဆက်လုပ်ပါ။',
    'Some skills are still emerging. Continue home activities and review again soon.', null, null, 'approved'),
  ('orange','စိုးရိမ်စရာ အချက်များ ထပ်ခါထပ်ခါ တွေ့ရပါက ကျွမ်းကျင်ပညာရှင်နှင့် တိုင်ပင်ရန် အသုံးဝင်နိုင်ပါသည်။',
    'Repeated concerns suggest consulting a qualified professional may help.',
    'ကလေး၏ ဖွံ့ဖြိုးမှုအကြောင်း မည်သည့်မေးခွန်းများ မေးသင့်သနည်း။','What should I ask about my child’s development?','approved'),
  ('red','အရေးပေါ် လက္ခဏာများ သို့မဟုတ် ကျွမ်းကျင်မှုဆုံးရှုံးမှုအတွက် ချက်ချင်း အကူအညီရယူပါ။',
    'For urgent signs or skill loss, seek help immediately.', null, null, 'approved');

-- Publishable app setting: default rule thresholds (mirrors DEFAULT_THRESHOLDS).
insert into app_settings (key, value) values
  ('result_thresholds', '{"yellowConcernRatio":0.2,"orangeConcernRatio":0.4,"repeatedConcernsForOrange":2}')
on conflict (key) do nothing;
