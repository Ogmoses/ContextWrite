import Link from "next/link";
import Logo from "@/components/Logo";
export default function Home() {
  return <>
    <div className="hd" style={{ margin: "8px -16px 0", paddingBottom: 40 }}><Logo /><h1>Write what you actually mean.</h1><p>ContextWrite learns the situation behind your writing first, then drafts from what you told it, so it sounds like you.</p>
      <p style={{ marginTop: 18 }}><Link href="/dashboard"><button className="primary" style={{ background: "var(--accent)", color: "#2a0a40", border: 0 }}>Start writing</button></Link> <a href="#how"><button style={{ background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,.5)" }}>See how it works</button></a></p></div>
    <ol className="steps" id="how"><li><b>Say what you're trying to say</b>Describe it the way you'd explain it to a friend.</li><li><b>Answer only what matters</b>It asks about the gaps that would change the writing.</li><li><b>Review, then draft</b>You check what it understood before a word is written.</li></ol>
  </>;
}
