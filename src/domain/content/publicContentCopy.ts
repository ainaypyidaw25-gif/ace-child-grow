const PUBLIC_AI_DISCLOSURE_PREFIXES = [
  'AI စစ်ဆေးမှု အသိပေးချက် — ဤအကြောင်းအရာကို AI ဖြင့် စစ်ဆေးထားသော်လည်း ဆေးဘက်ပညာရှင် သို့မဟုတ် မြန်မာဘာသာကို မိခင်ဘာသာစကားအဖြစ် အသုံးပြုသော စာတည်းဖြတ်သူက အတည်ပြုထားခြင်း မရှိပါ။ အထွေထွေပညာပေးအတွက်သာ ဖြစ်ပြီး ဆေးဘက်ဆိုင်ရာ အကြံပြုချက်၊ ကလေးဖွံ့ဖြိုးမှု စစ်ဆေးချက် သို့မဟုတ် ရောဂါဖော်ထုတ်ချက် မဟုတ်ပါ။',
  'AI review notice — This content was reviewed by AI but has not been approved by a clinician or native Myanmar-language editor. It is for general education only and is not medical advice, developmental screening, or diagnosis.',
  'AI အထောက်အထား စစ်ဆေးမှု — အထွေထွေပညာပေးအတွက်သာ ဖြစ်ပြီး ဆေးဘက်ဆိုင်ရာ အကြံပြုချက်၊ ကလေးဖွံ့ဖြိုးမှု စစ်ဆေးချက် သို့မဟုတ် ရောဂါဖော်ထုတ်ချက် မဟုတ်ပါ။',
  'AI evidence audit — For general education only; not medical advice, developmental screening, or diagnosis.',
] as const;

/**
 * Remove duplicate body prefixes; provenance stays in the governed snapshot.
 * AI-audited public items render a separate per-item disclosure in addition
 * to Content Policy. Callers must not treat this cleanup as that disclosure.
 */
export function publicContentCopy(value: string): string {
  const prefix = PUBLIC_AI_DISCLOSURE_PREFIXES.find((candidate) => value.startsWith(candidate));
  if (!prefix) return value;
  return value.slice(prefix.length).replace(/^\r?\n\r?\n/, '');
}
