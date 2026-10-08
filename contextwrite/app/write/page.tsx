"use client";
import { useState, useEffect } from "react";
import { sb } from "@/lib/supabase/browser";
import Versions from "./Versions";
import Export from "./Export";
import Upload from "./Upload";
import Actions from "./Actions";
import BrainDump from "./BrainDump";
import Plan from "./Plan";
import QBar from "./QBar";
import Icon from "@/components/Icon";
import Fold from "./Fold";
import Research from "./Research";
import Quality from "./Quality";
import Toolbar from "./Toolbar";
const post = async (u: string, b: any) => { const r = await fetch(u, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) }); return { ok: r.ok, d: await r.json().catch(() => ({ error: "The AI took too long to answer. Try a shorter description, or a faster model in AI settings." })) }; };
export default function Write() {
  const [desc, setDesc] = useState(""), [pid, setPid] = useState<string | null>(null), [qa, setQa] = useState<any[]>([]), [r, setR] = useState<any>(null), [ans, setAns] = useState(""),
    [draft, setDraft] = useState(""), [ins, setIns] = useState(""), [busy, setBusy] = useState(""), [err, setErr] = useState(""), [tone, setTone] = useState("Natural"), [voice, setVoice] = useState("Balanced"), [summary, setSummary] = useState(false);
  const run = async (label: string, fn: () => Promise<void>) => { setBusy(label); setErr(""); try { await fn(); } catch { setErr("Something went wrong. Your project is saved. Try again."); } setBusy(""); };
  const engine = (nextQa: any[], d = desc, deepen = false, ask = false, avoid = "") => run("Figuring out what context matters…", async () => {
    const x = await post("/api/engine", { projectId: pid, description: d, qa: nextQa, deepen, avoid });
    if (!x.ok) return setErr(x.d.error === "NO_AI" ? "Add your AI provider in Settings first." : x.d.error);
    setPid(x.d.projectId); try { history.replaceState(null, "", "/write?id=" + x.d.projectId); } catch {} setQa(nextQa); setR(x.d.result); setAns(""); setPicked([]); const corr = !deepen && !ask && nextQa.length > 0 && nextQa[nextQa.length - 1].q === "User correction", done = x.d.result.ready || !x.d.result.next_question;
    setSummary(corr || !(!!x.d.result.next_question && (deepen || ask || !x.d.result.ready)));
    setNote(corr ? (done ? "Context updated. The summary below reflects your correction." : "Context updated. I have a follow-up question if you'd like to answer it: tap Ask more questions.") : "");
    if (corr) window.scrollTo({ top: 0, behavior: "smooth" });
  });
  const gen = (instruction?: string, useSel = true) => run("Drafting from your context…", async () => {
    const sel = useSel ? draft.slice(rng[0], rng[1]) : "";
    const x = await post("/api/draft", { projectId: pid, instruction, selection: sel, current: instruction ? draft : undefined, tone, voice, voiceId, useSaved, lang });
    if (!x.ok) return setErr(x.d.error); setDraft(x.d.content); setRng([0, 0]); setIns("");
  });
  const [rng, setRng] = useState<[number, number]>([0, 0]);
  const [picked, setPicked] = useState<string[]>([]);
  const [full, setFull] = useState(false), [pstatus, setPstatus] = useState("draft"), [saveMsg, setSaveMsg] = useState(""), [lang, setLang] = useState(""), [docRev, setDocRev] = useState(0), [note, setNote] = useState(""), [showAns, setShowAns] = useState(false), [stale, setStale] = useState(false);
  const locked = pstatus === "final";
  // Phones don't reliably announce text selection changes, so check the editor a few times a second while it's focused.
  useEffect(() => {
    const id = setInterval(() => {
      const t = document.getElementById("draft-ed") as HTMLTextAreaElement | null;
      if (t && document.activeElement === t && t.selectionEnd > t.selectionStart) setRng((r) => (r[0] === t.selectionStart && r[1] === t.selectionEnd ? r : [t.selectionStart, t.selectionEnd]));
    }, 250);
    return () => clearInterval(id);
  }, []);
  const [voices, setVoices] = useState<any[]>([]), [voiceId, setVoiceId] = useState(""), [useSaved, setUseSaved] = useState(true);
  useEffect(() => { sb().from("voice_profiles").select("id,name").then(({ data }) => setVoices(data || [])); }, []);
  const voiceSel = <span><select aria-label="Voice profile" value={voiceId} onChange={(e) => setVoiceId(e.target.value)}><option value="">No voice profile</option>{voices.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select> <label><input type="checkbox" checked={useSaved} onChange={(e) => setUseSaved(e.target.checked)} /> Use saved context</label></span>;
  useEffect(() => { const p = new URLSearchParams(location.search); const t = p.get("t"), id = p.get("id"); if (t) setDesc(`I need to write: ${t.toLowerCase()}. `); if (!id) return; (async () => { const c = sb(); const [{ data: pc }, { data: a }, { data: d }, { data: pr }] = await Promise.all([c.from("project_context").select("*").eq("project_id", id).maybeSingle(), c.from("context_answers").select("question_text,answer").eq("project_id", id).order("created_at"), c.from("drafts").select("content").eq("project_id", id).order("version_number", { ascending: false }).limit(1), c.from("projects").select("initial_description,status,regional_variant").eq("id", id).single()]); if (!pr) return; setPid(id); setPstatus(pr.status || "draft"); setLang(pr.regional_variant || ""); setDesc(pr.initial_description || ""); setQa((a || []).map((x: any) => ({ q: x.question_text, a: x.answer }))); if (pc) { { const nq = pc.completeness_json?.next_question || null; setR({ context: pc.context_json, score: pc.completeness_json?.score, classification: pc.completeness_json?.classification, ready: !nq, next_question: nq }); setSummary(!nq); } } if (d?.[0]) setDraft(d[0].content); })(); }, []);
  const words = draft.trim() ? draft.trim().split(/\s+/).length : 0;
  const langSel = <label>Language and spelling <select aria-label="Language and spelling" value={lang} onChange={(e) => { setLang(e.target.value); if (pid) sb().from("projects").update({ regional_variant: e.target.value || null }).eq("id", pid).then(() => {}, () => {}); }}>
    <option value="">Match my saved context</option>{["English (Nigerian)", "English (British)", "English (American)"].map((l) => <option key={l} value={l}>{l}</option>)}</select></label>;
  useEffect(() => {
    if (!pid || !draft) return;
    (async () => {
      try {
        const c = sb(), [{ data: pc }, { data: ds }] = await Promise.all([c.from("project_context").select("updated_at").eq("project_id", pid).maybeSingle(), c.from("drafts").select("generation_metadata").eq("project_id", pid).order("version_number", { ascending: false }).limit(20)]);
        const ctx = (ds || []).map((d: any) => d.generation_metadata?.ctx).find(Boolean);
        setStale(!!(pc?.updated_at && ctx && new Date(pc.updated_at) > new Date(ctx)));
      } catch {}
    })();
  }, [pid, !!draft, docRev]);
  const saveNow = async (finish = false) => {
    if (!pid) return; setBusy("Saving…"); setSaveMsg("");
    try {
      const c = sb(); const { data: l } = await c.from("drafts").select("version_number,content").eq("project_id", pid).order("version_number", { ascending: false }).limit(1);
      if (l?.[0]?.content !== draft) { const { error } = await c.from("drafts").insert({ project_id: pid, version_number: (l?.[0]?.version_number || 0) + 1, name: finish ? "Final" : "Saved edit", content: draft }); if (error) throw error; }
      const st = finish ? "final" : "draft"; const { error: e2 } = await c.from("projects").update({ status: st }).eq("id", pid); if (e2) throw e2; setPstatus(st);
      if (finish) { fetch("/api/track", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "project_finished" }), keepalive: true }).catch(() => {}); location.href = "/dashboard"; return; }
      setSaveMsg("Saved.");
    } catch { setSaveMsg("Couldn't save. Your text is still here. Try again."); }
    setBusy("");
  };
  const reopen = async () => { await sb().from("projects").update({ status: "draft" }).eq("id", pid); setPstatus("draft"); };
  const editor = <textarea id="draft-ed" aria-label="Draft" readOnly={locked} className={full ? "fsed" : "paper"} onBlur={(e) => { const t = e.currentTarget; if (t.selectionEnd > t.selectionStart) setRng([t.selectionStart, t.selectionEnd]); }} onSelect={(e) => { const t = e.currentTarget; if (t.selectionEnd > t.selectionStart) setRng([t.selectionStart, t.selectionEnd]); }} value={draft} onChange={(e) => { setDraft(e.target.value); setRng([0, 0]); }} />;
  if (draft && full) return <div className="fs">
    <div className="fsbar"><button className="primary sm" onClick={() => setFull(false)}>Done</button><small>{words} words</small><span style={{ marginLeft: "auto" }} /><small role="status">{saveMsg}</small><button className="sm" disabled={!!busy || locked} onClick={() => saveNow(false)}>Save</button></div>
    {!locked && <div style={{ padding: "0 12px" }}><Toolbar draft={draft} range={rng} setDraft={setDraft} onClear={() => setRng([0, 0])} /></div>}
    {editor}
  </div>;
  if (draft) return <>
    <h2>Your draft</h2>
    {stale && !locked && <div className="card" role="status" style={{ borderColor: "var(--btn)" }}><b>Your context changed after this draft was written.</b><p style={{ margin: "4px 0 8px" }}>Regenerate it to match the updated context. The current draft stays in History.</p><button className="primary sm" disabled={!!busy} onClick={() => { setStale(false); gen(); }}>Regenerate from updated context</button><button className="sm" onClick={() => setStale(false)}>Keep this draft</button></div>}
    {locked && <div className="card"><b>This project is finished.</b><p style={{ margin: "4px 0 8px" }}>Reopen it to make changes.</p><button className="primary" onClick={reopen}>Reopen for editing</button></div>}
    <div className="dwrap">
      <div className="dbar">
        <div className="tools">
          <button className="sm" disabled={!!busy || locked} onClick={() => saveNow(false)}><Icon n="save" size={16} /> Save</button>
          <button className="primary sm" disabled={!!busy || locked} onClick={() => { if (confirm("Mark this project as finished? You can reopen it later.")) saveNow(true); }}><Icon n="check" size={16} /> Finish</button>
          <span style={{ marginLeft: "auto" }} />
          <button className="sm" aria-label="Copy draft" title="Copy draft" onClick={() => navigator.clipboard.writeText(draft)}><Icon n="copy" size={16} /></button>
        </div>
        {!locked && <Toolbar draft={draft} range={rng} setDraft={setDraft} onClear={() => setRng([0, 0])} />}
      </div>
      <div className="edwrap">{editor}<button className="xp" aria-label="Expand editor" title="Expand editor" onClick={() => setFull(true)}><Icon n="expand" size={18} /></button></div>
    </div>
    <small role="status">{saveMsg}</small>
    <p><small>{words} words · {Math.max(1, Math.round(words / 200))} min read · {draft.length} characters</small></p>
    {!locked && pid && <Actions projectId={pid} draft={draft} range={rng} onClear={() => setRng([0, 0])} setDraft={setDraft} opts={{ tone, voice, voiceId, useSaved, lang }} onFull={gen} />}
    {!locked && <Fold title="Refine" cls="c2" open>
      <input aria-label="Revision" placeholder="Tell me what to change, e.g. this sounds too formal" value={ins} onChange={(e) => setIns(e.target.value)} />
      <button className="primary" disabled={!!busy || !ins.trim()} onClick={() => gen(ins)}>Apply change</button> <small>Highlight text first to change only that part.</small>
      <p style={{ margin: "14px 0 6px" }}><small>Voice and context</small></p>
      <p style={{ margin: 0 }}>{voiceSel}</p>
      <p style={{ margin: "8px 0 0" }}>{langSel}</p>
      <button style={{ marginTop: 8 }} disabled={!!busy || !voiceId} onClick={() => gen("Rewrite to sound like my voice profile. Keep every fact and the meaning; adjust vocabulary, rhythm, sentence complexity, directness and punctuation.")}>Sound like me</button>
    </Fold>}
    {pid && <Fold title="Check" cls="c3"><p style={{ margin: "0 0 8px" }}><small>Review the draft against your context: unsupported claims, generic phrases and missing details.</small></p><Quality projectId={pid} content={draft} voiceId={voiceId} /></Fold>}
    <Fold title="Export and share" cls="c4"><Export content={draft} projectId={pid} /></Fold>
    {pid && <Fold title="History" cls="c5"><Versions projectId={pid} current={draft} onRestore={setDraft} /></Fold>}
    <p><button onClick={() => setDraft("")}>Back to context</button> <a href="/dashboard">Dashboard</a></p>
    <p>{busy}</p><p role="alert">{err}</p></>;

  if (summary && r) return <><h1>Here's what I understand.</h1>
    {note && <p role="status" className="card" style={{ margin: "8px 0" }}>{note}</p>}{r.context?.summary_lines.filter((l: any) => l.value).map((l: any, i: number) => <p key={i}><b>{l.label}: </b>{l.value}</p>)}
    {!!r.context?.assumptions?.length && <><b>What I'm assuming (tell me if wrong)</b><ul className="marks">{r.context?.assumptions.map((a: any, i: number) => <li key={i}>{String(typeof a === "string" ? a : JSON.stringify(a))}</li>)}</ul></>}
    <p>Tone <select value={tone} onChange={(e) => setTone(e.target.value)}>{["Natural", "Warm", "Serious", "Formal", "Casual", "Firm"].map((t) => <option key={t}>{t}</option>)}</select> Voice <select value={voice} onChange={(e) => setVoice(e.target.value)}>{["Keep my voice", "Balanced", "Polished"].map((t) => <option key={t}>{t}</option>)}</select></p>
    {pid && <><Upload key={docRev} projectId={pid} onDone={() => engine(qa)} /><Research projectId={pid} onDone={() => { setDocRev((n) => n + 1); engine(qa); }} /></>}
    {pid && <Plan projectId={pid} />}
    <p>{voiceSel} <a href="/voice">Manage</a></p>
    <p>{langSel}</p>
    <textarea aria-label="Correct context" placeholder="Correct or add anything" value={ans} onChange={(e) => setAns(e.target.value)} style={{ width: "100%" }} /> <button className="primary" onClick={() => ans && engine([...qa, { q: "User correction", a: ans }])}>Update context</button> <button className="primary" disabled={!!busy} onClick={() => gen()}>Looks right — write it</button> <button disabled={!!busy} onClick={() => engine(qa, desc, true)}>Ask more questions</button> <button disabled={!!busy} onClick={() => setShowAns(!showAns)} aria-expanded={showAns}>Back to context</button>
    {showAns && <div className="card"><b>Your answers</b>{qa.length ? qa.map((x: any, i: number) => <div key={i} style={{ padding: "8px 0", borderTop: "1px solid var(--line)" }}><small>{x.q}</small><br />{x.a}<br /><button className="sm" disabled={!!busy} onClick={() => engine(qa.slice(0, i), desc, false, true)}>Change this</button> <button className="sm" disabled={!!busy} onClick={() => engine(qa.filter((_: any, k: number) => k !== i))}>Delete</button></div>) : <p style={{ margin: "6px 0" }}>You haven't answered any questions yet.</p>}<p style={{ margin: "8px 0" }}><small>Changing an answer re-asks from that point, so the answers after it are cleared.</small></p><button className="sm" onClick={() => { setR(null); setSummary(false); setShowAns(false); }}>Edit my first description</button></div>}<p>{busy}</p><p role="alert">{err}</p></>;
  if (r?.next_question) { const q = r.next_question; return <><QBar qa={qa} score={r.score || 0} title={String(r.classification?.artifact || "").replace(/_/g, " ")} busy={!!busy} onJump={(i) => engine(qa.slice(0, i), desc, false, true)} /><p style={{ fontSize: 22 }}>{q.text}</p><small>Why I'm asking: {q.why}</small>
    {!!q.options?.length && <div style={{ margin: "8px 0" }}>{q.options.map((o: string) => { const parts = ans.split(/,\s*/).filter(Boolean), on = q.type === "multi" ? parts.includes(o) : ans.trim() === o; return <button key={o} className={on ? "primary" : ""} aria-pressed={on} onClick={() => setAns(q.type === "multi" ? (on ? parts.filter((x) => x !== o).join(", ") : [...parts, o].join(", ")) : on ? "" : o)}>{o}</button>; })}
      <br /><small>Tap a suggestion to add it to your answer, add your own details if you like, then press Answer.</small></div>}
    {pid && <><Upload key={docRev} projectId={pid} onDone={() => engine(qa)} /><Research projectId={pid} onDone={() => { setDocRev((n) => n + 1); engine(qa); }} /></>}<textarea aria-label="Your answer" placeholder="Something else? Write it here" value={ans} onChange={(e) => setAns(e.target.value)} style={{ width: "100%" }} />
    <button className="primary" disabled={!!busy} onClick={() => { const a = [...picked, ans.trim()].filter(Boolean).join("; "); if (a) engine([...qa, { q: q.text, a }]); }}>Answer</button> <button onClick={() => engine([...qa, { q: q.text, a: "(skipped — use best judgment, mark assumptions)" }])}>Skip</button> <button disabled={!!busy} onClick={() => engine(qa, desc, false, true, q.text)}>Different question</button> <button onClick={() => setSummary(true)}>Generate now</button><p>{busy}</p><p role="alert">{err}</p></>; }
  return <><h1>What are you trying to write?</h1><textarea aria-label="Describe what you want to write" value={desc} onChange={(e) => setDesc(e.target.value)} style={{ width: "100%", minHeight: 130 }} placeholder="e.g. I want to write an essay about why habit streaks fail, for young readers." /><br /><button className="primary" disabled={!!busy || !desc.trim()} onClick={() => engine([])}>Start Writing</button><p>{busy}</p><p role="alert">{err}</p><BrainDump onStart={(d) => { setDesc(d); engine([], d); }} /></>;
}
