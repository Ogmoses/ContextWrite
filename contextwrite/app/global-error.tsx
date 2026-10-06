"use client";
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return <html lang="en"><body style={{ font: "17px system-ui,sans-serif", padding: 24 }}><h2>Something went wrong</h2><p>Your work is saved. Please try again.</p><button onClick={reset} style={{ padding: "12px 20px", fontSize: 16 }}>Try again</button></body></html>;
}
