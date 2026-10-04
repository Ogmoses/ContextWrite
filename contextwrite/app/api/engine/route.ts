import { NextResponse } from "next/server";
import { logError } from "@/lib/errors";
import { friendly } from "@/lib/ai/errors";
export const maxDuration = 60;
import { limited } from "@/lib/limit";
import { userClient } from "@/lib/supabase/server";
import { chat, getCfg, parseJson } from "@/lib/ai";
import { ENGINE } from "@/lib/prompts";
export async function POST(req: Request) {
  const sb = await userClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  if (limited("engine:" + user.id, 20)) return NextResponse.json({ error: "Too many requests. Wait a minute and try again." }, { status: 429 });
  const { projectId, description, qa = [] } = await req.json();
  if (typeof description !== "string" || description.length > 5000 || !Array.isArray(qa) || qa.length > 60 || qa.some((x: any) => typeof x?.q !== "string" || typeof x?.a !== "string" || x.a.length > 6000)) return NextResponse.json({ error: "That input is too long or invalid." }, { status: 400 });
  try {
    const cfg = await getCfg(user.id, "strong");
    let docs: any[] = [];
    if (projectId) { const { data } = await sb.from("documents").select("filename,metadata").eq("project_id", projectId); docs = (data || []).map((d: any) => ({ filename: d.filename, extracted: d.metadata?.analysis })); }
    const call = async () => parseJson(await chat(cfg, ENGINE, `<user_data>\n${JSON.stringify({ description, qa })}\n</user_data>\n<untrusted_documents>\n${JSON.stringify(docs)}\n</untrusted_documents>`, true));
    let r: any; try { r = await call(); } catch (e: any) { if (e?.message === "provider") throw e; r = await call(); }
    let id = projectId;
    if (!id) { const { data, error } = await sb.from("projects").insert({ user_id: user.id, initial_description: description, title: description.slice(0, 60), writing_type: r.classification?.artifact }).select("id").single(); if (error) throw error; id = data.id; }
    await sb.from("project_context").upsert({ project_id: id, context_json: r.context, strategy_json: null, completeness_json: { score: r.score, classification: r.classification } }, { onConflict: "project_id" });
    await sb.from("context_answers").delete().eq("project_id", id);
    if (qa.length) await sb.from("context_answers").insert(qa.map((x: any) => ({ project_id: id, question_text: x.q, answer: x.a, source: x.a.startsWith("(skipped") ? "skipped" : "user" })));
    return NextResponse.json({ projectId: id, result: r });
  } catch (e: any) { console.error(e); logError("engine", e); return NextResponse.json({ error: e.code === "NO_AI" ? "NO_AI" : friendly(e) || "Something went wrong. Your project is saved. Try again." }, { status: e.code === "NO_AI" ? 400 : 500 }); }
}
