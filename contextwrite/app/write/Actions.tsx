"use client";
import { useState } from "react";
import { sb } from "@/lib/supabase/browser";
const A: [string, string, boolean][] = [
  ["Improve", "Improve clarity and flow without changing the meaning.", true],
  ["Shorten", "Shorten by about a third, keeping the key points.", true],
  ["Expand", "Expand using only the supplied context; use [placeholders] for any missing details.", true],
  ["Simplify", "Simplify the wording and sentence structure.", true],
  ["More formal", "Make this more formal.", true],
  ["More conversational", "Make this more conversational, in the user's natural voice.", true],
  ["Strengthen argument", "Strengthen the argument using only the reasons and evidence in the context.", true],
  ["Clarify", "Make unclear parts clearer without adding facts.", true],
  ["Rewrite", "Rewrite this differently, keeping the meaning and facts.", true],
  ["Change opening", "Rewrite only the opening paragraph with a different approach; keep everything else identical.", false],
  ["Change ending", "Rewrite only the closing paragraph with a different approach; keep everything else identical.", false],
  ["Continue writing", "Continue the piece from where it ends, using only the supplied context.", false],
];
export default function Actions({ projectId, draft, range, onClear, setDraft, opts, onFull }: { projectId: string; draft: string; range: [number, number]; onClear: () => void; setDraft: (t: string) => void; opts: any; onFull: (i: string, useSel?: boolean) => void }) {
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState(""), [prev, setPrev] = useState<string | null>(null), [why, setWhy] = useState("");
  const s = Math.min(range[0], draft.length), e = Math.min(range[1], draft.length), has = e > s, n = has ? draft.slice(s, e).trim().split(/\s+/).length : 0;
  const call = async (mode: string, instruction: string) => {
    const r = await fetch("/api/draft", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ projectId, mode, instruction, selection: has ? draft.slice(s, e) : draft, current: draft, ...opts }) });
    const d = await r.json(); if (!r.ok) throw new Error(d.error); return d.content as string;
  };
  const saveVer = async (text: string, name: string) => { try { const c = sb(); const { data: l } = await c.from("drafts").select("version_number").eq("project_id", projectId).order("version_number", { ascending: false }).limit(1); await c.from("drafts").insert({ project_id: projectId, version_number: (l?.[0]?.version_number || 0) + 1, name, content: text }); } catch {} };
  const act = async ([lab, ins, selOk]: [string, string, boolean]) => {
    if (!(selOk && has)) return onFull(ins, false);
    setBusy(true); setMsg(""); setWhy("");
    try { const t = await call("passage", ins); setPrev(draft); const nt = draft.slice(0, s) + t + draft.slice(e); setDraft(nt); onClear(); await saveVer(nt, lab); } catch (x: any) { setMsg(x.message || "Something went wrong. Your draft is unchanged."); }
    setBusy(false);
  };
  const explain = async () => { setBusy(true); setMsg(""); try { setWhy(await call("explain", "Explain this section")); } catch (x: any) { setMsg(x.message || "Something went wrong."); } setBusy(false); };
  return <div className="card">
    {has ? <p style={{ margin: "0 0 4px" }}><small>Applies only to your selection ({n} words):</small><br /><i>“{draft.slice(s, e).trim().slice(0, 80)}{e - s > 80 ? "…" : ""}”</i> <button onClick={onClear}>Clear selection</button></p> : <small>Applies to the whole draft. To change just a passage, highlight it in the editor first.</small>}
    <div style={{ marginTop: 8 }}>
      {A.map((a) => <button key={a[0]} disabled={busy} onClick={() => act(a)}>{a[0]}</button>)}
      <button disabled={busy} onClick={explain}>Explain this section</button>
      {prev !== null && <button onClick={() => { setDraft(prev); setPrev(null); }}>Undo last edit</button>}
    </div>
    {busy && <small role="status">Working on it…</small>}
    {msg && <p role="alert">{msg}</p>}
    {why && <div className="card"><p>{why}</p><button onClick={() => setWhy("")}>Close</button></div>}
  </div>;
}
