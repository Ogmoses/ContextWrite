import Link from "next/link";
import Icon from "@/components/Icon";
export default function QBar({ qa, score, title, busy, view = null, onJump }: { qa: any[]; score: number; title: string; busy: boolean; view?: number | null; onJump: (i: number) => void }) {
  return <div className="qbar">
    <div className="qh">
      <button aria-label="Previous question" disabled={busy || !qa.length || view === 0} onClick={() => onJump(view === null ? qa.length - 1 : view - 1)}><Icon n="back" /></button>
      <div className="mid"><b>{title || "Your writing"}</b><small>{view === null ? `Question ${qa.length + 1} · context ${score}%` : `Reviewing question ${view + 1} of ${qa.length}`}</small></div>
      <Link href="/dashboard" aria-label="Save and close"><Icon n="close" /></Link>
    </div>
    <div className="segs">{qa.map((q, i) => <button key={i} className={"seg done" + (view === i ? " cur" : "")} disabled={busy} aria-label={`View question ${i + 1}: ${q.q}`} onClick={() => onJump(i)}><i /></button>)}<button className="seg on" aria-label="Back to the current question" disabled={view === null} onClick={() => onJump(-1)}><i /></button></div>
  </div>;
}
