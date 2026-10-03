"use client";
import { useState } from "react";
const L = ({ t, a }: { t: string; a?: any[] }) => a?.length ? <><b>{t}</b><ul>{a.map((x, i) => <li key={i}>{typeof x === "string" ? x : JSON.stringify(x)}</li>)}</ul></> : null;
export default function Quality({ projectId, content, voiceId }: { projectId: string; content: string; voiceId: string }) {
  const [r, setR] = useState<any>(null), [busy, setBusy] = useState(false), [msg, setMsg] = useState("");
  const run = async () => {
    setBusy(true); setMsg("Checking the draft against your context…");
    try { const x = await fetch("/api/quality", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ projectId, content, voiceId }) }); const d = await x.json(); if (!x.ok) setMsg(d.error); else { setR(d); setMsg(""); } } catch { setMsg("Something went wrong. Try again."); }
    setBusy(false);
  };
  return <div style={{ margin: "8px 0" }}>
    <button disabled={busy} onClick={run}>Check this draft</button> <small role="status">{msg}</small>
    {r && <div className="card">
      <L t="Your context used" a={r.context_used} /><L t="Not used yet" a={r.context_unused} />
      {!!r.requirements?.length && <><b>Requirements</b><ul>{r.requirements.map((q: any, i: number) => <li key={i}>{q.status === "met" ? "✓" : q.status === "partly" ? "◐" : "✗"} {q.item}{q.note ? ` — ${q.note}` : ""}</li>)}</ul></>}
      {!!r.unsupported_claims?.length && <><b>Claims to verify (not in your context)</b><ul className="marks">{r.unsupported_claims.map((c: any, i: number) => <li key={i}>“{c.text}” <small>{c.why}</small></li>)}</ul></>}
      {!!r.generic_language?.length && <><b>Could be more specific</b><ul>{r.generic_language.map((g: any, i: number) => <li key={i}>“{g.phrase}” → {g.suggestion}</li>)}</ul></>}
      {r.voice_notes && <p><b>Voice.</b> {r.voice_notes}</p>}
      <L t="Placeholders still to fill" a={r.placeholders} />
      {!r.unsupported_claims?.length && !r.generic_language?.length && <p><small>No unsupported claims or generic phrases found.</small></p>}
      <p><small>This is a review, not a score. It can miss things, so use your own judgment too.</small></p>
    </div>}
  </div>;
}
