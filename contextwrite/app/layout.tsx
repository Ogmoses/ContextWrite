import "./globals.css";
import { Newsreader, Hanken_Grotesk } from "next/font/google";
import Shell from "@/components/Shell";
import { BRAND } from "@/lib/brand";
const serif = Newsreader({ subsets: ["latin"], variable: "--serif", style: ["normal", "italic"] });
const sans = Hanken_Grotesk({ subsets: ["latin"], variable: "--sans" });
export const metadata = { title: BRAND.name, description: "Writing built around what you actually mean." };
export default function L({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`} style={{ "--brand": BRAND.primary, "--accent": BRAND.accent } as React.CSSProperties} suppressHydrationWarning>
      <body suppressHydrationWarning><Shell>{children}</Shell></body>
    </html>
  );
}
