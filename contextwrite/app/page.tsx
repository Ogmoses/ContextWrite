import Link from "next/link";
export default function Home() {
  return (
    <div className="hero">
      <h1>Write what you actually mean.</h1>
      <p className="lead">ContextWrite learns the situation behind your writing first, then drafts from what you told it, so the result sounds like you and not like a template.</p>
      <p><Link href="/write"><button className="primary">Start writing</button></Link> <a href="#how"><button>See how it works</button></a></p>
      <ol className="steps" id="how">
        <li><b>Say what you're trying to say</b>Describe it the way you'd explain it to a friend. No structure needed.</li>
        <li><b>Answer only what matters</b>It asks about the gaps that would change the writing, and skips the rest.</li>
        <li><b>Review, then draft</b>You check what it understood and correct it before a single word is written.</li>
      </ol>
    </div>
  );
}
