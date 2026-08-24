import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useAction, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { OwnerRegistryStatus } from '../../../convex/lib/clinicalReviewRegistryContract';
import { useLocale } from '../../app/LocaleContext';

const OWNER_REGISTRY_STATUS_REFRESH_MS = 60_000;

const READINESS_LABELS: Record<string, { mm: string; en: string }> = {
  not_materialized: { mm: 'Registry row မတင်ရသေး', en: 'Registry row not materialized' },
  blocked_persisted_mismatch: { mm: 'Persisted batch မကိုက်ညီ', en: 'Persisted batch mismatch' },
  blocked_assignment_mismatch: { mm: 'Assignment မကိုက်ညီ', en: 'Assignment mismatch' },
  blocked_current_receipt_present: { mm: 'Frozen batch တွင် receipt ရှိနေသည်', en: 'Frozen batch already has a receipt' },
  already_active: { mm: 'လက်ရှိအသုံးပြုနေသည်', en: 'Already active' },
  already_completed: { mm: 'ပြီးဆုံးပြီး', en: 'Already completed' },
  stopped_changes_requested: { mm: 'ပြင်ဆင်ရန် ရပ်ထားသည်', en: 'Stopped for requested changes' },
  invalidated: { mm: 'ပယ်ဖျက်ထားသည်', en: 'Invalidated' },
  blocked_active_batch_exists: { mm: 'Active batch ရှိနေသည်', en: 'Another batch is active' },
  blocked_expired: { mm: 'သက်တမ်းကုန်နေသည်', en: 'Batch expired' },
  awaiting_predecessor_completion: { mm: 'ယခင် batch ပြီးရန် စောင့်နေသည်', en: 'Awaiting predecessor completion' },
  awaiting_predecessor_receipt: { mm: 'ယခင် receipt ကို စောင့်နေသည်', en: 'Awaiting predecessor receipt' },
  blocked_predecessor_mismatch: { mm: 'ယခင် batch preimage မကိုက်ညီ', en: 'Predecessor preimage mismatch' },
  blocked_upstream_receipt_consumed: { mm: 'ယခင် receipt ကို အသုံးပြုပြီး', en: 'Upstream receipt already consumed' },
  blocked_live_preflight: { mm: 'Live preflight မအောင်မြင်', en: 'Live preflight blocked' },
  blocked_refreeze_requires_exact_confirmation: { mm: 'Refreeze အတည်ပြုချက် သီးခြားလိုအပ်', en: 'Refreeze needs separate exact confirmation' },
  blocked_refreeze_precondition_mismatch: { mm: 'Refreeze precondition မကိုက်ညီ', en: 'Refreeze precondition mismatch' },
  ready_initial: { mm: 'Initial activation အဆင်သင့်', en: 'Ready for initial activation' },
  ready_after_handoff: { mm: 'Handoff activation အဆင်သင့်', en: 'Ready after handoff' },
  ready_after_changes_requested_refreeze: { mm: 'Refreeze activation အဆင်သင့်', en: 'Ready for exact refreeze activation' },
};

type LastAction =
  | { kind: 'materialize'; ok: boolean; code: string; registryDigest: string }
  | { kind: 'activate'; ok: boolean; code: string; batchId: string };

