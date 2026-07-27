import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import type { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';
import { useLocale } from '../app/LocaleContext';

type StaffRole = 'owner' | 'content_editor' | 'language_reviewer' | 'evidence_reviewer' | 'clinical_reviewer' | 'support';

const ROLE_LABELS: Record<StaffRole, { mm: string; en: string }> = {
  owner: { mm: 'ပိုင်ရှင်', en: 'Owner' },
  content_editor: { mm: 'အကြောင်းအရာ တည်းဖြတ်သူ', en: 'Content editor' },
  language_reviewer: { mm: 'မြန်မာဘာသာစကား သုံးသပ်သူ', en: 'Native-language reviewer' },
  evidence_reviewer: { mm: 'ကိုးကားအထောက်အထား သုံးသပ်သူ', en: 'Evidence reviewer' },
  clinical_reviewer: { mm: 'ဆေးဘက်ဆိုင်ရာ သုံးသပ်သူ', en: 'Clinical reviewer' },
  support: { mm: 'အသုံးပြုသူအကူအညီပေးသူ', en: 'Support' },
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
        {['clinical_reviewer', 'evidence_reviewer'].includes(role) && (
          <>
            <input
              value={displayName}
              disabled={mine || busy}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder={locale === 'mm' ? 'သုံးသပ်သူအမည်' : 'Reviewer name'}
              className="rounded-lg border border-line px-3 py-2 text-sm"
            />
            <input
              value={qualification}
              disabled={mine || busy}
              onChange={(event) => setQualification(event.target.value)}
              placeholder={locale === 'mm' ? 'ပညာအရည်အချင်း' : 'Professional qualification'}
              className="rounded-lg border border-line px-3 py-2 text-sm"
            />
          </>
        )}
      </div>
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
            onClick={async () => {
              if (!window.confirm(locale === 'mm' ? 'ဤအကောင့်၏ စီမံခန့်ခွဲရေးဝင်ခွင့်ကို ဖယ်ရှားမလား။' : 'Remove this account’s admin access?')) return;
              setBusy(true);
              try { await removeStaff({ userId: member.userId }); } finally { setBusy(false); }
            }}
            className="rounded-pill border border-state-red px-4 py-2 text-sm text-state-red disabled:opacity-50"
          >
            {locale === 'mm' ? 'ဝင်ခွင့် ဖယ်ရှားမည်' : 'Remove access'}
          </button>
        </div>
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
        {['clinical_reviewer', 'evidence_reviewer'].includes(role) && (
          <input
            required
            value={qualification}
            onChange={(event) => setQualification(event.target.value)}
            placeholder={locale === 'mm' ? 'သက်ဆိုင်ရာ ပညာအရည်အချင်း' : 'Relevant professional qualification'}
            className="w-full rounded-lg border border-line px-3 py-2"
          />
        )}
        {error && <p className="text-sm text-state-red">⚠️ {error}</p>}
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
                  <p className="text-xs text-ink-soft">{ROLE_LABELS[invite.role][locale]} · {new Date(invite.expiresAt).toLocaleDateString()}</p>
                </div>
                <button type="button" onClick={() => void revokeInvite({ id: invite.id })} className="text-sm text-state-red">
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
