"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { sb } from "@/lib/supabase/browser";
const G: any = {
  gemini: { name: "Google Gemini", note: "Easiest to start. Has a free tier within Google's daily limits.", url: "https://aistudio.google.com/apikey", link: "Open Google AI Studio", steps: ["Sign in with your Google account.", "Tap Create API key.", "Copy the key and paste it below."] },
  openai: { name: "OpenAI", note: "Pay as you go. You'll need a little credit on your account.", url: "https://platform.openai.com/api-keys", link: "Open OpenAI API keys", steps: ["Sign in and add a few dollars of credit under Billing.", "Tap Create new secret key.", "Copy it straight away (it's shown once) and paste it below."] },
  anthropic: { name: "Claude", note: "Pay as you go. You'll need a little credit on your account.", url: "https://console.anthropic.com/settings/keys", link: "Open Anthropic Console", steps: ["Sign in and add a few dollars of credit under Billing.", "Tap Create Key.", "Copy it straight away (it's shown once) and paste it below."] },
  openai_compatible: { name: "Other", note: "For OpenRouter, Groq, Together or your own server that follows the OpenAI format.", url: "https://openrouter.ai/keys", link: "Example: OpenRouter keys", steps: ["Find the service's base URL, e.g. https://openrouter.ai/api/v1", "Create an API key on that service.", "Paste the URL and the key below."] },
};
// People often paste OpenRouter's dashboard address; the API address is different.
const fixBase = (u: string) => { try { const x = new URL(u); if (x.hostname.endsWith("openrouter.ai") && !x.pathname.startsWith("/api")) return "https://openrouter.ai/api/v1"; } catch {} return u; };
export default function Settings() {
  const [provider, setProvider] = useState("gemini"), [base, setBase] = useState(""), [key, setKey] = useState(""), [models, setModels] = useState<string[]>([]), [rec, setRec] = useState<any>({}),
    [main, setMain] = useState(""), [fast, setFast] = useState(""), [vision, setVision] = useState(""), [status, setStatus] = useState(""), [saved, setSaved] = useState<any>(null), [busy, setBusy] = useState(false), [saveMsg, setSaveMsg] = useState(""), [meta, setMeta] = useState<any>({}), [first, setFirst] = useState(false), [ready, setReady] = useState(false);
  const loadSaved = async () => { const { data } = await sb().from("user_ai_settings").select("provider,base_url,model_fast,model_strong,model_vision,key_hint").maybeSingle(); setSaved(data); if (data) { setProvider(data.provider); setBase(data.base_url || ""); setMain(data.model_strong); setFast(data.model_fast); setVision(data.model_vision || data.model_strong); } setReady(true); };
  useEffect(() => { loadSaved(); setFirst(location.search.includes("first=1")); }, []);
  const canFetch = ready && (provider !== "openai_compatible" || base.startsWith("https://")) && (key.trim().length >= 20 || (!key && saved?.provider === provider));
  useEffect(() => {
    setModels([]); if (!canFetch) return;
    const t = setTimeout(async () => {
      setStatus("Checking your key…");
      const r = await fetch("/api/ai-models", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ provider, key, base_url: base }) });
      const d = await r.json().catch(() => ({})); if (!r.ok) return setStatus(d.error || "Couldn't check the key.");
      setModels(d.models); setMeta(d.meta || {}); setRec(d.recommended);
      setMain((m) => (d.models.includes(m) ? m : d.recommended.main)); setFast((m) => (d.models.includes(m) ? m : d.recommended.fast)); setVision((m) => (d.models.includes(m) ? m : d.recommended.vision || d.recommended.main));
      setStatus(`✓ Key works. ${d.models.length} models found.`);
    }, 800);
    return () => clearTimeout(t);
  }, [key, provider, base, canFetch]);
  const save = async () => {
    setBusy(true);
    const r = await fetch("/api/ai-settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ provider, base_url: base, key, model_strong: main, model_fast: fast, model_vision: vision }) });
    const d = await r.json().catch(() => ({})); setBusy(false);
    if (!r.ok) return setSaveMsg(d.error || "Couldn't save."); setKey(""); setSaveMsg(first ? "Connected. Taking you to your dashboard…" : "Saved. You're ready to write."); loadSaved(); if (first) { dispatchEvent(new CustomEvent("cw-onb-set", { detail: { i: 1, sub: 0, f: false } })); setTimeout(() => { location.href = "/dashboard"; }, 900); }
  };
  const del = async () => { if (!confirm("Delete your saved AI key?")) return; await sb().from("user_ai_settings").delete().not("id", "is", null); setSaved(null); setModels([]); setMain(""); setSaveMsg("Key deleted."); };
  const sel = (v: string, set: (x: string) => void, r?: string, only?: (m: string) => boolean) => { const L = models.filter((m) => !only || only(m)), opt = (m: string) => <option key={m} value={m}>{m}{m === r ? " (recommended)" : ""}</option>; return <select aria-label="Model" style={{ maxWidth: "100%" }} value={v} onChange={(e) => set(e.target.value)}>{provider === "openai" || provider === "anthropic" ? L.map(opt) : <><optgroup label="Free (no billing needed)">{L.filter((m) => meta[m]?.free).map(opt)}</optgroup><optgroup label="Paid (needs billing)">{L.filter((m) => !meta[m]?.free).map(opt)}</optgroup></>}</select>; };
  const g = G[provider];
  return <>
    <h1>{first ? "Connect your AI to get started" : "Connect your AI"}</h1>
    <div className="card"><b>What's happening here</b><p style={{ margin: "6px 0" }}>ContextWrite doesn't come with its own AI. You connect your own account, so you stay in control of cost and privacy. Your key is encrypted on the server and never shown again. Setup takes three steps: pick a provider, paste a key, then confirm the model. The rest is automatic.</p></div>
    {first && <p><button className="sm" onClick={() => { dispatchEvent(new CustomEvent("cw-onb-set", { detail: { i: 1, sub: 0, f: false } })); setTimeout(() => { location.href = "/dashboard"; }, 150); }}>I'll do this later</button></p>}
    {saved && <div className="card"><b>Connected</b><br /><small>{G[saved.provider].name} · {saved.model_strong} · key {saved.key_hint}</small><p><Link href="/write"><button className="primary">Start writing</button></Link> <button onClick={del}>Delete key</button></p></div>}
    <section className="sec c1" data-coach="provider"><h2>1. Choose a provider</h2>
    <div>{Object.keys(G).map((k) => <button key={k} className={provider === k ? "primary" : ""} onClick={() => { setProvider(k); setKey(""); setStatus(""); if (k === "openai_compatible" && !base) setBase("https://openrouter.ai/api/v1"); }}>{G[k].name}</button>)}</div>
    <div className="card"><p style={{ margin: "0 0 6px" }}>{g.note}</p><ol style={{ margin: "0 0 8px" }}>{g.steps.map((s: string, i: number) => <li key={i}>{s}</li>)}</ol><a href={g.url} target="_blank" rel="noopener noreferrer">{g.link} ↗</a></div>
    {provider === "openai_compatible" && <><label>Base URL<input type="text" placeholder="https://openrouter.ai/api/v1" value={base} onChange={(e) => setBase(fixBase(e.target.value.trim()))} /></label></>}
    </section>
    <section className="sec c2" data-coach="key"><h2>2. Paste your key</h2>
    <input aria-label="API key" type="password" autoComplete="off" placeholder={saved?.provider === provider ? `Saved (${saved.key_hint}). Paste a new key only to replace it` : "Paste your API key"} value={key} onChange={(e) => setKey(e.target.value)} />
    <p role="status"><small>{status || "Models load automatically as soon as the key is pasted."}</small></p>
    </section>
    {!!models.length && <section className="sec c3" data-coach="model">
      <h2>3. Confirm the model</h2>
      <p>{sel(main, setMain, rec.main)}</p>
      <small>{provider === "openai" || provider === "anthropic" ? "This provider needs billing credit. The recommended pick is the most economical; choose a stronger one if you want higher quality." : "Free models are listed first and chosen by default. If your account has billing, you can pick a stronger paid model."} Old models, image or audio models and other non-writing models are hidden.</small>
      <details style={{ margin: "12px 0" }}><summary>Advanced (optional)</summary>
        <p><small>Quick tasks like reading documents use a cheaper, faster model:</small><br />{sel(fast, setFast, rec.fast)}</p>
        <p><small>Images are read by this model. Change it if your main model can't read images:</small><br />{sel(vision, setVision, rec.vision, (m) => !!meta[m]?.vision)}</p>
      </details>
      <button className="primary" disabled={busy || !main} onClick={save}>{busy ? "Saving…" : saved ? "Save changes" : "Save and connect"}</button>
      <p role="status" aria-live="polite">{saveMsg}</p>
    </section>}
  </>;
}
