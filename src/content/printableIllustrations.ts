export const PRINTABLE_ILLUSTRATIONS: Readonly<Record<string, string>> = {
  prt_behavior_chart:
    '/printables/prt_behavior_chart.dee67d9e38.webp',
  prt_checklist_10_12m:
    '/printables/prt_checklist_10_12m.ec38be069f.webp',
  prt_checklist_3_4m:
    '/printables/prt_checklist_3_4m.4ac13c3e90.webp',
  prt_checklist_5_6m:
    '/printables/prt_checklist_5_6m.8c2c14163d.webp',
  prt_checklist_7_9m:
    '/printables/prt_checklist_7_9m.fa976b926a.webp',
  prt_communication_cards:
    '/printables/prt_communication_cards.a372163a52.webp',
  prt_doctor_visit_checklist:
    '/printables/prt_doctor_visit_checklist.d299fb4e89.webp',
  prt_emotion_cards:
    '/printables/prt_emotion_cards.663f8ae9f1.webp',
  prt_flash_cards:
    '/printables/prt_flash_cards.8cd336dabb.webp',
  prt_growth_log:
    '/printables/prt_growth_log.dc54540a42.webp',
  prt_milestone_checklist:
    '/printables/prt_milestone_checklist.5b4ed7c4c3.webp',
  prt_reward_chart:
    '/printables/prt_reward_chart.15666233a2.webp',
  prt_routine_chart:
    '/printables/prt_routine_chart.04d6c6a9f9.webp',
  prt_sleep_diary:
    '/printables/prt_sleep_diary.f02d540c52.webp',
  prt_visual_schedule:
    '/printables/prt_visual_schedule.31eb2cef7a.webp',
};

export function printableIllustration(slug: string): string | undefined {
  return PRINTABLE_ILLUSTRATIONS[slug];
}
