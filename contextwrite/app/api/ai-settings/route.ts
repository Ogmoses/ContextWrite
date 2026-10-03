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
  } catch { return NextResponse.json({ error: "Couldn't save. Check the provider, key and model." }, { status: 400 }); }
}
