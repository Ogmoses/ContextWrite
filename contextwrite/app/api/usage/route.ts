import { NextResponse } from "next/server";
import { userClient } from "@/lib/supabase/server";
import { usageFor } from "@/lib/limits";
export async function GET() {
  const { data: { user } } = await (await userClient()).auth.getUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  return NextResponse.json(await usageFor(user.id));
}
