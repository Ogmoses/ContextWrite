"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Feedback from "@/components/Feedback";
import { sb } from "@/lib/supabase/browser";
const T = ["users", "settings", "projects", "project_context", "context_answers", "drafts", "voice_profiles", "writing_samples", "documents"];
export default function Account() {
  const [email, setEmail] = useState(""), [msg, setMsg] = useState(""), [conf, setConf] = useState(""), [busy, setBusy] = useState(false);
  useEffect(() => { sb().auth.getUser().then(({ data }) => setEmail(data.user?.email || "")); }, []);
  const [usage, setUsage] = useState<any>(null), [newEmail, setNewEmail] = useState(""), [pw1, setPw1] = useState(""), [pw2, setPw2] = useState(""), [msgE, setMsgE] = useState(""), [msgP, setMsgP] = useState(""), [wait, setWait] = useState(false);
  const changeEmail = async () => {
    const e = newEmail.trim(); if (!/^\S+@\S+\.\S+$/.test(e)) return setMsgE("Enter a valid email address.");
    setWait(true); setMsgE("");
    const { error } = await sb().auth.updateUser({ email: e }, { emailRedirectTo: location.origin + "/auth/callback?next=/account" });
    setWait(false); if (error) return setMsgE(/reauth|recent/i.test(error.message) ? "For safety, log out and log back in, then try again." : error.message);
    setNewEmail(""); setMsgE("Check your current and your new inbox, and tap the confirmation link in each. Your login email changes once both are confirmed.");
  };
  const changePw = async () => {
    if (pw1.length < 8) return setMsgP("Use at least 8 characters."); if (pw1 !== pw2) return setMsgP("The two passwords don't match.");
    setWait(true); setMsgP("");
    const { error } = await sb().auth.updateUser({ password: pw1 }); setWait(false);
    if (error) return setMsgP(/reauth|recent|nonce/i.test(error.message) ? "For safety, log out and log back in, then try again." : error.message);
    setPw1(""); setPw2(""); setMsgP("Password changed. Use it next time you log in.");
  };
  useEffect(() => { sb().from("ai_usage").select("input_tokens,output_tokens").gte("created_at", new Date(Date.now() - 30 * 864e5).toISOString()).limit(5000).then(({ data }) => setUsage({ n: data?.length || 0, i: (data || []).reduce((a: number, r: any) => a + (r.input_tokens || 0), 0), o: (data || []).reduce((a: number, r: any) => a + (r.output_tokens || 0), 0) })); }, []);
  const exportAll = async () => {
    setBusy(true); setMsg("Collecting your data…");
    try {
      const c = sb(), out: any = { exported_at: new Date().toISOString() };
      for (const t of T) { const { data, error } = await c.from(t).select("*"); if (error) throw error; out[t] = data; }
      out.ai_settings = (await c.from("user_ai_settings").select("provider,base_url,model_fast,model_strong,key_hint")).data;
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: "application/json" })); a.download = "contextwrite-my-data.json"; document.body.append(a); a.click(); a.remove();
      setMsg("Downloaded. Your AI key is never included.");
    } catch { setMsg("Couldn't export your data. Try again."); }
    setBusy(false);
  };
  const del = async () => {
    setBusy(true); setMsg("");
    const r = await fetch("/api/account", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ confirm: conf }) });
    if (!r.ok) { setBusy(false); return setMsg((await r.json()).error); }
    await sb().auth.signOut(); location.href = "/";
  };
  return <>
    <h1>Account</h1>
    <section className="sec c1"><p style={{ margin: "0 0 8px" }}>Signed in as <b>{email}</b></p>
    <button onClick={async () => { await sb().auth.signOut(); location.href = "/"; }}>Log out</button>
    </section>
    <section className="sec c5"><h2>Sign-in details</h2>
      <b>Change email</b><input type="email" autoComplete="email" aria-label="New email" placeholder="New email address" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
      <button disabled={wait || !newEmail} onClick={changeEmail}>Change email</button> <small role="status">{msgE}</small>
      <p style={{ margin: "16px 0 0" }}><b>Change password</b> <small>(also works if you signed in with Google and want a password too)</small></p>
      <input type="password" autoComplete="new-password" aria-label="New password" placeholder="New password (8+ characters)" value={pw1} onChange={(e) => setPw1(e.target.value)} />
      <input type="password" autoComplete="new-password" aria-label="Confirm new password" placeholder="Confirm new password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
      <button disabled={wait || !pw1} onClick={changePw}>Change password</button> <small role="status">{msgP}</small></section>
    <section className="sec c2"><h2>Your data</h2>
    <p>Download everything ContextWrite holds about you as one file: projects, answers, drafts and versions, voice profiles and samples, and saved context.</p>
    <button disabled={busy} onClick={exportAll}>Export all my data</button>
    <p>Delete a single project from your <Link href="/dashboard">dashboard</Link>, or manage voice data on <Link href="/voice">Your voice</Link>. Your AI key is removed from <Link href="/settings">AI settings</Link>.</p>
    <p role="status"><small>{msg}</small></p>
    </section>
    <section className="sec c4"><h2>AI usage</h2>
      <p style={{ margin: "0 0 6px" }}>{usage ? <>Last 30 days: <b>{usage.n.toLocaleString("en-GB")}</b> requests · <b>{usage.i.toLocaleString("en-GB")}</b> tokens in · <b>{usage.o.toLocaleString("en-GB")}</b> tokens out</> : "Loading…"}</p>
      <small>You're billed by your own AI provider, not by ContextWrite. Token counts come from your provider and only cover requests made since this update.</small></section>
    <section className="sec c3"><h2>Delete account</h2>
    <div>
      <p>This permanently deletes your account and everything in it: projects, drafts, versions, voice profiles, samples, uploaded files, saved context and your AI key. It can't be undone. Export your data first if you want a copy.</p>
      <label>Type DELETE to confirm<input type="text" value={conf} onChange={(e) => setConf(e.target.value)} autoComplete="off" /></label>
      <button disabled={busy || conf !== "DELETE"} onClick={del}>Delete my account permanently</button>
    </div></section>
    <p style={{ textAlign: "center" }}><small><Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link></small></p>
  </>;
}
