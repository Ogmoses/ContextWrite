"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { sb } from "@/lib/supabase/browser";
type S = { i: number; sub: number; ts: number; dirty?: boolean };
const K = "cw-onb";
const STEPS = [
  { path: "/settings", name: "Connect your AI", subs: [
    { sel: '[data-coach="provider"]', t: "Pick your AI service", d: "Gemini is the easiest to start with and has a free tier. Tap the one you have an account with." },
    { sel: '[data-coach="key"]', t: "Paste your API key", d: "Use the link in the guide above to get one. Models load by themselves once it's pasted." },
    { sel: '[data-coach="model"]', t: "Confirm and save", d: "The best match is already selected. Tap Save and connect." }] },
  { path: "/voice", name: "Teach it your voice (optional)", subs: [
    { sel: '[data-coach="voice-samples"]', t: "Paste your own writing", d: "A message, email or essay you wrote. It studies your habits and builds a private voice profile." },
    { sel: '[data-coach="voice-profiles"]', t: "Your profiles live here", d: "Make a few, then merge them into one voice that keeps what they share. You can also do this later." }] },
  { path: "/dashboard", name: "Write your first piece", subs: [
    { sel: '[data-coach="start"]', t: "Start your first piece", d: "Describe what you're writing in your own words. It asks only what matters." }] },
];
export default function Coach() {
  const path = usePathname() || "/", router = useRouter();
  const [s, setS] = useState<S | null>(null), [hasAi, setHasAi] = useState<boolean | null>(null), [pos, setPos] = useState<any>(null);
  const ref = useRef<S | null>(null); ref.current = s;
  // Save locally first (survives refresh/offline), then sync to the account.
  const persist = useCallback(async (n: S) => {
    n = { ...n, ts: Date.now() }; setS(n);
    try { localStorage.setItem(K, JSON.stringify({ ...n, dirty: true })); } catch {}
    try {
      const c = sb(), { data: { user } } = await c.auth.getUser(); if (!user) throw 0;
      const { data } = await c.from("settings").select("settings_json").maybeSingle();
      const { error } = await c.from("settings").upsert({ user_id: user.id, settings_json: { ...(data?.settings_json || {}), onboarding: n } }, { onConflict: "user_id" }); if (error) throw error;
      localStorage.setItem(K, JSON.stringify({ ...n, dirty: false }));
    } catch {}
  }, []);
  useEffect(() => {
    (async () => {
      let local: S | null = null; try { local = JSON.parse(localStorage.getItem(K) || "null"); } catch {}
      try {
        const c = sb(), { data: { user } } = await c.auth.getUser(); if (!user) return;
        const { data } = await c.from("settings").select("settings_json").maybeSingle(), sj = data?.settings_json || {}, db: S | null = sj.onboarding || null;
        let cur: S;
        if (local?.dirty && (!db || local.ts >= db.ts)) cur = local; else if (db) cur = db; else if (sj.onboarded) cur = { i: 3, sub: 0, ts: Date.now() }; else cur = local || { i: 0, sub: 0, ts: Date.now() };
        setS(cur); if (cur !== db) persist(cur);
        const { data: a } = await c.from("user_ai_settings").select("provider").maybeSingle(); setHasAi(!!a);
      } catch { if (local) setS(local); }
    })();
    const online = () => { try { const l = JSON.parse(localStorage.getItem(K) || "null"); if (l?.dirty) persist(l); } catch {} };
    const restart = () => { persist({ i: 0, sub: 0, ts: 0 }); router.push("/settings"); };
    addEventListener("online", online); addEventListener("cw-restart-tour", restart);
    return () => { removeEventListener("online", online); removeEventListener("cw-restart-tour", restart); };
  }, []);
  const st = s && s.i < STEPS.length ? STEPS[s.i] : null, sub = st?.subs[s!.sub] || null, active = !!(st && sub && path === st.path), last = !!st && s!.sub >= st.subs.length - 1;
  const skip = () => s && persist({ i: s.i + 1, sub: 0, ts: 0 });
  const next = () => s && (last ? persist({ i: s.i + 1, sub: 0, ts: 0 }) : persist({ ...s, sub: s.sub + 1 }));
  // First-time users go straight to AI settings; finishing a step is detected automatically.
  useEffect(() => {
    if (!s) return;
    if (s.i === 0 && hasAi === false && path === "/dashboard") router.replace("/settings");
    if (s.i === 0 && hasAi) persist({ i: 1, sub: 0, ts: 0 });
    if (s.i === 2 && path.startsWith("/write")) persist({ i: 3, sub: 0, ts: 0 });
  }, [s, hasAi, path]);
  useEffect(() => {
    if (!s || s.i !== 0 || path !== "/settings") return;
    const id = setInterval(async () => { const { data } = await sb().from("user_ai_settings").select("provider").maybeSingle(); if (data) setHasAi(true); }, 2500);
    return () => clearInterval(id);
  }, [s?.i, path]);
  useEffect(() => {
    if (!active) { setPos(null); return; }
    let prev: Element | null = null, scrolled = "";
    const tick = () => {
      const el = document.querySelector(sub!.sel);
      if (prev && prev !== el) prev.classList.remove("coach-ring");
      if (s!.i === 0 && s!.sub === 1 && document.querySelector('[data-coach="model"]')) return void persist({ ...s!, sub: 2 });
      if (!el) { setPos({ fb: true }); return; }
      el.classList.add("coach-ring"); prev = el;
      const key = s!.i + "-" + s!.sub; if (scrolled !== key) { scrolled = key; el.scrollIntoView({ behavior: "smooth", block: el.getBoundingClientRect().height > 260 ? "start" : "center" }); }
      const r = el.getBoundingClientRect(), vw = innerWidth, vh = innerHeight, w = Math.min(320, vw - 24);
      if (r.height > 260 || r.bottom < 0 || r.top > vh) { setPos({ fb: true }); return; }
      const below = r.bottom + 190 < vh - 90, left = Math.max(12, Math.min(vw - w - 12, r.left + r.width / 2 - w / 2));
      setPos({ w, left, below, y: below ? r.bottom + 14 : vh - r.top + 14, ax: Math.max(18, Math.min(w - 30, r.left + r.width / 2 - left - 6)) });
    };
    tick(); const id = setInterval(tick, 400);
    return () => { clearInterval(id); prev?.classList.remove("coach-ring"); document.querySelectorAll(".coach-ring").forEach((e) => e.classList.remove("coach-ring")); };
  }, [active, s?.i, s?.sub]);
  if (active && sub) {
    const p = pos || { fb: true };
    return <div key={s!.i + "-" + s!.sub} className={"coach" + (p.fb ? " fb" : "")} role="dialog" aria-label="Guided setup" aria-live="polite" style={p.fb ? undefined : { left: p.left, width: p.w, ...(p.below ? { top: p.y } : { bottom: p.y }) }}>
      {!p.fb && <span className={"arrow " + (p.below ? "up" : "down")} style={{ left: p.ax }} />}
      <div className="cdots">{st!.subs.map((_, k) => <i key={k} className={k <= s!.sub ? "on" : ""} />)}<small>{st!.name}</small></div>
      <h4>{sub.t}</h4><p>{sub.d}</p>
      <div className="crow"><button className="primary sm" onClick={next}>{last ? "Got it" : "Next"}</button><button className="sm" onClick={skip}>Skip this step</button></div>
    </div>;
  }
  if (st && !path.startsWith("/write")) return <div className="coach fb toast" role="status"><h4>Next: {st.name}</h4><div className="crow"><button className="primary sm" onClick={() => router.push(st.path)}>Take me there</button><button className="sm" onClick={skip}>Skip</button></div></div>;
  return null;
}
