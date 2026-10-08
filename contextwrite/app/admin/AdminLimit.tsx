"use client";
import { useState } from "react";
export default function AdminLimit({ current }: { current: number }) {
  const [v, setV] = useState(String(current)), [msg, setMsg] = useState("");
  const save = async () => { const r = await fetch("/api/admin/limit", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ limit: v }) }); const d = await r.json().catch(() => ({})); setMsg(r.ok ? "Saved. Applies to the next AI request." : d.error || "Couldn't save."); };
  return <div className="card"><p style={{ margin: "0 0 6px" }}>Monthly AI requests per user (0 = unlimited). Resets on the 1st. Admins are exempt.</p>
    <input type="text" inputMode="numeric" aria-label="Monthly request limit" value={v} onChange={(e) => setV(e.target.value.replace(/\D/g, ""))} />
    <button className="primary sm" onClick={save}>Save limit</button> <small role="status">{msg}</small>
    <p style={{ margin: "8px 0 0" }}><small>Per-user override: <code>update public.users set monthly_limit = 100 where email = '…';</code></small></p></div>;
}
