"use client";
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase/browser";
import Logo from "@/components/Logo";
import Icon from "@/components/Icon";
import { BRAND } from "@/lib/brand";
type Mode = "login" | "signup" | "reset" | "newpw";
const T: Record<Mode, [string, string, string]> = { login: ["Sign in to your account", "Welcome back. Pick up where you left off.", "Log in"], signup: ["Create your account", "Start writing in your own voice.", "Sign up"], reset: ["Reset your password", "We'll email you a reset link.", "Send reset link"], newpw: ["Choose a new password", "Make it one you'll remember.", "Save new password"] };
export default function Login() {
  const [mode, setMode] = useState<Mode>("login"), [email, setE] = useState(""), [pw, setP] = useState(""), [first, setF] = useState(""), [last, setL] = useState(""), [msg, setM] = useState(""), [busy, setB] = useState(false), [show, setShow] = useState(false);
  useEffect(() => { const m = new URLSearchParams(location.search).get("mode"); if (m === "newpw") setMode("newpw"); if (m === "expired") setM("That link has expired or was already used. Request a new one."); }, []);
  const to = (m: Mode) => { setMode(m); setM(""); };
  const google = async () => { const { error } = await sb().auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + "/auth/callback?next=/dashboard" } }); if (error) setM("Google sign-in isn't set up yet."); };
  const submit = async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return setM("This site was built without its Supabase settings. Add them in Vercel and redeploy.");
    if (mode !== "newpw" && !email) return setM("Enter your email.");
    if (mode !== "reset" && pw.length < 6) return setM(mode === "login" ? "Enter your password." : "Use a password of at least 6 characters.");
    setB(true); setM("Working…");
    try {
      const c = sb(), o = location.origin;
      if (mode === "login") { const { error } = await c.auth.signInWithPassword({ email, password: pw }); if (error) setM(error.message); else location.href = "/dashboard"; }
      else if (mode === "signup") { const { data, error } = await c.auth.signUp({ email, password: pw, options: { data: { name: `${first} ${last}`.trim() || undefined }, emailRedirectTo: o + "/auth/callback?next=/dashboard" } }); if (error) setM(error.message); else if (!data.session) setM("Check your email and tap the verification link, then log in."); else location.href = "/dashboard"; }
      else if (mode === "reset") { const { error } = await c.auth.resetPasswordForEmail(email, { redirectTo: o + "/auth/callback?next=" + encodeURIComponent("/login?mode=newpw") }); setM(error ? error.message : "If that email has an account, a reset link is on its way."); }
      else { const { error } = await c.auth.updateUser({ password: pw }); if (error) setM(error.message); else location.href = "/dashboard"; }
    } catch (e: any) { console.error(e); setM("Something went wrong: " + (e?.message || "unknown error")); }
    setB(false);
  };
  const [h, sub, go] = T[mode], gbtn = BRAND.googleLogin && (mode === "login" || mode === "signup");
  return <>
    <div className="hd"><Logo /><h1>{h}</h1><p>{sub}</p></div>
    <div className="card pull">
      {gbtn && <><button className="alt" onClick={google}>Continue with Google</button><div className="or">or {mode === "login" ? "log in" : "sign up"} with email</div></>}
      {mode === "signup" && <div className="row2"><input aria-label="First name" placeholder="First name" value={first} onChange={(e) => setF(e.target.value)} /><input aria-label="Last name" placeholder="Last name" value={last} onChange={(e) => setL(e.target.value)} /></div>}
      {mode !== "newpw" && <input aria-label="Email" type="email" autoComplete="email" placeholder="Email" value={email} onChange={(e) => setE(e.target.value)} />}
      {mode !== "reset" && <div className="pw"><input aria-label="Password" type={show ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder={mode === "newpw" ? "New password" : "Password"} value={pw} onChange={(e) => setP(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} /><button type="button" className="eye" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)}><Icon n={show ? "eyeoff" : "eye"} /></button></div>}
      {mode === "login" && <div className="meta"><span /><button type="button" style={{ background: "none", border: 0, minHeight: 0, padding: 0, color: "var(--link)" }} onClick={() => to("reset")}>Forgot password?</button></div>}
      <button type="button" className="primary go" disabled={busy} onClick={submit}>{go}</button>
      <p role="status" style={{ margin: "8px 0 0", color: "var(--mute)", fontSize: 14 }}>{msg}</p>
      <p className="foot">{mode === "login" ? <>Don't have an account? <button type="button" onClick={() => to("signup")}>Sign up</button></> : mode !== "newpw" && <>Already have an account? <button type="button" onClick={() => to("login")}>Log in</button></>}</p>
    </div>
  </>;
}
