import { admin } from "@/lib/supabase/server";
// Privacy-safe analytics: only these short labels are ever stored, never writing or file contents.
const KEYS = ["type", "mode", "format", "kind", "seconds"];
export function cleanProps(p: any) {
  const o: Record<string, string | number> = {};
  for (const k of KEYS) { const v = p?.[k]; if (typeof v === "string") o[k] = v.slice(0, 40); else if (typeof v === "number" && isFinite(v)) o[k] = Math.round(v); }
  return o;
}
export function track(userId: string, name: string, props: any = {}) {
  admin().from("events").insert({ user_id: userId, name, props: cleanProps(props) }).then(() => {}, () => {});
}
