"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import Icon from "./Icon";
import { BRAND } from "@/lib/brand";
export default function Shell({ children }: { children: React.ReactNode }) {
  const p = usePathname() || "/", auth = p.startsWith("/login"), pill = !auth && p !== "/";
  const on = (h: string) => p.startsWith(h) ? "on" : "";
  return <>
    {!auth && <header className="top"><Link href="/" className="brand"><Logo size={30} />{BRAND.name}</Link></header>}
    {auth ? <div className="authwrap">{children}</div> : <main>{children}</main>}
    {pill && <nav className="pill" aria-label="Main">
      <Link href="/dashboard" className={on("/dashboard")}><Icon n="home" />Home</Link>
      <Link href="/write" className="plus" aria-label="New writing"><Icon n="plus" size={24} /></Link>
      <Link href="/voice" className={on("/voice")}><Icon n="wave" />Voice</Link>
      <Link href="/account" className={on("/account") || on("/settings")}><Icon n="user" />Account</Link>
    </nav>}
  </>;
}
