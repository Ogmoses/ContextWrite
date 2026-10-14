"use client";
import { useEffect, useState } from "react";
export default function NetBanner() {
  const [off, setOff] = useState(false);
  useEffect(() => { const u = () => setOff(!navigator.onLine); u(); addEventListener("online", u); addEventListener("offline", u); return () => { removeEventListener("online", u); removeEventListener("offline", u); }; }, []);
  return off ? <div className="netbar" role="status">You're offline. We'll reconnect automatically when your connection returns.</div> : null;
}
