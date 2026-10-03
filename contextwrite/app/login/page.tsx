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
  useEffect(() => { const m = new URLSearchParams(location.search).get("mode"); if (m === "newpw") setMode("newpw"); if (m === "oauth_error") setM("Google sign-in didn't complete. Try again, or use your email instead."); if (m === "expired") setM("That link has expired or was already used. Request a new one."); }, []);
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
      {gbtn && <><button className="alt" onClick={google} style={{ display: "flex", gap: 10, justifyContent: "center", alignItems: "center" }}><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.2C12.4 13.6 17.7 9.5 24 9.5z" /><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" /><path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.2C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.2z" /><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.2C6.5 42.6 14.6 48 24 48z" /></svg>Continue with Google</button><div className="or">or {mode === "login" ? "log in" : "sign up"} with email</div></>}
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
