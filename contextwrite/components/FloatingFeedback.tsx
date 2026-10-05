"use client";
import { useEffect, useState } from "react";
import Icon from "./Icon";
import Feedback from "./Feedback";
export default function FloatingFeedback() {
  const [m, setM] = useState(0);
  useEffect(() => { if (m !== 1) return; const t = setTimeout(() => setM(0), 4500); return () => clearTimeout(t); }, [m]);
  return <>
    <button className={"ffb" + (m ? " open" : "")} aria-label="Share feedback" onClick={() => setM(m === 0 ? 1 : 2)}><Icon n="message" size={20} /><span>Share feedback</span></button>
    {m === 2 && <div className="fmodal" role="dialog" aria-label="Feedback" onClick={(e) => e.target === e.currentTarget && setM(0)}><div className="fcardm">
      <div className="fhead"><b>Share feedback</b><button className="sm" onClick={() => setM(0)} aria-label="Close"><Icon n="close" size={16} /></button></div>
      <Feedback onDone={() => setTimeout(() => setM(0), 1500)} /></div></div>}
  </>;
}
