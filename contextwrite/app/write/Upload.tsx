"use client";
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase/browser";
export default function Upload({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const [docs, setDocs] = useState<any[]>([]), [msg, setMsg] = useState(""), [busy, setBusy] = useState(false);
  const load = async () => { const { data } = await sb().from("documents").select("id,filename,storage_path,metadata").eq("project_id", projectId).order("created_at"); setDocs(data || []); };
  useEffect(() => { load(); }, [projectId]);
  const pick = async (e: any) => {
    const f = e.target.files?.[0]; e.target.value = ""; if (!f) return;
    if (f.size > 4 * 1024 * 1024) return setMsg("Files must be under 4 MB.");
    setBusy(true); setMsg("Reading the document…");
    const fd = new FormData(); fd.append("file", f); fd.append("projectId", projectId);
    const r = await fetch("/api/upload", { method: "POST", body: fd }); const d = await r.json().catch(() => ({}));
    setBusy(false); if (!r.ok) return setMsg(d.error || "Upload failed. Try again.");
    setMsg(""); await load(); onDone();
  };
  const del = async (d: any) => { if (!confirm(`Remove ${d.filename}?`)) return; await sb().storage.from("documents").remove([d.storage_path]); await sb().from("documents").delete().eq("id", d.id); await load(); onDone(); };
  return <details className="card">
    <summary style={{ cursor: "pointer", minHeight: 36, fontWeight: 600 }}>Documents <small>({docs.length} added · assignment, email to reply to, notes)</small></summary>
    {docs.map((d) => { const a = d.metadata?.analysis || {}; return <div key={d.id} style={{ borderTop: "1px solid var(--line)", marginTop: 10, paddingTop: 8 }}>
      <b>{d.filename}</b> <small>· {a.kind}</small><p style={{ margin: "4px 0" }}>{a.summary}</p>
      {!!a.requirements?.length && <><small>What I found:</small><ul>{a.requirements.map((r: string, i: number) => <li key={i}>{r}</li>)}</ul></>}
      {!!a.sources?.length && <><small>Sources:</small><ul>{a.sources.map((x: any, i: number) => <li key={i}><a href={x.url} target="_blank" rel="noopener noreferrer">{x.title}</a></li>)}</ul></>}
      {!!a.caveats?.length && <><small>Worth double-checking:</small><ul>{a.caveats.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul></>}
      {!!a.unreadable?.length && <><small>Couldn't read confidently (please check the original):</small><ul>{a.unreadable.map((r: string, i: number) => <li key={i}>{r}</li>)}</ul></>}
      {a.word_count && a.word_count !== "unclear" && <small>Length: {a.word_count} </small>}{a.deadline && a.deadline !== "unclear" && <small>Deadline: {a.deadline}</small>}
      <br /><button onClick={() => del(d)}>Remove</button></div>; })}
    <p><label className="ui"><input type="file" accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.webp" onChange={pick} disabled={busy} style={{ display: "block", width: "100%" }} aria-label="Add a document" /></label></p>
    <small role="status">{msg || "PDF, DOCX, TXT, Markdown or images (PNG, JPG, WEBP), up to 4 MB. Images need a vision model in AI settings. Read carefully: tell me if anything extracted looks wrong."}</small>
  </details>;
}
