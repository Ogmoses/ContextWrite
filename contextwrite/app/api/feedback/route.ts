import { NextResponse } from "next/server";
import { track } from "@/lib/track";
import { limited } from "@/lib/limit";
import { userClient } from "@/lib/supabase/server";
export async function POST(req: Request) {
  const sb = await userClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  if (limited("feedback:" + user.id, 5)) return NextResponse.json({ error: "Too many messages. Wait a minute." }, { status: 429 });
  const { kind, message, ok } = await req.json();
  const m = String(message || "").trim();
  if (!["testimonial", "suggestion", "problem"].includes(kind) || m.length < 5 || m.length > 2000) return NextResponse.json({ error: "Write a few words (up to 2,000 characters)." }, { status: 400 });
  const { error } = await sb.from("feedback").insert({ user_id: user.id, kind, message: m, ok_to_publish: kind === "testimonial" && !!ok });
  if (error) { console.error(error); return NextResponse.json({ error: "Couldn't send that. Try again." }, { status: 500 }); }
  track(user.id, "feedback_sent", { kind });
  return NextResponse.json({ ok: true });
}
