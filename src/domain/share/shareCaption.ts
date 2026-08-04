// Copy for the milestone social-share card. Pure so it can be unit tested
// without a canvas/DOM environment — the actual image rendering lives in
// src/lib/shareCard.ts, which is browser-only and not unit tested.

export function buildMilestoneShareCaption(
  childNickname: string,
  milestoneTitle: string,
  locale: 'mm' | 'en',
): string {
  return locale === 'mm'
    ? `🎉 ${childNickname} က "${milestoneTitle}" ကို လုပ်နိုင်ပြီ! — ACE Child Grow အက်ပ်နှင့် မှတ်တမ်းတင်ထားသည်`
    : `🎉 ${childNickname} can now ${milestoneTitle}! — tracked with ACE Child Grow`;
}

export function formatShareCardDate(timestamp: number, locale: 'mm' | 'en'): string {
  return new Date(timestamp).toLocaleDateString(locale === 'mm' ? 'my-MM' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
