import Link from "next/link";
export default function Home() {
  return <><h1>Write what you actually mean.</h1><p>ContextWrite learns the context behind your writing first, then drafts from it, so it sounds like you.</p>
  <p><Link href="/dashboard">Dashboard</Link> · <Link href="/write">Start Writing</Link> · <Link href="/settings">AI settings</Link></p>
  <ol><li>Tell us what you're trying to say.</li><li>Answer only the questions that matter.</li><li>Review what we understand, then generate and refine.</li></ol></>;
}
