"use client";
import { useEffect, useState } from "react";
import { sb } from "@/lib/supabase/browser";
type Mode = "login" | "signup" | "reset" | "newpw";
const TITLE: Record<Mode, string> = { login: "Sign in", signup: "Create your account", reset: "Reset your password", newpw: "Choose a new password" };
const GO: Record<Mode, string> = { login: "Log in", signup: "Sign up", reset: "Send reset link", newpw: "Save new password" };
export default function Login() {
  const [mode, setMode] = useState<Mode>("login"), [email, setE] = useState(""), [pw, setP] = useState(""), [msg, setM] = useState(""), [busy, setB] = useState(false);
  useEffect(() => {
    const m = new URLSearchParams(location.search).get("mode");
    if (m === "newpw") setMode("newpw");
    if (m === "expired") setM("That link has expired or was already used. Request a new one.");
  }, []);
  const to = (m: Mode) => { setMode(m); setM(""); };
  const submit = async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return setM("This site was built without its Supabase settings. Add them in Vercel and redeploy.");
    if (mode !== "newpw" && !email) return setM("Enter your email.");
    if (mode !== "reset" && pw.length < 6) return setM(mode === "login" ? "Enter your password." : "Use a password of at least 6 characters.");
    setB(true); setM("Working…");
    try {
      const c = sb(), o = location.origin;
      if (mode === "login") { const { error } = await c.auth.signInWithPassword({ email, password: pw }); if (error) setM(error.message); else location.href = "/dashboard"; }
      else if (mode === "signup") { const { data, error } = await c.auth.signUp({ email, password: pw, options: { emailRedirectTo: o + "/auth/callback?next=/dashboard" } }); if (error) setM(error.message); else if (!data.session) setM("Check your email and tap the verification link, then log in."); else location.href = "/dashboard"; }
      else if (mode === "reset") { const { error } = await c.auth.resetPasswordForEmail(email, { redirectTo: o + "/auth/callback?next=" + encodeURIComponent("/login?mode=newpw") }); setM(error ? error.message : "If that email has an account, a reset link is on its way."); }
      else { const { error } = await c.auth.updateUser({ password: pw }); if (error) setM(error.message); else location.href = "/dashboard"; }
    } catch (e: any) { console.error(e); setM("Something went wrong: " + (e?.message || "unknown error")); }
    setB(false);
  };
  return <>
    <h1>{TITLE[mode]}</h1>
    {mode !== "newpw" && <input aria-label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setE(e.target.value)} placeholder="Email" />}
    {mode !== "reset" && <input aria-label={mode === "newpw" ? "New password" : "Password"} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={pw} onChange={(e) => setP(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder={mode === "newpw" ? "New password" : "Password"} />}
    <p><button type="button" className="primary" disabled={busy} onClick={submit}>{GO[mode]}</button></p>
    <p role="status">{msg}</p>
    <p>
      {mode === "login" && <><button type="button" onClick={() => to("signup")}>Create an account</button><button type="button" onClick={() => to("reset")}>Forgot password?</button></>}
      {(mode === "signup" || mode === "reset") && <button type="button" onClick={() => to("login")}>Back to sign in</button>}
    </p>
  </>;
}
