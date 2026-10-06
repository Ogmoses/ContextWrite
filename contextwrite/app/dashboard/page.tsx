import Link from "next/link";
import { redirect } from "next/navigation";
import { userClient } from "@/lib/supabase/server";
import Icon from "@/components/Icon";
import List from "./List";
import Onboarding from "./Onboarding";
import Feedback from "@/components/Feedback";
const T = ["Essay", "Cover letter", "Speech", "Professional email", "Personal statement", "Apology letter", "Complaint letter", "Blog post"];
export default async function Dash() {
  const sb = await userClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const [{ data }, { data: me }] = await Promise.all([
    sb.from("projects").select("id,title,writing_type,status,updated_at,drafts(version_number,content)").order("updated_at", { ascending: false }).order("version_number", { referencedTable: "drafts", ascending: false }).limit(1, { referencedTable: "drafts" }),
    sb.from("users").select("name").eq("id", user.id).maybeSingle(),
  ]);
  const rows = (data || []).map((p: any) => {
    const d = [...(p.drafts || [])].sort((a: any, b: any) => b.version_number - a.version_number)[0], t = d?.content?.trim();
    return { id: p.id, title: p.title, type: p.writing_type || "—", status: p.status, updated: String(p.updated_at).slice(0, 10), version: d?.version_number || 0, words: t ? t.split(/\s+/).length : 0 };
  });
  const name = (me?.name || user.email || "there").split(/[ @]/)[0], words = rows.reduce((a, r) => a + r.words, 0), open = rows.filter((r) => r.status !== "final").length;
  return <>
    <div className="hello"><span className="av">{name[0]?.toUpperCase()}</span><div><b>Welcome back, {name}</b><small>{open} project{open === 1 ? "" : "s"} in progress</small></div></div>
    <Onboarding />
    <div className="hero" data-coach="start"><h2>What are you trying to write?</h2><Link href="/write"><button>Start writing</button></Link></div>
    <h3 style={{ marginTop: 8 }}>Templates</h3>
    <div className="chips">{T.map((t) => <Link key={t} href={`/write?t=${encodeURIComponent(t)}`}>{t}</Link>)}</div>
    <h3>Your writing</h3>
    <div className="tiles">
      <div className="t"><small><Icon n="folder" size={16} />Projects</small><b>{rows.length}</b></div>
      <div className="t"><small><Icon n="pen" size={16} />Words written</small><b>{words.toLocaleString("en-GB")}</b></div>
    </div>
    <section className="sec c3"><h3>Your projects</h3>
    <List rows={rows} /></section>
  </>;
}
