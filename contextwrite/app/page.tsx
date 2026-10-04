import Link from "next/link";
import Logo from "@/components/Logo";
import Icon from "@/components/Icon";
import { BRAND } from "@/lib/brand";

const WHY = [
  ["search", "It understands first", "Asks about your situation, audience, tone and purpose before a single word is written."],
  ["wave", "It sounds like you", "Learns your habits from your own writing, and keeps your spelling and local English."],
  ["check", "It never makes things up", "Gaps become placeholders. Personal details, quotes and statistics are never invented."],
  ["lock", "It stays yours", "Your own AI account, encrypted key, private projects. Export or delete everything, any time."],
];
const FAQ = [
  ["Do I need an AI account?", "Yes. ContextWrite connects to your own account with Google Gemini, Claude, OpenAI or a compatible service, so you control the cost and the privacy. Setup takes about a minute, and some providers have free tiers."],
  ["Is my writing private?", "Your projects are visible only to you. Your AI key is encrypted on the server and never shown again. You can export all your data or delete your account whenever you like."],
  ["Will it invent personal details?", "No. If a detail is missing, it asks you or leaves a clear placeholder. A built-in check also flags claims in the draft that came from nowhere in your context."],
  ["What can I write with it?", "Essays, letters, cover letters, speeches, emails, personal statements, reflective pieces and more. If you don't know what you want to write yet, you can just dump your thoughts and it will help you shape them."],
  ["Can it use my own writing style?", "Yes. Paste things you've written and it builds a private voice profile. You can merge several profiles into one that keeps the patterns they share."],
  ["Does it work on my phone?", "It's designed for phones first, with a full-page editor for longer pieces and a floating menu that stays out of the way."],
];
export default function Home() {
  return <div className="ld">
    <nav className="ldnav" aria-label="Main"><div className="w2 navin">
      <Link href="/" className="brand"><Logo size={32} />{BRAND.name}</Link>
      <div className="navlinks"><a href="#how">How it works</a><a href="#features">Features</a><a href="#why">Why choose us</a><a href="#faq">FAQ</a></div>
      <Link href="/login" className="navlogin">Log in</Link><Link href="/login"><button className="primary sm">Start writing</button></Link>
    </div></nav>

    <header className="w2 hero2">
      <div>
        <span className="eyebrow">Context first. Writing second.</span>
        <h1>Write what you actually mean.</h1>
        <p className="lead2">Most AI writers start by guessing. ContextWrite starts by understanding: who it's for, what happened, how you want it to feel. Then it writes, in a voice that sounds like you and not like a template.</p>
        <p><Link href="/login"><button className="primary">Start writing</button></Link><a href="#how"><button>See how it works</button></a></p>
        <small>Works with your own AI account. Your writing stays private.</small>
      </div>
      <div className="mock" aria-hidden="true">
        <div className="msegs"><i className="d" /><i className="d" /><i className="d" /><i className="o" /><i /><i /></div>
        <small>Question 4 · context 62%</small>
        <p className="mq">What tone and mood do you want?</p>
        <div className="mchips"><span>Optimistic</span><span className="on">Uplifting</span><span>Dramatic</span><span>Intriguing</span><span>Reflective</span></div>
        <div className="mnote"><b>Here's what I understand</b><br />An essay for young readers about why habit streaks fail. Uplifting, about 500 words, personal example included.</div>
      </div>
    </header>

    <section className="strip"><div className="w2 stripin"><span>Asks before it writes</span><span>Never invents personal details</span><span>Private by design</span></div></section>

    <section id="how" className="w2 sect"><h2>How it works</h2><p className="sub">Four steps from a rough idea to writing that's yours.</p>
      <ol className="how">
        <li><b>1</b><div><h3>Say what you're trying to write</h3><p>Describe it the way you'd explain it to a friend, or just dump your thoughts and let it make sense of them.</p></div></li>
        <li><b>2</b><div><h3>Answer only what matters</h3><p>It asks about the gaps that would change the writing, with tappable suggestions. Skip anything you like.</p></div></li>
        <li><b>3</b><div><h3>Check what it understood</h3><p>You see a plain summary of your situation, tone and purpose and correct it before anything is written.</p></div></li>
        <li><b>4</b><div><h3>Get a draft that sounds like you</h3><p>Edit in a full-page editor, refine any passage, then save, share or export to Word or PDF.</p></div></li>
      </ol></section>

    <section id="features" className="w2 sect"><h2>What sets it apart</h2><p className="sub">Built around one idea: good writing starts with real context.</p>
      <div className="fgrid">
        <article className="fcard big"><h3>It asks the right questions, and only those</h3><p>Audience, purpose, length, tone and mood, and the personal details only you know. Each question comes with suggestions you can tap, and a progress bar lets you step back at any point.</p><div className="mchips"><span>Teenagers</span><span className="on">Young professionals</span><span>General readers</span><span>Something else…</span></div></article>
        <article className="fcard"><h3>Your voice, learned from your writing</h3><p>Paste samples and get a private voice profile covering sentence style, tone and paragraph habits. Merge several into one.</p></article>
        <article className="fcard"><h3>Honest by design</h3><p>Facts you gave, inferences and assumptions are kept apart. A check flags unsupported claims and generic phrases in the draft.</p></article>
        <article className="fcard"><h3>Bring your material</h3><p>Upload an assignment brief, an email to reply to, or a photo of a letter. It pulls out the requirements and uses them.</p></article>
        <article className="fcard"><h3>Research with sources</h3><p>For factual pieces, search the web from inside the app and review exactly what was found, with links.</p></article>
      </div></section>

    <section className="w2 sect"><h2>The difference, side by side</h2>
      <div className="tscroll"><table className="cmp"><thead><tr><th></th><th>A plain prompt box</th><th>{BRAND.name}</th></tr></thead><tbody>
        <tr><th>Starts by</th><td>Generating from one sentence</td><td>Asking what actually matters</td></tr>
        <tr><th>Your situation</th><td>Guessed</td><td>Collected, then shown back for you to correct</td></tr>
        <tr><th>Your voice</th><td>One style for everyone</td><td>Learned from your own writing</td></tr>
        <tr><th>Personal details</th><td>Often invented</td><td>Never invented, gaps become placeholders</td></tr>
        <tr><th>After the draft</th><td>You're on your own</td><td>Checks claims, requirements and generic phrases</td></tr>
      </tbody></table></div></section>

    <section id="why" className="w2 sect"><h2>Why choose {BRAND.name}</h2><p className="sub">The things that make the writing feel like yours.</p>
      <div className="wgrid">{WHY.map(([i, t, d]) => <div key={t} className="wi"><span className="wic"><Icon n={i} /></span><h3>{t}</h3><p>{d}</p></div>)}</div></section>

    <section className="w2 sect"><h2>Made for the writing that matters</h2>
      <div className="uses">{["Essays", "Cover letters", "Personal statements", "Speeches", "Apology letters", "Complaint letters", "Professional emails", "Reflective pieces", "Blog posts"].map((u) => <span key={u}>{u}</span>)}</div></section>

    <section id="faq" className="w2 sect faq"><div><h2>Questions, answered</h2><p className="sub">Short answers to what people ask first.</p></div>
      <div>{FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section>

    <section className="w2 ctaw"><div className="cta"><h2>Start with what you mean.</h2><p>Tell it what you're trying to write. You don't need to have it figured out yet.</p><Link href="/login"><button>Start writing</button></Link></div></section>

    <footer className="w2 foot2"><span>© {new Date().getFullYear()} {BRAND.name}</span><span><Link href="/login">Log in</Link> · <Link href="/login">Create an account</Link></span></footer>
  </div>;
}
