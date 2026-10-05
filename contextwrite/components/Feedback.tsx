"use client";
import { useState } from "react";
const K: [string, string][] = [["testimonial", "Testimonial"], ["suggestion", "Suggestion"], ["problem", "Problem"]];
export default function Feedback({ onDone }: { onDone?: () => void }) {
  const [kind, setKind] = useState("suggestion"), [msg, setMsg] = useState(""), [ok, setOk] = useState(false), [note, setNote] = useState(""), [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true); setNote("");
    try { const r = await fetch("/api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, message: msg, ok }) }); const d = await r.json(); if (!r.ok) setNote(d.error); else { setNote("Thank you. This goes straight to the team."); setMsg(""); setOk(false); onDone?.(); } } catch { setNote("Couldn't send that. Try again."); }
    setBusy(false);
  };
  return <div>
    <div>{K.map(([k, l]) => <button key={k} className={"sm" + (kind === k ? " primary" : "")} aria-pressed={kind === k} onClick={() => setKind(k)}>{l}</button>)}</div>
    <textarea aria-label="Your feedback" placeholder={kind === "problem" ? "What went wrong? What were you doing?" : kind === "testimonial" ? "What has ContextWrite helped you with?" : "What would make it better?"} value={msg} onChange={(e) => setMsg(e.target.value)} style={{ minHeight: 100, marginTop: 10 }} />
    {kind === "testimonial" && <label><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} /> You may quote this publicly</label>}
    <p><button className="primary" disabled={busy || msg.trim().length < 5} onClick={send}>Send</button> <small role="status">{note}</small></p>
  </div>;
}
