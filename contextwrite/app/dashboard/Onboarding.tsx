"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { sb } from "@/lib/supabase/browser";
export default function Onboarding() {
  const [hasAi, setHasAi] = useState(true);
  useEffect(() => { sb().from("user_ai_settings").select("provider").maybeSingle().then(({ data }) => setHasAi(!!data)); }, []);
  return <>
    {!hasAi && <section className="card" aria-label="Getting started"><b>Next step: connect your AI</b><p style={{ margin: "6px 0" }}>Writing needs an AI account. It takes about a minute.</p><Link href="/settings"><button className="primary">Connect your AI</button></Link></section>}
    <button className="sm" onClick={() => dispatchEvent(new Event("cw-restart-tour"))}>Guided tour</button>
  </>;
}
