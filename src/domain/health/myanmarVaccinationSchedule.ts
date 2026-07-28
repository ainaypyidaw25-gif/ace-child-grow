export type MyanmarVaccinationScheduleItem = {
  id: string;
  ageMonths: 0 | 2 | 4 | 6 | 9 | 18;
  vaccineName: string;
  doseLabel: string;
  nameMm: string;
  nameEn: string;
  doseMm: string;
  doseEn: string;
  noteMm?: string;
  noteEn?: string;
};

export type MyanmarVaccinationScheduleGroup = {
  ageMonths: MyanmarVaccinationScheduleItem['ageMonths'];
  labelMm: string;
  labelEn: string;
  items: readonly MyanmarVaccinationScheduleItem[];
};

export const MYANMAR_EPI_SOURCE = {
  titleMm: 'မြန်မာနိုင်ငံ တိုးချဲ့ကာကွယ်ဆေးထိုးလုပ်ငန်း (EPI) အချက်အလက်စာတမ်း ၂၀၂၄',
  titleEn: 'Myanmar Expanded Programme on Immunization (EPI) factsheet 2024',
  publisher: 'World Health Organization',
  scheduleYear: 2023,
  publishedOn: '2024-08-20',
  url: 'https://www.who.int/southeastasia/publications/i/item/myanmar-epi-factsheet-2024',
} as const;

export const MYANMAR_VACCINATION_SCHEDULE: readonly MyanmarVaccinationScheduleItem[] = [
  { id: 'bcg-birth', ageMonths: 0, vaccineName: 'BCG', doseLabel: 'Single dose', nameMm: 'ဘီစီဂျီ (BCG)', nameEn: 'BCG', doseMm: 'တစ်ကြိမ်', doseEn: 'Single dose', noteMm: 'မွေးစမှ အသက် ၂ လအတွင်း ထိုးရန်', noteEn: 'Give from birth through 2 months of age' },
  { id: 'hepb-birth', ageMonths: 0, vaccineName: 'Hepatitis B', doseLabel: 'Birth dose', nameMm: 'အသည်းရောင်အသားဝါ ဘီ (HepB)', nameEn: 'Hepatitis B (HepB)', doseMm: 'မွေးစအကြိမ်', doseEn: 'Birth dose' },
  { id: 'penta-1', ageMonths: 2, vaccineName: 'DTP-Hib-HepB', doseLabel: 'Dose 1', nameMm: 'ငါးမျိုးစပ်ကာကွယ်ဆေး (DTP-Hib-HepB)', nameEn: 'Pentavalent (DTP-Hib-HepB)', doseMm: 'ပထမအကြိမ်', doseEn: 'Dose 1' },
  { id: 'opv-1', ageMonths: 2, vaccineName: 'OPV', doseLabel: 'Dose 1', nameMm: 'ပိုလီယို အစက်ချဆေး (OPV)', nameEn: 'Oral polio vaccine (OPV)', doseMm: 'ပထမအကြိမ်', doseEn: 'Dose 1' },
  { id: 'pcv-1', ageMonths: 2, vaccineName: 'PCV', doseLabel: 'Dose 1', nameMm: 'နမိုးနီးယားကာကွယ်ဆေး (PCV)', nameEn: 'Pneumococcal vaccine (PCV)', doseMm: 'ပထမအကြိမ်', doseEn: 'Dose 1' },
  { id: 'rota-1', ageMonths: 2, vaccineName: 'Rotavirus', doseLabel: 'Dose 1', nameMm: 'ရိုတာဗိုင်းရပ်စ်ကာကွယ်ဆေး', nameEn: 'Rotavirus vaccine', doseMm: 'ပထမအကြိမ်', doseEn: 'Dose 1' },
  { id: 'penta-2', ageMonths: 4, vaccineName: 'DTP-Hib-HepB', doseLabel: 'Dose 2', nameMm: 'ငါးမျိုးစပ်ကာကွယ်ဆေး (DTP-Hib-HepB)', nameEn: 'Pentavalent (DTP-Hib-HepB)', doseMm: 'ဒုတိယအကြိမ်', doseEn: 'Dose 2' },
  { id: 'opv-2', ageMonths: 4, vaccineName: 'OPV', doseLabel: 'Dose 2', nameMm: 'ပိုလီယို အစက်ချဆေး (OPV)', nameEn: 'Oral polio vaccine (OPV)', doseMm: 'ဒုတိယအကြိမ်', doseEn: 'Dose 2' },
  { id: 'ipv-1', ageMonths: 4, vaccineName: 'IPV', doseLabel: 'Single dose', nameMm: 'ပိုလီယို ထိုးဆေး (IPV)', nameEn: 'Inactivated polio vaccine (IPV)', doseMm: 'တစ်ကြိမ်', doseEn: 'Single dose' },
  { id: 'pcv-2', ageMonths: 4, vaccineName: 'PCV', doseLabel: 'Dose 2', nameMm: 'နမိုးနီးယားကာကွယ်ဆေး (PCV)', nameEn: 'Pneumococcal vaccine (PCV)', doseMm: 'ဒုတိယအကြိမ်', doseEn: 'Dose 2' },
  { id: 'rota-2', ageMonths: 4, vaccineName: 'Rotavirus', doseLabel: 'Dose 2', nameMm: 'ရိုတာဗိုင်းရပ်စ်ကာကွယ်ဆေး', nameEn: 'Rotavirus vaccine', doseMm: 'ဒုတိယအကြိမ်', doseEn: 'Dose 2', noteMm: 'နောက်ကျနေပါက အသက်ကန့်သတ်ချက်ရှိသဖြင့် ကျန်းမာရေးဝန်ထမ်းနှင့် တိုင်ပင်ပါ', noteEn: 'If delayed, ask a health worker because age limits apply' },
  { id: 'penta-3', ageMonths: 6, vaccineName: 'DTP-Hib-HepB', doseLabel: 'Dose 3', nameMm: 'ငါးမျိုးစပ်ကာကွယ်ဆေး (DTP-Hib-HepB)', nameEn: 'Pentavalent (DTP-Hib-HepB)', doseMm: 'တတိယအကြိမ်', doseEn: 'Dose 3' },
  { id: 'opv-3', ageMonths: 6, vaccineName: 'OPV', doseLabel: 'Dose 3', nameMm: 'ပိုလီယို အစက်ချဆေး (OPV)', nameEn: 'Oral polio vaccine (OPV)', doseMm: 'တတိယအကြိမ်', doseEn: 'Dose 3' },
  { id: 'pcv-3', ageMonths: 6, vaccineName: 'PCV', doseLabel: 'Dose 3', nameMm: 'နမိုးနီးယားကာကွယ်ဆေး (PCV)', nameEn: 'Pneumococcal vaccine (PCV)', doseMm: 'တတိယအကြိမ်', doseEn: 'Dose 3' },
  { id: 'mr-1', ageMonths: 9, vaccineName: 'MR', doseLabel: 'Dose 1', nameMm: 'ဝက်သက်နှင့် ဂျိုက်သိုး (MR)', nameEn: 'Measles and rubella (MR)', doseMm: 'ပထမအကြိမ်', doseEn: 'Dose 1' },
  { id: 'je-1', ageMonths: 9, vaccineName: 'JE', doseLabel: 'Single dose', nameMm: 'ဂျပန်ဦးနှောက်ရောင်ကာကွယ်ဆေး (JE)', nameEn: 'Japanese encephalitis (JE)', doseMm: 'တစ်ကြိမ်', doseEn: 'Single dose' },
  { id: 'penta-4', ageMonths: 18, vaccineName: 'DTP-Hib-HepB', doseLabel: 'Dose 4', nameMm: 'ငါးမျိုးစပ်ကာကွယ်ဆေး (DTP-Hib-HepB)', nameEn: 'Pentavalent (DTP-Hib-HepB)', doseMm: 'စတုတ္ထအကြိမ်', doseEn: 'Dose 4' },
  { id: 'mr-2', ageMonths: 18, vaccineName: 'MR', doseLabel: 'Dose 2', nameMm: 'ဝက်သက်နှင့် ဂျိုက်သိုး (MR)', nameEn: 'Measles and rubella (MR)', doseMm: 'ဒုတိယအကြိမ်', doseEn: 'Dose 2' },
] as const;

