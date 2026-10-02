"use client";
import { useState } from "react";
import { sb } from "@/lib/supabase/browser";
export default function Login() {
  const [email, setE] = useState(""), [pw, setP] = useState(""), [msg, setM] = useState(""), [busy, setB] = useState(false);
  const run = async (label: string, fn: () => Promise<void>) => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return setM("This site was built without its Supabase settings. In Vercel, add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, then redeploy.");
    setB(true); setM(label);
    try { await fn(); } catch (e: any) { console.error(e); setM("Something went wrong: " + (e?.message || "unknown error")); }
    setB(false);
  };
  const login = () => run("Signing in…", async () => {
    if (!email || !pw) return setM("Enter your email and password.");
    const { error } = await sb().auth.signInWithPassword({ email, password: pw });
    if (error) return setM(error.message);
    location.href = "/dashboard";
  });
  const signup = () => run("Creating your account…", async () => {
    if (!email || pw.length < 6) return setM("Enter your email and a password of at least 6 characters.");
    const { data, error } = await sb().auth.signUp({ email, password: pw, options: { emailRedirectTo: location.origin + "/dashboard" } });
    if (error) return setM(error.message);
    if (!data.session) return setM("Check your email and tap the verification link, then log in.");
    location.href = "/dashboard";
  });
  const reset = () => run("Sending reset link…", async () => {
    if (!email) return setM("Enter your email first.");
    const { error } = await sb().auth.resetPasswordForEmail(email, { redirectTo: location.origin + "/login" });
    if (error) return setM(error.message);
    setM("If that email has an account, a reset link is on its way.");
  });
  return <>
    <h1>Sign in</h1>
    <input aria-label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setE(e.target.value)} placeholder="Email" />
    <input aria-label="Password" type="password" autoComplete="current-password" value={pw} onChange={(e) => setP(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} placeholder="Password" />
    <p>
      <button type="button" className="primary" disabled={busy} onClick={login}>Log in</button>
      <button type="button" disabled={busy} onClick={signup}>Sign up</button>
      <button type="button" disabled={busy} onClick={reset}>Reset password</button>
    </p>
    <p role="status">{msg}</p>
  </>;
}
