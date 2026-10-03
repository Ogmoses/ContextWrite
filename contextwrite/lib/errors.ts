import { admin } from "@/lib/supabase/server";
// Privacy-safe: stores only the route and a coarse kind, never messages or user content.
export function logError(route: string, e: any) {
  const kind = e?.code === "NO_AI" ? "no_ai" : e?.code === "NO_VISION" ? "no_vision" : e?.message === "provider" ? "provider" : "other";
  admin().from("app_errors").insert({ route, kind }).then(() => {}, () => {});
}
