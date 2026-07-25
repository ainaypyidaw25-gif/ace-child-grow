// Parent Toolkit — printable resources. This seeds the catalogue entries and
// their metadata + media architecture (PDF placeholder). Actual print artwork is
// produced/attached via the CMS media system. clinical_review until approved.
import { printable, type SeedItem } from '../types';

const b = (mm: string, en: string) => ({ mm, en });

export const PRINTABLES: SeedItem[] = [
  printable({ key: 'flash_cards', format: 'A4 PDF',
    title: b('ဖလက်ရှ် ကတ်များ', 'Flash Cards'),
    description: b('ဝေါဟာရ တိုးပွားစေရန် ရုပ်ပုံ/စကားလုံး ကတ်များ။', 'Picture/word cards to grow vocabulary.') }),
  printable({ key: 'emotion_cards', format: 'A4 PDF',
    title: b('ခံစားမှု ကတ်များ', 'Emotion Cards'),
    description: b('ခံစားမှုများကို အမည်တပ်၍ ဆွေးနွေးရန် မျက်နှာ ကတ်များ။', 'Feeling-face cards to name and discuss emotions.') }),
  printable({ key: 'communication_cards', format: 'A4 PDF',
    title: b('ဆက်သွယ်ရေး ကတ်များ', 'Communication Cards'),
    description: b('စကားမပြောနိုင်သေးသော ကလေးများအတွက် ညွှန်ပြ ဆက်သွယ်ကတ်များ။', 'Point-to-communicate cards for pre-verbal children.') }),
  printable({ key: 'routine_chart', format: 'A4 PDF',
    title: b('နေ့စဉ် လုပ်ရိုးလုပ်စဉ် ဇယား', 'Routine Chart'),
    description: b('နေ့စဉ် အစီအစဉ်ကို ပုံရိပ်ဖြင့် ပြသော ဇယား။', 'A picture chart of the daily routine.') }),
  printable({ key: 'reward_chart', format: 'A4 PDF',
    title: b('ဆုချီးမြှင့် ဇယား', 'Reward Chart'),
    description: b('ကောင်းသောအပြုအမူကို အားပေးရန် ကြယ်/တံဆိပ် ဇယား။', 'A star/sticker chart to encourage good habits.') }),
  printable({ key: 'behavior_chart', format: 'A4 PDF',
    title: b('အပြုအမူ ဇယား', 'Behavior Chart'),
    description: b('အပြုအမူ ပန်းတိုင်များကို ခြေရာခံရန် ဇယား။', 'A chart to track behavior goals kindly.') }),
  printable({ key: 'visual_schedule', format: 'A4 PDF',
    title: b('ပုံရိပ် အစီအစဉ်ဇယား', 'Visual Schedule'),
    description: b('ကူးပြောင်းမှုများ လွယ်ကူစေရန် ပုံရိပ် အစီအစဉ်ဇယား။', 'A picture schedule to ease transitions.') }),
  printable({ key: 'doctor_visit_checklist', format: 'A4 PDF',
    title: b('ဆရာဝန်ပြသ စစ်ဆေးစာရင်း', 'Doctor Visit Checklist'),
    description: b('ဆရာဝန်မပြမီ မေးခွန်း/မှတ်စုများ ပြင်ဆင်ရန် စာရင်း။', 'Prep questions and notes before a doctor visit.') }),
  printable({ key: 'growth_log', format: 'A4 PDF',
    title: b('ကြီးထွားမှု မှတ်တမ်း', 'Growth Log'),
    description: b('ကိုယ်အလေးချိန်/အရပ်ကို လက်ဖြင့် မှတ်သားရန် ဇယား။', 'A sheet to record weight/height by hand.') }),
  printable({ key: 'sleep_diary', format: 'A4 PDF',
    title: b('အိပ်စက်မှု မှတ်တမ်း', 'Sleep Diary'),
    description: b('အိပ်ချိန်/နိုးချိန်ကို မှတ်သားရန် ဇယား။', 'A sheet to note sleep and wake times.') }),
  printable({ key: 'milestone_checklist', format: 'A4 PDF',
    title: b('ဖွံ့ဖြိုးမှု အမှတ်တိုင် စစ်ဆေးစာရင်း', 'Milestone Checklist'),
    description: b('အသက်အလိုက် အမှတ်တိုင်များ (လမ်းညွှန်သာ) စစ်ဆေးစာရင်း — ရောဂါ မဖော်ထုတ်ပါ။', 'Age-based milestone guide checklist — not a diagnostic test.') }),
];
