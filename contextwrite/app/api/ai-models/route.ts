import { NextResponse } from "next/server";
import { limited } from "@/lib/limit";
import { userClient, admin } from "@/lib/supabase/server";
import { dec } from "@/lib/crypto";
import { listModels } from "@/lib/ai/models";
export async function POST(req: Request) {
  const { data: { user } } = await (await userClient()).auth.getUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  if (limited("models:" + user.id, 15)) return NextResponse.json({ error: "Too many checks. Wait a minute." }, { status: 429 });
  const { provider, key, base_url } = await req.json();
  try {
    let k = typeof key === "string" ? key.trim() : "";
    if (!k) { const { data } = await admin().from("user_ai_settings").select("provider,encrypted_key").eq("user_id", user.id).maybeSingle(); if (data?.provider === provider) k = dec(data.encrypted_key); }
    if (!k) return NextResponse.json({ error: "Paste your API key first." }, { status: 400 });
    return NextResponse.json(await listModels(provider, k, base_url));
  } catch (e: any) {
    console.error("model list failed", e?.status);
    return NextResponse.json({ error: e?.status === 401 || e?.status === 403 || e?.status === 400 ? "That key was rejected. Check you copied all of it." : "Couldn't reach that provider. Check the details and try again." }, { status: 400 });
  }
}