const groupLabels: Record<MyanmarVaccinationScheduleItem['ageMonths'], { mm: string; en: string }> = {
  0: { mm: 'မွေးစ', en: 'At birth' },
  2: { mm: 'အသက် ၂ လ', en: '2 months' },
  4: { mm: 'အသက် ၄ လ', en: '4 months' },
  6: { mm: 'အသက် ၆ လ', en: '6 months' },
  9: { mm: 'အသက် ၉ လ', en: '9 months' },
  18: { mm: 'အသက် ၁၈ လ', en: '18 months' },
};

export const MYANMAR_VACCINATION_GROUPS: readonly MyanmarVaccinationScheduleGroup[] = ([0, 2, 4, 6, 9, 18] as const).map((ageMonths) => ({
  ageMonths,
  labelMm: groupLabels[ageMonths].mm,
  labelEn: groupLabels[ageMonths].en,
  items: MYANMAR_VACCINATION_SCHEDULE.filter((item) => item.ageMonths === ageMonths),
}));

export function vaccinationDueDate(birthDate: string, ageMonths: number): string {
  const [year, month, day] = birthDate.split('-').map(Number);
  const monthIndex = month - 1 + ageMonths;
  const targetYear = year + Math.floor(monthIndex / 12);
  const targetMonth = ((monthIndex % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  return new Date(Date.UTC(targetYear, targetMonth, Math.min(day, lastDay))).toISOString().slice(0, 10);
}

export function isMatchingVaccinationRecord(
  item: MyanmarVaccinationScheduleItem,
  record: { vaccineName: string; doseLabel?: string },
): boolean {
  const normalize = (value: string | undefined) => value?.trim().toLocaleLowerCase('en-US') ?? '';
  return normalize(record.vaccineName) === normalize(item.vaccineName)
    && normalize(record.doseLabel) === normalize(item.doseLabel);
}
