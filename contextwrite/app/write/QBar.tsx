import Link from "next/link";
import Icon from "@/components/Icon";
export default function QBar({ qa, score, title, busy, onJump }: { qa: any[]; score: number; title: string; busy: boolean; onJump: (i: number) => void }) {
  return <div className="qbar">
    <div className="qh">
      <button aria-label="Previous question" disabled={busy || !qa.length} onClick={() => onJump(qa.length - 1)}><Icon n="back" /></button>
      <div className="mid"><b>{title || "Your writing"}</b><small>Question {qa.length + 1} · context {score}%</small></div>
      <Link href="/dashboard" aria-label="Save and close"><Icon n="close" /></Link>
    </div>
    <div className="segs">{qa.map((q, i) => <button key={i} className="seg done" disabled={busy} aria-label={`Go back to: ${q.q}`} onClick={() => onJump(i)}><i /></button>)}<button className="seg on" aria-label="Current question" disabled><i /></button></div>
  </div>;
}
