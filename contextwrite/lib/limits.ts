import { admin } from "@/lib/supabase/server";
// Monthly AI-request allowance. A per-user override wins over the global default; 0 means unlimited.
export async function usageFor(userId: string) {
  const a = admin(), start = new Date(); start.setUTCDate(1); start.setUTCHours(0, 0, 0, 0);
  const [{ data: u }, { data: c }, { count }] = await Promise.all([
    a.from("users").select("monthly_limit,is_admin").eq("id", userId).maybeSingle(),
    a.from("app_config").select("value").eq("key", "monthly_request_limit").maybeSingle(),
    a.from("ai_usage").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", start.toISOString()),
  ]);
  const limit = u?.is_admin ? 0 : Number(u?.monthly_limit ?? c?.value ?? 0) || 0;
  return { used: count || 0, limit };
}
