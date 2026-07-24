# Deployment Guide

## Environments
`development` (local) → `preview` (per-branch) → `production` (approval-gated).

## Frontend (Vercel)
1. Import the repo; framework preset **Vite**.
2. Build command `npm run build`, output `dist/`.
3. Set env vars per environment (see environment-variables.md).
4. Each branch push creates an immutable **preview** deployment.
5. **Production deploy and `main` merge require explicit human approval.**

## Backend (Supabase)
1. Create a Supabase project (blocked until credentials provided).
2. Apply migrations in order:
   `supabase db push` (or run `0001` → `0002` → `0003` in the SQL editor).
3. Configure Auth (email/password + reset), redirect URLs, and storage buckets.
4. Verify RLS is **enabled** on every table (it is set by `0002`).

## Pre-deploy validation checklist
Env vars present · migrations applied · auth callbacks configured · CORS/CSP set ·
PWA manifest + service worker served · error monitoring wired · DB backup taken ·
rollback plan confirmed (rollback-plan.md).

## Before requesting production approval, provide
Preview URL · commit hash · migration status · test report · known limitations ·
clinical-review status · rollback plan.

## Current status
Preview/production deployment is **blocked** pending Supabase + Vercel
credentials and GitHub remote. The build artifact (`dist/`) is verified locally.
