import type { Cfg } from "@/lib/ai";
export type Src = { title: string; url: string };
// Web search through the provider's own built-in search tool (no extra key).
export async function searchChat(c: Cfg, system: string, user: string): Promise<{ text: string; sources: Src[] }> {
  const H: any = { "content-type": "application/json" };
  let url: string, body: any;
  if (c.provider === "anthropic") {
    url = "https://api.anthropic.com/v1/messages"; H["x-api-key"] = c.key; H["anthropic-version"] = "2023-06-01";
    body = { model: c.model, max_tokens: 4096, system, messages: [{ role: "user", content: user }], tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }] };
  } else if (c.provider === "gemini") {
    url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(c.model)}:generateContent`; H["x-goog-api-key"] = c.key;
    body = { systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: user }] }], tools: [{ google_search: {} }] };
  } else if (c.provider === "openai") {
    url = "https://api.openai.com/v1/responses"; H.authorization = "Bearer " + c.key;
    body = { model: c.model, instructions: system, input: user, tools: [{ type: "web_search" }] };
  } else throw Object.assign(new Error("no search"), { code: "NO_SEARCH" });
  const r = await fetch(url, { method: "POST", headers: H, body: JSON.stringify(body) });
  if (!r.ok) { console.error("search provider error", r.status, (await r.text()).slice(0, 300)); throw new Error("provider"); }
  const d = await r.json(), src: Src[] = []; let text = "";
  if (c.provider === "anthropic") {
    for (const b of d.content || []) {
      if (b.type === "text") { text += b.text; for (const ci of b.citations || []) if (ci.url) src.push({ title: ci.title || ci.url, url: ci.url }); }
      else if (b.type === "web_search_tool_result" && Array.isArray(b.content)) for (const x of b.content) if (x.url) src.push({ title: x.title || x.url, url: x.url });
    }
  } else if (c.provider === "gemini") {
    const cand = d.candidates?.[0]; text = (cand?.content?.parts || []).map((p: any) => p.text || "").join("");
    for (const g of cand?.groundingMetadata?.groundingChunks || []) if (g.web?.uri) src.push({ title: g.web.title || g.web.uri, url: g.web.uri });
  } else {
    for (const o of d.output || []) if (o.type === "message") for (const ct of o.content || []) if (ct.type === "output_text") { text += ct.text; for (const a of ct.annotations || []) if (a.type === "url_citation" && a.url) src.push({ title: a.title || a.url, url: a.url }); }
  }
  const seen = new Set<string>();
  return { text, sources: src.filter((s) => /^https?:\/\//.test(s.url) && !seen.has(s.url) && seen.add(s.url)).slice(0, 12) };
}
