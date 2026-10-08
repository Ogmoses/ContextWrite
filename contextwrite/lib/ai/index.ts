import { admin } from "@/lib/supabase/server";
import { dec } from "@/lib/crypto";
import { usageFor } from "@/lib/limits";
export type Cfg = { provider: string; base: string | null; model: string; key: string; usageId?: string };
export function safeBase(u: string) {
  const x = new URL(u);
  if (x.protocol !== "https:" || /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[)/i.test(x.hostname) || x.hostname.endsWith(".internal")) throw new Error("bad base url");
  return x.origin + x.pathname.replace(/\/$/, "");
}
export async function getCfg(userId: string, tier: "fast" | "strong" | "vision"): Promise<Cfg> {
  const { data } = await admin().from("user_ai_settings").select("*").eq("user_id", userId).single();
  if (!data) throw Object.assign(new Error("no ai settings"), { code: "NO_AI" });
  const u0 = await usageFor(userId);
  if (u0.limit > 0 && u0.used >= u0.limit) throw Object.assign(new Error("limit"), { code: "LIMIT", limit: u0.limit });
  const usage: string | undefined = await admin().from("ai_usage").insert({ user_id: userId, request_type: tier, model: tier === "vision" ? data.model_vision : tier === "fast" ? data.model_fast : data.model_strong }).select("id").single().then((r) => r.data?.id as string | undefined, () => undefined);
  if (tier === "vision" && !data.model_vision) throw Object.assign(new Error("no vision"), { code: "NO_VISION" });
  return { provider: data.provider, base: data.base_url, model: tier === "vision" ? data.model_vision : tier === "fast" ? data.model_fast : data.model_strong, key: dec(data.encrypted_key), usageId: usage };
}
export async function chat(c: Cfg, system: string, user: string, json = false, img?: { mime: string; b64: string }): Promise<string> {
  let url: string, headers: any = { "content-type": "application/json" }, body: any;
  if (c.provider === "anthropic") {
    url = "https://api.anthropic.com/v1/messages"; headers["x-api-key"] = c.key; headers["anthropic-version"] = "2023-06-01";
    body = { model: c.model, max_tokens: 4096, system, messages: [{ role: "user", content: img ? [{ type: img.mime === "application/pdf" ? "document" : "image", source: { type: "base64", media_type: img.mime, data: img.b64 } }, { type: "text", text: user }] : user }] };
  } else if (c.provider === "gemini") {
    url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(c.model)}:generateContent`; headers["x-goog-api-key"] = c.key;
    body = { systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: user }, ...(img ? [{ inlineData: { mimeType: img.mime, data: img.b64 } }] : [])] }], generationConfig: json ? { responseMimeType: "application/json" } : {} };
  } else {
    const base = c.provider === "openai" ? "https://api.openai.com/v1" : safeBase(c.base!);
    url = base + "/chat/completions"; headers.authorization = "Bearer " + c.key;
    body = { model: c.model, messages: [{ role: "system", content: system }, { role: "user", content: img ? [{ type: "text", text: user }, (img.mime === "application/pdf" ? { type: "file", file: { filename: "document.pdf", file_data: `data:application/pdf;base64,${img.b64}` } } : { type: "image_url", image_url: { url: `data:${img.mime};base64,${img.b64}` } })] : user }], ...(json && c.provider === "openai" ? { response_format: { type: "json_object" } } : {}) };
  }
  const r = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!r.ok) { console.error("AI provider error", r.status, (await r.text()).slice(0, 300)); throw Object.assign(new Error("provider"), { status: r.status }); }
  const d = await r.json();
  const u = c.provider === "anthropic" ? [d.usage?.input_tokens, d.usage?.output_tokens] : c.provider === "gemini" ? [d.usageMetadata?.promptTokenCount, d.usageMetadata?.candidatesTokenCount] : [d.usage?.prompt_tokens, d.usage?.completion_tokens];
  if (c.usageId) admin().from("ai_usage").update({ input_tokens: u[0] ?? null, output_tokens: u[1] ?? null }).eq("id", c.usageId).then(() => {}, () => {});
  return c.provider === "anthropic" ? d.content.map((x: any) => x.text || "").join("") : c.provider === "gemini" ? d.candidates[0].content.parts.map((x: any) => x.text || "").join("") : d.choices[0].message.content;
}
export const parseJson = (t: string) => JSON.parse(t.replace(/^```(json)?|```$/gim, "").trim());
