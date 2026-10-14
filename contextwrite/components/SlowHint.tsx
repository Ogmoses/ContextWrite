"use client";
import { useEffect, useState } from "react";
export default function SlowHint() {
  const [slow, setSlow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setSlow(true), 8000); return () => clearTimeout(t); }, []);
  return slow ? <p role="status" className="card">Taking longer than usual. Please check your connection. We'll keep trying. <a href="/dashboard">Reload</a></p> : null;
}
