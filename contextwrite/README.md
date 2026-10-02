# ContextWrite
1. Unzip, `npm install`
2. `cp .env.example .env.local`, add SUPABASE_SERVICE_ROLE_KEY and `openssl rand -base64 32` as KEY_ENCRYPTION_SECRET
3. `npm run dev` -> /login, then /settings (your AI provider), then /write
4. Vercel: import the repo, add the same 4 env vars (Settings > Environment Variables).
Supabase Auth > URL Configuration: add your Vercel URL as Site URL and a redirect URL.
Account page: export all data, delete account (cascades + clears storage).
Images: set an optional vision model in /settings (screenshots, letters, handwriting). Scanned PDFs still unsupported.
Security: per-route rate limits (in-memory), input caps, security headers, usage logged to ai_usage (model + request type; tokens/cost not tracked).
Tests: `npm test` (SSRF guard, JSON parsing, rate limiter, key encryption). Onboarding tour on first dashboard visit.
Not included yet: dashboard/project list, uploads, voice profiles, admin, tests.
