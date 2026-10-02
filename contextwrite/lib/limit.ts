// Best-effort per-instance rate limiter (serverless instances don't share memory).
// For strict limits, back this with a shared store later.
const m = new Map<string, number[]>();
export function limited(key: string, max: number, ms = 60000) {
  const n = Date.now(), h = (m.get(key) || []).filter((t) => n - t < ms);
  if (h.length >= max) return true;
  m.set(key, [...h, n]);
  return false;
}
