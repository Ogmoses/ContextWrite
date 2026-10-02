"use client";
import { useState } from "react";
const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "contextwrite-draft";
function save(blob: Blob, name: string) { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
export default function Export({ title, content }: { title: string; content: string }) {
  const [msg, setMsg] = useState(""), [busy, setBusy] = useState(false), n = slug(title);
  const docx = async () => {
    setBusy(true); setMsg("");
    try { const r = await fetch("/api/export", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ content }) }); if (!r.ok) throw new Error((await r.json()).error); save(await r.blob(), n + ".docx"); }
    catch (e: any) { setMsg(e?.message || "Export failed. Try again."); }
    setBusy(false);
  };
  return <div style={{ marginTop: 12 }}>
    <button onClick={() => save(new Blob([content], { type: "text/plain" }), n + ".txt")}>Download TXT</button>
    <button onClick={() => save(new Blob([content], { type: "text/markdown" }), n + ".md")}>Markdown</button>
    <button disabled={busy} onClick={docx}>{busy ? "Preparing…" : "Word (.docx)"}</button>
    <button onClick={() => window.print()}>PDF / Print</button>
    <p role="status"><small>{msg || "PDF: choose “Save as PDF” in the print dialog."}</small></p>
  </div>;
}
