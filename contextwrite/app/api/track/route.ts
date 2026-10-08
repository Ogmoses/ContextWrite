import { NextResponse } from "next/server";
import { limited } from "@/lib/limit";
import { userClient } from "@/lib/supabase/server";
import { track } from "@/lib/track";
const ALLOWED = ["session", "project_finished"];
export async function POST(req: Request) {
  const { data: { user } } = await (await userClient()).auth.getUser();
  if (!user) return NextResponse.json({ ok: true });
  if (limited("track:" + user.id, 30)) return NextResponse.json({ ok: true });
  const b = await req.json().catch(() => ({}));
  if (ALLOWED.includes(b?.name)) track(user.id, b.name, b.props);
  return NextResponse.json({ ok: true });
}
