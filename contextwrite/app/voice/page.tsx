"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { sb } from "@/lib/supabase/browser";
const F: [string, string][] = [["language", "Language / variety (e.g. Nigerian English)"], ["background", "Professional background"], ["audience", "Usual audience"], ["tone", "Preferred tones"], ["vocabulary", "Words or style you like or avoid"]];
const post = async (b: any) => { const r = await fetch("/api/voice", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) }); return { ok: r.ok, d: await r.json().catch(() => ({})) }; };
export default function Voice() {
  const [profiles, setProfiles] = useState<any[]>([]), [name, setName] = useState(""), [edited, setEdited] = useState(false), [sug, setSug] = useState(false), [samples, setSamples] = useState<string[]>([]), [cur, setCur] = useState(""), [ok, setOk] = useState(false),
    [busy, setBusy] = useState(false), [msg, setMsg] = useState(""), [saved, setSaved] = useState<any>({}), [smsg, setSmsg] = useState(""), [sel, setSel] = useState<string[]>([]), [mname, setMname] = useState("");
  const load = async () => { const c = sb(); const { data } = await c.from("voice_profiles").select("id,name,profile_json,created_at").order("created_at", { ascending: false }); setProfiles(data || []); const { data: s } = await c.from("settings").select("settings_json").maybeSingle(); setSaved(s?.settings_json || {}); };
  useEffect(() => { load(); }, []);
  const src = samples[0] || cur;
  const suggest = async () => { if (src.trim().length < 80) return; setSug(true); const x = await post({ action: "name", sample: src }); setSug(false); if (x.ok && x.d.name) { setName(x.d.name); setEdited(false); } };
  useEffect(() => { if (edited || name || src.trim().length < 80) return; const t = setTimeout(suggest, 1200); return () => clearTimeout(t); }, [src, edited, name]);
  const add = () => { if (cur.trim().length < 80) return setMsg("Samples need at least 80 characters."); setSamples([...samples, cur.trim()]); setCur(""); setMsg(""); };
  const all = cur.trim().length >= 80 ? [...samples, cur.trim()] : samples;
  const analyze = async () => { setBusy(true); setMsg("Reading your samples…"); const x = await post({ name: name.trim() || "My voice", samples: all }); setBusy(false); if (!x.ok) return setMsg(x.d.error); setSamples([]); setCur(""); setOk(false); setName(""); setEdited(false); setMsg("Voice profile created."); load(); };
  const merge = async () => { setBusy(true); setMsg("Comparing your profiles…"); const x = await post({ action: "merge", ids: sel, name: mname.trim() || "Merged voice" }); setBusy(false); if (!x.ok) return setMsg(x.d.error); setSel([]); setMname(""); setMsg("Merged profile created. Your originals are untouched."); load(); };
  const del = async (id: string) => { if (confirm("Delete this voice profile and its samples?")) { await sb().from("voice_profiles").delete().eq("id", id); setSel(sel.filter((x) => x !== id)); load(); } };
  const clearAll = async () => { if (confirm("Delete ALL voice profiles and samples?")) { await sb().from("voice_profiles").delete().not("id", "is", null); setSel([]); load(); } };
  const saveCtx = async () => { const { data: { user } } = await sb().auth.getUser(); const { error } = await sb().from("settings").update({ settings_json: saved }).eq("user_id", user!.id); setSmsg(error ? "Couldn't save. Try again." : "Saved."); };
  const List = ({ t, a }: { t: string; a?: string[] }) => a?.length ? <><small>{t}</small><ul>{a.map((c, i) => <li key={i}>{typeof c === "string" ? c : JSON.stringify(c)}</li>)}</ul></> : null;
  return <>
    <p><Link href="/dashboard">← Dashboard</Link></p>
    <h1>Your voice</h1>
    <p>Paste things you've written yourself: messages, emails, essays, notes. ContextWrite studies your habits (sentence construction, tone, paragraph spacing, directness) and uses them to draft in your voice. Don't paste text written by others.</p>
    <textarea aria-label="Writing sample" placeholder="Paste a sample (80+ characters)" value={cur} onChange={(e) => setCur(e.target.value)} style={{ minHeight: 120 }} />
    <p><small>{all.length} sample{all.length === 1 ? "" : "s"} ready. More varied samples give a better profile; 3 or more is ideal. Use "Add another sample" to add more before creating.</small></p>
    <label>Profile name <small>{sug ? "Suggesting a name…" : "suggested from your writing, edit freely"}</small><input type="text" value={name} onChange={(e) => { setName(e.target.value); setEdited(true); }} placeholder="Name appears after you paste a sample" maxLength={60} /></label>
    <label><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} /> I agree to save these samples privately in my account. I can delete them anytime.</label>
    <p><button onClick={add}>Add another sample</button> <button onClick={suggest} disabled={sug || src.trim().length < 80}>Suggest a name</button> <button className="primary" disabled={!ok || busy || !all.length} onClick={analyze}>Create voice profile</button></p>
    <p role="status">{msg}</p>
    <h2>Saved profiles</h2>
    {!profiles.length && <p>No voice profiles yet.</p>}
    {profiles.length > 1 && <p><small>Tick two or more profiles to merge them into one voice that keeps the patterns they share.</small></p>}
    {profiles.map((p) => { const j = p.profile_json || {}; return <div key={p.id} className="card">
      <label><input type="checkbox" checked={sel.includes(p.id)} onChange={() => setSel(sel.includes(p.id) ? sel.filter((x) => x !== p.id) : [...sel, p.id].slice(0, 8))} aria-label={`Select ${p.name} to merge`} /> <b>{p.name}</b>{j.merged_from && <small> · merged from {j.merged_from.length}</small>}</label><br />
      <small>Formality {j.formality}/10 · directness {Math.round((j.directness || 0) * 100)}% · {j.contractions ? "uses" : "avoids"} contractions · {j.preferred_language}</small>
      <List t="Tone" a={j.tone} /><List t="Sentence construction" a={j.sentence_construction} />
      {j.paragraph_style && <p style={{ margin: "6px 0" }}><small>Paragraphs: </small>{j.paragraph_style}</p>}
      <List t="Patterns across all merged profiles" a={j.consistent_patterns} /><List t="Characteristics" a={j.characteristics} />
      <button onClick={() => del(p.id)}>Delete</button></div>; })}
    {sel.length >= 2 && <div className="card"><b>Merge {sel.length} profiles</b><input type="text" value={mname} onChange={(e) => setMname(e.target.value)} placeholder="Name for the merged voice (default: Merged voice)" maxLength={60} /><button className="primary" disabled={busy} onClick={merge}>Merge selected</button><p><small>Compares sentence construction, tone, paragraph spacing and more, and keeps what they share. Your originals stay as they are.</small></p></div>}
    {!!profiles.length && <button onClick={clearAll}>Clear all voice data</button>}
    <h2>Saved context</h2>
    <p>Optional. Reusable details that ContextWrite can apply to new projects. Nothing is saved unless you press Save, and you can clear it anytime. Avoid sensitive personal details.</p>
    {F.map(([k, l]) => <p key={k}><label>{l}<input type="text" value={saved[k] || ""} onChange={(e) => setSaved({ ...saved, [k]: e.target.value })} /></label></p>)}
    <button className="primary" onClick={saveCtx}>Save</button> <button onClick={() => setSaved({ onboarded: saved.onboarded })}>Clear fields</button> <span role="status">{smsg}</span>
  </>;
}
