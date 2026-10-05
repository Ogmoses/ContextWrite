"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import Icon from "./Icon";
import { useEffect, useRef, useState } from "react";
import { sb } from "@/lib/supabase/browser";
import { BRAND } from "@/lib/brand";
import Coach from "./Coach";
import FloatingFeedback from "./FloatingFeedback";
export default function Shell({ children }: { children: React.ReactNode }) {
  const p = usePathname() || "/", auth = p.startsWith("/login"), pill = !auth && p !== "/";
  const [dark, setDark] = useState(false), [authed, setAuthed] = useState(false);
  useEffect(() => {
    const t = document.documentElement.dataset.theme;
    setDark(t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches);
    sb().auth.getUser().then(({ data }) => setAuthed(!!data.user)).catch(() => {});
  }, [p]);
  const flip = () => { const n = dark ? "light" : "dark"; document.documentElement.dataset.theme = n; try { localStorage.setItem("cw-theme", n); } catch {} setDark(!dark); };
  const out = async () => { await sb().auth.signOut(); location.href = "/"; };
  const nav = useRef<HTMLElement>(null), [bub, setBub] = useState<any>({ opacity: 0 });
  useEffect(() => { const n = nav.current; if (!n) return; const a = n.querySelector("a.on:not(.plus)") as HTMLElement | null; setBub(a ? { left: a.offsetLeft, width: a.offsetWidth, opacity: 1 } : (b: any) => ({ ...b, opacity: 0 })); }, [p, authed]);
  if (p === "/") return <>{children}</>;
  const on = (h: string) => p.startsWith(h) ? "on" : "";
  return <>
    {!auth && <header className="top"><div className="hi"><Link href="/" className="brand"><Logo size={30} />{BRAND.name}</Link>
      <button className="ib" aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} onClick={flip}><Icon n={dark ? "sun" : "moon"} /></button>
      {authed && <Link href="/settings" className="ib" aria-label="AI settings" title="AI settings"><Icon n="sliders" /></Link>}
      {authed && <button className="ib" aria-label="Log out" onClick={out}><Icon n="logout" /></button>}</div></header>}
    {auth ? <div className="authwrap">{children}</div> : <main>{children}</main>}
    {!auth && <Coach />}
    {!auth && authed && <FloatingFeedback />}
    {pill && <nav className="pill" aria-label="Main" ref={nav}><span className="bubble" style={bub} aria-hidden="true" />
      <Link href="/dashboard" className={on("/dashboard")}><Icon n="home" />Home</Link>
      <Link href="/write" className="plus" aria-label="New writing"><Icon n="plus" size={24} /></Link>
      <Link href="/voice" className={on("/voice")}><Icon n="wave" />Voice</Link>
      <Link href="/account" className={on("/account") || on("/settings")}><Icon n="user" />Account</Link>
    </nav>}
  </>;
}
