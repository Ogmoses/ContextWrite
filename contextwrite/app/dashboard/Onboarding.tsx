"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { sb } from "@/lib/supabase/browser";
const S = [
  ["Connect your AI (one time, about a minute)", "ContextWrite uses your own AI account. Open AI settings, pick a provider, paste a key, and the rest is automatic."],
  ["Tell ContextWrite what you're trying to write", "Describe it in your own words. A rough idea or a brain-dump is fine."],
  ["Answer only the questions that matter", "It asks about the gaps that would change the writing and skips the rest. You can skip any question."],
  ["Review the context", "Before anything is drafted, you see what it understood and can correct it."],
  ["Generate", "It drafts from your context and never invents personal details."],
  ["Refine", "Edit by hand or use the quick actions. Every version is saved."],
];
export default function Onboarding() {
  const [i, setI] = useState(0), [show, setShow] = useState(false), [hasAi, setHasAi] = useState(true);
  useEffect(() => {
    (async () => {
      const c = sb(), { data: { user } } = await c.auth.getUser(); if (!user) return;
      const { data: s } = await c.from("settings").select("settings_json").maybeSingle();
      if (!s) await c.from("settings").upsert({ user_id: user.id, settings_json: {} }, { onConflict: "user_id" });
      if (!s?.settings_json?.onboarded) setShow(true);
      const { data: a } = await c.from("user_ai_settings").select("provider").maybeSingle(); setHasAi(!!a);
    })();
  }, []);
  const done = async () => {
    setShow(false); const c = sb(), { data: { user } } = await c.auth.getUser();
    const { data } = await c.from("settings").select("settings_json").maybeSingle();
    await c.from("settings").upsert({ user_id: user!.id, settings_json: { ...(data?.settings_json || {}), onboarded: true } }, { onConflict: "user_id" });
  };
  if (show) return <section className="card" aria-label="Quick tour">
    <small>Step {i + 1} of {S.length}</small><h3 style={{ margin: "4px 0" }}>{S[i][0]}</h3><p>{S[i][1]}</p>
    {i === 0 && <p><Link href="/settings"><button className="primary">Open AI settings</button></Link></p>}
    {i > 0 && <button onClick={() => setI(i - 1)}>Back</button>}
    {i < S.length - 1 ? <button className={i ? "primary" : ""} onClick={() => setI(i + 1)}>Next</button> : <button className="primary" onClick={done}>Got it</button>}
    <button onClick={done}>Skip tour</button>
  </section>;
  return <>
    {!hasAi && <section className="card" aria-label="Getting started"><b>Next step: connect your AI</b><p style={{ margin: "6px 0" }}>Writing needs an AI account. It takes about a minute.</p><Link href="/settings"><button className="primary">Connect your AI</button></Link></section>}
    <button onClick={() => { setI(0); setShow(true); }}>Quick tour</button>
  </>;
}
