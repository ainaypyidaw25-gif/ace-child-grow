import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import type { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';
import { OwnDisplayName } from '../components/OwnDisplayName';
import { ConfirmDialog } from '../components/ConfirmDialog';

type StaffRole = 'owner' | 'content_editor' | 'language_reviewer' | 'evidence_reviewer' | 'clinical_reviewer' | 'review_manager' | 'support';

const ROLE_LABELS: Record<StaffRole, { mm: string; en: string }> = {
  owner: { mm: 'ပိုင်ရှင်', en: 'Owner' },
  content_editor: { mm: 'အကြောင်းအရာ သုံးသပ်/တည်းဖြတ်သူ', en: 'Content reviewer / editor' },
  language_reviewer: { mm: 'မြန်မာဘာသာစကား သုံးသပ်သူ', en: 'Native-language reviewer' },
  evidence_reviewer: { mm: 'ကိုးကားအထောက်အထား သုံးသပ်သူ', en: 'Evidence reviewer' },
  clinical_reviewer: { mm: 'ဆေးဘက်ဆိုင်ရာ သုံးသပ်သူ', en: 'Clinical reviewer' },
  review_manager: { mm: 'စစ်ဆေးရေး မန်နေဂျာ', en: 'Review manager' },
  support: { mm: 'အသုံးပြုသူအကူအညီပေးသူ', en: 'Support' },
};

const ROLE_DESCRIPTIONS: Record<StaffRole, { mm: string; en: string }> = {
  owner: { mm: 'အဖွဲ့၊ အကြောင်းအရာနှင့် စနစ်ဆိုင်ရာ စီမံခန့်ခွဲမှုအားလုံးကို လုပ်နိုင်သည်။ Clinical approval ကို သက်ဆိုင်ရာ clinical reviewer က သီးခြားမှတ်တမ်းတင်ရသည်။', en: 'Full team, content and system administration. Clinical approval remains a separate clinical-reviewer decision.' },
  content_editor: { mm: 'အကြောင်းအရာအားလုံးကို တည်းဖြတ်ပြီး သုံးသပ်လုပ်ငန်းကို စီမံနိုင်သည်။ ငွေပေးချေမှု၊ အဖွဲ့ဝင်အခန်းကဏ္ဍနှင့် clinical approval မပါဝင်ပါ။', en: 'Can edit all content and manage content review work. Billing, team roles and clinical approval are excluded.' },
  language_reviewer: { mm: 'မြန်မာနှင့် အင်္ဂလိပ်စာသားကို တိုက်ရိုက်ပြင်ပြီး ဘာသာစကားသုံးသပ်ချက် မှတ်တမ်းတင်နိုင်သည်။', en: 'Can correct wording directly and record language-review decisions.' },
  evidence_reviewer: { mm: 'စာသားကို ပြင်နိုင်ပြီး ကိုးကားအထောက်အထား သုံးသပ်ချက်ကို ပညာအရည်အချင်းနှင့်အတူ မှတ်တမ်းတင်နိုင်သည်။', en: 'Can correct wording and record qualified evidence-review decisions.' },
  clinical_reviewer: { mm: 'စာသားကို ပြင်နိုင်ပြီး သက်ဆိုင်ရာ ဘေးကင်းရေးနှင့် ဆေးဘက်ဆိုင်ရာ သုံးသပ်ချက်ကို မှတ်တမ်းတင်နိုင်သည်။', en: 'Can correct wording and record qualified safety and clinical decisions.' },
  review_manager: { mm: 'ဦးစားပေးတန်းအားလုံးကို ကြည့်နိုင်ပြီး စိစစ်ခြင်း၊ လိုအပ်သည့် စစ်ဆေးမှုများ အတည်ပြုခြင်း၊ တောင်းဆိုခြင်း လုပ်နိုင်သည်။ သုံးသပ်ဆုံးဖြတ်ချက် မှတ်တမ်းတင်ခွင့်နှင့် ထုတ်ဝေခွင့် မရှိပါ။', en: 'Sees the whole priority queue; triages, confirms required reviews and requests them. Records no review decision and cannot publish.' },
  support: { mm: 'အသုံးပြုသူအကူအညီပေးနိုင်သော်လည်း အကြောင်းအရာကို တည်းဖြတ်၍ မရပါ။', en: 'Can support users but cannot edit content.' },
};

function MemberRow({
  member,
  currentUserId,
}: {
  member: { userId: Id<'users'>; email: string | null; displayName: string | null; role: StaffRole; qualification: string | null };
  currentUserId: Id<'users'> | null;
}) {
  const { locale } = useLocale();
  const changeRole = useMutation(api.admin.changeRole);
  const removeStaff = useMutation(api.admin.removeStaff);
  const [role, setRole] = useState<StaffRole>(member.role);
  const [displayName, setDisplayName] = useState(member.displayName ?? '');
  const [qualification, setQualification] = useState(member.qualification ?? '');
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const mine = member.userId === currentUserId;

  return (
    <li className="space-y-2 rounded-xl border border-line bg-white p-3">
      <div>
        <p className="font-medium text-ink">{member.displayName ?? member.email ?? (locale === 'mm' ? 'အမည်မရှိပါ' : 'No name')}</p>
        {member.displayName && <p className="text-xs text-ink-soft">{member.email}</p>}
        {mine && <span className="text-xs text-sky-deep">{locale === 'mm' ? 'လက်ရှိအကောင့်' : 'Current account'}</span>}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <select
          value={role}
          disabled={mine || busy}
          onChange={(event) => setRole(event.target.value as StaffRole)}
          className="rounded-lg border border-line px-3 py-2 text-sm disabled:bg-canvas"
        >
          {(Object.keys(ROLE_LABELS) as StaffRole[]).map((key) => (
            <option key={key} value={key}>{ROLE_LABELS[key][locale]}</option>
          ))}
        </select>
        {/* Every staff role needs a name: saveDecision refuses a decision from a
            reviewer without one, so gating this field to clinical/evidence
            reviewers left other roles unable to review at all. */}
        <input
          value={displayName}
          disabled={mine || busy}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder={locale === 'mm' ? 'သုံးသပ်သူအမည်' : 'Reviewer name'}
          aria-label={locale === 'mm' ? 'သုံးသပ်သူအမည်' : 'Reviewer name'}
          className="rounded-lg border border-line px-3 py-2 text-sm disabled:bg-canvas"
        />
        {['clinical_reviewer', 'evidence_reviewer'].includes(role) && (
          <input
            value={qualification}
            disabled={mine || busy}
            onChange={(event) => setQualification(event.target.value)}
            placeholder={locale === 'mm' ? 'ပညာအရည်အချင်း' : 'Professional qualification'}
            aria-label={locale === 'mm' ? 'ပညာအရည်အချင်း' : 'Professional qualification'}
            className="rounded-lg border border-line px-3 py-2 text-sm"
          />
        )}
      </div>
      <p className="rounded-lg bg-canvas px-3 py-2 text-xs text-ink-soft">{ROLE_DESCRIPTIONS[role]?.[locale] ?? ''}</p>
      {!mine && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || (['clinical_reviewer', 'evidence_reviewer'].includes(role) && (!displayName.trim() || !qualification.trim()))}
            onClick={async () => {
              setBusy(true);
              try {
                await changeRole({
                  userId: member.userId,
                  role,
                  displayName: displayName.trim() || undefined,
                  reviewerQualification: ['clinical_reviewer', 'evidence_reviewer'].includes(role) ? qualification.trim() : undefined,
                });
              } finally {
                setBusy(false);
              }
            }}
            className="rounded-pill bg-sky px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {locale === 'mm' ? 'အခန်းကဏ္ဍ သိမ်းမည်' : 'Save role'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmRemove(true)}
            className="rounded-pill border border-state-red px-4 py-2 text-sm text-state-red-deep disabled:opacity-50"
          >
            {locale === 'mm' ? 'ဝင်ခွင့် ဖယ်ရှားမည်' : 'Remove access'}
          </button>
        </div>
      )}
      {confirmRemove && (
        <ConfirmDialog
          message={locale === 'mm' ? 'ဤအကောင့်၏ စီမံခန့်ခွဲရေးဝင်ခွင့်ကို ဖယ်ရှားမလား။' : 'Remove this account’s admin access?'}
          cancelLabel={locale === 'mm' ? 'မလုပ်တော့ပါ' : 'Cancel'}
          confirmLabel={locale === 'mm' ? 'ဖယ်ရှားမည်' : 'Remove'}
          onCancel={() => setConfirmRemove(false)}
          onConfirm={async () => {
            setConfirmRemove(false);
            setBusy(true);
            try { await removeStaff({ userId: member.userId }); } finally { setBusy(false); }
          }}
        />
      )}
    </li>
  );
}

