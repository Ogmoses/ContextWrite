"use client";
import { useState } from "react";
import { sb } from "@/lib/supabase/browser";
export default function Settings() {
  const [f, setF] = useState<any>({ provider: "anthropic", base_url: "", model_fast: "", model_strong: "", model_vision: "", key: "" }), [m, setM] = useState("");
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  const save = async () => { const r = await fetch("/api/ai-settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) }); setM(r.ok ? "Saved. Your key is encrypted and never shown again." : (await r.json()).error); setF({ ...f, key: "" }); };
  return <><h1>AI provider</h1><p>Use your own key. Model names come from your provider's docs.</p>
  <select aria-label="Provider" value={f.provider} onChange={set("provider")}><option value="anthropic">Anthropic</option><option value="openai">OpenAI</option><option value="gemini">Google Gemini</option><option value="openai_compatible">OpenAI-compatible (custom URL)</option></select><br />
  {f.provider === "openai_compatible" && <><input aria-label="Base URL" placeholder="https://api.example.com/v1" value={f.base_url} onChange={set("base_url")} /><br /></>}
  <input aria-label="Fast model" placeholder="Fast model (cheap tasks)" value={f.model_fast} onChange={set("model_fast")} /><br />
  <input aria-label="Strong model" placeholder="Strong model (writing)" value={f.model_strong} onChange={set("model_strong")} /><br />
  <input aria-label="Vision model" placeholder="Vision model (optional, to read images)" value={f.model_vision} onChange={set("model_vision")} /><br />
  <input aria-label="API key" type="password" placeholder="API key" value={f.key} onChange={set("key")} autoComplete="off" /><br />
  <button className="primary" onClick={save}>Save</button> <button onClick={async () => { await sb().from("user_ai_settings").delete().not("id", "is", null); setM("Key deleted."); }}>Delete key</button><p role="status">{m}</p></>;
}
