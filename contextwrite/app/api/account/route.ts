import { NextResponse } from "next/server";
import { userClient, admin } from "@/lib/supabase/server";
async function listAll(a: any, prefix: string): Promise<string[]> {
  const { data } = await a.storage.from("documents").list(prefix, { limit: 1000 });
  let out: string[] = [];
  for (const f of data || []) { const p = prefix + "/" + f.name; if (f.id) out.push(p); else out = out.concat(await listAll(a, p)); }
  return out;
}
export async function DELETE(req: Request) {
  const { data: { user } } = await (await userClient()).auth.getUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { confirm } = await req.json().catch(() => ({}));
  if (confirm !== "DELETE") return NextResponse.json({ error: "Type DELETE to confirm." }, { status: 400 });
  const a = admin();
  try {
    await a.from("audit_log").insert({ actor_id: user.id, action: "account_deleted", target: user.id });
    const files = await listAll(a, user.id);
    if (files.length) await a.storage.from("documents").remove(files);
    const { error } = await a.auth.admin.deleteUser(user.id); // cascades to every table
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Couldn't delete the account. Nothing was lost. Try again." }, { status: 500 }); }
}
