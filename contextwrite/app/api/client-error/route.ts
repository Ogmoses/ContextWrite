import { NextResponse } from "next/server";
import { limited } from "@/lib/limit";
import { logError } from "@/lib/errors";
// Records only that a screen crashed (never the user's content), so it shows up in the admin error counts.
export async function POST(req: Request) {
  if (limited("cerr:" + (req.headers.get("x-forwarded-for") || "x"), 10)) return NextResponse.json({ ok: true });
  const { path } = await req.json().catch(() => ({}));
  logError("client:" + String(path || "").slice(0, 40), {});
  return NextResponse.json({ ok: true });
}