export function AdminTeam() {
  const { locale } = useLocale();
  const team = useQuery(api.admin.listTeam);
  const createInvite = useMutation(api.admin.createInvite);
  const revokeInvite = useMutation(api.admin.revokeInvite);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<StaffRole>('content_editor');
  const [qualification, setQualification] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (team === undefined) return <p className="text-ink-soft">…</p>;
  if (!team.allowed) {
    return <p className="rounded-card border border-line bg-white p-4 text-ink-soft">
      {locale === 'mm' ? 'စီမံခန့်ခွဲရေးအဖွဲ့ကို ပိုင်ရှင်သာ စီမံနိုင်သည်။' : 'Only an owner can manage the admin team.'}
    </p>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-sky-deep">{locale === 'mm' ? 'စီမံခန့်ခွဲရေးအဖွဲ့' : 'Admin team'}</h1>
        <p className="text-sm text-ink-soft">
          {locale === 'mm'
            ? 'အကောင့်မရှိသေးသူကိုလည်း အီးမေးလ်ဖြင့် ဖိတ်ကြားနိုင်သည်။ လင့်ခ်ကို သက်ဆိုင်သူထံ သီးသန့်ပို့ပြီး ဖိတ်ထားသော အီးမေးလ်အတိအကျဖြင့် အကောင့်ဖွင့်ရန် သို့မဟုတ် ဝင်ရန် ပြောပေးပါ။'
            : 'You can invite someone before they create an account. Send the private link only to them; they must sign up or sign in with the exact invited email.'}
        </p>
      </div>

      <OwnDisplayName currentName={team.members.find((member) => member.userId === team.currentUserId)?.displayName ?? null} />

      <form
        className="space-y-3 rounded-card border border-line bg-white p-4 shadow-card"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError('');
          try {
            const result = await createInvite({
              email,
              displayName,
              role,
              reviewerQualification: ['clinical_reviewer', 'evidence_reviewer'].includes(role) ? qualification.trim() : undefined,
            });
            setInviteLink(`${window.location.origin}/admin/accept-invite/${encodeURIComponent(result.inviteCode)}`);
            setEmail('');
            setDisplayName('');
          } catch (caught) {
            setError(
              locale === 'mm'
                ? 'ဖိတ်ကြားလင့်ခ် ဖန်တီး၍ မရပါ။ အီးမေးလ်၊ အမည်နှင့် ပညာအရည်အချင်းကို ပြန်စစ်ပါ။'
                : caught instanceof Error ? caught.message : 'Unable to create invitation.',
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2 className="font-semibold">{locale === 'mm' ? 'အဖွဲ့ဝင် ဖိတ်ကြားရန်' : 'Invite a team member'}</h2>
        <input
          required
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder={locale === 'mm' ? 'အဖွဲ့ဝင်အမည်' : 'Team member name'}
          className="w-full rounded-lg border border-line px-3 py-2"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={locale === 'mm' ? 'အီးမေးလ်လိပ်စာ' : 'Email address'}
          className="w-full rounded-lg border border-line px-3 py-2"
        />
        <select value={role} onChange={(event) => setRole(event.target.value as StaffRole)} className="w-full rounded-lg border border-line px-3 py-2">
          {(Object.keys(ROLE_LABELS) as StaffRole[]).map((key) => (
            <option key={key} value={key}>{ROLE_LABELS[key][locale]}</option>
          ))}
        </select>
        <p className="rounded-lg bg-canvas px-3 py-2 text-sm text-ink-soft">{ROLE_DESCRIPTIONS[role]?.[locale] ?? ''}</p>
        {['clinical_reviewer', 'evidence_reviewer'].includes(role) && (
          <input
            required
            value={qualification}
            onChange={(event) => setQualification(event.target.value)}
            placeholder={locale === 'mm' ? 'သက်ဆိုင်ရာ ပညာအရည်အချင်း' : 'Relevant professional qualification'}
            className="w-full rounded-lg border border-line px-3 py-2"
          />
        )}
        {error && <p className="text-sm text-state-red-deep">⚠️ {error}</p>}
        <button disabled={busy} className="rounded-pill bg-sky px-5 py-2 font-semibold text-white disabled:opacity-50">
          {busy ? '…' : locale === 'mm' ? 'ဖိတ်ကြားလင့်ခ် ဖန်တီးမည်' : 'Create invitation link'}
        </button>
        {inviteLink && (
          <div className="rounded-xl bg-mint-soft p-3 text-sm">
            <p className="break-all text-ink">{inviteLink}</p>
            <button type="button" onClick={() => void navigator.clipboard.writeText(inviteLink)} className="mt-2 text-sky-deep underline">
              {locale === 'mm' ? 'လင့်ခ် ကူးယူမည်' : 'Copy link'}
            </button>
          </div>
        )}
      </form>

      <section>
        <h2 className="mb-2 font-semibold">{locale === 'mm' ? 'လက်ရှိအဖွဲ့ဝင်များ' : 'Current members'}</h2>
        <ul className="space-y-2">
          {team.members.map((member) => <MemberRow key={member.userId} member={member} currentUserId={team.currentUserId} />)}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">{locale === 'mm' ? 'စောင့်ဆိုင်းနေသော ဖိတ်ကြားချက်များ' : 'Pending invitations'}</h2>
        {team.invites.length === 0 ? <p className="text-sm text-ink-soft">{locale === 'mm' ? 'မရှိသေးပါ။' : 'None.'}</p> : (
          <ul className="space-y-2">
            {team.invites.map((invite) => (
              <li key={invite.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white p-3">
                <div>
                  <p className="font-medium">{invite.displayName}</p>
                  <p className="text-xs text-ink-soft">{invite.email}</p>
                  <p className="text-xs text-ink-soft">{ROLE_LABELS[invite.role]?.[locale] ?? invite.role} · {new Date(invite.expiresAt).toLocaleDateString()}</p>
                </div>
                <button type="button" onClick={() => void revokeInvite({ id: invite.id })} className="text-sm text-state-red-deep">
                  {locale === 'mm' ? 'ပယ်ဖျက်မည်' : 'Revoke'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
