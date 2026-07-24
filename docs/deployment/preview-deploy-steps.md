# Getting a Live Preview URL (Vercel)

The reliable way to deploy this app is to let Vercel build it from a Git repo.
Everything is deploy-ready: `npm run build` passes, and Vercel's Vite preset
handles SPA routing automatically.

## Option A — you push, Vercel imports (≈2 minutes, guaranteed)

From the delivered `ace-child-grow-repo.bundle`:

```bash
# 1. Restore the repo from the bundle
git clone ace-child-grow-repo.bundle ace-child-grow
cd ace-child-grow

# 2. Create an empty GitHub repo (via github.com or gh), then:
git remote add origin https://github.com/<you>/ace-child-grow.git
git push -u origin feature/ace-child-grow-production-foundation
```

Then in Vercel: **Add New → Project → Import** your GitHub repo. Framework is
auto-detected as **Vite**; Build = `npm run build`, Output = `dist`. Click
**Deploy** → you get a preview URL. (No `vercel.json` needed — the Vite preset
adds the SPA fallback.)

Add env vars later in **Project → Settings → Environment Variables**:
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (see `.env.example`).

## Option B — I deploy it for you

If you connect the **GitHub connector** in claude.ai (or give me a repo + token),
I'll push the branch and wire the Vercel import for you, then hand back the
preview URL. Production deploys still require your explicit approval.

## Notes
- Until Supabase env vars are set, the app runs in **demo mode** (in-memory,
  clearly labelled) — the preview is fully clickable as a demo.
- Production deployment and `main` merges require explicit approval + clinical
  review sign-off before any content is published.
