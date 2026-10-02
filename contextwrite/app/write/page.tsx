"use client";
import { useState, useEffect } from "react";
import { sb } from "@/lib/supabase/browser";
import Versions from "./Versions";
import Export from "./Export";
import Upload from "./Upload";
import Actions from "./Actions";
const post = async (u: string, b: any) => { const r = await fetch(u, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) }); return { ok: r.ok, d: await r.json() }; };
export default function Write() {
  const [desc, setDesc] = useState(""), [pid, setPid] = useState<string | null>(null), [qa, setQa] = useState<any[]>([]), [r, setR] = useState<any>(null), [ans, setAns] = useState(""),
    [draft, setDraft] = useState(""), [ins, setIns] = useState(""), [busy, setBusy] = useState(""), [err, setErr] = useState(""), [tone, setTone] = useState("Natural"), [voice, setVoice] = useState("Balanced"), [summary, setSummary] = useState(false);
  const run = async (label: string, fn: () => Promise<void>) => { setBusy(label); setErr(""); try { await fn(); } catch { setErr("Something went wrong. Your project is saved. Try again."); } setBusy(""); };
  const engine = (nextQa: any[], d = desc) => run("Figuring out what context matters…", async () => {
    const x = await post("/api/engine", { projectId: pid, description: d, qa: nextQa });
    if (!x.ok) return setErr(x.d.error === "NO_AI" ? "Add your AI provider in Settings first." : x.d.error);
    setPid(x.d.projectId); setQa(nextQa); setR(x.d.result); setAns(""); setSummary(x.d.result.ready || !x.d.result.next_question);
  });
  const gen = (instruction?: string, useSel = true) => run("Drafting from your context…", async () => {
    const sel = useSel ? draft.slice(rng[0], rng[1]) : "";
    const x = await post("/api/draft", { projectId: pid, instruction, selection: sel, current: instruction ? draft : undefined, tone, voice, voiceId, useSaved });
    if (!x.ok) return setErr(x.d.error); setDraft(x.d.content);
  });
  const [rng, setRng] = useState<[number, number]>([0, 0]);
  const [voices, setVoices] = useState<any[]>([]), [voiceId, setVoiceId] = useState(""), [useSaved, setUseSaved] = useState(true);
  useEffect(() => { sb().from("voice_profiles").select("id,name").then(({ data }) => setVoices(data || [])); }, []);
  const voiceSel = <span><select aria-label="Voice profile" value={voiceId} onChange={(e) => setVoiceId(e.target.value)}><option value="">No voice profile</option>{voices.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select> <label><input type="checkbox" checked={useSaved} onChange={(e) => setUseSaved(e.target.checked)} /> Use saved context</label></span>;
  useEffect(() => { const p = new URLSearchParams(location.search); const t = p.get("t"), id = p.get("id"); if (t) setDesc(`I need to write: ${t.toLowerCase()}. `); if (!id) return; (async () => { const c = sb(); const [{ data: pc }, { data: a }, { data: d }, { data: pr }] = await Promise.all([c.from("project_context").select("*").eq("project_id", id).maybeSingle(), c.from("context_answers").select("question_text,answer").eq("project_id", id).order("created_at"), c.from("drafts").select("content").eq("project_id", id).order("version_number", { ascending: false }).limit(1), c.from("projects").select("initial_description").eq("id", id).single()]); if (!pr) return; setPid(id); setDesc(pr.initial_description || ""); setQa((a || []).map((x: any) => ({ q: x.question_text, a: x.answer }))); if (pc) { setR({ context: pc.context_json, score: pc.completeness_json?.score, classification: pc.completeness_json?.classification, ready: true, next_question: null }); setSummary(true); } if (d?.[0]) setDraft(d[0].content); })(); }, []);
  const words = draft.trim() ? draft.trim().split(/\s+/).length : 0;
  if (draft) return <><h2>Draft</h2><textarea aria-label="Draft" className="paper" onSelect={(e) => setRng([e.currentTarget.selectionStart, e.currentTarget.selectionEnd])} value={draft} onChange={(e) => setDraft(e.target.value)} /><p>{words} words · {Math.max(1, Math.round(words / 200))} min read · {draft.length} characters</p>
    {pid && <Actions projectId={pid} draft={draft} range={rng} setDraft={setDraft} opts={{ tone, voice, voiceId, useSaved }} onFull={gen} />}
    <input aria-label="Revision" placeholder="e.g. This sounds too formal" value={ins} onChange={(e) => setIns(e.target.value)} /> <button className="primary" disabled={!!busy} onClick={() => ins && gen(ins)}>Revise (select text to target)</button> <button onClick={() => navigator.clipboard.writeText(draft)}>Copy</button> {voiceSel} <button disabled={!!busy || !voiceId} onClick={() => gen("Rewrite to sound like my voice profile. Keep every fact and the meaning; adjust vocabulary, rhythm, sentence complexity, directness and punctuation.")}>Sound like me</button> <button onClick={() => setDraft("")}>Back to context</button> <a href="/dashboard">Dashboard</a><p>{busy}</p><Export title={desc} content={draft} /><div className="print-only">{draft}</div>{pid && <Versions projectId={pid} current={draft} onRestore={setDraft} />}<p role="alert">{err}</p></>;
  if (summary && r) return <><h1>Here's what I understand.</h1>{r.context.summary_lines.filter((l: any) => l.value).map((l: any, i: number) => <p key={i}><b>{l.label}: </b>{l.value}</p>)}
    {!!r.context.assumptions?.length && <><b>What I'm assuming (tell me if wrong)</b><ul className="marks">{r.context.assumptions.map((a: any, i: number) => <li key={i}>{String(typeof a === "string" ? a : JSON.stringify(a))}</li>)}</ul></>}
    <p>Tone <select value={tone} onChange={(e) => setTone(e.target.value)}>{["Natural", "Warm", "Serious", "Formal", "Casual", "Firm"].map((t) => <option key={t}>{t}</option>)}</select> Voice <select value={voice} onChange={(e) => setVoice(e.target.value)}>{["Keep my voice", "Balanced", "Polished"].map((t) => <option key={t}>{t}</option>)}</select></p>
    {pid && <Upload projectId={pid} onDone={() => engine(qa)} />}
    <p>{voiceSel} <a href="/voice">Manage</a></p>
    <textarea aria-label="Correct context" placeholder="Correct or add anything" value={ans} onChange={(e) => setAns(e.target.value)} style={{ width: "100%" }} /> <button className="primary" onClick={() => ans && engine([...qa, { q: "User correction", a: ans }])}>Update context</button> <button className="primary" disabled={!!busy} onClick={() => gen()}>Looks right — write it</button><p>{busy}</p><p role="alert">{err}</p></>;
  if (r?.next_question) { const q = r.next_question; return <><div className="meter" role="progressbar" aria-label="Context collected" aria-valuenow={r.score} aria-valuemin={0} aria-valuemax={100}><i style={{ width: r.score + "%" }} /></div><small>Context {r.score}%{r.classification?.artifact ? " · " + String(r.classification.artifact).replace(/_/g, " ") : ""}</small><p style={{ fontSize: 22 }}>{q.text}</p><small>Why I'm asking: {q.why}</small>
    {q.type === "choice" && q.options?.map((o: string) => <button key={o} onClick={() => engine([...qa, { q: q.text, a: o }])}>{o}</button>)}<br />
    {pid && <Upload projectId={pid} onDone={() => engine(qa)} />}<textarea aria-label="Your answer" value={ans} onChange={(e) => setAns(e.target.value)} style={{ width: "100%" }} />
    <button className="primary" disabled={!!busy} onClick={() => ans && engine([...qa, { q: q.text, a: ans }])}>Answer</button> <button onClick={() => engine([...qa, { q: q.text, a: "(skipped — use best judgment, mark assumptions)" }])}>Skip</button> <button onClick={() => setSummary(true)}>Generate now</button><p>{busy}</p><p role="alert">{err}</p></>; }
  return <><h1>What are you trying to write?</h1><textarea aria-label="Describe what you want to write" value={desc} onChange={(e) => setDesc(e.target.value)} style={{ width: "100%", minHeight: 130 }} placeholder="Or just dump your thoughts here." /><br /><button className="primary" disabled={!!busy || !desc.trim()} onClick={() => engine([])}>Start Writing</button><p>{busy}</p><p role="alert">{err}</p></>;
}
