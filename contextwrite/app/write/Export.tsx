"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { sb } from "@/lib/supabase/browser";
const clean = (t: string) => t.replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, " ").trim().slice(0, 80);
function save(blob: Blob, name: string) { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
export default function Export({ content, projectId }: { content: string; projectId: string | null }) {
  const [name, setName] = useState(""), [edited, setEdited] = useState(false), [msg, setMsg] = useState(""), [busy, setBusy] = useState(false), [mounted, setMounted] = useState(false), [sug, setSug] = useState(false);
  const ready = content.trim().length >= 80, base = clean(name) || "Draft";
  useEffect(() => setMounted(true), []);
  const suggest = async () => {
    if (!ready) return; setSug(true);
    try { const r = await fetch("/api/title", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ content }) }); const d = await r.json(); if (r.ok && d.title) { setName(clean(d.title)); setEdited(false); } } catch {}
    setSug(false);
  };
  useEffect(() => { if (ready && !edited && !name) suggest(); }, [ready, edited, name]);
  const rename = async () => { const n = clean(name); setName(n); if (projectId && n) await sb().from("projects").update({ title: n }).eq("id", projectId); };
  const docx = async () => {
    setBusy(true); setMsg("");
    try { const r = await fetch("/api/export", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ content }) }); if (!r.ok) throw new Error((await r.json()).error); save(await r.blob(), base + ".docx"); }
    catch (e: any) { setMsg(e?.message || "Export failed. Try again."); }
    setBusy(false);
  };
  const share = async () => { try { if (navigator.share) await navigator.share({ title: base, text: content }); else { await navigator.clipboard.writeText(content); setMsg("Copied, ready to paste anywhere."); } } catch {} };
  const print = () => { const t = document.title; document.title = base; const back = () => { document.title = t; window.removeEventListener("afterprint", back); }; window.addEventListener("afterprint", back); window.print(); };
  return <div className="card">
    <label>File name <small>{sug ? "Suggesting a name…" : "suggested from your draft, edit freely"}</small>
      <input type="text" value={name} placeholder="Draft" maxLength={80} onChange={(e) => { setName(e.target.value); setEdited(true); }} onBlur={rename} /></label>
    <button onClick={() => save(new Blob([content], { type: "text/plain" }), base + ".txt")}>Download TXT</button>
    <button onClick={() => save(new Blob([content], { type: "text/markdown" }), base + ".md")}>Markdown</button>
    <button disabled={busy} onClick={docx}>{busy ? "Preparing…" : "Word (.docx)"}</button>
    <button onClick={share}>Share</button>
    <button onClick={print}>PDF / Print</button>
    <p role="status"><small>{msg || "PDF: choose “Save as PDF” in the print dialog. The file name above is used."}</small></p>
    {mounted && createPortal(<div className="print-only">{content}</div>, document.body)}
  </div>;
}
