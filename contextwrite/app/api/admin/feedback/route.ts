import { NextResponse } from "next/server";
import { userClient, admin } from "@/lib/supabase/server";
export async function PATCH(req: Request) {
  const sb = await userClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { data: me } = await sb.from("users").select("is_admin").eq("id", user.id).maybeSingle();
  if (!me?.is_admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { id, status } = await req.json();
  if (typeof id !== "string" || !["new", "done"].includes(status)) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const a = admin(); await a.from("feedback").update({ status }).eq("id", id);
  await a.from("audit_log").insert({ actor_id: user.id, action: "feedback_" + status, target: id });
  return NextResponse.json({ ok: true });
}
