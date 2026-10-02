import { NextResponse } from "next/server";
import { userClient } from "@/lib/supabase/server";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
const hits = new Map<string, number[]>();
export async function POST(req: Request) {
  const { data: { user } } = await (await userClient()).auth.getUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  const now = Date.now(), h = (hits.get(user.id) || []).filter((t) => now - t < 60000);
  if (h.length >= 10) return NextResponse.json({ error: "Too many exports. Wait a minute and try again." }, { status: 429 });
  hits.set(user.id, [...h, now]);
  const { content } = await req.json();
  if (typeof content !== "string" || !content.trim() || content.length > 200000) return NextResponse.json({ error: "Nothing to export." }, { status: 400 });
  try {
    const H: any = { 1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_2, 3: HeadingLevel.HEADING_3 };
    const children = content.split(/\n{2,}/).map((blk: string) => {
      const m = blk.match(/^(#{1,3})\s+(.*)$/s);
      if (m) return new Paragraph({ heading: H[m[1].length], children: [new TextRun(m[2])] });
      return new Paragraph({ spacing: { after: 160, line: 320 }, children: blk.split("\n").map((l, i) => new TextRun({ text: l, break: i ? 1 : 0 })) });
    });
    const doc = new Document({ styles: { default: { document: { run: { font: "Georgia", size: 24 } } } }, sections: [{ children }] });
    const buf = await Packer.toBuffer(doc);
    return new Response(new Uint8Array(buf), { headers: { "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "content-disposition": 'attachment; filename="draft.docx"' } });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Couldn't create the Word file. Try TXT or Markdown." }, { status: 500 }); }
}
