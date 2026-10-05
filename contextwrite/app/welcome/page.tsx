"use client";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import Icon from "@/components/Icon";
const SL = [
  { ic: "pen", t: "Welcome to ContextWrite", d: "Writing that starts with understanding you. Before you can write, there's one quick setup: connecting an AI account. This short intro explains it." },
  { ic: "lock", t: "Why you need to connect an AI", d: "ContextWrite doesn't come with its own AI. You bring your own account, so you control the cost and your privacy. Your key is encrypted and only used to write for you." },
  { ic: "sliders", t: "How it works", d: "Three quick steps, about a minute in total.", steps: ["Pick an AI service, such as Google Gemini", "Paste your API key", "Confirm the model. We pick a good one for you"] },
  { ic: "check", t: "What's an API key?", d: "Think of it as a password that lets ContextWrite talk to your AI account on your behalf. You create it on the provider's website (we link you there) and paste it once." },
  { ic: "wave", t: "The easiest way to start", d: "Google Gemini has a free tier and takes about a minute: open Google AI Studio, tap Create API key, copy it. Then paste it on the next page." },
];
export default function Welcome() {
  const [i, setI] = useState(0), [dir, setDir] = useState("fwd");
  useEffect(() => { try { const l = JSON.parse(localStorage.getItem("cw-onb") || "null"); if (l && l.w > 0 && l.w < SL.length) setI(l.w); } catch {} }, []);
  const save = (w: number) => dispatchEvent(new CustomEvent("cw-onb-set", { detail: { w } }));
  const go = (n: number) => { setDir(n > i ? "fwd" : "back"); setI(n); save(n); };
  const finish = () => { save(-1); setTimeout(() => { location.href = "/settings?first=1"; }, 150); };
  const s = SL[i], last = i === SL.length - 1;
  return <div className="wl">
    <div className="wltop"><Logo size={36} /><button className="wskip" onClick={finish}>Skip intro</button></div>
    <div className="wbody" key={i} data-dir={dir}>
      <span className="wic"><Icon n={s.ic} size={26} /></span>
      <h1>{s.t}</h1><p>{s.d}</p>
      {s.steps && <ol className="wsteps">{s.steps.map((x, k) => <li key={k}><b>{k + 1}</b>{x}</li>)}</ol>}
    </div>
    <div className="wnav">
      <div className="wdots" aria-label={`Slide ${i + 1} of ${SL.length}`}>{SL.map((_, k) => <i key={k} className={k === i ? "on" : ""} />)}</div>
      <div>{i > 0 && <button className="wb" onClick={() => go(i - 1)}>Back</button>}<button className="wb main" onClick={() => (last ? finish() : go(i + 1))}>{last ? "Connect my AI" : "Next"}</button></div>
    </div>
  </div>;
}
