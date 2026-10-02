"use client";
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase/browser";
const S = [
  ["Tell ContextWrite what you're trying to write", "Describe it in your own words. A rough idea or a brain-dump is fine."],
  ["Answer only the questions that matter", "It asks about the gaps that would change the writing and skips the rest. You can skip any question."],
  ["Review the context", "Before anything is drafted, you see what it understood and can correct it."],
  ["Generate", "It drafts from your context and never invents personal details."],
  ["Refine", "Edit by hand or use the quick actions. Every version is saved."],
];
export default function Onboarding() {
  const [i, setI] = useState(0), [show, setShow] = useState(false);
  useEffect(() => { sb().from("settings").select("settings_json").maybeSingle().then(({ data }) => { if (data && !data.settings_json?.onboarded) setShow(true); }); }, []);
  const done = async () => {
    setShow(false); const c = sb(); const { data: { user } } = await c.auth.getUser();
    const { data } = await c.from("settings").select("settings_json").maybeSingle();
    await c.from("settings").update({ settings_json: { ...(data?.settings_json || {}), onboarded: true } }).eq("user_id", user!.id);
  };
  if (!show) return null;
  return <section className="card" aria-label="Quick tour">
    <small>Step {i + 1} of {S.length}</small>
    <h3 style={{ margin: "4px 0" }}>{S[i][0]}</h3>
    <p>{S[i][1]}</p>
    {i > 0 && <button onClick={() => setI(i - 1)}>Back</button>}
    {i < S.length - 1 ? <button className="primary" onClick={() => setI(i + 1)}>Next</button> : <button className="primary" onClick={done}>Got it</button>}
    <button onClick={done}>Skip tour</button>
  </section>;
}
