import { useLocale } from '../app/LocaleContext';

export type ContentReference = {
  sourceId: string;
  org: string;
  title: string;
  url: string;
};

function isPublicSourceUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function ContentReferences({ sources }: { sources: readonly ContentReference[] }) {
  const { locale } = useLocale();
  const visibleSources = sources.filter((source, index) => (
    source.org.trim().length > 0
    && source.title.trim().length > 0
    && isPublicSourceUrl(source.url)
    && sources.findIndex((candidate) => candidate.sourceId === source.sourceId) === index
  ));

  if (visibleSources.length === 0) return null;

  return (
    <section
      aria-labelledby="content-references-heading"
      className="border-t border-line pt-4"
      data-testid="content-references"
    >
      <h2 id="content-references-heading" className="text-sm font-semibold text-ink">
        {locale === 'mm' ? 'ကိုးကားရင်းမြစ်' : 'References'}
      </h2>
      <ul className="mt-2 divide-y divide-line/70">
        {visibleSources.map((source) => (
          <li key={source.sourceId} className="py-3 first:pt-0 last:pb-0">
            <p className="text-sm leading-6 text-ink-soft">
              <span className="font-medium text-ink">{source.org}</span>
              <span aria-hidden> — </span>
              {source.title}
            </p>
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex min-h-touch items-center text-sm font-semibold text-sky-deep underline decoration-sky/40 underline-offset-2"
            >
              {locale === 'mm' ? 'မူရင်းရင်းမြစ်ကြည့်ရန် →' : 'View original source →'}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
