import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '../app/LocaleContext';
import { useAppState } from '../app/AppState';
import { isDuplicateChild } from '../app/bootstrap';
import { MIN_GESTATIONAL_WEEKS, MAX_GESTATIONAL_WEEKS } from '../domain/age/age';

/**
 * Today in the device's OWN timezone as yyyy-mm-dd. toISOString() would give the
 * UTC date, which is up to 6h30m behind Myanmar — before 06:30 local that is
 * still "yesterday", and a baby born this morning could not be entered.
 */
function todayIso(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

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
      setError(locale === 'mm' ? 'လိုအပ်သော အချက်အလက်များကို ဖြည့်ပါ။' : 'Please fill in the details');
      return;
    }
    if (new Date(birthDate) > new Date()) {
      setError(locale === 'mm' ? 'မွေးသက္ကရာဇ်ကို ယနေ့ရက်ထက် နောက်ကျ၍ မသတ်မှတ်နိုင်ပါ။' : 'Birth date is in the future');
      return;
    }
    const g = premature ? Number(weeks) : undefined;
    if (premature && (g! < MIN_GESTATIONAL_WEEKS || g! > MAX_GESTATIONAL_WEEKS)) {
      setError(locale === 'mm'
        ? `ကိုယ်ဝန်သက်တမ်းသည် ${MIN_GESTATIONAL_WEEKS}–${MAX_GESTATIONAL_WEEKS} ပတ်အတွင်း ဖြစ်ရပါမည်။`
        : `${MIN_GESTATIONAL_WEEKS}–${MAX_GESTATIONAL_WEEKS} weeks`);
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
          ? 'ကလေးကို ခွဲခြားသိရှိနိုင်ရန် အိမ်တွင်ခေါ်သည့်အမည်နှင့် မွေးသက္ကရာဇ်ကိုသာ ထည့်ပါ။ အမည်အပြည့်အစုံ ထည့်ရန် မလိုအပ်ပါ။'
          : 'Data minimization — nickname only, no full legal name.'}
      </p>

      <label className="block text-sm">
        {locale === 'mm' ? 'ကလေးအမည် (အိမ်ခေါ်အမည်)' : 'Nickname'}
        <input value={nickname} onChange={(e) => setNickname(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-line px-3 py-2" />
      </label>

      <label className="block text-sm">
        {locale === 'mm' ? 'မွေးသက္ကရာဇ်' : 'Birth date'}
        {/* The native picker should not offer a date a child cannot have been
            born on. Save still re-checks — this only stops the impossible pick. */}
        <input type="date" value={birthDate} max={todayIso()} onChange={(e) => setBirthDate(e.target.value)}
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

      {/* role="alert" so a parent using a screen reader hears why Save did not
          go through — the message is otherwise silent. */}
      {error && <p role="alert" className={`text-sm ${confirmDup ? 'text-state-orange-deep' : 'text-state-red-deep'}`}>⚠️ {error}</p>}

      <button type="button" onClick={save} disabled={busy}
        className="min-h-touch w-full rounded-pill bg-sky px-6 py-3 font-semibold text-white disabled:opacity-50">
        {busy ? '…' : confirmDup ? (locale === 'mm' ? 'သေချာသည် — သိမ်းမည်' : 'Yes, add anyway') : t('common.save')}
      </button>
    </div>
  );
}
