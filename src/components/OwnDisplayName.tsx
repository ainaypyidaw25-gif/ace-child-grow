import { useState, type FormEvent } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';

/**
 * Lets a staff member set their own reviewer display name.
 *
 * `contentReviews.saveDecision` refuses a decision from a reviewer with no
 * display name, and until now there was no way to acquire one: `changeRole`
 * refuses your own account, and the team screen is owner-only. A staff account
 * created by bootstrap rather than by invite was therefore permanently unable to
 * record a review.
 *
 * Rendered in two places on purpose — on the team screen, and inline in the
 * review workspace at the moment a decision is refused for this reason, which
 * is the only place a non-owner reviewer would ever see it.
 *
 * Name only: the professional qualification stays owner-assigned, because that
 * is the claim that makes a clinical or evidence approval a sign-off.
 */
export function OwnDisplayName({
  currentName,
  variant = 'card',
  onSaved,
}: {
  currentName: string | null;
  variant?: 'card' | 'inline';
  onSaved?: () => void;
}) {
  const { locale } = useLocale();
  const L = (mm: string, en: string) => (locale === 'mm' ? mm : en);
  const setOwnDisplayName = useMutation(api.admin.setOwnDisplayName);
  const [name, setName] = useState(currentName ?? '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setMessage('');
    try {
      await setOwnDisplayName({ displayName: name.trim() });
      setMessage(L('အမည် သိမ်းပြီးပါပြီ။', 'Name saved.'));
      onSaved?.();
    } catch (error) {
      console.error(error); setMessage(L('သိမ်း၍ မရပါ။', 'Could not save.'));
    } finally {
      setBusy(false);
    }
  };

  const missing = !currentName?.trim();

  return (
    <form
      onSubmit={submit}
      className={
        variant === 'card'
          ? 'space-y-2 rounded-card border border-line bg-white p-4 shadow-card'
          : 'mt-2 space-y-2 rounded-xl border border-line bg-canvas p-3'
      }
    >
      <div>
        <h2 className="text-sm font-semibold text-ink">
          {L('သုံးသပ်မှတ်တမ်းတွင် ပြသမည့် သင့်အမည်', 'Your name on review records')}
        </h2>
        <p className="text-xs text-ink-soft">
          {missing
            ? L(
                'အမည် မထည့်ရသေးပါ။ သုံးသပ်ဆုံးဖြတ်ချက် မှတ်တမ်းတင်ရန် အမည် လိုအပ်ပါသည်။',
                'No name set yet. A name is required before you can record review decisions.',
              )
            : L(
                'ဤအမည်သည် သင် မှတ်တမ်းတင်သော ဆုံးဖြတ်ချက်တိုင်းတွင် ပေါ်ပါမည်။',
                'This name appears on every decision you record.',
              )}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={busy}
          maxLength={120}
          placeholder={L('ဥပမာ — ဒေါ်လပြယ်ဝန်း', 'e.g. Daw La Pyae Wun')}
          aria-label={L('သုံးသပ်မှတ်တမ်းတွင် ပြသမည့် သင့်အမည်', 'Your name on review records')}
          className="min-w-[12rem] flex-1 rounded-lg border border-line px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={busy || !name.trim() || name.trim() === (currentName ?? '')}
          className="rounded-pill bg-sky px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? L('သိမ်းနေသည်…', 'Saving…') : L('အမည် သိမ်းမည်', 'Save name')}
        </button>
      </div>
      {message && <p role="status" className="text-xs text-ink-soft">{message}</p>}
      <p className="text-xs text-ink-soft">
        {L(
          'ပညာအရည်အချင်းကို ပိုင်ရှင်သာ သတ်မှတ်ပေးနိုင်ပါသည် — ဆေးဘက်ဆိုင်ရာ အတည်ပြုချက်၏ အခြေခံ ဖြစ်သောကြောင့် ဖြစ်သည်။',
          'Only an owner can set a professional qualification, because it is what makes a clinical approval a sign-off.',
        )}
      </p>
    </form>
  );
}
