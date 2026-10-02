import Link from "next/link";
import { redirect } from "next/navigation";
import { userClient } from "@/lib/supabase/server";
import List from "./List";
const T = ["Essay", "Apology letter", "Cover letter", "Speech", "Professional email", "Personal statement", "Complaint letter", "Blog post"];
export default async function Dash() {
  const sb = await userClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await sb.from("projects").select("id,title,writing_type,status,updated_at,drafts(version_number,content)").order("updated_at", { ascending: false });
  const rows = (data || []).map((p: any) => {
    const d = [...(p.drafts || [])].sort((a: any, b: any) => b.version_number - a.version_number)[0];
    const t = d?.content?.trim();
    return { id: p.id, title: p.title, type: p.writing_type || "—", status: p.status, updated: String(p.updated_at).slice(0, 10), version: d?.version_number || 0, words: t ? t.split(/\s+/).length : 0 };
  });
  return <>
    <h1>Your writing</h1>
    <p><Link href="/write"><button className="primary">Start something new</button></Link> <Link href="/voice">Your voice</Link> · <Link href="/settings">AI settings</Link></p>
    <h2>Templates</h2>
    <p>{T.map((t) => <Link key={t} href={`/write?t=${encodeURIComponent(t)}`} style={{ marginRight: 12, display: "inline-block" }}>{t}</Link>)}</p>
    <h2>Recent projects</h2>
    <List rows={rows} />
  </>;
}
