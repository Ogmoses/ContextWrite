import { NextResponse } from "next/server";
import { userClient, admin } from "@/lib/supabase/server";
import { enc } from "@/lib/crypto";
import { safeBase } from "@/lib/ai";
const P = ["anthropic", "openai", "gemini", "openai_compatible"];
export async function POST(req: Request) {
  const { data: { user } } = await (await userClient()).auth.getUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  const b = await req.json();
  try {
    if (!P.includes(b.provider) || !b.model_fast || !b.model_strong || !b.key || b.key.length < 8) throw new Error();
    const base_url = b.provider === "openai_compatible" ? safeBase(b.base_url) : null;
    const { error } = await admin().from("user_ai_settings").upsert({ user_id: user.id, provider: b.provider, base_url, model_fast: b.model_fast, model_strong: b.model_strong, encrypted_key: enc(b.key), key_hint: "…" + b.key.slice(-4) }, { onConflict: "user_id" });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Check your provider, models, key and URL." }, { status: 400 }); }
}
