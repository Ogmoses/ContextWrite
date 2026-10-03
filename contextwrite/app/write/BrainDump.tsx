"use client";
import { useState } from "react";
export default function BrainDump({ onStart }: { onStart: (desc: string) => void }) {
  const [open, setOpen] = useState(false), [text, setText] = useState(""), [busy, setBusy] = useState(false), [msg, setMsg] = useState(""), [res, setRes] = useState<any>(null), [fmt, setFmt] = useState(""), [notQuite, setNotQuite] = useState(false), [fix, setFix] = useState("");
  const analyze = async () => {
    setBusy(true); setMsg("Reading what you wrote…");
    try { const r = await fetch("/api/braindump", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) }); const d = await r.json(); if (!r.ok) setMsg(d.error); else { setRes(d); setFmt(d.formats?.[0] || ""); setMsg(""); } } catch { setMsg("Something went wrong. Your text is still here. Try again."); }
    setBusy(false);
  };
  const go = () => onStart(`I want to write: ${fmt || "something, format not decided yet"}. What I mean: ${res.reading}${fix.trim() ? " Correction from me: " + fix.trim() : ""} My raw thoughts, unedited: ${text}`.slice(0, 4800));
  if (!open) return <p><button onClick={() => setOpen(true)}>I just want to dump my thoughts</button></p>;
  if (!res) return <div className="card"><b>Dump it all here</b><p style={{ margin: "4px 0" }}><small>No structure needed. Feelings, half-ideas, what happened, what you wish they knew. I'll help make sense of it.</small></p>
    <textarea aria-label="Brain dump" value={text} onChange={(e) => setText(e.target.value)} style={{ minHeight: 220 }} placeholder="Just start writing…" />
    <button className="primary" disabled={busy || text.trim().length < 40} onClick={analyze}>Help me make sense of this</button> <button onClick={() => setOpen(false)}>Cancel</button><p role="status"><small>{msg}</small></p></div>;
  const L = ({ t, a }: { t: string; a?: string[] }) => a?.length ? <p style={{ margin: "4px 0" }}><small>{t}: </small>{a.join(", ")}</p> : null;
  return <div className="card">
    <p style={{ fontSize: "1.1rem" }}>{res.reading}</p>
    <L t="Themes" a={res.themes} /><L t="Feelings I noticed" a={res.emotions} /><L t="Points you seem to be making" a={res.arguments} />
    {!!res.formats?.length && <><p style={{ margin: "10px 0 4px" }}><small>This could become:</small></p>{res.formats.map((f: string) => <button key={f} className={fmt === f ? "primary" : ""} aria-pressed={fmt === f} onClick={() => setFmt(f)}>{f}</button>)}</>}
    {!!res.missing?.length && <p><small>I'll ask next about: {res.missing.join("; ")}</small></p>}
    <p><b>Is that roughly what you're trying to say?</b></p>
    {notQuite && <textarea aria-label="What's different" placeholder="Tell me what I got wrong or missed" value={fix} onChange={(e) => setFix(e.target.value)} />}
    {!notQuite ? <><button className="primary" onClick={go}>Yes, that's it</button><button onClick={() => setNotQuite(true)}>Not quite</button></> : <button className="primary" disabled={!fix.trim()} onClick={go}>Continue with my correction</button>}
    <button onClick={() => { setRes(null); setNotQuite(false); setFix(""); }}>Back to my text</button>
  </div>;
}
