import { NextResponse } from "next/server";
import { userClient } from "@/lib/supabase/server";
import { chat, getCfg } from "@/lib/ai";
import { WRITER } from "@/lib/prompts";
export async function POST(req: Request) {
  const sb = await userClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { projectId, instruction, selection, current, tone, voice } = await req.json();
  try {
    const { data: pc } = await sb.from("project_context").select("context_json, completeness_json").eq("project_id", projectId).single();
    if (!pc) return NextResponse.json({ error: "not found" }, { status: 404 });
    const u = `<user_data>\nCONTEXT:${JSON.stringify(pc)}\nTONE:${tone}\nVOICE_PRESERVATION:${voice}\n${current ? `CURRENT_DRAFT:\n${current}\nINSTRUCTION:${instruction}\n${selection ? `Change only this passage, return the full draft:\n${selection}` : "Return the full revised draft."}` : "Write the piece now."}\n</user_data>`;
    const content = await chat(await getCfg(user.id, "strong"), WRITER, u);
    const { data: last } = await sb.from("drafts").select("version_number").eq("project_id", projectId).order("version_number", { ascending: false }).limit(1);
    const version = (last?.[0]?.version_number || 0) + 1;
    await sb.from("drafts").insert({ project_id: projectId, version_number: version, name: instruction?.slice(0, 40) || "Draft", content });
    await sb.from("projects").update({ status: "draft" }).eq("id", projectId);
    return NextResponse.json({ content, version });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Something went wrong. Your project is saved. Try again." }, { status: 500 }); }
}
