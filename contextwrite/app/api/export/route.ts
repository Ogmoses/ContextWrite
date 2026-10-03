import { NextResponse } from "next/server";
import { logError } from "@/lib/errors";
import { userClient } from "@/lib/supabase/server";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
const hits = new Map<string, number[]>();
// Turns **bold**, *italic* and [text](url) into Word runs.
function runs(line: string, base: any = {}) {
  return line.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/).filter(Boolean).map((t) => {
    let m;
    if ((m = t.match(/^\*\*([^*]+)\*\*$/))) return new TextRun({ ...base, text: m[1], bold: true });
    if ((m = t.match(/^\*([^*]+)\*$/))) return new TextRun({ ...base, text: m[1], italics: true });
    if ((m = t.match(/^\[([^\]]+)\]\(([^)]+)\)$/))) return new TextRun({ ...base, text: `${m[1]} (${m[2]})`, color: "0563C1", underline: {} });
    return new TextRun({ ...base, text: t });
  });
}
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
    const children: Paragraph[] = [];
    for (const blk of content.split(/\n{2,}/)) {
      const lines = blk.split("\n"), m = blk.match(/^(#{1,3})\s+(.*)$/s);
      if (m) children.push(new Paragraph({ heading: H[m[1].length], children: runs(m[2]) }));
      else if (lines.every((l) => /^[-*]\s+/.test(l))) lines.forEach((l) => children.push(new Paragraph({ bullet: { level: 0 }, children: runs(l.replace(/^[-*]\s+/, "")) })));
      else if (lines.every((l) => l.startsWith(">"))) children.push(new Paragraph({ indent: { left: 720 }, spacing: { after: 160 }, children: runs(lines.map((l) => l.replace(/^>\s?/, "")).join(" "), { italics: true }) }));
      else children.push(new Paragraph({ spacing: { after: 160, line: 320 }, children: lines.flatMap((l, i) => runs(l, i ? { break: 1 } : {})) }));
    }
    const buf = await Packer.toBuffer(new Document({ styles: { default: { document: { run: { font: "Georgia", size: 24 } } } }, sections: [{ children }] }));
    return new Response(new Uint8Array(buf), { headers: { "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "content-disposition": 'attachment; filename="draft.docx"' } });
  } catch (e) { console.error(e); logError("export", e); return NextResponse.json({ error: "Couldn't create the Word file. Try TXT or Markdown." }, { status: 500 }); }
}
