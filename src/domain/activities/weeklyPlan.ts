// Weekly Plan — spreads the activity catalogue across a Mon–Sun week so a
// premium parent can see what's coming up, not just today. Deliberately kept
// separate from the safety-critical recommend.ts engine: this operates on the
// loose `domainKey` strings the content library actually stores, not the
// narrow DevelopmentDomain enum recommend.ts guarantees never to violate.

export interface WeeklyPlanItem {
  slug: string;
  domainKey?: string;
}

export interface WeekDayPlan<T extends WeeklyPlanItem> {
  dayIndex: number; // 0 = Monday .. 6 = Sunday
  activity: T | null;
}

/**
 * One activity per day, Monday through Sunday. Items not recently completed
 * are placed first so a short catalogue still cycles through variety across
 * the week instead of repeating day one's pick every day.
 */
export function buildWeeklyPlan<T extends WeeklyPlanItem>(
  catalogue: readonly T[],
  recentSlugs: readonly string[] = [],
): WeekDayPlan<T>[] {
  if (catalogue.length === 0) {
    return Array.from({ length: 7 }, (_, dayIndex) => ({ dayIndex, activity: null }));
  }
  const recent = new Set(recentSlugs);
  const ordered = [
    ...catalogue.filter((item) => !recent.has(item.slug)),
    ...catalogue.filter((item) => recent.has(item.slug)),
  ];
  return Array.from({ length: 7 }, (_, dayIndex) => ({
    dayIndex,
    activity: ordered[dayIndex % ordered.length],
  }));
}

/** The Monday that starts the week containing `date`, at local midnight. */
export function startOfWeek(date: Date): Date {
  const start = new Date(date);
  const day = start.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + mondayOffset);
  start.setHours(0, 0, 0, 0);
  return start;
}

/** Whether two timestamps fall on the same calendar day (local time). */
export function isSameDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear()
    && da.getMonth() === db.getMonth()
    && da.getDate() === db.getDate();
}
