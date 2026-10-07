import Link from "next/link";
import { BRAND } from "@/lib/brand";
export const metadata = { title: `Privacy · ${BRAND.name}` };
export default function Privacy() {
  return <article>
    <h1>Privacy</h1><p><small>Last updated 7 October 2026</small></p>
    <p>{BRAND.name} helps you write by first understanding the context behind what you want to say. This page explains, in plain language, what we keep, where it goes and what control you have.</p>
    <h2>What we store</h2>
    <ul>
      <li><b>Your account:</b> email address and name. Passwords are handled by our login provider and are never visible to us. If you sign in with Google, we receive your name and email from Google.</li>
      <li><b>Your writing:</b> project descriptions, your answers to our questions, summaries, writing plans, drafts and every saved version.</li>
      <li><b>Your voice profiles:</b> writing samples you paste in and the style profiles built from them.</li>
      <li><b>Uploaded files:</b> documents and images you add, and the text and key details extracted from them. Files are kept in private storage that only your account can open.</li>
      <li><b>Preferences:</b> saved context, language choice and your progress through the guided tour.</li>
      <li><b>Your AI connection:</b> which provider and model you chose. Your API key is encrypted before it is stored and cannot be read back by the browser.</li>
      <li><b>Feedback you send</b> through the feedback button.</li>
      <li><b>Technical records:</b> how many AI requests were made, which model, and token counts, plus the name of any page that crashed. These never include your writing.</li>
    </ul>
    <h2>Who can see it</h2>
    <p>Only you can open your projects, voice profiles and files. Our admin tools show totals and counts, never your writing. Admins can read the feedback messages you choose to send, and every admin visit is logged.</p>
    <h2>Your AI provider</h2>
    <p>{BRAND.name} has no built-in AI. When you generate or edit writing, the relevant parts of your project (your answers, drafts, voice profile and extracted document text) are sent to the AI provider you connected, using your own key. If you use research, the search is run by that provider. That provider's own terms and privacy policy apply to what it receives, including whether it may use data to improve its models, which is usually controlled in your account with them. We do not use your writing to train any model.</p>
    <h2>Where it is kept</h2>
    <p>Data is stored with our database and file-storage provider, Supabase, and the app is served by Vercel. Both act as processors for us.</p>
    <h2>Cookies and local storage</h2>
    <p>We use a sign-in cookie to keep you logged in, and your browser's local storage for your light or dark choice and tour progress. We do not use advertising cookies or third-party analytics.</p>
    <h2>Your control</h2>
    <ul>
      <li>Delete any project, voice profile or uploaded file, or remove your saved AI key, whenever you like.</li>
      <li><b>Export all my data</b> on the Account page downloads everything we hold about you in one file.</li>
      <li><b>Delete account</b> on the Account page permanently removes your account and everything in it, including uploaded files. This cannot be undone. Any backups kept by our providers expire on their own schedule.</li>
    </ul>
    <h2>Children</h2>
    <p>{BRAND.name} is not intended for children under 13.</p>
    <h2>Changes and contact</h2>
    <p>If this page changes in a way that matters, we will update the date above.{BRAND.contactEmail ? <> Questions? Email <a href={`mailto:${BRAND.contactEmail}`}>{BRAND.contactEmail}</a>.</> : <> Questions? Use the feedback button inside the app.</>}</p>
    <p><Link href="/terms">Read the Terms</Link></p>
  </article>;
}
