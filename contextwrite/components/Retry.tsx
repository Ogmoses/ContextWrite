"use client";
import { useRouter } from "next/navigation";
export default function Retry() { const r = useRouter(); return <button className="primary" onClick={() => r.refresh()}>Try again</button>; }
