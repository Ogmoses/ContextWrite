"use client";
import { useState } from "react";
import { sb } from "@/lib/supabase/browser";
type V = { id: string; version_number: number; name: string | null; content: string; created_at: string };
function diff(a: string, b: string) {
  const x = a.split(/(\s+)/), y = b.split(/(\s+)/);
  if (x.length * y.length > 9e6) return null;
  const n = x.length, m = y.length, L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = x[i] === y[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out: [string, string][] = []; let i = 0, j = 0;
  while (i < n && j < m) { if (x[i] === y[j]) { out.push(["=", x[i]]); i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) out.push(["-", x[i++]]); else out.push(["+", y[j++]]); }
  while (i < n) out.push(["-", x[i++]]);
  while (j < m) out.push(["+", y[j++]]);
  return out;
}
export default function Versions({ projectId, current, onRestore }: { projectId: string; current: string; onRestore: (t: string) => void }) {
  const [open, setOpen] = useState(false), [vs, setVs] = useState<V[]>([]), [sel, setSel] = useState<string[]>([]), [msg, setMsg] = useState(""), [busy, setBusy] = useState(false);
  const load = async () => { const { data } = await sb().from("drafts").select("id,version_number,name,content,created_at").eq("project_id", projectId).order("version_number", { ascending: false }); setVs((data as V[]) || []); return (data as V[]) || []; };
  const add = async (content: string, name: string) => {
    const c = sb(); const { data: l } = await c.from("drafts").select("version_number").eq("project_id", projectId).order("version_number", { ascending: false }).limit(1);
    const { error } = await c.from("drafts").insert({ project_id: projectId, version_number: (l?.[0]?.version_number || 0) + 1, name, content }); if (error) throw error;
  };
  const run = async (fn: () => Promise<void>) => { setBusy(true); setMsg(""); try { await fn(); } catch { setMsg("Couldn't save. Your text is still in the editor. Try again."); } setBusy(false); };
  const toggle = async () => { if (!open) await load(); setOpen(!open); };
  const saveNow = () => run(async () => { const l = await load(); if (l[0]?.content === current) return setMsg("This text is already saved as v" + l[0].version_number + "."); await add(current, "Manual edit"); await load(); setMsg("Saved as a new version."); });
  const restore = (v: V) => run(async () => {
    if (!confirm(`Restore v${v.version_number}? Nothing is overwritten: it becomes a new version, and your current text is kept as one first if it has unsaved edits.`)) return;
    const l = await load(); if (l[0] && l[0].content !== current) await add(current, "Edits before restoring v" + v.version_number);
    await add(v.content, "Restored from v" + v.version_number); onRestore(v.content); await load(); setMsg("Restored.");
  });
  const rename = (v: V) => run(async () => { const n = prompt("Name this version", v.name || ""); if (n === null) return; await sb().from("drafts").update({ name: n.slice(0, 60) }).eq("id", v.id); await load(); });
  const pick = (id: string) => setSel(sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id].slice(-2));
  const pair = sel.map((id) => vs.find((v) => v.id === id)!).filter(Boolean).sort((a, b) => a.version_number - b.version_number);
  const d = pair.length === 2 ? diff(pair[0].content, pair[1].content) : null;
  return <div style={{ marginTop: 16 }}>
    <button onClick={toggle} aria-expanded={open}>{open ? "Hide versions" : "Versions"}</button> <button disabled={busy} onClick={saveNow}>Save as new version</button>
    <p role="status"><small>{msg}</small></p>
    {open && <div className="card">
      {!vs.length && <p>No saved versions yet.</p>}
      {vs.map((v) => <div key={v.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
        <label><input type="checkbox" checked={sel.includes(v.id)} onChange={() => pick(v.id)} /> <b>v{v.version_number}</b> {v.name || "Draft"}</label><br />
        <small>{new Date(v.created_at).toLocaleString()} · {v.content.trim().split(/\s+/).length} words</small><br />
        <button disabled={busy} onClick={() => rename(v)}>Rename</button> <button disabled={busy} onClick={() => restore(v)}>Restore</button>
      </div>)}
      {vs.length > 1 && sel.length < 2 && <p><small>Tick two versions to compare them.</small></p>}
      {pair.length === 2 && <>
        <h3>v{pair[0].version_number} → v{pair[1].version_number}</h3>
        {d ? <p style={{ whiteSpace: "pre-wrap", maxWidth: "none" }}>{d.map(([t, s], i) => t === "=" ? s : <span key={i} className={t === "+" ? "ins" : "del"}>{s}</span>)}</p> : <p>These versions are too long to compare here.</p>}
        <small><span className="ins">Added</span> · <span className="del">Removed</span></small>
      </>}
    </div>}
  </div>;
}
