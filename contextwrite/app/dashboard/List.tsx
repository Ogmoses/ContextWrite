"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { sb } from "@/lib/supabase/browser";
export default function List({ rows }: { rows: any[] }) {
  const [items, setItems] = useState(rows), [q, setQ] = useState(""), [tab, setTab] = useState<"open" | "final">("open"), [msg, setMsg] = useState(""), [fm, setFm] = useState(""), [print, setPrint] = useState("");
  const done = items.filter((r) => r.status === "final"), open = items.filter((r) => r.status !== "final");
  const list = (tab === "final" ? done : open).filter((r) => (r.title + " " + r.type).toLowerCase().includes(q.toLowerCase()));
  const del = async (r: any) => {
    if (!confirm(`Delete "${r.title}" and all its drafts? This can't be undone.`)) return;
    const { error } = await sb().from("projects").delete().eq("id", r.id);
    if (error) return setMsg("Couldn't delete that project. Try again.");
    setItems(items.filter((x) => x.id !== r.id));
  };
  const reopen = async (r: any) => {
    const { error } = await sb().from("projects").update({ status: "draft" }).eq("id", r.id);
    if (error) return setMsg("Couldn't reopen that project.");
    setItems(items.map((x) => (x.id === r.id ? { ...x, status: "draft" } : x))); setMsg(`"${r.title}" is back in progress.`);
  };
  const share = async (r: any) => {
    const { data } = await sb().from("drafts").select("content").eq("project_id", r.id).order("version_number", { ascending: false }).limit(1);
    const text = data?.[0]?.content || ""; if (!text) return setMsg("Nothing to share yet.");
    try { if (navigator.share) await navigator.share({ title: r.title, text }); else { await navigator.clipboard.writeText(text); setMsg("Copied to your clipboard."); } } catch {}
  };
  const getText = async (r: any) => { const { data } = await sb().from("drafts").select("content").eq("project_id", r.id).order("version_number", { ascending: false }).limit(1); return data?.[0]?.content || ""; };
  const nm = (r: any) => (r.title || "Draft").replace(/[\\/:*?"<>|]+/g, "").slice(0, 80);
  const dl = (b: Blob, n: string) => { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = n; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };
  const out = async (r: any, f: string) => {
    if (f === "share") return share(r);
    const t = await getText(r); if (!t) return setMsg("Nothing to export yet.");
    if (f === "txt") dl(new Blob([t], { type: "text/plain" }), nm(r) + ".txt");
    else if (f === "md") dl(new Blob([t], { type: "text/markdown" }), nm(r) + ".md");
    else if (f === "docx") { const x = await fetch("/api/export", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ content: t }) }); if (!x.ok) return setMsg("Couldn't create the Word file."); dl(await x.blob(), nm(r) + ".docx"); }
    else { setPrint(t); setTimeout(() => { const old = document.title; document.title = nm(r); const back = () => { document.title = old; setPrint(""); removeEventListener("afterprint", back); }; addEventListener("afterprint", back); window.print(); }, 150); }
  };
  if (!items.length) return <><h3>Your next idea starts here.</h3><p>Tell us what you're trying to write. You don't need to have it figured out yet.</p><Link href="/write"><button className="primary">Start Writing</button></Link></>;
  return <>
    <div className="row3"><button className={tab === "open" ? "primary" : ""} onClick={() => setTab("open")}>In progress ({open.length})</button><button className={tab === "final" ? "primary" : ""} onClick={() => setTab("final")}>Finished ({done.length})</button></div>
    <input aria-label="Search projects" placeholder="Search projects" value={q} onChange={(e) => setQ(e.target.value)} />
    <p role="status"><small>{msg}</small></p>
    {print && createPortal(<div className="print-only">{print}</div>, document.body)}
    {list.map((r) => <div key={r.id} className="card">
      <b>{r.title}</b><br />
      <small>{r.type} · {r.status === "final" ? "finished" : r.status} · {r.words} words · {r.version ? "v" + r.version : "no draft yet"} · {r.updated}</small><br />
      {fm === r.id && <div className="row3">{[["pdf", "PDF"], ["docx", "Word"], ["md", "Markdown"], ["txt", "TXT"], ["share", "Share…"]].map(([f, l]) => <button key={f} className="sm" onClick={() => out(r, f)}>{l}</button>)}</div>}
      {tab === "final"
        ? <><Link href={`/write?id=${r.id}`}><button className="primary">Open</button></Link><button onClick={() => reopen(r)}>Reopen</button><button onClick={() => setFm(fm === r.id ? "" : r.id)} aria-expanded={fm === r.id}>Share / export</button><button onClick={() => del(r)} aria-label={`Delete ${r.title}`}>Delete</button></>
        : <><Link href={`/write?id=${r.id}`}><button className="primary">Continue</button></Link><button onClick={() => del(r)} aria-label={`Delete ${r.title}`}>Delete</button></>}
    </div>)}
    {!list.length && <p>{q ? `No projects match "${q}".` : tab === "final" ? "Nothing finished yet. Open a draft and tap Finish when you're done." : "No projects in progress."}</p>}
  </>;
}
