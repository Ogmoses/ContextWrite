"use client";
import { useState } from "react";
import Link from "next/link";
import { sb } from "@/lib/supabase/browser";
export default function List({ rows }: { rows: any[] }) {
  const [items, setItems] = useState(rows), [q, setQ] = useState(""), [err, setErr] = useState("");
  const shown = items.filter((r) => (r.title + " " + r.type).toLowerCase().includes(q.toLowerCase()));
  const del = async (r: any) => {
    if (!confirm(`Delete "${r.title}" and all its drafts? This can't be undone.`)) return;
    const { error } = await sb().from("projects").delete().eq("id", r.id);
    if (error) return setErr("Couldn't delete that project. Try again.");
    setItems(items.filter((x) => x.id !== r.id));
  };
  const out = async () => { await sb().auth.signOut(); location.href = "/"; };
  if (!items.length) return <><h3>Your next idea starts here.</h3><p>Tell us what you're trying to write. You don't need to have it figured out yet.</p><Link href="/write"><button className="primary">Start Writing</button></Link><p><button onClick={out}>Log out</button></p></>;
  return <>
    <input aria-label="Search projects" placeholder="Search projects" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: "100%", padding: 10 }} />
    <p role="alert">{err}</p>
    {shown.map((r) => <div key={r.id} className="card">
      <b>{r.title}</b><br />
      <small>{r.type} · {r.status} · {r.words} words · {r.version ? "v" + r.version : "no draft yet"} · {r.updated}</small><br />
      <Link href={`/write?id=${r.id}`}><button>Continue</button></Link> <button onClick={() => del(r)} aria-label={`Delete ${r.title}`}>Delete</button>
    </div>)}
    {!shown.length && <p>No projects match "{q}".</p>}
    <p><button onClick={out}>Log out</button></p>
  </>;
}
