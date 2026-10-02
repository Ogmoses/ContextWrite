"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { sb } from "@/lib/supabase/browser";
const F: [string, string][] = [["language", "Language / variety (e.g. Nigerian English)"], ["background", "Professional background"], ["audience", "Usual audience"], ["tone", "Preferred tones"], ["vocabulary", "Words or style you like or avoid"]];
export default function Voice() {
  const [profiles, setProfiles] = useState<any[]>([]), [name, setName] = useState("My voice"), [samples, setSamples] = useState<string[]>([]), [cur, setCur] = useState(""), [ok, setOk] = useState(false),
    [busy, setBusy] = useState(false), [msg, setMsg] = useState(""), [saved, setSaved] = useState<any>({}), [smsg, setSmsg] = useState("");
  const load = async () => { const c = sb(); const { data } = await c.from("voice_profiles").select("id,name,profile_json,created_at").order("created_at", { ascending: false }); setProfiles(data || []); const { data: s } = await c.from("settings").select("settings_json").maybeSingle(); setSaved(s?.settings_json || {}); };
  useEffect(() => { load(); }, []);
  const add = () => { if (cur.trim().length < 80) return setMsg("Samples need at least 80 characters."); setSamples([...samples, cur.trim()]); setCur(""); setMsg(""); };
  const analyze = async () => {
    setBusy(true); setMsg("Reading your samples…");
    const r = await fetch("/api/voice", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, samples: cur.trim().length >= 80 ? [...samples, cur.trim()] : samples }) });
    const d = await r.json(); setBusy(false);
    if (!r.ok) return setMsg(d.error); setSamples([]); setCur(""); setOk(false); setMsg("Voice profile created."); load();
  };
  const del = async (id: string) => { if (confirm("Delete this voice profile and its samples?")) { await sb().from("voice_profiles").delete().eq("id", id); load(); } };
  const clearAll = async () => { if (confirm("Delete ALL voice profiles and samples?")) { await sb().from("voice_profiles").delete().not("id", "is", null); load(); } };
  const saveCtx = async () => { const { data: { user } } = await sb().auth.getUser(); const { error } = await sb().from("settings").update({ settings_json: saved }).eq("user_id", user!.id); setSmsg(error ? "Couldn't save. Try again." : "Saved."); };
  const n = samples.length + (cur.trim().length >= 80 ? 1 : 0);
  return <>
    <p><Link href="/dashboard">← Dashboard</Link></p>
    <h1>Your voice</h1>
    <p>Paste things you've written yourself: messages, emails, essays, notes. ContextWrite studies your habits (sentence length, directness, formality) and uses them to draft in your voice. Don't paste text written by others.</p>
    <input aria-label="Profile name" value={name} onChange={(e) => setName(e.target.value)} />
    <textarea aria-label="Writing sample" placeholder="Paste a sample (80+ characters)" value={cur} onChange={(e) => setCur(e.target.value)} style={{ width: "100%", minHeight: 120 }} />
    <p><small>{samples.length} sample(s) added. More varied samples give a better profile; 3 or more is ideal.</small></p>
    <label><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} /> I agree to save these samples privately in my account. I can delete them anytime.</label>
    <p><button onClick={add}>Add another sample</button> <button disabled={!ok || busy || !n} onClick={analyze}>Create voice profile</button></p>
    <p role="status">{msg}</p>
    <h2>Saved profiles</h2>
    {!profiles.length && <p>No voice profiles yet.</p>}
    {profiles.map((p) => <div key={p.id} style={{ border: "1px solid #e2ddd3", borderRadius: 6, padding: "12px 14px", margin: "10px 0" }}>
      <b>{p.name}</b><br /><small>Formality {p.profile_json.formality}/10 · directness {Math.round((p.profile_json.directness || 0) * 100)}% · {p.profile_json.contractions ? "uses" : "avoids"} contractions · {p.profile_json.preferred_language}</small>
      <ul>{(p.profile_json.characteristics || []).map((c: string, i: number) => <li key={i}>{c}</li>)}</ul>
      <button onClick={() => del(p.id)}>Delete</button></div>)}
    {!!profiles.length && <button onClick={clearAll}>Clear all voice data</button>}
    <h2>Saved context</h2>
    <p>Optional. Reusable details that ContextWrite can apply to new projects. Nothing is saved unless you press Save, and you can clear it anytime. Avoid sensitive personal details.</p>
    {F.map(([k, l]) => <p key={k}><label>{l}<br /><input style={{ width: "100%" }} value={saved[k] || ""} onChange={(e) => setSaved({ ...saved, [k]: e.target.value })} /></label></p>)}
    <button onClick={saveCtx}>Save</button> <button onClick={() => { setSaved({}); }}>Clear fields</button> <span role="status">{smsg}</span>
  </>;
}
