import { NextResponse } from "next/server";
import { userClient, admin } from "@/lib/supabase/server";
export async function PATCH(req: Request) {
  const sb = await userClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { data: me } = await sb.from("users").select("is_admin").eq("id", user.id).maybeSingle();
  if (!me?.is_admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const n = Math.floor(Number((await req.json()).limit));
  if (!Number.isFinite(n) || n < 0 || n > 1000000) return NextResponse.json({ error: "Enter a whole number from 0 to 1,000,000." }, { status: 400 });
  const a = admin();
  await a.from("app_config").upsert({ key: "monthly_request_limit", value: n, updated_at: new Date().toISOString() }, { onConflict: "key" });
  await a.from("audit_log").insert({ actor_id: user.id, action: "set_monthly_limit", target: String(n) });
  return NextResponse.json({ ok: true });
}
