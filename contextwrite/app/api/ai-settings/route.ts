import { NextResponse } from "next/server";
import { limited } from "@/lib/limit";
import { userClient, admin } from "@/lib/supabase/server";
import { enc } from "@/lib/crypto";
import { safeBase } from "@/lib/ai";
const P = ["anthropic", "openai", "gemini", "openai_compatible"];
export async function POST(req: Request) {
  const { data: { user } } = await (await userClient()).auth.getUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  if (limited("aiset:" + user.id, 10)) return NextResponse.json({ error: "Too many requests. Wait a minute and try again." }, { status: 429 });
  const sec = process.env.KEY_ENCRYPTION_SECRET;
  if (!sec || Buffer.from(sec, "base64").length !== 32) return NextResponse.json({ error: "Server setup problem: KEY_ENCRYPTION_SECRET is missing or invalid in Vercel. Generate one with: openssl rand -base64 32" }, { status: 500 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: "Server setup problem: SUPABASE_SERVICE_ROLE_KEY is missing in Vercel." }, { status: 500 });
  const b = await req.json(), a = admin();
  try {
    if (!P.includes(b.provider) || !b.model_strong || !b.model_fast) throw new Error();
    const models = { model_fast: b.model_fast, model_strong: b.model_strong, model_vision: b.model_vision || b.model_strong };
    if (b.key) {
      const base_url = b.provider === "openai_compatible" ? safeBase(b.base_url) : null;
      const { error } = await a.from("user_ai_settings").upsert({ user_id: user.id, provider: b.provider, base_url, ...models, encrypted_key: enc(String(b.key).trim()), key_hint: "…" + String(b.key).trim().slice(-4) }, { onConflict: "user_id" });
      if (error) throw error;
    } else {
      const { data: ex } = await a.from("user_ai_settings").select("provider").eq("user_id", user.id).maybeSingle();
      if (!ex || ex.provider !== b.provider) throw new Error();
      const { error } = await a.from("user_ai_settings").update(models).eq("user_id", user.id);
      if (error) throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("ai-settings save failed", e?.code, e?.message);
    const m = String(e?.message || "");
    const error = e?.code === "23503" ? "Your account has no profile in this database. This usually means the site is connected to a different Supabase project than the one you signed up in. Check the three Supabase variables in Vercel all belong to the same project, redeploy, then sign up again."
      : /jwt|api key|apikey|invalid/i.test(m) ? "Server setup problem: SUPABASE_SERVICE_ROLE_KEY doesn't belong to the same Supabase project as NEXT_PUBLIC_SUPABASE_URL. Fix it in Vercel and redeploy."
      : "Couldn't save. Check the provider, key and model.";
    return NextResponse.json({ error }, { status: 400 });
  }
}