export function ClinicalRegistryOwnerPanel() {
  const { locale } = useLocale();
  const L = (mm: string, en: string) => locale === 'mm' ? mm : en;
  const loadStatus = useAction(api.clinicalReviewBatchActions.getOwnerRegistryStatus);
  const materialize = useMutation(api.clinicalReviewRegistry.materializeRegisteredReleaseBatches);
  const activate = useMutation(api.clinicalReviewRegistry.activateRegisteredBatch);
  const [status, setStatus] = useState<OwnerRegistryStatus | null | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [registryConfirmation, setRegistryConfirmation] = useState('');
  const [activationConfirmation, setActivationConfirmation] = useState('');
  const [activationUpstreamDigestConfirmation, setActivationUpstreamDigestConfirmation] = useState('');
  const [busyAction, setBusyAction] = useState<'materialize' | 'activate' | null>(null);
  const [lastAction, setLastAction] = useState<LastAction | null>(null);
  const submittingRef = useRef(false);
  const statusRequestRef = useRef(0);

  const refreshStatus = useCallback(async () => {
    const requestId = statusRequestRef.current + 1;
    statusRequestRef.current = requestId;
    setRefreshing(true);
    try {
      const next = await loadStatus({});
      if (statusRequestRef.current === requestId) setStatus(next);
      return next;
    } catch (error) {
      console.error(error);
      if (statusRequestRef.current === requestId) setStatus(null);
      return null;
    } finally {
      if (statusRequestRef.current === requestId) setRefreshing(false);
    }
  }, [loadStatus]);

  useEffect(() => {
    void refreshStatus();
    return () => { statusRequestRef.current += 1; };
  }, [refreshStatus]);

  useEffect(() => {
    if (!status) return undefined;
    const clientNow = Date.now();
    const nextExpiry = status.releases.reduce(
      (next, release) => release.expiresAt > clientNow ? Math.min(next, release.expiresAt) : next,
      Number.POSITIVE_INFINITY,
    );
    const date = new Date(clientNow);
    const nextUtcDay = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1);
    const refreshAt = Math.min(
      clientNow + OWNER_REGISTRY_STATUS_REFRESH_MS,
      nextExpiry,
      nextUtcDay,
    );
    const delay = Math.max(0, refreshAt - clientNow);
    const timer = window.setTimeout(() => { void refreshStatus(); }, delay);
    return () => window.clearTimeout(timer);
  }, [refreshStatus, status]);

  if (status === undefined) return <p className="text-ink-soft" role="status">…</p>;
  if (status === null) {
    return (
      <section className="rounded-card border border-line bg-white p-4 shadow-card sm:p-5" role="alert">
        <p className="text-sm text-amber-800">
          {L('Registry အခြေအနေကို server မှ မစစ်နိုင်သေးပါ။', 'Registry status could not be verified by the server.')}
        </p>
        <button
          type="button"
          onClick={() => { void refreshStatus(); }}
          disabled={refreshing}
          className="mt-3 min-h-touch rounded-pill border border-line bg-white px-4 py-2 text-sm font-semibold text-sky-deep disabled:opacity-50"
        >
          {L('ပြန်စစ်မည်', 'Retry status check')}
        </button>
      </section>
    );
  }

  const activationTarget = status.currentActivation;
  const refreezeActivation = activationTarget?.readinessCode
    === 'ready_after_changes_requested_refreeze';
  const registryConfirmed = registryConfirmation === status.registryDigest;
  const activationConfirmed = !!activationTarget
    && activationConfirmation === activationTarget.confirmationText
    && (!refreezeActivation
      || (!!activationTarget.expectedUpstreamReceiptDigest
        && activationUpstreamDigestConfirmation
          === activationTarget.expectedUpstreamReceiptDigest));
  const materializeSubmitted = lastAction?.kind === 'materialize' && lastAction.ok
    && lastAction.registryDigest === status.registryDigest;
  const activationSubmitted = lastAction?.kind === 'activate' && lastAction.ok
    && activationTarget?.batchId === lastAction.batchId;
  const materializeReadback = lastAction?.kind === 'materialize' && lastAction.ok
    && lastAction.registryDigest === status.registryDigest
    && status.materializationCode === 'materialized_exact';
  const activationReadback = lastAction?.kind === 'activate' && lastAction.ok
    && status.releases.some((release) => (
      release.batchId === lastAction.batchId && release.persistedStatus === 'active'
    ));

  const submitMaterialize = async (event: FormEvent) => {
    event.preventDefault();
    if (submittingRef.current || busyAction || refreshing || materializeSubmitted || !registryConfirmed
      || status.registryCode !== 'valid'
      || status.materializationCode !== 'materialization_required') return;
    submittingRef.current = true;
    setBusyAction('materialize');
    setLastAction(null);
    try {
      const result = await materialize({ expectedRegistryDigest: status.registryDigest });
      setLastAction({
        kind: 'materialize',
        ok: result.ok,
        code: result.code,
        registryDigest: status.registryDigest,
      });
      if (result.ok) await refreshStatus();
    } catch (error) {
      console.error(error);
      setLastAction({
        kind: 'materialize',
        ok: false,
        code: 'backend_unavailable',
        registryDigest: status.registryDigest,
      });
    } finally {
      submittingRef.current = false;
      setBusyAction(null);
    }
  };

  const submitActivation = async (event: FormEvent) => {
    event.preventDefault();
    if (submittingRef.current || busyAction || refreshing || activationSubmitted
      || !activationTarget || !activationConfirmed) return;
    submittingRef.current = true;
    setBusyAction('activate');
    setLastAction(null);
    try {
      const result = await activate({
        batchId: activationTarget.batchId,
        expectedFreezeDigest: activationTarget.freezeDigest,
        ...(activationTarget.expectedUpstreamReceiptDigest
          ? {
              expectedUpstreamReceiptDigest: refreezeActivation
                ? activationUpstreamDigestConfirmation
                : activationTarget.expectedUpstreamReceiptDigest,
            }
          : {}),
      });
      setLastAction({
        kind: 'activate',
        ok: result.ok,
        code: result.code,
        batchId: activationTarget.batchId,
      });
      if (result.ok) await refreshStatus();
    } catch (error) {
      console.error(error);
      setLastAction({
        kind: 'activate',
        ok: false,
        code: 'backend_unavailable',
        batchId: activationTarget.batchId,
      });
    } finally {
      submittingRef.current = false;
      setBusyAction(null);
    }
  };

  return (
    <div className="space-y-4" data-testid="clinical-registry-owner-panel">
      <section className="rounded-card border border-line bg-white p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-mint-deep">Clinical release registry</p>
            <h2 className="mt-1 text-lg font-bold text-sky-deep">
              {L('Owner လုပ်ဆောင်မှု ထိန်းချုပ်ရေး', 'Owner operational controls')}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { void refreshStatus(); }}
              disabled={refreshing || busyAction !== null}
              className="min-h-touch rounded-pill border border-line bg-white px-3 py-1 text-xs font-semibold text-sky-deep disabled:opacity-50"
            >
              {refreshing ? L('စစ်နေသည်…', 'Checking…') : L('အခြေအနေပြန်စစ်မည်', 'Refresh status')}
            </button>
            <span className={`rounded-pill px-3 py-1 text-xs font-semibold ${
              status.registryCode === 'valid' ? 'bg-mint-soft text-mint-deep' : 'bg-pastel-yellow text-amber-800'
            }`}>
              {status.registryCode}
            </span>
          </div>
        </div>
        <p className="mt-3 text-sm leading-7 text-ink-soft">
          {L(
            'ဤနေရာသည် code-frozen release registry ကိုသာ တင်ပြီး လက်ရှိအဆင်သင့် batch တစ်ခုကိုသာ activate လုပ်နိုင်သည်။ Review ဆုံးဖြတ်ချက် သို့မဟုတ် Publish ကို မလုပ်ပါ။',
            'This surface only materializes the code-frozen release registry and activates the single currently eligible batch. It never records a review decision or publishes content.',
          )}
        </p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-xl bg-canvas p-3">
            <dt className="text-xs text-ink-soft">{L('မှတ်ပုံတင်ထားသော release', 'Registered releases')}</dt>
            <dd className="mt-1 text-lg font-bold text-ink">{status.registeredReleaseCount}</dd>
          </div>
          <div className="rounded-xl bg-canvas p-3">
            <dt className="text-xs text-ink-soft">{L('Persisted batches', 'Persisted batches')}</dt>
            <dd className="mt-1 text-lg font-bold text-ink">{status.persistedBatchCount}</dd>
          </div>
          <div className="rounded-xl bg-canvas p-3">
            <dt className="text-xs text-ink-soft">{L('Persisted assignments', 'Persisted assignments')}</dt>
            <dd className="mt-1 text-lg font-bold text-ink">{status.persistedAssignmentCount}</dd>
          </div>
        </dl>
        <div className="mt-4 rounded-xl border border-line bg-canvas p-3">
          <p className="text-xs font-semibold text-ink-soft">Registry digest</p>
          <code data-testid="clinical-registry-digest" className="mt-1 block break-all text-xs text-ink">{status.registryDigest}</code>
        </div>
      </section>

      <section className="rounded-card border border-line bg-white p-4 shadow-card sm:p-5">
        <h3 className="font-bold text-ink">{L('Release အခြေအနေ', 'Release status')}</h3>
        <ul className="mt-3 space-y-3">
          {status.releases.map((release) => {
            const readiness = READINESS_LABELS[release.readinessCode];
            return (
              <li key={release.batchId} className="rounded-xl border border-line bg-canvas p-3" data-testid={`registry-release-${release.batchId}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="break-all text-sm font-semibold text-ink">{release.batchId}</p>
                    <p className="mt-1 text-xs text-ink-soft">
                      #{release.sequence} · {release.dimension} · {release.activationKind} · {release.itemCount} {L('ခု', 'items')}
                    </p>
                  </div>
                  <span className="rounded-pill bg-white px-3 py-1 text-xs font-semibold text-mint-deep">
                    {release.persistedStatus ?? L('မတင်ရသေး', 'not materialized')}
                  </span>
                </div>
                <p className="mt-2 text-xs text-ink-soft">
                  {readiness ? readiness[locale] : release.readinessCode} · batch {release.persistedBatchRows} · assignments {release.persistedAssignmentRows}/{release.itemCount} · receipts {release.persistedReceiptRows}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <form onSubmit={submitMaterialize} className="space-y-3 rounded-card border border-line bg-white p-4 shadow-card sm:p-5">
        <div>
          <h3 className="font-bold text-ink">{L('Registry ကို တင်ရန်', 'Materialize registry')}</h3>
          <p className="mt-1 text-sm leading-6 text-ink-soft">
            {L('အပေါ်ရှိ digest အပြည့်အစုံကို ရိုက်ထည့်မှ exact registry rows ကို atomic အဖြစ် တင်နိုင်သည်။ Activate မလုပ်ပါ။', 'Type the complete digest shown above to atomically materialize only the exact registry rows. This does not activate a batch.')}
          </p>
        </div>
        <label className="block space-y-1.5 text-sm font-medium text-ink">
          <span>{L('Registry digest အတည်ပြုချက်', 'Registry digest confirmation')}</span>
          <input
            value={registryConfirmation}
            onChange={(event) => setRegistryConfirmation(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="min-h-touch w-full rounded-xl border border-line bg-white px-3 py-2 font-mono text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={busyAction !== null || refreshing || materializeSubmitted || !registryConfirmed || status.registryCode !== 'valid'
            || status.materializationCode !== 'materialization_required'}
          className="min-h-touch rounded-pill bg-sky px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busyAction === 'materialize' ? L('တင်နေသည်…', 'Materializing…') : L('Exact registry ကို တင်မည်', 'Materialize exact registry')}
        </button>
      </form>

      <form onSubmit={submitActivation} className="space-y-3 rounded-card border border-line bg-white p-4 shadow-card sm:p-5">
        <div>
          <h3 className="font-bold text-ink">{L('လက်ရှိ batch ကို activate လုပ်ရန်', 'Activate current batch')}</h3>
          {activationTarget ? (
            <p className="mt-1 text-sm leading-6 text-ink-soft">
              {L('အောက်ပါစာသားကို အတိအကျ ရိုက်ပါ', 'Type this text exactly')}: <code className="break-all font-semibold text-ink">{activationTarget.confirmationText}</code>
            </p>
          ) : (
            <p className="mt-1 text-sm leading-6 text-ink-soft">
              {L('ယခု activate လုပ်နိုင်သော frozen batch မရှိပါ။', 'No frozen batch is currently eligible for activation.')}
            </p>
          )}
        </div>
        <label className="block space-y-1.5 text-sm font-medium text-ink">
          <span>{L('Activation အတည်ပြုချက်', 'Activation confirmation')}</span>
          <input
            value={activationConfirmation}
            onChange={(event) => setActivationConfirmation(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            disabled={!activationTarget}
            className="min-h-touch w-full rounded-xl border border-line bg-white px-3 py-2 font-mono text-sm disabled:opacity-60"
          />
        </label>
        {refreezeActivation && activationTarget.expectedUpstreamReceiptDigest && (
          <label className="block space-y-1.5 text-sm font-medium text-ink">
            <span>{L('Decision-set digest အတည်ပြုချက်', 'Decision-set digest confirmation')}</span>
            <code className="block break-all rounded-xl border border-line bg-canvas p-3 text-xs font-normal text-ink">
              {activationTarget.expectedUpstreamReceiptDigest}
            </code>
            <input
              value={activationUpstreamDigestConfirmation}
              onChange={(event) => setActivationUpstreamDigestConfirmation(event.target.value)}
              aria-label={L('Decision-set digest အတည်ပြုချက်', 'Decision-set digest confirmation')}
              autoComplete="off"
              spellCheck={false}
              className="min-h-touch w-full rounded-xl border border-line bg-white px-3 py-2 font-mono text-sm"
            />
          </label>
        )}
        <button
          type="submit"
          disabled={busyAction !== null || refreshing || activationSubmitted || !activationConfirmed}
          className="min-h-touch rounded-pill bg-sky px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busyAction === 'activate' ? L('Activate လုပ်နေသည်…', 'Activating…') : L('ဤ exact batch ကို activate လုပ်မည်', 'Activate this exact batch')}
        </button>
      </form>

      {lastAction && (
        <section role="status" className={`rounded-xl border p-3 text-sm ${
          lastAction.ok ? 'border-mint bg-mint-soft text-mint-deep' : 'border-amber-300 bg-pastel-yellow text-amber-800'
        }`}>
          <p className="font-semibold">{lastAction.code}</p>
          {lastAction.ok && (
            <p data-testid="clinical-registry-readback" className="mt-1">
              {materializeReadback || activationReadback
                ? L('Server readback ကိုက်ညီပြီးပါပြီ။', 'Server readback confirmed.')
                : L('Server readback ကို စောင့်နေသည်…', 'Waiting for server readback…')}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
