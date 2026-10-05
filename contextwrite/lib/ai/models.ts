import { safeBase } from "@/lib/ai";
type M = { id: string; free: boolean; vision: boolean; ts: number };
// Things that aren't for writing: images, audio, video, embeddings, moderation, search, etc.
const BAD = /embed|tts|audio|speech|whisper|image|imagen|veo|video|moderation|transcribe|realtime|live|robot|aqa|computer|rerank|guard|search|codex|instruct|davinci|babbage|dall|lyria|sora|deep-research|learnlm|gemma/i;
const FRESH = 540 * 86400; // models older than ~18 months count as outdated
const latest = (l: string[], re: RegExp) => l.filter((x) => re.test(x)).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))[0];
export async function listModels(provider: string, key: string, base?: string | null) {
  let url: string, h: any = {};
  if (provider === "anthropic") { url = "https://api.anthropic.com/v1/models?limit=100"; h = { "x-api-key": key, "anthropic-version": "2023-06-01" }; }
  else if (provider === "gemini") { url = "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000"; h = { "x-goog-api-key": key }; }
  else { url = (provider === "openai" ? "https://api.openai.com/v1" : safeBase(base!)) + "/models"; h = { authorization: "Bearer " + key }; }
  const r = await fetch(url, { headers: h });
  if (!r.ok) throw Object.assign(new Error("rejected"), { status: r.status });
  const d = await r.json(), now = Date.now() / 1000;
  let ms: M[] = [];
  if (provider === "gemini") ms = (d.models || []).filter((m: any) => m.supportedGenerationMethods?.includes("generateContent")).map((m: any) => { const id = String(m.name).replace("models/", ""); return { id, free: /flash/i.test(id), vision: true, ts: now }; }).filter((m: M) => !/gemini-(1\.|pro$|ultra|exp)|-exp|preview-\d\d-\d\d|-0\d{2}$/i.test(m.id));
  else if (provider === "anthropic") ms = (d.data || []).map((m: any) => ({ id: m.id, free: false, vision: true, ts: Date.parse(m.created_at) / 1000 || now }));
  else if (provider === "openai") ms = (d.data || []).filter((m: any) => /^(gpt|o\d|chatgpt)/.test(m.id)).map((m: any) => ({ id: m.id, free: false, vision: /^(gpt-4o|gpt-4\.1|gpt-5|o\d|chatgpt-4o)/.test(m.id), ts: m.created || now })).filter((m: M) => !/gpt-3\.5|gpt-4(-\d{4}|-turbo|-32k|-vision|$)/.test(m.id));
  else ms = (d.data || []).filter((m: any) => (m.architecture?.output_modalities || ["text"]).every((x: string) => x === "text")).map((m: any) => ({ id: m.id, free: (m.pricing && Number(m.pricing.prompt) === 0 && Number(m.pricing.completion) === 0) || /:free$/.test(m.id), vision: (m.architecture?.input_modalities || []).includes("image"), ts: m.created || now }));
  ms = ms.filter((m) => !BAD.test(m.id) && now - m.ts < FRESH);
  if (provider === "gemini" && !ms.some((m) => m.id === "gemini-flash-lite-latest")) ms.unshift({ id: "gemini-flash-lite-latest", free: true, vision: true, ts: now });
  ms.sort((a, b) => Number(b.free) - Number(a.free) || b.ts - a.ts || a.id.localeCompare(b.id));
  const ids = ms.map((m) => m.id), meta = Object.fromEntries(ms.map((m) => [m.id, { free: m.free, vision: m.vision }]));
  const first = (res: RegExp[], pool: M[]) => { for (const re of res) { const x = latest(pool.map((m) => m.id), re); if (x) return x; } };
  let main: string | undefined;
  if (provider === "gemini") main = first([/^gemini-flash-lite-latest$/, /flash-lite/, /flash/], ms.filter((m) => m.free));
  else if (provider === "anthropic") main = first([/haiku/, /sonnet/], ms);
  else if (provider === "openai") main = first([/mini|nano/], ms);
  else main = [...ms.filter((m) => m.free)].sort((a, b) => b.ts - a.ts)[0]?.id;
  main = main || ids[0] || "";
  const vision = meta[main]?.vision ? main : (ms.find((m) => m.vision && m.free) || ms.find((m) => m.vision))?.id || main;
  return { models: ids, meta, recommended: { main, fast: main, vision } };
}
