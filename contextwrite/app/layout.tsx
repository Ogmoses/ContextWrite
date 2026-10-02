export const metadata = { title: "ContextWrite" };
export default function L({ children }: { children: React.ReactNode }) {
  return <html lang="en" suppressHydrationWarning><body suppressHydrationWarning style={{ margin: 0, font: "17px/1.6 Georgia,serif", background: "#faf8f4", color: "#1d1b18" }}><main style={{ maxWidth: 720, margin: "0 auto", padding: "20px 18px 80px" }}>{children}</main></body></html>;
}
