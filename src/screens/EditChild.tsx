import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../app/LocaleContext';
import { useAppState } from '../app/AppState';
import { MIN_GESTATIONAL_WEEKS, MAX_GESTATIONAL_WEEKS } from '../domain/age/age';

export function EditChild() {
  const { t, locale } = useLocale();
  const { activeChild, dispatch } = useAppState();
  const navigate = useNavigate();

  const [nickname, setNickname] = useState(activeChild?.nickname ?? '');
  const [birthDate, setBirthDate] = useState(activeChild?.birthDate ?? '');
  const [premature, setPremature] = useState(activeChild?.useCorrectedAge ?? false);
  const [weeks, setWeeks] = useState(String(activeChild?.gestationalWeeks ?? 37));
  const [error, setError] = useState('');

  if (!activeChild) {
    navigate('/profile', { replace: true });
    return null;
  }

  function save() {
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
    dispatch({
      type: 'edit_child',
      child: {
        ...activeChild!,
        nickname: nickname.trim(),
        birthDate,
        gestationalWeeks: g,
        useCorrectedAge: premature,
      },
    });
    navigate('/profile');
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
        {locale === 'mm' ? 'အချိန်မတိုင်မီ မွေးဖွားခြင်း (corrected age သုံးရန်)' : 'Premature (use corrected age)'}
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
        <button type="button" onClick={save}
          className="min-h-touch flex-1 rounded-pill bg-sky px-6 py-2 font-semibold text-white">
          {t('common.save')}
        </button>
      </div>
    </div>
  );
}
