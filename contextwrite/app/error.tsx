"use client";
import { useEffect } from "react";
export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); fetch("/api/client-error", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ path: location.pathname }) }).catch(() => {}); }, [error]);
  return <div className="card" role="alert"><h2 style={{ marginTop: 0 }}>Something went wrong on this page</h2><p>Your work is saved. Trying again usually fixes it.</p><button className="primary" onClick={reset}>Try again</button><a href="/dashboard"><button>Go to dashboard</button></a></div>;
}
