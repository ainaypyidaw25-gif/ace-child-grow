# Rollback Plan

## Frontend
Vercel deployments are immutable. To roll back, promote the previous known-good
deployment (Vercel dashboard → Deployments → "Promote to Production") or redeploy
the prior commit. No DNS change required for a promotion.

## Database
Migrations are forward-only. Before any production migration:
1. Take a Supabase backup / point-in-time snapshot.
2. Apply the migration in a preview branch first.
3. For a bad migration, restore from the snapshot (approval-gated) or apply a
   compensating forward migration. **Never** hand-edit production rows without
   an audit-logged, approved procedure.

## Rollback triggers (any P0)
Child data visible across accounts · exposed secret · broken auth · urgent-
warning failure · failed production build · data-loss risk.

## Communication
On rollback, record the incident, the trigger, the action taken, and the
follow-up fix in `docs/operations/` and `audit_logs`.

## Approval gates
Production DB reset, DNS change, and `main` merge each require explicit human
approval and are never performed automatically.
