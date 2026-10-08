"use client";
import { useEffect } from "react";
// Records how long a visit lasted (a number only) when the page is hidden or closed.
export default function Analytics() {
  useEffect(() => {
    let t0 = Date.now(), sent = false;
    const send = () => { const s = Math.round((Date.now() - t0) / 1000); if (sent || s < 5) return; sent = true; try { navigator.sendBeacon("/api/track", new Blob([JSON.stringify({ name: "session", props: { seconds: Math.min(s, 14400) } })], { type: "application/json" })); } catch {} };
    const vis = () => { if (document.visibilityState === "hidden") send(); else { t0 = Date.now(); sent = false; } };
    addEventListener("pagehide", send); document.addEventListener("visibilitychange", vis);
    return () => { removeEventListener("pagehide", send); document.removeEventListener("visibilitychange", vis); };
  }, []);
  return null;
}
