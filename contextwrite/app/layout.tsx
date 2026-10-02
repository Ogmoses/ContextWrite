import "./globals.css";
import Link from "next/link";
import { Newsreader, Hanken_Grotesk } from "next/font/google";
const serif = Newsreader({ subsets: ["latin"], variable: "--serif", style: ["normal", "italic"] });
const sans = Hanken_Grotesk({ subsets: ["latin"], variable: "--sans" });
export const metadata = { title: "ContextWrite", description: "Writing built around what you actually mean." };
export default function L({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <header className="top"><Link className="brand" href="/">ContextWrite</Link><nav aria-label="Main"><Link href="/dashboard">Projects</Link><Link href="/voice">Your voice</Link><Link href="/settings">AI settings</Link></nav></header>
        <main>{children}</main>
      </body>
    </html>
  );
}
