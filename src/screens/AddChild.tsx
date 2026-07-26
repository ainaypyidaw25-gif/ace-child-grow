import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../app/LocaleContext';
import { useAppState } from '../app/AppState';
import { isDuplicateChild } from '../app/bootstrap';
import { MIN_GESTATIONAL_WEEKS, MAX_GESTATIONAL_WEEKS } from '../domain/age/age';

export function AddChild() {
  const { t, locale } = useLocale();
  const { state, ready, addChildAsync } = useAppState();
  const navigate = useNavigate();

  const [nickname, setNickname] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [premature, setPremature] = useState(false);
  const [weeks, setWeeks] = useState('37');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDup, setConfirmDup] = useState(false);

  // Consent must be recorded before adding a child. Redirect as an effect (never
  // during render) and only once state has loaded, so a mid-load undefined
  // consent value can't bounce the user around.
  useEffect(() => {
    if (ready && !state.consentAcceptedAt) navigate('/consent', { replace: true });
  }, [ready, state.consentAcceptedAt, navigate]);

  async function save() {
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
    // Warn once on an accidental duplicate (same nickname + birth date). A second
    // press confirms — legitimate siblings differ in name or date and never trip this.
    if (!confirmDup && isDuplicateChild(state.children, nickname, birthDate)) {
      setConfirmDup(true);
      setError(
        locale === 'mm'
          ? 'ဤအမည်နှင့် မွေးနေ့တူ ကလေး ရှိပြီးသားဖြစ်သည်။ ထပ်ထည့်ရန် သေချာပါက “သိမ်းမည်” ကို ထပ်နှိပ်ပါ။'
          : 'A child with this name and birth date already exists. Press Save again to add anyway.',
      );
      return;
    }
    if (busy) return; // guard against double-submit
    setBusy(true);
    try {
      await addChildAsync({
        nickname: nickname.trim(),
        birthDate,
        gestationalWeeks: g,
        useCorrectedAge: premature,
      });
      navigate('/home', { replace: true });
    } catch {
      setBusy(false);
      setError(locale === 'mm' ? 'သိမ်းဆည်းမှု မအောင်မြင်ပါ။ ထပ်ကြိုးစားပါ။' : 'Could not save. Please try again.');
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-sky-deep">
        {locale === 'mm' ? 'ကလေး၏ အချက်အလက် ထည့်ပါ' : 'Add child'}
      </h1>
      <p className="text-xs text-ink-soft">
        {locale === 'mm'
          ? 'ကလေးကို ခွဲခြားသိနိုင်ရန် ချစ်စနိုးအမည်နှင့် မွေးသက္ကရာဇ်ကိုသာ ထည့်ပါ။ အမည်အပြည့်အစုံ မလိုအပ်ပါ။'
          : 'Data minimization — nickname only, no full legal name.'}
      </p>

      <label className="block text-sm">
        {locale === 'mm' ? 'ချစ်စနိုးအမည်' : 'Nickname'}
        <input value={nickname} onChange={(e) => setNickname(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-line px-3 py-2" />
      </label>

      <label className="block text-sm">
        {locale === 'mm' ? 'မွေးသက္ကရာဇ်' : 'Birth date'}
        <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-line px-3 py-2" />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={premature} onChange={(e) => setPremature(e.target.checked)}
          className="h-5 w-5" />
        {locale === 'mm'
          ? 'လမစေ့ဘဲ မွေးဖွားခဲ့ပါသည် (အသက်တွက်ချက်ရာတွင် ပြင်ဆင်ထားသည့်အသက်ကို အသုံးပြုမည်)'
          : 'Premature (use corrected age)'}
      </label>

      {premature && (
        <label className="block text-sm">
          {locale === 'mm' ? 'ကိုယ်ဝန်သက်တမ်း (ပတ်)' : 'Gestational weeks'}
          <input inputMode="numeric" value={weeks} onChange={(e) => setWeeks(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-line px-3 py-2" />
        </label>
      )}

      {error && <p className={`text-sm ${confirmDup ? 'text-state-orange' : 'text-state-red'}`}>⚠️ {error}</p>}

      <button type="button" onClick={save} disabled={busy}
        className="min-h-touch w-full rounded-pill bg-sky px-6 py-3 font-semibold text-white disabled:opacity-50">
        {busy ? '…' : confirmDup ? (locale === 'mm' ? 'သေချာသည် — သိမ်းမည်' : 'Yes, add anyway') : t('common.save')}
      </button>
    </div>
  );
}
