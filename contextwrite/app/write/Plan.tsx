"use client";
import { useState } from "react";
import { sb } from "@/lib/supabase/browser";
const L = ({ t, a }: { t: string; a?: any[] }) => a?.length ? <><small>{t}</small><ul>{a.map((x, i) => <li key={i}>{typeof x === "string" ? x : JSON.stringify(x)}</li>)}</ul></> : null;
export default function Plan({ projectId }: { projectId: string }) {
  const [plan, setPlan] = useState<any>(null), [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [msg, setMsg] = useState("");
  const gen = async () => {
    setBusy(true); setMsg("Building your writing plan…");
    try { const r = await fetch("/api/plan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ projectId }) }); const d = await r.json(); if (!r.ok) setMsg(d.error); else { setPlan(d); setMsg(""); } } catch { setMsg("Something went wrong. Try again."); }
    setBusy(false);
  };
  const toggle = async () => { if (open) return setOpen(false); setOpen(true); if (plan) return; const { data } = await sb().from("project_context").select("strategy_json").eq("project_id", projectId).maybeSingle(); if (data?.strategy_json) setPlan(data.strategy_json); else gen(); };
  return <div style={{ margin: "8px 0" }}>
    <button onClick={toggle} aria-expanded={open}>{open ? "Hide writing plan" : "View writing plan"}</button>
    {open && <div className="card"><small role="status">{msg}</small>
      {plan && <>
        <p><b>Central message.</b> {plan.central_message}</p><p><b>Angle.</b> {plan.angle}</p><p><b>Emotional path.</b> {plan.emotional_trajectory}</p>
        {!!plan.structure?.length && <><small>Structure</small><ol>{plan.structure.map((s: any, i: number) => <li key={i}><b>{s.part}:</b> {s.purpose}</li>)}</ol></>}
        <p><b>Opening.</b> {plan.opening}</p><p><b>Ending.</b> {plan.ending}</p><p><b>Voice.</b> {plan.voice_strategy}</p>
        <L t="Assumptions about the reader" a={plan.audience_assumptions} /><L t="Details I'll use" a={plan.details_to_use} /><L t="Left out on purpose" a={plan.details_to_omit} /><L t="Watch-outs" a={plan.cautions} />
        <p><small>The plan guides the draft. If it's off, correct the context above and the plan resets.</small></p>
        <button disabled={busy} onClick={gen}>Regenerate plan</button></>}
    </div>}
  </div>;
}
