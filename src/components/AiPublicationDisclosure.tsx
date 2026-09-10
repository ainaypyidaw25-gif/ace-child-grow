import { AI_BADGE, AI_DISCLOSURE, AI_PUBLICATION_LANE } from '../domain/content/aiPublication';

/** The server-verified lane (also preserved in offline records) determines provenance. */
export function AiPublicationDisclosure({ publicationLane, locale, compact = false }: {
  publicationLane?: string;
  locale: 'mm' | 'en';
  compact?: boolean;
}) {
  if (publicationLane !== AI_PUBLICATION_LANE) return null;
  if (compact) {
    return (
      <span className="mt-2 block text-xs font-semibold leading-6 text-sky-deep" data-testid="ai-publication-badge">
        {AI_BADGE[locale]}
      </span>
    );
  }
  return (
    <aside className="rounded-card border border-line bg-mint-soft/40 p-4 text-sm leading-7 text-ink"
      aria-label={AI_BADGE[locale]} data-testid="ai-publication-disclosure">
      <p className="font-semibold">{AI_BADGE[locale]}</p>
      <p className="mt-1">{AI_DISCLOSURE[locale]}</p>
    </aside>
  );
}
