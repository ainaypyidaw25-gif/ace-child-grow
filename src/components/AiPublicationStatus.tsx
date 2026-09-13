const AI_PUBLICATION_LANE = 'ai_audited';

const AI_ONLY_BADGE = {
  mm: 'AI စစ်ဆေးမှုသာ',
  en: 'AI review only',
} as const;

const AI_STATUS_NOTE = {
  mm: 'AI ဖြင့် စစ်ဆေးထားသော ပညာပေးအကြောင်းအရာ — ဆေးဘက်ပညာရှင် သို့မဟုတ် မိခင်ဘာသာစကား မြန်မာစာတည်းဖြတ်သူ၏ အတည်ပြုချက် မရှိသေးပါ။ ဆေးဘက်ဆိုင်ရာ အကြံပြုချက်၊ ဖွံ့ဖြိုးမှုစစ်ဆေးချက် သို့မဟုတ် ရောဂါဖော်ထုတ်ချက် မဟုတ်ပါ။',
  en: 'AI-reviewed educational content — not approved by a clinician or native Myanmar-language editor. Not medical advice, developmental screening, or diagnosis.',
} as const;

/** Keep the AI-only lane distinguishable without restoring the removed warning card. */
export function AiPublicationStatus({
  publicationLane,
  locale,
  compact = false,
}: {
  publicationLane?: string;
  locale: 'mm' | 'en';
  compact?: boolean;
}) {
  if (publicationLane !== AI_PUBLICATION_LANE) return null;

  if (compact) {
    return (
      <span
        className="mt-2 inline-flex rounded-pill bg-sky-soft px-2 py-0.5 text-[11px] font-semibold leading-5 text-sky-deep"
        data-testid="ai-publication-badge"
      >
        {AI_ONLY_BADGE[locale]}
      </span>
    );
  }

  return (
    <p
      className="border-t border-line pt-4 text-xs leading-6 text-ink-soft"
      data-testid="ai-publication-note"
    >
      {AI_STATUS_NOTE[locale]}
    </p>
  );
}
