import { redirect } from "next/navigation";
import Link from "next/link";
import { userClient, admin } from "@/lib/supabase/server";
import AdminFeedback from "./AdminFeedback";
import AdminLimit from "./AdminLimit";
export const dynamic = "force-dynamic";
const n = (x: any) => Number(x || 0).toLocaleString("en-GB");
const Obj = ({ o }: { o: Record<string, number> }) => { const e = Object.entries(o || {}).sort((a, b) => b[1] - a[1]); return e.length ? <ul>{e.map(([k, v]) => <li key={k}>{k}: <b>{n(v)}</b></li>)}</ul> : <p><small>None yet.</small></p>; };
export default async function Admin() {
  const sb = await userClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await sb.from("users").select("is_admin").eq("id", user.id).maybeSingle();
  if (!me?.is_admin) redirect("/dashboard");
  const a = admin(), t0 = Date.now();
  const { data: s, error } = await a.rpc("admin_stats");
  const ms = Date.now() - t0;
  await a.from("audit_log").insert({ actor_id: user.id, action: "admin_view_stats", target: "admin_stats" });
  const { data: log } = await a.from("audit_log").select("action,created_at").order("created_at", { ascending: false }).limit(8);
  const { data: fb } = await a.from("feedback").select("id,kind,message,ok_to_publish,status,created_at,users(email,name)").order("created_at", { ascending: false }).limit(60);
  const { data: ev } = await a.rpc("admin_events");
  const { data: cfg } = await a.from("app_config").select("value").eq("key", "monthly_request_limit").maybeSingle();
  if (error || !s) return <><h1>Admin</h1><p role="alert">Couldn't load stats. Check that the admin_stats function exists in your database.</p></>;
  const max = Math.max(1, ...(s.daily || []).map((d: any) => d.ai));
  const rate = s.ai_7d ? ((s.errors_7d / s.ai_7d) * 100).toFixed(1) : "0.0";
  return <>
    <p><Link href="/dashboard">← Dashboard</Link></p>
    <h1>Admin</h1>
    <p><small>No writing content is shown here. Each time this page is opened, it's recorded in the audit log.</small></p>
    <div className="card"><b>System health</b><ul>
      <li>Database: {ms < 2000 ? "reachable" : "slow"} ({ms} ms)</li>
      <li>Errors in the last 7 days: <b>{n(s.errors_7d)}</b> ({rate}% of AI requests)</li>
      <li>Missing-AI-setup events (not system faults): {n(s.config_issues_7d)}</li></ul></div>
    <h2>Usage</h2>
    <div className="card"><ul>
      <li>Users: <b>{n(s.users_total)}</b> ({n(s.users_7d)} new this week, {n(s.active_users_7d)} active)</li>
      <li>Projects: <b>{n(s.projects_total)}</b> ({n(s.projects_7d)} new this week)</li>
      <li>Drafts and versions: <b>{n(s.drafts_total)}</b></li>
      <li>Voice profiles: <b>{n(s.voice_profiles_total)}</b></li>
      <li>Uploaded documents: <b>{n(s.documents_total)}</b> · storage <b>{(s.storage_bytes / 1048576).toFixed(1)} MB</b></li>
      <li>AI requests: <b>{n(s.ai_total)}</b> total, {n(s.ai_7d)} this week</li></ul></div>
    <h2>AI requests, last 14 days</h2>
    <div className="card">{(s.daily || []).map((d: any) => <div key={d.d} style={{ display: "flex", alignItems: "center", gap: 8, font: "13px var(--sans),sans-serif" }}>
      <span style={{ width: 52 }}>{String(d.d).slice(5)}</span><span style={{ height: 8, background: "var(--accent)", width: `${(d.ai / max) * 70}%`, minWidth: d.ai ? 2 : 0 }} /><span>{d.ai}</span></div>)}</div>
    <h2>Breakdown (30 days)</h2>
    <div className="card"><b>By request type</b><Obj o={s.ai_by_type} /><b>By model</b><Obj o={s.ai_by_model} /><b>Connected providers</b><Obj o={s.providers} /></div>
    {!!Object.keys(s.errors_by_route || {}).length && <><h2>Errors by route (7 days)</h2><div className="card"><Obj o={s.errors_by_route} /></div></>}
    <h2>Product analytics (30 days)</h2>
    <div className="card"><b>Actions</b><Obj o={ev?.by_name || {}} /><b>Writing types started</b><Obj o={ev?.writing_types || {}} />
      <p style={{ margin: "8px 0 0" }}>Visits: <b>{n(ev?.sessions_30d)}</b> · average length <b>{Math.floor((ev?.avg_session_seconds || 0) / 60)} min {(ev?.avg_session_seconds || 0) % 60} s</b></p>
      <small>Counts and short labels only. Never writing or file contents. Events are deleted with the account.</small></div>
    <h2>Usage limit</h2>
    <AdminLimit current={Number(cfg?.value ?? 0) || 0} />
    <h2>Feedback ({(fb || []).filter((x: any) => x.status === "new").length} new)</h2>
    <AdminFeedback items={(fb as any[]) || []} />
    <h2>Audit log</h2>
    <div className="card"><ul>{(log || []).map((l: any, i: number) => <li key={i}>{l.action} <small>· {String(l.created_at).slice(0, 16).replace("T", " ")}</small></li>)}</ul></div>
    <p><small>Token counts and costs aren't tracked yet, only request counts.</small></p>
  </>;
}
