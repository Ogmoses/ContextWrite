"use client";
import { useState } from "react";
import { sb } from "@/lib/supabase/browser";
export default function Login() {
  const [email, setE] = useState(""), [pw, setP] = useState(""), [msg, setM] = useState("");
  const go = async (up: boolean) => {
    const c = sb(); const r = up ? await c.auth.signUp({ email, password: pw, options: { emailRedirectTo: location.origin + "/dashboard" } }) : await c.auth.signInWithPassword({ email, password: pw });
    if (r.error) return setM(r.error.message); if (up && !r.data.session) return setM("Check your email to verify your account."); location.href = "/dashboard";
  };
  const reset = async () => { await sb().auth.resetPasswordForEmail(email, { redirectTo: location.origin + "/login" }); setM("If that email exists, a reset link is on its way."); };
  return <><h1>Sign in</h1><input aria-label="Email" type="email" value={email} onChange={(e) => setE(e.target.value)} placeholder="Email" /><br /><input aria-label="Password" type="password" value={pw} onChange={(e) => setP(e.target.value)} placeholder="Password" /><br />
  <button onClick={() => go(false)}>Log in</button> <button onClick={() => go(true)}>Sign up</button> <button onClick={reset}>Reset password</button><p role="status">{msg}</p></>;
}
