import { safeBase } from "@/lib/ai";
const latest = (l: string[], re: RegExp) => l.filter((x) => re.test(x)).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))[0];
export async function listModels(provider: string, key: string, base?: string | null) {
  let url: string, h: any = {};
  if (provider === "anthropic") { url = "https://api.anthropic.com/v1/models?limit=100"; h = { "x-api-key": key, "anthropic-version": "2023-06-01" }; }
  else if (provider === "gemini") { url = "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000"; h = { "x-goog-api-key": key }; }
  else { url = (provider === "openai" ? "https://api.openai.com/v1" : safeBase(base!)) + "/models"; h = { authorization: "Bearer " + key }; }
  const r = await fetch(url, { headers: h });
  if (!r.ok) throw Object.assign(new Error("rejected"), { status: r.status });
  const d = await r.json();
  let ids: string[];
  if (provider === "gemini") ids = (d.models || []).filter((m: any) => m.supportedGenerationMethods?.includes("generateContent")).map((m: any) => String(m.name).replace("models/", "")).filter((x: string) => !/tts|image|embed|computer|live|audio|robot|aqa|imagen|veo|gemma/i.test(x));
  else if (provider === "openai") ids = (d.data || []).map((m: any) => m.id).filter((x: string) => /^(gpt|o\d|chatgpt)/.test(x) && !/embed|whisper|tts|audio|realtime|transcribe|image|moderation|search|codex|instruct/i.test(x));
  else ids = (d.data || []).map((m: any) => m.id);
  ids = [...new Set(ids)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  if (provider === "gemini" && !ids.includes("gemini-flash-lite-latest")) ids.unshift("gemini-flash-lite-latest");
  const pick = (res: RegExp[]) => { for (const re of res) { const x = latest(ids, re); if (x) return x; } };
  const P: any = { anthropic: [[/sonnet/], [/haiku/]], gemini: [[/^gemini-flash-lite-latest$/, /flash-lite(?!.*(preview|exp))/, /flash(?!.*(preview|exp))/], [/^gemini-flash-lite-latest$/, /flash-lite/, /flash/]], openai: [[/^gpt-[\d.]+$/], [/mini/]] };
  const [m, f] = P[provider] || [[/./], [/./]];
  const main = pick(m) || ids[ids.length - 1] || "";
  return { models: ids, recommended: { main, fast: pick(f) || main } };
}
