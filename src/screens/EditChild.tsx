import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../app/LocaleContext';
import { useAppState } from '../app/AppState';
import { MIN_GESTATIONAL_WEEKS, MAX_GESTATIONAL_WEEKS } from '../domain/age/age';

export function EditChild() {
  const { t, locale } = useLocale();
  const { activeChild, ready, updateChildAsync } = useAppState();
  const navigate = useNavigate();

  const [nickname, setNickname] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [premature, setPremature] = useState(false);
  const [weeks, setWeeks] = useState('37');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Populate the form once the child has hydrated (and when switching child).
  useEffect(() => {
    if (activeChild) {
      setNickname(activeChild.nickname);
      setBirthDate(activeChild.birthDate);
      setPremature(activeChild.useCorrectedAge);
      setWeeks(String(activeChild.gestationalWeeks ?? 37));
    }
  }, [activeChild]);

  // Redirect only after state has loaded — never during the loading window, and
  // never during render (which would bounce a refresh on /edit-child).
  useEffect(() => {
    if (ready && !activeChild) navigate('/profile', { replace: true });
  }, [ready, activeChild, navigate]);

  if (!ready) {
    return <div className="flex min-h-[50vh] items-center justify-center text-ink-soft" role="status">…</div>;
  }
  if (!activeChild) return null;

  async function save() {
    if (!activeChild) return;
    setError('');
    if (!nickname.trim() || !birthDate) {
      setError(locale === 'mm' ? 'အချက်အလက် ဖြည့်ပါ' : 'Please fill in the details');
      return;
    }
    if (new Date(birthDate) > new Date()) {
      setError(locale === 'mm' ? 'မွေးနေ့ အနာဂတ်ဖြစ်နေတယ်' : 'Birth date is in the future');
      return;
    }
    const g = premature ? Number(weeks) : undefined;
    if (premature && (g! < MIN_GESTATIONAL_WEEKS || g! > MAX_GESTATIONAL_WEEKS)) {
      setError(`${MIN_GESTATIONAL_WEEKS}–${MAX_GESTATIONAL_WEEKS} weeks`);
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      await updateChildAsync({
        ...activeChild,
        nickname: nickname.trim(),
        birthDate,
        gestationalWeeks: g,
        useCorrectedAge: premature,
      });
      navigate('/profile', { replace: true });
    } catch {
      setBusy(false);
      setError(locale === 'mm' ? 'သိမ်းဆည်းမှု မအောင်မြင်ပါ။ ထပ်ကြိုးစားပါ။' : 'Could not save. Please try again.');
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-sky-deep">
        {locale === 'mm' ? 'ကလေးအချက်အလက် ပြင်ရန်' : 'Edit child'}
      </h1>

      <label className="block text-sm">
        {locale === 'mm' ? 'အမည် (ချစ်စနာမည်)' : 'Nickname'}
        <input value={nickname} onChange={(e) => setNickname(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-line px-3 py-2" />
      </label>

      <label className="block text-sm">
        {locale === 'mm' ? 'မွေးနေ့' : 'Birth date'}
        <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-line px-3 py-2" />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={premature} onChange={(e) => setPremature(e.target.checked)}
          className="h-5 w-5" />
        {locale === 'mm' ? 'အချိန်မတိုင်မီ မွေးဖွားခြင်း (ပြင်ဆင်အသက် သုံးရန်)' : 'Premature (use corrected age)'}
      </label>

      {premature && (
        <label className="block text-sm">
          {locale === 'mm' ? 'ကိုယ်ဝန်သက်တမ်း (ပတ်)' : 'Gestational weeks'}
          <input inputMode="numeric" value={weeks} onChange={(e) => setWeeks(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-line px-3 py-2" />
        </label>
      )}

      {error && <p className="text-sm text-state-red">⚠️ {error}</p>}

      <div className="flex gap-2">
        <button type="button" onClick={() => navigate('/profile')}
          className="min-h-touch rounded-pill border border-line px-5 py-2">
          {t('common.cancel')}
        </button>
        <button type="button" onClick={save} disabled={busy}
          className="min-h-touch flex-1 rounded-pill bg-sky px-6 py-2 font-semibold text-white disabled:opacity-50">
          {busy ? '…' : t('common.save')}
        </button>
      </div>
    </div>
  );
}
