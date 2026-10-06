// AI replies vary in shape. Normalise them so the interface can never crash on a missing list or odd type.
const arr = (x: any): any[] => (Array.isArray(x) ? x : x ? [x] : []);
const str = (x: any): string => (typeof x === "string" ? x : x == null ? "" : typeof x === "object" ? JSON.stringify(x) : String(x));
export function normEngine(r: any) {
  r = r && typeof r === "object" ? r : {};
  const c = r.context && typeof r.context === "object" ? r.context : {};
  const q = r.next_question && typeof r.next_question === "object" ? r.next_question : null;
  const type = q && ["single", "multi", "text"].includes(q.type) ? q.type : q?.type === "choice" ? "single" : "text";
  return {
    classification: r.classification && typeof r.classification === "object" ? r.classification : {},
    context: {
      summary_lines: arr(c.summary_lines).map((l: any) => ({ label: str(l?.label), value: str(l?.value) })).filter((l) => l.value),
      facts: arr(c.facts).map(str), inferences: arr(c.inferences).map(str), assumptions: arr(c.assumptions).map(str),
    },
    score: Math.max(0, Math.min(100, Number(r.score) || 0)),
    ready: !!r.ready,
    next_question: q && str(q.text).trim() ? { text: str(q.text), why: str(q.why), type, options: arr(q.options).map(str).filter(Boolean).slice(0, 8) } : null,
  };
}
