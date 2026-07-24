# Environment Variables

See `.env.example`. Never commit real values; `.gitignore` blocks all `.env*`
except the example.

| Variable | Scope | Purpose |
|----------|-------|---------|
| `VITE_SUPABASE_URL` | client | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | client | Supabase anon/public key (safe to ship) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Admin/Edge functions. Never bundle/log/commit. |
| `SUPABASE_DB_URL` | **server only** | Direct DB connection for migrations |
| `VITE_APP_ENV` | client | `development` / `preview` / `production` |
| `VITE_DEFAULT_LOCALE` | client | Default locale (`mm`) |
| `VITE_SENTRY_DSN` | client | Optional error monitoring; blank disables |

## Per-environment
- **development:** local `.env.local`, local or dev Supabase project.
- **preview:** Vercel preview env + Supabase preview branch.
- **production:** Vercel production env + production Supabase (approval-gated).

## Secret handling
Only `VITE_`-prefixed vars are exposed to the client bundle. The service-role key
and DB URL must be set as **non-`VITE_` server-side** variables in Vercel/Supabase
and used only from server contexts (Edge Functions, migration jobs).
