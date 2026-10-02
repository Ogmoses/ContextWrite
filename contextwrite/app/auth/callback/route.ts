import { NextResponse } from "next/server";
import { userClient } from "@/lib/supabase/server";
// Email verification and password-reset links land here with a one-time code.
export async function GET(req: Request) {
  const url = new URL(req.url), code = url.searchParams.get("code"), next = url.searchParams.get("next") || "/dashboard";
  const dest = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  if (code) {
    const { error } = await (await userClient()).auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(dest, url.origin));
  }
  return NextResponse.redirect(new URL("/login?mode=expired", url.origin));
}
