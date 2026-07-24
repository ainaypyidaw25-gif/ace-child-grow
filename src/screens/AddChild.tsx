import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../app/LocaleContext';
import { useAppState } from '../app/AppState';
import { MIN_GESTATIONAL_WEEKS, MAX_GESTATIONAL_WEEKS } from '../domain/age/age';

export function AddChild() {
  const { t, locale } = useLocale();
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();

  const [nickname, setNickname] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [premature, setPremature] = useState(false);
  const [weeks, setWeeks] = useState('37');
  const [error, setError] = useState('');

  // Consent must be recorded before adding a child.
  if (!state.consentAcceptedAt) {
    navigate('/consent', { replace: true });
    return null;
  }

  function save() {
    setError('');
    if (!nickname.trim() || !birthDate) {
      setError(locale === 'mm' ? 'အချက်အလက် ဖြည့်ပါ' : 'Please fill in the details');
      return;
    }
    if (new Date(birthDate) > new Date()) {
      setError(locale === 'mm' ? 'မွေးနေ့ အနာဂတ်ဖြစ်နေသည်' : 'Birth date is in the future');
      return;
    }
    const g = premature ? Number(weeks) : undefined;
    if (premature && (g! < MIN_GESTATIONAL_WEEKS || g! > MAX_GESTATIONAL_WEEKS)) {
      setError(`${MIN_GESTATIONAL_WEEKS}–${MAX_GESTATIONAL_WEEKS} weeks`);
      return;
    }
    dispatch({
      type: 'add_child',
      child: {
        id: crypto.randomUUID(),
        nickname: nickname.trim(),
        birthDate,
        gestationalWeeks: g,
        useCorrectedAge: premature,
      },
    });
    navigate('/home');
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-sky-deep">
        {locale === 'mm' ? 'ကလေး ထည့်ရန်' : 'Add child'}
      </h1>
      <p className="text-xs text-ink-soft">
        {locale === 'mm'
          ? 'ကိုယ်ရေးအချက်အလက် အနည်းဆုံးသာ တောင်းသည် — အမည်ပြည့် မလိုပါ။'
          : 'Data minimization — nickname only, no full legal name.'}
      </p>

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

      <button type="button" onClick={save}
        className="min-h-touch w-full rounded-pill bg-sky px-6 py-3 font-semibold text-white">
        {t('common.save')}
      </button>
    </div>
  );
}
