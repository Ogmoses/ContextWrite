"use client";
import { useState } from "react";
export default function AdminFeedback({ items }: { items: any[] }) {
  const [rows, setRows] = useState(items), [f, setF] = useState("all");
  const mark = async (id: string, status: string) => { const r = await fetch("/api/admin/feedback", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status }) }); if (r.ok) setRows(rows.map((x) => (x.id === id ? { ...x, status } : x))); };
  const list = rows.filter((x) => f === "all" || x.kind === f || (f === "new" && x.status === "new"));
  return <>
    <div>{["all", "new", "problem", "suggestion", "testimonial"].map((k) => <button key={k} className={"sm" + (f === k ? " primary" : "")} onClick={() => setF(k)}>{k[0].toUpperCase() + k.slice(1)}</button>)}</div>
    {!list.length && <p><small>Nothing here yet.</small></p>}
    {list.map((x) => <div key={x.id} className="card" style={{ opacity: x.status === "done" ? .6 : 1 }}>
      <b style={{ textTransform: "capitalize" }}>{x.kind}</b> <small>· {String(x.created_at).slice(0, 10)} · {x.users?.name || x.users?.email || "user"}{x.ok_to_publish ? " · OK to quote" : ""}</small>
      <p style={{ margin: "6px 0", whiteSpace: "pre-wrap" }}>{x.message}</p>
      <button className="sm" onClick={() => mark(x.id, x.status === "done" ? "new" : "done")}>{x.status === "done" ? "Reopen" : "Mark handled"}</button></div>)}
  </>;
}
