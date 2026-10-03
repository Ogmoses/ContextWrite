"use client";
import { useState } from "react";
export default function Research({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const [q, setQ] = useState(""), [busy, setBusy] = useState(false), [msg, setMsg] = useState("");
  const run = async () => {
    setBusy(true); setMsg("Searching the web and reading sources…");
    try { const r = await fetch("/api/research", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ projectId, query: q }) }); const d = await r.json(); if (!r.ok) setMsg(d.error); else { setMsg(`Found ${d.found} findings from ${d.sources} sources. They're listed under Documents. Remove anything that looks off.`); setQ(""); onDone(); } } catch { setMsg("Something went wrong. Try again."); }
    setBusy(false);
  };
  return <details className="card"><summary style={{ cursor: "pointer", minHeight: 36, fontWeight: 600 }}>Research this topic <small>(optional, finds facts and sources)</small></summary>
    <textarea aria-label="What to research" placeholder="What should I look up? e.g. what research says about habit streaks and motivation" value={q} onChange={(e) => setQ(e.target.value)} style={{ minHeight: 80 }} />
    <button className="primary" disabled={busy || q.trim().length < 10} onClick={run}>{busy ? "Searching…" : "Search the web"}</button>
    <p role="status"><small>{msg || "Sources come from your AI provider's own web search. Always check important facts yourself."}</small></p>
  </details>;
}
