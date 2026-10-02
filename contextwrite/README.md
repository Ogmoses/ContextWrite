# ContextWrite
1. Unzip, `npm install`
2. `cp .env.example .env.local`, add SUPABASE_SERVICE_ROLE_KEY and `openssl rand -base64 32` as KEY_ENCRYPTION_SECRET
3. `npm run dev` -> /login, then /settings (your AI provider), then /write
4. Vercel: import the repo, add the same 4 env vars (Settings > Environment Variables).
Supabase Auth > URL Configuration: add your Vercel URL as Site URL and a redirect URL.
Not included yet: dashboard/project list, uploads, voice profiles, version UI, export, admin, tests.
