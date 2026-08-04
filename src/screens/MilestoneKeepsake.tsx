import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'convex/react';
import type { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';
import { renderMilestoneShareCard } from '../lib/shareCard';
import { buildMilestoneShareCaption } from '../domain/share/shareCaption';

export function MilestoneKeepsake() {
  const { t, locale } = useLocale();
  const { responseId } = useParams<{ responseId: string }>();
  const data = useQuery(
    api.milestones.getMilestoneKeepsake,
    responseId ? { responseId: responseId as Id<'milestoneResponses'> } : 'skip',
  );
  const [sharing, setSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  if (data === undefined) return <p className="text-ink-soft" role="status">…</p>;
  if (data === null) return <p className="text-ink-soft">{t('milestoneKeepsake.notFound')}</p>;

  const title = locale === 'mm' ? (data.titleMm ?? data.titleEn) : (data.titleEn ?? data.titleMm);

  async function handleShare() {
    if (!data || !data.photoUrl || !title) return;
    setShareMessage('');
    setSharing(true);
    try {
      const blob = await renderMilestoneShareCard({
        photoUrl: data.photoUrl,
        childNickname: data.childNickname,
        title,
        achievedAt: data.answeredAt,
        locale,
      });
      const file = new File([blob], 'ace-child-grow-milestone.png', { type: 'image/png' });
      const caption = buildMilestoneShareCaption(data.childNickname, title, locale);
      const canShareFile = typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
      if (canShareFile && navigator.share) {
        await navigator.share({ files: [file], text: caption });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'ace-child-grow-milestone.png';
        link.click();
        URL.revokeObjectURL(url);
        setShareMessage(t('milestoneKeepsake.downloaded'));
      }
    } catch (error) {
      // AbortError means the parent simply closed the native share sheet — not a failure.
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error(error);
      setShareMessage(t('milestoneKeepsake.shareError'));
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <article className="space-y-3 rounded-card border border-line bg-white p-5 shadow-card print:shadow-none">
        <header className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-mint-deep">{t('milestoneKeepsake.heading')}</p>
          <h1 className="mt-1 text-xl font-bold text-ink">{data.childNickname}</h1>
        </header>

        {data.photoUrl ? (
          <img
            src={data.photoUrl}
            alt={title ?? ''}
            className="aspect-[4/3] w-full rounded-2xl bg-canvas object-cover"
          />
        ) : (
          <p className="rounded-lg bg-canvas p-4 text-center text-sm text-ink-soft">
            {t('milestoneKeepsake.noPhoto')}
          </p>
        )}

        <h2 className="text-center text-lg font-semibold text-ink">{title}</h2>
        <p className="text-center text-sm text-ink-soft">
          {t('milestoneKeepsake.achievedOn')}: {new Date(data.answeredAt).toISOString().slice(0, 10)}
        </p>
      </article>

      {data.photoUrl && (
        <div className="flex flex-wrap gap-2 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-touch rounded-pill bg-sky-deep px-6 py-2 font-semibold text-white"
          >
            {t('report.print')}
          </button>
          <button
            type="button"
            onClick={() => void handleShare()}
            disabled={sharing}
            className="min-h-touch rounded-pill border-2 border-sky-deep px-6 py-2 font-semibold text-sky-deep disabled:opacity-50"
          >
            {sharing ? t('milestoneKeepsake.sharing') : t('milestoneKeepsake.share')}
          </button>
        </div>
      )}
      {shareMessage && <p className="text-sm text-ink-soft print:hidden">{shareMessage}</p>}
    </div>
  );
}
