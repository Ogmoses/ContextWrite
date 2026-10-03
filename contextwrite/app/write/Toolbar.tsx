"use client";
import { useEffect, useRef, useState } from "react";
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export default function Toolbar({ draft, range, setDraft, onClear }: { draft: string; range: [number, number]; setDraft: (t: string) => void; onClear: () => void }) {
  const h = useRef<string[]>([draft]), i = useRef(0), pos = useRef(0);
  const [find, setFind] = useState(""), [rep, setRep] = useState(""), [open, setOpen] = useState(false), [mc, setMc] = useState(false), [info, setInfo] = useState("");
  const push = (t: string) => { if (h.current[i.current] === t) return; h.current = h.current.slice(0, i.current + 1); h.current.push(t); if (h.current.length > 100) h.current.shift(); i.current = h.current.length - 1; };
  useEffect(() => { const t = setTimeout(() => push(draft), 500); return () => clearTimeout(t); }, [draft]);
  const ta = () => document.getElementById("draft-ed") as HTMLTextAreaElement;
  const sel = (): [number, number] => (range[1] > range[0] ? range : [ta().selectionStart, ta().selectionEnd]);
  const apply = (t: string) => { push(draft); push(t); setDraft(t); onClear(); };
  const undo = () => { push(draft); if (i.current > 0) { i.current--; setDraft(h.current[i.current]); onClear(); } };
  const redo = () => { if (i.current < h.current.length - 1) { i.current++; setDraft(h.current[i.current]); onClear(); } };
  const wrap = (a: string, ph: string) => { const [s, e] = sel(); apply(draft.slice(0, s) + a + (draft.slice(s, e) || ph) + a + draft.slice(e)); };
  const lines = (p: string) => { const [s, e] = sel(), a = draft.lastIndexOf("\n", s - 1) + 1; let b = draft.indexOf("\n", e); if (b < 0) b = draft.length; apply(draft.slice(0, a) + draft.slice(a, b).split("\n").map((l) => (l.startsWith(p) ? l.slice(p.length) : p + l)).join("\n") + draft.slice(b)); };
  const link = () => { const u = (prompt("Link address (https://…)") || "").trim(); if (!/^(https?:\/\/|mailto:)/i.test(u)) return; const [s, e] = sel(); apply(draft.slice(0, s) + "[" + (draft.slice(s, e) || "link text") + "](" + u + ")" + draft.slice(e)); };
  const re = () => new RegExp(esc(find), mc ? "g" : "gi"), count = () => (find ? (draft.match(re()) || []).length : 0);
  const next = () => { if (!find) return; const r = re(); r.lastIndex = pos.current; let m = r.exec(draft); if (!m) { r.lastIndex = 0; m = r.exec(draft); } if (!m) return setInfo("No matches."); pos.current = m.index + m[0].length; const t = ta(); t.focus(); t.setSelectionRange(m.index, m.index + m[0].length); setInfo(`${count()} match${count() === 1 ? "" : "es"}`); };
  const replaceOne = () => { const t = ta(), s = t.selectionStart, e = t.selectionEnd, x = draft.slice(s, e); if (find && (mc ? x === find : x.toLowerCase() === find.toLowerCase())) { apply(draft.slice(0, s) + rep + draft.slice(e)); pos.current = s + rep.length; setInfo("Replaced. Tap Find next to continue."); } else next(); };
  const all = () => { const n = count(); if (!n) return setInfo("No matches."); apply(draft.replace(re(), () => rep)); setInfo(`Replaced ${n}.`); };
  const B = (l: string, f: () => void, label?: string) => <button key={l} aria-label={label || l} onMouseDown={(e) => e.preventDefault()} onClick={f}>{l}</button>;
  return <div style={{ margin: "6px 0" }}>
    {B("Undo", undo)}{B("Redo", redo)}{B("Bold", () => wrap("**", "bold text"))}{B("Italic", () => wrap("*", "italic text"))}{B("Heading", () => lines("# "))}{B("Subheading", () => lines("## "))}{B("List", () => lines("- "))}{B("Quote", () => lines("> "))}{B("Link", link)}
    <button aria-expanded={open} onClick={() => setOpen(!open)}>Find &amp; replace</button>
    {open && <div className="card">
      <input type="text" aria-label="Find" placeholder="Find" value={find} onChange={(e) => { setFind(e.target.value); pos.current = 0; setInfo(""); }} />
      <input type="text" aria-label="Replace with" placeholder="Replace with" value={rep} onChange={(e) => setRep(e.target.value)} />
      <label><input type="checkbox" checked={mc} onChange={(e) => setMc(e.target.checked)} /> Match case</label>
      <p><button onClick={next}>Find next</button><button onClick={replaceOne}>Replace</button><button onClick={all}>Replace all</button> <small role="status">{info || (find ? `${count()} match${count() === 1 ? "" : "es"}` : "")}</small></p>
    </div>}
    <p style={{ margin: "2px 0" }}><small>Formatting uses simple markup (**bold**, *italic*, # headings) that carries into Markdown and Word exports.</small></p>
  </div>;
}
