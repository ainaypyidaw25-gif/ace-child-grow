import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import type { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';
import { useAppState } from '../app/AppState';
import { NoChild } from './Growth';
import { ConfirmDialog } from '../components/ConfirmDialog';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export function MilestoneGallery() {
  const { t, locale } = useLocale();
  const { activeChild } = useAppState();
  const L = (mm: string, en: string) => locale === 'mm' ? mm : en;
  const achieved = useQuery(
    api.milestones.listAchievedMilestones,
    activeChild ? { childId: activeChild.id as never } : 'skip',
  );
  const generateUploadUrl = useMutation(api.milestones.generatePhotoUploadUrl);
  const attachPhoto = useMutation(api.milestones.attachMilestonePhoto);
  const removePhoto = useMutation(api.milestones.removeMilestonePhoto);
  const [message, setMessage] = useState('');
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ id: string; url: string } | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  if (!activeChild) return <NoChild />;
  if (achieved === undefined) return <p className="text-ink-soft" role="status">…</p>;

  const upload = async (responseId: Id<'milestoneResponses'>, file: File) => {
    if (!file.type.startsWith('image/') || file.size > MAX_PHOTO_BYTES) {
      setMessage(t('milestoneGallery.uploadError.type'));
      return;
    }
    setMessage('');
    setUploadingId(responseId);
    const objectUrl = URL.createObjectURL(file);
    setPreview({ id: responseId, url: objectUrl });
    try {
      const uploadUrl = await generateUploadUrl({});
      const response = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
      if (!response.ok) throw new Error('upload failed');
      const { storageId } = (await response.json()) as { storageId: Id<'_storage'> };
      await attachPhoto({ responseId, storageId });
    } catch (error) {
      console.error(error);
      setMessage(t('milestoneGallery.uploadError.generic'));
    } finally {
      setUploadingId(null);
      setPreview(null);
      URL.revokeObjectURL(objectUrl);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="text-xl font-bold text-sky-deep">{t('milestoneGallery.title')}</h1>
      </header>

      {message && <p className="text-sm text-state-red-deep" role="alert">{message}</p>}

      {achieved.length === 0 ? (
        <section className="rounded-[28px] border border-line bg-white p-6 text-center">
          <div className="text-4xl" aria-hidden>🏅</div>
          <p className="mt-2 text-ink-soft">{t('milestoneGallery.empty')}</p>
        </section>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {achieved.map((item) => {
            const title = locale === 'mm' ? (item.titleMm ?? item.titleEn) : (item.titleEn ?? item.titleMm);
            const photoUrl = uploadingId === item._id && preview ? preview.url : item.photoUrl;
            const busy = uploadingId === item._id;
            return (
              <li key={item._id} className="rounded-[26px] border border-line bg-white p-4 shadow-card">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={title ?? ''}
                    className="mb-3 aspect-[4/3] w-full rounded-2xl bg-canvas object-cover"
                  />
                ) : (
                  <div className="mb-3 flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-canvas text-3xl" aria-hidden>
                    🏅
                  </div>
                )}
                <h3 className="font-semibold text-ink">{title}</h3>
                <p className="mt-1 text-xs text-ink-soft">
                  {new Date(item.answeredAt).toISOString().slice(0, 10)}
                </p>

                <label className="mt-3 block text-sm">
                  <span className="sr-only">
                    {item.photoUrl ? t('milestoneGallery.replaceLabel') : t('milestoneGallery.uploadLabel')}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={busy}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = '';
                      if (file) void upload(item._id, file);
                    }}
                    className="block w-full text-sm font-normal text-ink-soft file:mr-3 file:rounded-pill file:border-0 file:bg-mint-soft file:px-4 file:py-2 file:font-semibold file:text-sky-deep disabled:opacity-50"
                  />
                </label>
                {busy && <p className="mt-1 text-xs text-ink-soft">{t('milestoneGallery.uploading')}</p>}

                <div className="mt-3 flex flex-wrap gap-2">
                  {item.photoUrl && (
                    <>
                      <Link
                        to={`/milestone-gallery/${item._id}/keepsake`}
                        role="button"
                        className="min-h-touch rounded-pill bg-sky-deep px-4 py-2 text-sm font-semibold text-white"
                      >
                        {t('milestoneGallery.printKeepsake')}
                      </Link>
                      <button
                        type="button"
                        onClick={() => setConfirmRemoveId(item._id)}
                        className="min-h-touch rounded-pill border border-state-red px-4 py-2 text-sm text-state-red-deep"
                      >
                        {t('milestoneGallery.removeLabel')}
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {confirmRemoveId && (
        <ConfirmDialog
          message={t('milestoneGallery.removeConfirm')}
          cancelLabel={L('မလုပ်တော့ပါ', 'Cancel')}
          confirmLabel={t('milestoneGallery.removeLabel')}
          onCancel={() => setConfirmRemoveId(null)}
          onConfirm={async () => {
            const responseId = confirmRemoveId as Id<'milestoneResponses'>;
            setConfirmRemoveId(null);
            try {
              await removePhoto({ responseId });
            } catch (error) {
              console.error(error);
              setMessage(t('milestoneGallery.removeError'));
            }
          }}
        />
      )}
    </div>
  );
}
