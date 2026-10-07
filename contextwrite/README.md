# ContextWrite

An AI writing app that learns the context behind your writing (who it's for, what happened, how you want it to feel) before it drafts, so the result sounds like you.

## How it works
Next.js 15 (App Router) on Vercel, Supabase for login, database and private file storage. There is no built-in AI: each user connects their own account (Google Gemini, OpenAI, Claude, or any OpenAI-compatible service such as OpenRouter) and the server calls it on their behalf.

**Writing pipeline:** description → adaptive questions (`/api/engine`) → context summary the user can correct → optional writing plan (`/api/plan`) → draft (`/api/draft`) → edit, refine, check (`/api/quality`) → save, finish, export.

**Layout**
- `app/` pages and API routes: `write` (workspace), `dashboard`, `voice` (voice profiles), `settings` (AI connection), `account`, `admin`, `welcome` (first-time intro)
- `lib/ai/` provider adapters, model listing, search, reply normalisation, friendly errors
- `components/` shared UI (header, floating menu, guided tour, feedback)
- `lib/brand.ts` name, colours, logo: change your brand in one place
- `supabase/migrations/` the full database setup; `supabase/tests/isolation.sql` the data-isolation test

## Environment variables
| Name | Where it comes from |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Project Settings > API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | same page (the publishable/anon key; safe to expose) |
| `SUPABASE_SERVICE_ROLE_KEY` | same page, **server only, never commit** |
| `KEY_ENCRYPTION_SECRET` | run `openssl rand -base64 32`. Back it up: losing it makes saved AI keys unreadable |
| `NEXT_PUBLIC_GOOGLE_LOGIN` | optional, `true` once Google sign-in is enabled in Supabase |

## Database setup
1. Create a Supabase project.
2. SQL Editor: paste and run `supabase/migrations/20261003000000_contextwrite_schema.sql`.
3. Authentication > URL Configuration: set Site URL to your live address and add `https://YOUR-DOMAIN/**` as a redirect URL.
4. Sign up once in the app, then make yourself admin in the SQL Editor: `update public.users set is_admin = true where email = 'you@example.com';` and open `/admin`.
5. Run `supabase/tests/isolation.sql` and confirm every line starts with `ok`.

## AI provider setup
Nothing to configure on the server. Each user opens **AI settings**, picks a provider, pastes a key, and confirms the model. Keys are encrypted (AES-256-GCM) before storage and cannot be read back by the browser.

## Local development
`npm install`, copy `.env.example` to `.env.local` and fill it in, then `npm run dev`.

## Deploying (Vercel)
Import the repo, set the root directory to the app folder if it isn't the repo root, add the environment variables, deploy. Redeploy (without build cache) after changing any `NEXT_PUBLIC_` variable.

## Security
Row-level security on every table; users cannot grant themselves admin; the encrypted AI key column is unreadable from the browser; uploads sit in a private per-user folder; AI replies and uploaded documents are treated as data, never instructions; custom AI endpoints must be public HTTPS addresses; API routes are rate limited (in memory, so best effort on serverless). Admin pages show counts only, and every admin view is written to `audit_log`.

## Testing
`npm test` runs unit tests (endpoint safety, JSON handling, rate limiter, key encryption). `supabase/tests/isolation.sql` proves one user cannot read or change another's data.

## Not built yet
Scanned-PDF reading, cost estimates and usage limits, analytics events, change-password and change-email screens, a UI language setting, underline formatting.
