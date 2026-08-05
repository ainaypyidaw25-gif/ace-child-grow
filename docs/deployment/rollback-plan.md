# Rollback Plan

## Frontend
Vercel deployments are immutable. To roll back, promote the previous known-good
deployment (Vercel dashboard → Deployments → "Promote to Production") or redeploy
the prior commit. No DNS change required for a promotion.

## Backend (Convex)
There are no SQL migrations — `convex/schema.ts` changes deploy directly via
`npx convex deploy`, and Convex validates existing data against the new
schema at push time (the CLI reports `No indexes are deleted by this push` on
a clean deploy; an unexpected index deletion is a red flag to stop and
investigate before proceeding). Before any production schema/function change:
1. Export/back up production data from the Convex dashboard (Data → Export)
   before a change that alters or removes a field, in case a compensating
   fix is needed afterward.
2. Verify the change against the dev deployment (`uncommon-orca-603`) first.
3. Deploy to production (`graceful-possum-566`) per `convex-setup.md`, and
   watch the CLI output for unexpected index/table changes.
4. For a bad deploy: redeploy the prior commit's `convex/` code (Convex
   functions are just code — rolling back is another `convex deploy` of the
   previous version) or apply a compensating forward change. **Never**
   hand-edit production rows outside of an audited, approved procedure.

## Rollback triggers (any P0)
Child data visible across accounts · exposed secret · broken auth · urgent-
warning failure · failed production build · data-loss risk.

## Communication
On rollback, record the incident, the trigger, the action taken, and the
follow-up fix in `docs/operations/` and the Convex `auditLogs` table (via
`convex/audit.ts`'s `logAudit`).

## Approval gates
Production data reset, DNS change, and `main` merge each require explicit
human approval and are never performed automatically.
